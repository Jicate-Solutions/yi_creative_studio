# Common Bugs in Event Poster Form

Documented patterns of bugs found in the event poster creation system.

## Bug #1: Field Name Passed Instead of Value

### Symptom
API receives `"eventType"` instead of `"conference"`

### Root Cause
Select component's `onValueChange` handler passes the field name instead of the selected value.

### Detection
```javascript
// In browser console
console.log('eventType value:', formData.eventType);
// If it prints "eventType" - BUG!
```

### Bad Code Pattern
```tsx
// WRONG - Hardcoded field name
<Select onValueChange={(v) => updateForm("eventType", "eventType")}>

// WRONG - Using field name variable
const fieldName = "eventType";
<Select onValueChange={(v) => updateForm(fieldName, fieldName)}>
```

### Fix
```tsx
// CORRECT - Pass the actual value 'v'
<Select 
  value={formData.eventType}
  onValueChange={(v) => updateForm("eventType", v)}
>
```

### Files to Check
- `app/dashboard/create/[type]/page.tsx` - Line ~594
- `components/ui/grouped-select.tsx` - onValueChange handler
- `components/create/theme-style-selector.tsx`

---

## Bug #2: GroupedSelect Not Propagating Value

### Symptom
eventType is empty, undefined, or wrong category

### Root Cause
GroupedSelect component doesn't properly bubble the selected value

### Detection
```typescript
// Add debug logging
console.log('GroupedSelect onChange:', value);
```

### Bad Code Pattern
```tsx
// WRONG - Not passing through the value
onValueChange={(category, value) => {
  updateForm("eventType", category); // Wrong! Using category
}}
```

### Fix
```tsx
// CORRECT - Use the actual value
<GroupedSelect
  value={formData.eventType}
  onValueChange={(v) => updateForm("eventType", v)}
  categories={EVENT_TYPE_CATEGORIES}
/>
```

---

## Bug #3: Theme/Style Default Not Set

### Symptom
Generated poster has no theming, looks generic

### Root Cause
Initial state doesn't have defaults, or defaults get overwritten

### Detection
```typescript
console.log('theme:', formData.theme); // undefined or ""
console.log('style:', formData.style); // undefined or ""
```

### Fix
```typescript
const [formData, setFormData] = useState({
  // ... other fields
  theme: "corporate",     // Explicit default
  style: "gradient",      // Explicit default
});
```

---

## Bug #4: Resolution Not Included in API Payload

### Symptom
Always generates 1K resolution regardless of selection

### Root Cause
resolution field not included in fetch body

### Detection
```typescript
// In API route
console.log('resolution:', resolution); // undefined
```

### Bad Code Pattern
```typescript
body: JSON.stringify({
  // ... other fields
  // Missing: resolution
})
```

### Fix
```typescript
body: JSON.stringify({
  // ... other fields
  resolution: formData.resolution,
})
```

---

## Bug #5: Select Label vs Value Confusion

### Symptom
API receives "Conference" instead of "conference"

### Root Cause
Using the display label instead of the value slug

### Detection
```typescript
// Check if value has capital letters or spaces
if (formData.eventType !== formData.eventType.toLowerCase()) {
  console.error('Using label instead of value!');
}
```

### Fix
Ensure Select options use correct value:
```tsx
<SelectItem value="conference">Conference</SelectItem>
// value="conference" (lowercase slug)
// Display text: "Conference" (Title Case)
```

---

## Bug #6: Async State Update Race Condition

### Symptom
Old values submitted, recent changes lost

### Root Cause
Form submitted before state update completes

### Detection
```typescript
// Log immediately before submit
console.log('Submitting:', formData);
// Compare with what you just typed
```

### Fix
```typescript
// Use functional update
const updateForm = (field: string, value: string) => {
  setFormData(prev => ({ ...prev, [field]: value }));
};

// Or use ref for immediate value access
const formDataRef = useRef(formData);
useEffect(() => {
  formDataRef.current = formData;
}, [formData]);
```

---

## Bug #7: Logo Selection Not Sent

### Symptom
Logos selected but not appearing on poster

### Root Cause
selectedLogos array not included in API payload

### Fix
```typescript
body: JSON.stringify({
  // ... other fields
  selectedLogos: selectedLogos.length > 0 ? selectedLogos : undefined,
})
```

---

## Bug #8: Customization Object Empty

### Symptom
Customization panel changes have no effect

### Root Cause
customization state not passed to API

### Detection
```typescript
console.log('customization:', customization);
// Should have logoScale, logoOpacity, etc.
```

### Fix
```typescript
body: JSON.stringify({
  // ... other fields
  customization,
})
```

---

## Debug Logging Template

Add this to `handleGenerate` for comprehensive debugging:

```typescript
const handleGenerate = async () => {
  // DEBUG START
  console.group('Form Data Debug');
  console.log('=== CONTENT ===');
  console.log('eventName:', formData.eventName, typeof formData.eventName);
  console.log('eventType:', formData.eventType, typeof formData.eventType);
  console.log('date:', formData.date);
  console.log('time:', formData.time);
  console.log('venue:', formData.venue);
  console.log('guestName:', formData.guestName);
  
  console.log('=== DESIGN ===');
  console.log('theme:', formData.theme);
  console.log('style:', formData.style);
  console.log('colorScheme:', formData.colorScheme);
  
  console.log('=== OUTPUT ===');
  console.log('aspectRatio:', formData.aspectRatio);
  console.log('resolution:', formData.resolution);
  console.log('language:', formData.language);
  
  console.log('=== EXTRAS ===');
  console.log('selectedLogos:', selectedLogos);
  console.log('customization:', customization);
  console.log('selectedModel:', selectedModel);
  console.groupEnd();
  // DEBUG END

  // ... rest of function
};
```

---

## Quick Fix Checklist

When debugging form issues:

1. [ ] Add console.log before API call
2. [ ] Check Select components pass `v` not field name
3. [ ] Verify GroupedSelect propagates value correctly
4. [ ] Ensure defaults are set in useState
5. [ ] Check resolution is in API payload
6. [ ] Verify theme/style are slugs not labels
7. [ ] Check selectedLogos is included
8. [ ] Check customization object is passed
9. [ ] Look at Network tab for actual request payload
10. [ ] Check API route logs for received data
