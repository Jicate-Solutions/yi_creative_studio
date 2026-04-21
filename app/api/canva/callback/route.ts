import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { exchangeCanvaCode } from '@/lib/canva/oauth'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/auth/login`)

  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const returnedState = searchParams.get('state')
  const errorParam = searchParams.get('error')

  if (errorParam) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings/integrations?canva=error`)
  }

  const cookieVal = req.cookies.get('canva_oauth_state')?.value
  if (!cookieVal || !code) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings/integrations?canva=error`)
  }

  const { state, codeVerifier, organizationId } = JSON.parse(cookieVal) as {
    state: string
    codeVerifier: string
    organizationId: string
  }

  if (returnedState !== state) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings/integrations?canva=error`)
  }

  const tokens = await exchangeCanvaCode(code, codeVerifier)

  // Fetch existing brand_config so we can merge Canva tokens in
  const { data: org } = await supabase
    .from('organizations')
    .select('brand_config')
    .eq('id', organizationId)
    .single()

  const existingConfig = (org?.brand_config as Record<string, unknown>) ?? {}
  const updatedConfig = {
    ...existingConfig,
    canva_access_token: tokens.access_token,
    canva_refresh_token: tokens.refresh_token,
    canva_token_expires_at: Date.now() + tokens.expires_in * 1000,
    canva_connected_by: user.id,
    canva_connected_at: new Date().toISOString(),
  }

  await supabase
    .from('organizations')
    .update({ brand_config: updatedConfig })
    .eq('id', organizationId)

  const response = NextResponse.redirect(
    `${process.env.NEXT_PUBLIC_APP_URL}/settings/integrations?canva=success`
  )
  response.cookies.delete('canva_oauth_state')
  return response
}
