"use client";

import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Smartphone,
  Printer,
  Zap,
  Settings,
  type LucideIcon,
} from "lucide-react";
import type { ExportPurpose, ExportPurposeInfo } from "@/types/export";
import { EXPORT_PURPOSES } from "@/types/export";

interface PurposeSelectorProps {
  value: ExportPurpose;
  onChange: (purpose: ExportPurpose) => void;
  disabled?: boolean;
}

// Map icon strings to Lucide components
const ICON_MAP: Record<string, LucideIcon> = {
  smartphone: Smartphone,
  printer: Printer,
  zap: Zap,
  settings: Settings,
};

// Color schemes for each purpose
const PURPOSE_COLORS: Record<ExportPurpose, { bg: string; border: string; icon: string }> = {
  social: {
    bg: "bg-blue-50 dark:bg-blue-950/30",
    border: "border-blue-200 dark:border-blue-800",
    icon: "text-blue-600 dark:text-blue-400",
  },
  print: {
    bg: "bg-amber-50 dark:bg-amber-950/30",
    border: "border-amber-200 dark:border-amber-800",
    icon: "text-amber-600 dark:text-amber-400",
  },
  quick: {
    bg: "bg-green-50 dark:bg-green-950/30",
    border: "border-green-200 dark:border-green-800",
    icon: "text-green-600 dark:text-green-400",
  },
  custom: {
    bg: "bg-purple-50 dark:bg-purple-950/30",
    border: "border-purple-200 dark:border-purple-800",
    icon: "text-purple-600 dark:text-purple-400",
  },
};

function PurposeCard({
  purpose,
  isSelected,
  onClick,
  disabled,
}: {
  purpose: ExportPurposeInfo;
  isSelected: boolean;
  onClick: () => void;
  disabled: boolean;
}) {
  const Icon = ICON_MAP[purpose.icon] || Zap;
  const colors = PURPOSE_COLORS[purpose.id];

  return (
    <Card
      onClick={disabled ? undefined : onClick}
      className={cn(
        "relative cursor-pointer transition-all duration-200",
        "hover:shadow-md hover:scale-[1.02]",
        isSelected
          ? "ring-2 ring-primary ring-offset-2 shadow-md"
          : "border-2 border-transparent hover:border-muted-foreground/20",
        disabled && "opacity-50 cursor-not-allowed pointer-events-none"
      )}
    >
      <CardContent className={cn("p-4", isSelected && colors.bg)}>
        {/* Icon */}
        <div
          className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center mb-3",
            isSelected ? colors.bg : "bg-muted/50",
            isSelected && colors.border,
            isSelected && "border"
          )}
        >
          <Icon
            className={cn(
              "h-5 w-5",
              isSelected ? colors.icon : "text-muted-foreground"
            )}
          />
        </div>

        {/* Title */}
        <h3
          className={cn(
            "font-semibold text-sm mb-1",
            isSelected ? "text-foreground" : "text-foreground/80"
          )}
        >
          {purpose.name}
        </h3>

        {/* Description */}
        <p className="text-xs text-muted-foreground mb-3 line-clamp-1">
          {purpose.description}
        </p>

        {/* Estimated Size Badge */}
        <Badge
          variant={isSelected ? "default" : "secondary"}
          className={cn(
            "text-[10px] font-medium",
            isSelected && "bg-primary/90"
          )}
        >
          {purpose.estimatedSizeLabel}
        </Badge>

        {/* Selected Indicator */}
        {isSelected && (
          <div className="absolute top-2 right-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function PurposeSelector({
  value,
  onChange,
  disabled = false,
}: PurposeSelectorProps) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-muted-foreground">
        What will you use this for?
      </p>
      <div className="grid grid-cols-2 gap-3">
        {EXPORT_PURPOSES.map((purpose) => (
          <PurposeCard
            key={purpose.id}
            purpose={purpose}
            isSelected={value === purpose.id}
            onClick={() => onChange(purpose.id)}
            disabled={disabled}
          />
        ))}
      </div>
    </div>
  );
}
