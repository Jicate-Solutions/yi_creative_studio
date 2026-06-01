/**
 * Designer Pipeline — smoke test (deterministic, no API key needed)
 *
 * Run:
 *   npx tsx lib/designer-pipeline/__tests__/designer-pipeline.test.ts
 *
 * The canonical case is the designer brief that motivated this pipeline:
 *   "Road Safety Awareness Drive by JKKN Nursing Students"
 * It must keep the real nursing students as the hero (not an empty road + helmet)
 * and produce a balanced, separated colour plan.
 */

import { buildDesignerPipeline } from '../index'
import type { DesignerPipelineInput } from '../contracts'

let passed = 0
let failed = 0

function check(label: string, cond: boolean, detail?: string) {
  if (cond) {
    passed++
    console.log(`  ✅ ${label}`)
  } else {
    failed++
    console.error(`  ❌ ${label}${detail ? ` — ${detail}` : ''}`)
  }
}

/** Parse a #rrggbb hex into channels (lenient — returns null for non-hex). */
function rgb(hex: string): { r: number; g: number; b: number } | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return null
  const n = parseInt(m[1], 16)
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

/** Magenta family: strong red + strong blue, clearly less green (pink/magenta/fuchsia). */
function isMagentaFamily(hex: string): boolean {
  const c = rgb(hex)
  if (!c) return false
  return c.r > 120 && c.b > 60 && c.g < Math.min(c.r, c.b) * 0.85
}

// ---------------------------------------------------------------------------
// Case 1 — the canonical Road Safety brief
// ---------------------------------------------------------------------------
console.log('\nCase 1: Road Safety Awareness Drive by JKKN Nursing Students')
{
  const input: DesignerPipelineInput = {
    eventName: 'Road Safety Awareness Drive by JKKN Nursing Students',
    organizationName: 'JKKN Nursing',
    formatId: 'event_poster',
  }
  const r = buildDesignerPipeline(input)

  console.log('   mainSubject     :', r.designIntent.mainSubject)
  console.log('   narrativeMode   :', r.designIntent.narrativeMode)
  console.log('   visualStrategy  :', r.designIntent.visualStrategy)
  console.log('   renderingMode   :', r.stylePlan.renderingMode)
  console.log('   contrastLevel   :', r.colorPlan.contrastLevel)
  console.log('   accentUsage     :', r.colorPlan.accentUsage)
  console.log('   mustAvoid       :', r.designIntent.mustAvoid.join(' | '))
  console.log('   userFacingSummary:', r.userFacingSummary)

  check(
    'mainSubject = JKKN nursing students',
    r.designIntent.mainSubject.toLowerCase().includes('jkkn nursing students'),
    r.designIntent.mainSubject
  )
  check('narrativeMode = actor-led', r.designIntent.narrativeMode === 'actor-led')
  check('visualStrategy = activity-driven', r.designIntent.visualStrategy === 'activity-driven')
  check('renderingMode = ai_native', r.stylePlan.renderingMode === 'ai_native')
  check('colorPlan contrastLevel = balanced', r.colorPlan.contrastLevel === 'balanced')
  check(
    'accent limited to safety highlights',
    /safety/i.test(r.colorPlan.accentUsage),
    r.colorPlan.accentUsage
  )
  check(
    'mustAvoid includes empty road',
    r.designIntent.mustAvoid.some((a) => /empty road/i.test(a))
  )
  check(
    'mustAvoid includes only-helmet symbol',
    r.designIntent.mustAvoid.some((a) => /only.*helmet/i.test(a))
  )
  check(
    'mustAvoid includes generic road stock image',
    r.designIntent.mustAvoid.some((a) => /generic road stock image/i.test(a))
  )
  check(
    'userFacingSummary names the subject',
    r.userFacingSummary.length > 0 &&
      /jkkn nursing students/i.test(r.userFacingSummary),
    r.userFacingSummary
  )
  check('ratio is 60-30-10', r.colorPlan.ratio.dominant === 60 && r.colorPlan.ratio.support === 30 && r.colorPlan.ratio.accent === 10)
}

// ---------------------------------------------------------------------------
// Case 2 — certificate forces engine_exact
// ---------------------------------------------------------------------------
console.log('\nCase 2: Certificate of Participation (formatId: certificate)')
{
  const r = buildDesignerPipeline({
    eventName: 'Certificate of Participation',
    formatId: 'certificate',
  })
  console.log('   renderingMode   :', r.stylePlan.renderingMode)
  check('certificate → engine_exact', r.stylePlan.renderingMode === 'engine_exact')
}

