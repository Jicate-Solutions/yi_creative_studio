import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Creative, VerticalPreset, AIModel, OrganizationLogo, TemplateImage } from '@/types/database.types'
import type { LogoPosition } from '@/lib/config/constants'
import { detectLogoType, getSuggestedPosition, isLogoAutoLocked, getAutoLockedPosition, type LogoType } from '@/lib/config/logo-locks'
import type { FieldSuggestion, SuggestableField } from '@/types/suggestions'
import type { CreationMode } from '@/types/design.types'
import type { DesignData, CustomizationData, ExportSettings, AspectRatioId, ResolutionId, ColorConfig, CustomColors } from '@/lib/config/design-constants'
import { DEFAULT_DESIGN_DATA, DEFAULT_COLOR_CONFIG } from '@/lib/config/design-constants'
import type { CreativeFormat, CreativeFormatId } from '@/lib/config/creative-formats'
import { CREATIVE_FORMATS, getFormatById } from '@/lib/config/creative-formats'
import {
  type LogoSizePreset,
  DEFAULT_LOGO_SIZE,
  type LogoBackgroundShape,
  type LogoBackgroundStyle,
  DEFAULT_LOGO_BACKGROUND,
  DEFAULT_LOGO_BACKGROUND_COLOR,
} from '@/lib/constants/logoConstants'
import type { GeneratedSchema, DynamicSchemaField } from '@/lib/prompts/generate-fields-prompt'
import type { LogoPreset } from '@/types/logo-presets'

// Re-export for convenience
export type { GeneratedSchema, DynamicSchemaField }

// PERMANENT FIX: Race condition protection for dynamic schema generation
// This counter tracks the latest request to prevent stale updates
let dynamicSchemaRequestId = 0
let dynamicSchemaAbortController: AbortController | null = null

// Dynamic Schema State for AI-generated form fields
export interface DynamicSchemaState {
  schema: GeneratedSchema | null
  isLoading: boolean
  error: string | null
  cacheKey: string | null // format:vertical
  isFallback: boolean // True if using static fallback schema
}

const initialDynamicSchemaState: DynamicSchemaState = {
  schema: null,
  isLoading: false,
  error: null,
  cacheKey: null,
  isFallback: false,
}

export interface LogoPlacement {
  logoId: string
  position: LogoPosition
  size: LogoSizePreset | number // Size preset or custom pixel value
  logo?: OrganizationLogo
  isLocked: boolean // User-controlled position lock
  logoType?: LogoType // Auto-detected from logo name (brand, vertical, sponsor, etc.)
  // Background options for logo
  backgroundShape: LogoBackgroundShape // 'none' | 'rectangle' | 'rounded' | 'circle'
  backgroundStyle: LogoBackgroundStyle // { shadow: boolean, border: boolean }
}

// Logo Strip Mode - unified white strip containing all logos in a row
export type LogoStripRow = 'header' | 'middle' | 'footer'

export interface LogoStripMode {
  enabled: boolean
  rows: LogoStripRow[] // Which rows use strip mode (header, middle, footer)
}

interface CreativeFormData {
  // Format selection (Canva-style)
  formatId: CreativeFormatId | null
  customDimensions: { width: number; height: number } | null

