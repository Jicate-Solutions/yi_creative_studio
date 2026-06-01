/**
 * Designer Pipeline — Stage 05: Style Plan
 *
 * Decides the rendering mode (the division of labour between the image model and
 * the deterministic engine) and resolves a concrete background style id. Mirrors
 * the precedence of lib/creative-engine/stages/rendering-mode.ts (selectRenderingMode),
 * re-implemented against the designer pipeline's lighter input:
 *   official / certificate / multilingual → engine_exact
 *   advertising                           → ai_native
 *   institutional                         → hybrid_shape
 */

import type {
  DesignerPipelineInput,
  RenderingMode,
  StyleIntent,
  StylePlan,
  UserBridge,
} from './contracts'

/** Formats where text accuracy is non-negotiable → always engine_exact. */
const EXACT_FORMATS =
  /certificate|letterhead|report_cover|book_cover|business_card|id_card|notice|resume/i

/** Concrete BackgroundStyleId per intent (see lib/config/background-styles.ts). */
const STYLE_ID_BY_INTENT: Record<Exclude<StyleIntent, 'auto'>, string> = {
  advertising: 'advertising',
  institutional: 'spotlight-event',
  official: 'scene',
}

/**
 * Resolve the effective style intent. Explicit input wins; otherwise infer from the
 * event family — people-events default to premium advertising key art, formal/
 * official briefs default to brand-safe official.
 */
function resolveStyleIntent(input: DesignerPipelineInput, bridge: UserBridge): StyleIntent {
  if (input.styleIntent && input.styleIntent !== 'auto') return input.styleIntent

  if (EXACT_FORMATS.test(input.formatId)) return 'official'
  if (input.languageHint && input.languageHint.toLowerCase() !== 'en') return 'official'

  switch (bridge.detectedEventFamily) {
    case 'official':
      return 'official'
    case 'conference':
      return 'institutional'
    default:
      // awareness / drive / nursing / student / community / campaign / celebration / greeting
      return 'advertising'
  }
}

function decideRenderingMode(
  input: DesignerPipelineInput,
  intent: StyleIntent
): RenderingMode {
  // Brand-safe / strict cases first — exact deterministic text only.
  if (input.languageHint && input.languageHint.toLowerCase() !== 'en') return 'engine_exact'
  if (EXACT_FORMATS.test(input.formatId)) return 'engine_exact'
  if (intent === 'official') return 'engine_exact'

  if (intent === 'advertising') return 'ai_native'
  if (intent === 'institutional') return 'hybrid_shape'

  return 'engine_exact'
}

export function buildStylePlan(input: DesignerPipelineInput, bridge: UserBridge): StylePlan {
  const styleIntent = resolveStyleIntent(input, bridge)
  const renderingMode = decideRenderingMode(input, styleIntent)

  // Honour a user-chosen background style id if present; else map from intent.
  const styleId =
    input.backgroundStyle ||
    (styleIntent === 'auto' ? 'scene' : STYLE_ID_BY_INTENT[styleIntent])

  const reasoning =
    renderingMode === 'engine_exact'
      ? `Official/exact-text context (${input.formatId}${input.languageHint && input.languageHint !== 'en' ? ', ' + input.languageHint : ''}) → engine renders all copy.`
      : renderingMode === 'ai_native'
        ? 'Advertising intent → AI renders the full poster including typography; verify text after.'
        : 'Institutional intent → AI scene with designed containers; engine renders exact copy.'

  return { styleId, styleIntent, renderingMode, reasoning }
}
