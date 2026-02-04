import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { id } = await params

  // Verify super admin
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = (await supabase
    .from('profiles' as any)
    .select('is_super_admin')
    .eq('id', user.id)
    .single()) as { data: { is_super_admin: boolean } | null }

  if (!profile?.is_super_admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Parse request body
  const body = await request.json()
  const { name, description, is_active } = body

  // Update event source
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

  // Verify super admin
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = (await supabase
    .from('profiles' as any)
    .select('is_super_admin')
    .eq('id', user.id)
    .single()) as { data: { is_super_admin: boolean } | null }

  if (!profile?.is_super_admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Delete event source (cascades to webhook_logs)
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
