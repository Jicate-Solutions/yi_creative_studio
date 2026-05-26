/**
 * Multi-Format Layout Agent
 * YiCreatives Studio
 *
 * AI-powered pre-generation layout analysis with Actor-Critic thinking.
 * Works across all 35 creative formats in the system.
 *
 * Architecture:
 * 1. Actor proposes creative layout decisions
 * 2. Critic validates against constraints
 * 3. Synthesis produces optimal result
 * 4. Fallback to rule-based logic if AI fails
 *
 * @module layout-agent
 */

import Anthropic from '@anthropic-ai/sdk'
import { trackApiUsage, type ApiUsageRecord } from '@/lib/services/api-usage'
import { calculateTokenCost } from '@/lib/config/ai-pricing'
import type {
  LayoutAgentInput,
  LayoutDecision,
  ActorLayoutProposal,
  CriticLayoutReview,
  FinalElementPlacement,
  TextZoneAdjustments,
  FormatLayoutConfig,
  LayoutElement,
  ElementPosition,
  PixelPosition,
} from '@/types/layout-agent.types'

// ============================================================================
// Constants
// ============================================================================

const CLAUDE_MODEL = 'claude-haiku-4-5'
const MAX_ACTOR_CRITIC_ROUNDS = 3

// ============================================================================
// Format Layout Configurations
// ============================================================================

/**
 * Format-specific layout configurations
 */
const FORMAT_LAYOUT_CONFIGS: Record<string, FormatLayoutConfig> = {
  event_poster: {
    formatId: 'event_poster',
    category: 'print',
    headerZone: { start: 0, end: 18 },
    footerZone: { start: 88, end: 100 },
    logoZone: { position: 'header-split', size: 'medium' },
    elementPriority: ['headline', 'date_time', 'venue', 'speaker_zone', 'cta_button', 'tagline'],
    defaultComposition: 'centered',
    defaultAlignment: 'center',
    supportsSpeakers: true,
    maxSpeakers: 4,
    specialConstraints: [
      'Yi logo MUST be top-left',
      'CII logo MUST be top-right',
      'Headline must be largest text element',
      'Date/venue must be clearly visible',
    ],
  },
  certificate: {
    formatId: 'certificate',
    category: 'print',
    headerZone: { start: 0, end: 12 },
    footerZone: { start: 85, end: 100 },
    logoZone: { position: 'top-center', size: 'medium' },
    elementPriority: ['headline', 'body_text', 'custom_field', 'footer_contact'],
    defaultComposition: 'centered',
    defaultAlignment: 'center',
    supportsSpeakers: false,
    maxSpeakers: 0,
    specialConstraints: [
      'Formal, symmetrical layout',
      'Decorative borders allowed',
      'Signature line at bottom',
      'Recipient name must be prominent',
    ],
  },
  instagram_post: {
    formatId: 'instagram_post',
    category: 'social_media',
    headerZone: { start: 0, end: 10 },
    footerZone: { start: 90, end: 100 },
    logoZone: { position: 'bottom-right', size: 'small' },
    elementPriority: ['headline', 'tagline', 'cta_button'],
    defaultComposition: 'centered',
    defaultAlignment: 'center',
    supportsSpeakers: false,
    maxSpeakers: 0,
    specialConstraints: ['Square constraint', 'Visual-first design', 'Mobile optimized'],
  },
  instagram_story: {
    formatId: 'instagram_story',
    category: 'social_media',
    headerZone: { start: 0, end: 15 },
    footerZone: { start: 80, end: 100 },
    logoZone: { position: 'top-left', size: 'small' },
    elementPriority: ['headline', 'cta_button', 'tagline', 'body_text'],
    defaultComposition: 'centered',
    defaultAlignment: 'center',
    supportsSpeakers: false,
    maxSpeakers: 0,
    specialConstraints: [
      'Keep key content in middle 60%',
      'CTA should be thumb-reachable',
      'Account for swipe-up area',
    ],
    safeZones: [
      { id: 'username', name: 'story_username', xStart: 0, xEnd: 30, yStart: 0, yEnd: 10, reason: 'Platform UI' },
      { id: 'swipe', name: 'swipe_up', xStart: 0, xEnd: 100, yStart: 85, yEnd: 100, reason: 'Swipe up zone' },
    ],
  },
  youtube_thumbnail: {
    formatId: 'youtube_thumbnail',
    category: 'video',
    headerZone: { start: 0, end: 8 },
    footerZone: { start: 92, end: 100 },
    logoZone: { position: 'none', size: 'none' },
    elementPriority: ['headline', 'speaker_zone', 'decorative_element'],
    defaultComposition: 'rule_of_thirds',
    defaultAlignment: 'left',
    supportsSpeakers: true,
    maxSpeakers: 1,
    specialConstraints: [
      'Face/speaker should be on right third',
      'Text should be on left two-thirds',
      'Avoid timestamp overlap zone (bottom-right)',
      'Large, bold text for mobile visibility',
    ],
    safeZones: [
      { id: 'timestamp', name: 'timestamp', xStart: 75, xEnd: 100, yStart: 85, yEnd: 100, reason: 'YouTube timestamp' },
    ],
  },
  linkedin_post: {
    formatId: 'linkedin_post',
    category: 'social_media',
    headerZone: { start: 0, end: 12 },
    footerZone: { start: 88, end: 100 },
    logoZone: { position: 'top-left', size: 'small' },
    elementPriority: ['headline', 'tagline', 'speaker_zone', 'body_text'],
    defaultComposition: 'centered',
    defaultAlignment: 'center',
    supportsSpeakers: true,
    maxSpeakers: 2,
    specialConstraints: ['Professional tone', 'Data-friendly layout', 'Clean design'],
  },
  flyer: {
    formatId: 'flyer',
    category: 'print',
    headerZone: { start: 0, end: 15 },
    footerZone: { start: 85, end: 100 },
    logoZone: { position: 'top-left', size: 'medium' },
    elementPriority: ['headline', 'date_time', 'venue', 'body_text', 'cta_button'],
    defaultComposition: 'centered',
    defaultAlignment: 'center',
    supportsSpeakers: true,
    maxSpeakers: 2,
    specialConstraints: ['Dense info layout', 'CTA prominent', 'Clear hierarchy'],
  },
}

