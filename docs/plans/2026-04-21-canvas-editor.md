# Canvas Editor — Post-Generation Inline Editing

> **For Claude:** REQUIRED SUB-SKILL: Use executing-plans to implement this plan task-by-task.

**Goal:** Add a full-screen Fabric.js canvas editor that opens after image generation, letting users add logos/text/shapes, then saves the result as a new gallery variant without replacing the original.

**Architecture:** Fabric.js canvas loads the generated image as a locked background, overlays are added as draggable Fabric objects, and export uses `canvas.toDataURL()` → upload to Supabase Storage → new `creatives` row with `parent_creative_id` metadata. Canva Connect API (org-level OAuth, admin connects once) optionally syncs the finished asset to the chapter's Canva Brand Library.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, shadcn/ui, Fabric.js 6.x, Supabase Storage, Canva Connect API (OAuth 2.0 PKCE)

---

## Overview of Tasks

| # | Task | Touches |
|---|------|---------|
| 1 | Install Fabric.js | package.json |
| 2 | `use-fabric-canvas` hook | new hook file |
| 3 | `FabricCanvas` component | new component |
| 4 | `EditorToolbar` component | new component |
| 5 | `PropertiesPanel` component | new component |
| 6 | `CanvasEditorModal` (wires 2-5) | new component |
| 7 | `export-utils` — canvas → blob | new util |
| 8 | `save-variant` API route | new API route |
| 9 | "Edit" button in CanvasCreatePage | modify existing |
| 10 | Canva OAuth (authorize + callback) | new API routes |
| 11 | Canva sync API route | new API route |
| 12 | Settings → Integrations Canva section | modify settings page |

---

## Task 1 — Install Fabric.js

**Files:**
- Modify: `package.json`

**Step 1: Install the package**

```bash
npm install fabric@6
```

**Step 2: Verify it installed**

```bash
node -e "const f = require('fabric'); console.log(f.version)"
```
Expected: prints `6.x.x`

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat: install fabric.js 6 for canvas editor"
```

---

## Task 2 — `use-fabric-canvas` Hook

**Files:**
- Create: `components/canvas-editor/hooks/use-fabric-canvas.ts`

**What it does:** Initialises a Fabric.js canvas on a `<canvas>` ref, loads the background image (the generated poster), and returns the canvas instance plus helpers.

**Step 1: Create the hook**

```typescript
// components/canvas-editor/hooks/use-fabric-canvas.ts
'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import * as fabric from 'fabric'

interface UseFabricCanvasOptions {
  backgroundImageUrl: string
  width: number
  height: number
}

interface UseFabricCanvasReturn {
  canvasRef: React.RefObject<HTMLCanvasElement>
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
```

**Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: No errors on this file.

**Step 3: Commit**

```bash
git add components/canvas-editor/hooks/use-fabric-canvas.ts
git commit -m "feat: add use-fabric-canvas hook with undo/redo"
```

---

## Task 3 — `FabricCanvas` Component

**Files:**
- Create: `components/canvas-editor/fabric-canvas.tsx`

**What it does:** A React wrapper that renders the `<canvas>` element at the correct display size (scaled to fit the modal) and exposes the Fabric canvas instance to siblings via a callback.

**Step 1: Create the component**

```typescript
// components/canvas-editor/fabric-canvas.tsx
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
```

**Step 2: Check compile**

```bash
npx tsc --noEmit
```

**Step 3: Commit**

```bash
git add components/canvas-editor/fabric-canvas.tsx
git commit -m "feat: add FabricCanvas wrapper component"
```

---

## Task 4 — `EditorToolbar` Component

**Files:**
- Create: `components/canvas-editor/editor-toolbar.tsx`

**What it does:** Right-side panel with tools: Add Text, Add Logo (from org logos), Add Shape (rectangle/circle), Undo, Redo, Delete. Receives the Fabric canvas instance and mutates it.

**Step 1: Create the component**

```typescript
// components/canvas-editor/editor-toolbar.tsx
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
```

**Step 2: Compile check**

```bash
npx tsc --noEmit
```

**Step 3: Commit**

```bash
git add components/canvas-editor/editor-toolbar.tsx
git commit -m "feat: add EditorToolbar with text/shape/logo tools"
```

---

## Task 5 — `PropertiesPanel` Component

**Files:**
- Create: `components/canvas-editor/properties-panel.tsx`

**What it does:** When a Fabric object is selected, shows its editable properties (fill color, opacity, font size if text, stroke). Updates the object in real time.

**Step 1: Create the component**

```typescript
// components/canvas-editor/properties-panel.tsx
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

