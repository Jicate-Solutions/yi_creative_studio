# Fabric.js Integration Patterns

## Canvas Initialization

### Basic Setup with React Hook

```typescript
// hooks/use-fabric-canvas.ts
import { useEffect, useRef, useState } from 'react'
import { Canvas, Image as FabricImage } from 'fabric'

interface UseFabricCanvasProps {
  width: number
  height: number
  backgroundImage?: string
}

export function useFabricCanvas({ width, height, backgroundImage }: UseFabricCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fabricRef = useRef<Canvas | null>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    if (!canvasRef.current) return

    // Initialize Fabric canvas
    const canvas = new Canvas(canvasRef.current, {
      width,
      height,
      selection: true,
      preserveObjectStacking: true,
    })

    fabricRef.current = canvas

    // Load background image if provided
    if (backgroundImage) {
      FabricImage.fromURL(backgroundImage).then((img) => {
        img.scaleToWidth(width)
        canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas))
        setIsReady(true)
      })
    } else {
      setIsReady(true)
    }

    return () => {
      canvas.dispose()
    }
  }, [width, height, backgroundImage])

  return { canvasRef, fabricRef, isReady }
}
```

### Canvas with Controls

```typescript
// fabric-canvas.tsx
'use client'

import { useCallback } from 'react'
import { useFabricCanvas } from './hooks/use-fabric-canvas'

interface FabricCanvasProps {
  width: number
  height: number
  backgroundImage: string
  onSelectionChange?: (selected: fabric.Object | null) => void
}

export function FabricCanvas({
  width,
  height,
  backgroundImage,
  onSelectionChange,
}: FabricCanvasProps) {
  const { canvasRef, fabricRef, isReady } = useFabricCanvas({
    width,
    height,
    backgroundImage,
  })

  // Handle selection events
  useEffect(() => {
    const canvas = fabricRef.current
    if (!canvas || !onSelectionChange) return

    const handleSelection = () => {
      const active = canvas.getActiveObject()
      onSelectionChange(active)
    }

    canvas.on('selection:created', handleSelection)
    canvas.on('selection:updated', handleSelection)
    canvas.on('selection:cleared', () => onSelectionChange(null))

    return () => {
      canvas.off('selection:created', handleSelection)
      canvas.off('selection:updated', handleSelection)
      canvas.off('selection:cleared')
    }
  }, [fabricRef, onSelectionChange])

  return (
    <div className="relative">
      <canvas ref={canvasRef} />
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <span className="text-white">Loading...</span>
        </div>
      )}
    </div>
  )
}
```

## Object Manipulation

### Adding Text Objects

```typescript
import { IText, Textbox } from 'fabric'

// Editable text (inline editing)
function addEditableText(canvas: Canvas, options: {
  text: string
  left: number
  top: number
  fontSize?: number
  fontFamily?: string
  fill?: string
}) {
  const text = new IText(options.text, {
    left: options.left,
    top: options.top,
    fontSize: options.fontSize || 24,
    fontFamily: options.fontFamily || 'Arial',
    fill: options.fill || '#000000',
    editable: true,
  })

  canvas.add(text)
  canvas.setActiveObject(text)
  return text
}

// Text box with wrapping
function addTextBox(canvas: Canvas, options: {
  text: string
  left: number
  top: number
  width: number
  fontSize?: number
}) {
  const textbox = new Textbox(options.text, {
    left: options.left,
    top: options.top,
    width: options.width,
    fontSize: options.fontSize || 24,
    splitByGrapheme: true, // Proper word wrapping
  })

  canvas.add(textbox)
  return textbox
}
```

### Adding Images

```typescript
import { Image as FabricImage } from 'fabric'

async function addImage(canvas: Canvas, src: string, options?: {
  left?: number
  top?: number
  scaleToWidth?: number
}) {
  const img = await FabricImage.fromURL(src, { crossOrigin: 'anonymous' })

  if (options?.scaleToWidth) {
    img.scaleToWidth(options.scaleToWidth)
  }

  img.set({
    left: options?.left || 0,
    top: options?.top || 0,
  })

  canvas.add(img)
  return img
}
```

