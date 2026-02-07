'use client'

import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import type { User, Session } from '@supabase/supabase-js'
import type { Organization, UserProfile, OrganizationMember } from '@/types/database.types'

// Timeout constants for auth operations
// Fast timeout for good UX - auth state changes will recover if needed
const AUTH_INIT_TIMEOUT_MS = 2000 // 2 seconds for initial auth (optimized for fast failure recovery)
const USER_DATA_TIMEOUT_MS = 2000 // 2 seconds for user data queries (optimized)

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: UserProfile | null
  isLoading: boolean
  isAuthenticated: boolean
  currentOrganization: Organization | null
  initialized: boolean
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Memoize supabase client to prevent infinite auth request loops
  // Without this, createClient() creates new reference each render,
  // causing useCallback deps to change, triggering useEffect infinitely
  const supabase = useMemo(() => createClient(), [])
  const [initialized, setInitialized] = useState(false)

  const {
    user,
    session,
    profile,
    isLoading,
    isAuthenticated,
    currentOrganization,
    setUser,
    setSession,
    setProfile,
    setLoading,
    setCurrentOrganization,
    setMembership,
    setOrganizations,
    reset,
  } = useAuthStore()

  const fetchUserData = useCallback(async (userId: string) => {
    // Skip if already hydrated from server-side data in dashboard layout
    // This prevents duplicate API calls when the dashboard layout has already fetched the data
    const currentState = useAuthStore.getState()

    // Check multiple conditions - any of these means we have valid data
    const hasProfile = !!currentState.profile
    const hasOrganization = !!currentState.currentOrganization
    const isServerHydrated = currentState.serverHydrated

    // CRITICAL: Check for SSO login flag in URL
    const isBrowser = typeof window !== 'undefined'
    const params = isBrowser ? new URLSearchParams(window.location.search) : new URLSearchParams()
    const isSSOLogin = params.get('sso_login') === 'true'

    if (isSSOLogin) {
      console.log('[Auth] SSO login detected - forcing membership refresh (bypassing cache)')
      // Continue with fetch (don't return early)
    } else if ((isServerHydrated || (hasProfile && hasOrganization)) && hasProfile && hasOrganization) {
      // Original skip logic - only applies when NOT SSO login
      console.log('[Auth] Skipping fetchUserData - data already available:', {
        serverHydrated: isServerHydrated,
        hasProfile,
        hasOrganization
      })
      return
    }

    console.log('[Auth] Fetching user data - no cached data available')

    try {
      // Create timeout promise - client-side Supabase queries can hang
      const timeoutPromise = new Promise<null>((resolve) => {
        setTimeout(() => resolve(null), USER_DATA_TIMEOUT_MS)
      })

      // Race between queries and timeout
      const result = await Promise.race([
        Promise.all([
          supabase
            .from('user_profiles')
            .select('*')
            .eq('id', userId)
            .single(),
          supabase
            .from('organization_members')
            .select(`
              *,
              organizations (*)
            `)
            .eq('user_id', userId)
        ]),
        timeoutPromise
      ])

      // If timeout, try fetching via API route instead
      if (result === null) {
        console.warn('Client-side Supabase queries timed out, trying API route...')
        try {
          const response = await fetch('/api/auth/user-data')
          if (response.ok) {
            const data = await response.json()
            if (data.profile) setProfile(data.profile)
            if (data.membership) setMembership(data.membership)
            if (data.organization) setCurrentOrganization(data.organization)
            if (data.organizations) setOrganizations(data.organizations)
          }
        } catch (apiError) {
          console.error('API fallback also failed:', apiError)
        }
        return
      }

      const [profileResult, membershipsResult] = result

      const { data: profileData } = profileResult
      const { data: memberships } = membershipsResult

      if (profileData) {
        setProfile(profileData)
      }

      if (memberships && memberships.length > 0) {
        const orgs = memberships
          .map((m) => m.organizations as unknown as Organization)
          .filter(Boolean)

        setOrganizations(orgs)

        // Set current org (prefer stored one, fall back to first available)
        const storedOrgId = currentOrganization?.id
        // CRITICAL FIX: Ensure fallback to orgs[0] if stored org not found
        // This fixes SSO user 403 errors when their stored org (from localStorage) doesn't exist in memberships
        const matchedOrg = (storedOrgId ? orgs.find((o) => o.id === storedOrgId) : null) || orgs[0]

        // Track if we switched organizations (for logging/debugging)
        const switchedOrg = storedOrgId && matchedOrg?.id !== storedOrgId

        if (matchedOrg) {
          setCurrentOrganization(matchedOrg)
          const membership = memberships.find(
            (m) => (m.organizations as unknown as Organization)?.id === matchedOrg.id
          )
          if (membership) {
            setMembership(membership as OrganizationMember)
          }

          // Log organization switch for SSO users
          if (switchedOrg) {
            console.log('[Auth] Switched organization:', {
              from: storedOrgId,
              to: matchedOrg.id,
              name: matchedOrg.name,
              reason: 'Stored org not found in memberships (likely SSO migration)'
            })
          }
        }
      }

      // Note: sso_login URL parameter is already cleaned up in initializeAuth
      // No need to clear any flags here
    } catch (error) {
      console.error('Error fetching user data:', error)
    }
  }, [supabase, currentOrganization?.id, setProfile, setOrganizations, setCurrentOrganization, setMembership])

  const refreshSession = useCallback(async () => {
    const { data: { session: newSession } } = await supabase.auth.getSession()
    if (newSession) {
      setSession(newSession)
      setUser(newSession.user)
      await fetchUserData(newSession.user.id)
    }
  }, [supabase, setSession, setUser, fetchUserData])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    reset()
  }, [supabase, reset])

  useEffect(() => {
    let isMounted = true
    let timeoutId: NodeJS.Timeout | null = null

    const initializeAuth = async () => {
      // CRITICAL: Check for SSO login flag in URL
      const isBrowser = typeof window !== 'undefined'
      const params = isBrowser ? new URLSearchParams(window.location.search) : new URLSearchParams()
      const isSSOLogin = params.get('sso_login') === 'true'

      if (isSSOLogin) {
        console.log('[Auth] SSO login detected via URL parameter - forcing membership refresh')
        // NOTE: URL cleanup moved to AFTER fetchUserData completes (see below)
        // This ensures fetchUserData can also detect the SSO login flag
      }

      // OPTIMIZATION: Check if we already have valid data from server hydration
      // This prevents unnecessary auth API calls when dashboard layout already fetched data
      const currentState = useAuthStore.getState()
      if (currentState.serverHydrated && currentState.profile && currentState.currentOrganization) {
        // EXCEPTION: Always fetch for SSO logins, even if server-hydrated
        if (!isSSOLogin) {
          console.log('[Auth] Skipping initializeAuth - already server-hydrated')
          setLoading(false)
          setInitialized(true)
          return
        }
        console.log('[Auth] SSO login detected - bypassing server hydration optimization')
      }

      setLoading(true)

      try {
        // Create a timeout that resolves to a special timeout indicator
        const timeoutPromise = new Promise<{ timedOut: true }>((resolve) => {
          timeoutId = setTimeout(() => resolve({ timedOut: true }), AUTH_INIT_TIMEOUT_MS)
        })

        // Race between session fetch and timeout
        const result = await Promise.race([
          supabase.auth.getSession().then(res => ({ ...res, timedOut: false as const })),
          timeoutPromise
        ])

        // Clear timeout if session fetch won the race
        if (timeoutId) clearTimeout(timeoutId)

        if (!isMounted) return

        // Handle timeout case - don't treat as error, just log warning
        if ('timedOut' in result && result.timedOut) {
          console.warn('[Auth] Session fetch timed out - continuing without session. Auth state change will recover if user is logged in.')
          // Don't set error - the onAuthStateChange listener will handle recovery
          return
        }

        // Handle normal session result
        const { data: { session: initialSession }, error } = result

        if (error) {
          // Only log as warning, not error - this is expected for unauthenticated users
          console.warn('[Auth] getSession returned error:', error.message)
        }

        if (initialSession) {
          setSession(initialSession)
          setUser(initialSession.user)
          // CRITICAL: AWAIT fetchUserData for SSO logins to ensure currentOrganization is updated
          // This prevents 403 errors when user has stale org in localStorage
          await fetchUserData(initialSession.user.id)

          // CRITICAL: Clean up SSO URL parameter AFTER fetchUserData completes
          // This ensures fetchUserData can also detect the sso_login flag
          if (isSSOLogin && isBrowser) {
            params.delete('sso_login')
            const newUrl = window.location.pathname + (params.toString() ? '?' + params.toString() : '')
            window.history.replaceState({}, '', newUrl)
            console.log('[Auth] SSO login URL cleanup complete')
          }
        }
      } catch (error) {
        // Log error but still mark as initialized to show UI
        if (isMounted) {
          console.warn('[Auth] Initialization error (non-fatal):', error)
        }
        // Auth state changes will handle recovery if needed
      } finally {
        if (isMounted) {
          setLoading(false)
          setInitialized(true)
        }
      }
    }

    initializeAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('Auth state changed:', event, !!newSession)
        if (!isMounted) return

        if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && newSession) {
          console.log('Setting session and fetching user data for:', newSession.user.id)
          setSession(newSession)
          setUser(newSession.user)

          // CRITICAL: AWAIT fetchUserData to ensure currentOrganization is correct
          // This prevents 403 errors for SSO users with stale org in localStorage
          await fetchUserData(newSession.user.id)

          setLoading(false) // Clear loading after data fetch completes
          console.log('Session set, user data fetched successfully')
        } else if (event === 'SIGNED_OUT') {
          reset()
        } else if (event === 'TOKEN_REFRESHED' && newSession) {
          setSession(newSession)
        }
      }
    )

    return () => {
      isMounted = false
      if (timeoutId) clearTimeout(timeoutId)
      subscription.unsubscribe()
    }
  }, [supabase, setLoading, setSession, setUser, fetchUserData, reset])

  // Always render children immediately - no blocking spinner
  // The dashboard layout already gates access server-side via middleware
  // Components can check `initialized` or `isLoading` if they need to show loading states
  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isLoading,
        isAuthenticated,
        currentOrganization,
        initialized,
        signOut,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// Default auth context for SSR/pre-hydration - prevents throwing during server rendering
const defaultAuthContext: AuthContextType = {
  user: null,
  session: null,
  profile: null,
  isLoading: true,
  isAuthenticated: false,
  currentOrganization: null,
  initialized: false,
  signOut: async () => {},
  refreshSession: async () => {},
}

export function useAuth() {
  const context = useContext(AuthContext)
  // Return default context during SSR or before AuthProvider is mounted
  // This prevents "useAuth must be used within AuthProvider" errors during SSR
  if (context === undefined) {
    return defaultAuthContext
  }
  return context
}
