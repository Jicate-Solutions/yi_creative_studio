// Yi Brand Colors (Official)
export const BRAND_COLORS = {
  primary: '#005B96',      // Yi Blue
  secondary: '#FF6B35',    // Yi Orange
  accent: '#00A86B',       // Success Green
  background: '#FFFFFF',
  foreground: '#1A1A1A',
  muted: '#F5F5F5',
  mutedForeground: '#6B7280',
  destructive: '#EF4444',
  border: '#E5E7EB',
} as const

// Logo Position Grid (18 positions - 6 columns × 3 rows)
export const LOGO_POSITIONS = [
  // Header strip (Row 1)
  'top-1', 'top-2', 'top-3', 'top-4', 'top-5', 'top-6',
  // Second strip (Row 2)
  'mid-1', 'mid-2', 'mid-3', 'mid-4', 'mid-5', 'mid-6',
  // Footer strip (Row 3)
  'bottom-1', 'bottom-2', 'bottom-3', 'bottom-4', 'bottom-5', 'bottom-6',
] as const

export type LogoPosition = typeof LOGO_POSITIONS[number]

// Backward compatibility mapping (old 3x3 positions → new 6x3 positions)
export const LEGACY_POSITION_MAP: Record<string, LogoPosition> = {
  'top-left': 'top-1',
  'top-center': 'top-3',
  'top-right': 'top-6',
  'mid-left': 'mid-1',
  'center': 'mid-3',
  'mid-right': 'mid-6',
  'bottom-left': 'bottom-1',
  'bottom-center': 'bottom-3',
  'bottom-right': 'bottom-6',
}

// Helper to migrate legacy positions
export function migrateLogoPosition(position: string): LogoPosition {
  if (LOGO_POSITIONS.includes(position as LogoPosition)) {
    return position as LogoPosition
  }
  return LEGACY_POSITION_MAP[position] || 'top-1'
}

// Creative Types
export const CREATIVE_TYPES = {
  event_poster: { label: 'Event Poster', icon: 'Calendar' },
  social_post: { label: 'Social Post', icon: 'Share2' },
  banner: { label: 'Banner', icon: 'Image' },
  announcement: { label: 'Announcement', icon: 'Megaphone' },
} as const

export type CreativeType = keyof typeof CREATIVE_TYPES

// Organization Types
export const ORGANIZATION_TYPES = {
  yi_chapter: { label: 'Yi Chapter', description: 'Official Young Indians chapter' },
  educational: { label: 'Educational', description: 'Educational institution' },
  corporate: { label: 'Corporate', description: 'Corporate organization' },
  ngo: { label: 'NGO', description: 'Non-governmental organization' },
} as const

export type OrganizationType = keyof typeof ORGANIZATION_TYPES

// User Roles
export const USER_ROLES = {
  super_admin: { label: 'Super Admin', permissions: ['platform'] },
  admin: { label: 'Admin', permissions: ['read', 'write', 'delete', 'manage'] },
  editor: { label: 'Editor', permissions: ['read', 'write'] },
  viewer: { label: 'Viewer', permissions: ['read'] },
} as const

export type UserRole = keyof typeof USER_ROLES

// Logo Categories
export const LOGO_CATEGORIES = {
  primary: { label: 'Primary Logo', description: 'Main organization logo' },
  secondary: { label: 'Secondary Logo', description: 'Alternative logo variant' },
  partner: { label: 'Partner Logo', description: 'Partner organization logos' },
  sponsor: { label: 'Sponsor Logo', description: 'Sponsor logos' },
  department: { label: 'Department Logo', description: 'Department-specific logos' },
} as const

export type LogoCategory = keyof typeof LOGO_CATEGORIES

// AI Providers
export const AI_PROVIDERS = {
  google: { label: 'Google Gemini', models: ['gemini-2.0-flash-preview-image-generation'] },
  ideogram: { label: 'Ideogram', models: ['ideogram-v2'] },
} as const

export type AIProvider = keyof typeof AI_PROVIDERS

// Credit Packages
export const CREDIT_PACKAGES = [
  { id: 'starter', name: 'Starter Pack', credits: 100, priceINR: 499, popular: false },
  { id: 'standard', name: 'Standard Pack', credits: 500, priceINR: 1999, popular: true },
  { id: 'premium', name: 'Premium Pack', credits: 1500, priceINR: 4999, popular: false },
  { id: 'enterprise', name: 'Enterprise Pack', credits: 5000, priceINR: 14999, popular: false },
] as const

// Default Brand Config
export const DEFAULT_BRAND_CONFIG = {
  primaryColor: BRAND_COLORS.primary,
  secondaryColor: BRAND_COLORS.secondary,
  accentColor: BRAND_COLORS.accent,
  fontPrimary: 'Inter',
  fontSecondary: 'Poppins',
  headerZoneHeight: 15,
  footerZoneHeight: 10,
  footerText: '',
  footerEmail: '',
  footerWebsite: '',
  footerPhone: '',
  footerAddress: '',
  footerSocial: {
    instagram: '',
    linkedin: '',
    facebook: '',
    twitter: '',
  },
} as const

// Image Dimensions by Creative Type
export const IMAGE_DIMENSIONS = {
  event_poster: { width: 1080, height: 1350 },    // 4:5 Portrait
  social_post: { width: 1080, height: 1080 },     // 1:1 Square
  banner: { width: 1200, height: 628 },            // ~1.91:1 Landscape
  announcement: { width: 1080, height: 1920 },     // 9:16 Story
} as const

// Routes
export const ROUTES = {
  home: '/',
  login: '/auth/login',
  signup: '/auth/signup',
  dashboard: '/dashboard',
  create: '/create',
  gallery: '/gallery',
  templates: '/templates',
  bulk: '/bulk',
  brandConfig: '/settings/brand',
  logoManagement: '/settings/logos',
  team: '/settings/team',
  billing: '/settings/billing',
  analytics: '/settings/analytics',
  analyticsCosts: '/settings/analytics/costs',
  analyticsFeedback: '/settings/analytics/feedback',
  analyticsLearning: '/settings/analytics/learning',
  profile: '/settings/profile',
  adminCredits: '/settings/admin/credits',
  onboarding: '/onboarding',
  join: '/join',
} as const

// API Routes
export const API_ROUTES = {
  generate: '/api/generate',
  logos: '/api/logos',
  credits: '/api/credits',
  webhooks: {
    razorpay: '/api/webhooks/razorpay',
  },
} as const
