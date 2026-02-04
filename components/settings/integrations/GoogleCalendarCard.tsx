'use client'

import { useState } from 'react'
import { useGoogleCalendarConnection } from '@/hooks/use-google-calendar-connection'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Calendar,
  RefreshCw,
  Link2Off,
  CheckCircle2,
  AlertCircle,
  Clock,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'

interface GoogleCalendarCardProps {
  organizationId: string
}

export function GoogleCalendarCard({ organizationId }: GoogleCalendarCardProps) {
  const {
    status,
    isLoading,
    error,
    calendars,
    isLoadingCalendars,
    connect,
    disconnect,
    syncNow,
    selectCalendar,
    loadCalendars,
  } = useGoogleCalendarConnection({ organizationId })

  const [showDisconnect, setShowDisconnect] = useState(false)
  const [deleteEvents, setDeleteEvents] = useState(false)
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
      await disconnect(deleteEvents)
      setShowDisconnect(false)
    } finally {
      setIsDisconnecting(false)
    }
  }

  const handleCalendarChange = async (value: string) => {
    await selectCalendar(value)
  }

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    )
  }

  // Error state
  if (error) {
    return (
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            Connection Error
          </CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  // Not connected
  if (!status?.connected) {
    return (
      <Card className="border-dashed">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              <Calendar className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <CardTitle className="text-lg">Google Calendar</CardTitle>
              <CardDescription>
                Sync events from Google Calendar to create posters automatically
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Button onClick={connect} className="w-full sm:w-auto">
            <Calendar className="mr-2 h-4 w-4" />
            Connect Google Calendar
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Connected
  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                <Calendar className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2 text-lg">
                  Google Calendar
                  <Badge
                    variant="outline"
                    className="border-green-500 text-green-600"
                  >
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    Connected
                  </Badge>
                </CardTitle>
                <CardDescription className="mt-0.5">
                  {status.googleAccountEmail}
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Calendar Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Calendar</label>
            <Select
              value={status.calendarId || 'primary'}
              onValueChange={handleCalendarChange}
              onOpenChange={open => open && loadCalendars()}
            >
              <SelectTrigger className="w-full">
                <SelectValue>
                  {status.calendarName || 'Primary Calendar'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {isLoadingCalendars ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                ) : (
                  calendars.map(cal => (
                    <SelectItem key={cal.id} value={cal.id}>
                      {cal.summary}
                      {cal.primary && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          (Primary)
                        </span>
                      )}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Status Info */}
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Last sync:</span>
              <span>
                {status.lastSyncAt
                  ? formatDistanceToNow(new Date(status.lastSyncAt), {
                      addSuffix: true,
                    })
                  : 'Never'}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Events:</span>
              <span>{status.eventsCount}</span>
            </div>
            {status.syncStatus === 'error' && status.syncError && (
              <div className="flex w-full items-center gap-1.5 text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span>{status.syncError}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-2">
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
              Sync Now
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDisconnect(true)}
              className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
            >
              <Link2Off className="mr-2 h-4 w-4" />
              Disconnect
            </Button>
          </div>

          {/* Push Channel Status */}
          {!status.pushChannelActive && (
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-900/50 dark:bg-yellow-900/20">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                Real-time sync is not active. Events will sync every hour.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Disconnect Dialog */}
      <AlertDialog open={showDisconnect} onOpenChange={setShowDisconnect}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect Google Calendar?</AlertDialogTitle>
            <AlertDialogDescription>
              This will stop syncing events from Google Calendar. You can
              reconnect at any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex items-center space-x-2 py-4">
            <Checkbox
              id="delete-events"
              checked={deleteEvents}
              onCheckedChange={checked => setDeleteEvents(checked === true)}
            />
            <label
              htmlFor="delete-events"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Also delete synced events ({status.eventsCount} events)
            </label>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDisconnect}
              disabled={isDisconnecting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDisconnecting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Disconnect
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
