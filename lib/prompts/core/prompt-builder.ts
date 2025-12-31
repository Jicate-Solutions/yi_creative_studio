/**
 * Core Prompt Builder
 * Constructs model-agnostic PromptIntent from generation parameters
 * Following "Nano Banana Pro" guide principles
 */

import type {
  PromptIntent,
  GeneratePromptParams,
  ThemeIntent,
  StyleIntent,
  BrandContext,
  ResolutionQuality,
  DesignContext,
} from '../types'
import { THEMES, POSTER_STYLES } from '@/lib/config/design-constants'
import { getThemeAtmosphere } from '../data/theme-atmospheres'
import { getStyleTreatment } from '../data/style-treatments'
import { getAudienceContext } from '../data/audience-contexts'
import { getResolutionModifiers } from '../data/resolution-modifiers'
import { buildColorPaletteIntent } from '../helpers/color-narrative'
import { getLanguageConfig, getAvailableLanguages } from '../languageConfigs'
import { getTemplateForFormat } from '../knowledge-base'

// ============================================================
// LANGUAGE MAPPING (Legacy - use languageConfigs.ts for full config)
// ============================================================

// Get languages from the comprehensive language configs
const LANGUAGES = getAvailableLanguages().map((lang) => ({
  value: lang.value,
  label: lang.label,
}))

// ============================================================
// DEFAULT VALUES
// ============================================================

