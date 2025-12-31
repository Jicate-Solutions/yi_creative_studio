import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { createUsageTracker } from '@/lib/services/api-usage'

// Model constant for easy updates
const HAIKU_MODEL = 'claude-haiku-4-5'

// Initialize Anthropic client with explicit API key
function getAnthropicClient(): Anthropic | null {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.error('ANTHROPIC_API_KEY environment variable is not configured')
    return null
  }
  return new Anthropic({ apiKey })
}

interface FeedbackRecord {
  id: string
  rating: number
  comment: string | null
  issue_categories: string[]
  creative_type: string
  vertical: string | null
  prompt_used: string | null
  form_data: Record<string, unknown>
}

interface AnalysisPattern {
  issue: string
  affectedFormats: string[]
  feedbackIds: string[]
  confidence: number
  suggestedFix: {
    targetFile: string
    patchType: 'addition' | 'modification'
    proposedChange: string
    reasoning: string
  }
}

interface AnalysisResult {
  patterns: AnalysisPattern[]
  noActionNeeded: string[]
}

export async function POST(request: NextRequest) {
  try {
    // Validate Anthropic API key first
    const anthropic = getAnthropicClient()
    if (!anthropic) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY not configured' },
        { status: 500 }
      )
    }

    const supabase = await createClient()

    // Auth check - admin only
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin role
    const { data: member } = await supabase
      .from('organization_members')
      .select('role, organization_id')
      .eq('user_id', user.id)
      .single()

    if (!member || !['owner', 'admin'].includes(member.role)) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Get unanalyzed feedback (batch of 50 max)
    // Note: Using type assertion as creative_feedback may not be in generated types yet
    const { data: feedbackRecords, error } = await (supabase.from as Function)('creative_feedback')
      .select('*')
      .eq('analyzed', false)
      .lte('rating', 3) // Focus on negative/neutral feedback
      .order('created_at', { ascending: true })
      .limit(50)

    if (error || !feedbackRecords?.length) {
      return NextResponse.json({
        message: 'No unanalyzed feedback to process',
        count: 0,
      })
    }

    // Create usage tracker
    const usageTracker = createUsageTracker({
      organizationId: member.organization_id,
      userId: user.id,
    })

    // Prepare feedback summary for Claude
    const feedbackSummary = feedbackRecords.map((f: FeedbackRecord) => ({
      id: f.id,
      rating: f.rating,
      issues: f.issue_categories,
      comment: f.comment,
      creativeType: f.creative_type,
      vertical: f.vertical,
      promptExcerpt: f.prompt_used?.slice(0, 500),
    }))

    // Analyze with Claude
    const response = await anthropic.messages.create({
      model: HAIKU_MODEL,
      max_tokens: 4000,
      system: `You are a design system improvement analyst for Yi CreativeStudio, an AI-powered creative generation platform.

Your task is to analyze user feedback about generated images and identify actionable improvements to the prompt knowledge base.

The knowledge base structure:
- base-patterns/: Core patterns for text rendering, composition, color harmony, etc.
- format-overrides/: Format-specific adjustments (poster, instagram, certificate, etc.)
- design-architecture/: Layout systems and grid guidelines

When analyzing feedback, identify:
1. Recurring issues (same problem across multiple feedback entries)
2. Format-specific problems (issues only in certain creative types)
3. Clear patterns that can be addressed by prompt modifications

Output JSON with this structure:
{
  "patterns": [
    {
      "issue": "Description of the recurring issue",
      "affectedFormats": ["event_poster", "instagram"],
      "feedbackIds": ["id1", "id2"],
      "confidence": 0.85,
      "suggestedFix": {
        "targetFile": "base-patterns/text-rendering.ts",
        "patchType": "addition|modification",
        "proposedChange": "Add instruction: 'Ensure text has minimum 40% contrast ratio with background'",
        "reasoning": "Multiple users reported text readability issues..."
      }
    }
  ],
  "noActionNeeded": ["id3", "id4"]
}

Important guidelines:
- Only propose patches with confidence >= 0.6
- Group similar issues together
- Target the most specific file possible (format-specific over base patterns)
- Keep proposed changes concise and actionable
- Consider whether the issue is systemic or one-off`,
      messages: [
        {
          role: 'user',
          content: `Analyze this batch of user feedback and identify improvement patterns:

${JSON.stringify(feedbackSummary, null, 2)}

Identify recurring issues and propose specific knowledge base improvements.`,
        },
      ],
    })

    // Track usage
    const usage = response.usage
    await usageTracker.track(
      'feedback_analysis',
      'claude',
      HAIKU_MODEL,
      {
        inputTokens: usage.input_tokens,
        outputTokens: usage.output_tokens,
        cachedTokens: 0,
      }
    )

    // Parse response
    const content = response.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type')
    }

    let analysis: AnalysisResult | null = null
    try {
      // Extract JSON from response
      const jsonMatch = content.text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0])
      }
    } catch (parseError) {
      console.error('Failed to parse analysis:', parseError)
      return NextResponse.json(
        { error: 'Failed to parse analysis' },
        { status: 500 }
      )
    }

    // Create knowledge patches for identified patterns
    const createdPatches = []
    if (analysis?.patterns) {
      for (const pattern of analysis.patterns) {
        if (pattern.confidence >= 0.6 && pattern.suggestedFix) {
          // Note: Using type assertion as knowledge_patches may not be in generated types yet
          const { data: patch } = await (supabase.from as Function)('knowledge_patches')
            .insert({
              target_file: pattern.suggestedFix.targetFile,
              patch_type: pattern.suggestedFix.patchType,
              proposed_content: pattern.suggestedFix.proposedChange,
              reasoning: pattern.suggestedFix.reasoning,
              feedback_ids: pattern.feedbackIds,
              feedback_count: pattern.feedbackIds.length,
              pattern_confidence: pattern.confidence,
              status: 'pending',
            })
            .select()
            .single()

          if (patch) {
            createdPatches.push(patch)
          }
        }
      }
    }

    // Mark all processed feedback as analyzed
    const allFeedbackIds = feedbackRecords.map((f: FeedbackRecord) => f.id)
    // Note: Using type assertion as creative_feedback may not be in generated types yet
    await (supabase.from as Function)('creative_feedback')
      .update({ analyzed: true, analyzed_at: new Date().toISOString() })
      .in('id', allFeedbackIds)

    return NextResponse.json({
      success: true,
      analyzed: feedbackRecords.length,
      patchesCreated: createdPatches.length,
      patches: createdPatches,
      tokensUsed: {
        input: usage.input_tokens,
        output: usage.output_tokens,
      },
    })
  } catch (error) {
    console.error('Feedback analyzer error:', error)

    // Provide more specific error messages
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    // Check for common error types
    if (errorMessage.includes('ENOTFOUND') || errorMessage.includes('ECONNREFUSED') || errorMessage.includes('fetch failed')) {
      return NextResponse.json(
        { error: 'Network error: Unable to reach Anthropic API. Please check your internet connection.' },
        { status: 503 }
      )
    }

    if (errorMessage.includes('401') || errorMessage.includes('authentication')) {
      return NextResponse.json(
        { error: 'Authentication error: Invalid Anthropic API key.' },
        { status: 401 }
      )
    }

    if (errorMessage.includes('429') || errorMessage.includes('rate limit')) {
      return NextResponse.json(
        { error: 'Rate limit exceeded: Too many requests to Anthropic API.' },
        { status: 429 }
      )
    }

    if (errorMessage.includes('model') || errorMessage.includes('not found')) {
      return NextResponse.json(
        { error: `Model error: ${errorMessage}` },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: `Analysis failed: ${errorMessage}` },
      { status: 500 }
    )
  }
}