  const update = (props: Partial<fabric.Object>) => {
    const obj = canvas?.getActiveObject()
    if (!obj) return
    obj.set(props as fabric.TProps<fabric.Object>)
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
                update({ fontSize: size } as Partial<fabric.IText>)
              }}
            />
          </div>
        </>
      )}
    </div>
  )
}
```

**Step 2: Compile check + commit**

```bash
npx tsc --noEmit
git add components/canvas-editor/properties-panel.tsx
git commit -m "feat: add PropertiesPanel for selected element editing"
```

---

## Task 6 — `export-utils` Utility

**Files:**
- Create: `components/canvas-editor/utils/export-utils.ts`

**What it does:** Exports the Fabric canvas (with background + overlays) as a PNG Blob at the original design resolution — not the scaled display size.

```typescript
// components/canvas-editor/utils/export-utils.ts
import * as fabric from 'fabric'

/**
 * Exports the full Fabric canvas as a PNG blob at native design resolution.
 * The multiplier ensures we export at the original resolution even if the
 * canvas was rendered at a scaled-down display size.
 */
export async function exportCanvasAsBlob(
  canvas: fabric.Canvas,
  designWidth: number,
  displayWidth: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const multiplier = designWidth / displayWidth

    const dataUrl = canvas.toDataURL({
      format: 'png',
      multiplier,
      quality: 1,
    })

    fetch(dataUrl)
      .then((res) => res.blob())
      .then(resolve)
      .catch(reject)
  })
}
```

**Commit:**

```bash
git add components/canvas-editor/utils/export-utils.ts
git commit -m "feat: add canvas export utility"
```

---

## Task 7 — `save-variant` API Route

**Files:**
- Create: `app/api/creatives/save-variant/route.ts`

**What it does:** Receives the edited PNG blob + metadata, uploads to Supabase Storage, inserts a new row in `creatives` with `form_data.is_variant: true` and `form_data.parent_creative_id`.

**Step 1: Create the route**

```typescript
// app/api/creatives/save-variant/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const imageBlob = formData.get('image') as Blob
  const parentId = formData.get('parentCreativeId') as string
  const organizationId = formData.get('organizationId') as string
  const title = formData.get('title') as string

  if (!imageBlob || !parentId || !organizationId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Fetch parent creative for format/vertical metadata
  const { data: parent, error: parentError } = await supabase
    .from('creatives')
    .select('creative_type, vertical, form_data, ai_model, ai_model_id')
    .eq('id', parentId)
    .single()

  if (parentError || !parent) {
    return NextResponse.json({ error: 'Parent creative not found' }, { status: 404 })
  }

  // Upload edited image to Supabase Storage
  const fileName = `${organizationId}/variants/${parentId}-${Date.now()}.png`
  const arrayBuffer = await imageBlob.arrayBuffer()
  const { error: uploadError } = await supabase.storage
    .from('creatives')
    .upload(fileName, arrayBuffer, { contentType: 'image/png', upsert: false })

  if (uploadError) {
    return NextResponse.json({ error: 'Upload failed', details: uploadError.message }, { status: 500 })
  }

  const { data: { publicUrl } } = supabase.storage.from('creatives').getPublicUrl(fileName)

  // Save variant row in creatives table
  const variantFormData = {
    ...(parent.form_data as Record<string, unknown>),
    is_variant: true,
    parent_creative_id: parentId,
    variant_edited_at: new Date().toISOString(),
  }

  const { data: variant, error: insertError } = await supabase
    .from('creatives')
    .insert({
      organization_id: organizationId,
      created_by: user.id,
      creative_type: parent.creative_type,
      vertical: parent.vertical,
      ai_model: parent.ai_model,
      ai_model_id: parent.ai_model_id,
      image_url: publicUrl,
      thumbnail_url: publicUrl,
      form_data: variantFormData,
      title: title || `${parent.creative_type} (edited)`,
      credits_used: 0,
    })
    .select('id')
    .single()

  if (insertError) {
    return NextResponse.json({ error: 'DB insert failed', details: insertError.message }, { status: 500 })
  }

  return NextResponse.json({ variantId: variant.id, imageUrl: publicUrl })
}
```

**Step 2: Test it manually after modal is wired (Task 8).**

**Step 3: Commit**

```bash
git add app/api/creatives/save-variant/route.ts
git commit -m "feat: add save-variant API route"
```

---

## Task 8 — `CanvasEditorModal` (Main Modal)

**Files:**
- Create: `components/canvas-editor/canvas-editor-modal.tsx`

**What it does:** Full-screen dialog with FabricCanvas on the left and EditorToolbar + PropertiesPanel stacked on the right. Save button calls `export-utils` then hits `/api/creatives/save-variant`.

**Step 1: Create the modal**

```typescript
// components/canvas-editor/canvas-editor-modal.tsx
'use client'

