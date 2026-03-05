import { motion } from 'framer-motion'

export default function SpeechBubble({ text, character }) {
  return (
    <div className="flex items-end gap-2 px-4">
      <div className="text-4xl flex-shrink-0">{character?.emoji || '🦕'}</div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-md max-w-[280px]"
      >
        <p className="font-gaegu text-[1.3rem] font-bold text-gray-800 leading-tight">{text}</p>
      </motion.div>
    </div>
  )
}
