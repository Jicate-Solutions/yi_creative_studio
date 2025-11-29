/**
 * Export Service - CMYK/RGB Export System
 * YiCreatives Studio
 *
 * Handles image export with color mode conversion and ICC profile embedding.
 * Uses Sharp.js for image processing.
 */

import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import type {
  ExportParams,
  ExportFormat,
  ColorMode,
  CMYKProfile,
  ExportResolution,
} from '@/types/export';
import {
  isCMYKMode,
  getCMYKProfile,
  generateExportFilename,
  validateExportParams,
} from '@/types/export';

// ICC Profile paths (relative to project root)
const ICC_PROFILES_DIR = path.join(process.cwd(), 'public', 'icc-profiles');

// Profile file mappings
const PROFILE_FILES: Record<string, string> = {
  sRGB: 'sRGB.icc',
  fogra39: 'FOGRA39.icc',
  swop: 'SWOP.icc',
  japan: 'JapanColor.icc',
};

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
      // CMYK conversion
      processedBuffer = await this.convertToCMYK(
        imageBuffer,
        getCMYKProfile(params.colorMode)!,
        params.format,
        params.resolution,
        params.quality
      );
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
   * Process image for RGB export
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
    return this.convertToFormat(pipeline, format, quality, resolution);
  },

  /**
   * Convert image to CMYK color space
   * Note: Sharp doesn't natively support CMYK output, so we use a simulation
   * For production, you'd want to use a proper color management library
   */
  async convertToCMYK(
    imageBuffer: Buffer,
    profile: CMYKProfile,
    format: ExportFormat,
    resolution: ExportResolution,
    quality?: number
  ): Promise<Buffer> {
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
    // Note: Sharp's ICC profile support converts the image to the target color space
    if (iccProfilePath) {
      try {
        pipeline = pipeline.toColorspace('cmyk').withIccProfile(iccProfilePath);
      } catch {
        // Fallback: simple colorspace conversion without profile
        console.warn(`Failed to apply CMYK profile: ${profile}`);
        pipeline = pipeline.toColorspace('cmyk');
      }
    } else {
      // Fallback: simple colorspace conversion without profile
      pipeline = pipeline.toColorspace('cmyk');
    }

    // Convert to output format
    return this.convertToFormat(pipeline, format, quality, resolution);
  },

  /**
   * Convert Sharp pipeline to the specified output format
   */
  async convertToFormat(
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
        // In production, you'd use a library like PDFKit or pdf-lib
        console.warn('PDF export falling back to TIFF format');
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
};
