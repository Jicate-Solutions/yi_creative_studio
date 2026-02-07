# Yi Connect SSO - Event Data Integration Guide

**For: Yi Creative Development Team**
**From: Yi Connect**
**Date: February 6, 2026**
**Status: Ready for Implementation**

---

## 🎯 Executive Summary

Yi Connect now sends **complete event data** in the SSO token when users click "Create Poster". This eliminates the need to wait for webhook sync and provides instant access to all event details.

**Current Problem:**
- User clicks "Create Poster" → Redirected to Yi Creative
- Yi Creative fetches event from database → **404 Error** (event not synced yet)
- User sees error page instead of pre-populated form

**Solution:**
- Yi Connect sends full event data in JWT token
- Yi Creative reads from token first (instant)
- Falls back to database query if needed

---

## 📋 What Yi Connect Sends

### SSO Token Structure

When user clicks "Create Poster" from Yi Connect Events page, the JWT token includes:

```typescript
{
  // User authentication
  sub: "28d0651f-8fff-434b-bb10-f717d29fa012",
  email: "user@example.com",
  name: "John Doe",

  // Chapter/Organization
  chapters: [{
    chapter_id: "3494f9ec-08c3-44b4-89f2-412ddcb69b3e",
    chapter_name: "Yi DemoChapter",
    chapter_location: "ERODE",
    role: "super_admin",
    hierarchy_level: 7
  }],

  // NEW: Complete Event Data (15+ fields)
  event_data: {
    event_id: "aaaa4d76-7385-425d-88d0-e413c6574813",
    event_name: "Tech Innovation Summit 2026",
    event_date: "2026-03-15",
    event_time: "10:00 AM",
    venue: "Grand Convention Center",
    venue_address: "123 Main Street, Tech Park",
    city: "Bangalore",
    description: "Annual technology summit featuring AI and blockchain innovations",
    tagline: "Innovate. Transform. Lead.",
    banner_image_url: "https://yi-connect.com/events/banner-123.jpg",
    event_type: "summit",
    chapter_id: "3494f9ec-08c3-44b4-89f2-412ddcb69b3e",
    chapter_name: "Yi Bangalore",
    chapter_location: "BANGALORE",
    speakers: [
      {
        name: "Dr. Sarah Johnson",
        title: "Chief AI Officer, TechCorp",
        photo_url: "https://yi-connect.com/speakers/sarah.jpg"
      },
      {
        name: "Raj Kumar",
        title: "Blockchain Evangelist",
        photo_url: "https://yi-connect.com/speakers/raj.jpg"
      }
    ]
  },

  // Backwards compatibility
  event_id: "aaaa4d76-7385-425d-88d0-e413c6574813",
  redirect_to: "/create?eventId=aaaa4d76-7385-425d-88d0-e413c6574813",

  // Token metadata
  iss: "yi-connect",
  aud: "yi-creative",
  iat: 1770362092,
  exp: 1770362392
}
```

### All Available Event Fields

| Field | Type | Required | Example |
|-------|------|----------|---------|
| `event_id` | string (UUID) | ✅ | `"aaaa4d76-7385-425d-88d0-e413c6574813"` |
| `event_name` | string | ✅ | `"Tech Innovation Summit 2026"` |
| `event_date` | string (ISO) | ✅ | `"2026-03-15"` |
| `event_time` | string | ❌ | `"10:00 AM"` |
| `venue` | string | ❌ | `"Grand Convention Center"` |
| `venue_address` | string | ❌ | `"123 Main Street, Tech Park"` |
| `city` | string | ❌ | `"Bangalore"` |
| `description` | string | ❌ | `"Annual technology summit..."` |
| `tagline` | string | ❌ | `"Innovate. Transform. Lead."` |
| `banner_image_url` | string (URL) | ❌ | `"https://..."` |
| `event_type` | string | ❌ | `"summit"`, `"workshop"`, `"networking"` |
| `chapter_id` | string (UUID) | ✅ | `"3494f9ec-08c3-44b4-89f2-412ddcb69b3e"` |
| `chapter_name` | string | ✅ | `"Yi Bangalore"` |
| `chapter_location` | string | ✅ | `"BANGALORE"` |
| `speakers` | array | ❌ | `[{name, title, photo_url}]` |

