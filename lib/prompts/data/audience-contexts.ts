/**
 * Audience context mappings for all 45+ event types
 * Based on "Nano Banana Pro" guide: Provide Context ("Why" / "For whom")
 * - Define WHO will view this and WHY it matters to them
 */

import type { AudienceContext } from '../types'

/**
 * Event type to audience context mapping
 * Defines the primary audience, their occasion, and desired emotional response
 */
export const EVENT_AUDIENCE_CONTEXTS: Record<string, AudienceContext> = {
  // ============================================================
  // ACADEMIC EVENTS (11 types)
  // ============================================================

  seminar: {
    primaryAudience: 'students and academics seeking deeper understanding of specialized topics',
    occasion: 'attending to expand their knowledge through expert-led focused discussion',
    emotionalResponse: 'intellectually curious, professionally engaged, and eager to learn'
  },

  workshop: {
    primaryAudience: 'learners eager to develop practical, hands-on skills',
    occasion: 'ready to participate actively and take away actionable knowledge they can apply',
    emotionalResponse: 'motivated, focused, and ready to practice new techniques'
  },

  conference: {
    primaryAudience: 'industry professionals, researchers, and thought leaders',
    occasion: 'seeking cutting-edge knowledge, networking opportunities, and professional growth',
    emotionalResponse: 'inspired, professionally engaged, and eager to participate and connect'
  },

  guest_lecture: {
    primaryAudience: 'students and faculty members seeking wisdom from distinguished experts',
    occasion: 'attending to hear unique insights and perspectives from an accomplished speaker',
    emotionalResponse: 'receptive, respectful, curious, and intellectually stimulated'
  },

  webinar: {
    primaryAudience: 'remote professionals and learners who value accessible education',
    occasion: 'joining virtually to gain valuable insights without geographical constraints',
    emotionalResponse: 'attentive, appreciative of accessibility, and ready to engage digitally'
  },

  industrial_visit: {
    primaryAudience: 'students and faculty exploring real-world applications of their studies',
    occasion: 'bridging classroom learning with practical industry experience',
    emotionalResponse: 'excited, observant, and eager to see theory in practice'
  },

  orientation: {
    primaryAudience: 'newcomers embarking on a new chapter in their educational journey',
    occasion: 'preparing to integrate into a new community and understand their environment',
    emotionalResponse: 'excited yet nervous, hopeful, and ready to belong'
  },

  convocation: {
    primaryAudience: 'graduates, proud families, distinguished faculty, and honored guests',
    occasion: 'celebrating the culmination of years of hard work and academic achievement',
    emotionalResponse: 'proud, accomplished, nostalgic, and hopeful for the future'
  },

  placement_drive: {
    primaryAudience: 'job-seeking students and recent graduates ready to launch careers',
    occasion: 'meeting potential employers and showcasing their skills and potential',
    emotionalResponse: 'determined, hopeful, professionally prepared, and confident'
  },

  science_fair: {
    primaryAudience: 'young innovators, parents, educators, and science enthusiasts',
    occasion: 'showcasing creativity and scientific discovery through hands-on projects',
    emotionalResponse: 'curious, excited, proud of innovations, and inspired by discovery'
  },

  training: {
    primaryAudience: 'professionals seeking to upgrade skills or learn new competencies',
    occasion: 'investing time in professional development and career growth',
    emotionalResponse: 'focused, committed to improvement, and professionally motivated'
  },

  // ============================================================
  // COMPETITION EVENTS (6 types)
  // ============================================================

  competition: {
    primaryAudience: 'participants ready to showcase their talents and compete for recognition',
    occasion: 'testing their abilities against peers in a structured competitive environment',
    emotionalResponse: 'competitive, determined, excited, and ready to give their best'
  },

  hackathon: {
    primaryAudience: 'developers, designers, and innovators passionate about building solutions',
    occasion: 'collaborating intensively to create innovative solutions under time pressure',
    emotionalResponse: 'excited, creatively energized, competitive, and collaboration-ready'
  },

  quiz: {
    primaryAudience: 'knowledge enthusiasts and competitive minds ready to prove themselves',
    occasion: 'testing their knowledge and quick thinking against worthy opponents',
    emotionalResponse: 'alert, competitive, confident, and ready to prove themselves'
  },

  debate: {
    primaryAudience: 'articulate thinkers who value discourse and persuasive argumentation',
    occasion: 'engaging with important ideas through structured intellectual combat',
    emotionalResponse: 'intellectually stimulated, persuasive, and ready to make their case'
  },

  sports_event: {
    primaryAudience: 'athletes, sports enthusiasts, supporters, and fans',
    occasion: 'competing for glory or cheering for their teams and champions',
    emotionalResponse: 'energetic, passionate, team-spirited, and ready for action'
  },

  sports_day: {
    primaryAudience: 'students, athletes, families, and community members celebrating fitness',
    occasion: 'participating in or supporting friendly athletic competition and camaraderie',
    emotionalResponse: 'playful, energetic, team-spirited, and excited for friendly competition'
  },

  // ============================================================
  // CELEBRATION EVENTS (10 types)
  // ============================================================

  celebration: {
    primaryAudience: 'community members and guests gathering to mark a special occasion',
    occasion: 'coming together to celebrate achievements, milestones, or shared joy',
    emotionalResponse: 'joyful, connected, festive, and ready to celebrate together'
  },

  cultural_event: {
    primaryAudience: 'community members and culture enthusiasts celebrating heritage',
    occasion: 'expressing and experiencing cultural traditions, arts, and shared identity',
    emotionalResponse: 'connected to tradition, proud, joyful, and culturally enriched'
  },

  annual_day: {
    primaryAudience: 'students, families, staff, and distinguished guests marking yearly milestones',
    occasion: 'celebrating a year of achievements and looking forward to the next',
    emotionalResponse: 'proud, nostalgic, festive, and excited about shared accomplishments'
  },

  freshers_day: {
    primaryAudience: 'new students and seniors welcoming the newest members of their community',
    occasion: 'officially welcoming newcomers and initiating them into the community culture',
    emotionalResponse: 'excited, nervous, welcomed, and ready to start new friendships'
  },

  farewell: {
    primaryAudience: 'graduating members and those staying behind to bid fond goodbyes',
    occasion: 'honoring those moving on while celebrating shared memories and bonds',
    emotionalResponse: 'nostalgic, emotional, grateful, and hopeful for continued connections'
  },

  alumni_meet: {
    primaryAudience: 'former students reconnecting with their alma mater and old friends',
    occasion: 'revisiting cherished memories and strengthening lifelong bonds',
    emotionalResponse: 'nostalgic, happy to reconnect, proud of their roots, and grateful'
  },

  reunion: {
    primaryAudience: 'past acquaintances coming together after years apart',
    occasion: 'rekindling old friendships and celebrating shared history',
    emotionalResponse: 'nostalgic, excited to reconnect, warm, and reminiscent'
  },

  tech_fest: {
    primaryAudience: 'tech enthusiasts, innovators, and aspiring technologists',
    occasion: 'celebrating technology through competitions, exhibitions, and demonstrations',
    emotionalResponse: 'amazed, inspired, curious, and eager to explore innovations'
  },

  cultural_fest: {
    primaryAudience: 'artists, performers, and audiences celebrating cultural expression',
    occasion: 'showcasing diverse talents and experiencing rich cultural performances',
    emotionalResponse: 'culturally enriched, entertained, inspired, and connected'
  },

  festival: {
    primaryAudience: 'community members celebrating together in festive spirit',
    occasion: 'marking special occasions with traditional celebrations and joy',
    emotionalResponse: 'joyful, festive, connected to tradition, and celebratory'
  },

  // ============================================================
  // CORPORATE EVENTS (9 types)
  // ============================================================

  meetup: {
    primaryAudience: 'professionals with shared interests gathering to network and learn',
    occasion: 'connecting with like-minded individuals in a casual professional setting',
    emotionalResponse: 'open to connections, curious about others, and professionally social'
  },

  exhibition: {
    primaryAudience: 'industry professionals, enthusiasts, and curious visitors',
    occasion: 'exploring showcased products, innovations, or artistic works',
    emotionalResponse: 'curious, impressed, and eager to discover something new'
  },

  product_launch: {
    primaryAudience: 'potential customers, media, industry watchers, and stakeholders',
    occasion: 'witnessing the unveiling of something new and innovative',
    emotionalResponse: 'curious, excited, ready to be impressed, and anticipating innovation'
  },

  town_hall: {
    primaryAudience: 'organizational members seeking transparency and connection with leadership',
    occasion: 'hearing directly from leadership about vision, challenges, and direction',
    emotionalResponse: 'engaged, valued, informed, and connected to organizational purpose'
  },

  award_ceremony: {
    primaryAudience: 'achievers, nominees, supporters, and distinguished guests',
    occasion: 'celebrating excellence and recognizing outstanding accomplishments',
    emotionalResponse: 'honored, celebrated, inspired, and motivated to achieve'
  },

  networking: {
    primaryAudience: 'professionals seeking to expand their professional connections',
    occasion: 'building relationships that could lead to opportunities and collaboration',
    emotionalResponse: 'open, approachable, opportunity-minded, and professionally social'
  },

  panel_discussion: {
    primaryAudience: 'professionals and enthusiasts seeking diverse expert perspectives',
    occasion: 'gaining insights from multiple experts on important topics',
    emotionalResponse: 'intellectually engaged, curious about different viewpoints, and thoughtful'
  },

  inauguration: {
    primaryAudience: 'stakeholders, dignitaries, and community members marking new beginnings',
    occasion: 'officially launching a new venture, facility, or initiative',
    emotionalResponse: 'hopeful, proud, excited about possibilities, and ceremonially engaged'
  },

  foundation_day: {
    primaryAudience: 'organizational members and stakeholders celebrating institutional history',
    occasion: 'honoring the founding and evolution of an institution or organization',
    emotionalResponse: 'proud, connected to history, grateful to founders, and forward-looking'
  },

  // ============================================================
  // COMMUNITY EVENTS (5 types)
  // ============================================================

  blood_donation: {
    primaryAudience: 'compassionate community members willing to give the gift of life',
    occasion: 'contributing to life-saving efforts through voluntary blood donation',
    emotionalResponse: 'generous, helpful, proud to contribute, and community-minded'
  },

  health_camp: {
    primaryAudience: 'community members seeking accessible healthcare and wellness services',
    occasion: 'receiving health screenings, consultations, and wellness guidance',
    emotionalResponse: 'health-conscious, grateful for access, and proactively caring for wellbeing'
  },

  csr_activity: {
    primaryAudience: 'corporate volunteers and community beneficiaries coming together',
    occasion: 'giving back to society through corporate social responsibility initiatives',
    emotionalResponse: 'purposeful, connected to community, proud to contribute, and fulfilled'
  },

  awareness_program: {
    primaryAudience: 'concerned citizens and advocates seeking to learn and spread awareness',
    occasion: 'learning about important issues affecting society and how to help',
    emotionalResponse: 'informed, empowered, motivated to act, and socially conscious'
  },

  charity_event: {
    primaryAudience: 'philanthropic individuals and organizations supporting worthy causes',
    occasion: 'contributing to meaningful causes through donations and participation',
    emotionalResponse: 'generous, purposeful, connected to cause, and fulfilled by giving'
  },

  // ============================================================
  // NATIONAL EVENTS (4 types)
  // ============================================================

  independence_day: {
    primaryAudience: 'patriotic citizens celebrating freedom and national identity',
    occasion: 'honoring the nation\'s independence and the sacrifices of freedom fighters',
    emotionalResponse: 'patriotic, proud, grateful to forebears, and nationally united'
  },

  republic_day: {
    primaryAudience: 'citizens celebrating the nation\'s constitution and democratic values',
    occasion: 'commemorating the establishment of the republic and constitutional values',
    emotionalResponse: 'patriotic, proud of democracy, civically engaged, and nationally proud'
  },

  teachers_day: {
    primaryAudience: 'students, parents, and communities honoring educators',
    occasion: 'expressing gratitude and appreciation for teachers\' invaluable contributions',
    emotionalResponse: 'grateful, respectful, appreciative, and honoring of mentors'
  },

  memorial: {
    primaryAudience: 'those gathered to honor and remember important figures or events',
    occasion: 'paying tribute to those who have passed or significant historical moments',
    emotionalResponse: 'reflective, respectful, grateful for legacy, and solemnly appreciative'
  },
}

/**
 * Get audience context for an event type
 * Falls back to a generic context if event type not found
 */
export function getAudienceContext(eventType: string, organizationName: string): AudienceContext {
  if (eventType && EVENT_AUDIENCE_CONTEXTS[eventType]) {
    return EVENT_AUDIENCE_CONTEXTS[eventType]
  }

  // Generic fallback
  return {
    primaryAudience: `attendees and stakeholders of ${organizationName}`,
    occasion: 'gathering for an important event that matters to them',
    emotionalResponse: 'engaged, interested, and ready to participate fully'
  }
}

/**
 * Check if an event type has a defined audience context
 */
export function hasAudienceContext(eventType: string): boolean {
  return eventType in EVENT_AUDIENCE_CONTEXTS
}

/**
 * Get all available event types with contexts
 */
export function getEventTypesWithContexts(): string[] {
  return Object.keys(EVENT_AUDIENCE_CONTEXTS)
}