// ---------------------------------------------------------------------------
// Case 3 — institutional intent → hybrid_shape
// ---------------------------------------------------------------------------
console.log('\nCase 3: Leadership Summit (styleIntent: institutional)')
{
  const r = buildDesignerPipeline({
    eventName: 'Annual Leadership Summit',
    formatId: 'event_poster',
    styleIntent: 'institutional',
  })
  console.log('   renderingMode   :', r.stylePlan.renderingMode)
  check('institutional → hybrid_shape', r.stylePlan.renderingMode === 'hybrid_shape')
}

// ---------------------------------------------------------------------------
// Case 4 — explicit high contrast opt-in
// ---------------------------------------------------------------------------
console.log('\nCase 4: high-contrast opt-in respected')
{
  const r = buildDesignerPipeline({
    eventName: 'Road Safety Awareness Drive by JKKN Nursing Students',
    organizationName: 'JKKN Nursing',
    formatId: 'event_poster',
    requestedHighContrast: true,
  })
  console.log('   contrastLevel   :', r.colorPlan.contrastLevel)
  check('requestedHighContrast → high', r.colorPlan.contrastLevel === 'high')
}

// ---------------------------------------------------------------------------
// Case 5 — user's own visual idea drives the pipeline (highest priority)
// ---------------------------------------------------------------------------
console.log('\nCase 5: userVisualIdea — "Show JKKN nursing students helping riders wear helmets near a zebra crossing"')
{
  const r = buildDesignerPipeline({
    eventName: 'Road Safety Awareness Drive',
    formatId: 'event_poster',
    userVisualIdea:
      'Show JKKN nursing students helping riders wear helmets near a zebra crossing',
  })

  console.log('   mainSubject     :', r.designIntent.mainSubject)
  console.log('   narrativeMode   :', r.designIntent.narrativeMode)
  console.log('   visualStrategy  :', r.designIntent.visualStrategy)
  console.log('   mustShow        :', r.designIntent.mustShow.join(' | '))
  console.log('   mustAvoid       :', r.designIntent.mustAvoid.join(' | '))
  console.log('   userFacingSummary:', r.userFacingSummary)

  check(
    'mainSubject = JKKN nursing students',
    r.designIntent.mainSubject.toLowerCase().includes('jkkn nursing students'),
    r.designIntent.mainSubject
  )
  check('narrativeMode = actor-led', r.designIntent.narrativeMode === 'actor-led')
  check('visualStrategy = activity-driven', r.designIntent.visualStrategy === 'activity-driven')
  check(
    'mustShow includes helmet guidance',
    r.designIntent.mustShow.some((s) => /helmet guidance/i.test(s))
  )
  check(
    'mustShow includes zebra crossing',
    r.designIntent.mustShow.some((s) => /zebra crossing/i.test(s))
  )
  check(
    'mustShow includes commuters',
    r.designIntent.mustShow.some((s) => /commuters/i.test(s))
  )
  check(
    'mustAvoid includes empty road',
    r.designIntent.mustAvoid.some((a) => /empty road/i.test(a))
  )
  check(
    'mustAvoid includes only-helmet symbol',
    r.designIntent.mustAvoid.some((a) => /only.*helmet/i.test(a))
  )
  check(
    'mustAvoid includes generic road stock image',
    r.designIntent.mustAvoid.some((a) => /generic road stock image/i.test(a))
  )
  check(
    'bridge echoes the userVisualIdea',
    !!r.bridge.userVisualIdea && /helmets/i.test(r.bridge.userVisualIdea)
  )
}

// ---------------------------------------------------------------------------
// Case 6 — idea-only (no event name) still recovers the actor
// ---------------------------------------------------------------------------
console.log('\nCase 6: idea-only (no eventName)')
{
  const r = buildDesignerPipeline({
    formatId: 'event_poster',
    eventName: '',
    creativeDirection:
      'Depict JKKN nursing students guiding commuters at a zebra crossing with helmets',
  })
  console.log('   mainSubject     :', r.designIntent.mainSubject)
  console.log('   narrativeMode   :', r.designIntent.narrativeMode)
  check(
    'idea-only mainSubject = JKKN nursing students',
    r.designIntent.mainSubject.toLowerCase().includes('jkkn nursing students'),
    r.designIntent.mainSubject
  )
  check('idea-only narrativeMode = actor-led', r.designIntent.narrativeMode === 'actor-led')
}

