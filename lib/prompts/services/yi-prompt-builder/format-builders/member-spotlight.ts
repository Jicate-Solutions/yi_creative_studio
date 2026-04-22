/**
 * Member Spotlight Prompt Builder
 *
 * Dedicated generation agent for Yi chapter member/leadership showcase cards.
 * Visual DNA sourced directly from Yi Kanniyakumari Instagram member spotlight posts:
 * - Tricolor (saffron/white/green) OR Yi blue (#005B96) full-canvas background
 * - Large portrait photo zone centered (person is the visual hero)
 * - Bold all-caps member name at lower third (largest text element)
 * - Role/designation below name in medium weight
 * - Chapter name as supporting context
 * - Yi + CII logo bar reserved at top (handled by logo overlay post-processing)
 *
 * ANTI-PATTERNS (never generate for this format):
 * - Event details (dates, venues, times) — this is NOT an event poster
 * - Busy or cluttered backgrounds — the person must stand out
 * - Multiple competing text blocks — name + role is enough
 * - Abstract geometric patterns that fight with the photo zone
 */

import type { MemberSpotlightFormData, EnhancedBuildOptions } from '../types'
import { buildLogoContext, buildBrandContext, buildQualityContext } from '../context-helpers'

// ============================================================
// FEW-SHOT EXAMPLES (trained on yi.kanniyakumari post style)
// ============================================================

const MEMBER_SPOTLIGHT_EXAMPLES = [
  {
    description: 'GOOD: Tricolor vertical bands (saffron left, white center, green right) as full canvas. Person photo centered, isolated on white band. Bold all-caps name "SUBIN GNANA SELVAM" at 70% vertical height. Subtitle "Co Chair 2026" below in medium weight. Clean, nothing else.',
    quality: 'good' as const,
  },
  {
    description: 'GOOD: Deep Yi blue (#005B96) gradient background. Circular portrait photo in upper-center zone. Large white bold name centered at 65% height. Orange role text below. Minimal — only these elements.',
    quality: 'good' as const,
  },
  {
    description: 'AVOID: Busy graphic pattern competing with the portrait photo. Text blocks scattered across canvas. Event date/venue information included. Multiple decorative borders and boxes. Gradient stripes behind the person.',
    quality: 'avoid' as const,
  },
  {
    description: 'AVOID: Portrait photo cropped awkwardly or placed in corner. Name text too small or not prominent. Background too colorful competing with skin tones. Logo icons repeated as decorative fill.',
    quality: 'avoid' as const,
  },
]

// ============================================================
// THEME CONFIGURATIONS
// ============================================================

const THEME_CONFIGS = {
  tricolor: {
    backgroundDescription: 'VIBRANT tricolor: BRIGHT saffron-orange (#FF9933 — vivid, fully saturated, NOT dark or burnt orange) covers the left ~30% as a bold vertical band. PURE white (#FFFFFF) fills the center ~40% as the portrait backdrop. VIVID forest green (#138808 — bright, fully saturated, NOT dark or olive) covers the right ~30%. Colors must be eye-catching and at full saturation — this is the Indian flag palette at maximum vibrancy. The saffron and green bands should pop off the screen.',
    photoZoneBackground: 'pure white center band — crisp, clean, maximum contrast for the portrait',
    namePalette: 'deep navy or dark charcoal (#1a1a2e) for bold legibility over the white zone, or large white text with a thin dark backing band if the name overlaps the color bands',
    mood: 'patriotic, vibrant, proud, organizational identity — COLORFUL and energetic',
  },
  brand: {
    backgroundDescription: 'Rich Yi blue (#005B96) as the dominant background, transitioning to a slightly lighter blue at the bottom. A subtle diagonal light ray or soft vignette adds depth without clutter.',
    photoZoneBackground: 'slightly lighter blue zone or a soft white halo around the portrait to create separation',
    namePalette: 'white (#FFFFFF) for name, light orange or gold (#FF6B35) for role/title',
    mood: 'professional, authoritative, on-brand',
  },
  gradient: {
    backgroundDescription: 'Smooth gradient from Yi blue (#005B96) at the top to a warm dark navy (#1a2332) at the bottom. Clean, modern, corporate feel.',
    photoZoneBackground: 'the gradient provides natural contrast for an isolated portrait photo',
    namePalette: 'white for name, light gray or soft gold for role',
    mood: 'modern, clean, contemporary',
  },
}

