/**
 * Type definitions for Yi CreativeStudio Prompt Builder
 * Following Gemini API best practices with XML-structured prompts
 */

// ============================================================
// STRUCTURED PROMPT TYPES
// ============================================================

export interface TextElement {
  role: 'headline' | 'subheadline' | 'body' | 'cta' | 'date' | 'time' | 'venue' | 'name' | 'title' | 'description' | 'speaker' | 'price' | 'contact' | 'reference' | 'preface' | 'signatory' | 'hook' | 'supporting' | 'insight' | 'value' | 'company' | 'offer' | 'note'
  text: string
  prominence: 'largest' | 'prominent' | 'medium' | 'small'
  style?: string
}

export interface StyleConfig {
  visualStyle: string
  colorPalette: string
  mood: string
  typography?: string
  decoration?: string
  references?: string[]
}

export interface FewShotExample {
  description: string
  quality: 'good' | 'avoid'
}

export interface StructuredPrompt {
  format: string
  aspectRatio: string
  subject: string
  composition: string
  textContent: TextElement[]
  style: StyleConfig
  constraints: string[]
  qualityMarkers?: string[]
  examples?: FewShotExample[]
  brandContext?: BrandContextPrompt
  verticalContext?: VerticalContext
}

export interface BrandContextPrompt {
  organizationName: string
  primaryColor?: string
  secondaryColor?: string
  accentColor?: string
  fontPreference?: string
  brandName?: string
  logoPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center-top'
  // Flag to indicate if brand colors should be applied (default: false)
  useBrandColors?: boolean
  // Flag to indicate if brand font should be applied (default: true)
  useBrandFont?: boolean
  // NEW v3.10: Track color source for debugging and enforcement levels
  colorSource?: 'brand' | 'preset' | 'custom' | 'fallback'
}

// ============================================================
// LOGO AWARENESS TYPES (v3.0)
// ============================================================

export type LogoPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center-top'
export type LogoSize = 'small' | 'medium' | 'large'

export interface LogoPlacement {
  position: LogoPosition
  size: LogoSize
}

export interface LogoAwarenessContext {
  hasLogo: boolean
  // Primary logo position (backward compatible)
  logoPosition: LogoPosition
  logoSize: LogoSize
  clearZone?: string
  // Multi-logo support (v3.0)
  logos?: LogoPlacement[]
}

// ============================================================
// ENHANCED BUILD OPTIONS (v3.1 - Form Data Completeness)
// ============================================================

/**
 * Speaker photo configuration for overlay zones
 * Used to reserve space in generated images for speaker photo overlays
 */
export interface SpeakerPhotoConfig {
  enabled: boolean
  position?: 'left' | 'right' | 'center'
  /** v24.12: Vertical position for speaker photo overlay */
  verticalPosition?: 'top' | 'upper' | 'middle' | 'lower' | 'bottom'
  size?: 'small' | 'medium' | 'large'
  /** v24.11: Numeric size in pixels from slider (100-400px) - takes precedence over categorical size */
  numericSize?: number
  shape?: 'circle' | 'rounded' | 'square'
  /**
   * Indicates if user has uploaded their own photo
   * - true: Photo will be overlaid via post-processing (keep zone clean)
   * - false/undefined: Placeholder zone only (no photo yet, create clean placeholder)
   */
  hasUserPhoto?: boolean
  /**
   * Multi-speaker support (v3.5)
   * Indicates whether this is single speaker or multi-speaker format
   */
  isSingleSpeaker?: boolean
  /**
   * Number of speakers with photos (for multi-speaker layouts)
   * Used to reserve appropriate space for multiple speaker photos
   */
  speakerCount?: number
}

/**
 * Layout zone configuration for header/footer overlays
 */
export interface LayoutZoneConfig {
  headerHeight?: number  // Percentage of height reserved for header
  footerHeight?: number  // Percentage of height reserved for footer
}

/**
 * Organization context for branding
 */
export interface OrganizationContext {
  name: string
  tagline?: string
  industry?: string
}

/**
 * Typography guidance from AI design analysis
 */
export interface TypographyGuidance {
  headlineStyle?: string
  bodyStyle?: string
  hierarchy?: string
  // v4.2: Explicit font category and alignment
  typographyStyle?: 'serif' | 'sans' | 'slab' | 'mono' | 'script' | 'display'
  alignment?: 'center' | 'left' | 'right' | 'asymmetric'
  // v3.9: Role-based color mapping for multi-color typography
  colorMapping?: {
    hero: { color: string; contrastRatio: number; description: string }
    headline: { color: string; contrastRatio: number; description: string }
    body: { color: string; contrastRatio: number; description: string }
    cta: { color: string; contrastRatio: number; description: string }
    caption: { color: string; contrastRatio: number; description: string }
  }
}

