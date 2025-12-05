"use client";

import { cn } from "@/lib/utils";
import { Monitor, Printer } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ColorMode } from "@/types/export";
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
  const isRGB = value === "rgb";
  const isCMYK = isCMYKMode(value);

  // Get CMYK modes for the profile selector
  const cmykModes = COLOR_MODES.filter((m) => isCMYKMode(m.id));

  // Determine active tab
  const activeTab = isRGB ? "digital" : "print";

  const handleTabChange = (tab: string) => {
    if (tab === "digital") {
      onChange("rgb");
    } else if (tab === "print" && !isCMYK) {
      onChange("cmyk-fogra39"); // Default CMYK profile
    }
  };

  return (
    <Tabs
      value={activeTab}
      onValueChange={handleTabChange}
      className="w-full"
    >
      <TabsList className="grid w-full grid-cols-2 h-12">
        <TabsTrigger
          value="digital"
          disabled={disabled}
          className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
        >
          <Monitor className="h-4 w-4" />
          <span className="font-medium">Digital</span>
        </TabsTrigger>
        <TabsTrigger
          value="print"
          disabled={disabled}
          className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
        >
          <Printer className="h-4 w-4" />
          <span className="font-medium">Print</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="digital" className="mt-3">
        <div className="p-3 rounded-lg bg-muted/50 border">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-gradient-to-r from-red-500 via-green-500 to-blue-500" />
            <span className="text-sm font-medium">RGB (sRGB)</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Perfect for web, social media & digital screens
          </p>
        </div>
      </TabsContent>

      <TabsContent value="print" className="mt-3 space-y-3">
        <div className="p-3 rounded-lg bg-muted/50 border">
          <div className="flex items-center gap-2">
            <div className="flex gap-0.5">
              <div className="h-3 w-3 rounded-full bg-cyan-500" />
              <div className="h-3 w-3 rounded-full bg-magenta-500" />
              <div className="h-3 w-3 rounded-full bg-yellow-500" />
              <div className="h-3 w-3 rounded-full bg-black" />
            </div>
            <span className="text-sm font-medium">CMYK</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Professional print-ready color profile
          </p>
        </div>

        {/* CMYK Profile Selector */}
        <Select
          value={value}
          onValueChange={(val) => onChange(val as ColorMode)}
          disabled={disabled}
        >
          <SelectTrigger className="h-10">
            <SelectValue placeholder="Select print profile" />
          </SelectTrigger>
          <SelectContent>
            {cmykModes.map((mode) => (
              <SelectItem key={mode.id} value={mode.id}>
                <div className="flex flex-col">
                  <span className="font-medium">{mode.name.replace('CMYK ', '')}</span>
                  <span className="text-xs text-muted-foreground">{mode.bestFor.split(',')[0]}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TabsContent>
    </Tabs>
  );
}
