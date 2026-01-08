/**
 * Resvg SVG Renderer
 *
 * Provides font-aware SVG rendering for serverless environments
 * where Sharp's librsvg cannot resolve embedded fonts due to missing fontconfig.
 *
 * Resvg is a Rust-based SVG renderer that:
 * - Accepts physical font files directly (no fontconfig needed)
 * - Works reliably in serverless (Vercel Lambda, AWS Lambda)
 * - 5x faster than Sharp for SVG rendering
 * - Used by Vercel OG Image Generation
 *
 * References:
 * - https://github.com/lovell/sharp/issues/2499 (Sharp font issue)
 * - https://github.com/thx/resvg-js (Resvg JS bindings)
 *
 * NOTE: Resvg is dynamically imported to avoid Turbopack bundling issues with native binaries
 */

import fs from 'fs'
import path from 'path'

// Dynamic import type for Resvg
type ResvgModule = typeof import('@resvg/resvg-js')

interface FontPaths {
  [family: string]: {
    [variant: string]: string
  }
}

let FONT_PATHS: FontPaths = {}
let FONT_FILES_CACHE: string[] | null = null

/**
 * Load font paths from build-time manifest
 */
function loadFontPaths(): void {
  try {
    const manifestPath = path.join(process.cwd(), 'lib/config/font-paths.json')

    if (fs.existsSync(manifestPath)) {
      const manifestContent = fs.readFileSync(manifestPath, 'utf-8')
      FONT_PATHS = JSON.parse(manifestContent)

      console.log('[Resvg] ✓ Loaded font paths:', Object.keys(FONT_PATHS))
      console.log(
        '[Resvg] Font families available:',
        Object.keys(FONT_PATHS).join(', ')
      )
    } else {
      console.warn(
        '[Resvg] ⚠️  Font manifest not found at:',
        manifestPath,
        '- run `npm run extract-fonts` to generate'
      )
    }
  } catch (error) {
    console.error('[Resvg] ❌ Failed to load font paths:', error)
  }
}

/**
 * Get all font file paths for Resvg
 * Resolves relative paths to absolute and caches the result
 */
function getAllFontFiles(): string[] {
  // Return cached result if available
  if (FONT_FILES_CACHE !== null) {
    return FONT_FILES_CACHE
  }

  const files: string[] = []
  const projectRoot = process.cwd()

  for (const [family, variants] of Object.entries(FONT_PATHS)) {
    for (const [variant, relativePath] of Object.entries(variants)) {
      const absolutePath = path.join(projectRoot, relativePath)

      if (fs.existsSync(absolutePath)) {
        files.push(absolutePath)
        console.log(`[Resvg] ✓ Found font: ${family} ${variant} at ${relativePath}`)
      } else {
        console.warn(
          `[Resvg] ⚠️  Font file not found: ${family} ${variant} at ${absolutePath}`
        )
      }
    }
  }

  // Cache the result
  FONT_FILES_CACHE = files

  console.log(`[Resvg] Total fonts available: ${files.length}`)

  return files
}

/**
 * Check if Resvg is available for rendering
 * Returns true if font files were successfully extracted
 */
export function isResvgAvailable(): boolean {
  // Environment variable override (for rollback/testing)
  if (process.env.FONT_RENDERER === 'sharp') {
    console.log('[Resvg] ⚠️  FONT_RENDERER=sharp override - using Sharp')
    return false
  }

  // Load font paths on first check
  if (Object.keys(FONT_PATHS).length === 0) {
    loadFontPaths()
  }

  const available = Object.keys(FONT_PATHS).length > 0

  if (!available) {
    console.warn(
      '[Resvg] ⚠️  Fonts not available - falling back to Sharp. Run `npm run extract-fonts` to enable Resvg.'
    )
  }

  return available
}

/**
 * Render SVG to PNG using Resvg (font-aware renderer)
 *
 * @param svg - SVG string with embedded @font-face definitions
 * @param width - Target width for rendering
 * @param height - Target height for rendering
 * @returns PNG buffer compatible with Sharp compositing
 */
export async function renderSvgWithResvg(
  svg: string,
  width: number,
  height: number
): Promise<Buffer> {
  try {
    const fontFiles = getAllFontFiles()

    console.log('[Resvg] Rendering SVG:', {
      width,
      height,
      fontsAvailable: fontFiles.length,
      svgLength: svg.length,
    })

    // Use require() instead of import() to bypass Turbopack static analysis
    // This works because API routes run in Node.js environment, not browser
    const resvgModule = require('@resvg/resvg-js')
    const Resvg = resvgModule.Resvg

    // Initialize Resvg with font files
    const resvg = new Resvg(svg, {
      fitTo: {
        mode: 'width',
        value: width,
      },
      font: {
        fontFiles, // Physical font file paths
        loadSystemFonts: false, // Don't rely on system fonts (serverless)
        defaultFontFamily: 'Poppins', // Fallback if font not found
      },
    })

    // Render SVG to PNG
    const pngData = resvg.render()
    const pngBuffer = pngData.asPng()

    console.log('[Resvg] ✓ Render success:', {
      outputSize: pngBuffer.length,
      outputDimensions: `${pngData.width}x${pngData.height}`,
    })

    return pngBuffer
  } catch (error) {
    console.error('[Resvg] ❌ Render failed:', error)

    // Fallback: Create transparent buffer for graceful degradation
    console.log('[Resvg] Creating fallback transparent buffer')

    const sharp = (await import('sharp')).default

    return await sharp({
      create: {
        width,
        height,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    })
      .png()
      .toBuffer()
  }
}

/**
 * Get diagnostic information about Resvg status
 * Useful for debugging font rendering issues
 */
export function getResvgDiagnostics(): {
  available: boolean
  fontsLoaded: number
  fontFamilies: string[]
  fontFiles: string[]
} {
  if (Object.keys(FONT_PATHS).length === 0) {
    loadFontPaths()
  }

  const fontFiles = getAllFontFiles()

  return {
    available: isResvgAvailable(),
    fontsLoaded: fontFiles.length,
    fontFamilies: Object.keys(FONT_PATHS),
    fontFiles,
  }
}
