/**
 * Logo Zone Enforcement Helper
 *
 * Generates explicit FORBIDDEN ZONE instructions with percentage coordinates
 * that AI models must respect for logo overlay areas.
 *
 * This is a stronger enforcement mechanism than natural language guidance,
 * providing specific percentage ranges that the AI should avoid.
 */

import type { LogoAwarenessContext } from '../types/logo-awareness'
import type { LogoPosition } from '@/lib/config/constants'

/**
 * Forbidden zone with explicit percentage coordinates
 */
interface ForbiddenZone {
  name: string
  position: LogoPosition
  xStart: number // Percentage from left (0-100)
  xEnd: number // Percentage from left (0-100)
  yStart: number // Percentage from top (0-100)
  yEnd: number // Percentage from top (0-100)
  description: string
}

/**
 * Position to percentage zone mapping
 * These percentages define the safe areas for each logo position
 * with generous buffers to ensure no text overlap
 *
 * 18-position grid: 6 columns × 3 rows
 * Columns: 1=far-left, 2=left, 3=center-left, 4=center-right, 5=right, 6=far-right
 * Rows: top (header strip), mid (second strip), bottom (footer strip)
 */
const POSITION_TO_ZONE: Record<LogoPosition, Omit<ForbiddenZone, 'name' | 'position'>> = {
  // HEADER STRIP - Top row (Brand logos)
  'top-1': {
    xStart: 0,
    xEnd: 17,
    yStart: 0,
    yEnd: 15,
    description: 'upper far-left (Yi logo)',
  },
  'top-2': {
    xStart: 17,
    xEnd: 33,
    yStart: 0,
    yEnd: 15,
    description: 'upper left',
  },
  'top-3': {
    xStart: 33,
    xEnd: 50,
    yStart: 0,
    yEnd: 15,
    description: 'upper center-left (theme logo)',
  },
  'top-4': {
    xStart: 50,
    xEnd: 67,
    yStart: 0,
    yEnd: 15,
    description: 'upper center-right',
  },
  'top-5': {
    xStart: 67,
    xEnd: 83,
    yStart: 0,
    yEnd: 15,
    description: 'upper right',
  },
  'top-6': {
    xStart: 83,
    xEnd: 100,
    yStart: 0,
    yEnd: 15,
    description: 'upper far-right (CII logo)',
  },
  // SECOND STRIP - Just below header (Vertical logos)
  'mid-1': {
    xStart: 0,
    xEnd: 17,
    yStart: 12,
    yEnd: 28,
    description: 'middle far-left (vertical logo)',
  },
  'mid-2': {
    xStart: 17,
    xEnd: 33,
    yStart: 12,
    yEnd: 28,
    description: 'middle left',
  },
  'mid-3': {
    xStart: 33,
    xEnd: 50,
    yStart: 12,
    yEnd: 28,
    description: 'middle center-left (vertical logo)',
  },
  'mid-4': {
    xStart: 50,
    xEnd: 67,
    yStart: 12,
    yEnd: 28,
    description: 'middle center-right',
  },
  'mid-5': {
    xStart: 67,
    xEnd: 83,
    yStart: 12,
    yEnd: 28,
    description: 'middle right',
  },
  'mid-6': {
    xStart: 83,
    xEnd: 100,
    yStart: 12,
    yEnd: 28,
    description: 'middle far-right',
  },
  // FOOTER STRIP - Bottom row (Sponsors/Partners)
  'bottom-1': {
    xStart: 0,
    xEnd: 17,
    yStart: 85,
    yEnd: 100,
    description: 'lower far-left (sponsor logo)',
  },
  'bottom-2': {
    xStart: 17,
    xEnd: 33,
    yStart: 85,
    yEnd: 100,
    description: 'lower left',
  },
  'bottom-3': {
    xStart: 33,
    xEnd: 50,
    yStart: 85,
    yEnd: 100,
    description: 'lower center-left (sponsor logo)',
  },
  'bottom-4': {
    xStart: 50,
    xEnd: 67,
    yStart: 85,
    yEnd: 100,
    description: 'lower center-right',
  },
  'bottom-5': {
    xStart: 67,
    xEnd: 83,
    yStart: 85,
    yEnd: 100,
    description: 'lower right',
  },
  'bottom-6': {
    xStart: 83,
    xEnd: 100,
    yStart: 85,
    yEnd: 100,
    description: 'lower far-right (sponsor logo)',
  },
}