// ---------------------------------------------------------------------------
// Case 7 — Style Blend Engine: an ORDERED user stack (movie-keyart → photo-real →
// luxury) keeps the actor AND assigns dimensions by pick order: cinematic lead owns
// lighting, documentary owns people, luxury owns finish (role-based, priority).
// ---------------------------------------------------------------------------
console.log('\nCase 7: Road Safety Drive + ordered styleStack [movie-keyart, photo-real, luxury]')
{
  const r = buildDesignerPipeline({
    eventName: 'Road Safety Awareness Drive by JKKN Nursing Students',
    organizationName: 'JKKN Nursing',
    formatId: 'event_poster',
    styleBlend: { styleStack: ['movie-keyart', 'photo-real', 'luxury'] },
  })

  const plan = r.styleBlendPlan
  const ownerOf = (axis: string) => plan.roles.find((x) => x.axis === axis)?.styleId
  console.log('   mainSubject     :', r.designIntent.mainSubject)
  console.log('   narrativeMode   :', r.designIntent.narrativeMode)
  console.log('   visualStrategy  :', r.designIntent.visualStrategy)
  console.log('   renderingMode   :', r.stylePlan.renderingMode)
  console.log('   contrastLevel   :', r.colorPlan.contrastLevel)
  console.log('   mode/lead       :', plan.mode, '/', plan.leadStyleId)
  console.log('   stackLabel      :', plan.stackLabel)
  console.log('   bullets         :', plan.understoodBullets.join(' | '))
  console.log('   finish owner    :', ownerOf('finish'))

  // The blend must NOT disturb the actor-preservation / colour discipline contract.
  check(
    'mainSubject = JKKN nursing students',
    r.designIntent.mainSubject.toLowerCase().includes('jkkn nursing students'),
    r.designIntent.mainSubject
  )
  check('narrativeMode = actor-led', r.designIntent.narrativeMode === 'actor-led')
  check('visualStrategy = activity-driven', r.designIntent.visualStrategy === 'activity-driven')
  check('renderingMode = ai_native', r.stylePlan.renderingMode === 'ai_native')
  check('colorPlan stays balanced', r.colorPlan.contrastLevel === 'balanced')

  // The blend itself — ordered priority ownership.
  check('mode = blend', plan.mode === 'blend')
  check('lead = movie-keyart (1st pick)', plan.leadStyleId === 'movie-keyart')
  check('lighting owned by the lead (not a secondary role)', !ownerOf('lighting'))
  check('people owned by photo-real', ownerOf('people') === 'photo-real')
  check('finish owned by luxury', ownerOf('finish') === 'luxury')
  check('stackLabel names all three styles', plan.styleStack.length === 3 && /Luxury/.test(plan.stackLabel))
  check('understoodBullets lead mentions lighting', /lighting/i.test(plan.understoodBullets[0] ?? ''))
  check('understoodBullets non-empty', plan.understoodBullets.length === 3)
  check('directorConstraints include the STYLE BLEND block', /STYLE BLEND/i.test(r.directorConstraints))
  check('director lines mention the lead leads', /LEAD/i.test(plan.directorLines.join('\n')))
}

// ---------------------------------------------------------------------------
// Case 7b — the named preset resolves to the same ordered stack.
// ---------------------------------------------------------------------------
console.log('\nCase 7b: preset styleRecipe = cinematic-human-luxury → stack')
{
  const r = buildDesignerPipeline({
    eventName: 'Road Safety Awareness Drive by JKKN Nursing Students',
    organizationName: 'JKKN Nursing',
    formatId: 'event_poster',
    styleBlend: { styleRecipe: 'cinematic-human-luxury' },
  })
  check('preset → blend mode', r.styleBlendPlan.mode === 'blend')
  check('preset lead = movie-keyart', r.styleBlendPlan.leadStyleId === 'movie-keyart')
  check(
    'preset finish owned by luxury',
    r.styleBlendPlan.roles.find((x) => x.axis === 'finish')?.styleId === 'luxury'
  )
}

// ---------------------------------------------------------------------------
// Case 8 — single style (one pick) = plain single style, no extra blend lines.
// ---------------------------------------------------------------------------
console.log('\nCase 8: single style [movie-keyart] = single, no blend lines')
{
  const r = buildDesignerPipeline({
    eventName: 'Road Safety Awareness Drive',
    organizationName: 'JKKN Nursing',
    formatId: 'event_poster',
    styleBlend: { styleStack: ['movie-keyart'] },
  })
  check('single mode', r.styleBlendPlan.mode === 'single')
  check('single lead = movie-keyart', r.styleBlendPlan.leadStyleId === 'movie-keyart')
  check('single has no director lines', r.styleBlendPlan.directorLines.length === 0)
  check('single adds no STYLE BLEND block', !/STYLE BLEND/i.test(r.directorConstraints))
}

