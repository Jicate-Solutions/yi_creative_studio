'use client'

import { useCreativeStore } from '@/stores/creative-store'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import { ImageIcon, Expand } from 'lucide-react'
import { detectLogoType, LOGO_TYPE_CONFIGS } from '@/lib/config/logo-locks'

/**
 * Expand icon button overlay for full-view modal
 * Only renders when onExpandClick handler is provided
 */
const ExpandIconButton = ({ onClick }: { onClick?: () => void }) => {
  if (!onClick) return null

  return (
    <button
      onClick={(e) => {
        e.stopPropagation() // Prevent triggering parent click handler
        onClick()
      }}
      className="absolute top-2 right-2 z-10 bg-black/60 hover:bg-black/80 backdrop-blur-sm rounded-full p-2 transition-all duration-200 group"
      aria-label="Expand to full view"
    >
      <Expand className="h-4 w-4 text-white group-hover:scale-110 transition-transform" />
    </button>
  )
}

interface CanvasPreviewProps {
  onExpandClick?: () => void
}

export function CanvasPreview({ onExpandClick }: CanvasPreviewProps = {}) {
  const {
    selectedFormat,
    generatedImage,
    formData,
    selectedTemplate,
    logos,
  } = useCreativeStore()

  // Get brand logos using the same logic as HeaderStripSettings
  const getBrandLogos = () => {
    const brandLogosByType = new Map<string, typeof logos[0]>()
    const CONFIG_KEY_ORDER = ['yi-main', 'bharat-rising', 'cii-main']

    logos.forEach((logo) => {
      const logoType = detectLogoType(logo.name || '')
      if (logoType !== 'brand') return
      for (const [key, config] of Object.entries(LOGO_TYPE_CONFIGS)) {
        if (config.type === 'brand' && config.patterns.some(p => p.test(logo.name || ''))) {
          if (!brandLogosByType.has(key)) {
            brandLogosByType.set(key, logo)
          }
          break
        }
      }
    })

    return CONFIG_KEY_ORDER
      .map(key => brandLogosByType.get(key))
      .filter((logo): logo is typeof logos[0] => logo !== undefined)
  }

  const brandLogos = getBrandLogos()

  // Check if logo strip is enabled
  const logoStripEnabled = formData.enhanced4RowStrip?.enabled !== false
  const footerEnabled = formData.enhanced4RowStrip?.footer?.enabled !== false

  // Calculate preview dimensions (maintain aspect ratio, max 450px for desktop)
  const getPreviewDimensions = () => {
    if (!selectedFormat) return { width: 337, height: 450 }

    const { width, height } = selectedFormat
    const maxSize = 450
    const aspectRatio = width / height

    if (aspectRatio > 1) {
      // Landscape
      return {
        width: maxSize,
        height: Math.round(maxSize / aspectRatio),
      }
    } else {
      // Portrait or square
      return {
        width: Math.round(maxSize * aspectRatio),
        height: maxSize,
      }
    }
  }

  const previewDims = getPreviewDimensions()

  // Get preview content
  const title = (formData.formData.eventName as string) ||
    (formData.formData.title as string) ||
    (formData.formData.postTitle as string) ||
    'Your Title Here'

  const subtitle = (formData.formData.eventTagline as string) ||
    (formData.formData.tagline as string) ||
    (formData.formData.subtitle as string) ||
    ''

  const date = (formData.formData.eventDate as string) ||
    (formData.formData.date as string) ||
    ''

  const venue = (formData.formData.venue as string) ||
    (formData.formData.location as string) ||
    ''

  // Get footer info
  const footer = formData.enhanced4RowStrip?.footer
  const hashtag = footer?.hashtag?.text || '#YIERODE'
  const website = footer?.website?.url || 'www.youngindians.net'

  // If we have a generated image, show it
  if (generatedImage) {
    return (
      <div className="flex flex-col items-center gap-2 w-full max-w-2xl">
        {/* Image container with proper aspect ratio handling */}
        <div className="w-full flex justify-center">
          <div
            className="relative bg-white rounded-lg shadow-lg overflow-hidden"
            style={{
              width: previewDims.width,
              height: previewDims.height,
              maxWidth: '100%'
            }}
          >
            <ExpandIconButton onClick={onExpandClick} />
            <Image
              src={generatedImage}
              alt="Generated creative"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>

        {/* Format info */}
        <div className="text-center text-sm text-muted-foreground">
          <p className="font-medium">{selectedFormat?.label}</p>
          <p>
            {selectedFormat?.width} x {selectedFormat?.height}
          </p>
        </div>
      </div>
    )
  }

  // If we have a template, show it
  if (selectedTemplate?.image_url) {
    return (
      <div className="flex flex-col items-center gap-2 w-full max-w-2xl">
        {/* Template container with proper aspect ratio handling */}
        <div className="w-full flex justify-center">
          <div
            className="relative bg-white rounded-lg shadow-lg overflow-hidden"
            style={{
              width: previewDims.width,
              height: previewDims.height,
              maxWidth: '100%'
            }}
          >
            <ExpandIconButton onClick={onExpandClick} />
            <Image
              src={selectedTemplate.image_url}
              alt="Template preview"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>

        <div className="text-center text-sm text-muted-foreground">
          <p className="font-medium">Template Selected</p>
          <p>
            {selectedFormat?.width} x {selectedFormat?.height}
          </p>
        </div>
      </div>
    )
  }

  // Simplified placeholder preview (no EnhancedStripCanvas - too complex for small preview)
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={cn(
          'relative rounded-lg shadow-lg overflow-hidden',
          'bg-white border border-gray-200'
        )}
        style={{ width: previewDims.width, height: previewDims.height }}
      >
        {/* Header Strip Area */}
        {logoStripEnabled && (
          <div className="absolute top-0 left-0 right-0 bg-white border-b border-gray-100 p-3">
            {/* Brand logos row - uses detected brand logos only (Yi, Bharat ONE, CII) */}
            <div className="flex items-center justify-between gap-1 mb-1">
              {brandLogos.length > 0 ? (
                brandLogos.map((logo, i) => (
                  <div key={logo.id || i} className="flex-1 flex items-center justify-center h-12">
                    {logo.file_url ? (
                      <Image
                        src={logo.file_url}
                        alt={logo.name || 'Logo'}
                        width={70}
                        height={45}
                        className="object-contain max-h-10"
                        unoptimized
                      />
                    ) : (
                      <div className="w-10 h-6 bg-gray-100 rounded flex items-center justify-center">
                        <span className="text-[6px] text-gray-400">{logo.name?.slice(0, 3)}</span>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                // Show placeholder boxes when no brand logos detected
                <>
                  <div className="flex-1 h-10 bg-gray-50 rounded flex items-center justify-center">
                    <span className="text-[11px] text-gray-400">Yi</span>
                  </div>
                  <div className="flex-1 h-10 bg-gray-50 rounded flex items-center justify-center">
                    <span className="text-[11px] text-gray-400">ONE</span>
                  </div>
                  <div className="flex-1 h-10 bg-gray-50 rounded flex items-center justify-center">
                    <span className="text-[11px] text-gray-400">CII</span>
                  </div>
                </>
              )}
            </div>
            {/* ROW 2: Program/Initiative Logos */}
            {formData.enhanced4RowStrip?.rows?.vertical?.enabled &&
             formData.enhanced4RowStrip.rows.vertical.logoIds.length > 0 && (
              <div className="flex items-center justify-center gap-1 mb-1 flex-wrap">
                {formData.enhanced4RowStrip.rows.vertical.logoIds.map((logoId) => {
                  const logo = logos.find(l => l.id === logoId)
                  if (!logo) return null
                  return (
                    <div key={logoId} className="flex items-center justify-center h-8">
                      {logo.file_url ? (
                        <Image
                          src={logo.file_url}
                          alt={logo.name || 'Logo'}
                          width={50}
                          height={30}
                          className="object-contain max-h-7"
                          unoptimized
                        />
                      ) : (
                        <div className="w-10 h-6 bg-gray-100 rounded flex items-center justify-center">
                          <span className="text-[7px] text-gray-400">{logo.name?.slice(0, 4)}</span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* ROW 3: Chapter text */}
            {formData.enhanced4RowStrip?.rows?.initiative?.enabled && (
              <div className="text-center">
                <span className="text-[11px] font-medium text-gray-600">
                  {formData.enhanced4RowStrip.rows.initiative.text || 'Yi Erode Initiative'}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Main Content Area */}
        <div
          className={cn(
            'absolute left-0 right-0 flex flex-col items-center justify-center p-4',
            'bg-gradient-to-br from-blue-50 via-white to-orange-50'
          )}
          style={{
            // Dynamic header height: base 65px + 35px for ROW 2 + 25px for ROW 3
            top: logoStripEnabled
              ? `${65 + (formData.enhanced4RowStrip?.rows?.vertical?.enabled && formData.enhanced4RowStrip.rows.vertical.logoIds.length > 0 ? 35 : 0) + (formData.enhanced4RowStrip?.rows?.initiative?.enabled ? 25 : 0)}px`
              : '0',
            bottom: footerEnabled ? '90px' : '0'  // Scaled from 180px actual to preview scale (180 × 0.51 ≈ 90px)
          }}
        >
          {/* Empty content area - AI will generate the design here */}
        </div>

        {/* Footer Strip Area */}
        {footerEnabled && (
          <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 py-1.5 px-2">
            <div className="flex items-center justify-between">
              {/* Signature - show actual image if set, or placeholder if enabled */}
              {footer?.signature?.enabled && (footer?.signature?.signatureId || footer?.signature?.logoId) ? (
                (() => {
                  const sigId = footer.signature.signatureId || footer.signature.logoId
                  const sigLogo = logos.find(l => l.id === sigId)
                  return sigLogo?.file_url ? (
                    <div className="w-16 h-12 flex items-center justify-center">
                      <Image src={sigLogo.file_url} alt="Signature" width={55} height={40} className="object-contain" unoptimized />
                    </div>
                  ) : (
                    <div className="w-16 h-12 bg-teal-50 rounded flex items-center justify-center">
                      <span className="text-[9px] text-teal-400">Signature</span>
                    </div>
                  )
                })()
              ) : footer?.signature?.enabled ? (
                <div className="w-16 h-12 bg-teal-50 rounded flex items-center justify-center">
                  <span className="text-[9px] text-teal-400">Signature</span>
                </div>
              ) : null}

              {/* Center info */}
              <div className="text-center flex-1 px-2 leading-tight">
                <p className="text-[10px] font-bold text-green-600 leading-none">{hashtag}</p>
                <p className="text-[8px] text-gray-400 leading-tight">{website}</p>
                {/* Social media pill */}
                {(footer?.socialBar?.enabled ?? true) && footer?.website?.socialHandle?.trim() && (
                  <div className="inline-flex items-center gap-0.5 bg-gray-800 text-white px-1.5 py-0 rounded-full mt-0.5">
                    <span className="text-[7px]">@{footer.website.socialHandle.replace(/^@/, '')}</span>
                  </div>
                )}
              </div>

              {/* Partner - show actual image if set, or placeholder if enabled */}
              {footer?.digitalPartner?.enabled && footer?.digitalPartner?.logoId ? (
                (() => {
                  const partnerLogo = logos.find(l => l.id === footer.digitalPartner.logoId)
                  return partnerLogo?.file_url ? (
                    <div className="flex flex-col items-center">
                      <span className="text-[7px] text-gray-500 uppercase tracking-wider font-bold mb-0.5">
                        {footer.digitalPartner.labelText || 'Digital Partner'}
                      </span>
                      <div className="w-16 h-10 flex items-center justify-center">
                        <Image src={partnerLogo.file_url} alt="Partner" width={55} height={35} className="object-contain" unoptimized />
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <span className="text-[7px] text-gray-500 uppercase tracking-wider font-bold mb-0.5">
                        {footer.digitalPartner.labelText || 'Digital Partner'}
                      </span>
                      <div className="w-16 h-10 bg-orange-50 rounded flex items-center justify-center">
                        <span className="text-[9px] text-orange-400">Partner</span>
                      </div>
                    </div>
                  )
                })()
              ) : footer?.digitalPartner?.enabled ? (
                <div className="flex flex-col items-center">
                  <span className="text-[7px] text-gray-500 uppercase tracking-wider font-bold mb-0.5">
                    {footer.digitalPartner.labelText || 'Digital Partner'}
                  </span>
                  <div className="w-16 h-10 bg-orange-50 rounded flex items-center justify-center">
                    <span className="text-[9px] text-orange-400">Partner</span>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}

        {/* Preview badge */}
        <div className="absolute bottom-1/2 left-0 right-0 flex justify-center z-10 pointer-events-none">
          <div className="bg-white/90 backdrop-blur px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
            <ImageIcon className="h-2.5 w-2.5 text-gray-400" />
            <span className="text-[9px] text-gray-400">Preview</span>
          </div>
        </div>
      </div>

      {/* Format info */}
      <div className="text-center text-sm text-muted-foreground">
        <p className="font-medium">{selectedFormat?.label || 'Select Format'}</p>
        {selectedFormat && (
          <p>
            {selectedFormat.width} x {selectedFormat.height}
          </p>
        )}
      </div>
    </div>
  )
}
