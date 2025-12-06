/**
 * Color Psychology System
 *
 * Comprehensive color psychology database for AI image generation.
 * Provides emotional associations, cultural contexts, and usage guidance.
 *
 * This system helps Gemini understand WHY certain colors work for specific contexts.
 */

// ============================================================================
// TYPES
// ============================================================================

export interface ColorPsychology {
  name: string
  hex: string
  rgb: { r: number; g: number; b: number }
  emotions: string[]
  associations: string[]
  bestFor: string[]
  avoidFor: string[]
  culturalNotes: {
    india?: string
    global?: string
  }
  contrastPairs: string[]     // Colors that work well with this
  wcagOnWhite: 'AA' | 'AAA' | 'fail'
  wcagOnBlack: 'AA' | 'AAA' | 'fail'
}

export interface ColorHarmony {
  name: string
  description: string
  colors: string[]            // Hex values
  mood: string[]
  bestFor: string[]
}

export interface EventTypeColorRecommendation {
  eventType: string
  primaryColors: string[]
  secondaryColors: string[]
  accentColors: string[]
  mood: string
  reasoning: string
}

// ============================================================================
// PRIMARY COLOR PSYCHOLOGY DATABASE
// ============================================================================

export const COLOR_PSYCHOLOGY: Record<string, ColorPsychology> = {
  // === BLUES ===
  navy: {
    name: 'Navy Blue',
    hex: '#003366',
    rgb: { r: 0, g: 51, b: 102 },
    emotions: ['trust', 'authority', 'stability', 'professionalism'],
    associations: ['corporate', 'finance', 'technology', 'government'],
    bestFor: ['business conferences', 'leadership summits', 'formal events', 'annual meetings'],
    avoidFor: ['children events', 'casual social gatherings', 'creative workshops'],
    culturalNotes: {
      india: 'Associated with corporate sector and trustworthiness',
      global: 'Universal symbol of professionalism'
    },
    contrastPairs: ['#FFFFFF', '#FFD700', '#F5F5F5', '#E8E8E8'],
    wcagOnWhite: 'AAA',
    wcagOnBlack: 'fail'
  },

  royalBlue: {
    name: 'Royal Blue',
    hex: '#4169E1',
    rgb: { r: 65, g: 105, b: 225 },
    emotions: ['confidence', 'intelligence', 'trust', 'dependability'],
    associations: ['technology', 'innovation', 'digital', 'modern'],
    bestFor: ['tech events', 'innovation summits', 'startup pitches', 'digital conferences'],
    avoidFor: ['traditional ceremonies', 'heritage events'],
    culturalNotes: {
      india: 'Popular for tech and startup events',
      global: 'Associated with innovation and progress'
    },
    contrastPairs: ['#FFFFFF', '#FFD700', '#F0F0F0'],
    wcagOnWhite: 'AA',
    wcagOnBlack: 'fail'
  },

  skyBlue: {
    name: 'Sky Blue',
    hex: '#87CEEB',
    rgb: { r: 135, g: 206, b: 235 },
    emotions: ['calm', 'peace', 'openness', 'freedom'],
    associations: ['wellness', 'healthcare', 'travel', 'nature'],
    bestFor: ['wellness events', 'healthcare conferences', 'mindfulness workshops'],
    avoidFor: ['urgent announcements', 'action-oriented events'],
    culturalNotes: {
      india: 'Associated with spirituality and peace',
      global: 'Universal calming effect'
    },
    contrastPairs: ['#003366', '#1a1a1a', '#333333'],
    wcagOnWhite: 'fail',
    wcagOnBlack: 'AAA'
  },

  // === REDS ===
  crimson: {
    name: 'Crimson Red',
    hex: '#DC143C',
    rgb: { r: 220, g: 20, b: 60 },
    emotions: ['energy', 'passion', 'urgency', 'excitement'],
    associations: ['action', 'sales', 'entertainment', 'sports'],
    bestFor: ['product launches', 'sales events', 'entertainment', 'sports events'],
    avoidFor: ['healthcare', 'funeral services', 'meditation events'],
    culturalNotes: {
      india: 'Auspicious, associated with weddings and festivals',
      global: 'Commands attention, can signal danger if overused'
    },
    contrastPairs: ['#FFFFFF', '#F5F5F5', '#FFD700'],
    wcagOnWhite: 'AA',
    wcagOnBlack: 'fail'
  },

  maroon: {
    name: 'Maroon',
    hex: '#800000',
    rgb: { r: 128, g: 0, b: 0 },
    emotions: ['sophistication', 'richness', 'elegance', 'warmth'],
    associations: ['luxury', 'tradition', 'heritage', 'academia'],
    bestFor: ['award ceremonies', 'heritage events', 'academic functions', 'wine events'],
    avoidFor: ['children events', 'tech startups', 'casual meetups'],
    culturalNotes: {
      india: 'Associated with tradition and academic institutions',
      global: 'Conveys elegance and established reputation'
    },
    contrastPairs: ['#FFFFFF', '#FFD700', '#F5DEB3'],
    wcagOnWhite: 'AAA',
    wcagOnBlack: 'fail'
  },

  // === GREENS ===
  emerald: {
    name: 'Emerald Green',
    hex: '#50C878',
    rgb: { r: 80, g: 200, b: 120 },
    emotions: ['growth', 'prosperity', 'harmony', 'renewal'],
    associations: ['nature', 'sustainability', 'health', 'finance'],
    bestFor: ['sustainability events', 'health conferences', 'nature events', 'growth initiatives'],
    avoidFor: ['automotive events', 'technology launches'],
    culturalNotes: {
      india: 'Associated with prosperity and new beginnings',
      global: 'Universal symbol of growth and nature'
    },
    contrastPairs: ['#FFFFFF', '#1a1a1a', '#003366'],
    wcagOnWhite: 'fail',
    wcagOnBlack: 'AAA'
  },

  forestGreen: {
    name: 'Forest Green',
    hex: '#228B22',
    rgb: { r: 34, g: 139, b: 34 },
    emotions: ['stability', 'endurance', 'nature', 'wealth'],
    associations: ['environment', 'outdoor', 'organic', 'traditional'],
    bestFor: ['environmental events', 'outdoor activities', 'organic products', 'traditional gatherings'],
    avoidFor: ['modern tech events', 'fashion shows'],
    culturalNotes: {
      india: 'Symbol of fertility and nature',
      global: 'Associated with eco-friendly and sustainable practices'
    },
    contrastPairs: ['#FFFFFF', '#FFD700', '#F5F5F5'],
    wcagOnWhite: 'AA',
    wcagOnBlack: 'fail'
  },

  // === GOLDS & YELLOWS ===
  gold: {
    name: 'Gold',
    hex: '#FFD700',
    rgb: { r: 255, g: 215, b: 0 },
    emotions: ['success', 'achievement', 'luxury', 'prestige'],
    associations: ['awards', 'premium', 'celebration', 'excellence'],
    bestFor: ['award ceremonies', 'milestone celebrations', 'luxury events', 'achievements'],
    avoidFor: ['budget events', 'casual meetups', 'healthcare'],
    culturalNotes: {
      india: 'Highly auspicious, associated with prosperity and divinity',
      global: 'Universal symbol of excellence and premium quality'
    },
    contrastPairs: ['#003366', '#800000', '#1a1a1a', '#2C3E50'],
    wcagOnWhite: 'fail',
    wcagOnBlack: 'AAA'
  },

  amber: {
    name: 'Amber',
    hex: '#FFBF00',
    rgb: { r: 255, g: 191, b: 0 },
    emotions: ['warmth', 'optimism', 'creativity', 'enthusiasm'],
    associations: ['creativity', 'innovation', 'startup', 'energy'],
    bestFor: ['creative workshops', 'startup events', 'brainstorming sessions', 'innovation labs'],
    avoidFor: ['formal corporate events', 'serious conferences'],
    culturalNotes: {
      india: 'Associated with positivity and warmth',
      global: 'Signals creativity and approachability'
    },
    contrastPairs: ['#003366', '#1a1a1a', '#333333'],
    wcagOnWhite: 'fail',
    wcagOnBlack: 'AAA'
  },

  // === PURPLES ===
  purple: {
    name: 'Royal Purple',
    hex: '#6B3FA0',
    rgb: { r: 107, g: 63, b: 160 },
    emotions: ['creativity', 'wisdom', 'royalty', 'spirituality'],
    associations: ['luxury', 'creativity', 'imagination', 'premium'],
    bestFor: ['creative conferences', 'art events', 'premium launches', 'spiritual gatherings'],
    avoidFor: ['budget events', 'industrial conferences'],
    culturalNotes: {
      india: 'Associated with spirituality and wisdom',
      global: 'Symbol of creativity and premium quality'
    },
    contrastPairs: ['#FFFFFF', '#FFD700', '#F5F5F5'],
    wcagOnWhite: 'AA',
    wcagOnBlack: 'fail'
  },

  // === ORANGES ===
  orange: {
    name: 'Vibrant Orange',
    hex: '#FF6B35',
    rgb: { r: 255, g: 107, b: 53 },
    emotions: ['enthusiasm', 'creativity', 'determination', 'adventure'],
    associations: ['youth', 'sports', 'adventure', 'food'],
    bestFor: ['youth events', 'sports gatherings', 'food festivals', 'adventure activities'],
    avoidFor: ['formal corporate events', 'healthcare conferences'],
    culturalNotes: {
      india: 'Sacred color, associated with spirituality and energy',
      global: 'Represents enthusiasm and adventure'
    },
    contrastPairs: ['#FFFFFF', '#003366', '#1a1a1a'],
    wcagOnWhite: 'fail',
    wcagOnBlack: 'AAA'
  },

  // === NEUTRALS ===
  charcoal: {
    name: 'Charcoal',
    hex: '#36454F',
    rgb: { r: 54, g: 69, b: 79 },
    emotions: ['sophistication', 'formality', 'elegance', 'seriousness'],
    associations: ['luxury', 'formal', 'professional', 'timeless'],
    bestFor: ['formal events', 'luxury launches', 'executive meetings', 'photography'],
    avoidFor: ['children events', 'festive celebrations'],
    culturalNotes: {
      india: 'Associated with professionalism and sophistication',
      global: 'Universal elegance and timelessness'
    },
    contrastPairs: ['#FFFFFF', '#FFD700', '#50C878'],
    wcagOnWhite: 'AAA',
    wcagOnBlack: 'fail'
  },

  cream: {
    name: 'Cream',
    hex: '#FFFDD0',
    rgb: { r: 255, g: 253, b: 208 },
    emotions: ['elegance', 'calm', 'warmth', 'tradition'],
    associations: ['classic', 'certificates', 'formal documents', 'vintage'],
    bestFor: ['certificates', 'formal invitations', 'traditional events', 'weddings'],
    avoidFor: ['tech events', 'modern startups'],
    culturalNotes: {
      india: 'Associated with purity and traditional ceremonies',
      global: 'Classic elegance and timeless appeal'
    },
    contrastPairs: ['#003366', '#800000', '#36454F', '#1a1a1a'],
    wcagOnWhite: 'fail',
    wcagOnBlack: 'AAA'
  },

  white: {
    name: 'Pure White',
    hex: '#FFFFFF',
    rgb: { r: 255, g: 255, b: 255 },
    emotions: ['purity', 'simplicity', 'clarity', 'cleanliness'],
    associations: ['minimalist', 'modern', 'healthcare', 'clean'],
    bestFor: ['modern events', 'healthcare', 'minimalist designs', 'tech launches'],
    avoidFor: ['traditional Indian ceremonies alone', 'festive events alone'],
    culturalNotes: {
      india: 'Associated with mourning when alone; purity when combined with other colors',
      global: 'Clean, modern, professional'
    },
    contrastPairs: ['#003366', '#800000', '#36454F', '#1a1a1a', '#228B22'],
    wcagOnWhite: 'fail',
    wcagOnBlack: 'AAA'
  }
}

