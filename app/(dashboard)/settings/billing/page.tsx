'use client'

import { useState, useEffect, useCallback } from 'react'
import { useCredits, useOrganization } from '@/hooks'
import { useAuthStore } from '@/stores/auth-store'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import {
  Coins,
  CreditCard,
  TrendingUp,
  TrendingDown,
  SendHorizontal,
  Loader2,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react'
import { CREDIT_PACKAGES } from '@/lib/config/constants'
import { format } from 'date-fns'
import { createClient } from '@/lib/supabase/client'

interface CreditRequest {
  id: string
  package_id: string
  package_name: string
  credits_amount: number
  price_inr: number
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  rejection_reason?: string
  created_at: string
  reviewed_at?: string
}

export default function BillingPage() {
  const { balance, transactions, isLoading } = useCredits()
  const { organization } = useOrganization()
  const { canManage, currentOrganization } = useAuthStore()

  // Fix hydration mismatch
  const [isMounted, setIsMounted] = useState(false)
  useEffect(() => {
    setIsMounted(true)
  }, [])

  const isAdmin = isMounted ? canManage() : false

  const [requestingPackage, setRequestingPackage] = useState<string | null>(null)
  const [creditRequests, setCreditRequests] = useState<CreditRequest[]>([])
  const [loadingRequests, setLoadingRequests] = useState(true)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [requestToCancel, setRequestToCancel] = useState<string | null>(null)

  // Fetch credit requests
  const fetchCreditRequests = useCallback(async () => {
    if (!currentOrganization?.id) return

    try {
      const response = await fetch(
        `/api/billing/request-credits?organizationId=${currentOrganization.id}`
      )
      const data = await response.json()

      if (data.requests) {
        setCreditRequests(data.requests)
      }
    } catch (error) {
      console.error('Error fetching credit requests:', error)
    } finally {
      setLoadingRequests(false)
    }
  }, [currentOrganization?.id])

  useEffect(() => {
    fetchCreditRequests()
  }, [fetchCreditRequests])

  // Check if there's a pending request
  const pendingRequest = creditRequests.find((r) => r.status === 'pending')

  const handleRequestCredits = async (packageId: string) => {
    if (!isAdmin) {
      toast.error('Only admins can request credits')
      return
    }

    if (!currentOrganization?.id) {
      toast.error('Organization not found')
      return
    }

    if (pendingRequest) {
      toast.error(
        `You already have a pending request for ${pendingRequest.package_name}. Please wait for admin approval.`
      )
      return
    }

    const pkg = CREDIT_PACKAGES.find((p) => p.id === packageId)
    if (!pkg) return

    setRequestingPackage(packageId)

    try {
      const response = await fetch('/api/billing/request-credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageId,
          organizationId: currentOrganization.id,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success(data.message)
        fetchCreditRequests() // Refresh the list
      } else {
        toast.error(data.error || 'Failed to submit request')
      }
    } catch (error) {
      console.error('Request error:', error)
      toast.error('Failed to submit credit request')
    } finally {
      setRequestingPackage(null)
    }
  }

  const handleCancelRequest = async () => {
    if (!requestToCancel) return

    try {
      const supabase = createClient()
      // Note: Using 'any' cast as credit_requests table types need regeneration
      const { error } = await supabase
        .from('credit_requests' as any)
        .update({ status: 'cancelled' })
        .eq('id', requestToCancel)
        .eq('status', 'pending')

      if (error) throw error

      toast.success('Request cancelled')
      fetchCreditRequests()
    } catch (error) {
      console.error('Cancel error:', error)
      toast.error('Failed to cancel request')
    } finally {
      setCancelDialogOpen(false)
      setRequestToCancel(null)
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

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'purchase':
        return <TrendingUp className="h-4 w-4 text-green-500" />
      case 'usage':
        return <TrendingDown className="h-4 w-4 text-orange-500" />
      case 'refund':
        return <TrendingUp className="h-4 w-4 text-blue-500" />
      default:
        return <Coins className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Billing & Usage</h1>
        <p className="text-muted-foreground">
          Manage your credit balance and view transaction history
        </p>
      </div>

      {/* Balance Card */}
      <Card className="bg-gradient-to-br from-primary/10 to-secondary/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-yellow-500" />
            Credit Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-bold">{balance.toLocaleString()}</span>
            <span className="text-xl text-muted-foreground">credits</span>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Each creative generation costs 1-2 credits depending on the AI model
          </p>
        </CardContent>
      </Card>

      {/* Pending Request Alert */}
      {pendingRequest && (
        <Card className="border-yellow-300 bg-yellow-50">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="font-medium text-yellow-800">
                    Pending Credit Request
                  </p>
                  <p className="text-sm text-yellow-700">
                    {pendingRequest.package_name} ({pendingRequest.credits_amount} credits) -
                    Requested on {format(new Date(pendingRequest.created_at), 'MMM d, yyyy')}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="text-yellow-700 border-yellow-400 hover:bg-yellow-100"
                onClick={() => {
                  setRequestToCancel(pendingRequest.id)
                  setCancelDialogOpen(true)
                }}
              >
                Cancel Request
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Credit Packages */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Buy Credits</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {CREDIT_PACKAGES.map((pkg) => (
            <Card
              key={pkg.id}
              className={`relative ${pkg.popular ? 'border-2 border-primary' : ''}`}
            >
              {pkg.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="gradient-yi text-white">Most Popular</Badge>
                </div>
              )}

              <CardHeader className="text-center pb-2">
                <CardTitle className="text-lg">{pkg.name}</CardTitle>
                <CardDescription>{pkg.credits.toLocaleString()} credits</CardDescription>
              </CardHeader>

              <CardContent className="text-center pb-4">
                <div className="mb-2">
                  <span className="text-3xl font-bold">
                    ₹{pkg.priceINR.toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  ₹{(pkg.priceINR / pkg.credits).toFixed(2)} per credit
                </p>
              </CardContent>

              <CardFooter>
                {isAdmin ? (
                  <Button
                    className={`w-full ${pkg.popular ? 'gradient-yi hover:opacity-90' : ''}`}
                    variant={pkg.popular ? 'default' : 'outline'}
                    onClick={() => handleRequestCredits(pkg.id)}
                    disabled={requestingPackage === pkg.id || !!pendingRequest}
                  >
                    {requestingPackage === pkg.id ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <SendHorizontal className="h-4 w-4 mr-2" />
                    )}
                    {pendingRequest ? 'Request Pending' : 'Request Credits'}
                  </Button>
                ) : (
                  <Button className="w-full" variant="outline" disabled>
                    Admin Only
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
        <p className="text-sm text-muted-foreground mt-3 text-center">
          Credit requests require admin approval before being added to your account
        </p>
      </div>

      {/* Credit Request History */}
      {creditRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SendHorizontal className="h-5 w-5" />
              Credit Requests
            </CardTitle>
            <CardDescription>
              Your organization&apos;s credit request history
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingRequests ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-12" />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Package</TableHead>
                    <TableHead>Credits</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {creditRequests.slice(0, 10).map((req) => (
                    <TableRow key={req.id}>
                      <TableCell className="font-medium">{req.package_name}</TableCell>
                      <TableCell>{req.credits_amount.toLocaleString()}</TableCell>
                      <TableCell>₹{req.price_inr.toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {getStatusBadge(req.status)}
                          {req.rejection_reason && (
                            <span className="text-xs text-red-600">
                              {req.rejection_reason}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(req.created_at), 'MMM d, yyyy')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Transaction History
          </CardTitle>
          <CardDescription>
            Recent credit transactions for your organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Coins className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No transactions yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getTransactionIcon(tx.type)}
                        <span className="capitalize">{tx.type}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {tx.description || '-'}
                    </TableCell>
                    <TableCell>
                      <span
                        className={
                          tx.amount > 0 ? 'text-green-600' : 'text-orange-600'
                        }
                      >
                        {tx.amount > 0 ? '+' : ''}
                        {tx.amount}
                      </span>
                    </TableCell>
                    <TableCell>{tx.balance_after}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(tx.created_at), 'MMM d, yyyy')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Cancel Request Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Credit Request?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this credit request? You can submit a new request afterwards.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Request</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelRequest}>
              Cancel Request
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
