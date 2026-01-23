'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { Link as LinkIcon, RefreshCw } from 'lucide-react'
import { CreateInviteDialog } from './create-invite-dialog'
import { InviteLinkCard } from './invite-link-card'

interface Invite {
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

export function InviteLinksSection() {
  const [invites, setInvites] = useState<Invite[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchInvites = useCallback(async () => {
    try {
      const response = await fetch('/api/team/invites')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch invites')
      }

      setInvites(data.invites)
    } catch (err) {
      console.error('Failed to fetch invites:', err)
      toast.error('Failed to load invite links')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchInvites()
  }, [fetchInvites])

  const handleRevoke = async (inviteId: string) => {
    const response = await fetch('/api/team/revoke-invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inviteId }),
    })

    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.error || 'Failed to revoke invite')
    }

    // Refresh the list
    await fetchInvites()
  }

  // Separate active and inactive invites
  const activeInvites = invites.filter(
    (i) => i.isActive && !i.isExpired && !i.isUsedUp
  )
  const inactiveInvites = invites.filter(
    (i) => !i.isActive || i.isExpired || i.isUsedUp
  )

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <LinkIcon className="h-5 w-5" />
              Invite Links
            </CardTitle>
            <CardDescription>
              Create invite links with specific roles for new members
            </CardDescription>
          </div>
          <CreateInviteDialog onInviteCreated={fetchInvites} />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(2)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        ) : invites.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <LinkIcon className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p className="font-medium">No invite links yet</p>
            <p className="text-sm">Create an invite link to add team members with specific roles</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Active invites */}
            {activeInvites.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground">
                  Active ({activeInvites.length})
                </h4>
                {activeInvites.map((invite) => (
                  <InviteLinkCard
                    key={invite.id}
                    invite={invite}
                    onRevoke={handleRevoke}
                  />
                ))}
              </div>
            )}

            {/* Inactive invites */}
            {inactiveInvites.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground">
                  Expired / Used / Revoked ({inactiveInvites.length})
                </h4>
                {inactiveInvites.slice(0, 5).map((invite) => (
                  <InviteLinkCard
                    key={invite.id}
                    invite={invite}
                    onRevoke={handleRevoke}
                  />
                ))}
                {inactiveInvites.length > 5 && (
                  <p className="text-xs text-muted-foreground text-center">
                    + {inactiveInvites.length - 5} more
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
