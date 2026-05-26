'use client'

import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Type, Sparkles } from 'lucide-react'

interface InlineTypographySectionProps {
  useBrandFont: boolean
  onToggleBrandFont: (value: boolean) => void
  brandFont?: string | null
}

export function InlineTypographySection({
  useBrandFont,
  onToggleBrandFont,
  brandFont,
}: InlineTypographySectionProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Type className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">Typography</span>
      </div>

      {useBrandFont ? (
        // Show Brand Font toggle when enabled (default)
        <div className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors">
          <div className="space-y-0.5 flex-1 pr-2">
            <Label className="text-sm font-medium cursor-pointer">Use Brand Font</Label>
            <p className="text-xs text-muted-foreground line-clamp-1">
              {brandFont || 'Inter'}
            </p>
          </div>
          <Switch checked={true} onCheckedChange={(val) => onToggleBrandFont(val)} />
        </div>
      ) : (
        // Show AI Font Suggestions toggle when brand font is disabled
        <div className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors">
          <div className="space-y-0.5 flex-1 pr-2">
            <Label className="text-sm font-medium cursor-pointer flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-purple-500" />
              AI Font Suggestions
            </Label>
            <p className="text-xs text-muted-foreground line-clamp-1">
              AI picks fonts for your event
            </p>
          </div>
          <Switch
            checked={true}
            onCheckedChange={(val) => {
              // When AI toggle is turned OFF, re-enable Brand Font
              if (!val) onToggleBrandFont(true)
            }}
          />
        </div>
      )}
    </div>
  )
}
