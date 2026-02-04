/**
 * Content-Element Mapper (v1.0)
 *
 * Maps event content keywords to HIGHLY SPECIFIC visual elements
 * to ensure each poster has unique, content-related decorative elements.
 *
 * CRITICAL: Each element description must be HYPER-SPECIFIC, not generic.
 * BAD: "technology elements"
 * GOOD: "holographic AI brain visualization with cyan neural pathways"
 */

// ============================================================
// CONTENT-ELEMENT MAPPING DATABASE
// ============================================================

interface ElementCategory {
  keywords: RegExp
  elements: string[]
  backgrounds: string[]
  decorativeAccents: string[]
}

/**
 * Master mapping of content keywords to visual elements
 * Each category has multiple options for variety
 */
const CONTENT_ELEMENT_CATEGORIES: ElementCategory[] = [
  // ============================================================
  // TECHNOLOGY & INNOVATION
  // ============================================================
  {
    keywords: /\b(ai|artificial intelligence|machine learning|ml|deep learning|neural|chatbot|gpt)\b/i,
    elements: [
      'holographic neural network visualization with pulsing cyan and magenta nodes',
      'floating AI brain composed of translucent circuit pathways glowing with data',
      'matrix-style data streams dissolving into golden digital particles',
      'quantum computing grid with entangled particles connected by light beams',
      'robotic eye iris made of concentric data visualization rings',
      'neural synapse connections firing with electric blue pulses',
      'abstract machine learning model visualized as flowing data rivers'
    ],
    backgrounds: [
      'deep space void with subtle constellation of data points',
      'dark gradient with subtle binary code rain at 5% opacity',
      'midnight blue atmosphere with floating holographic fragments',
      'cyber-noir environment with neon accent lighting'
    ],
    decorativeAccents: [
      'micro-circuit patterns along edges at 8% opacity',
      'floating binary digits dissolving into mist',
      'holographic scan lines sweeping across at low opacity',
      'quantum particle trails connecting corners'
    ]
  },
  {
    keywords: /\b(workshop|training|hands-on|bootcamp|masterclass|skill)\b/i,
    elements: [
      'hands emerging from abstract knowledge clouds manipulating glowing tools',
      'collaborative workspace with floating idea bubbles and thought streams',
      'skill tree branching upward with illuminated mastery pathways',
      'workshop bench with levitating precision instruments and blueprints',
      'mentorship connection visualization with wisdom transfer arcs',
      'craftsmanship hands shaping abstract light into form',
      'learning journey path winding through knowledge landscapes'
    ],
    backgrounds: [
      'warm studio atmosphere with focused spotlight zones',
      'workshop environment with tools silhouetted in distance',
      'knowledge gradient flowing from deep blue to enlightened gold',
      'creative space with subtle draft paper texture overlay'
    ],
    decorativeAccents: [
      'tool silhouettes as corner decorations at 12% opacity',
      'measurement marks and grids along edges',
      'gear cogs rotating slowly in corners',
      'blueprint grid patterns as subtle background texture'
    ]
  },
  {
    keywords: /\b(innovation|startup|entrepreneur|venture|disrupt|founder)\b/i,
    elements: [
      'lightbulb constellation forming a galaxy of interconnected ideas',
      'rocket trajectory leaving trails of innovation sparks and stardust',
      'rising phoenix composed of geometric shards reforming upward',
      'breakthrough moment captured as shattered glass revealing light beyond',
      'growth graph transformed into a launching pad for ambition',
      'seed germinating into a tree of connected opportunity nodes',
      'disruption wave visualization with old patterns dissolving into new'
    ],
    backgrounds: [
      'dawn horizon gradient suggesting new beginnings',
      'explosive starburst emanating from center with subtle rays',
      'rising gradient from deep foundation to bright possibility',
      'transformation void where old meets new in dramatic contrast'
    ],
    decorativeAccents: [
      'ascending arrow motifs in corner clusters',
      'spark particles scattered across design at varying opacities',
      'growth curve lines as subtle frame elements',
      'constellation dots connecting innovation points'
    ]
  },
  {
    keywords: /\b(tech|technology|digital|software|code|programming|developer|hackathon)\b/i,
    elements: [
      'cascading code blocks forming an architectural structure of logic',
      'digital DNA helix composed of programming symbols and brackets',
      'terminal window floating in cyberspace with glowing command prompts',
      'API connection visualization as neon data pipelines',
      'version control branches visualized as flowing time streams',
      'debugging process shown as x-ray vision revealing inner workings',
      'algorithm visualization as an elegant mathematical dance'
    ],
    backgrounds: [
      'dark IDE-inspired environment with subtle syntax highlighting accents',
      'digital grid extending to infinity with depth perspective',
      'command line aesthetic with green-on-black atmosphere',
      'tech workspace with multiple monitor reflections'
    ],
    decorativeAccents: [
      'code bracket decorations in corners',
      'semicolons and syntax elements as scattered accents',
      'terminal cursor blink effect represented graphically',
      'git branch lines as connecting elements'
    ]
  },

  // ============================================================
  // BUSINESS & PROFESSIONAL
  // ============================================================
  {
    keywords: /\b(network|networking|connect|connection|meetup|mixer)\b/i,
    elements: [
      'interconnected human silhouettes forming a living network constellation',
      'handshake visualization with rippling connection waves emanating outward',
      'constellation of diverse profile avatars linked by golden threads',
      'social graph visualization as a vibrant neural network of relationships',
      'bridges connecting isolated islands representing united communities',
      'conversation bubble network with intersecting dialogue streams',
      'magnetic attraction visualization of like-minded individuals gathering'
    ],
    backgrounds: [
      'warm gathering space atmosphere with welcoming ambient glow',
      'twilight networking venue with subtle chandelier bokeh',
      'social gradient from individual blue to connected warm tones',
      'hub-and-spoke energy radiating from center outward'
    ],
    decorativeAccents: [
      'connection line patterns forming subtle web in corners',
      'node clusters as decorative corner elements',
      'handshake icon abstracted into artistic linework',
      'social bubble clusters floating at varying heights'
    ]
  },
  {
    keywords: /\b(leader|leadership|executive|ceo|management|director)\b/i,
    elements: [
      'mountain summit with figure silhouette gazing at vast horizon',
      'chess king piece casting long shadow of influence and strategy',
      'compass rose with illuminated north star for direction',
      'captain wheel with confident hands steering toward destiny',
      'crown made of laurel leaves representing earned achievement',
      'lighthouse beam cutting through fog to guide others',
      'eagle soaring above clouds with panoramic vision'
    ],
    backgrounds: [
      'commanding height perspective overlooking achievement landscape',
      'boardroom atmosphere with power and elegance',
      'sunrise behind mountain range suggesting conquest',
      'strategic map environment with territories marked'
    ],
    decorativeAccents: [
      'laurel branch elements framing corners',
      'crown points as subtle top border decoration',
      'compass directional marks as orientation elements',
      'strategic arrow patterns indicating direction'
    ]
  },
  {
    keywords: /\b(strategy|plan|roadmap|vision|goal|objective|mission)\b/i,
    elements: [
      'chess pieces mid-game on a board of strategic possibilities',
      'maze pathways with illuminated solution route glowing gold',
      'target bullseye with converging arrow trajectories',
      'blueprint unfurling to reveal architectural ambition',
      'journey map with milestones marked as glowing waypoints',
      'puzzle pieces floating into perfect alignment',
      'strategic timeline visualized as ascending stepping stones'
    ],
    backgrounds: [
      'war room atmosphere with strategic map projections',
      'planning environment with subtle grid overlays',
      'vision board aesthetic with organized inspiration',
      'roadmap perspective with path extending to horizon'
    ],
    decorativeAccents: [
      'milestone markers as decorative elements',
      'target concentric circles in corners at low opacity',
      'pathway dotted lines as connecting elements',
      'checkpoint flags as accent decorations'
    ]
  },
  {
    keywords: /\b(growth|scale|expand|success|achieve|milestone|progress)\b/i,
    elements: [
      'exponential curve rising dramatically through achievement clouds',
      'beanstalk spiraling upward through layers of accomplishment',
      'rocket stages separating as it breaks through barriers',
      'bamboo forest reaching skyward with determination',
      'ladder extending beyond visible clouds into possibility',
      'seedling time-lapse showing transformation to mighty oak',
      'stock chart transformed into mountain climbing expedition'
    ],
    backgrounds: [
      'sunrise gradient suggesting unstoppable momentum',
      'growth environment transitioning from ground to sky',
      'achievement atmosphere with golden accomplishment lighting',
      'progress perspective showing distance traveled'
    ],
    decorativeAccents: [
      'upward arrow clusters in strategic positions',
      'growth rings as circular corner elements',
      'percentage increase indicators as subtle numbers',
      'progress bar segments as border decorations'
    ]
  },

  // ============================================================
  // CULTURAL & SOCIAL
  // ============================================================
  {
    keywords: /\b(celebrat|party|festival|gala|anniversary|jubilee|commemor)\b/i,
    elements: [
      'confetti explosion frozen mid-burst in metallic gold and silver',
      'champagne bubbles rising in elegant effervescent columns',
      'firework starburst patterns captured at peak brilliance',
      'balloon arch with ribbons streaming in celebration wind',
      'party streamer ribbons creating dynamic motion trails',
      'cake with magical candle flames casting warm glow',
      'trophy moment with sparkle cascade and achievement lighting'
    ],
    backgrounds: [
      'gala venue atmosphere with elegant chandelier lighting',
      'festive gradient from deep celebration purple to party gold',
      'event space with subtle disco ball reflections',
      'celebratory sky with firework residue trails'
    ],
    decorativeAccents: [
      'confetti scattered strategically at varying densities',
      'streamer curls as corner and edge decorations',
      'star bursts as celebration accent elements',
      'ribbon flourishes framing key areas'
    ]
  },
  {
    keywords: /\b(community|together|unity|collective|gather|social)\b/i,
    elements: [
      'diverse hands reaching toward center in unity circle',
      'mosaic of unique faces forming a greater collective portrait',
      'tree with many roots converging into single powerful trunk',
      'quilt pattern representing unique pieces creating whole',
      'campfire gathering with figures in warm communion',
      'wave of people in synchronized supportive motion',
      'interlocking puzzle creating complete community picture'
    ],
    backgrounds: [
      'warm community gathering atmosphere with inclusive lighting',
      'neighborhood environment with connected homes and pathways',
      'unity gradient blending individual colors into harmony',
      'together space where differences create beautiful whole'
    ],
    decorativeAccents: [
      'hand print patterns as subtle community symbols',
      'interconnected circles representing unity',
      'heart shapes woven into corner elements',
      'community icons abstracted into artistic patterns'
    ]
  },
  {
    keywords: /\b(heritage|traditional|cultural|ethnic|ancestor|legacy)\b/i,
    elements: [
      'intricate mandala with traditional geometric precision',
      'ancestral tree with roots extending into history depths',
      'traditional textile patterns woven with cultural symbolism',
      'heritage artifact with aged patina and wisdom texture',
      'cultural dance frozen in moment of expressive grace',
      'traditional architecture silhouette against heritage sky',
      'ceremonial elements arranged with ritualistic respect'
    ],
    backgrounds: [
      'aged parchment atmosphere with subtle wear textures',
      'cultural environment with traditional color harmonies',
      'heritage gradient from ancestral earth to legacy gold',
      'sacred space atmosphere with reverent lighting'
    ],
    decorativeAccents: [
      'traditional border patterns from cultural heritage',
      'ethnic motifs as corner flourishes',
      'ancestral symbols as subtle watermarks',
      'cultural textile patterns at whisper opacity'
    ]
  },

  // ============================================================
  // EDUCATION & ACADEMIC
  // v24.12.3: Added "faculty", "development", "training", "programme", "workshop", "seminar" keywords
  // ============================================================
  {
    keywords: /\b(learn|education|academic|university|college|school|student|faculty|development|training|professional|programme|workshop|seminar|teacher|instructor|curriculum|pedagogy|educator|capacity|skill)\b/i,
    elements: [
      'open book with pages transforming into flying knowledge birds',
      'brain synapses firing as new connections illuminate understanding',
      'graduation cap toss frozen in moment of achievement triumph',
      'library shelves extending infinitely into wisdom cathedral',
      'laboratory discovery moment with eureka illumination',
      'classroom chalkboard with elegant mathematical proofs',
      'study desk with focused lamp creating knowledge spotlight'
    ],
    backgrounds: [
      'scholarly atmosphere with warm library wood tones',
      'academic environment with subtle institutional architecture',
      'learning gradient from curiosity blue to wisdom gold',
      'campus setting with inspiring educational architecture'
    ],
    decorativeAccents: [
      'book spine patterns as border elements',
      'academic laurel leaves as corner decorations',
      'scholarly scroll flourishes framing content',
      'graduation cap icons as subtle accents'
    ]
  },
  {
    keywords: /\b(research|science|discover|experiment|lab|study)\b/i,
    elements: [
      'DNA helix rotating with bioluminescent data annotations',
      'microscope lens revealing hidden worlds of discovery',
      'molecular structure floating in precise scientific arrangement',
      'petri dish with growing discovery cultures forming patterns',
      'telescope pointed at unexplored cosmic mysteries',
      'laboratory flask with bubbling breakthrough reactions',
      'research paper equations flowing into visual understanding'
    ],
    backgrounds: [
      'laboratory environment with clean scientific precision',
      'research atmosphere with focused analytical lighting',
      'discovery gradient from unknown dark to enlightened bright',
      'scientific space with subtle grid measurement overlays'
    ],
    decorativeAccents: [
      'molecular bond diagrams as decorative elements',
      'atom orbital patterns in corners',
      'scientific notation as subtle watermarks',
      'research paper margin notes as artistic elements'
    ]
  },

  // ============================================================
  // WELLNESS & HEALTH
  // ============================================================
  {
    keywords: /\b(health|wellness|yoga|meditat|mindful|fitness|exercise)\b/i,
    elements: [
      'yoga silhouette in perfect balance pose against sunrise',
      'lotus flower opening with chakra energy emanating',
      'breathing visualization as rhythmic wave patterns',
      'heart pulse rhythm transformed into mountain landscape',
      'meditation figure with aurora of calm radiating outward',
      'wellness journey path through serene nature landscape',
      'fitness transformation shown as butterfly emergence'
    ],
    backgrounds: [
      'zen garden atmosphere with mindful serenity',
      'wellness space with natural light and plant elements',
      'health gradient from stress gray to vitality green',
      'fitness environment with energetic motivation lighting'
    ],
    decorativeAccents: [
      'lotus petal patterns as corner flourishes',
      'zen circle (enso) as subtle framing element',
      'heartbeat line as connecting border',
      'nature leaf patterns as organic accents'
    ]
  },

  // ============================================================
  // ENVIRONMENT & SUSTAINABILITY
  // ============================================================
  {
    keywords: /\b(environment|green|sustain|eco|climate|nature|earth)\b/i,
    elements: [
      'earth visualization showing interconnected ecosystem flows',
      'tree with roots and branches forming complete cycle',
      'renewable energy symbols integrated into natural landscape',
      'water droplet containing reflected pristine forest',
      'butterfly effect visualization showing action ripples',
      'seed germinating through concrete toward sunlight',
      'ecosystem food web as elegant interconnected design'
    ],
    backgrounds: [
      'lush forest atmosphere with dappled sunlight',
      'environmental gradient from threatened gray to hopeful green',
      'nature preserve environment with diverse biome hints',
      'sustainable space with organic textures and forms'
    ],
    decorativeAccents: [
      'leaf patterns transitioning from corner to edge',
      'recycling symbol reimagined as artistic element',
      'water ripple patterns as subtle motion',
      'root/branch networks as border decorations'
    ]
  },

  // ============================================================
  // ARTS & CREATIVE
  // ============================================================
  {
    keywords: /\b(art|creative|design|music|perform|theater|paint|dance)\b/i,
    elements: [
      'paint splatter explosion frozen in creative moment',
      'musical notes dancing across staff in rhythmic pattern',
      'theater masks reflecting comedy and tragedy duality',
      'dancer silhouette captured in peak expression moment',
      'artist palette with colors mixing in creative alchemy',
      'camera lens reflecting captured creative visions',
      'stage spotlight creating dramatic artistic focus'
    ],
    backgrounds: [
      'gallery atmosphere with elegant exhibition lighting',
      'creative studio space with inspirational chaos energy',
      'performance venue with dramatic spotlight effects',
      'artistic gradient with creative color experimentation'
    ],
    decorativeAccents: [
      'brush stroke textures as artistic borders',
      'musical note patterns as flowing decorations',
      'color swatch gradients as palette elements',
      'spotlight beam patterns as directional accents'
    ]
  },

  // ============================================================
  // HOLIDAY & SEASONAL
  // ============================================================
  {
    keywords: /\b(new year|newyear|2024|2025|2026|countdown|resolution)\b/i,
    elements: [
      'countdown clock striking midnight with explosive sparkle burst',
      'champagne toast glasses clinking with celebration bubbles rising',
      'firework display painting night sky with color and light',
      'year numbers transforming from old to new in elegant transition',
      'hourglass with golden sand marking time passage',
      'doorway opening from old year darkness to new year light',
      'resolution list transforming into achievement staircase'
    ],
    backgrounds: [
      'midnight sky with firework residue and celebration energy',
      'new year gradient from past twilight to future dawn',
      'celebration venue with countdown anticipation atmosphere',
      'transition space between old achievements and new possibilities'
    ],
    decorativeAccents: [
      'clock numbers and hands as decorative elements',
      'celebration confetti with year numbers',
      'hourglass sand patterns as time motifs',
      'champagne bubble clusters as corner accents'
    ]
  },
  {
    keywords: /\b(diwali|deepavali|festival of light)\b/i,
    elements: [
      'diya lamp flames dancing with warm golden glow',
      'rangoli patterns with intricate geometric color symmetry',
      'sparkler light trails painting celebration in darkness',
      'lanterns ascending into starlit festival sky',
      'lotus blooming with divine light emanating from center',
      'peacock feathers with iridescent celebration colors',
      'traditional sweets arranged in festive presentation'
    ],
    backgrounds: [
      'diwali night atmosphere with warm lamp-lit glow',
      'festival gradient from deep night to celebration gold',
      'traditional home environment with festive decorations',
      'temple atmosphere with sacred lighting'
    ],
    decorativeAccents: [
      'diya lamp silhouettes as border decorations',
      'rangoli patterns as corner flourishes',
      'sparkle trails connecting elements',
      'traditional paisley motifs as accent patterns'
    ]
  },
  {
    keywords: /\b(christmas|xmas|holiday|winter|santa|noel)\b/i,
    elements: [
      'christmas tree with ornaments glowing with inner light',
      'snowflake crystals falling in elegant frozen ballet',
      'gift boxes wrapped with ribbons and magical sparkle',
      'cozy fireplace with stockings and warm holiday glow',
      'winter window with frost patterns and warm light behind',
      'sleigh silhouette against full moon with reindeer magic',
      'pine branch with ornaments and tinsel decorations'
    ],
    backgrounds: [
      'winter wonderland with gentle snowfall atmosphere',
      'holiday gradient from cold blue to warm festive red',
      'cozy indoor environment with fireplace warmth',
      'christmas eve sky with magical northern lights'
    ],
    decorativeAccents: [
      'snowflake patterns scattered at varying sizes',
      'pine needle textures as organic borders',
      'gift ribbon curls as decorative elements',
      'candy cane stripe patterns as playful accents'
    ]
  }
]

