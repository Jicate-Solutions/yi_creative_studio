'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useDashboardStore } from '@/stores/dashboard-store'
import type { ActivityTimeline as TimelineType, DashboardCardId } from '@/types/dashboard.types'

import { StudioHero } from './studio-hero'
import { StudioVitals } from './studio-vitals'
import { QuickCreateHub } from './quick-create-hub'
import { InspirationSpark } from './inspiration-spark'
import { VisualDrafts } from './visual-drafts'

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

export function DashboardContent({ initialData, initialPreferences }: DashboardContentProps) {
  const {
    setCardOrder,
    setMonthlyGoal,
    _hasHydrated,
  } = useDashboardStore()

  // Sync initial preferences
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

  // Latest Creative Logic
  const latestCreative = initialData.recentCreatives.length > 0 ? initialData.recentCreatives[0] : null
  const galleryCreatives = initialData.recentCreatives // We can show all in gallery, visuals drafts will handle slice if needed

  return (
    <motion.div
      className="max-w-[1600px] mx-auto space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* 
         BENTO GRID ARCHITECTURE 
         Desktop: 4 Columns
         Tablet: 2 Columns
         Mobile: 1 Column
      */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-5 auto-rows-[minmax(100px,auto)]">

        {/* ZONE A: HERO (Span 3 Cols) */}
        <div className="md:col-span-3 lg:col-span-3 h-[180px] sm:h-[220px] md:h-[260px]">
          <StudioHero />
        </div>

        {/* ZONE B: VITALS (Span 1 Col) */}
        <div className="md:col-span-1 lg:col-span-1 h-[160px] sm:h-[200px] md:h-[260px]">
          <StudioVitals credits={initialData.credits} />
        </div>

        {/* ZONE C: CREATION HUB (Span 2 Cols) */}
        <div className="md:col-span-2 lg:col-span-2 min-h-[180px] lg:h-[380px]">
          <QuickCreateHub />
        </div>

        {/* ZONE D: INSPIRATION SPARK (Span 2 Cols) */}
        <div className="md:col-span-1 lg:col-span-2 min-h-[180px] lg:h-[380px]">
          <InspirationSpark />
        </div>
      </div>

      {/* ZONE E: GALLERY (Full Width) */}
      <div className="pt-5">
        <VisualDrafts creatives={galleryCreatives} />
      </div>

    </motion.div>
  )
}
