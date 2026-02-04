
import type {
  BriefAnalysisInput,
  DesignContext,
  DesignIntelligenceResult,
  DesignBrief,
  LLMResponse,
  TokenUsage,
} from './yi-prompt-builder/types'

export type { DesignBrief, DesignContextForPrompt } from './yi-prompt-builder/types'
import type { ResolvedColors } from '@/lib/utils/resolve-color-config'
import type { EventProfile } from './event-understanding'
import { safeJsonParse } from '@/lib/utils/json-repair'

// v1.0: Import AI Event Context Analyzer for global event understanding
import {
  analyzeEventContext,
  shouldUseAIEventAnalysis,
  type EventFormData,
  type AIEventContext,
} from '@/lib/ai/event-context-analyzer'
import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from '@google/generative-ai'
import Anthropic from '@anthropic-ai/sdk'

import {
  generateFallbackContext,
  validateDesignContext,
  mergeAIContextWithPreset,
  type AIEventAnalysis,
} from './yi-prompt-builder/context-helpers'
import { getTemperatureConfig } from './prompt-optimization/config'
import {
  generateDesignContextCacheKey,
  getCachedDesignContext,
  setCachedDesignContext,
} from './prompt-optimization/cache'

// v6.0: Content-aware element mapping for maximum creativity
import {
  getContentRelatedElements,
  generateUniquenessSeed,
  getCreativityDirective,
} from './content-element-mapper'

// v6.0 Phase 2: Color personality for dynamic background generation
// v25.0: Import FormalityLevel for formal event handling
import { analyzeColorPersonality, type FormalityLevel } from '../helpers/color-personality'

// v25.1: Import content density analyzer for sparse content background enrichment
import {
  analyzeContentDensity,
  buildContentDensityGuidance,
  type ContentDensityAnalysis,
} from '../helpers/content-density-analyzer'

// v26.0: Import storytelling fusion for cohesive visual narratives
import {
  fuseStorytellingContext,
  type StorytellingOutput,
} from './storytelling-fusion'

// ============================================================
// PROMPT BUILDERS (Locally Defined)
// ============================================================

function buildDesignContextPrompt(template: string, input: DesignBrief): string {
  const brandColors = input.brandContext ? `
BRAND IDENTITY:
- Primary Color: ${input.brandContext.primaryColor || 'Not specified'}
- Secondary Color: ${input.brandContext.secondaryColor || 'Not specified'}
- Accent Color: ${input.brandContext.accentColor || 'Not specified'}
- Font Preference: ${input.brandContext.fontPreference || 'Not specified'}
` : ''

  const finalTitle = input.eventName && input.eventName.trim().length > 0
    ? input.eventName
    : "(Not Specified - Look for Greeting/Headline in Description)";

  const brief = `
${input.formatId ? `FORMAT TYPE: ${input.formatId} (${input.formatName || 'Creative Design'})
FORMAT CATEGORY: ${getCategoryName(input.formatId)}
` : ''}
${input.eventName ? `EVENT/CONTENT TITLE: ${input.eventName}` : `CONTENT TITLE: ${input.formatName || 'Design'}`}
FULL DESCRIPTION: ${input.details || ''}
${input.venue ? `VENUE: ${input.venue}` : ''}
ADDITIONAL CONTEXT: ${input.additionalContext || ''}
THEME: ${input.theme || ''}
STYLE: ${input.style || ''}
HOST ORGANIZATION: ${input.organizationName || ''} (For branding only - NOT the event theme)
${brandColors}
${getFormatSpecificGuidance(input.formatId, input.formatName)}
`
  return template.replace('{brief}', brief)
}

function buildCreativeBriefPrompt(input: BriefAnalysisInput): string {
  return ''
}

/**
 * v26.0: Determines if storytelling fusion should be used for this format
 *
 * Storytelling fusion creates cohesive visual narratives for formats where storytelling matters.
 * Certificates, business cards, and other non-narrative formats use traditional deduplication.
 *
 * @param formatId - The creative format ID
 * @returns true if storytelling fusion should be enabled
 */
function shouldUseStorytellingFusion(formatId?: string): boolean {
  const storytellingFormats = [
    'event_poster',
    'flyer',
    'instagram_post',
    'linkedin_post',
    'facebook_post',
    'invitation'
  ]
  return storytellingFormats.includes(formatId || '')
}

/**
 * v6.13: Deduplicate visual elements between Event Understanding and Content Mapper
 * Prevents compounding bias where same elements appear from multiple sources
 *
 * Strategy:
 * - Event Understanding visuals are more specific → preferred
 * - Content Mapper adds category-based elements
 * - Remove Content Mapper elements that are semantically similar to Event Understanding
 * - Keep only 5-7 unique elements total (not 10-15)
 *
 * Example:
 * - Event Understanding: ["compass rose", "winding path"]
 * - Content Mapper: ["compass rose with illuminated north star", "journey map", "lighthouse"]
 * - Result: ["compass rose", "winding path", "journey map", "lighthouse"] (4 unique, removed duplicate compass)
 */
