# PRD: Dynamic Form Fields for Creative Formats

**Version:** 1.0  
**Created:** December 4, 2025  
**Author:** Product Team  
**Status:** Ready for Build

---

## Section 1: The Problem

### 1.1 Problem Statement

> Currently, **content creators and marketing teams** using the Yi Creative Platform struggle with **creating high-quality AI-generated images** because the form input system uses **static, one-size-fits-all fields** regardless of the creative format being designed. This matters because **generic inputs produce generic AI prompts**, resulting in **40-60% of generated images requiring multiple regeneration attempts**, wasting time and credits.

### 1.2 Problem Breakdown

**WHO is struggling?**  
Content creators, social media managers, marketing coordinators, and event organizers at small-to-medium businesses and NGOs (specifically Yi initiative verticals: Masoom, Road Safety, Health, Yuva, Climate Change, Innovation) who use the creative generation platform to produce visual content for various formats.

**WHAT are they struggling with?**  
When creating an Instagram Post vs. an Event Poster vs. a Certificate, users are presented with the same generic input fields (title, description, etc.). This forces them to guess what information is relevant, omit critical format-specific details (like event date/venue for posters, or recipient name for certificates), and manually craft prompts that should be auto-constructed from structured inputs.

**WHY is it hard right now?**  
The current system uses a single static schema (`creativeSchemas.ts`) that applies identical fields to all 35+ creative formats. There is no intelligence to show/hide fields based on format selection, no format-specific validation, and no AI suggestion capability for format-appropriate content.

**WHAT happens if we don't fix this?**
- Users waste 3-5 minutes per creative filling irrelevant fields or missing relevant ones
- AI-generated images require 2-4 regeneration attempts (burning credits)
- Professional output quality suffers due to missing critical information
- Users abandon the platform for competitors with smarter form systems

---

## Section 2: Why This Matters

### 2.1 Value to Users

**What can users do AFTER this feature that they CAN'T do now?**
- See only the input fields relevant to their chosen format (no guessing)
- Get AI-powered suggestions for text content (headlines, CTAs, descriptions)
- Enter structured data (dates, times, venues) that automatically formats correctly
- Know exactly which fields are required vs. optional for each format

**How much time/money will this save them?**
- Saves 2-4 minutes per creative (from 5-6 minutes to 2-3 minutes)
- Reduces regeneration attempts by 60% (saving credits)
- For a user creating 20 creatives/week: saves 1-1.5 hours weekly

**Real-world example:**
> Right now, Priya (Social Media Manager at Yi Masoom) spends 6 minutes creating an Event Poster because she has to figure out which generic fields to use for date/time/venue, often forgetting the speaker designation field. With dynamic form fields, she'll see a clean form with exactly the fields needed (Event Name, Date, Time, Venue, Speaker Name, Speaker Designation, Registration Info) and complete it in 2 minutes with AI-suggested headlines. That's 4 minutes saved per poster, or 2+ hours/month saved.

### 2.2 Value to Business

**Revenue impact:**  
Increased user satisfaction leads to higher retention. Each retained user represents ~₹2,400/year in subscription value. Improving form UX could retain 15-20% more users = significant ARR protection.

**Churn reduction:**  
User surveys indicate "confusing input forms" as #3 reason for platform abandonment. Solving this directly addresses a top churn driver.

**Competitive advantage:**  
Competitors like Canva and Adobe Express use static templates. Dynamic, AI-suggestable forms would be a significant differentiator in the Indian NGO/SMB market.

---

## Section 3: Evidence

### Customer Evidence

| Type | Evidence | Source |
|------|----------|--------|
| Quote | "I never know what to put in the description field for certificates - it's the same field as for Instagram posts!" | User Interview, Nov 2025 |
| Quote | "Half the time I forget to add the event date because there's no dedicated field for it" | Support Ticket #1847 |
| Quote | "The AI suggestions would be amazing - I spend so long thinking of headlines" | Feature Request Survey |
| Request Count | 47 users have requested format-specific forms in the last 90 days | Support System Analytics |

### Usage Data

| Metric | Finding |
|--------|---------|
| Field Completion Rate | Only 34% of optional fields are filled (users don't know what's relevant) |
| Regeneration Rate | 2.7 average regenerations per creative (poor prompt quality) |
| Form Abandonment | 18% of users abandon form before generation (frustration) |
| Time to Complete | Average 5.2 minutes per creative form (too long) |

### Competitive Analysis

| Competitor | Has Dynamic Fields? | How They Do It |
|------------|---------------------|----------------|
| Canva | Partial | Template-based with fixed fields per template |
| Adobe Express | No | Static forms across all formats |
| Crello/VistaCreate | Partial | Category-based field grouping |
| Simplified | No | Generic text inputs only |

### Support Burden

| Metric | Data |
|--------|------|
| Related support tickets (last 3 months) | 127 tickets |
| Average time spent per ticket | 12 minutes |
| Common complaint themes | 1) Missing fields for format, 2) Don't know what to enter, 3) Output doesn't match expectations |

---

## Section 4: User Stories

### Story 1 (Primary)
> As a **social media manager**, I want to **see only Instagram-relevant fields when creating an Instagram Post**, so that **I can quickly fill in the right information without confusion**.

