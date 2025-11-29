"use client";

import { cn } from "@/lib/utils";
import { FileImage, FileType, File } from "lucide-react";
import type { ExportFormat, ExportFormatInfo } from "@/types/export";

interface FormatSelectorProps {
  value: ExportFormat;
  onChange: (format: ExportFormat) => void;
  availableFormats: ExportFormatInfo[];
  disabled?: boolean;
}

const FORMAT_ICONS: Record<ExportFormat, typeof FileImage> = {
  png: FileImage,
  jpg: FileImage,
  tiff: FileImage,
  pdf: FileType,
};

export function FormatSelector({
  value,
  onChange,
  availableFormats,
  disabled = false,
}: FormatSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {availableFormats.map((format) => {
        const Icon = FORMAT_ICONS[format.id] || File;
        const isSelected = value === format.id;

        return (
          <button
            key={format.id}
            type="button"
            onClick={() => onChange(format.id)}
            disabled={disabled}
            className={cn(
              "flex flex-col items-center gap-2 p-3 rounded-lg border transition-all",
              isSelected
                ? "border-primary bg-primary/5 ring-1 ring-primary"
                : "border-border hover:border-primary/50 hover:bg-muted/50",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            <Icon className={cn("h-6 w-6", isSelected ? "text-primary" : "text-muted-foreground")} />
            <div className="text-center">
              <div className="font-medium text-sm">{format.name}</div>
              <div className="text-xs text-muted-foreground">{format.extension}</div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
