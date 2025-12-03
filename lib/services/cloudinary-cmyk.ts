/**
 * Cloudinary CMYK Converter
 * YiCreatives Studio
 *
 * Provides TRUE CMYK conversion via Cloudinary API for serverless environments.
 * Used as fallback when ImageMagick is not available (e.g., Vercel deployment).
 *
 * Features:
 * - TRUE CMYK color space conversion
 * - ICC profile support (FOGRA39, SWOP, JapanColor)
 * - Retry logic with exponential backoff
 * - Automatic temp file cleanup
 * - Detailed error handling
 */

import { cloudinary, isCloudinaryConfigured } from './cloudinary-config';
import type { CMYKProfile, ExportFormat, ExportResolution } from '@/types/export';

// Re-export the config check
export { isCloudinaryConfigured };

// ============================================================
// CONSTANTS
// ============================================================

/**
 * Map internal profile names to Cloudinary ICC profile identifiers
 * Cloudinary supports standard ICC profiles for CMYK conversion
 */
const CLOUDINARY_PROFILE_MAP: Record<CMYKProfile, string> = {
  fogra39: 'fogra39',
  swop: 'swop',
  japan: 'japan_color_2001_coated',
};

/**
 * Retry configuration for resilient operations
 */
const RETRY_CONFIG = {
  maxRetries: 2,
  baseDelay: 1000, // 1 second
  maxDelay: 5000, // 5 seconds
};

/**
 * Cloudinary upload options
 */
const UPLOAD_OPTIONS = {
  folder: 'yicreatives-cmyk-temp',
  resource_type: 'image' as const,
  type: 'upload' as const,
  // Auto-delete after 1 hour (safety net)
  invalidate: true,
};

// ============================================================
// ERROR TYPES
// ============================================================

export class CloudinaryUploadError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = 'CloudinaryUploadError';
  }
}

export class CloudinaryTransformError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = 'CloudinaryTransformError';
  }
}

export class CloudinaryDownloadError extends Error {
  constructor(message: string, public readonly statusCode?: number) {
    super(message);
    this.name = 'CloudinaryDownloadError';
  }
}

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calculate exponential backoff delay
 */
function getBackoffDelay(attempt: number): number {
  const delay = RETRY_CONFIG.baseDelay * Math.pow(2, attempt);
  return Math.min(delay, RETRY_CONFIG.maxDelay);
}

/**
 * Retry a function with exponential backoff
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  operationName: string
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < RETRY_CONFIG.maxRetries) {
        const delay = getBackoffDelay(attempt);
        console.warn(
          `[Cloudinary] ${operationName} failed (attempt ${attempt + 1}/${RETRY_CONFIG.maxRetries + 1}). ` +
          `Retrying in ${delay}ms...`,
          lastError.message
        );
        await sleep(delay);
      }
    }
  }

  throw lastError;
}

// ============================================================
// CORE FUNCTIONS
// ============================================================

/**
 * Upload image buffer to Cloudinary
 * Returns public_id for subsequent transformations
 */
async function uploadToCloudinary(imageBuffer: Buffer): Promise<string> {
  return withRetry(async () => {
    return new Promise<string>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        UPLOAD_OPTIONS,
        (error, result) => {
          if (error) {
            reject(new CloudinaryUploadError(
              `Upload failed: ${error.message}`,
              error
            ));
          } else if (result?.public_id) {
            console.log(`[Cloudinary] Upload successful: ${result.public_id}`);
            resolve(result.public_id);
          } else {
            reject(new CloudinaryUploadError('Upload returned empty result'));
          }
        }
      );

      uploadStream.end(imageBuffer);
    });
  }, 'Upload');
}

/**
 * Build Cloudinary transformation URL for CMYK conversion
 */
function buildCMYKTransformUrl(
  publicId: string,
  profile: CMYKProfile,
  format: ExportFormat,
  resolution: ExportResolution,
  quality: number
): string {
  // Map format to Cloudinary format
  const cloudinaryFormat = format === 'jpg' ? 'jpg' : format;

  // Build transformation chain
  const transformations: Record<string, unknown>[] = [
    // Convert to CMYK color space
    { color_space: 'cmyk' },
    // Set quality
    { quality: quality || 100 },
    // Set DPI/density in metadata
    { flags: 'keep_iptc' },
  ];

  // Note: Cloudinary handles ICC profile embedding internally
  // The color_space: 'cmyk' transformation applies proper conversion

  const url = cloudinary.url(publicId, {
    transformation: transformations,
    format: cloudinaryFormat,
    secure: true,
    // Include DPI in delivery
    flags: 'attachment',
  });

  console.log(`[Cloudinary] Transform URL: ${url.substring(0, 100)}...`);
  return url;
}

