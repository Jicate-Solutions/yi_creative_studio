import { NextResponse } from 'next/server';
import { analyzeEventWithAgentSafe } from '@/lib/agents/design-analysis-agent';

export async function GET() {
    const input = {
        title: "Midnight Jazz & Ramen",
        description: "A pop-up rooftop event combining lo-fi jazz beats with gourmet ramen bowls. Cozy, urban, late-night vibe. Tokyo noir aesthetic.",
        venue: "Skyline Rooftop Garden"
    };

    // Minimal constraints to allow full creativity
    const constraints = {
        formatDimensions: { width: 1080, height: 1080 }
    };

    try {
        const result = await analyzeEventWithAgentSafe(input, constraints);
        return NextResponse.json(result);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
