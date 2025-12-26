/**
 * Design Intelligence - AI-Powered Typography Analysis
 * Export all public APIs
 */

// Main analyzer
export {
  analyzeEventTypography,
  quickAnalyze,
  canAnalyzeEvent,
  type DesignIntelligence
} from './analyzer'

// Typography mapper
export {
  mapStyleToTypography,
  generateTypographyFromAnalysis,
  getTypographyPreview,
  typographyToCSS,
  type TypographyConfig,
  type TypographyGuidance,
  type AnalysisResult
} from './typography-mapper'

// Style archetypes
export {
  STYLE_ARCHETYPES,
  calculateArchetypeConfidence,
  findBestArchetype,
  type StyleArchetype,
  type ArchetypeDefinition,
  type TypographyStyle
} from './style-archetypes'

// Language utilities
export {
  getScriptForLanguage,
  getFontForScript,
  getAllFontsForScript,
  detectScriptFromText,
  getLanguageConfig,
  isLanguageSupported,
  getFontRecommendation,
  mapFontStyleToFont,
  LANGUAGE_CONFIGS,
  SCRIPT_FONTS,
  type Script,
  type LanguageConfig
} from './language-utils'

// Fallback rules
export {
  getFallbackRecommendation,
  getQuickArchetype,
  type FallbackRecommendation
} from './fallback-rules'
