'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import type * as FabricTypes from 'fabric'

interface UseFabricCanvasOptions {
  backgroundImageUrl: string
  designWidth: number
  designHeight: number
  displayWidth: number
  displayHeight: number
}

interface UseFabricCanvasReturn {
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  canvas: FabricTypes.Canvas | null
  isReady: boolean
  undo: () => void
  redo: () => void
  deleteSelected: () => void
}

export function useFabricCanvas({
  backgroundImageUrl,
  designWidth,
  designHeight,
  displayWidth,
  displayHeight,
}: UseFabricCanvasOptions): UseFabricCanvasReturn {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fabricCanvasRef = useRef<FabricTypes.Canvas | null>(null)
  // Keep background image and zoom in refs — loadFromJSON calls clear() which
  // wipes both, so we always re-apply them after every undo/redo restore.
  const bgImageRef = useRef<FabricTypes.Image | null>(null)
  const zoomRef = useRef(displayWidth / designWidth)
  const [canvas, setCanvas] = useState<FabricTypes.Canvas | null>(null)
  const [isReady, setIsReady] = useState(false)
  const historyRef = useRef<string[]>([])
  const historyIndexRef = useRef(-1)

  useEffect(() => {
    zoomRef.current = displayWidth / designWidth
  }, [displayWidth, designWidth])

  // Snapshot only user-added objects (not the background image).
  // This avoids async image reloads during undo/redo and keeps snapshots small.
  const saveSnapshot = useCallback((c: FabricTypes.Canvas) => {
    const json = JSON.stringify({ objects: c.toJSON().objects })
    historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1)
    historyRef.current.push(json)
    historyIndexRef.current = historyRef.current.length - 1
  }, [])

  // After loadFromJSON wipes the canvas, restore the persistent background + zoom.
  const restoreAfterLoad = useCallback((c: FabricTypes.Canvas) => {
    if (bgImageRef.current) c.backgroundImage = bgImageRef.current
    c.setZoom(zoomRef.current)
    c.renderAll()
  }, [])

  useEffect(() => {
    if (!canvasRef.current) return
    let aborted = false

    import('fabric').then((fabric) => {
      if (aborted || !canvasRef.current) return

      const zoom = displayWidth / designWidth
      zoomRef.current = zoom

      const fc = new fabric.Canvas(canvasRef.current, {
        width: displayWidth,
        height: displayHeight,
        preserveObjectStacking: true,
        selection: true,
      })
      fc.setZoom(zoom)
      fabricCanvasRef.current = fc

      fabric.Image.fromURL(backgroundImageUrl, { crossOrigin: 'anonymous' })
        .then((img) => {
          if (aborted) { fc.dispose(); fabricCanvasRef.current = null; return }
          img.set({
            left: 0, top: 0,
            selectable: false, evented: false,
            lockMovementX: true, lockMovementY: true,
          })
          img.scaleToWidth(designWidth)
          fc.backgroundImage = img
          bgImageRef.current = img
          fc.renderAll()
          saveSnapshot(fc)
          setIsReady(true)
        })

      fc.on('object:modified', () => saveSnapshot(fc))
      fc.on('object:added',    () => saveSnapshot(fc))
      fc.on('object:removed',  () => saveSnapshot(fc))

      setCanvas(fc)
    }).catch(console.error)

    return () => {
      aborted = true
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.dispose()
        fabricCanvasRef.current = null
      }
      bgImageRef.current = null
      setCanvas(null)
      setIsReady(false)
      historyRef.current = []
      historyIndexRef.current = -1
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [backgroundImageUrl, designWidth, designHeight, displayWidth, displayHeight])

  const undo = useCallback(() => {
    if (!canvas || historyIndexRef.current <= 0) return
    historyIndexRef.current -= 1
    canvas.loadFromJSON(historyRef.current[historyIndexRef.current])
      .then(() => restoreAfterLoad(canvas))
      .catch(console.error)
  }, [canvas, restoreAfterLoad])

  const redo = useCallback(() => {
    if (!canvas || historyIndexRef.current >= historyRef.current.length - 1) return
    historyIndexRef.current += 1
    canvas.loadFromJSON(historyRef.current[historyIndexRef.current])
      .then(() => restoreAfterLoad(canvas))
      .catch(console.error)
  }, [canvas, restoreAfterLoad])

  const deleteSelected = useCallback(() => {
    if (!canvas) return
    const active = canvas.getActiveObjects()
    active.forEach((obj) => canvas.remove(obj))
    canvas.discardActiveObject()
    canvas.renderAll()
  }, [canvas])

  return { canvasRef, canvas, isReady, undo, redo, deleteSelected }
}