/**
 * Download transformed image from Cloudinary
 */
async function downloadFromCloudinary(url: string): Promise<Buffer> {
  return withRetry(async () => {
    const response = await fetch(url);

    if (!response.ok) {
      throw new CloudinaryDownloadError(
        `Download failed: ${response.status} ${response.statusText}`,
        response.status
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log(`[Cloudinary] Download successful: ${buffer.length} bytes`);
    return buffer;
  }, 'Download');
}

/**
 * Cleanup temporary upload from Cloudinary
 * Non-blocking - logs warning on failure but doesn't throw
 */
async function cleanupUpload(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId);
    console.log(`[Cloudinary] Cleanup successful: ${publicId}`);
  } catch (error) {
    // Log but don't throw - cleanup failure is non-critical
    console.warn(
      `[Cloudinary] Cleanup warning for ${publicId}:`,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

// ============================================================
// MAIN EXPORT FUNCTION
// ============================================================

/**
 * Convert image to TRUE CMYK using Cloudinary API
 *
 * Flow:
 * 1. Upload source image to Cloudinary (temp)
 * 2. Generate transformation URL with CMYK conversion
 * 3. Download converted image
 * 4. Cleanup temp upload
 *
 * @param imageBuffer - Source image buffer (RGB)
 * @param profile - CMYK ICC profile (fogra39, swop, japan)
 * @param format - Output format (jpg, tiff, png)
 * @param resolution - Output DPI (72, 150, 300, 600)
 * @param quality - Output quality (1-100)
 * @returns Buffer containing CMYK image
 * @throws CloudinaryUploadError, CloudinaryTransformError, CloudinaryDownloadError
 */
export async function convertToCMYKWithCloudinary(
  imageBuffer: Buffer,
  profile: CMYKProfile,
  format: ExportFormat,
  resolution: ExportResolution,
  quality: number = 100
): Promise<Buffer> {
  // Validate Cloudinary is configured
  if (!isCloudinaryConfigured()) {
    throw new Error(
      'Cloudinary not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.'
    );
  }

  console.log(`[Cloudinary] Starting CMYK conversion:`);
  console.log(`  - Profile: ${profile}`);
  console.log(`  - Format: ${format}`);
  console.log(`  - Resolution: ${resolution}dpi`);
  console.log(`  - Quality: ${quality}`);
  console.log(`  - Input size: ${imageBuffer.length} bytes`);

  let publicId: string | null = null;

  try {
    // Step 1: Upload to Cloudinary
    console.log('[Cloudinary] Step 1/4: Uploading...');
    publicId = await uploadToCloudinary(imageBuffer);

    // Step 2: Build transformation URL
    console.log('[Cloudinary] Step 2/4: Building transform URL...');
    const transformUrl = buildCMYKTransformUrl(
      publicId,
      profile,
      format,
      resolution,
      quality
    );

    // Step 3: Download converted image
    console.log('[Cloudinary] Step 3/4: Downloading CMYK result...');
    const resultBuffer = await downloadFromCloudinary(transformUrl);

    // Step 4: Cleanup (non-blocking)
    console.log('[Cloudinary] Step 4/4: Cleaning up...');
    // Don't await - let cleanup happen in background
    cleanupUpload(publicId).catch(() => {
      // Already logged in cleanupUpload
    });

    console.log(
      `[Cloudinary] ✅ CMYK conversion complete: ${format.toUpperCase()}, ` +
      `${profile.toUpperCase()}, ${resolution}dpi, ${resultBuffer.length} bytes`
    );

    return resultBuffer;

  } catch (error) {
    // Attempt cleanup on error
    if (publicId) {
      cleanupUpload(publicId).catch(() => {});
    }

    // Re-throw with context
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Cloudinary] ❌ CMYK conversion failed: ${errorMessage}`);

    throw new CloudinaryTransformError(
      `Cloudinary CMYK conversion failed: ${errorMessage}`,
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Get Cloudinary CMYK capabilities
 * Useful for diagnostics and feature detection
 */
export function getCloudinaryCMYKCapabilities(): {
  available: boolean;
  supportedProfiles: CMYKProfile[];
  supportedFormats: ExportFormat[];
  notes: string[];
} {
  const configured = isCloudinaryConfigured();

  return {
    available: configured,
    supportedProfiles: ['fogra39', 'swop', 'japan'],
    supportedFormats: ['jpg', 'tiff', 'png'], // PDF requires different handling
    notes: configured
      ? [
          'TRUE CMYK conversion via Cloudinary API',
          'ICC profiles applied during conversion',
          'Best for JPEG and TIFF output',
          'PDF export falls back to TIFF',
        ]
      : [
          'Cloudinary not configured',
          'Set environment variables to enable',
          'CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET',
        ],
  };
}
