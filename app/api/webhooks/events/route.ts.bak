import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { ExternalEvent, DynamicFieldType } from '@/types/external-event.types'
import { validateExternalEvent } from '@/lib/services/external-event-mapper'

/**
 * Webhook endpoint for external event apps to push events to Yi Studio
 *
 * POST /api/webhooks/events
 *
 * Headers:
 *   X-Source-App-Id: 'myjkkn' | 'yi-connect' | etc.
 *   X-Webhook-Secret: [shared secret for verification]
 *
 * Body:
 *   {
 *     action: 'create' | 'update' | 'delete',
 *     event: ExternalEvent,
 *     organization_id?: string  // Optional, for multi-org support
 *   }
 *
 * @version 3.0 - Added dynamic fields support (captures unknown fields in custom_data)
 */

// Use service role client for webhook operations (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ============================================================================
// Dynamic Fields Support (v3.0)
// ============================================================================

/**
 * Known field keys that are stored in explicit columns
 * Any field NOT in this set will be stored in custom_data JSONB
 */
const KNOWN_FIELD_KEYS = new Set([
  'id',
  'name',
  'date',
  'startTime',
  'endTime',
  'venue',
  'venueAddress',
  'city',
  'venueLatitude',
  'venueLongitude',
  'venueCapacity',
  'isVirtual',
  'virtualMeetingLink',
  'description',
  'tagline',
  'eventType',
  'tags',
  'isFeatured',
  'speakers',
  'organizerName',
  'organizationId',
  'organizationName',
  'chapterName',
  'chapterLocation',
  'registrationUrl',
  'entryFee',
  'registrationDeadline',
  'registrationStartDate',
  'maxCapacity',
  'currentRegistrations',
  'waitlistEnabled',
  'allowGuests',
  'guestLimit',
  'targetAudience',
  'bannerImageUrl',
  'status',
  'createdAt',
  'updatedAt',
  // Internal fields to skip
  '_metadata',
  '_source',
  '_version',
  'customData',
  'customFieldMetadata',
])

/**
 * Normalize a field key to snake_case for consistent storage
 */
function normalizeFieldKey(key: string): string {
  return key
    .replace(/([A-Z])/g, '_$1')
    .toLowerCase()
    .replace(/^_/, '')
    .replace(/-/g, '_')
    .replace(/\s+/g, '_')
    .replace(/__+/g, '_')
}

/**
 * Convert a field key to a human-readable label
 */
function keyToLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/-/g, ' ')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
    .trim()
}

/**
 * Infer field type from value
 */
function inferFieldType(value: unknown): DynamicFieldType {
  if (value === null || value === undefined) return 'text'
  if (typeof value === 'number') return 'number'
  if (typeof value === 'boolean') return 'boolean'
  if (Array.isArray(value)) return 'select'
  if (typeof value === 'string') {
    // Check for date pattern (YYYY-MM-DD)
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return 'date'
    // Check for time pattern (HH:MM or HH:MM:SS)
    if (/^\d{2}:\d{2}(:\d{2})?$/.test(value)) return 'time'
    // Long text = textarea
    if (value.length > 200) return 'textarea'
  }
  return 'text'
}

/**
 * Extract known and unknown fields from an event payload
 */
function extractEventFields(
  event: Record<string, unknown>,
  sourceAppId: string
): {
  customData: Record<string, unknown>
  fieldMetadata: Record<string, { type: DynamicFieldType; label: string; source: string }>
} {
  const customData: Record<string, unknown> = {}
  const fieldMetadata: Record<
    string,
    { type: DynamicFieldType; label: string; source: string }
  > = {}

  for (const [key, value] of Object.entries(event)) {
    // Skip internal/metadata keys
    if (key.startsWith('_')) continue

    // Skip null/undefined/empty values
    if (value === null || value === undefined || value === '') continue

    // Skip known fields (they have explicit columns)
    if (KNOWN_FIELD_KEYS.has(key)) continue

    // Capture as custom field
    const normalizedKey = normalizeFieldKey(key)
    customData[normalizedKey] = value
    fieldMetadata[normalizedKey] = {
      type: inferFieldType(value),
      label: keyToLabel(key),
      source: sourceAppId,
    }
  }

  return { customData, fieldMetadata }
}

