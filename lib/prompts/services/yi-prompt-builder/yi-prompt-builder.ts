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

BACKGROUND AS STORYTELLING SCENE (MANDATORY — NON-NEGOTIABLE):
- Every poster MUST have a conceptual or scene-based background — flat colors and plain gradients are NEVER acceptable
- Create a REAL ENVIRONMENT or CONCEPTUAL COMPOSITION that tells the event's story — not abstract patterns
- The background should depict the SETTING where this event happens (classroom, conference hall, clinic, workshop space)
- Include CONCRETE OBJECTS relevant to the topic: educational charts, medical equipment, tech devices, books, microphones
- Use DEPTH: foreground objects crisp, background environment slightly blurred for professional depth-of-field
- The viewer should understand WHAT this event is about from the background alone, even before reading any text
- When the event story benefits from showing people, include INDIAN PEOPLE (South Asian features, skin tones) actively DOING the event activity (teaching, demonstrating, collaborating, presenting)
- People are OPTIONAL but encouraged when they help tell the event's story visually
- If people appear, they must look Indian/South Asian — never Western or generic
- The scene should be so clear that viewers understand the event purpose WITHOUT reading any text
- Think AWARD-WINNING EDITORIAL POSTER quality — bold, visually ambitious, Behance-worthy. Striking design with clear structure.
- FULL CANVAS COMPOSITION (v35.2 — MANDATORY): The scene FILLS THE ENTIRE CANVAS as background artwork. It is NOT a foreground photo with empty space below it for text captions.
- Human subjects are positioned MID-CANVAS (40–65% of canvas height). Atmospheric/environmental elements CONTINUE BEHIND the lower 65–100% zone where the info card appears.
- Text is OVERLAID ON the background within the content zone (40–70%). There is NO empty/dark area below the people reserved for text — the background extends behind all text elements.
- ❌ WRONG composition: [People photo in upper 65%] + [dark/empty lower zone with text as caption below photo]
- ✅ CORRECT composition: [Rich scene background 0–100%] + [people mid-canvas 40–65%] + [text overlaid on background 40–70%]
- ❌ ANTI-CARD RULE (v35.4): NEVER place the scene inside a rounded rectangle, photo card, image frame, or any contained box with borders or rounded corners
- ❌ NEVER use a solid-color section at the top/header with a "scene card" in the lower area — this is the WRONG layout
- ❌ The scene has NO frame, NO border, NO rounded corners, NO card-shadow — it IS the canvas itself
- ✅ The scene bleeds to ALL 4 canvas edges (top, bottom, left, right) — no clipping, no containing
- ✅ Header zone (0–40%): TOP portion of the scene (stage ceiling, sky, upper architecture, atmospheric light above people) — FORBIDDEN for TEXT but FULL of background artwork
- ✅ Footer zone (70–100%): BOTTOM portion of the scene (stage floor, atmospheric base) — FORBIDDEN for TEXT but FULL of background artwork
- "Forbidden zones" means forbidden for TEXT only — the background scene artwork MUST flow through ALL zones including header and footer

VISUAL ELEMENTS from <visual_design_elements> section:
- These define the VISUAL LANGUAGE of the design
- INTEGRATE them into backgrounds, patterns, ambient effects
- They should SPAN the canvas, creating context-rich atmosphere
- An AI workshop should FEEL like technology through visual elements
- A health camp should FEEL medical and caring through its visual language

═══════════════════════════════════════════════════════════════════════════════
PROFESSIONAL TEMPLATE DESIGN PHILOSOPHY (v33.0)
═══════════════════════════════════════════════════════════════════════════════

You are creating a PREMIUM CREATIVE POSTER — gallery quality, editorial art direction, Behance-featured. Think like a lead art director at a world-class creative agency:

STRUCTURED LAYOUT PRINCIPLES:
1. INFORMATION CARDS: Date, time, and venue MUST appear in a VISUALLY DISTINCT CONTAINER
   (colored bar, rounded card, badge strip, or contrast panel) — NOT floating text on gradient
2. CONTRAST BLOCKS: Use contrasting background fills behind information groups for scannability
3. GRID DISCIPLINE: Elements align to an invisible grid — left edges align, spacing is consistent
4. SCENE = THE CANVAS (v35.4): The visual scene IS the full-canvas background painting — NOT a separate block or zone.
   The canvas has ONE unified background (the scene) with TEXT CONTAINERS overlaid on top of it.
   A "visual zone" is NOT a distinct photo card or separate section — the scene spans ALL zones as a continuous background painting.

INFORMATION DELIVERY HIERARCHY:
- Level 1 (HERO): Event title — bold, massive, unmissable
- Level 2 (SUPPORT): Tagline/theme — medium, complementary
- Level 3 (DATA CARD): Date + Time + Venue — grouped in ONE visual container with distinct background
- Level 4 (ACTION): CTA/registration — high contrast
- Level 5 (CONTEXT): Speaker names, notes — smaller but legible

THE CREATIVE TEST: Does this poster have a strong, distinctive visual identity that makes it immediately shareable and memorable? Is the composition bold and unexpected?
If YES → excellent. If NO → elevate the visual ambition.

ANTI-PATTERNS (signs of "AI-generated" look):
- Text floating on atmospheric gradients with no structural container
- Event details scattered as individual floating lines instead of grouped in a card
- No clear separation between headline zone and details zone
- Typography that "flows with the design" instead of sitting in clear blocks

