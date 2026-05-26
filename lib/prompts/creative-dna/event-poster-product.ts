/**
 * Product archetypes for event_poster × object-hero.
 *
 * For launches, unveilings, book releases, programme reveals — anything where
 * a physical or digital OBJECT is the subject. The shared discipline across
 * these archetypes: the object owns 60%+ of the canvas, the typography
 * deliberately yields to it, and the lighting treats the object like a star.
 */

import type { CreativeArchetype } from './index'

export const EVENT_POSTER_PRODUCT_ARCHETYPES: CreativeArchetype[] = [
  {
    id: 'apple-product-keyvisual',
    name: 'Apple Product Key Visual',
    applicableTo: {
      formats: ['event_poster', 'portrait_poster', 'instagram_post', 'linkedin_post', 'web_banner', 'billboard'],
      subjectTypes: ['product'],
      strategies: ['object-hero'],
      formalities: ['premium', 'exclusive'],
      energies: ['calm', 'moderate'],
    },
    referenceLanguage: {
      visualScene:
        'A single hero object floats slightly off-axis at the centre of the frame, photographed with the unforgiving precision of an Apple product key visual. The surface of the object reads in fine detail — every reflection, every gradient transition, every micro-shadow rendered with studio-grade discipline. The background is a smooth gradient — deep slate at the top fading to a slightly warmer tone at the base — with a soft contact-shadow grounding the object. The product name is set beneath in thin geometric sans-serif, vast tracking, almost a whisper. A single short tagline sits below, and that is all. The frame is mostly empty, and the emptiness elevates the object to icon status.',
      decorativeMotifs: [
        'a soft contact-shadow beneath the object',
        'a thin geometric sans-serif product name in vast tracking',
        'a single quiet tagline line beneath',
        'a subtle radial highlight behind the object',
        'no decorative borders or filigree',
      ],
      avoid: [
        'multiple objects in frame',
        'decorative borders or ornaments',
        'busy patterned backgrounds',
        'human hands or presenters in frame',
        'multiple competing colours',
      ],
      lightingDirection:
        'Soft large-source key from upper-left with controlled rim-light separating object from background; a subtle warm bounce on the underside',
      paletteApproach:
        'Smooth slate-to-warm gradient field with the object\'s own material colour as the dominant accent; type in pure white',
    },
    exampleBriefs: [
      'iPhone 17 Pro Launch Showcase — Unveiling the New Flagship',
      'JKKN Connect 2.0 App Reveal — Built for Every Student',
    ],
  },

  {
    id: 'book-launch-editorial',
    name: 'Editorial Book Launch',
    applicableTo: {
      formats: ['event_poster', 'portrait_poster', 'invitation', 'instagram_post', 'flyer_a4'],
      subjectTypes: ['product'],
      strategies: ['object-hero'],
      formalities: ['professional', 'premium'],
      energies: ['calm', 'moderate'],
    },
    referenceLanguage: {
      visualScene:
        'A hardback book is photographed at a slight three-quarter angle on a warm wooden surface, the spine catching a single warm key light, the pages just barely visible at the foredge. A small bookmark ribbon spills out from the centre. Beside the book, a single object hints at context — a pair of reading glasses, a fountain pen, a brass paperweight, a cup of cardamom tea. The background is a soft out-of-focus library shelf or a warm wall texture. Typography sits in the upper third, set in a classical serif that echoes the book\'s own jacket type. The mood is unhurried, literary, the kind of image you find in the books section of a Sunday paper.',
      decorativeMotifs: [
        'a bookmark ribbon spilling from the centre',
        'a single contextual prop (glasses, pen, paperweight, tea cup)',
        'a softly defocused library shelf or warm wall behind',
        'a classical serif headline echoing the jacket type',
        'a small launch-date strip in small caps',
      ],
      avoid: [
        'crowd scenes or audience shots',
        'cartoon or sticker-art treatments',
        'electric or neon palettes',
        'multiple books in frame',
        'flat editorial lighting on the object',
      ],
      lightingDirection:
        'A single warm key from camera-right at low angle, soft fill from a bounced reflector, gentle rim light catching the page edges',
      paletteApproach:
        'Warm wood and paper tones — burnt sienna, cream, ochre — with the book jacket colour as the dominant accent; type in deep ink-brown',
    },
    exampleBriefs: [
      'Book Launch: "Roots & Wings" by Dr. Author Name',
      'Magazine Reveal — Spectrum 2026 Annual Edition',
    ],
  },

  {
    id: 'flagship-programme-reveal',
    name: 'Flagship Programme Reveal',
    applicableTo: {
      formats: ['event_poster', 'portrait_poster', 'linkedin_post', 'linkedin_banner', 'flyer_a4', 'web_banner'],
      subjectTypes: ['product'],
      strategies: ['object-hero'],
      formalities: ['professional', 'premium'],
      energies: ['moderate', 'high'],
    },
    referenceLanguage: {
      visualScene:
        'A flagship programme reveal poster built around a single iconic representation of the offering — a stylised graduation cap suspended in light, a stethoscope arranged as a clean still-life, a beaker glowing from within, an open laptop with a single line of code. The object is rendered with editorial-catalogue lighting against a clean architectural backdrop in the institution\'s brand colour. A confident programme name sits above in a modern serif lockup, and a single supporting line carries the curriculum, duration or intake highlight beneath. The composition uses generous negative space so the offering reads as substantial, considered, worth the commitment.',
      decorativeMotifs: [
        'a single iconic object representing the programme',
        'a clean architectural surface as backdrop',
        'a modern serif programme-name lockup',
        'a thin accent rule under the lockup',
        'a small badge or seal at one corner',
      ],
      avoid: [
        'crowd photography',
        'cartoon or sticker-art treatments',
        'multiple competing icons',
        'cluttered peripheral text',
        'festive multi-colour palettes',
      ],
      lightingDirection:
        'Soft large-source key from upper-left, controlled rim-light on the object, ambient brand-coloured wash on the backdrop',
      paletteApproach:
        'Institution brand colour as backdrop, the object\'s own material colour as the focal accent, warm cream type and a single jewel-tone underline',
    },
    exampleBriefs: [
      'Course Launch: B.Tech AI/ML — The Future Built Here',
      'New Diploma Reveal — Allied Health Sciences Programme',
    ],
  },
]
