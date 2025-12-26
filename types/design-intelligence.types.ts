/**
 * Design Intelligence Types
 * Type definitions for AI-powered typography and design analysis
 */

import type { StyleArchetype } from '@/lib/ai/design-intelligence'

/**
 * Design Intelligence Analysis Result
 */
export interface DesignIntelligence {
  analysis: AnalysisResult & {
    confidence: number
    script: string
  }
  typography: TypographyGuidance
  timestamp: number
  source: 'ai' | 'fallback'
}

/**
 * Analysis Result from AI
 */
export interface AnalysisResult {
  styleArchetype: StyleArchetype
  reasoning: string
  toneAttributes: {
    formality: 'high' | 'medium' | 'low'
    energy: 'calm' | 'moderate' | 'high'
    creativity: 'conservative' | 'balanced' | 'expressive'
  }
  audienceProfile: 'corporate' | 'youth' | 'academic' | 'general' | 'children'
  textHierarchy: {
    primaryEmphasis: string
    emphasisLevel: 'subtle' | 'moderate' | 'strong'
  }
}

/**
 * Typography Configuration
 */
export interface TypographyConfig {
  headline: {
    font: string
    size: number
    weight: string
    letterSpacing: string
    textTransform: string
    alignment: string
  }
  body: {
    font: string
    size: number
    weight: string
    lineHeight: number
  }
  accent: {
    font: string
    size: number
    weight: string
    style?: string
  }
}

/**
 * Typography Guidance with Prompt Context
 */
export interface TypographyGuidance {
  config: TypographyConfig
  promptGuidance: string
  reasoning: string
  styleArchetype: StyleArchetype
  script: string
}

/**
 * API Request/Response Types
 */
export interface DesignIntelligenceRequest {
  eventData: Record<string, any>
  languageCode?: string
  formatId?: string
}

export interface DesignIntelligenceResponse {
  success: boolean
  data?: DesignIntelligence
  error?: {
    code: string
    message: string
  }
}

/**
 * UI Component Props
 */
export interface AIAnalyzeButtonProps {
  eventData: Record<string, any>
  languageCode: string
  formatId: string
  onAnalysisComplete: (intelligence: DesignIntelligence) => void
  disabled?: boolean
}

export interface DesignPreviewCardProps {
  intelligence: DesignIntelligence | null
  isLoading: boolean
  onApply: () => void
  onDismiss: () => void
}

export interface TypographySectionProps {
  typographyConfig: TypographyConfig | null
  intelligence: DesignIntelligence | null
  onUpdate: (config: Partial<TypographyConfig>) => void
  languageCode: string
}
