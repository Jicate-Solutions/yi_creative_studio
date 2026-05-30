/**
 * Render router + model registry — unit test (no API keys, mocked renderers).
 *
 * Run:
 *   npx tsx lib/designer-render/__tests__/render-router.test.ts
 *
 * Verifies: (1) model id → provider routing via the registry,
 *           (2) explicit request `provider` overrides registry classification,
 *           (3) each adapter's result is returned/normalized untouched,
 *           (4) unknown models fall back sensibly and unmapped providers throw.
 */

import { renderPoster, resolveProvider } from '../render-router'
import { getModelEntry, classifyUnknownModel } from '../model-registry'
import type { RenderInput, RendererMap, RenderResult } from '../types'

let passed = 0
let failed = 0

function check(label: string, cond: boolean, detail?: string) {
  if (cond) {
    passed++
    console.log(`  ✅ ${label}`)
  } else {
    failed++
    console.error(`  ❌ ${label}${detail ? ` — ${detail}` : ''}`)
  }
}

// Spy renderers record which adapter was invoked and return a tagged result.
function makeRenderers(calls: string[]): RendererMap {
  const spy =
    (name: string): ((i: RenderInput) => Promise<RenderResult>) =>
    async () => {
      calls.push(name)
      if (name === 'google') {
        return {
          imageUrl: 'data:image/png;base64,GEMINI',
          actualModel: 'gemini-actual',
          regenerateWithEmphasis: async () => 'data:image/png;base64,RETRY',
        }
      }
      if (name === 'openai') {
        return { imageUrl: 'data:image/png;base64,OPENAI', actualModel: 'gpt-image-1' }
      }
      // ideogram: URL, and intentionally NO actualModel (legacy parity)
      return { imageUrl: 'https://ideogram.ai/img/abc.png' }
    }
  return { google: spy('google'), ideogram: spy('ideogram'), openai: spy('openai') }
}

// ---------------------------------------------------------------------------
console.log('\nCase 1: registry classification (known models)')
{
  check('gemini-2.5-flash-image → google', getModelEntry('gemini-2.5-flash-image').provider === 'google')
  check('gemini-3.1-flash-image-preview → google', getModelEntry('gemini-3.1-flash-image-preview').provider === 'google')
  check('gemini-3-pro-image-preview → google', getModelEntry('gemini-3-pro-image-preview').provider === 'google')
  check('gpt-image-1 → openai', getModelEntry('gpt-image-1').provider === 'openai')
}

console.log('\nCase 2: unknown-model fallback classification')
{
  check('unknown gpt-* → openai', classifyUnknownModel('gpt-image-2-mega') === 'openai')
  check('unknown ideogram-* → ideogram', classifyUnknownModel('ideogram-3') === 'ideogram')
  check('unknown/blank → google (default)', classifyUnknownModel(undefined) === 'google')
  check('explicit fallbackProvider wins over heuristic', getModelEntry('mystery-model', 'ideogram').provider === 'ideogram')
}

console.log('\nCase 3: explicit request provider overrides registry')
{
  // gpt-image-1 classifies as openai, but an explicit provider must win.
  check(
    'resolveProvider honors input.provider',
    resolveProvider({ prompt: '', modelId: 'gpt-image-1', provider: 'google' }) === 'google'
  )
  check(
    'resolveProvider derives from modelId when no override',
    resolveProvider({ prompt: '', modelId: 'gpt-image-1' }) === 'openai'
  )
}

console.log('\nCase 4: dispatch routes to the correct adapter')
async function dispatchTests() {
  {
    const calls: string[] = []
    const res = await renderPoster({ prompt: 'x', modelId: 'gemini-3-pro-image-preview' }, makeRenderers(calls))
    check('gemini model → google adapter called', calls.length === 1 && calls[0] === 'google', calls.join(','))
    check('google result imageUrl passthrough', res.imageUrl === 'data:image/png;base64,GEMINI')
    check('google result carries regenerate hook', typeof res.regenerateWithEmphasis === 'function')
  }
  {
    const calls: string[] = []
    const res = await renderPoster({ prompt: 'x', modelId: 'gpt-image-1' }, makeRenderers(calls))
    check('openai model → openai adapter called', calls[0] === 'openai', calls.join(','))
    check('openai actualModel set', res.actualModel === 'gpt-image-1')
  }
  {
    const calls: string[] = []
    const res = await renderPoster({ prompt: 'x', modelId: 'anything', provider: 'ideogram' }, makeRenderers(calls))
    check('explicit ideogram provider → ideogram adapter', calls[0] === 'ideogram', calls.join(','))
    check('ideogram returns remote URL', res.imageUrl.startsWith('https://'))
    check('ideogram leaves actualModel undefined (legacy parity)', res.actualModel === undefined)
  }
  {
    // Missing adapter must throw a clear error.
    const partial = { google: makeRenderers([]).google } as unknown as RendererMap
    let threw = false
    try {
      await renderPoster({ prompt: 'x', modelId: 'gpt-image-1' }, partial)
    } catch (e) {
      threw = e instanceof Error && e.message.includes('No adapter registered')
    }
    check('unmapped provider throws clear error', threw)
  }
}

dispatchTests().then(() => {
  console.log(`\n${'='.repeat(48)}`)
  console.log(`Render-router test: ${passed} passed, ${failed} failed`)
  if (failed > 0) process.exit(1)
})