// Default config for unknown formats
const DEFAULT_FORMAT_CONFIG: FormatLayoutConfig = {
  formatId: 'default',
  category: 'general',
  headerZone: { start: 0, end: 15 },
  footerZone: { start: 85, end: 100 },
  logoZone: { position: 'top-left', size: 'medium' },
  elementPriority: ['headline', 'tagline', 'body_text', 'cta_button'],
  defaultComposition: 'centered',
  defaultAlignment: 'center',
  supportsSpeakers: false,
  maxSpeakers: 0,
  specialConstraints: [],
}

// ============================================================================
// System Prompts
// ============================================================================

const ACTOR_SYSTEM_PROMPT = `You are the ACTOR in an Actor-Critic layout analysis system.
Your role is to propose CREATIVE layout decisions for design elements.

Focus on:
1. Visual hierarchy - what should catch attention first?
2. Composition style - centered, asymmetric, rule of thirds, golden ratio?
3. Visual flow - how does the eye move through the design?
4. Emotional impact - what feeling should this layout evoke?
5. Element placement - where should each element go (percentages 0-100)?

Return your proposal as valid JSON with this schema:
{
  "designPhilosophy": "Brief description of your creative vision",
  "visualFlow": "How the eye moves through the design",
  "emotionalImpact": "Intended emotional response",
  "uniqueApproach": "What makes this layout stand out",
  "elementPlacements": [
    {
      "elementId": "string",
      "position": {
        "xPercent": number,
        "yPercent": number,
        "widthPercent": number,
        "heightPercent": number,
        "anchorX": "left" | "center" | "right",
        "anchorY": "top" | "center" | "bottom"
      },
      "reasoning": "Why this position",
      "visualRelationships": ["List of relationships to other elements"]
    }
  ],
  "compositionStyle": "centered" | "asymmetric" | "rule_of_thirds" | "golden_ratio" | "grid",
  "negativeSpaceUsage": "minimal" | "balanced" | "generous",
  "visualWeight": "top_heavy" | "bottom_heavy" | "balanced" | "dynamic",
  "innovativeElements": ["Creative suggestions"],
  "formatSpecificEnhancements": ["Format-aware improvements"]
}`

