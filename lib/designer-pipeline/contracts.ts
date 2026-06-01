/**
 * Designer Pipeline — Contracts
 *
 * The Designer Pipeline is a deterministic PRE-STAGE for the duplicated Forge
 * route (app/api/generate-designer/route.ts). It converts raw user input into an
 * explicit, inspectable design understanding BEFORE prompt generation, then
 * CONSTRAINS the Claude Director with it.
 *
 * It exists to fix two designer-reported failures:
 *   1. No bridge between user expectation and AI interpretation — the AI silently
 *      reinterprets the brief (e.g. "Road Safety Drive by nursing students"
 *      becomes an empty road + a floating helmet, dropping the actual people).
 *   2. Color theory is not separated — every brand colour renders at full contrast
 *      everywhere, producing harsh, neon-ish posters.
 *
 * Vocabulary is REUSED from the existing creative engine where one already exists
 * (VisualStrategy, RenderingMode) so the new pipeline stays consistent with the
 * rest of the system instead of forking a parallel vocabulary that can drift.
 */

import type { VisualStrategy } from '@/lib/creative-engine/contracts/strategy'
import type { RenderingMode } from '@/lib/creative-engine/contracts/scene'

// Re-export the borrowed types so downstream consumers can import everything from
// the designer-pipeline surface without reaching into creative-engine internals.
export type { VisualStrategy, RenderingMode }

/**
 * HOW the story is anchored. `actor-led` keeps real people/activity as the hero;
 * `concept-led` leans on a symbol/idea; product/place lead their respective shots.
 */
export type NarrativeMode = 'actor-led' | 'concept-led' | 'product-led' | 'place-led'

/**
 * Global contrast discipline. Defaults to `balanced` — `high` (and full-canvas
 * saturated colour) is opt-in only, never the default. `soft` is for calm/formal.
 */
export type ContrastLevel = 'soft' | 'balanced' | 'high'

/**
 * Coarse event family. People-families (awareness/student/community/nursing/drive/
 * campaign) default to actor-led + activity-driven. Greetings stay symbolic;
 * official/certificate/multilingual force engine-exact text.
 */
export type EventFamily =
  | 'awareness'
  | 'student'
  | 'community'
  | 'nursing'
  | 'drive'
  | 'campaign'
  | 'celebration'
  | 'greeting'
  | 'conference'
  | 'official'
  | 'generic'

/** The families that must preserve real people/activity as the hero. */
export const ACTOR_LED_FAMILIES: ReadonlyArray<EventFamily> = [
  'awareness',
  'student',
  'community',
  'nursing',
  'drive',
  'campaign',
  'celebration',
]

/**
 * Designer's high-level styling intent. Drives the rendering-mode decision:
 *   advertising   → ai_native      (AI renders the full poster incl. typography)
 *   institutional → hybrid_shape   (AI scene + designed containers; engine copy)
 *   official      → engine_exact   (brand-safe, deterministic text)
 *   auto          → inferred from event family + format
 */
export type StyleIntent = 'advertising' | 'institutional' | 'official' | 'auto'

// ============================================================================
// Style Blend Engine (v2) — user-composed, ORDERED, ROLE-BASED style stacking
// ============================================================================
//
// The user freely picks styles from the FULL background-style library, IN ORDER:
//   • 0 styles → AI Auto (no blend, Director chooses).
//   • 1 style  → a plain single style (identical to the legacy single-style path).
//   • 2+ styles → a role-based blend. The 1st pick LEADS (owns the dimensions it is
//     strongest at + drives the base pipeline); each later pick claims only the
//     dimensions still unclaimed. No two styles fight over the same dimension.

/** A single role-axis a style can control (its "dimension" of influence). */
export type StyleAxis =
  | 'lighting'
  | 'people'
  | 'color'
  | 'spacing'
  | 'composition'
  | 'finish'

/** Named quick-start presets — each resolves to an ORDERED styleStack (see s06). */
export type StyleRecipeId =
  | 'cinematic-human-luxury'
  | 'premium-social-campaign'
  | 'documentary-advertising'
  | 'conceptual-luxury'
  | 'institutional-premium'

/** Style-blend selection coming from the form/UI. */
export interface StyleBlendInput {
  /**
   * Ordered background-style ids (background-styles.ts) — the user's style stack.
   * 1st = lead (highest priority). Empty / absent = AI Auto (no blend).
   */
  styleStack?: string[]
  /** Optional quick-start preset; resolved to a styleStack when `styleStack` is empty. */
  styleRecipe?: StyleRecipeId | 'auto'
}

