/**
 * Pre-Seeded Patterns - Day 1 Value
 *
 * 25+ patterns covering common creative generation issues:
 * - Text Readability (5 patterns)
 * - Logo Issues (4 patterns)
 * - Color Issues (4 patterns)
 * - Composition (4 patterns)
 * - Format-Specific (8+ patterns)
 */

import type {
  PatternCategory,
  IssueSignature,
  FixMapping,
  InterventionLayer,
  PipelineStage,
} from '@/types/learning.types'

export interface PreSeededPattern {
  patternKey: string
  category: PatternCategory
  name: string
  description: string
  issueSignature: IssueSignature
  fixMapping: FixMapping
  formatIds: string[]
  confidence: number
}

// =============================================================================
// TEXT READABILITY PATTERNS (5)
// =============================================================================

const TEXT_READABILITY_PATTERNS: PreSeededPattern[] = [
  {
    patternKey: 'text_readability_dark_bg',
    category: 'text_rendering',
    name: 'Low Contrast on Dark Backgrounds',
    description: 'Text becomes unreadable when placed on dark backgrounds without sufficient contrast',
    issueSignature: {
      keywords: ['dark', 'black', 'navy', 'night', 'dramatic', 'moody'],
      conditions: [
        { field: 'formData.backgroundColor', operator: 'matches', value: '(dark|black|navy|#[0-3])', weight: 2 },
        { field: 'designData.mood', operator: 'contains', value: 'dark', weight: 1 },
      ],
      minConfidence: 0.5,
    },
    fixMapping: {
      layer: 'L2_prompt',
      targetStage: 'format_prompt_building',
      intervention: {
        type: 'prompt_injection',
        action: 'append_instruction',
        parameters: {
          instruction: 'CRITICAL: Ensure ALL text has strong contrast against the background. Use white or light-colored text on dark areas. Add subtle text shadows or glows for readability.',
          priority: 'high',
        },
      },
      fallbackLayers: ['L3_design_context'],
    },
    formatIds: [],
    confidence: 0.9,
  },
  {
    patternKey: 'text_over_busy_image',
    category: 'text_rendering',
    name: 'Text Over Complex Imagery',
    description: 'Text placed directly over busy images or patterns becomes illegible',
    issueSignature: {
      keywords: ['photo', 'photograph', 'image', 'picture', 'background image', 'pattern'],
      conditions: [
        { field: 'formData.backgroundType', operator: 'equals', value: 'image', weight: 2 },
        { field: 'designData.hasBackgroundImage', operator: 'equals', value: true, weight: 2 },
      ],
      minConfidence: 0.5,
    },
    fixMapping: {
      layer: 'L2_prompt',
      targetStage: 'format_prompt_building',
      intervention: {
        type: 'prompt_injection',
        action: 'append_instruction',
        parameters: {
          instruction: 'IMPORTANT: Place text over solid-colored overlays, gradients, or blurred areas. Never place text directly over detailed images. Use semi-transparent color blocks behind text.',
          priority: 'high',
        },
      },
    },
    formatIds: [],
    confidence: 0.85,
  },
  {
    patternKey: 'text_too_small',
    category: 'text_rendering',
    name: 'Text Below Readable Size',
    description: 'Important text rendered too small to read comfortably',
    issueSignature: {
      keywords: ['details', 'fine print', 'small text', 'disclaimer', 'terms'],
      conditions: [
        { field: 'formData.includeDetails', operator: 'equals', value: true, weight: 1 },
        { field: 'formData.textDensity', operator: 'equals', value: 'high', weight: 2 },
      ],
      formatSpecific: ['certificate', 'flyer', 'business_card'],
      minConfidence: 0.6,
    },
    fixMapping: {
      layer: 'L2_prompt',
      targetStage: 'format_prompt_building',
      intervention: {
        type: 'prompt_injection',
        action: 'append_instruction',
        parameters: {
          instruction: 'TEXT SIZE REQUIREMENT: All text must be readable. Headlines minimum 48pt equivalent, body text minimum 18pt equivalent. Do not render text smaller than would be legible at the output resolution.',
          priority: 'high',
        },
      },
    },
    formatIds: ['certificate', 'flyer', 'business_card'],
    confidence: 0.8,
  },
  {
    patternKey: 'text_overflow',
    category: 'text_rendering',
    name: 'Text Overflow at Edges',
    description: 'Text cut off at design edges due to long content',
    issueSignature: {
      keywords: [],
      conditions: [
        { field: 'formData.title', operator: 'matches', value: '.{40,}', weight: 2 },
        { field: 'formData.headline', operator: 'matches', value: '.{40,}', weight: 2 },
        { field: 'formData.eventName', operator: 'matches', value: '.{30,}', weight: 2 },
      ],
      minConfidence: 0.5,
    },
    fixMapping: {
      layer: 'L1_form_data',
      targetStage: 'form_input',
      intervention: {
        type: 'field_modification',
        action: 'suggest_truncation',
        parameters: {
          maxLength: 35,
          suggestion: 'Consider shortening the title for better visual impact',
          autoTruncate: false,
        },
      },
      fallbackLayers: ['L2_prompt'],
    },
    formatIds: [],
    confidence: 0.75,
  },
  {
    patternKey: 'text_no_hierarchy',
    category: 'text_rendering',
    name: 'No Visual Text Hierarchy',
    description: 'Multiple text elements with same visual weight causing confusion',
    issueSignature: {
      keywords: [],
      conditions: [
        { field: 'formData.subtitle', operator: 'exists', value: true, weight: 1 },
        { field: 'formData.tagline', operator: 'exists', value: true, weight: 1 },
        { field: 'formData.description', operator: 'exists', value: true, weight: 1 },
      ],
      minConfidence: 0.6,
    },
    fixMapping: {
      layer: 'L2_prompt',
      targetStage: 'format_prompt_building',
      intervention: {
        type: 'prompt_injection',
        action: 'append_instruction',
        parameters: {
          instruction: 'HIERARCHY: Create clear visual hierarchy with distinct sizes. Primary headline largest (2x secondary), secondary text medium, supporting text smallest. Use weight and color variations.',
          priority: 'medium',
        },
      },
    },
    formatIds: [],
    confidence: 0.7,
  },
]

