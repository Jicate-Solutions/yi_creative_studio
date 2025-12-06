'use client'

import { useState, useMemo, useCallback } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { useRealtimeFeedback } from '@/hooks/use-realtime-feedback'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { FeedbackTable } from '@/components/feedback/feedback-table'
import { FeedbackDetailModal } from '@/components/feedback/feedback-detail-modal'
import { FeedbackResponseDialog } from '@/components/feedback/feedback-response-dialog'
import { CREATIVE_FORMATS } from '@/lib/config/creative-formats'
import { cn } from '@/lib/utils'
import {
  Star,
  MessageSquare,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Wifi,
  WifiOff,
  ChevronDown,
  Archive,
  RefreshCw,
  Inbox,
  Eye,
  CheckCircle2,
} from 'lucide-react'
import type {
  CreativeFeedbackWithDetails,
  FeedbackStatus,
  FeedbackPriority,
  FeedbackFilters,
} from '@/types/feedback'
import { FEEDBACK_STATUS_CONFIG, FEEDBACK_PRIORITY_CONFIG } from '@/types/feedback'

const ISSUE_CATEGORY_LABELS: Record<string, string> = {
  text_rendering: 'Text Rendering',
  layout: 'Layout Issues',
  colors: 'Color Problems',
  logo: 'Logo Issues',
  style: 'Style Mismatch',
  other: 'Other',
}

type StatusFilter = FeedbackStatus | 'all'

