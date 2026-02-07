import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next')
  const redirectTo = searchParams.get('redirect_to')
  const eventId = searchParams.get('event_id')

  console.log('[Auth Callback] Params:', { code: !!code, next, redirectTo, eventId })

  const supabase = await createClient()

  // Method 1: Exchange code for session (OAuth/PKCE flow)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      console.error('[Auth Callback] Code exchange failed:', error)
      return NextResponse.redirect(`${origin}/auth/error?message=${encodeURIComponent('Code exchange failed')}`)
    }
    console.log('[Auth Callback] Code exchanged successfully')
  }

  // Method 2: Check for existing session (Magic link flow)
  // Magic links set cookies directly at Supabase, so session may already exist
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()

  console.log('[Auth Callback] Session check:', {
    hasSession: !!session,
    userId: session?.user?.id,
    error: sessionError?.message,
  })

  if (!session) {
    console.error('[Auth Callback] No session found')
    return NextResponse.redirect(`${origin}/auth/error?message=${encodeURIComponent('No session found')}`)
  }

  // Build the final redirect URL
  // Priority: next param > redirect_to param > default based on org membership
  let finalRedirect = next || redirectTo

  // If we have an event_id and a redirect path that doesn't already include it
  if (eventId && finalRedirect && !finalRedirect.includes('eventId')) {
    const separator = finalRedirect.includes('?') ? '&' : '?'
    finalRedirect = `${finalRedirect}${separator}eventId=${eventId}`
  }

  if (finalRedirect) {
    console.log('[Auth Callback] Redirecting to:', finalRedirect)
    // Ensure the path starts with /
    const redirectPath = finalRedirect.startsWith('/') ? finalRedirect : `/${finalRedirect}`
    return NextResponse.redirect(`${origin}${redirectPath}`)
  }

  // No redirect specified, determine based on user's org membership
  const { data: memberships } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', session.user.id)
    .limit(1)

  // If user has an organization, go to dashboard
  if (memberships && memberships.length > 0) {
    console.log('[Auth Callback] User has org, redirecting to dashboard')
    return NextResponse.redirect(`${origin}/dashboard`)
  }

  // Otherwise, go to onboarding
  console.log('[Auth Callback] No org, redirecting to onboarding')
  return NextResponse.redirect(`${origin}/onboarding`)
}
