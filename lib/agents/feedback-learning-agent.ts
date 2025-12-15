/**
 * Feedback Learning Agent - Claude ADK Implementation
 *
 * An autonomous agent that learns from user feedback and prevents issues
 * in creative generation. Three operational modes:
 *
 * 1. UNDERSTAND: Build comprehensive understanding of the 10-stage pipeline
 * 2. ANALYZE: Process feedback batches and generate improvement patches
 * 3. PREVENT: Pre-check generation requests against learned patterns
 *
 * Design Principles:
 * - Manual trigger for analysis (admin-controlled)
 * - All patches require admin approval (never auto-apply)
 * - Integrated prevention (checks every generation request)
 * - Full pipeline understanding for accurate root cause analysis
 */

import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import type {
  AgentMode,
  AgentStage,
  AgentUsage,
  FeedbackLearningAgentState,
  PipelineUnderstanding,
  LearnedPattern,
  AnalysisResult,
  AnalysisPattern,
  PreventionResult,
  PatternMatch,
  RequestAdjustment,
  GenerationRequest,
  KnowledgePatchRecord,
  FeedbackSummary,
  UnderstandResponse,
  AnalyzeResponse,
  PreventResponse,
} from '@/types/feedback-agent.types'
import {
  AGENT_MODELS,
  PREVENTION_CONFIDENCE_THRESHOLD,
  PATCH_CREATION_CONFIDENCE_THRESHOLD,
  MAX_FEEDBACK_BATCH_SIZE,
  PIPELINE_STAGES,
  ISSUE_CATEGORY_STAGE_MAP,
} from '@/types/feedback-agent.types'

// ============================================================
// MAIN AGENT CLASS
// ============================================================

export class FeedbackLearningAgent {
  private client: Anthropic
  private state: FeedbackLearningAgentState
  private modelName: string
  private mode: AgentMode

