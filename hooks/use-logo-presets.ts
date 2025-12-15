'use client'

import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import type {
  LogoPreset,
  LogoPresetRow,
  CreateLogoPresetInput,
  UpdateLogoPresetInput
} from '@/types/logo-presets'
import { toast } from 'sonner'

// Cache duration: 5 minutes - presets don't change frequently
const CACHE_DURATION_MS = 5 * 60 * 1000
// Global cache tracking per organization
const presetsCacheMap = new Map<string, number>()

export function useLogoPresets() {
  // Memoize supabase client to prevent infinite refetch loops
  const supabase = useMemo(() => createClient(), [])
  const { currentOrganization, user } = useAuthStore()

  const [presets, setPresets] = useState<LogoPreset[]>([])
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
    const lastFetch = presetsCacheMap.get(currentOrganization.id) || 0
    if (!force && presets.length > 0 && (now - lastFetch) < CACHE_DURATION_MS) {
      return
    }

    isFetching.current = true
    setIsLoading(true)
    setError(null)

    // Note: logo_presets table may not be in generated types yet
    const { data, error: fetchError } = await (supabase as any)
      .from('logo_presets')
      .select('*')
      .eq('organization_id', currentOrganization.id)
      .order('is_default', { ascending: false })
      .order('name', { ascending: true })

    isFetching.current = false
    setIsLoading(false)

    if (fetchError) {
      setError('Failed to fetch logo presets')
      toast.error('Failed to fetch logo presets')
      return
    }

    presetsCacheMap.set(currentOrganization.id, Date.now())
    setPresets((data as LogoPresetRow[]) || [])
  }, [currentOrganization?.id, supabase, presets.length])

  // Create a new preset
  const createPreset = useCallback(async (
    input: CreateLogoPresetInput
  ): Promise<LogoPreset | null> => {
    if (!currentOrganization?.id) {
      toast.error('No organization selected')
      return null
    }

    if (input.placements.length === 0) {
      toast.error('Please position at least one logo before saving')
      return null
    }

    setIsLoading(true)
    setError(null)

    try {
      // If setting as default, unset existing defaults first
      if (input.is_default) {
        await (supabase as any)
          .from('logo_presets')
          .update({ is_default: false })
          .eq('organization_id', currentOrganization.id)
          .eq('is_default', true)
      }

      const { data, error: createError } = await (supabase as any)
        .from('logo_presets')
        .insert({
          organization_id: currentOrganization.id,
          name: input.name,
          description: input.description || null,
          is_default: input.is_default || false,
          placements: input.placements,
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
      toast.success('Logo configuration saved')
      return data as LogoPreset
    } catch (err) {
      console.error('Error creating logo preset:', err)
      setError('Failed to create preset')
      toast.error('Failed to save logo configuration')
      return null
    } finally {
      setIsLoading(false)
    }
  }, [currentOrganization?.id, user?.id, supabase, fetchPresets])

  // Update an existing preset
  const updatePreset = useCallback(async (
    presetId: string,
    input: UpdateLogoPresetInput
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
        await (supabase as any)
          .from('logo_presets')
          .update({ is_default: false })
          .eq('organization_id', currentOrganization.id)
          .eq('is_default', true)
          .neq('id', presetId)
      }

      const updateData: Record<string, unknown> = {}
      if (input.name !== undefined) updateData.name = input.name
      if (input.description !== undefined) updateData.description = input.description
      if (input.is_default !== undefined) updateData.is_default = input.is_default
      if (input.placements !== undefined) updateData.placements = input.placements

      const { error: updateError } = await (supabase as any)
        .from('logo_presets')
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
      console.error('Error updating logo preset:', err)
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
      const { error: deleteError } = await (supabase as any)
        .from('logo_presets')
        .delete()
        .eq('id', presetId)
        .eq('organization_id', currentOrganization.id)

      if (deleteError) throw deleteError

      await fetchPresets(true)
      toast.success('Preset deleted')
      return true
    } catch (err) {
      console.error('Error deleting logo preset:', err)
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
      const { error: updateError } = await (supabase as any)
        .from('logo_presets')
        .update({ is_default: false })
        .eq('organization_id', currentOrganization.id)
        .eq('is_default', true)

      if (updateError) throw updateError

      await fetchPresets(true)
      toast.success('Default preset cleared')
      return true
    } catch (err) {
      console.error('Error clearing default preset:', err)
      setError('Failed to clear default')
      toast.error('Failed to clear default preset')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [currentOrganization?.id, supabase, fetchPresets])

  // Fetch presets on mount only if cache is stale or empty
  useEffect(() => {
    const now = Date.now()
    const lastFetch = currentOrganization?.id
      ? presetsCacheMap.get(currentOrganization.id) || 0
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
  }
}
