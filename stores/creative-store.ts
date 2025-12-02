import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Creative, VerticalPreset, AIModel, OrganizationLogo, TemplateImage } from '@/types/database.types'
import type { LogoPosition } from '@/lib/config/constants'
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

        if (!existing) {
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
        set((state) => ({
          formData: {
            ...state.formData,
            logosPlacements: state.formData.logosPlacements.map((p) =>
              p.logoId === logoId ? { ...p, position } : p
            ),
          },
        })),

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

      resetForm: () =>
        set({
          formData: initialFormData,
          selectedFormat: null,
          selectedVertical: null,
          selectedModel: null,
          selectedTemplate: null,
          aiForm: initialAIFormState,
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
