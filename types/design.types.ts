// Design Types for Yi Creatives Studio
// Re-export from design-constants for convenience

export type {
  AspectRatioId,
  ResolutionId,
  ThemeCategoryId,
  ColorTendency,
  Theme,
  ThemeCategory,
  ThemeSlug,
  PosterStyle,
  StyleSlug,
  TitlePosition,
  TitleAlignment,
  FontWeight,
  BackgroundType,
  PhotoShape,
  PhotoPosition,
  FooterStyle,
  TitleCustomization,
  BackgroundCustomization,
  SpeakerPhotoCustomization,
  FooterCustomization,
  CustomizationData,
  ColorMode,
  FileFormat,
  DPI,
  ExportSettings,
  DesignData,
} from '@/lib/config/design-constants'

// Creation mode type
export type CreationMode = 'template' | 'scratch'

// Event details for prompt generation
export interface EventDetails {
  title: string
  eventType?: string
  date?: string
  time?: string
  venue?: string
  speaker?: string
  speakerDesignation?: string
  description?: string
  additionalText?: string
}
