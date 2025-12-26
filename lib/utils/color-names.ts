/**
 * Color Name Translator
 * Converts HEX color codes to descriptive natural language names
 * Helps AI models better understand exact color tones and personalities
 */

export interface ColorDescription {
  name: string // e.g., "Dark Navy Blue"
  personality: string[] // e.g., ["professional", "trustworthy", "formal"]
  mood: string // e.g., "Calm and authoritative"
  visualEquivalents: string[] // e.g., ["Deep ocean water", "Business attire"]
  notEquivalents: string[] // e.g., ["Bright blue", "Sky blue"]
  rgb: string // e.g., "RGB(0, 91, 150)"
  hsl: string // e.g., "HSL(200°, 100%, 29%)"
}

/**
 * Convert HEX to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null
}

/**
 * Convert RGB to HSL
 */
function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255
  g /= 255
  b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6
        break
      case g:
        h = ((b - r) / d + 2) / 6
        break
      case b:
        h = ((r - g) / d + 4) / 6
        break
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  }
}

/**
 * Determine hue name from hue angle
 */
function getHueName(hue: number): string {
  if (hue < 15 || hue >= 345) return 'Red'
  if (hue >= 15 && hue < 45) return 'Orange'
  if (hue >= 45 && hue < 70) return 'Yellow'
  if (hue >= 70 && hue < 150) return 'Green'
  if (hue >= 150 && hue < 260) return 'Blue'
  if (hue >= 260 && hue < 290) return 'Purple'
  if (hue >= 290 && hue < 345) return 'Pink'
  return 'Gray'
}

/**
 * Determine lightness descriptor
 */
function getLightnessDescriptor(lightness: number): string {
  if (lightness < 20) return 'Very Dark'
  if (lightness >= 20 && lightness < 40) return 'Dark'
  if (lightness >= 40 && lightness < 60) return 'Medium'
  if (lightness >= 60 && lightness < 80) return 'Light'
  return 'Very Light'
}

/**
 * Determine saturation descriptor
 */
function getSaturationDescriptor(saturation: number): string {
  if (saturation < 10) return 'Muted'
  if (saturation >= 10 && saturation < 40) return 'Soft'
  if (saturation >= 40 && saturation < 70) return 'Moderate'
  if (saturation >= 70 && saturation < 90) return 'Vibrant'
  return 'Vivid'
}

/**
 * Get color personality traits based on hue and characteristics
 */
function getColorPersonality(hue: string, lightness: number, saturation: number): string[] {
  const personality: string[] = []

  // Hue-based personalities
  switch (hue) {
    case 'Blue':
      personality.push('professional', 'trustworthy', 'calm')
      if (lightness < 40) personality.push('authoritative', 'formal')
      if (lightness > 60) personality.push('friendly', 'approachable')
      break
    case 'Red':
      personality.push('energetic', 'passionate', 'bold')
      if (saturation > 70) personality.push('attention-grabbing', 'urgent')
      break
    case 'Orange':
      personality.push('warm', 'enthusiastic', 'creative')
      if (saturation > 70) personality.push('vibrant', 'playful')
      break
    case 'Yellow':
      personality.push('optimistic', 'cheerful', 'attention-catching')
      if (lightness > 60) personality.push('bright', 'uplifting')
      break
    case 'Green':
      personality.push('natural', 'growth', 'balanced')
      if (lightness < 40) personality.push('stable', 'mature')
      if (lightness > 60) personality.push('fresh', 'renewable')
      break
    case 'Purple':
      personality.push('luxurious', 'creative', 'imaginative')
      if (lightness < 40) personality.push('sophisticated', 'premium')
      break
    case 'Pink':
      personality.push('warm', 'approachable', 'youthful')
      if (saturation > 70) personality.push('vibrant', 'energetic')
      break
    case 'Gray':
      personality.push('neutral', 'balanced', 'professional')
      if (lightness < 40) personality.push('sophisticated', 'formal')
      break
  }

  // Lightness-based modifiers
  if (lightness < 30) {
    personality.push('dramatic', 'strong')
  } else if (lightness > 70) {
    personality.push('soft', 'gentle')
  }

  // Saturation-based modifiers
  if (saturation < 20) {
    personality.push('subtle', 'understated')
  } else if (saturation > 80) {
    personality.push('bold', 'striking')
  }

  return personality
}

/**
 * Get mood description
 */
function getMood(hue: string, lightness: number, saturation: number): string {
  if (hue === 'Blue' && lightness < 40) return 'Calm and authoritative'
  if (hue === 'Blue' && lightness > 60) return 'Peaceful and serene'
  if (hue === 'Red' && saturation > 70) return 'Energetic and passionate'
  if (hue === 'Orange' && saturation > 70) return 'Warm and enthusiastic'
  if (hue === 'Yellow') return 'Cheerful and optimistic'
  if (hue === 'Green' && lightness < 40) return 'Stable and grounded'
  if (hue === 'Green' && lightness > 60) return 'Fresh and natural'
  if (hue === 'Purple' && lightness < 40) return 'Luxurious and sophisticated'
  if (hue === 'Pink') return 'Warm and friendly'
  if (hue === 'Gray') return 'Neutral and balanced'
  return 'Balanced and harmonious'
}

/**
 * Get visual equivalents for the color
 */
