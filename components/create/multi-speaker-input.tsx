'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Upload, X, User, Loader2, Plus, ChevronDown, ChevronRight, ImageIcon, Camera, Briefcase, Check } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type {
  SpeakerItem,
  SpeakerRole,
  PhotoShape,
  PhotoPosition,
  PhotoVerticalPosition,
  LayoutMode,
  LayoutStrategy,
} from '@/lib/config/design-constants'
import { SPEAKER_ROLE_LABELS } from '@/lib/config/design-constants'

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

          {/* Add Another Speaker */}
          {speakers.length < 4 ? (
            <button
              type="button"
              onClick={handleAddSpeaker}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-dashed border-violet-300/60 bg-violet-50/40 hover:bg-violet-50 hover:border-violet-400/60 text-violet-600 hover:scale-[1.01] active:scale-[0.99] transition-all duration-150"
            >
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center shadow-sm">
                <Plus className="h-3 w-3 text-white" />
              </div>
              <span className="text-xs font-semibold">Add Speaker</span>
              <span className="text-[10px] text-muted-foreground">({speakers.length}/4)</span>
            </button>
          ) : (
            <div className="text-center py-2 px-3 bg-muted/30 rounded-xl">
              <p className="text-[10px] text-muted-foreground">Maximum 4 speakers reached</p>
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
    <div className={cn(
      "rounded-2xl border overflow-hidden transition-all duration-200",
      isExpanded
        ? "border-violet-200/60 shadow-md shadow-violet-500/5 bg-card"
        : "border-border/50 shadow-sm bg-card hover:border-border hover:shadow-md"
    )}>
      {/* Header row */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        <div
          onClick={onToggle}
          className="flex items-center gap-2.5 flex-1 cursor-pointer min-w-0"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && onToggle()}
        >
          {/* Number badge — gradient */}
          <div className={cn(
            "w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 transition-all",
            isComplete && hasPhoto
              ? "bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-sm"
              : isComplete
                ? "bg-gradient-to-br from-violet-500 to-indigo-500 text-white shadow-sm"
                : "bg-muted text-muted-foreground"
          )}>
            {isComplete && hasPhoto ? <Check className="h-3 w-3" /> : index + 1}
          </div>

          {/* Name */}
          <span className={cn(
            "text-xs font-semibold flex-1 truncate",
            !speaker.name ? "text-muted-foreground" : "text-foreground"
          )}>
            {getSummary(speaker)}
          </span>

          {hasPhoto && (
            <span className="shrink-0 text-[10px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200/60">
              Photo ✓
            </span>
          )}

          {isExpanded
            ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          }
        </div>

        <button
          type="button"
          onClick={onRemove}
          className="h-6 w-6 flex items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-3 pb-3 pt-0 space-y-2.5 border-t border-border/40">
          {/* Name + Designation */}
          <div className="grid grid-cols-2 gap-2 pt-2.5">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
                Name <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground/40" />
                <Input
                  id={`name-${speaker.id}`}
                  placeholder="Dr. Jane Smith"
                  value={speaker.name}
                  onChange={(e) => onUpdate({ name: e.target.value })}
                  className="h-8 text-xs pl-7 rounded-lg bg-muted/30 border-border/50 focus:bg-background"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
                Designation
              </label>
              <div className="relative">
                <Briefcase className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground/40" />
                <Input
                  id={`designation-${speaker.id}`}
                  placeholder="CEO, TechCorp"
                  value={speaker.designation || ''}
                  onChange={(e) => onUpdate({ designation: e.target.value })}
                  className="h-8 text-xs pl-7 rounded-lg bg-muted/30 border-border/50 focus:bg-background"
                />
              </div>
            </div>
          </div>

          {/* Role on poster — renders as a label above the name */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
              Role on poster
            </label>
            <select
              value={speaker.role || 'speaker'}
              onChange={(e) => onUpdate({ role: e.target.value as SpeakerRole })}
              className="h-8 w-full text-xs px-2.5 rounded-lg bg-muted/30 border border-border/50 focus:bg-background"
            >
              {(Object.keys(SPEAKER_ROLE_LABELS) as SpeakerRole[]).map((r) => (
                <option key={r} value={r}>{SPEAKER_ROLE_LABELS[r]}</option>
              ))}
            </select>
          </div>

          {/* Photo upload */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">Photo</label>

            {speaker.photoUrl ? (
              <div className="flex items-center gap-3 p-2 rounded-xl border border-emerald-200/60 bg-emerald-50/50">
                <div className="relative group shrink-0">
                  <div className="w-12 h-12 rounded-xl overflow-hidden ring-2 ring-emerald-400/30 shadow-sm">
                    <img src={speaker.photoUrl} alt={speaker.name || 'Speaker'} className="w-full h-full object-cover" />
                  </div>
                  <button
                    type="button"
                    onClick={onRemovePhoto}
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-white flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 [@media(hover:none)]:opacity-100 transition-opacity"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </div>
                <div>
                  <p className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                    <Check className="h-3 w-3" /> Photo ready
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Tap X to remove</p>
                </div>
              </div>
            ) : (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "flex items-center gap-3 p-2.5 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-150",
                  isDragging
                    ? "border-violet-400 bg-violet-50"
                    : "border-border/50 hover:border-violet-300 hover:bg-violet-50/40"
                )}
              >
                <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={handleFileSelect} className="hidden" />
                <div className={cn(
                  "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                  isDragging ? "bg-violet-100" : "bg-muted/60"
                )}>
                  {isUploading
                    ? <Loader2 className="h-4 w-4 text-violet-500 animate-spin" />
                    : <Camera className="h-4 w-4 text-muted-foreground" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground/80">
                    {isUploading ? 'Uploading…' : isDragging ? 'Drop here' : 'Upload photo'}
                  </p>
                  <p className="text-[10px] text-muted-foreground">PNG, JPG · max 5MB</p>
                </div>
                <Upload className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
