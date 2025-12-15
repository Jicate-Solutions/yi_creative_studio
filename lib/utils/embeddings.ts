/**
 * Embeddings Utility for Semantic Pattern Matching
 *
 * Uses Google's text-embedding-004 model for generating embeddings
 * that enable semantic similarity matching in the Feedback Learning Agent.
 *
 * @version 4.0
 */

import { GoogleGenerativeAI } from '@google/generative-ai'

// ============================================================
// TYPES
// ============================================================

export interface EmbeddingResult {
  embedding: number[]
  text: string
  model: string
  tokensUsed?: number
}

export interface SimilarityResult {
  score: number
  isMatch: boolean
  threshold: number
}

// ============================================================
// CONFIGURATION
// ============================================================

const EMBEDDING_MODEL = 'text-embedding-004'
const DEFAULT_SIMILARITY_THRESHOLD = 0.65

// ============================================================
// EMBEDDING GENERATION
// ============================================================

/**
 * Generate an embedding vector for the given text
 *
 * Uses Google's text-embedding-004 model which produces 768-dimensional vectors.
 *
 * @param text - The text to generate an embedding for
 * @returns The embedding vector as an array of numbers
 * @throws Error if GEMINI_API_KEY is not configured
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not configured for embedding generation')
  }

  // Truncate very long texts to avoid API limits
  const truncatedText = text.length > 2000 ? text.substring(0, 2000) : text

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: EMBEDDING_MODEL })

  const result = await model.embedContent(truncatedText)
  return result.embedding.values
}

/**
 * Generate an embedding with metadata
 *
 * @param text - The text to generate an embedding for
 * @returns EmbeddingResult with embedding and metadata
 */
export async function generateEmbeddingWithMetadata(text: string): Promise<EmbeddingResult> {
  const embedding = await generateEmbedding(text)
  return {
    embedding,
    text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
    model: EMBEDDING_MODEL,
  }
}

/**
 * Generate embeddings for multiple texts in batch
 *
 * @param texts - Array of texts to generate embeddings for
 * @returns Array of embeddings in the same order as input texts
 */
export async function generateEmbeddingsBatch(texts: string[]): Promise<number[][]> {
  // Process in parallel with a concurrency limit to avoid rate limits
  const BATCH_SIZE = 5
  const results: number[][] = []

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE)
    const batchResults = await Promise.all(batch.map(text => generateEmbedding(text)))
    results.push(...batchResults)
  }

  return results
}

// ============================================================
// SIMILARITY CALCULATIONS
// ============================================================

/**
 * Calculate cosine similarity between two embedding vectors
 *
 * Cosine similarity measures the angle between two vectors,
 * returning a value between -1 (opposite) and 1 (identical).
 * For normalized embeddings, this effectively measures semantic similarity.
 *
 * @param a - First embedding vector
 * @param b - Second embedding vector
 * @returns Cosine similarity score between -1 and 1
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(`Embedding dimensions must match: ${a.length} vs ${b.length}`)
  }

  let dotProduct = 0
  let magnitudeA = 0
  let magnitudeB = 0

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i]
    magnitudeA += a[i] * a[i]
    magnitudeB += b[i] * b[i]
  }

  magnitudeA = Math.sqrt(magnitudeA)
  magnitudeB = Math.sqrt(magnitudeB)

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0
  }

  return dotProduct / (magnitudeA * magnitudeB)
}

/**
 * Check if two embeddings are semantically similar
 *
 * @param a - First embedding vector
 * @param b - Second embedding vector
 * @param threshold - Similarity threshold (default: 0.65)
 * @returns SimilarityResult with score and match status
 */
export function checkSimilarity(
  a: number[],
  b: number[],
  threshold: number = DEFAULT_SIMILARITY_THRESHOLD
): SimilarityResult {
  const score = cosineSimilarity(a, b)
  return {
    score,
    isMatch: score >= threshold,
    threshold,
  }
}

/**
 * Find the most similar embedding from a list
 *
 * @param query - The query embedding to compare against
 * @param candidates - Array of candidate embeddings with IDs
 * @param threshold - Minimum similarity threshold (default: 0.65)
 * @returns Sorted array of matches above threshold
 */
export function findMostSimilar<T extends { id: string; embedding: number[] }>(
  query: number[],
  candidates: T[],
  threshold: number = DEFAULT_SIMILARITY_THRESHOLD
): Array<{ candidate: T; score: number }> {
  const results = candidates
    .map(candidate => ({
      candidate,
      score: cosineSimilarity(query, candidate.embedding),
    }))
    .filter(result => result.score >= threshold)
    .sort((a, b) => b.score - a.score)

  return results
}

// ============================================================
// SAFE WRAPPERS
// ============================================================

/**
 * Safe wrapper for generateEmbedding that never throws
 *
 * @param text - The text to generate an embedding for
 * @returns The embedding vector or null if generation fails
 */
export async function generateEmbeddingSafe(text: string): Promise<number[] | null> {
  try {
    return await generateEmbedding(text)
  } catch (error) {
    console.warn('[Embeddings] Failed to generate embedding:', error)
    return null
  }
}

/**
 * Safe wrapper for batch embedding generation
 *
 * @param texts - Array of texts to generate embeddings for
 * @returns Array of embeddings (null for failed items)
 */
export async function generateEmbeddingsBatchSafe(texts: string[]): Promise<(number[] | null)[]> {
  const results: (number[] | null)[] = []

  for (const text of texts) {
    const embedding = await generateEmbeddingSafe(text)
    results.push(embedding)
  }

  return results
}

// ============================================================
// UTILITIES
// ============================================================

/**
 * Normalize an embedding vector to unit length
 *
 * @param embedding - The embedding vector to normalize
 * @returns Normalized embedding vector
 */
export function normalizeEmbedding(embedding: number[]): number[] {
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0))
  if (magnitude === 0) return embedding
  return embedding.map(val => val / magnitude)
}

/**
 * Calculate the average of multiple embeddings
 *
 * Useful for creating a representative embedding from multiple examples.
 *
 * @param embeddings - Array of embedding vectors
 * @returns Average embedding vector
 */
export function averageEmbeddings(embeddings: number[][]): number[] {
  if (embeddings.length === 0) {
    throw new Error('Cannot average empty array of embeddings')
  }

  const dimension = embeddings[0].length
  const average = new Array(dimension).fill(0)

  for (const embedding of embeddings) {
    for (let i = 0; i < dimension; i++) {
      average[i] += embedding[i] / embeddings.length
    }
  }

  return average
}

/**
 * Convert embedding to a compact string representation for storage
 *
 * @param embedding - The embedding vector
 * @param precision - Decimal places to keep (default: 6)
 * @returns Compact string representation
 */
export function embedddingToString(embedding: number[], precision: number = 6): string {
  return embedding.map(v => v.toFixed(precision)).join(',')
}

/**
 * Parse a compact string representation back to an embedding
 *
 * @param str - The compact string representation
 * @returns The embedding vector
 */
export function stringToEmbedding(str: string): number[] {
  return str.split(',').map(v => parseFloat(v))
}
