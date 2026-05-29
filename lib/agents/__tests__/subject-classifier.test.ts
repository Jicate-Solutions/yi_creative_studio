/**
 * Subject Classifier — runnable test harness (no jest runner installed).
 *
 * Run with:
 *   npx tsx -r dotenv/config lib/agents/__tests__/subject-classifier.test.ts dotenv_config_path=.env.local
 * Or, since this repo doesn't ship dotenv, the loadEnvLocal() helper below
 * reads .env.local manually before importing the classifier.
 *
 * Exits 0 if all assertions pass, 1 otherwise.
 */

import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

// --- env loader (runs before importing the classifier) -----------------------
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
import {
  classifySubjectWithUsage,
  type SubjectClassifierInput,
  type SubjectType,
  type CompositionStrategy,
} from '../subject-classifier'

// --- test cases --------------------------------------------------------------
interface Case {
  name: string
  input: SubjectClassifierInput
  expect: {
    subjectType: SubjectType
    compositionStrategy: CompositionStrategy
    minConfidence?: number
    requireIdentityName?: boolean
  }
}

const CASES: Case[] = [
  {
    name: '1. Chairperson birthday — person tribute with photo',
    input: {
      eventName: 'Happy Birthday',
      description:
        'The Entire JKKN family Extends Our Heartfelt Birthday Wishes to Our Beloved CHAIRPERSON Smt.JKKN SENDAMARAAI',
      speakers: [
        {
          name: 'Smt. JKKN Sendamaraai',
          designation: 'Chairperson',
          photoUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAA',
        },
      ],
      organizationContext: { name: 'JKKN', industry: 'Education' },
    },
    expect: {
      subjectType: 'person',
      compositionStrategy: 'portrait-hero',
      minConfidence: 0.8,
      requireIdentityName: true,
    },
  },
  {
    name: '2. Pulse 2K26 — cultural fest with multiple activities',
    input: {
      eventName: 'Pulse 2K26',
      description:
        'Dance performances, Singing & music shows, Stage events, Talent showcases, Fun activities for students',
      targetAudience: 'JKKN students',
    },
    expect: {
      subjectType: 'activity',
      compositionStrategy: 'activity-collage',
      minConfidence: 0.7,
    },
  },
  {
    name: '3. Dr. Vasanthi Memorial Lecture — speaker matches event name',
    input: {
      eventName: 'Dr. Vasanthi Memorial Lecture',
      speakers: [{ name: 'Dr. Vasanthi', designation: 'Cardiologist' }],
    },
    expect: {
      subjectType: 'person',
      compositionStrategy: 'portrait-hero',
      minConfidence: 0.75,
      requireIdentityName: true,
    },
  },
  {
    name: '4. Annual Leadership Summit 2026 — abstract concept',
    input: {
      eventName: 'Annual Leadership Summit 2026',
      description: 'A premium gathering of regional leaders',
      targetAudience: 'C-suite',
    },
    expect: {
      subjectType: 'concept',
      compositionStrategy: 'concept-iconic',
      minConfidence: 0.7,
    },
  },
  {
    name: '5. iPhone 17 Pro Launch Showcase — product reveal',
    input: {
      eventName: 'iPhone 17 Pro Launch Showcase',
      description: 'Unveiling the new flagship',
    },
    expect: {
      subjectType: 'product',
      compositionStrategy: 'object-hero',
      minConfidence: 0.75,
    },
  },
  {
    // Regression: a college Annual Day with only an abstract THEME (no enumerated
    // activity list) was previously falling through to concept → concept-iconic →
    // "ONE iconic symbol, NO people", producing an empty venue + floating emblem.
    // It must classify as a live celebration (people performing + audience).
    name: '6. Annual Day Celebration — live student celebration (must NOT be concept-iconic)',
    input: {
      eventName: 'Annual Day Celebration 2026',
      description: 'Beyond Boundaries, Beyond Dreams',
      targetAudience: 'students, parents, faculty',
      organizationContext: { name: 'JKKN College', industry: 'Education' },
    },
    expect: {
      subjectType: 'activity',
      compositionStrategy: 'activity-collage',
      minConfidence: 0.7,
    },
  },
]

