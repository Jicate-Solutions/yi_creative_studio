"use client";

import { cn } from "@/lib/utils";
import { Monitor, Printer } from "lucide-react";
import type { ColorMode } from "@/types/export";
import { COLOR_MODES, isCMYKMode } from "@/types/export";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ColorModeSelectorProps {
  value: ColorMode;
  onChange: (mode: ColorMode) => void;
  disabled?: boolean;
}

export function ColorModeSelector({
  value,
  onChange,
  disabled = false,
}: ColorModeSelectorProps) {
  const isRGB = value === "rgb";
  const isCMYK = isCMYKMode(value);

  // Get CMYK modes for the profile selector
  const cmykModes = COLOR_MODES.filter((m) => isCMYKMode(m.id));

  return (
    <div className="grid grid-cols-2 gap-2">
      {/* RGB Card */}
      <button
        type="button"
        onClick={() => onChange("rgb")}
        disabled={disabled}
        className={cn(
          "flex items-center gap-3 p-3 rounded-lg border-2 transition-all",
          isRGB
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50 hover:bg-muted/50",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <div className={cn(
          "h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0",
          isRGB ? "bg-primary/10" : "bg-muted"
        )}>
          <Monitor className={cn("h-4 w-4", isRGB ? "text-primary" : "text-muted-foreground")} />
        </div>
        <div className="text-left">
          <div className="font-semibold text-sm">RGB</div>
          <div className="text-xs text-muted-foreground">Digital / Web</div>
        </div>
      </button>

      {/* CMYK Card */}
      <button
        type="button"
        onClick={() => !isCMYK && onChange("cmyk-fogra39")}
        disabled={disabled}
        className={cn(
          "flex items-center gap-3 p-3 rounded-lg border-2 transition-all",
          isCMYK
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50 hover:bg-muted/50",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <div className={cn(
          "h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0",
          isCMYK ? "bg-primary/10" : "bg-muted"
        )}>
          <Printer className={cn("h-4 w-4", isCMYK ? "text-primary" : "text-muted-foreground")} />
        </div>
        <div className="text-left">
          <div className="font-semibold text-sm">CMYK</div>
          <div className="text-xs text-muted-foreground">Print Ready</div>
        </div>
      </button>

      {/* CMYK Profile Selector - Show below both cards when CMYK is selected */}
      {isCMYK && (
        <div className="col-span-2">
          <Select
            value={value}
            onValueChange={(val) => onChange(val as ColorMode)}
            disabled={disabled}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Select profile" />
            </SelectTrigger>
            <SelectContent>
              {cmykModes.map((mode) => (
                <SelectItem key={mode.id} value={mode.id} className="text-xs">
                  <div>
                    <span className="font-medium">{mode.name.replace('CMYK ', '')}</span>
                    <span className="text-muted-foreground ml-1">- {mode.bestFor.split(',')[0]}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