// ============================================================================
// COLOR HARMONIES
// ============================================================================

export const COLOR_HARMONIES: ColorHarmony[] = [
  {
    name: 'Corporate Trust',
    description: 'Navy + Gold + White - Professional authority with premium feel',
    colors: ['#003366', '#FFD700', '#FFFFFF'],
    mood: ['professional', 'trustworthy', 'premium'],
    bestFor: ['business conferences', 'award ceremonies', 'leadership summits']
  },
  {
    name: 'Innovation Energy',
    description: 'Royal Blue + Orange + White - Modern tech with creative energy',
    colors: ['#4169E1', '#FF6B35', '#FFFFFF'],
    mood: ['innovative', 'energetic', 'modern'],
    bestFor: ['tech conferences', 'startup events', 'product launches']
  },
  {
    name: 'Growth & Prosperity',
    description: 'Emerald + Gold + Cream - Nature meets success',
    colors: ['#50C878', '#FFD700', '#FFFDD0'],
    mood: ['prosperous', 'natural', 'harmonious'],
    bestFor: ['sustainability events', 'financial conferences', 'growth celebrations']
  },
  {
    name: 'Creative Premium',
    description: 'Purple + Gold + White - Luxury creativity',
    colors: ['#6B3FA0', '#FFD700', '#FFFFFF'],
    mood: ['creative', 'luxurious', 'imaginative'],
    bestFor: ['art exhibitions', 'creative workshops', 'design conferences']
  },
  {
    name: 'Traditional Elegance',
    description: 'Maroon + Gold + Cream - Heritage sophistication',
    colors: ['#800000', '#FFD700', '#FFFDD0'],
    mood: ['traditional', 'elegant', 'prestigious'],
    bestFor: ['award ceremonies', 'cultural events', 'heritage celebrations']
  },
  {
    name: 'Youth Energy',
    description: 'Orange + Sky Blue + White - Fun and approachable',
    colors: ['#FF6B35', '#87CEEB', '#FFFFFF'],
    mood: ['youthful', 'energetic', 'approachable'],
    bestFor: ['youth events', 'sports gatherings', 'community activities']
  },
  {
    name: 'Wellness Calm',
    description: 'Sky Blue + Forest Green + White - Health and nature',
    colors: ['#87CEEB', '#228B22', '#FFFFFF'],
    mood: ['calm', 'healthy', 'natural'],
    bestFor: ['wellness retreats', 'health conferences', 'mindfulness workshops']
  },
  {
    name: 'Minimal Modern',
    description: 'Charcoal + White + Gold accent - Sophisticated simplicity',
    colors: ['#36454F', '#FFFFFF', '#FFD700'],
    mood: ['modern', 'sophisticated', 'clean'],
    bestFor: ['executive events', 'photography exhibitions', 'luxury launches']
  }
]

