import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Use admin client to bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * Register Yi Connect Public Key
 *
 * Called by Yi Connect after OAuth authorization to store the
 * RSA public key for SSO token verification.
 *
 * POST /api/oauth/register-keys
 * Authorization: Bearer ACCESS_TOKEN
 *
 * Request:
 * {
 *   "chapter_id": "yi-connect-chapter-uuid",
 *   "chapter_name": "Yi Chennai",
 *   "public_key": "LS0tLS1CRUdJTi..." (base64 encoded PEM),
 *   "webhook_secret": "shared-secret-for-webhooks"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Verify access token
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'missing_token', error_description: 'Authorization header required' },
        { status: 401 }
      )
    }

    const accessToken = authHeader.substring(7)

    // Look up token
    const { data: tokenData, error: tokenError } = await supabaseAdmin
      .from('oauth_access_tokens')
      .select('*')
      .eq('access_token', accessToken)
      .single()

    if (tokenError || !tokenData) {
      return NextResponse.json(
        { error: 'invalid_token', error_description: 'Invalid or expired access token' },
        { status: 401 }
      )
    }

    // Check token expiration
    if (new Date(tokenData.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'invalid_token', error_description: 'Access token expired' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { chapter_id, chapter_name, public_key, webhook_secret } = body

    if (!chapter_id || !public_key) {
      return NextResponse.json(
        { error: 'invalid_request', error_description: 'chapter_id and public_key are required' },
        { status: 400 }
      )
    }

    // Validate public key format (should be base64 that decodes to PEM)
    try {
      const decodedKey = Buffer.from(public_key, 'base64').toString('utf-8')
      if (!decodedKey.includes('BEGIN PUBLIC KEY') && !decodedKey.includes('BEGIN RSA PUBLIC KEY')) {
        return NextResponse.json(
          { error: 'invalid_request', error_description: 'Invalid public key format' },
          { status: 400 }
        )
      }
    } catch {
      return NextResponse.json(
        { error: 'invalid_request', error_description: 'Public key must be base64 encoded' },
        { status: 400 }
      )
    }

    // Upsert integration record
    const { error: upsertError } = await supabaseAdmin
      .from('yi_connect_integrations')
      .upsert(
        {
          organization_id: tokenData.organization_id,
          chapter_id,
          chapter_name: chapter_name || null,
          public_key,
          webhook_secret: webhook_secret || null,
          status: 'active',
          connected_by: tokenData.user_id,
          connected_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'organization_id',
        }
      )

    if (upsertError) {
      console.error('Failed to store integration:', upsertError)
      return NextResponse.json(
        { error: 'server_error', error_description: 'Failed to store keys' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Keys registered successfully',
    })
  } catch (error) {
    console.error('Register keys error:', error)
    return NextResponse.json(
      { error: 'server_error', error_description: 'Internal server error' },
      { status: 500 }
    )
  }
}
