# Yi CreativeStudio - Creative Formats, Fields & Prompts Knowledge Base

> A comprehensive guide for understanding and improving our AI-powered creative generation system.

---

## Table of Contents
1. [Creative Formats](#1-creative-formats-37-formats)
2. [Base Patterns](#2-base-patterns-10-patterns-for-37-formats)
3. [Yi Verticals](#3-verticals-8-yi-initiatives)
4. [Dynamic Form Fields](#4-dynamic-form-fields)
5. [AI Prompts Pipeline](#5-ai-prompts-system-3-stage-pipeline)
6. [Prompt Engineering Patterns](#6-prompt-engineering-patterns)
7. [Color System](#7-color-system)
8. [Improvement Opportunities](#8-prompt-improvement-opportunities)
9. [Key Files Reference](#9-key-files-reference)
10. [Quick Modification Guide](#10-quick-reference-what-to-modify)

---

## 1. Creative Formats (37+ Formats)

### Format Categories Overview

| Category | Count | Formats | Key Characteristics |
|----------|-------|---------|---------------------|
| **Social Media** | 12 | Instagram Post/Story/Reel, Facebook Post/Cover/Ad, LinkedIn Post/Banner, Twitter Post/Header, Pinterest Pin, WhatsApp Status | Optimized for engagement, scrollable feeds |
| **Video** | 3 | YouTube Thumbnail/Banner, Video Cover | Click-worthy, readable at small sizes |
| **Print** | 8 | Event Poster, Portrait/Landscape Poster, Flyer A4/A5, Business Card, Invitation, Certificate, Brochure | High resolution, professional hierarchy |
| **Presentations** | 2 | 16:9 and 4:3 Presentations | Clean layouts, readable from distance |
| **Marketing** | 6 | Web Banner, Email Header, Billboard, Announcement, Leaderboard Ad, Square Ad | CTAs prominent, quick comprehension |
| **Documents** | 4 | Letterhead, Resume, Report Cover, Book Cover | Formal, whitespace preserved |

### Format Data Structure

```typescript
interface CreativeFormat {
  id: string              // e.g., 'instagram_story'
  label: string           // e.g., 'Instagram Story'
  category: string        // e.g., 'social_media'
  aspectRatio: string     // e.g., '9:16'
  width: number           // e.g., 1080
  height: number          // e.g., 1920
  popular?: boolean       // Featured in UI
  useCases?: string[]     // Recommended use cases
}
```

### All Formats by Category

#### Social Media (12 formats)
| Format | Aspect Ratio | Dimensions | Use Cases |
|--------|--------------|------------|-----------|
| Instagram Post | 1:1 | 1080×1080 | Feed posts, carousel, product showcase |
| Instagram Story | 9:16 | 1080×1920 | Full-screen stories, highlights |
| Instagram Reel Cover | 9:16 | 1080×1920 | Reel video cover images |
| Facebook Post | 1.91:1 | 1200×630 | Feed posts, link previews |
| Facebook Cover | 2.7:1 | 820×312 | Page/event/group cover |
| Facebook Ad | 1:1 | 1080×1080 | Sponsored posts, carousel ads |
| LinkedIn Post | 1.91:1 | 1200×627 | Professional feed posts |
| LinkedIn Banner | 4:1 | 1584×396 | Profile/company page banner |
| Twitter/X Post | 16:9 | 1600×900 | Tweet images, threads |
| Twitter/X Header | 3:1 | 1500×500 | Profile banner |
| Pinterest Pin | 2:3 | 1000×1500 | Vertical pins, infographics |
| WhatsApp Status | 9:16 | 1080×1920 | Full-screen status updates |

#### Video (3 formats)
| Format | Aspect Ratio | Dimensions | Use Cases |
|--------|--------------|------------|-----------|
| YouTube Thumbnail | 16:9 | 1280×720 | Eye-catching video thumbnails |
| YouTube Banner | 16:9 | 2560×1440 | Channel art and branding |
| Video Cover | 16:9 | 1920×1080 | Generic video/podcast covers |

#### Print (8 formats)
| Format | Aspect Ratio | Dimensions | Use Cases |
|--------|--------------|------------|-----------|
| Event Poster | 4:5 | 1080×1350 | Events, seminars, workshops |
| Portrait Poster | 9:16 | 1080×1920 | Standees, roll-ups, displays |
| Landscape Poster | 16:9 | 1920×1080 | Banners, wide displays |
| Flyer (A5) | 1:1.41 | 1748×2480 | Handouts, promotions |
| Flyer (A4) | 1:1.41 | 2480×3508 | Posters, notices |
| Business Card | 1.75:1 | 1050×600 | Contact cards |
| Invitation | 5:7 | 1500×2100 | Events, weddings, corporate |
| Certificate | 1.41:1 | 3508×2480 | Awards, appreciation |

---

## 2. Base Patterns (10 Patterns for 37+ Formats)

The system uses **10 scalable base patterns** to handle all 37+ formats efficiently.

### Pattern Mapping

| Pattern ID | Formats Mapped | Key Focus |
|------------|----------------|-----------|
| `square_social` | Instagram Post, Facebook Ad, Square Ad | 1:1 engagement, centered content |
| `portrait_story` | Instagram Story/Reel, TikTok, WhatsApp Status, Portrait Poster | 9:16 full-screen, vertical flow |
| `landscape_feed` | Facebook Post, LinkedIn Post, Twitter Post, Landscape Poster | Wide feed content, horizontal balance |
| `banner_header` | All cover/banner formats (Facebook, LinkedIn, Twitter, YouTube, Web, Email) | Wide branding, text at edges |
| `thumbnail_click` | YouTube Thumbnail, Video Cover | Click-worthy, faces prominent, readable at small size |
| `print_portrait` | Flyers, Brochures, Pinterest | A4/A5 layouts, print hierarchy |
| `print_landscape` | Certificate, Presentations | Formal horizontal, clean zones |
| `event_poster` | Event Poster, Announcement | 4:5 event hierarchy, date/venue prominent |
| `formal_document` | Letterhead, Resume, Report Cover, Book Cover | Document standards, whitespace preserved |
| `ad_unit` | Leaderboard Ad, Business Card | Compact spaces, essential info only |

### Pattern Structure

```typescript
interface BasePattern {
  id: string
  aspectRatioRange: string

  textElements: Array<{
    id: string          // e.g., 'event_name'
    role: 'headline' | 'subheadline' | 'body' | 'label'
    emphasis: 'high' | 'medium' | 'low'
  }>

  layout: {
    zones: Array<{
      id: string
      position: 'top' | 'center' | 'bottom'
      heightPercentage: number
    }>
    safeAreas: Array<{
      id: string
      description: string
      reason: string
    }>
  }

  typography: {
    mood: string
    fontPairs: string[]
  }

  visuals: {
    recommended: string[]
    avoid: string[]
  }

  negativePrompts: {
    base: string[]
    typeSpecific: string[]
  }

  promptTemplate: string
}
```

---

## 3. Verticals (8 Yi Initiatives)

### Vertical Overview

| Vertical | Keywords | Common Event Types | Visual Themes |
|----------|----------|-------------------|---------------|
| **Masoom** | child safety, protection, education, awareness | awareness workshop, safety training, parent session | Children, schools, protective adults |
| **Road Safety** | traffic, helmet, seatbelt, driving, accident prevention | awareness drive, safety pledge, helmet distribution | Traffic signs, helmets, yellow caution colors |
| **Climate Change** | environment, sustainability, green, carbon, plantation | tree plantation, clean drive, sustainability workshop | Nature, green tones, earth imagery |
| **Yuva** | youth, career, skills, entrepreneurship, education | career fair, skill workshop, mentorship session | Dynamic youth, laptops, energy |
| **Thalir** | culture, heritage, arts, tradition, festival | cultural fest, art exhibition, heritage walk | Traditional arts, cultural elements |
| **Health** | medical, wellness, fitness, nutrition | health camp, blood donation, wellness workshop | Medical symbols, caring hands |
| **Innovation** | technology, digital, AI, startup | tech workshop, hackathon, innovation summit | Tech imagery, modern, futuristic |
| **Chapter Events** | meeting, conference, celebration | general chapter events | Professional, corporate |

### Vertical Data Structure (Database)

```typescript
interface VerticalPreset {
  id: string
  name: string                    // Display name
  slug: string                    // URL-friendly identifier
  description?: string
  icon?: string
  display_order?: number
  is_active?: boolean
  form_fields: JsonSchema         // Dynamic form fields for this vertical
  theme_config: ThemeConfig       // Color scheme and visual settings
  prompt_template: string         // AI generation prompt context
}
```

---

## 4. Dynamic Form Fields

### Two-Tier Field System

1. **Static Schemas** (Fallback)
   - Location: `lib/schemas/creativeSchemas.ts`
   - 13 predefined schemas
   - Used when AI generation isn't available

2. **Dynamic Schemas** (AI-Generated)
   - Generated via Gemini API
   - Context-aware based on format + vertical
   - Prioritized when available

### Available Field Types

| Type | Use Case | AI Suggestable | Notes |
|------|----------|----------------|-------|
| `text` | Titles, names, CTAs | Yes (titles, CTAs) | Max 150 chars recommended |
| `textarea` | Descriptions, content | Yes | 2-4 rows typical |
| `date` | Event dates | No | Date picker UI |
| `time` | Event times | No | Time input UI |
| `select` | Predefined options | No | Dropdown with options |

### Format-Specific Field Rules

| Format Category | Include | Exclude |
|-----------------|---------|---------|
| **Social Media** | headline, caption, CTA, hashtags | venue, date, time |
| **Certificates** | recipient, achievement, authority, date | hashtags, CTA |
| **Event Posters** | date, time, venue, speaker, description | hashtags |
| **Marketing** | headline, message, offer, CTA | venue details, speaker |
| **Video Covers** | title, hook, CTA | event details, venue |

### Static Schema Types

- `certificate` - Awards, recognition, completion
- `socialMediaPost` - Instagram, Facebook, Twitter, LinkedIn
- `eventPoster` - Event announcements, posters
- `youtubeThumbnail` - Video thumbnails, covers
- `invitation` - Event invitations
- `presentation` - Slide presentations
- `businessCard` - Contact cards
- `flyer` - A4/A5 promotional flyers
- `instagramStory` - Vertical story formats
- `announcement` - General announcements
- `emailHeader` - Email headers/signatures
- `blogPost` - Articles, blog content
- `marketingMaterial` - Ads, banners, billboards

---

## 5. AI Prompts System (3-Stage Pipeline)

### Pipeline Overview

```
User Input → Stage 0 → Stage 0.5 → Stage 1 → Stage 2 → AI Model
             Form       Ultra-Pro    Design     Model
             Compile    (Claude)     Intel      Adapt
```

### Stage 0: Form Data Compilation

Compiles raw user input into structured data with organization context.

```typescript
// Input
userFormData = {
  title: "Tech Summit 2024",
  speaker: "Jane Doe",
  date: "March 16, 2024"
}

// Output
compiledData = {
  eventName: "Tech Summit 2024",
  speakerName: "Jane Doe",
  speakerDesignation: "CTO",
  organizationName: "Yi Salem",
  organizationColors: ["#1B998B", "#FF6B35"]
}
```

### Stage 0.5: Ultra-Pro Prompt (Claude)

Transforms form data into optimized image prompts.

```typescript
interface UltraProPrompt {
  primaryText: string           // MUST appear in image
  secondaryText: string[]       // Supporting text elements
  visualScene: string           // Background description
  designGuidance: string        // Creative direction
  textPlacementHints: string    // Where text should go
  colorPaletteHints: string     // Color suggestions
  mustIncludeElements: string[] // Required visual elements
  enhancedPrompt: string        // Complete image prompt
}
```

### Stage 1: Design Intelligence (AI Context)

Generates PURPOSE-DRIVEN design context using AI.

```typescript
interface DesignContext {
  corePurpose: string          // Emotional job design must accomplish
  desiredAction: string        // What viewers should DO
  emotionalJob: string         // How viewers should FEEL
  visualElements: string[]     // Elements that BELONG in design
  backgroundSetting: string    // Appropriate backdrop
  iconicImagery: string[]      // Reinforcing message imagery
  colorMood: string            // Color psychology guidance
  designStrategy: string       // Strategic visual approach
  successMetric: string        // How to know it worked
}
```

**Example Output:**
```
Format: event_poster + Vertical: health + Event: blood_donation

→ corePurpose: "Honor donors as heroes of community health"
→ desiredAction: "Register to donate blood"
→ visualElements: ["red cross symbols", "grateful faces", "medical imagery"]
→ backgroundSetting: "Hospital or community center with warm atmosphere"
```

### Stage 2: Model-Specific Adaptation

Builds final prompts optimized for each AI model.

**Gemini (Narrative-focused):**
```
"Create an award-winning event poster featuring a professional
corporate backdrop with clean geometry and warm golden lighting.
The design communicates trust through careful typography and
color harmony. Include "[event name]" prominently..."
```

**Ideogram (Concise):**
```
"Award-winning corporate event poster, professional geometric layout
with warm lighting, emphasizing "[event name]", bold typography"
```

---

## 6. Prompt Engineering Patterns

### Pattern 1: Rich Descriptions (Not Tags)

Use vivid narratives instead of keyword tags.

```
❌ BAD:  "corporate, professional, blue, modern"

✅ GOOD: "confident boardroom at golden hour, where success feels
         inevitable, polished glass and brushed steel surfaces,
         premium matte paper textures"
```

### Pattern 2: Theme Atmospheres (22 Themes)

Each theme has 4 dimensions: mood + lighting + ambiance + materiality.

```javascript
THEME_ATMOSPHERES = {
  corporate: {
    mood: 'confident and trustworthy',
    lighting: 'Clean, even studio lighting with subtle gradients',
    ambiance: 'A boardroom at golden hour, where success feels inevitable',
    materiality: ['polished glass', 'brushed steel', 'premium matte paper']
  },
  playful: {
    mood: 'joyful and energetic',
    lighting: 'Bright, colorful lighting with dynamic shadows',
    ambiance: 'A celebration in full swing, confetti in the air',
    materiality: ['glossy surfaces', 'balloons', 'party textures']
  },
  elegant: {
    mood: 'sophisticated and refined',
    lighting: 'Soft, diffused lighting with golden accents',
    ambiance: 'A grand ballroom with chandeliers and velvet drapes',
    materiality: ['silk', 'gold leaf', 'marble', 'crystal']
  }
  // ... 19 more themes
}
```

### Pattern 3: Style Treatments (16 Styles)

Visual treatment narratives for each style.

```javascript
STYLE_TREATMENTS = {
  gradient: "Smooth, flowing color transitions creating depth through gradual shifts",
  glassmorphism: "Frosted glass panels with soft blur and subtle transparency",
  neon_glow: "Electric neon lighting with vivid glowing edges against dark backdrop",
  flat_design: "Clean, solid colors with sharp edges and minimal shadows",
  duotone: "Two-color palette creating striking visual contrast",
  watercolor: "Soft, organic edges with paint-like texture and flow",
  geometric: "Bold shapes and patterns creating structured visual rhythm"
  // ... 9 more styles
}
```

### Pattern 4: Canvas Safety Rules

Critical constraints to prevent common AI failures.

```
⚠️ ZERO TOLERANCE CANVAS RULES

FORBIDDEN:
❌ Gray bars on edges
❌ Letterboxing/pillarboxing
❌ Empty space around design
❌ Border frames
❌ Poster mockup (poster on wall, framed)

REQUIRED:
✅ Design extends to ALL FOUR EDGES
✅ Every pixel filled with content
✅ Full bleed edge-to-edge
✅ Exact specified dimensions
```

### Pattern 5: Text Rendering Excellence

All visible text MUST appear in quotes for AI models.

```
CRITICAL TEXT RENDERING RULES:

1. Quote all text exactly: "Tech Summit 2024"
2. Specify hierarchy: headline, subheading, body
3. Require legibility: high contrast, readable size
4. Define safe zones: avoid logo overlap areas

Example:
Render EXACTLY as the headline: "Tech Summit 2024"
Secondary text: "March 16, 2024 | Jane Doe, CTO"
Footer: "Grand Convention Center, Chennai"
```

### Pattern 6: Negative Prompts

Anti-pattern guidance to prevent unwanted results.

```javascript
NEGATIVE_PROMPTS = {
  // Always exclude
  base: [
    'blurry text', 'misspelled text', 'illegible text',
    'low quality', 'amateur design', 'clipart', 'watermarks',
    'cropped text', 'cut off elements'
  ],

  // Poster-specific
  poster: [
    'poster on wall', 'mockup presentation', 'framed poster',
    'white border', 'mat frame', 'gallery wall', 'room interior'
  ],

  // Style-specific
  flat_design: ['gradients', 'shadows', '3d effects', 'depth'],
  minimalist: ['busy', 'cluttered', 'ornate', 'decorative patterns'],
  geometric: ['organic shapes', 'photographic elements'],
  photographic: ['illustrated elements', 'cartoon', 'flat design']
}
```

### Pattern 7: Resolution-Aware Detail

Different detail levels based on output resolution.

```javascript
RESOLUTION_MODIFIERS = {
  '1K': {
    textureDetail: 'subtle, fine details visible at 1080p',
    edgeQuality: 'clean, precise edges',
    microDetail: 'refined texture details'
  },
  '2K': {
    textureDetail: 'high detail, visible surface textures',
    edgeQuality: 'ultra-sharp edges with photographic precision',
    microDetail: 'intricate texture work and fine details'
  },
  '4K': {
    textureDetail: 'exceptional detail with cinema-quality textures',
    edgeQuality: 'flawless edges at extreme magnification',
    microDetail: 'cinematography-grade detail work'
  }
}
```

---

## 7. Color System

### Predefined Color Schemes

| Scheme | Narrative Description |
|--------|----------------------|
| `teal_orange` | Dynamic gradient flowing from refreshing teal to energetic orange, creating visual movement and warmth |
| `purple_gold` | Royal purple with luxurious gold accents, conveying elegance and premium quality |
| `navy_coral` | Deep navy providing stability with vibrant coral adding warmth and approachability |
| `emerald_silver` | Natural emerald with modern silver sophistication, fresh yet professional |
| `burgundy_cream` | Rich burgundy with elegant cream, classic and timeless sophistication |
| `ocean_sunset` | Deep ocean blues transitioning to warm sunset oranges and pinks |

### Brand Default Palette

Dynamically generated from organization colors:

```
"A cohesive brand palette anchored by [primary color],
complemented by [secondary color], with [accent color]
providing strategic highlights that draw attention to
key information while maintaining brand recognition."
```

### Color Narrative Generation

Colors are described in natural language, not hex codes:

```javascript
// Input: #1B998B
// Output: "vibrant teal that conveys trust and innovation"

// Input: #FF6B35
// Output: "energetic orange that creates warmth and excitement"
```

---

## 8. Prompt Improvement Opportunities

### Current Strengths

1. ✅ Rich narrative descriptions (not tag-based)
2. ✅ Multi-stage AI pipeline (compile → optimize → context → adapt)
3. ✅ Format-aware templates with specific guidance
4. ✅ Strong negative prompt coverage
5. ✅ Model-specific optimization (Gemini vs Ideogram)
6. ✅ Logo awareness and safe zones

### Areas for Improvement

#### 1. Vertical-Specific Visual Guidance

**Current:** Generic visual guidance for all verticals

**Improvement:** Add unique imagery per vertical

```
Road Safety → yellow caution imagery, traffic signs, helmets, zebra crossings
Health → medical symbols, caring hands, healthy people, clinical settings
Masoom → children, schools, protective adults, educational settings
Yuva → dynamic youth, laptops, entrepreneurial energy, modern workspaces
Climate Change → nature imagery, green tones, earth, sustainability symbols
```

#### 2. Event Type Detection

**Improvement:** Better analyze event titles to infer context

| Event Keywords | Inferred Setting |
|----------------|------------------|
| workshop, training | Indoor classroom, whiteboards |
| rally, drive, awareness | Outdoor, crowds, energy |
| camp, checkup | Clinical, organized, caring |
| conference, summit | Corporate venue, professional |
| fest, celebration | Festive, colorful, joyful |

#### 3. Indian Cultural Context

**Improvement:** Add India-specific elements

- Festival awareness (Diwali, Pongal, Holi color schemes)
- Regional architectural styles
- Traditional color symbolism (saffron for spirituality, green for prosperity)
- Local venue types (community halls, temple grounds, college auditoriums)

#### 4. Text Hierarchy Emphasis

**Improvement:** Stronger text rendering requirements

- Primary text should occupy 15-25% of canvas height
- Minimum contrast ratio requirements
- Safe zones for text placement avoiding logo areas
- Font size relative to canvas dimensions

---

## 9. Key Files Reference

### Core Prompt System

| File | Purpose |
|------|---------|
| `lib/prompts/core/prompt-builder.ts` | Builds model-agnostic PromptIntent |
| `lib/prompts/adapters/gemini-adapter.ts` | Gemini-specific prompt formatting |
| `lib/prompts/adapters/ideogram-adapter.ts` | Ideogram-specific prompt formatting |

### AI Services

| File | Purpose |
|------|---------|
| `lib/prompts/services/design-intelligence.ts` | AI context generation (Stage 1) |
| `lib/prompts/services/ultra-pro-prompt.ts` | Claude-based optimization (Stage 0.5) |
| `lib/prompts/services/form-data-compiler.ts` | Form data compilation (Stage 0) |

### Data & Configuration

| File | Purpose |
|------|---------|
| `lib/prompts/data/theme-atmospheres.ts` | 22 theme definitions |
| `lib/prompts/data/style-treatments.ts` | 16 style definitions |
| `lib/prompts/data/audience-contexts.ts` | Event audience narratives |
| `lib/prompts/data/resolution-modifiers.ts` | Quality/texture definitions |

### Knowledge Base

| File | Purpose |
|------|---------|
| `lib/prompts/knowledge-base/base-patterns/` | 10 format pattern definitions |
| `lib/prompts/knowledge-base/format-mapping.ts` | Format-to-pattern mappings |
| `lib/prompts/knowledge-base/format-overrides/` | Format-specific customizations |

### Helpers

| File | Purpose |
|------|---------|
| `lib/prompts/helpers/color-narrative.ts` | Natural language color descriptions |
| `lib/prompts/helpers/text-rendering.ts` | Text placement & rendering |
| `lib/prompts/helpers/logo-awareness.ts` | Logo safe zone guidance |
| `lib/prompts/helpers/customization.ts` | UI customization narratives |

### Schemas & Configuration

| File | Purpose |
|------|---------|
| `lib/schemas/creativeSchemas.ts` | Static field schemas (13 types) |
| `lib/config/creative-formats.ts` | All 37+ format definitions |
| `lib/config/design-constants.ts` | Themes, styles, resolutions |

### API Routes

| File | Purpose |
|------|---------|
| `app/api/generate/route.ts` | Main generation orchestration |
| `app/api/generate-fields/route.ts` | Dynamic field generation |
| `app/api/suggest-fields/route.ts` | AI field value suggestions |

---

## 10. Quick Reference: What to Modify

| Goal | File to Modify |
|------|----------------|
| Add new theme | `lib/prompts/data/theme-atmospheres.ts` |
| Add new style | `lib/prompts/data/style-treatments.ts` |
| Improve format prompts | `lib/prompts/knowledge-base/base-patterns/*.ts` |
| Add vertical context | `lib/prompts/generate-fields-prompt.ts` |
| Improve text rendering | `lib/prompts/helpers/text-rendering.ts` |
| Add negative prompts | Pattern files or `lib/prompts/adapters/*.ts` |
| Improve color narratives | `lib/prompts/helpers/color-narrative.ts` |
| Add new format | `lib/config/creative-formats.ts` + create pattern |
| Modify field schemas | `lib/schemas/creativeSchemas.ts` |
| Change generation logic | `app/api/generate/route.ts` |

---

## Contributing

When modifying prompts:

1. **Test with multiple formats** - Ensure changes work across different format types
2. **Check both AI models** - Test with both Gemini and Ideogram
3. **Verify text rendering** - Ensure text appears correctly in generated images
4. **Review negative prompts** - Add new anti-patterns as discovered
5. **Document changes** - Update this knowledge base with new patterns

---

*Last Updated: December 2024*
*Yi CreativeStudio Team*