/** One resolved role: which style controls one axis, plus the directive to follow. */
export interface StyleRoleAssignment {
  axis: StyleAxis
  /** background-style id that owns this axis. */
  styleId: string
  styleLabel: string
  /** The directive (the style's geminiStyleLock / hint) the Director must apply here. */
  directive: string
}

/** s06 — the resolved, ordered, role-based style blend. */
export interface StyleBlendPlan {
  /** 'auto' = no styles; 'single' = one style; 'blend' = 2+ styles. */
  mode: 'auto' | 'single' | 'blend'
  /** Ordered styles in the stack (1st = lead). Empty for auto. */
  styleStack: { id: string; label: string }[]
  /** Human label, e.g. "Movie Keyart" or "Movie Keyart + Documentary + Luxury". */
  stackLabel: string
  /** Lead style id (stack[0]) — the route drives the base pipeline with it. */
  leadStyleId?: string
  /** Role assignments for the SECONDARY styles (the lead is handled by the base path). */
  roles: StyleRoleAssignment[]
  /** Director-facing constraint lines (empty for auto & single — nothing extra injected). */
  directorLines: string[]
  /** UI bullets, e.g. ["Movie Keyart leads — lighting, framing & finish", "Documentary — realistic people"]. */
  understoodBullets: string[]
}

// ============================================================================
// Visual-idea parsing (v1.1) — split the free-text idea into role buckets
// ============================================================================

/**
 * The user's `userVisualIdea` split into 10 role buckets (v1.1), so a motif / font /
 * colour / effect request never gets mistaken for the hero. Only people/activity phrases
 * land in `subjectIntent` — everything else routes to its own bucket and stays a request.
 *
 * Backward-compat: `subjectIdea` is the legacy single-phrase hero (kept for s01/s02 which
 * still read it); `subjectIntent` is the new multi-phrase actor list. New buckets
 * (backgroundInstructions / moodRequests / styleRequests / avoidRequests) extend the
 * original five — existing consumers of visualMotifs / typographyRequests / colorRequests /
 * layoutRequests / textEffectsRequests keep working unchanged.
 */
export interface ParsedIdea {
  /** People / roles / event actors / products / activity groups / explicit hero items. */
  subjectIntent: string[]
  /** Background motifs / textures, e.g. ["makeup brush texture"]. */
  visualMotifs: string[]
  /** Explicit background instructions, e.g. ["soft bokeh backdrop", "dark studio background"]. */
  backgroundInstructions: string[]
  /** Natural colour names / gradients, e.g. ["magenta", "gold gradient"]. */
  colorRequests: string[]
  /** Requested fonts / typographic roles, e.g. ["Montserrat", "Oswald", "luxury serif title"]. */
  typographyRequests: string[]
  /** Type effects, e.g. ["50% stroke", "gold gradient text", "metallic"]. */
  textEffectsRequests: string[]
  /** Layout / composition requests, e.g. ["centered", "two-column"]. */
  layoutRequests: string[]
  /** Mood / tone requests, e.g. ["festive", "premium", "energetic"]. */
  moodRequests: string[]
  /** Art-direction / style requests, e.g. ["cinematic", "flat illustration", "watercolour"]. */
  styleRequests: string[]
  /** Things to avoid, e.g. ["no clutter", "avoid neon"]. */
  avoidRequests: string[]
  /**
   * Legacy single hero phrase, e.g. "JKKN nursing students" (may be absent).
   * Derived from subjectIntent[0]; kept for s01/s02 backward-compat.
   */
  subjectIdea?: string
}

// ============================================================================
// Design-domain lock (v1.1) — keep a beauty event in the beauty world, etc.
// ============================================================================

/** Coarse subject domain. Locks the Director so the world is never reinterpreted. */
export type DesignDomain =
  | 'beauty'
  | 'education'
  | 'healthcare'
  | 'road-safety'
  | 'sports'
  | 'cultural'
  | 'technology'
  | 'leadership'
  | 'official'
  | 'general'

/** The resolved domain plus the drift the Director must forbid. */
export interface DomainLock {
  domain: DesignDomain
  /** 0–1 detection confidence. */
  confidence: number
  /** Human label, e.g. "beauty / cosmetics / makeup". */
  label: string
  /** Scenes/worlds to forbid, e.g. ["tech hub", "coding", "futuristic conference"]. */
  forbiddenDrift: string[]
}

/**
 * The compact "AI understood this" card the preview surfaces and the Director consumes.
 * Computed from the parsed idea + design intent + colour plan.
 */
