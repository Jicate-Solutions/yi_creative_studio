/**
 * OpenAI gpt-image-1 — Background Style Translator
 *
 * Background-style hints in lib/config/background-styles.ts are written for
 * Claude (the Design Intelligence + Ultra-Pro stages). They use abstract
 * planning language like "Use CONCEPT 2 or CONCEPT 3" — fine for an LLM that
 * reasons about composition, but useless for gpt-image-1 which renders pixels
 * directly from concrete material/medium vocabulary.
 *
 * This translator emits a SHORT, gpt-image-1-tuned "STYLE" block that asserts
 * the rendering medium up-front, before Ultra-Pro's enhancedPrompt has a chance
 * to bury the style under photographic-event language. It reinforces the
 * shared DI hint at a different layer of the stack — the two work together,
 * neither replaces the other.
 *
 * Per OpenAI's own gpt-image prompting guide
 * (https://developers.openai.com/cookbook/examples/multimodal/image-gen-1.5-prompting_guide):
 *   • Order: background/scene → subject → key details → constraints
 *   • Anchor style with concrete medium language (watercolor, flat design,
 *     35mm film) NOT generic adjectives ("ultra-detailed", "8K")
 *   • Use camera/composition terms over generic quality cues
 *   • Use explicit "no X" exclusions to suppress unwanted elements
 *   • Avoid stacking conflicting style descriptors (photorealistic + cartoon)
 *
 * IMPORTANT: This module is OpenAI-only. Gemini's pipeline is untouched —
 * Gemini reads the shared DI hint from `lib/config/background-styles.ts` and
 * the shared format-builder guidance from
 * `lib/prompts/services/yi-prompt-builder/format-builders/event-poster.ts`.
 */

import type { BackgroundStyleId } from '@/lib/prompts/services/yi-prompt-builder/types'

/**
 * Per-style gpt-image-1 prompt block. Each entry is structured as:
 *
 *   <ONE-LINE MEDIUM ASSERTION (caps, leading)>
 *   <2-3 lines of concrete material/lighting/composition language>
 *   <"DO NOT" exclusion line — suppresses the conflicting medium>
 *
 * Kept under ~80 words per style so the OpenAI prompt stays inside the
 * recommended 6-10 dense-sentence ceiling for complex generations.
 */