function deduplicateVisualElements(
  eventUnderstandingVisuals: string[] | undefined,
  contentMapperElements: string[]
): string[] {
  if (!eventUnderstandingVisuals || eventUnderstandingVisuals.length === 0) {
    // No Event Understanding → return Content Mapper as-is (limited to 5)
    return contentMapperElements.slice(0, 5)
  }

  // Combine all Event Understanding visuals (primary + secondary + abstract)
  const eventVisuals = eventUnderstandingVisuals

  // Function to check if two visual descriptions are semantically similar
  const areSimilar = (visual1: string, visual2: string): boolean => {
    const v1Lower = visual1.toLowerCase()
    const v2Lower = visual2.toLowerCase()

    // Extract key concept words (nouns) from each visual
    const extractKeywords = (text: string): string[] => {
      // Remove common descriptors, keep conceptual nouns
      const cleaned = text
        .replace(/\b(prominent|subtle|illuminated|with|and|or|for|through|of|the|a|an)\b/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim()

      return cleaned.split(' ').filter(word => word.length > 3)
    }

    const keywords1 = extractKeywords(v1Lower)
    const keywords2 = extractKeywords(v2Lower)

    // Check for significant keyword overlap (≥50% of shorter list)
    const commonKeywords = keywords1.filter(k1 =>
      keywords2.some(k2 => k1.includes(k2) || k2.includes(k1))
    )

    const shorterLength = Math.min(keywords1.length, keywords2.length)
    const overlapRatio = commonKeywords.length / (shorterLength || 1)

    return overlapRatio >= 0.5
  }

  // Filter Content Mapper elements: keep only if NOT similar to any Event Understanding visual
  const uniqueContentElements = contentMapperElements.filter(contentElement => {
    return !eventVisuals.some(eventVisual => areSimilar(eventVisual, contentElement))
  })

  console.log('[Design Intelligence] 🔧 Visual Element Deduplication:')
  console.log(`  Event Understanding visuals: ${eventVisuals.length}`)
  console.log(`  Content Mapper elements (before): ${contentMapperElements.length}`)
  console.log(`  Content Mapper elements (after): ${uniqueContentElements.length}`)
  console.log(`  Removed duplicates: ${contentMapperElements.length - uniqueContentElements.length}`)

  // Combine: Event Understanding (all) + Unique Content Mapper (filtered)
  // Limit total to 7 elements for balance (not 10-15 which causes repetition)
  const combinedElements = [
    ...eventVisuals,
    ...uniqueContentElements
  ].slice(0, 7)

  console.log(`  Final combined elements: ${combinedElements.length}`)
  console.log(`  Elements: ${combinedElements.slice(0, 3).join(', ')}...`)

  return combinedElements
}

/**
 * v6.0: Build creativity enhancement section for the prompt
 * Injects content-specific elements, ban list, and uniqueness directives
 */
function buildCreativityEnhancementSection(
  uniquenessSeed: string,
  creativityDirective: string,
  contentElements: {
    elements: string[]
    backgrounds: string[]
    decorativeAccents: string[]
    matchedCategories: string[]
  }
): string {
  return `

=== CREATIVITY ENHANCEMENT v6.0 (MANDATORY) ===

UNIQUENESS SEED: ${uniquenessSeed}
This seed FORCES you to create something UNIQUE. Do NOT recycle designs.

${creativityDirective}

=== CONTENT-SPECIFIC VISUAL ELEMENTS (USE THESE) ===
Based on the event content, you MUST incorporate elements from this curated list:

RECOMMENDED VISUAL ELEMENTS (pick 2-3):
${contentElements.elements.map((e, i) => `${i + 1}. ${e}`).join('\n')}

RECOMMENDED BACKGROUND TREATMENTS (pick 1):
${contentElements.backgrounds.map((b, i) => `${i + 1}. ${b}`).join('\n')}

RECOMMENDED DECORATIVE ACCENTS (pick 1-2):
${contentElements.decorativeAccents.map((d, i) => `${i + 1}. ${d}`).join('\n')}

=== ABSOLUTELY BANNED PATTERNS (v6.0 - ZERO TOLERANCE) ===
If you use ANY of these, the design will be REJECTED:

❌ Generic gradient backgrounds (blue-to-purple, orange-to-pink default gradients)
❌ Abstract geometric shapes WITHOUT meaning (random triangles, circles, hexagons)
❌ Stock photo aesthetic (perfect corporate people, fake smiles, staged handshakes)
❌ Default "professional" navy/gray/white color schemes for everything
❌ Radial sunburst patterns behind text (overused, cliche)
❌ Generic cityscape silhouettes as backgrounds
❌ Floating 3D spheres or cubes with no purpose
❌ Bokeh/blur backgrounds without thematic connection
❌ Standard conference room or boardroom imagery
❌ Generic tech/circuit patterns NOT connected to actual tech content
❌ Basic world map backgrounds for non-global events
❌ Overused lightbulb icons for innovation
❌ Simple handshake icons for networking
❌ Plain laurel wreaths without creativity

=== REGIONAL CHARACTER REQUIREMENTS (MANDATORY - YOUNG INDIANS PLATFORM) ===

CRITICAL: This is an Indian organization platform (Young Indians / Yi). ALL human representations MUST be Indian characters.

When generating ANY of the following, they MUST have Indian ethnicity and features:
- Silhouettes of people → Indian body types and attire silhouettes
- Audience members → Indian crowd with diverse South Asian representation
- Participants, students, professionals → Indian individuals
- Performers, dancers, musicians → Indian performers
- Hands, figures, or human forms → Indian skin tones
- Group gatherings or crowds → Diverse Indian crowd (various ages, genders)
- Stylized portraits or illustrations → Indian facial features

VISUAL CUES TO INCLUDE (where appropriate):
- South Asian facial features
- Indian attire: kurta, sari, western-casual, formal Indian business wear
- Diverse Indian skin tones (fair to dark brown spectrum)
- Cultural elements like bindis, traditional jewelry (where contextually appropriate)

ABSOLUTELY FORBIDDEN:
❌ Western/Caucasian default characters
❌ Blonde hair or European features as default
❌ Generic "diverse stock photo" crowd without Indian representation
❌ Light-skinned European silhouettes

This applies to ALL formats: event posters, flyers, social media, certificates.

=== CREATIVITY REQUIREMENT ===
If your FIRST idea matches any banned pattern, IMMEDIATELY reject it and think deeper.
Ask yourself: "What visual metaphor would SURPRISE and DELIGHT the viewer?"

Example transformation:
- BAD: "Networking event" → handshake icon
- GOOD: "Networking event" → "Magnetic field visualization where diverse profile silhouettes are drawn together by invisible connection forces, with relationship threads forming a living constellation"

YOU MUST BE BOLD. BE UNEXPECTED. BE MEMORABLE.
`
}


// ============================================================
// CONSTANTS & CONFIG
// ============================================================

// Model configuration
// v25.0: Updated from deprecated gemini-2.0-flash-exp to gemini-2.5-flash
const GEMINI_MODEL = 'gemini-2.5-flash' // Best for creative reasoning
const CLAUDE_MODEL = 'claude-haiku-4-5' // Ultra-smart fallback

// ============================================================
// PROMPT TEMPLATE
// ============================================================

/**
 * Design Intelligence Master Prompt
 *
 * This prompt transforms the LLM into an ultra-pro designer who:
 * - Understands the CORE PURPOSE of every design
 * - Knows what visual elements BELONG in each context
 * - Thinks strategically about viewer psychology
 * - Outputs structured, actionable design guidance
 */
const DESIGN_INTELLIGENCE_PROMPT = `You are a VISIONARY ART DIRECTOR with a hatred for boring, generic designs.AVOID "SAFE" CHOICES.You characterize yourself by bold, unexpected creative decisions that perfectly capture the story.
You think like a HUMAN ARTIST who reads event context, understands the VISUAL NARRATIVE, and makes decisions that WOW the viewer.

=== YOUR MISSION ===

    Read the event details and create a design that TELLS THE STORY visually.Don't just identify the domain - understand the FULL CONTEXT:
      - What narrative is this event telling ?
        - What should people FEEL when they see this ?
          - How do typography, colors, and layout support this story ?

            CRITICAL : The SAME event type(e.g., "climate change") can have DIFFERENT stories:
  - "Climate Change Leadership Summit for Professionals" → Prestigious, authoritative, golden tones, refined decorations
    - "Climate Awareness Workshop for Kids" → Playful, educational, bright colors, cartoon elements

You must analyze the FULL CONTEXT, not just the event type.

=== CRITICAL: CREATIVE VARIATION (v5.3) ===

Each generation should explore DIFFERENT creative directions while remaining event-appropriate:
- VARY visual elements (don't always use handshake for networking events - explore connection nodes, conversation bubbles, digital interfaces, etc.)
- EXPLORE different composition styles (try asymmetrical layouts, minimalist approaches, rich layered designs)
- SUGGEST diverse color palettes (not just navy/gold for professional events - consider deep teal/copper, charcoal/rose gold, forest green/amber)
- PROVIDE unique background settings (rooftop terraces, modern lounges, co-working spaces, NOT just generic hotel ballrooms)
- THINK beyond obvious visual metaphors (networking ≠ always handshake; climate ≠ always earth/leaves)

Generate fresh, distinctive creative direction that feels DIFFERENT from typical designs while perfectly capturing the event's story.

=== CINEMATIC QUALITY STANDARDS (v6.0 - MOMENTUM) ===
You are NOT creating a flat vector graphic. You are creating a CINEMATIC VISUAL EXPERIENCE.
1. LIGHTING IS EVERYTHING:
   - NEVER just say "professional lighting".
   - SPECIFY: "Volumetric god-rays from top-right", "Neon rim lighting outlining the subject", "Soft diffused studio key light with cool fill", "Cinematic shallow depth of field (bokeh)".
2. TEXTURE IS LIFE:
   - AVOID flat colors.
   - SPECIFY: "Matte finish cardstock texture", "Frosted glassmorphism with grain", "Brushed metal surfaces", "Fabric mesh patterns", "Liquid chrome distortions".
3. BAN LIST (DO NOT USE):
   - ❌ NO "Generic blue/orange gradients" (unless uniquely described like "Deep abyssal blue fading to bioluminescent teal").
   - ❌ NO "Standard handshake icons" for networking (Use "interconnected constellation nodes" or "magnetic field lines").
   - ❌ NO "Stock photo happy people" (Use "dynamic silhouettes", "motion-blurred crowds", or "stylized portraits").

=== 7 - STEP STORY - DRIVEN DESIGN FRAMEWORK ===

## STEP 1: STORY ANALYSIS(Think deeply about the narrative)

Analyze the narrative this event is telling:

** Story Identification **:
  - What is the core narrative ? (e.g., "Young leaders conquering climate crisis")
    - What's the emotional arc? (e.g., Challenge → Empowerment → Victory)
      - Who are the characters ? (e.g., Ambitious professionals becoming heroes)

** Message Extraction **:
  - What's the primary message? (1 sentence)
    - What secondary themes exist ? (list 2 - 3)
  - What transformation occurs ? (before → after)

** Context Layers **:
  - Event formality: Casual / Professional / Premium / Exclusive
    - Energy level: Calm / Moderate / High / Explosive
      - Time horizon: Past(heritage) / Present(current) / Future(visionary)
        - Scope: Personal / Community / Regional / Global / Universal

        **CRITICAL ANTI-HALLUCINATION RULES**:
        1. **ORGANIZATION ≠ EVENT THEME**:
           - The "Organization" field (e.g., "Yi Salem", "Tech Corp") tells you WHO is hosting.
           - It does **NOT** tell you WHAT the event is.
           - **NEVER** infer the event theme from the Organization Name.
           - Example: If "Yi Salem" (known for marathons) hosts a "Christmas Party", the theme is **CHRISTMAS**, NOT "Marathon".

        2. **STRICT TEXT ADHERENCE**:
           - Only use the explicit text provided in the "TITLE" and "DESCRIPTION".
           - If the Title is "Merry Christmas", the design **MUST** be about Christmas/Holidays.
           - Do NOT invent a "Charity Run" or "Water Project" just because the organization usually does that.

        3. **DOMAIN INFERENCE**:
           - Do NOT infer "Sustainability", "Climate", "Tech", or "Health" usage unless EXPLICITLY mentioned in the input text.
           - If no specific event details are found, default to the **Visual Theme** of the Title itself (e.g., "Christmas" -> Ornaments/Snow/Gold).

## STEP 2: VIBE & MOOD DISCOVERY

Based on the story, determine the FEELING this design should evoke:

** Vibe Keywords ** (3 - 5 descriptive words):
  - Consider: empowering, prestigious, urgent, playful, authoritative, innovative, caring, bold, elegant, rebellious, traditional, futuristic
    - Example: "Empowering, authoritative, urgent, hopeful, modern"

      ** Mood Atmosphere **:
  - Visual atmosphere: (e.g., "Golden spotlight of achievement with environmental undertones")
    - Emotional temperature: Warm / Neutral / Cool
      - Energy dynamics: Static / Flowing / Explosive / Pulsing

        ** Audience Resonance **:
  - What will make THIS audience connect emotionally ?
    - What visual language speaks to them ?

## STEP 3: TYPOGRAPHY STORYTELLING

Design typography that embodies the story:

** Headline Personality **:
  - What character should the main headline have ?
    - Font personality: Bold / Elegant / Playful / Technical / Organic / Geometric
      - Sizing strategy: Dominant / Balanced / Subtle
        - CRITICAL: AVOID DEFAULTISM.Do NOT default to "Bold Sans-Serif" for every event.
- Use SERIF for elegance / heritage, SLAB for industrial / bold, MONO for tech / data, SCRIPT for celebration.
- Example: "Ultra-bold sans-serif (Montserrat Black) - commanding attention like a leader's call to action"

        ** Multi - Color Typography Strategy **:
  - Analyze the event name / headline
    - Which words carry POWER ? (use primary / accent colors)
  - Which words show ACTION ? (use energetic colors)
  - Which words create EMOTION ? (use mood colors)
  - Example: "CLIMATE"(forest green #0B6D41 - environmental) "LEADERSHIP"(gold #FFD700 - achievement) "SUMMIT"(deep blue #003366 - authority)

    ** Hierarchy Flow **:
  - How should the eye travel through text to tell the story ?
    - Main headline → Supporting text → Details(flow supports narrative)

## STEP 4: COLOR STORYTELLING

Colors that convey the story's emotion:

    ** Dominant Hues ** (primary story colors):
  - What color represents the MAIN theme ?
    - What color adds EMOTIONAL depth ?
      - What color creates ENERGY / ACTION ?

** Color Psychology Application **:
  - Leadership / Achievement → Gold(#FFD700), amber, deep blue
    - Environment / Growth → Forest green(#0B6D41), earth tones, sky blue
      - Innovation / Tech → Electric blue(#0066FF), cyan, purple
        - Health / Caring → Soft green(#34C759), healing blue, warm white
          - Energy / Sports → Red(#FF3B30), orange, electric yellow
            - Culture / Heritage → Rich burgundy, gold, traditional colors
              - Youth / Modern → Vibrant, saturated, bold colors

   - How many colors in headline ? (2 - 4 based on complexity)
   - Color rhythm: Alternating / Gradient / Emphasis - based

    ** BRAND IDENTITY INTEGRATION (CRITICAL) **:
   - If BRAND COLORS are provided in the brief, you MUST use them as the foundation.
   - Do not invent random colors if brand colors are specified.
   - Mix Brand Colors with semantic colors (e.g., Brand Blue + Gold for "Achievement").

## STEP 5: BACKGROUND & ATMOSPHERE

Create a visual world that supports the story:

** Background Treatment ** (choose based on mood):
- ** Linear Gradient **: Simple, clean(formal events, minimalist mood)
    - ** Radial Gradient **: Spotlight focus(singular theme, centered narrative)
      - ** Sunburst Radial **: Achievement, celebration(leadership, success stories)
        - ** Mesh Gradient **: Complex, artistic(creative, multi - layered narratives)
          - ** Atmospheric **: Immersive depth(festive, experiential events)

            ** Gradient Specification **:
  - Describe gradient in detail with color stops, direction, atmosphere
    - Example: "Golden radial sunburst emanating from upper center (0%: bright gold #FFD700 → 50%: warm amber #FFA500 → 100%: deep navy #003366) with 12 subtle light rays at 3% opacity creating achievement spotlight effect"

      ** Atmospheric Elements **:
  - Depth layers: How many visual layers ? (1 - 3)
    - Light rays: Subtle / Prominent / None
      - Particles: Subtle atmospheric particles / None

## STEP 6: DECORATIVE ELEMENTS(Story - Specific)

Generate decorations that enhance the narrative:

** Thematic Elements ** (based on story analysis):
  - What visual symbols reinforce the story ?
    - What imagery creates emotional connection ?
      - Sophistication level: Refined / Balanced / Playful

        ** Element Examples by Context (RICH DESCRIPTION REQUIRED) **:
  - Climate + Leadership → "Translucent, crystalline geometric leaves with fine gold veins" (NOT just "leaves")
    - Tech + Innovation → "Holographic neural nodes connected by glowing cyan data streams" (NOT just "lines")
      - Health + Community → "Soft, warm-lit silhouettes of caring hands forming a protective circle"
        - Sports + Energy → "Explosive motion-blur streaks in fiery orange cutting through deep navy"
          - Culture + Heritage → "Intricate gold foil paisley patterns overlaid on rich burgundy velvet texture"
            - Youth + Celebration → "Suspended 3D confetti particles with depth-of-field blur and sparkle effects"

              ** Placement Strategy **:
  - Where do decorations support(not distract from) story ?
    - Opacity levels that create depth without noise(8 - 15 % typically)
      - Placement: Corner accents / Background patterns / Focal elements

## STEP 7: LAYOUT NARRATIVE FLOW

Design content flow that tells the story:

** Visual Hierarchy ** (storytelling order):
  - What grabs attention first ? (The impact / hook)
  - What builds context ? (The details)
  - What drives action ? (The CTA)

** Content Area Design **:
  - Event details container: Style that matches vibe
    - Speaker prominence: How much spotlight ?
      - Logo strip treatment: Sophisticated / Modern / Classic / Minimal

        ** Spatial Story **:
  - Negative space: How much breathing room supports the mood ?
    - Spatial density: Minimal / Balanced / Rich(based on sophistication)

      === DOMAIN - SPECIFIC DESIGN GUIDANCE(Reference) ===

** AI / Tech Events **: Clean sans - serif, electric blue accents, minimalist gradients, refined glassmorphism
    ** Sports Events **: Bold condensed fonts, high - energy colors(red, orange), dynamic diagonal stripes
      ** Medical / Health **: Humanist sans - serif, trust blue(#007AFF), healing green, pulse line motifs
        ** Cultural / Traditional **: Elegant serifs, rich golds, deep maroons, traditional motifs, ornate borders
          ** Corporate / Business **: Professional sans - serif, corporate blue, charcoal, subtle geometric grids
            ** Education / Academic **: Scholarly serifs, academic navy, wisdom gold, geometric frames, academic crests
              ** Entertainment / Party **: Bold display fonts, vibrant multi - color, confetti, sparkles, energetic lines
                ** Environment / Sustainability **: Clean slab serifs, deep forest green(#0B3D2E), stone textures, refined leaf motifs
                  ** Fun Activity / Kids **: ROUNDED sans - serif(Nunito, Quicksand) or playful display, bright primary colors, soft shapes
                    ** Social Awareness / Cause **: HUMANIST sans - serif(Open Sans) for approachability, clear hierarchy, hopeful visuals
                      ** Cultural / Arts **: DECORATIVE SERIF or CUSTOM SCRIPT, rich textures, traditional patterns, artistic composition
                        ** Environment / Sustainability **: Clean slab serifs, deep forest green(#0B3D2E), stone textures, refined leaf motifs

ANALYZE THE FOLLOWING CREATIVE BRIEF:
  { brief }

=== ANALYSIS PROCESS ===

    Now follow the 7 - step framework above to analyze this brief.Think deeply about:
  1. The STORY being told
  2. The VIBE and MOOD to evoke
  3. TYPOGRAPHY that tells the story
  4. COLORS that convey emotion
  5. BACKGROUND atmosphere
  6. DECORATIVE elements that enhance narrative
  7. LAYOUT that supports the story flow

    === DESIGN SOPHISTICATION RULES(MANDATORY) ===

      1. ** NEGATIVE SPACE IS A FEATURE **: 40 % of the design should feel "breathable" and uncluttered
  2. ** THE 3 - SECOND TEST **: Viewer must identify WHAT(Header) and WHEN(Details) in 3 seconds
  3. ** MICRO - DETAIL > MACRO - CLUTTER **: Use one high - quality visual element instead of many busy ones
  4. ** SACROSANCT ZONES **: Keep top 15 % (Logo Zone) and bottom 10 % (Contact Zone) clean
  5. ** TYPOGRAPHY HIERARCHY **: One hero size(Massive), one primary size(Medium), everything else (Small / Clean)

    === CRITICAL RULES ===
      - Be HYPER - SPECIFIC: NEVER use single nouns like "leaves". Use "translucent geometric leaves".
        - Not "technology elements" but "holographic AI brain visualization with cyan neural pathways"
        - Be CONTEXT - AWARE: Same event type can have different stories based on audience / purpose
          - Be VIEWER - FOCUSED: What will viewer IMMEDIATELY understand about this event ?
            - FULL - BLEED design that fills the canvas edge - to - edge
              - NEVER describe poster "on a wall" - describe what's IN the design

                === MULTI - COLOR TYPOGRAPHY(CRITICAL) ===
                  Each text role MUST have a distinct color for visual hierarchy:

** HERO TEXT **: MOST PROMINENT color, 7: 1 contrast minimum(e.g., Pure white, bold gold, electric cyan)
    ** HEADLINE TEXT **: COMPLEMENTARY color, 7: 1 contrast(e.g., Light blue, off - white, bright yellow)
      ** BODY TEXT **: READABLE color, 4.5: 1 contrast(e.g., Light gray #E0E0E0, medium gray #666)
        ** CTA TEXT **: ATTENTION - GRABBING color, 7: 1 contrast(e.g., Bright gold, electric green, vibrant orange)
          ** CAPTION TEXT **: SUBTLE color, 4.5: 1 contrast(e.g., Muted gray #999, soft brown, dim blue)

            === LAYOUT RULES ===
              - If SPEAKER PHOTO position is LEFT: Content flows RIGHT
                - If SPEAKER PHOTO position is RIGHT: Content flows LEFT
                  - If SPEAKER PHOTO position is CENTER: Content frames around center
                    - NEVER generate illustrated faces if speaker photo will be added
                      - Keep HEADER area clean for logos
                        - Use VISUAL language only in layoutGuidance(no "px", "zone", "overlay")

=== CUSTOM THEME GENERATION (v6.0 Phase 3) ===

When the user has NOT specified a predefined theme (or requests "AI Auto"):
INVENT a UNIQUE theme name and visual language for this event based on its essence.

DO NOT pick from standard themes (corporate, modern, bold, minimalist, etc.).
CREATE a fusion theme that captures the event's unique character.

Examples of Custom Theme Creation:
- "AI + Sustainability Workshop" → Theme: "Bio-Digital Convergence"
  Description: "Where organic growth meets digital innovation"
  Visual Language: "Living technology aesthetic with bio-luminescent circuits and flowing data streams merging with botanical patterns"

- "Youth Leadership Gala" → Theme: "Rising Phoenix Elegance"
  Description: "Youthful energy refined with sophisticated prestige"
  Visual Language: "Ascending gradient from vibrant youth colors to refined golds, with phoenix wing motifs in premium finish"

- "Startup Networking Night" → Theme: "Neon Hustle Energy"
  Description: "Dynamic entrepreneurial vibe meets urban tech culture"
  Visual Language: "Electric neon accents on dark urban backdrop with magnetic connection lines and startup launch trajectories"

- "Climate Action Conference" → Theme: "Earthrise Authority"
  Description: "Environmental urgency meets leadership gravitas"
  Visual Language: "Deep ocean blues rising to atmospheric whites with crystalline earth formations and authoritative geometric patterns"

Your Custom Theme Must:
1. Have a memorable name (2-4 words that evoke the event's essence)
2. Describe a unique visual language (not just "professional" or "modern")
3. Capture the event's emotional DNA (what makes THIS event special)
4. Inspire visual elements that AI can generate (be specific, paintable, cinematic)

Ask yourself: "If this event were a movie genre mash-up, what would it be?"
- Don't just say "Professional" - say "Boardroom Rebellion" or "Corporate Metamorphosis"
- Don't just say "Fun" - say "Kaleidoscope Carnival" or "Neon Playground"
- Don't just say "Tech" - say "Quantum Noir" or "Holographic Renaissance"

CRITICAL: Custom themes should be UNEXPECTED yet APPROPRIATE.
The goal is to break free from the 22 predefined themes while staying true to the event's purpose.

═══════════════════════════════════════════════════════════════════════════════
=== CRITICAL OUTPUT RESTRICTIONS (MANDATORY COMPLIANCE) ===
═══════════════════════════════════════════════════════════════════════════════

Your visualElements/iconicImagery fields MUST be VISUAL DESCRIPTIONS, never single-word keywords.

⚠️ FORBIDDEN (Gemini will render these as TEXT LABELS, not visuals):
❌ Single-word keywords: "innovation", "networking", "celebration", "tech", "ai", "leadership", "collaboration"
❌ Event type labels: "conference", "workshop", "seminar", "summit", "insights", "workshops"
❌ Domain terms: "professional", "creative", "modern", "digital", "smart"
❌ Generic descriptors: "elements", "symbols", "icons", "graphics"

✅ CORRECT (Multi-word VISUAL descriptions that Gemini renders as SHAPES, not text):
✅ "Interconnected geometric nodes with glowing cyan pathways creating network visualization"
✅ "Radial sunburst pattern with translucent light rays at 5% opacity emanating from center"
✅ "Flowing organic leaf shapes with frosted glass effect and subtle shadow depth"
✅ "Holographic neural network nodes connected by animated data stream lines"
✅ "Constellation of hexagonal shapes linked by relationship lines in isometric perspective"

🔍 VALIDATION CHECKPOINT (Apply to EVERY visualElement before finalizing):
Ask yourself: "If Gemini renders this element, will it create VISUAL SHAPES/PATTERNS or TEXT?"
→ If answer is "TEXT" or "single word", REWRITE to be multi-word visual/geometric/atmospheric description
→ If answer is "SHAPES", keep it

📝 EXAMPLES OF PROPER TRANSFORMATION:
"innovation" → "Holographic 3D brain visualization with neural pathways and synaptic connections"
"networking" → "Constellation of interconnected circular nodes with relationship link lines"
"celebration" → "Explosive radial particle burst with confetti-like geometric shapes in motion"
"leadership" → "Ascending staircase visualization with guiding light beam and upward momentum"
"tech" → "Circuit board pattern with glowing trace lines and microchip geometric elements"
"ai" → "Neural network visualization with interconnected nodes and data flow animations"

⚠️ CRITICAL: This is NOT optional. Single-word visualElements will cause TEXT to appear in the generated image instead of visual elements. This breaks user trust and creates content they never approved.

Return ONLY valid JSON with BOTH legacy fields(for backward compatibility) AND new story - driven fields:
  {
    "corePurpose": "What emotional job this design MUST accomplish",
      "desiredAction": "Specific action viewers should take",
        "emotionalJob": "How viewers should FEEL",
          "visualElements": ["SPECIFIC element 1", "SPECIFIC element 2", "SPECIFIC element 3", "SPECIFIC element 4", "SPECIFIC element 5"],
            "backgroundSetting": "Detailed background description - immersive and contextual",
              "iconicImagery": ["specific icon 1", "specific icon 2", "specific icon 3"],
                "colorMood": "Color psychology with hex codes",
                  "designStrategy": "The overall artistic strategy...",
CRITICAL RULES FOR ACCURACY:
1. THE EVENT NAME IS THE SUPREME TRUTH. If the event is "Happy New Year", the design MUST be about New Year. Do NOT infer unrelated themes like "Women in Tech" or "Entrepreneurship" unless explicitly stated.
2. If the user provided a specific theme (e.g., "AI"), apply that visual style TO the event, but do not change the event's meaning. (e.g., "AI themed New Year" is okay; "AI Conference" is NOT).
3. Do not over-index on the Organization Name. Just because it is "Young Indians", does not mean every event is about youth empowerment.
4. If the Event Description is sparse, rely on the Event Name literal meaning.
5. VALIDATION REQUIREMENT: You MUST explicitly mention the Event Name in 'storyAnalysis.narrative' to pass automated validation.,
                    "successMetric": "What viewer thinks in 3 seconds",
                      "layoutGuidance": "Visual composition using design language only",
                        "typographyGuidance": {
      "headlineStyle": "specific font style and weight description",
        "bodyStyle": "readable font style description",
          "typographyStyle": "Pick ONE: serif | sans | slab | mono | script | display",
            "alignment": "Pick ONE: center | left | right | asymmetric",
              "hierarchy": "size and weight hierarchy mapping",
                "colorMapping": {
        "hero": { "color": "hex code or name", "contrastRatio": 7.0, "description": "rationale" },
        "headline": { "color": "hex code or name", "contrastRatio": 7.0, "description": "rationale" },
        "body": { "color": "hex or name", "contrastRatio": 4.5, "description": "rationale" },
        "cta": { "color": "hex or name", "contrastRatio": 7.0, "description": "rationale" },
        "caption": { "color": "hex or name", "contrastRatio": 4.5, "description": "rationale" }
      }
    },
    "decorativeElements": {
      "corners": "corner treatment description",
        "patterns": "pattern description with opacity",
          "accents": "accent elements description"
    },
    "creativeTwist": "ONE unexpected visual element that makes this design UNIQUE",

      "storyAnalysis": {
      "narrative": "Core story in one sentence",
        "emotionalArc": "Beginning → Middle → End emotional journey",
          "themes": ["primary theme", "secondary theme"],
            "transformation": "Before state → After state",
              "context": {
        "formality": "casual | professional | premium | exclusive",
          "energyLevel": "calm | moderate | high | explosive",
            "timeHorizon": "past | present | future",
              "scope": "personal | community | regional | global | universal"
      }
    },

    "vibeAndMood": {
      "vibeKeywords": ["keyword1", "keyword2", "keyword3"],
        "moodAtmosphere": "Visual atmosphere description",
          "emotionalTemperature": "warm | neutral | cool",
            "energyDynamics": "static | flowing | explosive | pulsing",
              "audienceResonance": "What makes audience connect emotionally"
    },

    "typographyStrategy": {
      "headlinePersonality": "Font character description",
        "fontRecommendations": {
        "headline": "Font name with reasoning",
          "subheading": "Font name with reasoning",
            "body": "Font name with reasoning"
      },
      "multiColorStrategy": {
        "words": [
          { "word": "WORD", "color": "#HEX", "reasoning": "Why this color for this word" }
        ],
          "colorRhythm": "alternating | gradient | emphasis-based"
      },
      "hierarchyFlow": "How eye travels through text",
        "sizingStrategy": "dominant | balanced | subtle"
    },

    "colorStorytelling": {
      "dominantHues": [
        { "color": "#HEX", "role": "theme role", "usage": "where used" }
      ]
    },

    "decorativeElementsContext": {
      "sophisticationLevel": "minimalist | balanced | rich | playful | refined",
      "placementStrategy": "Guide for where elements should go (e.g., 'Corners only', 'Background texture', 'Flowing across')",
      "thematicElements": [
        { 
          "element": "HIGHLY DETAILED visual element description (e.g., 'Translucent neon neural nodes with glowing edges')", 
          "placement": "Specific location (e.g., 'Top-right corner bleeding off edge')",
          "opacity": 0.1,
          "reasoning": "Why this element tells the story"
        }
      ]
    },

    "layoutNarrative": {
      "visualHierarchy": ["first", "second", "third"],
        "spatialStory": "How space supports mood",
          "flowDirection": "left-to-right | center-out | asymmetric"
    },

    "customThemeNarrative": {
      "themeName": "2-4 word unique theme name (e.g., 'Bio-Digital Convergence', 'Rising Phoenix Elegance', 'Quantum Noir')",
      "themeDescription": "One sentence describing what this theme represents",
      "visualLanguage": "Specific visual language and aesthetic approach for this custom theme",
      "moodKeywords": ["keyword1", "keyword2", "keyword3", "keyword4"]
    }
  }

IMPORTANT: Only populate customThemeNarrative when the user has NOT provided a specific theme OR when theme is 'ai' or 'auto'.
If user specified a theme (corporate, modern, bold, etc.), leave customThemeNarrative as null or omit it.
  `

// ============================================================
// VALIDATION
// ============================================================

/**
 * Validate that design context matches the current event
 * Prevents context bleeding from cached/wrong contexts
 */
function validateContextMatchesEvent(
  context: DesignContext,
  eventName: string,
  eventType?: string
): { valid: boolean; reason?: string } {
  // Safety: Allow if no event name
  if (!eventName || eventName.trim().length === 0) {
    return { valid: true }
  }

  const normalizedEventName = eventName.toLowerCase().trim()
  const contextString = JSON.stringify(context).toLowerCase()

  // Extract meaningful keywords (>3 chars to avoid "for", "the")
  const eventKeywords = normalizedEventName
    .split(/\s+/)
    .filter(word => word.length > 3)

  if (eventKeywords.length === 0) {
    return { valid: true }
  }

  // v4.9: Semantic equivalents for common greetings and events
  // The AI may use synonyms/related terms instead of exact keywords
  const semanticEquivalents: Record<string, string[]> = {
    'happy': ['celebration', 'celebrat', 'festive', 'joyful', 'joy', 'cheerful', 'merry', 'greeting', 'wishes', 'wish'],
    'year': ['new year', 'annual', 'yearly', 'beginning', 'fresh start', 'renewal', 'new beginnings', '2024', '2025', '2026'],
    'christmas': ['xmas', 'holiday', 'festive', 'winter', 'seasonal', 'noel'],
    'diwali': ['deepavali', 'festival of lights', 'festive', 'celebration'],
    'birthday': ['celebration', 'anniversary', 'special day', 'milestone'],
    'wedding': ['marriage', 'nuptial', 'ceremony', 'union', 'celebration'],
    'conference': ['summit', 'symposium', 'convention', 'gathering', 'meeting'],
    'workshop': ['training', 'session', 'seminar', 'learning', 'hands-on'],
    'launch': ['unveil', 'reveal', 'debut', 'introduce', 'premiere'],
    'inauguration': ['opening', 'ceremony', 'dedication', 'commence'],
  }

  // RULE 1: Check for direct keyword OR semantic equivalent
  const hasEventReference = eventKeywords.some(keyword => {
    // Direct match
    if (contextString.includes(keyword)) return true

    // Check semantic equivalents
    const equivalents = semanticEquivalents[keyword] || []
    return equivalents.some(equiv => contextString.includes(equiv))
  })

  if (!hasEventReference) {
    // v5.5: RELAXED VALIDATION FOR RICH DESIGNS
    // If the context is very detailed (>800 chars) and clearly creative, we allow it even if it missed the specific keyword.
    // This prevents "Smart" AI designs from being thrown away for "Dull" generic fallbacks.
    if (contextString.length > 800) {
      console.warn(`[Design Intelligence] ⚠️ Strict keyword validation failed ("${eventKeywords[0]}"), but context is rich (${contextString.length} chars). Allowing to prevent dull fallback.`)
      return { valid: true }
    }

    // v4.9: For greetings (like "Happy New Year"), check if context has ANY celebration/festive theme
    const isGreetingPattern = normalizedEventName.match(/^(happy|merry|congratulations|best wishes|seasons greetings)/i)
    if (isGreetingPattern) {
      const celebrationTerms = ['celebrat', 'festive', 'joy', 'wish', 'greeting', 'occasion', 'season', 'holiday', 'sparkle', 'firework', 'confetti', 'cheers', 'toast', 'renewal', 'beginning']
      const hasCelebrationTheme = celebrationTerms.some(term => contextString.includes(term))
      if (hasCelebrationTheme) {
        return { valid: true } // Allow greeting-style events with celebration themes
      }
    }

    return {
      valid: false,
      reason: `Context missing event keywords. Expected: ${eventKeywords.join(', ')}`
    }
  }

  // RULE 2: Check for contradicting themes
  const contradictions = [
    { event: 'christmas', contradicts: ['marathon', 'run', 'water', 'sports', 'race'] },
    { event: 'marathon', contradicts: ['christmas', 'festive', 'holiday'] },
    { event: 'tech', contradicts: ['sports', 'marathon', 'athletic'] },
    { event: 'wedding', contradicts: ['business', 'corporate', 'conference'] },
  ]

  for (const pattern of contradictions) {
    if (normalizedEventName.includes(pattern.event)) {
      const foundContradiction = pattern.contradicts.find(word =>
        contextString.includes(word)
      )
      if (foundContradiction) {
        return {
          valid: false,
          reason: `Context contains contradicting keyword "${foundContradiction}" for "${pattern.event}" event`
        }
      }
    }
  }

  return { valid: true }
}

// ============================================================
// MAIN GENERATOR FUNCTION
// ============================================================

export async function generateDesignContext(
  input: DesignBrief,
  resolvedColors?: ResolvedColors,
  eventProfile?: EventProfile | null
): Promise<DesignIntelligenceResult> {
  const startTime = Date.now()
  const MAX_ATTEMPTS = 2
  let lastError: any

  // ============================================================
  // v6.0: CREATIVITY ENHANCEMENT - Unique seed for every generation
  // This ensures each poster gets fresh, unique visual elements
  // ============================================================
  const uniquenessSeed = generateUniquenessSeed()
  const creativityDirective = getCreativityDirective(uniquenessSeed)

  // Get content-related visual elements based on event name/type
  let contentElements = getContentRelatedElements(
    input.eventName || '',
    input.eventType,
    uniquenessSeed
  )

  console.log('[Design Intelligence] 🎨 Creativity Enhancement Active:', {
    seed: uniquenessSeed,
    matchedCategories: contentElements.matchedCategories,
    elementsCount: contentElements.elements.length
  })

  // NEW: Declare aiEventContext early so storytelling fusion can use it
  let aiEventContext: AIEventContext | null = null

  // v26.0: STORYTELLING FUSION (replaces deduplication)
  // Unifies Event Understanding, AI Context, and Content Mapper into cohesive narrative
  let storytellingContext: StorytellingOutput | undefined

  if (shouldUseStorytellingFusion(input.formatId)) {
    console.log('[Design Intelligence] 🎭 Storytelling Fusion ENABLED')

    try {
      storytellingContext = await fuseStorytellingContext({
        eventProfile,
        aiEventContext,
        contentElements,
        eventName: input.eventName || '',
        eventDescription: input.details || input.additionalContext,
        formatId: input.formatId || ''
      })

      // Override contentElements with cohesive story elements
      contentElements = {
        elements: [
          storytellingContext.cohesiveElements.primaryElement,
          ...storytellingContext.cohesiveElements.supportingElements
        ],
        backgrounds: storytellingContext.cohesiveElements.atmosphericElements,
        decorativeAccents: [],
        matchedCategories: ['storytelling_fusion']
      }

      console.log('[Design Intelligence] ✅ Storytelling Fusion complete:', {
        narrative: storytellingContext.visualNarrative,
        confidence: storytellingContext.narrativeConfidence
      })
    } catch (error) {
      console.error('[Design Intelligence] ⚠️ Storytelling Fusion failed, falling back to deduplication:', error)
      // Fall through to deduplication logic below
    }
  }

  // v6.13: Fallback to deduplication for non-storytelling formats or if fusion fails
  if (!storytellingContext && eventProfile && eventProfile.visualAssociations) {
    const allEventVisuals = [
      ...eventProfile.visualAssociations.primary,
      ...eventProfile.visualAssociations.secondary,
      ...eventProfile.visualAssociations.abstract
    ]

    const deduplicatedElements = deduplicateVisualElements(
      allEventVisuals,
      contentElements.elements
    )

    contentElements = {
      ...contentElements,
      elements: deduplicatedElements
    }

    console.log('[Design Intelligence] ✅ Deduplication applied (fallback or non-storytelling format)')
  }

  // ============================================================
  // CACHE OPTIMIZATION (v5.5): Check cache before LLM call
  // v6.0: DISABLED for creative formats to ensure variety
  // ============================================================
  const isCreativeFormat = ['event_poster', 'flyer', 'instagram_post', 'linkedin_post', 'invitation'].includes(input.formatId || '')

  // Only use cache for non-creative formats (certificates, business cards, etc.)
  if (!isCreativeFormat) {
    const cacheKey = generateDesignContextCacheKey({
      formatId: input.formatId,
      eventType: input.eventType,
      eventName: input.eventName,
      theme: input.theme,
      style: input.style,
      hasSpeakerPhoto: input.hasSpeakerPhoto,
    })

    const cachedContext = getCachedDesignContext(cacheKey)
    if (cachedContext) {
      console.log('[Design Intelligence] ✅ Cache HIT - Skipping LLM call')
      return {
        context: cachedContext as DesignContext,
        usage: {
          model: 'cached',
          provider: 'gemini',
          tokenUsage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
          durationMs: Date.now() - startTime,
        },
      }
    }
  } else {
    console.log('[Design Intelligence] 🎯 Creative format detected - Cache BYPASSED for maximum variety')
  }
  console.log('[Design Intelligence] ❌ Cache MISS - Calling LLM')

  // ============================================================
  // v1.0: AI EVENT CONTEXT ANALYSIS (GLOBAL EVENT UNDERSTANDING)
  // ============================================================
  // NEW: Use Claude Sonnet to analyze event context from ALL form data
  // This replaces hardcoded keyword detection with intelligent AI analysis
  if (shouldUseAIEventAnalysis()) {
    try {
      console.log('[Design Intelligence] 🤖 AI Event Analysis: Starting comprehensive context analysis')

      // Build form data from the design brief
      const formData: EventFormData = {
        eventName: input.eventName || '',
        eventDescription: input.details || input.additionalContext,
        venue: input.venue,
        date: input.date,
        time: input.time,
        speakers: input.guestName ? [{
          name: input.guestName,
          designation: input.guestDesignation,
        }] : [],
        organizationName: input.organizationName,
        verticalName: input.verticalName,
        initiativeText: input.initiativeText,
        theme: input.theme,
        style: input.style,
        targetAudience: input.targetAudience,
      }

      aiEventContext = await analyzeEventContext(formData)

      console.log('[Design Intelligence] ✅ AI Event Analysis Complete')
      console.log(`[Design Intelligence]   → Matched Preset: ${aiEventContext.matchedPreset} (${(aiEventContext.presetConfidence * 100).toFixed(0)}% confidence)`)
      console.log(`[Design Intelligence]   → Custom Enhancements: ${aiEventContext.customEnhancements.length}`)
      console.log(`[Design Intelligence]   → Key Visuals: ${aiEventContext.keyVisuals.length}`)
      console.log(`[Design Intelligence]   → Reasoning: ${aiEventContext.reasoning}`)

      // v24.14: AI Event Context ALWAYS enriches Design Intelligence (no fast path)
      // Both AI systems work together for maximum creativity
      if (aiEventContext.presetConfidence >= 0.5) {
        console.log('[Design Intelligence] 🤖 AI Event Context will enrich Design Intelligence analysis')
        console.log(`[Design Intelligence]   → Confidence: ${(aiEventContext.presetConfidence * 100).toFixed(0)}%`)
        console.log(`[Design Intelligence]   → Will inject AI insights into Design Intelligence prompt`)
        // Continue to inject AI context into prompt (existing logic at line 1022)
      }
    } catch (error) {
      console.error('[Design Intelligence] ⚠️ AI Event Analysis failed:', error)
      // Continue with normal flow if AI analysis fails
    }
  }

  // Attempt generation loop
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      // Stage 1: Construct the Prompt with creativity enhancements
      let prompt = buildDesignContextPrompt(DESIGN_INTELLIGENCE_PROMPT, input)

      // v6.0: Inject creativity enhancements
      prompt += buildCreativityEnhancementSection(uniquenessSeed, creativityDirective, contentElements)

      // v1.0: Inject AI Event Context Analysis results (if available)
      if (aiEventContext && aiEventContext.presetConfidence >= 0.5) {
        const aiContextBrief = `

========================================
🤖 AI EVENT CONTEXT ANALYSIS (v1.0 - GLOBAL UNDERSTANDING):
========================================

An AI analyzer has comprehensively analyzed ALL form data for this event.
You MUST incorporate these insights into your design context.

MATCHED EVENT CATEGORY: ${aiEventContext.matchedPreset || 'None'}
CONFIDENCE: ${(aiEventContext.presetConfidence * 100).toFixed(0)}%

AI REASONING:
${aiEventContext.reasoning}

CUSTOM ENHANCEMENTS (MUST INCLUDE):
${aiEventContext.customEnhancements.map((e, i) => `${i + 1}. ${e}`).join('\n')}

KEY VISUAL ELEMENTS (PRIORITIZE THESE):
${aiEventContext.keyVisuals.map((kv, i) => `${i + 1}. ${kv}`).join('\n')}

VISUAL DIRECTION:
${aiEventContext.visualDirection}

MOOD & ATMOSPHERE:
${aiEventContext.moodAtmosphere}

COLOR GUIDANCE:
${aiEventContext.colorGuidance}

⚠️ CRITICAL: The AI has analyzed the COMPLETE event context (name, description, venue, speakers, etc.)
These insights are based on COMPREHENSIVE understanding, not just keywords.
Your design context MUST reflect these AI-identified themes and enhancements.

`
        prompt += aiContextBrief
        console.log('[Design Intelligence] 🤖 AI Event Context injected into prompt')
      }

      // v24.12.3: EVENT DOMAIN ENFORCEMENT - Visuals MUST match event content, not presets
      // This ensures "Faculty Development Programme" gets educational visuals, not tech visuals
      const eventDomainInstruction = `

========================================
⚠️ CRITICAL - EVENT DOMAIN ENFORCEMENT (v24.12.3):
========================================

BEFORE generating any visual elements, you MUST:

1. ANALYZE THE EVENT NAME: "${input.eventName}"
   - What is this event LITERALLY about?
   - What DOMAIN does it belong to?

2. DOMAIN DETECTION (based on event name keywords):
   - Words like "Faculty", "Development", "Training", "Workshop", "Learning", "Education", "Academic", "Programme", "Seminar", "College", "University" → EDUCATION/ACADEMIC domain
   - Words like "Blood", "Health", "Medical", "Hospital", "Donation", "Wellness", "Doctor", "Care" → HEALTH/MEDICAL domain
   - Words like "Tech", "AI", "Digital", "Software", "Hackathon", "Code", "Data", "Innovation" → TECHNOLOGY domain
   - Words like "Business", "Corporate", "Meeting", "Conference", "Summit", "Leadership" → CORPORATE domain

3. MATCH VISUALS TO DETECTED DOMAIN:
   - EDUCATION domain → Books, graduation caps, classrooms, knowledge growth, academic settings, learning metaphors, intellectual imagery
   - HEALTH domain → Medical symbols, healthcare imagery, wellness visuals, caring hands
   - TECHNOLOGY domain → Digital interfaces, neural networks, data streams, futuristic elements
   - CORPORATE domain → Professional settings, business environments, geometric patterns

4. ❌ FORBIDDEN VISUAL MISMATCH:
   - Do NOT generate tech/AI visuals (neural networks, data interfaces, futuristic tech) for EDUCATION domain events
   - Do NOT generate education visuals for TECHNOLOGY domain events
   - The domain is determined by EVENT NAME CONTENT, NOT by color palette, NOT by theme preset

EVENT: "${input.eventName}"
→ DETECT THE DOMAIN FROM THIS NAME AND MATCH ALL VISUALS ACCORDINGLY.

`
      prompt += eventDomainInstruction
      console.log('[Design Intelligence v24.12.3] ✅ Event domain enforcement added for: "${input.eventName}"')

      // v24.12.4: PREMIUM PROFESSIONAL BACKGROUND enhancement
      const premiumBackgroundInstruction = `

========================================
🎨 PREMIUM PROFESSIONAL BACKGROUND (v24.12.4)
========================================

ALL posters MUST have PROFESSIONAL, IMMERSIVE backgrounds:

MANDATORY BACKGROUND QUALITIES:
1. DEPTH & DIMENSION: Multiple visual layers (foreground, midground, background)
2. RICH TEXTURES: Subtle grain, gradient meshes, atmospheric effects
3. VISUAL SOPHISTICATION: High-end design aesthetics, not generic flat backgrounds
4. DYNAMIC COMPOSITION: Organic shapes, color transitions, and depth layers for engaging visuals WITHOUT lines
5. PROFESSIONAL POLISH: Google AI Studio quality - refined, polished, premium feel

BACKGROUND RENDERING REQUIREMENTS:
- Create FULL-BLEED immersive designs that fill the entire canvas
- Use LAYERED visual elements (particles, shapes, gradients, light effects)
- Include ATMOSPHERIC depth (subtle bokeh, light rays, environmental cues)
- Apply PREMIUM textures (fine grain, subtle noise, professional finish)
- Ensure VISUAL RICHNESS even in "clean" areas

AVOID AT ALL COSTS:
❌ Plain solid color backgrounds
❌ Simple two-tone gradients
❌ Generic minimalist designs
❌ Empty/blank negative space
❌ "Template-looking" backgrounds

GOAL: Every poster should look like a PREMIUM, PROFESSIONALLY DESIGNED piece.
The background should feel IMMERSIVE and VISUALLY ENGAGING.

`
      prompt += premiumBackgroundInstruction
      console.log('[Design Intelligence v24.12.4] ✅ Premium background enhancement added')

      // v24.12.5: COLOR BRIGHTNESS PROTECTION
      // Problem: Design Intelligence was generating "darker edges" language causing Gemini to render colors too dark
      // Solution: Explicitly forbid darkening language and require brightness preservation
      const colorBrightnessProtection = `

========================================
🎨 COLOR BRIGHTNESS PROTECTION (v24.12.5)
========================================

⚠️ CRITICAL: DO NOT DARKEN USER COLORS

The user selected these specific colors:
- Primary: ${resolvedColors?.primaryColor || 'N/A'}
- Secondary: ${resolvedColors?.secondaryColor || 'N/A'}
- Accent: ${resolvedColors?.accentColor || 'N/A'}

FORBIDDEN DARKENING LANGUAGE - NEVER USE:
❌ "darker edges"
❌ "mysterious darkness"
❌ "shadowy atmosphere"
❌ "deep black"
❌ "transitions to darkness"
❌ "fading to black"
❌ "darker, mysterious"
❌ "dark corners"
❌ "shadowy edges"
❌ "darkening gradient"

REQUIRED BRIGHTNESS PRESERVATION:
✅ Keep background brightness CONSISTENT with user colors
✅ If user selected medium-brightness colors (like #6366F1), background should be MEDIUM brightness
✅ Use "soft transitions" NOT "dark transitions"
✅ Use "lighter edges" or "glowing edges" NOT "darker edges"
✅ Gradients should stay within the SAME brightness range as user colors
✅ Use "luminous", "bright", "vivid" descriptors for medium/light colors

COLOR BRIGHTNESS RULE:
- If user color hex starts with 6-9 or A-F in first digit → MEDIUM/BRIGHT color → background must stay MEDIUM/BRIGHT
- If user color hex starts with 0-5 in first digit → DARK color → background can be dark
- Example: #6366F1 starts with "6" → MEDIUM brightness → DO NOT darken to near-black

BACKGROUND SETTING LANGUAGE:
INSTEAD OF: "The background slowly transitions from a brighter center towards darker, mysterious edges"
USE: "The background features a cohesive gradient maintaining the color's natural brightness throughout"

INSTEAD OF: "Deep shadowy corners fade into darkness"
USE: "Soft glowing transitions create depth while preserving color vibrancy"

GOAL: The final poster should MATCH the user's selected color brightness.
Dark renderings of medium-brightness colors = DESIGN FAILURE.

`
      prompt += colorBrightnessProtection
      console.log('[Design Intelligence v24.12.5] ✅ Color brightness protection added')

      // v6.0 Phase 2: Inject color brief for color-aware backgrounds
      // v25.0: Pass formality to suppress botanical elements for formal events
      if (resolvedColors && resolvedColors.source !== 'fallback') {
        const colorPersonality = analyzeColorPersonality(resolvedColors.primaryColor, eventProfile?.formality)

        const colorBrief = `

========================================
USER COLOR PALETTE (MANDATORY - DRIVE VISUAL ATMOSPHERE):
========================================

Primary Color: ${resolvedColors.primaryColor} - ${colorPersonality.name}
Secondary Color: ${resolvedColors.secondaryColor}
Accent Color: ${resolvedColors.accentColor}
Color Source: ${resolvedColors.source}

COLOR PERSONALITY ANALYSIS (v24.12 - COLOR AS COLOR ONLY):
- Mood: ${colorPersonality.mood}
- Background Style: ${colorPersonality.backgroundStyle}

⚠️⚠️⚠️ CRITICAL COLOR RULES - v24.12 UPDATE ⚠️⚠️⚠️

COLOR = COLOR ONLY, NOT THEME TRIGGER:
- Green color does NOT mean "nature/trees/leaves/botanical"
- Orange color does NOT mean "energy/explosion/fire"
- Blue color does NOT mean "ocean/water/sky"
- Purple color does NOT mean "mystical/galaxy/magic"

USE COLORS AS:
✅ Background gradients and color washes
✅ Accent highlights and glows
✅ Text color coordination
✅ Ambient lighting color
✅ Geometric shape fills

DO NOT use colors to infer:
❌ Thematic visual elements (trees for green, waves for blue)
❌ Nature imagery based on color
❌ Environment settings based on color alone

VISUAL ELEMENTS COME FROM EVENT DETAILS ONLY:
- Tech event → circuit patterns, digital elements
- Music event → musical instruments, sound waves
- Business event → professional geometric shapes
- The EVENT TYPE determines visual elements, NOT the color

⚠️ CRITICAL: User selected these colors for AESTHETIC purposes. Apply colors to the design without forcing thematic elements based on color hue.
`
        prompt += colorBrief
        console.log(`[Design Intelligence] 🎨 Injected color personality: ${colorPersonality.name} (${resolvedColors.source})`)
      }

      // v6.5 Phase 1: Inject Event Understanding insights from Stage 1
      // v6.5.1: Lowered threshold from 0.6 to 0.4 to use fallback Event Understanding profiles
      // Fallback profiles (confidence ~0.5) still provide valuable event context vs random themes
      if (eventProfile && eventProfile.confidence >= 0.4) {
        const eventBrief = `

========================================
EVENT CONCEPT ANALYSIS (FROM STAGE 1 - SEMANTIC UNDERSTANDING):
========================================

EVENT: "${input.eventName}"

LITERAL MEANING:
${eventProfile.literalMeaning}

METAPHORICAL INTERPRETATIONS:
${eventProfile.metaphoricalMeanings.map(m => `- ${m}`).join('\n')}

SELECTED VISUAL CONCEPT: ${eventProfile.selectedConcept}
Concept Description: ${eventProfile.concepts.find(c => c.name === eventProfile.selectedConcept)?.description || ''}

PRIMARY VISUAL ASSOCIATIONS (USE THESE):
${eventProfile.visualAssociations.primary.map(v => `- ${v}`).join('\n')}

SECONDARY VISUAL OPTIONS (IF NEEDED):
${eventProfile.visualAssociations.secondary.map(v => `- ${v}`).join('\n')}

ABSTRACT REPRESENTATIONS:
${eventProfile.visualAssociations.abstract.map(v => `- ${v}`).join('\n')}

EVENT CHARACTERISTICS:
- Formality Level: ${eventProfile.formality}
- Energy Level: ${eventProfile.energyLevel}
- Emotional Tone: ${eventProfile.emotionalTone}

CRITICAL INSTRUCTIONS FOR USING EVENT UNDERSTANDING:
1. The visual elements MUST reflect the event's CONCEPTUAL meaning, not just generic event imagery
2. Use the PRIMARY visual associations as your main inspiration
3. DO NOT default to generic business/corporate imagery (handshakes, business cards, suits)
4. THINK: What does "${input.eventName}" MEAN conceptually? Use the literal and metaphorical meanings above
5. The backgroundSetting and iconicImagery MUST include elements from the visual associations
6. The selected concept "${eventProfile.selectedConcept}" should guide your entire design approach
7. Confidence in this analysis: ${(eventProfile.confidence * 100).toFixed(0)}% - Trust these insights

⚠️ CRITICAL: Event name "${input.eventName}" has specific conceptual meaning. Generate visuals that match THIS SPECIFIC concept, not generic event templates.
`
        prompt += eventBrief
        console.log(`[Design Intelligence] 🎯 Injected Event Understanding: ${eventProfile.selectedConcept} (confidence: ${eventProfile.confidence})`)
        console.log(`[Design Intelligence] Primary visuals: ${eventProfile.visualAssociations.primary.slice(0, 3).join(', ')}`)

        // v24.12.7: UNIVERSAL BOTANICAL PROHIBITION - applies to ALL formality levels
        // This prevents Design Intelligence from generating leaves/trees/botanical for any event
        // (unless the event is specifically about nature/gardening/environment)
        const universalBotanicalProhibition = `

========================================
🚫 BOTANICAL PROHIBITION (v24.12.7 - APPLIES TO ALL EVENTS)
========================================

CRITICAL: Do NOT generate botanical/nature visual elements unless the event is SPECIFICALLY about:
- Gardening, agriculture, or farming
- Environmental/sustainability activism (where plants ARE the theme)
- Nature/outdoor activities (camping, hiking, etc.)

FOR ALL OTHER EVENTS (INCLUDING ACADEMIC/EDUCATIONAL):
❌ NO leaves, laurels, or leaf patterns
❌ NO trees, branches, or roots
❌ NO botanical patterns or plant motifs
❌ NO "growth" metaphors using plants (use stairs, arrows, graphs instead)
❌ NO "organic" or "nature-inspired" decorative elements

INSTEAD USE FOR PROFESSIONAL/ACADEMIC EVENTS:
✅ Geometric shapes (hexagons, circles, grids)
✅ Abstract light rays and gradients
✅ Modern architectural elements
✅ Clean lines and professional patterns
✅ Achievement symbols (stars, crests, badges)
✅ Ascending stairs or steps (NOT botanical paths)

REASON: User selected GREEN as a COLOR preference, not as a nature THEME.
Academic events should use PROFESSIONAL geometric elements, not nature metaphors.
`
        prompt += universalBotanicalProhibition
        console.log('[Design Intelligence] v24.12.7: 🚫 Universal botanical prohibition added')

        // v25.0: Add formality-aware guidelines for premium/exclusive events
        // This suppresses metaphorical/botanical output in favor of literal professional imagery
        if (eventProfile.formality === 'premium' || eventProfile.formality === 'exclusive') {
          const formalityBrief = `

========================================
🎯 FORMAL EVENT MODE (v25.0 - LITERAL IMAGERY REQUIRED)
========================================

EVENT FORMALITY: ${eventProfile.formality.toUpperCase()}

⚠️ CRITICAL OVERRIDE FOR FORMAL EVENTS:

This is a PREMIUM/EXCLUSIVE formal event. The AI must generate LITERAL, PROFESSIONAL imagery
rather than creative metaphors or botanical/nature-based concepts.

MANDATORY GUIDELINES:

1. PRIORITIZE LITERAL IMAGERY over metaphorical concepts
   - For MoU signing: Show actual documents, pens, handshakes, conference settings
   - For seminars: Show professional presentation environments, microphones, audience
   - For ceremonies: Show podiums, stages, ribbons, official proceedings

2. ABSOLUTELY AVOID (These will be REJECTED):
   ❌ "Gardens of potential" or "forests of growth"
   ❌ "Ascending botanical paths" or "leaf-shaped stairways"
   ❌ Nature metaphors (trees, flowers, leaves, vines) unless directly event-related
   ❌ Abstract conceptual representations
   ❌ Whimsical or playful interpretations

3. PREFERRED IMAGERY for formal events:
   ✅ Elegant conference rooms with premium lighting
   ✅ Formal documents being signed with quality pens
   ✅ Professional handshakes in sophisticated settings
   ✅ Podiums with microphones in well-lit venues
   ✅ Executive boardroom atmospheres
   ✅ Clean, minimal professional backgrounds

4. COLOR APPLICATION:
   - Colors should be ELEGANT and RESTRAINED
   - Use colors as subtle accents, not overwhelming themes
   - Professional tones: navy, charcoal, burgundy, forest green (as accent, NOT botanical)

5. TYPOGRAPHY & LAYOUT:
   - Clean, professional sans-serif fonts
   - Formal hierarchy (no playful arrangements)
   - Sophisticated, corporate aesthetics

REASON: Events like "${input.eventName}" require institutional gravitas and professional credibility,
NOT creative metaphors that undermine the event's formal nature.
`
          prompt += formalityBrief
          console.log(`[Design Intelligence] v25.0: 🎩 FORMAL EVENT MODE ACTIVATED - Literal imagery required (formality: ${eventProfile.formality})`)
        }
      } else if (eventProfile) {
        console.log(`[Design Intelligence] ⚠️ Event Understanding available but confidence too low (${eventProfile.confidence}) - skipping injection`)
      }

      // v25.1: Analyze content density and inject background enrichment guidance
      // When content is sparse (short event name, no description), generate richer backgrounds
      const contentDensityAnalysis = analyzeContentDensity({
        eventName: input.eventName,
        eventDescription: input.details || input.additionalContext,  // DesignBrief uses 'details' for description
        speakers: input.guestName ? [{ name: input.guestName, designation: input.guestDesignation }] : [],
        venue: input.venue,
      })

      if (contentDensityAnalysis.shouldEnrichBackground) {
        const contentDensityBrief = buildContentDensityGuidance(contentDensityAnalysis)
        if (contentDensityBrief) {
          prompt += '\n\n' + contentDensityBrief
          console.log(`[Design Intelligence] v25.1: 🎨 SPARSE CONTENT DETECTED - Background enrichment active`)
          console.log(`[Design Intelligence] Content density: ${contentDensityAnalysis.density} (${contentDensityAnalysis.totalChars} chars, ${contentDensityAnalysis.wordCount} words)`)
          console.log(`[Design Intelligence] Background complexity: ${contentDensityAnalysis.backgroundComplexity}`)
        }
      } else {
        console.log(`[Design Intelligence] v25.1: Content density normal (${contentDensityAnalysis.density}) - standard background`)
      }

      // Add strict enforcement on retry
      if (attempt > 1) {
        prompt += `\n\n⚠️ PREVIOUS ATTEMPT REJECTED: The developed context failed validation because it did not explicitly mention the event name "${input.eventName}".\nFIX: Ensure "storyAnalysis.narrative" explicitly contains the text "${input.eventName}".`
        console.log(`[Design Intelligence] 🔄 RETRY ATTEMPT ${attempt}/${MAX_ATTEMPTS} for "${input.eventName}"`)
      }

      // Stage 2: Call LLM (Gemini preferred, Claude fallback)
      // v25.0: Pass formality for temperature adjustment
      const currentFormality = eventProfile?.formality
      let llmResponse: LLMResponse
      try {
        llmResponse = await callGemini(prompt, input.formatId, currentFormality) // v25.0: Pass formality for temperature config
      } catch (e) {
        console.warn(`[Design Intelligence] Gemini failed (Attempt ${attempt}), falling back to Claude`, e)
        llmResponse = await callClaude(prompt)
      }

      // Stage 3: Parse & Validate
      const designContext = parseDesignContext(llmResponse.text)

      // CRITICAL: Validate visualElements for text label risks
      const riskyKeywords = ['innovation', 'networking', 'tech', 'celebration', 'leadership', 'collaboration', 'conference', 'workshop', 'seminar', 'summit', 'insights', 'workshops', 'professional', 'creative', 'modern', 'digital'];
      const riskyElements = designContext?.visualElements?.filter(el => {
        const trimmed = el.toLowerCase().trim();
        return riskyKeywords.some(keyword => trimmed === keyword || trimmed === `${keyword}s`);
      }) || [];

      if (riskyElements.length > 0) {
        console.error('[Design Intelligence] 🚨 RISKY SINGLE-WORD visualElements DETECTED:', riskyElements);
        console.error('[Design Intelligence] ⚠️ These will likely be rendered as TEXT by Gemini instead of visual elements!');
        console.error('[Design Intelligence] Event:', input.eventName);
      } else if (designContext?.visualElements && designContext.visualElements.length > 0) {
        console.log('[Design Intelligence] ✅ All visualElements are multi-word descriptions (safe from text rendering)');
      }

      // NEW: Validate context matches event
      const validation = validateContextMatchesEvent(
        designContext,
        input.eventName,
        input.eventType
      )

      if (!validation.valid) {
        const reason = validation.reason || 'Unknown validation failure'
        console.warn(`[Design Intelligence] ⚠️ Attempt ${attempt} Validation Failed: ${reason}`)

        // If this is the last attempt, throw to trigger fallback
        if (attempt === MAX_ATTEMPTS) {
          throw new Error(`Context validation failed after ${MAX_ATTEMPTS} attempts: ${reason}`)
        }

        // Continue to next attempt
        continue
      }

      // Stage 4: Store in cache (v5.5 optimization)
      // v6.0: Only cache non-creative formats to maintain variety for posters/flyers
      if (!isCreativeFormat) {
        const cacheKey = generateDesignContextCacheKey({
          formatId: input.formatId,
          eventType: input.eventType,
          eventName: input.eventName,
          theme: input.theme,
          style: input.style,
          hasSpeakerPhoto: input.hasSpeakerPhoto,
        })
        setCachedDesignContext(cacheKey, designContext)
      }

      // Stage 5: Return Enriched Context (Success)
      return {
        context: {
          ...designContext,
          storytellingContext, // v26.0: Add storytelling fusion result
        },
        usage: {
          model: llmResponse.model,
          provider: llmResponse.model.includes('claude') ? 'claude' : 'gemini',
          tokenUsage: llmResponse.tokenUsage || { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
          durationMs: Date.now() - startTime,
        },
      }

    } catch (error) {
      console.error(`[Design Intelligence] Error in attempt ${attempt}:`, error)
      lastError = error
      // If critical error (not validation), we might still want to retry or just fail?
      // For now, let's treat it as a failure that consumes an attempt
      if (attempt === MAX_ATTEMPTS) break
    }
  }

  // If we get here, all attempts failed
  console.error('[Design Intelligence] All attempts failed. Triggering fallback.')

  // Return safe fallback to prevent app crash
  const fallbackContext = generateFallbackContext({
    title: input.eventName,
    description: input.details,
    venue: input.venue,
    additionalContext: input.additionalContext,
    theme: input.theme, // v5.5: Pass theme to fallback generator
  })

  return {
    context: fallbackContext,
    usage: {
      model: 'fallback',
      provider: 'gemini',
      tokenUsage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
      durationMs: Date.now() - startTime,
    },
  }
}

