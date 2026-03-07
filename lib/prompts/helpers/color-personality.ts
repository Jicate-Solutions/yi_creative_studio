import type { ResolvedColors } from '@/lib/utils/resolve-color-config'

/**
 * Color Personality Analysis System
 *
 * Maps hex colors to emotional characteristics and visual metaphors
 * for dynamic story-driven background generation.
 *
 * v1.0 - Phase 2: Replace hardcoded event templates with AI-driven generation
 */

export interface ColorPersonality {
  name: string              // "Nature/Growth", "Energy/Dynamic"
  mood: string              // "organic", "explosive", "calm" (for backward compatibility)
  primaryMood: string       // Primary mood descriptor (e.g., "organic", "radiant")
  secondaryMood: string     // Secondary mood descriptor (e.g., "calming", "energetic")
  energyLevel: string       // Energy intensity ("low", "medium", "high", "very high")
  visualElements: string[]  // ["flowing forms", "botanical patterns"]
  backgroundStyle: string   // "Organic flowing environment"
  lightingStyle: string     // "Soft natural light", "Neon glow"
  depthLayers: {
    foreground: string      // "Gentle leaf silhouettes"
    midground: string       // "Text content layer"
    background: string      // "Deep forest atmosphere"
  }
}

/**
 * v25.0 Formality type for controlling creative vs literal output
 */
export type FormalityLevel = 'casual' | 'professional' | 'premium' | 'exclusive'

/**
 * Analyzes a hex color and returns its emotional personality and visual characteristics
 *
 * v25.0: Added optional formality parameter to suppress metaphorical elements for formal events
 * When formality is 'premium' or 'exclusive', returns professional corporate elements
 * instead of creative metaphors (e.g., no botanical patterns for green colors)
 */