export interface StructuredUnderstanding {
  /** The hero the scene is about, e.g. "JKKN nursing students". */
  hero: string
  /** Background motifs/textures behind the hero. */
  backgroundMotifs: string[]
  /** One-line colour direction, e.g. "magenta + gold luxury palette (60-30-10)". */
  colorDirection: string
  /** Role-labelled typography, e.g. ["Oswald title", "Montserrat general"]. */
  typography: string[]
  /**
   * v1.3 — one-line designed-typography direction, e.g. "Cinematic luxury title
   * treatment — Oswald-style bold condensed main title, Montserrat-style supporting
   * text, gold/white effects, not document-style fonts." Surfaced in the preview card.
   */
  typographyDirection: string
  /** Text effects, e.g. ["50% stroke"]. */
  textEffects: string[]
  /** Style mix summary, e.g. "Movie Keyart + Documentary" or "AI Auto". */
  styleMix: string
  /** Rendering mode, e.g. "ai_native". */
  renderingMode: string
  /** Things the composition will avoid. */
  willAvoid: string[]
}

// ============================================================================
// Typography Intelligence (v1.3) — designed poster lettering, not document text
// ============================================================================

/**
 * How much typography the image model renders vs the deterministic engine.
 * Mirrors the rendering-mode split: ai_native → the model designs the full title;
 * hybrid → the model designs containers/shape, the engine sets exact copy; engine →
 * the engine renders all text, the plan only styles its containers.
 */
export type TypographyMode = 'ai-native-display' | 'hybrid-text-zones' | 'engine-exact'

/**
 * The headline's design personality — the "voice" of the title treatment. These are the
 * recipe ids in s07-typography-plan.ts. A poster can blend two (primary + secondary),
 * e.g. "cinematic-title + luxury-display".
 */
export type HeadlinePersonality =
  | 'cinematic-title'
  | 'luxury-display'
  | 'editorial-condensed'
  | 'festival-bold'
  | 'youthful-pop'
  | 'institutional-premium'
  | 'minimal-modern'
  | 'cultural-crafted'
  | 'tech-futuristic'

/** Resolved user font roles parsed from the brief (when the user named fonts). */
export interface TypographyFontRoles {
  /** Main title font, e.g. "Oswald". */
  title?: string
  /** Body / general font, e.g. "Montserrat". */
  general?: string
  /** Detail / date-venue font, e.g. "Open Sans". */
  detail?: string
}

/**
 * s07-typography — the designed typography plan. Tells the Director + the Gemini
 * prompt block to treat the title as CUSTOM POSTER LETTERING (expressive, integrated
 * with the scene) rather than plain centered document text. Built deterministically
 * from the style blend, domain, rendering mode, event type, and the user's font requests.
 */
export interface TypographyPlan {
  typographyMode: TypographyMode
  /** Primary personality (highest-affinity recipe). */
  headlinePersonality: HeadlinePersonality
  /** Full blend, primary first (1–2), e.g. ["cinematic-title", "luxury-display"]. */
  personalityBlend: HeadlinePersonality[]
  /** Prose: how the main title should be treated (display lettering, scale, presence). */
  titleTreatment: string
  /**
   * Prose: font direction described as VISUAL PERSONALITY, not just names. When the user
   * named fonts it references them ("an Oswald-like bold condensed display…"); otherwise
   * it describes the recipe's default voice.
   */
  fontDirection: string
  /** Prose: the text hierarchy (title dominant, supporting secondary, details tertiary). */
  hierarchy: string
  /** Prose: tracking / letter-spacing guidance. */
  letterSpacing: string
  /** Controlled text effects, e.g. ["dimensional highlight", "subtle gold edge"]. */
  textEffects: string[]
  /** Prose: supporting / secondary text style. */
  supportingTextStyle: string
  /** Prose: how the type relates to the scene (lighting, depth, integration). */
  layoutRelationship: string
  /** Prose: how colour is applied to the type (reads the colour plan). */
  colorTreatment: string
  /** Typography anti-patterns the model must avoid (document heading, PowerPoint centre…). */
  avoid: string[]
  /** True when the user explicitly named fonts (fontDirection honours them). */
  userFontsHonored: boolean
  /** Resolved user font roles, when named — for reference / overlay reuse. */
  userFontRoles?: TypographyFontRoles
}

