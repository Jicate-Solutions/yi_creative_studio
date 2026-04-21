'use client'

import { useEffect } from 'react'
import * as fabric from 'fabric'
import { useFabricCanvas } from './hooks/use-fabric-canvas'
import { cn } from '@/lib/utils'

interface FabricCanvasProps {
  backgroundImageUrl: string
  /** Native design dimensions (e.g. 1080 × 1440) */
  designWidth: number
  designHeight: number
  /** Display dimensions — the canvas is scaled to fit the modal */
  displayWidth: number
  displayHeight: number
  onCanvasReady: (canvas: fabric.Canvas) => void
  onUndo: (fn: () => void) => void
  onRedo: (fn: () => void) => void
  onDeleteSelected: (fn: () => void) => void
  className?: string
}

export function FabricCanvas({
  backgroundImageUrl,
  designWidth,
  designHeight,
  displayWidth,
  displayHeight,
  onCanvasReady,
  onUndo,
  onRedo,
  onDeleteSelected,
  className,
}: FabricCanvasProps) {
  const { canvasRef, canvas, isReady, undo, redo, deleteSelected } = useFabricCanvas({
    backgroundImageUrl,
    width: designWidth,
    height: designHeight,
  })

  const scale = displayWidth / designWidth

  useEffect(() => {
    if (canvas && isReady) {
      onCanvasReady(canvas)
      onUndo(() => undo)
      onRedo(() => redo)
      onDeleteSelected(() => deleteSelected)
    }
  }, [canvas, isReady, onCanvasReady, onUndo, onRedo, onDeleteSelected, undo, redo, deleteSelected])

  return (
    <div
      className={cn('relative overflow-hidden rounded-lg shadow-2xl', className)}
      style={{ width: displayWidth, height: displayHeight }}
    >
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/50 rounded-lg z-10">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      )}
      <canvas
        ref={canvasRef}
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          width: designWidth,
          height: designHeight,
        }}
      />
    </div>
  )
}
