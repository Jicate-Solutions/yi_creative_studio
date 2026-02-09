import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { randomBytes } from 'crypto'

// Use admin client to bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * OAuth 2.0 Token Endpoint
 *
 * Exchanges authorization code for access and refresh tokens.
 *
 * POST /api/oauth/token
 * Content-Type: application/json
 *
 * Request:
 * {
 *   "grant_type": "authorization_code",
 *   "code": "AUTH_CODE",
 *   "client_id": "yi-connect",
 *   "redirect_uri": "https://yi-connect-app.vercel.app/api/yi-creative/callback"
 * }
 *
 * Response:
 * {
 *   "access_token": "...",
 *   "refresh_token": "...",
 *   "expires_in": 3600,
 *   "token_type": "Bearer",
 *   "scope": "organization:read"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { grant_type, code, client_id, redirect_uri } = body

    // Validate grant_type
    if (grant_type !== 'authorization_code') {
      return NextResponse.json(
        { error: 'unsupported_grant_type', error_description: 'Only authorization_code is supported' },
        { status: 400 }
      )
    }

    // Validate required fields
    if (!code || !client_id || !redirect_uri) {
      return NextResponse.json(
        { error: 'invalid_request', error_description: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // Validate client_id
    if (client_id !== 'yi-connect') {
      return NextResponse.json(
        { error: 'invalid_client', error_description: 'Unknown client' },
        { status: 400 }
      )
    }

    // Look up authorization code
    const { data: authCode, error: codeError } = await supabaseAdmin
      .from('oauth_authorization_codes')
      .select('*')
      .eq('code', code)
      .single()

    if (codeError || !authCode) {
      return NextResponse.json(
        { error: 'invalid_grant', error_description: 'Invalid or expired authorization code' },
        { status: 400 }
      )
    }

    // Check if code is expired
    if (new Date(authCode.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'invalid_grant', error_description: 'Authorization code expired' },
        { status: 400 }
      )
    }

    // Check if code was already used
    if (authCode.used_at) {
      return NextResponse.json(
        { error: 'invalid_grant', error_description: 'Authorization code already used' },
        { status: 400 }
      )
    }

    // Validate redirect_uri matches
    if (authCode.redirect_uri !== redirect_uri) {
      return NextResponse.json(
        { error: 'invalid_grant', error_description: 'Redirect URI mismatch' },
        { status: 400 }
      )
    }

    // Mark code as used
    await supabaseAdmin
      .from('oauth_authorization_codes')
      .update({ used_at: new Date().toISOString() })
      .eq('id', authCode.id)

    // Generate tokens
    const accessToken = randomBytes(32).toString('hex')
    const refreshToken = randomBytes(32).toString('hex')

    // Token expiration (access: 1 hour, refresh: 30 days)
    const accessExpiresAt = new Date(Date.now() + 60 * 60 * 1000)
    const refreshExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

    // Store tokens
    const { error: tokenError } = await supabaseAdmin
      .from('oauth_access_tokens')
      .insert({
        access_token: accessToken,
        refresh_token: refreshToken,
        user_id: authCode.user_id,
        organization_id: authCode.organization_id,
        client_id: authCode.client_id,
        scope: authCode.scope,
        expires_at: accessExpiresAt.toISOString(),
        refresh_expires_at: refreshExpiresAt.toISOString(),
      })

    if (tokenError) {
      console.error('Failed to store tokens:', tokenError)
      return NextResponse.json(
        { error: 'server_error', error_description: 'Failed to generate tokens' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: 3600,
      token_type: 'Bearer',
      scope: authCode.scope,
    })
  } catch (error) {
    console.error('OAuth token error:', error)
    return NextResponse.json(
      { error: 'server_error', error_description: 'Internal server error' },
      { status: 500 }
    )
  }
}
