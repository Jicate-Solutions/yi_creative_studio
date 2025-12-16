/**
 * Vision Image Analyzer
 *
 * Uses Gemini Vision to proactively detect issues in generated creatives.
 * Analyzes:
 * - Text readability
 * - Logo placement
 * - Composition balance
 * - Color harmony
 * - Brand consistency
 */

import type {
  VisionAnalysis,
  VisionAnalysisRequest,
  DetectedIssue,
  CategoryScores,
  PatternCategory,
  IssueLocation,
} from '@/types/learning.types'

// Vision analysis prompt template
const ANALYSIS_PROMPT = `You are an expert creative designer reviewing a generated marketing visual.
Analyze this image for quality issues and score each category from 0-100.

FORMAT CONTEXT: {formatId}
EXPECTED ELEMENTS: {expectedElements}

Analyze and respond in this exact JSON format:
{
  "overallScore": <0-100>,
  "categoryScores": {
    "textReadability": <0-100>,
    "logoPlacement": <0-100>,
    "composition": <0-100>,
    "colorHarmony": <0-100>,
    "brandConsistency": <0-100>,
    "overallQuality": <0-100>
  },
  "detectedIssues": [
    {
      "category": "<text_rendering|layout|colors|logo|style|composition>",
      "severity": "<low|medium|high|critical>",
      "description": "<specific description of the issue>",
      "location": {
        "region": "<top-left|top-center|top-right|middle-left|middle-center|middle-right|bottom-left|bottom-center|bottom-right>"
      },
      "suggestedFix": "<actionable suggestion to fix>",
      "confidence": <0.0-1.0>
    }
  ],
  "flagForReview": <true if any critical issues>,
  "reviewReasons": ["<reason for flagging>"]
}

Be critical but constructive. Focus on issues that would impact the effectiveness of the creative.`

/**
 * Analyze an image for quality issues
 */
export async function analyzeImage(
  request: VisionAnalysisRequest
): Promise<VisionAnalysis | null> {
  const startTime = Date.now()

  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai')
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })

    // Build the prompt
    const expectedElementsText = request.expectedElements
      ?.map(e => `- ${e.type}: ${e.description}${e.required ? ' (required)' : ''}`)
      .join('\n') || 'None specified'

    const prompt = ANALYSIS_PROMPT
      .replace('{formatId}', request.formatId)
      .replace('{expectedElements}', expectedElementsText)

    // Fetch the image and convert to base64
    const imageResponse = await fetch(request.imageUrl)
    const imageBuffer = await imageResponse.arrayBuffer()
    const base64Image = Buffer.from(imageBuffer).toString('base64')
    const mimeType = imageResponse.headers.get('content-type') || 'image/png'

    // Call Gemini Vision
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType,
          data: base64Image,
        },
      },
    ])

    const response = result.response.text()

    // Parse the JSON response
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error('[VisionAnalyzer] Failed to extract JSON from response')
      return null
    }

    const analysisResult = JSON.parse(jsonMatch[0]) as {
      overallScore: number
      categoryScores: CategoryScores
      detectedIssues: Array<{
        category: string
        severity: string
        description: string
        location?: { region: string }
        suggestedFix?: string
        confidence: number
      }>
      flagForReview: boolean
      reviewReasons: string[]
    }

    const processingTimeMs = Date.now() - startTime

    // Map to VisionAnalysis type
    const analysis: VisionAnalysis = {
      id: crypto.randomUUID(),
      creativeId: request.creativeId || '',
      organizationId: request.organizationId,
      imageUrl: request.imageUrl,
      formatId: request.formatId,
      detectedIssues: analysisResult.detectedIssues.map(issue => ({
        category: issue.category as PatternCategory,
        severity: issue.severity as 'low' | 'medium' | 'high' | 'critical',
        description: issue.description,
        location: issue.location ? {
          x: 0,
          y: 0,
          width: 0,
          height: 0,
          region: (issue.location as { region?: string })?.region as IssueLocation['region'],
        } : undefined,
        suggestedFix: issue.suggestedFix,
        confidence: issue.confidence,
      })),
      overallScore: analysisResult.overallScore,
      categoryScores: analysisResult.categoryScores,
      textReadabilityScore: analysisResult.categoryScores.textReadability,
      logoPlacementScore: analysisResult.categoryScores.logoPlacement,
      compositionScore: analysisResult.categoryScores.composition,
      colorHarmonyScore: analysisResult.categoryScores.colorHarmony,
      brandConsistencyScore: analysisResult.categoryScores.brandConsistency,
      flagForReview: analysisResult.flagForReview,
      reviewReasons: analysisResult.reviewReasons,
      reviewCompleted: false,
      modelUsed: 'gemini-2.0-flash-exp',
      processingTimeMs,
      rawResponse: analysisResult,
      createdAt: new Date().toISOString(),
    }

    console.log(`[VisionAnalyzer] Analyzed image in ${processingTimeMs}ms, score: ${analysis.overallScore}`)

    return analysis
  } catch (error) {
    console.error('[VisionAnalyzer] Error analyzing image:', error)
    return null
  }
}

