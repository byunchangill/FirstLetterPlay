// =====================================================
// audioCache.js - Web Audio API 기반 오디오 캐시
//
// 핵심 원칙:
// 1. AudioContext는 유저 제스처 안에서만 생성 (PWA 호환)
// 2. 제스처 전 fetch → raw ArrayBuffer 보관
// 3. 제스처 후 → 디코딩, 디코딩 Promise 추적 (레이스 컨디션 방지)
// =====================================================

const bufferCache = new Map()  // src → AudioBuffer (디코딩 완료)
const rawCache = new Map()     // src → ArrayBuffer (디코딩 대기)
const decodeMap = new Map()    // src → Promise (디코딩 진행 중 추적)
const pendingMap = new Map()   // src → Promise (fetch 진행 중)

let audioCtx = null
let unlocked = false
let currentSource = null

// AudioContext는 유저 제스처 안에서만 생성
function ensureContext() {
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)()
    } catch (e) {}
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume()
  }
  return audioCtx
}

// --- 디코딩 (Promise 추적) ---
function decodeAndCache(src, arrayBuf) {
  const ctx = ensureContext()
  if (!ctx) return Promise.resolve(null)

  const p = ctx.decodeAudioData(arrayBuf)
    .then(audioBuffer => {
      bufferCache.set(src, audioBuffer)
      decodeMap.delete(src)
      return audioBuffer
    })
    .catch(() => {
      decodeMap.delete(src)
      return null
    })

  decodeMap.set(src, p)
  return p
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
      if (unlocked) {
        // 이미 unlock → 즉시 디코딩
        return decodeAndCache(src, arrayBuf)
      } else {
        // unlock 전 → raw 보관
        rawCache.set(src, arrayBuf)
      }
    })
    .catch(() => {})
    .finally(() => {
      pendingMap.delete(src)
    })
}

// --- 오디오 잠금 해제 ---
export function unlockAudio() {
  if (unlocked) return
  unlocked = true

  ensureContext()

  // rawCache의 모든 항목을 디코딩 (Promise 추적됨)
  for (const [src, arrayBuf] of rawCache) {
    decodeAndCache(src, arrayBuf)
  }
  rawCache.clear()
}

// 첫 터치/클릭에 잠금 해제
if (typeof document !== 'undefined') {
  const handler = () => {
    unlockAudio()
    document.removeEventListener('touchstart', handler, true)
    document.removeEventListener('click', handler, true)
  }
  document.addEventListener('touchstart', handler, { capture: true, passive: true })
  document.addEventListener('click', handler, { capture: true, passive: true })
}

// --- 프리로드 ---

export function preloadAudio(src, priority = false) {
  if (!src) return Promise.resolve()
  if (bufferCache.has(src) || rawCache.has(src) || decodeMap.has(src)) return Promise.resolve()
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

// --- 재생 중지 ---
export function stopCurrentAudio() {
  if (currentSource) {
    try { currentSource.stop() } catch (e) {}
    currentSource = null
  }
}

// --- 재생 ---

export function playAudio(src, onStart, onEnd, onError) {
  if (!src) return Promise.resolve()

  // playAudio는 항상 유저 제스처에서 호출됨 → 여기서도 unlock 보장
  if (!unlocked) unlockAudio()
  ensureContext()

  // 1) 디코딩 완료 → 즉시 재생
  if (bufferCache.has(src)) {
    return playBuffer(bufferCache.get(src), onStart, onEnd, onError)
  }

  // 2) 디코딩 진행 중 → 완료 기다린 후 재생
  if (decodeMap.has(src)) {
    return decodeMap.get(src).then(buf => {
      if (buf) return playBuffer(buf, onStart, onEnd, onError)
      if (onError) onError()
    })
  }

  // 3) rawCache에 있음 (unlock 직후 아직 처리 안 된 경우) → 즉석 디코딩
  if (rawCache.has(src)) {
    const raw = rawCache.get(src)
    rawCache.delete(src)
    return decodeAndCache(src, raw).then(buf => {
      if (buf) return playBuffer(buf, onStart, onEnd, onError)
      if (onError) onError()
    })
  }

  // 4) fetch도 안 됨 → fetch 후 재생
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

    // fetch 완료 후 디코딩 진행 중일 수 있음
    if (decodeMap.has(src)) {
      await decodeMap.get(src)
    }

    // rawCache에 남아있을 수 있음
    if (!bufferCache.has(src) && rawCache.has(src)) {
      const raw = rawCache.get(src)
      rawCache.delete(src)
      await decodeAndCache(src, raw)
    }

    const buf = bufferCache.get(src)
    if (buf) return playBuffer(buf, onStart, onEnd, onError)
    if (onError) onError()
  })()
}

function playBuffer(buffer, onStart, onEnd, onError) {
  return new Promise((resolve) => {
    const ctx = ensureContext()
    if (!ctx) {
      if (onError) onError()
      resolve()
      return
    }

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
