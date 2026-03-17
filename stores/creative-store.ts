import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Creative, VerticalPreset, AIModel, OrganizationLogo, TemplateImage } from '@/types/database.types'
import type { LandmarkSignature } from '@/types/landmark-signatures'
import type { LogoPosition } from '@/lib/config/constants'
import { detectLogoType, getSuggestedPosition, isLogoAutoLocked, getAutoLockedPosition, type LogoType } from '@/lib/config/logo-locks'
import type { FieldSuggestion, SuggestableField } from '@/types/suggestions'
import type { CreationMode } from '@/types/design.types'
import type { DesignData, CustomizationData, ExportSettings, AspectRatioId, ResolutionId, ColorConfig, CustomColors, LogoStripShape, TypographyConfig, SpeakerPhotoCustomization, Enhanced4RowStripMode, InitiativeTextConfig, PartnerLabelConfig, FooterRowConfig, FooterLayout } from '@/lib/config/design-constants'
import { DEFAULT_DESIGN_DATA, DEFAULT_COLOR_CONFIG, DEFAULT_ENHANCED_4ROW_STRIP, DEFAULT_FOOTER_CONFIG, MAX_VERTICAL_LOGOS } from '@/lib/config/design-constants'
import type { TypographySuggestion } from '@/types/typography-suggestions'
import type { CreativeFormat, CreativeFormatId } from '@/lib/config/creative-formats'
import { CREATIVE_FORMATS, getFormatById } from '@/lib/config/creative-formats'
import { resolveFieldId } from '@/lib/config/field-registry'
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
import type { ExternalEventMeta, ExternalEventImportState, EventMappingResult, DynamicField } from '@/types/external-event.types'

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
  opacity: number // Strip opacity 0-100 (default: 100 = fully opaque)
  logoBound: boolean // When true, strip only covers logo area; when false, edge-to-edge
}

interface CreativeFormData {
  // Format selection (Canva-style)
  formatId: CreativeFormatId | null
  customDimensions: { width: number; height: number } | null

