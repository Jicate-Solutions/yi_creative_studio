# Text Extraction Patterns

Convert form data from Yi CreativeStudio into editable Fabric.js text elements.

## TextElement Interface

```typescript
// lib/canvas-editor/types.ts

export interface TextElement {
  id: string
  type: 'headline' | 'subheadline' | 'body' | 'speaker' | 'date' | 'venue' | 'custom'
  content: string
  x: number
  y: number
  fontSize: number
  fontFamily: string
  fill: string
  fontWeight: 'normal' | 'bold'
  textAlign: 'left' | 'center' | 'right'
  maxWidth?: number
}

export interface ExtractorOptions {
  canvasWidth: number
  canvasHeight: number
  primaryColor: string
  secondaryColor: string
  fontFamily: string
}
```

## Main Extractor Function

```typescript
// components/canvas-editor/utils/text-extractor.ts

import { TextElement, ExtractorOptions } from '@/lib/canvas-editor/types'

interface FormData {
  eventName?: string
  tagline?: string
  eventDate?: string
  eventTime?: string
  venue?: string
  address?: string
  speakers?: Array<{
    name: string
    title?: string
    organization?: string
  }>
  customText?: string
}

interface DesignData {
  primaryColor?: string
  secondaryColor?: string
  fontFamily?: string
  theme?: string
}

export function extractTextElements(
  formData: FormData,
  designData: DesignData,
  options: ExtractorOptions
): TextElement[] {
  const elements: TextElement[] = []
  const { canvasWidth, canvasHeight } = options
  const centerX = canvasWidth / 2

  // Default styling
  const primaryColor = designData.primaryColor || options.primaryColor || '#FFFFFF'
  const fontFamily = designData.fontFamily || options.fontFamily || 'Poppins'

  // === HEADLINE (Event Name) ===
  if (formData.eventName) {
    elements.push({
      id: 'headline',
      type: 'headline',
      content: formData.eventName.toUpperCase(),
      x: centerX,
      y: canvasHeight * 0.25, // Upper third
      fontSize: calculateFontSize(formData.eventName, canvasWidth, 0.8, 72, 120),
      fontFamily,
      fill: primaryColor,
      fontWeight: 'bold',
      textAlign: 'center',
      maxWidth: canvasWidth * 0.85,
    })
  }

  // === TAGLINE ===
  if (formData.tagline) {
    elements.push({
      id: 'tagline',
      type: 'subheadline',
      content: formData.tagline,
      x: centerX,
      y: canvasHeight * 0.35,
      fontSize: calculateFontSize(formData.tagline, canvasWidth, 0.7, 24, 48),
      fontFamily,
      fill: primaryColor,
      fontWeight: 'normal',
      textAlign: 'center',
      maxWidth: canvasWidth * 0.8,
    })
  }

  // === DATE & TIME ===
  if (formData.eventDate || formData.eventTime) {
    const dateContent = formatDateTimeString(formData.eventDate, formData.eventTime)
    if (dateContent) {
      elements.push({
        id: 'date',
        type: 'date',
        content: dateContent,
        x: centerX,
        y: canvasHeight * 0.48,
        fontSize: 28,
        fontFamily,
        fill: primaryColor,
        fontWeight: 'bold',
        textAlign: 'center',
      })
    }
  }

  // === VENUE ===
  if (formData.venue) {
    elements.push({
      id: 'venue',
      type: 'venue',
      content: formData.venue,
      x: centerX,
      y: canvasHeight * 0.55,
      fontSize: 24,
      fontFamily,
      fill: primaryColor,
      fontWeight: 'normal',
      textAlign: 'center',
      maxWidth: canvasWidth * 0.8,
    })
  }

  // === ADDRESS ===
  if (formData.address) {
    elements.push({
      id: 'address',
      type: 'body',
      content: formData.address,
      x: centerX,
      y: canvasHeight * 0.60,
      fontSize: 18,
      fontFamily,
      fill: primaryColor,
      fontWeight: 'normal',
      textAlign: 'center',
      maxWidth: canvasWidth * 0.75,
    })
  }

  // === SPEAKERS ===
  if (formData.speakers && formData.speakers.length > 0) {
    const speakerElements = extractSpeakerElements(
      formData.speakers,
      canvasWidth,
      canvasHeight,
      primaryColor,
      fontFamily
    )
    elements.push(...speakerElements)
  }

  // === CUSTOM TEXT ===
  if (formData.customText) {
    elements.push({
      id: 'custom',
      type: 'custom',
      content: formData.customText,
      x: centerX,
      y: canvasHeight * 0.75,
      fontSize: 20,
      fontFamily,
      fill: primaryColor,
      fontWeight: 'normal',
      textAlign: 'center',
      maxWidth: canvasWidth * 0.8,
    })
  }

  return elements
}
```

