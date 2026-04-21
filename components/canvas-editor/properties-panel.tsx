'use client'

import { useEffect, useState } from 'react'
import * as fabric from 'fabric'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Separator } from '@/components/ui/separator'

interface PropertiesPanelProps {
  canvas: fabric.Canvas | null
}

interface SelectedProps {
  type: string
  fill: string
  opacity: number
  fontSize?: number
  fontWeight?: string
}

export function PropertiesPanel({ canvas }: PropertiesPanelProps) {
  const [selected, setSelected] = useState<SelectedProps | null>(null)

  useEffect(() => {
    if (!canvas) return

    const onSelect = () => {
      const obj = canvas.getActiveObject()
      if (!obj) { setSelected(null); return }
      setSelected({
        type: obj.type ?? 'object',
        fill: (typeof obj.fill === 'string' ? obj.fill : '#ffffff'),
        opacity: Math.round((obj.opacity ?? 1) * 100),
        fontSize: obj instanceof fabric.IText ? obj.fontSize : undefined,
        fontWeight: obj instanceof fabric.IText ? String(obj.fontWeight ?? 'normal') : undefined,
      })
    }

    canvas.on('selection:created', onSelect)
    canvas.on('selection:updated', onSelect)
    canvas.on('selection:cleared', () => setSelected(null))

    return () => {
      canvas.off('selection:created', onSelect)
      canvas.off('selection:updated', onSelect)
      canvas.off('selection:cleared')
    }
  }, [canvas])

  if (!selected) {
    return (
      <div className="p-4 text-center text-muted-foreground text-sm">
        Select an element to edit its properties
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

  return (
    <div className="flex flex-col gap-4 p-4">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        {selected.type} Properties
      </p>

      <div className="space-y-2">
        <Label className="text-xs">Fill Color</Label>
        <Input
          type="color"
          className="h-9 w-full cursor-pointer p-1"
          value={selected.fill.startsWith('#') ? selected.fill : '#ffffff'}
          onChange={(e) => {
            setSelected((s) => s ? { ...s, fill: e.target.value } : s)
            update({ fill: e.target.value })
          }}
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Opacity — {selected.opacity}%</Label>
        <Slider
          min={10} max={100} step={5}
          value={[selected.opacity]}
          onValueChange={([v]) => {
            setSelected((s) => s ? { ...s, opacity: v } : s)
            update({ opacity: v / 100 })
          }}
        />
      </div>

      {selected.fontSize !== undefined && (
        <>
          <Separator />
          <div className="space-y-2">
            <Label className="text-xs">Font Size</Label>
            <Input
              type="number"
              min={8} max={300}
              value={selected.fontSize}
              className="h-9"
              onChange={(e) => {
                const size = parseInt(e.target.value)
                setSelected((s) => s ? { ...s, fontSize: size } : s)
                update({ fontSize: size })
              }}
            />
          </div>
        </>
      )}
    </div>
  )
}
