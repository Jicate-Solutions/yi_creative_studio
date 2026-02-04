/**
 * Prompt Caching Service
 *
 * Implements caching strategies for:
 * - Claude: Prompt caching with cache_control blocks
 * - Gemini: Context caching for repeated system prompts
 * - In-memory LRU cache for response deduplication
 */

import { CACHE_CONFIG } from './config'

// ============================================================
// IN-MEMORY LRU CACHE
// ============================================================

interface CacheEntry<T> {
  value: T
  timestamp: number
  hits: number
}

class LRUCache<T> {
  private cache: Map<string, CacheEntry<T>> = new Map()
  private maxSize: number
  private ttlMs: number

  constructor(maxSize: number = 1000, ttlSeconds: number = 3600) {
    this.maxSize = maxSize
    this.ttlMs = ttlSeconds * 1000
  }

  get(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    // Check TTL
    if (Date.now() - entry.timestamp > this.ttlMs) {
      this.cache.delete(key)
      return null
    }

    // Update hits and move to end (most recently used)
    entry.hits++
    this.cache.delete(key)
    this.cache.set(key, entry)

    return entry.value
  }

  set(key: string, value: T): void {
    // Evict oldest entries if at capacity
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value
      if (firstKey) this.cache.delete(firstKey)
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      hits: 0,
    })
  }

  has(key: string): boolean {
    return this.get(key) !== null
  }

  clear(): void {
    this.cache.clear()
  }

  stats(): { size: number; maxSize: number; hitRate: number } {
    let totalHits = 0
    let totalEntries = 0
    for (const entry of this.cache.values()) {
      totalHits += entry.hits
      totalEntries++
    }
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: totalEntries > 0 ? totalHits / totalEntries : 0,
    }
  }
}

// Global cache instances
const designContextCache = new LRUCache<unknown>(
  CACHE_CONFIG.maxEntries,
  CACHE_CONFIG.ttlSeconds
)
const ultraProPromptCache = new LRUCache<unknown>(
  CACHE_CONFIG.maxEntries,
  CACHE_CONFIG.ttlSeconds
)

// ============================================================
// CACHE KEY GENERATION
// ============================================================

/**
 * Generate a cache key for Design Context requests
 * Based on: formatId + eventType + theme + style
 */
export function generateDesignContextCacheKey(params: {
  formatId?: string
  eventType?: string
  eventName?: string
  theme?: string
  style?: string
  hasSpeakerPhoto?: boolean
}): string {
  const parts = [
    'v2', // Cache version - change to invalidate old entries
    CACHE_CONFIG.keyPrefix,
    'dc', // design context
    params.formatId || 'default',
    params.eventType || 'general',
    params.theme || 'none',
    params.style || 'none',
    params.hasSpeakerPhoto ? 'speaker' : 'no_speaker',
  ]

  // Use full event name with strong hash for collision resistance
  if (params.eventName && params.eventName.trim().length > 0) {
    const nameHash = strongHash(params.eventName)
    parts.push(`event_${nameHash}`)
  }

  return parts.join(':')
}

/**
 * Generate a cache key for Ultra-Pro Prompt requests
 * Based on: formatId + eventName hash + key field values
 * v5.5: Added variationSeed to force unique keys for creative formats
 */
export function generateUltraProCacheKey(params: {
  formatId?: string
  eventName?: string
  eventType?: string
  hasSpeaker?: boolean
  hasVenue?: boolean
  variationSeed?: string // NEW: Forces unique cache key for creative variation
}): string {
  const parts = [
    CACHE_CONFIG.keyPrefix,
    'up', // ultra pro
    params.formatId || 'default',
    params.eventType || 'general',
    params.hasSpeaker ? 'speaker' : 'no_speaker',
    params.hasVenue ? 'venue' : 'no_venue',
  ]

  if (params.eventName) {
    const nameHash = strongHash(params.eventName)
    parts.push(nameHash)
  }

  // NEW: Add variation seed for creative formats (v5.5)
  if (params.variationSeed) {
    parts.push(params.variationSeed)
  }

  return parts.join(':')
}

/**
 * Strong hash function for cache key generation
 * Uses DJB2 + FNV-1a combination for collision resistance
 */
function strongHash(str: string): string {
  // Use DJB2 hash (better distribution)
  let hash = 5381
  const normalized = str.toLowerCase().trim()

  for (let i = 0; i < normalized.length; i++) {
    hash = ((hash << 5) + hash) + normalized.charCodeAt(i)
  }

  // Second pass with FNV-1a for collision resistance
  let hash2 = 2166136261
  for (let i = 0; i < normalized.length; i++) {
    hash2 ^= normalized.charCodeAt(i)
    hash2 += (hash2 << 1) + (hash2 << 4) + (hash2 << 7) + (hash2 << 8) + (hash2 << 24)
  }

  // Combine and encode
  const combined = (Math.abs(hash) ^ Math.abs(hash2)).toString(36)
  return combined.substring(0, 12)
}

// ============================================================
// CACHE OPERATIONS
// ============================================================

/**
 * Get cached Design Context
 */
