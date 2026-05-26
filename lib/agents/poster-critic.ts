/**
 * Poster Critic Agent — SPIKE (v53.0 pre-wiring)
 *
 * Takes a freshly generated poster image (base64) + the original brief and
 * scores it across five dimensions using Gemini 2.5 Flash (vision-capable,
 * fast, cheap). Returns a CriticVerdict the pipeline can use to decide
 * whether to ship the image or regenerate with targeted feedback.
 *
 * This file is PURE SPIKE — never modify route.ts, design-intelligence.ts,
 * or any existing pipeline file from here. Integration is the team-lead's
 * follow-up (see route.ts integration paragraph in the team-lead handoff).
 *
 * Why Gemini 2.5 Flash (not Claude Haiku):
 *   - Vision-native via @google/generative-ai inlineData (the existing
 *     lib/ai/vision/text-detector.ts uses the same pattern). Claude's
 *     image support is not wired in this repo's setup.
 *   - Cheap: ~$0.0002 per critique call (see pricing context in task).
 *   - Fast: ~1-2s typical roundtrip for a 1080×1440 poster.
 */

import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai'
import { safeJsonParse } from '@/lib/utils/json-repair'
import { trackApiUsage } from '@/lib/services/api-usage'

// ============================================================
// TYPES — downstream callers (route.ts integration) will key off
// these names; do not rename without coordinating with team-lead.
// ============================================================

export type CriticDimension =
  | 'composition'
  | 'brand_fidelity'
  | 'subject_treatment'
  | 'text_legibility'
  | 'visual_quality'

export interface DimensionScore {
  dimension: CriticDimension
  score: number
  reasoning: string
  issues: string[]
  fixSuggestion?: string
}

export interface CriticVerdict {
  overallScore: number
  passesThreshold: boolean
  dimensions: DimensionScore[]
  topIssues: string[]
  regenerationHint?: string
  confidence: number
}

export interface CriticInput {
  imageBase64: string
  imageMimeType?: string
  brief: {
    eventName: string
    description?: string
    tagline?: string
    formatId: string
    brandColors?: { primary?: string; secondary?: string; accent?: string }
    backgroundStyle?: string
    compositionStrategy?: string
    hasSpeakerPhoto?: boolean
  }
}

export interface CriticUsage {
  model: string
  inputTokens: number
  outputTokens: number
  totalTokens: number
  estimatedCostUsd: number
  durationMs: number
  source: 'ai' | 'fallback'
}

export interface CriticResult {
  verdict: CriticVerdict
  usage: CriticUsage
}

// ============================================================
// CONSTANTS
// ============================================================

const GEMINI_MODEL = 'gemini-2.5-flash'
const MAX_OUTPUT_TOKENS = 2048
const PASS_THRESHOLD = 7

/**
 * Weights per dimension. Must sum to 1.0.
 * Keep in lock-step with the task spec — downstream regression tests
 * key off the exact arithmetic.
 */
const DIMENSION_WEIGHTS: Record<CriticDimension, number> = {
  composition: 0.25,
  brand_fidelity: 0.20,
  subject_treatment: 0.25,
  text_legibility: 0.15,
  visual_quality: 0.15,
}

const DIMENSION_ORDER: CriticDimension[] = [
  'composition',
  'brand_fidelity',
  'subject_treatment',
  'text_legibility',
  'visual_quality',
]

// ============================================================
// SYSTEM PROMPT — kept here as a top-level const so the same
// string is reused on every call (lets us reason about token
// stability and, later, prompt caching once Gemini exposes it).
// ============================================================

