"use client";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { FileImage, FileType, File } from "lucide-react";
import type { ExportFormat, ExportFormatInfo } from "@/types/export";
import { cn } from "@/lib/utils";

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
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(val) => val && onChange(val as ExportFormat)}
      disabled={disabled}
      className="flex flex-wrap gap-2 justify-start"
    >
      {availableFormats.map((format) => {
        const Icon = FORMAT_ICONS[format.id] || File;
        const isSelected = value === format.id;

        return (
          <ToggleGroupItem
            key={format.id}
            value={format.id}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-full border data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:border-primary",
              "hover:bg-muted/80 transition-all",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            <Icon className="h-4 w-4" />
            <span className="font-medium text-sm">{format.name}</span>
          </ToggleGroupItem>
        );
      })}
    </ToggleGroup>
  );
}
