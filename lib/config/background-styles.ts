/**
 * Background Styles — single source of truth.
 *
 * Used by:
 *   • UI picker: components/canvas-create/LogosStylePanel.tsx (label + icon)
 *   • Gemini route: app/api/generate/route.ts (designIntelligenceHint injection)
 *   • OpenAI route: app/api/generate-openai/route.ts (designIntelligenceHint injection)
 *
 * Adding a new style = one edit here. The UI and both API routes pick it up.
 *
 * Two parallel style channels (v53.6):
 *   1. `designIntelligenceHint` — flows to the Design Intelligence stage where
 *      Claude paraphrases it. Inevitably sanitized into "professional/balanced/
 *      premium" hedges. Used by OpenAI builder. Kept for backward compat.
 *   2. `geminiStyleLock` — hand-authored prompt fragment injected VERBATIM at
 *      the TOP of the Gemini prompt, before any other section. No LLM ever
 *      paraphrases this. Bypasses agent sanitization so bold style choices
 *      ("dark cinematic", "festive", "duotone") arrive at Gemini EXACTLY as a
 *      designer authored them. This is the user's deliberate creative choice;
 *      it should never be diluted by intermediate agent thinking.
 */
import type { BackgroundStyleId } from '@/lib/prompts/services/yi-prompt-builder/types'

export interface BackgroundStyleOption {
  id: BackgroundStyleId
  label: string
  icon: string
  /**
   * v53.5 and earlier: Injected into `designBrief.additionalVisualBrief` before
   * Design Intelligence runs. Claude paraphrases this, which sanitizes bold
   * style choices. Kept for OpenAI builder compatibility and as a fallback.
   * Absent for `scene` (the default — let the AI freelance based on event content).
   */
  designIntelligenceHint?: string
  /**
   * v53.6: Hand-authored prompt fragment that is injected VERBATIM into the
   * final Gemini prompt. NO LLM rewrites this. Bypasses the describe-then-
   * generate bottleneck (~99.3% perceptual degradation per arxiv 2509.18179)
   * for the style component specifically. Each fragment is ~100-150 tokens of
   * dense, evocative, sensory prose using specific photographic/cinematic
   * vocabulary. Written by a designer once, used forever.
   */
  geminiStyleLock?: string
  /**
   * v54.7: Named designer concepts compatible with this style. The Lab Director
   * picks ONE concept from this menu and writes prose around it. Without a
   * concept, the Director defaults to decoration-assembly (Canva-template
   * output). With a concept, the output has a designer-level point of view.
   * Currently populated for scene, photo-real, dark — other styles get
   * concept-thinking in later phases.
   */
  compatibleConcepts?: Array<{
    name: string
    description: string
  }>
  /**
   * v54.7: Real-world designer / photographer / director / artist references
   * the Director should invoke BY NAME in the prose. Image models recognise
   * these names and produce dramatically more designer-level output than when
   * given generic adjectives. e.g. "in the visual language of Steve McCurry"
   * is worth more than "documentary photographic style."
   */
  designerReferences?: string[]
  /**
   * v54.7: Specific technical craft details required for this style to read as
   * designer-level rather than template. Each entry is a sensory phrase the
   * Director should weave verbatim into the prose. These are the small details
   * that separate "stock-photo lookalike" from "real magazine spread."
   */
  craftSignatures?: string[]
  /**
   * v54.7: Cultural-coding combinations that produce wrong-coded output and
   * must be banned in this style. Director's prose must avoid these combinations.
   * Especially critical for tamil-nadu region where certain visual combinations
   * (marigold petals + portrait + warm golden hour) read as funeral imagery
   * regardless of the event being a birthday or other joyful occasion.
   */
  bannedCombinations?: Array<{
    when: string
    avoid: string
    because: string
  }>
}

