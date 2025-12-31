/**
 * Flyer Prompt Builder v3.3
 * Generates XML-structured prompts for A4/A5 print flyers
 * Enhanced with:
 * - Logo awareness, brand context, and quality context
 * - Theme and organization context (v3.1)
 * - Size variations for A4/A5 formats
 * - AI-driven contextual backgrounds with decorative elements (v3.2)
 * - Claude Agent-powered intelligent design analysis (v3.3)
 */

import type { FlyerFormData, EnhancedBuildOptions } from '../types'
import type { AgentDesignRecommendation } from '@/lib/agents/design-analysis-agent'
import {
  buildLogoContext,
  buildBrandContext,
  buildQualityContext,
  buildThemeContext,
  buildOrganizationContext,
  buildLayoutZoneContext,
  buildLanguageContext,
} from '../context-helpers'
import { FLYER_EXAMPLES } from '../examples'
import {
  inferEventTypeFromContent,
  getEventTypeLabel,
} from '../helpers/event-type-inference'
import {
  getVisualElements,
  hasVisualElements,
} from '@/lib/prompts/data/visual-elements-guide'

// Import decorative elements helper (v3.2 - for design context integration)
import {
  buildDecorativeElementsSection,
  buildBackgroundSettingSection,
} from '../helpers/decorative-elements-injector'

// Import time formatter utility (v3.4)
import { formatEventTime } from '@/lib/utils/time-formatter'

// Import color personality system for dynamic background generation (v6.0 Phase 2)
import {
  analyzeColorPersonality,
  generateColorAwareBackground,
  generateVisualMetaphors,
  type ColorPersonality,
} from '@/lib/prompts/helpers/color-personality'
import type { ResolvedColors } from '@/lib/utils/resolve-color-config'
import type { DesignContextForPrompt } from '../types'

// Import logo zone enforcement helper (v3.5)
import { buildForbiddenZonesSection, buildZoneReminderSection } from '../helpers/logo-zone-enforcement'
import { getSophistication, getIntegratedZoneContext } from '../helpers/sophistication-helper'

// Import dynamic color description builder (v5.4)
import { buildColorDescriptionFromResolved } from '../../../helpers/color-narrative'

// ============================================================
// SIZE VARIATIONS (v3.1)
// ============================================================

interface FlyerSizeContext {
  dimensions: string
  margins: string
  textGuidance: string
  layoutAdvice: string
}

function getFlyerLayoutForSize(size?: string): FlyerSizeContext {
  const sizeContexts: Record<string, FlyerSizeContext> = {
    A4: {
      dimensions: '210mm × 297mm (8.27" × 11.69")',
      margins: 'generous margins (15mm minimum)',
      textGuidance: 'Multiple content zones allowed, detailed information acceptable',
      layoutAdvice: 'Full page - generous margins (15mm), multiple content zones, detailed information allowed',
    },
    A5: {
      dimensions: '148mm × 210mm (5.83" × 8.27")',
      margins: 'tighter margins (10mm)',
      textGuidance: 'Focused content, larger text for quick scanning',
      layoutAdvice: 'Half page - tighter margins (10mm), focused content, larger text for quick scanning',
    },
  }
  return sizeContexts[size || 'A4'] || sizeContexts.A4
}

// ============================================================
// COLOR-AWARE DYNAMIC CONTEXT HELPERS (v6.0 - Phase 2)
// ============================================================

/**
 * Builds FlyerEventContext from Design Intelligence background setting
 * Injects user colors into the AI-generated background description (print-optimized)
 */
function buildFlyerContextFromDesignIntelligence(
  designContext: DesignContextForPrompt,
  userColors?: ResolvedColors
): FlyerEventContext {
  const backgroundSetting = designContext.backgroundSetting || 'Professional modern design environment'
  const designStrategy = designContext.designStrategy || 'Modern professional design'

  // Inject user colors into background description if provided
  let enhancedBackground = backgroundSetting
  if (userColors && userColors.source !== 'fallback') {
    const personality = analyzeColorPersonality(userColors.primaryColor)
    enhancedBackground = `${backgroundSetting} - Dominated by ${userColors.primaryColor} (${personality.name}) with ${personality.mood} atmosphere. ${personality.backgroundStyle}. Print-optimized with CMYK-safe colors.`
  }

  // Extract decorative elements from design context
  const decorativeElements: string[] = []
  if (designContext.decorativeElements) {
    if (designContext.decorativeElements.corners) decorativeElements.push(designContext.decorativeElements.corners)
    if (designContext.decorativeElements.patterns) decorativeElements.push(designContext.decorativeElements.patterns)
    if (designContext.decorativeElements.accents) decorativeElements.push(designContext.decorativeElements.accents)
  }
  if (userColors) {
    const personality = analyzeColorPersonality(userColors.primaryColor)
    decorativeElements.push(...personality.visualElements.slice(0, 3))
  }

  // v6.0 Phase 3: Use custom theme if generated
  const themeInfo = designContext.customThemeNarrative
    ? `${designContext.customThemeNarrative.themeName} - ${designContext.customThemeNarrative.themeDescription}`
    : designStrategy

  return {
    background: enhancedBackground,
    decorativeElements: decorativeElements.length > 0 ? decorativeElements : ['Modern geometric patterns', 'Subtle accent lines'],
    style: themeInfo,  // Use custom theme name + description if available
    colors: userColors
      ? `Primary: ${userColors.primaryColor}, Secondary: ${userColors.secondaryColor}, Accent: ${userColors.accentColor} (${userColors.source} colors, CMYK-safe)`
      : designContext.colorMood || 'Balanced professional palette',
    mood: designContext.emotionalJob || designContext.moodDirection || 'Professional, engaging',
    printConsiderations: 'Optimized for print with high contrast, CMYK-safe colors, readable at distance',
  }
}

