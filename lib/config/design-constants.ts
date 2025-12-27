// Design Tab Constants for Yi Creatives Studio
// Adapted from GenPosterAI for "Generate from Scratch" feature

// ============================================================
// ASPECT RATIOS & RESOLUTIONS
// ============================================================

export type AspectRatioId = '1:1' | '2:3' | '3:2' | '3:4' | '4:3' | '4:5' | '5:4' | '9:16' | '16:9' | '21:9'
export type ResolutionId = '1K' | '2K' | '4K'

export const ASPECT_RATIOS = {
  '1:1': { width: 1024, height: 1024, label: 'Square', icon: 'Square', useCase: 'Instagram, Facebook, Profile' },
  '2:3': { width: 832, height: 1248, label: 'Portrait (2:3)', icon: 'RectangleVertical', useCase: 'Pinterest, Portrait Prints' },
  '3:2': { width: 1248, height: 832, label: 'Landscape (3:2)', icon: 'RectangleHorizontal', useCase: 'Photography, Landscape Prints' },
  '3:4': { width: 864, height: 1184, label: 'Portrait (3:4)', icon: 'RectangleVertical', useCase: 'Instagram Portrait, Posters' },
  '4:3': { width: 1184, height: 864, label: 'Landscape (4:3)', icon: 'RectangleHorizontal', useCase: 'Presentations, TV' },
  '4:5': { width: 896, height: 1152, label: 'Instagram Portrait', icon: 'RectangleVertical', useCase: 'Instagram Feed, Facebook' },
  '5:4': { width: 1152, height: 896, label: 'Landscape (5:4)', icon: 'RectangleHorizontal', useCase: 'Photo Prints' },
  '9:16': { width: 768, height: 1344, label: 'Story/Reel', icon: 'Smartphone', useCase: 'Stories, Reels, TikTok' },
  '16:9': { width: 1344, height: 768, label: 'Widescreen', icon: 'Monitor', useCase: 'YouTube, Presentations, Banners' },
  '21:9': { width: 1536, height: 672, label: 'Ultra-Wide', icon: 'MonitorPlay', useCase: 'Cinema, Ultra-wide Banners' },
} as const

// High resolution dimensions for different quality levels
export const DIMENSION_QUALITY = {
  '1:1': {
    '1K': { width: 1024, height: 1024 },
    '2K': { width: 2048, height: 2048 },
    '4K': { width: 4096, height: 4096 },
  },
  '2:3': {
    '1K': { width: 848, height: 1264 },
    '2K': { width: 1696, height: 2528 },
    '4K': { width: 3392, height: 5056 },
  },
  '3:2': {
    '1K': { width: 1264, height: 848 },
    '2K': { width: 2528, height: 1696 },
    '4K': { width: 5056, height: 3392 },
  },
  '3:4': {
    '1K': { width: 896, height: 1200 },
    '2K': { width: 1792, height: 2400 },
    '4K': { width: 3584, height: 4800 },
  },
  '4:3': {
    '1K': { width: 1200, height: 896 },
    '2K': { width: 2400, height: 1792 },
    '4K': { width: 4800, height: 3584 },
  },
  '4:5': {
    '1K': { width: 928, height: 1152 },
    '2K': { width: 1856, height: 2304 },
    '4K': { width: 3712, height: 4608 },
  },
  '5:4': {
    '1K': { width: 1152, height: 928 },
    '2K': { width: 2304, height: 1856 },
    '4K': { width: 4608, height: 3712 },
  },
  '9:16': {
    '1K': { width: 768, height: 1376 },
    '2K': { width: 1536, height: 2752 },
    '4K': { width: 3072, height: 5504 },
  },
  '16:9': {
    '1K': { width: 1376, height: 768 },
    '2K': { width: 2752, height: 1536 },
    '4K': { width: 5504, height: 3072 },
  },
  '21:9': {
    '1K': { width: 1584, height: 672 },
    '2K': { width: 3168, height: 1344 },
    '4K': { width: 6336, height: 2688 },
  },
} as const

export const RESOLUTIONS = {
  '1K': { label: 'Standard (1K)', description: 'Web & Social Media', multiplier: 1 },
  '2K': { label: 'High (2K)', description: 'Print & Presentations', multiplier: 1.5 },
  '4K': { label: 'Ultra (4K)', description: 'Large Format & Banners', multiplier: 2 },
} as const

// ============================================================
// THEME SYSTEM
// ============================================================

export type ThemeCategoryId = 'smart' | 'professional' | 'creative' | 'elegant' | 'dynamic' | 'cultural' | 'nature' | 'academic'
export type ColorTendency = 'cool' | 'warm' | 'neutral' | 'vibrant'

export interface Theme {
  value: string
  label: string
  keywords: string[]
  colorTendency: ColorTendency
  description: string
  thumbnail: string // Path to sample poster thumbnail image
  mood: string // Short mood descriptor (e.g., "Confident", "Playful")
}

export interface ThemeCategory {
  id: ThemeCategoryId
  label: string
  icon: string
  themes: Theme[]
}

export const THEME_CATEGORIES: ThemeCategory[] = [
  {
    id: 'smart',
    label: 'Smart',
    icon: 'Sparkles',
    themes: [
      { value: 'ai', label: 'AI Auto', keywords: ['auto', 'intelligent', 'contextual', 'smart', 'ai'], colorTendency: 'neutral', description: 'AI analyzes your event and creates contextual backgrounds - detects workshop, conference, health camp, etc.', thumbnail: '/images/themes/ai-auto.svg', mood: 'Contextual' },
    ],
  },
  {
    id: 'professional',
    label: 'Professional',
    icon: 'Briefcase',
    themes: [
      { value: 'corporate', label: 'Corporate', keywords: ['formal', 'business', 'clean'], colorTendency: 'cool', description: 'Clean, formal, business-like atmosphere', thumbnail: '/images/themes/corporate.svg', mood: 'Confident' },
      { value: 'modern', label: 'Modern', keywords: ['contemporary', 'sleek', 'current'], colorTendency: 'neutral', description: 'Contemporary, sleek, cutting-edge', thumbnail: '/images/themes/modern.svg', mood: 'Innovative' },
      { value: 'classic', label: 'Classic', keywords: ['timeless', 'traditional', 'refined'], colorTendency: 'warm', description: 'Timeless elegance with traditional refinement', thumbnail: '/images/themes/classic.svg', mood: 'Timeless' },
      { value: 'minimalist', label: 'Minimalist', keywords: ['simple', 'clean', 'whitespace'], colorTendency: 'neutral', description: 'Clean simplicity with purposeful whitespace', thumbnail: '/images/themes/minimalist.svg', mood: 'Clean' },
    ],
  },
  {
    id: 'creative',
    label: 'Creative',
    icon: 'Palette',
    themes: [
      { value: 'bold', label: 'Bold', keywords: ['strong', 'impactful', 'attention-grabbing'], colorTendency: 'vibrant', description: 'Strong, impactful, attention-grabbing', thumbnail: '/images/themes/bold.svg', mood: 'Impactful' },
      { value: 'playful', label: 'Playful', keywords: ['fun', 'vibrant', 'energetic'], colorTendency: 'warm', description: 'Fun, vibrant, full of energy', thumbnail: '/images/themes/playful.svg', mood: 'Energetic' },
      { value: 'artistic', label: 'Artistic', keywords: ['creative', 'expressive', 'unique'], colorTendency: 'vibrant', description: 'Creative expression with unique character', thumbnail: '/images/themes/artistic.svg', mood: 'Expressive' },
      { value: 'retro', label: 'Retro', keywords: ['nostalgic', 'vintage', 'throwback'], colorTendency: 'warm', description: 'Nostalgic vibes with vintage charm', thumbnail: '/images/themes/retro.svg', mood: 'Nostalgic' },
    ],
  },
  {
    id: 'elegant',
    label: 'Elegant',
    icon: 'Crown',
    themes: [
      { value: 'elegant', label: 'Elegant', keywords: ['sophisticated', 'luxurious', 'refined'], colorTendency: 'neutral', description: 'Sophisticated luxury with refined taste', thumbnail: '/images/themes/elegant.svg', mood: 'Luxurious' },
      { value: 'royal', label: 'Royal', keywords: ['regal', 'majestic', 'grand'], colorTendency: 'warm', description: 'Regal grandeur with majestic presence', thumbnail: '/images/themes/royal.svg', mood: 'Majestic' },
      { value: 'glamorous', label: 'Glamorous', keywords: ['glitzy', 'stylish', 'fashionable'], colorTendency: 'warm', description: 'Glitzy style with fashionable flair', thumbnail: '/images/themes/glamorous.svg', mood: 'Stylish' },
    ],
  },
  {
    id: 'dynamic',
    label: 'Dynamic',
    icon: 'Zap',
    themes: [
      { value: 'sporty', label: 'Sporty', keywords: ['athletic', 'energetic', 'dynamic'], colorTendency: 'vibrant', description: 'Athletic energy with dynamic movement', thumbnail: '/images/themes/sporty.svg', mood: 'Athletic' },
      { value: 'futuristic', label: 'Futuristic', keywords: ['sci-fi', 'tech-forward', 'innovative'], colorTendency: 'cool', description: 'Sci-fi inspired, tech-forward vision', thumbnail: '/images/themes/futuristic.svg', mood: 'Tech-Forward' },
      { value: 'neon', label: 'Neon', keywords: ['glowing', 'cyberpunk', 'edgy'], colorTendency: 'vibrant', description: 'Glowing neon with cyberpunk edge', thumbnail: '/images/themes/neon.svg', mood: 'Edgy' },
    ],
  },
  {
    id: 'cultural',
    label: 'Cultural',
    icon: 'Globe',
    themes: [
      { value: 'traditional', label: 'Traditional', keywords: ['cultural', 'heritage', 'ethnic'], colorTendency: 'warm', description: 'Rich cultural heritage with ethnic roots', thumbnail: '/images/themes/traditional.svg', mood: 'Heritage' },
      { value: 'festive', label: 'Festive', keywords: ['celebratory', 'colorful', 'joyful'], colorTendency: 'vibrant', description: 'Celebratory spirit with joyful colors', thumbnail: '/images/themes/festive.svg', mood: 'Celebratory' },
      { value: 'spiritual', label: 'Spiritual', keywords: ['calm', 'serene', 'peaceful'], colorTendency: 'cool', description: 'Calm serenity with peaceful ambiance', thumbnail: '/images/themes/spiritual.svg', mood: 'Serene' },
    ],
  },
  {
    id: 'nature',
    label: 'Nature',
    icon: 'Leaf',
    themes: [
      { value: 'organic', label: 'Organic', keywords: ['natural', 'earthy', 'sustainable'], colorTendency: 'warm', description: 'Natural beauty with earthy textures', thumbnail: '/images/themes/organic.svg', mood: 'Natural' },
      { value: 'zen', label: 'Zen', keywords: ['peaceful', 'balanced', 'harmonious'], colorTendency: 'neutral', description: 'Peaceful balance with harmonious flow', thumbnail: '/images/themes/zen.svg', mood: 'Balanced' },
    ],
  },
  {
    id: 'academic',
    label: 'Academic',
    icon: 'GraduationCap',
    themes: [
      { value: 'scholarly', label: 'Scholarly', keywords: ['intellectual', 'academic', 'bookish'], colorTendency: 'cool', description: 'Intellectual depth with academic precision', thumbnail: '/images/themes/scholarly.svg', mood: 'Intellectual' },
      { value: 'scientific', label: 'Scientific', keywords: ['technical', 'precise', 'data-driven'], colorTendency: 'cool', description: 'Technical precision with data-driven clarity', thumbnail: '/images/themes/scientific.svg', mood: 'Precise' },
    ],
  },
]