const SYSTEM_PROMPT = `You are the POSTER CRITIC — a senior design critic with 15+ years reviewing brand creative work for Indian institutional clients (Young Indians chapters, JKKN, CII, education and corporate brands).

You receive ONE generated poster image and the original brief. Your single job: score the poster on five dimensions, identify concrete issues, and tell the generation pipeline what to fix on the next attempt.

You return STRICT JSON. No markdown fences. No commentary outside JSON.

═══════════════════════════════════════════════════════════════
THE FIVE DIMENSIONS (score each 0-10 independently)
═══════════════════════════════════════════════════════════════

1. composition (weight 0.25)
   Does the eye flow naturally to ONE clear focal point, or compete between several?
   Is the layout balanced — purposeful asymmetry or chaotic clutter?
   Is whitespace used deliberately, or accidental?
   • 10 = TIME magazine cover quality — single hero, masterful negative space
   •  7 = strong layout with minor competing elements
   •  5 = templated event poster — readable but generic
   •  3 = visible competing focal points / split scenes / unfocused
   •  0 = amateur clipart, chaotic, no hierarchy

2. brand_fidelity (weight 0.20)
   The brief lists brandColors. Are those colors actually visible AND dominant?
   Did the AI drift to defaults (generic blue, beige, navy)?
   Are the brand hues anchoring the design, or relegated to a corner accent?
   • 10 = brand colors are the visual anchor — composition reads as on-brand
   •  7 = brand colors clearly present and used in major elements
   •  5 = brand colors used but de-emphasised by competing palette
   •  3 = brand colors barely visible; AI defaulted to its own palette
   •  0 = brand colors absent or replaced with conflicting hues

3. subject_treatment (weight 0.25)
   The brief specifies compositionStrategy. Did the image execute it?
   • portrait-hero → ONE clear subject area with dignified empty backdrop, NOT drawn crowds, NOT split scenes, NOT competing photo elements.
   • concept-iconic → ONE clear symbolic element dominating, NOT generic icon clutter.
   • activity-collage → multi-zone is OK and expected; check zones are distinct, not muddled.
   • object-hero → the object dominates centre stage; people are absent or secondary.
   • environment-scene → the place is the subject; characters are scale, not focus.
   If hasSpeakerPhoto is true AND compositionStrategy is NOT portrait-hero: the layout MUST leave a clean, dignified subject zone for an overlaid photo — drawn faces, crowd-scenes, or busy textures in that zone are major failures. If hasSpeakerPhoto is true AND compositionStrategy IS portrait-hero: the speaker's portrait is rendered DIRECTLY into the scene (no separate overlay) — do NOT require a separate empty overlay zone; instead judge whether the rendered portrait is single, dignified, and undistorted.
   • 10 = perfectly executed for the brief
   •  7 = strategy honoured with a small wobble
   •  5 = partially aligned; some conflicting elements
   •  3 = strategy ignored; the layout fights the brief
   •  0 = completely off-brief

4. text_legibility (weight 0.15)
   Headline readable at thumbnail size (1cm tall on a phone)?
   Sufficient contrast between text and what sits behind it?
   Any letters cut off, distorted, garbled, or fused with the background?
   Any text overlapping a face, focal object, or another text block?
   • 10 = every word crisp and readable; clean separation
   •  7 = readable with minor contrast or kerning issues
   •  5 = main headline readable; secondary text struggles
   •  3 = headline partially obscured or low-contrast
   •  0 = illegible / garbled / overlapping

5. visual_quality (weight 0.15)
   Lighting realism, shadow consistency, edge cleanness.
   Obvious AI artifacts: extra fingers, distorted faces, melted objects, broken hands, fused limbs, warped logos, gibberish text-like marks?
   • 10 = magazine print quality — no detectable AI artifacts
   •  7 = clean overall with one or two minor artifacts
   •  5 = noticeable artifacts but does not break the poster
   •  3 = multiple obvious artifacts (deformed faces / hands / objects)
   •  0 = unusable; pervasive AI artifacting

═══════════════════════════════════════════════════════════════
OUTPUT JSON SHAPE (exact keys, no extras)
═══════════════════════════════════════════════════════════════
{
  "dimensions": [
    {
      "dimension": "composition" | "brand_fidelity" | "subject_treatment" | "text_legibility" | "visual_quality",
      "score": 0-10,
      "reasoning": "1-2 sentences explaining the score, citing what you see",
      "issues": ["specific problem 1", "specific problem 2", "..."],   // up to 3, empty array if none
      "fixSuggestion": "ONE actionable instruction the next generation can use, e.g. 'regenerate with explicit no humans drawn in scene'"
    }
  ],
  "topIssues": ["worst issue across all dimensions", "second worst", "third worst"],   // 3 items, picked by severity
  "regenerationHint": "ONE actionable sentence describing what to change next attempt, only if overall < 7. Begin with 'PREVIOUS ATTEMPT had ...'. Omit if not regenerating.",
  "confidence": 0.0-1.0
}

Rules:
- Output ONE dimension entry per dimension, in the order shown above.
- "issues" must be SPECIFIC — name what you actually see ("the chairperson's drawn portrait competes with the empty photo-overlay zone on the bottom-left") not generic ("composition issues").
- "fixSuggestion" must be a directive the prompt-builder can prepend, not a critique.
- "topIssues" picks the THREE WORST issues, sorted by severity. May draw from any dimension.
- "regenerationHint" should be present IFF the weighted average is below 7. If above 7, omit the key.
- "confidence" reflects YOUR certainty in this critique (image clarity, brief coverage). 0.9+ when the image and brief are crystal clear; 0.6-0.8 when interpretation is needed.
- NEVER pad scores up to avoid hurt feelings. A 4/10 poster gets a 4. The pipeline depends on honesty.
- NEVER drop the 'dimensions' array. NEVER add keys.

═══════════════════════════════════════════════════════════════
COMMON FAILURE PATTERNS (calibrate your eye to these)
═══════════════════════════════════════════════════════════════
• Split-scene posters: top half one scene, bottom half another. Almost always composition <5 AND subject_treatment <4 when the brief asks for portrait-hero or concept-iconic.
• Drawn crowds in a portrait-hero brief: subject_treatment <=4, regeneration hint MUST forbid drawn humans in scene.
• Speaker photo collision (non-portrait-hero only): when compositionStrategy is concept-iconic / activity-collage / object-hero / environment-scene and a speaker photo will be overlaid, the layout reserves no clean zone for the photo overlay, so the overlaid photo sits ON TOP of a drawn face or busy texture. Subject_treatment <=3, regeneration hint MUST request a clean dignified zone (e.g. "leave clean blurred-backdrop zone in lower-left for photo overlay"). Does NOT apply to portrait-hero — there the portrait is part of the render, so a missing overlay zone is NOT a flaw.
• Brand drift: the brief lists vivid brand colors but the image is monochrome navy or beige. Brand_fidelity <=4.
• Text-on-face: headline overlaps the subject's face. Text_legibility <=4, hint = "move headline into upper or lower margin band, away from the face".
• AI-garbled secondary text: caption text turns into pseudo-letters or fused glyphs. Text_legibility <=4.
• Distorted hands / extra fingers / fused faces in crowd renderings: visual_quality <=4.

═══════════════════════════════════════════════════════════════
SCORING DISCIPLINE
═══════════════════════════════════════════════════════════════
- A poster with ONE serious flaw and four good dimensions can still pass threshold (7) if the weighted average lands ≥7.
- Do not penalise the same flaw across multiple dimensions. Each issue belongs to its MOST RELEVANT dimension. (A text-on-face flaw is text_legibility, not composition.)
- If the image is genuinely excellent, give 9-10. Do not artificially cap at 8 to "leave headroom".

Return ONLY the JSON object.`

