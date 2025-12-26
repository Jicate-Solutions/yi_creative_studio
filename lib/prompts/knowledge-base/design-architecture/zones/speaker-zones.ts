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
SPEAKER PHOTO INTEGRATION - LEFT POSITION (40% of width):
═══════════════════════════════════════════════════════════════════════════════

┌────────────────────────────────────────────────────────────────────────────┐
│                                                                            │
│   ┌─────────────┐                                                          │
│   │             │     ╔════════════════════════════════════════════╗      │
│   │   SPEAKER   │     ║  EVENT NAME - HEADLINE (DOMINANT)          ║      │
│   │   PHOTO     │     ╚════════════════════════════════════════════╝      │
│   │   ZONE      │                                                          │
│   │             │     Speaker Name & Designation                           │
│   │  (Circle)   │     ─────────────────────────                           │
│   │             │                                                          │
│   │  40% width  │     📅 Date    🕐 Time    📍 Venue                       │
│   │             │                                                          │
│   │  NO FACES   │     ┌────────────────────────────┐                      │
│   │  CLEAN BG   │     │      REGISTER NOW          │  ← CTA               │
│   │             │     └────────────────────────────┘                      │
│   └─────────────┘                                                          │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘

CRITICAL RULES FOR LEFT PHOTO ZONE:
- LEFT 40% of design = Clean background zone for circular speaker photo overlay
- DO NOT generate any illustrated faces, people, or human figures in this zone
- Background: Solid color or subtle gradient in secondary/complementary brand color
- May include subtle circular frame design, soft glow, or drop shadow effect
- Zone must be COMPLETELY CLEAR of any text elements
- This area will have a real photo composited via Sharp post-processing

CONTENT FLOW (RIGHT 55%):
- Event name headline: RIGHT-aligned or LEFT-aligned within right zone
- Speaker name with designation: Below headline
- Date, time, venue: Stacked with icons in right zone
- CTA button: Right side, high visibility placement

VISUAL WEIGHT: 70% on right side (content), 30% on left (photo zone background)
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
SPEAKER PHOTO INTEGRATION - RIGHT POSITION (40% of width):
═══════════════════════════════════════════════════════════════════════════════

┌────────────────────────────────────────────────────────────────────────────┐
│                                                                            │
│  ╔════════════════════════════════════════════╗     ┌─────────────┐      │
│  ║  EVENT NAME - HEADLINE (DOMINANT)          ║     │             │      │
│  ╚════════════════════════════════════════════╝     │   SPEAKER   │      │
│                                                      │   PHOTO     │      │
│  Speaker Name & Designation                          │   ZONE      │      │
│  ─────────────────────────                          │             │      │
│                                                      │  (Circle)   │      │
│  📅 Date    🕐 Time    📍 Venue                      │             │      │
│                                                      │  40% width  │      │
│  ┌────────────────────────────┐                     │             │      │
│  │      REGISTER NOW          │  ← CTA              │  NO FACES   │      │
│  └────────────────────────────┘                     │  CLEAN BG   │      │
│                                                      │             │      │
│                                                      └─────────────┘      │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘

CRITICAL RULES FOR RIGHT PHOTO ZONE:
- RIGHT 40% of design = Clean background zone for circular speaker photo overlay
- DO NOT generate any illustrated faces or people in this zone
- Background: Solid or subtle gradient, complementary color
- Zone reserved exclusively for post-processing photo overlay

CONTENT FLOW (LEFT 55%):
- Event name headline: Prominent in left zone
- All details stacked on left side
- CTA clearly visible on left
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
SPEAKER PHOTO INTEGRATION - CENTER POSITION (30% of height):
═══════════════════════════════════════════════════════════════════════════════

┌────────────────────────────────────────────────────────────────────────────┐
│                                                                            │
│            ╔════════════════════════════════════════════╗                 │
│            ║  EVENT NAME - HEADLINE (DOMINANT)          ║                 │
│            ╚════════════════════════════════════════════╝                 │
│                                                                            │
│                         ┌─────────────┐                                   │
│                         │   SPEAKER   │                                   │
│                         │   PHOTO     │                                   │
│                         │   ZONE      │                                   │
│                         │  (Circle)   │                                   │
│                         │  NO FACES   │                                   │
│                         │  CLEAN BG   │                                   │
│                         └─────────────┘                                   │
│                                                                            │
│            Speaker Name & Designation                                      │
│            📅 Date    🕐 Time    📍 Venue                                  │
│                                                                            │
│                    ┌────────────────────┐                                 │
│                    │    REGISTER NOW    │  ← CTA                          │
│                    └────────────────────┘                                 │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘

