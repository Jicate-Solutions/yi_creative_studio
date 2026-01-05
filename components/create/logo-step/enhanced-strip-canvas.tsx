'use client'

import { useCreativeStore } from '@/stores/creative-store'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { Hash, Globe, Handshake } from 'lucide-react'
import { detectLogoType, LOGO_TYPE_CONFIGS } from '@/lib/config/logo-locks'

interface EnhancedStripCanvasProps {
  className?: string
}

export function EnhancedStripCanvas({ className }: EnhancedStripCanvasProps) {
  const { formData, logos } = useCreativeStore()
  const enhanced4Row = formData.enhanced4RowStrip

  if (!enhanced4Row.enabled) return null

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

  const hasHeaderContent = brandLogos.length > 0 || enhanced4Row.rows.initiative.text.trim()
  const hasFooterContent = footer.enabled && (
    footer.hashtag.text.trim() ||
    footer.website.url.trim() ||
    footer.digitalPartner.logoId
  )

  // Determine if footer background is light (for text color contrast)
  const isLightBackground = footer.background.color.toUpperCase() === '#FFFFFF' ||
    footer.background.color.toUpperCase() === '#FFF'
  const footerTextColor = isLightBackground ? 'text-slate-700' : 'text-white'
  const footerIconColor = isLightBackground ? 'text-slate-500' : 'text-white/80'

  if (!hasHeaderContent && !hasFooterContent) {
    return (
      <div className={cn('rounded-xl border-2 border-dashed border-slate-200 p-6 text-center', className)}>
        <p className="text-xs text-muted-foreground">
          Add content to see preview
        </p>
      </div>
    )
  }

  return (
    <div className={cn('space-y-2', className)}>
      {/* Header Strip Preview */}
      {hasHeaderContent && (
        <div className="rounded-xl overflow-hidden border-2 border-blue-200 shadow-md">
          <div className="px-3 py-1 bg-blue-500 text-white">
            <span className="text-[9px] font-medium">Header Strip</span>
          </div>
          <div className="p-3 bg-white space-y-2">
            {/* Brand Logos Row */}
            {brandLogos.length > 0 && (
              <div className="flex items-center justify-center gap-4">
                {brandLogos.map((logo) => (
                  <div key={logo.id} className="h-8 flex items-center">
                    {logo.file_url && (
                      <Image
                        src={logo.file_url}
                        alt={logo.name || 'Logo'}
                        width={45}
                        height={28}
                        className="object-contain"
                        unoptimized
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Vertical Logos Row (Row 2) - Program Logos */}
            {enhanced4Row.rows.vertical.enabled && enhanced4Row.rows.vertical.logoIds.length > 0 && (
              <div className="flex items-center justify-center gap-3 py-1 bg-white/80 border-t border-slate-100">
                {enhanced4Row.rows.vertical.logoIds.map((logoId) => {
                  const logo = logos.find(l => l.id === logoId)
                  return logo?.file_url ? (
                    <Image
                      key={logoId}
                      src={logo.file_url}
                      alt={logo.name || ''}
                      width={35}
                      height={22}
                      className="object-contain opacity-80"
                      unoptimized
                    />
                  ) : null
                })}
              </div>
            )}

            {/* Initiative Text Row */}
            {enhanced4Row.rows.initiative.enabled && enhanced4Row.rows.initiative.text.trim() && (
              <div className="text-center py-1">
                <span
                  className="text-sm font-bold tracking-wide"
                  style={{ color: enhanced4Row.rows.initiative.color }}
                >
                  {enhanced4Row.rows.initiative.text}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Poster Content Placeholder */}
      <div className="h-16 bg-gradient-to-b from-slate-100 to-slate-50 rounded-lg flex items-center justify-center border border-dashed border-slate-200">
        <span className="text-[10px] text-slate-400">Poster Content</span>
      </div>

      {/* Footer Strip Preview */}
      {hasFooterContent && (
        <div className="rounded-xl overflow-hidden border-2 border-orange-200 shadow-md">
          <div className="px-3 py-1 bg-orange-500 text-white">
            <span className="text-[9px] font-medium">Footer Bar</span>
          </div>
          <div
            className={cn(
              "py-3 px-4 flex items-center justify-between gap-4",
              isLightBackground && "border-t border-slate-200"
            )}
            style={{ backgroundColor: footer.background.color }}
          >
            {/* Hashtag */}
            {footer.hashtag.text.trim() && (
              <div className="flex items-center gap-1.5">
                <Hash className={cn("h-4 w-4", footerIconColor)} />
                <span className={cn("text-sm font-semibold", footerTextColor)}>
                  {footer.hashtag.text.replace(/^#/, '')}
                </span>
              </div>
            )}

            {/* Website */}
            {footer.website.url.trim() && (
              <div className="flex items-center gap-1.5">
                <Globe className={cn("h-4 w-4", footerIconColor)} />
                <span className={cn("text-sm", footerTextColor)}>
                  {footer.website.url}
                </span>
              </div>
            )}

            {/* Digital Partner */}
            {footer.digitalPartner.logoId && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <Handshake className={cn("h-4 w-4", footerIconColor)} />
                  <span className={cn("text-xs", footerTextColor)}>Digital Partner</span>
                </div>
                {logos.find(l => l.id === footer.digitalPartner.logoId)?.file_url && (
                  <div className="h-12 w-16 flex items-center justify-center bg-white/95 rounded-lg shadow-sm border border-slate-100">
                    <Image
                      src={logos.find(l => l.id === footer.digitalPartner.logoId)!.file_url!}
                      alt="Partner"
                      width={56}
                      height={40}
                      className="object-contain p-1"
                      unoptimized
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
