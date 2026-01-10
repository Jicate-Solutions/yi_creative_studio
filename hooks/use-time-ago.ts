import { useState, useEffect } from 'react'

/**
 * Custom hook to display relative time (e.g., "30s ago", "1m ago")
 * Updates every second to keep the display current
 * @param date - The date to calculate time difference from
 * @returns Formatted string like "30s ago", "2m ago", "1h ago"
 */
export function useTimeAgo(date: Date): string {
  const [timeAgo, setTimeAgo] = useState('')

  useEffect(() => {
    const updateTimeAgo = () => {
      const now = new Date()
      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

      if (diffInSeconds < 60) {
        setTimeAgo(`${diffInSeconds}s ago`)
      } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60)
        setTimeAgo(`${minutes}m ago`)
      } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600)
        setTimeAgo(`${hours}h ago`)
      } else {
        const days = Math.floor(diffInSeconds / 86400)
        setTimeAgo(`${days}d ago`)
      }
    }

    // Update immediately
    updateTimeAgo()

    // Update every second
    const intervalId = setInterval(updateTimeAgo, 1000)

    // Cleanup interval on unmount
    return () => clearInterval(intervalId)
  }, [date])

  return timeAgo
}
