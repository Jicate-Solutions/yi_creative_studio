/**
 * Logo Zone Enforcement Helper v4.0
 * Generates forbidden zone instructions for AI image generation
 * Prevents text/content overlap with logo placement areas
 *
 * v3.6: Changed from XML tags to NARRATIVE PROSE to survive prompt sanitization
 * v4.0: Added PIXEL-PRECISE GRID POSITIONING for Layer 1 overlap prevention
 * The sanitizer strips XML tags, so we use plain text that Gemini will understand
 */

import type { LogoAwarenessContext } from '../types'

// Position to zone mapping (percentage-based)
// Updated for 6×3 grid (18 positions) - Yi Brand Guidelines 2025
// Each column is ~16.67% width, rows are: header (0-15%), second (15-30%), footer (85-100%)
const POSITION_TO_ZONE: Record<string, { xStart: number; xEnd: number; yStart: number; yEnd: number; name: string }> = {
  // ===== NEW 6×3 GRID POSITIONS =====
  // Header row (top) - 6 positions
  'top-1': { xStart: 0, xEnd: 17, yStart: 0, yEnd: 15, name: 'top-left corner' },
  'top-2': { xStart: 17, xEnd: 33, yStart: 0, yEnd: 15, name: 'top position 2' },
  'top-3': { xStart: 33, xEnd: 50, yStart: 0, yEnd: 15, name: 'top-center-left' },
  'top-4': { xStart: 50, xEnd: 67, yStart: 0, yEnd: 15, name: 'top-center-right' },
  'top-5': { xStart: 67, xEnd: 83, yStart: 0, yEnd: 15, name: 'top position 5' },
  'top-6': { xStart: 83, xEnd: 100, yStart: 0, yEnd: 15, name: 'top-right corner' },

  // Second row (mid) - 6 positions (just below header)
  'mid-1': { xStart: 0, xEnd: 17, yStart: 15, yEnd: 30, name: 'mid-left' },
  'mid-2': { xStart: 17, xEnd: 33, yStart: 15, yEnd: 30, name: 'mid position 2' },
  'mid-3': { xStart: 33, xEnd: 50, yStart: 15, yEnd: 30, name: 'mid-center-left' },
  'mid-4': { xStart: 50, xEnd: 67, yStart: 15, yEnd: 30, name: 'mid-center-right' },
  'mid-5': { xStart: 67, xEnd: 83, yStart: 15, yEnd: 30, name: 'mid position 5' },
  'mid-6': { xStart: 83, xEnd: 100, yStart: 15, yEnd: 30, name: 'mid-right' },

  // Footer row (bottom) - 6 positions
  'bottom-1': { xStart: 0, xEnd: 17, yStart: 85, yEnd: 100, name: 'bottom-left corner' },
  'bottom-2': { xStart: 17, xEnd: 33, yStart: 85, yEnd: 100, name: 'bottom position 2' },
  'bottom-3': { xStart: 33, xEnd: 50, yStart: 85, yEnd: 100, name: 'bottom-center-left' },
  'bottom-4': { xStart: 50, xEnd: 67, yStart: 85, yEnd: 100, name: 'bottom-center-right' },
  'bottom-5': { xStart: 67, xEnd: 83, yStart: 85, yEnd: 100, name: 'bottom position 5' },
  'bottom-6': { xStart: 83, xEnd: 100, yStart: 85, yEnd: 100, name: 'bottom-right corner' },

  // ===== LEGACY POSITIONS (backward compatibility) =====
  'top-left': { xStart: 0, xEnd: 17, yStart: 0, yEnd: 15, name: 'top-left corner' },
  'top-center': { xStart: 33, xEnd: 67, yStart: 0, yEnd: 15, name: 'top-center' },
  'top-right': { xStart: 83, xEnd: 100, yStart: 0, yEnd: 15, name: 'top-right corner' },
  'mid-left': { xStart: 0, xEnd: 17, yStart: 15, yEnd: 30, name: 'mid-left' },
  'center': { xStart: 33, xEnd: 67, yStart: 15, yEnd: 30, name: 'center' },
  'mid-right': { xStart: 83, xEnd: 100, yStart: 15, yEnd: 30, name: 'mid-right' },
  'middle-left': { xStart: 0, xEnd: 17, yStart: 15, yEnd: 30, name: 'middle-left' },
  'middle-center': { xStart: 33, xEnd: 67, yStart: 15, yEnd: 30, name: 'center' },
  'middle-right': { xStart: 83, xEnd: 100, yStart: 15, yEnd: 30, name: 'middle-right' },
  'bottom-left': { xStart: 0, xEnd: 17, yStart: 85, yEnd: 100, name: 'bottom-left corner' },
  'bottom-center': { xStart: 33, xEnd: 67, yStart: 85, yEnd: 100, name: 'bottom-center' },
  'bottom-right': { xStart: 83, xEnd: 100, yStart: 85, yEnd: 100, name: 'bottom-right corner' },
}

