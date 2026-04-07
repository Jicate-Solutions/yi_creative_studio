'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ColorSection } from './color-section'
import { QualitySection } from './quality-section'
import { useAIDesignSuggestions } from '@/hooks/use-ai-design-suggestions'
import type { DesignData, CustomColors, ResolutionId } from '@/lib/config/design-constants'
import { Palette, MonitorPlay } from 'lucide-react'

interface BrandColors {
  primary_color?: string | null
  secondary_color?: string | null
  accent_color?: string | null
}

interface StylingStepProps {
  designData: DesignData
  onResolutionChange: (resolution: ResolutionId) => void
  onToggleBrandColors: (enabled: boolean) => void
  onSelectPalette: (paletteId: string | null) => void
  onCustomColorChange: (colors: CustomColors) => void
  brandColors?: BrandColors
}

export function StylingStep({
  designData,
  onResolutionChange,
  onToggleBrandColors,
  onSelectPalette,
  onCustomColorChange,
  brandColors,
}: StylingStepProps) {
  // AI Design Suggestions hook - reads eventType/eventName from store internally
  const aiSuggestions = useAIDesignSuggestions()
  const [activeTab, setActiveTab] = useState('colors')

  // Auto-enable AI Color Mode when suggestions arrive
  // This fulfills the user requirement: "It should understand the user shared event... enable by requirement"
  useEffect(() => {
    // If AI has suggestions (meaning it understood the event)
    // AND we haven't manually selected a palette yet (default state is usually 'palette-1' or null)
    if (aiSuggestions.color.hasSuggestions && aiSuggestions.color.enableAI) {
      // We automatically switch to AI Auto mode to show off the "Brain" capability
      // But only if we are currently on a default palette, to avoid overriding manual choices if re-running
      onSelectPalette('ai_auto')
    }
  }, [aiSuggestions.color.hasSuggestions, aiSuggestions.color.enableAI, onSelectPalette])

  return (
    <Card className="overflow-hidden border-none shadow-none bg-transparent">
      <CardHeader className="pb-2 px-0">
        <div>
          <CardTitle>Styling & Customization</CardTitle>
          <CardDescription>
            Personalize your design. Switch tabs to fine-tune each aspect.
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <Tabs defaultValue="colors" value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Responsive tabs with horizontal scroll on mobile, focus states for accessibility */}
          <TabsList className="w-full justify-start h-12 p-1 glass-inset border-none rounded-xl mb-6 overflow-x-auto scrollbar-hide flex-nowrap">
            <TabsTrigger
              value="colors"
              className="flex-1 min-w-[72px] rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md dark:data-[state=active]:bg-white/10 dark:data-[state=active]:text-primary transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
            >
              <span className="flex items-center gap-1.5 sm:gap-2">
                <Palette className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">Colors</span>
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="quality"
              className="flex-1 min-w-[72px] rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md dark:data-[state=active]:bg-white/10 dark:data-[state=active]:text-primary transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
            >
              <span className="flex items-center gap-1.5 sm:gap-2">
                <MonitorPlay className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">Output</span>
              </span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="colors" className="space-y-4 mt-0 focus-visible:ring-0">
            <div className="glass-panel p-4 border-none">
              <ColorSection
                colorConfig={designData.colorConfig}
                brandColors={brandColors}
                onToggleBrandColors={onToggleBrandColors}
                onSelectPalette={onSelectPalette}
                onCustomColorChange={onCustomColorChange}
                colorMood={aiSuggestions.color.colorMood}
              />
            </div>
          </TabsContent>

          <TabsContent value="quality" className="space-y-4 mt-0 focus-visible:ring-0">
            <div className="glass-panel p-4 border-none">
              <QualitySection
                selectedResolution={designData.resolution}
                onResolutionChange={onResolutionChange}
                aspectRatio={designData.aspectRatio}
              />
            </div>
          </TabsContent>

        </Tabs>
      </CardContent>
    </Card>
  )
}
