/**
 * Yi Prompt Builder Service v3.0
 * Main entry point for the Gemini-optimized prompting system
 *
 * v3.0 Features:
 * - Logo awareness context
 * - Brand context integration
 * - Resolution/quality guidance
 * - Few-shot examples for all formats
 *
 * Based on official Gemini API documentation best practices:
 * - Describe scenes, don't list keywords
 * - Use structured XML tags for clarity
 * - Use few-shot examples when possible
 * - Keep text to 25 characters or less per element
 * - Use photographic terms for composition
 */

import type {
  FormData,
  GeminiImageRequest,
  EnhancedBuildOptions,
  YiEngine,
  CertificateFormData,
  EventPosterFormData,
  InstagramFormData,
  StoryFormData,
  YouTubeThumbnailFormData,
  LinkedInFormData,
  FlyerFormData,
  BusinessCardFormData,
  PresentationFormData,
  WebBannerFormData,
  SocialPostFormData,
} from './types'

import { injectVerticalContext } from './vertical-contexts'
import {
  buildCertificatePrompt,
  buildEventPosterPrompt,
  buildInstagramPrompt,
  buildYouTubeThumbnailPrompt,
  buildStoryPrompt,
  buildLinkedInPrompt,
  buildFlyerPrompt,
  buildBusinessCardPrompt,
  buildPresentationPrompt,
  buildWebBannerPrompt,
  buildSocialPostPrompt,
  buildGenericPrompt,
} from './format-builders'

// ============================================================
// SYSTEM INSTRUCTION
// ============================================================

const SYSTEM_INSTRUCTION = `
You are Yi CreativeStudio's ULTRA-PRO image generation engine. You create stunning, award-winning marketing and design assets that rival the best agencies worldwide.

═══════════════════════════════════════════════════════════════════════════════
CREATIVE VISION: RICH, IMMERSIVE DESIGNS
═══════════════════════════════════════════════════════════════════════════════

Your designs should be VISUALLY STUNNING - not plain templates, but rich, atmospheric compositions that immediately communicate what kind of event this is through visual language.

BACKGROUND & ATMOSPHERE (BE CREATIVE HERE!):
- Create DEPTH and DIMENSION: Use multiple layers, gradients, lighting effects, ambient glows
- INTEGRATE visual elements THROUGHOUT the design, not just in corners
- Build ATMOSPHERE: Neural networks can flow across backgrounds, medical symbols can create ambient patterns
- Use MULTIPLE OPACITY LAYERS: Large blurred elements in back, smaller crisp elements in mid-ground
- Let elements CREATE VISUAL FLOW and movement across the entire canvas
- Think Google AI Studio quality - professional, rich, engaging

VISUAL ELEMENTS from <visual_design_elements> section:
- These define the VISUAL LANGUAGE of the design
- INTEGRATE them into backgrounds, patterns, ambient effects
- They should SPAN the canvas, creating context-rich atmosphere
- An AI workshop should FEEL like technology through visual elements
- A health camp should FEEL medical and caring through its visual language

═══════════════════════════════════════════════════════════════════════════════
INSTRUCTION vs CONTENT SEPARATION
═══════════════════════════════════════════════════════════════════════════════

NEVER render as visible text:
- Instruction phrases: "Generate", "Create", "Include", "Apply", "Use", "Render", "Design", "Make"
- XML tags and design terminology
- Technical terms: aspect ratio, resolution, DPI, zone, hierarchy

ONLY render as visible text:
- Content inside <text role="...">content</text> tags
- The quoted values are the EXACT text to render

═══════════════════════════════════════════════════════════════════════════════
AI CONTROL BOUNDARY
═══════════════════════════════════════════════════════════════════════════════

AI HAS FULL CREATIVE CONTROL OVER:
- Backgrounds: Create rich, layered, atmospheric backgrounds with depth and dimension
- Visual Elements: Integrate event-type elements throughout the design (not just corners!)
- Style: Visual mood, color harmony, lighting effects, professional finish
- Composition: Element positioning, visual flow, dynamic arrangements
- Typography Styling: Font sizes, weights, effects, colors (NOT font family if specified)
- Decorative Patterns: Abstract patterns, gradients, glows, textures that reinforce the event type

AI MUST NOT GENERATE (strict boundaries):
- Human faces or figures (speaker photos are overlaid via post-processing)
- Exact text content (use ONLY values from <text role="..."> tags)
- Logos or branding marks (added via Sharp post-processing)
- Different font families than specified in brand_context

USER PROVIDES (do not recreate):
- Exact text content in text tags
- Speaker/guest photos (composited separately)
- Organization logos (overlaid separately)
- Font family preference (if specified)

When you see a speaker_photo_zone:
- If "USER PHOTO WILL BE OVERLAID": Keep that zone clean for photo overlay
- If "PLACEHOLDER ONLY": Create clean placeholder (subtle frame), NO AI-generated faces

═══════════════════════════════════════════════════════════════════════════════
OUTPUT QUALITY
═══════════════════════════════════════════════════════════════════════════════

Your outputs must be:
- VISUALLY STUNNING: Rich, professional, agency-quality designs
- CONTEXTUALLY RELEVANT: Visual elements match the event type
- Culturally appropriate for Indian audiences
- Text is clear and legible (max 25 characters per element)
- FREE of instruction text rendered as visible content
- FREE of AI-generated human faces
`.trim()

