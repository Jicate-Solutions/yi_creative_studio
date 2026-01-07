'use client'

import { useState } from 'react'
import { Check, Loader2, Star, ImageIcon } from 'lucide-react'
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
import { useVerticalLogoPresets } from '@/hooks/use-vertical-logo-presets'
import { useCreativeStore } from '@/stores/creative-store'
import { cn } from '@/lib/utils'
import Image from 'next/image'

interface SaveVerticalPresetDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SaveVerticalPresetDialog({ open, onOpenChange }: SaveVerticalPresetDialogProps) {
  const { createPreset, isLoading } = useVerticalLogoPresets()
  const { formData, logos } = useCreativeStore()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isDefault, setIsDefault] = useState(false)
  const [error, setError] = useState('')

  const logoIds = formData.enhanced4RowStrip.rows.vertical.logoIds

  // Get logo details for preview
  const selectedLogos = logoIds
    .map(id => logos.find(l => l.id === id))
    .filter((logo): logo is typeof logos[0] => logo !== undefined)

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Please enter a name for this preset')
      return
    }

    if (logoIds.length === 0) {
      setError('Please select at least one logo before saving')
      return
    }

    setError('')

    const result = await createPreset({
      name: name.trim(),
      description: description.trim() || undefined,
      is_default: isDefault,
      logo_ids: logoIds,
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
          <DialogTitle>Save Program Logos Preset</DialogTitle>
          <DialogDescription>
            Save your current ROW 2 logo selection as a reusable preset for quick access.
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
              placeholder="e.g., MSME Logos, Startup Weekend, Youth Program"
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
              placeholder="Brief description of when to use this preset..."
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

          {/* Logo Preview */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">
              Logos to save ({logoIds.length} selected)
            </Label>
            <div className="rounded-md border p-3 bg-muted/30">
              {logoIds.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-2">
                  No logos selected in ROW 2
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {selectedLogos.map((logo) => (
                    <div
                      key={logo.id}
                      className="flex items-center gap-2 bg-white rounded-md px-2 py-1.5 border"
                    >
                      {logo.file_url ? (
                        <Image
                          src={logo.file_url}
                          alt={logo.name || 'Logo'}
                          width={24}
                          height={24}
                          className="object-contain"
                          unoptimized
                        />
                      ) : (
                        <ImageIcon className="h-4 w-4 text-slate-300" />
                      )}
                      <span className="text-xs truncate max-w-[100px]">{logo.name}</span>
                    </div>
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
            disabled={isLoading || logoIds.length === 0}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Save Preset
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
