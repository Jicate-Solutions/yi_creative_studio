'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Target, Minus, Plus, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Slider } from '@/components/ui/slider'
import { Input } from '@/components/ui/input'
import { useGoalModal, useDashboardStore } from '@/stores/dashboard-store'

interface GoalModalProps {
  onSave?: (goal: number) => Promise<void>
}

export function GoalModal({ onSave }: GoalModalProps) {
  const { isOpen, close, goal: currentGoal, setGoal } = useGoalModal()
  const { isSaving, setSaving } = useDashboardStore()
  const [localGoal, setLocalGoal] = useState(currentGoal)

  // Sync local state when modal opens
  useEffect(() => {
    if (isOpen) {
      setLocalGoal(currentGoal)
    }
  }, [isOpen, currentGoal])

  const handleSave = async () => {
    setSaving(true)
    try {
      if (onSave) {
        await onSave(localGoal)
      }
      setGoal(localGoal)
      close()
    } catch (error) {
      console.error('Failed to save goal:', error)
    } finally {
      setSaving(false)
    }
  }

  const adjustGoal = (delta: number) => {
    const newGoal = Math.max(10, Math.min(500, localGoal + delta))
    setLocalGoal(newGoal)
  }

  // Preset suggestions
  const presets = [
    { value: 25, label: 'Casual', description: '~1/day' },
    { value: 50, label: 'Active', description: '~2/day' },
    { value: 100, label: 'Pro', description: '~3/day' },
    { value: 200, label: 'Power', description: '~7/day' },
  ]

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Set Monthly Goal
          </DialogTitle>
          <DialogDescription>
            How many creatives do you want to generate this month?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Main Goal Input */}
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => adjustGoal(-10)}
              disabled={localGoal <= 10}
            >
              <Minus className="w-4 h-4" />
            </Button>

            <div className="relative">
              <Input
                type="number"
                value={localGoal}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 10
                  setLocalGoal(Math.max(10, Math.min(500, value)))
                }}
                className="w-28 text-center text-3xl font-bold h-16 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                min={10}
                max={500}
              />
              <span className="absolute -bottom-5 left-0 right-0 text-center text-xs text-muted-foreground">
                creatives
              </span>
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={() => adjustGoal(10)}
              disabled={localGoal >= 500}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {/* Slider */}
          <div className="px-4">
            <Slider
              value={[localGoal]}
              onValueChange={([value]) => setLocalGoal(value)}
              min={10}
              max={500}
              step={5}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>10</span>
              <span>500</span>
            </div>
          </div>

          {/* Presets */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Quick select:</p>
            <div className="grid grid-cols-4 gap-2">
              {presets.map((preset) => (
                <motion.button
                  key={preset.value}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setLocalGoal(preset.value)}
                  className={cn(
                    'p-3 rounded-lg border text-center transition-colors',
                    localGoal === preset.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:border-primary/50'
                  )}
                >
                  <div className="font-bold">{preset.value}</div>
                  <div className="text-[10px] text-muted-foreground">{preset.label}</div>
                  <div className="text-[9px] text-muted-foreground/70">{preset.description}</div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Motivation Message */}
          <AnimatePresence mode="wait">
            <motion.div
              key={localGoal}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-3 rounded-lg bg-primary/5 border border-primary/20"
            >
              <div className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-primary mt-0.5" />
                <div className="text-sm">
                  {getMotivationMessage(localGoal)}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={close}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Set Goal'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Helper function for motivation messages
function getMotivationMessage(goal: number): string {
  if (goal <= 20) {
    return "A gentle start! Perfect for maintaining consistency without pressure."
  } else if (goal <= 50) {
    return "A balanced goal! You'll create approximately 2 designs per day."
  } else if (goal <= 100) {
    return "Ambitious! You're aiming to be a prolific creator this month."
  } else if (goal <= 200) {
    return "Power mode activated! You're committed to serious creative output."
  } else {
    return "Legendary goal! You're aiming for maximum creative productivity."
  }
}
