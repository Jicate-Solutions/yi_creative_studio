/**
 * Production Rendering Engine — contracts (stage 13)
 *
 * A RenderPlan is everything the deterministic engine needs to draw the final
 * poster: the AI background + the layout (text layers) + brand colors. The
 * sharp-render-adapter translates this into the existing lib/sharp/* calls.
 */

import type { LayoutSpec } from './layout'
import type { GeneratedBackground } from './scene'

export interface RenderPlan {
  background: GeneratedBackground
  layout: LayoutSpec
  brand: {
    primary: string
    secondary?: string
    accent?: string
  }
}

export interface RenderedPoster {
  imageBuffer: Buffer
  width: number
  height: number
  mimeType: string
  /** ids of TextLayers actually drawn. */
  appliedLayers: string[]
}
