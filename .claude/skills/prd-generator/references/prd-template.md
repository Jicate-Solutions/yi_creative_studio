# PRD Template: Non-Technical Founder's Guide to Writing AI-Ready PRDs

This template provides a structured 15-section format for writing Product Requirements Documents that are optimized for AI-assisted development. Each section includes instructions on what to include and examples.

---

## Section 1: The Problem

### What to Write
Describe the specific problem your users are experiencing. Be concrete and specific.

### Include
- What problem does the user have?
- Who is the user experiencing this problem?
- How are they currently solving it (workarounds)?
- What's painful about the current situation?

### Example
```
Users currently spend 3-4 hours creating marketing posters manually using Canva or Photoshop.
They need design skills they don't have, and the results are inconsistent with brand guidelines.
Marketing managers at small businesses are the primary users experiencing this pain.
Current workaround: Hiring freelance designers at $50-100 per poster, with 2-3 day turnaround.
```

### Template
```
[User type] currently [painful current state]. They need to [desired outcome] but face
[specific obstacles]. Current workarounds include [workaround 1] and [workaround 2],
which result in [negative consequences].
```

---

## Section 2: Why This Matters

### What to Write
Explain why solving this problem is important for the business and users.

### Include
- Business impact (revenue, retention, efficiency)
- User impact (time saved, satisfaction)
- Market timing (why now?)
- Competitive advantage

### Example
```
Business Impact: Each poster currently costs $75 in designer time. With 50 posters/month,
that's $3,750/month or $45,000/year in design costs.

User Impact: Marketing managers can respond to opportunities within hours instead of days,
increasing campaign agility by 10x.

Market Timing: AI image generation has reached production quality in 2024, making this
solution technically feasible for the first time.
```

---

## Section 3: Evidence

### What to Write
Provide proof that this problem exists and is worth solving.

### Include
- Direct user quotes or feedback
- Support tickets or feature requests
- Analytics showing pain points
- Market research or competitor analysis
- User interview insights

### Example
```
User Quotes:
- "I waste half my day just trying to make a simple event poster" - Marketing Manager, ABC Corp
- "Our posters never look consistent with our brand" - Brand Director, XYZ Inc

Support Data:
- 47 support tickets in Q3 mentioning "design help needed"
- 23% of churned users cited "too hard to create materials" in exit surveys

Analytics:
- Average time to create poster: 3.2 hours
- 68% of users abandon poster creation midway
```

---

## Section 4: User Stories

### What to Write
Describe features from the user's perspective using the standard user story format.

### Format
"As a [type of user], I want to [action/goal] so that [benefit/reason]"

### Guidelines
- Be specific about the user type
- Focus on the goal, not the solution
- Include the "so that" to explain the value

### Example
```
Core Stories:
- As a marketing manager, I want to generate professional event posters so that I can
  promote events without waiting for designer availability

- As a brand manager, I want posters to automatically use our brand colors and fonts
  so that all materials are consistent

- As an organization admin, I want to manage team member access so that I control
  who can generate content on behalf of our brand

Edge Case Stories:
- As a user with low credits, I want to see a clear warning before generation so that
  I don't accidentally fail mid-generation

- As a new user, I want guided onboarding so that I understand how to get the best results
```

---

## Section 5: Specific Features

### What to Write
List features with priority levels and acceptance criteria.

### Priority Levels
- **P0 (Must Have)**: Core functionality, product is unusable without it
- **P1 (Should Have)**: Important features, significant impact on user experience
- **P2 (Nice to Have)**: Enhancements, polish, future considerations

### Format for Each Feature
```
Feature: [Name]
Priority: P0/P1/P2
Description: [What it does]
Acceptance Criteria:
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3
```

### Example
```
Feature: AI Poster Generation
Priority: P0
Description: Generate professional event posters using AI based on user inputs
Acceptance Criteria:
- [ ] User can input event name, date, time, venue
- [ ] User can select from 22 visual themes
- [ ] User can select from 16 design styles
- [ ] Generation completes within 30 seconds
- [ ] Output is 1080x1080px minimum resolution
- [ ] All text on poster is legible and correctly spelled

Feature: Credit System
Priority: P0
Description: Track and manage generation credits for billing
Acceptance Criteria:
- [ ] Each generation deducts appropriate credits from wallet
- [ ] User sees current credit balance in UI
- [ ] Generation is blocked when credits are insufficient
- [ ] Admin can add credits to user wallets

Feature: Logo Positioning
Priority: P1
Description: Allow users to select logo position on generated posters
Acceptance Criteria:
- [ ] User can choose from 9 grid positions
- [ ] Preview shows logo placement before generation
- [ ] Position is passed to AI generation correctly
```