import { useCallback, useRef, useState } from 'react'
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
```

**Step 2: Compile check**

```bash
npx tsc --noEmit
```

**Step 3: Commit**

```bash
git add components/canvas-editor/canvas-editor-modal.tsx
git commit -m "feat: add CanvasEditorModal full-screen editor"
```

---

## Task 9 — Wire "Edit" Button in CanvasCreatePage

**Files:**
- Modify: `components/canvas-create/CanvasCreatePage.tsx`

**What it does:** Adds an "Edit" icon button to the post-generation footer row (desktop line 758 and mobile line 1088), plus the modal import and state.

**Step 1: Add import at top of file (after existing imports)**

```typescript
import { CanvasEditorModal } from '@/components/canvas-editor/canvas-editor-modal'
import { Pencil } from 'lucide-react'
```

**Step 2: Add state variable (after line 125, near other modal states)**

```typescript
const [canvasEditorOpen, setCanvasEditorOpen] = useState(false)
```

**Step 3: Replace desktop post-generation buttons block (lines 758-782)**

Old:
```tsx
<div className="flex items-center gap-2">
  <Button
    onClick={() => setExportModalOpen(true)}
    className="flex-1 h-11 gap-2 text-sm font-semibold bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 text-white shadow-lg shadow-violet-500/25 hover:shadow-xl hover:shadow-violet-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
  >
    <Download className="h-4 w-4" />
    Download
  </Button>
  <Button
    onClick={() => setRegenerateModalOpen(true)}
    variant="outline"
    className="h-11 w-11 p-0 border-border/50 hover:bg-muted/60 transition-colors rounded-xl"
    title="Regenerate"
  >
    <RefreshCcw className="h-4 w-4" />
  </Button>
  <Button
    onClick={() => router.push('/gallery')}
    variant="outline"
    className="h-11 w-11 p-0 border-border/50 hover:bg-muted/60 transition-colors rounded-xl"
    title="Gallery"
  >
    <Images className="h-4 w-4" />
  </Button>
</div>
```

New:
```tsx
<div className="flex items-center gap-2">
  <Button
    onClick={() => setExportModalOpen(true)}
    className="flex-1 h-11 gap-2 text-sm font-semibold bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 text-white shadow-lg shadow-violet-500/25 hover:shadow-xl hover:shadow-violet-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
  >
    <Download className="h-4 w-4" />
    Download
  </Button>
  <Button
    onClick={() => setCanvasEditorOpen(true)}
    variant="outline"
    className="h-11 w-11 p-0 border-border/50 hover:bg-muted/60 transition-colors rounded-xl"
    title="Edit creative"
  >
    <Pencil className="h-4 w-4" />
  </Button>
  <Button
    onClick={() => setRegenerateModalOpen(true)}
    variant="outline"
    className="h-11 w-11 p-0 border-border/50 hover:bg-muted/60 transition-colors rounded-xl"
    title="Regenerate"
  >
    <RefreshCcw className="h-4 w-4" />
  </Button>
  <Button
    onClick={() => router.push('/gallery')}
    variant="outline"
    className="h-11 w-11 p-0 border-border/50 hover:bg-muted/60 transition-colors rounded-xl"
    title="Gallery"
  >
    <Images className="h-4 w-4" />
  </Button>
