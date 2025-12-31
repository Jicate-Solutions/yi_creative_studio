
import type { EnhancedBuildOptions } from '../types'
import { buildForbiddenZonesSection, buildZoneReminderSection } from './logo-zone-enforcement'

// Keywords that suggest a Rich/Immersive design (Festivals, Parties, High-Energy)
const RICH_KEYWORDS = [
    // Festivals & Holidays
    'christmas', 'xmas', 'diwali', 'deepavali', 'eid', 'ramadan', 'holi', 'onam', 'pongal',
    'halloween', 'easter', 'thanksgiving', 'new year', 'fest', 'festival', 'carnival',
    // Parties & Celebrations
    'gala', 'night', 'bash', 'party', 'celebration', 'concert', 'dj', 'music',
    'drive', 'contest', 'challenge', 'marathon', 'hackathon',
    // Vibes
    'neon', 'cyber', 'future', 'glow', 'luxury', 'awards'
];

/**
 * Determines the design sophistication level based on Design Intelligence context.
 * Used to switch between "Minimalist" (Corporate) and "Rich" (Immersive) modes.
 */
export function getSophistication(options: EnhancedBuildOptions, defaultMode: 'rich' | 'minimalist' | 'balanced' = 'rich'): 'minimalist' | 'balanced' | 'rich' {
    // 1. Check Design Intelligence Strategy (Strongest Signal)
    if (options.designContext?.designStrategy?.includes('Rich') ||
        options.designContext?.designStrategy?.includes('Immersive') ||
        options.designContext?.designStrategy?.includes('High-Fidelity')) {
        return 'rich';
    }

    // 2. Check Explicit Sophistication Option
    if ((options as any).sophistication) {
        return (options as any).sophistication;
    }

    // 3. Check Event Name/Type for Keywords (Heuristic Fallback)
    // This catches "Merry Christmas" even if AI didn't explicitly flag it as "Rich" strategy
    const combinedText = ((options as any).eventName || '') + ' ' + ((options as any).eventType || '');
    if (combinedText && RICH_KEYWORDS.some(k => combinedText.toLowerCase().includes(k))) {
        return 'rich';
    }

    // 4. Default Fallback
    return defaultMode;
}

/**
 * Returns the Zone Contexts (Forbidden + Reminder), potentially overridden for Rich designs or Logo Strip mode.
 * v5.2: Sharp post-processing adds the logo strip background - AI just keeps area clean
 * - If logo strip enabled: Keep top area CLEAN (Sharp adds the white strip background)
 * - If logo strip disabled + Rich: Use immersive mode (no visible band)
 * - If logo strip disabled + Minimalist/Balanced: Use default (no visible band, simple background)
 */
export function getIntegratedZoneContext(options: EnhancedBuildOptions, sophistication: 'minimalist' | 'balanced' | 'rich') {
    let forbiddenZonesContext = buildForbiddenZonesSection(options.logoAwareness)
    let zoneReminderContext = buildZoneReminderSection(options.logoAwareness)

    // v5.3: PRIORITY 1 - If logo strip enabled, Sharp handles entire logo strip area
    // AI should START the design below the logo strip area (approximately 8% from top)
    // Sharp will overlay a white strip with logos - AI design should not extend into this area
    if (options.logoStripMode?.enabled) {
        zoneReminderContext = `
CRITICAL - TOP AREA IS RESERVED:
- START your design at approximately 8% from the top edge.
- The top 8% is handled separately - do NOT generate anything there.
- Your main design canvas begins BELOW the 8% line.
- Position all visual elements (backgrounds, graphics, text) starting from 8% down.`

        forbiddenZonesContext = `
LAYOUT GUIDANCE:
- The top 8% of the canvas is reserved and will be replaced.
- Begin your background design at 8% from the top.
- Position the main headline starting at approximately 15-20% from top.
- Do NOT let background elements, gradients, or graphics extend into the top 8%.
- Treat 8% from top as the TOP EDGE of your design canvas.`

        return { forbiddenZonesContext, zoneReminderContext }
    }

    // v5.1: PRIORITY 2 - If logo strip disabled + Rich sophistication, use immersive mode
    if (sophistication === 'rich') {
        // OVERRIDE: For Rich designs WITHOUT logo strip, we use integrated immersive background
        const logoPos = options.logoAwareness?.logoPosition || 'corners';

        zoneReminderContext = `
IMMERSIVE BACKGROUND GUIDANCE:
- The top 15% header area MUST be part of the main background art.
- CRITICAL: Do NOT create a solid white bar or stripe at the top.
- The background should extend edge-to-edge with artistic continuity.
- Ensure the top area has enough contrast (e.g., use a subtle gradient or dark sky), but keep it artistic.
- Keep the top 15% area empty with only background elements.`

        // We completely replace the "Forbidden Zone" text to remove the "simple, clean background" requirement
        forbiddenZonesContext = `
LAYOUT GUIDANCE:
- Create a full-bleed, immersive design that fills the entire canvas.
- The top 15% should remain part of the scene (e.g., sky, texture) with subtle contrast.
- Do not place main subjects (faces, text) in the top 15% or bottom 10%.
- Center the main event title in the middle visual zone.
- Do NOT generate any text or labels in the top and bottom areas.`
    }

    // v5.1: PRIORITY 3 - Default (logo strip disabled + Minimalist/Balanced): Use default forbidden zones
    // The default buildForbiddenZonesSection already says "DO NOT create a visible stripe or band"
    return { forbiddenZonesContext, zoneReminderContext }
}
