import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, Session } from '@supabase/supabase-js'
import type { UserProfile, Organization, OrganizationMember } from '@/types/database.types'
import type { UserRole } from '@/lib/config/constants'

interface AuthState {
  // Auth state
  user: User | null
  session: Session | null
  profile: UserProfile | null
  isLoading: boolean
  isAuthenticated: boolean
  serverHydrated: boolean // Flag to prevent double data fetching
  _hasHydrated: boolean // Flag to track Zustand store rehydration from localStorage

  // Super Admin state (platform-level)
  isSuperAdmin: boolean

  // Organization state
  currentOrganization: Organization | null
  membership: OrganizationMember | null
  organizations: Organization[]

  // Actions
  setUser: (user: User | null) => void
  setSession: (session: Session | null) => void
  setProfile: (profile: UserProfile | null) => void
  setLoading: (loading: boolean) => void
  setServerHydrated: (hydrated: boolean) => void
  setHasHydrated: (hydrated: boolean) => void
  setCurrentOrganization: (org: Organization | null) => void
  setMembership: (membership: OrganizationMember | null) => void
  setOrganizations: (orgs: Organization[]) => void
  switchOrganization: (orgId: string) => void
  reset: () => void

  // Computed helpers
  getUserRole: () => UserRole | null
  canEdit: () => boolean
  canManage: () => boolean

  // Super Admin helpers
  checkSuperAdmin: () => boolean
  canAccessPlatformDashboard: () => boolean
  canImpersonateUsers: () => boolean
}

const initialState = {
  user: null,
  session: null,
  profile: null,
  isLoading: true,
  isAuthenticated: false,
  serverHydrated: false,
  _hasHydrated: false,
  isSuperAdmin: false,
  currentOrganization: null,
  membership: null,
  organizations: [],
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setUser: (user) => set({
        user,
        isAuthenticated: !!user,
        isSuperAdmin: (user as any)?.is_super_admin === true, // Update Super Admin flag
      }),

      setSession: (session) => set({ session }),

      setProfile: (profile) => set({ profile }),

      setLoading: (isLoading) => set({ isLoading }),

      setServerHydrated: (serverHydrated) => set({ serverHydrated }),

      setHasHydrated: (_hasHydrated) => set({ _hasHydrated }),

      setCurrentOrganization: (currentOrganization) => set({ currentOrganization }),

      setMembership: (membership) => set({ membership }),

      setOrganizations: (organizations) => set({ organizations }),

      switchOrganization: (orgId) => {
        const { organizations } = get()
        const org = organizations.find(o => o.id === orgId)
        if (org) {
          set({ currentOrganization: org })
        }
      },

      reset: () => set(initialState),

      getUserRole: () => {
        const { membership } = get()
        return membership?.role as UserRole | null
      },

      canEdit: () => {
        const role = get().getUserRole()
        return role === 'admin' || role === 'editor'
      },

      canManage: () => {
        const role = get().getUserRole()
        return role === 'admin'
      },

      // Super Admin helpers
      checkSuperAdmin: () => {
        return get().isSuperAdmin
      },

      canAccessPlatformDashboard: () => {
        return get().isSuperAdmin
      },

      canImpersonateUsers: () => {
        return get().isSuperAdmin
      },
    }),
    {
      name: 'yi-auth-store',
      partialize: (state) => ({
        currentOrganization: state.currentOrganization,
        isSuperAdmin: state.isSuperAdmin, // Persist Super Admin flag
      }),
      onRehydrateStorage: () => () => {
        // Mark store as hydrated after localStorage data is restored
        // Use setState to properly trigger Zustand reactivity (direct mutation doesn't work)
        useAuthStore.setState({ _hasHydrated: true })

        // Debug logging in development only
        if (process.env.NODE_ENV === 'development') {
          const state = useAuthStore.getState()
          console.log('[auth-store] ✓ Zustand rehydration complete', {
            currentOrganization: state.currentOrganization?.name || 'none',
            hasServerData: state.serverHydrated,
            timestamp: new Date().toISOString()
          })
        }
      },
    }
  )
)