// =============================================================================
// LOGO ISSUES PATTERNS (4)
// =============================================================================

const LOGO_PATTERNS: PreSeededPattern[] = [
  {
    patternKey: 'logo_overlap_content',
    category: 'logo',
    name: 'Logo Conflicts with Content',
    description: 'Logo placement overlaps with important content areas',
    issueSignature: {
      keywords: ['prominent', 'large image', 'full bleed', 'hero'],
      conditions: [
        { field: 'logosPlacements', operator: 'exists', value: true, weight: 2 },
        { field: 'formData.hasHeroImage', operator: 'equals', value: true, weight: 1 },
      ],
      minConfidence: 0.5,
    },
    fixMapping: {
      layer: 'L2_prompt',
      targetStage: 'format_prompt_building',
      intervention: {
        type: 'prompt_injection',
        action: 'append_instruction',
        parameters: {
          instruction: 'LOGO PLACEMENT: Reserve clear space in corner areas for logo overlay. Do not place important visual elements in the top-left or top-right corners. Leave 5% margin from edges for logo placement.',
          priority: 'critical',
        },
      },
    },
    formatIds: [],
    confidence: 0.85,
  },
  {
    patternKey: 'logo_too_small',
    category: 'logo',
    name: 'Logo Below Visible Size',
    description: 'Logo rendered too small to be recognizable',
    issueSignature: {
      keywords: [],
      conditions: [
        { field: 'logosPlacements.0.size', operator: 'equals', value: 'small', weight: 2 },
        { field: 'formatId', operator: 'matches', value: '(instagram|story|thumbnail)', weight: 1 },
      ],
      minConfidence: 0.6,
    },
    fixMapping: {
      layer: 'L4_post_process',
      targetStage: 'logo_overlay',
      intervention: {
        type: 'post_process_adjustment',
        action: 'increase_logo_size',
        parameters: {
          minSize: 'medium',
          suggestion: 'Logo size increased for visibility on this format',
        },
      },
    },
    formatIds: ['instagram', 'instagram_story', 'youtube_thumbnail'],
    confidence: 0.8,
  },
  {
    patternKey: 'logo_wrong_position',
    category: 'logo',
    name: 'Logo Not in Expected Position',
    description: 'Yi logo must be top-left, CII logo must be top-right per brand guidelines',
    issueSignature: {
      keywords: [],
      conditions: [
        { field: 'logosPlacements', operator: 'exists', value: true, weight: 2 },
      ],
      minConfidence: 0.8,
    },
    fixMapping: {
      layer: 'L1_form_data',
      targetStage: 'form_input',
      intervention: {
        type: 'field_modification',
        action: 'enforce_logo_positions',
        parameters: {
          rules: {
            yi: 'top-left',
            cii: 'top-right',
          },
          strict: true,
        },
      },
    },
    formatIds: [],
    confidence: 0.95,
  },
  {
    patternKey: 'logo_quality_degraded',
    category: 'logo',
    name: 'Logo Quality Degradation',
    description: 'Logo appears pixelated or distorted in output',
    issueSignature: {
      keywords: [],
      conditions: [
        { field: 'formData.resolution', operator: 'equals', value: '4k', weight: 1 },
        { field: 'logosPlacements.0.size', operator: 'equals', value: 'large', weight: 1 },
      ],
      minConfidence: 0.6,
    },
    fixMapping: {
      layer: 'L4_post_process',
      targetStage: 'logo_overlay',
      intervention: {
        type: 'post_process_adjustment',
        action: 'use_high_res_logo',
        parameters: {
          minDPI: 300,
          preferSVG: true,
        },
      },
    },
    formatIds: [],
    confidence: 0.7,
  },
]

