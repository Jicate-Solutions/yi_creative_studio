'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import {
  Brain,
  CheckCircle,
  XCircle,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  BarChart3,
  ListChecks,
  Clock,
  Zap,
  FlaskConical,
  ArrowRight,
} from 'lucide-react'

interface LearningStats {
  totalPatterns: number
  activePatterns: number
  totalApplications: number
  totalSuccesses: number
  overallEffectiveness: number
  pendingPatches: number
  abTesting: {
    prevention_count: number
    prevention_avg_rating: number
    holdout_count: number
    holdout_avg_rating: number
    improvement: number
    statistical_significance: 'significant' | 'not_significant' | 'insufficient_data' | null
  }
  issueTypeBreakdown: Record<string, { count: number; applications: number; successes: number }>
  formatBreakdown: Record<string, { count: number; applications: number; successes: number }>
}

interface Pattern {
  id: string
  format_id: string
  issue_type: string
  issue_pattern: string
  prevention_strategy: string
  confidence: number
  application_count: number
  success_count: number
  is_active: boolean
  created_at: string
  effectiveness_rate: number
}

interface Patch {
  id: string
  format_id: string
  issue_type: string
  issue_pattern: string
  prevention_strategy: string
  confidence: number
  reasoning: string
  status: string
  created_at: string
  source_feedback: {
    id: string
    feedback_type: string
    feedback_text: string
  } | null
}