function getVisualEquivalents(hue: string, lightness: number, saturation: number): string[] {
  const equivalents: string[] = []

  if (hue === 'Blue' && lightness < 40) {
    equivalents.push('Deep ocean water', 'Professional business attire', 'Midnight sky', 'Navy uniforms')
  } else if (hue === 'Blue' && lightness >= 40 && lightness < 60) {
    equivalents.push('Clear daytime sky', 'Denim fabric', 'Corporate branding')
  } else if (hue === 'Blue' && lightness >= 60) {
    equivalents.push('Sky blue', 'Baby blue', 'Light water')
  }

  if (hue === 'Orange' && saturation > 70) {
    equivalents.push('Sunset glow', 'Warm citrus', 'Autumn leaves', 'Energetic accent')
  } else if (hue === 'Orange' && saturation <= 70) {
    equivalents.push('Terracotta', 'Clay', 'Earthy tones')
  }

  if (hue === 'Red' && saturation > 70) {
    equivalents.push('Stop signs', 'Emergency alerts', 'Bold statements')
  }

  if (hue === 'Green' && lightness < 40) {
    equivalents.push('Forest green', 'Deep foliage', 'Nature reserves')
  } else if (hue === 'Green' && lightness >= 60) {
    equivalents.push('Fresh spring grass', 'Mint', 'Growth and renewal')
  }

  if (hue === 'Purple' && lightness < 40) {
    equivalents.push('Royal purple', 'Luxury brands', 'Premium products')
  }

  if (hue === 'Yellow') {
    equivalents.push('Sunshine', 'Caution signs', 'Highlights and emphasis')
  }

  if (hue === 'Gray') {
    if (lightness < 30) equivalents.push('Charcoal', 'Slate', 'Professional backgrounds')
    else if (lightness < 60) equivalents.push('Stone', 'Concrete', 'Neutral backgrounds')
    else equivalents.push('Light gray', 'Silver', 'Soft backgrounds')
  }

  // Fallback
  if (equivalents.length === 0) {
    equivalents.push(`${getLightnessDescriptor(lightness).toLowerCase()} ${hue.toLowerCase()} tones`)
  }

  return equivalents
}

/**
 * Get NOT equivalents (colors to avoid confusion with)
 */
function getNotEquivalents(hue: string, lightness: number, saturation: number): string[] {
  const notEquivalents: string[] = []

  if (hue === 'Blue' && lightness < 40) {
    notEquivalents.push('Bright blue', 'Sky blue', 'Cyan', 'Light blue', 'Turquoise')
  } else if (hue === 'Blue' && lightness >= 40 && lightness < 60) {
    notEquivalents.push('Navy blue', 'Light blue', 'Teal')
  } else if (hue === 'Blue' && lightness >= 60) {
    notEquivalents.push('Dark blue', 'Navy', 'Royal blue')
  }

  if (hue === 'Orange' && saturation > 70) {
    notEquivalents.push('Red-orange', 'Pale orange', 'Peach', 'Coral')
  }

  if (hue === 'Red' && saturation > 70) {
    notEquivalents.push('Pink', 'Maroon', 'Burgundy')
  }

  if (hue === 'Green' && lightness < 40) {
    notEquivalents.push('Lime green', 'Bright green', 'Neon green')
  } else if (hue === 'Green' && lightness >= 60) {
    notEquivalents.push('Dark green', 'Forest green', 'Olive')
  }

  if (hue === 'Purple') {
    notEquivalents.push('Pink', 'Magenta', 'Lavender')
  }

  if (hue === 'Yellow') {
    notEquivalents.push('Gold', 'Orange-yellow', 'Lime yellow')
  }

  return notEquivalents
}

/**
 * Main function: Describe a color from HEX code
 */
export function describeColor(hex: string): ColorDescription {
  // Convert hex to RGB
  const rgb = hexToRgb(hex)
  if (!rgb) {
    // Fallback for invalid hex
    return {
      name: hex,
      personality: [],
      mood: 'Unknown',
      visualEquivalents: [],
      notEquivalents: [],
      rgb: hex,
      hsl: hex,
    }
  }

  // Convert RGB to HSL
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b)

  // Determine color characteristics
  const hueName = getHueName(hsl.h)
  const lightnessDesc = getLightnessDescriptor(hsl.l)
  const saturationDesc = getSaturationDescriptor(hsl.s)

  // Build color name
  const name = `${lightnessDesc} ${saturationDesc} ${hueName}`

  // Get personality, mood, and equivalents
  const personality = getColorPersonality(hueName, hsl.l, hsl.s)
  const mood = getMood(hueName, hsl.l, hsl.s)
  const visualEquivalents = getVisualEquivalents(hueName, hsl.l, hsl.s)
  const notEquivalents = getNotEquivalents(hueName, hsl.l, hsl.s)

  return {
    name,
    personality,
    mood,
    visualEquivalents,
    notEquivalents,
    rgb: `RGB(${rgb.r}, ${rgb.g}, ${rgb.b})`,
    hsl: `HSL(${hsl.h}°, ${hsl.s}%, ${hsl.l}%)`,
  }
}

/**
 * Build a narrative description for AI prompts
 */
export function buildColorNarrative(hex: string): string {
  const desc = describeColor(hex)
  return `${desc.name} (${hex} or ${desc.rgb}) - A ${desc.personality.slice(0, 3).join(', ')} color that conveys ${desc.mood.toLowerCase()}. Visual equivalent: ${desc.visualEquivalents[0]}. NOT: ${desc.notEquivalents.slice(0, 2).join(', ')}.`
}

/**
 * Build detailed color reference for AI prompts
 */
export function buildColorReference(
  hex: string,
  role: 'PRIMARY' | 'SECONDARY' | 'ACCENT' | 'CUSTOM' = 'CUSTOM'
): string {
  const desc = describeColor(hex)
  return `
${role} COLOR: ${desc.name} (${hex} or ${desc.rgb})
  Personality: ${desc.personality.join(', ')}
  Mood: ${desc.mood}
  Visual equivalent: ${desc.visualEquivalents.join(', ')}
  NOT: ${desc.notEquivalents.join(', ')}
  HSL: ${desc.hsl}
`.trim()
}
