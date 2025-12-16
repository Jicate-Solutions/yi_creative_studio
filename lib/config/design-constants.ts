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
  photoUrl?: string
  shape: PhotoShape
  size: number
  position: PhotoPosition
  verticalPosition: PhotoVerticalPosition
  border: {
    width: number
    color: string
  }
  shadow: boolean
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
    shape: 'circle',
    size: 200,
    position: 'center',
    verticalPosition: 'lower',
    border: {
      width: 2,
      color: '#FFFFFF',
    },
    shadow: true,
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
  selectedPalette: null,
  customColors: null,
}

// Helper to get palette by ID
export const getColorPaletteById = (id: string) =>
  COLOR_PALETTES[id as ColorPaletteId] || null

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
}

export const DEFAULT_DESIGN_DATA: DesignData = {
  theme: 'corporate',
  style: 'gradient',
  aspectRatio: '4:5',
  resolution: '1K',
  customization: DEFAULT_CUSTOMIZATION,
  exportSettings: DEFAULT_EXPORT_SETTINGS,
  colorConfig: DEFAULT_COLOR_CONFIG,
}