// =============================================================================
// COLOR ISSUES PATTERNS (4)
// =============================================================================

const COLOR_PATTERNS: PreSeededPattern[] = [
  {
    patternKey: 'color_brand_override',
    category: 'colors',
    name: 'Brand Colors Ignored',
    description: 'Design does not incorporate Yi brand colors appropriately',
    issueSignature: {
      keywords: [],
      conditions: [
        { field: 'formData.useBrandColors', operator: 'equals', value: true, weight: 2 },
        { field: 'designData.colorScheme', operator: 'not_exists', value: true, weight: 1 },
      ],
      minConfidence: 0.5,
    },
    fixMapping: {
      layer: 'L3_design_context',
      targetStage: 'design_intelligence',
      intervention: {
        type: 'design_context_override',
        action: 'inject_brand_colors',
        parameters: {
          primary: '#005B96',
          secondary: '#FF6B35',
          accent: '#FFD700',
          requirement: 'Must include brand colors prominently',
        },
      },
    },
    formatIds: [],
    confidence: 0.85,
  },
  {
    patternKey: 'color_clash',
    category: 'colors',
    name: 'Jarring Color Combinations',
    description: 'Color choices create visual discomfort or clash badly',
    issueSignature: {
      keywords: ['vibrant', 'bold', 'colorful', 'multi-color', 'rainbow'],
      conditions: [
        { field: 'formData.colorStyle', operator: 'equals', value: 'vibrant', weight: 1 },
        { field: 'designData.colorCount', operator: 'gt', value: 4, weight: 2 },
      ],
      minConfidence: 0.6,
    },
    fixMapping: {
      layer: 'L2_prompt',
      targetStage: 'format_prompt_building',
      intervention: {
        type: 'prompt_injection',
        action: 'append_instruction',
        parameters: {
          instruction: 'COLOR HARMONY: Use a cohesive color palette with maximum 3-4 colors. Ensure colors complement each other using color theory (analogous, complementary, or triadic schemes). Avoid pure saturated colors adjacent to each other.',
          priority: 'medium',
        },
      },
    },
    formatIds: [],
    confidence: 0.75,
  },
  {
    patternKey: 'color_low_contrast',
    category: 'colors',
    name: 'Insufficient Color Contrast',
    description: 'Colors too similar in value causing elements to blend together',
    issueSignature: {
      keywords: ['subtle', 'soft', 'pastel', 'muted', 'monochrome'],
      conditions: [
        { field: 'formData.colorStyle', operator: 'contains', value: 'subtle', weight: 1 },
        { field: 'designData.mood', operator: 'contains', value: 'soft', weight: 1 },
      ],
      minConfidence: 0.5,
    },
    fixMapping: {
      layer: 'L2_prompt',
      targetStage: 'format_prompt_building',
      intervention: {
        type: 'prompt_injection',
        action: 'append_instruction',
        parameters: {
          instruction: 'CONTRAST: Even with soft colors, ensure adequate value contrast between elements. Text must have WCAG AA contrast ratio (4.5:1) against background. Use darker accents to define edges and create visual separation.',
          priority: 'high',
        },
      },
    },
    formatIds: [],
    confidence: 0.8,
  },
  {
    patternKey: 'color_monotone',
    category: 'colors',
    name: 'No Visual Interest',
    description: 'Design lacks color variety appearing flat and unengaging',
    issueSignature: {
      keywords: ['minimal', 'minimalist', 'simple', 'clean', 'plain'],
      conditions: [
        { field: 'formData.style', operator: 'contains', value: 'minimal', weight: 1 },
        { field: 'designData.colorCount', operator: 'lt', value: 2, weight: 2 },
      ],
      minConfidence: 0.5,
    },
    fixMapping: {
      layer: 'L2_prompt',
      targetStage: 'format_prompt_building',
      intervention: {
        type: 'prompt_injection',
        action: 'append_instruction',
        parameters: {
          instruction: 'VISUAL INTEREST: Even minimal designs need visual hierarchy. Use at least one accent color for key elements (CTAs, headlines). Consider subtle gradients or texture for depth.',
          priority: 'low',
        },
      },
    },
    formatIds: [],
    confidence: 0.65,
  },
]

