import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { organizationId, imageUrl, name } = await req.json() as {
    organizationId: string
    imageUrl: string
    name: string
  }

  // Get org Canva token from brand_config
  const { data: org } = await supabase
    .from('organizations')
    .select('brand_config')
    .eq('id', organizationId)
    .single()

  const brandConfig = org?.brand_config as Record<string, unknown> | null
  const accessToken = brandConfig?.canva_access_token as string | undefined

  if (!accessToken) {
    return NextResponse.json({ error: 'Canva not connected for this organization' }, { status: 400 })
  }

  // Download image and re-upload to Canva as an asset
  const imageRes = await fetch(imageUrl)
  const imageBuffer = await imageRes.arrayBuffer()

  const canvaRes = await fetch('https://api.canva.com/rest/v1/assets/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Asset-Upload-Metadata': JSON.stringify({ name_base64: Buffer.from(name).toString('base64') }),
      'Content-Type': 'image/png',
    },
    body: imageBuffer,
  })

  if (!canvaRes.ok) {
    return NextResponse.json({ error: 'Canva upload failed', details: await canvaRes.text() }, { status: 500 })
  }

  const asset = await canvaRes.json() as { asset?: { id: string } }
  return NextResponse.json({ assetId: asset.asset?.id })
}
