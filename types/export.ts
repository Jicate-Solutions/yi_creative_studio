/**
 * Export Types - CMYK/RGB Export System
 * YiCreatives Studio
 *
 * Provides types for exporting creatives with color mode conversion.
 */

// ============================================================
// COLOR MODES
// ============================================================

/**
 * Available color modes for export
 * - rgb: Standard sRGB for web/screen display
 * - cmyk-fogra39: FOGRA39 profile for Europe/India printing
 * - cmyk-swop: SWOP profile for US printing
 * - cmyk-japan: Japan Color profile for Japan printing
 */
export type ColorMode = 'rgb' | 'cmyk-fogra39' | 'cmyk-swop' | 'cmyk-japan';

/**
 * CMYK ICC profile types
 */
export type CMYKProfile = 'fogra39' | 'swop' | 'japan';

/**
 * Color mode display information
 */
export interface ColorModeInfo {
  id: ColorMode;
  name: string;
  description: string;
  iccProfile: string | null;
  bestFor: string;
}

/**
 * All available color modes with metadata
 */
export const COLOR_MODES: ColorModeInfo[] = [
  {
    id: 'rgb',
    name: 'Screen Colors',
    description: 'Best for phones & computers',
    iccProfile: 'sRGB.icc',
    bestFor: 'Web, social media, digital displays',
  },
  {
    id: 'cmyk-fogra39',
    name: 'Print (Europe/India)',
    description: 'For printing in Europe or India',
    iccProfile: 'FOGRA39.icc',
    bestFor: 'Professional printing in Europe, India',
  },
  {
    id: 'cmyk-swop',
    name: 'Print (USA/Canada)',
    description: 'For printing in North America',
    iccProfile: 'SWOP.icc',
    bestFor: 'Professional printing in North America',
  },
  {
    id: 'cmyk-japan',
    name: 'Print (Japan/Asia)',
    description: 'For printing in Japan or Asia',
    iccProfile: 'JapanColor.icc',
    bestFor: 'Professional printing in Japan, Asia',
  },
];

// ============================================================
// EXPORT FORMATS
// ============================================================

/**
 * Available export file formats
 */
export type ExportFormat = 'png' | 'jpg' | 'pdf' | 'tiff';

/**
 * Export format display information
 */
export interface ExportFormatInfo {
  id: ExportFormat;
  name: string;
  extension: string;
  mimeType: string;
  supportsCMYK: boolean;
  supportsTransparency: boolean;
  description: string;
}

/**
 * All available export formats with metadata
 */
export const EXPORT_FORMATS: ExportFormatInfo[] = [
  {
    id: 'png',
    name: 'PNG',
    extension: '.png',
    mimeType: 'image/png',
    supportsCMYK: false,
    supportsTransparency: true,
    description: 'Sharp & clear images',
  },
  {
    id: 'jpg',
    name: 'JPEG',
    extension: '.jpg',
    mimeType: 'image/jpeg',
    supportsCMYK: true,
    supportsTransparency: false,
    description: 'Smaller file size',
  },
  {
    id: 'pdf',
    name: 'PDF',
    extension: '.pdf',
    mimeType: 'application/pdf',
    supportsCMYK: true,
    supportsTransparency: true,
    description: 'Ready for printing',
  },
  {
    id: 'tiff',
    name: 'TIFF',
    extension: '.tiff',
    mimeType: 'image/tiff',
    supportsCMYK: true,
    supportsTransparency: true,
    description: 'Best quality for print',
  },
];

// ============================================================
// RESOLUTION
// ============================================================

/**
 * Available resolution options (DPI)
 */
export type ExportResolution = 72 | 150 | 300 | 600;

/**
 * Resolution display information
 */
export interface ResolutionInfo {
  dpi: ExportResolution;
  name: string;
  description: string;
  bestFor: string;
}

/**
 * All available resolutions with metadata
 */
export const EXPORT_RESOLUTIONS: ResolutionInfo[] = [
  {
    dpi: 72,
    name: '72',
    description: 'Web & social',
    bestFor: 'Web, social media',
  },
  {
    dpi: 150,
    name: '150',
    description: 'Quick print',
    bestFor: 'Office printing, drafts',
  },
  {
    dpi: 300,
    name: '300',
    description: 'Sharp print',
    bestFor: 'Professional printing',
  },
  {
    dpi: 600,
    name: '600',
    description: 'Posters & banners',
    bestFor: 'Large format, high detail',
  },
];