// ============================================================
// HELPERS
// ============================================================

async function callGemini(
  prompt: string,
  formatId?: string,
  formality?: 'casual' | 'professional' | 'premium' | 'exclusive'
): Promise<LLMResponse> {
  const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('Missing Gemini API Key')

  // Get format-specific temperature config (v5.3)
  const tempConfig = getTemperatureConfig(formatId || 'event_poster')

  // v25.0: Adjust temperature based on event formality
  // Premium/exclusive events need lower temperature for literal, predictable output
  let temperature = tempConfig.designIntelligence
  let topP = tempConfig.topP

  if (formality === 'premium' || formality === 'exclusive') {
    temperature = 0.7  // Conservative for formal events
    topP = 0.90        // More focused sampling
    console.log(`[Design Intelligence] v25.0: 🎛️ Temperature reduced to ${temperature} for ${formality} event (was ${tempConfig.designIntelligence})`)
  } else if (formality === 'professional') {
    temperature = Math.min(tempConfig.designIntelligence, 1.0) // Cap at 1.0 for professional
    topP = Math.min(tempConfig.topP, 0.95)
    console.log(`[Design Intelligence] v25.0: 🎛️ Temperature adjusted to ${temperature} for professional event`)
  }

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({
    model: GEMINI_MODEL,
    generationConfig: {
      temperature, // v25.0: Now formality-aware (lower for premium events)
      topK: 40,
      topP, // v25.0: Now formality-aware
      maxOutputTokens: 4096, // v3.6: Increased for deeper reasoning
      responseMimeType: 'application/json', // v3.6: Native JSON Mode!
    },
    // v3.6: Explicit Safety Settings (BLOCK_ONLY_HIGH allows creative freedom)
    safetySettings: [
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
      { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
      { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
    ]
  })

  const result = await model.generateContent(prompt)
  const response = result.response

  const text = response.text()

  // Calculate approximate token usage (Gemini doesn't always return usage in this call style, but we can try)
  const usageMetadata = response.usageMetadata
  const tokenUsage: TokenUsage = {
    inputTokens: usageMetadata?.promptTokenCount || 0,
    outputTokens: usageMetadata?.candidatesTokenCount || 0,
    totalTokens: usageMetadata?.totalTokenCount || 0,
  }

  return {
    text,
    tokenUsage,
    model: GEMINI_MODEL,
    durationMs: 0, // Calculated by caller
  }
}

async function callClaude(prompt: string): Promise<LLMResponse> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('Missing Anthropic API Key')

  const anthropic = new Anthropic({ apiKey })

  const startTime = Date.now()
  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 4096,
    system: "You are a JSON-only API. return VALID, PARSEABLE JSON matching the schema.",
    // v3.7: Enable Prompt Caching for the 4k system prompt (save cost/latency)
    ...(process.env.ANTHROPIC_PROMPT_CACHING === 'true' ? {
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: prompt,
              cache_control: { type: 'ephemeral' }
            }
          ]
        },
        {
          role: 'assistant',
          content: '{', // v3.7: Force JSON start to prevent preamble/hallucination
        },
      ]
    } : {
      messages: [
        {
          role: 'user',
          content: prompt,
        },
        {
          role: 'assistant',
          content: '{', // v3.7: Force JSON start to prevent preamble/hallucination
        },
      ],
    }),
  })

  const durationMs = Date.now() - startTime

  console.log(`[Design Intelligence] Response received in ${durationMs} ms`)

  // Extract text from response
  const textBlock = response.content.find(block => block.type === 'text')
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text response from Claude')
  }

  const text = textBlock.text

  // v3.7: If we forced the start with '{', we need to prepend it back if it's missing
  // Claude usually continues from the pre-fill, so the response is just the REST of the JSON.
  // We need to check if the response starts with the key, e.g. `"corePurpose":...`
  // or if it includes the brace. 
  // With prompt caching, the pre-fill behavior is tricky, so we handle both cases.

  const finalJson = text.trim().startsWith('{') ? text : `{${text} `

  // Extract token usage from Claude's response
  const tokenUsage: TokenUsage = {
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
    cachedTokens: 0, // Claude doesn't report cached tokens the same way
    totalTokens: response.usage.input_tokens + response.usage.output_tokens,
  }

  console.log('[Design Intelligence] Response length:', text.length, 'chars')
  console.log('[Design Intelligence] Token usage:', JSON.stringify(tokenUsage))

  return {
    text: finalJson, // v3.7: Return the repaired JSON string
    tokenUsage,
    model: CLAUDE_MODEL,
    durationMs,
  }
}

