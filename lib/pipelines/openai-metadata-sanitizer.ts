/**
 * Strip design-metadata fields from the user brief before it reaches the
 * OpenAI pipeline.
 *
 * Why this exists: gpt-image-1 takes a plain-text prompt with no way to
 * distinguish "instruction" from "text to render." Every value that lands
 * in the compiled brief is fair game for the image model to paint as
 * visible text. Fields like `theme: tricolor`, `style: gradient`, or
 * `backgroundStyle: abstract` are design metadata that should steer
 * composition but MUST NOT appear as rendered words on the poster.
 *
 * Gemini sidesteps this via XML-structured prompts (`<instruction>` tags
 * are hidden from the model's text-rendering attention). OpenAI has no
 * such shield, so we drop the fields at the pipeline entrance.
 *
 * Only the OpenAI route imports this. Gemini continues to receive the
 * full form data untouched.
 */

const METADATA_FIELDS = new Set<string>([
  'theme',
  'style',
  'sophistication',
  'mood',
  'backgroundStyle',
  'spotlightTheme',
  'customThemeDescription',
  'language',
])

export function sanitizeUserFormDataForOpenAI(
  userFormData: Record<string, unknown> | undefined
): Record<string, unknown> | undefined {
  if (!userFormData) return userFormData

  const out: Record<string, unknown> = {}
  const stripped: string[] = []

  for (const [key, value] of Object.entries(userFormData)) {
    if (METADATA_FIELDS.has(key)) {
      stripped.push(key)
      continue
    }
    out[key] = value
  }

  if (stripped.length > 0) {
    console.log(
      `[OpenAI Pipeline] Sanitized metadata fields from user brief: ${stripped.join(', ')}`
    )
  }

  return out
}
