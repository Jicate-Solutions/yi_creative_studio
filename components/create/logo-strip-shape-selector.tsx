'use client'

import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { useCreativeStore } from '@/stores/creative-store'
import {
  LOGO_STRIP_SHAPES,
  type LogoStripShape,
  DEFAULT_LOGO_STRIP_SHAPE,
} from '@/lib/config/design-constants'
import { Waves, Square, Slash, RectangleEllipsis, Triangle, Focus, Blend } from 'lucide-react'

// Icon mapping for logo strip shapes
const SHAPE_ICONS: Record<LogoStripShape, React.ReactNode> = {
  rectangle: <Square className="h-3.5 w-3.5" />,
  curved: <Waves className="h-3.5 w-3.5" />,
  angled: <Slash className="h-3.5 w-3.5" />,
  rounded: <RectangleEllipsis className="h-3.5 w-3.5" />,
  tapered: <Triangle className="h-3.5 w-3.5" />,
}

export function LogoStripShapeSelector() {
  const { formData, setLogoStripShape, setLogoStripOpacity, setLogoStripLogoBound } = useCreativeStore()

  // Get current strip settings
  const currentShape = formData.designData?.stripShape || DEFAULT_LOGO_STRIP_SHAPE
  const currentOpacity = formData.logoStripMode?.opacity ?? 100
  const isLogoBound = formData.logoStripMode?.logoBound ?? false

  // Only show if strip mode is enabled
  if (!formData.logoStripMode?.enabled) {
    return null
  }

  return (
    <div className="space-y-6">

      {/* Shape Grid - Visual Cards */}
      <div className="grid grid-cols-5 gap-2">
        {Object.values(LOGO_STRIP_SHAPES).map((shape) => {
          const isSelected = currentShape === shape.value
          return (
            <button
              key={shape.value}
              type="button"
              onClick={() => setLogoStripShape(shape.value)}
              className={cn(
                "group relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 p-3 transition-all duration-200 hover:scale-[1.02]",
                isSelected
                  ? "border-indigo-500 bg-indigo-50/50 shadow-sm dark:border-indigo-400 dark:bg-indigo-900/20"
                  : "border-transparent bg-white/50 hover:bg-white/80 dark:bg-white/5 dark:hover:bg-white/10"
              )}
              title={shape.description}
            >
              <div className={cn(
                "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
                isSelected ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300" : "bg-slate-100 text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-500 dark:bg-slate-800 dark:group-hover:bg-slate-700"
              )}>
                {SHAPE_ICONS[shape.value]}
              </div>
              <span className={cn(
                "text-[10px] font-medium capitalize",
                isSelected ? "text-indigo-700 dark:text-indigo-300" : "text-slate-500 group-hover:text-slate-700 dark:text-slate-400"
              )}>
                {shape.value}
              </span>
            </button>
          )
        })}
      </div>

      {/* Adjustments: Transparency & Fit */}
      <div className="grid grid-cols-2 gap-4">
        {/* Transparency */}
        <div className="rounded-xl border border-indigo-100/50 bg-white/40 p-3 backdrop-blur-sm dark:border-indigo-500/10 dark:bg-white/5">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300">
              <Blend className="h-3.5 w-3.5 text-indigo-500" />
              Opacity
            </div>
            <span className="font-mono text-[10px] text-slate-500">
              {currentOpacity}%
            </span>
          </div>
          <Slider
            value={[currentOpacity]}
            onValueChange={([value]) => setLogoStripOpacity(value)}
            min={10}
            max={100}
            step={5}
            className="py-1"
          />
        </div>

        {/* Fit to Content */}
        <div className="flex items-center justify-between rounded-xl border border-indigo-100/50 bg-white/40 p-3 backdrop-blur-sm dark:border-indigo-500/10 dark:bg-white/5">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300">
              <Focus className="h-3.5 w-3.5 text-indigo-500" />
              Fit Width
            </div>
            <p className="text-[9px] text-slate-500">Wrap logos only</p>
          </div>
          <Switch
            checked={isLogoBound}
            onCheckedChange={setLogoStripLogoBound}
            className="h-5 w-9"
          />
        </div>
      </div>
    </div>
  )
}