// ============================================================
// MAIN — public API
// ============================================================

/**
 * Critique a generated poster. Returns the verdict only.
 * Use criticReviewWithUsage if you need token/cost telemetry.
 */
export async function criticReview(
  input: CriticInput,
  options?: { signal?: AbortSignal }
): Promise<CriticVerdict> {
  const { verdict } = await criticReviewWithUsage(input, options)
  return verdict
}

/**
 * Same as criticReview but also returns token/cost telemetry.
 * Use this from the test harness and from any code path that wants to
 * surface critic cost on the usage dashboard.
 */
export async function criticReviewWithUsage(
  input: CriticInput,
  options?: { signal?: AbortSignal; trackUsage?: { organizationId: string; userId: string; creativeId?: string | null } }
): Promise<CriticResult> {
  const startTime = Date.now()
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY

  if (!apiKey) {
    // No key → return a fallback verdict so callers still get a valid shape.
    return {
      verdict: fallbackVerdict('GEMINI_API_KEY missing — fallback verdict, accept-by-default to avoid blocking pipeline.'),
      usage: {
        model: GEMINI_MODEL,
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        estimatedCostUsd: 0,
        durationMs: Date.now() - startTime,
        source: 'fallback',
      },
    }
  }

  const mimeType = (input.imageMimeType || 'image/png').trim()
  const briefText = buildBriefText(input.brief)

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
      model: GEMINI_MODEL,
      systemInstruction: SYSTEM_PROMPT,
      generationConfig: {
        temperature: 0.4, // disciplined critique, not creative riff
        topK: 32,
        topP: 0.9,
        maxOutputTokens: MAX_OUTPUT_TOKENS,
        responseMimeType: 'application/json',
      },
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
      ],
    })

    const result = await model.generateContent([
      briefText,
      {
        inlineData: {
          mimeType,
          data: stripDataUrlPrefix(input.imageBase64),
        },
      },
    ])

    if (options?.signal?.aborted) {
      throw new Error('Critic call aborted')
    }

    const response = result.response
    const text = response.text()
    const usage = response.usageMetadata
    const inputTokens = usage?.promptTokenCount || 0
    const outputTokens = usage?.candidatesTokenCount || 0
    const totalTokens = usage?.totalTokenCount || inputTokens + outputTokens
    // Gemini 2.5 Flash: input $0.30/M, output $2.50/M (text). Image input counted as tokens.
    const estimatedCostUsd = (inputTokens / 1_000_000) * 0.30 + (outputTokens / 1_000_000) * 2.50
    const durationMs = Date.now() - startTime

    const parsed = parseCritiqueJson(text)
    const verdict = normaliseVerdict(parsed)

    if (options?.trackUsage) {
      void trackApiUsage({
        organizationId: options.trackUsage.organizationId,
        userId: options.trackUsage.userId,
        creativeId: options.trackUsage.creativeId ?? null,
        // v53.2: 'poster_critique' RequestType added to ai-pricing.ts for accurate cost attribution
        requestType: 'poster_critique',
        provider: 'gemini',
        model: GEMINI_MODEL,
        inputTokens,
        outputTokens,
        estimatedCostUsd,
        durationMs,
        success: true,
        promptLength: SYSTEM_PROMPT.length + briefText.length,
        metadata: {
          agent: 'poster-critic',
          overallScore: verdict.overallScore,
          passesThreshold: verdict.passesThreshold,
          formatId: input.brief.formatId,
        },
      })
    }

    return {
      verdict,
      usage: {
        model: GEMINI_MODEL,
        inputTokens,
        outputTokens,
        totalTokens,
        estimatedCostUsd,
        durationMs,
        source: 'ai',
      },
    }
  } catch (err) {
    console.warn('[Poster Critic] Gemini call failed, returning fallback verdict:', err)
    return {
      verdict: fallbackVerdict(`Gemini call failed: ${(err as Error).message}`),
      usage: {
        model: GEMINI_MODEL,
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        estimatedCostUsd: 0,
        durationMs: Date.now() - startTime,
        source: 'fallback',
      },
    }
  }
}