export default function FeedbackManagementPage() {
  const { currentOrganization } = useAuthStore()
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [detailModal, setDetailModal] = useState<CreativeFeedbackWithDetails | null>(null)
  const [responseDialog, setResponseDialog] = useState<CreativeFeedbackWithDetails | null>(null)

  // Build filters based on status tab
  const filters: FeedbackFilters = useMemo(() => ({
    status: statusFilter === 'all' ? undefined : statusFilter,
  }), [statusFilter])

  // Use real-time feedback hook
  const {
    feedback,
    isLoading,
    isConnected,
    error,
    stats,
    refetch,
    updateFeedback,
    bulkUpdate,
  } = useRealtimeFeedback({
    organizationId: currentOrganization?.id || '',
    filters,
    enabled: !!currentOrganization?.id,
  })

  // Handle status change
  const handleStatusChange = useCallback(async (id: string, status: FeedbackStatus) => {
    await updateFeedback(id, { status })
  }, [updateFeedback])

  // Handle priority change
  const handlePriorityChange = useCallback(async (id: string, priority: FeedbackPriority) => {
    await updateFeedback(id, { priority })
  }, [updateFeedback])

  // Handle response submission
  const handleResponseSubmit = useCallback(async (id: string, response: string): Promise<boolean> => {
    return await updateFeedback(id, {
      admin_response: response,
      status: 'acknowledged' as FeedbackStatus,
    })
  }, [updateFeedback])

  // Handle archive
  const handleArchive = useCallback(async (id: string) => {
    await updateFeedback(id, { status: 'archived' })
  }, [updateFeedback])

  // Handle bulk actions
  const handleBulkAction = useCallback(async (action: 'status' | 'priority' | 'archive', value: string) => {
    if (selectedIds.length === 0) return
    const success = await bulkUpdate(selectedIds, action, value)
    if (success) {
      setSelectedIds([])
    }
  }, [selectedIds, bulkUpdate])

  // Calculate status counts for tabs
  const statusCounts = useMemo(() => {
    if (!stats) return { all: 0, new: 0, reviewed: 0, acknowledged: 0, resolved: 0, archived: 0 }
    return {
      all: stats.total,
      ...stats.byStatus,
    }
  }, [stats])

  // Calculate issue categories
  const issueCategories = useMemo(() => {
    const counts: Record<string, number> = {}
    feedback.forEach((f) => {
      if (f.issue_categories) {
        f.issue_categories.forEach((cat: string) => {
          counts[cat] = (counts[cat] || 0) + 1
        })
      }
    })
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
  }, [feedback])

  // Rating distribution
  const ratingDistribution = useMemo(() => {
    const counts = [0, 0, 0, 0, 0]
    feedback.forEach((f) => {
      if (f.rating >= 1 && f.rating <= 5) {
        counts[f.rating - 1]++
      }
    })
    const total = feedback.length || 1
    return counts.map((count, idx) => ({
      rating: idx + 1,
      count,
      percentage: (count / total) * 100,
    }))
  }, [feedback])

  const renderStars = (rating: number) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            'h-4 w-4',
            star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30'
          )}
        />
      ))}
    </div>
  )

  if (!currentOrganization?.id) {
    return (
      <div className="space-y-6">
        <p className="text-muted-foreground">Please select an organization.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Live Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Feedback Management</h1>
          <Badge
            variant={isConnected ? 'default' : 'secondary'}
            className={cn(
              'gap-1.5',
              isConnected && 'bg-green-500/10 text-green-600 border-green-200'
            )}
          >
            {isConnected ? (
              <>
                <Wifi className="h-3 w-3" />
                Live
              </>
            ) : (
              <>
                <WifiOff className="h-3 w-3" />
                Offline
              </>
            )}
          </Badge>
        </div>
        <Button variant="outline" size="sm" onClick={refetch} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Feedback</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold">{stats?.total || 0}</div>
            )}
            <p className="text-xs text-muted-foreground">
              {stats?.newToday || 0} new today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">
                  {(stats?.averageRating || 0).toFixed(1)}
                </span>
                {renderStars(Math.round(stats?.averageRating || 0))}
              </div>
            )}
            <p className="text-xs text-muted-foreground">Out of 5 stars</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Inbox className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold">{stats?.byStatus.new || 0}</div>
            )}
            <p className="text-xs text-muted-foreground">
              Awaiting action
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold">{stats?.resolvedToday || 0}</div>
            )}
            <p className="text-xs text-muted-foreground">
              {stats?.byStatus.resolved || 0} total resolved
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Rating Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Rating Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-6 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {[...ratingDistribution].reverse().map((item) => (
                  <div key={item.rating} className="flex items-center gap-3">
                    <div className="flex items-center gap-1 w-16">
                      <span className="text-sm font-medium">{item.rating}</span>
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    </div>
                    <div className="flex-1">
                      <Progress
                        value={item.percentage}
                        className={cn(
                          'h-6',
                          item.rating >= 4 && '[&>div]:bg-green-500',
                          item.rating === 3 && '[&>div]:bg-yellow-500',
                          item.rating <= 2 && '[&>div]:bg-red-500'
                        )}
                      />
                    </div>
                    <div className="w-16 text-right">
                      <span className="text-sm text-muted-foreground">
                        {item.count} ({item.percentage.toFixed(0)}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Issue Categories */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Common Issues
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : issueCategories.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckCircle className="h-12 w-12 text-green-500/50 mb-4" />
                <p className="text-muted-foreground">No issues reported</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {issueCategories.map((issue) => (
                  <div
                    key={issue.name}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <span className="text-sm font-medium">
                      {ISSUE_CATEGORY_LABELS[issue.name] || issue.name}
                    </span>
                    <Badge variant="secondary">{issue.count}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Feedback Management Section */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="text-lg">Manage Feedback</CardTitle>

            {/* Status Tabs */}
            <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
              <TabsList className="h-9">
                <TabsTrigger value="all" className="text-xs px-3">
                  All ({statusCounts.all})
                </TabsTrigger>
                <TabsTrigger value="new" className="text-xs px-3">
                  <Inbox className="h-3.5 w-3.5 mr-1" />
                  New ({statusCounts.new})
                </TabsTrigger>
                <TabsTrigger value="reviewed" className="text-xs px-3">
                  <Eye className="h-3.5 w-3.5 mr-1" />
                  Reviewed ({statusCounts.reviewed})
                </TabsTrigger>
                <TabsTrigger value="acknowledged" className="text-xs px-3 hidden md:flex">
                  <MessageSquare className="h-3.5 w-3.5 mr-1" />
                  Ack ({statusCounts.acknowledged})
                </TabsTrigger>
                <TabsTrigger value="resolved" className="text-xs px-3">
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                  Resolved ({statusCounts.resolved})
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Bulk Actions Bar */}
          {selectedIds.length > 0 && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/20">
              <span className="text-sm font-medium">
                {selectedIds.length} item{selectedIds.length > 1 ? 's' : ''} selected
              </span>
              <div className="flex items-center gap-2">
                {/* Bulk Status */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-1.5">
                      Set Status
                      <ChevronDown className="h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {(Object.keys(FEEDBACK_STATUS_CONFIG) as FeedbackStatus[]).map((status) => (
                      <DropdownMenuItem
                        key={status}
                        onClick={() => handleBulkAction('status', status)}
                      >
                        {FEEDBACK_STATUS_CONFIG[status].label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Bulk Priority */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-1.5">
                      Set Priority
                      <ChevronDown className="h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {(Object.keys(FEEDBACK_PRIORITY_CONFIG) as FeedbackPriority[]).map((priority) => (
                      <DropdownMenuItem
                        key={priority}
                        onClick={() => handleBulkAction('priority', priority)}
                      >
                        {FEEDBACK_PRIORITY_CONFIG[priority].label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Bulk Archive */}
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-destructive hover:text-destructive"
                  onClick={() => handleBulkAction('archive', 'archived')}
                >
                  <Archive className="h-3.5 w-3.5" />
                  Archive
                </Button>

                {/* Clear Selection */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedIds([])}
                >
                  Clear
                </Button>
              </div>
            </div>
          )}

          {/* Feedback Table */}
          <FeedbackTable
            feedback={feedback}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
            onStatusChange={handleStatusChange}
            onPriorityChange={handlePriorityChange}
            onViewDetails={setDetailModal}
            onRespond={setResponseDialog}
            onArchive={handleArchive}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <FeedbackDetailModal
        open={!!detailModal}
        onOpenChange={(open) => !open && setDetailModal(null)}
        feedback={detailModal}
        onStatusChange={handleStatusChange}
        onPriorityChange={handlePriorityChange}
        onRespond={setResponseDialog}
      />

      {/* Response Dialog */}
      <FeedbackResponseDialog
        open={!!responseDialog}
        onOpenChange={(open) => !open && setResponseDialog(null)}
        feedback={responseDialog}
        onSubmit={handleResponseSubmit}
      />
    </div>
  )
}