// ============================================================
// MAIN BUILDER
// ============================================================

/**
 * Builds a Gemini-optimized XML-structured prompt for member spotlight cards.
 * Encodes Yi chapter member showcase visual DNA.
 */
export function buildMemberSpotlightPrompt(
  formData: MemberSpotlightFormData,
  options: EnhancedBuildOptions = {}
): string {
  const {
    memberName: _memberName,
    memberTitle: _memberTitle,
    chapterName,
    committeeYear,
    bio,
    theme = 'tricolor',
  } = formData

  // Spotlight tab reuses the AI Create form (fields: eventName, tagline, etc.)
  // Fall back to standard event-form field names so the poster always has real content
  const memberName = _memberName || (formData as any).eventName || ''
  const memberTitle = _memberTitle || (formData as any).tagline || (formData as any).subtitle || ''

  const themeConfig = THEME_CONFIGS[theme] || THEME_CONFIGS.tricolor

  // ── Contexts ────────────────────────────────────────────────
  const logoContext = options.logoAwareness
    ? buildLogoContext(options.logoAwareness)
    : ''
  const brandContext = options.brandContext
    ? buildBrandContext(options.brandContext)
    : ''
  const qualityContext = options.resolution
    ? buildQualityContext(options.resolution)
    : ''

  // ── Logo zone forbidden areas (top reserved for Yi/CII logo bar) ──
  const forbiddenZones = `<instruction>(DO NOT RENDER) Reserve the top 12% of canvas height for the Yi + CII logo bar overlay applied in post-processing. No text or important visual content in this zone — keep it clean and uncluttered.</instruction>`

  // ── Chapter / role line ──────────────────────────────────────
  const chapterLine = [chapterName, committeeYear]
    .filter(Boolean)
    .join(' · ')

  const roleDisplayText = [memberTitle, chapterLine].filter(Boolean).join(' — ')

  // ── Few-shot examples block ──────────────────────────────────
  const examplesBlock = MEMBER_SPOTLIGHT_EXAMPLES.map(ex => `
    <example quality="${ex.quality}">${ex.description}</example>`).join('')

  // ── Main prompt ─────────────────────────────────────────────
  return `
<member_spotlight_generation>

<format>
  <type>Member Spotlight Card</type>
  <aspect_ratio>9:16 (portrait — 1080x1920)</aspect_ratio>
  <purpose>Yi chapter member/leadership showcase — person is the visual hero</purpose>
</format>

<visual_concept>
  <style>FLAT GRAPHIC DESIGN — solid color fills, crisp edges, digital poster aesthetic. NOT photorealistic. NOT painterly. NOT cinematic. This is a clean digital announcement card, like a professionally designed Canva template.</style>
  <theme>${theme}</theme>
  <background>${themeConfig.backgroundDescription}</background>
  <photo_zone>
    <position>center canvas, vertically spanning 20%–65% of canvas height</position>
    <background_behind_photo>${themeConfig.photoZoneBackground}</background_behind_photo>
    <instruction>(DO NOT RENDER) CRITICAL — This zone MUST be LEFT COMPLETELY EMPTY. Render it as pure ${themeConfig.photoZoneBackground} with NO person, NO face, NO figure, NO silhouette, NO placeholder portrait. A real member photograph will be composited here in post-processing. Any AI-generated person in this zone will be covered and wasted. Leave it as clean, flat background only.</instruction>
  </photo_zone>
  <mood>${themeConfig.mood}</mood>
</visual_concept>

<text_content>
  <text role="greeting" prominence="hero">WELCOME</text>
  <instruction>(DO NOT RENDER) Place "WELCOME" as a large, bold decorative word at approximately 13%–20% vertical height — directly below the logo bar zone, ABOVE the portrait photo zone. This is the primary visual statement of the card.
For tricolor theme: use vibrant saffron-orange (#FF9933 or #E65C00), bold, wide letter-spacing, all-caps.
For brand/gradient theme: use bold white.
Font size: large — roughly 10–12% of canvas width as character height. Wide tracking (letter-spacing).</instruction>
  <text role="name" prominence="largest">${memberName.toUpperCase()}</text>
  <text role="title" prominence="prominent">${roleDisplayText}</text>
  ${bio ? `<text role="supporting" prominence="small">${bio}</text>` : ''}
  <instruction>(DO NOT RENDER) The name "${memberName.toUpperCase()}" MUST be the largest text element — bold, all-caps, at approximately 70%–75% vertical height on the canvas. Use the name color from the theme: ${themeConfig.namePalette}</instruction>
  <instruction>(DO NOT RENDER) The role "${roleDisplayText}" sits directly below the name, same horizontal alignment, roughly 60–70% of the name's font size. Slightly lighter weight.</instruction>
  ${bio ? `<instruction>(DO NOT RENDER) The bio is optional context text — smallest size, muted color, 2–3 lines maximum, placed just below the role line.</instruction>` : ''}
</text_content>

<composition_rules>
  <instruction>(DO NOT RENDER) CANVAS ZONES from top to bottom:
    - 0%–12%: Logo bar zone — EMPTY (reserved for Yi + CII overlay)
    - 12%–20%: Top breathing space — can have subtle decorative element (thin horizontal line, small Yi emblem, chapter name in very small text)
    - 20%–65%: PORTRAIT PHOTO ZONE — LEAVE EMPTY (flat background color only, NO generated person)
    - 65%–72%: Breathing space between photo and name
    - 72%–80%: MEMBER NAME — bold, all-caps, centered
    - 80%–86%: ROLE / TITLE — medium weight, centered
    - 86%–94%: BIO (if provided) — small text, centered
    - 94%–100%: Bottom margin — clean, matches background
  </instruction>
  <instruction>(DO NOT RENDER) HORIZONTAL COMPOSITION: All text elements are horizontally centered. The photo is centered. No left/right asymmetry unless the brand theme specifically calls for it.</instruction>
  <instruction>(DO NOT RENDER) CLEANLINESS: This is a MINIMAL design. The power comes from: (1) strong background color, (2) clear portrait, (3) bold name. Do NOT add decorative patterns, texture overlays, geometric shapes, or additional graphic elements that compete with the portrait or name. White space is intentional and valuable.</instruction>
</composition_rules>

<anti_patterns>
  <instruction>(DO NOT RENDER) NEVER include: event dates, times, venues, QR codes, registration information, event descriptions. This is a PERSON showcase, not an event announcement.</instruction>
  <instruction>(DO NOT RENDER) NEVER use busy or textured backgrounds that compete with the portrait photo zone.</instruction>
  <instruction>(DO NOT RENDER) NEVER shrink the name text — it must be large and unmissable.</instruction>
  <instruction>(DO NOT RENDER) NEVER place decorative elements in the portrait photo zone — it must remain clean for photo overlay.</instruction>
  <instruction>(DO NOT RENDER) NEVER use Western/non-South-Asian facial features for the placeholder portrait person.</instruction>
</anti_patterns>

${forbiddenZones}

<few_shot_examples>
  ${examplesBlock}
</few_shot_examples>

${logoContext}
${brandContext}
${qualityContext}

<quality_requirements>
  <instruction>(DO NOT RENDER) Final image must look like a premium, professionally designed member showcase card — comparable to what a top Indian corporate communications team would produce. Clean enough to post directly to Instagram without editing.</instruction>
  <instruction>(DO NOT RENDER) Resolution: Full 1080x1920. Crisp typography. No pixelation. Colors rich and vibrant but not garish.</instruction>
</quality_requirements>

</member_spotlight_generation>`.trim()
}
