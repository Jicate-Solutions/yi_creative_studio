/**
 * Google Calendar Sync
 *
 * POST /api/google-calendar/sync
 *
 * Manually trigger a sync of events from Google Calendar.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getConnection, syncEvents } from '@/lib/services/google-calendar'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { organization_id, full_sync = false } = body

    if (!organization_id) {
      return NextResponse.json(
        { error: 'organization_id is required' },
        { status: 400 }
      )
    }

    // Verify user is authenticated and member of organization
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is member of the organization
    const { data: membership, error: memberError } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organization_id)
      .eq('user_id', user.id)
      .single()

    if (memberError || !membership) {
      return NextResponse.json(
        { error: 'Not a member of this organization' },
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

    if (!connection.is_active) {
      return NextResponse.json(
        { error: 'Google Calendar connection is not active' },
        { status: 400 }
      )
    }

    // Perform sync
    const result = await syncEvents(connection, full_sync)

    if (!result.success) {
      return NextResponse.json(
        {
          error: 'Sync failed',
          message: result.error,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      events_added: result.eventsAdded,
      events_updated: result.eventsUpdated,
      events_deleted: result.eventsDeleted,
    })
  } catch (error) {
    console.error('Sync error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Sync failed' },
      { status: 500 }
    )
  }
}
