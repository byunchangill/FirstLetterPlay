import { useState, useCallback, useRef } from 'react'

export function useSpeech() {
  const [result, setResult] = useState('')
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef(null)

  const supported = typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)

  const listen = useCallback((lang = 'ko-KR') => {
    if (!supported) return Promise.resolve('')

    return new Promise((resolve) => {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      const recognition = new SpeechRecognition()
      recognitionRef.current = recognition

      recognition.lang = lang
      recognition.continuous = false
      recognition.interimResults = false
      recognition.maxAlternatives = 3

      recognition.onstart = () => setIsListening(true)

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript
        setResult(transcript)
        setIsListening(false)
        resolve(transcript)
      }

      recognition.onerror = () => {
        setIsListening(false)
        resolve('')
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      recognition.start()
    })
  }, [supported])

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      setIsListening(false)
    }
  }, [])

  return { listen, stopListening, result, isListening, supported }
}
