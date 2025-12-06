/**
 * Type definitions for Yi CreativeStudio Prompt Builder
 * Following Gemini API best practices with XML-structured prompts
 */

// ============================================================
// STRUCTURED PROMPT TYPES
// ============================================================

export interface TextElement {
  role: 'headline' | 'subheadline' | 'body' | 'cta' | 'date' | 'time' | 'venue' | 'name' | 'title' | 'description' | 'speaker' | 'price' | 'contact' | 'reference' | 'preface' | 'signatory' | 'hook' | 'supporting' | 'insight' | 'value' | 'company' | 'offer'
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
  size?: 'small' | 'medium' | 'large'
  shape?: 'circle' | 'rounded' | 'square'
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

export interface EnhancedBuildOptions {
  // Existing fields
  verticalId?: string
  engine?: 'yi_vision' | 'yi_craft'
  language?: 'en' | 'ta' | 'hi'
  brandContext?: BrandContextPrompt
  logoAwareness?: LogoAwarenessContext
  resolution?: '1K' | '2K' | '4K'
  templateMode?: boolean

  // NEW v3.1: Previously lost data now properly passed
  theme?: string                        // User's selected theme (professional, creative, elegant, etc.)
  style?: string                        // Design style preference
  layout?: LayoutZoneConfig             // Layout zone configuration
  speakerPhotoConfig?: SpeakerPhotoConfig  // Speaker photo settings for zone reservation
  organizationContext?: OrganizationContext // Organization branding context
  contentType?: string                  // Format-specific content type (e.g., LinkedIn article/announcement)
  formatSize?: string                   // Format-specific size (e.g., A4/A5 for flyers, banner sizes)
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
}

export interface EventPosterFormData {
  eventName: string
  eventDescription?: string
  eventDate?: string
  eventTime?: string
  venue?: string
  speakerName?: string
  speakerDesignation?: string
  entryFee?: string
  registrationInfo?: string
  eventType?: string
  targetAudience?: string
}

export interface InstagramFormData {
  postTitle: string
  postCaption?: string
  callToAction?: string
  postType?: 'announcement' | 'quote' | 'educational' | 'promotional' | 'motivational'
}

export interface StoryFormData {
  storyHeadline: string
  callToAction?: string
  backgroundStyle?: string
  colorScheme?: string
  platform?: 'instagram' | 'whatsapp'
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
}

export interface LinkedInFormData {
  headline: string
  keyInsight?: string
  professionalMessage?: string
  contentType?: string
  backgroundStyle?: string
  colorScheme?: string
}

export interface FlyerFormData {
  flyerTitle: string
  flyerDescription?: string
  eventDate?: string
  eventTime?: string
  venue?: string
  price?: string
  callToAction?: string
  contactPhone?: string
  contactEmail?: string
  websiteUrl?: string
  size?: 'A4' | 'A5'
  backgroundStyle?: string
  colorScheme?: string
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
}

export interface WebBannerFormData {
  headline: string
  valueProposition?: string
  offerDetails?: string
  callToAction?: string
  size?: string
  backgroundStyle?: string
  colorScheme?: string
}

export interface SocialPostFormData {
  postTitle: string
  postCaption?: string
  callToAction?: string
  postType?: string
  platform?: 'facebook' | 'twitter'
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
  model: 'gemini-2.5-flash-image' | 'gemini-3-pro-image-preview'
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
