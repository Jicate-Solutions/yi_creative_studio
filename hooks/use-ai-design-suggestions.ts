'use client'

import { useCallback } from 'react'
import { useCreativeStore } from '@/stores/creative-store'
import type { DesignSuggestionsOutput } from '@/lib/prompts/services/design-suggestions'
import { THEMES, POSTER_STYLES } from '@/lib/config/design-constants'

/**
 * Hook for managing AI design suggestions in the Design Tab
 *
 * Provides per-tab AI toggles for:
 * - Theme suggestions
 * - Style suggestions
 * - Color suggestions
 *
 * Each tab has its own enable/disable toggle and loading state.
 * Suggestions are fetched once and shared across tabs.
 *
 * @param eventType - The event type/vertical slug (e.g., "blood_donation", "conference")
 * @param eventName - The event name/title
 */
export function useAIDesignSuggestions(eventType?: string, eventName?: string) {
  const {
    aiDesignSuggestions,
    formData,
    setEnableAITheme,
    setEnableAIStyle,
    setEnableAIColor,
    setAIThemeGenerating,
    setAIStyleGenerating,
    setAIColorGenerating,
    setAIThemeError,
    setAIStyleError,
    setAIColorError,
    setAIDesignSuggestions,
    clearAIThemeSuggestions,
    clearAIStyleSuggestions,
    clearAIColorSuggestions,
    clearAllAISuggestions,
    updateTheme,
    updateStyle,
  } = useCreativeStore()

  // Extract form data for API call
  const eventData = formData.formData as {
    eventType?: string
    eventName?: string
    title?: string
    guestName?: string
    guestDesignation?: string
    description?: string
  }

  const designData = formData.designData
  const hasSpeakerPhoto = designData.customization?.speakerPhoto?.enabled ?? false

  /**
   * Fetch AI suggestions from the API (shared across all tabs)
   */
  const fetchSuggestions = useCallback(async (tab: 'theme' | 'style' | 'color') => {
    // Set loading for the specific tab
    if (tab === 'theme') setAIThemeGenerating(true)
    else if (tab === 'style') setAIStyleGenerating(true)
    else setAIColorGenerating(true)

    try {
      const response = await fetch('/api/suggest-design', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType: eventType,  // Use passed parameter
          eventName: eventName || eventData.title,  // Use passed parameter with fallback
          currentTheme: designData.theme,
          currentStyle: designData.style,
          hasSpeakerPhoto,
          guestName: eventData.guestName,
          guestDesignation: eventData.guestDesignation,
          additionalContext: eventData.description,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to fetch design suggestions')
      }

      const suggestions: DesignSuggestionsOutput = await response.json()

      // Map suggestions with labels from config
      const themesWithLabels = suggestions.suggestedThemes.map((s) => {
        const theme = THEMES.find((t) => t.value === s.id)
        return {
          id: s.id,
          label: theme?.label || s.id,
          reason: s.reason,
        }
      })

      const stylesWithLabels = suggestions.suggestedStyles.map((s) => {
        const style = POSTER_STYLES.find((st) => st.value === s.id)
        return {
          id: s.id,
          label: style?.label || s.id,
          reason: s.reason,
        }
      })

      setAIDesignSuggestions({
        suggestedThemes: themesWithLabels,
        suggestedStyles: stylesWithLabels,
        visualElements: suggestions.visualElements,
        colorMood: suggestions.colorMood,
        creativeTips: suggestions.creativeTips || [],
        hasFetchedSuggestions: true,
      })
    } catch (error) {
      console.error('[useAIDesignSuggestions] Error:', error)
      const errorMsg = error instanceof Error ? error.message : 'Failed to generate suggestions'

      if (tab === 'theme') setAIThemeError(errorMsg)
      else if (tab === 'style') setAIStyleError(errorMsg)
      else setAIColorError(errorMsg)
    }
  }, [
    eventType,  // Use passed parameter
    eventName,  // Use passed parameter
    eventData.title,
    eventData.guestName,
    eventData.guestDesignation,
    eventData.description,
    designData.theme,
    designData.style,
    hasSpeakerPhoto,
    setAIThemeGenerating,
    setAIStyleGenerating,
    setAIColorGenerating,
    setAIThemeError,
    setAIStyleError,
    setAIColorError,
    setAIDesignSuggestions,
  ])

  /**
   * Toggle AI for Theme tab
   */
  const toggleAITheme = useCallback(
    async (enabled: boolean) => {
      setEnableAITheme(enabled)
      if (enabled && !aiDesignSuggestions.hasFetchedSuggestions) {
        await fetchSuggestions('theme')
      } else if (!enabled) {
        // Only clear if no other tabs have AI enabled
        if (!aiDesignSuggestions.enableAIStyle && !aiDesignSuggestions.enableAIColor) {
          clearAllAISuggestions()
        }
      }
    },
    [setEnableAITheme, fetchSuggestions, aiDesignSuggestions.hasFetchedSuggestions, aiDesignSuggestions.enableAIStyle, aiDesignSuggestions.enableAIColor, clearAllAISuggestions]
  )

  /**
   * Toggle AI for Style tab
   */
  const toggleAIStyle = useCallback(
    async (enabled: boolean) => {
      setEnableAIStyle(enabled)
      if (enabled && !aiDesignSuggestions.hasFetchedSuggestions) {
        await fetchSuggestions('style')
      } else if (!enabled) {
        if (!aiDesignSuggestions.enableAITheme && !aiDesignSuggestions.enableAIColor) {
          clearAllAISuggestions()
        }
      }
    },
    [setEnableAIStyle, fetchSuggestions, aiDesignSuggestions.hasFetchedSuggestions, aiDesignSuggestions.enableAITheme, aiDesignSuggestions.enableAIColor, clearAllAISuggestions]
  )

  /**
   * Toggle AI for Color tab
   */
  const toggleAIColor = useCallback(
    async (enabled: boolean) => {
      setEnableAIColor(enabled)
      if (enabled && !aiDesignSuggestions.hasFetchedSuggestions) {
        await fetchSuggestions('color')
      } else if (!enabled) {
        if (!aiDesignSuggestions.enableAITheme && !aiDesignSuggestions.enableAIStyle) {
          clearAllAISuggestions()
        }
      }
    },
    [setEnableAIColor, fetchSuggestions, aiDesignSuggestions.hasFetchedSuggestions, aiDesignSuggestions.enableAITheme, aiDesignSuggestions.enableAIStyle, clearAllAISuggestions]
  )

  /**
   * Refresh suggestions for a specific tab
   */
  const refreshSuggestions = useCallback(async (tab: 'theme' | 'style' | 'color') => {
    await fetchSuggestions(tab)
  }, [fetchSuggestions])

  /**
   * Select a suggested theme
   */
  const selectSuggestedTheme = useCallback(
    (themeId: string) => {
      updateTheme(themeId)
    },
    [updateTheme]
  )

  /**
   * Select a suggested style
   */
  const selectSuggestedStyle = useCallback(
    (styleId: string) => {
      updateStyle(styleId)
    },
    [updateStyle]
  )

  return {
    // Per-tab states
    theme: {
      enableAI: aiDesignSuggestions.enableAITheme,
      isGenerating: aiDesignSuggestions.isGeneratingThemes,
      error: aiDesignSuggestions.themeError,
      suggestions: aiDesignSuggestions.suggestedThemes,
      visualElements: aiDesignSuggestions.visualElements,
      creativeTips: aiDesignSuggestions.creativeTips,
      toggleAI: toggleAITheme,
      refresh: () => refreshSuggestions('theme'),
      hasSuggestions: aiDesignSuggestions.suggestedThemes.length > 0,
    },
    style: {
      enableAI: aiDesignSuggestions.enableAIStyle,
      isGenerating: aiDesignSuggestions.isGeneratingStyles,
      error: aiDesignSuggestions.styleError,
      suggestions: aiDesignSuggestions.suggestedStyles,
      creativeTips: aiDesignSuggestions.creativeTips,
      toggleAI: toggleAIStyle,
      refresh: () => refreshSuggestions('style'),
      hasSuggestions: aiDesignSuggestions.suggestedStyles.length > 0,
    },
    color: {
      enableAI: aiDesignSuggestions.enableAIColor,
      isGenerating: aiDesignSuggestions.isGeneratingColors,
      error: aiDesignSuggestions.colorError,
      colorMood: aiDesignSuggestions.colorMood,
      suggestedPalettes: aiDesignSuggestions.suggestedPalettes,
      creativeTips: aiDesignSuggestions.creativeTips,
      toggleAI: toggleAIColor,
      refresh: () => refreshSuggestions('color'),
      hasSuggestions: aiDesignSuggestions.colorMood.length > 0,
    },

    // Shared actions
    selectSuggestedTheme,
    selectSuggestedStyle,
    clearAllSuggestions: clearAllAISuggestions,

    // Helper to check if a theme is AI-suggested
    isThemeSuggested: (themeId: string) =>
      aiDesignSuggestions.suggestedThemes.some((t) => t.id === themeId),

    // Helper to check if a style is AI-suggested
    isStyleSuggested: (styleId: string) =>
      aiDesignSuggestions.suggestedStyles.some((s) => s.id === styleId),

    // Get suggestion reasons
    getThemeSuggestionReason: (themeId: string) =>
      aiDesignSuggestions.suggestedThemes.find((t) => t.id === themeId)?.reason,

    getStyleSuggestionReason: (styleId: string) =>
      aiDesignSuggestions.suggestedStyles.find((s) => s.id === styleId)?.reason,
  }
}
