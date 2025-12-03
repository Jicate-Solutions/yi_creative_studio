/**
 * Cloudinary Configuration
 * YiCreatives Studio
 *
 * Initializes Cloudinary SDK for serverless CMYK conversion.
 * Used as fallback when ImageMagick is not available (e.g., Vercel).
 */

import { v2 as cloudinary } from 'cloudinary';

// Initialize Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

/**
 * Check if Cloudinary is properly configured
 */
export function isCloudinaryConfigured(): boolean {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  const isConfigured = !!(cloudName && apiKey && apiSecret);

  if (!isConfigured) {
    console.warn('[Cloudinary] Not configured. Missing environment variables:');
    if (!cloudName) console.warn('  - CLOUDINARY_CLOUD_NAME');
    if (!apiKey) console.warn('  - CLOUDINARY_API_KEY');
    if (!apiSecret) console.warn('  - CLOUDINARY_API_SECRET');
  }

  return isConfigured;
}

/**
 * Get Cloudinary configuration status for diagnostics
 */
export function getCloudinaryStatus(): {
  configured: boolean;
  cloudName: string | null;
  hasApiKey: boolean;
  hasApiSecret: boolean;
} {
  return {
    configured: isCloudinaryConfigured(),
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || null,
    hasApiKey: !!process.env.CLOUDINARY_API_KEY,
    hasApiSecret: !!process.env.CLOUDINARY_API_SECRET,
  };
}

export { cloudinary };
