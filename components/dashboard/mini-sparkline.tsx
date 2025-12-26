'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'

interface MiniSparklineProps {
  data: number[]
  width?: number
  height?: number
  strokeWidth?: number
  className?: string
  color?: 'primary' | 'success' | 'warning' | 'muted'
  showArea?: boolean
  animate?: boolean
}

const COLOR_MAP = {
  primary: {
    stroke: 'stroke-primary',
    fill: 'fill-primary/20',
  },
  success: {
    stroke: 'stroke-success',
    fill: 'fill-success/20',
  },
  warning: {
    stroke: 'stroke-warning',
    fill: 'fill-warning/20',
  },
  muted: {
    stroke: 'stroke-muted-foreground',
    fill: 'fill-muted-foreground/10',
  },
}

export function MiniSparkline({
  data,
  width = 60,
  height = 24,
  strokeWidth = 1.5,
  className,
  color = 'primary',
  showArea = true,
  animate = true,
}: MiniSparklineProps) {
  const { linePath, areaPath } = useMemo(() => {
    if (!data || data.length < 2) {
      return { linePath: '', areaPath: '' }
    }

    const padding = strokeWidth
    const chartWidth = width - padding * 2
    const chartHeight = height - padding * 2

    const min = Math.min(...data)
    const max = Math.max(...data)
    const range = max - min || 1

    const points = data.map((value, index) => {
      const x = padding + (index / (data.length - 1)) * chartWidth
      const y = padding + chartHeight - ((value - min) / range) * chartHeight
      return { x, y }
    })

    // Create smooth curve using cubic bezier
    let linePath = `M ${points[0].x} ${points[0].y}`

    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1]
      const curr = points[i]
      const cpx = (prev.x + curr.x) / 2
      linePath += ` C ${cpx} ${prev.y}, ${cpx} ${curr.y}, ${curr.x} ${curr.y}`
    }

    // Create area path (closed shape)
    const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`

    return { linePath, areaPath }
  }, [data, width, height, strokeWidth])

  if (!data || data.length < 2) {
    return (
      <div
        className={cn('flex items-center justify-center', className)}
        style={{ width, height }}
      >
        <span className="text-[10px] text-muted-foreground">No data</span>
      </div>
    )
  }

  const colors = COLOR_MAP[color]

  return (
    <svg
      width={width}
      height={height}
      className={cn('overflow-visible', className)}
      viewBox={`0 0 ${width} ${height}`}
    >
      {/* Area fill */}
      {showArea && (
        <path
          d={areaPath}
          className={cn(colors.fill, animate && 'animate-fade-in')}
          style={{
            opacity: 0.5,
          }}
        />
      )}

      {/* Line stroke */}
      <path
        d={linePath}
        fill="none"
        className={cn(colors.stroke, animate && 'animate-draw-line')}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={
          animate
            ? {
                strokeDasharray: 1000,
                strokeDashoffset: 1000,
                animation: 'draw-line 1s ease-out forwards',
              }
            : undefined
        }
      />

      {/* End dot */}
      <circle
        cx={width - strokeWidth}
        cy={
          strokeWidth +
          (height - strokeWidth * 2) -
          ((data[data.length - 1] - Math.min(...data)) /
            (Math.max(...data) - Math.min(...data) || 1)) *
            (height - strokeWidth * 2)
        }
        r={2}
        className={cn(colors.stroke.replace('stroke-', 'fill-'))}
      />

      <style>{`
        @keyframes draw-line {
          to {
            stroke-dashoffset: 0;
          }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 0.5; }
        }
      `}</style>
    </svg>
  )
}

// Helper to generate sample data for demos
export function generateSparklineData(
  length: number = 7,
  trend: 'up' | 'down' | 'flat' | 'random' = 'random'
): number[] {
  const data: number[] = []
  let value = 50 + Math.random() * 20

  for (let i = 0; i < length; i++) {
    const trendBias =
      trend === 'up' ? 3 : trend === 'down' ? -3 : trend === 'flat' ? 0 : 0
    value += (Math.random() - 0.5) * 15 + trendBias
    value = Math.max(10, Math.min(90, value))
    data.push(Math.round(value))
  }

  return data
}
