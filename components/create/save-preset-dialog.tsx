'use client'

import { useState } from 'react'
import { Check, Loader2, Star } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { useLogoPresets } from '@/hooks/use-logo-presets'
import { useCreativeStore, type LogoPlacement } from '@/stores/creative-store'
import type { LogoPresetPlacement } from '@/types/logo-presets'
import { cn } from '@/lib/utils'

interface SavePresetDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SavePresetDialog({ open, onOpenChange }: SavePresetDialogProps) {
  const { createPreset, isLoading } = useLogoPresets()
  const { formData } = useCreativeStore()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isDefault, setIsDefault] = useState(false)
  const [error, setError] = useState('')

  const currentPlacements = formData.logosPlacements

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Please enter a name for this configuration')
      return
    }

    if (currentPlacements.length === 0) {
      setError('No logos are positioned. Please add at least one logo.')
      return
    }

    setError('')

    // Convert LogoPlacement[] to LogoPresetPlacement[]
    const placements: LogoPresetPlacement[] = currentPlacements.map((p) => ({
      logoId: p.logoId,
      logoName: p.logo?.name || 'Unknown',
      position: p.position,
      size: typeof p.size === 'number' ? 'medium' : p.size,
      // Include background settings
      backgroundShape: p.backgroundShape,
      backgroundStyle: p.backgroundStyle,
    }))

    const result = await createPreset({
      name: name.trim(),
      description: description.trim() || undefined,
      is_default: isDefault,
      placements,
    })

    if (result) {
      // Reset form and close
      setName('')
      setDescription('')
      setIsDefault(false)
      onOpenChange(false)
    }
  }

  const handleClose = () => {
    setName('')
    setDescription('')
    setIsDefault(false)
    setError('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Save Logo Configuration</DialogTitle>
          <DialogDescription>
            Save your current logo positions as a reusable configuration.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Name Input */}
          <div className="space-y-2">
            <Label htmlFor="preset-name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="preset-name"
              placeholder="e.g., Yi Chapter Event, Workshop Standard"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setError('')
              }}
              maxLength={50}
            />
          </div>

          {/* Description Input */}
          <div className="space-y-2">
            <Label htmlFor="preset-description">Description (optional)</Label>
            <Textarea
              id="preset-description"
              placeholder="Brief description of when to use this configuration..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              maxLength={200}
            />
          </div>

          {/* Default Checkbox */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="preset-default"
              checked={isDefault}
              onCheckedChange={(checked) => setIsDefault(checked === true)}
            />
            <Label
              htmlFor="preset-default"
              className="flex items-center gap-1.5 text-sm font-normal cursor-pointer"
            >
              <Star className={cn('h-3.5 w-3.5', isDefault && 'fill-yellow-500 text-yellow-500')} />
              Set as default for new creatives
            </Label>
          </div>

          {/* Logos Preview */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">
              Logos to save ({currentPlacements.length})
            </Label>
            <div className="rounded-md border p-3 max-h-32 overflow-y-auto">
              {currentPlacements.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-2">
                  No logos positioned yet
                </p>
              ) : (
                <div className="space-y-1.5">
                  {currentPlacements.map((placement) => (
                    <LogoPreviewItem key={placement.logoId} placement={placement} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading || currentPlacements.length === 0}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Save Configuration
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function LogoPreviewItem({ placement }: { placement: LogoPlacement }) {
  const positionLabel = placement.position.replace('-', ' ').replace(/\b\w/g, (l) => l.toUpperCase())
  const sizeLabel = typeof placement.size === 'number' ? `${placement.size}px` : placement.size

  return (
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-2 min-w-0">
        <Check className="h-3.5 w-3.5 text-green-500 shrink-0" />
        <span className="truncate">{placement.logo?.name || 'Unknown'}</span>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
          {positionLabel}
        </Badge>
        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
          {sizeLabel}
        </Badge>
      </div>
    </div>
  )
}
