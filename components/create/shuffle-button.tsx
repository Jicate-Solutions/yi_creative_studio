'use client'

/**
 * Shuffle Colors Button Component
 *
 * Triggers color shuffle modal to generate and display color variants
 * of the generated creative using semantic recoloring.
 *
 * Features:
 * - Only appears when image is generated
 * - Disabled during generation or if no custom colors
 * - Shows loading state during shuffle
 * - Tooltip for first-time users
 */

import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Loader2, Palette } from 'lucide-react'
import { useCreativeStore } from '@/stores/creative-store'
import { useState } from 'react'

interface ShuffleButtonProps {
  creativeId: string | null
  onShuffleClick: () => void
}

export function ShuffleButton({ creativeId, onShuffleClick }: ShuffleButtonProps) {
  const { generatedImage, isGenerating, colorShuffle } = useCreativeStore()
  const [showTooltip, setShowTooltip] = useState(false)

  // Don't show button if no image generated
  if (!generatedImage || !creativeId) {
    return null
  }

  const isDisabled = isGenerating || colorShuffle.isShuffling

  return (
    <TooltipProvider>
      <Tooltip open={showTooltip} onOpenChange={setShowTooltip}>
        <TooltipTrigger asChild>
          <Button
            variant="secondary"
            onClick={onShuffleClick}
            disabled={isDisabled}
            className="gap-2"
          >
            {colorShuffle.isShuffling ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Shuffling colors...
              </>
            ) : (
              <>
                <Palette className="h-4 w-4" />
                Shuffle Colors
              </>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Try different color combinations with one click!</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
