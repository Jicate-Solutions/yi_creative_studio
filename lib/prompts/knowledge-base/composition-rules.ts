/**
 * Composition Rules System
 *
 * Professional design composition rules for AI image generation.
 * Provides grid systems, focal points, visual weight, and layout patterns
 * that Gemini can understand for consistent, well-composed designs.
 */

// ============================================================================
// TYPES
// ============================================================================

export type LayoutType =
  | 'centered'
  | 'rule-of-thirds'
  | 'golden-ratio'
  | 'asymmetric'
  | 'diagonal'
  | 'grid'
  | 'z-pattern'
  | 'f-pattern'

export type FocalPoint =
  | 'center'
  | 'upper-third-left'
  | 'upper-third-center'
  | 'upper-third-right'
  | 'middle-left'
  | 'middle-right'
  | 'lower-third-left'
  | 'lower-third-center'
  | 'lower-third-right'
  | 'golden-ratio-left'
  | 'golden-ratio-right'

export type VisualWeight =
  | 'balanced'
  | 'top-heavy'
  | 'bottom-anchored'
  | 'left-weighted'
  | 'right-weighted'
  | 'diagonal-flow'

export interface ZoneDefinition {
  id: string
  name: string
  position: {
    top: string      // e.g., "0%", "10%"
    bottom: string   // e.g., "15%", "100%"
    left: string
    right: string
  }
  percentageRange: string  // e.g., "0-15%", "15-70%"
  purpose: string
  contentTypes: string[]
  breathingRoom: number    // Padding in percentage
  keepClear: boolean       // For overlay zones
}

export interface CompositionLayout {
  id: LayoutType
  name: string
  description: string
  bestFor: string[]
  gridLines: {
    vertical: number[]     // Percentages from left: [33.33, 66.67]
    horizontal: number[]   // Percentages from top: [33.33, 66.67]
  }
  focalPoints: FocalPoint[]
  eyePath: string          // How the eye naturally moves
  visualBalance: string
}

export interface FormatComposition {
  format: string
  layout: LayoutType
  focalPoint: FocalPoint
  zones: ZoneDefinition[]
  visualWeight: VisualWeight
  movement: 'static' | 'subtle-flow' | 'dynamic'
  depthLayers: {
    background: string
    midground: string
    foreground: string
  }
  specialRules: string[]
}

// ============================================================================
// COMPOSITION LAYOUTS
// ============================================================================

