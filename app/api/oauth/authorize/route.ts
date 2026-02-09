import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { randomBytes } from 'crypto'

/**
 * OAuth 2.0 Authorization Code Generation
 *
 * Called when user approves the authorization request.
 * Generates an authorization code that Yi Connect can exchange for tokens.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { organization_id, client_id, redirect_uri, scope, state } = body

    // Validate required fields
    if (!organization_id || !client_id || !redirect_uri) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate client_id
    if (client_id !== 'yi-connect') {
      return NextResponse.json(
        { error: 'Invalid client_id' },
        { status: 400 }
      )
    }

    // Validate redirect_uri
    const allowedRedirectUris = [
      'https://yi-connect-app.vercel.app',
      'http://localhost:3000',
      'http://localhost:3001',
    ]

    const redirectOrigin = new URL(redirect_uri).origin
    if (!allowedRedirectUris.includes(redirectOrigin)) {
      return NextResponse.json(
        { error: 'Invalid redirect_uri' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify user is admin of the organization
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('organization_id', organization_id)
      .single()

    if (!membership || membership.role !== 'admin') {
      return NextResponse.json(
        { error: 'You must be an admin of this organization' },
        { status: 403 }
      )
    }

    // Generate authorization code
    const code = randomBytes(32).toString('hex')

    // Store authorization code (expires in 10 minutes)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

    const { error: insertError } = await supabase
      .from('oauth_authorization_codes')
      .insert({
        code,
        user_id: user.id,
        organization_id,
        client_id,
        redirect_uri,
        scope: scope || 'organization:read',
        state,
        expires_at: expiresAt.toISOString(),
      })

    if (insertError) {
      console.error('Failed to store authorization code:', insertError)
      return NextResponse.json(
        { error: 'Failed to create authorization code' },
        { status: 500 }
      )
    }

    return NextResponse.json({ code })
  } catch (error) {
    console.error('OAuth authorize error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
