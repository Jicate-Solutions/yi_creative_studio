# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Yi CreativeStudio is an AI-powered brand creative generation platform built for Young Indians (Yi) chapters. It generates on-brand marketing materials (event posters, social posts, certificates, flyers) using AI image generation with automated logo overlay.

## Tech Stack

- **Framework**: Next.js 16 with App Router (React 19, TypeScript 5)
- **Styling**: Tailwind CSS 4, shadcn/ui (new-york style)
- **Backend**: Supabase (auth, database, storage)
- **AI Providers**: Google Gemini (primary image gen), Anthropic Claude (prompt enhancement)
- **State**: Zustand for global state (stores/)
- **Image Processing**: Sharp (logo overlay, resizing), Cloudinary (CMYK export)
- **Forms**: React Hook Form + Zod validation

## Commands

```bash
npm run dev      # Start development server (localhost:3000)
npm run build    # Build for production
npm run lint     # Run ESLint
npm start        # Start production server
```

## Architecture

### Directory Structure

```
app/
├── (dashboard)/     # Protected dashboard routes (create, gallery, templates, settings)
├── (marketing)/     # Public marketing pages
├── api/             # API routes
├── auth/            # Auth pages (login, signup, callback)
├── onboarding/      # User onboarding flow
```

### AI Image Generation Pipeline

The main creative generation flow (`/api/generate`) uses a multi-stage AI pipeline:

1. **Form Data Compilation** (`lib/prompts/services/form-data-compiler.ts`)
   - Compiles user form input into structured data
   - Builds text brief with VALUES ONLY (no labels - Gemini would render them as visible text)

2. **Ultra-Pro Prompt Generation** (`lib/prompts/services/ultra-pro-prompt.ts`)
   - Uses Claude AI to transform form data into optimized image prompts
   - Ensures user's exact values are prioritized

3. **Design Intelligence** (`lib/prompts/services/design-intelligence.ts`)
   - Two-stage AI pipeline for design context (visual elements, mood, strategy)
   - Supports Gemini and Claude providers with fallbacks to knowledge base

4. **Format-Specific Prompt Building** (`lib/prompts/services/yi-prompt-builder/`)
   - XML-structured prompts with role tagging
   - 10+ format builders: event_poster, certificate, youtube_thumbnail, instagram, etc.
   - Injects logo awareness, brand context, speaker photo config

5. **Image Generation**
   - Primary: Gemini 2.5 Flash Image (`gemini-2.5-flash-image`)
   - Alternative: Ideogram V_2

6. **Post-Processing** (`lib/sharp/`)
   - Logo overlay with position locking (9-position grid)
   - Speaker photo overlays with shape options
   - Exact dimension resizing

### Critical Design Patterns

**⚠️ FULL-CANVAS GENERATION (v24.6 - MANDATORY)** (`app/api/generate/route.ts`, `lib/sharp/logo-overlay.ts`):
- **USER REQUIREMENT**: Gemini MUST generate FULL canvas (e.g., 1080x1440) including header/footer design
- **REASON**: User wants AI-generated blue gradient header/footer (NOT static, NOT blurred!)
- **IMPLEMENTATION**:
  - Generate at full canvas size (NOT content-only, REVERTED v24.4)
  - Use Gemini's output directly (NO artificial backgrounds, REVERTED v24.5)
  - Logo bars overlay with TRANSPARENT backgrounds (alpha: 0.1/0/0.85)
  - Gemini's artistic header/footer shows through logo overlays
- **PROTECTION**: Feature flags `USE_FULL_CANVAS_GENERATION` and `PRESERVE_GEMINI_BACKGROUNDS` enforce this
- **TRADE-OFF**: Accept occasional text-logo overlaps (user-approved for Gemini creativity)
- **NEVER**: Switch to content-only generation or add blurred backgrounds without user approval
- **DOCUMENTATION**: See `doc/v24.6-full-canvas-restoration.md` for full details

**Transparent Logo Bar Values (v24.6 - MANDATORY)**:
- Row 1 (Brand): `alpha: 0.1` (nearly transparent - Gemini header visible)
- Row 2 (Vertical): `alpha: 0` (fully transparent - blue gradient visible)
- Row 3 (Initiative): `alpha: 0.85` (semi-transparent - text readable with Gemini showing)
- Constants: `LOGO_BAR_ALPHA_ROW1_BRAND`, `LOGO_BAR_ALPHA_ROW2_VERTICAL`, `LOGO_BAR_ALPHA_ROW3_INITIATIVE`
- **NEVER**: Increase opacity without user approval (user rejected alpha: 0.92 as too opaque)

**Instruction vs Content Separation**: Gemini renders instruction language ("Include", "Feature", "Create") as visible text. Use XML-structured prompts:
```xml
<text role="headline">Event Title Here</text>  <!-- RENDERS -->
<instruction>(DO NOT RENDER) Place headline in upper third</instruction>  <!-- HIDDEN -->
```

**Logo Position Locking** (`lib/config/logo-locks.ts`):
- Yi logo MUST be top-left
- CII logo MUST be top-right
- Validation enforced during generation

**Supabase Singleton** (`lib/supabase/client.ts`): Browser client uses singleton to prevent multiple auth listeners.

**Race Condition Prevention**: Dynamic schema generation uses request ID validation with AbortController.

### Dynamic Form Fields

