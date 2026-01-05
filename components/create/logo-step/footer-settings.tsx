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
  Palette,
  LayoutGrid,
  AlignLeft,
  AlignCenter,
  ArrowLeftRight,
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
  } = useCreativeStore()

  const footer = formData.enhanced4RowStrip.footer

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
                Bottom strip with hashtag, website & partner
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
          {/* Hashtag Section */}
          <div className="rounded-lg border border-slate-200 p-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Hash className="h-3.5 w-3.5 text-blue-500" />
                <Label className="text-xs font-medium">Hashtag</Label>
              </div>
              <Switch
                checked={footer.hashtag.enabled}
                onCheckedChange={(enabled) => updateFooterHashtag({ enabled })}
              />
            </div>
            {footer.hashtag.enabled && (
              <Input
                value={footer.hashtag.text}
                onChange={(e) => updateFooterHashtag({ text: e.target.value })}
                placeholder="#YIERODE"
                className="h-8 text-xs"
              />
            )}
          </div>

          {/* Website Section */}
          <div className="rounded-lg border border-slate-200 p-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="h-3.5 w-3.5 text-green-500" />
                <Label className="text-xs font-medium">Website & Social</Label>
              </div>
              <Switch
                checked={footer.website.enabled}
                onCheckedChange={(enabled) => updateFooterWebsite({ enabled })}
              />
            </div>
            {footer.website.enabled && (
              <div className="space-y-2">
                <Input
                  value={footer.website.url}
                  onChange={(e) => updateFooterWebsite({ url: e.target.value })}
                  placeholder="www.youngindians.net"
                  className="h-8 text-xs"
                />
                <Input
                  value={footer.website.socialHandle || ''}
                  onChange={(e) => updateFooterWebsite({ socialHandle: e.target.value })}
                  placeholder="@ yi.erode"
                  className="h-8 text-xs"
                />
              </div>
            )}
          </div>

          {/* Digital Partner Section */}
          <div className="rounded-lg border border-slate-200 p-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Handshake className="h-3.5 w-3.5 text-orange-500" />
                <Label className="text-xs font-medium">Digital Partner</Label>
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
                {/* Label & Separator */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2 space-y-1">
                    <Label className="text-[10px]">Label</Label>
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
                    <Label className="text-[10px]">Separator</Label>
                    <Input
                      value={footer.digitalPartner.separator}
                      onChange={(e) =>
                        updateFooterDigitalPartner({ separator: e.target.value })
                      }
                      placeholder="–"
                      className="h-8 text-xs text-center"
                    />
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
              min={35}
              max={80}
              step={5}
              className="w-full"
            />
          </div>
        </div>
      )}
    </div>
  )
}
