/**
 * Legacy prompts - preserved from original prompting approach
 * Used as fallback when new prompting system encounters issues
 */

import type { CreativeContent, DesignCustomization } from './types'
import { getThemeByValue, getStyleByValue } from '@/lib/config/design-constants'

interface BrandConfig {
  primary_color: string
  secondary_color: string
  accent_color: string
  background_color: string
  headline_font: string
  body_font: string
  header_height: number
  footer_height: number
}

interface GenerationParamsLegacy {
  type: 'event_poster' | 'social_post' | 'banner'
  content: CreativeContent
  brand: BrandConfig
  theme: string
  style?: string
  colorScheme: string
  language: string
  width: number
  height: number
  aspectRatio: string
  organizationName: string
  customization?: DesignCustomization
}

// Helper function to build event narrative
function buildEventNarrativeLegacy(content: CreativeContent): string {
  const parts: string[] = []

  if (content.eventName) {
    parts.push(`Event title: "${content.eventName}" (display prominently as the main headline)`)
  }
  if (content.eventType) {
    parts.push(`Type of event: ${content.eventType}`)
  }
  if (content.guestName) {
    const guestText = content.guestDesignation
      ? `${content.guestName}, ${content.guestDesignation}`
      : content.guestName
    parts.push(`Featured speaker/guest: ${guestText} (display with prominence)`)
  }
  if (content.date) {
    parts.push(`Date: ${content.date}`)
  }
  if (content.time) {
    parts.push(`Time: ${content.time}`)
  }
  if (content.venue) {
    const venueText = content.hall
      ? `${content.venue}, ${content.hall}`
      : content.venue
    parts.push(`Location: ${venueText}`)
  }
  if (content.additionalText) {
    parts.push(`Additional details: ${content.additionalText}`)
  }

  return parts.join('\n')
}

// Helper function to build color description
function buildColorDescriptionLegacy(colorScheme: string, brand: BrandConfig): string {
  if (colorScheme === 'brand_default') {
    return `harmonious palette with ${brand.primary_color} as primary, ${brand.secondary_color} as secondary, and ${brand.accent_color} as accent`
  }

  const schemes: Record<string, string> = {
    teal_orange: 'vibrant gradient flowing from teal (#1B998B) to warm orange (#FF6B35)',
    navy_gold: 'elegant gradient from deep navy blue (#1E3A5F) to luxurious gold (#D4AF37)',
    purple_pink: 'dynamic gradient from rich purple (#8B5CF6) to vibrant pink (#EC4899)',
    green_teal: 'fresh gradient from green (#22C55E) to calming teal (#14B8A6)',
    red_orange: 'energetic gradient from bold red (#EF4444) to bright orange (#F97316)',
  }

  return schemes[colorScheme] || `${brand.primary_color} and ${brand.secondary_color}`
}

// Helper function to build theme description with keywords
function buildThemeDescriptionLegacy(theme: string): string {
  const themeData = getThemeByValue(theme)
  if (!themeData) {
    return `${theme} aesthetic`
  }
  return `${themeData.label} aesthetic - ${themeData.description} (${themeData.keywords.join(', ')})`
}

// Helper function to build style description with visual treatment
function buildStyleDescriptionLegacy(style: string | undefined): string {
  if (!style) return ''

  const styleData = getStyleByValue(style)
  if (!styleData) {
    return `Visual style: ${style}`
  }
  return `Visual treatment: ${styleData.label} - ${styleData.description} (${styleData.keywords.join(', ')})`
}

