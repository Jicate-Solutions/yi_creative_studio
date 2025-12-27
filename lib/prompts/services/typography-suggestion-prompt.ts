/**
 * Typography Suggestion Prompt Builder
 * Generates AI prompts for intelligent font recommendations
 */

import type { TypographyContext } from '@/types/typography-suggestions'

/**
 * Few-shot examples for typography suggestions
 */
export const TYPOGRAPHY_EXAMPLES = [
  {
    input: {
      eventType: 'Blood Donation Camp',
      verticalSlug: 'healthcare',
      formatId: 'event_poster',
      audience: 'General public, all ages',
    },
    output: {
      headingFont: {
        value: 'playfair-display',
        label: 'Playfair Display',
        category: 'serif',
        reason: 'Elegant serif conveys trust and authority crucial for medical messaging',
      },
      bodyFont: {
        value: 'inter',
        label: 'Inter',
        category: 'sans',
        reason: 'Highly legible sans-serif ensures critical medical information is readable',
      },
      scale: 1.1,
      typographySystem: 'Serif-Classical',
      confidence: 0.9,
      tips: [
        'Serif + Sans pairing creates professional medical hierarchy',
        'Scale 1.1× emphasizes urgency of blood donation need',
      ],
    },
  },
  {
    input: {
      eventType: 'Tech Innovation Fest',
      verticalSlug: 'livelihood',
      formatId: 'event_poster',
      audience: 'Young professionals, tech enthusiasts (18-35)',
    },
    output: {
      headingFont: {
        value: 'bebas-neue',
        label: 'Bebas Neue',
        category: 'display',
        reason: 'Bold, all-caps display font creates strong modern tech impact',
      },
      bodyFont: {
        value: 'roboto',
        label: 'Roboto',
        category: 'sans',
        reason: 'Geometric sans-serif aligns with tech industry standards and innovation',
      },
      scale: 1.2,
      typographySystem: 'Display-Impact',
      confidence: 0.85,
      tips: [
        'Display + Sans creates energetic modern hierarchy for tech events',
        'Higher scale (1.2×) captures attention of youth audience',
      ],
    },
  },
  {
    input: {
      eventType: 'Academic Research Seminar on Climate Change',
      verticalSlug: 'education',
      formatId: 'certificate',
      audience: 'Scholars, researchers, academics',
    },
    output: {
      headingFont: {
        value: 'pt-serif',
        label: 'PT Serif',
        category: 'serif',
        reason: 'Traditional academic serif establishes scholarly credibility and formality',
      },
      bodyFont: {
        value: 'lato',
        label: 'Lato',
        category: 'sans',
        reason: 'Clean humanist sans-serif maintains readability for certificate details',
      },
      scale: 0.9,
      typographySystem: 'Serif-Classical',
      confidence: 0.92,
      tips: [
        'Serif + Sans is classic for academic certificates',
        'Lower scale (0.9×) suits formal document with dense text',
      ],
    },
  },
]

/**
 * Build typography suggestion prompt for Claude
 */