const CRITIC_SYSTEM_PROMPT = `You are the CRITIC in an Actor-Critic layout analysis system.
Your role is to VALIDATE layout proposals against constraints and best practices.

Evaluate:
1. Zone compliance - do elements respect reserved zones (header, footer)?
2. Brand compliance - are brand guidelines followed?
3. Visual hierarchy - is the hierarchy effective?
4. Accessibility - is text readable? Are contrasts sufficient?
5. Balance - is the composition visually balanced?
6. Format optimization - are format-specific best practices followed?

Score each category 0-100. Identify violations (critical, major) and warnings (minor, info).

Return your review as valid JSON with this schema:
{
  "overallScore": number,
  "brandComplianceScore": number,
  "zoneComplianceScore": number,
  "hierarchyScore": number,
  "accessibilityScore": number,
  "balanceScore": number,
  "formatOptimizationScore": number,
  "violations": [
    {
      "severity": "critical" | "major",
      "elementId": "string",
      "constraint": "What was violated",
      "message": "Description",
      "suggestedFix": { position object if applicable }
    }
  ],
  "warnings": [
    {
      "severity": "minor" | "info",
      "elementId": "string",
      "issue": "What could be improved",
      "recommendation": "Suggestion"
    }
  ],
  "improvements": [
    {
      "elementId": "string",
      "currentScore": number,
      "potentialScore": number,
      "suggestion": "How to improve",
      "suggestedPosition": { position object if applicable }
    }
  ],
  "formatChecks": [
    {
      "checkName": "string",
      "passed": boolean,
      "details": "string",
      "formatId": "string"
    }
  ]
}`

// ============================================================================
// Main Analysis Function
// ============================================================================

/**
 * Analyzes layout for any creative format using Actor-Critic thinking.
 *
 * @param input - Layout agent input with format, elements, and constraints
 * @returns Layout decision with final placements and guidance
 */
export async function analyzeLayout(input: LayoutAgentInput): Promise<LayoutDecision> {
  const startTime = Date.now()

  // Get format configuration
  const formatConfig = FORMAT_LAYOUT_CONFIGS[input.formatId] || DEFAULT_FORMAT_CONFIG

  // If no elements to layout, return early
  if (!input.elements || input.elements.length === 0) {
    return createEmptyDecision(formatConfig)
  }

  try {
    // Run Actor-Critic analysis
    const result = await runActorCriticAnalysis(input, formatConfig)
    const durationMs = Date.now() - startTime

    // Track usage
    await trackLayoutAgentUsage({
      organizationId: input.organizationId,
      userId: input.userId,
      creativeId: input.creativeId,
      inputTokens: result.totalInputTokens,
      outputTokens: result.totalOutputTokens,
      durationMs,
      formatId: input.formatId,
      elementCount: input.elements.length,
      rounds: result.rounds,
      confidenceScore: result.decision.confidenceScore,
    })

    console.log(
      `[Layout Agent] Actor-Critic analysis complete: ${result.rounds} rounds | ` +
        `Confidence: ${result.decision.confidenceScore}% | ${durationMs}ms`
    )

    return result.decision
  } catch (error) {
    console.warn('[Layout Agent] AI analysis failed, using fallback:', error)

    // Fallback to rule-based logic
    return calculateFallbackLayout(input, formatConfig)
  }
}

