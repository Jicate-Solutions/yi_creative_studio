'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import * as fabric from 'fabric'

interface UseFabricCanvasOptions {
  backgroundImageUrl: string
  width: number
  height: number
}

interface UseFabricCanvasReturn {
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  canvas: fabric.Canvas | null
  isReady: boolean
  undo: () => void
  redo: () => void
  deleteSelected: () => void
}

export function useFabricCanvas({
  backgroundImageUrl,
  width,
  height,
}: UseFabricCanvasOptions): UseFabricCanvasReturn {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null)
  const [isReady, setIsReady] = useState(false)
  const historyRef = useRef<string[]>([])
  const historyIndexRef = useRef(-1)

  // Save state snapshot for undo/redo
  const saveSnapshot = useCallback((c: fabric.Canvas) => {
    const json = JSON.stringify(c.toJSON())
    // Trim forward history on new action
    historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1)
    historyRef.current.push(json)
    historyIndexRef.current = historyRef.current.length - 1
  }, [])

  useEffect(() => {
    if (!canvasRef.current) return

    const fc = new fabric.Canvas(canvasRef.current, {
      width,
      height,
      preserveObjectStacking: true,
      selection: true,
    })

    // Load background image (locked, non-selectable)
    fabric.Image.fromURL(backgroundImageUrl, { crossOrigin: 'anonymous' })
      .then((img) => {
        img.set({
          left: 0,
          top: 0,
          selectable: false,
          evented: false,
          lockMovementX: true,
          lockMovementY: true,
        })
        img.scaleToWidth(width)
        fc.backgroundImage = img
        fc.renderAll()
        saveSnapshot(fc)
        setIsReady(true)
      })

    // Auto-save on object modification
    fc.on('object:modified', () => saveSnapshot(fc))
    fc.on('object:added', () => saveSnapshot(fc))
    fc.on('object:removed', () => saveSnapshot(fc))

    setCanvas(fc)
    return () => { fc.dispose() }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [backgroundImageUrl, width, height])

  const undo = useCallback(() => {
    if (!canvas || historyIndexRef.current <= 0) return
    historyIndexRef.current -= 1
    canvas.loadFromJSON(historyRef.current[historyIndexRef.current]).then(() => {
      canvas.renderAll()
    })
  }, [canvas])

  const redo = useCallback(() => {
    if (!canvas || historyIndexRef.current >= historyRef.current.length - 1) return
    historyIndexRef.current += 1
    canvas.loadFromJSON(historyRef.current[historyIndexRef.current]).then(() => {
      canvas.renderAll()
    })
  }, [canvas])

  const deleteSelected = useCallback(() => {
    if (!canvas) return
    const active = canvas.getActiveObjects()
    active.forEach((obj) => canvas.remove(obj))
    canvas.discardActiveObject()
    canvas.renderAll()
  }, [canvas])

  return { canvasRef, canvas, isReady, undo, redo, deleteSelected }
}