The `/api/generate-fields` endpoint generates format-specific form fields via AI (Claude Haiku). Each format has different required fields (event poster needs date/venue, certificate needs recipient name, etc.).

### API Usage Tracking

Usage tracking (`lib/services/api-usage.ts`) logs all AI API calls to the `api_usage` table with:
- Token counts (input/output/cached)
- Cost calculations using `lib/config/ai-pricing.ts`
- Provider and model information
- Stage-by-stage cost breakdown

### Key Patterns

**Supabase Integration (lib/supabase/)**
- `client.ts` - Browser client (singleton with Database type)
- `server.ts` - Server client for Server Components/Actions (uses `createServerClient<Database>`)
- `middleware.ts` - Session handling with cookie management

**State Management (stores/)**
- `creative-store.ts` - Main creative workflow state (format, logos, design, AI suggestions)
  - Persists: `recentFormats`, `selectedFormatId`
  - Rehydration resets loading states
- `auth-store.ts` - User, organization, role. Persists: `currentOrganization`
- `ui-store.ts` - Modals, sidebar, loading state. No persistence (transient)

**Prompt System (lib/prompts/)**
- `services/yi-prompt-builder/` - XML-structured format-specific prompt builders
- `knowledge-base/base-patterns/` - 10 format categories (poster, certificate, social, etc.)
- `helpers/` - Logo awareness, color narrative, text rendering utilities

**Configuration (lib/config/)**
- `ai-pricing.ts` - Token pricing for Gemini and Claude models
- `design-constants.ts` - Aspect ratios, resolutions (1K/2K/4K), color palettes
- `creative-formats.ts` - 30+ format definitions with dimensions
- `logo-locks.ts` - Logo position enforcement rules
- `constants.ts` - Brand colors (#005B96 primary, #FF6B35 secondary)

### Path Aliases

```
@/* -> ./*  (e.g., @/components, @/lib, @/hooks)
```

### Authentication Flow

Middleware at `middleware.ts` uses Supabase SSR for session management. Protected routes redirect to `/auth/login`. Public routes: `/`, `/auth/*`, `/join/*`.

### Role-Based Access Control

Defined in `types/rbac.ts` with hierarchy-based permissions:
- `admin` (100) - Full access
- `editor` (50) - Can generate, manage creatives
- `viewer` (10) - Read-only access

Helper functions: `getRoleDefinition()`, `canEdit()` (admin/editor), `canManage()` (admin only)

### Provider Hierarchy (lib/providers/index.tsx)

ThemeProvider → BugReporterWrapper → AuthProvider → children

## Type Definitions

Located in `types/`:
- `database.types.ts` - Supabase generated types (includes `api_usage`, `creatives`, `organizations`)
- `design.types.ts` - Design system types
- `export.ts` - Export configuration types
- `rbac.ts` - Role-based access control types
- `suggestions.ts` - Field suggestion types

## Database

Regenerate Supabase types after schema changes:
```bash
npx supabase gen types typescript --project-id <project-id> > types/database.types.ts
```

Key tables: `organizations`, `creatives`, `organization_members`, `vertical_presets`, `api_usage`

## Environment Variables

Required in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `GEMINI_API_KEY` - Google Gemini for image generation
- `ANTHROPIC_API_KEY` - Claude for prompt enhancement
- `CLOUDINARY_*` - For CMYK export functionality


---

# Rules for Newcomers (intern-ready)

## Before Building Anything New — the Pattern Survey (mandatory)

Claude generates plausible parallel versions of things that already exist. That is the #1 cause of unmergeable work. So before creating ANY new table, service, hook, or utility:

1. Search for existing tables/types matching your entity name (`grep -ri "<entity>" --include="*.sql" --include="*.ts" .`)
2. Search for existing services/hooks in the same domain (`ls` the services/hooks folders, read names)
3. Search for how auth/permissions are already done — reuse that mechanism, never invent one
4. If something similar exists: USE IT or EXTEND IT. Never create a parallel mechanism.

This survey takes 5 minutes and saves days of rework.

## Integration Contract (before any module-sized work)

Before starting anything bigger than a small fix, write a half-page answer to these four questions and get it approved by a reviewer:

1. Which **existing tables** will I read/write? Which **new** ones do I create?
2. Which **existing services/hooks/components** will I reuse (name them with file paths)?
3. Where does **auth/permission checking** come from? (must be the existing mechanism)
4. What is my **first thin end-to-end slice** (one table + one route + one page)?

## Work Rules

- **Small PRs**: one task per PR, roughly ≤400 changed lines, ≤2 days of work. Bigger → split it.
- **PR-only**: never push directly to the default branch.
- **First PR within 48 hours** of starting any module: the thin vertical slice, wired into the real app (behind a feature flag if needed).
- **Proof of done**: every PR includes a screenshot/short video (UI) or command output (non-UI) showing the change working. "It compiles" is not done.
- **Stay in scope**: touch only files the task requires. Mention other problems in the PR description; don't fix them in the same PR.
- **No secrets in code**: keys and tokens live in environment variables, never in committed files.

## Off-Limits Without Explicit Approval

Do not touch these without a reviewer's written OK in the issue/PR first:

- Authentication / session logic
- Database migrations and RLS (row-level security) policies
- Anything involving payments or money
- Deleting or renaming existing tables/columns
- CI workflows and branch-protection settings

## Definition of Done

A task is done when: PR is open → CI is green → proof screenshot/output is attached → one reviewer approved → merged. Nothing else counts.
