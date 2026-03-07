// =====================================================
// 🎵 useAudio.js - 소리를 재생하는 훅이에요!
// audioCache의 playAudio를 사용해서 즉시 재생해요.
// fetch 진행 중이면 완료를 기다린 후 재생해요.
// =====================================================

import { useRef, useState, useCallback } from 'react'
import { playAudio, getCachedAudio } from '../utils/audioCache'

export function useAudio() {
  const currentAudioRef = useRef(null)  // 현재 재생 중인 오디오
  const [isPlaying, setIsPlaying] = useState(false)

  const play = useCallback((src) => {
    // 기존 재생 중인 소리가 있으면 중지
    if (currentAudioRef.current) {
      currentAudioRef.current.pause()
      currentAudioRef.current.currentTime = 0
      setIsPlaying(false)
    }

    return playAudio(
      src,
      () => {
        // onStart
        setIsPlaying(true)
        const a = getCachedAudio(src)
        if (a) currentAudioRef.current = a
      },
      () => {
        // onEnd
        setIsPlaying(false)
        currentAudioRef.current = null
      },
      () => {
        // onError
        setIsPlaying(false)
        currentAudioRef.current = null
      },
    )
  }, [])

  const stop = useCallback(() => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause()
      currentAudioRef.current.currentTime = 0
      setIsPlaying(false)
      currentAudioRef.current = null
    }
  }, [])

  return { play, stop, isPlaying }
}
