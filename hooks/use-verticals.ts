'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useCreativeStore } from '@/stores/creative-store'
import type { VerticalPreset } from '@/types/database.types'

// Re-export the type for convenience
export type { VerticalPreset }

export function useVerticals() {
  // Memoize supabase client to prevent recreation on every render
  const supabase = useMemo(() => createClient(), [])
  const { verticals, setVerticals, selectedVertical, selectVertical } = useCreativeStore()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchVerticals = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from('vertical_presets')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })

      if (fetchError) {
        console.error('Error fetching verticals:', fetchError)
        setError(fetchError.message)
        return
      }

      setVerticals(data || [])
    } catch (err) {
      console.error('Unexpected error fetching verticals:', err)
      setError(err instanceof Error ? err.message : 'Failed to load verticals')
    } finally {
      setIsLoading(false)
    }
  }, [supabase, setVerticals])

  const getVerticalBySlug = useCallback(
    (slug: string): VerticalPreset | undefined => {
      return verticals.find((v) => v.slug === slug)
    },
    [verticals]
  )

  const getVerticalById = useCallback(
    (id: string): VerticalPreset | undefined => {
      return verticals.find((v) => v.id === id)
    },
    [verticals]
  )

  // Fetch on mount
  useEffect(() => {
    if (verticals.length === 0) {
      fetchVerticals()
    }
  }, [fetchVerticals, verticals.length])

  return {
    verticals,
    selectedVertical,
    isLoading,
    error,
    fetchVerticals,
    selectVertical,
    getVerticalBySlug,
    getVerticalById,
  }
}
