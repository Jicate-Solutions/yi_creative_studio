'use client'

import { WifiOff } from 'lucide-react'
import { useOnlineStatus } from '@/hooks'

/**
 * Offline Banner Component
 * Displays a persistent warning banner when the user is offline
 * Per PRD Edge Case E04: "You're offline. Connect to internet to generate creatives."
 */
export function OfflineBanner() {
  const { isOnline } = useOnlineStatus()

  if (isOnline) return null

  return (
    <div className="bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-800 px-4 py-2">
      <div className="container mx-auto flex items-center justify-center gap-2 text-amber-700 dark:text-amber-400">
        <WifiOff className="w-4 h-4 flex-shrink-0" />
        <span className="text-sm font-medium">
          You&apos;re offline. Connect to internet to generate creatives.
        </span>
      </div>
    </div>
  )
}
