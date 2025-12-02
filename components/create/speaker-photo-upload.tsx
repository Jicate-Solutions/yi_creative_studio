'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Upload, X, User, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import type {
  SpeakerPhotoCustomization,
  PhotoShape,
  PhotoPosition,
} from '@/lib/config/design-constants'

interface SpeakerPhotoUploadProps {
  value: SpeakerPhotoCustomization
  onChange: (data: Partial<SpeakerPhotoCustomization>) => void
  compact?: boolean // For inline use in Advanced Tab
}

export function SpeakerPhotoUpload({
  value,
  onChange,
  compact = false,
}: SpeakerPhotoUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large. Maximum 5MB.')
      return
    }

    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/webp']
    if (!validTypes.includes(file.type)) {
      toast.error('Invalid file type. Please upload PNG, JPG, or WebP.')
      return
    }

    setIsUploading(true)
    try {
      const dataUrl = await fileToDataUrl(file)
      onChange({ photoUrl: dataUrl, enabled: true })
      toast.success('Speaker photo uploaded')
    } catch {
      toast.error('Failed to upload photo')
    } finally {
      setIsUploading(false)
      // Reset input so same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const handleRemovePhoto = () => {
    onChange({ photoUrl: undefined })
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Compact mode for Advanced Tab (just upload + preview)
  // Full mode for Step 4 (upload + all styling options in a card)

  const content = (
    <div className={cn(compact ? 'space-y-4' : 'space-y-4')}>
      {/* Enable Toggle */}
      <div className="flex items-center justify-between">
        <Label>Enable Speaker Photo</Label>
        <Switch
          checked={value.enabled}
          onCheckedChange={(checked) => onChange({ enabled: checked })}
        />
      </div>

      {value.enabled && (
        <>
          {/* Photo Upload Area */}
          <div className="space-y-2">
            <Label>Photo</Label>
            {value.photoUrl ? (
              <div className="relative inline-block">
                <img
                  src={value.photoUrl}
                  alt="Speaker"
                  className={cn(
                    'w-24 h-24 object-cover border-2',
                    value.shape === 'circle' && 'rounded-full',
                    value.shape === 'rounded' && 'rounded-lg',
                    value.shape === 'square' && 'rounded-none'
                  )}
                  style={{ borderColor: value.border.color }}
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -right-2 h-6 w-6"
                  onClick={handleRemovePhoto}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div
                className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                {isUploading ? (
                  <Loader2 className="h-8 w-8 mx-auto animate-spin text-muted-foreground" />
                ) : (
                  <>
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Click to upload speaker photo
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      PNG, JPG up to 5MB
                    </p>
                  </>
                )}
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>

          {/* Styling Options (only if photo uploaded or in full mode) */}
          {(value.photoUrl || !compact) && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Shape</Label>
                  <Select
                    value={value.shape}
                    onValueChange={(v) => onChange({ shape: v as PhotoShape })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="circle">Circle</SelectItem>
                      <SelectItem value="square">Square</SelectItem>
                      <SelectItem value="rounded">Rounded</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Position</Label>
                  <Select
                    value={value.position}
                    onValueChange={(v) =>
                      onChange({ position: v as PhotoPosition })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="left">Left</SelectItem>
                      <SelectItem value="center">Center</SelectItem>
                      <SelectItem value="right">Right</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Size: {value.size}px</Label>
                <Slider
                  value={[value.size]}
                  onValueChange={(v) => onChange({ size: v[0] })}
                  min={100}
                  max={400}
                  step={10}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Border Width: {value.border.width}px</Label>
                  <Slider
                    value={[value.border.width]}
                    onValueChange={(v) =>
                      onChange({ border: { ...value.border, width: v[0] } })
                    }
                    min={0}
                    max={10}
                    step={1}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Border Color</Label>
                  <Input
                    type="color"
                    value={value.border.color}
                    onChange={(e) =>
                      onChange({
                        border: { ...value.border, color: e.target.value },
                      })
                    }
                    className="h-10 p-1"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label>Drop Shadow</Label>
                <Switch
                  checked={value.shadow}
                  onCheckedChange={(checked) => onChange({ shadow: checked })}
                />
              </div>
            </>
          )}
        </>
      )}
    </div>
  )

  if (compact) {
    return content
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Speaker Photo
        </CardTitle>
        <CardDescription>
          Add a speaker or presenter photo to your creative
        </CardDescription>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  )
}
