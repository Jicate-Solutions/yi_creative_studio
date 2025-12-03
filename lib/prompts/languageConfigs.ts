/**
 * Language Configurations for AI Prompt Generation
 * Provides detailed language settings for multi-language creative generation
 *
 * Each language config includes:
 * - code: ISO language code
 * - name: Full language name
 * - nativeName: Language name in its own script
 * - direction: Text direction (ltr/rtl)
 * - fontFamilies: Recommended fonts for the language
 * - promptInstruction: AI prompt instruction for generating text in this language
 * - typographyGuidance: Specific typography rules for the language
 */

export interface LanguageConfig {
  code: string
  name: string
  nativeName: string
  direction: 'ltr' | 'rtl'
  fontFamilies: string[]
  promptInstruction: string
  typographyGuidance: string
  textRenderingHints: string[]
}

// ============================================================================
// Language Configurations
// ============================================================================

export const LANGUAGE_CONFIGS: Record<string, LanguageConfig> = {
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    direction: 'ltr',
    fontFamilies: ['Inter', 'Roboto', 'Open Sans', 'Montserrat', 'Poppins'],
    promptInstruction: 'Generate all text content in English. Use clear, professional English that is easy to read and understand.',
    typographyGuidance: 'Use modern sans-serif typography. Headlines should be bold and impactful. Body text should be clean and readable.',
    textRenderingHints: [
      'Use standard left-to-right text alignment',
      'Headlines can use title case or sentence case',
      'Maintain consistent spacing between letters and words',
    ],
  },

  ta: {
    code: 'ta',
    name: 'Tamil',
    nativeName: 'தமிழ்',
    direction: 'ltr',
    fontFamilies: ['Noto Sans Tamil', 'Latha', 'Vijaya', 'TSCu_Paranar'],
    promptInstruction: 'Generate all text content in Tamil (தமிழ்). Use proper Tamil script with correct vowel marks and consonant conjuncts. The text should feel natural to Tamil readers.',
    typographyGuidance: 'Use Tamil-optimized fonts. Allow adequate line height for Tamil script. Headlines should use bold weights while maintaining readability of Tamil characters.',
    textRenderingHints: [
      'Tamil script requires more vertical space than Latin',
      'Avoid extremely condensed fonts for Tamil text',
      'Ensure clear rendering of vowel marks (உயிர்)',
      'Use adequate letter spacing for Tamil consonant clusters',
    ],
  },

  hi: {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    direction: 'ltr',
    fontFamilies: ['Noto Sans Devanagari', 'Mangal', 'Kokila', 'Aparajita'],
    promptInstruction: 'Generate all text content in Hindi (हिन्दी) using Devanagari script. Use proper Hindi vocabulary and sentence structure that feels natural to Hindi speakers.',
    typographyGuidance: 'Use Devanagari-optimized fonts. The shirorekha (headline) should connect properly across characters. Allow adequate line height for proper rendering of matras (vowel marks).',
    textRenderingHints: [
      'Devanagari requires proper shirorekha (top line) connection',
      'Ensure clear rendering of vowel marks (matras)',
      'Use adequate line height (1.5x or more)',
      'Headlines should maintain character clarity at large sizes',
    ],
  },

  es: {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    direction: 'ltr',
    fontFamilies: ['Inter', 'Roboto', 'Open Sans', 'Lato', 'Source Sans Pro'],
    promptInstruction: 'Generate all text content in Spanish (Español). Use proper Spanish grammar including accents (á, é, í, ó, ú), ñ, and inverted punctuation (¿, ¡) where appropriate.',
    typographyGuidance: 'Use modern sans-serif typography that supports Spanish diacritical marks. Ensure accented characters are clearly visible.',
    textRenderingHints: [
      'Ensure proper rendering of accented vowels (á, é, í, ó, ú)',
      'Support for ñ character is essential',
      'Use inverted punctuation at start of questions/exclamations',
    ],
  },

  fr: {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    direction: 'ltr',
    fontFamilies: ['Inter', 'Roboto', 'Open Sans', 'Nunito', 'Lato'],
    promptInstruction: 'Generate all text content in French (Français). Use proper French grammar including accents (é, è, ê, ë, à, â, ù, û, ç, œ) and French quotation marks (« ») where appropriate.',
    typographyGuidance: 'Use elegant typography that supports French diacritical marks. French design often favors sophisticated, clean aesthetics.',
    textRenderingHints: [
      'Support for French accents (é, è, ê, ë, à, â, ù, û, ô, î, ï, ç)',
      'Use proper French quotation marks « » (guillemets)',
      'Support for ligatures (œ, æ)',
    ],
  },

  ar: {
    code: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    direction: 'rtl',
    fontFamilies: ['Noto Sans Arabic', 'Amiri', 'Cairo', 'Tajawal'],
    promptInstruction: 'Generate all text content in Arabic (العربية). Use proper Arabic script with correct letter connections and diacritical marks. Text should flow naturally from right to left.',
    typographyGuidance: 'Use Arabic-optimized fonts that support proper letter joining. The design should accommodate right-to-left text flow. Allow for graceful Arabic calligraphic elements where appropriate.',
    textRenderingHints: [
      'CRITICAL: Arabic is RIGHT-TO-LEFT (RTL) text',
      'Arabic letters change shape based on position (initial, medial, final, isolated)',
      'Ensure proper letter connection (kashida where appropriate)',
      'Allow adequate line height for Arabic script and diacritics',
      'Numbers in Arabic can be either Western (1,2,3) or Arabic-Indic (١,٢,٣)',
    ],
  },

  ja: {
    code: 'ja',
    name: 'Japanese',
    nativeName: '日本語',
    direction: 'ltr',
    fontFamilies: ['Noto Sans JP', 'Hiragino Sans', 'Meiryo', 'Yu Gothic'],
    promptInstruction: 'Generate all text content in Japanese (日本語). Use appropriate mix of Kanji, Hiragana, and Katakana. The text should follow natural Japanese writing conventions.',
    typographyGuidance: 'Use Japanese-optimized fonts. Japanese text can be set horizontally (横書き) or vertically (縦書き) depending on the design. Maintain balance between different character types.',
    textRenderingHints: [
      'Japanese uses three scripts: Kanji (漢字), Hiragana (ひらがな), Katakana (カタカナ)',
      'Support for full-width characters and punctuation',
      'Can be rendered horizontally or vertically',
      'Use appropriate Japanese punctuation (。、「」)',
    ],
  },

  zh: {
    code: 'zh',
    name: 'Chinese (Simplified)',
    nativeName: '简体中文',
    direction: 'ltr',
    fontFamilies: ['Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', 'Source Han Sans SC'],
    promptInstruction: 'Generate all text content in Simplified Chinese (简体中文). Use proper Chinese characters and sentence structure that feels natural to Chinese readers.',
    typographyGuidance: 'Use Chinese-optimized fonts. Chinese characters should be rendered with clarity at all sizes. Maintain consistent character spacing.',
    textRenderingHints: [
      'Use Simplified Chinese characters (简体字)',
      'Support for Chinese punctuation (。，！？、「」)',
      'Characters should have equal spacing',
      'Can be rendered horizontally or vertically',
    ],
  },

  ko: {
    code: 'ko',
    name: 'Korean',
    nativeName: '한국어',
    direction: 'ltr',
    fontFamilies: ['Noto Sans KR', 'Malgun Gothic', 'Apple SD Gothic Neo', 'Nanum Gothic'],
    promptInstruction: 'Generate all text content in Korean (한국어) using Hangul script. Use proper Korean grammar and sentence structure.',
    typographyGuidance: 'Use Korean-optimized fonts. Hangul characters should be rendered clearly with proper proportions. Modern Korean design often favors clean, minimal typography.',
    textRenderingHints: [
      'Korean uses Hangul (한글) syllabic blocks',
      'Support for Korean punctuation',
      'Ensure clear rendering of complex syllable blocks',
      'Allow adequate character spacing',
    ],
  },

  pt: {
    code: 'pt',
    name: 'Portuguese',
    nativeName: 'Português',
    direction: 'ltr',
    fontFamilies: ['Inter', 'Roboto', 'Open Sans', 'Lato', 'Nunito'],
    promptInstruction: 'Generate all text content in Portuguese (Português). Use proper Portuguese grammar including accents (á, à, â, ã, é, ê, í, ó, ô, õ, ú) and cedilla (ç).',
    typographyGuidance: 'Use modern sans-serif typography that supports Portuguese diacritical marks. Ensure all accented characters are clearly visible.',
    textRenderingHints: [
      'Support for Portuguese accents and cedilla (ç)',
      'Proper rendering of nasal vowels (ã, õ)',
      'Use standard left-to-right alignment',
    ],
  },

  de: {
    code: 'de',
    name: 'German',
    nativeName: 'Deutsch',
    direction: 'ltr',
    fontFamilies: ['Inter', 'Roboto', 'Open Sans', 'Source Sans Pro', 'Lato'],
    promptInstruction: 'Generate all text content in German (Deutsch). Use proper German grammar including umlauts (ä, ö, ü) and eszett (ß). German nouns should be capitalized.',
    typographyGuidance: 'Use typography that supports German characters. German often has long compound words, so font selection should accommodate varying word lengths.',
    textRenderingHints: [
      'Support for umlauts (ä, ö, ü) and eszett (ß)',
      'German capitalizes all nouns',
      'German compound words can be very long - plan for text wrapping',
    ],
  },
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get language configuration by code
 * Falls back to English if language not found
 */