export function buildTypographySuggestionPrompt(context: TypographyContext): string {
  const { eventType, verticalSlug, formatId, audience, brandColors, hasSpeakerPhoto } = context

  return `You are a professional typography consultant for Yi CreativeStudio, specializing in event poster design for education, healthcare, livelihood, and sustainability sectors.

AVAILABLE FONTS (48 Total):

**Sans Serif (16 fonts - Clean, Modern, Corporate):**
- inter: Inter - Highly legible, modern, professional, versatile for all contexts (formality: 70)
- dm_sans: DM Sans - Geometric, clean, tech-forward, excellent for UI (formality: 65)
- nunito: Nunito - Rounded, friendly, approachable, warm personality (formality: 50)
- source_sans_pro: Source Sans Pro - Neutral, professional, Adobe's workhorse (formality: 70)
- open_sans: Open Sans - Humanist, friendly, universal, optimized for web (formality: 60)
- roboto: Roboto - Neutral, universal, tech-friendly, Google's geometric sans (formality: 65)
- poppins: Poppins - Geometric, friendly, rounded, approachable for youth (formality: 55)
- montserrat: Montserrat - Urban, bold, modern, inspired by Buenos Aires (formality: 60)
- lato: Lato - Humanist, warm, approachable, semi-rounded letterforms (formality: 65)
- raleway: Raleway - Elegant, thin, sophisticated, large x-height (formality: 70)
- manrope: Manrope - Modern, geometric, clean, designed for digital (formality: 65)
- karla: Karla - Grotesque, compact, efficient, strong personality (formality: 60)
- rubik: Rubik - Rounded, playful, tech-friendly, distinctive (formality: 55)
- barlow: Barlow - Versatile, neutral, professional, wide range of weights (formality: 65)
- cabin: Cabin - Humanist, warm, readable, inspired by Edward Johnston (formality: 60)
- quicksand: Quicksand - Rounded, friendly, geometric, highly legible (formality: 50)

**Serif (13 fonts - Traditional, Elegant, Academic):**
- merriweather: Merriweather - Readable, classical, trustworthy, optimized for screens (formality: 75)
- playfair_display: Playfair Display - High contrast, editorial, elegant, transitional (formality: 85)
- lora: Lora - Contemporary, brushed, refined, calligraphic details (formality: 75)
- pt_serif: PT Serif - Academic, formal, authoritative, designed for body text (formality: 80)
- crimson_text: Crimson Text - Book-like, scholarly, traditional, old-style numerals (formality: 80)
- cormorant: Cormorant - Display serif, classical, elegant, high contrast (formality: 85)
- libre_baskerville: Libre Baskerville - Traditional, readable, scholarly, classic (formality: 80)
- eb_garamond: EB Garamond - Classical, elegant, old-style, Renaissance revival (formality: 85)
- spectral: Spectral - Contemporary, readable, refined, optimized for screens (formality: 75)
- cardo: Cardo - Academic, scholarly, designed for classicists (formality: 85)
- yeseva_one: Yeseva One - Decorative, elegant, Russian-inspired display serif (formality: 75)
- neuton: Neuton - Book serif, classical, readable, inspired by Times (formality: 75)
- philosopher: Philosopher - Geometric serif, unique, philosophical personality (formality: 70)

**Display (12 fonts - Bold, Creative, Headlines):**
- oswald: Oswald - Condensed, bold, impactful, inspired by classic sans (formality: 65)
- bebas_neue: Bebas Neue - All-caps, strong, modern, narrow proportions (formality: 60)
- work_sans: Work Sans - Geometric, versatile, clean, mid-century grotesque (formality: 65)
- syne: Syne - Futuristic, technical, unique, variable font (formality: 60)
- archivo_black: Archivo Black - Heavy, bold, impactful, maximum presence (formality: 60)
- anton: Anton - Bold, condensed, advertising-inspired, strong (formality: 55)
- righteous: Righteous - Retro, bold, 70s-inspired, distinctive (formality: 50)
- exo_2: Exo 2 - Futuristic, geometric, tech-forward, contemporary (formality: 65)
- teko: Teko - Condensed, modern, tech-inspired, space-efficient (formality: 60)
- passion_one: Passion One - Bold, expressive, energetic, attention-grabbing (formality: 50)
- cinzel: Cinzel - Classical, elegant, Roman-inspired, sophisticated (formality: 85)
- abril_fatface: Abril Fatface - Display serif, high contrast, editorial (formality: 80)

**Handwriting (7 fonts - Personal, Friendly, Informal):**
- dancing_script: Dancing Script - Cursive, elegant, celebratory, lively baseline (formality: 30)
- pacifico: Pacifico - Brush script, surfing, playful, retro California vibes (formality: 25)
- caveat: Caveat - Handwritten, casual, authentic, unconnected script (formality: 20)
- great_vibes: Great Vibes - Elegant script, wedding-friendly, flowing (formality: 40)
- satisfy: Satisfy - Casual script, friendly, organic, personal (formality: 25)
- kalam: Kalam - Handwritten, casual, Indian-inspired, authentic (formality: 20)
- permanent_marker: Permanent Marker - Bold marker, informal, energetic (formality: 15)

EVENT CONTEXT:
- Event Type: "${eventType}"
- Vertical: "${verticalSlug}" (healthcare/education/livelihood/sustainability)
- Format: "${formatId}"
- Audience: "${audience || 'General public'}"
${brandColors ? `- Brand Colors: ${brandColors.join(', ')} (consider mood alignment)` : ''}
${hasSpeakerPhoto !== undefined ? `- Has Speaker Photo: ${hasSpeakerPhoto ? 'Yes (layout-heavy, less text focus)' : 'No (text-heavy, more emphasis on typography)'}` : ''}

TYPOGRAPHY PAIRING RULES:
1. **Serif + Sans** is classic and professional (most recommended)
2. **Sans + Sans** is modern and clean (for tech/innovation)
3. **Serif + Serif** can work for luxury/heritage (rare, use carefully)
4. **Display fonts** ONLY for headlines (never body text - readability critical)
5. **Handwriting fonts** only for informal/creative events (personal, celebratory)
6. **Corporate events** → Geometric Sans (Inter, Roboto) for trust and clarity
7. **Healthcare/Medical** → Humanist Sans (Lato) or Classical Serif (Merriweather) for trust
8. **Education/Academic** → Serif headings (PT Serif, Crimson Text) for credibility
9. **Tech/Innovation** → Neo-Grotesque (Roboto, Work Sans) for modernity
10. **Creative/Arts** → Display or Script (Oswald, Dancing Script) for expression

VERTICAL-SPECIFIC GUIDANCE:
- **Healthcare**: Trust, clarity, accessibility → Merriweather/Playfair + Inter/Lato
- **Education**: Credibility, formality, scholarship → PT Serif/Crimson Text + Lato/Roboto
- **Livelihood** (jobs, skills, entrepreneurship): Modern, professional, approachable → Inter/Roboto + Poppins
- **Sustainability** (environment, climate): Natural, trustworthy, urgent → Merriweather/Lora + Inter

FORMAT-SPECIFIC GUIDANCE:
- **Certificate**: Formal serif (PT Serif, Crimson Text) + professional sans (Lato, Inter)
- **Event Poster**: Depends on formality (corporate = serif/sans, youth = display/sans)
- **Instagram/Social**: Bold, attention-grabbing (Bebas Neue, Oswald) + clean sans
- **Flyer**: Balanced, readable (Inter, Roboto) with slight scale boost
- **YouTube Thumbnail**: Maximum impact (Bebas Neue, Oswald) for small screen legibility

SCALE GUIDELINES:
- **0.8-0.9**: Subtle, text-heavy formats (certificates, formal documents, academic papers)
- **1.0**: Standard, balanced (most event posters, flyers, default choice)
- **1.1-1.3**: Energetic, bold statements (youth events, concerts, tech fests)
- **1.4-1.5**: Maximum impact (announcements, urgent calls-to-action, social media)

AGE/AUDIENCE CONSIDERATIONS:
- **Seniors/General public**: Higher readability → Lato, Merriweather, scale 1.0-1.1
- **Youth (18-35)**: Modern, bold → Bebas Neue, Poppins, scale 1.1-1.3
- **Children**: Friendly, rounded → Poppins, Caveat, scale 1.2+
- **Professionals**: Clean, corporate → Inter, Roboto, Raleway, scale 0.9-1.0

FEW-SHOT EXAMPLES (Enhanced with 48-Font Library):

Example 1: Healthcare Event
Input: Blood Donation Camp (healthcare, event_poster, general public)
Analysis:
- Formality: 70-80 (medical context requires trust)
- Mood: Urgent, compassionate, trustworthy
- Font Selection:
  1. Heading: "Playfair Display" (serif, formality 85) - elegant, authoritative
  2. Body: "Inter" (sans, formality 70) - highly readable, neutral
  3. Harmony: Both have medium x-height, compatible stroke structure ✓
  4. Contrast: Serif + Sans provides clear differentiation ✓
  5. Mood Alignment: Classical serif builds trust, clean sans ensures clarity
Output: {
  "headingFont": { "value": "playfair_display", "label": "Playfair Display", "category": "serif", "reason": "Elegant serif with high contrast conveys trust and authority crucial for medical messaging. Formality score 85 matches healthcare context." },
  "bodyFont": { "value": "inter", "label": "Inter", "category": "sans", "reason": "Highly legible sans-serif with high x-height ensures critical medical information is readable. Neutral mood supports urgency." },
  "scale": 1.1,
  "typographySystem": "Serif-Classical",
  "confidence": 0.92,
  "tips": ["Serif + Sans pairing creates professional medical hierarchy with harmony (medium x-height)", "Scale 1.1× emphasizes urgency while maintaining readability"]
}

Example 2: Tech Conference
Input: AI & Future of Work Conference (livelihood, event_poster, young professionals 18-35)
Analysis:
- Formality: 65-75 (professional but modern)
- Mood: Futuristic, innovative, energetic
- Font Selection:
  1. Heading: "Exo 2" (display, formality 65) - futuristic, geometric
  2. Body: "DM Sans" (sans, formality 65) - clean, tech-forward
  3. Harmony: Both geometric, similar formality scores ✓
  4. Contrast: Display boldness vs. clean sans for differentiation ✓
  5. Mood Alignment: Both signal innovation and modernity
Output: {
  "headingFont": { "value": "exo_2", "label": "Exo 2", "category": "display", "reason": "Futuristic geometric display font signals innovation and tech-forward thinking. Formality 65 matches professional tech context perfectly." },
  "bodyFont": { "value": "dm_sans", "label": "DM Sans", "category": "sans", "reason": "Geometric, tech-forward sans-serif with excellent UI readability. Pairs well with Exo 2 (both geometric, similar formality)." },
  "scale": 1.2,
  "typographySystem": "Display-Impact",
  "confidence": 0.88,
  "tips": ["Display + Sans with geometric harmony creates modern tech hierarchy", "Higher scale (1.2×) captures attention of youth audience while maintaining professionalism"]
}

Example 3: Academic Certificate
Input: Academic Research Seminar on Climate Change (education, certificate, scholars/researchers)
Analysis:
- Formality: 80-85 (highly formal academic context)
- Mood: Scholarly, credible, traditional
- Font Selection:
  1. Heading: "EB Garamond" (serif, formality 85) - classical, Renaissance revival
  2. Body: "Source Sans Pro" (sans, formality 70) - neutral, professional
  3. Harmony: Compatible x-heights, both medium stroke contrast ✓
  4. Contrast: Old-style serif + modern sans for classic pairing ✓
  5. Mood Alignment: Classical serif establishes academic credibility
Output: {
  "headingFont": { "value": "eb_garamond", "label": "EB Garamond", "category": "serif", "reason": "Classical old-style serif with Renaissance heritage establishes scholarly credibility. Formality 85 perfect for academic certificates." },
  "bodyFont": { "value": "source_sans_pro", "label": "Source Sans Pro", "category": "sans", "reason": "Neutral professional sans-serif designed for body text. Formality 70 balances formality with readability for certificate details." },
  "scale": 0.9,
  "typographySystem": "Serif-Classical",
  "confidence": 0.94,
  "tips": ["Classical Garamond serif + professional sans is time-tested academic pairing", "Lower scale (0.9×) suits formal document with dense text and metadata"]
}

Example 4: Cultural Festival
Input: Diwali Celebration 2025 (cultural, event_poster, community/families)
Analysis:
- Formality: 50-60 (community event, celebratory)
- Mood: Vibrant, traditional, festive
- Font Selection:
  1. Heading: "Cinzel" (display serif, formality 85) - classical, elegant, Roman-inspired
  2. Body: "Nunito" (rounded sans, formality 50) - friendly, approachable
  3. Harmony: Both medium x-height ✓
  4. Contrast: Classical display + modern rounded sans creates balance ✓
  5. Mood Alignment: Cinzel brings elegance, Nunito keeps it accessible
Output: {
  "headingFont": { "value": "cinzel", "label": "Cinzel", "category": "display", "reason": "Classical Roman-inspired display serif brings elegance and tradition to cultural celebration. High formality signals importance." },
  "bodyFont": { "value": "nunito", "label": "Nunito", "category": "sans", "reason": "Rounded, friendly sans-serif keeps event details approachable for families. Formality 50 balances formality with warmth." },
  "scale": 1.15,
  "typographySystem": "Display-Cultural",
  "confidence": 0.87,
  "tips": ["Classical display serif + friendly rounded sans balances tradition with accessibility", "Medium-high scale (1.15×) creates festive energy for community celebration"]
}

Example 5: Sports Event
Input: Marathon Championship 2025 (sports, event_poster, athletes/general public)
Analysis:
- Formality: 50-55 (energetic, not overly formal)
- Mood: Dynamic, energetic, bold
- Font Selection:
  1. Heading: "Anton" (display, formality 55) - bold, condensed, advertising-inspired
  2. Body: "Barlow" (sans, formality 65) - versatile, neutral, professional
  3. Harmony: Both have normal character width, similar stroke contrast ✓
  4. Contrast: Bold condensed display + neutral sans for clear hierarchy ✓
  5. Mood Alignment: Anton signals energy, Barlow ensures readability
Output: {
  "headingFont": { "value": "anton", "label": "Anton", "category": "display", "reason": "Bold condensed display font creates maximum impact for sports energy. Advertising heritage suits competitive athletics." },
  "bodyFont": { "value": "barlow", "label": "Barlow", "category": "sans", "reason": "Versatile neutral sans-serif with wide weight range ensures readable event details. Professional formality 65 maintains credibility." },
  "scale": 1.3,
  "typographySystem": "Display-Impact",
  "confidence": 0.86,
  "tips": ["Bold condensed display + neutral sans creates dynamic sports hierarchy", "High scale (1.3×) matches athletic energy and outdoor poster viewing distance"]
}

YOUR TASK:
Analyze the event context provided and recommend:
1. **Heading font** (for event title, maximum impact)
2. **Body font** (for details, readability)
3. **Font scale** (0.8-1.5, consider audience and format)
4. **Typography system** category
5. **Confidence score** (0.0-1.0, how confident you are in this recommendation)
6. **Pro tips** (optional, max 2 tips, actionable advice for the user)

CRITICAL REQUIREMENTS:
- Heading and body fonts MUST be different (avoid monotone pairings unless intentional)
- Consider WCAG accessibility (avoid low-contrast pairings, ensure readability)
- Match formality to event type (corporate ≠ playful, medical ≠ casual)
- Cultural sensitivity: Yi serves education, healthcare, livelihood, sustainability (serious missions)
- Scale must be justified (don't default to 1.0 - think about impact needs)
- Tips should be specific and actionable (not generic)

CRITICAL INSTRUCTIONS:
1. You MUST respond with ONLY valid JSON - absolutely NO preamble, explanation, or commentary
2. Do NOT include "I'm ready", "Here's my analysis", or any conversational text
3. Do NOT wrap JSON in markdown code blocks (no \`\`\`json)
4. Your ENTIRE response must be parseable as JSON
5. Start your response IMMEDIATELY with the opening brace {

REQUIRED JSON STRUCTURE (return this exact structure, no modifications):
{
  "headingFont": {
    "value": "font-id",
    "label": "Font Name",
    "category": "sans|serif|display|handwriting",
    "reason": "Why this font for the heading (1-2 sentences, specific to this event)"
  },
  "bodyFont": {
    "value": "font-id",
    "label": "Font Name",
    "category": "sans|serif|display|handwriting",
    "reason": "Why this font for body text (1-2 sentences, specific to readability needs)"
  },
  "scale": 1.0,
  "typographySystem": "System-Name",
  "confidence": 0.0,
  "tips": ["Tip 1", "Tip 2"]
}

Return JSON now (no additional text):`
}

