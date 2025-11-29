'use client'

import { useRole } from '@/contexts/RoleContext'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ChevronDown,
  RotateCcw,
  Check,
  Crown,
  Edit,
  Eye,
  Loader2,
  Shield,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Icon mapping for roles
const ROLE_ICONS = {
  crown: Crown,
  edit: Edit,
  eye: Eye,
  shield: Shield,
} as const

function getRoleIcon(iconName: string) {
  return ROLE_ICONS[iconName as keyof typeof ROLE_ICONS] || Shield
}

export function RoleSwitcher() {
  const {
    activeRole,
    actualRole,
    availableRoles,
    switchRole,
    resetRole,
    canSwitchRoles,
    isSimulating,
    isLoading,
  } = useRole()

  // Don't render if user cannot switch roles
  if (!canSwitchRoles) return null

  // Show loading state
  if (isLoading) {
    return (
      <Button variant="outline" size="sm" disabled className="gap-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="hidden sm:inline">Loading...</span>
      </Button>
    )
  }

  if (!activeRole) return null

  const RoleIcon = getRoleIcon(activeRole.icon)

  return (
    <div className="flex items-center gap-2">
      {/* Simulation Indicator - Mobile */}
      {isSimulating && (
        <Badge
          variant="outline"
          className="sm:hidden items-center gap-1 animate-pulse border-amber-500/50 text-amber-600 bg-amber-50 dark:bg-amber-950/30 text-xs"
        >
          <Eye className="w-3 h-3" />
        </Badge>
      )}

      {/* Simulation Indicator - Desktop */}
      {isSimulating && (
        <Badge
          variant="outline"
          className="hidden sm:flex items-center gap-1.5 animate-pulse border-amber-500/50 text-amber-600 bg-amber-50 dark:bg-amber-950/30"
        >
          <Eye className="w-3 h-3" />
          Viewing as {activeRole.displayName}
        </Badge>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              'gap-2 transition-all',
              isSimulating && 'ring-2 ring-amber-500/30 border-amber-500/50'
            )}
          >
            <div
              className={cn(
                'w-6 h-6 rounded-full flex items-center justify-center',
                activeRole.color
              )}
            >
              <RoleIcon className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="hidden sm:inline">{activeRole.displayName}</span>
            <ChevronDown className="w-4 h-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-72">
          <DropdownMenuLabel className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-normal">
              Switch Role View
            </span>
            <span className="text-xs text-muted-foreground">
              {availableRoles.length} roles
            </span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          {/* Role List */}
          <div className="max-h-80 overflow-y-auto">
            {availableRoles.map((role) => {
              const Icon = getRoleIcon(role.icon)
              const isActive = role.id === activeRole.id
              const isActual = role.id === actualRole?.id

              return (
                <DropdownMenuItem
                  key={role.id}
                  onClick={() => switchRole(role.id)}
                  className={cn(
                    'flex items-center gap-3 cursor-pointer py-2.5',
                    isActive && 'bg-accent'
                  )}
                >
                  <div
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                      role.color
                    )}
                  >
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm truncate">
                        {role.displayName}
                      </p>
                      {isActual && (
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5 py-0 h-4"
                        >
                          You
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {role.description}
                    </p>
                  </div>
                  {isActive && (
                    <Check className="w-4 h-4 text-primary flex-shrink-0" />
                  )}
                </DropdownMenuItem>
              )
            })}
          </div>

          {/* Reset Button */}
          {isSimulating && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={resetRole}
                className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/30"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset to {actualRole?.displayName}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