export const BACKGROUND_STYLES: BackgroundStyleOption[] = [
  {
    id: 'scene',
    label: 'Realistic',
    icon: '🏞',
    geminiStyleLock:
      'Premium documentary photography. Real Indian people in real Indian venues captured with photojournalistic honesty. Natural ambient light — golden hour warmth or cool indoor stage glow as the venue dictates. 35mm full-frame depth: sharp subject, gently defocused environment. Authentic gestures, candid expressions, no posing. Magazine-quality grain. The image reads as truth, not staging — this happened, this matters, we documented it.',
    compatibleConcepts: [
      {
        name: 'DECISIVE-MOMENT',
        description:
          'Cartier-Bresson photojournalism — capture the single millisecond where everything in the frame aligns into meaning. For an event: the cake just being cut, the runner crossing the finish line, the speaker mid-laugh, the hands meeting in applause. The image is a verb, not a noun.',
      },
      {
        name: 'ENVIRONMENTAL-PORTRAIT',
        description:
          'Steve McCurry / Raghu Rai — subject inhabits a meaningful real place that tells you who they are. Doctor in clinic doorway, teacher beside chalkboard, runner on actual school track at sunrise. The environment carries half the storytelling weight.',
      },
      {
        name: 'INTIMATE-DETAIL',
        description:
          'Tight crop on hands, faces, objects that hold the emotion of the event. A child mid-laugh during a charity run, hands holding a trophy, the candle flame on a cake. The detail is the entire image. Macro depth-of-field.',
      },
      {
        name: 'CANDID-CROWD',
        description:
          'Mary Ellen Mark humanist documentary — multiple real people in genuine interaction, no staged poses, no eye contact with camera. For activity events: kids mid-run together, audience cheering, parents handing water bottles. Wide angle, deep focus, real chaos.',
      },
      {
        name: 'MAGAZINE-COVER-PORTRAIT',
        description:
          'Annie Leibovitz / National Geographic cover — single subject, full-bleed, character-revealing pose and lighting. Used when the brief is one person and the event honours them (recognition, milestone birthday, achievement). Shoulders-up or three-quarter, available light, direct gaze.',
      },
    ],
    designerReferences: [
      'Steve McCurry (Afghan Girl environmental portraiture)',
      'Raghu Rai (Indian documentary photojournalism)',
      'Mary Ellen Mark (humanist street and event documentary)',
      'Annie Leibovitz (character-driven editorial portraiture)',
      'Henri Cartier-Bresson (decisive moment composition)',
    ],
    craftSignatures: [
      '35mm full-frame DSLR aesthetic with ISO 800 available-light authenticity',
      'natural ambient light — golden hour / window light / stage spill — never studio strobe',
      'shallow depth of field at f/2.0–f/2.8 with sharp subject and creamy defocused environment',
      'candid framing — slightly off-centre, room to breathe, gesture caught mid-motion',
      'subtle magazine-print film grain throughout, no glossy retouching, preserved imperfections',
      'colour grading: warm-shadows / cool-highlights subtle teal-and-orange palette',
    ],
    bannedCombinations: [
      {
        when: 'birthday of a living person in tamil-nadu / south-india region',
        avoid: 'marigold petals scattered around a centred portrait + warm golden-hour rim-light + soft cream-and-gold palette + reverent quiet mood',
        because:
          'This exact combination IS the visual language of a Tamil funeral / memorial poster, regardless of the event being a birthday. The person reads as deceased even though they are alive and being celebrated. Use bright daylight, action/expression, modern composition, NOT golden-hour + petals + centred-reverent.',
      },
      {
        when: 'any joyful event involving a respected senior subject',
        avoid: 'centred framed portrait + traditional brass kuthuvilakku oil lamps + ceremonial podium + restrained warm palette',
        because:
          'This is sabha-hall memorial vocabulary. Joyful events for senior subjects need ACTION (smiling, gesturing, with-others) and BRIGHTER LIGHT, not ceremonial-stillness.',
      },
      {
        when: 'charity run / sports / kids event',
        avoid: 'still portrait composition + studio-lit subject + flat background',
        because:
          'These events demand MOTION and ENVIRONMENT. A still studio portrait of a child runner kills the entire premise of "run." Capture mid-stride, real venue, real motion blur on background.',
      },
      {
        when: 'tamil-nadu region for any event',
        avoid: 'temple architecture interior + brass lamps + jasmine garlands + Carnatic-recital staging',
        because:
          'Heritage Tamil temple/devotional codes default to memorial-adjacent reverence. Use ONLY when event is explicitly cultural-religious. Modern Tamil contemporary work lives in Chennai-modernist / Bangalore-startup / urban-editorial vocabulary, not temple vocabulary.',
      },
    ],
  },

  {
    id: 'abstract',
    label: 'Abstract',
    icon: '🎨',
    designIntelligenceHint:
      'STYLE OVERRIDE — USER SELECTED ABSTRACT: Ignore the SCENE-BASED concept preference. DO NOT generate real scenes or Indian people. Generate flowing color gradients, soft geometric shapes, and fluid art in the brand palette. Abstract gradients ARE acceptable here. Use CONCEPT 3 (CONCEPTUAL).',
    geminiStyleLock:
      'Pure form and color. No representation, no figures, no scenes. Flowing gradient fields blend the brand palette like wet ink spreading on paper. Soft geometric blobs drift; chromatic edges blur into one another with no hard boundary. Generous negative space breathes. Rothko color-field discipline meets contemporary digital art. Typography is the only literal element on an otherwise non-literal canvas. Mood: meditative, expressive, gallery-wall premium.',
  },
  {
    id: 'dark',
    label: 'Cinematic',
    icon: '🎬',
    designIntelligenceHint:
      'STYLE OVERRIDE — USER SELECTED DARK CINEMATIC (v50.3): Keep the event scene and people from the original concept, but render with deep cinematic lighting — dramatic side-light on faces, hard rim-light shadows, atmospheric haze, spotlight beams, lens flares in brand accent color. Think Roger Deakins / Bradford Young cinematography: rich shadows, sculpted highlights, intentional darkness around the subjects. People and event details remain the focal point; the darkness frames them. NOT empty atmosphere — composed cinematic scene with people in dramatic light. Use CONCEPT 1 (LITERAL SCENE) with cinematic treatment.',
    geminiStyleLock:
      'Roger Deakins cinematography. The frame lives in shadow — 70% of the canvas is rich darkness, 30% is sculpted highlight. Hard sidelight rakes the subject from one direction; the opposite side falls completely into shadow with zero fill. Spotlight beams cut through atmospheric haze as visible volumetric god-rays. Caravaggio chiaroscuro logic — the darkness IS the subject, the light only reveals what the darkness chooses to show. Lens flare burns at one edge in the brand accent color. Subtle 35mm film grain throughout. Decisively dark — not moody, not merely atmospheric — sculpted. Mood: watched, witnessed, important.',
    compatibleConcepts: [
      {
        name: 'CHIAROSCURO-PORTRAIT',
        description:
          'Caravaggio painting logic. Hard single key light rakes the subject from one direction; the opposite side falls into total black with zero fill. The face is sculpted by shadow. Used when honouring a single accomplished subject (lifetime achievement, leadership recognition, dramatic announcement). NOT for joyful birthdays.',
      },
      {
        name: 'VOLUMETRIC-GOD-RAY',
        description:
          '1917 / Blade Runner 2049 vocabulary. A single beam of light cuts through atmospheric haze as a visible volumetric ray, picking out one element of the scene from total darkness. The light itself is the hero. Used for inaugurations, brand launches, dramatic concept reveals.',
      },
      {
        name: 'SILHOUETTE-AGAINST-LIGHT',
        description:
          'Subject is silhouetted against the only source of light in the frame — the brand-accent-coloured wash. The edges of the figure catch a thin rim; the front falls into darkness. Used for concept events, anonymous-hero stories, mystery-and-reveal narratives.',
      },
      {
        name: 'NIGHT-STAGE-DOCUMENTARY',
        description:
          'Wong Kar-wai stage-spill documentary. The scene is real (concert, ceremony, performance) at night with theatrical stage light spilling across the frame. Coloured haze in brand accent. Real subjects caught in the dramatic light. Used for cultural performances, awards nights, evening events.',
      },
      {
        name: 'RIM-LIT-PROFILE',
        description:
          'Skyfall / The Revenant — a single rim light defines the subject\'s silhouette against a near-black field. Mostly profile view. Used for dramatic single-subject editorial — magazine cover for accomplished leader, dark moody announcement.',
      },
    ],
    designerReferences: [
      'Roger Deakins (Blade Runner 2049, 1917, Skyfall — chiaroscuro cinematography)',
      'Bradford Young (Selma, Arrival — deep shadow African-American skin rendering)',
      'Caravaggio (painting chiaroscuro logic)',
      'Wong Kar-wai (In the Mood for Love — saturated haze and stage-spill)',
      'Annie Leibovitz (dramatic single-key editorial portraiture)',
    ],
    craftSignatures: [
      'roughly 70/30 shadow-to-highlight ratio across the frame',
      'hard single sidelight or key-light from one direction, ZERO fill on the opposite side',
      'volumetric god-rays cutting through visible atmospheric haze',
      'subtle 35mm film grain throughout, especially in the dark regions',
      'lens flare burning at one edge in the brand accent colour',
      'NO smooth gradient backgrounds — atmospheric depth and haze instead',
      'subject\'s skin tones sculpted by light, not flattened by fill',
    ],
    bannedCombinations: [
      {
        when: 'birthday of a living person — any region',
        avoid: 'dark cinematic + portrait + warm-amber rim-light + reverent stillness',
        because:
          'Cinematic + portrait + warm + still reads as MEMORIAL DOCUMENTARY (Sebastiao Salgado memorial work, Errol Morris interview portrait of a deceased subject). For a birthday, switch to the scene/photo-real/festive style — cinematic-dark is the wrong style choice for birthdays of living people. If the user has locked it in, write ACTION (laughing, gesturing) and BRIGHTER ACCENT to fight the memorial coding.',
      },
      {
        when: 'tamil-nadu region with traditional subject (elder, religious figure, classical performer)',
        avoid: 'dark cinematic + brass lamp glow + jasmine garland + temple architecture interior',
        because:
          'This is exactly the visual language of a Tamil sabha-hall memorial portrait. Reverent, candle-lit, brass-warm = funeral hall. Use only when event is explicitly memorial / death anniversary. For other events, drop the brass-lamp / garland / temple vocabulary and lean modern.',
      },
      {
        when: 'charity run / kids / sports / cultural festival',
        avoid: 'dark cinematic + flat black background + still subject',
        because:
          'These events demand MOTION and ENERGY. Dark cinematic kills the joy. If the user has locked dark-cinematic on a joyful event, lean into NIGHT-STAGE-DOCUMENTARY (real night event with stage spill) or VOLUMETRIC-GOD-RAY (light beam picking out runners crossing finish) — never STILL CHIAROSCURO PORTRAIT.',
      },
      {
        when: 'any event with the brief mentioning "celebration / festive / vibrant / joyful"',
        avoid: 'dark cinematic style at all',
        because:
          'Dark cinematic is fundamentally a DRAMATIC style, not a CELEBRATORY one. If the brief explicitly says celebration but the user selected dark-cinematic, the Director should write the prose flagging that the style choice may not serve the brief — but still execute the dark-cinematic style at maximum quality.',
      },
    ],
  },
  {
    id: 'illustrated',
    label: 'Illustrated',
    icon: '✏️',
    designIntelligenceHint:
      'STYLE OVERRIDE — USER SELECTED ILLUSTRATED: Ignore the SCENE-BASED concept preference. Generate flat vector-style illustrated elements — bold icons, clean graphic shapes related to the event theme. Solid fills, no photorealism. Use CONCEPT 2 or CONCEPT 3.',
    geminiStyleLock:
      'Flat vector graphic design. Bold solid color fills in the brand palette, no gradients, no photographic shadows. Crisp 3-5px contour lines on key shapes. Iconic representation — a microphone is a perfect microphone-shape, not a photo of one. Limited palette: brand colors plus one neutral. Sticker-art clarity, Adobe Illustrator pen-tool precision. Mood: clean, energetic, contemporary, scroll-stopping. The image reads instantly from across a room.',
  },
  {
    id: 'bokeh',
    label: 'Bokeh',
    icon: '✨',
    designIntelligenceHint:
      'STYLE OVERRIDE — USER SELECTED BOKEH & LIGHT: Ignore the SCENE-BASED concept preference. Generate soft out-of-focus atmosphere with glowing light orbs and warm sparkle particles in the brand palette. All elements are blurred and dreamy, not sharp or photorealistic. Use CONCEPT 3.',
    geminiStyleLock:
      'Soft out-of-focus dreaming. The entire frame is shot wide open at f/1.4 — nothing is fully sharp. Glowing light orbs in the brand accent color drift across atmospheric blur. Warm sparkle particles catch invisible breath. Bright highlights bloom into hexagonal lens-bokeh shapes. Wong Kar-wai blur logic. Mood: festival night intimacy, magical, ethereal, romantic. The image feels like a memory, not a record.',
  },
  {
    id: 'geometric',
    label: 'Geometric',
    icon: '🔷',
    designIntelligenceHint:
      'STYLE OVERRIDE — USER SELECTED GEOMETRIC PATTERN: Ignore the SCENE-BASED concept preference AND the ban on geometric patterns. Generate bold geometric shapes (hexagons, triangles, diagonal bands, tessellation) in the brand palette. Geometric patterns ARE required here. Use CONCEPT 3.',
    geminiStyleLock:
      'Bauhaus structural composition. Bold geometric shapes in the brand palette — hexagons, triangles, diagonal bands, tessellation grids. Clean mathematical relationships, intentional asymmetry, generous negative space. No organic curves anywhere. Color blocks meet at sharp confident edges. Swiss typography precision. Mood: modernist, tech-forward, architectural, decided. The image reads as designed, not assembled.',
  },
  {
    id: 'texture',
    label: 'Textured',
    icon: '🪨',
    designIntelligenceHint:
      'STYLE OVERRIDE — USER SELECTED TEXTURED MATERIAL: Ignore the SCENE-BASED concept preference. Generate a physical material surface (marble veining, woven fabric, paper grain, brushed metal) tinted in the brand palette. No scenes or people. Use CONCEPT 2.',
    geminiStyleLock:
      'Tactile material world. A physical substrate dominates the frame — Carrara marble veining, handwoven cotton, handmade paper grain, brushed brass, raw concrete — tinted in the brand palette. Subtle directional light reveals the surface\'s grain and depth. Mood: premium, analogue, weighty, real. Editorial print-magazine surface quality. The image makes the viewer want to run their hand across it.',
  },
  {
    id: 'split',
    label: 'Split',
    icon: '▧',
    designIntelligenceHint:
      'STYLE OVERRIDE — USER SELECTED SPLIT LAYOUT: Left half is an event-relevant atmospheric scene; right half is a clean solid brand-color panel where all text will be placed. Sharp or soft diagonal edge separates them.',
    geminiStyleLock:
      'Editorial magazine layout. The canvas divides cleanly in two — left half is an event-relevant photographic moment with shallow depth; right half is a solid flat brand-color panel that holds all typography. A sharp vertical line or soft diagonal edge separates them with confidence. The two halves answer each other — image speaks, panel responds. Mood: editorial, sophisticated, design-conscious, balanced. New York Times Magazine cover discipline.',
  },
  {
    id: 'neon',
    label: 'Neon',
    icon: '⚡',
    designIntelligenceHint:
      'STYLE OVERRIDE — USER SELECTED NEON GLOW: Ignore the SCENE-BASED concept preference. Generate deep near-black background with vivid electric neon light trails, glowing grid lines, bioluminescent halos, and pulsing light streaks in the brand accent color. No realistic scenes or Indian people. Use CONCEPT 3.',
    geminiStyleLock:
      'Blade Runner aesthetic. Deep near-black base. Electric neon light trails in the brand accent color burn across the frame as glowing tubes, pulsing grid lines, bioluminescent halos, luminous light streaks. Wet-asphalt reflections double the light below. Atmospheric mist softens distant glows. Subtle chromatic aberration at the edges. Mood: cyberpunk, after-hours, electric, anticipatory. The image hums.',
  },
  {
    id: 'duotone',
    label: 'Duotone',
    icon: '🎭',
    designIntelligenceHint:
      'STYLE OVERRIDE — USER SELECTED DUOTONE: Ignore the SCENE-BASED concept preference. Generate imagery mapped to exactly TWO brand colors — shadows in primary, highlights in secondary/accent. Bold, high-contrast two-tone treatment. Abstract or silhouette forms only. Use CONCEPT 2 or CONCEPT 3.',
    geminiStyleLock:
      'Risograph print aesthetic. The entire image maps to exactly TWO brand colors — shadows become one color, highlights become the other, no in-between tones. High-contrast silhouettes, simplified forms, intentional screen-print misregistration. Subtle paper grain texture underneath. Mood: bold, graphic, retro-modern, screen-printed. Spotify Wrapped energy. The image feels printed, not rendered.',
  },
  {
    id: 'glassmorphism',
    label: 'Glass',
    icon: '🪟',
    designIntelligenceHint:
      'STYLE OVERRIDE — USER SELECTED GLASSMORPHISM: Ignore the SCENE-BASED concept preference. Generate translucent frosted-glass panels layered over soft gradient blobs or bokeh in brand colors. Clean modern depth, no realistic scenes. Use CONCEPT 3.',
    geminiStyleLock:
      'macOS Big Sur translucency. Multiple frosted-glass panels float in layered depth over soft gradient blobs in the brand palette. Each panel carries a subtle white border glow, a soft offset shadow, and 60-80% backdrop blur. Light catches the panel edges. Mood: clean, modern, premium tech, weightless. Apple design language. The image feels like polished software.',
  },
  {
    id: 'watercolor',
    label: 'Watercolor',
    icon: '🖌️',
    designIntelligenceHint:
      'STYLE OVERRIDE — USER SELECTED WATERCOLOR: Ignore the SCENE-BASED concept preference. Generate soft organic paint washes and flowing pigment spreads in the brand palette. Wet watercolor bleeds, brush strokes, visible paper grain. Purely painterly, no photorealism. Use CONCEPT 3.',
    geminiStyleLock:
      'Botanical illustration meets J.M.W. Turner sky. Soft organic paint washes flow across handmade paper in the brand palette — wet-on-wet bleeds, delicate brush strokes, granulation texture, visible paper grain underneath. Colors blend organically at the edges, never crisp. Subtle pigment lifts and pools. Mood: gentle, artisanal, human, contemplative. The image looks painted by hand, not generated.',
  },
  {
    id: 'mandala',
    label: 'Mandala',
    icon: '🪷',
    designIntelligenceHint:
      'STYLE OVERRIDE — USER SELECTED MANDALA: Ignore the SCENE-BASED concept preference. Generate intricate radial mandala pattern with Indian floral motifs, paisley elements, and traditional ornaments in the brand palette. Symmetrical, ornate, cultural. Gold accents on darker base. Use CONCEPT 3.',
    geminiStyleLock:
      'Mysore temple painting tradition. An intricate radial mandala forms the central background — concentric geometric petal layers, paisley motifs, traditional Indian floral ornaments, jaali screen patterns in the brand palette. Gold leaf accents trace the radial divisions. Bilateral symmetry, sacred geometry, devotional ornament. Mood: cultural, ancestral, ceremonial, contemplative. The image feels venerated.',
  },
  {
    id: 'custom',
    label: 'Custom',
    icon: '🖊️',
    designIntelligenceHint: `STYLE OVERRIDE — AI CUSTOM THEME: Ignore the SCENE-BASED concept preference. Based ONLY on the event details provided (event name, tagline, description, theme, venue), you must creatively decide: (1) a gradient color palette that perfectly matches the event mood and theme, (2) a single thematic visual focal element (object, symbol, or motif) that represents the event, (3) a text style that fits the event energy. Layout: logo bar safe zone top → vivid full-canvas gradient (your chosen colors) → your chosen focal visual centred in upper content zone → event details (headline, tagline, date, venue) BELOW the focal visual → logo bar safe zone bottom. NO photorealistic Indian scenes. Use CONCEPT 2 or CONCEPT 3.`,
    geminiStyleLock:
      'A single full-canvas vivid gradient using two chosen colors that match the event mood. ONE centred iconic symbol or motif holds the focal point — flat or semi-realistic, not a scene, not a person. Decorative motifs frame the symbol if appropriate. The gradient is the world, the symbol is the subject. Mood: editorial, focused, brand-driven, scroll-stopping.',
  },

  // ── New v48.0 styles ─────────────────────────────────────────────────────
  {
    id: 'photo-real',
    label: 'Photo Real',
    icon: '📷',
    designIntelligenceHint:
      'STYLE OVERRIDE — USER SELECTED PHOTO REAL: Generate a 35mm DSLR photograph of the actual event scene. Real Indian people in real Indian venues. Natural shallow depth-of-field with sharp subject and softly defocused background. Warm/cool stage lighting, photojournalistic but premium magazine quality. Subtle film grain or cinema-style color grading. Use CONCEPT 1 (LITERAL SCENE). Avoid illustration, abstract patterns, or graphic-design aesthetics. The image should look indistinguishable from a professional event photographer\'s portfolio.',
    geminiStyleLock:
      'Professional event photojournalism. 35mm DSLR aesthetic — full-frame sensor, natural shallow depth-of-field with sharp subject and softly defocused background, ISO 800 sensitivity for available-light authenticity. Warm tungsten or cool stage spotlight as the venue dictates. Real Indian people in real Indian venues. Cinema-style color grading or subtle film grain. Mood: documentary, premium magazine, photojournalistic honesty. Indistinguishable from a working photographer\'s portfolio.',
    compatibleConcepts: [
      {
        name: 'EDITORIAL-MAGAZINE-COVER',
        description:
          'TIME / Vanity Fair / Vogue India cover treatment. Subject full-bleed, character-revealing lighting, considered editorial composition. The image earns silence before the headline reads. Used for milestone recognitions, leadership features, signature single-person events.',
      },
      {
        name: 'PHOTOJOURNALISTIC-EVENT-COVERAGE',
        description:
          'National Geographic / The Hindu Frontline reportage style. The camera was there at the actual event, captured the actual moment — not a posed reconstruction. Includes the venue, the audience, the ambient details. Used for ceremony coverage, multi-person events, real-world activity.',
      },
      {
        name: 'ENVIRONMENTAL-CHARACTER-PORTRAIT',
        description:
          'Annie Leibovitz / Marco Grob editorial portraiture. Subject is in their meaningful environment (workshop, studio, classroom, race track) but composed with deliberate art-direction. The environment is in soft focus; the character is sharp.',
      },
      {
        name: 'CINEMATIC-ACTION-MOMENT',
        description:
          'Sports Illustrated / Roger Deakins still-frame energy. Caught mid-motion — runner mid-stride, child mid-jump, performer mid-leap — with motion blur on the environment but sharp on the subject. Used for charity runs, sports events, kids in motion, performance moments.',
      },
      {
        name: 'INTIMATE-PORTRAIT-SERIES',
        description:
          'Hassan Hajjaj / Mary Ellen Mark — multiple real subjects framed individually in a series. Each holds the dignity of a single portrait but together tell a community story. Used for community events, awareness campaigns, multi-subject features.',
      },
    ],
    designerReferences: [
      'Annie Leibovitz (Vanity Fair editorial portraiture)',
      'Marco Grob (TIME 100 leader portraits)',
      'Steve McCurry (National Geographic environmental documentary)',
      'Raghu Rai (Indian photojournalistic reportage)',
      'Hassan Hajjaj (vibrant patterned community portraiture)',
      'Roger Deakins (cinematic still-frame composition)',
    ],
    craftSignatures: [
      '35mm full-frame sensor at f/2.0–f/2.8 with creamy shallow depth-of-field',
      'available natural light or single-source studio key (no flat lighting, no ringlight)',
      'cinema-grade colour grading (subtle teal-shadow / warm-highlight) or honest grain',
      'considered composition — rule-of-thirds, leading lines, generous breathing room',
      'preserved skin texture and micro-expression — no plastic retouching',
      'environmental context softly defocused but legible — venue tells half the story',
    ],
    bannedCombinations: [
      {
        when: 'birthday of a living person in tamil-nadu / south-india',
        avoid: 'centred reverent portrait + scattered marigold petals + warm golden hour + soft restrained palette',
        because:
          'IDENTICAL to the visual language of a Tamil memorial poster. The subject reads as deceased regardless of the birthday context. Use ACTION-CAUGHT photography (laughing, mid-gesture, with other people) and BRIGHT DAYLIGHT or saturated festive lighting — NOT golden-hour-reverent-petals.',
      },
      {
        when: 'charity-run / sports / kids event',
        avoid: 'static portrait at studio lighting + flat clean background',
        because:
          'These events live and die on MOTION and ENVIRONMENT. A static portrait drains the entire premise. Capture mid-stride at real venue with motion blur on background, like Sports Illustrated cover photography.',
      },
      {
        when: 'any event with cultural festival theme',
        avoid: 'restrained editorial portrait composition + muted desaturated palette',
        because:
          'Festival events demand SATURATED tropical-festival palette, multi-subject candid energy, real-venue ambient chaos. Editorial restraint kills the celebration. Use PHOTOJOURNALISTIC-EVENT-COVERAGE concept with vibrant ambient light, not magazine-cover portraiture.',
      },
      {
        when: 'tamil-nadu region for any event',
        avoid: 'temple interior + brass lamps + jasmine garlands + Carnatic recital staging',
        because:
          'Heritage Tamil temple/devotional codes default to memorial-adjacent reverence. Use ONLY for explicitly religious/cultural events. Modern Tamil work lives in Chennai-modernist / Bangalore-startup / urban-editorial vocabulary, not temple-vocabulary.',
      },
    ],
  },
  {
    id: 'product',
    label: 'Product',
    icon: '📦',
    designIntelligenceHint:
      'STYLE OVERRIDE — USER SELECTED PRODUCT: ONE event-related symbolic object dominates 60%+ of the canvas as the visual hero. People are secondary or absent. Place the object on a clean or dramatically-lit backdrop with studio-quality lighting and a sharp key light, with subtle rim/fill light. Examples: graduation → cap mid-air against sky; music event → microphone with visualized sound waves; medical drive → stethoscope on clean surface; convocation → scroll/diploma close-up. The object IS the design — bold, scroll-stopping, editorial-magazine feel. Use CONCEPT 2 (OBJECT-AS-HERO). NO crowd scenes, NO venue interiors. Premium catalog/editorial rendering.',
    geminiStyleLock:
      'Apple keynote object photography. ONE event-symbolic object dominates 60%+ of the canvas as the visual hero — graduation cap mid-air, microphone with sound waves, stethoscope on clean surface, scroll, trophy. Studio-quality lighting: sharp key light, subtle rim, soft fill. Seamless backdrop in brand color or neutral. No people, no venue, no clutter. Mood: editorial catalog, museum specimen, decisive, premium. The object is the point.',
  },

  // ── v54.9: Pop Modern — the user's actual brand vibe ──────────────────────
  // This is the aesthetic family that produced the chairperson birthday poster
  // and the Smileathon poster the user explicitly endorsed: Hatecopy + Hassan
  // Hajjaj + vintage Tamil cinema poster + halftone screen-print craft. NOT
  // photorealistic editorial (that's `scene`), NOT clinical flat vector (that's
  // `illustrated`), NOT multi-panel festival (that's `festive`). New default
  // for /lab via Fix #1 v54.9 update — every event automatically gets this
  // aesthetic unless the user explicitly overrides.
  {
    id: 'pop-modern',
    label: 'Pop Modern',
    icon: '🎨',
    designIntelligenceHint:
      'STYLE OVERRIDE — USER SELECTED POP MODERN (v54.9): Modern Indian pop-art poster aesthetic — halftone screen-print craft, bright bold Indian-pop palette (saffron / hot coral / emerald / sunshine yellow / cream), confident retro display typography, thick black outlines, comic-book celebration elements. The poster lineage of Hatecopy + Hassan Hajjaj + vintage Tamil cinema design. NOT photorealistic, NOT clinical flat vector. Use CONCEPT 1 (LITERAL POP-ART SUBJECT) or CONCEPT 2 (BOLD ILLUSTRATED ACTION).',
    geminiStyleLock:
      'Modern Indian pop-art poster design. Halftone screen-print craft throughout — visible coarse dot textures across backgrounds and skin tones, thick black contour outlines on every figure and icon, slight ink-registration offset between color layers, faint paper-grain. Bright bold saturated Indian-pop palette (saffron orange, hot coral / magenta, emerald green, sunshine yellow, cream white) — NEVER muted, NEVER desaturated, NEVER editorial-restrained. Massive confident retro display typography (Druk Wide Heavy, Migra Italic, Obviously Bold, vintage condensed sans) in dual-color stacks with registration offset. Subjects rendered in pop-art screen-print style — illustrated halftones, NOT photorealistic photography, NOT clean Adobe-vector. The poster looks HAND-PRINTED at a Mumbai or Chennai design studio, NOT digitally exported from Canva. Reference: Hatecopy (Maria Qamar) prints, Hassan Hajjaj patterned portraiture, vintage Tamil cinema posters of the 1970s, Shepard Fairey OBEY screen-prints, modern Indian editorial pop. Mood: bright, bold, alive, culturally specific, gallery-wall designer energy.',
    compatibleConcepts: [
      {
        name: 'POP-ART-PORTRAIT',
        description:
          'Hatecopy / Hassan Hajjaj — single subject rendered as pop-art screen-print: halftone-dot skin treatment, bold 2-color palette per face, thick black outline, flat-color clothing. Used for milestone celebrations, birthday tributes to a living respected subject, leadership recognition, single-person feature posters. The subject is the WARM HUMAN HERO treated as a pop-art icon.',
      },
      {
        name: 'BOLD-ILLUSTRATED-CHARACTERS',
        description:
          'Multiple stylised characters (illustrated kids, dancers, runners, students) caught mid-motion or mid-gesture, rendered in modern flat-illustration with halftone backgrounds and thick outlines. Used for charity runs, sports days, kids events, festival activities, community events. Characters are stylised but expressive — full smiles, real motion, diverse representation. Reference: Slack / Duolingo modern brand illustration crossed with Hassan Hajjaj community energy.',
      },
      {
        name: 'HALFTONE-EDITORIAL-COVER',
        description:
          'Magazine-cover composition treated in pop-art print craft — subject (person or object) full-bleed at editorial scale, halftone treatment, bold masthead-style typography in dual-color screen-print stack, considered designer hierarchy. Used for major announcements, leadership covers, anniversary editions, hero-issue features. Vibe: vintage Tamil cinema poster meets contemporary Indian editorial magazine cover.',
      },
      {
        name: 'FOLK-POP-COLLAGE',
        description:
          'Maximalist designer collage layering pop-art elements with hand-cut illustrations and decorative pattern blocks — like a vintage gig poster reinterpreted with modern Indian motifs (jasmine, kolam fragments, banana leaf shapes, marigold petals) treated in pop-art screen-print, NOT heritage temple style. Used for cultural celebrations, anniversaries, multi-element commemorative posters. Reference: Lorenzo Petrantoni collage + Hatecopy palette.',
      },
      {
        name: 'NEON-POSTER-RETRO',
        description:
          'Vintage Tamil cinema neon-poster style — bright signage lettering, sunburst backgrounds, retro star bursts, comic-book speech bubbles in cultural script (Tamil / English), 70s-80s vintage display typography. Used for retro-themed events, alumni nights, throwback celebrations, vintage-coded brand moments. Reference: Tamil "Paint Gang" cinema posters of the 1970s + Shepard Fairey screen-print.',
      },
    ],
    designerReferences: [
      'Hatecopy / Maria Qamar (Indian-Canadian pop-art portraiture with halftone treatment)',
      'Hassan Hajjaj (Moroccan patterned community portraiture, bright saturated palette)',
      'Shepard Fairey OBEY (American screen-print pop-art lineage)',
      'Vintage Tamil cinema poster designers (1970s "Paint Gang" hand-painted poster tradition)',
      'Lorenzo Petrantoni (maximalist designer collage)',
      'Mira Malhotra Studio / Codesign / Itu Chaudhuri Design (modern Indian design studio craft)',
    ],
    craftSignatures: [
      'visible coarse halftone dot texture across skin tones, backgrounds, and color fields',
      'thick confident black contour outlines on every figure, icon, and major shape',
      'slight ink-registration offset between color layers (e.g. coral ghost-layer behind cream-white type) for authentic screen-print feel',
      'bright bold saturated Indian-pop palette — saffron / hot coral / emerald / sunshine yellow / cream — at maximum gamut, never muted',
      'massive confident retro display typography (Druk Wide Heavy, Migra Italic Bold, Obviously Bold, vintage condensed sans) in dual-color stacks',
      'faint paper-grain texture visible across the entire image suggesting hand-printed screen-print on textured stock',
    ],
    bannedCombinations: [
      {
        when: 'any event in any region',
        avoid: 'photorealistic portrait + soft editorial lighting + muted earth-tone palette',
        because:
          'That is the photo-real / scene aesthetic family — completely different from pop-modern. Pop-modern is NEVER photoreal. If the user wanted photoreal they would have picked Realistic or Photo Real. Always render subjects in pop-art halftone illustration style, NOT photographic.',
      },
      {
        when: 'any tamil-nadu / south-india brief',
        avoid: 'heritage temple architecture + brass kuthuvilakku lamps + jasmine garland framing portrait + Carnatic-recital ceremonial staging',
        because:
          'Heritage Tamil devotional codes default to memorial-adjacent reverence and conflict with the modern-pop poster vibe. Tamil cultural references in pop-modern come through MODERN POP TREATMENT of Indian elements (Tamil typography in bold modern weight, jasmine as small pop-art icon, kolam as halftone graphic fragment) — NOT as full heritage staging.',
      },
      {
        when: 'birthday of a living person',
        avoid: 'warm-golden-hour rim-light + scattered petals + centred-reverent quiet portrait composition',
        because:
          'Even in pop-modern, this combination triggers Tamil funeral-poster reading. Use halftone POP-ART-PORTRAIT concept with BRIGHT BOLD POP energy, smiling-mid-laugh expression, no memorial vocabulary anywhere. The subject is celebrated AS AN ICON, not honoured posthumously.',
      },
      {
        when: 'any event',
        avoid: 'clean Adobe-Illustrator flat-vector aesthetic + crisp 3px-contour-line icons + clinical sticker-art',
        because:
          'That is the illustrated style family — completely different from pop-modern. Pop-modern is messier, hand-printed, screen-print-textured. If output reads as clean digital vector, it has slipped to the wrong aesthetic family. Halftone dots and registration offset are mandatory.',
      },
    ],
  },

  // ── v54.10: Photo Pop — FUSION (real photo + pop-art design language) ────
  // The third aesthetic family. Real photograph of the subject (preserved from
  // reference photo when uploaded, OR Gemini-generated photorealistic likeness
  // when no reference) sits at the centre of the composition, BUT everything
  // else — typography, background, graphic overlays, decorative elements — is
  // rendered in the pop-art design language. The real human face anchors
  // believability; the pop design language carries the energy. Reference: Vogue
  // India magazine covers, TIME magazine covers, Spotify Wrapped artist cards,
  // Apple campaign posters, David Carson's Ray Gun magazine, Hassan Hajjaj
  // photographed-portrait-with-patterned-frame work.
  {
    id: 'photo-pop',
    label: 'Photo Pop',
    icon: '📸',
    designIntelligenceHint:
      'STYLE OVERRIDE — USER SELECTED PHOTO POP (v54.10): FUSION aesthetic — real photographic portrait of the subject (preserved from reference photo when provided, otherwise Gemini-generated photoreal likeness) PLUS pop-art design language for everything around them (halftone background, bold pop typography, graphic overlays, designer color blocks). The real human face anchors the composition; the pop design carries the energy. Reference: Vogue India magazine cover meets Spotify Wrapped meets Apple campaign poster. Use CONCEPT 1 (LITERAL PHOTO SUBJECT WITH POP OVERLAYS).',
    geminiStyleLock:
      'Photo-Pop fusion poster design. The subject is rendered as a REAL PHOTOGRAPH — preserved skin texture, real depth-of-field, natural lighting on the face, authentic micro-expression. NOT halftone-illustrated (that would be pop-modern). The photographic subject is isolated or cutout against a bright pop-art design field — bold solid-color blocks in Indian-pop palette (saffron, hot coral, emerald, sunshine yellow, cream) often with halftone-dot texture on the background ONLY (not on the subject\'s face). Around and behind the subject, designer pop-art overlays — massive custom-stacked typography in dual-color screen-print (Druk Wide Heavy / Migra Italic Bold) with ink-registration offset, comic-book starburst graphics, speech bubbles with handwritten script, decorative dot patterns, thin emerald hairline rules. A subtle thick black contour outline around the photographic subject helps it sit as a confident designer cutout against the pop background. Reference: Vogue India / TIME / Spotify Wrapped 2023 / Apple iPod silhouette posters / David Carson Ray Gun magazine / Hassan Hajjaj photographed portraits with patterned frames. Mood: bright, designer-magazine-cover energy, real human warmth meets pop-art design confidence.',
    compatibleConcepts: [
      {
        name: 'PHOTO-PORTRAIT-ON-POP-FIELD',
        description:
          'Real photographic portrait of a single subject (preserved from reference photo OR Gemini-generated photoreal) cutout and floated on a bright halftone-dot color-block field. Massive pop-art typography frames the portrait. Thick black designer outline around the subject. Used for birthday celebrations, leadership recognition, single-person feature covers, milestone moments. The face is REAL; everything else is pop.',
      },
      {
        name: 'PHOTO-ACTION-WITH-POP-OVERLAYS',
        description:
          'Real photograph of subject(s) in motion (kids running, dancers leaping, students cheering) with pop-art graphic overlays — sunburst graphics, comic motion-lines in cream-white, custom bold typography, speech bubbles. The motion photography stays real; the design vocabulary is pop. Used for charity runs, sports events, kids events, festival moments.',
      },
      {
        name: 'EDITORIAL-PHOTO-MAGAZINE-COVER',
        description:
          'Vogue India / TIME magazine cover composition — real photographic portrait at full-bleed scale with bold pop-art typography as overlay (masthead-style event name across the top, cover-line tagline overlapping the subject\'s shoulder, supporting credit lines at the bottom). Cover-cutout-headline tradition done with pop design language. Used for major announcements, anniversary covers, hero leadership features.',
      },
      {
        name: 'PHOTO-CUTOUT-COLLAGE',
        description:
          'Multiple real photographic cutouts of different subjects arranged on a bright color-block background with pop-art graphic ties (arrows, dotted lines, speech bubbles) connecting them. Each photo is preserved as REAL; the arrangement and design language is pop-collage. Used for team events, community celebrations, group features, multi-leader compositions.',
      },
      {
        name: 'REAL-DOCUMENTARY-POP-FRAME',
        description:
          'Real documentary photograph of a venue, scene, or activity, with a pop-art designer frame treatment — thick saffron border, custom typography wrapping the photo, halftone dot accents in the corners, decorative pop elements at edges. The photo is preserved as honest documentary; the frame is pop. Used for venue-based events, location-driven briefs, real-place celebrations.',
      },
    ],
    designerReferences: [
      'Vogue India magazine covers (photographic portrait + bold masthead typography)',
      'TIME magazine covers (real photo + iconic typography overlay)',
      'Spotify Wrapped 2023 artist cards (real artist photo + pop design language)',
      'Apple "Shot on iPhone" / iPod silhouette campaign posters (real photo + bold graphic field)',
      'David Carson Ray Gun magazine spreads (real photo + experimental pop typography)',
      'Hassan Hajjaj photographed portraits with patterned designer frames (gallery photo-pop tradition)',
    ],
    craftSignatures: [
      'subject rendered as a REAL photograph with preserved skin texture, real depth-of-field, natural light on the face — NEVER halftone-illustrated',
      'photographic subject isolated or cutout against bright pop-art design field — clean separation between real and pop',
      'subtle thick black contour outline around the photographic subject for designer cutout feel',
      'halftone-dot pattern appears ONLY in the background, NEVER on the subject\'s skin',
      'massive custom-stacked pop typography overlaid in dual-color screen-print with ink-registration offset',
      'pop graphic overlays (starburst, speech bubbles, dot patterns) layered around the subject, NOT on it',
    ],
    bannedCombinations: [
      {
        when: 'any event in any region',
        avoid: 'halftone-dot treatment of the subject\'s face / skin / expression',
        because:
          'That is the pop-modern aesthetic family — halftone illustration of the human. Photo-pop keeps the subject REAL and photographic. If the face has visible halftone dots on the skin, the output has slipped into pop-modern. The contrast between real face and pop background IS the designer point.',
      },
      {
        when: 'any event in any region',
        avoid: 'fully photorealistic background scene with no pop design elements',
        because:
          'That is the photo-real / scene aesthetic family — pure photojournalism. Photo-pop MUST include pop-art design language in typography, background field, and graphic overlays. If the background is a realistic venue / sky / room with no halftone or color-block treatment, the output has slipped into photo-real.',
      },
      {
        when: 'birthday of a living person in tamil-nadu / south-india',
        avoid: 'real photo + warm golden-hour rim-light + scattered marigold petals + reverent centred composition',
        because:
          'Even with pop overlays, this combination triggers Tamil funeral-poster reading. Use bright daylight on the face, smiling-mid-laugh expression, and ensure the pop typography + bright halftone field overpower any reverent coding from the photographic portrait.',
      },
      {
        when: 'any event',
        avoid: 'photographic background + photographic subject + photographic typography styling',
        because:
          'Without pop-art design elements somewhere in the composition, this is not photo-pop — it has slipped to plain editorial photo. Ensure at least ONE of these is decisively pop: bold custom-stacked dual-color typography, halftone-dot background field, comic starburst or speech bubble graphic, designer color-block frame.',
      },
    ],
  },

  // ── v50.3: Festive Celebration — for cultural/youth/celebration events ─────
  {
    id: 'festive',
    label: 'Festive',
    icon: '🎉',
    designIntelligenceHint:
      `STYLE OVERRIDE — USER SELECTED FESTIVE CELEBRATION (v50.3): This is a VIBRANT, ILLUSTRATED, MULTI-ZONE celebration poster — think Indian festival aesthetics, cartoon-style illustrated figures, multiple activity panels. ` +
      `IGNORE the strict brand-color enforcement: use a VIVID NON-MUTED palette (hot pink, electric purple, warm orange, golden yellow, turquoise) that matches youth-festival energy — brand colors may appear as accents but NOT as dominant background. ` +
      `COMPOSITION: split the canvas into 3-5 illustrated activity zones (one per listed activity: dance / music / stage events / etc), each with its own cartoon illustration of that activity. Tie them together with a "concept-as-visual-device" connector — a flowing ribbon, a pulse wave, a string of festoons, or a winding path. ` +
      `INDIAN CULTURAL MOTIFS REQUIRED: decorative borders in mandala / paisley / kolam style framing the corners and edges. Confetti, sparkles, fireworks at the top. ` +
      `STYLE: flat illustrated / sticker-art / festival-graphic — NOT photorealistic. NOT serious. NOT dark. Cartoon-style happy people in motion across the activity zones. ` +
      `Use CONCEPT 3 (CONCEPTUAL METAPHOR) with the visual device unifying the activity zones. The whole poster should feel like a vibrant Indian festival flyer — Diwali / Holi / cultural fest energy.`,
    geminiStyleLock:
      'Diwali greeting flyer energy. Saturated tropical palette — marigold orange, peacock teal, hot magenta, sunshine yellow — at maximum gamut, no muted tones, no corporate restraint. Multi-panel composition divides the canvas into 3-5 illustrated activity zones connected by a flowing visual device (ribbon, pulse wave, festoon string). Each zone holds a cartoon-style happy figure mid-motion — dancers leaping, students cheering, performers gesturing. Mandala and kolam borders frame the corners; confetti and sparkle showers fill the upper third. Flat illustrated sticker-art with vibrant outline weight. Mood: celebration is the point. Loud, warm, communal, alive.',
  },

  // ── v55.0: Creative-style expansion (illustrated / cultural / typographic / retro) ─────
  {
    id: 'hand-drawn',
    label: 'Hand-Drawn',
    icon: '✍️',
    designIntelligenceHint:
      'STYLE OVERRIDE — USER SELECTED HAND-DRAWN: Ignore the SCENE-BASED concept preference. Generate a hand-drawn illustrated poster — inked contours with visible pencil under-sketch, marker/crayon fills, cross-hatching, paper grain. Warm and imperfect, NOT photorealistic, NOT flat-vector-clean. Use CONCEPT 2 or 3.',
    geminiStyleLock:
      'Hand-drawn illustration. Every line looks made by a human hand — slightly wobbly ink contours, visible pencil under-sketch, cross-hatching and marker fills that don\'t quite stay inside the lines. Imperfect, warm, characterful, in the editorial-illustration spirit of Christoph Niemann or a beautifully kept travel sketchbook. Textured paper showing through. Mood: human, honest, charming, anti-AI-slop. The image feels drawn, not generated.',
  },
  {
    id: 'naive',
    label: 'Playful',
    icon: '🌈',
    designIntelligenceHint:
      'STYLE OVERRIDE — USER SELECTED NAIVE / PLAYFUL: Generate a childlike, playful illustrated poster — chunky rounded shapes, smiley motifs, uneven hand-filled colour, scratchy outlines, simple grinning characters. Joyful and imperfect. NOT photorealistic, NOT corporate-clean. Use CONCEPT 2 or 3.',
    geminiStyleLock:
      'Naive playful illustration. Childlike and joyful — smiley suns, chunky rounded shapes, uneven hand-filled colour, scratchy crayon outlines, characters with simple dot eyes and big grins. Zero polish, maximum charm — contemporary "naive design" / Gen-Z sticker art crossed with Keith Haring energy and a happy kid\'s drawing. Bright primary-leaning palette. Mood: happy, human, unselfconscious, instantly likeable. The image feels made with a shaky hand and zero regrets.',
  },
  {
    id: 'papercut',
    label: 'Paper-Cut',
    icon: '📄',
    designIntelligenceHint:
      'STYLE OVERRIDE — USER SELECTED PAPER-CUT: Build the poster from layered cut-paper shapes with crisp edges and soft real drop-shadows between layers, matte construction-paper texture, no within-shape gradients. Handcrafted paper-collage depth, generous negative space. Use CONCEPT 2 or 3.',
    geminiStyleLock:
      'Layered paper-cut craft. The whole image is built from cut sheets of coloured paper stacked in shallow depth — each shape has a crisp edge and casts a soft real drop-shadow onto the layer beneath, creating tactile dimensionality. Matte construction-paper texture, no gradients within shapes — a handcrafted papercraft diorama or a modern paper-art editorial cover. Generous negative space. Mood: tactile, premium-handmade, warm, considered. The image looks physically cut and assembled.',
  },
  {
    id: 'patriotic',
    label: 'Tricolour',
    icon: '🇮🇳',
    designIntelligenceHint:
      'STYLE OVERRIDE — USER SELECTED PATRIOTIC / TRICOLOR: Generate a clean Indian patriotic vector poster — saffron/white/green tricolour swoosh, Ashoka-chakra navy accent, monument and map silhouettes, generous white space, flat vector. For Independence/Republic Day and national-pride events. Use CONCEPT 2 or 3.',
    geminiStyleLock:
      'Indian patriotic vector poster. A confident tricolour visual language — saffron, white and India-green organised with vector cleanliness: a flowing tricolour swoosh or ribbon, the navy Ashoka chakra as a precise accent, silhouettes of national monuments (India Gate, Qutub Minar) and a green map of India along a lower band. Flat vector, crisp generous white breathing space, one bold headline. Mood: proud, dignified, civic, clean — national-day done with modern restraint, never gaudy.',
  },
  {
    id: 'folk-art',
    label: 'Folk Art',
    icon: '🪔',
    designIntelligenceHint:
      'STYLE OVERRIDE — USER SELECTED INDIAN FOLK-ART: Render in a traditional Indian folk style — Warli stick-figures, Madhubani dense pattern, or Pattachitra ornament — flat, symbolic, hand-painted, natural-pigment palette. Cultural and authentic. Use CONCEPT 2 or 3.',
    geminiStyleLock:
      'Indian folk-art illustration. Rendered in the hand of a traditional regional craft — Warli\'s white stick-figures on earth-red, Madhubani\'s dense black-outlined motifs filled with fine pattern, or Pattachitra\'s ornate borders. Flat, symbolic, pattern-rich, devotional. Natural-pigment palette: terracotta, ochre, indigo, lamp-black, off-white. Hand-painted texture on a matte ground. Mood: rooted, cultural, handmade, timeless. The image honours a living folk tradition.',
  },
  {
    id: 'typographic',
    label: 'Typographic',
    icon: '🔠',
    designIntelligenceHint:
      'STYLE OVERRIDE — USER SELECTED TYPOGRAPHIC: Make typography the hero — the event name set massive, letterforms as graphic shapes filling the frame, mixed weights/sizes, type bleeding off edges, minimal imagery, bold colour blocking behind the type. Use CONCEPT 3 (type-as-subject).',
    geminiStyleLock:
      'Typography IS the poster. The event name is the hero image — set massive, letterforms treated as graphic shapes that fill the frame, mixing weights and sizes, one word oversized or rotated, type that bleeds off the edges. Minimal or no pictorial imagery; the words carry all the energy. Swiss type-poster discipline meets a contemporary type-collage editorial cover, with confident colour blocking behind the type. Mood: bold, authored, expressive, instantly attention-grabbing. The composition is built from letters, not pictures.',
  },
  {
    id: '3d-render',
    label: '3D Render',
    icon: '🧊',
    designIntelligenceHint:
      'STYLE OVERRIDE — USER SELECTED 3D RENDER: Generate a glossy CGI 3D render — inflatable / claymation / polished-plastic forms, studio lighting, soft contact shadows, subsurface glow, seamless gradient backdrop. Cinema 4D / Octane look. Use CONCEPT 2 (object-as-hero) or 3.',
    geminiStyleLock:
      'Glossy 3D render. The scene is built in CGI — soft-body inflatable shapes, claymation-smooth objects, or polished plastic forms with realistic studio lighting, soft contact shadows and gentle subsurface glow. Rounded, tactile, slightly squishy — a Cinema 4D + Octane render in the current Pinterest 3D-trend aesthetic, Apple-keynote object energy. Clean seamless gradient backdrop. Mood: modern, premium, playful-tech, scroll-stopping. The image looks rendered in 3D software, crisp and dimensional.',
  },
  {
    id: 'retro',
    label: 'Retro',
    icon: '📻',
    designIntelligenceHint:
      'STYLE OVERRIDE — USER SELECTED RETRO / VINTAGE: Generate a 70s-style retro poster — sun-faded mustard/orange/avocado/cream palette, rounded retro display type, halftone grain, a big setting-sun arc with concentric rings, off-register print texture. Nostalgic and warm. Use CONCEPT 2 or 3.',
    geminiStyleLock:
      'Retro print nostalgia. 1970s travel-poster and vintage-advertising warmth — a sun-faded palette of mustard, burnt orange, avocado and cream, thick rounded retro display type, halftone grain, a big setting-sun arc with concentric rings. Slightly off-register print texture, like a mid-century WPA poster meeting a 70s album sleeve. Mood: warm, nostalgic, optimistic, analogue. The image feels printed decades ago and lovingly kept.',
  },
  {
    id: 'art-deco',
    label: 'Art Deco',
    icon: '🏛️',
    designIntelligenceHint:
      'STYLE OVERRIDE — USER SELECTED ART DECO: Generate a 1920s-30s Art Deco poster — symmetrical stepped / sunburst geometry, gold linework on deep jewel tones, streamlined glamour, elegant deco display type. Premium and ceremonial. Use CONCEPT 3.',
    geminiStyleLock:
      'Art Deco grandeur. Symmetrical geometric elegance — stepped ziggurat forms, sunburst fans, fluted vertical lines, fine gold linework on deep jewel tones (emerald, sapphire, oxblood). Streamlined 1920s-30s glamour, Gatsby-poster opulence, Chrysler-Building geometry. Precise, ornamental, luxurious, with elegant high-contrast deco display type. Mood: premium, ceremonial, glamorous, timeless. The image feels gilded and grand.',
  },
  {
    id: 'collage',
    label: 'Collage',
    icon: '🗞️',
    designIntelligenceHint:
      'STYLE OVERRIDE — USER SELECTED MAXIMALIST COLLAGE: Generate a mixed-media collage — torn paper, cut-out photo fragments, halftone newsprint, washi-tape, marker scribbles, stamped type, layered busy-but-balanced. Zine / scrapbook energy. Use CONCEPT 2 or 3.',
    geminiStyleLock:
      'Maximalist mixed-media collage. A rich, intentional pile-up — torn-paper scraps, cut-out photo fragments, halftone newsprint, washi-tape, marker scribbles, stickers and stamped type layered into a busy-but-balanced composition. Visible tape, torn edges, photocopied texture — a zine cover or scrapbook art-board, chaotic-yet-curated. Mood: energetic, youthful, handmade, expressive. The image feels physically assembled from many materials, not generated.',
  },

  // ── Spotlight Event — the classic Yi chapter event-poster look. ───────────────
  // NOTE: distinct from creativeMode 'spotlight' (a generation mode) and format id
  // 'event_poster' (a format). This is a STYLE: a layout + colour/lighting treatment.
  // It dictates how the hero + text are lit, coloured and arranged — it does NOT supply
  // the hero (speaker photo or AI-generated subject), the text (form data) or the logos
  // (overlay pipeline). A style-only reference image is attached for it in the Lab route.
  {
    id: 'spotlight-event',
    label: 'Spotlight Event',
    icon: '🌟',
    designIntelligenceHint:
      'STYLE OVERRIDE — USER SELECTED SPOTLIGHT EVENT: A bright, structured institutional event poster. A real photographed hero (the supplied speaker portrait, or an AI-generated subject true to the event context) sits on a vibrant gradient field. A bold condensed headline with a contrasting colored competition / category sub-line band, a rounded date chip, a thin time / venue / submission detail strip, and a flat city-skyline silhouette footer. The TOP zone is left clean and empty for the logo overlay — render NO logos. Render NO text that is not supplied in the brief. Bright daylight, confident hierarchy. Use CONCEPT 1 (photo hero + headline band).',
    geminiStyleLock:
      'Bright, structured event-poster design. A vibrant saturated gradient field (e.g. green→orange or the brand palette) fills the canvas in clean daylight, never dark or muted. The hero — a real photographed person or group, sharp and brightly lit, mid-expression — anchors the upper-middle as a confident cut-out or in-scene subject. Below sits a bold condensed sans-serif headline with a contrasting COLORED sub-line band naming the competition or category, a rounded pill date chip, and a thin detail strip for time / venue / submission window. A flat city-skyline silhouette anchors the footer. Generous structured hierarchy — headline reads first, then the colored sub-line, then the details. The TOP strip stays clean and uncluttered (the logo row is composited separately — draw NO logos). Mood: bright, official, energetic, scroll-stopping. The hero and all text are provided by the brief; this style only governs colour, lighting, composition and type hierarchy.',
    compatibleConcepts: [
      {
        name: 'PHOTO-HERO-HEADLINE-BAND',
        description:
          'A real photographed hero (speaker portrait or context-true subject) occupies the upper-middle; a bold headline with a contrasting colored competition / category sub-line band sits below, with a date chip and detail strip beneath. The classic Yi event-poster structure. Used for competitions, speaker events, school / college programmes, awareness drives.',
      },
      {
        name: 'BRIGHT-GRADIENT-CUTOUT',
        description:
          'A vibrant saturated gradient field with the hero as a clean brightly-lit cut-out, structured type hierarchy stacked confidently. Used when the subject is a person or small group and the energy should read bright, modern and official.',
      },
      {
        name: 'ANNOUNCEMENT-COVER-WITH-SKYLINE',
        description:
          'A clean editorial announcement layout — big headline, colored sub-line, date + venue detail strip — anchored by a flat city-skyline silhouette footer and clean negative space. Used for chapter announcements, forums, conclaves, registration drives.',
      },
    ],
    designerReferences: [
      'modern Indian institutional / chapter event posters (Young Indians, CII chapter campaign graphics)',
      'match-day / sports announcement key visuals (bold headline band + photographed hero + date chip)',
      'editorial conference & forum key visuals (clean type hierarchy, bright structured layout)',
    ],
    craftSignatures: [
      'vibrant saturated gradient field in bright daylight — never dark, never muted',
      'real photographed hero, sharp and brightly lit, mid-expression — speaker portrait or context-true subject',
      'bold condensed sans headline with a contrasting COLORED competition / category sub-line band',
      'rounded pill date chip plus a thin time / venue / submission detail strip',
      'flat city-skyline silhouette anchoring the footer',
      'top strip left clean and empty for the separately-composited logo row',
    ],
    bannedCombinations: [
      {
        when: 'any event',
        avoid: 'rendering logos, logo placeholders, or branded logo boxes anywhere in the image',
        because:
          'The Yi / ONE / CII logo row is composited by the logo-overlay pipeline into the reserved top zone. Any Gemini-drawn logo collides with the overlay. Keep the top strip clean and logo-free.',
      },
      {
        when: 'a style reference image is attached',
        avoid: 'reproducing the reference poster\'s specific people, headline text, date, or logos',
        because:
          'The reference is a STYLE quality-bar only. The hero comes from the speaker photo or AI subject, and all text comes from the brief. Copying the reference\'s content produces the wrong event.',
      },
      {
        when: 'any event',
        avoid: 'dark / muted / cinematic / low-key palette and moody single-key lighting',
        because:
          'Spotlight Event is deliberately bright, daylit and structured. A dark cinematic treatment is a different style (use "dark" instead).',
      },
      {
        when: 'birthday / memorial of a person in tamil-nadu / south-india',
        avoid: 'warm golden-hour rim-light + scattered marigold petals + reverent centred portrait',
        because:
          'That combination reads as a Tamil funeral / memorial poster. Use bright daylight, a smiling mid-action expression, and the modern colored band + skyline structure.',
      },
    ],
  },

  {
    id: 'advertising',
    label: 'Advertising',
    icon: '📣',
    designIntelligenceHint:
      'STYLE OVERRIDE — USER SELECTED ADVERTISING: Render as premium advertising key art / campaign billboard. A strong hero (person, product or object) anchored inside a RICH, FULLY-REALIZED, ON-THEME ENVIRONMENT that fills the frame — a real campus, arena, kitchen, workshop or street — NOT a lone figure floating on a flat empty colour field. Bold cinematic angle, hero tack-sharp with shallow depth of field, dramatic high-contrast commercial lighting (hard key, crisp speculars, deep sculpted shadows, brand-accent rim-light). Saturated confident advertising colour grade using the WHOLE brand palette. A clean uncluttered area is left for oversized typography. Do NOT depict real recognisable celebrities or named athletes — use generic / anonymous heroes only. Use CONCEPT 1 (LITERAL SCENE) with bold commercial treatment.',
    geminiStyleLock:
      'Premium advertising key art. A strong hero — a person, product or object — anchored inside a RICH, FULLY-REALIZED, ON-THEME ENVIRONMENT that fills the frame edge-to-edge and does half the storytelling (a real campus courtyard, arena, kitchen, workshop or street — NEVER a flat empty colour field behind a floating cut-out). Shot from a bold cinematic angle, the hero tack-sharp at f/2.8 while the environment falls into rich photographic depth behind. High-contrast commercial lighting: a hard key with crisp specular highlights, deep sculpted shadows, and a coloured brand-accent rim separating the hero from the setting. Saturated, confident advertising colour grade that distributes the WHOLE brand palette across the frame (no single colour drowning the others). Composition leaves one clean, uncluttered area for oversized billboard typography. The image reads like a Nike stadium campaign or a premium food / product ad — polished, dramatic, the setting unmistakable.',
    compatibleConcepts: [
      {
        name: 'ENVIRONMENTAL-CAMPAIGN-SCENE',
        description:
          'The hero placed INSIDE a real, fully-realized, on-theme setting that fills the frame and does half the storytelling — students striding through a sunlit campus courtyard toward a grand archway, athletes on an actual floodlit pitch, a chef in a working kitchen. Like a Nike stadium ad or a styled food campaign: a believable place, deep photographic layers, dramatic light. The environment instantly tells you WHAT category this is. This is the default for promotional posters.',
      },
      {
        name: 'HERO-IN-CONTEXT',
        description:
          'One product or object as hero, but styled in a real environment with supporting props and warm set lighting (a burger plated on a real table with fries and a drink; a trophy on a stadium plinth; a book on a designer desk) — NOT floating on an empty gradient. The setting sells the product.',
      },
      {
        name: 'CINEMATIC-KEY-ART',
        description:
          'Movie-poster one-sheet logic — the hero stands within a dramatic real location, shot from a heroic low angle with atmospheric depth, backlight and haze, conveying scale and gravitas. For flagship events, summits and big reveals.',
      },
      {
        name: 'DYNAMIC-ACTION-FREEZE',
        description:
          'High-speed strobe freezes the hero mid-motion (mid-stride, mid-serve, mid-celebration) WITHIN a real venue — the action happens in a recognisable place, not against a blank field. For sports days and high-energy events. Use sparingly; prefer ENVIRONMENTAL-CAMPAIGN-SCENE unless the brief is explicitly about athletic motion.',
      },
      {
        name: 'BOLD-CAMPAIGN-TYPO',
        description:
          'Oversized headline typography is co-equal with the imagery, set as a confident block over (or beside) a real scene — like an out-of-home billboard. The type carries weight, but it sits on a fully-realized environment, never on a bare gradient.',
      },
    ],
    designerReferences: [
      'Tim Tadder (high-speed dramatic athlete & sports advertising photography)',
      'Erik Almås (cinematic commercial composites with rich environments)',
      'Annie Leibovitz (subjects placed in meaningful, fully-realized settings)',
      'Nick Knight (high-fashion advertising drama and lighting)',
      'Nike stadium / out-of-home campaign key art',
      'premium food & beverage advertising photography (styled set, warm light)',
    ],
    craftSignatures: [
      'a real, fully-realized, on-theme ENVIRONMENT filling the frame edge-to-edge — the setting does half the storytelling and the poster instantly reads as its category',
      'deep photographic layers — foreground hero, mid-ground action, background environment receding into rich depth (never a flat backdrop)',
      'shallow depth of field at f/2.0–f/2.8 — tack-sharp hero with the environment softly falling away behind',
      'hard commercial key light with crisp specular highlights and a brand-accent rim-light separating the hero from the setting',
      'bold low / dynamic camera angle for heroic scale',
      'saturated high-contrast advertising colour grade that distributes the WHOLE brand palette across the frame — no single colour drowning the others',
      'one clean, uncluttered area reserved for oversized billboard typography',
    ],
    bannedCombinations: [
      {
        when: 'this advertising style is selected',
        avoid: 'a single subject floating on a flat, empty colour gradient with no real environment — surrounded by generic scattered particles, sparkles or props (e.g. a student jumping with flying books on a plain field)',
        because:
          'That is the stock-poster cliché and the #1 failure of this style. Premium campaign key art — like a burger styled on a real table or athletes on a real floodlit pitch — ALWAYS anchors the hero in a fully-realized environment that fills the frame and tells you the category at a glance. Build the SCENE, not a cut-out on a backdrop.',
      },
      {
        when: 'any event',
        avoid: 'depicting real, recognisable public figures — celebrities, film stars, politicians, or named athletes (e.g. real footballers or cricketers)',
        because:
          'Yi chapter events use everyday participants and generic heroes. Generating real public-figure likenesses is off-brand and an IP / likeness risk. Render anonymous, generic, or brand-relevant people only.',
      },
      {
        when: 'genuinely solemn or ceremonial event — memorial, prayer meeting, convocation, formal award ceremony',
        avoid: 'high-saturation advertising colour grade + frozen action + hard strobe drama',
        because:
          'The bombastic campaign look fights solemn or ceremonial subject matter. NOTE: promotional and recruitment campaigns — including college admissions / "admissions open" / course-enrolment posters — ARE a perfect fit for this bold look and must NOT be softened. Reserve the calmer styles (scene, dark, elegant) only for genuinely solemn occasions.',
      },
      {
        when: 'this advertising style is selected',
        avoid: 'flat, evenly-lit, documentary or candid snapshot treatment',
        because:
          'Advertising key art is deliberately dramatic and polished. Even lighting and candid framing read as amateur and undercut the campaign-grade intent of this style.',
      },
    ],
  },
]

