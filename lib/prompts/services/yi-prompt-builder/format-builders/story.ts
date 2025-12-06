/**
 * Story Format Prompt Builder v3.1 (Instagram/WhatsApp)
 * Generates XML-structured prompts for vertical story designs
 * Enhanced with:
 * - Logo awareness, brand context, and quality context
 * - Theme and organization context (v3.1)
 * - Platform-specific optimizations
 */

import type { StoryFormData, EnhancedBuildOptions } from '../types'
import {
  buildLogoContext,
  buildBrandContext,
  buildQualityContext,
  buildThemeContext,
  buildOrganizationContext,
  buildLanguageContext,
} from '../context-helpers'
import { STORY_EXAMPLES } from '../examples'

// ============================================================
// PLATFORM VARIATIONS (v3.1)
// ============================================================

interface StoryPlatformContext {
  topSafeZone: string
  bottomSafeZone: string
  uiElements: string
  interactionStyle: string
}

function getStoryPlatformContext(platform?: string): StoryPlatformContext {
  const platformContexts: Record<string, StoryPlatformContext> = {
    instagram: {
      topSafeZone: 'Top 15% covered by profile picture, username, story progress bar',
      bottomSafeZone: 'Bottom 20% covered by reply box, send message, share icons',
      uiElements: 'Story progress bars at top, reply box at bottom',
      interactionStyle: 'Tap to advance, swipe up for links, reply box for messages',
    },
    whatsapp: {
      topSafeZone: 'Top 12% covered by contact name, timestamp',
      bottomSafeZone: 'Bottom 15% covered by reply bar, navigation',
      uiElements: 'Contact name top, reply bar bottom',
      interactionStyle: 'Tap to advance, reply at bottom',
    },
    facebook: {
      topSafeZone: 'Top 15% covered by profile info, close button',
      bottomSafeZone: 'Bottom 18% covered by reactions, reply, share',
      uiElements: 'Profile top, reaction bar bottom',
      interactionStyle: 'Tap to advance, reactions and sharing',
    },
    linkedin: {
      topSafeZone: 'Top 12% covered by profile, company info',
      bottomSafeZone: 'Bottom 15% covered by engagement options',
      uiElements: 'Professional header, engagement footer',
      interactionStyle: 'Professional B2B story viewing',
    },
  }
  return platformContexts[platform?.toLowerCase() || 'instagram'] || platformContexts.instagram
}

// ============================================================
// STORY TYPE CONTEXTS (v3.1)
// ============================================================

interface StoryTypeContext {
  mood: string
  visualStyle: string
  textTreatment: string
}

function getStoryTypeContext(storyType?: string): StoryTypeContext {
  const typeContexts: Record<string, StoryTypeContext> = {
    announcement: {
      mood: 'Exciting, newsworthy, attention-demanding',
      visualStyle: 'Bold colors, celebratory elements, high energy',
      textTreatment: 'Large impactful headline, minimal supporting text',
    },
    promotional: {
      mood: 'Urgent, valuable, action-driving',
      visualStyle: 'Commercial, offer-focused, CTA prominent',
      textTreatment: 'Offer headline prominent, clear swipe-up CTA',
    },
    quote: {
      mood: 'Thoughtful, inspiring, shareable',
      visualStyle: 'Elegant, typography-focused, subtle background',
      textTreatment: 'Quote centered, attribution below, minimal decoration',
    },
    event: {
      mood: 'Exciting, FOMO-inducing, time-sensitive',
      visualStyle: 'Event imagery, date/time prominent, energetic',
      textTreatment: 'Event name bold, date/time visible, swipe for details',
    },
    behind_the_scenes: {
      mood: 'Authentic, personal, engaging',
      visualStyle: 'Raw, authentic, less polished, relatable',
      textTreatment: 'Casual text overlays, handwritten feel',
    },
  }
  return typeContexts[storyType || 'announcement'] || typeContexts.announcement
}

// ============================================================
// MAIN BUILDER
// ============================================================

