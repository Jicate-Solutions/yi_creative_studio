'use client'

import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Sparkles, FormInput } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SmartPasteToggleProps {
  enabled: boolean
  onToggle: (enabled: boolean) => void
  hasExtractedData?: boolean
}

export function SmartPasteToggle({
  enabled,
  onToggle,
  hasExtractedData,
}: SmartPasteToggleProps) {
  return (
    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary/5 to-secondary/5 border border-primary/10 rounded-xl">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'p-2 rounded-lg transition-colors',
            enabled ? 'bg-primary/20' : 'bg-muted'
          )}
        >
          {enabled ? (
            <Sparkles className="h-4 w-4 text-primary" />
          ) : (
            <FormInput className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
        <div>
          <Label className="font-medium cursor-pointer" htmlFor="smart-paste-toggle">
            {enabled ? 'Smart Paste Mode' : 'Manual Entry Mode'}
          </Label>
          <p className="text-xs text-muted-foreground">
            {enabled
              ? 'Paste event text to auto-extract fields'
              : 'Fill each field individually'}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {hasExtractedData && !enabled && (
          <Badge
            variant="outline"
            className="text-xs bg-green-50 text-green-700 border-green-200"
          >
            Data Applied
          </Badge>
        )}
        <Switch
          id="smart-paste-toggle"
          checked={enabled}
          onCheckedChange={onToggle}
        />
      </div>
    </div>
  )
}
