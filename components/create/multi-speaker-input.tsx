'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardHeader,
} from '@/components/ui/card'
import { Upload, X, User, Loader2, Plus, ChevronDown, ChevronRight, ImageIcon, Camera, Briefcase, Check } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type {
  SpeakerItem,
  PhotoShape,
  PhotoPosition,
  PhotoVerticalPosition,
  LayoutMode,
  LayoutStrategy,
} from '@/lib/config/design-constants'

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

  // Track previous speaker IDs to detect newly added speakers
  const prevSpeakerIdsRef = useRef<Set<string>>(new Set(speakers.map(s => s.id)))

  // Auto-expand newly added speakers and cleanup removed speakers
  useEffect(() => {
    const currentIds = new Set(speakers.map(s => s.id))
    const prevIds = prevSpeakerIdsRef.current

    // Find new speaker IDs (in current but not in previous)
    const newIds = speakers.filter(s => !prevIds.has(s.id)).map(s => s.id)

    // Find removed speaker IDs (in previous but not in current)
    const removedIds = [...prevIds].filter(id => !currentIds.has(id))

    if (newIds.length > 0 || removedIds.length > 0) {
      setExpandedSpeakers(prev => {
        const updated = new Set(prev)
        // Add new speakers
        newIds.forEach(id => updated.add(id))
        // Remove deleted speakers from expanded set
        removedIds.forEach(id => updated.delete(id))
        return updated
      })
    }

    // Update the ref for next comparison
    prevSpeakerIdsRef.current = currentIds
  }, [speakers])

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
      toast.success('Speaker photo uploaded')
    } catch {
      toast.error('Failed to upload photo')
    }
  }

  const handleRemovePhoto = (speakerId: string) => {
    onUpdateSpeaker(speakerId, { photoUrl: undefined })
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
      return `${speaker.name} • ${speaker.designation}`
    }
    if (speaker.name) return speaker.name
    if (speaker.designation) return speaker.designation
    return 'Unnamed Speaker'
  }

  const getSpeakerCompletion = (speaker: SpeakerItem): { isComplete: boolean; hasPhoto: boolean } => {
    return {
      isComplete: !!speaker.name,
      hasPhoto: !!speaker.photoUrl,
    }
  }

  return (
    <div className="space-y-3">
      {speakers.length === 0 ? (
        /* Empty State - Compact and inviting */
        <div className="rounded-xl border-2 border-dashed border-muted-foreground/20 bg-gradient-to-br from-muted/30 to-muted/10 p-6">
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
              <User className="h-6 w-6 text-primary" />
            </div>
            <h4 className="text-sm font-semibold text-foreground mb-1">Add Your Speaker</h4>
            <p className="text-xs text-muted-foreground mb-4 max-w-[200px]">
              Feature speakers with their photo on your creative
            </p>
            <Button
              variant="default"
              size="sm"
              onClick={handleAddSpeaker}
              className="gap-2 shadow-sm"
            >
              <Plus className="h-4 w-4" />
              Add Speaker
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {speakers.map((speaker, index) => (
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
              getCompletion={getSpeakerCompletion}
            />
          ))}

          {/* Add Another Speaker Button */}
          {speakers.length < 4 ? (
            <button
              type="button"
              onClick={handleAddSpeaker}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border-2 border-dashed border-primary/30 bg-primary/5 hover:bg-primary/10 hover:border-primary/50 transition-all group"
            >
              <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                <Plus className="h-3 w-3 text-primary" />
              </div>
              <span className="text-xs font-medium text-primary">Add Speaker</span>
              <span className="text-[10px] text-muted-foreground">({speakers.length}/4)</span>
            </button>
          ) : (
            <div className="text-center py-2 px-3 bg-muted/30 rounded-lg">
              <p className="text-[10px] text-muted-foreground">
                Maximum 4 speakers
              </p>
            </div>
          )}
        </div>
      )}
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
  getCompletion: (speaker: SpeakerItem) => { isComplete: boolean; hasPhoto: boolean }
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
  getCompletion,
}: SpeakerCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const { isComplete, hasPhoto } = getCompletion(speaker)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    await onPhotoUpload(file)
    setIsUploading(false)

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) {
      setIsUploading(true)
      await onPhotoUpload(file)
      setIsUploading(false)
    }
  }

  return (
    <Card className={cn(
      "overflow-hidden transition-all duration-200",
      isExpanded ? "shadow-md ring-1 ring-primary/10" : "shadow-sm hover:shadow-md",
      isComplete && hasPhoto && "ring-1 ring-green-500/20"
    )}>
      {/* Compact Header */}
      <CardHeader className="p-0">
        <div className="flex items-center gap-2.5 p-3">
          {/* Clickable toggle area - NOT a button to avoid nesting issues */}
          <div
            onClick={onToggle}
            className="flex items-center gap-2.5 flex-1 cursor-pointer min-w-0"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onToggle()}
          >
            {/* Speaker Number Badge */}
            <div className={cn(
              "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors",
              isComplete && hasPhoto
                ? "bg-green-500 text-white"
                : isComplete
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
            )}>
              {isComplete && hasPhoto ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                index + 1
              )}
            </div>

            {/* Speaker Info */}
            <div className="flex-1 text-left min-w-0">
              <div className="flex items-center gap-1.5">
                <span className={cn(
                  "text-sm font-medium truncate",
                  !speaker.name && "text-muted-foreground italic"
                )}>
                  {getSummary(speaker)}
                </span>
                {hasPhoto && (
                  <span className="shrink-0 w-4 h-4 rounded-full bg-green-500/10 flex items-center justify-center">
                    <ImageIcon className="h-2.5 w-2.5 text-green-600" />
                  </span>
                )}
              </div>
            </div>

            {/* Chevron indicator */}
            <div className="w-7 h-7 flex items-center justify-center text-muted-foreground shrink-0">
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </div>
          </div>

          {/* Remove button - OUTSIDE the toggle area */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardHeader>

      {/* Expandable Content */}
      {isExpanded && (
        <CardContent className="px-3 pb-3 pt-0">
          <div className="space-y-3">
            {/* Name & Designation Row */}
            <div className="grid grid-cols-2 gap-2">
              {/* Name Field */}
              <div className="space-y-1">
                <Label htmlFor={`name-${speaker.id}`} className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                  Name <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <User className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
                  <Input
                    id={`name-${speaker.id}`}
                    placeholder="Dr. Jane Smith"
                    value={speaker.name}
                    onChange={(e) => onUpdate({ name: e.target.value })}
                    className="h-8 text-xs pl-8 bg-muted/30 border-muted-foreground/10 focus:bg-background"
                  />
                </div>
              </div>

              {/* Designation Field */}
              <div className="space-y-1">
                <Label htmlFor={`designation-${speaker.id}`} className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                  Designation
                </Label>
                <div className="relative">
                  <Briefcase className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
                  <Input
                    id={`designation-${speaker.id}`}
                    placeholder="CEO, TechCorp"
                    value={speaker.designation || ''}
                    onChange={(e) => onUpdate({ designation: e.target.value })}
                    className="h-8 text-xs pl-8 bg-muted/30 border-muted-foreground/10 focus:bg-background"
                  />
                </div>
              </div>
            </div>

            {/* Photo Upload Section */}
            <div className="space-y-1.5">
              <Label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                Photo
              </Label>

              {speaker.photoUrl ? (
                /* Photo Preview */
                <div className="flex items-start gap-3">
                  <div className="relative group">
                    <div className="w-16 h-16 rounded-lg overflow-hidden ring-2 ring-green-500/20 shadow-sm">
                      <img
                        src={speaker.photoUrl}
                        alt={speaker.name || 'Speaker'}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={onRemovePhoto}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-white flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="flex-1 pt-1">
                    <p className="text-xs font-medium text-green-600 flex items-center gap-1">
                      <Check className="h-3 w-3" />
                      Photo uploaded
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Click × to remove and upload a different photo
                    </p>
                  </div>
                </div>
              ) : (
                /* Upload Area */
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "relative flex items-center gap-3 p-3 rounded-lg border-2 border-dashed cursor-pointer transition-all",
                    isDragging
                      ? "border-primary bg-primary/5"
                      : "border-muted-foreground/20 hover:border-primary/50 hover:bg-muted/30"
                  )}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
                    isDragging ? "bg-primary/10" : "bg-muted"
                  )}>
                    {isUploading ? (
                      <Loader2 className="h-5 w-5 text-primary animate-spin" />
                    ) : (
                      <Camera className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>

                  <div className="flex-1">
                    <p className="text-xs font-medium">
                      {isUploading ? 'Uploading...' : isDragging ? 'Drop to upload' : 'Upload photo'}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Drag & drop or click • PNG, JPG (max 5MB)
                    </p>
                  </div>

                  <Upload className="h-4 w-4 text-muted-foreground/50" />
                </div>
              )}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