// ============================================================================
// Actor-Critic Analysis
// ============================================================================

interface ActorCriticResult {
  decision: LayoutDecision
  rounds: number
  totalInputTokens: number
  totalOutputTokens: number
}

async function runActorCriticAnalysis(
  input: LayoutAgentInput,
  formatConfig: FormatLayoutConfig
): Promise<ActorCriticResult> {
  const anthropic = new Anthropic()

  let totalInputTokens = 0
  let totalOutputTokens = 0
  let currentProposal: ActorLayoutProposal | null = null
  let currentReview: CriticLayoutReview | null = null
  let roundCount = 0

  // Build context for the AI
  const layoutContext = buildLayoutContext(input, formatConfig)

  // Actor-Critic loop
  for (let round = 1; round <= MAX_ACTOR_CRITIC_ROUNDS; round++) {
    roundCount = round

    // ===== ACTOR ROUND =====
    const actorPrompt = buildActorPrompt(layoutContext, currentReview)

    const actorResponse = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1000,
      system: ACTOR_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: actorPrompt }],
    })

    totalInputTokens += actorResponse.usage.input_tokens
    totalOutputTokens += actorResponse.usage.output_tokens

    currentProposal = parseActorResponse(actorResponse)

    // ===== CRITIC ROUND =====
    const criticPrompt = buildCriticPrompt(layoutContext, currentProposal)

    const criticResponse = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 800,
      system: CRITIC_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: criticPrompt }],
    })

    totalInputTokens += criticResponse.usage.input_tokens
    totalOutputTokens += criticResponse.usage.output_tokens

    currentReview = parseCriticResponse(criticResponse)

    // Check if we can exit early (no critical violations)
    const hasCriticalViolations = currentReview.violations.some((v) => v.severity === 'critical')

    if (!hasCriticalViolations) {
      console.log(`[Layout Agent] Converged after ${round} round(s)`)
      break
    }
  }

  // Synthesize final decision
  const decision = synthesizeDecision(input, formatConfig, currentProposal!, currentReview!, roundCount)

  return {
    decision,
    rounds: roundCount,
    totalInputTokens,
    totalOutputTokens,
  }
}

// ============================================================================
// Prompt Builders
// ============================================================================

function buildLayoutContext(input: LayoutAgentInput, config: FormatLayoutConfig): string {
  return `FORMAT: ${input.formatId}
CATEGORY: ${input.formatCategory || config.category}
ASPECT RATIO: ${input.aspectRatio}
CANVAS: ${input.canvasWidth}x${input.canvasHeight}px
SOPHISTICATION: ${input.sophistication}

RESERVED ZONES:
- Header: ${config.headerZone.start}% - ${config.headerZone.end}%
- Footer: ${config.footerZone.start}% - ${config.footerZone.end}%

ELEMENTS TO POSITION (${input.elements.length}):
${input.elements
  .map(
    (e, i) =>
      `${i + 1}. [${e.type}] "${e.content}" (hierarchy: ${e.hierarchy}, required: ${e.required})`
  )
  .join('\n')}

FORMAT CONSTRAINTS:
${config.specialConstraints.map((c) => `- ${c}`).join('\n')}

ELEMENT PRIORITY ORDER:
${config.elementPriority.map((e, i) => `${i + 1}. ${e}`).join(', ')}`
}

function buildActorPrompt(context: string, previousReview: CriticLayoutReview | null): string {
  let prompt = `Analyze this layout context and propose creative element placements:

${context}
`

  if (previousReview) {
    prompt += `

PREVIOUS CRITIC FEEDBACK (address these issues):
Violations to fix:
${previousReview.violations.map((v) => `- [${v.severity}] ${v.elementId}: ${v.message}`).join('\n') || 'None'}

Improvements suggested:
${previousReview.improvements.map((i) => `- ${i.elementId}: ${i.suggestion}`).join('\n') || 'None'}

Please revise your proposal to address these issues.`
  }

  prompt += `

Return your creative layout proposal as JSON.`

  return prompt
}

