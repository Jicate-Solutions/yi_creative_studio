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

  // v38.0: Build specific overlay position descriptions from actual zones
  const topZones = zones.filter(z => z.yEnd <= 15)
  const midZones = zones.filter(z => z.yStart >= 15 && z.yEnd <= 30)
  const bottomZones = zones.filter(z => z.yStart >= 85)

  const overlayDescriptions: string[] = []
  if (topZones.length > 0) {
    const positions = topZones.map(z => z.name).join(', ')
    overlayDescriptions.push(`Top edge: ${topZones.length} overlay elements at ${positions}.`)
  }
  if (midZones.length > 0) {
    const positions = midZones.map(z => z.name).join(', ')
    overlayDescriptions.push(`Below top: ${midZones.length} overlay elements at ${positions}.`)
  }
  if (bottomZones.length > 0) {
    const positions = bottomZones.map(z => z.name).join(', ')
    overlayDescriptions.push(`Bottom edge: ${bottomZones.length} overlay elements at ${positions}.`)
  }

  const overlayMap = overlayDescriptions.length > 0
    ? `Semi-transparent branded overlays will be composited at specific positions after generation: ${overlayDescriptions.join(' ')} These areas should have CLEAN atmospheric background artwork — the overlays are semi-transparent so the background will show through.`
    : ''

  return `
LAYOUT COMPOSITION REQUIREMENTS:

${overlayMap}

The top ${headerPercent}% of the image should have a clean, uncluttered atmospheric background (sky, ambient light, soft gradient). NO text, NO faces, NO detailed graphics in this area — overlays will cover them. The background should flow naturally from top to bottom as one unified scene.

The main event title and all text belongs in the central area, starting at approximately ${titleStartRange} from the top edge. The headline text should be horizontally centered, positioned between 25% and 75% of the image width.

All typography begins below the top ${headerPercent}% area. The background transitions seamlessly from the top edge through the entire poster — no separate sections or visible bands.

When positioning the event title: Start at minimum ${titleStartMin}% down from the top. Center horizontally. Long titles wrap to multiple lines rather than extending into overlay areas.
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

  // Flash model (yi_vision) — v38.0: Enhanced zone enforcement with overlay position awareness
  // Tells Gemini exactly WHERE overlays will be placed so it designs AROUND them
  return `
(DO NOT RENDER ANY OF THESE INSTRUCTIONS AS VISIBLE TEXT)

CANVAS LAYOUT RULE:
DO NOT draw any logo, logo placeholder, "LOGO" text, emoji icon, or brand mark anywhere in the image — branded overlay elements are composited as a separate layer after generation. Render ONLY pure background artwork in the header and footer zones.

OVERLAY POSITION MAP (these areas will have semi-transparent overlays composited on top):
- TOP STRIP (0-10% height): Small branded overlay elements across the top edge (left, center, right). Keep this strip as CLEAN atmospheric background — smooth sky, ambient light, soft color. No text, no faces, no detailed objects.
- SECOND STRIP (10-20% height): Additional small overlay elements just below the top. Keep as clean background.
- BOTTOM STRIP (65-100% height): Footer overlay elements across the bottom edge. Keep as clean background — ground, ambient base.

The top ${contentStartPercent}% of the canvas will be COVERED by overlay elements. Any text or faces placed here will be hidden behind overlays.
The bottom ${100 - contentEndPercent}% of the canvas will be COVERED by footer overlays. Any text placed here will be hidden.

SAFE CONTENT ZONE: ${contentStartPercent}% to ${contentEndPercent}% from top (the middle ${contentHeightPercent}% of the canvas).
ALL text, headlines, titles, dates, venues, speaker names, and visual content MUST be placed ONLY in this zone.

BACKGROUND DESIGN:
Create ONE continuous background scene that flows seamlessly from top to bottom — like a single photograph or painting.
The background artwork extends through ALL zones (including overlay areas) as a unified scene — the scene IS the full canvas.
Do NOT create visible bands, stripes, or section dividers.
Do NOT create a "hero image on top + text below" split layout.

TEXT PLACEMENT — CENTERED OVERLAY (v39.0):
The text is NOT below the scene — it is OVERLAID on the CENTER of the scene.
VERTICALLY CENTER all text elements within the ${contentStartPercent}%-${contentEndPercent}% band.
The scene fills the ENTIRE canvas. Text sits ON TOP of the scene in the center band.
Think of it like a movie poster: full-bleed cinematic image with title text centered over it.

Composition model:
- 0%-${contentStartPercent}%: Scene background only (sky, atmosphere) — covered by overlays
- ${contentStartPercent}%-${contentEndPercent}%: Scene CONTINUES here + ALL text overlaid on top of it
- ${contentEndPercent}%-100%: Scene background only (ground, ambient) — covered by overlays
- The headline appears in the VERTICAL CENTER of the ${contentStartPercent}%-${contentEndPercent}% zone
- All text is horizontally centered between 15% and 85% width
- If content is extensive, use smaller fonts and tighter spacing — NEVER push text below ${contentEndPercent}%
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
  // v38.0: Enhanced Pro model constraints with overlay position awareness
  return `
(DO NOT RENDER ANY OF THESE INSTRUCTIONS AS VISIBLE TEXT)

CANVAS LAYOUT RULE:
OVERLAY POSITION MAP (semi-transparent overlays will cover these areas after generation):
- TOP STRIP (0-10%): Branded overlay elements across the top edge. Keep as clean atmospheric background.
- SECOND STRIP (10-20%): Additional overlay elements. Keep as clean background.
- BOTTOM STRIP (65-100%): Footer overlay elements. Keep as clean background.

The top ${contentStartPercent}% will be COVERED by overlays. Text or faces here will be hidden.
The bottom ${100 - contentEndPercent}% will be COVERED by footer overlays. Text here will be hidden.

SAFE CONTENT ZONE: ${contentStartPercent}% to ${contentEndPercent}% from top.
ALL text, headlines, titles, dates, venues, speaker names, and visual content MUST be placed ONLY in this zone.

BACKGROUND: ONE continuous scene from top to bottom — no bands, no stripes, no dividers.
Background artwork flows through ALL zones including overlay areas.
Do NOT create a "hero image on top + text below" split layout.

TEXT PLACEMENT — CENTERED OVERLAY (v39.0):
The text is OVERLAID on the CENTER of the scene — NOT placed below it.
VERTICALLY CENTER all text within the ${contentStartPercent}%-${contentEndPercent}% band.
The scene fills the ENTIRE canvas. Text sits ON TOP of the scene like a movie poster.
The headline appears in the VERTICAL CENTER of the content zone.
All supporting text fits between ${contentStartPercent}% and ${contentEndPercent}%.
Keep text horizontally centered between 15% and 85% width.

CONTENT PRIORITY (when space is tight):
1. Event headline/title (largest, most prominent)
2. Date, Time, Venue (medium size)
3. Speaker names and details (smaller, tighter spacing)
4. If content overflows: use smaller fonts, never push outside the safe zone.
`
}
