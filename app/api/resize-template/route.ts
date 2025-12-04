/**
 * Template Resize API
 *
 * AI-powered "Magic Resize" for templates - Canva-style intelligent resizing
 * that adapts templates to new dimensions while preserving visual identity.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { resizeImageToExactDimensions } from '@/lib/sharp/logo-overlay'
import { buildTemplateResizePrompt, buildCompactResizePrompt } from '@/lib/prompts/template-resize-prompt'

interface ResizeTemplateRequest {
  templateUrl: string
  targetWidth: number
  targetHeight: number
  originalWidth?: number
  originalHeight?: number
  preserveText?: boolean
  useCompactPrompt?: boolean
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verify user is authenticated
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: ResizeTemplateRequest = await request.json()
    const {
      templateUrl,
      targetWidth,
      targetHeight,
      originalWidth,
      originalHeight,
      preserveText = true,
      useCompactPrompt = false,
    } = body

    // Validate required fields
    if (!templateUrl) {
      return NextResponse.json(
        { error: 'Template URL is required' },
        { status: 400 }
      )
    }

    if (!targetWidth || !targetHeight || targetWidth < 100 || targetHeight < 100) {
      return NextResponse.json(
        { error: 'Valid target dimensions are required (minimum 100x100)' },
        { status: 400 }
      )
    }

    // Check if resize is actually needed
    if (originalWidth && originalHeight) {
      const originalRatio = originalWidth / originalHeight
      const targetRatio = targetWidth / targetHeight
      const tolerance = 0.05 // 5% tolerance

      if (Math.abs(originalRatio - targetRatio) / originalRatio < tolerance) {
        // Aspect ratios are similar enough, just do a simple resize
        console.log('[Resize] Aspect ratios similar, using simple resize')

        try {
          const resizedImage = await resizeImageToExactDimensions(
            templateUrl,
            targetWidth,
            targetHeight
          )

          return NextResponse.json({
            success: true,
            resizedImageUrl: resizedImage,
            method: 'simple_resize',
          })
        } catch (error) {
          console.error('[Resize] Simple resize failed:', error)
          // Fall through to AI resize
        }
      }
    }

    // Build the resize prompt
    const prompt = useCompactPrompt
      ? buildCompactResizePrompt(targetWidth, targetHeight, preserveText)
      : buildTemplateResizePrompt(targetWidth, targetHeight, {
          preserveText,
          originalWidth,
          originalHeight,
        })

    console.log('[Resize] Using AI resize with prompt length:', prompt.length)

    // Call Gemini Vision for intelligent resize
    const resizedImageUrl = await generateResizedTemplate(
      prompt,
      templateUrl,
      targetWidth,
      targetHeight
    )

    return NextResponse.json({
      success: true,
      resizedImageUrl,
      method: 'ai_resize',
    })

  } catch (error) {
    console.error('[Resize Template] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to resize template',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * Generate resized template using Gemini Vision
 */
async function generateResizedTemplate(
  prompt: string,
  templateUrl: string,
  targetWidth: number,
  targetHeight: number
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('Gemini API key not configured')
  }

  // Download template image and convert to base64
  let templateBase64: string
  let templateMimeType: string

  try {
    const templateResponse = await fetch(templateUrl)
    if (!templateResponse.ok) {
      throw new Error(`Failed to fetch template image: ${templateResponse.status}`)
    }
    const templateBuffer = await templateResponse.arrayBuffer()
    templateBase64 = Buffer.from(templateBuffer).toString('base64')
    templateMimeType = templateResponse.headers.get('content-type') || 'image/png'
  } catch (error) {
    console.error('[Resize] Error fetching template:', error)
    throw new Error('Failed to load template image')
  }

  // Use Gemini 2.5 Flash Image model for image generation
  const response = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                inline_data: {
                  mime_type: templateMimeType,
                  data: templateBase64,
                },
              },
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          responseModalities: ['TEXT', 'IMAGE'],
        },
      }),
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    console.error('[Resize] Gemini API error:', response.status, errorText)
    throw new Error(`Gemini API error: ${response.status}`)
  }

  const data = await response.json()

  // Extract image from response
  const parts = data.candidates?.[0]?.content?.parts
  const imagePart = parts?.find((p: { inlineData?: { data: string; mimeType?: string } }) => p.inlineData)

  if (!imagePart?.inlineData?.data) {
    console.error('[Resize] No image in Gemini response')
    throw new Error('No image generated by AI')
  }

  // Convert to data URL
  const mimeType = imagePart.inlineData.mimeType || 'image/png'
  const imageDataUrl = `data:${mimeType};base64,${imagePart.inlineData.data}`

  // Ensure exact dimensions with Sharp
  try {
    const finalImage = await resizeImageToExactDimensions(
      imageDataUrl,
      targetWidth,
      targetHeight
    )
    return finalImage
  } catch (error) {
    console.error('[Resize] Final resize failed:', error)
    // Return AI output even if final resize fails
    return imageDataUrl
  }
}
