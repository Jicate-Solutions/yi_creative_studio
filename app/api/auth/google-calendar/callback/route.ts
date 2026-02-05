/**
 * Google Calendar OAuth Callback
 *
 * GET /api/auth/google-calendar/callback
 *
 * Handles the OAuth callback from Google, exchanges code for tokens,
 * stores encrypted tokens, and triggers initial sync.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  verifyOAuthState,
  exchangeCodeForTokens,
  getGoogleUserInfo,
  listCalendars,
  createPushChannel,
  syncEvents,
  getConnection,
} from '@/lib/services/google-calendar'
import { GOOGLE_CALENDAR_SOURCE_APP_ID } from '@/types/google-calendar.types'

const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI!

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  // Default redirect URL
  let redirectUrl = '/settings/integrations'

  try {
    // Handle OAuth errors from Google
    if (error) {
      console.error('OAuth error from Google:', error, errorDescription)
      const errorRedirect = new URL(redirectUrl, request.nextUrl.origin)
      errorRedirect.searchParams.set('google', 'error')
      errorRedirect.searchParams.set(
        'message',
        errorDescription || 'Access denied'
      )
      return NextResponse.redirect(errorRedirect)
    }

    // Validate required params
    if (!code || !state) {
      const errorRedirect = new URL(redirectUrl, request.nextUrl.origin)
      errorRedirect.searchParams.set('google', 'error')
      errorRedirect.searchParams.set('message', 'Missing authorization code')
      return NextResponse.redirect(errorRedirect)
    }

    // Verify state token
    const stateData = await verifyOAuthState(state)
    if (!stateData) {
      const errorRedirect = new URL(redirectUrl, request.nextUrl.origin)
      errorRedirect.searchParams.set('google', 'error')
      errorRedirect.searchParams.set('message', 'Invalid or expired state')
      return NextResponse.redirect(errorRedirect)
    }

    const { organizationId, redirectUrl: customRedirect } = stateData
    if (customRedirect) {
      redirectUrl = customRedirect
    }

    // Verify user is still authenticated
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      const errorRedirect = new URL(redirectUrl, request.nextUrl.origin)
      errorRedirect.searchParams.set('google', 'error')
      errorRedirect.searchParams.set('message', 'Session expired')
      return NextResponse.redirect(errorRedirect)
    }

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code, GOOGLE_REDIRECT_URI)

    // Verify we got a refresh token (required for long-term access)
    if (!tokens.refresh_token) {
      const errorRedirect = new URL(redirectUrl, request.nextUrl.origin)
      errorRedirect.searchParams.set('google', 'error')
      errorRedirect.searchParams.set(
        'message',
        'No refresh token received. Please revoke access in Google settings and try again.'
      )
      return NextResponse.redirect(errorRedirect)
    }

    // Get user info from Google
    const googleUser = await getGoogleUserInfo(tokens.access_token)

    // Get available calendars
    const calendars = await listCalendars(tokens.access_token)
    const primaryCalendar = calendars.find(cal => cal.primary) || calendars[0]

    if (!primaryCalendar) {
      const errorRedirect = new URL(redirectUrl, request.nextUrl.origin)
      errorRedirect.searchParams.set('google', 'error')
      errorRedirect.searchParams.set('message', 'No accessible calendars found')
      return NextResponse.redirect(errorRedirect)
    }

    // Calculate token expiry
    const tokenExpiry = new Date(Date.now() + tokens.expires_in * 1000)

    // Create connection record with encrypted tokens
    // Note: We use raw SQL to call the encryption functions
    const { data: connection, error: insertError } = await supabase
      .from('google_calendar_connections')
      .insert({
        organization_id: organizationId,
        google_account_email: googleUser.email,
        google_account_id: googleUser.id,
        calendar_id: primaryCalendar.id,
        calendar_name: primaryCalendar.summary,
        calendar_timezone: primaryCalendar.timeZone,
        connected_by: user.id,
        sync_status: 'pending',
        is_active: true,
        // Tokens will be encrypted via RPC call below
      })
      .select()
      .single()

    if (insertError) {
      console.error('Failed to create connection:', insertError)
      const errorRedirect = new URL(redirectUrl, request.nextUrl.origin)
      errorRedirect.searchParams.set('google', 'error')
      errorRedirect.searchParams.set('message', 'Failed to save connection')
      return NextResponse.redirect(errorRedirect)
    }

    // Store encrypted tokens via RPC
    const { error: tokenError } = await supabase.rpc(
      'store_google_calendar_tokens',
      {
        p_connection_id: connection.id,
        p_access_token: tokens.access_token,
        p_refresh_token: tokens.refresh_token,
        p_token_expiry: tokenExpiry.toISOString(),
        p_encryption_key: process.env.GOOGLE_CALENDAR_ENCRYPTION_KEY,
      }
    )

    if (tokenError) {
      // Clean up connection if token storage fails
      await supabase
        .from('google_calendar_connections')
        .delete()
        .eq('id', connection.id)

      console.error('Failed to store tokens:', tokenError)
      const errorRedirect = new URL(redirectUrl, request.nextUrl.origin)
      errorRedirect.searchParams.set('google', 'error')
      errorRedirect.searchParams.set('message', 'Failed to secure tokens')
      return NextResponse.redirect(errorRedirect)
    }

    // Create event_sources record for this connection
    await supabase.from('event_sources').upsert(
      {
        organization_id: organizationId,
        source_app_id: GOOGLE_CALENDAR_SOURCE_APP_ID,
        source_name: 'Google Calendar',
        name: 'Google Calendar',
        description: `Connected to ${googleUser.email}`,
        is_active: true,
      },
      {
        onConflict: 'organization_id,source_app_id',
      }
    )

    // Create push notification channel (async, don't block)
    createPushChannel(connection.id, primaryCalendar.id, organizationId).catch(
      err => {
        console.error('Failed to create push channel:', err)
      }
    )

    // Trigger initial sync (async, don't block redirect)
    const fullConnection = await getConnection(organizationId)
    if (fullConnection) {
      syncEvents(fullConnection, true).catch(err => {
        console.error('Initial sync failed:', err)
      })
    }

    // Redirect with success
    const successRedirect = new URL(redirectUrl, request.nextUrl.origin)
    successRedirect.searchParams.set('google', 'success')
    successRedirect.searchParams.set('calendar', primaryCalendar.summary)
    return NextResponse.redirect(successRedirect)
  } catch (error) {
    console.error('OAuth callback error:', error)
    const errorRedirect = new URL(redirectUrl, request.nextUrl.origin)
    errorRedirect.searchParams.set('google', 'error')
    errorRedirect.searchParams.set(
      'message',
      error instanceof Error ? error.message : 'Connection failed'
    )
    return NextResponse.redirect(errorRedirect)
  }
}
