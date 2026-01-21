---
name: canvas-editor
description: Canva-like post-generation editing for AI-generated posters. This skill should be used when implementing canvas editing features, adding Fabric.js integration, or enabling users to edit text, move elements, and customize AI-generated designs after generation.
---

# Canvas Editor Skill

Enable Canva-style editing mode after AI poster generation, allowing users to move, resize, and edit text elements, adjust colors and fonts, reposition logos and images, and export edited designs.

## When to Use This Skill

- Implementing post-generation editing capabilities
- Adding Fabric.js canvas integration to Next.js
- Creating text overlay systems for AI-generated images
- Building layer management UI for design elements
- Enabling user customization of AI outputs

## Library Recommendation

**Fabric.js** (Free, Open Source) is recommended over alternatives:

| Library | Cost | React Support | Best For |
|---------|------|---------------|----------|
| **Fabric.js** | Free | Via hooks | Graphic design tools |
| Polotno SDK | $199-299/month | Native Next.js | Premium, fast delivery |
| Konva.js | Free | react-konva | Performance-critical apps |

## Quick Start

### 1. Install Dependencies

```bash
npm install fabric fabricjs-react
```

### 2. Create Directory Structure

```bash
mkdir -p components/canvas-editor/hooks
mkdir -p components/canvas-editor/utils
mkdir -p lib/canvas-editor
```

### 3. Component Architecture

```
components/canvas-editor/
  canvas-editor-modal.tsx    # Main modal wrapper
  fabric-canvas.tsx          # Fabric.js canvas component
  editor-toolbar.tsx         # Tools: select, text, shapes
  layers-panel.tsx           # Layer management
  properties-panel.tsx       # Selected element properties
  hooks/
    use-fabric-canvas.ts     # Canvas initialization hook
    use-element-selection.ts # Selection state hook
  utils/
    text-extractor.ts        # Form → text elements
    export-utils.ts          # Canvas → image export
```

## Implementation Phases

### Phase 1: Core Editor Setup

1. Create `FabricCanvas` component wrapping Fabric.js canvas
2. Implement `CanvasEditorModal` as dialog wrapper
3. Load generated image as background layer
4. Add basic selection and move capabilities

Integration point in `app/(dashboard)/create/page.tsx`:

```tsx
{generatedImage && (
  <CanvasEditorModal
    open={editorOpen}
    onOpenChange={setEditorOpen}
    backgroundImage={generatedImage}
    dimensions={selectedFormat}
    textElements={extractTextElements(formData)}
    onSave={(editedImage) => setGeneratedImage(editedImage)}
  />
)}
```

### Phase 2: Text Overlay System

1. Create `extractTextElements()` utility to convert form data to editable objects
2. Optionally modify AI generation to produce background-only images
3. Render text as Fabric.js text objects on canvas

See `references/text-extraction-patterns.md` for implementation details.

### Phase 3: Editor Features

**Toolbar Features:**
- Selection tool (move, resize, rotate)
- Text tool (add new text)
- Shape tool (rectangles, circles)
- Image tool (upload additional images)
- Undo/Redo stack

**Properties Panel:**
- Font family selector
- Font size slider
- Color picker
- Alignment buttons
- Opacity slider
- Layer order controls

**Layers Panel:**
- List all elements
- Drag to reorder
- Toggle visibility
- Lock/unlock elements

### Phase 4: Export & Save

1. Export via Fabric.js `toDataURL()` for PNG/JPEG
2. Maintain compatibility with existing export flow
3. Optional: Save design JSON to database for re-editing

```typescript
interface SavedDesign {
  backgroundImage: string
  elements: FabricObject[]
  dimensions: { width: number; height: number }
  createdAt: Date
  updatedAt: Date
}
```

### Phase 5: Polish

- Mobile responsive editor
- Keyboard shortcuts (Delete, Ctrl+Z, Ctrl+Shift+Z)
- Performance optimization for large images
- Touch gesture support

## Codebase Integration Points

| Purpose | File |
|---------|------|
| Main page | `app/(dashboard)/create/page.tsx` |
| Preview panel | `components/create/preview-panel.tsx` |
| Full view modal | `components/create/image-preview-modal.tsx` |
| Export modal | `components/export/export-modal.tsx` |
| State store | `stores/creative-store.ts` |

### Available Data After Generation

From `stores/creative-store.ts`:
- `generatedImage` - Base64 string of generated image
- `selectedFormat` - Dimensions (width, height)
- `formData.formData` - User input (title, date, venue, speakers)
- `formData.designData` - Colors, fonts, theme
- `formData.logosPlacements` - Logo positions and sizes

## Database Changes (Optional)

Add column for saving editable designs:

```sql
ALTER TABLE creatives ADD COLUMN design_json JSONB;
```

## Verification Checklist

1. **Canvas Loads**: Generate poster → Click Edit → Background loads correctly
2. **Text Positioning**: Text elements appear at correct positions
3. **Editing Works**: Select → Change font/color/position → Verify updates
4. **Undo/Redo**: Make changes → Undo → Redo → Verify state
5. **Export**: Edit design → Export PNG → Compare to canvas
6. **Save/Load** (if implemented): Save → Reload → Design persists

## Alternative: Quick MVP

For faster delivery, consider CSS-based overlay instead of Fabric.js:

- Use `react-draggable` for moveable text elements
- Simple font/color controls with native inputs
- Export via `html2canvas` library
- Estimated time: 1-2 weeks vs 4-6 weeks for full Fabric.js

## References

For detailed implementation patterns, see:
- `references/fabric-js-patterns.md` - Canvas setup and event handling
- `references/component-structure.md` - React component architecture
- `references/text-extraction-patterns.md` - Form data conversion

## External Resources

- **Fabric.js Docs:** https://fabricjs.com/docs/
- **fabricjs-react:** https://github.com/asotog/fabricjs-react
- **react-design-editor:** https://github.com/salgum1114/react-design-editor
- **Polotno SDK:** https://polotno.com/docs/nextjs-integration
