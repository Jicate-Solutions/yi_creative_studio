# Component Structure Reference

## Directory Layout

```
components/canvas-editor/
├── canvas-editor-modal.tsx      # Main modal wrapper
├── fabric-canvas.tsx            # Canvas component
├── editor-toolbar.tsx           # Tool selection toolbar
├── layers-panel.tsx             # Layer management panel
├── properties-panel.tsx         # Selected element properties
├── index.ts                     # Exports
├── hooks/
│   ├── use-fabric-canvas.ts     # Canvas initialization
│   ├── use-element-selection.ts # Selection state
│   └── use-canvas-history.ts    # Undo/redo
└── utils/
    ├── text-extractor.ts        # Form → text elements
    └── export-utils.ts          # Canvas → image export

lib/canvas-editor/
├── types.ts                     # TypeScript interfaces
└── constants.ts                 # Default fonts, colors, etc.
```

## Type Definitions

```typescript
// lib/canvas-editor/types.ts

export type EditorTool = 'select' | 'text' | 'rectangle' | 'circle' | 'image'

export interface TextElement {
  id: string
  type: 'headline' | 'subheadline' | 'body' | 'speaker' | 'custom'
  content: string
  x: number
  y: number
  fontSize: number
  fontFamily: string
  fill: string
  fontWeight: 'normal' | 'bold'
  textAlign: 'left' | 'center' | 'right'
}

export interface CanvasElement {
  id: string
  type: 'text' | 'image' | 'shape'
  name: string
  visible: boolean
  locked: boolean
  fabricObject?: fabric.Object
}

export interface CanvasState {
  elements: CanvasElement[]
  selectedId: string | null
  activeTool: EditorTool
  history: string[]
  historyIndex: number
}

export interface EditorDimensions {
  width: number
  height: number
}
```

## Canvas Editor Modal

```typescript
// components/canvas-editor/canvas-editor-modal.tsx
'use client'

import { useState, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { FabricCanvas } from './fabric-canvas'
import { EditorToolbar } from './editor-toolbar'
import { LayersPanel } from './layers-panel'
import { PropertiesPanel } from './properties-panel'
import { TextElement, EditorTool, CanvasElement } from '@/lib/canvas-editor/types'

interface CanvasEditorModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  backgroundImage: string
  dimensions: { width: number; height: number }
  textElements: TextElement[]
  onSave: (editedImage: string) => void
}

export function CanvasEditorModal({
  open,
  onOpenChange,
  backgroundImage,
  dimensions,
  textElements,
  onSave,
}: CanvasEditorModalProps) {
  const [activeTool, setActiveTool] = useState<EditorTool>('select')
  const [selectedElement, setSelectedElement] = useState<CanvasElement | null>(null)
  const [layers, setLayers] = useState<CanvasElement[]>([])
  const canvasRef = useRef<{ exportImage: () => string; getCanvas: () => Canvas } | null>(null)

  const handleExport = useCallback(() => {
    if (!canvasRef.current) return
    const dataUrl = canvasRef.current.exportImage()
    onSave(dataUrl)
    onOpenChange(false)
  }, [onSave, onOpenChange])

  const handleToolChange = useCallback((tool: EditorTool) => {
    setActiveTool(tool)
  }, [])

  const handleSelectionChange = useCallback((element: CanvasElement | null) => {
    setSelectedElement(element)
    if (element) setActiveTool('select')
  }, [])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] p-0">
        <DialogHeader className="px-4 py-2 border-b">
          <DialogTitle>Edit Design</DialogTitle>
        </DialogHeader>

        <div className="flex h-[calc(95vh-80px)]">
          {/* Left: Toolbar */}
          <div className="w-14 border-r bg-muted/50">
            <EditorToolbar
              activeTool={activeTool}
              onToolChange={handleToolChange}
            />
          </div>

          {/* Center: Canvas */}
          <div className="flex-1 overflow-auto bg-neutral-800 flex items-center justify-center p-4">
            <FabricCanvas
              ref={canvasRef}
              width={dimensions.width}
              height={dimensions.height}
              backgroundImage={backgroundImage}
              textElements={textElements}
              activeTool={activeTool}
              onSelectionChange={handleSelectionChange}
              onLayersChange={setLayers}
            />
          </div>

          {/* Right: Panels */}
          <div className="w-72 border-l bg-background flex flex-col">
            <div className="flex-1 overflow-auto">
              {selectedElement ? (
                <PropertiesPanel
                  element={selectedElement}
                  onUpdate={(updates) => {
                    // Update element properties
                  }}
                />
              ) : (
                <div className="p-4 text-sm text-muted-foreground">
                  Select an element to edit its properties
                </div>
              )}
            </div>

            <div className="h-64 border-t">
              <LayersPanel
                layers={layers}
                selectedId={selectedElement?.id}
                onSelect={(id) => {
                  // Select layer
                }}
                onReorder={(from, to) => {
                  // Reorder layers
                }}
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-2 px-4 py-3 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport}>
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

## Editor Toolbar

```typescript
// components/canvas-editor/editor-toolbar.tsx
'use client'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  MousePointer2,
  Type,
  Square,
  Circle,
  Image,
  Undo2,
  Redo2,
} from 'lucide-react'
import { EditorTool } from '@/lib/canvas-editor/types'