// =============================================================================
// COMPOSITION PATTERNS (4)
// =============================================================================

const COMPOSITION_PATTERNS: PreSeededPattern[] = [
  {
    patternKey: 'composition_crowded',
    category: 'composition',
    name: 'Too Many Elements',
    description: 'Design overcrowded with elements causing visual chaos',
    issueSignature: {
      keywords: ['all', 'everything', 'complete', 'full', 'comprehensive'],
      conditions: [
        { field: 'formData.includeElements', operator: 'matches', value: '.{100,}', weight: 2 },
        { field: 'formData.speakers', operator: 'matches', value: '.{3,}', weight: 1 },
      ],
      minConfidence: 0.6,
    },
    fixMapping: {
      layer: 'L2_prompt',
      targetStage: 'format_prompt_building',
      intervention: {
        type: 'prompt_injection',
        action: 'append_instruction',
        parameters: {
          instruction: 'SIMPLICITY: Less is more. Focus on 3-4 key visual elements maximum. Use whitespace strategically. Group related items. Avoid visual clutter - every element must earn its place.',
          priority: 'high',
        },
      },
      fallbackLayers: ['L1_form_data'],
    },
    formatIds: [],
    confidence: 0.8,
  },
  {
    patternKey: 'composition_empty',
    category: 'composition',
    name: 'Too Much Whitespace',
    description: 'Design appears incomplete with excessive empty areas',
    issueSignature: {
      keywords: ['minimal', 'single', 'just', 'only'],
      conditions: [
        { field: 'formData.elements', operator: 'matches', value: '^.{0,30}$', weight: 2 },
      ],
      minConfidence: 0.5,
    },
    fixMapping: {
      layer: 'L2_prompt',
      targetStage: 'format_prompt_building',
      intervention: {
        type: 'prompt_injection',
        action: 'append_instruction',
        parameters: {
          instruction: 'BALANCE: Fill the composition thoughtfully. Use decorative elements, patterns, or imagery to occupy empty space purposefully. Ensure the design feels complete and intentional.',
          priority: 'medium',
        },
      },
    },
    formatIds: [],
    confidence: 0.7,
  },
  {
    patternKey: 'composition_unbalanced',
    category: 'composition',
    name: 'Poor Visual Balance',
    description: 'Elements weighted heavily to one side creating imbalance',
    issueSignature: {
      keywords: ['left', 'right', 'top', 'bottom', 'corner'],
      conditions: [
        { field: 'formData.alignment', operator: 'matches', value: '(left|right)', weight: 1 },
        { field: 'formData.imagePosition', operator: 'exists', value: true, weight: 1 },
      ],
      minConfidence: 0.5,
    },
    fixMapping: {
      layer: 'L2_prompt',
      targetStage: 'format_prompt_building',
      intervention: {
        type: 'prompt_injection',
        action: 'append_instruction',
        parameters: {
          instruction: 'BALANCE: Create visual equilibrium. If heavy elements are on one side, balance with lighter elements or negative space on the other. Consider rule of thirds for asymmetric balance.',
          priority: 'medium',
        },
      },
    },
    formatIds: [],
    confidence: 0.7,
  },
  {
    patternKey: 'composition_no_focus',
    category: 'composition',
    name: 'No Clear Focal Point',
    description: 'Design lacks a dominant element to draw attention',
    issueSignature: {
      keywords: [],
      conditions: [
        { field: 'formData.heroElement', operator: 'not_exists', value: true, weight: 2 },
        { field: 'formData.mainImage', operator: 'not_exists', value: true, weight: 1 },
      ],
      minConfidence: 0.5,
    },
    fixMapping: {
      layer: 'L2_prompt',
      targetStage: 'format_prompt_building',
      intervention: {
        type: 'prompt_injection',
        action: 'append_instruction',
        parameters: {
          instruction: 'FOCAL POINT: Create one dominant element that immediately draws the eye. Use size, color, contrast, or position to establish hierarchy. The headline or main image should be unmistakably primary.',
          priority: 'high',
        },
      },
    },
    formatIds: [],
    confidence: 0.75,
  },
]

