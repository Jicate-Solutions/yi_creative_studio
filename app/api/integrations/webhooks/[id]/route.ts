import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { id } = await params

  // Verify authentication
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get the event source to verify organization
  const { data: existingSource } = (await supabase
    .from('event_sources' as any)
    .select('organization_id')
    .eq('id', id)
    .single()) as { data: { organization_id: string } | null }

  if (!existingSource) {
    return NextResponse.json({ error: 'Event source not found' }, { status: 404 })
  }

  // Verify user is admin of this organization
  const { data: membership } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', existingSource.organization_id)
    .eq('user_id', user.id)
    .single()

  if (!membership || membership.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
  }

  // Parse request body
  const body = await request.json()
  const { name, description, is_active } = body

  // Update event source (RLS policy enforces org boundary)
  const { data: source, error } = (await supabase
    .from('event_sources' as any)
    .update({
      name,
      description: description || null,
      is_active,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*')
    .single()) as { data: Record<string, any> | null; error: any }

  if (error || !source) {
    console.error('Error updating event source:', error)
    return NextResponse.json({ error: error?.message || 'Failed to update source' }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    source: {
      ...source,
      webhook_secret_preview: source.webhook_secret?.substring(0, 8) || null,
    },
  })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { id } = await params

  // Verify authentication
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get the event source to verify organization
  const { data: existingSource } = (await supabase
    .from('event_sources' as any)
    .select('organization_id, source_app_id')
    .eq('id', id)
    .single()) as { data: { organization_id: string; source_app_id: string } | null }

  if (!existingSource) {
    return NextResponse.json({ error: 'Event source not found' }, { status: 404 })
  }

  // Verify user is admin of this organization
  const { data: membership } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', existingSource.organization_id)
    .eq('user_id', user.id)
    .single()

  if (!membership || membership.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
  }

  // Check if we should delete events too
  const searchParams = request.nextUrl.searchParams
  const deleteEvents = searchParams.get('delete_events') === 'true'

  if (deleteEvents) {
    // Delete synced events from this source
    await supabase
      .from('synced_events' as any)
      .delete()
      .eq('organization_id', existingSource.organization_id)
      .eq('source_app_id', existingSource.source_app_id)
  }

  // Delete event source (RLS policy enforces org boundary, cascades to webhook_logs)
  const { error } = await supabase.from('event_sources' as any).delete().eq('id', id)

  if (error) {
    console.error('Error deleting event source:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    message: 'Event source deleted successfully',
  })
}
