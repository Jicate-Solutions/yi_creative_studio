
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
import { safeJsonParse, validateColorMapping } from '@/lib/utils/json-repair'

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
  type AIEventAnalysis,
} from './yi-prompt-builder/context-helpers'
import { getTemperatureConfig } from './prompt-optimization/config'
import {
  generateDesignContextCacheKey,
  getCachedDesignContext,
  setCachedDesignContext,
} from './prompt-optimization/cache'

// v6.0: Content-aware element mapping for maximum creativity
// v30.0: Removed getContentRelatedElements — keyword matching replaced by dynamic AI thinking
import {
  generateUniquenessSeed,
  getCreativityDirective,
} from './content-element-mapper'
import type { ContentElements } from './content-element-mapper'

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
${input.targetAudience ? `TARGET AUDIENCE: ${input.targetAudience}` : ''}
ADDITIONAL CONTEXT: ${input.additionalContext || ''}
${input.additionalVisualBrief ? `USER VISUAL DIRECTION (HIGHEST PRIORITY — this is the user's direct creative brief for the background visual):
"${input.additionalVisualBrief}"
Your CONCEPT 1 (SCENE-BASED) MUST reflect this visual direction. The user has explicitly described what they want to see.` : ''}
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

=== DYNAMIC VISUAL THINKING (v38.0 — CONCEPT-FIRST) ===
Do NOT reuse generic visual elements (lotus flowers, silhouettes, DNA strands, etc.) across different events.
Instead, consider WHICH CREATIVE APPROACH best serves THIS EVENT:

1. What is the LITERAL subject of this event? (e.g., menstrual health, coding workshop, leadership retreat)
2. What SINGLE OBJECT could be the HERO of this poster? Not a generic symbol — the REAL object from this event's world. (For graduation: the cap. For blood donation: the blood bag. For coding: the terminal screen.)
3. What VISUAL METAPHOR captures its DEEPER meaning? (graduation cap becoming a bird = freedom. Tree roots forming a handshake = community.)
4. Could the EVENT'S ATMOSPHERE alone tell the story? (An empty stage set for convocation. A workshop table with tools laid out.)
5. What EMOTION is at the core? Could a CLOSE-UP detail capture it? (Hands receiving a diploma. Eyes lit by a screen.)

Choose the approach that is LEAST OBVIOUS for this event type.
GENERATE 3-5 ORIGINAL visual elements that support your chosen approach.
Do NOT fall back on category-generic imagery.

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

When generating people, they MUST have Indian ethnicity and features:
- Audience members → Indian crowd with diverse South Asian representation
- Participants, students, professionals → Indian individuals in dynamic poses
- Performers, dancers, musicians → Indian performers in action
- Group gatherings → Diverse Indian crowd (various ages, genders) shown in FULL DETAIL

REPRESENT PEOPLE AS:
✅ Full-figure illustrations with visible faces and expressions
✅ Dynamic action poses (speaking, collaborating, creating, learning)
✅ Photorealistic or detailed illustrated depictions
✅ Close-up portraits or expressive headshots
✅ Indian attire: kurta, sari, western-casual, formal Indian business wear
✅ Diverse Indian skin tones (fair to dark brown spectrum)

ABSOLUTELY FORBIDDEN (v32.0):
❌ Silhouettes of ANY kind (unless the event is literally about shadow art)
❌ Faceless outlines or shadow figures
❌ Generic dark figure shapes against backgrounds
❌ Western/Caucasian default characters
❌ Blonde hair or European features as default

This applies to ALL formats: event posters, flyers, social media, certificates.

=== CREATIVITY REQUIREMENT (v38.0) ===
If your FIRST idea involves silhouettes, generic icons, or category-default imagery, IMMEDIATELY reject it.
Ask yourself: "What is the LEAST OBVIOUS but most POWERFUL way to visualize THIS SPECIFIC event?"

THINK IN CONCEPTS, NOT JUST SCENES:
Example — "Menstrual Health Awareness" visualized through different creative lenses:
- SCENE: "A warm classroom with anatomical charts in soft pink and teal, a confident woman educator at a whiteboard"
- OBJECT-HERO: "A giant sanitary pad unfurled like a banner against a teal sky, with empowered women figures walking confidently beneath it"
- CONCEPTUAL: "A lotus flower blooming from an open biology textbook, petals forming anatomical shapes, in warm educational pink tones"
- CLOSE-UP: "Close-up of a young woman's hands confidently holding a menstrual cup, warm studio lighting, educational posters softly blurred behind"
- ENVIRONMENTAL: "A clean health education room with anatomical charts, whiteboard with diagrams, and a table set with educational pamphlets"