export function buildStoryPrompt(
  data: StoryFormData,
  options: EnhancedBuildOptions = {}
): string {
  // Get platform and type contexts (v3.1)
  const platformContext = getStoryPlatformContext(data.platform)
  const typeContext = getStoryTypeContext(options.contentType)

  // Build core context sections
  const logoContext = buildLogoContext(options.logoAwareness)
  const brandContext = buildBrandContext(options.brandContext)
  const qualityContext = buildQualityContext(options.resolution, 'story')

  // NEW v3.1: Build additional context sections
  const themeContext = buildThemeContext(options.theme, options.style)
  const orgContext = buildOrganizationContext(options.organizationContext)
  const langContext = buildLanguageContext(options.language)

  // Determine colors - use brand colors if available
  const colorScheme = options.brandContext?.primaryColor
    ? `Brand gradient: ${options.brandContext.primaryColor} to ${options.brandContext.secondaryColor || 'white'}`
    : data.colorScheme || 'Vibrant, bold, high contrast'

  return `
<task>Generate a full-screen vertical story design optimized for mobile viewing</task>

<format>
Type: ${data.platform || 'Instagram'} Story
Aspect Ratio: Portrait 9:16 (1080x1920 equivalent)
Purpose: Capture attention in Stories feed, encourage swipe/tap action
Viewing Context: Full-screen mobile, brief viewing time (3-5 seconds)
Story Type: ${options.contentType || 'announcement'}
</format>

${logoContext}

${brandContext}

${qualityContext}

${themeContext}

${orgContext}

${langContext}

<subject>
A thumb-stopping story graphic for: "${data.storyHeadline}"
Must capture attention and communicate message within 3 seconds.
Full-screen immersive experience.
Platform: ${data.platform || 'Instagram'} Stories
Story Type: ${options.contentType || 'announcement'} - ${typeContext.mood}
</subject>

<composition>
Layout: Full-bleed vertical design with safe zones

CRITICAL SAFE ZONE RULES:
- TOP: ${platformContext.topSafeZone}
- CENTER 65%: SAFE ZONE - all important content goes here
- BOTTOM: ${platformContext.bottomSafeZone}

Platform UI: ${platformContext.uiElements}
Interaction: ${platformContext.interactionStyle}

Content Placement:
- Main headline centered in safe zone (middle 65%)
${data.callToAction ? '- Swipe/tap indicator in lower portion of safe zone (NOT in bottom UI zone)' : ''}
- Keep all critical content in middle 65%
${options.logoAwareness?.hasLogo ? `- Logo in ${options.logoAwareness.logoPosition} within safe zone` : ''}

Background: ${data.backgroundStyle || 'Bold vibrant gradient'} filling entire frame
Visual Treatment: ${typeContext.visualStyle}
</composition>

<text_content>
<text role="headline" prominence="LARGEST" style="${typeContext.textTreatment}, centered in safe zone, high contrast">${data.storyHeadline}</text>
${data.callToAction ? `<text role="cta" prominence="prominent" style="swipe-up indicator style, near bottom of safe zone (NOT in bottom UI zone)">${data.callToAction}</text>` : ''}
</text_content>

<style>
Visual Style: Mobile-native, immersive, story-optimized
Color Palette: ${colorScheme}
${options.brandContext ? `Brand Integration: Gradient uses ${options.brandContext.primaryColor} and ${options.brandContext.secondaryColor || 'complementary color'}` : ''}
Mood: ${typeContext.mood}
Typography: Large, bold, easily readable at a glance
</style>

${STORY_EXAMPLES}

<quality_markers>
- Full-screen impact
- Content clearly in safe zones (not hidden by ${data.platform || 'Instagram'} UI)
- Readable at a glance
- Thumb-stopping in Stories feed
- Encourages interaction (swipe, tap, reply)
- Matches ${options.contentType || 'announcement'} story type expectations
${options.logoAwareness?.hasLogo ? '- Logo area positioned correctly within safe zone' : ''}
${options.brandContext ? '- Brand colors properly integrated into gradient' : ''}
</quality_markers>

<constraints>
Avoid: Content in UI zones (${platformContext.topSafeZone.split(' ')[0]} or ${platformContext.bottomSafeZone.split(' ')[0]}), tiny text, horizontal composition, boring/static design, cluttered layout, hard to read quickly, important content outside safe zone
${options.logoAwareness?.hasLogo ? `Avoid: Logo placement in UI zones` : ''}
</constraints>

<render_constraints>
CRITICAL: Only render text that appears inside <text role="...">content</text> tags.
DO NOT render as visible text:
- XML tag names (task, format, composition, style, constraints)
- Instruction phrases (Generate, Create, Include, Apply)
- Platform terminology (safe zone, swipe-up, UI elements)
- Words: IMPORTANT, CRITICAL, NOTE, AVOID
</render_constraints>
`.trim()
}

// Export for use elsewhere
export { STORY_EXAMPLES }
