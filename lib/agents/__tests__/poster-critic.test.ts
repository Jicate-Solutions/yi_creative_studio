/**
 * Poster Critic — runnable test harness (no jest runner installed).
 *
 * Run with:
 *   npx tsx lib/agents/__tests__/poster-critic.test.ts
 *
 * Loads .env.local manually (same loader pattern as
 * subject-classifier.test.ts) so GEMINI_API_KEY is picked up without
 * needing dotenv as a runtime dependency.
 *
 * Each case can specify a local image path; if the file is missing the
 * case is skipped with a clear log line — it does NOT count as failure.
 *
 * Exits 0 if all NON-SKIPPED required assertions pass, 1 otherwise.
 */

import { readFileSync, existsSync } from 'node:fs'
import { resolve, extname, basename } from 'node:path'

// --- env loader (runs before importing the critic) ---------------------------
function loadEnvLocal(): void {
  const envPath = resolve(process.cwd(), '.env.local')
  if (!existsSync(envPath)) {
    console.warn(`[harness] .env.local not found at ${envPath} — relying on process.env`)
    return
  }
  const raw = readFileSync(envPath, 'utf8')
  for (const line of raw.split(/\r?\n/)) {
    if (!line || line.trim().startsWith('#')) continue
    const eq = line.indexOf('=')
    if (eq === -1) continue
    const key = line.slice(0, eq).trim()
    let value = line.slice(eq + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    if (key && !(key in process.env)) {
      process.env[key] = value
    }
  }
}
loadEnvLocal()

// --- import AFTER env is loaded ---------------------------------------------
import { criticReviewWithUsage, type CriticInput, type CriticVerdict } from '../poster-critic'

// --- test cases --------------------------------------------------------------
interface Case {
  name: string
  imagePath: string           // absolute path on the local box
  brief: CriticInput['brief']
  expect: {
    overallMax?: number       // overall score must be STRICTLY LESS than this
    overallMin?: number       // overall score must be GTE this
    issueKeywords?: string[]  // at least ONE topIssue/dimension-issue must include one of these substrings (case-insensitive)
    requireFailingDimensions?: Array<keyof CriticVerdict['dimensions'][number] extends never ? never : string>
  }
  required: boolean           // if true and image missing → harness fails. If false → skipped cleanly.
}

const CASES: Case[] = [
  {
    name: '1. KNOWN BAD — split-scene + photo collision (chairperson birthday)',
    imagePath: 'C:/Users/Admin/Downloads/c29a45ba-2047-415c-900e-ac49e9a6f0e9.png',
    brief: {
      eventName: 'Happy Birthday',
      description:
        'The Entire JKKN family Extends Our Heartfelt Birthday Wishes to Our Beloved CHAIRPERSON Smt.JKKN SENDAMARAAI',
      tagline: 'Wishing you a joyous birthday',
      formatId: 'event_poster',
      brandColors: { primary: '#005B96', secondary: '#FF6B35' },
      backgroundStyle: 'cinematic',
      compositionStrategy: 'portrait-hero',
      hasSpeakerPhoto: true,
    },
    expect: {
      overallMax: 6,
      issueKeywords: ['split', 'collision', 'people', 'crowd', 'compet', 'drawn', 'photo', 'face', 'two'],
    },
    required: true,
  },
  {
    name: '2. KNOWN GOOD — placeholder (skipped unless a curated example is dropped at proof-images/good-poster.png)',
    imagePath: resolve(process.cwd(), 'proof-images/good-poster.png'),
    brief: {
      eventName: 'Annual Leadership Summit 2026',
      description: 'A premium gathering of regional leaders',
      tagline: 'Lead with purpose',
      formatId: 'event_poster',
      brandColors: { primary: '#005B96', secondary: '#FF6B35' },
      backgroundStyle: 'cinematic',
      compositionStrategy: 'concept-iconic',
      hasSpeakerPhoto: false,
    },
    expect: {
      overallMin: 8,
    },
    required: false,
  },
  {
    name: '3. MID-QUALITY — placeholder (skipped unless a curated example is dropped at proof-images/mid-poster.png)',
    imagePath: resolve(process.cwd(), 'proof-images/mid-poster.png'),
    brief: {
      eventName: 'Tech Symposium 2026',
      description: 'Paper presentations, panel discussions, workshops',
      formatId: 'event_poster',
      brandColors: { primary: '#005B96', secondary: '#FF6B35' },
      backgroundStyle: 'cinematic',
      compositionStrategy: 'activity-collage',
      hasSpeakerPhoto: false,
    },
    expect: {
      overallMin: 6,
      overallMax: 7.5,
    },
    required: false,
  },
]

// --- runner ------------------------------------------------------------------
interface RunResult {
  caseName: string
  status: 'pass' | 'fail' | 'skipped'
  reasons: string[]
  durationMs: number
  inputTokens: number
  outputTokens: number
  estimatedCostUsd: number
  source: 'ai' | 'fallback'
  overall?: number
  perDimension?: Array<{ dim: string; score: number }>
  topIssues?: string[]
  regenHint?: string
  confidence?: number
}

function loadImageBase64(path: string): { base64: string; mimeType: string } | null {
  if (!existsSync(path)) return null
  const buffer = readFileSync(path)
  const ext = extname(path).toLowerCase().replace('.', '')
  const mimeType = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/png'
  return { base64: buffer.toString('base64'), mimeType }
}

async function runCase(c: Case): Promise<RunResult> {
  const loaded = loadImageBase64(c.imagePath)
  if (!loaded) {
    const message = `image not found at ${c.imagePath}${c.required ? '' : ' (case is optional)'}`
    if (c.required) {
      return {
        caseName: c.name,
        status: 'fail',
        reasons: [message],
        durationMs: 0,
        inputTokens: 0,
        outputTokens: 0,
        estimatedCostUsd: 0,
        source: 'fallback',
      }
    }
    return {
      caseName: c.name,
      status: 'skipped',
      reasons: [message],
      durationMs: 0,
      inputTokens: 0,
      outputTokens: 0,
      estimatedCostUsd: 0,
      source: 'fallback',
    }
  }

  const { verdict, usage } = await criticReviewWithUsage({
    imageBase64: loaded.base64,
    imageMimeType: loaded.mimeType,
    brief: c.brief,
  })

  const reasons: string[] = []

  if (c.expect.overallMax != null && verdict.overallScore >= c.expect.overallMax) {
    reasons.push(`overallScore ${verdict.overallScore} >= max ${c.expect.overallMax}`)
  }
  if (c.expect.overallMin != null && verdict.overallScore < c.expect.overallMin) {
    reasons.push(`overallScore ${verdict.overallScore} < min ${c.expect.overallMin}`)
  }

  if (c.expect.issueKeywords && c.expect.issueKeywords.length > 0) {
    const haystack = [
      ...verdict.topIssues,
      ...verdict.dimensions.flatMap(d => d.issues),
      ...verdict.dimensions.map(d => d.reasoning),
      verdict.regenerationHint || '',
    ]
      .join(' | ')
      .toLowerCase()

    const hit = c.expect.issueKeywords.some(kw => haystack.includes(kw.toLowerCase()))
    if (!hit) {
      reasons.push(`no issue keyword matched (expected one of: ${c.expect.issueKeywords.join(', ')})`)
    }
  }

  return {
    caseName: c.name,
    status: reasons.length === 0 ? 'pass' : 'fail',
    reasons,
    durationMs: usage.durationMs,
    inputTokens: usage.inputTokens,
    outputTokens: usage.outputTokens,
    estimatedCostUsd: usage.estimatedCostUsd,
    source: usage.source,
    overall: verdict.overallScore,
    perDimension: verdict.dimensions.map(d => ({ dim: d.dimension, score: d.score })),
    topIssues: verdict.topIssues,
    regenHint: verdict.regenerationHint,
    confidence: verdict.confidence,
  }
}

async function main(): Promise<void> {
  const haveKey = !!(process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY)
  console.log('==================================================================')
  console.log('Poster Critic — spike test harness')
  console.log('GEMINI_API_KEY present:', haveKey ? 'YES' : 'NO (will use fallback verdict)')
  console.log('==================================================================')

  const results: RunResult[] = []
  for (const c of CASES) {
    process.stdout.write(`\nRunning: ${c.name} ... `)
    try {
      const r = await runCase(c)
      results.push(r)
      console.log(r.status.toUpperCase())
      if (r.status === 'skipped') {
        for (const reason of r.reasons) console.log(`   - ${reason}`)
        continue
      }
      console.log(
        `   overall=${r.overall}  threshold=${(r.overall ?? 0) >= 7 ? 'PASS' : 'REGEN'}  ` +
        `confidence=${r.confidence?.toFixed(2)}  source=${r.source}`
      )
      console.log(`   per-dimension: ${r.perDimension?.map(d => `${d.dim}=${d.score}`).join('  ')}`)
      if (r.topIssues && r.topIssues.length > 0) {
        console.log(`   topIssues:`)
        for (const issue of r.topIssues) console.log(`     • ${issue}`)
      }
      if (r.regenHint) console.log(`   regenHint: ${r.regenHint}`)
      console.log(
        `   tokens: input=${r.inputTokens}  output=${r.outputTokens}  ` +
        `cost=$${r.estimatedCostUsd.toFixed(5)}  ${r.durationMs}ms`
      )
      if (r.status === 'fail') {
        for (const reason of r.reasons) console.log(`   ! ${reason}`)
      }
    } catch (err) {
      console.log('ERROR')
      console.error(err)
      results.push({
        caseName: c.name,
        status: 'fail',
        reasons: [`exception: ${(err as Error).message}`],
        durationMs: 0,
        inputTokens: 0,
        outputTokens: 0,
        estimatedCostUsd: 0,
        source: 'fallback',
      })
    }
  }

  const passed = results.filter(r => r.status === 'pass').length
  const failed = results.filter(r => r.status === 'fail').length
  const skipped = results.filter(r => r.status === 'skipped').length
  const totalCost = results.reduce((acc, r) => acc + r.estimatedCostUsd, 0)
  console.log('\n==================================================================')
  console.log(`Summary: ${passed} passed, ${failed} failed, ${skipped} skipped (${results.length} total)`)
  console.log(`Total cost (real Gemini calls only): $${totalCost.toFixed(5)}`)
  console.log('==================================================================')

  process.exit(failed === 0 ? 0 : 1)
}

main().catch(err => {
  console.error('Harness crashed:', err)
  process.exit(2)
})
