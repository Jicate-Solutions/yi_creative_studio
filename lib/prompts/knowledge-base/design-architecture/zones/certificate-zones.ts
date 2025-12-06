/**
 * Certificate Zone Architecture
 * Precise positioning and proportional rules for certificate layouts
 *
 * Defines 9 distinct zones with exact positioning to ensure
 * proper visual hierarchy and professional composition.
 */

import type { ZoneArchitecture, DesignZone } from '../types'

// ============================================================
// CERTIFICATE ZONE DEFINITIONS
// ============================================================

const CERTIFICATE_ZONES: DesignZone[] = [
  {
    id: 'border_frame',
    name: 'Decorative Border Frame',
    position: { anchor: 'full-bleed' },
    dimensions: { widthPercent: 100, heightPercent: 100 },
    purpose: 'reserved',
    reservedFor: 'Decorative border and frame elements',
    backgroundGuidance: 'Border design per selected style covering outer 12-15%',
    contentRules: [
      'No content overlaps border zone',
      'Border provides visual containment for entire document',
    ],
  },
  {
    id: 'seal_zone',
    name: 'Official Seal Zone',
    position: { anchor: 'top-right', offsetX: '-8%', offsetY: '8%' },
    dimensions: { widthPercent: 12, heightPercent: 15, aspectRatio: '1:1' },
    purpose: 'reserved',
    reservedFor: 'Official seal, emblem, or organization badge',
    backgroundGuidance: 'Clean background allowing seal to stand out prominently',
    contentRules: [
      'Gold foil or embossed effect for seal',
      'May include ribbon decoration extending from seal',
      'Keep at consistent size (12-15% of document width)',
      'Seal should appear raised or embossed',
    ],
  },
  {
    id: 'logo_zone',
    name: 'Organization Logo Zone',
    position: { anchor: 'top-left', offsetX: '8%', offsetY: '8%' },
    dimensions: { widthPercent: 15, heightPercent: 12 },
    purpose: 'reserved',
    reservedFor: 'Organization logo overlay (Yi, CII, etc.)',
    backgroundGuidance: 'Simple, clean background for logo overlay compatibility',
    contentRules: [
      'Keep zone clear for post-processing logo overlay',
      'No complex patterns or text in this area',
      'Background color should complement logo',
    ],
  },
  {
    id: 'title_zone',
    name: 'Certificate Title Zone',
    position: { anchor: 'top-center', offsetY: '15%' },
    dimensions: { widthPercent: 60, heightPercent: 10 },
    purpose: 'content',
    backgroundGuidance: 'Clear space for elegant title typography',
    contentRules: [
      'Certificate title in elegant serif font',
      'Optional decorative underline or flourish below',
      'Center-aligned with proper letter spacing',
      'ALL CAPS or Title Case depending on style',
    ],
  },
  {
    id: 'preface_zone',
    name: 'Preface Text Zone',
    position: { anchor: 'center', offsetY: '-12%' },
    dimensions: { widthPercent: 50, heightPercent: 5 },
    purpose: 'content',
    backgroundGuidance: 'Clear',
    contentRules: [
      '"This is to certify that" or similar formal preface',
      'Small italic serif text',
      'Center-aligned',
      'Subtle, not competing with recipient name',
    ],
  },
  {
    id: 'recipient_hero_zone',
    name: 'Recipient Name Hero Zone',
    position: { anchor: 'center' },
    dimensions: { widthPercent: 70, heightPercent: 15 },
    purpose: 'content',
    backgroundGuidance: 'May have subtle decorative flourishes above and below name',
    contentRules: [
      'LARGEST text element on entire certificate',
      'Script or elegant calligraphy font for classic styles',
      'Bold elegant serif for modern styles',
      'Decorative underline or flourishes optional',
      'Center-aligned with generous breathing room',
      'This is the HERO element - most visual prominence',
    ],
  },
  {
    id: 'achievement_zone',
    name: 'Achievement Description Zone',
    position: { anchor: 'center', offsetY: '12%' },
    dimensions: { widthPercent: 65, heightPercent: 10 },
    purpose: 'content',
    backgroundGuidance: 'Clear',
    contentRules: [
      'Achievement or purpose description text',
      'Readable serif font at medium size',
      'Center-aligned, may wrap to 2-3 lines',
      'Should explain what the certificate is for',
    ],
  },
  {
    id: 'signature_zone_left',
    name: 'Left Signature Zone',
    position: { anchor: 'bottom-left', offsetX: '18%', offsetY: '-18%' },
    dimensions: { widthPercent: 25, heightPercent: 12 },
    purpose: 'reserved',
    reservedFor: 'Primary signatory signature, name, and designation',
    backgroundGuidance: 'Clear with horizontal signature line',
    contentRules: [
      'Horizontal signature line (thin, elegant)',
      'Printed name below line',
      'Designation/title below name in smaller text',
      'Left signature is typically the primary authority',
    ],
  },
  {
    id: 'signature_zone_right',
    name: 'Right Signature Zone',
    position: { anchor: 'bottom-right', offsetX: '-18%', offsetY: '-18%' },
    dimensions: { widthPercent: 25, heightPercent: 12 },
    purpose: 'reserved',
    reservedFor: 'Secondary signatory (if applicable)',
    backgroundGuidance: 'Clear with horizontal signature line',
    contentRules: [
      'Mirror styling of left signature zone',
      'Same line thickness and typography',
      'Maintains visual symmetry',
    ],
  },
  {
    id: 'footer_zone',
    name: 'Footer Information Zone',
    position: { anchor: 'bottom-center', offsetY: '-8%' },
    dimensions: { widthPercent: 40, heightPercent: 4 },
    purpose: 'content',
    backgroundGuidance: 'Clear',
    contentRules: [
      'Date of issue and certificate number',
      'Small caps or small serif text',
      'Center-aligned',
      'Subtle - should not compete with main content',
    ],
  },
]

