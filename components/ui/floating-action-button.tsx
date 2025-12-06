'use client'

import { useState, useCallback, useMemo } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Plus,
  Sparkles,
  Layout,
  Upload,
  Images,
  UserPlus,
  Save,
  RotateCcw,
  Coins,
  Download,
  RefreshCw,
  Play,
} from 'lucide-react'
import { ROUTES } from '@/lib/config/constants'

interface FABAction {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  href?: string
  onClick?: () => void
  primary?: boolean
}

// Page-specific action configurations
const pageActions: Record<string, FABAction[]> = {
  [ROUTES.dashboard]: [
    { id: 'create', label: 'Create New', icon: Sparkles, href: ROUTES.create, primary: true },
    { id: 'templates', label: 'Templates', icon: Layout, href: ROUTES.templates },
    { id: 'gallery', label: 'Gallery', icon: Images, href: ROUTES.gallery },
  ],
  [ROUTES.gallery]: [
    { id: 'upload', label: 'Upload', icon: Upload, primary: true },
    { id: 'create', label: 'Create New', icon: Sparkles, href: ROUTES.create },
  ],
  [ROUTES.templates]: [
    { id: 'use', label: 'Use Template', icon: Sparkles, href: ROUTES.create, primary: true },
  ],
  [ROUTES.bulk]: [
    { id: 'generate', label: 'Start Generation', icon: Play, primary: true },
    { id: 'create', label: 'Single Create', icon: Sparkles, href: ROUTES.create },
  ],
  [ROUTES.logoManagement]: [
    { id: 'upload', label: 'Upload Logo', icon: Upload, primary: true },
  ],
  [ROUTES.brandConfig]: [
    { id: 'save', label: 'Save Changes', icon: Save, primary: true },
    { id: 'reset', label: 'Reset', icon: RotateCcw },
  ],
  [ROUTES.team]: [
    { id: 'invite', label: 'Invite Member', icon: UserPlus, primary: true },
  ],
  [ROUTES.billing]: [
    { id: 'buy', label: 'Buy Credits', icon: Coins, onClick: () => {
      // Scroll to pricing section
      document.getElementById('pricing-section')?.scrollIntoView({ behavior: 'smooth' })
    }, primary: true },
  ],
  [ROUTES.analytics]: [
    { id: 'export', label: 'Export Report', icon: Download, primary: true },
    { id: 'refresh', label: 'Refresh', icon: RefreshCw },
  ],
}

// Default fallback actions
const defaultActions: FABAction[] = [
  { id: 'create', label: 'Create New', icon: Sparkles, href: ROUTES.create, primary: true },
]

export function FloatingActionButton() {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  // Get actions for current page
  const actions = useMemo(() => {
    // Find matching page config
    const exactMatch = pageActions[pathname]
    if (exactMatch) return exactMatch

    // Check for partial matches (e.g., /settings/brand matches /settings/brand/*)
    for (const [route, acts] of Object.entries(pageActions)) {
      if (pathname.startsWith(route)) return acts
    }

    return defaultActions
  }, [pathname])

  // Single action = no menu needed
  const isSingleAction = actions.length === 1

  // Check if FAB should be hidden (on create page)
  const shouldHide = pathname === ROUTES.create || pathname.startsWith('/create')

  const handleToggle = useCallback(() => {
    if (isSingleAction) {
      const action = actions[0]
      if (action.href) router.push(action.href)
      else if (action.onClick) action.onClick()
    } else {
      setIsOpen((prev) => !prev)
    }
  }, [isSingleAction, actions, router])

  const handleAction = useCallback((action: FABAction) => {
    if (action.onClick) action.onClick()
    else if (action.href) router.push(action.href)
    setIsOpen(false)
  }, [router])

  // Close on escape key
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && isOpen) {
      setIsOpen(false)
    }
  }, [isOpen])

  // Hide FAB on create page - after all hooks
  if (shouldHide) return null

  return (
    <div
      className={cn(
        'fixed z-40 md:hidden',  // Hide on desktop (md and above)
        'bottom-[76px] right-4',
      )}
      onKeyDown={handleKeyDown}
    >
      {/* Speed Dial Menu */}
      {!isSingleAction && (
        <div className={cn(
          'absolute bottom-16 right-0 flex flex-col-reverse gap-3',
          'transition-all duration-300',
          isOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'
        )}>
          {actions.map((action, index) => (
            <Tooltip key={action.id} delayDuration={0}>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="outline"
                  className={cn(
                    'size-12 rounded-full',
                    // Glassmorphism
                    'bg-white/70 dark:bg-slate-900/70',
                    'backdrop-blur-xl',
                    'border border-white/30 dark:border-white/10',
                    'shadow-lg',
                    // Hover
                    'hover:bg-white/90 dark:hover:bg-slate-800/90',
                    'hover:scale-105 hover:shadow-xl',
                    'transition-all duration-300',
                    // Primary variant
                    action.primary && 'bg-primary/90 text-white border-primary/50 hover:bg-primary',
                    // Stagger animation
                    isOpen && 'animate-in fade-in-0 slide-in-from-bottom-2',
                  )}
                  style={{
                    animationDelay: `${index * 50}ms`,
                    animationFillMode: 'both',
                  }}
                  onClick={() => handleAction(action)}
                >
                  <action.icon className="h-5 w-5" />
                  <span className="sr-only">{action.label}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left" sideOffset={12} className="font-medium">
                {action.label}
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      )}

      {/* Backdrop */}
      {isOpen && !isSingleAction && (
        <div
          className="fixed inset-0 bg-black/10 backdrop-blur-[2px] -z-10"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Main FAB */}
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <Button
            size="icon"
            className={cn(
              'size-14 rounded-full',
              // Glassmorphism
              'bg-white/80 dark:bg-slate-900/80',
              'backdrop-blur-xl',
              'border border-white/40 dark:border-white/10',
              'shadow-lg shadow-black/10',
              // Hover/Active
              'hover:bg-white/95 dark:hover:bg-slate-800/95',
              'hover:scale-105 hover:shadow-xl',
              'active:scale-95',
              'transition-all duration-300',
              // Open state
              isOpen && 'bg-primary text-white border-primary/50',
            )}
            onClick={handleToggle}
            aria-expanded={!isSingleAction ? isOpen : undefined}
            aria-label={isSingleAction ? actions[0].label : (isOpen ? 'Close menu' : 'Quick actions')}
          >
            {isSingleAction ? (
              (() => {
                const Icon = actions[0].icon
                return <Icon className="h-6 w-6 text-primary" />
              })()
            ) : (
              <Plus className={cn(
                'h-6 w-6 transition-transform duration-300',
                !isOpen && 'text-primary',
                isOpen && 'rotate-45 text-white'
              )} />
            )}
          </Button>
        </TooltipTrigger>
        {!isOpen && (
          <TooltipContent side="left" sideOffset={12} className="font-medium">
            {isSingleAction ? actions[0].label : 'Quick Actions'}
          </TooltipContent>
        )}
      </Tooltip>
    </div>
  )
}
