/**
 * Event Type Inference Helper v1.0
 *
 * Infers event type from flyer content (title, description, venue)
 * Maps keywords to the 45 event types defined in visual-elements-guide.ts
 *
 * Used when user selects "AI" theme/style to generate contextual backgrounds
 */

// ============================================================
// TYPES
// ============================================================

export interface InferredEventContext {
  /** The inferred event type (matches keys in EVENT_VISUAL_ELEMENTS) */
  eventType: string | null
  /** Confidence level of the inference */
  confidence: 'high' | 'medium' | 'low'
  /** Keywords that matched in the content */
  matchedKeywords: string[]
  /** Secondary event type if applicable (e.g., tech + workshop) */
  secondaryType?: string
}

// ============================================================
// KEYWORD MAPPINGS
// ============================================================

/**
 * Maps keywords to the 45 event types from visual-elements-guide.ts
 * Keywords are ordered by specificity (most specific first)
 */
const EVENT_TYPE_KEYWORDS: Record<string, string[]> = {
  // ============================================================
  // ACADEMIC EVENTS (11 types)
  // ============================================================
  seminar: [
    'seminar', 'lecture', 'talk', 'speaker session', 'keynote',
    'discourse', 'colloquium', 'symposium'
  ],
  workshop: [
    'workshop', 'hands-on', 'training session', 'practical session',
    'skill building', 'bootcamp', 'masterclass', 'crash course',
    'learning session', 'tutorial'
  ],
  conference: [
    'conference', 'summit', 'convention', 'forum', 'congress',
    'annual meet', 'conclave', 'gathering'
  ],
  guest_lecture: [
    'guest lecture', 'special talk', 'guest speaker', 'visiting faculty',
    'expert session', 'distinguished lecture'
  ],
  webinar: [
    'webinar', 'online session', 'virtual session', 'zoom meeting',
    'live stream', 'online workshop', 'virtual workshop', 'e-learning'
  ],
  industrial_visit: [
    'industrial visit', 'factory visit', 'plant visit', 'site visit',
    'industry tour', 'field trip'
  ],
  orientation: [
    'orientation', 'welcome session', 'onboarding', 'induction',
    'fresher welcome', 'new joiner'
  ],
  convocation: [
    'convocation', 'graduation', 'degree ceremony', 'commencement',
    'passing out', 'alumni ceremony'
  ],
  placement_drive: [
    'placement', 'recruitment', 'campus hiring', 'job fair',
    'career fair', 'interview drive'
  ],
  science_fair: [
    'science fair', 'science exhibition', 'innovation fair',
    'project exhibition', 'stem fair'
  ],
  training: [
    'training program', 'certification', 'skill development',
    'professional development', 'capacity building'
  ],

  // ============================================================
  // COMPETITION EVENTS (6 types)
  // ============================================================
  competition: [
    'competition', 'contest', 'challenge', 'championship',
    'tournament', 'olympiad'
  ],
  hackathon: [
    'hackathon', 'code sprint', 'build-a-thon', 'coding challenge',
    'hack day', 'code jam', 'programming contest', 'developer challenge'
  ],
  quiz: [
    'quiz', 'trivia', 'knowledge test', 'quiz competition',
    'brain battle', 'quiz bowl'
  ],
  debate: [
    'debate', 'discussion', 'moot court', 'argumentation',
    'parliamentary debate'
  ],
  sports_event: [
    'sports', 'tournament', 'match', 'game', 'athletics',
    'marathon', 'run', 'race', 'cricket', 'football', 'basketball',
    'volleyball', 'badminton', 'tennis'
  ],
  sports_day: [
    'sports day', 'annual sports', 'athletic meet', 'sports fest'
  ],

  // ============================================================
  // CELEBRATION EVENTS (10 types)
  // ============================================================
  celebration: [
    'celebration', 'party', 'anniversary', 'milestone',
    'jubilee', 'gala'
  ],
  cultural_event: [
    'cultural', 'dance', 'music concert', 'performance',
    'classical', 'folk', 'traditional', 'art show'
  ],
  annual_day: [
    'annual day', 'annual function', 'founders day',
    'anniversary celebration'
  ],
  freshers_day: [
    'freshers', 'fresher party', 'welcome party',
    'new student', 'freshman'
  ],
  farewell: [
    'farewell', 'send-off', 'goodbye', 'adieu',
    'graduation party'
  ],
  alumni_meet: [
    'alumni', 'reunion', 'batch meet', 'homecoming',
    'old students'
  ],
  reunion: [
    'reunion', 'get-together', 'meetup old friends'
  ],
  tech_fest: [
    'tech fest', 'technical festival', 'techno', 'engineering fest',
    'robotics', 'innovation fest'
  ],
  cultural_fest: [
    'cultural fest', 'cultural festival', 'fest', 'carnival'
  ],
  festival: [
    'festival', 'diwali', 'christmas', 'pongal', 'eid', 'holi',
    'navratri', 'durga puja', 'onam', 'baisakhi', 'lohri',
    'ganesh chaturthi', 'new year', 'thanksgiving'
  ],

  // ============================================================
  // CORPORATE EVENTS (9 types)
  // ============================================================
  meetup: [
    'meetup', 'networking', 'connect session', 'mixer',
    'networking event', 'professional meetup'
  ],
  exhibition: [
    'exhibition', 'expo', 'trade show', 'display',
    'showcase', 'fair'
  ],
  product_launch: [
    'launch', 'unveiling', 'release', 'product reveal',
    'new product', 'introduction'
  ],
  town_hall: [
    'town hall', 'all hands', 'company meeting',
    'employee meeting', 'staff meeting'
  ],
  award_ceremony: [
    'award', 'recognition', 'appreciation', 'excellence award',
    'best performer', 'achievement'
  ],
  networking: [
    'networking event', 'business networking', 'professional networking',
    'industry connect'
  ],
  panel_discussion: [
    'panel', 'panel discussion', 'expert panel', 'roundtable',
    'discussion forum'
  ],
  inauguration: [
    'inauguration', 'opening ceremony', 'ribbon cutting',
    'foundation stone', 'grand opening', 'launch ceremony'
  ],
  foundation_day: [
    'foundation day', 'establishment day', 'anniversary',
    'founding day'
  ],

  // ============================================================
  // COMMUNITY EVENTS (5 types)
  // ============================================================
  blood_donation: [
    'blood donation', 'blood camp', 'donate blood', 'blood drive',
    'blood bank', 'life saving'
  ],
  health_camp: [
    'health camp', 'medical camp', 'checkup', 'screening',
    'health check', 'wellness camp', 'eye camp', 'dental camp',
    'vaccination', 'immunization'
  ],
  csr_activity: [
    'csr', 'corporate social', 'community service',
    'social responsibility', 'give back'
  ],
  awareness_program: [
    'awareness', 'campaign', 'drive', 'sensitization',
    'education program', 'outreach'
  ],
  charity_event: [
    'charity', 'fundraiser', 'donation drive', 'philanthropy',
    'cause', 'ngo event'
  ],

  // ============================================================
  // NATIONAL EVENTS (4 types)
  // ============================================================
  independence_day: [
    'independence day', 'august 15', '15th august', 'freedom day',
    'national day', 'patriotic'
  ],
  republic_day: [
    'republic day', 'january 26', '26th january', 'constitution day'
  ],
  teachers_day: [
    'teachers day', 'september 5', 'guru', 'educator day'
  ],
  memorial: [
    'memorial', 'tribute', 'remembrance', 'homage',
    'commemoration', 'martyr'
  ],
}

