'use client'

import { useState, useMemo, useEffect } from 'react'
import Image from 'next/image'
import {
  Sparkles,
  Image as ImageIcon,
  Lock,
  User,
  AlertTriangle,
  Calendar,
  Clock,
  MapPin,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { FIELD_REGISTRY } from '@/lib/config/field-registry'
import { getFieldIcon, FIELD_GROUPS, type FieldGroupKey } from '@/lib/config/field-icons'
import { isLogoAutoLocked } from '@/lib/config/logo-locks'
import { ValueCard } from './summary'
import type { CreativeFormat } from '@/lib/config/creative-formats'
import type { VerticalPreset, OrganizationLogo } from '@/types/database.types'
import type { LogoPlacement } from '@/stores/creative-store'
import type { Enhanced4RowStripMode } from '@/lib/config/design-constants'

// ============================================================================
// Types
// ============================================================================

interface GenerateSummaryCardProps {
  formData: {
    formatId: string | null
    formData: Record<string, unknown>
    aiFilledFields: string[]
    logosPlacements: LogoPlacement[]
    designData: {
      theme?: string
      style?: string
      resolution?: string
      customization?: {
        speakerPhoto?: {
          enabled?: boolean
          photoUrl?: string
          shape?: string
          speakers?: Array<{
            id: string
            name: string
            designation?: string
            photoUrl?: string
          }>
        }
      }
    }
    creationMode: string
    enhanced4RowStrip?: Enhanced4RowStripMode
  }
  selectedFormat: CreativeFormat | null
  selectedVertical: VerticalPreset | null
  logos: OrganizationLogo[]
  onEditField: (fieldId: string, value: unknown) => void
}

interface EditModalState {
  isOpen: boolean
  fieldId: string
  label: string
  value: string
  type: 'text' | 'textarea'
  required?: boolean
}

// ============================================================================
// Helper Functions
// ============================================================================

function getFieldValue(formData: Record<string, unknown>, fieldId: string): string {
  const value = formData[fieldId]
  if (value === null || value === undefined) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'number') return String(value)
  if (value instanceof Date) return value.toLocaleDateString()
  return String(value)
}

function formatPositionLabel(position: string): string {
  const posMap: Record<string, string> = {
    'top-1': 'Top Left',
    'top-2': 'Top Center',
    'top-3': 'Top Right',
    'mid-1': 'Middle Left',
    'mid-2': 'Middle Center',
    'mid-3': 'Middle Right',
    'bottom-1': 'Bottom Left',
    'bottom-2': 'Bottom Center',
    'bottom-3': 'Bottom Right',
  }
  return posMap[position] || position
}

function normalizeFormatId(formatId: string): string {
  let normalized = formatId.replace(/-/g, '_')
  const verticalSuffixes = [
    '_masoom', '_road_safety', '_health', '_yuva',
    '_climate_change', '_innovation', '_thalir', '_chapter_events',
    '_innovation_technology', '_technology', '_rural_events', '_rural_initiatives'
  ]
  for (const suffix of verticalSuffixes) {
    if (normalized.endsWith(suffix)) {
      return normalized.slice(0, -suffix.length)
    }
  }
  return normalized
}

// ============================================================================
// Sub-Components
// ============================================================================

// Mobile detection hook
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return isMobile
}