  constructor(mode: AgentMode = 'prevent') {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY is not configured')
    }
    this.client = new Anthropic({ apiKey })
    this.mode = mode
    this.modelName = AGENT_MODELS[mode]
    this.state = this.createInitialState()
  }

  /**
   * Create initial agent state
   */
  private createInitialState(): FeedbackLearningAgentState {
    return {
      stage: 'idle',
      mode: this.mode,
      sessionId: null,
      pipelineUnderstanding: null,
      learnedPatterns: [],
      currentAnalysis: null,
      pendingPatches: [],
      usage: {
        totalTokens: 0,
        inputTokens: 0,
        outputTokens: 0,
        totalDurationMs: 0,
        apiCalls: 0,
        estimatedCostUsd: 0,
      },
    }
  }

  // ============================================================
  // MODE 1: UNDERSTAND - Build Pipeline Understanding
  // ============================================================

  /**
   * Build comprehensive understanding of the creative generation pipeline
   */
  async understand(forceRefresh = false): Promise<UnderstandResponse> {
    const startTime = Date.now()
    this.state.stage = 'learning'
    this.state.mode = 'understand'

    console.log('[Learning Agent] === UNDERSTAND MODE ===')

    try {
      const supabase = await createClient()

      // Check for cached understanding
      if (!forceRefresh) {
        const { data: cached } = await (supabase.from as Function)('pipeline_understanding')
          .select('*')
          .order('version', { ascending: false })
          .limit(1)
          .single()

        if (cached && new Date(cached.expires_at) > new Date()) {
          console.log('[Learning Agent] Using cached pipeline understanding v' + cached.version)
          this.state.pipelineUnderstanding = cached as PipelineUnderstanding
          this.state.stage = 'complete'

          return {
            success: true,
            pipelineUnderstanding: cached as PipelineUnderstanding,
            newInsights: [],
            filesAnalyzed: cached.total_files,
            duration: Date.now() - startTime,
            usage: this.state.usage,
          }
        }
      }

      // Build new understanding using Claude
      const pipelineDescription = await this.buildPipelineDescription()
      const understanding = await this.analyzePipeline(pipelineDescription)

      // Store in database
      const { data: stored } = await (supabase.from as Function)('pipeline_understanding')
        .insert({
          version: (understanding.version || 0) + 1,
          stages: understanding.stages,
          interconnections: understanding.interconnections,
          format_specific_paths: understanding.formatSpecificPaths,
          key_insights: understanding.keyInsights,
          total_files: understanding.totalFiles,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        })
        .select()
        .single()

      this.state.pipelineUnderstanding = stored || understanding
      this.state.stage = 'complete'

      console.log('[Learning Agent] Pipeline understanding built with', understanding.keyInsights.length, 'insights')

      return {
        success: true,
        pipelineUnderstanding: this.state.pipelineUnderstanding,
        newInsights: understanding.keyInsights,
        filesAnalyzed: understanding.totalFiles,
        duration: Date.now() - startTime,
        usage: this.state.usage,
      }
    } catch (error) {
      this.state.stage = 'error'
      this.state.error = error instanceof Error ? error.message : 'Unknown error'
      console.error('[Learning Agent] Understand error:', this.state.error)

      return {
        success: false,
        pipelineUnderstanding: this.getDefaultPipelineUnderstanding(),
        newInsights: [],
        filesAnalyzed: 0,
        duration: Date.now() - startTime,
        usage: this.state.usage,
      }
    }
  }

  /**
   * Build pipeline description from stage definitions
   */
  private async buildPipelineDescription(): Promise<string> {
    const stageDescriptions = PIPELINE_STAGES.map(stage =>
      `Stage ${stage.order}: ${stage.name}\n  - File: ${stage.file}\n  - ID: ${stage.id}`
    ).join('\n\n')

    return `Creative Generation Pipeline (10 Stages):

${stageDescriptions}

Issue Category to Stage Mapping:
${Object.entries(ISSUE_CATEGORY_STAGE_MAP).map(([cat, stages]) =>
  `- ${cat}: ${stages.join(', ')}`
).join('\n')}

Key Files:
- Form compiler: lib/prompts/services/form-data-compiler.ts
- Prompt builder: lib/prompts/services/yi-prompt-builder/
- Design intelligence: lib/prompts/services/design-intelligence.ts
- Logo overlay: lib/sharp/logo-overlay.ts
- Knowledge base: lib/prompts/knowledge-base/`
  }

  /**
   * Analyze pipeline using Claude
   */
  private async analyzePipeline(description: string): Promise<PipelineUnderstanding> {
    const startTime = Date.now()

    const response = await this.client.messages.create({
      model: AGENT_MODELS.understand,
      max_tokens: 4000,
      system: `You are an AI system analyst specializing in understanding creative generation pipelines.
Analyze the provided pipeline structure and extract key insights about:
1. How data flows between stages
2. Common failure points and their root causes
3. Which stages are most likely to cause specific issue categories
4. Modification points where fixes should be applied

Output JSON with this structure:
{
  "stages": [...],
  "interconnections": [...],
  "formatSpecificPaths": {...},
  "keyInsights": ["insight1", "insight2", ...],
  "totalFiles": number
}`,
      messages: [
        {
          role: 'user',
          content: `Analyze this creative generation pipeline:\n\n${description}`,
        },
      ],
    })

    this.updateUsage(response.usage.input_tokens, response.usage.output_tokens, Date.now() - startTime)

    const content = response.content[0]
    if (content.type !== 'text') {
      return this.getDefaultPipelineUnderstanding()
    }

    try {
      const jsonMatch = content.text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return {
          version: 1,
          stages: parsed.stages || [],
          interconnections: parsed.interconnections || [],
          formatSpecificPaths: parsed.formatSpecificPaths || {},
          keyInsights: parsed.keyInsights || [],
          totalFiles: parsed.totalFiles || PIPELINE_STAGES.length,
          lastUpdated: new Date().toISOString(),
        }
      }
    } catch (e) {
      console.error('[Learning Agent] Failed to parse pipeline analysis:', e)
    }

    return this.getDefaultPipelineUnderstanding()
  }

  // ============================================================
  // MODE 2: ANALYZE - Process Feedback and Create Patches
  // ============================================================

  /**
   * Analyze feedback batch and generate knowledge patches
   */
  async analyze(filters?: {
    maxRating?: number
    maxFeedback?: number
    minConfidence?: number
  }): Promise<AnalyzeResponse> {
    const startTime = Date.now()
    this.state.stage = 'analyzing'
    this.state.mode = 'analyze'

    console.log('[Learning Agent] === ANALYZE MODE ===')

    try {
      const supabase = await createClient()

      // Get unanalyzed feedback
      const maxRating = filters?.maxRating ?? 3
      const maxFeedback = Math.min(filters?.maxFeedback ?? MAX_FEEDBACK_BATCH_SIZE, MAX_FEEDBACK_BATCH_SIZE)
      const minConfidence = filters?.minConfidence ?? PATCH_CREATION_CONFIDENCE_THRESHOLD

      const { data: feedbackRecords, error } = await (supabase.from as Function)('creative_feedback')
        .select('*')
        .eq('analyzed', false)
        .lte('rating', maxRating)
        .order('created_at', { ascending: true })
        .limit(maxFeedback)

      if (error || !feedbackRecords?.length) {
        console.log('[Learning Agent] No unanalyzed feedback to process')
        this.state.stage = 'complete'
        return {
          success: true,
          analyzed: 0,
          patternsFound: [],
          patchesCreated: [],
          noActionItems: [],
          usage: this.state.usage,
        }
      }

      console.log('[Learning Agent] Analyzing', feedbackRecords.length, 'feedback entries')

      // Prepare feedback summary
      const feedbackSummary: FeedbackSummary[] = feedbackRecords.map((f: Record<string, unknown>) => ({
        id: f.id as string,
        rating: f.rating as number,
        issues: (f.issue_categories as string[]) || [],
        comment: f.comment as string | null,
        creativeType: f.creative_type as string,
        vertical: f.vertical as string | null,
        promptExcerpt: (f.prompt_used as string)?.slice(0, 500) || null,
      }))

      // Load pipeline understanding for context
      if (!this.state.pipelineUnderstanding) {
        await this.understand()
      }

      // Analyze with Claude
      const analysis = await this.performFeedbackAnalysis(feedbackSummary, minConfidence)
      this.state.currentAnalysis = analysis

      // Create patches for identified patterns
      const createdPatches: KnowledgePatchRecord[] = []
      for (const pattern of analysis.patterns) {
        if (pattern.confidence >= minConfidence) {
          const patch = await this.createPatchFromPattern(pattern, supabase)
          if (patch) {
            createdPatches.push(patch)
          }
        }
      }

      // Mark feedback as analyzed
      const feedbackIds = feedbackRecords.map((f: Record<string, unknown>) => f.id)
      await (supabase.from as Function)('creative_feedback')
        .update({ analyzed: true, analyzed_at: new Date().toISOString() })
        .in('id', feedbackIds)

      this.state.pendingPatches = createdPatches
      this.state.stage = 'complete'

      console.log('[Learning Agent] Analysis complete:', {
        analyzed: feedbackRecords.length,
        patterns: analysis.patterns.length,
        patches: createdPatches.length,
      })

      return {
        success: true,
        analyzed: feedbackRecords.length,
        patternsFound: analysis.patterns,
        patchesCreated: createdPatches,
        noActionItems: analysis.noActionNeeded,
        usage: this.state.usage,
      }
    } catch (error) {
      this.state.stage = 'error'
      this.state.error = error instanceof Error ? error.message : 'Unknown error'
      console.error('[Learning Agent] Analyze error:', this.state.error)

      return {
        success: false,
        analyzed: 0,
        patternsFound: [],
        patchesCreated: [],
        noActionItems: [],
        usage: this.state.usage,
      }
    }
  }

  /**
   * Perform feedback analysis using Claude
   */
  private async performFeedbackAnalysis(
    feedbackSummary: FeedbackSummary[],
    minConfidence: number
  ): Promise<AnalysisResult> {
    const startTime = Date.now()

    const pipelineContext = this.state.pipelineUnderstanding
      ? `Pipeline stages: ${this.state.pipelineUnderstanding.stages.map(s => s.name).join(', ')}\n\nKey insights: ${this.state.pipelineUnderstanding.keyInsights.join('; ')}`
      : 'Pipeline: 10-stage creative generation (form data -> prompt -> image generation -> post-processing)'

    const response = await this.client.messages.create({
      model: AGENT_MODELS.analyze,
      max_tokens: 4000,
      system: `You are a design system improvement analyst for Yi CreativeStudio.
Analyze user feedback about AI-generated images and identify actionable improvements.

${pipelineContext}

Issue categories map to stages:
- text_rendering: ultra_pro_prompt, prompt_building, image_generation
- layout: design_intelligence, prompt_building, logo_awareness
- colors: design_intelligence, prompt_building
- logo: logo_awareness, post_processing
- style: design_intelligence, ultra_pro_prompt, prompt_building

When analyzing feedback, identify:
1. Recurring issues (same problem across multiple entries)
2. Format-specific problems (issues only in certain creative types)
3. Clear patterns addressable by prompt modifications

Output JSON:
{
  "patterns": [
    {
      "issue": "Description",
      "affectedFormats": ["event_poster", "instagram"],
      "feedbackIds": ["id1", "id2"],
      "confidence": 0.85,
      "suggestedFix": {
        "targetFile": "base-patterns/text-rendering.ts",
        "targetStage": "prompt_building",
        "patchType": "addition|modification",
        "proposedChange": "Specific change",
        "reasoning": "Why this fix"
      }
    }
  ],
  "noActionNeeded": ["id3"]
}

Only propose patterns with confidence >= ${minConfidence}`,
      messages: [
        {
          role: 'user',
          content: `Analyze this feedback batch:\n\n${JSON.stringify(feedbackSummary, null, 2)}`,
        },
      ],
    })

    this.updateUsage(response.usage.input_tokens, response.usage.output_tokens, Date.now() - startTime)

    const content = response.content[0]
    if (content.type !== 'text') {
      return { patterns: [], noActionNeeded: [], feedbackAnalyzed: 0, patchesCreated: 0, tokensUsed: { input: 0, output: 0 } }
    }

    try {
      const jsonMatch = content.text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return {
          patterns: parsed.patterns || [],
          noActionNeeded: parsed.noActionNeeded || [],
          feedbackAnalyzed: feedbackSummary.length,
          patchesCreated: 0,
          tokensUsed: {
            input: response.usage.input_tokens,
            output: response.usage.output_tokens,
          },
        }
      }
    } catch (e) {
      console.error('[Learning Agent] Failed to parse analysis:', e)
    }

    return { patterns: [], noActionNeeded: [], feedbackAnalyzed: 0, patchesCreated: 0, tokensUsed: { input: 0, output: 0 } }
  }

  /**
   * Create a knowledge patch from an analysis pattern
   */
  private async createPatchFromPattern(
    pattern: AnalysisPattern,
    supabase: Awaited<ReturnType<typeof createClient>>
  ): Promise<KnowledgePatchRecord | null> {
    try {
      // v4.0: Generate semantic embedding for the issue description
      let embedding: number[] | undefined
      try {
        const { generateEmbeddingSafe } = await import('@/lib/utils/embeddings')
        embedding = (await generateEmbeddingSafe(pattern.issue)) ?? undefined
        if (embedding) {
          console.log('[Learning Agent] Generated embedding for pattern:', pattern.issue.substring(0, 50))
        }
      } catch (e) {
        console.warn('[Learning Agent] Failed to generate embedding for pattern:', e)
      }

      // First create a learned pattern
      const { data: learnedPattern } = await (supabase.from as Function)('learned_patterns')
        .insert({
          pattern_type: 'issue',
          issue_signature: {
            categories: this.inferCategoriesFromIssue(pattern.issue),
            keywords: this.extractKeywords(pattern.issue),
            affectedFormats: pattern.affectedFormats,
            affectedStages: [pattern.suggestedFix.targetStage],
            minRating: 1,
            maxRating: 3,
          },
          fix_mapping: {
            targetStage: pattern.suggestedFix.targetStage,
            targetFile: pattern.suggestedFix.targetFile,
            modificationPoint: 'auto-detected',
            fixType: pattern.suggestedFix.patchType === 'addition' ? 'prompt_addition' : 'prompt_addition',
            proposedChange: pattern.suggestedFix.proposedChange,
            reasoning: pattern.suggestedFix.reasoning,
          },
          confidence: pattern.confidence,
          created_from_feedback_ids: pattern.feedbackIds,
          status: 'testing',
          // v4.0: Include semantic embedding for similarity matching
          embedding,
        })
        .select()
        .single()

      // Then create the knowledge patch (pending review)
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
          learned_pattern_id: learnedPattern?.id,
          auto_generated: true,
        })
        .select()
        .single()

      return patch as KnowledgePatchRecord
    } catch (e) {
      console.error('[Learning Agent] Failed to create patch:', e)
      return null
    }
  }

  // ============================================================
  // MODE 3: PREVENT - Pre-check Generation Requests
  // ============================================================

  /**
   * Pre-check a generation request against learned patterns
   */
  async prevent(request: GenerationRequest): Promise<PreventResponse> {
    const startTime = Date.now()
    this.state.stage = 'preventing'
    this.state.mode = 'prevent'

    console.log('[Learning Agent] === PREVENT MODE ===')
    console.log('[Learning Agent] Checking request for format:', request.formatId)

    try {
      const supabase = await createClient()

      // Load active learned patterns
      const { data: patterns } = await (supabase.from as Function)('learned_patterns')
        .select('*')
        .eq('status', 'active')
        .gte('confidence', PREVENTION_CONFIDENCE_THRESHOLD)
        .order('confidence', { ascending: false })
        .limit(50)

      if (!patterns?.length) {
        console.log('[Learning Agent] No active patterns to check against')
        this.state.stage = 'complete'
        return {
          success: true,
          shouldAdjust: false,
          adjustments: [],
          matchedPatterns: [],
          confidence: 0,
          reasoning: 'No active patterns to check against',
          usage: this.state.usage,
        }
      }

      // Match patterns against request
      const matches = await this.matchPatternsToRequest(request, patterns as LearnedPattern[])

      if (matches.length === 0) {
        console.log('[Learning Agent] No patterns matched')
        this.state.stage = 'complete'
        return {
          success: true,
          shouldAdjust: false,
          adjustments: [],
          matchedPatterns: [],
          confidence: 0,
          reasoning: 'Request does not match any known issue patterns',
          usage: this.state.usage,
        }
      }

      // Generate adjustments for matched patterns
      const adjustments = await this.generateAdjustments(request, matches)
      const maxConfidence = Math.max(...matches.map(m => m.matchScore))

      // Log prevention action
      const { data: action } = await (supabase.from as Function)('prevention_actions')
        .insert({
          organization_id: request.organizationId,
          matched_patterns: matches.map(m => m.patternId),
          adjustments_applied: adjustments,
        })
        .select()
        .single()

      this.state.stage = 'complete'

      console.log('[Learning Agent] Prevention check complete:', {
        matchedPatterns: matches.length,
        adjustments: adjustments.length,
        maxConfidence,
      })

      return {
        success: true,
        shouldAdjust: adjustments.length > 0,
        adjustments,
        matchedPatterns: matches,
        confidence: maxConfidence,
        reasoning: this.generatePreventionReasoning(matches, adjustments),
        preventionActionId: action?.id,
        usage: this.state.usage,
      }
    } catch (error) {
      this.state.stage = 'error'
      this.state.error = error instanceof Error ? error.message : 'Unknown error'
      console.error('[Learning Agent] Prevent error:', this.state.error)

      return {
        success: false,
        shouldAdjust: false,
        adjustments: [],
        matchedPatterns: [],
        confidence: 0,
        reasoning: `Prevention check failed: ${this.state.error}`,
        usage: this.state.usage,
      }
    }
  }

  /**
   * Match learned patterns against a generation request
   * v4.0: Enhanced with semantic embedding similarity
   */
  private async matchPatternsToRequest(
    request: GenerationRequest,
    patterns: LearnedPattern[]
  ): Promise<PatternMatch[]> {
    const matches: PatternMatch[] = []
    const requestFeatures = this.extractRequestFeatures(request)

    // Generate embedding for request text (for semantic matching)
    let requestEmbedding: number[] | null = null
    try {
      const { generateEmbeddingSafe } = await import('@/lib/utils/embeddings')
      requestEmbedding = await generateEmbeddingSafe(requestFeatures.text)
      if (requestEmbedding) {
        console.log('[Learning Agent] Generated request embedding for semantic matching')
      }
    } catch (e) {
      console.warn('[Learning Agent] Embedding generation failed, using keyword matching only')
    }

    for (const pattern of patterns) {
      const signature = pattern.issue_signature

      // Check format match
      const formatMatch = signature.affectedFormats.length === 0 ||
        signature.affectedFormats.includes(request.formatId)

      if (!formatMatch) continue

      // Semantic similarity score (v4.0)
      let semanticScore = 0
      if (requestEmbedding && pattern.embedding) {
        try {
          const { cosineSimilarity } = await import('@/lib/utils/embeddings')
          semanticScore = cosineSimilarity(requestEmbedding, pattern.embedding)
          // Normalize to 0-1 range (cosine similarity can be -1 to 1)
          semanticScore = (semanticScore + 1) / 2
        } catch (e) {
          console.warn('[Learning Agent] Cosine similarity calculation failed')
        }
      }

      // Check keyword match (fallback/supplement)
      const matchedKeywords = signature.keywords.filter(keyword =>
        requestFeatures.text.toLowerCase().includes(keyword.toLowerCase())
      )

      // Check category match (based on form data characteristics)
      const matchedCategories = signature.categories.filter(cat =>
        this.requestMatchesCategory(request, cat)
      )

      // Calculate keyword score
      const keywordScore = signature.keywords.length > 0
        ? matchedKeywords.length / signature.keywords.length
        : 0.5 // Neutral if no keywords

      const categoryScore = signature.categories.length > 0
        ? matchedCategories.length / signature.categories.length
        : 0.5 // Neutral if no categories

      // Calculate match score with semantic similarity (v4.0)
      // If semantic matching is available, weight it heavily (50%)
      // Otherwise, fall back to pure keyword/category matching
      let matchScore: number
      if (requestEmbedding && pattern.embedding && semanticScore > 0) {
        // Semantic-enhanced scoring:
        // - 50% semantic similarity (captures meaning)
        // - 25% keyword match (captures exact terms)
        // - 15% category match (captures structural patterns)
        // - 10% format match bonus
        matchScore = (
          semanticScore * 0.5 +
          keywordScore * 0.25 +
          categoryScore * 0.15 +
          (formatMatch ? 0.1 : 0)
        ) * pattern.confidence
      } else {
        // Fallback to original keyword-based scoring
        matchScore = (keywordScore * 0.4 + categoryScore * 0.3 + (formatMatch ? 0.3 : 0))
          * pattern.confidence
      }

      if (matchScore >= PREVENTION_CONFIDENCE_THRESHOLD) {
        matches.push({
          patternId: pattern.id,
          pattern,
          matchScore,
          matchedKeywords,
          matchedCategories,
          semanticScore: semanticScore > 0 ? semanticScore : undefined, // v4.0
        })
      }
    }

    return matches.sort((a, b) => b.matchScore - a.matchScore)
  }

  /**
   * Generate adjustments based on matched patterns
   */
  private async generateAdjustments(
    request: GenerationRequest,
    matches: PatternMatch[]
  ): Promise<RequestAdjustment[]> {
    const adjustments: RequestAdjustment[] = []

    for (const match of matches) {
      const fix = match.pattern.fix_mapping

      // Create adjustment based on fix type
      const adjustment: RequestAdjustment = {
        id: `adj-${match.patternId.slice(0, 8)}`,
        type: fix.fixType === 'prompt_addition' ? 'prompt_enhancement' : 'config_override',
        target: fix.targetStage,
        originalValue: null,
        suggestedValue: fix.proposedChange,
        reason: fix.reasoning,
        patternId: match.patternId,
        confidence: match.matchScore,
      }

      adjustments.push(adjustment)
    }

    return adjustments
  }

  /**
   * Generate reasoning summary for prevention result
   */
  private generatePreventionReasoning(
    matches: PatternMatch[],
    adjustments: RequestAdjustment[]
  ): string {
    if (matches.length === 0) {
      return 'No known issue patterns matched this request.'
    }

    const reasons = matches.map(m =>
      `Pattern "${m.pattern.issue_signature.categories.join(', ')}" matched with ${(m.matchScore * 100).toFixed(0)}% confidence`
    )

    return `Detected ${matches.length} potential issue(s): ${reasons.join('; ')}. ` +
      `Generated ${adjustments.length} adjustment(s) to prevent these issues.`
  }

  // ============================================================
  // UTILITY METHODS
  // ============================================================

  /**
   * Extract features from a generation request for pattern matching
   */
  private extractRequestFeatures(request: GenerationRequest): { text: string; categories: string[] } {
    const formData = request.formData
    const textParts: string[] = []

    // Extract all text values from form data
    for (const [key, value] of Object.entries(formData)) {
      if (typeof value === 'string' && value.length > 0) {
        textParts.push(value)
      }
    }

    // Infer categories from format and form data
    const categories: string[] = []
    if (request.logosPlacements?.length) categories.push('logo')
    if (formData.colors || formData.primaryColor) categories.push('colors')
    if (formData.title || formData.headline) categories.push('text_rendering')
    if (formData.layout || formData.templateId) categories.push('layout')

    return {
      text: textParts.join(' '),
      categories,
    }
  }

  /**
   * Check if a request matches a specific issue category
   */
  private requestMatchesCategory(request: GenerationRequest, category: string): boolean {
    const formData = request.formData

    switch (category) {
      case 'text_rendering':
        return Boolean(formData.title || formData.headline || formData.text)
      case 'layout':
        return Boolean(formData.layout || formData.templateId || formData.aspectRatio)
      case 'colors':
        return Boolean(formData.colors || formData.primaryColor || formData.theme)
      case 'logo':
        return Boolean(request.logosPlacements?.length)
      case 'style':
        return Boolean(formData.style || formData.mood || formData.theme)
      default:
        return false
    }
  }

  /**
   * Infer issue categories from issue description
   */
  private inferCategoriesFromIssue(issue: string): string[] {
    const categories: string[] = []
    const lowerIssue = issue.toLowerCase()

    if (lowerIssue.includes('text') || lowerIssue.includes('font') || lowerIssue.includes('readable')) {
      categories.push('text_rendering')
    }
    if (lowerIssue.includes('layout') || lowerIssue.includes('position') || lowerIssue.includes('alignment')) {
      categories.push('layout')
    }
    if (lowerIssue.includes('color') || lowerIssue.includes('contrast') || lowerIssue.includes('palette')) {
      categories.push('colors')
    }
    if (lowerIssue.includes('logo') || lowerIssue.includes('brand')) {
      categories.push('logo')
    }
    if (lowerIssue.includes('style') || lowerIssue.includes('design') || lowerIssue.includes('visual')) {
      categories.push('style')
    }

    return categories.length > 0 ? categories : ['other']
  }

  /**
   * Extract keywords from issue description
   */
  private extractKeywords(issue: string): string[] {
    // Remove common words and extract meaningful keywords
    const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare', 'ought', 'used', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'under', 'again', 'further', 'then', 'once', 'and', 'but', 'or', 'nor', 'so', 'yet', 'both', 'either', 'neither', 'not', 'only', 'own', 'same', 'than', 'too', 'very', 'just', 'also'])

    const words = issue.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word))

    // Return unique keywords
    return [...new Set(words)].slice(0, 10)
  }

  /**
   * Update usage statistics
   */
  private updateUsage(inputTokens: number, outputTokens: number, durationMs: number): void {
    this.state.usage.inputTokens += inputTokens
    this.state.usage.outputTokens += outputTokens
    this.state.usage.totalTokens += inputTokens + outputTokens
    this.state.usage.totalDurationMs += durationMs
    this.state.usage.apiCalls++

    // Estimate cost (Haiku pricing)
    const inputCost = inputTokens * 0.00025 / 1000
    const outputCost = outputTokens * 0.00125 / 1000
    this.state.usage.estimatedCostUsd += inputCost + outputCost
  }

  /**
   * Get default pipeline understanding (fallback)
   */
  private getDefaultPipelineUnderstanding(): PipelineUnderstanding {
    return {
      version: 0,
      stages: PIPELINE_STAGES.map(s => ({
        id: s.id,
        name: s.name,
        order: s.order,
        description: `Stage ${s.order} of creative generation`,
        inputType: 'unknown',
        outputType: 'unknown',
        filePath: s.file,
        dependencies: [],
        commonIssues: [],
        modificationPoints: [],
      })),
      interconnections: [],
      formatSpecificPaths: {},
      keyInsights: ['Default understanding - run understand mode to build full context'],
      totalFiles: PIPELINE_STAGES.length,
      lastUpdated: new Date().toISOString(),
    }
  }

  /**
   * Get current agent state
   */
  getState(): FeedbackLearningAgentState {
    return { ...this.state }
  }
}