const DEFAULT_BRAND: BrandContext = {
  primaryColor: '#1B998B',
  secondaryColor: '#FF6B35',
  accentColor: '#3366FF',
  backgroundColor: '#FFFFFF',
  headlineFont: 'Inter',
  bodyFont: 'Inter',
  headerHeight: 0, // Default to edge-to-edge (no reserved zones)
  footerHeight: 0, // Default to edge-to-edge (no reserved zones)
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Build ThemeIntent from theme value
 */
function buildThemeIntent(themeValue: string): ThemeIntent {
  const themeData = THEMES.find((t) => t.value === themeValue)
  const atmosphere = getThemeAtmosphere(themeValue)

  if (!themeData) {
    // Fallback to corporate
    const fallbackTheme = THEMES.find((t) => t.value === 'corporate')!
    return {
      value: 'corporate',
      label: fallbackTheme.label,
      keywords: [...fallbackTheme.keywords],
      colorTendency: fallbackTheme.colorTendency,
      description: fallbackTheme.description,
      atmosphere: getThemeAtmosphere('corporate'),
    }
  }

  return {
    value: themeData.value,
    label: themeData.label,
    keywords: [...themeData.keywords],
    colorTendency: themeData.colorTendency,
    description: themeData.description,
    atmosphere,
  }
}

/**
 * Build StyleIntent from style value
 */
function buildStyleIntent(styleValue: string): StyleIntent {
  const styleData = POSTER_STYLES.find((s) => s.value === styleValue)
  const treatment = getStyleTreatment(styleValue)

  if (!styleData) {
    // Fallback to gradient
    const fallbackStyle = POSTER_STYLES.find((s) => s.value === 'gradient')!
    return {
      value: 'gradient',
      label: fallbackStyle.label,
      keywords: [...fallbackStyle.keywords],
      description: fallbackStyle.description,
      treatment: getStyleTreatment('gradient'),
    }
  }

  return {
    value: styleData.value,
    label: styleData.label,
    keywords: [...styleData.keywords],
    description: styleData.description,
    treatment,
  }
}

/**
 * Build BrandContext from API params
 * Now respects edgeToEdge layout setting from customization
 */
function buildBrandContext(
  brand: GeneratePromptParams['brand'],
  customization?: GeneratePromptParams['customization']
): BrandContext {
  // Check if edge-to-edge layout is enabled (default to true for full-bleed designs)
  const isEdgeToEdge = customization?.layout?.edgeToEdge ?? true

  if (!brand) {
    return {
      ...DEFAULT_BRAND,
      // Override heights based on edge-to-edge setting
      headerHeight: isEdgeToEdge ? 0 : DEFAULT_BRAND.headerHeight,
      footerHeight: isEdgeToEdge ? 0 : DEFAULT_BRAND.footerHeight,
    }
  }

  return {
    primaryColor: brand.primary_color || DEFAULT_BRAND.primaryColor,
    secondaryColor: brand.secondary_color || DEFAULT_BRAND.secondaryColor,
    accentColor: brand.accent_color || DEFAULT_BRAND.accentColor,
    backgroundColor: brand.background_color || DEFAULT_BRAND.backgroundColor,
    headlineFont: brand.headline_font || DEFAULT_BRAND.headlineFont,
    bodyFont: brand.body_font || DEFAULT_BRAND.bodyFont,
    // Use layout customization if available, otherwise fall back to brand settings
    headerHeight: isEdgeToEdge ? 0 : (customization?.layout?.headerHeight ?? brand.header_height ?? DEFAULT_BRAND.headerHeight),
    footerHeight: isEdgeToEdge ? 0 : (customization?.layout?.footerHeight ?? brand.footer_height ?? DEFAULT_BRAND.footerHeight),
  }
}

/**
 * Get language label from language code
 */
function getLanguageLabel(languageCode: string): string {
  const lang = LANGUAGES.find((l) => l.value === languageCode)
  return lang?.label || 'English'
}

// ============================================================
// MAIN BUILDER
// ============================================================

/**
 * Build a complete PromptIntent from generation parameters
 * This is the core function that creates the model-agnostic intent
 */
export function buildPromptIntent(params: GeneratePromptParams): PromptIntent {
  // Build brand context (now respects layout customization for edge-to-edge)
  const brandContext = buildBrandContext(params.brand, params.customization)

  // Build theme intent with atmosphere
  const themeIntent = buildThemeIntent(params.theme)

  // Build style intent with treatment
  const styleIntent = buildStyleIntent(params.style)

  // Build color palette intent with narrative
  // Pass colorConfig if available (from UI color toggle/palette selection)
  const colorPaletteIntent = buildColorPaletteIntent(
    params.colorScheme,
    brandContext,
    params.colorConfig
  )

  // Get audience context based on event type
  const eventType = params.content.eventType || ''
  const audienceContext = getAudienceContext(eventType, params.organizationName)

  // Get resolution modifiers
  const resolutionModifiers = getResolutionModifiers(params.resolution)

  // Resolve creative template from knowledge base
  // Use format if provided, otherwise fall back to type for backward compatibility
  const formatId = params.format || params.type
  const creativeTemplate = getTemplateForFormat(formatId)

  // Build the complete intent
  const intent: PromptIntent = {
    creativeType: params.type,
    format: formatId,
    content: params.content,
    theme: themeIntent,
    style: styleIntent,
    colorPalette: colorPaletteIntent,
    audienceContext,
    aspectRatio: params.aspectRatio,
    resolution: params.resolution,
    resolutionModifiers,
    dimensions: params.dimensions,
    brand: brandContext,
    organizationName: params.organizationName,
    customization: params.customization,
    language: params.language,
    languageLabel: getLanguageLabel(params.language),
    // Pass through AI-generated design context if provided
    designContext: params.designContext,
    // Resolved creative template from knowledge base
    creativeTemplate,
    // Pass through logo awareness for Smart Layout
    logoAwareness: params.logoAwareness,
    // Build speaker context for background suppression
    // v6.5: Include position and shape for zone-specific restrictions
    speakerContext: params.speakerPhotoConfig?.enabled ? {
      hasSpeakerPhoto: true,
      count: 1,
      layout: 'single' as const,
      speakerPhotoPosition: (params.speakerPhotoConfig.position || 'left') as 'left' | 'right' | 'center' | 'bottom-left' | 'bottom-right',
      speakerPhotoShape: (params.speakerPhotoConfig.shape || 'circle') as 'circle' | 'rounded' | 'square'
    } : undefined
  }

  return intent
}

/**
 * Get metadata about the prompt intent for debugging/logging
 */
export function getPromptIntentMetadata(intent: PromptIntent): {
  creativeType: string
  theme: string
  style: string
  colorScheme: string
  resolution: string
  aspectRatio: string
  eventType: string
  hasCustomization: boolean
  language: string
} {
  return {
    creativeType: intent.creativeType,
    theme: intent.theme.value,
    style: intent.style.value,
    colorScheme: intent.colorPalette.scheme,
    resolution: intent.resolution,
    aspectRatio: intent.aspectRatio,
    eventType: intent.content.eventType || 'unknown',
    hasCustomization: !!intent.customization,
    language: intent.language,
  }
}

/**
 * Validate prompt intent has all required fields
 */
export function validatePromptIntent(intent: PromptIntent): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  // Check required content fields
  if (!intent.content.title && !intent.content.eventName) {
    errors.push('Missing title or event name in content')
  }

  // Check dimensions
  if (!intent.dimensions.width || !intent.dimensions.height) {
    errors.push('Invalid dimensions')
  }

  // Check theme and style
  if (!intent.theme.value) {
    errors.push('Missing theme')
  }
  if (!intent.style.value) {
    errors.push('Missing style')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
