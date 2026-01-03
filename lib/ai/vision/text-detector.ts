/**
 * AI Vision Text Detector for Speaker Name Location
 * v6.15: Uses Gemini Vision API to detect where speaker text was rendered
 *
 * Purpose:
 * - Analyze generated poster to find speaker name position
 * - Enable intelligent grouping of speaker photo near text
 * - Fix visual disconnect between floating text and photo
 *
 * Strategy:
 * - Use Gemini Vision multimodal capabilities
 * - Ask AI to locate specific text in image
 * - Return bounding box coordinates for grouping calculation
 *
 * Performance: ~500-800ms overhead (Vision API call)
 * Cost: ~$0.001 per detection (Gemini Flash Vision)
 */

import { GoogleGenerativeAI } from '@google/generative-ai'

export interface TextBoundingBox {
  x: number       // Left edge in pixels
  y: number       // Top edge in pixels
  width: number   // Width in pixels
  height: number  // Height in pixels
}

export interface TextDetectionResult {
  detected: boolean           // Whether text was found
  confidence: number          // Detection confidence (0-1)
  boundingBox?: TextBoundingBox  // Location of detected text
  centerY?: number           // Vertical center for grouping
  reasoning?: string         // Explanation of detection
}

/**
 * Detect speaker name position in generated poster using Gemini Vision
 *
 * @param imageBuffer - Generated poster buffer (before speaker photo overlay)
 * @param speakerName - Name to search for (e.g., "Dilip Krishna")
 * @param imageHeight - Total image height for coordinate validation
 * @returns Detection result with bounding box and center coordinates
 */
export async function detectSpeakerTextPosition(
  imageBuffer: Buffer,
  speakerName: string,
  imageHeight: number
): Promise<TextDetectionResult> {
  const startTime = Date.now()

  console.log('[Text Detection v6.15] 🔍 Detecting speaker text position...')
  console.log(`[Text Detection v6.15] Looking for: "${speakerName}"`)
  console.log(`[Text Detection v6.15] Image height: ${imageHeight}px`)

  try {
    // Initialize Gemini Vision API
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp'  // Fast multimodal model with vision
    })

    // Convert buffer to base64 for Vision API
    const base64Image = imageBuffer.toString('base64')

    // Construct vision analysis prompt
    const prompt = `You are analyzing an event poster image to locate speaker text.

TASK: Find the text "${speakerName}" in this image and return its position.

INSTRUCTIONS:
1. Scan the image for the exact text: "${speakerName}"
2. The text may appear in various colors (green, white, black, etc.)
3. It may be rendered in different font styles (bold, regular, etc.)
4. Ignore logo text, headlines, or other non-speaker text
5. Return the bounding box coordinates as percentages of image dimensions

RESPONSE FORMAT (JSON only, no explanation):
{
  "detected": true/false,
  "confidence": 0.0-1.0,
  "boundingBox": {
    "xPercent": 0-100,
    "yPercent": 0-100,
    "widthPercent": 0-100,
    "heightPercent": 0-100
  },
  "reasoning": "Brief explanation of where text was found"
}

If text is NOT found, return:
{
  "detected": false,
  "confidence": 0.0,
  "reasoning": "Text '${speakerName}' not found in image"
}

Analyze the image now and return ONLY the JSON response.`

    // Call Gemini Vision API
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: 'image/png',
          data: base64Image
        }
      }
    ])

    const response = result.response
    const text = response.text()

    console.log('[Text Detection v6.15] Raw Vision API response:', text.substring(0, 200))

    // Parse JSON response
    const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const visionResult = JSON.parse(cleanedText)

    if (!visionResult.detected) {
      console.warn('[Text Detection v6.15] ⚠️ Speaker text NOT detected by Vision API')
      console.warn(`[Text Detection v6.15] Reasoning: ${visionResult.reasoning}`)

      return {
        detected: false,
        confidence: 0,
        reasoning: visionResult.reasoning || 'Text not found'
      }
    }

    // Convert percentage coordinates to absolute pixels
    const boundingBox: TextBoundingBox = {
      x: Math.round((visionResult.boundingBox.xPercent / 100) * 1080), // Assuming 1080px width
      y: Math.round((visionResult.boundingBox.yPercent / 100) * imageHeight),
      width: Math.round((visionResult.boundingBox.widthPercent / 100) * 1080),
      height: Math.round((visionResult.boundingBox.heightPercent / 100) * imageHeight)
    }

    // Calculate vertical center for grouping
    const centerY = boundingBox.y + Math.round(boundingBox.height / 2)

    const duration = Date.now() - startTime

    console.log('[Text Detection v6.15] ✅ Speaker text DETECTED:')
    console.log(`  - Bounding box: (${boundingBox.x}, ${boundingBox.y}) ${boundingBox.width}x${boundingBox.height}`)
    console.log(`  - Center Y: ${centerY}px (${((centerY / imageHeight) * 100).toFixed(1)}% from top)`)
    console.log(`  - Confidence: ${(visionResult.confidence * 100).toFixed(1)}%`)
    console.log(`  - Reasoning: ${visionResult.reasoning}`)
    console.log(`  - Detection time: ${duration}ms`)

    return {
      detected: true,
      confidence: visionResult.confidence,
      boundingBox,
      centerY,
      reasoning: visionResult.reasoning
    }
  } catch (error) {
    console.error('[Text Detection v6.15] ❌ Vision API error:', error)

    return {
      detected: false,
      confidence: 0,
      reasoning: `Vision API failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Calculate grouping zone based on detected text position
 * Returns Y-coordinate range where speaker photo should be positioned
 *
 * @param textCenterY - Vertical center of detected text
 * @param photoSize - Speaker photo size (including shadow)
 * @param groupingRadius - Max distance from text (default: 150px)
 * @returns Y-coordinate range for photo placement
 */
export function calculateGroupingZone(
  textCenterY: number,
  photoSize: number,
  groupingRadius: number = 150
): { minY: number; maxY: number; targetY: number } {
  // Target: Center photo at same Y as text center for perfect alignment
  const targetY = textCenterY - Math.round(photoSize / 2)

  // Allow some flexibility: ±groupingRadius from target
  const minY = targetY - groupingRadius
  const maxY = targetY + groupingRadius

  console.log('[Grouping Zone] Calculated grouping range:')
  console.log(`  - Text center Y: ${textCenterY}px`)
  console.log(`  - Photo size: ${photoSize}px`)
  console.log(`  - Target photo Y: ${targetY}px (aligned with text)`)
  console.log(`  - Allowed range: ${minY}px - ${maxY}px (±${groupingRadius}px)`)

  return { minY, maxY, targetY }
}