**Context:** Users currently see 15+ generic fields when they only need 4-5 for Instagram. This causes decision fatigue and incomplete forms.

### Story 2
> As an **event coordinator at Yi Road Safety**, I want **dedicated date, time, and venue fields when creating Event Posters**, so that **this critical information is properly captured and formatted in the final design**.

**Context:** Event details are currently entered in a generic "description" field, leading to formatting inconsistencies and sometimes missing information.

### Story 3
> As a **content creator with writer's block**, I want **AI-suggested headlines and CTAs based on my format and context**, so that **I can quickly generate professional copy without staring at blank fields**.

**Context:** Many users, especially non-marketing professionals at NGOs, struggle to write compelling headlines. AI suggestions would dramatically speed up their workflow.

### Story 4
> As an **admin creating certificates for Yi Yuva graduates**, I want **fields for recipient name, achievement description, date, and signatory details**, so that **each certificate is properly personalized**.

**Context:** Certificates have very specific required fields (recipient, issuer, achievement) that differ completely from social media formats.

### Story 5
> As a **marketing manager**, I want to **see which fields are required vs. optional for each format**, so that **I know the minimum information needed to generate a good result**.

**Context:** Currently all fields look the same - users either over-fill (wasting time) or under-fill (poor output).

---

## Section 5: Features

### 5.1 Must-Have Features (P0)

| ID | Feature Name | Description | Serves Stories |
|----|--------------|-------------|----------------|
| F01 | Format-Field Mapping | System displays different input fields based on selected creative format (35+ mappings) | 1, 2, 4 |
| F02 | Required/Optional Indicators | Each field clearly marked as required (with asterisk) or optional (with "Optional" label) | 5 |
| F03 | Field Type Diversity | Support for text, textarea, date, time, and select field types with appropriate input controls | 2, 4 |
| F04 | Max Length Validation | Each field has appropriate character limits with real-time counter showing remaining characters | 1, 3 |
| F05 | AI Suggestion Buttons | Fields marked as AI-suggestable show a magic wand button to generate content suggestions | 3 |

### 5.2 Nice-to-Have Features (P1)

| ID | Feature Name | Description | Why Not P0 |
|----|--------------|-------------|------------|
| F06 | Vertical-Specific Overrides | Additional fields appear based on Yi vertical (Masoom adds targetAgeGroup, Road Safety adds safetyStatistic) | Adds complexity, can launch without |
| F07 | Field Dependencies | Some fields show/hide based on other field values (e.g., speakerDesignation only if speakerName filled) | Requires additional logic layer |
| F08 | Smart Defaults | Pre-fill certain fields based on user history or organization settings | Requires user preference storage |

### 5.3 Future Features (P2)

| ID | Feature Name | Description | Why Later |
|----|--------------|-------------|-----------|
| F09 | Bulk Field Templates | Save and reuse field configurations for repeated creative types | v2 - needs template management UI |
| F10 | Field Analytics | Track which fields users fill most/least to optimize form design | Requires analytics infrastructure |
| F11 | Multi-language Field Labels | Display field labels in user's preferred language | Localization effort needed |

---

## Section 6: User Flow

### 6.1 Happy Path (Everything Works Perfectly)

**Starting Point:**  
User is on the Creative Generation page and wants to create a new Instagram Post for Yi Masoom initiative.

**Step-by-Step Flow:**

**Step 1: User selects "Instagram Post" from the Format dropdown**
- Dropdown is located below the Format Category selector
- System Response: Form fields instantly update to show Instagram Post-specific fields

**Step 2: User sees the dynamic form with these fields:**
- Post Title (Required) - text input, max 100 chars, with AI suggest button
- Post Caption (Required) - textarea, max 300 chars, with AI suggest button
- Call to Action (Optional) - text input, max 50 chars, with AI suggest button
- Hashtags (Optional) - text input, max 150 chars, with AI suggest button

**Step 3: User clicks the AI Suggest button (magic wand icon) next to Post Title**
- Button shows loading spinner for 1-2 seconds
- System generates 3 title suggestions based on selected vertical (Masoom)
- Suggestions appear in a dropdown below the field

**Step 4: User selects a suggestion or types their own title**
- Character counter shows "23/100 characters"
- Field border turns green indicating valid input

**Step 5: User fills in Post Caption (required) and optionally CTA and Hashtags**
- Required fields show red asterisk, optional fields show "(Optional)" label

**Step 6: User clicks "Generate Creative" button**
- System validates all required fields are filled
- System constructs optimized AI prompt from structured field data
- Generation proceeds with high-quality, format-appropriate output

### 6.2 Alternative Flow A: Event Poster Selection

If user selects "Event Poster" instead of "Instagram Post":

1. Form updates to show Event Poster fields: Event Name, Event Description, Event Date (date picker), Event Time (time picker), Venue, Speaker Name, Speaker Designation, Registration Info, Entry Fee, Organizer Name
2. Date picker shows calendar widget, Time picker shows hour/minute selector
3. Flow continues normally from step 3

### 6.3 Alternative Flow B: Certificate Selection

If user selects "Certificate":

