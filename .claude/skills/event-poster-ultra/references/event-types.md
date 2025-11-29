# Event Types Reference

Complete documentation of all 50+ event types organized by category.

---

## Event Type Categories Overview

| Category | Count | Description |
|----------|-------|-------------|
| Corporate | 8 | Business and professional events |
| Educational | 6 | Academic and learning events |
| Cultural | 8 | Cultural and traditional events |
| Social | 7 | Social gatherings and celebrations |
| Sports | 5 | Athletic and fitness events |
| Religious | 5 | Religious and spiritual events |
| Entertainment | 6 | Shows and performances |
| Community | 5 | Community and public events |

---

## Complete Event Types List

### Corporate Events

| Event Type | Value | Recommended Theme | Recommended Style |
|------------|-------|-------------------|-------------------|
| Conference | `conference` | corporate | gradient |
| Seminar | `seminar` | corporate | minimal |
| Workshop | `workshop` | professional | flat |
| Meeting | `meeting` | corporate | minimal |
| Product Launch | `product_launch` | startup | modern |
| AGM | `agm` | corporate | gradient |
| Training | `training` | professional | flat |
| Networking | `networking` | startup | modern |

### Educational Events

| Event Type | Value | Recommended Theme | Recommended Style |
|------------|-------|-------------------|-------------------|
| Lecture | `lecture` | academic | minimal |
| Symposium | `symposium` | academic | elegant |
| Graduation | `graduation` | graduation | elegant |
| Orientation | `orientation` | education | modern |
| Science Fair | `science_fair` | tech | geometric |
| Competition | `competition` | academic | bold |

### Cultural Events

| Event Type | Value | Recommended Theme | Recommended Style |
|------------|-------|-------------------|-------------------|
| Festival | `festival` | festival | festive |
| Dance Performance | `dance_performance` | cultural | traditional |
| Art Exhibition | `art_exhibition` | cultural | elegant |
| Music Concert | `music_concert` | music | neon |
| Drama | `drama` | entertainment | cinematic |
| Cultural Program | `cultural_program` | cultural | traditional |
| Heritage Walk | `heritage_walk` | traditional | vintage |
| Folk Event | `folk_event` | cultural | traditional |

### Social Events

| Event Type | Value | Recommended Theme | Recommended Style |
|------------|-------|-------------------|-------------------|
| Wedding | `wedding` | wedding | soft_glow |
| Birthday | `birthday` | birthday | festive |
| Anniversary | `anniversary` | celebration | elegant |
| Party | `party` | celebration | bold |
| Reunion | `reunion` | celebration | modern |
| Baby Shower | `baby_shower` | celebration | soft_glow |
| Engagement | `engagement` | wedding | elegant |

### Sports Events

| Event Type | Value | Recommended Theme | Recommended Style |
|------------|-------|-------------------|-------------------|
| Tournament | `tournament` | sports | dynamic |
| Match | `match` | sports | bold |
| Marathon | `marathon` | fitness | dynamic |
| Sports Day | `sports_day` | sports | bold |
| Yoga Session | `yoga_session` | fitness | soft_glow |

### Religious Events

| Event Type | Value | Recommended Theme | Recommended Style |
|------------|-------|-------------------|-------------------|
| Prayer Meeting | `prayer_meeting` | spiritual | soft_glow |
| Festival | `religious_festival` | spiritual | traditional |
| Ceremony | `ceremony` | spiritual | elegant |
| Pilgrimage | `pilgrimage` | spiritual | traditional |
| Discourse | `discourse` | spiritual | minimal |

### Entertainment Events

| Event Type | Value | Recommended Theme | Recommended Style |
|------------|-------|-------------------|-------------------|
| Concert | `concert` | music | neon |
| Movie Screening | `movie_screening` | entertainment | cinematic |
| Comedy Show | `comedy_show` | entertainment | bold |
| Talent Show | `talent_show` | entertainment | dynamic |
| DJ Night | `dj_night` | music | neon |
| Live Performance | `live_performance` | entertainment | dynamic |

### Community Events

| Event Type | Value | Recommended Theme | Recommended Style |
|------------|-------|-------------------|-------------------|
| Charity Event | `charity_event` | professional | elegant |
| Blood Donation | `blood_donation` | professional | flat |
| Clean-up Drive | `cleanup_drive` | professional | modern |
| Awareness Campaign | `awareness_campaign` | professional | bold |
| Public Meeting | `public_meeting` | professional | minimal |

---

## Event Type to Form Data Mapping

```typescript
const EVENT_TYPE_CATEGORIES = {
  corporate: {
    label: "Corporate",
    types: [
      { value: "conference", label: "Conference" },
      { value: "seminar", label: "Seminar" },
      { value: "workshop", label: "Workshop" },
      { value: "meeting", label: "Meeting" },
      { value: "product_launch", label: "Product Launch" },
      { value: "agm", label: "AGM" },
      { value: "training", label: "Training" },
      { value: "networking", label: "Networking" },
    ],
  },
  educational: {
    label: "Educational",
    types: [
      { value: "lecture", label: "Lecture" },
      { value: "symposium", label: "Symposium" },
      { value: "graduation", label: "Graduation" },
      { value: "orientation", label: "Orientation" },
      { value: "science_fair", label: "Science Fair" },
      { value: "competition", label: "Competition" },
    ],
  },
  // ... more categories
};
```

