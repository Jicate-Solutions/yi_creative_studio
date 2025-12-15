# MCP Integration Guide

## Overview

This document provides comprehensive guidance on using MCP (Model Context Protocol) servers with the UI/UX Ultra Agent for component discovery, live preview, and documentation lookup.

## Available MCP Servers

| Server | Purpose | Key Functions |
|--------|---------|---------------|
| shadcn | Component discovery | search, view, examples, install |
| chrome-devtools | Live preview | navigate, snapshot, screenshot, resize |
| actor-critic-thinking | Design analysis | dual-perspective evaluation |
| context7 | Documentation | library lookup, code examples |

## shadcn MCP

### Search Components

Find components by name or description.

```typescript
const results = await mcp__shadcn__search_items_in_registries({
  registries: ['@shadcn'],
  query: 'card button dialog',
  limit: 10,
});

// Results include:
// - name: Component name
// - description: What it does
// - type: 'component' | 'hook' | 'utility'
```

### List All Components

Browse available components.

```typescript
const components = await mcp__shadcn__list_items_in_registries({
  registries: ['@shadcn'],
  limit: 50,
  offset: 0,
});
```

### Get Component Examples

Fetch usage examples with code.

```typescript
const examples = await mcp__shadcn__get_item_examples_from_registries({
  registries: ['@shadcn'],
  query: 'card-demo',  // or 'button example', 'dialog-demo'
});

// Returns complete implementation code with dependencies
```

### View Component Details

Get full component source code.

```typescript
const details = await mcp__shadcn__view_items_in_registries({
  items: ['@shadcn/card', '@shadcn/button', '@shadcn/badge'],
});

// Returns:
// - name, description, type
// - files content (full source code)
// - dependencies
```

### Get Install Command

Generate CLI command to add components.

```typescript
const command = await mcp__shadcn__get_add_command_for_items({
  items: ['@shadcn/card', '@shadcn/badge', '@shadcn/button'],
});

// Returns: npx shadcn@latest add card badge button
```

### Workflow Example

Complete component discovery workflow:

```typescript
// 1. Search for relevant components
const search = await mcp__shadcn__search_items_in_registries({
  registries: ['@shadcn'],
  query: 'pricing card',
});

// 2. Get examples for inspiration
const examples = await mcp__shadcn__get_item_examples_from_registries({
  registries: ['@shadcn'],
  query: 'card-demo',
});

// 3. View full implementation
const details = await mcp__shadcn__view_items_in_registries({
  items: ['@shadcn/card'],
});

// 4. Get install command
const install = await mcp__shadcn__get_add_command_for_items({
  items: ['@shadcn/card', '@shadcn/badge'],
});
```

## Chrome DevTools MCP

### Navigate to Page

Open a URL in the browser.

```typescript
await mcp__chrome_devtools__navigate_page({
  url: 'http://localhost:3000/preview',
  type: 'url',
});

// Other navigation types:
// type: 'back' - Go back in history
// type: 'forward' - Go forward
// type: 'reload' - Refresh page
```

### Take DOM Snapshot

Capture accessibility tree for analysis.

```typescript
const snapshot = await mcp__chrome_devtools__take_snapshot({
  verbose: true,  // Include all a11y info
});

// Returns element tree with:
// - uid: Unique identifier for interaction
// - role: ARIA role
// - name: Accessible name
// - children: Nested elements
```

### Take Screenshot

Capture visual state.

```typescript
await mcp__chrome_devtools__take_screenshot({
  format: 'png',      // 'png' | 'jpeg' | 'webp'
  fullPage: false,    // Capture entire page or viewport
  quality: 80,        // For jpeg/webp
});

// Element screenshot:
await mcp__chrome_devtools__take_screenshot({
  uid: 'element-uid-from-snapshot',
});
```

### Resize Page

Test responsive layouts.

```typescript
// Mobile
await mcp__chrome_devtools__resize_page({
  width: 375,
  height: 812,
});

// Tablet
await mcp__chrome_devtools__resize_page({
  width: 768,
  height: 1024,
});

// Desktop
await mcp__chrome_devtools__resize_page({
  width: 1280,
  height: 800,
});
```

### Interact with Elements

Click, fill, and interact.