/**
 * Build forbidden zones section for AI prompt
 * v3.6: Uses NARRATIVE PROSE instead of XML tags to survive sanitization
 * v6.0: Enhanced with dual-stripe awareness for two-row logo layouts
 */
export function buildForbiddenZonesSection(logoAwareness?: LogoAwarenessContext, dualStripeMode?: boolean): string {
  if (!logoAwareness?.hasLogo) return ''

  // v6.0: Dual-stripe mode adjusts percentages for two-row logo layout
  const headerPercent = dualStripeMode ? 18 : 15
  const titleStartMin = dualStripeMode ? 20 : 15
  const titleStartRange = dualStripeMode ? '20-22%' : '15-20%'

  const zones: Array<{ name: string; xStart: number; xEnd: number; yStart: number; yEnd: number }> = []

  // Get zone for primary logo position
  if (logoAwareness.logoPosition) {
    const zone = POSITION_TO_ZONE[logoAwareness.logoPosition]
    if (zone) {
      zones.push(zone)
    }
  }

  // Get zones for active logos if available
  if (logoAwareness.logos && logoAwareness.logos.length > 0) {
    for (const logo of logoAwareness.logos) {
      if (logo.position) {
        const zone = POSITION_TO_ZONE[logo.position]
        if (zone && !zones.find(z => z.name === zone.name)) {
          zones.push(zone)
        }
      }
    }
  }

  if (zones.length === 0) return ''

  // Build narrative description of reserved zones
  const zoneNarratives = zones.map(z =>
    `The ${z.name} area (from ${z.xStart}% to ${z.xEnd}% horizontally, and from ${z.yStart}% to ${z.yEnd}% vertically) is reserved for branding elements.`
  ).join(' ')

  // v3.7: CRITICAL - Use descriptive language that AI will NOT render as visible text
  // AVOID phrases like "logo overlays", "reserved for", "zone" - Gemini renders these literally
  return `
LAYOUT COMPOSITION REQUIREMENTS:

The top ${headerPercent}% of the image should have a clean, uncluttered background (solid color, subtle gradient, or simple texture). Keep this area simple and clear - NO text, NO faces, NO detailed graphics in the upper ${headerPercent}%. The background should flow naturally from top to bottom without creating visible stripes or bands. ${zoneNarratives}

The main event title and headline text belongs in the central area, starting at approximately ${titleStartRange} from the top edge. Keep all important text out of the upper ${headerPercent}% area. The headline text should be horizontally centered, positioned between 25% and 75% of the image width, leaving the corner areas completely clear.

All typography, including the event name, tagline, and any other text elements, begins below the top ${headerPercent}% area. The background should transition seamlessly from the top edge through the entire poster without creating separate sections or visible bands.

When positioning the event title: Start the title text block at minimum ${titleStartMin}% down from the top edge. Center the title horizontally, keeping it away from the leftmost 25% and rightmost 25% of the image width. Long titles should wrap to multiple lines rather than extending into corner areas.

IMPORTANT: Keep the upper region completely empty. Generate ONLY the clean background.
`
}

/**
 * Build zone reminder section for end of prompt
 * v3.6: Uses NARRATIVE PROSE instead of XML tags to survive sanitization
 */
