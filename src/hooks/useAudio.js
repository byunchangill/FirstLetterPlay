// =====================================================
// useAudio.js - 소리를 재생하는 훅
// audioCache의 playAudio를 사용해서 재생
// =====================================================

import { useRef, useState, useCallback } from 'react'
import { playAudio, getCachedAudio, stopCurrentAudio } from '../utils/audioCache'

export function useAudio() {
  const currentAudioRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)

  const play = useCallback((src) => {
    // 기존 재생 중인 소리 중지
    if (currentAudioRef.current) {
      currentAudioRef.current.pause()
      currentAudioRef.current.currentTime = 0
      setIsPlaying(false)
    }
    stopCurrentAudio()

    return playAudio(
      src,
      () => {
        setIsPlaying(true)
        const a = getCachedAudio(src)
        if (a) currentAudioRef.current = a
      },
      () => {
        setIsPlaying(false)
        currentAudioRef.current = null
      },
      () => {
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
    stopCurrentAudio()
  }, [])

  return { play, stop, isPlaying }
}