// ============================================================
// TEXT-HEAVY FORMATS (benefit from Yi Craft / Gemini 3 Pro)
// ============================================================

const TEXT_HEAVY_FORMATS = [
  'certificate',
  'business_card',
  'letterhead',
  'presentation_16_9',
  'presentation_4_3',
  'presentation',
  'resume',
  'report_cover',
]

// ============================================================
// FORMAT ID MAPPINGS
// ============================================================

const FORMAT_ALIASES: Record<string, string> = {
  // Certificate variants
  certificate_landscape: 'certificate',
  certificate_portrait: 'certificate',
  certificate_of_achievement: 'certificate',
  certificate_of_appreciation: 'certificate',
  certificate_of_excellence: 'certificate',

  // Event poster variants
  event_poster: 'event_poster',
  poster_portrait: 'event_poster',
  poster_landscape: 'event_poster',
  poster_square: 'event_poster',

  // Instagram variants
  instagram_post: 'instagram_post',
  instagram_square: 'instagram_post',
  instagram_feed: 'instagram_post',

  // Story variants
  instagram_story: 'story',
  whatsapp_status: 'story',
  story_vertical: 'story',

  // YouTube variants
  youtube_thumbnail: 'youtube_thumbnail',
  yt_thumbnail: 'youtube_thumbnail',

  // LinkedIn variants
  linkedin_post: 'linkedin_post',
  linkedin_banner: 'linkedin_post',

  // Flyer variants
  flyer_a4: 'flyer',
  flyer_a5: 'flyer',
  flyer: 'flyer',

  // Business card variants
  business_card: 'business_card',
  visiting_card: 'business_card',

  // Presentation variants
  presentation_16_9: 'presentation',
  presentation_4_3: 'presentation',
  slide: 'presentation',

  // Web banner variants
  web_banner: 'web_banner',
  leaderboard_ad: 'web_banner',
  banner_ad: 'web_banner',

  // Social post variants
  facebook_post: 'social_post',
  twitter_post: 'social_post',
  x_post: 'social_post',
}

// ============================================================
// YI PROMPT BUILDER CLASS
// ============================================================

