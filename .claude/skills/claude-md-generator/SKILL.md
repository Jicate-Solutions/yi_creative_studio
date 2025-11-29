---
name: claude-md-generator
description: >
  Automatically generates optimized CLAUDE.md files for any project by analyzing codebase structure, 
  tech stack, patterns, and conventions. This skill should be used when starting work on a new project, 
  onboarding to an existing codebase, or when the user mentions "generate claude.md", "create claude.md", 
  "setup claude.md", "initialize project for claude", "analyze project", or asks for project documentation 
  for Claude Code. Works with any tech stack: Next.js, React, Python, Node.js, Ruby, Go, Rust, etc.
---

# CLAUDE.md Generator

This skill analyzes any project and generates a comprehensive, optimized `CLAUDE.md` file that helps Claude Code work more effectively with the codebase.

## When to Use

- Starting work on a new project
- Onboarding to an existing codebase without proper documentation
- User explicitly asks to generate/create a CLAUDE.md file
- User wants to set up a project for Claude Code
- User mentions they work on "multiple projects" and need standardized setup

## Analysis Process

### Step 1: Detect Project Type and Tech Stack

Run the analyzer script to detect the project structure:

```bash
python .claude/skills/claude-md-generator/scripts/analyze_project.py
```

If the script is not available, perform manual analysis:

1. Check for framework indicators:
   - `package.json` → Node.js/JavaScript project
   - `next.config.*` → Next.js
   - `vite.config.*` → Vite
   - `requirements.txt` / `pyproject.toml` / `setup.py` → Python
   - `Cargo.toml` → Rust
   - `go.mod` → Go
   - `Gemfile` → Ruby
   - `pom.xml` / `build.gradle` → Java
   - `*.csproj` / `*.sln` → .NET/C#

2. Identify database/backend:
   - `.env*` files for Supabase, Firebase, MongoDB, PostgreSQL URLs
   - `prisma/` directory → Prisma ORM
   - `drizzle/` → Drizzle ORM
   - `supabase/` → Supabase

3. Detect UI frameworks:
   - `tailwind.config.*` → Tailwind CSS
   - `components.json` → shadcn/ui
   - `styled-components` in dependencies
   - `@mui/*` in dependencies → Material UI

### Step 2: Extract Project Patterns

Analyze the codebase for:

1. **Directory Structure**: Map out key directories and their purposes
2. **Naming Conventions**: Detect file naming patterns (camelCase, kebab-case, PascalCase)
3. **Component Patterns**: Identify how components are structured
4. **API Patterns**: Find API route conventions
5. **State Management**: Detect Redux, Zustand, Context, React Query, etc.
6. **Testing Setup**: Find test frameworks and patterns

### Step 3: Extract Commands

From `package.json`, `Makefile`, `pyproject.toml`, etc., extract:
- Development commands (`dev`, `start`)
- Build commands
- Test commands
- Lint/format commands
- Database commands

### Step 4: Generate CLAUDE.md

Create a `CLAUDE.md` file with the following structure:

```markdown
# CLAUDE.md - [Project Name]

## Project Overview
[Brief description of what the project does]

## Tech Stack
- **Framework:** [e.g., Next.js 14, React 18, Django 4.2]
- **Language:** [e.g., TypeScript, Python 3.11]
- **Database:** [e.g., Supabase, PostgreSQL, MongoDB]
- **Styling:** [e.g., Tailwind CSS, shadcn/ui]
- **State Management:** [e.g., React Query, Zustand]

## Quick Commands
```bash
# Development
npm run dev          # Start dev server

# Build & Test
npm run build        # Production build
npm run test         # Run tests
npm run lint         # Lint code
```

## Project Structure
```
├── app/             # Next.js app router pages
├── components/      # React components
├── lib/             # Utility functions
├── hooks/           # Custom React hooks
├── types/           # TypeScript types
└── services/        # API/business logic
```

## Code Conventions

### File Naming
- Components: PascalCase (`UserCard.tsx`)
- Hooks: camelCase with `use` prefix (`useAuth.ts`)
- Utils: camelCase (`formatDate.ts`)
- Types: PascalCase for types, camelCase for files

### Component Structure
[Example component showing the project's patterns]

### API Routes
[API route conventions if applicable]

## Database Schema
[Key tables/collections if applicable]

## Environment Variables
```env
# Required
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Optional
SOME_API_KEY=
```

## Testing
[Testing approach and commands]

## Important Notes
- [Any gotchas or important info]
- [Specific patterns to follow]
- [Things to avoid]
```

## Customization Options

When generating, ask the user:

1. **Detail Level**: "Do you want a minimal, standard, or comprehensive CLAUDE.md?"
   - Minimal: Just commands and basic structure
   - Standard: Commands, structure, conventions
   - Comprehensive: Everything including examples and edge cases

2. **Focus Areas**: "Any specific areas to emphasize?"
   - API development
   - Frontend components
   - Database operations
   - Testing

3. **Team Context**: "Is this for solo use or team sharing?"
   - Solo: Personal preferences
   - Team: More detailed conventions for consistency

## Output Location

By default, generate `CLAUDE.md` in the project root. Offer options:
- `CLAUDE.md` (root, recommended for sharing)
- `CLAUDE.local.md` (root, gitignored for personal use)
- `~/.claude/CLAUDE.md` (global, applies to all projects)

## Post-Generation

After generating the file:

1. Display a summary of what was included
2. Suggest running `/init` to let Claude verify the file
3. Recommend reviewing and customizing based on team preferences
4. Suggest adding project-specific commands with the `#` key during sessions

## References

For detailed best practices, see: `references/claude-md-best-practices.md`
