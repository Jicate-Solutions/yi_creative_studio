'use client'

import { useRef, useEffect } from 'react'
import { useLogos } from '@/hooks'
import { useCreativeStore } from '@/stores/creative-store'
import { Loader2, Sparkles } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { EnhancedStripSettings } from './enhanced-strip-settings'
import { EnhancedStripCanvas } from './enhanced-strip-canvas'

/**
 * Simplified Logo Step - v3
 * Shows:
 * 1. Preview (left column) - Live preview of the 4-row strip
 * 2. 4-Row Strip Settings (right column) - Configuration options
 *
 * Logo Library section removed - logos auto-detected from library
 * Old tabs (Appearance, Placement) backed up in logo-step.backup.tsx
 */
export function LogoStep() {
  const { logos, isLoading } = useLogos()
  const { initializeDefaultLogoPlacements } = useCreativeStore()

  // Track if we've already initialized brand logos for this session
  const hasInitializedRef = useRef(false)

  // Auto-place brand logos when loaded
  useEffect(() => {
    if (logos.length > 0 && !isLoading && !hasInitializedRef.current) {
      initializeDefaultLogoPlacements(logos)
      hasInitializedRef.current = true
    }
  }, [logos, isLoading, initializeDefaultLogoPlacements])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Logo & Branding</h3>
        </div>
        <p className="text-sm text-muted-foreground max-w-xl">
          Configure your logo strip and brand elements. Logos are automatically detected from your library.
        </p>
      </div>

      {/* Main Layout: Two Column on Desktop - Preview Left, Settings Right */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Preview (Larger) */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="sticky top-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Live Preview</CardTitle>
              <CardDescription className="text-xs">
                How your logo strip will appear on the poster
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EnhancedStripCanvas className="scale-110 origin-top" />
            </CardContent>
          </Card>
        </div>

        {/* Right Column: 4-Row Strip Settings */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="max-h-[calc(100vh-200px)] flex flex-col">
            <CardHeader className="pb-3 flex-shrink-0">
              <CardTitle className="text-sm font-medium">Logo Strip Configuration</CardTitle>
              <CardDescription className="text-xs">
                Set up your header and footer branding
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto">
              <EnhancedStripSettings />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