// ---------------------------------------------------------------------------
// Case 9 — AI Auto = no styles (passthrough): constraints unchanged.
// ---------------------------------------------------------------------------
console.log('\nCase 9: AI Auto (empty styleStack) injects no blend')
{
  const r = buildDesignerPipeline({
    eventName: 'Road Safety Awareness Drive',
    organizationName: 'JKKN Nursing',
    formatId: 'event_poster',
    styleBlend: { styleStack: [] },
  })
  check('auto mode', r.styleBlendPlan.mode === 'auto')
  check('auto has no director lines', r.styleBlendPlan.directorLines.length === 0)
  check('auto adds no STYLE BLEND block', !/STYLE BLEND/i.test(r.directorConstraints))
}

// ---------------------------------------------------------------------------
// Case 10 — TINTZ Makeup Artist Carnival (v1.1): idea-parser + natural colours + domain.
// ---------------------------------------------------------------------------
console.log('\nCase 10: TINTZ Makeup Artist Carnival (idea parser + colours + domain)')
{
  const r = buildDesignerPipeline({
    eventName: 'Makeup Artist Carnival',
    organizationName: 'TINTZ',
    formatId: 'event_poster',
    userVisualIdea: 'add some makeup brush as bg texture, Oswald, Montserrat, Open Sans, 50% stroke',
    colorRequests: ['Magenta', 'Gold gradient'],
  })

  const cd = r.creativeDirectives
  console.log('   mainSubject      :', r.designIntent.mainSubject)
  console.log('   domain           :', r.bridge.domain)
  console.log('   backgroundMotifs :', r.designIntent.backgroundMotifs.join(' | '))
  console.log('   colorDirection   :', r.colorPlan.colorDirection)
  console.log('   typography       :', cd.typography.join(', '))
  console.log('   textEffects      :', cd.textEffects.join(', '))
  console.log('   summary          :', r.userFacingSummary)

  // Issue 2 — motif is NOT the hero; people/domain is.
  check(
    'mainSubject = makeup artists / beauty artists',
    /makeup artists \/ beauty artists/i.test(r.designIntent.mainSubject),
    r.designIntent.mainSubject
  )
  check('NOT "makeup brush" as hero', !/brush/i.test(r.designIntent.mainSubject))
  check('narrativeMode = actor-led', r.designIntent.narrativeMode === 'actor-led')
  check('visualStrategy = activity-driven', r.designIntent.visualStrategy === 'activity-driven')
  check('renderingMode = ai_native', r.stylePlan.renderingMode === 'ai_native')

  // Issue 2 — motif goes to background, fonts/effects to their buckets.
  check(
    'backgroundMotifs includes makeup brush texture',
    r.designIntent.backgroundMotifs.some((m) => /makeup brush texture/i.test(m)),
    r.designIntent.backgroundMotifs.join(' | ')
  )
  check(
    'typography = Oswald title / Montserrat general / Open Sans details',
    cd.typography.join(', ') === 'Oswald title, Montserrat general, Open Sans details',
    cd.typography.join(', ')
  )
  check('textEffects includes 50% stroke', cd.textEffects.some((e) => /50\s*%\s*stroke/i.test(e)))

  // Issue 1 — natural colour names normalised (not Yi fallback).
  check('colorPlan is a custom palette', r.colorPlan.isCustomPalette === true)
  check(
    'colorDirection = magenta + gold luxury palette',
    r.colorPlan.colorDirection === 'magenta + gold luxury palette',
    r.colorPlan.colorDirection
  )
  // Resolver owns the exact hex + role assignment (color-dev). Design logic makes the
  // dominant the calm background and honours the vivid magenta as the SUPPORT identity hue,
  // so assert magenta is present in the palette (support/accent) — not a brittle dominant hex.
  check(
    'magenta is honoured in the palette (support/accent)',
    isMagentaFamily(r.colorPlan.support) || isMagentaFamily(r.colorPlan.accent),
    `support=${r.colorPlan.support} accent=${r.colorPlan.accent}`
  )
  check('did NOT fall back to Yi blue', r.colorPlan.dominantColor.toUpperCase() !== '#005B96')

  // Issue 3 — domain preserved + tech reinterpretation forbidden.
  check('domain = beauty', /beauty/i.test(r.bridge.domain ?? ''), r.bridge.domain)
  check(
    'mustAvoid forbids tech/corporate drift',
    r.designIntent.mustAvoid.some((a) => /tech|corporate|office/i.test(a))
  )
  check('directorConstraints carry DOMAIN lock', /DOMAIN:/.test(r.directorConstraints))

  // Acceptance — the preview says the right lines.
  check('preview Hero line', /Hero: makeup artists \/ beauty artists/i.test(r.userFacingSummary))
  check('preview Background motif line', /Background motif: makeup brush texture/i.test(r.userFacingSummary))
  check('preview Color direction line', /Color direction: magenta \+ gold luxury palette/i.test(r.userFacingSummary))
  check(
    'preview Typography line',
    /Typography: Oswald title, Montserrat general, Open Sans details, 50% stroke/i.test(r.userFacingSummary),
    r.userFacingSummary
  )
}

