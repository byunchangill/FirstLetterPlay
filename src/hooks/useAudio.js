import { useRef, useState, useCallback } from 'react'

export function useAudio() {
  const audioRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)

  const play = useCallback((src) => {
    return new Promise((resolve) => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
      }

      const audio = new Audio(src)
      audioRef.current = audio

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

      audio.play().catch(() => {
        setIsPlaying(false)
        resolve()
      })
    })
  }, [])

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      setIsPlaying(false)
    }
  }, [])

  return { play, stop, isPlaying }
}
