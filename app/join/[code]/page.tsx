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
import { Loader2, AlertCircle, ArrowRight, KeyRound } from 'lucide-react'
import { ROUTES } from '@/lib/config/constants'
import Link from 'next/link'

export default function JoinWithCodePage() {
  const router = useRouter()
  const params = useParams()
  const code = (params.code as string)?.toUpperCase()
  const supabase = useMemo(() => createClient(), [])

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [manualCode, setManualCode] = useState('')

  // Check auth, fetch organization, and auto-join
  useEffect(() => {
    async function init() {
      setIsLoading(true)
      setError(null)

      // Check authentication
      const { data: { user } } = await supabase.auth.getUser()

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

      // Auto-join the organization
      const { error: memberError } = await supabase
        .from('organization_members')
        .insert({
          organization_id: org.id,
          user_id: user.id,
          role: 'viewer',
        })

      if (memberError) {
        setError('Failed to join organization. Please try again.')
        setIsLoading(false)
        return
      }

      // Success - redirect to dashboard
      toast.success(`Welcome to ${org.name}!`)
      router.push(ROUTES.dashboard)
      router.refresh()
    }

    if (code) {
      init()
    }
  }, [code, supabase, router])

  function handleManualCodeSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (manualCode.length === 6) {
      router.push(`/join/${manualCode.toUpperCase()}`)
    }
  }

  // Loading state - shown while auto-joining
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Logo size="lg" className="mb-6" />
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Joining organization...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Error state - invalid code or join failed
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
            <CardTitle className="text-xl">Unable to Join</CardTitle>
            <CardDescription>
              {error === 'Invalid or expired invite code'
                ? `The invite code "${code}" is invalid or has expired.`
                : error
              }
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

  // This should not be reached - either loading, error, or redirected
  return null
}
