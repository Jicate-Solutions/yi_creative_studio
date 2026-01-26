'use client'

import { useCreativeStore } from '@/stores/creative-store'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Layers,
  Hash,
  Globe,
  Handshake,
  ChevronRight,
  X,
  ImageIcon,
  Paintbrush,
  Instagram,
  AtSign,
  Bookmark,
  GripVertical,
} from 'lucide-react'
import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { toast } from 'sonner'
import { FooterPresetSelector } from '@/components/create/footer-preset-selector'
import { SaveFooterPresetDialog } from '@/components/create/save-footer-preset-dialog'
import { VerticalPresetSelector } from '@/components/create/vertical-preset-selector'
import { InitiativePresetSelector } from '@/components/create/initiative-preset-selector'
import { SaveInitiativePresetDialog } from '@/components/create/save-initiative-preset-dialog'
import { SaveVerticalPresetDialog } from '@/components/create/save-vertical-preset-dialog'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import { detectLogoType, LOGO_TYPE_CONFIGS } from '@/lib/config/logo-locks'

interface EnhancedStripSettingsProps {
  className?: string
}

// Sortable Logo Component for ROW 2 drag-and-drop
interface SortableLogoProps {
  logoId: string
  logo: { id: string; name: string | null; file_url: string | null }
  onRemove: (logoId: string) => void
}

function SortableLogo({ logoId, logo, onRemove }: SortableLogoProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: logoId })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative flex items-center justify-center bg-slate-50 rounded-lg p-2 h-20 min-w-[80px] transition-all group',
        isDragging && 'ring-2 ring-primary shadow-lg'
      )}
      title={logo.name || 'Logo'}
    >
      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        className="absolute top-1 left-1 p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-slate-200 cursor-grab active:cursor-grabbing transition-opacity"
        title="Drag to reorder"
      >
        <GripVertical className="h-3 w-3 text-slate-400" />
      </button>

      {/* Logo Image */}
      {logo.file_url ? (
        <Image
          src={logo.file_url}
          alt={logo.name || 'Logo'}
          width={90}
          height={60}
          className="object-contain max-h-8"
          unoptimized
        />
      ) : (
        <span className="text-[8px] text-slate-400 truncate">{logo.name}</span>
      )}

      {/* Remove button */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onRemove(logoId)
        }}
        className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
      >
        <X className="h-2.5 w-2.5" />
      </button>
    </div>
  )
}

