/**
 * Person archetypes for event_poster × portrait-hero.
 *
 * Each archetype is a complete reference world a senior designer would reach for
 * when handed a brief about a single individual being honored. The visualScene
 * prose is intentionally cinematic and concrete — vague writing here = vague
 * Gemini output. Specificity is the whole point.
 */

import type { CreativeArchetype } from './index'

export const EVENT_POSTER_PERSON_ARCHETYPES: CreativeArchetype[] = [
  {
    id: 'time-100-portrait',
    name: 'TIME 100 Most Influential Portrait',
    applicableTo: {
      formats: ['event_poster', 'portrait_poster', 'instagram_post', 'linkedin_post'],
      subjectTypes: ['person'],
      strategies: ['portrait-hero'],
      formalities: ['professional', 'premium', 'exclusive'],
      energies: ['calm', 'moderate'],
    },
    referenceLanguage: {
      visualScene:
        'A single dignified head-and-shoulders portrait dominates the centre of the frame, gazing slightly off-camera with composed assurance. The backdrop is a smooth tonal gradient — charcoal at the edges fading to a warmer mid-tone behind the head, with a soft vignette that pulls the eye inward. The face is sculpted by a single sidelit key source so the bone structure carries the image. Typography lives in disciplined upper and lower bands, magazine-cover weight, never crowding the subject. The whole frame breathes journalistic seriousness — the kind of photograph that earns silence in a reader before they read the caption.',
      decorativeMotifs: [
        'thin red rule lines reminiscent of a TIME magazine border',
        'a single understated text-mark in serif weight',
        'soft vignette darkening at the four corners',
        'micro film-grain across the gradient',
      ],
      avoid: [
        'crowds or secondary figures',
        'ornate Indian motifs or floral garlands',
        'busy patterned backgrounds',
        'multiple competing focal points',
        'cartoon or illustrated treatments',
      ],
      lightingDirection:
        'Dramatic Rembrandt key light from upper-left at roughly 45°, soft fill from the right, subtle rim light separating the silhouette from the dark backdrop',
      paletteApproach:
        'Deep navy or charcoal backdrop with warm cream/gold accent type; one bright highlight colour drawn from the subject\'s clothing for editorial pop',
    },
    exampleBriefs: [
      'Honoring our Chairperson — Lifetime Achievement Recognition',
      'Distinguished Leadership Award presentation to Dr. Anand',
    ],
  },

  {
    id: 'vogue-india-cover',
    name: 'Vogue India Editorial Cover',
    applicableTo: {
      formats: ['event_poster', 'portrait_poster', 'instagram_post'],
      subjectTypes: ['person'],
      strategies: ['portrait-hero'],
      formalities: ['premium', 'exclusive'],
      energies: ['moderate', 'high'],
    },
    referenceLanguage: {
      visualScene:
        'A confident fashion-editorial portrait fills the frame from shoulders up, the subject styled with quiet glamour — a richly draped sari or sharply cut jacket whose colour carries the entire palette. Light is sculpted and dramatic, the cheekbones catching one bright plane, the opposite side falling into rich shadow. Typography is bold and luxurious, set tightly, sometimes overlapping the subject\'s hair or shoulder with confident disregard for safe margins. The background is plain studio paper — cream, oxblood, deep teal — selected to make the fabric sing. The mood is owned-the-room.',
      decorativeMotifs: [
        'oversized masthead-style headline in high-contrast serif',
        'a single tiny dateline strip in small caps',
        'fabric folds catching specular highlights',
        'a thin gold or copper hairline rule',
      ],
      avoid: [
        'corporate stiffness or boardroom backdrops',
        'busy decorative borders',
        'multiple subjects in frame',
        'crowded peripheral text',
        'flat even lighting',
      ],
      lightingDirection:
        'Strong single key from upper-right with a feathered softbox, deep shadow on opposite cheek, a thin kicker from behind separating hair from background',
      paletteApproach:
        'Single saturated wardrobe-driven colour story (oxblood, marigold, emerald, ink-navy) on a complementary studio backdrop; one luxe metallic accent for type',
    },
    exampleBriefs: [
      'Felicitating Women Leadership Award 2026 recipient',
      'Cover feature: Our New Director Dr. Priya Menon',
    ],
  },

  {
    id: 'royal-indian-tribute',
    name: 'Royal Indian Dynasty Tribute',
    applicableTo: {
      formats: ['event_poster', 'portrait_poster', 'invitation'],
      subjectTypes: ['person'],
      strategies: ['portrait-hero'],
      formalities: ['premium', 'exclusive'],
      energies: ['calm', 'moderate'],
    },
    referenceLanguage: {
      visualScene:
        'A reverent ceremonial portrait of the honoured figure rendered with the gravity of a Mysore palace painting. The backdrop is deep maroon or jewel-emerald with faint jaali screen patterns and paisley filigree dissolving at the edges. The subject is bathed in a warm halo of light from above, as if illuminated by temple lamps just out of frame. Gold leaf accents trace the borders and an arched motif rises behind the head like a royal mehrab. Typography is set in disciplined gold serif with restrained ornamentation. The whole composition feels ancestral and dignified — a tribute that takes itself seriously the way an elder deserves.',
      decorativeMotifs: [
        'mehrab arch silhouette framing the subject',
        'subtle jaali screen pattern fading at the perimeter',
        'gold-leaf paisley filigree in the corners',
        'small ceremonial diya glints at the lower edges',
        'gold serif lockup beneath the portrait',
      ],
      avoid: [
        'modern corporate cues',
        'casual or candid framing',
        'cartoon or sticker-art motifs',
        'cold blue lighting',
        'cluttered Western decorative borders',
      ],
      lightingDirection:
        'Warm overhead halo light as if from temple lamps, soft golden fill on the face, a darker frame around the perimeter so the figure glows out of the depth',
      paletteApproach:
        'Deep maroon, ink-emerald or aubergine base with antique-gold filigree and a single warm cream highlight on the face; no cool tones',
    },
    exampleBriefs: [
      'Happy Birthday to our beloved Chairperson Smt. JKKN Sendamaraai',
      'In loving memory of Thiru. Karthikeyan — Remembrance Ceremony',
    ],
  },

  {
    id: 'corporate-annual-report-leader',
    name: 'Fortune 500 Annual Report Leader Portrait',
    applicableTo: {
      formats: ['event_poster', 'portrait_poster', 'linkedin_post', 'linkedin_banner'],
      subjectTypes: ['person'],
      strategies: ['portrait-hero'],
      formalities: ['professional', 'premium'],
      energies: ['calm', 'moderate'],
    },
    referenceLanguage: {
      visualScene:
        'A poised three-quarter portrait of a senior leader photographed for the opening spread of a publicly-listed company\'s annual report. The subject stands or sits with quiet authority, hands relaxed, gaze level and unhurried. The backdrop is a clean architectural surface — a wall of polished stone, a slatted wooden screen, or a softly defocused boardroom — rendered in the organisation\'s brand colours. There is a generous block of negative space to one side, deliberately reserved for the year heading and a single confident pull-quote. Lighting is editorial-clean, modeled but not theatrical. The image whispers competence.',
      decorativeMotifs: [
        'a single horizontal hairline rule in brand colour',
        'a small year stamp (e.g. "2026") set in disciplined sans',
        'subtle vertical column guides in the negative-space block',
        'a quiet brand-coloured tag bar',
      ],
      avoid: [
        'decorative Indian motifs',
        'festive colour explosions',
        'multiple subjects',
        'busy patterned backdrops',
        'glamour or fashion lighting',
      ],
      lightingDirection:
        'Soft large-source key from camera-left at eye level, gentle fill, a clean ambient wash on the background to keep it readable but secondary',
      paletteApproach:
        'Organisation brand colour as backdrop tint (navy, slate, deep teal), neutral wardrobe, a single warm skin-tone highlight; type in white or brand accent only',
    },
    exampleBriefs: [
      'Welcome to Our New Director Dr. Priya Menon',
      'CEO Tribute — Annual Leadership Recognition',
    ],
  },

  {
    id: 'bollywood-birthday-tribute',
    name: 'Bollywood Poster-Style Birthday Tribute',
    applicableTo: {
      formats: ['event_poster', 'portrait_poster', 'invitation', 'instagram_post'],
      subjectTypes: ['person'],
      strategies: ['portrait-hero'],
      formalities: ['professional', 'premium'],
      energies: ['moderate', 'high'],
      // v53.3: Bollywood = Hindi-belt visual tradition. Reads as out-of-place
      // for Tamil Nadu / Kerala / South Indian audiences. Restrict to North India.
      regions: ['north-india'],
    },
    referenceLanguage: {
      visualScene:
        'A warm celebratory portrait styled in the visual language of a hand-painted Bollywood tribute poster from the golden era. The honoured figure is centred, glowing under a soft golden wash, with cascading marigold and rose garlands draped around the upper border. Ornate gold filigree frames the head like a temple shrine. The colour palette is sunset-warm — saffron, rose-pink, deep marigold — and the typography sits in a confident gold-leaf cartouche beneath the portrait, reading like a film title card. Behind the subject, a faint sunburst spreads outward in soft rays. The mood is devotional warmth, not red-carpet glamour.',
      decorativeMotifs: [
        'cascading marigold and rose garlands across the top edge',
        'gold filigree cartouche beneath the portrait',
        'soft sunburst rays emanating behind the head',
        'small lit oil-lamps at the lower corners',
        'hand-lettered gold birthday cartouche',
      ],
      avoid: [
        'cold or muted palettes',
        'corporate minimalism',
        'photo-real bokeh backgrounds',
        'modern san-serif type alone',
        'monochrome treatments',
      ],
      lightingDirection:
        'Warm golden top-light as if from chandelier brass, soft frontal fill, a subtle sunset glow rising from the lower edge',
      paletteApproach:
        'Saffron, marigold and rose-pink across the field with antique gold for type and frames; one rich red accent for the cartouche',
    },
    exampleBriefs: [
      'Birthday Wishes from the JKKN family to our Chairperson',
      'Felicitation Evening for Founder Mrs. Lakshmi Rajan',
    ],
  },

  {
    id: 'temple-honor-darshan',
    name: 'Temple Honor Darshan',
    applicableTo: {
      formats: ['event_poster', 'portrait_poster', 'invitation'],
      subjectTypes: ['person'],
      strategies: ['portrait-hero'],
      backgroundStyles: ['scene', 'dark', 'mandala', 'festive'],
      formalities: ['premium', 'exclusive'],
      energies: ['calm'],
    },
    referenceLanguage: {
      visualScene:
        'A reverential portrait that places the honoured elder in the visual register of a darshan — the sacred Indian act of seeing and being seen. Golden divine light descends from above and bathes the face, while the rest of the frame falls into respectful low-key shadow. Ceremonial flowers, brass lamps and a faint thread of incense smoke gather at the periphery. The subject is rendered with deep tonal depth, the eyes catching the divine light first. Typography is small, set in restrained Devanagari-inspired serifs at the very base of the frame, never competing with the figure. The composition asks the viewer to pause.',
      decorativeMotifs: [
        'descending golden light shafts from upper centre',
        'small brass diyas at the lower edges',
        'faint incense smoke threads',
        'a soft halo arc behind the head',
        'restrained Devanagari-influenced serif lockup',
      ],
      avoid: [
        'bright party colours',
        'cartoon or sticker-art motifs',
        'multiple figures',
        'corporate boardroom cues',
        'glossy fashion lighting',
      ],
      lightingDirection:
        'Top-down divine light source falling on the face, deep low-key shadow elsewhere, a subtle warm bounce from below as if from a lit lamp',
      paletteApproach:
        'Deep maroon, ink-black or burnt umber base with gold divine light and warm cream skin highlight; almost no cool tones',
    },
    exampleBriefs: [
      'Remembrance Ceremony for our beloved Founder',
      'Sacred Tribute on the Birth Anniversary of our Patron',
    ],
  },

  {
    id: 'modern-magazine-cover',
    name: 'Modern Lifestyle Magazine Cover',
    applicableTo: {
      formats: ['event_poster', 'portrait_poster', 'instagram_post', 'instagram_story'],
      subjectTypes: ['person'],
      strategies: ['portrait-hero'],
      formalities: ['professional', 'premium'],
      energies: ['moderate', 'high'],
    },
    referenceLanguage: {
      visualScene:
        'A contemporary lifestyle cover portrait that could sit comfortably on the shelf next to Vogue, Harper\'s Bazaar or Femina. The subject is photographed against a softly textured colour-field — pastel terracotta, sage, blush — with the head positioned in the upper-third grid. Typography is bold, modern, set in a clean geometric sans, with the magazine-style nameplate stretched across the top edge. A handful of cover lines hint at content below. The whole image feels stylish without being noisy: a single sophisticated mood rather than a decorative pile-up.',
      decorativeMotifs: [
        'a wide nameplate-style headline across the top',
        '2-3 quiet cover-line strips down one side',
        'a barcode-style micro-strip at the lower corner',
        'soft paper-grain texture across the colour field',
      ],
      avoid: [
        'ornate Indian motifs',
        'festive multi-zone composition',
        'cartoon illustration',
        'over-saturated palettes',
        'centred symmetrical layout',
      ],
      lightingDirection:
        'Large soft key from camera-left, even fill, slight shadow on the off-side cheek, no rim light — clean modern beauty lighting',
      paletteApproach:
        'Single muted contemporary hue (terracotta, sage, blush, ink-navy) across the field with white type and one accent jewel-tone',
    },
    exampleBriefs: [
      'New Initiative Announcement — Featuring our Programme Lead',
      'Special Feature: Spotlight on Dr. Anitha Krishnan',
    ],
  },

  {
    id: 'national-geographic-environmental-portrait',
    name: 'National Geographic Environmental Portrait',
    applicableTo: {
      formats: ['event_poster', 'portrait_poster', 'instagram_post'],
      subjectTypes: ['person'],
      strategies: ['portrait-hero'],
      backgroundStyles: ['scene', 'photo-real', 'dark'],
      formalities: ['professional', 'premium'],
      energies: ['calm', 'moderate'],
    },
    referenceLanguage: {
      visualScene:
        'A documentary-style environmental portrait that places the subject within the context of their life\'s work. The figure occupies the right two-thirds of the frame, sharp and intimate, while the left side opens onto a softly defocused world that tells you who they are — a classroom of empty desks, a workshop bench, a lab corridor, a temple corridor at dawn. The lighting is naturalistic, available-light, photographed on 35mm. There is dust in the air, a sense of a real place at a real moment. Typography is set quietly in the negative space, almost like a caption, never declaratively. The image earns its weight by being true.',
      decorativeMotifs: [
        'soft defocused environmental detail in the left third',
        'a caption-style block in the negative-space area',
        'subtle film-grain across the whole frame',
        'a thin sans-serif credit line at the base',
      ],
      avoid: [
        'studio backdrops',
        'decorative ornaments or garlands',
        'glamour or fashion lighting',
        'cartoon or illustrated treatments',
        'centred symmetrical composition',
      ],
      lightingDirection:
        'Natural window light from camera-right, modest fill from a bounced reflector, no hard rim — the lighting reads as found, not built',
      paletteApproach:
        'Naturalistic earth palette pulled from the environment (warm wood, dust, faded paint) with skin tones leading; type in white or warm cream',
    },
    exampleBriefs: [
      'Lifetime Service Recognition for our retiring Principal',
      'Honoring Dr. Vasanthi — A Career in Cardiology',
    ],
  },

  // ============================================================
  // v53.3 — SOUTH INDIAN / TAMIL ARCHETYPES
  // Added because the original 8 person archetypes had no regional South Indian
  // representation, leading the selector to pick Bollywood for Tamil Nadu briefs.
  // ============================================================

  {
    id: 'kollywood-hand-painted-tribute',
    name: 'Kollywood Hand-Painted Tribute Banner',
    applicableTo: {
      formats: ['event_poster', 'portrait_poster', 'invitation', 'instagram_post'],
      subjectTypes: ['person'],
      strategies: ['portrait-hero'],
      formalities: ['professional', 'premium'],
      energies: ['moderate', 'high'],
      regions: ['tamil-nadu', 'south-india'],
    },
    referenceLanguage: {
      visualScene:
        'A reverent tribute composed in the visual tradition of a Tamil cinema cut-out banner — the kind hand-painted on plywood and erected at street corners across Chennai and Coimbatore for film releases and political tributes. The honored figure dominates the frame with confident frontal scale, painted in saturated photographic realism with the slightly idealized brush-work of a sign-painter. The backdrop is a bold flat field — temple-red, marigold-yellow, or banana-leaf-green — with an arched architectural frame above the head like a gopuram silhouette or a paint-mark halo. Hand-lettered Tamil-styled display type sits in a confident ribbon across the lower third in shadowed sign-painter strokes. The whole image radiates the cinematic, larger-than-life dignity Tamil Nadu reserves for its respected elders.',
      decorativeMotifs: [
        'arched gopuram-silhouette halo behind the head',
        'hand-painted ribbon scroll in a contrasting flat color',
        'sign-painter brushwork edges on the typography',
        'twin lit kuthuvilakku (brass oil-lamps) at the lower corners',
        'a strand of jasmine and mango leaves across the upper edge',
      ],
      avoid: [
        'crowds or secondary figures',
        'Bollywood-style marigold-rose-pink color story',
        'photographic Western studio polish',
        'mandala / paisley patterns (those read as North Indian)',
        'cold corporate minimalism',
      ],
      lightingDirection:
        'Painted-in frontal sign-board light — even and saturated, with a subtle warm halo behind the head; no harsh studio shadows because this archetype mimics flat sign-painter rendering',
      paletteApproach:
        'Bold flat saturated field — temple-red, marigold-yellow, or banana-leaf-green dominant; cream or off-white for the painted ribbon; black or deep maroon for the hand-lettered display weight',
    },
    exampleBriefs: [
      'Birthday Tribute to JKKN Family Chairperson Smt. Sendamaraai',
      'Felicitation of our Founder — A Tamil Education Pioneer',
    ],
  },

  {
    id: 'chettinad-elder-honor',
    name: 'Chettinad Mansion Elder Honor',
    applicableTo: {
      formats: ['event_poster', 'portrait_poster', 'invitation'],
      subjectTypes: ['person'],
      strategies: ['portrait-hero'],
      formalities: ['premium', 'exclusive'],
      energies: ['calm', 'moderate'],
      regions: ['tamil-nadu', 'south-india'],
    },
    referenceLanguage: {
      visualScene:
        'A composed dignified portrait set against the visual world of a Chettinad heritage mansion. The backdrop suggests teak pillars and lime-washed walls in warm ochre and deep maroon, with faint Athangudi tile geometry tessellating quietly in the shadows. A polished brass urli (ceremonial bowl) sits at one lower corner; a hanging brass lamp casts a soft amber glow from above. The subject is rendered with the gravity of a family-mansion oil portrait — restrained shoulders-up framing, a single warm key light from above-right, cheekbones modeled with quiet shadow. Typography is set in confident dark serif on a cream cartouche, with a hairline gold rule beneath. Mood: ancestral, prosperous, deeply rooted.',
      decorativeMotifs: [
        'faint Athangudi tile geometry tessellating in the background shadows',
        'a hanging brass thookkuvilakku lamp suggesting top-right warm glow',
        'a polished urli (brass ceremonial bowl) at one lower corner',
        'a discreet teak-grain border or cream cartouche behind type',
        'a single sandalwood-paste stripe or tiny floral motif as accent',
      ],
      avoid: [
        'mandala / paisley North-Indian motifs',
        'crowds or onlookers',
        'Bollywood-saturated color story',
        'modern flat-vector cleanness',
        'studio-paper plain backdrops',
      ],
      lightingDirection:
        'Warm amber key from upper-right as if from a brass hanging lamp, soft fill on the opposite side, subtle ambient backlight separating the figure from the maroon wall',
      paletteApproach:
        'Deep maroon and warm ochre dominant with cream cartouche accents; oxidized brass for type metallics; one accent of sandalwood-paste yellow for warmth',
    },
    exampleBriefs: [
      'Honoring our Founder on his 80th Birthday',
      'Lifetime Patron Recognition — Chettinad Trust',
    ],
  },

  {
    id: 'tamil-temple-darshan-tribute',
    name: 'Tamil Temple Darshan Tribute',
    applicableTo: {
      formats: ['event_poster', 'portrait_poster', 'invitation'],
      subjectTypes: ['person'],
      strategies: ['portrait-hero'],
      formalities: ['premium', 'exclusive'],
      energies: ['calm', 'moderate'],
      regions: ['tamil-nadu', 'south-india', 'kerala'],
    },
    referenceLanguage: {
      visualScene:
        'A reverent ceremonial portrait composed with the visual grammar of South Indian temple iconography — the kind of devotional image one sees during a darshan of an honored elder. The backdrop is deep temple-red or kovil-blue with faint gopuram-tier silhouettes rising behind the head and soft golden divine-light beams radiating downward from above. A strand of jasmine and tulasi garland frames the upper edge; lit kuthuvilakku (brass oil-lamps) glow at both lower corners. A subtle banana-leaf or mango-leaf garland marks the lower border. Typography is set in confident gold serif on a deep-red cartouche, with restrained Tamil-script-influenced flourishes. The honored figure is bathed in a soft halo of golden light — illuminated as a venerated presence the community gathers to honor.',
      decorativeMotifs: [
        'gopuram-tier silhouette rising faintly behind the head',
        'strand of jasmine and tulasi garland across the upper edge',
        'lit brass kuthuvilakku oil-lamps at both lower corners',
        'soft golden divine-light beams radiating from above',
        'banana-leaf or mango-leaf swag across the lower border',
      ],
      avoid: [
        'mandala / paisley North-Indian patterning',
        'Bollywood marigold-rose-pink color story',
        'crowds or audience figures',
        'sun-burst rays (those read as Hindi-belt cinema)',
        'cold modern palettes',
      ],
      lightingDirection:
        'Soft golden divine top-light as if from temple lamp arrays, gentle frontal fill, a faint halo glow tracing the head and shoulders',
      paletteApproach:
        'Deep temple-red or kovil-blue dominant with antique-gold accents; one warm cream highlight for the cartouche; muted green from tulasi/mango leaf for organic contrast',
    },
    exampleBriefs: [
      'Birthday Wishes from the JKKN Family to our Beloved Chairperson',
      'Memorial Tribute — Honoring our late Founder',
    ],
  },

  {
    id: 'carnatic-recital-tribute',
    name: 'Carnatic Recital Cover Tribute',
    applicableTo: {
      formats: ['event_poster', 'portrait_poster', 'invitation', 'instagram_post'],
      subjectTypes: ['person'],
      strategies: ['portrait-hero'],
      formalities: ['professional', 'premium'],
      energies: ['calm', 'moderate'],
      regions: ['tamil-nadu', 'south-india', 'karnataka'],
    },
    referenceLanguage: {
      visualScene:
        'A refined cultural-institution portrait composed with the restraint of a Carnatic concert season programme cover. The backdrop is a quiet ivory or sandalwood-cream wash with a single faint veena or tambura silhouette resolving softly in the upper background. The subject is portrayed with composed dignity — shoulders-up, calm gaze, dressed in traditional silk. A faint strand of jasmine traces the upper edge; a single sandalwood-paste accent line runs beneath the lower typography. Type is set in confident classical serif (with optional bilingual Tamil script in smaller weight beneath) on a cream-on-deep-green or cream-on-deep-maroon panel. Mood: cultured, contemplative, premium — a programme-cover that belongs at the Music Academy in December.',
      decorativeMotifs: [
        'faint veena or tambura silhouette resolving in the upper background',
        'strand of jasmine across the upper edge',
        'sandalwood-paste accent line beneath the typography',
        'optional small bilingual Tamil script in serif weight beneath the headline',
        'a thin gold or copper hairline rule framing the type panel',
      ],
      avoid: [
        'crowds, audiences, ensemble figures',
        'Bollywood saturation or marigold cascade',
        'modern flat-vector or geometric backgrounds',
        'Western fashion-editorial polish',
        'busy mandala / paisley patterns',
      ],
      lightingDirection:
        'Soft single warm key from upper-right with broad fill, no rim — the image reads as a quiet portrait rather than a stage shot',
      paletteApproach:
        'Ivory or sandalwood-cream backdrop with deep-green or deep-maroon type panel; warm gold accents for hairlines; one muted jasmine-white for the floral garland',
    },
    exampleBriefs: [
      'Felicitating our Music Academy Patron',
      'Annual Tribute — Tamil Sangam Honors Smt. Lakshmi',
    ],
  },
]
