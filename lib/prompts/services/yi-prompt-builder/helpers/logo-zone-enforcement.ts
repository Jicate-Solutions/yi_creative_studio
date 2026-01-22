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
 * - Prompt text uses PERCENTAGE values only (38%, 80%, etc.)
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

  // v24.6: Flash model (yi_vision) - keep existing working implementation unchanged
  // Calculate all pixel values for LOGGING ONLY - not sent to Gemini
  const colWidth = Math.floor(canvasWidth / 6)
  const footerStartY = canvasHeight - footerHeight
  const contentStartY = headerHeight + 30
  const contentEndY = footerStartY - 30
  const contentHeightPx = contentEndY - contentStartY

  // Calculate percentage equivalents
  const contentStartPercent = Math.round((contentStartY / canvasHeight) * 100)
  const contentEndPercent = Math.round((contentEndY / canvasHeight) * 100)
  const footerStartPercent = Math.round((footerStartY / canvasHeight) * 100)
  const contentHeightPercent = Math.round((contentHeightPx / canvasHeight) * 100)

  // v24.6: Log pixel values for backend debugging ONLY
  console.log(`[v24.6 Spatial Guidance] Backend reference (NOT in prompt):`, {
    canvas: `${canvasWidth}x${canvasHeight}`,
    headerZone: `0-${headerHeight}px (0-${headerPercent}%)`,
    contentZone: `${contentStartY}-${contentEndY}px (${contentStartPercent}-${contentEndPercent}%)`,
    footerZone: `${footerStartY}-${canvasHeight}px (${footerStartPercent}-100%)`,
    columnWidth: `${colWidth}px`
  })

  // v24.6: Return PERCENTAGE-ONLY constraints - no pixel values leak to Gemini
  return `
COMPOSITION LAYOUT GUIDE:

The image uses a three-band vertical structure for professional poster layout.

UPPER BAND (0% to ${headerPercent}% from top):
Keep this area clean with simple background only. Solid colors, subtle gradients, or soft atmospheric lighting work best. This space accommodates branding elements added in post-processing.

CENTER BAND (${contentStartPercent}% to ${contentEndPercent}% from top):
All text content belongs here - the main title, event details, date, time, and venue information. This is the primary content area with ${contentHeightPercent}% of the total height available for text.

Text hierarchy within center band:
• Main headline: Position around ${contentStartPercent + 2}% from top
• Supporting text: Distribute between ${contentStartPercent + 5}% and ${contentEndPercent - 5}%
• Keep text horizontally centered (25% to 75% width range)

LOWER BAND (${footerStartPercent}% to 100% from top):
Reserve this area for footer elements. Keep it clean with simple background continuation - ground texture, subtle gradient, or gentle fade. No text in this zone.

SEAMLESS TRANSITIONS:
The background flows naturally from top to bottom without visible horizontal bands or stripes. Colors and textures transition smoothly across all three areas while maintaining the clean spaces needed for branding.

Remember: Text stays within the ${contentStartPercent}%-${contentEndPercent}% vertical range. Upper and lower areas remain text-free for overlay compatibility.
`
}

/**
 * Build AGGRESSIVE spatial constraints for Pro model (gemini-3-pro-image-preview)
 * v24.9.1: Expanded safe zones for both header AND footer
 *
 * Key strategy:
 * - Layer 1: Opening warning block (repeated 3x)
 * - Layer 2: Explicit forbidden zones with blocklist
 * - Layer 3: Allowed content zone (positive framing)
 * - Layer 4: Pre-render checklist
 * - Layer 5: Specific word blocklist for header
 *
 * v24.9.1 Zone Changes (Pro model only):
 * - Header zone: 0-40% (was 0-38%) - extra 2% buffer at top
 * - Footer zone: 70-100% (was 82-100%) - extra 12% buffer at bottom
 * - Content zone: 40-70% (was 38-80%) - 30% available for text
 *
 * Pixel values for 1080x1440 canvas:
 * - Header: 0-576px (40%)
 * - Content: 606px-978px (42%-68% with padding)
 * - Footer: 1008px-1440px (70%-100%)
 *
 * Flash model unchanged at 38%-80% (working correctly)
 *
 * Why this is needed:
 * - Pro model ignores zone guidance, puts text in header AND footer
 * - Larger forbidden zones give more buffer for AI imprecision
 */
