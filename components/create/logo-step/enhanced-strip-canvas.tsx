'use client'

import { useMemo } from 'react'
import { useCreativeStore } from '@/stores/creative-store'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { Instagram, Facebook } from 'lucide-react'
import { detectLogoType, LOGO_TYPE_CONFIGS } from '@/lib/config/logo-locks'
import {
  calculateFooterZoneWidths,
  getPatternDescription,
  type FooterZoneConfig,
} from '@/lib/services/footer-zone-optimizer'
import type { LandmarkSignature } from '@/types/landmark-signatures'

interface EnhancedStripCanvasProps {
  className?: string
}

export function EnhancedStripCanvas({ className }: EnhancedStripCanvasProps) {
  const { formData, logos, landmarkSignatures } = useCreativeStore()
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

  const hasHeaderContent = brandLogos.length > 0 || enhanced4Row.rows.initiative.text.trim()
  const hasFooterContent = footer.enabled && (
    footer.signature?.enabled ||
    footer.hashtag.text.trim() ||
    footer.website.url.trim() ||
    footer.website.socialHandle?.trim() ||
    footer.digitalPartner.logoId
  )

  if (!hasHeaderContent && !hasFooterContent) {
    return (
      <div className={cn('rounded-xl border-2 border-dashed border-slate-200 p-6 text-center', className)}>
        <p className="text-xs text-muted-foreground">
          Add content to see preview
        </p>
      </div>
    )
  }

  // Get signature from landmark_signatures table (NEW) or fallback to logo library (legacy)
  const signatureLogo: { file_url: string | null; name?: string } | null = useMemo(() => {
    // First try signatureId (new landmark_signatures table)
    if (footer.signature?.signatureId) {
      const sig = landmarkSignatures.find(s => s.id === footer.signature.signatureId)
      if (sig) return { file_url: sig.file_url, name: sig.name }
    }
    // Fallback to logoId (legacy - from logos library)
    if (footer.signature?.logoId) {
      return logos.find(l => l.id === footer.signature.logoId) || null
    }
    return null
  }, [footer.signature?.signatureId, footer.signature?.logoId, landmarkSignatures, logos])

  // Get partner logo if selected
  const partnerLogo = footer.digitalPartner.logoId
    ? logos.find(l => l.id === footer.digitalPartner.logoId)
    : null

  // ═══════════════════════════════════════════════════════════════════════════
  // FOOTER ZONE OPTIMIZER - Dynamic space-evenly distribution
  // Same algorithm as header strip for visual balance
  // ═══════════════════════════════════════════════════════════════════════════

  // Determine which zones have content
  const zone1HasContent = footer.signature?.enabled && signatureLogo?.file_url
  const zone2HasContent = (
    (footer.hashtag.enabled && footer.hashtag.text.trim()) ||
    (footer.website.enabled && footer.website.url.trim()) ||
    ((footer.socialBar?.enabled ?? true) && footer.website.socialHandle?.trim())
  )
  const zone3HasContent = footer.digitalPartner.enabled && partnerLogo?.file_url

  // Count how many center items are enabled (for zone 2 content density)
  const zone2ContentCount = [
    footer.hashtag.enabled && footer.hashtag.text.trim(),
    footer.website.enabled && footer.website.url.trim(),
    (footer.socialBar?.enabled ?? true) && footer.website.socialHandle?.trim(),
  ].filter(Boolean).length

  // Calculate optimized zone widths using space-evenly algorithm
  const zoneWidths = useMemo(() => {
    const config: FooterZoneConfig = {
      zone1Enabled: !!zone1HasContent,
      zone2Enabled: !!zone2HasContent,
      zone3Enabled: !!zone3HasContent,
      zone2ContentCount,
    }
    return calculateFooterZoneWidths(config, 100) // percentages
  }, [zone1HasContent, zone2HasContent, zone3HasContent, zone2ContentCount])

  // Debug: Get pattern description for preview badge
  const patternDesc = useMemo(() => {
    return getPatternDescription({
      zone1Enabled: !!zone1HasContent,
      zone2Enabled: !!zone2HasContent,
      zone3Enabled: !!zone3HasContent,
    })
  }, [zone1HasContent, zone2HasContent, zone3HasContent])

  // Check enabled state AFTER all hooks have executed
  // This prevents React Hooks order violation
  if (!enhanced4Row.enabled) return null

  return (
    <div className={cn('space-y-1 mt-6', className)}> {/* v16.0: space-y-1 = 4px tight gap */}
      {/* ROW 1: Brand Logos Card - Full width with space-evenly alignment */}
      {/* v18.3: Full width with even spacing to match backend Sharp rendering */}
      {brandLogos.length > 0 && (
        <div className="w-full rounded-t-none rounded-b-2xl bg-white shadow-md hover:shadow-lg transition-shadow duration-300 border border-slate-200 border-t-0 px-4 py-1">
          <div className="flex items-center justify-evenly">  {/* v18.3: space-evenly alignment to match backend */}
            {brandLogos.map((logo) => (
              <div key={logo.id} className="h-[130px] flex items-center">
                {logo.file_url && (
                  <Image
                    src={logo.file_url}
                    alt={logo.name || 'Logo'}
                    width={180}
                    height={110}
                    className="object-contain"
                    unoptimized
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ROW 2: Floating Card with Rounded Corners (Program/Vertical Logos) */}
      {/* v18.4: Responsive grid with flex-wrap for many logos */}
      {/* v19.0: Increased logo size from 50px to 75px height for better visibility */}
      {enhanced4Row.rows.vertical.enabled && enhanced4Row.rows.vertical.logoIds.length > 0 && (
        <div className="w-full rounded-lg bg-white shadow-md hover:shadow-lg transition-shadow duration-300 border border-slate-200 px-2 py-1">
          <div className="flex items-center justify-center flex-wrap gap-x-3 gap-y-1">
            {enhanced4Row.rows.vertical.logoIds.map((logoId) => {
              const logo = logos.find(l => l.id === logoId)
              return logo?.file_url ? (
                <div key={logoId} className="h-[90px] flex items-center shrink-0">
                  <Image
                    src={logo.file_url}
                    alt={logo.name || ''}
                    width={140}
                    height={85}
                    className="object-contain"
                    unoptimized
                  />
                </div>
              ) : null
            })}
          </div>
        </div>
      )}

      {/* ROW 3: Initiative Text (Embedded in Poster) */}
      {enhanced4Row.rows.initiative.enabled && enhanced4Row.rows.initiative.text.trim() && (
        <div className="text-center py-1">
          <div className="inline-block">
            <span
              className="text-sm font-bold tracking-wide font-poppins"
              style={{ color: enhanced4Row.rows.initiative.color }}
            >
              {enhanced4Row.rows.initiative.text}
            </span>
            <div className="mt-1.5 text-[9px] text-slate-400 italic">
              Embedded in poster by AI
            </div>
          </div>
        </div>
      )}

      {/* Poster Content Placeholder */}
      <div className="h-16 bg-gradient-to-b from-slate-100 to-slate-50 rounded-lg flex items-center justify-center border border-dashed border-slate-200">
        <span className="text-[10px] text-slate-400">Poster Content</span>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* FOOTER STRIP PREVIEW - 3-ZONE LAYOUT with Space-Evenly */}
      {/* v18.3: Full width to match backend rendering */}
      {/* Zone 1: Signature (Left) | Zone 2: Info (Center) | Zone 3: Partner (Right) */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {hasFooterContent && (
        <div className="w-full rounded-t-2xl rounded-b-none overflow-hidden border border-slate-200 border-b-0 shadow-md hover:shadow-lg transition-shadow duration-300">
          <div className="px-3 py-1 bg-orange-500 text-white flex items-center justify-between">
            <span className="text-[9px] font-medium">Footer Bar Preview</span>
            <div className="flex items-center gap-2">
              <span className="text-[7px] opacity-60 hidden sm:inline">
                {patternDesc}
              </span>
              <span className="text-[8px] opacity-70 bg-orange-600 px-1.5 py-0.5 rounded">
                {zoneWidths.alignment === 'spread' ? 'Space-Evenly' : 'Centered'}
              </span>
            </div>
          </div>

          {/* Footer Container with configurable background */}
          {/* v21.0: justify-evenly for dynamic zone distribution */}
          <div
            className="relative flex items-center justify-evenly overflow-hidden h-[120px]"
            style={{
              backgroundColor: footer.background.color,
              borderRadius: footer.background.borderRadius || '0',
              padding: `1px ${footer.padding.horizontal}px`,
            }}
          >
            {/* ═══ ZONE 1: Signature Illustration (Left) ═══ */}
            {/* v21.0: Dynamic width based on zoneWidths from optimizer */}
            {zone1HasContent && (
              <div
                className="flex items-end justify-start"
                style={{ width: `${zoneWidths.zone1Width}%` }}
              >
                <div
                  className="pointer-events-none"
                  style={{
                    opacity: footer.signature?.opacity ? footer.signature.opacity / 100 : 1,
                  }}
                >
                  <Image
                    src={signatureLogo!.file_url!}
                    alt="Signature"
                    width={160}
                    height={100}
                    className="object-contain object-left-bottom"
                    style={{
                      maxHeight: '110px'
                    }}
                    unoptimized
                  />
                </div>
              </div>
            )}

            {/* ═══ ZONE 2: Center Content (Hashtag + Website + Social Bar) ═══ */}
            {/* v21.0: Dynamic width with even spacing when zones are missing */}
            <div
              className="flex flex-col items-center justify-center gap-0.5 py-0"
              style={{ width: zone2HasContent ? `${zoneWidths.zone2Width}%` : 0 }}
            >
              {/* Hashtag - Primary CTA */}
              {footer.hashtag.enabled && footer.hashtag.text.trim() && (
                <div
                  className="font-bold uppercase tracking-wide text-center"
                  style={{
                    color: footer.hashtag.color || '#0B6D41',
                    fontSize: `${footer.fontSize + 2}px`,
                    fontWeight: footer.fontWeight === 'bold' ? 700 : footer.fontWeight === 'semibold' ? 600 : 500,
                  }}
                >
                  {footer.hashtag.text.startsWith('#') ? footer.hashtag.text : `#${footer.hashtag.text}`}
                </div>
              )}

              {/* Website URL */}
              {footer.website.enabled && footer.website.url.trim() && (
                <div
                  className="text-xs text-center"
                  style={{ color: footer.textColor }}
                >
                  {footer.website.url}
                </div>
              )}

              {/* Social Media Bar - Dark Pill */}
              {(footer.socialBar?.enabled ?? true) && footer.website.socialHandle?.trim() && (
                <div
                  className="flex items-center gap-2 px-3 py-1 mt-0.5"
                  style={{
                    backgroundColor: footer.socialBar?.backgroundColor || '#1a1a1a',
                    borderRadius: `${footer.socialBar?.borderRadius || 20}px`,
                  }}
                >
                  {/* Instagram Icon */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={footer.socialBar?.textColor || '#FFFFFF'}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4 shrink-0"
                  >
                    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                  </svg>

                  {/* Facebook Icon */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={footer.socialBar?.textColor || '#FFFFFF'}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4 shrink-0"
                  >
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                  </svg>
                  <span
                    className="text-xs font-medium"
                    style={{ color: footer.socialBar?.textColor || '#FFFFFF' }}
                  >
                    {footer.website.socialHandle.startsWith('@')
                      ? footer.website.socialHandle
                      : `@${footer.website.socialHandle}`}
                  </span>
                </div>
              )}
            </div>

            {/* ═══ ZONE 3: Digital Partner (Right) ═══ */}
            {/* v21.0: Dynamic width based on zoneWidths from optimizer */}
            {zone3HasContent && (
              <div
                className="flex flex-col items-center justify-center"
                style={{ width: `${zoneWidths.zone3Width}%` }}
              >
                {footer.digitalPartner.enabled && partnerLogo?.file_url && (
                <div className="flex flex-col items-center justify-center gap-0.5 text-center">
                  {/* "Digital Partner" Label - Bold uppercase for visibility */}
                  <span
                    className="text-[9px] uppercase tracking-wider whitespace-nowrap font-bold"
                    style={{ color: footer.digitalPartner.labelColor || '#374151' }}
                  >
                    {footer.digitalPartner.labelText}
                  </span>

                  {/* Partner Logo */}
                  <div className="flex items-center justify-center">
                    <Image
                      src={partnerLogo.file_url}
                      alt={partnerLogo.name || 'Partner'}
                      width={60}
                      height={40}
                      className="object-contain"
                      unoptimized
                    />
                  </div>

                  {/* Agency Name/Link */}
                  {footer.digitalPartner.agencyName && (
                    <span
                      className="text-[6px] truncate max-w-full"
                      style={{ color: footer.digitalPartner.labelColor || '#9CA3AF' }}
                    >
                      {footer.digitalPartner.agencyName}
                    </span>
                  )}
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
