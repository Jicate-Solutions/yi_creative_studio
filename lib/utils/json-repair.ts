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
