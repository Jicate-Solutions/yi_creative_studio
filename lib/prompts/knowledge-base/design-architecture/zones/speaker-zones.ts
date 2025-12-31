/**
 * Speaker Photo Integration Zones
 * Architecture for integrating speaker photos into event posters
 *
 * Defines clear zones where AI should generate clean backgrounds
 * for post-processing speaker photo overlays via Sharp.
 *
 * CRITICAL: AI must NOT generate illustrated faces in photo zones -
 * only clean backgrounds suitable for circular/rounded photo overlay.
 */

import type { SpeakerZoneConfig, DesignZone, ContentFlow } from '../types'

// ============================================================
// SPEAKER ZONE CONFIGURATIONS
// ============================================================

export const SPEAKER_ZONE_CONFIGS: Record<string, SpeakerZoneConfig> = {
  left_large_circle: {
    id: 'left_large_circle',
    position: 'left',
    size: 'large',
    shape: 'circle',
    zoneArchitecture: {
      photoZone: {
        id: 'speaker_photo',
        name: 'Speaker Photo Zone',
        position: { anchor: 'center-left', offsetX: '8%' },
        dimensions: { widthPercent: 35, heightPercent: 50, aspectRatio: '1:1' },
        purpose: 'integration',
        reservedFor: 'Circular speaker photo overlay via Sharp post-processing',
        backgroundGuidance: 'Solid or subtle gradient background in brand secondary color, clean without patterns or faces',
        contentRules: [
          'NO illustrated faces, people, or human figures in this zone',
          'Background should complement but not compete with photo',
          'May include subtle circular frame or glow effect',
          'Keep area completely clear of text elements',
          'Simple, clean background for photo compositing',
        ],
      },
      contentFlow: 'opposite',
      backgroundTreatment: 'Left 40% with clean solid/gradient background suitable for photo overlay',
      integrationRules: [
        'All headlines and event details flow to RIGHT 55% of design',
        'Visual weight concentrated on right side when photo absent',
        'Left zone serves as "frame" or "stage" for speaker photo',
        'Ensure high contrast between photo zone and content zone',
        'Photo zone background should use brand secondary or complementary color',
      ],
      promptFragment: `
LEFT SIDE BACKGROUND AREA (40% of width):

DESIGN REQUIREMENTS:
The LEFT 40% of the canvas should have a clean, solid or gradient background.

CRITICAL - DO NOT GENERATE IN LEFT 40%:
- No illustrated faces, people, or human figures
- No circular frames or shapes
- No text or labels
- No decorative borders or frame outlines

WHAT TO GENERATE IN LEFT 40%:
- Clean solid color OR subtle gradient background only
- May have soft ambient glow or light effects
- Background color should complement the main design
- Keep this area SIMPLE and CLEAR

CONTENT PLACEMENT (RIGHT 55%):
- Event name headline: RIGHT side of the design
- Speaker name with designation: Below headline on right
- Date, time, venue: Stacked with icons on right
- CTA button: Right side, high visibility

VISUAL WEIGHT: 70% on right side (content), 30% on left (clean background)
`,
    },
  },

  right_large_circle: {
    id: 'right_large_circle',
    position: 'right',
    size: 'large',
    shape: 'circle',
    zoneArchitecture: {
      photoZone: {
        id: 'speaker_photo',
        name: 'Speaker Photo Zone',
        position: { anchor: 'center-right', offsetX: '-8%' },
        dimensions: { widthPercent: 35, heightPercent: 50, aspectRatio: '1:1' },
        purpose: 'integration',
        reservedFor: 'Circular speaker photo overlay via Sharp post-processing',
        backgroundGuidance: 'Solid or subtle gradient background in brand secondary color',
        contentRules: [
          'NO illustrated faces, people, or human figures',
          'Clean background for photo overlay',
          'May include circular frame accent',
        ],
      },
      contentFlow: 'opposite',
      backgroundTreatment: 'Right 40% with clean background for photo overlay',
      integrationRules: [
        'All headlines and event details flow to LEFT 55% of design',
        'Visual weight concentrated on left side',
        'Right zone reserved exclusively for photo overlay',
      ],
      promptFragment: `
RIGHT SIDE BACKGROUND AREA (40% of width):

DESIGN REQUIREMENTS:
The RIGHT 40% of the canvas should have a clean, solid or gradient background.

CRITICAL - DO NOT GENERATE IN RIGHT 40%:
- No illustrated faces, people, or human figures
- No circular frames or shapes
- No text or labels
- No decorative borders or frame outlines

WHAT TO GENERATE IN RIGHT 40%:
- Clean solid color OR subtle gradient background only
- May have soft ambient glow or light effects
- Background color should complement the main design
- Keep this area SIMPLE and CLEAR

CONTENT PLACEMENT (LEFT 55%):
- Event name headline: LEFT side of the design, prominent
- All details stacked on left side
- CTA clearly visible on left

VISUAL WEIGHT: 70% on left side (content), 30% on right (clean background)
`,
    },
  },

  center_medium_circle: {
    id: 'center_medium_circle',
    position: 'center',
    size: 'medium',
    shape: 'circle',
    zoneArchitecture: {
      photoZone: {
        id: 'speaker_photo',
        name: 'Speaker Photo Zone',
        position: { anchor: 'center', offsetY: '5%' },
        dimensions: { widthPercent: 28, heightPercent: 35, aspectRatio: '1:1' },
        purpose: 'integration',
        reservedFor: 'Circular speaker photo overlay via Sharp post-processing',
        backgroundGuidance: 'Clean center zone with subtle radial gradient or solid color',
        contentRules: [
          'Center zone clear for photo overlay',
          'Content frames around the photo (above and below)',
          'NO illustrated faces in center',
        ],
      },
      contentFlow: 'around',
      backgroundTreatment: 'Center 30% with clean background, content above and below',
      integrationRules: [
        'Event name headline: ABOVE center photo zone',
        'Event details: BELOW center photo zone',
        'Design frames around the speaker photo',
        'Visual balance around center focal point',
      ],
      promptFragment: `
CENTER BACKGROUND AREA (30% of height in middle):

DESIGN REQUIREMENTS:
The CENTER area of the canvas (approximately 30% height in the middle) should have a clean background.

CRITICAL - DO NOT GENERATE IN CENTER AREA:
- No illustrated faces, people, or human figures
- No circular frames or shapes
- No text or labels
- No decorative borders or frame outlines

WHAT TO GENERATE IN CENTER AREA:
- Clean solid color OR subtle gradient background only
- May have soft ambient glow or light effects
- Background color should complement the main design
- Keep this area SIMPLE and CLEAR

CONTENT PLACEMENT:
- ABOVE center: Event name headline (dominant)
- BELOW center: Speaker name, event details (date, time, venue)
- BOTTOM: CTA button

VISUAL WEIGHT: Content flows ABOVE and BELOW the center area
`,
    },
  },
}

