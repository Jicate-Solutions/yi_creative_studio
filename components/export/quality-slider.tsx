"use client";

import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

interface QualitySliderProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export function QualitySlider({
  value,
  onChange,
  disabled = false,
}: QualitySliderProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">JPEG Quality</Label>
        <span className="text-sm text-muted-foreground">{value}%</span>
      </div>
      <Slider
        value={[value]}
        onValueChange={([val]) => onChange(val)}
        min={1}
        max={100}
        step={1}
        disabled={disabled}
        className="w-full"
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Smaller file</span>
        <span>Higher quality</span>
      </div>
    </div>
  );
}