export function buildZoneReminderSection(logoAwareness?: LogoAwarenessContext): string {
  if (!logoAwareness?.hasLogo) return ''

  const positions: string[] = []

  if (logoAwareness.logoPosition) {
    positions.push(logoAwareness.logoPosition)
  }

  if (logoAwareness.logos && logoAwareness.logos.length > 0) {
    for (const logo of logoAwareness.logos) {
      if (logo.position && !positions.includes(logo.position)) {
        positions.push(logo.position)
      }
    }
  }

  if (positions.length === 0) return ''

  const positionList = positions.map(p => p.replace('-', ' ')).join(' and ')

  // v3.7: Use descriptive language that AI will NOT render as visible text
  // AVOID: "reserved for logos", "logo overlay", "brand logos" - Gemini renders these literally
  // v35.5: Added full-canvas anti-card rules + corrected zone percentages (was wrong "15%")
  // v33.2: Wrapped in <instruction> tags + removed raw percentage numbers (Gemini was rendering them as visible text)
  return `
<instruction>(DO NOT RENDER — layout rules for the AI only)
VISUAL LAYOUT REMINDER:

FULL CANVAS COMPOSITION: The visual scene IS the full-canvas background painting that spans ALL FOUR canvas edges (top to bottom, full width). It is NOT a photo card, bordered box, or rounded rectangle sitting on a solid-color background.
ANTI-CARD RULE: NEVER place the scene inside a rounded rectangle, photo card, image frame, or any contained box. NEVER use a solid-color section at the top + a scene card below it.
NEVER create a split layout: plain colored header area at the top + scene card in the lower portion.
The scene artwork BLEEDS to all four canvas edges. The upper portion = TOP of scene (sky, ceiling, atmospheric light). The lower portion = BOTTOM of scene (floor, ambient base).
Forbidden zones means forbidden for TEXT only — background artwork MUST flow through ALL zones continuously.

TEXT PLACEMENT: All text, headlines, event names, dates, and details MUST be placed in the CENTER BAND of the canvas. The upper area is reserved for clean atmospheric background — NO text there. The lower area is reserved for footer — NO text there.

CORNER AREAS: Keep ${positionList} corners clear of text and detailed graphics. Generate ONLY clean backgrounds in these corner regions.
</instruction>
`
}

/**
 * Build spatial composition guidance (v25.3 - Conservative Header + Real Footer)
 *
 * v25.3: CONSERVATIVE HEADER BOUNDARY fixes v25.2 conflict (spatial constraints said 26%,
 * layout_composition_rules said 40% → Gemini chose the lower/less-safe 26%)
 *
 * Header strategy (v25.3): contentStartY = MAX(realSharpHeader+30, headerPercent×canvasHeight)
 * → Takes the LARGER boundary for the header — always >= the percentage-based value (40%)
 * → Keeps 226px buffer above real logo rows (not just 30px) — absorbs Gemini imprecision
 * → Consistent with layout_composition_rules "40%" — no mixed signals
 *
 * Footer strategy (v25.2): contentEndPx = real Sharp footer position - 30px buffer
 * → Uses actual Sharp footer height (gives Gemini ~27% more vertical space vs old hardcoded 70%)
 *
 * @param canvasWidth - Canvas width in pixels
 * @param canvasHeight - Canvas height in pixels
 * @param headerHeight - ACTUAL Sharp header height in pixels (used in MAX comparison)
 * @param footerHeight - ACTUAL Sharp footer height in pixels (used for real footer boundary)
 * @param headerPercent - Conservative header percentage (e.g., 40) — sets minimum content start
 * @param footerPercent - Footer zone percentage (kept for reference)
 * @param engine - Optional engine type for model-aware constraints
 * @param contentEndPx - Explicit pixel where content MUST end (canvasHeight - footerHeight - 30px buffer)
 * @returns Pixel-precise spatial constraints: conservative header + real footer boundaries
 */
