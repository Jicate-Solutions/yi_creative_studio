/**
 * Event Poster Prompt Builder v3.1
 * Generates XML-structured prompts for event poster designs
 * Enhanced with:
 * - Logo awareness, brand context, and quality context
 * - Speaker photo integration zones
 * - Typography hierarchy with visual weight
 * - Instruction/content separation for cleaner AI generation
 */

import type { EventPosterFormData, EnhancedBuildOptions } from '../types'
import {
  buildLogoContext,
  buildBrandContext,
  buildQualityContext,
  buildThemeContext,
  buildOrganizationContext,
  buildLayoutZoneContext,
  buildLanguageContext,
  buildSpeakerPhotoZoneContext,
  buildSpeakerPhotoCompositionGuidance, // v7.0: Natural language safe zones
  buildLogoStripZoneContext,
  buildInitiativeColorContext,
  formatSpeakerDetails,
  formatMultipleSpeakers,
} from '../context-helpers'
import { buildAllV41Contexts } from '../context-helpers-v41'
import { EVENT_POSTER_EXAMPLES } from '../examples'

// NEW v6.12: Text color resolver for WCAG compliance
import { validateTextContrast, getContrastSafeTextColor } from '@/lib/utils/text-color-resolver'

// Import design architecture for ultra-pro quality
import {
  getTypographyPromptFragment,
} from '../../../knowledge-base/design-architecture'

// Import decorative elements helper (v3.2)
import {
  buildDecorativeElementsSection,
  buildBackgroundSettingSection,
} from '../helpers/decorative-elements-injector'

// Import time formatter utility (v3.3)
import { formatEventTime } from '@/lib/utils/time-formatter'

// Import logo zone enforcement helper (v3.4, v4.0)
import { buildForbiddenZonesSection, buildZoneReminderSection, buildPixelPreciseSpatialConstraints } from '../helpers/logo-zone-enforcement'

// Import centralized sophistication helper (v4.5)
import { getSophistication, getIntegratedZoneContext } from '../helpers/sophistication-helper'

// Import multi-color typography types (v5.0)
import type { TextRoleColor, MultiColorTypographyConfig, SpeakerRole } from '@/lib/config/design-constants'
import { SPEAKER_ROLE_LABELS } from '@/lib/config/design-constants'
import { getGeminiStyleLock } from '@/lib/config/background-styles'

// Import dynamic color description builder (v5.4)
import { buildColorDescriptionFromResolved } from '../../../helpers/color-narrative'

// Import color personality system for dynamic background generation (v6.0)
import {
  analyzeColorPersonality,
  generateColorAwareBackground,
  type ColorPersonality,
} from '@/lib/prompts/helpers/color-personality'
import type { ResolvedColors } from '@/lib/utils/resolve-color-config'
import type { DesignContextForPrompt } from '../types'

// v25.1: Import content density analyzer for sparse content background enrichment
import {
  analyzeContentDensity,
  buildContentDensityGuidance,
  getAdjustedElementCount,
  type ContentDensityAnalysis,
} from '@/lib/prompts/helpers/content-density-analyzer'

// v26.0: Import storytelling fusion types
import type { StorytellingOutput } from '../../storytelling-fusion'

// ============================================================
// BACKGROUND STYLE SYSTEM (v47.1)
// ============================================================

import type { BackgroundStyleId } from '../types'

const BACKGROUND_STYLE_GUIDANCE: Record<BackgroundStyleId, string> = {
  scene: '',  // Uses Design Intelligence scene description as-is (no override)
  abstract:
    'BACKGROUND STYLE: ABSTRACT & GRADIENT — Generate a pure abstract background using flowing color gradients, soft geometric shapes, and fluid art in the brand palette. NO realistic scenes, people, or environments. Let typography be the hero against a clean expressive backdrop.',
  dark:
    'BACKGROUND STYLE: DARK CINEMATIC (v50.3) — Render the event SCENE with cinematic dark-mood lighting. People, performers, and event details ARE present in the frame as the focal subjects, but rendered in deep cinematic atmosphere: dramatic side-lighting carving faces from shadow, rim-light glowing on shoulders and edges of figures, hard spotlight beams cutting through atmospheric haze, lens flares and bokeh in the brand accent color, intentional darkness pooled around the bright subjects. Think Roger Deakins / Bradford Young / IMAX-poster lighting — composed, sculpted, photographic. Text composites cleanly into the calmer mid-zone shadow. NOT empty bokeh atmosphere — a real scene with people, bathed in dramatic darkness.',
  illustrated:
    'BACKGROUND STYLE: ILLUSTRATED / FLAT — Flat vector-style illustrated elements related to the event theme: simple icons, bold shapes, clean art. Solid fills, minimal shadows, no photorealism. Modern graphic-design aesthetic.',
  bokeh:
    'BACKGROUND STYLE: BOKEH & LIGHT — Soft out-of-focus atmosphere with glowing light orbs, warm sparkle particles, and ambient light halos in the brand palette. Elegant, dreamy, premium. Elements are blurred and atmospheric, not sharp.',
  geometric:
    'BACKGROUND STYLE: GEOMETRIC PATTERN — Bold geometric shapes (hexagons, triangles, diagonal lines, grid, tessellation) in the brand palette. Modern, structural, tech-forward. Patterns may be full-bleed or concentrated in corners/edges.',
  texture:
    'BACKGROUND STYLE: TEXTURED MATERIAL — A physical material surface as the primary backdrop: marble with veining, woven fabric, paper grain, brushed metal, or wood grain — tinted in the brand palette. Tactile, premium, analogue warmth.',
  split:
    'BACKGROUND STYLE: SPLIT LAYOUT — Divide the canvas vertically: left 50% is an event-relevant scene or atmospheric photo; right 50% is a clean solid brand-color panel. Text sits on the solid panel side for maximum readability. A sharp or soft diagonal edge separates the two halves.',
  neon:
    'BACKGROUND STYLE: NEON GLOW — Deep near-black base with vivid electric neon light trails, glowing grid lines, bioluminescent halos, and pulsing light streaks in the brand accent color. Neon signs, glowing circuit lines, or light arcs float in the darkness. High-contrast, electric, futuristic. No realistic scenes or people.',
  duotone:
    'BACKGROUND STYLE: DUOTONE — Map the entire image to exactly TWO colors from the brand palette: shadows become the primary brand color, highlights become the secondary/accent color. The result is a bold, high-contrast monochromatic poster feel. Can include a subtle underlying scene silhouette or abstract shapes, all rendered purely in the two chosen colors.',
  glassmorphism:
    'BACKGROUND STYLE: GLASSMORPHISM — Multiple translucent frosted-glass panels layered over a soft gradient or blurred background. Each panel has subtle white border glow, soft shadow, and 60–80% blur transparency. Background uses soft gradient blobs or bokeh in brand colors. Clean, modern, premium depth. No realistic scenes or people.',
  watercolor:
    'BACKGROUND STYLE: WATERCOLOR — Soft organic paint washes and flowing pigment spreads in the brand palette. Wet-on-wet watercolor bleeds, delicate brush strokes, visible paper grain texture underneath. Colors blend and bleed naturally at the edges. Gentle, artistic, human warmth. No photorealistic elements — purely painterly.',
  mandala:
    'BACKGROUND STYLE: MANDALA & INDIAN MOTIFS — Intricate radial mandala pattern as the central background element, with detailed geometric petal layers, paisley motifs, and traditional Indian floral ornaments in the brand palette. Rich, ornate, symmetrical. Gold or accent color outlines on darker base. Suitable for cultural, festival, and spiritual events.',
  custom: '', // Dynamic — built at call time via buildCustomThemeGuidance()
  // v48.0: New styles ─────────────────────────────────────────────────────
  'photo-real':
    'BACKGROUND STYLE: PHOTO REAL — A 35mm DSLR photograph of the actual event scene. Real Indian people in a real Indian venue, captured with natural shallow depth-of-field — sharp on the subject, softly defocused background. Warm/cool stage lighting, photojournalistic but premium magazine quality. Subtle film grain or cinema-style color grading. NO illustration, NO graphic-design aesthetics, NO abstract patterns. The image should look indistinguishable from a professional event photographer\'s portfolio.',
  product:
    'BACKGROUND STYLE: PRODUCT (OBJECT-AS-HERO) — ONE event-related symbolic object dominates 60%+ of the canvas as the visual hero. People secondary or absent. Object placed on a clean or dramatically-lit backdrop with studio-quality lighting and a sharp key light, with subtle rim/fill light. Examples: graduation → cap mid-air; music event → microphone with sound waves; medical drive → stethoscope; convocation → diploma close-up. The object IS the design — bold, scroll-stopping, editorial-magazine feel. NO crowd scenes, NO venue interiors. Premium catalog/editorial rendering.',
  festive:
    'BACKGROUND STYLE: FESTIVE CELEBRATION (v50.3) — A VIBRANT ILLUSTRATED MULTI-ZONE festival poster. Brand colors are SUGGESTIONS not mandates; the dominant palette is the energetic mix needed for the event (hot pink, electric purple, warm orange, golden yellow, turquoise, magenta). DIVIDE the canvas into 3-5 illustrated activity panels — one per listed event activity (e.g. dance / singing / stage / fun activities). Each panel contains a cartoon-style illustration of THAT activity: dancers mid-motion, microphone with sound waves, spotlight on stage, students celebrating. Connect panels with a CONCEPT-AS-VISUAL-DEVICE running through the composition: a flowing pulse wave, a ribbon, a string of festoons, a winding path, or musical staff lines that weave between zones. INDIAN CULTURAL MOTIFS: decorative borders in mandala / paisley / kolam style framing edges and corners. Confetti, fireworks, sparkles in the upper area. STYLE: flat illustrated / sticker-art / festival-graphic — NOT photorealistic, NOT cinematic-dark. Cartoon happy figures in motion. Mixed text hierarchy: hero event name in gradient or rainbow type, subtitle in second color, activity labels per panel, date/venue card. Think Diwali / Holi / college cultural-fest flyer energy.',
  // These fall back to the verbatim geminiStyleLock at runtime (see styleBackground()); the
  // entries below exist to satisfy the exhaustive Record<BackgroundStyleId, string> type.
  'pop-modern':
    'BACKGROUND STYLE: POP-MODERN — Modern Indian pop-art: bold halftone screen-print textures, vintage Tamil-cinema poster energy, saturated colour blocks, graphic outlines (Hatecopy / Hassan Hajjaj vibe). Loud, contemporary, brand-confident.',
  'photo-pop':
    'BACKGROUND STYLE: PHOTO-POP — Real photograph of the subject fused with pop-art design language: halftone background, bold pop typography, graphic overlays around a photoreal subject. Vogue India cover / Spotify Wrapped energy.',
  'hand-drawn':
    'BACKGROUND STYLE: HAND-DRAWN — Hand-drawn illustration: inked wobbly contours, visible pencil under-sketch, marker/crayon fills, cross-hatching, paper grain. Warm, imperfect, human. Not photorealistic, not flat-vector-clean.',
  naive:
    'BACKGROUND STYLE: NAIVE / PLAYFUL — Childlike playful illustration: chunky rounded shapes, smiley motifs, uneven hand-filled colour, scratchy outlines, simple grinning characters. Joyful and imperfect.',
  papercut:
    'BACKGROUND STYLE: PAPER-CUT — Layered cut-paper shapes with crisp edges and soft drop-shadows between layers, matte paper texture, no within-shape gradients. Handcrafted papercraft depth, generous negative space.',
  patriotic:
    'BACKGROUND STYLE: PATRIOTIC / TRICOLOR — Clean Indian tricolour vector: saffron/white/green swoosh, Ashoka-chakra navy accent, monument/map silhouettes, crisp white space, flat vector. Proud and dignified.',
  'folk-art':
    'BACKGROUND STYLE: INDIAN FOLK-ART — Traditional folk style (Warli stick-figures, Madhubani dense pattern, or Pattachitra ornament): flat, symbolic, hand-painted, natural-pigment palette. Rooted and authentic.',
  typographic:
    'BACKGROUND STYLE: TYPOGRAPHIC — Typography is the hero: event name set massive, letterforms as graphic shapes filling the frame, mixed weights/sizes, type bleeding off edges, minimal imagery, bold colour blocking.',
  '3d-render':
    'BACKGROUND STYLE: 3D RENDER — Glossy CGI: inflatable/claymation/plastic forms with studio lighting, soft contact shadows, subsurface glow, seamless gradient backdrop. Modern, premium, dimensional.',
  retro:
    'BACKGROUND STYLE: RETRO / VINTAGE — 70s retro poster: sun-faded mustard/orange/avocado/cream palette, rounded retro display type, halftone grain, setting-sun arc, off-register print texture. Warm and nostalgic.',
  'art-deco':
    'BACKGROUND STYLE: ART DECO — 1920s-30s Deco: symmetrical stepped/sunburst geometry, gold linework on deep jewel tones, streamlined glamour, elegant deco display type. Premium and ceremonial.',
  collage:
    'BACKGROUND STYLE: MAXIMALIST COLLAGE — Mixed-media: torn paper, cut-out photo fragments, halftone newsprint, tape, scribbles, stamped type, layered busy-but-balanced. Zine/scrapbook energy.',
  'spotlight-event':
    'BACKGROUND STYLE: SPOTLIGHT EVENT — Bright daylit gradient field with photo-hero people, a bold headline plus a contrasting coloured sub-line band, a rounded date chip, a thin time/venue detail strip, and a flat city-skyline silhouette anchoring the footer. The top strip stays clean for the separately-composited logo row. Structured, modern, optimistic — never dark or cinematic.',
  advertising:
    'BACKGROUND STYLE: ADVERTISING — Premium advertising key art: one hero subject from a bold cinematic angle, ultra-sharp with shallow depth of field, dramatic high-contrast commercial lighting with a brand-accent rim-light, frozen mid-action energy and motion particles, saturated campaign colour grade, and oversized typography in clean negative space. No real celebrities or named athletes.',
  // v56.0 wide expansion — all fall back to the verbatim geminiStyleLock at runtime; these
  // short entries exist to satisfy the exhaustive Record<BackgroundStyleId, string> type.
  minimal:
    'BACKGROUND STYLE: MINIMAL (SWISS) — Extreme negative space, ONE small focal element on a precise grid, a single brand colour plus one neutral, clean grotesque type. No gradients, texture, shadow, or decoration. Confident, premium, quiet.',
  comic:
    'BACKGROUND STYLE: COMIC / MANGA — Sequential comic art: thick black ink outlines, flat saturated cel colours, ben-day halftone shading, speed-lines, a sound-effect word in a starburst, speech bubbles. Kinetic, fun, narrative. Not fine-art pop.',
  aurora:
    'BACKGROUND STYLE: AURORA GRADIENT — A smooth flowing holographic mesh gradient in the brand palette, soft volumetric glow, subtle grain, floating light-wisps, crisp type over the luminous field. Modern, optimistic, premium-tech.',
  isometric:
    'BACKGROUND STYLE: ISOMETRIC — Clean axonometric 3D vector at 30 degrees: flat-shaded blocks (lighter top, darker side), soft long shadows, a tiny detailed world or hero object, limited brand palette. Organised, smart, contemporary.',
  vaporwave:
    'BACKGROUND STYLE: Y2K / VAPORWAVE — Retro-futurist: liquid-chrome 3D type, holographic pink-and-cyan over indigo, a glowing grid to a sunset horizon, CRT scanlines, glitch, 90s clip-motifs. Nostalgic, dreamy, electric.',
  grunge:
    'BACKGROUND STYLE: GRUNGE / ZINE — Distressed punk gig-poster: blown-out photocopier halftone, torn/taped paper, ink splatter, ransom-note cut-and-paste type, near-monochrome plus one spot colour. Rebellious, raw, urgent.',
  street:
    'BACKGROUND STYLE: STREET ART / GRAFFITI — Textured brick/concrete wall tagged with spray-paint wildstyle lettering, a stencil motif, paste-ups and sticker-bombs, overspray haze and drips. Bold saturated street palette. Urban, energetic.',
  risograph:
    'BACKGROUND STYLE: RISOGRAPH — Two or three bright spot inks only (no full CMYK), deliberate layer misregistration, overprint where inks overlap, coarse riso grain, matte paper. Warm, crafty, indie, tactile.',
  luxury:
    'BACKGROUND STYLE: LUXURY GALA — Deep black or jewel-tone ground with real gold-foil accents catching light, a thin gold hairline frame and small foil monogram, high-contrast serif type, luxurious negative space. Premium, elegant, exclusive.',
  'movie-keyart':
    'BACKGROUND STYLE: MOVIE KEY-ART — Theatrical film poster: a dramatic hero montage fading into atmospheric darkness, cinematic colour grade, a large stylised title treatment low on the canvas, a small billing-block credit line. Epic, dramatic, cinematic.',
  monoline:
    'BACKGROUND STYLE: MONOLINE LINE-ART — Single even line weight throughout, elegant unbroken contour lines (ideally one continuous stroke), one or two line colours on a calm ground, no fills or shading, generous space. Elegant, light, editorial.',
  'bw-editorial':
    'BACKGROUND STYLE: BLACK & WHITE EDITORIAL — A timeless monochrome photograph: rich full tonal range (deep blacks to luminous highlights), documentary honesty, natural light, fine film grain, NO colour. Timeless, dignified, cinematic.',
  'temple-mural':
    'BACKGROUND STYLE: INDIAN TEMPLE MURAL — Kerala-mural / Tanjore tradition: natural pigment palette (ochre, terracotta, indigo, leaf green) with gold-leaf accents, stylised almond-eyed figures and mudras, lotus/creeper/kolam borders, flat ornamental depth. Sacred, ornate, opulent.',
  gond:
    'BACKGROUND STYLE: GOND TRIBAL ART — Bold flat folk silhouettes of animals/trees/people filled entirely with rhythmic dots, dashes, and lines, vivid saturated colour on a dark or warm ground, confident outlines, no empty interior. Vibrant, rhythmic, ancestral.',
  chalkboard:
    'BACKGROUND STYLE: CHALKBOARD — Dark slate-black or green board with white/pastel chalk strokes, decorative hand-lettering (script plus bold caps), chalk flourishes, banners, arrows, doodle frames, chalk dust and smudges. Warm, friendly, handmade.',
  'double-exposure':
    'BACKGROUND STYLE: DOUBLE EXPOSURE — A bold silhouette (head profile, figure, key shape) filled with a second scene showing through it, soft multiply-blend, crisp edges against clean negative space, restrained near-monochrome palette. Poetic, layered, cinematic.',
  collegiate:
    'BACKGROUND STYLE: COLLEGIATE / ACADEMIC — Heraldic crest or shield with laurels, ribbon, book, or torch; deep navy/maroon with antique gold; classic serif plus collegiate varsity-block type; fine gold rule frame; symmetrical scholarly balance. Prestigious, dignified, traditional.',
  'tech-hud':
    'BACKGROUND STYLE: TECH-FEST HUD — Sci-fi heads-up display on a dark-blue/black ground: glowing circuit traces, hex data grids, holographic rings and reticles, glassy panels, neon line-work in cyan/electric-blue plus brand accent, scanlines and glow. Futuristic, intelligent, digital.',
  varsity:
    'BACKGROUND STYLE: VARSITY ATHLETIC — Bold collegiate sports graphic: varsity-block lettering with felt-patch outlines, athletic brush-script, jersey numerals, team-banner stripes and chevrons, a laurel/shield badge, stadium or halftone-action ground. Bold, energetic, competitive.',
  'campus-doodle':
    'BACKGROUND STYLE: CAMPUS DOODLE — Student-notebook aesthetic: ruled or grid paper ground, ballpoint/marker doodles (stars, arrows, hearts, little characters), sticky notes, washi tape, highlighter swipes, scribbled hand-lettering. Playful, youthful, personal.',
}

