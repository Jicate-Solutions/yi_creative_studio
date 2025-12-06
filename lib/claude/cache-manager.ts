/**
 * Claude Cache Manager Service
 * Manages in-memory caching for cost-effective AI field generation using Claude Haiku
 *
 * Benefits:
 * - Faster responses with in-memory caching
 * - Reduced API costs for repeated prompts
 * - Consistent interface with Gemini cache manager
 */

import Anthropic from '@anthropic-ai/sdk'

// ============================================================================
// Types
// ============================================================================

export interface CachedContentUsage {
  inputTokens: number
  outputTokens: number
  totalTokens: number
}

export interface GenerateResponse<T = unknown> {
  data: T
  usage: CachedContentUsage
  cached: boolean
}

// ============================================================================
// Constants
// ============================================================================

const MODEL_NAME = 'claude-haiku-4-5-20251001'

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
// Claude Cache Manager Class
// ============================================================================

class ClaudeCacheManager {
  private client: Anthropic | null = null
  private modelName: string = MODEL_NAME

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (apiKey) {
      this.client = new Anthropic({ apiKey })
    }
  }

  /**
   * Check if the client is initialized
   */
  isInitialized(): boolean {
    return this.client !== null
  }

  /**
   * Generate content with optional in-memory caching
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
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey || !this.client) {
      throw new Error('ANTHROPIC_API_KEY environment variable is not set')
    }

    // Check in-memory cache first
    if (options.cacheKey) {
      const cached = getFromMemoryCache<T>(options.cacheKey)
      if (cached) {
        return {
          data: cached,
          usage: {
            inputTokens: 0,
            outputTokens: 0,
            totalTokens: 0,
          },
          cached: true,
        }
      }
    }

    const { temperature = 0.7, maxTokens = 2048 } = options

    try {
      const response = await this.client.messages.create({
        model: this.modelName,
        max_tokens: maxTokens,
        temperature,
        system: systemPrompt + '\n\nIMPORTANT: Respond with valid JSON only. No markdown, no code blocks, just raw JSON.',
        messages: [
          {
            role: 'user',
            content: userPrompt,
          },
        ],
      })

      // Extract text content from response
      const textBlock = response.content.find((block) => block.type === 'text')
      if (!textBlock || textBlock.type !== 'text') {
        throw new Error('No text content in Claude response')
      }

      const textContent = textBlock.text

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
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens,
      }

      return {
        data,
        usage,
        cached: false,
      }
    } catch (error) {
      console.error('Claude generateContent error:', error)
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

export const claudeCacheManager = new ClaudeCacheManager()

// Re-export helpers for external use
export { getCacheKey, getFromMemoryCache, setInMemoryCache }
