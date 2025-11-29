# CLAUDE.md Best Practices Reference

This document contains comprehensive best practices for creating effective CLAUDE.md files, derived from official Anthropic recommendations and real-world usage patterns.

## Core Principles

### 1. Keep It Concise
- CLAUDE.md becomes part of Claude's prompt - every word counts
- Aim for 500-2000 words maximum
- Use bullet points over paragraphs
- Remove redundant information

### 2. Be Specific and Actionable
- Bad: "Use good coding practices"
- Good: "Use ES modules (import/export), not CommonJS (require)"

### 3. Include What Claude Can't Infer
- Project-specific commands
- Non-standard patterns
- Team conventions
- Known gotchas

## Essential Sections

### Commands Section
```markdown
## Commands
- `npm run dev` - Start development server on port 3000
- `npm run build` - Production build
- `npm run test` - Run Jest tests
- `npm run lint` - ESLint check
- `npm run db:push` - Push Prisma schema to database
```

Key points:
- Include the command AND what it does
- Add port numbers, URLs, or relevant details
- Group related commands

### Code Style Section
```markdown
## Code Style
- Use TypeScript strict mode
- Prefer named exports over default exports
- Use absolute imports with `@/` prefix
- Components: PascalCase files and names
- Hooks: camelCase with `use` prefix
- Utils: camelCase functions and files
```

Key points:
- Be explicit about naming conventions
- Mention import preferences
- Include framework-specific patterns

### Project Structure Section
```markdown
## Structure
├── app/          # Next.js App Router pages
├── components/   # Reusable UI components
│   ├── ui/       # Base UI primitives (shadcn)
│   └── features/ # Feature-specific components
├── hooks/        # Custom React hooks
├── lib/          # Utilities and helpers
├── services/     # Business logic and API calls
└── types/        # TypeScript definitions
```

Key points:
- Show directory purposes
- Indicate nesting conventions
- Note special directories

### Workflow Section
```markdown
## Workflow
- Always run `npm run typecheck` after code changes
- Create feature branches from `main`
- Write tests for new features
- Update types first when adding new entities
```

Key points:
- Document required steps
- Note CI/CD expectations
- Include review requirements

## Advanced Patterns

### Emphasis for Critical Instructions
Use emphasis when Claude must follow specific patterns:

```markdown
IMPORTANT: Never commit directly to main branch
YOU MUST run tests before creating PRs
ALWAYS use the existing Button component from @/components/ui
```

### Negative Instructions (What NOT to Do)
```markdown
## Avoid
- Don't use `var` - use `const` or `let`
- Don't create new utility functions without checking lib/utils first
- Don't add dependencies without team discussion
- Never store secrets in code
```

### Environment-Specific Notes
```markdown
## Development
- Uses SQLite locally, PostgreSQL in production
- Hot reload works for components, not API routes
- Run `npm run db:seed` for test data

## Production
- Deployed on Vercel
- Database on Supabase
- Images served from Cloudflare R2
```

## Tech Stack Templates

### Next.js + Supabase + TypeScript
```markdown
# CLAUDE.md

## Commands
npm run dev          # Start on localhost:3000
npm run build        # Production build
npm run lint         # ESLint
npx supabase db push # Push migrations

## Stack
- Next.js 14 (App Router)
- TypeScript (strict)
- Supabase (auth + database)
- Tailwind CSS + shadcn/ui
- React Query for data fetching

## Conventions
- Components: PascalCase
- Server Components by default, 'use client' only when needed
- API routes in app/api/
- Database types generated with `npx supabase gen types`

## Patterns
- Use createClient() from @/lib/supabase/client for client components
- Use createClient() from @/lib/supabase/server for server components
- RLS policies handle authorization
```

### Python + FastAPI
```markdown
# CLAUDE.md

## Commands
uvicorn main:app --reload   # Dev server
pytest                       # Run tests
ruff check .                # Lint
ruff format .               # Format

## Stack
- Python 3.11+
- FastAPI
- SQLAlchemy + Alembic
- Pydantic for validation

## Conventions
- snake_case for files and functions
- PascalCase for classes and Pydantic models
- Type hints required
- Async functions for I/O operations

## Structure
├── app/
│   ├── api/       # Route handlers
│   ├── models/    # SQLAlchemy models
│   ├── schemas/   # Pydantic schemas
│   └── services/  # Business logic
```

### React + Node.js
```markdown
# CLAUDE.md

## Commands
npm run dev         # Start frontend (3000) and backend (4000)
npm run test        # Jest tests
npm run build       # Production build

## Stack
- React 18 with Vite
- Express.js backend
- TypeScript throughout
- Prisma ORM

## Conventions
- Functional components with hooks
- CSS Modules for styling
- API calls through services/api.ts
- Error boundaries for crash handling
```

## Location Options

### Project Root (CLAUDE.md)
- Checked into git
- Shared with team
- Project-specific

### Project Root (CLAUDE.local.md)
- Added to .gitignore
- Personal preferences
- Experimental patterns

### Home Directory (~/.claude/CLAUDE.md)
- Applies to all projects
- Personal workflow preferences
- Global tool configurations

### Nested Directories
- Subdirectory-specific instructions
- Monorepo package conventions
- Module-specific patterns

## Iteration Tips

### Using # to Add Instructions
During a session, press `#` to give Claude instructions that automatically get added to CLAUDE.md:
- "Remember that we use Zustand for state management"
- "The API base URL is /api/v1"
- "Always destructure props in components"

### Regular Review
- Review CLAUDE.md monthly
- Remove outdated information
- Add patterns that keep coming up
- Test instructions with fresh sessions

### Team Collaboration
- Include CLAUDE.md in code reviews
- Discuss conventions before adding
- Keep it as source of truth for patterns

## Anti-Patterns to Avoid

### Too Verbose
```markdown
# BAD - Walls of text
When you create a new component, you should always make sure to 
follow the existing patterns in the codebase. This means using 
PascalCase for the component name, creating a separate file for
each component, and making sure to export it properly...

# GOOD - Concise
## Components
- PascalCase names
- One component per file
- Named exports
```

### Too Vague
```markdown
# BAD
- Write good code
- Follow best practices
- Be careful with performance

# GOOD
- Use React.memo for expensive renders
- Debounce search inputs (300ms)
- Lazy load routes with dynamic imports
```

### Duplicating Documentation
```markdown
# BAD - Copying framework docs
React hooks allow you to use state and other React features...

# GOOD - Project-specific usage
## Hooks
- Custom hooks in hooks/ directory
- Use useQuery from @tanstack/react-query for data fetching
- Auth state from useAuth() hook
```

## Measuring Effectiveness

A good CLAUDE.md should:
1. Reduce "How do I...?" questions during sessions
2. Prevent common mistakes on first try
3. Make onboarding faster
4. Keep Claude's output consistent with team patterns

Test by:
- Starting fresh sessions and checking if patterns are followed
- Asking teammates to use Claude with your CLAUDE.md
- Tracking types of corrections needed during sessions