// ============================================================
// MULTI-SPEAKER ZONE CONFIGURATIONS (NEW v5.0)
// ============================================================

export const MULTI_SPEAKER_ZONES: Record<string, {
  id: string
  speakerCount: number
  layout: 'side-by-side' | 'stacked' | 'grid'
  promptFragment: string
}> = {
  dual_horizontal: {
    id: 'dual_horizontal',
    speakerCount: 2,
    layout: 'side-by-side',
    promptFragment: `
TWO-SIDED BACKGROUND LAYOUT:

DESIGN REQUIREMENTS:
The LEFT 25% and RIGHT 25% of the canvas should have clean, solid or gradient backgrounds.
The CENTER 50% contains all text content.

CRITICAL - DO NOT GENERATE IN LEFT OR RIGHT 25% AREAS:
- No illustrated faces, people, or human figures
- No circular frames or shapes
- No text or labels
- No decorative borders or frame outlines

WHAT TO GENERATE IN LEFT AND RIGHT AREAS:
- Clean solid color OR subtle gradient background only
- May have soft ambient glow or light effects
- Background colors should complement the main design
- Keep these areas SIMPLE and CLEAR

CONTENT PLACEMENT (CENTER 50%):
- Event name headline: Centered, dominant typography
- Speaker names: Side-by-side or combined text below headline
- Date, time, venue: Centered with icons
- CTA button: Centered at bottom, high visibility

VISUAL WEIGHT: Balanced - left background, center content, right background
    `.trim(),
  },

  triple_horizontal: {
    id: 'triple_horizontal',
    speakerCount: 3,
    layout: 'side-by-side',
    promptFragment: `
THREE-SIDED BACKGROUND LAYOUT:

DESIGN REQUIREMENTS:
The LEFT 20%, RIGHT-CENTER 20%, and RIGHT-EDGE 20% areas should have clean backgrounds.
The CENTER 40% contains all text content.

CRITICAL - DO NOT GENERATE IN THESE THREE BACKGROUND AREAS:
- No illustrated faces, people, or human figures
- No circular frames or shapes
- No text or labels
- No decorative borders or frame outlines

WHAT TO GENERATE IN BACKGROUND AREAS:
- Clean solid color OR subtle gradient background only
- May have soft ambient glow or light effects
- Background colors should complement the main design
- Keep these areas SIMPLE and CLEAR

CONTENT PLACEMENT (CENTER 40%):
- Event name headline: Centered and prominent
- Speaker names: Combined text or stacked list
- Event details: Centered
- CTA: Centered at bottom

LAYOUT STRATEGY: Horizontal distribution with balanced spacing
    `.trim(),
  },

  grid_2x2: {
    id: 'grid_2x2',
    speakerCount: 4,
    layout: 'grid',
    promptFragment: `
FOUR CORNER BACKGROUND LAYOUT:

DESIGN REQUIREMENTS:
The FOUR CORNERS (top-left, top-right, bottom-left, bottom-right - each 20%) should have clean backgrounds.
The CENTER 60% contains all text content.

CRITICAL - DO NOT GENERATE IN CORNER AREAS:
- No illustrated faces, people, or human figures
- No circular frames or shapes
- No text or labels
- No decorative borders or frame outlines

WHAT TO GENERATE IN CORNER AREAS:
- Clean solid color OR subtle gradient background only
- May have soft ambient glow or light effects
- Background colors should complement the main design
- Keep these areas SIMPLE and CLEAR

CONTENT PLACEMENT (CENTER 60%):
- Event name headline: Centered, upper section
- Speaker names: Combined text or grid layout text
- Event details: Center area
- CTA: Centered in middle-lower section

LAYOUT STRATEGY: Content framed in center with clean background corners
    `.trim(),
  },

  grid_multi: {
    id: 'grid_multi',
    speakerCount: 6,
    layout: 'grid',
    promptFragment: `
MULTI-AREA BACKGROUND LAYOUT:

DESIGN REQUIREMENTS:
Multiple areas on left and right sides (each 15-18% of width) should have clean backgrounds.
The CENTER 40-50% contains all text content.

CRITICAL - DO NOT GENERATE IN SIDE BACKGROUND AREAS:
- No illustrated faces, people, or human figures
- No circular frames or shapes
- No text or labels
- No decorative borders or frame outlines

WHAT TO GENERATE IN SIDE AREAS:
- Clean solid color OR subtle gradient background only
- May have soft ambient glow or light effects
- Background colors should complement the main design
- Keep these areas SIMPLE and CLEAR
- Equal spacing between areas

CONTENT PLACEMENT (CENTER 40-50%):
- Event name headline: Centered at top
- Speaker names: Compact list
- Event details: Centered
- CTA: Bottom center

LAYOUT STRATEGY: Content prioritized in center with clean side areas
    `.trim(),
  },
}

