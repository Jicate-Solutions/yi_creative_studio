import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
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
import type { ActivityTimeline, WeeklyChapter } from '@/types/dashboard.types'

/**
 * GET /api/dashboard/stats
 * Fetch comprehensive dashboard statistics
 */
export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's organization
    const { data: member } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single()

    if (!member?.organization_id) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 })
    }

    const organizationId = member.organization_id

    // Get organization credits from organization_credits table
    const { data: orgCredit } = await supabase
      .from('organization_credits')
      .select('balance, total_consumed, total_allocated')
      .eq('organization_id', organizationId)
      .single()

    const now = new Date()
    const monthStart = startOfMonth(now)
    const monthEnd = endOfMonth(now)
    const weekStart = startOfWeek(now, { weekStartsOn: 1 })
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 })
    const todayStart = startOfDay(now)

    // Fetch all stats in parallel
    const [
      totalCreativesResult,
      monthlyCreativesResult,
      weeklyCreativesResult,
      todayCreativesResult,
      monthlyCreditsResult,
      previousMonthCreditsResult,
    ] = await Promise.all([
      // Total creatives for organization
      supabase
        .from('creatives')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', organizationId),

      // Monthly creatives (this month)
      supabase
        .from('creatives')
        .select('id, created_at, creative_type, credits_used')
        .eq('organization_id', organizationId)
        .gte('created_at', monthStart.toISOString())
        .lte('created_at', monthEnd.toISOString())
        .order('created_at', { ascending: true }),

      // Weekly creatives
      supabase
        .from('creatives')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .gte('created_at', weekStart.toISOString())
        .lte('created_at', weekEnd.toISOString()),

      // Today's creatives
      supabase
        .from('creatives')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .gte('created_at', todayStart.toISOString()),

      // Monthly credits used (from credit_transactions)
      supabase
        .from('credit_transactions')
        .select('amount')
        .eq('organization_id', organizationId)
        .eq('transaction_type', 'debit')
        .gte('created_at', monthStart.toISOString())
        .lte('created_at', monthEnd.toISOString()),

      // Previous month credits
      supabase
        .from('credit_transactions')
        .select('amount')
        .eq('organization_id', organizationId)
        .eq('transaction_type', 'debit')
        .gte('created_at', startOfMonth(addDays(monthStart, -1)).toISOString())
        .lt('created_at', monthStart.toISOString()),
    ])

    // Calculate credits
    const creditsBalance = orgCredit?.balance || 0
    const monthlyCreditsUsed = (monthlyCreditsResult.data || []).reduce(
      (sum, t) => sum + Math.abs(t.amount || 0),
      0
    )
    const previousMonthCredits = (previousMonthCreditsResult.data || []).reduce(
      (sum, t) => sum + Math.abs(t.amount || 0),
      0
    )

    // Calculate percentage change
    const percentageChange = previousMonthCredits > 0
      ? Math.round(((monthlyCreditsUsed - previousMonthCredits) / previousMonthCredits) * 100)
      : 0

    // Build timeline from monthly creatives
    const monthlyCreatives = monthlyCreativesResult.data || []
    const timeline = buildTimeline(monthlyCreatives, now)

    // Calculate average speed (placeholder - would need actual timing data)
    const avgSpeed = '~30s'

    return NextResponse.json({
      credits: {
        balance: creditsBalance,
        used: monthlyCreditsUsed,
        total: creditsBalance + monthlyCreditsUsed,
      },
      creatives: {
        total: totalCreativesResult.count || 0,
        thisMonth: monthlyCreatives.length,
        thisWeek: weeklyCreativesResult.count || 0,
        today: todayCreativesResult.count || 0,
      },
      monthly: {
        creditsUsed: monthlyCreditsUsed,
        previousMonth: previousMonthCredits,
        percentageChange,
      },
      speed: {
        average: avgSpeed,
        fastest: '15s',
        slowest: '45s',
      },
      timeline,
    })
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * Build activity timeline from creatives
 */
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
      // Format counts
      const fmt = c.creative_type || 'unknown'
      formatCounts.set(fmt, (formatCounts.get(fmt) || 0) + 1)

      // Day counts
      const day = format(new Date(c.created_at), 'EEEE')
      dayCounts.set(day, (dayCounts.get(day) || 0) + 1)

      // Credits
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

    const { title, subtitle } = getChapterTitle(weekIndex, isCurrentWeek)

    chapters.push({
      id: `week-${weekNum}`,
      weekNumber: weekIndex,
      title,
      subtitle,
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

    // Move to next week
    currentDate = addDays(weekEnd, 1)
    weekIndex++
  }

  // Calculate summary
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
      onTrackForGoal: true, // Will be compared with user's goal on client
    },
  }
}

/**
 * Generate chapter title based on week position
 */
function getChapterTitle(weekNumber: number, isCurrentWeek: boolean): { title: string; subtitle: string } {
  const titles = [
    { title: 'The Beginning', subtitle: 'Starting fresh' },
    { title: 'Building Momentum', subtitle: 'Picking up pace' },
    { title: 'In Full Swing', subtitle: 'Going strong' },
    { title: 'The Final Push', subtitle: 'Finish line in sight' },
    { title: 'Bonus Time', subtitle: 'Extra effort!' },
  ]

  const index = Math.min(weekNumber - 1, titles.length - 1)
  const base = titles[index]

  return {
    title: isCurrentWeek ? 'Current Sprint' : base.title,
    subtitle: isCurrentWeek ? 'This week' : base.subtitle,
  }
}
