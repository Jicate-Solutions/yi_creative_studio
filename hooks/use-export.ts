"use client";

import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
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
 * Progress stage type for contextual feedback
 */
type ProgressStage = 'preparing' | 'processing' | 'converting' | 'downloading' | 'complete' | null;

/**
 * Export state interface
 */
interface ExportState {
  isExporting: boolean;
  progress: number;
  status: ExportStatus | null;
  error: string | null;
  lastExport: ExportJob | null;
  progressStage: ProgressStage;
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

const EXPORT_SETTINGS_KEY = 'yi-creative-export-settings';

/**
 * Get initial export options from localStorage or defaults
 */
function getInitialOptions(): ExportOptions {
  if (typeof window === 'undefined') {
    return {
      format: "png",
      colorMode: "rgb",
      resolution: 300,
      quality: 90,
    };
  }

  try {
    const saved = localStorage.getItem(EXPORT_SETTINGS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Validate the parsed data has expected shape
      if (parsed.format && parsed.colorMode && parsed.resolution) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to load export settings:', e);
  }

  return {
    format: "png",
    colorMode: "rgb",
    resolution: 300,
    quality: 90,
  };
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
    progressStage: null,
  });

  const [options, setOptions] = useState<ExportOptions>(getInitialOptions);

  // Persist settings to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(EXPORT_SETTINGS_KEY, JSON.stringify(options));
      } catch (e) {
        console.warn('Failed to save export settings:', e);
      }
    }
  }, [options]);

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
        toast.error('Invalid export options', {
          description: validationError,
          duration: 5000,
        });
        return false;
      }

      setState({
        isExporting: true,
        progress: 0,
        status: "processing",
        error: null,
        lastExport: null,
        progressStage: 'preparing',
      });

      try {
        // Preparing stage
        setState((prev) => ({ ...prev, progress: 10, progressStage: 'preparing' }));

        console.log('[Export] Starting export with:', { creativeId, options });

        // Processing stage
        setState((prev) => ({ ...prev, progress: 20, progressStage: 'processing' }));

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

        // Converting stage (especially for CMYK)
        setState((prev) => ({
          ...prev,
          progress: 60,
          progressStage: isCMYKMode(options.colorMode) ? 'converting' : 'processing'
        }));

        console.log('[Export] Response status:', response.status);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('[Export] Error response:', errorData);
          throw new Error(errorData.error || "Export failed");
        }

        // Downloading stage
        setState((prev) => ({ ...prev, progress: 80, progressStage: 'downloading' }));

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

        // Complete stage
        setState((prev) => ({
          ...prev,
          progress: 100,
          status: "complete",
          progressStage: 'complete',
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

        // Show success toast
        toast.success('Download started!', {
          description: `${filename} is being downloaded`,
          duration: 4000,
        });

        // Reset after a delay (longer to show success state)
        setTimeout(() => {
          setState((prev) => ({
            ...prev,
            isExporting: false,
            progress: 0,
            status: null,
            progressStage: null,
          }));
        }, 3000);

        return true;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Export failed";
        setState({
          isExporting: false,
          progress: 0,
          status: "error",
          error: message,
          lastExport: null,
          progressStage: null,
        });

        // Show error toast
        toast.error('Export failed', {
          description: message,
          duration: 5000,
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
   * Reset state (keeps user's saved options preferences)
   */
  const reset = useCallback(() => {
    setState({
      isExporting: false,
      progress: 0,
      status: null,
      error: null,
      lastExport: null,
      progressStage: null,
    });
    // Note: Options are NOT reset - they persist from localStorage
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
    progressStage: state.progressStage,

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
