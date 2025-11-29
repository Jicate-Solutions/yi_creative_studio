"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Download,
  Loader2,
  CheckCircle,
  AlertCircle,
  Palette,
  FileType,
  Ruler,
} from "lucide-react";
import { useExport } from "@/hooks/use-export";
import { ColorModeSelector } from "./color-mode-selector";
import { FormatSelector } from "./format-selector";
import { ResolutionSelector } from "./resolution-selector";
import { QualitySlider } from "./quality-slider";

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
    setFormat,
    setColorMode,
    setResolution,
    setQuality,
    exportCreative,
    getAvailableFormats,
    showQualitySetting,
    reset,
  } = useExport();

  const [activeTab, setActiveTab] = useState("color");

  // Reset on open
  useEffect(() => {
    if (open) {
      reset();
      setActiveTab("color");
    }
  }, [open, reset]);

  const handleExport = async () => {
    const success = await exportCreative(creativeId, creativeName);
    if (success) {
      // Close modal after successful export with slight delay
      setTimeout(() => {
        onOpenChange(false);
      }, 1500);
    }
  };

  const availableFormats = getAvailableFormats();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Creative
          </DialogTitle>
        </DialogHeader>

        {/* Preview */}
        {previewUrl && (
          <div className="relative w-full h-40 bg-muted rounded-lg overflow-hidden mb-4">
            <img
              src={previewUrl}
              alt={creativeName}
              className="w-full h-full object-contain"
            />
            <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
              {creativeName}
            </div>
          </div>
        )}

        {/* Export Options Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="color" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              <span className="hidden sm:inline">Color Mode</span>
              <span className="sm:hidden">Color</span>
            </TabsTrigger>
            <TabsTrigger value="format" className="flex items-center gap-2">
              <FileType className="h-4 w-4" />
              <span>Format</span>
            </TabsTrigger>
            <TabsTrigger value="resolution" className="flex items-center gap-2">
              <Ruler className="h-4 w-4" />
              <span className="hidden sm:inline">Resolution</span>
              <span className="sm:hidden">DPI</span>
            </TabsTrigger>
          </TabsList>

          <div className="mt-4">
            <TabsContent value="color" className="m-0">
              <ColorModeSelector
                value={options.colorMode}
                onChange={setColorMode}
                disabled={isExporting}
              />
            </TabsContent>

            <TabsContent value="format" className="m-0 space-y-4">
              <FormatSelector
                value={options.format}
                onChange={setFormat}
                availableFormats={availableFormats}
                disabled={isExporting}
              />
              {showQualitySetting && (
                <div className="pt-4 border-t">
                  <QualitySlider
                    value={options.quality}
                    onChange={setQuality}
                    disabled={isExporting}
                  />
                </div>
              )}
            </TabsContent>

            <TabsContent value="resolution" className="m-0">
              <ResolutionSelector
                value={options.resolution}
                onChange={setResolution}
                disabled={isExporting}
              />
            </TabsContent>
          </div>
        </Tabs>

        {/* Current Selection Summary */}
        <div className="bg-muted/50 rounded-lg p-3 mt-4">
          <div className="text-sm font-medium mb-2">Export Settings</div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div>
              <span className="text-muted-foreground">Color: </span>
              <span className="font-medium">
                {options.colorMode === "rgb"
                  ? "RGB"
                  : options.colorMode.replace("cmyk-", "CMYK-").toUpperCase()}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Format: </span>
              <span className="font-medium">{options.format.toUpperCase()}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Resolution: </span>
              <span className="font-medium">{options.resolution} DPI</span>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mt-4 flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Progress */}
        {isExporting && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {status === "complete" ? "Export complete!" : "Processing..."}
              </span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        <DialogFooter className="mt-6">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isExporting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={isExporting}
            className="min-w-[120px]"
          >
            {isExporting ? (
              status === "complete" ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Done!
                </>
              ) : (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Exporting...
                </>
              )
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
