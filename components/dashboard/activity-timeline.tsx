'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar, ChevronDown, ImageIcon, Coins, Award, TrendingUp,
  BarChart3, Flame, Target, ArrowUpRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { CalendarHeatmap, generateSampleHeatmapData } from './calendar-heatmap'
import type { ActivityTimeline, WeeklyChapter, DailyActivity } from '@/types/dashboard.types'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface ActivityTimelineProps {
  timeline: ActivityTimeline
  className?: string
}

export function ActivityTimelineComponent({ timeline, className }: ActivityTimelineProps) {
  const [expandedChapter, setExpandedChapter] = useState<string | null>(
    // Auto-expand current week
    timeline.chapters.find(c => c.isCurrentWeek)?.id || null
  )
  const [showHeatmap, setShowHeatmap] = useState(true)

  const toggleChapter = (id: string) => {
    setExpandedChapter(expandedChapter === id ? null : id)
  }

  // Generate heatmap data if not provided
  const heatmapData = timeline.heatmapData || generateSampleHeatmapData()

  // Calculate streak
  const currentStreak = calculateStreak(heatmapData)

  return (
    <div className={cn('glass-card rounded-xl overflow-hidden', className)}>
      {/* Header */}
      <div className="p-5 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">
                Creative Journey
              </h3>
              <p className="text-sm text-muted-foreground">
                {timeline.monthName}
              </p>
            </div>
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-lg">
            <button
              onClick={() => setShowHeatmap(true)}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
                showHeatmap
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <BarChart3 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setShowHeatmap(false)}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
                !showHeatmap
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Calendar className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Heatmap View */}
      <AnimatePresence mode="wait">
        {showHeatmap && (
          <motion.div
            key="heatmap"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="p-5 border-b border-border/50"
          >
            <CalendarHeatmap
              data={heatmapData}
              showDayLabels
              colorScheme="gradient"
            />

            {/* Quick Stats Row */}
            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border/30">
              {/* Streak */}
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-orange-500/10">
                  <Flame className="w-4 h-4 text-orange-500" />
                </div>
                <div>
                  <div className="text-sm font-bold text-foreground">
                    {currentStreak} day{currentStreak !== 1 ? 's' : ''}
                  </div>
                  <div className="text-[10px] text-muted-foreground">Current streak</div>
                </div>
              </div>

              {/* Total */}
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-primary/10">
                  <Target className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <div className="text-sm font-bold text-foreground">
                    {timeline.summary.totalCreatives}
                  </div>
                  <div className="text-[10px] text-muted-foreground">This month</div>
                </div>
              </div>

              {/* Avg per day */}
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-green-500/10">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                </div>
                <div>
                  <div className="text-sm font-bold text-foreground">
                    {timeline.summary.averagePerDay}
                  </div>
                  <div className="text-[10px] text-muted-foreground">Avg/day</div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Summary Stats (non-heatmap view) */}
      <AnimatePresence mode="wait">
        {!showHeatmap && (
          <motion.div
            key="summary"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="p-5 border-b border-border/50"
          >
            <div className="grid grid-cols-4 gap-3">
              <div className="text-center p-3 rounded-lg bg-muted/30">
                <div className="text-lg font-bold text-foreground">
                  {timeline.summary.totalCreatives}
                </div>
                <div className="text-[10px] text-muted-foreground">Total</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/30">
                <div className="text-lg font-bold text-foreground">
                  {timeline.summary.averagePerDay}
                </div>
                <div className="text-[10px] text-muted-foreground">Avg/Day</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/30">
                <div className="text-lg font-bold text-orange-500">
                  {currentStreak}
                </div>
                <div className="text-[10px] text-muted-foreground">Streak</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/30">
                <div className={cn(
                  'text-lg font-bold',
                  timeline.summary.onTrackForGoal ? 'text-green-600' : 'text-amber-600'
                )}>
                  {timeline.summary.onTrackForGoal ? '✓' : '—'}
                </div>
                <div className="text-[10px] text-muted-foreground">On Track</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Weekly Chapters */}
      <div className="p-5">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Weekly Chapters
          </h4>
          <span className="text-xs text-muted-foreground">
            {timeline.chapters.filter(c => !c.isFutureWeek).length} weeks
          </span>
        </div>

        <div className="space-y-2">
          {timeline.chapters.map((chapter, index) => (
            <ChapterCard
              key={chapter.id}
              chapter={chapter}
              index={index}
              isExpanded={expandedChapter === chapter.id}
              onToggle={() => toggleChapter(chapter.id)}
            />
          ))}

          {timeline.chapters.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p>No creatives this month yet.</p>
              <p className="text-sm mt-1">Start creating to see your journey!</p>
              <Button asChild size="sm" className="mt-4">
                <Link href="/create">
                  Create Now
                  <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Chapter Card Component
interface ChapterCardProps {
  chapter: WeeklyChapter
  index: number
  isExpanded: boolean
  onToggle: () => void
}

function ChapterCard({ chapter, index, isExpanded, onToggle }: ChapterCardProps) {
  const hasStats = chapter.stats.creativesGenerated > 0

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className={cn(
        'rounded-xl border transition-all duration-200 overflow-hidden',
        chapter.isCurrentWeek
          ? 'border-primary/30 bg-primary/5 shadow-sm'
          : chapter.isFutureWeek
            ? 'border-border/30 bg-muted/20 opacity-50'
            : 'border-border/50 hover:border-border hover:bg-muted/20'
      )}
    >
      {/* Chapter Header */}
      <button
        className="w-full p-3 flex items-center gap-3 text-left"
        onClick={onToggle}
        disabled={chapter.isFutureWeek}
      >
        {/* Chapter Number */}
        <div className={cn(
          'w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold transition-colors',
          chapter.isCurrentWeek
            ? 'bg-primary text-primary-foreground'
            : hasStats
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-muted text-muted-foreground'
        )}>
          {chapter.weekNumber}
        </div>

        {/* Chapter Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-foreground">
              {chapter.title}
            </span>
            {chapter.isCurrentWeek && (
              <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-primary/20 text-primary animate-pulse">
                NOW
              </span>
            )}
          </div>
          <div className="text-xs text-muted-foreground">
            {chapter.dateRange.start} - {chapter.dateRange.end}
          </div>
        </div>

        {/* Stats Preview */}
        <div className="flex items-center gap-3 text-sm">
          <div className={cn(
            'flex items-center gap-1.5 px-2 py-1 rounded-md',
            hasStats ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-muted text-muted-foreground'
          )}>
            <ImageIcon className="w-3.5 h-3.5" />
            <span className="font-semibold text-xs">{chapter.stats.creativesGenerated}</span>
          </div>

          {!chapter.isFutureWeek && (
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="text-muted-foreground"
            >
              <ChevronDown className="w-4 h-4" />
            </motion.div>
          )}
        </div>
      </button>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1">
              {hasStats ? (
                <>
                  {/* Mini heatmap for the week */}
                  {chapter.dailyActivity && chapter.dailyActivity.length > 0 && (
                    <div className="mb-4 p-3 rounded-lg bg-muted/30">
                      <div className="text-[10px] text-muted-foreground mb-2 font-medium">
                        Daily Activity
                      </div>
                      <div className="flex gap-1">
                        {chapter.dailyActivity.map((day, i) => (
                          <div
                            key={i}
                            className={cn(
                              'flex-1 h-8 rounded-md transition-colors flex items-end justify-center pb-1',
                              day.count === 0
                                ? 'bg-muted/50'
                                : day.count <= 2
                                  ? 'bg-primary/30'
                                  : day.count <= 4
                                    ? 'bg-primary/50'
                                    : 'bg-primary/70'
                            )}
                            title={`${day.date}: ${day.count} creatives`}
                          >
                            <span className="text-[9px] font-medium text-foreground/60">
                              {['S', 'M', 'T', 'W', 'T', 'F', 'S'][day.dayOfWeek]}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-2">
                    {/* Creatives */}
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-green-50 dark:bg-green-900/20">
                      <div className="p-1.5 rounded-md bg-green-100 dark:bg-green-900/40">
                        <ImageIcon className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-green-700 dark:text-green-400">
                          {chapter.stats.creativesGenerated}
                        </div>
                        <div className="text-[10px] text-green-600/70 dark:text-green-400/70">
                          Creatives
                        </div>
                      </div>
                    </div>

                    {/* Credits */}
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20">
                      <div className="p-1.5 rounded-md bg-amber-100 dark:bg-amber-900/40">
                        <Coins className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-amber-700 dark:text-amber-400">
                          {chapter.stats.creditsUsed}
                        </div>
                        <div className="text-[10px] text-amber-600/70 dark:text-amber-400/70">
                          Credits
                        </div>
                      </div>
                    </div>

                    {/* Most Used Format */}
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/5">
                      <div className="p-1.5 rounded-md bg-primary/10">
                        <TrendingUp className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-primary truncate max-w-[80px]">
                          {chapter.stats.mostUsedFormat}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          Top Format
                        </div>
                      </div>
                    </div>

                    {/* Best Day */}
                    {chapter.stats.bestDay && (
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                        <div className="p-1.5 rounded-md bg-purple-100 dark:bg-purple-900/40">
                          <Award className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-purple-700 dark:text-purple-400">
                            {chapter.stats.bestDay.day}
                          </div>
                          <div className="text-[10px] text-purple-600/70 dark:text-purple-400/70">
                            Best ({chapter.stats.bestDay.count})
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <p className="text-sm">No activity this week</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// Helper function to calculate current streak
function calculateStreak(data: DailyActivity[]): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  let streak = 0
  const sortedData = [...data].sort((a, b) => {
    // Sort by date descending (most recent first)
    return new Date(b.date).getTime() - new Date(a.date).getTime()
  })

  // Find consecutive days with activity, starting from today or yesterday
  let checkingFromToday = true
  for (const day of sortedData) {
    if (day.count > 0) {
      streak++
    } else {
      // Allow one gap if we haven't counted today yet (still in progress)
      if (checkingFromToday && day.isToday) {
        checkingFromToday = false
        continue
      }
      break
    }
  }

  return streak
}

// Alias for shorter import
export { ActivityTimelineComponent as ActivityTimeline }
