/**
 * Language and Script Detection for Typography Intelligence
 * Maps languages to scripts and provides font recommendations
 */

export type Script =
  | 'latin'
  | 'devanagari'
  | 'tamil'
  | 'telugu'
  | 'kannada'
  | 'malayalam'
  | 'bengali'
  | 'gujarati'
  | 'gurmukhi'
  | 'odia'

export interface LanguageConfig {
  code: string
  name: string
  script: Script
  nativeName: string
}

/**
 * Language configurations matching languageConfigs.ts
 */
export const LANGUAGE_CONFIGS: Record<string, LanguageConfig> = {
  en: { code: 'en', name: 'English', script: 'latin', nativeName: 'English' },
  hi: { code: 'hi', name: 'Hindi', script: 'devanagari', nativeName: 'हिन्दी' },
  ta: { code: 'ta', name: 'Tamil', script: 'tamil', nativeName: 'தமிழ்' },
  te: { code: 'te', name: 'Telugu', script: 'telugu', nativeName: 'తెలుగు' },
  kn: { code: 'kn', name: 'Kannada', script: 'kannada', nativeName: 'ಕನ್ನಡ' },
  ml: { code: 'ml', name: 'Malayalam', script: 'malayalam', nativeName: 'മലയാളം' },
  bn: { code: 'bn', name: 'Bengali', script: 'bengali', nativeName: 'বাংলা' },
  gu: { code: 'gu', name: 'Gujarati', script: 'gujarati', nativeName: 'ગુજરાતી' },
  pa: { code: 'pa', name: 'Punjabi', script: 'gurmukhi', nativeName: 'ਪੰਜਾਬੀ' },
  or: { code: 'or', name: 'Odia', script: 'odia', nativeName: 'ଓଡ଼ିଆ' },
  mr: { code: 'mr', name: 'Marathi', script: 'devanagari', nativeName: 'मराठी' }
}

/**
 * Script-specific font families for different typography styles
 */
export const SCRIPT_FONTS = {
  latin: {
    sansSerif: ['Inter', 'Roboto', 'Open Sans', 'Lato'],
    serif: ['Merriweather', 'Lora', 'Playfair Display', 'Cormorant'],
    display: ['Bebas Neue', 'Oswald', 'Righteous', 'Anton'],
    monospace: ['Roboto Mono', 'Source Code Pro']
  },
  devanagari: {
    sansSerif: ['Noto Sans Devanagari', 'Mukta', 'Hind'],
    serif: ['Noto Serif Devanagari', 'Tiro Devanagari Hindi'],
    display: ['Mukta Bold', 'Hind Bold'],
    monospace: ['Noto Sans Devanagari']
  },
  tamil: {
    sansSerif: ['Noto Sans Tamil', 'Lohit Tamil', 'Catamaran'],
    serif: ['Noto Serif Tamil', 'Arima Madurai'],
    display: ['Noto Sans Tamil Bold', 'Catamaran Bold'],
    monospace: ['Noto Sans Tamil']
  },
  telugu: {
    sansSerif: ['Noto Sans Telugu', 'Lohit Telugu', 'Mallanna'],
    serif: ['Noto Serif Telugu', 'Tiro Telugu'],
    display: ['Noto Sans Telugu Bold', 'Mallanna'],
    monospace: ['Noto Sans Telugu']
  },
  kannada: {
    sansSerif: ['Noto Sans Kannada', 'Lohit Kannada', 'Akaya Kanadaka'],
    serif: ['Noto Serif Kannada', 'Tiro Kannada'],
    display: ['Noto Sans Kannada Bold'],
    monospace: ['Noto Sans Kannada']
  },
  malayalam: {
    sansSerif: ['Noto Sans Malayalam', 'Manjari', 'Gayathri'],
    serif: ['Noto Serif Malayalam', 'Chilanka'],
    display: ['Noto Sans Malayalam Bold', 'Manjari Bold'],
    monospace: ['Noto Sans Malayalam']
  },
  bengali: {
    sansSerif: ['Noto Sans Bengali', 'Mukta Malar', 'Hind Siliguri'],
    serif: ['Noto Serif Bengali', 'Tiro Bangla'],
    display: ['Noto Sans Bengali Bold'],
    monospace: ['Noto Sans Bengali']
  },
  gujarati: {
    sansSerif: ['Noto Sans Gujarati', 'Mukta Vaani', 'Hind Vadodara'],
    serif: ['Noto Serif Gujarati'],
    display: ['Noto Sans Gujarati Bold'],
    monospace: ['Noto Sans Gujarati']
  },
  gurmukhi: {
    sansSerif: ['Noto Sans Gurmukhi', 'Mukta Mahee'],
    serif: ['Noto Serif Gurmukhi'],
    display: ['Noto Sans Gurmukhi Bold'],
    monospace: ['Noto Sans Gurmukhi']
  },
  odia: {
    sansSerif: ['Noto Sans Oriya', 'Baloo Da'],
    serif: ['Noto Serif Oriya'],
    display: ['Noto Sans Oriya Bold'],
    monospace: ['Noto Sans Oriya']
  }
}