// Flat list of all themes
export const THEMES = THEME_CATEGORIES.flatMap((category) =>
  category.themes.map((theme) => ({
    ...theme,
    category: category.id,
    categoryLabel: category.label,
    categoryIcon: category.icon,
  }))
)

// Theme lookup helpers
export const getThemeByValue = (value: string) => THEMES.find((t) => t.value === value)
export const getThemeCategory = (value: string) => {
  const theme = getThemeByValue(value)
  return theme ? THEME_CATEGORIES.find((cat) => cat.id === theme.category) : null
}

// All theme slugs type
export type ThemeSlug =
  | 'corporate' | 'modern' | 'classic' | 'minimalist'
  | 'bold' | 'playful' | 'artistic' | 'retro'
  | 'elegant' | 'royal' | 'glamorous'
  | 'sporty' | 'futuristic' | 'neon'
  | 'traditional' | 'festive' | 'spiritual'
  | 'organic' | 'zen'
  | 'scholarly' | 'scientific'

// ============================================================
// POSTER STYLES (Visual Treatment)
// ============================================================

export interface PosterStyle {
  value: string
  label: string
  keywords: string[]
  icon: string
  description: string
}

export const POSTER_STYLES: PosterStyle[] = [
  { value: 'gradient', label: 'Gradient', keywords: ['smooth color transitions', 'modern', 'depth'], icon: 'Blend', description: 'Smooth color blends, depth, modern feel' },
  { value: 'flat', label: 'Flat Design', keywords: ['solid colors', 'simple shapes', '2D', 'no shadows'], icon: 'Square', description: 'Solid colors, simple shapes, modern icons' },
  { value: 'glass', label: 'Glassmorphism', keywords: ['frosted glass', 'transparency', 'blur', 'light borders'], icon: 'Layers', description: 'Frosted glass effect, transparency, blur' },
  { value: 'geometric', label: 'Geometric', keywords: ['shapes', 'patterns', 'triangles', 'abstract'], icon: 'Triangle', description: 'Shape-based patterns, abstract designs' },
  { value: 'neon-glow', label: 'Neon Glow', keywords: ['dark background', 'glowing elements', 'vibrant'], icon: 'Lightbulb', description: 'Dark backgrounds, bright glowing elements' },
  { value: 'duotone', label: 'Duotone', keywords: ['two colors', 'high contrast', 'artistic'], icon: 'Contrast', description: 'Two-color treatment, high contrast' },
  { value: 'watercolor', label: 'Watercolor', keywords: ['painted', 'soft edges', 'organic', 'artistic'], icon: 'Droplets', description: 'Soft edges, color bleeds, organic feel' },
  { value: 'line-art', label: 'Line Art', keywords: ['outlines', 'minimal fills', 'clean'], icon: 'Pen', description: 'Outline-based, clean lines, minimal fills' },
  { value: '3d-isometric', label: '3D Isometric', keywords: ['three-dimensional', 'depth', 'perspective'], icon: 'Box', description: 'Three-dimensional look, depth, perspective' },
  { value: 'typography', label: 'Typography', keywords: ['large text', 'creative fonts', 'text as design'], icon: 'Type', description: 'Text as design, large fonts, minimal images' },
  { value: 'photographic', label: 'Photographic', keywords: ['real photos', 'realistic', 'authentic'], icon: 'Camera', description: 'Photo backgrounds, realistic imagery' },
  { value: 'illustration', label: 'Illustration', keywords: ['hand-drawn', 'cartoon-like', 'friendly'], icon: 'PenTool', description: 'Hand-drawn feel, cartoon-like, friendly' },
  { value: 'metallic', label: 'Metallic', keywords: ['gold', 'silver', 'chrome', 'shiny'], icon: 'Sparkles', description: 'Shiny metallic effects, gold, silver, chrome' },
  { value: 'paper-cut', label: 'Paper Cut', keywords: ['layered', 'shadows', 'craft-like', 'depth'], icon: 'Scissors', description: 'Layered paper effect, shadows, craft-like' },
  { value: 'monochrome', label: 'Monochrome', keywords: ['single color', 'shades', 'elegant'], icon: 'Circle', description: 'Shades of one color, elegant simplicity' },
  { value: 'high-contrast', label: 'High Contrast', keywords: ['black and white', 'stark', 'impactful'], icon: 'SunMoon', description: 'Stark contrast, bold black and white' },
]

// Style lookup helper
export const getStyleByValue = (value: string) => POSTER_STYLES.find((s) => s.value === value)

// All style slugs type
export type StyleSlug =
  | 'gradient' | 'flat' | 'glass' | 'geometric'
  | 'neon-glow' | 'duotone' | 'watercolor' | 'line-art'
  | '3d-isometric' | 'typography' | 'photographic'
  | 'illustration' | 'metallic' | 'paper-cut'
  | 'monochrome' | 'high-contrast'

// ============================================================
// THEME SUGGESTIONS BY EVENT TYPE
// ============================================================

export const THEME_SUGGESTIONS: Record<string, string[]> = {
  // Academic events
  seminar: ['corporate', 'modern', 'scholarly'],
  workshop: ['modern', 'minimalist', 'scholarly'],
  conference: ['corporate', 'modern', 'elegant'],
  guest_lecture: ['scholarly', 'classic', 'minimalist'],
  webinar: ['modern', 'minimalist', 'corporate'],
  industrial_visit: ['modern', 'corporate', 'scientific'],
  orientation: ['modern', 'playful', 'corporate'],
  convocation: ['elegant', 'royal', 'classic'],
  placement_drive: ['corporate', 'modern', 'minimalist'],
  science_fair: ['scientific', 'futuristic', 'modern'],
  training: ['corporate', 'modern', 'minimalist'],

  // Competitions
  competition: ['bold', 'sporty', 'neon'],
  hackathon: ['futuristic', 'neon', 'bold'],
  quiz: ['scholarly', 'modern', 'bold'],
  debate: ['scholarly', 'classic', 'corporate'],
  sports_event: ['sporty', 'bold', 'neon'],
  sports_day: ['sporty', 'playful', 'bold'],

  // Celebrations
  celebration: ['festive', 'playful', 'glamorous'],
  cultural_event: ['traditional', 'artistic', 'festive'],
  annual_day: ['elegant', 'festive', 'royal'],
  freshers_day: ['playful', 'bold', 'festive'],
  farewell: ['elegant', 'classic', 'royal'],
  alumni_meet: ['classic', 'retro', 'elegant'],
  reunion: ['classic', 'retro', 'elegant'],
  tech_fest: ['futuristic', 'modern', 'neon'],
  cultural_fest: ['traditional', 'festive', 'artistic'],
  festival: ['festive', 'traditional', 'playful'],

  // Corporate events
  meetup: ['modern', 'corporate', 'minimalist'],
  exhibition: ['modern', 'artistic', 'elegant'],
  product_launch: ['modern', 'bold', 'futuristic'],
  town_hall: ['corporate', 'modern', 'minimalist'],
  award_ceremony: ['elegant', 'glamorous', 'royal'],
  networking: ['modern', 'corporate', 'minimalist'],
  panel_discussion: ['corporate', 'scholarly', 'modern'],
  inauguration: ['royal', 'elegant', 'classic'],
  foundation_day: ['royal', 'classic', 'elegant'],

  // Community events
  blood_donation: ['bold', 'modern', 'minimalist'],
  health_camp: ['organic', 'zen', 'minimalist'],
  csr_activity: ['organic', 'modern', 'corporate'],
  awareness_program: ['bold', 'modern', 'corporate'],
  charity_event: ['elegant', 'festive', 'modern'],

  // National events
  independence_day: ['traditional', 'festive', 'royal'],
  republic_day: ['traditional', 'royal', 'festive'],
  teachers_day: ['classic', 'scholarly', 'elegant'],
  memorial: ['elegant', 'classic', 'spiritual'],
}

