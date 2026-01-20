/**
 * AI Pricing Configuration
 *
 * Contains pricing data for all AI providers (Gemini, Claude) and cost limit settings.
 * Prices are in USD per million tokens unless otherwise specified.
 *
 * Sources:
 * - Gemini: https://ai.google.dev/gemini-api/docs/pricing
 * - Claude: https://www.anthropic.com/pricing
 *
 * Last updated: December 2025
 *
 * IMPORTANT: For image generation models:
 * - outputPerMillion is for TEXT output only
 * - imageOutputPerMillion is for IMAGE output ($30/1M for Gemini 2.5 Flash Image)
 * - imageGeneration is a convenience flat rate per image
 */

// ============================================================
// PRICING CONSTANTS
// ============================================================

export type AIProvider = 'gemini' | 'claude'

export interface ModelPricing {
  inputPerMillion: number           // USD per 1M input tokens
  outputPerMillion: number          // USD per 1M output tokens (text)
  imageOutputPerMillion?: number    // USD per 1M output tokens (images) - NEW
  imageGeneration?: number          // USD per image (flat rate convenience)
  cachedInputPerMillion?: number    // USD per 1M cached tokens
}

export const AI_PRICING: Record<AIProvider, Record<string, ModelPricing>> = {
  gemini: {
    // ============================================================
    // Image Generation Models
    // ============================================================
    // Gemini 2.5 Flash Image - Primary image generation model
    // Official pricing: Input $0.30/1M, Image output $30/1M (1290 tokens = $0.039)
    'gemini-2.5-flash-image': {
      inputPerMillion: 0.30,
      outputPerMillion: 2.50,          // Text output (thinking tokens)
      imageOutputPerMillion: 30.00,    // Image output tokens
      imageGeneration: 0.039,          // $0.039 per image (1290 tokens @ $30/1M)
      cachedInputPerMillion: 0.03,     // Fixed: was 0.075, official is $0.03
    },

    // ============================================================
    // Text Models (Gemini 2.5 Flash family)
    // ============================================================
    'gemini-2.5-flash': {
      inputPerMillion: 0.30,
      outputPerMillion: 2.50,          // Includes thinking tokens
      cachedInputPerMillion: 0.03,     // Fixed: was 0.075, official is $0.03
    },
    'gemini-2.5-flash-lite': {
      inputPerMillion: 0.10,
      outputPerMillion: 0.40,
      cachedInputPerMillion: 0.01,     // Fixed: was 0.025, official is $0.01
    },

    // ============================================================
    // Text Models (Gemini 2.0 Flash family)
    // ============================================================
    'gemini-2.0-flash': {
      inputPerMillion: 0.10,
      outputPerMillion: 0.40,
      cachedInputPerMillion: 0.025,    // Correct
    },
    'gemini-2.0-flash-exp': {
      inputPerMillion: 0.10,
      outputPerMillion: 0.40,
      cachedInputPerMillion: 0.025,
    },
    'gemini-2.0-flash-001': {
      inputPerMillion: 0.10,
      outputPerMillion: 0.40,
      cachedInputPerMillion: 0.025,
    },

    // ============================================================
    // Pro Models (more capable, more expensive)
    // ============================================================
    'gemini-2.5-pro': {
      inputPerMillion: 1.25,           // <= 200k tokens
      outputPerMillion: 10.00,         // Includes thinking tokens
      cachedInputPerMillion: 0.125,    // Fixed: was 0.3125, official is $0.125
    },
    'gemini-3-pro-preview': {
      inputPerMillion: 2.00,           // <= 200k tokens
      outputPerMillion: 12.00,         // Text output (thinking tokens)
      cachedInputPerMillion: 0.20,     // Fixed: was 0.50, official is $0.20
    },

    // Gemini 3 Pro Image Preview - 4K capable image generation
    // Official pricing: $120/M output tokens for images
    // 1K/2K = 1,120 tokens → $0.1344 per image
    // 4K = 2,000 tokens → $0.24 per image
    'gemini-3-pro-image-preview': {
      inputPerMillion: 2.00,
      outputPerMillion: 12.00,         // Text output (thinking tokens)
      imageOutputPerMillion: 120.00,   // Image output tokens
      imageGeneration: 0.1344,         // Default 1K/2K price
      cachedInputPerMillion: 0.20,     // Fixed: was 0.50, official is $0.20
    },
  },
  claude: {
    // Haiku 4.5 - Latest fast model (recommended)
    // Updated Dec 2025: $1.00/$5.00 per million tokens
    'claude-haiku-4-5-20251001': {
      inputPerMillion: 1.00,
      outputPerMillion: 5.00,
      cachedInputPerMillion: 0.10,  // 10% of input price
    },
    'claude-haiku-4-5': {
      inputPerMillion: 1.00,
      outputPerMillion: 5.00,
      cachedInputPerMillion: 0.10,
    },
    // Haiku 3.5 - Legacy (kept for backwards compatibility)
    'claude-3-5-haiku-latest': {
      inputPerMillion: 0.80,
      outputPerMillion: 4.00,
      cachedInputPerMillion: 0.08,
    },
    'claude-3-5-haiku-20241022': {
      inputPerMillion: 0.80,
      outputPerMillion: 4.00,
      cachedInputPerMillion: 0.08,
    },
    // Sonnet 4.5 - Balanced (latest)
    'claude-sonnet-4-5-20251022': {
      inputPerMillion: 3.00,
      outputPerMillion: 15.00,
      cachedInputPerMillion: 0.30,
    },
    // Sonnet 4 - Balanced
    'claude-sonnet-4-20250514': {
      inputPerMillion: 3.00,
      outputPerMillion: 15.00,
      cachedInputPerMillion: 0.30,
    },
    // Sonnet 3.5 - Legacy
    'claude-3-5-sonnet-latest': {
      inputPerMillion: 3.00,
      outputPerMillion: 15.00,
      cachedInputPerMillion: 0.30,
    },
    // Opus 4.5 - Most capable (pricing dropped significantly Dec 2025!)
    // Updated: $5.00/$25.00 (was $15/$75 for Opus 3)
    'claude-opus-4-5-20251101': {
      inputPerMillion: 5.00,
      outputPerMillion: 25.00,
      cachedInputPerMillion: 0.50,
    },
    // Opus 4 - Legacy
    'claude-opus-4-20250514': {
      inputPerMillion: 15.00,
      outputPerMillion: 75.00,
      cachedInputPerMillion: 1.50,
    },
  },
}

