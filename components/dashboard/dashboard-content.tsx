'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  Images, Sparkles, Activity, Layers,
  Coins, TrendingUp, Calendar, Clock, ChevronRight
} from 'lucide-react'
import { GoalModal } from './goal-modal'
import { Celebration } from './celebration'
import { useDashboardStore } from '@/stores/dashboard-store'
import { ROUTES } from '@/lib/config/constants'
import type { ActivityTimeline as TimelineType, DashboardCardId } from '@/types/dashboard.types'

interface DashboardContentProps {
  initialData: {
    credits: {
      balance: number
      used: number
    }
    creatives: {
      total: number
      thisMonth: number
      thisWeek: number
      today: number
    }
    monthly: {
      creditsUsed: number
      percentageChange: number
    }
    speed: {
      average: string
    }
    timeline: TimelineType
    recentCreatives: Array<{
      id: string
      title: string | null
      vertical: string | null
      creative_type: string | null
      created_at: string
      image_url: string | null
      thumbnail_url: string | null
    }>
  }
  initialPreferences?: {
    card_order: DashboardCardId[]
    monthly_goal: number
  }
}

import { StudioHero } from './studio-hero'
import { VisualDrafts } from './visual-drafts'

export function DashboardContent({ initialData, initialPreferences }: DashboardContentProps) {
  const {
    setCardOrder,
    setMonthlyGoal,
    monthlyGoal,
    _hasHydrated,
  } = useDashboardStore()

  // Sync initial preferences to store on mount
  useEffect(() => {
    if (initialPreferences && _hasHydrated) {
      if (JSON.stringify(initialPreferences.card_order) !== JSON.stringify(useDashboardStore.getState().cardOrder)) {
        setCardOrder(initialPreferences.card_order)
      }
      if (initialPreferences.monthly_goal !== useDashboardStore.getState().monthlyGoal) {
        setMonthlyGoal(initialPreferences.monthly_goal)
      }
    }
  }, [initialPreferences, _hasHydrated, setCardOrder, setMonthlyGoal])

  // Handle card reorder - save to API
  const handleReorder = async (newOrder: DashboardCardId[]) => {
    try {
      await fetch('/api/dashboard/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ card_order: newOrder }),
      })
    } catch (error) {
      console.error('Failed to save card order:', error)
    }
  }

  // Handle goal save - save to API
  const handleGoalSave = async (goal: number) => {
    try {
      await fetch('/api/dashboard/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monthly_goal: goal }),
      })
    } catch (error) {
      console.error('Failed to save goal:', error)
      throw error
    }
  }

  // "Accountant" stats - kept in memory but not displayed in Studio Mode
  // We can eventually move these to an /analytics page

  return (
    <>
      <Celebration />
      <GoalModal onSave={handleGoalSave} />

      <motion.div
        className="space-y-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Zone 1: The Studio Canvas (Hero) */}
        <StudioHero />

        {/* Zone 2: Premium Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          {/* Card 1: Credits - Premium Gold Accent */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="group relative overflow-hidden rounded-2xl glass-card hover:shadow-xl transition-all duration-500"
          >
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-yellow-400/5 to-transparent dark:from-amber-400/20 dark:via-yellow-500/10 opacity-60 group-hover:opacity-100 transition-opacity" />
            {/* Glow effect */}
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-400/20 dark:bg-amber-400/30 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

            <div className="relative z-10 p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-yellow-400/10 dark:from-amber-400/30 dark:to-yellow-500/20 flex items-center justify-center shadow-inner">
                  <Coins className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <TrendingUp className="w-4 h-4 text-green-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="text-3xl font-black text-foreground tracking-tight">{initialData.credits.balance.toLocaleString()}</div>
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-widest mt-1">Credits Available</div>
            </div>
          </motion.div>

          {/* Card 2: Monthly Creatives - Primary Blue Accent */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="group relative overflow-hidden rounded-2xl glass-card hover:shadow-xl transition-all duration-500"
          >
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-blue-400/5 to-transparent dark:from-primary/20 dark:via-blue-500/10 opacity-60 group-hover:opacity-100 transition-opacity" />
            {/* Glow effect */}
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/20 dark:bg-primary/30 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

            <div className="relative z-10 p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-blue-400/10 dark:from-primary/30 dark:to-blue-500/20 flex items-center justify-center shadow-inner">
                  <Calendar className="w-5 h-5 text-primary dark:text-blue-400" />
                </div>
                <span className="text-[10px] font-bold text-primary/70 dark:text-blue-400/70 uppercase tracking-wider">This Month</span>
              </div>
              <div className="text-3xl font-black text-foreground tracking-tight">{initialData.creatives.thisMonth}</div>
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-widest mt-1">Creatives Made</div>
            </div>
          </motion.div>

          {/* Card 3: Quick Actions - Interactive Premium Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="group relative overflow-hidden rounded-2xl glass-card hover:shadow-xl transition-all duration-500"
          >
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-pink-400/5 to-transparent dark:from-purple-400/20 dark:via-pink-500/10 opacity-60 group-hover:opacity-100 transition-opacity" />

            <div className="relative z-10 p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Quick Access</div>
                <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
              </div>
              <div className="flex gap-2">
                <Link
                  href={ROUTES.gallery}
                  className="flex-1 p-3 rounded-xl bg-background/60 dark:bg-white/5 hover:bg-primary/10 dark:hover:bg-primary/20 hover:text-primary border border-transparent hover:border-primary/20 transition-all duration-300 flex items-center justify-center group/btn"
                >
                  <Images className="h-5 w-5 group-hover/btn:scale-110 transition-transform" />
                </Link>
                <Link
                  href={ROUTES.templates}
                  className="flex-1 p-3 rounded-xl bg-background/60 dark:bg-white/5 hover:bg-secondary/10 dark:hover:bg-secondary/20 hover:text-secondary border border-transparent hover:border-secondary/20 transition-all duration-300 flex items-center justify-center group/btn"
                >
                  <Layers className="h-5 w-5 group-hover/btn:scale-110 transition-transform" />
                </Link>
                <Link
                  href={ROUTES.create}
                  className="flex-1 p-3 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 dark:from-primary/30 dark:to-secondary/30 hover:from-primary/30 hover:to-secondary/30 text-primary dark:text-white border border-primary/20 transition-all duration-300 flex items-center justify-center group/btn"
                >
                  <Sparkles className="h-5 w-5 group-hover/btn:scale-110 group-hover/btn:rotate-12 transition-transform" />
                </Link>
              </div>
            </div>
          </motion.div>

          {/* Card 4: Studio Status - Live Status Premium Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="group relative overflow-hidden rounded-2xl glass-card hover:shadow-xl transition-all duration-500"
          >
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-green-400/5 to-transparent dark:from-emerald-400/20 dark:via-green-500/10 opacity-60 group-hover:opacity-100 transition-opacity" />
            {/* Glow effect */}
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-400/20 dark:bg-emerald-400/30 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

            <div className="relative z-10 p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-green-400/10 dark:from-emerald-400/30 dark:to-green-500/20 flex items-center justify-center shadow-inner">
                  <Activity className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                {/* Premium pulse indicator */}
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></span>
                  </span>
                </div>
              </div>
              <div className="text-lg font-bold text-foreground">All Systems Go</div>
              <div className="flex items-center gap-2 mt-1">
                <Clock className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">~30s avg response</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Zone 3: Visual Drafts (Recent Work) - Bottom Section */}
        <div className="pt-4 pb-8">
          <VisualDrafts creatives={initialData.recentCreatives} />
        </div>
      </motion.div>
    </>
  )
}
