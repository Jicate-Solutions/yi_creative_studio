'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { CheckCircle, XCircle, Clock, Play, RefreshCw } from 'lucide-react'

interface KnowledgePatch {
  id: string
  target_file: string
  patch_type: string
  proposed_content: string
  reasoning: string
  feedback_count: number
  pattern_confidence: number
  status: string
  created_at: string
  review_notes?: string
}

export default function KnowledgePatchesPage() {
  const [patches, setPatches] = useState<KnowledgePatch[]>([])
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)

  useEffect(() => {
    loadPatches()
  }, [])

  async function loadPatches() {
    setLoading(true)
    const supabase = createClient()
    // Note: Using type assertion as knowledge_patches may not be in generated types yet
    const { data } = await (supabase.from as Function)('knowledge_patches')
      .select('*')
      .order('created_at', { ascending: false })

    setPatches(data || [])
    setLoading(false)
  }

  async function runAnalysis() {
    setAnalyzing(true)
    try {
      const response = await fetch('/api/agents/feedback-analyzer', {
        method: 'POST',
      })
      const result = await response.json()

      if (result.error) {
        alert(`Analysis failed: ${result.error}`)
      } else {
        alert(
          `Analyzed ${result.analyzed} feedback entries. Created ${result.patchesCreated} patches.`
        )
        loadPatches()
      }
    } catch (error) {
      console.error('Analysis error:', error)
      alert('Failed to run analysis')
    } finally {
      setAnalyzing(false)
    }
  }

  async function updatePatchStatus(
    patchId: string,
    status: 'approved' | 'rejected',
    notes?: string
  ) {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Note: Using type assertion as knowledge_patches may not be in generated types yet
    const { error } = await (supabase.from as Function)('knowledge_patches')
      .update({
        status,
        reviewed_by: user?.id,
        reviewed_at: new Date().toISOString(),
        review_notes: notes,
      })
      .eq('id', patchId)

    if (error) {
      console.error('Failed to update patch status:', error)
      alert('Failed to update patch status')
    } else {
      loadPatches()
    }
  }

  async function applyPatch(patchId: string) {
    const confirmed = window.confirm(
      'Are you sure you want to apply this patch to the knowledge base?'
    )
    if (!confirmed) return

    try {
      const response = await fetch('/api/knowledge-patches/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patchId }),
      })

      const result = await response.json()

      if (response.ok) {
        alert('Patch applied successfully!')
        loadPatches()
      } else {
        alert(`Failed to apply patch: ${result.error}`)
      }
    } catch (error) {
      console.error('Apply patch error:', error)
      alert('Failed to apply patch')
    }
  }

  const pendingPatches = patches.filter((p) => p.status === 'pending')
  const approvedPatches = patches.filter((p) => p.status === 'approved')
  const appliedPatches = patches.filter((p) => p.status === 'applied')
  const rejectedPatches = patches.filter((p) => p.status === 'rejected')

  return (
    <div className="container py-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Knowledge Base Patches</h1>
          <p className="text-muted-foreground">
            Review AI-proposed improvements to the prompt knowledge base
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadPatches} disabled={loading}>
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`}
            />
            Refresh
          </Button>
          <Button onClick={runAnalysis} disabled={analyzing}>
            <Play className="h-4 w-4 mr-2" />
            {analyzing ? 'Analyzing...' : 'Run Feedback Analysis'}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              <span className="text-2xl font-bold">{pendingPatches.length}</span>
              <span className="text-muted-foreground">Pending</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-2xl font-bold">
                {approvedPatches.length}
              </span>
              <span className="text-muted-foreground">Ready</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-blue-500" />
              <span className="text-2xl font-bold">{appliedPatches.length}</span>
              <span className="text-muted-foreground">Applied</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              <span className="text-2xl font-bold">
                {rejectedPatches.length}
              </span>
              <span className="text-muted-foreground">Rejected</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Patches */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Pending Review</h2>
        {pendingPatches.map((patch) => (
          <PatchCard
            key={patch.id}
            patch={patch}
            onApprove={() => updatePatchStatus(patch.id, 'approved')}
            onReject={(notes) => updatePatchStatus(patch.id, 'rejected', notes)}
          />
        ))}
        {pendingPatches.length === 0 && (
          <p className="text-muted-foreground py-4">
            No patches pending review. Run feedback analysis to generate
            patches.
          </p>
        )}
      </div>

      {/* Approved Patches */}
      {approvedPatches.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Ready to Apply</h2>
          {approvedPatches.map((patch) => (
            <PatchCard
              key={patch.id}
              patch={patch}
              onApply={() => applyPatch(patch.id)}
            />
          ))}
        </div>
      )}

      {/* Applied Patches */}
      {appliedPatches.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-muted-foreground">
            Applied
          </h2>
          {appliedPatches.slice(0, 5).map((patch) => (
            <PatchCard key={patch.id} patch={patch} />
          ))}
          {appliedPatches.length > 5 && (
            <p className="text-sm text-muted-foreground">
              And {appliedPatches.length - 5} more applied patches...
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function PatchCard({
  patch,
  onApprove,
  onReject,
  onApply,
}: {
  patch: KnowledgePatch
  onApprove?: () => void
  onReject?: (notes: string) => void
  onApply?: () => void
}) {
  const [rejectNotes, setRejectNotes] = useState('')
  const [showRejectForm, setShowRejectForm] = useState(false)

  function getStatusVariant(
    status: string
  ): 'default' | 'secondary' | 'destructive' | 'outline' {
    switch (status) {
      case 'pending':
        return 'secondary'
      case 'approved':
        return 'default'
      case 'applied':
        return 'outline'
      case 'rejected':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="space-y-1">
          <CardTitle className="text-base font-mono">
            {patch.target_file}
          </CardTitle>
          <div className="flex flex-wrap gap-2">
            <Badge
              variant={
                patch.patch_type === 'addition' ? 'default' : 'secondary'
              }
            >
              {patch.patch_type}
            </Badge>
            <Badge variant="outline">
              {Math.round(patch.pattern_confidence * 100)}% confidence
            </Badge>
            <Badge variant="outline">
              {patch.feedback_count} feedback{' '}
              {patch.feedback_count === 1 ? 'entry' : 'entries'}
            </Badge>
          </div>
        </div>
        <Badge variant={getStatusVariant(patch.status)}>{patch.status}</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-medium mb-2">Proposed Change</h4>
          <pre className="bg-muted p-3 rounded text-sm overflow-x-auto whitespace-pre-wrap">
            {patch.proposed_content}
          </pre>
        </div>
        <div>
          <h4 className="font-medium mb-1">Reasoning</h4>
          <p className="text-sm text-muted-foreground">{patch.reasoning}</p>
        </div>

        {patch.review_notes && (
          <div>
            <h4 className="font-medium mb-1">Review Notes</h4>
            <p className="text-sm text-muted-foreground">{patch.review_notes}</p>
          </div>
        )}

        {patch.status === 'pending' && onApprove && onReject && (
          <div className="flex gap-2 pt-2">
            <Button
              onClick={onApprove}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Approve
            </Button>
            <Button
              variant="destructive"
              onClick={() => setShowRejectForm(!showRejectForm)}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Reject
            </Button>
          </div>
        )}

        {showRejectForm && (
          <div className="space-y-2 pt-2 border-t">
            <Textarea
              placeholder="Reason for rejection (optional)..."
              value={rejectNotes}
              onChange={(e) => setRejectNotes(e.target.value)}
            />
            <div className="flex gap-2">
              <Button
                variant="destructive"
                onClick={() => {
                  onReject?.(rejectNotes)
                  setShowRejectForm(false)
                  setRejectNotes('')
                }}
              >
                Confirm Rejection
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowRejectForm(false)
                  setRejectNotes('')
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {patch.status === 'approved' && onApply && (
          <div className="pt-2">
            <Button onClick={onApply}>Apply to Knowledge Base</Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