function LogoThumbnail({
  logo,
  placement,
  isInstitutionMode,
}: {
  logo: OrganizationLogo | undefined
  placement: LogoPlacement
  isInstitutionMode?: boolean
}) {
  const isLocked = !isInstitutionMode && logo?.name && isLogoAutoLocked(logo.name)

  return (
    <div className="flex items-center gap-2 rounded-md px-2 py-1.5 bg-muted/30">
      <div className="relative h-8 w-8 rounded border bg-white shrink-0 overflow-hidden">
        {logo?.file_url ? (
          <Image
            src={logo.file_url}
            alt={logo.name || 'Logo'}
            fill
            className="object-contain p-0.5"
            unoptimized
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{logo?.name || 'Unknown'}</p>
        <p className="text-xs text-muted-foreground">{formatPositionLabel(placement.position)}</p>
      </div>
      {isLocked && (
        <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      )}
    </div>
  )
}

function SpeakerPhotoThumbnail({
  photoUrl,
  shape,
}: {
  photoUrl: string
  shape?: string
}) {
  return (
    <div className="flex items-center gap-2 rounded-md px-2 py-1.5 bg-muted/30">
      <div
        className={cn(
          'relative h-10 w-10 shrink-0 overflow-hidden border bg-white',
          shape === 'circle' ? 'rounded-full' : shape === 'rounded' ? 'rounded-lg' : 'rounded'
        )}
      >
        <Image
          src={photoUrl}
          alt="Speaker"
          fill
          className="object-cover"
          unoptimized
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">Speaker Photo</p>
        <p className="text-xs text-muted-foreground capitalize">{shape || 'default'} shape</p>
      </div>
    </div>
  )
}

function InlineEditModal({
  state,
  onClose,
  onSave,
}: {
  state: EditModalState
  onClose: () => void
  onSave: (fieldId: string, value: string) => void
}) {
  const [value, setValue] = useState(state.value)
  const [touched, setTouched] = useState(false)

  const showWarning = touched && state.required && !value.trim()

  const handleSave = () => {
    onSave(state.fieldId, value)
    onClose()
  }

  return (
    <Dialog open={state.isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit {state.label}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          {state.type === 'textarea' ? (
            <Textarea
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onBlur={() => setTouched(true)}
              rows={4}
              className="resize-none"
              autoFocus
            />
          ) : (
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onBlur={() => setTouched(true)}
              autoFocus
            />
          )}
          {showWarning && (
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-500">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span className="text-sm">This is a required field</span>
            </div>
          )}
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================================
// Main Component - Value-Centric Layout with Card-per-Group
// ============================================================================

export function GenerateSummaryCard({
  formData,
  selectedFormat,
  selectedVertical,
  logos,
  onEditField,
}: GenerateSummaryCardProps) {
  const isMobile = useIsMobile()
  const [editModal, setEditModal] = useState<EditModalState>({
    isOpen: false,
    fieldId: '',
    label: '',
    value: '',
    type: 'text',
  })

  // Get logo placements with full logo data
  const logoData = useMemo(() => {
    return formData.logosPlacements.map((placement) => ({
      placement,
      logo: logos.find((l) => l.id === placement.logoId),
    }))
  }, [formData.logosPlacements, logos])

  // Speaker photo config
  const speakerPhoto = formData.designData?.customization?.speakerPhoto

  // Group fields by category for card-per-group layout
  const groupedFields = useMemo(() => {
    const aiFields = new Set(formData.aiFilledFields)
    const groups: Record<FieldGroupKey, Array<{ id: string; value: string; isAiFilled: boolean }>> = {
      timing: [],
      location: [],
      contact: [],
      speaker: [],
      branding: [],
      content: [],
      social: [],
      signatory: [],
      design: [],
    }

    // Add form fields to their groups
    Object.entries(formData.formData).forEach(([fieldId, rawValue]) => {
      const value = getFieldValue(formData.formData, fieldId)
      if (!value) return // Skip empty fields

      // Find which group this field belongs to
      for (const [groupKey, groupConfig] of Object.entries(FIELD_GROUPS)) {
        if ((groupConfig.fields as readonly string[]).includes(fieldId)) {
          groups[groupKey as FieldGroupKey].push({
            id: fieldId,
            value,
            isAiFilled: aiFields.has(fieldId),
          })
          break
        }
      }
    })

    return groups
  }, [formData.formData, formData.aiFilledFields])

  const openEditModal = (fieldId: string) => {
    const field = FIELD_REGISTRY[fieldId]
    if (!field) return

    setEditModal({
      isOpen: true,
      fieldId,
      label: field.label,
      value: getFieldValue(formData.formData, fieldId),
      type: field.type === 'textarea' ? 'textarea' : 'text',
      required: field.required,
    })
  }

  const handleSave = (fieldId: string, value: string) => {
    onEditField(fieldId, value)
  }

  // Count total AI-filled visible fields
  const aiCount = useMemo(() => {
    return Object.values(groupedFields).flat().filter(f => f.isAiFilled).length
  }, [groupedFields])

  return (
    <div className="space-y-2">
      {/* Format & Vertical Header */}
      <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-medium">
            {selectedFormat?.label || 'No format'}
          </Badge>
          {selectedFormat?.width && selectedFormat?.height && (
            <span className="text-xs text-muted-foreground">
              {selectedFormat.width}x{selectedFormat.height}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {aiCount > 0 && (
            <Badge variant="secondary" className="h-5 gap-1 px-1.5 text-[10px] bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">
              <Sparkles className="h-3 w-3" />
              {aiCount} AI
            </Badge>
          )}
          {selectedVertical && (
            <Badge variant="secondary" className="text-xs">
              {selectedVertical.name}
            </Badge>
          )}
        </div>
      </div>

      {/* Timing Card - Date + Time inline */}
      {(groupedFields.timing.length > 0) && (
        <div className="rounded-lg border bg-card/50 p-2">
          <div className="flex flex-wrap items-center gap-3">
            {groupedFields.timing.map((field) => {
              const Icon = getFieldIcon(field.id)
              return (
                <button
                  key={field.id}
                  onClick={() => openEditModal(field.id)}
                  className={cn(
                    'group flex items-center gap-1.5 text-sm rounded px-1.5 py-0.5 transition-colors',
                    'hover:bg-muted/70',
                    field.isAiFilled && 'bg-violet-50/50 dark:bg-violet-900/10'
                  )}
                >
                  <Icon className={cn(
                    'h-3.5 w-3.5 shrink-0',
                    field.isAiFilled ? 'text-violet-600' : 'text-muted-foreground'
                  )} />
                  <span>{field.value}</span>
                  {field.isAiFilled && <Sparkles className="h-2.5 w-2.5 text-violet-500" />}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Location Card */}
      {groupedFields.location.length > 0 && (
        <ValueCard
          label="Location"
          fields={groupedFields.location}
          onEditField={openEditModal}
          isMobile={isMobile}
        />
      )}

      {/* Content Card - Event name, description, etc */}
      {groupedFields.content.length > 0 && (
        <ValueCard
          label="Content"
          fields={groupedFields.content}
          onEditField={openEditModal}
          isMobile={isMobile}
        />
      )}

      {/* Contact Card */}
      {groupedFields.contact.length > 0 && (
        <ValueCard
          label="Contact"
          fields={groupedFields.contact}
          onEditField={openEditModal}
          isMobile={isMobile}
        />
      )}

      {/* Branding Card */}
      {groupedFields.branding.length > 0 && (
        <ValueCard
          label="Branding"
          fields={groupedFields.branding}
          onEditField={openEditModal}
          isMobile={isMobile}
        />
      )}

      {/* Social Card */}
      {groupedFields.social.length > 0 && (
        <ValueCard
          label="Social"
          fields={groupedFields.social}
          onEditField={openEditModal}
          isMobile={isMobile}
        />
      )}

      {/* Signatory Card (for certificates) */}
      {groupedFields.signatory.length > 0 && (
        <ValueCard
          label="Signatory"
          fields={groupedFields.signatory}
          onEditField={openEditModal}
          isMobile={isMobile}
        />
      )}

      {/* Speakers Card - from designData */}
      {speakerPhoto?.speakers && speakerPhoto.speakers.length > 0 && (
        <div className="rounded-lg border bg-card/50 p-2 space-y-1">
          {speakerPhoto.speakers.map((speaker, index) => (
            <div key={speaker.id || index} className="flex items-center gap-2 rounded-md px-2 py-1.5 bg-muted/30">
              {speaker.photoUrl ? (
                <div
                  className={cn(
                    'relative h-8 w-8 shrink-0 overflow-hidden border bg-white',
                    speakerPhoto.shape === 'circle' ? 'rounded-full' : speakerPhoto.shape === 'rounded' ? 'rounded-lg' : 'rounded'
                  )}
                >
                  <Image
                    src={speaker.photoUrl}
                    alt={speaker.name || `Speaker ${index + 1}`}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{speaker.name || `Speaker ${index + 1}`}</p>
                {speaker.designation && (
                  <p className="truncate text-xs text-muted-foreground">{speaker.designation}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}


      {/* Inline Edit Modal */}
      {editModal.isOpen && (
        <InlineEditModal
          state={editModal}
          onClose={() => setEditModal((prev) => ({ ...prev, isOpen: false }))}
          onSave={handleSave}
        />
      )}
    </div>
  )
}
