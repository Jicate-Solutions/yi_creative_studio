'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Logo } from '@/components/layout/logo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2, Users, AlertCircle, ArrowRight, KeyRound } from 'lucide-react'
import { ROUTES } from '@/lib/config/constants'
import Link from 'next/link'

interface Organization {
  id: string
  name: string
}

export default function JoinWithCodePage() {
  const router = useRouter()
  const params = useParams()
  const code = (params.code as string)?.toUpperCase()
  const supabase = useMemo(() => createClient(), [])

  const [isLoading, setIsLoading] = useState(true)
  const [isJoining, setIsJoining] = useState(false)
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [manualCode, setManualCode] = useState('')

  // Check auth and fetch organization
  useEffect(() => {
    async function init() {
      setIsLoading(true)
      setError(null)

      // Check authentication
      const { data: { user } } = await supabase.auth.getUser()
      setIsAuthenticated(!!user)

      if (!user) {
        // Redirect to login with return URL
        const returnUrl = encodeURIComponent(`/join/${code}`)
        router.push(`${ROUTES.login}?redirectTo=${returnUrl}`)
        return
      }

      // Fetch organization by code
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('id, name')
        .eq('invite_code', code)
        .eq('is_active', true)
        .single()

      if (orgError || !org) {
        setError('Invalid or expired invite code')
        setIsLoading(false)
        return
      }

      // Check if already a member
      const { data: existingMember } = await supabase
        .from('organization_members')
        .select('id')
        .eq('organization_id', org.id)
        .eq('user_id', user.id)
        .single()

      if (existingMember) {
        toast.info(`You're already a member of ${org.name}`)
        router.push(ROUTES.dashboard)
        return
      }

      setOrganization(org)
      setIsLoading(false)
    }

    if (code) {
      init()
    }
  }, [code, supabase, router])

  async function handleJoin() {
    if (!organization) return

    setIsJoining(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Please sign in first')
      router.push(ROUTES.login)
      return
    }

    // Add user as viewer
    const { error: memberError } = await supabase
      .from('organization_members')
      .insert({
        organization_id: organization.id,
        user_id: user.id,
        role: 'viewer',
      })

    setIsJoining(false)

    if (memberError) {
      toast.error('Failed to join organization. Please try again.')
      return
    }

    toast.success(`Welcome to ${organization.name}!`)
    router.push(ROUTES.dashboard)
    router.refresh()
  }

  function handleManualCodeSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (manualCode.length === 6) {
      router.push(`/join/${manualCode.toUpperCase()}`)
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading invitation...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Error state - invalid code
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
            <CardDescription>
              The invite code &quot;{code}&quot; is invalid or has expired.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Manual code entry */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <KeyRound className="h-4 w-4" />
                Try a different code
              </div>
              <form onSubmit={handleManualCodeSubmit} className="flex gap-2">
                <Input
                  placeholder="ABCDEF"
                  className="text-center text-lg tracking-widest uppercase font-mono"
                  maxLength={6}
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                />
                <Button
                  type="submit"
                  className="gradient-yi shrink-0"
                  disabled={manualCode.length < 6}
                >
                  Try
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </form>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">or</span>
              </div>
            </div>

            <Link href={ROUTES.onboarding} className="block">
              <Button variant="outline" className="w-full">
                Go to Onboarding
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Success state - show organization and join button
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Logo size="lg" />
          </div>
          <CardTitle className="text-2xl">Join {organization?.name}</CardTitle>
          <CardDescription>
            You&apos;ve been invited to join this organization
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Organization info */}
          <div className="p-4 rounded-lg bg-muted/50 border">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">{organization?.name}</p>
                <p className="text-sm text-muted-foreground">
                  You&apos;ll join as a Viewer
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
              <Users className="h-4 w-4 mr-2" />
            )}
            Join Organization
          </Button>

          {/* Alternative action */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Not the right organization?{' '}
              <Link href={ROUTES.onboarding} className="text-primary hover:underline">
                Enter a different code
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
