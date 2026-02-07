import { LucideIcon, CalendarDays, Sparkles, Images, Library } from 'lucide-react'

export interface TourConfig {
  id: string
  name: string
  description: string
  pageId: string
  icon: LucideIcon
  storageKey: string
}

export const TOUR_REGISTRY: TourConfig[] = [
  {
    id: 'create-page-tour',
    name: 'Create Poster Tour',
    description: 'Learn how to generate AI-powered posters',
    pageId: 'create',
    icon: Sparkles,
    storageKey: 'tour-create-page-seen'
  },
  {
    id: 'events-page-tour',
    name: 'Events Calendar Tour',
    description: 'Sync events and create promotional content',
    pageId: 'events',
    icon: CalendarDays,
    storageKey: 'tour-events-page-seen'
  },
  {
    id: 'gallery-page-tour',
    name: 'Gallery Tour',
    description: 'Manage and organize your creatives',
    pageId: 'gallery',
    icon: Images,
    storageKey: 'tour-gallery-page-seen'
  },
  {
    id: 'templates-page-tour',
    name: 'Templates Tour',
    description: 'Browse and customize template designs',
    pageId: 'templates',
    icon: Library,
    storageKey: 'tour-templates-page-seen'
  }
]

/**
 * Helper to get tour config by ID
 */
export function getTourConfig(tourId: string): TourConfig | undefined {
  return TOUR_REGISTRY.find(tour => tour.id === tourId)
}
