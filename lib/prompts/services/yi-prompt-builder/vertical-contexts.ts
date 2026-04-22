/**
 * Yi Vertical Context Injection System
 * Provides context-specific guidance for different Yi initiatives
 */

import type { VerticalContext } from './types'

// ============================================================
// VERTICAL CONTEXTS
// ============================================================

export const VERTICAL_CONTEXTS: Record<string, VerticalContext> = {
  masoom: {
    verticalId: 'masoom',
    name: 'Yi Masoom - Child Safety',
    additionalContext: `
<vertical_context>
This is for Yi Masoom, a child safety initiative.
The design must be:
- Family-friendly and appropriate for all ages
- Warm, welcoming, and trustworthy
- Focused on protection, safety, and care for children
- Suitable for display in schools, community centers, and family environments
</vertical_context>`,
    colorPreferences: 'Warm, friendly colors: soft orange, sunshine yellow, sky blue, warm green. Avoid dark or aggressive colors.',
    imageryGuidance: 'Imagery should suggest: families, protection, schools, community, safety. Show happy, safe environments.',
    avoidance: 'Dark themes, scary imagery, aggressive visuals, adult-only content, anything inappropriate for children',
  },

  road_safety: {
    verticalId: 'road_safety',
    name: 'Yi Road Safety',
    additionalContext: `
<vertical_context>
This is for Yi Road Safety awareness initiative.
The design must:
- Communicate safety messages clearly
- Use high-visibility colors for attention
- Be appropriate for public display (billboards, schools, offices)
- Emphasize safe behavior and accident prevention
</vertical_context>`,
    colorPreferences: 'High-visibility: safety yellow, alert orange, traffic red, warning colors. High contrast for readability.',
    imageryGuidance: 'Imagery: roads, vehicles, pedestrians, helmets, seatbelts, safe crossing. Focus on positive safe behavior.',
    avoidance: 'Graphic accident scenes, injuries, disturbing imagery',
  },

  health: {
    verticalId: 'health',
    name: 'Yi Health',
    additionalContext: `
<vertical_context>
This is for Yi Health initiative promoting wellness and healthcare.
The design must:
- Convey trust and medical professionalism
- Be welcoming and not clinical
- Appropriate for healthcare settings
- Encourage healthy behaviors
</vertical_context>`,
    colorPreferences: 'Healthcare appropriate: clean blues, fresh greens, clinical whites, calming colors. Trustworthy palette.',
    imageryGuidance: 'Imagery: healthcare, wellness, medical professionals, healthy lifestyle, community health.',
    avoidance: 'Graphic medical imagery, sick people, depressing health content',
  },

  yuva: {
    verticalId: 'yuva',
    name: 'Yi Yuva - Youth Empowerment',
    additionalContext: `
<vertical_context>
This is for Yi Yuva, a youth empowerment and career development initiative.
The design must:
- Appeal to young professionals (18-35)
- Feel modern, dynamic, and forward-looking
- Convey growth, opportunity, and aspiration
- Be energetic without being juvenile
</vertical_context>`,
    colorPreferences: 'Modern, energetic: electric blue, vibrant purple, dynamic orange, modern palette.',
    imageryGuidance: 'Imagery: young professionals, career growth, technology, education, aspiration, success.',
    avoidance: 'Dated, old-fashioned, corporate boring, juvenile or childish',
  },

  climate: {
    verticalId: 'climate',
    name: 'Yi Climate Action',
    additionalContext: `
<vertical_context>
This is for Yi Climate initiative.
The design MUST reflect:
- High-impact environmental leadership
- Professional, corporate-standard sustainability
- HOPEFUL power - capturing the majesty of nature without over-cluttering
- Sophisticated "Global Statement" aesthetic
</vertical_context>`,
    colorPreferences: 'Deep Forest Green (#0B3D2E), Earthy Stone (#4A4A4A), Clean White, Sky Blue (#0A84FF). Focus on deep, authoritative tones.',
    imageryGuidance: 'High-impact nature photography (macro textures of leaves/stone), clean horizons, or single powerful nature symbols. AVOID busy forests.',
    avoidance: 'Low-quality stock photos, "doom" messaging, cluttered nature scenes, non-professional environmental clipart',
  },

  innovation: {
    verticalId: 'innovation',
    name: 'Yi Innovation',
    additionalContext: `
<vertical_context>
This is for Yi Innovation, promoting technology and startups.
The design MUST reflect:
- "Silicon Valley" sophistication (minimalist, clean, bold)
- Cutting-edge, elite technology
- Professional disruption - clean gradients and focus
- Contemporary "Artist-Engineer" aesthetic
</vertical_context>`,
    colorPreferences: 'Deep Slate (#1A1A1B), Pure White (#FFFFFF), Electric Blue (#0066FF) as sharp accent, monochromatic grays.',
    imageryGuidance: 'Single focal focal technological symbol (e.g., a refined neural node, a clean circuit line), generous negative space, matte gradients.',
    avoidance: 'Busy "Cyberpunk" clutter, glowing neon grids that overwhelm text, outdated tech metaphors, over-saturated party colors',
  },

  education: {
    verticalId: 'education',
    name: 'Yi Education',
    additionalContext: `
<vertical_context>
This is for Yi Education initiative promoting learning and skill development.
The design must:
- Convey knowledge and growth
- Be inspiring and motivational
- Appropriate for educational institutions
- Encourage lifelong learning
</vertical_context>`,
    colorPreferences: 'Educational: academic blues, scholarly greens, warm yellows for knowledge, bright for engagement.',
    imageryGuidance: 'Imagery: books, learning, classrooms, students, teachers, graduation, knowledge symbols.',
    avoidance: 'Boring, outdated education imagery, cramped classrooms, stressed students',
  },

  women_empowerment: {
    verticalId: 'women_empowerment',
    name: 'Yi Women Empowerment',
    additionalContext: `
<vertical_context>
This is for Yi Women Empowerment initiative.
The design must:
- Convey strength, dignity, and empowerment
- Be respectful and celebratory of women
- Feel modern and progressive
- Inspire and motivate
</vertical_context>`,
    colorPreferences: 'Empowering: bold purples, strong pinks, elegant golds, confident colors.',
    imageryGuidance: 'Imagery: strong women, leadership, success, diversity, empowerment symbols.',
    avoidance: 'Stereotypical imagery, demeaning representations, weak portrayals',
  },

  // ============================================================
  // YI MEMBERSHIP — Chapter events, meetings, leadership programs
  // Design reference: Yi Kanniyakumari Instagram (@yi.kanniyakumari)
  // Style: clean, minimal, corporate — typography is the visual hero
  // ============================================================
  membership: {
    verticalId: 'membership',
    name: 'Yi Membership',
    additionalContext: `
<vertical_context>
This is for Yi Membership — chapter events, leadership meetings, award ceremonies, and member activities organized by Young Indians (Yi), a flagship initiative of the Confederation of Indian Industry (CII).

DESIGN MANDATE — Yi Kanniyakumari Instagram Style:
The design MUST follow the clean, professional, corporate-minimal aesthetic seen on Yi chapter official communications.
- Clean solid or gradient background (Yi blue #005B96 is the canonical choice)
- Bold typography as the VISUAL HERO — event name must dominate the canvas
- Maximum ONE subtle thematic element (watermark-style, 8–12% opacity)
- Comparable in quality to CII national communications and official India Inc. materials
- Zero visual clutter — negative space is a deliberate design choice, not emptiness
</vertical_context>`,
    colorPreferences: 'Yi Blue (#005B96) as dominant background. White (#FFFFFF) for primary text. Yi Orange (#FF6B35) as a sparingly-used accent only. Midnight navy (#003A6E) for gradient depth.',
    imageryGuidance: 'NO photographic scenes. Clean gradient or solid background only. At most one subtle thematic watermark at 8–12% opacity (tooth for dental, runner silhouette for sports, etc.). For general Yi events, pure gradient is preferred.',
    avoidance: 'All photographic scenes, crowds, people groups, busy action photography, stock photos, cinematic depth-of-field, decorative medals/confetti/ribbons, celebration clutter, complex visual narratives',
  },

  // ============================================================
  // YI SPOTLIGHT — Creative event poster style
  // Design reference: Yi Kanniyakumari Instagram (@yi.kanniyakumari)
  // Style: vibrant gradient + creative overlays + large focal subject + dynamic typography
  // ============================================================
  yi_spotlight: {
    verticalId: 'yi_spotlight',
    name: 'Yi Spotlight Event',
    additionalContext: `
<vertical_context>
This is a Yi Kanniyakumari chapter event poster using the CREATIVE SPOTLIGHT STYLE — inspired by @yi.kanniyakumari Instagram's vibrant, graphically-rich event posters.

DESIGN MANDATE:
- Rich gradient background tuned to the event theme (deep jewel tones, NOT flat corporate blue)
- Creative geometric or diagonal overlay elements: subtle tricolor accent bands (saffron #FF9933 + green #138808) at 15–20% opacity, or diagonal light streaks
- Large focal subject: a single Indian person or relevant object occupying 45–60% of the canvas height — dynamic pose, emotionally engaged with the event topic
- Bold split-typography style: event name rendered in TWO LINES with contrasting weight
- Optional calligraphy/script accent for connecting words
- Color-blocked information strip concept: a vibrant horizontal band near the bottom anchoring date/venue info
- Instagram-shareable energy — poster must look premium and post-ready
</vertical_context>`,
    colorPreferences: 'Deep jewel-tone gradient derived from the event theme — let the event content drive the color choice. Yi Orange (#FF6B35) for the info-anchor band. Tricolor diagonal accents (saffron #FF9933 + green #138808) at 15–20% opacity where appropriate.',
    imageryGuidance: 'Scene-based content (people, environment, props) driven by the event topic. Focal subject should feel large and dynamic. Creative diagonal overlay adds texture. Color-blocked info band at bottom.',
    avoidance: 'Plain flat corporate gradients, static stiff poses, generic stock-photo look, Western faces, non-Indian appearance',
  },

  // ============================================================
  // SPECIAL EDITION: NEW YEAR 2026
  // ============================================================
  new_year_2026: {
    verticalId: 'new_year_2026',
    name: 'New Year 2026 Celebration',
    additionalContext: `
<vertical_context>
Special edition vertical for New Year 2026 Gala and Summit events.
The design strategy must be EXTREMELY PREMIUM:
- Use HIGH-IMPACT MINIMALISM with vast negative space
- Enforce the SOLID WHITE LOGO STRIPE for branding
- Prioritize ELEGANT SERIF typography for headlines
- Use CENTERED ALIGNMENT for a majestic, celebratory feel
- Inject AMBIENT TEXTURES like grain and geometric highlights
</vertical_context>`,
    colorPreferences: 'Palette: Deep Slate (#1A1A1B), New Year Gold (#CFB53B), and Crisp White. High-contrast premium look.',
    imageryGuidance: 'Imagery: Minimalist golden starbursts, abstract geometric fireworks, architectural gradients.',
    avoidance: 'Party clutter, balloons, cheap clip-art, cartoon clocks, busy patterns, multiple overlapping photos.',
  },
}

