import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { ExternalEvent } from '@/types/external-event.types'

/**
 * API endpoint to fetch synced events from local database
 *
 * GET /api/external-events
 *   ?organization_id={uuid}     - Required: Filter by organization
 *   ?event_id={uuid}            - Optional: Fetch single event by synced_events.id
 *   ?external_id={string}       - Optional: Fetch by original external ID
 *   ?source={string}            - Optional: Filter by source app (myjkkn, yi-connect)
 *   ?status={string}            - Optional: Filter by status (published, draft, etc.)
 *   ?month={YYYY-MM}            - Optional: Filter by month
 *   ?start_date={YYYY-MM-DD}    - Optional: Events on or after this date
 *   ?end_date={YYYY-MM-DD}      - Optional: Events on or before this date
 *   ?limit={number}             - Optional: Limit results (default: 100)
 *   ?offset={number}            - Optional: Pagination offset
 */

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    console.log('[External Events] Auth check:', { userId: user?.id, email: user?.email, authError: authError?.message })

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organization_id')
    const eventId = searchParams.get('event_id')
    const externalId = searchParams.get('external_id')
    const source = searchParams.get('source')
    const status = searchParams.get('status')
    const month = searchParams.get('month')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const limit = parseInt(searchParams.get('limit') || '100', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    // Organization ID is required
    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'organization_id is required' },
        { status: 400 }
      )
    }

    // Verify user has access to this organization
    const { data: membership, error: membershipError } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single()

    console.log('[External Events] Membership check:', {
      organizationId,
      userId: user.id,
      membership,
      membershipError: membershipError?.message
    })

    if (!membership) {
      return NextResponse.json(
        { success: false, error: 'Not a member of this organization' },
        { status: 403 }
      )
    }

    // Build query using admin client to bypass RLS
    // (We already verified membership above, so this is safe)
    // Note: synced_events table needs to be added to database types
    const adminClient = createAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (adminClient as any)
      .from('synced_events')
      .select('*', { count: 'exact' })
      .eq('organization_id', organizationId)

    // Single event lookup by ID
    if (eventId) {
      query = query.eq('id', eventId)
    }

    // Single event lookup by external ID
    if (externalId) {
      query = query.eq('external_id', externalId)
    }

    // Filter by source app
    if (source) {
      query = query.eq('source_app_id', source)
    }

    // Filter by status (default: published only)
    // EXCEPTION: When fetching specific event by external_id, allow any status
    // (user clicked "Create Poster" for THIS event, show it regardless of status)
    if (status) {
      query = query.eq('status', status)
    } else if (!externalId) {
      // Only apply default 'published' filter when listing events, not when fetching specific event
      query = query.eq('status', 'published')
    }

    // Filter by month (YYYY-MM format)
    if (month) {
      const [year, monthNum] = month.split('-').map(Number)
      // Use UTC dates to avoid timezone issues
      const monthStart = `${year}-${String(monthNum).padStart(2, '0')}-01`
      // Get last day of month: create first day of next month, then subtract 1 day
      const lastDay = new Date(Date.UTC(year, monthNum, 0)).getUTCDate()
      const monthEnd = `${year}-${String(monthNum).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
      query = query.gte('event_date', monthStart).lte('event_date', monthEnd)
    }

    // Filter by date range
    if (startDate) {
      query = query.gte('event_date', startDate)
    }
    if (endDate) {
      query = query.lte('event_date', endDate)
    }

    // Order by date (upcoming first)
    query = query.order('event_date', { ascending: true }).order('event_time', { ascending: true })

    // Pagination
    query = query.range(offset, offset + limit - 1)

    // Execute query
    const { data: events, error: queryError, count } = await query

    console.log('[External Events] Query result:', {
      organizationId,
      month,
      eventCount: events?.length || 0,
      totalCount: count,
      queryError: queryError?.message
    })

    if (queryError) {
      console.error('[External Events] Query error:', queryError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch events' },
        { status: 500 }
      )
    }

    // Transform to ExternalEvent format
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const transformedEvents: ExternalEvent[] = (events || []).map((event: any) => ({
      id: event.external_id,
      name: event.event_name,
      date: event.event_date,
      startTime: event.event_time || undefined,
      endTime: event.end_time || undefined,
      venue: event.venue || undefined,
      venueAddress: event.venue_address || undefined,
      city: event.city || undefined,
      description: event.description || undefined,
      tagline: event.tagline || undefined,
      eventType: event.event_type || undefined,
      speakers: event.speakers || [],
      organizerName: event.organizer_name || undefined,
      organizationId: event.organization_id,
      registrationUrl: event.registration_url || undefined,
      entryFee: event.entry_fee || undefined,
      targetAudience: event.target_audience || undefined,
      bannerImageUrl: event.banner_image_url || undefined,
      status: event.status,
      createdAt: event.source_created_at || event.synced_at,
      updatedAt: event.source_updated_at || event.synced_at,
      // Dynamic fields (v3.0)
      customData: event.custom_data || {},
      customFieldMetadata: event.field_metadata || {},
      // Include synced metadata for UI
      _syncedEventId: event.id,
      _sourceAppId: event.source_app_id,
      _syncedAt: event.synced_at,
    }))

    // Single event response
    if (eventId || externalId) {
      if (transformedEvents.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Event not found' },
          { status: 404 }
        )
      }
      return NextResponse.json({
        success: true,
        event: transformedEvents[0],
      })
    }

    // List response with pagination
    return NextResponse.json({
      success: true,
      events: transformedEvents,
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit,
      },
    })
  } catch (error) {
    console.error('[External Events] Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
