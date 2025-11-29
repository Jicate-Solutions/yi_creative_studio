---
name: event-poster-ultra
description: >
  Comprehensive skill for testing, debugging, and generating ultra-quality event posters in CreativeStudio. 
  This skill should be used when: (1) testing event poster form fields to verify values are passed correctly 
  (not field names), (2) debugging form data issues where wrong values are sent to API, (3) creating 
  high-quality "ultra" event posters with optimized settings, (4) validating the entire poster generation 
  pipeline from form to API to image output. Automatically triggers when user mentions "test poster form", 
  "debug poster", "form not working", "wrong values", "field name instead of value", "ultra poster", 
  "best poster settings", or "poster quality issues".
---

# Event Poster Ultra Skill

This skill provides comprehensive testing, debugging, and optimization workflows for the CreativeStudio event poster generation system.

## When to Use

1. **Form Field Testing** - Validate all form fields pass correct values
2. **Debug Data Issues** - Find where field names are sent instead of values
3. **Ultra Poster Generation** - Create highest quality posters with optimized settings
4. **Pipeline Validation** - Test entire flow from form to API to generated image

## Quick Diagnostics

### Common Issues This Skill Detects

| Issue | Symptom | Cause |
|-------|---------|-------|
| Field name as value | API receives "eventType" instead of "conference" | Select component missing `value` prop |
| Empty required fields | Generation fails silently | Form validation bypassed |
| Wrong aspect ratio | Image cropped incorrectly | Dimension mismatch |
| Missing theme/style | Bland output | Defaults not applied |
| Logo not appearing | No logo on poster | `auto_insert_logo` disabled |

## Form Field Reference

### Core Fields (Required)

| Field | Type | Valid Values | Common Bug |
|-------|------|--------------|------------|
| `eventName` | text | Any string | Empty string passed |
| `eventType` | select | See EVENT_TYPE_CATEGORIES | Field name instead of value |
| `date` | date | YYYY-MM-DD format | Invalid date format |
| `time` | time | HH:MM format | Missing leading zeros |

### Optional Fields

| Field | Type | Valid Values | Default |
|-------|------|--------------|---------|
| `venue` | text | Any string | "" |
| `hall` | text | Any string | "" |
| `guestName` | text | Any string | "" |
| `guestDesignation` | text | Any string | "" |
| `description` | textarea | Any string | "" |
| `additionalText` | textarea | Any string | "" |

### Design Configuration

| Field | Type | Valid Values | Default |
|-------|------|--------------|---------|
| `theme` | select | 22 themes (see references) | "corporate" |
| `style` | select | 16 styles (see references) | "gradient" |
| `colorScheme` | select | 6 schemes | "brand_default" |
| `language` | select | en, ta, hi | "en" |
| `aspectRatio` | select | 10 ratios | "9:16" |
| `resolution` | select | 1K, 2K, 4K | "1K" |

## Testing Workflow

### Step 1: Validate Form State

Run the form testing script to capture current form state:

```bash
python .claude/skills/event-poster-ultra/scripts/test_form_data.py
```

Or manually inspect in browser console:
```javascript
// Get form data from React state (if accessible)
console.log(JSON.stringify(formData, null, 2));
```

### Step 2: Intercept API Payload

Add logging to `handleGenerate` function:

```typescript
// In app/dashboard/create/[type]/page.tsx, inside handleGenerate:
console.log('=== FORM DATA DEBUG ===');
console.log('eventName:', formData.eventName);
console.log('eventType:', formData.eventType);
console.log('theme:', formData.theme);
console.log('style:', formData.style);
console.log('Full payload:', JSON.stringify({
  content: {
    eventName: formData.eventName,
    eventType: formData.eventType,
    // ... all fields
  },
  theme: formData.theme,
  style: formData.style,
}, null, 2));
```

### Step 3: Verify API Receipt

Check server logs or add debug in API route:

```typescript
// In app/api/creatives/generate/route.ts:
console.log('=== API RECEIVED ===');
console.log('content:', JSON.stringify(content, null, 2));
console.log('theme:', theme);
console.log('style:', style);
```

### Step 4: Validate Against Schema

Compare received values against expected:

```typescript
// Expected eventType values (not field names!)
const validEventTypes = [
  'seminar', 'workshop', 'conference', 'guest_lecture', 
  'webinar', 'hackathon', 'quiz', 'debate', 
  // ... see references/event-types.md for full list
];

if (!validEventTypes.includes(content.eventType)) {
  console.error('Invalid eventType:', content.eventType);
  console.error('Expected one of:', validEventTypes);
}
```

## Common Bug Fixes

### Bug 1: Select Passing Field Name Instead of Value