export function getLanguageConfig(languageCode: string): LanguageConfig {
  return LANGUAGE_CONFIGS[languageCode] || LANGUAGE_CONFIGS['en']
}

/**
 * Get all available languages as options
 */
export function getAvailableLanguages(): Array<{ value: string; label: string; nativeName: string }> {
  return Object.values(LANGUAGE_CONFIGS).map((config) => ({
    value: config.code,
    label: config.name,
    nativeName: config.nativeName,
  }))
}

/**
 * Check if a language is RTL (right-to-left)
 */
export function isRTLLanguage(languageCode: string): boolean {
  const config = LANGUAGE_CONFIGS[languageCode]
  return config?.direction === 'rtl'
}

/**
 * Get font family recommendations for a language
 */
export function getFontFamilies(languageCode: string): string[] {
  const config = getLanguageConfig(languageCode)
  return config.fontFamilies
}

/**
 * Get primary font family for a language
 */
export function getPrimaryFont(languageCode: string): string {
  const fonts = getFontFamilies(languageCode)
  return fonts[0] || 'Inter'
}

/**
 * Build language instruction for AI prompts
 * This is the key function for Issue #3 - ensuring language is properly communicated to AI
 */
export function buildLanguagePromptSection(languageCode: string): string {
  const config = getLanguageConfig(languageCode)

  const sections: string[] = []

  // Main language instruction
  sections.push(`LANGUAGE REQUIREMENT (CRITICAL):
${config.promptInstruction}`)

  // Text direction guidance for RTL languages
  if (config.direction === 'rtl') {
    sections.push(`TEXT DIRECTION: This is a RIGHT-TO-LEFT language. All text must flow from right to left. Align text to the right edge and ensure the visual design accommodates RTL reading flow.`)
  }

  // Typography guidance
  sections.push(`TYPOGRAPHY FOR ${config.name.toUpperCase()}:
${config.typographyGuidance}`)

  // Font recommendations
  sections.push(`RECOMMENDED FONTS: ${config.fontFamilies.slice(0, 3).join(', ')}`)

  // Text rendering hints
  if (config.textRenderingHints.length > 0) {
    sections.push(`TEXT RENDERING HINTS:
${config.textRenderingHints.map((hint) => `- ${hint}`).join('\n')}`)
  }

  return sections.join('\n\n')
}