export function buildPixelPreciseSpatialConstraints(
  canvasWidth: number,
  canvasHeight: number,
  headerHeight: number,
  footerHeight: number,
  headerPercent: number,
  footerPercent: number,
  engine?: 'yi_vision' | 'yi_craft',
  contentEndPx?: number
): string {
  // v33.4: STRICT zone enforcement — use passed headerPercent/contentEndPx directly
  // User requires fixed 40% header, 70% footer. Do NOT override with conservative MAX.
  const percentBasedStartY = Math.floor(canvasHeight * (headerPercent / 100))  // e.g., 576px (40%)
  const contentStartY = percentBasedStartY  // Strict: use exact passed percentage

  const computedContentEndY = canvasHeight - footerHeight - 30  // Real Sharp footer + buffer
  const resolvedContentEndPx = contentEndPx ?? computedContentEndY
  const availablePx = resolvedContentEndPx - contentStartY

  const contentStartPercent = Math.round((contentStartY / canvasHeight) * 100)
  const contentEndPercent = Math.round((resolvedContentEndPx / canvasHeight) * 100)
  const contentHeightPercent = contentEndPercent - contentStartPercent

  // v33.4: Log strict boundary
  console.log(`[buildPixelPreciseSpatialConstraints] v33.4 Strict Zone Boundary:`, {
    engine: engine ?? 'default',
    canvas: `${canvasWidth}x${canvasHeight}`,
    headerHeight: `${headerHeight}px (actual Sharp)`,
    footerHeight: `${footerHeight}px (actual Sharp)`,
    percentBasedStartY: `${percentBasedStartY}px (${headerPercent}%) — strict`,
    contentStartY: `${contentStartY}px`,
    contentEndPx: `${resolvedContentEndPx}px (${contentEndPercent}%) — real Sharp footer`,
    availablePx: `${availablePx}px available for content`,
  })

  if (engine === 'yi_craft') {
    return buildProModelSpatialConstraints(
      canvasWidth,
      canvasHeight,
      contentStartY,
      resolvedContentEndPx,
      availablePx,
      contentStartPercent,
      contentEndPercent
    )
  }

  // Flash model (yi_vision) — v32.0: Simplified zone enforcement without verbose pixel values
  // Uses percentage-based language that Gemini follows more reliably
  return `
(DO NOT RENDER ANY OF THESE INSTRUCTIONS AS VISIBLE TEXT)

CANVAS LAYOUT RULE:
DO NOT draw any logo, logo placeholder, "LOGO" text, emoji icon, or brand mark anywhere in the image — logos are composited programmatically as a separate overlay after generation. Render ONLY pure background artwork in the header and footer zones.
The top ${contentStartPercent}% of the canvas is reserved for logo overlays. Content placed here will be hidden.
The bottom ${100 - contentEndPercent}% of the canvas is reserved for logo overlays. Content placed here will be hidden.

ALL text, headlines, titles, dates, venues, speaker names, and visual content MUST be placed in the middle ${contentHeightPercent}% of the canvas (between ${contentStartPercent}% and ${contentEndPercent}% from the top).

The top ${contentStartPercent}% and bottom ${100 - contentEndPercent}% should contain ONLY smooth background artwork — no text, no labels, no icons.

BACKGROUND DESIGN:
Create ONE continuous background that flows seamlessly from top to bottom — like a single photograph or painting.
Do NOT create visible bands, stripes, or section dividers. The background is ONE unified scene.

TEXT PLACEMENT:
Place the event headline starting just below the ${contentStartPercent}% mark.
All supporting text (date, time, venue, speakers) fits between ${contentStartPercent}% and ${contentEndPercent}%.
Keep text horizontally centered between 25% and 75% width.
If content is extensive, use smaller fonts and tighter spacing — never push text outside the safe zone.
`
}

/**
 * Build AGGRESSIVE spatial constraints for Pro model (gemini-3-pro-image-preview)
 * v25.2: Now uses ACTUAL Sharp pixel values passed from buildPixelPreciseSpatialConstraints
 *
 * Key strategy:
 * - Layer 1: ABSOLUTE CANVAS BOUNDARY block with "WILL NOT APPEAR" language
 * - Layer 2: Single-canvas visualization to prevent visible zone bands
 * - Layer 3: Content region with pixel-precise boundaries
 * - Layer 4: Content overflow handling with priority rules
 * - Layer 5: Pre-render verification checklist
 *
 * v25.2 Change: Receives pre-computed contentStartY/contentEndY/availablePx
 * instead of re-computing from hardcoded 40%/70% percentages.
 */
function buildProModelSpatialConstraints(
  canvasWidth: number,
  canvasHeight: number,
  contentStartY: number,
  contentEndY: number,
  availablePx: number,
  contentStartPercent: number,
  contentEndPercent: number
): string {
  // v32.0: Simplified Pro model constraints — percentage-based, no verbose pixel values
  return `
(DO NOT RENDER ANY OF THESE INSTRUCTIONS AS VISIBLE TEXT)

CANVAS LAYOUT RULE:
The top ${contentStartPercent}% of the canvas is reserved for logo overlays. Content placed here will be hidden.
The bottom ${100 - contentEndPercent}% of the canvas is reserved for logo overlays. Content placed here will be hidden.

ALL text, headlines, titles, dates, venues, speaker names, and visual content MUST be placed between ${contentStartPercent}% and ${contentEndPercent}% from the top.

The top and bottom reserved areas should contain ONLY smooth background artwork — no text, no labels, no icons, no UI elements.

BACKGROUND DESIGN:
Create ONE continuous background that flows seamlessly from top to bottom — like a single photograph or painting.
Do NOT create visible bands, stripes, or section dividers. The background is ONE unified scene.

TEXT PLACEMENT:
Place the event headline starting just below the ${contentStartPercent}% mark.
All supporting text (date, time, venue, speakers) fits between ${contentStartPercent}% and ${contentEndPercent}%.
Keep text horizontally centered between 25% and 75% width.

CONTENT PRIORITY (when space is tight):
1. Event headline/title (largest, most prominent)
2. Date, Time, Venue (medium size)
3. Speaker names and details (smaller, tighter spacing)
4. If content overflows: use smaller fonts, never push outside the safe zone.
`
}