export function getCachedDesignContext(key: string): unknown | null {
  if (!CACHE_CONFIG.enabled) return null
  const cached = designContextCache.get(key)
  if (cached) {
    console.log('[Cache] Design Context HIT:', key)
  }
  return cached
}

/**
 * Set cached Design Context
 */
export function setCachedDesignContext(key: string, value: unknown): void {
  if (!CACHE_CONFIG.enabled) return
  designContextCache.set(key, value)
  console.log('[Cache] Design Context STORED:', key)
}

/**
 * Get cached Ultra-Pro Prompt
 */
export function getCachedUltraProPrompt(key: string): unknown | null {
  if (!CACHE_CONFIG.enabled) return null
  const cached = ultraProPromptCache.get(key)
  if (cached) {
    console.log('[Cache] Ultra-Pro Prompt HIT:', key)
  }
  return cached
}

/**
 * Set cached Ultra-Pro Prompt
 */
export function setCachedUltraProPrompt(key: string, value: unknown): void {
  if (!CACHE_CONFIG.enabled) return
  ultraProPromptCache.set(key, value)
  console.log('[Cache] Ultra-Pro Prompt STORED:', key)
}

/**
 * Clear all prompt caches
 */
export function clearPromptCaches(): void {
  designContextCache.clear()
  ultraProPromptCache.clear()
  console.log('[Cache] All prompt caches cleared')
}

/**
 * Get cache statistics
 */
export function getPromptCacheStats(): {
  designContext: { size: number; maxSize: number; hitRate: number }
  ultraProPrompt: { size: number; maxSize: number; hitRate: number }
} {
  return {
    designContext: designContextCache.stats(),
    ultraProPrompt: ultraProPromptCache.stats(),
  }
}

// ============================================================
// CLAUDE PROMPT CACHING HELPERS
// ============================================================

/**
 * Format system prompt for Claude with cache_control
 * This enables Claude's prompt caching feature for long system prompts
 *
 * @see https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching
 */
export interface ClaudeCacheableMessage {
  role: 'user' | 'assistant'
  content: string | Array<{
    type: 'text'
    text: string
    cache_control?: { type: 'ephemeral' }
  }>
}

/**
 * Wrap a system prompt for Claude caching
 * The cache_control: ephemeral flag tells Claude to cache this content
 */
export function wrapForClaudeCache(systemPrompt: string): Array<{
  type: 'text'
  text: string
  cache_control: { type: 'ephemeral' }
}> {
  return [
    {
      type: 'text',
      text: systemPrompt,
      cache_control: { type: 'ephemeral' },
    },
  ]
}

/**
 * Create a Claude message with cacheable system prompt
 */
export function createClaudeCacheableRequest(
  systemPrompt: string,
  userMessage: string
): {
  system: Array<{ type: 'text'; text: string; cache_control?: { type: 'ephemeral' } }>
  messages: Array<{ role: 'user'; content: string }>
} {
  return {
    system: [
      {
        type: 'text',
        text: systemPrompt,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [
      {
        role: 'user',
        content: userMessage,
      },
    ],
  }
}

// ============================================================
// GEMINI CONTEXT CACHING HELPERS
// ============================================================

/**
 * Gemini cached content metadata
 * For tracking cached context across requests
 */
interface GeminiCachedContent {
  name: string
  displayName: string
  createTime: string
  expireTime: string
  model: string
}

// Store for Gemini cached content references
const geminiCachedContents: Map<string, GeminiCachedContent> = new Map()

/**
 * Check if we have a valid Gemini cached context
 */
export function hasValidGeminiCache(cacheKey: string): boolean {
  const cached = geminiCachedContents.get(cacheKey)
  if (!cached) return false

  // Check if expired
  const expireTime = new Date(cached.expireTime)
  if (expireTime <= new Date()) {
    geminiCachedContents.delete(cacheKey)
    return false
  }

  return true
}

/**
 * Store Gemini cached content reference
 */
export function setGeminiCachedContent(cacheKey: string, content: GeminiCachedContent): void {
  geminiCachedContents.set(cacheKey, content)
  console.log('[Gemini Cache] Stored cached content:', cacheKey)
}

/**
 * Get Gemini cached content name for API calls
 */
export function getGeminiCachedContentName(cacheKey: string): string | null {
  const cached = geminiCachedContents.get(cacheKey)
  return cached?.name || null
}

/**
 * Prepare content for Gemini caching
 * Returns the structure needed for createCachedContent API
 *
 * @see https://ai.google.dev/gemini-api/docs/caching
 */
export function prepareGeminiCacheContent(
  systemPrompt: string,
  // v25.0: Updated default from deprecated gemini-2.0-flash-exp
  model: string = 'gemini-2.5-flash',
  ttlSeconds: number = 3600
): {
  model: string
  displayName: string
  contents: Array<{ role: 'user'; parts: Array<{ text: string }> }>
  ttl: string
} {
  return {
    model: `models/${model}`,
    displayName: `prompt_cache_${Date.now()}`,
    contents: [
      {
        role: 'user',
        parts: [{ text: systemPrompt }],
      },
    ],
    ttl: `${ttlSeconds}s`,
  }
}
