# Ultra Poster Generation Presets

Optimized presets for generating high-quality event posters with maximum visual impact.

---

## Quick Reference - Best Combinations

| Event Category | Theme | Style | Color Scheme | Resolution |
|----------------|-------|-------|--------------|------------|
| Corporate | `corporate` | `gradient` | `brand_default` | 2K |
| Wedding | `wedding` | `soft_glow` | `elegant_gold` | 4K |
| Festival | `festival` | `neon` | `vibrant` | 2K |
| Tech Event | `tech` | `geometric` | `tech_blue` | 2K |
| Sports | `sports` | `dynamic` | `energetic` | 2K |
| Academic | `academic` | `minimal` | `professional` | 1K |
| Cultural | `cultural` | `traditional` | `festive` | 2K |
| Music Concert | `music` | `neon` | `vibrant` | 2K |

---

## Ultra Presets by Event Type

### 1. Corporate Events

```typescript
const corporateUltra = {
  theme: "corporate",
  style: "gradient",
  colorScheme: "brand_default",
  resolution: "2K",
  aspectRatio: "9:16",
  // Best for: conferences, seminars, AGMs, board meetings
};

const corporatePremium = {
  theme: "luxury",
  style: "elegant",
  colorScheme: "elegant_gold",
  resolution: "4K",
  aspectRatio: "1:1",
  // Best for: award ceremonies, galas, high-profile launches
};
```

### 2. Wedding & Celebrations

```typescript
const weddingUltra = {
  theme: "wedding",
  style: "soft_glow",
  colorScheme: "elegant_gold",
  resolution: "4K",
  aspectRatio: "4:5",
  // Best for: wedding invitations, engagement announcements
};

const celebrationUltra = {
  theme: "celebration",
  style: "festive",
  colorScheme: "festive",
  resolution: "2K",
  aspectRatio: "9:16",
  // Best for: birthdays, anniversaries, parties
};
```

### 3. Tech & Innovation

```typescript
const techUltra = {
  theme: "tech",
  style: "geometric",
  colorScheme: "tech_blue",
  resolution: "2K",
  aspectRatio: "16:9",
  // Best for: hackathons, tech talks, product launches
};

const startupUltra = {
  theme: "startup",
  style: "modern",
  colorScheme: "vibrant",
  resolution: "2K",
  aspectRatio: "9:16",
  // Best for: pitch events, demo days, networking
};
```

### 4. Academic & Educational

```typescript
const academicUltra = {
  theme: "academic",
  style: "minimal",
  colorScheme: "professional",
  resolution: "1K",
  aspectRatio: "9:16",
  // Best for: lectures, workshops, symposiums
};

const graduationUltra = {
  theme: "graduation",
  style: "elegant",
  colorScheme: "elegant_gold",
  resolution: "2K",
  aspectRatio: "4:5",
  // Best for: convocations, degree ceremonies
};
```

### 5. Cultural & Religious

```typescript
const culturalUltra = {
  theme: "cultural",
  style: "traditional",
  colorScheme: "festive",
  resolution: "2K",
  aspectRatio: "9:16",
  // Best for: Diwali, Pongal, cultural programs
};

const religiousUltra = {
  theme: "spiritual",
  style: "soft_glow",
  colorScheme: "warm",
  resolution: "2K",
  aspectRatio: "4:5",
  // Best for: religious gatherings, spiritual events
};
```

### 6. Sports & Fitness

```typescript
const sportsUltra = {
  theme: "sports",
  style: "dynamic",
  colorScheme: "energetic",
  resolution: "2K",
  aspectRatio: "9:16",
  // Best for: tournaments, matches, sports days
};

const fitnessUltra = {
  theme: "fitness",
  style: "bold",
  colorScheme: "vibrant",
  resolution: "2K",
  aspectRatio: "1:1",
  // Best for: marathons, yoga sessions, fitness camps
};
```

### 7. Music & Entertainment

```typescript
const musicUltra = {
  theme: "music",
  style: "neon",
  colorScheme: "vibrant",
  resolution: "2K",
  aspectRatio: "9:16",
  // Best for: concerts, live performances, DJ nights
};

const entertainmentUltra = {
  theme: "entertainment",
  style: "cinematic",
  colorScheme: "dramatic",
  resolution: "4K",
  aspectRatio: "16:9",
  // Best for: movie screenings, talent shows, comedy nights
};
```

### 8. Food & Hospitality

```typescript
const foodUltra = {
  theme: "food",
  style: "appetizing",
  colorScheme: "warm",
  resolution: "2K",
  aspectRatio: "1:1",
  // Best for: food festivals, restaurant events, cooking demos
};

const hospitalityUltra = {
  theme: "hospitality",
  style: "elegant",
  colorScheme: "professional",
  resolution: "2K",
  aspectRatio: "4:5",
  // Best for: hotel events, hospitality training
};
```

---

## Resolution Guidelines

### When to Use Each Resolution

| Resolution | Best For | File Size | Print Quality |
|------------|----------|-----------|---------------|
| **1K** (1024px) | Social media, quick posts, drafts | Small (~200KB) | Screen only |
| **2K** (2048px) | Instagram, stories, digital display | Medium (~500KB) | Small prints |
| **4K** (4096px) | Large displays, print, premium | Large (~1.5MB) | High-quality prints |