/**
 * Secondary context keywords that enhance the primary event type
 * These add modifiers like "tech", "business", "corporate" to the context
 */
const CONTEXT_MODIFIERS: Record<string, string[]> = {
  tech: [
    'ai', 'artificial intelligence', 'machine learning', 'ml',
    'data science', 'technology', 'tech', 'software', 'coding',
    'programming', 'developer', 'digital', 'cyber', 'blockchain',
    'cloud', 'automation', 'robotics', 'iot', 'internet of things'
  ],
  business: [
    'business', 'corporate', 'enterprise', 'startup', 'entrepreneur',
    'leadership', 'management', 'marketing', 'sales', 'finance',
    'investment', 'growth', 'strategy', 'commerce', 'b2b', 'b2c'
  ],
  education: [
    'education', 'academic', 'learning', 'student', 'school',
    'college', 'university', 'institute', 'faculty', 'curriculum'
  ],
  healthcare: [
    'health', 'medical', 'hospital', 'doctor', 'nurse', 'patient',
    'wellness', 'fitness', 'yoga', 'mental health', 'therapy'
  ],
  creative: [
    'creative', 'design', 'art', 'photography', 'music', 'film',
    'media', 'content', 'writing', 'illustration'
  ],
}

// ============================================================
// MAIN INFERENCE FUNCTION
// ============================================================