/**
 * Extract font family names for prompt context
 * All 48 fonts available in the library
 */
export function getFontFamilyList(): string[] {
  return [
    // Sans Serif (16 fonts)
    'inter',
    'dm_sans',
    'nunito',
    'source_sans_pro',
    'open_sans',
    'roboto',
    'poppins',
    'montserrat',
    'lato',
    'raleway',
    'manrope',
    'karla',
    'rubik',
    'barlow',
    'cabin',
    'quicksand',
    // Serif (13 fonts)
    'merriweather',
    'playfair_display',
    'lora',
    'pt_serif',
    'crimson_text',
    'cormorant',
    'libre_baskerville',
    'eb_garamond',
    'spectral',
    'cardo',
    'yeseva_one',
    'neuton',
    'philosopher',
    // Display (12 fonts)
    'oswald',
    'bebas_neue',
    'work_sans',
    'syne',
    'archivo_black',
    'anton',
    'righteous',
    'exo_2',
    'teko',
    'passion_one',
    'cinzel',
    'abril_fatface',
    // Handwriting (7 fonts)
    'dancing_script',
    'pacifico',
    'caveat',
    'great_vibes',
    'satisfy',
    'kalam',
    'permanent_marker',
  ]
}

/**
 * Validate font ID against available fonts
 */