  verticalId: string | null
  modelId: string | null
  formData: Record<string, unknown>
  logosPlacements: LogoPlacement[]
  logoBackgroundColor: string // Global background color for all logos (hex)
  logoStripMode: LogoStripMode // Unified strip layout for logos
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

// Template Resize State (Canva-style Magic Resize)
interface TemplateResizeState {
  isResizing: boolean
  resizedTemplateUrl: string | null
  resizeError: string | null
}

const initialTemplateResizeState: TemplateResizeState = {
  isResizing: false,
  resizedTemplateUrl: null,
  resizeError: null,
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

  // Dynamic Schema state (AI-generated form fields)
  dynamicSchema: DynamicSchemaState

  // Template Resize state (Canva-style Magic Resize)
  templateResize: TemplateResizeState

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

  addLogoPlacement: (logoId: string, position: LogoPosition, size?: LogoSizePreset | number) => void
  removeLogoPlacement: (logoId: string) => void
  updateLogoPosition: (logoId: string, position: LogoPosition) => void
  updateLogoSize: (logoId: string, size: LogoSizePreset | number) => void
  toggleLogoLock: (logoId: string) => void
  clearLogoPlacements: () => void
  applyLogoPreset: (preset: LogoPreset) => void
  // Logo background actions
  updateLogoBackground: (logoId: string, shape: LogoBackgroundShape) => void
  updateLogoBackgroundStyle: (logoId: string, style: Partial<LogoBackgroundStyle>) => void
  setLogoBackgroundColor: (color: string) => void // Global background color for all logos
  // Logo strip mode actions
  setLogoStripMode: (stripMode: LogoStripMode) => void
  toggleLogoStripRow: (row: LogoStripRow) => void
  // AI Logo Position Optimization
  applyOptimizedPlacements: (optimizedPlacements: Array<{
    logoId: string
    position: LogoPosition
    size?: LogoSizePreset
    backgroundShape?: LogoBackgroundShape
  }>) => void

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

  // Dynamic Schema Actions (AI-generated form fields)
  generateDynamicSchema: (formatId: string, verticalSlug: string, organizationId?: string) => Promise<void>
  setDynamicSchema: (schema: GeneratedSchema | null, isFallback?: boolean) => void
  setDynamicSchemaLoading: (loading: boolean) => void
  setDynamicSchemaError: (error: string | null) => void
  clearDynamicSchema: () => void

  // Template Resize Actions (Canva-style Magic Resize)
  checkTemplateFormatMismatch: () => boolean
  resizeTemplateToFormat: () => Promise<void>
  clearResizedTemplate: () => void
  setTemplateResizeError: (error: string | null) => void

  resetForm: () => void
}

// Default logo strip mode - disabled by default
const DEFAULT_LOGO_STRIP_MODE: LogoStripMode = {
  enabled: false,
  rows: ['header'], // Default to header row when enabled
}

const initialFormData: CreativeFormData = {
  // Format selection
  formatId: null,
  customDimensions: null,

  verticalId: null,
  modelId: null,
  formData: {},
  logosPlacements: [],
  logoBackgroundColor: DEFAULT_LOGO_BACKGROUND_COLOR,
  logoStripMode: DEFAULT_LOGO_STRIP_MODE,
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
      dynamicSchema: initialDynamicSchemaState,
      templateResize: initialTemplateResizeState,
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
          // Clear previous generation when starting new workflow
          generatedImage: null,
          generationError: null,
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
          // Clear previous generation when changing vertical
          generatedImage: null,
          generationError: null,
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

      addLogoPlacement: (logoId, position, size = DEFAULT_LOGO_SIZE) => {
        const { logos, formData } = get()
        const logo = logos.find((l) => l.id === logoId)
        const existing = formData.logosPlacements.find((p) => p.logoId === logoId)

        // Yi Brand Guidelines 2025: Support full 6-column × 3-row layout system
        // Header strip (6) + Second strip (6) + Footer strip (6) = 18 positions max
        if (formData.logosPlacements.length >= 18 && !existing) {
          return // Silently reject - UI should prevent this
        }

        if (!existing && logo) {
          const usedPositions = formData.logosPlacements.map(p => p.position)
          const logoType = detectLogoType(logo.name)

          // Yi Brand Guidelines 2025: Brand logos are auto-locked to their fixed positions
          const autoLocked = isLogoAutoLocked(logo.name)
          const autoLockedPosition = getAutoLockedPosition(logo.name)

          // Determine final position:
          // 1. If auto-locked (brand logo), use the locked position
          // 2. If requested position is taken, use smart positioning
          // 3. Otherwise use requested position
          let finalPosition: LogoPosition
          if (autoLocked && autoLockedPosition) {
            // Brand logos always go to their fixed position (Yi=top-left, CII=top-right, etc.)
            finalPosition = autoLockedPosition
          } else {
            const isPositionTaken = usedPositions.includes(position)
            finalPosition = isPositionTaken
              ? getSuggestedPosition(logo.name, usedPositions)
              : position
          }

          set({
            formData: {
              ...formData,
              logosPlacements: [
                ...formData.logosPlacements,
                {
                  logoId,
                  position: finalPosition,
                  size,
                  logo,
                  isLocked: autoLocked, // Auto-lock brand logos, others start unlocked
                  logoType,
                  backgroundShape: DEFAULT_LOGO_BACKGROUND.shape,
                  backgroundStyle: { ...DEFAULT_LOGO_BACKGROUND.style },
                }
              ],
            },
          })
        } else if (!existing) {
          // Fallback if logo not found
          const logoType = detectLogoType('')
          set({
            formData: {
              ...formData,
              logosPlacements: [
                ...formData.logosPlacements,
                {
                  logoId,
                  position,
                  size,
                  logo,
                  isLocked: false,
                  logoType,
                  backgroundShape: DEFAULT_LOGO_BACKGROUND.shape,
                  backgroundStyle: { ...DEFAULT_LOGO_BACKGROUND.style },
                }
              ],
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

          // If user has locked the position, prevent change
          if (placement?.isLocked) {
            // Silently reject - locked logos cannot have their position changed
            return state
          }

          // Yi Brand Guidelines 2025: Brand logos are auto-locked and cannot be moved
          if (placement?.logo?.name && isLogoAutoLocked(placement.logo.name)) {
            // Silently reject - brand logos cannot have their position changed
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

      updateLogoSize: (logoId, size) =>
        set((state) => ({
          formData: {
            ...state.formData,
            logosPlacements: state.formData.logosPlacements.map((p) =>
              p.logoId === logoId ? { ...p, size } : p
            ),
          },
        })),

      toggleLogoLock: (logoId) =>
        set((state) => {
          // Find the placement being toggled
          const placement = state.formData.logosPlacements.find(p => p.logoId === logoId)

          // Yi Brand Guidelines 2025: Brand logos are always locked and cannot be unlocked
          if (placement?.logo?.name && isLogoAutoLocked(placement.logo.name)) {
            // Silently reject - brand logos cannot have their lock toggled
            return state
          }

          return {
            formData: {
              ...state.formData,
              logosPlacements: state.formData.logosPlacements.map((p) =>
                p.logoId === logoId ? { ...p, isLocked: !p.isLocked } : p
              ),
            },
          }
        }),

      clearLogoPlacements: () =>
        set((state) => ({
          formData: { ...state.formData, logosPlacements: [] },
        })),

      updateLogoBackground: (logoId, shape) =>
        set((state) => ({
          formData: {
            ...state.formData,
            logosPlacements: state.formData.logosPlacements.map((p) =>
              p.logoId === logoId ? { ...p, backgroundShape: shape } : p
            ),
          },
        })),

      updateLogoBackgroundStyle: (logoId, style) =>
        set((state) => ({
          formData: {
            ...state.formData,
            logosPlacements: state.formData.logosPlacements.map((p) =>
              p.logoId === logoId
                ? { ...p, backgroundStyle: { ...p.backgroundStyle, ...style } }
                : p
            ),
          },
        })),

      setLogoBackgroundColor: (color) =>
        set((state) => ({
          formData: {
            ...state.formData,
            logoBackgroundColor: color,
          },
        })),

      // Logo strip mode actions
      setLogoStripMode: (stripMode) =>
        set((state) => ({
          formData: {
            ...state.formData,
            logoStripMode: stripMode,
          },
        })),

      toggleLogoStripRow: (row) =>
        set((state) => {
          const currentRows = state.formData.logoStripMode.rows
          const newRows = currentRows.includes(row)
            ? currentRows.filter((r) => r !== row)
            : [...currentRows, row]
          return {
            formData: {
              ...state.formData,
              logoStripMode: {
                ...state.formData.logoStripMode,
                rows: newRows.length > 0 ? newRows : ['header'], // At least one row
              },
            },
          }
        }),

      // AI Logo Position Optimization - apply optimized placements from the optimizer
      applyOptimizedPlacements: (optimizedPlacements) =>
        set((state) => {
          const currentPlacements = state.formData.logosPlacements

          // Merge optimized positions with current placement data
          const updatedPlacements = currentPlacements.map(current => {
            const optimized = optimizedPlacements.find(o => o.logoId === current.logoId)

            if (optimized) {
              // Yi Brand Guidelines 2025: Never change position for auto-locked logos
              const isAutoLockedLogo = current.logo?.name && isLogoAutoLocked(current.logo.name)

              return {
                ...current,
                // Only update position if not auto-locked
                position: isAutoLockedLogo ? current.position : (optimized.position || current.position),
                // Update size if provided
                size: optimized.size || current.size,
                // Update background shape if provided
                backgroundShape: optimized.backgroundShape || current.backgroundShape,
              }
            }
            return current
          })

          return {
            formData: {
              ...state.formData,
              logosPlacements: updatedPlacements,
            },
          }
        }),

      applyLogoPreset: (preset) => {
        const { logos, formData } = get()

        // Map preset placements to full LogoPlacement objects
        const placements: LogoPlacement[] = preset.placements
          .map((p): LogoPlacement | null => {
            // Find the logo in the organization's current logos
            const logo = logos.find((l) => l.id === p.logoId)

            // Skip if logo no longer exists in organization
            if (!logo) {
              console.warn(`Logo ${p.logoName} (${p.logoId}) not found - skipping`)
              return null
            }

            const logoType = detectLogoType(logo.name)
            const autoLocked = isLogoAutoLocked(logo.name)

            return {
              logoId: p.logoId,
              position: p.position,
              size: p.size as LogoSizePreset | number,
              logo,
              isLocked: autoLocked,
              logoType,
              // Apply background settings from preset (with defaults for backward compatibility)
              backgroundShape: p.backgroundShape || DEFAULT_LOGO_BACKGROUND.shape,
              backgroundStyle: p.backgroundStyle || { ...DEFAULT_LOGO_BACKGROUND.style },
            }
          })
          .filter((p): p is LogoPlacement => p !== null)

        set({
          formData: {
            ...formData,
            logosPlacements: placements,
          },
        })
      },

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

      // Dynamic Schema Actions (AI-generated form fields)
      generateDynamicSchema: async (formatId, verticalSlug, organizationId) => {
        const cacheKey = `${formatId}:${verticalSlug}`

        // Check if we already have this schema cached
        const { dynamicSchema } = get()
        if (dynamicSchema.schema && dynamicSchema.cacheKey === cacheKey && !dynamicSchema.isFallback) {
          return // Already have valid schema
        }

        // PERMANENT FIX: Race condition protection
        // Cancel any previous request and increment request ID
        if (dynamicSchemaAbortController) {
          dynamicSchemaAbortController.abort()
        }
        dynamicSchemaAbortController = new AbortController()
        const currentRequestId = ++dynamicSchemaRequestId
        const signal = dynamicSchemaAbortController.signal

        // Set loading state
        set({
          dynamicSchema: {
            ...initialDynamicSchemaState,
            isLoading: true,
            cacheKey,
          },
        })

        // Retry configuration for reliability
        const maxRetries = 2
        const baseDelay = 1000 // 1 second

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
          // PERMANENT FIX: Check if this request is still the latest
          if (currentRequestId !== dynamicSchemaRequestId) {
            console.log(`[DynamicSchema] Request ${currentRequestId} superseded by ${dynamicSchemaRequestId}, aborting`)
            return
          }

          try {
            const response = await fetch('/api/generate-fields', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                formatId,
                verticalSlug,
                organizationId,
              }),
              signal, // Pass abort signal to fetch
            })

            // PERMANENT FIX: Check again after await
            if (currentRequestId !== dynamicSchemaRequestId) {
              console.log(`[DynamicSchema] Request ${currentRequestId} superseded after fetch, discarding`)
              return
            }

            const data = await response.json()

            // PERMANENT FIX: Final check before state update
            if (currentRequestId !== dynamicSchemaRequestId) {
              console.log(`[DynamicSchema] Request ${currentRequestId} superseded before update, discarding`)
              return
            }

            if (data.success) {
              set({
                dynamicSchema: {
                  schema: data.schema,
                  isLoading: false,
                  error: null,
                  cacheKey,
                  isFallback: false,
                },
              })
              return // Success - exit retry loop
            }

            // If got fallback but more retries available, try again on timeout
            if (data.fallbackSchema && attempt < maxRetries && data.code === 'TIMEOUT') {
              console.log(`[DynamicSchema] Attempt ${attempt + 1} timed out, retrying...`)
              await new Promise(r => setTimeout(r, baseDelay * Math.pow(2, attempt)))
              continue
            }

            // No more retries or non-timeout failure - use fallback
            if (data.fallbackSchema) {
              set({
                dynamicSchema: {
                  schema: data.fallbackSchema,
                  isLoading: false,
                  error: data.error || null,
                  cacheKey,
                  isFallback: true,
                },
              })
              return
            }

            // No fallback available
            set({
              dynamicSchema: {
                schema: null,
                isLoading: false,
                error: data.error || 'Failed to generate fields',
                cacheKey,
                isFallback: false,
              },
            })
            return
          } catch (error) {
            // PERMANENT FIX: Handle abort errors gracefully
            if (error instanceof Error && error.name === 'AbortError') {
              console.log(`[DynamicSchema] Request ${currentRequestId} aborted`)
              return
            }

            // PERMANENT FIX: Check if still latest before error handling
            if (currentRequestId !== dynamicSchemaRequestId) {
              return
            }

            if (attempt < maxRetries) {
              console.log(`[DynamicSchema] Network error on attempt ${attempt + 1}, retrying...`)
              await new Promise(r => setTimeout(r, baseDelay * Math.pow(2, attempt)))
              continue
            }

            console.error('Failed to generate dynamic schema:', error)
            set({
              dynamicSchema: {
                schema: null,
                isLoading: false,
                error: error instanceof Error ? error.message : 'Network error',
                cacheKey,
                isFallback: false,
              },
            })
          }
        }
      },

      setDynamicSchema: (schema, isFallback = false) =>
        set((state) => ({
          dynamicSchema: {
            ...state.dynamicSchema,
            schema,
            isFallback,
            error: null,
          },
        })),

      setDynamicSchemaLoading: (isLoading) =>
        set((state) => ({
          dynamicSchema: {
            ...state.dynamicSchema,
            isLoading,
          },
        })),

      setDynamicSchemaError: (error) =>
        set((state) => ({
          dynamicSchema: {
            ...state.dynamicSchema,
            error,
            isLoading: false,
          },
        })),

      clearDynamicSchema: () =>
        set({
          dynamicSchema: initialDynamicSchemaState,
        }),

      // Template Resize Actions (Canva-style Magic Resize)
      checkTemplateFormatMismatch: () => {
        const { selectedTemplate, selectedFormat } = get()

        // No mismatch if either is missing
        if (!selectedTemplate || !selectedFormat) return false

        // No mismatch if template has no dimensions
        if (!selectedTemplate.width || !selectedTemplate.height) return false

        const templateRatio = selectedTemplate.width / selectedTemplate.height
        const formatRatio = selectedFormat.width / selectedFormat.height
        const tolerance = 0.1 // 10% tolerance

        // Return true if aspect ratios differ by more than tolerance
        return Math.abs(templateRatio - formatRatio) / formatRatio > tolerance
      },

      resizeTemplateToFormat: async () => {
        const { selectedTemplate, selectedFormat, templateResize } = get()

        // Guard clauses
        if (!selectedTemplate || !selectedFormat) {
          console.warn('[Resize] Missing template or format')
          return
        }

        if (!selectedTemplate.image_url) {
          console.warn('[Resize] Template has no image URL')
          return
        }

        // Set loading state
        set({
          templateResize: {
            ...templateResize,
            isResizing: true,
            resizeError: null,
          },
        })

        try {
          const response = await fetch('/api/resize-template', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              templateUrl: selectedTemplate.image_url,
              targetWidth: selectedFormat.width,
              targetHeight: selectedFormat.height,
              originalWidth: selectedTemplate.width,
              originalHeight: selectedTemplate.height,
              preserveText: true,
            }),
          })

          const data = await response.json()

          if (data.success && data.resizedImageUrl) {
            set({
              templateResize: {
                isResizing: false,
                resizedTemplateUrl: data.resizedImageUrl,
                resizeError: null,
              },
            })
            console.log(`[Resize] Success via ${data.method}`)
          } else {
            set({
              templateResize: {
                isResizing: false,
                resizedTemplateUrl: null,
                resizeError: data.error || 'Failed to resize template',
              },
            })
          }
        } catch (error) {
          console.error('[Resize] Error:', error)
          set({
            templateResize: {
              isResizing: false,
              resizedTemplateUrl: null,
              resizeError: error instanceof Error ? error.message : 'Network error',
            },
          })
        }
      },