export default function LearningDashboardPage() {
  const { currentOrganization } = useAuthStore()
  const [stats, setStats] = useState<LearningStats | null>(null)
  const [patterns, setPatterns] = useState<Pattern[]>([])
  const [patches, setPatches] = useState<Patch[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false)
  const [selectedPatch, setSelectedPatch] = useState<Patch | null>(null)
  const [reviewNotes, setReviewNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchData()
  }, [currentOrganization?.id])

  async function fetchData() {
    setIsLoading(true)
    try {
      const [statsRes, patternsRes, patchesRes] = await Promise.all([
        fetch(`/api/admin/learning/stats?organization_id=${currentOrganization?.id || ''}`),
        fetch(`/api/admin/learning/patterns?status=active&limit=20`),
        fetch(`/api/admin/learning/patches?status=pending&limit=20`),
      ])

      const [statsData, patternsData, patchesData] = await Promise.all([
        statsRes.json(),
        patternsRes.json(),
        patchesRes.json(),
      ])

      if (statsData.success) setStats(statsData.stats)
      if (patternsData.success) setPatterns(patternsData.patterns)
      if (patchesData.success) setPatches(patchesData.patches)
    } catch (error) {
      console.error('Failed to fetch learning data:', error)
      toast.error('Failed to load learning data')
    } finally {
      setIsLoading(false)
    }
  }

  async function handlePatchAction(action: 'approve' | 'reject') {
    if (!selectedPatch) return

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/admin/learning/patches', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patchId: selectedPatch.id,
          action,
          notes: reviewNotes,
        }),
      })

      const data = await res.json()

      if (data.success) {
        toast.success(action === 'approve' ? 'Patch approved!' : 'Patch rejected')
        setReviewDialogOpen(false)
        setSelectedPatch(null)
        setReviewNotes('')
        fetchData()
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast.error(`Failed to ${action} patch`)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handlePatternToggle(patternId: string, currentActive: boolean) {
    try {
      const res = await fetch('/api/admin/learning/patterns', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patternId,
          action: currentActive ? 'deprecate' : 'activate',
        }),
      })

      const data = await res.json()

      if (data.success) {
        toast.success(data.message)
        fetchData()
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast.error('Failed to update pattern')
    }
  }

  if (isLoading) {
    return (
      <div className="container py-6 space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  return (
    <div className="container py-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            Feedback Learning Agent
          </h1>
          <p className="text-muted-foreground">
            Monitor learning patterns, review pending patches, and track A/B testing results
          </p>
        </div>
        <Button onClick={fetchData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Active Patterns */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Patterns
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activePatterns || 0}</div>
            <p className="text-xs text-muted-foreground">
              of {stats?.totalPatterns || 0} total
            </p>
          </CardContent>
        </Card>

        {/* Effectiveness */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Overall Effectiveness
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{stats?.overallEffectiveness || 0}%</span>
              {(stats?.overallEffectiveness || 0) >= 70 ? (
                <TrendingUp className="h-5 w-5 text-green-500" />
              ) : (stats?.overallEffectiveness || 0) >= 50 ? (
                <Minus className="h-5 w-5 text-yellow-500" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-500" />
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.totalSuccesses || 0} / {stats?.totalApplications || 0} applications
            </p>
          </CardContent>
        </Card>

        {/* Pending Patches */}
        <Card className={stats?.pendingPatches ? 'border-yellow-500/50' : ''}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              Pending Review
              {(stats?.pendingPatches || 0) > 0 && (
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                  {stats?.pendingPatches}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pendingPatches || 0}</div>
            <p className="text-xs text-muted-foreground">patches awaiting review</p>
          </CardContent>
        </Card>

        {/* A/B Testing */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <FlaskConical className="h-4 w-4" />
              A/B Test Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.abTesting.statistical_significance === 'insufficient_data' ? (
              <div className="text-sm text-muted-foreground">
                Collecting data...
                <p className="text-xs">
                  {stats.abTesting.prevention_count + stats.abTesting.holdout_count} samples
                </p>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">
                    {stats?.abTesting.improvement > 0 ? '+' : ''}
                    {(stats?.abTesting.improvement || 0).toFixed(2)}
                  </span>
                  {(stats?.abTesting.improvement || 0) > 0 ? (
                    <TrendingUp className="h-5 w-5 text-green-500" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-red-500" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  rating improvement
                  {stats?.abTesting.statistical_significance === 'significant' && (
                    <Badge variant="outline" className="ml-2 text-xs">
                      Significant
                    </Badge>
                  )}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="patterns" className="flex items-center gap-2">
            <ListChecks className="h-4 w-4" />
            Patterns
          </TabsTrigger>
          <TabsTrigger value="patches" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Pending Patches
            {(stats?.pendingPatches || 0) > 0 && (
              <Badge variant="secondary" className="ml-1">{stats?.pendingPatches}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="ab-testing" className="flex items-center gap-2">
            <FlaskConical className="h-4 w-4" />
            A/B Testing
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Issue Type Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Issue Types</CardTitle>
                <CardDescription>Pattern distribution by issue type</CardDescription>
              </CardHeader>
              <CardContent>
                {Object.keys(stats?.issueTypeBreakdown || {}).length === 0 ? (
                  <p className="text-muted-foreground text-sm">No patterns yet</p>
                ) : (
                  <div className="space-y-3">
                    {Object.entries(stats?.issueTypeBreakdown || {}).map(([type, data]) => (
                      <div key={type} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{type}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {data.count} patterns
                          </span>
                        </div>
                        <div className="text-sm">
                          {data.applications > 0
                            ? `${Math.round((data.successes / data.applications) * 100)}%`
                            : '0%'
                          } effective
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Format Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Formats</CardTitle>
                <CardDescription>Pattern distribution by format</CardDescription>
              </CardHeader>
              <CardContent>
                {Object.keys(stats?.formatBreakdown || {}).length === 0 ? (
                  <p className="text-muted-foreground text-sm">No patterns yet</p>
                ) : (
                  <div className="space-y-3">
                    {Object.entries(stats?.formatBreakdown || {}).map(([format, data]) => (
                      <div key={format} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{format}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {data.count} patterns
                          </span>
                        </div>
                        <div className="text-sm">
                          {data.applications > 0
                            ? `${Math.round((data.successes / data.applications) * 100)}%`
                            : '0%'
                          } effective
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Patterns Tab */}
        <TabsContent value="patterns">
          <Card>
            <CardHeader>
              <CardTitle>Active Learning Patterns</CardTitle>
              <CardDescription>
                Patterns learned from user feedback that are actively preventing issues
              </CardDescription>
            </CardHeader>
            <CardContent>
              {patterns.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Brain className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>No patterns learned yet</p>
                  <p className="text-sm">Patterns will appear here as the system learns from feedback</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Issue Type</TableHead>
                      <TableHead>Format</TableHead>
                      <TableHead>Prevention Strategy</TableHead>
                      <TableHead>Effectiveness</TableHead>
                      <TableHead>Applications</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {patterns.map((pattern) => (
                      <TableRow key={pattern.id}>
                        <TableCell>
                          <Badge variant="outline">{pattern.issue_type}</Badge>
                        </TableCell>
                        <TableCell className="text-sm">{pattern.format_id}</TableCell>
                        <TableCell className="max-w-xs truncate text-sm">
                          {pattern.prevention_strategy}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <span className={
                              pattern.effectiveness_rate >= 70 ? 'text-green-600' :
                              pattern.effectiveness_rate >= 50 ? 'text-yellow-600' :
                              'text-red-600'
                            }>
                              {pattern.effectiveness_rate}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {pattern.success_count}/{pattern.application_count}
                        </TableCell>
                        <TableCell>
                          <Badge variant={pattern.is_active ? 'default' : 'secondary'}>
                            {pattern.is_active ? 'Active' : 'Deprecated'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePatternToggle(pattern.id, pattern.is_active)}
                          >
                            {pattern.is_active ? 'Deprecate' : 'Activate'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pending Patches Tab */}
        <TabsContent value="patches">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Pending Patches
                {patches.length > 0 && (
                  <Badge variant="secondary">{patches.length}</Badge>
                )}
              </CardTitle>
              <CardDescription>
                Newly generated patches awaiting review and approval
              </CardDescription>
            </CardHeader>
            <CardContent>
              {patches.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>No pending patches</p>
                  <p className="text-sm">All patches have been reviewed</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Issue Type</TableHead>
                      <TableHead>Format</TableHead>
                      <TableHead>Issue Pattern</TableHead>
                      <TableHead>Prevention Strategy</TableHead>
                      <TableHead>Confidence</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {patches.map((patch) => (
                      <TableRow key={patch.id}>
                        <TableCell>
                          <Badge variant="outline">{patch.issue_type}</Badge>
                        </TableCell>
                        <TableCell className="text-sm">{patch.format_id}</TableCell>
                        <TableCell className="max-w-xs truncate text-sm">
                          {patch.issue_pattern}
                        </TableCell>
                        <TableCell className="max-w-xs truncate text-sm">
                          {patch.prevention_strategy}
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            patch.confidence >= 0.8 ? 'default' :
                            patch.confidence >= 0.6 ? 'secondary' :
                            'outline'
                          }>
                            {Math.round(patch.confidence * 100)}%
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedPatch(patch)
                              setReviewDialogOpen(true)
                            }}
                          >
                            Review
                            <ArrowRight className="h-4 w-4 ml-1" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* A/B Testing Tab */}
        <TabsContent value="ab-testing">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FlaskConical className="h-5 w-5" />
                A/B Testing Results
              </CardTitle>
              <CardDescription>
                Comparing feedback ratings between prevention-enabled and holdout groups (10% holdout)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Prevention Group */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Zap className="h-4 w-4 text-green-500" />
                      Prevention Enabled
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">
                      {stats?.abTesting.prevention_avg_rating.toFixed(2) || '0.00'}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      avg rating ({stats?.abTesting.prevention_count || 0} samples)
                    </p>
                  </CardContent>
                </Card>

                {/* Holdout Group */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      Holdout Group
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">
                      {stats?.abTesting.holdout_avg_rating.toFixed(2) || '0.00'}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      avg rating ({stats?.abTesting.holdout_count || 0} samples)
                    </p>
                  </CardContent>
                </Card>

                {/* Improvement */}
                <Card className={(stats?.abTesting.improvement || 0) > 0 ? 'border-green-500/50' : ''}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Improvement</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-3xl font-bold ${
                      (stats?.abTesting.improvement || 0) > 0 ? 'text-green-600' :
                      (stats?.abTesting.improvement || 0) < 0 ? 'text-red-600' :
                      ''
                    }`}>
                      {(stats?.abTesting.improvement || 0) > 0 ? '+' : ''}
                      {(stats?.abTesting.improvement || 0).toFixed(2)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {stats?.abTesting.statistical_significance === 'significant' && (
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          Statistically Significant
                        </Badge>
                      )}
                      {stats?.abTesting.statistical_significance === 'not_significant' && (
                        <Badge variant="outline">Not Significant</Badge>
                      )}
                      {stats?.abTesting.statistical_significance === 'insufficient_data' && (
                        <Badge variant="secondary">Need more data</Badge>
                      )}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {stats?.abTesting.statistical_significance === 'insufficient_data' && (
                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <strong>Note:</strong> We need at least 10 samples in each group for statistical analysis.
                    Currently we have {stats.abTesting.prevention_count} in the prevention group and{' '}
                    {stats.abTesting.holdout_count} in the holdout group.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Patch Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Patch</DialogTitle>
            <DialogDescription>
              Review and approve or reject this learned patch
            </DialogDescription>
          </DialogHeader>

          {selectedPatch && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Issue Type</label>
                  <p className="text-sm text-muted-foreground">{selectedPatch.issue_type}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Format</label>
                  <p className="text-sm text-muted-foreground">{selectedPatch.format_id}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Issue Pattern</label>
                <p className="text-sm p-2 bg-muted rounded">{selectedPatch.issue_pattern}</p>
              </div>

              <div>
                <label className="text-sm font-medium">Prevention Strategy</label>
                <p className="text-sm p-2 bg-muted rounded">{selectedPatch.prevention_strategy}</p>
              </div>

              <div>
                <label className="text-sm font-medium">Reasoning</label>
                <p className="text-sm p-2 bg-muted rounded">{selectedPatch.reasoning}</p>
              </div>

              <div>
                <label className="text-sm font-medium">Confidence</label>
                <Badge variant={
                  selectedPatch.confidence >= 0.8 ? 'default' :
                  selectedPatch.confidence >= 0.6 ? 'secondary' :
                  'outline'
                }>
                  {Math.round(selectedPatch.confidence * 100)}%
                </Badge>
              </div>

              {selectedPatch.source_feedback && (
                <div>
                  <label className="text-sm font-medium">Source Feedback</label>
                  <p className="text-sm p-2 bg-muted rounded">
                    <Badge variant="outline" className="mr-2">{selectedPatch.source_feedback.feedback_type}</Badge>
                    {selectedPatch.source_feedback.feedback_text}
                  </p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium">Review Notes (optional)</label>
                <Textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Add notes about your decision..."
                  className="mt-1"
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setReviewDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => handlePatchAction('reject')}
              disabled={isSubmitting}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Reject
            </Button>
            <Button
              onClick={() => handlePatchAction('approve')}
              disabled={isSubmitting}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