/**
 * Builds FlyerEventContext dynamically using color personality analysis
 * Combines color mood with event type for unique visual narrative (print-optimized)
 */
function buildDynamicFlyerColorContext(
  eventType: string,
  userColors: ResolvedColors
): FlyerEventContext {
  const personality = analyzeColorPersonality(userColors.primaryColor)
  const backgroundDescription = generateColorAwareBackground(eventType, userColors)

  // Generate print-appropriate decorative elements
  const decorativeElements = generateVisualMetaphors(eventType, personality)

  return {
    background: `${backgroundDescription} - Print-optimized with CMYK-safe color values.`,
    decorativeElements: decorativeElements,
    style: `${personality.name} themed ${eventType} design with ${personality.mood} atmosphere - professional print quality`,
    colors: `Primary: ${userColors.primaryColor}, Secondary: ${userColors.secondaryColor}, Accent: ${userColors.accentColor} (${userColors.source} - ${personality.name}, CMYK-safe)`,
    mood: `${personality.mood}, professional, print-appropriate`,
    printConsiderations: `High contrast for readability, CMYK-safe color conversion, ${personality.name} color harmony, scannable at distance`,
  }
}

// ============================================================
// FLYER EVENT CONTEXTS (v3.2 - AI Background Generation)
// ============================================================

interface FlyerEventContext {
  /** Rich background description with gradients and decorative elements */
  background: string
  /** Contextual decorative elements to integrate subtly */
  decorativeElements: string[]
  /** Visual style description */
  style: string
  /** Color palette with hex codes */
  colors: string
  /** Mood and atmosphere to convey */
  mood: string
  /** Print-specific considerations */
  printConsiderations: string
}

/**
 * Get event-specific context for AI background generation (v6.0 - Color-Aware)
 * Uses 3-tier priority system:
 * 1. Design Intelligence context (AI-generated custom backgrounds)
 * 2. Color Personality (dynamic based on user colors)
 * 3. Minimal Fallback (clean professional, no event-type assumptions)
 */
function getFlyerEventContext(
  eventType: string = 'general',
  userColors?: ResolvedColors,
  designContext?: DesignContextForPrompt
): FlyerEventContext {
  // Priority 1: Use AI Design Intelligence if available
  if (designContext?.backgroundSetting) {
    console.log(`[Flyer Context] Using Design Intelligence for ${eventType}`)
    return buildFlyerContextFromDesignIntelligence(designContext, userColors)
  }

  // Priority 2: Dynamic color-driven generation
  if (userColors && userColors.source !== 'fallback') {
    console.log(`[Flyer Context] Using Color Personality (${userColors.source}) for ${eventType}`)
    return buildDynamicFlyerColorContext(eventType, userColors)
  }

  // Priority 3: Minimal generic fallback (NO hardcoded event visuals)
  console.log(`[Flyer Context] Using minimal fallback for ${eventType}`)
  return {
    background: 'Clean professional design environment with balanced composition - print-optimized',
    decorativeElements: [
      'subtle modern patterns',
      'professional geometric elements',
      'balanced accent shapes',
    ],
    style: 'Professional marketing, modern clean, versatile - print-ready',
    colors: 'Professional balanced palette (CMYK-safe)',
    mood: 'Professional, trustworthy, action-driving, versatile',
    printConsiderations: 'CMYK-safe colors, high contrast for readability, scannable at distance',
  }
}

// ============================================================
// AI BACKGROUND SECTION BUILDER (v3.3 - Agent Enhanced)
// ============================================================

interface AIBackgroundResult {
  /** The XML section to inject into the prompt */
  section: string
  /** The event context used */
  eventContext: FlyerEventContext
  /** Whether AI background is active */
  isActive: boolean
  /** Inferred event type */
  inferredType: string | null
  /** Agent recommendation (when agent is used) */
  agentRecommendation?: AgentDesignRecommendation
}

/**
 * Build AI-driven background section for flyers
 * Activated when user selects "AI" theme/style
 *
 * v3.3: Can optionally use agent recommendation for richer context
 */
