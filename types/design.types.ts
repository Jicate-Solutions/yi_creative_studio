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
export type CreationMode = 'template' | 'scratch' | string

// Badge variant types for mode selector
export type ModeBadgeVariant = 'success' | 'info' | 'warning' | 'gold' | 'default'

// Mode configuration for scalable mode selector
export interface ModeConfig {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  badge?: {
    text: string
    variant: ModeBadgeVariant
  }
  description: string
  workflow: string
  features: Array<{
    text: string
    variant?: string
  }>
}

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