## Helper Functions

### Font Size Calculator

```typescript
// Calculate optimal font size based on text length and canvas width
function calculateFontSize(
  text: string,
  canvasWidth: number,
  maxWidthRatio: number,
  minSize: number,
  maxSize: number
): number {
  const maxWidth = canvasWidth * maxWidthRatio
  const charCount = text.length

  // Approximate characters per line based on desired size
  // Average char width is roughly 0.5-0.6 of font size
  const avgCharWidthRatio = 0.55

  // Start with max size and reduce if text won't fit
  let fontSize = maxSize

  while (fontSize > minSize) {
    const estimatedWidth = charCount * fontSize * avgCharWidthRatio
    if (estimatedWidth <= maxWidth) {
      break
    }
    fontSize -= 2
  }

  return fontSize
}
```

### Date Formatter

```typescript
function formatDateTimeString(date?: string, time?: string): string {
  const parts: string[] = []

  if (date) {
    try {
      const dateObj = new Date(date)
      if (!isNaN(dateObj.getTime())) {
        parts.push(dateObj.toLocaleDateString('en-US', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }))
      }
    } catch {
      // If parsing fails, use raw string
      parts.push(date)
    }
  }

  if (time) {
    parts.push(time)
  }

  return parts.join(' | ')
}
```

### Speaker Elements Extractor

```typescript
interface Speaker {
  name: string
  title?: string
  organization?: string
}

function extractSpeakerElements(
  speakers: Speaker[],
  canvasWidth: number,
  canvasHeight: number,
  primaryColor: string,
  fontFamily: string
): TextElement[] {
  const elements: TextElement[] = []
  const speakerCount = speakers.length

  // Layout depends on number of speakers
  if (speakerCount === 1) {
    // Single speaker - centered
    const speaker = speakers[0]
    elements.push({
      id: 'speaker-0-name',
      type: 'speaker',
      content: speaker.name,
      x: canvasWidth / 2,
      y: canvasHeight * 0.68,
      fontSize: 32,
      fontFamily,
      fill: primaryColor,
      fontWeight: 'bold',
      textAlign: 'center',
    })

    if (speaker.title || speaker.organization) {
      const subtitle = [speaker.title, speaker.organization]
        .filter(Boolean)
        .join(', ')
      elements.push({
        id: 'speaker-0-title',
        type: 'body',
        content: subtitle,
        x: canvasWidth / 2,
        y: canvasHeight * 0.73,
        fontSize: 20,
        fontFamily,
        fill: primaryColor,
        fontWeight: 'normal',
        textAlign: 'center',
      })
    }
  } else if (speakerCount === 2) {
    // Two speakers - side by side
    const positions = [canvasWidth * 0.25, canvasWidth * 0.75]

    speakers.forEach((speaker, i) => {
      elements.push({
        id: `speaker-${i}-name`,
        type: 'speaker',
        content: speaker.name,
        x: positions[i],
        y: canvasHeight * 0.70,
        fontSize: 24,
        fontFamily,
        fill: primaryColor,
        fontWeight: 'bold',
        textAlign: 'center',
      })

      if (speaker.title) {
        elements.push({
          id: `speaker-${i}-title`,
          type: 'body',
          content: speaker.title,
          x: positions[i],
          y: canvasHeight * 0.74,
          fontSize: 16,
          fontFamily,
          fill: primaryColor,
          fontWeight: 'normal',
          textAlign: 'center',
        })
      }
    })
  } else {
    // 3+ speakers - grid layout
    const cols = speakerCount <= 3 ? speakerCount : Math.ceil(speakerCount / 2)
    const rows = Math.ceil(speakerCount / cols)
    const startY = canvasHeight * 0.65
    const rowHeight = canvasHeight * 0.12

    speakers.forEach((speaker, i) => {
      const col = i % cols
      const row = Math.floor(i / cols)
      const x = canvasWidth * ((col + 0.5) / cols)
      const y = startY + row * rowHeight

      elements.push({
        id: `speaker-${i}-name`,
        type: 'speaker',
        content: speaker.name,
        x,
        y,
        fontSize: 20,
        fontFamily,
        fill: primaryColor,
        fontWeight: 'bold',
        textAlign: 'center',
      })

      if (speaker.title) {
        elements.push({
          id: `speaker-${i}-title`,
          type: 'body',
          content: speaker.title,
          x,
          y: y + 22,
          fontSize: 14,
          fontFamily,
          fill: primaryColor,
          fontWeight: 'normal',
          textAlign: 'center',
        })
      }
    })
  }

  return elements
}
```

