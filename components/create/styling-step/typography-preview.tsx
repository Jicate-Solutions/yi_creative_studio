'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import type { MultiColorTypographyConfig, TextRoleColor } from '@/lib/config/design-constants'

interface TypographyPreviewProps {
  headingFont: string
  bodyFont: string
  eventName: string
  eventDescription?: string
  colorConfig: MultiColorTypographyConfig
  scale?: number
}

/**
 * Real-Time Typography Preview
 *
 * Dynamically loads Google Fonts and shows live preview of:
 * - Heading and body font pairing
 * - Multi-color typography (hero, headline, body, CTA, etc.)
 * - Gradient text effects
 * - Font scale adjustments
 *
 * Benefits:
 * - See typography before generation (no surprises)
 * - Test font combinations instantly
 * - Validate color accessibility visually
 * - Adjust scale for optimal hierarchy
 */
export function TypographyPreview({
  headingFont,
  bodyFont,
  eventName,
  eventDescription,
  colorConfig,
  scale = 1.0,
}: TypographyPreviewProps) {
  const [fontsLoaded, setFontsLoaded] = useState(false)
  const [loadingError, setLoadingError] = useState<string | null>(null)

  // Convert font values to Google Fonts format
  // Example: 'exo_2' → 'Exo+2', 'playfair_display' → 'Playfair+Display'
  const formatFontForGoogleFonts = (fontValue: string): string => {
    return fontValue
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('+')
  }

  // Dynamically load Google Fonts
  useEffect(() => {
    setFontsLoaded(false)
    setLoadingError(null)

    const headingFontFormatted = formatFontForGoogleFonts(headingFont)
    const bodyFontFormatted = formatFontForGoogleFonts(bodyFont)

    // Create Google Fonts link
    const link = document.createElement('link')
    link.href = `https://fonts.googleapis.com/css2?family=${headingFontFormatted}:wght@400;700&family=${bodyFontFormatted}:wght@400;600&display=swap`
    link.rel = 'stylesheet'

    link.onload = () => {
      setFontsLoaded(true)
    }

    link.onerror = () => {
      setLoadingError('Failed to load fonts from Google Fonts')
      setFontsLoaded(false)
    }

    document.head.appendChild(link)

    // Cleanup on unmount or font change
    return () => {
      document.head.removeChild(link)
    }
  }, [headingFont, bodyFont])

  // Convert font value to CSS font-family
  const getFontFamily = (fontValue: string): string => {
    return fontValue
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  // Render text color/gradient styling
  const renderTextStyle = (roleColor: TextRoleColor): React.CSSProperties => {
    if (roleColor.type === 'gradient') {
      const direction =
        roleColor.gradientDirection === 'horizontal'
          ? 'to right'
          : roleColor.gradientDirection === 'vertical'
          ? 'to bottom'
          : 'to bottom right'

      return {
        background: `linear-gradient(${direction}, ${roleColor.gradientStart}, ${roleColor.gradientEnd})`,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
      }
    }

    return {
      color: roleColor.color,
    }
  }

  // Calculate base font sizes with scale multiplier
  const baseHeroSize = 48 * scale
  const baseHeadlineSize = 36 * scale
  const baseSubheadlineSize = 24 * scale
  const baseBodySize = 16 * scale
  const baseCaptionSize = 14 * scale

  return (
    <div className="rounded-lg border-2 border-dashed border-border bg-card p-8 shadow-sm">
      <div className="space-y-6">
        {/* Preview Header */}
        <div className="flex items-center justify-between border-b pb-3">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Typography Preview</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Live preview of font pairing and color system
            </p>
          </div>
          {!fontsLoaded && !loadingError && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              Loading fonts...
            </div>
          )}
          {loadingError && (
            <div className="text-xs text-red-600">{loadingError}</div>
          )}
          {fontsLoaded && (
            <div className="text-xs text-green-600 font-medium">
              ✓ Fonts loaded
            </div>
          )}
        </div>

        {/* Preview Content */}
        <div className="space-y-5" style={{ opacity: fontsLoaded ? 1 : 0.5 }}>
          {/* Hero Text */}
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-semibold">
              Hero/Title
            </p>
            <h1
              className="font-bold leading-tight"
              style={{
                fontFamily: `"${getFontFamily(headingFont)}", sans-serif`,
                fontSize: `${baseHeroSize}px`,
                ...renderTextStyle(colorConfig.hero),
              }}
            >
              {eventName || 'Your Event Title Here'}
            </h1>
            {colorConfig.hero.contrastRatio && (
              <p className="text-[10px] text-gray-500">
                Contrast: {colorConfig.hero.contrastRatio}:1
                {colorConfig.hero.description && ` • ${colorConfig.hero.description}`}
              </p>
            )}
          </div>

          {/* Headline Text */}
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-semibold">
              Headline
            </p>
            <h2
              className="font-semibold leading-tight"
              style={{
                fontFamily: `"${getFontFamily(headingFont)}", sans-serif`,
                fontSize: `${baseHeadlineSize}px`,
                ...renderTextStyle(colorConfig.headline),
              }}
            >
              Main Event Headline
            </h2>
            {colorConfig.headline.contrastRatio && (
              <p className="text-[10px] text-gray-500">
                Contrast: {colorConfig.headline.contrastRatio}:1
              </p>
            )}
          </div>

          {/* Subheadline Text */}
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-semibold">
              Subheadline
            </p>
            <h3
              className="font-medium leading-snug"
              style={{
                fontFamily: `"${getFontFamily(headingFont)}", sans-serif`,
                fontSize: `${baseSubheadlineSize}px`,
                ...renderTextStyle(colorConfig.subheadline),
              }}
            >
              Supporting Subheadline or Tagline
            </h3>
            {colorConfig.subheadline.contrastRatio && (
              <p className="text-[10px] text-gray-500">
                Contrast: {colorConfig.subheadline.contrastRatio}:1
              </p>
            )}
          </div>

          {/* Body Text */}
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-semibold">
              Body Text
            </p>
            <p
              className="leading-relaxed"
              style={{
                fontFamily: `"${getFontFamily(bodyFont)}", sans-serif`,
                fontSize: `${baseBodySize}px`,
                ...renderTextStyle(colorConfig.body),
              }}
            >
              {eventDescription ||
                'This is sample body text showing how your event description will appear. Body text should be highly readable with excellent contrast for accessibility.'}
            </p>
            {colorConfig.body.contrastRatio && (
              <p className="text-[10px] text-gray-500">
                Contrast: {colorConfig.body.contrastRatio}:1
                {colorConfig.body.contrastRatio >= 4.5 ? ' ✓ WCAG AA' : ' ⚠️ Below WCAG AA'}
              </p>
            )}
          </div>

          {/* Call-to-Action */}
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-semibold">
              Call-to-Action
            </p>
            <div
              className="inline-block rounded-md px-6 py-3 font-semibold cursor-pointer transition-transform hover:scale-105"
              style={{
                fontFamily: `"${getFontFamily(bodyFont)}", sans-serif`,
                fontSize: `${baseBodySize}px`,
                ...renderTextStyle(colorConfig.cta),
                ...(colorConfig.cta.type === 'solid' && {
                  backgroundColor: colorConfig.cta.color,
                  color: '#ffffff',
                }),
              }}
            >
              Register Now →
            </div>
            {colorConfig.cta.contrastRatio && (
              <p className="text-[10px] text-gray-500 mt-2">
                Contrast: {colorConfig.cta.contrastRatio}:1
              </p>
            )}
          </div>

          {/* Caption Text */}
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-semibold">
              Caption
            </p>
            <p
              className="text-sm"
              style={{
                fontFamily: `"${getFontFamily(bodyFont)}", sans-serif`,
                fontSize: `${baseCaptionSize}px`,
                ...renderTextStyle(colorConfig.caption),
              }}
            >
              Small caption text for additional context and details
            </p>
            {colorConfig.caption.contrastRatio && (
              <p className="text-[10px] text-gray-500">
                Contrast: {colorConfig.caption.contrastRatio}:1
              </p>
            )}
          </div>

          {/* Label/Metadata */}
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-semibold">
              Label/Metadata
            </p>
            <p
              className="text-xs uppercase tracking-wide"
              style={{
                fontFamily: `"${getFontFamily(bodyFont)}", sans-serif`,
                fontSize: `${baseCaptionSize - 2}px`,
                ...renderTextStyle(colorConfig.label),
              }}
            >
              Label • Metadata • Tags
            </p>
            {colorConfig.label.contrastRatio && (
              <p className="text-[10px] text-gray-500">
                Contrast: {colorConfig.label.contrastRatio}:1
              </p>
            )}
          </div>
        </div>

        {/* Preview Footer */}
        <div className="border-t pt-4 mt-6">
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <p className="font-semibold text-gray-700 mb-1">Typography</p>
              <p className="text-gray-600">
                Heading: {getFontFamily(headingFont)}
              </p>
              <p className="text-gray-600">
                Body: {getFontFamily(bodyFont)}
              </p>
              <p className="text-gray-600">Scale: {scale.toFixed(1)}×</p>
            </div>
            <div>
              <p className="font-semibold text-gray-700 mb-1">Accessibility</p>
              <p className="text-gray-600">
                Body: {colorConfig.body.contrastRatio?.toFixed(1) || 'N/A'}:1
                {colorConfig.body.contrastRatio && colorConfig.body.contrastRatio >= 4.5
                  ? ' ✓'
                  : ' ⚠️'}
              </p>
              <p className="text-gray-600">
                Headline: {colorConfig.headline.contrastRatio?.toFixed(1) || 'N/A'}:1
                {colorConfig.headline.contrastRatio && colorConfig.headline.contrastRatio >= 3.0
                  ? ' ✓'
                  : ' ⚠️'}
              </p>
              <p className="text-gray-600">
                CTA: {colorConfig.cta.contrastRatio?.toFixed(1) || 'N/A'}:1
                {colorConfig.cta.contrastRatio && colorConfig.cta.contrastRatio >= 3.0
                  ? ' ✓'
                  : ' ⚠️'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
