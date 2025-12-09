'use client'

import { Button } from '@/components/ui/button'
import { Download, X, ZoomIn, ZoomOut } from 'lucide-react'
import { useState, useEffect } from 'react'

interface ImagePreviewModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  imageUrl: string
  imageName?: string
  onDownloadClick?: () => void
}

export function ImagePreviewModal({
  open,
  onOpenChange,
  imageUrl,
  imageName,
  onDownloadClick
}: ImagePreviewModalProps) {
  const [zoom, setZoom] = useState(100)

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onOpenChange(false)
      }
    }

    if (open) {
      document.addEventListener('keydown', handleKeyDown)
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [open, onOpenChange])

  // Reset zoom when modal opens
  useEffect(() => {
    if (open) {
      setZoom(100)
    }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/95"
        onClick={() => onOpenChange(false)}
      />

      {/* Header with controls - fixed at top */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
        <span className="text-white font-medium truncate max-w-[40%]">
          {imageName || 'Generated Creative'}
        </span>
        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20 h-8 w-8"
            onClick={() => setZoom(z => Math.max(25, z - 25))}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-white text-sm min-w-[4ch] text-center">{zoom}%</span>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20 h-8 w-8"
            onClick={() => setZoom(z => Math.min(300, z + 25))}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>

          {/* Download button */}
          {onDownloadClick && (
            <Button
              variant="secondary"
              size="sm"
              className="gap-1.5 ml-2"
              onClick={onDownloadClick}
            >
              <Download className="h-4 w-4" />
              Download
            </Button>
          )}

          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20 h-8 w-8 ml-2"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Full screen image container */}
      <div
        className="absolute inset-0 flex items-center justify-center overflow-auto pt-16 pb-4 px-4"
        onClick={(e) => {
          // Close when clicking outside the image
          if (e.target === e.currentTarget) {
            onOpenChange(false)
          }
        }}
      >
        <img
          src={imageUrl}
          alt={imageName || 'Preview'}
          style={{
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'center center',
          }}
          className="max-w-full max-h-full object-contain transition-transform duration-200 cursor-default"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </div>
  )
}