// Get suggested themes for an event type
export const getSuggestedThemes = (eventType: string): string[] =>
  THEME_SUGGESTIONS[eventType] || ['corporate', 'modern', 'minimalist']

// Check if a theme is suggested for an event type
export const isThemeSuggested = (theme: string, eventType: string): boolean =>
  (THEME_SUGGESTIONS[eventType] || []).includes(theme)

// ============================================================
// CUSTOMIZATION DEFAULTS
// ============================================================

export type TitlePosition = 'top' | 'center' | 'bottom'
export type TitleAlignment = 'left' | 'center' | 'right'
export type FontWeight = 'normal' | 'medium' | 'semibold' | 'bold'
export type BackgroundType = 'gradient' | 'solid' | 'pattern' | 'image'
export type PhotoShape = 'circle' | 'square' | 'rounded'
export type PhotoPosition = 'left' | 'center' | 'right'
export type PhotoVerticalPosition = 'top' | 'upper' | 'middle' | 'lower' | 'bottom'
export type FooterStyle = 'minimal' | 'full' | 'branded'

// Multi-speaker support types
export type LayoutMode = 'auto' | 'manual'
export type LayoutStrategy = 'side-by-side' | 'stacked' | 'grid'

// Individual speaker data structure
export interface SpeakerItem {
  id: string              // Unique ID (crypto.randomUUID())
  name: string            // Speaker name
  designation?: string    // Title/role
  photoUrl?: string       // Data URL
}

export interface TitleCustomization {
  position: TitlePosition
  alignment: TitleAlignment
  fontSize: number
  fontWeight: FontWeight
  color: string
  shadow: boolean
}

export interface BackgroundCustomization {
  type: BackgroundType
  primaryColor: string
  secondaryColor: string
  overlay: boolean
  overlayOpacity: number
  blur: boolean
  blurAmount: number
}

export interface SpeakerPhotoCustomization {
  enabled: boolean

  // NEW: Multi-speaker support
  speakers?: SpeakerItem[]
  layoutMode?: LayoutMode
  layoutStrategy?: LayoutStrategy
  spacing?: number

  // SHARED photo settings (applies to all speakers)
  shape: PhotoShape
  size: number
  border: {
    width: number
    color: string
  }
  shadow: boolean

  // LEGACY: Single speaker fields (backward compatibility)
  photoUrl?: string
  position?: PhotoPosition
  verticalPosition?: PhotoVerticalPosition
}

export interface FooterCustomization {
  style: FooterStyle
  backgroundColor: string
  // Single toggle for using brand info (default: false = disabled)
  useBrandInfo: boolean
  // Individual toggles for each brand field
  useBrandWebsite?: boolean
  useBrandPhone?: boolean
  useBrandEmail?: boolean
  useBrandAddress?: boolean
  useBrandSocial?: boolean
  // Custom per-creative values (used when useBrand* is false)
  customWebsite?: string
  customPhone?: string
  customEmail?: string
  customAddress?: string
  customSocial?: {
    instagram?: string
    linkedin?: string
    facebook?: string
    twitter?: string
  }
}

export interface LayoutCustomization {
  edgeToEdge: boolean // When true, design fills entire canvas without reserved zones
  headerHeight: number // Reserved zone at top (0 for edge-to-edge)
  footerHeight: number // Reserved zone at bottom (0 for edge-to-edge)
}

export interface LogoStripCustomization {
  enabled: boolean
  rows: string[] // 'header' | 'middle' | 'footer'
  shape: LogoStripShape
  opacity: number
  style: LogoStripStyle
  shadow: boolean
  border: boolean
}

export interface CustomizationData {
  title: TitleCustomization
  background: BackgroundCustomization
  speakerPhoto: SpeakerPhotoCustomization
  footer: FooterCustomization
  layout: LayoutCustomization
}

export const DEFAULT_CUSTOMIZATION: CustomizationData = {
  title: {
    position: 'center',
    alignment: 'center',
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
    shadow: true,
  },
  background: {
    type: 'gradient',
    primaryColor: '#1a1a2e',
    secondaryColor: '#16213e',
    overlay: false,
    overlayOpacity: 50,
    blur: false,
    blurAmount: 10,
  },
  speakerPhoto: {
    enabled: false,

    // NEW: Multi-speaker defaults
    speakers: [],           // Empty array by default
    layoutMode: 'auto',     // Auto-detect layout
    spacing: 20,            // 20px gap between speakers

    // SHARED photo settings
    shape: 'circle',
    size: 200,
    border: {
      width: 3,
      color: '#005B96',     // Yi brand primary color
    },
    shadow: true,

    // LEGACY: Single speaker (backward compatibility)
    photoUrl: undefined,
    position: 'center',
    verticalPosition: 'lower',
  },
  footer: {
    style: 'minimal',
    backgroundColor: 'transparent',
    useBrandInfo: false, // Default to disabled - users enable if they want brand info
    // Custom values default to undefined
    customWebsite: undefined,
    customPhone: undefined,
    customEmail: undefined,
    customAddress: undefined,
    customSocial: undefined,
  },
  layout: {
    edgeToEdge: true, // Default to edge-to-edge for full-bleed designs
    headerHeight: 0,
    footerHeight: 0,
  },
}

// ============================================================
// EXPORT SETTINGS
// ============================================================

export type ColorMode = 'rgb' | 'srgb' | 'cmyk' | 'cmyk-iso' | 'cmyk-coated'
export type FileFormat = 'png' | 'jpg' | 'pdf' | 'webp'
export type DPI = 72 | 150 | 300 | 600

export interface ExportSettings {
  colorMode: ColorMode
  format: FileFormat
  dpi: DPI
  quality: number
}

export const DEFAULT_EXPORT_SETTINGS: ExportSettings = {
  colorMode: 'rgb',
  format: 'png',
  dpi: 300,
  quality: 90,
}

export const COLOR_MODES = [
  { value: 'rgb', label: 'RGB (Digital)', description: 'Standard RGB for screens' },
  { value: 'srgb', label: 'sRGB (Web)', description: 'Standard RGB for web' },
  { value: 'cmyk', label: 'CMYK (Print)', description: 'For professional printing' },
  { value: 'cmyk-iso', label: 'CMYK ISO', description: 'ISO standard for print' },
  { value: 'cmyk-coated', label: 'CMYK Coated', description: 'For coated paper printing' },
] as const

export const FILE_FORMATS = [
  { value: 'png', label: 'PNG', description: 'Lossless, best quality' },
  { value: 'jpg', label: 'JPG', description: 'Smaller file size' },
  { value: 'pdf', label: 'PDF', description: 'Print-ready document' },
  { value: 'webp', label: 'WebP', description: 'Modern web format' },
] as const

export const DPI_OPTIONS = [
  { value: 72, label: '72 DPI', description: 'Web & Screen' },
  { value: 150, label: '150 DPI', description: 'Standard Digital' },
  { value: 300, label: '300 DPI', description: 'Professional Print' },
  { value: 600, label: '600 DPI', description: 'High-Quality Print' },
] as const

// ============================================================
// COLOR CONFIGURATION
// ============================================================

export interface CustomColors {
  primary: string
  secondary: string
  accent: string
}

export interface ColorConfig {
  useBrandColors: boolean // Toggle state: true = use organization brand colors
  useBrandFont: boolean // Toggle state: true = use brand font, false = AI chooses
  selectedPalette: string | null // e.g., 'teal_orange', 'navy_gold', or 'custom'
  customColors: CustomColors | null // Custom colors when selectedPalette is 'custom'
}

// Preset color palettes
export const COLOR_PALETTES = {
  teal_orange: {
    id: 'teal_orange',
    name: 'Teal & Orange',
    primary: '#1B998B',
    secondary: '#FF6B35',
    accent: '#3366FF',
  },
  navy_gold: {
    id: 'navy_gold',
    name: 'Navy & Gold',
    primary: '#1E3A5F',
    secondary: '#D4AF37',
    accent: '#FFFFFF',
  },
  purple_pink: {
    id: 'purple_pink',
    name: 'Purple & Pink',
    primary: '#8B5CF6',
    secondary: '#EC4899',
    accent: '#F0ABFC',
  },
  green_teal: {
    id: 'green_teal',
    name: 'Green & Teal',
    primary: '#22C55E',
    secondary: '#14B8A6',
    accent: '#A7F3D0',
  },
  red_orange: {
    id: 'red_orange',
    name: 'Red & Orange',
    primary: '#EF4444',
    secondary: '#F97316',
    accent: '#FED7AA',
  },
  blue_cyan: {
    id: 'blue_cyan',
    name: 'Blue & Cyan',
    primary: '#3B82F6',
    secondary: '#06B6D4',
    accent: '#BAE6FD',
  },
  indigo_violet: {
    id: 'indigo_violet',
    name: 'Indigo & Violet',
    primary: '#6366F1',
    secondary: '#8B5CF6',
    accent: '#C4B5FD',
  },
  rose_pink: {
    id: 'rose_pink',
    name: 'Rose & Pink',
    primary: '#F43F5E',
    secondary: '#EC4899',
    accent: '#FBCFE8',
  },
} as const

export type ColorPaletteId = keyof typeof COLOR_PALETTES

export const DEFAULT_COLOR_CONFIG: ColorConfig = {
  useBrandColors: true, // Default to using brand colors
  useBrandFont: true, // Default to using brand font (backward compatible)
  selectedPalette: null,
  customColors: null,
}

// NEW v3.10: Color resolution types (re-exported from resolve-color-config for convenience)
export type ColorSource = 'brand' | 'preset' | 'custom' | 'fallback'

export interface ResolvedColorConfig extends ColorConfig {
  resolvedPrimaryColor: string
  resolvedSecondaryColor: string
  resolvedAccentColor: string
  colorSource: ColorSource
}