export function analyzeColorPersonality(
  hex: string,
  formality?: FormalityLevel
): ColorPersonality {
  // v25.0: Check if this is a formal event requiring literal imagery
  const isFormalEvent = formality === 'premium' || formality === 'exclusive'
  // Normalize hex to uppercase without #
  const normalized = hex.replace('#', '').toUpperCase()

  // Convert hex to RGB
  const r = parseInt(normalized.substring(0, 2), 16)
  const g = parseInt(normalized.substring(2, 4), 16)
  const b = parseInt(normalized.substring(4, 6), 16)

  // Calculate hue (0-360), saturation (0-100), lightness (0-100)
  const rNorm = r / 255
  const gNorm = g / 255
  const bNorm = b / 255

  const max = Math.max(rNorm, gNorm, bNorm)
  const min = Math.min(rNorm, gNorm, bNorm)
  const delta = max - min

  // Calculate hue
  let hue = 0
  if (delta !== 0) {
    if (max === rNorm) {
      hue = 60 * (((gNorm - bNorm) / delta) % 6)
    } else if (max === gNorm) {
      hue = 60 * ((bNorm - rNorm) / delta + 2)
    } else {
      hue = 60 * ((rNorm - gNorm) / delta + 4)
    }
  }
  if (hue < 0) hue += 360

  // Calculate saturation and lightness
  const lightness = (max + min) / 2
  const saturation = delta === 0 ? 0 : delta / (1 - Math.abs(2 * lightness - 1))

  // Determine personality based on hue ranges

  // Green Family (80-160°) - v24.12.6: COLOR AS COLOR, NOT THEME TRIGGER
  // GREEN = professional/geometric elements, NOT botanical/nature
  if (hue >= 80 && hue < 160) {
    // v24.12.6: Return professional elements for ALL events (not just premium/exclusive)
    // This prevents green color from triggering "trees, leaves, botanical" visual elements
    console.log('[Color Personality] v24.12.6: Green color detected - using professional elements (no botanical)')
    return {
      name: 'Fresh/Professional',
      mood: 'professional',
      primaryMood: 'professional',
      secondaryMood: 'trustworthy',
      energyLevel: 'medium',
      visualElements: [
        'clean geometric shapes',
        'professional gradients',
        'modern architectural elements',
        'structured grid patterns',
        'elegant line work',
        'contemporary design aesthetics'
      ],
      backgroundStyle: 'Professional modern environment with elegant depth - clean gradients, sophisticated compositions, premium finish',
      lightingStyle: 'Professional studio lighting, clean ambient glow, elegant rim lighting',
      depthLayers: {
        foreground: 'Subtle geometric overlays or professional patterns (10-15% opacity)',
        midground: 'Text content with clean professional framing',
        background: 'Modern professional atmospheric depth - clean, sophisticated, premium'
      }
    }
  }

  // Yellow/Gold Family (40-80°) - Energy, Optimism, Innovation
  if (hue >= 40 && hue < 80) {
    return {
      name: 'Innovation/Optimism',
      mood: 'radiant',
      primaryMood: 'radiant',
      secondaryMood: 'energetic',
      energyLevel: 'high',
      visualElements: [
        'light rays and beams',
        'explosive starburst patterns',
        'innovation symbols (lightbulbs, sparks)',
        'ascending trajectories',
        'golden hour atmospheres',
        'breakthrough metaphors'
      ],
      backgroundStyle: 'Radiant energy environment with dynamic light - think breakthrough moments, golden hour glow, or innovation spark visuals',
      lightingStyle: 'God-rays, dramatic backlighting, golden hour warmth',
      depthLayers: {
        foreground: 'Light ray overlays or spark patterns (15-25% opacity)',
        midground: 'Text content with radiant framing',
        background: 'Luminous atmospheric depth - sunrise/sunset, laboratory breakthrough, or innovation hub'
      }
    }
  }

  // Orange/Red-Orange Family (0-40°) - Energy, Action, Passion
  if ((hue >= 0 && hue < 40) || hue >= 340) {
    return {
      name: 'Energy/Dynamic',
      mood: 'explosive',
      primaryMood: 'explosive',
      secondaryMood: 'intense',
      energyLevel: 'very high',
      visualElements: [
        'dynamic energy radiations',
        'explosive radial patterns',
        'kinetic energy lines',
        'fire/heat metaphors',
        'action trajectories',
        'power symbols'
      ],
      backgroundStyle: 'High-energy dynamic environment with motion - think explosive energy fields, speed trails, or kinetic action scenes',
      lightingStyle: 'Dramatic neon glow, motion-based light streaks, fire/heat luminescence',
      depthLayers: {
        foreground: 'Dynamic energy streaks or light trails (20-30% opacity)',
        midground: 'Text content with dynamic energy framing',
        background: 'Kinetic atmospheric scene - speed trails, explosion radials, or power station visuals'
      }
    }
  }

  // Red/Magenta Family (320-340°) - Passion, Love, Celebration
  if (hue >= 320 && hue < 340) {
    return {
      name: 'Passion/Celebration',
      mood: 'vibrant',
      primaryMood: 'vibrant',
      secondaryMood: 'joyful',
      energyLevel: 'high',
      visualElements: [
        'flowing ribbons and streamers',
        'heart motifs',
        'celebration patterns',
        'romantic atmospheres',
        'festival energy',
        'love symbols'
      ],
      backgroundStyle: 'Vibrant celebration environment with emotional depth - think festival atmospheres, romantic settings, or joyful gatherings',
      lightingStyle: 'Warm romantic glow, celebration spotlights, soft diffused warmth',
      depthLayers: {
        foreground: 'Ribbon or confetti overlays (15-25% opacity)',
        midground: 'Text content with celebratory framing',
        background: 'Emotional atmospheric scene - festival lights, romantic sunset, or party venue'
      }
    }
  }

  // Purple/Violet Family (260-320°) - Creative, Luxury, Wisdom
  if (hue >= 260 && hue < 320) {
    return {
      name: 'Creative/Luxury',
      mood: 'elegant',
      primaryMood: 'elegant',
      secondaryMood: 'sophisticated',
      energyLevel: 'medium',
      visualElements: [
        'flowing elegant curves',
        'premium textures',
        'mystical patterns',
        'artistic brush strokes',
        'luxury materials (silk, velvet)',
        'creative tools (palette, brush)'
      ],
      backgroundStyle: 'Premium elegant environment with sophisticated depth - think luxury settings, artistic studios, or mystical atmospheres',
      lightingStyle: 'Soft diffused premium lighting, mystical glow, elegant rim lighting',
      depthLayers: {
        foreground: 'Elegant flowing patterns or artistic overlays (10-20% opacity)',
        midground: 'Text content with premium framing',
        background: 'Sophisticated atmospheric depth - luxury venue, art gallery, or mystical scene'
      }
    }
  }

  // Blue Family (200-260°) - Trust, Professional, Calm
  if (hue >= 200 && hue < 260) {
    return {
      name: 'Trust/Professional',
      mood: 'structured',
      primaryMood: 'structured',
      secondaryMood: 'reliable',
      energyLevel: 'low',
      visualElements: [
        'clean geometric shapes',
        'structured grids',
        'professional patterns',
        'technology circuits',
        'corporate symbols',
        'stability metaphors'
      ],
      backgroundStyle: 'Clean professional environment with structured depth - think corporate settings, technology spaces, or modern architecture',
      lightingStyle: 'Clean even lighting, professional studio lighting, cool ambient glow',
      depthLayers: {
        foreground: 'Subtle geometric overlays or grid patterns (10-15% opacity)',
        midground: 'Text content with clean professional framing',
        background: 'Structured atmospheric depth - modern office, tech hub, or architectural scene'
      }
    }
  }

  // Cyan/Turquoise Family (160-200°) - Fresh, Communication, Health
  if (hue >= 160 && hue < 200) {
    return {
      name: 'Fresh/Communication',
      mood: 'fluid',
      primaryMood: 'fluid',
      secondaryMood: 'refreshing',
      energyLevel: 'medium',
      visualElements: [
        'flowing water patterns',
        'communication waves',
        'fresh air currents',
        'health symbols (heartbeat, wellness)',
        'connectivity networks',
        'freshness metaphors'
      ],
      backgroundStyle: 'Fluid fresh environment with flowing depth - think water scenes, communication networks, or wellness spaces',
      lightingStyle: 'Fresh daylight, underwater glow, clean crisp lighting',
      depthLayers: {
        foreground: 'Flowing water or wave overlays (15-20% opacity)',
        midground: 'Text content with fluid framing',
        background: 'Fresh atmospheric scene - ocean/water, communication hub, or wellness center'
      }
    }
  }

  // Default fallback (should rarely be reached)
  return {
    name: 'Balanced/Neutral',
    mood: 'versatile',
    primaryMood: 'versatile',
    secondaryMood: 'balanced',
    energyLevel: 'medium',
    visualElements: [
      'balanced compositions',
      'subtle patterns',
      'universal symbols',
      'clean layouts',
      'professional aesthetics'
    ],
    backgroundStyle: 'Balanced professional environment with subtle depth',
    lightingStyle: 'Neutral balanced lighting',
    depthLayers: {
      foreground: 'Subtle pattern overlays (10% opacity)',
      midground: 'Text content with clean framing',
      background: 'Professional atmospheric depth'
    }
  }
}