// ===========================================================================
// v1.1 DYNAMIC CASES (task #7) — general, not TINTZ-only. Each exercises the
// 10-bucket parser + domain lock + ColorPlan v2 + structuredUnderstanding across a
// DIFFERENT domain, proving subject-vs-motif separation and colour honouring.
// ===========================================================================

// ---------------------------------------------------------------------------
// v1.1 Case A — Beauty: makeup brush is a BACKGROUND motif; magenta/gold/white are
// honoured user colours (not Yi fallback); the 50% stroke is a text effect.
// ---------------------------------------------------------------------------
console.log('\nv1.1 Case A: Beauty — TINTZ Makeup Artist Carnival (dynamic idea)')
{
  const r = buildDesignerPipeline({
    eventName: 'TINTZ 2K26',
    tagline: 'Makeup Artist Carnival',
    formatId: 'event_poster',
    userVisualIdea:
      'Add makeup brush in background\nBase Color: Magenta\nFont Colors: Gold gradient and white\nText Effects: Add a 50% stroke',
  })
  const p = r.parsedIdea
  console.log('   subjectIntent   :', JSON.stringify(p.subjectIntent))
  console.log('   visualMotifs    :', JSON.stringify(p.visualMotifs))
  console.log('   colorRequests   :', JSON.stringify(p.colorRequests))
  console.log('   textEffects     :', JSON.stringify(p.textEffectsRequests))
  console.log('   domain          :', r.domain.domain, r.domain.confidence)
  console.log('   colorPlan.source:', r.colorPlan.source, 'honored=', r.colorPlan.userColorsHonored)

  check(
    'A: mainSubject is makeup/beauty pros / carnival participants (not a brush)',
    /makeup|beauty|artist|carnival|participant/i.test(r.structuredUnderstanding.hero) &&
      !/brush/i.test(r.structuredUnderstanding.hero),
    r.structuredUnderstanding.hero
  )
  check(
    'A: visualMotifs has makeup brush in background',
    p.visualMotifs.some((m) => /makeup brush/i.test(m) && /background|texture/i.test(m)),
    p.visualMotifs.join(' | ')
  )
  check('A: brush did NOT leak into subjectIntent', !p.subjectIntent.some((s) => /brush/i.test(s)))
  check(
    'A: colorRequests has magenta + gold gradient + white',
    /magenta/i.test(p.colorRequests.join(' ')) &&
      /gold gradient/i.test(p.colorRequests.join(' ')) &&
      /white/i.test(p.colorRequests.join(' ')),
    p.colorRequests.join(' | ')
  )
  check(
    'A: textEffectsRequests has 50% stroke',
    p.textEffectsRequests.some((e) => /50\s*%\s*stroke/i.test(e)),
    p.textEffectsRequests.join(' | ')
  )
  check('A: domain = beauty', r.domain.domain === 'beauty', r.domain.domain)
  check(
    'A: domain forbids tech drift',
    r.domain.forbiddenDrift.some((d) => /tech|coding|tablet|futuristic|conference/i.test(d))
  )
  check('A: colorPlan.source = user-color-request', r.colorPlan.source === 'user-color-request')
  check('A: userColorsHonored', r.colorPlan.userColorsHonored === true)
  check('A: NOT Yi blue fallback', r.colorPlan.support.toUpperCase() !== '#005B96')
  // Design logic (color-dev) makes the dominant the calm background; the vivid magenta is
  // honoured as the SUPPORT identity hue. Assert magenta lives somewhere in the palette.
  check(
    'A: magenta is honoured in the palette (support/accent)',
    isMagentaFamily(r.colorPlan.support) || isMagentaFamily(r.colorPlan.accent),
    `support=${r.colorPlan.support} accent=${r.colorPlan.accent}`
  )
  check(
    'A: gold gradient tokens present',
    !!r.colorPlan.gradientTokens && r.colorPlan.gradientTokens.length >= 2,
    JSON.stringify(r.colorPlan.gradientTokens)
  )

  // Enforcement path (task #5, enforce-dev) — the compiled Director constraints must carry
  // the domain lock + the honoured-colour override so the AI is genuinely constrained.
  const dc = r.directorConstraints
  check('A: directorConstraints contain DOMAIN LOCK', dc.includes('DOMAIN LOCK'))
  check(
    'A: DOMAIN LOCK enumerates forbidden tech drift',
    /DOMAIN LOCK[\s\S]*?(tech|coding|tablet|futuristic|conference)/i.test(dc)
  )
  check('A: directorConstraints contain USER COLORS OVERRIDE', dc.includes('USER COLORS OVERRIDE'))
  check('A: directorConstraints contain TEXT COLOUR STRATEGY', dc.includes('TEXT COLOUR STRATEGY'))
  check('A: directorConstraints contain GRADIENT directive', dc.includes('GRADIENT'))
}