interface EditorToolbarProps {
  activeTool: EditorTool
  onToolChange: (tool: EditorTool) => void
  canUndo?: boolean
  canRedo?: boolean
  onUndo?: () => void
  onRedo?: () => void
}

const tools: { id: EditorTool; icon: typeof MousePointer2; label: string }[] = [
  { id: 'select', icon: MousePointer2, label: 'Select (V)' },
  { id: 'text', icon: Type, label: 'Add Text (T)' },
  { id: 'rectangle', icon: Square, label: 'Rectangle (R)' },
  { id: 'circle', icon: Circle, label: 'Circle (C)' },
  { id: 'image', icon: Image, label: 'Add Image (I)' },
]

export function EditorToolbar({
  activeTool,
  onToolChange,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
}: EditorToolbarProps) {
  return (
    <div className="flex flex-col gap-1 p-2">
      {/* Tools */}
      {tools.map(({ id, icon: Icon, label }) => (
        <Tooltip key={id}>
          <TooltipTrigger asChild>
            <Button
              variant={activeTool === id ? 'secondary' : 'ghost'}
              size="icon"
              className={cn(
                'h-10 w-10',
                activeTool === id && 'bg-primary/20'
              )}
              onClick={() => onToolChange(id)}
            >
              <Icon className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">{label}</TooltipContent>
        </Tooltip>
      ))}

      <div className="h-px bg-border my-2" />

      {/* History */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10"
            disabled={!canUndo}
            onClick={onUndo}
          >
            <Undo2 className="h-5 w-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">Undo (Ctrl+Z)</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10"
            disabled={!canRedo}
            onClick={onRedo}
          >
            <Redo2 className="h-5 w-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">Redo (Ctrl+Shift+Z)</TooltipContent>
      </Tooltip>
    </div>
  )
}
```

## Properties Panel

```typescript
// components/canvas-editor/properties-panel.tsx
'use client'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Trash2,
  Copy,
  ArrowUp,
  ArrowDown,
} from 'lucide-react'
import { CanvasElement } from '@/lib/canvas-editor/types'

interface PropertiesPanelProps {
  element: CanvasElement
  onUpdate: (updates: Partial<CanvasElement>) => void
  onDelete: () => void
  onDuplicate: () => void
  onBringForward: () => void
  onSendBackward: () => void
}

const fonts = [
  'Arial',
  'Helvetica',
  'Times New Roman',
  'Georgia',
  'Verdana',
  'Poppins',
  'Montserrat',
  'Inter',
]

