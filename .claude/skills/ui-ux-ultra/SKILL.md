---
name: ui-ux-ultra
description: Advanced AI-powered UI/UX design agent that analyzes, designs, and previews components with Actor-Critic thinking, glassmorphism styling, and Chrome DevTools live preview. This skill should be used when creating new components, redesigning existing UI, building component libraries, or when user mentions 'UI design', 'component design', 'glassmorphism', 'redesign', 'UI agent', 'design from scratch', 'live preview', 'glass card', 'premium button', or requests components with shadows and animations.
---

# UI/UX Ultra Agent Skill

## Purpose

This skill provides an AI-powered design workflow for creating and redesigning UI components in Yi CreativeStudio. It combines Actor-Critic analysis for balanced design decisions with live Chrome DevTools preview for real-time iteration.

## When to Use This Skill

Use this skill when:

- **Designing New Components** - Create components from scratch with AI guidance
- **Redesigning Existing UI** - Improve existing components with style updates
- **Building Component Libraries** - Generate multiple related components
- **Style Exploration** - Experiment with glassmorphism, animations, shadows
- **Live Preview** - Test component appearance in real browser
- **Accessibility Audit** - Verify WCAG compliance of designs

## Capabilities

### 1. Design Modes

| Mode | Description | Use Case |
|------|-------------|----------|
| `design` | Create new components from scratch | "Create a pricing card" |
| `redesign` | Improve existing components | "Redesign this button with glassmorphism" |
| `analyze` | Analyze without generating code | "What improvements can we make to this form?" |
| `component-library` | Generate related components | "Create a set of glass-styled form inputs" |

### 2. Style Preferences

| Preference | Options | Default | Description |
|------------|---------|---------|-------------|
| Glassmorphism | none, subtle, medium, strong, premium | medium | Glass blur intensity |
| Shadow Level | xs, sm, md, lg, xl, premium | md | Shadow elevation |
| Animations | none, minimal, standard, enhanced, premium | standard | Animation complexity |
| Border Style | solid, none, gradient, glow | none | Border treatment |
| Color Scheme | brand, neutral, vibrant, custom | brand | Color palette |

### 3. MCP Server Integration

#### shadcn MCP - Component Discovery

```typescript
// Search for components
await mcp__shadcn__search_items_in_registries({
  registries: ['@shadcn'],
  query: 'card button dialog',
  limit: 10,
});

// Get component examples
await mcp__shadcn__get_item_examples_from_registries({
  registries: ['@shadcn'],
  query: 'card-demo',
});

// View full component code
await mcp__shadcn__view_items_in_registries({
  items: ['@shadcn/card', '@shadcn/button'],
});

// Get install command
await mcp__shadcn__get_add_command_for_items({
  items: ['@shadcn/card', '@shadcn/badge'],
});
```

#### Chrome DevTools MCP - Live Preview

```typescript
// Navigate to preview URL
await mcp__chrome_devtools__navigate_page({
  url: 'http://localhost:3000/preview',
  type: 'url',
});

// Take DOM snapshot for analysis
await mcp__chrome_devtools__take_snapshot({
  verbose: true,
});

// Take screenshot
await mcp__chrome_devtools__take_screenshot({
  format: 'png',
  fullPage: false,
});

// Test responsive layouts
await mcp__chrome_devtools__resize_page({
  width: 375,
  height: 812, // iPhone dimensions
});

// Interact with elements
await mcp__chrome_devtools__click({
  uid: 'element-uid-from-snapshot',
});
```

#### Actor-Critic Thinking MCP - Dual Analysis

```typescript
// Actor perspective (Creative)
await mcp__actor_critic_thinking__actor_critic_thinking({
  content: "Creative vision: Premium glassmorphism card with floating effect...",
  role: "actor",
  thoughtNumber: 1,
  totalThoughts: 5,
  nextRoundNeeded: true,
});

// Critic perspective (Technical)
await mcp__actor_critic_thinking__actor_critic_thinking({
  content: "Technical evaluation: Contrast ratio 7.2:1 exceeds WCAG AA...",
  role: "critic",
  thoughtNumber: 2,
  totalThoughts: 5,
  nextRoundNeeded: true,
});
```

#### Context7 MCP - Documentation Lookup

```typescript
// Get Tailwind CSS docs
await mcp__context7__resolve_library_id({
  libraryName: 'tailwindcss',
});

await mcp__context7__get_library_docs({
  context7CompatibleLibraryID: '/tailwindlabs/tailwindcss',
  topic: 'backdrop-filter glassmorphism',
  mode: 'code',
});
```

## Workflow

### Step 1: Gather Requirements

Before starting, gather:
1. Design request type (new vs redesign)
2. Style preferences from user
3. Reference components or images
4. Target viewport (mobile, tablet, desktop)

Example questions:
- "What glassmorphism intensity do you prefer? (subtle, medium, strong, premium)"
- "Should I include hover animations?"
- "What viewport should I prioritize?"

### Step 2: Actor-Critic Analysis

Perform dual-perspective analysis:

**Actor (Creative Designer)**
- What's the creative vision?
- How will users interact?
- What emotional response should it evoke?
- What innovative elements can we add?

**Critic (Technical Reviewer)**
- Does it meet accessibility standards?
- What's the performance impact?
- Is it maintainable?
- What improvements are needed?

### Step 3: Component Generation

Generate components using the API:

```typescript
const response = await fetch('/api/agents/ui-ux-ultra', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    mode: 'design',
    description: 'Premium pricing card with glassmorphism',
    stylePreferences: {
      glassmorphism: 'premium',
      shadowLevel: 'lg',
      animations: 'enhanced',
    },
    referenceComponents: ['card', 'badge'],
    targetViewport: 'all',
  }),
});
```

