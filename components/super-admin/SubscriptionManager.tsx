'use client'

/**
 * Subscription Manager Component
 * Manage organization subscription tiers and view subscription status
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import {
  Crown,
  Building2,
  Coins,
  Users,
  AlertCircle,
  CheckCircle2,
  CreditCard,
  Search,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAutoRefresh } from '@/hooks/use-auto-refresh'
import { RefreshIndicator } from '@/components/super-admin/RefreshIndicator'

// Subscription tiers definition
const SUBSCRIPTION_TIERS = {
  free: {
    name: 'Free',
    color: 'bg-gray-100 text-gray-700',
    features: ['10 credits/month', 'Basic formats', 'Community support'],
    creditAllocation: 10,
  },
  pro: {
    name: 'Pro',
    color: 'bg-blue-100 text-blue-700',
    features: ['100 credits/month', 'All formats', 'Priority support', 'Custom branding'],
    creditAllocation: 100,
  },
  enterprise: {
    name: 'Enterprise',
    color: 'bg-purple-100 text-purple-700',
    features: ['Unlimited credits', 'All formats', 'Dedicated support', 'API access', 'SSO'],
    creditAllocation: 1000,
  },
} as const

type SubscriptionTier = keyof typeof SUBSCRIPTION_TIERS

interface Organization {
  id: string
  name: string
  slug: string
  type: string
  is_active: boolean
  credits_balance: number
  created_at: string
  member_count: number
  // Derived subscription tier based on credits or type
  subscription_tier: SubscriptionTier
}

interface SubscriptionHistory {
  date: string
  from_tier: SubscriptionTier
  to_tier: SubscriptionTier
  changed_by: string
  reason?: string
}

export default function SubscriptionManager() {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterTier, setFilterTier] = useState<string>('all')

  // Change tier dialog
  const [changeTierDialog, setChangeTierDialog] = useState(false)
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null)
  const [newTier, setNewTier] = useState<SubscriptionTier>('free')
  const [changeReason, setChangeReason] = useState('')
  const [changingTier, setChangingTier] = useState(false)

  // Auto-refresh
  const { isRefreshing, lastRefresh, manualRefresh } = useAutoRefresh({
    onRefresh: fetchOrganizations,
    interval: 60000,
  })

  useEffect(() => {
    fetchOrganizations()
  }, [])

  async function fetchOrganizations() {
    try {
      const response = await fetch('/api/super-admin/organizations/list')
      const data = await response.json()

      if (data.success) {
        // Map organizations with derived subscription tier
        const orgsWithTier = data.organizations.map((org: Organization) => ({
          ...org,
          subscription_tier: deriveSubscriptionTier(org),
        }))
        setOrganizations(orgsWithTier)
      } else {
        throw new Error(data.error || 'Failed to fetch organizations')
      }
    } catch (error) {
      toast.error('Failed to load organizations')
      console.error('Error fetching organizations:', error)
    } finally {
      setLoading(false)
    }
  }

  // Derive subscription tier based on credits balance
  // In future, this will come from a dedicated subscription table
  function deriveSubscriptionTier(org: Organization): SubscriptionTier {
    const balance = org.credits_balance || 0
    if (balance >= 500) return 'enterprise'
    if (balance >= 50) return 'pro'
    return 'free'
  }

  function openChangeTierDialog(org: Organization) {
    setSelectedOrg(org)
    setNewTier(org.subscription_tier)
    setChangeReason('')
    setChangeTierDialog(true)
  }

  async function handleChangeTier() {
    if (!selectedOrg) return

    setChangingTier(true)
    try {
      // For now, we change the tier by adjusting credits
      // In future with Razorpay, this will update a subscriptions table
      const creditAllocation = SUBSCRIPTION_TIERS[newTier].creditAllocation

      const response = await fetch('/api/super-admin/credits/allocate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_id: selectedOrg.id,
          amount: creditAllocation,
          reason: `Tier change to ${SUBSCRIPTION_TIERS[newTier].name}: ${changeReason || 'Manual adjustment'}`,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success(`Changed ${selectedOrg.name} to ${SUBSCRIPTION_TIERS[newTier].name} tier`)
        setChangeTierDialog(false)
        fetchOrganizations()
      } else {
        throw new Error(data.error || 'Failed to change tier')
      }
    } catch (error) {
      toast.error('Failed to change subscription tier')
      console.error('Error changing tier:', error)
    } finally {
      setChangingTier(false)
    }
  }

  // Filter organizations
  const filteredOrgs = organizations.filter((org) => {
    const matchesSearch =
      org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      org.slug.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesTier = filterTier === 'all' || org.subscription_tier === filterTier
    return matchesSearch && matchesTier
  })

  // Stats
  const stats = {
    total: organizations.length,
    free: organizations.filter((o) => o.subscription_tier === 'free').length,
    pro: organizations.filter((o) => o.subscription_tier === 'pro').length,
    enterprise: organizations.filter((o) => o.subscription_tier === 'enterprise').length,
    active: organizations.filter((o) => o.is_active).length,
  }

  if (loading) {
    return <SubscriptionManagerSkeleton />
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orgs</CardTitle>
            <Building2 className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Free Tier</CardTitle>
            <span className="text-xs bg-gray-100 px-2 py-1 rounded">Free</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.free}</div>
          </CardContent>
        </Card>

        <Card className="border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pro Tier</CardTitle>
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Pro</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.pro}</div>
          </CardContent>
        </Card>

        <Card className="border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Enterprise</CardTitle>
            <Crown className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.enterprise}</div>
          </CardContent>
        </Card>

        <Card className="border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>
      </div>

      {/* Razorpay Integration Notice */}
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="flex items-center gap-3 py-4">
          <CreditCard className="h-5 w-5 text-amber-600" />
          <div>
            <p className="text-sm font-medium text-amber-800">
              Payment Integration Coming Soon
            </p>
            <p className="text-xs text-amber-700">
              Razorpay integration for automated billing will be available in a future update.
              Currently, tier changes are manual credit allocations.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search organizations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-64"
            />
          </div>

          <Select value={filterTier} onValueChange={setFilterTier}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filter tier" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tiers</SelectItem>
              <SelectItem value="free">Free</SelectItem>
              <SelectItem value="pro">Pro</SelectItem>
              <SelectItem value="enterprise">Enterprise</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <RefreshIndicator
          lastRefresh={lastRefresh}
          isRefreshing={isRefreshing}
          onManualRefresh={manualRefresh}
        />
      </div>

      {/* Organizations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Organization Subscriptions</CardTitle>
          <CardDescription>
            {filteredOrgs.length} organization{filteredOrgs.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organization</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead className="text-right">Credits</TableHead>
                  <TableHead className="text-right">Members</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrgs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No organizations found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrgs.map((org) => (
                    <TableRow key={org.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{org.name}</div>
                          <div className="text-xs text-gray-500">{org.slug}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {org.type.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={SUBSCRIPTION_TIERS[org.subscription_tier].color}>
                          {SUBSCRIPTION_TIERS[org.subscription_tier].name}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {org.credits_balance.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Users className="h-3 w-3 text-gray-400" />
                          {org.member_count || 0}
                        </div>
                      </TableCell>
                      <TableCell>
                        {org.is_active ? (
                          <Badge className="bg-green-100 text-green-700">Active</Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-700">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openChangeTierDialog(org)}
                        >
                          Change Tier
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

      {/* Tier Features Reference */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(Object.entries(SUBSCRIPTION_TIERS) as [SubscriptionTier, typeof SUBSCRIPTION_TIERS[SubscriptionTier]][]).map(
          ([tier, config]) => (
            <Card key={tier} className={tier === 'enterprise' ? 'border-purple-200' : ''}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {tier === 'enterprise' && <Crown className="h-4 w-4 text-purple-500" />}
                  {config.name}
                </CardTitle>
                <CardDescription>{config.creditAllocation} credits/allocation</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {config.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )
        )}
      </div>

      {/* Change Tier Dialog */}
      <Dialog open={changeTierDialog} onOpenChange={setChangeTierDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Subscription Tier</DialogTitle>
            <DialogDescription>
              Change the subscription tier for {selectedOrg?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Current Tier</label>
              <div>
                <Badge
                  className={
                    selectedOrg ? SUBSCRIPTION_TIERS[selectedOrg.subscription_tier].color : ''
                  }
                >
                  {selectedOrg ? SUBSCRIPTION_TIERS[selectedOrg.subscription_tier].name : ''}
                </Badge>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">New Tier</label>
              <Select value={newTier} onValueChange={(v) => setNewTier(v as SubscriptionTier)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free (10 credits)</SelectItem>
                  <SelectItem value="pro">Pro (100 credits)</SelectItem>
                  <SelectItem value="enterprise">Enterprise (1000 credits)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Reason for Change</label>
              <Textarea
                placeholder="Enter reason for tier change..."
                value={changeReason}
                onChange={(e) => setChangeReason(e.target.value)}
              />
            </div>

            {newTier !== selectedOrg?.subscription_tier && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5" />
                  <div className="text-sm text-blue-700">
                    <p className="font-medium">Credit Allocation</p>
                    <p>
                      This will allocate {SUBSCRIPTION_TIERS[newTier].creditAllocation} credits to
                      the organization.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setChangeTierDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleChangeTier}
              disabled={changingTier || newTier === selectedOrg?.subscription_tier}
            >
              {changingTier ? 'Changing...' : 'Change Tier'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function SubscriptionManagerSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-20" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-12" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Notice skeleton */}
      <Skeleton className="h-16 w-full" />

      {/* Filters skeleton */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-36" />
      </div>

      {/* Table skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>

      {/* Tier cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-48 w-full" />
        ))}
      </div>
    </div>
  )
}