function buildAIBackgroundSection(
  data: FlyerFormData,
  options: EnhancedBuildOptions,
  agentRecommendation?: AgentDesignRecommendation
): AIBackgroundResult {
  // Check if AI background should be activated
  const useAIBackground =
    options.theme?.toLowerCase() === 'ai' ||
    options.style?.toLowerCase() === 'ai' ||
    data.backgroundStyle?.toLowerCase() === 'ai' ||
    data.backgroundStyle?.toLowerCase() === 'auto' ||
    data.backgroundStyle?.toLowerCase() === 'contextual'

  if (!useAIBackground) {
    return {
      section: '',
      eventContext: getFlyerEventContext('general', options.resolvedColors, options.designContext),
      isActive: false,
      inferredType: null,
    }
  }

  // If agent recommendation is provided, use it for richer context
  if (agentRecommendation) {
    return buildAgentEnhancedSection(data, options, agentRecommendation)
  }

  // Fallback to keyword-based inference (v3.2 behavior)
  const inference = inferEventTypeFromContent(
    data.flyerTitle,
    data.flyerDescription,
    data.venue
  )

  const inferredType = data.eventType || inference.eventType
  // v6.0: Pass resolvedColors and designContext for dynamic color-aware generation
  const eventContext = getFlyerEventContext(inferredType || 'general', options.resolvedColors, options.designContext)

  // Get visual elements from the guide if available
  let visualElements: string[]
  if (inferredType && hasVisualElements(inferredType)) {
    // Use official visual elements guide (limit to 4 for decorative use)
    visualElements = getVisualElements(inferredType).slice(0, 4)
  } else {
    // Fall back to context-defined decorative elements
    visualElements = eventContext.decorativeElements.slice(0, 4)
  }

  const section = `
<ai_background_context>
AI-GENERATED RICH, IMMERSIVE BACKGROUND ACTIVE

Detected Event Category: ${inferredType ? getEventTypeLabel(inferredType) : 'General Promotional'} (confidence: ${inference.confidence})
${inference.matchedKeywords.length > 0 ? `Matched Keywords: ${inference.matchedKeywords.join(', ')}` : ''}
${inference.secondaryType ? `Secondary Context: ${inference.secondaryType} (enhancing visual style)` : ''}

Background Design Vision:
${eventContext.background}

Visual Elements to INTEGRATE throughout the design:
${visualElements.map((el, i) => `${i + 1}. ${el}`).join('\n')}

Visual Style: ${eventContext.style}
Color Psychology: ${eventContext.colors}
Mood to Convey: ${eventContext.mood}
Print Considerations: ${eventContext.printConsiderations}

CREATIVE FREEDOM - BUILD A RICH, ATMOSPHERIC DESIGN:
- Visual elements should DEFINE the atmosphere, not just decorate corners
- CREATE DEPTH: Use multiple layers - large blurred elements in back, crisp details in mid-ground
- INTEGRATE THROUGHOUT: Elements can flow across the entire background
- BUILD VISUAL STORY: The design should FEEL like a ${inferredType || 'professional'} event through visual language
- DYNAMIC COMPOSITION: Let elements create flow and movement
- Think Google AI Studio quality - layered, dimensional, professional

ONLY AVOID placing prominent elements in:
- Text content areas (headlines, dates, venue must be legible)
- Header and footer areas (top 15%, bottom 10%)
</ai_background_context>
`

  return {
    section,
    eventContext,
    isActive: true,
    inferredType,
  }
}

/**
 * Build AI background section using Claude Agent recommendation (v3.3)
 * Agent provides deeper contextual analysis and creative recommendations
 */
