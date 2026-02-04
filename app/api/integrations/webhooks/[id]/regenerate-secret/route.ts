import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
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

  // Generate new webhook secret
  const { data: secretData } = await (supabase as any).rpc('generate_webhook_secret')
  const webhook_secret = secretData || ''

  // Update event source with new secret (RLS policy enforces org boundary)
  const { data: source, error } = (await supabase
    .from('event_sources' as any)
    .update({
      webhook_secret,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*')
    .single()) as { data: Record<string, any> | null; error: any }

  if (error) {
    console.error('Error regenerating webhook secret:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Get webhook URL
  const webhookUrl = `${request.nextUrl.origin}/api/webhooks/events`

  return NextResponse.json({
    success: true,
    source: {
      ...source,
      webhook_secret, // Full secret shown only once!
      webhook_url: webhookUrl,
    },
  })
}
