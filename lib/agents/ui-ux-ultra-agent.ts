/**
 * UI/UX Ultra Agent - AI-Powered Design System
 *
 * Multi-stage AI pipeline for designing and redesigning UI components:
 * 1. ANALYZE: Actor-Critic dual-perspective analysis
 * 2. DESIGN: Generate component specifications
 * 3. PREVIEW: Chrome DevTools live preview (optional)
 * 4. ITERATE: Refine based on feedback
 *
 * CONSTRAINT HIERARCHY:
 * 1. MANDATORY: Brand colors, accessibility, design system rules
 * 2. HIGH PRIORITY: User style preferences (glassmorphism, shadows, animations)
 * 3. CREATIVE: AI suggestions for layout, composition, micro-interactions
 *
 * INTEGRATIONS:
 * - shadcn MCP: Component discovery and examples
 * - Chrome DevTools MCP: Live preview and testing
 * - Actor-Critic Thinking MCP: Dual-perspective analysis
 * - Context7 MCP: Library documentation lookup
 */

import Anthropic from '@anthropic-ai/sdk'
import type {
  AgentMode,
  AgentState,
  AgentStage,
  UIDesignConstraints,
  StylePreferences,
  ActorCriticAnalysis,
  ActorPerspective,
  CriticPerspective,
  AnalysisSynthesis,
  ComponentSpec,
  UIUXAgentRequest,
  UIUXAgentResponse,
  YiBrandColors,
  GlassmorphismLevel,
  ShadowLevel,
} from '@/types/ui-ux-agent.types'
import {
  YI_BRAND_COLORS,
  DEFAULT_STYLE_PREFERENCES,
  DEFAULT_ACCESSIBILITY,
  GLASSMORPHISM_CLASSES,
  SHADOW_CLASSES,
  ANIMATION_UTILITIES,
  type AnimationKeyframes,
} from '@/types/ui-ux-agent.types'
import { safeJsonParse } from '@/lib/utils/json-repair'


// ============================================================
// CONSTANTS
// ============================================================

/** Default model for agent operations */
const DEFAULT_MODEL = 'claude-haiku-4-5'

/** Model for quick analysis */
const ANALYSIS_MODEL = 'claude-haiku-4-5'

// ============================================================
// AGENT CLASS
// ============================================================

export class UIUXUltraAgent {
  private client: Anthropic
  private state: AgentState
  private modelName: string