// --- runner ------------------------------------------------------------------
interface RunResult {
  caseName: string
  passed: boolean
  reasons: string[]
  durationMs: number
  inputTokens: number
  outputTokens: number
  cachedReadTokens: number
  cachedCreationTokens: number
  source: 'ai' | 'fallback'
  observedType?: SubjectType
  observedStrategy?: CompositionStrategy
  observedConfidence?: number
  observedIdentityName?: string
  reasoning?: string
}

async function runCase(c: Case): Promise<RunResult> {
  const { analysis, usage } = await classifySubjectWithUsage(c.input)
  const reasons: string[] = []

  if (analysis.subjectType !== c.expect.subjectType) {
    reasons.push(
      `subjectType mismatch: expected ${c.expect.subjectType}, got ${analysis.subjectType}`
    )
  }
  if (analysis.compositionStrategy !== c.expect.compositionStrategy) {
    reasons.push(
      `compositionStrategy mismatch: expected ${c.expect.compositionStrategy}, got ${analysis.compositionStrategy}`
    )
  }
  if (c.expect.minConfidence != null && analysis.confidence < c.expect.minConfidence) {
    reasons.push(
      `confidence ${analysis.confidence.toFixed(2)} below threshold ${c.expect.minConfidence}`
    )
  }
  if (c.expect.requireIdentityName && !analysis.subjectIdentity?.name) {
    reasons.push('expected subjectIdentity.name to be populated')
  }

  return {
    caseName: c.name,
    passed: reasons.length === 0,
    reasons,
    durationMs: usage.durationMs,
    inputTokens: usage.inputTokens,
    outputTokens: usage.outputTokens,
    cachedReadTokens: usage.cachedReadTokens,
    cachedCreationTokens: usage.cachedCreationTokens,
    source: usage.source,
    observedType: analysis.subjectType,
    observedStrategy: analysis.compositionStrategy,
    observedConfidence: analysis.confidence,
    observedIdentityName: analysis.subjectIdentity?.name,
    reasoning: analysis.reasoning,
  }
}

async function main(): Promise<void> {
  const haveKey = !!process.env.ANTHROPIC_API_KEY
  console.log('==================================================================')
  console.log('Subject Classifier — spike test harness')
  console.log('ANTHROPIC_API_KEY present:', haveKey ? 'YES' : 'NO (will fall back)')
  console.log('==================================================================')

  const results: RunResult[] = []
  for (const c of CASES) {
    process.stdout.write(`\nRunning: ${c.name} ... `)
    try {
      const r = await runCase(c)
      results.push(r)
      console.log(r.passed ? 'PASS' : 'FAIL')
      console.log(
        `   type=${r.observedType}  strategy=${r.observedStrategy}  conf=${r.observedConfidence?.toFixed(2)}  source=${r.source}`
      )
      if (r.observedIdentityName) console.log(`   identity.name="${r.observedIdentityName}"`)
      if (r.reasoning) console.log(`   reasoning: ${r.reasoning}`)
      console.log(
        `   tokens: input=${r.inputTokens}  output=${r.outputTokens}  cacheRead=${r.cachedReadTokens}  cacheCreate=${r.cachedCreationTokens}  ${r.durationMs}ms`
      )
      if (!r.passed) {
        for (const reason of r.reasons) console.log(`   ! ${reason}`)
      }
    } catch (err) {
      console.log('ERROR')
      console.error(err)
      results.push({
        caseName: c.name,
        passed: false,
        reasons: [`exception: ${(err as Error).message}`],
        durationMs: 0,
        inputTokens: 0,
        outputTokens: 0,
        cachedReadTokens: 0,
        cachedCreationTokens: 0,
        source: 'fallback',
      })
    }
  }

  const passed = results.filter(r => r.passed).length
  const total = results.length
  console.log('\n==================================================================')
  console.log(`Summary: ${passed}/${total} passed`)
  console.log('Token totals:')
  const sum = (key: keyof RunResult) =>
    results.reduce((acc, r) => acc + ((r as any)[key] as number), 0)
  console.log(
    `  input=${sum('inputTokens')}  output=${sum('outputTokens')}  cacheRead=${sum(
      'cachedReadTokens'
    )}  cacheCreate=${sum('cachedCreationTokens')}`
  )
  console.log('==================================================================')

  process.exit(passed === total ? 0 : 1)
}

main().catch(err => {
  console.error('Harness crashed:', err)
  process.exit(2)
})