### Step 4: Live Preview (Optional)

If preview is enabled:
1. Navigate to preview URL
2. Take DOM snapshot
3. Take screenshots
4. Test responsive layouts
5. Capture user interactions

### Step 5: Iteration

Based on feedback:
1. Refine component code
2. Adjust styling preferences
3. Re-preview if needed
4. Document changes

## Design System Reference

### Yi Brand Colors

```css
--color-yi-blue: #005B96;     /* Primary */
--color-yi-orange: #FF6B35;   /* Secondary/CTA */
--color-yi-green: #00A86B;    /* Accent */
--color-yi-teal: #1B998B;     /* Supporting */
--color-yi-gold: #D4AF37;     /* Premium */
--color-yi-navy: #1a2332;     /* Dark */
```

### Glassmorphism Classes

| Class | Background | Blur | Use Case |
|-------|------------|------|----------|
| `glass-subtle` | 50% white | 12px | Subtle overlay |
| `glass-medium` | 70% white | 16px | Standard cards |
| `glass-strong` | 80% white | 20px | Prominent elements |
| `glass-premium` | 85% white | 20px | Premium features |
| `glass-card` | Full card | 20px | Card with hover |

### Shadow System

| Class | Effect | Use Case |
|-------|--------|----------|
| `elevation-1` | shadow-xs | Subtle depth |
| `elevation-2` | shadow-sm | Light elevation |
| `elevation-3` | shadow-md | Standard cards |
| `elevation-4` | shadow-lg | Raised elements |
| `elevation-5` | shadow-xl | Floating items |
| `shadow-premium` | Glow effect | Premium features |

### Animation Utilities

| Class | Effect | Duration |
|-------|--------|----------|
| `animate-float` | Floating motion | 6s |
| `animate-shimmer` | Shimmer effect | 1.5s |
| `animate-pulse-slow` | Slow pulse | 4s |
| `hover-lift` | Lift on hover | 200ms |
| `active-press` | Press effect | 150ms |
| `transition-spring` | Spring easing | var |

### Transition Timing

```css
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
--ease-out-expo: cubic-bezier(0.19, 1, 0.22, 1);
--ease-in-out-soft: cubic-bezier(0.4, 0, 0.2, 1);
```

## API Usage

### Endpoint

```
POST /api/agents/ui-ux-ultra
GET /api/agents/ui-ux-ultra (capabilities)
```

### Request Body

```typescript
interface UIUXAgentRequest {
  mode: 'design' | 'redesign' | 'analyze' | 'component-library';
  description: string;
  stylePreferences?: {
    glassmorphism?: 'none' | 'subtle' | 'medium' | 'strong' | 'premium';
    shadowLevel?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'premium';
    animations?: 'none' | 'minimal' | 'standard' | 'enhanced' | 'premium';
    borderStyle?: 'solid' | 'none' | 'gradient' | 'glow';
    colorScheme?: 'brand' | 'neutral' | 'vibrant' | 'custom';
  };
  existingComponent?: string;
  referenceComponents?: string[];
  targetViewport?: 'mobile' | 'tablet' | 'desktop' | 'all';
  enablePreview?: boolean;
  previewUrl?: string;
}
```

### Response

```typescript
interface UIUXAgentResponse {
  success: boolean;
  state: AgentState;
  components: ComponentSpec[];
  analysisSummary?: string;
  previewScreenshots?: string[];
  suggestedActions: string[];
  usage: {
    inputTokens: number;
    outputTokens: number;
    model: string;
    durationMs: number;
  };
}
```

## Best Practices

### 1. Provide Clear Descriptions

Be specific about what you want:
- Bad: "Make a card"
- Good: "Create a pricing card with premium glassmorphism, gold accent for featured tier, hover lift animation, and responsive layout for mobile and desktop"

### 2. Specify Style Preferences

Always indicate preferences when they matter:
```
"Use strong glassmorphism with xl shadows and premium animations"
```

### 3. Reference Existing Components

Point to similar components for consistency:
```
"Match the style of the glass-card in the dashboard"
```

### 4. Test Responsively

Always request preview at multiple viewports:
```
"Preview on mobile (375px), tablet (768px), and desktop (1280px)"
```

### 5. Verify Accessibility

Ask for accessibility audit:
```
"Ensure WCAG AA compliance and keyboard navigation"
```

## Example Workflows

### Create a Glass Card

```
User: Create a premium pricing card with glassmorphism

Agent:
1. Gather preferences: glassmorphism level, animations, shadow
2. Analyze with Actor-Critic thinking
3. Search shadcn for card examples
4. Generate component with:
   - glass-premium class
   - elevation-4 shadow
   - hover-lift animation
   - Responsive layout
5. Provide install commands for dependencies
```

### Redesign Existing Component

```
User: Redesign this button with stronger glassmorphism and glow border

Agent:
1. Analyze existing component
2. Identify improvements (Actor-Critic)
3. Apply style preferences:
   - glassmorphism: strong
   - borderStyle: glow
   - animations: enhanced
4. Generate improved component
5. Preview in browser if enabled
```

### Component Library

```
User: Create a set of form components with glass styling

Agent:
1. Plan component set: input, select, checkbox, radio, switch
2. Define consistent style: glass-medium, elevation-2
3. Generate each component
4. Ensure consistent styling across set
5. Provide usage examples
```

## References

- **Design Patterns**: `references/design-patterns.md`
- **Glassmorphism Guide**: `references/glassmorphism-guide.md`
- **Animation Library**: `references/animation-library.md`
- **MCP Integration**: `references/mcp-integration.md`

## Assets

- **Component Templates**: `assets/component-templates/`
  - `glass-card.tsx`
  - `premium-button.tsx`
  - `glass-dialog.tsx`