---

## Section 6: User Flow

### What to Write
Step-by-step journey a user takes to complete a task.

### Format
Number each step. Include:
- What the user sees
- What the user does
- What happens next
- Any decision points

### Example
```
## Flow: Generate Event Poster

1. User lands on /dashboard
   - Sees: Dashboard with "Create New" button
   - Does: Clicks "Create New"

2. User sees Create page (/dashboard/create)
   - Sees: Form with event details fields
   - Does: Fills in event name, date, time, venue, guest details

3. User selects visual options
   - Sees: Theme picker (22 options), Style picker (16 options)
   - Does: Selects "Corporate" theme and "Gradient" style

4. User selects color scheme
   - Sees: Color palette options (brand colors, harmonies)
   - Does: Selects "Brand Default" to use organization colors

5. User reviews and generates
   - Sees: Summary of selections, credit cost, Generate button
   - Does: Clicks "Generate"

6. Generation in progress
   - Sees: Loading animation, progress indicator
   - Waits: 15-30 seconds

7. Generation complete
   - Sees: Generated poster with download/save options
   - Does: Downloads poster or saves to library

Decision Points:
- At step 5: If insufficient credits, show upgrade prompt instead of Generate button
- At step 6: If generation fails, show error with retry option
```

---

## Section 7: Edge Cases

### What to Write
What happens when things go wrong or unusual situations occur.

### Categories to Consider
- Empty states (no data)
- Error states (failures)
- Boundary conditions (limits)
- Permission issues
- Network/connectivity problems
- Invalid input

### Format
```
Scenario: [What happens]
Expected Behavior: [How the system should respond]
```

### Example
```
Scenario: User has no credits remaining
Expected Behavior:
- Generate button is disabled
- Message shows: "You need credits to generate. Add credits to continue."
- Link to billing page is visible

Scenario: AI generation fails mid-process
Expected Behavior:
- Show friendly error message
- Refund the credits spent
- Offer "Try Again" button
- Log error for debugging

Scenario: User uploads logo larger than 10MB
Expected Behavior:
- Reject upload before starting
- Show message: "Logo must be under 10MB. Please compress and try again."
- Suggest online compression tools

Scenario: Organization has no logos uploaded
Expected Behavior:
- Show placeholder in logo position
- Prompt: "Add your logo for branded posters"
- Link to logo management page

Scenario: Session expires during generation
Expected Behavior:
- Save generation progress server-side
- On re-login, show option to resume or restart
- Don't charge credits twice
```

---

## Section 8: Business Rules

### What to Write
Logic that governs how the system behaves, written as IF-THEN statements.

### Format
"IF [condition] THEN [action/result]"

### Guidelines
- Be explicit about conditions
- Cover all branches (if/else)
- Group related rules together

### Example
```
## Credit Rules
- IF user.credits < generation.cost THEN disable Generate button AND show upgrade prompt
- IF user.credits >= generation.cost THEN deduct credits on generation start
- IF generation fails THEN refund credits to wallet

## Access Rules
- IF user.role == "viewer" THEN hide Create button AND show "Request Access" instead
- IF user.role == "editor" THEN allow create but not billing access
- IF user.role == "admin" THEN allow all actions including billing and team management

## Generation Rules
- IF organization has logos THEN show logo selector
- IF organization has NO logos THEN show "Add Logo" prompt with skip option
- IF resolution == "4K" THEN charge 2x base credits
- IF resolution == "1K" THEN charge 1x base credits

## Brand Rules
- IF organization has brand colors THEN use them as default palette
- IF organization has NO brand colors THEN use system default colors
- IF brand font is specified THEN pass to AI generation
- IF brand font is NOT specified THEN use "Inter" as default
```

---

## Section 9: Visual Reference

### What to Write
Links or descriptions of visual designs, mockups, or competitor references.

