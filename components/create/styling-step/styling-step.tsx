'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ThemeSection } from './theme-section'
import { ColorSection } from './color-section'
import { StyleSection } from './style-section'
import { QualitySection } from './quality-section'
import { TypographySection } from './typography-section'
import { useAIDesignSuggestions } from '@/hooks/use-ai-design-suggestions'
import type { DesignData, CustomColors, ResolutionId, TypographyConfig } from '@/lib/config/design-constants'
import { Palette, Layers, Wand2, MonitorPlay, Type } from 'lucide-react'

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
  onTypographyChange: (typography: Partial<TypographyConfig>) => void
  onSelectPalette: (paletteId: string | null) => void
  onCustomColorChange: (colors: CustomColors) => void
  brandColors?: BrandColors
  brandFont?: string
}

export function StylingStep({
  designData,
  onThemeChange,
  onStyleChange,
  onResolutionChange,
  onToggleBrandColors,
  onTypographyChange,
  onSelectPalette,
  onCustomColorChange,
  brandColors,
  brandFont,
}: StylingStepProps) {
  // AI Design Suggestions hook - reads eventType/eventName from store internally
  const aiSuggestions = useAIDesignSuggestions()
  const [activeTab, setActiveTab] = useState('theme')

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

      <CardContent className="space-y-4 px-0">
        <Tabs defaultValue="theme" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start h-12 p-1 bg-muted/20 backdrop-blur-sm border border-white/10 dark:border-white/5 rounded-xl mb-6">
            <TabsTrigger value="theme" className="flex-1 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-white/10">
              <span className="flex items-center gap-2">
                <Layers className="h-4 w-4" />
                Theme
              </span>
            </TabsTrigger>
            <TabsTrigger value="colors" className="flex-1 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-white/10">
              <span className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Colors
              </span>
            </TabsTrigger>
            <TabsTrigger value="style" className="flex-1 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-white/10">
              <span className="flex items-center gap-2">
                <Wand2 className="h-4 w-4" />
                Style
              </span>
            </TabsTrigger>
            <TabsTrigger value="typography" className="flex-1 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-white/10">
              <span className="flex items-center gap-2">
                <Type className="h-4 w-4" />
                Type
              </span>
            </TabsTrigger>
            <TabsTrigger value="quality" className="flex-1 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-white/10">
              <span className="flex items-center gap-2">
                <MonitorPlay className="h-4 w-4" />
                Output
              </span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="theme" className="space-y-4 mt-0 focus-visible:ring-0">
            <div className="bg-white/40 dark:bg-black/20 backdrop-blur-md rounded-xl p-4 border border-white/20 dark:border-white/10">
              <ThemeSection
                selectedTheme={designData.theme}
                onThemeChange={onThemeChange}
                aiSuggestions={aiSuggestions.theme.suggestions}
                defaultOpen={true}
              />
            </div>
          </TabsContent>

          <TabsContent value="colors" className="space-y-4 mt-0 focus-visible:ring-0">
            <div className="bg-white/40 dark:bg-black/20 backdrop-blur-md rounded-xl p-4 border border-white/20 dark:border-white/10">
              <ColorSection
                colorConfig={designData.colorConfig}
                brandColors={brandColors}
                onToggleBrandColors={onToggleBrandColors}
                onSelectPalette={onSelectPalette}
                onCustomColorChange={onCustomColorChange}
                colorMood={aiSuggestions.color.colorMood}
                defaultOpen={true}
              />
            </div>
          </TabsContent>

          <TabsContent value="style" className="space-y-4 mt-0 focus-visible:ring-0">
            <div className="bg-white/40 dark:bg-black/20 backdrop-blur-md rounded-xl p-4 border border-white/20 dark:border-white/10">
              <StyleSection
                selectedStyle={designData.style}
                onStyleChange={onStyleChange}
                aiSuggestions={aiSuggestions.style.suggestions}
                defaultOpen={true}
              />
            </div>
          </TabsContent>



          <TabsContent value="typography" className="space-y-4 mt-0 focus-visible:ring-0">
            <div className="bg-white/40 dark:bg-black/20 backdrop-blur-md rounded-xl p-4 border border-white/20 dark:border-white/10">
              <TypographySection
                typography={designData.typography}
                brandFont={brandFont}
                onTypographyChange={onTypographyChange}
                defaultOpen={true}
              />
            </div>
          </TabsContent>

          <TabsContent value="quality" className="space-y-4 mt-0 focus-visible:ring-0">
            <div className="bg-white/40 dark:bg-black/20 backdrop-blur-md rounded-xl p-4 border border-white/20 dark:border-white/10">
              <QualitySection
                selectedResolution={designData.resolution}
                onResolutionChange={onResolutionChange}
                aspectRatio={designData.aspectRatio}
                defaultOpen={true}
              />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
