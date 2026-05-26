/**
 * Concept archetypes for event_poster × concept-iconic.
 *
 * For branded programs, summits, awareness campaigns — anything where the
 * SUBJECT is an abstract idea, not a person or an activity list. The default
 * pipeline collapses these into a generic gradient with a single floating
 * icon; these archetypes give Gemini a real reference world to inhabit.
 */

import type { CreativeArchetype } from './index'

export const EVENT_POSTER_CONCEPT_ARCHETYPES: CreativeArchetype[] = [
  {
    id: 'apple-keynote-slide',
    name: 'Apple Keynote Stage Slide',
    applicableTo: {
      formats: ['event_poster', 'portrait_poster', 'instagram_post', 'linkedin_post', 'presentation_16_9'],
      subjectTypes: ['concept'],
      strategies: ['concept-iconic'],
      formalities: ['premium', 'exclusive'],
      energies: ['calm', 'moderate'],
    },
    referenceLanguage: {
      visualScene:
        'A single iconic symbol on a clean gradient backdrop, composed with the discipline of an Apple keynote stage slide. The symbol is rendered with precise dimensional shading — soft realistic highlight, gentle shadow, the kind of object you could imagine spinning slowly on stage in 4K. It floats in the upper-centre of the frame against a smooth gradient that runs from deep midnight at the top to a slightly warmer tone at the base. The headline sits beneath it in a thin geometric sans-serif, vast tracking, almost whispered. Below the headline, a single short tagline — never two. The frame is mostly empty space, and that emptiness is the message.',
      decorativeMotifs: [
        'a single hero symbol with realistic dimensional shading',
        'subtle ground-shadow under the symbol',
        'a thin geometric sans-serif headline',
        'a single quiet tagline line',
        'no decorative borders or filigree',
      ],
      avoid: [
        'multiple icons or symbols',
        'decorative borders or ornaments',
        'busy patterned backgrounds',
        'crowded peripheral text',
        'multiple competing colours',
      ],
      lightingDirection:
        'A single soft top-light on the hero symbol with a gentle ground shadow; ambient gradient lighting on the field itself',
      paletteApproach:
        'Smooth midnight-to-warm gradient (black to slate, or ink-navy to violet) with white type and one premium metallic accent on the symbol',
    },
    exampleBriefs: [
      'New Initiative Launch — One Idea, One Year',
      'Annual Innovation Address — The Next Decade',
    ],
  },

  {
    id: 'ted-talk-titlecard',
    name: 'TED Talk Title Card',
    applicableTo: {
      formats: ['event_poster', 'portrait_poster', 'instagram_post', 'youtube_thumbnail', 'video_cover'],
      subjectTypes: ['concept'],
      strategies: ['concept-iconic'],
      formalities: ['professional', 'premium'],
      energies: ['moderate', 'high'],
    },
    referenceLanguage: {
      visualScene:
        'A bold thought-leadership title card in the visual register of a TED stage opener. The frame is dominated by a single short provocative phrase set in a heavy condensed serif, the words stacked over two or three lines, hugging tight to the centre. A signature red accent — a single underline, a small dot, a corner block — anchors the eye. The background is deep charcoal with a subtle radial fall-off, faint stage-light glow rising from the lower edge as if from an unseen audience. Below the phrase, a small speaker-credit-style strip carries the supporting details. The whole thing feels like the moment just before someone says something that will be quoted.',
      decorativeMotifs: [
        'a single signature red accent (underline, dot, or corner block)',
        'subtle radial gradient fall-off from the centre',
        'a faint stage-light glow rising from the lower edge',
        'a small speaker-credit strip in small caps beneath the phrase',
        'a thin red corner rule mark',
      ],
      avoid: [
        'multiple competing accent colours',
        'decorative Indian motifs',
        'cartoon or sticker treatments',
        'symmetrical formal frames',
        'busy patterned backgrounds',
      ],
      lightingDirection:
        'Radial soft light at the centre fading to dark at the edges; faint warm stage-light glow rising from the bottom',
      paletteApproach:
        'Deep charcoal background with off-white headline type and a single signature TED-red accent; no third colour',
    },
    exampleBriefs: [
      'Annual Thought Leadership Forum — Ideas Worth Sharing',
      'Vision 2030 Address — A Conversation About the Future',
    ],
  },

  {
    id: 'un-summit-poster',
    name: 'UN Global Summit Poster',
    applicableTo: {
      formats: ['event_poster', 'portrait_poster', 'linkedin_post', 'linkedin_banner'],
      subjectTypes: ['concept'],
      strategies: ['concept-iconic'],
      formalities: ['premium', 'exclusive'],
      energies: ['calm', 'moderate'],
    },
    referenceLanguage: {
      visualScene:
        'An institutional summit poster pitched at the gravity of a United Nations General Assembly visual. A single symbolic motif anchors the centre — interlocking hands, a stylised globe rendered as a wireframe, an olive branch curving around a single point of light, a circle of clasped figures. The motif is rendered with restraint, line-based, almost diagrammatic. The background is deep institutional blue — the specific blue of multilateral seriousness — with a subtle radial gradient. Typography is set in a confident serif with the summit name above and a single short purpose-statement beneath. The whole frame conveys: this matters.',
      decorativeMotifs: [
        'a single symbolic line-art motif anchoring the centre',
        'a thin gold or cream hairline rule beneath the headline',
        'a subtle radial gradient on the blue field',
        'a small dateline strip in small caps',
        'restrained serif headline lockup',
      ],
      avoid: [
        'festive multi-colour palettes',
        'cartoon illustrations',
        'decorative Indian motifs',
        'multiple competing icons',
        'glitched or neon typography',
      ],
      lightingDirection:
        'Soft radial glow behind the central motif; ambient flat lighting on the field — institutional, not theatrical',
      paletteApproach:
        'Deep UN-blue base with warm cream or pale gold for type and the central motif; no third colour',
    },
    exampleBriefs: [
      'Annual Leadership Summit — Building Tomorrow Together',
      'World Education Forum — Reimagining Indian Higher Learning',
    ],
  },

  {
    id: 'leadership-summit-classic',
    name: 'Corporate Leadership Summit Classic',
    applicableTo: {
      formats: ['event_poster', 'portrait_poster', 'linkedin_post', 'linkedin_banner', 'flyer_a4'],
      subjectTypes: ['concept'],
      strategies: ['concept-iconic'],
      formalities: ['professional', 'premium'],
      energies: ['calm', 'moderate', 'high'],
    },
    referenceLanguage: {
      visualScene:
        'A classic corporate leadership-summit poster built on the visual metaphor of ascent — a stylised mountain peak silhouette, a winding path rising into mist, a stepped ascending bar-chart shape, or a sharp upward arrow rendered as a confident geometric form. The metaphor is rendered cleanly, brand-coloured, never literal mountain photography. The background is layered with a navy-to-slate gradient and a faint topographic line texture. Typography is set in a strong serif headline, with the year stamp positioned as a corner cartouche. A thin gold or silver rule underlines the lockup. The whole poster says: forward, upward, together.',
      decorativeMotifs: [
        'a stylised ascending metaphor (peak, path, arrow, bar chart)',
        'faint topographic contour lines across the field',
        'a corner-cartouche year stamp',
        'a thin gold or silver rule under the headline',
        'a small horizon-line motif at the lower edge',
      ],
      avoid: [
        'festive colour explosions',
        'cartoon or sticker-art treatments',
        'ornate Indian decorative motifs',
        'crowd photography',
        'multiple competing metaphors',
      ],
      lightingDirection:
        'Soft ambient gradient lighting, a subtle warm glow at the upper-centre as if dawn breaking over the peak; no realistic single key light',
      paletteApproach:
        'Navy-to-slate gradient base with antique gold or warm silver for the metaphor and rule lines; one off-white type colour',
    },
    exampleBriefs: [
      'Annual Leadership Summit 2026 — Charting the Next Decade',
      'Founders Forum — Vision, Velocity, Victory',
    ],
  },

  {
    id: 'innovation-launch-momentum',
    name: 'Innovation Launch Momentum',
    applicableTo: {
      formats: ['event_poster', 'portrait_poster', 'instagram_post', 'linkedin_post', 'web_banner'],
      subjectTypes: ['concept'],
      strategies: ['concept-iconic'],
      backgroundStyles: ['scene', 'dark', 'neon', 'abstract', 'geometric'],
      energies: ['high', 'explosive'],
    },
    referenceLanguage: {
      visualScene:
        'A forward-moving launch poster designed to feel like the first frame of a product film. Streaks of light trail across the frame from the lower-left to the upper-right, suggesting velocity — particles of light, vapor trails, beams arcing through space. At the convergence point sits a single bright focal mark — a starburst, a stylised flag, an abstract glyph — that the eye lands on instantly. The palette is electric and confident: deep ink-navy field, vivid cyan and magenta light trails, one bright white highlight at the focal point. The headline is set in a modern geometric sans-serif, set tight, almost cinematic. The whole composition leans forward, as if mid-flight.',
      decorativeMotifs: [
        'diagonal light trails arcing from lower-left to upper-right',
        'particles of light dispersing across the field',
        'a single bright focal mark at the convergence point',
        'a thin diagonal accent line beneath the headline',
        'a faint horizon-glow at the lower edge',
      ],
      avoid: [
        'soft pastel palettes',
        'symmetrical centred static composition',
        'ornate Indian decorative motifs',
        'cartoon illustrations',
        'multiple competing focal points',
      ],
      lightingDirection:
        'Light emanates from the focal convergence point, trailing rim-glow on every light streak, deep ambient at the corners',
      paletteApproach:
        'Deep ink-navy field with vivid cyan and magenta light trails and a single bright white highlight at the focal mark',
    },
    exampleBriefs: [
      'JKKN Innovation Drive 2026 — The Path Forward',
      'New Programme Launch — Skill India Mission 2030',
    ],
  },
]
