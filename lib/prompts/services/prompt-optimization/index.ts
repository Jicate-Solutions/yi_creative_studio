/**
 * Prompt Optimization Module
 *
 * Centralizes all prompt optimization utilities:
 * - Dynamic temperature configuration
 * - Caching (Claude & Gemini)
 * - Schema validation
 * - Feedback integration
 * - A/B testing
 */

// Configuration
export {
  getTemperatureConfig,
  selectABVariant,
  CACHE_CONFIG,
  FEEDBACK_CONFIG,
  type TemperatureConfig,
  type CacheConfig,
  type ABTestConfig,
  type FeedbackConfig,
} from './config'

// Caching
export {
  // Key generation
  generateDesignContextCacheKey,
  generateUltraProCacheKey,
  // Cache operations
  getCachedDesignContext,
  setCachedDesignContext,
  getCachedUltraProPrompt,
  setCachedUltraProPrompt,
  clearPromptCaches,
  getPromptCacheStats,
  // Claude caching
  wrapForClaudeCache,
  createClaudeCacheableRequest,
  // Gemini caching
  hasValidGeminiCache,
  setGeminiCachedContent,
  getGeminiCachedContentName,
  prepareGeminiCacheContent,
} from './cache'

// Schema validation
export {
  // Schemas
  DesignContextSchema,
  UltraProPromptSchema,
  TypographyGuidanceSchema,
  DecorativeElementsSchema,
  FeedbackPatternSchema,
  // Types
  type DesignContextValidated,
  type UltraProPromptValidated,
  type FeedbackPattern,
  // Validation functions
  validateDesignContext,
  validateUltraProPrompt,
  validateAndFixDesignContext,
  validateAndFixUltraProPrompt,
} from './schemas'

// Feedback integration
export {
  fetchRelevantPatterns,
  applyPatternsToDesignContext,
  applyPatternsToPrompt,
  recordPatternApplication,
  createLearnedPattern,
  integratePattersWithDesignContext,
} from './feedback-integration'
