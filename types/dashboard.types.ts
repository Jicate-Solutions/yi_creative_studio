/**
 * Dashboard Types for Creative Journey Dashboard
 */

// Card identifiers for draggable stats
export type DashboardCardId = 'credits' | 'creatives' | 'monthly' | 'speed';

// Dashboard preferences stored in database
export interface DashboardPreferences {
  id: string;
  user_id: string;
  card_order: DashboardCardId[];
  monthly_goal: number;
  created_at: string;
  updated_at: string;
}

// Stat card data structure
export interface StatCard {
  id: DashboardCardId;
  title: string;
  value: number | string;
  subtitle?: string;
  icon: string;
  gradient: string;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
  };
  details?: StatCardDetails;
}

export interface StatCardDetails {
  title: string;
  items: Array<{
    label: string;
    value: string | number;
  }>;
  actions?: Array<{
    label: string;
    href: string;
  }>;
}

// Journey progress milestone
export interface Milestone {
  value: number;
  label: string;
  reached: boolean;
  isCurrent: boolean;
}

// Journey progress data
export interface JourneyProgress {
  current: number;
  goal: number;
  percentage: number;
  milestones: Milestone[];
  nextMilestone: Milestone | null;
  toNextMilestone: number;
}

// Daily activity for heatmap
export interface DailyActivity {
  date: string; // YYYY-MM-DD format
  count: number;
  dayOfWeek: number; // 0=Sun, 1=Mon, etc.
  isToday?: boolean;
}

// Weekly chapter for activity timeline
export interface WeeklyChapter {
  id: string;
  weekNumber: number;
  title: string;
  subtitle: string;
  dateRange: {
    start: string;
    end: string;
  };
  stats: {
    creativesGenerated: number;
    creditsUsed: number;
    mostUsedFormat: string;
    bestDay: {
      day: string;
      count: number;
    } | null;
  };
  dailyActivity?: DailyActivity[]; // For heatmap
  isCurrentWeek: boolean;
  isFutureWeek: boolean;
}

// Activity timeline data
export interface ActivityTimeline {
  monthName: string;
  chapters: WeeklyChapter[];
  summary: {
    totalCreatives: number;
    totalCredits: number;
    averagePerDay: number;
    onTrackForGoal: boolean;
  };
  heatmapData?: DailyActivity[]; // Full month heatmap data
}

// Dashboard stats API response
export interface DashboardStatsResponse {
  credits: {
    balance: number;
    used: number;
    total: number;
  };
  creatives: {
    total: number;
    thisMonth: number;
    thisWeek: number;
    today: number;
  };
  monthly: {
    creditsUsed: number;
    previousMonth: number;
    percentageChange: number;
  };
  speed: {
    average: number;
    fastest: number;
    slowest: number;
  };
  journey: JourneyProgress;
  timeline: ActivityTimeline;
}

// Animation variants for framer-motion
export interface AnimationVariants {
  initial: object;
  animate: object;
  exit?: object;
  hover?: object;
  tap?: object;
}

// Celebration trigger events
export type CelebrationEvent =
  | 'milestone_reached'
  | 'goal_completed'
  | 'personal_best'
  | 'streak_maintained';

export interface CelebrationTrigger {
  event: CelebrationEvent;
  value?: number;
  message: string;
}
