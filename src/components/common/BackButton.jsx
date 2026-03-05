import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

export default function BackButton({ to }) {
  const navigate = useNavigate()

  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={() => to ? navigate(to) : navigate(-1)}
      className="w-12 h-12 rounded-full bg-white shadow-md flex items-center justify-center text-2xl cursor-pointer"
    >
      ←
    </motion.button>
  )
}
