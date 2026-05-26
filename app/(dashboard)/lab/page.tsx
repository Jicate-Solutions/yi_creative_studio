import { CanvasCreatePage } from '@/components/canvas-lab/CanvasCreatePage'
import { createClient } from '@/lib/supabase/server'
import type { ExternalEvent } from '@/types/external-event.types'

interface CreatePageProps {
  searchParams: Promise<{
    eventId?: string
    source?: string
  }>
}

export default async function CreatePage({ searchParams }: CreatePageProps) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  // Await searchParams (Next.js 15+ requirement)
  const params = await searchParams

  // Extract SSO event data from session metadata
  const ssoData = session?.user?.user_metadata?.sso_data
  const eventId = params.eventId

  let initialEventData: ExternalEvent | null = null
  let eventSource: 'sso_token' | 'none' = 'none'

  // Priority 1: Use SSO token data if available and matches requested eventId
  if (eventId && ssoData?.event_data?.event_id === eventId) {
    const ssoEvent = ssoData.event_data

    // Map SSO event data to ExternalEvent format
    initialEventData = {
      id: ssoEvent.event_id,
      name: ssoEvent.event_name,
      date: ssoEvent.event_date,
      startTime: ssoEvent.event_time,
      venue: ssoEvent.venue,
      venueAddress: ssoEvent.venue_address,
      city: ssoEvent.city,
      description: ssoEvent.description,
      tagline: ssoEvent.tagline,
      bannerImageUrl: ssoEvent.banner_image_url,
      eventType: ssoEvent.event_type,
      chapterName: ssoEvent.chapter_name,
      chapterLocation: ssoEvent.chapter_location,
      speakers: ssoEvent.speakers?.map((speaker: any) => ({
        id: speaker.name, // Use name as ID if no ID provided
        name: speaker.name,
        designation: speaker.title,
        photoUrl: speaker.photo_url,
      })),
      status: 'published',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    eventSource = 'sso_token'
    console.log('[Create Page] Using event data from SSO token (instant)')
  }

  return (
    <CanvasCreatePage
      initialEventData={initialEventData}
      eventSource={eventSource}
    />
  )
}
