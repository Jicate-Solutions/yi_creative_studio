/**
 * Stage 14b — Required-text verification (ai_native only)
 *
 * In ai_native mode the image model renders the copy, which can misspell or drop
 * lines. This checks — via a cheap Gemini-vision read — that each required string
 * is actually visible and correctly spelled. Non-blocking + graceful fallback.
 */

export interface TextVerificationResult {
  allPresent: boolean
  present: string[]
  missing: string[]
  source: 'ai' | 'fallback'
}

const VISION_MODEL = 'gemini-2.5-flash'

function normalize(s: string): string {
  return s.toLowerCase().replace(/[\s••|—–-]+/g, ' ').replace(/[^\w\s]/g, '').trim()
}

export async function verifyVisibleText(
  imageBase64: string,
  required: string[],
  options?: { signal?: AbortSignal; mimeType?: string }
): Promise<TextVerificationResult> {
  const cleanRequired = required.map((r) => r.trim()).filter(Boolean)
  if (cleanRequired.length === 0) {
    return { allPresent: true, present: [], missing: [], source: 'fallback' }
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY
  if (!apiKey) {
    return { allPresent: true, present: cleanRequired, missing: [], source: 'fallback' }
  }

  const data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64
  const mimeType = options?.mimeType || 'image/png'
  const prompt = `Read ALL text visible in this poster image. Then, for each target string below, decide if it appears in the image, clearly legible and correctly spelled (ignore case and punctuation differences). Respond with ONLY a JSON object: {"visibleText": "<all text you can read>", "results": [{"target": "<string>", "present": true|false}]}.\n\nTarget strings:\n${cleanRequired.map((r, i) => `${i + 1}. ${r}`).join('\n')}`

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${VISION_MODEL}:generateContent`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        contents: [
          { role: 'user', parts: [{ inlineData: { mimeType, data } }, { text: prompt }] },
        ],
        generationConfig: { temperature: 0, responseModalities: ['TEXT'] },
      }),
      signal: options?.signal,
    })
    if (!res.ok) throw new Error(`vision ${res.status}`)
    const json: any = await res.json()
    const text: string =
      json?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text || '').join('') ?? ''

    const match = text.match(/\{[\s\S]*\}/)
    const parsed = match ? JSON.parse(match[0]) : null
    const visibleNorm = normalize((parsed?.visibleText as string) || text)

    const present: string[] = []
    const missing: string[] = []
    for (const target of cleanRequired) {
      const fromResults = Array.isArray(parsed?.results)
        ? parsed.results.find((r: { target?: string }) => normalize(r.target || '') === normalize(target))
        : undefined
      // Trust the OCR readout as source of truth — it catches subtle misspellings
      // (e.g. "Initative" vs "Initiative") that the model's own yes/no judgment
      // glosses over. Fall back to its boolean only when no readout was returned.
      const isPresent = visibleNorm
        ? visibleNorm.includes(normalize(target))
        : !!(fromResults && fromResults.present === true)
      ;(isPresent ? present : missing).push(target)
    }

    return { allPresent: missing.length === 0, present, missing, source: 'ai' }
  } catch {
    // Fail open — never block the pipeline on a verification hiccup.
    return { allPresent: true, present: cleanRequired, missing: [], source: 'fallback' }
  }
}