// ============================================================
// MAIN FUNCTION
// ============================================================

/**
 * Get content-related visual elements based on event name and type
 * @param eventName - The event title/name to analyze
 * @param eventType - Optional event type for additional context
 * @param uniquenessSeed - Optional seed for deterministic randomization
 * @returns Object with elements, backgrounds, and decorative accents
 */
export function getContentRelatedElements(
  eventName: string,
  eventType?: string,
  uniquenessSeed?: string
): ContentElements {
  const searchText = `${eventName} ${eventType || ''}`.toLowerCase()
  const matchedCategories: string[] = []
  let elements: string[] = []
  let backgrounds: string[] = []
  let decorativeAccents: string[] = []

  // Find all matching categories
  for (const category of CONTENT_ELEMENT_CATEGORIES) {
    if (category.keywords.test(searchText)) {
      matchedCategories.push(category.keywords.source)
      elements = [...elements, ...category.elements]
      backgrounds = [...backgrounds, ...category.backgrounds]
      decorativeAccents = [...decorativeAccents, ...category.decorativeAccents]
    }
  }

  // If no matches, provide creative fallbacks based on generic analysis
  if (elements.length === 0) {
    elements = [
      'dynamic abstract composition with flowing energy lines',
      'geometric patterns interlocking with purposeful rhythm',
      'atmospheric depth layers creating immersive environment',
      'organic shapes suggesting natural growth and movement',
      'light rays penetrating through stylized cloud formations'
    ]
    backgrounds = [
      'sophisticated gradient with subtle texture overlay',
      'atmospheric environment with depth and dimension',
      'modern aesthetic with clean professional foundation'
    ]
    decorativeAccents = [
      'subtle geometric patterns in corner zones',
      'flowing line work as connecting elements',
      'abstract shapes at whisper opacity levels'
    ]
    matchedCategories.push('generic-creative')
  }

  // Apply uniqueness seed to shuffle and select elements
  if (uniquenessSeed) {
    const seedNum = uniquenessSeed.split('').reduce((a, c) => a + c.charCodeAt(0), 0)

    // Shuffle based on seed
    const shuffle = <T>(arr: T[]): T[] => {
      const shuffled = [...arr]
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = (seedNum + i) % (i + 1)
        ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
      }
      return shuffled
    }

    elements = shuffle(elements).slice(0, 5)
    backgrounds = shuffle(backgrounds).slice(0, 2)
    decorativeAccents = shuffle(decorativeAccents).slice(0, 3)
  } else {
    // Randomly select for variety
    elements = elements.sort(() => Math.random() - 0.5).slice(0, 5)
    backgrounds = backgrounds.sort(() => Math.random() - 0.5).slice(0, 2)
    decorativeAccents = decorativeAccents.sort(() => Math.random() - 0.5).slice(0, 3)
  }

  return {
    elements,
    backgrounds,
    decorativeAccents,
    matchedCategories
  }
}