// ============================================================
// VERTICAL CONTEXT INJECTION
// ============================================================

/**
 * Brand colors passed by the caller to override vertical-specific color preferences.
 * When provided, the vertical's hardcoded palette (e.g. Yi Orange, jewel tones) is
 * replaced with the user's actual brand colors so Gemini doesn't ignore them.
 */
export interface VerticalBrandColors {
  primary: string
  secondary: string
  accent?: string
}

/**
 * Inject vertical-specific context into a base prompt.
 * Adds additional guidance, color preferences, and avoidance rules.
 *
 * @param brandColors - When provided, the vertical's hardcoded color preferences are
 *   replaced with the user's brand colors and a final override block is appended.
 *   This prevents Yi-specific palettes (jewel tones, Yi Orange, tricolor accents)
 *   from overriding non-Yi organizations' brand colors.
 */
export function injectVerticalContext(
  basePrompt: string,
  verticalId: string | undefined,
  brandColors?: VerticalBrandColors
): string {
  if (!verticalId) return basePrompt

  const context = VERTICAL_CONTEXTS[verticalId]
  if (!context) return basePrompt

  // When the caller supplies brand colors, replace the vertical's hardcoded color
  // preferences so Gemini doesn't follow Yi-specific palettes for non-Yi orgs.
  const colorSection = brandColors
    ? `<vertical_colors>Use the user's brand colors as the dominant palette: Primary ${brandColors.primary}, Secondary ${brandColors.secondary}${brandColors.accent ? `, Accent ${brandColors.accent}` : ''}. These OVERRIDE any color suggestions in the vertical context above.</vertical_colors>`
    : `<vertical_colors>${context.colorPreferences}</vertical_colors>`

  // Final override block injected only when brand colors are provided — placed at the
  // very end of the prompt so it wins over any earlier "jewel tones / Yi Orange /
  // tricolor accents" language that may appear in additionalContext.
  const brandOverride = brandColors
    ? `\n<instruction>
BRAND COLOR FINAL OVERRIDE — NON-NEGOTIABLE:
The user has specified explicit brand colors that MUST dominate the design.
Primary background/gradient: ${brandColors.primary}
Secondary accents/highlights: ${brandColors.secondary}${brandColors.accent ? `\nTertiary/accent: ${brandColors.accent}` : ''}
Do NOT use deep jewel tones, Yi Orange (#FF6B35), or tricolor Indian accents (saffron #FF9933 / flag green #138808) unless they exactly match the brand colors listed above.
The MANDATORY COLOR PALETTE earlier in this prompt is authoritative — all color references in the vertical context are OVERRIDDEN by it.
</instruction>`
    : ''

  // Find the constraints section
  const constraintsIndex = basePrompt.indexOf('<constraints>')
  if (constraintsIndex === -1) {
    // No constraints section — append at end
    return (
      basePrompt +
      '\n\n' +
      context.additionalContext +
      `\n<vertical_imagery>${context.imageryGuidance}</vertical_imagery>` +
      `\n${colorSection}` +
      brandOverride
    )
  }

  // Insert before constraints and modify avoidance
  const beforeConstraints = basePrompt.substring(0, constraintsIndex)
  const constraintsSection = basePrompt.substring(constraintsIndex)

  // Modify constraints to include vertical-specific avoidance
  const modifiedConstraints = constraintsSection.replace(
    'Avoid:',
    `Avoid: ${context.avoidance}. Also avoid:`
  )

  return (
    beforeConstraints +
    context.additionalContext +
    '\n\n' +
    `<vertical_imagery>${context.imageryGuidance}</vertical_imagery>\n` +
    `${colorSection}\n\n` +
    modifiedConstraints +
    brandOverride
  )
}

/**
 * Get vertical context by ID
 */
export function getVerticalContext(
  verticalId: string
): VerticalContext | undefined {
  return VERTICAL_CONTEXTS[verticalId]
}

/**
 * Get all available vertical IDs
 */
export function getAvailableVerticals(): string[] {
  return Object.keys(VERTICAL_CONTEXTS)
}

/**
 * Check if a vertical ID is valid
 */
export function isValidVertical(verticalId: string): boolean {
  return verticalId in VERTICAL_CONTEXTS
}