### Include
- Figma/design file links
- Screenshots of similar features
- Competitor examples
- Mood boards or style references

### Example
```
## Design Files
- Main Flow Mockups: [Figma Link]
- Component Library: [Figma Link]

## Competitor References
- Canva's poster generation: Shows template-first approach
- Adobe Express: Shows AI-enhancement after template selection

## Style References
- Generated posters should match quality level of: [Example Image Link]
- UI should follow shadcn/ui design patterns
- Theme: Modern, clean, professional

## Key UI Patterns
- Cards for feature selection (theme, style)
- Modal for generation progress
- Grid layout for library view
- Sidebar navigation with icon + text
```

---

## Section 10: UI Text & Labels

### What to Write
Exact copy for buttons, headings, error messages, and UI labels.

### Categories
- Button labels
- Page headings
- Form labels
- Error messages
- Success messages
- Empty states
- Tooltips

### Example
```
## Buttons
- Primary action: "Generate Poster"
- Secondary action: "Save Draft"
- Cancel action: "Cancel"
- Download: "Download PNG" / "Download JPG"

## Page Headings
- Create page: "Create New Poster"
- Library page: "Your Creatives"
- Billing page: "Credits & Billing"

## Form Labels
- Event Name: "Event Name" (placeholder: "Annual Conference 2024")
- Date: "Event Date" (placeholder: "Select date")
- Venue: "Venue" (placeholder: "Convention Center, Hall A")

## Error Messages
- Generation failed: "Something went wrong. We've refunded your credits. Please try again."
- No credits: "You're out of credits. Add more to continue creating."
- Upload failed: "Upload failed. Please check your file and try again."
- Invalid input: "Please fill in all required fields."

## Success Messages
- Generation complete: "Your poster is ready!"
- Save complete: "Saved to your library"
- Credits added: "Credits added successfully"

## Empty States
- No posters: "No posters yet. Create your first one!"
- No logos: "No logos uploaded. Add your brand logo to get started."
- No transactions: "No transactions yet."
```

---

## Section 11: Success Metrics

### What to Write
How to measure if the feature is successful.

### Categories
- Usage metrics (adoption, frequency)
- Performance metrics (speed, reliability)
- Business metrics (revenue, conversion)
- Quality metrics (satisfaction, errors)

### Format
```
Metric: [Name]
Target: [Specific number]
How to Measure: [Method]
```

### Example
```
## Usage Metrics
Metric: Daily Active Generators
Target: 100 unique users generating per day within 3 months
How to Measure: Count distinct user_ids with generations per day

Metric: Generations per User per Month
Target: 5 generations/user/month average
How to Measure: Total generations / unique users per month

## Performance Metrics
Metric: Generation Time
Target: < 30 seconds for 95% of generations
How to Measure: Track time from Generate click to completion

Metric: Generation Success Rate
Target: > 98% success rate
How to Measure: Successful generations / total attempts

## Business Metrics
Metric: Credit Purchase Rate
Target: 20% of users purchase credits within first month
How to Measure: Users who purchased / total new users

Metric: Revenue per User
Target: $10/user/month average
How to Measure: Total revenue / active users

## Quality Metrics
Metric: User Satisfaction
Target: > 4.0/5.0 rating on generated posters
How to Measure: Post-generation rating prompt
```

---

## Section 12: Non-Goals

### What to Write
Explicit statements about what this feature/product will NOT do.

### Why This Matters
- Prevents scope creep
- Sets clear expectations
- Focuses development effort

### Format
"This feature will NOT [excluded capability] because [reason]"

### Example
```
## Non-Goals for V1

- This feature will NOT support video generation because the complexity is too
  high for initial release and AI video is not mature enough

- This feature will NOT allow real-time collaboration because multi-user editing
  requires significant infrastructure that's not justified for V1

- This feature will NOT support custom font uploads because font licensing is
  complex and web-safe fonts cover most use cases

- This feature will NOT integrate with social media posting because that's a
  separate product area that requires different expertise

- This feature will NOT support templates because AI generation replaces the
  need for templates (but may be reconsidered for V2)

## Future Considerations (Not V1)
- Template library
- Animation/motion graphics
- Multi-language generation
- White-label/reseller support
```

---

## Section 13: Technical Context

### What to Write
Technical information that developers need to understand.

