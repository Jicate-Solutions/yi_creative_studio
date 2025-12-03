import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Creative, VerticalPreset, AIModel, OrganizationLogo, TemplateImage } from '@/types/database.types'
import type { LogoPosition } from '@/lib/config/constants'
import { getLockedPosition, isPositionLocked } from '@/lib/config/logo-locks'
import type { FieldSuggestion, SuggestableField } from '@/types/suggestions'
import type { CreationMode } from '@/types/design.types'
import type { DesignData, CustomizationData, ExportSettings, AspectRatioId, ResolutionId, ColorConfig, CustomColors } from '@/lib/config/design-constants'
import { DEFAULT_DESIGN_DATA, DEFAULT_COLOR_CONFIG } from '@/lib/config/design-constants'
import type { CreativeFormat, CreativeFormatId } from '@/lib/config/creative-formats'
import { CREATIVE_FORMATS, getFormatById } from '@/lib/config/creative-formats'

interface LogoPlacement {
  logoId: string
  position: LogoPosition
  logo?: OrganizationLogo
}

interface CreativeFormData {
  // Format selection (Canva-style)
  formatId: CreativeFormatId | null
  customDimensions: { width: number; height: number } | null

  verticalId: string | null
  modelId: string | null
  formData: Record<string, unknown>
  logosPlacements: LogoPlacement[]
  // Creation mode and design data
  creationMode: CreationMode
  templateId: string | null
  designData: DesignData
}

// AI Form Suggestion State
interface AIFormState {
  suggestions: Partial<Record<SuggestableField, FieldSuggestion | null>>
  isLoadingSuggestions: boolean
  suggestionError: string | null
}

// AI Design Suggestions State (for Design Tab)
export interface AIDesignSuggestion {
  id: string
  label: string
  reason: string
}

export interface AIDesignSuggestions {
  // Per-tab toggles
  enableAITheme: boolean
  enableAIStyle: boolean
  enableAIColor: boolean

  // Per-tab loading states
  isGeneratingThemes: boolean
  isGeneratingStyles: boolean
  isGeneratingColors: boolean

  // Per-tab errors
  themeError: string | null
  styleError: string | null
  colorError: string | null

  // AI-generated suggestions
  suggestedThemes: AIDesignSuggestion[]
  suggestedStyles: AIDesignSuggestion[]
  suggestedPalettes: AIDesignSuggestion[]     // Color palette suggestions
  visualElements: string[]                    // Objects/elements to include
  colorMood: string                           // Color psychology hint
  creativeTips: string[]                      // Additional design tips

  // Track if suggestions have been fetched
  hasFetchedSuggestions: boolean
}

const initialAIDesignSuggestions: AIDesignSuggestions = {
  enableAITheme: false,
  enableAIStyle: false,
  enableAIColor: false,
  isGeneratingThemes: false,
  isGeneratingStyles: false,
  isGeneratingColors: false,
  themeError: null,
  styleError: null,
  colorError: null,
  suggestedThemes: [],
  suggestedStyles: [],
  suggestedPalettes: [],
  visualElements: [],
  colorMood: '',
  creativeTips: [],
  hasFetchedSuggestions: false,
}

interface CreativeState {
  // Available data
  verticals: VerticalPreset[]
  models: AIModel[]
  logos: OrganizationLogo[]

  // Format selection (Canva-style)
  selectedFormat: CreativeFormat | null
  recentFormats: CreativeFormatId[]

  // Form state
  formData: CreativeFormData
  selectedVertical: VerticalPreset | null
  selectedModel: AIModel | null
  selectedTemplate: TemplateImage | null

  // AI Suggestion state
  aiForm: AIFormState

  // AI Design Suggestions state (Design Tab)
  aiDesignSuggestions: AIDesignSuggestions

  // Generation state
  isGenerating: boolean
  generationProgress: number
  generatedImage: string | null
  generationError: string | null

