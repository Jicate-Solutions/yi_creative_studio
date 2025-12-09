"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Download,
  Loader2,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Sparkles,
  HardDrive,
  Palette,
  FileImage,
  Maximize,
  Minimize2,
  Expand,
  X,
  Zap,
} from "lucide-react";
import { useExport } from "@/hooks/use-export";
import { ColorModeSelector } from "./color-mode-selector";
import { FormatSelector } from "./format-selector";
import { ResolutionSelector } from "./resolution-selector";
import { QualitySlider } from "./quality-slider";
import { cn } from "@/lib/utils";
import { estimateFileSize, formatFileSize } from "@/types/export";
import { CreativeFeedbackDialog } from "@/components/feedback/creative-feedback-dialog";

interface ExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  creativeId: string;
  creativeName: string;
  previewUrl?: string;
  // Feedback context - passed to feedback dialog after successful export
  creativeType?: string;
  vertical?: string;
  promptUsed?: string;
  formData?: Record<string, unknown>;
}

export function ExportModal({
  open,
  onOpenChange,
  creativeId,
  creativeName,
  previewUrl,
  creativeType,
  vertical,
  promptUsed,
  formData,
}: ExportModalProps) {
  const {
    isExporting,
    progress,
    status,
    error,
    options,
    progressStage,
    setFormat,
    setColorMode,
    setResolution,
    setQuality,
    exportCreative,
    getAvailableFormats,
    showQualitySetting,
    reset,
  } = useExport();

  // State for full view image preview
  const [showFullPreview, setShowFullPreview] = useState(false);

  // State for feedback dialog
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);

  // Progress stage messages for better UX
  const PROGRESS_MESSAGES: Record<string, string> = {
    preparing: "Preparing export...",
    processing: "Processing image...",
    converting: "Converting color profile...",
    downloading: "Starting download...",
    complete: "Export complete!",
  };

  // Reset on open
  useEffect(() => {
    if (open) {
      reset();
      setShowFeedbackDialog(false);
    }
  }, [open, reset]);

  // Handle feedback dialog close
  const handleFeedbackClose = (openState: boolean) => {
    setShowFeedbackDialog(openState);
    if (!openState) {
      // When feedback dialog closes, close the export modal too
      onOpenChange(false);
    }
  };

  const handleExport = async () => {
    const success = await exportCreative(creativeId, creativeName);
    if (success) {
      // Show feedback dialog after successful export (after user sees success state)
      setTimeout(() => {
        setShowFeedbackDialog(true);
      }, 2500);
    }
  };

  const availableFormats = getAvailableFormats();

  // Estimate file size based on current options (use 1080x1350 as default dimensions)
  const { estimatedSize, estimatedSizeBytes } = useMemo(() => {
    const bytes = estimateFileSize(1080, 1350, {
      format: options.format,
      resolution: options.resolution,
      quality: options.quality,
      colorMode: options.colorMode,
    });
    return {
      estimatedSize: formatFileSize(bytes),
      estimatedSizeBytes: bytes,
    };
  }, [options]);

  // Determine if file size is large
  const isLargeFile = estimatedSizeBytes > 50_000_000; // > 50MB
  const isVeryLargeFile = estimatedSizeBytes > 100_000_000; // > 100MB

  // Color mode display name
  const colorModeDisplay = options.colorMode === "rgb" ? "RGB" : "CMYK";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        solidBackground
        showCloseButton={false}
        className="sm:max-w-lg md:max-w-xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden rounded-2xl"
      >
        {/* Premium Header with Gradient Accent */}
        <div className="relative">
          {/* Gradient accent bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yi-blue via-yi-teal to-yi-orange" />

          <DialogHeader className="px-5 pt-5 pb-4 shrink-0">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-yi-blue to-yi-teal flex items-center justify-center shadow-lg shadow-yi-blue/20">
                  <Download className="h-5 w-5 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-semibold">
                    Export Creative
                  </DialogTitle>
                  <DialogDescription className="text-xs mt-0.5">
                    Configure your download settings
                  </DialogDescription>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
                className="h-8 w-8 rounded-full hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="px-5 pb-5 space-y-4">
            {/* Preview Section - Larger and Improved */}
            {previewUrl && (
              <div
                className={cn(
                  "relative rounded-xl overflow-hidden bg-gradient-to-br from-muted/50 to-muted border transition-all duration-300",
                  showFullPreview ? "p-0" : "p-4"
                )}
              >
                <div className="relative flex items-center justify-center">
                  <img
                    src={previewUrl}
                    alt={creativeName}
                    className={cn(
                      "object-contain transition-all duration-300",
                      showFullPreview
                        ? "max-h-[45vh] w-full rounded-xl"
                        : "max-h-32 md:max-h-40 w-auto rounded-lg shadow-md"
                    )}
                  />
                  {/* Expand/Collapse Toggle */}
                  <button
                    onClick={() => setShowFullPreview(!showFullPreview)}
                    className={cn(
                      "absolute transition-all duration-200",
                      showFullPreview
                        ? "top-2 right-2"
                        : "top-2 right-2",
                      "h-8 w-8 rounded-full bg-background/90 hover:bg-background shadow-lg flex items-center justify-center"
                    )}
                  >
                    {showFullPreview ? (
                      <Minimize2 className="h-4 w-4" />
                    ) : (
                      <Expand className="h-4 w-4" />
                    )}
                  </button>
                </div>

                {/* Inline info when collapsed */}
                {!showFullPreview && (
                  <div className="flex items-center justify-between mt-3 px-1">
                    <p className="font-medium text-sm truncate max-w-[220px]">
                      {creativeName}
                    </p>
                    <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
                      <Sparkles className="h-2.5 w-2.5 mr-0.5" />
                      AI
                    </Badge>
                  </div>
                )}
              </div>
            )}

            {/* Export Options Grid */}
            <div className="space-y-3">
              {/* Color Mode */}
              <div className="rounded-xl border bg-card p-3.5">
                <div className="flex items-center gap-2 mb-2.5">
                  <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                    <Palette className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <span className="text-sm font-medium">Color Mode</span>
                </div>
                <ColorModeSelector
                  value={options.colorMode}
                  onChange={setColorMode}
                  disabled={isExporting}
                />
              </div>

              {/* Format */}
              <div className="rounded-xl border bg-card p-3.5">
                <div className="flex items-center gap-2 mb-2.5">
                  <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
                    <FileImage className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="text-sm font-medium">Format</span>
                </div>
                <FormatSelector
                  value={options.format}
                  onChange={setFormat}
                  availableFormats={availableFormats}
                  disabled={isExporting}
                />
              </div>

              {/* Resolution */}
              <div className="rounded-xl border bg-card p-3.5">
                <div className="flex items-center gap-2 mb-2.5">
                  <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
                    <Maximize className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                  </div>
                  <span className="text-sm font-medium">Resolution</span>
                </div>
                <ResolutionSelector
                  value={options.resolution}
                  onChange={setResolution}
                  disabled={isExporting}
                />
              </div>

              {/* Quality (JPEG only) */}
              {showQualitySetting && (
                <div className="rounded-xl border bg-card p-3.5">
                  <div className="flex items-center gap-2 mb-2.5">
                    <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
                      <Zap className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <span className="text-sm font-medium">Quality</span>
                  </div>
                  <QualitySlider
                    value={options.quality}
                    onChange={setQuality}
                    disabled={isExporting}
                  />
                </div>
              )}
            </div>

            {/* File Size Warning */}
            {isLargeFile && (
              <Alert variant={isVeryLargeFile ? "destructive" : "default"} className="rounded-xl">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle className="text-sm">
                  {isVeryLargeFile ? "Very large file" : "Large file"}
                </AlertTitle>
                <AlertDescription className="text-xs">
                  ~{estimatedSize}. Consider lower DPI for faster download.
                </AlertDescription>
              </Alert>
            )}

            {/* Error Alert */}
            {error && (
              <Alert variant="destructive" className="rounded-xl">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">{error}</AlertDescription>
              </Alert>
            )}

            {/* Progress & Success State */}
            {isExporting && (
              <div className="animate-in fade-in-0 slide-in-from-bottom-2">
                {status === "complete" ? (
                  <div className="flex flex-col items-center justify-center py-6 px-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mb-3 shadow-lg shadow-green-500/30">
                      <CheckCircle className="h-6 w-6 text-white" />
                    </div>
                    <p className="font-semibold text-green-700 dark:text-green-300">
                      Download Started!
                    </p>
                    <p className="text-xs text-green-600/80 dark:text-green-400/80 mt-1">
                      Check your downloads folder
                    </p>
                  </div>
                ) : (
                  <div className="rounded-xl bg-gradient-to-br from-yi-blue/5 to-yi-teal/5 border border-yi-blue/20 p-4">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="font-medium flex items-center gap-2 text-yi-blue">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {progressStage
                          ? PROGRESS_MESSAGES[progressStage]
                          : "Processing..."}
                      </span>
                      <span className="font-bold tabular-nums text-yi-teal">
                        {progress}%
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-yi-blue to-yi-teal transition-all duration-300 rounded-full"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    {progressStage === "converting" &&
                      options.colorMode.startsWith("cmyk") && (
                        <p className="text-xs text-muted-foreground text-center mt-2">
                          Converting to CMYK color profile for print...
                        </p>
                      )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer with Summary & Actions */}
        <div className="border-t bg-muted/30 px-5 py-4 shrink-0">
          {/* Compact Summary Row */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Badge variant="outline" className="text-[10px] h-5 font-medium bg-background">
                {colorModeDisplay}
              </Badge>
              <Badge variant="outline" className="text-[10px] h-5 font-medium bg-background">
                {options.format.toUpperCase()}
              </Badge>
              <Badge variant="outline" className="text-[10px] h-5 font-medium bg-background">
                {options.resolution} DPI
              </Badge>
              {showQualitySetting && (
                <Badge variant="outline" className="text-[10px] h-5 font-medium bg-background">
                  {options.quality}%
                </Badge>
              )}
            </div>
            <div
              className={cn(
                "flex items-center gap-1 text-xs font-semibold",
                isVeryLargeFile
                  ? "text-destructive"
                  : isLargeFile
                    ? "text-amber-600 dark:text-amber-500"
                    : "text-muted-foreground"
              )}
            >
              <HardDrive className="h-3 w-3" />
              <span>~{estimatedSize}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isExporting}
              className="flex-1 h-10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleExport}
              disabled={isExporting}
              variant="glass-primary"
              className="flex-1 h-10 gap-2"
            >
              {isExporting ? (
                status === "complete" ? (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Done!
                  </>
                ) : (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Exporting...
                  </>
                )
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Download
                </>
              )}
            </Button>
          </div>

        </div>
      </DialogContent>

      {/* Feedback Dialog - Shown after successful download */}
      <CreativeFeedbackDialog
        open={showFeedbackDialog}
        onOpenChange={handleFeedbackClose}
        creativeId={creativeId}
        creativeType={creativeType || 'creative'}
        vertical={vertical}
        promptUsed={promptUsed}
        formData={formData}
      />
    </Dialog>
  );
}