function buildCriticPrompt(context: string, proposal: ActorLayoutProposal): string {
  return `Review this layout proposal against constraints and best practices:

LAYOUT CONTEXT:
${context}

ACTOR'S PROPOSAL:
Design Philosophy: ${proposal.designPhilosophy}
Visual Flow: ${proposal.visualFlow}
Composition: ${proposal.compositionStyle}

Element Placements:
${proposal.elementPlacements
  .map(
    (p) =>
      `- ${p.elementId}: x=${p.position.xPercent}%, y=${p.position.yPercent}% (${p.reasoning})`
  )
  .join('\n')}

Validate this proposal and return your review as JSON. Check:
1. Do elements stay within allowed zones?
2. Is the visual hierarchy effective?
3. Are format-specific constraints respected?
4. Is there sufficient spacing between elements?`
}

// ============================================================================
// Response Parsers
// ============================================================================

function parseActorResponse(response: Anthropic.Message): ActorLayoutProposal {
  const textContent = response.content.find((c) => c.type === 'text')
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No text response from Actor')
  }

  let jsonStr = textContent.text
  const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (jsonMatch) {
    jsonStr = jsonMatch[1]
  }

  const parsed = JSON.parse(jsonStr.trim())

  return {
    designPhilosophy: parsed.designPhilosophy || 'Balanced composition',
    visualFlow: parsed.visualFlow || 'Top to bottom',
    emotionalImpact: parsed.emotionalImpact || 'Professional',
    uniqueApproach: parsed.uniqueApproach || '',
    elementPlacements: parsed.elementPlacements || [],
    compositionStyle: parsed.compositionStyle || 'centered',
    negativeSpaceUsage: parsed.negativeSpaceUsage || 'balanced',
    visualWeight: parsed.visualWeight || 'balanced',
    innovativeElements: parsed.innovativeElements || [],
    formatSpecificEnhancements: parsed.formatSpecificEnhancements || [],
  }
}

function parseCriticResponse(response: Anthropic.Message): CriticLayoutReview {
  const textContent = response.content.find((c) => c.type === 'text')
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No text response from Critic')
  }

  let jsonStr = textContent.text
  const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (jsonMatch) {
    jsonStr = jsonMatch[1]
  }

  const parsed = JSON.parse(jsonStr.trim())

  return {
    overallScore: parsed.overallScore || 70,
    brandComplianceScore: parsed.brandComplianceScore || 80,
    zoneComplianceScore: parsed.zoneComplianceScore || 80,
    hierarchyScore: parsed.hierarchyScore || 75,
    accessibilityScore: parsed.accessibilityScore || 80,
    balanceScore: parsed.balanceScore || 75,
    formatOptimizationScore: parsed.formatOptimizationScore || 75,
    violations: parsed.violations || [],
    warnings: parsed.warnings || [],
    improvements: parsed.improvements || [],
    formatChecks: parsed.formatChecks || [],
  }
}

// ============================================================================
// Synthesis
// ============================================================================

