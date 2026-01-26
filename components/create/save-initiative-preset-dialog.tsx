'use client'

import { useState } from 'react'
import { Check, Loader2, Star, Type, Palette, AlignCenter } from 'lucide-react'
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
import { useInitiativePresets } from '@/hooks/use-initiative-presets'
import { useCreativeStore } from '@/stores/creative-store'
import { cn } from '@/lib/utils'

interface SaveInitiativePresetDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SaveInitiativePresetDialog({ open, onOpenChange }: SaveInitiativePresetDialogProps) {
  const { createPreset, isLoading } = useInitiativePresets()
  const { formData } = useCreativeStore()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isDefault, setIsDefault] = useState(false)
  const [error, setError] = useState('')

  const initiativeConfig = formData.enhanced4RowStrip.rows.initiative

  // Check if there's content to save
  const hasContent = initiativeConfig.enabled && initiativeConfig.text.trim()

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Please enter a name for this configuration')
      return
    }

    if (!hasContent) {
      setError('Please enter text content before saving')
      return
    }

    setError('')

    const result = await createPreset({
      name: name.trim(),
      description: description.trim() || undefined,
      is_default: isDefault,
      config: initiativeConfig,
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
          <DialogTitle>Save Chapter Name</DialogTitle>
          <DialogDescription>
            Save your current chapter name/initiative text for quick access in future creatives.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Name Input */}
          <div className="space-y-2">
            <Label htmlFor="preset-name">
              Preset Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="preset-name"
              placeholder="e.g., Yi Erode Initiative, Chapter Name"
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
              placeholder="Brief description of when to use this text..."
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

          {/* Configuration Preview */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">
              Text to save
            </Label>
            <div className="rounded-md border p-3 bg-muted/30">
              {!hasContent ? (
                <p className="text-sm text-muted-foreground text-center py-2">
                  No text configured yet
                </p>
              ) : (
                <div className="space-y-2">
                  {/* Text Content */}
                  <PreviewItem
                    icon={<Type className="h-3.5 w-3.5" />}
                    label="Text"
                    value={initiativeConfig.text}
                    color="text-blue-600"
                  />

                  {/* Font Info */}
                  <PreviewItem
                    icon={<AlignCenter className="h-3.5 w-3.5" />}
                    label="Font"
                    value={`${initiativeConfig.fontFamily} ${initiativeConfig.fontWeight}`}
                    color="text-purple-600"
                  />

                  {/* Color */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <Palette className="h-3.5 w-3.5 text-green-600" />
                      <span className="text-muted-foreground">Color:</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-4 h-4 rounded border"
                        style={{ backgroundColor: initiativeConfig.color }}
                      />
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        {initiativeConfig.color}
                      </Badge>
                    </div>
                  </div>

                  {/* Styling Note */}
                  <div className="pt-2 border-t mt-2">
                    <p className="text-[11px] text-muted-foreground">
                      + Font size, alignment, and effect settings
                    </p>
                  </div>
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
            disabled={isLoading || !hasContent}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Save
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface PreviewItemProps {
  icon: React.ReactNode
  label: string
  value: string
  color: string
}

function PreviewItem({ icon, label, value, color }: PreviewItemProps) {
  return (
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-2 min-w-0">
        <span className={cn('shrink-0', color)}>{icon}</span>
        <span className="text-muted-foreground">{label}:</span>
      </div>
      <Badge variant="outline" className="text-[10px] px-1.5 py-0 max-w-[150px] truncate">
        {value}
      </Badge>
    </div>
  )
}
