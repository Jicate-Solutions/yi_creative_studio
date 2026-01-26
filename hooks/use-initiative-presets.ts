'use client'

import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import type {
  InitiativePresetRow,
  InitiativePresetInput,
  InitiativePresetUpdateInput,
} from '@/types/initiative-presets'
import { toast } from 'sonner'

// Cache duration: 5 minutes - presets don't change frequently
const CACHE_DURATION_MS = 5 * 60 * 1000
// Global cache tracking per organization
const initiativePresetsCacheMap = new Map<string, number>()

/**
 * Custom hook for managing initiative/chapter name configuration presets (Row 3)
 *
 * Enables saving and loading initiative text configurations as reusable presets
 * to reduce typing time.
 *
 * Follows the same pattern as useFooterPresets for consistency.
 */
export function useInitiativePresets() {
  // Memoize supabase client to prevent infinite refetch loops
  const supabase = useMemo(() => createClient(), [])
  const { currentOrganization, user } = useAuthStore()

  const [presets, setPresets] = useState<InitiativePresetRow[]>([])
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
    const lastFetch = initiativePresetsCacheMap.get(currentOrganization.id) || 0
    if (!force && presets.length > 0 && (now - lastFetch) < CACHE_DURATION_MS) {
      return
    }

    isFetching.current = true
    setIsLoading(true)
    setError(null)

    // Note: initiative_presets table may not be in generated types yet
    const { data, error: fetchError } = await (supabase as unknown as {
      from: (table: string) => {
        select: (columns: string) => {
          eq: (column: string, value: string) => {
            order: (column: string, options: { ascending: boolean }) => {
              order: (column: string, options: { ascending: boolean }) => Promise<{
                data: InitiativePresetRow[] | null
                error: { message: string } | null
              }>
            }
          }
        }
      }
    })
      .from('initiative_presets')
      .select('*')
      .eq('organization_id', currentOrganization.id)
      .order('is_default', { ascending: false })
      .order('name', { ascending: true })

    isFetching.current = false
    setIsLoading(false)

    if (fetchError) {
      setError('Failed to fetch initiative presets')
      toast.error('Failed to fetch initiative presets')
      return
    }

    initiativePresetsCacheMap.set(currentOrganization.id, Date.now())
    setPresets((data as InitiativePresetRow[]) || [])
  }, [currentOrganization?.id, supabase, presets.length])

  // Create a new preset
  const createPreset = useCallback(async (
    input: InitiativePresetInput
  ): Promise<InitiativePresetRow | null> => {
    if (!currentOrganization?.id) {
      toast.error('No organization selected')
      return null
    }

    if (!input.config) {
      toast.error('No initiative configuration to save')
      return null
    }

    setIsLoading(true)
    setError(null)

    try {
      // If setting as default, unset existing defaults first
      if (input.is_default) {
        await (supabase as unknown as {
          from: (table: string) => {
            update: (data: { is_default: boolean }) => {
              eq: (column: string, value: string) => {
                eq: (column: string, value: boolean) => Promise<{ error: { message: string } | null }>
              }
            }
          }
        })
          .from('initiative_presets')
          .update({ is_default: false })
          .eq('organization_id', currentOrganization.id)
          .eq('is_default', true)
      }

      const { data, error: createError } = await (supabase as unknown as {
        from: (table: string) => {
          insert: (data: Record<string, unknown>) => {
            select: () => {
              single: () => Promise<{
                data: InitiativePresetRow | null
                error: { message: string; code?: string } | null
              }>
            }
          }
        }
      })
        .from('initiative_presets')
        .insert({
          organization_id: currentOrganization.id,
          name: input.name,
          description: input.description || null,
          is_default: input.is_default || false,
          config: input.config,
          created_by: user?.id || null,
        })
        .select()
        .single()

      if (createError) {
        if ((createError as { code?: string }).code === '23505') {
          toast.error('A preset with this name already exists')
          return null
        }
        throw createError
      }

      await fetchPresets(true)
      toast.success('Initiative text saved')
      return data as InitiativePresetRow
    } catch (err) {
      console.error('Error creating initiative preset:', err)
      setError('Failed to create preset')
      toast.error('Failed to save initiative configuration')
      return null
    } finally {
      setIsLoading(false)
    }
  }, [currentOrganization?.id, user?.id, supabase, fetchPresets])

  // Update an existing preset
  const updatePreset = useCallback(async (
    presetId: string,
    input: InitiativePresetUpdateInput
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
        await (supabase as unknown as {
          from: (table: string) => {
            update: (data: { is_default: boolean }) => {
              eq: (column: string, value: string) => {
                eq: (column: string, value: boolean) => {
                  neq: (column: string, value: string) => Promise<{ error: { message: string } | null }>
                }
              }
            }
          }
        })
          .from('initiative_presets')
          .update({ is_default: false })
          .eq('organization_id', currentOrganization.id)
          .eq('is_default', true)
          .neq('id', presetId)
      }

      const updateData: Record<string, unknown> = {}
      if (input.name !== undefined) updateData.name = input.name
      if (input.description !== undefined) updateData.description = input.description
      if (input.is_default !== undefined) updateData.is_default = input.is_default
      if (input.config !== undefined) updateData.config = input.config

      const { error: updateError } = await (supabase as unknown as {
        from: (table: string) => {
          update: (data: Record<string, unknown>) => {
            eq: (column: string, value: string) => {
              eq: (column: string, value: string) => Promise<{
                error: { message: string; code?: string } | null
              }>
            }
          }
        }
      })
        .from('initiative_presets')
        .update(updateData)
        .eq('id', presetId)
        .eq('organization_id', currentOrganization.id)

      if (updateError) {
        if ((updateError as { code?: string }).code === '23505') {
          toast.error('A preset with this name already exists')
          return false
        }
        throw updateError
      }

      await fetchPresets(true)
      toast.success('Preset updated')
      return true
    } catch (err) {
      console.error('Error updating initiative preset:', err)
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
      const { error: deleteError } = await (supabase as unknown as {
        from: (table: string) => {
          delete: () => {
            eq: (column: string, value: string) => {
              eq: (column: string, value: string) => Promise<{
                error: { message: string } | null
              }>
            }
          }
        }
      })
        .from('initiative_presets')
        .delete()
        .eq('id', presetId)
        .eq('organization_id', currentOrganization.id)

      if (deleteError) throw deleteError

      await fetchPresets(true)
      toast.success('Preset deleted')
      return true
    } catch (err) {
      console.error('Error deleting initiative preset:', err)
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
      const { error: updateError } = await (supabase as unknown as {
        from: (table: string) => {
          update: (data: { is_default: boolean }) => {
            eq: (column: string, value: string) => {
              eq: (column: string, value: boolean) => Promise<{
                error: { message: string } | null
              }>
            }
          }
        }
      })
        .from('initiative_presets')
        .update({ is_default: false })
        .eq('organization_id', currentOrganization.id)
        .eq('is_default', true)

      if (updateError) throw updateError

      await fetchPresets(true)
      toast.success('Default preset cleared')
      return true
    } catch (err) {
      console.error('Error clearing default initiative preset:', err)
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
      initiativePresetsCacheMap.delete(currentOrganization.id)
    }
  }, [currentOrganization?.id])

  // Fetch presets on mount only if cache is stale or empty
  useEffect(() => {
    const now = Date.now()
    const lastFetch = currentOrganization?.id
      ? initiativePresetsCacheMap.get(currentOrganization.id) || 0
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
