import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET - List discovered fields for a source
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

  // Get discovered fields for this source
  const { data: fields, error } = await supabase
    .from('dynamic_field_registry')
    .select('*')
    .eq('organization_id', source.organization_id)
    .eq('source_app_id', source.source_app_id)
    .order('usage_count', { ascending: false })

  if (error) {
    console.error('Error fetching fields:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    fields: fields || [],
    source_app_id: source.source_app_id,
  })
}

// PUT - Update field configuration
export async function PUT(
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
  const { field_id, updates } = body

  if (!field_id || !updates) {
    return NextResponse.json(
      { error: 'Missing required fields: field_id, updates' },
      { status: 400 }
    )
  }

  // Update field configuration
  const { data: field, error } = await supabase
    .from('dynamic_field_registry')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('field_id', field_id)
    .eq('organization_id', source.organization_id)
    .eq('source_app_id', source.source_app_id)
    .select('*')
    .single()

  if (error) {
    console.error('Error updating field:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    field,
  })
}
