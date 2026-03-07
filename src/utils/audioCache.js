// =====================================================
// audioCache.js - 하이브리드 오디오 캐시
//
// 전략: HTML Audio (항상 동작) + Web Audio API (즉시 재생 최적화)
//
// fetch → ArrayBuffer →
//   1) Blob URL 생성 (HTML Audio용, 항상 성공)
//   2) decodeAudioData 시도 (Web Audio용, 실패해도 OK)
//
// 재생 우선순위:
//   1) AudioBuffer 있으면 → Web Audio 즉시 재생
//   2) audioPool에 Audio 있으면 → HTML Audio 즉시 재생
//   3) Blob URL 있으면 → 새 Audio 생성 후 재생 (약간 지연)
// =====================================================

// --- 캐시 저장소 ---
const blobCache = new Map()     // src → blobUrl (HTML Audio용, 항상 존재)
const bufferCache = new Map()   // src → AudioBuffer (Web Audio용, 있으면 보너스)
const audioPool = new Map()     // src → Audio element (HTML Audio 재사용)
const pendingMap = new Map()    // src → Promise (fetch 진행 중)

// --- Web Audio API (최적화용, 실패해도 무방) ---
let audioCtx = null
let currentSource = null  // Web Audio 재생 중인 source

// --- HTML Audio 풀 관리 ---
const MAX_POOL = 10

function evictPool(keepSrc) {
  if (audioPool.size < MAX_POOL) return
  for (const [key, a] of audioPool) {
    if (key === keepSrc) continue
    a.pause()
    a.removeAttribute('src')
    a.load()
    audioPool.delete(key)
    if (audioPool.size < MAX_POOL) break
  }
}

// --- 오디오 잠금 해제 ---
let unlocked = false

export function unlockAudio() {
  if (unlocked) return
  unlocked = true

  // Web Audio API 잠금 해제 (실패해도 OK)
  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)()
    audioCtx.resume()
  } catch (e) {
    audioCtx = null
  }

  // HTML Audio 잠금 해제 (무음 재생)
  try {
    const silence = new Audio(
      'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA='
    )
    silence.volume = 0
    silence.play().catch(() => {})
  } catch (e) {}

  // 이미 캐시된 Blob URL들에서 Web Audio 디코딩 시도
  // (실패해도 blobCache는 남아있으므로 HTML Audio로 재생 가능)
  if (audioCtx) {
    for (const [src, blobUrl] of blobCache) {
      if (bufferCache.has(src)) continue
      tryDecode(src, blobUrl)
    }
  }
}

// Blob URL에서 Web Audio 디코딩 시도 (실패해도 무방)
function tryDecode(src, blobUrl) {
  if (!audioCtx) return
  if (bufferCache.has(src)) return

  fetch(blobUrl)
    .then(r => r.arrayBuffer())
    .then(ab => audioCtx.decodeAudioData(ab))
    .then(buf => bufferCache.set(src, buf))
    .catch(() => {}) // 실패해도 HTML Audio 폴백 있으니 OK
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
      // 1) Blob URL 생성 (항상, HTML Audio 폴백용)
      const blob = new Blob([arrayBuf], { type: 'audio/mpeg' })
      const blobUrl = URL.createObjectURL(blob)
      blobCache.set(src, blobUrl)

      // 2) Web Audio 디코딩 시도 (최적화, 실패해도 OK)
      if (unlocked && audioCtx) {
        try {
          return audioCtx.decodeAudioData(arrayBuf)
            .then(audioBuffer => {
              bufferCache.set(src, audioBuffer)
            })
            .catch(() => {})
        } catch (e) {}
      }
    })
    .catch(() => {})
    .finally(() => {
      pendingMap.delete(src)
    })
}

// --- 프리로드 ---

export function preloadAudio(src, priority = false) {
  if (!src) return Promise.resolve()
  if (blobCache.has(src)) return Promise.resolve()
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

export function getCachedAudio(src) {
  return audioPool.get(src) || null
}

// --- 재생 중지 ---

export function stopCurrentAudio() {
  // Web Audio 중지
  if (currentSource) {
    try { currentSource.stop() } catch (e) {}
    currentSource = null
  }
}

function stopHtmlAudio(audio) {
  if (audio) {
    audio.pause()
    audio.currentTime = 0
  }
}

// --- 재생 ---

export function playAudio(src, onStart, onEnd, onError) {
  if (!src) return Promise.resolve()

  // playAudio는 항상 유저 제스처에서 호출됨 → unlock 보장
  if (!unlocked) unlockAudio()

  // 1순위: Web Audio AudioBuffer (즉시 재생, 지연 0ms)
  const buffer = bufferCache.get(src)
  if (buffer && audioCtx && audioCtx.state === 'running') {
    return playWithWebAudio(buffer, onStart, onEnd, onError)
  }

  // 2순위: HTML Audio pool 재사용 (즉시 재생, 지연 0ms)
  const pooled = audioPool.get(src)
  if (pooled) {
    return playWithHtmlAudio(pooled, src, onStart, onEnd, onError, true)
  }

  // 3순위: Blob URL로 새 HTML Audio (약간 지연, 항상 동작)
  const blobUrl = blobCache.get(src)
  if (blobUrl) {
    const audio = new Audio(blobUrl)
    return playWithHtmlAudio(audio, src, onStart, onEnd, onError, false)
  }

  // 4순위: 아직 fetch 안 됨 → 기다린 후 재생
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

    // fetch 완료 후 재시도
    const buf = bufferCache.get(src)
    if (buf && audioCtx && audioCtx.state === 'running') {
      return playWithWebAudio(buf, onStart, onEnd, onError)
    }

    const url = blobCache.get(src)
    if (url) {
      const audio = new Audio(url)
      return playWithHtmlAudio(audio, src, onStart, onEnd, onError, false)
    }

    if (onError) onError()
  })()
}

// Web Audio API 재생 (즉시)
function playWithWebAudio(buffer, onStart, onEnd, onError) {
  return new Promise((resolve) => {
    stopCurrentAudio()

    try {
      const source = audioCtx.createBufferSource()
      source.buffer = buffer
      source.connect(audioCtx.destination)
      currentSource = source

      source.onended = () => {
        if (currentSource === source) currentSource = null
        if (onEnd) onEnd()
        resolve()
      }

      if (onStart) onStart()
      source.start(0)
    } catch (e) {
      // Web Audio 실패 → 무시 (호출자가 HTML Audio로 재시도하진 않지만,
      // 이 경로는 audioCtx.state === 'running' 체크 후에만 진입하므로 거의 안 옴)
      if (onError) onError()
      resolve()
    }
  })
}

// HTML Audio 재생
function playWithHtmlAudio(audio, src, onStart, onEnd, onError, isPooled) {
  return new Promise((resolve) => {
    stopCurrentAudio()

    if (isPooled) {
      audio.currentTime = 0
    } else {
      // 새로 만든 Audio → pool에 저장
      evictPool(src)
      audioPool.set(src, audio)
    }

    const cleanup = () => {
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('error', handleErr)
    }
    const handleEnded = () => {
      cleanup()
      if (onEnd) onEnd()
      resolve()
    }
    const handleErr = () => {
      cleanup()
      if (onError) onError()
      resolve()
    }

    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('error', handleErr)

    if (onStart) onStart()

    audio.play().catch(() => {
      cleanup()
      if (onError) onError()
      resolve()
    })
  })
}
