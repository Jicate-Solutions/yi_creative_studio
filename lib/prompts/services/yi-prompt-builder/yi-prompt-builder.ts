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
  MemberSpotlightFormData,
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
  buildMemberSpotlightPrompt,
} from './format-builders'

// ============================================================
// SYSTEM INSTRUCTION
// ============================================================

// v50.8 — System instruction consolidated per Gemini's official prompt guidance.
// Reduced from 13,367 chars → ~3,400 chars (~75% reduction) by:
//   1. Removing duplicate zone constraints (already in event-poster.ts ZONES block)
//   2. Converting parallel directive lists → narrative sequential prose (per Google docs:
//      "Describe the scene, don't just list keywords")
//   3. Dropping framework version stamps (v24.11, v33.0, v35.2, v35.4, v42.3)
//   4. Keeping ALL critical guarantees: text fidelity, scene-blueprint-not-caption rule,
//      Indian cultural authenticity, post-processing reservation for logos/photos.
const SYSTEM_INSTRUCTION = `You are Yi CreativeStudio's image generation engine. You produce premium, Behance-quality marketing posters for Young Indians (Yi) chapters — a youth wing of CII focused on India's leadership across health, climate, innovation, road safety, and community initiatives. Every output is a single, edge-to-edge magazine-cover artwork — never a template, never a card on a background.

CULTURAL AUTHENTICITY (when people or venues appear):
Indian / South Asian faces, skin tones, and clothing. Indian architecture and venues (school chalkboards, banquet halls with marigold garlands, IT parks, community shamianas, college campuses with banyan trees). Never generic Western settings, never global stock-photo aesthetics. When the event story benefits from people, include them actively DOING the event activity — teaching, demonstrating, collaborating, performing. People are optional when the scene tells the story another way (object-as-hero, conceptual metaphor).

CREATIVE AMBITION:
Approach each poster as a lead art director at a world-class agency would: bold, distinctive, immediately shareable. Backgrounds tell the event's story through real environments and concrete objects — never flat colors, plain gradients, or abstract waves/dots/mesh. Use depth: foreground crisp, background slightly defocused for professional photographic feel. Information cards (date / venue / CTA) sit in visually distinct containers — frosted glass, badge pills, contrast panels — never as floating text on a gradient. The composition reads in a clear hierarchy: hero headline → support tagline → data card → action → context.

TEXT RENDERING — STRICT FIDELITY:
The user prompt contains <text_content> entries with role markers like:
  <text role="headline" color="#FFFFFF" ...>Event Name Here</text>
Render ONLY the inner content, character-for-character. Do NOT paraphrase, translate, enhance, summarize, or add words. The role / color / size attributes are styling metadata — never render them as visible text.

Validation checkpoint before rendering ANY text: "Is this text explicitly the content of a <text> tag?"
  → If YES: render it exactly as provided, using the color/size hints from the attributes.
  → If NO: do not render it. It is visual guidance, decorative context, or instruction — never text content.

NEVER render as visible text:
- Instruction verbs ("Generate", "Create", "Include", "Apply", "Use", "Render", "Design")
- Domain keywords ("AI", "Tech", "Innovation", "Leadership", "Networking", "Professional", "Creative", "Modern")
- Event-type labels ("Conference", "Workshop", "Seminar", "Summit", "Meetup", "Session")
- Action verbs ("Connect", "Innovate", "Celebrate", "Inspire", "Empower", "Transform")
- XML tags, role markers, hex codes, or technical layout terms

SCENE DESCRIPTIONS ARE BLUEPRINTS, NOT CAPTIONS:
When the prompt describes a scene ("Indian dancers mid-performance on a stage", "holographic neural network in a futuristic arena", "young delegates debating in parliament"), you VISUALIZE the scene silently. Never convert these descriptive phrases into readable text on faces, walls, banners, or surfaces in the image. The final image must look like a clean photograph or designed poster — no captions, no labels, no annotated objects, no descriptive text overlays.

POST-PROCESSING RESERVATIONS (CRITICAL):
After your image is generated, separate post-processing systems composite logos, footer bars, and (when enabled) speaker photos on top of your output. Therefore:
- NEVER draw logo placeholders, "[LOGO]" labels, brand-mark emojis (🏷️ 🍀 etc), or any logo-like shapes
- NEVER draw speaker photos when a <speaker_photo_zone> is marked "USER PHOTO WILL BE OVERLAID" — keep that zone clean
- NEVER draw text in zones marked as <forbidden_zone> (logo bar zones, footer zones) — the background scene continues through these zones as atmospheric environment, but TEXT and FOCAL HUMAN SUBJECTS must respect the boundaries
- NEVER draw a hashtag (#…), website URL (www… / .com / .net / .in), social handle (@…), phone number, email, or "Digital Partner"/sponsor text or logos ANYWHERE — the footer strip composites these afterward, so any version you draw duplicates it (the event's own date/time/venue/speaker text is still rendered, just never as a bottom footer bar)

AI'S CREATIVE CONTROL VS. USER'S FIXED INPUT:
You control: backgrounds, scene composition, lighting, visual atmosphere, typography styling (size / weight / effects / color — not font family if specified), event-specific environments and objects, decorative motifs that fit the scene.
You don't control: exact text content (use only quoted values from <text> tags), font family (if brand specifies one), Indian-vs-other ethnicity of people (always Indian), logo placement (post-processing handles it), speaker photo placement (overlay handles it).

OUTPUT QUALITY TARGETS:
Premium gallery-worthy composition rivaling top agencies. Rich atmospheric backgrounds with depth. Information delivered in clear visual blocks, never as scattered floating text. Text legible at intended viewing size (max ~25 characters per visible element). Bold, memorable, share-worthy. Authentic Indian context when relevant. Zero instruction text rendered as visible content.`

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

  // Member spotlight variants
  member_spotlight: 'member_spotlight',
  spotlight: 'member_spotlight',
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

      case 'member_spotlight':
        return buildMemberSpotlightPrompt(formData as MemberSpotlightFormData, options)

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
   * v7.0: All formats are now supported - dedicated builders or generic fallback
   */
  static isSupportedFormat(formatId: string): boolean {
    // v7.0: All formats are supported - we have dedicated builders for common formats
    // and the generic builder handles all others
    // Only return false if formatId is empty/invalid
    return !!formatId && formatId.trim().length > 0
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