## Converting TextElements to Fabric.js Objects

```typescript
// components/canvas-editor/utils/fabric-converter.ts
import { IText, Textbox, Canvas } from 'fabric'
import { TextElement } from '@/lib/canvas-editor/types'

export function textElementToFabric(
  element: TextElement,
  canvas: Canvas
): IText | Textbox {
  const commonProps = {
    left: element.x,
    top: element.y,
    fontSize: element.fontSize,
    fontFamily: element.fontFamily,
    fill: element.fill,
    fontWeight: element.fontWeight,
    textAlign: element.textAlign,
    originX: element.textAlign === 'center' ? 'center' : 'left',
    originY: 'center',
    id: element.id,
    name: `${element.type}: ${element.content.slice(0, 20)}...`,
  }

  if (element.maxWidth) {
    // Use Textbox for text with max width (word wrapping)
    return new Textbox(element.content, {
      ...commonProps,
      width: element.maxWidth,
      splitByGrapheme: true,
    })
  } else {
    // Use IText for single-line text
    return new IText(element.content, commonProps)
  }
}

export function addTextElementsToCanvas(
  canvas: Canvas,
  elements: TextElement[]
): void {
  // Temporarily disable rendering for batch add
  canvas.renderOnAddRemove = false

  elements.forEach((element) => {
    const fabricObj = textElementToFabric(element, canvas)
    canvas.add(fabricObj)
  })

  canvas.renderOnAddRemove = true
  canvas.requestRenderAll()
}
```

## Integration with Creative Store

```typescript
// Usage in canvas-editor-modal.tsx

import { useCreativeStore } from '@/stores/creative-store'
import { extractTextElements } from './utils/text-extractor'

// Inside component:
const formData = useCreativeStore((state) => state.formData)
const designData = useCreativeStore((state) => state.formData?.designData)
const selectedFormat = useCreativeStore((state) => state.selectedFormat)

const textElements = useMemo(() => {
  if (!formData?.formData || !selectedFormat) return []

  return extractTextElements(
    formData.formData,
    designData || {},
    {
      canvasWidth: selectedFormat.width,
      canvasHeight: selectedFormat.height,
      primaryColor: '#FFFFFF',
      secondaryColor: '#005B96',
      fontFamily: 'Poppins',
    }
  )
}, [formData, designData, selectedFormat])
```

## Position Estimation from Logo Placements

```typescript
// If logo placements are available, adjust text positions to avoid overlap

interface LogoPlacement {
  position: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right'
  size: number // percentage
}

function adjustTextPositionsForLogos(
  elements: TextElement[],
  logosPlacements: LogoPlacement[],
  canvasHeight: number
): TextElement[] {
  // Check if there are top logos
  const hasTopLogos = logosPlacements.some((logo) =>
    logo.position.startsWith('top')
  )

  // Check if there are bottom logos
  const hasBottomLogos = logosPlacements.some((logo) =>
    logo.position.startsWith('bottom')
  )

  return elements.map((element) => {
    // Push headline down if top logos exist
    if (element.type === 'headline' && hasTopLogos) {
      return {
        ...element,
        y: Math.max(element.y, canvasHeight * 0.15), // Ensure below logo zone
      }
    }

    // Push bottom elements up if bottom logos exist
    if (
      (element.type === 'speaker' || element.type === 'custom') &&
      hasBottomLogos
    ) {
      return {
        ...element,
        y: Math.min(element.y, canvasHeight * 0.85), // Ensure above logo zone
      }
    }

    return element
  })
}
```

## Background-Only Generation Mode

When using the canvas editor, optionally generate AI posters without text:

```typescript
// In event-poster.ts prompt builder
interface GenerationOptions {
  editorMode?: boolean
  // ... other options
}

export function buildEventPosterPrompt(
  data: EventPosterData,
  options: GenerationOptions
): string {
  if (options.editorMode) {
    // Generate BACKGROUND ONLY - no text rendering
    return `
      Create an event poster BACKGROUND ONLY.
      Do NOT render any text, titles, dates, or speaker names.

      Visual theme: ${data.theme}
      Color palette: ${data.primaryColor}, ${data.secondaryColor}
      Style: Professional, vibrant, brand-appropriate

      Leave clear areas for text overlay:
      - Upper third: headline area (keep relatively simple)
      - Middle: date/venue area
      - Lower third: speaker area

      Focus on creating an engaging visual background that will complement
      overlaid text elements.
    `
  }

  // Normal generation with rendered text
  return buildNormalPrompt(data)
}
```

This approach allows:
1. AI generates visually appealing backgrounds
2. Text is added via Fabric.js with precise control
3. Users can edit text freely after generation
4. Font rendering is consistent (not AI-interpreted)