/**
 * Call OpenAI for design intelligence
 * @placeholder - To be implemented when needed
 */
async function callOpenAI(prompt: string): Promise<LLMResponse> {
  // Future implementation for OpenAI API
  // Would use openai package with gpt-4o-mini for cost efficiency
  throw new Error('OpenAI provider not yet implemented. Use gemini or claude for now.')
}

// ============================================================
// FALLBACK / DEFAULT CONTEXT
// ============================================================

function parseDesignContext(json: string): DesignContext {
  try {
    // STEP 1: Clean the JSON (remove markdown, comments)
    let cleanedJSON = json.trim()

    // Remove markdown code blocks if present
    if (cleanedJSON.startsWith('```json')) {
      cleanedJSON = cleanedJSON.slice(7) // Remove ```json
    } else if (cleanedJSON.startsWith('```')) {
      cleanedJSON = cleanedJSON.slice(3) // Remove ```
    }

    if (cleanedJSON.endsWith('```')) {
      cleanedJSON = cleanedJSON.slice(0, -3) // Remove trailing ```
    }

    cleanedJSON = cleanedJSON.trim()
    console.log('[Design Intelligence] Cleaned JSON length:', cleanedJSON.length, 'chars')

    // STEP 2: Parse the cleaned JSON (with fallback repair)
    const parsed = safeJsonParse<any>(cleanedJSON)


    // Validate required fields
    const required = [
      'corePurpose',
      'visualElements',
    ]

    const missing = required.filter(field => !parsed[field])
    if (missing.length > 0) {
      console.warn('[Design Intelligence] Missing required fields:', missing)
      // We could throw here, or just let validation fail later
    }

    // v5.5: Ensure visualElements is populated (not empty array)
    if (!parsed.visualElements || parsed.visualElements.length === 0) {
      console.warn('[Design Intelligence] WARNING: visualElements empty, providing generic fallback')
      parsed.visualElements = [
        'dynamic composition with depth',
        'modern professional setting',
        'engaging visual hierarchy',
        'bold graphic elements',
        'contemporary design aesthetic'
      ]
    }

    return parsed as DesignContext
  } catch (error) {
    console.error('[Design Intelligence] JSON Parse Error:', error)
    console.error('[Design Intelligence] Raw JSON:', json.substring(0, 100) + '...')
    throw new Error('Failed to parse design context JSON')
  }
}