// ============================================================================
// EVENT TYPE RECOMMENDATIONS
// ============================================================================

export const EVENT_COLOR_RECOMMENDATIONS: EventTypeColorRecommendation[] = [
  {
    eventType: 'business_conference',
    primaryColors: ['#003366', '#36454F'],
    secondaryColors: ['#FFFFFF', '#F5F5F5'],
    accentColors: ['#FFD700', '#4169E1'],
    mood: 'professional, trustworthy',
    reasoning: 'Navy and charcoal convey authority; gold adds premium feel'
  },
  {
    eventType: 'tech_summit',
    primaryColors: ['#4169E1', '#003366'],
    secondaryColors: ['#FFFFFF', '#F0F0F0'],
    accentColors: ['#50C878', '#FF6B35'],
    mood: 'innovative, modern',
    reasoning: 'Blue tones suggest technology; green/orange accents add innovation energy'
  },
  {
    eventType: 'award_ceremony',
    primaryColors: ['#800000', '#003366'],
    secondaryColors: ['#FFD700', '#FFFDD0'],
    accentColors: ['#FFFFFF'],
    mood: 'prestigious, elegant',
    reasoning: 'Gold is essential for awards; maroon/navy provide formal backdrop'
  },
  {
    eventType: 'workshop_training',
    primaryColors: ['#4169E1', '#50C878'],
    secondaryColors: ['#FFFFFF', '#F5F5F5'],
    accentColors: ['#FFBF00', '#FF6B35'],
    mood: 'engaging, growth-oriented',
    reasoning: 'Blue for trust in learning; green for growth; warm accents for energy'
  },
  {
    eventType: 'networking_event',
    primaryColors: ['#4169E1', '#6B3FA0'],
    secondaryColors: ['#FFFFFF', '#F5F5F5'],
    accentColors: ['#FFD700', '#FF6B35'],
    mood: 'approachable, professional',
    reasoning: 'Friendly blues with creative purple; warm accents encourage connection'
  },
  {
    eventType: 'product_launch',
    primaryColors: ['#DC143C', '#FF6B35'],
    secondaryColors: ['#FFFFFF', '#1a1a1a'],
    accentColors: ['#FFD700'],
    mood: 'exciting, attention-grabbing',
    reasoning: 'Red/orange demand attention; gold adds premium positioning'
  },
  {
    eventType: 'cultural_festival',
    primaryColors: ['#FF6B35', '#DC143C'],
    secondaryColors: ['#FFD700', '#FFFDD0'],
    accentColors: ['#50C878', '#6B3FA0'],
    mood: 'festive, vibrant',
    reasoning: 'Warm colors reflect Indian festive traditions; multi-color shows celebration'
  },
  {
    eventType: 'health_wellness',
    primaryColors: ['#87CEEB', '#228B22'],
    secondaryColors: ['#FFFFFF', '#F5F5F5'],
    accentColors: ['#50C878'],
    mood: 'calm, natural, healthy',
    reasoning: 'Blue and green evoke nature and calm; essential for wellness events'
  },
  {
    eventType: 'certificate',
    primaryColors: ['#003366', '#800000'],
    secondaryColors: ['#FFFDD0', '#FFFFFF'],
    accentColors: ['#FFD700'],
    mood: 'formal, prestigious, traditional',
    reasoning: 'Classic navy/maroon with gold accents; cream background for elegance'
  }
]

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get psychology data for a color by hex or name
 */
