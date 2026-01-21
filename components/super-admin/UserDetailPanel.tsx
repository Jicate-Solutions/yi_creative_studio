'use client'

/**
 * User Detail Panel Component
 * A slide-out drawer showing detailed user information
 */

import { useState, useEffect } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Mail,
  Phone,
  Calendar,
  Clock,
  Building,
  Shield,
  ImagePlus,
  UserX,
  UserCheck,
  UserCog,
  ExternalLink,
  Trash2,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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

interface RecentCreative {
  id: string
  title: string
  format_id: string
  created_at: string
  thumbnail_url?: string
}

interface UserDetailPanelProps {
  user: User | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuspend?: (user: User) => void
  onReactivate?: (user: User) => void
  onImpersonate?: (user: User) => void
  onDelete?: () => void
}

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

function formatDate(dateString: string | null) {
  if (!dateString) return 'Never'
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDateShort(dateString: string | null) {
  if (!dateString) return 'Never'
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function UserDetailPanel({
  user,
  open,
  onOpenChange,
  onSuspend,
  onReactivate,
  onImpersonate,
  onDelete,
}: UserDetailPanelProps) {
  const [recentCreatives, setRecentCreatives] = useState<RecentCreative[]>([])
  const [loadingCreatives, setLoadingCreatives] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [confirmDeleteText, setConfirmDeleteText] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (user && open) {
      fetchRecentCreatives(user.id)
    }
  }, [user, open])

  async function fetchRecentCreatives(userId: string) {
    setLoadingCreatives(true)
    try {
      // Fetch recent creatives for this user
      const response = await fetch(`/api/super-admin/users/${userId}/creatives?limit=5`)
      if (response.ok) {
        const data = await response.json()
        setRecentCreatives(data.creatives || [])
      }
    } catch (error) {
      console.error('Failed to fetch recent creatives:', error)
      setRecentCreatives([])
    } finally {
      setLoadingCreatives(false)
    }
  }

  async function handleDeleteUser() {
    if (!user || confirmDeleteText !== 'DELETE') {
      toast.error('Please type DELETE to confirm')
      return
    }

    setDeleting(true)
    try {
      const response = await fetch(
        `/api/super-admin/users/${user.id}/delete?confirm=DELETE`,
        { method: 'DELETE' }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete user')
      }

      toast.success(data.message || 'User deleted successfully')
      setDeleteDialogOpen(false)
      setConfirmDeleteText('')
      onOpenChange(false)
      onDelete?.()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete user')
    } finally {
      setDeleting(false)
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
    return <Badge className={variant.color}>{variant.label}</Badge>
  }

  function getRoleBadge(role: string) {
    const colors = {
      admin: 'bg-red-100 text-red-800',
      editor: 'bg-blue-100 text-blue-800',
      viewer: 'bg-green-100 text-green-800',
    }
    return (
      <Badge className={colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {role}
      </Badge>
    )
  }

  if (!user) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="space-y-4 pb-4">
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user.avatar_url || undefined} />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-xl">
                {getInitials(user.full_name, user.email)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1">
              <SheetTitle className="text-xl">
                {user.full_name || 'No name'}
              </SheetTitle>
              <SheetDescription className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5" />
                {user.email}
              </SheetDescription>
              <div className="flex items-center gap-2 mt-2">
                {getStatusBadge(user.status)}
                {user.is_super_admin && (
                  <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs">
                    <Shield className="w-3 h-3 mr-1" />
                    Super Admin
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </SheetHeader>

        <Separator />

        {/* Account Info */}
        <div className="py-4 space-y-4">
          <h3 className="font-semibold text-sm text-gray-500 uppercase tracking-wide">
            Account Information
          </h3>

          <div className="space-y-3">
            {user.phone && (
              <div className="flex items-center gap-3 text-sm">
                <Phone className="w-4 h-4 text-gray-400" />
                <span>{user.phone}</span>
              </div>
            )}

            <div className="flex items-center gap-3 text-sm">
              <Calendar className="w-4 h-4 text-gray-400" />
              <div>
                <span className="text-gray-500">Joined:</span>{' '}
                {formatDateShort(user.created_at)}
              </div>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <Clock className="w-4 h-4 text-gray-400" />
              <div>
                <span className="text-gray-500">Last active:</span>{' '}
                {formatDate(user.last_sign_in_at)}
              </div>
            </div>

            {user.status === 'suspended' && user.suspension_reason && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm">
                <div className="font-medium text-red-800">Suspension Reason:</div>
                <div className="text-red-700 mt-1">{user.suspension_reason}</div>
                {user.suspended_at && (
                  <div className="text-red-600 text-xs mt-2">
                    Suspended on {formatDateShort(user.suspended_at)}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Organizations */}
        <div className="py-4 space-y-4">
          <h3 className="font-semibold text-sm text-gray-500 uppercase tracking-wide">
            Organizations ({user.organization_count})
          </h3>

          {user.organizations.length > 0 ? (
            <div className="space-y-2">
              {user.organizations.map((org) => (
                <div
                  key={org.organization_id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-sm">{org.organization_name}</span>
                  </div>
                  {getRoleBadge(org.role)}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic">No organizations</p>
          )}
        </div>

        <Separator />

        {/* Recent Creatives */}
        <div className="py-4 space-y-4">
          <h3 className="font-semibold text-sm text-gray-500 uppercase tracking-wide">
            Recent Creatives
          </h3>

          {loadingCreatives ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : recentCreatives.length > 0 ? (
            <div className="space-y-2">
              {recentCreatives.map((creative) => (
                <div
                  key={creative.id}
                  className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg"
                >
                  <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center overflow-hidden">
                    {creative.thumbnail_url ? (
                      <img
                        src={creative.thumbnail_url}
                        alt={creative.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImagePlus className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{creative.title || 'Untitled'}</div>
                    <div className="text-xs text-gray-500">
                      {formatDateShort(creative.created_at)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic">No creatives yet</p>
          )}
        </div>

        <Separator />

        {/* Quick Actions */}
        <div className="py-4 space-y-3">
          <h3 className="font-semibold text-sm text-gray-500 uppercase tracking-wide">
            Quick Actions
          </h3>

          <div className="flex flex-wrap gap-2">
            {user.status === 'active' && !user.is_super_admin && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onSuspend?.(user)}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  <UserX className="w-4 h-4 mr-1" />
                  Suspend
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onImpersonate?.(user)}
                  className="text-purple-600 border-purple-200 hover:bg-purple-50"
                >
                  <UserCog className="w-4 h-4 mr-1" />
                  Impersonate
                </Button>
              </>
            )}

            {user.status === 'suspended' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onReactivate?.(user)}
                className="text-green-600 border-green-200 hover:bg-green-50"
              >
                <UserCheck className="w-4 h-4 mr-1" />
                Reactivate
              </Button>
            )}

            {user.is_super_admin && (
              <span className="text-xs text-gray-400 italic">Super Admin - Protected</span>
            )}
          </div>

          {user.organizations.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-gray-600"
              onClick={() => {
                const orgId = user.organizations[0]?.organization_id
                if (orgId) {
                  window.open(`/super-admin/organizations/${orgId}`, '_blank')
                }
              }}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              View Organization Details
            </Button>
          )}

          {/* Danger Zone - Delete User */}
          {!user.is_super_admin && (
            <div className="pt-4 border-t border-red-200">
              <Button
                variant="destructive"
                size="sm"
                className="w-full"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete User Permanently
              </Button>
            </div>
          )}
        </div>
      </SheetContent>

      {/* Hard Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={(open) => {
        setDeleteDialogOpen(open)
        if (!open) setConfirmDeleteText('')
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Permanently Delete User
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p>
                  This will <strong>PERMANENTLY</strong> delete the user{' '}
                  <strong>{user.full_name || user.email}</strong> and:
                </p>
                <ul className="list-disc ml-6 space-y-1 text-sm">
                  <li>Remove them from all organizations</li>
                  <li>Anonymize all their creatives (artwork will be preserved)</li>
                  <li>Delete their account and profile</li>
                </ul>
                <p className="font-semibold text-red-600">
                  This action CANNOT be undone!
                </p>
                <div className="pt-2">
                  <Label htmlFor="confirm-delete-text" className="text-sm font-medium">
                    Type <span className="font-bold">DELETE</span> to confirm:
                  </Label>
                  <Input
                    id="confirm-delete-text"
                    value={confirmDeleteText}
                    onChange={(e) => setConfirmDeleteText(e.target.value)}
                    placeholder="Type DELETE"
                    className="mt-2"
                    autoComplete="off"
                  />
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              disabled={confirmDeleteText !== 'DELETE' || deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Permanently'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sheet>
  )
}
