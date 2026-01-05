'use client'

import { useState, useEffect, useMemo } from 'react'
import { redirect } from 'next/navigation'
import { useClientAdmin } from '@/hooks/use-client-admin'
import { useAuthStore } from '@/stores/auth-store'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Loader2, Search, Plus, DollarSign, TrendingUp } from 'lucide-react'
import { ROUTES } from '@/lib/config/constants'

// Type definitions
type Organization = {
  id: string
  name: string
  slug: string
  type: string
  credits_balance: number
}

type CreditTransaction = {
  id: string
  amount: number
  balance_after: number
  description: string | null
  created_at: string
  organization?: { name: string }
}

export default function AdminCreditsPage() {
  const { isAdmin, isReady } = useClientAdmin()
  const { currentOrganization } = useAuthStore()

  // Redirect non-admins
  if (isReady && !isAdmin) {
    redirect(ROUTES.billing)
  }

  if (!isReady) {
    return null // Loading state is handled by loading.tsx
  }

  return <AdminCreditsUI currentOrg={currentOrganization} />
}

function AdminCreditsUI({ currentOrg }: { currentOrg: any }) {
  const supabase = createClient()

  // State
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [transactions, setTransactions] = useState<CreditTransaction[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null)
  const [amount, setAmount] = useState('')
  const [amountINR, setAmountINR] = useState('')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Quick add state
  const [quickAmount, setQuickAmount] = useState('')
  const [quickDesc, setQuickDesc] = useState('')

  // Fetch organizations on mount
  useEffect(() => {
    fetchOrganizations()
    fetchTransactions()
  }, [])

  const fetchOrganizations = async () => {
    const { data, error } = await supabase
      .from('organizations')
      .select('id, name, slug, type, credits_balance')
      .order('name')

    if (error) {
      console.error('Error fetching organizations:', error)
      toast.error('Failed to load organizations')
      return
    }

    setOrganizations(data || [])
  }

  const fetchTransactions = async () => {
    const { data, error } = await supabase
      .from('credit_transactions')
      .select(`
        id,
        amount,
        balance_after,
        description,
        created_at,
        organization_id,
        organizations!inner(name)
      `)
      .eq('type', 'purchase')
      .like('payment_id', 'admin-manual-%')
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) {
      console.error('Error fetching transactions:', error)
      return
    }

    // Transform data to match expected structure
    const transformedData = data?.map(tx => ({
      ...tx,
      organization: { name: (tx.organizations as any).name }
    })) || []

    setTransactions(transformedData)
  }

  // Filter organizations based on search
  const filteredOrgs = useMemo(() => {
    if (!searchQuery) return organizations

    const query = searchQuery.toLowerCase()
    return organizations.filter(org =>
      org.name.toLowerCase().includes(query) ||
      org.slug.toLowerCase().includes(query) ||
      org.type.toLowerCase().includes(query)
    )
  }, [organizations, searchQuery])

  // Handle add credits
  const handleAddCredits = async (orgId: string, orgName: string) => {
    if (isSubmitting) return

    const creditAmount = parseFloat(amount)

    // Validation
    if (!creditAmount || creditAmount <= 0) {
      toast.error('Please enter a valid amount greater than 0')
      return
    }

    if (creditAmount > 100000) {
      toast.error('Maximum 100,000 credits per addition')
      return
    }

    // Confirmation for large amounts
    if (creditAmount > 5000) {
      const confirmed = confirm(`Add ${creditAmount} credits to ${orgName}?`)
      if (!confirmed) return
    }

    setIsSubmitting(true)

    try {
      const { data, error } = await supabase.rpc('add_credits', {
        p_organization_id: orgId,
        p_amount: creditAmount,
        p_amount_inr: parseFloat(amountINR || '0'),
        p_payment_id: `admin-manual-${Date.now()}`,
        p_description: description || `Admin credit addition - ${orgName}`,
      })

      if (error || !data?.[0]?.success) {
        throw new Error(error?.message || 'RPC failed')
      }

      toast.success(`Added ${creditAmount} credits to ${orgName}`)

      // Refresh data
      await Promise.all([fetchOrganizations(), fetchTransactions()])

      // Reset form
      setAmount('')
      setAmountINR('')
      setDescription('')
      setDialogOpen(false)

    } catch (err: any) {
      console.error('Add credits error:', err)
      toast.error(err.message || 'Failed to add credits. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle quick add for current org
  const handleQuickAdd = async () => {
    if (!currentOrg || !quickAmount || isSubmitting) return

    const creditAmount = parseFloat(quickAmount)

    if (!creditAmount || creditAmount <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    if (creditAmount > 100000) {
      toast.error('Maximum 100,000 credits per addition')
      return
    }

    setIsSubmitting(true)

    try {
      const { data, error } = await supabase.rpc('add_credits', {
        p_organization_id: currentOrg.id,
        p_amount: creditAmount,
        p_amount_inr: 0,
        p_payment_id: `admin-manual-${Date.now()}`,
        p_description: quickDesc || `Quick credit addition - ${currentOrg.name}`,
      })

      if (error || !data?.[0]?.success) {
        throw new Error(error?.message || 'RPC failed')
      }

      toast.success(`Added ${creditAmount} credits to ${currentOrg.name}`)

      // Refresh data
      await Promise.all([fetchOrganizations(), fetchTransactions()])

      // Reset form
      setQuickAmount('')
      setQuickDesc('')

    } catch (err: any) {
      console.error('Quick add error:', err)
      toast.error(err.message || 'Failed to add credits')
    } finally {
      setIsSubmitting(false)
    }
  }

  const openDialog = (org: Organization) => {
    setSelectedOrg(org)
    setAmount('')
    setAmountINR('')
    setDescription('')
    setDialogOpen(true)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Admin - Credit Management</h1>
        <p className="text-muted-foreground mt-1">
          Manage credits across all organizations
        </p>
      </div>

      {/* Quick Add Card - Current Organization */}
      {currentOrg && (
        <Card className="glass-card border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Quick Add - {currentOrg.name}
            </CardTitle>
            <CardDescription>
              Current Balance: {currentOrg.credits_balance?.toLocaleString() || 0} credits
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                type="number"
                placeholder="Amount"
                value={quickAmount}
                onChange={(e) => setQuickAmount(e.target.value)}
                className="w-full sm:w-32"
                min="1"
                max="100000"
              />
              <Input
                placeholder="Description (optional)"
                value={quickDesc}
                onChange={(e) => setQuickDesc(e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={handleQuickAdd}
                disabled={!quickAmount || isSubmitting}
                className="gradient-yi w-full sm:w-auto"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Credits
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Organizations */}
      <Card>
        <CardHeader>
          <CardTitle>All Organizations</CardTitle>
          <CardDescription>View and manage credits for all organizations</CardDescription>

          {/* Search */}
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search organizations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent>
          {/* Mobile: Card Layout */}
          <div className="block md:hidden space-y-3">
            {filteredOrgs.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                {searchQuery ? 'No organizations found' : 'No organizations available'}
              </p>
            ) : (
              filteredOrgs.map(org => (
                <Card key={org.id} className="border-muted">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{org.name}</p>
                        <Badge variant="outline" className="mt-1">
                          {org.type.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">{org.credits_balance.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">credits</p>
                        <Button
                          size="sm"
                          onClick={() => openDialog(org)}
                          className="mt-2"
                        >
                          Add
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Desktop: Table Layout */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organization</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrgs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      {searchQuery ? 'No organizations found' : 'No organizations available'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrgs.map(org => (
                    <TableRow key={org.id}>
                      <TableCell className="font-medium">{org.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{org.type.replace('_', ' ')}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {org.credits_balance.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          onClick={() => openDialog(org)}
                        >
                          Add Credits
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      {transactions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Recent Credit Additions
            </CardTitle>
            <CardDescription>Last 20 admin credit additions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Organization</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">New Balance</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map(tx => (
                    <TableRow key={tx.id}>
                      <TableCell className="text-sm">{formatDate(tx.created_at)}</TableCell>
                      <TableCell>{tx.organization?.name}</TableCell>
                      <TableCell className="text-right text-green-600 font-medium">
                        +{tx.amount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {tx.balance_after.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {tx.description || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Credits Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Credits to {selectedOrg?.name}</DialogTitle>
            <DialogDescription>
              Current balance: {selectedOrg?.credits_balance.toLocaleString()} credits
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="amount">Amount (Credits) *</Label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="1000"
                min="1"
                max="100000"
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="amountINR">INR Amount (Optional)</Label>
              <Input
                id="amountINR"
                type="number"
                value={amountINR}
                onChange={(e) => setAmountINR(e.target.value)}
                placeholder="499"
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                For audit trail purposes only
              </p>
            </div>

            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Promotional credits"
                className="mt-1"
              />
            </div>

            {amount && selectedOrg && (
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex justify-between text-sm">
                  <span>Current Balance:</span>
                  <span className="font-mono">{selectedOrg.credits_balance.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-green-600 border-t border-muted-foreground/20 mt-1 pt-1">
                  <span>New Balance:</span>
                  <span className="font-mono">
                    {(selectedOrg.credits_balance + parseFloat(amount)).toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => selectedOrg && handleAddCredits(selectedOrg.id, selectedOrg.name)}
              disabled={!amount || isSubmitting}
              className="gradient-yi"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Adding...
                </>
              ) : (
                `Add ${amount || '0'} Credits`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
