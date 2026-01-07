'use client'

import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import type {
  VerticalLogoPresetRow,
  VerticalLogoPresetInput,
  VerticalLogoPresetUpdateInput,
} from '@/types/vertical-logo-presets'
import { toast } from 'sonner'

// Cache duration: 5 minutes - presets don't change frequently
const CACHE_DURATION_MS = 5 * 60 * 1000
// Global cache tracking per organization
const verticalPresetsCacheMap = new Map<string, number>()

/**
 * Custom hook for managing ROW 2 (Program Logos) presets
 *
 * Enables saving and loading logo configurations for the vertical/program
 * logos row in the logo strip as reusable presets.
 *
 * Follows the same pattern as useFooterPresets for consistency.
 */
export function useVerticalLogoPresets() {
  // Memoize supabase client to prevent infinite refetch loops
  const supabase = useMemo(() => createClient(), [])
  const { currentOrganization, user } = useAuthStore()

  const [presets, setPresets] = useState<VerticalLogoPresetRow[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isFetching = useRef(false)

  // Get the default preset
  const defaultPreset = useMemo(() => {
    return presets.find(p => p.is_default) || null
  }, [presets])

  // Fetch all presets for the organization
  const fetchPresets = useCallback(async (force = false) => {
    if (!currentOrganization?.id) return

    // Skip if another instance is already fetching
    if (isFetching.current) return

    // Skip if cache is still valid (unless forced)
    const now = Date.now()
    const lastFetch = verticalPresetsCacheMap.get(currentOrganization.id) || 0
    if (!force && presets.length > 0 && (now - lastFetch) < CACHE_DURATION_MS) {
      return
    }

    isFetching.current = true
    setIsLoading(true)
    setError(null)

    const { data, error: fetchError } = await supabase
      .from('vertical_logo_presets')
      .select('*')
      .eq('organization_id', currentOrganization.id)
      .order('is_default', { ascending: false })
      .order('name', { ascending: true })

    isFetching.current = false
    setIsLoading(false)

    if (fetchError) {
      setError('Failed to fetch program logo presets')
      toast.error('Failed to fetch program logo presets')
      return
    }

    verticalPresetsCacheMap.set(currentOrganization.id, Date.now())
    setPresets((data as VerticalLogoPresetRow[]) || [])
  }, [currentOrganization?.id, supabase, presets.length])

  // Create a new preset
  const createPreset = useCallback(async (
    input: VerticalLogoPresetInput
  ): Promise<VerticalLogoPresetRow | null> => {
    if (!currentOrganization?.id) {
      toast.error('No organization selected')
      return null
    }

    if (!input.logo_ids || input.logo_ids.length === 0) {
      toast.error('Please select at least one logo to save')
      return null
    }

    setIsLoading(true)
    setError(null)

    try {
      // If setting as default, unset existing defaults first
      if (input.is_default) {
        await supabase
          .from('vertical_logo_presets')
          .update({ is_default: false })
          .eq('organization_id', currentOrganization.id)
          .eq('is_default', true)
      }

      const { data, error: createError } = await supabase
        .from('vertical_logo_presets')
        .insert({
          organization_id: currentOrganization.id,
          name: input.name,
          description: input.description || null,
          is_default: input.is_default || false,
          logo_ids: input.logo_ids,
          created_by: user?.id || null,
        })
        .select()
        .single()

      if (createError) {
        if (createError.code === '23505') {
          toast.error('A preset with this name already exists')
          return null
        }
        throw createError
      }

      await fetchPresets(true)
      toast.success('Program logo preset saved')
      return data as VerticalLogoPresetRow
    } catch (err) {
      console.error('Error creating vertical logo preset:', err)
      setError('Failed to create preset')
      toast.error('Failed to save program logo preset')
      return null
    } finally {
      setIsLoading(false)
    }
  }, [currentOrganization?.id, user?.id, supabase, fetchPresets])

  // Update an existing preset
  const updatePreset = useCallback(async (
    presetId: string,
    input: VerticalLogoPresetUpdateInput
  ): Promise<boolean> => {
    if (!currentOrganization?.id) {
      toast.error('No organization selected')
      return false
    }

    setIsLoading(true)
    setError(null)

    try {
      // If setting as default, unset existing defaults first
      if (input.is_default) {
        await supabase
          .from('vertical_logo_presets')
          .update({ is_default: false })
          .eq('organization_id', currentOrganization.id)
          .eq('is_default', true)
          .neq('id', presetId)
      }

      const updateData: Record<string, unknown> = {}
      if (input.name !== undefined) updateData.name = input.name
      if (input.description !== undefined) updateData.description = input.description
      if (input.is_default !== undefined) updateData.is_default = input.is_default
      if (input.logo_ids !== undefined) updateData.logo_ids = input.logo_ids

      const { error: updateError } = await supabase
        .from('vertical_logo_presets')
        .update(updateData)
        .eq('id', presetId)
        .eq('organization_id', currentOrganization.id)

      if (updateError) {
        if (updateError.code === '23505') {
          toast.error('A preset with this name already exists')
          return false
        }
        throw updateError
      }

      await fetchPresets(true)
      toast.success('Preset updated')
      return true
    } catch (err) {
      console.error('Error updating vertical logo preset:', err)
      setError('Failed to update preset')
      toast.error('Failed to update preset')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [currentOrganization?.id, supabase, fetchPresets])

  // Delete a preset
  const deletePreset = useCallback(async (presetId: string): Promise<boolean> => {
    if (!currentOrganization?.id) {
      toast.error('No organization selected')
      return false
    }

    setIsLoading(true)
    setError(null)

    try {
      const { error: deleteError } = await supabase
        .from('vertical_logo_presets')
        .delete()
        .eq('id', presetId)
        .eq('organization_id', currentOrganization.id)

      if (deleteError) throw deleteError

      await fetchPresets(true)
      toast.success('Preset deleted')
      return true
    } catch (err) {
      console.error('Error deleting vertical logo preset:', err)
      setError('Failed to delete preset')
      toast.error('Failed to delete preset')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [currentOrganization?.id, supabase, fetchPresets])

  // Set a preset as default
  const setDefault = useCallback(async (presetId: string): Promise<boolean> => {
    return updatePreset(presetId, { is_default: true })
  }, [updatePreset])

  // Unset default (make no preset default)
  const unsetDefault = useCallback(async (): Promise<boolean> => {
    if (!currentOrganization?.id) {
      toast.error('No organization selected')
      return false
    }

    setIsLoading(true)
    setError(null)

    try {
      const { error: updateError } = await supabase
        .from('vertical_logo_presets')
        .update({ is_default: false })
        .eq('organization_id', currentOrganization.id)
        .eq('is_default', true)

      if (updateError) throw updateError

      await fetchPresets(true)
      toast.success('Default preset cleared')
      return true
    } catch (err) {
      console.error('Error clearing default vertical logo preset:', err)
      setError('Failed to clear default')
      toast.error('Failed to clear default preset')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [currentOrganization?.id, supabase, fetchPresets])

  // Invalidate cache for the current organization
  const invalidateCache = useCallback(() => {
    if (currentOrganization?.id) {
      verticalPresetsCacheMap.delete(currentOrganization.id)
    }
  }, [currentOrganization?.id])

  // Fetch presets on mount only if cache is stale or empty
  useEffect(() => {
    const now = Date.now()
    const lastFetch = currentOrganization?.id
      ? verticalPresetsCacheMap.get(currentOrganization.id) || 0
      : 0
    const cacheStale = (now - lastFetch) >= CACHE_DURATION_MS
    if (presets.length === 0 || cacheStale) {
      fetchPresets()
    }
  }, [fetchPresets, presets.length, currentOrganization?.id])

  return {
    presets,
    defaultPreset,
    isLoading,
    error,
    fetchPresets,
    createPreset,
    updatePreset,
    deletePreset,
    setDefault,
    unsetDefault,
    invalidateCache,
  }
}
