'use client'

/**
 * Organization Detail Component
 * Shows organization stats, members, transactions, and management actions
 */

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Building2,
  Users,
  CreditCard,
  ImageIcon,
  Calendar,
  Edit2,
  Trash2,
  Plus,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  Mail,
  Shield,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import toast from 'react-hot-toast'

interface Member {
  id: string
  user_id: string
  role: string
  created_at: string
  email: string
  full_name: string
}

interface Transaction {
  id: string
  type: string
  amount: number
  description: string
  created_at: string
  created_by: string
}

interface OrganizationStats {
  member_count: number
  creative_count: number
  total_credit_consumed: number
  current_balance: number
  last_activity: string
}

interface Organization {
  id: string
  name: string
  slug: string
  type: string
  is_active: boolean
  credits_balance: number
  subscription_tier: string
  subscription_status: string
  created_at: string
  updated_at: string
  stats: OrganizationStats
  members: Member[]
  recent_transactions: Transaction[]
}

interface OrganizationDetailProps {
  organizationId: string
}

export default function OrganizationDetail({ organizationId }: OrganizationDetailProps) {
  const router = useRouter()
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editName, setEditName] = useState('')
  const [editType, setEditType] = useState('')
  const [saving, setSaving] = useState(false)

  // Delete dialog state (soft delete / deactivate)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Hard delete dialog state
  const [hardDeleteDialogOpen, setHardDeleteDialogOpen] = useState(false)
  const [hardDeleting, setHardDeleting] = useState(false)
  const [confirmOrgName, setConfirmOrgName] = useState('')

  // Add credits dialog state
  const [creditsDialogOpen, setCreditsDialogOpen] = useState(false)
  const [creditAmount, setCreditAmount] = useState('')
  const [creditDescription, setCreditDescription] = useState('')
  const [addingCredits, setAddingCredits] = useState(false)

  const fetchOrganization = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/super-admin/organizations/${organizationId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch organization')
      }

      setOrganization(data.organization)
      setEditName(data.organization.name)
      setEditType(data.organization.type || 'chapter')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch organization')
      toast.error(err instanceof Error ? err.message : 'Failed to fetch organization')
    } finally {
      setLoading(false)
    }
  }, [organizationId])

  useEffect(() => {
    fetchOrganization()
  }, [fetchOrganization])

  async function handleSave() {
    if (!editName.trim()) {
      toast.error('Organization name is required')
      return
    }

    setSaving(true)
    try {
      const response = await fetch(`/api/super-admin/organizations/${organizationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          type: editType,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update organization')
      }

      toast.success('Organization updated successfully')
      setEditDialogOpen(false)
      fetchOrganization()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update organization')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      const response = await fetch(`/api/super-admin/organizations/${organizationId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to deactivate organization')
      }

      toast.success('Organization deactivated successfully')
      setDeleteDialogOpen(false)
      router.push('/super-admin/organizations')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to deactivate organization')
    } finally {
      setDeleting(false)
    }
  }

  async function handleHardDelete() {
    if (!organization || confirmOrgName !== organization.name) {
      toast.error('Organization name does not match')
      return
    }

    setHardDeleting(true)
    try {
      const response = await fetch(
        `/api/super-admin/organizations/${organizationId}?permanent=true`,
        { method: 'DELETE' }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to permanently delete organization')
      }

      toast.success('Organization permanently deleted')
      setHardDeleteDialogOpen(false)
      router.push('/super-admin/organizations')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to permanently delete organization')
    } finally {
      setHardDeleting(false)
    }
  }

  async function handleAddCredits() {
    const amount = parseInt(creditAmount, 10)
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid credit amount')
      return
    }

    if (!creditDescription.trim()) {
      toast.error('Please provide a description for the credit allocation')
      return
    }

    setAddingCredits(true)
    try {
      const response = await fetch('/api/super-admin/credits/allocate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_id: organizationId,
          amount,
          reason: creditDescription,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add credits')
      }

      toast.success(`Added ${amount} credits to ${organization?.name}`)
      setCreditsDialogOpen(false)
      setCreditAmount('')
      setCreditDescription('')
      fetchOrganization()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add credits')
    } finally {
      setAddingCredits(false)
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  function formatDateTime(dateString: string) {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  function getHealthScore(): 'healthy' | 'warning' | 'critical' {
    if (!organization) return 'warning'
    if (!organization.is_active || organization.stats.current_balance === 0) return 'critical'
    if (organization.stats.member_count === 0 || organization.stats.current_balance < 100) return 'warning'
    return 'healthy'
  }

  function getHealthBadge(score: string) {
    const colors = {
      healthy: 'bg-green-100 text-green-800',
      warning: 'bg-yellow-100 text-yellow-800',
      critical: 'bg-red-100 text-red-800',
    }
    return (
      <Badge className={colors[score as keyof typeof colors]}>
        {score === 'healthy' && <CheckCircle className="w-3 h-3 mr-1" />}
        {score === 'warning' && <AlertTriangle className="w-3 h-3 mr-1" />}
        {score === 'critical' && <AlertTriangle className="w-3 h-3 mr-1" />}
        {score.charAt(0).toUpperCase() + score.slice(1)}
      </Badge>
    )
  }

  function getRoleBadge(role: string) {
    const colors = {
      admin: 'bg-purple-100 text-purple-800',
      editor: 'bg-blue-100 text-blue-800',
      viewer: 'bg-gray-100 text-gray-800',
    }
    return (
      <Badge className={colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {role === 'admin' && <Shield className="w-3 h-3 mr-1" />}
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </Badge>
    )
  }

  function getTransactionBadge(type: string, amount: number) {
    if (type === 'usage' || type === 'consumption' || amount < 0) {
      return <Badge className="bg-red-100 text-red-800">-{Math.abs(amount)}</Badge>
    }
    return <Badge className="bg-green-100 text-green-800">+{amount}</Badge>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (error || !organization) {
    return (
      <div className="space-y-4">
        <Link href="/super-admin/organizations">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Organizations
          </Button>
        </Link>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="w-5 h-5" />
              <span>{error || 'Organization not found'}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/super-admin/organizations">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900">{organization.name}</h1>
              {getHealthBadge(getHealthScore())}
              {!organization.is_active && (
                <Badge className="bg-red-100 text-red-800">Inactive</Badge>
              )}
            </div>
            <p className="text-gray-600 mt-1">
              {organization.slug} · {organization.type || 'Chapter'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchOrganization}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={() => setEditDialogOpen(true)}>
            <Edit2 className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={() => setDeleteDialogOpen(true)}
            disabled={!organization.is_active}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Deactivate
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setHardDeleteDialogOpen(true)}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Permanently
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Credit Balance</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{organization.stats.current_balance.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {organization.stats.total_credit_consumed.toLocaleString()} consumed total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{organization.stats.member_count}</div>
            <p className="text-xs text-muted-foreground">Active members</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Creatives</CardTitle>
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{organization.stats.creative_count}</div>
            <p className="text-xs text-muted-foreground">Total generated</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Activity</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDate(organization.stats.last_activity)}</div>
            <p className="text-xs text-muted-foreground">
              Created {formatDate(organization.created_at)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Members and Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Members List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Members
                </CardTitle>
                <CardDescription>Organization members and their roles</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {organization.members.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No members yet</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {organization.members.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{member.full_name}</div>
                          <div className="text-xs text-gray-500 flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {member.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getRoleBadge(member.role)}</TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {formatDate(member.created_at)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Recent Transactions
                </CardTitle>
                <CardDescription>Credit allocation and usage history</CardDescription>
              </div>
              <Button size="sm" onClick={() => setCreditsDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Credits
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {organization.recent_transactions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No transactions yet</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {organization.recent_transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <div className="max-w-[200px] truncate" title={transaction.description}>
                          {transaction.description || transaction.type}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getTransactionBadge(transaction.type, transaction.amount)}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {formatDateTime(transaction.created_at)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Organization Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Organization Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <div className="text-sm font-medium text-gray-500">Organization ID</div>
              <div className="font-mono text-sm">{organization.id}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">Slug</div>
              <div>{organization.slug}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">Type</div>
              <div className="capitalize">{organization.type || 'Chapter'}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">Status</div>
              <Badge className={organization.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                {organization.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">Subscription Tier</div>
              <div className="capitalize">{organization.subscription_tier || 'Free'}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">Subscription Status</div>
              <div className="capitalize">{organization.subscription_status || 'N/A'}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">Created</div>
              <div>{formatDateTime(organization.created_at)}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">Last Updated</div>
              <div>{formatDateTime(organization.updated_at)}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Organization</DialogTitle>
            <DialogDescription>
              Update the organization name and type
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Organization Name</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Enter organization name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-type">Organization Type</Label>
              <Select value={editType} onValueChange={setEditType}>
                <SelectTrigger id="edit-type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="chapter">Chapter</SelectItem>
                  <SelectItem value="institution">Institution</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || !editName.trim()}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Organization</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to deactivate <strong>{organization.name}</strong>?
              This will prevent all members from accessing the platform. This action can be reversed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? 'Deactivating...' : 'Deactivate'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Credits Dialog */}
      <Dialog open={creditsDialogOpen} onOpenChange={setCreditsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Credits</DialogTitle>
            <DialogDescription>
              Allocate credits to {organization.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="credit-amount">Credit Amount</Label>
              <Input
                id="credit-amount"
                type="number"
                min="1"
                value={creditAmount}
                onChange={(e) => setCreditAmount(e.target.value)}
                placeholder="Enter amount"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="credit-description">Description</Label>
              <Input
                id="credit-description"
                value={creditDescription}
                onChange={(e) => setCreditDescription(e.target.value)}
                placeholder="e.g., Monthly allocation, Promotional bonus"
              />
            </div>

            <div className="bg-gray-50 rounded-lg p-3 text-sm">
              <div className="flex justify-between">
                <span>Current Balance:</span>
                <span className="font-medium">{organization.stats.current_balance.toLocaleString()}</span>
              </div>
              {creditAmount && parseInt(creditAmount) > 0 && (
                <div className="flex justify-between mt-1 text-green-600">
                  <span>New Balance:</span>
                  <span className="font-medium">
                    {(organization.stats.current_balance + parseInt(creditAmount)).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCreditsDialogOpen(false)
                setCreditAmount('')
                setCreditDescription('')
              }}
              disabled={addingCredits}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddCredits}
              disabled={addingCredits || !creditAmount || !creditDescription.trim()}
              className="bg-green-600 hover:bg-green-700"
            >
              {addingCredits ? 'Adding...' : 'Add Credits'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hard Delete Confirmation Dialog */}
      <AlertDialog open={hardDeleteDialogOpen} onOpenChange={(open) => {
        setHardDeleteDialogOpen(open)
        if (!open) setConfirmOrgName('')
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Permanently Delete Organization
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p>
                  This will <strong>PERMANENTLY</strong> delete <strong>{organization.name}</strong> and ALL related data:
                </p>
                <ul className="list-disc ml-6 space-y-1 text-sm">
                  <li>All members will be removed</li>
                  <li>All creatives will be deleted</li>
                  <li>All credit transactions will be lost</li>
                  <li>All logos and brand assets will be removed</li>
                  <li>All templates and presets will be deleted</li>
                </ul>
                <p className="font-semibold text-red-600">
                  This action CANNOT be undone!
                </p>
                <div className="pt-2">
                  <Label htmlFor="confirm-org-name" className="text-sm font-medium">
                    Type <span className="font-bold">{organization.name}</span> to confirm:
                  </Label>
                  <Input
                    id="confirm-org-name"
                    value={confirmOrgName}
                    onChange={(e) => setConfirmOrgName(e.target.value)}
                    placeholder="Type organization name"
                    className="mt-2"
                    autoComplete="off"
                  />
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={hardDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleHardDelete}
              disabled={confirmOrgName !== organization.name || hardDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {hardDeleting ? 'Deleting...' : 'Delete Permanently'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