  constructor(model: string = DEFAULT_MODEL) {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY is not configured')
    }
    this.client = new Anthropic({ apiKey })
    this.modelName = model
    this.state = this.createInitialState()
  }

  /**
   * Create initial agent state
   */
  private createInitialState(): AgentState {
    return {
      stage: 'idle',
      mode: 'design',
      input: { description: '' },
      constraints: this.getDefaultConstraints(),
      components: [],
      iterations: [],
      usage: { totalTokens: 0, totalDurationMs: 0, apiCalls: 0 },
    }
  }

  /**
   * Get default constraints with Yi brand colors
   */
  private getDefaultConstraints(): UIDesignConstraints {
    return {
      brandColors: YI_BRAND_COLORS,
      accessibility: DEFAULT_ACCESSIBILITY,
      stylePreferences: DEFAULT_STYLE_PREFERENCES,
      targetViewport: 'all',
    }
  }

  /**
   * Main entry point - process a UI/UX request
   */
  async process(request: UIUXAgentRequest): Promise<UIUXAgentResponse> {
    const startTime = Date.now()

    try {
      // Initialize state from request
      this.state = {
        ...this.createInitialState(),
        mode: request.mode,
        input: {
          description: request.description,
          existingComponent: request.existingComponent,
          targetElement: request.targetElement,
        },
        constraints: {
          ...this.getDefaultConstraints(),
          stylePreferences: {
            ...DEFAULT_STYLE_PREFERENCES,
            ...request.stylePreferences,
          },
          targetViewport: request.targetViewport || 'all',
        },
      }

      console.log('[UI/UX Agent] === STARTING WORKFLOW ===')
      console.log('[UI/UX Agent] Mode:', request.mode)
      console.log('[UI/UX Agent] Description:', request.description.substring(0, 100) + '...')

      // Stage 1: Actor-Critic Analysis
      this.state.stage = 'analyzing'
      console.log('[UI/UX Agent] Stage 1: Actor-Critic Analysis')
      const analysis = await this.performActorCriticAnalysis()
      this.state.analysis = analysis

      // Stage 2: Generate Components
      this.state.stage = 'designing'
      console.log('[UI/UX Agent] Stage 2: Component Generation')
      const components = await this.generateComponents(request.referenceComponents)
      this.state.components = components

      // Stage 3: Preview (if enabled) - handled by skill via MCP
      if (request.enablePreview && request.previewUrl) {
        this.state.stage = 'previewing'
        console.log('[UI/UX Agent] Stage 3: Preview enabled for', request.previewUrl)
        // Preview is handled by the skill using chrome-devtools MCP
        // Agent just sets the stage and returns preview instructions
      }

      this.state.stage = 'complete'
      console.log('[UI/UX Agent] === WORKFLOW COMPLETE ===')
      console.log('[UI/UX Agent] Components generated:', components.length)
      console.log('[UI/UX Agent] Total duration:', Date.now() - startTime, 'ms')

      return {
        success: true,
        state: this.state,
        components: this.state.components,
        analysisSummary: this.generateAnalysisSummary(),
        suggestedActions: this.generateSuggestedActions(request),
        usage: {
          inputTokens: this.state.usage.totalTokens,
          outputTokens: 0,
          model: this.modelName,
          durationMs: Date.now() - startTime,
        },
      }
    } catch (error) {
      this.state.stage = 'error'
      this.state.error = error instanceof Error ? error.message : 'Unknown error'

      console.error('[UI/UX Agent] Error:', this.state.error)

      return {
        success: false,
        state: this.state,
        components: [],
        suggestedActions: ['Review error and retry', 'Check API configuration'],
        usage: {
          inputTokens: 0,
          outputTokens: 0,
          model: this.modelName,
          durationMs: Date.now() - startTime,
        },
      }
    }
  }

  // ============================================================
  // STAGE 1: ACTOR-CRITIC ANALYSIS
  // ============================================================

  /**
   * Perform Actor-Critic dual-perspective analysis
   */
  private async performActorCriticAnalysis(): Promise<ActorCriticAnalysis> {
    const systemPrompt = this.buildAnalysisSystemPrompt()
    const userPrompt = this.buildAnalysisUserPrompt()

    const startTime = Date.now()

    const response = await this.client.messages.create({
      model: ANALYSIS_MODEL, // Use fast model for analysis
      max_tokens: 4096, // v3.8: Increased from 2048 to prevent truncation
      system: systemPrompt,
      messages: [
        { role: 'user', content: userPrompt },
        { role: 'assistant', content: '{' } // v3.8: Force JSON mode
      ],
    })

    const durationMs = Date.now() - startTime
    this.updateUsage(response.usage.input_tokens, response.usage.output_tokens, durationMs)

    const textBlock = response.content.find(b => b.type === 'text')
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('No text response from Claude')
    }

    // v3.8: Use safeJsonParse to handle potential truncation
    // Also handle the pre-fill brace if we use it (we should add it to messages below)
    return safeJsonParse<ActorCriticAnalysis>(textBlock.text)
  }

  /**
   * Build system prompt for Actor-Critic analysis
   */
  private buildAnalysisSystemPrompt(): string {
    const { stylePreferences, brandColors, accessibility } = this.state.constraints

    return `You are a dual-perspective UI/UX design analyst combining creative vision with technical rigor.

=== YOUR DUAL ROLE ===

ACTOR PERSPECTIVE (Creative Designer):
- Focus on user experience, emotional impact, visual delight
- Consider the user journey and micro-interactions
- Think about brand identity and visual storytelling
- Propose innovative design solutions
- Champion glassmorphism, shadows, and animations based on user preferences

CRITIC PERSPECTIVE (Technical Reviewer):
- Evaluate accessibility compliance (WCAG AA minimum, ${accessibility.minContrastRatio}:1 contrast)
- Assess performance implications (bundle size, render cost, animation smoothness)
- Review maintainability and code quality
- Identify potential issues and improvements
- Ensure responsive design works across viewports

=== MANDATORY CONSTRAINTS ===

Yi Brand Colors (MUST use these):
- Primary: ${brandColors.primary} (Yi Blue)
- Secondary: ${brandColors.secondary} (Yi Orange)
- Accent: ${brandColors.accent} (Yi Green)
- Teal: ${brandColors.teal} (Supporting)
- Gold: ${brandColors.gold} (Premium accents)

=== USER STYLE PREFERENCES ===

User has selected:
- Glassmorphism: ${stylePreferences.glassmorphism} -> use ${GLASSMORPHISM_CLASSES[stylePreferences.glassmorphism] || 'none'}
- Shadow Level: ${stylePreferences.shadowLevel} -> use ${SHADOW_CLASSES[stylePreferences.shadowLevel]}
- Animations: ${stylePreferences.animations}
- Border Style: ${stylePreferences.borderStyle}
- Color Scheme: ${stylePreferences.colorScheme}

=== DESIGN SYSTEM CLASSES (from globals.css) ===

Glassmorphism:
- glass-subtle: 50% white/80% dark, blur-12
- glass-medium: 70% white/85% dark, blur-16
- glass-strong: 80% white/88% dark, blur-20
- glass-premium: 85% white/90% dark, blur-20

Shadows:
- elevation-1 through elevation-5
- shadow-premium for glow effects

Animations:
- animate-float, animate-shimmer, animate-pulse-slow
- hover-lift, active-press
- transition-spring (cubic-bezier(0.34, 1.56, 0.64, 1))

=== OUTPUT FORMAT ===

Return ONLY valid JSON (no markdown code blocks):
{
  "actor": {
    "creativeVision": "Description of creative approach",
    "userExperience": "How users will interact and feel",
    "emotionalTone": "Emotional response evoked",
    "innovativeElements": ["element1", "element2", "element3"]
  },
  "critic": {
    "accessibilityScore": 85,
    "performanceImpact": "low|medium|high",
    "maintainability": "low|medium|high",
    "codeQuality": "Assessment of code approach",
    "improvements": ["improvement1", "improvement2"]
  },
  "synthesis": {
    "recommendation": "Balanced recommendation",
    "priority": "must-have|should-have|nice-to-have",
    "implementationComplexity": "simple|moderate|complex"
  }
}`
  }

  /**
   * Build user prompt for analysis
   */
  private buildAnalysisUserPrompt(): string {
    const { input, mode } = this.state

    let prompt = `Analyze this UI/UX ${mode} request:\n\n`
    prompt += `MODE: ${mode}\n`
    prompt += `DESCRIPTION: ${input.description}\n`

    if (input.existingComponent) {
      prompt += `\nEXISTING COMPONENT CODE:\n\`\`\`tsx\n${input.existingComponent}\n\`\`\`\n`
    }

    if (input.targetElement) {
      prompt += `\nTARGET ELEMENT: ${input.targetElement}\n`
    }

    prompt += `\nProvide dual-perspective analysis (Actor-Critic) for this request.
Think deeply about:
1. What visual experience should this create?
2. How can glassmorphism/shadows/animations enhance it?
3. What accessibility considerations are critical?
4. What's the simplest implementation that achieves the goal?`

    return prompt
  }

  /**
   * Parse Actor-Critic response
   */
  private parseActorCriticResponse(text: string, durationMs: number): ActorCriticAnalysis {
    const jsonStr = this.extractJson(text)
    const parsed = JSON.parse(jsonStr)

    // Validate and provide defaults
    const actor: ActorPerspective = {
      creativeVision: parsed.actor?.creativeVision || 'Modern, clean design approach',
      userExperience: parsed.actor?.userExperience || 'Intuitive and delightful interaction',
      emotionalTone: parsed.actor?.emotionalTone || 'Professional and approachable',
      innovativeElements: Array.isArray(parsed.actor?.innovativeElements)
        ? parsed.actor.innovativeElements
        : ['Glassmorphism effects', 'Smooth animations'],
    }

    const critic: CriticPerspective = {
      accessibilityScore: typeof parsed.critic?.accessibilityScore === 'number'
        ? parsed.critic.accessibilityScore
        : 80,
      performanceImpact: ['low', 'medium', 'high'].includes(parsed.critic?.performanceImpact)
        ? parsed.critic.performanceImpact
        : 'low',
      maintainability: ['low', 'medium', 'high'].includes(parsed.critic?.maintainability)
        ? parsed.critic.maintainability
        : 'high',
      codeQuality: parsed.critic?.codeQuality || 'Well-structured, type-safe implementation',
      improvements: Array.isArray(parsed.critic?.improvements)
        ? parsed.critic.improvements
        : [],
    }

    const synthesis: AnalysisSynthesis = {
      recommendation: parsed.synthesis?.recommendation || 'Proceed with implementation',
      priority: ['must-have', 'should-have', 'nice-to-have'].includes(parsed.synthesis?.priority)
        ? parsed.synthesis.priority
        : 'should-have',
      implementationComplexity: ['simple', 'moderate', 'complex'].includes(parsed.synthesis?.implementationComplexity)
        ? parsed.synthesis.implementationComplexity
        : 'moderate',
    }

    return {
      actor,
      critic,
      synthesis,
      meta: {
        rounds: 1,
        durationMs,
        model: ANALYSIS_MODEL,
      },
    }
  }

  // ============================================================
  // STAGE 2: COMPONENT GENERATION
  // ============================================================

  /**
   * Generate component specifications
   */
  private async generateComponents(referenceComponents?: string[]): Promise<ComponentSpec[]> {
    const systemPrompt = this.buildComponentSystemPrompt(referenceComponents)
    const userPrompt = this.buildComponentUserPrompt()

    const startTime = Date.now()

    const response = await this.client.messages.create({
      model: this.modelName, // Use main model for code generation
      max_tokens: 4096,
      system: systemPrompt,
      messages: [
        { role: 'user', content: userPrompt },
        { role: 'assistant', content: '[' } // v3.8: Force Array start
      ],
    })

    const durationMs = Date.now() - startTime
    this.updateUsage(response.usage.input_tokens, response.usage.output_tokens, durationMs)

    const textBlock = response.content.find(b => b.type === 'text')
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('No text response from Claude')
    }

    // v3.8: Use safeJsonParse to handle potential truncation
    // Note: Since we force start with '[', the response text will be the REST of the array.
    // safeJsonParse/cleanJSON handles this if we implement strict cleaning, or we prepend '[' if missing.
    // Claude usually appends to the pre-fill.
    const text = textBlock.text.trim().startsWith('[') ? textBlock.text : `[${textBlock.text}`

    return this.parseComponentResponse(text)
  }

  /**
   * Build system prompt for component generation
   */
  private buildComponentSystemPrompt(referenceComponents?: string[]): string {
    const { stylePreferences, brandColors, accessibility, targetViewport } = this.state.constraints

    const glassmorphismClass = GLASSMORPHISM_CLASSES[stylePreferences.glassmorphism] || ''
    const shadowClass = SHADOW_CLASSES[stylePreferences.shadowLevel]

    return `You are an expert React/TypeScript developer specializing in Next.js 16 and Tailwind CSS 4.
You create beautiful, accessible components with glassmorphism effects, premium shadows, and smooth animations.

=== TECH STACK ===
- Next.js 16 (App Router, React 19)
- TypeScript 5 (strict mode, no 'any' types)
- Tailwind CSS 4 with custom theme
- shadcn/ui (new-york style)
- class-variance-authority (CVA) for variants

=== YI BRAND COLORS ===
\`\`\`css
--color-yi-blue: ${brandColors.primary};     /* Primary */
--color-yi-orange: ${brandColors.secondary}; /* Secondary/CTA */
--color-yi-green: ${brandColors.accent};     /* Accent */
--color-yi-teal: ${brandColors.teal};        /* Supporting */
--color-yi-gold: ${brandColors.gold};        /* Premium */
\`\`\`

=== STYLE PREFERENCES ===
Apply these to all components:

1. GLASSMORPHISM: ${stylePreferences.glassmorphism}
   ${glassmorphismClass ? `Use class: "${glassmorphismClass}"` : 'No glassmorphism'}
   CSS: bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/30 dark:border-white/10

2. SHADOWS: ${stylePreferences.shadowLevel}
   Use class: "${shadowClass}"
   For hover: shadow-[var(--shadow-card-hover)] hover:-translate-y-0.5

3. ANIMATIONS: ${stylePreferences.animations}
${stylePreferences.animations === 'none' ? '   No animations' : `
   - hover-lift: transform hover:-translate-y-1
   - active-press: active:scale-[0.98]
   - transition: transition-all duration-200 ease-out
   - Spring easing: transition-[cubic-bezier(0.34,1.56,0.64,1)]`}

4. BORDERS: ${stylePreferences.borderStyle}
${stylePreferences.borderStyle === 'gradient' ? '   Use: bg-gradient-to-r from-yi-blue to-yi-teal p-[1px]' :
        stylePreferences.borderStyle === 'glow' ? '   Use: ring-2 ring-yi-blue/20 shadow-[0_0_15px_rgba(0,91,150,0.3)]' :
          stylePreferences.borderStyle === 'solid' ? '   Use: border border-border' : '   No border'}

=== ACCESSIBILITY REQUIREMENTS ===
- Minimum contrast: ${accessibility.minContrastRatio}:1 (WCAG AA)
- Focus indicators: ${accessibility.focusIndicators ? 'Required - use focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2' : 'Optional'}
- Keyboard nav: ${accessibility.keyboardNav ? 'Required - all interactive elements must be focusable' : 'Optional'}
- Screen reader: ${accessibility.screenReaderSupport ? 'Required - include aria-labels for icons and complex interactions' : 'Optional'}

=== TARGET VIEWPORT ===
${targetViewport === 'mobile' ? 'Design mobile-first (max-w-sm, touch targets 44px)' :
        targetViewport === 'tablet' ? 'Design for tablet (md: breakpoint, 768px)' :
          targetViewport === 'desktop' ? 'Design for desktop (lg: breakpoint, 1024px+)' :
            'Design responsive for all viewports (mobile-first with sm:, md:, lg: variants)'}

${referenceComponents?.length ? `
=== REFERENCE COMPONENTS ===
Use these shadcn/ui components as base: ${referenceComponents.join(', ')}
Import from @/components/ui/
` : ''}

=== OUTPUT FORMAT ===

Return a JSON array of component specifications:
[
  {
    "name": "ComponentName",
    "description": "What this component does",
    "filePath": "components/ui/component-name.tsx",
    "propsInterface": "interface ComponentNameProps {\\n  variant?: 'default' | 'glass';\\n  size?: 'sm' | 'md' | 'lg';\\n  children: React.ReactNode;\\n}",
    "code": "// Complete TypeScript/React code here",
    "tailwindClasses": ["bg-white/70", "backdrop-blur-xl", "rounded-xl"],
    "cssVariables": ["--shadow-card", "--ease-spring"],
    "dependencies": [],
    "shadcnComponents": ["@shadcn/button"],
    "animations": [
      {
        "name": "glass-shine",
        "keyframes": "@keyframes glass-shine { ... }"
      }
    ],
    "a11y": {
      "ariaLabels": ["aria-label on close button"],
      "keyboardShortcuts": ["Escape to close"],
      "focusManagement": "Focus trapped in dialog, returns on close"
    }
  }
]

IMPORTANT:
- Generate production-ready code
- Include all TypeScript types
- Use CVA for variants when appropriate
- Add proper JSDoc comments
- Include dark mode support
- Make all interactive elements keyboard accessible`
  }

  /**
   * Build user prompt for component generation
   */
  private buildComponentUserPrompt(): string {
    const { input, analysis, mode } = this.state

    let prompt = `Generate React component(s) for:\n\n`
    prompt += `MODE: ${mode}\n`
    prompt += `DESCRIPTION: ${input.description}\n`

    if (analysis) {
      prompt += `\n=== ANALYSIS SYNTHESIS ===\n`
      prompt += `Recommendation: ${analysis.synthesis.recommendation}\n`
      prompt += `Complexity: ${analysis.synthesis.implementationComplexity}\n`
      prompt += `Creative Vision: ${analysis.actor.creativeVision}\n`
      prompt += `Innovative Elements: ${analysis.actor.innovativeElements.join(', ')}\n`
      prompt += `Improvements to Address: ${analysis.critic.improvements.join(', ')}\n`
    }

    if (input.existingComponent) {
      prompt += `\n=== EXISTING COMPONENT TO REDESIGN ===\n`
      prompt += `\`\`\`tsx\n${input.existingComponent}\n\`\`\`\n`
    }

    prompt += `\nGenerate production-ready component(s) following the style preferences and design system.`

    return prompt
  }

  /**
   * Parse component response
   */
  private parseComponentResponse(text: string): ComponentSpec[] {
    const parsed = safeJsonParse<ComponentSpec[]>(text)

    if (!Array.isArray(parsed)) {
      throw new Error('Expected array of component specifications')
    }

    return parsed.map((comp: any) => ({
      name: String(comp.name || 'Component'),
      description: String(comp.description || ''),
      filePath: String(comp.filePath || 'components/ui/component.tsx'),
      propsInterface: String(comp.propsInterface || 'interface Props {}'),
      code: String(comp.code || ''),
      tailwindClasses: Array.isArray(comp.tailwindClasses) ? comp.tailwindClasses.map(String) : [],
      cssVariables: Array.isArray(comp.cssVariables) ? comp.cssVariables.map(String) : [],
      dependencies: Array.isArray(comp.dependencies) ? comp.dependencies.map(String) : [],
      shadcnComponents: Array.isArray(comp.shadcnComponents) ? comp.shadcnComponents.map(String) : [],
      animations: Array.isArray(comp.animations) ? (comp.animations as unknown as AnimationKeyframes[]) : undefined,
      a11y: {
        ariaLabels: Array.isArray((comp.a11y as any)?.ariaLabels)
          ? ((comp.a11y as any).ariaLabels as string[])
          : [],
        keyboardShortcuts: Array.isArray((comp.a11y as any)?.keyboardShortcuts)
          ? ((comp.a11y as any).keyboardShortcuts as string[])
          : undefined,
        focusManagement: String((comp.a11y as any)?.focusManagement || 'Standard focus handling'),
      },
    }))
  }

  // ============================================================
  // UTILITY METHODS
  // ============================================================

  /**
   * Extract JSON from response text
   */
  private extractJson(text: string, type: 'object' | 'array' = 'object'): string {
    let jsonStr = text.trim()

    // Remove markdown code blocks
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.slice(7)
    } else if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.slice(3)
    }
    if (jsonStr.endsWith('```')) {
      jsonStr = jsonStr.slice(0, -3)
    }
    jsonStr = jsonStr.trim()

    // Extract JSON
    const pattern = type === 'array' ? /\[[\s\S]*\]/ : /\{[\s\S]*\}/
    const match = jsonStr.match(pattern)
    if (!match) {
      throw new Error(`Failed to extract JSON ${type} from response`)
    }

    return match[0]
  }

  /**
   * Update usage statistics
   */
  private updateUsage(inputTokens: number, outputTokens: number, durationMs: number): void {
    this.state.usage.totalTokens += inputTokens + outputTokens
    this.state.usage.totalDurationMs += durationMs
    this.state.usage.apiCalls++
  }

  /**
   * Generate human-readable analysis summary
   */
  private generateAnalysisSummary(): string {
    if (!this.state.analysis) return ''

    const { actor, critic, synthesis } = this.state.analysis

    return `## Analysis Summary

**Creative Vision**: ${actor.creativeVision}

**User Experience**: ${actor.userExperience}

**Emotional Tone**: ${actor.emotionalTone}

**Innovative Elements**: ${actor.innovativeElements.join(', ')}

---

**Accessibility Score**: ${critic.accessibilityScore}/100

**Performance Impact**: ${critic.performanceImpact}

**Maintainability**: ${critic.maintainability}

**Suggested Improvements**: ${critic.improvements.length > 0 ? critic.improvements.join(', ') : 'None'}

---

**Recommendation**: ${synthesis.recommendation}

**Priority**: ${synthesis.priority}

**Complexity**: ${synthesis.implementationComplexity}`
  }

  /**
   * Generate suggested next actions
   */
  private generateSuggestedActions(request: UIUXAgentRequest): string[] {
    const actions: string[] = []

    if (this.state.components.length > 0) {
      actions.push('Review generated component code')
      actions.push('Copy code to your project files')

      if (this.state.components.some(c => c.shadcnComponents.length > 0)) {
        const shadcnDeps = [...new Set(this.state.components.flatMap(c => c.shadcnComponents))]
        actions.push(`Install shadcn dependencies: ${shadcnDeps.join(', ')}`)
      }
    }

    if (request.enablePreview && request.previewUrl) {
      actions.push('Use Chrome DevTools MCP to preview the component')
      actions.push('Test responsive layouts with resize_page')
    }

    if (this.state.analysis?.critic.improvements.length) {
      actions.push('Address suggested improvements from analysis')
    }

    actions.push('Request refinements if needed')

    return actions
  }
}

