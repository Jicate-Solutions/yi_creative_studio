'use client'

import { useState, useCallback, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useCreativeStore } from '@/stores/creative-store'
import type { AIModel } from '@/types/database.types'

export function useAIModels() {
  const supabase = createClient()
  const { models, setModels, selectedModel, selectModel } = useCreativeStore()
  const [isLoading, setIsLoading] = useState(false)

  const fetchModels = useCallback(async () => {
    setIsLoading(true)

    const { data, error } = await supabase
      .from('ai_models')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    setIsLoading(false)

    if (error) {
      console.error('Error fetching AI models:', error)
      return
    }

    setModels(data || [])
  }, [supabase, setModels])

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

  // Fetch on mount
  useEffect(() => {
    if (models.length === 0) {
      fetchModels()
    }
  }, [fetchModels, models.length])

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
