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
  Hash,
  Globe,
  Handshake,
  ChevronRight,
  ImageIcon,
  Paintbrush,
  Instagram,
  AtSign,
  Bookmark,
} from 'lucide-react'
import { useState } from 'react'
import { FooterPresetSelector } from '@/components/create/footer-preset-selector'
import { SaveFooterPresetDialog } from '@/components/create/save-footer-preset-dialog'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import { useLandmarkSignatures } from '@/hooks/use-landmark-signatures'

interface FooterBarSettingsProps {
  className?: string
}

export function FooterBarSettings({ className }: FooterBarSettingsProps) {
  const {
    formData,
    logos,
    setFooterEnabled,
    updateFooterHashtag,
    updateFooterWebsite,
    updateFooterDigitalPartner,
    updateFooterBackground,
    setFooterPartnerLogo,
    updateFooterSignature,
    setFooterSignatureLogo,
    updateFooterSocialBar,
  } = useCreativeStore()

  const { signatures: landmarkSignatures } = useLandmarkSignatures()
  const [showSavePresetDialog, setShowSavePresetDialog] = useState(false)

  const enhanced4Row = formData.enhanced4RowStrip
  const footer = enhanced4Row.footer

  return (
    <div className={cn('space-y-2', className)}>
      {/* Footer Toggle Header */}
      <div className={cn(
        'rounded-lg border-2 transition-all p-2',
        footer.enabled ? 'border-orange-300 bg-orange-50/50' : 'border-muted'
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-orange-500 flex items-center justify-center">
              <ChevronRight className="h-3 w-3 text-white" />
            </div>
            <Label className="text-[10px] font-bold text-orange-700">Footer Bar</Label>
          </div>
          <Switch checked={footer.enabled} onCheckedChange={setFooterEnabled} />
        </div>
      </div>

      {footer.enabled && (
        <>
          {/* Footer Presets */}
          <div className="flex items-center justify-between bg-orange-50 rounded-lg p-1.5 border border-orange-200">
            <div className="flex items-center gap-1">
              <Bookmark className="h-2.5 w-2.5 text-orange-600" />
              <span className="text-[8px] font-medium text-orange-800">Footer Presets</span>
            </div>
            <FooterPresetSelector onSaveClick={() => setShowSavePresetDialog(true)} />
          </div>

          {/* Zone 1: Signature */}
          <div className="rounded-lg border border-teal-200 bg-teal-50/30 p-2 space-y-1">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1">
                  <Paintbrush className="h-2.5 w-2.5 text-teal-600" />
                  <span className="text-[9px] font-medium text-teal-700">🎨 Signature/Illustration</span>
                </div>
                <p className="text-[8px] text-muted-foreground">Watercolor landmark image (left side)</p>
              </div>
              <div className="flex items-center gap-1">
                {footer.signature?.enabled ? (
                  <span className="text-[7px] bg-green-100 text-green-700 px-1 rounded">VISIBLE</span>
                ) : (
                  <span className="text-[7px] bg-gray-100 text-gray-500 px-1 rounded">HIDDEN</span>
                )}
                <Switch
                  checked={footer.signature?.enabled ?? false}
                  onCheckedChange={(enabled) => updateFooterSignature({ enabled })}
                />
              </div>
            </div>

            {footer.signature?.enabled && (
              <div className="space-y-1">
                {/* Signature Selector - from landmark_signatures table */}
                <Select
                  value={footer.signature.signatureId || footer.signature.logoId || 'none'}
                  onValueChange={(value) => {
                    if (value === 'none') {
                      updateFooterSignature({ signatureId: undefined, logoId: undefined })
                    } else if (landmarkSignatures.some(s => s.id === value)) {
                      updateFooterSignature({ signatureId: value, logoId: undefined })
                    } else {
                      setFooterSignatureLogo(value)
                    }
                  }}
                >
                  <SelectTrigger className="h-5 text-[8px]">
                    {(footer.signature.signatureId || footer.signature.logoId) ? (
                      <div className="flex items-center gap-1">
                        {(() => {
                          const sig = landmarkSignatures.find(s => s.id === footer.signature.signatureId)
                          const logo = logos.find(l => l.id === footer.signature.logoId)
                          const item = sig || logo
                          return item?.file_url ? (
                            <>
                              <Image src={item.file_url} alt="" width={14} height={14} className="object-contain" />
                              <span className="truncate">{item.name}</span>
                            </>
                          ) : <span>Select signature</span>
                        })()}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Select signature</span>
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {/* Landmark Signatures */}
                    {landmarkSignatures.length > 0 && (
                      <>
                        <div className="px-2 py-1 text-[8px] text-muted-foreground font-medium">Landmarks</div>
                        {landmarkSignatures.map((sig) => (
                          <SelectItem key={sig.id} value={sig.id}>
                            <div className="flex items-center gap-1">
                              {sig.file_url && <Image src={sig.file_url} alt="" width={20} height={20} className="object-contain" />}
                              <span className="text-[9px]">{sig.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </>
                    )}
                    {/* Logos fallback */}
                    <div className="px-2 py-1 text-[8px] text-muted-foreground font-medium">Logos</div>
                    {logos.map((logo) => (
                      <SelectItem key={logo.id} value={logo.id}>
                        <div className="flex items-center gap-1">
                          {logo.file_url && <Image src={logo.file_url} alt="" width={20} height={20} className="object-contain" />}
                          <span className="text-[9px]">{logo.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Width Slider */}
                <div className="flex items-center gap-2">
                  <Label className="text-[8px] text-muted-foreground w-8">Width</Label>
                  <Slider
                    value={[footer.signature.width || 35]}
                    onValueChange={([value]) => updateFooterSignature({ width: value })}
                    min={20}
                    max={50}
                    step={5}
                    className="flex-1"
                  />
                  <span className="text-[8px] w-6">{footer.signature.width || 35}%</span>
                </div>
              </div>
            )}
          </div>

          {/* Zone 2: Center Info */}
          <div className="rounded-lg border border-blue-200 bg-blue-50/30 p-2 space-y-1">
            <div className="flex items-center justify-between mb-1">
              <div>
                <span className="text-[9px] font-medium text-blue-700">📍 Event Information</span>
                <p className="text-[8px] text-muted-foreground">Hashtag, website & social (center)</p>
              </div>
              <span className="text-[7px] bg-green-100 text-green-700 px-1 rounded">ALWAYS ON</span>
            </div>

            {/* Hashtag */}
            <div className="flex items-center gap-1 p-1 rounded bg-white border">
              <Hash className="h-3 w-3 text-green-600 shrink-0" />
              <Input
                value={footer.hashtag.text}
                onChange={(e) => updateFooterHashtag({ text: e.target.value, enabled: true })}
                placeholder="#YIERODE"
                className="h-5 text-[9px] border-0 p-0 focus-visible:ring-0 font-bold"
              />
              <input
                type="color"
                value={footer.hashtag.color || '#0B6D41'}
                onChange={(e) => updateFooterHashtag({ color: e.target.value })}
                className="w-4 h-4 rounded border cursor-pointer shrink-0"
              />
            </div>

            {/* Website */}
            <div className="flex items-center gap-1 p-1 rounded bg-white border">
              <Globe className="h-3 w-3 text-blue-500 shrink-0" />
              <Input
                value={footer.website.url}
                onChange={(e) => updateFooterWebsite({ url: e.target.value, enabled: true })}
                placeholder="www.youngindians.net"
                className="h-5 text-[9px] border-0 p-0 focus-visible:ring-0"
              />
            </div>

            {/* Social Handle */}
            <div className="flex items-center gap-1 p-1 rounded bg-white border">
              <Instagram className="h-3 w-3 text-pink-500 shrink-0" />
              <AtSign className="h-2 w-2 text-slate-400 -ml-0.5" />
              <Input
                value={footer.website.socialHandle || ''}
                onChange={(e) => updateFooterWebsite({ socialHandle: e.target.value })}
                placeholder="yi.erode"
                className="h-5 text-[9px] border-0 p-0 focus-visible:ring-0"
              />
            </div>
          </div>

          {/* Zone 3: Digital Partner */}
          <div className="rounded-lg border border-orange-200 bg-orange-50/30 p-2 space-y-1">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1">
                  <Handshake className="h-2.5 w-2.5 text-orange-500" />
                  <span className="text-[9px] font-medium text-orange-700">🤝 Digital Partner</span>
                </div>
                <p className="text-[8px] text-muted-foreground">Partner/sponsor logo (right side)</p>
              </div>
              {footer.digitalPartner.logoId ? (
                <span className="text-[7px] bg-green-100 text-green-700 px-1 rounded">SET</span>
              ) : (
                <span className="text-[7px] bg-amber-100 text-amber-700 px-1 rounded">NOT SET</span>
              )}
            </div>

            {/* Partner Logo Selector */}
            <Select
              value={footer.digitalPartner.logoId || ''}
              onValueChange={setFooterPartnerLogo}
            >
              <SelectTrigger className="h-5 text-[8px]">
                {footer.digitalPartner.logoId ? (
                  <div className="flex items-center gap-1">
                    {logos.find(l => l.id === footer.digitalPartner.logoId)?.file_url && (
                      <Image
                        src={logos.find(l => l.id === footer.digitalPartner.logoId)!.file_url!}
                        alt=""
                        width={14}
                        height={14}
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
                    <div className="flex items-center gap-1">
                      {logo.file_url ? (
                        <Image src={logo.file_url} alt="" width={20} height={20} className="object-contain" unoptimized />
                      ) : (
                        <ImageIcon className="h-3 w-3 text-slate-300" />
                      )}
                      <span className="text-[9px] truncate">{logo.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Label Text & Color - shown when partner logo is selected */}
            {footer.digitalPartner.logoId && (
              <div className="flex items-center gap-1 p-1 rounded bg-white border mt-1">
                <span className="text-[8px] text-muted-foreground shrink-0">Label:</span>
                <Input
                  value={footer.digitalPartner.labelText || 'Digital Partner'}
                  onChange={(e) => updateFooterDigitalPartner({ labelText: e.target.value })}
                  placeholder="Digital Partner"
                  className="h-5 text-[9px] border-0 p-0 focus-visible:ring-0"
                />
                <input
                  type="color"
                  value={footer.digitalPartner.labelColor || '#9CA3AF'}
                  onChange={(e) => updateFooterDigitalPartner({ labelColor: e.target.value })}
                  className="w-4 h-4 rounded border cursor-pointer shrink-0"
                />
              </div>
            )}
          </div>

          {/* Footer Background Color */}
          <div className="flex items-center justify-between p-1.5 rounded-lg bg-muted/50 border">
            <span className="text-[9px] text-muted-foreground">Bar Color</span>
            <div className="flex items-center gap-1">
              <input
                type="color"
                value={footer.background.color}
                onChange={(e) => updateFooterBackground({ color: e.target.value })}
                className="w-5 h-5 rounded border cursor-pointer"
              />
              <span className="text-[8px] text-muted-foreground font-mono">{footer.background.color}</span>
            </div>
          </div>
        </>
      )}

      {/* Footer Preset Save Dialog */}
      <SaveFooterPresetDialog open={showSavePresetDialog} onOpenChange={setShowSavePresetDialog} />
    </div>
  )
}