// ---------------------------------------------------------------------------
// v1.1 Case B — Road safety: nursing students stay the actor-led hero; helmet/zebra/
// commuters are supporting elements, not the subject. No regression.
// ---------------------------------------------------------------------------
console.log('\nv1.1 Case B: Road safety — nursing students helping riders')
{
  const r = buildDesignerPipeline({
    eventName: 'Road Safety Drive',
    formatId: 'event_poster',
    userVisualIdea: 'Show JKKN nursing students helping riders near zebra crossing',
  })
  console.log('   subjectIntent   :', JSON.stringify(r.parsedIdea.subjectIntent))
  console.log('   mainSubject     :', r.designIntent.mainSubject)
  console.log('   mustShow        :', r.designIntent.mustShow.join(' | '))

  check(
    'B: mainSubject = JKKN nursing students',
    /jkkn nursing students/i.test(r.designIntent.mainSubject),
    r.designIntent.mainSubject
  )
  check(
    'B: subjectIntent captured the nursing students',
    r.parsedIdea.subjectIntent.some((s) => /nursing students/i.test(s)),
    r.parsedIdea.subjectIntent.join(' | ')
  )
  check('B: narrativeMode = actor-led', r.designIntent.narrativeMode === 'actor-led')
  check('B: visualStrategy = activity-driven', r.designIntent.visualStrategy === 'activity-driven')
  check(
    'B: motifs zebra crossing / commuters appear as mustShow',
    r.designIntent.mustShow.some((s) => /zebra crossing/i.test(s)) &&
      r.designIntent.mustShow.some((s) => /commuters/i.test(s)),
    r.designIntent.mustShow.join(' | ')
  )
  check('B: domain = road-safety', r.domain.domain === 'road-safety', r.domain.domain)
  check(
    'B: no regression — mustAvoid still forbids empty road',
    r.designIntent.mustAvoid.some((a) => /empty road/i.test(a))
  )
  // Enforcement contract: with NO user colours, the override block must be ABSENT (the
  // brand/auto palette stands), while the DOMAIN LOCK is still injected.
  check('B: no user colours → userColorsHonored false', r.colorPlan.userColorsHonored === false)
  check(
    'B: no USER COLORS OVERRIDE block when colours not honoured',
    !r.directorConstraints.includes('USER COLORS OVERRIDE')
  )
  check('B: DOMAIN LOCK still injected for road-safety', r.directorConstraints.includes('DOMAIN LOCK'))
}

// ---------------------------------------------------------------------------
// v1.1 Case C — Education: books are a background TEXTURE motif; the hero comes from
// the event context (org), NOT the books; navy/gold normalised.
// ---------------------------------------------------------------------------
console.log('\nv1.1 Case C: Education — books as background texture, navy + gold')
{
  const r = buildDesignerPipeline({
    eventName: 'Inter-College Education Workshop',
    organizationName: 'JKKN College',
    formatId: 'event_poster',
    userVisualIdea: 'Add books as background texture, use navy and gold',
  })
  console.log('   subjectIntent   :', JSON.stringify(r.parsedIdea.subjectIntent))
  console.log('   visualMotifs    :', JSON.stringify(r.parsedIdea.visualMotifs))
  console.log('   mainSubject     :', r.designIntent.mainSubject)

  check('C: books did NOT become the hero', !/book/i.test(r.designIntent.mainSubject), r.designIntent.mainSubject)
  check('C: books are a background motif', r.parsedIdea.visualMotifs.some((m) => /book/i.test(m) && /texture|background/i.test(m)), r.parsedIdea.visualMotifs.join(' | '))
  check('C: books did NOT leak into subjectIntent', !r.parsedIdea.subjectIntent.some((s) => /book/i.test(s)))
  check('C: domain = education', r.domain.domain === 'education', r.domain.domain)
  check(
    'C: colorRequests has navy + gold',
    /navy/i.test(r.parsedIdea.colorRequests.join(' ')) && /gold/i.test(r.parsedIdea.colorRequests.join(' ')),
    r.parsedIdea.colorRequests.join(' | ')
  )
  check('C: user colours honoured (not brand)', r.colorPlan.userColorsHonored === true)
  check('C: mainSubject is non-empty', r.designIntent.mainSubject.trim().length > 0)
}

