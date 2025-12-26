'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card } from '@/components/ui/card'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Coins, ImageIcon, TrendingUp, TrendingDown, Minus, Zap, ChevronRight, GripVertical } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useDashboardStore, useCardOrder, useExpandedCard } from '@/stores/dashboard-store'
import type { DashboardCardId, StatCard, StatCardDetails } from '@/types/dashboard.types'
import { MiniSparkline } from './mini-sparkline'

// Icon mapping
const CARD_ICONS: Record<DashboardCardId, typeof Coins> = {
  credits: Coins,
  creatives: ImageIcon,
  monthly: TrendingUp,
  speed: Zap,
}

// Gradient mapping with dark mode support
const CARD_GRADIENTS: Record<DashboardCardId, string> = {
  credits: 'from-yellow-500/20 via-yellow-400/10 to-transparent dark:from-yellow-400/30 dark:via-yellow-500/15',
  creatives: 'from-primary/20 via-primary/10 to-transparent dark:from-[#0077BB]/30 dark:via-[#1B998B]/15',
  monthly: 'from-green-500/20 via-green-400/10 to-transparent dark:from-emerald-400/30 dark:via-green-500/15',
  speed: 'from-purple-500/20 via-purple-400/10 to-transparent dark:from-purple-400/30 dark:via-purple-500/15',
}

// Sparkline color mapping
const SPARKLINE_COLORS: Record<DashboardCardId, 'primary' | 'success' | 'warning' | 'muted'> = {
  credits: 'warning',
  creatives: 'primary',
  monthly: 'success',
  speed: 'primary',
}

// Trend data type
export interface StatTrend {
  value: number // Percentage change
  direction: 'up' | 'down' | 'neutral'
  label?: string // e.g., "vs last week"
  sparklineData?: number[] // Historical data points
}

interface DraggableStatsProps {
  stats: {
    credits: { value: number; subtitle: string; details?: StatCardDetails; trend?: StatTrend }
    creatives: { value: number; subtitle: string; details?: StatCardDetails; trend?: StatTrend }
    monthly: { value: number; subtitle: string; details?: StatCardDetails; trend?: StatTrend }
    speed: { value: string; subtitle: string; details?: StatCardDetails; trend?: StatTrend }
  }
  onReorder?: (newOrder: DashboardCardId[]) => void
  className?: string
  showSparklines?: boolean
}

export function DraggableStats({ stats, onReorder, className, showSparklines = true }: DraggableStatsProps) {
  const cardOrder = useCardOrder()
  const { setCardOrder } = useDashboardStore()
  const [activeId, setActiveId] = useState<DashboardCardId | null>(null)
  const [localOrder, setLocalOrder] = useState(cardOrder)

  // Sync local state with store
  useEffect(() => {
    setLocalOrder(cardOrder)
  }, [cardOrder])

  // Configure sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Build cards array from stats with trend data
  const cards: (StatCard & { trend?: StatTrend; sparklineColor: 'primary' | 'success' | 'warning' | 'muted' })[] = localOrder.map((id) => ({
    id,
    title: getCardTitle(id),
    value: id === 'speed' ? stats.speed.value : stats[id].value,
    subtitle: stats[id].subtitle,
    icon: id,
    gradient: CARD_GRADIENTS[id],
    details: stats[id].details,
    trend: stats[id].trend,
    sparklineColor: SPARKLINE_COLORS[id],
  }))

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as DashboardCardId)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (over && active.id !== over.id) {
      const oldIndex = localOrder.indexOf(active.id as DashboardCardId)
      const newIndex = localOrder.indexOf(over.id as DashboardCardId)

      const newOrder = arrayMove(localOrder, oldIndex, newIndex)
      setLocalOrder(newOrder)
      setCardOrder(newOrder)
      onReorder?.(newOrder)
    }
  }

  const activeCard = activeId ? cards.find(c => c.id === activeId) : null

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={localOrder} strategy={rectSortingStrategy}>
        <div className={cn(
          'grid grid-cols-2 lg:grid-cols-4 gap-4',
          className
        )}>
          {cards.map((card, index) => (
            <SortableStatCard
              key={card.id}
              card={card}
              index={index}
              isActive={activeId === card.id}
              showSparkline={showSparklines}
            />
          ))}
        </div>
      </SortableContext>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeCard && (
          <StatCardContent
            card={activeCard}
            isDragging
            index={0}
          />
        )}
      </DragOverlay>
    </DndContext>
  )
}

// Sortable Card Wrapper
interface SortableStatCardProps {
  card: StatCard & { trend?: StatTrend; sparklineColor: 'primary' | 'success' | 'warning' | 'muted' }
  index: number
  isActive: boolean
  showSparkline?: boolean
}

function SortableStatCard({ card, index, isActive, showSparkline }: SortableStatCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative',
        isDragging && 'opacity-50'
      )}
    >
      <StatCardContent
        card={card}
        index={index}
        dragHandleProps={{ ...attributes, ...listeners }}
        isActive={isActive}
        showSparkline={showSparkline}
      />
    </div>
  )
}

// Card Content Component
interface StatCardContentProps {
  card: StatCard & { trend?: StatTrend; sparklineColor?: 'primary' | 'success' | 'warning' | 'muted' }
  index: number
  isDragging?: boolean
  isActive?: boolean
  dragHandleProps?: Record<string, unknown>
  showSparkline?: boolean
}

