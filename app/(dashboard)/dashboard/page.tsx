import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Clock, Images } from 'lucide-react'
import { ROUTES } from '@/lib/config/constants'
import { DashboardContent } from '@/components/dashboard/dashboard-content'
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  startOfDay,
  format,
  getWeek,
  differenceInDays,
  isWithinInterval,
  addDays,
} from 'date-fns'
import type { ActivityTimeline, WeeklyChapter, DashboardCardId } from '@/types/dashboard.types'

export const metadata = {
  title: 'Dashboard',
}

// Helper to add timeout to promises
function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms))
  ])
}

// Error fallback when database is slow/unavailable
function DashboardStatsError({ message }: { message: string }) {
  return (
    <div className="glass-card rounded-2xl p-8 text-center">
      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/30 dark:to-amber-800/30 flex items-center justify-center">
        <Clock className="h-8 w-8 text-amber-600 dark:text-amber-400" />
      </div>
      <h3 className="text-lg font-semibold mb-2">Loading slowly...</h3>
      <p className="text-sm text-muted-foreground mb-4">{message}</p>
      <Button asChild variant="outline" size="sm">
        <Link href={ROUTES.create}>Create New Creative</Link>
      </Button>
    </div>
  )
}

// Build activity timeline from creatives
function buildTimeline(
  creatives: Array<{ id: string; created_at: string; creative_type: string | null; credits_used: number | null }>,
  now: Date
): ActivityTimeline {
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)

  // Group by week
  const weeklyData = new Map<number, typeof creatives>()

  creatives.forEach(creative => {
    const weekNum = getWeek(new Date(creative.created_at), { weekStartsOn: 1 })
    if (!weeklyData.has(weekNum)) {
      weeklyData.set(weekNum, [])
    }
    weeklyData.get(weekNum)!.push(creative)
  })

  // Build chapters for each week
  const chapters: WeeklyChapter[] = []
  let currentDate = monthStart
  let weekIndex = 1

  while (currentDate <= monthEnd) {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 })
    const weekNum = getWeek(currentDate, { weekStartsOn: 1 })
    const isCurrentWeek = isWithinInterval(now, { start: weekStart, end: weekEnd })
    const isFutureWeek = weekStart > now

    const weekCreatives = weeklyData.get(weekNum) || []

    // Calculate stats
    const formatCounts = new Map<string, number>()
    const dayCounts = new Map<string, number>()
    let totalCredits = 0

    weekCreatives.forEach(c => {
      const fmt = c.creative_type || 'unknown'
      formatCounts.set(fmt, (formatCounts.get(fmt) || 0) + 1)

      const day = format(new Date(c.created_at), 'EEEE')
      dayCounts.set(day, (dayCounts.get(day) || 0) + 1)

      totalCredits += c.credits_used || 0
    })

    // Find most used format
    let mostUsedFormat = 'None'
    let maxCount = 0
    formatCounts.forEach((count, fmt) => {
      if (count > maxCount) {
        maxCount = count
        mostUsedFormat = fmt
      }
    })

    // Find best day
    let bestDay: { day: string; count: number } | null = null
    dayCounts.forEach((count, day) => {
      if (!bestDay || count > bestDay.count) {
        bestDay = { day, count }
      }
    })

    const titles = [
      { title: 'The Beginning', subtitle: 'Starting fresh' },
      { title: 'Building Momentum', subtitle: 'Picking up pace' },
      { title: 'In Full Swing', subtitle: 'Going strong' },
      { title: 'The Final Push', subtitle: 'Finish line in sight' },
      { title: 'Bonus Time', subtitle: 'Extra effort!' },
    ]
    const titleIndex = Math.min(weekIndex - 1, titles.length - 1)

    chapters.push({
      id: `week-${weekNum}`,
      weekNumber: weekIndex,
      title: isCurrentWeek ? 'Current Sprint' : titles[titleIndex].title,
      subtitle: isCurrentWeek ? 'This week' : titles[titleIndex].subtitle,
      dateRange: {
        start: format(weekStart < monthStart ? monthStart : weekStart, 'MMM d'),
        end: format(weekEnd > monthEnd ? monthEnd : weekEnd, 'MMM d'),
      },
      stats: {
        creativesGenerated: weekCreatives.length,
        creditsUsed: totalCredits,
        mostUsedFormat: mostUsedFormat.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        bestDay,
      },
      isCurrentWeek,
      isFutureWeek,
    })

    currentDate = addDays(weekEnd, 1)
    weekIndex++
  }

  const totalCreatives = creatives.length
  const totalCredits = creatives.reduce((sum, c) => sum + (c.credits_used || 0), 0)
  const daysElapsed = differenceInDays(now, monthStart) + 1
  const averagePerDay = daysElapsed > 0 ? Math.round((totalCreatives / daysElapsed) * 10) / 10 : 0

  return {
    monthName: format(now, 'MMMM yyyy'),
    chapters,
    summary: {
      totalCreatives,
      totalCredits,
      averagePerDay,
      onTrackForGoal: true,
    },
  }
}

