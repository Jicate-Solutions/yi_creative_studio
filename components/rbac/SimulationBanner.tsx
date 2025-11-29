'use client'

import { useRole } from '@/contexts/RoleContext'
import { AlertCircle, X, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function SimulationBanner() {
  const { isSimulating, activeRole, actualRole, resetRole } = useRole()

  if (!isSimulating || !activeRole) return null

  return (
    <div className="bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-800 px-4 py-2">
      <div className="container mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
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
          className="text-amber-600 hover:text-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/30 gap-1.5"
        >
          <span className="hidden sm:inline">Back to {actualRole?.displayName}</span>
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
