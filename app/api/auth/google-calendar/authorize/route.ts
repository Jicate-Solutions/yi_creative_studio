/**
 * Google Calendar OAuth Authorization
 *
 * GET /api/auth/google-calendar/authorize
 *
 * Initiates the Google OAuth flow for calendar access.
 * User must be authenticated and be an admin of the organization.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  generateOAuthState,
  getAuthorizationUrl,
} from '@/lib/services/google-calendar'

export async function GET(request: NextRequest) {
  try {
    // Get organization_id from query params
    const searchParams = request.nextUrl.searchParams
    const organizationId = searchParams.get('organization_id')
    const redirectUrl = searchParams.get('redirect_url')

    if (!organizationId) {
      return NextResponse.json(
        { error: 'organization_id is required' },
        { status: 400 }
      )
    }

    // Verify user is authenticated
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is admin of the organization
    const { data: membership, error: memberError } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single()

    if (memberError || !membership || membership.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only organization admins can connect Google Calendar' },
        { status: 403 }
      )
    }

    // Check if organization already has a connection
    const { data: existingConnection } = await supabase
      .from('google_calendar_connections')
      .select('id')
      .eq('organization_id', organizationId)
      .single()

    if (existingConnection) {
      // Redirect back with error - already connected
      const errorUrl = new URL(
        redirectUrl || '/settings/integrations',
        request.nextUrl.origin
      )
      errorUrl.searchParams.set('google', 'already_connected')
      return NextResponse.redirect(errorUrl)
    }

    // Generate signed state token
    const state = await generateOAuthState({
      organizationId,
      redirectUrl: redirectUrl || undefined,
    })

    // Get authorization URL
    const authUrl = getAuthorizationUrl(state)

    // Redirect to Google OAuth
    return NextResponse.redirect(authUrl)
  } catch (error) {
    console.error('OAuth authorization error:', error)
    return NextResponse.json(
      { error: 'Failed to initiate OAuth flow' },
      { status: 500 }
    )
  }
}
