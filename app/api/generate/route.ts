import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { processImageWithLogos, type LogoPosition } from '@/lib/sharp/logo-overlay'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verify user is authenticated
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      prompt,
      model,
      provider,
      verticalSlug,
      logosPlacements,
      organizationId,
      templateId,
      templateUrl,
    } = body

    // Verify user belongs to the organization
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('organization_id', organizationId)
      .single()

    if (!membership) {
      return NextResponse.json(
        { error: 'You do not have access to this organization' },
        { status: 403 }
      )
    }

    // Check role permissions
    if (membership.role === 'viewer') {
      return NextResponse.json(
        { error: 'Viewers cannot generate creatives' },
        { status: 403 }
      )
    }

    let imageUrl: string

    // Generate based on provider and template
    if (templateUrl) {
      // Template-based generation using Gemini Vision
      imageUrl = await generateFromTemplate(prompt, templateUrl, verticalSlug)

      // Increment template use count
      if (templateId) {
        await supabase.rpc('increment_template_use_count', { template_id: templateId })
      }
    } else if (provider === 'google') {
      imageUrl = await generateWithGemini(prompt)
    } else if (provider === 'ideogram') {
      imageUrl = await generateWithIdeogram(prompt)
    } else {
      return NextResponse.json(
        { error: 'Invalid AI provider' },
        { status: 400 }
      )
    }

    // If logos need to be overlaid, process with Sharp
    if (logosPlacements && logosPlacements.length > 0) {
      imageUrl = await overlayLogos(imageUrl, logosPlacements, supabase)
    }

    return NextResponse.json({
      success: true,
      imageUrl,
    })
  } catch (error) {
    console.error('Generation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Generation failed' },
      { status: 500 }
    )
  }
}

async function generateFromTemplate(
  prompt: string,
  templateUrl: string,
  verticalSlug: string
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
      throw new Error('Failed to fetch template image')
    }
    const templateBuffer = await templateResponse.arrayBuffer()
    templateBase64 = Buffer.from(templateBuffer).toString('base64')
    templateMimeType = templateResponse.headers.get('content-type') || 'image/png'
  } catch (error) {
    console.error('Error fetching template:', error)
    throw new Error('Failed to load template image')
  }

  // Build the template adaptation prompt
  const adaptationPrompt = `You are a professional graphic designer. I'm providing you with a template image.

Your task is to create a NEW poster that:
1. MAINTAINS the exact same visual style, color palette, fonts, and layout structure as the template
2. KEEPS all decorative elements, backgrounds, patterns, and design elements from the template
3. ADAPTS the design to include these event details:

${prompt}

Important guidelines:
- Preserve the template's color scheme exactly
- Keep the same font styles and text hierarchy
- Place text in logical positions following the template's text layout
- Ensure all text is clearly readable with appropriate contrast
- Maintain the same aspect ratio and composition
- Keep any brand elements, borders, or decorative patterns from the template

Generate a professional marketing poster that looks like it was designed with the same template as the reference image.`

  const response = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent',
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
                text: adaptationPrompt,
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
    console.error('Gemini Vision API error:', errorText)
    // Fallback to regular Gemini generation if template adaptation fails
    console.log('Falling back to regular Gemini generation')
    return generateWithGemini(prompt)
  }

  const data = await response.json()

  // Extract image from response
  const parts = data.candidates?.[0]?.content?.parts
  const imagePart = parts?.find((p: { inlineData?: { data: string } }) => p.inlineData)

  if (!imagePart?.inlineData?.data) {
    console.log('No image in template adaptation response, falling back')
    return generateWithGemini(prompt)
  }

  // Convert base64 to data URL
  const imageData = imagePart.inlineData.data
  const mimeType = imagePart.inlineData.mimeType || 'image/png'

  return `data:${mimeType};base64,${imageData}`
}

async function generateWithGemini(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('Gemini API key not configured')
  }

  const response = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent',
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
                text: `Create a professional marketing poster image. ${prompt}.
                Style: Clean, modern, professional.
                Format: Portrait orientation (4:5 aspect ratio).
                Include realistic photo elements where appropriate.
                Make text clearly readable and well-designed.`,
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
    console.error('Gemini API error:', errorText)
    throw new Error('Failed to generate image with Gemini')
  }

  const data = await response.json()

  // Extract image from response
  const parts = data.candidates?.[0]?.content?.parts
  const imagePart = parts?.find((p: { inlineData?: { data: string } }) => p.inlineData)

  if (!imagePart?.inlineData?.data) {
    throw new Error('No image generated')
  }

  // Convert base64 to data URL
  const imageData = imagePart.inlineData.data
  const mimeType = imagePart.inlineData.mimeType || 'image/png'

  // For production, upload to Supabase Storage instead
  return `data:${mimeType};base64,${imageData}`
}

async function generateWithIdeogram(prompt: string): Promise<string> {
  const apiKey = process.env.IDEOGRAM_API_KEY
  if (!apiKey) {
    throw new Error('Ideogram API key not configured')
  }

  const response = await fetch('https://api.ideogram.ai/generate', {
    method: 'POST',
    headers: {
      'Api-Key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      image_request: {
        prompt: `Professional marketing poster. ${prompt}. Clean modern design with excellent typography.`,
        aspect_ratio: 'ASPECT_4_5',
        model: 'V_2',
        magic_prompt_option: 'AUTO',
      },
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('Ideogram API error:', errorText)
    throw new Error('Failed to generate image with Ideogram')
  }

  const data = await response.json()

  if (!data.data?.[0]?.url) {
    throw new Error('No image URL in response')
  }

  return data.data[0].url
}

async function overlayLogos(
  imageUrl: string,
  logosPlacements: Array<{ logoId: string; position: string; logo?: { file_url: string } }>,
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<string> {
  try {
    // Fetch logo URLs from database
    const logoIds = logosPlacements.map((p) => p.logoId)
    const { data: logos, error } = await supabase
      .from('organization_logos')
      .select('id, file_url')
      .in('id', logoIds)

    if (error || !logos || logos.length === 0) {
      console.log('No logos found or error fetching logos:', error)
      return imageUrl
    }

    // Create a map of logo IDs to logo data
    const logoMap = new Map(logos.map((l) => [l.id, l]))

    // Build placements with logo data
    const placementsWithLogos = logosPlacements.map((p) => ({
      logoId: p.logoId,
      position: p.position as LogoPosition,
      logo: logoMap.get(p.logoId) || p.logo,
    }))

    // Process image with logo overlays using Sharp
    const processedImageUrl = await processImageWithLogos(imageUrl, placementsWithLogos)

    return processedImageUrl
  } catch (error) {
    console.error('Error overlaying logos:', error)
    // Return original image if logo overlay fails
    return imageUrl
  }
}