---

## Validation Rules

### Required Fields by Event Type

```typescript
const requiredFieldsByType: Record<string, string[]> = {
  // All events require these
  _default: ["eventName", "eventType", "date"],
  
  // Specific event requirements
  wedding: ["eventName", "date", "venue", "time"],
  conference: ["eventName", "date", "venue", "guestName"],
  graduation: ["eventName", "date", "venue"],
  concert: ["eventName", "date", "venue", "time"],
  tournament: ["eventName", "date", "venue"],
  workshop: ["eventName", "date", "venue", "time"],
};
```

### Event Type Validation

```typescript
function validateEventType(value: string): boolean {
  const allTypes = Object.values(EVENT_TYPE_CATEGORIES)
    .flatMap(cat => cat.types)
    .map(t => t.value);
  
  return allTypes.includes(value);
}
```

---

## Common Issues by Event Type

### Corporate Events
- **Issue**: Generic descriptions
- **Fix**: Include specific agenda items, speaker topics
- **Example**: "Annual Technology Conference featuring AI trends and cloud innovations"

### Wedding Events
- **Issue**: Missing couple names
- **Fix**: Ensure bride/groom names in eventName or guestName
- **Example**: eventName: "John & Sarah's Wedding Reception"

### Educational Events
- **Issue**: Missing institution name
- **Fix**: Include institution in venue or description
- **Example**: venue: "MIT Main Auditorium"

### Sports Events
- **Issue**: Missing teams/participants info
- **Fix**: Add participant info in description
- **Example**: description: "Finals: Team Alpha vs Team Beta"

---

## Event Type Selection Code

### GroupedSelect Implementation

```tsx
<GroupedSelect
  value={formData.eventType}
  onValueChange={(value) => {
    // Ensure value (not label) is passed
    console.log("Selected event type:", value);
    updateForm("eventType", value);
  }}
  options={Object.entries(EVENT_TYPE_CATEGORIES).map(([key, cat]) => ({
    group: cat.label,
    items: cat.types.map(t => ({
      value: t.value,  // This is what gets passed
      label: t.label,  // This is what displays
    })),
  }))}
  placeholder="Select event type"
/>
```

### Common Bug: Label vs Value

```tsx
// WRONG - Passing label instead of value
onValueChange={(value) => updateForm("eventType", selectedItem.label)}

// CORRECT - Passing the actual value
onValueChange={(value) => updateForm("eventType", value)}
```

---

## Testing Event Types

### Test Cases for Each Category

```typescript
const testCases = {
  corporate: {
    eventType: "conference",
    eventName: "Annual Tech Summit 2024",
    date: "2024-03-15",
    time: "09:00 AM",
    venue: "Grand Convention Center",
    guestName: "Dr. Jane Smith",
    guestDesignation: "CEO, TechCorp",
  },
  wedding: {
    eventType: "wedding",
    eventName: "John & Sarah Wedding",
    date: "2024-06-20",
    time: "06:00 PM",
    venue: "Royal Garden Resort",
    hall: "Diamond Hall",
  },
  educational: {
    eventType: "graduation",
    eventName: "Class of 2024 Graduation",
    date: "2024-05-15",
    time: "10:00 AM",
    venue: "University Auditorium",
    guestName: "Prof. Robert Brown",
    guestDesignation: "Vice Chancellor",
  },
  sports: {
    eventType: "tournament",
    eventName: "Inter-College Cricket Tournament",
    date: "2024-04-10",
    time: "08:00 AM",
    venue: "City Sports Complex",
    description: "Semi-Finals and Finals",
  },
};
```

### Verification Script

```python
def verify_event_type(form_data: dict) -> list[str]:
    """Verify event type is correctly set"""
    errors = []
    
    event_type = form_data.get("eventType", "")
    
    # Check if it's a valid value (not a label)
    valid_values = ["conference", "seminar", "workshop", "wedding", ...]
    
    if event_type not in valid_values:
        # Might be passing label instead
        if event_type in ["Conference", "Seminar", "Workshop", "Wedding"]:
            errors.append(f"Event type appears to be label '{event_type}' instead of value")
        else:
            errors.append(f"Invalid event type: {event_type}")
    
    return errors
```

---

## Quick Reference: Event Type Values

Copy-paste ready values for testing:

```
Corporate:
- conference
- seminar
- workshop
- meeting
- product_launch
- agm
- training
- networking

Educational:
- lecture
- symposium
- graduation
- orientation
- science_fair
- competition

Cultural:
- festival
- dance_performance
- art_exhibition
- music_concert
- drama
- cultural_program
- heritage_walk
- folk_event

Social:
- wedding
- birthday
- anniversary
- party
- reunion
- baby_shower
- engagement

Sports:
- tournament
- match
- marathon
- sports_day
- yoga_session

Religious:
- prayer_meeting
- religious_festival
- ceremony
- pilgrimage
- discourse

Entertainment:
- concert
- movie_screening
- comedy_show
- talent_show
- dj_night
- live_performance

Community:
- charity_event
- blood_donation
- cleanup_drive
- awareness_campaign
- public_meeting
```
