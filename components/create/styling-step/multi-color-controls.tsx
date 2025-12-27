'use client'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RotateCcw } from 'lucide-react'
import type { MultiColorTypographyConfig } from '@/lib/config/design-constants'

interface MultiColorControlsProps {
  config: MultiColorTypographyConfig
  onUpdate: (config: MultiColorTypographyConfig) => void
  defaultPalette?: MultiColorTypographyConfig
}

/**
 * Multi-Color Typography Controls
 *
 * Allows users to customize colors for each text role (hero, headline, body, CTA, etc.)
 * Supports both solid colors and gradient effects with WCAG accessibility validation
 *
 * @param config - Current multi-color typography configuration
 * @param onUpdate - Callback to update configuration
 * @param defaultPalette - Optional default palette for reset functionality
 */
export function MultiColorControls({
  config,
  onUpdate,
  defaultPalette
}: MultiColorControlsProps) {
  const roles: Array<keyof MultiColorTypographyConfig> = [
    'hero',
    'headline',
    'subheadline',
    'body',
    'cta',
    'caption',
    'label'
  ]

  const roleLabels: Record<keyof MultiColorTypographyConfig, string> = {
    hero: 'Hero/Title',
    headline: 'Headline',
    subheadline: 'Subheadline',
    body: 'Body Text',
    cta: 'Call-to-Action',
    caption: 'Caption',
    label: 'Label'
  }

  const handleReset = () => {
    if (defaultPalette) {
      onUpdate(defaultPalette)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold">Text Role Colors</h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            Customize colors for different text elements
          </p>
        </div>
        {defaultPalette && (
          <Button
            size="sm"
            variant="ghost"
            onClick={handleReset}
            className="h-8"
          >
            <RotateCcw className="h-3 w-3 mr-1.5" />
            Reset
          </Button>
        )}
      </div>

      <div className="grid gap-4">
        {roles.map(role => (
          <div key={role} className="space-y-2 p-3 rounded-lg border bg-card">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium capitalize">
                {roleLabels[role]}
              </Label>
              <Select
                value={config[role].type}
                onValueChange={(type: 'solid' | 'gradient') => {
                  onUpdate({
                    ...config,
                    [role]: {
                      ...config[role],
                      type,
                      // Set defaults for gradient if switching to gradient
                      ...(type === 'gradient' && !config[role].gradientStart
                        ? {
                            gradientStart: config[role].color || '#3b82f6',
                            gradientEnd: config[role].color || '#6366f1',
                            gradientDirection: 'horizontal' as const
                          }
                        : {}),
                      // Set default for solid if switching to solid
                      ...(type === 'solid' && !config[role].color
                        ? {
                            color: config[role].gradientStart || '#3b82f6'
                          }
                        : {})
                    }
                  })
                }}
              >
                <SelectTrigger className="w-28 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="solid">Solid</SelectItem>
                  <SelectItem value="gradient">Gradient</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {config[role].type === 'solid' ? (
              <div className="flex gap-2 items-center">
                <Input
                  type="color"
                  value={config[role].color || '#3b82f6'}
                  onChange={(e) => {
                    onUpdate({
                      ...config,
                      [role]: {
                        ...config[role],
                        color: e.target.value
                      }
                    })
                  }}
                  className="w-16 h-8 p-1 cursor-pointer"
                />
                <Input
                  type="text"
                  value={config[role].color || '#3b82f6'}
                  onChange={(e) => {
                    onUpdate({
                      ...config,
                      [role]: {
                        ...config[role],
                        color: e.target.value
                      }
                    })
                  }}
                  className="flex-1 h-8 text-xs font-mono"
                  placeholder="#000000"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">Start</Label>
                    <div className="flex gap-1">
                      <Input
                        type="color"
                        value={config[role].gradientStart || '#3b82f6'}
                        onChange={(e) => {
                          onUpdate({
                            ...config,
                            [role]: {
                              ...config[role],
                              gradientStart: e.target.value
                            }
                          })
                        }}
                        className="w-12 h-8 p-1 cursor-pointer"
                      />
                      <Input
                        type="text"
                        value={config[role].gradientStart || '#3b82f6'}
                        onChange={(e) => {
                          onUpdate({
                            ...config,
                            [role]: {
                              ...config[role],
                              gradientStart: e.target.value
                            }
                          })
                        }}
                        className="flex-1 h-8 text-[10px] font-mono"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">End</Label>
                    <div className="flex gap-1">
                      <Input
                        type="color"
                        value={config[role].gradientEnd || '#6366f1'}
                        onChange={(e) => {
                          onUpdate({
                            ...config,
                            [role]: {
                              ...config[role],
                              gradientEnd: e.target.value
                            }
                          })
                        }}
                        className="w-12 h-8 p-1 cursor-pointer"
                      />
                      <Input
                        type="text"
                        value={config[role].gradientEnd || '#6366f1'}
                        onChange={(e) => {
                          onUpdate({
                            ...config,
                            [role]: {
                              ...config[role],
                              gradientEnd: e.target.value
                            }
                          })
                        }}
                        className="flex-1 h-8 text-[10px] font-mono"
                      />
                    </div>
                  </div>
                </div>
                <Select
                  value={config[role].gradientDirection || 'horizontal'}
                  onValueChange={(dir: 'horizontal' | 'vertical' | 'diagonal') => {
                    onUpdate({
                      ...config,
                      [role]: {
                        ...config[role],
                        gradientDirection: dir
                      }
                    })
                  }}
                >
                  <SelectTrigger className="w-full h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="horizontal">Horizontal →</SelectItem>
                    <SelectItem value="vertical">Vertical ↓</SelectItem>
                    <SelectItem value="diagonal">Diagonal ↘</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {config[role].contrastRatio && (
              <div className="text-[10px] text-muted-foreground mt-1">
                WCAG Contrast: {config[role].contrastRatio}:1
              </div>
            )}

            {config[role].description && (
              <div className="text-[10px] text-muted-foreground italic mt-1">
                {config[role].description}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="text-xs text-muted-foreground p-3 rounded-lg bg-muted/50">
        <p className="font-medium mb-1">Accessibility Guidelines:</p>
        <ul className="space-y-0.5 list-disc list-inside">
          <li>Body text: ≥ 4.5:1 contrast ratio (WCAG AA)</li>
          <li>Large text (hero/headline): ≥ 3:1 contrast ratio</li>
          <li>Gradients work best for hero/title and CTA elements</li>
        </ul>
      </div>
    </div>
  )
}
