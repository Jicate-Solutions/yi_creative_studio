'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/layout/logo'
import { Loader2, Shield, Check, X, Building2 } from 'lucide-react'
import Link from 'next/link'

/**
 * OAuth 2.0 Authorization Endpoint
 *
 * Handles authorization requests from Yi Connect.
 * Shows consent screen and redirects with authorization code.
 */
export default function OAuthAuthorizePage() {
  return (
    <Suspense fallback={<OAuthLoading />}>
      <OAuthAuthorizeContent />
    </Suspense>
  )
}

function OAuthLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Loading authorization...</p>
        </CardContent>
      </Card>
    </div>
  )
}

function OAuthAuthorizeContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthorizing, setIsAuthorizing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [organizations, setOrganizations] = useState<any[]>([])
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null)
  const [clientInfo, setClientInfo] = useState<any>(null)

  // OAuth params
  const clientId = searchParams.get('client_id')
  const redirectUri = searchParams.get('redirect_uri')
  const responseType = searchParams.get('response_type')
  const scope = searchParams.get('scope')
  const state = searchParams.get('state')

  useEffect(() => {
    async function checkAuth() {
      // Validate required OAuth params
      if (!clientId || !redirectUri || !responseType) {
        setError('Missing required OAuth parameters')
        setIsLoading(false)
        return
      }

      if (clientId !== 'yi-connect') {
        setError('Invalid client_id. Only yi-connect is allowed.')
        setIsLoading(false)
        return
      }

      if (responseType !== 'code') {
        setError('Invalid response_type. Only "code" is supported.')
        setIsLoading(false)
        return
      }

      // Validate redirect URI
      const allowedRedirectUris = [
        'https://yi-connect-app.vercel.app/api/yi-creative/callback',
        'http://localhost:3000/api/yi-creative/callback',
        'http://localhost:3001/api/yi-creative/callback',
      ]

      if (!allowedRedirectUris.some(uri => redirectUri.startsWith(uri.split('/api')[0]))) {
        setError('Invalid redirect_uri')
        setIsLoading(false)
        return
      }

      setClientInfo({
        name: 'Yi Connect',
        description: 'Chapter Management System',
        scopes: scope?.split(' ') || ['organization:read'],
      })

      // Check if user is authenticated
      const supabase = createClient()
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError || !user) {
        // Redirect to login with return URL
        const returnUrl = `/oauth/authorize?${searchParams.toString()}`
        router.push(`/auth/login?redirectTo=${encodeURIComponent(returnUrl)}`)
        return
      }

      setUser(user)

      // Get user's organizations
      const { data: memberships } = await supabase
        .from('organization_members')
        .select(`
          organization_id,
          role,
          organizations (
            id,
            name,
            slug
          )
        `)
        .eq('user_id', user.id)
        .eq('role', 'admin') // Only allow admins to authorize

      if (!memberships || memberships.length === 0) {
        setError('You need to be an admin of an organization to connect Yi Connect.')
        setIsLoading(false)
        return
      }

      const orgs = memberships.map(m => m.organizations).filter(Boolean)
      setOrganizations(orgs)

      if (orgs.length === 1) {
        setSelectedOrg(orgs[0].id)
      }

      setIsLoading(false)
    }

    checkAuth()
  }, [clientId, redirectUri, responseType, scope, state, searchParams, router])

  const handleAuthorize = async () => {
    if (!selectedOrg) {
      setError('Please select an organization')
      return
    }

    setIsAuthorizing(true)

    try {
      // Call API to create authorization code
      const response = await fetch('/api/oauth/authorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_id: selectedOrg,
          client_id: clientId,
          redirect_uri: redirectUri,
          scope,
          state,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Authorization failed')
      }

      // Redirect to Yi Connect with authorization code
      const redirectUrl = new URL(redirectUri!)
      redirectUrl.searchParams.set('code', data.code)
      if (state) {
        redirectUrl.searchParams.set('state', state)
      }

      window.location.href = redirectUrl.toString()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authorization failed')
      setIsAuthorizing(false)
    }
  }

  const handleDeny = () => {
    // Redirect back with error
    const redirectUrl = new URL(redirectUri!)
    redirectUrl.searchParams.set('error', 'access_denied')
    redirectUrl.searchParams.set('error_description', 'User denied access')
    if (state) {
      redirectUrl.searchParams.set('state', state)
    }
    window.location.href = redirectUrl.toString()
  }

  if (isLoading) {
    return <OAuthLoading />
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-destructive/10">
                <X className="h-8 w-8 text-destructive" />
              </div>
            </div>
            <CardTitle>Authorization Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Link href="/dashboard">
              <Button variant="outline">Return to Dashboard</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Logo size="lg" />
          </div>
          <CardTitle className="text-xl">Authorize {clientInfo?.name}</CardTitle>
          <CardDescription>
            {clientInfo?.name} wants to connect to your Yi Creative Studio organization
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Permissions */}
          <div className="rounded-lg border p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Shield className="h-4 w-4 text-primary" />
              <span>This will allow {clientInfo?.name} to:</span>
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground ml-6">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                Read your organization information
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                Send SSO login requests for users
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                Sync events to your organization
              </li>
            </ul>
          </div>

          {/* Organization Selection */}
          {organizations.length > 1 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Organization</label>
              <div className="space-y-2">
                {organizations.map((org: any) => (
                  <button
                    key={org.id}
                    onClick={() => setSelectedOrg(org.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                      selectedOrg === org.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">{org.name}</span>
                    {selectedOrg === org.id && (
                      <Check className="h-4 w-4 text-primary ml-auto" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {organizations.length === 1 && (
            <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/50">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">{organizations[0].name}</p>
                <p className="text-xs text-muted-foreground">Your organization</p>
              </div>
            </div>
          )}

          {/* User Info */}
          <div className="text-xs text-muted-foreground text-center">
            Signed in as {user?.email}
          </div>
        </CardContent>

        <CardFooter className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleDeny}
            disabled={isAuthorizing}
          >
            Deny
          </Button>
          <Button
            className="flex-1"
            onClick={handleAuthorize}
            disabled={isAuthorizing || !selectedOrg}
          >
            {isAuthorizing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Authorizing...
              </>
            ) : (
              'Authorize'
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
