/**
 * Extract embedded fonts to physical files for Resvg
 * Runs during Vercel build via prebuild hook
 *
 * This script extracts base64-encoded fonts from embedded-fonts.ts
 * and writes them as physical .woff2 files for Resvg to use in
 * serverless environments where fontconfig is unavailable.
 */

const fs = require('fs')
const path = require('path')

const FONT_OUTPUT_DIR = path.join(__dirname, '../.fonts')
const MANIFEST_PATH = path.join(__dirname, '../lib/config/font-paths.json')
const EMBEDDED_FONTS_PATH = path.join(__dirname, '../lib/config/embedded-fonts.ts')

function parseEmbeddedFonts() {
  console.log('[Extract Fonts] Reading embedded-fonts.ts...')

  const fileContent = fs.readFileSync(EMBEDDED_FONTS_PATH, 'utf-8')

  // Extract the EMBEDDED_FONTS object using regex
  const match = fileContent.match(/export const EMBEDDED_FONTS[^=]*=\s*({[\s\S]*?})\s*(?:as const)?$/m)

  if (!match) {
    throw new Error('Could not find EMBEDDED_FONTS in embedded-fonts.ts')
  }

  // Use eval to parse the object (safe because we control the source file)
  const fontData = eval(`(${match[1]})`)

  console.log('[Extract Fonts] Found font families:', Object.keys(fontData))

  return fontData
}

function extractFonts() {
  console.log('[Extract Fonts] Starting font extraction...')

  // Parse embedded fonts from TypeScript file
  const EMBEDDED_FONTS = parseEmbeddedFonts()

  // Create .fonts directory
  if (!fs.existsSync(FONT_OUTPUT_DIR)) {
    fs.mkdirSync(FONT_OUTPUT_DIR, { recursive: true })
    console.log('[Extract Fonts] Created .fonts directory')
  }

  const fontPaths = {}
  let totalExtracted = 0

  // Extract each font family
  for (const [family, variants] of Object.entries(EMBEDDED_FONTS)) {
    fontPaths[family] = {}

    for (const [variant, dataUri] of Object.entries(variants)) {
      try {
        // Parse data URI: "data:font/woff2;base64,ABC123..."
        if (!dataUri || !dataUri.startsWith('data:')) {
          console.error(`[Extract Fonts] ❌ Invalid data URI for ${family} ${variant}`)
          continue
        }

        const base64Data = dataUri.split(',')[1]
        if (!base64Data) {
          console.error(`[Extract Fonts] ❌ No base64 data for ${family} ${variant}`)
          continue
        }

        const buffer = Buffer.from(base64Data, 'base64')

        const filename = `${family}-${variant}.woff2`
        const filepath = path.join(FONT_OUTPUT_DIR, filename)

        fs.writeFileSync(filepath, buffer)

        // Store relative path from project root
        fontPaths[family][variant] = `.fonts/${filename}`

        console.log(`[Extract Fonts] ✓ Extracted ${family} ${variant} (${buffer.length} bytes)`)
        totalExtracted++
      } catch (error) {
        console.error(`[Extract Fonts] ❌ Failed to extract ${family} ${variant}:`, error.message)
      }
    }
  }

  // Generate manifest file
  try {
    fs.writeFileSync(MANIFEST_PATH, JSON.stringify(fontPaths, null, 2))
    console.log(`[Extract Fonts] ✓ Font manifest created at ${MANIFEST_PATH}`)
  } catch (error) {
    console.error('[Extract Fonts] ❌ Failed to write manifest:', error.message)
    process.exit(1)
  }

  console.log(`[Extract Fonts] ✅ Extraction complete: ${totalExtracted} fonts extracted`)

  // Exit with error if no fonts extracted
  if (totalExtracted === 0) {
    console.error('[Extract Fonts] ❌ No fonts were extracted!')
    process.exit(1)
  }
}

// Run extraction
try {
  extractFonts()
} catch (error) {
  console.error('[Extract Fonts] ❌ Fatal error:', error)
  process.exit(1)
}
