'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Settings, Target, Sparkles, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useDashboardStore, useGoalModal } from '@/stores/dashboard-store'
import { calculateJourneyProgress } from '@/lib/services/dashboard'
import type { Milestone } from '@/types/dashboard.types'
import confetti from 'canvas-confetti'

interface JourneyProgressProps {
  current: number
  className?: string
}

export function JourneyProgress({ current, className }: JourneyProgressProps) {
  const { monthlyGoal, setCurrentProgress, checkMilestone } = useDashboardStore()
  const { open: openGoalModal } = useGoalModal()
  const [animatedProgress, setAnimatedProgress] = useState(0)
  const [hasAnimated, setHasAnimated] = useState(false)
  const progressRef = useRef<HTMLDivElement>(null)

  // Calculate journey data
  const journey = calculateJourneyProgress(current, monthlyGoal)

  // Animate progress on mount
  useEffect(() => {
    if (!hasAnimated && current > 0) {
      // Start animation after a short delay
      const timer = setTimeout(() => {
        setAnimatedProgress(journey.percentage)
        setHasAnimated(true)

        // Update store and check milestones
        setCurrentProgress(current)
      }, 300)

      return () => clearTimeout(timer)
    }
  }, [current, journey.percentage, hasAnimated, setCurrentProgress])

  // Update when current changes
  useEffect(() => {
    if (hasAnimated) {
      const previousProgress = animatedProgress
      setAnimatedProgress(journey.percentage)

      // Check if we hit a milestone
      if (journey.percentage > previousProgress) {
        checkMilestone(current)
      }
    }
  }, [current, journey.percentage, hasAnimated, animatedProgress, checkMilestone])

  // Trigger confetti on goal completion
  const triggerCelebration = () => {
    if (progressRef.current) {
      const rect = progressRef.current.getBoundingClientRect()
      const x = (rect.left + rect.width) / window.innerWidth
      const y = rect.top / window.innerHeight

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { x, y },
        colors: ['#005B96', '#FF6B35', '#FFD700', '#00C853'],
      })
    }
  }

  return (
    <Card
      ref={progressRef}
      darkVariant="elevated"
      className={cn(
        'px-6',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <Target className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">
              This Month&apos;s Creative Journey
            </h3>
            <p className="text-sm text-muted-foreground">
              {journey.current} of {journey.goal} creatives
            </p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={openGoalModal}
          className="text-muted-foreground hover:text-foreground"
        >
          <Settings className="w-4 h-4 mr-1" />
          Set Goal
        </Button>
      </div>

      {/* Progress Bar with Milestones */}
      <div className="relative mt-8 mb-4">
        {/* Background track */}
        <div className="h-3 rounded-full bg-muted/50 overflow-hidden">
          {/* Animated fill */}
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-primary via-primary/80 to-secondary"
            initial={{ width: 0 }}
            animate={{ width: `${animatedProgress}%` }}
            transition={{
              duration: 1.5,
              ease: [0.4, 0, 0.2, 1],
              delay: 0.2
            }}
          />
        </div>

        {/* Milestone Markers */}
        <div className="absolute inset-0 flex items-center">
          {journey.milestones.map((milestone, index) => (
            <MilestoneMarker
              key={milestone.value}
              milestone={milestone}
              position={(milestone.value / journey.goal) * 100}
              isFirst={index === 0}
              isLast={index === journey.milestones.length - 1}
              onReached={milestone.value === journey.goal && milestone.reached ? triggerCelebration : undefined}
            />
          ))}
        </div>

        {/* Current position indicator */}
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
          initial={{ left: '0%', scale: 0 }}
          animate={{
            left: `${animatedProgress}%`,
            scale: 1
          }}
          transition={{
            duration: 1.5,
            ease: [0.4, 0, 0.2, 1],
            delay: 0.2
          }}
        >
          <motion.div
            className="w-5 h-5 rounded-full bg-primary border-2 border-white shadow-lg flex items-center justify-center"
            animate={{
              boxShadow: [
                '0 0 0 0 rgba(0, 91, 150, 0.4)',
                '0 0 0 8px rgba(0, 91, 150, 0)',
              ]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatType: 'loop'
            }}
          >
            <Sparkles className="w-3 h-3 text-white" />
          </motion.div>
        </motion.div>
      </div>

      {/* Progress Stats */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <motion.span
            className="font-semibold text-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            key={journey.percentage}
          >
            {journey.percentage}%
          </motion.span>
          <span>complete</span>
        </div>

        {journey.nextMilestone && (
          <motion.div
            className="flex items-center gap-1 text-primary"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.5 }}
          >
            <ChevronRight className="w-4 h-4" />
            <span className="font-medium">
              {journey.toNextMilestone} more to {journey.nextMilestone.label}
            </span>
          </motion.div>
        )}

        {journey.percentage >= 100 && (
          <motion.div
            className="flex items-center gap-1 text-green-600"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.5, type: 'spring' }}
          >
            <Sparkles className="w-4 h-4" />
            <span className="font-medium">Goal Achieved!</span>
          </motion.div>
        )}
      </div>
    </Card>
  )
}

// Milestone Marker Component
interface MilestoneMarkerProps {
  milestone: Milestone
  position: number
  isFirst: boolean
  isLast: boolean
  onReached?: () => void
}

function MilestoneMarker({ milestone, position, isFirst, isLast, onReached }: MilestoneMarkerProps) {
  const [celebrated, setCelebrated] = useState(false)

  useEffect(() => {
    if (milestone.reached && !celebrated && onReached) {
      setCelebrated(true)
      onReached()
    }
  }, [milestone.reached, celebrated, onReached])

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.div
          className="absolute -translate-x-1/2"
          style={{ left: `${position}%` }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.5 + position * 0.005 }}
        >
          {/* Marker dot */}
          <motion.div
            className={cn(
              'w-4 h-4 rounded-full border-2 transition-colors duration-300',
              milestone.reached
                ? 'bg-primary border-primary'
                : 'bg-background border-muted-foreground/30'
            )}
            animate={milestone.isCurrent ? {
              scale: [1, 1.2, 1],
            } : {}}
            transition={{
              duration: 1.5,
              repeat: milestone.isCurrent ? Infinity : 0,
              repeatType: 'loop'
            }}
          />

          {/* Label below */}
          <div className="absolute top-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
            <span className={cn(
              'text-xs font-medium',
              milestone.reached ? 'text-primary' : 'text-muted-foreground'
            )}>
              {milestone.value}
            </span>
          </div>
        </motion.div>
      </TooltipTrigger>
      <TooltipContent side="top">
        <p className="font-medium">{milestone.label}</p>
        <p className="text-xs text-muted-foreground">
          {milestone.reached ? 'Reached!' : `${milestone.value} creatives`}
        </p>
      </TooltipContent>
    </Tooltip>
  )
}
