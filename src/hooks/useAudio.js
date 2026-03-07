// =====================================================
// 🎵 useAudio.js - 소리를 재생하는 훅이에요!
// 글자 발음이나 예시 단어 소리를 들을 수 있게 해줘요
// =====================================================

import { useRef, useState, useCallback } from 'react'

export function useAudio() {
  const audioRef = useRef(null)  // 현재 재생 중인 오디오 객체
  const [isPlaying, setIsPlaying] = useState(false)  // 재생 중인지 여부

  // play 함수: 주어진 파일 경로의 소리를 재생해요
  const play = useCallback((src) => {
    return new Promise((resolve) => {
      // 기존 재생 중인 소리가 있으면 중지해요
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
      }

      // 새로운 Audio 객체를 만들어서 재생
      const audio = new Audio(src)
      audioRef.current = audio

      // 재생 시작 → 재생 끝 또는 에러까지 처리
      audio.onplay = () => setIsPlaying(true)
      audio.onended = () => {
        setIsPlaying(false)
        resolve()
      }
      audio.onerror = () => {
        setIsPlaying(false)
        console.warn('Audio load failed:', src)
        resolve()
      }

      // 재생 시작 (실패하면 catch로 처리)
      audio.play().catch(() => {
        setIsPlaying(false)
        resolve()
      })
    })
  }, [])

  // stop 함수: 재생 중인 소리를 멈춰요
  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      setIsPlaying(false)
    }
  }, [])

  return { play, stop, isPlaying }
}