/**
 * Get forbidden zones based on active logos
 */
export function getForbiddenZones(logoAwareness?: LogoAwarenessContext): ForbiddenZone[] {
  if (!logoAwareness?.hasLogos || !logoAwareness.activeLogos?.length) {
    return []
  }

  return logoAwareness.activeLogos
    .map((logo) => {
      const zoneConfig = POSITION_TO_ZONE[logo.position]
      if (!zoneConfig) return null

      return {
        name: `${logo.position.toUpperCase().replace('-', '_')}_ZONE`,
        position: logo.position,
        ...zoneConfig,
      }
    })
    .filter((zone): zone is ForbiddenZone => zone !== null)
}

/**
 * Calculate safe content area based on forbidden zones
 */
export function getSafeContentArea(zones: ForbiddenZone[]): {
  topSafe: number // Percentage from top where content can start
  bottomSafe: number // Percentage from top where content should end
} {
  let topSafe = 0
  let bottomSafe = 100

  zones.forEach((zone) => {
    // For top zones, content should start below them
    if (zone.yStart < 30) {
      topSafe = Math.max(topSafe, zone.yEnd + 3) // +3% buffer
    }
    // For bottom zones, content should end above them
    if (zone.yEnd > 70) {
      bottomSafe = Math.min(bottomSafe, zone.yStart - 3) // -3% buffer
    }
  })

  return { topSafe, bottomSafe }
}

/**
 * Build forbidden zones section for AI prompt
 * Returns XML-structured content that tells AI where NOT to place content
 */
export function buildForbiddenZonesSection(logoAwareness?: LogoAwarenessContext): string {
  const zones = getForbiddenZones(logoAwareness)

  if (zones.length === 0) {
    return ''
  }

  const safeArea = getSafeContentArea(zones)

  const zoneDescriptions = zones
    .map(
      (zone) =>
        `- ${zone.name}: X=${zone.xStart}%-${zone.xEnd}%, Y=${zone.yStart}%-${zone.yEnd}% (${zone.description})`
    )
    .join('\n')

  // Group zones by region for clear guidance
  const topZones = zones.filter((z) => z.yStart < 20)
  const bottomZones = zones.filter((z) => z.yEnd > 80)

  let regionGuidance = ''
  if (topZones.length > 0) {
    regionGuidance += `\nTOP REGION (0-${safeArea.topSafe}%): Keep this area CLEAN with simple, uncluttered background.`
  }
  if (bottomZones.length > 0) {
    regionGuidance += `\nBOTTOM REGION (${safeArea.bottomSafe}-100%): Keep this area CLEAN with simple background.`
  }

  return `
<clean_background_areas>
AREAS REQUIRING CLEAN BACKGROUNDS - NO TEXT OR COMPLEX ELEMENTS:

${zoneDescriptions}
${regionGuidance}

REQUIREMENTS FOR CLEAN BACKGROUND AREAS:
1. Use ONLY solid colors, subtle gradients, or simple textures
2. NO text, headlines, dates, or information of any kind
3. NO faces, photos, or detailed imagery
4. NO decorative elements or frames
5. Keep background simple and uncluttered
6. Keep these areas completely empty

CONTENT AREA: Y=${safeArea.topSafe}% to Y=${safeArea.bottomSafe}%
Position ALL headlines, event details, CTAs, and important content within this area.
</clean_background_areas>
`
}

/**
 * Build a simpler constraint reminder for the end of prompts
 */
export function buildZoneReminderSection(logoAwareness?: LogoAwarenessContext): string {
  const zones = getForbiddenZones(logoAwareness)

  if (zones.length === 0) {
    return ''
  }

  const safeArea = getSafeContentArea(zones)

  return `
REMINDER - CLEAN BACKGROUND AREAS:
- Top ${safeArea.topSafe}% of image: Keep clean and simple background, no text.
- Bottom ${100 - safeArea.bottomSafe}% of image: Keep clean background.
- Place ALL text and content between ${safeArea.topSafe}% and ${safeArea.bottomSafe}% from top.
- Keep the top and bottom areas completely empty.
`
}
