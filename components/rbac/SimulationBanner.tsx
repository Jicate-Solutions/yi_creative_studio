'use client'

import { useRole } from '@/contexts/RoleContext'
import { AlertCircle, X, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function SimulationBanner() {
  const { isSimulating, activeRole, actualRole, resetRole } = useRole()

  if (!isSimulating || !activeRole) return null

  return (
    <div className="bg-warning-muted shadow-[inset_0_-1px_0_hsl(var(--warning)/0.2)] px-4 py-2">
      <div className="container mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-warning">
          <Eye className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm">
            Viewing as{' '}
            <strong className="font-semibold">{activeRole.displayName}</strong>
            <span className="hidden sm:inline">
              {' '}
              - Some features may be hidden or disabled
            </span>
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={resetRole}
          className="text-warning hover:text-warning hover:bg-warning/10 gap-1.5"
        >
          <span className="hidden sm:inline">Back to {actualRole?.displayName}</span>
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