```typescript
// Click element
await mcp__chrome_devtools__click({
  uid: 'button-uid-from-snapshot',
  dblClick: false,
});

// Fill input
await mcp__chrome_devtools__fill({
  uid: 'input-uid',
  value: 'Test value',
});

// Fill form
await mcp__chrome_devtools__fill_form({
  elements: [
    { uid: 'name-input', value: 'John Doe' },
    { uid: 'email-input', value: 'john@example.com' },
  ],
});

// Hover
await mcp__chrome_devtools__hover({
  uid: 'element-uid',
});

// Press key
await mcp__chrome_devtools__press_key({
  key: 'Enter',  // or 'Escape', 'Tab', 'Control+A'
});
```

### Wait for Content

Wait for specific text to appear.

```typescript
await mcp__chrome_devtools__wait_for({
  text: 'Loading complete',
  timeout: 5000,  // milliseconds
});
```

### List Pages

Get all open pages.

```typescript
const pages = await mcp__chrome_devtools__list_pages();
// Returns array of { title, url, pageIdx }

// Select specific page
await mcp__chrome_devtools__select_page({
  pageIdx: 0,
});
```

### Preview Workflow

Complete preview workflow:

```typescript
// 1. Navigate to preview
await mcp__chrome_devtools__navigate_page({
  url: 'http://localhost:3000/create',
  type: 'url',
});

// 2. Wait for page load
await mcp__chrome_devtools__wait_for({
  text: 'Create',
  timeout: 5000,
});

// 3. Take snapshot
const snapshot = await mcp__chrome_devtools__take_snapshot({});

// 4. Screenshot desktop view
await mcp__chrome_devtools__take_screenshot({
  format: 'png',
});

// 5. Test mobile view
await mcp__chrome_devtools__resize_page({
  width: 375,
  height: 812,
});

// 6. Screenshot mobile view
await mcp__chrome_devtools__take_screenshot({
  format: 'png',
});

// 7. Interact with element
await mcp__chrome_devtools__click({
  uid: 'submit-button-uid',
});
```

## Actor-Critic Thinking MCP

### Dual-Perspective Analysis

Analyze from both creative and technical viewpoints.

```typescript
// Round 1: Actor (Creative) perspective
await mcp__actor_critic_thinking__actor_critic_thinking({
  content: `As the Actor (Creative Designer), I envision:
    - Visual Appeal: Premium glassmorphism with depth layers
    - User Experience: Intuitive hover states reveal information
    - Emotional Tone: Professional yet approachable
    - Innovation: Micro-interactions on state changes
    - Storytelling: Card content flows naturally top-to-bottom`,
  role: 'actor',
  thoughtNumber: 1,
  totalThoughts: 5,  // Must be odd, >= 3
  nextRoundNeeded: true,
});

// Round 2: Critic (Technical) perspective
await mcp__actor_critic_thinking__actor_critic_thinking({
  content: `As the Critic (Technical Reviewer), I evaluate:
    - Accessibility: Contrast ratio 7.2:1 exceeds WCAG AA (4.5:1)
    - Performance: backdrop-filter has minimal GPU impact when limited
    - Maintainability: Component uses CVA for variants, well-structured
    - Code Quality: TypeScript strict, no 'any' types
    - Improvements: Add reduced-motion media query for animations`,
  role: 'critic',
  thoughtNumber: 2,
  totalThoughts: 5,
  nextRoundNeeded: true,
});

// Round 3: Actor responds to critic
await mcp__actor_critic_thinking__actor_critic_thinking({
  content: `Responding to critic's accessibility concern:
    - Will ensure all text meets 4.5:1 minimum
    - Adding bg-white/50 backing for low-contrast situations
    - Reduced motion: Will provide instant state changes as fallback`,
  role: 'actor',
  thoughtNumber: 3,
  totalThoughts: 5,
  nextRoundNeeded: true,
});

// Round 4: Critic validates changes
await mcp__actor_critic_thinking__actor_critic_thinking({
  content: `Validating proposed changes:
    - Accessibility improvements approved
    - Performance considerations addressed
    - Final score: 92/100`,
  role: 'critic',
  thoughtNumber: 4,
  totalThoughts: 5,
  nextRoundNeeded: true,
});

// Round 5: Final synthesis
await mcp__actor_critic_thinking__actor_critic_thinking({
  content: `Synthesis:
    - Recommendation: Proceed with implementation
    - Priority: must-have
    - Complexity: moderate
    - Key features: glassmorphism, hover lift, a11y compliant`,
  role: 'actor',  // Final round can be either
  thoughtNumber: 5,
  totalThoughts: 5,
  nextRoundNeeded: false,  // End analysis
});
```

## Context7 MCP

### Resolve Library ID

