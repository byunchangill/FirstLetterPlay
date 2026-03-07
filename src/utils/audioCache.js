// =====================================================
// audioCache.js - Web Audio API 기반 오디오 캐시
// 모바일: unlock 전 → raw ArrayBuffer 보관, unlock 후 → 일괄 디코딩
// PC: AudioContext가 바로 running이므로 즉시 디코딩
// =====================================================

// --- 캐시 저장소 ---
const bufferCache = new Map()  // src → AudioBuffer (디코딩 완료, 즉시 재생 가능)
const rawCache = new Map()     // src → ArrayBuffer (unlock 전 임시 보관)
const pendingMap = new Map()   // src → Promise (진행 중인 fetch)

// --- AudioContext ---
let audioCtx = null
let unlocked = false
let currentSource = null

function getContext() {
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)()
    } catch (e) {}
  }
  return audioCtx
}

// --- 동시 fetch 큐 ---
const MAX_CONCURRENT = 4
let activeCount = 0
const queue = []

function processQueue() {
  while (activeCount < MAX_CONCURRENT && queue.length > 0) {
    const job = queue.shift()
    activeCount++
    doFetch(job.src).finally(() => {
      activeCount--
      job.resolve()
      processQueue()
    })
  }
}

function doFetch(src) {
  return fetch(src)
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return res.arrayBuffer()
    })
    .then(arrayBuf => {
      const ctx = getContext()
      if (unlocked && ctx) {
        // unlock 완료 상태 → 즉시 디코딩
        return ctx.decodeAudioData(arrayBuf).then(audioBuffer => {
          bufferCache.set(src, audioBuffer)
        })
      } else {
        // unlock 전 → raw 데이터 보관 (나중에 디코딩)
        rawCache.set(src, arrayBuf)
      }
    })
    .catch(() => {})
    .finally(() => {
      pendingMap.delete(src)
    })
}

// --- 모바일 오디오 잠금 해제 ---
export function unlockAudio() {
  if (unlocked) return
  unlocked = true

  const ctx = getContext()
  if (!ctx) return

  // AudioContext 활성화
  if (ctx.state === 'suspended') {
    ctx.resume()
  }

  // 보관해둔 raw ArrayBuffer들을 일괄 디코딩
  for (const [src, arrayBuf] of rawCache) {
    ctx.decodeAudioData(arrayBuf).then(audioBuffer => {
      bufferCache.set(src, audioBuffer)
    }).catch(() => {})
  }
  rawCache.clear()
}

// 앱 시작 시 첫 터치/클릭에 잠금 해제
if (typeof document !== 'undefined') {
  const handler = () => {
    unlockAudio()
    document.removeEventListener('touchstart', handler, true)
    document.removeEventListener('click', handler, true)
  }
  document.addEventListener('touchstart', handler, { capture: true, passive: true })
  document.addEventListener('click', handler, { capture: true, passive: true })
}

// --- 프리로드 함수들 ---

export function preloadAudio(src, priority = false) {
  if (!src) return Promise.resolve()
  if (bufferCache.has(src) || rawCache.has(src)) return Promise.resolve()
  if (pendingMap.has(src)) return pendingMap.get(src)

  const promise = new Promise((resolve) => {
    if (priority) {
      queue.unshift({ src, resolve })
    } else {
      queue.push({ src, resolve })
    }
    processQueue()
  })

  pendingMap.set(src, promise)
  return promise
}

export function preloadWithPriority(prioritySrcs, restSrcs = []) {
  prioritySrcs.filter(Boolean).forEach(src => preloadAudio(src, true))
  restSrcs.filter(Boolean).forEach(src => preloadAudio(src, false))
}

export function preloadAudioList(srcs) {
  srcs.filter(Boolean).forEach(src => preloadAudio(src, false))
}

// --- 현재 재생 중지 ---
export function stopCurrentAudio() {
  if (currentSource) {
    try { currentSource.stop() } catch (e) {}
    currentSource = null
  }
}

// --- 재생 함수 ---

export function playAudio(src, onStart, onEnd, onError) {
  if (!src) return Promise.resolve()

  // 재생 시점에 context가 suspended면 resume (버튼 클릭 = 유저 제스처)
  const ctx = getContext()
  if (ctx && ctx.state === 'suspended') {
    ctx.resume()
  }

  // rawCache에 있지만 아직 디코딩 안 된 경우 → 즉석 디코딩
  if (!bufferCache.has(src) && rawCache.has(src) && ctx) {
    const raw = rawCache.get(src)
    rawCache.delete(src)
    return ctx.decodeAudioData(raw)
      .then(audioBuffer => {
        bufferCache.set(src, audioBuffer)
        return playBuffer(audioBuffer, onStart, onEnd, onError)
      })
      .catch(() => {
        if (onError) onError()
      })
  }

  const buffer = bufferCache.get(src)
  if (buffer) {
    return playBuffer(buffer, onStart, onEnd, onError)
  }

  // 아직 fetch도 안 됐으면 기다린 후 재생
  return (async () => {
    if (pendingMap.has(src)) {
      const idx = queue.findIndex(j => j.src === src)
      if (idx > 0) {
        const [job] = queue.splice(idx, 1)
        queue.unshift(job)
      }
      await pendingMap.get(src)
    } else {
      await preloadAudio(src, true)
    }

    // fetch 완료 후 rawCache에 있으면 디코딩
    if (!bufferCache.has(src) && rawCache.has(src) && ctx) {
      const raw = rawCache.get(src)
      rawCache.delete(src)
      try {
        const audioBuffer = await ctx.decodeAudioData(raw)
        bufferCache.set(src, audioBuffer)
      } catch (e) {}
    }

    const buf = bufferCache.get(src)
    if (buf) return playBuffer(buf, onStart, onEnd, onError)
    if (onError) onError()
  })()
}

function playBuffer(buffer, onStart, onEnd, onError) {
  return new Promise((resolve) => {
    const ctx = getContext()
    if (!ctx) {
      if (onError) onError()
      resolve()
      return
    }

    // 이전 재생 중지
    stopCurrentAudio()

    const source = ctx.createBufferSource()
    source.buffer = buffer
    source.connect(ctx.destination)
    currentSource = source

    source.onended = () => {
      if (currentSource === source) currentSource = null
      if (onEnd) onEnd()
      resolve()
    }

    if (onStart) onStart()

    try {
      source.start(0)
    } catch (e) {
      if (onError) onError()
      resolve()
    }
  })
}

// 하위 호환
export function getCachedAudio() {
  return null
}