/**
 * Get format-specific design guidance to prevent event_poster contamination
 */
function getFormatSpecificGuidance(formatId?: string, formatName?: string): string {
  if (!formatId || formatId === 'event_poster') return ''

  const guidance: Record<string, string> = {
    certificate: `
=== CERTIFICATE DESIGN CONTEXT ===
Certificates require:
- Formal borders, elegant typography, credibility signals (seals, signatures)
- Center-aligned, symmetrical, prestigious feel
- Professional colors (navy, gold, burgundy), NOT vibrant event colors
- Academic symbols (laurels, ribbons, shields), NOT event decorations
- Achievement-focused language, NOT promotional language
CRITICAL: Design a CERTIFICATE, not an event poster!`,

    instagram_post: `
=== INSTAGRAM POST DESIGN CONTEXT ===
Instagram posts require:
- Bold headlines, minimal text, scroll-stopping visuals
- Vertical/square optimized for mobile feeds
- Vibrant, high-contrast colors for engagement
- Modern, trendy graphics and patterns
- Eye-catching compositions that stop scrolling
CRITICAL: Design for INSTAGRAM mobile feed, not an event poster!`,

    linkedin_post: `
=== LINKEDIN POST DESIGN CONTEXT ===
LinkedIn posts require:
- Professional credibility, clear value proposition
- Business-appropriate tone and colors (blues, grays, corporate palette)
- Data visualizations, professional icons, clean layouts
- Authority signals, NOT entertainment visuals
- B2B messaging, NOT consumer event promotions
CRITICAL: Design for LINKEDIN professional feed, not an event poster!`,

    youtube_thumbnail: `
=== YOUTUBE THUMBNAIL DESIGN CONTEXT ===
YouTube thumbnails require:
- Emotion-driven facial expressions if people present
- Bold, large text readable at tiny sizes
- High saturation, complementary color contrasts
- Expressive faces, bold arrows/frames for attention
- Click-through rate optimization (CTR patterns)
CRITICAL: Design for YOUTUBE search/browse tiny thumbnails, not posters!`,

    business_card: `
=== BUSINESS CARD DESIGN CONTEXT ===
Business cards require:
- Minimal, professional layouts with clear hierarchy
- Contact information prominence (name, title, phone, email)
- Corporate/personal branding consistency
- Print-optimized (high DPI, CMYK-safe colors)
- Professional typography, NOT decorative event fonts
CRITICAL: Design a BUSINESS CARD, not an event poster!`,

    flyer: `
=== FLYER DESIGN CONTEXT ===
Flyers require:
- Clear call-to-action (CTA) prominence
- Scannable information hierarchy
- Promotional/marketing tone
- Print or digital distribution optimization
- Quick-glance readability
CRITICAL: Design a FLYER with clear CTA, following flyer best practices!`,

    invitation: `
=== INVITATION DESIGN CONTEXT ===
Invitations require:
- Elegant, welcoming aesthetics
- Clear RSVP information and event details
- Sophisticated typography (script, serif combinations)
- Premium feel (gold accents, textures)
- Formal or semi-formal tone depending on event type
CRITICAL: Design an INVITATION that feels welcoming and elegant!`,

    brochure: `
=== BROCHURE DESIGN CONTEXT ===
Brochures require:
- Multi-section content organization
- Visual storytelling across panels
- Professional corporate aesthetic
- Clear information hierarchy
- Print-optimized layouts with margins
CRITICAL: Design a BROCHURE with multi-panel storytelling!`
  }

  return guidance[formatId] || `
=== ${(formatName || formatId).toUpperCase()} DESIGN CONTEXT ===
This is a ${formatName || formatId}, NOT an event poster.
Consider the unique requirements of this format type.
Adapt visual style, typography, colors, and decorations accordingly.`
}

/**
 * Get category name for a format ID
 */
function getCategoryName(formatId: string): string {
  if (['instagram_post', 'linkedin_post', 'facebook_post', 'twitter_post', 'story'].includes(formatId)) {
    return 'Social Media'
  }
  if (['certificate', 'invitation', 'brochure', 'flyer', 'event_poster'].includes(formatId)) {
    return 'Print Material'
  }
  if (['youtube_thumbnail', 'video_cover'].includes(formatId)) {
    return 'Video Thumbnail'
  }
  if (['business_card', 'letterhead', 'resume'].includes(formatId)) {
    return 'Professional Document'
  }
  return 'Marketing Material'
}

/**
 * Alias for backward compatibility / explicit safety
 */
export const generateDesignContextSafe = generateDesignContext