function buildAgentEnhancedSection(
  data: FlyerFormData,
  options: EnhancedBuildOptions,
  recommendation: AgentDesignRecommendation
): AIBackgroundResult {
  // Build event context from agent recommendation
  const eventContext: FlyerEventContext = {
    background: recommendation.background,
    decorativeElements: recommendation.decorativeElements,
    style: recommendation.style,
    colors: recommendation.colorPalette
      ? `Primary: ${recommendation.colorPalette.primary.name} (${recommendation.colorPalette.primary.hex}), Secondary: ${recommendation.colorPalette.secondary.name} (${recommendation.colorPalette.secondary.hex}), Accent: ${recommendation.colorPalette.accent.name} (${recommendation.colorPalette.accent.hex})`
      : 'Agent-recommended palette (respecting brand constraints)',
    mood: recommendation.mood,
    printConsiderations: 'CMYK-safe colors, high contrast for readability, optimized for print',
  }

  const section = `
<ai_background_context>
CLAUDE AGENT-POWERED INTELLIGENT DESIGN - CREATIVE FREEDOM ACTIVE

Analysis by: Claude Design Intelligence Agent
Detected Event Type: ${recommendation.detectedEventType}
${recommendation.secondaryContext ? `Secondary Context: ${recommendation.secondaryContext}` : ''}

Agent's Design Rationale:
${recommendation.rationale}

Background Design Vision:
${recommendation.background}

Visual Elements to INTEGRATE throughout the design:
${recommendation.decorativeElements.map((el, i) => `${i + 1}. ${el}`).join('\n')}

Visual Style: ${recommendation.style}
Design Mood: ${recommendation.mood}
${recommendation.colorPalette ? `
Color Palette (Agent-Recommended):
- Primary: ${recommendation.colorPalette.primary.name} (${recommendation.colorPalette.primary.hex}) - ${recommendation.colorPalette.primary.reasoning}
- Secondary: ${recommendation.colorPalette.secondary.name} (${recommendation.colorPalette.secondary.hex}) - ${recommendation.colorPalette.secondary.reasoning}
- Accent: ${recommendation.colorPalette.accent.name} (${recommendation.colorPalette.accent.hex}) - ${recommendation.colorPalette.accent.reasoning}
` : 'Colors: Following brand/vertical preset constraints'}

CREATIVE FREEDOM - BUILD A RICH, ATMOSPHERIC DESIGN:
- Agent has analyzed event context deeply - trust its recommendations fully
- Decorative elements chosen specifically for this event type - USE THEM BOLDLY
- CREATE DEPTH: Multiple layers, gradients, ambient lighting effects
- INTEGRATE THROUGHOUT: Elements should define the atmosphere of the entire design
- BUILD VISUAL STORY: The design should FEEL like a ${recommendation.detectedEventType} event
- DYNAMIC COMPOSITION: Let elements create visual flow and movement
- Think Google AI Studio quality - layered, dimensional, professional

ONLY AVOID placing prominent elements in:
- Text content areas (headlines, details must be legible)
- Header and footer areas (top 15%, bottom 10%)
</ai_background_context>
`

  return {
    section,
    eventContext,
    isActive: true,
    inferredType: recommendation.detectedEventType,
    agentRecommendation: recommendation,
  }
}

// ============================================================
// MAIN BUILDER
// ============================================================

