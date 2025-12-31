'use client'

import { cn } from '@/lib/utils'
import { LayoutTemplate, Wand2, Sparkles } from 'lucide-react'
import type { CreationMode, ModeConfig } from '@/types/design.types'
import { forwardRef, useRef, useCallback, type KeyboardEvent } from 'react'

// Default mode configurations
const DEFAULT_MODES: ModeConfig[] = [
  {
    id: 'template',
    label: 'Template',
    icon: LayoutTemplate,
    description: 'Choose from professionally designed templates and customize the content. Perfect for quick and consistent results.',
    workflow: 'Select template, fill details, generate',
    features: []
  },
  {
    id: 'scratch',
    label: 'From Scratch',
    icon: Wand2,
    description: 'Full creative control with themes, styles, and advanced customization. Generate unique designs based on your preferences.',
    workflow: 'Choose design options, fill details, generate',
    features: []
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
          'flex-1 min-w-[72px] flex items-center justify-center gap-2 h-12 px-4',
          'rounded-lg text-sm font-medium',
          'transition-all duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1',
          isSelected
            ? 'bg-white dark:bg-white/10 dark:text-primary text-foreground shadow-md'
            : 'text-muted-foreground hover:text-foreground hover:bg-white/50 dark:hover:bg-white/5'
        )}
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span className="truncate">{mode.label}</span>
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
        <div className="p-3 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 shrink-0">
          <Icon className="h-6 w-6 text-primary" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {mode.label}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {mode.description}
          </p>
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
      {/* Header with Icon */}
      <div className="flex items-center justify-center gap-3 mb-6">
        <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground">
            How would you like to create?
          </h2>
          <p className="text-sm text-muted-foreground">
            Choose your creation method
          </p>
        </div>
      </div>

      {/* Segmented Control */}
      <div
        role="tablist"
        aria-label="Select creation mode"
        className="glass-inset p-1 rounded-xl border-none flex w-full"
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