// =============================================================================
// FORMAT-SPECIFIC PATTERNS (8+)
// =============================================================================

const FORMAT_SPECIFIC_PATTERNS: PreSeededPattern[] = [
  {
    patternKey: 'certificate_formal_tone',
    category: 'format_specific',
    name: 'Certificates Need Formality',
    description: 'Certificates require formal, professional design language',
    issueSignature: {
      keywords: ['fun', 'playful', 'casual', 'modern', 'trendy'],
      conditions: [
        { field: 'formData.style', operator: 'contains', value: 'casual', weight: 2 },
        { field: 'formData.mood', operator: 'contains', value: 'playful', weight: 2 },
      ],
      formatSpecific: ['certificate'],
      minConfidence: 0.6,
    },
    fixMapping: {
      layer: 'L3_design_context',
      targetStage: 'design_intelligence',
      intervention: {
        type: 'design_context_override',
        action: 'override_style',
        parameters: {
          style: 'formal',
          mood: 'professional',
          elements: ['elegant borders', 'serif typography', 'gold accents', 'official seal aesthetic'],
        },
      },
    },
    formatIds: ['certificate'],
    confidence: 0.9,
  },
  {
    patternKey: 'youtube_thumbnail_impact',
    category: 'format_specific',
    name: 'YouTube Thumbnails Need Impact',
    description: 'Thumbnails must grab attention in milliseconds',
    issueSignature: {
      keywords: ['subtle', 'minimal', 'soft', 'quiet'],
      conditions: [
        { field: 'formData.style', operator: 'contains', value: 'minimal', weight: 2 },
        { field: 'formData.colorIntensity', operator: 'equals', value: 'low', weight: 1 },
      ],
      formatSpecific: ['youtube_thumbnail'],
      minConfidence: 0.6,
    },
    fixMapping: {
      layer: 'L2_prompt',
      targetStage: 'format_prompt_building',
      intervention: {
        type: 'prompt_injection',
        action: 'append_instruction',
        parameters: {
          instruction: 'THUMBNAIL IMPACT: Use bold, high-contrast colors. Large, readable text (3-5 words max). Expressive faces or dramatic imagery. Must be eye-catching at small sizes. Avoid small details.',
          priority: 'critical',
        },
      },
    },
    formatIds: ['youtube_thumbnail'],
    confidence: 0.9,
  },
  {
    patternKey: 'instagram_square_crop',
    category: 'format_specific',
    name: 'Instagram Square Content Safety',
    description: 'Key content must be safe from square crop in feed',
    issueSignature: {
      keywords: [],
      conditions: [
        { field: 'formatId', operator: 'equals', value: 'instagram', weight: 2 },
      ],
      formatSpecific: ['instagram'],
      minConfidence: 0.7,
    },
    fixMapping: {
      layer: 'L2_prompt',
      targetStage: 'format_prompt_building',
      intervention: {
        type: 'prompt_injection',
        action: 'append_instruction',
        parameters: {
          instruction: 'CROP SAFETY: Keep critical content in center 80% of frame. Text and key visuals must remain visible in both square (1:1) and portrait (4:5) crops. Avoid placing important elements at edges.',
          priority: 'high',
        },
      },
    },
    formatIds: ['instagram'],
    confidence: 0.85,
  },
  {
    patternKey: 'story_vertical_optimization',
    category: 'format_specific',
    name: 'Stories Need Vertical Optimization',
    description: 'Story content must use vertical space effectively',
    issueSignature: {
      keywords: [],
      conditions: [
        { field: 'formatId', operator: 'matches', value: '(instagram_story|story)', weight: 2 },
      ],
      formatSpecific: ['instagram_story', 'story'],
      minConfidence: 0.7,
    },
    fixMapping: {
      layer: 'L2_prompt',
      targetStage: 'format_prompt_building',
      intervention: {
        type: 'prompt_injection',
        action: 'append_instruction',
        parameters: {
          instruction: 'VERTICAL LAYOUT: Stack elements vertically. Use full 9:16 height. Keep tap zones (top 10%, bottom 15%) clear of important content. Center key message in middle third.',
          priority: 'high',
        },
      },
    },
    formatIds: ['instagram_story', 'story'],
    confidence: 0.85,
  },
  {
    patternKey: 'linkedin_professional_tone',
    category: 'format_specific',
    name: 'LinkedIn Requires Professionalism',
    description: 'LinkedIn content must maintain professional standards',
    issueSignature: {
      keywords: ['fun', 'casual', 'emoji', 'meme', 'trendy'],
      conditions: [
        { field: 'formData.tone', operator: 'contains', value: 'casual', weight: 2 },
        { field: 'formData.style', operator: 'contains', value: 'playful', weight: 2 },
      ],
      formatSpecific: ['linkedin', 'linkedin_post'],
      minConfidence: 0.6,
    },
    fixMapping: {
      layer: 'L3_design_context',
      targetStage: 'design_intelligence',
      intervention: {
        type: 'design_context_override',
        action: 'override_style',
        parameters: {
          tone: 'professional',
          style: 'corporate-friendly',
          avoid: ['excessive emojis', 'meme formats', 'overly casual language'],
        },
      },
    },
    formatIds: ['linkedin', 'linkedin_post'],
    confidence: 0.85,
  },
  {
    patternKey: 'event_poster_hierarchy',
    category: 'format_specific',
    name: 'Event Posters Need Info Hierarchy',
    description: 'Event posters must prioritize What > When > Where',
    issueSignature: {
      keywords: [],
      conditions: [
        { field: 'formatId', operator: 'equals', value: 'event_poster', weight: 2 },
        { field: 'formData.eventDate', operator: 'exists', value: true, weight: 1 },
        { field: 'formData.venue', operator: 'exists', value: true, weight: 1 },
      ],
      formatSpecific: ['event_poster', 'poster'],
      minConfidence: 0.7,
    },
    fixMapping: {
      layer: 'L2_prompt',
      targetStage: 'format_prompt_building',
      intervention: {
        type: 'prompt_injection',
        action: 'append_instruction',
        parameters: {
          instruction: 'EVENT HIERARCHY: 1) Event name/title (largest, most prominent), 2) Date and time (clear, easy to find), 3) Venue/location, 4) Supporting details. Follow this visual priority strictly.',
          priority: 'high',
        },
      },
    },
    formatIds: ['event_poster', 'poster'],
    confidence: 0.9,
  },
  {
    patternKey: 'business_card_contact_clarity',
    category: 'format_specific',
    name: 'Business Cards Need Contact Clarity',
    description: 'Contact information must be immediately accessible',
    issueSignature: {
      keywords: [],
      conditions: [
        { field: 'formatId', operator: 'equals', value: 'business_card', weight: 2 },
      ],
      formatSpecific: ['business_card'],
      minConfidence: 0.7,
    },
    fixMapping: {
      layer: 'L2_prompt',
      targetStage: 'format_prompt_building',
      intervention: {
        type: 'prompt_injection',
        action: 'append_instruction',
        parameters: {
          instruction: 'BUSINESS CARD: Name prominently displayed, title/role clearly visible, contact info (phone, email) easy to read at small size. Use consistent alignment. Do not overcrowd - less is more.',
          priority: 'high',
        },
      },
    },
    formatIds: ['business_card'],
    confidence: 0.85,
  },
  {
    patternKey: 'flyer_call_to_action',
    category: 'format_specific',
    name: 'Flyers Need Clear CTA',
    description: 'Promotional flyers must have obvious call-to-action',
    issueSignature: {
      keywords: ['promotional', 'sale', 'discount', 'offer', 'event', 'register'],
      conditions: [
        { field: 'formatId', operator: 'equals', value: 'flyer', weight: 2 },
        { field: 'formData.cta', operator: 'not_exists', value: true, weight: 1 },
      ],
      formatSpecific: ['flyer'],
      minConfidence: 0.6,
    },
    fixMapping: {
      layer: 'L2_prompt',
      targetStage: 'format_prompt_building',
      intervention: {
        type: 'prompt_injection',
        action: 'append_instruction',
        parameters: {
          instruction: 'CALL TO ACTION: Include a clear, prominent CTA button or text. Use contrasting color to make it stand out. Action words like "Register Now", "Learn More", "Join Us". Place in lower third of design.',
          priority: 'high',
        },
      },
    },
    formatIds: ['flyer'],
    confidence: 0.8,
  },
]

// =============================================================================
// COMBINED EXPORT
// =============================================================================

export const PRE_SEEDED_PATTERNS: PreSeededPattern[] = [
  ...TEXT_READABILITY_PATTERNS,
  ...LOGO_PATTERNS,
  ...COLOR_PATTERNS,
  ...COMPOSITION_PATTERNS,
  ...FORMAT_SPECIFIC_PATTERNS,
]

/**
 * Get pattern count by category
 */
export function getPatternCountByCategory(): Record<PatternCategory, number> {
  return PRE_SEEDED_PATTERNS.reduce((acc, p) => {
    acc[p.category] = (acc[p.category] || 0) + 1
    return acc
  }, {} as Record<PatternCategory, number>)
}

/**
 * Get patterns for a specific format
 */
export function getPatternsForFormat(formatId: string): PreSeededPattern[] {
  return PRE_SEEDED_PATTERNS.filter(p =>
    p.formatIds.length === 0 || p.formatIds.includes(formatId)
  )
}

/**
 * Total pattern count
 */
export const TOTAL_PATTERN_COUNT = PRE_SEEDED_PATTERNS.length

console.log(`[Pre-Seeded Patterns] Loaded ${TOTAL_PATTERN_COUNT} patterns`)
