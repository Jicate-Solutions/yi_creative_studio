'use client'

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Download, X, ZoomIn, ZoomOut } from 'lucide-react'
import { useState } from 'react'

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] w-[95vw] h-[95vh] p-0 overflow-hidden border-0 bg-black/95">
        <DialogTitle className="sr-only">Image Preview</DialogTitle>

        {/* Header with controls */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/70 to-transparent">
          <span className="text-white font-medium truncate max-w-[40%]">
            {imageName || 'Generated Creative'}
          </span>
          <div className="flex items-center gap-2">
            {/* Zoom controls */}
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20 h-8 w-8"
              onClick={() => setZoom(z => Math.max(50, z - 25))}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-white text-sm min-w-[4ch] text-center">{zoom}%</span>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20 h-8 w-8"
              onClick={() => setZoom(z => Math.min(200, z + 25))}
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

        {/* Image container with zoom */}
        <div className="flex items-center justify-center w-full h-full overflow-auto p-8 pt-16">
          <img
            src={imageUrl}
            alt={imageName || 'Preview'}
            style={{ transform: `scale(${zoom / 100})` }}
            className="max-w-full max-h-full object-contain transition-transform duration-200"
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
