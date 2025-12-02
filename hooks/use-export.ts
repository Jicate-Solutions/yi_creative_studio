"use client";

import { useState, useCallback } from "react";
import type {
  ExportParams,
  ExportFormat,
  ColorMode,
  ExportResolution,
  ExportJob,
  ExportStatus,
} from "@/types/export";
import {
  validateExportParams,
  isCMYKMode,
  formatSupportsCMYK,
  generateExportFilename,
  COLOR_MODES,
  EXPORT_FORMATS,
  EXPORT_RESOLUTIONS,
} from "@/types/export";

/**
 * Export state interface
 */
interface ExportState {
  isExporting: boolean;
  progress: number;
  status: ExportStatus | null;
  error: string | null;
  lastExport: ExportJob | null;
}

/**
 * Export options for the modal
 */
interface ExportOptions {
  format: ExportFormat;
  colorMode: ColorMode;
  resolution: ExportResolution;
  quality: number;
}

/**
 * Hook for exporting creatives with color mode conversion
 * YiCreatives Studio
 */
export function useExport() {
  const [state, setState] = useState<ExportState>({
    isExporting: false,
    progress: 0,
    status: null,
    error: null,
    lastExport: null,
  });

  const [options, setOptions] = useState<ExportOptions>({
    format: "png",
    colorMode: "rgb",
    resolution: 300,
    quality: 90,
  });

  /**
   * Update export options
   */
  const updateOptions = useCallback((updates: Partial<ExportOptions>) => {
    setOptions((prev) => {
      const newOptions = { ...prev, ...updates };

      // Auto-switch format if CMYK selected with incompatible format
      if (updates.colorMode && isCMYKMode(updates.colorMode)) {
        if (!formatSupportsCMYK(newOptions.format)) {
          newOptions.format = "jpg"; // Default to JPEG for CMYK
        }
      }

      return newOptions;
    });
  }, []);

  /**
   * Set format
   */
  const setFormat = useCallback(
    (format: ExportFormat) => {
      updateOptions({ format });
    },
    [updateOptions]
  );

  /**
   * Set color mode
   */
  const setColorMode = useCallback(
    (colorMode: ColorMode) => {
      updateOptions({ colorMode });
    },
    [updateOptions]
  );

  /**
   * Set resolution
   */
  const setResolution = useCallback(
    (resolution: ExportResolution) => {
      updateOptions({ resolution });
    },
    [updateOptions]
  );

  /**
   * Set quality (for JPEG)
   */
  const setQuality = useCallback(
    (quality: number) => {
      updateOptions({ quality: Math.max(1, Math.min(100, quality)) });
    },
    [updateOptions]
  );

  /**
   * Validate current export options
   */
  const validateOptions = useCallback(
    (creativeId: string): string | null => {
      return validateExportParams({
        creativeId,
        ...options,
      });
    },
    [options]
  );

  /**
   * Export a creative
   */
  const exportCreative = useCallback(
    async (creativeId: string, creativeName: string): Promise<boolean> => {
      // Validate options
      const validationError = validateOptions(creativeId);
      if (validationError) {
        setState((prev) => ({ ...prev, error: validationError }));
        return false;
      }

      setState({
        isExporting: true,
        progress: 0,
        status: "processing",
        error: null,
        lastExport: null,
      });

      try {
        // Simulate progress updates
        setState((prev) => ({ ...prev, progress: 20 }));

        console.log('[Export] Starting export with:', { creativeId, options });

        const response = await fetch("/api/export", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            creativeId,
            format: options.format,
            colorMode: options.colorMode,
            resolution: options.resolution,
            quality: options.quality,
          }),
        });

        setState((prev) => ({ ...prev, progress: 80 }));

        console.log('[Export] Response status:', response.status);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('[Export] Error response:', errorData);
          throw new Error(errorData.error || "Export failed");
        }

        // Get the blob
        const blob = await response.blob();
        const filename =
          response.headers.get("Content-Disposition")?.match(/filename="(.+)"/)?.[1] ||
          generateExportFilename(
            creativeName,
            options.format,
            options.colorMode,
            options.resolution
          );

        // Trigger download
        console.log('[Export] Starting download, blob size:', blob.size, 'filename:', filename);

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.style.display = 'none';
        document.body.appendChild(a);

        try {
          a.click();
          console.log('[Export] Download triggered successfully');
        } catch (err) {
          console.error('[Export] Click failed, using fallback:', err);
          // Fallback: open in new tab
          window.open(url, '_blank');
        }

        document.body.removeChild(a);
        // Delay revoking URL to ensure download starts
        setTimeout(() => URL.revokeObjectURL(url), 1000);

        setState((prev) => ({
          ...prev,
          progress: 100,
          status: "complete",
          lastExport: {
            id: crypto.randomUUID(),
            creativeId,
            status: "complete",
            params: {
              creativeId,
              ...options,
            },
            progress: 100,
            downloadUrl: url,
            createdAt: new Date(),
            completedAt: new Date(),
          },
        }));

        // Reset after a delay
        setTimeout(() => {
          setState((prev) => ({
            ...prev,
            isExporting: false,
            progress: 0,
            status: null,
          }));
        }, 2000);

        return true;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Export failed";
        setState({
          isExporting: false,
          progress: 0,
          status: "error",
          error: message,
          lastExport: null,
        });
        return false;
      }
    },
    [options, validateOptions]
  );

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    setState({
      isExporting: false,
      progress: 0,
      status: null,
      error: null,
      lastExport: null,
    });
    setOptions({
      format: "png",
      colorMode: "rgb",
      resolution: 300,
      quality: 90,
    });
  }, []);

  /**
   * Get available formats based on selected color mode
   */
  const getAvailableFormats = useCallback(() => {
    if (isCMYKMode(options.colorMode)) {
      return EXPORT_FORMATS.filter((f) => f.supportsCMYK);
    }
    return EXPORT_FORMATS;
  }, [options.colorMode]);

  /**
   * Check if current color mode is CMYK
   */
  const isCMYK = isCMYKMode(options.colorMode);

  /**
   * Check if quality setting is applicable
   */
  const showQualitySetting = options.format === "jpg";

  return {
    // State
    isExporting: state.isExporting,
    progress: state.progress,
    status: state.status,
    error: state.error,
    lastExport: state.lastExport,

    // Options
    options,
    format: options.format,
    colorMode: options.colorMode,
    resolution: options.resolution,
    quality: options.quality,

    // Actions
    exportCreative,
    updateOptions,
    setFormat,
    setColorMode,
    setResolution,
    setQuality,
    validateOptions,
    clearError,
    reset,

    // Computed
    getAvailableFormats,
    isCMYK,
    showQualitySetting,

    // Static data
    colorModes: COLOR_MODES,
    formats: EXPORT_FORMATS,
    resolutions: EXPORT_RESOLUTIONS,
  };
}
