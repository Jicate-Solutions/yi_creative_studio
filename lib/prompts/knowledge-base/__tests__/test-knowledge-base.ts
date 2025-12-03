/**
 * Test script for the Prompt Knowledge Base System
 * Verifies template resolution and prompt generation
 */

import {
  getTemplateForFormat,
  getBasePattern,
  getAllFormatIds,
  getPatternStats,
  hasFormatOverride,
} from '../index'
import { FORMAT_TO_PATTERN } from '../format-mapping'

// Test colors for output
const GREEN = '\x1b[32m'
const RED = '\x1b[31m'
const YELLOW = '\x1b[33m'
const RESET = '\x1b[0m'

function testBasicResolution() {
  console.log('\n=== Test 1: Basic Template Resolution ===')

  const testFormats = [
    'event_poster',
    'instagram_story',
    'youtube_thumbnail',
    'certificate',
    'linkedin_post',
    'tiktok_cover',
    'business_card',
  ]

  testFormats.forEach((formatId) => {
    const template = getTemplateForFormat(formatId)
    if (template && template.id === formatId) {
      console.log(`${GREEN}✓${RESET} ${formatId} → ${template.basePattern} (${template.category})`)
    } else {
      console.log(`${RED}✗${RESET} ${formatId} - Failed to resolve`)
    }
  })
}

function testAllFormatsHavePatterns() {
  console.log('\n=== Test 2: All Formats Have Patterns ===')

  const allFormats = getAllFormatIds()
  let passed = 0
  let failed = 0

  allFormats.forEach((formatId) => {
    const pattern = FORMAT_TO_PATTERN[formatId]
    if (pattern) {
      passed++
    } else {
      console.log(`${RED}✗${RESET} ${formatId} - No pattern mapping`)
      failed++
    }
  })

  console.log(`\n${GREEN}✓${RESET} ${passed} formats have pattern mappings`)
  if (failed > 0) {
    console.log(`${RED}✗${RESET} ${failed} formats missing pattern mappings`)
  }
}

function testTemplateStructure() {
  console.log('\n=== Test 3: Template Structure Validation ===')

  const template = getTemplateForFormat('youtube_thumbnail')

  const checks = [
    { name: 'Has ID', pass: !!template.id },
    { name: 'Has basePattern', pass: !!template.basePattern },
    { name: 'Has textElements', pass: Array.isArray(template.textElements) && template.textElements.length > 0 },
    { name: 'Has textHierarchy', pass: Array.isArray(template.textHierarchy) && template.textHierarchy.length > 0 },
    { name: 'Has layout', pass: !!template.layout && !!template.layout.name },
    { name: 'Has typography', pass: !!template.typography && !!template.typography.primary },
    { name: 'Has visuals', pass: !!template.visuals && Array.isArray(template.visuals.recommended) },
    { name: 'Has negativePrompts', pass: !!template.negativePrompts && Array.isArray(template.negativePrompts.base) },
    { name: 'Has promptTemplate', pass: typeof template.promptTemplate === 'string' && template.promptTemplate.length > 0 },
    { name: 'Has qualityKeywords', pass: Array.isArray(template.qualityKeywords) && template.qualityKeywords.length > 0 },
  ]

  checks.forEach(({ name, pass }) => {
    const icon = pass ? `${GREEN}✓${RESET}` : `${RED}✗${RESET}`
    console.log(`${icon} ${name}`)
  })
}

function testOverridesApplied() {
  console.log('\n=== Test 4: Format Overrides Applied ===')

  // Test formats that have overrides
  const formatsWithOverrides = [
    'instagram_story',
    'tiktok_cover',
    'youtube_thumbnail',
    'certificate',
    'billboard',
  ]

  formatsWithOverrides.forEach((formatId) => {
    const hasOverride = hasFormatOverride(formatId)
    const template = getTemplateForFormat(formatId)

    if (hasOverride) {
      console.log(`${GREEN}✓${RESET} ${formatId} - Has override`)

      // Check for safe areas if applicable
      if (template.safeAreas && template.safeAreas.length > 0) {
        console.log(`  └─ Safe areas: ${template.safeAreas.map(s => s.description).join(', ')}`)
      }

      // Check for quality keywords
      if (template.qualityKeywords.length > 0) {
        console.log(`  └─ Quality: ${template.qualityKeywords.slice(0, 3).join(', ')}`)
      }
    } else {
      console.log(`${YELLOW}?${RESET} ${formatId} - No override (using base pattern only)`)
    }
  })
}

function testPatternStats() {
  console.log('\n=== Test 5: Pattern Statistics ===')

  const stats = getPatternStats()

  console.log(`Total formats: ${stats.totalFormats}`)
  console.log(`Total base patterns: ${stats.totalPatterns}`)
  console.log(`Formats with overrides: ${stats.formatsWithOverrides}`)
  console.log(`Categories: ${stats.categories}`)

  // Verify expected counts
  if (stats.totalPatterns === 10) {
    console.log(`${GREEN}✓${RESET} Correct number of base patterns (10)`)
  } else {
    console.log(`${RED}✗${RESET} Expected 10 patterns, got ${stats.totalPatterns}`)
  }

  if (stats.totalFormats >= 37) {
    console.log(`${GREEN}✓${RESET} Sufficient format coverage (${stats.totalFormats}+ formats)`)
  } else {
    console.log(`${YELLOW}?${RESET} Format coverage: ${stats.totalFormats} (expected 37+)`)
  }
}

function testPromptTemplate() {
  console.log('\n=== Test 6: Prompt Template Content ===')

  const formats = ['event_poster', 'youtube_thumbnail', 'instagram_story']

  formats.forEach((formatId) => {
    const template = getTemplateForFormat(formatId)
    const promptPreview = template.promptTemplate.substring(0, 100).replace(/\n/g, ' ')

    console.log(`\n${YELLOW}${formatId}${RESET}:`)
    console.log(`  Pattern: ${template.basePattern}`)
    console.log(`  Prompt: "${promptPreview}..."`)
    console.log(`  Negatives: ${template.negativePrompts.base.slice(0, 3).join(', ')}...`)
  })
}

// Run all tests
console.log('========================================')
console.log('  PROMPT KNOWLEDGE BASE TEST SUITE')
console.log('========================================')

testBasicResolution()
testAllFormatsHavePatterns()
testTemplateStructure()
testOverridesApplied()
testPatternStats()
testPromptTemplate()

console.log('\n========================================')
console.log('  TEST SUITE COMPLETE')
console.log('========================================\n')
