'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCreativeStore } from '@/stores/creative-store'
import { Loader2 } from 'lucide-react'

// Map URL type slugs to valid creative types
const CREATIVE_TYPE_MAP: Record<string, string> = {
  event_poster: 'event_poster',
  event: 'event_poster',
  poster: 'event_poster',
  social_post: 'social_post',
  social: 'social_post',
  banner: 'banner',
  announcement: 'announcement',
}

/**
 * Handler for URL-based creative type routing like:
 * - /create/event_poster
 * - /create/social_post
 * - /create/banner
 *
 * Redirects to the main /create page which uses a step-based wizard.
 */
export default function CreateTypePage({
  params,
}: {
  params: { type: string }
}) {
  const router = useRouter()
  const { updateFormData } = useCreativeStore()

  useEffect(() => {
    const creativeType = CREATIVE_TYPE_MAP[params.type.toLowerCase()]

    if (creativeType) {
      // Store the creative type preference and redirect
      updateFormData({ creativeType })
    }

    // Redirect to the main create page
    router.replace('/create')
  }, [params.type, router, updateFormData])

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-muted-foreground">
        Redirecting to create {params.type.replace('_', ' ')}...
      </p>
    </div>
  )
}
