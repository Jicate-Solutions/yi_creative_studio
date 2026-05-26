/**
 * Activity archetypes for event_poster × activity-collage.
 *
 * The brief here is multi-zone — a fest, a hackathon, a community celebration,
 * a sports meet. The reference language has to help Gemini build a unified
 * multi-panel composition that doesn't read as random clip-art collage.
 */

import type { CreativeArchetype } from './index'

export const EVENT_POSTER_ACTIVITY_ARCHETYPES: CreativeArchetype[] = [
  {
    id: 'diwali-festival-flyer',
    name: 'Diwali Festival Flyer',
    applicableTo: {
      formats: ['event_poster', 'flyer_a5', 'flyer_a4', 'instagram_post', 'whatsapp_status'],
      subjectTypes: ['activity', 'concept'],
      strategies: ['activity-collage', 'concept-iconic'],
      backgroundStyles: ['festive', 'mandala', 'scene'],
      energies: ['high', 'explosive'],
    },
    referenceLanguage: {
      visualScene:
        'A jubilant Indian festival flyer in the visual register of a neighbourhood Diwali celebration poster. The frame is divided into three or four illustrated zones connected by a flowing ribbon of fairy-light strings — diyas, sparklers, rangoli motifs, fireworks bursts. The colour temperature is hot and joyful — saffron, marigold, deep red, gold. Cartoon-style hands light lamps, kids hold sparklers, a kolam blooms at the lower edge. The typography is exuberant, set inside a gold cartouche at the top, the words feeling almost hand-painted. Mandala filigree fills the corners. The whole thing crackles with celebration.',
      decorativeMotifs: [
        'rows of lit diyas along the lower edge',
        'firework bursts across the upper third',
        'kolam / rangoli pattern in the centre-bottom',
        'mandala filigree in the four corners',
        'string of fairy lights connecting activity zones',
      ],
      avoid: [
        'cool or muted palettes',
        'corporate minimalism',
        'photo-real Western party imagery',
        'monochrome treatments',
        'empty negative space',
      ],
      lightingDirection:
        'Multi-source warm glow from the diyas and sparklers themselves, a sunset wash across the whole field, no realistic single key light',
      paletteApproach:
        'Saffron, marigold, deep red and emerald jewel-tones with antique gold for type and frames; one festive turquoise accent',
    },
    exampleBriefs: [
      'Diwali Celebration 2026 — Festival of Lights Community Gathering',
      'Annual Cultural Night with Music, Dance and Sweets Distribution',
    ],
  },

  {
    id: 'college-fest-poster',
    name: 'College Cultural Fest Poster',
    applicableTo: {
      formats: ['event_poster', 'portrait_poster', 'instagram_post', 'instagram_story', 'flyer_a4'],
      subjectTypes: ['activity'],
      strategies: ['activity-collage'],
      energies: ['high', 'explosive'],
    },
    referenceLanguage: {
      visualScene:
        'An electric college cultural-fest poster pitched at undergraduates, the kind taped to noticeboards in every hostel. The canvas is split into four or five illustrated activity zones — a singer at a mic, dancers mid-leap, a stage with theatre masks, an art easel, a debate podium — each panel rendered in a slightly different but harmonised illustration style. A bold festival logotype dominates the centre, set at a confident angle. The palette is electric and youth-coded: hot pink, electric blue, neon yellow, vivid violet. Stickers, doodles, halftone dots and pop-art rays connect the panels. The whole thing radiates Friday-night energy.',
      decorativeMotifs: [
        'sticker-style stars and bursts scattered across the field',
        'halftone dot textures inside the activity panels',
        'doodle squiggles and arrows pointing between zones',
        'a bold central festival-name logotype',
        'pop-art ray-lines radiating from the title',
      ],
      avoid: [
        'corporate restraint',
        'muted or pastel palettes',
        'symmetrical formal layouts',
        'photo-realistic single-scene composition',
        'ornate traditional Indian motifs',
      ],
      lightingDirection:
        'Flat illustrated lighting — no realistic shadow logic; all energy comes from colour contrast and motion lines',
      paletteApproach:
        'Electric youth palette: hot pink, electric blue, neon yellow, vivid violet, with black ink outlines and white highlights for punch',
    },
    exampleBriefs: [
      'Pulse 2K26 — College Cultural Fest featuring Dance, Music, Drama, Art and Debate',
      'Aaveg 2026 Inter-College Fest — Singing, Dance, Fashion, Stage, Competitions',
    ],
  },

  {
    id: 'hackathon-cyberpunk',
    name: 'Hackathon Cyberpunk Grid',
    applicableTo: {
      formats: ['event_poster', 'portrait_poster', 'instagram_post', 'linkedin_post', 'flyer_a4'],
      subjectTypes: ['activity', 'concept'],
      strategies: ['activity-collage', 'concept-iconic'],
      backgroundStyles: ['dark', 'neon', 'geometric'],
      energies: ['high', 'explosive'],
    },
    referenceLanguage: {
      visualScene:
        'A high-energy tech-event poster pitched at developers — the visual register of a cyberpunk hackathon flyer or a CTF announcement. The background is near-black with a perspective grid receding into the distance, neon cyan and magenta light trails arcing through it. Activity zones are presented as floating glass HUD panels — a code window, a wireframe device, a podium icon for the pitch round, a trophy for the prize ceremony. The headline is set in a glitched mono typeface with chromatic-aberration RGB offset. Faint scanlines run across the field. The whole frame hums with after-midnight energy.',
      decorativeMotifs: [
        'receding perspective grid floor with neon edge-glow',
        'glitched chromatic-aberration RGB-offset headline',
        'floating glass HUD panels with thin neon borders',
        'scanline texture across the whole frame',
        'a small terminal-cursor blink mark beside the title',
      ],
      avoid: [
        'warm or pastel palettes',
        'traditional Indian decorative motifs',
        'cartoon sticker-art treatments',
        'realistic daylight scenes',
        'soft floral or organic shapes',
      ],
      lightingDirection:
        'Cyan and magenta rim glow on every panel edge, deep black ambient, no realistic key light — all illumination is emissive from the UI itself',
      paletteApproach:
        'Near-black background with electric cyan and hot magenta as twin accents; one lime-green highlight for code-style markers',
    },
    exampleBriefs: [
      'JKKN Hackathon 2026 — Coding Sprints, Design Challenges, Pitch Round, Prize Ceremony',
      'CodeFest — 24-hour Build, Demo Day, Mentor Hours, Awards Night',
    ],
  },

  {
    id: 'community-utsav',
    name: 'Community Utsav Folk-Art Celebration',
    applicableTo: {
      formats: ['event_poster', 'flyer_a4', 'flyer_a5', 'invitation', 'whatsapp_status'],
      subjectTypes: ['activity', 'concept'],
      strategies: ['activity-collage', 'concept-iconic'],
      backgroundStyles: ['festive', 'mandala', 'illustrated'],
      energies: ['moderate', 'high'],
    },
    referenceLanguage: {
      visualScene:
        'A warm community-celebration poster rendered in the folk-art register of a temple-town utsav flyer. The frame uses traditional Indian visual devices — kolam-style border bands, paisley filigree, lotus rosettes — to organise three or four illustrated activity panels showing the day\'s schedule. Hand-drawn figures dance, sing and gather, each panel feeling like a page from a folk-art storybook. The palette is rich and earthy — turmeric yellow, deep madder red, sage green, brick orange. The headline is set in a warm hand-painted serif with a small ceremonial diya beside it. The mood is rooted, gentle, multigenerational.',
      decorativeMotifs: [
        'kolam border band along the top and bottom edges',
        'paisley filigree separating activity panels',
        'lotus rosettes in the corners',
        'a small lit diya beside the headline',
        'folk-art figures with simplified faces in each panel',
      ],
      avoid: [
        'neon or electric palettes',
        'corporate sans-serif typography alone',
        'cold lighting or dark backgrounds',
        'photo-real Western party imagery',
        'angular geometric grid layouts',
      ],
      lightingDirection:
        'Flat illustrated lighting with hand-painted shading; no realistic shadow — light feels diffused across the whole field as if from morning sun',
      paletteApproach:
        'Turmeric yellow, madder red, sage green and brick-orange on a warm cream paper-toned base; antique gold for type and rules',
    },
    exampleBriefs: [
      'Village Utsav 2026 — Folk Music, Traditional Dance, Crafts Bazaar, Community Feast',
      'JKKN Founders Day — Cultural Performances, Honour Ceremony, Community Meal',
    ],
  },

  {
    id: 'sports-day-energy',
    name: 'Sports Day Action Energy',
    applicableTo: {
      formats: ['event_poster', 'portrait_poster', 'flyer_a4', 'instagram_post'],
      subjectTypes: ['activity'],
      strategies: ['activity-collage'],
      energies: ['high', 'explosive'],
    },
    referenceLanguage: {
      visualScene:
        'A kinetic sports-day poster that feels like the opening frame of a televised tournament montage. Action silhouettes of athletes — a sprinter mid-stride, a footballer striking, a basketball player rising, a kabaddi raider lunging — are layered diagonally across the frame, each one trailing motion lines and speed streaks. The colour fields explode behind them in school or institutional colours, intersecting in chevron and diagonal-band patterns. The headline is set in a heavy condensed sans-serif at an aggressive angle, with a stadium-spotlight halo behind it. The whole composition leans forward.',
      decorativeMotifs: [
        'diagonal chevron colour bands cutting across the field',
        'motion lines and speed streaks trailing each athlete',
        'a faint stadium-spotlight halo behind the headline',
        'a small scoreboard-style result strip at the lower edge',
        'silhouetted crowd-line at the very bottom',
      ],
      avoid: [
        'soft pastel palettes',
        'ornate traditional Indian motifs',
        'symmetrical centred composition',
        'still or static figures',
        'cartoon sticker-art treatments',
      ],
      lightingDirection:
        'Stadium floodlight angled from upper-right, hard rim light on each athlete silhouette, deep shadow at the lower edges',
      paletteApproach:
        'Two strong institutional colours in chevron bands (e.g. royal blue + crimson, or forest green + gold) with white silhouettes and black accent type',
    },
    exampleBriefs: [
      'Annual Sports Meet 2026 — Athletics, Football, Basketball, Kabaddi, Relay',
      'Inter-House Tournament — Track, Field, Team Sports, Closing Ceremony',
    ],
  },

  {
    id: 'conference-multitrack',
    name: 'Multi-Track Conference Grid',
    applicableTo: {
      formats: ['event_poster', 'portrait_poster', 'linkedin_post', 'linkedin_banner', 'flyer_a4'],
      subjectTypes: ['activity', 'concept'],
      strategies: ['activity-collage', 'concept-iconic'],
      formalities: ['professional', 'premium'],
      energies: ['calm', 'moderate'],
    },
    referenceLanguage: {
      visualScene:
        'A composed multi-track conference poster designed for a working-professional audience. The frame is organised on a clean modular grid — four or five rectangular panels, each representing one track, each headed by a single restrained line icon (a microphone, a workshop bench, a panel of seats, a paper-presentation stand). The headline sits in a confident block at the top, with the conference dates and venue in a small strip beneath. Typography is disciplined sans-serif, all left-aligned, generous in white space. The palette is institutional and quiet — deep blue, slate, warm cream — with one accent jewel-tone marking the headline. The whole thing reads as serious, organised, premium.',
      decorativeMotifs: [
        'a clean modular grid dividing the conference tracks',
        'a single line-icon per track (mic, bench, panel, stand)',
        'a thin accent rule under the headline',
        'a small dateline strip in small caps',
        'restrained brand-coloured tag-strip at the lower corner',
      ],
      avoid: [
        'festive multi-colour explosions',
        'cartoon illustrations',
        'ornate decorative borders',
        'symmetrical centred composition',
        'glitched or neon typography',
      ],
      lightingDirection:
        'Flat editorial lighting, no realistic shadow — depth comes from typographic hierarchy and grid discipline, not light',
      paletteApproach:
        'Deep institutional blue or slate base with warm cream type and one jewel-tone accent (saffron, oxblood, emerald) for the headline',
    },
    exampleBriefs: [
      'Annual HR Conference 2026 — Talent, Compensation, Wellbeing, Leadership Panels',
      'Tech Symposium — Paper Presentations, Workshops, Panel Discussions, Networking',
    ],
  },
]