ALL FIVE are valid. The BEST choice depends on what feels most UNEXPECTED for this event while still being instantly understandable.

YOU MUST BE SPECIFIC. BE CONCEPT-DRIVEN. BE MEMORABLE.

=== PROFESSIONAL TEMPLATE STRUCTURE (v33.0) ===
While being creative with VISUALS, maintain STRUCTURAL DISCIPLINE for information:
- Event details (date, time, venue) MUST appear in a VISUALLY DISTINCT INFO CONTAINER
  (colored bar, rounded card, badge strip, or contrast panel) — NOT floating text on a gradient
- The poster must look DESIGNED (structured, grid-based) not GENERATED (artsy, amorphous)
- A viewer scrolling Instagram must extract WHO, WHAT, WHEN, WHERE in 3 seconds
- Think: "Canva Pro template with AI-quality visuals" — not "AI art with text added on top"
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

=== CRITICAL: CREATIVE CONCEPT DIVERSITY (v38.0) ===

CONCEPT BRAINSTORMING (Think Like a Design Team):
Before generating your design context, brainstorm 3 fundamentally DIFFERENT visual concepts for this event:

CONCEPT 1 — SCENE-BASED: What does the event PHYSICALLY look like? Describe the real scene with real Indian people doing the activity.
CONCEPT 2 — OBJECT-HERO: What ONE symbolic object could DOMINATE the canvas? (e.g., a stethoscope for a health camp, a graduation cap for convocation, a paintbrush for an art workshop.) The object fills most of the frame; people are secondary or absent.
CONCEPT 3 — CONCEPTUAL: What visual METAPHOR captures the event's deeper meaning? (e.g., books unfolding into wings = graduation as freedom; roots forming a network = community building.)

Then SELECT the concept using this priority:
1. PREFER CONCEPT 1 (SCENE-BASED) — real scenes with Indian people are the most impactful. But make them CREATIVE and VISUALLY STUNNING — not corporate stock photos. Add dramatic lighting, dynamic action, vibrant energy, and unexpected creative elements.
2. Use CONCEPT 2 (OBJECT-HERO) only if the event is product/tool-focused (e.g., blood donation → blood bag, cooking class → utensils).
3. Use CONCEPT 3 (CONCEPTUAL) only for abstract/philosophical events where no physical scene exists (e.g., "Mindfulness Meditation").
IMPORTANT: Abstract neural pathways, geometric nodes, hexagonal patterns are NOT acceptable as primary backgrounds — they look generic and fail to communicate the specific event.
Your backgroundSetting and visualElements MUST reflect the SELECTED concept — not the obvious default.