const OPENAI_STYLE_BLOCKS: Partial<Record<BackgroundStyleId, string>> = {
  // 'scene' is the default — no explicit medium override; let Ultra-Pro and
  // Design Intelligence pick. NOT included in this map.

  abstract:
    'STYLE: Abstract gradient art. Render as flowing color washes, soft geometric shapes, and fluid abstract forms in the brand palette. Smooth gradients, organic blobs, no concrete subjects. DO NOT render real people, real venues, or photographic content.',

  dark:
    'STYLE: Dark cinematic atmosphere. Render as a near-black backdrop with dramatic volumetric light rays, glowing halos, and bokeh particles in the brand accent color. Deep shadows, high contrast, moody. People appear as silhouettes if at all. DO NOT use bright daylight scenes or flat illustration.',

  illustrated:
    'STYLE: Flat-design vector illustration. Render as bold solid-color shapes with clean outlines, no gradients, no shadows beyond simple shape-fill drops. Modern editorial illustration aesthetic — think New Yorker or Apple marketing flat-design. Iconic, graphic, clean. DO NOT render photographic content, no realism, no textured 3D.',

  bokeh:
    'STYLE: Soft bokeh and light particles. Render with shallow-focus glowing light orbs, warm sparkle particles, and ambient lens-light halos in the brand palette. Everything dreamy, atmospheric, out-of-focus. Photographic look with f/1.4 aperture feel. DO NOT use sharp graphic illustration or solid flat shapes.',

  geometric:
    'STYLE: Bold geometric pattern. Render as crisp geometric shapes — hexagons, triangles, diagonal bands, tessellation — in the brand palette. Tech-forward, structural, modern. Patterns may be full-bleed or concentrated. DO NOT use organic shapes, photographic content, or watercolor textures.',

  texture:
    'STYLE: Physical material surface. Render as a tactile material — marble veining, woven fabric, paper grain, brushed metal, or wood grain — tinted in the brand palette. Macro-level texture detail, premium analogue feel. DO NOT include people, scenes, or geometric patterns.',

  split:
    'STYLE: Split-canvas layout. Left half is an event-relevant atmospheric photograph or scene; right half is a clean solid brand-color panel where text can sit. Sharp or soft diagonal edge separates the two halves. DO NOT blur the halves together.',

  neon:
    'STYLE: Cyberpunk neon glow. Render with a deep near-black backdrop and vivid electric neon light trails, glowing grid lines, bioluminescent halos, and pulsing light streaks in the brand accent color. Futuristic, electric, high-contrast. DO NOT use natural daylight or photographic realism.',

  duotone:
    'STYLE: Duotone two-color treatment. Render the entire image mapped to exactly TWO brand colors — shadows in primary, highlights in secondary or accent. High-contrast, bold, monochromatic poster feel. Silhouettes and abstract forms only. DO NOT use full-color photography or flat illustration.',

  glassmorphism:
    'STYLE: Glassmorphism. Render as translucent frosted-glass panels (60-80% blur) layered over soft gradient blobs in brand colors, each panel with subtle white-border glow and soft shadow. Clean, modern, depth-of-layers feel. DO NOT use realistic scenes, photography, or solid flat shapes.',

  watercolor:
    'STYLE: Children\'s-book watercolor illustration. Render as soft organic paint washes and flowing pigment spreads in the brand palette, with wet-on-wet bleeds, visible brush strokes, and paper grain underneath. Warm, gentle, painterly. DO NOT use photographic realism, sharp lines, or digital flat design.',

  mandala:
    'STYLE: Indian mandala and traditional motifs. Render as an intricate radial mandala pattern with detailed geometric petal layers, paisley elements, and traditional Indian floral ornaments in the brand palette. Symmetrical, ornate, cultural — gold or accent-color outlines on a darker base. DO NOT use modern flat design or photography.',

  custom:
    'STYLE: Custom AI theme. Render as a vivid full-canvas gradient (palette tuned to event mood) with ONE clean iconic symbol or motif representing the event theme as the focal element. Symbol-centric, NOT a realistic scene, NOT a person — a single object/icon hero against the gradient. DO NOT use photographic crowds or generic stock imagery.',

  'photo-real':
    'STYLE: 35mm DSLR photograph. Shot on a real camera with a 50mm or 85mm lens at f/1.8-f/2.8 — sharp on the subject with a softly defocused background. Real Indian people in a real Indian venue. Warm/cool stage lighting, photojournalistic but premium magazine quality. Subtle film grain, cinema-style color grading. DO NOT render as illustration, vector art, or graphic design.',

  product:
    'STYLE: Studio product photography. ONE event-related symbolic object dominates 60%+ of the frame as the visual hero — examples: graduation cap mid-air, microphone with sound waves, stethoscope on clean surface. Studio key light with subtle rim/fill light, on a clean or dramatically-lit backdrop. Premium catalog/editorial rendering. DO NOT include crowds, venue interiors, or scene-based environments.',
}

/**
 * Returns the OpenAI-tuned STYLE block for a background style id, or `null`
 * for ids that should fall through to default behavior (notably 'scene' and
 * unknown ids).
 *
 * The block is designed to be inserted EARLY in the OpenAI prompt assembly
 * — right after the crop-safe-zone PRIMARY CONSTRAINT — so gpt-image-1's
 * attention locks onto the medium before reading the longer Ultra-Pro scene
 * description.
 */
export function getOpenAIStyleBlock(id: string | undefined | null): string | null {
  if (!id) return null
  return OPENAI_STYLE_BLOCKS[id as BackgroundStyleId] ?? null
}