### Adding Shapes

```typescript
import { Rect, Circle, Line } from 'fabric'

function addRectangle(canvas: Canvas, options: {
  left: number
  top: number
  width: number
  height: number
  fill?: string
  stroke?: string
}) {
  const rect = new Rect({
    left: options.left,
    top: options.top,
    width: options.width,
    height: options.height,
    fill: options.fill || 'transparent',
    stroke: options.stroke || '#000000',
    strokeWidth: 2,
  })

  canvas.add(rect)
  return rect
}

function addCircle(canvas: Canvas, options: {
  left: number
  top: number
  radius: number
  fill?: string
}) {
  const circle = new Circle({
    left: options.left,
    top: options.top,
    radius: options.radius,
    fill: options.fill || 'transparent',
    stroke: '#000000',
    strokeWidth: 2,
  })

  canvas.add(circle)
  return circle
}
```

## Event Handling

### Object Events

```typescript
// Track all object modifications
canvas.on('object:modified', (e) => {
  console.log('Object modified:', e.target)
  // Update state, trigger autosave, etc.
})

// Track moving
canvas.on('object:moving', (e) => {
  // Snap to grid, constrain to bounds, etc.
  const obj = e.target
  if (obj.left < 0) obj.left = 0
  if (obj.top < 0) obj.top = 0
})

// Track scaling
canvas.on('object:scaling', (e) => {
  // Maintain aspect ratio, limit size, etc.
})

// Track rotation
canvas.on('object:rotating', (e) => {
  // Snap to angles, etc.
})
```

### Keyboard Shortcuts

```typescript
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    const canvas = fabricRef.current
    if (!canvas) return

    // Delete selected object
    if (e.key === 'Delete' || e.key === 'Backspace') {
      const active = canvas.getActiveObject()
      if (active && !active.isEditing) {
        canvas.remove(active)
        canvas.discardActiveObject()
      }
    }

    // Undo (Ctrl+Z)
    if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
      e.preventDefault()
      undo()
    }

    // Redo (Ctrl+Shift+Z or Ctrl+Y)
    if ((e.ctrlKey && e.shiftKey && e.key === 'z') || (e.ctrlKey && e.key === 'y')) {
      e.preventDefault()
      redo()
    }

    // Copy (Ctrl+C)
    if (e.ctrlKey && e.key === 'c') {
      copyObject()
    }

    // Paste (Ctrl+V)
    if (e.ctrlKey && e.key === 'v') {
      pasteObject()
    }
  }

  window.addEventListener('keydown', handleKeyDown)
  return () => window.removeEventListener('keydown', handleKeyDown)
}, [])
```

## Undo/Redo Implementation

```typescript
// Simple undo/redo with JSON snapshots
const [history, setHistory] = useState<string[]>([])
const [historyIndex, setHistoryIndex] = useState(-1)

function saveState() {
  const canvas = fabricRef.current
  if (!canvas) return

  const json = JSON.stringify(canvas.toJSON())

  // Remove any redo states
  const newHistory = history.slice(0, historyIndex + 1)
  newHistory.push(json)

  // Limit history size
  if (newHistory.length > 50) {
    newHistory.shift()
  }

  setHistory(newHistory)
  setHistoryIndex(newHistory.length - 1)
}

function undo() {
  if (historyIndex <= 0) return

  const canvas = fabricRef.current
  if (!canvas) return

  const newIndex = historyIndex - 1
  canvas.loadFromJSON(history[newIndex], () => {
    canvas.renderAll()
    setHistoryIndex(newIndex)
  })
}

function redo() {
  if (historyIndex >= history.length - 1) return

  const canvas = fabricRef.current
  if (!canvas) return

  const newIndex = historyIndex + 1
  canvas.loadFromJSON(history[newIndex], () => {
    canvas.renderAll()
    setHistoryIndex(newIndex)
  })
}

// Save state after modifications
canvas.on('object:modified', saveState)
canvas.on('object:added', saveState)
canvas.on('object:removed', saveState)
```

