'use client'

import { Palette } from 'lucide-react'

interface InlineStyleSectionProps {
  selectedStyle?: string
  onStyleChange: (style: string) => void
}

// 8 most popular/useful styles for quick access
const QUICK_STYLES = [
  { value: 'gradient', label: 'Gradient' },
  { value: 'flat', label: 'Flat Design' },
  { value: 'glass', label: 'Glassmorphism' },
  { value: 'photography', label: 'Photographic' },
  { value: 'geometric', label: 'Geometric' },
  { value: 'typography', label: 'Typography' },
  { value: '3d', label: '3D Isometric' },
  { value: 'illustration', label: 'Illustration' },
]

export function InlineStyleSection({ selectedStyle, onStyleChange }: InlineStyleSectionProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Palette className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">Style</span>
      </div>
      <div className="flex flex-wrap gap-1">
        {QUICK_STYLES.map((style) => (
          <button
            key={style.value}
            onClick={() => onStyleChange(style.value)}
            className={`px-2 py-0.5 text-[11px] rounded-full transition-all ${
              selectedStyle === style.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted/60 hover:bg-muted text-foreground'
            }`}
          >
            {style.label}
          </button>
        ))}
      </div>
    </div>
  )
}
