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

// Import logo zone enforcement helper (v3.5)
import { buildForbiddenZonesSection, buildZoneReminderSection } from '../helpers/logo-zone-enforcement'

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
 * Get event-specific context for AI background generation
 * Maps event types to rich visual contexts with decorative elements
 */
function getFlyerEventContext(eventType: string = 'general', secondaryType?: string): FlyerEventContext {
  const contexts: Record<string, FlyerEventContext> = {
    // ============================================================
    // COMMUNITY EVENTS
    // ============================================================
    blood_donation: {
      background: 'Clean medical gradient from soft crimson red to white, with subtle heart and blood drop motifs in corners, life-saving ribbon accents along edges',
      decorativeElements: [
        'red cross medical symbol in corner',
        'heart shape with blood drop icon',
        'caring hands reaching out silhouette',
        'life-saving ribbon badge',
        'medical plus sign accents',
      ],
      style: 'Healthcare professional with warmth, urgency, and compassion',
      colors: 'Medical crimson (#DC143C), soft coral (#FF6B6B), pure white, trust blue accent (#4A90D9)',
      mood: 'Compassionate, heroic, life-saving urgency, community spirit',
      printConsiderations: 'High contrast for urgent call-to-action visibility, CMYK-safe reds',
    },
    health_camp: {
      background: 'Fresh gradient from clean healthcare green to white, with stethoscope and health shield icons in corners, subtle heartbeat line pattern',
      decorativeElements: [
        'stethoscope icon in decorative corner',
        'health shield with cross symbol',
        'heartbeat/ECG line pattern along edge',
        'medical checkup clipboard icon',
        'wellness leaf or heart icon',
      ],
      style: 'Medical professional, clean, trustworthy, welcoming',
      colors: 'Healthcare green (#28A745), calm teal (#20C997), white, soft blue accent (#6CB2EB)',
      mood: 'Caring, professional, reassuring, health-focused, community wellness',
      printConsiderations: 'Clear iconography for quick health service recognition, readable at distance',
    },
    awareness_program: {
      background: 'Gradient with cause-appropriate colors, awareness ribbon motifs, united hands silhouette, informational graphic elements',
      decorativeElements: [
        'awareness ribbon symbol (color varies by cause)',
        'united hands or community circle',
        'informational icons (lightbulb, speech bubble)',
        'supportive embrace silhouette',
        'knowledge/education symbols',
      ],
      style: 'Informative, impactful, community-focused, empowering',
      colors: 'Cause-appropriate colors with emotional depth, supportive neutrals',
      mood: 'Empowering, educational, mobilizing, hopeful, supportive',
      printConsiderations: 'Statistics and facts should be clearly readable, high impact visuals',
    },
    charity_event: {
      background: 'Warm, hopeful gradient with giving hands motif, heart shapes, community gathering silhouettes',
      decorativeElements: [
        'giving/donation hands icon',
        'heart with hands symbol',
        'community circle silhouette',
        'hope/light rays emanating',
        'helping hands reaching',
      ],
      style: 'Warm, compassionate, community-driven, hopeful',
      colors: 'Warm orange (#FF8C00), hopeful gold (#FFD700), compassionate purple (#8B5CF6), white',
      mood: 'Generous, hopeful, community spirit, making a difference',
      printConsiderations: 'Emotional appeal through warm colors, clear donation information',
    },

    // ============================================================
    // ACADEMIC EVENTS
    // ============================================================
    seminar: {
      background: 'Professional navy blue gradient with subtle podium and microphone silhouettes, elegant geometric patterns, knowledge symbols',
      decorativeElements: [
        'podium with microphone icon',
        'thought bubble or lightbulb symbol',
        'open book or notebook icon',
        'speaker silhouette at lectern',
        'geometric knowledge patterns',
      ],
      style: 'Academic professional, intellectual, thought-provoking',
      colors: 'Deep navy (#1E3A5F), scholarly burgundy (#722F37), gold accent (#D4AF37), white',
      mood: 'Intellectual, prestigious, knowledge-focused, engaging, thought leadership',
      printConsiderations: 'Space for speaker details and topic highlights, professional typography',
    },
    workshop: {
      background: 'Warm gradient from vibrant orange to coral with hands-on activity icons, tool silhouettes, collaborative energy patterns',
      decorativeElements: [
        'hands working together icon',
        'tools and equipment silhouettes',
        'step-by-step progress indicators',
        'lightbulb innovation symbol',
        'collaborative gear/cog icons',
      ],
      style: 'Educational, approachable, practical, hands-on energy',
      colors: 'Warm orange (#FF6B35), energetic coral (#FF8E72), skill blue (#005B96), white',
      mood: 'Engaging, skill-building, collaborative energy, practical learning',
      printConsiderations: 'Space for workshop schedule or learning outcomes, active visual feel',
    },
    conference: {
      background: 'Sleek corporate gradient with stage lighting effects, networking silhouettes, professional geometric patterns',
      decorativeElements: [
        'conference stage with spotlight',
        'networking people silhouettes',
        'conference badge icons',
        'presentation screen symbol',
        'professional handshake icon',
      ],
      style: 'Corporate professional, networking-focused, prestigious',
      colors: 'Deep corporate blue (#003366), gold accent (#D4AF37), white, subtle gray (#E5E7EB)',
      mood: 'Professional, authoritative, opportunity-rich, networking energy',
      printConsiderations: 'Multiple speaker sections may be needed, corporate quality feel',
    },
    webinar: {
      background: 'Modern tech gradient with digital connection globe, video interface elements, streaming indicators',
      decorativeElements: [
        'laptop screen with presenter icon',
        'video call grid tiles',
        'digital globe with connections',
        'play button and streaming icon',
        'wifi/signal strength symbol',
      ],
      style: 'Digital, connected, accessible, modern tech',
      colors: 'Tech blue (#0066FF), digital purple (#7C3AED), white, accent cyan (#06B6D4)',
      mood: 'Accessible, modern, globally connected, tech-forward',
      printConsiderations: 'Include QR code space for registration link, digital aesthetic',
    },
    training: {
      background: 'Professional gradient with certification badge motifs, skill progression indicators, achievement symbols',
      decorativeElements: [
        'certification badge or seal',
        'skill progression bar/steps',
        'target/goal achievement icon',
        'growth chart or upward arrow',
        'learning pathway symbol',
      ],
      style: 'Professional development, achievement-focused, skill building',
      colors: 'Achievement gold (#F59E0B), professional blue (#2563EB), success green (#10B981), white',
      mood: 'Growth-oriented, professional development, achievement, certification pride',
      printConsiderations: 'Certification details prominent, professional credibility feel',
    },

    // ============================================================
    // COMPETITION EVENTS
    // ============================================================
    hackathon: {
      background: 'Tech-dark gradient with code brackets, binary patterns, glowing screen effects, circuit board elements',
      decorativeElements: [
        'code brackets { } icon',
        'laptop with code screen',
        'timer/countdown display',
        'lightbulb with circuit pattern',
        'team collaboration icon',
      ],
      style: 'Tech startup energy, intense coding, innovation-driven',
      colors: 'Electric blue (#00D4FF), neon green (#00FF88), deep tech purple (#7C3AED), dark background (#0F172A)',
      mood: 'Intense innovation, team spirit, coding energy, competitive creativity',
      printConsiderations: 'Challenge theme and prizes prominent, high-tech visual appeal',
    },
    competition: {
      background: 'Dynamic gradient with trophy silhouette, medal icons, victory elements, competitive energy patterns',
      decorativeElements: [
        'trophy cup gleaming icon',
        'medal with ribbon symbol',
        'winner podium (1st, 2nd, 3rd)',
        'victory star burst',
        'celebration confetti elements',
      ],
      style: 'Competitive, achievement-focused, victory energy',
      colors: 'Champion gold (#FFD700), competitive red (#DC3545), victory blue (#2563EB), white',
      mood: 'Competitive excitement, victory spirit, achievement drive',
      printConsiderations: 'Prize details and categories clearly visible, dynamic energy feel',
    },
    sports_event: {
      background: 'High-energy gradient with motion blur effects, sports equipment silhouettes, stadium lighting',
      decorativeElements: [
        'sports equipment icons (contextual)',
        'action athlete silhouette',
        'stadium lights and arena',
        'finish line or goal post',
        'energy burst/motion lines',
      ],
      style: 'Dynamic, athletic, high-energy, action-packed',
      colors: 'Bold red (#DC3545), energetic orange (#F97316), athletic blue (#3B82F6), white',
      mood: 'Pumped, competitive, athletic spirit, team energy',
      printConsiderations: 'Event schedule and venue map space, action-oriented design',
    },
    quiz: {
      background: 'Smart gradient with question mark motifs, lightbulb icons, buzzer elements, knowledge symbols',
      decorativeElements: [
        'question mark icons',
        'buzzer button symbol',
        'lightbulb knowledge icon',
        'brain/thinking symbol',
        'scoreboard display',
      ],
      style: 'Intellectual challenge, fun competition, knowledge battle',
      colors: 'Smart purple (#8B5CF6), knowledge blue (#3B82F6), gold (#F59E0B), white',
      mood: 'Intellectually exciting, competitive fun, knowledge pride',
      printConsiderations: 'Prize and participation info clear, engaging visual quiz feel',
    },

    // ============================================================
    // CELEBRATION EVENTS
    // ============================================================
    festival: {
      background: 'Vibrant multi-color gradient with fireworks, festive lights, celebration patterns, cultural decorative elements',
      decorativeElements: [
        'fireworks burst patterns',
        'festive string lights',
        'traditional decorations (diyas, lanterns)',
        'celebration confetti',
        'cultural motifs (rangoli, patterns)',
      ],
      style: 'Festive celebration, joyful, culturally rich',
      colors: 'Festive gold (#FFD700), celebration red (#EF4444), vibrant orange (#F97316), festive purple (#A855F7)',
      mood: 'Celebratory, joyous, community spirit, cultural pride',
      printConsiderations: 'Festival-specific symbols culturally accurate, vibrant print colors',
    },
    cultural_event: {
      background: 'Rich traditional gradient with cultural patterns, performance stage elements, artistic motifs',
      decorativeElements: [
        'traditional dance silhouette',
        'classical music instruments',
        'rangoli or mandala patterns',
        'cultural attire silhouettes',
        'artistic flourish elements',
      ],
      style: 'Traditional meets modern, heritage celebration, artistic',
      colors: 'Rich red (#DC2626), traditional gold (#D4AF37), heritage orange (#EA580C), deep purple (#7C2D12)',
      mood: 'Cultural pride, artistic celebration, heritage honor',
      printConsiderations: 'Cultural authenticity in visual elements, elegant typography',
    },
    celebration: {
      background: 'Joyful gradient with confetti patterns, balloon silhouettes, celebration burst elements',
      decorativeElements: [
        'confetti burst pattern',
        'celebration balloons',
        'party streamer accents',
        'gift box or celebration cake icon',
        'champagne/toast silhouette',
      ],
      style: 'Joyful celebration, party energy, milestone marking',
      colors: 'Party pink (#EC4899), celebration purple (#A855F7), joyful yellow (#FCD34D), white',
      mood: 'Joyful, celebratory, milestone achievement, party spirit',
      printConsiderations: 'Event details prominent, celebratory but readable',
    },

    // ============================================================
    // CORPORATE EVENTS
    // ============================================================
    inauguration: {
      background: 'Grand ceremonial gradient with ribbon cutting elements, lamp lighting motifs, foundation symbols',
      decorativeElements: [
        'ribbon cutting with scissors icon',
        'traditional lamp (diya) lighting',
        'foundation stone symbol',
        'ceremonial garland elements',
        'grand opening arch',
      ],
      style: 'Prestigious, ceremonial, official grand opening',
      colors: 'Prestigious gold (#D4AF37), ceremonial red (#DC2626), deep blue (#1E40AF), white',
      mood: 'Grand, auspicious, milestone celebration, official prestige',
      printConsiderations: 'Dignitary names prominently placed, ceremonial elegance',
    },
    product_launch: {
      background: 'Dynamic spotlight gradient with unveiling curtain effects, spotlight beams, reveal elements',
      decorativeElements: [
        'spotlight beam icon',
        'curtain reveal silhouette',
        'product silhouette placeholder',
        'camera flash effects',
        'launch countdown element',
      ],
      style: 'Launch excitement, premium reveal, innovation showcase',
      colors: 'Spotlight white (#FFFFFF), premium black (#0F172A), electric blue (#0EA5E9), accent gold (#F59E0B)',
      mood: 'Anticipation, innovation, excitement, premium reveal',
      printConsiderations: 'Product visual space prominent, launch date emphasized',
    },
    meetup: {
      background: 'Friendly gradient with networking silhouettes, coffee cup icons, connection elements',
      decorativeElements: [
        'people networking silhouette',
        'coffee cup icon',
        'conversation bubble',
        'handshake symbol',
        'community circle',
      ],
      style: 'Friendly professional, casual networking, community connection',
      colors: 'Friendly teal (#14B8A6), warm orange (#F97316), networking blue (#3B82F6), white',
      mood: 'Welcoming, professional yet relaxed, community building',
      printConsiderations: 'Venue and timing clear, approachable design feel',
    },

    // ============================================================
    // NATIONAL EVENTS
    // ============================================================
    independence_day: {
      background: 'Tricolor gradient (saffron-white-green) with patriotic elements, freedom symbols, flag motifs',
      decorativeElements: [
        'national flag silhouette',
        'tricolor balloon elements',
        'freedom fighter silhouette',
        'Ashoka Chakra symbol',
        'patriotic bird/dove',
      ],
      style: 'Patriotic celebration, respectful, national pride',
      colors: 'Saffron (#FF9933), white (#FFFFFF), green (#138808), navy blue (#000080)',
      mood: 'Patriotic pride, celebration of freedom, national unity',
      printConsiderations: 'Flag usage follows national guidelines, respectful design',
    },
    republic_day: {
      background: 'Ceremonial tricolor gradient with parade elements, constitution symbols, national emblem motifs',
      decorativeElements: [
        'parade float silhouette',
        'constitution book symbol',
        'national emblem lion',
        'military march silhouette',
        'tricolor ribbon',
      ],
      style: 'Ceremonial, constitutional pride, national celebration',
      colors: 'Saffron (#FF9933), white (#FFFFFF), green (#138808), gold accent (#D4AF37)',
      mood: 'Constitutional pride, unity, ceremonial celebration',
      printConsiderations: 'Official symbols used with respect, dignified design',
    },
    teachers_day: {
      background: 'Warm appreciation gradient with education symbols, apple icon, knowledge elements',
      decorativeElements: [
        'apple on books icon',
        'blackboard with thank you',
        'graduation cap symbol',
        'knowledge lamp/light',
        'bouquet or flower offering',
      ],
      style: 'Warm appreciation, educational respect, gratitude',
      colors: 'Appreciation red (#EF4444), education blue (#3B82F6), warm gold (#F59E0B), white',
      mood: 'Gratitude, respect for educators, warm appreciation',
      printConsiderations: 'Teacher appreciation message prominent, warm design feel',
    },
  }

  // Get base context or default
  let context = contexts[eventType] || getDefaultFlyerContext()

  // Enhance with secondary type if present (e.g., tech + workshop)
  if (secondaryType) {
    context = enhanceContextWithModifier(context, secondaryType)
  }

  return context
}