/**
 * Save vision analysis to database
 */
export async function saveVisionAnalysis(analysis: VisionAnalysis): Promise<string | null> {
  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    const { data, error } = await (supabase.from as Function)('vision_analysis')
      .insert({
        creative_id: analysis.creativeId,
        organization_id: analysis.organizationId,
        image_url: analysis.imageUrl,
        format_id: analysis.formatId,
        detected_issues: analysis.detectedIssues,
        overall_score: analysis.overallScore,
        category_scores: analysis.categoryScores,
        text_readability_score: analysis.textReadabilityScore,
        logo_placement_score: analysis.logoPlacementScore,
        composition_score: analysis.compositionScore,
        color_harmony_score: analysis.colorHarmonyScore,
        brand_consistency_score: analysis.brandConsistencyScore,
        flag_for_review: analysis.flagForReview,
        review_reasons: analysis.reviewReasons,
        model_used: analysis.modelUsed,
        processing_time_ms: analysis.processingTimeMs,
        raw_response: analysis.rawResponse,
      })
      .select('id')
      .single()

    if (error) {
      console.error('[VisionAnalyzer] Error saving analysis:', error)
      return null
    }

    return data.id
  } catch (error) {
    console.error('[VisionAnalyzer] Error:', error)
    return null
  }
}

/**
 * Analyze and save in one operation
 */
export async function analyzeAndSave(
  request: VisionAnalysisRequest
): Promise<VisionAnalysis | null> {
  const analysis = await analyzeImage(request)

  if (!analysis) return null

  const savedId = await saveVisionAnalysis(analysis)

  if (savedId) {
    analysis.id = savedId
  }

  return analysis
}

/**
 * Quick check if image needs detailed analysis
 */
export async function quickQualityCheck(imageUrl: string): Promise<{
  needsDetailedAnalysis: boolean
  quickScore: number
  majorIssues: string[]
}> {
  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai')
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })

    const quickPrompt = `Quick quality check. Rate 0-100 and list any MAJOR issues only.
Response format: {"score": <0-100>, "majorIssues": ["issue1", "issue2"]}`

    const imageResponse = await fetch(imageUrl)
    const imageBuffer = await imageResponse.arrayBuffer()
    const base64Image = Buffer.from(imageBuffer).toString('base64')
    const mimeType = imageResponse.headers.get('content-type') || 'image/png'

    const result = await model.generateContent([
      quickPrompt,
      {
        inlineData: {
          mimeType,
          data: base64Image,
        },
      },
    ])

    const response = result.response.text()
    const jsonMatch = response.match(/\{[\s\S]*\}/)

    if (!jsonMatch) {
      return { needsDetailedAnalysis: true, quickScore: 50, majorIssues: [] }
    }

    const parsed = JSON.parse(jsonMatch[0]) as {
      score: number
      majorIssues: string[]
    }

    return {
      needsDetailedAnalysis: parsed.score < 70 || parsed.majorIssues.length > 0,
      quickScore: parsed.score,
      majorIssues: parsed.majorIssues,
    }
  } catch (error) {
    console.error('[VisionAnalyzer] Quick check failed:', error)
    return { needsDetailedAnalysis: true, quickScore: 50, majorIssues: [] }
  }
}
