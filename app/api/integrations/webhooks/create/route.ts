import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  // Verify authentication
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Parse request body
  const body = await request.json()
  const { name, source_app_id, organization_id, description, is_active } = body

  // Validate required fields
  if (!name || !source_app_id || !organization_id) {
    return NextResponse.json(
      { error: 'Missing required fields: name, source_app_id, organization_id' },
      { status: 400 }
    )
  }

  // Verify user is admin of this organization
  const { data: membership } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', organization_id)
    .eq('user_id', user.id)
    .single()

  if (!membership || membership.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
  }

  // Check for duplicate source_app_id for this organization
  const { data: existing } = await supabase
    .from('event_sources' as any)
    .select('id')
    .eq('organization_id', organization_id)
    .eq('source_app_id', source_app_id)
    .single()

  if (existing) {
    return NextResponse.json(
      { error: `A webhook source with source_app_id "${source_app_id}" already exists` },
      { status: 409 }
    )
  }

  // Generate webhook secret using database function
  const { data: secretData } = await (supabase as any).rpc('generate_webhook_secret')
  const webhook_secret = secretData || ''

  // Create event source (RLS policy ensures user can only create for their org)
  const { data: source, error } = (await supabase
    .from('event_sources' as any)
    .insert({
      name,
      source_name: name, // Required field
      source_app_id,
      organization_id,
      description: description || null,
      is_active: is_active ?? true,
      webhook_secret,
      created_by: user.id,
    })
    .select('*')
    .single()) as { data: Record<string, any> | null; error: any }

  if (error || !source) {
    console.error('Error creating event source:', error)
    return NextResponse.json({ error: error?.message || 'Failed to create source' }, { status: 500 })
  }

  // Get webhook URL
  const webhookUrl = `${request.nextUrl.origin}/api/webhooks/events`

  return NextResponse.json({
    success: true,
    source: {
      ...source,
      webhook_secret, // Full secret shown only on creation!
      webhook_url: webhookUrl,
    },
  })
}