Find the Context7 ID for a library.

```typescript
const result = await mcp__context7__resolve_library_id({
  libraryName: 'tailwindcss',
});

// Returns:
// - libraryId: '/tailwindlabs/tailwindcss'
// - name: 'Tailwind CSS'
// - description: ...
```

### Get Library Documentation

Fetch documentation for specific topics.

```typescript
// Code examples mode (default)
const docs = await mcp__context7__get_library_docs({
  context7CompatibleLibraryID: '/tailwindlabs/tailwindcss',
  topic: 'backdrop-filter blur',
  mode: 'code',
});

// Conceptual/info mode
const info = await mcp__context7__get_library_docs({
  context7CompatibleLibraryID: '/vercel/next.js',
  topic: 'app router',
  mode: 'info',
});

// Pagination for more results
const page2 = await mcp__context7__get_library_docs({
  context7CompatibleLibraryID: '/tailwindlabs/tailwindcss',
  topic: 'animation',
  page: 2,
});
```

### Common Library IDs

| Library | Context7 ID |
|---------|-------------|
| Tailwind CSS | /tailwindlabs/tailwindcss |
| Next.js | /vercel/next.js |
| React | /facebook/react |
| TypeScript | /microsoft/TypeScript |
| Radix UI | /radix-ui/primitives |
| Framer Motion | /framer/motion |

### Documentation Workflow

```typescript
// 1. Resolve library
const tailwind = await mcp__context7__resolve_library_id({
  libraryName: 'tailwindcss',
});

// 2. Get glassmorphism docs
const glassDocs = await mcp__context7__get_library_docs({
  context7CompatibleLibraryID: tailwind.libraryId,
  topic: 'backdrop-filter blur opacity',
  mode: 'code',
});

// 3. Get animation docs
const animDocs = await mcp__context7__get_library_docs({
  context7CompatibleLibraryID: tailwind.libraryId,
  topic: 'animation transition keyframes',
  mode: 'code',
});
```

## Combined Workflow Example

Complete UI/UX agent workflow using all MCP servers:

```typescript
// Step 1: Search for reference components (shadcn)
const cardSearch = await mcp__shadcn__search_items_in_registries({
  registries: ['@shadcn'],
  query: 'card',
});

// Step 2: Get card examples (shadcn)
const cardExamples = await mcp__shadcn__get_item_examples_from_registries({
  registries: ['@shadcn'],
  query: 'card-demo',
});

// Step 3: Get Tailwind docs for glassmorphism (context7)
const tailwindDocs = await mcp__context7__get_library_docs({
  context7CompatibleLibraryID: '/tailwindlabs/tailwindcss',
  topic: 'backdrop-filter',
  mode: 'code',
});

// Step 4: Actor-Critic analysis
await mcp__actor_critic_thinking__actor_critic_thinking({
  content: 'Creative vision for glass card...',
  role: 'actor',
  thoughtNumber: 1,
  totalThoughts: 3,
  nextRoundNeeded: true,
});

await mcp__actor_critic_thinking__actor_critic_thinking({
  content: 'Technical evaluation...',
  role: 'critic',
  thoughtNumber: 2,
  totalThoughts: 3,
  nextRoundNeeded: true,
});

await mcp__actor_critic_thinking__actor_critic_thinking({
  content: 'Synthesis and recommendation...',
  role: 'actor',
  thoughtNumber: 3,
  totalThoughts: 3,
  nextRoundNeeded: false,
});

// Step 5: Generate component (API call)
const response = await fetch('/api/agents/ui-ux-ultra', {
  method: 'POST',
  body: JSON.stringify({
    mode: 'design',
    description: 'Premium glass card',
    stylePreferences: { glassmorphism: 'premium' },
  }),
});

// Step 6: Preview in browser (chrome-devtools)
await mcp__chrome_devtools__navigate_page({
  url: 'http://localhost:3000/preview',
});

await mcp__chrome_devtools__take_screenshot({
  format: 'png',
});

// Step 7: Get install command (shadcn)
const installCmd = await mcp__shadcn__get_add_command_for_items({
  items: ['@shadcn/card', '@shadcn/badge'],
});
```

## Best Practices

1. **Cache library IDs** - Resolve once, reuse for multiple doc requests
2. **Batch component searches** - Search multiple terms in one query
3. **Use verbose snapshots** - Include all a11y info for analysis
4. **Test all viewports** - Always check mobile, tablet, desktop
5. **Complete actor-critic rounds** - Don't skip the synthesis step
