'use client'

import { useState, useEffect } from 'react'
import { useGoogleCalendarConnection } from '@/hooks/use-google-calendar-connection'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import {
  CheckCircle2,
  Loader2,
  RefreshCw,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'

// Google icon SVG
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}

interface GoogleCalendarConnectProps {
  organizationId: string
  /** Compact mode for inline usage */
  compact?: boolean
  /** Show as card or inline button */
  variant?: 'card' | 'inline' | 'button'
  /** Custom class name */
  className?: string
}

export function GoogleCalendarConnect({
  organizationId,
  compact = false,
  variant = 'button',
  className,
}: GoogleCalendarConnectProps) {
  const {
    status,
    isLoading,
    connect,
    disconnect,
    syncNow,
  } = useGoogleCalendarConnection({ organizationId })

  const [showDisconnect, setShowDisconnect] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [isDisconnecting, setIsDisconnecting] = useState(false)

  const handleSync = async () => {
    setIsSyncing(true)
    try {
      await syncNow()
    } finally {
      setIsSyncing(false)
    }
  }

  const handleDisconnect = async () => {
    setIsDisconnecting(true)
    try {
      await disconnect(false) // Keep events
      setShowDisconnect(false)
    } finally {
      setIsDisconnecting(false)
    }
  }

  // Loading state
  if (isLoading) {
    if (variant === 'button') {
      return <Skeleton className="h-10 w-48" />
    }
    return <Skeleton className={cn('h-12 w-full', className)} />
  }

  // Not connected - show sign in button
  if (!status?.connected) {
    if (variant === 'button' || variant === 'inline') {
      return (
        <Button
          onClick={connect}
          variant="outline"
          className={cn(
            'gap-2 border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800',
            className
          )}
        >
          <GoogleIcon className="h-4 w-4" />
          Sign in with Google
        </Button>
      )
    }

    // Card variant
    return (
      <div
        className={cn(
          'flex items-center justify-between rounded-lg border border-dashed p-4',
          className
        )}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
            <GoogleIcon className="h-5 w-5" />
          </div>
          <div>
            <p className="font-medium">Google Calendar</p>
            <p className="text-sm text-muted-foreground">
              Import events automatically
            </p>
          </div>
        </div>
        <Button onClick={connect} className="gap-2">
          <GoogleIcon className="h-4 w-4" />
          Connect
        </Button>
      </div>
    )
  }

  // Connected state
  if (compact || variant === 'button') {
    return (
      <>
        <div className={cn('flex items-center gap-2', className)}>
          <Badge
            variant="outline"
            className="gap-1.5 border-green-500 text-green-600"
          >
            <CheckCircle2 className="h-3 w-3" />
            Google Calendar
          </Badge>
        </div>

        <AlertDialog open={showDisconnect} onOpenChange={setShowDisconnect}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Disconnect Google Calendar?</AlertDialogTitle>
              <AlertDialogDescription>
                Events will stop syncing. Your existing synced events will be
                kept.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDisconnect}
                disabled={isDisconnecting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDisconnecting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Disconnect
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    )
  }

  // Inline or card variant - connected
  return (
    <>
      <div
        className={cn(
          'flex items-center justify-between rounded-lg border p-4',
          className
        )}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
            <GoogleIcon className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-medium">Google Calendar</p>
              <Badge
                variant="outline"
                className="border-green-500 text-green-600"
              >
                <CheckCircle2 className="mr-1 h-3 w-3" />
                Connected
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {status.calendarName || 'Primary Calendar'}
              {status.lastSyncAt && (
                <span className="ml-2">
                  · Synced{' '}
                  {formatDistanceToNow(new Date(status.lastSyncAt), {
                    addSuffix: true,
                  })}
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSync}
            disabled={isSyncing}
          >
            {isSyncing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Sync
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDisconnect(true)}
            className="text-muted-foreground hover:text-destructive"
          >
            Disconnect
          </Button>
        </div>
      </div>

      <AlertDialog open={showDisconnect} onOpenChange={setShowDisconnect}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect Google Calendar?</AlertDialogTitle>
            <AlertDialogDescription>
              Events will stop syncing. Your existing synced events will be
              kept.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDisconnect}
              disabled={isDisconnecting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDisconnecting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Disconnect
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
