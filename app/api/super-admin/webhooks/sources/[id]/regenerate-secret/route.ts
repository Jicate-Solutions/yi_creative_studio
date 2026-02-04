import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
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

  // Generate new webhook secret
  const { data: secretData } = await (supabase as any).rpc('generate_webhook_secret')
  const webhook_secret = secretData || ''

  // Update event source with new secret
  const { data: source, error } = (await supabase
    .from('event_sources' as any)
    .update({
      webhook_secret,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*')
    .single()) as { data: Record<string, any> | null; error: any }

  if (error || !source) {
    console.error('Error regenerating webhook secret:', error)
    return NextResponse.json({ error: error?.message || 'Failed to regenerate secret' }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    source: {
      ...source,
      webhook_secret, // Full secret shown only once
    },
  })
}