/**
 * Decorative elements guidance from AI design analysis
 */
export interface DecorativeElements {
  corners?: string
  patterns?: string
  accents?: string
}

/**
 * Input for brief analysis
 */
export interface BriefAnalysisInput {
  title: string
  description?: string
  venue?: string
  additionalContext?: string
  theme?: string // NEW v5.5: Allow fallback to respect user theme
}

/**
 * Design context from Design Intelligence stage
 * Contains AI-generated visual elements and mood for the creative
 */
export type DesignContext = DesignContextForPrompt;

export interface DesignContextForPrompt {
  corePurpose?: string
  desiredAction?: string           // Specific action viewers should take
  visualElements?: string[]
  backgroundSetting?: string
  iconicImagery?: string[]
  colorStrategy?: string
  moodDirection?: string
  vibeKeywords?: string[]          // Vibe/energy keywords for dynamic prompts
  // v3.5: Extended design context for event posters
  creativeTwist?: string
  colorMood?: string
  designStrategy: string           // Strategic visual approach
  successMetric?: string           // What viewer thinks in 3 seconds
  layoutGuidance?: string          // Visual composition guidanc
  layoutSuggestion?: string        // Specific layout recommendation from agent
  decorativeElements?: {           // Recommended decorative elements
    corners?: string
    patterns?: string
    accents?: string
  }
  typographyGuidance?: {           // Typography strategy
    headlineStyle: string
    bodyStyle: string
    typographyStyle: string
    alignment: string
    hierarchy: string
    colorMapping?: Record<string, any>
  }
  emotionalJob?: string            // How viewer should feel
  // v4.2: Story-driven design intelligence
  storyAnalysis?: import('../../knowledge-base/design-architecture/types').StoryAnalysis
  vibeAndMood?: import('../../knowledge-base/design-architecture/types').VibeAndMood
  typographyStrategy?: import('../../knowledge-base/design-architecture/types').TypographyStrategy
  colorStorytelling?: import('../../knowledge-base/design-architecture/types').ColorStorytelling
  backgroundTreatment?: import('../../knowledge-base/design-architecture/types').BackgroundTreatment
  decorativeElementsContext?: import('../../knowledge-base/design-architecture/types').DecorativeElementsContext
  decorativeStrategy?: {
    thematicSymbols: string[]
    placementReasoning: string
    opacityStrategy: string
  }
  layoutNarrative?: import('../../knowledge-base/design-architecture/types').LayoutNarrative
  overallDesignStrategy?: string // 2-3 sentences summarizing how all elements work together
  // v6.0 Phase 3: Custom theme narrative for AI-generated themes
  customThemeNarrative?: {
    themeName: string              // Unique 2-4 word theme name
    themeDescription: string       // One sentence description
    visualLanguage: string         // Specific visual language and aesthetic
    moodKeywords: string[]         // 3-4 mood keywords
  }
  // v26.0: Storytelling fusion context
  // Unifies multiple event analyzers into cohesive visual narrative
  storytellingContext?: import('../../services/storytelling-fusion').StorytellingOutput
}

/**
 * Footer contact information for creative footers (v3.4)
 * Contains effective values (custom per-creative OR brand defaults)
 */
export interface FooterContactContext {
  website?: string
  phone?: string
  email?: string
  address?: string
  social?: {
    instagram?: string
    linkedin?: string
    facebook?: string
    twitter?: string
  } | null
}

/**
 * Logo Strip Zone Coordinates (v7.0, enhanced v13.0)
 * Tells AI to reserve space for logo strips with color contrast awareness
 */
