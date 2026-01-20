'use client'

/**
 * All Organizations Credits Table Component
 * Display all organizations with credit balances and quick allocation
 */

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { Search, Plus } from 'lucide-react'
import { useAutoRefresh } from '@/hooks/use-auto-refresh'
import { RefreshIndicator } from '@/components/super-admin/RefreshIndicator'
import { toast } from 'react-hot-toast'

interface OrganizationCredit {
  organization_id: string
  organization_name: string
  balance: number
  total_allocated: number
  total_consumed: number
  last_allocation_at: string | null
}

export default function AllOrganizationsCreditsTable() {
  const [organizations, setOrganizations] = useState<OrganizationCredit[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedOrg, setSelectedOrg] = useState<OrganizationCredit | null>(null)
  const [allocateDialogOpen, setAllocateDialogOpen] = useState(false)
  const [allocateAmount, setAllocateAmount] = useState('')
  const [allocateReason, setAllocateReason] = useState('')
  const [allocating, setAllocating] = useState(false)

  // Auto-refresh every 15 seconds
  const { isRefreshing, lastRefresh, manualRefresh } = useAutoRefresh({
    onRefresh: fetchOrganizations,
    interval: 15000,
  })

  useEffect(() => {
    fetchOrganizations()
  }, [search])

  async function fetchOrganizations() {
    setLoading(true)

    const params = new URLSearchParams({
      search,
    })

    try {
      const response = await fetch(`/api/super-admin/credits/organizations?${params}`)
      const data = await response.json()

      if (data.success) {
        setOrganizations(data.organizations)
      }
    } catch (error) {
      console.error('Failed to fetch organizations:', error)
    } finally {
      setLoading(false)
    }
  }

  function openAllocateDialog(org: OrganizationCredit) {
    setSelectedOrg(org)
    setAllocateAmount('')
    setAllocateReason('')
    setAllocateDialogOpen(true)
  }

  async function handleAllocate() {
    if (!selectedOrg || !allocateAmount || !allocateReason) {
      toast.error('Please fill in all fields')
      return
    }

    const amount = parseInt(allocateAmount)
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    setAllocating(true)

    try {
      const response = await fetch('/api/super-admin/credits/allocate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_id: selectedOrg.organization_id,
          amount,
          reason: allocateReason,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success(`Allocated ${amount.toLocaleString()} credits to ${selectedOrg.organization_name}`)
        setAllocateDialogOpen(false)
        fetchOrganizations()
      } else {
        toast.error(data.error || 'Failed to allocate credits')
      }
    } catch (error) {
      console.error('Failed to allocate credits:', error)
      toast.error('Failed to allocate credits')
    } finally {
      setAllocating(false)
    }
  }

  function getBalanceBadge(balance: number) {
    if (balance >= 1000) {
      return <Badge className="bg-green-100 text-green-800">Healthy</Badge>
    } else if (balance >= 100) {
      return <Badge className="bg-yellow-100 text-yellow-800">Low</Badge>
    } else {
      return <Badge className="bg-red-100 text-red-800">Critical</Badge>
    }
  }

  function formatDate(dateString: string | null) {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <div className="space-y-4">
      {/* Search & Filters */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search organizations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Auto-refresh indicator */}
        <RefreshIndicator
          lastRefresh={lastRefresh}
          isRefreshing={isRefreshing}
          onManualRefresh={manualRefresh}
        />
      </div>

      {/* Table */}
      <div className="border rounded-lg bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Organization</TableHead>
              <TableHead>Current Balance</TableHead>
              <TableHead>Total Allocated</TableHead>
              <TableHead>Total Consumed</TableHead>
              <TableHead>Last Allocation</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  Loading organizations...
                </TableCell>
              </TableRow>
            ) : organizations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  No organizations found
                </TableCell>
              </TableRow>
            ) : (
              organizations.map((org) => (
                <TableRow key={org.organization_id}>
                  <TableCell className="font-medium">
                    <div>
                      <div className="font-semibold">{org.organization_name}</div>
                      <div className="text-xs text-gray-500">{org.organization_id}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-lg font-bold">{org.balance.toLocaleString()}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-600">
                      {org.total_allocated.toLocaleString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-600">
                      {org.total_consumed.toLocaleString()}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {formatDate(org.last_allocation_at)}
                  </TableCell>
                  <TableCell>{getBalanceBadge(org.balance)}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openAllocateDialog(org)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Allocate
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Allocate Credits Dialog */}
      <Dialog open={allocateDialogOpen} onOpenChange={setAllocateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Allocate Credits</DialogTitle>
            <DialogDescription>
              Add credits to {selectedOrg?.organization_name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Amount</label>
              <Input
                type="number"
                placeholder="e.g., 1000"
                value={allocateAmount}
                onChange={(e) => setAllocateAmount(e.target.value)}
                min="1"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Reason</label>
              <Input
                placeholder="e.g., Monthly subscription renewal"
                value={allocateReason}
                onChange={(e) => setAllocateReason(e.target.value)}
              />
            </div>

            <div className="text-sm text-gray-500">
              Current balance: <span className="font-medium">{selectedOrg?.balance.toLocaleString()}</span>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAllocateDialogOpen(false)}
              disabled={allocating}
            >
              Cancel
            </Button>
            <Button onClick={handleAllocate} disabled={allocating}>
              {allocating ? 'Allocating...' : 'Allocate Credits'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
