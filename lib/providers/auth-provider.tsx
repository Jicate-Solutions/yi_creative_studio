'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import type { User, Session } from '@supabase/supabase-js'
import type { Organization, UserProfile, OrganizationMember } from '@/types/database.types'

// Timeout constants for auth operations
// Increased timeout to handle cold starts and slow connections
const AUTH_INIT_TIMEOUT_MS = 15000 // 15 seconds for initial auth (increased from 10)
const USER_DATA_TIMEOUT_MS = 8000 // 8 seconds for user data queries (increased from 5)

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: UserProfile | null
  isLoading: boolean
  isAuthenticated: boolean
  currentOrganization: Organization | null
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
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

        // Set current org (prefer stored one or first available)
        const storedOrgId = currentOrganization?.id
        const matchedOrg = storedOrgId
          ? orgs.find((o) => o.id === storedOrgId)
          : orgs[0]

        if (matchedOrg) {
          setCurrentOrganization(matchedOrg)
          const membership = memberships.find(
            (m) => (m.organizations as unknown as Organization)?.id === matchedOrg.id
          )
          if (membership) {
            setMembership(membership as OrganizationMember)
          }
        }
      }
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
          // Non-blocking: fetch user data in background - don't await
          fetchUserData(initialSession.user.id).catch(err =>
            console.warn('[Auth] Background user data fetch failed:', err)
          )
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
          await fetchUserData(newSession.user.id)
          console.log('User data fetched')
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

  // Don't render children until initialized
  if (!initialized) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isLoading,
        isAuthenticated,
        currentOrganization,
        signOut,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
