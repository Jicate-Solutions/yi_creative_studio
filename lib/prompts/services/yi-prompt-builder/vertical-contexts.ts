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
 * Inject vertical-specific context into a base prompt
 * Adds additional guidance, color preferences, and avoidance rules
 */
export function injectVerticalContext(
  basePrompt: string,
  verticalId: string | undefined
): string {
  if (!verticalId) return basePrompt

  const context = VERTICAL_CONTEXTS[verticalId]
  if (!context) return basePrompt

  // Find the constraints section
  const constraintsIndex = basePrompt.indexOf('<constraints>')
  if (constraintsIndex === -1) {
    // No constraints section - append at end
    return (
      basePrompt +
      '\n\n' +
      context.additionalContext +
      `\n<vertical_imagery>${context.imageryGuidance}</vertical_imagery>` +
      `\n<vertical_colors>${context.colorPreferences}</vertical_colors>`
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
    `<vertical_colors>${context.colorPreferences}</vertical_colors>\n\n` +
    modifiedConstraints
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