export const COMPOSITION_LAYOUTS: Record<LayoutType, CompositionLayout> = {
  'centered': {
    id: 'centered',
    name: 'Centered / Symmetrical',
    description: 'Content aligned to center axis. Classic, formal, balanced.',
    bestFor: ['certificates', 'formal announcements', 'award posters', 'invitations'],
    gridLines: {
      vertical: [50],
      horizontal: [50]
    },
    focalPoints: ['center', 'upper-third-center', 'lower-third-center'],
    eyePath: 'Direct focus to center, then outward symmetrically',
    visualBalance: 'Perfect symmetry around vertical axis'
  },

  'rule-of-thirds': {
    id: 'rule-of-thirds',
    name: 'Rule of Thirds',
    description: 'Classic photography composition. Creates visual interest through asymmetry.',
    bestFor: ['event posters', 'social media', 'marketing materials', 'photography-based designs'],
    gridLines: {
      vertical: [33.33, 66.67],
      horizontal: [33.33, 66.67]
    },
    focalPoints: [
      'upper-third-left', 'upper-third-right',
      'lower-third-left', 'lower-third-right'
    ],
    eyePath: 'Starts at upper-left intersection, moves across to right, then down',
    visualBalance: 'Asymmetric balance through strategic element placement'
  },

  'golden-ratio': {
    id: 'golden-ratio',
    name: 'Golden Ratio / Phi Grid',
    description: 'Based on 1.618 ratio. Creates natural, aesthetically pleasing compositions.',
    bestFor: ['premium designs', 'artistic layouts', 'editorial content', 'luxury brands'],
    gridLines: {
      vertical: [38.2, 61.8],
      horizontal: [38.2, 61.8]
    },
    focalPoints: ['golden-ratio-left', 'golden-ratio-right', 'upper-third-center'],
    eyePath: 'Spiral from outer edge toward golden intersection',
    visualBalance: 'Natural asymmetry that feels balanced'
  },

  'asymmetric': {
    id: 'asymmetric',
    name: 'Asymmetric / Dynamic',
    description: 'Intentionally unbalanced for visual tension and energy.',
    bestFor: ['modern designs', 'tech events', 'creative workshops', 'youth-focused content'],
    gridLines: {
      vertical: [30, 70],
      horizontal: [25, 75]
    },
    focalPoints: ['upper-third-left', 'lower-third-right', 'middle-right'],
    eyePath: 'Diagonal movement from dominant element to supporting elements',
    visualBalance: 'Tension through calculated imbalance'
  },

  'diagonal': {
    id: 'diagonal',
    name: 'Diagonal / Dynamic Lines',
    description: 'Uses diagonal lines to create movement and energy.',
    bestFor: ['sports events', 'action content', 'product launches', 'dynamic announcements'],
    gridLines: {
      vertical: [25, 50, 75],
      horizontal: [25, 50, 75]
    },
    focalPoints: ['upper-third-right', 'lower-third-left', 'center'],
    eyePath: 'Follows diagonal from corner to corner',
    visualBalance: 'Dynamic tension along diagonal axis'
  },

  'grid': {
    id: 'grid',
    name: 'Grid / Modular',
    description: 'Structured grid system for organized, clean layouts.',
    bestFor: ['information-heavy designs', 'schedules', 'multi-item layouts', 'corporate content'],
    gridLines: {
      vertical: [25, 50, 75],
      horizontal: [25, 50, 75]
    },
    focalPoints: ['center', 'upper-third-center'],
    eyePath: 'Systematic scanning from top-left to bottom-right',
    visualBalance: 'Structured, predictable balance'
  },

  'z-pattern': {
    id: 'z-pattern',
    name: 'Z-Pattern',
    description: 'Follows natural reading pattern for text-heavy content.',
    bestFor: ['posters with multiple text elements', 'announcements', 'advertisements'],
    gridLines: {
      vertical: [20, 80],
      horizontal: [25, 75]
    },
    focalPoints: ['upper-third-left', 'upper-third-right', 'lower-third-left', 'lower-third-right'],
    eyePath: 'Top-left → Top-right → Diagonal down → Bottom-left → Bottom-right',
    visualBalance: 'Guides eye through content in natural reading order'
  },

  'f-pattern': {
    id: 'f-pattern',
    name: 'F-Pattern',
    description: 'Optimized for scanning content quickly.',
    bestFor: ['content-heavy designs', 'news-style layouts', 'information displays'],
    gridLines: {
      vertical: [33.33, 66.67],
      horizontal: [20, 50, 80]
    },
    focalPoints: ['upper-third-left', 'middle-left', 'lower-third-left'],
    eyePath: 'Top horizontal scan → Down left edge → Middle horizontal scan',
    visualBalance: 'Left-weighted with horizontal scanning bands'
  }
}

// ============================================================================
// FORMAT-SPECIFIC COMPOSITIONS
// ============================================================================

