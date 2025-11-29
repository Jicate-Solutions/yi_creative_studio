---
name: prd-generator
description: Generates comprehensive Product Requirements Documents (PRDs) by analyzing codebases. This skill should be used when users want to create a PRD for an existing application, document app requirements, or prepare specifications for AI-assisted development. Automatically triggers when user mentions "PRD", "product requirements", "create PRD", "generate requirements document", "document this application", or requests to prepare specifications for a project.
---

# PRD Generator

## Overview

This skill analyzes any codebase and generates a comprehensive Product Requirements Document (PRD) following a structured 15-section template optimized for AI-assisted development. The generated PRD includes all information needed for another Claude session (or development team) to understand and build upon the application.

## When to Use

- Creating a PRD for an existing application
- Documenting requirements before major refactoring
- Preparing specifications for a new development team
- Converting legacy code knowledge into formal documentation
- Onboarding new developers to understand the application
- Planning new features that extend existing functionality

## Codebase Analysis Workflow

### Phase 1: Project Discovery

To understand the project context:

1. Read `CLAUDE.md`, `README.md`, `package.json` for project overview
2. Explore directory structure to understand architecture patterns
3. Identify tech stack (frameworks, databases, APIs)
4. Note any existing documentation or specifications

### Phase 2: Feature Inventory

To catalog all features:

1. **Routes & Pages**: Map all routes from `app/` or `pages/` directory
2. **UI Components**: Catalog components from `components/` directory
3. **API Endpoints**: Document all API routes and their purposes
4. **Database Schema**: Extract tables/models from `types/` or schema files
5. **Business Logic**: Review `hooks/`, `services/`, `lib/` for core logic

### Phase 3: User Flow Mapping

To understand user journeys:

1. Trace authentication flows (login, signup, password reset)
2. Document core user journeys (CRUD operations for each entity)
3. Identify role-based access patterns
4. Map navigation structure and information architecture
5. Note edge cases and error handling patterns

### Phase 4: PRD Generation

Load `references/prd-template.md` and systematically fill each section:

1. **Problem Statement**: Infer from app's purpose and features
2. **User Stories**: Derive from discovered user flows
3. **Features**: Organize discovered features by priority
4. **User Flows**: Document step-by-step journeys
5. **Edge Cases**: Extract from error handling code
6. **Business Rules**: Convert conditional logic to IF-THEN rules
7. **Technical Context**: Document stack, APIs, constraints

### Phase 5: Output Generation

Generate three output files:

1. **PRD.md**: Complete product requirements document
2. **features.json**: Structured feature list for development tracking
3. **progress.txt**: Development tracking template

## Analysis Checklist

Before generating the PRD, ensure analysis of:

- [ ] Project configuration files (`package.json`, `tsconfig.json`, etc.)
- [ ] Main documentation (`README.md`, `CLAUDE.md`)
- [ ] Application routes and pages
- [ ] Component library and UI patterns
- [ ] API routes and their request/response shapes
- [ ] Database schema and relationships
- [ ] Authentication and authorization logic
- [ ] State management patterns
- [ ] Third-party integrations
- [ ] Environment variables and configuration

## Output Format

### PRD.md Structure

The generated PRD follows the 15-section template in `references/prd-template.md`:

1. The Problem
2. Why This Matters
3. Evidence
4. User Stories
5. Specific Features (P0/P1/P2)
6. User Flow
7. Edge Cases
8. Business Rules (IF-THEN)
9. Visual Reference
10. UI Text & Labels
11. Success Metrics
12. Non-Goals
13. Technical Context
14. Timeline
15. Open Questions

### features.json Structure

```json
{
  "project_name": "[App Name]",
  "version": "1.0.0",
  "generated_date": "[ISO Date]",
  "features": [
    {
      "id": "F001",
      "name": "Feature Name",
      "priority": "P0|P1|P2",
      "status": "existing|pending|in_progress",
      "acceptance_criteria": ["Criteria 1", "Criteria 2"],
      "dependencies": ["F002"],
      "estimated_complexity": "low|medium|high"
    }
  ]
}
```

### progress.txt Structure

```
# [App Name] Development Progress

## Current Session
Started: [Date]
Focus: [Current feature/task]

## Completed
- [ ] Feature 1
- [ ] Feature 2

## In Progress
- [ ] Feature 3

## Blocked
- [ ] Feature 4 (reason: ...)

## Next Up
- [ ] Feature 5
```

## Best Practices

### Writing User Stories

Use the format: "As a [user type], I want to [action] so that [benefit]"

Example:
- "As a marketing manager, I want to generate AI posters so that I can create professional marketing materials quickly"

### Writing Business Rules

Use IF-THEN format for clarity:

- "IF user has no credits THEN show upgrade prompt and disable generate button"
- "IF organization has multiple logos THEN show logo selector before generation"

### Prioritizing Features

- **P0 (Must Have)**: Core functionality, app unusable without it
- **P1 (Should Have)**: Important features, significant user impact
- **P2 (Nice to Have)**: Enhancements, polish, optimizations

## Reference

See `references/prd-template.md` for the complete 15-section template with detailed instructions for each section.

See `assets/features.json.template` for the features.json schema.
