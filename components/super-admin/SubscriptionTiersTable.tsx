'use client'

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
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Plus, Edit, Trash2, DollarSign, CreditCard, Users } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAutoRefresh } from '@/hooks/use-auto-refresh'
import { RefreshIndicator } from '@/components/super-admin/RefreshIndicator'

interface SubscriptionTier {
  id: string
  name: string
  display_name: string
  description: string | null
  price_monthly: number
  price_yearly: number | null
  monthly_credits: number
  rollover_allowed: boolean
  max_rollover_credits: number | null
  features: any
  is_active: boolean
  is_public: boolean
  sort_order: number
  active_subscriptions: number
  created_at: string
  updated_at: string
}

interface TierFormData {
  name: string
  display_name: string
  description: string
  price_monthly: string
  price_yearly: string
  monthly_credits: string
  rollover_allowed: boolean
  max_rollover_credits: string
  is_active: boolean
  is_public: boolean
  sort_order: string
}

export default function SubscriptionTiersTable() {
  const [tiers, setTiers] = useState<SubscriptionTier[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTier, setEditingTier] = useState<SubscriptionTier | null>(null)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState<TierFormData>({
    name: '',
    display_name: '',
    description: '',
    price_monthly: '0',
    price_yearly: '',
    monthly_credits: '0',
    rollover_allowed: false,
    max_rollover_credits: '',
    is_active: true,
    is_public: true,
    sort_order: '0',
  })

  // Auto-refresh every 60 seconds
  const { isRefreshing, lastRefresh, manualRefresh } = useAutoRefresh({
    onRefresh: fetchTiers,
    interval: 60000, // 60 seconds
  })

  useEffect(() => {
    fetchTiers()
  }, [])

  async function fetchTiers() {
    setLoading(true)
    try {
      const response = await fetch('/api/super-admin/subscriptions/tiers?includeInactive=true')
      if (!response.ok) {
        throw new Error('Failed to fetch subscription tiers')
      }

      const data = await response.json()
      setTiers(data.tiers)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to fetch tiers')
    } finally {
      setLoading(false)
    }
  }

  function openCreateDialog() {
    setEditingTier(null)
    setFormData({
      name: '',
      display_name: '',
      description: '',
      price_monthly: '0',
      price_yearly: '',
      monthly_credits: '0',
      rollover_allowed: false,
      max_rollover_credits: '',
      is_active: true,
      is_public: true,
      sort_order: '0',
    })
    setDialogOpen(true)
  }

  function openEditDialog(tier: SubscriptionTier) {
    setEditingTier(tier)
    setFormData({
      name: tier.name,
      display_name: tier.display_name,
      description: tier.description || '',
      price_monthly: tier.price_monthly.toString(),
      price_yearly: tier.price_yearly?.toString() || '',
      monthly_credits: tier.monthly_credits.toString(),
      rollover_allowed: tier.rollover_allowed,
      max_rollover_credits: tier.max_rollover_credits?.toString() || '',
      is_active: tier.is_active,
      is_public: tier.is_public,
      sort_order: tier.sort_order.toString(),
    })
    setDialogOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!formData.name || !formData.display_name || !formData.price_monthly || !formData.monthly_credits) {
      toast.error('Please fill in all required fields')
      return
    }

    setSaving(true)
    try {
      const url = editingTier
        ? `/api/super-admin/subscriptions/tiers/${editingTier.id}`
        : '/api/super-admin/subscriptions/tiers'

      const method = editingTier ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          display_name: formData.display_name,
          description: formData.description || null,
          price_monthly: parseFloat(formData.price_monthly),
          price_yearly: formData.price_yearly ? parseFloat(formData.price_yearly) : null,
          monthly_credits: parseInt(formData.monthly_credits),
          rollover_allowed: formData.rollover_allowed,
          max_rollover_credits: formData.max_rollover_credits ? parseInt(formData.max_rollover_credits) : null,
          is_active: formData.is_active,
          is_public: formData.is_public,
          sort_order: parseInt(formData.sort_order),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.details || 'Failed to save tier')
      }

      toast.success(`${formData.display_name} has been ${editingTier ? 'updated' : 'created'} successfully`)

      setDialogOpen(false)
      fetchTiers()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save tier')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(tier: SubscriptionTier) {
    if (tier.active_subscriptions > 0) {
      toast.error(`Cannot delete: This tier has ${tier.active_subscriptions} active subscription(s)`)
      return
    }

    if (!confirm(`Are you sure you want to delete "${tier.display_name}"? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/super-admin/subscriptions/tiers/${tier.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.details || 'Failed to delete tier')
      }

      toast.success(`${tier.display_name} has been deleted`)

      fetchTiers()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete tier')
    }
  }

  return (
    <div className="space-y-4">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {tiers.length} subscription tier{tiers.length !== 1 ? 's' : ''}
        </div>
        <div className="flex items-center gap-4">
          <RefreshIndicator
            lastRefresh={lastRefresh}
            isRefreshing={isRefreshing}
            onManualRefresh={manualRefresh}
          />
          <Button onClick={openCreateDialog} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Create Tier
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead>Tier</TableHead>
              <TableHead>Pricing</TableHead>
              <TableHead>Credits</TableHead>
              <TableHead>Active Subscriptions</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  Loading tiers...
                </TableCell>
              </TableRow>
            ) : tiers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  No subscription tiers found. Create one to get started.
                </TableCell>
              </TableRow>
            ) : (
              tiers.map((tier) => (
                <TableRow key={tier.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">{tier.display_name}</div>
                      <div className="text-xs text-gray-500">ID: {tier.name}</div>
                      {tier.description && (
                        <div className="text-xs text-gray-600 mt-1">{tier.description}</div>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3 text-gray-400" />
                        <span className="font-medium">${tier.price_monthly}</span>
                        <span className="text-xs text-gray-500">/month</span>
                      </div>
                      {tier.price_yearly && (
                        <div className="text-xs text-gray-600">
                          ${tier.price_yearly}/year
                        </div>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <CreditCard className="w-3 h-3 text-gray-400" />
                        <span className="font-medium">{tier.monthly_credits.toLocaleString()}</span>
                        <span className="text-xs text-gray-500">credits/month</span>
                      </div>
                      {tier.rollover_allowed && (
                        <Badge className="bg-blue-100 text-blue-800 text-xs">
                          Rollover Enabled
                        </Badge>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">{tier.active_subscriptions}</span>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="space-y-1">
                      {tier.is_active ? (
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                      ) : (
                        <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>
                      )}
                      {tier.is_public && (
                        <Badge className="bg-blue-100 text-blue-800">Public</Badge>
                      )}
                    </div>
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(tier)}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(tier)}
                        disabled={tier.active_subscriptions > 0}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTier ? 'Edit Subscription Tier' : 'Create Subscription Tier'}</DialogTitle>
            <DialogDescription>
              {editingTier ? 'Update the subscription tier details' : 'Create a new subscription tier for organizations'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Tier ID *</Label>
                <Input
                  id="name"
                  placeholder="e.g., pro, enterprise"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={!!editingTier}
                  required
                />
                <p className="text-xs text-gray-500">Lowercase, no spaces. Cannot be changed later.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="display_name">Display Name *</Label>
                <Input
                  id="display_name"
                  placeholder="e.g., Professional, Enterprise"
                  value={formData.display_name}
                  onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of this tier"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price_monthly">Monthly Price ($) *</Label>
                <Input
                  id="price_monthly"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="49.00"
                  value={formData.price_monthly}
                  onChange={(e) => setFormData({ ...formData, price_monthly: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price_yearly">Yearly Price ($)</Label>
                <Input
                  id="price_yearly"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="490.00"
                  value={formData.price_yearly}
                  onChange={(e) => setFormData({ ...formData, price_yearly: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="monthly_credits">Monthly Credits *</Label>
                <Input
                  id="monthly_credits"
                  type="number"
                  min="0"
                  placeholder="1000"
                  value={formData.monthly_credits}
                  onChange={(e) => setFormData({ ...formData, monthly_credits: e.target.value })}
                  required
                />
                <p className="text-xs text-gray-500">Credits allocated each billing period</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_rollover_credits">Max Rollover Credits</Label>
                <Input
                  id="max_rollover_credits"
                  type="number"
                  min="0"
                  placeholder="2000"
                  value={formData.max_rollover_credits}
                  onChange={(e) => setFormData({ ...formData, max_rollover_credits: e.target.value })}
                  disabled={!formData.rollover_allowed}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sort_order">Sort Order</Label>
              <Input
                id="sort_order"
                type="number"
                min="0"
                placeholder="0"
                value={formData.sort_order}
                onChange={(e) => setFormData({ ...formData, sort_order: e.target.value })}
              />
              <p className="text-xs text-gray-500">Lower numbers appear first</p>
            </div>

            <div className="space-y-3 pt-2 border-t">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="rollover_allowed">Allow Credit Rollover</Label>
                  <p className="text-xs text-gray-500">Unused credits carry to next period</p>
                </div>
                <Switch
                  id="rollover_allowed"
                  checked={formData.rollover_allowed}
                  onCheckedChange={(checked) => setFormData({ ...formData, rollover_allowed: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="is_active">Active</Label>
                  <p className="text-xs text-gray-500">Can be assigned to organizations</p>
                </div>
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="is_public">Public</Label>
                  <p className="text-xs text-gray-500">Visible on pricing page</p>
                </div>
                <Switch
                  id="is_public"
                  checked={formData.is_public}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_public: checked })}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700">
                {saving ? 'Saving...' : editingTier ? 'Update Tier' : 'Create Tier'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