/**
 * Register dynamic fields in the registry (non-blocking)
 */
async function registerDynamicFields(
  customData: Record<string, unknown>,
  fieldMetadata: Record<string, { type: DynamicFieldType; label: string; source: string }>,
  sourceAppId: string,
  organizationId: string
): Promise<void> {
  if (Object.keys(customData).length === 0) return

  try {
    for (const fieldId of Object.keys(customData)) {
      const meta = fieldMetadata[fieldId]

      // Upsert field into registry
      const { error } = await supabaseAdmin.from('dynamic_field_registry').upsert(
        {
          field_id: fieldId,
          field_label: meta?.label || keyToLabel(fieldId),
          source_app_id: sourceAppId,
          organization_id: organizationId,
          field_type: meta?.type || 'text',
          category: 'custom',
          last_seen_at: new Date().toISOString(),
        },
        {
          onConflict: 'organization_id,source_app_id,field_id',
          ignoreDuplicates: false,
        }
      )

      if (!error) {
        // Increment usage count using RPC function
        await supabaseAdmin.rpc('increment_dynamic_field_usage', {
          p_org_id: organizationId,
          p_source_id: sourceAppId,
          p_field_id: fieldId,
        })
      }
    }

    console.log(
      `[Webhook] Registered ${Object.keys(customData).length} dynamic fields for ${sourceAppId}`
    )
  } catch (error) {
    console.error('[Webhook] Failed to register dynamic fields:', error)
    // Non-blocking - don't throw
  }
}

interface WebhookPayload {
  action: 'create' | 'update' | 'delete'
  event: ExternalEvent
  organization_id?: string
}

interface LogData {
  event_source_id?: string | null
  source_app_id: string
  organization_id?: string | null
  action: string
  external_event_id?: string | null
  event_name?: string | null
  status: 'success' | 'error' | 'validation_error'
  error_message?: string | null
  request_payload?: Record<string, unknown> | null
  response_payload?: Record<string, unknown> | null
  ip_address?: string | null
  user_agent?: string | null
  duration_ms?: number | null
}

