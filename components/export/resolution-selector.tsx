"use client";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import type { ExportResolution } from "@/types/export";
import { EXPORT_RESOLUTIONS } from "@/types/export";

interface ResolutionSelectorProps {
  value: ExportResolution;
  onChange: (resolution: ExportResolution) => void;
  disabled?: boolean;
}

export function ResolutionSelector({
  value,
  onChange,
  disabled = false,
}: ResolutionSelectorProps) {
  return (
    <ToggleGroup
      type="single"
      value={String(value)}
      onValueChange={(val) => val && onChange(Number(val) as ExportResolution)}
      disabled={disabled}
      className="flex flex-wrap gap-2 justify-start"
    >
      {EXPORT_RESOLUTIONS.map((res) => (
        <ToggleGroupItem
          key={res.dpi}
          value={String(res.dpi)}
          className={cn(
            "flex flex-col items-center px-4 py-2.5 rounded-full border data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:border-primary",
            "hover:bg-muted/80 transition-all min-w-[80px]",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          <span className="font-semibold text-sm">{res.dpi}</span>
          <span className="text-[10px] opacity-80">DPI</span>
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

/**
 * Compact resolution selector (for inline use)
 */
interface CompactResolutionSelectorProps {
  value: ExportResolution;
  onChange: (resolution: ExportResolution) => void;
  disabled?: boolean;
}

export function CompactResolutionSelector({
  value,
  onChange,
  disabled = false,
}: CompactResolutionSelectorProps) {
  return (
    <ToggleGroup
      type="single"
      value={String(value)}
      onValueChange={(val) => val && onChange(Number(val) as ExportResolution)}
      disabled={disabled}
      className="flex gap-1"
    >
      {EXPORT_RESOLUTIONS.map((res) => (
        <ToggleGroupItem
          key={res.dpi}
          value={String(res.dpi)}
          className={cn(
            "px-3 py-1.5 rounded-md text-xs font-medium",
            "data-[state=on]:bg-primary data-[state=on]:text-primary-foreground",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          {res.dpi}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
