'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Logo } from '@/components/layout/logo'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { toast } from 'sonner'
import {
  Loader2,
  Users,
  AlertCircle,
  Shield,
  Edit,
  Eye,
  CheckCircle,
} from 'lucide-react'
import { ROUTES } from '@/lib/config/constants'
import Link from 'next/link'

interface InviteInfo {
  id: string
  role: string
  organizationId: string
  organizationName: string
}

const ROLE_CONFIG = {
  admin: {
    label: 'Admin',
    icon: Shield,
    description: 'Full access including team management',
    variant: 'default' as const,
  },
  editor: {
    label: 'Editor',
    icon: Edit,
    description: 'Can create and edit creatives',
    variant: 'secondary' as const,
  },
  viewer: {
    label: 'Viewer',
    icon: Eye,
    description: 'Can view creatives',
    variant: 'outline' as const,
  },
}

export default function JoinWithInvitePage() {
  const router = useRouter()
  const params = useParams()
  const token = params.token as string
  const supabase = useMemo(() => createClient(), [])

  const [isLoading, setIsLoading] = useState(true)
  const [isJoining, setIsJoining] = useState(false)
  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [errorCode, setErrorCode] = useState<string | null>(null)

  // Check auth and validate invite
  useEffect(() => {
    async function init() {
      setIsLoading(true)
      setError(null)
      setErrorCode(null)

      // Check authentication
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        // Redirect to login with return URL
        const returnUrl = encodeURIComponent(`/join/invite/${token}`)
        router.push(`${ROUTES.login}?redirectTo=${returnUrl}`)
        return
      }

      // Fetch invite by token
      const { data: invite, error: inviteError } = await supabase
        .from('organization_invites')
        .select(`
          id,
          role,
          organization_id,
          email,
          max_uses,
          used_count,
          expires_at,
          is_active,
          organizations!inner(name, is_active)
        `)
        .eq('token', token)
        .single()

      if (inviteError || !invite) {
        setError('Invalid invite link')
        setErrorCode('INVITE_NOT_FOUND')
        setIsLoading(false)
        return
      }

      // Validate invite is active
      if (!invite.is_active) {
        setError('This invite link has been revoked')
        setErrorCode('INVITE_REVOKED')
        setIsLoading(false)
        return
      }

      // Check expiration
      if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
        setError('This invite link has expired')
        setErrorCode('INVITE_EXPIRED')
        setIsLoading(false)
        return
      }

      // Check max uses
      if (invite.max_uses !== null && (invite.used_count ?? 0) >= invite.max_uses) {
        setError('This invite link has reached its maximum uses')
        setErrorCode('INVITE_USED_UP')
        setIsLoading(false)
        return
      }

      // Check email restriction
      if (invite.email && invite.email.toLowerCase() !== user.email?.toLowerCase()) {
        setError('This invite link is restricted to a specific email address')
        setErrorCode('EMAIL_MISMATCH')
        setIsLoading(false)
        return
      }

      // Check organization is active
      const org = invite.organizations as any
      if (!org?.is_active) {
        setError('This organization is no longer active')
        setErrorCode('ORG_INACTIVE')
        setIsLoading(false)
        return
      }

      // Check if already a member
      const { data: existingMember } = await supabase
        .from('organization_members')
        .select('id')
        .eq('organization_id', invite.organization_id)
        .eq('user_id', user.id)
        .single()

      if (existingMember) {
        toast.info(`You're already a member of ${org.name}`)
        router.push(ROUTES.dashboard)
        return
      }

      setInviteInfo({
        id: invite.id,
        role: invite.role,
        organizationId: invite.organization_id,
        organizationName: org.name,
      })
      setIsLoading(false)
    }

    if (token) {
      init()
    }
  }, [token, supabase, router])

  async function handleJoin() {
    if (!inviteInfo) return

    setIsJoining(true)

    try {
      const response = await fetch('/api/team/join-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || 'Failed to join organization')
        setIsJoining(false)

        // Handle specific error codes
        if (data.code === 'ALREADY_MEMBER') {
          router.push(ROUTES.dashboard)
        }
        return
      }

      toast.success(`Welcome to ${inviteInfo.organizationName}!`)
      router.push(ROUTES.dashboard)
      router.refresh()
    } catch (err) {
      console.error('Join error:', err)
      toast.error('Failed to join organization. Please try again.')
      setIsJoining(false)
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Validating invitation...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-destructive/10">
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>
            </div>
            <CardTitle className="text-xl">Invalid Invite Link</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {errorCode === 'EMAIL_MISMATCH' && (
              <p className="text-sm text-center text-muted-foreground">
                Please sign in with the correct email address to use this invite.
              </p>
            )}

            <Link href={ROUTES.onboarding} className="block">
              <Button variant="outline" className="w-full">
                Go to Onboarding
              </Button>
            </Link>

            <Link href={ROUTES.dashboard} className="block">
              <Button variant="ghost" className="w-full">
                Go to Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Success state - show organization, role, and join button
  const roleConfig = ROLE_CONFIG[inviteInfo?.role as keyof typeof ROLE_CONFIG] || ROLE_CONFIG.viewer
  const RoleIcon = roleConfig.icon

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Logo size="lg" />
          </div>
          <CardTitle className="text-2xl">You&apos;ve been invited!</CardTitle>
          <CardDescription>
            Join {inviteInfo?.organizationName} on Yi CreativeStudio
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Organization and Role info */}
          <div className="p-4 rounded-lg bg-muted/50 border space-y-4">
            {/* Organization */}
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">{inviteInfo?.organizationName}</p>
                <p className="text-sm text-muted-foreground">Organization</p>
              </div>
            </div>

            {/* Role */}
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <RoleIcon className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">You&apos;ll join as</p>
                  <Badge variant={roleConfig.variant}>{roleConfig.label}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {roleConfig.description}
                </p>
              </div>
            </div>
          </div>

          {/* Join button */}
          <Button
            onClick={handleJoin}
            className="w-full gradient-yi"
            size="lg"
            disabled={isJoining}
          >
            {isJoining ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-2" />
            )}
            Join Organization
          </Button>

          {/* Alternative action */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Already a member?{' '}
              <Link href={ROUTES.dashboard} className="text-primary hover:underline">
                Go to Dashboard
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