// ============================================================
// BRIEF / IMAGE PREP
// ============================================================

function buildBriefText(brief: CriticInput['brief']): string {
  const colors = brief.brandColors
    ? [
        brief.brandColors.primary ? `primary=${brief.brandColors.primary}` : null,
        brief.brandColors.secondary ? `secondary=${brief.brandColors.secondary}` : null,
        brief.brandColors.accent ? `accent=${brief.brandColors.accent}` : null,
      ]
        .filter(Boolean)
        .join(', ')
    : '(none provided — do not penalise brand_fidelity for absent colors, score 7 by default)'

  return [
    'Critique the attached poster against this brief and return the JSON verdict.',
    '',
    `eventName: ${brief.eventName || '(empty)'}`,
    `tagline: ${brief.tagline || '(none)'}`,
    `description: ${brief.description || '(none)'}`,
    `formatId: ${brief.formatId}`,
    `compositionStrategy: ${brief.compositionStrategy || '(unspecified)'}`,
    `backgroundStyle: ${brief.backgroundStyle || '(unspecified)'}`,
    `brandColors: ${colors}`,
    `hasSpeakerPhoto: ${
      brief.hasSpeakerPhoto
        ? (brief.compositionStrategy === 'portrait-hero'
            ? 'yes — the speaker portrait is rendered DIRECTLY into the scene (no separate overlay); judge the rendered portrait (single, dignified, undistorted), do NOT require a separate empty overlay zone'
            : 'yes — layout MUST leave a clean dignified zone for the photo overlay')
        : 'no'
    }`,
    '',
    'Score each dimension 0-10 with the strict rubric. Return the JSON object now.',
  ].join('\n')
}

function stripDataUrlPrefix(b64: string): string {
  if (b64.startsWith('data:')) {
    const comma = b64.indexOf(',')
    if (comma >= 0) return b64.slice(comma + 1)
  }
  return b64
}

// ============================================================
// PARSING / NORMALISATION
// (Gemini in JSON-mode is well-behaved but we still defend against
//  fenced output, partial dimensions, and out-of-range scores.)
// ============================================================

function parseCritiqueJson(raw: string): any {
  let s = raw.trim()
  if (s.startsWith('```json')) s = s.slice(7)
  else if (s.startsWith('```')) s = s.slice(3)
  if (s.endsWith('```')) s = s.slice(0, -3)
  s = s.trim()
  const match = s.match(/\{[\s\S]*\}/)
  const jsonStr = match ? match[0] : s
  return safeJsonParse<any>(jsonStr)
}