// ============================================================
// SAFE WRAPPER FUNCTIONS
// ============================================================

/**
 * Safe wrapper for understand mode
 */
export async function understandPipelineSafe(
  forceRefresh = false
): Promise<UnderstandResponse> {
  try {
    const agent = new FeedbackLearningAgent('understand')
    return await agent.understand(forceRefresh)
  } catch (error) {
    console.error('[Learning Agent] Safe wrapper error:', error)
    return {
      success: false,
      pipelineUnderstanding: {
        version: 0,
        stages: [],
        interconnections: [],
        formatSpecificPaths: {},
        keyInsights: [],
        totalFiles: 0,
        lastUpdated: new Date().toISOString(),
      },
      newInsights: [],
      filesAnalyzed: 0,
      duration: 0,
      usage: {
        totalTokens: 0,
        inputTokens: 0,
        outputTokens: 0,
        totalDurationMs: 0,
        apiCalls: 0,
        estimatedCostUsd: 0,
      },
    }
  }
}

/**
 * Safe wrapper for analyze mode
 */
export async function analyzeFeedbackSafe(
  filters?: { maxRating?: number; maxFeedback?: number; minConfidence?: number }
): Promise<AnalyzeResponse> {
  try {
    const agent = new FeedbackLearningAgent('analyze')
    return await agent.analyze(filters)
  } catch (error) {
    console.error('[Learning Agent] Safe wrapper error:', error)
    return {
      success: false,
      analyzed: 0,
      patternsFound: [],
      patchesCreated: [],
      noActionItems: [],
      usage: {
        totalTokens: 0,
        inputTokens: 0,
        outputTokens: 0,
        totalDurationMs: 0,
        apiCalls: 0,
        estimatedCostUsd: 0,
      },
    }
  }
}