### Resolution by Platform

```typescript
const platformResolutions = {
  instagram_post: { resolution: "2K", aspectRatio: "1:1" },
  instagram_story: { resolution: "2K", aspectRatio: "9:16" },
  facebook_post: { resolution: "2K", aspectRatio: "1:1" },
  linkedin_post: { resolution: "2K", aspectRatio: "1:1" },
  twitter_post: { resolution: "1K", aspectRatio: "16:9" },
  whatsapp_status: { resolution: "1K", aspectRatio: "9:16" },
  print_a4: { resolution: "4K", aspectRatio: "1:1.414" },
  print_poster: { resolution: "4K", aspectRatio: "9:16" },
  digital_signage: { resolution: "4K", aspectRatio: "16:9" },
};
```

---

## Aspect Ratio Selection

### Available Ratios

| Ratio | Dimensions | Best Use Case |
|-------|------------|---------------|
| `9:16` | 1080x1920 | Instagram/WhatsApp stories, vertical displays |
| `16:9` | 1920x1080 | YouTube thumbnails, presentations, horizontal displays |
| `1:1` | 1080x1080 | Instagram posts, profile pictures |
| `4:5` | 1080x1350 | Instagram feed (max engagement) |
| `4:3` | 1440x1080 | Traditional displays, photos |

### Platform-Specific Recommendations

```typescript
const platformAspectRatios = {
  // Social Media
  instagram_feed: "4:5",      // Best engagement
  instagram_story: "9:16",
  facebook_feed: "1:1",
  linkedin: "1:1",
  twitter: "16:9",
  
  // Messaging
  whatsapp_status: "9:16",
  telegram: "1:1",
  
  // Print
  a4_portrait: "1:1.414",
  a4_landscape: "1.414:1",
  poster: "9:16",
  
  // Digital
  tv_display: "16:9",
  digital_signage: "9:16",
};
```

---

## Theme + Style Synergy Matrix

Best combinations that work together:

```
Corporate:
  ├── gradient + brand_default (professional)
  ├── minimal + professional (clean)
  └── elegant + elegant_gold (premium)

Wedding:
  ├── soft_glow + elegant_gold (romantic)
  ├── floral + pastel (feminine)
  └── elegant + warm (classic)

Tech:
  ├── geometric + tech_blue (modern)
  ├── neon + vibrant (futuristic)
  └── minimal + professional (clean)

Festival:
  ├── festive + vibrant (energetic)
  ├── neon + festive (exciting)
  └── traditional + festive (cultural)

Sports:
  ├── dynamic + energetic (action)
  ├── bold + vibrant (impactful)
  └── geometric + tech_blue (modern sports)
```

---

## Ultra Generation Checklist

Before generating an ultra-quality poster:

### Content Checklist
- [ ] Event name is clear and concise (< 50 chars ideal)
- [ ] Date format is consistent (DD/MM/YYYY or Month DD, YYYY)
- [ ] Time includes AM/PM or 24-hour format
- [ ] Venue name is complete
- [ ] Guest name spelled correctly
- [ ] Guest designation is professional

### Settings Checklist
- [ ] Theme matches event category
- [ ] Style complements the theme
- [ ] Color scheme aligns with brand
- [ ] Resolution appropriate for use case
- [ ] Aspect ratio matches platform

### Quality Checklist
- [ ] All required fields filled
- [ ] No placeholder text remaining
- [ ] Description is meaningful
- [ ] Language setting is correct

---

## Common Mistakes to Avoid

1. **Mismatched Theme-Style**
   - Wrong: Wedding event with "tech" theme
   - Right: Wedding event with "wedding" or "celebration" theme

2. **Wrong Resolution for Platform**
   - Wrong: 4K for WhatsApp status (slow loading)
   - Right: 1K for WhatsApp, 2K for Instagram

3. **Inconsistent Color Scheme**
   - Wrong: "tech_blue" for a food festival
   - Right: "warm" or "vibrant" for food events

4. **Ignoring Aspect Ratio**
   - Wrong: 16:9 for Instagram story (cropped)
   - Right: 9:16 for vertical content

---

## Quick Copy-Paste Presets

### Corporate Seminar
```json
{
  "theme": "corporate",
  "style": "gradient",
  "colorScheme": "brand_default",
  "resolution": "2K",
  "aspectRatio": "9:16"
}
```

### Wedding Invitation
```json
{
  "theme": "wedding",
  "style": "soft_glow",
  "colorScheme": "elegant_gold",
  "resolution": "4K",
  "aspectRatio": "4:5"
}
```

### Tech Conference
```json
{
  "theme": "tech",
  "style": "geometric",
  "colorScheme": "tech_blue",
  "resolution": "2K",
  "aspectRatio": "16:9"
}
```

### Cultural Festival
```json
{
  "theme": "cultural",
  "style": "traditional",
  "colorScheme": "festive",
  "resolution": "2K",
  "aspectRatio": "9:16"
}
```

### Sports Tournament
```json
{
  "theme": "sports",
  "style": "dynamic",
  "colorScheme": "energetic",
  "resolution": "2K",
  "aspectRatio": "9:16"
}
```