// ============================================================
// EXPORT PURPOSE (User-Centric Presets)
// ============================================================

/**
 * Export purposes for user-friendly selection
 * - social: Optimized for social media (Instagram, Facebook, WhatsApp)
 * - print: Professional print-ready (CMYK, high DPI)
 * - quick: Quick download with balanced quality
 * - custom: Full manual control (Pro mode)
 */
export type ExportPurpose = 'social' | 'print' | 'quick' | 'custom';

/**
 * Export options for a specific purpose
 */
export interface ExportPurposeOptions {
  format: ExportFormat;
  resolution: ExportResolution;
  colorMode: ColorMode;
  quality: number;
}

/**
 * Purpose display information
 */
export interface ExportPurposeInfo {
  id: ExportPurpose;
  name: string;
  description: string;
  icon: string;
  options: ExportPurposeOptions;
  estimatedSizeLabel: string;
}

/**
 * All available export purposes with presets
 */
export const EXPORT_PURPOSES: ExportPurposeInfo[] = [
  {
    id: 'social',
    name: 'Social Media',
    description: 'Instagram, Facebook, WhatsApp',
    icon: 'smartphone',
    options: {
      format: 'jpg',
      resolution: 72,
      colorMode: 'rgb',
      quality: 85,
    },
    estimatedSizeLabel: '~2 MB',
  },
  {
    id: 'print',
    name: 'Print Ready',
    description: 'Professional printing',
    icon: 'printer',
    options: {
      format: 'pdf',
      resolution: 300,
      colorMode: 'cmyk-fogra39',
      quality: 100,
    },
    estimatedSizeLabel: '~15 MB',
  },
  {
    id: 'quick',
    name: 'Quick Download',
    description: 'Best for most uses',
    icon: 'zap',
    options: {
      format: 'png',
      resolution: 150,
      colorMode: 'rgb',
      quality: 100,
    },
    estimatedSizeLabel: '~5 MB',
  },
  {
    id: 'custom',
    name: 'Custom Settings',
    description: 'Full control',
    icon: 'settings',
    options: {
      format: 'png',
      resolution: 300,
      colorMode: 'rgb',
      quality: 100,
    },
    estimatedSizeLabel: 'Varies',
  },
];

/**
 * Get purpose info by ID
 */
export function getPurposeInfo(purpose: ExportPurpose): ExportPurposeInfo | undefined {
  return EXPORT_PURPOSES.find((p) => p.id === purpose);
}

/**
 * Get default options for a purpose
 */
export function getPurposeOptions(purpose: ExportPurpose): ExportPurposeOptions {
  const purposeInfo = getPurposeInfo(purpose);
  return purposeInfo?.options ?? EXPORT_PURPOSES[2].options; // Default to quick
}

// ============================================================
// EXPORT MODE (Simple vs Pro)
// ============================================================

/**
 * Export mode for UI
 * - simple: Purpose-based selection (default for regular users)
 * - pro: Full control with all options (for designers)
 */
export type ExportMode = 'simple' | 'pro';

// ============================================================
// EXPORT REQUEST/RESPONSE
// ============================================================

/**
 * Export request parameters
 */
export interface ExportParams {
  creativeId: string;
  format: ExportFormat;
  colorMode: ColorMode;
  resolution: ExportResolution;
  quality?: number; // 1-100 for JPEG
  embedProfile?: boolean; // Whether to embed ICC profile
}

/**
 * Export request for API
 */
export interface ExportRequest {
  creativeId: string;
  format: ExportFormat;
  colorMode: ColorMode;
  resolution: ExportResolution;
  quality?: number;
}

/**
 * Export response from API
 */
export interface ExportResponse {
  success: boolean;
  downloadUrl?: string;
  fileName?: string;
  fileSize?: number;
  colorMode: ColorMode;
  format: ExportFormat;
  resolution: ExportResolution;
  error?: string;
}

/**
 * Export job status (for async exports)
 */