const STYLE_INDEX: Map<BackgroundStyleId, BackgroundStyleOption> = new Map(
  BACKGROUND_STYLES.map((s) => [s.id, s])
)

/** Returns the Design Intelligence hint for a style id, or `null` if none (e.g. `scene` or unknown id). */
export function getBackgroundStyleHint(id: string | undefined | null): string | null {
  if (!id) return null
  return STYLE_INDEX.get(id as BackgroundStyleId)?.designIntelligenceHint ?? null
}

/**
 * v53.6: Returns the hand-authored Gemini style lock for a style id, or `null`
 * if none. The lock is injected VERBATIM at the top of the final Gemini prompt
 * — no LLM rewrites it, bypassing the agent-sanitization problem.
 */
export function getGeminiStyleLock(id: string | undefined | null): string | null {
  if (!id) return null
  return STYLE_INDEX.get(id as BackgroundStyleId)?.geminiStyleLock ?? null
}

/** Returns the full config for a style id, or `undefined` for unknown ids. */
export function getBackgroundStyle(id: string | undefined | null): BackgroundStyleOption | undefined {
  if (!id) return undefined
  return STYLE_INDEX.get(id as BackgroundStyleId)
}

export function isValidBackgroundStyle(id: string): id is BackgroundStyleId {
  return STYLE_INDEX.has(id as BackgroundStyleId)
}
