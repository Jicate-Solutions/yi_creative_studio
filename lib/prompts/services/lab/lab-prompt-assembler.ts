/**
 * Lab Prompt Assembler — v54.0 (Lab fork only)
 *
 * Takes the Creative Director's output and produces the FINAL string that
 * goes to gemini-3.x-flash-image-preview.
 *
 * Deliberately minimal:
 *   - NO XML tags (image models treat XML as literal text noise)
 *   - NO pixel coordinates (image models cannot read "576px")
 *   - NO "MUST" / "DO NOT" / "NEVER" instructions (image models enter
 *     compliance mode and ignore creative intent)
 *   - NO duplicate brand-color enforcement blocks (Director already wove
 *     them into prose ONCE)
 *
 * The Director's prose is essentially the final prompt. This assembler just
 * adds a tiny optional context envelope for debugging and one safety-net
 * line about Sharp post-processing (in case the Director forgot to include it).
 *
 * ISOLATION: only imported by app/api/generate-lab/route.ts.
 */

import type { DirectorOutput } from '@/lib/agents/lab-creative-director'

export interface AssemblerOptions {
  /**
   * Canvas dimensions — used only for the Sharp safety-net hint, in case the
   * Director's prose forgot to mention buffer zones.
   */
  canvasWidth: number
  canvasHeight: number
  /**
   * When true, prepend a tiny "Generate image:" prefix so the model knows
   * the following text is the creative brief, not conversation context.
   * Default true.
   */
  withGeneratePrefix?: boolean
  /**
   * When true, append a tiny safety-net hint about Sharp post-processing in
   * case the Director forgot. Default true.
   */
  withSharpSafetyNet?: boolean
  /**
   * When a style-only reference image is attached to the request (see the Lab
   * route's `styleReferenceBase64`), pass the reference's `note` here. The
   * assembler appends a descriptive envelope telling the model the attached
   * image is a STYLE guide only — match its look, never its content. Phrased in
   * the assembler's gentle descriptive voice (no MUST/DO-NOT compliance triggers).
   */
  styleReferenceNote?: string
}

export interface AssembledPrompt {
  /** The final string sent to Gemini Image API as the `text` part. */
  prompt: string
  /** Optional system instruction — kept minimal in Lab; usually empty/undefined. */
  systemInstruction?: string
  /** Diagnostic info for logs. */
  meta: {
    chars: number
    estimatedTokens: number
    source: 'director' | 'fallback'
    visualThemeName: string
    mood: string
  }
}

/**
 * Assemble the final Gemini prompt from the Director's output.
 *
 * The Director's prose already includes:
 *   - The full visual scene description
 *   - Brand colors woven into natural language
 *   - Subject treatment (portrait-hero / concept-iconic / etc.)
 *   - A short Sharp-zone hint at the end
 *
 * So this assembler mostly passes the prose through. Two tiny adjustments:
 *   1. Optional "Generate the following image:" prefix for clarity
 *   2. Optional safety-net Sharp hint if Director's prose doesn't already
 *      mention "Sharp" / "logo bars" / "footer typography"
 */
export function assembleLabPrompt(
  directorOutput: DirectorOutput,
  options: AssemblerOptions
): AssembledPrompt {
  const {
    canvasWidth,
    canvasHeight,
    withGeneratePrefix = true,
    withSharpSafetyNet = true,
    styleReferenceNote,
  } = options

  const prose = directorOutput.prosePrompt.trim()
  const hasSharpHint =
    /sharp\s+will\s+composite|top\s+40\s*%|empty\s+of\s+all\s+decorative|atmospheric\s+(continuation|background).*(top|bottom)\s+(40|18)\s*%/i.test(prose)

  const parts: string[] = []
  if (withGeneratePrefix) {
    parts.push('Render the following scene as a single coherent image.')
  }
  // v54.1 Fix #1: Wrap prose in <scene_description> so the shared sanitizer in
  // generateWithGemini detects an XML-structured prompt and uses GENTLE mode
  // instead of AGGRESSIVE (legacy) mode. AGGRESSIVE mode eats natural verbs
  // ("Generate", "Render", "Create", "Design", "MUST", "DO NOT") from prose,
  // mutilating the Director's output. GENTLE mode preserves natural sentences.
  parts.push(`<scene_description>\n${prose}\n</scene_description>`)
  if (styleReferenceNote) {
    // Descriptive (not command) voice so GENTLE sanitization keeps it and the
    // model treats it as context. Clarifies that the attached reference is a
    // look-only guide — its people, text, and logos belong to a different event.
    parts.push(
      `<scene_description>\nOne of the attached images is a STYLE REFERENCE only — ${styleReferenceNote} It shows the visual language to echo: palette, lighting, composition, type hierarchy, and overall design confidence. The reference's own people, headline text, dates, and logos belong to a different event and are not part of this poster — the subject to feature comes from this brief (a supplied portrait or a figure true to this event), every line of text comes from this brief, and the top strip stays clear so the logo row can be composited afterwards.\n</scene_description>`
    )
  }
  if (withSharpSafetyNet && !hasSharpHint) {
    // v54.1 Fix #2: Director may forget the Sharp hint — add a 40%/18%
    // safety net (was 15%/15% — wrong, caused top blur smear because Sharp's
    // verifier flags the top 40% as forbidden but we told Gemini only 15%).
    parts.push(
      `<scene_description>\nThe top 40% of the ${canvasWidth}×${canvasHeight} canvas (the upper 576 pixels) must be empty of all decorative elements, confetti, icons, text, faces, and figures — only soft atmospheric continuation of the background. The bottom 18% must also be quiet atmospheric background. Logo bars and footer typography will be composited in those regions during post-processing.\n</scene_description>`
    )
  }

  const prompt = parts.join('\n\n')

  return {
    prompt,
    systemInstruction: undefined, // Lab keeps system instruction empty by design — the prose is self-contained
    meta: {
      chars: prompt.length,
      estimatedTokens: Math.round(prompt.length / 4),
      source: 'director',
      visualThemeName: directorOutput.visualThemeName,
      mood: directorOutput.mood,
    },
  }
}

/**
 * Fallback assembler — when the Director failed entirely and we have only
 * the user's raw brief. Produces a minimal clean prompt so the pipeline can
 * still attempt a generation rather than crashing.
 */
export function assembleFallbackPrompt(
  eventName: string,
  description: string | undefined,
  brandPrimaryColor: string,
  canvasWidth: number,
  canvasHeight: number
): AssembledPrompt {
  const prose = `A clean modern event poster for "${eventName}"${
    description ? ` — ${description}` : ''
  }. Contemporary editorial composition with the brand color ${brandPrimaryColor} as the dominant background, generous negative space, modern sans-serif typography, restrained decoration. Keep the top 15% and bottom 15% of the ${canvasWidth}×${canvasHeight} canvas as soft atmospheric continuation of the background for logo bars and footer typography overlay.`
  return {
    prompt: 'Generate the following image:\n\n' + prose,
    systemInstruction: undefined,
    meta: {
      chars: prose.length + 28,
      estimatedTokens: Math.round((prose.length + 28) / 4),
      source: 'fallback',
      visualThemeName: 'Fallback Composition',
      mood: 'contemporary, neutral',
    },
  }
}