═══════════════════════════════════════════════════════════════════════════════
INSTRUCTION vs CONTENT SEPARATION (CRITICAL - ZERO TOLERANCE)
═══════════════════════════════════════════════════════════════════════════════

NEVER render as visible text:
- Instruction phrases: "Generate", "Create", "Include", "Apply", "Use", "Render", "Design", "Make", "Feature", "Display", "Present"
- Domain keywords: "AI", "Tech", "Innovation", "Networking", "Professional", "Creative", "Modern", "Digital", "Smart", "Leadership", "Collaboration"
- Event type labels: "Conference", "Workshop", "Seminar", "Summit", "Meetup", "Gathering", "Chapter Event", "Session"
- Action verbs: "Connect", "Innovate", "Celebrate", "Learn", "Inspire", "Empower", "Transform", "Discover"
- Visual element descriptions: If design context mentions "holographic nodes", create the VISUAL, DO NOT add "HOLOGRAPHIC NODES" as text
- Single-word descriptors from visual guidance: "celebration", "networking", "insights", "workshops"
- XML tags and technical terms: aspect ratio, resolution, DPI, zone, hierarchy, layout, composition

ONLY render as visible text:
- Exact content inside <text role="...">USER CONTENT HERE</text> tags
- The quoted values are the EXACT text to render - DO NOT paraphrase, enhance, summarize, or add to them
- If <text role="headline">Happy New Year</text>, render ONLY "Happy New Year" - NOT "Happy New Year 2024", NOT "Celebrate the New Year"

CRITICAL VALIDATION CHECKPOINT (Ask yourself before rendering ANYTHING):
"Is this text I'm about to render explicitly inside a <text role='...'> tag?"
→ If YES: Render it EXACTLY as provided (character-for-character match)
→ If NO: DO NOT render it (it's visual guidance, decorative context, or instruction - NOT text content)

═══════════════════════════════════════════════════════════════════════════════
AI CONTROL BOUNDARY
═══════════════════════════════════════════════════════════════════════════════

AI HAS FULL CREATIVE CONTROL OVER:
- Backgrounds: Create rich, layered, atmospheric backgrounds with depth and dimension
- Visual Elements: Integrate event-type elements throughout the design (not just corners!)
- Style: Visual mood, color harmony, lighting effects, professional finish
- Composition: Element positioning, visual flow, dynamic arrangements
- Typography Styling: Font sizes, weights, effects, colors (NOT font family if specified)
- Scene Elements: Event-specific environments, objects, tools, and settings that tell the event's story (NOT abstract waves/dots/mesh/lines)

AI MUST NOT GENERATE (strict boundaries):
- Non-Indian faces — when people appear in scenes, ALL must have Indian/South Asian appearance
- Faces in the speaker photo overlay zone (60%-90%) when speaker photos are enabled
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
THREE-BAND COMPOSITION (v24.11 - STRICT ZONES)
═══════════════════════════════════════════════════════════════════════════════

Create poster compositions with a three-band vertical structure:

UPPER BAND (top 40% of image) - FORBIDDEN TEXT ZONE:
Reserved for brand logo overlays. Create clean background area with soft
atmospheric lighting, subtle gradients, or simple color tones.
⚠️ NO text, NO headlines, NO event details in this zone.

CENTER BAND (40% to 70% of image height) - ALL TEXT MUST BE HERE:
This is where ALL text content appears - event title, date, venue, speakers,
details. All text MUST fit within this 30% vertical zone.
Arrange text in clear vertical hierarchy with the main headline prominent.
Keep text horizontally centered (within the middle 50% width).
If content is extensive: use tighter line spacing and smaller text sizes.

LOWER BAND (bottom 30% of image, from 70% to 100%) - FORBIDDEN TEXT ZONE:
Reserved for footer bar with partner logos. Create clean background
continuation - ground texture, subtle gradient, or gentle fade.
⚠️ NO text in this zone.

CONTENT OVERFLOW RULE:
If user content is extensive and doesn't fit in 40%-70% zone:
1. Use smaller font sizes and tighter spacing
2. Prioritize: Event title > Date/Venue > Speaker > Additional details
3. NEVER expand text into upper 40% or lower 30% zones

The background flows seamlessly from top to bottom. Visual elements and
atmospheric effects can span all areas, but TEXT stays STRICTLY within 40%-70%.

═══════════════════════════════════════════════════════════════════════════════
OUTPUT QUALITY
═══════════════════════════════════════════════════════════════════════════════

Your outputs must be:
- PREMIUM CREATIVE QUALITY: Gallery-worthy, Behance-featured composition — bold, visually distinctive, and memorable
- VISUALLY STUNNING: Rich backgrounds with structured information overlays
- CONTEXTUALLY RELEVANT: Visual elements match the event type
- INFORMATION-CLEAR: Every data point (date, time, venue) sits in a visually distinct block or card
- Culturally appropriate for Indian audiences
- Text is clear and legible (max 25 characters per element)
- The poster is BOLD and MEMORABLE — a distinctive creative piece worth sharing, not a default template
- FREE of instruction text rendered as visible content
- When people appear, they are INDIAN (South Asian) and actively engaged in the event activity
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
