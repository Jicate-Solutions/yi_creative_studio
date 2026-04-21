import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const imageBlob = formData.get('image') as Blob
  const parentId = formData.get('parentCreativeId') as string
  const organizationId = formData.get('organizationId') as string
  const title = formData.get('title') as string

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
    return NextResponse.json({ error: 'Parent creative not found' }, { status: 404 })
  }

  // Upload edited image to Supabase Storage
  const fileName = `${organizationId}/variants/${parentId}-${Date.now()}.png`
  const arrayBuffer = await imageBlob.arrayBuffer()
  const { error: uploadError } = await supabase.storage
    .from('creatives')
    .upload(fileName, arrayBuffer, { contentType: 'image/png', upsert: false })

  if (uploadError) {
    return NextResponse.json({ error: 'Upload failed', details: uploadError.message }, { status: 500 })
  }

  const { data: { publicUrl } } = supabase.storage.from('creatives').getPublicUrl(fileName)

  // Save variant row in creatives table
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
      title: title || `${parent.creative_type} (edited)`,
      credits_used: 0,
    })
    .select('id')
    .single()

  if (insertError) {
    return NextResponse.json({ error: 'DB insert failed', details: insertError.message }, { status: 500 })
  }

  return NextResponse.json({ variantId: variant.id, imageUrl: publicUrl })
}