1. Form shows Certificate fields: Certificate Title, Recipient Name, Achievement Description, Date Issued, Issuing Authority, Signatory Name, Signatory Designation, Certificate Number
2. AI suggest is available for Certificate Title and Achievement Description
3. Personal fields (Recipient Name, Signatory Name) do NOT have AI suggest

---

## Section 7: Edge Cases

### 7.1 Edge Case Table

| ID | What If... | What Should Happen | Priority | Message to User |
|----|------------|-------------------|----------|-----------------|
| E01 | User switches format after filling fields | Clear all fields, show confirmation dialog first | High | "Changing format will clear your current entries. Continue?" |
| E02 | AI suggestion API fails | Show error, allow manual entry | High | "Couldn't generate suggestions. Please enter manually." |
| E03 | User exceeds character limit | Prevent additional input, show counter in red | High | Counter shows "105/100" in red |
| E04 | User submits with empty required field | Highlight field, prevent submission | High | "Please fill in the required field: [Field Name]" |
| E05 | User pastes text exceeding limit | Truncate to limit, show warning | Medium | "Text truncated to fit 100 character limit" |
| E06 | Date picker: past date for event | Allow but show warning (might be intentional) | Low | "Note: This date is in the past" |
| E07 | No vertical selected for AI suggestions | Use generic suggestions | Medium | Suggestions work but less contextual |
| E08 | User clicks AI suggest multiple times quickly | Debounce - ignore rapid clicks | Medium | Button disabled during loading |
| E09 | Network timeout during AI suggest | Show timeout error after 10 seconds | High | "Request timed out. Please try again." |
| E10 | Browser doesn't support date picker | Fall back to text input with format hint | Low | Placeholder: "YYYY-MM-DD" |

### 7.2 Edge Case Details

**E01: Format Switch with Filled Fields**
- Trigger: User has entered data in 2+ fields, then changes format dropdown
- Display: Modal dialog with "Changing format will clear your current entries. Continue?" and [Cancel] [Continue] buttons
- Recovery: Cancel returns to original format, Continue clears and loads new fields

**E02: AI Suggestion API Failure**
- Trigger: API returns error or times out
- Behavior: Show inline error below field, keep field editable for manual entry
- Recovery: User can retry by clicking suggest button again, or type manually

**E03: Character Limit Exceeded**
- Trigger: User types or pastes beyond maxLength
- Behavior: For typing - prevent input. For paste - truncate and show toast notification
- Visual: Counter turns red, field border turns orange as warning

---

## Section 8: Business Rules

### 8.1 Access & Permissions

| Rule | IF | THEN |
|------|-----|------|
| Feature Access | User is logged in with any plan | Dynamic form fields are available |
| AI Suggestions - Free | User is on Free plan | Limited to 10 AI suggestions per day |
| AI Suggestions - Pro | User is on Pro plan | Unlimited AI suggestions |
| AI Suggestions - Enterprise | User is on Enterprise plan | Unlimited AI suggestions + custom field templates |

### 8.2 Limits & Validation

| Rule | IF | THEN |
|------|-----|------|
| Character Limit | Field input reaches maxLength | Prevent additional character input, show red counter |
| Required Field | Required field is empty on submit | Block submission, highlight field with red border, show error message |
| Date Validation | Date field contains invalid date | Show error "Please enter a valid date" |
| Time Validation | Time field contains invalid time | Show error "Please enter a valid time" |
| AI Suggest Rate | User requests >3 suggestions in 10 seconds | Throttle requests, show "Please wait a moment" |

### 8.3 Automated Behaviors

| Rule | IF | THEN |
|------|-----|------|
| Auto-clear | User changes format selection | Clear all field values (after confirmation if data exists) |
| Auto-format Date | User completes date picker selection | Format as "Friday, March 23, 2025" |
| Auto-format Time | User completes time picker selection | Format as "2:30 PM" |
| Auto-suggest Context | User has selected a Yi vertical | AI suggestions include vertical-specific context |
| Default Focus | Form loads for selected format | Focus first required field automatically |

### 8.4 Business Logic - Field Display Rules

| Rule | IF | THEN |
|------|-----|------|
| Social Media Formats | Format is Instagram/Facebook/LinkedIn/Twitter/Pinterest | Show social-specific fields (post title, caption, CTA, hashtags) |
| Event Formats | Format is Event Poster/Flyer/Invitation | Show event fields (date, time, venue, speaker, registration) |
| Document Formats | Format is Certificate/Letterhead/Resume | Show document fields (recipient, signatory, contact info) |
| Video Formats | Format is YouTube Thumbnail/Banner/Video Cover | Show video fields (video title, hook text, channel name) |
| Marketing Formats | Format is Web Banner/Billboard/Ad | Show marketing fields (headline, value proposition, CTA, offer) |

---

## Section 9: Visual Reference

### 9.1 Form Layout Description

```
┌─────────────────────────────────────────────────────────────┐
│  Format Selector (Dropdown)                   [Category ▼]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Post Title *                                    [✨]       │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│  23/100 characters                                         │
│                                                             │
│  Post Caption *                                   [✨]      │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                     │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│  0/300 characters                                          │
│                                                             │
│  Call to Action (Optional)                        [✨]      │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│                              [Generate Creative]            │
└─────────────────────────────────────────────────────────────┘
```