/**
 * Build compact language instruction for shorter prompts (e.g., Ideogram)
 */
export function buildCompactLanguageInstruction(languageCode: string): string {
  const config = getLanguageConfig(languageCode)

  const parts: string[] = []

  // Core instruction
  parts.push(`text in ${config.name}`)

  // RTL indicator if needed
  if (config.direction === 'rtl') {
    parts.push('right-to-left text')
  }

  // Native name for AI context
  if (config.nativeName !== config.name) {
    parts.push(`(${config.nativeName})`)
  }

  return parts.join(', ')
}

/**
 * Get typography direction instruction (enhanced version of the original)
 */
export function getEnhancedTypographyDirection(languageCode: string): string {
  const config = getLanguageConfig(languageCode)

  let direction = `Typography should feel modern and confident. Headlines demand attention while remaining elegant. Body text maintains clarity and readability.`

  // Add language-specific guidance
  direction += ` All text appears in ${config.name}${config.nativeName !== config.name ? ` (${config.nativeName})` : ''}.`

  // Add direction-specific guidance
  if (config.direction === 'rtl') {
    direction += ` Text flows RIGHT-TO-LEFT. Ensure proper alignment and visual balance for RTL reading.`
  }

  // Add typography guidance
  direction += ` ${config.typographyGuidance}`

  return direction
}
