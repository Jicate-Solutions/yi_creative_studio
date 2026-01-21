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
 * Build pixel-precise grid position constraints (v4.0 - Layer 1 Overlap Prevention)
 *
 * Generates explicit pixel coordinates for the 18-position grid system to prevent
 * text placement in logo zones. This is LAYER 1 of the three-layer defense system.
 *
 * Strategy: Provide Gemini with exact pixel boundaries in natural language (not XML)
 * to dramatically reduce text-logo overlap violations.
 *
 * @param canvasWidth - Canvas width in pixels (e.g., 1080px for event poster)
 * @param canvasHeight - Canvas height in pixels (e.g., 1440px for event poster)
 * @param headerHeight - Header zone height in pixels
 * @param footerHeight - Footer zone height in pixels
 * @param headerPercent - Header zone percentage (for backward compatibility)
 * @param footerPercent - Footer zone percentage (for backward compatibility)
 * @returns Natural language spatial constraints with pixel-precise coordinates
 */
export function buildPixelPreciseSpatialConstraints(
  canvasWidth: number,
  canvasHeight: number,
  headerHeight: number,
  footerHeight: number,
  headerPercent: number,
  footerPercent: number
): string {
  const colWidth = Math.floor(canvasWidth / 6) // 6 columns (180px each for 1080px canvas)
  const footerStartY = canvasHeight - footerHeight

  // Calculate safety margins (30px buffers)
  const contentStartY = headerHeight + 30
  const contentEndY = footerStartY - 30
  const contentHeightPx = contentEndY - contentStartY

  // Build grid position descriptions
  const headerGridDescriptions: string[] = []
  const footerGridDescriptions: string[] = []

  for (let i = 0; i < 6; i++) {
    const colNum = i + 1
    const xStart = i * colWidth
    const xEnd = (i + 1) * colWidth

    headerGridDescriptions.push(
      `  • Position top-${colNum}: ${xStart}px–${xEnd}px horizontally, 0px–${headerHeight}px vertically`
    )

    footerGridDescriptions.push(
      `  • Position bottom-${colNum}: ${xStart}px–${xEnd}px horizontally, ${footerStartY}px–${canvasHeight}px vertically`
    )
  }

  return `
PIXEL-PRECISE SPATIAL CONSTRAINTS (CRITICAL - DO NOT VIOLATE):

═══════════════════════════════════════════════════════════
CANVAS SPECIFICATIONS:
═══════════════════════════════════════════════════════════
• Total dimensions: ${canvasWidth}px × ${canvasHeight}px
• Grid system: 6 columns × 3 rows (18 positions)
• Column width: ${colWidth}px each

═══════════════════════════════════════════════════════════
HEADER GRID POSITIONS (OCCUPIED - NO TEXT ALLOWED):
═══════════════════════════════════════════════════════════
These 6 positions are OCCUPIED by branding elements:
${headerGridDescriptions.join('\n')}

⚠️  CRITICAL: Header zone (0px to ${headerHeight}px) is ABSOLUTELY FORBIDDEN for text placement
⚠️  This zone is ${headerPercent}% of the canvas and will be covered by logo overlays
⚠️  Any text placed here will be COMPLETELY OBSCURED

═══════════════════════════════════════════════════════════
FOOTER GRID POSITIONS (OCCUPIED - NO TEXT ALLOWED):
═══════════════════════════════════════════════════════════
These 6 positions are OCCUPIED by footer elements:
${footerGridDescriptions.join('\n')}

⚠️  CRITICAL: Footer zone (${footerStartY}px to ${canvasHeight}px) is ABSOLUTELY FORBIDDEN for text placement
⚠️  This zone is ${footerPercent}% of the canvas and will be covered by footer overlays
⚠️  Any text placed here will be COMPLETELY OBSCURED

═══════════════════════════════════════════════════════════
SAFE CONTENT ZONE (ALL TEXT MUST BE HERE):
═══════════════════════════════════════════════════════════
• Vertical range: ${contentStartY}px to ${contentEndY}px
• Percentage equivalent: ${headerPercent + 2}% to ${Math.floor((footerStartY / canvasHeight) * 100) - 2}%
• Available height: ${contentHeightPx}px (${Math.floor((contentHeightPx / canvasHeight) * 100)}% of canvas)
• Safety margins: 30px buffer from both header and footer boundaries

═══════════════════════════════════════════════════════════
BOUNDARY ENFORCEMENT RULES:
═══════════════════════════════════════════════════════════
1. ALL text Y-coordinates MUST satisfy: ${contentStartY}px < textY < ${contentEndY}px
2. NO exceptions for headlines, titles, captions, or any other text elements
3. Background elements (gradients, colors, textures) MAY flow through all zones
4. Only TEXT and FOCAL GRAPHICS must respect these boundaries
5. Safety margin: Leave minimum 30px buffer from both boundaries

═══════════════════════════════════════════════════════════
VALIDATION CHECKPOINT (VERIFY BEFORE FINALIZING):
═══════════════════════════════════════════════════════════
Before submitting the generated image, verify:
  ☐ Is ALL text positioned BELOW ${headerHeight}px (header boundary)?
  ☐ Is ALL text positioned ABOVE ${footerStartY}px (footer boundary)?
  ☐ Are safety margins maintained (30px from both boundaries)?
  ☐ Are header/footer zones (grid positions) free of text content?
  ☐ Does background flow naturally WITHOUT creating visible bands?

If ANY check fails, adjust text position immediately to comply.

═══════════════════════════════════════════════════════════
POSITIONING GUIDANCE:
═══════════════════════════════════════════════════════════
• Headline/Title: Start at approximately ${contentStartY + 20}px (${Math.floor(((contentStartY + 20) / canvasHeight) * 100)}%)
• Subheadline/Tagline: Start at approximately ${contentStartY + 80}px (${Math.floor(((contentStartY + 80) / canvasHeight) * 100)}%)
• Body content: Distribute within ${contentStartY + 150}px to ${contentEndY - 100}px
• Footer content: Reserved zone (${footerStartY}px to ${canvasHeight}px) - DO NOT USE

REMEMBER: These coordinates are NON-NEGOTIABLE technical requirements.
Text outside these boundaries will be INVISIBLE after logo overlay processing.
`
}
