import { create } from 'zustand'
import type { Creative, VerticalPreset, AIModel, OrganizationLogo, TemplateImage } from '@/types/database.types'
import type { LogoPosition } from '@/lib/config/constants'
import type { FieldSuggestion, SuggestableField } from '@/types/suggestions'

interface LogoPlacement {
  logoId: string
  position: LogoPosition
  logo?: OrganizationLogo
}

interface CreativeFormData {
  verticalId: string | null
  modelId: string | null
  formData: Record<string, unknown>
  logosPlacements: LogoPlacement[]
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

  resetForm: () => void
}

const initialFormData: CreativeFormData = {
  verticalId: null,
  modelId: null,
  formData: {},
  logosPlacements: [],
}

const initialAIFormState: AIFormState = {
  suggestions: {},
  isLoadingSuggestions: false,
  suggestionError: null,
}

export const useCreativeStore = create<CreativeState>()((set, get) => ({
  // Initial state
  verticals: [],
  models: [],
  logos: [],
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

  selectVertical: (verticalId) => {
    const { verticals } = get()
    const vertical = verticals.find(v => v.id === verticalId)
    set({
      selectedVertical: vertical || null,
      formData: { ...get().formData, verticalId, formData: {} },
    })
  },

  selectModel: (modelId) => {
    const { models } = get()
    const model = models.find(m => m.id === modelId)
    set({
      selectedModel: model || null,
      formData: { ...get().formData, modelId },
    })
  },

  selectTemplate: (template) => set({ selectedTemplate: template }),

  updateFormData: (data) => set((state) => ({
    formData: {
      ...state.formData,
      formData: { ...state.formData.formData, ...data },
    },
  })),

  addLogoPlacement: (logoId, position) => {
    const { logos, formData } = get()
    const logo = logos.find(l => l.id === logoId)
    const existing = formData.logosPlacements.find(p => p.logoId === logoId)

    if (!existing) {
      set({
        formData: {
          ...formData,
          logosPlacements: [
            ...formData.logosPlacements,
            { logoId, position, logo },
          ],
        },
      })
    }
  },

  removeLogoPlacement: (logoId) => set((state) => ({
    formData: {
      ...state.formData,
      logosPlacements: state.formData.logosPlacements.filter(p => p.logoId !== logoId),
    },
  })),

  updateLogoPosition: (logoId, position) => set((state) => ({
    formData: {
      ...state.formData,
      logosPlacements: state.formData.logosPlacements.map(p =>
        p.logoId === logoId ? { ...p, position } : p
      ),
    },
  })),

  clearLogoPlacements: () => set((state) => ({
    formData: { ...state.formData, logosPlacements: [] },
  })),

  setGenerating: (isGenerating) => set({ isGenerating }),

  setGenerationProgress: (generationProgress) => set({ generationProgress }),

  setGeneratedImage: (generatedImage) => set({ generatedImage }),

  setGenerationError: (generationError) => set({ generationError }),

  setRecentCreatives: (recentCreatives) => set({ recentCreatives }),

  addCreative: (creative) => set((state) => ({
    recentCreatives: [creative, ...state.recentCreatives].slice(0, 20),
  })),

  // AI Suggestion Actions
  setSuggestions: (suggestions) => set((state) => ({
    aiForm: { ...state.aiForm, suggestions, suggestionError: null },
  })),

  setLoadingSuggestions: (isLoadingSuggestions) => set((state) => ({
    aiForm: { ...state.aiForm, isLoadingSuggestions },
  })),

  setSuggestionError: (suggestionError) => set((state) => ({
    aiForm: { ...state.aiForm, suggestionError, isLoadingSuggestions: false },
  })),

  acceptSuggestion: (field) => {
    const { aiForm, formData } = get()
    const suggestion = aiForm.suggestions[field]

    if (suggestion?.value) {
      // Update form data with the accepted suggestion
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

  dismissSuggestion: (field) => set((state) => ({
    aiForm: {
      ...state.aiForm,
      suggestions: { ...state.aiForm.suggestions, [field]: null },
    },
  })),

  acceptAllSuggestions: () => {
    const { aiForm, formData } = get()
    const updates: Record<string, string> = {}

    // Collect all valid suggestions
    Object.entries(aiForm.suggestions).forEach(([field, suggestion]) => {
      if (suggestion?.value) {
        updates[field] = suggestion.value
      }
    })

    // Update form data and clear all suggestions
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

  dismissAllSuggestions: () => set((state) => ({
    aiForm: { ...state.aiForm, suggestions: {} },
  })),

  clearSuggestions: () => set((state) => ({
    aiForm: initialAIFormState,
  })),

  resetForm: () => set({
    formData: initialFormData,
    selectedVertical: null,
    selectedModel: null,
    selectedTemplate: null,
    aiForm: initialAIFormState,
    generatedImage: null,
    generationError: null,
    generationProgress: 0,
  }),
}))