export const FORMAT_COMPOSITIONS: Record<string, FormatComposition> = {
  event_poster: {
    format: 'event_poster',
    layout: 'rule-of-thirds',
    focalPoint: 'upper-third-center',
    zones: [
      {
        id: 'header',
        name: 'Header / Branding Zone',
        position: { top: '0%', bottom: '10%', left: '0%', right: '100%' },
        percentageRange: '0-10%',
        purpose: 'Organization branding, event category',
        contentTypes: ['organization_name', 'category_label'],
        breathingRoom: 5,
        keepClear: false
      },
      {
        id: 'hero',
        name: 'Hero / Headline Zone',
        position: { top: '10%', bottom: '55%', left: '0%', right: '100%' },
        percentageRange: '10-55%',
        purpose: 'Event name, main visual impact',
        contentTypes: ['event_title', 'tagline', 'hero_visual'],
        breathingRoom: 10,
        keepClear: false
      },
      {
        id: 'details',
        name: 'Details Zone',
        position: { top: '55%', bottom: '85%', left: '0%', right: '100%' },
        percentageRange: '55-85%',
        purpose: 'Date, time, venue, speaker info',
        contentTypes: ['date', 'time', 'venue', 'speaker_name', 'speaker_title'],
        breathingRoom: 8,
        keepClear: false
      },
      {
        id: 'footer',
        name: 'Footer / Logo Zone',
        position: { top: '85%', bottom: '100%', left: '0%', right: '100%' },
        percentageRange: '85-100%',
        purpose: 'Branding area - keep simple background',
        contentTypes: ['logo_placeholder'],
        breathingRoom: 5,
        keepClear: true
      }
    ],
    visualWeight: 'top-heavy',
    movement: 'subtle-flow',
    depthLayers: {
      background: 'Subtle gradient or solid color with texture',
      midground: 'Supporting visual elements, abstract shapes',
      foreground: 'Text elements, key information'
    },
    specialRules: [
      'Event title must dominate the hero zone',
      'Footer zone must have simple background',
      'Details should be grouped and easily scannable',
      'Visual hierarchy: Title > Speaker > Date/Venue'
    ]
  },

  instagram_story: {
    format: 'instagram_story',
    layout: 'centered',
    focalPoint: 'center',
    zones: [
      {
        id: 'top-safe',
        name: 'Top Safe Zone (Avoid)',
        position: { top: '0%', bottom: '14%', left: '0%', right: '100%' },
        percentageRange: '0-14%',
        purpose: 'Username, story progress bar - AVOID placing content',
        contentTypes: [],
        breathingRoom: 0,
        keepClear: true
      },
      {
        id: 'content',
        name: 'Main Content Zone',
        position: { top: '14%', bottom: '80%', left: '5%', right: '95%' },
        percentageRange: '14-80%',
        purpose: 'All text and visual content',
        contentTypes: ['headline', 'subheadline', 'visual', 'cta'],
        breathingRoom: 10,
        keepClear: false
      },
      {
        id: 'bottom-safe',
        name: 'Bottom Safe Zone (Avoid)',
        position: { top: '80%', bottom: '100%', left: '0%', right: '100%' },
        percentageRange: '80-100%',
        purpose: 'Reply box, "Send message" - AVOID placing content',
        contentTypes: [],
        breathingRoom: 0,
        keepClear: true
      }
    ],
    visualWeight: 'balanced',
    movement: 'static',
    depthLayers: {
      background: 'Full-bleed image or solid color',
      midground: 'Overlay or gradient for text legibility',
      foreground: 'Bold text, minimal elements'
    },
    specialRules: [
      'Keep all text within middle 66% vertically',
      'Maximum 3 lines of text',
      'Bold, high-contrast text for mobile',
      'Avoid top 14% (UI elements) and bottom 20% (reply box)'
    ]
  },

  instagram_post: {
    format: 'instagram_post',
    layout: 'centered',
    focalPoint: 'center',
    zones: [
      {
        id: 'main',
        name: 'Main Content Zone',
        position: { top: '10%', bottom: '90%', left: '10%', right: '90%' },
        percentageRange: '10-90% (centered)',
        purpose: 'All content - centered composition',
        contentTypes: ['headline', 'visual', 'brand_element'],
        breathingRoom: 15,
        keepClear: false
      },
      {
        id: 'margin',
        name: 'Margin Zone',
        position: { top: '0%', bottom: '10%', left: '0%', right: '10%' },
        percentageRange: 'outer 10%',
        purpose: 'Breathing room',
        contentTypes: [],
        breathingRoom: 10,
        keepClear: true
      }
    ],
    visualWeight: 'balanced',
    movement: 'static',
    depthLayers: {
      background: 'Clean background or professional imagery',
      midground: 'Supporting graphics or shapes',
      foreground: 'Headline and key message'
    },
    specialRules: [
      'Square format demands strong center composition',
      'Minimal text - let visuals communicate',
      'High-quality imagery is essential',
      'Consider how it appears in grid (1/3 of screen width)'
    ]
  },

  certificate: {
    format: 'certificate',
    layout: 'centered',
    focalPoint: 'center',
    zones: [
      {
        id: 'border',
        name: 'Border Frame',
        position: { top: '0%', bottom: '100%', left: '0%', right: '100%' },
        percentageRange: 'outer 5-8%',
        purpose: 'Decorative border frame',
        contentTypes: ['border_decoration'],
        breathingRoom: 0,
        keepClear: false
      },
      {
        id: 'seal',
        name: 'Seal Zone',
        position: { top: '5%', bottom: '20%', left: '80%', right: '95%' },
        percentageRange: 'top-right 15%',
        purpose: 'Official seal or emblem',
        contentTypes: ['seal', 'emblem'],
        breathingRoom: 3,
        keepClear: false
      },
      {
        id: 'logo',
        name: 'Logo Zone',
        position: { top: '5%', bottom: '18%', left: '5%', right: '25%' },
        percentageRange: 'top-left 20%',
        purpose: 'Branding area',
        contentTypes: ['logo_placeholder'],
        breathingRoom: 3,
        keepClear: true
      },
      {
        id: 'title',
        name: 'Certificate Title',
        position: { top: '12%', bottom: '25%', left: '20%', right: '80%' },
        percentageRange: '12-25% (centered)',
        purpose: 'Certificate of Achievement/Appreciation',
        contentTypes: ['certificate_type'],
        breathingRoom: 5,
        keepClear: false
      },
      {
        id: 'preface',
        name: 'Preface Zone',
        position: { top: '25%', bottom: '35%', left: '15%', right: '85%' },
        percentageRange: '25-35%',
        purpose: '"This is to certify that"',
        contentTypes: ['preface_text'],
        breathingRoom: 3,
        keepClear: false
      },
      {
        id: 'recipient',
        name: 'Recipient Name (Hero)',
        position: { top: '35%', bottom: '50%', left: '10%', right: '90%' },
        percentageRange: '35-50%',
        purpose: 'Recipient name - largest text',
        contentTypes: ['recipient_name'],
        breathingRoom: 8,
        keepClear: false
      },
      {
        id: 'achievement',
        name: 'Achievement Zone',
        position: { top: '50%', bottom: '65%', left: '15%', right: '85%' },
        percentageRange: '50-65%',
        purpose: 'Achievement description',
        contentTypes: ['achievement_text'],
        breathingRoom: 5,
        keepClear: false
      },
      {
        id: 'signatures',
        name: 'Signature Zone',
        position: { top: '70%', bottom: '90%', left: '10%', right: '90%' },
        percentageRange: '70-90%',
        purpose: 'Signature lines, authority names',
        contentTypes: ['signature_line', 'authority_name', 'authority_title'],
        breathingRoom: 5,
        keepClear: false
      },
      {
        id: 'footer',
        name: 'Footer Zone',
        position: { top: '90%', bottom: '98%', left: '10%', right: '90%' },
        percentageRange: '90-98%',
        purpose: 'Date, certificate number, organization',
        contentTypes: ['date', 'certificate_number'],
        breathingRoom: 3,
        keepClear: false
      }
    ],
    visualWeight: 'balanced',
    movement: 'static',
    depthLayers: {
      background: 'Cream or white parchment texture',
      midground: 'Decorative border, subtle patterns',
      foreground: 'Text hierarchy, seal, signatures'
    },
    specialRules: [
      'Recipient name is the hero element',
      'Perfect symmetry around center axis',
      'Classical serif or elegant typography',
      'Gold accents for premium feel',
      'Logo zone top-left must have simple background'
    ]
  },

  youtube_thumbnail: {
    format: 'youtube_thumbnail',
    layout: 'asymmetric',
    focalPoint: 'middle-left',
    zones: [
      {
        id: 'face',
        name: 'Face Zone',
        position: { top: '10%', bottom: '90%', left: '5%', right: '55%' },
        percentageRange: 'left 50%',
        purpose: 'Face or main subject (50%+ of frame)',
        contentTypes: ['face', 'subject'],
        breathingRoom: 5,
        keepClear: false
      },
      {
        id: 'text',
        name: 'Text Zone',
        position: { top: '15%', bottom: '85%', left: '45%', right: '95%' },
        percentageRange: 'right 50%',
        purpose: 'Bold text, 4-6 words max',
        contentTypes: ['headline', 'hook_text'],
        breathingRoom: 5,
        keepClear: false
      },
      {
        id: 'duration-safe',
        name: 'Duration Badge (Avoid)',
        position: { top: '80%', bottom: '100%', left: '80%', right: '100%' },
        percentageRange: 'bottom-right corner',
        purpose: 'YouTube duration badge - AVOID',
        contentTypes: [],
        breathingRoom: 0,
        keepClear: true
      }
    ],
    visualWeight: 'left-weighted',
    movement: 'dynamic',
    depthLayers: {
      background: 'Vibrant, saturated color or dramatic scene',
      midground: 'Contrast/blur for text legibility',
      foreground: 'Face expression + bold text'
    },
    specialRules: [
      'Must be readable at 120x68px thumbnail size',
      'Face fills 50%+ of frame with expressive emotion',
      'Maximum 4-6 words',
      'High contrast, saturated colors',
      'Avoid bottom-right corner (duration badge)'
    ]
  },

  speaker_poster: {
    format: 'speaker_poster',
    layout: 'rule-of-thirds',
    focalPoint: 'upper-third-right',
    zones: [
      {
        id: 'speaker-photo',
        name: 'Speaker Photo Zone',
        position: { top: '15%', bottom: '85%', left: '55%', right: '95%' },
        percentageRange: 'right 40%',
        purpose: 'Speaker photo overlay area - NO generated faces',
        contentTypes: ['speaker_photo_placeholder'],
        breathingRoom: 5,
        keepClear: true
      },
      {
        id: 'content',
        name: 'Content Zone',
        position: { top: '10%', bottom: '85%', left: '5%', right: '55%' },
        percentageRange: 'left 50%',
        purpose: 'Event title, speaker info, details',
        contentTypes: ['event_title', 'speaker_name', 'speaker_title', 'date', 'venue'],
        breathingRoom: 8,
        keepClear: false
      },
      {
        id: 'footer',
        name: 'Footer / Logo Zone',
        position: { top: '85%', bottom: '98%', left: '5%', right: '50%' },
        percentageRange: '85-98% left',
        purpose: 'Branding area',
        contentTypes: ['logo_placeholder'],
        breathingRoom: 3,
        keepClear: true
      }
    ],
    visualWeight: 'right-weighted',
    movement: 'subtle-flow',
    depthLayers: {
      background: 'Solid color or subtle gradient',
      midground: 'Abstract shapes, brand elements',
      foreground: 'Text on left, photo placeholder on right'
    },
    specialRules: [
      'Speaker photo zone must have clean solid background',
      'DO NOT generate illustrated faces in photo zone',
      'Text content weighted to left side',
      'Photo will be overlaid by Sharp post-processing'
    ]
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get composition layout by type
 */
export function getCompositionLayout(layoutType: LayoutType): CompositionLayout {
  return COMPOSITION_LAYOUTS[layoutType]
}

/**
 * Get format-specific composition
 */
export function getFormatComposition(format: string): FormatComposition | undefined {
  return FORMAT_COMPOSITIONS[format]
}

/**
 * Get zones for a format
 */
export function getFormatZones(format: string): ZoneDefinition[] {
  const composition = FORMAT_COMPOSITIONS[format]
  return composition?.zones || []
}

/**
 * Get zones that must be kept clear (for overlays)
 */
export function getKeepClearZones(format: string): ZoneDefinition[] {
  const zones = getFormatZones(format)
  return zones.filter(z => z.keepClear)
}

/**
 * Build composition context string for prompts
 */
export function buildCompositionContext(format: string): string {
  const composition = FORMAT_COMPOSITIONS[format]
  if (!composition) {
    return 'Use balanced, professional composition with clear visual hierarchy.'
  }

  const layout = COMPOSITION_LAYOUTS[composition.layout]

  let context = `COMPOSITION: ${layout.name}\n`
  context += `Description: ${layout.description}\n`
  context += `Eye path: ${layout.eyePath}\n`
  context += `Focal point: ${composition.focalPoint}\n`
  context += `Visual weight: ${composition.visualWeight}\n\n`

  context += 'ZONES:\n'
  composition.zones.forEach(zone => {
    context += `- ${zone.name} (${zone.percentageRange}): ${zone.purpose}`
    if (zone.keepClear) context += ' [KEEP CLEAR]'
    context += '\n'
  })

  context += '\nDEPTH LAYERS:\n'
  context += `- Background: ${composition.depthLayers.background}\n`
  context += `- Midground: ${composition.depthLayers.midground}\n`
  context += `- Foreground: ${composition.depthLayers.foreground}\n`

  if (composition.specialRules.length > 0) {
    context += '\nRULES:\n'
    composition.specialRules.forEach(rule => {
      context += `- ${rule}\n`
    })
  }

  return context
}

/**
 * Generate JSON composition specification for Gemini
 */
export function buildCompositionJSON(format: string): object {
  const composition = FORMAT_COMPOSITIONS[format]
  const layout = composition
    ? COMPOSITION_LAYOUTS[composition.layout]
    : COMPOSITION_LAYOUTS['rule-of-thirds']

  if (!composition) {
    return {
      layout: 'rule-of-thirds',
      focalPoint: 'upper-third-center',
      visualWeight: 'balanced',
      guidance: 'Use professional composition with clear visual hierarchy'
    }
  }

  return {
    layout: {
      type: composition.layout,
      name: layout.name,
      description: layout.description,
      eyePath: layout.eyePath
    },
    focalPoint: composition.focalPoint,
    visualWeight: composition.visualWeight,
    movement: composition.movement,
    zones: composition.zones.map(zone => ({
      id: zone.id,
      name: zone.name,
      position: zone.percentageRange,
      purpose: zone.purpose,
      keepClear: zone.keepClear,
      contentTypes: zone.contentTypes
    })),
    depthLayers: composition.depthLayers,
    specialRules: composition.specialRules,
    gridLines: layout.gridLines
  }
}

/**
 * Generate ASCII zone diagram for Gemini understanding
 */
export function buildZoneDiagram(format: string): string {
  const composition = FORMAT_COMPOSITIONS[format]
  if (!composition) return ''

  // Simple ASCII representation
  let diagram = '\nZONE LAYOUT DIAGRAM:\n'
  diagram += '┌─────────────────────────────────────┐\n'

  composition.zones.forEach(zone => {
    const clearIndicator = zone.keepClear ? ' [CLEAR]' : ''
    diagram += `│ ${zone.name.padEnd(25)} ${zone.percentageRange.padEnd(8)}${clearIndicator} │\n`
    diagram += '├─────────────────────────────────────┤\n'
  })

  diagram = diagram.slice(0, -38) // Remove last separator
  diagram += '└─────────────────────────────────────┘\n'

  return diagram
}
