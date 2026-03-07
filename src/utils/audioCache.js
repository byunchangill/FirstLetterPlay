// =====================================================
// 🔊 audioCache.js - 오디오 파일을 미리 불러와서 빠르게 재생해요!
// fetch → Blob URL + 동시성 제한 큐 + 오디오 잠금 해제
// =====================================================

// ─── 캐시 저장소 ───
const blobCache = new Map()   // src → blobUrl
const audioPool = new Map()   // src → Audio element
const pendingMap = new Map()  // src → Promise (진행 중인 fetch)

// ─── 동시 fetch 큐 ───
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
      return res.blob()
    })
    .then(blob => {
      const blobUrl = URL.createObjectURL(blob)
      blobCache.set(src, blobUrl)
      // Audio 엘리먼트를 미리 생성하고 load()로 디코딩해둬요
      // → 모바일에서도 클릭 즉시 재생 가능!
      const audio = new Audio(blobUrl)
      audio.load()
      audioPool.set(src, audio)
    })
    .catch(() => {})
    .finally(() => {
      pendingMap.delete(src)
    })
}

// ─── 모바일 오디오 잠금 해제 ───
// 모바일 브라우저는 첫 번째 audio.play()가 유저 제스처 안에서 호출되어야 해요.
// 앱 최초 터치/클릭 시 무음을 재생해서 오디오 컨텍스트를 열어놔요.
let unlocked = false

export function unlockAudio() {
  if (unlocked) return
  unlocked = true

  // 1) Web Audio API 잠금 해제
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const buf = ctx.createBuffer(1, 1, 22050)
    const source = ctx.createBufferSource()
    source.buffer = buf
    source.connect(ctx.destination)
    source.start(0)
    ctx.resume()
  } catch (e) {}

  // 2) HTML Audio 잠금 해제 (무음 WAV 데이터)
  try {
    const silence = new Audio(
      'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA='
    )
    silence.volume = 0
    silence.play().catch(() => {})
  } catch (e) {}
}

// 앱 시작 시 자동으로 첫 터치/클릭에 잠금 해제 등록
if (typeof document !== 'undefined') {
  const handler = () => {
    unlockAudio()
    document.removeEventListener('touchstart', handler, true)
    document.removeEventListener('click', handler, true)
  }
  document.addEventListener('touchstart', handler, { capture: true, passive: true })
  document.addEventListener('click', handler, { capture: true, passive: true })
}

// ─── 프리로드 함수들 ───

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

// ─── 재생 함수 ───

export function playAudio(src, onStart, onEnd, onError) {
  if (!src) return Promise.resolve()

  // ★ 핵심: Blob URL이 준비되어 있으면 동기적으로 즉시 재생 (유저 제스처 유지)
  const blobUrl = blobCache.get(src)
  if (blobUrl) {
    return playSrc(blobUrl, src, onStart, onEnd, onError)
  }

  // Blob URL이 아직 없으면 → 진행 중인 fetch를 기다리거나 즉시 fetch
  return (async () => {
    if (pendingMap.has(src)) {
      // 큐에서 이 파일을 맨 앞으로 올림
      const idx = queue.findIndex(j => j.src === src)
      if (idx > 0) {
        const [job] = queue.splice(idx, 1)
        queue.unshift(job)
      }
      await pendingMap.get(src)
    } else {
      await preloadAudio(src, true)
    }

    const readyUrl = blobCache.get(src) || src
    return playSrc(readyUrl, src, onStart, onEnd, onError)
  })()
}

// 실제 Audio.play() 로직 (동기 경로에서 호출 가능)
function playSrc(url, originalSrc, onStart, onEnd, onError) {
  return new Promise((resolve) => {
    // audioPool에서 재사용 또는 새로 생성
    let audio = audioPool.get(originalSrc)
    if (audio) {
      audio.currentTime = 0
    } else {
      audio = new Audio(url)
      audioPool.set(originalSrc, audio)
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
      console.warn('Audio play failed:', originalSrc)
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
