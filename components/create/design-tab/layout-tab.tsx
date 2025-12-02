'use client'

import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Badge } from '@/components/ui/badge'
import { Check } from 'lucide-react'
import {
  Square,
  RectangleVertical,
  RectangleHorizontal,
  Smartphone,
  Monitor,
  MonitorPlay,
} from 'lucide-react'
import {
  ASPECT_RATIOS,
  RESOLUTIONS,
  DIMENSION_QUALITY,
  type AspectRatioId,
  type ResolutionId,
} from '@/lib/config/design-constants'

const RATIO_ICONS: Record<string, React.ElementType> = {
  Square,
  RectangleVertical,
  RectangleHorizontal,
  Smartphone,
  Monitor,
  MonitorPlay,
}

interface LayoutTabProps {
  selectedRatio: AspectRatioId
  selectedResolution: ResolutionId
  onRatioChange: (ratio: AspectRatioId) => void
  onResolutionChange: (resolution: ResolutionId) => void
}

export function LayoutTab({
  selectedRatio,
  selectedResolution,
  onRatioChange,
  onResolutionChange,
}: LayoutTabProps) {
  const currentDimensions = DIMENSION_QUALITY[selectedRatio]?.[selectedResolution]

  return (
    <div className="space-y-8">
      {/* Aspect Ratio Selection */}
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium mb-1">Aspect Ratio</h3>
          <p className="text-xs text-muted-foreground">
            Choose the dimensions for your poster
          </p>
        </div>

        <div className="grid grid-cols-5 gap-2">
          {(Object.entries(ASPECT_RATIOS) as [AspectRatioId, typeof ASPECT_RATIOS[AspectRatioId]][]).map(
            ([ratioId, ratio]) => {
              const Icon = RATIO_ICONS[ratio.icon] || Square
              const isSelected = selectedRatio === ratioId

              return (
                <button
                  key={ratioId}
                  onClick={() => onRatioChange(ratioId)}
                  className={cn(
                    'relative flex flex-col items-center p-3 rounded-lg border transition-all',
                    isSelected
                      ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                      : 'border-border hover:border-primary/50 hover:bg-muted/50'
                  )}
                >
                  {isSelected && (
                    <div className="absolute top-1 right-1">
                      <Check className="h-3 w-3 text-primary" />
                    </div>
                  )}
                  <Icon className={cn('h-5 w-5 mb-1', isSelected ? 'text-primary' : 'text-muted-foreground')} />
                  <span className="text-xs font-medium">{ratioId}</span>
                </button>
              )
            }
          )}
        </div>

        {/* Selected Ratio Info */}
        <div className="bg-muted/50 rounded-lg p-3 text-sm">
          <div className="font-medium">{ASPECT_RATIOS[selectedRatio].label}</div>
          <div className="text-xs text-muted-foreground mt-1">
            {ASPECT_RATIOS[selectedRatio].useCase}
          </div>
        </div>
      </div>

      {/* Resolution Selection */}
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium mb-1">Resolution Quality</h3>
          <p className="text-xs text-muted-foreground">
            Higher resolution for better print quality
          </p>
        </div>

        <RadioGroup
          value={selectedResolution}
          onValueChange={(value) => onResolutionChange(value as ResolutionId)}
          className="grid grid-cols-3 gap-3"
        >
          {(Object.entries(RESOLUTIONS) as [ResolutionId, typeof RESOLUTIONS[ResolutionId]][]).map(
            ([resolutionId, resolution]) => {
              const isSelected = selectedResolution === resolutionId
              const dimensions = DIMENSION_QUALITY[selectedRatio]?.[resolutionId]

              return (
                <div key={resolutionId}>
                  <RadioGroupItem
                    value={resolutionId}
                    id={resolutionId}
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor={resolutionId}
                    className={cn(
                      'flex flex-col items-center p-4 rounded-lg border cursor-pointer transition-all',
                      isSelected
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                        : 'border-border hover:border-primary/50 hover:bg-muted/50'
                    )}
                  >
                    <div className="font-medium">{resolution.label}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {resolution.description}
                    </div>
                    {dimensions && (
                      <Badge variant="secondary" className="mt-2 text-xs">
                        {dimensions.width} x {dimensions.height}
                      </Badge>
                    )}
                  </Label>
                </div>
              )
            }
          )}
        </RadioGroup>
      </div>

      {/* Output Preview */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium">Output Dimensions</h3>
        <div className="bg-muted/50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-2xl font-bold">
                {currentDimensions?.width || 0}
              </span>
              <span className="text-muted-foreground mx-2">x</span>
              <span className="text-2xl font-bold">
                {currentDimensions?.height || 0}
              </span>
              <span className="text-sm text-muted-foreground ml-2">px</span>
            </div>
            <div className="text-right">
              <Badge variant="outline">{selectedRatio}</Badge>
              <Badge variant="outline" className="ml-2">
                {selectedResolution}
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
