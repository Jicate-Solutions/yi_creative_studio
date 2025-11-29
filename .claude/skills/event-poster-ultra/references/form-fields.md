# Event Poster Form Fields Reference

Complete specification of all form fields in the event poster creation page.

## Form Data Structure

```typescript
interface FormData {
  // Content fields
  eventName: string;        // Required
  eventType: string;        // Required - select
  date: string;             // YYYY-MM-DD format
  time: string;             // HH:MM format
  venue: string;
  hall: string;
  guestName: string;
  guestDesignation: string;
  description: string;
  additionalText: string;
  
  // Design fields
  theme: string;            // 22 valid themes
  style: string;            // 16 valid styles
  colorScheme: string;      // 6 valid schemes
  language: string;         // en, ta, hi
  
  // Output fields
  aspectRatio: string;      // 10 valid ratios
  resolution: string;       // 1K, 2K, 4K
}
```

## Field Details

### eventName (Required)

| Property | Value |
|----------|-------|
| Type | text input |
| Required | Yes |
| AI Enabled | Yes |
| Placeholder | "e.g., Annual Conference 2025" |
| Validation | Non-empty string |

**Common Issues:**
- Empty string passed
- Placeholder text submitted

### eventType (Required)

| Property | Value |
|----------|-------|
| Type | GroupedSelect |
| Required | Yes |
| AI Enabled | No |
| Valid Values | 50+ event types |

**Valid Values by Category:**

Academic:
- seminar, workshop, conference, guest_lecture, webinar
- industrial_visit, orientation, convocation, placement_drive
- science_fair, training

Competitions:
- competition, hackathon, quiz, debate
- sports_event, sports_day

Celebrations:
- celebration, cultural_event, annual_day, freshers_day
- farewell, alumni_meet, reunion, tech_fest
- cultural_fest, festival

Corporate:
- meetup, exhibition, product_launch, town_hall
- award_ceremony, networking, panel_discussion
- inauguration, foundation_day

Community:
- blood_donation, health_camp, csr_activity
- awareness_program, charity_event

National:
- independence_day, republic_day, teachers_day, memorial

**Common Issues:**
- Field name "eventType" passed instead of value
- Label passed instead of value (e.g., "Conference" instead of "conference")
- Value from wrong select

### date

| Property | Value |
|----------|-------|
| Type | date input |
| Required | No |
| Format | YYYY-MM-DD |

**Common Issues:**
- Invalid format (DD/MM/YYYY instead of YYYY-MM-DD)
- Future date validation missing

### time

| Property | Value |
|----------|-------|
| Type | time input |
| Required | No |
| Format | HH:MM (24-hour) |

**Common Issues:**
- Missing leading zeros (9:00 instead of 09:00)
- 12-hour format instead of 24-hour

### theme

| Property | Value |
|----------|-------|
| Type | ThemeStyleSelector |
| Default | "corporate" |
| Valid Values | 22 themes |

**Valid Values:**

Professional: corporate, modern, classic, minimalist
Creative: bold, playful, artistic, retro
Elegant: elegant, royal, glamorous
Dynamic: sporty, futuristic, neon
Cultural: traditional, festive, spiritual
Nature: organic, zen
Academic: scholarly, scientific

**Common Issues:**
- Label passed instead of slug ("Corporate" vs "corporate")
- Field name "theme" passed as value

### style

| Property | Value |
|----------|-------|
| Type | ThemeStyleSelector |
| Default | "gradient" |
| Valid Values | 16 styles |

**Valid Values:**
- gradient, flat, glass, geometric
- neon-glow, duotone, watercolor, line-art
- 3d-isometric, typography, photographic
- illustration, metallic, paper-cut
- monochrome, high-contrast

### aspectRatio

| Property | Value |
|----------|-------|
| Type | button group |
| Default | "9:16" |
| Valid Values | 10 ratios |

**Valid Values:**
- 1:1 (Square)
- 2:3, 3:2 (Portrait/Landscape)
- 3:4, 4:3 (Portrait/Landscape)
- 4:5, 5:4 (Instagram/Photo)
- 9:16, 16:9 (Story/Widescreen)
- 21:9 (Ultra-wide)

### resolution

| Property | Value |
|----------|-------|
| Type | button group |
| Default | "1K" |
| Valid Values | 1K, 2K, 4K |

**Dimensions by Resolution:**

| Ratio | 1K | 2K | 4K |
|-------|----|----|-----|
| 9:16 | 768x1376 | 1536x2752 | 3072x5504 |
| 1:1 | 1024x1024 | 2048x2048 | 4096x4096 |
| 16:9 | 1376x768 | 2752x1536 | 5504x3072 |

## API Payload Structure

```typescript
const payload = {
  organizationId: string,
  type: "event_poster" | "social_post" | "banner",
  content: {
    eventName: string,
    eventType: string,    // Must be valid slug!
    date: string,
    time: string,
    venue: string,
    hall: string,
    guestName: string,
    guestDesignation: string,
    description: string,
    additionalText: string,
  },
  theme: string,          // Must be valid slug!
  style: string,          // Must be valid slug!
  colorScheme: string,
  language: string,
  aspectRatio: string,
  resolution: string,
  modelId?: string,
  selectedLogos?: LogoConfig[],
  customization?: DesignCustomization,
};
```

## Validation Checklist

Before API call:

- [ ] eventName is non-empty string
- [ ] eventType is valid slug (not label, not field name)
- [ ] date is YYYY-MM-DD format (if provided)
- [ ] time is HH:MM format (if provided)
- [ ] theme is valid slug
- [ ] style is valid slug
- [ ] colorScheme is valid value
- [ ] language is en, ta, or hi
- [ ] aspectRatio is valid ratio
- [ ] resolution is 1K, 2K, or 4K
