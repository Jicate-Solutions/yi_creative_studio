'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ThemeSection } from './theme-section'
import { ColorSection } from './color-section'
import { StyleSection } from './style-section'
import { QualitySection } from './quality-section'
import { useAIDesignSuggestions } from '@/hooks/use-ai-design-suggestions'
import type { DesignData, CustomColors, ResolutionId } from '@/lib/config/design-constants'

interface BrandColors {
  primary_color?: string | null
  secondary_color?: string | null
  accent_color?: string | null
}

interface StylingStepProps {
  designData: DesignData
  onThemeChange: (theme: string) => void
  onStyleChange: (style: string) => void
  onResolutionChange: (resolution: ResolutionId) => void
  onToggleBrandColors: (enabled: boolean) => void
  onSelectPalette: (paletteId: string | null) => void
  onCustomColorChange: (colors: CustomColors) => void
  brandColors?: BrandColors
}

export function StylingStep({
  designData,
  onThemeChange,
  onStyleChange,
  onResolutionChange,
  onToggleBrandColors,
  onSelectPalette,
  onCustomColorChange,
  brandColors,
}: StylingStepProps) {
  // AI Design Suggestions hook - reads eventType/eventName from store internally
  const aiSuggestions = useAIDesignSuggestions()

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-4">
        <div>
          <CardTitle>Styling</CardTitle>
          <CardDescription>Customize the look and feel of your design</CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Accordion Sections */}
        <div className="space-y-3">
          {/* Theme Section */}
          <ThemeSection
            selectedTheme={designData.theme}
            onThemeChange={onThemeChange}
            aiSuggestions={aiSuggestions.theme.suggestions}
            defaultOpen={true}
          />

          {/* Color Section */}
          <ColorSection
            colorConfig={designData.colorConfig}
            brandColors={brandColors}
            onToggleBrandColors={onToggleBrandColors}
            onSelectPalette={onSelectPalette}
            onCustomColorChange={onCustomColorChange}
            colorMood={aiSuggestions.color.colorMood}
            defaultOpen={false}
          />

          {/* Style Section */}
          <StyleSection
            selectedStyle={designData.style}
            onStyleChange={onStyleChange}
            aiSuggestions={aiSuggestions.style.suggestions}
            defaultOpen={false}
          />

          {/* Quality Section */}
          <QualitySection
            selectedResolution={designData.resolution}
            onResolutionChange={onResolutionChange}
            aspectRatio={designData.aspectRatio}
            defaultOpen={false}
          />
        </div>
      </CardContent>
    </Card>
  )
}
