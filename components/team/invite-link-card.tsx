'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import {
  Copy,
  MoreVertical,
  Trash2,
  Shield,
  Edit,
  Eye,
  Clock,
  Users,
  Check,
  AlertTriangle,
} from 'lucide-react'
import { format } from 'date-fns'

interface InviteLinkCardProps {
  invite: {
    id: string
    token: string
    role: string
    email: string | null
    maxUses: number | null
    usedCount: number
    expiresAt: string | null
    isActive: boolean
    isExpired: boolean
    isUsedUp: boolean
    createdAt: string
    createdBy: {
      id: string
      name: string
    }
    url: string
  }
  onRevoke: (inviteId: string) => Promise<void>
}

const ROLE_CONFIG = {
  admin: {
    label: 'Admin',
    icon: Shield,
    variant: 'default' as const,
  },
  editor: {
    label: 'Editor',
    icon: Edit,
    variant: 'secondary' as const,
  },
  viewer: {
    label: 'Viewer',
    icon: Eye,
    variant: 'outline' as const,
  },
}

export function InviteLinkCard({ invite, onRevoke }: InviteLinkCardProps) {
  const [copied, setCopied] = useState(false)
  const [isRevoking, setIsRevoking] = useState(false)

  const roleConfig = ROLE_CONFIG[invite.role as keyof typeof ROLE_CONFIG] || ROLE_CONFIG.viewer
  const RoleIcon = roleConfig.icon

  const isDisabled = !invite.isActive || invite.isExpired || invite.isUsedUp

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(invite.url)
      setCopied(true)
      toast.success('Invite link copied!')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Failed to copy')
    }
  }

  const handleRevoke = async () => {
    if (!confirm('Are you sure you want to revoke this invite link?')) return

    setIsRevoking(true)
    try {
      await onRevoke(invite.id)
      toast.success('Invite link revoked')
    } catch {
      toast.error('Failed to revoke invite')
    } finally {
      setIsRevoking(false)
    }
  }

  // Get status badge
  const getStatusBadge = () => {
    if (!invite.isActive) {
      return <Badge variant="destructive">Revoked</Badge>
    }
    if (invite.isExpired) {
      return <Badge variant="destructive">Expired</Badge>
    }
    if (invite.isUsedUp) {
      return <Badge variant="secondary">Used</Badge>
    }
    return <Badge variant="default" className="bg-green-500">Active</Badge>
  }

  return (
    <Card className={isDisabled ? 'opacity-60' : ''}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Role icon */}
          <div className={`p-2 rounded-full ${isDisabled ? 'bg-muted' : 'bg-primary/10'}`}>
            <RoleIcon className={`h-4 w-4 ${isDisabled ? 'text-muted-foreground' : 'text-primary'}`} />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 space-y-2">
            {/* Header row */}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={roleConfig.variant}>{roleConfig.label}</Badge>
              {getStatusBadge()}
              {invite.email && (
                <span className="text-xs text-muted-foreground truncate">
                  for {invite.email}
                </span>
              )}
            </div>

            {/* Token preview */}
            <div className="font-mono text-sm text-muted-foreground truncate">
              {invite.url.replace(/^https?:\/\/[^/]+/, '')}
            </div>

            {/* Meta info */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
              {/* Uses */}
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                <span>
                  {invite.usedCount}/{invite.maxUses ?? '∞'} uses
                </span>
              </div>

              {/* Expiry */}
              {invite.expiresAt && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>
                    {invite.isExpired
                      ? `Expired ${format(new Date(invite.expiresAt), 'MMM d')}`
                      : `Expires ${format(new Date(invite.expiresAt), 'MMM d')}`
                    }
                  </span>
                </div>
              )}

              {/* Creator */}
              <span>by {invite.createdBy.name}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0">
            {!isDisabled && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCopy}
                className="h-8 w-8"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            )}

            {invite.isActive && !invite.isExpired && !invite.isUsedUp && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={handleRevoke}
                    className="text-destructive focus:text-destructive"
                    disabled={isRevoking}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Revoke Invite
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