// ============================================================
// COST LIMITS
// ============================================================

export const COST_LIMITS = {
  perGeneration: {
    warning: 0.50,   // $0.50 USD - Show warning to user
    block: 2.00,     // $2.00 USD - Block generation (requires override)
  },
  daily: {
    warning: 10.00,  // $10 USD/day - Show warning
    limit: 50.00,    // $50 USD/day - Hard limit
  },
  monthly: {
    warning: 100.00, // $100 USD/month - Show warning
    limit: 500.00,   // $500 USD/month - Hard limit
  },
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Get pricing for a specific model
 */
export function getModelPricing(provider: AIProvider, model: string): ModelPricing | null {
  const providerPricing = AI_PRICING[provider]
  if (!providerPricing) return null

  // Try exact match first
  if (providerPricing[model]) {
    return providerPricing[model]
  }

  // Try to find a matching model (handles version suffixes)
  const modelKey = Object.keys(providerPricing).find(key =>
    model.startsWith(key) || key.startsWith(model)
  )

  return modelKey ? providerPricing[modelKey] : null
}

/**
 * Calculate cost for token usage
 */
export function calculateTokenCost(
  provider: AIProvider,
  model: string,
  inputTokens: number,
  outputTokens: number,
  cachedTokens: number = 0
): number {
  const pricing = getModelPricing(provider, model)
  if (!pricing) {
    console.warn(`[AI Pricing] Unknown model: ${provider}/${model}, using default pricing`)
    // Default fallback pricing
    return (inputTokens * 0.001 + outputTokens * 0.004) / 1000
  }

  const inputCost = (inputTokens / 1_000_000) * pricing.inputPerMillion
  const outputCost = (outputTokens / 1_000_000) * pricing.outputPerMillion
  const cachedCost = pricing.cachedInputPerMillion
    ? (cachedTokens / 1_000_000) * pricing.cachedInputPerMillion
    : 0

  return inputCost + outputCost + cachedCost
}

/**
 * Calculate cost for image generation
 * Supports resolution-based pricing for Gemini 3 Pro Image Preview
 */
export function calculateImageCost(
  provider: AIProvider,
  model: string,
  imageCount: number = 1,
  resolution: '1K' | '2K' | '4K' = '1K'
): number {
  const pricing = getModelPricing(provider, model)
  if (!pricing?.imageGeneration) {
    console.warn(`[AI Pricing] No image pricing for: ${provider}/${model}`)
    return 0.039 * imageCount // Default to Gemini Flash image pricing
  }

  // Resolution-based pricing for Gemini 3 Pro Image Preview
  // Based on output tokens: 1K/2K = 1,120 tokens, 4K = 2,000 tokens
  // At $120/M tokens: 1K/2K = $0.1344, 4K = $0.24
  if (model === 'gemini-3-pro-image-preview') {
    const cost = resolution === '4K' ? 0.24 : 0.1344
    return cost * imageCount
  }

  return pricing.imageGeneration * imageCount
}

/**
 * Estimate cost before generation (for cost limit checks)
 */
export function estimateGenerationCost(params: {
  promptLength: number        // Character count
  provider: AIProvider
  model: string
  includesImage?: boolean
  resolution?: '1K' | '2K' | '4K'
}): number {
  // Rough token estimation: ~4 characters per token
  const estimatedInputTokens = Math.ceil(params.promptLength / 4)
  const estimatedOutputTokens = params.includesImage ? 100 : 500 // Images have minimal text output

  let cost = calculateTokenCost(
    params.provider,
    params.model,
    estimatedInputTokens,
    estimatedOutputTokens
  )

  if (params.includesImage) {
    // Add image cost with resolution multiplier
    const resolutionMultiplier = params.resolution === '4K' ? 4 : params.resolution === '2K' ? 2 : 1
    cost += calculateImageCost(params.provider, params.model, 1) * resolutionMultiplier
  }

  return cost
}

/**
 * Check if estimated cost exceeds limits
 */
export function checkCostLimits(estimatedCostUsd: number): {
  allowed: boolean
  warning: boolean
  message?: string
} {
  if (estimatedCostUsd > COST_LIMITS.perGeneration.block) {
    return {
      allowed: false,
      warning: true,
      message: `Estimated cost ($${estimatedCostUsd.toFixed(2)}) exceeds limit ($${COST_LIMITS.perGeneration.block.toFixed(2)}). Please reduce prompt complexity or contact admin.`,
    }
  }

  if (estimatedCostUsd > COST_LIMITS.perGeneration.warning) {
    return {
      allowed: true,
      warning: true,
      message: `This generation is estimated to cost $${estimatedCostUsd.toFixed(2)}, which is higher than usual.`,
    }
  }

  return { allowed: true, warning: false }
}

// ============================================================
// REQUEST TYPE DEFINITIONS
// ============================================================

export type RequestType =
  | 'design_intelligence'
  | 'ultra_pro_prompt'
  | 'image_generation'
  | 'field_suggestion'
  | 'template_adaptation'
  | 'resize_template'
  | 'feedback_analysis'
  | 'design_analysis_agent'
  | 'ui_ux_ultra_agent'
  | 'feedback_learning_analyze'
  | 'feedback_learning_understand'
  | 'feedback_learning_understand'
  | 'logo_placement'
  | 'typography_suggestion'
  | 'speaker_layout_analysis'
  | 'multi_format_layout_analysis'

export const REQUEST_TYPE_LABELS: Record<RequestType, string> = {
  design_intelligence: 'Design Intelligence',
  ultra_pro_prompt: 'Ultra-Pro Prompt',
  image_generation: 'Image Generation',
  field_suggestion: 'Field Suggestions',
  template_adaptation: 'Template Adaptation',
  resize_template: 'Template Resize',
  feedback_analysis: 'Feedback Analysis',
  design_analysis_agent: 'Design Analysis Agent',
  ui_ux_ultra_agent: 'UI/UX Ultra Agent',
  feedback_learning_analyze: 'Feedback Learning Analysis',
  feedback_learning_understand: 'Feedback Learning Understanding',
  logo_placement: 'Logo Placement',
  typography_suggestion: 'Typography Suggestion',
  speaker_layout_analysis: 'Speaker Layout Analysis',
  multi_format_layout_analysis: 'Multi-Format Layout Analysis',
}
