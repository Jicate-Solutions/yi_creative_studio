'use client'

import { useEffect, useState } from 'react'
import * as fabric from 'fabric'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Bold } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PropertiesPanelProps {
  canvas: fabric.Canvas | null
}

interface SelectedProps {
  type: string
  fill: string
  opacity: number
  stroke: string
  strokeWidth: number
  // text-only
  fontSize?: number
  isBold?: boolean
  textAlign?: 'left' | 'center' | 'right'
  charSpacing?: number
}

export function PropertiesPanel({ canvas }: PropertiesPanelProps) {
  const [selected, setSelected] = useState<SelectedProps | null>(null)

  useEffect(() => {
    if (!canvas) return

    const readObj = () => {
      const obj = canvas.getActiveObject()
      if (!obj) { setSelected(null); return }
      const isText = obj instanceof fabric.IText
      setSelected({
        type: obj.type ?? 'object',
        fill: typeof obj.fill === 'string' ? obj.fill : '#ffffff',
        opacity: Math.round((obj.opacity ?? 1) * 100),
        stroke: typeof obj.stroke === 'string' ? obj.stroke : 'transparent',
        strokeWidth: obj.strokeWidth ?? 0,
        // text props
        fontSize:    isText ? (obj as fabric.IText).fontSize : undefined,
        isBold:      isText ? (obj as fabric.IText).fontWeight === 'bold' : undefined,
        textAlign:   isText ? ((obj as fabric.IText).textAlign as SelectedProps['textAlign']) ?? 'left' : undefined,
        charSpacing: isText ? (obj as fabric.IText).charSpacing ?? 0 : undefined,
      })
    }

    canvas.on('selection:created', readObj)
    canvas.on('selection:updated', readObj)
    canvas.on('selection:cleared', () => setSelected(null))
    canvas.on('object:modified', readObj)

    return () => {
      canvas.off('selection:created', readObj)
      canvas.off('selection:updated', readObj)
      canvas.off('selection:cleared')
      canvas.off('object:modified', readObj)
    }
  }, [canvas])

  if (!selected) {
    return (
      <div className="p-4 text-center text-xs text-muted-foreground/60 leading-relaxed">
        Select an element<br />to edit its properties
      </div>
    )
  }

  const update = (props: Record<string, unknown>) => {
    const obj = canvas?.getActiveObject()
    if (!obj) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    obj.set(props as any)
    canvas?.renderAll()
  }

  const isText = selected.fontSize !== undefined

  return (
    <div className="flex flex-col gap-3 p-3">
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
        Properties
      </p>

      {/* ── Fill + Stroke colors (side by side) ── */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground/70">Fill</Label>
          <Input
            type="color"
            className="h-8 w-full cursor-pointer p-0.5 rounded"
            value={selected.fill.startsWith('#') ? selected.fill : '#ffffff'}
            onChange={(e) => {
              setSelected(s => s ? { ...s, fill: e.target.value } : s)
              update({ fill: e.target.value })
            }}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground/70">Stroke</Label>
          <Input
            type="color"
            className="h-8 w-full cursor-pointer p-0.5 rounded"
            value={selected.stroke.startsWith('#') ? selected.stroke : '#ffffff'}
            onChange={(e) => {
              setSelected(s => s ? { ...s, stroke: e.target.value } : s)
              update({ stroke: e.target.value })
            }}
          />
        </div>
      </div>

      {/* ── Stroke width ── */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground/70">Stroke width — {selected.strokeWidth}px</Label>
        <Slider
          min={0} max={20} step={1}
          value={[selected.strokeWidth]}
          onValueChange={([v]) => {
            setSelected(s => s ? { ...s, strokeWidth: v } : s)
            update({ strokeWidth: v })
          }}
        />
      </div>

      {/* ── Opacity ── */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground/70">Opacity — {selected.opacity}%</Label>
        <Slider
          min={10} max={100} step={5}
          value={[selected.opacity]}
          onValueChange={([v]) => {
            setSelected(s => s ? { ...s, opacity: v } : s)
            update({ opacity: v / 100 })
          }}
        />
      </div>

      {/* ── Text properties ── */}
      {isText && (
        <>
          <Separator />

          {/* Font size + Bold */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground/70">Size</Label>
              <Input
                type="number" min={8} max={400}
                value={selected.fontSize}
                className="h-8 text-xs"
                onChange={(e) => {
                  const size = Math.max(8, parseInt(e.target.value) || 8)
                  setSelected(s => s ? { ...s, fontSize: size } : s)
                  update({ fontSize: size })
                }}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground/70">Style</Label>
              <Button
                variant={selected.isBold ? 'default' : 'outline'}
                size="sm"
                className="w-full h-8"
                onClick={() => {
                  const next = !selected.isBold
                  setSelected(s => s ? { ...s, isBold: next } : s)
                  update({ fontWeight: next ? 'bold' : 'normal' })
                }}
              >
                <Bold className="h-3.5 w-3.5 mr-1" /> Bold
              </Button>
            </div>
          </div>

          {/* Text alignment */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground/70">Alignment</Label>
            <div className="flex rounded-md border border-border/60 overflow-hidden">
              {(['left', 'center', 'right'] as const).map((align) => (
                <button
                  key={align}
                  onClick={() => {
                    setSelected(s => s ? { ...s, textAlign: align } : s)
                    update({ textAlign: align })
                  }}
                  className={cn(
                    'flex-1 h-7 text-[11px] font-semibold transition-colors border-r border-border/60 last:border-r-0',
                    selected.textAlign === align
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted/50 text-muted-foreground'
                  )}
                >
                  {align === 'left' ? '⬛\u200A' : align === 'center' ? '☰' : '\u200A⬛'}
                  {align.charAt(0).toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Letter spacing */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground/70">Letter spacing — {selected.charSpacing ?? 0}</Label>
            <Slider
              min={-100} max={800} step={10}
              value={[selected.charSpacing ?? 0]}
              onValueChange={([v]) => {
                setSelected(s => s ? { ...s, charSpacing: v } : s)
                update({ charSpacing: v })
              }}
            />
          </div>
        </>
      )}
    </div>
  )
}