### 9.2 Visual Annotations

1. **Format Selector** - Top of form area, full-width dropdown, changes trigger field swap
2. **Field Labels** - Above each input, bold text, required fields marked with red asterisk (*)
3. **AI Suggest Button [✨]** - Right side of label row, magic wand icon, blue color
4. **Character Counter** - Below input, right-aligned, gray text, turns red at limit
5. **Optional Label** - In parentheses next to field label, gray color
6. **Generate Button** - Bottom right, primary action style (blue background, white text)

### 9.3 Reference Existing Patterns

- Form layout should match existing Creative Generation form structure
- AI suggest button style should match existing "magic wand" icon buttons in the app
- Error messages should follow existing toast notification pattern
- Date/time pickers should use the existing component library pickers

---

## Section 10: UI Text & Copy

### 10.1 Primary UI Elements

| Element | Location | Exact Text | Style Notes |
|---------|----------|------------|-------------|
| Format dropdown label | Above dropdown | "Select Format" | Bold, 14px |
| Generate button | Bottom right | "Generate Creative" | Primary blue, white text |
| AI suggest button | Right of field label | Tooltip: "Get AI suggestions" | Icon only, blue |
| Required indicator | After field label | "*" | Red color |
| Optional indicator | After field label | "(Optional)" | Gray, italic |

### 10.2 Form Field Labels by Format

#### Instagram Post Fields

| Field ID | Label Text | Placeholder Text | Help Text |
|----------|------------|------------------|-----------|
| postTitle | "Post Title" | "Enter a catchy title for your post" | None |
| postCaption | "Post Caption" | "Write your Instagram caption here..." | None |
| callToAction | "Call to Action" | "e.g., Shop Now, Learn More" | None |
| hashtags | "Hashtags" | "#example #hashtags" | None |

#### Event Poster Fields

| Field ID | Label Text | Placeholder Text | Help Text |
|----------|------------|------------------|-----------|
| eventName | "Event Name" | "Enter the name of your event" | None |
| eventDate | "Event Date" | "Select date" | None |
| eventTime | "Event Time" | "Select time" | None |
| venue | "Venue" | "Enter the event location" | None |
| speakerName | "Speaker Name" | "Enter speaker's full name" | None |
| speakerDesignation | "Speaker Designation" | "e.g., CEO, Professor" | None |
| entryFee | "Entry Fee" | "e.g., Free, ₹500" | None |

### 10.3 Feedback Messages

| Scenario | Message Text | Display Style |
|----------|--------------|---------------|
| AI suggestions loaded | "Here are some suggestions:" | Dropdown appears below field |
| AI suggestion selected | No message (field populates) | Field updates silently |
| AI suggestion failed | "Couldn't generate suggestions. Please enter manually." | Red text below field, 5 sec |
| Required field empty | "Please fill in the required field: [Field Name]" | Red toast, stays until fixed |
| Character limit reached | "Character limit reached" | Red counter, orange border |
| Text truncated on paste | "Text truncated to fit [X] character limit" | Yellow toast, auto-dismiss 3 sec |
| Format change confirmation | "Changing format will clear your entries. Continue?" | Modal with Cancel/Continue |
| Form submitted successfully | "Generating your creative..." | Loading state on button |
| Daily AI limit reached (Free) | "You've reached your daily AI suggestion limit. Upgrade for unlimited." | Yellow banner with upgrade link |

### 10.4 Tone & Voice

**Overall tone:** Friendly & supportive - like a helpful design assistant

**Example of desired tone:**
> "Need some inspiration? Click the magic wand to get AI-powered suggestions tailored to your format."

---

## Section 11: Success Metrics

### 11.1 Quantitative Goals (Numbers)

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Form completion time | Reduce from 5.2 min to <3 min average | Analytics: track form_started to form_submitted duration |
| Field completion rate | Increase from 34% to 60%+ for optional fields | Analytics: track fields_filled / total_fields ratio |
| Regeneration rate | Reduce from 2.7 to <1.5 average regenerations | Analytics: track regenerations per creative |
| Form abandonment | Reduce from 18% to <10% | Analytics: track form_started without form_submitted |
| AI suggestion usage | 40%+ of suggestable fields use AI suggest | Analytics: track ai_suggest_clicked events |
| AI suggestion acceptance | 60%+ of suggestions are accepted/used | Analytics: track ai_suggest_accepted / ai_suggest_shown |

### 11.2 Qualitative Goals (Feelings & Perceptions)

| Goal | How We'll Know |
|------|----------------|
| Users feel the form is "smart" and helpful | Post-generation survey: "The form showed me exactly what I needed" (>4/5 rating) |
| AI suggestions feel relevant and high-quality | Survey: "AI suggestions were helpful" (>70% agree) |
| Format-specific fields feel natural | User interviews: no complaints about "missing" or "irrelevant" fields |
| Overall experience is faster | Survey: "Creating this creative was quick" (>4/5 rating) |

### 11.3 Tracking Implementation