export function EnhancedStripSettings({ className }: EnhancedStripSettingsProps) {
  const {
    formData,
    logos,
    setEnhanced4RowEnabled,
    updateInitiativeText,
    setEnhanced4RowVersion,
    setFooterEnabled,
    updateFooterHashtag,
    updateFooterWebsite,
    updateFooterDigitalPartner,
    updateFooterBackground,
    setFooterPartnerLogo,
    addVerticalLogo4Row,
    removeVerticalLogo4Row,
    set4RowVerticalEnabled,
    reorderVerticalLogos4Row,
    // v9.0: Zone 1 signature actions
    updateFooterSignature,
    setFooterSignatureLogo,
    updateFooterSocialBar,
    // Footer Preset actions
    applyFooterPreset,
  } = useCreativeStore()

  // Preset dialog states
  const [showSavePresetDialog, setShowSavePresetDialog] = useState(false)
  const [showSaveVerticalPresetDialog, setShowSaveVerticalPresetDialog] = useState(false)
  const [showSaveInitiativePresetDialog, setShowSaveInitiativePresetDialog] = useState(false)

  // Drag-and-drop sensors for ROW 2
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // 5px movement required before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Handle drag end for ROW 2 (Program Logos)
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = enhanced4Row.rows.vertical.logoIds.indexOf(active.id as string)
      const newIndex = enhanced4Row.rows.vertical.logoIds.indexOf(over.id as string)

      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(enhanced4Row.rows.vertical.logoIds, oldIndex, newIndex)
        reorderVerticalLogos4Row(newOrder)
        toast.success('Logo order updated')
      }
    }
  }

  const enhanced4Row = formData.enhanced4RowStrip
  const footer = enhanced4Row.footer

  // Get unique brand logos - ONE per brand type (yi-main, bharat-rising, cii-main)
  // This prevents duplicate Bharat logos from pushing CII out of position 3
  const brandLogosByType = new Map<string, typeof logos[0]>()
  const CONFIG_KEY_ORDER = ['yi-main', 'bharat-rising', 'cii-main']

  logos.forEach((logo) => {
    const logoType = detectLogoType(logo.name || '')
    if (logoType !== 'brand') return

    // Find which config key this logo matches
    for (const [key, config] of Object.entries(LOGO_TYPE_CONFIGS)) {
      if (config.type === 'brand' && config.patterns.some(p => p.test(logo.name || ''))) {
        // Only keep first logo found for each brand type
        if (!brandLogosByType.has(key)) {
          brandLogosByType.set(key, logo)
        }
        break
      }
    }
  })

  // Sort by explicit order: Yi (1st), Bharat (2nd), CII (3rd)
  const brandLogos = CONFIG_KEY_ORDER
    .map(key => brandLogosByType.get(key))
    .filter((logo): logo is typeof logos[0] => logo !== undefined)

  return (
    <div className={cn('space-y-4', className)}>
      {/* Master Toggle Card */}
      <div
        className={cn(
          'rounded-2xl border-2 transition-all duration-300 p-4',
          enhanced4Row.enabled
            ? 'border-primary bg-gradient-to-br from-primary/5 via-white to-primary/5 shadow-lg'
            : 'border-slate-200 bg-white/50'
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'flex h-11 w-11 items-center justify-center rounded-xl shadow-md',
                enhanced4Row.enabled
                  ? 'bg-gradient-to-br from-primary to-primary/80 text-white'
                  : 'bg-slate-100 text-slate-400'
              )}
            >
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <Label className="text-sm font-bold">Logo Strip</Label>
              <p className="text-[11px] text-muted-foreground">
                Add brand logos and chapter info
              </p>
            </div>
          </div>
          <Switch
            checked={enhanced4Row.enabled}
            onCheckedChange={(enabled) => {
              setEnhanced4RowEnabled(enabled)
              if (enabled) {
                setEnhanced4RowVersion('4-row-split')
                setFooterEnabled(true)
              }
            }}
          />
        </div>
      </div>

      {/* Content when enabled */}
      {enhanced4Row.enabled && (
        <div className="space-y-3 animate-in slide-in-from-top-2 duration-300">

          {/* ROW 1 - Brand Logos Preview (Auto-detected) */}
          <div className="rounded-xl border bg-white p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-700">
                <span className="text-[10px] text-slate-400 mr-1.5 font-normal">ROW 1</span>
                Brand Logos
              </span>
              <span className="text-[10px] text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                Auto-detected
              </span>
            </div>
            {brandLogos.length > 0 ? (
              <div className="flex items-center gap-3">
                {brandLogos.map((logo) => (
                  <div
                    key={logo.id}
                    className="flex-1 flex items-center justify-center bg-slate-50 rounded-lg p-2 h-24"
                  >
                    {logo.file_url ? (
                      <Image
                        src={logo.file_url}
                        alt={logo.name || 'Logo'}
                        width={120}
                        height={80}
                        className="object-contain max-h-8"
                        unoptimized
                      />
                    ) : (
                      <span className="text-[8px] text-slate-400 truncate">{logo.name}</span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[10px] text-slate-400 text-center py-2">
                Upload Yi, Bharat ONE, or CII logos in Logo Library
              </p>
            )}
          </div>

          {/* ROW 2 - Program Logos */}
          <div className="rounded-xl border bg-white p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-700">
                <span className="text-[10px] text-slate-400 mr-1.5 font-normal">ROW 2</span>
                Program Logos
              </span>
              <div className="flex items-center gap-2">
                <VerticalPresetSelector
                  onSaveClick={() => setShowSaveVerticalPresetDialog(true)}
                />
                <Switch
                  checked={enhanced4Row.rows.vertical.enabled}
                  onCheckedChange={set4RowVerticalEnabled}
                />
              </div>
            </div>
            {enhanced4Row.rows.vertical.enabled && (
              <div className="space-y-2">
                <Select onValueChange={addVerticalLogo4Row}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Add program logo (max 6)" />
                  </SelectTrigger>
                  <SelectContent>
                    {logos
                      .filter(l => !enhanced4Row.rows.vertical.logoIds.includes(l.id))
                      .filter(l => l.id !== footer.digitalPartner.logoId) // v19.0: Exclude Digital Partner logo
                      .map((logo) => (
                        <SelectItem key={logo.id} value={logo.id}>
                          <div className="flex items-center gap-2">
                            {logo.file_url ? (
                              <Image
                                src={logo.file_url}
                                alt=""
                                width={32}
                                height={32}
                                className="object-contain" // removed unoptimized
                                unoptimized
                              />
                            ) : (
                              <ImageIcon className="h-4 w-4 text-slate-300" />
                            )}
                            <span className="text-xs truncate">{logo.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {enhanced4Row.rows.vertical.logoIds.length > 0 && (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={enhanced4Row.rows.vertical.logoIds}
                      strategy={horizontalListSortingStrategy}
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        {enhanced4Row.rows.vertical.logoIds.map((logoId) => {
                          const logo = logos.find(l => l.id === logoId)
                          return logo ? (
                            <SortableLogo
                              key={logoId}
                              logoId={logoId}
                              logo={logo}
                              onRemove={removeVerticalLogo4Row}
                            />
                          ) : null
                        })}
                      </div>
                    </SortableContext>
                  </DndContext>
                )}
                <p className="text-[10px] text-slate-400">
                  {enhanced4Row.rows.vertical.logoIds.length}/6 logos selected
                  {enhanced4Row.rows.vertical.logoIds.length > 1 && (
                    <span className="ml-2 text-primary">• Drag to reorder</span>
                  )}
                </p>
              </div>
            )}
          </div>

          {/* ROW 3 - Chapter Name / Initiative Text */}
          <div className="rounded-xl border bg-white p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-700">
                <span className="text-[10px] text-slate-400 mr-1.5 font-normal">ROW 3</span>
                Chapter Name
              </span>
              <Switch
                checked={enhanced4Row.rows.initiative.enabled}
                onCheckedChange={(enabled) => updateInitiativeText({ enabled })}
              />
            </div>
            {enhanced4Row.rows.initiative.enabled && (
              <div className="space-y-2">
                {/* Preset Selector */}
                <div className="flex items-center justify-between bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg p-2 border border-slate-200">
                  <div className="flex items-center gap-2">
                    <Bookmark className="h-3.5 w-3.5 text-slate-600" />
                    <span className="text-[10px] font-medium text-slate-700">
                      Saved Texts
                    </span>
                  </div>
                  <InitiativePresetSelector
                    onSaveClick={() => setShowSaveInitiativePresetDialog(true)}
                  />
                </div>
                {/* Text Input */}
                <Input
                  value={enhanced4Row.rows.initiative.text}
                  onChange={(e) => updateInitiativeText({ text: e.target.value })}
                  placeholder="Yi Erode Initiative"
                  className="h-9 text-sm"
                />
              </div>
            )}
          </div>

          {/* Footer Section (ROW 4) */}
          <div className="rounded-xl border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-white p-3 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-orange-500 flex items-center justify-center">
                  <ChevronRight className="h-4 w-4 text-white" />
                </div>
                <span className="text-xs font-bold text-orange-700">
                  <span className="text-[10px] text-orange-400 mr-1.5 font-normal">ROW 4</span>
                  Footer Bar
                </span>
              </div>
              <Switch
                checked={footer.enabled}
                onCheckedChange={setFooterEnabled}
              />
            </div>

            {footer.enabled && (
              <div className="space-y-3 pt-1">
                {/* ═══════════════════════════════════════════════════════════════ */}
                {/* FOOTER PRESETS - Save & Load footer configurations */}
                {/* ═══════════════════════════════════════════════════════════════ */}
                <div className="flex items-center justify-between bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg p-2.5 border border-orange-200">
                  <div className="flex items-center gap-2">
                    <Bookmark className="h-3.5 w-3.5 text-orange-600" />
                    <span className="text-[10px] font-medium text-orange-800">
                      Footer Presets
                    </span>
                    <span className="text-[9px] text-orange-500">
                      Save & reuse configurations
                    </span>
                  </div>
                  <FooterPresetSelector
                    onSaveClick={() => setShowSavePresetDialog(true)}
                  />
                </div>

                {/* ═══════════════════════════════════════════════════════════════ */}
                {/* ZONE 1: Signature Illustration (Left) - NEW v9.0 */}
                {/* ═══════════════════════════════════════════════════════════════ */}
                <div className="rounded-lg border border-teal-200 bg-gradient-to-b from-teal-50/50 to-white p-2.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Paintbrush className="h-3.5 w-3.5 text-teal-600" />
                      <span className="text-[10px] font-medium text-teal-700">Zone 1 - Signature</span>
                    </div>
                    <Switch
                      checked={footer.signature?.enabled ?? false}
                      onCheckedChange={(enabled) => updateFooterSignature({ enabled })}
                    />
                  </div>
                  <p className="text-[9px] text-muted-foreground">
                    Watercolor/sketch landmark illustration (left side)
                  </p>

                  {footer.signature?.enabled && (
                    <div className="space-y-2">
                      {/* Signature Logo Selector */}
                      <Select
                        value={footer.signature.logoId || 'none'}
                        onValueChange={(value) => setFooterSignatureLogo(value === 'none' ? null : value)}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          {footer.signature.logoId ? (
                            <div className="flex items-center gap-2">
                              {logos.find(l => l.id === footer.signature.logoId)?.file_url && (
                                <Image
                                  src={logos.find(l => l.id === footer.signature.logoId)!.file_url!}
                                  alt=""
                                  width={20}
                                  height={20}
                                  className="object-contain"
                                />
                              )}
                              <span className="truncate">{logos.find(l => l.id === footer.signature.logoId)?.name}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Select signature image</span>
                          )}
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {logos.map((logo) => (
                            <SelectItem key={logo.id} value={logo.id}>
                              <div className="flex items-center gap-2">
                                {logo.file_url && (
                                  <Image
                                    src={logo.file_url}
                                    alt=""
                                    width={32}
                                    height={32}
                                    className="object-contain"
                                  />
                                )}
                                <span className="text-xs">{logo.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {/* Width Slider */}
                      <div className="flex items-center justify-between gap-3">
                        <Label className="text-[9px] text-muted-foreground">Width</Label>
                        <div className="flex items-center gap-2 flex-1">
                          <Slider
                            value={[footer.signature.width || 35]}
                            onValueChange={([value]) => updateFooterSignature({ width: value })}
                            min={20}
                            max={50}
                            step={5}
                            className="flex-1"
                          />
                          <span className="text-[9px] w-8 text-right">{footer.signature.width || 35}%</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* ═══════════════════════════════════════════════════════════════ */}
                {/* ZONE 2: Center Content (Hashtag + Website + Social) */}
                {/* ═══════════════════════════════════════════════════════════════ */}
                <div className="rounded-lg border border-blue-200 bg-gradient-to-b from-blue-50/50 to-white p-2.5 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-medium text-blue-700">Zone 2 - Center Info</span>
                  </div>

                  {/* Hashtag */}
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-white border">
                    <Hash className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <Input
                      value={footer.hashtag.text}
                      onChange={(e) => updateFooterHashtag({ text: e.target.value, enabled: true })}
                      placeholder="#YIERODE"
                      className="h-7 text-xs border-0 p-0 focus-visible:ring-0 font-bold"
                    />
                    <input
                      type="color"
                      value={footer.hashtag.color || '#0B6D41'}
                      onChange={(e) => updateFooterHashtag({ color: e.target.value })}
                      className="w-5 h-5 rounded border cursor-pointer flex-shrink-0"
                    />
                  </div>

                  {/* Website */}
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-white border">
                    <Globe className="h-4 w-4 text-blue-500 flex-shrink-0" />
                    <Input
                      value={footer.website.url}
                      onChange={(e) => updateFooterWebsite({ url: e.target.value, enabled: true })}
                      placeholder="www.youngindians.net"
                      className="h-7 text-xs border-0 p-0 focus-visible:ring-0"
                    />
                  </div>

                  {/* Social Handle */}
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-white border">
                    <Instagram className="h-4 w-4 text-pink-500 flex-shrink-0" />
                    <AtSign className="h-3 w-3 text-slate-400 -ml-1" />
                    <Input
                      value={footer.website.socialHandle || ''}
                      onChange={(e) => updateFooterWebsite({ socialHandle: e.target.value })}
                      placeholder="yi.erode"
                      className="h-7 text-xs border-0 p-0 focus-visible:ring-0"
                    />
                  </div>
                </div>

                {/* ═══════════════════════════════════════════════════════════════ */}
                {/* ZONE 3: Digital Partner (Right) */}
                {/* ═══════════════════════════════════════════════════════════════ */}
                <div className="rounded-lg border border-orange-200 bg-gradient-to-b from-orange-50/50 to-white p-2.5 space-y-2">
                  <div className="flex items-center gap-2">
                    <Handshake className="h-3.5 w-3.5 text-orange-500" />
                    <span className="text-[10px] font-medium text-orange-700">Zone 3 - Digital Partner</span>
                  </div>

                  {/* Partner Logo Selector */}
                  <Select
                    value={footer.digitalPartner.logoId || ''}
                    onValueChange={setFooterPartnerLogo}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      {footer.digitalPartner.logoId ? (
                        <div className="flex items-center gap-2">
                          {logos.find(l => l.id === footer.digitalPartner.logoId)?.file_url && (
                            <Image
                              src={logos.find(l => l.id === footer.digitalPartner.logoId)!.file_url!}
                              alt=""
                              width={18}
                              height={18}
                              className="object-contain"
                            />
                          )}
                          <span className="truncate">{logos.find(l => l.id === footer.digitalPartner.logoId)?.name}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Select partner logo</span>
                      )}
                    </SelectTrigger>
                    <SelectContent>
                      {logos.map((logo) => (
                        <SelectItem key={logo.id} value={logo.id}>
                          <div className="flex items-center gap-2">
                            {logo.file_url ? (
                              <Image
                                src={logo.file_url}
                                alt=""
                                width={32}
                                height={32}
                                className="object-contain"
                                unoptimized
                              />
                            ) : (
                              <ImageIcon className="h-4 w-4 text-slate-300" />
                            )}
                            <span className="text-xs truncate max-w-[100px]">{logo.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Footer Color */}
                <div className="flex items-center justify-between p-2 rounded-lg bg-white border">
                  <span className="text-xs text-slate-600">Bar Color</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={footer.background.color}
                      onChange={(e) => updateFooterBackground({ color: e.target.value })}
                      className="w-7 h-7 rounded border cursor-pointer"
                    />
                    <span className="text-[10px] text-slate-400 font-mono">
                      {footer.background.color}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer Preset Save Dialog */}
      <SaveFooterPresetDialog
        open={showSavePresetDialog}
        onOpenChange={setShowSavePresetDialog}
      />

      {/* Vertical Logo Preset Save Dialog */}
      <SaveVerticalPresetDialog
        open={showSaveVerticalPresetDialog}
        onOpenChange={setShowSaveVerticalPresetDialog}
      />

      {/* Initiative/Chapter Name Preset Save Dialog */}
      <SaveInitiativePresetDialog
        open={showSaveInitiativePresetDialog}
        onOpenChange={setShowSaveInitiativePresetDialog}
      />
    </div>
  )
}
