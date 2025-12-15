/**
 * Pattern Cache - In-Memory Pattern Cache for <50ms Latency
 *
 * Singleton pattern cache that maintains patterns in memory for ultra-fast lookups.
 * Supports hot reload, version tracking, and organization-specific patterns.
 */

import type {
  CachedPattern,
  PatternCacheState,
  PatternCacheConfig,
  CacheLookupResult,
  PatternCategory,
  PatternMatch,
  IssueSignature,
  GenerationRequestSnapshot,
  PATTERN_CACHE_VERSION,
} from '@/types/learning.types'
import { createHash } from 'crypto'

// Default cache configuration
const DEFAULT_CACHE_CONFIG: PatternCacheConfig = {
  maxPatterns: 500,
  ttlSeconds: 3600,
  refreshIntervalMs: 60000,
  enableHotReload: true,
}

// In-memory cache storage
interface CacheStorage {
  patterns: Map<string, CachedPattern>
  byCategory: Map<PatternCategory, Set<string>>
  byFormat: Map<string, Set<string>>
  version: number
  hash: string
  lastUpdated: Date
  expiresAt: Date
}

class PatternCacheManager {
  private static instance: PatternCacheManager
  private cache: CacheStorage | null = null
  private config: PatternCacheConfig
  private refreshTimer: NodeJS.Timeout | null = null
  private isRefreshing = false
  private subscribers: Set<(version: number) => void> = new Set()

  private constructor(config: PatternCacheConfig = DEFAULT_CACHE_CONFIG) {
    this.config = config
  }

  static getInstance(config?: PatternCacheConfig): PatternCacheManager {
    if (!PatternCacheManager.instance) {
      PatternCacheManager.instance = new PatternCacheManager(config)
    }
    return PatternCacheManager.instance
  }

  /**
   * Initialize the cache with patterns from database
   */
  async initialize(): Promise<void> {
    if (this.cache && !this.isExpired()) {
      return // Cache is valid
    }

    await this.refresh()

    // Start auto-refresh if enabled
    if (this.config.enableHotReload && !this.refreshTimer) {
      this.refreshTimer = setInterval(
        () => this.checkAndRefresh(),
        this.config.refreshIntervalMs
      )
    }
  }

  /**
   * Refresh cache from database
   */
  async refresh(): Promise<CacheLookupResult> {
    if (this.isRefreshing) {
      // Wait for current refresh to complete
      return this.waitForRefresh()
    }

    this.isRefreshing = true
    const startTime = Date.now()

    try {
      // Dynamic import to avoid server/client issues
      const { createClient } = await import('@/lib/supabase/server')
      const supabase = await createClient()

      // Fetch active patterns
      const { data: patterns, error } = await (supabase.from as Function)('seeded_patterns')
        .select('id, pattern_key, category, issue_signature, fix_mapping, confidence, format_ids')
        .eq('is_active', true)
        .order('confidence', { ascending: false })
        .limit(this.config.maxPatterns)

      if (error) {
        console.error('[PatternCache] Error fetching patterns:', error)
        throw error
      }

      // Build new cache
      const newCache = this.buildCache(patterns || [])
      this.cache = newCache

      // Notify subscribers
      this.notifySubscribers(newCache.version)

      // Store cache state to database for multi-instance sync
      await this.persistCacheState(supabase, newCache)

      const lookupTimeMs = Date.now() - startTime
      console.log(`[PatternCache] Refreshed ${patterns?.length || 0} patterns in ${lookupTimeMs}ms`)

      return {
        hit: true,
        patterns: Array.from(newCache.patterns.values()),
        cacheVersion: newCache.version,
        lookupTimeMs,
      }
    } catch (error) {
      console.error('[PatternCache] Refresh failed:', error)
      return {
        hit: false,
        patterns: [],
        cacheVersion: 0,
        lookupTimeMs: Date.now() - startTime,
      }
    } finally {
      this.isRefreshing = false
    }
  }

