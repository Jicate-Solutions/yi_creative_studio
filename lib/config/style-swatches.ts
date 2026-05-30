/**
 * Style swatches — a representative CSS gradient per background-style, for the
 * Style Mix picker UI ONLY. Background-styles carry just an emoji `icon` + `label`
 * (no images, no colour data), so the picker would otherwise read as blind text.
 * A gradient swatch lets users pick by LOOK.
 *
 * UI-only: nothing in the generation path reads this. Resolution order:
 *   per-style override → category default → neutral fallback.
 */
import { STYLE_CATEGORIES } from '@/lib/config/background-styles'

/** Neutral fallback for unknown / uncategorised ids. */
const FALLBACK = 'linear-gradient(135deg, #64748b, #334155)'

/** Default gradient per UI category (STYLE_CATEGORIES label). */
const CATEGORY_SWATCH: Record<string, string> = {
  Photographic: 'linear-gradient(135deg, #3a4a5a, #1c2530)',
  Illustration: 'linear-gradient(135deg, #ffb86b, #ff6b9d)',
  'Graphic & Type': 'linear-gradient(135deg, #4f7cff, #6c4dff)',
  'Abstract & Atmospheric': 'linear-gradient(135deg, #2dd4bf, #8b5cf6)',
  'Cultural & Heritage': 'linear-gradient(135deg, #f59e0b, #b91c1c)',
  'Premium & Bold': 'linear-gradient(135deg, #d4af37, #1a1a1a)',
  'Campus & Academic': 'linear-gradient(135deg, #1e3a8a, #f59e0b)',
  Custom: 'linear-gradient(135deg, #64748b, #334155)',
}

/** Per-style overrides for the distinctive looks. */
const STYLE_SWATCH: Record<string, string> = {
  scene: 'linear-gradient(135deg, #6b8e6b, #2f4a3a)',
  'photo-real': 'linear-gradient(135deg, #8a9bb0, #3a4658)',
  'photo-pop': 'linear-gradient(135deg, #ff5e7e, #ffd23f)',
  'bw-editorial': 'linear-gradient(135deg, #e5e5e5, #1a1a1a)',
  dark: 'linear-gradient(135deg, #2a2a35, #0a0a0f)',
  bokeh: 'radial-gradient(circle at 30% 30%, #ffd9a0, #6b4f8a)',
  advertising: 'linear-gradient(135deg, #ff4d4d, #ffb300)',
  'spotlight-event': 'linear-gradient(135deg, #ffcf6b, #1a2240)',
  split: 'linear-gradient(120deg, #2563eb 0 50%, #f97316 50% 100%)',
  'movie-keyart': 'linear-gradient(135deg, #0f3d4a, #e08a3c)',
  'double-exposure': 'linear-gradient(135deg, #5b6b8a, #d6a4c4)',
  neon: 'linear-gradient(135deg, #ff00e5, #00e5ff)',
  duotone: 'linear-gradient(135deg, #7c3aed, #f472b6)',
  glassmorphism: 'linear-gradient(135deg, rgba(255,255,255,0.55), #93c5fd)',
  watercolor: 'linear-gradient(135deg, #ffd6e0, #c7e9ff)',
  aurora: 'linear-gradient(135deg, #34d399, #818cf8)',
  vaporwave: 'linear-gradient(135deg, #ff71ce, #01cdfe)',
  luxury: 'linear-gradient(135deg, #e7c873, #14110c)',
  minimal: 'linear-gradient(135deg, #fafafa, #d4d4d4)',
  typographic: 'linear-gradient(135deg, #f5f5f5, #171717)',
  geometric: 'linear-gradient(135deg, #f43f5e, #3b82f6)',
  '3d-render': 'linear-gradient(135deg, #a78bfa, #38bdf8)',
  isometric: 'linear-gradient(135deg, #60a5fa, #a78bfa)',
  festive: 'linear-gradient(135deg, #ff9933, #138808)',
  patriotic: 'linear-gradient(135deg, #ff9933, #1e3a8a)',
  retro: 'linear-gradient(135deg, #e8a33d, #6b3f2a)',
  grunge: 'linear-gradient(135deg, #4b4b4b, #1a1a1a)',
  street: 'linear-gradient(135deg, #f59e0b, #18181b)',
  mandala: 'linear-gradient(135deg, #f59e0b, #7c3aed)',
  chalkboard: 'linear-gradient(135deg, #2a3a35, #11201a)',
  comic: 'linear-gradient(135deg, #ffd23f, #ff3b3b)',
  collegiate: 'linear-gradient(135deg, #1e3a8a, #b91c1c)',
  varsity: 'linear-gradient(135deg, #1e3a8a, #b91c1c)',
  'tech-hud': 'linear-gradient(135deg, #06b6d4, #0a1020)',
  'art-deco': 'linear-gradient(135deg, #d4af37, #14323c)',
}

/** Reverse index: style id → its UI category label. Built once at module load. */
const CATEGORY_OF_STYLE: Record<string, string> = (() => {
  const map: Record<string, string> = {}
  for (const cat of STYLE_CATEGORIES) {
    for (const id of cat.styleIds) map[id] = cat.label
  }
  return map
})()

/** A CSS `background` value representing the style's look, for swatch tiles. */
export function getStyleSwatch(id: string): string {
  return (
    STYLE_SWATCH[id] ??
    CATEGORY_SWATCH[CATEGORY_OF_STYLE[id] ?? ''] ??
    FALLBACK
  )
}