export function PropertiesPanel({
  element,
  onUpdate,
  onDelete,
  onDuplicate,
  onBringForward,
  onSendBackward,
}: PropertiesPanelProps) {
  const obj = element.fabricObject

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium capitalize">{element.type}</h3>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={onDuplicate}>
            <Copy className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onDelete}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>

      {/* Position */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs">X</Label>
          <Input
            type="number"
            value={Math.round(obj?.left || 0)}
            onChange={(e) => onUpdate({ left: Number(e.target.value) })}
          />
        </div>
        <div>
          <Label className="text-xs">Y</Label>
          <Input
            type="number"
            value={Math.round(obj?.top || 0)}
            onChange={(e) => onUpdate({ top: Number(e.target.value) })}
          />
        </div>
      </div>

      {/* Size */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs">Width</Label>
          <Input
            type="number"
            value={Math.round((obj?.width || 0) * (obj?.scaleX || 1))}
            onChange={(e) => onUpdate({ width: Number(e.target.value) })}
          />
        </div>
        <div>
          <Label className="text-xs">Height</Label>
          <Input
            type="number"
            value={Math.round((obj?.height || 0) * (obj?.scaleY || 1))}
            onChange={(e) => onUpdate({ height: Number(e.target.value) })}
          />
        </div>
      </div>

      {/* Text-specific properties */}
      {element.type === 'text' && (
        <>
          <div>
            <Label className="text-xs">Font Family</Label>
            <Select
              value={obj?.fontFamily}
              onValueChange={(v) => onUpdate({ fontFamily: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {fonts.map((font) => (
                  <SelectItem key={font} value={font}>
                    {font}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs">Font Size</Label>
            <div className="flex items-center gap-2">
              <Slider
                value={[obj?.fontSize || 24]}
                min={8}
                max={200}
                step={1}
                onValueChange={([v]) => onUpdate({ fontSize: v })}
              />
              <span className="text-sm w-12 text-right">
                {obj?.fontSize || 24}
              </span>
            </div>
          </div>

          <div>
            <Label className="text-xs">Color</Label>
            <Input
              type="color"
              value={obj?.fill || '#000000'}
              onChange={(e) => onUpdate({ fill: e.target.value })}
              className="h-8 p-1"
            />
          </div>

          <div className="flex gap-1">
            <Button
              variant={obj?.fontWeight === 'bold' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() =>
                onUpdate({
                  fontWeight: obj?.fontWeight === 'bold' ? 'normal' : 'bold',
                })
              }
            >
              <Bold className="h-4 w-4" />
            </Button>
            <Button
              variant={obj?.fontStyle === 'italic' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() =>
                onUpdate({
                  fontStyle: obj?.fontStyle === 'italic' ? 'normal' : 'italic',
                })
              }
            >
              <Italic className="h-4 w-4" />
            </Button>
            <div className="w-px bg-border mx-1" />
            <Button
              variant={obj?.textAlign === 'left' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => onUpdate({ textAlign: 'left' })}
            >
              <AlignLeft className="h-4 w-4" />
            </Button>
            <Button
              variant={obj?.textAlign === 'center' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => onUpdate({ textAlign: 'center' })}
            >
              <AlignCenter className="h-4 w-4" />
            </Button>
            <Button
              variant={obj?.textAlign === 'right' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => onUpdate({ textAlign: 'right' })}
            >
              <AlignRight className="h-4 w-4" />
            </Button>
          </div>
        </>
      )}

      {/* Layer order */}
      <div>
        <Label className="text-xs">Layer Order</Label>
        <div className="flex gap-1 mt-1">
          <Button variant="outline" size="sm" onClick={onBringForward}>
            <ArrowUp className="h-4 w-4 mr-1" /> Forward
          </Button>
          <Button variant="outline" size="sm" onClick={onSendBackward}>
            <ArrowDown className="h-4 w-4 mr-1" /> Backward
          </Button>
        </div>
      </div>

      {/* Opacity */}
      <div>
        <Label className="text-xs">Opacity</Label>
        <div className="flex items-center gap-2">
          <Slider
            value={[(obj?.opacity || 1) * 100]}
            min={0}
            max={100}
            step={1}
            onValueChange={([v]) => onUpdate({ opacity: v / 100 })}
          />
          <span className="text-sm w-12 text-right">
            {Math.round((obj?.opacity || 1) * 100)}%
          </span>
        </div>
      </div>
    </div>
  )
}
```

## Layers Panel

```typescript
// components/canvas-editor/layers-panel.tsx
'use client'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Eye, EyeOff, Lock, Unlock, GripVertical } from 'lucide-react'
import { CanvasElement } from '@/lib/canvas-editor/types'

interface LayersPanelProps {
  layers: CanvasElement[]
  selectedId: string | null
  onSelect: (id: string) => void
  onToggleVisibility: (id: string) => void
  onToggleLock: (id: string) => void
  onReorder: (fromIndex: number, toIndex: number) => void
}

export function LayersPanel({
  layers,
  selectedId,
  onSelect,
  onToggleVisibility,
  onToggleLock,
  onReorder,
}: LayersPanelProps) {
  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-2 border-b">
        <h3 className="font-medium text-sm">Layers</h3>
      </div>

      <div className="flex-1 overflow-auto">
        {layers.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground text-center">
            No elements yet
          </div>
        ) : (
          <div className="divide-y">
            {layers.map((layer, index) => (
              <div
                key={layer.id}
                className={cn(
                  'flex items-center gap-2 px-2 py-1.5 hover:bg-muted/50 cursor-pointer',
                  selectedId === layer.id && 'bg-primary/10'
                )}
                onClick={() => onSelect(layer.id)}
              >
                <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />

                <span
                  className={cn(
                    'flex-1 text-sm truncate',
                    !layer.visible && 'text-muted-foreground line-through'
                  )}
                >
                  {layer.name}
                </span>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation()
                    onToggleVisibility(layer.id)
                  }}
                >
                  {layer.visible ? (
                    <Eye className="h-3.5 w-3.5" />
                  ) : (
                    <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation()
                    onToggleLock(layer.id)
                  }}
                >
                  {layer.locked ? (
                    <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                  ) : (
                    <Unlock className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
```

## Export Utilities

```typescript
// components/canvas-editor/utils/export-utils.ts
import { Canvas } from 'fabric'

export interface ExportOptions {
  format: 'png' | 'jpeg'
  quality?: number
  multiplier?: number
}

export function exportCanvasAsImage(
  canvas: Canvas,
  options: ExportOptions = { format: 'png' }
): string {
  return canvas.toDataURL({
    format: options.format,
    quality: options.quality || (options.format === 'jpeg' ? 0.92 : 1),
    multiplier: options.multiplier || 1,
  })
}

export function exportCanvasAsBlob(
  canvas: Canvas,
  options: ExportOptions = { format: 'png' }
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const dataUrl = exportCanvasAsImage(canvas, options)
    fetch(dataUrl)
      .then((res) => res.blob())
      .then(resolve)
      .catch(reject)
  })
}

export function downloadCanvas(
  canvas: Canvas,
  filename: string,
  options: ExportOptions = { format: 'png' }
): void {
  const dataUrl = exportCanvasAsImage(canvas, options)
  const link = document.createElement('a')
  link.download = `${filename}.${options.format}`
  link.href = dataUrl
  link.click()
}

export function saveDesignJSON(canvas: Canvas): string {
  return JSON.stringify(canvas.toJSON(['id', 'name', 'selectable', 'evented']))
}

export function loadDesignJSON(canvas: Canvas, json: string): Promise<void> {
  return new Promise((resolve) => {
    canvas.loadFromJSON(json, () => {
      canvas.renderAll()
      resolve()
    })
  })
}
```

## Constants

```typescript
// lib/canvas-editor/constants.ts

export const DEFAULT_FONTS = [
  'Arial',
  'Helvetica',
  'Times New Roman',
  'Georgia',
  'Verdana',
  'Poppins',
  'Montserrat',
  'Inter',
  'Roboto',
  'Open Sans',
] as const

export const DEFAULT_COLORS = [
  '#000000', // Black
  '#FFFFFF', // White
  '#005B96', // Yi Blue
  '#FF6B35', // Yi Orange
  '#F5F5F5', // Light Gray
  '#333333', // Dark Gray
  '#E74C3C', // Red
  '#27AE60', // Green
  '#3498DB', // Blue
  '#F39C12', // Yellow
] as const

export const CANVAS_SETTINGS = {
  minZoom: 0.1,
  maxZoom: 5,
  defaultZoom: 1,
  snapToGrid: true,
  gridSize: 10,
  selectionColor: 'rgba(0, 91, 150, 0.3)',
  selectionBorderColor: '#005B96',
  selectionLineWidth: 2,
} as const
```