function buildProModelSpatialConstraints(
  canvasWidth: number,
  canvasHeight: number,
  headerHeight: number,
  footerHeight: number,
  headerPercent: number,
  footerPercent: number
): string {
  // v24.9.1: Pro model uses expanded safe zones
  // Header: 40% (was 38%) - extra 2% buffer at top
  // Footer: 70% (was 82%) - extra 12% buffer at bottom
  // Content zone: 40%-70% (was 38%-80%)
  const PRO_HEADER_ZONE_PERCENT = 40
  const PRO_FOOTER_ZONE_PERCENT = 70  // v24.9.1: Content ends at 70%, footer starts at 70%

  const proHeaderHeight = Math.floor(canvasHeight * (PRO_HEADER_ZONE_PERCENT / 100))
  const proFooterStartY = Math.floor(canvasHeight * (PRO_FOOTER_ZONE_PERCENT / 100))

  const contentStartY = proHeaderHeight + 30  // Use Pro header height (40%)
  const contentEndY = proFooterStartY - 30    // Use Pro footer start (70%)

  const contentStartPercent = PRO_HEADER_ZONE_PERCENT  // 40% for Pro
  const contentEndPercent = PRO_FOOTER_ZONE_PERCENT    // 70% for Pro
  const footerStartPercent = PRO_FOOTER_ZONE_PERCENT   // 70% for Pro

  console.log(`[v24.9.1 Pro Zone Enforcement] Content zone 40%-70%:`, {
    canvas: `${canvasWidth}x${canvasHeight}`,
    headerZone: `0-${proHeaderHeight}px (0-${PRO_HEADER_ZONE_PERCENT}%)`,
    contentZone: `${contentStartY}-${contentEndY}px (${contentStartPercent}-${contentEndPercent}%)`,
    footerZone: `${proFooterStartY}-${canvasHeight}px (${footerStartPercent}-100%)`,
  })

  return `
⚠️⚠️⚠️ CRITICAL TEXT PLACEMENT RULE - READ FIRST ⚠️⚠️⚠️
ALL TEXT MUST BE BETWEEN ${contentStartY}px AND ${contentEndY}px (${contentStartPercent}%-${contentEndPercent}% from top)
ALL TEXT MUST BE BETWEEN ${contentStartY}px AND ${contentEndY}px (${contentStartPercent}%-${contentEndPercent}% from top)
ALL TEXT MUST BE BETWEEN ${contentStartY}px AND ${contentEndY}px (${contentStartPercent}%-${contentEndPercent}% from top)

Canvas: ${canvasWidth}px × ${canvasHeight}px

════════════════════════════════════════════════════════════════════════
FORBIDDEN HEADER ZONE (0px - ${proHeaderHeight}px / 0% - ${PRO_HEADER_ZONE_PERCENT}%)
════════════════════════════════════════════════════════════════════════
❌ NO event titles in header
❌ NO "Infographic" or "Info" text in header
❌ NO "Overview" or "About" labels in header
❌ NO captions or descriptions in header
❌ NO text of ANY kind in header
✅ ONLY simple backgrounds: sky, gradients, clouds, solid colors

DO NOT place text above ${contentStartY}px.
DO NOT place text above ${contentStartY}px.
DO NOT place text above ${contentStartY}px.

════════════════════════════════════════════════════════════════════════
ALLOWED CONTENT ZONE (${contentStartY}px - ${contentEndY}px / ${contentStartPercent}% - ${contentEndPercent}%)
════════════════════════════════════════════════════════════════════════
✅ Event title starts at ${contentStartY}px (${contentStartPercent}% from top)
✅ Date/time/venue between ${Math.round(contentStartY + (contentEndY - contentStartY) * 0.2)}px-${Math.round(contentStartY + (contentEndY - contentStartY) * 0.6)}px
✅ Additional details between ${Math.round(contentStartY + (contentEndY - contentStartY) * 0.6)}px-${contentEndY}px
✅ ALL text elements MUST fit within this ${contentEndY - contentStartY}px tall zone

════════════════════════════════════════════════════════════════════════
FORBIDDEN FOOTER ZONE (${proFooterStartY}px - ${canvasHeight}px / ${footerStartPercent}% - 100%)
════════════════════════════════════════════════════════════════════════
❌ NO event details in footer
❌ NO venue information in footer
❌ NO dress code or additional info in footer
❌ NO text of ANY kind in footer
✅ ONLY simple backgrounds: ground textures, gradients, subtle fade

DO NOT place text below ${contentEndY}px.
DO NOT place text below ${contentEndY}px.
DO NOT place text below ${contentEndY}px.

════════════════════════════════════════════════════════════════════════
PRE-RENDER VERIFICATION CHECKLIST
════════════════════════════════════════════════════════════════════════
Before generating, verify EVERY text element:
□ Is the TOP edge of event title BELOW ${contentStartY}px? (REQUIRED: YES)
□ Is ALL text ABOVE ${contentEndY}px? (REQUIRED: YES)
□ Is header zone (0-${proHeaderHeight}px) completely text-free? (REQUIRED: YES)
□ Is footer zone (${proFooterStartY}-${canvasHeight}px) completely text-free? (REQUIRED: YES)

IF ANY CHECK FAILS → MOVE TEXT INTO ${contentStartY}-${contentEndY}px RANGE

════════════════════════════════════════════════════════════════════════
WORD BLOCKLIST FOR HEADER ZONE
════════════════════════════════════════════════════════════════════════
NEVER render these words above ${contentStartY}px:
- "Infographic"
- "Info"
- "Overview"
- "About"
- "Summary"
- Any descriptive labels

These words belong INSIDE the content zone (${contentStartY}-${contentEndY}px), NOT in header.

FINAL REMINDER: Text zone is ${contentStartPercent}%-${contentEndPercent}%. Header (0-${PRO_HEADER_ZONE_PERCENT}%) and footer (${footerStartPercent}%-100%) must be TEXT-FREE.
`
}
