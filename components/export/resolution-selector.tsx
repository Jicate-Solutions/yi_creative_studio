"use client";

import { useState } from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { ExportResolution } from "@/types/export";
import { cn } from "@/lib/utils";

interface ResolutionSelectorProps {
  value: ExportResolution;
  onChange: (resolution: ExportResolution) => void;
  disabled?: boolean;
}

// Resolution options with compact and full descriptions
const RESOLUTION_OPTIONS: {
  dpi: ExportResolution;
  label: string;
  shortDesc: string;
  fullDesc: string;
}[] = [
  {
    dpi: 72,
    label: "72",
    shortDesc: "Web",
    fullDesc: "Web & Social - Instagram, Facebook",
  },
  {
    dpi: 150,
    label: "150",
    shortDesc: "Draft",
    fullDesc: "Draft Print - Office printing",
  },
  {
    dpi: 300,
    label: "300",
    shortDesc: "Print",
    fullDesc: "Print Quality - Professional print",
  },
  {
    dpi: 600,
    label: "600",
    shortDesc: "Banner",
    fullDesc: "High Detail - Large format banners",
  },
];

export function ResolutionSelector({
  value,
  onChange,
  disabled = false,
}: ResolutionSelectorProps) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <ToggleGroup
          type="single"
          value={String(value)}
          onValueChange={(val) => val && onChange(Number(val) as ExportResolution)}
          disabled={disabled}
          className="flex flex-1 gap-1"
        >
          {RESOLUTION_OPTIONS.map((res) => {
            const isSelected = value === res.dpi;

            return (
              <ToggleGroupItem
                key={res.dpi}
                value={String(res.dpi)}
                className={cn(
                  "flex-1 flex flex-col items-center px-2 py-2.5 rounded-lg border transition-all",
                  "hover:bg-muted/80",
                  "data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:border-primary",
                  disabled && "opacity-50 cursor-not-allowed"
                )}
              >
                <span className="font-bold text-sm tabular-nums">{res.label}</span>
                <span className={cn(
                  "text-[10px]",
                  isSelected ? "text-primary-foreground/80" : "text-muted-foreground"
                )}>
                  {res.shortDesc}
                </span>
              </ToggleGroupItem>
            );
          })}
        </ToggleGroup>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowDetails(!showDetails)}
          className="text-xs h-auto py-1.5 px-2 shrink-0"
          disabled={disabled}
        >
          {showDetails ? (
            <ChevronUp className="h-3 w-3 mr-1" />
          ) : (
            <ChevronDown className="h-3 w-3 mr-1" />
          )}
          {showDetails ? "Hide" : "Details"}
        </Button>
      </div>

      {showDetails && (
        <div className="text-xs text-muted-foreground space-y-1.5 p-3 bg-muted/30 rounded-lg border border-dashed animate-in fade-in-0 slide-in-from-top-1 duration-200">
          {RESOLUTION_OPTIONS.map((res) => (
            <div
              key={res.dpi}
              className={cn(
                "flex items-center gap-2",
                value === res.dpi && "text-primary font-medium"
              )}
            >
              <span className="font-mono font-bold w-8">{res.dpi}</span>
              <span className="text-muted-foreground">DPI</span>
              <span className="mx-1">-</span>
              <span>{res.fullDesc}</span>
            </div>
          ))}
        </div>
      )}
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
    <ToggleGroup
      type="single"
      value={String(value)}
      onValueChange={(val) => val && onChange(Number(val) as ExportResolution)}
      disabled={disabled}
      className="flex gap-1"
    >
      {RESOLUTION_OPTIONS.map((res) => (
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
