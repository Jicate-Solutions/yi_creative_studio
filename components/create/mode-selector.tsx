'use client'

import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { LayoutTemplate, Wand2, ArrowRight } from 'lucide-react'
import type { CreationMode, ModeConfig, ModeBadgeVariant } from '@/types/design.types'
import { forwardRef, useRef, useCallback, type KeyboardEvent } from 'react'

// Default mode configurations
const DEFAULT_MODES: ModeConfig[] = [
  {
    id: 'template',
    label: 'Template',
    icon: LayoutTemplate,
    badge: { text: 'Quick', variant: 'success' },
    description: 'Choose from professionally designed templates and customize the content. Perfect for quick and consistent results.',
    workflow: 'Select template, fill details, generate',
    features: [
      { text: 'Pre-designed layouts', variant: 'info-muted' },
      { text: 'Consistent style', variant: 'secondary' },
      { text: 'Faster creation', variant: 'warning-muted' },
    ]
  },
  {
    id: 'scratch',
    label: 'From Scratch',
    icon: Wand2,
    badge: { text: 'Pro', variant: 'gold' },
    description: 'Full creative control with themes, styles, and advanced customization. Generate unique designs based on your preferences.',
    workflow: 'Choose design options, fill details, generate',
    features: [
      { text: '22+ themes', variant: 'secondary' },
      { text: '16 styles', variant: 'destructive-muted' },
      { text: 'Full customization', variant: 'success-muted' },
    ]
  }
]

interface ModeSelectorProps {
  mode: CreationMode
  onModeChange: (mode: CreationMode) => void
  modes?: ModeConfig[]
}

interface ModeTabProps {
  mode: ModeConfig
  isSelected: boolean
  onSelect: () => void
  onKeyDown: (e: KeyboardEvent<HTMLButtonElement>) => void
}

// Badge variant mapping for gold
const getBadgeVariant = (variant: ModeBadgeVariant) => {
  if (variant === 'gold') return 'default'
  return variant as 'success' | 'info' | 'warning' | 'default'
}

const ModeTab = forwardRef<HTMLButtonElement, ModeTabProps>(
  ({ mode, isSelected, onSelect, onKeyDown }, ref) => {
    const Icon = mode.icon

    return (
      <button
        ref={ref}
        role="tab"
        aria-selected={isSelected}
        aria-controls={`mode-panel-${mode.id}`}
        id={`mode-tab-${mode.id}`}
        tabIndex={isSelected ? 0 : -1}
        onClick={onSelect}
        onKeyDown={onKeyDown}
        className={cn(
          'flex-1 flex items-center justify-center gap-2 h-11 px-4',
          'rounded-lg text-sm font-medium',
          'transition-all duration-300',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          isSelected
            ? 'gradient-yi text-white shadow-[var(--shadow-primary)]'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
        )}
      >
        <Icon
          className={cn(
            'h-4 w-4 shrink-0',
            isSelected && 'animate-icon-pop'
          )}
        />
        <span className="truncate">{mode.label}</span>
        {mode.badge && (
          <Badge
            variant={getBadgeVariant(mode.badge.variant)}
            className={cn(
              'text-[10px] px-1.5 py-0 h-4 hidden sm:inline-flex shrink-0',
              mode.badge.variant === 'gold' && 'badge-gold text-[10px] px-1.5 py-0 h-4'
            )}
          >
            {mode.badge.text}
          </Badge>
        )}
      </button>
    )
  }
)

ModeTab.displayName = 'ModeTab'

function ModeDetailsPanel({ mode }: { mode: ModeConfig }) {
  const Icon = mode.icon

  return (
    <div
      role="tabpanel"
      id={`mode-panel-${mode.id}`}
      aria-labelledby={`mode-tab-${mode.id}`}
      tabIndex={0}
      className={cn(
        'mt-4 p-4 sm:p-6 rounded-2xl',
        'glass-card',
        'animate-in fade-in-0 slide-in-from-bottom-2 duration-300',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
      )}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="p-3 rounded-xl gradient-yi shadow-lg shadow-primary/20 shrink-0">
          <Icon className="h-6 w-6 text-white" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <h3 className="text-lg font-semibold text-foreground">
              {mode.label}
            </h3>
            {mode.badge && (
              <Badge
                variant={getBadgeVariant(mode.badge.variant)}
                className={cn(
                  'text-xs',
                  mode.badge.variant === 'gold' && 'badge-gold text-xs'
                )}
              >
                {mode.badge.text}
              </Badge>
            )}
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed mb-3">
            {mode.description}
          </p>

          {/* Workflow */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <ArrowRight className="h-4 w-4 text-accent shrink-0" />
            <span>{mode.workflow}</span>
          </div>

          {/* Feature Badges */}
          <div className="flex flex-wrap gap-2">
            {mode.features.map((feature, index) => (
              <Badge
                key={index}
                variant={(feature.variant || 'secondary') as 'default' | 'secondary' | 'destructive' | 'outline'}
                className="text-xs"
              >
                {feature.text}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function ModeSelector({ mode, onModeChange, modes = DEFAULT_MODES }: ModeSelectorProps) {
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
  const selectedIndex = modes.findIndex(m => m.id === mode)
  const selectedMode = modes[selectedIndex] || modes[0]

  const focusTab = useCallback((index: number) => {
    const normalizedIndex = ((index % modes.length) + modes.length) % modes.length
    tabRefs.current[normalizedIndex]?.focus()
  }, [modes.length])

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault()
        focusTab(index - 1)
        break
      case 'ArrowRight':
        e.preventDefault()
        focusTab(index + 1)
        break
      case 'Home':
        e.preventDefault()
        focusTab(0)
        break
      case 'End':
        e.preventDefault()
        focusTab(modes.length - 1)
        break
    }
  }, [focusTab, modes.length])

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-foreground">
          How would you like to create?
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Choose your creation method
        </p>
      </div>

      {/* Segmented Control */}
      <div
        role="tablist"
        aria-label="Select creation mode"
        className="glass-subtle p-1 rounded-xl shadow-[var(--shadow-card)] flex w-full"
      >
        {modes.map((modeConfig, index) => (
          <ModeTab
            key={modeConfig.id}
            mode={modeConfig}
            isSelected={mode === modeConfig.id}
            onSelect={() => onModeChange(modeConfig.id as CreationMode)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            ref={(el) => { tabRefs.current[index] = el }}
          />
        ))}
      </div>

      {/* Details Panel */}
      <ModeDetailsPanel mode={selectedMode} key={selectedMode.id} />
    </div>
  )
}