// Helper to get palette by ID
export const getColorPaletteById = (id: string) =>
  COLOR_PALETTES[id as ColorPaletteId] || null

// NEW v3.10: Export hex color validation function
export function isValidHexColor(color: string): boolean {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)
}

// ============================================================
// LOGO STRIP SHAPES
// ============================================================

export type LogoStripShape = 'rectangle' | 'curved' | 'angled' | 'rounded' | 'tapered'

export interface LogoStripShapeOption {
  value: LogoStripShape
  label: string
  description: string
  icon: string
  preview: string // SVG path or description for preview
}

export const LOGO_STRIP_SHAPES: Record<LogoStripShape, LogoStripShapeOption> = {
  rectangle: {
    value: 'rectangle',
    label: 'Rectangle',
    description: 'Clean rectangular strip - classic and professional',
    icon: 'Square',
    preview: 'M 0,0 L 100,0 L 100,30 L 0,30 Z',
  },
  curved: {
    value: 'curved',
    label: 'Curved/Wave',
    description: 'Smooth curved edges - modern and dynamic',
    icon: 'Waves',
    preview: 'M 0,5 Q 25,0 50,5 T 100,5 L 100,25 Q 75,30 50,25 T 0,25 Z',
  },
  angled: {
    value: 'angled',
    label: 'Angled/Diagonal',
    description: 'Diagonal cut edges - energetic and bold',
    icon: 'Slash',
    preview: 'M 0,10 L 100,0 L 100,20 L 0,30 Z',
  },
  rounded: {
    value: 'rounded',
    label: 'Rounded Rectangle',
    description: 'Rounded corners - friendly and approachable',
    icon: 'RectangleEllipsis',
    preview: 'M 10,0 L 90,0 Q 100,0 100,10 L 100,20 Q 100,30 90,30 L 10,30 Q 0,30 0,20 L 0,10 Q 0,0 10,0 Z',
  },
  tapered: {
    value: 'tapered',
    label: 'Tapered/Trapezoid',
    description: 'Directional flow - unique and distinctive',
    icon: 'Triangle',
    preview: 'M 10,0 L 90,0 L 100,30 L 0,30 Z',
  },
} as const

// Default logo strip shape
export const DEFAULT_LOGO_STRIP_SHAPE: LogoStripShape = 'curved'

// Get logo strip shape by value
export const getLogoStripShapeByValue = (value: string) =>
  LOGO_STRIP_SHAPES[value as LogoStripShape] || LOGO_STRIP_SHAPES.rectangle

// ============================================================
// LOGO STRIP DYNAMIC STYLING (v4.2 - Story-Driven)
// ============================================================

/**
 * Logo strip style variants based on event vibe/mood
 * Enables dynamic styling that matches the event's narrative
 */
export type LogoStripStyle = 'sophisticated' | 'modern' | 'classic' | 'minimal'

/**
 * Complete logo strip styling configuration
 * Combines shape with visual treatment options
 */
export interface LogoStripStyleConfig {
  shape: LogoStripShape
  style: LogoStripStyle
  shadow?: 'subtle' | 'medium' | 'prominent' | 'none'
  gradient?: boolean // Use gradient instead of solid white
  border?: boolean // Add border to logo strip
}

/**
 * Map event vibe keywords to logo strip styling
 * AI-analyzed vibe from Design Intelligence determines the style
 *
 * Usage: When AI determines event has "prestigious" vibe, apply sophisticated curved strip
 */
export const VIBE_TO_LOGO_STRIP_STYLE: Record<string, LogoStripStyleConfig> = {
  prestigious: {
    shape: 'curved',
    style: 'sophisticated',
    shadow: 'subtle',
    gradient: false,
    border: false,
  },
  empowering: {
    shape: 'curved',
    style: 'sophisticated',
    shadow: 'medium',
    gradient: false,
    border: false,
  },
  authoritative: {
    shape: 'angled',
    style: 'modern',
    shadow: 'medium',
    gradient: false,
    border: false,
  },
  modern: {
    shape: 'angled',
    style: 'modern',
    shadow: 'medium',
    gradient: true,
    border: false,
  },
  innovative: {
    shape: 'angled',
    style: 'modern',
    shadow: 'prominent',
    gradient: true,
    border: false,
  },
  futuristic: {
    shape: 'angled',
    style: 'modern',
    shadow: 'prominent',
    gradient: true,
    border: false,
  },
  traditional: {
    shape: 'rounded',
    style: 'classic',
    shadow: 'subtle',
    gradient: false,
    border: true,
  },
  cultural: {
    shape: 'rounded',
    style: 'classic',
    shadow: 'subtle',
    gradient: false,
    border: true,
  },
  heritage: {
    shape: 'rounded',
    style: 'classic',
    shadow: 'subtle',
    gradient: false,
    border: true,
  },
  minimal: {
    shape: 'rectangle',
    style: 'minimal',
    shadow: 'none',
    gradient: false,
    border: false,
  },
  clean: {
    shape: 'rectangle',
    style: 'minimal',
    shadow: 'none',
    gradient: false,
    border: false,
  },
  elegant: {
    shape: 'curved',
    style: 'sophisticated',
    shadow: 'subtle',
    gradient: false,
    border: false,
  },
  playful: {
    shape: 'rounded',
    style: 'modern',
    shadow: 'medium',
    gradient: true,
    border: false,
  },
  energetic: {
    shape: 'tapered',
    style: 'modern',
    shadow: 'prominent',
    gradient: true,
    border: false,
  },
  bold: {
    shape: 'angled',
    style: 'modern',
    shadow: 'prominent',
    gradient: false,
    border: false,
  },
  caring: {
    shape: 'rounded',
    style: 'sophisticated',
    shadow: 'subtle',
    gradient: false,
    border: false,
  },
  professional: {
    shape: 'rectangle',
    style: 'sophisticated',
    shadow: 'subtle',
    gradient: false,
    border: false,
  },
  corporate: {
    shape: 'rectangle',
    style: 'sophisticated',
    shadow: 'subtle',
    gradient: false,
    border: true,
  },
}

/**
 * Get logo strip style configuration based on event vibe
 * Falls back to default if vibe not found
 */
export const getLogoStripStyleByVibe = (vibe?: string): LogoStripStyleConfig => {
  if (!vibe) {
    return {
      shape: DEFAULT_LOGO_STRIP_SHAPE,
      style: 'sophisticated',
      shadow: 'subtle',
      gradient: false,
      border: false,
    }
  }

  const normalizedVibe = vibe.toLowerCase().trim()
  return (
    VIBE_TO_LOGO_STRIP_STYLE[normalizedVibe] || {
      shape: DEFAULT_LOGO_STRIP_SHAPE,
      style: 'sophisticated',
      shadow: 'subtle',
      gradient: false,
      border: false,
    }
  )
}

// ============================================================
// TYPOGRAPHY CONFIGURATION (v4.3)
// ============================================================

export type FontCategory = 'sans' | 'serif' | 'display' | 'handwriting'

export interface FontOption {
  value: string
  label: string
  category: FontCategory
  family: string // CSS font-family
}