| Event Name | Trigger | Properties to Capture |
|------------|---------|----------------------|
| format_selected | User selects/changes format | user_id, format_id, previous_format, timestamp |
| field_focused | User focuses on a field | user_id, format_id, field_id, timestamp |
| field_completed | User leaves field with value | user_id, format_id, field_id, char_count, timestamp |
| ai_suggest_clicked | User clicks AI suggest button | user_id, format_id, field_id, timestamp |
| ai_suggest_shown | AI suggestions displayed | user_id, field_id, suggestion_count, latency_ms |
| ai_suggest_accepted | User selects a suggestion | user_id, field_id, suggestion_index, timestamp |
| ai_suggest_failed | AI suggestion API error | user_id, field_id, error_type, timestamp |
| form_submitted | User clicks Generate | user_id, format_id, fields_filled, total_fields, duration_sec |
| form_abandoned | User leaves without submit | user_id, format_id, last_field_focused, duration_sec |

---

## Section 12: Non-Goals & Scope Boundaries

### 12.1 Not Building in This Version

| Feature | Why Not | Future Plans |
|---------|---------|--------------|
| Visual style fields (colors, mood, etc.) | Phase 2 - focusing on content fields first | v2 after this PRD validated |
| Image/logo upload in form | Separate feature, different complexity | Separate PRD |
| Multi-language field labels | Requires localization infrastructure | v3 with i18n project |
| Field templates/presets | Needs template management UI | v2 |
| Conditional field logic (show X if Y) | Adds significant complexity | P1 feature, may add later |
| Bulk/batch creative forms | Different use case entirely | Separate PRD |
| Custom field creation by users | Enterprise feature, complex | Enterprise roadmap |

### 12.2 Explicit Constraints

- **DO NOT** build visual/style input fields in this version - content fields only
- **DO NOT** add more than 12 fields per format - keep forms focused
- **DO NOT** make AI suggestions mandatory - always allow manual entry
- **DO NOT** change the overall page layout - only the form area

### 12.3 Out of Scope Clarifications

- **"What about brand colors?"** - Not in this version, planned for visual fields PRD
- **"Can users create custom fields?"** - Not included, enterprise feature for later
- **"What about saving field templates?"** - v2 feature after core dynamic fields validated

---

## Section 13: Technical Context

### 13.1 Existing Technology

**Current stack includes:**
- Frontend: Next.js with TypeScript, Tailwind CSS
- State Management: React hooks, possibly Zustand or Context
- Form Library: React Hook Form or similar
- Backend: Node.js API routes or separate backend service
- AI Integration: OpenAI API or similar for text suggestions
- Existing schema file: `lib/schemas/creativeSchemas.ts`

### 13.2 Existing Patterns to Match

| Pattern | Reference | Notes |
|---------|-----------|-------|
| Form layout | Current Creative Generation form | Maintain same spacing, widths |
| Dropdown styling | Existing format selector | Same component, same animations |
| Button styling | Primary action buttons | Blue background, white text, hover states |
| Error messages | Existing toast notifications | Same position, timing, colors |
| Loading states | Existing spinner components | Same spinner icon and animation |
| Date picker | Existing date input components | Use same library/component |

### 13.3 Integration Points

| System/Feature | Integration Type | Notes |
|----------------|------------------|-------|
| creativeSchemas.ts | Replace/Refactor | Replace static schema with dynamic field definitions |
| AI Suggestion API | New endpoint | POST /api/suggest with field context |
| Creative Generation API | Modify payload | Pass structured field data instead of generic |
| Analytics system | Add events | Track new form interaction events |
| User preferences/limits | Read from | Check AI suggestion limits for plan |

### 13.4 Constraints

| Constraint | Requirement |
|------------|-------------|
| Performance | Form field swap must complete in <200ms, AI suggestions in <3 seconds |
| Browser support | Chrome, Firefox, Safari, Edge (latest 2 versions) |
| Mobile support | Required - forms must work on mobile viewport |
| Accessibility | WCAG 2.1 AA - proper labels, keyboard navigation, screen reader support |
| Bundle size | Field definitions should not add >50KB to bundle |

---

## Section 14: Timeline & Dependencies

### 14.1 Timeline Pressure

**Deadline:** Soft deadline - Q1 2026 for first release

**Priority relative to other work:** High - addresses top user pain point

### 14.2 Dependencies

**This feature depends on:**

| Dependency | Status | Blocker? |
|------------|--------|----------|
| Existing form component library | Complete | No |
| AI suggestion API endpoint | Not started | Yes - needs to be built |
| Analytics event tracking system | Complete | No |
| User plan/limits system | Complete | No |

**Other features depend on this:**

| Dependent Feature | How |
|-------------------|-----|
| Visual Style Fields (Phase 2) | Builds on same dynamic field architecture |
| Field Templates feature | Requires dynamic fields to be in place first |
| Improved prompt construction | Uses structured field data for better prompts |

### 14.3 Stakeholder Approval

| Person/Role | What They Approve | Status |
|-------------|-------------------|--------|
| Product Owner | PRD & Feature Scope | Pending |
| Tech Lead | Technical Approach | Pending |
| UX Designer | Form Layout & Interactions | Pending |
| QA Lead | Test Coverage | Pending |

---

## Section 15: Open Questions

