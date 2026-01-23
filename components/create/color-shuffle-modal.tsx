'use client'

/**
 * Color Shuffle Modal Component
 *
 * Displays carousel of color-shuffled variants with:
 * - Large preview with left/right arrow navigation
 * - Thumbnail filmstrip (scrollable)
 * - Dots indicator
 * - Keyboard navigation (Arrow keys, ESC)
 * - "Keep This" action to save variant
 * - "Shuffle Again" to generate new variants
 */

import { useEffect, useCallback } from 'react'
import { useCreativeStore } from '@/stores/creative-store'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Loader2, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ColorShuffleModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  creativeId: string | null
}

export function ColorShuffleModal({
  open,
  onOpenChange,
  creativeId,
}: ColorShuffleModalProps) {
  const {
    colorShuffle,
    shuffleColors,
    selectVariant,
    keepVariant,
    resetToOriginal,
  } = useCreativeStore()

  const {
    shuffleVariants,
    activeVariantIndex,
    isShuffling,
    isSaving,
    shuffleError,
  } = colorShuffle

  // Handle initial shuffle when modal opens
  useEffect(() => {
    if (open && creativeId && shuffleVariants.length === 0 && !isShuffling) {
      shuffleColors(creativeId)
    }
  }, [open, creativeId, shuffleVariants.length, isShuffling, shuffleColors])

  // Keyboard navigation
  useEffect(() => {
    if (!open) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault()
          handlePrevious()
          break
        case 'ArrowRight':
          e.preventDefault()
          handleNext()
          break
        case 'Home':
          e.preventDefault()
          selectVariant(0)
          break
        case 'End':
          e.preventDefault()
          selectVariant(shuffleVariants.length - 1)
          break
        case 'Escape':
          e.preventDefault()
          onOpenChange(false)
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, shuffleVariants.length, activeVariantIndex])

  const handlePrevious = useCallback(() => {
    if (activeVariantIndex > 0) {
      selectVariant(activeVariantIndex - 1)
    }
  }, [activeVariantIndex, selectVariant])

  const handleNext = useCallback(() => {
    if (activeVariantIndex < shuffleVariants.length - 1) {
      selectVariant(activeVariantIndex + 1)
    }
  }, [activeVariantIndex, shuffleVariants.length, selectVariant])

  const handleShuffleAgain = useCallback(() => {
    if (creativeId && !isShuffling) {
      shuffleColors(creativeId)
    }
  }, [creativeId, isShuffling, shuffleColors])

  const handleKeepThis = useCallback(async () => {
    await keepVariant()
    // Close modal after successful save
    if (!colorShuffle.shuffleError) {
      onOpenChange(false)
    }
  }, [keepVariant, colorShuffle.shuffleError, onOpenChange])

  const handleClose = useCallback(() => {
    resetToOriginal()
    onOpenChange(false)
  }, [resetToOriginal, onOpenChange])

  const currentVariant = shuffleVariants[activeVariantIndex]

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Shuffle Your Colors
          </DialogTitle>
          <DialogDescription>
            Try different color combinations using your selected palette.
            Choose your favorite and click "Keep This" to save it.
          </DialogDescription>
        </DialogHeader>

        {/* Error State */}
        {shuffleError && (
          <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
            {shuffleError}
          </div>
        )}

        {/* Loading State */}
        {isShuffling && shuffleVariants.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              Analyzing colors and generating variants...
            </p>
          </div>
        )}

        {/* Carousel UI */}
        {shuffleVariants.length > 0 && currentVariant && (
          <div className="space-y-6">
            {/* Large Preview with Navigation Arrows */}
            <div className="relative">
              {/* Left Arrow */}
              <Button
                variant="outline"
                size="icon"
                className="absolute left-2 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm"
                onClick={handlePrevious}
                disabled={activeVariantIndex === 0}
              >
                <ChevronLeft className="h-5 w-5" />
                <span className="sr-only">Previous variant</span>
              </Button>

              {/* Preview Image */}
              <div className="flex justify-center">
                <img
                  src={currentVariant.imageDataUrl}
                  alt={`Color variant ${currentVariant.variantIndex}`}
                  className="max-h-[500px] w-auto rounded-lg border shadow-lg"
                />
              </div>

              {/* Right Arrow */}
              <Button
                variant="outline"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm"
                onClick={handleNext}
                disabled={activeVariantIndex === shuffleVariants.length - 1}
              >
                <ChevronRight className="h-5 w-5" />
                <span className="sr-only">Next variant</span>
              </Button>
            </div>

            {/* Thumbnail Filmstrip */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {shuffleVariants.map((variant, idx) => (
                <button
                  key={variant.id}
                  onClick={() => selectVariant(idx)}
                  className={cn(
                    'flex-shrink-0 rounded-md border-2 transition-all',
                    idx === activeVariantIndex
                      ? 'border-primary ring-2 ring-primary ring-offset-2'
                      : 'border-transparent hover:border-muted-foreground/50'
                  )}
                >
                  <img
                    src={variant.thumbnailDataUrl}
                    alt={`Variant ${variant.variantIndex} thumbnail`}
                    className="w-16 h-20 object-cover rounded-sm"
                  />
                </button>
              ))}
            </div>

            {/* Dots Indicator */}
            <div className="flex justify-center gap-1.5">
              {shuffleVariants.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => selectVariant(idx)}
                  className={cn(
                    'h-2 rounded-full transition-all',
                    idx === activeVariantIndex
                      ? 'w-8 bg-primary'
                      : 'w-2 bg-muted hover:bg-muted-foreground/50'
                  )}
                  aria-label={`Go to variant ${idx + 1}`}
                />
              ))}
            </div>

            {/* Variant Info */}
            <div className="text-center space-y-1">
              <p className="text-sm font-medium">
                Variant {activeVariantIndex + 1} of {shuffleVariants.length}
              </p>
              <p className="text-xs text-muted-foreground">
                {currentVariant.description}
              </p>
            </div>
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <div className="flex-1 text-left">
            <p className="text-xs text-muted-foreground">
              Keyboard: ← → to navigate, ESC to close
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleShuffleAgain}
              disabled={isShuffling || isSaving}
              className="gap-2"
            >
              {isShuffling ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Shuffling...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Shuffle Again
                </>
              )}
            </Button>
            <Button
              onClick={handleKeepThis}
              disabled={isSaving || shuffleVariants.length === 0}
              className="gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Keep This'
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Missing Palette icon import
function Palette({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
      <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
      <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
      <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
    </svg>
  )
}
