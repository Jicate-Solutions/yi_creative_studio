"use client";

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
    <div className="space-y-2">
      {EXPORT_RESOLUTIONS.map((res) => (
        <button
          key={res.dpi}
          type="button"
          onClick={() => onChange(res.dpi)}
          disabled={disabled}
          className={cn(
            "w-full flex items-center justify-between p-3 rounded-lg border transition-all",
            value === res.dpi
              ? "border-primary bg-primary/5 ring-1 ring-primary"
              : "border-border hover:border-primary/50 hover:bg-muted/50",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          <div className="text-left">
            <div className="font-medium text-sm">{res.name}</div>
            <div className="text-xs text-muted-foreground">{res.description}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-primary/80">{res.bestFor}</div>
          </div>
        </button>
      ))}
    </div>
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
    <div className="flex gap-2">
      {EXPORT_RESOLUTIONS.map((res) => (
        <button
          key={res.dpi}
          type="button"
          onClick={() => onChange(res.dpi)}
          disabled={disabled}
          className={cn(
            "flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-all",
            value === res.dpi
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border hover:border-primary/50 hover:bg-muted/50",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          {res.dpi}
        </button>
      ))}
    </div>
  );
}
