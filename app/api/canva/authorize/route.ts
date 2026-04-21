import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { buildCanvaAuthUrl } from '@/lib/canva/oauth'
import crypto from 'crypto'

function base64url(buffer: Buffer): string {
  return buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const organizationId = searchParams.get('organization_id')
  if (!organizationId) return NextResponse.json({ error: 'organization_id required' }, { status: 400 })

  // PKCE — generate code verifier and challenge
  const codeVerifier = base64url(crypto.randomBytes(32))
  const codeChallenge = base64url(
    crypto.createHash('sha256').update(codeVerifier).digest()
  )
  const state = base64url(crypto.randomBytes(16))

  // Store verifier + state in a short-lived cookie
  const response = NextResponse.redirect(buildCanvaAuthUrl(state, codeChallenge))
  response.cookies.set('canva_oauth_state', JSON.stringify({ state, codeVerifier, organizationId }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 600, // 10 minutes
    path: '/',
  })
  return response
}