</div>
```

**Step 4: Add same Edit button in mobile block (lines 1088-1112) — same pattern**

Add after the Download button:
```tsx
<Button
  onClick={() => setCanvasEditorOpen(true)}
  variant="outline"
  className="h-11 w-11 p-0 shrink-0 border-border/50 rounded-xl hover:bg-muted/60 transition-colors"
  title="Edit creative"
>
  <Pencil className="h-4 w-4 text-muted-foreground" />
</Button>
```

**Step 5: Add the modal before the closing tag of the component (near other modals)**

```tsx
{generatedImage && creativeId && selectedFormat && (
  <CanvasEditorModal
    open={canvasEditorOpen}
    onOpenChange={setCanvasEditorOpen}
    backgroundImageUrl={generatedImage}
    designWidth={selectedFormat.width}
    designHeight={selectedFormat.height}
    parentCreativeId={creativeId}
    organizationId={formData.organizationId ?? ''}
    orgLogos={[]}  // TODO Task 12: wire org logos from store
    onVariantSaved={(variantId, imageUrl) => {
      // Optionally show a toast or navigate to gallery
      router.push('/gallery')
    }}
  />
)}
```

**Step 6: Dev server smoke test**

```bash
npm run dev
```
- Generate a creative
- Click the pencil Edit button
- Verify full-screen modal opens with the poster loaded
- Add a text element, click Save to Gallery
- Verify new entry appears in `/gallery`

**Step 7: Commit**

```bash
git add components/canvas-create/CanvasCreatePage.tsx
git commit -m "feat: wire Edit button and CanvasEditorModal to post-generation UI"
```

---

## Task 10 — Canva OAuth (Authorize + Callback Routes)

**Files:**
- Create: `app/api/canva/authorize/route.ts`
- Create: `app/api/canva/callback/route.ts`
- Create: `lib/canva/oauth.ts`

**Context:** Admin connects one Canva account per organization. Tokens stored in a new `canva_connections` Supabase table (or in `organizations.settings` JSONB column if available — check your schema).

**Step 1: Create OAuth helpers**

```typescript
// lib/canva/oauth.ts
const CANVA_AUTH_URL = 'https://www.canva.com/api/oauth/authorize'
const CANVA_TOKEN_URL = 'https://api.canva.com/rest/v1/oauth/token'

export const CANVA_SCOPES = [
  'asset:read',
  'asset:write',
  'brandtemplate:meta:read',
  'design:content:read',
  'design:content:write',
].join(' ')

export function buildCanvaAuthUrl(state: string, codeChallenge: string): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.CANVA_CLIENT_ID!,
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/canva/callback`,
    scope: CANVA_SCOPES,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  })
  return `${CANVA_AUTH_URL}?${params}`
}

export async function exchangeCanvaCode(
  code: string,
  codeVerifier: string,
): Promise<{ access_token: string; refresh_token: string; expires_in: number }> {
  const res = await fetch(CANVA_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/canva/callback`,
      client_id: process.env.CANVA_CLIENT_ID!,
      client_secret: process.env.CANVA_CLIENT_SECRET!,
      code_verifier: codeVerifier,
    }),
  })
  if (!res.ok) throw new Error(`Canva token exchange failed: ${res.status}`)
  return res.json()
}
```

**Step 2: Authorize route**

```typescript
// app/api/canva/authorize/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { buildCanvaAuthUrl } from '@/lib/canva/oauth'
import crypto from 'crypto'

