import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // If there's a 'next' parameter, redirect there (e.g., /join/YTFHDX)
      if (next) {
        return NextResponse.redirect(`${origin}${next}`)
      }

      // Otherwise, check if user has any organizations
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { data: memberships } = await supabase
          .from('organization_members')
          .select('organization_id')
          .eq('user_id', user.id)
          .limit(1)

        // If user has an organization, go to dashboard
        if (memberships && memberships.length > 0) {
          return NextResponse.redirect(`${origin}/dashboard`)
        }

        // Otherwise, go to onboarding
        return NextResponse.redirect(`${origin}/onboarding`)
      }
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/error`)
}
