'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import { useOrganization } from '@/hooks/use-organization'
import { useClientAdmin } from '@/hooks/use-client-admin'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import {
  Users,
  UserPlus,
  Copy,
  MoreVertical,
  Shield,
  Edit,
  Trash2,
  RefreshCw,
} from 'lucide-react'
import { USER_ROLES, type UserRole } from '@/lib/config/constants'
import { format } from 'date-fns'

interface TeamMember {
  id: string
  user_id: string
  role: string
  joined_at: string
  user_profiles: {
    full_name: string | null
    avatar_url: string | null
  } | null
}

export default function TeamPage() {
  const supabase = useMemo(() => createClient(), [])
  const { currentOrganization, user } = useAuthStore()
  const { organization } = useOrganization()
  const { isAdmin, isReady } = useClientAdmin()

  const [members, setMembers] = useState<TeamMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null)
  const [newRole, setNewRole] = useState<UserRole>('viewer')

  const fetchMembers = useCallback(async () => {
    if (!currentOrganization?.id) return

    setIsLoading(true)

    // First get all organization members
    const { data: membersData, error: membersError } = await supabase
      .from('organization_members')
      .select('*')
      .eq('organization_id', currentOrganization.id)
      .order('joined_at', { ascending: true })

    if (membersError) {
      setIsLoading(false)
      toast.error('Failed to load team members')
      return
    }

    if (!membersData || membersData.length === 0) {
      setIsLoading(false)
      setMembers([])
      return
    }

    // Get user profiles for all members
    const userIds = membersData.map(m => m.user_id)
    const { data: profilesData } = await supabase
      .from('user_profiles')
      .select('id, full_name, avatar_url')
      .in('id', userIds)

    // Combine the data
    const profilesMap = new Map(
      (profilesData || []).map(p => [p.id, { full_name: p.full_name, avatar_url: p.avatar_url }])
    )

    const enrichedMembers: TeamMember[] = membersData.map(member => ({
      id: member.id,
      user_id: member.user_id,
      role: member.role,
      joined_at: member.joined_at,
      user_profiles: profilesMap.get(member.user_id) || null,
    }))

    setIsLoading(false)
    setMembers(enrichedMembers)
  }, [currentOrganization?.id, supabase])

  useEffect(() => {
    fetchMembers()
  }, [fetchMembers])

  const copyInviteCode = () => {
    if (organization?.invite_code) {
      navigator.clipboard.writeText(organization.invite_code)
      toast.success('Invite code copied to clipboard')
    }
  }

  const regenerateInviteCode = async () => {
    if (!currentOrganization?.id || !isReady || !isAdmin) return

    const newCode = Math.random().toString(36).substring(2, 8).toUpperCase()

    const { error } = await supabase
      .from('organizations')
      .update({ invite_code: newCode })
      .eq('id', currentOrganization.id)

    if (error) {
      toast.error('Failed to regenerate invite code')
      return
    }

    toast.success('New invite code generated')
    // Refresh organization data
    window.location.reload()
  }

  const updateMemberRole = async () => {
    if (!editingMember || !isReady || !isAdmin) return

    const { error } = await supabase
      .from('organization_members')
      .update({ role: newRole })
      .eq('id', editingMember.id)

    if (error) {
      toast.error('Failed to update role')
      return
    }

    toast.success('Member role updated')
    setEditingMember(null)
    fetchMembers()
  }

  const removeMember = async (memberId: string, memberUserId: string) => {
    if (!isReady || !isAdmin) return

    // Can't remove yourself
    if (memberUserId === user?.id) {
      toast.error("You can't remove yourself from the organization")
      return
    }

    if (!confirm('Are you sure you want to remove this member?')) return

    const { error } = await supabase
      .from('organization_members')
      .delete()
      .eq('id', memberId)

    if (error) {
      toast.error('Failed to remove member')
      return
    }

    toast.success('Member removed')
    fetchMembers()
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'default'
      case 'editor':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team</h1>
          <p className="text-muted-foreground">
            Manage your organization&apos;s team members
          </p>
        </div>
      </div>

      {/* Invite Code Card */}
      {isReady && isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Invite New Members
            </CardTitle>
            <CardDescription>
              Share this code with team members to let them join your organization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Input
                    value={organization?.invite_code || ''}
                    readOnly
                    className="font-mono text-base sm:text-lg tracking-widest text-center w-full sm:max-w-[200px]"
                  />
                  <Button variant="outline" size="icon" onClick={copyInviteCode} className="flex-shrink-0">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Button variant="outline" onClick={regenerateInviteCode} className="w-full sm:w-auto">
                <RefreshCw className="h-4 w-4 mr-2" />
                Regenerate
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              New members will join with the &quot;Viewer&quot; role. You can change their role after they join.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Team Members */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Members
          </CardTitle>
          <CardDescription>
            {members.length} member{members.length !== 1 ? 's' : ''} in your organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : (
            <>
            {/* Mobile Card Layout */}
            <div className="block md:hidden space-y-3">
              {members.map((member) => {
                const initials = member.user_profiles?.full_name
                  ?.split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase() || '?'
                const isCurrentUser = member.user_id === user?.id

                return (
                  <Card key={member.id} className="p-3">
                    <div className="flex items-start gap-3">
                      <Avatar>
                        <AvatarImage src={member.user_profiles?.avatar_url || undefined} />
                        <AvatarFallback>{initials}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium truncate">
                            {member.user_profiles?.full_name || 'Unknown User'}
                          </p>
                          {isCurrentUser && (
                            <Badge variant="outline" className="text-xs">You</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <Badge variant={getRoleBadgeVariant(member.role)} className="text-xs">
                            {USER_ROLES[member.role as UserRole]?.label || member.role}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(member.joined_at), 'MMM d, yyyy')}
                          </span>
                        </div>
                      </div>
                      {isReady && isAdmin && !isCurrentUser && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setEditingMember(member)
                                setNewRole(member.role as UserRole)
                              }}
                            >
                              <Shield className="h-4 w-4 mr-2" />
                              Change Role
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => removeMember(member.id, member.user_id)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remove
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </Card>
                )
              })}
            </div>

            {/* Desktop Table Layout */}
            <Table className="hidden md:table">
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  {isReady && isAdmin && <TableHead className="w-[50px]" />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => {
                  const initials = member.user_profiles?.full_name
                    ?.split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase() || '?'

                  const isCurrentUser = member.user_id === user?.id

                  return (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={member.user_profiles?.avatar_url || undefined} />
                            <AvatarFallback>{initials}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {member.user_profiles?.full_name || 'Unknown User'}
                              {isCurrentUser && (
                                <Badge variant="outline" className="ml-2">You</Badge>
                              )}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(member.role)}>
                          {USER_ROLES[member.role as UserRole]?.label || member.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(member.joined_at), 'MMM d, yyyy')}
                      </TableCell>
                      {isReady && isAdmin && (
                        <TableCell>
                          {!isCurrentUser && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => {
                                    setEditingMember(member)
                                    setNewRole(member.role as UserRole)
                                  }}
                                >
                                  <Shield className="h-4 w-4 mr-2" />
                                  Change Role
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => removeMember(member.id, member.user_id)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Remove
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
            </>
          )}
        </CardContent>
      </Card>

      {/* Edit Role Dialog */}
      <Dialog open={!!editingMember} onOpenChange={(open) => !open && setEditingMember(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Member Role</DialogTitle>
            <DialogDescription>
              Update the role for {editingMember?.user_profiles?.full_name || 'this member'}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Select
              value={newRole}
              onValueChange={(v) => setNewRole(v as UserRole)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(USER_ROLES).map(([value, { label, permissions }]) => (
                  <SelectItem key={value} value={value}>
                    <div>
                      <div className="font-medium">{label}</div>
                      <div className="text-xs text-muted-foreground">
                        {permissions.join(', ')}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingMember(null)}>
              Cancel
            </Button>
            <Button onClick={updateMemberRole}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
