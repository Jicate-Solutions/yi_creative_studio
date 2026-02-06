import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Check if Yi Connect SSO is enabled
 * When enabled, unauthenticated users are redirected to Yi Connect instead of local login
 */
function isYiConnectSSOEnabled(): boolean {
  // Enable SSO when YI_CONNECT_LOGIN_URL is configured
  return !!process.env.YI_CONNECT_LOGIN_URL
}

/**
 * Get the Yi Connect login URL with redirect parameter
 */
function getYiConnectLoginUrl(redirectTo: string, origin: string): string {
  const baseUrl = process.env.YI_CONNECT_LOGIN_URL!
  const url = new URL(baseUrl)

  // Pass the full callback URL including the original redirect target
  const callbackUrl = `${origin}/api/auth/sso`
  url.searchParams.set('callback_url', callbackUrl)
  url.searchParams.set('redirect_to', redirectTo)

  return url.toString()
}

export async function updateSession(request: NextRequest) {
  // Define public routes that don't require authentication
  // Check this FIRST to potentially skip the Supabase call entirely for public routes
  // Added /api/auth/sso for Yi Connect SSO callback
  const publicRoutes = ['/', '/auth/login', '/auth/signup', '/auth/verify', '/auth/error', '/auth/callback', '/api/auth/sso', '/onboarding']
  const isPublicRoute = publicRoutes.some(route =>
    request.nextUrl.pathname === route ||
    request.nextUrl.pathname.startsWith('/join/') ||
    request.nextUrl.pathname.startsWith('/auth/')
  )
  // Join routes need auth session refresh but shouldn't redirect to login (page handles it)
  const isJoinRoute = request.nextUrl.pathname.startsWith('/join/')
  const isApiRoute = request.nextUrl.pathname.startsWith('/api/')

  // For public routes (non-auth pages), skip auth check entirely for faster response
  // Auth pages still need the check to redirect logged-in users
  // Landing page (/) needs check to redirect logged-in users to dashboard
  // API routes MUST continue to session refresh (don't early return)
  // Join routes need session refresh to check if user is authenticated (page handles redirect)
  const isAuthPage = request.nextUrl.pathname === '/auth/login' || request.nextUrl.pathname === '/auth/signup'
  const isLandingPage = request.nextUrl.pathname === '/'
  if (isPublicRoute && !isAuthPage && !isLandingPage && !isApiRoute && !isJoinRoute) {
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Redirect unauthenticated users to login (but not for API routes)
  if (!user && !isPublicRoute && !isApiRoute) {
    let redirectResponse: NextResponse

    // Check if Yi Connect SSO is enabled
    if (isYiConnectSSOEnabled()) {
      // Redirect to Yi Connect for authentication
      const yiConnectUrl = getYiConnectLoginUrl(
        request.nextUrl.pathname,
        request.nextUrl.origin
      )
      redirectResponse = NextResponse.redirect(yiConnectUrl)
    } else {
      // Use local login page (legacy behavior)
      const url = request.nextUrl.clone()
      url.pathname = '/auth/login'
      url.searchParams.set('redirectTo', request.nextUrl.pathname)
      redirectResponse = NextResponse.redirect(url)
    }

    // Preserve any session cookies that were refreshed during getUser()
    // This is critical - without this, refreshed tokens are lost on redirect
    supabaseResponse.cookies.getAll().forEach(cookie => {
      redirectResponse.cookies.set(cookie.name, cookie.value, cookie)
    })
    return redirectResponse
  }

  // Redirect authenticated users away from auth pages AND landing page
  if (user && (request.nextUrl.pathname === '/auth/login' || request.nextUrl.pathname === '/auth/signup' || request.nextUrl.pathname === '/')) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    const redirectResponse = NextResponse.redirect(url)
    // Preserve session cookies on redirect
    supabaseResponse.cookies.getAll().forEach(cookie => {
      redirectResponse.cookies.set(cookie.name, cookie.value, cookie)
    })
    return redirectResponse
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse
}
