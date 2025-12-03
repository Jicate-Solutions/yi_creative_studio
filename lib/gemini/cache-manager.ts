/**
 * Gemini Cache Manager Service
 * Manages context caching for cost-effective AI field generation
 *
 * Benefits:
 * - 90% cost savings on cached tokens (Gemini 2.5)
 * - 75% cost savings on cached tokens (Gemini 2.0)
 * - Reduced latency for repeated prompts
 */

import { GoogleGenerativeAI, CachedContent } from '@google/generative-ai'

// ============================================================================
// Types
// ============================================================================

export interface CacheConfig {
  displayName: string
  systemInstruction: string
  ttlSeconds: number
}

export interface CachedContentUsage {
  promptTokenCount: number
  cachedContentTokenCount: number
  candidatesTokenCount: number
  totalTokenCount: number
}

export interface CacheResponse {
  cacheName: string
  model: string
  displayName: string
  expirationTime: string
}

export interface GenerateResponse<T = unknown> {
  data: T
  usage: CachedContentUsage
  cached: boolean
}

// ============================================================================
// Constants
// ============================================================================

const MODEL_NAME = 'gemini-2.0-flash-001'
const DEFAULT_TTL = 3600 // 1 hour

// ============================================================================
// In-Memory Cache for Generated Schemas
// ============================================================================

interface InMemoryCache<T> {
  data: T
  expiresAt: number
}

const schemaCache = new Map<string, InMemoryCache<unknown>>()
const SCHEMA_CACHE_TTL = 5 * 60 * 1000 // 5 minutes

function getCacheKey(formatId: string, verticalSlug: string): string {
  return `${formatId}:${verticalSlug}`
}

function getFromMemoryCache<T>(key: string): T | null {
  const cached = schemaCache.get(key)
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data as T
  }
  schemaCache.delete(key)
  return null
}

function setInMemoryCache<T>(key: string, data: T, ttlMs: number = SCHEMA_CACHE_TTL): void {
  schemaCache.set(key, {
    data,
    expiresAt: Date.now() + ttlMs,
  })
}

// ============================================================================
// Gemini Cache Manager Class
// ============================================================================

class GeminiCacheManager {
  private client: GoogleGenerativeAI | null = null
  private modelName: string = MODEL_NAME
  private activeCacheName: string | null = null

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY
    if (apiKey) {
      this.client = new GoogleGenerativeAI(apiKey)
    }
  }

  /**
   * Check if the client is initialized
   */
  isInitialized(): boolean {
    return this.client !== null
  }

  /**
   * Get the active cache name
   */
  getActiveCacheName(): string | null {
    return this.activeCacheName
  }

  /**
   * Generate content with optional context caching
   * Uses direct API call for better control over caching
   */
  async generateContent<T>(
    systemPrompt: string,
    userPrompt: string,
    options: {
      temperature?: number
      maxTokens?: number
      cacheKey?: string // For in-memory caching
    } = {}
  ): Promise<GenerateResponse<T>> {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not set')
    }

    // Check in-memory cache first
    if (options.cacheKey) {
      const cached = getFromMemoryCache<T>(options.cacheKey)
      if (cached) {
        return {
          data: cached,
          usage: {
            promptTokenCount: 0,
            cachedContentTokenCount: 0,
            candidatesTokenCount: 0,
            totalTokenCount: 0,
          },
          cached: true,
        }
      }
    }

    const { temperature = 0.7, maxTokens = 2048 } = options

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${this.modelName}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: {
              parts: [{ text: systemPrompt }],
            },
            contents: [
              {
                role: 'user',
                parts: [{ text: userPrompt }],
              },
            ],
            generationConfig: {
              temperature,
              maxOutputTokens: maxTokens,
              responseMimeType: 'application/json',
            },
          }),
        }
      )

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Gemini API error:', errorText)
        throw new Error(`Gemini API request failed: ${response.status}`)
      }

      const result = await response.json()
      const textContent = result.candidates?.[0]?.content?.parts?.[0]?.text

      if (!textContent) {
        throw new Error('No text content in Gemini response')
      }

      // Parse JSON response - handle potential markdown wrapping
      let jsonText = textContent.trim()
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/^```json\n?/, '').replace(/\n?```$/, '')
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/^```\n?/, '').replace(/\n?```$/, '')
      }

      const data = JSON.parse(jsonText) as T

      // Cache the result
      if (options.cacheKey) {
        setInMemoryCache(options.cacheKey, data)
      }

      const usage: CachedContentUsage = {
        promptTokenCount: result.usageMetadata?.promptTokenCount || 0,
        cachedContentTokenCount: result.usageMetadata?.cachedContentTokenCount || 0,
        candidatesTokenCount: result.usageMetadata?.candidatesTokenCount || 0,
        totalTokenCount: result.usageMetadata?.totalTokenCount || 0,
      }

      return {
        data,
        usage,
        cached: false,
      }
    } catch (error) {
      console.error('Gemini generateContent error:', error)
      throw error
    }
  }

  /**
   * Generate content with timeout
   */
  async generateContentWithTimeout<T>(
    systemPrompt: string,
    userPrompt: string,
    timeoutMs: number = 8000,
    options: {
      temperature?: number
      maxTokens?: number
      cacheKey?: string
    } = {}
  ): Promise<GenerateResponse<T>> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const result = await Promise.race([
        this.generateContent<T>(systemPrompt, userPrompt, options),
        new Promise<never>((_, reject) => {
          controller.signal.addEventListener('abort', () => {
            reject(new Error('AI_TIMEOUT'))
          })
        }),
      ])

      clearTimeout(timeoutId)
      return result
    } catch (error) {
      clearTimeout(timeoutId)
      throw error
    }
  }

  /**
   * Clear the in-memory cache
   */
  clearCache(key?: string): void {
    if (key) {
      schemaCache.delete(key)
    } else {
      schemaCache.clear()
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: schemaCache.size,
      keys: Array.from(schemaCache.keys()),
    }
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

export const geminiCacheManager = new GeminiCacheManager()

// Re-export helpers for external use
export { getCacheKey, getFromMemoryCache, setInMemoryCache }