export function buildFlyerPrompt(
  data: FlyerFormData,
  options: EnhancedBuildOptions = {}
): string {
  const contactInfo = [data.contactPhone, data.contactEmail, data.websiteUrl].filter(Boolean)

  // Get size context (v3.1)
  const flyerSize = options.formatSize || data.size || 'A4'
  const sizeContext = getFlyerLayoutForSize(flyerSize)

  // Build core context sections
  const logoContext = buildLogoContext(options.logoAwareness)
  const brandContext = buildBrandContext(options.brandContext)
  const qualityContext = buildQualityContext(options.resolution, 'flyer')

  // NEW v3.1: Build additional context sections
  const themeContext = buildThemeContext(options.theme, options.style)
  const orgContext = buildOrganizationContext(options.organizationContext)
  const layoutContext = buildLayoutZoneContext(options.layout)
  const langContext = buildLanguageContext(options.language)

  // NEW v4.1: Sophistication Logic
  const sophistication = getSophistication(options, 'balanced')

  // NEW v3.5: Build forbidden zones (Sophistication-Aware)
  const { forbiddenZonesContext, zoneReminderContext } = getIntegratedZoneContext(options, sophistication)

  // NEW v3.2: Build AI background section if applicable
  const aiBackgroundResult = buildAIBackgroundSection(data, options)
  const useAIBackground = aiBackgroundResult.isActive
  const aiBackgroundSection = aiBackgroundResult.section
  const eventContext = aiBackgroundResult.eventContext

  // NEW v3.2: Build decorative elements from Design Intelligence (when AI background not active)
  // This ensures event-type specific visual elements are injected even for non-AI themes
  const designContextDecorativeSection = !useAIBackground
    ? buildDecorativeElementsSection({
      eventType: data.eventType,
      designContext: options.designContext,
      maxElements: 4,
      includeIconicImagery: true,
    })
    : ''
  const designContextBackgroundSection = !useAIBackground
    ? buildBackgroundSettingSection(options.designContext)
    : ''

  // Determine colors - use brand colors if available, then event context, then fallback
  let colorScheme: string
  if (options.brandContext?.primaryColor) {
    // v5.4: Use dynamic color description builder instead of simple string
    colorScheme = buildColorDescriptionFromResolved({
      source: options.brandContext.colorSource || 'preset',
      primaryColor: options.brandContext.primaryColor,
      secondaryColor: options.brandContext.secondaryColor || '#FFFFFF',
      accentColor: options.brandContext.accentColor || '#000000',
    })
  } else if (useAIBackground) {
    colorScheme = eventContext.colors
  } else {
    colorScheme = data.colorScheme || 'Brand-appropriate, professional'
  }

  // Determine background description
  const backgroundDescription = useAIBackground
    ? `Background: ${eventContext.background}`
    : `Background: ${data.backgroundStyle || 'Clean, professional gradient'} suitable for print`

  // Determine mood
  const moodDescription = useAIBackground
    ? eventContext.mood
    : 'Professional, trustworthy, action-driving'

  // Determine visual style
  const visualStyle = useAIBackground
    ? eventContext.style
    : 'Professional marketing, print-ready'

  // v6.0: Extract custom fields from compiled data (Fix for custom fields not rendering)
  const customFieldsText: string[] = []
  if (data.customFields && Object.keys(data.customFields).length > 0) {
    for (const [fieldName, fieldValue] of Object.entries(data.customFields)) {
      if (fieldValue && fieldValue.trim()) {
        // Store just the value (no field name to prevent label rendering in Gemini)
        customFieldsText.push(`"${fieldValue.trim()}"`)
      }
    }
  }

  return `
<task>Generate a professional print-ready promotional flyer</task>

<format>
Type: Promotional Flyer
Size: ${flyerSize} Portrait (${sizeContext.dimensions})
Purpose: Physical/digital distribution, drive action, communicate offer
Usage: Print distribution, digital sharing, marketing material
Layout Approach: ${sizeContext.layoutAdvice}
</format>

${logoContext}

${brandContext}

${qualityContext}

${themeContext}

${orgContext}

${layoutContext}

${forbiddenZonesContext}

${langContext}

${aiBackgroundSection}

${designContextDecorativeSection}

${designContextBackgroundSection}

<subject>
A professional marketing flyer for: "${data.flyerTitle}"
Print Size: ${flyerSize} - ${sizeContext.textGuidance}
Must communicate value proposition and drive specific action.
Designed for both print and digital use.
${useAIBackground ? `Event Context: ${moodDescription}` : ''}
</subject>

<composition>
Layout: Clear vertical hierarchy with defined zones
Size-Specific: ${sizeContext.layoutAdvice}

Zone Structure (optimized for ${flyerSize}):
- HEADER (15%): Clean background area ${options.logoAwareness?.hasLogo ? `in ${options.logoAwareness.logoPosition}` : 'at top'}
- HEADLINE (25%): "${data.flyerTitle}" - bold, attention-grabbing
- CONTENT (40%): Key information, benefits, details
- ACTION (20%): CTA, contact info, event details

Content Elements:
${data.flyerDescription ? `- Description: "${data.flyerDescription}"` : ''}
${data.eventDate ? `- Date: "${data.eventDate}" with calendar icon` : ''}
${data.eventTime ? `- Time: "${data.eventEndTime ? formatEventTime(data.eventTime) + ' - ' + formatEventTime(data.eventEndTime) : formatEventTime(data.eventTime)}" with clock icon` : ''}
${data.venue ? `- Venue: "${data.venue}" with location marker` : ''}
${data.price ? `- Price: "${data.price}" - highlighted/emphasized` : ''}
${customFieldsText.length > 0 ? `- Additional Details: ${customFieldsText.map(t => t).join(', ')}` : ''}
- CTA: "${data.callToAction || 'Contact Us Today'}" - prominent button/banner
${contactInfo.length > 0 ? `- Contact: ${contactInfo.join(' | ')}` : ''}

${backgroundDescription}
${options.brandContext ? `Brand Integration: Use ${options.brandContext.primaryColor} as primary, ${options.brandContext.secondaryColor || 'white'} as secondary` : ''}
Margins: ${sizeContext.margins}
</composition>

<text_content>
<text role="headline" prominence="LARGEST" style="bold, impactful, attention-grabbing">${data.flyerTitle}</text>
${data.flyerDescription ? `<text role="body" prominence="medium" style="clear, readable">${data.flyerDescription}</text>` : ''}
${data.eventDate ? `<text role="date" prominence="medium" style="bold with calendar icon">${data.eventDate}</text>` : ''}
${data.eventTime ? `<text role="time" prominence="medium" style="bold with clock icon">${data.eventEndTime ? formatEventTime(data.eventTime) + ' - ' + formatEventTime(data.eventEndTime) : formatEventTime(data.eventTime)}</text>` : ''}
${data.venue ? `<text role="venue" prominence="medium" style="clear with location icon">${data.venue}</text>` : ''}
${data.price ? `<text role="price" prominence="prominent" style="highlighted, badge or tag format">${data.price}</text>` : ''}
${customFieldsText.length > 0 ? customFieldsText.map(text => `<text role="detail" prominence="medium" style="clear, readable">${text}</text>`).join('\n') : ''}
<text role="cta" prominence="prominent" style="button-style, high contrast">${data.callToAction || 'Contact Us Today'}</text>
${contactInfo.length > 0 ? `<text role="contact" prominence="small" style="clean, readable">${contactInfo.join(' | ')}</text>` : ''}
${data.eventNote ? `<text role="note" prominence="small" style="footer text, bottom 5-10%">"${data.eventNote}"</text>` : ''}
</text_content>

<style>
Visual Style: ${visualStyle}
Color Palette: ${colorScheme}
Mood: ${moodDescription}
Typography: Clear hierarchy, readable at ${flyerSize} print size
Print Considerations: ${useAIBackground ? eventContext.printConsiderations : 'CMYK-safe colors, high contrast for readability'}
Icons: Clean, modern iconography for date/time/venue
</style>

${FLYER_EXAMPLES}

<quality_markers>
- PRINT TEST: Would look professional printed at ${flyerSize}
- SCAN TEST: 5-second scan reveals key info (what, when, where, how to act)
- HIERARCHY TEST: Clear visual flow from top to bottom
- LEGIBILITY TEST: All text readable at ${flyerSize} print size
- ACTION TEST: Clear CTA drives specific action
${useAIBackground ? '- CONTEXT TEST: Decorative elements match event type and enhance visual appeal' : ''}
${options.logoAwareness?.hasLogo ? '- Logo area with clean background' : ''}
${options.brandContext ? '- Brand colors properly applied' : ''}
</quality_markers>

<constraints>
Avoid: Low resolution (not print-ready), web-only RGB colors, cluttered layout, tiny unreadable text, poor hierarchy, too many competing fonts, missing contact info
${flyerSize === 'A5' ? 'For A5: Avoid too much text - focus on essentials only' : ''}
${options.logoAwareness?.hasLogo ? `Avoid: Complex elements in ${options.logoAwareness.logoPosition} area` : ''}
${useAIBackground ? 'Avoid: Decorative elements that obscure text, compete with headline, or overwhelm the design' : ''}
</constraints>

${options?.preventionEnhancements?.length ? `
<learned_improvements>
${options.preventionEnhancements.map((e, i) => `${i + 1}. ${e}`).join('\n')}
</learned_improvements>
` : ''}

<render_constraints>
CRITICAL: Only render text that appears inside <text role="...">content</text> tags.
DO NOT render as visible text:
- XML tag names (task, format, composition, style, constraints)
- Instruction phrases (Generate, Create, Include, Apply)
- Print terminology (CMYK, margins, bleed)
- Words: IMPORTANT, CRITICAL, NOTE, AVOID
${useAIBackground ? '- AI background context instructions (ai_background_context section)' : ''}

STRICT CTA PROHIBITION:
- Only render the CTA text that appears in <text role="cta">...</text> above
- DO NOT add additional CTAs beyond what is specified
- If a default CTA was used, render ONLY that exact text, not variations
- BLACKLISTED CTA PHRASES (never render unless explicitly in <text role="cta">):
  "Learn More", "Shop Now", "Sign Up", "Get Started", "Buy Now", "Click Here",
  "Subscribe", "Join Now", "Register", "Download", "Read More",
  "Book Now", "Order Now", "Try Free", "Start Free", "Explore", "Discover"
</render_constraints>

<ai_control_boundary>
AI GENERATES (you control these):
- Background: gradients, patterns, textures, lighting effects
- Style: visual mood, color harmony, professional finish
- Layout: element positioning, visual hierarchy, spacing
- Typography Styling: font sizes, weights, effects (NOT font family if specified in brand_context)
- Decorative Elements: event-appropriate icons, symbols from decorative_elements section

AI MUST NOT GENERATE:
- Human faces or figures (photos are overlaid separately if needed)
- Exact text content (use ONLY values from text_content tags)
- Logos or branding marks (added via post-processing)
- Different font families than specified in brand_context (if any)

USER PROVIDES (do not recreate or modify):
- Exact text content (title, description, date, venue in quotes)
- Branding elements (added via post-processing)
- Font family preference (from organization settings if available)
</ai_control_boundary>
`.trim()
}

