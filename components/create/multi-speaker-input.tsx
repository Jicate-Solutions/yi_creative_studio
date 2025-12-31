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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Upload, X, User, Loader2, Plus, ChevronDown, ChevronRight, GripVertical, ImageIcon, Settings2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import type {
  SpeakerItem,
  PhotoShape,
  PhotoPosition,
  PhotoVerticalPosition,
  LayoutMode,
  LayoutStrategy,
} from '@/lib/config/design-constants'
import { SpeakerPositionDropdown } from './speaker-position-dropdown'

interface SharedSettings {
  shape: PhotoShape
  size: number
  border: { width: number; color: string }
  shadow: boolean
  position?: PhotoPosition
  verticalPosition?: PhotoVerticalPosition
}

interface MultiSpeakerInputProps {
  speakers: SpeakerItem[]
  sharedSettings: SharedSettings
  layoutMode: LayoutMode
  layoutStrategy?: LayoutStrategy
  spacing: number
  onAddSpeaker: () => void
  onRemoveSpeaker: (speakerId: string) => void
  onUpdateSpeaker: (speakerId: string, updates: Partial<SpeakerItem>) => void
  onUpdateSettings: (settings: Partial<SharedSettings>) => void
  onUpdateLayout: (layoutMode: LayoutMode, layoutStrategy?: LayoutStrategy) => void
}