/**
 * Auto-detect optimal speaker layout based on speaker count
 */
export function autoDetectSpeakerLayout(count: number): 'side-by-side' | 'stacked' | 'grid' {
  if (count === 1) return 'side-by-side'  // Single speaker (legacy)
  if (count === 2) return 'side-by-side'  // Left + Right
  if (count === 3) return 'side-by-side'  // Horizontal row
  if (count <= 6) return 'grid'           // 2×2 or 2×3 grid
  return 'grid'                           // Default to grid for 7+
}

/**
 * Get zone config for multi-speaker layouts
 */
export function getMultiSpeakerZoneConfig(
  speakerCount: number,
  layoutMode: 'auto' | 'manual',
  layoutStrategy?: 'side-by-side' | 'stacked' | 'grid'
): string {
  const finalStrategy = layoutMode === 'auto'
    ? autoDetectSpeakerLayout(speakerCount)
    : (layoutStrategy || 'side-by-side')

  // Match specific layouts
  if (speakerCount === 2 && finalStrategy === 'side-by-side') {
    return MULTI_SPEAKER_ZONES.dual_horizontal.promptFragment
  }
  if (speakerCount === 3 && finalStrategy === 'side-by-side') {
    return MULTI_SPEAKER_ZONES.triple_horizontal.promptFragment
  }
  if (speakerCount === 4 && finalStrategy === 'grid') {
    return MULTI_SPEAKER_ZONES.grid_2x2.promptFragment
  }
  if (speakerCount >= 5 && finalStrategy === 'grid') {
    return MULTI_SPEAKER_ZONES.grid_multi.promptFragment
  }

  // Fallback to single speaker zone for edge cases
  return SPEAKER_ZONE_CONFIGS.left_large_circle.zoneArchitecture.promptFragment
}

