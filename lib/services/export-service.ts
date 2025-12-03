/**
 * Export Service - TRUE CMYK/RGB Export System
 * YiCreatives Studio
 *
 * Handles image export with TRUE CMYK color mode conversion using ImageMagick.
 * Uses gm (GraphicsMagick/ImageMagick wrapper) for proper CMYK conversion
 * and Sharp.js for RGB processing and fallback.
 *
 * CMYK Profiles Supported:
 * - FOGRA39 (European print standard)
 * - SWOP (US Web Coated standard)
 * - JapanColor (Japan Color 2001 Coated)
 */

import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import gm from 'gm';
import { promisify } from 'util';
import type {
  ExportParams,
  ExportFormat,
  CMYKProfile,
  ExportResolution,
} from '@/types/export';
import {
  isCMYKMode,
  getCMYKProfile,
  generateExportFilename,
  validateExportParams,
} from '@/types/export';
import {
  convertToCMYKWithCloudinary,
  isCloudinaryConfigured,
  getCloudinaryCMYKCapabilities,
} from './cloudinary-cmyk';

// Use ImageMagick subclass for better CMYK support
const im = gm.subClass({ imageMagick: true });

// ICC Profile paths (relative to project root)
const ICC_PROFILES_DIR = path.join(process.cwd(), 'public', 'icc-profiles');

// Profile file mappings
const PROFILE_FILES: Record<string, string> = {
  sRGB: 'sRGB.icc',
  fogra39: 'FOGRA39.icc',
  swop: 'SWOP.icc',
  japan: 'JapanColor.icc',
};

// ImageMagick availability flag
let imageMagickAvailable: boolean | null = null;

/**
 * Check if ImageMagick is installed and available
 */
async function checkImageMagick(): Promise<boolean> {
  if (imageMagickAvailable !== null) {
    return imageMagickAvailable;
  }

  return new Promise((resolve) => {
    im(1, 1, '#ffffff')
      .identify((err) => {
        imageMagickAvailable = !err;
        if (err) {
          console.warn('[Export] ImageMagick not available, falling back to Sharp for CMYK');
          console.warn('[Export] Install ImageMagick for TRUE CMYK output: https://imagemagick.org/');
        } else {
          console.log('[Export] ImageMagick detected - TRUE CMYK conversion enabled');
        }
        resolve(imageMagickAvailable);
      });
  });
}

/**
 * Export service for handling image conversions
 */
