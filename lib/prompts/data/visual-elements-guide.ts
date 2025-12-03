/**
 * Visual Elements Guide for AI Design Suggestions
 *
 * Maps each event type to specific, iconic visual elements that should appear in posters.
 * These are NOT generic elements - they are carefully curated imagery that BELONGS with each event type.
 *
 * Used by the AI design suggestions service to provide context-aware visual recommendations.
 */

/**
 * Event type to visual elements mapping
 * Each event type has 5-6 specific visual elements that are iconic for that type
 */
export const EVENT_VISUAL_ELEMENTS: Record<string, string[]> = {
  // ============================================================
  // ACADEMIC EVENTS (11 types)
  // ============================================================

  seminar: [
    'podium with microphone under spotlight',
    'speaker at lectern gesturing confidently',
    'engaged audience in tiered seating',
    'presentation screen with infographics',
    'notebook and premium pen on desk',
    'thought bubbles or lightbulb icons'
  ],

  workshop: [
    'hands-on demonstration with tools',
    'participants gathered around workbench',
    'step-by-step instruction cards',
    'safety goggles and protective gear',
    'completed project samples on display',
    'whiteboard with diagrams and notes'
  ],

  conference: [
    'grand auditorium with stage lighting',
    'multiple speakers on panel stage',
    'networking attendees with badges',
    'conference banner backdrop',
    'registration desk with welcome signage',
    'coffee break networking area'
  ],

  guest_lecture: [
    'distinguished speaker at elegant podium',
    'attentive audience in academic hall',
    'ceremonial garland or bouquet presentation',
    'speaker profile silhouette with credentials',
    'university emblem or seal',
    'microphone with sound waves'
  ],

  webinar: [
    'laptop screen showing live presenter',
    'multiple participant video tiles',
    'chat window with engagement icons',
    'digital connection globe illustration',
    'headphones with microphone',
    'play button and streaming indicators'
  ],

  industrial_visit: [
    'factory floor with machinery',
    'students wearing safety helmets',
    'assembly line or production process',
    'tour guide explaining operations',
    'industrial equipment close-up',
    'bus or transport for the visit'
  ],

  orientation: [
    'campus map with highlighted buildings',
    'welcoming hands or open doors',
    'group of diverse new students',
    'campus landmarks and iconic buildings',
    'orientation kit with handbook',
    'compass or direction arrows'
  ],

  convocation: [
    'graduation caps tossed in the air',
    'students in academic robes and gowns',
    'rolled diploma with ribbon',
    'proud moment on stage receiving degree',
    'university mace and ceremonial elements',
    'family members applauding'
  ],

  placement_drive: [
    'handshake between candidate and recruiter',
    'interview panel setup',
    'company logos and recruitment banners',
    'resume and portfolio documents',
    'confident candidate in formal attire',
    'career path ascending arrows'
  ],

  science_fair: [
    'student presenting project display board',
    'microscope and laboratory equipment',
    'volcano model or chemical reaction demo',
    'robot or mechanical innovation',
    'judges with clipboards evaluating',
    'first place ribbon or trophy'
  ],

  training: [
    'instructor demonstrating technique',
    'skill certification badge',
    'progress chart showing improvement',
    'training manual with highlights',
    'participants taking notes',
    'practice equipment or simulation'
  ],

  // ============================================================
  // COMPETITION EVENTS (6 types)
  // ============================================================

  competition: [
    'trophy cup gleaming under spotlight',
    'medal with ribbon on podium',
    'participants in action competing',
    'scoreboard showing standings',
    'referee or judge making decision',
    'victory celebration moment'
  ],

  hackathon: [
    'developers coding intensely on laptops',
    'whiteboard full of ideas and diagrams',
    'energy drinks and snacks on table',
    'countdown timer display',
    'team huddle discussing solution',
    'code on multiple screens'
  ],

  quiz: [
    'buzzer buttons on participant desks',
    'quiz master with question cards',
    'thinking participant with hand raised',
    'scoreboard with team standings',
    'spotlight on answering team',
    'question mark symbols'
  ],

  debate: [
    'opposing podiums facing each other',
    'speaker with emphatic gesture',
    'audience members contemplating',
    'gavel and timer on moderator desk',
    'speech bubbles representing arguments',
    'scales of justice or balance icon'
  ],

  sports_event: [
    'athlete in peak action moment',
    'stadium or sports arena view',
    'sports equipment (ball, racket, etc.)',
    'cheering crowd with banners',
    'starting line or finish tape',
    'scoreboard showing match status'
  ],

  sports_day: [
    'relay race baton handoff',
    'students lined up for race',
    'colorful house flags or team banners',
    'athletics track with lane markings',
    'tug of war team pulling',
    'medal ceremony on field'
  ],

  // ============================================================
  // CELEBRATION EVENTS (10 types)
  // ============================================================

  celebration: [
    'confetti explosion in the air',
    'balloons in vibrant colors',
    'people raising glasses in toast',
    'decorated venue with lights',
    'cake cutting ceremony',
    'joyful group photo moment'
  ],

  cultural_event: [
    'traditional dancers in costume',
    'classical musical instruments',
    'rangoli or traditional floor art',
    'ethnic decorations and diyas',
    'folk performers on stage',
    'cultural attire showcase'
  ],

  annual_day: [
    'stage performance with lighting',
    'chief guest cutting ribbon',
    'student performers in costumes',
    'award distribution on stage',
    'decorated auditorium seating',
    'annual report or achievement display'
  ],

  freshers_day: [
    'welcome banner with decorations',
    'ramp walk or fashion show',
    'ice-breaker games in progress',
    'seniors welcoming freshers',
    'talent showcase on stage',
    'party decorations and balloons'
  ],

  farewell: [
    'seniors in formal farewell attire',
    'juniors presenting mementos',
    'emotional group hug moment',
    'farewell cake with message',
    'photo wall with memories',
    'graduation year banner'
  ],

  alumni_meet: [
    'nostalgic campus walkthrough',
    'batch photo recreation',
    'yearbook or memory album',
    'then-and-now photo comparison',
    'reunion registration desk',
    'class year banner'
  ],

  reunion: [
    'friends embracing after long time',
    'memory wall with old photos',
    'reunion banner with year range',
    'shared meal or dinner setting',
    'photo booth with props',
    'contact exchange moment'
  ],

  tech_fest: [
    'robot competition arena',
    'drone flying demonstration',
    'VR headset user immersed',
    'coding competition screens',
    'tech exhibition stalls',
    'innovation prototype display'
  ],

  cultural_fest: [
    'elaborate stage setup with lights',
    'dance performance mid-action',
    'musical band performing live',
    'art installation or exhibition',
    'food stall with cultural cuisine',
    'audience cheering for performers'
  ],

  festival: [
    'fireworks lighting up the sky',
    'traditional decorations and lights',
    'community gathering in celebration',
    'festival-specific symbols (diya, rangoli)',
    'traditional sweets and offerings',
    'family celebrating together'
  ],

  // ============================================================
  // CORPORATE EVENTS (9 types)
  // ============================================================

  meetup: [
    'professionals networking with coffee',
    'name badge stickers on attendees',
    'casual discussion circle',
    'speaker with small audience',
    'community logos and banners',
    'informal presentation setup'
  ],

  exhibition: [
    'exhibition booths with displays',
    'visitors examining products',
    'company banners and branding',
    'demo area with crowd',
    'trade show floor overview',
    'business card exchange'
  ],

  product_launch: [
    'product unveiling under spotlight',
    'dramatic curtain reveal moment',
    'CEO or founder presenting',
    'product close-up with features',
    'audience capturing on phones',
    'launch countdown display'
  ],

  town_hall: [
    'CEO addressing large gathering',
    'employees in auditorium seating',
    'company values on screen',
    'Q&A microphone in audience',
    'organizational charts or goals',
    'transparent glass meeting space'
  ],

  award_ceremony: [
    'winner receiving trophy on stage',
    'spotlight on award presenter',
    'nominees seated in formal rows',
    'red carpet entrance',
    'crystal trophy or plaque',
    'standing ovation moment'
  ],

  networking: [
    'business card exchange handshake',
    'professionals in conversation groups',
    'name tags and lanyards',
    'cocktail reception setting',
    'LinkedIn or contact sharing',
    'follow-up connection icons'
  ],

  panel_discussion: [
    'multiple speakers on stage with mics',
    'moderator facilitating discussion',
    'audience with question cards',
    'topic banner behind panelists',
    'diverse perspectives represented',
    'thought leader name plates'
  ],

  inauguration: [
    'ribbon cutting with giant scissors',
    'lamp lighting ceremony (Indian)',
    'foundation stone unveiling',
    'dignitaries on stage',
    'ceremonial key handover',
    'new building or facility entrance'
  ],

  foundation_day: [
    'historical photos montage',
    'founder portrait or statue',
    'milestone timeline graphic',
    'celebratory gathering of members',
    'anniversary cake or logo',
    'achievement awards display'
  ],

  // ============================================================
  // COMMUNITY EVENTS (5 types)
  // ============================================================

  blood_donation: [
    'blood donation bag with crimson liquid',
    'caring hands reaching out',
    'heart symbol with blood drop',
    'comfortable donation chair',
    'smiling donor with bandaged arm',
    'red cross or medical symbol'
  ],

  health_camp: [
    'medical checkup in progress',
    'doctor consulting patient',
    'health screening stations',
    'blood pressure monitor',
    'stethoscope and medical equipment',
    'health awareness banner'
  ],

  csr_activity: [
    'volunteers in branded t-shirts',
    'tree plantation activity',
    'teaching underprivileged children',
    'community service in action',
    'corporate volunteers with locals',
    'impact statistics infographic'
  ],

  awareness_program: [
    'awareness ribbon in cause color',
    'information pamphlets and materials',
    'speaker educating audience',
    'symbolic imagery for the cause',
    'pledge taking moment',
    'statistics or facts display'
  ],

  charity_event: [
    'donation box or collection',
    'beneficiaries receiving support',
    'charity gala dinner setup',
    'auction items on display',
    'volunteer team in action',
    'thank you to donors banner'
  ],

  // ============================================================
  // NATIONAL EVENTS (4 types)
  // ============================================================

  independence_day: [
    'national flag hoisting ceremony',
    'tricolor balloons and decorations',
    'patriotic parade march',
    'freedom fighter silhouettes',
    'August 15 calendar date',
    'Ashoka Chakra emblem'
  ],

  republic_day: [
    'ceremonial parade with floats',
    'constitution book illustration',
    'national flag unfurling',
    'armed forces march past',
    'January 26 calendar date',
    'Indian national emblem'
  ],

  teachers_day: [
    'apple on teacher desk',
    'blackboard with thank you message',
    'student presenting flower to teacher',
    'classroom teaching moment',
    'Dr. Radhakrishnan portrait',
    'September 5 calendar date'
  ],

  memorial: [
    'tribute candles or eternal flame',
    'flower wreath laying ceremony',
    'moment of silence gathering',
    'memorial plaque or statue',
    'portrait with garland',
    'respectful salute or bow'
  ]
}

/**
 * Get visual elements for an event type
 * Falls back to generic elements if event type not found
 */
export function getVisualElements(eventType: string): string[] {
  if (eventType && EVENT_VISUAL_ELEMENTS[eventType]) {
    return EVENT_VISUAL_ELEMENTS[eventType]
  }

  // Generic fallback
  return [
    'people gathering at an event',
    'event banner or backdrop',
    'engaged audience members',
    'speaker or presenter',
    'decorative elements',
    'venue setting'
  ]
}

/**
 * Get formatted visual elements as bullet string for prompts
 */
export function getVisualElementsPrompt(eventType: string): string {
  const elements = getVisualElements(eventType)
  return elements.map((el, i) => `${i + 1}. ${el}`).join('\n')
}

/**
 * Check if an event type has defined visual elements
 */
export function hasVisualElements(eventType: string): boolean {
  return eventType in EVENT_VISUAL_ELEMENTS
}
