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
    compatibleConcepts: [
      { name: 'FLUID-INK-FIELD', description: 'Flowing gradient fields blending like wet ink, no representation — pure expressive colour.' },
      { name: 'ROTHKO-COLOUR-FIELD', description: 'Soft stacked colour fields, meditative and gallery-premium.' },
      { name: 'DRIFTING-BLOB-COMPOSITION', description: 'Soft geometric blobs drifting with chromatic blur and generous breathing space.' },
      { name: 'GRADIENT-MESH-ATMOSPHERE', description: 'A smooth gradient-mesh atmosphere as an expressive, non-literal ground.' },
    ],
    designerReferences: [
      'Mark Rothko (colour-field)',
      'Helen Frankenthaler (soak-stain abstraction)',
      'contemporary digital gradient art (Justin Maller)',
      'fluid-art / paint-pour abstraction',
      'Apple / Stripe gradient brand fields',
    ],
    craftSignatures: [
      'flowing gradient fields blending the brand palette like wet ink on paper',
      'soft geometric blobs drifting, chromatic edges blurring with no hard boundary',
      'generous negative space breathing',
      'Rothko colour-field discipline meeting contemporary digital art',
      'typography the only literal element on the canvas',
      'meditative, expressive, gallery-wall premium',
    ],
    bannedCombinations: [
      { when: 'this abstract style is selected', avoid: 'representational figures, scenes, or literal objects', because: 'Abstract is pure form and colour; literal elements break the non-representational premise.' },
      { when: 'this abstract style is selected', avoid: 'hard sharp edges everywhere', because: 'Abstract here is soft, blended colour fields, not crisp geometry.' },
      { when: 'an information-dense event', avoid: 'abstract obscuring needed clarity', because: 'It codes expressive / gallery, not informational.' },
    ],
  },
  {
    id: 'dark',
    label: 'Cinematic',
    icon: '🎬',
    designIntelligenceHint:
      'STYLE OVERRIDE — USER SELECTED DARK CINEMATIC (v50.3): Keep the event scene and people from the original concept, but render with deep cinematic lighting — dramatic side-light on faces, hard rim-light shadows, atmospheric haze, spotlight beams, lens flares in brand accent color. Think Roger Deakins / Bradford Young cinematography: rich shadows, sculpted highlights, intentional darkness around the subjects. People and event details remain the focal point; the darkness frames them. NOT empty atmosphere — composed cinematic scene with people in dramatic light. Use CONCEPT 1 (LITERAL SCENE) with cinematic treatment.',
    geminiStyleLock:
      'Roger Deakins cinematography. The frame lives in shadow — 70% of the canvas is rich darkness, 30% is sculpted highlight. Hard sidelight rakes the subject from one direction; the opposite side falls completely into shadow with zero fill. Spotlight beams cut through atmospheric haze as visible volumetric god-rays. Caravaggio chiaroscuro logic — the darkness IS the subject, the light only reveals what the darkness chooses to show. Lens flare burns at one edge in the brand accent color. Subtle 35mm film grain throughout. Decisively dark — not moody, not merely atmospheric — sculpted. Mood: watched, witnessed, important. When the brief is an event WITH people (a celebration, performance, ceremony or gathering), the people REMAIN present and are sculpted by this dramatic light — a night stage or ceremony caught in theatrical spill-light, performers and an audience picked out of the shadow — the darkness FRAMES them, it never replaces them with an empty void. Reserve pure subject-free chiaroscuro for single-person tributes or abstract concept reveals.',
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
    compatibleConcepts: [
      {
        name: 'ICON-DRIVEN-HERO',
        description:
          'One bold iconic shape representing the event theme dominates the composition — a perfect-geometry microphone, gear, book, or trophy — on a clean flat field. The single icon IS the design.',
      },
      {
        name: 'FLAT-VECTOR-SCENE',
        description:
          'A simplified flat-colour scene — figures and environment reduced to clean geometric shapes in a limited palette with generous negative space. Editorial and confident, never cluttered.',
      },
      {
        name: 'EDITORIAL-SPOT-ILLUSTRATION',
        description:
          'A single witty conceptual spot illustration (New Yorker / Malika Favre sensibility) that carries the idea with elegant minimalism — one clever visual metaphor, beautifully reduced.',
      },
      {
        name: 'GEOMETRIC-FLAT-LANDSCAPE',
        description:
          'Layered flat geometric depth — foreground, mid-ground, background in 3-4 solid tones — with an optional single long-shadow or subtle grain for dimension. Clean modern poster art.',
      },
      {
        name: 'FLAT-VECTOR-FIGURE-CAST',
        description:
          'A flat-vector cast of people mid-action — performers, students, an engaged audience — built from clean simplified shapes in the limited palette. Crisp and uncluttered, the figures carry the energy. Use for people-events so the poster shows the celebration, not just a lone icon.',
      },
    ],
    designerReferences: [
      'Malika Favre (bold minimal flat vector, négative space)',
      'Tom Haugomat (flat cinematic gouache-vector scenes)',
      'Owen Davey (retro flat editorial illustration)',
      'Christoph Niemann (conceptual minimal idea-led illustration)',
      'Brian Edward Miller / Leeroy (flat-vector landscapes)',
    ],
    craftSignatures: [
      'clean flat colour fills — NO photographic shadows, NO complex gradient meshes',
      'a tightly limited palette — brand colours plus one neutral',
      'bold simplified shapes with crisp 3-5px contours where used',
      'generous negative space and confident asymmetric balance',
      'optional subtle paper-grain or a single long-shadow for depth',
      'Adobe-Illustrator pen-tool precision — reads instantly from across a room',
    ],
    bannedCombinations: [
      {
        when: 'this illustrated style is selected',
        avoid: 'photorealism, real skin texture, lens blur, or photographic depth-of-field',
        because:
          'Illustrated is flat vector graphic design. Any photoreal element shatters the look and reads as a confused mixed style.',
      },
      {
        when: 'any event',
        avoid: 'busy clutter with many competing elements and no breathing room',
        because:
          'Flat vector lives on restraint and negative space. Clutter makes it look amateur — the power is in confident reduction.',
      },
      {
        when: 'this illustrated style is selected',
        avoid: 'heavy gradient meshes, bevels, and stacked drop-shadows',
        because:
          'That is faux-3D, not clean flat vector. Keep fills solid and edges crisp.',
      },
    ],
  },
  {
    id: 'bokeh',
    label: 'Bokeh',
    icon: '✨',
    designIntelligenceHint:
      'STYLE OVERRIDE — USER SELECTED BOKEH & LIGHT: Ignore the SCENE-BASED concept preference. Generate soft out-of-focus atmosphere with glowing light orbs and warm sparkle particles in the brand palette. All elements are blurred and dreamy, not sharp or photorealistic. Use CONCEPT 3.',
    geminiStyleLock:
      'Soft out-of-focus dreaming. The entire frame is shot wide open at f/1.4 — nothing is fully sharp. Glowing light orbs in the brand accent color drift across atmospheric blur. Warm sparkle particles catch invisible breath. Bright highlights bloom into hexagonal lens-bokeh shapes. Wong Kar-wai blur logic. Mood: festival night intimacy, magical, ethereal, romantic. The image feels like a memory, not a record.',
    compatibleConcepts: [
      { name: 'LIGHT-ORB-DREAM', description: 'Drifting glowing orbs and sparkle over atmospheric blur — an ethereal brand-accent light field.' },
      { name: 'BACKLIT-SILHOUETTE-GLOW', description: 'A soft silhouette set against blooming bokeh light, dreamy and intimate.' },
      { name: 'FESTIVAL-NIGHT-INTIMACY', description: 'Warm out-of-focus celebration lights — diyas, fairy lights — rendered as a glowing memory.' },
      { name: 'MACRO-SPARKLE-FIELD', description: 'A tight shimmering particle field of brand-accent orbs, magical and soft.' },
    ],
    designerReferences: [
      'Wong Kar-wai cinematography (blur intimacy)',
      'Brenizer-method bokeh photography',
      'Terrence Malick golden-light lyricism',
      'holiday-lights macro photography',
      'dreamy wedding-cinematography aesthetic',
    ],
    craftSignatures: [
      'the entire frame shot wide-open at f/1.4 — nothing fully sharp',
      'glowing light orbs in the brand accent drifting across atmospheric blur',
      'hexagonal lens-bokeh shapes blooming from bright highlights',
      'warm sparkle particles and gentle bloom',
      'soft gradient depth and dreamy haze',
      'feels like a memory, not a record',
    ],
    bannedCombinations: [
      { when: 'text legibility matters', avoid: 'orbs and heavy blur across the whole text area', because: 'Blur over text destroys readability; keep one calmer zone for type to sit on.' },
      { when: 'this bokeh style is selected', avoid: 'sharp, crisp, hard-edged elements everywhere', because: "Bokeh's identity is softness; pervasive sharpness breaks the dream." },
      { when: 'a serious, formal or data-heavy event', avoid: 'the dreamy haze obscuring clarity', because: 'Bokeh codes romantic / celebratory, not authoritative — wrong register for serious briefs.' },
    ],
  },
  {
    id: 'geometric',
    label: 'Geometric',
    icon: '🔷',
    designIntelligenceHint:
      'STYLE OVERRIDE — USER SELECTED GEOMETRIC PATTERN: Ignore the SCENE-BASED concept preference AND the ban on geometric patterns. Generate bold geometric shapes (hexagons, triangles, diagonal bands, tessellation) in the brand palette. Geometric patterns ARE required here. Use CONCEPT 3.',
    geminiStyleLock:
      'Bauhaus structural composition. Bold geometric shapes in the brand palette — hexagons, triangles, diagonal bands, tessellation grids. Clean mathematical relationships, intentional asymmetry, generous negative space. No organic curves anywhere. Color blocks meet at sharp confident edges. Swiss typography precision. Mood: modernist, tech-forward, architectural, decided. The image reads as designed, not assembled.',
    compatibleConcepts: [
      { name: 'BAUHAUS-COMPOSITION', description: 'Bold geometric shapes in clean mathematical relationships with intentional asymmetry.' },
      { name: 'TESSELLATION-FIELD', description: 'A repeating tessellation or grid pattern as a structured graphic ground.' },
      { name: 'DIAGONAL-DYNAMIC-BANDS', description: 'Bold diagonal colour bands creating energy and direction.' },
      { name: 'MEMPHIS-PLAYFUL-GEOMETRY', description: 'Playful Memphis-style shapes and squiggles for youthful, energetic events.' },
      { name: 'FIGURES-FROM-SHAPES', description: 'Stylised people mid-action assembled from bold geometric shapes — circles, triangles and bands forming performers and an audience (Cassandre / Bauhaus figure-construction). Structured yet alive; use for people-events so figures, not just patterns, carry the energy.' },
    ],
    designerReferences: [
      'Bauhaus (Herbert Bayer, László Moholy-Nagy)',
      'Swiss International Typographic Style (Josef Müller-Brockmann)',
      'Memphis Group (Ettore Sottsass) for the playful variant',
      'El Lissitzky constructivism',
      'contemporary geometric brand systems',
    ],
    craftSignatures: [
      'bold geometric shapes — hexagons, triangles, diagonal bands, tessellation grids',
      'clean mathematical relationships with intentional asymmetry',
      'generous negative space and no organic curves',
      'colour blocks meeting at sharp, confident edges',
      'Swiss typographic precision',
      'modernist, tech-forward, architectural',
    ],
    bannedCombinations: [
      { when: 'this geometric style is selected', avoid: 'organic curves, hand-drawn looseness, or photorealism', because: 'Geometric is precise hard-edged structure; soft or photoreal elements break it.' },
      { when: 'this geometric style is selected', avoid: 'muddy gradients', because: 'It lives on flat colour blocks and sharp edges, not gradient mush.' },
      { when: 'a warm, emotional or heritage event', avoid: 'cold geometric abstraction when warmth is needed', because: 'Geometric codes modernist / tech — it can feel clinical on warm briefs.' },
    ],
  },
  {
    id: 'texture',
    label: 'Textured',
    icon: '🪨',
    designIntelligenceHint:
      'STYLE OVERRIDE — USER SELECTED TEXTURED MATERIAL: Ignore the SCENE-BASED concept preference. Generate a physical material surface (marble veining, woven fabric, paper grain, brushed metal) tinted in the brand palette. No scenes or people. Use CONCEPT 2.',
    geminiStyleLock:
      'Tactile material world. A physical substrate dominates the frame — Carrara marble veining, handwoven cotton, handmade paper grain, brushed brass, raw concrete — tinted in the brand palette. Subtle directional light reveals the surface\'s grain and depth. Mood: premium, analogue, weighty, real. Editorial print-magazine surface quality. The image makes the viewer want to run their hand across it.',
    compatibleConcepts: [
      { name: 'MATERIAL-FIELD-HERO', description: 'A single physical substrate — marble, fabric, paper, brass — fills the frame as the tactile ground.' },
      { name: 'EMBOSSED-DETAIL-MACRO', description: 'A tight macro of material grain with subtle relief or emboss, premium and weighty.' },
      { name: 'MIXED-MATERIAL-BLOCK', description: 'Two materials meeting at a clean edge (marble + brass) for confident contrast.' },
      { name: 'TACTILE-BACKDROP-FOR-TYPE', description: 'A material ground with type debossed or foil-stamped into it — editorial stationery feel.' },
    ],
    designerReferences: [
      'premium print-magazine paper-stock photography',
      'Kinfolk / Cereal magazine material minimalism',
      'luxury packaging surface design',
      'architectural material photography',
      'foil-emboss stationery craft',
    ],
    craftSignatures: [
      'a physical substrate dominates — Carrara marble veining, handwoven cotton, handmade paper grain, brushed brass, raw concrete',
      'the material tinted toward the brand palette',
      'subtle directional light revealing the grain and depth',
      'premium, analogue, weighty, real',
      'editorial print-magazine surface quality',
      'restraint — the material itself IS the design',
    ],
    bannedCombinations: [
      { when: 'this texture style is selected', avoid: 'busy scenes or figures on top of the surface', because: 'Texture is about the surface itself, not a scene placed over it.' },
      { when: 'this texture style is selected', avoid: 'flat digital colour with no grain', because: 'It must read as a real, tactile material — flatness defeats the point.' },
      { when: 'a high-energy youth event', avoid: 'quiet material minimalism when the brief needs loud', because: 'Texture codes premium-calm, not kinetic.' },
    ],
  },
  {
    id: 'split',
    label: 'Split',
    icon: '▧',
    designIntelligenceHint:
      'STYLE OVERRIDE — USER SELECTED SPLIT LAYOUT: Left half is an event-relevant atmospheric scene; right half is a clean solid brand-color panel where all text will be placed. Sharp or soft diagonal edge separates them.',
    geminiStyleLock:
      'Editorial magazine layout. The canvas divides cleanly in two — left half is an event-relevant photographic moment with shallow depth; right half is a solid flat brand-color panel that holds all typography. A sharp vertical line or soft diagonal edge separates them with confidence. The two halves answer each other — image speaks, panel responds. Mood: editorial, sophisticated, design-conscious, balanced. New York Times Magazine cover discipline.',
    compatibleConcepts: [
      { name: 'IMAGE-PANEL-DIALOGUE', description: 'A photographic half and a solid colour panel half answering each other across a clean divide.' },
      { name: 'DIAGONAL-SPLIT-DYNAMIC', description: 'A bold diagonal divide between scene and panel for energy and movement.' },
      { name: 'BEFORE-AFTER-DUALITY', description: 'Two halves contrasting a theme — then/now, problem/solution — carried by the split.' },
      { name: 'TYPE-PANEL-MAGAZINE', description: 'Scene on one side, a generous type panel on the other — editorial-cover discipline.' },
      { name: 'EVENT-PEOPLE-PANEL', description: 'For a people-event, the photographic half captures a real people-moment — performers mid-action or an engaged audience at shallow depth — and the solid colour panel answers it. People populate the image half, not just a venue or object.' },
    ],
    designerReferences: [
      'New York Times Magazine cover design',
      'Pentagram editorial layouts',
      'Kinfolk split compositions',
      'Swiss grid editorial discipline',
      'modern conference-poster split layouts',
    ],
    craftSignatures: [
      'the canvas divides cleanly in two — a photographic/scene half and a solid flat brand-colour panel holding all type',
      'a sharp vertical line or confident soft diagonal edge separating them',
      'the two halves answering each other — image speaks, panel responds',
      'shallow depth on the image half',
      'editorial, sophisticated, balanced',
      'New York Times Magazine cover discipline',
    ],
    bannedCombinations: [
      { when: 'this split style is selected', avoid: 'scattering text across the image half', because: "The split's logic is that text lives on the solid panel; text on the photo muddies the composition." },
      { when: 'this split style is selected', avoid: 'a fussy or curved divide', because: 'The divide should be clean and confident — a clear vertical or diagonal.' },
      { when: 'a single-hero brief', avoid: 'forcing a split when one strong full-bleed image is better', because: 'Split suits image-vs-message duality, not every poster.' },
    ],
  },
  {
    id: 'neon',
    label: 'Neon',
    icon: '⚡',
    designIntelligenceHint:
      'STYLE OVERRIDE — USER SELECTED NEON GLOW: Ignore the SCENE-BASED concept preference. Generate deep near-black background with vivid electric neon light trails, glowing grid lines, bioluminescent halos, and pulsing light streaks in the brand accent color. No realistic scenes or Indian people. Use CONCEPT 3.',
    geminiStyleLock:
      'Blade Runner aesthetic. Deep near-black base. Electric neon light trails in the brand accent color burn across the frame as glowing tubes, pulsing grid lines, bioluminescent halos, luminous light streaks. Wet-asphalt reflections double the light below. Atmospheric mist softens distant glows. Subtle chromatic aberration at the edges. Mood: cyberpunk, after-hours, electric, anticipatory. The image hums.',
    compatibleConcepts: [
      { name: 'NEON-TUBE-SIGN', description: 'Glowing neon-tube lettering or a motif as the hero on a near-black field.' },
      { name: 'CYBERPUNK-STREET-GLOW', description: 'Wet-asphalt reflections, atmospheric mist and electric signage receding into depth.' },
      { name: 'LIGHT-TRAIL-MOTION', description: 'Long-exposure light streaks tracing energy and motion across the dark frame.' },
      { name: 'GRID-HORIZON-SYNTHWAVE', description: 'A glowing perspective grid running to a neon horizon — synthwave / outrun energy.' },
    ],
    designerReferences: [
      'Blade Runner 2049 (Roger Deakins neon)',
      'synthwave / outrun aesthetic',
      'Tokyo / Hong Kong neon-street photography',
      'Tron light-grid design',
      'cyberpunk concept art',
    ],
    craftSignatures: [
      'a deep near-black base',
      'electric neon light trails in the brand accent — glowing tubes, pulsing grid lines, bioluminescent halos',
      'wet-asphalt reflections doubling the light below',
      'atmospheric mist softening distant glows',
      'subtle chromatic aberration at the edges',
      'humming, after-hours, anticipatory energy',
    ],
    bannedCombinations: [
      { when: 'this neon style is selected', avoid: 'bright daylight or pastel palettes', because: 'Neon needs darkness for the glow to read; light backgrounds kill it.' },
      { when: 'this neon style is selected', avoid: 'realistic Indian crowd / documentary scenes', because: 'Neon is graphic light-on-black, not documentary photography.' },
      { when: 'a traditional, cultural or solemn event', avoid: 'cyberpunk neon', because: 'It codes nightlife / tech — mismatched on heritage or solemn briefs.' },
    ],
  },
  {
    id: 'duotone',
    label: 'Duotone',
    icon: '🎭',
    designIntelligenceHint:
      'STYLE OVERRIDE — USER SELECTED DUOTONE: Ignore the SCENE-BASED concept preference. Generate imagery mapped to exactly TWO brand colors — shadows in primary, highlights in secondary/accent. Bold, high-contrast two-tone treatment. Abstract or silhouette forms only. Use CONCEPT 2 or CONCEPT 3.',
    geminiStyleLock:
      'Risograph print aesthetic. The entire image maps to exactly TWO brand colors — shadows become one color, highlights become the other, no in-between tones. High-contrast silhouettes, simplified forms, intentional screen-print misregistration. Subtle paper grain texture underneath. Mood: bold, graphic, retro-modern, screen-printed. Spotify Wrapped energy. The image feels printed, not rendered.',
    compatibleConcepts: [
      { name: 'DUOTONE-SILHOUETTE', description: 'A high-contrast subject silhouette mapped to two brand tones — shadows one colour, highlights the other.' },
      { name: 'RISO-SCREENPRINT-SCENE', description: 'A simplified scene in two inks with deliberate misregistration — riso / screen-print energy.' },
      { name: 'HALFTONE-GRADIENT-FIELD', description: 'A two-tone halftone gradient as a bold graphic ground.' },
      { name: 'WRAPPED-PORTRAIT', description: 'A bold duotone portrait with editorial pop, Spotify-Wrapped sensibility.' },
    ],
    designerReferences: [
      'Spotify Wrapped duotone campaigns',
      'Risograph print art',
      '1960s screen-printed poster art',
      'David Carson duotone editorial',
      'two-colour offset print tradition',
    ],
    craftSignatures: [
      'the entire image maps to exactly TWO brand colours — shadows one, highlights the other, no in-between tones',
      'high-contrast silhouettes and simplified forms',
      'intentional screen-print misregistration',
      'subtle paper-grain and halftone texture',
      'bold, graphic, retro-modern',
      'feels printed, not rendered',
    ],
    bannedCombinations: [
      { when: 'this duotone style is selected', avoid: 'full colour or many tones', because: 'Duotone is strictly two colours; more tones break the concept entirely.' },
      { when: 'this duotone style is selected', avoid: 'photoreal full-tone rendering', because: 'It must read as a two-ink print, not a photograph.' },
      { when: 'a subtle or gentle mood is needed', avoid: "duotone's hard high contrast", because: 'Duotone is bold and graphic by nature — wrong register for soft, gentle briefs.' },
    ],
  },
  {
    id: 'glassmorphism',
    label: 'Glass',
    icon: '🪟',
    designIntelligenceHint:
      'STYLE OVERRIDE — USER SELECTED GLASSMORPHISM: Ignore the SCENE-BASED concept preference. Generate translucent frosted-glass panels layered over soft gradient blobs or bokeh in brand colors. Clean modern depth, no realistic scenes. Use CONCEPT 3.',
    geminiStyleLock:
      'macOS Big Sur translucency. Multiple frosted-glass panels float in layered depth over soft gradient blobs in the brand palette. Each panel carries a subtle white border glow, a soft offset shadow, and 60-80% backdrop blur. Light catches the panel edges. Mood: clean, modern, premium tech, weightless. Apple design language. The image feels like polished software.',
    compatibleConcepts: [
      { name: 'FROSTED-PANEL-STACK', description: 'Layered translucent frosted-glass panels over soft gradient blobs — clean depth.' },
      { name: 'DEPTH-CARD-FLOAT', description: 'Floating glass cards with offset shadows and edge light, weightless and premium.' },
      { name: 'GRADIENT-BLOB-GLOW', description: 'Soft colourful gradient blobs blurred behind frosted glass.' },
      { name: 'UI-HERO-MOCKUP', description: 'A clean app-UI-like glass composition presenting the event as polished software.' },
    ],
    designerReferences: [
      'macOS Big Sur / iOS frosted-glass design',
      'Apple keynote UI aesthetics',
      'Microsoft Fluent acrylic material',
      'modern SaaS landing-page design',
      'Dribbble glassmorphism trend',
    ],
    craftSignatures: [
      'multiple frosted-glass panels in layered depth over soft gradient blobs',
      'a subtle white border glow, soft offset shadow, and 60-80% backdrop blur per panel',
      'light catching the panel edges',
      'clean, modern, premium-tech, weightless',
      'Apple design language',
      'a generous soft gradient ground',
    ],
    bannedCombinations: [
      { when: 'this glass style is selected', avoid: 'heavy textures, grit, or photoreal scenes', because: 'Glassmorphism is clean translucent UI — grit shatters the polish.' },
      { when: 'this glass style is selected', avoid: 'opaque flat fills with no blur or depth', because: 'The frosted blur and layered depth ARE the style; without them it is just flat panels.' },
      { when: 'a cultural, heritage or warm event', avoid: 'cold tech-UI glass', because: 'It codes software / SaaS — mismatched on warm cultural briefs.' },
    ],
  },
  {
    id: 'watercolor',
    label: 'Watercolor',
    icon: '🖌️',
    designIntelligenceHint:
      'STYLE OVERRIDE — USER SELECTED WATERCOLOR: Ignore the SCENE-BASED concept preference. Generate soft organic paint washes and flowing pigment spreads in the brand palette. Wet watercolor bleeds, brush strokes, visible paper grain. Purely painterly, no photorealism. Use CONCEPT 3.',
    geminiStyleLock:
      'Botanical illustration meets J.M.W. Turner sky. Soft organic paint washes flow across handmade paper in the brand palette — wet-on-wet bleeds, delicate brush strokes, granulation texture, visible paper grain underneath. Colors blend organically at the edges, never crisp. Subtle pigment lifts and pools. Mood: gentle, artisanal, human, contemplative. The image looks painted by hand, not generated.',
    compatibleConcepts: [
      { name: 'WET-ON-WET-WASH', description: 'Flowing pigment washes blending on wet paper with soft, bleeding edges.' },
      { name: 'BOTANICAL-WATERCOLOUR', description: 'Delicate botanical and floral watercolour motifs, gentle and artisanal.' },
      { name: 'TURNER-SKY-ATMOSPHERE', description: 'A luminous atmospheric watercolour sky or wash as the ground.' },
      { name: 'LOOSE-WASH-SUBJECT', description: 'A loose watercolour subject with bleeding edges and granulation.' },
    ],
    designerReferences: [
      'J.M.W. Turner (luminous watercolour skies)',
      'classic botanical illustration',
      'contemporary watercolour wedding-stationery art',
      'Agnes Cecile (expressive watercolour portraits)',
      'Chinese and Indian wash-painting traditions',
    ],
    craftSignatures: [
      'soft organic paint washes on handmade paper in the brand palette',
      'wet-on-wet bleeds, delicate brush strokes, granulation texture',
      'visible paper grain underneath',
      'colours blending organically at the edges, never crisp',
      'subtle pigment lifts and pools',
      'gentle, artisanal, contemplative — painted by hand',
    ],
    bannedCombinations: [
      { when: 'this watercolour style is selected', avoid: 'crisp vector edges or photoreal sharpness', because: 'Watercolour lives on soft, bleeding, organic edges.' },
      { when: 'this watercolour style is selected', avoid: 'neon or high-saturation digital colour', because: 'Watercolour is gentle, pigment-based and translucent — neon breaks the medium.' },
      { when: 'a bold, loud or high-energy event', avoid: 'soft watercolour gentleness', because: 'It codes calm / artisanal, not punchy — wrong register for high-energy briefs.' },
    ],
  },
  {
    id: 'mandala',
    label: 'Mandala',
    icon: '🪷',
    designIntelligenceHint:
      'STYLE OVERRIDE — USER SELECTED MANDALA: Ignore the SCENE-BASED concept preference. Generate intricate radial mandala pattern with Indian floral motifs, paisley elements, and traditional ornaments in the brand palette. Symmetrical, ornate, cultural. Gold accents on darker base. Use CONCEPT 3.',
    geminiStyleLock:
      'Mysore temple painting tradition. An intricate radial mandala forms the central background — concentric geometric petal layers, paisley motifs, traditional Indian floral ornaments, jaali screen patterns in the brand palette. Gold leaf accents trace the radial divisions. Bilateral symmetry, sacred geometry, devotional ornament. Mood: cultural, ancestral, ceremonial, contemplative. The image feels venerated.',
    compatibleConcepts: [
      { name: 'RADIAL-MANDALA-FIELD', description: 'Concentric petal and geometry layers form the central background; the subject or text sits in the calm focal centre.' },
      { name: 'JAALI-SCREEN-LATTICE', description: 'A pierced Mughal jaali geometric lattice as an ornamental ground, gold on jewel base.' },
      { name: 'LOTUS-BLOOM-CENTRE', description: 'A lotus or rangoli bloom radiating outward, gold tracery on a deep jewel base.' },
      { name: 'SACRED-GEOMETRY-EMBLEM', description: 'A precise bilateral mandala emblem framing a focal motif — devotional, contemplative.' },
    ],
    designerReferences: [
      'Mysore & Tanjore temple painting tradition',
      'Mughal jaali screen geometry',
      'Tibetan thangka mandala precision',
      'Indian rangoli / kolam radial design',
      'contemporary mandala-art revival',
    ],
    craftSignatures: [
      'an intricate radial mandala — concentric petal layers, paisley, floral ornament',
      'gold-leaf accents tracing the radial divisions',
      'strict bilateral symmetry and sacred geometry',
      'a jewel-tone base (deep maroon, indigo, emerald) with gold',
      'ornament dense at the edges, a calm focal centre for subject and text',
      'devotional, contemplative, ceremonial ornament',
    ],
    bannedCombinations: [
      { when: 'a birthday or joyful living-person event', avoid: 'heavy devotional mandala with reverent gold-on-dark stillness', because: 'It codes ceremonial / memorial reverence; reserve mandala for cultural, spiritual and festival briefs, not joyful personal milestones.' },
      { when: 'this mandala style is selected', avoid: 'photorealism or photographic depth', because: 'Mandala is flat ornamental pattern, not a photographic scene.' },
      { when: 'any mandala composition', avoid: 'asymmetric or chaotic layout', because: "Mandala's entire power is precise bilateral symmetry; breaking it loses the form." },
    ],
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
    compatibleConcepts: [
      { name: 'APPLE-KEYNOTE-OBJECT', description: 'One event-symbolic object on a seamless studio backdrop, hero-lit and decisive.' },
      { name: 'HERO-PRODUCT-FLOAT', description: 'The object floating with a soft contact shadow, rim-lit and premium.' },
      { name: 'MACRO-SPECIMEN', description: 'A tight macro of the object presented as a museum specimen.' },
      { name: 'OBJECT-WITH-EFFECT', description: 'The object with a signature visual effect — sound waves from a mic, light from a book.' },
    ],
    designerReferences: [
      'Apple keynote product photography',
      'high-end advertising still-life / packshot studios',
      'museum specimen photography',
      'editorial catalogue object shots',
      'premium e-commerce hero imagery',
    ],
    craftSignatures: [
      'ONE event-symbolic object dominating 60%+ of the canvas',
      'studio-quality lighting — sharp key, subtle rim, soft fill',
      'a seamless backdrop in brand colour or neutral',
      'no people, no venue, no clutter',
      'editorial-catalogue / museum-specimen precision',
      'the object is the point',
    ],
    bannedCombinations: [
      { when: 'this product style is selected', avoid: 'crowd scenes or venue interiors', because: 'Product is object-as-hero, not a scene with people.' },
      { when: 'this product style is selected', avoid: 'flat illustration', because: 'Product is premium studio rendering of a real object, not vector art.' },
      { when: 'the event has no strong symbolic object', avoid: 'forcing the product treatment', because: 'A weak or generic object undermines the object-as-hero concept — pick a scene-based style instead.' },
    ],
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
    compatibleConcepts: [
      {
        name: 'PANORAMIC-ACTIVITY-WORLD',
        description:
          'ONE continuous open-air festive scene where every listed activity happens simultaneously in the same space — dancers leaping, a singer at a mic, a cheering crowd — never split panels. The whole canvas is one shared party under one sky.',
      },
      {
        name: 'CONCEPT-AS-CONNECTOR',
        description:
          'A single flowing visual device — a pulse wave, ribbon, festoon string, or winding path — threads across the canvas linking the activity clusters into one composition. The connector is the spine that unifies the scene.',
      },
      {
        name: 'FESTIVE-ICON-BLOOM',
        description:
          'One large central cultural motif (diya, kolam mandala, dhol, star-burst) radiates outward as the organising centre, with celebration spilling around it. Used when the fest has one strong symbol rather than many activities.',
      },
      {
        name: 'STICKER-CARNIVAL',
        description:
          'A flat sticker-art cast of happy figures mid-motion with bold outlines, confetti everywhere — a Diwali / Holi / college-fest flyer brought to life. Maximum energy, maximum colour.',
      },
    ],
    designerReferences: [
      "Sanjay Patel (Pixar 'Sanjay's Super Team' Indian folk-modern)",
      'Indian wedding-invitation & festival-flyer illustration tradition',
      'Hatecopy / Maria Qamar (pop-desi bold colour)',
      'Sajid Wajid Shaikh (contemporary Indian editorial illustration)',
      'modern Indian sticker-art and Gen-Z desi graphics',
    ],
    craftSignatures: [
      'thick confident black contour outlines on flat-colour figures',
      'saturated tropical palette — marigold orange, peacock teal, hot magenta, sunshine yellow at full gamut, no muted tones',
      'halftone fold-gradients inside the flat costume fills',
      'kolam dot-grid and mandala quarter-circles tracing the corners only (never a full border box)',
      'confetti, sparkles and festoon strings scattered through the upper region as atmosphere',
      'screen-print misregistration offset between the colour layers',
    ],
    bannedCombinations: [
      {
        when: 'multiple activities are listed',
        avoid: 'splitting the canvas into stacked panels or horizontal dividers, one box per activity',
        because:
          'That reads as separate mini-posters glued together. Festive must be ONE continuous shared scene with all activities co-existing in the same space, tied together by a single connector device.',
      },
      {
        when: 'any region (especially tamil-nadu / south-india)',
        avoid: 'solemn temple-devotional heaviness — brass-lamp reverence, garlanded stillness, muted ceremonial palette',
        because:
          'Festive is JOY. Devotional gravity kills the celebration energy. This is a modern festival flyer, not a prayer poster — keep it bright, kinetic, communal.',
      },
      {
        when: 'this festive style is selected',
        avoid: 'photoreal people, cinematic lighting, or realistic depth-of-field',
        because:
          'Festive is flat illustrated sticker-art. Any photoreal element shatters the medium and makes it read as a different, confused style.',
      },
    ],
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
    compatibleConcepts: [
      {
        name: 'INKED-SKETCH-SCENE',
        description:
          'A loose, confident pen-and-ink scene with visible under-drawing — the event captured as if sketched on the spot in a travel journal, lively and immediate.',
      },
      {
        name: 'PEN-AND-WASH-PORTRAIT',
        description:
          'An ink-line subject with loose watercolour or marker washes that deliberately do not stay inside the lines — warm, characterful, hand-coloured.',
      },
      {
        name: 'DOODLE-COLLAGE',
        description:
          'A lively page of hand-drawn doodles, arrows, stars and hand-lettering arranged around the event idea — sketchbook / margin-notes energy, playful and personal.',
      },
      {
        name: 'WOODCUT-LINEWORK',
        description:
          'Bold hand-carved-feeling linework and hatching for a graphic, hand-printed look — strong black line, limited ink colour, expressive texture.',
      },
      {
        name: 'SKETCHED-EVENT-CROWD',
        description:
          'A loose hand-drawn scene full of people mid-action — sketched performers and a lively audience with wobbly confident contours, as if drawn on the spot. Warm and immediate; use for people-events so the crowd, not a lone object, carries the page.',
      },
    ],
    designerReferences: [
      'Christoph Niemann (ink line + wit)',
      'Quentin Blake (loose expressive ink and wash)',
      'Jean Jullien (bold simple confident hand lines)',
      'Oliver Jeffers (hand-drawn warmth + handwritten type)',
      'Saul Steinberg (line as thought)',
    ],
    craftSignatures: [
      'wobbly confident ink contours with visible pencil under-sketch',
      'cross-hatching and gestural shading for volume',
      'marker / crayon / watercolour washes bleeding slightly outside the lines',
      'textured paper showing through the artwork',
      'a hand-lettered headline feel rather than a clean typeset font',
      'charming imperfection — uneven weights, human wobble, anti-AI-slop honesty',
    ],
    bannedCombinations: [
      {
        when: 'this hand-drawn style is selected',
        avoid: 'clean vector precision, perfect geometry, or mechanically even line weights',
        because:
          'Hand-drawn must look made by a human hand. Precision reads as fake and defeats the entire charm of the style.',
      },
      {
        when: 'this hand-drawn style is selected',
        avoid: 'photorealism and smooth digital gradients',
        because:
          'They break the sketchbook honesty — the image must feel drawn, not rendered.',
      },
      {
        when: 'any event',
        avoid: 'over-rendering with too many fussy details',
        because:
          'Ink illustration lives on a confident economy of line; over-working it muddies the charm.',
      },
    ],
  },
  {
    id: 'naive',
    label: 'Playful',
    icon: '🌈',
    designIntelligenceHint:
      'STYLE OVERRIDE — USER SELECTED NAIVE / PLAYFUL: Generate a childlike, playful illustrated poster — chunky rounded shapes, smiley motifs, uneven hand-filled colour, scratchy outlines, simple grinning characters. Joyful and imperfect. NOT photorealistic, NOT corporate-clean. Use CONCEPT 2 or 3.',
    geminiStyleLock:
      'Naive playful illustration. Childlike and joyful — smiley suns, chunky rounded shapes, uneven hand-filled colour, scratchy crayon outlines, characters with simple dot eyes and big grins. Zero polish, maximum charm — contemporary "naive design" / Gen-Z sticker art crossed with Keith Haring energy and a happy kid\'s drawing. Bright primary-leaning palette. Mood: happy, human, unselfconscious, instantly likeable. The image feels made with a shaky hand and zero regrets.',
    compatibleConcepts: [
      {
        name: 'CRAYON-WORLD',
        description:
          'A joyful childlike crayon/marker scene — wonky proportions, a smiley sun, chunky shapes, everything grinning. The whole world drawn by a happy kid.',
      },
      {
        name: 'STICKER-PLAYGROUND',
        description:
          'A bright cut-and-paste arrangement of simple grinning characters and motifs — Gen-Z sticker-pack energy, bold and unselfconscious.',
      },
      {
        name: 'FOLK-NAIVE-TABLEAU',
        description:
          'A flat folk-naive composition — Keith-Haring-meets-kids-drawing — with bold outlines, primary joy, and figures mid-celebration.',
      },
      {
        name: 'HAPPY-DOODLE-BURST',
        description:
          'A central smiley / star / heart motif radiating simple hand-drawn shapes outward — pure cheerful energy around one happy centre.',
      },
    ],
    designerReferences: [
      'Keith Haring (bold naive line + joy)',
      'Jean Dubuffet (art brut, raw naive mark-making)',
      "children's-book and school-chart naive illustration",
      'Rob Pruitt (smiley pop-naive)',
      'contemporary Gen-Z sticker-pack art',
    ],
    craftSignatures: [
      'chunky rounded shapes with scratchy, uneven outlines',
      'hand-filled colour that happily overshoots the lines',
      'simple dot-eyes-and-big-grin characters with wonky proportions',
      'a bright primary-leaning palette',
      'smiley, star and squiggle motifs scattered with abandon',
      'zero polish, maximum charm — looks made with a shaky hand and zero regrets',
    ],
    bannedCombinations: [
      {
        when: 'this naive style is selected',
        avoid: 'sophistication, realism, or precise geometry',
        because:
          'Naive is deliberately unpolished; visible competence kills the childlike charm that is the whole point.',
      },
      {
        when: 'any event',
        avoid: 'muted, desaturated, or corporate palettes',
        because:
          'Naive needs bright, unselfconscious colour to feel joyful — muted tones drain its energy.',
      },
      {
        when: 'a solemn, formal, memorial, or prestige event',
        avoid: 'using this giddy childlike tone at all',
        because:
          'Playful naivety undercuts gravity and reads as inappropriate — reserve this style for fun, youth, kids, and community events.',
      },
    ],
  },
  {
    id: 'papercut',
    label: 'Paper-Cut',
    icon: '📄',
    designIntelligenceHint:
      'STYLE OVERRIDE — USER SELECTED PAPER-CUT: Build the poster from layered cut-paper shapes with crisp edges and soft real drop-shadows between layers, matte construction-paper texture, no within-shape gradients. Handcrafted paper-collage depth, generous negative space. Use CONCEPT 2 or 3.',
    geminiStyleLock:
      'Layered paper-cut craft. The whole image is built from cut sheets of coloured paper stacked in shallow depth — each shape has a crisp edge and casts a soft real drop-shadow onto the layer beneath, creating tactile dimensionality. Matte construction-paper texture, no gradients within shapes — a handcrafted papercraft diorama or a modern paper-art editorial cover. Generous negative space. Mood: tactile, premium-handmade, warm, considered. The image looks physically cut and assembled.',
    compatibleConcepts: [
      {
        name: 'LAYERED-PAPER-DIORAMA',
        description:
          'A shallow-depth diorama built from stacked cut sheets, each casting soft shadows on the layer beneath — the event scene assembled in paper, with real tactile depth.',
      },
      {
        name: 'CUT-PAPER-ICON',
        description:
          'A single bold subject or symbol rendered as crisp cut-paper silhouette layers — clean, graphic, premium-handmade.',
      },
      {
        name: 'PAPER-LANDSCAPE-DEPTH',
        description:
          'Receding layered paper hills, skyline or arches for depth, with warm directional light raking across the layers — calm, dimensional, considered.',
      },
      {
        name: 'KIRIGAMI-SYMBOL',
        description:
          'An intricate symmetrical cut-paper motif (sanjhi / kirigami tradition) as the centrepiece — delicate, ornamental, handcrafted.',
      },
      {
        name: 'CUT-PAPER-PERFORMERS',
        description:
          'Layered cut-paper figures — performers and an audience built as stacked paper silhouettes casting soft shadows, mid-celebration in a paper diorama. Use for people-events so the scene is populated, not a lone motif.',
      },
    ],
    designerReferences: [
      'Eiko Ojala (digital paper-cut depth + shadow)',
      'Hari & Deepti (light-box paper dioramas)',
      'Matthew Shlian (paper engineering)',
      'Lotte Reiniger (silhouette paper craft)',
      'Indian Sanjhi traditional paper-cut art',
    ],
    craftSignatures: [
      'crisp, clean cut edges on every shape',
      'soft realistic drop-shadows BETWEEN the stacked layers for depth',
      'matte construction-paper texture, NO within-shape gradients',
      '3-5 distinct depth layers, foreground sharp to background soft',
      'warm directional light raking across the paper layers',
      'generous negative space and a considered, calm composition',
    ],
    bannedCombinations: [
      {
        when: 'this paper-cut style is selected',
        avoid: 'flat single-layer artwork with no inter-layer shadows',
        because:
          "Paper-cut's entire identity is layered depth and the soft shadows between layers. Without them it is just flat illustration.",
      },
      {
        when: 'this paper-cut style is selected',
        avoid: 'photorealism, glossy 3D renders, or within-shape gradients',
        because:
          'It must read as matte, physically-cut paper — not CGI or a photograph.',
      },
      {
        when: 'any event',
        avoid: 'cluttering the frame edge to edge',
        because:
          'Layered paper depth needs breathing room to read; clutter flattens the dimensional effect.',
      },
    ],
  },
  {
    id: 'patriotic',
    label: 'Tricolour',
    icon: '🇮🇳',
    designIntelligenceHint:
      'STYLE OVERRIDE — USER SELECTED PATRIOTIC / TRICOLOR: Generate a clean Indian patriotic vector poster — saffron/white/green tricolour swoosh, Ashoka-chakra navy accent, monument and map silhouettes, generous white space, flat vector. For Independence/Republic Day and national-pride events. Use CONCEPT 2 or 3.',
    geminiStyleLock:
      'Indian patriotic vector poster. A confident tricolour visual language — saffron, white and India-green organised with vector cleanliness: a flowing tricolour swoosh or ribbon, the navy Ashoka chakra as a precise accent, silhouettes of national monuments (India Gate, Qutub Minar) and a green map of India along a lower band. Flat vector, crisp generous white breathing space, one bold headline. Mood: proud, dignified, civic, clean — national-day done with modern restraint, never gaudy.',
    compatibleConcepts: [
      { name: 'TRICOLOUR-SWOOSH-HERO', description: 'A confident saffron-white-green ribbon or swoosh sweeps the frame, with the navy Ashoka chakra as the focal accent. Clean, civic, modern.' },
      { name: 'MONUMENT-SKYLINE-BAND', description: 'Flat-vector silhouettes of national monuments (India Gate, Qutub Minar) and a green map of India along a lower band, tricolour sky above.' },
      { name: 'CHAKRA-RADIANT-EMBLEM', description: 'The Ashoka chakra as a precise radiant centrepiece, navy on white, with restrained tricolour framing.' },
      { name: 'SALUTING-CITIZEN-VECTOR', description: 'Flat-vector citizens, students or flag-bearers in proud silhouette against a tricolour field — community pride.' },
      { name: 'CITIZENS-CELEBRATING', description: 'Flat-vector citizens, students or performers mid-celebration as the FOCUS — proud, energetic figures in tricolour styling, with monuments, chakra and map as supporting motifs behind them. Use for people-events so the crowd leads, not the emblem.' },
    ],
    designerReferences: [
      'MyGov / Government of India national-day campaign vector design',
      'Amul-style topical poster simplicity',
      'WPA patriotic poster discipline',
      'modern Indian civic flat-vector design (Swachh-Bharat-era)',
      'ISRO / national-campaign clean vector',
    ],
    craftSignatures: [
      'saffron, white and India-green organised with vector cleanliness',
      'a flowing tricolour swoosh or ribbon as the compositional spine',
      'the navy Ashoka chakra rendered as a precise geometric accent',
      'monument silhouettes and a green map of India in a lower band',
      'crisp, generous white breathing space with one bold headline',
      'flat vector — no photographic texture, no gaudy bevels',
    ],
    bannedCombinations: [
      { when: 'any patriotic poster', avoid: 'gaudy clip-art, fluttering-flag photo clichés, and heavy gradient/bevel effects', because: 'National-day done with modern restraint reads premium; gaudy treatment reads cheap and dated.' },
      { when: 'the tricolour or chakra is used', avoid: 'disrespectful flag treatment — flag as a faded background texture, a distorted or recoloured chakra', because: 'Flag-code dignity matters; the tricolour and Ashoka chakra must stay correct, upright and respectful.' },
      { when: 'this patriotic style is selected', avoid: 'photoreal scenes or cinematic depth', because: 'Patriotic here is a flat civic vector language, not photography.' },
    ],
  },
  {
    id: 'folk-art',
    label: 'Folk Art',
    icon: '🪔',
    designIntelligenceHint:
      'STYLE OVERRIDE — USER SELECTED INDIAN FOLK-ART: Render in a traditional Indian folk style — Warli stick-figures, Madhubani dense pattern, or Pattachitra ornament — flat, symbolic, hand-painted, natural-pigment palette. Cultural and authentic. Use CONCEPT 2 or 3.',
    geminiStyleLock:
      'Indian folk-art illustration. Rendered in the hand of a traditional regional craft — Warli\'s white stick-figures on earth-red, Madhubani\'s dense black-outlined motifs filled with fine pattern, or Pattachitra\'s ornate borders. Flat, symbolic, pattern-rich, devotional. Natural-pigment palette: terracotta, ochre, indigo, lamp-black, off-white. Hand-painted texture on a matte ground. Mood: rooted, cultural, handmade, timeless. The image honours a living folk tradition.',
    compatibleConcepts: [
      { name: 'WARLI-RITUAL-SCENE', description: 'White Warli stick-figures on an earth-red ground in rhythmic communal motifs — a dance circle, farming, a procession. Spare, rhythmic, symbolic.' },
      { name: 'MADHUBANI-DENSE-PANEL', description: 'Black-outlined motifs filled with fine line-and-dot pattern, almost no empty space, natural pigments — Mithila richness.' },
      { name: 'PATTACHITRA-ORNAMENT', description: 'An ornate bordered narrative panel with mythological richness and fine detail in the Odisha Pattachitra idiom.' },
      { name: 'FOLK-MOTIF-EMBLEM', description: 'A single folk motif — tree of life, peacock, sun — rendered in the chosen folk idiom as the centrepiece.' },
    ],
    designerReferences: [
      'Jivya Soma Mashe (Warli master)',
      'Madhubani / Mithila painting (Sita Devi, Ganga Devi)',
      'Pattachitra of Odisha',
      'Gond art (Jangarh Singh Shyam)',
      'contemporary Indian folk-revival design',
    ],
    craftSignatures: [
      'flat, symbolic, pattern-rich, hand-painted texture on a matte ground',
      'natural-pigment palette — terracotta, ochre, indigo, lamp-black, off-white',
      'the ONE regional idiom chosen and held consistently throughout',
      'dense fill patterns (Madhubani) or rhythmic white figures (Warli)',
      'visible hand-painted brush and line imperfection',
      'ornamental borders true to the chosen tradition',
    ],
    bannedCombinations: [
      { when: 'this folk-art style is selected', avoid: 'photorealism, 3D, or glossy gradients', because: 'Folk-art is flat, hand-painted, symbolic craft — realism destroys the idiom.' },
      { when: 'a tradition is implied', avoid: 'mixing incompatible folk styles (Warli + Madhubani + Pattachitra) in one image', because: 'Each tradition has its own grammar; mixing reads as inauthentic pastiche. Pick ONE and hold it.' },
      { when: 'a contemporary corporate / tech brief', avoid: 'forcing dense folk-art when the event is modern', because: 'Folk-art suits cultural, heritage and festival briefs; on a tech event it mis-codes — use a lighter touch or another style.' },
    ],
  },
  {
    id: 'typographic',
    label: 'Typographic',
    icon: '🔠',
    designIntelligenceHint:
      'STYLE OVERRIDE — USER SELECTED TYPOGRAPHIC: Make typography the hero — the event name set massive, letterforms as graphic shapes filling the frame, mixed weights/sizes, type bleeding off edges, minimal imagery, bold colour blocking behind the type. Use CONCEPT 3 (type-as-subject).',
    geminiStyleLock:
      'Typography IS the poster. The event name is the hero image — set massive, letterforms treated as graphic shapes that fill the frame, mixing weights and sizes, one word oversized or rotated, type that bleeds off the edges. Minimal or no pictorial imagery; the words carry all the energy. Swiss type-poster discipline meets a contemporary type-collage editorial cover, with confident colour blocking behind the type. Mood: bold, authored, expressive, instantly attention-grabbing. The composition is built from letters, not pictures.',
    compatibleConcepts: [
      { name: 'MASSIVE-WORDMARK', description: 'The event name set huge, letterforms filling the frame as the image itself.' },
      { name: 'TYPE-COLLAGE-EDITORIAL', description: 'Mixed weights, sizes and rotations, type bleeding off the edges — expressive type-collage.' },
      { name: 'SWISS-TYPE-POSTER', description: 'A disciplined grid with one oversized word and confident colour blocking.' },
      { name: 'KINETIC-LETTER-SHAPES', description: 'Letters treated as graphic shapes with motion and energy.' },
    ],
    designerReferences: [
      'Josef Müller-Brockmann (Swiss type posters)',
      'David Carson (expressive type-collage)',
      'Paula Scher / Pentagram (big type)',
      'Neville Brody (experimental type)',
      'contemporary type-driven editorial covers',
    ],
    craftSignatures: [
      'the event name IS the hero — set massive, letterforms as graphic shapes filling the frame',
      'mixed weights and sizes, one word oversized or rotated, type bleeding off edges',
      'minimal or no pictorial imagery',
      'confident colour blocking behind the type',
      'Swiss discipline meeting contemporary type-collage',
      'built from letters, not pictures',
    ],
    bannedCombinations: [
      { when: 'this typographic style is selected', avoid: 'competing pictorial imagery that fights the type', because: 'Type must be the hero; strong imagery dilutes the type-as-image idea.' },
      { when: 'this typographic style is selected', avoid: 'timid, small, centred type', because: 'Typographic demands scale and confidence to work.' },
      { when: 'lots of body text is needed', avoid: 'cramming paragraphs — keep ONE hero word or phrase', because: 'Type-as-image works on a few words, not blocks of copy.' },
    ],
  },
  {
    id: '3d-render',
    label: '3D Render',
    icon: '🧊',
    designIntelligenceHint:
      'STYLE OVERRIDE — USER SELECTED 3D RENDER: Generate a glossy CGI 3D render — inflatable / claymation / polished-plastic forms, studio lighting, soft contact shadows, subsurface glow, seamless gradient backdrop. Cinema 4D / Octane look. Use CONCEPT 2 (object-as-hero) or 3.',
    geminiStyleLock:
      'Glossy 3D render. The scene is built in CGI — soft-body inflatable shapes, claymation-smooth objects, or polished plastic forms with realistic studio lighting, soft contact shadows and gentle subsurface glow. Rounded, tactile, slightly squishy — a Cinema 4D + Octane render in the current Pinterest 3D-trend aesthetic, Apple-keynote object energy. Clean seamless gradient backdrop. Mood: modern, premium, playful-tech, scroll-stopping. The image looks rendered in 3D software, crisp and dimensional.',
    compatibleConcepts: [
      { name: 'INFLATABLE-OBJECT-HERO', description: 'A soft-body inflatable / balloon form of the event symbol as the dimensional hero.' },
      { name: 'CLAY-RENDER-SCENE', description: 'Claymation-smooth 3D objects in a soft studio set, rounded and tactile.' },
      { name: 'GLOSSY-PLASTIC-PRODUCT', description: 'A polished plastic or chrome object, Apple-keynote render energy.' },
      { name: '3D-TYPE-EXTRUSION', description: 'Extruded 3D letterforms as a bold dimensional hero.' },
    ],
    designerReferences: [
      'Cinema 4D + Octane render aesthetic',
      'current Behance/Pinterest 3D trend (Peter Tarka, Six N. Five)',
      'Apple keynote object renders',
      'claymation / soft-body 3D illustration',
      'inflatable-type 3D design trend',
    ],
    craftSignatures: [
      'soft-body inflatable shapes, claymation-smooth objects, or polished plastic forms',
      'realistic studio lighting, soft contact shadows, gentle subsurface glow',
      'rounded, tactile, slightly squishy surfaces',
      'a clean seamless gradient backdrop',
      'crisp dimensional render quality',
      'modern, premium, playful-tech',
    ],
    bannedCombinations: [
      { when: 'this 3d-render style is selected', avoid: 'flat 2D illustration or photoreal documentary', because: 'It must read as CGI dimensional forms, not flat art or a photograph.' },
      { when: 'this 3d-render style is selected', avoid: 'harsh shadows or gritty texture', because: 'The trend look is soft studio light and smooth surfaces.' },
      { when: 'a heritage or traditional event', avoid: 'glossy 3D', because: 'It codes modern-tech / playful — mismatched on cultural briefs.' },
    ],
  },
  {
    id: 'retro',
    label: 'Retro',
    icon: '📻',
    designIntelligenceHint:
      'STYLE OVERRIDE — USER SELECTED RETRO / VINTAGE: Generate a 70s-style retro poster — sun-faded mustard/orange/avocado/cream palette, rounded retro display type, halftone grain, a big setting-sun arc with concentric rings, off-register print texture. Nostalgic and warm. Use CONCEPT 2 or 3.',
    geminiStyleLock:
      'Retro print nostalgia. 1970s travel-poster and vintage-advertising warmth — a sun-faded palette of mustard, burnt orange, avocado and cream, thick rounded retro display type, halftone grain, a big setting-sun arc with concentric rings. Slightly off-register print texture, like a mid-century WPA poster meeting a 70s album sleeve. Mood: warm, nostalgic, optimistic, analogue. The image feels printed decades ago and lovingly kept.',
    compatibleConcepts: [
      { name: 'SUNSET-ARC-POSTER', description: 'A big setting-sun arc with concentric rings and faded warm bands — quintessential 70s warmth.' },
      { name: 'VINTAGE-TRAVEL-POSTER', description: 'A WPA / mid-century travel-poster composition with rounded retro display type.' },
      { name: 'ALBUM-SLEEVE-GROOVE', description: '70s record-sleeve warmth — halftone grain, off-register print, analogue character.' },
      { name: 'RETRO-BADGE-LOCKUP', description: 'A circular retro badge or emblem with vintage display type as the focal lockup.' },
      { name: 'RETRO-FIGURE-POSTER', description: 'WPA / mid-century travel-poster figures — heroic stylised people mid-action rendered in the sun-faded palette with halftone grain and rounded display type. Use for people-events so figures populate the poster, not just a sunset arc.' },
    ],
    designerReferences: [
      '1970s travel & advertising poster design',
      'WPA national-park posters',
      '70s album-sleeve art (Hipgnosis era)',
      'Saul Bass title-design warmth',
      'mid-century print advertising',
    ],
    craftSignatures: [
      'a sun-faded palette — mustard, burnt orange, avocado, cream',
      'thick rounded retro display type',
      'halftone grain with slightly off-register print texture',
      'a big setting-sun arc with concentric rings',
      'warm analogue nostalgia, optimistic mood',
      'looks printed decades ago and lovingly kept',
    ],
    bannedCombinations: [
      { when: 'this retro style is selected', avoid: 'crisp modern flat-vector cleanliness or neon glow', because: 'Retro needs faded warmth and print grain; modern polish or neon breaks the period feel.' },
      { when: 'this retro style is selected', avoid: 'cool blue / tech palettes', because: '1970s retro lives in warm earth tones — cool palettes read as a different era.' },
      { when: 'any retro poster', avoid: 'photorealism', because: 'Retro is a printed-poster aesthetic, not a photograph.' },
    ],
  },
  {
    id: 'art-deco',
    label: 'Art Deco',
    icon: '🏛️',
    designIntelligenceHint:
      'STYLE OVERRIDE — USER SELECTED ART DECO: Generate a 1920s-30s Art Deco poster — symmetrical stepped / sunburst geometry, gold linework on deep jewel tones, streamlined glamour, elegant deco display type. Premium and ceremonial. Use CONCEPT 3.',
    geminiStyleLock:
      'Art Deco grandeur. Symmetrical geometric elegance — stepped ziggurat forms, sunburst fans, fluted vertical lines, fine gold linework on deep jewel tones (emerald, sapphire, oxblood). Streamlined 1920s-30s glamour, Gatsby-poster opulence, Chrysler-Building geometry. Precise, ornamental, luxurious, with elegant high-contrast deco display type. Mood: premium, ceremonial, glamorous, timeless. The image feels gilded and grand.',
    compatibleConcepts: [
      { name: 'ZIGGURAT-SYMMETRY', description: 'Stepped ziggurat / skyscraper geometry in symmetrical grandeur, gold linework on jewel tones.' },
      { name: 'SUNBURST-FAN', description: 'A radiating sunburst fan motif behind the focal element — classic deco glamour.' },
      { name: 'FLUTED-VERTICAL-ELEGANCE', description: 'Fine fluted vertical lines and gold framing, streamlined and elegant.' },
      { name: 'DECO-EMBLEM-CREST', description: 'An ornamental deco crest or monogram as the centrepiece, precise and luxurious.' },
    ],
    designerReferences: [
      'A.M. Cassandre (Art Deco poster master)',
      'Tamara de Lempicka (deco painting)',
      'Chrysler Building / Empire State deco architecture',
      'Erté (deco fashion illustration)',
      'The Great Gatsby / 1925 Paris Expo deco design',
    ],
    craftSignatures: [
      'symmetrical stepped and sunburst geometry',
      'fine gold linework on deep jewel tones — emerald, sapphire, oxblood',
      'streamlined 1920s-30s glamour and high contrast',
      'elegant geometric deco display type',
      'precise ornamental framing and fluted lines',
      'gilded, grand, luxurious finish',
    ],
    bannedCombinations: [
      { when: 'this art-deco style is selected', avoid: 'organic or hand-drawn looseness', because: 'Deco is precise geometric elegance; looseness breaks the discipline.' },
      { when: 'this art-deco style is selected', avoid: 'muddy or pastel palettes', because: 'Deco needs deep jewel tones with gold contrast to feel grand; pastels drain the opulence.' },
      { when: 'a casual, playful or kids event', avoid: 'forcing deco formality', because: 'Deco codes ceremonial luxury — mismatched on casual or youthful briefs.' },
    ],
  },
  {
    id: 'collage',
    label: 'Collage',
    icon: '🗞️',
    designIntelligenceHint:
      'STYLE OVERRIDE — USER SELECTED MAXIMALIST COLLAGE: Generate a mixed-media collage — torn paper, cut-out photo fragments, halftone newsprint, washi-tape, marker scribbles, stamped type, layered busy-but-balanced. Zine / scrapbook energy. Use CONCEPT 2 or 3.',
    geminiStyleLock:
      'Maximalist mixed-media collage. A rich, intentional pile-up — torn-paper scraps, cut-out photo fragments, halftone newsprint, washi-tape, marker scribbles, stickers and stamped type layered into a busy-but-balanced composition. Visible tape, torn edges, photocopied texture — a zine cover or scrapbook art-board, chaotic-yet-curated. Mood: energetic, youthful, handmade, expressive. The image feels physically assembled from many materials, not generated.',
    compatibleConcepts: [
      { name: 'ZINE-SCRAPBOARD', description: 'Torn paper, photo fragments, tape and scribbles layered zine-style into a curated-chaotic board.' },
      { name: 'NEWSPRINT-CUTOUT-MIX', description: 'Halftone newsprint cut-outs and stamped type, punk/dada ransom-note energy.' },
      { name: 'PHOTO-FRAGMENT-MONTAGE', description: 'Cut photo fragments montaged with graphic shapes and marks.' },
      { name: 'HANDMADE-MOODBOARD', description: 'A curated-chaotic art-board of mixed materials around the event idea.' },
      { name: 'ILLUSTRATED-FIGURE-MONTAGE', description: 'Stylised figures — performers, students, an audience — layered with torn paper, tape and marks into an energetic people-scene (illustrated cut-outs or photo fragments both welcome). Use for people-events so the montage centres on people, not only objects and type.' },
    ],
    designerReferences: [
      'Hannah Höch / dada photomontage',
      'Jamie Reid (Sex Pistols punk-zine collage)',
      'contemporary scrapbook / moodboard aesthetic',
      "Beck 'Odelay' / 90s collage album art",
      'riso-zine cut-and-paste culture',
    ],
    craftSignatures: [
      'torn-paper scraps, cut-out photo fragments, halftone newsprint, washi-tape, marker scribbles, stamped type',
      'a layered, busy-but-balanced composition',
      'visible tape, torn edges and photocopied texture',
      'chaotic-yet-curated arrangement',
      'energetic, youthful, handmade',
      'feels physically assembled from many materials',
    ],
    bannedCombinations: [
      { when: 'this collage style is selected', avoid: 'clean minimal flat-vector', because: 'Collage is deliberately dense and layered; minimalism is the opposite intent.' },
      { when: 'this collage style is selected', avoid: 'photoreal single-scene rendering', because: 'It must read as assembled fragments, not one seamless photograph.' },
      { when: 'a formal, premium or solemn event', avoid: 'chaotic zine energy', because: 'Collage codes youthful / punk — mismatched on formal briefs.' },
    ],
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

  // ════════════════════════════════════════════════════════════════════════
  // v56.0 — Wide style expansion (Modern / Bold / Premium / Cultural / College)
  // ════════════════════════════════════════════════════════════════════════
  {
    id: 'minimal',
    label: 'Minimal',
    icon: '⬜',
    designIntelligenceHint:
      'STYLE OVERRIDE — USER SELECTED MINIMAL (SWISS): Strip everything non-essential. Vast calm negative space, ONE small focal element or a single confident line of type, a tightly limited palette (brand colour + one neutral). No scenes, no clutter, no decoration. Use CONCEPT 2 or 3.',
    geminiStyleLock:
      'Swiss International Typographic minimalism. Vast disciplined negative space dominates — roughly two-thirds of the canvas is calm empty ground. ONE small, perfectly-placed focal element (a single icon, a thin rule, one word) carries the whole composition on a precise modular grid. A tightly limited palette: one brand colour plus a single neutral, nothing more. Helvetica-era restraint, Dieter Rams "less but better" discipline, Kenya Hara emptiness. No gradients, no texture, no shadow, no decoration of any kind. Mood: confident, premium, intellectual, quiet. The power is in what is left out.',
    compatibleConcepts: [
      { name: 'SINGLE-ELEMENT-FOCUS', description: 'One small focal element on a vast calm field — a lone icon, mark, or object placed with surgical precision; the emptiness around it is the design.' },
      { name: 'GRID-TYPE-COMPOSITION', description: 'A pure typographic composition on a strict modular grid — confident type as the only content, aligned with mathematical Swiss precision.' },
      { name: 'NEGATIVE-SPACE-HERO', description: 'The empty space itself is the subject; a tiny mark anchors one corner and lets the silence speak (Kenya Hara emptiness).' },
      { name: 'SINGLE-RULE-DIVIDE', description: 'One thin confident rule divides the field and organises a minimal hierarchy with nothing else.' },
    ],
    designerReferences: [
      'Josef Müller-Brockmann (Swiss grid)',
      'Dieter Rams (less but better)',
      'Kenya Hara (MUJI emptiness)',
      'Massimo Vignelli (timeless modernism)',
      'Jan Tschichold (the new typography)',
    ],
    craftSignatures: [
      'vast disciplined negative space — at least two-thirds calm empty ground',
      'one focal element only, placed on a precise modular grid',
      'a palette of a single brand colour plus one neutral',
      'clean grotesque sans type, generous margins, mathematical alignment',
      'no gradients, textures, shadows, or decorative elements anywhere',
      'confident asymmetry and restraint — the power is in the omission',
    ],
    bannedCombinations: [
      { when: 'this minimal style is selected', avoid: 'busy scenes, multiple competing elements, or decorative motifs', because: 'Minimalism is defined by subtraction; any clutter destroys the entire premise.' },
      { when: 'a high-energy festival or celebration brief', avoid: 'cold empty minimalism when the brief needs warmth and energy', because: 'It codes intellectual / premium-calm — wrong register for loud joyful events.' },
      { when: 'this minimal style is selected', avoid: 'gradients, drop-shadows, or photoreal texture', because: 'Those add visual weight that breaks the flat, quiet Swiss discipline.' },
    ],
  },
  {
    id: 'comic',
    label: 'Comic',
    icon: '💥',
    designIntelligenceHint:
      'STYLE OVERRIDE — USER SELECTED COMIC / MANGA: Render as sequential comic-book art — bold panels, thick ink outlines, ben-day / halftone dot shading, speech bubbles, dynamic action lines, a hand-lettered sound-effect word (POW, ZOOM). Saturated flat colours. NOT fine-art pop (that is pop-modern). Use CONCEPT 1 or 2.',
    geminiStyleLock:
      'Comic-book / manga sequential art. Bold black ink outlines on every figure and edge, flat saturated cel colours, ben-day halftone dot shading in the shadows, dynamic speed-lines radiating energy. Characters drawn mid-action with exaggerated dramatic poses and expressive faces. A hand-lettered sound-effect word ("POW", "GO!", "ZOOM") bursts across the frame inside a jagged starburst. Speech bubbles with confident tails. Optional panel-gutter framing. Jack Kirby dynamism meets shonen-manga energy and Hergé ligne-claire cleanliness, with modern webtoon colour. Mood: kinetic, fun, narrative, youthful. The image reads as one electric frame torn from a comic.',
    compatibleConcepts: [
      { name: 'ACTION-SPLASH-PAGE', description: 'A single dramatic comic splash-page moment — the hero mid-action, speed-lines exploding outward, a sound-effect word bursting across the frame.' },
      { name: 'MANGA-HERO-CLOSEUP', description: 'A shonen-manga close-up — expressive determined face, screentone shading, dramatic ink, motion focus-lines converging on the eyes.' },
      { name: 'MULTI-PANEL-STRIP', description: 'Two or three clean comic panels with gutters telling a tiny sequence of the event, ligne-claire clarity.' },
      { name: 'SOUND-EFFECT-TYPO', description: 'A giant hand-lettered onomatopoeia ("SMASH", "WIN!") IS the hero graphic, with a small action vignette tucked beneath.' },
    ],
    designerReferences: [
      'Jack Kirby (dynamic Marvel action)',
      'Hergé (Tintin ligne claire)',
      'Roy Lichtenstein (ben-day comic panels)',
      'shonen manga (One Piece / Naruto energy)',
      'modern webtoon colour',
    ],
    craftSignatures: [
      'thick confident black ink outlines on every figure and edge',
      'flat saturated cel colours with ben-day / screentone halftone shading',
      'dynamic speed-lines and motion focus radiating energy',
      'a hand-lettered sound-effect word inside a jagged starburst',
      'speech bubbles with confident tails, optional panel gutters',
      'exaggerated dramatic poses and expressive faces',
    ],
    bannedCombinations: [
      { when: 'this comic style is selected', avoid: 'photoreal skin, lens blur, or documentary realism', because: 'Comic art is inked and cel-shaded; photoreal elements shatter the look.' },
      { when: 'a solemn, formal, or memorial brief', avoid: 'kinetic comic energy and sound-effect bursts', because: 'It codes fun / youthful narrative — wrong register for solemn occasions.' },
      { when: 'this comic style is selected', avoid: 'fine-art pop screen-print silkscreen treatment (that is pop-modern territory)', because: 'Comic is sequential narrative line-art, not gallery pop-art; mixing the two confuses the style.' },
    ],
  },
  {
    id: 'aurora',
    label: 'Aurora',
    icon: '🌌',
    designIntelligenceHint:
      'STYLE OVERRIDE — USER SELECTED AURORA GRADIENT: Generate a smooth flowing holographic mesh gradient in the brand palette — soft luminous colour blending like northern lights, gentle glow, generous depth. Modern tech-brand vibe. No scenes or people. Use CONCEPT 3.',
    geminiStyleLock:
      'Modern tech-brand aurora gradient. A smooth flowing mesh-gradient fills the frame — luminous colour blending softly like northern lights or a long-exposure sky, the brand palette melting through saturated mids into deep edges. Gentle volumetric glow blooms from within the gradient; subtle grain keeps it from banding. Soft floating light-wisps add depth. Instagram-2016 / Stripe / Apple-keynote gradient confidence. Typography sits crisp and bright over the luminous field. Mood: modern, optimistic, premium-tech, weightless. The colour itself is the whole world.',
    compatibleConcepts: [
      { name: 'MESH-GRADIENT-FIELD', description: 'A smooth flowing mesh gradient blending the brand palette like aurora light — the luminous field is the entire composition.' },
      { name: 'AURORA-GLOW-DEPTH', description: 'Northern-lights ribbons of soft glow drift across deep space with volumetric depth, brand colours melting together.' },
      { name: 'HOLOGRAPHIC-SHEEN', description: 'An iridescent holographic sheen shifts across the field, modern and premium, type sitting bright over it.' },
      { name: 'LIGHT-WISP-ATMOSPHERE', description: 'Soft floating light-wisps and bloom add gentle depth to a luminous gradient ground.' },
    ],
    designerReferences: [
      'Instagram 2016 gradient rebrand',
      'Stripe brand gradients',
      'Apple keynote aurora backdrops',
      'holographic / iridescent foil design',
      'long-exposure aurora photography',
    ],
    craftSignatures: [
      'a smooth flowing mesh gradient blending the brand palette, no hard edges',
      'gentle volumetric glow blooming from within the field',
      'subtle grain to prevent banding',
      'soft floating light-wisps for depth',
      'crisp bright typography sitting over the luminous ground',
      'modern, optimistic, premium-tech weightlessness',
    ],
    bannedCombinations: [
      { when: 'text legibility matters', avoid: 'the brightest glow directly behind the headline', because: 'Bloom behind type kills contrast; keep one calmer zone for the type to sit on.' },
      { when: 'this aurora style is selected', avoid: 'hard geometric edges, realistic scenes, or figures', because: 'Aurora is pure flowing luminous colour; literal elements break the field.' },
      { when: 'a heritage, cultural, or solemn event', avoid: 'glossy tech-brand aurora', because: 'It codes modern SaaS / tech — mismatched on warm heritage or solemn briefs.' },
    ],
  },
  {
    id: 'isometric',
    label: 'Isometric',
    icon: '📐',
    designIntelligenceHint:
      'STYLE OVERRIDE — USER SELECTED ISOMETRIC: Generate a clean axonometric (isometric) 3D vector illustration — a tiny detailed world or object built on 30-degree isometric geometry, flat brand-palette colours with soft long shadows. Tech / education vibe. Use CONCEPT 2.',
    geminiStyleLock:
      'Clean isometric vector illustration. A precise axonometric world built on 30-degree isometric geometry — tiny detailed buildings, devices, people, or objects rendered as crisp flat-shaded 3D blocks in the brand palette. Each surface is a flat tone with one lighter top-face and one darker side-face giving clean dimension; soft long ambient-occlusion shadows ground every element. No perspective vanishing point — parallel edges throughout. Floating modular tiles and subtle depth layers. Modern tech / SaaS / explainer-illustration vocabulary. Mood: organised, smart, friendly, contemporary. A neat little world seen from a perfect three-quarter angle.',
    compatibleConcepts: [
      { name: 'ISO-MINI-WORLD', description: 'A tiny detailed isometric world — a campus, a stage, a workspace — built from clean 3D blocks; the little diorama IS the design.' },
      { name: 'ISO-OBJECT-HERO', description: 'One hero object (a trophy, device, book, rocket) rendered as a crisp isometric 3D model floating on a calm field.' },
      { name: 'ISO-PROCESS-FLOW', description: 'Isometric tiles connected in a flow showing the event journey or steps, modular and clear.' },
      { name: 'ISO-STACKED-LAYERS', description: 'Floating stacked isometric layers with depth and soft shadows, modern explainer-illustration depth.' },
    ],
    designerReferences: [
      'modern SaaS isometric explainer illustration',
      'technical / axonometric architectural drawing',
      'isometric pixel-art tradition',
      'Monument Valley game art',
      'Material Design isometric spot-illustration',
    ],
    craftSignatures: [
      'strict 30-degree isometric geometry — parallel edges, no perspective vanishing point',
      'flat-shaded faces: a lighter top, a darker side, clean dimension',
      'soft long ambient-occlusion shadows grounding each element',
      'a tightly limited brand palette across all blocks',
      'floating modular tiles and subtle depth layers',
      'organised, smart, friendly, contemporary',
    ],
    bannedCombinations: [
      { when: 'this isometric style is selected', avoid: 'realistic perspective, photoreal texture, or lens blur', because: 'Isometric is parallel-projection flat-shaded vector; perspective or photoreal breaks the projection.' },
      { when: 'a warm, emotional, or heritage event', avoid: 'cool technical isometric when warmth is needed', because: 'It codes tech / explainer — can feel clinical on warm cultural briefs.' },
      { when: 'this isometric style is selected', avoid: 'messy organic clutter with no grid logic', because: 'Isometric power is in clean modular order; chaos makes it look amateur.' },
    ],
  },
  {
    id: 'vaporwave',
    label: 'Y2K',
    icon: '🪩',
    designIntelligenceHint:
      'STYLE OVERRIDE — USER SELECTED Y2K / VAPORWAVE: Generate retro-futurist 80s-90s nostalgia — chrome 3D lettering, holographic gradients, neon pink-and-cyan, a glowing perspective grid running to a sunset horizon, glitch and CRT-scanline texture. Use CONCEPT 3.',
    geminiStyleLock:
      'Y2K / vaporwave retro-futurism. Liquid-chrome 3D lettering with rainbow holographic reflections, a hot-pink-and-cyan neon palette over deep indigo, a glowing magenta perspective grid running to a gradient sunset horizon. Wireframe shapes, low-poly classical busts, palm silhouettes and dolphins float as nostalgic 90s clip-motifs. CRT scanlines, subtle glitch displacement, and chromatic aberration at the edges. Windows-95 / mall-poster / synthwave-album energy. Mood: nostalgic, dreamy, ironic, electric. The image feels beamed from a 1995 vision of the future.',
    compatibleConcepts: [
      { name: 'CHROME-TYPE-HERO', description: 'Liquid-chrome 3D lettering with holographic rainbow reflections dominates as the hero, floating over a neon grid.' },
      { name: 'SYNTHWAVE-GRID-HORIZON', description: 'A glowing magenta perspective grid runs to a gradient sunset horizon — outrun / synthwave energy.' },
      { name: 'Y2K-CLIPART-COLLAGE', description: 'Nostalgic 90s clip-motifs — low-poly busts, dolphins, palms, stars — collaged over a holographic field.' },
      { name: 'GLITCH-CRT-FIELD', description: 'CRT scanlines, glitch displacement, and chromatic aberration over a neon gradient — retro-tech texture.' },
    ],
    designerReferences: [
      'vaporwave aesthetic (Macintosh Plus era)',
      'synthwave / outrun album art',
      '1990s Windows / mall graphic design',
      'holographic Y2K product packaging',
      'retro-futurist VHS / CRT visuals',
    ],
    craftSignatures: [
      'liquid-chrome 3D lettering with holographic rainbow reflections',
      'a hot-pink-and-cyan neon palette over deep indigo',
      'a glowing perspective grid running to a gradient sunset horizon',
      'CRT scanlines, glitch displacement, chromatic aberration',
      'nostalgic 90s clip-motifs (busts, palms, dolphins, stars)',
      'nostalgic, dreamy, ironic, electric',
    ],
    bannedCombinations: [
      { when: 'this Y2K style is selected', avoid: 'muted natural palettes or documentary realism', because: 'Vaporwave lives on neon artifice; natural restraint kills it.' },
      { when: 'a formal, corporate, or solemn event', avoid: 'ironic retro-futurist Y2K kitsch', because: 'It codes nostalgic / playful — wrong register for serious or solemn briefs.' },
      { when: 'text legibility matters', avoid: 'heavy glitch and scanlines across the headline', because: 'Glitch over type destroys readability; keep the headline zone cleaner.' },
    ],
  },
  {
    id: 'grunge',
    label: 'Grunge',
    icon: '🎸',
    designIntelligenceHint:
      'STYLE OVERRIDE — USER SELECTED GRUNGE / ZINE: Distressed punk gig-poster — torn paper, photocopier grit, rough halftone, spray and ink splatter, ransom-note / Xerox typography, high-contrast scratchy textures. Use CONCEPT 2 or 3.',
    geminiStyleLock:
      'Punk zine / gig-poster grunge. Distressed photocopier-degraded textures throughout — high-contrast blown-out Xerox halftone, torn and taped paper edges, ink splatter, spray-paint overspray, scratched and scribbled marks, coffee-stain grime. Ransom-note cut-and-paste typography mixing clashing weights, photocopied-to-death contrast, slight skew and misalignment. A raw limited palette — often near-monochrome with one aggressive spot colour. David Carson deconstruction, Jamie Reid Sex-Pistols cut-up energy, 90s skate-zine rawness. Mood: rebellious, raw, urgent, anti-design. The image looks photocopied, torn, and stuck to a wall.',
    compatibleConcepts: [
      { name: 'XEROX-RANSOM-NOTE', description: 'Cut-and-paste ransom-note typography over blown-out photocopier halftone — Jamie Reid punk energy, raw and urgent.' },
      { name: 'TORN-TAPED-COLLAGE', description: 'Torn paper layers, masking tape, and stapled fragments collaged with grit and one spot colour.' },
      { name: 'SPLATTER-OVERSPRAY', description: 'Ink splatter and spray overspray erupt across a distressed field, gig-poster aggression.' },
      { name: 'DECONSTRUCTED-TYPE', description: 'David-Carson deconstruction — type smashed, skewed, overlapped, broken on purpose.' },
    ],
    designerReferences: [
      'David Carson (Ray Gun deconstruction)',
      'Jamie Reid (Sex Pistols cut-up)',
      'punk / hardcore zine culture',
      'screen-printed gig posters',
      '90s skate-graphic rawness',
    ],
    craftSignatures: [
      'high-contrast blown-out photocopier Xerox halftone',
      'torn and taped paper edges, ink splatter, spray overspray',
      'ransom-note cut-and-paste type with clashing weights and skew',
      'a raw near-monochrome palette plus one aggressive spot colour',
      'scratched, scribbled, grimy distressed textures',
      'rebellious, raw, urgent, anti-design',
    ],
    bannedCombinations: [
      { when: 'a premium, corporate, or formal brief', avoid: 'raw photocopier grunge and ransom-note chaos', because: 'It codes rebellious / lo-fi — the opposite of polished or corporate.' },
      { when: 'this grunge style is selected', avoid: 'clean gradients, glossy polish, or pristine vector edges', because: 'Polish defeats the deliberately degraded, torn aesthetic.' },
      { when: 'critical details (date, venue) must stay legible', avoid: 'distressing the essential info into illegibility', because: 'Grunge can shred readability — keep the must-read lines on a cleaner patch.' },
    ],
  },
  {
    id: 'street',
    label: 'Street Art',
    icon: '🧨',
    designIntelligenceHint:
      'STYLE OVERRIDE — USER SELECTED STREET ART / GRAFFITI: Urban wall graffiti — spray-paint wildstyle lettering, stencil art (Banksy), drips, paste-ups, sticker-bomb, brick / concrete texture. Bold and rebellious. Use CONCEPT 2 or 3.',
    geminiStyleLock:
      'Urban street-art graffiti. A textured brick, concrete, or shuttered-wall ground tagged with vivid spray-paint — wildstyle bubble lettering with hard drips and highlights, a crisp stencil motif (Banksy single-colour spray-through), layered paste-up posters and sticker-bombs peeling at the corners, a two-tone throw-up. Aerosol overspray haze, dripping paint, scuffed grime. Bold saturated street palette over the wall neutrals. NYC-subway / Bristol-stencil / contemporary-mural energy. Mood: rebellious, urban, energetic, unsanctioned. The image looks sprayed onto a real city wall.',
    compatibleConcepts: [
      { name: 'WILDSTYLE-LETTERING', description: 'Vivid spray-paint wildstyle bubble lettering with drips and highlights dominates the wall as the hero.' },
      { name: 'STENCIL-MOTIF', description: 'A crisp single-colour spray-through stencil motif (Banksy energy) sits on textured concrete.' },
      { name: 'PASTEUP-STICKER-BOMB', description: 'Layered paste-up posters and a sticker-bomb peel at the corners over a tagged wall.' },
      { name: 'MURAL-WALL-SCENE', description: 'A bold contemporary street mural fills a real brick / shutter wall, saturated and energetic.' },
    ],
    designerReferences: [
      'NYC subway graffiti tradition',
      'Banksy (stencil street art)',
      'Keith Haring (bold street line)',
      'contemporary urban muralism',
      'sticker / paste-up culture',
    ],
    craftSignatures: [
      'a textured brick / concrete / shutter wall ground',
      'spray-paint wildstyle lettering with hard drips and highlights',
      'a crisp single-colour spray-through stencil motif',
      'layered paste-ups and sticker-bombs peeling at the corners',
      'aerosol overspray haze, dripping paint, scuffed grime',
      'rebellious, urban, energetic, unsanctioned',
    ],
    bannedCombinations: [
      { when: 'a formal, heritage, or solemn brief', avoid: 'unsanctioned street-graffiti rawness', because: 'It codes urban / rebellious — wrong register for formal or solemn occasions.' },
      { when: 'this street style is selected', avoid: 'clean studio backgrounds or glossy vector polish', because: 'Street art needs the gritty wall and aerosol texture; polish breaks the illusion.' },
      { when: 'used for a tamil-nadu / india event', avoid: 'western-only subway-tag clichés with no local relevance', because: 'In India lean to contemporary Indian street-mural energy so it reads locally, not as imported pastiche.' },
    ],
  },
  {
    id: 'risograph',
    label: 'Risograph',
    icon: '🖨️',
    designIntelligenceHint:
      'STYLE OVERRIDE — USER SELECTED RISOGRAPH: Indie riso print — 2 to 3 bright spot inks (no full CMYK), visible coarse grain, deliberate layer misregistration, overprint blend where inks overlap, matte paper. Use CONCEPT 2 or 3.',
    geminiStyleLock:
      'Risograph print craft. The image is built from just two or three bright spot inks (fluoro pink, blue, yellow, green) — NO full-colour photography — laid as separate layers with deliberate misregistration, so edges sit slightly offset and overlapping inks overprint into a third multiplied hue. Coarse riso grain and gentle mottle throughout, matte uncoated-paper texture, a slightly imperfect hand-printed charm. Simplified flat shapes and halftone gradients in each ink. Contemporary indie art-print / riso-zine energy. Mood: warm, crafty, indie, tactile. The image looks pulled off a real risograph drum.',
    compatibleConcepts: [
      { name: 'TWO-INK-SCENE', description: 'A simplified scene in two spot inks with overprint where they overlap, indie riso warmth.' },
      { name: 'MISREGISTER-LAYERS', description: 'Deliberately offset ink layers create a charming hand-printed misregistration effect.' },
      { name: 'RISO-HALFTONE-GRADIENT', description: 'Coarse riso halftone gradients in each spot ink build soft tone from flat colour.' },
      { name: 'OVERPRINT-MOTIF', description: 'A bold motif where two inks overlap into a multiplied third hue — the overprint IS the highlight.' },
    ],
    designerReferences: [
      'contemporary risograph art-print studios',
      'riso-zine / indie comics culture',
      'mid-century spot-colour print',
      'Risotto Studio / Nous Vous riso work',
      'fluoro-ink screen-print tradition',
    ],
    craftSignatures: [
      'only two or three bright spot inks — no full CMYK photography',
      'deliberate layer misregistration with slightly offset edges',
      'overprint blend where inks overlap into a multiplied hue',
      'coarse riso grain and gentle mottle throughout',
      'matte uncoated-paper texture and hand-printed charm',
      'simplified flat shapes with riso-halftone gradients',
    ],
    bannedCombinations: [
      { when: 'this risograph style is selected', avoid: 'full-colour photoreal rendering or glossy gradients', because: 'Riso is a limited spot-ink print; full colour and gloss break the craft.' },
      { when: 'a high-gloss premium or corporate brief', avoid: 'imperfect indie riso grain and misregistration', because: 'It codes crafty / indie, not slick-premium — register mismatch.' },
      { when: 'this risograph style is selected', avoid: 'more than three inks or seamless registration', because: 'The whole identity is few inks plus visible misregistration; cleaning that up loses the look.' },
    ],
  },
  {
    id: 'luxury',
    label: 'Luxury',
    icon: '👑',
    designIntelligenceHint:
      'STYLE OVERRIDE — USER SELECTED LUXURY GALA: Black or deep-jewel ground with real gold-foil accents, elegant high-contrast serif type, foil-stamp shine, generous space, restrained ornament. Awards / gala / anniversary elegance. Use CONCEPT 2.',
    geminiStyleLock:
      'Luxury foil-stamp elegance. A deep black or jewel-tone ground (obsidian, midnight navy, oxblood, forest) carries real metallic gold-foil accents that catch light with a true foil sheen — a thin gold hairline frame, a small foil monogram or emblem, elegant gold detailing. High-contrast modern serif typography (sharp thin-and-thick strokes) set with generous letter-spacing and luxurious negative space. Restrained ornament, impeccable balance, embossed depth. Cartier / Chanel / five-star-invitation refinement. Mood: premium, elegant, exclusive, timeless. The image feels expensive and quietly confident.',
    compatibleConcepts: [
      { name: 'FOIL-MONOGRAM-HERO', description: 'A small gold-foil monogram or emblem on a deep jewel ground, framed by a thin gold hairline — quiet luxury.' },
      { name: 'SERIF-GALA-LOCKUP', description: 'An elegant high-contrast serif lockup with generous spacing, gold detailing, and luxurious negative space.' },
      { name: 'EMBOSS-DETAIL-MACRO', description: 'A close foil-emboss detail catching light, premium and tactile, on dark stock.' },
      { name: 'JEWEL-GROUND-RESTRAINT', description: 'A rich jewel-tone field with one restrained gold ornament — exclusivity through restraint.' },
    ],
    designerReferences: [
      'Cartier / Chanel luxury branding',
      'five-star event invitation design',
      'foil-stamp / letterpress stationery craft',
      'high-fashion editorial elegance (Vogue masthead)',
      'premium spirits / watch packaging',
    ],
    craftSignatures: [
      'a deep black or jewel-tone ground (obsidian, navy, oxblood, forest)',
      'real metallic gold-foil accents with a true light-catching sheen',
      'a thin gold hairline frame and a small foil monogram or emblem',
      'high-contrast modern serif type with generous letter-spacing',
      'luxurious negative space and impeccable balance',
      'restrained ornament, embossed depth, timeless refinement',
    ],
    bannedCombinations: [
      { when: 'a playful, casual, or kids brief', avoid: 'austere black-and-gold luxury formality', because: 'It codes exclusive / formal — wrong register for playful or childlike events.' },
      { when: 'this luxury style is selected', avoid: 'bright saturated pop colours, clutter, or cartoon motifs', because: 'Luxury lives on restraint and a dark jewel-plus-gold palette; loud colour cheapens it.' },
      { when: 'this luxury style is selected', avoid: 'flat matte gold with no light variation', because: 'Foil reads as luxury only when it catches light; flat gold looks like a plain yellow fill.' },
    ],
  },
  {
    id: 'movie-keyart',
    label: 'Movie Poster',
    icon: '🎞️',
    designIntelligenceHint:
      'STYLE OVERRIDE — USER SELECTED MOVIE KEY-ART: Compose like a theatrical film poster — a dramatic hero montage, a big stylised title treatment low on the canvas, a small "billing block" credit line, cinematic colour grade and lighting. Use CONCEPT 1.',
    geminiStyleLock:
      'Theatrical movie key-art. A dramatic cinematic hero composition — a central character or montage of layered figures and scene fragments fading into atmospheric darkness, lit with a bold cinematic colour grade (teal-and-orange, or a single dramatic hue). A large stylised TITLE TREATMENT anchors the lower third — custom display lettering with a metal, glow, or texture finish — and a small condensed "billing block" credit line sits beneath it. Volumetric haze, lens flare, layered depth. Drew Struzan montage craft / Saul Bass graphic boldness / modern blockbuster key-art. Mood: epic, dramatic, anticipatory, cinematic. The image sells a story the way a film one-sheet does.',
    compatibleConcepts: [
      { name: 'HERO-MONTAGE-ONESHEET', description: 'A layered montage of figures and scene fragments fading into darkness with a big title low on the canvas — Drew Struzan one-sheet craft.' },
      { name: 'SINGLE-CHARACTER-KEYART', description: 'One dramatic hero figure lit cinematically against atmospheric depth, the title treatment anchoring the lower third.' },
      { name: 'GRAPHIC-BASS-POSTER', description: 'A bold Saul-Bass graphic concept — one striking symbolic image and a confident title, minimal and iconic.' },
      { name: 'TITLE-TREATMENT-HERO', description: 'A massive stylised film-title treatment (metal / glow / texture) IS the hero, with a small montage above and a billing block beneath.' },
    ],
    designerReferences: [
      'Drew Struzan (painted montage one-sheets)',
      'Saul Bass (graphic film posters)',
      'modern blockbuster key-art (Marvel / Dune)',
      'classic Hollywood one-sheet tradition',
      'BLT Communications theatrical design',
    ],
    craftSignatures: [
      'a dramatic hero montage fading into atmospheric darkness',
      'a bold cinematic colour grade (teal-and-orange or one dramatic hue)',
      'a large stylised title treatment anchoring the lower third',
      'a small condensed billing-block credit line beneath the title',
      'volumetric haze, lens flare, and layered depth',
      'epic, dramatic, anticipatory cinematic energy',
    ],
    bannedCombinations: [
      { when: 'a light, casual, or purely informational brief', avoid: 'epic blockbuster movie-poster drama', because: 'It codes cinematic / event-of-the-year — overblown for low-key informational notices.' },
      { when: 'this movie key-art style is selected', avoid: 'flat even lighting or a clean white background', because: 'Film key-art lives on dramatic light and atmospheric depth; flat lighting kills it.' },
      { when: 'rendering the title treatment', avoid: 'long sentences inside the title lockup', because: 'Image models garble long titles; keep the title-treatment string short and bold.' },
    ],
  },
  {
    id: 'monoline',
    label: 'Line Art',
    icon: '✒️',
    designIntelligenceHint:
      'STYLE OVERRIDE — USER SELECTED MONOLINE LINE-ART: Single continuous-weight line illustration — elegant minimal contour drawing, one or two line colours on a calm ground, no fills or shading. Editorial and refined. Use CONCEPT 2.',
    geminiStyleLock:
      'Monoline continuous-line illustration. Everything is drawn with a single, even line weight — elegant unbroken contour lines that describe figures, objects, or motifs with confident economy, ideally as one continuous flowing stroke. One or two line colours (a brand hue, maybe a single accent) on a calm flat ground; minimal or no fills, no shading, no texture. Generous negative space, refined editorial balance. Single-line-art / New-Yorker-spot / modern-editorial sensibility. Mood: elegant, intelligent, light, contemporary. The whole image lives in the grace of one line.',
    compatibleConcepts: [
      { name: 'CONTINUOUS-SINGLE-LINE', description: 'One unbroken continuous line describes the whole subject — the elegance is in never lifting the pen.' },
      { name: 'MONOLINE-ICON-MOTIF', description: 'A refined monoline icon or motif sits on a calm ground with generous space, editorial and light.' },
      { name: 'LINE-FIGURE-GESTURE', description: 'A gestural monoline figure caught in motion, pure contour, no fills.' },
      { name: 'TWO-COLOUR-LINE-COMPOSITION', description: 'A composition in two line colours only, layered contours creating depth without shading.' },
    ],
    designerReferences: [
      'Picasso single-line drawings',
      'Matisse line contour',
      'New Yorker spot illustration',
      'modern monoline editorial illustrators',
      'continuous-line tattoo art',
    ],
    craftSignatures: [
      'a single even line weight throughout — no thick-thin variation',
      'elegant unbroken contour lines, ideally one continuous stroke',
      'one or two line colours on a calm flat ground',
      'minimal or no fills, no shading, no texture',
      'generous negative space and refined editorial balance',
      'elegant, intelligent, light, contemporary',
    ],
    bannedCombinations: [
      { when: 'this monoline style is selected', avoid: 'solid fills, gradients, photoreal shading, or heavy texture', because: 'Monoline is pure line; fills and shading turn it into a different illustration style.' },
      { when: 'a loud, high-energy, or maximalist brief', avoid: 'sparse delicate line-art when the brief needs punch', because: 'It codes refined / quiet — wrong register for loud maximalist events.' },
      { when: 'this monoline style is selected', avoid: 'dramatic line-weight variation or many colours', because: 'The identity is ONE even weight and a tiny palette; breaking that loses the monoline elegance.' },
    ],
  },
  {
    id: 'bw-editorial',
    label: 'B&W Photo',
    icon: '⚫',
    designIntelligenceHint:
      'STYLE OVERRIDE — USER SELECTED BLACK & WHITE EDITORIAL: A timeless monochrome photograph of the real scene — rich full tonal range from deep blacks to bright whites, documentary honesty, film grain. No colour at all. Use CONCEPT 1 (LITERAL SCENE).',
    geminiStyleLock:
      'Timeless black-and-white editorial photojournalism. A real monochrome photograph with a rich full tonal range — deep velvety blacks, luminous highlights, sculpted mid-tone greys. Real people in a real venue, documentary honesty, natural available light shaping form. 35mm full-frame depth, fine silver film grain, no colour anywhere. Henri Cartier-Bresson decisive-moment composition, Sebastião Salgado tonal drama, Ansel-Adams highlight-to-shadow range. Mood: timeless, dignified, honest, cinematic. The absence of colour makes the moment feel permanent.',
    compatibleConcepts: [
      { name: 'DECISIVE-MOMENT-MONO', description: 'A Cartier-Bresson decisive moment in pure black-and-white — the instant everything aligns, rich tonal range.' },
      { name: 'TONAL-DRAMA-PORTRAIT', description: 'A Salgado-style monochrome portrait sculpted by light, deep blacks and luminous highlights.' },
      { name: 'DOCUMENTARY-MONO-SCENE', description: 'An honest black-and-white documentary scene of the real event, natural light, full grey scale.' },
      { name: 'HIGH-CONTRAST-GRAPHIC-MONO', description: 'A graphic high-contrast black-and-white composition, bold shapes of pure black and white.' },
    ],
    designerReferences: [
      'Henri Cartier-Bresson (decisive moment)',
      'Sebastião Salgado (monochrome tonal drama)',
      'Ansel Adams (zone-system tonal range)',
      'Raghu Rai (Indian black-and-white reportage)',
      'classic LIFE-magazine photojournalism',
    ],
    craftSignatures: [
      'a rich full tonal range — deep velvety blacks to luminous highlights',
      'real people in a real venue, documentary honesty',
      'natural available light sculpting form, no studio strobe',
      '35mm full-frame depth with fine silver film grain',
      'absolutely no colour — pure monochrome',
      'timeless, dignified, honest, cinematic',
    ],
    bannedCombinations: [
      { when: 'a vibrant festival or celebration brief', avoid: 'sombre monochrome when the brief needs colour and joy', because: 'B&W codes timeless / serious — it can drain the energy from a colourful celebration.' },
      { when: 'this black-and-white style is selected', avoid: 'any colour element, colour tint, or duotone treatment', because: 'The identity is pure monochrome; any colour breaks it (that would be duotone).' },
      { when: 'this style is selected', avoid: 'flat grey low-contrast rendering', because: 'B&W editorial needs the full range — deep blacks and bright whites; flat grey looks washed out.' },
    ],
  },
  {
    id: 'temple-mural',
    label: 'Temple Mural',
    icon: '🛕',
    designIntelligenceHint:
      'STYLE OVERRIDE — USER SELECTED INDIAN TEMPLE MURAL: Render in the South-Indian temple-mural tradition (Kerala mural / Tanjore painting) — rich earthy ochre, terracotta, indigo and deep red, gold-leaf accents, ornate borders, stylised figures with almond eyes, flat decorative depth. Use CONCEPT 2 or 3.',
    geminiStyleLock:
      'South-Indian temple-mural tradition (Kerala mural & Tanjore painting). Rich natural pigment palette — ochre yellow, terracotta red, deep indigo, leaf green, lamp black — with real gold-leaf accents catching light. Stylised figures with elongated almond eyes, graceful hand gestures (mudras), and decorative crowns, set against flat ornamental depth. Intricate borders of lotus, creeper, and kolam motifs frame the composition; gesso-relief embossing and gold foil on the focal elements. Kerala-mural linework meets Tanjore gilded richness. Mood: sacred, ornate, ancestral, opulent. The image feels painted on a temple wall and gilded by hand.',
    compatibleConcepts: [
      { name: 'GILDED-FOCAL-FIGURE', description: 'A stylised central figure or motif with almond eyes and mudras, gold-leaf gilded, framed by ornate borders — Tanjore opulence.' },
      { name: 'KERALA-MURAL-SCENE', description: 'A flat decorative mural scene in natural pigments with graceful figures and creeper borders — Kerala temple-wall craft.' },
      { name: 'LOTUS-BORDER-EMBLEM', description: 'A focal emblem framed by intricate lotus, creeper, and kolam borders, gold on earthy pigment.' },
      { name: 'GESSO-RELIEF-DETAIL', description: 'Gesso-relief embossing and gold foil lift the focal elements into tactile gilded depth.' },
    ],
    designerReferences: [
      'Kerala temple-mural tradition',
      'Tanjore (Thanjavur) gilded painting',
      'Mysore traditional painting',
      'South-Indian gopuram fresco art',
      'palm-leaf manuscript illumination',
    ],
    craftSignatures: [
      'a natural pigment palette — ochre, terracotta, indigo, leaf green, lamp black',
      'real gold-leaf accents catching light on the focal elements',
      'stylised figures with elongated almond eyes and graceful mudras',
      'intricate lotus, creeper, and kolam decorative borders',
      'gesso-relief embossing and flat ornamental depth',
      'sacred, ornate, ancestral, opulent',
    ],
    bannedCombinations: [
      { when: 'a modern, corporate, or tech brief', avoid: 'heavy sacred temple-mural ornament', because: 'It codes devotional / heritage — mismatched on contemporary corporate or tech events.' },
      { when: 'a joyful living-person birthday', avoid: 'deity-like gilded reverence around the person', because: 'Sacred temple-mural treatment of a living person reads as devotional / memorial; reserve it for cultural, spiritual, and festival briefs.' },
      { when: 'this temple-mural style is selected', avoid: 'photoreal depth, lens blur, or flat digital gradients', because: 'It is hand-painted flat ornamental craft; photoreal or digital-flat elements break the tradition.' },
    ],
  },
  {
    id: 'gond',
    label: 'Gond Art',
    icon: '🦚',
    designIntelligenceHint:
      'STYLE OVERRIDE — USER SELECTED GOND TRIBAL ART: Render in the Central-Indian Gond folk tradition — bold flat figures of animals, trees, and people filled entirely with rhythmic patterns of fine dots, dashes, and lines, vivid saturated colours on a dark or warm ground. Use CONCEPT 2 or 3.',
    geminiStyleLock:
      'Gond tribal folk art (Central India, Pradhan Gond tradition). Bold flat silhouettes of animals, trees, birds, and people, each filled ENTIRELY with rhythmic signature patterns — rows of fine dots, dashes, commas, and parallel lines that pulse with movement. Vivid saturated colours (often on a dark or warm earthy ground), every form outlined and densely in-filled, no empty space inside the shapes. Interconnected motifs of nature, folklore, and daily life flow across the canvas. Jangarh Singh Shyam lineage, contemporary Gond-art revival. Mood: vibrant, rhythmic, ancestral, alive. The image hums with hand-drawn pattern.',
    compatibleConcepts: [
      { name: 'PATTERN-FILLED-CREATURE', description: 'A bold flat animal, bird, or tree filled entirely with rhythmic Gond dot-and-dash patterning is the hero.' },
      { name: 'GOND-TREE-OF-LIFE', description: 'A flowing tree-of-life with interconnected creatures and motifs, every form pattern-filled.' },
      { name: 'FOLKLORE-NARRATIVE-FIELD', description: 'Interconnected figures of folklore and daily life flow across the canvas in dense rhythmic pattern.' },
      { name: 'DOT-DASH-MOTIF-HERO', description: 'A single nature motif rendered in signature fine dots and dashes on a warm or dark ground.' },
    ],
    designerReferences: [
      'Jangarh Singh Shyam (Pradhan Gond master)',
      'Gond tribal painting tradition (Madhya Pradesh)',
      'Bhajju Shyam contemporary Gond art',
      'Indian tribal / Adivasi folk art',
      'Patangarh school of Gond painting',
    ],
    craftSignatures: [
      'bold flat silhouettes of animals, trees, birds, and people',
      'every form filled ENTIRELY with rhythmic dots, dashes, and lines',
      'vivid saturated colours on a dark or warm earthy ground',
      'confident outlines with dense pattern in-fill, no empty interior',
      'interconnected motifs of nature, folklore, and daily life',
      'vibrant, rhythmic, ancestral, alive',
    ],
    bannedCombinations: [
      { when: 'a corporate, tech, or formal brief', avoid: 'dense tribal Gond folk patterning as the whole look', because: 'It codes folk / cultural — can feel mismatched on sleek corporate or tech events.' },
      { when: 'this Gond style is selected', avoid: 'photoreal rendering, lens blur, or empty flat fills inside the forms', because: 'Gond identity is pattern-filled flat folk art; photoreal or empty fills break the tradition.' },
      { when: 'depicting people', avoid: 'realistic anatomical portraiture', because: 'Gond figures are stylised flat folk forms; realistic portraiture is the wrong idiom here.' },
    ],
  },
  {
    id: 'chalkboard',
    label: 'Chalkboard',
    icon: '🖍️',
    designIntelligenceHint:
      'STYLE OVERRIDE — USER SELECTED CHALKBOARD: Hand-lettered chalk on a blackboard — white and pastel chalk strokes, decorative chalk lettering and flourishes, doodle frames and banners, slight smudge and dust. Cafe / casual / community vibe. Use CONCEPT 2 or 3.',
    geminiStyleLock:
      'Hand-lettered chalkboard art. A dark slate-black (or deep green) blackboard ground with white and soft-pastel chalk strokes — decorative hand-lettering mixing script and bold caps, chalk flourishes, hand-drawn banners, arrows, laurels, and doodle frames. Visible chalk grain, gentle smudges, eraser ghosts, and chalk dust give authentic texture. Cafe-menu / wedding-welcome-board / classroom charm. Mood: warm, friendly, handmade, inviting. The image looks lovingly drawn in chalk by hand.',
    compatibleConcepts: [
      { name: 'CHALK-LETTERING-HERO', description: 'Decorative hand-lettered chalk typography mixing script and bold caps IS the hero, with flourishes and banners.' },
      { name: 'DOODLE-FRAME-BOARD', description: 'Hand-drawn chalk doodle frames, laurels, and arrows organise the content on a slate ground.' },
      { name: 'CAFE-MENU-BOARD', description: 'A cafe-menu-board layout with chalk illustrations and tidy hand-lettered sections.' },
      { name: 'CHALK-ILLUSTRATION-MOTIF', description: 'A charming white-chalk illustration motif on the blackboard, sketchy and warm.' },
    ],
    designerReferences: [
      'cafe / bistro chalkboard menu art',
      'wedding chalkboard welcome signs',
      'vintage schoolroom blackboard lettering',
      'hand-lettering / chalk-typography revival',
      'sign-painter chalk craft',
    ],
    craftSignatures: [
      'a dark slate-black or deep-green blackboard ground',
      'white and soft-pastel chalk strokes with visible grain',
      'decorative hand-lettering mixing script and bold caps',
      'chalk flourishes, banners, arrows, laurels, doodle frames',
      'gentle smudges, eraser ghosts, and chalk dust texture',
      'warm, friendly, handmade, inviting',
    ],
    bannedCombinations: [
      { when: 'a premium, luxury, or high-tech brief', avoid: 'casual handmade chalkboard charm', because: 'It codes cafe / casual / community — wrong register for sleek premium or tech events.' },
      { when: 'this chalkboard style is selected', avoid: 'photoreal scenes, glossy gradients, or crisp vector fills', because: 'Chalkboard is hand-drawn chalk on slate; photoreal or vector elements break the handmade feel.' },
      { when: 'this chalkboard style is selected', avoid: 'a white or light background', because: 'The chalk reads only against a dark slate board; a light ground defeats the medium.' },
    ],
  },
  {
    id: 'double-exposure',
    label: 'Double Exposure',
    icon: '🌗',
    designIntelligenceHint:
      'STYLE OVERRIDE — USER SELECTED DOUBLE EXPOSURE: Blend a bold silhouette (a head profile, a figure, a key shape) with a second scene/landscape showing through it — artistic photographic multiply-blend, clean negative space around the silhouette. Use CONCEPT 1 or 3.',
    geminiStyleLock:
      'Artistic double-exposure photography. A bold primary silhouette — a head profile, a figure, a tree, a key shape — is filled with a second photographic scene showing through it (a landscape, a cityscape, a crowd, foliage), blended where the two images multiply together. The silhouette holds crisp edges against clean negative space; the inner scene fades softly toward the silhouette edges. A restrained palette, often near-monochrome with one tint, keeps it elegant. Contemporary editorial / book-cover / title-sequence craft. Mood: poetic, layered, conceptual, cinematic. Two images become one idea.',
    compatibleConcepts: [
      { name: 'PROFILE-LANDSCAPE-BLEND', description: 'A head or figure profile filled with a meaningful landscape or scene showing through — the classic poetic double-exposure.' },
      { name: 'SILHOUETTE-CITY-BLEND', description: 'A bold silhouette filled with a cityscape or crowd, the second scene living inside the first.' },
      { name: 'NATURE-FIGURE-MERGE', description: 'A figure merged with foliage, water, or sky, the two images multiplying into one idea.' },
      { name: 'SHAPE-SCENE-INSET', description: 'A key symbolic shape holds a scene inside it against clean negative space, conceptual and elegant.' },
    ],
    designerReferences: [
      'True Detective title-sequence double exposure',
      'contemporary editorial double-exposure portraiture',
      'book-cover conceptual photography',
      'Dan Mountford double-exposure art',
      'fashion-magazine multiply-blend imagery',
    ],
    craftSignatures: [
      'a bold primary silhouette with crisp edges against clean negative space',
      'a second photographic scene showing through the silhouette',
      'soft multiply-blend where the two images overlap',
      'the inner scene fading gently toward the silhouette edges',
      'a restrained palette, often near-monochrome with one tint',
      'poetic, layered, conceptual, cinematic',
    ],
    bannedCombinations: [
      { when: 'a loud, playful, or maximalist brief', avoid: 'quiet poetic double-exposure subtlety', because: 'It codes conceptual / elegant — wrong register for loud playful events.' },
      { when: 'this double-exposure style is selected', avoid: 'a cluttered busy silhouette or many competing blends', because: 'The effect needs ONE clear silhouette and ONE inner scene; clutter muddies the idea.' },
      { when: 'this style is selected', avoid: 'flat solid fills with no second image inside the silhouette', because: 'The whole identity is the second scene blended within; without it, it is just a silhouette.' },
    ],
  },
  {
    id: 'collegiate',
    label: 'Collegiate',
    icon: '🎓',
    designIntelligenceHint:
      'STYLE OVERRIDE — USER SELECTED COLLEGIATE / ACADEMIC: Heraldic campus crest, deep navy / maroon with gold, classic serif and varsity-block type, laurel and ribbon motifs, scholarly symmetry. Convocations / academic events / departments. Use CONCEPT 2.',
    geminiStyleLock:
      'Collegiate heraldic academia. A deep academic palette — navy, maroon, or forest with antique gold — anchors a symmetrical, scholarly composition. A central heraldic crest or shield with laurel wreaths, ribbons, an open book, a torch, or a quill; classic high-contrast serif typography paired with collegiate varsity-block lettering; a fine gold rule frame and crest detailing. Ivy-league / convocation / honour-society dignity. Mood: scholarly, prestigious, dignified, traditional. The image carries the gravitas of an academic institution.',
    compatibleConcepts: [
      { name: 'HERALDIC-CREST-HERO', description: 'A central heraldic crest or shield with laurels, ribbon, book, or torch anchors a symmetrical scholarly composition.' },
      { name: 'CONVOCATION-FORMAL', description: 'A formal symmetrical academic lockup in navy-and-gold with serif type — convocation / honour dignity.' },
      { name: 'LAUREL-EMBLEM-FRAME', description: 'A gold laurel wreath frames a focal emblem on a deep academic ground, prestigious and traditional.' },
      { name: 'VARSITY-SERIF-LOCKUP', description: 'A collegiate varsity-block plus classic serif type lockup with a fine gold rule frame.' },
    ],
    designerReferences: [
      'Ivy-league university heraldry',
      'academic convocation / diploma design',
      'honour-society and crest engraving',
      'classic collegiate athletic lettering',
      'traditional university press typography',
    ],
    craftSignatures: [
      'a deep academic palette — navy, maroon, or forest with antique gold',
      'a central heraldic crest or shield with laurels, ribbon, book, or torch',
      'classic high-contrast serif paired with collegiate varsity-block type',
      'a fine gold rule frame and crest detailing',
      'symmetrical, balanced, scholarly composition',
      'scholarly, prestigious, dignified, traditional',
    ],
    bannedCombinations: [
      { when: 'a casual, playful, or youth-fun brief', avoid: 'formal heraldic collegiate gravitas', because: 'It codes prestigious / traditional — wrong register for casual or playful campus events.' },
      { when: 'this collegiate style is selected', avoid: 'neon, pop, or trendy graphic treatment', because: 'Collegiate heraldry is traditional and dignified; trendy graphics break the academic register.' },
      { when: 'this collegiate style is selected', avoid: 'asymmetric chaotic layout', because: 'Heraldic academia relies on symmetry and balance; chaos undercuts the gravitas.' },
    ],
  },
  {
    id: 'tech-hud',
    label: 'Tech Fest',
    icon: '🤖',
    designIntelligenceHint:
      'STYLE OVERRIDE — USER SELECTED TECH-FEST HUD: Futuristic sci-fi heads-up-display — glowing UI panels, circuit-board traces, data grids, holographic rings and reticles, thin neon-on-dark line-work, digital glow. Hackathons / tech symposia / robotics. Use CONCEPT 3.',
    geminiStyleLock:
      'Sci-fi heads-up-display (HUD) tech-fest design. A deep dark-blue or black ground alive with glowing UI — thin luminous circuit-board traces, hexagonal data grids, holographic rings, targeting reticles, waveform and code fragments, floating glassy panels with crisp neon line-work in cyan, electric blue, and the brand accent. Subtle scanlines and a faint grid horizon; digital glow and lens bloom on the brightest lines. Iron-Man-HUD / Tron / sci-fi-interface vocabulary. Mood: futuristic, intelligent, high-energy, digital. The image feels like a holographic interface booting up.',
    compatibleConcepts: [
      { name: 'HUD-INTERFACE-FIELD', description: 'Glowing holographic UI panels, rings, and reticles float on a dark ground — a sci-fi interface as the whole composition.' },
      { name: 'CIRCUIT-TRACE-MOTIF', description: 'Luminous circuit-board traces and a hex data-grid form a glowing tech motif around the focal element.' },
      { name: 'HOLO-RING-HERO', description: 'Concentric holographic rings and a reticle frame a central glowing focal element, Iron-Man-HUD energy.' },
      { name: 'DATA-GRID-HORIZON', description: 'A faint Tron grid horizon with floating data panels and code fragments, digital depth.' },
    ],
    designerReferences: [
      'Iron Man / MCU holographic HUD design',
      'Tron light-grid aesthetic',
      'sci-fi film UI (Territory Studio / GMUNK)',
      'hackathon / tech-fest key art',
      'cyber FUI (fantasy user interface) art',
    ],
    craftSignatures: [
      'a deep dark-blue or black ground with glowing UI',
      'thin luminous circuit-board traces and hexagonal data grids',
      'holographic rings, targeting reticles, waveforms, code fragments',
      'crisp neon line-work in cyan, electric blue, and the brand accent',
      'subtle scanlines, a faint grid horizon, digital glow and bloom',
      'futuristic, intelligent, high-energy, digital',
    ],
    bannedCombinations: [
      { when: 'a heritage, cultural, or solemn brief', avoid: 'futuristic sci-fi HUD circuitry', because: 'It codes tech / futuristic — mismatched on heritage or solemn occasions.' },
      { when: 'this tech-HUD style is selected', avoid: 'bright daylight, pastel palettes, or photoreal natural scenes', because: 'HUD glow reads only on a dark digital ground; light natural scenes kill it.' },
      { when: 'this style is selected', avoid: 'rendering long code or UI text as literal readable strings', because: 'Image models garble dense UI text; keep code / data as suggestive texture, not literal paragraphs.' },
    ],
  },
  {
    id: 'varsity',
    label: 'Varsity',
    icon: '🏆',
    designIntelligenceHint:
      'STYLE OVERRIDE — USER SELECTED VARSITY ATHLETIC: Bold collegiate sports graphic — varsity-block and athletic-script lettering, jersey numbers, team-banner stripes, chevrons, a stadium / field energy, athletic-team palette. Sports day / tournaments. Use CONCEPT 1 or 2.',
    geminiStyleLock:
      'Varsity athletic sports graphic. Bold collegiate sports design — big varsity-block letterforms with felt-patch layered outlines, athletic brush-script accents, large jersey numerals, team-banner stripes and chevrons, a laurel or shield athletic badge. A confident two-or-three colour team palette over a stadium, field, or halftone-action ground; dynamic diagonal energy. American-collegiate / sports-team / tournament-poster vocabulary. Mood: bold, energetic, competitive, team-proud. The image feels like a championship banner.',
    compatibleConcepts: [
      { name: 'VARSITY-LETTER-HERO', description: 'Big varsity-block lettering with felt-patch layered outlines and a jersey numeral dominates as the athletic hero.' },
      { name: 'ATHLETIC-BADGE-CREST', description: 'A sports badge / shield with laurels, banner ribbon, and team palette anchors the composition.' },
      { name: 'STADIUM-ACTION-GROUND', description: 'A stadium or field ground with halftone-action energy behind bold athletic type and chevrons.' },
      { name: 'TEAM-BANNER-STRIPES', description: 'Team-banner stripes, chevrons, and diagonal energy build a tournament-poster lockup.' },
    ],
    designerReferences: [
      'American collegiate athletic branding',
      'vintage varsity letterman lettering',
      'sports-team / tournament poster design',
      'Nike sports key-art energy',
      'esports / league banner graphics',
    ],
    craftSignatures: [
      'big varsity-block letterforms with felt-patch layered outlines',
      'athletic brush-script accents and large jersey numerals',
      'team-banner stripes, chevrons, and a laurel / shield badge',
      'a confident two-or-three colour team palette',
      'a stadium, field, or halftone-action ground with diagonal energy',
      'bold, energetic, competitive, team-proud',
    ],
    bannedCombinations: [
      { when: 'a calm, formal, or solemn brief', avoid: 'loud competitive varsity-athletic energy', because: 'It codes sporty / team-proud — wrong register for calm or solemn occasions.' },
      { when: 'this varsity style is selected', avoid: 'delicate thin type, pastel palettes, or quiet minimalism', because: 'Varsity is bold athletic graphic; delicate restraint contradicts the team-banner energy.' },
      { when: 'rendering jersey numerals or letters', avoid: 'long words inside the felt-patch lockup', because: 'Image models garble long text in heavy layered letterforms; keep the varsity string short and bold.' },
    ],
  },
  {
    id: 'campus-doodle',
    label: 'Campus Doodle',
    icon: '📓',
    designIntelligenceHint:
      'STYLE OVERRIDE — USER SELECTED CAMPUS DOODLE: Student-notebook aesthetic — ruled or grid paper ground, ballpoint and marker doodles, sticky notes, washi tape, highlighter swipes, hand-drawn arrows and stars, scribbled hand-lettering. Freshers / clubs / fun campus notices. Use CONCEPT 2 or 3.',
    geminiStyleLock:
      'Student-notebook doodle aesthetic. A ruled-line or grid paper ground covered in playful hand-drawn ballpoint and marker doodles — stars, arrows, hearts, speech bubbles, little characters, underlines and circles. Stuck-on elements: yellow sticky notes, strips of washi tape, a paper-clip, a torn notebook edge, highlighter swipes glowing under key words. Scribbled mixed hand-lettering, casual and imperfect. Bullet-journal / scrapbook / study-aesthetic charm. Mood: playful, youthful, personal, fun. The image looks like a creative student decorated their notebook page.',
    compatibleConcepts: [
      { name: 'NOTEBOOK-PAGE-LAYOUT', description: 'A ruled or grid notebook page with doodles, sticky notes, and highlighter swipes organising the content casually.' },
      { name: 'DOODLE-CHARACTER-FUN', description: 'Playful hand-drawn ballpoint characters and doodles bounce around the focal text, youthful and personal.' },
      { name: 'STICKY-NOTE-COLLAGE', description: 'Sticky notes, washi tape, and paper-clipped scraps collage the event details, scrapbook charm.' },
      { name: 'HIGHLIGHTER-EMPHASIS', description: 'Highlighter swipes and hand-drawn arrows / stars emphasise key words on a paper ground.' },
    ],
    designerReferences: [
      'bullet-journal / study-aesthetic design',
      'scrapbook and washi-tape craft',
      'student doodle / margin-art culture',
      'sticky-note and notebook lettering',
      'casual hand-lettered planner art',
    ],
    craftSignatures: [
      'a ruled-line or grid paper ground',
      'ballpoint and marker doodles — stars, arrows, hearts, little characters',
      'sticky notes, washi tape, paper-clip, torn notebook edge',
      'highlighter swipes glowing under key words',
      'scribbled mixed hand-lettering, casual and imperfect',
      'playful, youthful, personal, fun',
    ],
    bannedCombinations: [
      { when: 'a premium, formal, or corporate brief', avoid: 'casual student-notebook doodle charm', because: 'It codes youthful / informal — wrong register for premium or formal events.' },
      { when: 'this campus-doodle style is selected', avoid: 'photoreal scenes, glossy gradients, or slick vector polish', because: 'The aesthetic is hand-drawn on paper; polish breaks the personal notebook feel.' },
      { when: 'this style is selected', avoid: 'a dark or photographic background instead of paper', because: 'The doodles live on a light ruled-paper ground; losing the paper defeats the notebook concept.' },
    ],
  },
]

