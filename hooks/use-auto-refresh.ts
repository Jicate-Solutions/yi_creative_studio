import { useEffect, useRef, useState } from 'react'

interface UseAutoRefreshOptions {
  enabled?: boolean
  interval?: number // milliseconds
  onRefresh: () => Promise<void> | void
}

/**
 * Custom hook for auto-refreshing data at specified intervals
 * @param enabled - Whether auto-refresh is enabled (default: true)
 * @param interval - Refresh interval in milliseconds (default: 30000ms / 30s)
 * @param onRefresh - Async function to call on each refresh
 * @returns Object with refresh state (isRefreshing, lastRefresh) and manual refresh function
 */
export function useAutoRefresh({
  enabled = true,
  interval = 30000, // 30 seconds default
  onRefresh,
}: UseAutoRefreshOptions) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const intervalRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    if (!enabled) return

    const refresh = async () => {
      setIsRefreshing(true)
      try {
        await onRefresh()
        setLastRefresh(new Date())
      } catch (error) {
        console.error('Auto-refresh failed:', error)
      } finally {
        setIsRefreshing(false)
      }
    }

    // Set up polling interval
    intervalRef.current = setInterval(refresh, interval)

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [enabled, interval, onRefresh])

  const manualRefresh = async () => {
    setIsRefreshing(true)
    try {
      await onRefresh()
      setLastRefresh(new Date())
    } finally {
      setIsRefreshing(false)
    }
  }

  return {
    isRefreshing,
    lastRefresh,
    manualRefresh,
  }
}
