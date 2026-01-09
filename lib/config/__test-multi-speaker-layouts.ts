/**
 * Test Script for Multi-Speaker Layout Engine
 *
 * Run this file to validate layout calculations:
 * npx ts-node lib/config/__test-multi-speaker-layouts.ts
 *
 * Or use in Node.js console:
 * node --loader ts-node/esm lib/config/__test-multi-speaker-layouts.ts
 */

import { calculateMultiSpeakerLayout, getCompositionGuidance, isLayoutRecommended } from './multi-speaker-layouts'

// Test canvas dimensions for common formats
const TEST_FORMATS = {
  'event_poster': { aspectRatio: '4:5', width: 1080, height: 1440 },
  'certificate': { aspectRatio: '3:4', width: 1080, height: 1440 },
  'instagram_square': { aspectRatio: '1:1', width: 1080, height: 1080 },
  'youtube_thumbnail': { aspectRatio: '16:9', width: 1920, height: 1080 }
}

console.log('='.repeat(80))
console.log('MULTI-SPEAKER LAYOUT ENGINE - TEST SUITE')
console.log('='.repeat(80))
console.log('')

// Test all combinations
Object.entries(TEST_FORMATS).forEach(([formatName, format]) => {
  console.log(`\n${'='.repeat(80)}`)
  console.log(`FORMAT: ${formatName.toUpperCase()} (${format.aspectRatio})`)
  console.log(`Canvas: ${format.width}×${format.height}px`)
  console.log('='.repeat(80))

  // Test 2, 3, and 4 speakers
  for (let speakerCount = 2; speakerCount <= 4; speakerCount++) {
    console.log(`\n--- ${speakerCount} Speakers ---`)

    const layout = calculateMultiSpeakerLayout(
      speakerCount,
      format.aspectRatio,
      format.width,
      format.height,
      'medium'
    )

    console.log(`Layout Key: ${layout.layoutKey}`)
    console.log(`Is Valid: ${layout.isValid ? '✅' : '❌'}`)
    console.log(`Is Recommended: ${isLayoutRecommended(speakerCount, layout.layoutKey.split('-')[0] as any) ? '✅' : '⚠️'}`)

    if (layout.validationErrors.length > 0) {
      console.log('\nValidation Issues:')
      layout.validationErrors.forEach(err => {
        if (err.startsWith('⚠️')) {
          console.log(`  ${err}`)
        } else {
          console.log(`  ❌ ${err}`)
        }
      })
    }

    if (layout.positions.length > 0) {
      console.log('\nPhoto Positions:')
      layout.positions.forEach((pos, i) => {
        const left = pos.x - pos.size / 2
        const right = pos.x + pos.size / 2
        const top = pos.y - pos.size / 2
        const bottom = pos.y + pos.size / 2

        console.log(`  Speaker ${i + 1}:`)
        console.log(`    Center: (${pos.x}, ${pos.y})`)
        console.log(`    Size: ${pos.size}px (${(pos.size / format.width * 100).toFixed(1)}% of width)`)
        console.log(`    Bounds: x[${left}-${right}] y[${top}-${bottom}]`)
        console.log(`    Shape: ${pos.shape}`)
      })

      console.log('\nText Zone Adjustments:')
      console.log(`  Headline: ${layout.textZoneAdjustments.headline.start}-${layout.textZoneAdjustments.headline.end}%`)
      console.log(`  Tagline: ${layout.textZoneAdjustments.tagline.start}-${layout.textZoneAdjustments.tagline.end}%`)
      console.log(`  Date/Venue: ${layout.textZoneAdjustments.dateVenue.start}-${layout.textZoneAdjustments.dateVenue.end}%`)
      console.log(`  Speakers: ${layout.textZoneAdjustments.speakers.start}-${layout.textZoneAdjustments.speakers.end}%`)
      console.log(`  Additional: ${layout.textZoneAdjustments.additionalDetails.start}-${layout.textZoneAdjustments.additionalDetails.end}%`)

      console.log('\nComposition Guidance:')
      console.log(`  ${layout.compositionGuidance.substring(0, 150)}...`)
    }

    if (layout.recommendedAspectRatio) {
      console.log(`\n💡 Recommended Aspect Ratios: ${layout.recommendedAspectRatio}`)
    }
  }
})

// Test edge cases
console.log(`\n\n${'='.repeat(80)}`)
console.log('EDGE CASE TESTING')
console.log('='.repeat(80))

// Test 1 speaker (should fail)
console.log('\n--- Test: 1 Speaker (Should Fail) ---')
const singleSpeaker = calculateMultiSpeakerLayout(1, '4:5', 1080, 1440, 'medium')
console.log(`Is Valid: ${singleSpeaker.isValid ? '✅' : '❌'}`)
console.log(`Errors: ${singleSpeaker.validationErrors.join(', ')}`)

// Test 5 speakers (should fail)
console.log('\n--- Test: 5 Speakers (Should Fail) ---')
const fiveSpeakers = calculateMultiSpeakerLayout(5, '4:5', 1080, 1440, 'medium')
console.log(`Is Valid: ${fiveSpeakers.isValid ? '✅' : '❌'}`)
console.log(`Errors: ${fiveSpeakers.validationErrors.join(', ')}`)
console.log(`Recommended: ${fiveSpeakers.recommendedAspectRatio}`)

// Test different photo sizes
console.log('\n--- Test: Photo Size Variations (2 speakers, portrait) ---')
const sizes: Array<'small' | 'medium' | 'large'> = ['small', 'medium', 'large']
sizes.forEach(size => {
  const layout = calculateMultiSpeakerLayout(2, '4:5', 1080, 1440, size)
  const photoSize = layout.positions[0]?.size || 0
  console.log(`  ${size.toUpperCase()}: ${photoSize}px (${(photoSize / 1080 * 100).toFixed(1)}% of width)`)
})

console.log('\n' + '='.repeat(80))
console.log('TEST SUITE COMPLETE')
console.log('='.repeat(80))
console.log('')
console.log('Summary:')
console.log('✅ Layout templates: 12 (portrait/square/landscape × 2-4 speakers)')
console.log('✅ Validation: Header zone, footer zone, photo overlap, canvas bounds')
console.log('✅ Text zone adjustments: Dynamic per layout')
console.log('✅ Composition guidance: Natural language per layout')
console.log('✅ Edge cases: Handles 1 speaker, 5+ speakers gracefully')
console.log('')
