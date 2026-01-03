/**
 * Layout & Styling Type Definitions for Yi Prompt Builder v4.1
 * Provides text alignment, typography effects, logo band, footer styling, and layout controls
 * Based on reference Yi event poster designs
 */

// ============================================================
// TEXT ALIGNMENT TYPES
// ============================================================

/**
 * Text alignment options for different text elements
 */
export type TextAlignment = 'center' | 'left' | 'right' | 'justify'

/**
 * Text alignment mapping for different text roles
 * Allows differentiation between centered headlines and left-aligned details
 */
export interface TextAlignmentMap {
  /** Alignment for main headlines and event titles (default: center) */
  headlines?: TextAlignment
  /** Alignment for subtitles and taglines (default: center) */
  subtitles?: TextAlignment
  /** Alignment for body text and descriptions (default: left) */
  body?: TextAlignment
  /** Alignment for event details like date, time, venue (default: left) */
  details?: TextAlignment
  /** Alignment for footer content (default: center) */
  footer?: TextAlignment
}

// ============================================================
// TEXT EFFECT TYPES
// ============================================================

/**
 * Text shadow configuration for improved legibility
 * Particularly useful for white text on photos or gradients
 */
export interface TextShadowConfig {
  /** Enable text shadows */
  enabled: boolean
  /** Which text roles should receive shadows (default: headline, subheadline) */
  roles?: Array<'headline' | 'subheadline' | 'body' | 'cta'>
  /** Shadow intensity level (default: subtle) */
  intensity?: 'subtle' | 'medium' | 'strong'
}

// ============================================================
// HEADER LOGO BAND TYPES
// ============================================================

/**
 * Header logo band configuration for Yi triple-logo layout
 * Creates white rounded rectangle container at top with Yi, Bharat Rising, CII logos
 */
export interface HeaderLogoBandConfig {
  /** Enable header logo band */
  enabled: boolean
  /** Height as percentage of total design (default: 12 single-stripe, 18 dual-stripe) */
  heightPercent?: number
  /** Background container style (default: 'white rounded rectangle container') */
  backgroundStyle?: string
  /** Logo layout description (default: 'Yi left, Bharat Rising center, CII right') */
  logoLayout?: string
  /** Include secondary logos below header (Yuva, Thalir, vertical badges) */
  secondaryLogos?: boolean
  /** Dual-stripe mode: true when both primary logos AND vertical logos present (Row 1 + Row 2) */
  dualStripeMode?: boolean
}

// ============================================================
// FOOTER STYLE TYPES
// ============================================================

/**
 * Footer section configuration (left or right)
 */
export type FooterSection = 'standard_yi' | 'custom'

/**
 * Footer style configuration for standardized Yi chapter footer
 * Creates white rounded rectangle with skyline, contact info, and partner logo
 */
export interface FooterStyleConfig {
  /** Enable footer styling */
  enabled: boolean
  /** Height as percentage of total design (default: 10) */
  heightPercent?: number
  /** Left section type (default: 'standard_yi') */
  leftSection?: FooterSection
  /** Right section type (default: 'partner_logo' or 'none') */
  rightSection?: 'partner_logo' | 'none'
  /** Yi chapter details for standard footer */
  chapterDetails?: {
    /** Chapter name (e.g., 'Kanniyakumari', 'Chennai') */
    chapterName: string
    /** Hashtag (auto-generated if not provided: #YI{CHAPTERNAME}) */
    hashtag?: string
    /** Website URL (default: www.youngindians.net) */
    website?: string
    /** Social media handle (auto-generated if not provided: @yi.{chaptername}) */
    socialHandle?: string
  }
  /** Partner branding info */
  partnerInfo?: {
    /** Partner label text (default: 'Digital Partner') */
    partnerLabel?: string
    /** Partner organization name */
    partnerName?: string
  }
}

// ============================================================
// EVENT DETAILS CARD TYPES
// ============================================================

/**
 * Event details card position options
 */
export type CardPosition = 'bottom-center' | 'bottom-left' | 'bottom-right'

/**
 * Event details card configuration
 * Creates white rounded rectangle card with date/time/venue info
 */
export interface EventDetailsCardConfig {
  /** Enable event details card */
  enabled: boolean
  /** Card position in main content zone (default: 'bottom-center') */
  position?: CardPosition
  /** Include icons for date, time, venue (default: true) */
  includeIcons?: boolean
  /** Card background color (default: 'white') */
  backgroundColor?: string
}

// ============================================================
// ROUNDED CONTAINER TYPES
// ============================================================

/**
 * Container type for rounded rectangle styling
 */
export type ContainerType = 'header' | 'footer' | 'card' | 'cta'

/**
 * Generic rounded container configuration
 * Provides reusable rounded rectangle styling guidance
 */
export interface RoundedContainerConfig {
  /** Type of container */
  type: ContainerType
  /** Background color (optional) */
  backgroundColor?: string
  /** Height as percentage of total design (optional) */
  heightPercent?: number
  /** Custom description for special cases */
  description?: string
}
