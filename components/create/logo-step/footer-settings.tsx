'use client'

import { useCreativeStore } from '@/stores/creative-store'
import { useLandmarkSignatures } from '@/hooks/use-landmark-signatures'
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
  Hash,
  Globe,
  Handshake,
  Palette,
  LayoutGrid,
  AlignLeft,
  AlignCenter,
  ArrowLeftRight,
  ImageIcon,
  Instagram,
  AtSign,
  MapPin,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  LOGO_STRIP_SHAPES,
  type LogoStripShape,
  type FooterLayout,
} from '@/lib/config/design-constants'
import Image from 'next/image'

interface FooterSettingsProps {
  className?: string
}

export function FooterSettings({ className }: FooterSettingsProps) {
  const {
    formData,
    logos,
    setFooterEnabled,
    updateFooterHashtag,
    updateFooterWebsite,
    updateFooterDigitalPartner,
    updateFooterBackground,
    updateFooterConfig,
    setFooterLayout,
    setFooterPartnerLogo,
    updateFooterSignature,
    setFooterSignatureId,
    updateFooterSocialBar,
  } = useCreativeStore()

  // Landmark signatures from separate table
  const { signatures, isLoading: signaturesLoading } = useLandmarkSignatures()

  const footer = formData.enhanced4RowStrip.footer

  // Get selected signature details
  const selectedSignature = footer.signature?.signatureId
    ? signatures.find(s => s.id === footer.signature.signatureId)
    : null

  return (
    <div className={cn('space-y-4', className)}>
      {/* Master Footer Toggle */}
      <div
        className={cn(
          'rounded-xl border transition-all duration-300 p-3',
          footer.enabled
            ? 'border-orange-300 bg-gradient-to-b from-orange-50 to-white/50'
            : 'border-slate-200 bg-white/50'
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-lg',
                footer.enabled
                  ? 'bg-gradient-to-br from-orange-500 to-orange-400 text-white'
                  : 'bg-slate-100 text-slate-500'
              )}
            >
              <LayoutGrid className="h-4 w-4" />
            </div>
            <div>
              <Label className="text-xs font-bold">Footer Bar</Label>
              <p className="text-[10px] text-muted-foreground">
                3-zone layout: Signature | Info | Partner
              </p>
            </div>
          </div>
          <Switch
            checked={footer.enabled}
            onCheckedChange={setFooterEnabled}
          />
        </div>
      </div>

      {footer.enabled && (
        <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* ZONE 1: Signature/Illustration (Left) - From Landmark Signatures */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <div className="rounded-lg border border-teal-200 bg-gradient-to-b from-teal-50/50 to-white p-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-3.5 w-3.5 text-teal-600" />
                <Label className="text-xs font-medium">Landmark Signature</Label>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-teal-100 text-teal-700">Zone 1</span>
              </div>
              <Switch
                checked={footer.signature?.enabled ?? false}
                onCheckedChange={(enabled) => updateFooterSignature({ enabled })}
              />
            </div>
            <p className="text-[10px] text-muted-foreground">
              Watercolor/sketch-style local landmark (left side)
            </p>

            {footer.signature?.enabled && (
              <div className="space-y-2.5 pt-1">
                {/* Landmark Signature Selector */}
                <div className="space-y-1">
                  <Label className="text-[10px]">Select Landmark Signature</Label>
                  {signaturesLoading ? (
                    <div className="flex items-center gap-2 h-9 px-3 border rounded-md bg-slate-50">
                      <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Loading signatures...</span>
                    </div>
                  ) : signatures.length === 0 ? (
                    <div className="flex items-center gap-2 h-9 px-3 border rounded-md bg-amber-50 border-amber-200">
                      <MapPin className="h-3 w-3 text-amber-600" />
                      <span className="text-xs text-amber-700">No signatures uploaded yet</span>
                    </div>
                  ) : (
                    <Select
                      value={footer.signature.signatureId || 'none'}
                      onValueChange={(value) => setFooterSignatureId(value === 'none' ? null : value)}
                    >
                      <SelectTrigger className="h-9 text-xs">
                        {selectedSignature ? (
                          <div className="flex items-center gap-2">
                            {selectedSignature.file_url && (
                              <Image
                                src={selectedSignature.file_url}
                                alt=""
                                width={24}
                                height={24}
                                className="object-contain"
                              />
                            )}
                            <div className="flex flex-col items-start">
                              <span className="text-xs">{selectedSignature.name}</span>
                              {selectedSignature.city && (
                                <span className="text-[9px] text-muted-foreground flex items-center gap-0.5">
                                  <MapPin className="h-2 w-2" />
                                  {selectedSignature.city}
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Select landmark signature</span>
                        )}
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {signatures.map((sig) => (
                          <SelectItem key={sig.id} value={sig.id}>
                            <div className="flex items-center gap-2">
                              {sig.file_url && (
                                <Image
                                  src={sig.file_url}
                                  alt=""
                                  width={20}
                                  height={20}
                                  className="object-contain"
                                />
                              )}
                              <div className="flex flex-col">
                                <span className="text-xs">{sig.name}</span>
                                {sig.city && (
                                  <span className="text-[9px] text-muted-foreground">
                                    {sig.city}{sig.region ? `, ${sig.region}` : ''}
                                  </span>
                                )}
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {/* Signature Width */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px]">Width</Label>
                    <span className="text-[10px] text-muted-foreground">
                      {footer.signature.width}%
                    </span>
                  </div>
                  <Slider
                    value={[footer.signature.width]}
                    onValueChange={([value]) => updateFooterSignature({ width: value })}
                    min={20}
                    max={50}
                    step={5}
                    className="w-full"
                  />
                </div>

                {/* Signature Opacity */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px]">Opacity</Label>
                    <span className="text-[10px] text-muted-foreground">
                      {footer.signature.opacity}%
                    </span>
                  </div>
                  <Slider
                    value={[footer.signature.opacity]}
                    onValueChange={([value]) => updateFooterSignature({ opacity: value })}
                    min={30}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                </div>
              </div>
            )}
          </div>

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* ZONE 2: Center Content (Hashtag + Website + Social Bar) */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <div className="rounded-lg border border-blue-200 bg-gradient-to-b from-blue-50/50 to-white p-3 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">Zone 2 - Center</span>
            </div>

            {/* Hashtag Section */}
            <div className="rounded-md border border-slate-200 p-2.5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Hash className="h-3.5 w-3.5 text-green-600" />
                  <Label className="text-xs font-medium">Hashtag</Label>
                </div>
                <Switch
                  checked={footer.hashtag.enabled}
                  onCheckedChange={(enabled) => updateFooterHashtag({ enabled })}
                />
              </div>
              {footer.hashtag.enabled && (
                <div className="space-y-2">
                  <Input
                    value={footer.hashtag.text}
                    onChange={(e) => updateFooterHashtag({ text: e.target.value })}
                    placeholder="#YIKANNIYAKUMARI"
                    className="h-8 text-xs font-bold"
                  />
                  <div className="flex items-center gap-2">
                    <Label className="text-[10px]">Color</Label>
                    <input
                      type="color"
                      value={footer.hashtag.color || '#0B6D41'}
                      onChange={(e) => updateFooterHashtag({ color: e.target.value })}
                      className="w-6 h-6 rounded border border-slate-200 cursor-pointer"
                    />
                    <span className="text-[10px] text-muted-foreground">{footer.hashtag.color}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Website Section */}
            <div className="rounded-md border border-slate-200 p-2.5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="h-3.5 w-3.5 text-blue-500" />
                  <Label className="text-xs font-medium">Website URL</Label>
                </div>
                <Switch
                  checked={footer.website.enabled}
                  onCheckedChange={(enabled) => updateFooterWebsite({ enabled })}
                />
              </div>
              {footer.website.enabled && (
                <Input
                  value={footer.website.url}
                  onChange={(e) => updateFooterWebsite({ url: e.target.value })}
                  placeholder="www.youngindians.net"
                  className="h-8 text-xs"
                />
              )}
            </div>

            {/* Social Media Bar */}
            <div className="rounded-md border border-slate-200 p-2.5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Instagram className="h-3.5 w-3.5 text-pink-500" />
                  <Label className="text-xs font-medium">Social Media Bar</Label>
                </div>
                <Switch
                  checked={footer.socialBar?.enabled ?? true}
                  onCheckedChange={(enabled) => updateFooterSocialBar({ enabled })}
                />
              </div>
              <p className="text-[10px] text-muted-foreground">
                Dark pill with social handle
              </p>
              {(footer.socialBar?.enabled ?? true) && (
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2">
                    <AtSign className="h-3 w-3 text-slate-400" />
                    <Input
                      value={footer.website.socialHandle || ''}
                      onChange={(e) => updateFooterWebsite({ socialHandle: e.target.value })}
                      placeholder="yi.kanniyakumari"
                      className="h-8 text-xs flex-1"
                    />
                  </div>

                  {/* Social Bar Styling */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[10px]">Bar Background</Label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="color"
                          value={footer.socialBar?.backgroundColor || '#1a1a1a'}
                          onChange={(e) => updateFooterSocialBar({ backgroundColor: e.target.value })}
                          className="w-6 h-6 rounded border cursor-pointer"
                        />
                        <span className="text-[9px] text-muted-foreground">{footer.socialBar?.backgroundColor}</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px]">Text Color</Label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="color"
                          value={footer.socialBar?.textColor || '#FFFFFF'}
                          onChange={(e) => updateFooterSocialBar({ textColor: e.target.value })}
                          className="w-6 h-6 rounded border cursor-pointer"
                        />
                        <span className="text-[9px] text-muted-foreground">{footer.socialBar?.textColor}</span>
                      </div>
                    </div>
                  </div>

                  {/* Border Radius */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-[10px]">Pill Radius</Label>
                      <span className="text-[10px] text-muted-foreground">
                        {footer.socialBar?.borderRadius || 20}px
                      </span>
                    </div>
                    <Slider
                      value={[footer.socialBar?.borderRadius || 20]}
                      onValueChange={([value]) => updateFooterSocialBar({ borderRadius: value })}
                      min={0}
                      max={30}
                      step={2}
                      className="w-full"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* ZONE 3: Digital Partner (Right) - v20.9: Reverted back to "Digital Partner" */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <div className="rounded-lg border border-orange-200 bg-gradient-to-b from-orange-50/50 to-white p-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Handshake className="h-3.5 w-3.5 text-orange-500" />
                <Label className="text-xs font-medium">Digital Partner</Label>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-orange-100 text-orange-700">Zone 3</span>
              </div>
              <Switch
                checked={footer.digitalPartner.enabled}
                onCheckedChange={(enabled) =>
                  updateFooterDigitalPartner({ enabled })
                }
              />
            </div>
            {footer.digitalPartner.enabled && (
              <div className="space-y-2.5">
                {/* Label & Label Color */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[10px]">Label Text</Label>
                    <Input
                      value={footer.digitalPartner.labelText}
                      onChange={(e) =>
                        updateFooterDigitalPartner({ labelText: e.target.value })
                      }
                      placeholder="Digital Partner"
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px]">Label Color</Label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={footer.digitalPartner.labelColor || '#9CA3AF'}
                        onChange={(e) => updateFooterDigitalPartner({ labelColor: e.target.value })}
                        className="w-6 h-6 rounded border cursor-pointer"
                      />
                      <span className="text-[9px] text-muted-foreground">{footer.digitalPartner.labelColor}</span>
                    </div>
                  </div>
                </div>

                {/* Partner Logo Selector */}
                <div className="space-y-1">
                  <Label className="text-[10px]">Partner Logo</Label>
                  <Select
                    value={footer.digitalPartner.logoId || ''}
                    onValueChange={setFooterPartnerLogo}
                  >
                    <SelectTrigger className="h-9 text-xs">
                      {footer.digitalPartner.logoId ? (
                        <div className="flex items-center gap-2">
                          {logos.find(l => l.id === footer.digitalPartner.logoId)?.file_url && (
                            <Image
                              src={logos.find(l => l.id === footer.digitalPartner.logoId)!.file_url!}
                              alt=""
                              width={20}
                              height={20}
                              className="object-contain"
                            />
                          )}
                          <span>{logos.find(l => l.id === footer.digitalPartner.logoId)?.name}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Select partner logo</span>
                      )}
                    </SelectTrigger>
                    <SelectContent>
                      {logos.map((logo) => (
                        <SelectItem key={logo.id} value={logo.id}>
                          <div className="flex items-center gap-2">
                            {logo.file_url && (
                              <Image
                                src={logo.file_url}
                                alt=""
                                width={20}
                                height={20}
                                className="object-contain"
                              />
                            )}
                            <span className="text-xs">{logo.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Agency Name */}
                <div className="space-y-1">
                  <Label className="text-[10px]">Agency Name / Link (optional)</Label>
                  <Input
                    value={footer.digitalPartner.agencyName || ''}
                    onChange={(e) => updateFooterDigitalPartner({ agencyName: e.target.value })}
                    placeholder="www.artic9.com"
                    className="h-7 text-xs"
                  />
                </div>

                {/* Logo Size Slider */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px]">Logo Size</Label>
                    <span className="text-[10px] text-muted-foreground">
                      {footer.digitalPartner.logoSize}px
                    </span>
                  </div>
                  <Slider
                    value={[footer.digitalPartner.logoSize]}
                    onValueChange={([value]) =>
                      updateFooterDigitalPartner({ logoSize: value })
                    }
                    min={30}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                </div>
              </div>
            )}
          </div>

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* FOOTER STYLING */}
          {/* ═══════════════════════════════════════════════════════════════ */}

          {/* Layout Selector */}
          <div className="rounded-lg border border-slate-200 p-3 space-y-2.5">
            <div className="flex items-center gap-2">
              <LayoutGrid className="h-3.5 w-3.5 text-purple-500" />
              <Label className="text-xs font-medium">Layout</Label>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setFooterLayout('spread')}
                className={cn(
                  'flex flex-col items-center gap-1 p-2 rounded-lg border transition-all',
                  footer.layout === 'spread'
                    ? 'border-primary bg-primary/5'
                    : 'border-slate-200 hover:border-slate-300'
                )}
              >
                <ArrowLeftRight className="h-4 w-4" />
                <span className="text-[9px]">Spread</span>
              </button>
              <button
                onClick={() => setFooterLayout('center')}
                className={cn(
                  'flex flex-col items-center gap-1 p-2 rounded-lg border transition-all',
                  footer.layout === 'center'
                    ? 'border-primary bg-primary/5'
                    : 'border-slate-200 hover:border-slate-300'
                )}
              >
                <AlignCenter className="h-4 w-4" />
                <span className="text-[9px]">Center</span>
              </button>
              <button
                onClick={() => setFooterLayout('left-right')}
                className={cn(
                  'flex flex-col items-center gap-1 p-2 rounded-lg border transition-all',
                  footer.layout === 'left-right'
                    ? 'border-primary bg-primary/5'
                    : 'border-slate-200 hover:border-slate-300'
                )}
              >
                <AlignLeft className="h-4 w-4" />
                <span className="text-[9px]">Left/Right</span>
              </button>
            </div>
          </div>

          {/* Footer Background Settings */}
          <div className="rounded-lg border border-slate-200 p-3 space-y-2.5">
            <div className="flex items-center gap-2">
              <Palette className="h-3.5 w-3.5 text-pink-500" />
              <Label className="text-xs font-medium">Footer Background</Label>
            </div>

            {/* Background Color */}
            <div className="flex items-center justify-between">
              <Label className="text-[10px]">Color</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={footer.background.color}
                  onChange={(e) => updateFooterBackground({ color: e.target.value })}
                  className="w-7 h-7 rounded border border-slate-200 cursor-pointer"
                />
                <Input
                  value={footer.background.color}
                  onChange={(e) => updateFooterBackground({ color: e.target.value })}
                  className="w-20 h-7 text-xs"
                />
              </div>
            </div>

            {/* Opacity Slider */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-[10px]">Opacity</Label>
                <span className="text-[10px] text-muted-foreground">
                  {footer.background.opacity}%
                </span>
              </div>
              <Slider
                value={[footer.background.opacity]}
                onValueChange={([value]) => updateFooterBackground({ opacity: value })}
                min={10}
                max={100}
                step={5}
                className="w-full"
              />
            </div>

            {/* Shape Selector */}
            <div className="space-y-1">
              <Label className="text-[10px]">Shape</Label>
              <Select
                value={footer.background.shape}
                onValueChange={(value: LogoStripShape) =>
                  updateFooterBackground({ shape: value })
                }
              >
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(LOGO_STRIP_SHAPES).map((shape) => (
                    <SelectItem key={shape.value} value={shape.value}>
                      {shape.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Border Radius for Tab Look */}
            <div className="space-y-1">
              <Label className="text-[10px]">Corner Style</Label>
              <Select
                value={footer.background.borderRadius || '0'}
                onValueChange={(value) => updateFooterBackground({ borderRadius: value })}
              >
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Square</SelectItem>
                  <SelectItem value="20px 20px 0 0">Rounded Top (Small)</SelectItem>
                  <SelectItem value="40px 40px 0 0">Rounded Top (Large)</SelectItem>
                  <SelectItem value="20px">All Rounded</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Footer Typography Settings */}
          <div className="rounded-lg border border-slate-200 p-3 space-y-2.5">
            <Label className="text-xs font-medium">Typography</Label>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label className="text-[10px]">Size</Label>
                <Input
                  type="number"
                  value={footer.fontSize}
                  onChange={(e) =>
                    updateFooterConfig({ fontSize: parseInt(e.target.value) || 14 })
                  }
                  min={10}
                  max={24}
                  className="h-7 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px]">Weight</Label>
                <Select
                  value={footer.fontWeight}
                  onValueChange={(value: 'normal' | 'medium' | 'semibold' | 'bold') =>
                    updateFooterConfig({ fontWeight: value })
                  }
                >
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="semibold">Semibold</SelectItem>
                    <SelectItem value="bold">Bold</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px]">Text Color</Label>
                <div className="flex items-center gap-1">
                  <input
                    type="color"
                    value={footer.textColor}
                    onChange={(e) => updateFooterConfig({ textColor: e.target.value })}
                    className="w-7 h-7 rounded border cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer Height */}
          <div className="rounded-lg border border-slate-200 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium">Footer Height</Label>
              <span className="text-[10px] text-muted-foreground">
                {footer.height}px
              </span>
            </div>
            <Slider
              value={[footer.height]}
              onValueChange={([value]) => updateFooterConfig({ height: value })}
              min={60}
              max={120}
              step={5}
              className="w-full"
            />
          </div>
        </div>
      )}
    </div>
  )
}
