'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Building2,
  Coins,
  RefreshCcw,
} from 'lucide-react'
import { format } from 'date-fns'

interface CreditRequest {
  id: string
  organization_id: string
  requested_by: string
  package_id: string
  package_name: string
  credits_amount: number
  price_inr: number
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  rejection_reason?: string
  admin_notes?: string
  created_at: string
  reviewed_at?: string
  organization?: {
    name: string
    slug: string
    credits_balance: number
  }
  requester?: {
    email: string
    raw_user_meta_data?: {
      full_name?: string
    }
  }
}

export default function CreditRequestsPage() {
  const [requests, setRequests] = useState<CreditRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('pending')
  const [processingId, setProcessingId] = useState<string | null>(null)

  // Dialogs
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<CreditRequest | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true)
      const supabase = createClient()

      // Note: Using 'any' cast as credit_requests table types need regeneration
      let query = supabase
        .from('credit_requests' as any)
        .select(`
          *,
          organization:organizations(name, slug, credits_balance),
          requester:requested_by(email, raw_user_meta_data)
        `)
        .order('created_at', { ascending: false })

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }

      const { data, error } = await query.limit(100)

      if (error) throw error
      setRequests((data || []) as unknown as CreditRequest[])
    } catch (error) {
      console.error('Error fetching requests:', error)
      toast.error('Failed to load credit requests')
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    fetchRequests()
  }, [fetchRequests])

  const handleApprove = async (request: CreditRequest) => {
    setProcessingId(request.id)

    try {
      const response = await fetch('/api/billing/approve-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId: request.id }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success(
          `Approved ${request.credits_amount} credits for ${request.organization?.name}`
        )
        fetchRequests()
      } else {
        toast.error(data.error || 'Failed to approve request')
      }
    } catch (error) {
      console.error('Approve error:', error)
      toast.error('Failed to approve request')
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async () => {
    if (!selectedRequest) return

    setProcessingId(selectedRequest.id)

    try {
      const response = await fetch('/api/billing/reject-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: selectedRequest.id,
          rejectionReason: rejectionReason || 'Request rejected by admin',
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Credit request rejected')
        fetchRequests()
      } else {
        toast.error(data.error || 'Failed to reject request')
      }
    } catch (error) {
      console.error('Reject error:', error)
      toast.error('Failed to reject request')
    } finally {
      setProcessingId(null)
      setRejectDialogOpen(false)
      setSelectedRequest(null)
      setRejectionReason('')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline" className="gap-1 text-yellow-600 border-yellow-300 bg-yellow-50">
            <Clock className="h-3 w-3" />
            Pending
          </Badge>
        )
      case 'approved':
        return (
          <Badge variant="outline" className="gap-1 text-green-600 border-green-300 bg-green-50">
            <CheckCircle2 className="h-3 w-3" />
            Approved
          </Badge>
        )
      case 'rejected':
        return (
          <Badge variant="outline" className="gap-1 text-red-600 border-red-300 bg-red-50">
            <XCircle className="h-3 w-3" />
            Rejected
          </Badge>
        )
      case 'cancelled':
        return (
          <Badge variant="outline" className="gap-1 text-gray-600 border-gray-300 bg-gray-50">
            <XCircle className="h-3 w-3" />
            Cancelled
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const pendingCount = requests.filter((r) => r.status === 'pending').length

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Credit Requests</h1>
        <p className="text-muted-foreground">
          Review and approve credit purchase requests from organizations
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-100">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingCount}</p>
                <p className="text-sm text-muted-foreground">Pending Requests</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {requests.filter((r) => r.status === 'approved').length}
                </p>
                <p className="text-sm text-muted-foreground">Total Approved</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Coins className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {requests
                    .filter((r) => r.status === 'approved')
                    .reduce((sum, r) => sum + r.credits_amount, 0)
                    .toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">Credits Approved</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Requests Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Credit Requests</CardTitle>
              <CardDescription>
                Organizations requesting credit packages
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Filter status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Requests</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={fetchRequests}>
                <RefreshCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No credit requests found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organization</TableHead>
                  <TableHead>Package</TableHead>
                  <TableHead>Credits</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Current Balance</TableHead>
                  <TableHead>Requested By</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">
                            {request.organization?.name || 'Unknown'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {request.organization?.slug}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{request.package_name}</TableCell>
                    <TableCell className="font-medium">
                      {request.credits_amount.toLocaleString()}
                    </TableCell>
                    <TableCell>₹{request.price_inr.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {request.organization?.credits_balance?.toLocaleString() || 0}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">
                          {request.requester?.raw_user_meta_data?.full_name ||
                            request.requester?.email?.split('@')[0] ||
                            'Unknown'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {request.requester?.email}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(request.created_at), 'MMM d, yyyy')}
                      <br />
                      <span className="text-xs">
                        {format(new Date(request.created_at), 'h:mm a')}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {getStatusBadge(request.status)}
                        {request.rejection_reason && (
                          <span className="text-xs text-red-600 max-w-[150px] truncate">
                            {request.rejection_reason}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {request.status === 'pending' && (
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleApprove(request)}
                            disabled={processingId === request.id}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            {processingId === request.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <CheckCircle2 className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              setSelectedRequest(request)
                              setRejectDialogOpen(true)
                            }}
                            disabled={processingId === request.id}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Credit Request</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting this credit request. The organization
              will see this reason.
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-muted">
                <p className="font-medium">{selectedRequest.organization?.name}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedRequest.package_name} - {selectedRequest.credits_amount} credits
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Rejection Reason</Label>
                <Textarea
                  id="reason"
                  placeholder="e.g., Payment not received, duplicate request, etc."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={processingId !== null}
            >
              {processingId ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Reject Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