// ============================================================
// SAFE WRAPPER WITH FALLBACK
// ============================================================

/**
 * Generate fallback component when agent fails
 */
function generateFallbackComponent(request: UIUXAgentRequest): ComponentSpec {
  const name = 'GlassCard'
  const glassmorphism = request.stylePreferences?.glassmorphism || 'medium'
  const glassClass = GLASSMORPHISM_CLASSES[glassmorphism as GlassmorphismLevel] || 'glass-medium'

  return {
    name,
    description: 'Fallback glass card component',
    filePath: 'components/ui/glass-card.tsx',
    propsInterface: `interface ${name}Props {
  children: React.ReactNode;
  className?: string;
}`,
    code: `import * as React from 'react';
import { cn } from '@/lib/utils';

interface ${name}Props {
  children: React.ReactNode;
  className?: string;
}

export function ${name}({ children, className }: ${name}Props) {
  return (
    <div
      className={cn(
        '${glassClass}',
        'rounded-xl p-6',
        'transition-all duration-200',
        'hover:shadow-lg hover:-translate-y-0.5',
        className
      )}
    >
      {children}
    </div>
  );
}`,
    tailwindClasses: [glassClass, 'rounded-xl', 'p-6', 'transition-all'],
    cssVariables: [],
    dependencies: [],
    shadcnComponents: [],
    a11y: {
      ariaLabels: [],
      focusManagement: 'Standard focus handling',
    },
  }
}

