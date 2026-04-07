'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Droplets, Gauge } from 'lucide-react'
import { ColorTab } from './color-tab'
import { ResolutionTab } from './resolution-tab'
import { useAIDesignSuggestions } from '@/hooks/use-ai-design-suggestions'
import type { DesignData, CustomColors, ResolutionId } from '@/lib/config/design-constants'

interface BrandColors {
  primary_color?: string | null
  secondary_color?: string | null
  accent_color?: string | null
}

interface DesignTabProps {
  designData: DesignData
  onResolutionChange: (resolution: ResolutionId) => void
  onToggleBrandColors: (enabled: boolean) => void
  onSelectPalette: (paletteId: string | null) => void
  onCustomColorChange: (colors: CustomColors) => void
  brandColors?: BrandColors
}

export function DesignTab({
  designData,
  onResolutionChange,
  onToggleBrandColors,
  onSelectPalette,
  onCustomColorChange,
  brandColors,
}: DesignTabProps) {
  // AI Design Suggestions hook - reads eventType and eventName from store
  const aiSuggestions = useAIDesignSuggestions()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Design Options</CardTitle>
        <CardDescription>
          Customize the look and feel of your poster
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Tabs with per-tab AI toggles */}
        <Tabs defaultValue="colors" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="colors" className="flex items-center gap-2">
              <Droplets className="h-4 w-4" />
              <span className="hidden sm:inline">Colors</span>
            </TabsTrigger>
            <TabsTrigger value="quality" className="flex items-center gap-2">
              <Gauge className="h-4 w-4" />
              <span className="hidden sm:inline">Quality</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="colors">
            <ColorTab
              colorConfig={designData.colorConfig}
              brandColors={brandColors}
              onToggleBrandColors={onToggleBrandColors}
              onSelectPalette={onSelectPalette}
              onCustomColorChange={onCustomColorChange}
              // AI props
              enableAI={aiSuggestions.color.enableAI}
              isGenerating={aiSuggestions.color.isGenerating}
              colorMood={aiSuggestions.color.colorMood}
              aiError={aiSuggestions.color.error}
              onToggleAI={aiSuggestions.color.toggleAI}
              onRefreshAI={aiSuggestions.color.refresh}
              creativeTips={aiSuggestions.color.creativeTips}
            />
          </TabsContent>

          <TabsContent value="quality">
            <ResolutionTab
              selectedResolution={designData.resolution}
              onResolutionChange={onResolutionChange}
              aspectRatio={designData.aspectRatio}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
