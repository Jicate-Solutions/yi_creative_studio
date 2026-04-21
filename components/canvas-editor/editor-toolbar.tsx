'use client'

import * as fabric from 'fabric'
import { Type, Square, Circle, Image as ImageIcon, Undo2, Redo2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface OrgLogo {
  id: string
  name: string
  url: string
}

interface EditorToolbarProps {
  canvas: fabric.Canvas | null
  orgLogos: OrgLogo[]
  onUndo: () => void
  onRedo: () => void
  onDeleteSelected: () => void
  className?: string
}

export function EditorToolbar({
  canvas,
  orgLogos,
  onUndo,
  onRedo,
  onDeleteSelected,
  className,
}: EditorToolbarProps) {
  const addText = () => {
    if (!canvas) return
    const text = new fabric.IText('Edit this text', {
      left: 100,
      top: 100,
      fontFamily: 'Inter, sans-serif',
      fontSize: 36,
      fill: '#FFFFFF',
      fontWeight: 'bold',
      shadow: new fabric.Shadow({ color: 'rgba(0,0,0,0.6)', blur: 8, offsetX: 0, offsetY: 2 }),
    })
    canvas.add(text)
    canvas.setActiveObject(text)
    canvas.renderAll()
    // Enter edit mode immediately
    text.enterEditing()
  }

  const addRect = () => {
    if (!canvas) return
    const rect = new fabric.Rect({
      left: 80, top: 80, width: 200, height: 80,
      fill: 'rgba(0,91,150,0.7)', // Yi primary
      rx: 8, ry: 8,
      stroke: 'rgba(255,255,255,0.3)',
      strokeWidth: 1,
    })
    canvas.add(rect)
    canvas.setActiveObject(rect)
    canvas.renderAll()
  }

  const addCircle = () => {
    if (!canvas) return
    const circle = new fabric.Circle({
      left: 80, top: 80, radius: 50,
      fill: 'rgba(255,107,53,0.7)', // Yi secondary
    })
    canvas.add(circle)
    canvas.setActiveObject(circle)
    canvas.renderAll()
  }

  const addLogo = (logo: OrgLogo) => {
    if (!canvas) return
    fabric.Image.fromURL(logo.url, { crossOrigin: 'anonymous' }).then((img) => {
      img.set({ left: 40, top: 40 })
      img.scaleToHeight(80)
      canvas.add(img)
      canvas.setActiveObject(img)
      canvas.renderAll()
    })
  }

  return (
    <div className={cn('flex flex-col gap-2 p-3 bg-card border-l border-border/50 overflow-y-auto', className)}>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">Tools</p>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline" size="sm" className="w-full justify-start gap-2" onClick={addText}>
            <Type className="h-4 w-4" /> Add Text
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">Add editable text</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline" size="sm" className="w-full justify-start gap-2" onClick={addRect}>
            <Square className="h-4 w-4" /> Rectangle
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">Add rectangle shape</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline" size="sm" className="w-full justify-start gap-2" onClick={addCircle}>
            <Circle className="h-4 w-4" /> Circle
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">Add circle shape</TooltipContent>
      </Tooltip>

      {orgLogos.length > 0 && (
        <>
          <Separator className="my-1" />
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">Logos</p>
          {orgLogos.map((logo) => (
            <Tooltip key={logo.id}>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start gap-2 truncate"
                  onClick={() => addLogo(logo)}
                >
                  <ImageIcon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{logo.name}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">Add {logo.name}</TooltipContent>
            </Tooltip>
          ))}
        </>
      )}

      <Separator className="my-1" />
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">History</p>

      <div className="flex gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="sm" className="flex-1" onClick={onUndo}>
              <Undo2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">Undo (Ctrl+Z)</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="sm" className="flex-1" onClick={onRedo}>
              <Redo2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">Redo (Ctrl+Shift+Z)</TooltipContent>
        </Tooltip>
      </div>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline" size="sm" className="w-full gap-2 text-destructive hover:text-destructive" onClick={onDeleteSelected}>
            <Trash2 className="h-4 w-4" /> Delete
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">Delete selected (Del)</TooltipContent>
      </Tooltip>
    </div>
  )
}