// ============================================================
// CERTIFICATE ZONE ARCHITECTURE
// ============================================================

export const CERTIFICATE_ZONE_ARCHITECTURE: ZoneArchitecture = {
  formatId: 'certificate',
  aspectRatio: '1.41:1', // A4 landscape proportions

  zones: CERTIFICATE_ZONES,

  proportionalRules: {
    borderToContent: '85-88% content area within border frame',
    recipientNameSize: '2.5-3x body text size (HERO element)',
    titleSize: '1.5-2x body text size',
    signatureLineWidth: '60-70% of signature zone width',
    sealSize: '10-15% of document width',
    verticalSpacing: 'Generous spacing between all zones',
  },

  promptFragment: `
CERTIFICATE ZONE ARCHITECTURE:
═══════════════════════════════════════════════════════════════════════════════

LAYOUT STRUCTURE (A4 Landscape, 1.41:1 aspect ratio):

┌──────────────────────────────────────────────────────────────────────────────┐
│  BORDER FRAME (12-15% outer edge - decorative border per selected style)    │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │ [LOGO ZONE]                                         [SEAL ZONE]       │  │
│  │  top-left 15%                                        top-right 12%    │  │
│  │                                                                        │  │
│  │                    ═══ TITLE ZONE (60% width) ═══                     │  │
│  │                    "CERTIFICATE OF ACHIEVEMENT"                        │  │
│  │                                                                        │  │
│  │                    "This is to certify that"                          │  │
│  │                    (preface - small italic)                           │  │
│  │                                                                        │  │
│  │              ╔═══════════════════════════════════════╗                │  │
│  │              ║     RECIPIENT NAME (70% width)        ║                │  │
│  │              ║     === HERO ZONE - LARGEST ===       ║                │  │
│  │              ║   Script/Calligraphy, 3x body size    ║                │  │
│  │              ╚═══════════════════════════════════════╝                │  │
│  │                                                                        │  │
│  │                    Achievement Description Zone                        │  │
│  │                    (readable serif, center-aligned)                   │  │
│  │                                                                        │  │
│  │  [SIGNATURE LEFT]                               [SIGNATURE RIGHT]     │  │
│  │   _______________                                _______________      │  │
│  │   Name, Title                                    Name, Title          │  │
│  │                                                                        │  │
│  │                    Date | Certificate No.                              │  │
│  │                    (footer - small caps)                              │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────┘

PROPORTIONAL RULES:
- Content area = 85-88% within border frame
- Recipient name = LARGEST element (2.5-3x body text)
- Certificate title = 1.5-2x body text
- Signature lines = 60-70% of zone width
- Seal = 10-15% of document width
- Generous vertical spacing between all zones

VISUAL HIERARCHY (by prominence):
1. RECIPIENT NAME (Hero) - Script/calligraphy, decorative flourishes
2. CERTIFICATE TITLE - Elegant serif, optional underline
3. ACHIEVEMENT - Readable, explanatory text
4. SIGNATURES - Formal, symmetrical placement
5. DATE/NUMBER - Subtle footer information
`,
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Get the certificate zone architecture prompt fragment
 */
export function getCertificateZonePromptFragment(): string {
  return CERTIFICATE_ZONE_ARCHITECTURE.promptFragment
}

/**
 * Get a specific zone by ID
 */
export function getCertificateZone(zoneId: string): DesignZone | undefined {
  return CERTIFICATE_ZONES.find((zone) => zone.id === zoneId)
}

/**
 * Get all zones for a specific purpose
 */
export function getCertificateZonesByPurpose(purpose: 'content' | 'reserved' | 'integration' | 'safe'): DesignZone[] {
  return CERTIFICATE_ZONES.filter((zone) => zone.purpose === purpose)
}
