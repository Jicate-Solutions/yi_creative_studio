'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/auth-store'

/**
 * Safely check admin status after hydration
 * Prevents hydration mismatch by deferring to client-side
 *
 * @returns Object with isAdmin status and loading state
 */
export function useClientAdmin() {
  const { canManage, serverHydrated, _hasHydrated } = useAuthStore()
  const [isAdmin, setIsAdmin] = useState(false)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    // Wait for server hydration OR Zustand rehydration
    if (serverHydrated || _hasHydrated) {
      setIsAdmin(canManage())
      setIsReady(true)
    }
  }, [canManage, serverHydrated, _hasHydrated])

  return { isAdmin, isReady }
}