/**
 * Get default flyer context for unknown event types
 */
function getDefaultFlyerContext(): FlyerEventContext {
  return {
    background: 'Clean professional gradient with subtle geometric patterns, modern abstract accents in corners',
    decorativeElements: [
      'subtle geometric pattern elements',
      'professional abstract shapes',
      'modern line accents',
      'elegant corner flourishes',
      'brand-appropriate decorative dots',
    ],
    style: 'Professional marketing, versatile, modern clean',
    colors: 'Professional blue (#005B96), clean white, accent orange (#FF6B35), subtle gray (#6B7280)',
    mood: 'Professional, trustworthy, action-driving, versatile',
    printConsiderations: 'CMYK-safe colors, high contrast for readability, versatile appeal',
  }
}

/**
 * Enhance context with secondary modifier (tech, business, healthcare, etc.)
 */
function enhanceContextWithModifier(context: FlyerEventContext, modifier: string): FlyerEventContext {
  const modifierEnhancements: Record<string, Partial<FlyerEventContext>> = {
    tech: {
      decorativeElements: [
        ...context.decorativeElements.slice(0, 3),
        'subtle circuit pattern overlay',
        'digital node connections',
      ],
      colors: context.colors + ', tech accent (#00D4FF)',
      style: context.style + ', with modern tech sophistication',
    },
    business: {
      decorativeElements: [
        ...context.decorativeElements.slice(0, 3),
        'business growth chart silhouette',
        'professional briefcase icon',
      ],
      colors: context.colors + ', corporate navy (#1E3A5F)',
      style: context.style + ', with corporate professionalism',
    },
    healthcare: {
      decorativeElements: [
        ...context.decorativeElements.slice(0, 3),
        'health shield symbol',
        'medical cross accent',
      ],
      colors: context.colors + ', healthcare green (#28A745)',
      style: context.style + ', with healthcare trust',
    },
    creative: {
      decorativeElements: [
        ...context.decorativeElements.slice(0, 3),
        'artistic brush stroke accents',
        'creative palette elements',
      ],
      colors: context.colors + ', creative purple (#A855F7)',
      style: context.style + ', with creative artistic flair',
    },
  }

  const enhancement = modifierEnhancements[modifier]
  if (enhancement) {
    return { ...context, ...enhancement }
  }
  return context
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
      eventContext: getDefaultFlyerContext(),
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
  const eventContext = getFlyerEventContext(inferredType || 'general', inference.secondaryType)

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
- Logo overlay zones (header/footer if specified)
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
- Logo overlay zones (header/footer if specified)
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

  // NEW v3.5: Build forbidden zones for strict logo-text overlap prevention
  const forbiddenZonesContext = buildForbiddenZonesSection(options.logoAwareness)
  const zoneReminderContext = buildZoneReminderSection(options.logoAwareness)

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
    colorScheme = `Brand colors: ${options.brandContext.primaryColor}, ${options.brandContext.secondaryColor || 'white'}, accent ${options.brandContext.accentColor || 'complementary'}`
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
- HEADER (15%): Organization logo ${options.logoAwareness?.hasLogo ? `in ${options.logoAwareness.logoPosition} (kept clear for overlay)` : 'prominently at top'}
- HEADLINE (25%): "${data.flyerTitle}" - bold, attention-grabbing
- CONTENT (40%): Key information, benefits, details
- ACTION (20%): CTA, contact info, event details

Content Elements:
${data.flyerDescription ? `- Description: "${data.flyerDescription}"` : ''}
${data.eventDate ? `- Date: "${data.eventDate}" with calendar icon` : ''}
${data.eventTime ? `- Time: "${formatEventTime(data.eventTime)}" with clock icon` : ''}
${data.venue ? `- Venue: "${data.venue}" with location marker` : ''}
${data.price ? `- Price: "${data.price}" - highlighted/emphasized` : ''}
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
${data.eventTime ? `<text role="time" prominence="medium" style="bold with clock icon">${formatEventTime(data.eventTime)}</text>` : ''}
${data.venue ? `<text role="venue" prominence="medium" style="clear with location icon">${data.venue}</text>` : ''}
${data.price ? `<text role="price" prominence="prominent" style="highlighted, badge or tag format">${data.price}</text>` : ''}
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
${options.logoAwareness?.hasLogo ? '- Logo area clean for overlay' : ''}
${options.brandContext ? '- Brand colors properly applied' : ''}
</quality_markers>

<constraints>
Avoid: Low resolution (not print-ready), web-only RGB colors, cluttered layout, tiny unreadable text, poor hierarchy, too many competing fonts, missing contact info
${flyerSize === 'A5' ? 'For A5: Avoid too much text - focus on essentials only' : ''}
${options.logoAwareness?.hasLogo ? `Avoid: Complex elements in ${options.logoAwareness.logoPosition} (logo zone)` : ''}
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
- Organization logos (overlaid separately via Sharp)
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
    colorScheme = `Brand colors: ${options.brandContext.primaryColor}, ${options.brandContext.secondaryColor || 'white'}, accent ${options.brandContext.accentColor || 'complementary'}`
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
- HEADER (15%): Organization logo ${options.logoAwareness?.hasLogo ? `in ${options.logoAwareness.logoPosition} (kept clear for overlay)` : 'prominently at top'}
- HEADLINE (25%): "${data.flyerTitle}" - bold, attention-grabbing
- CONTENT (40%): Key information, benefits, details
- ACTION (20%): CTA, contact info, event details

Content Elements:
${data.flyerDescription ? `- Description: "${data.flyerDescription}"` : ''}
${data.eventDate ? `- Date: "${data.eventDate}" with calendar icon` : ''}
${data.eventTime ? `- Time: "${formatEventTime(data.eventTime)}" with clock icon` : ''}
${data.venue ? `- Venue: "${data.venue}" with location marker` : ''}
${data.price ? `- Price: "${data.price}" - highlighted/emphasized` : ''}
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
${data.eventTime ? `<text role="time" prominence="medium" style="bold with clock icon">${formatEventTime(data.eventTime)}</text>` : ''}
${data.venue ? `<text role="venue" prominence="medium" style="clear with location icon">${data.venue}</text>` : ''}
${data.price ? `<text role="price" prominence="prominent" style="highlighted, badge or tag format">${data.price}</text>` : ''}
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
${options.logoAwareness?.hasLogo ? '- Logo area clean for overlay' : ''}
${options.brandContext ? '- Brand colors properly applied' : ''}
</quality_markers>

<constraints>
Avoid: Low resolution (not print-ready), web-only RGB colors, cluttered layout, tiny unreadable text, poor hierarchy, too many competing fonts, missing contact info
${flyerSize === 'A5' ? 'For A5: Avoid too much text - focus on essentials only' : ''}
${options.logoAwareness?.hasLogo ? `Avoid: Complex elements in ${options.logoAwareness.logoPosition} (logo zone)` : ''}
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
</render_constraints>
`.trim()
}

// Export for use elsewhere
export { FLYER_EXAMPLES }

// Export types
export type { FlyerEventContext, AIBackgroundResult }