      clearResizedTemplate: () =>
        set({
          templateResize: initialTemplateResizeState,
        }),

      setTemplateResizeError: (error) =>
        set((state) => ({
          templateResize: {
            ...state.templateResize,
            resizeError: error,
            isResizing: false,
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
          dynamicSchema: initialDynamicSchemaState,
          templateResize: initialTemplateResizeState,
          generatedImage: null,
          generationError: null,
          generationProgress: 0,
        }),
    }),
    {
      name: 'creative-store',
      // Persist format selection state for better UX
      // IMPORTANT: Never persist loading states - they should always start as false
      partialize: (state) => ({
        recentFormats: state.recentFormats,
        // Persist format ID to restore on load
        selectedFormatId: state.selectedFormat?.id || null,
      }),
      // Rehydrate selectedFormat from persisted ID
      // CRITICAL: Reset all loading states to prevent infinite loading on page reload
      onRehydrateStorage: () => (state) => {
        if (state) {
          const persistedState = state as CreativeState & { selectedFormatId?: CreativeFormatId | null }
          if (persistedState.selectedFormatId) {
            const format = getFormatById(persistedState.selectedFormatId)
            if (format) {
              state.selectedFormat = format
            }
          }

          // PERMANENT FIX: Reset all loading states to prevent infinite loading
          // This ensures loading states never persist across page reloads
          state.isGenerating = false
          state.generationProgress = 0
          state.generationError = null

          // Reset AI form loading states
          state.aiForm = {
            ...state.aiForm,
            isLoadingSuggestions: false,
            suggestionError: null,
          }

          // Reset dynamic schema loading states
          state.dynamicSchema = {
            ...state.dynamicSchema,
            isLoading: false,
            error: null,
          }

          // Reset template resize loading states
          state.templateResize = {
            ...state.templateResize,
            isResizing: false,
            resizeError: null,
          }

          // Migrate old placements without isLocked or logoType properties
          // Yi Brand Guidelines 2025: Ensure brand logos are auto-locked
          if (state.formData?.logosPlacements) {
            state.formData.logosPlacements = state.formData.logosPlacements.map(p => {
              const logoName = p.logo?.name || ''
              const logoType = p.logoType ?? detectLogoType(logoName)
              const autoLocked = isLogoAutoLocked(logoName)
              const autoLockedPosition = getAutoLockedPosition(logoName)

              return {
                ...p,
                // Brand logos are always locked, others use their saved state or default to unlocked
                isLocked: autoLocked || (p.isLocked ?? false),
                logoType,
                // Brand logos must be in their fixed position
                position: (autoLocked && autoLockedPosition) ? autoLockedPosition : p.position,
              }
            })
          }

          // Reset AI design suggestions loading states
          state.aiDesignSuggestions = {
            ...state.aiDesignSuggestions,
            isGeneratingThemes: false,
            isGeneratingStyles: false,
            isGeneratingColors: false,
            themeError: null,
            styleError: null,
            colorError: null,
          }
        }
      },
    }
  )
)
