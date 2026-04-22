import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  // Session client for auth + DB (respects RLS)
  const supabase = await createClient()
  // Admin client for storage upload (bypasses storage RLS policies)
  const adminSupabase = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const imageBlob = formData.get('image') as Blob | null
  const parentId  = formData.get('parentCreativeId') as string | null
  const organizationId = formData.get('organizationId') as string | null

  if (!imageBlob || !parentId || !organizationId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Fetch parent creative for format/vertical metadata
  const { data: parent, error: parentError } = await supabase
    .from('creatives')
    .select('creative_type, vertical, form_data, ai_model, ai_model_id')
    .eq('id', parentId)
    .single()

  if (parentError || !parent) {
    console.error('[save-variant] Parent not found:', parentError?.message)
    return NextResponse.json({ error: 'Parent creative not found' }, { status: 404 })
  }

  // Upload edited image using admin client (no RLS on storage)
  // Path mirrors the generate route structure so existing bucket policies apply cleanly.
  const fileName = `${organizationId}/${parentId}-variant-${Date.now()}.png`
  const buffer = Buffer.from(await imageBlob.arrayBuffer())

  const { error: uploadError } = await adminSupabase.storage
    .from('creatives')
    .upload(fileName, buffer, {
      contentType: 'image/png',
      cacheControl: '31536000',
      upsert: false,
    })

  if (uploadError) {
    console.error('[save-variant] Storage upload failed:', uploadError.message, '| file:', fileName)
    return NextResponse.json({ error: 'Upload failed', details: uploadError.message }, { status: 500 })
  }

  const { data: { publicUrl } } = adminSupabase.storage.from('creatives').getPublicUrl(fileName)

  // Insert variant row (session client so the created_by + org membership RLS applies)
  const variantFormData = {
    ...(parent.form_data as Record<string, unknown>),
    is_variant: true,
    parent_creative_id: parentId,
    variant_edited_at: new Date().toISOString(),
  }

  const { data: variant, error: insertError } = await supabase
    .from('creatives')
    .insert({
      organization_id: organizationId,
      created_by: user.id,
      creative_type: parent.creative_type,
      vertical: parent.vertical,
      ai_model: parent.ai_model,
      ai_model_id: parent.ai_model_id,
      image_url: publicUrl,
      thumbnail_url: publicUrl,
      form_data: variantFormData,
      title: `${parent.creative_type} (edited)`,
      credits_used: 0,
      prompt_used: null,
    })
    .select('id')
    .single()

  if (insertError) {
    console.error('[save-variant] DB insert failed:', insertError.message, insertError.details)
    return NextResponse.json({ error: 'DB insert failed', details: insertError.message }, { status: 500 })
  }

  return NextResponse.json({ variantId: variant.id, imageUrl: publicUrl })
}
