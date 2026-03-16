'use client'

import { motion } from 'framer-motion'

interface MeshGradientProps {
  className?: string
  intensity?: 'subtle' | 'medium' | 'bold'
}

export default function MeshGradient({
  className = '',
  intensity = 'subtle',
}: MeshGradientProps) {
  const opacityMap = { subtle: 0.3, medium: 0.5, bold: 0.7 }
  const opacity = opacityMap[intensity]

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {/* Animated orb 1 — navy */}
      <motion.div
        className="absolute rounded-full blur-[120px]"
        style={{
          width: '40%',
          height: '40%',
          background: `radial-gradient(circle, rgba(30, 58, 95, ${opacity}) 0%, transparent 70%)`,
          top: '10%',
          left: '20%',
        }}
        animate={{
          x: [0, 60, -30, 0],
          y: [0, -40, 20, 0],
          scale: [1, 1.1, 0.95, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Animated orb 2 — orange accent */}
      <motion.div
        className="absolute rounded-full blur-[100px]"
        style={{
          width: '30%',
          height: '30%',
          background: `radial-gradient(circle, rgba(245, 158, 11, ${opacity * 0.4}) 0%, transparent 70%)`,
          bottom: '20%',
          right: '15%',
        }}
        animate={{
          x: [0, -50, 30, 0],
          y: [0, 30, -50, 0],
          scale: [1, 0.9, 1.15, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Animated orb 3 — deep navy */}
      <motion.div
        className="absolute rounded-full blur-[140px]"
        style={{
          width: '35%',
          height: '35%',
          background: `radial-gradient(circle, rgba(15, 23, 42, ${opacity * 0.8}) 0%, transparent 70%)`,
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
        animate={{
          x: ['-50%', '-40%', '-55%', '-50%'],
          y: ['-50%', '-45%', '-55%', '-50%'],
          scale: [1, 1.2, 0.9, 1],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(30, 58, 95, 1) 1px, transparent 1px), linear-gradient(to bottom, rgba(30, 58, 95, 1) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />
    </div>
  )
}
