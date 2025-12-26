/**
 * Dashboard Service
 * Handles all dashboard-related data fetching and mutations
 */

import { createClient } from '@/lib/supabase/client';
import type {
  DashboardPreferences,
  DashboardCardId,
  DashboardStatsResponse,
  JourneyProgress,
  ActivityTimeline,
  WeeklyChapter,
  Milestone
} from '@/types/dashboard.types';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, format, getWeek, differenceInDays, isWithinInterval, addDays } from 'date-fns';

const DEFAULT_CARD_ORDER: DashboardCardId[] = ['credits', 'creatives', 'monthly', 'speed'];
const DEFAULT_MONTHLY_GOAL = 50;

/**
 * Get user's dashboard preferences
 */
export async function getDashboardPreferences(userId: string): Promise<DashboardPreferences | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('user_dashboard_preferences' as any)
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No preferences found, return null (will use defaults)
      return null;
    }
    console.error('Error fetching dashboard preferences:', error);
    return null;
  }

  return data as unknown as DashboardPreferences;
}

/**
 * Save user's dashboard preferences
 */
export async function saveDashboardPreferences(
  userId: string,
  preferences: Partial<Pick<DashboardPreferences, 'card_order' | 'monthly_goal'>>
): Promise<DashboardPreferences | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('user_dashboard_preferences' as any)
    .upsert({
      user_id: userId,
      ...preferences,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id'
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving dashboard preferences:', error);
    return null;
  }

  return data as unknown as DashboardPreferences;
}

/**
 * Update card order
 */
export async function updateCardOrder(
  userId: string,
  cardOrder: DashboardCardId[]
): Promise<boolean> {
  const result = await saveDashboardPreferences(userId, { card_order: cardOrder });
  return result !== null;
}

/**
 * Update monthly goal
 */
export async function updateMonthlyGoal(
  userId: string,
  goal: number
): Promise<boolean> {
  // Validate goal range
  if (goal < 10 || goal > 500) {
    console.error('Monthly goal must be between 10 and 500');
    return false;
  }

  const result = await saveDashboardPreferences(userId, { monthly_goal: goal });
  return result !== null;
}

/**
 * Get or create default preferences
 */
export async function getOrCreatePreferences(userId: string): Promise<{
  cardOrder: DashboardCardId[];
  monthlyGoal: number;
}> {
  const preferences = await getDashboardPreferences(userId);

  if (preferences) {
    return {
      cardOrder: preferences.card_order as DashboardCardId[],
      monthlyGoal: preferences.monthly_goal
    };
  }

  // Return defaults without creating in DB (will create on first save)
  return {
    cardOrder: DEFAULT_CARD_ORDER,
    monthlyGoal: DEFAULT_MONTHLY_GOAL
  };
}

/**
 * Calculate journey progress with milestones
 */
export function calculateJourneyProgress(current: number, goal: number): JourneyProgress {
  const percentage = Math.min(Math.round((current / goal) * 100), 100);

  // Dynamic milestones based on goal
  const milestonePercentages = [10, 25, 50, 75, 100];
  const milestones: Milestone[] = milestonePercentages.map(pct => {
    const value = Math.round((pct / 100) * goal);
    return {
      value,
      label: pct === 100 ? 'Goal!' : `${pct}%`,
      reached: current >= value,
      isCurrent: current >= value && (pct === 100 || current < Math.round(((pct + 25) / 100) * goal))
    };
  });

  // Find next milestone
  const nextMilestone = milestones.find(m => !m.reached) || null;
  const toNextMilestone = nextMilestone ? nextMilestone.value - current : 0;

  return {
    current,
    goal,
    percentage,
    milestones,
    nextMilestone,
    toNextMilestone
  };
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
    { title: 'Bonus Time', subtitle: 'Extra effort!' }
  ];

  const index = Math.min(weekNumber - 1, titles.length - 1);
  const base = titles[index];

  return {
    title: isCurrentWeek ? 'Current Sprint' : base.title,
    subtitle: isCurrentWeek ? 'This week' : base.subtitle
  };
}

/**
 * Build activity timeline from creatives data
 */
