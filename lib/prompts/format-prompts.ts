/**
 * Format-Aware Prompt Building
 *
 * Generates optimized prompts based on the selected creative format,
 * including aspect ratio considerations and format-specific guidelines.
 */

import type { CreativeFormat, CreativeFormatId } from '@/lib/config/creative-formats'
import { FORMAT_GUIDELINES } from '@/lib/config/creative-formats'

/**
 * Format-specific composition guidelines for AI generation
 */
const FORMAT_COMPOSITION_RULES: Partial<Record<CreativeFormatId, string>> = {
  // Square formats (1:1)
  instagram_post: 'Centered composition with balanced visual weight. Keep text in safe zones away from edges.',
  facebook_post: 'Strong central focus. Text should be bold and readable at small sizes.',

  // Vertical formats (9:16, 2:3)
  instagram_story: 'Vertical composition with top and bottom text zones. Main subject in center third.',
  instagram_reel: 'Dynamic vertical composition. Keep critical elements away from UI overlay zones.',
  tiktok_cover: 'Full-height vertical layout. Account for profile and action button overlays on right side.',
  pinterest_pin: 'Tall vertical layout optimized for scrolling. Use strong imagery at top to catch attention.',
  whatsapp_status: 'Vertical layout with clear visual hierarchy. Text should be large and readable.',

  // Horizontal formats (16:9, 1.91:1)
  youtube_thumbnail: 'High contrast, bold visuals. Large text on left or right third. Face or subject prominently featured.',
  facebook_cover: 'Horizontal banner with centered content. Account for profile picture overlap on left.',
  linkedin_banner: 'Professional horizontal composition. Key content should avoid mobile crop zones.',
  twitter_header: 'Wide horizontal layout. Center important content to avoid mobile cropping.',
  presentation_16_9: 'Cinematic horizontal layout. Use rule of thirds for visual elements.',
  web_banner: 'Ultra-wide format. Important content should be centered. Edge content may be cropped.',

  // Print formats
  event_poster: 'Portrait orientation with clear visual hierarchy: headline, image, details, call-to-action.',
  flyer_a4: 'Standard print proportions. Include bleed area considerations. High resolution for print.',
  business_card: 'Small format requiring minimalist design. Focus on essential information only.',
  certificate: 'Landscape format with formal layout. Border/frame design with centered text.',
  invitation: 'Elegant composition with formal typography. Balance between imagery and text.',

  // Other formats
  email_header: 'Wide horizontal format. Critical content in center 600px for email client compatibility.',
  announcement: 'Attention-grabbing layout. Bold headline with supporting visual.',
}

/**
 * Get aspect ratio guidance for generation
 */
function getAspectRatioGuidance(format: CreativeFormat): string {
  const ratio = format.aspectRatio

  if (ratio === '1:1') {
    return 'Square composition - use centered, symmetrical layouts'
  } else if (ratio === '9:16' || ratio === '2:3') {
    return 'Tall vertical composition - stack elements vertically with clear hierarchy'
  } else if (ratio === '16:9' || ratio === '1.91:1') {
    return 'Wide horizontal composition - use landscape orientation with horizontal flow'
  } else if (ratio === '4:5') {
    return 'Portrait orientation - slightly taller than wide, good for posters'
  } else if (ratio === '4:1') {
    return 'Ultra-wide banner - minimize text, focus on strong visuals'
  }

  return `${ratio} aspect ratio composition`
}

/**
 * Build a format-aware prompt for AI generation
 */
export function buildFormatPrompt(
  format: CreativeFormat,
  basePrompt: string,
  options?: {
    includeGuidelines?: boolean
    includeCompositionRules?: boolean
    includeDimensions?: boolean
  }
): string {
  const {
    includeGuidelines = true,
    includeCompositionRules = true,
    includeDimensions = true,
  } = options || {}

  const parts: string[] = []

  // Start with format context
  parts.push(`Create a professional ${format.label}.`)

  // Add base prompt
  parts.push(basePrompt)

  // Add dimension info
  if (includeDimensions) {
    parts.push(`\nFormat: ${format.width}×${format.height} pixels (${format.aspectRatio})`)
  }

  // Add aspect ratio guidance
  parts.push(getAspectRatioGuidance(format))

  // Add format-specific guidelines
  if (includeGuidelines) {
    const guideline = FORMAT_GUIDELINES[format.id]
    if (guideline) {
      parts.push(`\nGuidelines: ${guideline}`)
    }
  }

  // Add composition rules
  if (includeCompositionRules) {
    const compositionRule = FORMAT_COMPOSITION_RULES[format.id]
    if (compositionRule) {
      parts.push(`\nComposition: ${compositionRule}`)
    }
  }

  return parts.join('\n')
}

/**
 * Get short format context for embedding in prompts
 */
export function getFormatContext(format: CreativeFormat): string {
  return `${format.label} (${format.width}×${format.height}px, ${format.aspectRatio})`
}

/**
 * Get aspect ratio as a number for image generation APIs
 */
export function getAspectRatioValue(format: CreativeFormat): number {
  return format.width / format.height
}

/**
 * Get the closest standard aspect ratio string for APIs
 */
export function getStandardAspectRatio(format: CreativeFormat): string {
  const ratio = format.width / format.height

  // Common standard ratios
  if (Math.abs(ratio - 1) < 0.01) return '1:1'
  if (Math.abs(ratio - 16 / 9) < 0.05) return '16:9'
  if (Math.abs(ratio - 9 / 16) < 0.05) return '9:16'
  if (Math.abs(ratio - 4 / 3) < 0.05) return '4:3'
  if (Math.abs(ratio - 3 / 4) < 0.05) return '3:4'
  if (Math.abs(ratio - 4 / 5) < 0.05) return '4:5'
  if (Math.abs(ratio - 5 / 4) < 0.05) return '5:4'
  if (Math.abs(ratio - 2 / 3) < 0.05) return '2:3'
  if (Math.abs(ratio - 3 / 2) < 0.05) return '3:2'

  // Return original if no close match
  return format.aspectRatio
}

/**
 * Check if format is suitable for specific content types
 */
export function isFormatSuitableFor(
  format: CreativeFormat,
  contentType: 'text-heavy' | 'image-focused' | 'video-cover' | 'print'
): boolean {
  switch (contentType) {
    case 'text-heavy':
      // Square and portrait formats work better for text
      return format.width <= format.height
    case 'image-focused':
      // All formats work, but landscape is often better for imagery
      return true
    case 'video-cover':
      // 16:9 and 9:16 are standard video ratios
      return format.aspectRatio === '16:9' || format.aspectRatio === '9:16'
    case 'print':
      // Print formats typically have specific requirements
      return format.category === 'print'
    default:
      return true
  }
}
