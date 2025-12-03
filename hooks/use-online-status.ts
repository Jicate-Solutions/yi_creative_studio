'use client'

import { useState, useEffect, useCallback } from 'react'

export interface OnlineStatus {
  isOnline: boolean
  wasOffline: boolean // Track if user was ever offline during session
}

/**
 * Hook to detect online/offline status
 * Uses navigator.onLine and event listeners for real-time updates
 *
 * @returns {OnlineStatus} Current online status
 */
export function useOnlineStatus(): OnlineStatus {
  // Initialize with true, will be updated on mount
  const [isOnline, setIsOnline] = useState(true)
  const [wasOffline, setWasOffline] = useState(false)

  // Set initial state on mount (client-side only)
  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      setIsOnline(navigator.onLine)
    }
  }, [])

  const handleOnline = useCallback(() => {
    setIsOnline(true)
  }, [])

  const handleOffline = useCallback(() => {
    setIsOnline(false)
    setWasOffline(true)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [handleOnline, handleOffline])

  return { isOnline, wasOffline }
}