---

## 🔧 Implementation for Yi Creative

### Step 1: Update SSO Route to Store Event Data

**File:** `app/api/auth/sso/route.ts`

After successful session creation, store event data in session metadata:

```typescript
// After verifyOtp creates session
if (otpData.session && tokenPayload.event_data) {
  // Store event data in user metadata for immediate access
  await supabase.auth.updateUser({
    data: {
      sso_data: {
        event_data: tokenPayload.event_data,
        event_id: tokenPayload.event_id,
        synced_at: new Date().toISOString()
      }
    }
  })
}
```

### Step 2: Update Create Page to Read from SSO Token

**File:** `app/(dashboard)/create/page.tsx`

Implement **waterfall approach** - try token first, fall back to database:

```typescript
import { createClient } from '@/lib/supabase/server'

export default async function CreatePage({
  searchParams
}: {
  searchParams: { eventId?: string }
}) {
  const supabase = await createClient()

  // Get session to access SSO data
  const { data: { session } } = await supabase.auth.getSession()
  const ssoData = session?.user?.user_metadata?.sso_data

  const eventId = searchParams.eventId
  let eventData = null
  let eventSource = 'none'

  if (eventId) {
    // PRIORITY 1: Try SSO token data (INSTANT - no database query!)
    if (ssoData?.event_data?.event_id === eventId) {
      eventData = ssoData.event_data
      eventSource = 'sso_token'
      console.log('[Create Page] Using event data from SSO token (instant)')
    }

    // PRIORITY 2: Fall back to database query
    else {
      console.log('[Create Page] SSO token not available, querying database...')
      const { data, error } = await supabase
        .from('synced_events')
        .select('*')
        .eq('external_id', eventId)
        .single()

      if (data) {
        eventData = {
          event_id: data.external_id,
          event_name: data.event_name,
          event_date: data.event_date,
          event_time: data.event_time,
          venue: data.venue,
          venue_address: data.venue_address,
          city: data.city,
          description: data.description,
          tagline: data.tagline,
          banner_image_url: data.banner_image_url,
          event_type: data.event_type,
          chapter_name: data.chapter_name,
          chapter_location: data.chapter_location,
          speakers: data.speakers
        }
        eventSource = 'database'
      } else if (error) {
        console.log('[Create Page] Event not found in database:', error)
        eventSource = 'error'
      }
    }
  }

  return (
    <CreatePageClient
      eventData={eventData}
      eventSource={eventSource}
    />
  )
}
```

### Step 3: Update Client Component

**File:** `components/canvas-create/CanvasCreatePage.tsx`

Pre-populate form fields from event data:

```typescript
'use client'

import { useEffect } from 'react'

interface EventData {
  event_id: string
  event_name: string
  event_date: string
  event_time?: string
  venue?: string
  // ... other fields
}

export default function CanvasCreatePage({
  eventData,
  eventSource
}: {
  eventData: EventData | null
  eventSource: 'sso_token' | 'database' | 'none' | 'error'
}) {

  useEffect(() => {
    if (eventData) {
      console.log(`[Create Page] Event loaded from: ${eventSource}`)

      // Pre-populate form fields
      setFormData({
        event_title: eventData.event_name,
        event_date: eventData.event_date,
        event_time: eventData.event_time || '',
        venue: eventData.venue || '',
        // ... map other fields
      })

      // Show success toast
      if (eventSource === 'sso_token') {
        toast.success('Event details loaded from Yi Connect')
      }
    } else if (eventSource === 'error') {
      // Show sync message
      toast.warning('Event is syncing from Yi Connect. Try again in a moment.')
    }
  }, [eventData, eventSource])

  // ... rest of component
}
```