/**
 * Safe wrapper for prevent mode
 */
export async function preventIssuesSafe(
  request: GenerationRequest
): Promise<PreventResponse> {
  try {
    const agent = new FeedbackLearningAgent('prevent')
    return await agent.prevent(request)
  } catch (error) {
    console.error('[Learning Agent] Safe wrapper error:', error)
    return {
      success: false,
      shouldAdjust: false,
      adjustments: [],
      matchedPatterns: [],
      confidence: 0,
      reasoning: 'Prevention check failed - proceeding without adjustments',
      usage: {
        totalTokens: 0,
        inputTokens: 0,
        outputTokens: 0,
        totalDurationMs: 0,
        apiCalls: 0,
        estimatedCostUsd: 0,
      },
    }
  }
}

// ============================================================
// FIX VALIDATION TRACKING (v4.0)
// ============================================================

/**
 * Link a prevention action to a creative after the creative is saved
 *
 * @param preventionActionId - The ID of the prevention action
 * @param creativeId - The ID of the generated creative
 */
export async function linkPreventionToCreative(
  preventionActionId: string,
  creativeId: string
): Promise<boolean> {
  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from('prevention_actions')
      .update({ creative_id: creativeId })
      .eq('id', preventionActionId)

    if (error) {
      console.error('[Learning Agent] Failed to link prevention to creative:', error)
      return false
    }

    console.log(`[Learning Agent] Linked prevention ${preventionActionId} to creative ${creativeId}`)
    return true
  } catch (e) {
    console.error('[Learning Agent] Error linking prevention to creative:', e)
    return false
  }
}