// ---------------------------------------------------------------------------
// v1.1 Case D — Healthcare: stethoscope is a PATTERN motif; soft blue/white normalised;
// hero comes from the healthcare event, not the stethoscope.
// ---------------------------------------------------------------------------
console.log('\nv1.1 Case D: Healthcare — stethoscope pattern, soft blue + white')
{
  const r = buildDesignerPipeline({
    eventName: 'World Nursing Day',
    formatId: 'event_poster',
    userVisualIdea: 'Use stethoscope pattern in background, soft blue and white',
  })
  console.log('   visualMotifs    :', JSON.stringify(r.parsedIdea.visualMotifs))
  console.log('   colorRequests   :', JSON.stringify(r.parsedIdea.colorRequests))
  console.log('   mainSubject     :', r.designIntent.mainSubject)

  check('D: stethoscope is a motif', r.parsedIdea.visualMotifs.some((m) => /stethoscope/i.test(m)), r.parsedIdea.visualMotifs.join(' | '))
  check('D: stethoscope did NOT become the hero', !/stethoscope/i.test(r.designIntent.mainSubject), r.designIntent.mainSubject)
  check('D: domain = healthcare', r.domain.domain === 'healthcare', r.domain.domain)
  check(
    'D: colorRequests resolve blue + white',
    /blue/i.test(r.parsedIdea.colorRequests.join(' ')) && /white/i.test(r.parsedIdea.colorRequests.join(' ')),
    r.parsedIdea.colorRequests.join(' | ')
  )
  check('D: colorPlan honoured the user blue/white', r.colorPlan.userColorsHonored === true)
  check('D: mainSubject is non-empty', r.designIntent.mainSubject.trim().length > 0)
}

// ---------------------------------------------------------------------------
// v1.1 Case E — Festival: diya + kolam border are decorative motifs (not the hero);
// maroon/gold normalised; hero from the festival context.
// ---------------------------------------------------------------------------
console.log('\nv1.1 Case E: Festival — diya and kolam border, maroon + gold')
{
  const r = buildDesignerPipeline({
    eventName: 'Diwali Celebration',
    formatId: 'event_poster',
    userVisualIdea: 'Use diya and kolam border, maroon and gold',
  })
  console.log('   subjectIntent   :', JSON.stringify(r.parsedIdea.subjectIntent))
  console.log('   visualMotifs    :', JSON.stringify(r.parsedIdea.visualMotifs))
  console.log('   colorRequests   :', JSON.stringify(r.parsedIdea.colorRequests))
  console.log('   mainSubject     :', r.designIntent.mainSubject)

  check(
    'E: diya + kolam are decorative motifs',
    r.parsedIdea.visualMotifs.some((m) => /diya/i.test(m)) &&
      r.parsedIdea.visualMotifs.some((m) => /kolam/i.test(m)),
    r.parsedIdea.visualMotifs.join(' | ')
  )
  check('E: diya/kolam did NOT leak into subjectIntent', !r.parsedIdea.subjectIntent.some((s) => /diya|kolam/i.test(s)))
  check('E: domain = cultural', r.domain.domain === 'cultural', r.domain.domain)
  check(
    'E: colorRequests has maroon + gold',
    /maroon/i.test(r.parsedIdea.colorRequests.join(' ')) && /gold/i.test(r.parsedIdea.colorRequests.join(' ')),
    r.parsedIdea.colorRequests.join(' | ')
  )
  check('E: user colours honoured', r.colorPlan.userColorsHonored === true)
  check('E: mainSubject from festival context (non-empty)', r.designIntent.mainSubject.trim().length > 0)
}

// ===========================================================================
// v1.3 — Typography Intelligence (designed poster lettering, not document text)
// ===========================================================================

console.log('\nv1.3 Case T1: Typography — Fresher Day (spotlight-event + luxury + minimal)')
{
  const r = buildDesignerPipeline({
    eventName: 'Fresher Day',
    formatId: 'event_poster',
    styleBlend: { styleStack: ['spotlight-event', 'luxury', 'minimal'] },
  })
  const tp = r.typographyPlan
  console.log('   personality   :', tp.personalityBlend.join(' + '))
  console.log('   titleTreatment:', tp.titleTreatment.slice(0, 90))
  console.log('   typoDirection :', r.structuredUnderstanding.typographyDirection)

  check(
    'T1: personality includes festival-bold or luxury-display',
    tp.personalityBlend.includes('festival-bold') || tp.personalityBlend.includes('luxury-display'),
    tp.personalityBlend.join(' + ')
  )
  check('T1: titleTreatment mentions celebratory display lettering', /celebrat|display|lettering/i.test(tp.titleTreatment))
  check('T1: avoid includes document / PowerPoint style', /document|powerpoint/i.test(tp.avoid.join(' ')))
  check('T1: preview surfaces a typographyDirection', r.structuredUnderstanding.typographyDirection.trim().length > 0)
  check('T1: typographyMode is ai-native-display (advertising → ai_native)', tp.typographyMode === 'ai-native-display', tp.typographyMode)
}

