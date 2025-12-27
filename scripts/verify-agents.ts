
import { analyzeEventWithAgentSafe } from '../lib/agents/design-analysis-agent';
import { generateDesignContext } from '../lib/prompts/services/design-intelligence';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function verifyAgents() {
    console.log('=== STARTING AGENT VERIFICATION ===');

    const testInput = {
        title: 'Test Event',
        description: 'A simple test event to verify agent logic.',
        venue: 'Test Venue',
    };

    const testConstraints = {
        formatDimensions: { width: 1080, height: 1080 },
    };

    // Test 1: Design Analysis Agent (Claude)
    console.log('\n--- Testing Design Analysis Agent (analyzeEventWithAgentSafe) ---');
    try {
        const startTime = Date.now();
        const result = await Promise.race([
            analyzeEventWithAgentSafe(testInput, testConstraints),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 30000))
        ]);
        const duration = Date.now() - startTime;
        console.log(`[SUCCESS] Design Analysis Agent responded in ${duration}ms`);
        console.log('Result:', JSON.stringify(result, null, 2).substring(0, 200) + '...');
    } catch (error: any) {
        console.error('[FAILURE] Design Analysis Agent failed:', error.message);
    }

    // Test 2: Design Intelligence (Gemini/Claude)
    console.log('\n--- Testing Design Intelligence (generateDesignContext) ---');
    try {
        const designBrief = {
            eventName: 'Test Event II',
            details: 'Another simple test event.',
            formatId: 'instagram_post'
        };
        const startTime = Date.now();
        const result = await Promise.race([
            generateDesignContext(designBrief),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 30000))
        ]);
        const duration = Date.now() - startTime;
        console.log(`[SUCCESS] Design Intelligence responded in ${duration}ms`);
        console.log('Result:', JSON.stringify(result, null, 2).substring(0, 200) + '...');
    } catch (error: any) {
        console.error('[FAILURE] Design Intelligence failed:', error.message);
    }

    console.log('\n=== VERIFICATION COMPLETE ===');
}

verifyAgents().catch(console.error);