  verticalId: string | null
  modelId: string | null
  formData: Record<string, unknown>
  aiFilledFields: string[] // v22.0: Track which fields were filled by AI suggestions
  logosPlacements: LogoPlacement[]
  logoBackgroundColor: string // Global background color for all logos (hex)
  logoStripMode: LogoStripMode // Unified strip layout for logos (legacy 3-row)
  enhanced4RowStrip: Enhanced4RowStripMode // NEW: Enhanced 4-row strip system
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

// AI Typography Suggestions State
export interface AITypographyState {
  /** Whether AI typography suggestions are enabled */
  enableAI: boolean
  /** Current typography suggestions from AI */
  suggestions: TypographySuggestion | null
  /** Whether suggestions are currently being generated */
  isGenerating: boolean
  /** Error message if generation failed */
  error: string | null
  /** Whether suggestions have been fetched at least once */
  hasFetchedSuggestions: boolean
}

const initialAITypographyState: AITypographyState = {
  enableAI: false,
  suggestions: null,
  isGenerating: false,
  error: null,
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

// Color Shuffle State (Canva-style color remixing)
export interface ShuffleVariant {
  id: string // Temporary UUID (not saved to DB)
  variantIndex: number
  imageDataUrl: string // base64 data URL (not uploaded to Storage yet)
  thumbnailDataUrl: string
  colorMapping: Array<{
    zone: 'background' | 'text' | 'accent'
    fromColor: string
    toColor: string
  }>
  description: string
  processingTimeMs: number
}

interface ColorShuffleState {
  shuffleVariants: ShuffleVariant[] // Session memory only (NOT persisted)
  activeVariantIndex: number
  isShuffling: boolean
  isSaving: boolean
  shuffleError: string | null
  parentCreativeId: string | null
}

const initialColorShuffleState: ColorShuffleState = {
  shuffleVariants: [],
  activeVariantIndex: 0,
  isShuffling: false,
  isSaving: false,
  shuffleError: null,
  parentCreativeId: null,
}

// External Event Import State (for events fetched from MyJKKN, Yi Connect, etc.)
const initialExternalEventState: ExternalEventImportState = {
  isLoading: false,
  error: null,
  externalEventMeta: null,
  previewData: null,
  hasChanges: false,
  changedFields: [],
  dynamicFields: [], // v3.0: Custom fields from external source
}

interface CreativeState {
  // Available data
  verticals: VerticalPreset[]
  models: AIModel[]
  logos: OrganizationLogo[]
  landmarkSignatures: LandmarkSignature[] // Footer signature images (local landmarks)

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

  // AI Typography Suggestions state (Typography Section)
  aiTypography: AITypographyState

  // Dynamic Schema state (AI-generated form fields)
  dynamicSchema: DynamicSchemaState

  // Template Resize state (Canva-style Magic Resize)
  templateResize: TemplateResizeState

  // Color Shuffle state (Canva-style color remixing)
  colorShuffle: ColorShuffleState

  // External Event Import State (for events from MyJKKN, Yi Connect, etc.)
  externalEventImport: ExternalEventImportState

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
  setLandmarkSignatures: (signatures: LandmarkSignature[]) => void

  // Auto-initialize brand logos (Yi, CII, Bharat Rising) in their fixed positions
  initializeDefaultLogoPlacements: (availableLogos: OrganizationLogo[]) => void

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
  swapLogoPositions: (logoId1: string, logoId2: string) => void // v21.0: Row-constrained swap
  updateLogoSize: (logoId: string, size: LogoSizePreset | number) => void
  toggleLogoLock: (logoId: string) => void
  clearLogoPlacements: () => void
  applyLogoPreset: (preset: LogoPreset) => void
  // Logo background actions
  updateLogoBackground: (logoId: string, shape: LogoBackgroundShape) => void
  updateLogoBackgroundStyle: (logoId: string, style: Partial<LogoBackgroundStyle>) => void
  setLogoBackgroundColor: (color: string) => void // Global background color for all logos
  // Logo strip mode actions (legacy 3-row)
  setLogoStripMode: (stripMode: LogoStripMode) => void
  toggleLogoStripRow: (row: LogoStripRow) => void
  setLogoStripShape: (shape: LogoStripShape) => void
  setLogoStripOpacity: (opacity: number) => void
  setLogoStripLogoBound: (logoBound: boolean) => void

  // Enhanced 4-row strip actions
  setEnhanced4RowEnabled: (enabled: boolean) => void
  setEnhanced4RowVersion: (version: '4-row' | '4-row-split') => void
  updateInitiativeText: (config: Partial<InitiativeTextConfig>) => void
  applyInitiativePreset: (preset: { config: InitiativeTextConfig; name: string }) => void
  updatePartnerLabel: (config: Partial<PartnerLabelConfig>) => void
  addVerticalLogo4Row: (logoId: string) => void // max 6 enforcement
  removeVerticalLogo4Row: (logoId: string) => void
  reorderVerticalLogos4Row: (logoIds: string[]) => void
  setVerticalLogoIds4Row: (logoIds: string[]) => void // Preset application
  setPartnerLogo: (logoId: string | null) => void
  update4RowBackground: (config: Partial<Enhanced4RowStripMode['background']>) => void
  set4RowBrandEnabled: (enabled: boolean) => void
  set4RowVerticalEnabled: (enabled: boolean) => void

  // Footer row actions (split layout - row 4 at bottom)
  setFooterEnabled: (enabled: boolean) => void
  updateFooterConfig: (config: Partial<FooterRowConfig>) => void
  updateFooterSignature: (signature: Partial<FooterRowConfig['signature']>) => void
  updateFooterHashtag: (hashtag: { enabled?: boolean; text?: string; color?: string }) => void
  updateFooterWebsite: (website: { enabled?: boolean; url?: string; socialHandle?: string }) => void
  updateFooterSocialBar: (socialBar: Partial<FooterRowConfig['socialBar']>) => void
  updateFooterDigitalPartner: (partner: Partial<FooterRowConfig['digitalPartner']>) => void
  updateFooterBackground: (background: Partial<FooterRowConfig['background']>) => void
  setFooterLayout: (layout: FooterLayout) => void
  setFooterPartnerLogo: (logoId: string | null) => void
  setFooterSignatureImage: (imageUrl: string | null) => void
  setFooterSignatureLogo: (logoId: string | null) => void
  setFooterSignatureId: (signatureId: string | null) => void // Uses landmark_signatures table

  // Footer Preset actions
  applyFooterPreset: (preset: { config: FooterRowConfig; name: string }) => void

  // AI Logo Position Optimization
  applyOptimizedPlacements: (optimizedPlacements: Array<{
    logoId: string
    position: LogoPosition
    size?: LogoSizePreset
    backgroundShape?: LogoBackgroundShape
  }>) => void

  // External Event Import Actions
  setExternalEventLoading: (loading: boolean) => void
  setExternalEventError: (error: string | null) => void
  setExternalEventMeta: (meta: ExternalEventMeta | null) => void
  setExternalEventPreview: (preview: EventMappingResult | null) => void
  setExternalEventChanges: (hasChanges: boolean, changedFields: string[]) => void
  importExternalEvent: (meta: ExternalEventMeta, formData: Record<string, unknown>, mappedFields: string[], dynamicFields?: DynamicField[], formatId?: CreativeFormatId) => void
  clearExternalEventImport: () => void
  updateFormFromExternalEvent: (formData: Record<string, unknown>) => void

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
  setUseBrandFont: (enabled: boolean) => void
  setColorPalette: (paletteId: string | null) => void
  setCustomColors: (colors: CustomColors) => void

  resetColorConfig: () => void

  // Typography Configuration Actions
  updateTypography: (typography: Partial<TypographyConfig>) => void

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

  // AI Typography Suggestions Actions
  setEnableAITypography: (enabled: boolean) => void
  setTypographySuggestions: (suggestions: TypographySuggestion | null) => void
  setTypographyGenerating: (generating: boolean) => void
  setTypographyError: (error: string | null) => void
  applyTypographySuggestions: () => void
  clearTypographySuggestions: () => void

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

  // Color Shuffle Actions (Canva-style color remixing)
  shuffleColors: (creativeId: string, variantCount?: number) => Promise<void>
  selectVariant: (index: number) => void
  keepVariant: () => Promise<void>
  resetToOriginal: () => void
  setShuffleError: (error: string | null) => void

  resetForm: () => void
}

// Default logo strip mode - disabled by default
const DEFAULT_LOGO_STRIP_MODE: LogoStripMode = {
  enabled: false,
  rows: ['header'], // Default to header row when enabled
  opacity: 100, // Fully opaque by default
  logoBound: true, // Wrap logos only by default
}

const initialFormData: CreativeFormData = {
  // Format selection
  formatId: null,
  customDimensions: null,

  verticalId: null,
  modelId: null,
  formData: {},
  aiFilledFields: [], // v22.0: Track AI-filled fields for summary display
  logosPlacements: [],
  logoBackgroundColor: DEFAULT_LOGO_BACKGROUND_COLOR,
  logoStripMode: DEFAULT_LOGO_STRIP_MODE,
  enhanced4RowStrip: DEFAULT_ENHANCED_4ROW_STRIP, // NEW: Enhanced 4-row strip
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
      landmarkSignatures: [],

      // Format selection state (Canva-style)
      selectedFormat: null,
      recentFormats: [],

      formData: initialFormData,
      selectedVertical: null,
      selectedModel: null,
      selectedTemplate: null,
      aiForm: initialAIFormState,
      aiDesignSuggestions: initialAIDesignSuggestions,
      aiTypography: initialAITypographyState,
      dynamicSchema: initialDynamicSchemaState,
      templateResize: initialTemplateResizeState,
      colorShuffle: initialColorShuffleState,
      externalEventImport: initialExternalEventState,
      isGenerating: false,
      generationProgress: 0,
      generatedImage: null,
      generationError: null,
      recentCreatives: [],

      // Actions
      setVerticals: (verticals) => set({ verticals }),

      setModels: (models) => set({ models }),

      setLogos: (logos) => set({ logos }),

      setLandmarkSignatures: (landmarkSignatures) => set({ landmarkSignatures }),

      // Auto-initialize brand logos (Yi, CII, Bharat Rising) in their fixed positions
      // Yi Brand Guidelines 2025: These 3 logos are CONSTANT for every poster
      initializeDefaultLogoPlacements: (availableLogos) => {
        const { formData } = get()
        const currentPlacements = formData.logosPlacements

        // Brand logo patterns to auto-place (Yi, Bharat ONE, and CII)
        // These 3 logos are CONSTANT for every poster
        // Note: \s* added at start/end to handle trailing/leading whitespace in logo names
        const brandLogoConfigs = [
          {
            patterns: [/^\s*yi\s*$/i, /^\s*yi\s*logo\s*$/i, /^\s*young\s*indians\s*$/i],
            position: 'top-1' as LogoPosition,
            displayName: 'Yi Logo',
          },
          {
            patterns: [/^\s*bharat\s*one\s*$/i, /^\s*bharatone\s*$/i, /^\s*one\s*$/i],
            position: 'top-2' as LogoPosition,
            displayName: 'Bharat ONE',
          },
          {
            patterns: [/^\s*cii\s*$/i, /^\s*cii\s*logo\s*$/i, /confederation.*india/i],
            position: 'top-6' as LogoPosition,
            displayName: 'CII Logo',
          },
        ]

        const newPlacements: LogoPlacement[] = [...currentPlacements]
        const placedLogoIds = currentPlacements.map(p => p.logoId)

        for (const config of brandLogoConfigs) {
          // Find matching logo in available logos
          const matchingLogo = availableLogos.find(logo =>
            config.patterns.some(pattern => pattern.test(logo.name))
          )

          if (matchingLogo && !placedLogoIds.includes(matchingLogo.id)) {
            // Check if position is already taken
            const positionTaken = newPlacements.some(p => p.position === config.position)

            if (!positionTaken) {
              const logoType = detectLogoType(matchingLogo.name)

              newPlacements.push({
                logoId: matchingLogo.id,
                position: config.position,
                size: DEFAULT_LOGO_SIZE,
                logo: matchingLogo,
                isLocked: true, // Brand logos are always locked
                logoType,
                backgroundShape: DEFAULT_LOGO_BACKGROUND.shape,
                backgroundStyle: { ...DEFAULT_LOGO_BACKGROUND.style },
              })

              console.log(`[AutoPlace] ${config.displayName} placed at ${config.position}`)
            }
          }
        }

        // v9.0: Auto-detect JICATE logo and set as default footer partner
        // JICATE = Joint Initiative for Collective Action and Transformative Education
        const jicateLogo = availableLogos.find(logo =>
          logo.name && /jicate/i.test(logo.name)
        )

        // Get current footer partner status
        const currentFooterPartnerId = formData.enhanced4RowStrip.footer?.digitalPartner?.logoId

        // Only update if we added new placements OR have a JICATE logo to set as default partner
        if (newPlacements.length > currentPlacements.length || (jicateLogo && !currentFooterPartnerId)) {
          // v7.0: Also sync brand logo IDs to enhanced4RowStrip for 4-row strip rendering
          const brandLogoIds = newPlacements
            .filter(p => ['top-1', 'top-2', 'top-6'].includes(p.position))
            .sort((a, b) => {
              // Sort by position: top-1, top-2, top-6
              const order = ['top-1', 'top-2', 'top-6']
              return order.indexOf(a.position) - order.indexOf(b.position)
            })
            .map(p => p.logoId)

          set({
            formData: {
              ...formData,
              logosPlacements: newPlacements,
              enhanced4RowStrip: {
                ...formData.enhanced4RowStrip,
                rows: {
                  ...formData.enhanced4RowStrip.rows,
                  brand: {
                    ...formData.enhanced4RowStrip.rows.brand,
                    logoIds: brandLogoIds,
                  },
                },
                // v9.0: Set JICATE as default footer partner if detected and no partner set
                footer: {
                  ...formData.enhanced4RowStrip.footer,
                  digitalPartner: {
                    ...formData.enhanced4RowStrip.footer.digitalPartner,
                    // Only set if JICATE found AND no partner already set
                    ...(jicateLogo && !currentFooterPartnerId ? {
                      logoId: jicateLogo.id,
                      enabled: true,
                    } : {}),
                  },
                },
              },
            },
          })
          console.log('[AutoPlace] Brand logo IDs synced to 4-row strip:', brandLogoIds)
          if (jicateLogo && !currentFooterPartnerId) {
            console.log('[AutoPlace] JICATE set as default footer partner:', jicateLogo.name)
          }
        }
      },

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
        set((state) => {
          // v22.0: Clear AI marking when user manually edits a field
          const editedFields = Object.keys(data)
          const aiFilledFields = state.formData.aiFilledFields.filter(
            (field) => !editedFields.includes(field)
          )

          return {
            formData: {
              ...state.formData,
              formData: { ...state.formData.formData, ...data },
              aiFilledFields,
            },
          }
        }),

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
          // Exception: institution logoMode (admission formats) — institution's own logo takes priority
          const isInstitutionMode = get().selectedFormat?.logoMode === 'institution'
          const autoLocked = !isInstitutionMode && isLogoAutoLocked(logo.name)
          const autoLockedPosition = !isInstitutionMode ? getAutoLockedPosition(logo.name) : null

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
          // Exception: institution logoMode (admission formats) allows free logo positioning
          const isInstitutionMode = state.selectedFormat?.logoMode === 'institution'
          if (!isInstitutionMode && placement?.logo?.name && isLogoAutoLocked(placement.logo.name)) {
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

      // v21.0: Row-constrained logo position swap
      // Respects auto-locked brand logos (Yi, CII) and only allows swapping within the same row
      swapLogoPositions: (logoId1, logoId2) =>
        set((state) => {
          const placement1 = state.formData.logosPlacements.find(p => p.logoId === logoId1)
          const placement2 = state.formData.logosPlacements.find(p => p.logoId === logoId2)

          if (!placement1 || !placement2) {
            return state // Both logos must exist
          }

          // Check if either logo is auto-locked (brand logos)
          if (placement1.logo?.name && isLogoAutoLocked(placement1.logo.name)) {
            return state // Cannot swap auto-locked brand logos
          }
          if (placement2.logo?.name && isLogoAutoLocked(placement2.logo.name)) {
            return state // Cannot swap auto-locked brand logos
          }

          // Check if user has manually locked either logo
          if (placement1.isLocked || placement2.isLocked) {
            return state // Cannot swap manually locked logos
          }

          // Row-constrained: both logos must be in the same row
          const row1 = placement1.position.split('-')[0] // 'top', 'mid', or 'bottom'
          const row2 = placement2.position.split('-')[0]
          if (row1 !== row2) {
            return state // Cannot swap across different rows
          }

          // Perform the swap
          const pos1 = placement1.position
          const pos2 = placement2.position

          return {
            formData: {
              ...state.formData,
              logosPlacements: state.formData.logosPlacements.map((p) => {
                if (p.logoId === logoId1) return { ...p, position: pos2 }
                if (p.logoId === logoId2) return { ...p, position: pos1 }
                return p
              }),
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

      setLogoStripShape: (shape) =>
        set((state) => ({
          formData: {
            ...state.formData,
            designData: {
              ...state.formData.designData,
              stripShape: shape,
            },
          },
        })),

      setLogoStripOpacity: (opacity) =>
        set((state) => ({
          formData: {
            ...state.formData,
            logoStripMode: {
              ...state.formData.logoStripMode,
              opacity: Math.max(0, Math.min(100, opacity)), // Clamp 0-100
            },
          },
        })),

      setLogoStripLogoBound: (logoBound) =>
        set((state) => ({
          formData: {
            ...state.formData,
            logoStripMode: {
              ...state.formData.logoStripMode,
              logoBound,
            },
          },
        })),

      // ============================================================
      // ENHANCED 4-ROW STRIP ACTIONS
      // ============================================================

      setEnhanced4RowEnabled: (enabled) =>
        set((state) => ({
          formData: {
            ...state.formData,
            enhanced4RowStrip: {
              ...state.formData.enhanced4RowStrip,
              enabled,
            },
            // Disable legacy 3-row when 4-row is enabled
            logoStripMode: enabled
              ? { ...state.formData.logoStripMode, enabled: false }
              : state.formData.logoStripMode,
          },
        })),

      setEnhanced4RowVersion: (version) =>
        set((state) => ({
          formData: {
            ...state.formData,
            enhanced4RowStrip: {
              ...state.formData.enhanced4RowStrip,
              version,
            },
          },
        })),

      updateInitiativeText: (config) =>
        set((state) => ({
          formData: {
            ...state.formData,
            enhanced4RowStrip: {
              ...state.formData.enhanced4RowStrip,
              rows: {
                ...state.formData.enhanced4RowStrip.rows,
                initiative: {
                  ...state.formData.enhanced4RowStrip.rows.initiative,
                  ...config,
                },
              },
            },
          },
        })),

      // Initiative Preset - apply a saved initiative/chapter name configuration
      applyInitiativePreset: (preset) =>
        set((state) => ({
          formData: {
            ...state.formData,
            enhanced4RowStrip: {
              ...state.formData.enhanced4RowStrip,
              rows: {
                ...state.formData.enhanced4RowStrip.rows,
                initiative: {
                  ...preset.config,
                  enabled: true, // Ensure initiative row is enabled when preset is applied
                },
              },
            },
          },
        })),

      updatePartnerLabel: (config) =>
        set((state) => ({
          formData: {
            ...state.formData,
            enhanced4RowStrip: {
              ...state.formData.enhanced4RowStrip,
              rows: {
                ...state.formData.enhanced4RowStrip.rows,
                partner: {
                  ...state.formData.enhanced4RowStrip.rows.partner,
                  ...config,
                },
              },
            },
          },
        })),

      addVerticalLogo4Row: (logoId) =>
        set((state) => {
          const currentLogos = state.formData.enhanced4RowStrip.rows.vertical.logoIds
          // Enforce max 6 logos
          if (currentLogos.length >= MAX_VERTICAL_LOGOS) {
            console.warn(`[4-Row Strip] Max ${MAX_VERTICAL_LOGOS} vertical logos allowed`)
            return state
          }
          // Prevent duplicates
          if (currentLogos.includes(logoId)) {
            return state
          }

          // v19.0: Remove from footer partner if it exists there (prevents duplicate assignment)
          const currentPartnerLogoId = state.formData.enhanced4RowStrip.footer.digitalPartner.logoId
          const shouldClearPartner = currentPartnerLogoId === logoId

          return {
            formData: {
              ...state.formData,
              enhanced4RowStrip: {
                ...state.formData.enhanced4RowStrip,
                rows: {
                  ...state.formData.enhanced4RowStrip.rows,
                  vertical: {
                    ...state.formData.enhanced4RowStrip.rows.vertical,
                    logoIds: [...currentLogos, logoId],
                    enabled: true, // Auto-enable when logo added
                  },
                },
                footer: {
                  ...state.formData.enhanced4RowStrip.footer,
                  ...(shouldClearPartner && {
                    digitalPartner: {
                      ...state.formData.enhanced4RowStrip.footer.digitalPartner,
                      logoId: null,
                      enabled: false,
                    },
                  }),
                },
              },
            },
          }
        }),

      removeVerticalLogo4Row: (logoId) =>
        set((state) => {
          const currentLogos = state.formData.enhanced4RowStrip.rows.vertical.logoIds
          const updatedLogos = currentLogos.filter((id) => id !== logoId)
          return {
            formData: {
              ...state.formData,
              enhanced4RowStrip: {
                ...state.formData.enhanced4RowStrip,
                rows: {
                  ...state.formData.enhanced4RowStrip.rows,
                  vertical: {
                    ...state.formData.enhanced4RowStrip.rows.vertical,
                    logoIds: updatedLogos,
                    // Auto-disable if no logos left
                    enabled: updatedLogos.length > 0,
                  },
                },
              },
            },
          }
        }),

      reorderVerticalLogos4Row: (logoIds) =>
        set((state) => ({
          formData: {
            ...state.formData,
            enhanced4RowStrip: {
              ...state.formData.enhanced4RowStrip,
              rows: {
                ...state.formData.enhanced4RowStrip.rows,
                vertical: {
                  ...state.formData.enhanced4RowStrip.rows.vertical,
                  logoIds: logoIds.slice(0, MAX_VERTICAL_LOGOS), // Enforce max
                },
              },
            },
          },
        })),

      // v14.0: Apply vertical logo preset (replaces all logos)
      setVerticalLogoIds4Row: (logoIds) =>
        set((state) => ({
          formData: {
            ...state.formData,
            enhanced4RowStrip: {
              ...state.formData.enhanced4RowStrip,
              rows: {
                ...state.formData.enhanced4RowStrip.rows,
                vertical: {
                  ...state.formData.enhanced4RowStrip.rows.vertical,
                  logoIds: logoIds.slice(0, MAX_VERTICAL_LOGOS), // Enforce max
                  enabled: logoIds.length > 0, // Auto-enable/disable
                },
              },
            },
          },
        })),

      setPartnerLogo: (logoId) =>
        set((state) => ({
          formData: {
            ...state.formData,
            enhanced4RowStrip: {
              ...state.formData.enhanced4RowStrip,
              rows: {
                ...state.formData.enhanced4RowStrip.rows,
                partner: {
                  ...state.formData.enhanced4RowStrip.rows.partner,
                  logoId,
                },
              },
            },
          },
        })),

      update4RowBackground: (config) =>
        set((state) => ({
          formData: {
            ...state.formData,
            enhanced4RowStrip: {
              ...state.formData.enhanced4RowStrip,
              background: {
                ...state.formData.enhanced4RowStrip.background,
                ...config,
              },
            },
          },
        })),

      set4RowBrandEnabled: (enabled) =>
        set((state) => ({
          formData: {
            ...state.formData,
            enhanced4RowStrip: {
              ...state.formData.enhanced4RowStrip,
              rows: {
                ...state.formData.enhanced4RowStrip.rows,
                brand: {
                  ...state.formData.enhanced4RowStrip.rows.brand,
                  enabled,
                },
              },
            },
          },
        })),

      set4RowVerticalEnabled: (enabled) =>
        set((state) => ({
          formData: {
            ...state.formData,
            enhanced4RowStrip: {
              ...state.formData.enhanced4RowStrip,
              rows: {
                ...state.formData.enhanced4RowStrip.rows,
                vertical: {
                  ...state.formData.enhanced4RowStrip.rows.vertical,
                  enabled,
                },
              },
            },
          },
        })),

      // ============================================================
      // FOOTER ROW ACTIONS (Split Layout - Row 4 at Bottom)
      // ============================================================

      setFooterEnabled: (enabled) =>
        set((state) => ({
          formData: {
            ...state.formData,
            enhanced4RowStrip: {
              ...state.formData.enhanced4RowStrip,
              footer: {
                ...state.formData.enhanced4RowStrip.footer,
                enabled,
              },
            },
          },
        })),

      updateFooterConfig: (config) =>
        set((state) => ({
          formData: {
            ...state.formData,
            enhanced4RowStrip: {
              ...state.formData.enhanced4RowStrip,
              footer: {
                ...state.formData.enhanced4RowStrip.footer,
                ...config,
              },
            },
          },
        })),

      updateFooterHashtag: (hashtag) =>
        set((state) => ({
          formData: {
            ...state.formData,
            enhanced4RowStrip: {
              ...state.formData.enhanced4RowStrip,
              footer: {
                ...state.formData.enhanced4RowStrip.footer,
                hashtag: {
                  ...state.formData.enhanced4RowStrip.footer.hashtag,
                  ...hashtag,
                },
              },
            },
          },
        })),

      updateFooterWebsite: (website) =>
        set((state) => ({
          formData: {
            ...state.formData,
            enhanced4RowStrip: {
              ...state.formData.enhanced4RowStrip,
              footer: {
                ...state.formData.enhanced4RowStrip.footer,
                website: {
                  ...state.formData.enhanced4RowStrip.footer.website,
                  ...website,
                },
              },
            },
          },
        })),

      updateFooterDigitalPartner: (partner) =>
        set((state) => ({
          formData: {
            ...state.formData,
            enhanced4RowStrip: {
              ...state.formData.enhanced4RowStrip,
              footer: {
                ...state.formData.enhanced4RowStrip.footer,
                digitalPartner: {
                  ...state.formData.enhanced4RowStrip.footer.digitalPartner,
                  ...partner,
                },
              },
            },
          },
        })),

      updateFooterBackground: (background) =>
        set((state) => ({
          formData: {
            ...state.formData,
            enhanced4RowStrip: {
              ...state.formData.enhanced4RowStrip,
              footer: {
                ...state.formData.enhanced4RowStrip.footer,
                background: {
                  ...state.formData.enhanced4RowStrip.footer.background,
                  ...background,
                },
              },
            },
          },
        })),

      setFooterLayout: (layout) =>
        set((state) => ({
          formData: {
            ...state.formData,
            enhanced4RowStrip: {
              ...state.formData.enhanced4RowStrip,
              footer: {
                ...state.formData.enhanced4RowStrip.footer,
                layout,
              },
            },
          },
        })),

      // v7.0: Auto-enable digitalPartner when logo is selected
      // v19.0: Remove from vertical logos if it exists there (prevents duplicate assignment)
      setFooterPartnerLogo: (logoId) =>
        set((state) => {
          const currentVerticalLogos = state.formData.enhanced4RowStrip.rows.vertical.logoIds
          const cleanedVerticalLogos = logoId
            ? currentVerticalLogos.filter(id => id !== logoId)
            : currentVerticalLogos

          return {
            formData: {
              ...state.formData,
              enhanced4RowStrip: {
                ...state.formData.enhanced4RowStrip,
                rows: {
                  ...state.formData.enhanced4RowStrip.rows,
                  vertical: {
                    ...state.formData.enhanced4RowStrip.rows.vertical,
                    logoIds: cleanedVerticalLogos,
                  },
                },
                footer: {
                  ...state.formData.enhanced4RowStrip.footer,
                  digitalPartner: {
                    ...state.formData.enhanced4RowStrip.footer.digitalPartner,
                    logoId,
                    enabled: !!logoId, // Auto-enable when logo selected
                    // Ensure labelText has default when enabling
                    labelText: state.formData.enhanced4RowStrip.footer.digitalPartner.labelText || 'Digital Partner',
                  },
                },
              },
            },
          }
        }),

      // v13.0: Signature illustration actions
      updateFooterSignature: (signature) =>
        set((state) => ({
          formData: {
            ...state.formData,
            enhanced4RowStrip: {
              ...state.formData.enhanced4RowStrip,
              footer: {
                ...state.formData.enhanced4RowStrip.footer,
                signature: {
                  ...state.formData.enhanced4RowStrip.footer.signature,
                  ...signature,
                },
              },
            },
          },
        })),

      setFooterSignatureImage: (imageUrl) =>
        set((state) => ({
          formData: {
            ...state.formData,
            enhanced4RowStrip: {
              ...state.formData.enhanced4RowStrip,
              footer: {
                ...state.formData.enhanced4RowStrip.footer,
                signature: {
                  ...state.formData.enhanced4RowStrip.footer.signature,
                  imageUrl,
                  enabled: !!imageUrl, // Auto-enable when image set
                },
              },
            },
          },
        })),

      setFooterSignatureLogo: (logoId) =>
        set((state) => ({
          formData: {
            ...state.formData,
            enhanced4RowStrip: {
              ...state.formData.enhanced4RowStrip,
              footer: {
                ...state.formData.enhanced4RowStrip.footer,
                signature: {
                  ...state.formData.enhanced4RowStrip.footer.signature,
                  logoId,
                  enabled: !!logoId, // Auto-enable when logo selected
                },
              },
            },
          },
        })),

      // v14.0: Landmark signature selection (from landmark_signatures table)
      setFooterSignatureId: (signatureId) =>
        set((state) => ({
          formData: {
            ...state.formData,
            enhanced4RowStrip: {
              ...state.formData.enhanced4RowStrip,
              footer: {
                ...state.formData.enhanced4RowStrip.footer,
                signature: {
                  ...state.formData.enhanced4RowStrip.footer.signature,
                  signatureId,
                  // Clear logoId when using signatureId (landmark_signatures table)
                  logoId: signatureId ? null : state.formData.enhanced4RowStrip.footer.signature?.logoId,
                  enabled: !!signatureId, // Auto-enable when signature selected
                },
              },
            },
          },
        })),

      // v13.0: Social bar actions
      updateFooterSocialBar: (socialBar) =>
        set((state) => ({
          formData: {
            ...state.formData,
            enhanced4RowStrip: {
              ...state.formData.enhanced4RowStrip,
              footer: {
                ...state.formData.enhanced4RowStrip.footer,
                socialBar: {
                  ...state.formData.enhanced4RowStrip.footer.socialBar,
                  ...socialBar,
                },
              },
            },
          },
        })),

      // Footer Preset - apply a saved footer configuration
      applyFooterPreset: (preset) =>
        set((state) => ({
          formData: {
            ...state.formData,
            enhanced4RowStrip: {
              ...state.formData.enhanced4RowStrip,
              footer: {
                ...preset.config,
                enabled: true, // Ensure footer is enabled when preset is applied
              },
            },
          },
        })),

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

      // External Event Import Actions
      setExternalEventLoading: (isLoading) =>
        set((state) => ({
          externalEventImport: { ...state.externalEventImport, isLoading, error: null },
        })),

      setExternalEventError: (error) =>
        set((state) => ({
          externalEventImport: { ...state.externalEventImport, error, isLoading: false },
        })),

      setExternalEventMeta: (externalEventMeta) =>
        set((state) => ({
          externalEventImport: { ...state.externalEventImport, externalEventMeta },
        })),

      setExternalEventPreview: (previewData) =>
        set((state) => ({
          externalEventImport: { ...state.externalEventImport, previewData },
        })),

      setExternalEventChanges: (hasChanges, changedFields) =>
        set((state) => ({
          externalEventImport: { ...state.externalEventImport, hasChanges, changedFields },
        })),

      importExternalEvent: (meta, eventFormData, mappedFields, dynamicFields = [], formatId) => {
        const currentState = get()
        const currentFormData = currentState.formData

        // v3.1: Build complete updated state in single atomic operation
        let selectedFormat = currentState.selectedFormat
        let recentFormats = currentState.recentFormats

        // If formatId provided, update format selection (replaces dual set() calls)
        if (formatId) {
          console.log('[Creative Store] ✅ Auto-selecting inferred format:', formatId)
          const format = getFormatById(formatId)
          if (format) {
            selectedFormat = format
            // Update recent formats (add to front, remove duplicates, limit to max)
            recentFormats = [formatId, ...recentFormats.filter((id) => id !== formatId)].slice(0, MAX_RECENT_FORMATS)
          }
        } else {
          console.log('[Creative Store] ⚠️ No format inferred (feature flag disabled or inference failed)')
        }

        // Build updated formData with external event fields merged
        const updatedFormData = {
          ...currentFormData,
          formatId: formatId || currentFormData.formatId, // Use inferred or keep current
          customDimensions: formatId ? null : currentFormData.customDimensions, // Clear if format set
          formData: { ...currentFormData.formData, ...eventFormData }, // Merge field data
          aiFilledFields: [...new Set([...currentFormData.aiFilledFields, ...mappedFields])],
        }

        // Single atomic store update - fixes state conflict bug
        set({
          formData: updatedFormData,
          selectedFormat: selectedFormat,
          recentFormats: recentFormats,
          externalEventImport: {
            isLoading: false,
            error: null,
            externalEventMeta: meta,
            previewData: null,
            hasChanges: false,
            changedFields: [],
            dynamicFields, // v3.0: Store dynamic fields from external source
          },
          // Clear previous generation when importing new event
          generatedImage: formatId ? null : currentState.generatedImage,
          generationError: formatId ? null : currentState.generationError,
        })

        // Debug logging to verify data flow
        console.log('[Creative Store] Imported event data:', {
          formatId: updatedFormData.formatId,
          fieldCount: Object.keys(eventFormData).length,
          fields: Object.keys(eventFormData),
          mappedFields: mappedFields,
          formDataKeys: Object.keys(updatedFormData.formData),
        })
      },

      clearExternalEventImport: () =>
        set({ externalEventImport: initialExternalEventState }),

      updateFormFromExternalEvent: (eventFormData) => {
        const { formData } = get()
        set({
          formData: {
            ...formData,
            formData: { ...formData.formData, ...eventFormData },
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
          // v24.10: Resolve alias to canonical field ID (e.g., 'description' -> 'eventDescription')
          // This ensures AI suggestions are stored under the correct form field key
          const canonicalFieldId = resolveFieldId(field)

          // v22.0: Track AI-filled field (avoid duplicates)
          const aiFilledFields = formData.aiFilledFields.includes(canonicalFieldId)
            ? formData.aiFilledFields
            : [...formData.aiFilledFields, canonicalFieldId]

          set({
            formData: {
              ...formData,
              formData: { ...formData.formData, [canonicalFieldId]: suggestion.value },
              aiFilledFields,
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
        const newAiFields: string[] = []

        Object.entries(aiForm.suggestions).forEach(([field, suggestion]) => {
          if (suggestion?.value) {
            // v24.10: Resolve alias to canonical field ID (e.g., 'description' -> 'eventDescription')
            const canonicalFieldId = resolveFieldId(field)
            updates[canonicalFieldId] = suggestion.value
            newAiFields.push(canonicalFieldId)
          }
        })

        // v22.0: Track all AI-filled fields (avoid duplicates)
        const aiFilledFields = [...new Set([...formData.aiFilledFields, ...newAiFields])]

        set({
          formData: {
            ...formData,
            formData: { ...formData.formData, ...updates },
            aiFilledFields,
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

      updateCustomization: (customization) => {
        // DIAGNOSTIC: Log speaker photo updates
        if (customization.speakerPhoto) {
          console.log('[CREATIVE STORE] Updating speaker photo:', {
            enabled: customization.speakerPhoto.enabled,
            speakersCount: customization.speakerPhoto.speakers?.length || 0,
            speakersWithPhotos: customization.speakerPhoto.speakers?.filter(s => s.photoUrl).length || 0
          })
        }

        return set((state) => ({
          formData: {
            ...state.formData,
            designData: {
              ...state.formData.designData,
              customization: { ...state.formData.designData.customization, ...customization },
            },
          },
        }))
      },

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

      setUseBrandFont: (enabled) =>
        set((state) => ({
          formData: {
            ...state.formData,
            designData: {
              ...state.formData.designData,
              colorConfig: {
                ...state.formData.designData.colorConfig,
                useBrandFont: enabled,
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
                // Auto-disable brand colors for custom/preset palettes
                // Preserve state for 'ai_auto' (AI mood compatible with brand colors)
                useBrandColors: paletteId === 'ai_auto' ? state.formData.designData.colorConfig.useBrandColors : false,
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
                useBrandColors: false, // Auto-disable brand colors when custom colors selected
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

      updateTypography: (typography) =>
        set((state) => ({
          formData: {
            ...state.formData,
            designData: {
              ...state.formData.designData,
              typography: {
                ...state.formData.designData.typography,
                ...typography,
              },
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

      // AI Typography Suggestions Actions
      setEnableAITypography: (enabled) =>
        set((state) => ({
          aiTypography: {
            ...state.aiTypography,
            enableAI: enabled,
          },
        })),

      setTypographySuggestions: (suggestions) =>
        set((state) => ({
          aiTypography: {
            ...state.aiTypography,
            suggestions,
            isGenerating: false,
            error: null,
            hasFetchedSuggestions: suggestions !== null,
          },
        })),

      setTypographyGenerating: (generating) =>
        set((state) => ({
          aiTypography: {
            ...state.aiTypography,
            isGenerating: generating,
            error: generating ? null : state.aiTypography.error,
          },
        })),

      setTypographyError: (error) =>
        set((state) => ({
          aiTypography: {
            ...state.aiTypography,
            error,
            isGenerating: false,
          },
        })),

      applyTypographySuggestions: () =>
        set((state) => {
          const { suggestions } = state.aiTypography
          if (!suggestions) {
            console.warn('No typography suggestions to apply')
            return state
          }

          return {
            formData: {
              ...state.formData,
              designData: {
                ...state.formData.designData,
                typography: {
                  useBrandFont: false, // Disable brand font when applying AI suggestions
                  headingFont: suggestions.headingFont.value,
                  bodyFont: suggestions.bodyFont.value,
                  scale: suggestions.scale,
                },
              },
            },
            aiTypography: {
              ...state.aiTypography,
              suggestions: null, // Clear suggestions after applying
            },
          }
        }),

      clearTypographySuggestions: () =>
        set((state) => ({
          aiTypography: {
            ...state.aiTypography,
            suggestions: null,
            error: null,
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

      // Color Shuffle Actions
      shuffleColors: async (creativeId, variantCount = 5) => {
        set((state) => ({
          colorShuffle: {
            ...state.colorShuffle,
            isShuffling: true,
            shuffleError: null,
            parentCreativeId: creativeId,
          },
        }))

        try {
          const response = await fetch('/api/color-shuffle', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ creativeId, variantCount }),
          })

          const data = await response.json()

          if (!response.ok || !data.success) {
            // Enhanced error message for legacy creatives
            const message = data.isLegacyCreative
              ? 'This creative was generated before color shuffle support. Please regenerate it with custom colors to enable shuffling.'
              : data.message || data.error || 'Failed to shuffle colors'

            throw new Error(message)
          }

          set((state) => ({
            colorShuffle: {
              ...state.colorShuffle,
              isShuffling: false,
              shuffleVariants: data.variants,
              activeVariantIndex: 0,
              shuffleError: null,
            },
          }))
        } catch (error) {
          console.error('[Color Shuffle] Error:', error)
          set((state) => ({
            colorShuffle: {
              ...state.colorShuffle,
              isShuffling: false,
              shuffleError: error instanceof Error ? error.message : 'Unknown error',
            },
          }))
        }
      },

      selectVariant: (index) => {
        set((state) => {
          if (index < 0 || index >= state.colorShuffle.shuffleVariants.length) {
            return state
          }
          return {
            colorShuffle: {
              ...state.colorShuffle,
              activeVariantIndex: index,
            },
          }
        })
      },

      keepVariant: async () => {
        const state = get()
        const { shuffleVariants, activeVariantIndex, parentCreativeId } = state.colorShuffle

        if (!parentCreativeId || shuffleVariants.length === 0) {
          set((state) => ({
            colorShuffle: {
              ...state.colorShuffle,
              shuffleError: 'No variant selected',
            },
          }))
          return
        }

        const variant = shuffleVariants[activeVariantIndex]

        set((state) => ({
          colorShuffle: {
            ...state.colorShuffle,
            isSaving: true,
            shuffleError: null,
          },
        }))

        try {
          const response = await fetch('/api/save-variant', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              creativeId: parentCreativeId,
              variantDataUrl: variant.imageDataUrl,
              colorMapping: variant.colorMapping,
            }),
          })

          const data = await response.json()

          if (!response.ok || !data.success) {
            throw new Error(data.error || 'Failed to save variant')
          }

          // Update generated image to show the saved variant
          set((state) => ({
            generatedImage: data.shuffledImageUrl,
            colorShuffle: {
              ...state.colorShuffle,
              isSaving: false,
              shuffleError: null,
            },
          }))
        } catch (error) {
          console.error('[Keep Variant] Error:', error)
          set((state) => ({
            colorShuffle: {
              ...state.colorShuffle,
              isSaving: false,
              shuffleError: error instanceof Error ? error.message : 'Unknown error',
            },
          }))
        }
      },

      resetToOriginal: () => {
        set((state) => ({
          colorShuffle: initialColorShuffleState,
        }))
      },

      setShuffleError: (error) =>
        set((state) => ({
          colorShuffle: {
            ...state.colorShuffle,
            shuffleError: error,
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
          colorShuffle: initialColorShuffleState,
          externalEventImport: initialExternalEventState,
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
        // NOTE: Speaker photo data is intentionally NOT persisted
        // Users expect fresh state when starting a new session
      }),
      // Rehydrate selectedFormat from persisted ID
      // CRITICAL: Reset all loading states to prevent infinite loading on page reload
      onRehydrateStorage: () => (state) => {
        if (state) {
          const persistedState = state as CreativeState & {
            selectedFormatId?: CreativeFormatId | null
          }
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

          // Reset color shuffle states (session-only, never persisted)
          state.colorShuffle = initialColorShuffleState

          // Reset external event import states (session-only, never persisted)
          state.externalEventImport = initialExternalEventState

          // Migrate old creatives without useBrandFont (backward compatibility)
          if (state.formData?.designData?.colorConfig) {
            const colorConfig = state.formData.designData.colorConfig
            if (colorConfig.useBrandFont === undefined) {
              colorConfig.useBrandFont = true // Default to enabled for backward compatibility
            }
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
