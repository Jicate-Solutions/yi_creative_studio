/**
 * Google Calendar Disconnect
 *
 * POST /api/google-calendar/disconnect
 *
 * Disconnects the Google Calendar integration.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  getConnection,
  deleteConnection,
} from '@/lib/services/google-calendar'
import { revokeToken, getDecryptedTokens } from '@/lib/services/google-calendar/token-manager'
import { GOOGLE_CALENDAR_SOURCE_APP_ID } from '@/types/google-calendar.types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { organization_id, delete_events = false } = body

    if (!organization_id) {
      return NextResponse.json(
        { error: 'organization_id is required' },
        { status: 400 }
      )
    }

    // Verify user is authenticated and is admin
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
      .eq('organization_id', organization_id)
      .eq('user_id', user.id)
      .single()

    if (memberError || !membership || membership.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only organization admins can disconnect Google Calendar' },
        { status: 403 }
      )
    }

    // Get the connection
    const connection = await getConnection(organization_id)

    if (!connection) {
      return NextResponse.json(
        { error: 'No Google Calendar connection found' },
        { status: 404 }
      )
    }

    // Try to revoke the Google token
    try {
      const tokens = await getDecryptedTokens(connection.id)
      if (tokens) {
        await revokeToken(tokens.accessToken)
      }
    } catch (error) {
      console.warn('Failed to revoke token:', error)
      // Continue with disconnection even if revoke fails
    }

    // Delete the event_sources record
    await supabase
      .from('event_sources')
      .delete()
      .eq('organization_id', organization_id)
      .eq('source_app_id', GOOGLE_CALENDAR_SOURCE_APP_ID)

    // Delete the connection (and optionally events)
    await deleteConnection(connection.id, delete_events)

    return NextResponse.json({
      success: true,
      message: 'Google Calendar disconnected successfully',
      events_deleted: delete_events,
    })
  } catch (error) {
    console.error('Disconnect error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Disconnect failed',
      },
      { status: 500 }
    )
  }
}
