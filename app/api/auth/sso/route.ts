/**
 * Yi Connect SSO Callback Endpoint
 *
 * Handles SSO authentication from Yi Connect.
 * Validates the JWT token, provisions user/organizations, and creates a session.
 *
 * Flow:
 * 1. Yi Connect redirects here with ?token=<JWT>
 * 2. We verify the token using Yi Connect's public key
 * 3. We provision the user and their organizations
 * 4. We create a Supabase session
 * 5. We redirect to the dashboard (or specified redirect_to path)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifySSOToken, getYiConnectLoginUrl } from '@/lib/auth/sso-token'
import { provisionUserFromSSO } from '@/lib/auth/sso-provisioning'

/**
 * Handle SSO callback (GET request from Yi Connect redirect)
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const token = searchParams.get('token')
  const errorParam = searchParams.get('error')

  // Handle error from Yi Connect
  if (errorParam) {
    console.error('SSO error from Yi Connect:', errorParam)
    return NextResponse.redirect(
      new URL(`/auth/error?message=${encodeURIComponent(errorParam)}`, request.url)
    )
  }

  // Check for token
  if (!token) {
    console.error('SSO callback: No token provided')
    return NextResponse.redirect(
      new URL('/auth/error?message=No+SSO+token+provided', request.url)
    )
  }

  try {
    // 1. Verify the token
    const verificationResult = await verifySSOToken(token)

    if (!verificationResult.success || !verificationResult.payload) {
      console.error('SSO token verification failed:', verificationResult.error)
      return NextResponse.redirect(
        new URL(
          `/auth/error?message=${encodeURIComponent(verificationResult.error || 'Token verification failed')}`,
          request.url
        )
      )
    }

    const payload = verificationResult.payload

    // 2. Provision user and organizations
    const provisionResult = await provisionUserFromSSO(payload)

    if (!provisionResult.success) {
      console.error('SSO provisioning failed:', provisionResult.error)
      return NextResponse.redirect(
        new URL(
          `/auth/error?message=${encodeURIComponent(provisionResult.error || 'User provisioning failed')}`,
          request.url
        )
      )
    }

    // 3. Create Supabase session
    // Since Yi Connect and Yi Creative use separate Supabase projects,
    // we need to create a session for this user in Yi Creative's Supabase.
    //
    // Option 1: Use Supabase Admin API to create a session
    // Option 2: Use a custom session mechanism
    //
    // For now, we'll use the admin API to sign in the user
    const supabase = await createClient()

    // Check if user exists in auth.users
    // If not, we need to create them using the admin API
    const { data: existingUser, error: userCheckError } = await supabase.auth.admin.getUserById(
      payload.sub
    )

    if (!existingUser?.user) {
      // Create user in auth.users using admin API
      const { data: newUser, error: createUserError } = await supabase.auth.admin.createUser({
        id: payload.sub,
        email: payload.email,
        email_confirm: true, // Auto-confirm since Yi Connect already verified
        user_metadata: {
          full_name: payload.name,
          avatar_url: payload.avatar_url,
          yi_connect_user_id: payload.sub,
        },
      })

      if (createUserError) {
        console.error('Failed to create auth user:', createUserError)
        // Try to continue anyway - user might already exist
      }
    }

    // Generate a magic link or session for the user
    // Using generateLink to create a session-establishing link
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: payload.email,
      options: {
        redirectTo: `${request.nextUrl.origin}/auth/callback`,
      },
    })

    if (linkError || !linkData?.properties?.action_link) {
      console.error('Failed to generate session link:', linkError)
      // Fallback: redirect to dashboard and let middleware handle auth
      const redirectTo = payload.redirect_to || '/dashboard'
      return NextResponse.redirect(new URL(redirectTo, request.url))
    }

    // Extract token from magic link and redirect to callback
    const magicLinkUrl = new URL(linkData.properties.action_link)
    const tokenHash = magicLinkUrl.hash || magicLinkUrl.searchParams.get('token_hash')

    // Redirect through the callback to establish session
    const callbackUrl = new URL('/auth/callback', request.url)
    if (tokenHash) {
      callbackUrl.hash = tokenHash.startsWith('#') ? tokenHash : `#${tokenHash}`
    }
    callbackUrl.searchParams.set('redirect_to', payload.redirect_to || '/dashboard')

    // If there's an event_id, include it for the creative flow
    if (payload.event_id) {
      callbackUrl.searchParams.set('event_id', payload.event_id)
    }

    return NextResponse.redirect(callbackUrl)
  } catch (error) {
    console.error('SSO callback error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown SSO error'
    return NextResponse.redirect(
      new URL(`/auth/error?message=${encodeURIComponent(errorMessage)}`, request.url)
    )
  }
}

/**
 * Handle SSO callback (POST request - alternative for form submissions)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const token = body.token

    if (!token) {
      return NextResponse.json(
        { error: 'No SSO token provided' },
        { status: 400 }
      )
    }

    // Verify the token
    const verificationResult = await verifySSOToken(token)

    if (!verificationResult.success) {
      return NextResponse.json(
        { error: verificationResult.error || 'Token verification failed' },
        { status: 401 }
      )
    }

    // Provision user
    const provisionResult = await provisionUserFromSSO(verificationResult.payload!)

    if (!provisionResult.success) {
      return NextResponse.json(
        { error: provisionResult.error || 'User provisioning failed' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      userId: provisionResult.userId,
      organizationId: provisionResult.primaryOrganizationId,
      redirectTo: verificationResult.payload!.redirect_to || '/dashboard',
    })
  } catch (error) {
    console.error('SSO POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