/**
 * Generates a color-aware background description for dynamic prompt building
 * Combines color personality with event type context
 */
export function generateColorAwareBackground(
  eventType: string,
  colors: ResolvedColors
): string {
  const personality = analyzeColorPersonality(colors.primaryColor)

  // Map event types to thematic contexts
  const eventThemes: Record<string, string> = {
    conference: 'professional gathering with knowledge exchange',
    workshop: 'hands-on learning environment',
    seminar: 'educational presentation space',
    webinar: 'virtual learning atmosphere',
    meetup: 'community connection setting',
    networking: 'professional relationship building',
    celebration: 'joyful milestone moment',
    birthday: 'personal celebration atmosphere',
    anniversary: 'commemorative milestone',
    achievement: 'success recognition moment',
    launch: 'exciting debut unveiling',
    innovation: 'breakthrough discovery moment',
    sustainability: 'eco-conscious initiative',
    health: 'wellness and vitality focus',
    technology: 'cutting-edge tech advancement',
    education: 'learning and growth journey',
    community: 'collective gathering space',
    leadership: 'inspiring guidance moment',
    volunteer: 'giving back initiative',
    fundraiser: 'community support effort'
  }

  const eventContext = eventThemes[eventType.toLowerCase()] || 'meaningful event'

  // Combine color personality with event context for unique background
  const backgroundDescription = `
BACKGROUND COMPOSITION (Color-Driven Story):

Primary Color Personality: ${personality.name}
Mood: ${personality.mood}

Visual Story:
Create a ${personality.mood} ${eventContext} environment using ${colors.primaryColor} as the dominant atmospheric color.

Background Style: ${personality.backgroundStyle}

Visual Elements to Include:
${personality.visualElements.map(el => `- ${el}`).join('\n')}

Lighting: ${personality.lightingStyle}

Depth Layers (Cinematic Composition):
- Foreground: ${personality.depthLayers.foreground}
- Midground: ${personality.depthLayers.midground}
- Background: ${personality.depthLayers.background}

Color Integration:
- Primary (${colors.primaryColor}): Dominant atmospheric color - EXACT tone, not interpretation
- Secondary (${colors.secondaryColor}): Accent highlights and key elements
- Accent (${colors.accentColor}): Call-to-action elements and focus points

CRITICAL: The background MUST reflect the color's emotional personality (${personality.name}).
DO NOT use generic gradients or event-type defaults.
THINK: What story does ${colors.primaryColor} tell for this ${eventType}?
`.trim()

  return backgroundDescription
}