export function isValidFontId(fontId: string): boolean {
  return getFontFamilyList().includes(fontId)
}

/**
 * Font label to ID mapping
 * Maps user-friendly labels to their underscore/kebab-case IDs
 * All 48 fonts in the library
 */
const FONT_LABEL_TO_ID_MAP: Record<string, string> = {
  // Sans Serif (16 fonts)
  'Inter': 'inter',
  'DM Sans': 'dm_sans',
  'Nunito': 'nunito',
  'Source Sans Pro': 'source_sans_pro',
  'Open Sans': 'open_sans',
  'Roboto': 'roboto',
  'Poppins': 'poppins',
  'Montserrat': 'montserrat',
  'Lato': 'lato',
  'Raleway': 'raleway',
  'Manrope': 'manrope',
  'Karla': 'karla',
  'Rubik': 'rubik',
  'Barlow': 'barlow',
  'Cabin': 'cabin',
  'Quicksand': 'quicksand',
  // Serif (13 fonts)
  'Merriweather': 'merriweather',
  'Playfair Display': 'playfair_display',
  'Lora': 'lora',
  'PT Serif': 'pt_serif',
  'Crimson Text': 'crimson_text',
  'Cormorant': 'cormorant',
  'Libre Baskerville': 'libre_baskerville',
  'EB Garamond': 'eb_garamond',
  'Spectral': 'spectral',
  'Cardo': 'cardo',
  'Yeseva One': 'yeseva_one',
  'Neuton': 'neuton',
  'Philosopher': 'philosopher',
  // Display (12 fonts)
  'Oswald': 'oswald',
  'Bebas Neue': 'bebas_neue',
  'Work Sans': 'work_sans',
  'Syne': 'syne',
  'Archivo Black': 'archivo_black',
  'Anton': 'anton',
  'Righteous': 'righteous',
  'Exo 2': 'exo_2',
  'Teko': 'teko',
  'Passion One': 'passion_one',
  'Cinzel': 'cinzel',
  'Abril Fatface': 'abril_fatface',
  // Handwriting (7 fonts)
  'Dancing Script': 'dancing_script',
  'Pacifico': 'pacifico',
  'Caveat': 'caveat',
  'Great Vibes': 'great_vibes',
  'Satisfy': 'satisfy',
  'Kalam': 'kalam',
  'Permanent Marker': 'permanent_marker',
}

/**
 * Normalize font ID from various formats to standard kebab-case
 * Handles: labels, capitalized IDs, extra whitespace
 */
export function normalizeFontId(input: string): string | null {
  if (!input || typeof input !== 'string') return null

  // Trim whitespace
  const trimmed = input.trim()

  // Check if already a valid ID (exact match)
  if (isValidFontId(trimmed)) {
    return trimmed
  }

  // Try lowercase (in case Claude returns capitalized ID like "Inter")
  const lowercase = trimmed.toLowerCase()
  if (isValidFontId(lowercase)) {
    return lowercase
  }

  // Try label-to-ID mapping (e.g., "Playfair Display" → "playfair-display")
  if (FONT_LABEL_TO_ID_MAP[trimmed]) {
    return FONT_LABEL_TO_ID_MAP[trimmed]
  }

  // Try case-insensitive label lookup
  const labelKey = Object.keys(FONT_LABEL_TO_ID_MAP).find(
    key => key.toLowerCase() === trimmed.toLowerCase()
  )
  if (labelKey) {
    return FONT_LABEL_TO_ID_MAP[labelKey]
  }

  // No match found
  return null
}
