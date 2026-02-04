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
  return `
VISUAL LAYOUT REMINDER:

The ${positionList} corners of this poster need clean, simple backgrounds. Keep these corner areas clear of text and detailed graphics.

For proper text placement in this design: The event title starts below the top header area (at least 15% down from the top). The title text is horizontally centered in the middle 50% of the image width, not extending into the corner areas. This spacing creates a professional look.

CRITICAL: Keep corner areas completely empty. Generate ONLY clean backgrounds.
`
}

/**
 * Build spatial composition guidance (v24.6 - Percentage-Only, No Pixel Leakage)
 *
 * v24.6: RESTORED structural approach but with ZERO pixel values in output
 *
 * Key Changes:
 * - Pixel values logged to console ONLY (for backend debugging)
 * - Prompt text uses PERCENTAGE values only (40%, 70%, etc.)
 * - Maintains the effective zone enforcement from old working version
 * - Removes trigger words that Gemini might render
 *
 * @param canvasWidth - Canvas width in pixels (for logging only)
 * @param canvasHeight - Canvas height in pixels (for logging only)
 * @param headerHeight - Header zone height in pixels (for logging only)
 * @param footerHeight - Footer zone height in pixels (for logging only)
 * @param headerPercent - Header zone percentage (used in prompt)
 * @param footerPercent - Footer zone percentage (used in prompt)
 * @param engine - Optional engine type for model-aware constraints (v24.7)
 * @returns Percentage-based spatial constraints (no pixel values for Flash, explicit for Pro)
 */
export function buildPixelPreciseSpatialConstraints(
  canvasWidth: number,
  canvasHeight: number,
  headerHeight: number,
  footerHeight: number,
  headerPercent: number,
  footerPercent: number,
  engine?: 'yi_vision' | 'yi_craft'
): string {
  // v24.7: Pro model (yi_craft) needs STRICTER enforcement with different language
  // Pro ignores percentage-based prose guidance, needs explicit pixel boundaries
  if (engine === 'yi_craft') {
    return buildProModelSpatialConstraints(
      canvasWidth,
      canvasHeight,
      headerHeight,
      footerHeight,
      headerPercent,
      footerPercent
    )
  }

  // v24.10: Flash model (yi_vision) - UNIFIED with Pro model zones
  // Both models now use same 40%-70% content zone for consistency
  const UNIFIED_HEADER_ZONE_PERCENT = 40
  const UNIFIED_FOOTER_ZONE_PERCENT = 70

  const unifiedHeaderHeight = Math.floor(canvasHeight * (UNIFIED_HEADER_ZONE_PERCENT / 100))
  const unifiedFooterStartY = Math.floor(canvasHeight * (UNIFIED_FOOTER_ZONE_PERCENT / 100))

  const contentStartY = unifiedHeaderHeight + 30
  const contentEndY = unifiedFooterStartY - 30
  const contentHeightPx = contentEndY - contentStartY

  const contentStartPercent = UNIFIED_HEADER_ZONE_PERCENT  // 40%
  const contentEndPercent = UNIFIED_FOOTER_ZONE_PERCENT    // 70%
  const contentHeightPercent = contentEndPercent - contentStartPercent  // 30%

  // v24.10: Log pixel values for backend debugging ONLY
  console.log(`[v24.10 Unified Zones - Flash] Content zone 40%-70%:`, {
    canvas: `${canvasWidth}x${canvasHeight}`,
    headerZone: `0-${unifiedHeaderHeight}px (0-${UNIFIED_HEADER_ZONE_PERCENT}%)`,
    contentZone: `${contentStartY}-${contentEndY}px (${contentStartPercent}-${contentEndPercent}%)`,
    footerZone: `${unifiedFooterStartY}-${canvasHeight}px (${UNIFIED_FOOTER_ZONE_PERCENT}-100%)`,
  })

  // v24.14: INVISIBLE GUIDELINES approach with concrete visual analogies
  // Reframed from "three areas" to "single canvas + invisible text positioning rule"
  return `
VISUAL COMPOSITION - SINGLE CANVAS CONCEPT:

Design ONE continuous visual that spans the entire canvas (0% to 100%) without interruption.
Think of it as a single photograph, gradient, or artistic scene - NOT as separate sections.

VISUAL ANALOGIES (concrete examples of "single canvas"):
• A sunset gradient: Deep orange at top → warm yellow in middle → pink at bottom (ONE continuous gradient, no bands)
• A studio photograph: Professional photography backdrop that flows seamlessly from top to bottom
• An oil painting: A single artistic composition painted across the entire canvas
• A skyscape: Blue sky gradually transitioning to horizon (ONE unified scene)
• An atmospheric scene: Misty forest or urban landscape that spans the full frame

Key principle: These examples show backgrounds with NO horizontal dividing lines or section breaks.

AVOID (per Gemini documentation - list unwanted elements):
horizontal lines, section dividers, band separators, stripe patterns, visible zones, segmented backgrounds, border lines between areas, gradient bands that create divisions

INVISIBLE TEXT PLACEMENT RULE:
This is purely a TEXT POSITIONING guideline - NOT a visual division. The background design itself remains continuous.

All text content positions in the vertical center region (${contentStartPercent}% to ${contentEndPercent}% from top).
This is an INVISIBLE rule - imagine placing text stickers on a painting. The painting underneath stays unified.

Example visualization:
• Imagine painting a blue gradient from dark blue (top) to light blue (bottom) across the ENTIRE canvas (0-100%)
• The gradient flows seamlessly without any breaks
• Now place text stickers ONLY in the middle region (${contentStartPercent}-${contentEndPercent}%)
• The blue gradient UNDERNEATH remains ONE continuous flow from 0% to 100%

TEXT-FREE REGIONS (background continues naturally):
• Top ${UNIFIED_HEADER_ZONE_PERCENT}%: Continue the same visual design (no text overlay). Simple, clean background.
• Bottom ${100 - UNIFIED_FOOTER_ZONE_PERCENT}%: Continue the same visual design (no text overlay). Natural fade or ground texture.

TEXT POSITIONING WITHIN ${contentStartPercent}-${contentEndPercent}% REGION:
All text elements position here - headlines, details, speakers, date, time, venue.
Available height: ${contentHeightPercent}% of total canvas.

Text hierarchy:
• Main headline: Position around ${contentStartPercent + 2}% from top
• Supporting text: Distribute between ${contentStartPercent + 5}% and ${contentEndPercent - 5}%
• Keep text horizontally centered (25% to 75% width range)

CONTENT DENSITY HANDLING:
When extensive content (many speakers, details):
• Use tighter line spacing, smaller supporting text sizes
• Prioritize: Event name, date, time, venue (larger). Speaker names, details (smaller).
• ALL text must fit within ${contentStartPercent}-${contentEndPercent}% vertical range
• If still overflowing: Omit lowest-priority details

CRITICAL - SINGLE CANVAS VISUALIZATION:
Imagine you're creating a single piece of art (gradient/sky/atmospheric scene/etc.) that fills the entire canvas from edge to edge.
This art has NO horizontal divisions or band separations - it's ONE unified visual.

Now imagine placing text stickers ONLY in the middle vertical region (${contentStartPercent}-${contentEndPercent}%).
The artwork underneath remains ONE continuous piece from 0% to 100%.
The text stickers are positioned in the middle - they DON'T change the background, which stays unified.

This is the EXACT approach you must take:
1. Design one continuous background visual (like the examples: sunset gradient, studio photo, oil painting, skyscape)
2. Position text in the middle region (invisible guideline)
3. Top and bottom: The SAME background continues seamlessly (no text overlay, but same visual flow)
`
}