---

## 🧪 Testing

### Test Case 1: Fresh Event (SSO Token)

**Steps:**
1. Click "Create Poster" from Yi Connect
2. Should redirect to `/create?eventId=xxx`
3. Page loads instantly with pre-populated data
4. Console shows: `[Create Page] Using event data from SSO token (instant)`

**Expected Result:** ✅ Form pre-populated, no loading delay

---

### Test Case 2: Existing Event (Database)

**Steps:**
1. Manually navigate to `/create?eventId=xxx` (for an already-synced event)
2. SSO token not available
3. Falls back to database query

**Expected Result:** ✅ Form pre-populated from database

---

### Test Case 3: Event Not Yet Synced

**Steps:**
1. Click "Create Poster" immediately after creating event in Yi Connect
2. SSO token expired or cleared
3. Database query returns 404

**Expected Result:** ⚠️ "Event is syncing" message shown

---

## 📊 Benefits

| Scenario | Before | After |
|----------|--------|-------|
| **SSO from Yi Connect** | 404 error (webhook delay) | ✅ Instant (from token) |
| **Direct URL access** | Works if synced | ✅ Still works (database) |
| **User Experience** | Error → Refresh → Works | ✅ Works immediately |
| **API Calls** | Always hits database | ✅ Zero API calls (token) |
| **Reliability** | Depends on webhook timing | ✅ 100% reliable |

---

## 🔍 Debugging

### Check if Event Data Exists in Token

```typescript
// In browser console or server logs
const session = await supabase.auth.getSession()
console.log('SSO Data:', session.data.session?.user.user_metadata?.sso_data)
```

Expected output:
```json
{
  "sso_data": {
    "event_data": {
      "event_id": "...",
      "event_name": "...",
      // ... full event data
    },
    "event_id": "...",
    "synced_at": "2026-02-06T10:30:00Z"
  }
}
```

### Server Logs to Look For

**Success:**
```
[SSO Provisioning] Event data found in token, provisioning event...
[SSO Provisioning] Event created: <uuid>
[Create Page] Using event data from SSO token (instant)
```

**Fallback to Database:**
```
[Create Page] SSO token not available, querying database...
[External Events] Query result: { eventCount: 1 }
```

**Error (Needs Sync):**
```
[Create Page] Event not found in database
[External Events] Query result: { eventCount: 0 }
```

---

## 🚀 Deployment Checklist

- [ ] Update SSO route to store event data in user metadata
- [ ] Update create page to read from SSO token first
- [ ] Update client component to handle pre-populated data
- [ ] Add logging for debugging (`eventSource` tracking)
- [ ] Test with fresh event from Yi Connect
- [ ] Test with existing synced event
- [ ] Deploy to staging
- [ ] Deploy to production
- [ ] Monitor logs for first 24 hours

---

## 📞 Support

If you encounter any issues:

1. **Check Logs:** Look for `[Create Page]` and `[SSO Provisioning]` logs
2. **Verify Token:** Use browser console to check `user_metadata.sso_data`
3. **Contact Yi Connect:** Provide session ID and timestamp for debugging

---

## 📝 TypeScript Types Reference

For TypeScript projects, these types are already defined in Yi Creative:

```typescript
// lib/auth/sso-types.ts

export interface SSOSpeaker {
  name: string
  title?: string
  photo_url?: string
}

export interface SSOEventData {
  event_id: string
  event_name: string
  event_date: string
  event_time?: string
  venue?: string
  venue_address?: string
  city?: string
  description?: string
  tagline?: string
  banner_image_url?: string
  event_type?: string
  chapter_id: string
  chapter_name: string
  chapter_location: string
  speakers?: SSOSpeaker[]
}
```

---

**Document Version:** 1.0
**Last Updated:** February 6, 2026
**Yi Connect Build:** Production Ready ✅
