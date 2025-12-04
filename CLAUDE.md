# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Yi CreativeStudio is an AI-powered brand creative generation platform built for Young Indians (Yi) chapters. It generates on-brand marketing materials (event posters, social posts) using AI.

## Tech Stack

- **Framework**: Next.js 16 with App Router (React 19, TypeScript 5)
- **Styling**: Tailwind CSS 4, shadcn/ui (new-york style)
- **Backend**: Supabase (auth, database, storage)
- **AI**: Google Gemini API (via @google/generative-ai)
- **State**: Zustand for global state (stores/)
- **Image Processing**: Sharp, Cloudinary (CMYK export)
- **Forms**: React Hook Form + Zod validation

## Commands

```bash
npm run dev      # Start development server
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
├── api/             # API routes (generate, export, templates, auth)
├── auth/            # Auth pages (login, signup, callback)
├── onboarding/      # User onboarding flow
```

### Key Patterns

**State Management (stores/)**
- `creative-store.ts` - Main creative workflow state using Zustand with persist middleware
- `auth-store.ts` - Authentication state
- `ui-store.ts` - UI state (modals, sidebar)

**Supabase Integration (lib/supabase/)**
- `client.ts` - Browser client
- `server.ts` - Server client for Server Components/Actions
- `middleware.ts` - Session handling with cookie management

**Hooks (hooks/)**
Custom hooks follow `use-*.ts` pattern:
- `use-ai-design-suggestions.ts` - AI-powered design suggestions
- `use-export.ts` - Export functionality
- `use-logos.ts` - Organization logo management
- `use-template-images.ts` - Template image handling

**API Routes (app/api/)**
- `/api/generate` - AI creative generation (uses Gemini)
- `/api/generate-fields` - Dynamic form field generation
- `/api/suggest-design` - AI design suggestions
- `/api/export` - Image export with format conversion
- `/api/templates` - Template CRUD operations

**Configuration (lib/config/)**
- `design-constants.ts` - Design system tokens, aspect ratios, color configs
- `creative-formats.ts` - Supported creative formats/dimensions
- `logo-locks.ts` - Logo position locking rules

### Path Aliases

```
@/* -> ./*  (e.g., @/components, @/lib, @/hooks)
```

### Authentication Flow

Middleware at `middleware.ts` uses Supabase SSR for session management. Protected routes redirect to `/auth/login`. Public routes: `/`, `/auth/*`, `/join/*`.

### Provider Hierarchy (lib/providers/index.tsx)

ThemeProvider → BugReporterWrapper → AuthProvider → children

## Type Definitions

Located in `types/`:
- `database.types.ts` - Supabase generated types
- `design.types.ts` - Design system types
- `export.ts` - Export configuration types
- `rbac.ts` - Role-based access control types