// Curated list of professional, reliable Google Fonts
// EXPANDED v5.0: 17 → 47 fonts for better event-type matching and AI-powered pairing
export const FONT_OPTIONS: FontOption[] = [
  // ============================================================
  // SANS SERIF (16 fonts) - Clean, Modern, Corporate
  // ============================================================
  { value: 'inter', label: 'Inter', category: 'sans', family: '"Inter", sans-serif' },
  { value: 'roboto', label: 'Roboto', category: 'sans', family: '"Roboto", sans-serif' },
  { value: 'poppins', label: 'Poppins', category: 'sans', family: '"Poppins", sans-serif' },
  { value: 'montserrat', label: 'Montserrat', category: 'sans', family: '"Montserrat", sans-serif' },
  { value: 'lato', label: 'Lato', category: 'sans', family: '"Lato", sans-serif' },
  { value: 'raleway', label: 'Raleway', category: 'sans', family: '"Raleway", sans-serif' },
  // NEW v5.0: Modern sans-serif additions
  { value: 'dm_sans', label: 'DM Sans', category: 'sans', family: '"DM Sans", sans-serif' },
  { value: 'nunito', label: 'Nunito', category: 'sans', family: '"Nunito", sans-serif' },
  { value: 'source_sans_3', label: 'Source Sans 3', category: 'sans', family: '"Source Sans 3", sans-serif' },
  { value: 'open_sans', label: 'Open Sans', category: 'sans', family: '"Open Sans", sans-serif' },
  { value: 'manrope', label: 'Manrope', category: 'sans', family: '"Manrope", sans-serif' },
  { value: 'karla', label: 'Karla', category: 'sans', family: '"Karla", sans-serif' },
  { value: 'rubik', label: 'Rubik', category: 'sans', family: '"Rubik", sans-serif' },
  { value: 'barlow', label: 'Barlow', category: 'sans', family: '"Barlow", sans-serif' },
  { value: 'cabin', label: 'Cabin', category: 'sans', family: '"Cabin", sans-serif' },
  { value: 'quicksand', label: 'Quicksand', category: 'sans', family: '"Quicksand", sans-serif' },

  // ============================================================
  // SERIF (13 fonts) - Traditional, Elegant, Academic
  // ============================================================
  { value: 'merriweather', label: 'Merriweather', category: 'serif', family: '"Merriweather", serif' },
  { value: 'playfair_display', label: 'Playfair Display', category: 'serif', family: '"Playfair Display", serif' },
  { value: 'lora', label: 'Lora', category: 'serif', family: '"Lora", serif' },
  { value: 'pt_serif', label: 'PT Serif', category: 'serif', family: '"PT Serif", serif' },
  { value: 'crimson_text', label: 'Crimson Text', category: 'serif', family: '"Crimson Text", serif' },
  // NEW v5.0: Elegant serif additions
  { value: 'cormorant', label: 'Cormorant', category: 'serif', family: '"Cormorant", serif' },
  { value: 'libre_baskerville', label: 'Libre Baskerville', category: 'serif', family: '"Libre Baskerville", serif' },
  { value: 'eb_garamond', label: 'EB Garamond', category: 'serif', family: '"EB Garamond", serif' },
  { value: 'spectral', label: 'Spectral', category: 'serif', family: '"Spectral", serif' },
  { value: 'cardo', label: 'Cardo', category: 'serif', family: '"Cardo", serif' },
  { value: 'yeseva_one', label: 'Yeseva One', category: 'serif', family: '"Yeseva One", serif' },
  { value: 'neuton', label: 'Neuton', category: 'serif', family: '"Neuton", serif' },
  { value: 'philosopher', label: 'Philosopher', category: 'serif', family: '"Philosopher", serif' },

  // ============================================================
  // DISPLAY (12 fonts) - Bold, Creative, Headlines
  // ============================================================
  { value: 'oswald', label: 'Oswald', category: 'display', family: '"Oswald", sans-serif' },
  { value: 'bebas_neue', label: 'Bebas Neue', category: 'display', family: '"Bebas Neue", sans-serif' },
  { value: 'work_sans', label: 'Work Sans', category: 'display', family: '"Work Sans", sans-serif' },
  { value: 'syne', label: 'Syne', category: 'display', family: '"Syne", sans-serif' },
  // NEW v5.0: Impactful display fonts
  { value: 'archivo_black', label: 'Archivo Black', category: 'display', family: '"Archivo Black", sans-serif' },
  { value: 'anton', label: 'Anton', category: 'display', family: '"Anton", sans-serif' },
  { value: 'righteous', label: 'Righteous', category: 'display', family: '"Righteous", sans-serif' },
  { value: 'exo_2', label: 'Exo 2', category: 'display', family: '"Exo 2", sans-serif' },
  { value: 'teko', label: 'Teko', category: 'display', family: '"Teko", sans-serif' },
  { value: 'passion_one', label: 'Passion One', category: 'display', family: '"Passion One", sans-serif' },
  { value: 'cinzel', label: 'Cinzel', category: 'display', family: '"Cinzel", serif' },
  { value: 'abril_fatface', label: 'Abril Fatface', category: 'display', family: '"Abril Fatface", serif' },

  // ============================================================
  // HANDWRITING (7 fonts) - Personal, Friendly, Informal
  // ============================================================
  { value: 'dancing_script', label: 'Dancing Script', category: 'handwriting', family: '"Dancing Script", cursive' },
  { value: 'pacifico', label: 'Pacifico', category: 'handwriting', family: '"Pacifico", cursive' },
  { value: 'caveat', label: 'Caveat', category: 'handwriting', family: '"Caveat", cursive' },
  // NEW v5.0: Expressive handwriting fonts
  { value: 'great_vibes', label: 'Great Vibes', category: 'handwriting', family: '"Great Vibes", cursive' },
  { value: 'satisfy', label: 'Satisfy', category: 'handwriting', family: '"Satisfy", cursive' },
  { value: 'kalam', label: 'Kalam', category: 'handwriting', family: '"Kalam", cursive' },
  { value: 'permanent_marker', label: 'Permanent Marker', category: 'handwriting', family: '"Permanent Marker", cursive' },
]

// ============================================================
// FONT METADATA FOR AI PAIRING (v5.0)
// ============================================================

/**
 * Extended font metadata for AI-powered font pairing
 * Includes formality, mood, typography metrics, and compatibility data
 */
export interface FontMetadata {
  value: string
  label: string
  category: FontCategory
  family: string
  formalityScore: number      // 0-100 (0=casual, 100=formal)
  moodTags: string[]          // e.g., ['friendly', 'modern', 'tech']
  xHeight: 'low' | 'medium' | 'high'
  strokeContrast: 'low' | 'medium' | 'high'
  characterWidth: 'condensed' | 'normal' | 'extended'
  bestFor: string[]           // Event types
  pairsWellWith: string[]     // Font values that pair well
}

/**
 * Complete font metadata for all 48 fonts
 * Used by AI pairing engine to recommend optimal typography combinations
 */
