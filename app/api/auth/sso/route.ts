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
import { createClient } from '@supabase/supabase-js'
import { verifySSOToken } from '@/lib/auth/sso-token'
import { provisionUserFromSSO } from '@/lib/auth/sso-provisioning'

// Create admin client with service role for user management
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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

    console.log('[SSO] Token verified for:', payload.email)

    // 2. Create auth.users record FIRST (required for user_profiles foreign key)
    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin.auth.admin.getUserById(payload.sub)

    let authUserId = existingUser?.user?.id

    if (!authUserId) {
      console.log('[SSO] Creating new auth user for:', payload.email)

      // Create user in auth.users using admin API
      const { data: newUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
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
        console.error('[SSO] Failed to create auth user:', createUserError)

        // Check if it's a duplicate email error - try to find existing user
        if (createUserError.message?.includes('already been registered')) {
          const { data: userByEmail } = await supabaseAdmin.auth.admin.listUsers()
          const existingByEmail = userByEmail?.users?.find(u => u.email === payload.email)
          if (existingByEmail) {
            authUserId = existingByEmail.id
            console.log('[SSO] Found existing user by email:', authUserId)
          }
        }

        if (!authUserId) {
          return NextResponse.redirect(
            new URL(`/auth/error?message=${encodeURIComponent('Failed to create user account')}`, request.url)
          )
        }
      } else {
        authUserId = newUser?.user?.id || payload.sub
        console.log('[SSO] Auth user created:', authUserId)
      }
    } else {
      console.log('[SSO] Auth user already exists:', authUserId)
    }

    // 3. NOW provision user_profiles and organizations (after auth.users exists)
    // IMPORTANT: Use the resolved authUserId (may differ from Yi Connect ID for existing users)
    const provisionResult = await provisionUserFromSSO(payload, authUserId)

    if (!provisionResult.success) {
      console.error('[SSO] Provisioning failed:', provisionResult.error)
      return NextResponse.redirect(
        new URL(
          `/auth/error?message=${encodeURIComponent(provisionResult.error || 'User provisioning failed')}`,
          request.url
        )
      )
    }

    console.log('[SSO] Provisioning successful, creating session...')

    // 4. Generate a magic link to get the hashed_token
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: payload.email,
    })

    if (linkError || !linkData?.properties?.hashed_token) {
      console.error('[SSO] Failed to generate magic link:', linkError)
      return NextResponse.redirect(
        new URL(`/auth/error?message=${encodeURIComponent('Failed to create session')}`, request.url)
      )
    }

    console.log('[SSO] Magic link generated, creating session server-side...')

    // 5. Use verifyOtp with the hashed_token to create session SERVER-SIDE
    // This avoids cross-origin cookie issues (magic links set cookies on .supabase.co)
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    const { data: otpData, error: otpError } = await supabase.auth.verifyOtp({
      token_hash: linkData.properties.hashed_token,
      type: 'magiclink',
    })

    if (otpError || !otpData.session) {
      console.error('[SSO] verifyOtp failed:', otpError)
      return NextResponse.redirect(
        new URL(`/auth/error?message=${encodeURIComponent('Session creation failed')}`, request.url)
      )
    }

    console.log('[SSO] Session created successfully for:', otpData.user?.email)

    // 5.5. CRITICAL: ALWAYS set force_refresh for SSO logins to ensure AuthProvider fetches latest memberships
    // This bypasses the optimization that skips fetchUserData when cached data exists
    console.log('[SSO] Setting force_refresh flag for SSO login...')

    const ssoDataToStore: any = {
      force_refresh: true,  // ALWAYS true for SSO logins (not conditional on event_data)
      synced_at: new Date().toISOString(),
    }

    // Add event data if present (optional - for instant event loading)
    if (payload.event_data) {
      console.log('[SSO] Also storing event data in session metadata...')
      ssoDataToStore.event_data = payload.event_data
      ssoDataToStore.event_id = payload.event_id
    }

    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        sso_data: ssoDataToStore
      }
    })

    if (updateError) {
      console.error('[SSO] Failed to store SSO data in session:', updateError)
    } else {
      console.log('[SSO] SSO data stored in session metadata ✓')
      console.log('[SSO] Force refresh flag set - AuthProvider will refresh memberships')
      if (payload.event_data) {
        console.log('[SSO] Event data also stored in session')
      }
    }

    // 6. Build final redirect URL with SSO login flag
    let finalRedirect = payload.redirect_to || '/dashboard'

    // Build URL parameters
    const urlParams = new URLSearchParams()
    urlParams.set('sso_login', 'true')  // CRITICAL: Force membership refresh

    // CRITICAL: Pass SSO organization ID directly in URL
    // This bypasses localStorage race condition and ensures correct org is used
    if (provisionResult.primaryOrganizationId) {
      urlParams.set('sso_org', provisionResult.primaryOrganizationId)
      console.log('[SSO] Including sso_org in URL:', provisionResult.primaryOrganizationId)
    }

    if (payload.event_id && !finalRedirect.includes('eventId')) {
      urlParams.set('eventId', payload.event_id)
    }

    // Ensure path starts with /
    let redirectPath = finalRedirect.startsWith('/') ? finalRedirect : `/${finalRedirect}`

    // Fix common redirect path issues
    // Yi Connect may send "/dashboard/create" but the actual route is "/create"
    // because "(dashboard)" is a Next.js route group (parentheses = not part of URL)
    if (redirectPath.startsWith('/dashboard/create')) {
      redirectPath = redirectPath.replace('/dashboard/create', '/create')
      console.log('[SSO] Fixed redirect path from /dashboard/create to /create')
    }

    // Append SSO flag to URL
    const separator = redirectPath.includes('?') ? '&' : '?'
    redirectPath = `${redirectPath}${separator}${urlParams.toString()}`

    console.log('[SSO] Redirecting to:', redirectPath)
    console.log('[SSO] URL includes sso_login flag - AuthProvider will force membership refresh')
    return NextResponse.redirect(new URL(redirectPath, request.url))
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