### Include
- Existing systems to integrate with
- API requirements and constraints
- Database schema considerations
- Third-party dependencies
- Performance requirements
- Security considerations

### Example
```
## Tech Stack
- Frontend: Next.js 16 (App Router), TypeScript, Tailwind CSS
- Backend: Next.js API routes, Supabase
- Database: PostgreSQL (via Supabase)
- AI: Google Gemini, Ideogram API
- Payments: Razorpay

## Existing Systems
- Authentication: Supabase Auth (email/password, magic link)
- Storage: Supabase Storage for images
- Credits: wallets table tracks balances, transactions table for history

## API Requirements
- Gemini API: Used for photorealistic generations, rate limited to 60/min
- Ideogram API: Used for typography-heavy designs, rate limited to 100/min
- Both APIs require API keys stored in environment variables

## Database Considerations
- All tables have RLS policies - check organization membership
- creatives table stores generation metadata + storage path
- organization_logos table links logos to organizations

## Performance Requirements
- API response time: < 200ms for non-generation endpoints
- Generation time: < 60 seconds total
- Image load time: < 2 seconds with CDN

## Security Considerations
- API keys must never be exposed to client
- All database queries must respect RLS
- File uploads must be scanned for malware
- Credit operations must be atomic (no double-spend)
```

---

## Section 14: Timeline

### What to Write
Phases and milestones for development (if applicable).

### Format
```
Phase [N]: [Name] - [Duration]
- Deliverable 1
- Deliverable 2
```

### Example
```
## Phase 1: Core Generation (Week 1-2)
- Basic generation flow
- Theme and style selection
- Single resolution output
- Save to library

## Phase 2: Brand Integration (Week 3)
- Logo management
- Logo positioning
- Brand color defaults
- Organization settings

## Phase 3: Credits & Billing (Week 4)
- Wallet system
- Credit deduction
- Razorpay integration
- Transaction history

## Phase 4: Polish & Launch (Week 5)
- Error handling
- Loading states
- Mobile responsiveness
- Analytics integration

## Milestones
- Alpha: End of Week 2 (internal testing)
- Beta: End of Week 4 (limited user testing)
- Launch: End of Week 5 (public availability)
```

---

## Section 15: Open Questions

### What to Write
Known unknowns and pending decisions that need resolution.

### Format
```
Question: [The question]
Context: [Why it matters]
Options: [Possible answers]
Decision Maker: [Who decides]
Deadline: [When we need an answer]
```

### Example
```
Question: Should we support multiple aspect ratios in V1?
Context: Users may want Instagram stories (9:16) vs feed posts (1:1) vs posters (2:3)
Options:
  A) Single ratio (1:1) - simplest to implement
  B) Three preset ratios - moderate complexity
  C) Custom ratios - most flexible but complex
Decision Maker: Product Manager
Deadline: Before development starts

Question: How should we handle generation failures?
Context: AI APIs sometimes fail or return poor quality
Options:
  A) Auto-retry once silently
  B) Show error and refund immediately
  C) Offer regeneration without extra charge
Decision Maker: Engineering Lead
Deadline: Before Phase 1 complete

Question: Should free tier include watermarks?
Context: Balancing free usage with monetization
Options:
  A) No watermark on free tier
  B) Subtle "Made with GenPoster" watermark
  C) Prominent watermark removed on paid plans
Decision Maker: CEO
Deadline: Before launch
```

---

## PRD Output Structure

When generating a PRD, create the following files:

### 1. PRD.md
The complete PRD document with all 15 sections filled in based on codebase analysis.

### 2. features.json
```json
{
  "project_name": "[App Name]",
  "version": "1.0.0",
  "generated_date": "[ISO Date]",
  "features": [
    {
      "id": "F001",
      "name": "Feature Name",
      "priority": "P0",
      "status": "existing",
      "acceptance_criteria": ["Criterion 1", "Criterion 2"],
      "dependencies": [],
      "estimated_complexity": "medium",
      "notes": "Additional context"
    }
  ]
}
```

### 3. progress.txt
```
# [App Name] Development Progress

## Overview
Generated: [Date]
Source: Codebase analysis

## Feature Status Summary
- Existing: X features
- Pending: Y features
- In Progress: Z features

## Detailed Status
[List each feature with checkbox]
```