/**
 * Infer event type from flyer content
 *
 * @param title - Flyer title (weighted higher)
 * @param description - Optional flyer description
 * @param venue - Optional venue information
 * @returns InferredEventContext with event type, confidence, and matched keywords
 */
export function inferEventTypeFromContent(
  title: string,
  description?: string,
  venue?: string
): InferredEventContext {
  // Combine all text, normalize to lowercase
  const titleLower = title.toLowerCase()
  const descLower = (description || '').toLowerCase()
  const venueLower = (venue || '').toLowerCase()
  const allText = `${titleLower} ${descLower} ${venueLower}`

  let bestMatch: {
    type: string
    keywords: string[]
    score: number
  } | null = null

  // Search through all event types
  for (const [eventType, keywords] of Object.entries(EVENT_TYPE_KEYWORDS)) {
    const matchedKeywords: string[] = []
    let score = 0

    for (const keyword of keywords) {
      const keywordLower = keyword.toLowerCase()

      // Check title (weighted 3x)
      if (titleLower.includes(keywordLower)) {
        matchedKeywords.push(keyword)
        score += 3
      }
      // Check description (weighted 1x)
      else if (descLower.includes(keywordLower)) {
        matchedKeywords.push(keyword)
        score += 1
      }
      // Check venue (weighted 0.5x)
      else if (venueLower.includes(keywordLower)) {
        matchedKeywords.push(keyword)
        score += 0.5
      }
    }

    // Update best match if this score is higher
    if (score > 0 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = {
        type: eventType,
        keywords: matchedKeywords,
        score,
      }
    }
  }

  // Determine secondary context modifier
  let secondaryType: string | undefined
  for (const [modifier, keywords] of Object.entries(CONTEXT_MODIFIERS)) {
    for (const keyword of keywords) {
      if (allText.includes(keyword.toLowerCase())) {
        secondaryType = modifier
        break
      }
    }
    if (secondaryType) break
  }

  // No match found
  if (!bestMatch) {
    return {
      eventType: null,
      confidence: 'low',
      matchedKeywords: [],
      secondaryType,
    }
  }

  // Determine confidence based on score
  let confidence: 'high' | 'medium' | 'low'
  if (bestMatch.score >= 6) {
    confidence = 'high'
  } else if (bestMatch.score >= 3) {
    confidence = 'medium'
  } else {
    confidence = 'low'
  }

  return {
    eventType: bestMatch.type,
    confidence,
    matchedKeywords: bestMatch.keywords,
    secondaryType,
  }
}

/**
 * Get a human-readable event type label
 */
export function getEventTypeLabel(eventType: string): string {
  const labels: Record<string, string> = {
    seminar: 'Seminar',
    workshop: 'Workshop',
    conference: 'Conference',
    guest_lecture: 'Guest Lecture',
    webinar: 'Webinar',
    industrial_visit: 'Industrial Visit',
    orientation: 'Orientation',
    convocation: 'Convocation',
    placement_drive: 'Placement Drive',
    science_fair: 'Science Fair',
    training: 'Training',
    competition: 'Competition',
    hackathon: 'Hackathon',
    quiz: 'Quiz',
    debate: 'Debate',
    sports_event: 'Sports Event',
    sports_day: 'Sports Day',
    celebration: 'Celebration',
    cultural_event: 'Cultural Event',
    annual_day: 'Annual Day',
    freshers_day: 'Freshers Day',
    farewell: 'Farewell',
    alumni_meet: 'Alumni Meet',
    reunion: 'Reunion',
    tech_fest: 'Tech Fest',
    cultural_fest: 'Cultural Fest',
    festival: 'Festival',
    meetup: 'Meetup',
    exhibition: 'Exhibition',
    product_launch: 'Product Launch',
    town_hall: 'Town Hall',
    award_ceremony: 'Award Ceremony',
    networking: 'Networking',
    panel_discussion: 'Panel Discussion',
    inauguration: 'Inauguration',
    foundation_day: 'Foundation Day',
    blood_donation: 'Blood Donation',
    health_camp: 'Health Camp',
    csr_activity: 'CSR Activity',
    awareness_program: 'Awareness Program',
    charity_event: 'Charity Event',
    independence_day: 'Independence Day',
    republic_day: 'Republic Day',
    teachers_day: 'Teachers Day',
    memorial: 'Memorial',
  }
  return labels[eventType] || eventType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}