/**
 * Generate a uniqueness seed for this generation request
 */
export function generateUniquenessSeed(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Get creativity style directive based on uniqueness seed
 * Forces AI to use different composition approaches
 */
export function getCreativityDirective(seed: string): string {
  const lastDigit = parseInt(seed.slice(-1), 36) % 10
  const hasLowerAlpha = /[a-m]/.test(seed.slice(-5))
  const hasUpperAlpha = /[n-z]/.test(seed.slice(-5))

  let directive = ''

  // Style based on last digit
  if (lastDigit <= 2) {
    directive = 'EMPHASIZE dramatic lighting with strong shadows and highlights creating cinematic depth'
  } else if (lastDigit <= 4) {
    directive = 'EMPHASIZE rich textures and material quality - surfaces should feel tactile and premium'
  } else if (lastDigit <= 6) {
    directive = 'EMPHASIZE unexpected visual metaphors - surprise the viewer with creative interpretations'
  } else if (lastDigit <= 8) {
    directive = 'EMPHASIZE dynamic motion and energy - the design should feel alive and moving'
  } else {
    directive = 'EMPHASIZE elegant minimalism with strategic use of negative space and focal points'
  }

  // Composition based on alphabet presence
  if (hasLowerAlpha && !hasUpperAlpha) {
    directive += '\nCOMPOSITION: Use asymmetric, rule-of-thirds based layouts for dynamic tension'
  } else if (hasUpperAlpha && !hasLowerAlpha) {
    directive += '\nCOMPOSITION: Use balanced, symmetrical layouts for harmonious stability'
  } else {
    directive += '\nCOMPOSITION: Use hybrid composition with asymmetric focal point in balanced frame'
  }

  return directive
}

// Export return type of getContentRelatedElements for external use
export interface ContentElements {
  elements: string[]
  backgrounds: string[]
  decorativeAccents: string[]
  matchedCategories: string[]
}

export type { ElementCategory }
