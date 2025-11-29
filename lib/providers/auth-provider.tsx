'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import type { User, Session } from '@supabase/supabase-js'
import type { Organization, UserProfile, OrganizationMember } from '@/types/database.types'

// Maximum time to wait for auth initialization before showing UI
// Increased to 15 seconds to handle slow connections and cold starts
const AUTH_TIMEOUT_MS = 15000

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
      // Run both queries in PARALLEL instead of sequential for better performance
      const [profileResult, membershipsResult] = await Promise.all([
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
      ])

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

    const initializeAuth = async () => {
      setLoading(true)

      try {
        // Simple approach: just try to get the session without aggressive timeout
        // Supabase client has its own timeout handling
        const { data: { session: initialSession }, error } = await supabase.auth.getSession()

        if (!isMounted) return

        if (error) {
          console.error('Auth session error:', error)
          // Still continue - user may not be logged in
        }

        if (initialSession) {
          setSession(initialSession)
          setUser(initialSession.user)
          // Non-blocking: fetch user data in background - don't await
          fetchUserData(initialSession.user.id).catch(console.error)
        }
      } catch (error) {
        // Log error but still mark as initialized to show UI
        if (isMounted) {
          console.error('Auth initialization error:', error)
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
        if (!isMounted) return

        if (event === 'SIGNED_IN' && newSession) {
          setSession(newSession)
          setUser(newSession.user)
          await fetchUserData(newSession.user.id)
        } else if (event === 'SIGNED_OUT') {
          reset()
        } else if (event === 'TOKEN_REFRESHED' && newSession) {
          setSession(newSession)
        }
      }
    )

    return () => {
      isMounted = false
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
