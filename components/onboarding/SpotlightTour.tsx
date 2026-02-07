'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { X, ChevronRight, ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface TourStep {
  target: string // CSS selector or data-tour attribute
  title: string
  content: string
  placement?: 'top' | 'bottom' | 'left' | 'right'
}

interface SpotlightTourProps {
  tourId: string
  storageKey: string
  steps: TourStep[]
  onComplete?: () => void
  onSkip?: () => void
  forceShow?: boolean
}

export function SpotlightTour({
  tourId,
  storageKey,
  steps,
  onComplete,
  onSkip,
  forceShow = false
}: SpotlightTourProps) {
  const [isActive, setIsActive] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)

  // Check if tour should show
  useEffect(() => {
    if (forceShow) {
      setIsActive(true)
      return
    }

    const hasSeen = localStorage.getItem(storageKey)
    if (!hasSeen) {
      // Small delay to let page render
      const timer = setTimeout(() => setIsActive(true), 500)
      return () => clearTimeout(timer)
    }
  }, [forceShow, storageKey])

  // Find and highlight current target element
  const updateTargetPosition = useCallback(() => {
    if (!isActive || !steps[currentStep]) return

    const step = steps[currentStep]
    const selector = step.target.startsWith('[')
      ? step.target
      : `[data-tour="${step.target}"]`

    const element = document.querySelector(selector)

    if (element) {
      const rect = element.getBoundingClientRect()
      setTargetRect(rect)

      // Scroll element into view if needed
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    } else {
      setTargetRect(null)
    }
  }, [isActive, currentStep, steps])

  useEffect(() => {
    updateTargetPosition()

    // Update on resize/scroll
    window.addEventListener('resize', updateTargetPosition)
    window.addEventListener('scroll', updateTargetPosition, true)

    return () => {
      window.removeEventListener('resize', updateTargetPosition)
      window.removeEventListener('scroll', updateTargetPosition, true)
    }
  }, [updateTargetPosition])

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1)
    } else {
      handleComplete()
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const handleComplete = () => {
    localStorage.setItem(storageKey, 'true')
    setIsActive(false)
    onComplete?.()
  }

  const handleSkip = () => {
    handleComplete()
    onSkip?.()
  }

  if (!isActive || !steps[currentStep]) return null

  const step = steps[currentStep]
  const padding = 8

  // Calculate tooltip position
  const getTooltipStyle = (): React.CSSProperties => {
    if (!targetRect) {
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)'
      }
    }

    const placement = step.placement || 'bottom'
    const tooltipWidth = 320
    const tooltipHeight = 160
    const gap = 12

    switch (placement) {
      case 'top':
        return {
          top: targetRect.top - tooltipHeight - gap,
          left: targetRect.left + targetRect.width / 2 - tooltipWidth / 2,
        }
      case 'bottom':
        return {
          top: targetRect.bottom + gap,
          left: targetRect.left + targetRect.width / 2 - tooltipWidth / 2,
        }
      case 'left':
        return {
          top: targetRect.top + targetRect.height / 2 - tooltipHeight / 2,
          left: targetRect.left - tooltipWidth - gap,
        }
      case 'right':
        return {
          top: targetRect.top + targetRect.height / 2 - tooltipHeight / 2,
          left: targetRect.right + gap,
        }
      default:
        return {
          top: targetRect.bottom + gap,
          left: targetRect.left + targetRect.width / 2 - tooltipWidth / 2,
        }
    }
  }

  return (
    <div className="fixed inset-0 z-[9999]">
      {/* Overlay with cutout */}
      <svg
        className="absolute inset-0 w-full h-full"
        style={{ pointerEvents: 'none' }}
      >
        <defs>
          <mask id="spotlight-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {targetRect && (
              <rect
                x={targetRect.left - padding}
                y={targetRect.top - padding}
                width={targetRect.width + padding * 2}
                height={targetRect.height + padding * 2}
                rx="8"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(0, 0, 0, 0.7)"
          mask="url(#spotlight-mask)"
          style={{ pointerEvents: 'auto' }}
          onClick={handleSkip}
        />
      </svg>

      {/* Highlight border around target */}
      {targetRect && (
        <div
          className="absolute border-2 border-[#005B96] rounded-lg pointer-events-none animate-pulse"
          style={{
            top: targetRect.top - padding,
            left: targetRect.left - padding,
            width: targetRect.width + padding * 2,
            height: targetRect.height + padding * 2,
            boxShadow: '0 0 0 4px rgba(0, 91, 150, 0.3), 0 0 20px rgba(0, 91, 150, 0.5)'
          }}
        />
      )}

      {/* Tooltip */}
      <div
        className="absolute bg-white rounded-xl shadow-2xl w-80 overflow-hidden"
        style={{
          ...getTooltipStyle(),
          zIndex: 10000
        }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#005B96] to-[#0077B6] text-white px-4 py-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium opacity-80">
              Step {currentStep + 1} of {steps.length}
            </span>
            <button
              onClick={handleSkip}
              className="text-white/70 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <h3 className="font-semibold mt-1">{step.title}</h3>
        </div>

        {/* Content */}
        <div className="p-4">
          <p className="text-sm text-gray-600 leading-relaxed">
            {step.content}
          </p>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-1.5 pb-3">
          {steps.map((_, index) => (
            <div
              key={index}
              className={cn(
                "w-2 h-2 rounded-full transition-all",
                index === currentStep
                  ? "bg-[#005B96] w-4"
                  : index < currentStep
                    ? "bg-[#005B96]/50"
                    : "bg-gray-200"
              )}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSkip}
            className="text-gray-500"
          >
            Skip tour
          </Button>
          <div className="flex gap-2">
            {currentStep > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrev}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
            <Button
              size="sm"
              onClick={handleNext}
              className="bg-[#005B96] hover:bg-[#004a7a]"
            >
              {currentStep === steps.length - 1 ? (
                "Done"
              ) : (
                <>
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Hook to manually trigger tour
export function useResetTour(storageKey: string) {
  return () => {
    localStorage.removeItem(storageKey)
    window.location.reload()
  }
}