function base64url(buffer: Buffer): string {
  return buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

export async function GET(req: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const organizationId = searchParams.get('organization_id')
  if (!organizationId) return NextResponse.json({ error: 'organization_id required' }, { status: 400 })

  // PKCE — generate code verifier and challenge
  const codeVerifier = base64url(crypto.randomBytes(32))
  const codeChallenge = base64url(
    crypto.createHash('sha256').update(codeVerifier).digest()
  )
  const state = base64url(crypto.randomBytes(16))

  // Store verifier + state in a short-lived cookie
  const response = NextResponse.redirect(buildCanvaAuthUrl(state, codeChallenge))
  response.cookies.set('canva_oauth_state', JSON.stringify({ state, codeVerifier, organizationId }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 600, // 10 minutes
    path: '/',
  })
  return response
}
```

**Step 3: Callback route**

```typescript
// app/api/canva/callback/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { exchangeCanvaCode } from '@/lib/canva/oauth'

export async function GET(req: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/auth/login`)

  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const returnedState = searchParams.get('state')
  const errorParam = searchParams.get('error')

  if (errorParam) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings/integrations?canva=error`)
  }

  const cookieVal = req.cookies.get('canva_oauth_state')?.value
  if (!cookieVal || !code) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings/integrations?canva=error`)
  }

  const { state, codeVerifier, organizationId } = JSON.parse(cookieVal)
  if (returnedState !== state) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings/integrations?canva=error`)
  }

  const tokens = await exchangeCanvaCode(code, codeVerifier)

  // Store tokens in organizations table settings column (or dedicated table)
  await supabase.from('organizations').update({
    settings: {
      canva_access_token: tokens.access_token,
      canva_refresh_token: tokens.refresh_token,
      canva_token_expires_at: Date.now() + tokens.expires_in * 1000,
      canva_connected_by: user.id,
      canva_connected_at: new Date().toISOString(),
    },
  }).eq('id', organizationId)

  const response = NextResponse.redirect(
    `${process.env.NEXT_PUBLIC_APP_URL}/settings/integrations?canva=success`
  )
  response.cookies.delete('canva_oauth_state')
  return response
}
```

**Step 4: Add env vars to `.env.local`**

```bash
CANVA_CLIENT_ID=your_canva_client_id
CANVA_CLIENT_SECRET=your_canva_client_secret
```

> **Note:** Register your app at https://www.canva.com/developers/ to get credentials. Set redirect URI to `http://localhost:3000/api/canva/callback` for local dev.

**Step 5: Commit**

```bash
git add lib/canva/oauth.ts app/api/canva/authorize/route.ts app/api/canva/callback/route.ts
git commit -m "feat: add Canva OAuth 2.0 PKCE authorize and callback routes"
```

---

## Task 11 — Canva Asset Sync Route

**Files:**
- Create: `app/api/canva/sync/route.ts`

**What it does:** After saving a variant, optionally push the image to the connected org's Canva Brand Library. Called client-side after `save-variant` succeeds.

```typescript
// app/api/canva/sync/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { organizationId, imageUrl, name } = await req.json()

  // Get org Canva token
  const { data: org } = await supabase
    .from('organizations')
    .select('settings')
    .eq('id', organizationId)
    .single()

  const settings = org?.settings as Record<string, unknown> | null
  const accessToken = settings?.canva_access_token as string | undefined

  if (!accessToken) {
    return NextResponse.json({ error: 'Canva not connected for this organization' }, { status: 400 })
  }

  // Download image and re-upload to Canva as an asset
  const imageRes = await fetch(imageUrl)
  const imageBuffer = await imageRes.arrayBuffer()

  const canvaRes = await fetch('https://api.canva.com/rest/v1/assets/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Asset-Upload-Metadata': JSON.stringify({ name_base64: Buffer.from(name).toString('base64') }),
      'Content-Type': 'image/png',
    },
    body: imageBuffer,
  })

  if (!canvaRes.ok) {
    return NextResponse.json({ error: 'Canva upload failed', details: await canvaRes.text() }, { status: 500 })
  }

  const asset = await canvaRes.json()
  return NextResponse.json({ assetId: asset.asset?.id })
}
```

