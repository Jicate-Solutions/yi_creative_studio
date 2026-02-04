# Product Requirements Document (PRD)

# External Event Integration Module

> **Module Name:** External Event Integration
> **Version:** 2.0.0 (Updated after interview)
> **Date:** 2026-01-28
> **Target Application:** Yi CreativeStudio
> **Status:** Approved

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Key Architecture Decisions](#key-architecture-decisions)
3. [The Problem](#section-1-the-problem)
4. [Why This Matters](#section-2-why-this-matters)
5. [Evidence](#section-3-evidence)
6. [User Stories](#section-4-user-stories)
7. [Specific Features](#section-5-specific-features)
8. [User Flow](#section-6-user-flow)
9. [Edge Cases](#section-7-edge-cases)
10. [Business Rules](#section-8-business-rules)
11. [Visual Reference](#section-9-visual-reference)
12. [UI Text & Labels](#section-10-ui-text--labels)
13. [Success Metrics](#section-11-success-metrics)
14. [Non-Goals](#section-12-non-goals)
15. [Technical Context](#section-13-technical-context)
16. [Timeline](#section-14-timeline)
17. [Open Questions](#section-15-open-questions)
18. [Verification Checklist](#verification-checklist)
19. [Data Mapping](#appendix-data-mapping)

---

## Executive Summary

This PRD defines the **External Event Integration** module for Yi CreativeStudio. The module enables automatic synchronization of events from external applications (MyJKKN, Yi Connect, etc.) to Yi Studio, allowing users to quickly create promotional posters with pre-filled event data.

### Key Value Proposition
- **50% reduction** in poster creation time (eliminate manual data entry)
- **Real-time sync** via webhook push from external apps
- **Multi-source support** with unified calendar view
- **Full traceability** linking posters to source events

---

## Key Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Sync Mechanism** | Webhook push from external apps | Real-time updates without polling |
| **Data Storage** | Local copy in Yi Studio's Supabase | Faster reads, enables Realtime subscriptions |
| **Multi-Source Support** | Yes - MyJKKN, Yi Connect, etc. | Dynamic configuration per organization |
| **Calendar View** | Unified with source filter | All events in one view, filterable by source |
| **Form Updates** | Real-time with conflict detection | Auto-update fields, show inline conflicts if user is editing |
| **Access Control** | Yi Studio roles (admin/editor/viewer) | Existing RBAC system |
| **Deleted Events** | Keep posters as-is | No cascading changes to existing creatives |

---

## Section 1: The Problem

Yi chapter event organizers and marketing teams currently manage events in a separate event management application (Next.js + Supabase). When they need to create promotional posters for these events, they must:

1. **Manually copy event details** from the event app to Yi CreativeStudio
2. **Re-enter data** (event name, date, time, venue, speakers) into the poster creation form
3. **Risk data inconsistency** when event details change in the source system
4. **Lose traceability** - no link between generated posters and their source events

### Who experiences this:
- **Yi Chapter Admins** who manage events AND create marketing materials
- **Marketing Teams** who receive event information second-hand and create promotional content

### Current workarounds:
- Copy-paste from event app to Yi Studio (error-prone, time-consuming)
- Export event data to spreadsheet, then manually enter (extra steps)
- Screenshot event details and reference while filling form (inefficient)

### Pain points:
- Duplicate data entry wastes 5-10 minutes per poster
- Event updates require manual re-checking and re-entering
- No way to quickly create posters for multiple upcoming events
- Cannot track which posters were created for which events

---

## Section 2: Why This Matters

### Business Impact:
- Reduces poster creation time by 50% (eliminate data entry step)
- Increases poster generation frequency (easier = more usage)
- Improves data accuracy (single source of truth)
- Enables "Create Poster" call-to-action directly from event management app

### User Impact:
- Event organizers can create posters in <2 minutes instead of 10+ minutes
- Marketing teams see all upcoming events in one view with calendar
- No more "which event was this poster for?" confusion
- Change notifications prevent outdated posters

### Strategic Value:
- Positions Yi CreativeStudio as the integrated creative solution for Yi ecosystem
- Creates stickiness through cross-app integration
- Enables future features: bulk poster generation, event-based templates

---

## Section 3: Evidence

### User Needs (from brainstorming session):
- User confirmed need to fetch events from external app via API
- User wants calendar view for event discovery
- User requires full editing after import (data is starting point)
- User needs tracking of external_event_id in creatives table
- User wants change notifications when source event updates

### Integration Context:
- External app built with Next.js + Supabase (same tech stack)
- API Gateway pattern preferred over direct database access
- Both event organizers and marketing teams are target users

---

## Section 4: User Stories

### Core Stories

| ID | User Story |
|----|------------|
| US-01 | As an **event organizer**, I want to see all my upcoming events in a calendar view so that I can quickly identify which events need promotional materials. |
| US-02 | As a **marketing team member**, I want to click "Create Poster" on any event so that event details are automatically filled into the creation form. |
| US-03 | As a **user**, I want to edit any imported field so that I can customize the poster content beyond the source data. |
| US-04 | As a **user**, I want to be notified when an imported event's details change so that I can update my poster if needed. |
| US-05 | As an **admin**, I want to see which posters were created for which events so that I can track creative output per event. |

### Edge Case Stories

| ID | User Story |
|----|------------|
| US-06 | As a user viewing past events, I want to still be able to create posters so that I can make recap/thank-you materials. |
| US-07 | As a user, I want the system to gracefully handle when the external event app is unavailable so that I can still use Yi Studio normally. |
| US-08 | As a user with multiple organizations, I want to see only events from my current organization so that the list stays relevant. |

---

## Section 5: Specific Features

### P0 (Must Have) - Core Integration

#### F001: Events Page with Calendar View (Multi-Source)
- **Priority:** P0
- **Description:** New top-level page (`/events`) displaying events from multiple external apps in unified calendar format
- **Acceptance Criteria:**
  - [ ] Calendar shows all published events from all configured sources
  - [ ] Events display on their scheduled dates
  - [ ] Clicking a date shows events for that day
  - [ ] Events show name, time, venue preview, and source badge
  - [ ] Calendar navigation (month/week view toggle)
  - [ ] Loading skeleton while fetching events
  - [ ] Source filter dropdown to show events from specific apps (MyJKKN, Yi Connect, All)
  - [ ] Manual refresh button to re-sync events

#### F002: Event Detail Modal
- **Priority:** P0
- **Description:** Modal showing full event details with "Create Poster" action
- **Acceptance Criteria:**
  - [ ] Modal opens when clicking an event
  - [ ] Shows: name, date, time, venue, speakers, description
  - [ ] "Create Poster" button navigates to `/create` with pre-filled data
  - [ ] "Close" button dismisses modal
  - [ ] Keyboard accessible (Escape to close)

#### F003: Form Pre-fill from Event Data
- **Priority:** P0
- **Description:** Create page accepts event data and pre-fills form fields
- **Acceptance Criteria:**
  - [ ] URL parameter `?eventId=xxx` triggers data load
  - [ ] Form fields populate with mapped event data
  - [ ] All fields remain editable after import
  - [ ] Visual indicator shows "Imported from [Event Name]"
  - [ ] User can clear import and start fresh

#### F004: External Event API Integration
- **Priority:** P0
- **Description:** Backend API to fetch events from external app
- **Acceptance Criteria:**
  - [ ] API route `/api/external-events/fetch` proxies to external app
  - [ ] Handles authentication (API key or service role)
  - [ ] Caches responses for 5 minutes to reduce API calls
  - [ ] Returns standardized event format
  - [ ] Handles errors gracefully with meaningful messages

#### F005: Event-Creative Tracking
- **Priority:** P0
- **Description:** Store relationship between external events and generated creatives
- **Acceptance Criteria:**
  - [ ] `creatives` table has `external_event_id` column
  - [ ] `creatives` table has `external_event_source` column
  - [ ] Generation saves external event reference
  - [ ] Gallery can filter by event ID

---

### P1 (Should Have) - Enhanced Experience

#### F006: Event Change Notifications with Inline Conflict
- **Priority:** P1
- **Description:** Alert users when imported event details have changed, with inline conflict detection
- **Acceptance Criteria:**
  - [ ] On create page load, check if source event changed
  - [ ] Show banner: "Event details have changed since import"
  - [ ] Option to "Update fields" or "Keep current"
  - [ ] Track `external_event_imported_at` timestamp
  - [ ] If user is actively editing a field that updates, show inline conflict indicator
  - [ ] Inline conflict shows both values: "Source changed to: [new value]"

#### F007: Navigation Integration
- **Priority:** P1
- **Description:** Add "Events" to main sidebar navigation
- **Acceptance Criteria:**
  - [ ] "Events" appears between "Dashboard" and "Create"
  - [ ] Icon: Calendar icon
  - [ ] Shows notification badge for events needing posters
  - [ ] Respects role-based visibility

#### F008: Deep Link from External App
- **Priority:** P1
- **Description:** External app can link directly to poster creation
- **Acceptance Criteria:**
  - [ ] URL format: `/create?eventId=xxx&source=eventapp.com`
  - [ ] Auto-loads event data on page load
  - [ ] Works for logged-in users
  - [ ] Redirects to login if not authenticated

---

### P2 (Nice to Have) - Future Enhancements

#### F009: Bulk Poster Generation
- **Priority:** P2
- **Description:** Select multiple events and generate posters in batch
- **Acceptance Criteria:**
  - [ ] Multi-select events in calendar view
  - [ ] "Generate All" button creates posters for selected events
  - [ ] Progress indicator for batch generation
  - [ ] Results summary with success/failure counts

#### F010: Event-based Template Suggestions
- **Priority:** P2
- **Description:** Suggest templates based on event type
- **Acceptance Criteria:**
  - [ ] Detect event type (conference, workshop, seminar, etc.)
  - [ ] Show relevant templates for that event type
  - [ ] Allow "Use this template" quick action

---

## Section 6: User Flow

### Flow 1: Primary Flow - Create Poster from Event App (Deep Link)

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. User is in External Event Management App                     │
│    - Sees: Event details page for "Annual Conference 2024"      │
│    - Sees: "Create Poster" button                               │
├─────────────────────────────────────────────────────────────────┤
│ 2. User clicks "Create Poster"                                  │
│    - Action: Opens Yi CreativeStudio in new tab                 │
│    - URL: /create?eventId=evt_123&source=eventapp.yichapter.org │
├─────────────────────────────────────────────────────────────────┤
│ 3. Yi CreativeStudio loads                                      │
│    - If not logged in: Redirect to login, then back with params │
│    - If logged in: Proceed to step 4                            │
├─────────────────────────────────────────────────────────────────┤
│ 4. Create page loads with event data                            │
│    - System: Fetches event from external API using eventId      │
│    - Sees: Form pre-filled with event data                      │
│    - Sees: "Imported from Annual Conference 2024" badge         │
│    - Does: Reviews data, adjusts description, selects theme     │
├─────────────────────────────────────────────────────────────────┤
│ 5. User completes poster creation                               │
│    - Sees: Normal creation flow (design, logos, generate)       │
│    - Does: Generates poster                                     │
├─────────────────────────────────────────────────────────────────┤
│ 6. Poster saved with event reference                            │
│    - System: Saves external_event_id in creatives table         │
│    - Sees: Poster in gallery with event association             │
└─────────────────────────────────────────────────────────────────┘
```

### Flow 2: Browse Events in Yi Studio (Calendar View)

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. User clicks "Events" in Yi Studio sidebar                    │
│    - Sees: Calendar view with events marked on dates            │
│    - Does: Navigates calendar, clicks on a date with events     │
├─────────────────────────────────────────────────────────────────┤
│ 2. User views day's events                                      │
│    - Sees: List of events for selected date                     │
│    - Does: Clicks on "Annual Conference 2024"                   │
├─────────────────────────────────────────────────────────────────┤
│ 3. Event detail modal opens                                     │
│    - Sees: Full event details (name, date, time, venue, etc.)   │
│    - Does: Clicks "Create Poster"                               │
├─────────────────────────────────────────────────────────────────┤
│ 4. Redirected to Create page                                    │
│    - Same as Flow 1, steps 4-6                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Flow 3: Handle Event Changes

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. User previously imported event and saved draft               │
├─────────────────────────────────────────────────────────────────┤
│ 2. Event details changed in external app (venue updated)        │
│    - System: Detects change on next page load                   │
├─────────────────────────────────────────────────────────────────┤
│ 3. User returns to continue editing                             │
│    - Sees: Banner "Event details have changed. Venue updated."  │
│    - Options: "Update venue" | "Keep my version"                │
├─────────────────────────────────────────────────────────────────┤
│ 4. User chooses action                                          │
│    - If Update: Venue field updates to new value                │
│    - If Keep: Banner dismisses, user continues with their data  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Section 7: Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| **External API is unavailable** | Events page shows "Unable to load events. Please try again later." with retry button. Rest of Yi Studio functions normally. User can still create posters manually. |
| **Event has no speakers** | Speaker fields left empty. No error, import continues with available data. User can manually add speakers. |
| **Event date is in the past** | Event still appears in calendar (historical view). "Create Poster" still works (for recap materials). Optional visual indicator that event has passed. |
| **Event is cancelled** | Cancelled events hidden from calendar by default. Toggle to "Show cancelled events" available. Warning shown if trying to create poster for cancelled event. |
| **User has multiple organizations** | Events filtered by current organization. Organization switcher affects events view. Cross-org events not visible. |
| **Very long event name (100+ chars)** | Truncate in calendar view with ellipsis. Full name in modal and form. AI handles long names appropriately. |
| **Conflicting field names** | Mapper handles aliases (name vs title, venue vs location). Unknown fields stored in customFields. No data loss. |

---

## Section 8: Business Rules

### Event Visibility Rules
```
IF event.status == "published" THEN show in calendar
IF event.status == "draft" THEN hide from calendar
IF event.status == "cancelled" THEN hide by default, show with toggle
IF event.organization_id != user.current_organization THEN hide event
```

### Import Rules
```
IF user clicks "Create Poster" THEN navigate to /create?eventId={id}
IF eventId param present THEN fetch and pre-fill event data
IF event fetch fails THEN show error, allow manual entry
IF any field empty THEN leave form field empty (not "N/A")
```

### Change Detection Rules
```
IF creative.external_event_imported_at < event.updated_at THEN show change notification
IF user clicks "Update fields" THEN re-import changed fields only
IF user clicks "Keep current" THEN dismiss notification, do not update
```

### Tracking Rules
```
IF poster generated from imported event THEN save external_event_id
IF poster generated manually THEN external_event_id = NULL
IF filtering gallery by event THEN query WHERE external_event_id = {id}
```

### Caching Rules
```
IF events fetched within last 5 minutes THEN return cached response
IF cache miss THEN fetch from external API and cache
IF external API fails AND cache exists THEN return stale cache with warning
```

---

## Section 9: Visual Reference

### Calendar View Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Events                                         [Month ▼]   │
├─────────────────────────────────────────────────────────────┤
│  ◄  January 2026  ►                                         │
├─────┬─────┬─────┬─────┬─────┬─────┬─────┐                   │
│ Sun │ Mon │ Tue │ Wed │ Thu │ Fri │ Sat │                   │
├─────┼─────┼─────┼─────┼─────┼─────┼─────┤                   │
│     │     │     │  1  │  2  │  3  │  4  │                   │
│     │     │     │     │ ●●  │     │     │  ← 2 events       │
├─────┼─────┼─────┼─────┼─────┼─────┼─────┤                   │
│  5  │  6  │  7  │  8  │  9  │ 10  │ 11  │                   │
│     │ ●   │     │     │     │ ●●● │     │                   │
└─────┴─────┴─────┴─────┴─────┴─────┴─────┘                   │
                                                               │
│ Selected: January 10, 2026                                   │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🎯 Annual Tech Conference                               │ │
│ │ 10:00 AM - 5:00 PM · Convention Center                  │ │
│ │                                         [Create Poster] │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🎤 Leadership Workshop                                  │ │
│ │ 2:00 PM - 4:00 PM · Yi Chapter Office                   │ │
│ │                                         [Create Poster] │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Event Detail Modal

```
┌─────────────────────────────────────────────────────────────┐
│  Annual Tech Conference                              [✕]    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  📅 January 10, 2026                                        │
│  🕐 10:00 AM - 5:00 PM                                      │
│  📍 Convention Center, Hall A                               │
│                                                              │
│  Speakers:                                                   │
│  • Dr. Jane Smith - CEO, TechCorp                           │
│  • Raj Patel - CTO, Innovation Labs                         │
│                                                              │
│  Description:                                                │
│  Join us for the annual technology conference featuring     │
│  keynotes, workshops, and networking opportunities...       │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                              [Cancel]  [Create Poster →]    │
└─────────────────────────────────────────────────────────────┘
```

### Pre-filled Form Indicator

```
┌─────────────────────────────────────────────────────────────┐
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 📥 Imported from "Annual Tech Conference"    [Clear ✕] │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
│ Event Name*                                                  │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Annual Tech Conference                           [📥]   │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
│ Date*                          Time*                         │
│ ┌──────────────────────┐      ┌──────────────────────┐      │
│ │ January 10, 2026 [📥]│      │ 10:00 AM        [📥] │      │
│ └──────────────────────┘      └──────────────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### UI Components to Use
- **Calendar:** Existing `components/ui/calendar.tsx` (react-day-picker)
- **Modal:** shadcn/ui Dialog component
- **Event Cards:** Card component with hover state
- **Badges:** Badge component for import indicator
- **Icons:** Lucide React icons (Calendar, MapPin, Clock, Users)

---

## Section 10: UI Text & Labels

### Navigation
| Element | Text |
|---------|------|
| Sidebar item | "Events" |
| Page title | "Events Calendar" |

### Calendar View
| Element | Text |
|---------|------|
| Month navigation | "◄ [Month Year] ►" |
| Empty state | "No events this month" |
| Loading | "Loading events..." |
| Error | "Unable to load events. [Try Again]" |

### Event Card
| Element | Text |
|---------|------|
| Time format | "10:00 AM - 5:00 PM" |
| Action button | "Create Poster" |

### Event Modal
| Element | Text |
|---------|------|
| Section headers | "Speakers", "Description" |
| Primary action | "Create Poster" |
| Secondary action | "Cancel" |

### Import Indicator
| Element | Text |
|---------|------|
| Banner | "📥 Imported from "[Event Name]"" |
| Clear action | "Clear" or "✕" |
| Field icon tooltip | "Imported from event" |

### Change Notification
| Element | Text |
|---------|------|
| Banner | "Event details have changed since import" |
| Detail | "[Field name] was updated" |
| Actions | "Update fields" \| "Keep my version" |

### Error Messages
| Scenario | Message |
|----------|---------|
| API unavailable | "Unable to connect to event system. Please try again later." |
| Event not found | "This event could not be found. It may have been deleted." |
| Import failed | "Failed to import event data. You can enter details manually." |

### Success Messages
| Scenario | Message |
|----------|---------|
| Import complete | (no message, just pre-filled form) |
| Poster created | "Poster created for [Event Name]" (toast) |

---

## Section 11: Success Metrics

### Usage Metrics
| Metric | Target | Measurement |
|--------|--------|-------------|
| Events page visits/week | 50+ | Page view analytics |
| Posters created from events | 30% of all posters | external_event_id not null |
| Import-to-generate conversion | >70% | Started import → completed generation |

### Performance Metrics
| Metric | Target | Measurement |
|--------|--------|-------------|
| Events page load time | <2 seconds | Time to first event render |
| Event import time | <500ms | Click "Create Poster" to form filled |
| External API response | <1 second | API call duration |

### Quality Metrics
| Metric | Target | Measurement |
|--------|--------|-------------|
| Import accuracy | 100% | All fields map correctly |
| Error rate | <1% | Failed imports / total attempts |
| Change detection accuracy | 100% | Correctly identifies changed events |

---

## Section 12: Non-Goals

**This feature will NOT:**

| Non-Goal | Reason |
|----------|--------|
| Sync posters back to event app | Yi Studio is the creative output, not the event source |
| Auto-generate posters on event creation | User should initiate creation intentionally |
| Provide event management features | No creating/editing events in Yi Studio |
| Replace manual poster creation | Always available as alternative |
| Support real-time collaboration on imported events | Single user workflow |
| Cascade delete posters when events are deleted | Keep existing posters as-is |

### Future Considerations (Not V1):
- External integrations (Eventbrite, Google Calendar)
- Automatic poster generation triggers
- Event-based poster templates
- Bulk poster operations

---

## Section 13: Technical Context

### Tech Stack
- **Frontend:** Next.js 16 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** Next.js API routes
- **Database:** Supabase (PostgreSQL) with Realtime subscriptions
- **State:** Zustand stores
- **Calendar:** react-day-picker (already installed)

### Multi-Source Architecture

Yi Studio stores a **local copy** of events from multiple external apps:
- Events synced via **webhook push** from external apps
- **Supabase Realtime** used for instant UI updates
- Each event tagged with `source_app_id` to track origin

### External Event App Requirements

Each external app (MyJKKN, Yi Connect, etc.) must:

**1. Push events via webhook when created/updated/deleted:**
```
POST https://yi-studio.com/api/webhooks/events
Headers:
  X-Source-App-Id: myjkkn | yi-connect | etc.
  X-Webhook-Secret: [shared secret]
Body: {
  action: "create" | "update" | "delete",
  event: ExternalEvent
}
```

**2. Support initial bulk sync:**
```
GET /api/events/external
  ?organization_id={uuid}
  ?since={ISO timestamp}  # For incremental sync

Response: {
  success: boolean,
  events: ExternalEvent[],
  pagination?: { page, total_pages, total_items }
}
```

### Webhook Code for External Apps

```typescript
// Add this to your external event app (MyJKKN, Yi Connect, etc.)
// File: lib/webhooks/yi-studio-sync.ts

const YI_STUDIO_WEBHOOK_URL = process.env.YI_STUDIO_WEBHOOK_URL
const WEBHOOK_SECRET = process.env.YI_STUDIO_WEBHOOK_SECRET

export async function syncEventToYiStudio(
  action: 'create' | 'update' | 'delete',
  event: Event
) {
  if (!YI_STUDIO_WEBHOOK_URL) return

  await fetch(YI_STUDIO_WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Source-App-Id': 'myjkkn', // or 'yi-connect'
      'X-Webhook-Secret': WEBHOOK_SECRET,
    },
    body: JSON.stringify({ action, event }),
  })
}

// Call from your event CRUD operations:
// await syncEventToYiStudio('create', newEvent)
// await syncEventToYiStudio('update', updatedEvent)
// await syncEventToYiStudio('delete', { id: eventId })
```

### New Database Tables & Columns

**1. Event Sources Configuration Table:**
```sql
CREATE TABLE public.event_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  source_app_id TEXT NOT NULL,  -- 'myjkkn', 'yi-connect', etc.
  source_name TEXT NOT NULL,    -- Display name
  api_base_url TEXT,
  webhook_secret TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(organization_id, source_app_id)
);
```

**2. Synced Events Table (local copy):**
```sql
CREATE TABLE public.synced_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id TEXT NOT NULL,           -- ID from source app
  source_app_id TEXT NOT NULL,         -- 'myjkkn', 'yi-connect'
  organization_id UUID REFERENCES organizations(id),

  -- Event data
  name TEXT NOT NULL,
  date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  venue TEXT,
  venue_address TEXT,
  description TEXT,
  tagline TEXT,
  event_type TEXT,
  speakers JSONB,                      -- Array of speaker objects
  registration_url TEXT,
  entry_fee TEXT,
  target_audience TEXT,
  status TEXT DEFAULT 'published',

  -- Metadata
  source_created_at TIMESTAMPTZ,
  source_updated_at TIMESTAMPTZ,
  synced_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(external_id, source_app_id)
);

-- Enable Realtime for instant UI updates
ALTER PUBLICATION supabase_realtime ADD TABLE synced_events;

-- Index for fast queries
CREATE INDEX idx_synced_events_org ON synced_events(organization_id);
CREATE INDEX idx_synced_events_date ON synced_events(date);
```

**3. Update Creatives Table:**
```sql
ALTER TABLE public.creatives
ADD COLUMN synced_event_id UUID REFERENCES synced_events(id),
ADD COLUMN external_event_id TEXT,     -- Original ID from source
ADD COLUMN external_event_source TEXT; -- Source app ID
```

### New Files to Create

| File | Purpose |
|------|---------|
| `types/external-event.types.ts` | Type definitions (DONE) |
| `lib/services/external-event-mapper.ts` | Field mapping logic |
| `app/api/external-events/fetch/route.ts` | Fetch events from local DB |
| `app/api/webhooks/events/route.ts` | Webhook endpoint for external app push |
| `app/(dashboard)/events/page.tsx` | Events calendar page |
| `components/events/event-calendar.tsx` | Calendar component with source filter |
| `components/events/event-card.tsx` | Event card component with source badge |
| `components/events/event-detail-modal.tsx` | Detail modal |
| `components/events/source-filter.tsx` | Dropdown to filter by source app |
| `components/events/inline-conflict.tsx` | Inline conflict indicator for form fields |
| `hooks/use-external-events.ts` | Events data hook with Realtime subscription |
| `hooks/use-event-sources.ts` | Hook to fetch configured event sources |

### Files to Modify

| File | Changes |
|------|---------|
| `components/layout/sidebar.tsx` | Add Events navigation item |
| `stores/creative-store.ts` | Add externalEventMeta state |
| `app/(dashboard)/create/page.tsx` | Handle eventId query param |
| `lib/config/constants.ts` | Add ROUTES.events |

### API Authentication
- **Recommended:** API key in environment variable (`EXTERNAL_EVENTS_API_KEY`)
- **Alternative:** Supabase service role for same-project access

### Caching Strategy
- Cache events list for 5 minutes (in-memory or Redis)
- Cache key: `events:${organizationId}:${month}`
- Invalidate on: manual refresh, cache TTL expiry

---

## Section 14: Timeline

### Phase 1: Foundation (Core Integration)
- [ ] Create external event types
- [ ] Implement field mapper service
- [ ] Create fetch API endpoint with caching
- [ ] Database migration for tracking columns
- [ ] Update creative-store with external event state

### Phase 2: Events Page
- [ ] Create events page with calendar view
- [ ] Implement event card component
- [ ] Create event detail modal
- [ ] Add events data fetching hook
- [ ] Add "Events" to sidebar navigation

### Phase 3: Import Flow
- [ ] Handle eventId query parameter on create page
- [ ] Pre-fill form with mapped event data
- [ ] Add import indicator UI
- [ ] Save external_event_id on generation

### Phase 4: Polish
- [ ] Change detection and notification
- [ ] Error handling and loading states
- [ ] Deep link support from external app
- [ ] Gallery filtering by event

### Milestones
| Milestone | Completion | Description |
|-----------|------------|-------------|
| **Alpha** | Phase 1 + 2 | Internal testing |
| **Beta** | Phase 3 | User testing |
| **Launch** | Phase 4 | Production ready |

---

## Section 15: Open Questions

### Resolved ✅

| Question | Answer |
|----------|--------|
| **External App API Endpoint** | Event app exposes API endpoint, Yi Studio fetches via proxy. Environment variable: `EXTERNAL_EVENTS_API_URL` |
| **Organization Mapping** | Event app sends event context in deep link URL. User clicks "Create Poster" in Event App → URL includes eventId → Yi Studio fetches that specific event. No org mapping needed. |

### To Be Determined

| Question | Context | Recommendation |
|----------|---------|----------------|
| **Event Types** | What event types exist in the external app? May affect template suggestions. | Fetch event types dynamically from API response |
| **Speaker Photo Handling** | Should we import speaker photos if available? | Import photo URL, let user confirm before download |

---

## Verification Checklist

### Phase 1 Verification
- [ ] Types file compiles without errors (`npm run build`)
- [ ] Mapper service correctly maps all fields
- [ ] Webhook endpoint receives and stores events
- [ ] Database migration runs successfully
- [ ] Supabase Realtime enabled for synced_events table

### Phase 2 Verification
- [ ] Events page loads and displays calendar
- [ ] Source filter shows all configured sources
- [ ] Event cards show source badge
- [ ] Detail modal opens with complete event info
- [ ] "Create Poster" navigates to /create with eventId

### Phase 3 Verification
- [ ] Create page detects eventId query param
- [ ] Form pre-fills with mapped event data
- [ ] Import indicator shows event name
- [ ] Generated poster saves external_event_id

### Phase 4 Verification
- [ ] Change detection shows banner when event updates
- [ ] Inline conflict shows when editing updated field
- [ ] Deep link from external app works
- [ ] Gallery can filter by event

---

## Appendix: Data Mapping

### External Event → Yi Studio Form Fields

| External Field | Yi Studio Field | Notes |
|----------------|-----------------|-------|
| `name` | `eventName` | Required |
| `date` | `date` | ISO format (YYYY-MM-DD) |
| `startTime` | `time` | HH:MM format |
| `endTime` | `endTime` | Optional |
| `venue` | `venue` | Location name |
| `venueAddress` | `venueAddress` | Optional |
| `description` | `description` | May truncate for poster |
| `speakers[0].name` | `speakerName` | Primary speaker |
| `speakers[0].designation` | `speakerDesignation` | Primary speaker title |
| `speakers[]` | `speakers` | Full array for multi-speaker |
| `organizerName` | `organizationName` | Optional |
| `eventType` | `eventType` | For template matching |
| `registrationUrl` | `registrationInfo` | Optional |
| `entryFee` | `entryFee` | Optional |
| `targetAudience` | `targetAudience` | Optional |

---

## Approval

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Product Owner | | | |
| Tech Lead | | | |
| Design Lead | | | |

---

*Document generated by Claude Code using the PRD Generator skill*
*Version 2.0.0 - Updated with interview findings*
