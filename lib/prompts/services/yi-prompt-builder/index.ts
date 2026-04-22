/**
 * Yi Prompt Builder Module v3.0
 * Gemini-optimized XML-structured prompting system
 *
 * v3.0 Features:
 * - Logo awareness context
 * - Brand context integration
 * - Resolution/quality guidance
 * - Few-shot examples for all formats
 *
 * Based on official Gemini API documentation best practices:
 * - Describe scenes, don't list keywords
 * - Use structured XML tags for clarity
 * - Use few-shot examples when possible
 * - Keep text to 25 characters or less per element
 * - Use photographic terms for composition
 */

// Main builder class
export {
  YiPromptBuilder,
  SYSTEM_INSTRUCTION,
} from './yi-prompt-builder'

// Types
export type {
  FormData,
  GeminiImageRequest,
  YiPromptBuilderOptions,
  EnhancedBuildOptions,
  LogoAwarenessContext,
  YiEngine,
  StructuredPrompt,
  TextElement,
  StyleConfig,
  FewShotExample,
  BrandContextPrompt,
  VerticalContext,
  // Format-specific form data types
  CertificateFormData,
  EventPosterFormData,
  InstagramFormData,
  StoryFormData,
  YouTubeThumbnailFormData,
  LinkedInFormData,
  FlyerFormData,
  BusinessCardFormData,
  PresentationFormData,
  WebBannerFormData,
  SocialPostFormData,
  MemberSpotlightFormData,
  EventContext,
  InstagramContext,
} from './types'

// Context helpers (v3.0)
export {
  buildLogoContext,
  buildBrandContext,
  buildQualityContext,
  buildAllContexts,
} from './context-helpers'

// Vertical contexts
export {
  VERTICAL_CONTEXTS,
  injectVerticalContext,
  getVerticalContext,
  getAvailableVerticals,
  isValidVertical,
} from './vertical-contexts'

// Format builders (for direct access if needed)
export {
  buildCertificatePrompt,
  buildEventPosterPrompt,
  buildInstagramPrompt,
  buildYouTubeThumbnailPrompt,
  buildStoryPrompt,
  buildLinkedInPrompt,
  buildFlyerPrompt,
  buildBusinessCardPrompt,
  buildPresentationPrompt,
  buildWebBannerPrompt,
  buildSocialPostPrompt,
  buildGenericPrompt,
  buildMemberSpotlightPrompt,
} from './format-builders'

// Few-shot examples (v3.0)
export {
  CERTIFICATE_EXAMPLES,
  EVENT_POSTER_EXAMPLES,
  INSTAGRAM_POST_EXAMPLES,
  YOUTUBE_THUMBNAIL_EXAMPLES,
  LINKEDIN_POST_EXAMPLES,
  STORY_EXAMPLES,
  FLYER_EXAMPLES,
  BUSINESS_CARD_EXAMPLES,
  PRESENTATION_EXAMPLES,
  WEB_BANNER_EXAMPLES,
  getExamplesForFormat,
} from './examples'
