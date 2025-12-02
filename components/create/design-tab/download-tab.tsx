'use client'

import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import {
  Monitor,
  Printer,
  FileImage,
  FileText,
  Check,
} from 'lucide-react'
import {
  COLOR_MODES,
  FILE_FORMATS,
  DPI_OPTIONS,
  type ExportSettings,
  type ColorMode,
  type FileFormat,
  type DPI,
} from '@/lib/config/design-constants'

interface DownloadTabProps {
  exportSettings: ExportSettings
  onExportSettingsChange: (settings: Partial<ExportSettings>) => void
}

export function DownloadTab({
  exportSettings,
  onExportSettingsChange,
}: DownloadTabProps) {
  const isDigital = exportSettings.colorMode === 'rgb' || exportSettings.colorMode === 'srgb'

  return (
    <div className="space-y-8">
      {/* Color Mode */}
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium mb-1">Color Mode</h3>
          <p className="text-xs text-muted-foreground">
            RGB for digital, CMYK for professional printing
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Digital Section */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Monitor className="h-3 w-3" />
              Digital
            </div>
            {COLOR_MODES.filter((m) => m.value === 'rgb' || m.value === 'srgb').map((mode) => (
              <button
                key={mode.value}
                onClick={() => onExportSettingsChange({ colorMode: mode.value as ColorMode })}
                className={cn(
                  'w-full p-3 rounded-lg border text-left transition-all',
                  exportSettings.colorMode === mode.value
                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                    : 'border-border hover:border-primary/50'
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{mode.label}</span>
                  {exportSettings.colorMode === mode.value && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </div>
                <span className="text-xs text-muted-foreground">{mode.description}</span>
              </button>
            ))}
          </div>

          {/* Print Section */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Printer className="h-3 w-3" />
              Print
            </div>
            {COLOR_MODES.filter((m) => m.value.includes('cmyk')).map((mode) => (
              <button
                key={mode.value}
                onClick={() => onExportSettingsChange({ colorMode: mode.value as ColorMode })}
                className={cn(
                  'w-full p-3 rounded-lg border text-left transition-all',
                  exportSettings.colorMode === mode.value
                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                    : 'border-border hover:border-primary/50'
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{mode.label}</span>
                  {exportSettings.colorMode === mode.value && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </div>
                <span className="text-xs text-muted-foreground">{mode.description}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* File Format */}
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium mb-1">File Format</h3>
          <p className="text-xs text-muted-foreground">
            Choose the output file format
          </p>
        </div>

        <RadioGroup
          value={exportSettings.format}
          onValueChange={(value) => onExportSettingsChange({ format: value as FileFormat })}
          className="grid grid-cols-4 gap-3"
        >
          {FILE_FORMATS.map((format) => {
            const isSelected = exportSettings.format === format.value
            const Icon = format.value === 'pdf' ? FileText : FileImage

            return (
              <div key={format.value}>
                <RadioGroupItem
                  value={format.value}
                  id={`format-${format.value}`}
                  className="peer sr-only"
                />
                <Label
                  htmlFor={`format-${format.value}`}
                  className={cn(
                    'flex flex-col items-center p-3 rounded-lg border cursor-pointer transition-all',
                    isSelected
                      ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                      : 'border-border hover:border-primary/50'
                  )}
                >
                  <Icon className={cn('h-5 w-5 mb-1', isSelected ? 'text-primary' : 'text-muted-foreground')} />
                  <span className="font-medium text-sm uppercase">{format.value}</span>
                  <span className="text-xs text-muted-foreground text-center">{format.description}</span>
                </Label>
              </div>
            )
          })}
        </RadioGroup>
      </div>

      {/* DPI Selection */}
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium mb-1">Resolution (DPI)</h3>
          <p className="text-xs text-muted-foreground">
            Higher DPI for better print quality
          </p>
        </div>

        <RadioGroup
          value={String(exportSettings.dpi)}
          onValueChange={(value) => onExportSettingsChange({ dpi: Number(value) as DPI })}
          className="grid grid-cols-4 gap-3"
        >
          {DPI_OPTIONS.map((option) => {
            const isSelected = exportSettings.dpi === option.value

            return (
              <div key={option.value}>
                <RadioGroupItem
                  value={String(option.value)}
                  id={`dpi-${option.value}`}
                  className="peer sr-only"
                />
                <Label
                  htmlFor={`dpi-${option.value}`}
                  className={cn(
                    'flex flex-col items-center p-3 rounded-lg border cursor-pointer transition-all',
                    isSelected
                      ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                      : 'border-border hover:border-primary/50'
                  )}
                >
                  <span className="font-medium text-sm">{option.label}</span>
                  <span className="text-xs text-muted-foreground">{option.description}</span>
                </Label>
              </div>
            )
          })}
        </RadioGroup>
      </div>

      {/* Quality Slider (for JPG/WebP) */}
      {(exportSettings.format === 'jpg' || exportSettings.format === 'webp') && (
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium mb-1">
              Quality: {exportSettings.quality}%
            </h3>
            <p className="text-xs text-muted-foreground">
              Higher quality = larger file size
            </p>
          </div>

          <Slider
            value={[exportSettings.quality]}
            onValueChange={([value]) => onExportSettingsChange({ quality: value })}
            min={60}
            max={100}
            step={5}
          />

          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Smaller file</span>
            <span>Best quality</span>
          </div>
        </div>
      )}

      {/* Export Summary */}
      <div className="bg-muted/50 rounded-lg p-4 space-y-2">
        <h4 className="font-medium text-sm">Export Settings Summary</h4>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">
            {COLOR_MODES.find((m) => m.value === exportSettings.colorMode)?.label}
          </Badge>
          <Badge variant="secondary">{exportSettings.format.toUpperCase()}</Badge>
          <Badge variant="secondary">{exportSettings.dpi} DPI</Badge>
          {(exportSettings.format === 'jpg' || exportSettings.format === 'webp') && (
            <Badge variant="secondary">{exportSettings.quality}% Quality</Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {isDigital
            ? 'Optimized for digital displays and web use.'
            : 'Optimized for professional printing with accurate color reproduction.'}
        </p>
      </div>
    </div>
  )
}