// Helper function to build customization instructions
function buildCustomizationInstructionsLegacy(customization: DesignCustomization): string {
  const instructions: string[] = []

  // Title customization
  const { title } = customization
  instructions.push(`TITLE STYLING:
- Position the title at the ${title.position} of the design
- Align text to the ${title.alignment}
- Use ${title.fontWeight} font weight with approximately ${title.fontSize}pt visual size
- Title color: ${title.color}
- ${title.shadow ? 'Apply subtle text shadow for depth' : 'No text shadow'}`)

  // Background customization
  const { background } = customization
  const bgType = {
    gradient: 'flowing gradient',
    solid: 'solid color fill',
    pattern: 'subtle geometric pattern',
    image: 'AI-generated imagery',
  }[background.type]
  instructions.push(`BACKGROUND:
- Style: ${bgType}
- Primary color: ${background.primaryColor}
- Secondary color: ${background.secondaryColor}
- ${background.overlay ? `Apply ${background.overlayOpacity}% dark overlay for text contrast` : 'No overlay'}
- ${background.blur ? `Apply ${background.blurAmount}px blur effect` : 'Sharp, crisp background'}`)

  // Speaker photo customization
  const { speakerPhoto } = customization
  const photoShape = {
    circle: 'circular crop',
    square: 'square crop',
    rounded: 'rounded rectangle crop',
  }[speakerPhoto.shape]
  instructions.push(`SPEAKER/GUEST PHOTO AREA:
- Shape: ${photoShape}
- Size: ${speakerPhoto.size > 250 ? 'large' : speakerPhoto.size > 150 ? 'medium' : 'small'} presence
- Position: ${speakerPhoto.position} side of the design
- ${speakerPhoto.border.width > 0 ? `Border: ${speakerPhoto.border.width}px ${speakerPhoto.border.color} border` : 'No border'}
- ${speakerPhoto.shadow ? 'Apply drop shadow' : 'No shadow'}`)

  // Footer customization
  const { footer } = customization
  const footerContent = [
    footer.showWebsite && 'website',
    footer.showPhone && 'phone',
    footer.showEmail && 'email',
    footer.showSocial && 'social links',
  ].filter(Boolean)
  instructions.push(`FOOTER:
- Style: ${footer.style} design
- Background: ${footer.backgroundColor}
- Include: ${footerContent.length > 0 ? footerContent.join(', ') : 'minimal contact info'}`)

  return instructions.join('\n\n')
}

export function buildGenerationPromptLegacy(params: GenerationParamsLegacy): string {
  const {
    type,
    content,
    brand,
    theme,
    style,
    colorScheme,
    language,
    organizationName,
    customization,
  } = params

  const typeLabel = {
    event_poster: 'event poster',
    social_post: 'social media post',
    banner: 'promotional banner',
  }[type]

  const languageLabel = {
    en: 'English',
    ta: 'Tamil',
    hi: 'Hindi',
  }[language] || 'English'

  const eventNarrative = buildEventNarrativeLegacy(content)
  const colorDescription = buildColorDescriptionLegacy(colorScheme, brand)
  const themeDescription = buildThemeDescriptionLegacy(theme)
  const styleDescription = style ? buildStyleDescriptionLegacy(style) : ''

  // Build customization instructions if provided
  const customizationSection = customization
    ? `\nDESIGN CUSTOMIZATION:\n${buildCustomizationInstructionsLegacy(customization)}\n`
    : ''

  const prompt = `Generate a professional, visually striking ${typeLabel} for ${organizationName}.

VISUAL DESIGN:
Create a bold, edge-to-edge design that fills the entire canvas without any margins, borders, or padding. The artwork should extend fully to all edges with no blank space around the perimeter.

COMPOSITION STRUCTURE:
- The upper portion features a clean, uncluttered gradient area with smooth color transitions, providing breathing room for branding
- The central focus area showcases the main content with strong visual hierarchy
- The lower portion maintains a subtle, cohesive gradient backdrop that completes the design flow

EVENT INFORMATION TO FEATURE:
${eventNarrative}

STYLING:
- Theme: ${themeDescription}
${styleDescription ? `- ${styleDescription}` : ''}
- Color palette: ${colorDescription}
- Typography: Modern, clean fonts (${brand.headline_font} style for headlines, ${brand.body_font} style for body) with ${languageLabel} text
- All text should be clearly legible with high contrast
- Create visual flow that guides the viewer naturally through the content
${customizationSection}
CRITICAL REQUIREMENTS:
- Generate only the visual design elements
- Do not include any annotations, dimension markers, technical notes, or placeholder text
- Do not include any text like "px", "reserved", "overlay", "zone", or similar technical terms
- Every element should be part of the finished, professional design
- The design should look complete and ready for immediate use`

  return prompt
}

// System prompt for consistent brand styling (legacy)
export const BRAND_SYSTEM_PROMPT_LEGACY = `You are a professional graphic designer creating high-quality marketing materials and event posters.

Design principles:
- Create visually complete, production-ready artwork
- Fill the entire canvas edge-to-edge with no empty margins
- Use strong visual hierarchy to guide the viewer's eye
- Ensure all text is legible with appropriate contrast
- Apply cohesive color palettes throughout the design
- Balance decorative elements with clear information display

Critical requirements:
- Generate only the final visual artwork
- Never include technical annotations, dimension markers, or placeholder labels
- Never add text like "px", "reserved", "overlay", or measurement annotations
- The output should look like a finished professional poster ready for print or digital use`
