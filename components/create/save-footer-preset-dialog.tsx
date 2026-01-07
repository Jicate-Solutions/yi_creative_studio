'use client'

import { useState } from 'react'
import { Check, Loader2, Star, Hash, Globe, AtSign, Building2 } from 'lucide-react'
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
import { useFooterPresets } from '@/hooks/use-footer-presets'
import { useCreativeStore } from '@/stores/creative-store'
import { cn } from '@/lib/utils'

interface SaveFooterPresetDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SaveFooterPresetDialog({ open, onOpenChange }: SaveFooterPresetDialogProps) {
  const { createPreset, isLoading } = useFooterPresets()
  const { formData } = useCreativeStore()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isDefault, setIsDefault] = useState(false)
  const [error, setError] = useState('')

  const footerConfig = formData.enhanced4RowStrip.footer

  // Count enabled features for preview
  const enabledFeatures = {
    hashtag: footerConfig.hashtag.enabled && footerConfig.hashtag.text.trim(),
    website: footerConfig.website.enabled && footerConfig.website.url.trim(),
    social: footerConfig.website.socialHandle?.trim(),
    partner: footerConfig.digitalPartner.enabled && (
      footerConfig.digitalPartner.logoId || footerConfig.digitalPartner.labelText.trim()
    ),
    signature: footerConfig.signature?.enabled && (
      footerConfig.signature.logoId || footerConfig.signature.imageUrl
    ),
  }

  const enabledCount = Object.values(enabledFeatures).filter(Boolean).length

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Please enter a name for this configuration')
      return
    }

    if (enabledCount === 0) {
      setError('Please configure at least one footer element before saving')
      return
    }

    setError('')

    const result = await createPreset({
      name: name.trim(),
      description: description.trim() || undefined,
      is_default: isDefault,
      config: footerConfig,
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
          <DialogTitle>Save Footer Configuration</DialogTitle>
          <DialogDescription>
            Save your current footer settings as a reusable preset for quick access.
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
              placeholder="e.g., Yi Erode Default, Workshop Footer"
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
              placeholder="Brief description of when to use this footer..."
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
              Configuration to save ({enabledCount} items)
            </Label>
            <div className="rounded-md border p-3 bg-muted/30">
              {enabledCount === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-2">
                  No footer elements configured yet
                </p>
              ) : (
                <div className="space-y-2">
                  {/* Hashtag */}
                  {enabledFeatures.hashtag && (
                    <PreviewItem
                      icon={<Hash className="h-3.5 w-3.5" />}
                      label="Hashtag"
                      value={footerConfig.hashtag.text}
                      color="text-green-600"
                    />
                  )}

                  {/* Website */}
                  {enabledFeatures.website && (
                    <PreviewItem
                      icon={<Globe className="h-3.5 w-3.5" />}
                      label="Website"
                      value={footerConfig.website.url}
                      color="text-blue-600"
                    />
                  )}

                  {/* Social Handle */}
                  {enabledFeatures.social && (
                    <PreviewItem
                      icon={<AtSign className="h-3.5 w-3.5" />}
                      label="Social"
                      value={footerConfig.website.socialHandle || ''}
                      color="text-purple-600"
                    />
                  )}

                  {/* Digital Partner */}
                  {enabledFeatures.partner && (
                    <PreviewItem
                      icon={<Building2 className="h-3.5 w-3.5" />}
                      label="Partner"
                      value={footerConfig.digitalPartner.labelText}
                      color="text-orange-600"
                    />
                  )}

                  {/* Styling Note */}
                  <div className="pt-2 border-t mt-2">
                    <p className="text-[11px] text-muted-foreground">
                      + Background, typography, and layout settings
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
            disabled={isLoading || enabledCount === 0}
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
