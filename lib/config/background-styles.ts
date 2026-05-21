/**
 * Background Styles — single source of truth.
 *
 * Used by:
 *   • UI picker: components/canvas-create/LogosStylePanel.tsx (label + icon)
 *   • Gemini route: app/api/generate/route.ts (designIntelligenceHint injection)
 *   • OpenAI route: app/api/generate-openai/route.ts (designIntelligenceHint injection)
 *
 * Adding a new style = one edit here. The UI and both API routes pick it up.
 *
 * Hints are interpreted by Claude in the Design Intelligence stage, which feeds
 * Ultra-Pro for both pipelines. Same hint text works for both providers — the
 * downstream image model (Gemini or gpt-image-1) only ever sees the resulting
 * `enhancedPrompt`, never the hint directly.
 */
import type { BackgroundStyleId } from '@/lib/prompts/services/yi-prompt-builder/types'

export interface BackgroundStyleOption {
  id: BackgroundStyleId
  label: string
  icon: string
  /**
   * Injected into `designBrief.additionalVisualBrief` before Design Intelligence runs.
   * Absent for `scene` (the default — let the AI freelance based on event content).
   */
  designIntelligenceHint?: string
}

export const BACKGROUND_STYLES: BackgroundStyleOption[] = [
  // Default — no override; AI picks based on event content.
  { id: 'scene', label: 'Realistic', icon: '🏞' },

  {
    id: 'abstract',
    label: 'Abstract',
    icon: '🎨',
    designIntelligenceHint:
      'STYLE OVERRIDE — USER SELECTED ABSTRACT: Ignore the SCENE-BASED concept preference. DO NOT generate real scenes or Indian people. Generate flowing color gradients, soft geometric shapes, and fluid art in the brand palette. Abstract gradients ARE acceptable here. Use CONCEPT 3 (CONCEPTUAL).',
  },
  {
    id: 'dark',
    label: 'Cinematic',
    icon: '🎬',
    designIntelligenceHint:
      'STYLE OVERRIDE — USER SELECTED DARK CINEMATIC: Ignore the SCENE-BASED concept preference. Generate deep near-black atmosphere with dramatic light rays, glowing halos, and bokeh particles using the brand accent color. People are silhouettes or absent. Use CONCEPT 2 or CONCEPT 3.',
  },
  {
    id: 'illustrated',
    label: 'Illustrated',
    icon: '✏️',
    designIntelligenceHint:
      'STYLE OVERRIDE — USER SELECTED ILLUSTRATED: Ignore the SCENE-BASED concept preference. Generate flat vector-style illustrated elements — bold icons, clean graphic shapes related to the event theme. Solid fills, no photorealism. Use CONCEPT 2 or CONCEPT 3.',
  },
  {
    id: 'bokeh',
    label: 'Bokeh',
    icon: '✨',
    designIntelligenceHint:
      'STYLE OVERRIDE — USER SELECTED BOKEH & LIGHT: Ignore the SCENE-BASED concept preference. Generate soft out-of-focus atmosphere with glowing light orbs and warm sparkle particles in the brand palette. All elements are blurred and dreamy, not sharp or photorealistic. Use CONCEPT 3.',
  },
  {
    id: 'geometric',
    label: 'Geometric',
    icon: '🔷',
    designIntelligenceHint:
      'STYLE OVERRIDE — USER SELECTED GEOMETRIC PATTERN: Ignore the SCENE-BASED concept preference AND the ban on geometric patterns. Generate bold geometric shapes (hexagons, triangles, diagonal bands, tessellation) in the brand palette. Geometric patterns ARE required here. Use CONCEPT 3.',
  },
  {
    id: 'texture',
    label: 'Textured',
    icon: '🪨',
    designIntelligenceHint:
      'STYLE OVERRIDE — USER SELECTED TEXTURED MATERIAL: Ignore the SCENE-BASED concept preference. Generate a physical material surface (marble veining, woven fabric, paper grain, brushed metal) tinted in the brand palette. No scenes or people. Use CONCEPT 2.',
  },
  {
    id: 'split',
    label: 'Split',
    icon: '▧',
    designIntelligenceHint:
      'STYLE OVERRIDE — USER SELECTED SPLIT LAYOUT: Left half is an event-relevant atmospheric scene; right half is a clean solid brand-color panel where all text will be placed. Sharp or soft diagonal edge separates them.',
  },
  {
    id: 'neon',
    label: 'Neon',
    icon: '⚡',
    designIntelligenceHint:
      'STYLE OVERRIDE — USER SELECTED NEON GLOW: Ignore the SCENE-BASED concept preference. Generate deep near-black background with vivid electric neon light trails, glowing grid lines, bioluminescent halos, and pulsing light streaks in the brand accent color. No realistic scenes or Indian people. Use CONCEPT 3.',
  },
  {
    id: 'duotone',
    label: 'Duotone',
    icon: '🎭',
    designIntelligenceHint:
      'STYLE OVERRIDE — USER SELECTED DUOTONE: Ignore the SCENE-BASED concept preference. Generate imagery mapped to exactly TWO brand colors — shadows in primary, highlights in secondary/accent. Bold, high-contrast two-tone treatment. Abstract or silhouette forms only. Use CONCEPT 2 or CONCEPT 3.',
  },
  {
    id: 'glassmorphism',
    label: 'Glass',
    icon: '🪟',
    designIntelligenceHint:
      'STYLE OVERRIDE — USER SELECTED GLASSMORPHISM: Ignore the SCENE-BASED concept preference. Generate translucent frosted-glass panels layered over soft gradient blobs or bokeh in brand colors. Clean modern depth, no realistic scenes. Use CONCEPT 3.',
  },
  {
    id: 'watercolor',
    label: 'Watercolor',
    icon: '🖌️',
    designIntelligenceHint:
      'STYLE OVERRIDE — USER SELECTED WATERCOLOR: Ignore the SCENE-BASED concept preference. Generate soft organic paint washes and flowing pigment spreads in the brand palette. Wet watercolor bleeds, brush strokes, visible paper grain. Purely painterly, no photorealism. Use CONCEPT 3.',
  },
  {
    id: 'mandala',
    label: 'Mandala',
    icon: '🪷',
    designIntelligenceHint:
      'STYLE OVERRIDE — USER SELECTED MANDALA: Ignore the SCENE-BASED concept preference. Generate intricate radial mandala pattern with Indian floral motifs, paisley elements, and traditional ornaments in the brand palette. Symmetrical, ornate, cultural. Gold accents on darker base. Use CONCEPT 3.',
  },
  {
    id: 'custom',
    label: 'Custom',
    icon: '🖊️',
    designIntelligenceHint: `STYLE OVERRIDE — AI CUSTOM THEME: Ignore the SCENE-BASED concept preference. Based ONLY on the event details provided (event name, tagline, description, theme, venue), you must creatively decide: (1) a gradient color palette that perfectly matches the event mood and theme, (2) a single thematic visual focal element (object, symbol, or motif) that represents the event, (3) a text style that fits the event energy. Layout: logo bar safe zone top → vivid full-canvas gradient (your chosen colors) → your chosen focal visual centred in upper content zone → event details (headline, tagline, date, venue) BELOW the focal visual → logo bar safe zone bottom. NO photorealistic Indian scenes. Use CONCEPT 2 or CONCEPT 3.`,
  },

  // ── New v48.0 styles ─────────────────────────────────────────────────────
  {
    id: 'photo-real',
    label: 'Photo Real',
    icon: '📷',
    designIntelligenceHint:
      'STYLE OVERRIDE — USER SELECTED PHOTO REAL: Generate a 35mm DSLR photograph of the actual event scene. Real Indian people in real Indian venues. Natural shallow depth-of-field with sharp subject and softly defocused background. Warm/cool stage lighting, photojournalistic but premium magazine quality. Subtle film grain or cinema-style color grading. Use CONCEPT 1 (LITERAL SCENE). Avoid illustration, abstract patterns, or graphic-design aesthetics. The image should look indistinguishable from a professional event photographer\'s portfolio.',
  },
  {
    id: 'product',
    label: 'Product',
    icon: '📦',
    designIntelligenceHint:
      'STYLE OVERRIDE — USER SELECTED PRODUCT: ONE event-related symbolic object dominates 60%+ of the canvas as the visual hero. People are secondary or absent. Place the object on a clean or dramatically-lit backdrop with studio-quality lighting and a sharp key light, with subtle rim/fill light. Examples: graduation → cap mid-air against sky; music event → microphone with visualized sound waves; medical drive → stethoscope on clean surface; convocation → scroll/diploma close-up. The object IS the design — bold, scroll-stopping, editorial-magazine feel. Use CONCEPT 2 (OBJECT-AS-HERO). NO crowd scenes, NO venue interiors. Premium catalog/editorial rendering.',
  },
]

const STYLE_INDEX: Map<BackgroundStyleId, BackgroundStyleOption> = new Map(
  BACKGROUND_STYLES.map((s) => [s.id, s])
)

/** Returns the Design Intelligence hint for a style id, or `null` if none (e.g. `scene` or unknown id). */
export function getBackgroundStyleHint(id: string | undefined | null): string | null {
  if (!id) return null
  return STYLE_INDEX.get(id as BackgroundStyleId)?.designIntelligenceHint ?? null
}

/** Returns the full config for a style id, or `undefined` for unknown ids. */
export function getBackgroundStyle(id: string | undefined | null): BackgroundStyleOption | undefined {
  if (!id) return undefined
  return STYLE_INDEX.get(id as BackgroundStyleId)
}

export function isValidBackgroundStyle(id: string): id is BackgroundStyleId {
  return STYLE_INDEX.has(id as BackgroundStyleId)
}
