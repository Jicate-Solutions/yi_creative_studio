'use client'

import { Label } from '@/components/ui/label'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { useCreativeStore } from '@/stores/creative-store'
import {
  LOGO_STRIP_SHAPES,
  type LogoStripShape,
  DEFAULT_LOGO_STRIP_SHAPE,
} from '@/lib/config/design-constants'
import { Waves, Square, Slash, RectangleEllipsis, Triangle, Focus, Blend } from 'lucide-react'

// Icon mapping for logo strip shapes
const SHAPE_ICONS: Record<LogoStripShape, React.ReactNode> = {
  rectangle: <Square className="h-3.5 w-3.5" />,
  curved: <Waves className="h-3.5 w-3.5" />,
  angled: <Slash className="h-3.5 w-3.5" />,
  rounded: <RectangleEllipsis className="h-3.5 w-3.5" />,
  tapered: <Triangle className="h-3.5 w-3.5" />,
}

export function LogoStripShapeSelector() {
  const { formData, setLogoStripShape, setLogoStripOpacity, setLogoStripLogoBound } = useCreativeStore()

  // Get current strip settings
  const currentShape = formData.designData?.stripShape || DEFAULT_LOGO_STRIP_SHAPE
  const currentOpacity = formData.logoStripMode?.opacity ?? 100
  const isLogoBound = formData.logoStripMode?.logoBound ?? false

  // Only show if strip mode is enabled
  if (!formData.logoStripMode?.enabled) {
    return null
  }

  return (
    <div className="space-y-2">
      {/* Bar Style */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Waves className="h-3.5 w-3.5 text-muted-foreground" />
          <Label className="text-xs font-medium">Bar Style</Label>
        </div>
        <ToggleGroup
          type="single"
          value={currentShape}
          onValueChange={(value) => value && setLogoStripShape(value as LogoStripShape)}
          className="gap-1"
        >
          {Object.values(LOGO_STRIP_SHAPES).map((shape) => (
            <ToggleGroupItem
              key={shape.value}
              value={shape.value}
              className="h-7 w-7 p-0 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
              title={shape.description}
            >
              {SHAPE_ICONS[shape.value]}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      {/* Bar Transparency */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Blend className="h-3.5 w-3.5 text-muted-foreground" />
          <Label className="text-xs font-medium">Transparency</Label>
        </div>
        <div className="flex items-center gap-2 flex-1 max-w-[140px]">
          <Slider
            value={[currentOpacity]}
            onValueChange={([value]) => setLogoStripOpacity(value)}
            min={10}
            max={100}
            step={5}
            className="flex-1"
          />
          <span className="text-[10px] text-muted-foreground w-8 text-right font-mono">
            {currentOpacity}%
          </span>
        </div>
      </div>

      {/* Fit to Logos */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Focus className="h-3.5 w-3.5 text-muted-foreground" />
          <Label className="text-xs font-medium">Fit to Logos</Label>
          <span className="text-[9px] text-muted-foreground">(bar wraps logos only)</span>
        </div>
        <Switch
          checked={isLogoBound}
          onCheckedChange={setLogoStripLogoBound}
        />
      </div>
    </div>
  )
}