function normaliseVerdict(parsed: any): CriticVerdict {
  const dimensionsRaw: any[] = Array.isArray(parsed?.dimensions) ? parsed.dimensions : []
  const byName = new Map<CriticDimension, DimensionScore>()

  for (const d of dimensionsRaw) {
    const name = d?.dimension
    if (!isDimension(name)) continue
    byName.set(name, {
      dimension: name,
      score: clampScore(d?.score),
      reasoning: typeof d?.reasoning === 'string' ? d.reasoning : '',
      issues: Array.isArray(d?.issues)
        ? d.issues.filter((x: unknown): x is string => typeof x === 'string' && x.length > 0).slice(0, 3)
        : [],
      fixSuggestion:
        typeof d?.fixSuggestion === 'string' && d.fixSuggestion.length > 0
          ? d.fixSuggestion
          : undefined,
    })
  }

  // Force every dimension to be present (fill missing with neutral 7).
  const dimensions: DimensionScore[] = DIMENSION_ORDER.map(name => {
    return (
      byName.get(name) ?? {
        dimension: name,
        score: 7,
        reasoning: 'Model omitted this dimension; defaulting to neutral 7.',
        issues: [],
      }
    )
  })

  const overallScore = computeOverall(dimensions)
  const passesThreshold = overallScore >= PASS_THRESHOLD

  // Top issues: collect every issue with its severity (10 - score), sort, take 3.
  const topIssues = pickTopIssues(parsed?.topIssues, dimensions)

  let regenerationHint: string | undefined
  if (typeof parsed?.regenerationHint === 'string' && parsed.regenerationHint.length > 0) {
    regenerationHint = parsed.regenerationHint
  } else if (!passesThreshold) {
    regenerationHint = synthesizeRegenerationHint(dimensions, topIssues)
  }

  const confidenceRaw = Number(parsed?.confidence)
  const confidence = Number.isFinite(confidenceRaw) ? Math.max(0, Math.min(1, confidenceRaw)) : 0.7

  return {
    overallScore,
    passesThreshold,
    dimensions,
    topIssues,
    regenerationHint,
    confidence,
  }
}

function isDimension(v: unknown): v is CriticDimension {
  return (
    v === 'composition' ||
    v === 'brand_fidelity' ||
    v === 'subject_treatment' ||
    v === 'text_legibility' ||
    v === 'visual_quality'
  )
}

function clampScore(n: unknown): number {
  const x = Number(n)
  if (!Number.isFinite(x)) return 5
  return Math.max(0, Math.min(10, x))
}

function computeOverall(dims: DimensionScore[]): number {
  let total = 0
  for (const d of dims) total += d.score * DIMENSION_WEIGHTS[d.dimension]
  // Round to 2 decimals for stable display / assertions.
  return Math.round(total * 100) / 100
}

function pickTopIssues(modelTopIssues: unknown, dims: DimensionScore[]): string[] {
  // Prefer the model's curated list if it's there and well-formed.
  if (Array.isArray(modelTopIssues)) {
    const cleaned = modelTopIssues
      .filter((x: unknown): x is string => typeof x === 'string' && x.length > 0)
      .slice(0, 3)
    if (cleaned.length >= 1) return cleaned
  }
  // Otherwise synthesise: every issue weighted by (10 - score).
  const ranked: Array<{ issue: string; severity: number }> = []
  for (const d of dims) {
    const severity = 10 - d.score
    for (const issue of d.issues) ranked.push({ issue, severity })
  }
  ranked.sort((a, b) => b.severity - a.severity)
  return ranked.slice(0, 3).map(r => r.issue)
}

function synthesizeRegenerationHint(dims: DimensionScore[], topIssues: string[]): string {
  const worst = [...dims].sort((a, b) => a.score - b.score).slice(0, 2)
  const fixes = worst
    .map(d => d.fixSuggestion)
    .filter((s): s is string => !!s && s.length > 0)
  const issueSummary = topIssues.slice(0, 2).join('; ') || worst.map(d => `${d.dimension} weakness`).join('; ')
  const fixSummary = fixes.length > 0 ? fixes.join('; ') : 'tighten composition and respect the brief strategy'
  return `PREVIOUS ATTEMPT had: ${issueSummary}. For this generation: ${fixSummary}.`
}

function fallbackVerdict(reason: string): CriticVerdict {
  // Neutral 7 across the board so the pipeline does not regenerate on a fallback.
  const dimensions: DimensionScore[] = DIMENSION_ORDER.map(name => ({
    dimension: name,
    score: 7,
    reasoning: reason,
    issues: [],
  }))
  return {
    overallScore: computeOverall(dimensions),
    passesThreshold: true,
    dimensions,
    topIssues: [],
    confidence: 0,
  }
}
