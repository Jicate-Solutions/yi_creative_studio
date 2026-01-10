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
import { Search, UserX, UserCheck, UserCog, Shield, Mail } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAutoRefresh } from '@/hooks/use-auto-refresh'
import { RefreshIndicator } from '@/components/super-admin/RefreshIndicator'

interface Organization {
  organization_id: string
  organization_name: string
  role: string
}

interface User {
  id: string
  email: string
  created_at: string
  last_sign_in_at: string | null
  status: 'active' | 'suspended' | 'deleted'
  is_super_admin: boolean
  suspended_at: string | null
  suspension_reason: string | null
  organizations: Organization[]
  organization_count: number
}

interface Pagination {
  page: number
  pageSize: number
  total: number
  totalPages: number
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

  function getStatusBadge(status: string) {
    const variants = {
      active: { color: 'bg-green-100 text-green-800', label: 'Active' },
      suspended: { color: 'bg-red-100 text-red-800', label: 'Suspended' },
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

      // Store session token (in production, use sessionStorage or secure cookie)
      console.log('[Impersonation] Session token:', data.session.token)
      console.log('[Impersonation] Restrictions:', data.session.restrictions)

      setImpersonateDialogOpen(false)
      setImpersonationReason('')
      setSelectedUser(null)

      // TODO: Navigate to user's dashboard or show impersonation banner
      alert(data.warning)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to start impersonation')
    } finally {
      setImpersonating(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Search & Filters */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4 flex-wrap flex-1">
          <div className="relative flex-1 min-w-[200px] max-w-md">
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
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
              <SelectItem value="deleted">Deleted</SelectItem>
            </SelectContent>
          </Select>

          <Select value={superAdminFilter} onValueChange={setSuperAdminFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Users" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              <SelectItem value="true">Super Admins</SelectItem>
              <SelectItem value="false">Regular Users</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Auto-refresh indicator */}
        <RefreshIndicator
          lastRefresh={lastRefresh}
          isRefreshing={isRefreshing}
          onManualRefresh={manualRefresh}
        />
      </div>

      {/* Results Summary */}
      <div className="text-sm text-gray-600">
        Showing {users.length} of {pagination.total} users
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
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
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">{user.email}</span>
                      </div>
                      {user.is_super_admin && (
                        <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                          <Shield className="w-3 h-3 mr-1" />
                          Super Admin
                        </Badge>
                      )}
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
                    <div className="flex items-center justify-end gap-2">
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
    </div>
  )
}
