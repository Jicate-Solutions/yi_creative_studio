'use client'

import { cn } from '@/lib/utils'
import { type Step } from '@/components/ui/stepper'
import { ArrowLeft, Check } from 'lucide-react'
import Link from 'next/link'

interface CreateSidebarProps {
  steps: Step[]
  currentStep: number
  onStepClick: (stepId: number) => void
  className?: string
}

/**
 * Vertical step sidebar for Create page
 * Replaces the horizontal stepper header for more working space
 */
export function CreateSidebar({
  steps,
  currentStep,
  onStepClick,
  className,
}: CreateSidebarProps) {
  const completedSteps = currentStep - 1
  const totalSteps = steps.length
  const progressPercentage = (completedSteps / totalSteps) * 100

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col w-64 h-[calc(100vh-2rem)]',
        'fixed top-4 left-4 z-50',
        'glass-panel border-white/20 dark:border-white/10 shadow-xl',
        className
      )}
    >
      {/* Header - Back to Dashboard */}
      <div className="flex h-16 items-center px-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
          <span className="text-sm font-medium">Back to Dashboard</span>
        </Link>
      </div>


      {/* Progress Section */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Progress
          </span>
          <span className="text-xs font-medium text-foreground/70">
            Step {currentStep} of {totalSteps}
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden shadow-inner">
          <div
            className="h-full gradient-yi transition-all duration-500 ease-out rounded-full"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Steps Navigation */}
      <nav className="flex-1 p-3 overflow-y-auto">
        <ul className="space-y-1">
          {steps.map((step) => {
            const isCompleted = step.id < currentStep
            const isCurrent = step.id === currentStep
            const isPending = step.id > currentStep
            const isClickable = isCompleted // Only completed steps are clickable

            return (
              <li key={step.id}>
                <button
                  type="button"
                  onClick={() => isClickable && onStepClick(step.id)}
                  disabled={!isClickable}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200',
                    isCurrent && 'bg-primary/10 shadow-[var(--shadow-card-active)]',
                    isCompleted && 'hover:bg-muted cursor-pointer',
                    isPending && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  {/* Step Indicator */}
                  <div
                    className={cn(
                      'flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-200',
                      isCompleted && 'bg-success text-success-foreground',
                      isCurrent && 'gradient-yi text-white shadow-md',
                      isPending && 'bg-muted text-muted-foreground shadow-sm'
                    )}
                  >
                    {isCompleted ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      step.icon
                    )}
                  </div>

                  {/* Step Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={cn(
                          'text-sm font-medium truncate',
                          isCurrent && 'text-primary',
                          isCompleted && 'text-foreground/80',
                          isPending && 'text-muted-foreground'
                        )}
                      >
                        {step.title}
                      </span>
                      {isCompleted && (
                        <span className="text-[10px] font-medium text-success uppercase tracking-wider flex-shrink-0">
                          Done
                        </span>
                      )}
                      {isCurrent && (
                        <span className="text-[10px] font-medium text-primary uppercase tracking-wider flex-shrink-0">
                          Active
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

    </aside>
  )
}