**Commit:**

```bash
git add app/api/canva/sync/route.ts
git commit -m "feat: add Canva asset sync route"
```

---

## Task 12 — Settings → Integrations: Canva Connect Section

**Files:**
- Locate and modify: `app/(dashboard)/settings/` — find the integrations page (look for Google Calendar connect UI as the reference pattern)

**What it does:** Admin sees a "Canva" card in Settings → Integrations with Connect/Disconnect button. Shows connected status with connected-by username.

**Step 1: Find the settings integrations file**

```bash
find app -name "*.tsx" | xargs grep -l "google.calendar\|GoogleCalendar\|google-calendar" 2>/dev/null
```

**Step 2: Add Canva integration card (follow the exact pattern used for Google Calendar)**

The card should show:
- Canva logo/icon
- Status: "Connected as [user email]" or "Not connected"
- Button: "Connect Canva" (links to `/api/canva/authorize?organization_id=XXX`) or "Disconnect"
- Description: "Connect your chapter's Canva account to sync generated creatives to your Brand Library"

**Step 3: Wire org logos to CanvasEditorModal**

In `CanvasCreatePage.tsx`, replace the `orgLogos={[]}` placeholder:
- Fetch org logos from the store or Supabase (`organization_logos` table)
- Map to `{ id, name, url }` shape for `CanvasEditorModal`

**Step 4: Compile + final test**

```bash
npm run build
```
Expected: No TypeScript or build errors.

**Step 5: Commit**

```bash
git add app/(dashboard)/settings/
git commit -m "feat: add Canva Connect section to Settings Integrations"
```

---

## Keyboard Shortcuts (Add to CanvasEditorModal)

Add a `useEffect` for keyboard shortcuts in `canvas-editor-modal.tsx`:

```typescript
useEffect(() => {
  const handleKey = (e: KeyboardEvent) => {
    if (e.key === 'Delete' || e.key === 'Backspace') deleteFnRef.current?.()
    if (e.ctrlKey && e.key === 'z') undoFnRef.current?.()
    if (e.ctrlKey && e.shiftKey && e.key === 'Z') redoFnRef.current?.()
  }
  window.addEventListener('keydown', handleKey)
  return () => window.removeEventListener('keydown', handleKey)
}, [])
```

---

## Final Verification Checklist

- [ ] Generate a creative → Pencil Edit button appears beside Download
- [ ] Click Edit → Full-screen modal opens with poster as background
- [ ] Add text → double-click to type → text appears
- [ ] Add logo → logo image draggable, resizable
- [ ] Select object → Properties panel updates fill/opacity
- [ ] Undo/Redo (Ctrl+Z / Ctrl+Shift+Z) works
- [ ] Delete selected (Delete key) works
- [ ] Click "Save to Gallery" → spinner → success toast → redirect to gallery
- [ ] Gallery shows new "edited" variant as separate card
- [ ] Original creative is unchanged in gallery
- [ ] Admin connects Canva in Settings → Integrations → OAuth popup → success redirect
- [ ] After saving variant, Canva sync pushes asset to Brand Library

---

## Environment Variables Summary

```bash
# .env.local additions
CANVA_CLIENT_ID=<from canva.dev developer portal>
CANVA_CLIENT_SECRET=<from canva.dev developer portal>
NEXT_PUBLIC_APP_URL=http://localhost:3000  # already likely exists
```

---

## Sources

- [Canva Dev MCP Server docs](https://www.canva.dev/docs/apps/mcp-server/)
- [Canva Connect API docs](https://www.canva.dev/docs/connect/)
- [Canva Connect API Authentication](https://www.canva.dev/docs/connect/authentication/)
- [Canva Asset Upload API](https://www.canva.dev/docs/connect/api-reference/assets/)
- [Canva Autofill Guide](https://www.canva.dev/docs/connect/autofill-guide/)