async function DashboardData() {
  try {
    const supabase = await createClient()

    const authResult = await withTimeout(
      supabase.auth.getUser(),
      3000,
      { data: { user: null }, error: null } as unknown as Awaited<ReturnType<typeof supabase.auth.getUser>>
    )
    const user = authResult.data?.user

    if (!user) {
      return <DashboardStatsError message="Unable to load user data" />
    }

    // Get user's organization
    const orgQuery = supabase
      .from('organization_members')
      .select('organization_id, organizations(*)')
      .eq('user_id', user.id)
      .single()
    const membershipResult = await withTimeout(
      Promise.resolve(orgQuery),
      3000,
      { data: null, error: null } as unknown as Awaited<typeof orgQuery>
    )

    if (!membershipResult.data) {
      return <DashboardStatsError message="Unable to load organization" />
    }

    const org = membershipResult.data.organizations as {
      id: string
      name: string
      credits_balance: number
    }

    const now = new Date()
    const monthStart = startOfMonth(now)
    const monthEnd = endOfMonth(now)
    const weekStart = startOfWeek(now, { weekStartsOn: 1 })
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 })
    const todayStart = startOfDay(now)
    const previousMonthStart = startOfMonth(addDays(monthStart, -1))

    // Fetch all data in parallel
    const [
      totalCreativesResult,
      monthlyCreativesResult,
      weeklyCreativesResult,
      todayCreativesResult,
      monthlyCreditsResult,
      previousMonthCreditsResult,
      recentCreativesResult,
      preferencesResult,
    ] = await Promise.all([
      withTimeout(
        Promise.resolve(
          supabase
            .from('creatives')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', org.id)
        ),
        3000,
        { count: null, error: null, data: null, status: 200, statusText: 'OK' } as unknown as { count: number | null; error: unknown }
      ),
      withTimeout(
        Promise.resolve(
          supabase
            .from('creatives')
            .select('id, created_at, creative_type, credits_used')
            .eq('organization_id', org.id)
            .gte('created_at', monthStart.toISOString())
            .lte('created_at', monthEnd.toISOString())
            .order('created_at', { ascending: true })
        ),
        3000,
        { data: [], error: null } as any
      ),
      withTimeout(
        Promise.resolve(
          supabase
            .from('creatives')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', org.id)
            .gte('created_at', weekStart.toISOString())
            .lte('created_at', weekEnd.toISOString())
        ),
        3000,
        { count: null, error: null } as any
      ),
      withTimeout(
        Promise.resolve(
          supabase
            .from('creatives')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', org.id)
            .gte('created_at', todayStart.toISOString())
        ),
        3000,
        { count: null, error: null } as any
      ),
      withTimeout(
        Promise.resolve(
          supabase
            .from('credit_transactions')
            .select('amount')
            .eq('organization_id', org.id)
            .eq('transaction_type', 'debit')
            .gte('created_at', monthStart.toISOString())
            .lte('created_at', monthEnd.toISOString())
        ),
        3000,
        { data: [], error: null } as any
      ),
      withTimeout(
        Promise.resolve(
          supabase
            .from('credit_transactions')
            .select('amount')
            .eq('organization_id', org.id)
            .eq('transaction_type', 'debit')
            .gte('created_at', previousMonthStart.toISOString())
            .lt('created_at', monthStart.toISOString())
        ),
        3000,
        { data: [], error: null } as any
      ),
      withTimeout(
        Promise.resolve(
          supabase
            .from('creatives')
            .select('id, title, vertical, creative_type, created_at, image_url, thumbnail_url')
            .eq('organization_id', org.id)
            .order('created_at', { ascending: false })
            .limit(4)
        ),
        3000,
        { data: [], error: null } as any
      ),
      // Try to get user preferences (may not exist yet)
      withTimeout(
        Promise.resolve(
          supabase
            .from('user_dashboard_preferences' as any)
            .select('*')
            .eq('user_id', user.id)
            .single()
        ),
        3000,
        { data: null, error: null } as any
      ),
    ])

    // Calculate stats
    const monthlyCreditsUsed = (monthlyCreditsResult.data || []).reduce(
      (sum: number, t: { amount: number }) => sum + Math.abs(t.amount || 0),
      0
    )
    const previousMonthCredits = (previousMonthCreditsResult.data || []).reduce(
      (sum: number, t: { amount: number }) => sum + Math.abs(t.amount || 0),
      0
    )
    const percentageChange = previousMonthCredits > 0
      ? Math.round(((monthlyCreditsUsed - previousMonthCredits) / previousMonthCredits) * 100)
      : 0

    // Build timeline
    const timeline = buildTimeline(monthlyCreativesResult.data || [], now)

    // Prepare data for client component
    const initialData = {
      credits: {
        balance: org.credits_balance,
        used: monthlyCreditsUsed,
      },
      creatives: {
        total: totalCreativesResult.count || 0,
        thisMonth: (monthlyCreativesResult.data || []).length,
        thisWeek: weeklyCreativesResult.count || 0,
        today: todayCreativesResult.count || 0,
      },
      monthly: {
        creditsUsed: monthlyCreditsUsed,
        percentageChange,
      },
      speed: {
        average: '~30s',
      },
      timeline,
      recentCreatives: recentCreativesResult.data || [],
    }

    const initialPreferences = preferencesResult.data
      ? {
        card_order: preferencesResult.data.card_order as DashboardCardId[],
        monthly_goal: preferencesResult.data.monthly_goal,
      }
      : undefined

    return (
      <DashboardContent
        initialData={initialData}
        initialPreferences={initialPreferences}
      />
    )
  } catch (error) {
    console.error('[DashboardData] Error:', error)
    return <DashboardStatsError message="An unexpected error occurred" />
  }
}