  /**
   * Build cache data structures from patterns
   */
  private buildCache(patterns: Array<{
    id: string
    pattern_key: string
    category: PatternCategory
    issue_signature: IssueSignature
    fix_mapping: unknown
    confidence: number
    format_ids: string[]
  }>): CacheStorage {
    const patternMap = new Map<string, CachedPattern>()
    const byCategory = new Map<PatternCategory, Set<string>>()
    const byFormat = new Map<string, Set<string>>()

    for (const p of patterns) {
      const cached: CachedPattern = {
        id: p.id,
        patternKey: p.pattern_key,
        category: p.category,
        issueSignature: p.issue_signature,
        fixMapping: p.fix_mapping as CachedPattern['fixMapping'],
        confidence: p.confidence,
        formatIds: p.format_ids || [],
      }

      patternMap.set(p.id, cached)

      // Index by category
      if (!byCategory.has(p.category)) {
        byCategory.set(p.category, new Set())
      }
      byCategory.get(p.category)!.add(p.id)

      // Index by format
      for (const formatId of p.format_ids || []) {
        if (!byFormat.has(formatId)) {
          byFormat.set(formatId, new Set())
        }
        byFormat.get(formatId)!.add(p.id)
      }

      // Also add to '*' for patterns applicable to all formats
      if (!p.format_ids || p.format_ids.length === 0) {
        if (!byFormat.has('*')) {
          byFormat.set('*', new Set())
        }
        byFormat.get('*')!.add(p.id)
      }
    }

    const hash = this.computeHash(patterns)
    const now = new Date()

    return {
      patterns: patternMap,
      byCategory,
      byFormat,
      version: (this.cache?.version || 0) + 1,
      hash,
      lastUpdated: now,
      expiresAt: new Date(now.getTime() + this.config.ttlSeconds * 1000),
    }
  }

  /**
   * Compute hash of patterns for change detection
   */
  private computeHash(patterns: unknown[]): string {
    const content = JSON.stringify(patterns.map(p => (p as { id: string }).id).sort())
    return createHash('md5').update(content).digest('hex')
  }

  /**
   * Persist cache state to database for multi-instance sync
   */
  private async persistCacheState(supabase: unknown, cache: CacheStorage): Promise<void> {
    try {
      const snapshot = Array.from(cache.patterns.values())

      await ((supabase as { from: Function }).from as Function)('pattern_cache_state')
        .upsert({
          scope: 'global',
          cache_version: cache.version,
          patterns_hash: cache.hash,
          total_patterns: cache.patterns.size,
          patterns_snapshot: snapshot,
          last_updated: cache.lastUpdated.toISOString(),
          expires_at: cache.expiresAt.toISOString(),
        }, {
          onConflict: 'idx_cache_state_global',
        })
    } catch (error) {
      console.warn('[PatternCache] Failed to persist cache state:', error)
    }
  }

  /**
   * Check if cache needs refresh and refresh if necessary
   */
  private async checkAndRefresh(): Promise<void> {
    if (this.isExpired()) {
      await this.refresh()
    }
  }

  /**
   * Check if cache is expired
   */
  private isExpired(): boolean {
    if (!this.cache) return true
    return new Date() > this.cache.expiresAt
  }

