import { useState, useRef, useMemo } from 'react'
import { motion } from 'framer-motion'
import SpeechBubble from '../common/SpeechBubble'
import BigButton from '../common/BigButton'

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

  // Alternate between writing (q0) and fill-blank (q1)
  if (questionIndex === 0) {
    return <WritingExercise item={item} world={world} character={character} label={label} onAnswer={onAnswer} />
  }
  return <FillBlankExercise item={item} world={world} character={character} label={label} onAnswer={onAnswer} />
}

function WritingExercise({ item, world, character, label, onAnswer }) {
  const canvasRef = useRef(null)
  const drawingRef = useRef(false)
  const [hasDrawn, setHasDrawn] = useState(false)

  function getPos(e) {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    if (e.touches && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      }
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
  }

  function startDraw(e) {
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return
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
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const pos = getPos(e)
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(pos.x, pos.y)
  }

  function stopDraw() {
    drawingRef.current = false
  }

  function drawGuide(ctx, w, h) {
    ctx.save()
    ctx.font = `bold ${Math.min(w, h) * 0.6}px "Noto Sans KR"`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.strokeStyle = '#ddd'
    ctx.lineWidth = 2
    ctx.setLineDash([8, 8])
    ctx.strokeText(label, w / 2, h / 2)
    ctx.restore()
  }

  function clearCanvas() {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    drawGuide(ctx, canvas.width, canvas.height)
    setHasDrawn(false)
  }

  function handleCanvasMount(canvas) {
    if (!canvas) return
    canvasRef.current = canvas
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    drawGuide(ctx, canvas.width, canvas.height)
  }

  function handleSubmit() {
    onAnswer(hasDrawn)
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="w-full max-w-sm space-y-4"
    >
      <SpeechBubble text={`${label}을 써볼까?`} character={character} />

      <div
        className="bg-white rounded-2xl shadow-lg p-2 mx-auto cursor-crosshair"
        style={{ width: 280, height: 280 }}
      >
        <canvas
          ref={handleCanvasMount}
          width={270}
          height={270}
          className="rounded-xl"
          style={{ touchAction: 'none' }}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={stopDraw}
          onMouseLeave={stopDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={stopDraw}
        />
      </div>

      <div className="flex gap-3 justify-center">
        <BigButton onClick={clearCanvas} color="#9E9E9E" size="sm">
          ↩️ 다시
        </BigButton>
        <BigButton onClick={handleSubmit} color={world.color} size="sm" disabled={!hasDrawn}>
          ✅ 완료
        </BigButton>
      </div>
    </motion.div>
  )
}

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
      className="w-full max-w-sm space-y-6"
    >
      <SpeechBubble text="빈칸을 채워봐!" character={character} />

      <div className="text-center bg-white rounded-2xl p-6 shadow-lg">
        <p className="font-jua text-4xl text-gray-800">{blankWord}</p>
        {item.word && (
          <p className="font-gaegu font-bold text-2xl text-gray-500 mt-2">= {item.word}</p>
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
              className={`${bgColor} rounded-xl p-4 shadow-md font-jua text-3xl text-gray-800 min-w-[70px] cursor-pointer`}
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