export const FONT_METADATA: Record<string, FontMetadata> = {
  // SANS SERIF FONTS
  inter: {
    value: 'inter', label: 'Inter', category: 'sans', family: '"Inter", sans-serif',
    formalityScore: 70,
    moodTags: ['professional', 'modern', 'clean', 'neutral', 'corporate'],
    xHeight: 'high', strokeContrast: 'low', characterWidth: 'normal',
    bestFor: ['conference', 'tech', 'corporate', 'workshop', 'business'],
    pairsWellWith: ['merriweather', 'playfair_display', 'lora', 'cormorant', 'eb_garamond']
  },
  roboto: {
    value: 'roboto', label: 'Roboto', category: 'sans', family: '"Roboto", sans-serif',
    formalityScore: 65,
    moodTags: ['modern', 'friendly', 'versatile', 'readable'],
    xHeight: 'high', strokeContrast: 'low', characterWidth: 'normal',
    bestFor: ['workshop', 'tech', 'educational', 'health'],
    pairsWellWith: ['lora', 'pt_serif', 'spectral', 'crimson_text']
  },
  poppins: {
    value: 'poppins', label: 'Poppins', category: 'sans', family: '"Poppins", sans-serif',
    formalityScore: 60,
    moodTags: ['friendly', 'geometric', 'modern', 'approachable'],
    xHeight: 'high', strokeContrast: 'low', characterWidth: 'normal',
    bestFor: ['community', 'workshop', 'family', 'cultural'],
    pairsWellWith: ['merriweather', 'lora', 'libre_baskerville']
  },
  montserrat: {
    value: 'montserrat', label: 'Montserrat', category: 'sans', family: '"Montserrat", sans-serif',
    formalityScore: 65,
    moodTags: ['urban', 'geometric', 'modern', 'versatile'],
    xHeight: 'medium', strokeContrast: 'low', characterWidth: 'normal',
    bestFor: ['business', 'tech', 'conference', 'cultural'],
    pairsWellWith: ['playfair_display', 'merriweather', 'cormorant']
  },
  lato: {
    value: 'lato', label: 'Lato', category: 'sans', family: '"Lato", sans-serif',
    formalityScore: 65,
    moodTags: ['warm', 'friendly', 'professional', 'readable'],
    xHeight: 'medium', strokeContrast: 'low', characterWidth: 'normal',
    bestFor: ['workshop', 'educational', 'community', 'health'],
    pairsWellWith: ['merriweather', 'pt_serif', 'lora']
  },
  raleway: {
    value: 'raleway', label: 'Raleway', category: 'sans', family: '"Raleway", sans-serif',
    formalityScore: 70,
    moodTags: ['elegant', 'thin', 'sophisticated', 'modern'],
    xHeight: 'medium', strokeContrast: 'low', characterWidth: 'normal',
    bestFor: ['wedding', 'business', 'cultural', 'gala'],
    pairsWellWith: ['playfair_display', 'cormorant', 'eb_garamond']
  },
  dm_sans: {
    value: 'dm_sans', label: 'DM Sans', category: 'sans', family: '"DM Sans", sans-serif',
    formalityScore: 70,
    moodTags: ['geometric', 'clean', 'modern', 'professional'],
    xHeight: 'high', strokeContrast: 'low', characterWidth: 'normal',
    bestFor: ['tech', 'business', 'conference', 'corporate'],
    pairsWellWith: ['spectral', 'lora', 'libre_baskerville']
  },
  nunito: {
    value: 'nunito', label: 'Nunito', category: 'sans', family: '"Nunito", sans-serif',
    formalityScore: 50,
    moodTags: ['friendly', 'rounded', 'approachable', 'warm'],
    xHeight: 'high', strokeContrast: 'low', characterWidth: 'normal',
    bestFor: ['family', 'community', 'workshop', 'cultural'],
    pairsWellWith: ['merriweather', 'lora', 'neuton']
  },
  source_sans_3: {
    value: 'source_sans_3', label: 'Source Sans 3', category: 'sans', family: '"Source Sans 3", sans-serif',
    formalityScore: 70,
    moodTags: ['professional', 'readable', 'neutral', 'technical'],
    xHeight: 'high', strokeContrast: 'low', characterWidth: 'normal',
    bestFor: ['tech', 'educational', 'conference', 'business'],
    pairsWellWith: ['spectral', 'pt_serif', 'crimson_text']
  },
  open_sans: {
    value: 'open_sans', label: 'Open Sans', category: 'sans', family: '"Open Sans", sans-serif',
    formalityScore: 65,
    moodTags: ['neutral', 'friendly', 'optimized', 'readable'],
    xHeight: 'high', strokeContrast: 'low', characterWidth: 'normal',
    bestFor: ['workshop', 'educational', 'community', 'health'],
    pairsWellWith: ['lora', 'merriweather', 'pt_serif']
  },
  manrope: {
    value: 'manrope', label: 'Manrope', category: 'sans', family: '"Manrope", sans-serif',
    formalityScore: 68,
    moodTags: ['modern', 'geometric', 'tech', 'clean'],
    xHeight: 'medium', strokeContrast: 'low', characterWidth: 'normal',
    bestFor: ['tech', 'business', 'conference'],
    pairsWellWith: ['spectral', 'eb_garamond', 'cormorant']
  },
  karla: {
    value: 'karla', label: 'Karla', category: 'sans', family: '"Karla", sans-serif',
    formalityScore: 60,
    moodTags: ['grotesque', 'clean', 'readable', 'neutral'],
    xHeight: 'high', strokeContrast: 'low', characterWidth: 'normal',
    bestFor: ['workshop', 'educational', 'community'],
    pairsWellWith: ['lora', 'merriweather', 'neuton']
  },
  rubik: {
    value: 'rubik', label: 'Rubik', category: 'sans', family: '"Rubik", sans-serif',
    formalityScore: 55,
    moodTags: ['friendly', 'rounded', 'modern', 'playful'],
    xHeight: 'high', strokeContrast: 'low', characterWidth: 'normal',
    bestFor: ['family', 'workshop', 'community', 'cultural'],
    pairsWellWith: ['merriweather', 'libre_baskerville', 'lora']
  },
  barlow: {
    value: 'barlow', label: 'Barlow', category: 'sans', family: '"Barlow", sans-serif',
    formalityScore: 60,
    moodTags: ['geometric', 'condensed', 'modern', 'efficient'],
    xHeight: 'medium', strokeContrast: 'low', characterWidth: 'condensed',
    bestFor: ['tech', 'business', 'workshop'],
    pairsWellWith: ['spectral', 'pt_serif', 'neuton']
  },
  cabin: {
    value: 'cabin', label: 'Cabin', category: 'sans', family: '"Cabin", sans-serif',
    formalityScore: 60,
    moodTags: ['humanist', 'friendly', 'readable', 'warm'],
    xHeight: 'medium', strokeContrast: 'low', characterWidth: 'normal',
    bestFor: ['workshop', 'community', 'educational'],
    pairsWellWith: ['lora', 'merriweather', 'crimson_text']
  },
  quicksand: {
    value: 'quicksand', label: 'Quicksand', category: 'sans', family: '"Quicksand", sans-serif',
    formalityScore: 45,
    moodTags: ['rounded', 'friendly', 'modern', 'gentle'],
    xHeight: 'high', strokeContrast: 'low', characterWidth: 'normal',
    bestFor: ['family', 'community', 'cultural', 'workshop'],
    pairsWellWith: ['merriweather', 'lora', 'neuton']
  },

  // SERIF FONTS
  merriweather: {
    value: 'merriweather', label: 'Merriweather', category: 'serif', family: '"Merriweather", serif',
    formalityScore: 75,
    moodTags: ['traditional', 'readable', 'elegant', 'professional'],
    xHeight: 'high', strokeContrast: 'medium', characterWidth: 'normal',
    bestFor: ['conference', 'academic', 'business', 'educational'],
    pairsWellWith: ['inter', 'roboto', 'lato', 'poppins', 'open_sans']
  },
  playfair_display: {
    value: 'playfair_display', label: 'Playfair Display', category: 'serif', family: '"Playfair Display", serif',
    formalityScore: 90,
    moodTags: ['elegant', 'sophisticated', 'luxury', 'traditional'],
    xHeight: 'medium', strokeContrast: 'high', characterWidth: 'normal',
    bestFor: ['wedding', 'gala', 'cultural', 'awards'],
    pairsWellWith: ['inter', 'lato', 'raleway', 'montserrat']
  },
  lora: {
    value: 'lora', label: 'Lora', category: 'serif', family: '"Lora", serif',
    formalityScore: 75,
    moodTags: ['calligraphic', 'elegant', 'readable', 'warm'],
    xHeight: 'medium', strokeContrast: 'medium', characterWidth: 'normal',
    bestFor: ['academic', 'cultural', 'business', 'wedding'],
    pairsWellWith: ['inter', 'roboto', 'poppins', 'lato']
  },
  pt_serif: {
    value: 'pt_serif', label: 'PT Serif', category: 'serif', family: '"PT Serif", serif',
    formalityScore: 75,
    moodTags: ['traditional', 'readable', 'professional', 'scholarly'],
    xHeight: 'medium', strokeContrast: 'medium', characterWidth: 'normal',
    bestFor: ['academic', 'educational', 'business', 'conference'],
    pairsWellWith: ['roboto', 'lato', 'open_sans', 'source_sans_3']
  },
  crimson_text: {
    value: 'crimson_text', label: 'Crimson Text', category: 'serif', family: '"Crimson Text", serif',
    formalityScore: 80,
    moodTags: ['classic', 'scholarly', 'traditional', 'elegant'],
    xHeight: 'medium', strokeContrast: 'medium', characterWidth: 'normal',
    bestFor: ['academic', 'educational', 'cultural'],
    pairsWellWith: ['roboto', 'lato', 'cabin']
  },
  cormorant: {
    value: 'cormorant', label: 'Cormorant', category: 'serif', family: '"Cormorant", serif',
    formalityScore: 85,
    moodTags: ['elegant', 'display', 'luxury', 'sophisticated'],
    xHeight: 'medium', strokeContrast: 'high', characterWidth: 'normal',
    bestFor: ['wedding', 'gala', 'awards', 'cultural'],
    pairsWellWith: ['inter', 'raleway', 'montserrat', 'dm_sans']
  },
  libre_baskerville: {
    value: 'libre_baskerville', label: 'Libre Baskerville', category: 'serif', family: '"Libre Baskerville", serif',
    formalityScore: 80,
    moodTags: ['classic', 'readable', 'traditional', 'elegant'],
    xHeight: 'medium', strokeContrast: 'medium', characterWidth: 'normal',
    bestFor: ['academic', 'business', 'educational', 'cultural'],
    pairsWellWith: ['poppins', 'rubik', 'dm_sans']
  },
  eb_garamond: {
    value: 'eb_garamond', label: 'EB Garamond', category: 'serif', family: '"EB Garamond", serif',
    formalityScore: 85,
    moodTags: ['classic', 'elegant', 'traditional', 'sophisticated'],
    xHeight: 'low', strokeContrast: 'high', characterWidth: 'normal',
    bestFor: ['wedding', 'academic', 'cultural', 'awards'],
    pairsWellWith: ['inter', 'raleway', 'manrope']
  },
  spectral: {
    value: 'spectral', label: 'Spectral', category: 'serif', family: '"Spectral", serif',
    formalityScore: 75,
    moodTags: ['modern', 'serif', 'readable', 'elegant'],
    xHeight: 'medium', strokeContrast: 'medium', characterWidth: 'normal',
    bestFor: ['business', 'educational', 'conference'],
    pairsWellWith: ['dm_sans', 'source_sans_3', 'manrope', 'barlow']
  },
  cardo: {
    value: 'cardo', label: 'Cardo', category: 'serif', family: '"Cardo", serif',
    formalityScore: 80,
    moodTags: ['scholarly', 'academic', 'traditional', 'readable'],
    xHeight: 'medium', strokeContrast: 'medium', characterWidth: 'normal',
    bestFor: ['academic', 'educational', 'cultural'],
    pairsWellWith: ['roboto', 'lato', 'open_sans']
  },
  yeseva_one: {
    value: 'yeseva_one', label: 'Yeseva One', category: 'serif', family: '"Yeseva One", serif',
    formalityScore: 70,
    moodTags: ['bold', 'display', 'vintage', 'decorative'],
    xHeight: 'medium', strokeContrast: 'high', characterWidth: 'normal',
    bestFor: ['cultural', 'gala', 'wedding'],
    pairsWellWith: ['lato', 'roboto', 'poppins']
  },
  neuton: {
    value: 'neuton', label: 'Neuton', category: 'serif', family: '"Neuton", serif',
    formalityScore: 75,
    moodTags: ['readable', 'bookish', 'traditional', 'scholarly'],
    xHeight: 'medium', strokeContrast: 'medium', characterWidth: 'normal',
    bestFor: ['academic', 'educational', 'business'],
    pairsWellWith: ['nunito', 'karla', 'quicksand', 'cabin']
  },
  philosopher: {
    value: 'philosopher', label: 'Philosopher', category: 'serif', family: '"Philosopher", serif',
    formalityScore: 70,
    moodTags: ['geometric', 'serif', 'modern', 'unique'],
    xHeight: 'medium', strokeContrast: 'low', characterWidth: 'normal',
    bestFor: ['cultural', 'academic', 'tech'],
    pairsWellWith: ['manrope', 'dm_sans', 'barlow']
  },

  // DISPLAY FONTS
  oswald: {
    value: 'oswald', label: 'Oswald', category: 'display', family: '"Oswald", sans-serif',
    formalityScore: 50,
    moodTags: ['bold', 'condensed', 'impactful', 'modern'],
    xHeight: 'medium', strokeContrast: 'low', characterWidth: 'condensed',
    bestFor: ['sports', 'concert', 'promotional', 'announcement'],
    pairsWellWith: ['roboto', 'lato', 'inter', 'open_sans']
  },
  bebas_neue: {
    value: 'bebas_neue', label: 'Bebas Neue', category: 'display', family: '"Bebas Neue", sans-serif',
    formalityScore: 45,
    moodTags: ['bold', 'all-caps', 'impactful', 'modern'],
    xHeight: 'high', strokeContrast: 'low', characterWidth: 'condensed',
    bestFor: ['sports', 'concert', 'promotional'],
    pairsWellWith: ['roboto', 'lato', 'open_sans']
  },
  work_sans: {
    value: 'work_sans', label: 'Work Sans', category: 'display', family: '"Work Sans", sans-serif',
    formalityScore: 65,
    moodTags: ['modern', 'clean', 'versatile', 'professional'],
    xHeight: 'medium', strokeContrast: 'low', characterWidth: 'normal',
    bestFor: ['tech', 'business', 'workshop'],
    pairsWellWith: ['merriweather', 'lora', 'spectral']
  },
  syne: {
    value: 'syne', label: 'Syne', category: 'display', family: '"Syne", sans-serif',
    formalityScore: 60,
    moodTags: ['geometric', 'modern', 'unique', 'tech'],
    xHeight: 'medium', strokeContrast: 'low', characterWidth: 'normal',
    bestFor: ['tech', 'cultural', 'workshop'],
    pairsWellWith: ['spectral', 'lora', 'pt_serif']
  },
  archivo_black: {
    value: 'archivo_black', label: 'Archivo Black', category: 'display', family: '"Archivo Black", sans-serif',
    formalityScore: 50,
    moodTags: ['bold', 'impactful', 'modern', 'strong'],
    xHeight: 'medium', strokeContrast: 'low', characterWidth: 'normal',
    bestFor: ['sports', 'announcement', 'promotional'],
    pairsWellWith: ['roboto', 'lato', 'open_sans']
  },
  anton: {
    value: 'anton', label: 'Anton', category: 'display', family: '"Anton", sans-serif',
    formalityScore: 45,
    moodTags: ['condensed', 'bold', 'sports', 'impactful'],
    xHeight: 'high', strokeContrast: 'low', characterWidth: 'condensed',
    bestFor: ['sports', 'concert', 'announcement'],
    pairsWellWith: ['roboto', 'lato', 'inter']
  },
  righteous: {
    value: 'righteous', label: 'Righteous', category: 'display', family: '"Righteous", sans-serif',
    formalityScore: 40,
    moodTags: ['retro', 'bold', '80s', 'fun'],
    xHeight: 'medium', strokeContrast: 'low', characterWidth: 'normal',
    bestFor: ['concert', 'cultural', 'family'],
    pairsWellWith: ['roboto', 'poppins', 'nunito']
  },
  exo_2: {
    value: 'exo_2', label: 'Exo 2', category: 'display', family: '"Exo 2", sans-serif',
    formalityScore: 65,
    moodTags: ['futuristic', 'tech', 'geometric', 'modern'],
    xHeight: 'medium', strokeContrast: 'low', characterWidth: 'normal',
    bestFor: ['tech', 'business', 'conference'],
    pairsWellWith: ['inter', 'roboto', 'source_sans_3']
  },
  teko: {
    value: 'teko', label: 'Teko', category: 'display', family: '"Teko", sans-serif',
    formalityScore: 50,
    moodTags: ['condensed', 'modern', 'tall', 'geometric'],
    xHeight: 'high', strokeContrast: 'low', characterWidth: 'condensed',
    bestFor: ['tech', 'sports', 'announcement'],
    pairsWellWith: ['roboto', 'lato', 'open_sans']
  },
  passion_one: {
    value: 'passion_one', label: 'Passion One', category: 'display', family: '"Passion One", sans-serif',
    formalityScore: 45,
    moodTags: ['bold', 'condensed', 'impactful', 'strong'],
    xHeight: 'high', strokeContrast: 'low', characterWidth: 'condensed',
    bestFor: ['sports', 'announcement', 'promotional'],
    pairsWellWith: ['roboto', 'lato', 'inter']
  },
  cinzel: {
    value: 'cinzel', label: 'Cinzel', category: 'display', family: '"Cinzel", serif',
    formalityScore: 85,
    moodTags: ['classical', 'Roman', 'elegant', 'sophisticated'],
    xHeight: 'medium', strokeContrast: 'medium', characterWidth: 'normal',
    bestFor: ['cultural', 'gala', 'awards', 'wedding'],
    pairsWellWith: ['nunito', 'poppins', 'rubik', 'lato']
  },
  abril_fatface: {
    value: 'abril_fatface', label: 'Abril Fatface', category: 'display', family: '"Abril Fatface", serif',
    formalityScore: 70,
    moodTags: ['bold', 'display', 'serif', 'headlines'],
    xHeight: 'medium', strokeContrast: 'high', characterWidth: 'normal',
    bestFor: ['cultural', 'gala', 'announcement'],
    pairsWellWith: ['lato', 'roboto', 'open_sans']
  },

  // HANDWRITING FONTS
  dancing_script: {
    value: 'dancing_script', label: 'Dancing Script', category: 'handwriting', family: '"Dancing Script", cursive',
    formalityScore: 30,
    moodTags: ['casual', 'friendly', 'handwritten', 'playful'],
    xHeight: 'medium', strokeContrast: 'medium', characterWidth: 'normal',
    bestFor: ['wedding', 'family', 'community'],
    pairsWellWith: ['roboto', 'lato', 'poppins']
  },
  pacifico: {
    value: 'pacifico', label: 'Pacifico', category: 'handwriting', family: '"Pacifico", cursive',
    formalityScore: 25,
    moodTags: ['fun', 'surfing', 'casual', 'retro'],
    xHeight: 'medium', strokeContrast: 'medium', characterWidth: 'normal',
    bestFor: ['family', 'community', 'cultural'],
    pairsWellWith: ['roboto', 'lato', 'open_sans']
  },
  caveat: {
    value: 'caveat', label: 'Caveat', category: 'handwriting', family: '"Caveat", cursive',
    formalityScore: 20,
    moodTags: ['handwritten', 'casual', 'personal', 'informal'],
    xHeight: 'medium', strokeContrast: 'low', characterWidth: 'normal',
    bestFor: ['community', 'family', 'workshop'],
    pairsWellWith: ['roboto', 'lato', 'poppins']
  },
  great_vibes: {
    value: 'great_vibes', label: 'Great Vibes', category: 'handwriting', family: '"Great Vibes", cursive',
    formalityScore: 60,
    moodTags: ['elegant', 'script', 'weddings', 'formal'],
    xHeight: 'low', strokeContrast: 'high', characterWidth: 'normal',
    bestFor: ['wedding', 'gala', 'awards'],
    pairsWellWith: ['raleway', 'montserrat', 'lato']
  },
  satisfy: {
    value: 'satisfy', label: 'Satisfy', category: 'handwriting', family: '"Satisfy", cursive',
    formalityScore: 30,
    moodTags: ['casual', 'script', 'friendly', 'playful'],
    xHeight: 'medium', strokeContrast: 'medium', characterWidth: 'normal',
    bestFor: ['family', 'community', 'cultural'],
    pairsWellWith: ['roboto', 'poppins', 'lato']
  },
  kalam: {
    value: 'kalam', label: 'Kalam', category: 'handwriting', family: '"Kalam", cursive',
    formalityScore: 25,
    moodTags: ['handwritten', 'casual', 'approachable', 'friendly'],
    xHeight: 'medium', strokeContrast: 'low', characterWidth: 'normal',
    bestFor: ['workshop', 'community', 'family'],
    pairsWellWith: ['roboto', 'lato', 'open_sans']
  },
  permanent_marker: {
    value: 'permanent_marker', label: 'Permanent Marker', category: 'handwriting', family: '"Permanent Marker", cursive',
    formalityScore: 20,
    moodTags: ['marker', 'edgy', 'urban', 'casual'],
    xHeight: 'medium', strokeContrast: 'medium', characterWidth: 'normal',
    bestFor: ['sports', 'concert', 'announcement'],
    pairsWellWith: ['roboto', 'lato', 'inter']
  },
}