function buildCustomThemeGuidance(contentStart: number, contentEnd: number, canvasHeight: number): string {
  const focalEnd = Math.floor(contentStart + (contentEnd - contentStart) * 0.4)
  const focalStartPx = Math.floor(canvasHeight * contentStart / 100)
  const focalEndPx = Math.floor(canvasHeight * focalEnd / 100)
  const textEndPx = Math.floor(canvasHeight * contentEnd / 100)
  // v51.1: Removed labeled blocks ("FOCAL VISUAL:", "TEXT ZONE:") — Gemini was rendering
  // these as decorative section labels on the poster. Now uses prose without leaky labels.
  // v52.0: Reframed "gradient only" bands as continuation of central artwork to stop
  // Gemini inventing two separate mini-scenes in the upper and lower bands.
  return `Compose this as ONE seamless full-canvas gradient artwork — the same gradient, same color story, same atmospheric feel flows continuously from the very top edge to the very bottom edge with no horizontal seams, no band dividers, and no separate scenes stacked vertically. ` +
    `Between ${focalStartPx}px and ${focalEndPx}px from the top, place a single centred iconic symbol or motif (flat or semi-realistic) representing the event theme — examples: wheat sheaf, blood drop, gear, circuit board, book, trophy. Not a realistic scene, not a person, not generic imagery. ` +
    `Between ${focalEndPx}px and ${textEndPx}px from the top (below the symbol), render the event headline, tagline, and date/venue. ` +
    `Above and below the symbol/text the same gradient simply continues — softer, calmer, breathing room. Treat the upper and lower regions as the same artwork extending naturally; never invent a second scene, second symbol, or duplicate motif in those regions.`
}

function buildBackgroundStyleOverride(
  style: BackgroundStyleId | undefined,
  sceneBackground: string,
  _designContext?: DesignContextForPrompt
): string {
  if (!style || style === 'scene') return sceneBackground
  if (style === 'custom') return '' // custom guidance injected separately via buildCustomThemeGuidance()
  // v53.6: When a hand-authored geminiStyleLock exists for this style, return
  // empty here — the lock is injected verbatim at the TOP of the prompt
  // (creativeVisionHeader area). Returning the buried duplicate would give
  // Gemini two competing style descriptions in different vocabularies.
  if (getGeminiStyleLock(style)) return ''
  return BACKGROUND_STYLE_GUIDANCE[style] || sceneBackground
}

// ============================================================
// HEX CODE SANITIZATION (v29.0)
// ============================================================

/**
 * Strip hex color codes from narrative text to prevent Gemini rendering them.
 * Colors are already enforced via <instruction>MANDATORY COLOR PALETTE</instruction>.
 */
