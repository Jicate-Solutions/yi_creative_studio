import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET - Get required fields for a source
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sourceId: string }> }
) {
  const supabase = await createClient()
  const { sourceId } = await params

  // Verify authentication
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get the event source
  const { data: source } = (await supabase
    .from('event_sources' as any)
    .select('organization_id, source_app_id, required_fields')
    .eq('id', sourceId)
    .single()) as { data: { organization_id: string; source_app_id: string; required_fields: string[] } | null }

  if (!source) {
    return NextResponse.json({ error: 'Event source not found' }, { status: 404 })
  }

  // Verify user is member of this organization
  const { data: membership } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', source.organization_id)
    .eq('user_id', user.id)
    .single()

  if (!membership) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return NextResponse.json({
    success: true,
    required_fields: source.required_fields || [],
  })
}

// POST - Set required fields for a source
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sourceId: string }> }
) {
  const supabase = await createClient()
  const { sourceId } = await params

  // Verify authentication
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get the event source to verify organization
  const { data: source } = (await supabase
    .from('event_sources' as any)
    .select('organization_id, source_app_id')
    .eq('id', sourceId)
    .single()) as { data: { organization_id: string; source_app_id: string } | null }

  if (!source) {
    return NextResponse.json({ error: 'Event source not found' }, { status: 404 })
  }

  // Verify user is admin of this organization
  const { data: membership } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', source.organization_id)
    .eq('user_id', user.id)
    .single()

  if (!membership || membership.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
  }

  // Parse request body
  const body = await request.json()
  const { required_fields } = body

  if (!Array.isArray(required_fields)) {
    return NextResponse.json(
      { error: 'required_fields must be an array of field names' },
      { status: 400 }
    )
  }

  // Update event source with required fields
  const { error: sourceError } = await supabase
    .from('event_sources' as any)
    .update({
      required_fields,
      updated_at: new Date().toISOString(),
    })
    .eq('id', sourceId)

  if (sourceError) {
    console.error('Error updating required fields:', sourceError)
    return NextResponse.json({ error: sourceError.message }, { status: 500 })
  }

  // Also update is_required flag in dynamic_field_registry
  // First, set all to not required
  await supabase
    .from('dynamic_field_registry')
    .update({ is_required: false })
    .eq('organization_id', source.organization_id)
    .eq('source_app_id', source.source_app_id)

  // Then set the required ones
  if (required_fields.length > 0) {
    await supabase
      .from('dynamic_field_registry')
      .update({ is_required: true })
      .eq('organization_id', source.organization_id)
      .eq('source_app_id', source.source_app_id)
      .in('field_id', required_fields)
  }

  return NextResponse.json({
    success: true,
    required_fields,
  })
}
