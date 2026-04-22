'use client'

import { useEffect, useState } from 'react'
import * as fabric from 'fabric'
import {
  Type, Square, Circle, Image as ImageIcon,
  Undo2, Redo2, Trash2, Copy, Layers, ChevronDown,
  BringToFront, SendToBack, ChevronUp,
  AlignCenterHorizontal, AlignCenterVertical, FlipHorizontal,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface OrgLogo { id: string; name: string; url: string }

interface EditorToolbarProps {
  canvas: fabric.Canvas | null
  orgLogos: OrgLogo[]
  onUndo: () => void
  onRedo: () => void
  onDeleteSelected: () => void
  className?: string
}

export function EditorToolbar({ canvas, orgLogos, onUndo, onRedo, onDeleteSelected, className }: EditorToolbarProps) {
  const [hasSelection, setHasSelection] = useState(false)
  const [logosOpen, setLogosOpen] = useState(false)

  useEffect(() => {
    if (!canvas) return
    const on = () => setHasSelection(true)
    const off = () => setHasSelection(false)
    canvas.on('selection:created', on)
    canvas.on('selection:updated', on)
    canvas.on('selection:cleared', off)
    return () => {
      canvas.off('selection:created', on)
      canvas.off('selection:updated', on)
      canvas.off('selection:cleared', off)
    }
  }, [canvas])

  // ── Add elements ────────────────────────────────────────────────────────────
  const addText = () => {
    if (!canvas) return
    const text = new fabric.IText('Edit this text', {
      left: 100, top: 100,
      fontFamily: 'Inter, sans-serif',
      fontSize: 36, fill: '#FFFFFF', fontWeight: 'bold',
      shadow: new fabric.Shadow({ color: 'rgba(0,0,0,0.6)', blur: 8, offsetX: 0, offsetY: 2 }),
    })
    canvas.add(text); canvas.setActiveObject(text); canvas.renderAll()
    text.enterEditing()
  }

  const addRect = () => {
    if (!canvas) return
    const rect = new fabric.Rect({
      left: 80, top: 80, width: 200, height: 80,
      fill: 'rgba(0,91,150,0.7)', rx: 8, ry: 8,
      stroke: 'rgba(255,255,255,0.3)', strokeWidth: 1,
    })
    canvas.add(rect); canvas.setActiveObject(rect); canvas.renderAll()
  }

  const addCircle = () => {
    if (!canvas) return
    const circle = new fabric.Circle({ left: 80, top: 80, radius: 50, fill: 'rgba(255,107,53,0.7)' })
    canvas.add(circle); canvas.setActiveObject(circle); canvas.renderAll()
  }

  const addLogo = (logo: OrgLogo) => {
    if (!canvas) return
    fabric.Image.fromURL(logo.url, { crossOrigin: 'anonymous' }).then((img) => {
      img.set({ left: 40, top: 40 }); img.scaleToHeight(80)
      canvas.add(img); canvas.setActiveObject(img); canvas.renderAll()
    })
    setLogosOpen(false) // close after selecting
  }

  // ── Layer ordering ──────────────────────────────────────────────────────────
  const withActive = (fn: (obj: fabric.FabricObject) => void) => {
    const obj = canvas?.getActiveObject()
    if (!obj || !canvas) return
    fn(obj); canvas.renderAll()
  }

  const bringToFront = () => withActive(obj => canvas!.bringObjectToFront(obj))
  const bringForward = () => withActive(obj => canvas!.bringObjectForward(obj))
  const sendBackward = () => withActive(obj => canvas!.sendObjectBackwards(obj))
  const sendToBack   = () => withActive(obj => canvas!.sendObjectToBack(obj))

  // ── Arrange ─────────────────────────────────────────────────────────────────
  const centerH = () => withActive(obj => {
    const zoom = canvas!.getZoom()
    obj.set({ left: canvas!.getWidth() / zoom / 2 - obj.getScaledWidth() / 2 })
  })
  const centerV = () => withActive(obj => {
    const zoom = canvas!.getZoom()
    obj.set({ top: canvas!.getHeight() / zoom / 2 - obj.getScaledHeight() / 2 })
  })
  const flipH = () => withActive(obj => obj.set({ flipX: !obj.flipX }))
  const duplicate = () => {
    const obj = canvas?.getActiveObject()
    if (!obj || !canvas) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(obj.clone() as Promise<any>).then((cloned: fabric.FabricObject) => {
      cloned.set({ left: (obj.left ?? 0) + 20, top: (obj.top ?? 0) + 20 })
      canvas.add(cloned); canvas.setActiveObject(cloned); canvas.renderAll()
    })
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const IBtn = ({ icon: Icon, label, onClick, disabled = false }: {
    icon: React.FC<{ className?: string }>; label: string; onClick: () => void; disabled?: boolean
  }) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="outline" size="sm" className="flex-1 px-0 h-7" onClick={onClick} disabled={disabled}>
          <Icon className="h-3.5 w-3.5" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="left" className="text-xs">{label}</TooltipContent>
    </Tooltip>
  )

  const Label = ({ children }: { children: React.ReactNode }) => (
    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 px-0.5 mt-1 select-none">
      {children}
    </p>
  )

  return (
    <div className={cn('flex flex-col gap-1.5 p-3 overflow-y-auto', className)}>

      {/* ── ADD ── */}
      <Label>Add</Label>
      <Button variant="outline" size="sm" className="w-full justify-start gap-2 h-8" onClick={addText}>
        <Type className="h-3.5 w-3.5" /> Add Text
      </Button>
      <div className="flex gap-1.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="sm" className="flex-1 gap-1.5 h-8" onClick={addRect}>
              <Square className="h-3.5 w-3.5" /> Rect
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">Add rectangle</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="sm" className="flex-1 gap-1.5 h-8" onClick={addCircle}>
              <Circle className="h-3.5 w-3.5" /> Circle
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">Add circle</TooltipContent>
        </Tooltip>
      </div>

      {/* ── LOGOS — collapsible dropdown ── */}
      {orgLogos.length > 0 && (
        <>
          <Separator className="my-0.5" />

          {/* Toggle header */}
          <button
            onClick={() => setLogosOpen(v => !v)}
            className={cn(
              'flex items-center justify-between w-full px-2 py-1.5 rounded-md text-left',
              'transition-colors hover:bg-muted/50 active:bg-muted',
              logosOpen && 'bg-muted/30'
            )}
          >
            <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
              <ImageIcon className="h-3 w-3" />
              Logos
              <span className="text-[9px] font-normal normal-case tracking-normal bg-muted text-muted-foreground/70 rounded px-1 py-0.5">
                {orgLogos.length}
              </span>
            </span>
            <ChevronDown
              className={cn(
                'h-3.5 w-3.5 text-muted-foreground/40 transition-transform duration-200',
                logosOpen && 'rotate-180'
              )}
            />
          </button>

          {/* Collapsed logo grid */}
          {logosOpen && (
            <div className="flex flex-col gap-1 pl-1 pr-0.5 pb-1 max-h-48 overflow-y-auto rounded-md border border-border/40 bg-muted/10">
              {orgLogos.map((logo) => (
                <Tooltip key={logo.id}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => addLogo(logo)}
                      className="flex items-center gap-2 w-full px-2 py-1.5 rounded text-left text-xs hover:bg-muted/60 active:bg-muted transition-colors"
                    >
                      <ImageIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                      <span className="truncate text-foreground/80">{logo.name}</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="left">Add {logo.name} to canvas</TooltipContent>
                </Tooltip>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── LAYERS ── */}
      <Separator className="my-0.5" />
      <Label>
        <span className="inline-flex items-center gap-1">
          <Layers className="h-2.5 w-2.5" /> Layers
        </span>
      </Label>
      <div className="grid grid-cols-4 gap-1">
        <IBtn icon={BringToFront} label="Bring to Front" onClick={bringToFront} disabled={!hasSelection} />
        <IBtn icon={ChevronUp}    label="Bring Forward"  onClick={bringForward} disabled={!hasSelection} />
        <IBtn icon={ChevronDown}  label="Send Backward"  onClick={sendBackward} disabled={!hasSelection} />
        <IBtn icon={SendToBack}   label="Send to Back"   onClick={sendToBack}   disabled={!hasSelection} />
      </div>
      <div className="flex justify-between px-1">
        <span className="text-[9px] text-muted-foreground/30">Front</span>
        <span className="text-[9px] text-muted-foreground/30">Back</span>
      </div>

      {/* ── ARRANGE ── */}
      <Separator className="my-0.5" />
      <Label>Arrange</Label>
      <div className="grid grid-cols-4 gap-1">
        <IBtn icon={AlignCenterHorizontal} label="Center horizontally" onClick={centerH}   disabled={!hasSelection} />
        <IBtn icon={AlignCenterVertical}   label="Center vertically"   onClick={centerV}   disabled={!hasSelection} />
        <IBtn icon={FlipHorizontal}        label="Flip horizontal"     onClick={flipH}     disabled={!hasSelection} />
        <IBtn icon={Copy}                  label="Duplicate"           onClick={duplicate} disabled={!hasSelection} />
      </div>

      {/* ── HISTORY + DELETE ── */}
      <Separator className="my-0.5" />
      <Label>History</Label>
      <div className="flex gap-1.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="sm" className="flex-1 h-8" onClick={onUndo}>
              <Undo2 className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">Undo (Ctrl+Z)</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="sm" className="flex-1 h-8" onClick={onRedo}>
              <Redo2 className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">Redo (Ctrl+Shift+Z)</TooltipContent>
        </Tooltip>
      </div>

      <Button
        variant="outline" size="sm"
        className="w-full gap-2 h-8 text-destructive hover:text-destructive border-destructive/20 hover:border-destructive/40 mt-0.5"
        onClick={onDeleteSelected}
        disabled={!hasSelection}
      >
        <Trash2 className="h-3.5 w-3.5" /> Delete Selected
      </Button>
    </div>
  )
}
