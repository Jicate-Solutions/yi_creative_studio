/**
 * Google Calendar List
 *
 * GET /api/google-calendar/calendars?organization_id=xxx
 *
 * Lists available calendars from the connected Google account.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  getConnection,
  listCalendars,
} from '@/lib/services/google-calendar'
import { ensureValidAccessToken } from '@/lib/services/google-calendar/token-manager'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const organizationId = searchParams.get('organization_id')

    if (!organizationId) {
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
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single()

    if (memberError || !membership || membership.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only organization admins can list calendars' },
        { status: 403 }
      )
    }

    // Get the connection
    const connection = await getConnection(organizationId)

    if (!connection) {
      return NextResponse.json(
        { error: 'No Google Calendar connection found' },
        { status: 404 }
      )
    }

    // Get valid access token
    const accessToken = await ensureValidAccessToken(connection.id)

    // List calendars from Google
    const calendars = await listCalendars(accessToken)

    // Format response
    const formattedCalendars = calendars.map(cal => ({
      id: cal.id,
      name: cal.summary,
      description: cal.description,
      timeZone: cal.timeZone,
      primary: cal.primary || false,
      accessRole: cal.accessRole,
      selected: cal.id === connection.calendar_id,
    }))

    return NextResponse.json({
      calendars: formattedCalendars,
      current_calendar_id: connection.calendar_id,
    })
  } catch (error) {
    console.error('List calendars error:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to list calendars',
      },
      { status: 500 }
    )
  }
}
