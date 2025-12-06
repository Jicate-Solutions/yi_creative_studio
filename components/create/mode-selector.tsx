'use client'

import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { LayoutTemplate, Wand2, Check, ArrowRight, Sparkles } from 'lucide-react'
import type { CreationMode } from '@/types/design.types'

interface ModeSelectorProps {
  mode: CreationMode
  onModeChange: (mode: CreationMode) => void
}

export function ModeSelector({ mode, onModeChange }: ModeSelectorProps) {
  return (
    <div className="w-full">
      {/* Header - Centered */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center gap-2 mb-3">
          <Sparkles className="h-6 w-6 text-accent" />
          <h2 className="text-2xl font-semibold text-foreground">
            How would you like to create?
          </h2>
        </div>
        <p className="text-base text-muted-foreground max-w-xl mx-auto">
          Choose between using a pre-designed template or generating from scratch with full customization
        </p>
      </div>

      {/* Split Screen - 50/50 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {/* Template Mode - Left Panel */}
        <button
          onClick={() => onModeChange('template')}
          className={cn(
            'group relative flex flex-col items-center justify-center text-center',
            'min-h-[50vh] p-8 rounded-3xl',
            'transition-all duration-300 ease-out',
            mode === 'template'
              ? 'bg-accent/5 shadow-[var(--shadow-card-hover)] scale-[1.02] ring-2 ring-accent/30'
              : 'bg-muted/30 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] hover:scale-[1.01]'
          )}
        >
          {/* Selection Checkmark */}
          {mode === 'template' && (
            <div className="absolute top-6 right-6 animate-in zoom-in duration-200">
              <div className="p-2 rounded-full gradient-yi shadow-lg">
                <Check className="h-5 w-5 text-white" />
              </div>
            </div>
          )}

          {/* Icon - Larger */}
          <div
            className={cn(
              'p-6 rounded-3xl mb-6 transition-all duration-300',
              mode === 'template'
                ? 'gradient-yi shadow-lg shadow-accent/30'
                : 'bg-muted group-hover:bg-primary/10'
            )}
          >
            <LayoutTemplate
              className={cn(
                'h-12 w-12 transition-colors duration-300',
                mode === 'template' ? 'text-white' : 'text-muted-foreground group-hover:text-accent'
              )}
            />
          </div>

          {/* Content */}
          <div className="space-y-3 max-w-sm">
            <div className="flex items-center justify-center gap-3">
              <h3 className="text-xl font-semibold text-foreground">Use Template</h3>
              <Badge variant="success" className="text-xs shadow-sm">
                Quick
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Choose from professionally designed templates and customize the content.
              Perfect for quick and consistent results.
            </p>
          </div>

          {/* Workflow Indicator */}
          <div className="flex items-center justify-center gap-2 mt-6 text-sm">
            <ArrowRight
              className={cn(
                'h-4 w-4 transition-all duration-300',
                mode === 'template'
                  ? 'text-accent translate-x-0.5'
                  : 'text-muted-foreground group-hover:text-accent group-hover:translate-x-0.5'
              )}
            />
            <span className="text-muted-foreground">Select template, fill details, generate</span>
          </div>

          {/* Feature Badges */}
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            <Badge variant="info-muted" className="text-xs">
              Pre-designed layouts
            </Badge>
            <Badge variant="secondary" className="text-xs">
              Consistent style
            </Badge>
            <Badge variant="warning-muted" className="text-xs">
              Faster creation
            </Badge>
          </div>
        </button>

        {/* Scratch Mode - Right Panel */}
        <button
          onClick={() => onModeChange('scratch')}
          className={cn(
            'group relative flex flex-col items-center justify-center text-center',
            'min-h-[50vh] p-8 rounded-3xl',
            'transition-all duration-300 ease-out',
            mode === 'scratch'
              ? 'bg-primary/5 shadow-[var(--shadow-card-hover)] scale-[1.02] ring-2 ring-accent/30'
              : 'bg-muted/30 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] hover:scale-[1.01]'
          )}
        >
          {/* Selection Checkmark */}
          {mode === 'scratch' && (
            <div className="absolute top-6 right-6 animate-in zoom-in duration-200">
              <div className="p-2 rounded-full gradient-yi shadow-lg">
                <Check className="h-5 w-5 text-white" />
              </div>
            </div>
          )}

          {/* Icon - Larger */}
          <div
            className={cn(
              'p-6 rounded-3xl mb-6 transition-all duration-300',
              mode === 'scratch'
                ? 'gradient-yi shadow-lg shadow-primary/30'
                : 'bg-muted group-hover:bg-primary/10'
            )}
          >
            <Wand2
              className={cn(
                'h-12 w-12 transition-colors duration-300',
                mode === 'scratch' ? 'text-white' : 'text-muted-foreground group-hover:text-accent'
              )}
            />
          </div>

          {/* Content */}
          <div className="space-y-3 max-w-sm">
            <h3 className="text-xl font-semibold text-foreground">Generate from Scratch</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Full creative control with themes, styles, and advanced customization.
              Generate unique designs based on your preferences.
            </p>
          </div>

          {/* Workflow Indicator */}
          <div className="flex items-center justify-center gap-2 mt-6 text-sm">
            <ArrowRight
              className={cn(
                'h-4 w-4 transition-all duration-300',
                mode === 'scratch'
                  ? 'text-accent translate-x-0.5'
                  : 'text-muted-foreground group-hover:text-accent group-hover:translate-x-0.5'
              )}
            />
            <span className="text-muted-foreground">Choose design options, fill details, generate</span>
          </div>

          {/* Feature Badges */}
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            <Badge variant="secondary" className="text-xs">
              22+ themes
            </Badge>
            <Badge variant="destructive-muted" className="text-xs">
              16 styles
            </Badge>
            <Badge variant="success-muted" className="text-xs">
              Full customization
            </Badge>
          </div>
        </button>
      </div>
    </div>
  )
}
