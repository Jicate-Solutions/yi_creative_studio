/**
 * Text-to-Path Converter using opentype.js
 *
 * Converts text strings to SVG path elements, eliminating the need for
 * font rendering at SVG-to-PNG conversion time. This solves the Vercel Lambda
 * font rendering issue where:
 * - Resvg: Finds fonts but renders blank glyphs
 * - Sharp (librsvg): Requires Fontconfig which Lambda doesn't have
 *
 * Solution: Convert text to paths BEFORE rendering.
 * SVG paths are just coordinates - no font loading needed!
 *
 * @see https://github.com/opentypejs/opentype.js
 */

import opentype from 'opentype.js'
import path from 'path'
import fs from 'fs'

// Cache loaded fonts to avoid repeated file reads
const fontCache = new Map<string, opentype.Font>()

// Font file mapping - MUST USE TTF FORMAT
// opentype.js does NOT support WOFF2 (only TTF, OTF, WOFF v1)
// Error if WOFF2: "Unsupported OpenType signature wOF2"
const FONT_FILES: Record<string, Record<string, string>> = {
  poppins: {
    regular: 'poppins-regular.ttf',  // TTF format for opentype.js
    bold: 'poppins-bold.ttf',
  },
  montserrat: {
    regular: 'montserrat-regular.ttf',
    bold: 'montserrat-bold.ttf',
  },
  inter: {
    regular: 'inter-regular.ttf',
    bold: 'inter-bold.ttf',
  },
  oswald: {
    regular: 'oswald-regular.ttf',
    bold: 'oswald-bold.ttf',
  },
  'open-sans': {
    regular: 'open-sans-regular.ttf',
    bold: 'open-sans-bold.ttf',
  },
}

/**
 * Map a free-form font name (e.g. "Open Sans", "OpenSans", "open_sans") to a registered
 * FONT_FILES key. Returns the canonical key when known, otherwise null so callers can
 * fall back to their default (AI) font. Keeps the user-font-if-shared-else-AI contract.
 */
export function resolveFontFamily(name: string | null | undefined): string | null {
  if (!name) return null
  const key = name.trim().toLowerCase().replace(/[\s_]+/g, '-')
  if (FONT_FILES[key]) return key
  // Tolerate spaceless variants ("opensans") and partial matches.
  const collapsed = key.replace(/-/g, '')
  for (const k of Object.keys(FONT_FILES)) {
    if (k.replace(/-/g, '') === collapsed) return k
  }
  return null
}

/**
 * Load a font file from the .fonts directory
 * Caches the loaded font for performance
 */
function loadFont(fontFamily: string, weight: 'regular' | 'bold' = 'regular'): opentype.Font {
  const family = fontFamily.toLowerCase()
  const cacheKey = `${family}-${weight}`

  // Return cached font if available
  if (fontCache.has(cacheKey)) {
    return fontCache.get(cacheKey)!
  }

  // Get font file name
  const fontFiles = FONT_FILES[family]
  if (!fontFiles) {
    console.warn(`[text-to-path] Unknown font family: ${fontFamily}, falling back to Poppins`)
    return loadFont('poppins', weight)
  }

  const fileName = fontFiles[weight]
  if (!fileName) {
    console.warn(`[text-to-path] Unknown weight ${weight} for ${fontFamily}, using regular`)
    return loadFont(family, 'regular')
  }

  // Build absolute path to font file
  const fontPath = path.join(process.cwd(), '.fonts', fileName)

  // Verify file exists
  if (!fs.existsSync(fontPath)) {
    console.error(`[text-to-path] Font file not found: ${fontPath}`)
    throw new Error(`Font file not found: ${fontPath}`)
  }

  console.log(`[text-to-path] Loading font: ${fontPath}`)

  // Load font using opentype.js
  // opentype.js supports WOFF2 files directly
  const font = opentype.loadSync(fontPath)

  // Cache the loaded font
  fontCache.set(cacheKey, font)

  console.log(`[text-to-path] Font loaded successfully: ${cacheKey}`)

  return font
}

/**
 * Options for text-to-path conversion
 */
export interface TextToPathOptions {
  fontFamily: string
  fontSize: number
  fontWeight?: 'regular' | 'bold'
  x?: number
  y?: number
  fill?: string
  letterSpacing?: number
  textAnchor?: 'start' | 'middle' | 'end'
}

/**
 * Convert text to SVG path element
 *
 * @param text - The text string to convert
 * @param options - Font and positioning options
 * @returns SVG path element string
 */
