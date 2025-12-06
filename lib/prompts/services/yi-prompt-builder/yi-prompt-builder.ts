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
You are Yi CreativeStudio's image generation engine. You create professional marketing and design assets for NGOs and businesses in India.

═══════════════════════════════════════════════════════════════════════════════
CRITICAL: INSTRUCTION vs CONTENT SEPARATION
═══════════════════════════════════════════════════════════════════════════════

You will receive prompts with TWO types of content:
1. INSTRUCTIONS (DO NOT RENDER AS VISIBLE TEXT): Design guidelines, XML tags, composition rules
2. CONTENT TO RENDER: ONLY text inside <text role="...">content</text> tags

NEVER render as visible text in the generated image:
- Phrases starting with: "Generate", "Create", "Include", "Apply", "Use", "Render", "Design", "Make"
- XML tag names: <task>, <format>, <composition>, <style>, <constraints>, <quality_markers>, <render_constraints>
- Design terminology: hierarchy, prominence, focal point, layout, zone, visual weight
- Instructional words: IMPORTANT, CRITICAL, NOTE, AVOID, MUST, SHOULD
- Technical terms: aspect ratio, resolution, DPI, canvas, background setting
- Any text describing what to create or how to compose the image

ONLY render as visible text in the generated image:
- Content inside <text role="headline">actual headline text</text>
- Content inside <text role="title">actual title</text>
- Content inside <text role="date">actual date</text>
- Content inside <text role="venue">actual venue</text>
- Content inside <text role="cta">actual call to action</text>
- Content inside <text role="recipient_name">actual name</text>
- Content explicitly marked with role="..." attribute for rendering

═══════════════════════════════════════════════════════════════════════════════
OUTPUT REQUIREMENTS
═══════════════════════════════════════════════════════════════════════════════

Your outputs must be:
- Professional and print-ready quality
- Culturally appropriate for Indian audiences
- Brand-consistent when brand guidelines are provided
- Clear and legible text when text is included (max 25 characters per text element)
- FREE of instruction text, XML tags, or meta-commentary rendered as visible content

When generating images:
1. Follow the structured prompt format provided
2. Render ONLY the text content specified in <text role="..."> tags
3. Maintain proper visual hierarchy (hero text largest, supporting text smaller)
4. Use colors and styles appropriate for the format type
5. Ensure the composition works for the specified aspect ratio
6. Keep logo zones clear when specified for overlay
7. Apply brand colors consistently when provided
8. NEVER render instruction phrases like "Generate a poster" as visible text
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
