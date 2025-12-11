'use client'

import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useCreativeStore } from '@/stores/creative-store'
import type { VerticalPreset } from '@/types/database.types'

// Re-export the type for convenience
export type { VerticalPreset }

// Cache duration: 5 minutes - verticals rarely change
const CACHE_DURATION_MS = 5 * 60 * 1000
// Global cache timestamp to prevent refetch across component instances
let lastFetchTimestamp = 0

export function useVerticals() {
  // Memoize supabase client to prevent recreation on every render
  const supabase = useMemo(() => createClient(), [])
  const { verticals, setVerticals, selectedVertical, selectVertical } = useCreativeStore()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isFetching = useRef(false)

  const fetchVerticals = useCallback(async (force = false) => {
    // Skip if another instance is already fetching
    if (isFetching.current) return

    // Skip if cache is still valid (unless forced)
    const now = Date.now()
    if (!force && verticals.length > 0 && (now - lastFetchTimestamp) < CACHE_DURATION_MS) {
      return
    }

    isFetching.current = true
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

      lastFetchTimestamp = Date.now()
      setVerticals(data || [])
    } catch (err) {
      console.error('Unexpected error fetching verticals:', err)
      setError(err instanceof Error ? err.message : 'Failed to load verticals')
    } finally {
      isFetching.current = false
      setIsLoading(false)
    }
  }, [supabase, setVerticals, verticals.length])

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

  // Fetch on mount only if cache is stale or empty
  useEffect(() => {
    const now = Date.now()
    const cacheStale = (now - lastFetchTimestamp) >= CACHE_DURATION_MS
    if (verticals.length === 0 || cacheStale) {
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
