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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Search, UserX, UserCheck, UserCog, Shield, Mail, Building, Send, Copy, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAutoRefresh } from '@/hooks/use-auto-refresh'
import { RefreshIndicator } from '@/components/super-admin/RefreshIndicator'
import { ExportButton, type ExportColumn } from '@/components/super-admin/ExportButton'
import UserDetailPanel from '@/components/super-admin/UserDetailPanel'
import { startImpersonationSession } from '@/components/super-admin/ImpersonationBanner'

// Export columns definition (matches API available columns)
const USER_EXPORT_COLUMNS: ExportColumn[] = [
  { key: 'id', label: 'User ID' },
  { key: 'email', label: 'Email', selected: true },
  { key: 'full_name', label: 'Full Name', selected: true },
  { key: 'phone', label: 'Phone' },
  { key: 'is_active', label: 'Active Status', selected: true },
  { key: 'organization_name', label: 'Organization', selected: true },
  { key: 'created_at', label: 'Created At', selected: true },
  { key: 'last_sign_in_at', label: 'Last Sign In', selected: true },
]

interface Organization {
  organization_id: string
  organization_name: string
  role: string
}

interface User {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  phone: string | null
  created_at: string
  last_sign_in_at: string | null
  status: 'active' | 'suspended' | 'pending' | 'deleted'
  is_super_admin: boolean
  suspended_at?: string | null
  suspension_reason?: string | null
  organizations: Organization[]
  organization_count: number
}

// Helper to get initials from name or email
function getInitials(name: string | null, email: string): string {
  if (name) {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }
  return email.charAt(0).toUpperCase()
}