export class YiPromptBuilder {
  /**
   * Build complete API request payload for Gemini
   */
  static buildRequest(
    formatId: string,
    formData: FormData,
    options: EnhancedBuildOptions = {}
  ): GeminiImageRequest {
    // Build the prompt with all context (logo, brand, quality)
    let prompt = this.buildPrompt(formatId, formData, options)

    // Inject vertical context if applicable
    if (options.verticalId) {
      prompt = injectVerticalContext(prompt, options.verticalId)
    }

    // Determine model based on engine choice
    const engine = options.engine || this.getRecommendedEngine(formatId)
    const model =
      engine === 'yi_craft'
        ? 'gemini-3-pro-image-preview' // Better for text-heavy
        : 'gemini-2.5-flash-image' // Faster, good for general

    return {
      model,
      generationConfig: {
        responseModalities: ['TEXT', 'IMAGE'],
        temperature: 1.0, // Gemini recommended default
      },
      systemInstruction: {
        parts: [{ text: SYSTEM_INSTRUCTION }],
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
    }
  }

  /**
   * Build prompt based on format
   * Main dispatch method for format-specific builders
   * v3.0: Now accepts options to pass logo, brand, and quality context
   */
  static buildPrompt(
    formatId: string,
    formData: FormData,
    options: EnhancedBuildOptions = {}
  ): string {
    // Normalize format ID
    const normalizedFormat = this.normalizeFormatId(formatId)

    switch (normalizedFormat) {
      case 'certificate':
        return buildCertificatePrompt(formData as CertificateFormData, options)

      case 'event_poster':
        return buildEventPosterPrompt(formData as EventPosterFormData, options)

      case 'instagram_post':
        return buildInstagramPrompt(formData as InstagramFormData, options)

      case 'story':
        return buildStoryPrompt(formData as StoryFormData, options)

      case 'youtube_thumbnail':
        return buildYouTubeThumbnailPrompt(formData as YouTubeThumbnailFormData, options)

      case 'linkedin_post':
        return buildLinkedInPrompt(formData as LinkedInFormData, options)

      case 'flyer':
        return buildFlyerPrompt(formData as FlyerFormData, options)

      case 'business_card':
        return buildBusinessCardPrompt(formData as BusinessCardFormData, options)

      case 'presentation':
        return buildPresentationPrompt(formData as PresentationFormData, options)

      case 'web_banner':
        return buildWebBannerPrompt(formData as WebBannerFormData, options)

      case 'social_post':
        return buildSocialPostPrompt(formData as SocialPostFormData, formatId, options)

      default:
        return buildGenericPrompt(formatId, formData as Record<string, unknown>, options)
    }
  }

  /**
   * Get recommended engine for format
   * Text-heavy formats benefit from Yi Craft (Gemini 3 Pro Image)
   */
  static getRecommendedEngine(formatId: string): YiEngine {
    const normalizedFormat = this.normalizeFormatId(formatId)
    return TEXT_HEAVY_FORMATS.includes(normalizedFormat) ? 'yi_craft' : 'yi_vision'
  }

  /**
   * Normalize format ID to canonical form
   */
  static normalizeFormatId(formatId: string): string {
    const lowercaseId = formatId.toLowerCase()
    return FORMAT_ALIASES[lowercaseId] || lowercaseId
  }

  /**
   * Get the system instruction for direct API use
   */
  static getSystemInstruction(): string {
    return SYSTEM_INSTRUCTION
  }

  /**
   * Check if a format ID is supported
   */
  static isSupportedFormat(formatId: string): boolean {
    const normalizedFormat = this.normalizeFormatId(formatId)
    const supportedFormats = [
      'certificate',
      'event_poster',
      'instagram_post',
      'story',
      'youtube_thumbnail',
      'linkedin_post',
      'flyer',
      'business_card',
      'presentation',
      'web_banner',
      'social_post',
    ]
    return supportedFormats.includes(normalizedFormat)
  }

  /**
   * Get all supported format IDs
   */
  static getSupportedFormats(): string[] {
    return Object.keys(FORMAT_ALIASES)
  }
}

// ============================================================
// EXPORTS
// ============================================================

export { SYSTEM_INSTRUCTION }
export type { FormData, GeminiImageRequest, EnhancedBuildOptions, YiEngine }