function synthesizeDecision(
  input: LayoutAgentInput,
  config: FormatLayoutConfig,
  proposal: ActorLayoutProposal,
  review: CriticLayoutReview,
  rounds: number
): LayoutDecision {
  // Build final placements from Actor's proposal
  const finalPlacements: FinalElementPlacement[] = proposal.elementPlacements.map((placement) => {
    // Check if this placement was modified from violations
    const violation = review.violations.find((v) => v.elementId === placement.elementId)
    const wasModified = !!violation && !!violation.suggestedFix

    const position = wasModified && violation?.suggestedFix ? violation.suggestedFix : placement.position

    return {
      elementId: placement.elementId,
      elementType: input.elements.find((e) => e.id === placement.elementId)?.type || 'custom_field',
      position,
      pixelPosition: percentToPixels(position, input.canvasWidth, input.canvasHeight),
      confidence: wasModified ? 0.85 : 0.95,
      wasModified,
      modificationReason: wasModified ? violation?.message : undefined,
    }
  })

  // Calculate text zone adjustments
  const textZoneAdjustments = calculateTextZoneAdjustments(finalPlacements, config)

  // Generate composition guidance for Gemini
  const compositionGuidance = generateCompositionGuidance(proposal, review)

  // Generate zone reminder context
  const zoneReminderContext = generateZoneReminderContext(config, input.reservedZones)

  // Collect layout notes
  const layoutNotes: string[] = []
  if (review.violations.length > 0) {
    layoutNotes.push(`${review.violations.length} constraint violation(s) addressed`)
  }
  if (review.warnings.length > 0) {
    layoutNotes.push(`${review.warnings.length} optimization warning(s)`)
  }

  return {
    success: true,
    confidenceScore: review.overallScore,
    finalPlacements,
    textZoneAdjustments,
    compositionGuidance,
    zoneReminderContext,
    meta: {
      actorRounds: rounds,
      criticRounds: rounds,
      totalDurationMs: 0, // Will be set by caller
      model: CLAUDE_MODEL,
      source: 'ai',
    },
    layoutNotes,
  }
}

// ============================================================================
// Fallback Logic
// ============================================================================

/**
 * Rule-based fallback when AI is unavailable
 */