export function textToPath(text: string, options: TextToPathOptions): string {
  const {
    fontFamily,
    fontSize,
    fontWeight = 'regular',
    x = 0,
    y = 0,
    fill = '#000000',
    letterSpacing = 0,
    textAnchor = 'start',
  } = options

  try {
    const font = loadFont(fontFamily, fontWeight)

    // Calculate path position based on text anchor
    let pathX = x
    if (textAnchor !== 'start') {
      // Get text width for anchor adjustment
      const textWidth = getTextWidth(text, fontFamily, fontSize, fontWeight, letterSpacing)
      if (textAnchor === 'middle') {
        pathX = x - textWidth / 2
      } else if (textAnchor === 'end') {
        pathX = x - textWidth
      }
    }

    // Generate path with letter spacing if specified
    let pathData: opentype.Path
    if (letterSpacing && letterSpacing !== 0) {
      // Manual letter spacing - render characters individually
      pathData = new opentype.Path()
      let currentX = pathX

      for (const char of text) {
        const charPath = font.getPath(char, currentX, y, fontSize)
        // Merge char path into main path
        pathData.commands.push(...charPath.commands)

        // Advance X position by character width + letter spacing
        const glyph = font.charToGlyph(char)
        const advance = (glyph.advanceWidth || 0) * (fontSize / font.unitsPerEm)
        currentX += advance + letterSpacing
      }
    } else {
      // Standard rendering without letter spacing
      pathData = font.getPath(text, pathX, y, fontSize)
    }

    const pathString = pathData.toPathData(2) // 2 decimal places

    // Return empty group if path is empty (handles whitespace-only text)
    if (!pathString || pathString.trim() === '') {
      console.warn(`[text-to-path] Empty path generated for text: "${text}"`)
      return `<g data-text="${escapeXml(text)}"><!-- Empty text --></g>`
    }

    return `<path d="${pathString}" fill="${fill}" data-text="${escapeXml(text)}"/>`
  } catch (error) {
    console.error(`[text-to-path] Failed to convert text: "${text}"`, error)
    // Return a placeholder that's visible for debugging
    return `<g data-text="${escapeXml(text)}" data-error="conversion-failed">
      <rect x="${x}" y="${y - fontSize}" width="100" height="${fontSize}" fill="red" opacity="0.3"/>
    </g>`
  }
}

/**
 * Calculate text width using font metrics
 *
 * @param text - The text string
 * @param fontFamily - Font family name
 * @param fontSize - Font size in pixels
 * @param fontWeight - Font weight
 * @param letterSpacing - Optional letter spacing
 * @returns Width in pixels
 */
export function getTextWidth(
  text: string,
  fontFamily: string,
  fontSize: number,
  fontWeight: 'regular' | 'bold' = 'regular',
  letterSpacing: number = 0
): number {
  try {
    const font = loadFont(fontFamily, fontWeight)
    let width = 0

    for (let i = 0; i < text.length; i++) {
      const glyph = font.charToGlyph(text[i])
      const advance = (glyph.advanceWidth || 0) * (fontSize / font.unitsPerEm)
      width += advance

      // Add letter spacing for all but last character
      if (i < text.length - 1) {
        width += letterSpacing
      }
    }

    return width
  } catch (error) {
    console.error(`[text-to-path] Failed to calculate width for: "${text}"`, error)
    // Fallback estimation
    return text.length * fontSize * 0.6
  }
}

/**
 * Get font metrics for vertical positioning
 */
export function getFontMetrics(fontFamily: string, fontSize: number, fontWeight: 'regular' | 'bold' = 'regular'): {
  ascender: number
  descender: number
  lineHeight: number
} {
  try {
    const font = loadFont(fontFamily, fontWeight)
    const scale = fontSize / font.unitsPerEm

    return {
      ascender: font.ascender * scale,
      descender: Math.abs(font.descender * scale),
      lineHeight: (font.ascender - font.descender) * scale,
    }
  } catch (error) {
    console.error(`[text-to-path] Failed to get metrics for: ${fontFamily}`, error)
    // Fallback metrics
    return {
      ascender: fontSize * 0.8,
      descender: fontSize * 0.2,
      lineHeight: fontSize * 1.2,
    }
  }
}

/**
 * Escape special XML characters
 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/**
 * Check if text-to-path is available (TTF fonts exist)
 * Note: opentype.js requires TTF format, not WOFF2
 */
export function isTextToPathAvailable(): boolean {
  try {
    // Check for TTF files (required by opentype.js)
    const testPath = path.join(process.cwd(), '.fonts', 'poppins-regular.ttf')
    const exists = fs.existsSync(testPath)
    if (!exists) {
      console.log('[text-to-path] TTF fonts not found at:', testPath)
    }
    return exists
  } catch (error) {
    console.error('[text-to-path] Error checking font availability:', error)
    return false
  }
}

/**
 * Clear font cache (for testing)
 */
export function clearFontCache(): void {
  fontCache.clear()
}
