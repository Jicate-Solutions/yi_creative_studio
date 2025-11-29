'use client'

import { useState, useCallback, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useCreativeStore } from '@/stores/creative-store'
import type { VerticalPreset } from '@/types/database.types'

export function useVerticals() {
  const supabase = createClient()
  const { verticals, setVerticals, selectedVertical, selectVertical } = useCreativeStore()
  const [isLoading, setIsLoading] = useState(false)

  const fetchVerticals = useCallback(async () => {
    setIsLoading(true)

    const { data, error } = await supabase
      .from('vertical_presets')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    setIsLoading(false)

    if (error) {
      console.error('Error fetching verticals:', error)
      return
    }

    setVerticals(data || [])
  }, [supabase, setVerticals])

  const getVerticalBySlug = useCallback((slug: string): VerticalPreset | undefined => {
    return verticals.find(v => v.slug === slug)
  }, [verticals])

  const getVerticalById = useCallback((id: string): VerticalPreset | undefined => {
    return verticals.find(v => v.id === id)
  }, [verticals])

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
    fetchVerticals,
    selectVertical,
    getVerticalBySlug,
    getVerticalById,
  }
}