**Symptom:** API receives `"eventType"` instead of `"conference"`

**Location:** `app/dashboard/create/[type]/page.tsx` or `components/ui/grouped-select.tsx`

**Fix Pattern:**
```tsx
// WRONG - passes field name
<Select onValueChange={(v) => updateForm("eventType", "eventType")}>

// CORRECT - passes actual value
<Select 
  value={formData.eventType} 
  onValueChange={(v) => updateForm("eventType", v)}
>
```

### Bug 2: GroupedSelect Not Passing Value

**Symptom:** eventType is empty or undefined

**Fix Pattern:**
```tsx
// Check GroupedSelect implementation
<GroupedSelect
  value={formData.eventType}                    // ✓ Controlled value
  onValueChange={(v) => updateForm("eventType", v)}  // ✓ Passes 'v' not field name
  categories={EVENT_TYPE_CATEGORIES}
  placeholder="Select event type"
/>
```

### Bug 3: Theme/Style Default Not Applied

**Symptom:** Generated poster lacks theming

**Fix Pattern:**
```typescript
// Ensure defaults in initial state
const [formData, setFormData] = useState({
  // ...
  theme: "corporate",     // ✓ Has default
  style: "gradient",      // ✓ Has default
});
```

### Bug 4: Resolution Not Passed to API

**Symptom:** Always generates 1K regardless of selection

**Fix:** Ensure resolution is included in API payload:
```typescript
body: JSON.stringify({
  // ...
  resolution: formData.resolution,  // ✓ Include this
})
```

## Ultra Poster Settings

For the highest quality event posters:

### Recommended Configuration

```typescript
{
  // Content - Be specific and detailed
  eventName: "Full descriptive event name",
  eventType: "conference",  // Use specific type, not "other"
  date: "2025-01-15",
  time: "09:00",
  venue: "Specific venue name with city",
  guestName: "Full name with title",
  guestDesignation: "Complete designation",
  description: "2-3 detailed sentences about the event",
  
  // Design - Use compatible theme+style combos
  theme: "elegant",         // Match to event type
  style: "gradient",        // Most versatile
  colorScheme: "brand_default",
  
  // Output - Maximize quality
  aspectRatio: "9:16",      // Best for Stories/Reels
  resolution: "4K",         // Highest quality
  language: "en",
  
  // Model - Choose based on style
  modelId: "gemini",        // Best for photo-realistic
  // modelId: "ideogram",   // Best for typography-heavy
}
```

### Theme + Style Compatibility Matrix

| Event Type | Best Themes | Best Styles |
|------------|------------|-------------|
| Conference | corporate, modern, elegant | gradient, glass, flat |
| Workshop | modern, minimalist | flat, line-art |
| Hackathon | futuristic, neon, bold | neon-glow, geometric |
| Cultural | traditional, festive | watercolor, illustration |
| Award Ceremony | elegant, royal, glamorous | metallic, gradient |
| Sports | sporty, bold, dynamic | geometric, high-contrast |

### Quality Optimization Tips

1. **Use 4K resolution** for print-ready output
2. **Match theme to event type** using THEME_SUGGESTIONS
3. **Include all optional fields** for richer context
4. **Use specific venue names** not generic "Venue Name"
5. **Add guest designation** for professional appearance
6. **Write detailed description** (2-3 sentences minimum)

## Automated Testing

To run comprehensive form field tests:

```bash
# Test all form fields
python .claude/skills/event-poster-ultra/scripts/test_form_data.py --full

# Test specific field
python .claude/skills/event-poster-ultra/scripts/test_form_data.py --field eventType

# Generate test payload
python .claude/skills/event-poster-ultra/scripts/test_form_data.py --generate-payload

# Validate API response
python .claude/skills/event-poster-ultra/scripts/test_form_data.py --validate-response response.json
```

## File References

For detailed information, see:

- `references/form-fields.md` - Complete field specifications
- `references/event-types.md` - All 50+ event types with categories
- `references/themes-styles.md` - 22 themes and 16 styles details
- `references/common-bugs.md` - Bug patterns and fixes
- `references/ultra-presets.md` - Optimized presets for different events

## Debug Checklist

When poster generation fails or produces unexpected results:

- [ ] Check browser console for form data logs
- [ ] Verify Select components pass `v` not field names
- [ ] Confirm API payload includes all required fields
- [ ] Check theme and style are valid slugs (not labels)
- [ ] Verify aspectRatio matches available dimensions
- [ ] Ensure resolution is valid (1K, 2K, or 4K)
- [ ] Check model is active in ai_models table
- [ ] Verify wallet has sufficient credits
- [ ] Check API route logs for received payload
- [ ] Validate prompt construction in buildGenerationPrompt