/**
 * Deterministic pre-generation typography audit (the "typography critic", plan-level).
 * Validates that the PLAN we send to the model commits to designed poster typography —
 * a dominant title, controlled effects, style/domain-matched voice, document-look forbidden,
 * and the user's named fonts honoured. Scored 0–1; `pass` is score ≥ 0.7.
 */
export interface TypographyAudit {
  /** 0–1 quality score of the typography PLAN (not the rendered image). */
  score: number
  /** True when score ≥ 0.7. */
  pass: boolean
  /** Each checklist item with its outcome. */
  checks: { label: string; ok: boolean }[]
  /** Human notes, e.g. "user font 'Oswald' honoured in title direction". */
  notes: string[]
}

/** Role-assigned creative directives surfaced to the Director + the preview. */
export interface CreativeDirectives {
  /** Role-labelled typography, e.g. ["Oswald title", "Montserrat general", "Open Sans details"]. */
  typography: string[]
  /** Type effects, e.g. ["50% stroke"]. */
  textEffects: string[]
  /** Layout requests. */
  layout: string[]
}

// ============================================================================
// Pipeline input
// ============================================================================

export interface DesignerPipelineInput {
  eventName: string
  description?: string
  tagline?: string
  targetAudience?: string
  /** Organising body, e.g. "JKKN Nursing" — a strong actor-candidate source. */
  organizationName?: string
  /** creative-formats id, e.g. 'event_poster', 'certificate'. */
  formatId: string
  canvasDimensions?: { width: number; height: number }
  brandColors?: {
    primary?: string
    secondary?: string
    accent?: string
    neutral?: string
  }
  /** Existing BackgroundStyleId (background-styles.ts), if already chosen. */
  backgroundStyle?: string
  styleIntent?: StyleIntent
  /** ISO-ish language hint. Anything other than 'en' forces engine_exact text. */
  languageHint?: string
  hasReferencePhoto?: boolean
  /** Explicit opt-in to high-contrast / saturated full-canvas colour. */
  requestedHighContrast?: boolean
  /**
   * The user's own visual idea / ideation, in their words, e.g.
   * "Show JKKN nursing students helping riders wear helmets near a zebra crossing".
   * HIGHEST-PRIORITY signal — it overrides inferred actor/subject and seeds mustShow.
   * `creativeDirection` is an accepted alias.
   */
  userVisualIdea?: string
  /** Alias for userVisualIdea (whichever the form supplies). */
  creativeDirection?: string
  /** v2 Style Blend Engine — composable, role-based multi-style mix. */
  styleBlend?: StyleBlendInput
  /**
   * v1.1 — natural colour names / gradients the user typed ("Magenta", "Gold gradient"),
   * including ones the hex colour-config rejected. Normalised by Color Theory (s03)
   * into roles, OVERRIDING the brand fallback. Combined with colours parsed from the idea.
   */
  colorRequests?: string[]
}

// ============================================================================
// Stage outputs
// ============================================================================

/** s01 — what the user MEANT (the bridge between expectation and interpretation). */
export interface UserBridge {
  rawEventName: string
  /** A short normalised topic phrase, e.g. "road safety awareness". */
  interpretedTopic: string
  detectedEventFamily: EventFamily
  /** Ordered best-first, e.g. ["JKKN nursing students"]. */
  actorCandidates: string[]
  /** Plain sentences the UI can surface, e.g. "User expects the students visible & central". */
  expectationStatements: string[]
  /** Assumptions the pipeline made when the brief was ambiguous. */
  assumptions: string[]
  /** The user's own visual idea, echoed back (normalised) when supplied. */
  userVisualIdea?: string
  /**
   * Detected subject domain label, e.g. "beauty / cosmetics / makeup". Locks the Director
   * to the right world so a Makeup Carnival is never reinterpreted as a tech hub.
   */
  domain?: string
  /** v1.1 — the structured domain lock (coarse DesignDomain + confidence + forbiddenDrift). */
  domainLock?: DomainLock
  /** The user's idea split into role buckets (v1.1). */
  parsedIdea?: ParsedIdea
}

/** s02 — how the AI MUST treat the subject (actor-preservation contract). */
export interface DesignIntent {
  /** The hero the scene is ABOUT, e.g. "JKKN nursing students". */
  mainSubject: string
  narrativeMode: NarrativeMode
  visualStrategy: VisualStrategy
  /** Props that SUPPORT the story but must NOT replace the actor (helmet, signage…). */
  supportingSymbols: string[]
  /**
   * Background motifs / textures the user asked for (e.g. "makeup brush texture").
   * These live BEHIND the hero — they never become the subject.
   */
  backgroundMotifs: string[]
  /**
   * Concrete elements the composition MUST show, seeded from the user's visual idea
   * (e.g. "helmet guidance", "zebra crossing", "commuters") plus the main subject.
   */
  mustShow: string[]
  /** Things the composition must keep, e.g. "the actual people/activity". */
  mustPreserve: string[]
  /** Failure modes to forbid, e.g. "empty road", "only helmet symbol". */
  mustAvoid: string[]
}