  // Gallery
  recentCreatives: Creative[]

  // Actions
  setVerticals: (verticals: VerticalPreset[]) => void
  setModels: (models: AIModel[]) => void
  setLogos: (logos: OrganizationLogo[]) => void

  // Format selection actions (Canva-style)
  selectFormat: (formatId: CreativeFormatId) => void
  setCustomDimensions: (width: number, height: number) => void
  clearCustomDimensions: () => void
  clearFormat: () => void
  getFormatDimensions: () => { width: number; height: number } | null

  selectVertical: (verticalId: string) => void
  selectModel: (modelId: string) => void
  selectTemplate: (template: TemplateImage | null) => void
  updateFormData: (data: Record<string, unknown>) => void

  addLogoPlacement: (logoId: string, position: LogoPosition) => void
  removeLogoPlacement: (logoId: string) => void
  updateLogoPosition: (logoId: string, position: LogoPosition) => void
  clearLogoPlacements: () => void

  setGenerating: (generating: boolean) => void
  setGenerationProgress: (progress: number) => void
  setGeneratedImage: (image: string | null) => void
  setGenerationError: (error: string | null) => void

  setRecentCreatives: (creatives: Creative[]) => void
  addCreative: (creative: Creative) => void

  // AI Suggestion Actions
  setSuggestions: (suggestions: Partial<Record<SuggestableField, FieldSuggestion | null>>) => void
  setLoadingSuggestions: (loading: boolean) => void
  setSuggestionError: (error: string | null) => void
  acceptSuggestion: (field: SuggestableField) => void
  dismissSuggestion: (field: SuggestableField) => void
  acceptAllSuggestions: () => void
  dismissAllSuggestions: () => void
  clearSuggestions: () => void

  // Design Mode Actions
  setCreationMode: (mode: CreationMode) => void
  setDesignData: (data: Partial<DesignData>) => void
  updateTheme: (themeId: string) => void
  updateStyle: (styleId: string) => void
  updateAspectRatio: (ratio: AspectRatioId) => void
  updateResolution: (resolution: ResolutionId) => void
  updateCustomization: (customization: Partial<CustomizationData>) => void
  updateExportSettings: (settings: Partial<ExportSettings>) => void
  resetDesignData: () => void

  // Color Configuration Actions
  setUseBrandColors: (enabled: boolean) => void
  setColorPalette: (paletteId: string | null) => void
  setCustomColors: (colors: CustomColors) => void
  resetColorConfig: () => void

  // AI Design Suggestions Actions (per-tab)
  setEnableAITheme: (enabled: boolean) => void
  setEnableAIStyle: (enabled: boolean) => void
  setEnableAIColor: (enabled: boolean) => void
  setAIThemeGenerating: (generating: boolean) => void
  setAIStyleGenerating: (generating: boolean) => void
  setAIColorGenerating: (generating: boolean) => void
  setAIThemeError: (error: string | null) => void
  setAIStyleError: (error: string | null) => void
  setAIColorError: (error: string | null) => void
  setAIDesignSuggestions: (suggestions: Partial<Pick<AIDesignSuggestions, 'suggestedThemes' | 'suggestedStyles' | 'suggestedPalettes' | 'visualElements' | 'colorMood' | 'creativeTips' | 'hasFetchedSuggestions'>>) => void
  clearAIThemeSuggestions: () => void
  clearAIStyleSuggestions: () => void
  clearAIColorSuggestions: () => void
  clearAllAISuggestions: () => void

  resetForm: () => void
}

const initialFormData: CreativeFormData = {
  // Format selection
  formatId: null,
  customDimensions: null,

  verticalId: null,
  modelId: null,
  formData: {},
  logosPlacements: [],
  creationMode: 'template',
  templateId: null,
  designData: DEFAULT_DESIGN_DATA,
}

// Max recent formats to track
const MAX_RECENT_FORMATS = 6

