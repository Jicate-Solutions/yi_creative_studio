import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Use admin client to bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * Get Organization Info
 *
 * Returns the organization associated with the OAuth access token.
 * Yi Connect calls this after token exchange to get org details.
 *
 * GET /api/organizations/me
 * Authorization: Bearer ACCESS_TOKEN
 *
 * Response:
 * {
 *   "id": "org-uuid",
 *   "name": "Organization Name",
 *   "email": "admin@example.com",
 *   "logo_url": "https://...",
 *   "created_at": "2026-01-01T00:00:00Z"
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // Extract Bearer token
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

    // Check if token is expired
    if (new Date(tokenData.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'invalid_token', error_description: 'Access token expired' },
        { status: 401 }
      )
    }

    // Check if token is revoked
    if (tokenData.revoked_at) {
      return NextResponse.json(
        { error: 'invalid_token', error_description: 'Access token revoked' },
        { status: 401 }
      )
    }

    // Get organization details
    const { data: org, error: orgError } = await supabaseAdmin
      .from('organizations')
      .select('id, name, slug, type, logo_url, created_at')
      .eq('id', tokenData.organization_id)
      .single()

    if (orgError || !org) {
      return NextResponse.json(
        { error: 'not_found', error_description: 'Organization not found' },
        { status: 404 }
      )
    }

    // Get admin user email
    const { data: userData } = await supabaseAdmin.auth.admin.getUserById(tokenData.user_id)

    return NextResponse.json({
      id: org.id,
      name: org.name,
      slug: org.slug,
      type: org.type,
      email: userData?.user?.email || null,
      logo_url: org.logo_url || null,
      created_at: org.created_at,
    })
  } catch (error) {
    console.error('Organizations/me error:', error)
    return NextResponse.json(
      { error: 'server_error', error_description: 'Internal server error' },
      { status: 500 }
    )
  }
}