/**
 * Update prevention effectiveness based on feedback rating
 *
 * This function:
 * 1. Finds the prevention action for the given creative
 * 2. Updates the feedback rating and effectiveness flag
 * 3. Adjusts pattern confidence based on effectiveness
 *
 * @param creativeId - The ID of the creative that received feedback
 * @param feedbackRating - The user's rating (1-5)
 */
export async function updatePreventionEffectiveness(
  creativeId: string,
  feedbackRating: number
): Promise<{ updated: boolean; patternIds: string[] }> {
  try {
    const supabase = await createClient()

    // Find prevention action for this creative
    const { data: action, error: fetchError } = await supabase
      .from('prevention_actions')
      .select('id, matched_patterns')
      .eq('creative_id', creativeId)
      .single()

    if (fetchError || !action) {
      // No prevention action for this creative - that's okay
      console.log('[Learning Agent] No prevention action found for creative:', creativeId)
      return { updated: false, patternIds: [] }
    }

    // Determine effectiveness based on rating
    // Rating 4-5 = fix was effective, 1-3 = fix didn't help
    const fixEffective = feedbackRating >= 4

    // Update the prevention action
    const { error: updateError } = await supabase
      .from('prevention_actions')
      .update({
        feedback_rating: feedbackRating,
        fix_effective: fixEffective,
      })
      .eq('id', action.id)

    if (updateError) {
      console.error('[Learning Agent] Failed to update prevention effectiveness:', updateError)
      return { updated: false, patternIds: [] }
    }

    console.log(`[Learning Agent] Updated prevention ${action.id} effectiveness: ${fixEffective ? 'EFFECTIVE' : 'INEFFECTIVE'} (rating: ${feedbackRating})`)

    // Adjust pattern confidence based on effectiveness
    const patternIds = action.matched_patterns || []
    if (patternIds.length > 0) {
      for (const patternId of patternIds) {
        await adjustPatternConfidence(patternId, fixEffective, supabase)
      }
    }

    return { updated: true, patternIds }
  } catch (e) {
    console.error('[Learning Agent] Error updating prevention effectiveness:', e)
    return { updated: false, patternIds: [] }
  }
}