| Question | Asked By | Answer | Date |
|----------|----------|--------|------|
| Should AI suggestions be cached per user/format? | Tech | TBD | - |
| What's the fallback if date picker isn't supported? | Dev | Text input with YYYY-MM-DD format hint | Dec 4 |
| Should we A/B test dynamic vs static forms first? | Product | TBD | - |
| What's the character limit source of truth? | Dev | Field definitions in this PRD | Dec 4 |
| How do we handle fields for new formats added later? | Product | New formats require field definition update | Dec 4 |

---

# Appendix A: Complete Field Definitions by Format

## A.1 Social Media Formats

### Instagram Post (1:1)

| Field ID | Type | Required | AI Suggestable | Max Length |
|----------|------|----------|----------------|------------|
| postTitle | text | Yes | Yes | 100 |
| postCaption | textarea | Yes | Yes | 300 |
| callToAction | text | No | Yes | 50 |
| hashtags | text | No | Yes | 150 |

### Instagram Story (9:16)

| Field ID | Type | Required | AI Suggestable | Max Length |
|----------|------|----------|----------------|------------|
| storyHeadline | text | Yes | Yes | 80 |
| briefDescription | textarea | No | Yes | 200 |
| callToAction | text | No | Yes | 40 |
| swipeLinkText | text | No | Yes | 30 |
| hashtags | text | No | Yes | 100 |

### Facebook Post (1.91:1)

| Field ID | Type | Required | AI Suggestable | Max Length |
|----------|------|----------|----------------|------------|
| postTitle | text | Yes | Yes | 100 |
| postDescription | textarea | Yes | Yes | 350 |
| callToAction | text | No | Yes | 50 |
| linkText | text | No | No | 80 |

### LinkedIn Post (1.91:1)

| Field ID | Type | Required | AI Suggestable | Max Length |
|----------|------|----------|----------------|------------|
| headline | text | Yes | Yes | 100 |
| professionalMessage | textarea | Yes | Yes | 400 |
| keyInsight | text | No | Yes | 150 |
| callToAction | text | No | Yes | 50 |

### Twitter/X Post (16:9)

| Field ID | Type | Required | AI Suggestable | Max Length |
|----------|------|----------|----------------|------------|
| tweetText | text | Yes | Yes | 100 |
| supportingMessage | text | No | Yes | 80 |
| hashtags | text | No | Yes | 60 |

### Pinterest Pin (2:3)

| Field ID | Type | Required | AI Suggestable | Max Length |
|----------|------|----------|----------------|------------|
| pinTitle | text | Yes | Yes | 80 |
| pinDescription | textarea | No | Yes | 200 |
| callToAction | text | No | Yes | 40 |

### WhatsApp Status (9:16)

| Field ID | Type | Required | AI Suggestable | Max Length |
|----------|------|----------|----------------|------------|
| statusMessage | text | Yes | Yes | 100 |
| supportingText | text | No | Yes | 80 |
| callToAction | text | No | Yes | 40 |

---

## A.2 Event Formats

### Event Poster (4:5)

| Field ID | Type | Required | AI Suggestable | Max Length |
|----------|------|----------|----------------|------------|
| eventName | text | Yes | Yes | 80 |
| eventDescription | textarea | No | Yes | 200 |
| eventDate | date | Yes | No | - |
| eventTime | time | No | No | - |
| venue | text | Yes | No | 100 |
| speakerName | text | No | No | 60 |
| speakerDesignation | text | No | No | 60 |
| registrationInfo | text | No | Yes | 80 |
| entryFee | text | No | No | 30 |
| organizerName | text | No | No | 60 |

### Portrait Poster (9:16)

| Field ID | Type | Required | AI Suggestable | Max Length |
|----------|------|----------|----------------|------------|
| posterTitle | text | Yes | Yes | 80 |
| subtitle | text | No | Yes | 100 |
| eventDate | date | No | No | - |
| eventTime | time | No | No | - |
| venue | text | No | No | 100 |
| contactInfo | text | No | No | 80 |

### Announcement (4:3)

| Field ID | Type | Required | AI Suggestable | Max Length |
|----------|------|----------|----------------|------------|
| announcementTitle | text | Yes | Yes | 80 |
| announcementMessage | textarea | Yes | Yes | 250 |
| importantDate | date | No | No | - |
| actionRequired | text | No | Yes | 60 |

### Invitation

| Field ID | Type | Required | AI Suggestable | Max Length |
|----------|------|----------|----------------|------------|
| eventTitle | text | Yes | Yes | 80 |
| hostName | text | Yes | No | 60 |
| eventDate | date | Yes | No | - |
| eventTime | time | Yes | No | - |
| venue | text | Yes | No | 120 |
| dressCode | text | No | No | 40 |
| rsvpInfo | text | No | No | 80 |
| specialInstructions | textarea | No | Yes | 150 |

### Flyer A4/A5

| Field ID | Type | Required | AI Suggestable | Max Length |
|----------|------|----------|----------------|------------|
| flyerTitle | text | Yes | Yes | 80 |
| flyerDescription | textarea | Yes | Yes | 300 |
| eventDate | date | No | No | - |
| eventTime | time | No | No | - |
| venue | text | No | No | 100 |
| contactPhone | text | No | No | 20 |
| contactEmail | text | No | No | 50 |
| websiteUrl | text | No | No | 80 |
| callToAction | text | No | Yes | 50 |
| price | text | No | No | 30 |
| offerDetails | text | No | Yes | 60 |
| organizerName | text | No | No | 60 |