function DashboardLoading() {
  return (
    <div className="space-y-6">
      {/* Journey Progress Skeleton */}
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Skeleton className="w-10 h-10 rounded-lg" />
            <div>
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-32 mt-1" />
            </div>
          </div>
          <Skeleton className="h-8 w-24" />
        </div>
        <Skeleton className="h-3 w-full rounded-full mt-8" />
        <div className="flex justify-between mt-6">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>

      {/* Stat Cards Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="glass-premium rounded-xl p-5">
            <Skeleton className="w-10 h-10 rounded-lg" />
            <Skeleton className="h-8 w-20 mt-3" />
            <Skeleton className="h-4 w-24 mt-2" />
            <Skeleton className="h-3 w-28 mt-1" />
          </div>
        ))}
      </div>

      {/* Quick Actions + Timeline Skeleton */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        <div className="lg:col-span-2 glass-card rounded-xl p-6">
          <Skeleton className="h-6 w-32 mb-2" />
          <Skeleton className="h-4 w-48 mb-6" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
          </div>
        </div>
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Skeleton className="w-10 h-10 rounded-lg" />
            <div>
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-4 w-24 mt-1" />
            </div>
          </div>
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <div className="space-y-6 md:space-y-8">

      {/* Dashboard Content */}
      <Suspense fallback={<DashboardLoading />}>
        <DashboardData />
      </Suspense>
    </div>
  )
}
