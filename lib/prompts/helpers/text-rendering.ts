/**
 * SOTA Text Rendering Helpers
 * Based on "Nano Banana Pro" guide: Text Rendering Best Practices
 * - Explicit quoting with legibility instructions
 * - Role-based text styling
 */

import type { CreativeContent } from '../types'
import { getEnhancedTypographyDirection } from '../languageConfigs'

type TextRole = 'headline' | 'subheadline' | 'body' | 'label' | 'accent'
type TextEmphasis = 'high' | 'medium' | 'low'

/**
 * Quote text for SOTA text rendering
 * Based on guide: "Clearly specify the text you want in quotes"
 */
export function quoteTextForRendering(
  text: string,
  role: TextRole,
  emphasis: TextEmphasis
): string {
  const emphasisPrefix = {
    high: 'Display the exact text',
    medium: 'Include the text',
    low: 'Show the text'
  }[emphasis]

  const roleInstructions = {
    headline: 'as a bold, prominent headline with maximum legibility and visual impact',
    subheadline: 'as a clear secondary heading that supports the main headline',
    body: 'in readable body text with comfortable reading size',
    label: 'as a small but clearly legible label or detail',
    accent: 'as a decorative accent element that adds visual interest'
  }[role]

  return `${emphasisPrefix} "${text}" ${roleInstructions}. Ensure this text is rendered clearly and legibly with appropriate contrast against the background.`
}

/**
 * Build complete text rendering section for prompts
 * Extracts all text from content and creates rendering instructions
 */
export function buildTextRenderingSection(content: CreativeContent): string {
  const textElements: string[] = []

  // Event name - highest priority, headline
  if (content.eventName) {
    textElements.push(quoteTextForRendering(
      content.eventName,
      'headline',
      'high'
    ))
  }

  // Guest name and designation - subheadline prominence
  if (content.guestName) {
    const guestText = content.guestDesignation
      ? `${content.guestName}, ${content.guestDesignation}`
      : content.guestName
    textElements.push(quoteTextForRendering(
      guestText,
      'subheadline',
      'medium'
    ))
  }

  // Date and time - body text
  if (content.date || content.time) {
    const dateTimeText = [content.date, content.time]
      .filter(Boolean)
      .join(' | ')
    if (dateTimeText) {
      textElements.push(quoteTextForRendering(
        dateTimeText,
        'body',
        'medium'
      ))
    }
  }

  // Venue - body text
  if (content.venue) {
    const venueText = content.hall
      ? `${content.venue}, ${content.hall}`
      : content.venue
    textElements.push(quoteTextForRendering(
      venueText,
      'body',
      'low'
    ))
  }

  // Additional text - accent/label
  if (content.additionalText) {
    textElements.push(quoteTextForRendering(
      content.additionalText,
      'accent',
      'low'
    ))
  }

  if (textElements.length === 0) {
    return ''
  }

  return `${textElements.join('\n')}

Ensure all text is clearly legible with high contrast against backgrounds. Use text shadows, outlines, or background treatments where needed for readability. Maintain consistent typographic hierarchy and never truncate or modify the quoted text.`
}

/**
 * Build compact text list for Ideogram (shorter prompts)
 * Ideogram prefers more concise text instructions
 */
export function buildTextListForIdeogram(content: CreativeContent): string[] {
  const textItems: string[] = []

  if (content.eventName) {
    textItems.push(`text "${content.eventName}"`)
  }

  if (content.guestName) {
    const guestText = content.guestDesignation
      ? `${content.guestName}, ${content.guestDesignation}`
      : content.guestName
    textItems.push(`speaker "${guestText}"`)
  }

  const eventDetails: string[] = []
  if (content.date) eventDetails.push(content.date)
  if (content.time) eventDetails.push(content.time)
  if (content.venue) eventDetails.push(content.venue)

  if (eventDetails.length > 0) {
    textItems.push(`displaying "${eventDetails.join(' | ')}"`)
  }

  return textItems
}

/**
 * Get typography direction based on language
 * Now uses the comprehensive language configuration for proper guidance
 */
export function getTypographyDirection(language: string, languageLabel: string): string {
  // Use the enhanced typography direction from languageConfigs
  // This provides detailed language-specific typography guidance
  return getEnhancedTypographyDirection(language)
}

/**
 * Validate that all required text will fit in the design
 * Returns warnings if text might be too long
 */
export function validateTextContent(content: CreativeContent): string[] {
  const warnings: string[] = []

  if (content.eventName && content.eventName.length > 60) {
    warnings.push('Event name is very long - consider using a shorter version for better visual impact')
  }

  if (content.guestName && content.guestDesignation) {
    const guestLength = content.guestName.length + content.guestDesignation.length
    if (guestLength > 50) {
      warnings.push('Guest name and designation combined are quite long - may require smaller text')
    }
  }

  if (content.additionalText && content.additionalText.length > 100) {
    warnings.push('Additional text is long - may need to be summarized for visual clarity')
  }

  return warnings
}
