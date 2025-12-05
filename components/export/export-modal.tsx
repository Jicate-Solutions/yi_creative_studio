"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
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
} from "lucide-react";
import { useExport } from "@/hooks/use-export";
import { ColorModeSelector } from "./color-mode-selector";
import { FormatSelector } from "./format-selector";
import { ResolutionSelector } from "./resolution-selector";
import { QualitySlider } from "./quality-slider";
import { cn } from "@/lib/utils";
import { estimateFileSize, formatFileSize } from "@/types/export";

interface ExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  creativeId: string;
  creativeName: string;
  previewUrl?: string;
}

export function ExportModal({
  open,
  onOpenChange,
  creativeId,
  creativeName,
  previewUrl,
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
    }
  }, [open, reset]);

  const handleExport = async () => {
    const success = await exportCreative(creativeId, creativeName);
    if (success) {
      // Close modal after successful export with longer delay for user to see success
      setTimeout(() => {
        onOpenChange(false);
      }, 3000);
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
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        {/* Fixed Header */}
        <DialogHeader className="px-6 pt-6 pb-4 shrink-0 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-primary" />
            Download Creative
          </DialogTitle>
          <DialogDescription className="text-sm">
            Configure export settings for your creative
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable Content Area - Use native overflow instead of ScrollArea */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="px-6 py-4 space-y-5">
            {/* Preview - With Full View Toggle */}
            {previewUrl && (
              <div className="flex flex-col items-center p-4 rounded-xl bg-muted/30 border">
                {/* Image with Full View toggle */}
                <div className="relative w-full flex justify-center">
                  <img
                    src={previewUrl}
                    alt={creativeName}
                    className={cn(
                      "object-contain rounded-lg shadow-sm transition-all duration-300",
                      showFullPreview
                        ? "max-h-[50vh] w-auto"
                        : "h-24 w-auto"
                    )}
                  />
                  {/* Full View Toggle Button */}
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowFullPreview(!showFullPreview)}
                    className="absolute top-2 right-2 h-8 w-8 p-0 rounded-full bg-background/80 hover:bg-background shadow-md"
                  >
                    {showFullPreview ? (
                      <Minimize2 className="h-4 w-4" />
                    ) : (
                      <Expand className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <div className="mt-3 text-center">
                  <p className="font-medium text-sm truncate max-w-[280px]">
                    {creativeName}
                  </p>
                  <div className="flex items-center justify-center gap-2 mt-1.5">
                    <Badge variant="secondary" className="text-xs">
                      <Sparkles className="h-3 w-3 mr-1" />
                      AI Generated
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowFullPreview(!showFullPreview)}
                      className="text-xs h-auto py-1 px-2"
                    >
                      {showFullPreview ? "Minimize" : "Full View"}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <Separator />

            {/* Color Mode Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Palette className="h-4 w-4 text-muted-foreground" />
                <h4 className="text-sm font-semibold">Color Mode</h4>
              </div>
              <ColorModeSelector
                value={options.colorMode}
                onChange={setColorMode}
                disabled={isExporting}
              />
            </div>

            <Separator />

            {/* Format Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <FileImage className="h-4 w-4 text-muted-foreground" />
                <h4 className="text-sm font-semibold">Format</h4>
              </div>
              <FormatSelector
                value={options.format}
                onChange={setFormat}
                availableFormats={availableFormats}
                disabled={isExporting}
              />
            </div>

            <Separator />

            {/* Resolution Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Maximize className="h-4 w-4 text-muted-foreground" />
                <h4 className="text-sm font-semibold">Resolution</h4>
              </div>
              <ResolutionSelector
                value={options.resolution}
                onChange={setResolution}
                disabled={isExporting}
              />
            </div>

            {/* Quality Slider (JPEG only) */}
            {showQualitySetting && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold">Quality</h4>
                  <QualitySlider
                    value={options.quality}
                    onChange={setQuality}
                    disabled={isExporting}
                  />
                </div>
              </>
            )}

            <Separator />

            {/* File Size Warning */}
            {isLargeFile && (
              <Alert variant={isVeryLargeFile ? "destructive" : "default"}>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>
                  {isVeryLargeFile ? "Very large file" : "Large file size"}
                </AlertTitle>
                <AlertDescription>
                  ~{estimatedSize}. Consider using lower DPI for faster download.
                </AlertDescription>
              </Alert>
            )}

            {/* Export Summary Card */}
            <Card className="bg-muted/30 border-dashed">
              <CardContent className="p-4">
                <div className="flex flex-col gap-3">
                  <p className="text-xs text-muted-foreground text-center font-medium uppercase tracking-wide">
                    Export Summary
                  </p>
                  <div className="flex items-center justify-center gap-2 flex-wrap">
                    <Badge variant="outline" className="font-medium">
                      {colorModeDisplay}
                    </Badge>
                    <Badge variant="outline" className="font-medium">
                      {options.format.toUpperCase()}
                    </Badge>
                    <Badge variant="outline" className="font-medium">
                      {options.resolution} DPI
                    </Badge>
                    {showQualitySetting && (
                      <Badge variant="outline" className="font-medium">
                        {options.quality}%
                      </Badge>
                    )}
                  </div>
                  <div
                    className={cn(
                      "flex items-center justify-center gap-2 text-sm font-semibold",
                      isVeryLargeFile
                        ? "text-destructive"
                        : isLargeFile
                          ? "text-amber-600 dark:text-amber-500"
                          : "text-muted-foreground"
                    )}
                  >
                    <HardDrive className="h-4 w-4" />
                    <span>~{estimatedSize}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Error Alert */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Progress & Success State */}
            {isExporting && (
              <div>
                {status === "complete" ? (
                  // Success celebration UI
                  <div className="flex flex-col items-center justify-center py-6 px-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 animate-in fade-in-0 zoom-in-95">
                    <div className="h-14 w-14 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center mb-3">
                      <CheckCircle className="h-7 w-7 text-green-600 dark:text-green-400" />
                    </div>
                    <p className="font-semibold text-green-700 dark:text-green-300">
                      Download Started!
                    </p>
                    <p className="text-sm text-green-600/80 dark:text-green-400/80 mt-1">
                      Check your downloads folder
                    </p>
                  </div>
                ) : (
                  // Progress UI with contextual messages
                  <div className="space-y-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium flex items-center gap-2 text-primary">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {progressStage
                          ? PROGRESS_MESSAGES[progressStage]
                          : "Processing..."}
                      </span>
                      <span className="font-semibold tabular-nums">
                        {progress}%
                      </span>
                    </div>
                    <Progress value={progress} className="h-2" />
                    {progressStage === "converting" &&
                      options.colorMode.startsWith("cmyk") && (
                        <p className="text-xs text-muted-foreground text-center">
                          Converting to CMYK color profile for print...
                        </p>
                      )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Fixed Footer */}
        <DialogFooter className="px-6 py-4 border-t bg-muted/30 shrink-0">
          <div className="flex gap-3 w-full">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isExporting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleExport}
              disabled={isExporting}
              className="flex-1 gap-2"
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