export function calculateFallbackLayout(
  input: LayoutAgentInput,
  config?: FormatLayoutConfig
): LayoutDecision {
  const formatConfig = config || FORMAT_LAYOUT_CONFIGS[input.formatId] || DEFAULT_FORMAT_CONFIG

  // Calculate element positions using rules
  const finalPlacements: FinalElementPlacement[] = input.elements.map((element, index) => {
    const position = calculateRuleBasedPosition(
      element,
      formatConfig,
      index,
      input.elements.length
    )

    return {
      elementId: element.id,
      elementType: element.type,
      position,
      pixelPosition: percentToPixels(position, input.canvasWidth, input.canvasHeight),
      confidence: 0.7,
      wasModified: false,
    }
  })

  return {
    success: true,
    confidenceScore: 70,
    finalPlacements,
    textZoneAdjustments: calculateDefaultTextZones(formatConfig),
    compositionGuidance: formatConfig.specialConstraints.join('\n'),
    zoneReminderContext: generateZoneReminderContext(formatConfig, input.reservedZones),
    meta: {
      actorRounds: 0,
      criticRounds: 0,
      totalDurationMs: 0,
      model: 'rule-based',
      source: 'fallback',
    },
    layoutNotes: ['Layout calculated using rule-based fallback'],
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

function percentToPixels(
  position: ElementPosition,
  canvasWidth: number,
  canvasHeight: number
): PixelPosition {
  let x = (position.xPercent / 100) * canvasWidth
  let y = (position.yPercent / 100) * canvasHeight
  const width = (position.widthPercent / 100) * canvasWidth
  const height = (position.heightPercent / 100) * canvasHeight

  // Apply anchor offset
  if (position.anchorX === 'center') x -= width / 2
  else if (position.anchorX === 'right') x -= width

  if (position.anchorY === 'center') y -= height / 2
  else if (position.anchorY === 'bottom') y -= height

  return { x: Math.round(x), y: Math.round(y), width: Math.round(width), height: Math.round(height) }
}

function calculateRuleBasedPosition(
  element: LayoutElement,
  config: FormatLayoutConfig,
  index: number,
  totalElements: number
): ElementPosition {
  const priorityIndex = config.elementPriority.indexOf(element.type)
  const effectiveIndex = priorityIndex >= 0 ? priorityIndex : index

  // Default positions by element type
  const defaultPositions: Record<string, ElementPosition> = {
    headline: {
      xPercent: 50,
      yPercent: config.headerZone.end + 5,
      widthPercent: 80,
      heightPercent: 10,
      anchorX: 'center',
      anchorY: 'top',
    },
    tagline: {
      xPercent: 50,
      yPercent: config.headerZone.end + 18,
      widthPercent: 70,
      heightPercent: 6,
      anchorX: 'center',
      anchorY: 'top',
    },
    date_time: {
      xPercent: 50,
      yPercent: config.headerZone.end + 28,
      widthPercent: 60,
      heightPercent: 8,
      anchorX: 'center',
      anchorY: 'top',
    },
    venue: {
      xPercent: 50,
      yPercent: config.headerZone.end + 38,
      widthPercent: 60,
      heightPercent: 6,
      anchorX: 'center',
      anchorY: 'top',
    },
    speaker_zone: {
      xPercent: 50,
      yPercent: 65,
      widthPercent: 80,
      heightPercent: 15,
      anchorX: 'center',
      anchorY: 'center',
    },
    cta_button: {
      xPercent: 50,
      yPercent: config.footerZone.start - 8,
      widthPercent: 40,
      heightPercent: 6,
      anchorX: 'center',
      anchorY: 'bottom',
    },
    body_text: {
      xPercent: 50,
      yPercent: 50,
      widthPercent: 70,
      heightPercent: 15,
      anchorX: 'center',
      anchorY: 'center',
    },
    footer_contact: {
      xPercent: 50,
      yPercent: config.footerZone.start + 5,
      widthPercent: 80,
      heightPercent: 8,
      anchorX: 'center',
      anchorY: 'top',
    },
  }

  return (
    defaultPositions[element.type] || {
      xPercent: 50,
      yPercent: 30 + effectiveIndex * 10,
      widthPercent: 70,
      heightPercent: 8,
      anchorX: 'center',
      anchorY: 'top',
    }
  )
}

function calculateTextZoneAdjustments(
  placements: FinalElementPlacement[],
  config: FormatLayoutConfig
): TextZoneAdjustments {
  // Find placements for each zone
  const headline = placements.find((p) => p.elementType === 'headline')
  const tagline = placements.find((p) => p.elementType === 'tagline')
  const dateVenue = placements.find((p) => p.elementType === 'date_time' || p.elementType === 'venue')
  const speakers = placements.find((p) => p.elementType === 'speaker_zone')

  return {
    headline: headline
      ? { start: headline.position.yPercent, end: headline.position.yPercent + headline.position.heightPercent }
      : { start: config.headerZone.end + 5, end: config.headerZone.end + 15 },
    tagline: tagline
      ? { start: tagline.position.yPercent, end: tagline.position.yPercent + tagline.position.heightPercent }
      : { start: config.headerZone.end + 18, end: config.headerZone.end + 24 },
    dateVenue: dateVenue
      ? { start: dateVenue.position.yPercent, end: dateVenue.position.yPercent + 15 }
      : { start: config.headerZone.end + 28, end: config.headerZone.end + 43 },
    speakers: speakers
      ? { start: speakers.position.yPercent - 7, end: speakers.position.yPercent + 8 }
      : { start: 55, end: 70 },
    additionalDetails: { start: config.footerZone.start - 15, end: config.footerZone.start - 5 },
  }
}

function calculateDefaultTextZones(config: FormatLayoutConfig): TextZoneAdjustments {
  return {
    headline: { start: config.headerZone.end + 5, end: config.headerZone.end + 15 },
    tagline: { start: config.headerZone.end + 18, end: config.headerZone.end + 24 },
    dateVenue: { start: config.headerZone.end + 28, end: config.headerZone.end + 43 },
    speakers: { start: 55, end: 70 },
    additionalDetails: { start: config.footerZone.start - 15, end: config.footerZone.start - 5 },
  }
}

function generateCompositionGuidance(proposal: ActorLayoutProposal, review: CriticLayoutReview): string {
  const lines: string[] = [
    'LAYOUT COMPOSITION (AI-ANALYZED):',
    `Design Philosophy: ${proposal.designPhilosophy}`,
    `Visual Flow: ${proposal.visualFlow}`,
    `Composition Style: ${proposal.compositionStyle}`,
    `Negative Space: ${proposal.negativeSpaceUsage}`,
    '',
  ]

  if (proposal.formatSpecificEnhancements.length > 0) {
    lines.push('Format-Specific Enhancements:')
    proposal.formatSpecificEnhancements.forEach((e) => lines.push(`- ${e}`))
    lines.push('')
  }

  if (review.warnings.length > 0 && review.warnings.length <= 3) {
    lines.push('Design Notes:')
    review.warnings.forEach((w) => lines.push(`- ${w.recommendation}`))
  }

  return lines.join('\n')
}

function generateZoneReminderContext(
  config: FormatLayoutConfig,
  additionalZones: { id: string; name: string; xStart: number; xEnd: number; yStart: number; yEnd: number; reason: string }[]
): string {
  const lines: string[] = [
    'ZONE RESTRICTIONS:',
    `- HEADER ZONE (0-${config.headerZone.end}%): Reserved for logos. DO NOT place text here.`,
    `- FOOTER ZONE (${config.footerZone.start}-100%): Reserved for footer content.`,
  ]

  if (config.safeZones && config.safeZones.length > 0) {
    config.safeZones.forEach((zone) => {
      lines.push(`- ${zone.name.toUpperCase()} (${zone.yStart}-${zone.yEnd}%): ${zone.reason}`)
    })
  }

  additionalZones.forEach((zone) => {
    lines.push(`- ${zone.name.toUpperCase()} (${zone.yStart}-${zone.yEnd}%): ${zone.reason}`)
  })

  return lines.join('\n')
}

function createEmptyDecision(config: FormatLayoutConfig): LayoutDecision {
  return {
    success: true,
    confidenceScore: 100,
    finalPlacements: [],
    textZoneAdjustments: calculateDefaultTextZones(config),
    compositionGuidance: '',
    zoneReminderContext: '',
    meta: {
      actorRounds: 0,
      criticRounds: 0,
      totalDurationMs: 0,
      model: 'none',
      source: 'fallback',
    },
    layoutNotes: ['No elements to layout'],
  }
}

// ============================================================================
// Usage Tracking
// ============================================================================

async function trackLayoutAgentUsage(params: {
  organizationId: string
  userId?: string
  creativeId?: string
  inputTokens: number
  outputTokens: number
  durationMs: number
  formatId: string
  elementCount: number
  rounds: number
  confidenceScore: number
}): Promise<void> {
  try {
    const costUsd = calculateTokenCost('claude', CLAUDE_MODEL, params.inputTokens, params.outputTokens, 0)

    const record: ApiUsageRecord = {
      organizationId: params.organizationId,
      userId: params.userId || 'system',
      creativeId: params.creativeId,
      requestType: 'multi_format_layout_analysis',
      provider: 'claude',
      model: CLAUDE_MODEL,
      inputTokens: params.inputTokens,
      outputTokens: params.outputTokens,
      estimatedCostUsd: costUsd,
      durationMs: params.durationMs,
      success: true,
      metadata: {
        formatId: params.formatId,
        elementCount: params.elementCount,
        actorCriticRounds: params.rounds,
        confidenceScore: params.confidenceScore,
      },
    }

    await trackApiUsage(record)
  } catch (error) {
    console.warn('[Layout Agent] Failed to track usage:', error)
  }
}

// ============================================================================
// Exports
// ============================================================================

export { FORMAT_LAYOUT_CONFIGS, DEFAULT_FORMAT_CONFIG }
export type { ActorCriticResult }