export interface LogoStripZoneCoordinates {
  // Header strip zone (ROW 1 + ROW 2 + ROW 3)
  headerHeight: number          // Total pixel height reserved for header strip
  headerReservePercent: number  // Percentage of canvas height (0-100)
  // Footer strip zone (ROW 4 - Footer Bar)
  footerHeight: number          // Pixel height reserved for footer bar
  footerReservePercent: number  // Percentage of canvas height (0-100)
  // Active rows for context
  activeRows: {
    brand: boolean      // ROW 1 - Brand logos
    vertical: boolean   // ROW 2 - Program logos
    initiative: boolean // ROW 3 - Chapter text
    footer: boolean     // ROW 4 - Footer bar
  }
  // v13.0: Initiative text color contrast info for AI
  initiativeColorInfo?: {
    color: string                                  // Initiative text color (hex)
    adjustedColor: string                          // Auto-adjusted color for visibility (if needed)
    contrastRatio: number                          // Contrast ratio (1:1 to 21:1)
    needsAdjustment: boolean                       // Whether background needs adjustment
    recommendedBgTone: 'light' | 'dark' | 'medium' // Recommended background tone
  }
}

export interface EnhancedBuildOptions {
  // Existing fields
  verticalId?: string
  engine?: 'yi_vision' | 'yi_craft'
  language?: 'en' | 'ta' | 'hi'
  brandContext?: BrandContextPrompt
  logoAwareness?: LogoAwarenessContext
  resolution?: '1K' | '2K' | '4K'
  templateMode?: boolean

  // NEW v5.5: Resolved colors from color resolution pipeline
  // Ensures user-selected colors flow through without being overridden
  resolvedColors?: import('@/lib/utils/resolve-color-config').ResolvedColors

  // NEW v3.1: Previously lost data now properly passed
  theme?: string                        // User's selected theme (professional, creative, elegant, etc.)
  style?: string                        // Design style preference
  layout?: LayoutZoneConfig             // Layout zone configuration
  speakerPhotoConfig?: SpeakerPhotoConfig  // Speaker photo settings for zone reservation
  organizationContext?: OrganizationContext // Organization branding context
  contentType?: string                  // Format-specific content type (e.g., LinkedIn article/announcement)
  formatSize?: string                   // Format-specific size (e.g., A4/A5 for flyers, banner sizes)

  // NEW v3.2: Design context for decorative elements injection
  designContext?: DesignContextForPrompt  // AI-generated visual context from Design Intelligence

  // NEW v3.4: Footer contact information for creative footers
  footerContext?: FooterContactContext  // Contact details for footer (custom per-creative OR brand defaults)

  // NEW v4.0: Prevention enhancements from Feedback Learning Agent
  // Contains learned prompt improvements based on past user feedback
  preventionEnhancements?: string[]

  // NEW v4.1: Text styling and layout configurations
  // Text alignment controls for headlines vs details differentiation
  textAlignment?: import('./types/layout-styling').TextAlignmentMap
  // Text shadow for white text legibility on photos/gradients
  textShadow?: import('./types/layout-styling').TextShadowConfig
  // Header logo band for Yi triple-logo layout (Yi, Bharat Rising, CII)
  headerLogoBand?: import('./types/layout-styling').HeaderLogoBandConfig
  // Logo strip mode (v5.1: User-controlled visual strips for logo areas)
  logoStripMode?: {
    enabled: boolean
    rows: ('header' | 'middle' | 'footer')[]
    opacity?: number
    logoBound?: boolean
  }
  // Footer style for standardized Yi footer (skyline, contact, partner)
  footerStyle?: import('./types/layout-styling').FooterStyleConfig
  // Event details card for structured date/time/venue display
  eventDetailsCard?: import('./types/layout-styling').EventDetailsCardConfig

  // NEW v4.4: ULTRA-PRO CONTEXT (The Missing Link)
  // Direct pipe from Stage 0.5 Claude analysis to Stage 2 Image Generation
  ultraProContext?: {
    visualScene?: string
    designGuidance?: string
    primaryText?: string
    secondaryText?: string[]
    textPlacementHints?: string
    colorPaletteHints?: string
    mustIncludeElements?: string[]
    enhancedPrompt?: string
  }

  // NEW v5.0: Multi-Color Typography System
  // Role-based color configuration for different text elements (hero, headline, body, CTA, etc.)
  // Supports solid colors and gradients with WCAG accessibility validation
  multiColorTypography?: import('@/lib/config/design-constants').MultiColorTypographyConfig

  // NEW v6.5: Pre-calculated speaker photo zone coordinates
  // Enables coordination between Gemini prompt generation and Sharp overlay positioning
  // Contains exact pixel coordinates to prevent text/photo overlaps
  speakerPhotoZoneCoordinates?: {
    x: number
    y: number
    width: number
    height: number
    topEdge: number
    bottomEdge: number
    leftEdge: number
    rightEdge: number
  }

