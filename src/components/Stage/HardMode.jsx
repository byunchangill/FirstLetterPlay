// =====================================================
// 🎮 HardMode.jsx - 어려운 난이도 문제예요!
// 1번 문제: 글자를 직접 손가락/마우스로 써서 그리는 획순 따라하기
// 2번 문제: 빈 칸을 채우기 (가이드라인 따라 맞는 획을 그리기)
// 매우 어려운 문제지만 많은 경험치를 줘요!
// =====================================================

import { useState, useRef, useMemo, useEffect } from 'react'
import { motion } from 'framer-motion'
import SpeechBubble from '../common/SpeechBubble'
import BigButton from '../common/BigButton'
import { getStrokeOrder } from '../../data/strokeOrder'

// 배열을 섞어주는 함수예요 (Fisher-Yates 알고리즘)
function shuffleArray(arr) {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export default function HardMode({ item, world, character, questionIndex, onAnswer }) {
  const label = world.getLabel(item)

  // 1번 문제면 WritingExercise, 2번 문제면 FillBlankExercise를 보여줘요
  if (questionIndex === 0) {
    return <WritingExercise item={item} world={world} character={character} label={label} onAnswer={onAnswer} />
  }
  return <FillBlankExercise item={item} world={world} character={character} label={label} onAnswer={onAnswer} />
}

// ──────────────────────────────────────────────────
// 획순 애니메이션 도우미 함수들
// ──────────────────────────────────────────────────

// Catmull-Rom 스플라인: 4개의 제어점 사이를 부드럽게 보간해요
// t가 0~1 사이에서 p1과 p2 사이를 부드러운 곡선으로 연결
function catmullRomPoint(p0, p1, p2, p3, t) {
  return 0.5 * (
    (2 * p1) +
    (-p0 + p2) * t +
    (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t +
    (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t
  )
}

// 획 좌표(0~1 범위)를 캔버스 픽셀 좌표로 변환해요
// pad=0.09 → 좌표 0~1이 캔버스 9%~91% 범위로 매핑됨
// (캔버스 테두리 근처가 아닌 중앙 영역에 그려요)
function coordToPx(x, y, w, h, pad = 0.09) {
  const scale = 1 - 2 * pad
  return [(x * scale + pad) * w, (y * scale + pad) * h]
}

// 획을 부드러운 곡선으로 변환해요 (Catmull-Rom 스플라인 사용)
// 입력: 획 좌표 배열 (0~1 범위)
// 출력: 캔버스 픽셀 좌표 배열
function getSmoothPoints(stroke, w, h, stepsPerSeg = 20) {
  const n = stroke.length
  if (n <= 2) {
    // 점이 2개만 있으면 직선으로 그려요
    const [x1, y1] = stroke[0]
    const [x2, y2] = stroke[n - 1]
    return Array.from({ length: stepsPerSeg + 1 }, (_, i) => {
      const t = i / stepsPerSeg
      const xi = x1 + (x2 - x1) * t
      const yi = y1 + (y2 - y1) * t
      return coordToPx(xi, yi, w, h)
    })
  }
  // 3점 이상이면 부드러운 Catmull-Rom 곡선으로 그려요
  const pts = []
  for (let i = 0; i < n - 1; i++) {
    const p0 = stroke[Math.max(0, i - 1)]
    const p1 = stroke[i]
    const p2 = stroke[i + 1]
    const p3 = stroke[Math.min(n - 1, i + 2)]
    for (let s = 0; s < stepsPerSeg; s++) {
      const t = s / stepsPerSeg
      const xi = catmullRomPoint(p0[0], p1[0], p2[0], p3[0], t)
      const yi = catmullRomPoint(p0[1], p1[1], p2[1], p3[1], t)
      pts.push(coordToPx(xi, yi, w, h))
    }
  }
  // 마지막 점 추가
  pts.push(coordToPx(stroke[n - 1][0], stroke[n - 1][1], w, h))
  return pts
}

// 획순 번호 위치 계산 (겹치지 않게 배치하기 위해 2D로 밀어내기)
// 예: 획이 많은 영어 "three"(10획)의 번호가 모두 겹치는 것을 방지해요
function computeNumberPositions(strokes, w, h) {
  const R = 14  // 번호 원 반지름 + 여백
  // 각 획의 시작점을 픽셀 좌표로 변환
  const positions = strokes.map(stroke => [...coordToPx(stroke[0][0], stroke[0][1], w, h)])

  // 100회 반복해서 겹치는 번호들을 2D로 밀어내기 (Force-directed layout)
  for (let pass = 0; pass < 100; pass++) {
    let anyMoved = false
    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        const dx = positions[j][0] - positions[i][0]
        const dy = positions[j][1] - positions[i][1]
        const dist = Math.sqrt(dx * dx + dy * dy)
        const minDist = R * 2  // 최소 거리 (두 원이 닿지 않으려면)
        if (dist < minDist) {
          // 겹치면 밀어내기
          const push = (minDist - dist) / 2 + 0.5
          if (dist > 0.1) {
            // 거리가 있으면 그 방향으로 밀어내기
            positions[i][0] -= (dx / dist) * push
            positions[i][1] -= (dy / dist) * push
            positions[j][0] += (dx / dist) * push
            positions[j][1] += (dy / dist) * push
          } else {
            // 거의 같은 위치면 x축으로만 밀어내기
            positions[i][0] -= push
            positions[j][0] += push
          }
          anyMoved = true
        }
      }
    }
    if (!anyMoved) break  // 더 이상 움직이지 않으면 종료
  }

  // 캔버스 경계를 넘지 않도록 조정
  return positions.map(([x, y]) => [
    Math.max(R, Math.min(w - R, x)),
    Math.max(R, Math.min(h - R, y))
  ])
}

// 점선 가이드를 그려요 (사용자가 따라 그릴 획 모양)
// 폰트가 아니라 실제 획순 데이터를 점선으로 표시해요
// 따라서 획순 애니메이션과 100% 일치해요
function drawGhostLetter(ctx, w, h, label, strokes) {
  if (!strokes || strokes.length === 0) return
  ctx.save()
  ctx.strokeStyle = 'rgba(160, 160, 160, 0.45)'  // 회색 점선
  ctx.lineWidth = 4
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.setLineDash([8, 8])  // 8픽셀 점, 8픽셀 공백의 점선
  // 각 획을 부드러운 곡선으로 그려요
  strokes.forEach(stroke => {
    const pts = getSmoothPoints(stroke, w, h, 50)
    ctx.beginPath()
    pts.forEach(([x, y], i) => {
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.stroke()
  })
  ctx.restore()
}

// 최종 가이드를 그려요 (파란색 획 + 겹치지 않는 획순 번호)
// 문제 풀이가 완료됐을 때 보여주는 최종 답 화면이에요
function drawFinalGuide(ctx, strokes, w, h) {
  const numPos = computeNumberPositions(strokes, w, h)  // 번호들이 겹치지 않도록 배치
  ctx.save()
  ctx.strokeStyle = 'rgba(33, 150, 243, 0.35)'  // 파란색 획
  ctx.lineWidth = 5
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  strokes.forEach((stroke, idx) => {
    const pts = getSmoothPoints(stroke, w, h, 50)
    ctx.beginPath()
    pts.forEach(([x, y], i) => {
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.stroke()

    // 각 획 옆에 번호 원을 그려요 (서로 겹치지 않게!)
    const [nx, ny] = numPos[idx]
    ctx.save()
    ctx.fillStyle = 'rgba(255, 87, 34, 0.5)'  // 주황색 반투명 원
    ctx.beginPath()
    ctx.arc(nx, ny, 10, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = 'white'  // 흰색 번호
    ctx.font = 'bold 11px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(String(idx + 1), nx, ny)
    ctx.restore()
  })
  ctx.restore()
}

// 획순 가이드를 천천히 사라지게 해요 (Fade out)
// 1초 후에 시작해서 1.5초에 걸쳐 사라진 다음 점선 가이드만 남아요
function fadeOutGuide(ctx, strokes, w, h, rafRef, mountedRef, duration = 1500) {
  const startTime = performance.now()
  function frame(currentTime) {
    if (!mountedRef.current) return
    const elapsed = currentTime - startTime
    const alpha = Math.max(0, 1 - elapsed / duration)  // 1에서 0으로 점차 감소
    ctx.clearRect(0, 0, w, h)
    drawGhostLetter(ctx, w, h, null, strokes)  // 항상 점선 가이드 표시
    if (alpha > 0.01) {
      ctx.save()
      ctx.globalAlpha = alpha  // 투명도 적용
      drawFinalGuide(ctx, strokes, w, h)  // 파이널 가이드를 서서히 사라지게
      ctx.restore()
      rafRef.current = requestAnimationFrame(frame)
    }
  }
  // 1초 뒤에 페이드아웃 시작
  setTimeout(() => {
    if (mountedRef.current) rafRef.current = requestAnimationFrame(frame)
  }, 1000)
}

// 획순 애니메이션을 재생해요!
// 한 번에 한 개의 획씩 애니메이션 → 시간차를 두고 다음 획을 애니메이션
// 이렇게 하면 10개 획의 번호가 모두 겹치지 않아요 (한 번에 1개씩만 보여요)
function animateStrokes(ctx, strokes, w, h, rafRef, mountedRef, onComplete) {
  let strokeIdx = 0
  const completedPaths = []  // 완성된 획들을 저장해서 나중에 다시 그려요

  // 기본 그리기: 점선 가이드 + 이미 완성된 획들
  // 이 함수를 호출하면 이전 번호들이 지워지고 새 상태를 그려요
  function drawBase() {
    ctx.clearRect(0, 0, w, h)  // 캔버스 초기화
    drawGhostLetter(ctx, w, h, null, strokes)  // 점선 가이드 그리기
    // 이미 완성된 획들을 다시 그려요
    if (completedPaths.length > 0) {
      ctx.save()
      ctx.strokeStyle = 'rgba(25, 118, 210, 0.55)'
      ctx.lineWidth = 6
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      completedPaths.forEach(pts => {
        ctx.beginPath()
        pts.forEach(([x, y], i) => {
          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        })
        ctx.stroke()
      })
      ctx.restore()
    }
  }

  // 획순 번호를 주황색 원으로 그려요
  function drawNumberCircle(x, y, num) {
    ctx.save()
    ctx.fillStyle = '#FF5722'  // 주황색
    ctx.strokeStyle = 'white'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(x, y, 13, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    ctx.fillStyle = 'white'
    ctx.font = 'bold 13px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(String(num), x, y)
    ctx.restore()
  }

  // 다음 획을 처리하는 함수 (재귀적으로 호출)
  function nextStroke() {
    if (!mountedRef.current) return  // 컴포넌트가 언마운트되면 중지
    if (strokeIdx >= strokes.length) {
      // 모든 획 완료! 최종 가이드 그리고 부모에게 알리기
      drawFinalGuide(ctx, strokes, w, h)
      onComplete()
      return
    }

    // 1단계: 현재 획의 번호를 보여줘요 (한 번에 1개씩만!)
    drawBase()
    const [sx, sy] = coordToPx(strokes[strokeIdx][0][0], strokes[strokeIdx][0][1], w, h)
    drawNumberCircle(sx, sy, strokeIdx + 1)  // 번호 표시

    // 2단계: 350ms 후에 번호를 지우고 획 애니메이션 시작
    setTimeout(() => {
      if (!mountedRef.current) return
      drawBase()  // 번호를 지워요
      const pts = getSmoothPoints(strokes[strokeIdx], w, h, 18)  // 부드러운 곡선 점들
      let ptIdx = 1

      ctx.strokeStyle = 'rgba(25, 118, 210, 0.55)'  // 파란색 획
      ctx.lineWidth = 6
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.beginPath()
      ctx.moveTo(pts[0][0], pts[0][1])

      // 3단계: 획을 한 점씩 그려가며 애니메이션 효과
      function frame() {
        if (!mountedRef.current) return
        if (ptIdx >= pts.length) {
          // 획이 완성되면 저장하고 다음 획으로
          ctx.stroke()
          completedPaths.push(pts)  // 완성된 획 저장
          strokeIdx++
          setTimeout(nextStroke, 250)  // 250ms 후 다음 획
          return
        }
        // 점을 하나씩 연결해서 그려요
        ctx.lineTo(pts[ptIdx][0], pts[ptIdx][1])
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(pts[ptIdx][0], pts[ptIdx][1])
        ptIdx++
        rafRef.current = requestAnimationFrame(frame)
      }
      rafRef.current = requestAnimationFrame(frame)
    }, 350)
  }

  nextStroke()  // 첫 번째 획부터 시작!
}

// ── WritingExercise ───────────────────────────────────────────────────────────

function WritingExercise({ item, world, character, label, onAnswer }) {
  const drawCanvasRef = useRef(null)
  const guideCanvasRef = useRef(null)
  const drawingRef = useRef(false)
  const rafRef = useRef(null)
  const mountedRef = useRef(true)

  const drawnPathsRef = useRef([])
  const currentPathRef = useRef([])

  const [hasDrawn, setHasDrawn] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [feedback, setFeedback] = useState(null)

  const strokes = getStrokeOrder(label)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  useEffect(() => {
    const canvas = guideCanvasRef.current
    if (!canvas) return
    startGuideAnimation(canvas)
  }, [label])

  function startGuideAnimation(canvas) {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    drawGhostLetter(ctx, canvas.width, canvas.height, label, strokes)

    if (!strokes) return
    setIsAnimating(true)
    animateStrokes(ctx, strokes, canvas.width, canvas.height, rafRef, mountedRef, () => {
      if (mountedRef.current) {
        setIsAnimating(false)
        fadeOutGuide(ctx, strokes, canvas.width, canvas.height, rafRef, mountedRef)
      }
    })
  }

  function handleReplay() {
    const guideCanvas = guideCanvasRef.current
    const drawCanvas = drawCanvasRef.current
    if (!guideCanvas || isAnimating) return
    if (drawCanvas) {
      drawCanvas.getContext('2d').clearRect(0, 0, drawCanvas.width, drawCanvas.height)
      setHasDrawn(false)
    }
    startGuideAnimation(guideCanvas)
  }

  // ── Drawing on user canvas ──

  function getPos(e) {
    const canvas = drawCanvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    if (e.touches && e.touches.length > 0) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top }
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  function startDraw(e) {
    const canvas = drawCanvasRef.current
    if (!canvas) return
    canvas.setPointerCapture?.(e.pointerId)
    const ctx = canvas.getContext('2d')
    const pos = getPos(e)
    ctx.beginPath()
    ctx.moveTo(pos.x, pos.y)
    ctx.lineWidth = 12
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = '#333'
    drawingRef.current = true
    setHasDrawn(true)

    currentPathRef.current = [pos]
  }

  function draw(e) {
    if (!drawingRef.current) return
    const canvas = drawCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const pos = getPos(e)
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(pos.x, pos.y)

    currentPathRef.current.push(pos)
  }

  function stopDraw(e) {
    if (!drawingRef.current) return
    drawingRef.current = false
    drawCanvasRef.current?.releasePointerCapture?.(e?.pointerId)

    if (currentPathRef.current.length > 0) {
      drawnPathsRef.current.push([...currentPathRef.current])
      currentPathRef.current = []
    }
  }

  function clearCanvas() {
    const canvas = drawCanvasRef.current
    if (!canvas) return
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
    setHasDrawn(false)
    setFeedback(null)
    drawnPathsRef.current = []
    currentPathRef.current = []
  }

  function checkAccuracy() {
    if (!strokes) return true // no guide, auto pass

    const w = drawCanvasRef.current.width
    const h = drawCanvasRef.current.height

    let totalGuidePoints = 0
    let coveredGuidePoints = 0
    const hitRadius = 25 // 25px tolerance for accuracy

    strokes.forEach(stroke => {
      // Sample guide points along the original Catmull-Rom path
      const pts = getSmoothPoints(stroke, w, h, 20)
      totalGuidePoints += pts.length

      pts.forEach(guidePt => {
        let isCovered = false
        for (const path of drawnPathsRef.current) {
          for (const drawnPt of path) {
            const dx = guidePt[0] - drawnPt.x
            const dy = guidePt[1] - drawnPt.y
            if (dx * dx + dy * dy <= hitRadius * hitRadius) {
              isCovered = true
              break
            }
          }
          if (isCovered) break
        }
        if (isCovered) coveredGuidePoints++
      })
    })

    const accuracy = coveredGuidePoints / totalGuidePoints

    // Penalize scribbling: measure user's drawn distance vs guide distance
    let drawnLength = 0
    drawnPathsRef.current.forEach(path => {
      for (let i = 1; i < path.length; i++) {
        const dx = path[i].x - path[i - 1].x
        const dy = path[i].y - path[i - 1].y
        drawnLength += Math.sqrt(dx * dx + dy * dy)
      }
    })

    let guideLength = 0
    strokes.forEach(stroke => {
      const pts = getSmoothPoints(stroke, w, h, 20)
      for (let i = 1; i < pts.length; i++) {
        const dx = pts[i][0] - pts[i - 1][0]
        const dy = pts[i][1] - pts[i - 1][1]
        guideLength += Math.sqrt(dx * dx + dy * dy)
      }
    })

    // If they scribbled more than 3 times the guide length, fail them
    const isScribble = drawnLength > guideLength * 3

    // Pass condition: at least 70% coverage and not a heavy scribble
    return (accuracy >= 0.70) && !isScribble
  }

  function handleComplete() {
    const isCorrect = checkAccuracy()
    if (isCorrect) {
      setFeedback('success')
      setTimeout(() => onAnswer(true), 600)
    } else {
      setFeedback('fail')
      setTimeout(() => {
        setFeedback(null)
        clearCanvas()
      }, 700)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="w-full max-w-sm md:max-w-md space-y-3 md:space-y-6"
    >
      {/* 말풍선 */}
      <div style={{ maxWidth: 300 }} className="mx-auto">
        <SpeechBubble text={`${label}을 따라 써볼까?`} character={character} />
      </div>

      {/* 캔버스 (글자 쓰기 영역) */}
      <motion.div
        animate={
          feedback === 'fail'
            ? { x: [-8, 8, -6, 6, -4, 4, 0], backgroundColor: '#ffebee' }
            : feedback === 'success'
              ? { scale: [1, 1.05, 1], backgroundColor: '#e8f5e9' }
              : { backgroundColor: '#ffffff' }
        }
        transition={{ duration: 0.4 }}
        className="rounded-2xl shadow-lg p-2 mx-auto"
        style={{ width: 300, height: 300, position: 'relative' }}
      >
        <canvas
          ref={guideCanvasRef}
          width={288}
          height={288}
          className="rounded-xl"
          style={{ position: 'absolute', top: 8, left: 8 }}
        />
        <canvas
          ref={drawCanvasRef}
          width={288}
          height={288}
          className="rounded-xl"
          style={{ position: 'absolute', top: 8, left: 8, touchAction: 'none', userSelect: 'none', cursor: 'crosshair' }}
          onPointerDown={startDraw}
          onPointerMove={draw}
          onPointerUp={stopDraw}
          onPointerCancel={stopDraw}
        />
      </motion.div>

      {/* 버튼들 */}
      <div>
        <div className="flex gap-2 justify-center flex-wrap">
          <BigButton onClick={handleReplay} color="#2196F3" size="sm" disabled={isAnimating}>
            {isAnimating ? '보는 중...' : '획순 보기'}
          </BigButton>
          <BigButton onClick={clearCanvas} color="#9E9E9E" size="sm">
            ↩ 다시
          </BigButton>
          <BigButton onClick={handleComplete} color={world.color} size="sm" disabled={!hasDrawn}>
            완료
          </BigButton>
        </div>
      </div>
    </motion.div>
  )
}

// ── FillBlankExercise (unchanged) ─────────────────────────────────────────────

function FillBlankExercise({ item, world, character, label, onAnswer }) {
  const [selected, setSelected] = useState(null)
  const [answered, setAnswered] = useState(false)

  const wordDisplay = item.word || (world.id === 'numbers_en' ? item.english : item.korean) || ''
  const isEnglish = world.id === 'numbers_en' || (item.upper !== undefined)
  const blankWord = wordDisplay ? (isEnglish ? `[  ]${wordDisplay.slice(1)}` : `[ ] ${wordDisplay.slice(1)}`) : `[ ] = ${label}`

  const choices = useMemo(() => {
    const others = world.items
      .filter((_, i) => i !== world.items.indexOf(item))
      .sort(() => Math.random() - 0.5)
      .slice(0, 2)
      .map(o => world.getLabel(o))
    return shuffleArray([label, ...others])
  }, [item, world, label])

  function handleSelect(choice) {
    if (answered) return
    setSelected(choice)
    setAnswered(true)
    setTimeout(() => {
      onAnswer(choice === label)
    }, 200)
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="w-full max-w-sm md:max-w-md space-y-5 md:space-y-8"
    >
      {/* 말풍선 */}
      <SpeechBubble text="빈칸을 채워봐!" character={character} />

      {/* 빈칸 카드 */}
      <div className="w-full text-center bg-white rounded-2xl p-6 md:p-10 shadow-lg">
        <p className="font-jua text-4xl md:text-6xl text-gray-800">{blankWord}</p>
        {item.word && (
          <p className="font-gaegu font-bold text-xl md:text-3xl text-gray-500 mt-2">= {item.word}</p>
        )}
      </div>

      {/* 선택지 버튼들 */}
      <div>
        <div className="flex gap-3 justify-center">
          {choices.map(choice => {
            let bgColor = 'bg-white'
            if (answered && choice === label) bgColor = 'bg-green-100'
            else if (answered && choice === selected && choice !== label) bgColor = 'bg-red-100'

            return (
              <motion.button
                key={choice}
                whileTap={!answered ? { scale: 0.9 } : {}}
                animate={answered && choice === selected && choice !== label ? { x: [0, -3, 3, -3, 0] } : {}}
                onClick={() => handleSelect(choice)}
                className={`${bgColor} rounded-xl p-4 md:p-6 shadow-md font-jua text-3xl md:text-5xl text-gray-800 min-w-[72px] md:min-w-[90px] cursor-pointer`}
                style={{
                  borderWidth: '3px',
                  borderColor: answered && choice === label ? '#4CAF50' : 'transparent',
                }}
              >
                {choice}
              </motion.button>
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}