// ============================================================
// AGENT-ENHANCED BUILDER (v3.3)
// ============================================================

/**
 * Extended build options with agent recommendation
 */
export interface AgentEnhancedBuildOptions extends EnhancedBuildOptions {
  /** Pre-computed agent recommendation (optional) */
  agentRecommendation?: AgentDesignRecommendation
}

/**
 * Build flyer prompt with optional agent enhancement
 * If agentRecommendation is provided, it will be used for richer context
 *
 * Usage:
 * 1. Call analyzeEventWithAgent() from design-analysis-agent.ts
 * 2. Pass the recommendation to this function
 * 3. Get agent-enhanced prompt
 */
export function buildFlyerPromptWithAgent(
  data: FlyerFormData,
  options: AgentEnhancedBuildOptions = {}
): string {
  const contactInfo = [data.contactPhone, data.contactEmail, data.websiteUrl].filter(Boolean)

  // Get size context (v3.1)
  const flyerSize = options.formatSize || data.size || 'A4'
  const sizeContext = getFlyerLayoutForSize(flyerSize)

  // Build core context sections
  const logoContext = buildLogoContext(options.logoAwareness)
  const brandContext = buildBrandContext(options.brandContext)
  const qualityContext = buildQualityContext(options.resolution, 'flyer')

  // Build additional context sections
  const themeContext = buildThemeContext(options.theme, options.style)
  const orgContext = buildOrganizationContext(options.organizationContext)
  const layoutContext = buildLayoutZoneContext(options.layout)
  const langContext = buildLanguageContext(options.language)

  // Build forbidden zones for strict logo-text overlap prevention
  const forbiddenZonesContext = buildForbiddenZonesSection(options.logoAwareness)
  const zoneReminderContext = buildZoneReminderSection(options.logoAwareness)

  // Build AI background section WITH agent recommendation
  const aiBackgroundResult = buildAIBackgroundSection(data, options, options.agentRecommendation)
  const useAIBackground = aiBackgroundResult.isActive
  const aiBackgroundSection = aiBackgroundResult.section
  const eventContext = aiBackgroundResult.eventContext

  // Determine colors - use brand colors if available, then agent recommendation, then event context
  let colorScheme: string
  if (options.brandContext?.primaryColor) {
    // v5.4: Use dynamic color description builder instead of simple string
    colorScheme = buildColorDescriptionFromResolved({
      source: options.brandContext.colorSource || 'preset',
      primaryColor: options.brandContext.primaryColor,
      secondaryColor: options.brandContext.secondaryColor || '#FFFFFF',
      accentColor: options.brandContext.accentColor || '#000000',
    })
  } else if (options.agentRecommendation?.colorPalette) {
    const palette = options.agentRecommendation.colorPalette
    colorScheme = `Agent-recommended: ${palette.primary.name} (${palette.primary.hex}), ${palette.secondary.name} (${palette.secondary.hex}), ${palette.accent.name} (${palette.accent.hex})`
  } else if (useAIBackground) {
    colorScheme = eventContext.colors
  } else {
    colorScheme = data.colorScheme || 'Brand-appropriate, professional'
  }

  // Determine background description
  const backgroundDescription = useAIBackground
    ? `Background: ${eventContext.background}`
    : `Background: ${data.backgroundStyle || 'Clean, professional gradient'} suitable for print`

  // Determine mood - agent recommendation takes priority
  const moodDescription = options.agentRecommendation?.mood
    || (useAIBackground ? eventContext.mood : 'Professional, trustworthy, action-driving')

  // Determine visual style
  const visualStyle = options.agentRecommendation?.style
    || (useAIBackground ? eventContext.style : 'Professional marketing, print-ready')

  // v6.0: Extract custom fields from compiled data (Fix for custom fields not rendering)
  const customFieldsText: string[] = []
  if (data.customFields && Object.keys(data.customFields).length > 0) {
    for (const [fieldName, fieldValue] of Object.entries(data.customFields)) {
      if (fieldValue && fieldValue.trim()) {
        // Store just the value (no field name to prevent label rendering in Gemini)
        customFieldsText.push(`"${fieldValue.trim()}"`)
      }
    }
  }

  return `
<task>Generate a professional print-ready promotional flyer</task>

<format>
Type: Promotional Flyer
Size: ${flyerSize} Portrait (${sizeContext.dimensions})
Purpose: Physical/digital distribution, drive action, communicate offer
Usage: Print distribution, digital sharing, marketing material
Layout Approach: ${sizeContext.layoutAdvice}
</format>

${logoContext}

${brandContext}

${qualityContext}

${themeContext}

${orgContext}

${layoutContext}

${forbiddenZonesContext}

${langContext}

${aiBackgroundSection}

<subject>
A professional marketing flyer for: "${data.flyerTitle}"
Print Size: ${flyerSize} - ${sizeContext.textGuidance}
Must communicate value proposition and drive specific action.
Designed for both print and digital use.
${useAIBackground ? `Event Context: ${moodDescription}` : ''}
${options.agentRecommendation ? `Agent Analysis: ${options.agentRecommendation.rationale}` : ''}
</subject>

<composition>
Layout: Clear vertical hierarchy with defined zones
Size-Specific: ${sizeContext.layoutAdvice}

Zone Structure (optimized for ${flyerSize}):
- HEADER (15%): Clean background area ${options.logoAwareness?.hasLogo ? `in ${options.logoAwareness.logoPosition}` : 'at top'}
- HEADLINE (25%): "${data.flyerTitle}" - bold, attention-grabbing
- CONTENT (40%): Key information, benefits, details
- ACTION (20%): CTA, contact info, event details

Content Elements:
${data.flyerDescription ? `- Description: "${data.flyerDescription}"` : ''}
${data.eventDate ? `- Date: "${data.eventDate}" with calendar icon` : ''}
${data.eventTime ? `- Time: "${data.eventEndTime ? formatEventTime(data.eventTime) + ' - ' + formatEventTime(data.eventEndTime) : formatEventTime(data.eventTime)}" with clock icon` : ''}
${data.venue ? `- Venue: "${data.venue}" with location marker` : ''}
${data.price ? `- Price: "${data.price}" - highlighted/emphasized` : ''}
${customFieldsText.length > 0 ? `- Additional Details: ${customFieldsText.map(t => t).join(', ')}` : ''}
- CTA: "${data.callToAction || 'Contact Us Today'}" - prominent button/banner
${contactInfo.length > 0 ? `- Contact: ${contactInfo.join(' | ')}` : ''}

${backgroundDescription}
${options.brandContext ? `Brand Integration: Use ${options.brandContext.primaryColor} as primary, ${options.brandContext.secondaryColor || 'white'} as secondary` : ''}
Margins: ${sizeContext.margins}
</composition>

<text_content>
<text role="headline" prominence="LARGEST" style="bold, impactful, attention-grabbing">${data.flyerTitle}</text>
${data.flyerDescription ? `<text role="body" prominence="medium" style="clear, readable">${data.flyerDescription}</text>` : ''}
${data.eventDate ? `<text role="date" prominence="medium" style="bold with calendar icon">${data.eventDate}</text>` : ''}
${data.eventTime ? `<text role="time" prominence="medium" style="bold with clock icon">${data.eventEndTime ? formatEventTime(data.eventTime) + ' - ' + formatEventTime(data.eventEndTime) : formatEventTime(data.eventTime)}</text>` : ''}
${data.venue ? `<text role="venue" prominence="medium" style="clear with location icon">${data.venue}</text>` : ''}
${data.price ? `<text role="price" prominence="prominent" style="highlighted, badge or tag format">${data.price}</text>` : ''}
${customFieldsText.length > 0 ? customFieldsText.map(text => `<text role="detail" prominence="medium" style="clear, readable">${text}</text>`).join('\n') : ''}
<text role="cta" prominence="prominent" style="button-style, high contrast">${data.callToAction || 'Contact Us Today'}</text>
${contactInfo.length > 0 ? `<text role="contact" prominence="small" style="clean, readable">${contactInfo.join(' | ')}</text>` : ''}
${data.eventNote ? `<text role="note" prominence="small" style="footer text, bottom 5-10%">"${data.eventNote}"</text>` : ''}
</text_content>

<style>
Visual Style: ${visualStyle}
Color Palette: ${colorScheme}
Mood: ${moodDescription}
Typography: Clear hierarchy, readable at ${flyerSize} print size
Print Considerations: ${useAIBackground ? eventContext.printConsiderations : 'CMYK-safe colors, high contrast for readability'}
Icons: Clean, modern iconography for date/time/venue
</style>

${FLYER_EXAMPLES}

<quality_markers>
- PRINT TEST: Would look professional printed at ${flyerSize}
- SCAN TEST: 5-second scan reveals key info (what, when, where, how to act)
- HIERARCHY TEST: Clear visual flow from top to bottom
- LEGIBILITY TEST: All text readable at ${flyerSize} print size
- ACTION TEST: Clear CTA drives specific action
${useAIBackground ? '- CONTEXT TEST: Decorative elements match event type and enhance visual appeal' : ''}
${options.agentRecommendation ? '- AGENT TEST: Design follows intelligent agent recommendations' : ''}
${options.logoAwareness?.hasLogo ? '- Logo area with clean background' : ''}
${options.brandContext ? '- Brand colors properly applied' : ''}
</quality_markers>

<constraints>
Avoid: Low resolution (not print-ready), web-only RGB colors, cluttered layout, tiny unreadable text, poor hierarchy, too many competing fonts, missing contact info
${flyerSize === 'A5' ? 'For A5: Avoid too much text - focus on essentials only' : ''}
${options.logoAwareness?.hasLogo ? `Avoid: Complex elements in ${options.logoAwareness.logoPosition} area` : ''}
${useAIBackground ? 'Avoid: Decorative elements that obscure text, compete with headline, or overwhelm the design' : ''}
</constraints>

<render_constraints>
CRITICAL: Only render text that appears inside <text role="...">content</text> tags.
DO NOT render as visible text:
- XML tag names (task, format, composition, style, constraints)
- Instruction phrases (Generate, Create, Include, Apply)
- Print terminology (CMYK, margins, bleed)
- Words: IMPORTANT, CRITICAL, NOTE, AVOID
${useAIBackground ? '- AI background context instructions (ai_background_context section)' : ''}

STRICT CTA PROHIBITION:
- Only render the CTA text that appears in <text role="cta">...</text> above
- DO NOT add additional CTAs beyond what is specified
- If a default CTA was used, render ONLY that exact text, not variations
- BLACKLISTED CTA PHRASES (never render unless explicitly in <text role="cta">):
  "Learn More", "Shop Now", "Sign Up", "Get Started", "Buy Now", "Click Here",
  "Subscribe", "Join Now", "Register", "Download", "Read More",
  "Book Now", "Order Now", "Try Free", "Start Free", "Explore", "Discover"
</render_constraints>
`.trim()
}

// Export for use elsewhere
export { FLYER_EXAMPLES }

// Export types
export type { FlyerEventContext, AIBackgroundResult }