interface Pagination {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

interface OrgOption {
  id: string
  name: string
  slug: string
}

export default function UserSearchTable() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [superAdminFilter, setSuperAdminFilter] = useState<string>('all')
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    pageSize: 25,
    total: 0,
    totalPages: 0,
  })

  // Suspension dialog
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [suspensionReason, setSuspensionReason] = useState('')
  const [suspending, setSuspending] = useState(false)

  // Impersonation dialog
  const [impersonateDialogOpen, setImpersonateDialogOpen] = useState(false)
  const [impersonationReason, setImpersonationReason] = useState('')
  const [impersonating, setImpersonating] = useState(false)

  // Assign to org dialog
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [selectedOrgId, setSelectedOrgId] = useState('')
  const [selectedRole, setSelectedRole] = useState<'viewer' | 'editor' | 'admin'>('viewer')
  const [assigning, setAssigning] = useState(false)

  // Invite to org dialog
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [inviting, setInviting] = useState(false)
  const [inviteResult, setInviteResult] = useState<{ code: string; url: string } | null>(null)

  // Organizations list for dropdowns
  const [organizations, setOrganizations] = useState<OrgOption[]>([])
  const [loadingOrgs, setLoadingOrgs] = useState(false)

  // User detail panel
  const [detailPanelOpen, setDetailPanelOpen] = useState(false)
  const [detailUser, setDetailUser] = useState<User | null>(null)

  // Auto-refresh every 45 seconds
  const { isRefreshing, lastRefresh, manualRefresh } = useAutoRefresh({
    onRefresh: fetchUsers,
    interval: 45000, // 45 seconds
  })

  useEffect(() => {
    fetchUsers()
  }, [search, statusFilter, superAdminFilter, pagination.page])

  async function fetchUsers() {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        pageSize: pagination.pageSize.toString(),
        search,
      })

      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }

      if (superAdminFilter !== 'all') {
        params.append('isSuperAdmin', superAdminFilter)
      }

      const response = await fetch(`/api/super-admin/users/list?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch users')
      }

      const data = await response.json()
      setUsers(data.users)
      setPagination(data.pagination)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }

  async function fetchOrganizations() {
    if (organizations.length > 0) return // Already loaded
    setLoadingOrgs(true)
    try {
      const response = await fetch('/api/super-admin/organizations/list?pageSize=100')
      if (!response.ok) {
        throw new Error('Failed to fetch organizations')
      }
      const data = await response.json()
      setOrganizations(data.organizations.map((org: any) => ({
        id: org.id,
        name: org.name,
        slug: org.slug,
      })))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to fetch organizations')
    } finally {
      setLoadingOrgs(false)
    }
  }

  function getStatusBadge(status: string) {
    const variants = {
      active: { color: 'bg-green-100 text-green-800', label: 'Active' },
      suspended: { color: 'bg-red-100 text-red-800', label: 'Suspended' },
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      deleted: { color: 'bg-gray-100 text-gray-800', label: 'Deleted' },
    }
    const variant = variants[status as keyof typeof variants] || variants.active
    return (
      <Badge className={variant.color}>
        {variant.label}
      </Badge>
    )
  }

  function formatDate(dateString: string | null) {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  async function handleSuspend() {
    if (!selectedUser || !suspensionReason.trim()) {
      toast.error('Please provide a suspension reason')
      return
    }

    setSuspending(true)
    try {
      const response = await fetch(`/api/super-admin/users/${selectedUser.id}/suspend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: suspensionReason }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.details || 'Failed to suspend user')
      }

      toast.success(`${selectedUser.email} has been suspended`)

      setSuspendDialogOpen(false)
      setSuspensionReason('')
      setSelectedUser(null)
      fetchUsers() // Refresh list
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to suspend user')
    } finally {
      setSuspending(false)
    }
  }

  async function handleReactivate(user: User) {
    if (!confirm(`Are you sure you want to reactivate ${user.email}?`)) {
      return
    }

    try {
      const response = await fetch(`/api/super-admin/users/${user.id}/suspend`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.details || 'Failed to reactivate user')
      }

      toast.success(`${user.email} has been reactivated`)

      fetchUsers() // Refresh list
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to reactivate user')
    }
  }

  async function handleImpersonate() {
    if (!selectedUser || !impersonationReason.trim() || impersonationReason.length < 10) {
      toast.error('Please provide a detailed reason (minimum 10 characters)')
      return
    }

    setImpersonating(true)
    try {
      const response = await fetch(`/api/super-admin/users/${selectedUser.id}/impersonate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: impersonationReason }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.details || 'Failed to start impersonation')
      }

      const data = await response.json()

      toast.success(`Impersonation started - Session expires in ${data.session.duration_minutes} minutes`)

      // Store impersonation session for the banner
      startImpersonationSession({
        userId: selectedUser.id,
        userName: selectedUser.full_name || '',
        userEmail: selectedUser.email,
        durationMinutes: data.session.duration_minutes,
        restrictions: data.session.restrictions || [],
      })

      setImpersonateDialogOpen(false)
      setImpersonationReason('')
      setSelectedUser(null)

      // Navigate to dashboard as the impersonated user
      window.location.href = '/dashboard'
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to start impersonation')
    } finally {
      setImpersonating(false)
    }
  }

  async function handleAssignToOrg() {
    if (!selectedUser || !selectedOrgId) {
      toast.error('Please select an organization')
      return
    }

    setAssigning(true)
    try {
      const response = await fetch(`/api/super-admin/users/${selectedUser.id}/assign-org`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_id: selectedOrgId,
          role: selectedRole,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.details || 'Failed to assign user to organization')
      }

      const data = await response.json()
      toast.success(data.message)

      setAssignDialogOpen(false)
      setSelectedOrgId('')
      setSelectedRole('viewer')
      setSelectedUser(null)
      fetchUsers() // Refresh list
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to assign user')
    } finally {
      setAssigning(false)
    }
  }

  async function handleInviteToOrg() {
    if (!selectedUser || !selectedOrgId) {
      toast.error('Please select an organization')
      return
    }

    setInviting(true)
    try {
      const response = await fetch(`/api/super-admin/users/${selectedUser.id}/invite-org`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_id: selectedOrgId,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.details || 'Failed to generate invite')
      }

      const data = await response.json()
      setInviteResult({
        code: data.invite.invite_code,
        url: data.invite.invite_url,
      })
      toast.success('Invite generated successfully')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to generate invite')
    } finally {
      setInviting(false)
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  }

  function openAssignDialog(user: User) {
    setSelectedUser(user)
    setSelectedOrgId('')
    setSelectedRole('viewer')
    setAssignDialogOpen(true)
    fetchOrganizations()
  }

  function openInviteDialog(user: User) {
    setSelectedUser(user)
    setSelectedOrgId('')
    setInviteResult(null)
    setInviteDialogOpen(true)
    fetchOrganizations()
  }

  return (
    <div className="space-y-4">
      {/* Search & Filters - Responsive */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 flex-1">
          <div className="relative flex-1 min-w-0 sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPagination({ ...pagination, page: 1 }) // Reset to page 1 on search
              }}
              className="pl-10"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
              <SelectItem value="deleted">Deleted</SelectItem>
            </SelectContent>
          </Select>

          <Select value={superAdminFilter} onValueChange={setSuperAdminFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="All Users" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              <SelectItem value="true">Super Admins</SelectItem>
              <SelectItem value="false">Regular Users</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Export & Auto-refresh */}
        <div className="flex items-center gap-2">
          <ExportButton
            endpoint="/api/super-admin/users/export"
            filename="users_export"
            columns={USER_EXPORT_COLUMNS}
            queryParams={{
              search,
              status: statusFilter !== 'all' ? statusFilter : '',
            }}
          />
          <RefreshIndicator
            lastRefresh={lastRefresh}
            isRefreshing={isRefreshing}
            onManualRefresh={manualRefresh}
          />
        </div>
      </div>

      {/* Results Summary */}
      <div className="text-sm text-gray-600">
        Showing {users.length} of {pagination.total} users
      </div>

      {/* Table - Horizontal scroll on mobile */}
      <div className="border rounded-lg overflow-x-auto">
        <Table className="min-w-[800px]">
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead>User</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Organizations</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Last Sign In</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  Loading users...
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow
                  key={user.id}
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => {
                    setDetailUser(user)
                    setDetailPanelOpen(true)
                  }}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={user.avatar_url || undefined} />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-sm">
                          {getInitials(user.full_name, user.email)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="space-y-0.5">
                        <div className="font-medium">
                          {user.full_name || 'No name'}
                        </div>
                        <div className="flex items-center gap-1.5 text-sm text-gray-500">
                          <Mail className="w-3.5 h-3.5" />
                          {user.email}
                        </div>
                        {user.is_super_admin && (
                          <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs">
                            <Shield className="w-3 h-3 mr-1" />
                            Super Admin
                          </Badge>
                        )}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="space-y-1">
                      {getStatusBadge(user.status)}
                      {user.status === 'suspended' && user.suspension_reason && (
                        <div className="text-xs text-gray-500 mt-1">
                          Reason: {user.suspension_reason}
                        </div>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    {user.organization_count > 0 ? (
                      <div className="space-y-1">
                        <div className="font-medium">{user.organization_count} org{user.organization_count !== 1 ? 's' : ''}</div>
                        <div className="text-xs text-gray-500">
                          {user.organizations.slice(0, 2).map((org) => org.organization_name).join(', ')}
                          {user.organization_count > 2 && ` +${user.organization_count - 2} more`}
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-400">No organizations</span>
                    )}
                  </TableCell>

                  <TableCell className="text-sm text-gray-600">
                    {formatDate(user.created_at)}
                  </TableCell>

                  <TableCell className="text-sm text-gray-600">
                    {formatDate(user.last_sign_in_at)}
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
                      {/* Assign/Invite buttons for users without organizations */}
                      {user.organization_count === 0 && !user.is_super_admin && user.status === 'active' && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openAssignDialog(user)}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Building className="w-4 h-4 mr-1" />
                            Assign
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openInviteDialog(user)}
                            className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                          >
                            <Send className="w-4 h-4 mr-1" />
                            Invite
                          </Button>
                        </>
                      )}

                      {user.status === 'active' && !user.is_super_admin && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedUser(user)
                              setSuspendDialogOpen(true)
                            }}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <UserX className="w-4 h-4 mr-1" />
                            Suspend
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedUser(user)
                              setImpersonateDialogOpen(true)
                            }}
                            className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                          >
                            <UserCog className="w-4 h-4 mr-1" />
                            Impersonate
                          </Button>
                        </>
                      )}

                      {user.status === 'suspended' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleReactivate(user)}
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        >
                          <UserCheck className="w-4 h-4 mr-1" />
                          Reactivate
                        </Button>
                      )}

                      {user.is_super_admin && (
                        <span className="text-xs text-gray-400 italic">Protected</span>
                      )}

                      {/* Row click indicator */}
                      <ChevronRight className="w-4 h-4 text-gray-300 ml-2" />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Page {pagination.page} of {pagination.totalPages}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
              disabled={pagination.page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
              disabled={pagination.page === pagination.totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Suspend User Dialog */}
      <Dialog open={suspendDialogOpen} onOpenChange={setSuspendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend User</DialogTitle>
            <DialogDescription>
              You are about to suspend <strong>{selectedUser?.email}</strong>. This will immediately revoke their access to the platform.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="suspension-reason">Reason for Suspension *</Label>
              <Textarea
                id="suspension-reason"
                placeholder="Enter the reason for suspending this user..."
                value={suspensionReason}
                onChange={(e) => setSuspensionReason(e.target.value)}
                rows={4}
              />
              <p className="text-xs text-gray-500">This reason will be recorded in the audit log.</p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSuspendDialogOpen(false)
                setSuspensionReason('')
                setSelectedUser(null)
              }}
              disabled={suspending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleSuspend}
              disabled={suspending || !suspensionReason.trim()}
            >
              {suspending ? 'Suspending...' : 'Suspend User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Impersonate User Dialog */}
      <Dialog open={impersonateDialogOpen} onOpenChange={setImpersonateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Impersonate User</DialogTitle>
            <DialogDescription>
              You are about to access <strong>{selectedUser?.email}</strong>'s account. This session will last 30 minutes and certain actions will be restricted.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
              <strong>Security Notice:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>The user will be notified of this session</li>
                <li>Session expires in 30 minutes</li>
                <li>Destructive actions are blocked</li>
                <li>All actions are logged in audit trail</li>
              </ul>
            </div>

            <div className="space-y-2">
              <Label htmlFor="impersonation-reason">Reason for Impersonation *</Label>
              <Textarea
                id="impersonation-reason"
                placeholder="Enter a detailed reason (e.g., 'Customer support - debug gallery issue')"
                value={impersonationReason}
                onChange={(e) => setImpersonationReason(e.target.value)}
                rows={4}
              />
              <p className="text-xs text-gray-500">
                Minimum 10 characters. Be specific about why you need access.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setImpersonateDialogOpen(false)
                setImpersonationReason('')
                setSelectedUser(null)
              }}
              disabled={impersonating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleImpersonate}
              disabled={impersonating || impersonationReason.length < 10}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {impersonating ? 'Starting Session...' : 'Start Impersonation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign to Organization Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign User to Organization</DialogTitle>
            <DialogDescription>
              Directly add <strong>{selectedUser?.email}</strong> to an organization. They will immediately gain access based on the assigned role.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
              <strong>Note:</strong> This assigns the user immediately without sending an invitation. Use &quot;Invite&quot; instead if you want them to join via a link.
            </div>

            <div className="space-y-2">
              <Label htmlFor="assign-org">Organization *</Label>
              <Select value={selectedOrgId} onValueChange={setSelectedOrgId}>
                <SelectTrigger id="assign-org">
                  <SelectValue placeholder={loadingOrgs ? 'Loading...' : 'Select an organization'} />
                </SelectTrigger>
                <SelectContent>
                  {organizations.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="assign-role">Role</Label>
              <Select value={selectedRole} onValueChange={(value: 'viewer' | 'editor' | 'admin') => setSelectedRole(value)}>
                <SelectTrigger id="assign-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">Viewer (read-only)</SelectItem>
                  <SelectItem value="editor">Editor (can create/edit)</SelectItem>
                  <SelectItem value="admin">Admin (full access)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                Default role is Viewer. You can change this later from the organization settings.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAssignDialogOpen(false)
                setSelectedOrgId('')
                setSelectedRole('viewer')
                setSelectedUser(null)
              }}
              disabled={assigning}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssignToOrg}
              disabled={assigning || !selectedOrgId}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {assigning ? 'Assigning...' : 'Assign to Organization'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invite to Organization Dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={(open) => {
        setInviteDialogOpen(open)
        if (!open) {
          setInviteResult(null)
          setSelectedOrgId('')
          setSelectedUser(null)
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite User to Organization</DialogTitle>
            <DialogDescription>
              Generate an invite link for <strong>{selectedUser?.email}</strong> to join an organization.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {!inviteResult ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="invite-org">Organization *</Label>
                  <Select value={selectedOrgId} onValueChange={setSelectedOrgId}>
                    <SelectTrigger id="invite-org">
                      <SelectValue placeholder={loadingOrgs ? 'Loading...' : 'Select an organization'} />
                    </SelectTrigger>
                    <SelectContent>
                      {organizations.map((org) => (
                        <SelectItem key={org.id} value={org.id}>
                          {org.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 text-sm text-indigo-800">
                  <strong>How it works:</strong>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>An invite link will be generated</li>
                    <li>Share the link with the user</li>
                    <li>They can join by clicking the link</li>
                  </ul>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-800 font-medium mb-2">Invite Generated Successfully!</p>
                  <p className="text-xs text-green-700">Share this link with the user:</p>
                </div>

                <div className="space-y-2">
                  <Label>Invite URL</Label>
                  <div className="flex gap-2">
                    <Input value={inviteResult.url} readOnly className="flex-1 font-mono text-sm" />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(inviteResult.url)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Invite Code</Label>
                  <div className="flex gap-2">
                    <Input value={inviteResult.code} readOnly className="flex-1 font-mono text-sm tracking-wider" />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(inviteResult.code)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            {!inviteResult ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setInviteDialogOpen(false)
                    setSelectedOrgId('')
                    setSelectedUser(null)
                  }}
                  disabled={inviting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleInviteToOrg}
                  disabled={inviting || !selectedOrgId}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  {inviting ? 'Generating...' : 'Generate Invite'}
                </Button>
              </>
            ) : (
              <Button
                onClick={() => {
                  setInviteDialogOpen(false)
                  setInviteResult(null)
                  setSelectedOrgId('')
                  setSelectedUser(null)
                }}
              >
                Done
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Detail Panel */}
      <UserDetailPanel
        user={detailUser}
        open={detailPanelOpen}
        onOpenChange={setDetailPanelOpen}
        onSuspend={(user) => {
          setDetailPanelOpen(false)
          setSelectedUser(user)
          setSuspendDialogOpen(true)
        }}
        onReactivate={(user) => {
          setDetailPanelOpen(false)
          handleReactivate(user)
        }}
        onImpersonate={(user) => {
          setDetailPanelOpen(false)
          setSelectedUser(user)
          setImpersonateDialogOpen(true)
        }}
      />
    </div>
  )
}
