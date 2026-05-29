/**
 * Layout Intelligence + Visual Scaffold — contracts (stages 10 & 11 output)
 *
 * Pure spatial planning. A TextLayer is a deterministic instruction to the
 * rendering engine: WHAT text, WHERE (absolute px bounding box), and the font
 * size RANGE (the engine auto-fits within it). `color` is optional — when
 * omitted the engine picks a contrast-safe color against the AI background.
 */

export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

export type ZoneId =
  | 'header'
  | 'content'
  | 'footer'
  | 'speaker-photo'
  | 'cta'
  | 'details'
  | 'headline'
export type ZoneDensity = 'empty' | 'light' | 'medium' | 'heavy'

export interface Zone {
  id: ZoneId
  rect: Rect
  density: ZoneDensity
}

export type TextLayerRole =
  | 'headline'
  | 'subtitle'
  | 'date'
  | 'time'
  | 'venue'
  | 'speaker'
  | 'cta'
  | 'custom'
  | 'footer'

/** A single deterministic text element drawn by the rendering engine (stage 13). */
export interface TextLayer {
  id: string
  role: TextLayerRole
  text: string
  /** Bounding box, absolute px. */
  rect: Rect
  align: 'left' | 'center' | 'right'
  typography: {
    /** Resolved family name that physically exists in .fonts/ (e.g. 'poppins'). */
    family: string
    /** Numeric weight (400 regular, 700 bold). */
    weight: number
    case: 'none' | 'upper' | 'title'
    maxFontPx: number
    minFontPx: number
    /** Optional; if omitted the engine auto-picks for contrast. */
    color?: string
  }
  zIndex: number
}

/** Stage 10 — pure spatial metadata. */
export interface LayoutSpec {
  canvas: { width: number; height: number }
  zones: Zone[]
  textLayers: TextLayer[]
  speakerPhoto?: {
    rect: Rect
    sizePercent: number
  }
  /** The image model must keep these empty (atmospheric continuation only). */
  reservedZones: {
    header: Zone
    footer: Zone
  }
}

/** Stage 11 — visual conditioning image (guides the model visually, not verbally). */
export interface VisualScaffold {
  pngBuffer: Buffer
  width: number
  height: number
  mimeType: 'image/png'
  forbiddenRegions: Rect[]
}