export function MultiSpeakerInput({
  speakers,
  sharedSettings,
  layoutMode,
  layoutStrategy,
  spacing,
  onAddSpeaker,
  onRemoveSpeaker,
  onUpdateSpeaker,
  onUpdateSettings,
  onUpdateLayout,
}: MultiSpeakerInputProps) {
  const [expandedSpeakers, setExpandedSpeakers] = useState<Set<string>>(
    new Set(speakers.length > 0 ? [speakers[0].id] : [])
  )
  const [settingsExpanded, setSettingsExpanded] = useState(false)

  const toggleSpeaker = (speakerId: string) => {
    const newExpanded = new Set(expandedSpeakers)
    if (newExpanded.has(speakerId)) {
      newExpanded.delete(speakerId)
    } else {
      newExpanded.add(speakerId)
    }
    setExpandedSpeakers(newExpanded)
  }

  const handleAddSpeaker = () => {
    onAddSpeaker()
    // Auto-expand the new speaker (it will be added at the end)
    setTimeout(() => {
      if (speakers.length > 0) {
        const newSpeakerId = speakers[speakers.length - 1]?.id
        if (newSpeakerId) {
          setExpandedSpeakers(new Set([...expandedSpeakers, newSpeakerId]))
        }
      }
    }, 100)
  }

  const handlePhotoUpload = async (speakerId: string, file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large. Maximum 5MB.')
      return
    }

    const validTypes = ['image/png', 'image/jpeg', 'image/webp']
    if (!validTypes.includes(file.type)) {
      toast.error('Invalid file type. Please upload PNG, JPG, or WebP.')
      return
    }

    try {
      const dataUrl = await fileToDataUrl(file)
      onUpdateSpeaker(speakerId, { photoUrl: dataUrl })

      // Auto-enable speaker photos when photo is uploaded (fixes overlay not rendering)
      // Note: 'enabled' is not part of SharedSettings interface, handled at parent level
      // onUpdateSettings({ enabled: true })

      // DIAGNOSTIC: Log photo upload with full details (FIX #3: Enhanced logging)
      console.log('[PHOTO UPLOAD] Complete diagnostic:', {
        speakerId,
        speakerFound: !!speakers.find(s => s.id === speakerId),
        photoUrlReceived: !!dataUrl,
        photoUrlLength: dataUrl?.length || 0,
        photoUrlPrefix: dataUrl?.substring(0, 80) || 'NONE',
        speakersBeforeUpdate: speakers.map(s => ({
          id: s.id,
          name: s.name,
          hasPhoto: !!s.photoUrl,
          photoLength: s.photoUrl?.length || 0
        })),
        autoEnabled: true
      })

      toast.success('Speaker photo uploaded')
    } catch {
      toast.error('Failed to upload photo')
    }
  }

  const handleRemovePhoto = (speakerId: string) => {
    onUpdateSpeaker(speakerId, { photoUrl: undefined })

    // Auto-disable speaker photos if no speakers have photos after removal
    const speakersAfterRemoval = speakers.map(s =>
      s.id === speakerId ? { ...s, photoUrl: undefined } : s
    )
    const hasAnyPhotos = speakersAfterRemoval.some(s => s.photoUrl)

    if (!hasAnyPhotos) {
      // Note: 'enabled' is not part of SharedSettings interface, handled at parent level
      // onUpdateSettings({ enabled: false })
      console.log('[MULTI-SPEAKER] Auto-disabled speaker photos (no photos remaining)')
    }

    toast.success('Speaker photo removed')
  }

  const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const getSpeakerSummary = (speaker: SpeakerItem): string => {
    if (speaker.name && speaker.designation) {
      return `${speaker.name} - ${speaker.designation}`
    }
    if (speaker.name) return speaker.name
    if (speaker.designation) return speaker.designation
    return 'Unnamed Speaker'
  }

  const getCompletionCount = () => {
    let completed = 0
    let total = speakers.length * 2 // Name + designation per speaker

    speakers.forEach(speaker => {
      if (speaker.name) completed++
      if (speaker.designation) completed++
    })

    return { completed, total }
  }

  const { completed, total } = getCompletionCount()

  return (
    <div className="space-y-4">
      {/* Header with Add Button and Layout Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium">Speakers</h3>
          {speakers.length > 0 && (
            <span className="text-xs text-muted-foreground">
              ({completed}/{total} fields)
            </span>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddSpeaker}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Speaker
        </Button>
      </div>

      {/* Layout Controls */}
      {speakers.length > 1 && (
        <Card className="shadow-sm border-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Layout Settings</CardTitle>
            <CardDescription className="text-xs">
              Control how speaker photos are arranged
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="layout-mode" className="text-xs">Layout Mode</Label>
                <Select
                  value={layoutMode}
                  onValueChange={(value) => onUpdateLayout(value as LayoutMode, layoutStrategy)}
                >
                  <SelectTrigger id="layout-mode" className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Auto-detect</SelectItem>
                    <SelectItem value="manual">Manual</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {layoutMode === 'manual' && (
                <div className="space-y-2">
                  <Label htmlFor="layout-strategy" className="text-xs">Arrangement</Label>
                  <Select
                    value={layoutStrategy || 'side-by-side'}
                    onValueChange={(value) => onUpdateLayout('manual', value as LayoutStrategy)}
                  >
                    <SelectTrigger id="layout-strategy" className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="side-by-side">Side by Side</SelectItem>
                      <SelectItem value="stacked">Stacked</SelectItem>
                      <SelectItem value="grid">Grid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Photo Settings - Only visible when speakers exist */}
      {speakers.length > 0 && (
        <Card className="shadow-sm border-none">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm">Photo Settings</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Style settings for all speaker photos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            {/* Position - Simple dropdown (most important setting) */}
            <SpeakerPositionDropdown
              position={sharedSettings.position}
              verticalPosition={sharedSettings.verticalPosition}
              onChange={(position, verticalPosition) =>
                onUpdateSettings({ position, verticalPosition })
              }
            />

            {/* Shape and Size - Side by side */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="photo-shape" className="text-xs">Shape</Label>
                <Select
                  value={sharedSettings.shape}
                  onValueChange={(value) => onUpdateSettings({ shape: value as PhotoShape })}
                >
                  <SelectTrigger id="photo-shape" className="h-9 text-sm">
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
                <div className="flex items-center justify-between">
                  <Label htmlFor="photo-size" className="text-xs">Size</Label>
                  <span className="text-[11px] text-muted-foreground">{sharedSettings.size}px</span>
                </div>
                <Slider
                  id="photo-size"
                  value={[sharedSettings.size]}
                  onValueChange={([value]) => onUpdateSettings({ size: value })}
                  min={100}
                  max={400}
                  step={10}
                  className="py-2"
                />
              </div>
            </div>

            {/* Border and Shadow - Collapsible advanced settings */}
            <Collapsible open={settingsExpanded} onOpenChange={setSettingsExpanded}>
              <CollapsibleTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full justify-between h-8 text-xs text-muted-foreground hover:text-foreground"
                >
                  <span>Border & Shadow Options</span>
                  <ChevronDown
                    className={cn(
                      'h-3 w-3 transition-transform duration-200',
                      settingsExpanded && 'rotate-180'
                    )}
                  />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-3 space-y-3">
                {/* Border */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="border-width" className="text-xs">Border</Label>
                      <span className="text-[11px] text-muted-foreground">{sharedSettings.border.width}px</span>
                    </div>
                    <Slider
                      id="border-width"
                      value={[sharedSettings.border.width]}
                      onValueChange={([value]) => onUpdateSettings({
                        border: { ...sharedSettings.border, width: value }
                      })}
                      min={0}
                      max={10}
                      step={1}
                      className="py-2"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="border-color" className="text-xs">Color</Label>
                    <Input
                      id="border-color"
                      type="color"
                      value={sharedSettings.border.color}
                      onChange={(e) => onUpdateSettings({
                        border: { ...sharedSettings.border, color: e.target.value }
                      })}
                      className="h-9"
                    />
                  </div>
                </div>

                {/* Shadow Toggle */}
                <div className="flex items-center justify-between py-1">
                  <Label htmlFor="photo-shadow" className="text-xs">Drop Shadow</Label>
                  <Switch
                    id="photo-shadow"
                    checked={sharedSettings.shadow}
                    onCheckedChange={(checked) => onUpdateSettings({ shadow: checked })}
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        </Card>
      )}

      {/* Speaker Cards */}
      <div className="space-y-3">
        {speakers.length === 0 ? (
          <Card className="shadow-sm border-none bg-muted/30">
            <CardContent className="flex flex-col items-center justify-center py-8 text-center">
              <User className="h-12 w-12 text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground mb-1">No speakers added</p>
              <p className="text-xs text-muted-foreground/70 mb-4">
                Click "Add Speaker" to get started
              </p>
            </CardContent>
          </Card>
        ) : (
          speakers.map((speaker, index) => (
            <SpeakerCard
              key={speaker.id}
              speaker={speaker}
              index={index}
              isExpanded={expandedSpeakers.has(speaker.id)}
              onToggle={() => toggleSpeaker(speaker.id)}
              onUpdate={(updates) => onUpdateSpeaker(speaker.id, updates)}
              onRemove={() => onRemoveSpeaker(speaker.id)}
              onPhotoUpload={(file) => handlePhotoUpload(speaker.id, file)}
              onRemovePhoto={() => handleRemovePhoto(speaker.id)}
              getSummary={getSpeakerSummary}
            />
          ))
        )}
      </div>
    </div>
  )
}

// Speaker Card Component
interface SpeakerCardProps {
  speaker: SpeakerItem
  index: number
  isExpanded: boolean
  onToggle: () => void
  onUpdate: (updates: Partial<SpeakerItem>) => void
  onRemove: () => void
  onPhotoUpload: (file: File) => void
  onRemovePhoto: () => void
  getSummary: (speaker: SpeakerItem) => string
}

function SpeakerCard({
  speaker,
  index,
  isExpanded,
  onToggle,
  onUpdate,
  onRemove,
  onPhotoUpload,
  onRemovePhoto,
  getSummary,
}: SpeakerCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    await onPhotoUpload(file)
    setIsUploading(false)

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <Card className="shadow-sm border-none">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />

          <div className="flex items-center gap-2 flex-1">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-medium">
              {index + 1}
            </div>

            <button
              type="button"
              onClick={onToggle}
              className="flex-1 text-left flex items-center gap-2 hover:text-foreground transition-colors"
            >
              <span className="text-sm font-medium truncate">
                {getSummary(speaker)}
              </span>
              {speaker.photoUrl && (
                <ImageIcon className="h-3 w-3 text-green-600" />
              )}
            </button>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
          >
            <X className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="h-8 w-8 p-0"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4 pt-0">
          {/* Name and Designation */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor={`speaker-name-${speaker.id}`} className="text-xs">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id={`speaker-name-${speaker.id}`}
                placeholder="e.g., Dr. Jane Smith"
                value={speaker.name}
                onChange={(e) => onUpdate({ name: e.target.value })}
                className="h-9 text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`speaker-designation-${speaker.id}`} className="text-xs">
                Designation
              </Label>
              <Input
                id={`speaker-designation-${speaker.id}`}
                placeholder="e.g., CEO, TechCorp"
                value={speaker.designation || ''}
                onChange={(e) => onUpdate({ designation: e.target.value })}
                className="h-9 text-sm"
              />
            </div>
          </div>

          {/* Photo Upload */}
          <div className="space-y-2">
            <Label className="text-xs">Speaker Photo</Label>

            {speaker.photoUrl ? (
              <div className="relative">
                <div className="aspect-square w-32 rounded-lg overflow-hidden shadow-md ring-1 ring-black/5">
                  <img
                    src={speaker.photoUrl}
                    alt={speaker.name || 'Speaker photo'}
                    className="w-full h-full object-cover"
                  />
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={onRemovePhoto}
                  className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="gap-2"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      Upload Photo
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground mt-1">
                  PNG, JPG or WebP (max 5MB)
                </p>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  )
}
