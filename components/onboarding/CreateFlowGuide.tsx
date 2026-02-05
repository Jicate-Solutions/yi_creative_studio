'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Palette,
  Layout,
  FileText,
  Image,
  Settings2,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'

const STORAGE_KEY = 'yi-creative-onboarding-seen'

interface FlowStep {
  id: number
  title: string
  description: string
  icon: React.ReactNode
  color: string
}

const flowSteps: FlowStep[] = [
  {
    id: 1,
    title: 'Choose Creative Type',
    description: 'Select what you want to create - Event Poster, Certificate, Social Post, YouTube Thumbnail, and more.',
    icon: <Layout className="h-8 w-8" />,
    color: 'bg-blue-500'
  },
  {
    id: 2,
    title: 'Select Creation Method',
    description: 'Pick a pre-designed Template for quick edits, or use AI Create for unique, generated designs.',
    icon: <Sparkles className="h-8 w-8" />,
    color: 'bg-purple-500'
  },
  {
    id: 3,
    title: 'Pick Your Vertical',
    description: 'Choose your Yi chapter or initiative (Yi Main, Yuva, Masoom, Arth, etc.) to auto-load brand logos.',
    icon: <Palette className="h-8 w-8" />,
    color: 'bg-teal-500'
  },
  {
    id: 4,
    title: 'Enter Event Details',
    description: 'Fill in your event information - title, date, venue, description. Or paste text and let AI extract the details!',
    icon: <FileText className="h-8 w-8" />,
    color: 'bg-orange-500'
  },
  {
    id: 5,
    title: 'Customize Logo & Styling',
    description: 'Configure header logos, footer bar with hashtag & social links, select theme, colors, and typography.',
    icon: <Settings2 className="h-8 w-8" />,
    color: 'bg-pink-500'
  },
  {
    id: 6,
    title: 'Generate Your Creative',
    description: 'Choose resolution (1K/2K/4K), select AI model, and click Generate. Download, save, or share your creation!',
    icon: <Image className="h-8 w-8" />,
    color: 'bg-green-500'
  }
]

interface CreateFlowGuideProps {
  forceShow?: boolean
  onClose?: () => void
}

export function CreateFlowGuide({ forceShow = false, onClose }: CreateFlowGuideProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)

  useEffect(() => {
    if (forceShow) {
      setIsOpen(true)
      return
    }

    // Check if user has seen onboarding
    const hasSeen = localStorage.getItem(STORAGE_KEY)
    if (!hasSeen) {
      setIsOpen(true)
    }
  }, [forceShow])

  const handleClose = () => {
    localStorage.setItem(STORAGE_KEY, 'true')
    setIsOpen(false)
    onClose?.()
  }

  const handleNext = () => {
    if (currentStep < flowSteps.length - 1) {
      setCurrentStep(prev => prev + 1)
    } else {
      handleClose()
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const handleSkip = () => {
    handleClose()
  }

  const currentFlowStep = flowSteps[currentStep]

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#005B96] to-[#0077B6] text-white p-6 pb-4">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl font-bold text-white">
                Welcome to Yi CreativeStudio
              </DialogTitle>
              <Button
                variant="ghost"
                size="icon"
                className="text-white/70 hover:text-white hover:bg-white/10"
                onClick={handleSkip}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-white/80 text-sm mt-1">
              Let&apos;s walk through how to create your first design
            </p>
          </DialogHeader>

          {/* Progress indicator */}
          <div className="flex gap-1.5 mt-4">
            {flowSteps.map((step, index) => (
              <div
                key={step.id}
                className={cn(
                  "h-1.5 flex-1 rounded-full transition-all duration-300",
                  index <= currentStep ? "bg-white" : "bg-white/30"
                )}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Step indicator */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <span className="font-medium">Step {currentStep + 1}</span>
            <span>of {flowSteps.length}</span>
          </div>

          {/* Current step card */}
          <div className="flex gap-4 items-start">
            <div className={cn(
              "shrink-0 w-14 h-14 rounded-xl flex items-center justify-center text-white",
              currentFlowStep.color
            )}>
              {currentFlowStep.icon}
            </div>
            <div className="flex-1 min-h-[100px]">
              <h3 className="font-semibold text-lg mb-2">
                {currentFlowStep.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {currentFlowStep.description}
              </p>
            </div>
          </div>

          {/* Mini flow preview */}
          <div className="mt-6 pt-4 border-t">
            <p className="text-xs text-muted-foreground mb-3">Your creation journey:</p>
            <div className="flex items-center gap-1 overflow-x-auto pb-2">
              {flowSteps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div
                    className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium shrink-0 transition-all",
                      index === currentStep
                        ? "bg-[#005B96] text-white scale-110"
                        : index < currentStep
                          ? "bg-green-100 text-green-600"
                          : "bg-gray-100 text-gray-400"
                    )}
                  >
                    {index + 1}
                  </div>
                  {index < flowSteps.length - 1 && (
                    <ChevronRight className={cn(
                      "h-3 w-3 shrink-0",
                      index < currentStep ? "text-green-400" : "text-gray-300"
                    )} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t bg-gray-50/50">
          <Button
            variant="ghost"
            onClick={handleSkip}
            className="text-muted-foreground"
          >
            Skip tour
          </Button>
          <div className="flex gap-2">
            {currentStep > 0 && (
              <Button
                variant="outline"
                onClick={handlePrev}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            )}
            <Button
              onClick={handleNext}
              className="bg-[#005B96] hover:bg-[#004a7a]"
            >
              {currentStep === flowSteps.length - 1 ? (
                "Start Creating"
              ) : (
                <>
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Hook to reset onboarding (for testing)
export function useResetOnboarding() {
  return () => {
    localStorage.removeItem(STORAGE_KEY)
    window.location.reload()
  }
}