/**
 * Adjust pattern confidence based on fix effectiveness
 *
 * @param patternId - The pattern to adjust
 * @param effective - Whether the fix was effective
 * @param supabase - Supabase client
 */
async function adjustPatternConfidence(
  patternId: string,
  effective: boolean,
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<void> {
  try {
    // Get current pattern
    const { data: pattern, error: fetchError } = await supabase
      .from('learned_patterns')
      .select('confidence, effectiveness')
      .eq('id', patternId)
      .single()

    if (fetchError || !pattern) {
      console.warn('[Learning Agent] Pattern not found for confidence adjustment:', patternId)
      return
    }

    // Calculate new confidence
    // Effective fixes boost confidence by 5%
    // Ineffective fixes reduce confidence by 10%
    const currentConfidence = pattern.confidence || 0.7
    const adjustment = effective ? 0.05 : -0.10
    const newConfidence = Math.max(0.1, Math.min(1.0, currentConfidence + adjustment))

    // Update effectiveness tracking
    const currentEffectiveness = pattern.effectiveness || {
      timesApplied: 0,
      successRate: 0,
      feedbackImprovement: 0,
      lastEvaluated: null,
    }

    const timesApplied = (currentEffectiveness.timesApplied || 0) + 1
    const successCount = Math.round((currentEffectiveness.successRate || 0) * (currentEffectiveness.timesApplied || 0))
    const newSuccessCount = effective ? successCount + 1 : successCount
    const newSuccessRate = timesApplied > 0 ? newSuccessCount / timesApplied : 0

    // Update pattern
    const { error: updateError } = await supabase
      .from('learned_patterns')
      .update({
        confidence: newConfidence,
        effectiveness: {
          ...currentEffectiveness,
          timesApplied,
          successRate: newSuccessRate,
          lastEvaluated: new Date().toISOString(),
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', patternId)

    if (updateError) {
      console.error('[Learning Agent] Failed to adjust pattern confidence:', updateError)
      return
    }

    console.log(`[Learning Agent] Adjusted pattern ${patternId} confidence: ${currentConfidence.toFixed(2)} -> ${newConfidence.toFixed(2)} (${effective ? '+5%' : '-10%'})`)

    // Check if pattern should be deprecated (low success rate after enough applications)
    if (timesApplied >= 10 && newSuccessRate < 0.4) {
      console.log(`[Learning Agent] Pattern ${patternId} has low success rate (${(newSuccessRate * 100).toFixed(1)}%) - marking as deprecated`)
      await supabase
        .from('learned_patterns')
        .update({ status: 'deprecated' })
        .eq('id', patternId)
    }
  } catch (e) {
    console.error('[Learning Agent] Error adjusting pattern confidence:', e)
  }
}