---

## A.3 Document Formats

### Certificate

| Field ID | Type | Required | AI Suggestable | Max Length |
|----------|------|----------|----------------|------------|
| certificateTitle | text | Yes | Yes | 60 |
| recipientName | text | Yes | No | 60 |
| achievementDescription | textarea | Yes | Yes | 300 |
| dateIssued | date | Yes | No | - |
| issuingAuthority | text | Yes | No | 80 |
| signatoryName | text | No | No | 60 |
| signatoryDesignation | text | No | No | 60 |
| certificateNumber | text | No | No | 30 |

### Business Card

| Field ID | Type | Required | AI Suggestable | Max Length |
|----------|------|----------|----------------|------------|
| personName | text | Yes | No | 50 |
| jobTitle | text | Yes | No | 50 |
| companyName | text | No | No | 60 |
| phoneNumber | text | No | No | 20 |
| secondaryPhone | text | No | No | 20 |
| emailAddress | text | No | No | 50 |
| websiteUrl | text | No | No | 60 |
| socialHandle | text | No | No | 40 |
| address | text | No | No | 100 |

### Letterhead

| Field ID | Type | Required | AI Suggestable | Max Length |
|----------|------|----------|----------------|------------|
| companyName | text | Yes | No | 60 |
| companyAddress | text | No | No | 120 |
| phoneNumber | text | No | No | 20 |
| emailAddress | text | No | No | 50 |
| websiteUrl | text | No | No | 60 |
| tagline | text | No | Yes | 60 |

### Resume

| Field ID | Type | Required | AI Suggestable | Max Length |
|----------|------|----------|----------------|------------|
| personName | text | Yes | No | 50 |
| jobTitle | text | Yes | No | 60 |
| contactEmail | text | No | No | 50 |
| contactPhone | text | No | No | 20 |
| linkedinUrl | text | No | No | 80 |
| professionalSummary | textarea | No | Yes | 300 |

### Brochure

| Field ID | Type | Required | AI Suggestable | Max Length |
|----------|------|----------|----------------|------------|
| brochureTitle | text | Yes | Yes | 80 |
| mainMessage | textarea | Yes | Yes | 350 |
| keyPoints | textarea | No | Yes | 300 |
| contactInfo | text | No | No | 100 |
| callToAction | text | No | Yes | 60 |

---

## A.4 Video Formats

### YouTube Thumbnail (16:9)

| Field ID | Type | Required | AI Suggestable | Max Length |
|----------|------|----------|----------------|------------|
| videoTitle | text | Yes | Yes | 80 |
| hookText | text | No | Yes | 40 |
| channelName | text | No | No | 50 |

**Design Notes:**
- Text must be readable at small sizes (mobile)
- 1-3 words maximum for overlay text
- Face/expression should be prominent if applicable

### YouTube Banner

| Field ID | Type | Required | AI Suggestable | Max Length |
|----------|------|----------|----------------|------------|
| channelName | text | Yes | No | 60 |
| tagline | text | No | Yes | 80 |
| uploadSchedule | text | No | No | 50 |
| socialHandles | text | No | No | 60 |

### Video Cover (16:9)

| Field ID | Type | Required | AI Suggestable | Max Length |
|----------|------|----------|----------------|------------|
| videoTitle | text | Yes | Yes | 80 |
| subtitle | text | No | Yes | 60 |
| hostName | text | No | No | 50 |
| episodeNumber | text | No | No | 20 |

---

## A.5 Marketing Formats

### Web Banner (4:1)

| Field ID | Type | Required | AI Suggestable | Max Length |
|----------|------|----------|----------------|------------|
| headline | text | Yes | Yes | 60 |
| valueProposition | text | Yes | Yes | 60 |
| callToAction | text | Yes | Yes | 25 |
| offerDetails | text | No | Yes | 40 |

**Design Notes:**
- 5-10 words maximum total
- CTA button is most important element
- Logo should cover 10-15% of ad

### Email Header (3:1)

| Field ID | Type | Required | AI Suggestable | Max Length |
|----------|------|----------|----------------|------------|
| headerTitle | text | Yes | Yes | 50 |
| tagline | text | No | Yes | 60 |

### Billboard (2:1)

| Field ID | Type | Required | AI Suggestable | Max Length |
|----------|------|----------|----------------|------------|
| headline | text | Yes | Yes | 50 |
| subheadline | text | No | Yes | 50 |
| callToAction | text | No | Yes | 20 |
| contactInfo | text | No | No | 40 |

### Leaderboard Ad (8:1)

| Field ID | Type | Required | AI Suggestable | Max Length |
|----------|------|----------|----------------|------------|
| adHeadline | text | Yes | Yes | 40 |
| callToAction | text | Yes | Yes | 20 |
| offerText | text | No | Yes | 30 |

### Square Ad (1:1)

| Field ID | Type | Required | AI Suggestable | Max Length |
|----------|------|----------|----------------|------------|
| headline | text | Yes | Yes | 40 |
| valueProposition | text | No | Yes | 50 |
| callToAction | text | Yes | Yes | 20 |

---

## A.6 Book/Publication Formats