/**
 * Safe wrapper that returns fallback on error
 */
export async function processUIUXRequestSafe(
  request: UIUXAgentRequest
): Promise<UIUXAgentResponse> {
  try {
    const agent = new UIUXUltraAgent()
    return await agent.process(request)
  } catch (error) {
    console.error('[UI/UX Agent] Error:', error instanceof Error ? error.message : error)
    console.warn('[UI/UX Agent] Using fallback component')

    const fallbackComponent = generateFallbackComponent(request)

    return {
      success: false,
      state: {
        stage: 'error',
        mode: request.mode,
        input: { description: request.description },
        constraints: {
          brandColors: YI_BRAND_COLORS,
          accessibility: DEFAULT_ACCESSIBILITY,
          stylePreferences: { ...DEFAULT_STYLE_PREFERENCES, ...request.stylePreferences },
          targetViewport: request.targetViewport || 'all',
        },
        components: [fallbackComponent],
        iterations: [],
        error: error instanceof Error ? error.message : 'Unknown error',
        usage: { totalTokens: 0, totalDurationMs: 0, apiCalls: 0 },
      },
      components: [fallbackComponent],
      suggestedActions: [
        'Check ANTHROPIC_API_KEY configuration',
        'Retry the request',
        'Use fallback component as starting point',
      ],
      usage: {
        inputTokens: 0,
        outputTokens: 0,
        model: 'fallback',
        durationMs: 0,
      },
    }
  }
}

// ============================================================
// EXPORTS
// ============================================================

export {
  YI_BRAND_COLORS,
  DEFAULT_STYLE_PREFERENCES,
  DEFAULT_ACCESSIBILITY,
  GLASSMORPHISM_CLASSES,
  SHADOW_CLASSES,
  ANIMATION_UTILITIES,
}

export type {
  AgentMode,
  AgentState,
  AgentStage,
  UIDesignConstraints,
  StylePreferences,
  ActorCriticAnalysis,
  ComponentSpec,
  UIUXAgentRequest,
  UIUXAgentResponse,
}
