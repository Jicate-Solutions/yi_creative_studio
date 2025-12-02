'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Palette, Wand2, Droplets } from 'lucide-react'
import { ThemeTab } from './theme-tab'
import { StyleTab } from './style-tab'
import { ColorTab } from './color-tab'
import type { DesignData, CustomColors } from '@/lib/config/design-constants'

interface BrandColors {
  primary_color?: string | null
  secondary_color?: string | null
  accent_color?: string | null
}

interface DesignTabProps {
  designData: DesignData
  onThemeChange: (theme: string) => void
  onStyleChange: (style: string) => void
  onToggleBrandColors: (enabled: boolean) => void
  onSelectPalette: (paletteId: string | null) => void
  onCustomColorChange: (colors: CustomColors) => void
  brandColors?: BrandColors
  eventType?: string
}

export function DesignTab({
  designData,
  onThemeChange,
  onStyleChange,
  onToggleBrandColors,
  onSelectPalette,
  onCustomColorChange,
  brandColors,
  eventType,
}: DesignTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Design Options</CardTitle>
        <CardDescription>
          Customize the look and feel of your poster
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="theme" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="theme" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              <span className="hidden sm:inline">Theme</span>
            </TabsTrigger>
            <TabsTrigger value="style" className="flex items-center gap-2">
              <Wand2 className="h-4 w-4" />
              <span className="hidden sm:inline">Style</span>
            </TabsTrigger>
            <TabsTrigger value="colors" className="flex items-center gap-2">
              <Droplets className="h-4 w-4" />
              <span className="hidden sm:inline">Colors</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="theme">
            <ThemeTab
              selectedTheme={designData.theme}
              onThemeChange={onThemeChange}
              eventType={eventType}
            />
          </TabsContent>

          <TabsContent value="style">
            <StyleTab
              selectedStyle={designData.style}
              onStyleChange={onStyleChange}
            />
          </TabsContent>

          <TabsContent value="colors">
            <ColorTab
              colorConfig={designData.colorConfig}
              brandColors={brandColors}
              onToggleBrandColors={onToggleBrandColors}
              onSelectPalette={onSelectPalette}
              onCustomColorChange={onCustomColorChange}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