export type ExportStatus = 'pending' | 'processing' | 'complete' | 'error';

/**
 * Export job tracking
 */
export interface ExportJob {
  id: string;
  creativeId: string;
  status: ExportStatus;
  params: ExportParams;
  progress: number; // 0-100
  downloadUrl?: string;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

// ============================================================
// EXPORT HISTORY
// ============================================================

/**
 * Export history entry (stored in creative.export_history)
 */
export interface ExportHistoryEntry {
  id: string;
  exportedAt: string;
  format: ExportFormat;
  colorMode: ColorMode;
  resolution: ExportResolution;
  fileSize: number;
  downloadedBy: string;
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Check if a format supports CMYK export
 */
export function formatSupportsCMYK(format: ExportFormat): boolean {
  const formatInfo = EXPORT_FORMATS.find((f) => f.id === format);
  return formatInfo?.supportsCMYK ?? false;
}

/**
 * Check if a color mode is CMYK
 */
export function isCMYKMode(colorMode: ColorMode): boolean {
  return colorMode.startsWith('cmyk-');
}

/**
 * Get ICC profile filename for a color mode
 */
export function getICCProfileForMode(colorMode: ColorMode): string | null {
  const modeInfo = COLOR_MODES.find((m) => m.id === colorMode);
  return modeInfo?.iccProfile ?? null;
}

/**
 * Get CMYK profile name from color mode
 */
export function getCMYKProfile(colorMode: ColorMode): CMYKProfile | null {
  if (!isCMYKMode(colorMode)) return null;
  const profile = colorMode.replace('cmyk-', '') as CMYKProfile;
  return profile;
}

/**
 * Generate export filename
 */
export function generateExportFilename(
  creativeName: string,
  format: ExportFormat,
  colorMode: ColorMode,
  resolution: ExportResolution
): string {
  const timestamp = new Date().toISOString().slice(0, 10);
  const colorSuffix = isCMYKMode(colorMode) ? '_CMYK' : '_RGB';
  const formatInfo = EXPORT_FORMATS.find((f) => f.id === format);
  const extension = formatInfo?.extension ?? '.png';

  // Sanitize creative name
  const safeName = creativeName
    .replace(/[^a-zA-Z0-9]/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 50);

  return `${safeName}${colorSuffix}_${resolution}dpi_${timestamp}${extension}`;
}

/**
 * Validate export parameters
 */
export function validateExportParams(params: ExportParams): string | null {
  // Check if CMYK is requested with unsupported format
  if (isCMYKMode(params.colorMode) && !formatSupportsCMYK(params.format)) {
    return `${params.format.toUpperCase()} format does not support CMYK. Please use JPEG, PDF, or TIFF.`;
  }

  // Validate quality for JPEG
  if (params.format === 'jpg' && params.quality) {
    if (params.quality < 1 || params.quality > 100) {
      return 'JPEG quality must be between 1 and 100';
    }
  }

  return null;
}

/**
 * Estimate file size based on export parameters
 * @returns estimated size in bytes
 */
export function estimateFileSize(
  originalWidth: number,
  originalHeight: number,
  params: Pick<ExportParams, 'format' | 'resolution' | 'quality' | 'colorMode'>
): number {
  // Base calculation: pixels * bytes per pixel
  const scaleFactor = params.resolution / 72;
  const pixels = originalWidth * originalHeight * scaleFactor * scaleFactor;

  // Format-specific multipliers (accounting for compression)
  const formatMultipliers: Record<ExportFormat, number> = {
    png: 2, // 4 bytes per pixel (RGBA), compressed ~50%
    jpg: 0.3, // Heavily compressed, quality dependent
    tiff: 3.5, // LZW compression
    pdf: 2.5, // Similar to PNG with metadata
  };

  let estimate = pixels * formatMultipliers[params.format];

  // JPEG quality adjustment (higher quality = larger file)
  if (params.format === 'jpg' && params.quality) {
    estimate *= (params.quality / 100) * 1.5;
  }

  // CMYK adds ~25% for additional color channel
  if (isCMYKMode(params.colorMode)) {
    estimate *= 1.25;
  }

  // Minimum file size of 100KB
  return Math.max(Math.round(estimate), 100 * 1024);
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