CRITICAL RULES FOR CENTER PHOTO ZONE:
- CENTER zone (30% of height) = Clean circular area for speaker photo overlay
- DO NOT generate illustrated faces in center
- Neutral/complementary background in center zone
- Content flows ABOVE and BELOW the center photo zone

CONTENT PLACEMENT:
- ABOVE center: Event name headline (dominant)
- BELOW center: Speaker name, event details (date, time, venue)
- BOTTOM: CTA button
- Design frames around the center photo as focal point
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
DUAL SPEAKER LAYOUT (2 Speakers - Horizontal Side-by-Side):
═══════════════════════════════════════════════════════════════════════════════

┌────────────────────────────────────────────────────────────────────────────┐
│                                                                            │
│  ┌─────┐                                                    ┌─────┐       │
│  │ SP1 │         ╔════════════════════════════╗            │ SP2 │       │
│  │     │         ║  EVENT NAME - HEADLINE     ║            │     │       │
│  │LEFT │         ╚════════════════════════════╝            │RIGHT│       │
│  │25% │                                                    │25% │       │
│  │     │         Speaker 1 Name | Speaker 2 Name           │     │       │
│  │CLEAN│         ─────────────────────────────             │CLEAN│       │
│  │ BG  │                                                    │ BG  │       │
│  │     │         📅 Date    🕐 Time    📍 Venue            │     │       │
│  │NO   │                                                    │NO   │       │
│  │FACES│         ┌────────────────────┐                    │FACES│       │
│  │     │         │   REGISTER NOW     │  ← CTA             │     │       │
│  └─────┘         └────────────────────┘                    └─────┘       │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘

CRITICAL RULES FOR DUAL SPEAKER LAYOUT:
- LEFT 25% of design = Clean background zone for Speaker 1 photo overlay (circle/rounded)
- RIGHT 25% of design = Clean background zone for Speaker 2 photo overlay (circle/rounded)
- CENTER 50% = All content (headline, details, CTA)
- DO NOT generate any illustrated faces, people, or human figures in LEFT or RIGHT zones
- Both zones: Solid or subtle gradient background in brand secondary/complementary colors
- Photos will be overlaid via Sharp post-processing at exact positions

CONTENT FLOW (CENTER 50%):
- Event name headline: Centered, dominant typography
- Speaker names: Side-by-side or combined text below headline
- Date, time, venue: Centered with icons
- CTA button: Centered at bottom, high visibility

VISUAL WEIGHT: Balanced distribution - 25% left photo, 50% content, 25% right photo
    `.trim(),
  },

  triple_horizontal: {
    id: 'triple_horizontal',
    speakerCount: 3,
    layout: 'side-by-side',
    promptFragment: `
TRIPLE SPEAKER LAYOUT (3 Speakers - Horizontal Row):
═══════════════════════════════════════════════════════════════════════════════

┌────────────────────────────────────────────────────────────────────────────┐
│                                                                            │
│  ┌───┐           ╔════════════════════════════╗            ┌───┐  ┌───┐  │
│  │SP1│           ║  EVENT NAME - HEADLINE     ║            │SP2│  │SP3│  │
│  │   │           ╚════════════════════════════╝            │   │  │   │  │
│  │20%│                                                     │20%│  │20%│  │
│  │   │           Speaker 1 | Speaker 2 | Speaker 3         │   │  │   │  │
│  │CLN│           ────────────────────────────              │CLN│  │CLN│  │
│  │BG │                                                     │BG │  │BG │  │
│  │   │           📅 Date    🕐 Time    📍 Venue           │   │  │   │  │
│  │NO │                                                     │NO │  │NO │  │
│  │FAC│           ┌────────────────────┐                    │FAC│  │FAC│  │
│  │ES │           │   REGISTER NOW     │  ← CTA            │ES │  │ES │  │
│  └───┘           └────────────────────┘                    └───┘  └───┘  │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘

CRITICAL RULES FOR TRIPLE SPEAKER LAYOUT:
- LEFT 20% = Clean zone for Speaker 1 photo
- RIGHT CENTER 20% = Clean zone for Speaker 2 photo
- RIGHT EDGE 20% = Clean zone for Speaker 3 photo
- CENTER 40% = All content (headline, details, CTA)
- DO NOT generate illustrated faces in any of the three speaker zones
- Clean backgrounds in brand colors for all three zones