export async function buildActivityTimeline(
  organizationId: string,
  userId?: string
): Promise<ActivityTimeline> {
  const supabase = createClient();
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  // Fetch creatives for the month
  let query = supabase
    .from('creatives')
    .select('id, created_at, creative_type, credits_used')
    .eq('organization_id', organizationId)
    .gte('created_at', monthStart.toISOString())
    .lte('created_at', monthEnd.toISOString())
    .order('created_at', { ascending: true });

  if (userId) {
    query = query.eq('created_by', userId);
  }

  const { data: creatives, error } = await query;

  if (error) {
    console.error('Error fetching creatives for timeline:', error);
    return getEmptyTimeline(now);
  }

  // Group by week
  const weeklyData = new Map<number, typeof creatives>();

  (creatives || []).forEach(creative => {
    const weekNum = getWeek(new Date(creative.created_at), { weekStartsOn: 1 });
    if (!weeklyData.has(weekNum)) {
      weeklyData.set(weekNum, []);
    }
    weeklyData.get(weekNum)!.push(creative);
  });

  // Build chapters for each week of the month
  const chapters: WeeklyChapter[] = [];
  let currentDate = monthStart;
  let weekIndex = 1;

  while (currentDate <= monthEnd) {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
    const weekNum = getWeek(currentDate, { weekStartsOn: 1 });
    const isCurrentWeek = isWithinInterval(now, { start: weekStart, end: weekEnd });
    const isFutureWeek = weekStart > now;

    const weekCreatives = weeklyData.get(weekNum) || [];

    // Calculate stats
    const formatCounts = new Map<string, number>();
    const dayCounts = new Map<string, number>();
    let totalCredits = 0;

    weekCreatives.forEach(c => {
      // Format counts
      const creativeFormat = c.creative_type || 'unknown';
      formatCounts.set(creativeFormat, (formatCounts.get(creativeFormat) || 0) + 1);

      // Day counts
      const day = format(new Date(c.created_at), 'EEEE');
      dayCounts.set(day, (dayCounts.get(day) || 0) + 1);

      // Credits
      totalCredits += c.credits_used || 0;
    });

    // Find most used format
    let mostUsedFormat = 'None';
    let maxCount = 0;
    formatCounts.forEach((count, fmt) => {
      if (count > maxCount) {
        maxCount = count;
        mostUsedFormat = fmt;
      }
    });

    // Find best day
    let bestDay: { day: string; count: number } | null = null;
    dayCounts.forEach((count, day) => {
      if (!bestDay || count > bestDay.count) {
        bestDay = { day, count };
      }
    });

    const { title, subtitle } = getChapterTitle(weekIndex, isCurrentWeek);

    chapters.push({
      id: `week-${weekNum}`,
      weekNumber: weekIndex,
      title,
      subtitle,
      dateRange: {
        start: format(weekStart < monthStart ? monthStart : weekStart, 'MMM d'),
        end: format(weekEnd > monthEnd ? monthEnd : weekEnd, 'MMM d')
      },
      stats: {
        creativesGenerated: weekCreatives.length,
        creditsUsed: totalCredits,
        mostUsedFormat: mostUsedFormat.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        bestDay
      },
      isCurrentWeek,
      isFutureWeek
    });

    // Move to next week
    currentDate = addDays(weekEnd, 1);
    weekIndex++;
  }

  // Calculate summary
  const totalCreatives = creatives?.length || 0;
  const totalCredits = (creatives || []).reduce((sum, c) => sum + (c.credits_used || 0), 0);
  const daysElapsed = differenceInDays(now, monthStart) + 1;
  const averagePerDay = daysElapsed > 0 ? Math.round((totalCreatives / daysElapsed) * 10) / 10 : 0;

  return {
    monthName: format(now, 'MMMM yyyy'),
    chapters,
    summary: {
      totalCreatives,
      totalCredits,
      averagePerDay,
      onTrackForGoal: true // Will be calculated with goal
    }
  };
}

function getEmptyTimeline(date: Date): ActivityTimeline {
  return {
    monthName: format(date, 'MMMM yyyy'),
    chapters: [],
    summary: {
      totalCreatives: 0,
      totalCredits: 0,
      averagePerDay: 0,
      onTrackForGoal: false
    }
  };
}

/**
 * Check if user should see celebration
 */
export function shouldCelebrate(
  previous: number,
  current: number,
  milestones: number[]
): { celebrate: boolean; milestone?: number } {
  for (const milestone of milestones) {
    if (previous < milestone && current >= milestone) {
      return { celebrate: true, milestone };
    }
  }
  return { celebrate: false };
}
