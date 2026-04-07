/**
 * Design Context Sanitizer
 *
 * Filters out risky single-word keywords from Design Intelligence output
 * to prevent Gemini from rendering them as visible text labels.
 *
 * CRITICAL FIX: Design Intelligence may generate single-word visualElements
 * like "innovation", "networking", "celebration" which Gemini interprets
 * as TEXT to render, not visual guidance. This sanitizer filters them out.
 */

import type { DesignContext } from '@/lib/prompts/services/yi-prompt-builder/types'

/**
 * Sanitizes Design Intelligence output to prevent text label leakage
 * Filters out single-word descriptors that Gemini renders as visible text
 *
 * @param context - The raw Design Context from Design Intelligence
 * @returns Sanitized Design Context with risky keywords filtered
 */
export function sanitizeDesignContext(context: DesignContext): DesignContext {
  // Patterns that indicate text labels (not visual descriptions)
  const textLabelPatterns = [
    /^(networking|innovation|celebration|tech|ai|leadership|collaboration)s?$/i,
    /^(conference|workshop|seminar|summit|meetup|gathering|session)s?$/i,
    /^(professional|creative|modern|digital|smart|insights|workshops)s?$/i,
  ];

  /**
   * Sanitizes an array of visual elements, filtering out risky keywords
   */
  const sanitizeArray = (items: string[] | undefined): string[] | undefined => {
    if (!items) return items;

    const sanitized = items.map(item => {
      const trimmed = item.trim();

      // Check if this is a risky single-word descriptor
      const isTextLabel = textLabelPatterns.some(pattern => pattern.test(trimmed));

      if (isTextLabel) {
        console.warn(`[Design Context Sanitizer] FILTERED: "${item}" (would render as text)`);
        console.warn(`[Design Context Sanitizer] This keyword would have appeared as visible text in the image`);
        return '';
      }

      // Keep multi-word visual descriptions
      return trimmed;
    }).filter(item => item.length > 0);

    // Log summary if any items were filtered
    const filteredCount = items.length - sanitized.length;
    if (filteredCount > 0) {
      console.warn(`[Design Context Sanitizer] ⚠️ Filtered ${filteredCount} risky keyword(s) from visualElements`);
    }

    return sanitized;
  };

  const sanitizedContext: DesignContext = {
    ...context,
    visualElements: sanitizeArray(context.visualElements),
    iconicImagery: sanitizeArray(context.iconicImagery),
  };

  // Sanitize decorative elements (thematicElements array)
  if (context.decorativeElementsContext?.thematicElements) {
    sanitizedContext.decorativeElementsContext = {
      ...context.decorativeElementsContext,
      thematicElements: context.decorativeElementsContext.thematicElements.map(el => {
        // Guard: skip if element is missing or not a string
        if (!el.element || typeof el.element !== 'string') return el;

        // Filter out risky single-word keywords from element descriptions
        let sanitizedElement = el.element;

        textLabelPatterns.forEach(pattern => {
          const match = sanitizedElement.match(pattern);
          if (match) {
            const originalElement = sanitizedElement;
            sanitizedElement = sanitizedElement.replace(pattern, '').trim();

            if (sanitizedElement !== originalElement) {
              console.warn(
                `[Design Context Sanitizer] Cleaned thematicElement: "${originalElement}" → "${sanitizedElement}"`
              );
            }
          }
        });

        return {
          ...el,
          element: sanitizedElement || el.element, // Fallback to original if fully stripped
        };
      }),
    };
  }

  return sanitizedContext;
}