ADDITIONAL VARIATION TECHNIQUES:
- VARY visual elements (don't always use handshake for networking events)
- EXPLORE different composition styles (asymmetrical, minimalist, rich layered)
- SUGGEST diverse color palettes (not just navy/gold for professional events)
- PROVIDE unique background settings (NOT just generic hotel ballrooms)
- THINK beyond obvious visual metaphors

Generate fresh, distinctive creative direction that feels DIFFERENT from typical designs while perfectly capturing the event's story.

=== CINEMATIC QUALITY STANDARDS (v6.0 - MOMENTUM) ===
You are NOT creating a flat vector graphic. You are creating a CINEMATIC VISUAL EXPERIENCE.
1. LIGHTING SETS THE MOOD:
   - NEVER just say "professional lighting".
   - SPECIFY: "Warm natural light from a classroom window", "Conference hall stage spotlights", "Clean clinical fluorescent lighting", "Dramatic side-lighting for depth".
   - Match lighting to the SCENE (classroom = warm daylight, conference = stage spots, clinic = clean white light).
2. TEXTURE ADDS REALISM:
   - AVOID flat colors.
   - SPECIFY: "Wooden desk surface texture", "Whiteboard with marker traces", "Matte finish walls", "Premium paper grain on surfaces".
   - Textures should be SCENE-APPROPRIATE (classroom textures for education, clinical textures for health).
3. BAN LIST (DO NOT USE):
   - ❌ NO "Generic blue/orange gradients" (unless uniquely described like "Deep abyssal blue fading to bioluminescent teal").
   - ❌ NO "Standard handshake icons" for networking (Use "interconnected constellation nodes" or "magnetic field lines").
   - ❌ NO "Stock photo happy people" (Use "authentic candid moments", "purposeful focused expressions", or "stylized portraits with sharp detail").

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

** COLOR DERIVATION (v30.1 — Think Like a Cinematographer) **:
  Do NOT pick colors from a category menu. DERIVE colors from THIS EVENT'S reality:
  - What color is the MAIN SUBJECT? (blood=crimson, trees=deep green, code=cyan, menstrual health=soft pink/teal)
  - What color is the ENVIRONMENT where this happens? (hospital=clean white, forest=earth tones, auditorium=deep blue)
  - What EMOTION should the viewer feel? (urgency=red, calm=blue, hope=gold, empowerment=warm amber)
  - Two different "health" events should have DIFFERENT colors based on their specific subject matter

   - How many colors in headline ? (2 - 4 based on complexity)
   - Color rhythm: Alternating / Gradient / Emphasis - based

    ** BRAND IDENTITY INTEGRATION (CRITICAL) **:
   - If BRAND COLORS are provided in the brief, you MUST use them as the foundation.
   - Do not invent random colors if brand colors are specified.
   - Mix Brand Colors with semantic colors (e.g., Brand Blue + Gold for "Achievement").

## STEP 5: BACKGROUND & ATMOSPHERE

Create a visual world that supports the story:

** Background Treatment ** (choose based on event type):
- ** Scene-Based **: A real environment/setting where this event would take place (PREFERRED for most events)
    - ** Thematic Still Life **: Arrangement of event-related objects and tools (great for workshops/seminars)
      - ** Environmental **: Real-world setting with event-relevant context (outdoors, venues, spaces)
        - ** Gradient + Elements **: Color gradient as base with concrete thematic objects layered on top
          - ** Linear Gradient **: Simple, clean gradient (only for minimalist/formal events)

            ** Scene Specification **:
  - Describe the ENVIRONMENT in detail: What room/space? What objects are visible? What's the lighting?
    - Example: "A warm, well-lit classroom with soft pink and teal walls, anatomical health charts pinned on the wall, a clean whiteboard with educational diagrams, wooden desks with educational materials and health pamphlets arranged neatly"

      ** Scene Elements **:
  - What CONCRETE OBJECTS are in this scene? (list 3-5 specific items with materials/colors)
    - What ENVIRONMENT is this? (classroom, conference hall, clinic, workshop, outdoor venue)
      - What LIGHTING matches this scene? (classroom daylight, stage spots, clinical white, warm ambient)

      ** INDIAN SETTING MANDATE (v37.0) **:
  This is an Indian organization platform (Young Indians / Yi). The background scene MUST be recognizably Indian:
  - School/Vidyalaya venue → Indian classroom: green chalkboards, wooden benches in rows, ceiling fans, open corridors with tiled floors
  - College/University venue → Indian campus: seminar halls with wooden chairs, notice-board corridors, banyan tree courtyard
  - Hotel/Convention venue → Indian event hall: chandeliered banquet, fabric-draped stage, marigold garland decoration
  - Community Hall/Auditorium → Indian sabha: plastic/metal chairs, decorated stage with podium, banner backdrop, tube lights
  - Office/Corporate → Indian workspace: glass-front building, open-plan desks with monitors, whiteboard walls
  - Outdoor/Ground → Indian outdoor venue: shamiana tent, string lights, open-air stage on maidan
  - If TARGET AUDIENCE is "school students" → environment MUST be a school, NOT a corporate setting
  - If TARGET AUDIENCE is "professionals" → modern Indian office/IT park, NOT Western Silicon Valley
  - BANNED: Western campuses with brick facades and ivy, American cubicle offices, European conference halls

## STEP 6: DECORATIVE ELEMENTS(Story - Specific)

Generate decorations that enhance the narrative:

** Thematic Elements ** (based on story analysis):
  - What visual symbols reinforce the story ?
    - What imagery creates emotional connection ?
      - Sophistication level: Refined / Balanced / Playful

        ** ELEMENT CONSTRUCTION (v30.1 — Be a Set Designer) **:
  Instead of picking from a category menu, BUILD elements from THIS EVENT'S reality:
  - What TOOLS does this event use? (scalpel, laptop, paintbrush, megaphone, sanitary pad, blood bag)
  - What TEXTURES exist at this event? (medical steel, wooden podium, digital screen, fabric, clinical tile)
  - What LIGHT sources exist? (fluorescent clinical, warm stage spotlights, outdoor sun, neon screens)
  Describe elements as a set designer would: materials, textures, lighting, scale.
  ALWAYS use MULTI-WORD visual descriptions, never single keywords.
  Example: NOT "health symbols" → "anatomical educational wall chart with soft pink diagrams on clean white background"

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

      === VISUAL THINKING METHOD (v30.1 — Ideogram-Style Scene Thinking) ===

Do NOT think in event categories. Think in SCENES.

WRONG approach: "This is a health event → use healing green + medical imagery"
RIGHT approach: "This is about menstrual health education → visualize: a warm, intimate
  classroom setting with anatomical educational charts in soft pink and teal, a confident
  woman educator, sanitary products tastefully displayed as educational props, empowering
  atmosphere of knowledge-sharing"

For EVERY event, answer these 3 questions:
1. SCENE: If you were PHOTOGRAPHING this event, what would you see?
   (Describe the actual physical scene, not abstract concepts)
2. HERO OBJECT: What ONE specific object represents THIS event?
   (Not "health symbols" — the ACTUAL object: stethoscope, menstrual cup, yoga mat, blood bag, etc.)
3. ATMOSPHERE: What does the AIR feel like at this event?
   (Not "professional" — the ACTUAL feeling: "the focused hush of a medical lecture hall"
   or "the buzzing excitement of a startup pitch room")

TWO EVENTS IN THE SAME CATEGORY MUST LOOK DIFFERENT:
- "Blood Donation Drive" → warm clinical setting, red cross, donor chairs, IV bags, heroic sacrifice
- "Menstrual Health Workshop" → intimate educational space, anatomical charts, empowering feminine energy
Both are "health" — but they look COMPLETELY DIFFERENT because they ARE different events.

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
  6. ** STRUCTURED INFO BLOCKS **: Event details (date, time, venue) MUST appear in a VISUALLY DISTINCT container (info card, colored bar, badge strip) — NOT floating text on a gradient. This is the difference between a professional Canva template and AI-generated art.
  7. ** TEMPLATE THINKING **: The design must look like a REUSABLE TEMPLATE — swap the event name/date and the layout still works. Clear visual zones, consistent grid alignment, predictable information placement.

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
  Visual Language: "Workshop space with living plants growing alongside laptop screens and robotic arms — organic meets digital in a real maker-lab setting"

- "Youth Leadership Gala" → Theme: "Rising Phoenix Elegance"
  Description: "Youthful energy refined with sophisticated prestige"
  Visual Language: "Ascending gradient from vibrant youth colors to refined golds, with phoenix wing motifs in premium finish"

- "Startup Networking Night" → Theme: "Neon Hustle Energy"
  Description: "Dynamic entrepreneurial vibe meets urban tech culture"
  Visual Language: "Dimly-lit co-working space with neon signage, whiteboards covered in startup pitch notes, and energy drink cans on desks"

- "Climate Action Conference" → Theme: "Earthrise Authority"
  Description: "Environmental urgency meets leadership gravitas"
  Visual Language: "Outdoor summit venue with a globe prop, national flags on poles, and a podium against a mountain-and-sky backdrop"

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

✅ CORRECT (Multi-word VISUAL descriptions — creative, fun, visually stunning scene elements):
✅ "Indian women high-fiving over glowing laptop screens at a vibrant hackathon with colorful post-it walls and neon code projections"
✅ "An Indian speaker on a stage with dramatic spotlights, audience silhouettes cheering, and oversized presentation screens showing bold graphics"
✅ "Indian students in a sunlit creative workshop painting on canvases with splashes of color flying through the air"
✅ "Close-up of Indian hands assembling a robot prototype with sparks flying, tools scattered, and a victory trophy glowing in the background"
✅ "Indian youth celebrating at a rooftop event with fairy lights, confetti bursts, city skyline, and giant illuminated event signage"

🔍 VALIDATION CHECKPOINT (Apply to EVERY visualElement before finalizing):
Ask yourself: "If Gemini renders this element, will it create VISUAL SHAPES/PATTERNS or TEXT?"
→ If answer is "TEXT" or "single word", REWRITE to be multi-word visual/geometric/atmospheric description
→ If answer is "SHAPES", keep it

📝 EXAMPLES OF PROPER TRANSFORMATION:
"innovation" → "Indian engineers celebrating a breakthrough with holographic prototypes floating above their workbench as sparks and light trails fill the room"
"networking" → "Indian professionals exchanging ideas in a rooftop lounge at golden hour with city lights twinkling and connecting thread-lights overhead"
"celebration" → "Exuberant Indian crowd tossing colorful powder into the air at an outdoor celebration with stage lights painting the sky"
"leadership" → "A confident Indian woman commanding the stage with dramatic backlighting, silhouetted audience reaching upward, and bold projection screens"
"tech" → "Indian developers in a neon-lit hackathon space with floating holographic code, glowing keyboards, and energetic creative chaos"
"ai" → "Indian researchers surrounded by swirling data visualizations projected in mid-air, faces lit by the glow of discovery"

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
        "hero": { "color": "hex code or name", "contrastRatio": 7.0, "description": "brief rationale (10 words max)" },
        "headline": { "color": "hex code or name", "contrastRatio": 7.0, "description": "brief rationale (10 words max)" },
        "body": { "color": "hex or name", "contrastRatio": 4.5, "description": "brief rationale (10 words max)" },
        "cta": { "color": "hex or name", "contrastRatio": 7.0, "description": "brief rationale (10 words max)" },
        "caption": { "color": "hex or name", "contrastRatio": 4.5, "description": "brief rationale (10 words max)" }
      }
    },
    "decorativeElements": {
      "corners": "corner treatment using event-specific objects (NOT abstract shapes)",
        "patterns": "SCENE-BASED texture from event setting (e.g. chalkboard texture, clinical tile, wooden podium grain) — NEVER abstract waves, geometric shapes, hexagons, mesh, or flowing lines",
          "accents": "CONCRETE objects from event domain (e.g. stethoscope, laptop, microphone) — NEVER abstract accents like flowing lines or particles"
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
          "element": "HIGHLY DETAILED real-world object or scene element (e.g., 'Educational anatomical wall chart with soft pink diagrams pinned to a classroom corkboard')", 
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
  eventProfile?: EventProfile | null,
  promptStyleOptions?: {
    temperatures?: { eventContext?: number | null; storytelling?: number | null }
    creativeDirection?: string // v31.0: Prompt style creative direction
  }
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

  // v30.0: Removed keyword-based content element matching —
  // Storytelling Fusion provides elements via dynamic AI thinking
  let contentElements: ContentElements = {
    elements: [], backgrounds: [], decorativeAccents: [], matchedCategories: []
  }

  console.log('[Design Intelligence] 🎨 v30.0 Dynamic Visual Intelligence Active:', {
    seed: uniquenessSeed,
    mode: 'ai-driven (no keyword presets)'
  })

  // NEW: Declare aiEventContext early so storytelling fusion can use it
  let aiEventContext: AIEventContext | null = null

  // ============================================================
  // v1.0: AI EVENT CONTEXT ANALYSIS (GLOBAL EVENT UNDERSTANDING)
  // ============================================================
  // NEW: Use Claude Sonnet to analyze event context from ALL form data
  // This replaces hardcoded keyword detection with intelligent AI analysis
  // ORDERING FIX: Must run BEFORE storytelling fusion so aiEventContext is populated
  // when fuseStorytellingContext() runs — it was previously always null at fusion time.
  if (shouldUseAIEventAnalysis()) {
    try {
      console.log('[Design Intelligence] 🤖 AI Event Analysis: Starting comprehensive context analysis')

      // Build form data from the design brief
      // FIX: Use additionalContext (clean tagline/description) NOT details (cleanedPrompt)
      // Same noisy-input fix applied to getContentRelatedElements and storytelling fusion.
      const formData: EventFormData = {
        eventName: input.eventName || '',
        eventDescription: [input.additionalContext, input.additionalVisualBrief ? `Visual concept: ${input.additionalVisualBrief}` : ''].filter(Boolean).join('. ') || '',
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

      aiEventContext = await analyzeEventContext(formData, {
        temperature: promptStyleOptions?.temperatures?.eventContext,
        creativeDirection: promptStyleOptions?.creativeDirection,
      })

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
      }
    } catch (error) {
      console.error('[Design Intelligence] ⚠️ AI Event Analysis failed:', error)
      // Continue with normal flow if AI analysis fails
    }
  }

  // v26.0: STORYTELLING FUSION (replaces deduplication)
  // Unifies Event Understanding, AI Context, and Content Mapper into cohesive narrative
  let storytellingContext: StorytellingOutput | undefined

  if (shouldUseStorytellingFusion(input.formatId)) {
    console.log('[Design Intelligence] 🎭 Storytelling Fusion ENABLED')

    try {
      // v29.0: Pass empty contentElements — storytelling fusion now thinks purely
      // from event context + AI analysis, not keyword-matched preset elements
      storytellingContext = await fuseStorytellingContext({
        eventProfile,
        aiEventContext,
        contentElements: { elements: [], backgrounds: [], decorativeAccents: [], matchedCategories: [] },
        eventName: input.eventName || '',
        eventDescription: input.additionalContext || '',
        formatId: input.formatId || '',
        uniquenessSeed,
        temperature: promptStyleOptions?.temperatures?.storytelling,
        creativeDirection: promptStyleOptions?.creativeDirection,
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

An AI analyzer has analyzed ALL form data for this event.
Use these insights as CREATIVE INSPIRATION — not rigid constraints.

MATCHED EVENT CATEGORY: ${aiEventContext.matchedPreset || 'None'}
CONFIDENCE: ${(aiEventContext.presetConfidence * 100).toFixed(0)}%

AI REASONING:
${aiEventContext.reasoning}

SUGGESTED ENHANCEMENTS (adapt creatively):
${aiEventContext.customEnhancements.map((e, i) => `${i + 1}. ${e}`).join('\n')}

SUGGESTED VISUAL ELEMENTS (use as starting points, then innovate):
${aiEventContext.keyVisuals.map((kv, i) => `${i + 1}. ${kv}`).join('\n')}

VISUAL DIRECTION:
${aiEventContext.visualDirection}

MOOD & ATMOSPHERE:
${aiEventContext.moodAtmosphere}

COLOR GUIDANCE:
${aiEventContext.colorGuidance}

These insights come from comprehensive analysis. Use them as a FOUNDATION for your own creative interpretation — NOT as a checklist to copy verbatim. Your job is to CREATE something UNIQUE that captures this event's spirit.

`
        prompt += aiContextBrief
        console.log('[Design Intelligence] 🤖 AI Event Context injected into prompt')
      }

      // v29.0: Replaced hardcoded keyword→domain→visual mapping with dynamic AI thinking
      // The AI Event Context Analyzer (Claude) already identifies the event's true domain.
      // Hardcoded domain mappings were causing the SAME visuals for every event in a category.
      const eventDomainInstruction = `

========================================
⚠️ EVENT VISUAL IDENTITY (v29.0 — DYNAMIC):
========================================

EVENT: "${input.eventName}"

Think about what THIS SPECIFIC event is about. Not the category — the ACTUAL event.
Two "health" events can look completely different:
- "Blood Donation Drive" → dynamic, urgent, life-saving energy
- "Menstrual Health Awareness" → intimate, educational, empowering

DO NOT map event keywords to preset visual categories.
Instead, REASON about what makes THIS event unique and create visuals that could ONLY belong to this event.

`
      prompt += eventDomainInstruction
      console.log('[Design Intelligence v29.0] ✅ Dynamic event identity added for: "${input.eventName}"')

      // v31.0: Inject prompt style creative direction
      if (promptStyleOptions?.creativeDirection) {
        prompt += `

========================================
🎨 CREATIVE STYLE DIRECTIVE (v31.0):
========================================

${promptStyleOptions.creativeDirection}

Apply this creative approach to ALL your design decisions — visual elements, colors, composition, typography, and mood.
This style directive should influence your entire creative output for this design.

`
        console.log('[Design Intelligence v31.0] ✅ Creative style directive injected')
      }

      // v24.12.4: PREMIUM PROFESSIONAL BACKGROUND enhancement
      const premiumBackgroundInstruction = `

========================================
🎨 PREMIUM PROFESSIONAL BACKGROUND (v24.12.4)
========================================

ALL posters MUST have PROFESSIONAL, SCENE-BASED backgrounds that TELL THE EVENT'S STORY:

MANDATORY BACKGROUND APPROACH:
1. SCENE-BASED: The background depicts a REAL ENVIRONMENT or SETTING related to the event topic
2. CONCRETE OBJECTS: Include recognizable objects, tools, and equipment from the event domain
3. DEPTH OF FIELD: Foreground objects crisp, background environment softly blurred (professional photography style)
4. THEMATIC STORYTELLING: The background alone should communicate what kind of event this is
5. PROFESSIONAL POLISH: Premium Canva template quality — structured, intentional, marketing-ready

SCENE EXAMPLES (match to event topic — Indian people OPTIONAL but encouraged):
- Menstrual Health Awareness → An Indian female doctor explaining anatomy to students in a warm classroom with charts on walls, educational materials, whiteboard with health diagrams
- AI/Tech Workshop → Indian professionals collaborating around monitors showing code, circuit boards, whiteboards with architecture diagrams
- Leadership Summit → An Indian speaker at a podium in a prestigious conference hall with projection screens, microphones, and attendees
- Blood Donation Drive → Indian donors and nurses in a clean clinical setting with blood bag stands, donor chairs, red cross signage
- Road Safety Awareness → Indian youth in safety vests at a zebra crossing with traffic signs, cones, and a school bus
- Environmental Campaign → Indian volunteers planting saplings with solar panels, recycling bins, and green energy props
- Cultural Festival → Indian performers on a festive stage with instruments, decorative banners, and art displays

WHAT TO USE vs WHAT TO AVOID:
✅ Real environments and settings where the event would take place
✅ Concrete objects and tools relevant to the event topic
✅ Professional depth-of-field (sharp foreground, soft background)
✅ Color palette that matches the event mood

❌ Abstract waves, flowing lines, mesh patterns, dot grids
❌ Generic geometric shapes with no thematic meaning
❌ Atmospheric particles, bokeh circles, god-rays as primary elements
❌ Plain solid color backgrounds with no scene/setting
❌ Non-Indian or Western-looking faces — if people appear, they MUST look Indian/South Asian

PEOPLE IN SCENES (optional but powerful):
When people would enhance the visual story, include INDIAN PEOPLE (South Asian features, skin tones, culturally appropriate attire) actively engaged in the event activity.
Example: A road safety poster shows Indian youth at a crossing; a health workshop shows an Indian educator with students.
If people are not needed (e.g., abstract tech themes), the environment + objects alone are sufficient.

GOAL: The background should be a VISUAL STORY. A viewer should look at the poster background and
immediately understand: "This is a health education event" or "This is a tech conference."
The scene tells the story — the text confirms it.
Information blocks (date/time/venue) should sit in visually distinct containers, not float on gradients.

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
      // v32.0: Reduced injection — only concept + characteristics, NOT individual visual arrays
      // Visual arrays were being treated as DIRECT instructions by Gemini, causing convergence
      if (eventProfile && eventProfile.confidence >= 0.4) {
        const selectedConceptObj = eventProfile.concepts.find(c => c.name === eventProfile.selectedConcept)
        const eventBrief = `

========================================
EVENT CONCEPT DIRECTION (v32.0 — DO NOT USE LITERALLY):
========================================

EVENT: "${input.eventName}"

LITERAL MEANING: ${eventProfile.literalMeaning}

SELECTED CONCEPT: "${eventProfile.selectedConcept}"
${selectedConceptObj?.description ? `Concept Approach: ${selectedConceptObj.description}` : ''}

EVENT CHARACTERISTICS:
- Formality Level: ${eventProfile.formality}
- Energy Level: ${eventProfile.energyLevel}
- Emotional Tone: ${eventProfile.emotionalTone}

⚠️ CRITICAL (v32.0): Do NOT render the concept literally.
Create an ORIGINAL SCENE that captures the same FEELING and ENERGY as the concept above.
Ask yourself: "What would a photograph of THIS SPECIFIC event look like?"
Then design the poster around that real-world scene — not around abstract symbols or silhouettes.
`
        prompt += eventBrief
        console.log(`[Design Intelligence v32.0] 🎯 Injected Event Concept (reduced): ${eventProfile.selectedConcept} (confidence: ${eventProfile.confidence})`)

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

        // v35.0: Add formality-aware guidelines for premium/exclusive events
        // Changed from "LITERAL IMAGERY REQUIRED" → "BOLD PROFESSIONAL IMAGERY"
        // Premium events (graduation, awards, summits) deserve cinematic, bold compositions
        if (eventProfile.formality === 'premium' || eventProfile.formality === 'exclusive') {
          const formalityBrief = `

========================================
🎯 PREMIUM EVENT MODE (v35.0 - BOLD PROFESSIONAL IMAGERY)
========================================

EVENT FORMALITY: ${eventProfile.formality.toUpperCase()}

This is a premium formal event. Generate DRAMATICALLY STAGED, VISUALLY BOLD imagery
with institutional prestige and gravitas — NOT generic stock-photo environments.

AVOID (Anti-patterns for premium events):
❌ "Gardens of potential" or "forests of growth" — no botanical nature metaphors
❌ "Ascending botanical paths" or "leaf-shaped stairways" — no nature-based concepts
❌ Soft, muted, plain auditorium stock-photo compositions
❌ Floating clip-art objects on plain gradient backgrounds
❌ Generic stock-photography aesthetic — Gemini should surpass this

PREFERRED IMAGERY for premium events (aim for Behance-featured quality):
✅ Bold, dramatically lit environments with cinematic depth and theatrical lighting
✅ Conceptual compositions that feel PRESTIGIOUS and POWERFUL, not just documentary
✅ Graduation/Convocation: REAL South Indian graduates in caps and gowns — faces full of emotion, human moments anchoring the scene. Bold conceptual enhancements welcome (light rays, wings metaphors) but REAL HUMAN FACES must anchor the scene.
   SCENE VARIETY (v35.4 — DO NOT always generate the same scene — rotate for freshness):
   Choose ONE of these distinct compositions based on the event's emotional context:
   - Option A (Intimate): Close-up of Indian graduate's proud face + hands receiving diploma with proud family visible behind in warm blur
   - Option B (Celebration): Group of Indian graduates tossing mortarboards skyward against a golden-hour sky — joyful outdoor energy
   - Option C (Threshold): Graduates walking OUT through grand university doors into bright hopeful light — symbolic launch into the world
   - Option D (Conceptual): Open books unfolding into wings as Indian graduates ascend upward into radiant light — achievement as flight
   ❌ AVOID defaulting to "grand auditorium wide-shot with stage and rows of empty seats" — this is the least emotionally resonant option
✅ Award ceremonies: Bold dramatic spotlight compositions, powerful trophy/award staging
✅ Summit/Conference: Epic venue architecture with cinematic dramatic lighting, bold silhouettes
✅ The scene should feel like a world-class event — the best night of someone's life
✅ Cinematic depth: three-layer compositions (foreground elements + midground focus + background)
✅ Use the event's brand colors boldly — not timidly

COLOR APPLICATION:
- Colors should feel BOLD and CONFIDENT, not restrained or muted
- Use event brand colors as dominant dramatic elements, not just accents
- Warm golden stage lighting, dramatic shadows, and cinematic highlights are encouraged

REASON: Events like "${input.eventName}" deserve visually spectacular compositions that
feel premium because they ARE premium — not because they are plain and conservative.
`
          prompt += formalityBrief
          console.log(`[Design Intelligence] v35.0: 🎯 PREMIUM EVENT MODE ACTIVATED - Bold professional imagery (formality: ${eventProfile.formality})`)
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

  // v35.0: Temperature is format-driven, NOT formality-driven
  // Premium/exclusive events deserve BOLD compositions — do not reduce temperature
  // Only 'professional' events get a mild cap to keep output structured
  let temperature = tempConfig.designIntelligence
  let topP = tempConfig.topP

  if (formality === 'professional') {
    temperature = Math.min(tempConfig.designIntelligence, 1.0) // Cap at 1.0 for professional
    topP = Math.min(tempConfig.topP, 0.95)
    console.log(`[Design Intelligence] v35.0: 🎛️ Temperature adjusted to ${temperature} for professional event`)
  }
  // v35.0: premium/exclusive → no temperature override. Full creative config applies.
  // Graduation, awards, summits need BOLD imagery, not conservative literal output.

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

    // v5.6: Validate colorMapping if present (prevents crashes from truncated AI responses)
    if (parsed.typographyGuidance?.colorMapping) {
      if (!validateColorMapping(parsed.typographyGuidance.colorMapping)) {
        console.warn('[Design Intelligence] Invalid colorMapping detected (truncated or incomplete), removing it to use fallback colors')
        // Remove invalid colorMapping so fallback logic in event-poster.ts kicks in
        delete parsed.typographyGuidance.colorMapping
      } else {
        console.log('[Design Intelligence] ✓ colorMapping validated successfully')
      }
    }

    return parsed as DesignContext
  } catch (error) {
    console.error('[Design Intelligence] JSON Parse Error:', error)
    console.error('[Design Intelligence] Raw JSON:', json.substring(0, 100) + '...')
    throw new Error('Failed to parse design context JSON')
  }
}

/**
 * Get format-specific design guidance
 * v21.0: Now includes event_poster guidance (previously returned empty string)
 */
function getFormatSpecificGuidance(formatId?: string, formatName?: string): string {
  if (!formatId) return ''

  const guidance: Record<string, string> = {
    event_poster: `
=== EVENT POSTER DESIGN CONTEXT ===
Event posters require:
- Bold, eye-catching headlines that drive attendance interest
- Clear date, time, and venue information hierarchy
- Dynamic, engaging backgrounds that match the event type (tech, health, business, etc.)
- Professional yet promotional energy
- Space for speaker photos if applicable (lower content zone)
- Three-band composition: header (logos) > content (text) > footer (partners)
- Visual hierarchy: Event name > Date/Time > Speakers > Details
CRITICAL: Design an EVENT POSTER with promotional energy that drives attendance!`,

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