const initialAIFormState: AIFormState = {
  suggestions: {},
  isLoadingSuggestions: false,
  suggestionError: null,
}

export const useCreativeStore = create<CreativeState>()(
  persist(
    (set, get) => ({
      // Initial state
      verticals: [],
      models: [],
      logos: [],

      // Format selection state (Canva-style)
      selectedFormat: null,
      recentFormats: [],

      formData: initialFormData,
      selectedVertical: null,
      selectedModel: null,
      selectedTemplate: null,
      aiForm: initialAIFormState,
      aiDesignSuggestions: initialAIDesignSuggestions,
      isGenerating: false,
      generationProgress: 0,
      generatedImage: null,
      generationError: null,
      recentCreatives: [],

      // Actions
      setVerticals: (verticals) => set({ verticals }),

      setModels: (models) => set({ models }),

      setLogos: (logos) => set({ logos }),

      // Format selection actions (Canva-style)
      selectFormat: (formatId) => {
        const format = getFormatById(formatId)
        if (!format) return

        const { recentFormats } = get()

        // Update recent formats (add to front, remove duplicates, limit to max)
        const newRecent = [
          formatId,
          ...recentFormats.filter((id) => id !== formatId),
        ].slice(0, MAX_RECENT_FORMATS)

        set({
          selectedFormat: format,
          recentFormats: newRecent,
          formData: {
            ...get().formData,
            formatId,
            customDimensions: null,
          },
        })
      },

      setCustomDimensions: (width, height) =>
        set((state) => ({
          formData: {
            ...state.formData,
            customDimensions: { width, height },
          },
        })),

      clearCustomDimensions: () =>
        set((state) => ({
          formData: {
            ...state.formData,
            customDimensions: null,
          },
        })),

      clearFormat: () =>
        set((state) => ({
          selectedFormat: null,
          formData: {
            ...state.formData,
            formatId: null,
            customDimensions: null,
          },
        })),

      getFormatDimensions: () => {
        const { selectedFormat, formData } = get()

        // Custom dimensions take priority
        if (formData.customDimensions) {
          return formData.customDimensions
        }

        // Otherwise use format dimensions
        if (selectedFormat) {
          return { width: selectedFormat.width, height: selectedFormat.height }
        }

        return null
      },

      selectVertical: (verticalId) => {
        const { verticals } = get()
        const vertical = verticals.find((v) => v.id === verticalId)
        set({
          selectedVertical: vertical || null,
          formData: { ...get().formData, verticalId, formData: {} },
        })
      },

      selectModel: (modelId) => {
        const { models } = get()
        const model = models.find((m) => m.id === modelId)
        set({
          selectedModel: model || null,
          formData: { ...get().formData, modelId },
        })
      },

      selectTemplate: (template) => set({ selectedTemplate: template }),

      updateFormData: (data) =>
        set((state) => ({
          formData: {
            ...state.formData,
            formData: { ...state.formData.formData, ...data },
          },
        })),

      addLogoPlacement: (logoId, position) => {
        const { logos, formData } = get()
        const logo = logos.find((l) => l.id === logoId)
        const existing = formData.logosPlacements.find((p) => p.logoId === logoId)

        // PRD Edge Case E12: Maximum 4 logos per poster
        if (formData.logosPlacements.length >= 4 && !existing) {
          return // Silently reject - UI should prevent this
        }

        if (!existing && logo) {
          // Check if this logo has a locked position (Yi=top-left, CII=top-right)
          const lockedPosition = getLockedPosition(logo.name)
          const finalPosition = lockedPosition || position

          // If locked position is already occupied by another logo, swap positions
          let updatedPlacements = [...formData.logosPlacements]
          if (lockedPosition) {
            const occupyingPlacement = updatedPlacements.find(p => p.position === lockedPosition)
            if (occupyingPlacement && occupyingPlacement.logo) {
              // Only swap if the occupying logo is not also locked to that position
              const occupyingLocked = getLockedPosition(occupyingPlacement.logo.name)
              if (!occupyingLocked) {
                // Move the occupying logo to a different available position
                const availablePositions: LogoPosition[] = [
                  'bottom-left', 'bottom-center', 'bottom-right',
                  'mid-left', 'mid-right', 'center'
                ]
                const usedPositions = updatedPlacements.map(p => p.position)
                const newPosition = availablePositions.find(p => !usedPositions.includes(p) && p !== lockedPosition)
                if (newPosition) {
                  updatedPlacements = updatedPlacements.map(p =>
                    p.logoId === occupyingPlacement.logoId ? { ...p, position: newPosition } : p
                  )
                }
              }
            }
          }

          set({
            formData: {
              ...formData,
              logosPlacements: [...updatedPlacements, { logoId, position: finalPosition, logo }],
            },
          })
        } else if (!existing) {
          // Fallback if logo not found
          set({
            formData: {
              ...formData,
              logosPlacements: [...formData.logosPlacements, { logoId, position, logo }],
            },
          })
        }
      },

      removeLogoPlacement: (logoId) =>
        set((state) => ({
          formData: {
            ...state.formData,
            logosPlacements: state.formData.logosPlacements.filter((p) => p.logoId !== logoId),
          },
        })),

      updateLogoPosition: (logoId, position) =>
        set((state) => {
          // Find the placement being updated
          const placement = state.formData.logosPlacements.find(p => p.logoId === logoId)

          // If logo has a locked position, prevent position change
          if (placement?.logo && isPositionLocked(placement.logo.name)) {
            // Silently reject - locked logos cannot have their position changed
            return state
          }

          return {
            formData: {
              ...state.formData,
              logosPlacements: state.formData.logosPlacements.map((p) =>
                p.logoId === logoId ? { ...p, position } : p
              ),
            },
          }
        }),

      clearLogoPlacements: () =>
        set((state) => ({
          formData: { ...state.formData, logosPlacements: [] },
        })),

      setGenerating: (isGenerating) => set({ isGenerating }),

      setGenerationProgress: (generationProgress) => set({ generationProgress }),

      setGeneratedImage: (generatedImage) => set({ generatedImage }),

      setGenerationError: (generationError) => set({ generationError }),

      setRecentCreatives: (recentCreatives) => set({ recentCreatives }),

      addCreative: (creative) =>
        set((state) => ({
          recentCreatives: [creative, ...state.recentCreatives].slice(0, 20),
        })),

      // AI Suggestion Actions
      setSuggestions: (suggestions) =>
        set((state) => ({
          aiForm: { ...state.aiForm, suggestions, suggestionError: null },
        })),

      setLoadingSuggestions: (isLoadingSuggestions) =>
        set((state) => ({
          aiForm: { ...state.aiForm, isLoadingSuggestions },
        })),

      setSuggestionError: (suggestionError) =>
        set((state) => ({
          aiForm: { ...state.aiForm, suggestionError, isLoadingSuggestions: false },
        })),

      acceptSuggestion: (field) => {
        const { aiForm, formData } = get()
        const suggestion = aiForm.suggestions[field]

        if (suggestion?.value) {
          set({
            formData: {
              ...formData,
              formData: { ...formData.formData, [field]: suggestion.value },
            },
            aiForm: {
              ...aiForm,
              suggestions: { ...aiForm.suggestions, [field]: null },
            },
          })
        }
      },

      dismissSuggestion: (field) =>
        set((state) => ({
          aiForm: {
            ...state.aiForm,
            suggestions: { ...state.aiForm.suggestions, [field]: null },
          },
        })),

      acceptAllSuggestions: () => {
        const { aiForm, formData } = get()
        const updates: Record<string, string> = {}

        Object.entries(aiForm.suggestions).forEach(([field, suggestion]) => {
          if (suggestion?.value) {
            updates[field] = suggestion.value
          }
        })

        set({
          formData: {
            ...formData,
            formData: { ...formData.formData, ...updates },
          },
          aiForm: {
            ...aiForm,
            suggestions: {},
          },
        })
      },

      dismissAllSuggestions: () =>
        set((state) => ({
          aiForm: { ...state.aiForm, suggestions: {} },
        })),

      clearSuggestions: () =>
        set(() => ({
          aiForm: initialAIFormState,
        })),

      // Design Mode Actions
      setCreationMode: (mode) =>
        set((state) => ({
          formData: { ...state.formData, creationMode: mode },
        })),

      setDesignData: (data) =>
        set((state) => ({
          formData: {
            ...state.formData,
            designData: { ...state.formData.designData, ...data },
          },
        })),

      updateTheme: (themeId) =>
        set((state) => ({
          formData: {
            ...state.formData,
            designData: { ...state.formData.designData, theme: themeId },
          },
        })),

      updateStyle: (styleId) =>
        set((state) => ({
          formData: {
            ...state.formData,
            designData: { ...state.formData.designData, style: styleId },
          },
        })),

      updateAspectRatio: (ratio) =>
        set((state) => ({
          formData: {
            ...state.formData,
            designData: { ...state.formData.designData, aspectRatio: ratio },
          },
        })),

      updateResolution: (resolution) =>
        set((state) => ({
          formData: {
            ...state.formData,
            designData: { ...state.formData.designData, resolution: resolution },
          },
        })),

      updateCustomization: (customization) =>
        set((state) => ({
          formData: {
            ...state.formData,
            designData: {
              ...state.formData.designData,
              customization: { ...state.formData.designData.customization, ...customization },
            },
          },
        })),

      updateExportSettings: (settings) =>
        set((state) => ({
          formData: {
            ...state.formData,
            designData: {
              ...state.formData.designData,
              exportSettings: { ...state.formData.designData.exportSettings, ...settings },
            },
          },
        })),

      resetDesignData: () =>
        set((state) => ({
          formData: { ...state.formData, designData: DEFAULT_DESIGN_DATA },
        })),

      // Color Configuration Actions
      setUseBrandColors: (enabled) =>
        set((state) => ({
          formData: {
            ...state.formData,
            designData: {
              ...state.formData.designData,
              colorConfig: {
                ...state.formData.designData.colorConfig,
                useBrandColors: enabled,
                // Clear palette and custom colors when enabling brand colors
                ...(enabled ? { selectedPalette: null, customColors: null } : {}),
              },
            },
          },
        })),

      setColorPalette: (paletteId) =>
        set((state) => ({
          formData: {
            ...state.formData,
            designData: {
              ...state.formData.designData,
              colorConfig: {
                ...state.formData.designData.colorConfig,
                selectedPalette: paletteId,
                // Clear custom colors when selecting a preset palette
                customColors: paletteId !== 'custom' ? null : state.formData.designData.colorConfig.customColors,
              },
            },
          },
        })),

      setCustomColors: (colors) =>
        set((state) => ({
          formData: {
            ...state.formData,
            designData: {
              ...state.formData.designData,
              colorConfig: {
                ...state.formData.designData.colorConfig,
                selectedPalette: 'custom',
                customColors: colors,
              },
            },
          },
        })),

      resetColorConfig: () =>
        set((state) => ({
          formData: {
            ...state.formData,
            designData: {
              ...state.formData.designData,
              colorConfig: DEFAULT_COLOR_CONFIG,
            },
          },
        })),

      // AI Design Suggestions Actions (per-tab)
      setEnableAITheme: (enabled) =>
        set((state) => ({
          aiDesignSuggestions: {
            ...state.aiDesignSuggestions,
            enableAITheme: enabled,
          },
        })),

      setEnableAIStyle: (enabled) =>
        set((state) => ({
          aiDesignSuggestions: {
            ...state.aiDesignSuggestions,
            enableAIStyle: enabled,
          },
        })),

      setEnableAIColor: (enabled) =>
        set((state) => ({
          aiDesignSuggestions: {
            ...state.aiDesignSuggestions,
            enableAIColor: enabled,
          },
        })),

      setAIThemeGenerating: (generating) =>
        set((state) => ({
          aiDesignSuggestions: {
            ...state.aiDesignSuggestions,
            isGeneratingThemes: generating,
          },
        })),

      setAIStyleGenerating: (generating) =>
        set((state) => ({
          aiDesignSuggestions: {
            ...state.aiDesignSuggestions,
            isGeneratingStyles: generating,
          },
        })),

      setAIColorGenerating: (generating) =>
        set((state) => ({
          aiDesignSuggestions: {
            ...state.aiDesignSuggestions,
            isGeneratingColors: generating,
          },
        })),

      setAIThemeError: (error) =>
        set((state) => ({
          aiDesignSuggestions: {
            ...state.aiDesignSuggestions,
            themeError: error,
            isGeneratingThemes: false,
          },
        })),

      setAIStyleError: (error) =>
        set((state) => ({
          aiDesignSuggestions: {
            ...state.aiDesignSuggestions,
            styleError: error,
            isGeneratingStyles: false,
          },
        })),

      setAIColorError: (error) =>
        set((state) => ({
          aiDesignSuggestions: {
            ...state.aiDesignSuggestions,
            colorError: error,
            isGeneratingColors: false,
          },
        })),

      setAIDesignSuggestions: (suggestions) =>
        set((state) => ({
          aiDesignSuggestions: {
            ...state.aiDesignSuggestions,
            ...suggestions,
            isGeneratingThemes: false,
            isGeneratingStyles: false,
            isGeneratingColors: false,
          },
        })),

      clearAIThemeSuggestions: () =>
        set((state) => ({
          aiDesignSuggestions: {
            ...state.aiDesignSuggestions,
            suggestedThemes: [],
            themeError: null,
          },
        })),

      clearAIStyleSuggestions: () =>
        set((state) => ({
          aiDesignSuggestions: {
            ...state.aiDesignSuggestions,
            suggestedStyles: [],
            styleError: null,
          },
        })),

      clearAIColorSuggestions: () =>
        set((state) => ({
          aiDesignSuggestions: {
            ...state.aiDesignSuggestions,
            suggestedPalettes: [],
            colorMood: '',
            colorError: null,
          },
        })),

      clearAllAISuggestions: () =>
        set((state) => ({
          aiDesignSuggestions: {
            ...state.aiDesignSuggestions,
            suggestedThemes: [],
            suggestedStyles: [],
            suggestedPalettes: [],
            visualElements: [],
            colorMood: '',
            creativeTips: [],
            themeError: null,
            styleError: null,
            colorError: null,
            hasFetchedSuggestions: false,
          },
        })),

      resetForm: () =>
        set({
          formData: initialFormData,
          selectedFormat: null,
          selectedVertical: null,
          selectedModel: null,
          selectedTemplate: null,
          aiForm: initialAIFormState,
          aiDesignSuggestions: initialAIDesignSuggestions,
          generatedImage: null,
          generationError: null,
          generationProgress: 0,
        }),
    }),
    {
      name: 'creative-store',
      // Persist format selection state for better UX
      partialize: (state) => ({
        recentFormats: state.recentFormats,
        // Persist format ID to restore on load
        selectedFormatId: state.selectedFormat?.id || null,
      }),
      // Rehydrate selectedFormat from persisted ID
      onRehydrateStorage: () => (state) => {
        if (state) {
          const persistedState = state as CreativeState & { selectedFormatId?: CreativeFormatId | null }
          if (persistedState.selectedFormatId) {
            const format = getFormatById(persistedState.selectedFormatId)
            if (format) {
              state.selectedFormat = format
            }
          }
        }
      },
    }
  )
)