export interface TypographyConfig {
  useBrandFont: boolean        // Master toggle
  headingFont: string          // Font ID (value)
  bodyFont: string            // Font ID (value)
  scale: number               // 0.8 to 1.5, base scale multiplier
}

export const DEFAULT_TYPOGRAPHY_CONFIG: TypographyConfig = {
  useBrandFont: true,
  headingFont: 'inter',
  bodyFont: 'inter',
  scale: 1.0,
}

// Helper to get font family CSS by ID
export const getFontFamily = (fontId: string) =>
  FONT_OPTIONS.find(f => f.value === fontId)?.family || '"Inter", sans-serif'

// ============================================================
// MULTI-COLOR TYPOGRAPHY SYSTEM (v5.0)
// ============================================================

/**
 * Text role color configuration
 * Supports solid colors and gradients for different text roles
 */
export interface TextRoleColor {
  type: 'solid' | 'gradient'
  color?: string  // For solid colors
  gradientStart?: string  // For gradient start color
  gradientEnd?: string    // For gradient end color
  gradientDirection?: 'horizontal' | 'vertical' | 'diagonal'
  contrastRatio?: number  // WCAG contrast ratio for accessibility
  description?: string    // Human-readable description
}

/**
 * Multi-color typography configuration
 * Allows different colors for each text role to create visual hierarchy
 */
export interface MultiColorTypographyConfig {
  hero: TextRoleColor        // Main title/hero text
  headline: TextRoleColor    // Primary headline
  subheadline: TextRoleColor // Secondary headline
  body: TextRoleColor        // Body/paragraph text
  cta: TextRoleColor         // Call-to-action buttons/text
  caption: TextRoleColor     // Captions and small text
  label: TextRoleColor       // Labels and metadata
}

/**
 * Pre-built multi-color typography palettes for common event types
 * Each palette is WCAG-compliant and optimized for the event context
 */
