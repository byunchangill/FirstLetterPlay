// =====================================================
// 🎤 useSpeech.js - 음성인식 훅이에요! (아직 만드는 중)
// 사용자가 말한 소리를 텍스트로 변환해요
// 예: "ㄱ" 이라고 말하면 글자를 인식해요
// (현재 기능은 아직 완성 단계가 아니에요)
// =====================================================

import { useState, useCallback, useRef } from 'react'

export function useSpeech() {
  const [result, setResult] = useState('')  // 인식된 텍스트
  const [isListening, setIsListening] = useState(false)  // 듣는 중인지 여부
  const recognitionRef = useRef(null)  // 음성인식 객체

  // 브라우저가 음성인식을 지원하는지 확인
  const supported = typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)

  // listen: 음성을 듣기 시작해요
  const listen = useCallback((lang = 'ko-KR') => {
    if (!supported) return Promise.resolve('')

    return new Promise((resolve) => {
      // 브라우저의 음성인식 API 사용
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      const recognition = new SpeechRecognition()
      recognitionRef.current = recognition

      // 설정
      recognition.lang = lang  // 언어 설정 (한국어)
      recognition.continuous = false  // 한 번만 들어요
      recognition.interimResults = false  // 최종 결과만
      recognition.maxAlternatives = 3  // 최대 3개 후보

      recognition.onstart = () => setIsListening(true)

      // 음성인식 결과
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript
        setResult(transcript)
        setIsListening(false)
        resolve(transcript)
      }

      // 에러 처리
      recognition.onerror = () => {
        setIsListening(false)
        resolve('')
      }

      // 종료
      recognition.onend = () => {
        setIsListening(false)
      }

      recognition.start()  // 음성인식 시작!
    })
  }, [supported])

  // stopListening: 음성인식을 멈춰요
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      setIsListening(false)
    }
  }, [])

  return { listen, stopListening, result, isListening, supported }
}
