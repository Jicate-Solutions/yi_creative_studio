"use client";

import { cn } from "@/lib/utils";
import { Check, Monitor, Printer } from "lucide-react";
import type { ColorMode, ColorModeInfo } from "@/types/export";
import { COLOR_MODES, isCMYKMode } from "@/types/export";

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
  // Group color modes
  const rgbModes = COLOR_MODES.filter((m) => !isCMYKMode(m.id));
  const cmykModes = COLOR_MODES.filter((m) => isCMYKMode(m.id));

  return (
    <div className="space-y-4">
      {/* RGB Section */}
      <div>
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
          <Monitor className="h-4 w-4" />
          <span>Digital (RGB)</span>
        </div>
        <div className="space-y-2">
          {rgbModes.map((mode) => (
            <ColorModeOption
              key={mode.id}
              mode={mode}
              isSelected={value === mode.id}
              onSelect={() => onChange(mode.id)}
              disabled={disabled}
            />
          ))}
        </div>
      </div>

      {/* CMYK Section */}
      <div>
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
          <Printer className="h-4 w-4" />
          <span>Print (CMYK)</span>
        </div>
        <div className="space-y-2">
          {cmykModes.map((mode) => (
            <ColorModeOption
              key={mode.id}
              mode={mode}
              isSelected={value === mode.id}
              onSelect={() => onChange(mode.id)}
              disabled={disabled}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface ColorModeOptionProps {
  mode: ColorModeInfo;
  isSelected: boolean;
  onSelect: () => void;
  disabled?: boolean;
}

function ColorModeOption({
  mode,
  isSelected,
  onSelect,
  disabled,
}: ColorModeOptionProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      className={cn(
        "w-full flex items-start gap-3 p-3 rounded-lg border transition-all text-left",
        isSelected
          ? "border-primary bg-primary/5 ring-1 ring-primary"
          : "border-border hover:border-primary/50 hover:bg-muted/50",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <div
        className={cn(
          "h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5",
          isSelected ? "border-primary bg-primary" : "border-muted-foreground"
        )}
      >
        {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm">{mode.name}</div>
        <div className="text-xs text-muted-foreground mt-0.5">
          {mode.description}
        </div>
        <div className="text-xs text-primary/80 mt-1">{mode.bestFor}</div>
      </div>
    </button>
  );
}
