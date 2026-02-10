/**
 * JSON Repair Utility
 * Robust functions for fixing broken or truncated JSON from LLMs
 * v12.0: Added jsonrepair library for handling unquoted property names
 */

import { jsonrepair } from 'jsonrepair'

/**
 * Repair truncated JSON string by closing open structures
 * Useful when LLM output hits max token limit
 */
export function repairTruncatedJSON(json: string): string {
    let repaired = json.trim()

    // 1. Remove trailing comma if present (common in arrays/objects)
    if (repaired.endsWith(',')) {
        repaired = repaired.slice(0, -1)
    }

    // 2. Count open brackets/braces to determine what's missing
    let openBraces = 0
    let openBrackets = 0
    let inString = false
    let escaped = false

    for (let i = 0; i < repaired.length; i++) {
        const char = repaired[i]
        if (char === '\\' && !escaped) {
            escaped = true
            continue
        }

        if (char === '"' && !escaped) {
            inString = !inString
        }

        if (!inString) {
            if (char === '{') openBraces++
            if (char === '}') openBraces--
            if (char === '[') openBrackets++
            if (char === ']') openBrackets--
        }

        escaped = false
    }

    // 3. Close open strings if truncated inside a string
    if (inString) {
        repaired += '"'
    }

    // 4. Close arrays/objects in reverse order of expected nesting
    // Heuristic: Usually we just need to close } or ] to finish the structure
    while (openBrackets > 0) {
        repaired += ']'
        openBrackets--
    }

    while (openBraces > 0) {
        repaired += '}'
        openBraces--
    }

    return repaired
}

/**
 * Clean JSON string (remove markdown blocks, comments, etc)
 */
export function cleanJSON(text: string): string {
    let cleaned = text.trim()

    // Remove markdown code blocks
    if (cleaned.startsWith('```json')) {
        cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '')
    } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '')
    }

    return cleaned
}

/**
 * Safe parse with auto-repair
 * v12.0: Added jsonrepair library as second attempt for handling unquoted property names,
 * trailing commas, and other syntax errors that our manual repair doesn't catch
 */
export function safeJsonParse<T>(text: string, fallback?: T): T {
    const cleaned = cleanJSON(text)

    // First attempt: Direct parse
    try {
        return JSON.parse(cleaned)
    } catch (e1) {
        // Second attempt: Use jsonrepair library (handles unquoted keys, trailing commas, etc.)
        try {
            const repairedByLibrary = jsonrepair(cleaned)
            console.log('[safeJsonParse] Fixed with jsonrepair library')
            return JSON.parse(repairedByLibrary)
        } catch (e2) {
            // Third attempt: Manual truncation repair (for closing brackets/braces)
            try {
                const repairedManually = repairTruncatedJSON(cleaned)
                return JSON.parse(repairedManually)
            } catch (e3) {
                // Fourth attempt: jsonrepair on manually repaired string
                try {
                    const repairedManually = repairTruncatedJSON(cleaned)
                    const finalRepair = jsonrepair(repairedManually)
                    console.log('[safeJsonParse] Fixed with combined repair approach')
                    return JSON.parse(finalRepair)
                } catch (e4) {
                    console.error('[safeJsonParse] All repair attempts failed:', e4)
                    if (fallback !== undefined) return fallback
                    throw new Error(`Failed to parse JSON even after repair: ${e4}`)
                }
            }
        }
    }
}

/**
 * Validate colorMapping structure from AI responses
 * Ensures all required roles exist with complete hex codes
 *
 * v1.0: Added to prevent crashes from truncated AI responses
 */
export function validateColorMapping(colorMapping: any): boolean {
    if (!colorMapping || typeof colorMapping !== 'object') {
        console.warn('[validateColorMapping] colorMapping is null or not an object')
        return false
    }

    const requiredRoles = ['hero', 'headline', 'body', 'cta', 'caption']

    for (const role of requiredRoles) {
        // Check if role exists
        if (!colorMapping[role]) {
            console.warn(`[validateColorMapping] Missing required role: ${role}`)
            return false
        }

        const colorObj = colorMapping[role]

        // Check if color property exists
        if (!colorObj.color) {
            console.warn(`[validateColorMapping] Missing color property for role: ${role}`)
            return false
        }

        // Check if description exists (not strictly required but good to have)
        if (!colorObj.description) {
            console.warn(`[validateColorMapping] Missing description for role: ${role} (non-fatal)`)
            // Don't fail on missing description, just warn
        }

        // Validate hex code completeness (must be 7 chars: #RRGGBB)
        const color = colorObj.color
        if (color.startsWith('#')) {
            if (color.length !== 7) {
                console.warn(`[validateColorMapping] Incomplete hex code for role '${role}': ${color} (expected 7 chars, got ${color.length})`)
                return false
            }

            // Validate hex format (only hex chars after #)
            if (!/^#[0-9A-Fa-f]{6}$/.test(color)) {
                console.warn(`[validateColorMapping] Invalid hex format for role '${role}': ${color}`)
                return false
            }
        }
        // For non-hex colors (like 'white', 'black'), allow them through
    }

    console.log('[validateColorMapping] ✓ All color roles validated successfully')
    return true
}