console.log('\nv1.3 Case T2: Typography — TINTZ user fonts (Oswald / Montserrat / Open Sans)')
{
  const r = buildDesignerPipeline({
    eventName: 'TINTZ 2K26',
    tagline: 'Makeup Artist Carnival',
    formatId: 'event_poster',
    styleBlend: { styleStack: ['movie-keyart', 'photo-real', 'luxury'] },
    userVisualIdea:
      'Main Event Title Font: Oswald\nTitle/General Font: Montserrat\nVenue & Date Headings: Open Sans',
  })
  const tp = r.typographyPlan
  console.log('   personality   :', tp.personalityBlend.join(' + '))
  console.log('   fontDirection :', tp.fontDirection.slice(0, 140))

  check('T2: user fonts honoured', tp.userFontsHonored === true)
  check(
    'T2: title uses Oswald-style bold condensed display',
    /oswald-style/i.test(tp.fontDirection) && /condensed/i.test(tp.fontDirection),
    tp.fontDirection
  )
  check('T2: general uses Montserrat-style', /montserrat-style/i.test(tp.fontDirection))
  check('T2: details use Open Sans-style', /open sans-style/i.test(tp.fontDirection))
  check('T2: titleTreatment includes cinematic / luxury display', /cinematic|luxury|display/i.test(tp.titleTreatment))
  check('T2: avoid includes default document font', /document|default|arial|powerpoint/i.test(tp.avoid.join(' ')))
  check(
    'T2: blend is cinematic-title + luxury-display',
    tp.personalityBlend.includes('cinematic-title') && tp.personalityBlend.includes('luxury-display'),
    tp.personalityBlend.join(' + ')
  )
  check('T2: directorConstraints carry the typography block', /TYPOGRAPHY \(designed poster lettering/i.test(r.directorConstraints))
  check('T2: typography audit passes (plan-level critic)', r.typographyAudit.pass === true, `score ${r.typographyAudit.score}`)
  check(
    'T2: preview typographyDirection mentions Oswald + "not document"',
    /oswald/i.test(r.structuredUnderstanding.typographyDirection) &&
      /not document/i.test(r.structuredUnderstanding.typographyDirection),
    r.structuredUnderstanding.typographyDirection
  )
}

console.log('\nv1.3 Case T3: Typography — Institutional (premium-institutional)')
{
  const r = buildDesignerPipeline({
    eventName: 'Department Meet 2026',
    formatId: 'event_poster',
    styleBlend: { styleStack: ['premium-institutional'] },
  })
  const tp = r.typographyPlan
  console.log('   personality   :', tp.personalityBlend.join(' + '))

  check('T3: personality = institutional-premium', tp.headlinePersonality === 'institutional-premium', tp.headlinePersonality)
  check(
    'T3: clean-but-designed hierarchy (not boring document style)',
    /structured|authority|premium|designed/i.test(tp.titleTreatment + ' ' + tp.hierarchy),
    tp.titleTreatment
  )
  check('T3: avoid still forbids default document font', /document|default/i.test(tp.avoid.join(' ')))
}

console.log('\nv1.3 Case T4: Typography — Minimal luxury')
{
  const r = buildDesignerPipeline({
    eventName: 'Quiet Luxe Evening',
    formatId: 'event_poster',
    styleBlend: { styleStack: ['minimal', 'luxury'] },
  })
  const tp = r.typographyPlan
  console.log('   personality   :', tp.personalityBlend.join(' + '))

  check('T4: primary personality = minimal-modern', tp.headlinePersonality === 'minimal-modern', tp.headlinePersonality)
  check('T4: blend includes luxury-display', tp.personalityBlend.includes('luxury-display'), tp.personalityBlend.join(' + '))
  check(
    'T4: treatment is restrained / spacious / elegant',
    /restrain|spac|elegant|quiet|minimal/i.test(tp.titleTreatment + ' ' + tp.letterSpacing),
    tp.titleTreatment
  )
}

// ---------------------------------------------------------------------------
console.log(`\n${'='.repeat(48)}`)
console.log(`Designer Pipeline smoke test: ${passed} passed, ${failed} failed`)
console.log('='.repeat(48))
if (failed > 0) process.exit(1)