  /**
   * Wait for ongoing refresh to complete
   */
  private async waitForRefresh(): Promise<CacheLookupResult> {
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (!this.isRefreshing && this.cache) {
          clearInterval(checkInterval)
          resolve({
            hit: true,
            patterns: Array.from(this.cache.patterns.values()),
            cacheVersion: this.cache.version,
            lookupTimeMs: 0,
          })
        }
      }, 10)

      // Timeout after 5 seconds
      setTimeout(() => {
        clearInterval(checkInterval)
        resolve({
          hit: false,
          patterns: [],
          cacheVersion: 0,
          lookupTimeMs: 5000,
        })
      }, 5000)
    })
  }

  /**
   * Fast pattern lookup by format
   */
  lookupByFormat(formatId: string): CachedPattern[] {
    if (!this.cache) return []

    const patternIds = new Set<string>()

    // Get format-specific patterns
    const formatPatterns = this.cache.byFormat.get(formatId)
    if (formatPatterns) {
      formatPatterns.forEach(id => patternIds.add(id))
    }

    // Get universal patterns (applicable to all formats)
    const universalPatterns = this.cache.byFormat.get('*')
    if (universalPatterns) {
      universalPatterns.forEach(id => patternIds.add(id))
    }

    return Array.from(patternIds)
      .map(id => this.cache!.patterns.get(id)!)
      .filter(Boolean)
  }

  /**
   * Fast pattern lookup by category
   */
  lookupByCategory(category: PatternCategory): CachedPattern[] {
    if (!this.cache) return []

    const patternIds = this.cache.byCategory.get(category)
    if (!patternIds) return []

    return Array.from(patternIds)
      .map(id => this.cache!.patterns.get(id)!)
      .filter(Boolean)
  }

  /**
   * Match patterns against a generation request
   * Returns matched patterns sorted by confidence
   */
  matchPatterns(request: GenerationRequestSnapshot): PatternMatch[] {
    if (!this.cache) return []

    const startTime = Date.now()
    const matches: PatternMatch[] = []

    // Get candidate patterns for this format
    const candidates = this.lookupByFormat(request.formatId)

    for (const pattern of candidates) {
      const matchResult = this.evaluateSignature(pattern, request)

      if (matchResult.matched) {
        matches.push({
          patternId: pattern.id,
          patternKey: pattern.patternKey,
          confidence: pattern.confidence * matchResult.score,
          matchedConditions: matchResult.matchedConditions,
          suggestedFix: pattern.fixMapping,
          reasoning: matchResult.reasoning,
        })
      }
    }

    // Sort by confidence descending
    matches.sort((a, b) => b.confidence - a.confidence)

    const lookupTimeMs = Date.now() - startTime
    if (lookupTimeMs > 20) {
      console.warn(`[PatternCache] Slow pattern matching: ${lookupTimeMs}ms for ${candidates.length} candidates`)
    }

    return matches
  }

  /**
   * Evaluate a pattern's signature against a request
   */
  private evaluateSignature(
    pattern: CachedPattern,
    request: GenerationRequestSnapshot
  ): { matched: boolean; score: number; matchedConditions: string[]; reasoning: string } {
    const signature = pattern.issueSignature
    const matchedConditions: string[] = []
    let totalWeight = 0
    let matchedWeight = 0

    // Check format exclusions
    if (signature.excludeFormats?.includes(request.formatId)) {
      return { matched: false, score: 0, matchedConditions: [], reasoning: 'Format excluded' }
    }

    // Check format requirements
    if (signature.formatSpecific?.length && !signature.formatSpecific.includes(request.formatId)) {
      return { matched: false, score: 0, matchedConditions: [], reasoning: 'Format not in specific list' }
    }

    // Check keyword matches
    if (signature.keywords?.length) {
      const requestText = JSON.stringify(request.formData).toLowerCase()
      const keywordMatches = signature.keywords.filter(kw =>
        requestText.includes(kw.toLowerCase())
      )

      if (keywordMatches.length > 0) {
        matchedConditions.push(`keywords: ${keywordMatches.join(', ')}`)
        matchedWeight += keywordMatches.length
      }
      totalWeight += signature.keywords.length
    }

    // Check conditions
    for (const condition of signature.conditions || []) {
      const weight = condition.weight || 1
      totalWeight += weight

      const conditionMet = this.evaluateCondition(condition, request)
      if (conditionMet) {
        matchedConditions.push(`${condition.field} ${condition.operator} ${condition.value}`)
        matchedWeight += weight
      }
    }

    // Calculate match score
    const score = totalWeight > 0 ? matchedWeight / totalWeight : 0
    const minConfidence = signature.minConfidence || 0.5

    const matched = score >= minConfidence && matchedConditions.length > 0

    return {
      matched,
      score,
      matchedConditions,
      reasoning: matched
        ? `Matched ${matchedConditions.length} conditions with score ${score.toFixed(2)}`
        : `Score ${score.toFixed(2)} below threshold ${minConfidence}`,
    }
  }

  /**
   * Evaluate a single condition
   */
  private evaluateCondition(
    condition: { field: string; operator: string; value: unknown },
    request: GenerationRequestSnapshot
  ): boolean {
    // Get field value from request using dot notation
    const fieldValue = this.getNestedValue(request, condition.field)

    switch (condition.operator) {
      case 'equals':
        return fieldValue === condition.value

      case 'contains':
        if (typeof fieldValue === 'string' && typeof condition.value === 'string') {
          return fieldValue.toLowerCase().includes(condition.value.toLowerCase())
        }
        if (Array.isArray(fieldValue) && typeof condition.value === 'string') {
          return fieldValue.some(v =>
            typeof v === 'string' && v.toLowerCase().includes(condition.value as string)
          )
        }
        return false

      case 'matches':
        if (typeof fieldValue === 'string' && typeof condition.value === 'string') {
          try {
            const regex = new RegExp(condition.value, 'i')
            return regex.test(fieldValue)
          } catch {
            return false
          }
        }
        return false

      case 'gt':
        return typeof fieldValue === 'number' && fieldValue > (condition.value as number)

      case 'lt':
        return typeof fieldValue === 'number' && fieldValue < (condition.value as number)

      case 'exists':
        return fieldValue !== undefined && fieldValue !== null && fieldValue !== ''

      case 'not_exists':
        return fieldValue === undefined || fieldValue === null || fieldValue === ''

      default:
        return false
    }
  }

  /**
   * Get nested value from object using dot notation
   */
  private getNestedValue(obj: unknown, path: string): unknown {
    const parts = path.split('.')
    let current: unknown = obj

    for (const part of parts) {
      if (current === null || current === undefined) return undefined
      if (typeof current !== 'object') return undefined
      current = (current as Record<string, unknown>)[part]
    }

    return current
  }

  /**
   * Subscribe to cache updates
   */
  subscribe(callback: (version: number) => void): () => void {
    this.subscribers.add(callback)
    return () => this.subscribers.delete(callback)
  }

  /**
   * Notify subscribers of cache update
   */
  private notifySubscribers(version: number): void {
    this.subscribers.forEach(callback => {
      try {
        callback(version)
      } catch (error) {
        console.error('[PatternCache] Subscriber error:', error)
      }
    })
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    totalPatterns: number
    cacheVersion: number
    lastUpdated: Date | null
    expiresAt: Date | null
    isExpired: boolean
    categoryCounts: Record<string, number>
    formatCounts: Record<string, number>
  } {
    if (!this.cache) {
      return {
        totalPatterns: 0,
        cacheVersion: 0,
        lastUpdated: null,
        expiresAt: null,
        isExpired: true,
        categoryCounts: {},
        formatCounts: {},
      }
    }

    const categoryCounts: Record<string, number> = {}
    this.cache.byCategory.forEach((ids, category) => {
      categoryCounts[category] = ids.size
    })

    const formatCounts: Record<string, number> = {}
    this.cache.byFormat.forEach((ids, format) => {
      formatCounts[format] = ids.size
    })

    return {
      totalPatterns: this.cache.patterns.size,
      cacheVersion: this.cache.version,
      lastUpdated: this.cache.lastUpdated,
      expiresAt: this.cache.expiresAt,
      isExpired: this.isExpired(),
      categoryCounts,
      formatCounts,
    }
  }

  /**
   * Check if cache is warm (has valid data)
   */
  isWarm(): boolean {
    return this.cache !== null && !this.isExpired()
  }

  /**
   * Get count of active patterns in cache
   */
  getActivePatternCount(): number {
    return this.cache?.patterns.size || 0
  }

  /**
   * Get last refresh time
   */
  getLastRefreshTime(): Date | null {
    return this.cache?.lastUpdated || null
  }

  /**
   * Get all patterns from cache
   */
  getAllPatterns(): CachedPattern[] {
    if (!this.cache) return []
    return Array.from(this.cache.patterns.values())
  }

  /**
   * Force invalidate cache
   */
  invalidate(): void {
    this.cache = null
    console.log('[PatternCache] Cache invalidated')
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer)
      this.refreshTimer = null
    }
    this.cache = null
    this.subscribers.clear()
  }
}

// Export singleton instance
export const patternCache = PatternCacheManager.getInstance()

// Export class for testing
export { PatternCacheManager }

// Convenience functions
export async function initializePatternCache(): Promise<void> {
  await patternCache.initialize()
}

export async function refreshPatternCache(): Promise<CacheLookupResult> {
  return patternCache.refresh()
}

export function matchPatternsFromCache(request: GenerationRequestSnapshot): PatternMatch[] {
  return patternCache.matchPatterns(request)
}

export function getCacheStats(): ReturnType<PatternCacheManager['getStats']> {
  return patternCache.getStats()
}

export function invalidatePatternCache(): void {
  patternCache.invalidate()
}
