'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

/**
 * Redirect handler for legacy/incorrect URLs like:
 * - /dashboard/create/event_poster
 * - /dashboard/create/social_post
 *
 * The app uses a step-based wizard at /create, not URL-based routing.
 * This page redirects users to the correct create page.
 *
 * Note: In Next.js 15+, params are async by default
 */
export default function CreateTypeRedirectPage({
  params,
}: {
  params: Promise<{ type: string }>
}) {
  const router = useRouter()

  useEffect(() => {
    // Redirect to the main create page
    // The create page uses a step-based wizard, not URL routing
    router.replace('/create')
  }, [router])

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-muted-foreground">Redirecting to create page...</p>
    </div>
  )
}
