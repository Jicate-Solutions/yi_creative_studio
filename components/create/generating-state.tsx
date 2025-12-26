'use client'

import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'

interface GeneratingStateProps {
  stage?: 'preparing' | 'generating' | 'finishing'
}

export function GeneratingState({ stage = 'generating' }: GeneratingStateProps) {
  const stageText = {
    preparing: 'Preparing your creative...',
    generating: 'AI is crafting your design...',
    finishing: 'Adding final touches...'
  }

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.19, 1, 0.22, 1] }}
      className="flex flex-col items-center gap-4 py-8"
    >
      {/* Large Generating Button */}
      <motion.div
        className="relative px-8 py-4 sm:px-12 sm:py-6 rounded-full overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #005B96 0%, #1B998B 100%)',
          boxShadow: '0 8px 32px rgba(0, 91, 150, 0.3)'
        }}
      >
        {/* Shimmer overlay animation */}
        <motion.div
          className="absolute inset-0 opacity-40"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent)',
            backgroundSize: '200% 100%'
          }}
          animate={{
            backgroundPosition: ['200% 0', '-200% 0']
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'linear'
          }}
        />

        {/* Glow pulse animation */}
        <motion.div
          className="absolute inset-0 rounded-full"
          animate={{
            boxShadow: [
              '0 8px 32px rgba(0,91,150,0.3)',
              '0 12px 40px rgba(27,153,139,0.4), 0 0 0 8px rgba(27,153,139,0.15)',
              '0 8px 32px rgba(0,91,150,0.3)'
            ]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />

        {/* Content */}
        <div className="relative flex items-center gap-3">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'linear'
            }}
          >
            <Sparkles className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
          </motion.div>
          <span className="text-white text-lg sm:text-2xl font-bold tracking-wide">
            Generating...
          </span>
        </div>
      </motion.div>

      {/* Stage description */}
      <motion.p
        key={stage}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="text-muted-foreground text-sm sm:text-base font-medium"
      >
        {stageText[stage]}
      </motion.p>

      {/* Pulsing dots indicator */}
      <div className="flex gap-2">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full bg-primary/50"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.2
            }}
          />
        ))}
      </div>
    </motion.div>
  )
}