  // NEW v7.1: Speaker Layout Agent context
  // AI-analyzed layout decision for speaker photos based on TOTAL speakers (not just those with photos)
  // Prevents oversized photos when only some speakers have uploaded photos
  speakerLayoutContext?: string

  // NEW v7.0: Logo Strip Zone Coordinates for 4-Row Enhanced Strip (v13.0: Now with color contrast)
  // Tells Gemini AI to reserve space for logo strips (header and footer)
  // This prevents text/content from overlapping with logo overlay areas
  logoStripZoneCoordinates?: LogoStripZoneCoordinates
}

// ============================================================
// VERTICAL CONTEXT TYPES
// ============================================================

export interface VerticalContext {
  verticalId: string
  name: string
  additionalContext: string
  colorPreferences: string
  imageryGuidance: string
  avoidance: string
}

// ============================================================
// FORMAT-SPECIFIC FORM DATA TYPES
// ============================================================

export interface CertificateFormData {
  certificateTitle?: string
  recipientName: string
  achievementDescription?: string
  issuingAuthority?: string
  signatoryName?: string
  signatoryDesignation?: string
  signatoryName2?: string
  signatoryDesignation2?: string
  dateIssued?: string
  certificateNumber?: string
  style?: 'classic' | 'modern' | 'corporate' | 'academic'
  eventNote?: string
}

export interface EventPosterFormData {
  eventName: string
  eventDescription?: string
  eventDate?: string
  eventTime?: string
  eventEndTime?: string
  venue?: string
  speakerName?: string
  speakerDesignation?: string
  entryFee?: string
  registrationInfo?: string
  eventType: string  // Mandatory for context lookup
  targetAudience?: string
  eventNote?: string
  // NEW v4.0: Explicit design intensity controls
  sophistication?: 'minimalist' | 'balanced' | 'rich'
  creativeFidelity?: 'high' | 'standard' | 'artistic'
}

export interface InstagramFormData {
  postTitle: string
  postCaption?: string
  callToAction?: string
  postType?: 'announcement' | 'quote' | 'educational' | 'promotional' | 'motivational'
  eventNote?: string
}

export interface StoryFormData {
  storyHeadline: string
  callToAction?: string
  backgroundStyle?: string
  colorScheme?: string
  platform?: 'instagram' | 'whatsapp'
  eventNote?: string
}

export interface YouTubeThumbnailFormData {
  videoTitle: string
  hookText?: string
  hasFace?: boolean
  expression?: 'excited' | 'shocked' | 'serious' | 'confused' | 'curious'
  mainSubject?: string
  backgroundColor?: string
  textColor?: string
  accentColor?: string
  eventNote?: string
}

export interface LinkedInFormData {
  headline: string
  keyInsight?: string
  professionalMessage?: string
  contentType?: string
  backgroundStyle?: string
  colorScheme?: string
  eventNote?: string
}

export interface FlyerFormData {
  flyerTitle: string
  flyerDescription?: string
  eventDate?: string
  eventTime?: string
  eventEndTime?: string
  venue?: string
  price?: string
  callToAction?: string
  contactPhone?: string
  contactEmail?: string
  websiteUrl?: string
  size?: 'A4' | 'A5'
  backgroundStyle?: string
  colorScheme?: string
  /** Optional explicit event type (auto-inferred from title/description if not provided) */
  eventType?: string
  eventNote?: string
  customFields?: Record<string, string>
}

export interface BusinessCardFormData {
  personName: string
  jobTitle: string
  companyName?: string
  phoneNumber?: string
  emailAddress?: string
  websiteUrl?: string
  address?: string
  socialHandle?: string
  orientation?: 'horizontal' | 'vertical'
  style?: string
  backgroundStyle?: string
  colorScheme?: string
  eventNote?: string
}

export interface PresentationFormData {
  presentationTitle: string
  subtitle?: string
  presenterName?: string
  presenterTitle?: string
  eventName?: string
  presentationDate?: string
  aspectRatio?: '16:9' | '4:3'
  backgroundStyle?: string
  colorScheme?: string
  eventNote?: string
}

export interface WebBannerFormData {
  headline: string
  valueProposition?: string
  offerDetails?: string
  callToAction?: string
  size?: string
  backgroundStyle?: string
  colorScheme?: string
  eventNote?: string
}

export interface SocialPostFormData {
  postTitle: string
  postCaption?: string
  callToAction?: string
  postType?: string
  platform?: 'facebook' | 'twitter'
  eventNote?: string
}

