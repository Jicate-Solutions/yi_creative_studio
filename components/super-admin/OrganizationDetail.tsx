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
  BarChart3,
  StickyNote,
  ChevronDown,
  ChevronRight,
  Save,
} from 'lucide-react'
import OrganizationAnalytics from './OrganizationAnalytics'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
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

  // Reactivation state
  const [reactivating, setReactivating] = useState(false)

  // Admin notes state
  const [notesExpanded, setNotesExpanded] = useState(false)
  const [adminNotes, setAdminNotes] = useState('')
  const [notesLastUpdated, setNotesLastUpdated] = useState<string | null>(null)
  const [notesUpdatedBy, setNotesUpdatedBy] = useState<string | null>(null)
  const [savingNotes, setSavingNotes] = useState(false)
  const [notesLoading, setNotesLoading] = useState(false)

  // Bulk member operations state
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [bulkRoleDialogOpen, setBulkRoleDialogOpen] = useState(false)
  const [bulkRemoveDialogOpen, setBulkRemoveDialogOpen] = useState(false)
  const [bulkNewRole, setBulkNewRole] = useState('viewer')
  const [bulkOperating, setBulkOperating] = useState(false)

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

  async function handleReactivate() {
    setReactivating(true)
    try {
      const response = await fetch(`/api/super-admin/organizations/${organizationId}/reactivate`, {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reactivate organization')
      }

      toast.success(data.message || 'Organization reactivated successfully')
      fetchOrganization()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to reactivate organization')
    } finally {
      setReactivating(false)
    }
  }

  async function fetchAdminNotes() {
    setNotesLoading(true)
    try {
      const response = await fetch(`/api/super-admin/organizations/${organizationId}/notes`)
      const data = await response.json()

      if (response.ok && data.success) {
        setAdminNotes(data.notes || '')
        setNotesLastUpdated(data.updated_at)
        setNotesUpdatedBy(data.updated_by)
      }
    } catch (err) {
      console.error('Failed to fetch admin notes:', err)
    } finally {
      setNotesLoading(false)
    }
  }

  async function handleSaveNotes() {
    setSavingNotes(true)
    try {
      const response = await fetch(`/api/super-admin/organizations/${organizationId}/notes`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: adminNotes }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save notes')
      }

      toast.success('Notes saved successfully')
      setNotesLastUpdated(new Date().toISOString())
      setNotesUpdatedBy('You')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save notes')
    } finally {
      setSavingNotes(false)
    }
  }

  // Fetch admin notes when expanded for the first time
  useEffect(() => {
    if (notesExpanded && adminNotes === '' && !notesLoading) {
      fetchAdminNotes()
    }
  }, [notesExpanded])

  // Bulk member operations
  function toggleMemberSelection(memberId: string) {
    setSelectedMembers((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    )
  }

  function toggleAllMembers() {
    if (!organization) return
    if (selectedMembers.length === organization.members.length) {
      setSelectedMembers([])
    } else {
      setSelectedMembers(organization.members.map((m) => m.id))
    }
  }

  async function handleBulkRoleChange() {
    if (selectedMembers.length === 0) {
      toast.error('No members selected')
      return
    }

    setBulkOperating(true)
    try {
      const response = await fetch(
        `/api/super-admin/organizations/${organizationId}/members/bulk`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'change_role',
            member_ids: selectedMembers,
            new_role: bulkNewRole,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update roles')
      }

      toast.success(data.message || 'Roles updated successfully')
      setBulkRoleDialogOpen(false)
      setSelectedMembers([])
      fetchOrganization()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update roles')
    } finally {
      setBulkOperating(false)
    }
  }

  async function handleBulkRemove() {
    if (selectedMembers.length === 0) {
      toast.error('No members selected')
      return
    }

    setBulkOperating(true)
    try {
      const response = await fetch(
        `/api/super-admin/organizations/${organizationId}/members/bulk`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'remove',
            member_ids: selectedMembers,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to remove members')
      }

      toast.success(data.message || 'Members removed successfully')
      setBulkRemoveDialogOpen(false)
      setSelectedMembers([])
      fetchOrganization()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to remove members')
    } finally {
      setBulkOperating(false)
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

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchOrganization}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={() => setEditDialogOpen(true)}>
            <Edit2 className="w-4 h-4 mr-2" />
            Edit
          </Button>
          {!organization.is_active ? (
            <Button
              variant="outline"
              size="sm"
              className="text-green-600 hover:text-green-700 hover:bg-green-50"
              onClick={handleReactivate}
              disabled={reactivating}
            >
              {reactivating ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4 mr-2" />
              )}
              Reactivate
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Deactivate
            </Button>
          )}
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

      {/* Organization Analytics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Usage Analytics
          </CardTitle>
          <CardDescription>
            Detailed credit usage and generation statistics for this organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OrganizationAnalytics organizationId={organizationId} showTable={false} />
        </CardContent>
      </Card>

      {/* Members and Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Members List */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Members
                </CardTitle>
                <CardDescription>Organization members and their roles</CardDescription>
              </div>
              {selectedMembers.length > 0 && (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{selectedMembers.length} selected</Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setBulkRoleDialogOpen(true)}
                  >
                    Change Role
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => setBulkRemoveDialogOpen(true)}
                  >
                    Remove
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {organization.members.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No members yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table className="min-w-[400px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">
                        <Checkbox
                          checked={selectedMembers.length === organization.members.length}
                          onCheckedChange={toggleAllMembers}
                          aria-label="Select all members"
                        />
                      </TableHead>
                      <TableHead>Member</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Joined</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {organization.members.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedMembers.includes(member.id)}
                            onCheckedChange={() => toggleMemberSelection(member.id)}
                            aria-label={`Select ${member.full_name}`}
                          />
                        </TableCell>
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
              </div>
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

      {/* Admin Notes (Collapsible) */}
      <Card>
        <Collapsible open={notesExpanded} onOpenChange={setNotesExpanded}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <StickyNote className="w-5 h-5" />
                  Admin Notes
                  {notesExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </CardTitle>
                {notesLastUpdated && (
                  <span className="text-xs text-gray-500 font-normal">
                    Last updated {formatDateTime(notesLastUpdated)}
                    {notesUpdatedBy && ` by ${notesUpdatedBy}`}
                  </span>
                )}
              </div>
              <CardDescription>
                Internal notes visible only to super admins
              </CardDescription>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0">
              {notesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-5 h-5 animate-spin text-gray-400" />
                </div>
              ) : (
                <div className="space-y-4">
                  <Textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Add internal notes about this organization..."
                    rows={6}
                    className="resize-y"
                  />
                  <div className="flex justify-end">
                    <Button
                      onClick={handleSaveNotes}
                      disabled={savingNotes}
                      size="sm"
                    >
                      {savingNotes ? (
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      {savingNotes ? 'Saving...' : 'Save Notes'}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
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

      {/* Bulk Role Change Dialog */}
      <Dialog open={bulkRoleDialogOpen} onOpenChange={setBulkRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Role for Selected Members</DialogTitle>
            <DialogDescription>
              Update the role for {selectedMembers.length} selected member(s)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bulk-new-role">New Role</Label>
              <Select value={bulkNewRole} onValueChange={setBulkNewRole}>
                <SelectTrigger id="bulk-new-role">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBulkRoleDialogOpen(false)}
              disabled={bulkOperating}
            >
              Cancel
            </Button>
            <Button onClick={handleBulkRoleChange} disabled={bulkOperating}>
              {bulkOperating ? 'Updating...' : 'Update Roles'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Remove Confirmation Dialog */}
      <AlertDialog open={bulkRemoveDialogOpen} onOpenChange={setBulkRemoveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Members from Organization</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {selectedMembers.length} member(s) from{' '}
              <strong>{organization.name}</strong>? They will lose access to the organization
              but their user accounts will remain active.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkOperating}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkRemove}
              disabled={bulkOperating}
              className="bg-red-600 hover:bg-red-700"
            >
              {bulkOperating ? 'Removing...' : 'Remove Members'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
