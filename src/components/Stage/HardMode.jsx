import { useState, useRef, useMemo, useEffect } from 'react'
import { motion } from 'framer-motion'
import SpeechBubble from '../common/SpeechBubble'
import BigButton from '../common/BigButton'
import { getStrokeOrder } from '../../data/strokeOrder'

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

  if (questionIndex === 0) {
    return <WritingExercise item={item} world={world} character={character} label={label} onAnswer={onAnswer} />
  }
  return <FillBlankExercise item={item} world={world} character={character} label={label} onAnswer={onAnswer} />
}

// ── Stroke animation helpers ──────────────────────────────────────────────────

// Catmull-Rom spline: 4개의 제어점 사이를 t(0~1)로 부드럽게 보간
function catmullRomPoint(p0, p1, p2, p3, t) {
  return 0.5 * (
    (2 * p1) +
    (-p0 + p2) * t +
    (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t +
    (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t
  )
}

// 획 좌표 → 픽셀 변환: 가이드라인 안쪽에 맞게 padding 적용
// pad=0.09 → 좌표 0~1이 캔버스 9%~91% 범위로 매핑됨
function coordToPx(x, y, w, h, pad = 0.09) {
  const scale = 1 - 2 * pad
  return [(x * scale + pad) * w, (y * scale + pad) * h]
}

// 획 좌표를 Catmull-Rom 스플라인으로 부드럽게 보간한 점 배열 반환
function getSmoothPoints(stroke, w, h, stepsPerSeg = 20) {
  const n = stroke.length
  if (n <= 2) {
    // 2점 직선: 균등 보간
    const [x1, y1] = stroke[0]
    const [x2, y2] = stroke[n - 1]
    return Array.from({ length: stepsPerSeg + 1 }, (_, i) => {
      const t = i / stepsPerSeg
      const xi = x1 + (x2 - x1) * t
      const yi = y1 + (y2 - y1) * t
      return coordToPx(xi, yi, w, h)
    })
  }
  // 3점 이상: Catmull-Rom 곡선
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
  pts.push(coordToPx(stroke[n - 1][0], stroke[n - 1][1], w, h))
  return pts
}

// 겹치는 획순 번호 위치 오프셋 계산
function computeNumberPositions(strokes, w, h) {
  const positions = strokes.map(stroke => [...coordToPx(stroke[0][0], stroke[0][1], w, h)])
  for (let i = 0; i < positions.length; i++) {
    for (let j = i + 1; j < positions.length; j++) {
      const dx = positions[j][0] - positions[i][0]
      const dy = positions[j][1] - positions[i][1]
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < 24) {
        positions[i][0] -= 15
        positions[j][0] += 15
      }
    }
  }
  return positions
}

function drawGhostLetter(ctx, w, h, label) {
  ctx.save()
  ctx.font = `bold ${Math.min(w, h) * 0.82}px "Noto Sans KR", sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.strokeStyle = 'rgba(160, 160, 160, 0.45)'
  ctx.lineWidth = 2
  ctx.setLineDash([8, 8])
  ctx.strokeText(label, w / 2, h / 2)
  ctx.restore()
}

function drawFinalGuide(ctx, strokes, w, h) {
  const numPos = computeNumberPositions(strokes, w, h)
  ctx.save()
  ctx.strokeStyle = 'rgba(33, 150, 243, 0.35)'
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

    // 번호 원 (겹침 방지 오프셋 적용)
    const [nx, ny] = numPos[idx]
    ctx.save()
    ctx.fillStyle = 'rgba(255, 87, 34, 0.5)'
    ctx.beginPath()
    ctx.arc(nx, ny, 10, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = 'white'
    ctx.font = 'bold 11px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(String(idx + 1), nx, ny)
    ctx.restore()
  })
  ctx.restore()
}

// 획순 가이드 페이드아웃
function fadeOutGuide(ctx, strokes, w, h, label, rafRef, mountedRef, duration = 1500) {
  const startTime = performance.now()
  function frame(currentTime) {
    if (!mountedRef.current) return
    const elapsed = currentTime - startTime
    const alpha = Math.max(0, 1 - elapsed / duration)
    ctx.clearRect(0, 0, w, h)
    drawGhostLetter(ctx, w, h, label)
    if (alpha > 0.01) {
      ctx.save()
      ctx.globalAlpha = alpha
      drawFinalGuide(ctx, strokes, w, h)
      ctx.restore()
      rafRef.current = requestAnimationFrame(frame)
    }
  }
  setTimeout(() => {
    if (mountedRef.current) rafRef.current = requestAnimationFrame(frame)
  }, 1000)
}

function animateStrokes(ctx, strokes, w, h, rafRef, mountedRef, onComplete) {
  let strokeIdx = 0
  const numPos = computeNumberPositions(strokes, w, h)

  function drawNumberCircle(x, y, num) {
    ctx.save()
    ctx.fillStyle = '#FF5722'
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

  function nextStroke() {
    if (!mountedRef.current) return
    if (strokeIdx >= strokes.length) {
      drawFinalGuide(ctx, strokes, w, h)
      onComplete()
      return
    }

    const [nx, ny] = numPos[strokeIdx]
    drawNumberCircle(nx, ny, strokeIdx + 1)

    setTimeout(() => {
      if (!mountedRef.current) return
      animateSingleStroke(ctx, strokes[strokeIdx], w, h, rafRef, () => {
        strokeIdx++
        setTimeout(nextStroke, 250)
      })
    }, 350)
  }

  nextStroke()
}

function animateSingleStroke(ctx, stroke, w, h, rafRef, onDone) {
  // 부드러운 곡선 점 미리 계산 (18 steps/seg = 기존 속도 유지)
  const pts = getSmoothPoints(stroke, w, h, 18)
  let ptIdx = 1

  ctx.strokeStyle = 'rgba(25, 118, 210, 0.55)'
  ctx.lineWidth = 6
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.beginPath()
  ctx.moveTo(pts[0][0], pts[0][1])

  function frame() {
    if (ptIdx >= pts.length) {
      ctx.stroke()
      onDone()
      return
    }
    ctx.lineTo(pts[ptIdx][0], pts[ptIdx][1])
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(pts[ptIdx][0], pts[ptIdx][1])
    ptIdx++
    rafRef.current = requestAnimationFrame(frame)
  }
  rafRef.current = requestAnimationFrame(frame)
}

// ── WritingExercise ───────────────────────────────────────────────────────────

function WritingExercise({ item, world, character, label, onAnswer }) {
  const drawCanvasRef = useRef(null)
  const guideCanvasRef = useRef(null)
  const drawingRef = useRef(false)
  const rafRef = useRef(null)
  const mountedRef = useRef(true)
  const [hasDrawn, setHasDrawn] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

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
    drawGhostLetter(ctx, canvas.width, canvas.height, label)

    if (!strokes) return
    setIsAnimating(true)
    animateStrokes(ctx, strokes, canvas.width, canvas.height, rafRef, mountedRef, () => {
      if (mountedRef.current) {
        setIsAnimating(false)
        fadeOutGuide(ctx, strokes, canvas.width, canvas.height, label, rafRef, mountedRef)
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
    ctx.lineWidth = 8
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = '#333'
    drawingRef.current = true
    setHasDrawn(true)
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
  }

  function stopDraw(e) {
    drawingRef.current = false
    drawCanvasRef.current?.releasePointerCapture?.(e?.pointerId)
  }

  function clearCanvas() {
    const canvas = drawCanvasRef.current
    if (!canvas) return
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
    setHasDrawn(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="w-full max-w-sm space-y-2 md:space-y-4"
    >
      <div style={{ width: 280 }} className="mx-auto">
        <SpeechBubble text={`${label}을 따라 써볼까?`} character={character} />
      </div>

      <div
        className="bg-white rounded-2xl shadow-lg p-2 mx-auto"
        style={{ width: 280, height: 280, position: 'relative' }}
      >
        {/* Guide canvas (bottom): ghost letter + stroke animation */}
        <canvas
          ref={guideCanvasRef}
          width={270}
          height={270}
          className="rounded-xl"
          style={{ position: 'absolute', top: 8, left: 8 }}
        />
        {/* Draw canvas (top): user's strokes */}
        <canvas
          ref={drawCanvasRef}
          width={270}
          height={270}
          className="rounded-xl"
          style={{ position: 'absolute', top: 8, left: 8, touchAction: 'none', userSelect: 'none', cursor: 'crosshair' }}
          onPointerDown={startDraw}
          onPointerMove={draw}
          onPointerUp={stopDraw}
          onPointerCancel={stopDraw}
        />
      </div>

      <div className="flex gap-2 justify-center flex-wrap">
        <BigButton onClick={handleReplay} color="#2196F3" size="sm" disabled={isAnimating}>
          {isAnimating ? '보는 중...' : '획순 보기'}
        </BigButton>
        <BigButton onClick={clearCanvas} color="#9E9E9E" size="sm">
          ↩ 다시
        </BigButton>
        <BigButton onClick={() => onAnswer(hasDrawn)} color={world.color} size="sm" disabled={!hasDrawn}>
          완료
        </BigButton>
      </div>
    </motion.div>
  )
}

// ── FillBlankExercise (unchanged) ─────────────────────────────────────────────

function FillBlankExercise({ item, world, character, label, onAnswer }) {
  const [selected, setSelected] = useState(null)
  const [answered, setAnswered] = useState(false)

  const wordDisplay = item.word || item.korean || ''
  const blankWord = wordDisplay ? `[ ] ${wordDisplay.slice(1)}` : `[ ] = ${label}`

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
    }, 1200)
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="w-full max-w-sm space-y-3 md:space-y-6"
    >
      <SpeechBubble text="빈칸을 채워봐!" character={character} />

      <div className="text-center bg-white rounded-2xl p-4 md:p-6 shadow-lg">
        <p className="font-jua text-3xl md:text-4xl text-gray-800">{blankWord}</p>
        {item.word && (
          <p className="font-gaegu font-bold text-xl md:text-2xl text-gray-500 mt-1 md:mt-2">= {item.word}</p>
        )}
      </div>

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
              className={`${bgColor} rounded-xl p-3 md:p-4 shadow-md font-jua text-2xl md:text-3xl text-gray-800 min-w-[60px] md:min-w-[70px] cursor-pointer`}
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
    </motion.div>
  )
}