function StatCardContent({ card, index, isDragging, isActive, dragHandleProps, showSparkline = true }: StatCardContentProps) {
  const { expandedCard, setExpandedCard } = useExpandedCard()
  const isExpanded = expandedCard === card.id
  const Icon = CARD_ICONS[card.id]

  // Animated counter
  const [displayValue, setDisplayValue] = useState(0)
  const numericValue = typeof card.value === 'number' ? card.value : null

  useEffect(() => {
    if (numericValue !== null) {
      // Animate from 0 to value
      const duration = 1000
      const steps = 30
      const increment = numericValue / steps
      let current = 0
      const timer = setInterval(() => {
        current += increment
        if (current >= numericValue) {
          setDisplayValue(numericValue)
          clearInterval(timer)
        } else {
          setDisplayValue(Math.floor(current))
        }
      }, duration / steps)

      return () => clearInterval(timer)
    }
  }, [numericValue])

  // Trend indicator
  const TrendIcon = card.trend?.direction === 'up'
    ? TrendingUp
    : card.trend?.direction === 'down'
      ? TrendingDown
      : Minus

  const trendColorClass = card.trend?.direction === 'up'
    ? 'text-success bg-success/10'
    : card.trend?.direction === 'down'
      ? 'text-destructive bg-destructive/10'
      : 'text-muted-foreground bg-muted'

  return (
    <Card
      darkVariant="elevated"
      interactive
      className={cn(
        'px-5 cursor-pointer group relative overflow-hidden',
        isDragging && 'shadow-2xl ring-2 ring-primary/20',
        isActive && 'ring-2 ring-primary/30'
      )}
      asChild
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        whileHover={{ y: -2, scale: 1.02 }}
        onClick={() => setExpandedCard(isExpanded ? null : card.id)}
        layout
      >
      {/* Background Gradient */}
      <div className={cn(
        'absolute inset-0 bg-gradient-to-br opacity-50',
        card.gradient
      )} />

      {/* Drag Handle */}
      <div
        {...dragHandleProps}
        className={cn(
          'absolute top-2 right-2 p-1.5 rounded-md opacity-0 group-hover:opacity-100',
          'transition-opacity cursor-grab active:cursor-grabbing',
          'hover:bg-muted/50'
        )}
        onClick={(e) => e.stopPropagation()}
        suppressHydrationWarning
      >
        <GripVertical className="w-4 h-4 text-muted-foreground" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header Row: Icon + Sparkline */}
        <div className="flex items-start justify-between mb-3">
          {/* Icon */}
          <div className="w-10 h-10 rounded-lg bg-background/50 flex items-center justify-center">
            <Icon className="w-5 h-5 text-foreground" />
          </div>

          {/* Sparkline (if available) */}
          {showSparkline && card.trend?.sparklineData && (
            <MiniSparkline
              data={card.trend.sparklineData}
              color={card.sparklineColor || 'primary'}
              width={56}
              height={24}
              className="opacity-70 group-hover:opacity-100 transition-opacity"
            />
          )}
        </div>

        {/* Value Row: Value + Trend */}
        <div className="flex items-baseline gap-2 mb-1">
          {/* Value with count-up animation */}
          <motion.div
            className="text-2xl font-bold text-foreground"
            key={displayValue}
          >
            {numericValue !== null ? displayValue.toLocaleString() : card.value}
          </motion.div>

          {/* Trend Badge */}
          {card.trend && (
            <span className={cn(
              'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium',
              trendColorClass
            )}>
              <TrendIcon className="w-2.5 h-2.5" />
              {Math.abs(card.trend.value)}%
            </span>
          )}
        </div>

        {/* Title */}
        <div className="text-sm font-medium text-foreground/80 mb-0.5">
          {card.title}
        </div>

        {/* Subtitle + Trend Label */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{card.subtitle}</span>
          {card.trend?.label && (
            <>
              <span className="text-muted-foreground/50">•</span>
              <span>{card.trend.label}</span>
            </>
          )}
        </div>

        {/* Expand indicator */}
        {card.details && (
          <motion.div
            className="absolute bottom-3 right-3"
            animate={{ rotate: isExpanded ? 90 : 0 }}
          >
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </motion.div>
        )}
      </div>

      {/* Expanded Details */}
      <AnimatePresence>
        {isExpanded && card.details && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="relative z-10 mt-4 pt-4 border-t border-border/50"
          >
            <h4 className="text-sm font-semibold text-foreground mb-2">
              {card.details.title}
            </h4>
            <div className="space-y-1.5">
              {card.details.items.map((item, i) => (
                <div key={i} className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-medium text-foreground">{item.value}</span>
                </div>
              ))}
            </div>
            {card.details.actions && (
              <div className="flex gap-2 mt-3">
                {card.details.actions.map((action, i) => (
                  <a
                    key={i}
                    href={action.href}
                    className="text-xs text-primary hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {action.label}
                  </a>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      </motion.div>
    </Card>
  )
}

// Helper function
function getCardTitle(id: DashboardCardId): string {
  const titles: Record<DashboardCardId, string> = {
    credits: 'Credits Balance',
    creatives: 'Total Creatives',
    monthly: 'Monthly Usage',
    speed: 'Avg. Speed',
  }
  return titles[id]
}
