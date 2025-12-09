/**
 * Thumbnail Generation Utility
 * YiCreatives Studio
 *
 * Generates compressed thumbnail images from base64 data URLs
 * using browser canvas for client-side compression.
 */

/**
 * Generate a compressed thumbnail from a base64 data URL
 * Uses browser canvas for client-side compression
 *
 * @param dataUrl - The source image as a data URL (e.g., data:image/png;base64,...)
 * @param maxWidth - Maximum width of the thumbnail (default: 400px)
 * @param quality - JPEG compression quality 0-1 (default: 0.7)
 * @returns Promise resolving to a compressed JPEG data URL
 */
export async function generateThumbnail(
  dataUrl: string,
  maxWidth: number = 400,
  quality: number = 0.7
): Promise<string> {
  return new Promise((resolve, reject) => {
    // Validate input
    if (!dataUrl || !dataUrl.startsWith('data:image/')) {
      reject(new Error('Invalid data URL: must be a valid image data URL'));
      return;
    }

    const img = new Image();

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        // Calculate dimensions maintaining aspect ratio
        const ratio = img.height / img.width;
        const width = Math.min(img.width, maxWidth);
        const height = Math.round(width * ratio);

        canvas.width = width;
        canvas.height = height;

        // Use high-quality image smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Draw the image scaled down
        ctx.drawImage(img, 0, 0, width, height);

        // Export as JPEG for smaller file size
        const thumbnailUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(thumbnailUrl);
      } catch (error) {
        reject(new Error(`Thumbnail generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image for thumbnail generation'));
    };

    img.src = dataUrl;
  });
}

/**
 * Estimate the size of a base64 data URL in bytes
 *
 * @param dataUrl - The data URL to measure
 * @returns Approximate size in bytes
 */
export function estimateDataUrlSize(dataUrl: string): number {
  // Remove the data URL prefix (e.g., "data:image/png;base64,")
  const base64Data = dataUrl.split(',')[1] || '';
  // Base64 encoding increases size by ~33%, so actual bytes = base64Length * 0.75
  return Math.round(base64Data.length * 0.75);
}

/**
 * Format bytes to human-readable string
 *
 * @param bytes - Size in bytes
 * @returns Formatted string (e.g., "1.5 MB")
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