/**
 * Get script for a given language code
 */
export function getScriptForLanguage(languageCode: string): Script {
  const config = LANGUAGE_CONFIGS[languageCode.toLowerCase()]
  return config?.script || 'latin' // Default to Latin if unknown
}

/**
 * Get font family for a script and style
 */
export function getFontForScript(
  script: Script,
  style: 'sansSerif' | 'serif' | 'display' | 'monospace' = 'sansSerif'
): string {
  const fonts = SCRIPT_FONTS[script]?.[style] || SCRIPT_FONTS.latin[style]
  return fonts[0] // Return first (primary) font
}

/**
 * Get all available fonts for a script
 */
export function getAllFontsForScript(script: Script): string[] {
  const scriptFonts = SCRIPT_FONTS[script] || SCRIPT_FONTS.latin
  return [
    ...scriptFonts.sansSerif,
    ...scriptFonts.serif,
    ...scriptFonts.display
  ]
}

/**
 * Detect script from text content (basic heuristic)
 */
export function detectScriptFromText(text: string): Script {
  // Unicode ranges for different scripts
  const scriptRanges = {
    devanagari: /[\u0900-\u097F]/,
    tamil: /[\u0B80-\u0BFF]/,
    telugu: /[\u0C00-\u0C7F]/,
    kannada: /[\u0C80-\u0CFF]/,
    malayalam: /[\u0D00-\u0D7F]/,
    bengali: /[\u0980-\u09FF]/,
    gujarati: /[\u0A80-\u0AFF]/,
    gurmukhi: /[\u0A00-\u0A7F]/,
    odia: /[\u0B00-\u0B7F]/
  }

  for (const [script, regex] of Object.entries(scriptRanges)) {
    if (regex.test(text)) {
      return script as Script
    }
  }

  return 'latin' // Default to Latin
}

/**
 * Get language config by code
 */
export function getLanguageConfig(languageCode: string): LanguageConfig {
  return LANGUAGE_CONFIGS[languageCode.toLowerCase()] || LANGUAGE_CONFIGS.en
}

/**
 * Check if a language code is supported
 */
export function isLanguageSupported(languageCode: string): boolean {
  return languageCode.toLowerCase() in LANGUAGE_CONFIGS
}

/**
 * Get font recommendation for typography style and script
 */
export function getFontRecommendation(
  typographyStyle: string, // 'clean sans-serif', 'serif', 'display'
  script: Script
): string {
  // Map typography style to font style
  if (typographyStyle.includes('sans')) {
    return getFontForScript(script, 'sansSerif')
  } else if (typographyStyle.includes('serif')) {
    return getFontForScript(script, 'serif')
  } else if (typographyStyle.includes('display') || typographyStyle.includes('bold') || typographyStyle.includes('impact')) {
    return getFontForScript(script, 'display')
  }

  // Default to sans-serif
  return getFontForScript(script, 'sansSerif')
}

/**
 * Convert font style description to specific font name based on script
 */
export function mapFontStyleToFont(
  fontStyleDescription: string,
  script: Script
): string {
  const lower = fontStyleDescription.toLowerCase()

  // Sans-serif patterns
  if (lower.includes('inter') || lower.includes('modern sans')) {
    return script === 'latin' ? 'Inter' : getFontForScript(script, 'sansSerif')
  }
  if (lower.includes('montserrat') || lower.includes('clean sans')) {
    return script === 'latin' ? 'Montserrat' : getFontForScript(script, 'sansSerif')
  }
  if (lower.includes('poppins') || lower.includes('friendly')) {
    return script === 'latin' ? 'Poppins' : getFontForScript(script, 'sansSerif')
  }
  if (lower.includes('roboto')) {
    return script === 'latin' ? 'Roboto' : getFontForScript(script, 'sansSerif')
  }

  // Serif patterns
  if (lower.includes('playfair') || lower.includes('elegant serif')) {
    return script === 'latin' ? 'Playfair Display' : getFontForScript(script, 'serif')
  }
  if (lower.includes('cormorant') || lower.includes('traditional serif')) {
    return script === 'latin' ? 'Cormorant' : getFontForScript(script, 'serif')
  }
  if (lower.includes('merriweather')) {
    return script === 'latin' ? 'Merriweather' : getFontForScript(script, 'serif')
  }

  // Display patterns
  if (lower.includes('bebas') || lower.includes('impact')) {
    return script === 'latin' ? 'Bebas Neue' : getFontForScript(script, 'display')
  }
  if (lower.includes('oswald') || lower.includes('bold display')) {
    return script === 'latin' ? 'Oswald' : getFontForScript(script, 'display')
  }

  // Rounded/Playful
  if (lower.includes('quicksand') || lower.includes('rounded')) {
    return script === 'latin' ? 'Quicksand' : getFontForScript(script, 'sansSerif')
  }
  if (lower.includes('nunito') || lower.includes('playful')) {
    return script === 'latin' ? 'Nunito' : getFontForScript(script, 'sansSerif')
  }

  // Default fallback
  return getFontForScript(script, 'sansSerif')
}
