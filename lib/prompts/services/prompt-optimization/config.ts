/**
 * Prompt Optimization Configuration
 *
 * Centralizes all optimization settings for the prompt system:
 * - Dynamic temperature by format type
 * - Caching strategies
 * - A/B testing configuration
 */

import type { CreativeFormatId } from '@/lib/config/creative-formats'

// ============================================================
// DYNAMIC TEMPERATURE CONFIGURATION
// ============================================================

/**
 * Temperature settings by format category
 *
 * Lower temperature (0.7-0.9): More deterministic, consistent outputs
 * - Best for: Formal documents, business materials, certificates
 *
 * Medium temperature (0.9-1.1): Balanced creativity and consistency
 * - Best for: Social posts, presentations, general marketing
 *
 * Higher temperature (1.1-1.4): More creative, varied outputs
 * - Best for: Event posters, thumbnails, creative campaigns
 */
export interface TemperatureConfig {
  /** Temperature for Design Intelligence stage */
  designIntelligence: number
  /** Temperature for Ultra-Pro Prompt stage */
  ultraProPrompt: number
  /** Top-P sampling parameter */
  topP: number
  /** Description for logging */
  description: string
}

const TEMPERATURE_CONFIGS: Record<string, TemperatureConfig> = {
  // Formal/Document formats - Lower creativity, higher consistency
  formal: {
    designIntelligence: 0.8,
    ultraProPrompt: 0.7,
    topP: 0.9,
    description: 'Formal documents requiring consistency',
  },

  // Professional/Business formats - Balanced
  professional: {
    designIntelligence: 1.0,
    ultraProPrompt: 0.9,
    topP: 0.92,
    description: 'Professional materials with moderate creativity',
  },

  // Social/Marketing formats - Medium-high creativity
  social: {
    designIntelligence: 1.2,
    ultraProPrompt: 1.0,
    topP: 0.95,
    description: 'Social content requiring engagement',
  },

  // Creative/Event formats - Maximum creativity
  creative: {
    designIntelligence: 1.4,
    ultraProPrompt: 1.1,
    topP: 0.98,
    description: 'Creative designs requiring uniqueness',
  },

  // Thumbnail/Click formats - High creativity for scroll-stop
  clickbait: {
    designIntelligence: 1.5,
    ultraProPrompt: 1.2,
    topP: 0.98,
    description: 'Click-optimized content requiring maximum impact',
  },
}

/**
 * Maps format IDs to temperature categories
 */
const FORMAT_TO_CATEGORY: Record<string, string> = {
  // Formal documents
  certificate: 'formal',
  letterhead: 'formal',

  // Professional materials
  business_card: 'professional',
  presentation: 'professional',
  presentation_16_9: 'professional',
  presentation_4_3: 'professional',
  linkedin_post: 'professional',

  // Social/Marketing
  instagram_post: 'social',
  instagram_story: 'social',
  story: 'social',
  whatsapp_status: 'social',
  social_post: 'social',
  facebook_post: 'social',
  twitter_post: 'social',

  // Creative/Event
  event_poster: 'creative',
  flyer: 'creative',
  flyer_a4: 'creative',
  flyer_a5: 'creative',
  web_banner: 'creative',

  // Click-optimized
  youtube_thumbnail: 'clickbait',
  tiktok_cover: 'clickbait',
}

/**
 * Get temperature configuration for a specific format
 */
export function getTemperatureConfig(formatId?: string): TemperatureConfig {
  const category = formatId ? FORMAT_TO_CATEGORY[formatId] || 'professional' : 'professional'
  return TEMPERATURE_CONFIGS[category] || TEMPERATURE_CONFIGS.professional
}

// ============================================================
// CACHING CONFIGURATION
// ============================================================

export interface CacheConfig {
  /** Enable/disable caching */
  enabled: boolean
  /** TTL for cached prompts in seconds */
  ttlSeconds: number
  /** Maximum cache entries */
  maxEntries: number
  /** Cache key prefix */
  keyPrefix: string
}

export const CACHE_CONFIG: CacheConfig = {
  enabled: true,
  ttlSeconds: 3600, // 1 hour
  maxEntries: 1000,
  keyPrefix: 'prompt_cache_',
}

/**
 * System prompts that should be cached (static content)
 * These are the long instruction prompts that don't change per request
 */
export const CACHEABLE_SYSTEM_PROMPTS = {
  designIntelligence: 'design_intelligence_system',
  ultraProPrompt: 'ultra_pro_system',
  formatBuilder: 'format_builder_system',
} as const

// ============================================================
// A/B TESTING CONFIGURATION
// ============================================================

export interface ABTestConfig {
  /** Test ID for tracking */
  testId: string
  /** Test name for logging */
  name: string
  /** Variants with weights (should sum to 1.0) */
  variants: {
    id: string
    weight: number
    config: Partial<TemperatureConfig>
  }[]
  /** Whether test is active */
  active: boolean
}

/**
 * Active A/B tests for prompt optimization
 */
export const AB_TESTS: ABTestConfig[] = [
  {
    testId: 'creative_twist_emphasis_v1',
    name: 'Creative Twist Emphasis Test',
    active: false, // Enable when ready to test
    variants: [
      {
        id: 'control',
        weight: 0.5,
        config: {}, // No changes
      },
      {
        id: 'high_creativity',
        weight: 0.5,
        config: {
          designIntelligence: 1.6,
          topP: 0.99,
        },
      },
    ],
  },
]

/**
 * Select A/B test variant based on random distribution
 */
export function selectABVariant(testId: string): { variantId: string; config: Partial<TemperatureConfig> } | null {
  const test = AB_TESTS.find(t => t.testId === testId && t.active)
  if (!test) return null

  const random = Math.random()
  let cumulative = 0

  for (const variant of test.variants) {
    cumulative += variant.weight
    if (random <= cumulative) {
      return { variantId: variant.id, config: variant.config }
    }
  }

  // Fallback to first variant
  return { variantId: test.variants[0].id, config: test.variants[0].config }
}

// ============================================================
// FEEDBACK INTEGRATION CONFIG
// ============================================================

export interface FeedbackConfig {
  /** Minimum confidence score to apply learned pattern */
  minConfidence: number
  /** Maximum number of patterns to apply per prompt */
  maxPatternsPerPrompt: number
  /** Weight given to feedback patterns vs base prompt */
  feedbackWeight: number
}

export const FEEDBACK_CONFIG: FeedbackConfig = {
  minConfidence: 0.7,
  maxPatternsPerPrompt: 3,
  feedbackWeight: 0.3,
}
