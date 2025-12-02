/**
 * Rich atmosphere descriptions for all 22 themes
 * Based on "Nano Banana Pro" guide: Be Specific and Descriptive
 * - Define subject, setting, lighting, mood, materiality
 */

import type { VisualAtmosphere } from '../types'

/**
 * Theme to atmosphere mapping
 * Transforms theme keywords into vivid visual narratives
 */
export const THEME_ATMOSPHERES: Record<string, VisualAtmosphere> = {
  // ============================================================
  // PROFESSIONAL CATEGORY (4 themes)
  // ============================================================

  corporate: {
    mood: 'confident and trustworthy',
    lighting: 'Clean, even studio lighting with subtle gradients suggesting professionalism and reliability',
    ambiance: 'A boardroom at golden hour, where success feels inevitable and decisions shape futures',
    materiality: ['polished glass', 'brushed steel', 'premium matte paper', 'crisp fabric textures']
  },

  modern: {
    mood: 'clean and contemporary',
    lighting: 'Crisp, directional light with geometric shadows creating depth and dimension',
    ambiance: 'A sleek urban loft where minimalism meets functionality and every element serves a purpose',
    materiality: ['matte surfaces', 'clean lines', 'subtle textures', 'architectural concrete', 'smooth metals']
  },

  classic: {
    mood: 'timeless and refined',
    lighting: 'Warm, elegant illumination reminiscent of candlelit halls and heritage spaces',
    ambiance: 'A distinguished library where tradition meets excellence and history speaks through every detail',
    materiality: ['rich leather', 'dark polished wood', 'aged paper textures', 'brass accents', 'woven fabrics']
  },

  minimalist: {
    mood: 'calm and intentional',
    lighting: 'Even, soft ambient light with no harsh shadows, creating a sense of serenity',
    ambiance: 'A zen meditation space where less is infinitely more and every element breathes',
    materiality: ['smooth surfaces', 'white space', 'single accent elements', 'fine paper textures', 'subtle shadows']
  },

  // ============================================================
  // CREATIVE CATEGORY (4 themes)
  // ============================================================

  bold: {
    mood: 'confident and attention-grabbing',
    lighting: 'High contrast dramatic lighting with strong highlights and deep shadows',
    ambiance: 'A bold statement that refuses to be ignored, commanding attention from every angle',
    materiality: ['vibrant solids', 'sharp edges', 'bold typography', 'maximum contrast', 'saturated colors']
  },

  playful: {
    mood: 'fun and energetic',
    lighting: 'Bright, even cheerful lighting with no dark shadows, creating a welcoming atmosphere',
    ambiance: 'A creative playground where imagination runs free and joy is the primary ingredient',
    materiality: ['rounded shapes', 'soft edges', 'candy colors', 'bouncy textures', 'smooth gradients']
  },

  artistic: {
    mood: 'creative and expressive',
    lighting: 'Dramatic, painterly light with rich shadows and highlights suggesting artistic intention',
    ambiance: 'An artist\'s studio during peak inspiration, where creativity flows without boundaries',
    materiality: ['paint strokes', 'canvas textures', 'mixed media elements', 'expressive marks', 'color splashes']
  },

  retro: {
    mood: 'nostalgic and vintage',
    lighting: 'Soft, sepia-toned warmth like aged photographs capturing cherished memories',
    ambiance: 'A cherished memory from a golden era, where style was timeless and details mattered',
    materiality: ['aged paper', 'film grain', 'retro typography', 'antique textures', 'faded colors', 'halftone patterns']
  },

  // ============================================================
  // ELEGANT CATEGORY (3 themes)
  // ============================================================

  elegant: {
    mood: 'sophisticated and refined',
    lighting: 'Soft, diffused illumination reminiscent of a gallery opening with gentle highlights on key elements',
    ambiance: 'A curated art exhibition where every detail has been thoughtfully considered and perfection is the standard',
    materiality: ['silk', 'champagne gold accents', 'velvet shadows', 'marble undertones', 'crystal clarity']
  },

  royal: {
    mood: 'majestic and regal',
    lighting: 'Rich, warm candlelight combined with stately chandeliers casting golden warmth',
    ambiance: 'A grand palace ballroom awaiting distinguished guests, where majesty is in every detail',
    materiality: ['royal velvet', 'gold filigree', 'crown motifs', 'heraldic patterns', 'ornate frames', 'deep purples']
  },

  glamorous: {
    mood: 'dazzling and star-studded',
    lighting: 'Sparkling spotlights with lens flares and bokeh creating a red carpet atmosphere',
    ambiance: 'A red carpet premiere where stars shine brightest and every moment is camera-ready',
    materiality: ['sequins', 'diamonds', 'glossy surfaces', 'camera flashes', 'metallic shimmer', 'black tie textures']
  },

  // ============================================================
  // DYNAMIC CATEGORY (3 themes)
  // ============================================================

  sporty: {
    mood: 'dynamic and energetic',
    lighting: 'High-energy stadium lighting with motion blur suggesting action and movement',
    ambiance: 'The electric moment before the starting whistle, where adrenaline meets determination',
    materiality: ['athletic fabrics', 'action lines', 'dynamic angles', 'performance textures', 'sweat and shine']
  },

  futuristic: {
    mood: 'innovative and forward-thinking',
    lighting: 'Cool, ethereal glow with neon accents piercing through darkness, suggesting tomorrow',
    ambiance: 'A glimpse into tomorrow, where technology and creativity merge seamlessly into the future',
    materiality: ['holographic surfaces', 'frosted glass panels', 'chrome edges', 'digital particle effects', 'circuit patterns']
  },

  neon: {
    mood: 'electric and nocturnal',
    lighting: 'Glowing neon signs casting colorful light through darkness with soft bloom effects',
    ambiance: 'A vibrant city street at midnight, alive with energy and pulsing with urban rhythm',
    materiality: ['glowing tubes', 'reflective wet surfaces', 'dark backgrounds', 'color bleeding', 'cyberpunk textures']
  },

  // ============================================================
  // CULTURAL CATEGORY (3 themes)
  // ============================================================

  traditional: {
    mood: 'timeless and cultural',
    lighting: 'Warm, golden illumination like oil lamps or sunset through ancient windows',
    ambiance: 'A heritage celebration where tradition meets reverence and ancestors are honored',
    materiality: ['hand-painted textures', 'woven fabrics', 'natural dyes', 'artisanal craftsmanship', 'ethnic patterns']
  },

  festive: {
    mood: 'joyful and celebratory',
    lighting: 'Warm, sparkling light as if catching thousands of tiny festive lights and sparklers',
    ambiance: 'The moment just before a celebration begins, full of anticipation, warmth, and joy',
    materiality: ['glitter', 'rich fabrics', 'metallic confetti', 'vibrant paper lanterns', 'flowing ribbons']
  },

  spiritual: {
    mood: 'calm and serene',
    lighting: 'Soft, divine rays filtering through like morning light in a sacred space',
    ambiance: 'A peaceful sanctuary where inner peace meets outer beauty and spirit finds rest',
    materiality: ['soft gradients', 'lotus motifs', 'sacred geometry', 'incense wisps', 'temple textures']
  },

  // ============================================================
  // NATURE CATEGORY (2 themes)
  // ============================================================

  organic: {
    mood: 'natural and earthy',
    lighting: 'Soft, dappled sunlight filtering through leaves creating natural patterns',
    ambiance: 'A serene forest clearing at dawn where nature awakens and everything feels alive',
    materiality: ['wood grains', 'leaf textures', 'stone surfaces', 'botanical elements', 'natural fibers', 'earth tones']
  },

  zen: {
    mood: 'peaceful and meditative',
    lighting: 'Soft, diffused natural light creating gentle shadows suggesting perfect stillness',
    ambiance: 'A tranquil Japanese garden at the perfect moment of stillness, where time pauses',
    materiality: ['raked sand', 'smooth stones', 'bamboo', 'water reflections', 'moss textures', 'minimal elements']
  },

  // ============================================================
  // ACADEMIC CATEGORY (2 themes)
  // ============================================================

  scholarly: {
    mood: 'intellectual and distinguished',
    lighting: 'Classic library lighting with warm pools of focused illumination on key areas',
    ambiance: 'An ancient university hall where knowledge is revered and wisdom is passed through generations',
    materiality: ['leather bindings', 'dark woods', 'brass accents', 'parchment textures', 'quill marks', 'seal stamps']
  },

  scientific: {
    mood: 'precise and innovative',
    lighting: 'Cool, clinical illumination with subtle blue undertones suggesting research and discovery',
    ambiance: 'A cutting-edge laboratory where breakthroughs happen and the future is being invented',
    materiality: ['glass beakers', 'grid patterns', 'data visualizations', 'clean surfaces', 'molecular structures']
  },
}

/**
 * Get atmosphere for a theme with fallback
 */
export function getThemeAtmosphere(theme: string): VisualAtmosphere {
  return THEME_ATMOSPHERES[theme] || THEME_ATMOSPHERES['corporate']
}

/**
 * Check if a theme has a defined atmosphere
 */
export function hasThemeAtmosphere(theme: string): boolean {
  return theme in THEME_ATMOSPHERES
}