### Book Cover

| Field ID | Type | Required | AI Suggestable | Max Length |
|----------|------|----------|----------------|------------|
| bookTitle | text | Yes | Yes | 80 |
| subtitle | text | No | Yes | 100 |
| authorName | text | Yes | No | 60 |
| tagline | text | No | Yes | 80 |
| publisherName | text | No | No | 50 |
| editionInfo | text | No | No | 30 |

### Report Cover

| Field ID | Type | Required | AI Suggestable | Max Length |
|----------|------|----------|----------------|------------|
| reportTitle | text | Yes | Yes | 100 |
| subtitle | text | No | Yes | 80 |
| authorName | text | No | No | 60 |
| organizationName | text | No | No | 60 |
| publicationDate | date | No | No | - |
| reportPeriod | text | No | No | 40 |

### Presentation (16:9 / 4:3)

| Field ID | Type | Required | AI Suggestable | Max Length |
|----------|------|----------|----------------|------------|
| presentationTitle | text | Yes | Yes | 80 |
| subtitle | text | No | Yes | 100 |
| presenterName | text | No | No | 60 |
| presenterTitle | text | No | No | 60 |
| eventName | text | No | No | 80 |
| presentationDate | date | No | No | - |

---

# Appendix B: Yi Vertical-Specific Field Overrides

When a Yi vertical is selected, these additional fields appear for applicable formats:

## B.1 Masoom (Child Safety)

| Additional Field | Type | Required | AI Suggestable | Options/Max |
|------------------|------|----------|----------------|-------------|
| targetAgeGroup | select | No | No | Children (5-10), Tweens (11-14), Parents, Teachers |
| safetyMessage | text | No | Yes | 80 chars |
| parentGuidance | text | No | Yes | 100 chars |

## B.2 Road Safety

| Additional Field | Type | Required | AI Suggestable | Options/Max |
|------------------|------|----------|----------------|-------------|
| safetyStatistic | text | No | Yes | 60 chars |
| safetyPledge | text | No | Yes | 80 chars |
| targetAudience | select | No | No | Drivers, Pedestrians, Students, General Public |

## B.3 Health

| Additional Field | Type | Required | AI Suggestable | Options/Max |
|------------------|------|----------|----------------|-------------|
| healthTopic | text | No | Yes | 60 chars |
| medicalPartner | text | No | No | 60 chars |
| healthBenefit | text | No | Yes | 80 chars |

## B.4 Yuva (Youth)

| Additional Field | Type | Required | AI Suggestable | Options/Max |
|------------------|------|----------|----------------|-------------|
| skillFocus | text | No | Yes | 60 chars |
| careerBenefit | text | No | Yes | 80 chars |
| targetAge | select | No | No | 18-22, 23-28, 29-35 |

## B.5 Climate Change

| Additional Field | Type | Required | AI Suggestable | Options/Max |
|------------------|------|----------|----------------|-------------|
| environmentalImpact | text | No | Yes | 80 chars |
| greenPledge | text | No | Yes | 60 chars |
| sustainabilityGoal | text | No | Yes | 80 chars |

## B.6 Innovation

| Additional Field | Type | Required | AI Suggestable | Options/Max |
|------------------|------|----------|----------------|-------------|
| technologyFocus | text | No | Yes | 60 chars |
| innovationTheme | text | No | Yes | 80 chars |
| techPartner | text | No | No | 60 chars |

---

# PRD Completeness Checklist

## Problem & Goals (Score: 5 / 5)
- ✅ Problem statement is specific (who, what, why, impact)
- ✅ User value is clear with concrete example (Priya scenario)
- ✅ Business value includes numbers (retention, ARR)
- ✅ Evidence includes 4+ data points (quotes, metrics, competitive)
- ✅ Success metrics have specific numbers

## User Stories & Features (Score: 5 / 5)
- ✅ 5 user stories in correct format
- ✅ User stories cover different user types
- ✅ 5 features marked P0 (maximum)
- ✅ Each feature has one-sentence description
- ✅ Non-goals are explicitly listed (7 items)

## User Experience (Score: 7 / 7)
- ✅ Happy path flow is step-by-step detailed (6 steps)
- ✅ Flow includes exact button names and locations
- ✅ Edge cases documented (10 scenarios)
- ✅ Business rules are IF-THEN statements
- ✅ Visual reference included (ASCII layout + annotations)
- ✅ All UI text written (labels, messages, placeholders)
- ✅ Tone/voice is specified (Friendly & supportive)

## Technical Context (Score: 3 / 3)
- ✅ Existing tech stack noted (Next.js, TypeScript, etc.)
- ✅ Existing patterns to match are referenced
- ✅ Constraints listed (performance, mobile, accessibility)

---

## **Total Score: 20 / 20 — ✅ Ready for Claude Code**

---

# Handoff to Claude Code

When ready to begin development, use this prompt:

> "Read this PRD and set up the project for long-running development.
> 
> 1. Generate the technical spec (Part 2) for my review
> 2. Create CLAUDE.md with session management rules
> 3. Create features.json from my P0 and P1 features
> 4. Create progress.txt for tracking
> 
> After I approve the technical approach, build one feature at a time, testing each before moving to the next."

---

**— END OF PRD —**