/**
 * Generates visual metaphors based on event type and color personality
 * Used for decorative elements that enhance the narrative
 */
export function generateVisualMetaphors(
  eventType: string,
  colorPersonality: ColorPersonality
): string[] {
  const metaphorMap: Record<string, string[]> = {
    innovation: [
      'Lightbulbs morphing into rocket trails',
      'Neural network patterns forming breakthrough symbols',
      'Gear mechanisms transforming into digital circuits'
    ],
    health: [
      'Organic cellular patterns with gentle pulse',
      'Heartbeat waveforms flowing into wellness symbols',
      'DNA helix transforming into growth spirals'
    ],
    networking: [
      'Magnetic field lines connecting professional silhouettes',
      'Network nodes forming constellation patterns',
      'Handshake symbols creating connection webs'
    ],
    sustainability: [
      'Tree roots morphing into circuit boards',
      'Wind turbines forming into energy waves',
      'Recycling symbols creating infinite loops'
    ],
    leadership: [
      'Mountain peaks with ascending paths',
      'Compass rose pointing to growth directions',
      'Torch flames illuminating pathways forward'
    ],
    education: [
      'Book pages transforming into knowledge trees',
      'Graduation caps forming into stars',
      'Learning paths creating growth trajectories'
    ]
  }

  const baseMetaphors = metaphorMap[eventType.toLowerCase()] || [
    'Abstract flowing patterns suggesting movement and progress',
    'Geometric shapes creating depth and structure',
    'Subtle symbolic elements reinforcing the theme'
  ]

  // Enhance metaphors with color personality elements
  const enhancedMetaphors = baseMetaphors.map(metaphor => {
    return `${metaphor} (rendered in ${colorPersonality.mood} ${colorPersonality.name.toLowerCase()} style)`
  })

  return enhancedMetaphors
}

/**
 * Validates if a color hex is within a specific hue range
 * Useful for testing color personality mapping
 */
export function isColorInHueRange(hex: string, minHue: number, maxHue: number): boolean {
  const normalized = hex.replace('#', '').toUpperCase()
  const r = parseInt(normalized.substring(0, 2), 16)
  const g = parseInt(normalized.substring(2, 4), 16)
  const b = parseInt(normalized.substring(4, 6), 16)

  const rNorm = r / 255
  const gNorm = g / 255
  const bNorm = b / 255

  const max = Math.max(rNorm, gNorm, bNorm)
  const min = Math.min(rNorm, gNorm, bNorm)
  const delta = max - min

  let hue = 0
  if (delta !== 0) {
    if (max === rNorm) {
      hue = 60 * (((gNorm - bNorm) / delta) % 6)
    } else if (max === gNorm) {
      hue = 60 * ((bNorm - rNorm) / delta + 2)
    } else {
      hue = 60 * ((rNorm - gNorm) / delta + 4)
    }
  }
  if (hue < 0) hue += 360

  return hue >= minHue && hue < maxHue
}
