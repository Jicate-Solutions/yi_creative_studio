import type { PromptStyleId } from '@/lib/config/prompt-styles'

export interface AutoDesignChoices {
  theme: string          // Always 'ai-custom' — triggers Design Intelligence custom generation
  style: string          // Visual treatment mapped from format/eventType
  promptStyleId: PromptStyleId  // Pipeline temperature profile
}

const FORMAT_TO_STYLE: Record<string, string> = {
  certificate: 'elegant',
  invitation: 'elegant',
  letterhead: 'flat',
  event_poster: 'gradient',
  portrait_poster: 'gradient',
  landscape_poster: 'gradient',
  instagram_post: 'gradient',
  instagram_story: 'gradient',
  instagram_reel: 'geometric',
  tiktok_cover: 'geometric',
  youtube_thumbnail: 'geometric',
  youtube_banner: 'gradient',
  presentation_16_9: 'flat',
  presentation_4_3: 'flat',
  flyer_a5: 'gradient',
  flyer_a4: 'gradient',
  web_banner: 'gradient',
  billboard: 'gradient',
  brochure: 'flat',
  business_card: 'flat',
  book_cover: 'photographic',
  report_cover: 'flat',
}

const EVENT_TYPE_STYLE: Record<string, string> = {
  hackathon: 'neon',
  tech_fest: 'neon',
  cultural_event: 'watercolor',
  cultural_fest: 'watercolor',
  festival: 'watercolor',
  sports_event: 'geometric',
  award_ceremony: 'elegant',
  farewell: 'elegant',
  convocation: 'elegant',
}

const FORMAT_TO_PROMPT_STYLE: Record<string, PromptStyleId> = {
  certificate: 'elegant',
  invitation: 'elegant',
  letterhead: 'minimal',
  youtube_thumbnail: 'bold',
  youtube_banner: 'bold',
  instagram_reel: 'bold',
  tiktok_cover: 'bold',
  presentation_16_9: 'minimal',
  presentation_4_3: 'minimal',
  event_poster: 'stunning',
  portrait_poster: 'stunning',
  landscape_poster: 'stunning',
  instagram_post: 'stunning',
  instagram_story: 'stunning',
  billboard: 'bold',
  web_banner: 'bold',
  flyer_a5: 'stunning',
  flyer_a4: 'stunning',
  brochure: 'minimal',
}

const EVENT_TYPE_PROMPT_STYLE: Record<string, PromptStyleId> = {
  hackathon: 'bold',
  tech_fest: 'bold',
  product_launch: 'bold',
  cultural_event: 'creative',
  cultural_fest: 'creative',
  festival: 'creative',
  award_ceremony: 'elegant',
  convocation: 'elegant',
  farewell: 'elegant',
  sports_event: 'bold',
  sports_day: 'bold',
  annual_day: 'elegant',
}

/**
 * Resolves design choices automatically based on format and event type.
 * This replaces user-selectable Theme, Style, and Prompt Style controls.
 * Priority: eventType override > formatId lookup > fallback defaults.
 */
export function resolveAutoDesignChoices(params: {
  formatId: string | null | undefined
  eventType?: string
}): AutoDesignChoices {
  const fid = params.formatId || 'event_poster'
  const et = params.eventType

  return {
    theme: 'ai-custom',
    style: (et && EVENT_TYPE_STYLE[et]) || FORMAT_TO_STYLE[fid] || 'gradient',
    promptStyleId: ((et && EVENT_TYPE_PROMPT_STYLE[et]) || FORMAT_TO_PROMPT_STYLE[fid] || 'stunning') as PromptStyleId,
  }
}
