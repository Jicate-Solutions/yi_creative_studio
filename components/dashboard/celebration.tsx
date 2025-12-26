'use client'

import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, X, PartyPopper, Trophy, Flame, Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCelebration } from '@/stores/dashboard-store'
import confetti from 'canvas-confetti'
import type { CelebrationEvent } from '@/types/dashboard.types'

// Icon and color mapping for celebration types
const CELEBRATION_CONFIG: Record<CelebrationEvent, {
  icon: typeof Sparkles
  gradient: string
  confettiColors: string[]
}> = {
  milestone_reached: {
    icon: Star,
    gradient: 'from-yellow-500 via-amber-500 to-orange-500',
    confettiColors: ['#FFD700', '#FFA500', '#FF6B35'],
  },
  goal_completed: {
    icon: Trophy,
    gradient: 'from-green-500 via-emerald-500 to-teal-500',
    confettiColors: ['#00C853', '#00E676', '#1DE9B6'],
  },
  personal_best: {
    icon: Flame,
    gradient: 'from-purple-500 via-pink-500 to-red-500',
    confettiColors: ['#9C27B0', '#E91E63', '#FF5722'],
  },
  streak_maintained: {
    icon: PartyPopper,
    gradient: 'from-blue-500 via-indigo-500 to-purple-500',
    confettiColors: ['#2196F3', '#3F51B5', '#673AB7'],
  },
}

export function Celebration() {
  const { celebration, showCelebration, dismiss } = useCelebration()
  const hasTriggeredConfetti = useRef(false)

  // Trigger confetti when celebration shows
  useEffect(() => {
    if (showCelebration && celebration && !hasTriggeredConfetti.current) {
      hasTriggeredConfetti.current = true
      const config = CELEBRATION_CONFIG[celebration.event]

      // Fire confetti
      const duration = 3000
      const animationEnd = Date.now() + duration
      const defaults = {
        startVelocity: 30,
        spread: 360,
        ticks: 60,
        zIndex: 9999,
        colors: config.confettiColors,
      }

      const randomInRange = (min: number, max: number) => {
        return Math.random() * (max - min) + min
      }

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now()

        if (timeLeft <= 0) {
          clearInterval(interval)
          return
        }

        const particleCount = 50 * (timeLeft / duration)

        // Shoot from both sides
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        })
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        })
      }, 250)

      return () => clearInterval(interval)
    }

    // Reset confetti trigger when celebration is dismissed
    if (!showCelebration) {
      hasTriggeredConfetti.current = false
    }
  }, [showCelebration, celebration])

  if (!celebration) return null

  const config = CELEBRATION_CONFIG[celebration.event]
  const Icon = config.icon

  return (
    <AnimatePresence>
      {showCelebration && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/20 backdrop-blur-sm pointer-events-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={dismiss}
          />

          {/* Celebration Card */}
          <motion.div
            className="relative bg-background rounded-2xl shadow-2xl border border-border/50 overflow-hidden pointer-events-auto max-w-sm w-full"
            initial={{ scale: 0.5, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          >
            {/* Gradient Header */}
            <div className={cn(
              'h-24 bg-gradient-to-r flex items-center justify-center relative',
              config.gradient
            )}>
              {/* Animated Icon */}
              <motion.div
                className="w-16 h-16 rounded-full bg-white/20 backdrop-blur flex items-center justify-center"
                animate={{
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  repeatType: 'loop',
                }}
              >
                <Icon className="w-8 h-8 text-white" />
              </motion.div>

              {/* Sparkle Effects */}
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute"
                  style={{
                    left: `${20 + i * 12}%`,
                    top: `${20 + (i % 2) * 40}%`,
                  }}
                  animate={{
                    scale: [0, 1, 0],
                    opacity: [0, 1, 0],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                >
                  <Sparkles className="w-4 h-4 text-white/50" />
                </motion.div>
              ))}

              {/* Close Button */}
              <button
                onClick={dismiss}
                className="absolute top-3 right-3 p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 text-center">
              <motion.h3
                className="text-xl font-bold text-foreground mb-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                {getTitle(celebration.event)}
              </motion.h3>

              <motion.p
                className="text-muted-foreground"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                {celebration.message}
              </motion.p>

              {celebration.value && (
                <motion.div
                  className={cn(
                    'mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full',
                    'bg-gradient-to-r text-white font-bold',
                    config.gradient
                  )}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4, type: 'spring' }}
                >
                  <Icon className="w-4 h-4" />
                  {celebration.value} Creatives
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Helper function
function getTitle(event: CelebrationEvent): string {
  const titles: Record<CelebrationEvent, string> = {
    milestone_reached: 'Milestone Reached!',
    goal_completed: 'Goal Achieved!',
    personal_best: 'Personal Best!',
    streak_maintained: 'Streak Maintained!',
  }
  return titles[event]
}
