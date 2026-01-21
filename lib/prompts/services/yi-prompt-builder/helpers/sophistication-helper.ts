
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
 * v6.0: Enhanced with dual-stripe awareness for two-row logo layouts
 * - If logo strip enabled: Keep top area CLEAN (Sharp adds the white strip background)
 * - If logo strip disabled + Rich: Use immersive mode (no visible band)
 * - If logo strip disabled + Minimalist/Balanced: Use default (no visible band, simple background)
 */
export function getIntegratedZoneContext(options: EnhancedBuildOptions, sophistication: 'minimalist' | 'balanced' | 'rich') {
    // v6.0: Detect dual-stripe mode (logoStripMode enabled + verticalId present)
    const dualStripeMode = (options.logoStripMode?.enabled || false) && !!options.verticalId

    let forbiddenZonesContext = buildForbiddenZonesSection(options.logoAwareness, dualStripeMode)
    let zoneReminderContext = buildZoneReminderSection(options.logoAwareness)

    // v5.3: PRIORITY 1 - If logo strip enabled, Sharp handles entire logo strip area
    // v6.0: Adjusted percentages for dual-stripe mode (18% header, 20% title start)
    // AI should START the design below the logo strip area (8% for single, 18% for dual)
    // Sharp will overlay logo strip(s) - AI design should not extend into this area
    if (options.logoStripMode?.enabled) {
        const headerPercent = dualStripeMode ? 18 : 8
        const titleStartPercent = dualStripeMode ? 20 : 15

        zoneReminderContext = `
CRITICAL - TOP AREA IS RESERVED:
- START your design at approximately ${headerPercent}% from the top edge.
- The top ${headerPercent}% is handled separately - do NOT generate anything there.
- Your main design canvas begins BELOW the ${headerPercent}% line.
- Position all visual elements (backgrounds, graphics, text) starting from ${headerPercent}% down.`

        forbiddenZonesContext = `
LAYOUT GUIDANCE:
- The top ${headerPercent}% of the canvas is reserved and will be replaced.
- Begin your background design at ${headerPercent}% from the top.
- Position the main headline starting at approximately ${titleStartPercent}% from top.
- Do NOT let background elements, gradients, or graphics extend into the top ${headerPercent}%.
- Treat ${headerPercent}% from top as the TOP EDGE of your design canvas.`

        return { forbiddenZonesContext, zoneReminderContext }
    }

    // v5.1: PRIORITY 2 - If logo strip disabled + Rich sophistication, use immersive mode
    if (sophistication === 'rich') {
        // OVERRIDE: For Rich designs WITHOUT logo strip, we use integrated immersive background
        const logoPos = options.logoAwareness?.logoPosition || 'corners';

        zoneReminderContext = `
IMMERSIVE BACKGROUND GUIDANCE:
- Create edge-to-edge background art that flows through ALL regions of the canvas
- Background (colors, gradients, ambient elements) MAY extend through forbidden zones
- HOWEVER: Text and focal visual elements MUST respect <text_zone> boundaries in <spatial_layout_constraints>
- The forbidden zones will have logo overlays applied - keep them free of text/graphics
- Use subtle contrast or gradients in forbidden zone backgrounds for logo visibility`

        // We completely replace the "Forbidden Zone" text to remove the "simple, clean background" requirement
        forbiddenZonesContext = `
LAYOUT GUIDANCE:
- Create a full-bleed, immersive design that fills the entire canvas
- Background elements (colors, gradients, textures) may flow through all areas
- Text and focal elements MUST be positioned within designated <text_zone> areas only
- Refer to <spatial_layout_constraints> for exact Y-coordinate boundaries
- Use subtle contrast in logo overlay areas for visual continuity`
    }

    // v5.1: PRIORITY 3 - Default (logo strip disabled + Minimalist/Balanced): Use default forbidden zones
    // The default buildForbiddenZonesSection already says "DO NOT create a visible stripe or band"
    return { forbiddenZonesContext, zoneReminderContext }
}