CONTENT FLOW (CENTER 40%):
- Event name headline: Centered and prominent
- Speaker names: Combined text or stacked list
- Event details: Centered
- CTA: Centered at bottom

LAYOUT STRATEGY: Horizontal row distribution with balanced spacing
    `.trim(),
  },

  grid_2x2: {
    id: 'grid_2x2',
    speakerCount: 4,
    layout: 'grid',
    promptFragment: `
QUAD SPEAKER LAYOUT (4 Speakers - 2×2 Grid):
═══════════════════════════════════════════════════════════════════════════════

┌────────────────────────────────────────────────────────────────────────────┐
│                                                                            │
│  ┌───┐                                                    ┌───┐           │
│  │SP1│         ╔════════════════════════════╗            │SP2│           │
│  │   │         ║  EVENT NAME - HEADLINE     ║            │   │           │
│  │TL │         ╚════════════════════════════╝            │TR │           │
│  │20%│                                                    │20%│           │
│  └───┘         Speaker 1 | Speaker 2 | ...                └───┘           │
│                ────────────────────────────                                │
│                                                                            │
│                📅 Date    🕐 Time    📍 Venue                             │
│                                                                            │
│  ┌───┐         ┌────────────────────┐                    ┌───┐           │
│  │SP3│         │   REGISTER NOW     │  ← CTA             │SP4│           │
│  │   │         └────────────────────┘                    │   │           │
│  │BL │                                                    │BR │           │
│  │20%│                                                    │20%│           │
│  └───┘                                                    └───┘           │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘

CRITICAL RULES FOR QUAD SPEAKER LAYOUT:
- TOP-LEFT corner (20%) = Clean zone for Speaker 1 photo
- TOP-RIGHT corner (20%) = Clean zone for Speaker 2 photo
- BOTTOM-LEFT corner (20%) = Clean zone for Speaker 3 photo
- BOTTOM-RIGHT corner (20%) = Clean zone for Speaker 4 photo
- CENTER 60% = All content (headline, details, CTA)
- DO NOT generate illustrated faces in any corner zones
- Clean backgrounds for all four photo zones

CONTENT FLOW (CENTER 60%):
- Event name headline: Centered, upper section
- Speaker names: Combined text or grid layout text
- Event details: Center zone
- CTA: Centered in middle-lower section

LAYOUT STRATEGY: 2×2 grid with content framed in center, speakers at four corners
    `.trim(),
  },

  grid_multi: {
    id: 'grid_multi',
    speakerCount: 6,
    layout: 'grid',
    promptFragment: `
MULTI-SPEAKER GRID LAYOUT (5-10 Speakers - Flexible Grid):
═══════════════════════════════════════════════════════════════════════════════

┌────────────────────────────────────────────────────────────────────────────┐
│                                                                            │
│  ┌───┐  ┌───┐       ╔═════════════════════╗        ┌───┐  ┌───┐         │
│  │SP1│  │SP2│       ║  EVENT NAME         ║        │SP3│  │SP4│         │
│  └───┘  └───┘       ╚═════════════════════╝        └───┘  └───┘         │
│                                                                            │
│                     Speaker Names List                                     │
│                     ──────────────────                                     │
│                                                                            │
│  ┌───┐  ┌───┐       📅 Date | 🕐 Time     ┌───┐  ┌───┐                  │
│  │SP5│  │SP6│                              │SP7│  │SP8│                  │
│  └───┘  └───┘       📍 Venue               └───┘  └───┘                  │
│                                                                            │
│                     ┌────────────────┐                                     │
│                     │ REGISTER NOW   │  ← CTA                             │
│                     └────────────────┘                                     │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘

CRITICAL RULES FOR MULTI-SPEAKER GRID:
- Speakers arranged in 2×N grid (2 columns, N rows based on speaker count)
- Each speaker zone: 15-18% of width, clean background
- CENTER zone: 40-50% for all content
- DO NOT generate illustrated faces in any speaker zones
- Clean, consistent backgrounds across all speaker zones
- Equal spacing between grid cells

CONTENT FLOW (CENTER ZONE):
- Event name headline: Centered at top
- Speaker names: Compact list or "Speakers: [count]"
- Event details: Centered
- CTA: Bottom center

LAYOUT STRATEGY: Scalable grid (supports 5-10 speakers) with content prioritized in center
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
