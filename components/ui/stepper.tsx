'use client'

import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

export interface Step {
  id: number
  title: string
  description?: string
  icon?: React.ReactNode
}

interface StepperProps {
  steps: Step[]
  currentStep: number
  className?: string
  onStepClick?: (stepId: number) => void
}

export function Stepper({ steps, currentStep, className, onStepClick }: StepperProps) {
  return (
    <div className={cn('w-full', className)}>
      {/* Desktop Stepper */}
      <div className="hidden sm:flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center flex-1 last:flex-none">
            {/* Step Circle and Label */}
            <div
              className={cn(
                "flex flex-col items-center",
                onStepClick && currentStep > step.id && "cursor-pointer"
              )}
              onClick={() => onStepClick && currentStep > step.id && onStepClick(step.id)}
            >
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-all duration-300',
                  currentStep > step.id
                    ? 'bg-primary border-primary text-primary-foreground shadow-md'
                    : currentStep === step.id
                    ? 'border-primary text-primary bg-primary/10 shadow-sm ring-4 ring-primary/20'
                    : 'border-muted-foreground/30 text-muted-foreground bg-background'
                )}
              >
                {currentStep > step.id ? (
                  <Check className="h-5 w-5" />
                ) : step.icon ? (
                  step.icon
                ) : (
                  step.id
                )}
              </div>
              <span className={cn(
                'text-xs mt-2 font-medium text-center max-w-[80px] transition-colors',
                currentStep >= step.id ? 'text-foreground' : 'text-muted-foreground'
              )}>
                {step.title}
              </span>
            </div>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div className="flex-1 mx-3 h-0.5 relative">
                <div className="absolute inset-0 bg-muted-foreground/20 rounded-full" />
                <div
                  className={cn(
                    'absolute inset-y-0 left-0 bg-primary rounded-full transition-all duration-500',
                    currentStep > step.id ? 'w-full' : 'w-0'
                  )}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Mobile Stepper - Compact */}
      <div className="sm:hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">
            Step {currentStep} of {steps.length}
          </span>
          <span className="text-sm text-muted-foreground">
            {steps.find(s => s.id === currentStep)?.title}
          </span>
        </div>
        {/* Progress bar */}
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
          />
        </div>
        {/* Step dots */}
        <div className="flex justify-between mt-2">
          {steps.map((step) => (
            <div
              key={step.id}
              className={cn(
                'w-2 h-2 rounded-full transition-all',
                currentStep >= step.id ? 'bg-primary' : 'bg-muted-foreground/30'
              )}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// Mini stepper for compact spaces
export function MiniStepper({
  currentStep,
  totalSteps,
  className
}: {
  currentStep: number
  totalSteps: number
  className?: string
}) {
  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
        <div
          key={step}
          className={cn(
            'h-1.5 rounded-full transition-all duration-300',
            step === currentStep
              ? 'w-6 bg-primary'
              : step < currentStep
              ? 'w-1.5 bg-primary'
              : 'w-1.5 bg-muted-foreground/30'
          )}
        />
      ))}
    </div>
  )
}