/** Where a ColorPlan's palette came from — drives honour/fallback messaging. */
export type ColorSource = 'user-color-request' | 'brand' | 'preset' | 'auto' | 'fallback'

/** s03 — separated colour theory (60-30-10 roles + contrast discipline). */
export interface ColorPlan {
  // --- Legacy role fields (kept intact for existing s07 / preview consumers). ---
  dominantColor: string
  supportColor: string
  accentColor: string
  neutralColor: string
  /** 60-30-10 distribution (dominant/support/accent). Neutral fills negative space. */
  ratio: { dominant: number; support: number; accent: number }
  contrastLevel: ContrastLevel
  /** Where the accent is allowed, e.g. "limited to safety highlights (signage, vests, CTA)". */
  accentUsage: string
  /** Designer-facing colour instructions (no full-canvas neon, reserve contrast for text…). */
  notes: string[]
  /**
   * Human colour direction when the user named colours, e.g. "magenta + gold luxury
   * palette". Absent when colours came from the brand/default.
   */
  colorDirection?: string
  /** True when the palette came from the user's natural colour names (not brand fallback). */
  isCustomPalette?: boolean

  // --- v2 role fields (color-dev) — short aliases + provenance. ---
  /** Where the palette came from (honoured user colours vs brand/auto/fallback). */
  source: ColorSource
  /** Dominant colour (~60%). Alias of dominantColor. */
  dominant: string
  /** Support colour (~30%). Alias of supportColor. */
  support: string
  /** Accent colour (~10%). Alias of accentColor. */
  accent: string
  /** Neutral colour for negative space. Alias of neutralColor. */
  neutral: string
  /** Gradient stop tokens when a gradient was requested, e.g. ["#D4AF37", "#FFFFFF"]. */
  gradientTokens?: string[]
  /** How text colour is chosen for readability, e.g. "white headline on dark; dark on light". */
  textColorStrategy: string
  /** True when the user's named colours were honoured (not the brand fallback). */
  userColorsHonored: boolean
}

/** s04 — layout plan derived from the shared format-zones profile. */
export interface LayoutPlan {
  formatCategory: string
  shape: string
  reserveTopPct: number
  reserveBottomPct: number
  footerStripActive: boolean
  /** Where the hero sits, e.g. "active middle band". */
  focalZone: string
  /** Where text lives, e.g. ["headline upper-middle", "details lower-middle"]. */
  textZones: string[]
}

/** s05 — rendering-mode decision + resolved concrete style id. */
export interface StylePlan {
  /** Resolved BackgroundStyleId, e.g. 'advertising', 'spotlight-event'. */
  styleId: string
  styleIntent: StyleIntent
  renderingMode: RenderingMode
  reasoning: string
}

// ============================================================================
// Pipeline result
// ============================================================================

export interface DesignerPipelineResult {
  bridge: UserBridge
  designIntent: DesignIntent
  colorPlan: ColorPlan
  layoutPlan: LayoutPlan
  stylePlan: StylePlan
  /** s06 — the resolved role-based style blend (passthrough/empty when 'auto'). */
  styleBlendPlan: StyleBlendPlan
  /** v1.1 — role-assigned typography / text-effects / layout from the user's idea. */
  creativeDirectives: CreativeDirectives
  /** v1.1 — the user's idea split into the 10 role buckets (surfaced for preview + tests). */
  parsedIdea: ParsedIdea
  /** v1.1 — the resolved design-domain lock (domain + confidence + forbiddenDrift). */
  domain: DomainLock
  /** v1.1 — the compact "AI understood this" card (preview + Director). */
  structuredUnderstanding: StructuredUnderstanding
  /** v1.3 — the designed typography plan (poster lettering, not document text). */
  typographyPlan: TypographyPlan
  /** v1.3 — the deterministic pre-generation typography audit (plan-level critic). */
  typographyAudit: TypographyAudit
  /** Human-readable "AI understood this" string for the UI, shown before generation. */
  userFacingSummary: string
  /** Compact constraint block injected into the Claude Director's prompt. */
  directorConstraints: string
}
