
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
 * Returns the Zone Contexts (Forbidden + Reminder), potentially overridden for Rich designs.
 * For 'Rich' designs, it replaces "Keep Clear" with "Integrate Logo" instructions.
 */
export function getIntegratedZoneContext(options: EnhancedBuildOptions, sophistication: 'minimalist' | 'balanced' | 'rich') {
    let forbiddenZonesContext = buildForbiddenZonesSection(options.logoAwareness)
    let zoneReminderContext = buildZoneReminderSection(options.logoAwareness)

    if (sophistication === 'rich') {
        // OVERRIDE: For Rich designs, we KILL the strict white header bar logic.
        // Instead of patching the strict text, we provide a completely new instruction set for the top zone.

        const logoPos = options.logoAwareness?.logoPosition || 'corners';

        zoneReminderContext = `
LOGO INTEGRATION GUIDANCE (IMMERSIVE MODE):
- The top 15% header area MUST be part of the main background art.
- CRITICAL: Do NOT create a solid white bar or stripe at the top.
- The background should extend edge-to-edge.
- Logos will be overlaid in white; ensure the top area has enough contrast (e.g., use a subtle gradient or dark sky), but keep it artistic.
- NO "Organization Logo" text placeholders.`

        // We completely replace the "Forbidden Zone" text to remove the "simple, clean background" requirement
        forbiddenZonesContext = `
LAYOUT GUIDANCE:
- Create a full-bleed, immersive design that fills the entire canvas.
- The top 15% is reserved for logos but should remain part of the scene (e.g., sky, texture).
- Do not place main subjects (faces, text) in the top 15% or bottom 10%.
- Center the main event title in the middle visual zone.`
    }

    return { forbiddenZonesContext, zoneReminderContext }
}
