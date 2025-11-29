'use client'

import { useAuthStore } from '@/stores/auth-store'
import { useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Organization, OrganizationMember, BrandConfig } from '@/types/database.types'
import { toast } from 'sonner'

export function useOrganization() {
  const supabase = createClient()
  const {
    currentOrganization,
    membership,
    organizations,
    setCurrentOrganization,
    setOrganizations,
    canManage,
  } = useAuthStore()

  const refreshOrganization = useCallback(async () => {
    if (!currentOrganization?.id) return

    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', currentOrganization.id)
      .single()

    if (error) {
      toast.error('Failed to refresh organization')
      return
    }

    setCurrentOrganization(data)

    // Update in the list too
    const updated = organizations.map((org) =>
      org.id === data.id ? data : org
    )
    setOrganizations(updated)
  }, [currentOrganization?.id, organizations, supabase, setCurrentOrganization, setOrganizations])

  const updateBrandConfig = useCallback(async (config: Partial<BrandConfig>) => {
    if (!currentOrganization?.id) {
      toast.error('No organization selected')
      return false
    }

    const currentConfig = (currentOrganization.brand_config as BrandConfig) || {}
    const newConfig = { ...currentConfig, ...config }

    const { error } = await supabase
      .from('organizations')
      .update({ brand_config: newConfig })
      .eq('id', currentOrganization.id)

    if (error) {
      toast.error('Failed to update brand configuration')
      return false
    }

    await refreshOrganization()
    toast.success('Brand configuration updated')
    return true
  }, [currentOrganization, supabase, refreshOrganization])

  const updateOrganization = useCallback(async (updates: Partial<Organization>) => {
    if (!currentOrganization?.id) {
      toast.error('No organization selected')
      return false
    }

    const { error } = await supabase
      .from('organizations')
      .update(updates)
      .eq('id', currentOrganization.id)

    if (error) {
      toast.error('Failed to update organization')
      return false
    }

    await refreshOrganization()
    toast.success('Organization updated')
    return true
  }, [currentOrganization, supabase, refreshOrganization])

  const getBrandConfig = useCallback((): BrandConfig | null => {
    return currentOrganization?.brand_config as BrandConfig | null
  }, [currentOrganization])

  const creditsBalance = currentOrganization?.credits_balance ?? 0

  const canAfford = useCallback((credits: number) => {
    return creditsBalance >= credits
  }, [creditsBalance])

  return {
    organization: currentOrganization,
    membership,
    organizations,
    brandConfig: getBrandConfig(),
    creditsBalance,
    canAfford,
    canManage,
    refreshOrganization,
    updateBrandConfig,
    updateOrganization,
  }
}
