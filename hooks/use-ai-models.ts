'use client'

import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useCreativeStore } from '@/stores/creative-store'
import type { AIModel } from '@/types/database.types'

// Cache duration: 5 minutes - AI models rarely change
const CACHE_DURATION_MS = 5 * 60 * 1000
// Global cache timestamp to prevent refetch across component instances
let lastFetchTimestamp = 0

export function useAIModels() {
  // Memoize supabase client to prevent infinite refetch loops
  const supabase = useMemo(() => createClient(), [])
  const { models, setModels, selectedModel, selectModel } = useCreativeStore()
  const [isLoading, setIsLoading] = useState(false)
  const isFetching = useRef(false)

  const fetchModels = useCallback(async (force = false) => {
    // Skip if another instance is already fetching
    if (isFetching.current) return

    // Skip if cache is still valid (unless forced)
    const now = Date.now()
    if (!force && models.length > 0 && (now - lastFetchTimestamp) < CACHE_DURATION_MS) {
      return
    }

    isFetching.current = true
    setIsLoading(true)

    const { data, error } = await supabase
      .from('ai_models')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    isFetching.current = false
    setIsLoading(false)

    if (error) {
      console.error('Error fetching AI models:', error.message, `[${error.code}]`, error.details)
      return
    }

    lastFetchTimestamp = Date.now()
    setModels(data || [])
  }, [supabase, setModels, models.length])

  const getModelBySlug = useCallback((slug: string): AIModel | undefined => {
    return models.find(m => m.slug === slug)
  }, [models])

  const getModelById = useCallback((id: string): AIModel | undefined => {
    return models.find(m => m.id === id)
  }, [models])

  const getModelCost = useCallback((modelId?: string): number => {
    if (!modelId) return selectedModel?.credits_cost ?? 0
    const model = getModelById(modelId)
    return model?.credits_cost ?? 0
  }, [selectedModel, getModelById])

  // Fetch on mount only if cache is stale or empty
  useEffect(() => {
    const now = Date.now()
    const cacheStale = (now - lastFetchTimestamp) >= CACHE_DURATION_MS
    if (models.length === 0 || cacheStale) {
      fetchModels()
    }
  }, [fetchModels, models.length])

  // Auto-select default model when models load (only if no model currently selected)
  // Prefer Nano Banana Pro (gemini-3-pro-image-preview) for studio-quality 4K + precise text
  // rendering. Falls back to display_order=1 if Pro isn't available in this org's catalog.
  useEffect(() => {
    if (models.length > 0 && !selectedModel) {
      const proModel = models.find(m => m.model_id === 'gemini-3-pro-image-preview')
      const defaultModel = proModel || models[0]

      if (defaultModel) {
        console.log('[AI Models] Auto-selecting default model:', defaultModel.name, proModel ? '(Pro preferred)' : '(fallback to display_order=1)')
        selectModel(defaultModel.id)
      }
    }
  }, [models, selectedModel, selectModel])

  return {
    models,
    selectedModel,
    isLoading,
    fetchModels,
    selectModel,
    getModelBySlug,
    getModelById,
    getModelCost,
  }
}