/**
 * Build AGGRESSIVE spatial constraints for Pro model (gemini-3-pro-image-preview)
 * v24.10: UNIFIED zones - Both Flash and Pro now use same 40%-70% content zone
 *
 * Key strategy:
 * - Layer 1: Opening warning block (repeated 3x)
 * - Layer 2: Explicit forbidden zones with blocklist
 * - Layer 3: Allowed content zone (positive framing)
 * - Layer 4: Pre-render checklist
 * - Layer 5: Specific word blocklist for header
 *
 * v24.10 UNIFIED Zone Configuration (both models):
 * - Header zone: 0-40% (FORBIDDEN - no text)
 * - Content zone: 40-70% (ALL text must be here)
 * - Footer zone: 70-100% (FORBIDDEN - no text)
 *
 * Pixel values for 1080x1440 canvas:
 * - Header: 0-576px (40%)
 * - Content: 606px-978px (42%-68% with padding)
 * - Footer: 1008px-1440px (70%-100%)
 *
 * Pro model uses more aggressive language/formatting than Flash
 * but both enforce the same zone boundaries.
 */
function buildProModelSpatialConstraints(
  canvasWidth: number,
  canvasHeight: number,
  headerHeight: number,
  footerHeight: number,
  headerPercent: number,
  footerPercent: number
): string {
  // v24.10: UNIFIED zones for both Flash and Pro models
  // Header: 0-40% (FORBIDDEN)
  // Content: 40-70% (ALL text here)
  // Footer: 70-100% (FORBIDDEN)
  const PRO_HEADER_ZONE_PERCENT = 40
  const PRO_FOOTER_ZONE_PERCENT = 70  // v24.10: Content ends at 70%, footer starts at 70%

  const proHeaderHeight = Math.floor(canvasHeight * (PRO_HEADER_ZONE_PERCENT / 100))
  const proFooterStartY = Math.floor(canvasHeight * (PRO_FOOTER_ZONE_PERCENT / 100))

  const contentStartY = proHeaderHeight + 30  // Use Pro header height (40%)
  const contentEndY = proFooterStartY - 30    // Use Pro footer start (70%)

  const contentStartPercent = PRO_HEADER_ZONE_PERCENT  // 40% for Pro
  const contentEndPercent = PRO_FOOTER_ZONE_PERCENT    // 70% for Pro
  const footerStartPercent = PRO_FOOTER_ZONE_PERCENT   // 70% for Pro

  console.log(`[v24.10 Unified Zones - Pro] Content zone 40%-70%:`, {
    canvas: `${canvasWidth}x${canvasHeight}`,
    headerZone: `0-${proHeaderHeight}px (0-${PRO_HEADER_ZONE_PERCENT}%)`,
    contentZone: `${contentStartY}-${contentEndY}px (${contentStartPercent}-${contentEndPercent}%)`,
    footerZone: `${proFooterStartY}-${canvasHeight}px (${footerStartPercent}-100%)`,
  })

  // v24.14: Pro model with INVISIBLE GUIDELINES approach (NO divider lines) + visual analogies
  return `
SEAMLESS FULL-CANVAS DESIGN REQUIREMENT:
Create ONE continuous, flowing background from top to bottom - like a single photograph or painting.

VISUAL ANALOGIES (concrete examples):
• A sunset gradient: Deep orange at top → warm yellow in middle → pink at bottom (ONE continuous gradient, no bands)
• A studio photograph: Professional photography backdrop that flows seamlessly from top to bottom
• An oil painting: A single artistic composition painted across the entire canvas
• A skyscape: Blue sky gradually transitioning to horizon (ONE unified scene)
• An atmospheric scene: Misty forest or urban landscape that spans the full frame

AVOID (per Gemini documentation - list unwanted elements):
horizontal lines, section dividers, band separators, stripe patterns, visible zones, segmented backgrounds, border lines between areas, gradient bands that create divisions

CRITICAL TEXT PLACEMENT RULE (INVISIBLE GUIDELINE):
ALL TEXT MUST BE BETWEEN ${contentStartY}px AND ${contentEndY}px (${contentStartPercent}%-${contentEndPercent}% from top)

Canvas: ${canvasWidth}px × ${canvasHeight}px

TOP REGION (0px - ${proHeaderHeight}px / 0% - ${PRO_HEADER_ZONE_PERCENT}%):
Keep this area clear of text. Design flows naturally from the top edge. No text in this region.
Suitable elements: sky, gradients, clouds, solid colors, atmospheric lighting.
DO NOT place text above ${contentStartY}px.

CONTENT REGION (${contentStartY}px - ${contentEndY}px / ${contentStartPercent}% - ${contentEndPercent}%):
✅ Event title starts at ${contentStartY}px (${contentStartPercent}% from top)
✅ Date/time/venue between ${Math.round(contentStartY + (contentEndY - contentStartY) * 0.2)}px-${Math.round(contentStartY + (contentEndY - contentStartY) * 0.6)}px
✅ Additional details between ${Math.round(contentStartY + (contentEndY - contentStartY) * 0.6)}px-${contentEndY}px
✅ ALL text elements MUST fit within this ${contentEndY - contentStartY}px tall area

CONTENT OVERFLOW HANDLING:
When event has extensive content (speakers, dress code, entry limits, etc.):

PRIORITY 1 - ESSENTIAL (always visible, larger size):
• Event headline/title
• Date, Time, Venue

PRIORITY 2 - SUPPORTING (smaller size, tighter spacing):
• Speaker names and designations
• Dress code, entry limits
• Additional details

FITTING RULES:
• COMPRESS text with tighter spacing to fit in ${contentEndY - contentStartY}px area
• Use SMALLER fonts for supporting details when content is extensive
• NEVER expand into top region (0-${proHeaderHeight}px) or bottom region (${proFooterStartY}-${canvasHeight}px)
• If content STILL doesn't fit: Omit lowest-priority details

BOTTOM REGION (${proFooterStartY}px - ${canvasHeight}px / ${footerStartPercent}% - 100%):
Keep this area clear of text. Continue the background naturally - seamless flow from content area.
Suitable elements: ground textures, gradients, subtle fade.
DO NOT place text below ${contentEndY}px.

PRE-RENDER VERIFICATION:
Before generating, verify EVERY text element fits within ${contentStartY}-${contentEndY}px range.
Top and bottom regions must be TEXT-FREE for overlay compatibility.

WORD BLOCKLIST FOR TOP REGION:
These words belong in content region, NOT in top region: "Infographic", "Info", "Overview", "About", "Summary", descriptive labels.

CRITICAL - SINGLE CANVAS VISUALIZATION:
Imagine you're creating a single piece of art (gradient/sky/atmospheric scene/etc.) that fills the entire canvas from edge to edge.
This art has NO horizontal divisions or band separations - it's ONE unified visual.

Now imagine placing text stickers ONLY in the middle vertical region (${contentStartY}-${contentEndY}px).
The artwork underneath remains ONE continuous piece from 0px to ${canvasHeight}px.
The text stickers are positioned in the middle - they DON'T change the background, which stays unified.

This is the EXACT approach you must take:
1. Design one continuous background visual (like the examples: sunset gradient, studio photo, oil painting, skyscape)
2. Position text in the middle region (invisible guideline)
3. Top and bottom: The SAME background continues seamlessly (no text overlay, but same visual flow)
`
}
