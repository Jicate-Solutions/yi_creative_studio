'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import * as fabric from 'fabric'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Loader2, Save, X } from 'lucide-react'
import { toast } from 'sonner'
import { FabricCanvas } from './fabric-canvas'
import { EditorToolbar } from './editor-toolbar'
import { PropertiesPanel } from './properties-panel'
import { exportCanvasAsBlob } from './utils/export-utils'

interface OrgLogo { id: string; name: string; url: string }

interface CanvasEditorModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  backgroundImageUrl: string
  designWidth: number
  designHeight: number
  parentCreativeId: string
  organizationId: string
  orgLogos: OrgLogo[]
  onVariantSaved?: (variantId: string, imageUrl: string) => void
}

export function CanvasEditorModal({
  open,
  onOpenChange,
  backgroundImageUrl,
  designWidth,
  designHeight,
  parentCreativeId,
  organizationId,
  orgLogos,
  onVariantSaved,
}: CanvasEditorModalProps) {
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const undoFnRef = useRef<() => void>(() => {})
  const redoFnRef = useRef<() => void>(() => {})
  const deleteFnRef = useRef<() => void>(() => {})

  // Calculate display size — fit in modal (max 70vh height)
  const maxDisplayHeight = typeof window !== 'undefined' ? window.innerHeight * 0.7 : 800
  const maxDisplayWidth = maxDisplayHeight * (designWidth / designHeight)
  const scale = Math.min(maxDisplayWidth / designWidth, maxDisplayHeight / designHeight)
  const displayWidth = Math.round(designWidth * scale)
  const displayHeight = Math.round(designHeight * scale)

  const handleCanvasReady = useCallback((c: fabric.Canvas) => setCanvas(c), [])
  const handleSetUndo = useCallback((fn: () => void) => { undoFnRef.current = fn }, [])
  const handleSetRedo = useCallback((fn: () => void) => { redoFnRef.current = fn }, [])
  const handleSetDelete = useCallback((fn: () => void) => { deleteFnRef.current = fn }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') deleteFnRef.current?.()
      if (e.ctrlKey && e.key === 'z') undoFnRef.current?.()
      if (e.ctrlKey && e.shiftKey && e.key === 'Z') redoFnRef.current?.()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  const handleSave = async () => {
    if (!canvas) return
    setIsSaving(true)
    try {
      const blob = await exportCanvasAsBlob(canvas, designWidth, displayWidth)

      const fd = new FormData()
      fd.append('image', blob, 'variant.png')
      fd.append('parentCreativeId', parentCreativeId)
      fd.append('organizationId', organizationId)

      const res = await fetch('/api/creatives/save-variant', { method: 'POST', body: fd })
      if (!res.ok) throw new Error('Save failed')

      const { variantId, imageUrl } = await res.json()
      toast.success('Edited version saved to gallery!')
      onVariantSaved?.(variantId, imageUrl)
      onOpenChange(false)
    } catch (err) {
      toast.error('Could not save. Please try again.')
      console.error(err)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-full h-[95vh] flex flex-col p-0 gap-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="flex flex-row items-center justify-between px-4 py-3 border-b border-border/50 shrink-0">
          <DialogTitle className="text-base font-semibold">Edit Creative</DialogTitle>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleSave}
              disabled={isSaving || !canvas}
              size="sm"
              className="gap-2 bg-gradient-to-r from-violet-500 to-indigo-500 text-white hover:from-violet-600 hover:to-indigo-600"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save to Gallery
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Editor body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Canvas area */}
          <div className="flex-1 flex items-center justify-center bg-muted/30 p-6 overflow-auto">
            <FabricCanvas
              backgroundImageUrl={backgroundImageUrl}
              designWidth={designWidth}
              designHeight={designHeight}
              displayWidth={displayWidth}
              displayHeight={displayHeight}
              onCanvasReady={handleCanvasReady}
              onUndo={handleSetUndo}
              onRedo={handleSetRedo}
              onDeleteSelected={handleSetDelete}
            />
          </div>

          {/* Right panel */}
          <div className="w-56 shrink-0 flex flex-col border-l border-border/50 overflow-hidden">
            <EditorToolbar
              canvas={canvas}
              orgLogos={orgLogos}
              onUndo={() => undoFnRef.current?.()}
              onRedo={() => redoFnRef.current?.()}
              onDeleteSelected={() => deleteFnRef.current?.()}
              className="flex-1"
            />
            <Separator />
            <PropertiesPanel canvas={canvas} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
