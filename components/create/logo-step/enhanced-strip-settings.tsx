'use client'

import { useCreativeStore } from '@/stores/creative-store'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
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
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import { detectLogoType, LOGO_TYPE_CONFIGS } from '@/lib/config/logo-locks'

interface EnhancedStripSettingsProps {
  className?: string
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
  } = useCreativeStore()

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
                    className="flex-1 flex items-center justify-center bg-slate-50 rounded-lg p-2 h-12"
                  >
                    {logo.file_url ? (
                      <Image
                        src={logo.file_url}
                        alt={logo.name || 'Logo'}
                        width={50}
                        height={32}
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
              <Switch
                checked={enhanced4Row.rows.vertical.enabled}
                onCheckedChange={set4RowVerticalEnabled}
              />
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
                      .map((logo) => (
                        <SelectItem key={logo.id} value={logo.id}>
                          <div className="flex items-center gap-2">
                            {logo.file_url ? (
                              <Image
                                src={logo.file_url}
                                alt=""
                                width={16}
                                height={16}
                                className="object-contain"
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
                  <div className="flex items-center gap-2 flex-wrap">
                    {enhanced4Row.rows.vertical.logoIds.map(logoId => {
                      const logo = logos.find(l => l.id === logoId)
                      return logo ? (
                        <div
                          key={logoId}
                          className="relative flex items-center justify-center bg-slate-50 rounded-lg p-2 h-12 min-w-[60px]"
                          title={logo.name}
                        >
                          {logo.file_url ? (
                            <Image
                              src={logo.file_url}
                              alt={logo.name || 'Logo'}
                              width={50}
                              height={32}
                              className="object-contain max-h-8"
                              unoptimized
                            />
                          ) : (
                            <span className="text-[8px] text-slate-400 truncate">{logo.name}</span>
                          )}
                          <button
                            onClick={() => removeVerticalLogo4Row(logoId)}
                            className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                          >
                            <X className="h-2.5 w-2.5" />
                          </button>
                        </div>
                      ) : null
                    })}
                  </div>
                )}
                <p className="text-[10px] text-slate-400">
                  {enhanced4Row.rows.vertical.logoIds.length}/6 logos selected
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
              <Input
                value={enhanced4Row.rows.initiative.text}
                onChange={(e) => updateInitiativeText({ text: e.target.value })}
                placeholder="Yi Erode Initiative"
                className="h-9 text-sm"
              />
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
                <div className="space-y-2 pt-1">
                  {/* Hashtag */}
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-white border">
                    <Hash className="h-4 w-4 text-blue-500 flex-shrink-0" />
                    <Input
                      value={footer.hashtag.text}
                      onChange={(e) => updateFooterHashtag({ text: e.target.value, enabled: true })}
                      placeholder="#YIERODE"
                      className="h-7 text-xs border-0 p-0 focus-visible:ring-0"
                    />
                  </div>

                  {/* Website */}
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-white border">
                    <Globe className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <Input
                      value={footer.website.url}
                      onChange={(e) => updateFooterWebsite({ url: e.target.value, enabled: true })}
                      placeholder="www.youngindians.net"
                      className="h-7 text-xs border-0 p-0 focus-visible:ring-0"
                    />
                  </div>

                  {/* Digital Partner */}
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-white border">
                    <Handshake className="h-4 w-4 text-orange-500 flex-shrink-0" />
                    <div className="flex-1 flex items-center gap-2">
                      <span className="text-xs text-slate-500 whitespace-nowrap">Digital Partner</span>
                      <Select
                        value={footer.digitalPartner.logoId || ''}
                        onValueChange={setFooterPartnerLogo}
                      >
                        <SelectTrigger className="h-7 text-xs flex-1 border-0">
                          <SelectValue placeholder="Select logo" />
                        </SelectTrigger>
                        <SelectContent>
                          {logos.map((logo) => (
                            <SelectItem key={logo.id} value={logo.id}>
                              <div className="flex items-center gap-2">
                                {logo.file_url ? (
                                  <Image
                                    src={logo.file_url}
                                    alt=""
                                    width={16}
                                    height={16}
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
    </div>
  )
}
