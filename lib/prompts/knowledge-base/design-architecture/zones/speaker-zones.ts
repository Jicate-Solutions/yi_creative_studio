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