// Generic form data type for any format
export type FormData =
  | CertificateFormData
  | EventPosterFormData
  | InstagramFormData
  | StoryFormData
  | YouTubeThumbnailFormData
  | LinkedInFormData
  | FlyerFormData
  | BusinessCardFormData
  | PresentationFormData
  | WebBannerFormData
  | SocialPostFormData
  | Record<string, unknown>

// ============================================================
// EVENT CONTEXT TYPES
// ============================================================

export interface EventContext {
  background: string
  visualElements: string
  style: string
  colors: string
  mood: string
  primaryColor: string
}

export interface InstagramContext {
  layout: string
  background: string
  visualTreatment: string
  style: string
  colors: string
  mood: string
  goal: string
}

// ============================================================
// API REQUEST TYPES
// ============================================================

export interface GeminiImageRequest {
  model: 'gemini-2.5-flash-image' | 'gemini-3.1-flash-image-preview' | 'gemini-3-pro-image-preview'
  generationConfig: {
    responseModalities: ('TEXT' | 'IMAGE')[]
    temperature?: number
    maxOutputTokens?: number
  }
  contents: Array<{
    role: 'user'
    parts: Array<{
      text: string
    }>
  }>
  systemInstruction?: {
    parts: Array<{
      text: string
    }>
  }
}

export interface YiPromptBuilderOptions {
  verticalId?: string
  engine?: 'yi_vision' | 'yi_craft'
  language?: 'en' | 'ta' | 'hi'
  brandContext?: BrandContextPrompt
}

// ============================================================
// ENGINE TYPES
// ============================================================

export type YiEngine = 'yi_vision' | 'yi_craft'

export const ENGINE_TO_MODEL: Record<YiEngine, string> = {
  yi_vision: 'gemini-2.5-flash-image',
  yi_craft: 'gemini-3-pro-image-preview',
}

export interface TokenUsage {
  inputTokens: number
  outputTokens: number
  totalTokens: number
  cachedTokens?: number
}

export interface LLMResponse {
  text: string
  tokenUsage?: TokenUsage
  model: string
  durationMs?: number
}

export interface DesignIntelligenceResponse extends DesignContext {
  rawResponse?: string
  tokenUsage?: TokenUsage
  provider: 'gemini' | 'claude'
  _meta?: {
    model: string
    durationMs: number
    tokens?: TokenUsage
  }
}

export interface DesignBrief {
  eventType?: string
  eventName: string
  organizationName?: string
  details?: string
  theme?: string
  style?: string
  guestName?: string
  guestDesignation?: string
  venue?: string
  additionalContext?: string
  brandContext?: {
    organizationName: string
    primaryColor?: string
    secondaryColor?: string
    accentColor?: string
    fontPreference?: string
    useBrandColors?: boolean
    useBrandFont?: boolean
    colorSource?: string
  }
  formatId?: string
  formatName?: string
  formatCategory?: string
  formatGuidance?: string
  hasSpeakerPhoto?: boolean
  speakerPhotoPosition?: string
  speakerPhotoShape?: string
  speakerPhotoSize?: string
  hasHeaderLogo?: boolean
  headerHeight?: number
  hasFooterLogo?: boolean
  footerHeight?: number
  logoSafeZoneGuidance?: string
  requestCustomTheme?: boolean  // v6.0 Phase 3: Request AI to generate custom theme instead of using predefined themes

  // v1.0: Additional fields for AI Event Context Analyzer (global event understanding)
  date?: string
  time?: string
  verticalName?: string
  initiativeText?: string
  targetAudience?: string
  additionalVisualBrief?: string // Free-text user visual direction injected into visualScene
}

export interface DesignIntelligenceResult {
  context: DesignContext
  usage: {
    model: string
    provider: 'gemini' | 'claude'
    tokenUsage: TokenUsage
    durationMs: number
  }
}

// ============================================================
// STORYTELLING FUSION TYPES (v26.0)
// ============================================================

export interface StorytellingOutput {
  visualNarrative: string
  storyArc: {
    opening: string
    climax: string
    resolution: string
  }
  cohesiveElements: {
    primaryElement: string
    supportingElements: string[]
    atmosphericElements: string[]
  }
  elementCohesion: Array<{
    element: string
    storyRole: 'hero' | 'support' | 'atmosphere'
    reasoning: string
    visualConnection: string
  }>
  narrativeConfidence: number
  geminiStoryBrief: string
}