## Layer Management

### Bring to Front / Send to Back

```typescript
function bringToFront(canvas: Canvas) {
  const active = canvas.getActiveObject()
  if (active) {
    canvas.bringObjectToFront(active)
  }
}

function sendToBack(canvas: Canvas) {
  const active = canvas.getActiveObject()
  if (active) {
    canvas.sendObjectToBack(active)
  }
}

function bringForward(canvas: Canvas) {
  const active = canvas.getActiveObject()
  if (active) {
    canvas.bringObjectForward(active)
  }
}

function sendBackwards(canvas: Canvas) {
  const active = canvas.getActiveObject()
  if (active) {
    canvas.sendObjectBackwards(active)
  }
}
```

### Get Layers List

```typescript
function getLayers(canvas: Canvas) {
  return canvas.getObjects().map((obj, index) => ({
    id: obj.id || `object-${index}`,
    type: obj.type,
    name: obj.name || `${obj.type} ${index + 1}`,
    visible: obj.visible,
    locked: obj.selectable === false,
    index,
  }))
}
```

## Export Functions

### Export as PNG/JPEG

```typescript
function exportAsImage(canvas: Canvas, format: 'png' | 'jpeg' = 'png', quality = 1) {
  return canvas.toDataURL({
    format,
    quality,
    multiplier: 1, // Increase for higher resolution
  })
}

// Export with specific dimensions
function exportWithDimensions(canvas: Canvas, width: number, height: number) {
  const currentWidth = canvas.getWidth()
  const currentHeight = canvas.getHeight()

  const multiplier = Math.max(width / currentWidth, height / currentHeight)

  return canvas.toDataURL({
    format: 'png',
    multiplier,
  })
}
```

### Export as JSON (for saving/loading)

```typescript
function exportAsJSON(canvas: Canvas) {
  return canvas.toJSON(['id', 'name', 'selectable', 'evented'])
}

function loadFromJSON(canvas: Canvas, json: string | object) {
  return new Promise<void>((resolve) => {
    canvas.loadFromJSON(json, () => {
      canvas.renderAll()
      resolve()
    })
  })
}
```

## Custom Controls

### Custom Control for Rotation

```typescript
import { controlsUtils } from 'fabric'

// Add custom rotation control to all objects
Object.prototype.controls.mtr = new Control({
  x: 0,
  y: -0.5,
  offsetY: -40,
  cursorStyle: 'pointer',
  actionHandler: controlsUtils.rotationWithSnapping,
  actionName: 'rotate',
  render: renderIcon(rotateIcon),
})

function renderIcon(icon: HTMLImageElement) {
  return function (ctx: CanvasRenderingContext2D, left: number, top: number) {
    ctx.save()
    ctx.translate(left, top)
    ctx.drawImage(icon, -12, -12, 24, 24)
    ctx.restore()
  }
}
```

## Performance Tips

1. **Use `renderOnAddRemove: false`** for batch operations:
   ```typescript
   canvas.renderOnAddRemove = false
   // Add multiple objects
   canvas.renderOnAddRemove = true
   canvas.requestRenderAll()
   ```

2. **Disable selection during drag operations**:
   ```typescript
   canvas.selection = false
   // Perform drag
   canvas.selection = true
   ```

3. **Use `objectCaching: true`** for static objects:
   ```typescript
   const img = new Image({
     objectCaching: true,
   })
   ```

4. **Limit history size** to prevent memory issues

5. **Dispose canvas on unmount**:
   ```typescript
   useEffect(() => {
     return () => canvas.dispose()
   }, [])
   ```
