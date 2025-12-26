/**
 * Unit Tests: Speaker Zone Analyzer
 * YiCreatives Studio
 *
 * Tests the speaker zone analyzer's ability to map pixel positions
 * to logo grid zones for collision avoidance.
 */

import {
  analyzeSpeakerZones,
  isPositionOccupiedBySpeaker,
  getAvailablePositions,
} from '../speaker-zone-analyzer'
import type { SpeakerPhotoCustomization } from '@/types/design.types'
import { LOGO_POSITIONS } from '@/lib/config/constants'

describe('Speaker Zone Analyzer', () => {
  const DEFAULT_DIMENSIONS = { width: 1080, height: 1350 } // event_poster dimensions

  describe('analyzeSpeakerZones()', () => {
    test('returns null when speaker photos are disabled', () => {
      const result = analyzeSpeakerZones({
        speakerPhoto: { enabled: false } as SpeakerPhotoCustomization,
        formatDimensions: DEFAULT_DIMENSIONS,
      })

      expect(result).toBeNull()
    })

    test('returns null when no speakers are provided', () => {
      const result = analyzeSpeakerZones({
        speakerPhoto: {
          enabled: true,
          speakers: [],
          layoutMode: 'auto',
        } as SpeakerPhotoCustomization,
        formatDimensions: DEFAULT_DIMENSIONS,
      })

      expect(result).toBeNull()
    })

    test('single speaker in center maps to mid-3 or mid-4 region', () => {
      const result = analyzeSpeakerZones({
        speakerPhoto: {
          enabled: true,
          speakers: [
            { id: '1', name: 'John Doe', photoUrl: 'data:image/...' },
          ],
          layoutMode: 'auto',
          size: 200,
          spacing: 20,
        } as SpeakerPhotoCustomization,
        formatDimensions: DEFAULT_DIMENSIONS,
      })

      expect(result).not.toBeNull()
      expect(result?.speakerCount).toBe(1)
      expect(result?.layout).toBe('side-by-side') // Single speaker uses side-by-side
      expect(result?.occupiedGridPositions.length).toBeGreaterThan(0)

      // Single centered speaker should occupy middle row center positions
      const hasMiddleRow = result?.occupiedGridPositions.some(pos => pos.startsWith('mid-'))
      expect(hasMiddleRow).toBe(true)

      // Should have meaningful description
      expect(result?.description).toContain('speaker')
      expect(result?.description).toContain('mid-')
    })

    test('two speakers side-by-side map to mid-1 and mid-5/mid-6 regions', () => {
      const result = analyzeSpeakerZones({
        speakerPhoto: {
          enabled: true,
          speakers: [
            { id: '1', name: 'John Doe', photoUrl: 'data:image/...' },
            { id: '2', name: 'Jane Smith', photoUrl: 'data:image/...' },
          ],
          layoutMode: 'auto',
          size: 200,
          spacing: 20,
        } as SpeakerPhotoCustomization,
        formatDimensions: DEFAULT_DIMENSIONS,
      })

      expect(result).not.toBeNull()
      expect(result?.speakerCount).toBe(2)
      expect(result?.layout).toBe('side-by-side')
      expect(result?.occupiedGridPositions.length).toBeGreaterThan(0)

      // Two side-by-side speakers should occupy left and right middle positions
      const occupiedPositions = result?.occupiedGridPositions || []
      const hasLeftMiddle = occupiedPositions.some(pos => pos === 'mid-1' || pos === 'mid-2')
      const hasRightMiddle = occupiedPositions.some(pos => pos === 'mid-5' || pos === 'mid-6')

      expect(hasLeftMiddle).toBe(true)
      expect(hasRightMiddle).toBe(true)

      // Description should mention horizontal layout
      expect(result?.description).toContain('horizontal')
      expect(result?.description).toContain('2 speakers')
    })

    test('four speakers in grid layout occupy multiple zones', () => {
      const result = analyzeSpeakerZones({
        speakerPhoto: {
          enabled: true,
          speakers: [
            { id: '1', name: 'Speaker 1', photoUrl: 'data:image/...' },
            { id: '2', name: 'Speaker 2', photoUrl: 'data:image/...' },
            { id: '3', name: 'Speaker 3', photoUrl: 'data:image/...' },
            { id: '4', name: 'Speaker 4', photoUrl: 'data:image/...' },
          ],
          layoutMode: 'auto',
          size: 180,
          spacing: 15,
        } as SpeakerPhotoCustomization,
        formatDimensions: DEFAULT_DIMENSIONS,
      })

      expect(result).not.toBeNull()
      expect(result?.speakerCount).toBe(4)
      expect(result?.layout).toBe('grid') // 4 speakers should use grid layout
      expect(result?.occupiedGridPositions.length).toBeGreaterThan(3)

      // Grid layout should occupy multiple grid zones
      const occupiedPositions = result?.occupiedGridPositions || []
      expect(occupiedPositions.length).toBeGreaterThanOrEqual(4)

      // Description should mention grid
      expect(result?.description).toContain('grid')
      expect(result?.description).toContain('4 speakers')
    })

    test('manual layout override is respected', () => {
      const result = analyzeSpeakerZones({
        speakerPhoto: {
          enabled: true,
          speakers: [
            { id: '1', name: 'Speaker 1', photoUrl: 'data:image/...' },
            { id: '2', name: 'Speaker 2', photoUrl: 'data:image/...' },
          ],
          layoutMode: 'manual',
          layoutStrategy: 'stacked', // Force vertical stacking
          size: 180,
          spacing: 15,
        } as SpeakerPhotoCustomization,
        formatDimensions: DEFAULT_DIMENSIONS,
      })

      expect(result).not.toBeNull()
      expect(result?.layout).toBe('stacked')

      // Description should mention vertical/stacked
      expect(result?.description).toContain('stacked') || expect(result?.description).toContain('vertical')
    })

    test('different format dimensions affect zone mapping', () => {
      // Instagram post (square 1080x1080)
      const squareResult = analyzeSpeakerZones({
        speakerPhoto: {
          enabled: true,
          speakers: [
            { id: '1', name: 'Speaker', photoUrl: 'data:image/...' },
          ],
          layoutMode: 'auto',
          size: 200,
        } as SpeakerPhotoCustomization,
        formatDimensions: { width: 1080, height: 1080 },
      })

      // Landscape banner (1920x1080)
      const landscapeResult = analyzeSpeakerZones({
        speakerPhoto: {
          enabled: true,
          speakers: [
            { id: '1', name: 'Speaker', photoUrl: 'data:image/...' },
          ],
          layoutMode: 'auto',
          size: 200,
        } as SpeakerPhotoCustomization,
        formatDimensions: { width: 1920, height: 1080 },
      })

      // Both should return valid results with different zone mappings
      expect(squareResult).not.toBeNull()
      expect(landscapeResult).not.toBeNull()
      expect(squareResult?.occupiedGridPositions).toBeDefined()
      expect(landscapeResult?.occupiedGridPositions).toBeDefined()
    })
  })

  describe('isPositionOccupiedBySpeaker()', () => {
    test('returns false when speakerZones is null', () => {
      const isOccupied = isPositionOccupiedBySpeaker('mid-3', null)
      expect(isOccupied).toBe(false)
    })

    test('returns true for occupied positions', () => {
      const speakerZones = {
        occupiedGridPositions: ['mid-1', 'mid-5', 'mid-6'],
        layout: 'side-by-side' as const,
        speakerCount: 2,
        description: 'Test zones',
      }

      expect(isPositionOccupiedBySpeaker('mid-1', speakerZones)).toBe(true)
      expect(isPositionOccupiedBySpeaker('mid-5', speakerZones)).toBe(true)
      expect(isPositionOccupiedBySpeaker('mid-6', speakerZones)).toBe(true)
    })

    test('returns false for non-occupied positions', () => {
      const speakerZones = {
        occupiedGridPositions: ['mid-1', 'mid-5', 'mid-6'],
        layout: 'side-by-side' as const,
        speakerCount: 2,
        description: 'Test zones',
      }

      expect(isPositionOccupiedBySpeaker('mid-3', speakerZones)).toBe(false)
      expect(isPositionOccupiedBySpeaker('top-1', speakerZones)).toBe(false)
      expect(isPositionOccupiedBySpeaker('bottom-1', speakerZones)).toBe(false)
    })
  })

  describe('getAvailablePositions()', () => {
    test('returns all positions when speakerZones is null', () => {
      const available = getAvailablePositions(LOGO_POSITIONS as any, null)
      expect(available).toEqual(LOGO_POSITIONS)
    })

    test('filters out occupied positions', () => {
      const speakerZones = {
        occupiedGridPositions: ['mid-1', 'mid-2', 'mid-5', 'mid-6'],
        layout: 'side-by-side' as const,
        speakerCount: 2,
        description: 'Test zones',
      }

      const available = getAvailablePositions(LOGO_POSITIONS as any, speakerZones)

      // Should not include occupied positions
      expect(available).not.toContain('mid-1')
      expect(available).not.toContain('mid-2')
      expect(available).not.toContain('mid-5')
      expect(available).not.toContain('mid-6')

      // Should include all other positions
      expect(available).toContain('top-1')
      expect(available).toContain('mid-3')
      expect(available).toContain('mid-4')
      expect(available).toContain('bottom-1')

      // Total count should be 18 - 4 = 14
      expect(available.length).toBe(18 - 4)
    })

    test('returns all positions when no zones are occupied', () => {
      const speakerZones = {
        occupiedGridPositions: [],
        layout: 'side-by-side' as const,
        speakerCount: 0,
        description: 'No speakers',
      }

      const available = getAvailablePositions(LOGO_POSITIONS as any, speakerZones)
      expect(available.length).toBe(18)
    })
  })

  describe('Edge Cases', () => {
    test('handles extremely small speaker photos', () => {
      const result = analyzeSpeakerZones({
        speakerPhoto: {
          enabled: true,
          speakers: [{ id: '1', name: 'Speaker', photoUrl: 'data:image/...' }],
          layoutMode: 'auto',
          size: 50, // Very small
          spacing: 5,
        } as SpeakerPhotoCustomization,
        formatDimensions: DEFAULT_DIMENSIONS,
      })

      expect(result).not.toBeNull()
      expect(result?.occupiedGridPositions.length).toBeGreaterThan(0)
    })

    test('handles extremely large speaker photos', () => {
      const result = analyzeSpeakerZones({
        speakerPhoto: {
          enabled: true,
          speakers: [{ id: '1', name: 'Speaker', photoUrl: 'data:image/...' }],
          layoutMode: 'auto',
          size: 400, // Very large
          spacing: 30,
        } as SpeakerPhotoCustomization,
        formatDimensions: DEFAULT_DIMENSIONS,
      })

      expect(result).not.toBeNull()
      // Large photos should occupy more grid zones
      expect(result?.occupiedGridPositions.length).toBeGreaterThan(1)
    })

    test('handles very narrow formats', () => {
      const result = analyzeSpeakerZones({
        speakerPhoto: {
          enabled: true,
          speakers: [{ id: '1', name: 'Speaker', photoUrl: 'data:image/...' }],
          layoutMode: 'auto',
          size: 150,
        } as SpeakerPhotoCustomization,
        formatDimensions: { width: 720, height: 1280 }, // Narrow vertical
      })

      expect(result).not.toBeNull()
      expect(result?.occupiedGridPositions).toBeDefined()
    })

    test('handles legacy single speaker format (photoUrl field)', () => {
      const result = analyzeSpeakerZones({
        speakerPhoto: {
          enabled: true,
          photoUrl: 'data:image/...', // Legacy format
          layoutMode: 'auto',
          size: 200,
        } as any,
        formatDimensions: DEFAULT_DIMENSIONS,
      })

      // Should handle legacy format gracefully via migration helpers
      expect(result).not.toBeNull()
    })
  })
})
