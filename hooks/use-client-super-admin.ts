'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/auth-store'

/**
 * Hook to safely check Super Admin status after client-side hydration.
 * Similar to useClientAdmin but checks for platform-level super admin access.
 *
 * Use this hook in client components that need to gate features for super admins only.
 * The isReady flag ensures we don't flash restricted content before hydration completes.
 */
export function useClientSuperAdmin() {
  const { checkSuperAdmin, serverHydrated, _hasHydrated } = useAuthStore()
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    // Wait for server hydration OR Zustand rehydration from localStorage
    if (serverHydrated || _hasHydrated) {
      setIsSuperAdmin(checkSuperAdmin())
      setIsReady(true)
    }
  }, [checkSuperAdmin, serverHydrated, _hasHydrated])

  return { isSuperAdmin, isReady }
}
