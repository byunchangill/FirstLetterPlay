// =====================================================
// useAudio.js - Web Audio API 기반 재생 훅
// audioCache의 playAudio/stopCurrentAudio 사용
// =====================================================

import { useState, useCallback } from 'react'
import { playAudio, stopCurrentAudio } from '../utils/audioCache'

export function useAudio() {
  const [isPlaying, setIsPlaying] = useState(false)

  const play = useCallback((src) => {
    stopCurrentAudio()
    setIsPlaying(false)

    return playAudio(
      src,
      () => setIsPlaying(true),
      () => setIsPlaying(false),
      () => setIsPlaying(false),
    )
  }, [])

  const stop = useCallback(() => {
    stopCurrentAudio()
    setIsPlaying(false)
  }, [])

  return { play, stop, isPlaying }
}
