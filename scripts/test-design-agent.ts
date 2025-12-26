import { analyzeEventWithAgentSafe } from '../lib/agents/design-analysis-agent';
import { config } from 'dotenv';
import path from 'path';

// Load env vars
config({ path: path.resolve(process.cwd(), '.env.local') });

async function testAgent() {
    console.log('🧪 Testing Creative Design Agent...\n');

    const input = {
        title: "Midnight Jazz & Ramen",
        description: "A pop-up rooftop event combining lo-fi jazz beats with gourmet ramen bowls. Cozy, urban, late-night vibe.",
        venue: "Skyline Rooftop Garden"
    };

    const constraints = {
        formatDimensions: { width: 1080, height: 1080 }
    };

    try {
        const result = await analyzeEventWithAgentSafe(input, constraints);

        console.log('\n✨ ANALYSIS RESULT ✨\n');
        console.log('🧠 THINKING PROCESS:');
        console.log(result.recommendation.thinkingProcess);

        console.log('\n🎨 SECTOR 1: VISUALS');
        console.log('Prompt:', result.recommendation.imagePrompt);

        console.log('\n📢 SECTOR 2: STRATEGY');
        console.log(JSON.stringify(result.recommendation.contentStrategy, null, 2));

        console.log('\n🖌️ SECTOR 3: DESIGN');
        console.log('Layout:', result.recommendation.layoutSuggestion);
        if (result.recommendation.colorPalette) {
            console.log('Colors:', Object.values(result.recommendation.colorPalette).map(c => c.hex).join(', '));
        }

        console.log('\n✅ Test Completed');
    } catch (error) {
        console.error('❌ Test Failed:', error);
    }
}

testAgent();