export function getColorPsychology(colorKey: string): ColorPsychology | undefined {
  // Try direct key lookup
  if (COLOR_PSYCHOLOGY[colorKey]) {
    return COLOR_PSYCHOLOGY[colorKey]
  }

  // Try hex lookup
  const byHex = Object.values(COLOR_PSYCHOLOGY).find(
    c => c.hex.toLowerCase() === colorKey.toLowerCase()
  )
  if (byHex) return byHex

  // Try name lookup
  const byName = Object.values(COLOR_PSYCHOLOGY).find(
    c => c.name.toLowerCase() === colorKey.toLowerCase()
  )
  return byName
}

/**
 * Get recommended colors for an event type
 */
export function getEventColorRecommendation(
  eventType: string
): EventTypeColorRecommendation | undefined {
  return EVENT_COLOR_RECOMMENDATIONS.find(
    r => r.eventType.toLowerCase() === eventType.toLowerCase()
  )
}

/**
 * Get harmonious color palettes for a primary color
 */
export function getHarmoniousPalettes(primaryHex: string): ColorHarmony[] {
  return COLOR_HARMONIES.filter(h =>
    h.colors.some(c => c.toLowerCase() === primaryHex.toLowerCase())
  )
}

/**
 * Build a color context string for prompts
 */