/**
 * Build multi-speaker zone context
 * Supports both legacy single-speaker and new multi-speaker formats
 */
export function buildMultiSpeakerZoneContext(config: {
  speakerCount: number
  layoutStrategy?: 'side-by-side' | 'stacked' | 'grid'
  layoutMode?: 'auto' | 'manual'
  enabled: boolean
}): string {
  if (!config.enabled) {
    return ''
  }

  if (config.speakerCount === 0) {
    return ''
  }

  if (config.speakerCount === 1) {
    // Single speaker - use legacy zone config
    return SPEAKER_ZONE_CONFIGS.left_large_circle.zoneArchitecture.promptFragment
  }

  // Multi-speaker - use new zone configs
  return getMultiSpeakerZoneConfig(
    config.speakerCount,
    config.layoutMode || 'auto',
    config.layoutStrategy
  )
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Get speaker zone configuration by position, size, and shape
 */
export function getSpeakerZoneConfig(
  position: string = 'left',
  size: string = 'large',
  shape: string = 'circle'
): SpeakerZoneConfig {
  const key = `${position}_${size}_${shape}`
  return SPEAKER_ZONE_CONFIGS[key] || SPEAKER_ZONE_CONFIGS['left_large_circle']
}

/**
 * Get the prompt fragment for a speaker zone configuration
 */
export function getSpeakerZonePromptFragment(
  position: string = 'left',
  size: string = 'large',
  shape: string = 'circle'
): string {
  const config = getSpeakerZoneConfig(position, size, shape)
  return config.zoneArchitecture.promptFragment
}

/**
 * Get all available speaker zone configurations
 */
export function getAvailableSpeakerZones(): string[] {
  return Object.keys(SPEAKER_ZONE_CONFIGS)
}

/**
 * Check if speaker photo is enabled in form data
 */
export function shouldIncludeSpeakerZone(formData: {
  speakerPhoto?: { enabled?: boolean; position?: string }
}): boolean {
  return formData.speakerPhoto?.enabled === true
}

/**
 * Build speaker zone context from form data
 */
export function buildSpeakerZoneContext(formData: {
  speakerPhoto?: {
    enabled?: boolean
    position?: string
    size?: string
    shape?: string
  }
}): string {
  if (!shouldIncludeSpeakerZone(formData)) {
    return ''
  }

  const { position = 'left', size = 'large', shape = 'circle' } = formData.speakerPhoto || {}
  return getSpeakerZonePromptFragment(position, size, shape)
}