export const exportService = {
  /**
   * Export a creative with the specified parameters
   */
  async exportCreative(
    imageUrl: string,
    creativeName: string,
    params: ExportParams
  ): Promise<{ buffer: Buffer; filename: string; mimeType: string }> {
    // Validate parameters
    const validationError = validateExportParams(params);
    if (validationError) {
      throw new Error(validationError);
    }

    // Fetch the original image
    const imageBuffer = await this.fetchImage(imageUrl);

    // Process the image
    let processedBuffer: Buffer;

    if (isCMYKMode(params.colorMode)) {
      // Get CMYK profile
      const cmykProfile = getCMYKProfile(params.colorMode)!;

      // Priority 1: Native ImageMagick (local dev - fastest & best quality)
      const hasImageMagick = await checkImageMagick();
      if (hasImageMagick) {
        console.log('[Export] Using ImageMagick for TRUE CMYK conversion');
        processedBuffer = await this.convertToCMYKWithImageMagick(
          imageBuffer,
          cmykProfile,
          params.format,
          params.resolution,
          params.quality
        );
      }
      // Priority 2: Cloudinary API (Vercel production - TRUE CMYK)
      else if (isCloudinaryConfigured()) {
        console.log('[Export] Using Cloudinary API for TRUE CMYK conversion');
        processedBuffer = await convertToCMYKWithCloudinary(
          imageBuffer,
          cmykProfile,
          params.format,
          params.resolution,
          params.quality || 100
        );
      }
      // Priority 3: Sharp fallback (limited CMYK support - TIFF only reliable)
      else {
        console.warn('[Export] ⚠️ Using Sharp fallback - CMYK support is LIMITED');
        console.warn('[Export] For TRUE CMYK, install ImageMagick locally or configure Cloudinary');
        processedBuffer = await this.convertToCMYKWithSharp(
          imageBuffer,
          cmykProfile,
          params.format,
          params.resolution,
          params.quality
        );
      }
    } else {
      // RGB processing
      processedBuffer = await this.processRGB(
        imageBuffer,
        params.format,
        params.resolution,
        params.quality
      );
    }

    // Generate filename
    const filename = generateExportFilename(
      creativeName,
      params.format,
      params.colorMode,
      params.resolution
    );

    // Get MIME type
    const mimeType = this.getMimeType(params.format);

    return {
      buffer: processedBuffer,
      filename,
      mimeType,
    };
  },

  /**
   * Fetch image from URL
   */
  async fetchImage(imageUrl: string): Promise<Buffer> {
    try {
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      console.error('Error fetching image:', error);
      throw new Error('Failed to fetch source image');
    }
  },

  /**
   * Process image for RGB export using Sharp
   */
  async processRGB(
    imageBuffer: Buffer,
    format: ExportFormat,
    resolution: ExportResolution,
    quality?: number
  ): Promise<Buffer> {
    let pipeline = sharp(imageBuffer);

    // Get metadata for DPI calculation
    const metadata = await pipeline.metadata();

    // Apply resolution/DPI settings
    if (resolution !== 72 && metadata.width && metadata.height) {
      // Scale image based on DPI (relative to 72 DPI base)
      const scale = resolution / 72;
      pipeline = pipeline.resize(
        Math.round(metadata.width * scale),
        Math.round(metadata.height * scale),
        { kernel: 'lanczos3' }
      );
    }

    // Try to embed sRGB profile if available
    const srgbProfilePath = this.getICCProfilePath('sRGB');
    if (srgbProfilePath) {
      try {
        pipeline = pipeline.withIccProfile(srgbProfilePath);
      } catch {
        // ICC profile embedding failed, continue without it
        console.warn('Failed to embed sRGB profile');
      }
    }

    // Convert to output format
    return this.convertToFormatWithSharp(pipeline, format, quality, resolution);
  },

  /**
   * Convert image to TRUE CMYK color space using ImageMagick
   * This produces REAL CMYK files that print shops will accept
   */
  async convertToCMYKWithImageMagick(
    imageBuffer: Buffer,
    profile: CMYKProfile,
    format: ExportFormat,
    resolution: ExportResolution,
    quality?: number
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const iccProfilePath = this.getICCProfilePath(profile);

      if (!iccProfilePath) {
        return reject(new Error(`ICC profile not found: ${profile}`));
      }

      // Get format-specific settings
      const gmFormat = this.getGMFormat(format);
      const outputQuality = quality || 100;
      const dpi = resolution || 300;

      // Create ImageMagick pipeline
      let pipeline = im(imageBuffer)
        // Set density/DPI
        .density(dpi, dpi)
        // Convert to CMYK colorspace first
        .colorspace('CMYK')
        // Apply the ICC profile for accurate color conversion
        .profile(iccProfilePath)
        // Set quality
        .quality(outputQuality);

      // Format-specific settings
      if (format === 'jpg') {
        pipeline = pipeline
          .compress('JPEG')
          .samplingFactor(1, 1); // Preserve CMYK channels
      } else if (format === 'tiff') {
        pipeline = pipeline
          .compress('LZW');
      }

      // Convert to buffer
      pipeline.toBuffer(gmFormat, (err: Error | null, buffer: Buffer) => {
        if (err) {
          console.error('[Export] ImageMagick CMYK conversion failed:', err);
          reject(new Error(`CMYK conversion failed: ${err.message}`));
        } else {
          console.log(`[Export] TRUE CMYK export completed: ${format.toUpperCase()}, ${profile}, ${dpi}dpi`);
          resolve(buffer);
        }
      });
    });
  },

  /**
   * Fallback CMYK conversion using Sharp
   * Note: Sharp's CMYK support is limited, especially for JPEG output
   */
  async convertToCMYKWithSharp(
    imageBuffer: Buffer,
    profile: CMYKProfile,
    format: ExportFormat,
    resolution: ExportResolution,
    quality?: number
  ): Promise<Buffer> {
    console.warn('[Export] Using Sharp fallback - CMYK support may be limited');

    let pipeline = sharp(imageBuffer);

    // Get metadata
    const metadata = await pipeline.metadata();

    // Apply resolution/DPI settings
    if (resolution !== 72 && metadata.width && metadata.height) {
      const scale = resolution / 72;
      pipeline = pipeline.resize(
        Math.round(metadata.width * scale),
        Math.round(metadata.height * scale),
        { kernel: 'lanczos3' }
      );
    }

    // Get CMYK ICC profile path
    const iccProfilePath = this.getICCProfilePath(profile);

    // Apply color conversion
    if (iccProfilePath) {
      try {
        // Convert to CMYK colorspace and embed ICC profile
        pipeline = pipeline.toColourspace('cmyk').withIccProfile(iccProfilePath);
      } catch {
        console.warn(`[Export] Failed to apply CMYK profile: ${profile}`);
        pipeline = pipeline.toColourspace('cmyk');
      }
    } else {
      pipeline = pipeline.toColourspace('cmyk');
    }

    // Convert to output format
    return this.convertToFormatWithSharp(pipeline, format, quality, resolution);
  },

  /**
   * Convert Sharp pipeline to the specified output format
   */
  async convertToFormatWithSharp(
    pipeline: sharp.Sharp,
    format: ExportFormat,
    quality?: number,
    resolution?: ExportResolution
  ): Promise<Buffer> {
    const dpi = resolution || 300;

    switch (format) {
      case 'png':
        return pipeline
          .png({
            compressionLevel: 6,
          })
          .withMetadata({ density: dpi })
          .toBuffer();

      case 'jpg':
        return pipeline
          .jpeg({
            quality: quality || 90,
            mozjpeg: true,
          })
          .withMetadata({ density: dpi })
          .toBuffer();

      case 'tiff':
        return pipeline
          .tiff({
            compression: 'lzw',
            quality: quality || 100,
          })
          .withMetadata({ density: dpi })
          .toBuffer();

      case 'pdf':
        // Sharp doesn't directly support PDF output
        // For PDF, we'll convert to high-quality TIFF first
        console.warn('[Export] PDF export falling back to TIFF format');
        return pipeline
          .tiff({
            compression: 'lzw',
            quality: 100,
          })
          .withMetadata({ density: dpi })
          .toBuffer();

      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  },

  /**
   * Get GraphicsMagick format string
   */
  getGMFormat(format: ExportFormat): string {
    const formatMap: Record<ExportFormat, string> = {
      png: 'PNG',
      jpg: 'JPEG',
      tiff: 'TIFF',
      pdf: 'PDF',
    };
    return formatMap[format] || 'JPEG';
  },

  /**
   * Get ICC profile path (for Sharp's withIccProfile which expects a path string)
   */
  getICCProfilePath(profileName: string): string | null {
    const profileFile = PROFILE_FILES[profileName];
    if (!profileFile) {
      console.warn(`Unknown ICC profile: ${profileName}`);
      return null;
    }

    const profilePath = path.join(ICC_PROFILES_DIR, profileFile);
    return profilePath;
  },

  /**
   * Load ICC profile from file as Buffer
   */
  async loadICCProfile(profileName: string): Promise<Buffer | null> {
    const profilePath = this.getICCProfilePath(profileName);
    if (!profilePath) {
      return null;
    }

    try {
      const profileBuffer = await fs.readFile(profilePath);
      return profileBuffer;
    } catch {
      console.warn(`ICC profile not found: ${profilePath}`);
      return null;
    }
  },

  /**
   * Get MIME type for export format
   */
  getMimeType(format: ExportFormat): string {
    const mimeTypes: Record<ExportFormat, string> = {
      png: 'image/png',
      jpg: 'image/jpeg',
      tiff: 'image/tiff',
      pdf: 'application/pdf',
    };
    return mimeTypes[format] || 'application/octet-stream';
  },

  /**
   * Get file extension for export format
   */
  getFileExtension(format: ExportFormat): string {
    const extensions: Record<ExportFormat, string> = {
      png: '.png',
      jpg: '.jpg',
      tiff: '.tiff',
      pdf: '.pdf',
    };
    return extensions[format] || '.bin';
  },

  /**
   * Estimate output file size (rough estimate)
   */
  estimateFileSize(
    originalSize: number,
    format: ExportFormat,
    resolution: ExportResolution,
    quality?: number
  ): number {
    // Base scale for resolution
    const resolutionScale = Math.pow(resolution / 72, 2);

    // Format-specific multipliers
    const formatMultipliers: Record<ExportFormat, number> = {
      png: 0.7, // PNG compression
      jpg: 0.15 * ((quality || 90) / 100), // JPEG compression
      tiff: 0.9, // TIFF with LZW
      pdf: 1.1, // PDF overhead
    };

    const multiplier = formatMultipliers[format] || 1;
    return Math.round(originalSize * resolutionScale * multiplier);
  },

  /**
   * Check if ICC profiles are available
   */
  async checkICCProfiles(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};

    for (const [name, file] of Object.entries(PROFILE_FILES)) {
      const profilePath = path.join(ICC_PROFILES_DIR, file);
      try {
        await fs.access(profilePath);
        results[name] = true;
      } catch {
        results[name] = false;
      }
    }

    return results;
  },

  /**
   * Check if ImageMagick is available for TRUE CMYK support
   */
  async checkImageMagickAvailability(): Promise<boolean> {
    return checkImageMagick();
  },

  /**
   * Get export system capabilities
   */
  async getCapabilities(): Promise<{
    imageMagick: boolean;
    cloudinary: boolean;
    iccProfiles: Record<string, boolean>;
    trueCMYKSupport: boolean;
    cmykMethod: 'imagemagick' | 'cloudinary' | 'sharp' | 'none';
  }> {
    const [imageMagick, iccProfiles] = await Promise.all([
      checkImageMagick(),
      this.checkICCProfiles(),
    ]);

    const cloudinary = isCloudinaryConfigured();
    const hasCMYKProfile = iccProfiles.fogra39 || iccProfiles.swop || iccProfiles.japan;

    // TRUE CMYK: ImageMagick (best) > Cloudinary (good) > Sharp (limited)
    const trueCMYKSupport = (imageMagick && hasCMYKProfile) || cloudinary;

    // Determine which method will be used
    let cmykMethod: 'imagemagick' | 'cloudinary' | 'sharp' | 'none' = 'none';
    if (imageMagick && hasCMYKProfile) {
      cmykMethod = 'imagemagick';
    } else if (cloudinary) {
      cmykMethod = 'cloudinary';
    } else if (hasCMYKProfile) {
      cmykMethod = 'sharp'; // Limited support
    }

    return {
      imageMagick,
      cloudinary,
      iccProfiles,
      trueCMYKSupport,
      cmykMethod,
    };
  },

  /**
   * Get Cloudinary-specific CMYK capabilities
   */
  getCloudinaryCapabilities() {
    return getCloudinaryCMYKCapabilities();
  },
};