export function buildColorContext(primaryHex: string, eventType?: string): string {
  const color = getColorPsychology(primaryHex)
  const eventRec = eventType ? getEventColorRecommendation(eventType) : undefined

  let context = ''

  if (color) {
    context += `PRIMARY COLOR: ${color.name} (${color.hex})\n`
    context += `Psychology: ${color.emotions.join(', ')}\n`
    context += `Best for: ${color.bestFor.slice(0, 3).join(', ')}\n`
    context += `Contrast pairs: ${color.contrastPairs.slice(0, 3).join(', ')}\n`
  }

  if (eventRec) {
    context += `\nEVENT TYPE: ${eventRec.eventType}\n`
    context += `Recommended mood: ${eventRec.mood}\n`
    context += `Color reasoning: ${eventRec.reasoning}\n`
  }

  return context
}

/**
 * Generate JSON color specification for Gemini
 */
export function buildColorJSON(
  primaryHex: string,
  secondaryHex?: string,
  eventType?: string
): object {
  const primary = getColorPsychology(primaryHex)
  const secondary = secondaryHex ? getColorPsychology(secondaryHex) : undefined
  const eventRec = eventType ? getEventColorRecommendation(eventType) : undefined

  return {
    primary: {
      hex: primaryHex,
      name: primary?.name || 'Custom',
      psychology: primary?.emotions || [],
      usage: 'primary backgrounds, headlines'
    },
    secondary: secondaryHex ? {
      hex: secondaryHex,
      name: secondary?.name || 'Custom',
      psychology: secondary?.emotions || [],
      usage: 'secondary elements, body text backgrounds'
    } : undefined,
    eventContext: eventRec ? {
      mood: eventRec.mood,
      reasoning: eventRec.reasoning
    } : undefined,
    contrastGuidance: {
      wcagLevel: 'AAA',
      minimumRatio: 7,
      textOnBackground: primary?.wcagOnWhite === 'AAA' ? 'white-on-color' : 'dark-on-light'
    }
  }
}
