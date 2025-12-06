/**
 * Feedback Management System Types
 *
 * Types for the admin feedback approval workflow with real-time Supabase updates
 */

// ============================================
// Status & Priority Enums
// ============================================

export type FeedbackStatus = 'new' | 'reviewed' | 'acknowledged' | 'resolved' | 'archived'
export type FeedbackPriority = 'low' | 'normal' | 'high' | 'urgent'

// ============================================
// Feedback Status Configuration
// ============================================

export const FEEDBACK_STATUS_CONFIG: Record<FeedbackStatus, {
  label: string
  description: string
  color: string
  bgColor: string
}> = {
  new: {
    label: 'New',
    description: 'Unreviewed feedback',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30'
  },
  reviewed: {
    label: 'Reviewed',
    description: 'Feedback has been reviewed',
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30'
  },
  acknowledged: {
    label: 'Acknowledged',
    description: 'Feedback acknowledged to user',
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30'
  },
  resolved: {
    label: 'Resolved',
    description: 'Feedback has been addressed',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/30'
  },
  archived: {
    label: 'Archived',
    description: 'Feedback archived for records',
    color: 'text-gray-500 dark:text-gray-400',
    bgColor: 'bg-gray-100 dark:bg-gray-800/50'
  }
}

export const FEEDBACK_PRIORITY_CONFIG: Record<FeedbackPriority, {
  label: string
  color: string
  bgColor: string
  icon?: string
}> = {
  low: {
    label: 'Low',
    color: 'text-gray-500 dark:text-gray-400',
    bgColor: 'bg-gray-100 dark:bg-gray-800/50'
  },
  normal: {
    label: 'Normal',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30'
  },
  high: {
    label: 'High',
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30'
  },
  urgent: {
    label: 'Urgent',
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/30'
  }
}

// ============================================
// Main Feedback Interface
// ============================================

export interface CreativeFeedback {
  id: string
  creative_id: string
  user_id: string
  organization_id: string
  rating: number
  comment: string | null
  issue_categories: string[]
  creative_type: string
  vertical: string | null
  prompt_used: string | null
  form_data: Record<string, unknown>
  analyzed: boolean
  analyzed_at: string | null
  // New workflow fields
  status: FeedbackStatus
  priority: FeedbackPriority
  admin_response: string | null
  responded_by: string | null
  responded_at: string | null
  created_at: string
}

// Extended type with joined data for display
export interface CreativeFeedbackWithDetails extends CreativeFeedback {
  // Joined creative data
  creative?: {
    id: string
    title: string | null
    thumbnail_url: string | null
    image_url: string | null
  } | null
  // Joined user data
  user?: {
    id: string
    full_name: string | null
    avatar_url: string | null
    email?: string
  } | null
  // Joined responder data
  responder?: {
    id: string
    full_name: string | null
    avatar_url: string | null
  } | null
}

// ============================================
// Filter & Query Types
// ============================================

export interface FeedbackFilters {
  status?: FeedbackStatus | 'all'
  priority?: FeedbackPriority | 'all'
  dateRange?: { from: Date; to: Date }
  creativeType?: string
  vertical?: string
  ratingMin?: number
  ratingMax?: number
  search?: string
}

export interface FeedbackSortOptions {
  field: 'created_at' | 'rating' | 'priority' | 'status'
  direction: 'asc' | 'desc'
}

// ============================================
// API Request/Response Types
// ============================================

export interface UpdateFeedbackRequest {
  status?: FeedbackStatus
  priority?: FeedbackPriority
  admin_response?: string
}

export interface BulkFeedbackRequest {
  feedbackIds: string[]
  action: 'status' | 'priority' | 'archive'
  value: string
}

export interface FeedbackResponse {
  success: boolean
  data?: CreativeFeedback
  error?: string
}

export interface BulkFeedbackResponse {
  success: boolean
  updated: number
  failed: number
  errors?: string[]
}

// ============================================
// Real-time Event Types
// ============================================

export type FeedbackEventType = 'INSERT' | 'UPDATE' | 'DELETE'

export interface FeedbackRealtimePayload {
  eventType: FeedbackEventType
  new: CreativeFeedback | null
  old: Partial<CreativeFeedback> | null
}

// ============================================
// Statistics Types
// ============================================

export interface FeedbackStats {
  total: number
  byStatus: Record<FeedbackStatus, number>
  byPriority: Record<FeedbackPriority, number>
  averageRating: number
  newToday: number
  resolvedToday: number
}

// ============================================
// Helper Functions
// ============================================

export function getStatusConfig(status: FeedbackStatus) {
  return FEEDBACK_STATUS_CONFIG[status]
}

export function getPriorityConfig(priority: FeedbackPriority) {
  return FEEDBACK_PRIORITY_CONFIG[priority]
}

export function isHighPriority(priority: FeedbackPriority): boolean {
  return priority === 'high' || priority === 'urgent'
}

export function isActionableStatus(status: FeedbackStatus): boolean {
  return status !== 'resolved' && status !== 'archived'
}