async function logWebhookCall(logData: LogData) {
  try {
    await supabaseAdmin.from('webhook_logs').insert(logData)

    // Update event_source stats if we have an organization_id
    if (logData.organization_id && logData.source_app_id) {
      const { data: eventSource } = await supabaseAdmin
        .from('event_sources')
        .select('id, total_syncs, error_count')
        .eq('organization_id', logData.organization_id)
        .eq('source_app_id', logData.source_app_id)
        .single()

      if (eventSource) {
        const updates: Record<string, unknown> = {
          last_sync_at: new Date().toISOString(),
          total_syncs: (eventSource.total_syncs || 0) + 1,
        }

        if (logData.status === 'error' || logData.status === 'validation_error') {
          updates.error_count = (eventSource.error_count || 0) + 1
        }

        await supabaseAdmin
          .from('event_sources')
          .update(updates)
          .eq('id', eventSource.id)
      }
    }
  } catch (error) {
    console.error('[Webhook] Failed to log webhook call:', error)
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                    request.headers.get('x-real-ip') ||
                    'unknown'
  const userAgent = request.headers.get('user-agent') || null

  let sourceAppId = ''
  let action = ''
  let payload: WebhookPayload | null = null
  let targetOrgId: string | undefined

  try {
    // 1. Extract and validate headers
    sourceAppId = request.headers.get('X-Source-App-Id') || ''
    const webhookSecret = request.headers.get('X-Webhook-Secret')

    if (!sourceAppId) {
      const errorResponse = { success: false, error: 'Missing X-Source-App-Id header' }
      await logWebhookCall({
        source_app_id: 'unknown',
        action: 'unknown',
        status: 'validation_error',
        error_message: 'Missing X-Source-App-Id header',
        ip_address: ipAddress,
        user_agent: userAgent,
        duration_ms: Date.now() - startTime,
      })
      return NextResponse.json(errorResponse, { status: 400 })
    }

    // 2. Parse request body
    payload = await request.json()
    action = payload?.action || ''
    const event = payload?.event
    const organization_id = payload?.organization_id

    if (!action || !['create', 'update', 'delete'].includes(action)) {
      const errorResponse = { success: false, error: 'Invalid action. Must be create, update, or delete' }
      await logWebhookCall({
        source_app_id: sourceAppId,
        action: action || 'unknown',
        status: 'validation_error',
        error_message: 'Invalid action',
        request_payload: payload as unknown as Record<string, unknown>,
        ip_address: ipAddress,
        user_agent: userAgent,
        duration_ms: Date.now() - startTime,
      })
      return NextResponse.json(errorResponse, { status: 400 })
    }

    // 3. For delete action, only need event.id
    if (action === 'delete') {
      if (!event?.id) {
        const errorResponse = { success: false, error: 'Event ID required for delete action' }
        await logWebhookCall({
          source_app_id: sourceAppId,
          action: action,
          status: 'validation_error',
          error_message: 'Event ID required for delete action',
          request_payload: payload as unknown as Record<string, unknown>,
          ip_address: ipAddress,
          user_agent: userAgent,
          duration_ms: Date.now() - startTime,
        })
        return NextResponse.json(errorResponse, { status: 400 })
      }

      const { error: deleteError } = await supabaseAdmin
        .from('synced_events')
        .delete()
        .eq('external_id', event.id)
        .eq('source_app_id', sourceAppId)

      if (deleteError) {
        console.error('[Webhook] Delete error:', deleteError)
        const errorResponse = { success: false, error: 'Failed to delete event' }
        await logWebhookCall({
          source_app_id: sourceAppId,
          organization_id: organization_id,
          action: action,
          external_event_id: event.id,
          status: 'error',
          error_message: deleteError.message,
          request_payload: payload as unknown as Record<string, unknown>,
          response_payload: errorResponse,
          ip_address: ipAddress,
          user_agent: userAgent,
          duration_ms: Date.now() - startTime,
        })
        return NextResponse.json(errorResponse, { status: 500 })
      }

      const successResponse = {
        success: true,
        action: 'deleted',
        external_id: event.id,
      }

      await logWebhookCall({
        source_app_id: sourceAppId,
        organization_id: organization_id,
        action: action,
        external_event_id: event.id,
        status: 'success',
        request_payload: payload as unknown as Record<string, unknown>,
        response_payload: successResponse,
        ip_address: ipAddress,
        user_agent: userAgent,
        duration_ms: Date.now() - startTime,
      })

      return NextResponse.json(successResponse)
    }

    // 4. Validate event data for create/update
    if (!event) {
      const errorResponse = { success: false, error: 'Event data is required for create/update actions' }
      await logWebhookCall({
        source_app_id: sourceAppId,
        organization_id: organization_id,
        action: action,
        status: 'validation_error',
        error_message: 'Event data is required',
        request_payload: payload as unknown as Record<string, unknown>,
        response_payload: errorResponse,
        ip_address: ipAddress,
        user_agent: userAgent,
        duration_ms: Date.now() - startTime,
      })
      return NextResponse.json(errorResponse, { status: 400 })
    }

    const validation = validateExternalEvent(event)
    if (!validation.isValid) {
      const errorResponse = { success: false, error: 'Invalid event data', details: validation.errors }
      await logWebhookCall({
        source_app_id: sourceAppId,
        organization_id: organization_id,
        action: action,
        external_event_id: event?.id,
        event_name: event?.name,
        status: 'validation_error',
        error_message: `Validation errors: ${validation.errors.join(', ')}`,
        request_payload: payload as unknown as Record<string, unknown>,
        response_payload: errorResponse,
        ip_address: ipAddress,
        user_agent: userAgent,
        duration_ms: Date.now() - startTime,
      })
      return NextResponse.json(errorResponse, { status: 400 })
    }

    // 5. Verify webhook secret against event source config (if organization_id provided)
    let eventSourceId: string | null = null

    if (organization_id && webhookSecret) {
      const { data: eventSource } = await supabaseAdmin
        .from('event_sources')
        .select('id, webhook_secret, is_active')
        .eq('organization_id', organization_id)
        .eq('source_app_id', sourceAppId)
        .single()

      if (eventSource) {
        eventSourceId = eventSource.id

        if (!eventSource.is_active) {
          const errorResponse = { success: false, error: 'Event source is disabled' }
          await logWebhookCall({
            event_source_id: eventSourceId,
            source_app_id: sourceAppId,
            organization_id: organization_id,
            action: action,
            external_event_id: event?.id,
            event_name: event?.name,
            status: 'error',
            error_message: 'Event source is disabled',
            request_payload: payload as unknown as Record<string, unknown>,
            response_payload: errorResponse,
            ip_address: ipAddress,
            user_agent: userAgent,
            duration_ms: Date.now() - startTime,
          })
          return NextResponse.json(errorResponse, { status: 403 })
        }

        if (eventSource.webhook_secret && eventSource.webhook_secret !== webhookSecret) {
          const errorResponse = { success: false, error: 'Invalid webhook secret' }
          await logWebhookCall({
            event_source_id: eventSourceId,
            source_app_id: sourceAppId,
            organization_id: organization_id,
            action: action,
            external_event_id: event?.id,
            event_name: event?.name,
            status: 'error',
            error_message: 'Invalid webhook secret',
            ip_address: ipAddress,
            user_agent: userAgent,
            duration_ms: Date.now() - startTime,
          })
          return NextResponse.json(errorResponse, { status: 401 })
        }
      }
    }

    // 6. Determine organization_id
    // Priority: explicit parameter > event.organizationId
    targetOrgId = organization_id || event.organizationId

    if (!targetOrgId) {
      const errorResponse = { success: false, error: 'Organization ID required (via organization_id param or event.organizationId)' }
      await logWebhookCall({
        source_app_id: sourceAppId,
        action: action,
        external_event_id: event?.id,
        event_name: event?.name,
        status: 'validation_error',
        error_message: 'Organization ID required',
        request_payload: payload as unknown as Record<string, unknown>,
        response_payload: errorResponse,
        ip_address: ipAddress,
        user_agent: userAgent,
        duration_ms: Date.now() - startTime,
      })
      return NextResponse.json(errorResponse, { status: 400 })
    }

    // 7. Extract dynamic fields (v3.0)
    // Any field NOT in KNOWN_FIELD_KEYS will be stored in custom_data
    const { customData, fieldMetadata } = extractEventFields(
      event as unknown as Record<string, unknown>,
      sourceAppId
    )

    // Log if dynamic fields were found
    if (Object.keys(customData).length > 0) {
      console.log(
        `[Webhook] Found ${Object.keys(customData).length} dynamic fields:`,
        Object.keys(customData)
      )
    }

    // 8. Prepare synced event data (including v2.0 + v3.0 fields)
    const syncedEventData = {
      external_id: event.id,
      source_app_id: sourceAppId,
      organization_id: targetOrgId,
      event_name: event.name,
      event_date: event.date,
      event_time: event.startTime || null,
      end_time: event.endTime || null,
      venue: event.venue || null,
      venue_address: event.venueAddress || null,
      city: event.city || null,
      // v2.0: Venue GPS coordinates
      venue_latitude: event.venueLatitude || null,
      venue_longitude: event.venueLongitude || null,
      venue_capacity: event.venueCapacity || null,
      // v2.0: Virtual event support
      is_virtual: event.isVirtual ?? false,
      virtual_meeting_link: event.virtualMeetingLink || null,
      description: event.description || null,
      tagline: event.tagline || null,
      event_type: event.eventType || null,
      // v2.0: Tags and featured flag
      tags: event.tags || [],
      is_featured: event.isFeatured ?? false,
      speakers: event.speakers || [],
      organizer_name: event.organizerName || null,
      // v2.0: Chapter info
      chapter_name: event.chapterName || null,
      chapter_location: event.chapterLocation || null,
      registration_url: event.registrationUrl || null,
      entry_fee: event.entryFee || null,
      // v2.0: Registration capacity fields
      registration_start_date: event.registrationStartDate || null,
      registration_deadline: event.registrationDeadline || null,
      max_capacity: event.maxCapacity || null,
      current_registrations: event.currentRegistrations || 0,
      waitlist_enabled: event.waitlistEnabled ?? false,
      // v2.0: Guest policy
      allow_guests: event.allowGuests ?? true,
      guest_limit: event.guestLimit || null,
      target_audience: event.targetAudience || null,
      banner_image_url: event.bannerImageUrl || null,
      status: event.status || 'published',
      source_created_at: event.createdAt || null,
      source_updated_at: event.updatedAt || null,
      synced_at: new Date().toISOString(),
      // v3.0: Dynamic fields support
      custom_data: customData,
      field_metadata: fieldMetadata,
    }

    // 9. Upsert the event (create or update based on external_id + source_app_id)
    const { data: syncedEvent, error: upsertError } = await supabaseAdmin
      .from('synced_events')
      .upsert(syncedEventData, {
        onConflict: 'external_id,source_app_id',
        ignoreDuplicates: false, // Update if exists
      })
      .select('id, external_id, event_name, synced_at')
      .single()

    if (upsertError) {
      console.error('[Webhook] Upsert error:', upsertError)
      const errorResponse = { success: false, error: 'Failed to sync event', details: upsertError.message }
      await logWebhookCall({
        event_source_id: eventSourceId,
        source_app_id: sourceAppId,
        organization_id: targetOrgId,
        action: action,
        external_event_id: event.id,
        event_name: event.name,
        status: 'error',
        error_message: upsertError.message,
        request_payload: payload as unknown as Record<string, unknown>,
        response_payload: errorResponse,
        ip_address: ipAddress,
        user_agent: userAgent,
        duration_ms: Date.now() - startTime,
      })
      return NextResponse.json(errorResponse, { status: 500 })
    }

    // 10. Register dynamic fields in registry (non-blocking, async)
    if (Object.keys(customData).length > 0) {
      registerDynamicFields(customData, fieldMetadata, sourceAppId, targetOrgId).catch((err) =>
        console.error('[Webhook] Failed to register dynamic fields:', err)
      )
    }

    // 11. Return success response
    const successResponse = {
      success: true,
      action: action === 'create' ? 'created' : 'updated',
      synced_event: {
        id: syncedEvent.id,
        external_id: syncedEvent.external_id,
        name: syncedEvent.event_name,
        synced_at: syncedEvent.synced_at,
      },
      // v3.0: Include dynamic fields info in response
      dynamic_fields: Object.keys(customData).length > 0 ? {
        count: Object.keys(customData).length,
        fields: Object.keys(customData),
      } : undefined,
    }

    await logWebhookCall({
      event_source_id: eventSourceId,
      source_app_id: sourceAppId,
      organization_id: targetOrgId,
      action: action,
      external_event_id: event.id,
      event_name: event.name,
      status: 'success',
      request_payload: payload as unknown as Record<string, unknown>,
      response_payload: successResponse,
      ip_address: ipAddress,
      user_agent: userAgent,
      duration_ms: Date.now() - startTime,
    })

    return NextResponse.json(successResponse)
  } catch (error) {
    console.error('[Webhook] Unexpected error:', error)
    const errorResponse = { success: false, error: 'Internal server error' }
    await logWebhookCall({
      source_app_id: sourceAppId || 'unknown',
      organization_id: targetOrgId,
      action: action || 'unknown',
      status: 'error',
      error_message: error instanceof Error ? error.message : 'Unknown error',
      request_payload: payload as unknown as Record<string, unknown>,
      response_payload: errorResponse,
      ip_address: ipAddress,
      user_agent: userAgent,
      duration_ms: Date.now() - startTime,
    })
    return NextResponse.json(errorResponse, { status: 500 })
  }
}

/**
 * Health check for webhook endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: '/api/webhooks/events',
    methods: ['POST'],
    headers: {
      required: ['X-Source-App-Id'],
      optional: ['X-Webhook-Secret'],
    },
    actions: ['create', 'update', 'delete'],
  })
}