function stripHexCodes(text: string): string {
  return text.replace(/#[0-9a-fA-F]{6}\b/g, '').replace(/\s{2,}/g, ' ').trim()
}

// ============================================================
// CREATIVE VISION HEADER (v47.0)
// ============================================================

/**
 * Builds a punchy 5-8 line creative brief that is prepended to the prompt BEFORE
 * any spatial constraints or zone instructions.
 *
 * WHY THIS MATTERS: Gemini processes the prompt from top to bottom. If the very
 * first thing it reads is "SPATIAL LAYOUT CONSTRAINTS", it enters a compliance
 * mindset and produces safe, generic backgrounds. By leading with the creative
 * vision — the feeling, the color story, the iconic element — Gemini approaches
 * the design as an art director would: concept first, production spec second.
 *
 * This is equivalent to a creative director's brief that primes the designer's
 * imagination before any technical constraints are discussed.
 */
function buildCreativeVisionHeader(
  designContext?: DesignContextForPrompt,
  resolvedColors?: ResolvedColors,
  eventName?: string
): string {
  if (!designContext && !resolvedColors) return ''

  const lines: string[] = []

  // 1 — Core mood / concept sentence (from moodDirection, 1 sentence max)
  const mood = designContext?.moodDirection
  if (mood) {
    const firstSentence = mood.split(/[.!]/)[0]?.trim()
    if (firstSentence && firstSentence.length > 10) {
      lines.push(`The visual concept is ${stripHexCodes(firstSentence)}.`)
    }
  }

  // 2 — Color story: primary role + secondary role in plain English
  const colorStory = designContext?.colorStorytelling?.dominantHues
  const primary = resolvedColors?.primaryColor
  const secondary = resolvedColors?.secondaryColor
  if (primary && secondary) {
    const primaryRole = colorStory?.[0]?.role
      ? stripHexCodes(colorStory[0].role).split('—')[0].trim()
      : 'dominant background and gradients'
    const secondaryRole = colorStory?.[1]?.role
      ? stripHexCodes(colorStory[1].role).split('—')[0].trim()
      : 'highlights and accents'
    lines.push(`COLOR STORY: ${primary} = ${primaryRole} | ${secondary} = ${secondaryRole}`)
  } else if (primary) {
    lines.push(`DOMINANT COLOR: ${primary}`)
  }

  // 3 — The single iconic visual anchor (most important concrete element)
  const iconic = designContext?.iconicImagery?.[0]
  if (iconic) {
    const anchor = stripHexCodes(iconic).split(',')[0]?.trim()
    if (anchor && anchor.length > 10) {
      lines.push(`VISUAL ANCHOR: ${anchor}`)
    }
  }

  // 4 — Vibe keywords + energy level
  const vibes = designContext?.vibeAndMood?.vibeKeywords?.slice(0, 3).join(' · ')
  const energy = designContext?.vibeAndMood?.energyDynamics
  if (vibes || energy) {
    const parts = [vibes, energy ? `${energy} energy` : ''].filter(Boolean)
    lines.push(`FEEL: ${parts.join(' | ')}`)
  }

  // 5 — Emotional job (what the viewer should feel)
  const emotionalJob = designContext?.emotionalJob
  if (emotionalJob) {
    lines.push(`VIEWER EMOTION: ${emotionalJob}`)
  }

  if (lines.length === 0) return ''

  // v51.1: Removed ╔══ box decorations — Gemini was rendering them as poster frames.
  const eventLabel = eventName ? ` for ${eventName}` : ''
  return `<instruction>
(DO NOT RENDER — creative brief${eventLabel}, for visual composition only. Absorb this fully before reading the constraints below. Let it drive every composition decision.)
${lines.join('\n')}
</instruction>

`
}

// ============================================================
// MULTI-COLOR TYPOGRAPHY HELPERS (v5.0)
// ============================================================

/**
 * Convert TextRoleColor to Gemini-compatible rendering instruction
 * Supports both solid colors and gradient text
 */
function renderTextColorInstruction(roleColor: TextRoleColor, role: string): string {
  if (roleColor.type === 'gradient') {
    const direction = roleColor.gradientDirection || 'horizontal'
    return `Apply ${direction} gradient from ${roleColor.gradientStart} to ${roleColor.gradientEnd} for ${role} text. ${roleColor.description || ''}`
  }
  return `Use ${roleColor.color} for ${role} text (${roleColor.description || 'primary text color'}, WCAG contrast ratio: ${roleColor.contrastRatio || 'N/A'})`
}

/**
 * Build multi-color typography instructions for all text roles
 * Creates comprehensive color guidance that integrates with visual style
 */
function buildMultiColorTypographyInstructions(config: MultiColorTypographyConfig): string {
  return `
MULTI-COLOR TYPOGRAPHY SYSTEM:
- Hero/Title: ${renderTextColorInstruction(config.hero, 'hero/title')}
- Headlines: ${renderTextColorInstruction(config.headline, 'headline')}
- Subheadlines: ${renderTextColorInstruction(config.subheadline, 'subheadline')}
- Body Text: ${renderTextColorInstruction(config.body, 'body')}
- Call-to-Action: ${renderTextColorInstruction(config.cta, 'CTA')}
- Captions: ${renderTextColorInstruction(config.caption, 'caption')}
- Labels: ${renderTextColorInstruction(config.label, 'label')}

CRITICAL: Ensure all text colors meet WCAG AA accessibility standards (≥4.5:1 for body, ≥3:1 for large text).
`.trim()
}

// ============================================================
// EVENT CONTEXT TYPES
// ============================================================

interface RoleColor {
  color: string
  contrast?: string
  contrastRatio?: number // NEW v3.9: WCAG contrast ratio for AI enforcement
  description: string
}

interface EventContext {
  background: string
  style: string
  colors: string
  mood: string
  energy: string
  headlineFont: string
  colorPalette: {
    hero: RoleColor
    headline: RoleColor
    body: RoleColor
    cta: RoleColor
    caption: RoleColor
  }
  // DEPRECATED: Keep for backward compatibility
  headlineColor: string
  ctaColor: string
  ctaStyle: string
  defaultAudience: string
}

/**
 * Get default color palette for an event type
 */
function getDefaultPalette(primary: string, secondary: string, accent: string): EventContext['colorPalette'] {
  return {
    hero: {
      color: 'white',
      contrast: accent,
      description: `High contrast white on ${primary} - most prominent text`,
    },
    headline: {
      color: 'white',
      contrast: secondary,
      description: 'Clear white for secondary headlines',
    },
    body: {
      color: '#E0E0E0',
      description: 'Readable light gray for details',
    },
    cta: {
      color: accent,
      contrast: primary,
      description: 'High contrast action button',
    },
    caption: {
      color: '#999999',
      description: 'Subtle footer text',
    },
  }
}

/**
 * Determine speaker text colors based on design context
 * Speaker names should stand out but not compete with the main headline
 * Speaker designations should be supporting and more subtle
 */
function determineSpeakerColor(params: {
  primaryColor?: string
  accentColor?: string
  textColor?: string
  role: 'speaker_name' | 'speaker_designation'
}): { color: string; description: string } {
  const { role, primaryColor, accentColor, textColor } = params

  if (role === 'speaker_name') {
    // Speaker names should be prominent but not as dominant as the main headline
    // Use accent color or high-contrast white
    return {
      color: accentColor || 'white',
      description: 'Prominent color for speaker names - stands out but supports headline hierarchy'
    }
  } else {
    // Speaker designations are supporting text
    // Use a more subtle color
    return {
      color: textColor || '#D0D0D0',
      description: 'Subtle supporting color for speaker designations'
    }
  }
}

/**
 * Safely access color values from colorMapping with fallback protection
 * Prevents crashes when AI response is truncated or colorMapping is incomplete
 *
 * v1.0: Added for production stability (fixes truncated hex code crashes)
 */
function getSafeColor(
  colorSource: any,
  role: 'hero' | 'headline' | 'body' | 'cta' | 'caption',
  fallback: string
): { color: string; description: string } {
  // Check if colorSource and role exist
  if (!colorSource?.[role]) {
    console.warn(`[Event Poster] Missing color role '${role}', using fallback: ${fallback}`)
    return {
      color: fallback,
      description: `Fallback color for ${role} (original data missing)`
    }
  }

  const colorObj = colorSource[role]

  // Check if color property exists
  if (!colorObj.color) {
    console.warn(`[Event Poster] Missing color property for '${role}', using fallback: ${fallback}`)
    return {
      color: fallback,
      description: `Fallback color for ${role} (color property missing)`
    }
  }

  // Validate hex code completeness (must be 7 chars: #RRGGBB)
  const color = colorObj.color
  if (color.startsWith('#') && color.length !== 7) {
    console.warn(`[Event Poster] Incomplete hex code for '${role}': ${color} (expected 7 chars, got ${color.length}), using fallback: ${fallback}`)
    return {
      color: fallback,
      description: `Fallback color for ${role} (hex code truncated from ${color})`
    }
  }

  // All validations passed, return the color
  return {
    color: colorObj.color,
    description: colorObj.description || `Color for ${role}`
  }
}

// Default fallback colors (matching design system)
const COLOR_FALLBACKS = {
  hero: '#1E40AF',      // Bold blue - main headline
  headline: '#3B82F6',  // Medium blue - secondary headline
  body: '#E0E0E0',      // Light gray - body text
  cta: '#10B981',       // Green - call-to-action
  caption: '#9CA3AF'    // Subtle gray - captions/footer
} as const

// ============================================================
// COLOR-AWARE DYNAMIC CONTEXT HELPERS (v6.0 - Phase 2)
// ============================================================

/**
 * Builds EventContext from Design Intelligence background setting
 * Injects user colors into the AI-generated background description
 */
function buildContextFromDesignIntelligence(
  designContext: DesignContextForPrompt,
  userColors?: ResolvedColors
): EventContext {
  const backgroundSetting = designContext.backgroundSetting || 'Professional modern design environment'
  const colorMood = designContext.colorMood || 'balanced professional palette'
  const designStrategy = designContext.designStrategy || 'Modern professional design'

  // Inject user colors into background description if provided
  let enhancedBackground = backgroundSetting
  if (userColors && userColors.source !== 'fallback') {
    const personality = analyzeColorPersonality(userColors.primaryColor)
    enhancedBackground = `${backgroundSetting} - Dominated by ${userColors.primaryColor} (${personality.name}) with ${personality.mood} atmosphere. ${personality.backgroundStyle}`
  }

  // Extract or generate color palette
  const primaryColor = userColors?.primaryColor || designContext.colorMood?.match(/#[0-9A-F]{6}/i)?.[0] || '#005B96'
  const secondaryColor = userColors?.secondaryColor || '#FFFFFF'
  const accentColor = userColors?.accentColor || '#FF6B35'

  // v6.0 Phase 3: Use custom theme if generated
  const themeInfo = designContext.customThemeNarrative
    ? `${designContext.customThemeNarrative.themeName} - ${designContext.customThemeNarrative.themeDescription}`
    : designStrategy

  return {
    background: enhancedBackground,
    style: themeInfo,  // Use custom theme name + description if available
    colors: userColors
      ? `Primary: ${userColors.primaryColor}, Secondary: ${userColors.secondaryColor}, Accent: ${userColors.accentColor} (${userColors.source} colors)`
      : colorMood,
    mood: designContext.emotionalJob || designContext.moodDirection || 'Professional, engaging',
    energy: designContext.vibeAndMood?.energyDynamics || 'Balanced, professional',
    headlineFont: designContext.typographyGuidance?.typographyStyle || 'sans-serif',
    colorPalette: getDefaultPalette(primaryColor, secondaryColor, accentColor),
    headlineColor: 'high contrast',
    ctaColor: 'accent',
    ctaStyle: 'prominent button',
    defaultAudience: 'General audience',
  }
}

/**
 * Builds EventContext dynamically using color personality analysis
 * Combines color mood with event type for unique visual narrative
 */
function buildDynamicColorContext(
  eventType: string,
  userColors: ResolvedColors
): EventContext {
  const personality = analyzeColorPersonality(userColors.primaryColor)
  const backgroundDescription = generateColorAwareBackground(eventType, userColors)

  // Map event types to energy levels
  const eventEnergyMap: Record<string, string> = {
    conference: 'Professional, polished',
    workshop: 'Warm, inviting',
    seminar: 'Focused, professional',
    concert: 'High energy, electric',
    sports: 'High energy, athletic',
    celebration: 'Festive, joyful',
    birthday: 'Playful, joyful',
    community: 'Warm, inclusive',
    tech: 'Dynamic, innovative',
    health_camp: 'Calm, reassuring',
    cultural: 'Festive, celebratory',
    children: 'Playful, joyful',
  }

  const eventMoodMap: Record<string, string> = {
    conference: 'Professional, authoritative, networking-focused',
    workshop: 'Educational, interactive, welcoming',
    seminar: 'Intellectual, prestigious, knowledge-focused',
    concert: 'Exciting, energetic, entertainment',
    sports: 'Competitive, energetic, athletic',
    celebration: 'Joyful, celebratory, festive',
    birthday: 'Fun, personal, celebratory',
    community: 'Welcoming, inclusive, community spirit',
    tech: 'Innovative, technical, forward-thinking',
    health_camp: 'Caring, professional, health-focused',
    cultural: 'Celebratory, cultural pride, heritage',
    children: 'Fun, safe, engaging for families',
  }

  const energy = eventEnergyMap[eventType.toLowerCase()] || `${personality.mood}, engaging`
  const mood = eventMoodMap[eventType.toLowerCase()] || `${personality.name}, professional`

  return {
    background: backgroundDescription,
    style: `${personality.name} themed ${eventType} design with ${personality.mood} atmosphere`,
    colors: `Primary: ${userColors.primaryColor}, Secondary: ${userColors.secondaryColor}, Accent: ${userColors.accentColor} (${userColors.source} - ${personality.name})`,
    mood: mood,
    energy: energy,
    headlineFont: personality.name === 'Creative/Luxury' ? 'elegant serif' : 'sans-serif',
    colorPalette: getDefaultPalette(userColors.primaryColor, userColors.secondaryColor, userColors.accentColor),
    headlineColor: 'high contrast',
    ctaColor: 'accent',
    ctaStyle: 'prominent button',
    defaultAudience: 'General audience',
  }
}

// ============================================================
// EVENT CONTEXTS
// ============================================================

/**
 * v6.0 Dynamic Event Context Resolution (Phase 2)
 * Replaces 40+ hardcoded event templates with AI-driven, color-aware generation
 *
 * Priority Chain:
 * 1. Design Intelligence (AI-generated backgrounds with color injection)
 * 2. Color Personality (dynamic backgrounds based on user color selection)
 * 3. Minimal Fallback (clean professional, NO hardcoded event-type visuals)
 *
 * @param eventType - Event type identifier (conference, workshop, etc.)
 * @param userColors - Resolved color configuration from user selection
 * @param designContext - AI-generated design intelligence context
 */
function getEventContext(
  eventType: string = 'general',
  userColors?: ResolvedColors,
  designContext?: DesignContextForPrompt
): EventContext {
  // Priority 1: Use AI Design Intelligence if available
  // This provides the richest, most contextual background descriptions
  if (designContext?.backgroundSetting) {
    console.log(`[Event Context] Using Design Intelligence for ${eventType}`)
    return buildContextFromDesignIntelligence(designContext, userColors)
  }

  // Priority 2: Dynamic color-driven generation
  // Analyzes user color personality and combines with event type
  // Example: Green + Innovation → "Living forest environment with glowing bio-nodes"
  if (userColors && userColors.source !== 'fallback') {
    console.log(`[Event Context] Using Color Personality (${userColors.source}) for ${eventType}`)
    return buildDynamicColorContext(eventType, userColors)
  }

  // Priority 3: Minimal generic fallback (NO hardcoded visuals)
  // Only reached when:
  // - No Design Intelligence available
  // - No user color selection (using system fallback colors)
  // This provides a clean, professional baseline WITHOUT event-specific visual assumptions
  console.log(`[Event Context] Using minimal fallback for ${eventType}`)
  return {
    background: 'Clean professional design environment with balanced composition',
    style: 'Contemporary professional design',
    colors: userColors
      ? `Primary: ${userColors.primaryColor}, Secondary: ${userColors.secondaryColor}, Accent: ${userColors.accentColor}`
      : 'Balanced professional palette',
    mood: 'Professional, engaging, purposeful',
    energy: 'Balanced, professional',
    headlineFont: 'sans-serif',
    colorPalette: getDefaultPalette(
      userColors?.primaryColor || '#005B96',
      userColors?.secondaryColor || '#FFFFFF',
      userColors?.accentColor || '#FF6B35'
    ),
    headlineColor: 'high contrast',
    ctaColor: 'accent',
    ctaStyle: 'prominent button',
    defaultAudience: 'General audience',
  }
}

// ============================================================
// LEGACY NOTE (v6.0)
// ============================================================
// Previous versions (v3.x - v5.x) contained 10 hardcoded event contexts:
// conference, workshop, health_camp, concert, community, tech, sports,
// children, seminar, cultural (lines 271-427, ~173 lines of code)
//
// These hardcoded templates caused issues:
// - Conference always → blue geometric shapes (ignored user's green)
// - Workshop always → orange gradient (ignored user's purple)
// - Zero visual variety within event types
//
// v6.0 Replacement (Phase 2 - Story-Driven Visuals):
// - Removed ALL hardcoded event templates
// - Replaced with dynamic color personality system
// - 300%+ increase in visual variety
// - 100% user color compliance
// - Codebase reduction: ~173 lines deleted
// ============================================================

// ============================================================
// DATE FORMATTING
// ============================================================

function formatEventDate(dateString: string | undefined): string {
  // v24.15: Return empty string for missing/empty dates (don't show placeholder text)
  if (!dateString || dateString.trim() === '') return ''
  try {
    const date = new Date(dateString)
    // Check if date is valid
    if (isNaN(date.getTime())) return ''
    return date.toLocaleDateString('en-IN', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return dateString
  }
}

function buildSpeakerTextSection(
  speakers: Array<{ name: string; designation?: string; role?: SpeakerRole | null }>,
  _colorSource: any
): string {
  if (!speakers || speakers.length === 0) return ''
  return speakers
    .map(s => {
      const roleLabel = s.role ? SPEAKER_ROLE_LABELS[s.role] : undefined
      const nameLine = s.designation ? `${s.name} — ${s.designation}` : s.name
      // Role label renders in small caps directly above the name line.
      return roleLabel ? `${roleLabel}\n${nameLine}` : nameLine
    })
    .join('\n')
}

function buildStorytellingNarrativeSection(storytelling: StorytellingOutput): string {
  return `<visual_storytelling confidence="${(storytelling.narrativeConfidence * 100).toFixed(0)}%">
NARRATIVE: ${storytelling.visualNarrative}
ARC: opening — ${storytelling.storyArc.opening}; climax — ${storytelling.storyArc.climax}; resolution — ${storytelling.storyArc.resolution}.
ELEMENTS:
${storytelling.elementCohesion.map(ec => `• ${ec.element} (${ec.storyRole}): ${ec.visualConnection}`).join('\n')}
ONE unified visual story; hero visual is dominant; supporting elements enhance without competing.
</visual_storytelling>`
}

// ============================================================
// MAIN BUILDER
// ============================================================

export function buildEventPosterPrompt(
  data: EventPosterFormData,
  options: EnhancedBuildOptions = {}
): string {
  // v3.5: Normalize field names - form may use eventTitle but type expects eventName
  // Also handle speakerName from various possible field names
  const rawData = data as unknown as Record<string, unknown>
  const eventName = data.eventName || (rawData.eventTitle as string) || (rawData.title as string) || 'Event'

  // NEW v5.0: Multi-speaker extraction (supports both single and array formats)
  const speakers: Array<{ name: string; designation?: string; role?: SpeakerRole | null }> = []

  if (Array.isArray((rawData as any).speakers)) {
    // Multi-speaker format
    speakers.push(...(rawData as any).speakers.filter((s: any) => s.name))
  } else if (data.speakerName || (rawData.speaker as string) || (rawData.guestName as string)) {
    // Backward compatibility: single speaker
    speakers.push({
      name: data.speakerName || (rawData.speaker as string) || (rawData.guestName as string) || '',
      designation: data.speakerDesignation || (rawData.designation as string) || (rawData.guestDesignation as string)
    })
  }

  // v3.6: Normalize tagline and additionalDetails field names
  const rawEventDescription = data.eventDescription || (rawData.eventTagline as string) || (rawData.tagline as string) || ''
  const eventDescription = rawEventDescription
  const eventNote = data.eventNote || (rawData.additionalDetails as string) || (rawData.additionalInfo as string) || ''
  const organizerCaption = (rawData.eventCaption as string | undefined)?.trim() || null

  // v6.0: Extract custom fields from compiled data (Fix for custom fields not rendering)
  const customFieldsText: string[] = []
  const customFields = (data as any).customFields
  if (customFields && Object.keys(customFields).length > 0) {
    for (const [fieldName, fieldValue] of Object.entries(customFields)) {
      if (typeof fieldValue === 'string' && fieldValue.trim()) {
        // Store just the value (no field name to prevent label rendering in Gemini)
        customFieldsText.push(`"${fieldValue.trim()}"`)
      }
    }
  }

  // v46.0: Format date/time for Gemini text rendering (was previously done in route.ts for Sharp)
  const _rawDate = data.eventDate || (rawData.eventDate as string) || ''
  const _rawTime = data.eventTime || (rawData.eventTime as string) || ''
  const _rawEndTime = data.eventEndTime || (rawData.eventEndTime as string) || ''
  const _fmtTime = (t: string) => {
    const [h, m] = t.split(':').map(Number)
    return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
  }
  let formattedDateTime = ''
  if (_rawDate) {
    try {
      const d = new Date(_rawDate + 'T00:00:00')
      formattedDateTime = d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
    } catch { formattedDateTime = _rawDate }
    if (_rawTime) {
      formattedDateTime += ` | ${_rawEndTime ? `${_fmtTime(_rawTime)} – ${_fmtTime(_rawEndTime)}` : _fmtTime(_rawTime)}`
    }
  }
  const venueStr = data.venue || (rawData.venue as string) || ''

  // v44.0: Yi chapter events (membership vertical) use clean minimal backgrounds
  // Reference: Yi Kanniyakumari Instagram (@yi.kanniyakumari) — corporate, typographic, no photographic scenes
  const isYiChapterEvent = options.verticalId === 'membership'
  // v45.0: Yi Spotlight events use creative vibrant backgrounds (Instagram-style)
  // Reference: @yi.kanniyakumari — gradient + creative overlay + large focal subject + bold typography
  const isYiSpotlight = options.verticalId === 'yi_spotlight'

  // v6.0: Pass resolvedColors and designContext for dynamic color-aware generation
  const eventContext = getEventContext(data.eventType, options.resolvedColors, options.designContext)

  // Build core context sections
  const logoContext = buildLogoContext(options.logoAwareness)
  const brandContext = buildBrandContext(options.brandContext, 'event_poster', options.designContext)  // v4.2: Pass design context for story-driven typography
  const qualityContext = buildQualityContext(options.resolution, 'event_poster')

  // NEW v3.1: Build additional context sections
  const themeContext = buildThemeContext(options.theme, options.style)
  const orgContext = buildOrganizationContext(options.organizationContext)
  const layoutContext = buildLayoutZoneContext(options.layout)
  const langContext = buildLanguageContext(options.language)

  // NEW v7.0: Build logo strip zone context for 4-Row Enhanced Strip
  // This tells Gemini to reserve space for logo strips (header and footer)
  const logoStripZoneContext = buildLogoStripZoneContext(options.logoStripZoneCoordinates)
  if (logoStripZoneContext) {
    console.log('[Event Poster] v7.0: Logo strip zone context added for 4-Row Enhanced Strip')
  }

  // NEW v13.0: Build initiative text color contrast context for Row 3
  // v15.1: Now uses PROSE format (not XML) so Gemini actually respects it
  const initiativeColorContext = buildInitiativeColorContext(options.logoStripZoneCoordinates)
  if (initiativeColorContext) {
    console.log('[Event Poster] v15.1: Initiative color constraint added in PROSE format (not XML)')
    console.log('[Event Poster] Initiative text color:', options.logoStripZoneCoordinates?.initiativeColorInfo?.color)
    console.log('[Event Poster] Required bg tone:', options.logoStripZoneCoordinates?.initiativeColorInfo?.recommendedBgTone)
    console.log('[Event Poster] Positioned BEFORE visual scene to prevent override')
  }

  // v12.4: Extract footer zone info for layout composition section reinforcement
  const hasFooterContent = options.logoStripZoneCoordinates?.activeRows?.footer || false
  const footerReservePercent = options.logoStripZoneCoordinates?.footerReservePercent || 0
  const headerReservePercent = options.logoStripZoneCoordinates?.headerReservePercent || 18
  const headerHeight = options.logoStripZoneCoordinates?.headerHeight || 260
  const footerBarHeight = options.logoStripZoneCoordinates?.footerHeight ?? 0  // v41.4: actual footer bar px

  // v25.1: Analyze content density to determine if background needs enrichment
  const contentDensityAnalysis = analyzeContentDensity({
    eventName,
    eventDescription,
    eventNote,
    venue: data.venue,
    speakers,
    registrationInfo: data.registrationInfo,
    additionalDetails: customFieldsText.join(' '),
  })

  console.log('[Event Poster v25.1] Content Density Analysis:', contentDensityAnalysis.analysis)

  // v25.1: Build content density guidance if background enrichment is needed
  const contentDensityGuidance = buildContentDensityGuidance(contentDensityAnalysis)

  // v24.29: Early detection of speaker photo mode for content zone calculation
  // Must be calculated BEFORE content zones so we can shrink to 40%-60% when speakers enabled
  const hasSpeakerPhotoEarly = options.speakerPhotoConfig?.enabled === true

  // v24.10: PIXEL-BASED UNIFIED ZONE POSITIONING — declared early (v41.4 moved up)
  // Gemini cannot parse XML percentages - use exact pixel coordinates
  const CANVAS_HEIGHT = 1440; // Event poster height
  const CANVAS_WIDTH = 1080;

  // v41.4: ACTUAL-BAR ZONE STRATEGY — content zone derived from real Sharp logo bar heights.
  // Scaffold shows EXACT bar heights → CONTENT_START/END must match or Gemini gets contradictory signals.
  // headerHeight (from logoStripZoneCoordinates) = actual rendered header height in Sharp (e.g. ~350px on 1440h)
  // footerBarHeight = actual rendered footer height in Sharp (e.g. ~259px on 1440h)
  // Buffer above/below bars so text never touches bar edges.
  // v49.2: Footer buffer raised to 3% of canvas (~43px) — 10px was only 0.7%, bullets were clipping into footer strip.
  const FOOTER_BUFFER_PX = Math.round(CANVAS_HEIGHT * 0.05) // 72px @ 1440h — v49.3: raised from 3% (43px), text still clipped at 3%
  const CONTENT_START = Math.max(
    Math.ceil(((headerHeight + 10) / CANVAS_HEIGHT) * 100),
    40  // v47.1: 40% hard floor — logo bars + float cards occupy ~40% of canvas top
  )
  const _baseContentEnd = footerBarHeight > 0
    ? Math.floor(((CANVAS_HEIGHT - footerBarHeight - FOOTER_BUFFER_PX) / CANVAS_HEIGHT) * 100)
    : (hasSpeakerPhotoEarly ? 65 : 70)   // fallback if no footer bar info
  // v52.0: When a speaker photo will be composited, clamp CONTENT_END to the photo's top edge
  // minus a small buffer so text never sits BEHIND the photo. Sharp places the photo bbox in
  // ~57-83% Y for the default 'bottom' position with a 380px photo on a 1440h canvas; reading
  // the explicit topEdge from speakerPhotoZoneCoordinates when available keeps the prompt and
  // the post-composite step on the same page.
  const _speakerPhotoTopPercent = hasSpeakerPhotoEarly && options.speakerPhotoZoneCoordinates?.topEdge
    ? Math.floor((options.speakerPhotoZoneCoordinates.topEdge / CANVAS_HEIGHT) * 100)
    : (hasSpeakerPhotoEarly ? 57 : 100)  // single-speaker 'bottom' default → ~57% top edge
  const CONTENT_END = hasSpeakerPhotoEarly
    ? Math.min(_baseContentEnd, Math.max(CONTENT_START + 8, _speakerPhotoTopPercent - 2))
    : _baseContentEnd
  const CENTER_ZONE_HEIGHT = CONTENT_END - CONTENT_START  // 25% available for text (or 20% with speaker photo)

  // Override calculated header start with center zone start
  const headerStartPercent = CONTENT_START

  console.log('[Event Poster v24.50] DYNAMIC ZONE STRATEGY:', {
    contentStart: `${CONTENT_START}%`,
    contentEnd: `${CONTENT_END}%`,
    centerZoneHeight: `${CENTER_ZONE_HEIGHT}%`,
    headerZone: `0% - ${CONTENT_START}% (FORBIDDEN)`,
    speakerPhotoZone: hasSpeakerPhotoEarly ? '60% - 90% (RESERVED for photo overlays)' : 'N/A',
    footerZone: `${CONTENT_END}% - 100% (FORBIDDEN)`,
    hasSpeakerPhoto: hasSpeakerPhotoEarly,
    reasoning: hasSpeakerPhotoEarly
      ? `v28.0: Content shrunk to ${CONTENT_START}%-60% to reserve 60%-90% for speaker photo overlays`
      : `v28.0: Dynamic ${CONTENT_START}%-${CONTENT_END}% content zone (no speaker photos)`
  })

  // v24.50: Simplified text zones - all within content zone
  // When speaker photos: 40%-60% (20% total) - tighter spacing
  // When no photos: 40%-70% (30% total) - standard spacing
  const speakerZoneHeight = speakers.length > 0 && !hasSpeakerPhotoEarly ?
    (speakers.length > 2 ? 8 : 6) : 0 // No speaker text zone when photo overlay mode

  // v39.0 zones restored — zones are anchor POSITIONS for Gemini, not size constraints.
  // Visual quality comes from effects/style attributes in <text_content>, not zone height.
  // v46.2: +3% soft pad on headline start so tall uppercase letters don't bleed into logo bar.
  const _headlinePad = 8  // v47.0: increased from 3→8 so tall uppercase headlines clear the logo bar
  const textZones = {
    header: { start: 0, end: CONTENT_START },
    headline: { start: CONTENT_START + _headlinePad, end: CONTENT_START + _headlinePad + 6 },
    tagline: { start: CONTENT_START + _headlinePad + 7, end: CONTENT_START + _headlinePad + 10 },
    dateVenue: { start: CONTENT_START + _headlinePad + 11, end: CONTENT_START + _headlinePad + 16 },
    additionalDetails: hasSpeakerPhotoEarly
      ? { start: CONTENT_START + _headlinePad + 17, end: CONTENT_END - 2 }
      : { start: CONTENT_START + _headlinePad + 17, end: CONTENT_START + _headlinePad + 22 },
    speakers: hasSpeakerPhotoEarly
      ? { start: 0, end: 0 }
      : { start: CONTENT_START + _headlinePad + 23, end: CONTENT_START + _headlinePad + 24 },
    buffer: { start: CONTENT_END, end: CONTENT_END },
    footer: { start: CONTENT_END, end: 100 }
  }

  console.log('[Event Poster v24.50] Dynamic Text Distribution:', {
    contentZone: `${CONTENT_START}% - ${CONTENT_END}%`,
    headline: `${textZones.headline.start}% - ${textZones.headline.end}%`,
    tagline: `${textZones.tagline.start}% - ${textZones.tagline.end}%`,
    dateVenue: `${textZones.dateVenue.start}% - ${textZones.dateVenue.end}%`,
    additionalDetails: `${textZones.additionalDetails.start}% - ${textZones.additionalDetails.end}%`,
    speakers: hasSpeakerPhotoEarly ? 'SKIPPED (photo overlay mode)' : `${textZones.speakers.start}% - ${textZones.speakers.end}%`,
    footerZone: `${CONTENT_END}% - 100% (FORBIDDEN)`
  })

  // v40.1: Pixel zones aligned with CENTER_ZONE_HEIGHT-based vertical layout
  // Headline gets 35% of content zone, date/venue 20%, details 15%, registration 15%
  const _headlineHeightPx = Math.floor(CANVAS_HEIGHT * CENTER_ZONE_HEIGHT * 0.35 / 100)
  const _taglineHeightPx  = Math.floor(CANVAS_HEIGHT * CENTER_ZONE_HEIGHT * 0.15 / 100)
  const pixelZones = {
    // Header zone (0-40%) - FORBIDDEN
    headerEnd: Math.floor(CANVAS_HEIGHT * (CONTENT_START / 100)),              // 576px (40%)
    // Content zone boundaries (40-70%)
    contentStart: Math.floor(CANVAS_HEIGHT * (CONTENT_START / 100)),           // 576px (40%)
    headlineStart: Math.floor(CANVAS_HEIGHT * (CONTENT_START / 100)),          // 576px (40%)
    headlineEnd:   Math.floor(CANVAS_HEIGHT * (CONTENT_START / 100)) + _headlineHeightPx, // 727px (~50.5%)
    dateVenueStart: Math.floor(CANVAS_HEIGHT * (CONTENT_START / 100)) + _headlineHeightPx + _taglineHeightPx, // 792px (~55%)
    dateVenueEnd:   Math.floor(CANVAS_HEIGHT * (CONTENT_START + CENTER_ZONE_HEIGHT * 0.70) / 100), // 878px (~61%)
    contentEnd: Math.floor(CANVAS_HEIGHT * (CONTENT_END / 100)),               // 1008px (70%)
    // Footer zone (70-100%) - FORBIDDEN
    footerStart: Math.floor(CANVAS_HEIGHT * (CONTENT_END / 100)),              // 1008px (70%)
    footerEnd: CANVAS_HEIGHT
  };

  console.log('[Event Poster v24.10] UNIFIED ZONE PIXEL POSITIONS:', {
    headerZone: `0px - ${pixelZones.headerEnd}px (0-40% FORBIDDEN)`,
    contentZone: `${pixelZones.contentStart}px - ${pixelZones.contentEnd}px (${CONTENT_START}-${CONTENT_END}%)`,
    headlineZone: `${pixelZones.headlineStart}px - ${pixelZones.headlineEnd}px`,
    dateVenueZone: `${pixelZones.dateVenueStart}px - ${pixelZones.dateVenueEnd}px`,
    footerZone: `${pixelZones.footerStart}px - ${pixelZones.footerEnd}px (${CONTENT_END}-100% FORBIDDEN)`,
    canvasHeight: `${CANVAS_HEIGHT}px`
  });

  // v25.2 Fix B: LAYER 1 OVERLAP PREVENTION - Build pixel-precise spatial constraints
  // Use ACTUAL Sharp pixel values (not artificial 40%/70% zone boundaries)
  // Previously passed pixelZones.contentStart (576px, 40%) as headerHeight — WRONG
  // Now passes real Sharp header height (e.g., 290px) so Gemini sees the true boundary
  const _actualHeaderPx = Math.max(
    options.logoStripZoneCoordinates?.headerHeight ?? pixelZones.contentStart,
    Math.floor(CANVAS_HEIGHT * 0.40)  // v47.1: 40% hard floor so pixel constraints match CONTENT_START
  )
  const _actualFooterPx = options.logoStripZoneCoordinates?.footerHeight ?? (CANVAS_HEIGHT - pixelZones.footerStart)
  const _contentEndPx = Math.floor(CANVAS_HEIGHT * CONTENT_END / 100)  // derived from CONTENT_END — consistent with percentage label

  console.log('[Event Poster v25.2] Fix B — Real Sharp pixel values:', {
    actualHeaderPx: `${_actualHeaderPx}px`,
    actualFooterPx: `${_actualFooterPx}px`,
    contentEndPx: `${_contentEndPx}px (was artificial ${pixelZones.footerStart}px)`,
    gainedSpacePx: `${_contentEndPx - pixelZones.contentEnd}px more usable height`,
  })

  const pixelPreciseConstraints = buildPixelPreciseSpatialConstraints(
    CANVAS_WIDTH,
    CANVAS_HEIGHT,
    _actualHeaderPx,    // Real Sharp header height (e.g., 290px) — not artificial 576px
    _actualFooterPx,    // Real Sharp footer height (e.g., 268px)
    CONTENT_START,
    100 - CONTENT_END,
    options.engine,
    _contentEndPx       // v25.2 NEW: explicit pixel where content MUST end (e.g., 1142px)
  )

  console.log('[Event Poster v24.10] LAYER 1:', options.engine === 'yi_craft'
    ? `Pro model STRICT spatial constraints (${CONTENT_START}%-${CONTENT_END}%)`
    : `Flash model spatial constraints (${CONTENT_START}%-${CONTENT_END}%)`
  )

  // NEW v3.4: Build forbidden zones for strict logo-text overlap prevention


  // Build speaker zone context from options.speakerPhotoConfig (v3.1)
  // This uses the config passed from API route, which preserves the zone even when user has own photo

  // v24.29: RE-ENABLED speaker photo composition guidance with 60% text boundary
  // New strategy: Use composition philosophy language to keep ALL text above 60%
  // This reserves 60%-70% for Sharp photo overlays without Gemini drawing placeholders
  const speakerZoneContext = buildSpeakerPhotoCompositionGuidance(options.speakerPhotoConfig)
  // v24.29: Use early detection value for consistency (already calculated above for content zones)
  const hasSpeakerPhoto = hasSpeakerPhotoEarly

  // v52.0: SPEAKER PHOTO BBOX RESERVATION — explicit pixel rectangle that the Sharp overlay
  // will occupy. Telling Gemini exactly where the circular portrait lands prevents the model
  // from rendering an AI face, text, or important focal subject inside the same rectangle and
  // colliding with the post-composite overlay. Uses precomputed coordinates when available,
  // otherwise falls back to single-speaker 'bottom' defaults (380px circle centred at 70%Y).
  const speakerPhotoBboxReservation = (() => {
    if (!hasSpeakerPhotoEarly) return ''
    const coords = options.speakerPhotoZoneCoordinates
    const photoLeft = coords?.leftEdge ?? Math.floor((CANVAS_WIDTH - 380) / 2)
    const photoTop = coords?.topEdge ?? Math.floor(CANVAS_HEIGHT * 0.70) - Math.floor(380 / 2)
    const photoRight = coords?.rightEdge ?? photoLeft + 380
    const photoBottom = coords?.bottomEdge ?? photoTop + 380
    const photoLeftPercent = Math.round((photoLeft / CANVAS_WIDTH) * 100)
    const photoRightPercent = Math.round((photoRight / CANVAS_WIDTH) * 100)
    const photoTopPercent = Math.round((photoTop / CANVAS_HEIGHT) * 100)
    const photoBottomPercent = Math.round((photoBottom / CANVAS_HEIGHT) * 100)

    // v53.5: Branch by speakerRenderMode. 'gemini' (default) tells Gemini to
    // DRAW the subject directly from the attached reference photo using the
    // archetype framing — no Sharp overlay will run afterward. 'sharp' (legacy)
    // tells Gemini to LEAVE a reserved bbox and NOT draw the subject because
    // Sharp will composite the circle in post-processing.
    const mode = options.speakerRenderMode ?? 'gemini'

    if (mode === 'gemini') {
      return `<instruction>(DO NOT RENDER — subject rendering guidance, NOT text for the image)
v53.5 SUBJECT RENDERING: A reference portrait is attached as the SECOND image input. This is the actual person being honored. Render the central portrait DIRECTLY from this reference image, in your own composition, using the archetype framing/motifs/lighting described elsewhere in this prompt.
- The subject is THE central visual hero of this poster. Compose around them with confidence — they should occupy roughly the central 40-55% of the canvas height and be the eye's first focal point.
- Match the reference image's face, age, attire (e.g. silk sari color, jewelry, expression). The likeness should be recognizable — this is a tribute to a SPECIFIC person, not a generic figure.
- Apply the archetype framing exactly: if the archetype calls for a mehrab arch behind the head, draw it. If it calls for a garland frame, draw it. If it calls for a halo of light, render it. The portrait LIVES INSIDE the archetype framing.
- Lighting integration: light the portrait the same way you light the backdrop — same key direction, same warmth, same softness. The face must feel BELONGS in the scene, not pasted on.
- Render ONLY ONE depiction of this person anywhere on the canvas. Do not draw multiple portraits, do not duplicate the subject, do not place a smaller version elsewhere.
- No additional people, crowds, attendees, audience, team members, or silhouettes anywhere in the scene. The honored person is the sole human present.
- A text caption with the person's name MAY appear below the portrait in the lower-center band — do NOT render captions on top of the face.
</instruction>
`
    }

    // mode === 'sharp' (legacy) — reserve bbox, don't draw subject
    return `<instruction>(DO NOT RENDER — composition reservation for the Sharp post-processing speaker overlay)
v53.5 SHARP MODE: A circular portrait will be composited by post-processing AFTER you generate, inside this rectangle: x=${photoLeft}px-${photoRight}px (${photoLeftPercent}%-${photoRightPercent}% width), y=${photoTop}px-${photoBottom}px (${photoTopPercent}%-${photoBottomPercent}% height). Treat this rectangle as a reserved subject zone:
- Do NOT render any human face, head, or person inside or behind this rectangle.
- Do NOT render text, captions, names, designations, or labels inside this rectangle — captions about the speaker will be composited BELOW the rectangle (y > ${photoBottom}px).
- Do NOT place important focal subjects (props, signs, icons) here — they would be hidden by the portrait.
- Keep the area surrounding the rectangle visually calm and uncluttered so the portrait reads as the clear focal element.
- The scene's background (gradient, atmosphere, soft texture) continues unbroken through this rectangle — the portrait composites ON TOP.
- DO NOT draw ANY people, faces, human figures, attendees, crowds, audiences, or silhouettes ANYWHERE in the scene. Zero humans drawn by you.
- Compose a STAGE-ONLY backdrop: architecture, atmospheric lighting, decorative objects, brand-color gradients and textures.
- The reference photo attached as the second image is provided only to inform palette harmony / lighting direction / decorative motif choice — do NOT redraw or restyle the face.
</instruction>
`
  })()

  if (hasSpeakerPhoto && speakerZoneContext) {
    console.log('[Event Poster] v24.29: Speaker photo composition guidance ENABLED (60% text boundary)')
  }

  // v53.0: Composition-strategy-aware block. Fires for ALL strategies the Subject
  // Classifier emits. The portrait-hero variant fires whether or not a speaker photo
  // is attached — the strategy says "this poster centers on ONE person" regardless,
  // and the v52.2 block inside speakerPhotoBboxReservation only fires when a photo
  // IS attached. This new block covers the gap (portrait-hero, no photo attached).
  const compositionStrategyBlock = (() => {
    const strategy = options.compositionStrategy
    if (!strategy) return ''
    const blocks: Record<string, string> = {
      'portrait-hero': hasSpeakerPhotoEarly
        ? '' // Already covered by v52.2 inside speakerPhotoBboxReservation above — avoid duplicating
        : `<instruction>(DO NOT RENDER — composition strategy: portrait-hero, no reference photo attached)
This poster centers on ONE specific person being honored. Because no reference portrait is attached:
- Draw a SINGLE DIGNIFIED PORTRAIT of the honoree at the center of the composition, occupying roughly 40-55% of the canvas height around the visual center. Indian features, culturally appropriate attire matching the brief's tone (formal sari/kurta for traditional; business attire for corporate).
- The portrait is the ONLY human in the scene. No crowds. No audience. No team members. No attendees. No silhouettes of other people anywhere in the composition (foreground, midground, or background).
- Surround the portrait with an EMPTY DIGNIFIED STAGE BACKDROP: architecture (ballroom, sabha hall, decorative pillars, drapes), ceremonial lighting (warm spotlights, soft glow, ambient backlight, theatrical depth), decorative objects (flowers, garlands, ceremonial banners, cake on a stand, brand-color textures).
- If a separate ${'`'}speakerPhotoBboxReservation${'`'} block also appears in this prompt (meaning a reference photo WAS attached after all), THAT block takes precedence and you should follow its instructions instead of drawing a portrait yourself.
- Frame the portrait with decorative motifs (florals, mandala accents, brand-colored geometric framing) that match the tone of the event.
</instruction>
`,
      'activity-collage': `<instruction>(DO NOT RENDER — composition strategy: activity-collage, v54.1)
Compose ONE integrated, cohesive scene set in a SINGLE continuous environment. This is NOT a split screen, NOT a diptych/triptych, and NOT stacked horizontal bands.
- If the brief describes a SINGLE activity (e.g. one run/marathon, one workshop, one drive, one tournament), render it as ONE unified dynamic hero scene with real depth — foreground action, midground, background — full of motion and energy. Do not segment it.
- Only if the brief genuinely lists MULTIPLE distinct activities may you depict more than one — and even then they MUST share ONE seamless environment connected by soft, flowing transitions (a shared ground plane, overlapping light, connecting motion trails or ribbons), never separated into boxed panels, grid cells, or hard-edged sections.
- OVERRIDE: if any other reference text in this prompt mentions "panels", "zones", "grid", "multi-track", "modular", or "collage", treat those ONLY as soft, blended regions inside this single continuous scene — do NOT draw literal dividers, frames, boxes, or split-screen sections.
- Avoid: split-screen, diptych, triptych, stacked horizontal bands, boxed/rectangular panels, modular grid cells, hard divider lines between sections, comic-strip layout.
</instruction>
`,
      'object-hero': `<instruction>(DO NOT RENDER — composition strategy: object-hero)
This poster centers on ONE symbolic object (the launched product / book / device / app). Compose so the object dominates approximately 60% of the central content area, lit with dramatic product photography lighting (rim light, soft key, deep shadow). Clean backdrop — minimal decorative competition. People should be secondary or absent. The object IS the hero — everything else frames it.
</instruction>
`,
      'environment-scene': `<instruction>(DO NOT RENDER — composition strategy: environment-scene)
This poster centers on the PLACE itself (heritage walk venue / new lab / new building / campus). Compose so the architectural / spatial subject occupies the central content area in detail — show the building facade, the landscape, the venue interior, the spatial atmosphere. People are incidental scale figures only, not the focus. Cinematic architectural depth with appropriate ambient lighting for the place.
</instruction>
`,
      // 'concept-iconic' → no override (current default behavior is correct for concepts)
    }
    return blocks[strategy] || ''
  })()
  if (options.compositionStrategy) {
    console.log(`[Event Poster] v53.0: Composition strategy "${options.compositionStrategy}" — block ${compositionStrategyBlock.length > 0 ? 'INJECTED' : 'SKIPPED (covered elsewhere or default)'}`)
  }

  // v24.17: Log speaker text completely skipped from Gemini prompt when photo overlay is enabled
  // Sharp handles ALL speaker rendering (photo + name + designation) as grouped card
  if (hasSpeakerPhoto && speakers.length > 0) {
    console.log('[Event Poster] v24.17: Speaker text FULLY SKIPPED from Gemini prompt (photo overlay mode)')
    console.log('[Event Poster] v24.17: Sharp will render speaker card with:', speakers.map(s => `${s.name}${s.designation ? ` (${s.designation})` : ''}`).join(', '))
  }

  // NEW v4.0: Determine Design Sophistication based on event type and vertical
  // Prioritize explicit data.sophistication if provided by user/frontend (support aliases)
  // NEW v4.0: Determine Design Sophistication using centralized helper
  // This now correctly identifies holidays (Christmas, Diwali) as 'rich'
  const sophistication = getSophistication({ ...options, ...data } as unknown as EnhancedBuildOptions, 'balanced')

  // NEW v3.4: Build forbidden zones (MOVED HERE to depend on Sophistication)
  // v29.0: forbiddenZonesContext/zoneReminderContext intentionally NOT injected into prompt.
  // Their percentages (15-18%) contradict CONTENT_START (35-40%) and would send Gemini
  // conflicting zone signals. Pixel-precise constraints (Layer 1) are authoritative.
  const { forbiddenZonesContext: _forbiddenZonesCtx, zoneReminderContext: _zoneReminderCtx } = getIntegratedZoneContext(options, sophistication)

  // v6.0: Detect user overrides (custom colors or explicit design preferences)
  const hasUserColorOverride = options.brandContext?.colorSource === 'custom'
  const hasUserThemeOverride = options.theme && options.theme !== 'ai'
  const hasUserOverrides = hasUserColorOverride || hasUserThemeOverride

  // NEW v3.2: Build decorative elements section from Design Intelligence context
  // v4.0: Now sophistication-aware
  // v25.1: Content density-aware - more elements for sparse content
  // v24.12.4: Increased base counts for richer backgrounds (3→5, 7→10, 12→15)
  const baseMaxElements = sophistication === 'minimalist' ? 5 : (sophistication === 'rich' ? 15 : 10)
  const adjustedMaxElements = getAdjustedElementCount(baseMaxElements, contentDensityAnalysis)

  if (contentDensityAnalysis.shouldEnrichBackground) {
    console.log('[Event Poster v25.1] Background enrichment active:', {
      baseElements: baseMaxElements,
      adjustedElements: adjustedMaxElements,
      multiplier: contentDensityAnalysis.decorativeMultiplier,
      backgroundComplexity: contentDensityAnalysis.backgroundComplexity
    })
  }

  const decorativeElementsContext = buildDecorativeElementsSection({
    eventType: data.eventType || 'general',
    designContext: options.designContext,
    // v25.1: Use adjusted element count based on content density
    maxElements: adjustedMaxElements,
    includeIconicImagery: true,
    sophistication,
  })
  const _sceneBackground = buildBackgroundSettingSection(options.designContext, sophistication)
  const backgroundSettingContext = buildBackgroundStyleOverride(options.backgroundStyle, _sceneBackground, options.designContext)

  // NEW v3.4: Build AI-enhanced typography and decorative sections
  // NEW v3.9: Color-aware typography with role-based color specifications
  let aiTypographySection = ''
  // Declare colorSource at function level so it's accessible in return statement
  // Initialize with default speaker colors
  let colorSource: any = {
    speaker_name: determineSpeakerColor({ role: 'speaker_name' }),
    speaker_designation: determineSpeakerColor({ role: 'speaker_designation' })
  }
  {
    if (options.brandContext?.useBrandFont !== false) {
      aiTypographySection = '' // Skip

      // NEW v3.9: Determine color source
      // PRIORITY 1: Brand Colors (if enforced)
      // PRIORITY 2: Design Intelligence AI-generated colors
      // PRIORITY 3: Hardcoded Event Context defaults

      // v51.0: Footer text is composited by Sharp (enhanced-4-row-strip).
      // AI does not render footer details — zone reserved via pixel constraints.
      const hasFooter = false

      // CUSTOM COLORS (Highest Priority - user-selected colors)
      // v6.4 FIX: Custom colors are for BACKGROUND/DESIGN, not text
      // Text should be WHITE for contrast against the colored background
      if (options.brandContext?.colorSource === 'custom' && options.brandContext.primaryColor) {
        // User's custom colors are for DESIGN (background, shapes, gradients)
        // Text is WHITE for maximum contrast and readability
        const speakerNameColor = determineSpeakerColor({
          accentColor: options.brandContext.accentColor || 'white',
          role: 'speaker_name'
        })
        const speakerDesignationColor = determineSpeakerColor({
          textColor: '#D0D0D0',
          role: 'speaker_designation'
        })

        colorSource = {
          hero: { color: 'white', description: 'White text for maximum contrast against custom background' },
          headline: { color: 'white', description: 'White text for readability on colored background' },
          body: { color: 'white', description: 'High contrast white for readability' },
          cta: { color: 'white', description: 'White CTA text for contrast' },
          caption: { color: '#E0E0E0', description: 'Light gray for footer details' },
          speaker_name: speakerNameColor,
          speaker_designation: speakerDesignationColor
        }
      }
      // BRAND COLORS (Second Priority)
      else if (options.brandContext?.useBrandColors && options.brandContext.primaryColor) {
        // Manual override using Brand Colors
        const speakerNameColor = determineSpeakerColor({
          accentColor: options.brandContext.accentColor || options.brandContext.secondaryColor,
          role: 'speaker_name'
        })
        const speakerDesignationColor = determineSpeakerColor({
          textColor: '#D0D0D0',
          role: 'speaker_designation'
        })

        colorSource = {
          hero: { color: options.brandContext.primaryColor, description: 'Brand Primary Color (Mandatory)' },
          headline: { color: options.brandContext.secondaryColor || 'white', description: 'Brand Secondary Color' },
          body: { color: 'white', description: 'High contrast white for readability' },
          cta: { color: options.brandContext.accentColor || options.brandContext.secondaryColor || 'white', description: 'Brand Accent Color' },
          caption: { color: '#E0E0E0', description: 'Light gray for footer details' },
          speaker_name: speakerNameColor,
          speaker_designation: speakerDesignationColor
        }
      }
      // DESIGN INTELLIGENCE COLORS (Third Priority - lower than custom)
      else if (options.designContext?.typographyGuidance?.colorMapping) {
        colorSource = options.designContext.typographyGuidance.colorMapping

        // Add speaker roles if not present in design intelligence
        if (!colorSource.speaker_name) {
          const speakerNameColor = determineSpeakerColor({
            accentColor: (colorSource.cta as any)?.color,
            role: 'speaker_name'
          })
          const speakerDesignationColor = determineSpeakerColor({
            textColor: (colorSource.body as any)?.color,
            role: 'speaker_designation'
          })
          colorSource.speaker_name = speakerNameColor
          colorSource.speaker_designation = speakerDesignationColor
        }
      }
      else {
        // FALLBACK LOGIC
        colorSource = eventContext.colorPalette

        // v4.8: UNIVERSAL FALLBACK FIX (Synthetic Palette Generation)
        // If we fell back to eventContext.colorPalette, checks if it's the "Generic" one or just a mismatch.
        // If DesignContext has ANY style advice/mood, we construct a matching palette 
        // instead of forcing the generic "Blue/Orange" template.

        if (options.designContext?.colorMood) {
          // We have a mood (e.g., "Neon Purple and Cyber Blue") but no mapping.
          // Generate a synthetic palette that respects the mood.
          const moodDescription = options.designContext.colorMood

          const speakerNameColor = determineSpeakerColor({
            accentColor: 'contrast accent',
            role: 'speaker_name'
          })
          const speakerDesignationColor = determineSpeakerColor({
            textColor: 'High Contrast Neutral',
            role: 'speaker_designation'
          })

          colorSource = {
            hero: {
              color: 'High Contrast Theme Color', // Allow AI to pick best contrast
              description: 'Maximum contrast text color that stands out against the rich background',
              contrastRatio: 7
            },
            headline: {
              color: 'Complementary Theme Color', // Safer default for rich backgrounds
              description: 'Complementary high-visibility shade matching the background mood',
              contrastRatio: 4.5
            },
            body: {
              color: 'High Contrast Neutral',
              description: 'Maximum readability neutral tone'
            },
            cta: {
              color: 'contrast accent', // AI will interpret this based on mood
              description: `High contrast accent color derived from: ${moodDescription}`,
              contrastRatio: 7
            },
            caption: {
              color: 'Subtle Neutral',
              description: 'Subtle but readable footer text'
            },
            speaker_name: speakerNameColor,
            speaker_designation: speakerDesignationColor
          }
        }

        // Add speaker roles to eventContext.colorPalette if not added via synthetic palette
        if (!colorSource.speaker_name) {
          const speakerNameColor = determineSpeakerColor({
            accentColor: eventContext.colorPalette.cta?.color,
            role: 'speaker_name'
          })
          const speakerDesignationColor = determineSpeakerColor({
            textColor: eventContext.colorPalette.body?.color,
            role: 'speaker_designation'
          })
          colorSource.speaker_name = speakerNameColor
          colorSource.speaker_designation = speakerDesignationColor
        }
      }

      // NEW v6.12: WCAG Contrast Validation Layer
      // Validate body text color against event details card background
      if (options.designContext?.vibeAndMood?.emotionalTemperature) {
        // Extract card background hex from emotional temperature mapping
        const emotionalTemp = options.designContext.vibeAndMood.emotionalTemperature
        const cardBackgroundHex =
          emotionalTemp === 'warm' ? '#FFF8F0' :
          emotionalTemp === 'cool' ? '#F8FBFF' :
          '#FFFFFF'

        // Validate body text if it's a valid hex color (not AI descriptive text)
        const bodyColorValue = (colorSource.body as any)?.color
        if (bodyColorValue && /^#[0-9A-F]{6}$/i.test(bodyColorValue)) {
          const validation = validateTextContrast(
            bodyColorValue,
            cardBackgroundHex,
            'body',
            false // Normal text size
          )

          if (!validation.passes) {
            console.warn(`[Event Poster v6.12] Body text contrast FAIL: ${bodyColorValue} on ${cardBackgroundHex} = ${validation.ratio.toFixed(2)}:1 (need 4.5:1)`)

            // Auto-correct to WCAG AA compliant color
            const safeBodyColor = getContrastSafeTextColor(
              cardBackgroundHex,
              bodyColorValue,
              {
                targetLevel: 'AA',
                isLargeText: false,
                preserveHue: true // Try to keep color family if possible
              }
            )

            // Verify the correction worked
            const verifyResult = validateTextContrast(safeBodyColor, cardBackgroundHex, 'body', false)

            colorSource.body = {
              color: safeBodyColor,
              description: `Auto-corrected for WCAG AA (${verifyResult.ratio.toFixed(2)}:1 contrast)`,
              contrastRatio: verifyResult.ratio
            }

            console.log(`[Event Poster v6.12] ✓ Body text corrected: ${bodyColorValue} → ${safeBodyColor} (${verifyResult.ratio.toFixed(2)}:1)`)
          } else {
            console.log(`[Event Poster v6.12] ✓ Body text contrast passes: ${bodyColorValue} on ${cardBackgroundHex} = ${validation.ratio.toFixed(2)}:1`)
          }
        }
      }

      // v51.0: Build background style block once (was duplicated across both branches)
      const speakerPhotoZoneNote = hasSpeakerPhotoEarly
        ? '\nSPEAKER PHOTO ZONE (60%-90%): keep clean — user photo composited here.'
        : ''
      let backgroundStyleBlock: string
      if (isYiChapterEvent) {
        backgroundStyleBlock = `YI CHAPTER MINIMAL BACKGROUND (Yi Kanniyakumari Instagram style):
Official Yi chapter communication. Typography is the hero; background calm and uncluttered.
Pick one: (A) deep Yi blue gradient #005B96→#003A6E with soft radial glow [most on-brand];
(B) brand-primary clean solid/gradient with generous negative space;
(C) clean off-white #F8FAFF with one bold Yi-blue accent (corner block / thick side border / 8% top-band).
Optional: ONE symbolic watermark at 8–12% opacity behind text (tooth outline, runner silhouette, circuit node).
70%+ of canvas stays pure uncluttered background. No photographic scenes, no crowds, no medals/confetti,
no cinematic depth-of-field, no complex lighting.${speakerPhotoZoneNote}`
      } else if (isYiSpotlight) {
        backgroundStyleBlock = `YI SPOTLIGHT — Freepik / Behance premium poster quality.
ONE dominant focal element commands the composition; everything else amplifies it.
Build 4–5 depth layers: deep gradient base → subtle painterly texture 8–10% → atmospheric radial glow behind subject → large confident focal subject (45–60% canvas height, dynamic pose, lit from front/above) → optional foreground accent.
Composition: diagonal tension, asymmetric balance, or radial draw — NOT flat centered stacking.
2–3 deliberate jewel-palette colors with one warm accent; ensure strong contrast against text zones.
Info anchor band at 75–85% vertical in accent color (Yi orange #FF6B35), 8–10% canvas height.
Indian/South Asian faces, clothing, architecture, vegetation — recognisably Tamil Nadu/South Indian.${hasSpeakerPhotoEarly ? '\nSPEAKER PHOTO ZONE (60%-90%): no AI faces — scene people stay upper portion.' : ''}`
      } else {
        backgroundStyleBlock = `SCENE-BASED BACKGROUND — storytelling through environment.
Depict a REAL SCENE or ENVIRONMENT that tells the event story. Choose literal OR conceptual based on stronger visual impact.
Literal examples: Indian doctor explaining anatomy with charts; Indian youth in safety vests at zebra crossing; Indian professionals at monitors with code/circuit boards; Indian speaker at podium in conference hall; Indian volunteers planting saplings; Indian performers on stage with instruments; South Indian graduates in caps and gowns receiving diplomas.
Conceptual metaphors (often more memorable): graduates bursting through open books into golden sky; mortarboards transforming into birds; lone leader silhouette at apex of grand staircase; brain rendered as glowing AI circuit city; giant hands cradling miniature Earth with tree growing upward; heartbeat line forming running silhouette.
Concept-as-device: audience silhouettes FORM the shape; books UNFOLD into wings; circuit board patterns BECOME a brain; tree roots ARE a map.
Include: recognisable environment, concrete topical objects, professional depth-of-field, lighting matching setting, Indian/South Asian people actively DOING the activity.
Avoid: abstract waves/dots/mesh, generic geometry, Western faces, amorphous gradients with no concrete elements.${hasSpeakerPhotoEarly ? '\nSPEAKER PHOTO ZONE (60%-90%): no AI faces — scene people stay upper portion.' : ''}`
      }

      const commonBackgroundRules = `Render all text as part of the poster design — typography IS the design.
Background flows top-to-bottom as ONE seamless photograph/painting — NO horizontal bands, divider lines, stripes, or visible zone boundaries. Hierarchy comes from whitespace, color contrast, and font size — not lines. Info cards / detail bars / CTA buttons are foreground elements that sit on top of the seamless background.

${backgroundStyleBlock}

Text color hierarchy: headline in ${getSafeColor(colorSource, 'hero', COLOR_FALLBACKS.hero).description}; tagline in ${getSafeColor(colorSource, 'headline', COLOR_FALLBACKS.headline).description}; body details in ${getSafeColor(colorSource, 'body', COLOR_FALLBACKS.body).description}.${data.registrationInfo ? `\nCTA "${data.registrationInfo}" is a prominent button in ${getSafeColor(colorSource, 'cta', COLOR_FALLBACKS.cta).description}.` : ''}`

      // If Design Intelligence provided typography guidance, include extra font details
      if (options.designContext?.typographyGuidance) {
        const tg = options.designContext.typographyGuidance
        const smartAlignment = tg.alignment || (
          sophistication === 'minimalist' ? 'left' :
            sophistication === 'rich' ? 'asymmetric' :
              'center'
        )
        aiTypographySection = `<typography_and_color_specifications>
TYPOGRAPHY: ${tg.typographyStyle || 'sans'} fonts, ${smartAlignment}-aligned. Headline: ${tg.headlineStyle}. Body: ${tg.bodyStyle}. Hierarchy: ${tg.hierarchy}.

${commonBackgroundRules}
</typography_and_color_specifications>
`
      } else {
        const fallbackAlignment = sophistication === 'minimalist' ? 'left' :
          sophistication === 'rich' ? 'asymmetric' : 'center'
        aiTypographySection = `<typography_and_color_specifications>
TYPOGRAPHY: ${fallbackAlignment}-aligned layout.

${commonBackgroundRules}
</typography_and_color_specifications>
`
      }

    }
  }

  // Build v4.1 contexts with correct overrides
  const v41Contexts = buildAllV41Contexts({
    // Text alignment: center headlines, left-aligned details
    // v4.2: Use AI-suggested alignment if available
    textAlignment: {
      headlines: (options.designContext?.typographyGuidance?.alignment as any) || 'center',
      subtitles: (options.designContext?.typographyGuidance?.alignment as any) === 'asymmetric' ? 'left' : (options.designContext?.typographyGuidance?.alignment as any) || 'center',
      details: (options.designContext?.typographyGuidance?.alignment as any) === 'asymmetric' ? 'right' : 'left',
      footer: 'center',
    },
    // Text shadow for white text legibility on photos/gradients
    textShadow: {
      enabled: true,
      roles: ['headline', 'subheadline'],
      intensity: 'subtle',
    },
    // Header logo band for Yi logo layout
    // v5.1: User-controlled via logoStripMode toggle
    // v6.0: Dual-stripe detection for two-row logo layouts
    // v24.2: CRITICAL FIX - Removed all descriptions of what logos/badges will appear
    // Gemini interprets descriptions as instructions to CREATE visible elements
    headerLogoBand: (() => {
      const logoStripEnabled = options.logoStripMode?.enabled || false
      // v6.0: Detect dual-stripe mode: Both primary logos AND vertical logos present
      const hasDualStripe = logoStripEnabled && !!options.verticalId

      return {
        enabled: logoStripEnabled,
        heightPercent: hasDualStripe ? 18 : 12,  // v6.0: 18% for dual-stripe, 12% for single-stripe
        dualStripeMode: hasDualStripe,  // v6.0: Flag for context builders
        // v24.2: Simplified background style - no mention of logos
        backgroundStyle: logoStripEnabled
          ? 'clean, simple background only - NO text or visual elements'
          : 'transparent - simple background only',
        // v24.2: REMOVED logoLayout description - was causing AI to generate "Yi Learning" badges
        logoLayout: 'EMPTY - generate only clean background in this zone',
        secondaryLogos: false,  // v24.2: Disabled - was causing unwanted badge generation
      }
    })(),
    // Footer with Yi chapter branding (only if user provided footer data)
    footerStyle: {
      enabled: !!options.footerContext, // Only enable if user explicitly provided footer contact data
      heightPercent: 10,
      leftSection: 'standard_yi',
      rightSection: 'partner_logo',
      chapterDetails: options.footerContext ? {
        chapterName: options.organizationContext?.name || '', // Default to empty string if no name provided
        // Hashtag and social handle auto-generated from chapter name
      } : undefined,
      partnerInfo: options.footerContext ? {
        partnerLabel: 'Digital Partner',
      } : undefined,
    },
    // Pass footer contact context (phone, email, website, social)
    footerContext: options.footerContext,
    // Event details card (if date/time/venue present)
    eventDetailsCard: {
      enabled: !!(data.eventDate || data.eventTime || data.venue),
      position: 'bottom-center',
      includeIcons: true,
      backgroundColor: 'white',
    },
    // Event data for the card
    eventData: {
      date: data.eventDate,
      time: data.eventTime,
      venue: data.venue,
    },
  })

  // Define variables used in the template
  const typographyRules = aiTypographySection;

  // v5.5: PRIORITY COLOR RESOLUTION - User colors MUST NOT be overridden
  // Priority 1: resolvedColors (user-selected colors from UI)
  // Priority 2: brandContext (organization brand colors)
  // Priority 3: eventContext (hardcoded event-type colors - ONLY as emergency fallback)
  const colors = options.resolvedColors
    ? buildColorDescriptionFromResolved(options.resolvedColors)
    : options.brandContext?.primaryColor
      ? buildColorDescriptionFromResolved({
          source: options.brandContext.colorSource || 'preset',
          primaryColor: options.brandContext.primaryColor,
          secondaryColor: options.brandContext.secondaryColor || '#FFFFFF',
          accentColor: options.brandContext.accentColor || '#000000',
        })
      : eventContext.colors; // Emergency fallback ONLY when no user colors exist

  // Log color source for debugging color flow issues
  console.log('[Event Poster] Color source:', options.resolvedColors?.source || (options.brandContext?.primaryColor ? 'brandContext' : 'eventContext'))
  const tg = options.designContext?.typographyGuidance;
  const tg_style = tg?.typographyStyle || 'modern';
  const tg_cat = tg?.typographyStyle || eventContext.headlineFont || 'sans-serif';
  const tg_align = (tg?.alignment as any) || 'center';

  // v42.1: Background contrast guidance — tell Gemini what text colors will be composited
  // so it can ensure the background provides adequate contrast with those colors.
  const _rc = options.resolvedColors
  const _bc = options.brandContext
  const _p = _rc?.primaryColor || _bc?.primaryColor || '#005B96'
  const _s = _rc?.secondaryColor || _bc?.secondaryColor || '#FFFFFF'
  const _a = _rc?.accentColor || _bc?.accentColor || '#FFFFFF'
  const _hexLum = (h: string) => {
    const clean = h.replace('#', '').padEnd(6, '0')
    const [r, g, b] = (clean.match(/.{2}/g) ?? ['ff','ff','ff'])
      .map(v => { const c = parseInt(v, 16)/255; return c <= 0.03928 ? c/12.92 : Math.pow((c+0.055)/1.055, 2.4) })
    return 0.2126*r + 0.7152*g + 0.0722*b
  }
  // Pick the lightest brand color (what Sharp uses as headline text on dark backgrounds)
  const _overlayText = [_a, _s, _p, '#FFFFFF'].find(c => _hexLum(c) > 0.20) ?? '#FFFFFF'
  const _textIsLight = _hexLum(_overlayText) > 0.40
  const textContrastGuidance = _textIsLight
    ? `BACKGROUND CONTRAST REQUIREMENT (v42.1 — CRITICAL):
    Sharp will composite LIGHT text (${_overlayText}) in the ${CONTENT_START}%–${CONTENT_END}% zone.
    ✅ MANDATORY: Background in ${CONTENT_START}%–${CONTENT_END}% must be NOTICEABLY DARKER — deep shadows, rich dark environment, moody tones.
    ❌ FORBIDDEN: Bright sky, pale walls, high-luminance gradients, or white/cream tones in the content zone.`
    : `BACKGROUND CONTRAST REQUIREMENT (v42.1 — CRITICAL):
    Sharp will composite DARK text (${_overlayText}) in the ${CONTENT_START}%–${CONTENT_END}% zone.
    ✅ MANDATORY: Background in ${CONTENT_START}%–${CONTENT_END}% must be NOTICEABLY LIGHTER — pale sky, soft gradients, bright open environment.
    ❌ FORBIDDEN: Dark walls, deep shadows, or low-luminance tones in the content zone.`

  const contentZoneShadowGuidance = `TEXT READABILITY SHADOW (v44.0 — MANDATORY BAKED-IN OVERLAY):
    Paint a subtle dark atmospheric shadow DIRECTLY INTO the ${CONTENT_START}%–${CONTENT_END}% zone of the scene itself — as if a soft cloud shadow, depth-of-field darkening, or moody stage lighting naturally darkens this band of the image.

    ✅ Execute as: ~35–45% opacity dark wash integrated into the scene art
    ✅ Must read as atmospheric / natural lighting — NOT a flat rectangle, NOT a visible text box
    ✅ Examples: dramatic overhead cloud shadow, golden-hour rim-light on edges with darker center, soft vertical gradient, dimmed depth-of-field zone, cinematic vignette
    ✅ The ${CONTENT_START}%–${CONTENT_END}% vertical band should be ~40% darker than the top (0–${CONTENT_START}%) and bottom (${CONTENT_END}–100%) regions
    ✅ Keep 50–60% of the underlying scene visible through the shadow — do NOT black it out

    ❌ NEVER a solid white / cream / light background behind text
    ❌ NEVER a flat colored rectangle or card
    ❌ NEVER visible edges, borders, or hard transitions around the darkened zone
    ❌ NEVER place bright elements (sky, pale walls, white objects) in the ${CONTENT_START}%–${CONTENT_END}% band

    This shadow is WHERE the event text will be composited by Sharp after generation — the darker pixels must give enough contrast for light text to read clearly, while still feeling like natural scene lighting.`

  // v51.0: Event intent summary — compact creative direction (replaces verbatim brief block).
  // AI has full typography freedom; exact-text-fidelity dropped per v51.0 compaction.
  const intentParts: string[] = [eventName]
  if (data.eventType) intentParts.push(`${data.eventType} event`)
  if (formattedDateTime) intentParts.push(formattedDateTime)
  if (venueStr) intentParts.push(`at ${venueStr}`)
  const originalUserBriefBlock = `<event_intent>
(DO NOT RENDER) ${intentParts.join(' · ')}${eventDescription ? ` — themed "${eventDescription}"` : ''}${data.targetAudience ? ` for ${data.targetAudience}` : ''}.
</event_intent>

`

  // v53.6: STYLE LOCK — hand-authored prompt fragment for the user's chosen
  // background style, injected VERBATIM at the very top of the prompt (right
  // after the user's intent). No LLM ever paraphrases this. Bypasses agent
  // sanitization that was diluting bold style choices ("dark cinematic",
  // "festive", "duotone") into "professional balanced premium" hedges. Highest
  // visual hierarchy in the prompt — Gemini reads top-down and weights early
  // sections heaviest. Sourced from lib/config/background-styles.ts.
  const _styleLockText = getGeminiStyleLock(options.backgroundStyle)
  const styleLockBlock = _styleLockText
    ? `<style_direction>(DO NOT RENDER — visual style direction, HIGHEST PRIORITY. This describes the visual treatment of the entire composition. Every other instruction below operates WITHIN this style direction.)
${_styleLockText}
</style_direction>

`
    : ''
  if (_styleLockText) {
    console.log(`[Event Poster v53.6] 🎨 Style lock active: "${options.backgroundStyle}" injected verbatim at prompt top (${_styleLockText.length} chars, hand-authored, no LLM paraphrasing)`)
  }

  // v47.0: Creative Vision Header — placed BEFORE spatial constraints so Gemini reads
  // the design concept (color story, visual anchor, mood) before entering compliance mode.
  // v51.1: Removed labeled section blocks (FOCAL VISUAL / TEXT ZONE / Logo bar safe zone)
  // and decorative box characters (╔ ╚ ══). Gemini was rendering these as visible labels
  // on the poster. Now uses plain prose inside <instruction> with bare pixel ranges.
  const headerEndPx = Math.floor(CANVAS_HEIGHT * CONTENT_START / 100)
  const focalEndPercent = Math.floor(CONTENT_START + (CONTENT_END - CONTENT_START) * 0.4)
  const focalEndPx = Math.floor(CANVAS_HEIGHT * focalEndPercent / 100)
  const contentEndPx = Math.floor(CANVAS_HEIGHT * CONTENT_END / 100)
  const creativeVisionHeader = options.backgroundStyle === 'custom'
    ? `<instruction>
(DO NOT RENDER — creative brief only.)
You are the creative director for an event poster titled ${eventName}. The artwork is ONE continuous full-canvas gradient — same colors, same texture, same atmosphere flowing seamlessly from y=0 to y=${CANVAS_HEIGHT}px. No band dividers, no horizontal seams, no separate scenes stacked vertically. Within this one continuous artwork the following vertical layout decisions apply:
- From 0px to ${headerEndPx}px: the same gradient continues — quiet, atmospheric, empty of objects and text. This region is NOT a separate scene; it is the same artwork breathing upward.
- From ${headerEndPx}px to ${focalEndPx}px: place a single centred iconic symbol or motif (flat or semi-realistic) that represents the event — examples include a wheat sheaf, blood drop, gear, book. Not a person, not a realistic scene. Exactly ONE symbol — never duplicate it elsewhere on the canvas.
- From ${focalEndPx}px to ${contentEndPx}px: render the event headline, tagline, and date/venue card below the symbol. Bold typography for the headline, smaller weights for supporting text.
- From ${contentEndPx}px to ${CANVAS_HEIGHT}px: the same gradient continues — quiet, atmospheric, empty of objects and text. Same artwork, just extending naturally downward.
Background: vivid full-canvas gradient using two colors that match the event mood. Nothing photorealistic. Never split the canvas into two mini-scenes.
</instruction>

`
    : buildCreativeVisionHeader(
    options.designContext,
    options.resolvedColors,
    eventName
  )

  return `${originalUserBriefBlock}${styleLockBlock}${creativeVisionHeader}<!-- ============================================= -->
<!-- MANDATORY COLOR PALETTE (v27.0 - LAYER 2)  -->
<!-- ============================================= -->

${(() => {
  const rc = options.resolvedColors
  const bc = options.brandContext
  const primaryHex = rc?.primaryColor || bc?.primaryColor || ''
  const secondaryHex = rc?.secondaryColor || bc?.secondaryColor || ''
  const accentHex = rc?.accentColor || bc?.accentColor || ''
  const ultraProColorHints = options.ultraProContext?.colorPaletteHints || ''

  // v49.1: Detect dark primary colors — prevent filling entire background with dark brand color
  const hexLum = (hex: string): number => {
    try {
      const r = parseInt(hex.slice(1,3),16)/255, g = parseInt(hex.slice(3,5),16)/255, b = parseInt(hex.slice(5,7),16)/255
      const lin = (c: number) => c <= 0.03928 ? c/12.92 : Math.pow((c+0.055)/1.055,2.4)
      return 0.2126*lin(r) + 0.7152*lin(g) + 0.0722*lin(b)
    } catch { return 0.5 }
  }
  const primaryIsDark = primaryHex ? hexLum(primaryHex) < 0.18 : false

  if (primaryHex) {
    const primaryRole = primaryIsDark
      ? `headline text, key accent details, and dark gradient anchor only. NEVER use as the solid background fill — the background MUST include BRIGHT, VIVID, well-lit areas with energy and warmth`
      : `dominant background color, gradients, and shapes`
    const bgBrightNote = primaryIsDark
      ? `\nBRIGHTNESS REQUIREMENT: The background MUST be visually bright and vibrant. Use ${secondaryHex || 'secondary color'} and lighter tones for large background areas. Dark ${primaryHex} only appears in text, borders, and accent highlights — NOT as the background fill.`
      : ''
    return `<instruction>
MANDATORY COLOR PALETTE — NON-NEGOTIABLE:
PRIMARY: ${primaryHex} — ${primaryRole}
SECONDARY: ${secondaryHex || 'complementary'} — MUST appear on ALL headline text and key visual accents
ACCENT: ${accentHex || 'contrast color'} — body text, atmospheric elements, and small highlights
${bgBrightNote}
The secondary color ${secondaryHex} MUST be visibly present in the design. A poster missing this color is REJECTED.
Do NOT substitute these colors with AI default palettes, navy/gold, or earth tones.
${ultraProColorHints ? `\nULTRA-PRO COLOR DIRECTION: ${ultraProColorHints}` : ''}
</instruction>
`
  }
  return ultraProColorHints ? `<instruction>
COLOR DIRECTION (ULTRA-PRO): ${ultraProColorHints}
Follow these color suggestions strictly. Do NOT use generic palettes.
</instruction>
` : ''
})()}
<!-- ============================================= -->
<!-- TYPOGRAPHY (WITHIN PIXEL ZONES)             -->
<!-- ============================================= -->

${hasUserOverrides ? `USER OVERRIDE ACTIVE:
${hasUserColorOverride ? '- User has specified CUSTOM COLORS - These are STRICT requirements and take priority over all AI suggestions' : ''}
${hasUserThemeOverride ? '- User has specified CUSTOM THEME/STYLE - Follow user preferences over AI design recommendations' : ''}
All Design Intelligence suggestions below are SUPPLEMENTAL - prioritize user's explicit choices.

` : ''}TYPOGRAPHY GUIDELINES:
${typographyRules}

<instruction>(DO NOT RENDER — poster context for visual composition only, NOT text to display)
This is a ${sophistication === 'minimalist' ? 'sophisticated, high-impact minimalist' : 'visually rich, immersive'} event poster for a ${(data as any).eventType || 'professional'} event${eventDescription ? `, themed around "${eventDescription}"` : ''}. The intended audience is ${data.targetAudience || eventContext.defaultAudience}.${eventDescription ? ` The visual design, imagery, and atmosphere should reflect the topic "${eventDescription}" — this is the primary thematic direction.` : ''}
</instruction>

${initiativeColorContext ? `
${initiativeColorContext}

` : ''}${(options.ultraProContext?.visualScene && options.backgroundStyle !== 'custom')
      ? `<instruction>(DO NOT RENDER — visual scene blueprint for composition only. NEVER convert any phrase here into visible text, label, caption, banner, or annotation on the image. Visualize silently.)
VISUAL SCENE (ULTRA-PRO DIRECTION — DRAW THIS, DO NOT WRITE THIS):
${stripHexCodes(options.ultraProContext.visualScene)}

DESIGN GUIDANCE:
${stripHexCodes(options.ultraProContext.designGuidance || 'Follow the visual scene description strictly.').replace(/(\d{2,3})([–-])(\d{2,3})%/g, (match, low, dash, high) => {
  const l = parseInt(low); const h = parseInt(high);
  const cl = Math.min(l, CONTENT_END); const ch = Math.min(h, CONTENT_END);
  return cl === ch ? `${cl}%` : `${cl}${dash}${ch}%`;
}).replace(/(?:below|above|past|beyond)\s+(\d{2,3})%/gi, `within ${CONTENT_START}-${CONTENT_END}%`)}
⚠️ OVERRIDE: ALL text placement percentages above are CLAMPED to the ${CONTENT_START}-${CONTENT_END}% content zone. Ignore any guidance suggesting text below ${CONTENT_END}%.
</instruction>`
      : `<instruction>(DO NOT RENDER — visual guidance only)
The poster achieves these visual storytelling goals: It looks and feels like a ${data.eventType || 'professional'} event through its visual design. ${sophistication === 'minimalist' ? 'It uses VAST NEGATIVE SPACE and a single focal element for maximum impact.' : 'The visual_design_elements create an atmospheric, contextually-rich background. The design feels "Busy" in a professional, high-end way (Organized Complexity).'} The design quality rivals Google AI Studio - layered, dimensional, sophisticated. It passes the 3-SECOND TEST where the viewer instantly understands WHAT, WHEN, WHERE.
</instruction>`
    }

${hasSpeakerPhoto ? speakerPhotoBboxReservation : ''}
${options.archetypeHint || ''}
${hasSpeakerPhoto && options.archetypeHint && (options.speakerRenderMode ?? 'gemini') === 'gemini' ? `<instruction>(DO NOT RENDER — archetype interpretation guidance when a real reference photo IS attached AND speakerRenderMode='gemini')
v53.5 ARCHETYPE + REFERENCE PHOTO (gemini mode): The archetype block above describes the visual world this poster lives in (framing, lighting, motifs, palette, mood). The reference photo (second attached image) is the SPECIFIC person to draw as the central subject of that world. Render them together: the archetype's framing wraps the person from the reference photo. Match face/attire/expression to the reference image so the likeness is recognizable, then build the archetype's mehrab/garland/halo/motifs/lighting AROUND them. ONE portrait of this person, integrated into the archetype, no duplicates anywhere else on the canvas.
</instruction>
` : ''}
${hasSpeakerPhoto && options.archetypeHint && (options.speakerRenderMode ?? 'gemini') === 'sharp' ? `<instruction>(DO NOT RENDER — archetype interpretation guidance when a real reference photo IS attached AND speakerRenderMode='sharp')
v53.4 IMPORTANT: A real reference portrait is attached as the second image input AND the speaker bbox reservation block above defines where it will composite. When the archetype block above describes "the honoured figure", "the subject", "the portrait", "the central figure", or any depiction of a person — THAT IS THE REFERENCE PHOTO, not a person you should draw. Your job for this generation is to design ONLY the archetype's framing, backdrop, lighting, decorative motifs, palette, and architectural elements — everything AROUND the subject. Do NOT draw the subject yourself. Do NOT draw a circular portrait, a head-and-shoulders figure, or any human silhouette anywhere on the canvas. The mehrab arch, jaali screens, gold filigree, garlands, lamps, halo light, and palette discipline from the archetype DO apply — render those. The portrait itself comes from the post-processing overlay.
</instruction>
` : ''}
${compositionStrategyBlock}
${options.speakerLayoutContext && !hasSpeakerPhoto ? `<instruction>(DO NOT RENDER — speaker layout guidance) ${options.speakerLayoutContext}
Place speaker names within ${CONTENT_START}–${CONTENT_END}% from the top; never below this range — photo overlays would hide them.
</instruction>
` : ''}

${logoStripZoneContext ? `${logoStripZoneContext}

` : ''}
${logoContext}
<!-- ============================================= -->
<!-- SPATIAL LAYOUT CONSTRAINTS (v50.0 — MOVED AFTER CREATIVE CONTENT) -->
<!-- Reordered from prompt-top to here: Gemini now reads creative vision, -->
<!-- color palette, typography, visual scene FIRST, then technical zones. -->
<!-- This shifts Gemini from compliance mode to creative mode. -->
<!-- ============================================= -->

<instruction>
${pixelPreciseConstraints}
</instruction>

<!-- TEXT CONTENT — render as visually appropriate -->

<text_content>
  Headline: ${eventName}
${eventDescription ? `  Tagline: ${eventDescription}\n` : ''}${(formattedDateTime || venueStr) ? `  Date/Venue card (📅 🕐 📍 icons only): ${[formattedDateTime, venueStr].filter(Boolean).join(' · ')}\n` : ''}${eventNote ? `  Additional details (chip row or icon bullets): ${eventNote}\n` : ''}</text_content>

<instruction>(DO NOT RENDER) LAYOUT AND COMPOSITION RULES:</instruction>

  <layout_composition_rules>

VERTICAL BANDS (single scene flows edge-to-edge; only TEXT and FACES respect boundaries):
This poster is ONE continuous magazine-cover-quality scene from a single camera angle. The scene's background (sky, ceiling, walls, floor, atmosphere) flows naturally through every band. Logo bars composite over top/bottom with transparency — the scene shows through behind them. There is exactly ONE scene on this canvas — never two scenes stacked vertically, never a mini-scene above plus a mini-scene below.

• UPPER CONTINUATION 0–${CONTENT_START}% (0–${Math.floor(CANVAS_HEIGHT * CONTENT_START / 100)}px): this band is the atmospheric upward extension of the same central scene — same lighting, same depth, same environment, same camera angle. Sky, ceiling, soft haze, depth-of-field blur, or upper background of the same room. It is NOT a separate scene. NO text, NO human faces, NO new focal subjects, NO duplicated motifs, NO logo placeholders, NO invented decorations here.

• CONTENT BAND ${CONTENT_START}%–${CONTENT_END}% (${Math.floor(CANVAS_HEIGHT * CONTENT_START / 100)}–${_contentEndPx}px): the ONLY band where text AND focal subjects (faces, performers) belong. Subjects in lower portion (~${CONTENT_START + 15}–${CONTENT_END}%); text overlaid upper portion (~${CONTENT_START}–${CONTENT_START + 15}%). Position camera so human heads land here.

• LOWER CONTINUATION ${CONTENT_END}%–100% (${_contentEndPx}–${CANVAS_HEIGHT}px): this band is the atmospheric downward extension of the same central scene — same floor, same ground, same lighting falloff. It is NOT a separate scene. NO text, NO faces, NO new subjects, NO duplicated focal group here.

${hasSpeakerPhoto ? `• SPEAKER PORTRAIT OVERLAY (composited after generation): see the reserved-rectangle instruction above for exact pixel bounds — keep that rectangle clear of faces, text, and important focal subjects; captions for the speaker render BELOW the rectangle, never beside or behind it.\n` : ''}Anything below ${_contentEndPx}px is invisible. When tight: compress fonts, use 2-col layout, drop least-important details. Priority: Headline > Date/Time > Venue > Speaker > Additional. Background bleeds edge-to-edge with NO frame, NO rounded corners, NO card border. ONE focal group only — don't duplicate above AND below.
${contentDensityAnalysis.density === 'dense' ? `HIGH DENSITY — use compact fonts (≤16px details), 2-col layout, truncate over overflow.\n` : ''}
TEXT RENDERING — render each text in <text_content> as a DESIGNED element, not raw type:
• HEADLINE → Ultra-bold (800–900), fills ~70% width, ALL-CAPS or split-case drama (hero word at 130–150%). Apply 2+ effects (gradient fill / 3D extrusion / per-word color / contrast stroke). Flat monochrome not acceptable.
• TAGLINE → Semi-bold (600), 35–45% of headline scale, sentence case, one accent-color word.
• DATE/VENUE → designed card (frosted glass / dark badge / gradient pill — never bare floating text). Lines: "📅 [date]  🕐 [time]" then "📍 [venue]". Card bottom stays above ${_contentEndPx - 30}px.
• ADDITIONAL DETAILS → scannable chip row or icon-led bullets — not a paragraph.

COLOR FIDELITY:
${(() => {
  const rc = options.resolvedColors || options.brandContext
  const secondaryHex = (rc?.secondaryColor || '').toLowerCase()
  const isYellowSecondary = /^#(f[a-f0-9]|e[a-f0-9])(f[a-f0-9]|e[a-f0-9])[0-5]/i.test(secondaryHex)
  return isYellowSecondary
    ? `Brand secondary is YELLOW (${secondaryHex}). Use warm-white / neutral-white lighting — no cool/blue/cyan tint that drifts yellow toward cyan/teal.`
    : `Match brand color hues precisely; no cool-tint contamination of warm brand colors.`
})()}

${textContrastGuidance}

${contentZoneShadowGuidance}
${organizerCaption ? `\nOrganizer caption "${organizerCaption}": small light-weight font (half headline prominence), single line, subdued color, below headline / above tagline.\n` : ''}${speakers.length > 0 && !hasSpeakerPhoto ? `\nSpeakers (text only, no photos):\n${buildSpeakerTextSection(speakers, colorSource)}\nGroup name + designation visually (like date/venue grouping). All speakers EQUAL prominence. When a line in ALL-CAPS (e.g. CHIEF GUEST, SPEAKER) precedes a name, render it as a small tracked-out caps role label directly ABOVE that person's name.${speakers.length > 1 ? ` Layout: ${speakers.length === 2 ? 'horizontal side-by-side' : speakers.length === 3 ? 'horizontal row or vertical stack' : '2x2 / 2x3 grid'}.` : ''}\n` : ''}${data.entryFee ? `\nRegistration fee "${data.entryFee}" — subtle detail or badge.\n` : ''}
  </layout_composition_rules>

${options.brandContext?.colorSource === 'custom' && options.brandContext.primaryColor
  ? `CUSTOM COLOR PALETTE (background, not text): dominant ${options.brandContext.primaryColor}, secondary ${options.brandContext.secondaryColor || 'complementary'}, accent ${options.brandContext.accentColor || 'contrast'}. Text white for contrast. Do not substitute with brown/amber/navy/gold defaults.`
  : (options.brandContext ? `Color scheme: ${options.brandContext.primaryColor} primary, ${options.brandContext.secondaryColor || 'white'} secondary.` : '')}

${(options.backgroundStyle !== 'custom' && options.designContext?.storytellingContext) ? `${buildStorytellingNarrativeSection(options.designContext.storytellingContext)}\n\n` : ''}${options.backgroundStyle !== 'custom' ? decorativeElementsContext : ''}

${backgroundSettingContext}

${contentDensityGuidance ? `${contentDensityGuidance}\n\n` : ''}${(options.backgroundStyle && options.backgroundStyle !== 'scene' && !_styleLockText) ? `<instruction>(DO NOT RENDER) BACKGROUND STYLE — user selected "${options.backgroundStyle.toUpperCase()}". Overrides scene-based direction.
${options.backgroundStyle === 'custom'
  ? buildCustomThemeGuidance(CONTENT_START, CONTENT_END, CANVAS_HEIGHT)
  : BACKGROUND_STYLE_GUIDANCE[options.backgroundStyle as BackgroundStyleId]}
</instruction>
` : ''}VISUAL STYLE: ${_styleLockText
  ? `(see <style_direction> block at top of prompt for the authoritative style direction)`
  : (options.backgroundStyle && options.backgroundStyle !== 'scene')
    ? (options.backgroundStyle === 'custom'
        ? buildCustomThemeGuidance(CONTENT_START, CONTENT_END, CANVAS_HEIGHT)
        : BACKGROUND_STYLE_GUIDANCE[options.backgroundStyle as BackgroundStyleId])
    : (options.designContext?.designStrategy || eventContext.style)} with ${colors} palette. Mood: ${options.designContext?.emotionalJob || eventContext.mood}. Typography: ${tg_style}-vibe (${tg_cat}), ${tg_align}-aligned. Energy: ${eventContext.energy}.

${options.multiColorTypography ? `${buildMultiColorTypographyInstructions(options.multiColorTypography)}\n` : ''}
${EVENT_POSTER_EXAMPLES}

QUALITY: text+background ONE unified composition; high contrast; no watermarks, placeholder labels, or stock-photo aesthetics. ${sophistication === 'rich' ? 'Rich, layered backgrounds frame the text.' : 'Clean, focused — text has breathing room.'}

${options?.preventionEnhancements?.length ? `LEARNED IMPROVEMENTS:\n${options.preventionEnhancements.map((e, i) => `${i + 1}. ${e}`).join('\n')}\n` : ''}
CREATIVE DIRECTION: ${sophistication === 'minimalist'
  ? `Professional minimalism — vast negative space (40%+), clean solid or subtle gradient background, one or two high-impact elements. Elite, quiet, powerful.`
  : `Rich layered backgrounds with structural intention. Multiple opacity layers, gradients, glows, ambient lighting. ${data.eventType}-themed elements throughout. Background RICH, information delivery STRUCTURED. Premium-Canva-template feel — organized complexity, not chaos.`}

Indian/South Asian people may appear actively doing the event activity. No logos (added in post-processing).

ZONE ENFORCEMENT: text above ${CONTENT_START}% (${Math.floor(CANVAS_HEIGHT * CONTENT_START / 100)}px) or below ${CONTENT_END}% (${_contentEndPx}px) is physically cut off by overlays. Date/Venue card bottom (with padding/shadow) must stay above ${_contentEndPx - 20}px.
`.trim()
}

// Export for use elsewhere

