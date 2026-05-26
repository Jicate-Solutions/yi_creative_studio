/**
 * Place archetypes for event_poster × environment-scene.
 *
 * For inaugurations, heritage walks, foundation laying, campus tours — anything
 * where the PLACE itself is the subject. The shared discipline: a real location
 * carries the frame, light tells the story of arrival, and human figures (when
 * present) read as small enough that the architecture wins.
 */

import type { CreativeArchetype } from './index'

export const EVENT_POSTER_PLACE_ARCHETYPES: CreativeArchetype[] = [
  {
    id: 'heritage-architectural-portrait',
    name: 'Heritage Architectural Portrait',
    applicableTo: {
      formats: ['event_poster', 'portrait_poster', 'landscape_poster', 'instagram_post', 'flyer_a4'],
      subjectTypes: ['place'],
      strategies: ['environment-scene'],
      backgroundStyles: ['scene', 'photo-real', 'dark'],
      formalities: ['professional', 'premium', 'exclusive'],
      energies: ['calm', 'moderate'],
    },
    referenceLanguage: {
      visualScene:
        'A reverent architectural portrait of the place itself, photographed at the magic hour just after dawn or just before dusk when the stone goes golden. The structure dominates the frame — a temple gopuram, a chettinad mansion facade, a heritage quad, a colonial library — rendered with sharp detail in the foreground and a softly atmospheric middle distance. Tiny human figures may walk through the lower edge for scale, but they read as visitors, never as subjects. The typography sits in the upper-third sky or the lower-third foreground, set in a classical serif with a small dateline strip beneath. The whole image carries the weight of a National Geographic location feature.',
      decorativeMotifs: [
        'tiny human figures at lower edge for scale',
        'a thin classical serif headline lockup',
        'a small dateline strip in small caps',
        'a faint compass-rose or location-mark at one corner',
        'subtle atmospheric haze in the middle distance',
      ],
      avoid: [
        'cartoon or sticker-art treatments',
        'ornate decorative borders',
        'festive multi-colour palettes',
        'large human portraits dominating the frame',
        'glitched or neon typography',
      ],
      lightingDirection:
        'Low-angle warm magic-hour sun raking across the architecture from camera-left, deep cool shadow on the opposite face, faint atmospheric glow in the sky',
      paletteApproach:
        'Warm golden-hour stone tones (sandstone, terracotta, weathered cream) with deep cool shadow blues; type in warm white or pale gold',
    },
    exampleBriefs: [
      'Heritage Walk: Old Madras Architectural Tour',
      'Campus Heritage Open Day — Visit Our Historic Quad',
    ],
  },

  {
    id: 'inauguration-ribbon-ceremony',
    name: 'Inauguration Ribbon Ceremony',
    applicableTo: {
      formats: ['event_poster', 'portrait_poster', 'invitation', 'flyer_a4', 'instagram_post'],
      subjectTypes: ['place'],
      strategies: ['environment-scene'],
      formalities: ['professional', 'premium', 'exclusive'],
      energies: ['moderate', 'high'],
    },
    referenceLanguage: {
      visualScene:
        'A ceremonial inauguration poster centred on the newly-opened facility — a fresh wing, a new lab, a library block, an academic building — rendered as a clean three-quarter architectural view. A red ceremonial ribbon stretches across the entry, slightly slack at the centre as if waiting to be cut. A pair of polished brass lamps stand at the threshold, lit. The sky above is a clean morning blue with light cloud. A small ceremonial dais sits to one side. Typography is set in a confident serif headline above with the inauguration date prominently below — this is an invitation, the date matters. The mood is institutional pride mixed with the freshness of a beginning.',
      decorativeMotifs: [
        'a red ceremonial ribbon across the entry',
        'a pair of polished brass lamps lit at the threshold',
        'a small ceremonial dais to one side',
        'a confident serif headline above the structure',
        'a prominent date stamp beneath the headline',
      ],
      avoid: [
        'cartoon or sticker-art treatments',
        'crowd scenes obscuring the building',
        'electric or neon palettes',
        'dark or cinematic lighting',
        'multiple competing focal points',
      ],
      lightingDirection:
        'Clean morning sunlight from upper-right at roughly 45°, soft shadow on the building face, a faint warm bounce from the ground',
      paletteApproach:
        'Building\'s own brick / stone / paint colour as field, with the red ribbon and brass lamps as warm accent points; type in deep ink-navy',
    },
    exampleBriefs: [
      'Inauguration of the New Central Library Wing',
      'Foundation Stone Laying — New Academic Block',
    ],
  },

  {
    id: 'campus-tour-warm-invitation',
    name: 'Campus Tour Warm Invitation',
    applicableTo: {
      formats: ['event_poster', 'portrait_poster', 'flyer_a4', 'flyer_a5', 'instagram_post', 'invitation'],
      subjectTypes: ['place'],
      strategies: ['environment-scene'],
      backgroundStyles: ['scene', 'photo-real'],
      formalities: ['casual', 'professional'],
      energies: ['moderate', 'high'],
    },
    referenceLanguage: {
      visualScene:
        'A welcoming campus invitation rendered as a sun-dappled wide shot of the most photogenic part of the institution — a tree-lined walking path, a quad with students chatting on the lawn, a hostel garden, a library steps view. The image is naturally lit, taken on a clear afternoon, with shallow depth-of-field so the foreground figures stay soft and inviting rather than identifiable. The mood is open and informal, the kind of image a prospective family would feel welcomed by. Typography sits in the upper-third sky or beside a clean colour block on one side, set in a friendly modern sans-serif with a hand-lettered touch on the headline word. A small map-pin icon or "you are invited" cartouche anchors the call.',
      decorativeMotifs: [
        'softly defocused student figures in the middle distance',
        'a small map-pin or "you are invited" cartouche',
        'a friendly modern sans-serif headline',
        'a hand-lettered accent word in the headline',
        'a subtle warm vignette at the lower edges',
      ],
      avoid: [
        'empty staged architectural shots without people',
        'corporate boardroom imagery',
        'electric or neon palettes',
        'dark cinematic lighting',
        'glamour or fashion lighting',
      ],
      lightingDirection:
        'Natural afternoon sun filtered through tree canopy, soft shadow patterns across the ground, a warm bounce from sun-lit walls',
      paletteApproach:
        'Naturalistic campus palette — leafy green, warm stone, sky blue — with one brand-coloured cartouche accent; type in deep ink or warm white',
    },
    exampleBriefs: [
      'Open Campus Tour for Parents — Visit Our Facilities',
      'Heritage Campus Walk — Guided Exploration for Visitors',
    ],
  },
]
