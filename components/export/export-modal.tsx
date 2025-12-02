"use client";

import { useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Download,
  Loader2,
  CheckCircle,
  AlertCircle,
  Palette,
  FileType,
  Ruler,
  Sparkles,
} from "lucide-react";
import { useExport } from "@/hooks/use-export";
import { ColorModeSelector } from "./color-mode-selector";
import { FormatSelector } from "./format-selector";
import { ResolutionSelector } from "./resolution-selector";
import { QualitySlider } from "./quality-slider";
import { cn } from "@/lib/utils";

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

  // Reset on open
  useEffect(() => {
    if (open) {
      reset();
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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md flex flex-col h-full">
        <SheetHeader className="space-y-1">
          <SheetTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-primary" />
            Export Creative
          </SheetTitle>
          <SheetDescription>
            Configure export settings for your design
          </SheetDescription>
        </SheetHeader>

        {/* Compact Preview */}
        {previewUrl && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border">
            <img
              src={previewUrl}
              alt={creativeName}
              className="h-16 w-16 object-cover rounded-md"
            />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{creativeName}</p>
              <Badge variant="secondary" className="text-xs mt-1">
                <Sparkles className="h-3 w-3 mr-1" />
                AI Generated
              </Badge>
            </div>
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="color" className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-3 h-auto p-1">
            <TabsTrigger value="color" className="flex-col py-2 h-auto gap-0.5">
              <div className="flex items-center gap-1.5">
                <Palette className="h-4 w-4" />
                <span className="text-xs font-medium">Color</span>
              </div>
              <span className="text-[10px] text-muted-foreground">
                {options.colorMode === "rgb" ? "RGB" : "CMYK"}
              </span>
            </TabsTrigger>
            <TabsTrigger value="format" className="flex-col py-2 h-auto gap-0.5">
              <div className="flex items-center gap-1.5">
                <FileType className="h-4 w-4" />
                <span className="text-xs font-medium">Format</span>
              </div>
              <span className="text-[10px] text-muted-foreground">
                {options.format.toUpperCase()}
              </span>
            </TabsTrigger>
            <TabsTrigger value="resolution" className="flex-col py-2 h-auto gap-0.5">
              <div className="flex items-center gap-1.5">
                <Ruler className="h-4 w-4" />
                <span className="text-xs font-medium">DPI</span>
              </div>
              <span className="text-[10px] text-muted-foreground">
                {options.resolution}
              </span>
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-auto py-4">
            <TabsContent value="color" className="mt-0 h-full">
              <ColorModeSelector
                value={options.colorMode}
                onChange={setColorMode}
                disabled={isExporting}
              />
            </TabsContent>
            <TabsContent value="format" className="mt-0 space-y-4 h-full">
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
            <TabsContent value="resolution" className="mt-0 h-full">
              <ResolutionSelector
                value={options.resolution}
                onChange={setResolution}
                disabled={isExporting}
              />
            </TabsContent>
          </div>
        </Tabs>

        {/* Compact Summary Bar */}
        <div className="flex items-center justify-center gap-2 py-2 text-xs text-muted-foreground border-t bg-muted/30 rounded-md">
          <span className="font-medium">{options.colorMode === "rgb" ? "RGB" : "CMYK"}</span>
          <span>•</span>
          <span className="font-medium">{options.format.toUpperCase()}</span>
          <span>•</span>
          <span className="font-medium">{options.resolution} DPI</span>
          {showQualitySetting && (
            <>
              <span>•</span>
              <span className="font-medium">{options.quality}%</span>
            </>
          )}
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mt-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Progress */}
        {isExporting && (
          <div className="space-y-2 p-3 rounded-lg bg-primary/5 border border-primary/20 mt-2">
            <div className="flex items-center justify-between text-sm">
              <span className={cn(
                "font-medium flex items-center gap-2",
                status === "complete" ? "text-green-600" : "text-primary"
              )}>
                {status === "complete" ? (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Export complete!
                  </>
                ) : (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                )}
              </span>
              <span className="font-semibold">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        <SheetFooter className="flex-row gap-3 pt-4 border-t mt-auto">
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
                Export
              </>
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