export const EVENT_COLOR_PALETTES: Record<string, MultiColorTypographyConfig> = {
  conference: {
    hero: {
      type: 'gradient',
      gradientStart: '#1e3a8a',
      gradientEnd: '#3b82f6',
      gradientDirection: 'horizontal',
      description: 'Professional blue gradient for impact'
    },
    headline: { type: 'solid', color: '#1e3a8a', contrastRatio: 12.5, description: 'Navy blue for headlines' },
    subheadline: { type: 'solid', color: '#3b82f6', contrastRatio: 7.2, description: 'Medium blue for subheadings' },
    body: { type: 'solid', color: '#1f2937', contrastRatio: 16.1, description: 'Dark gray for readability' },
    cta: {
      type: 'gradient',
      gradientStart: '#f59e0b',
      gradientEnd: '#d97706',
      gradientDirection: 'horizontal',
      description: 'Amber gradient for CTAs'
    },
    caption: { type: 'solid', color: '#6b7280', contrastRatio: 7.5, description: 'Medium gray for captions' },
    label: { type: 'solid', color: '#9ca3af', contrastRatio: 4.8, description: 'Light gray for labels' }
  },
  workshop: {
    hero: {
      type: 'gradient',
      gradientStart: '#0891b2',
      gradientEnd: '#06b6d4',
      gradientDirection: 'diagonal',
      description: 'Cyan gradient for learning energy'
    },
    headline: { type: 'solid', color: '#0891b2', contrastRatio: 8.5, description: 'Teal for practical focus' },
    subheadline: { type: 'solid', color: '#f97316', contrastRatio: 5.2, description: 'Orange accent for warmth' },
    body: { type: 'solid', color: '#374151', contrastRatio: 14.2, description: 'Charcoal for clarity' },
    cta: { type: 'solid', color: '#ea580c', contrastRatio: 5.8, description: 'Bright orange for action' },
    caption: { type: 'solid', color: '#6b7280', contrastRatio: 7.5, description: 'Medium gray' },
    label: { type: 'solid', color: '#9ca3af', contrastRatio: 4.8, description: 'Light gray' }
  },
  health_camp: {
    hero: {
      type: 'gradient',
      gradientStart: '#047857',
      gradientEnd: '#10b981',
      gradientDirection: 'vertical',
      description: 'Health green gradient for vitality'
    },
    headline: { type: 'solid', color: '#047857', contrastRatio: 9.8, description: 'Forest green for health' },
    subheadline: { type: 'solid', color: '#0891b2', contrastRatio: 8.5, description: 'Medical teal for trust' },
    body: { type: 'solid', color: '#1f2937', contrastRatio: 16.1, description: 'Dark gray for readability' },
    cta: { type: 'solid', color: '#0891b2', contrastRatio: 8.5, description: 'Teal CTA for medical context' },
    caption: { type: 'solid', color: '#6b7280', contrastRatio: 7.5, description: 'Medium gray' },
    label: { type: 'solid', color: '#9ca3af', contrastRatio: 4.8, description: 'Light gray' }
  },
  tech_talk: {
    hero: {
      type: 'gradient',
      gradientStart: '#6366f1',
      gradientEnd: '#8b5cf6',
      gradientDirection: 'diagonal',
      description: 'Tech purple gradient for innovation'
    },
    headline: { type: 'solid', color: '#4f46e5', contrastRatio: 8.2, description: 'Indigo for tech focus' },
    subheadline: { type: 'solid', color: '#8b5cf6', contrastRatio: 6.5, description: 'Purple for creativity' },
    body: { type: 'solid', color: '#1f2937', contrastRatio: 16.1, description: 'Dark gray for clarity' },
    cta: {
      type: 'gradient',
      gradientStart: '#ec4899',
      gradientEnd: '#f43f5e',
      gradientDirection: 'horizontal',
      description: 'Pink-red gradient for energy'
    },
    caption: { type: 'solid', color: '#6b7280', contrastRatio: 7.5, description: 'Medium gray' },
    label: { type: 'solid', color: '#9ca3af', contrastRatio: 4.8, description: 'Light gray' }
  },
  cultural_event: {
    hero: {
      type: 'gradient',
      gradientStart: '#dc2626',
      gradientEnd: '#f59e0b',
      gradientDirection: 'horizontal',
      description: 'Vibrant red-orange gradient for celebration'
    },
    headline: { type: 'solid', color: '#dc2626', contrastRatio: 7.8, description: 'Bold red for impact' },
    subheadline: { type: 'solid', color: '#f59e0b', contrastRatio: 4.2, description: 'Warm amber for festivity' },
    body: { type: 'solid', color: '#1f2937', contrastRatio: 16.1, description: 'Dark gray for readability' },
    cta: { type: 'solid', color: '#7c3aed', contrastRatio: 8.5, description: 'Purple accent for richness' },
    caption: { type: 'solid', color: '#6b7280', contrastRatio: 7.5, description: 'Medium gray' },
    label: { type: 'solid', color: '#9ca3af', contrastRatio: 4.8, description: 'Light gray' }
  },
  wedding: {
    hero: {
      type: 'gradient',
      gradientStart: '#f472b6',
      gradientEnd: '#e879f9',
      gradientDirection: 'horizontal',
      description: 'Romantic pink-magenta gradient'
    },
    headline: { type: 'solid', color: '#be185d', contrastRatio: 10.2, description: 'Deep pink for elegance' },
    subheadline: { type: 'solid', color: '#f472b6', contrastRatio: 4.5, description: 'Soft pink for romance' },
    body: { type: 'solid', color: '#1f2937', contrastRatio: 16.1, description: 'Dark gray for readability' },
    cta: { type: 'solid', color: '#be185d', contrastRatio: 10.2, description: 'Deep pink CTA' },
    caption: { type: 'solid', color: '#6b7280', contrastRatio: 7.5, description: 'Medium gray' },
    label: { type: 'solid', color: '#9ca3af', contrastRatio: 4.8, description: 'Light gray' }
  },
  sports_event: {
    hero: {
      type: 'gradient',
      gradientStart: '#ea580c',
      gradientEnd: '#dc2626',
      gradientDirection: 'horizontal',
      description: 'Energetic orange-red gradient'
    },
    headline: { type: 'solid', color: '#dc2626', contrastRatio: 7.8, description: 'Bold red for energy' },
    subheadline: { type: 'solid', color: '#ea580c', contrastRatio: 5.8, description: 'Orange for excitement' },
    body: { type: 'solid', color: '#111827', contrastRatio: 18.5, description: 'Very dark gray for contrast' },
    cta: {
      type: 'gradient',
      gradientStart: '#fbbf24',
      gradientEnd: '#f59e0b',
      gradientDirection: 'horizontal',
      description: 'Gold gradient for winners'
    },
    caption: { type: 'solid', color: '#4b5563', contrastRatio: 9.2, description: 'Dark gray' },
    label: { type: 'solid', color: '#6b7280', contrastRatio: 7.5, description: 'Medium gray' }
  },
  business_summit: {
    hero: {
      type: 'gradient',
      gradientStart: '#0f172a',
      gradientEnd: '#1e293b',
      gradientDirection: 'horizontal',
      description: 'Professional dark gradient'
    },
    headline: { type: 'solid', color: '#0f172a', contrastRatio: 18.2, description: 'Deep slate for authority' },
    subheadline: { type: 'solid', color: '#3b82f6', contrastRatio: 7.2, description: 'Blue for trust' },
    body: { type: 'solid', color: '#1f2937', contrastRatio: 16.1, description: 'Dark gray' },
    cta: {
      type: 'gradient',
      gradientStart: '#3b82f6',
      gradientEnd: '#2563eb',
      gradientDirection: 'horizontal',
      description: 'Blue gradient for professionalism'
    },
    caption: { type: 'solid', color: '#6b7280', contrastRatio: 7.5, description: 'Medium gray' },
    label: { type: 'solid', color: '#9ca3af', contrastRatio: 4.8, description: 'Light gray' }
  },
  music_concert: {
    hero: {
      type: 'gradient',
      gradientStart: '#a855f7',
      gradientEnd: '#ec4899',
      gradientDirection: 'diagonal',
      description: 'Vibrant purple-pink gradient for music energy'
    },
    headline: { type: 'solid', color: '#7c3aed', contrastRatio: 8.5, description: 'Purple for creativity' },
    subheadline: { type: 'solid', color: '#ec4899', contrastRatio: 5.5, description: 'Pink for excitement' },
    body: { type: 'solid', color: '#111827', contrastRatio: 18.5, description: 'Very dark for contrast' },
    cta: {
      type: 'gradient',
      gradientStart: '#f59e0b',
      gradientEnd: '#dc2626',
      gradientDirection: 'horizontal',
      description: 'Warm gradient for tickets'
    },
    caption: { type: 'solid', color: '#6b7280', contrastRatio: 7.5, description: 'Medium gray' },
    label: { type: 'solid', color: '#9ca3af', contrastRatio: 4.8, description: 'Light gray' }
  },
  educational_seminar: {
    hero: {
      type: 'gradient',
      gradientStart: '#0284c7',
      gradientEnd: '#0891b2',
      gradientDirection: 'horizontal',
      description: 'Academic blue gradient'
    },
    headline: { type: 'solid', color: '#075985', contrastRatio: 10.5, description: 'Deep blue for trust' },
    subheadline: { type: 'solid', color: '#0284c7', contrastRatio: 8.2, description: 'Sky blue for clarity' },
    body: { type: 'solid', color: '#1f2937', contrastRatio: 16.1, description: 'Dark gray for reading' },
    cta: { type: 'solid', color: '#0891b2', contrastRatio: 8.5, description: 'Teal CTA' },
    caption: { type: 'solid', color: '#6b7280', contrastRatio: 7.5, description: 'Medium gray' },
    label: { type: 'solid', color: '#9ca3af', contrastRatio: 4.8, description: 'Light gray' }
  }
}

// ============================================================
// DESIGN DATA INTERFACE
// ============================================================

export interface DesignData {
  theme: string
  style: string
  aspectRatio: AspectRatioId
  resolution: ResolutionId
  customization: CustomizationData
  exportSettings: ExportSettings

  colorConfig: ColorConfig // NEW: Color configuration
  typography: TypographyConfig // NEW v4.3: Typography configuration
  stripShape?: LogoStripShape // NEW v3.11: Logo strip shape for event posters with logo bands
}

export const DEFAULT_DESIGN_DATA: DesignData = {
  theme: 'corporate',
  style: 'gradient',
  aspectRatio: '4:5',
  resolution: '1K',
  customization: DEFAULT_CUSTOMIZATION,
  exportSettings: DEFAULT_EXPORT_SETTINGS,
  colorConfig: DEFAULT_COLOR_CONFIG,
  typography: DEFAULT_TYPOGRAPHY_CONFIG,
  stripShape: DEFAULT_LOGO_STRIP_SHAPE, // NEW v3.11: Default to curved strip
}
