'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import {
  ChevronDown,
  Sparkles,
  Pencil,
  Image as ImageIcon,
  FileText,
  Palette,
  Lock,
  User,
  X,
  AlertTriangle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { FORM_SECTIONS, FORMAT_SECTIONS, FORMAT_SECTION_FIELDS } from '@/lib/config/form-sections'
import { FIELD_REGISTRY } from '@/lib/config/field-registry'
import { isLogoAutoLocked } from '@/lib/config/logo-locks'
import type { CreativeFormat } from '@/lib/config/creative-formats'
import type { VerticalPreset, OrganizationLogo } from '@/types/database.types'
import type { LogoPlacement } from '@/stores/creative-store'

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
        }
      }
    }
    creationMode: string
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

function SummarySection({
  title,
  icon: Icon,
  children,
  aiCount = 0,
  isEmpty = false,
  defaultOpen = true,
}: {
  title: string
  icon: React.ElementType
  children: React.ReactNode
  aiCount?: number
  isEmpty?: boolean
  defaultOpen?: boolean
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen && !isEmpty)

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className={cn(
            'flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition-colors',
            'hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            isOpen ? 'bg-muted/30' : 'bg-transparent'
          )}
        >
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{title}</span>
            {isEmpty && (
              <span className="text-xs text-muted-foreground">(none)</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {aiCount > 0 && (
              <Badge variant="secondary" className="h-5 gap-1 px-1.5 text-[10px] bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">
                <Sparkles className="h-3 w-3" />
                {aiCount} AI
              </Badge>
            )}
            <ChevronDown
              className={cn(
                'h-4 w-4 text-muted-foreground transition-transform',
                isOpen && 'rotate-180'
              )}
            />
          </div>
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="px-1 pt-1">
        <div className="space-y-1 pl-6 pr-2 pb-2">
          {children}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

function SummaryField({
  label,
  value,
  isAiFilled,
  onEdit,
}: {
  label: string
  value: string
  isAiFilled?: boolean
  onEdit: () => void
}) {
  const displayValue = value || '(not set)'
  const isEmpty = !value

  return (
    <div
      className={cn(
        'group flex items-start justify-between gap-2 rounded-md px-2 py-1.5 transition-colors',
        isAiFilled && 'bg-violet-50/50 dark:bg-violet-900/10'
      )}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">{label}</span>
          {isAiFilled && (
            <Sparkles className="h-3 w-3 text-violet-500" />
          )}
        </div>
        <p
          className={cn(
            'text-sm truncate',
            isEmpty && 'text-muted-foreground italic'
          )}
          title={displayValue}
        >
          {displayValue}
        </p>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={onEdit}
        className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
      >
        <Pencil className="h-3.5 w-3.5" />
        <span className="sr-only">Edit {label}</span>
      </Button>
    </div>
  )
}

function LogoThumbnail({
  logo,
  placement,
}: {
  logo: OrganizationLogo | undefined
  placement: LogoPlacement
}) {
  const isLocked = logo?.name && isLogoAutoLocked(logo.name)

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
// Main Component
// ============================================================================

export function GenerateSummaryCard({
  formData,
  selectedFormat,
  selectedVertical,
  logos,
  onEditField,
}: GenerateSummaryCardProps) {
  const [editModal, setEditModal] = useState<EditModalState>({
    isOpen: false,
    fieldId: '',
    label: '',
    value: '',
    type: 'text',
  })

  // Get format-specific sections and fields
  const { sections, sectionFields } = useMemo(() => {
    if (!selectedFormat?.id) {
      return { sections: [], sectionFields: {} }
    }

    const normalizedId = normalizeFormatId(selectedFormat.id)
    const sectionIds = FORMAT_SECTIONS[normalizedId] || ['core', 'advanced']
    const fields = FORMAT_SECTION_FIELDS[normalizedId] || {}

    const availableSections = sectionIds
      .map((id) => FORM_SECTIONS[id])
      .filter(Boolean)
      .sort((a, b) => a.priority - b.priority)

    return {
      sections: availableSections,
      sectionFields: fields,
    }
  }, [selectedFormat?.id])

  // Count AI-filled fields per section
  const aiCountBySection = useMemo(() => {
    const counts: Record<string, number> = {}
    const aiFields = new Set(formData.aiFilledFields)

    Object.entries(sectionFields).forEach(([sectionId, fieldIds]) => {
      counts[sectionId] = (fieldIds as string[]).filter((id) => aiFields.has(id)).length
    })

    return counts
  }, [sectionFields, formData.aiFilledFields])

  // Get logo placements with full logo data
  const logoData = useMemo(() => {
    return formData.logosPlacements.map((placement) => ({
      placement,
      logo: logos.find((l) => l.id === placement.logoId),
    }))
  }, [formData.logosPlacements, logos])

  // Speaker photo config
  const speakerPhoto = formData.designData?.customization?.speakerPhoto

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

  return (
    <div className="space-y-1">
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
        {selectedVertical && (
          <Badge variant="secondary" className="text-xs">
            {selectedVertical.name}
          </Badge>
        )}
      </div>

      {/* Form Field Sections */}
      {sections.map((section) => {
        const fieldIds = (sectionFields[section.id] as string[]) || []
        const hasValues = fieldIds.some((id) => getFieldValue(formData.formData, id))
        const aiCount = aiCountBySection[section.id] || 0

        return (
          <SummarySection
            key={section.id}
            title={section.title}
            icon={FileText}
            aiCount={aiCount}
            isEmpty={!hasValues}
            defaultOpen={section.defaultExpanded}
          >
            {fieldIds.map((fieldId) => {
              const field = FIELD_REGISTRY[fieldId]
              if (!field) return null

              const value = getFieldValue(formData.formData, fieldId)
              const isAiFilled = formData.aiFilledFields.includes(fieldId)

              return (
                <SummaryField
                  key={fieldId}
                  label={field.label}
                  value={value}
                  isAiFilled={isAiFilled}
                  onEdit={() => openEditModal(fieldId)}
                />
              )
            })}
          </SummarySection>
        )
      })}

      {/* Design Section */}
      <SummarySection
        title="Design & Styling"
        icon={Palette}
        defaultOpen={false}
        isEmpty={!formData.designData?.theme && !formData.designData?.style}
      >
        {formData.designData?.theme && (
          <div className="flex items-center justify-between px-2 py-1">
            <span className="text-xs text-muted-foreground">Theme</span>
            <Badge variant="outline" className="text-xs capitalize">
              {formData.designData.theme.replace(/_/g, ' ')}
            </Badge>
          </div>
        )}
        {formData.designData?.style && (
          <div className="flex items-center justify-between px-2 py-1">
            <span className="text-xs text-muted-foreground">Style</span>
            <Badge variant="outline" className="text-xs capitalize">
              {formData.designData.style.replace(/_/g, ' ')}
            </Badge>
          </div>
        )}
        {formData.designData?.resolution && (
          <div className="flex items-center justify-between px-2 py-1">
            <span className="text-xs text-muted-foreground">Resolution</span>
            <Badge variant="outline" className="text-xs uppercase">
              {formData.designData.resolution}
            </Badge>
          </div>
        )}
      </SummarySection>

      {/* Logos Section */}
      <SummarySection
        title={`Logos (${logoData.length} placed)`}
        icon={ImageIcon}
        isEmpty={logoData.length === 0}
        defaultOpen={logoData.length > 0}
      >
        {logoData.map(({ placement, logo }) => (
          <LogoThumbnail
            key={placement.logoId}
            logo={logo}
            placement={placement}
          />
        ))}
      </SummarySection>

      {/* Speaker Photo Section */}
      <SummarySection
        title="Speaker Photo"
        icon={User}
        isEmpty={!speakerPhoto?.enabled || !speakerPhoto?.photoUrl}
        defaultOpen={false}
      >
        {speakerPhoto?.enabled && speakerPhoto?.photoUrl && (
          <SpeakerPhotoThumbnail
            photoUrl={speakerPhoto.photoUrl}
            shape={speakerPhoto.shape}
          />
        )}
      </SummarySection>

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