/**
 * The single source of truth for the default background style — used when the
 * user has not explicitly picked a style tile. Consumed by the UI picker
 * (LogosStylePanel display), the generation payloads (CanvasCreatePage), and the
 * backend routes (generate / generate-lab / generate-forge). Keeping ONE constant
 * here prevents the split-brain bug where the UI highlighted "Realistic" (scene)
 * while the Lab/Forge routes silently defaulted to 'pop-modern' — so the tile shown
 * disagreed with the style generated. `scene` is enriched (full styleContext concept
 * menu), so the Director still receives documentary guidance when this default fires.
 */
export const DEFAULT_BACKGROUND_STYLE: BackgroundStyleId = 'scene'

/**
 * UI grouping for the style picker. Styles are presented in collapsible category
 * sections instead of one flat 51-tile grid. This is presentation-only — it does
 * not affect generation. Any style id NOT listed here still appears (the helper
 * getGroupedBackgroundStyles() collects leftovers into an 'Other' group), so adding
 * a new style never silently hides it.
 */
export interface BackgroundStyleCategory {
  label: string
  styleIds: BackgroundStyleId[]
}

export const STYLE_CATEGORIES: BackgroundStyleCategory[] = [
  {
    label: 'Photographic',
    styleIds: ['scene', 'photo-real', 'photo-pop', 'bw-editorial', 'dark', 'bokeh', 'advertising', 'spotlight-event', 'split', 'movie-keyart', 'double-exposure'],
  },
  {
    label: 'Illustration',
    styleIds: ['illustrated', 'hand-drawn', 'naive', 'monoline', 'comic', 'papercut', 'collage', 'watercolor', 'risograph', 'retro'],
  },
  {
    label: 'Graphic & Type',
    styleIds: ['pop-modern', 'typographic', 'geometric', 'minimal', 'isometric', '3d-render', 'product', 'duotone'],
  },
  {
    label: 'Abstract & Atmospheric',
    styleIds: ['abstract', 'aurora', 'neon', 'glassmorphism', 'texture'],
  },
  {
    label: 'Cultural & Heritage',
    styleIds: ['mandala', 'folk-art', 'temple-mural', 'gond', 'patriotic', 'art-deco', 'festive'],
  },
  {
    label: 'Premium & Bold',
    styleIds: ['luxury', 'grunge', 'street', 'vaporwave', 'chalkboard'],
  },
  {
    label: 'Campus & Academic',
    styleIds: ['collegiate', 'varsity', 'tech-hud', 'campus-doodle'],
  },
  {
    label: 'Custom',
    styleIds: ['custom'],
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

/**
 * Returns the styles grouped into UI categories (per STYLE_CATEGORIES), resolving
 * each id to its full option. Empty categories are dropped, and any style not
 * assigned to a category is collected into a trailing 'Other' group so nothing is
 * ever hidden from the picker. Presentation-only.
 */
export function getGroupedBackgroundStyles(): Array<{ label: string; styles: BackgroundStyleOption[] }> {
  const seen = new Set<BackgroundStyleId>()
  const groups = STYLE_CATEGORIES.map((cat) => {
    const styles = cat.styleIds
      .map((id) => STYLE_INDEX.get(id))
      .filter((s): s is BackgroundStyleOption => !!s)
    styles.forEach((s) => seen.add(s.id))
    return { label: cat.label, styles }
  }).filter((g) => g.styles.length > 0)

  const leftovers = BACKGROUND_STYLES.filter((s) => !seen.has(s.id))
  if (leftovers.length > 0) groups.push({ label: 'Other', styles: leftovers })
  return groups
}
