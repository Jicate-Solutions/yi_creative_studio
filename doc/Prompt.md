# Yi CreativeStudio: Gemini API Prompt System v2.0

## Key Insights from Gemini Documentation

Based on official Gemini API documentation, here are the critical principles:

### 1. Describe the Scene, Don't List Keywords
❌ `certificate, gold, elegant, formal, navy blue, border`
✅ `A prestigious formal certificate with an ornate gold border on cream parchment paper. The recipient's name appears prominently in elegant calligraphy...`

### 2. Use Structured Format with XML Tags
Gemini recommends XML-style tags for clarity:
```xml
<subject>What is in the image</subject>
<composition>How it's arranged</composition>
<style>Visual style and mood</style>
<text_content>Any text to render</text_content>
<constraints>What to avoid</constraints>
```

### 3. Use Few-Shot Examples
Always include examples when possible - they're more effective than instructions.

### 4. Use Prefixes
- Input prefix: Marks the input
- Output prefix: Guides the response format
- Example prefix: Labels in few-shot prompts

### 5. Text Rendering Rules
- Keep text to **25 characters or less** per element
- Use **2-3 distinct phrases** maximum
- Expect occasional variations in placement

### 6. Control Camera/Composition
Use photographic terms: wide-angle, macro, low-angle, portrait, etc.

---

# PROMPT ARCHITECTURE

## API Request Structure

```typescript
interface GeminiImageRequest {
  model: "gemini-2.5-flash-image" | "gemini-3-pro-image-preview";
  generationConfig: {
    responseModalities: ["TEXT", "IMAGE"];
    temperature?: number;  // Default 1.0 for Gemini 3
    maxOutputTokens?: number;
  };
  contents: [{
    role: "user";
    parts: [{
      text: string;  // The structured prompt
    }];
  }];
  systemInstruction?: {
    parts: [{
      text: string;  // System context
    }];
  };
}
```

## System Instruction (Constant)

```typescript
const SYSTEM_INSTRUCTION = `
You are Yi CreativeStudio's image generation engine. You create professional marketing and design assets for NGOs and businesses in India.

Your outputs must be:
- Professional and print-ready quality
- Culturally appropriate for Indian audiences
- Brand-consistent when brand guidelines are provided
- Clear and legible text when text is included

When generating images:
1. Follow the structured prompt format provided
2. Render text clearly and legibly (max 25 characters per text element)
3. Maintain proper visual hierarchy
4. Use colors and styles appropriate for the format type
5. Ensure the composition works for the specified aspect ratio
`;
```

---

# STRUCTURED PROMPT TEMPLATES

## Base Prompt Structure

```typescript
interface StructuredPrompt {
  format: string;           // certificate, event_poster, instagram_post, etc.
  aspectRatio: string;      // 1:1, 16:9, 9:16, 4:5, etc.
  
  subject: string;          // Main subject/purpose
  composition: string;      // Layout and arrangement
  textContent: TextElement[];
  style: StyleConfig;
  constraints: string[];
  
  // Optional
  examples?: FewShotExample[];
  brandContext?: BrandContext;
  verticalContext?: VerticalContext;
}

interface TextElement {
  role: "headline" | "subheadline" | "body" | "cta" | "date" | "name" | "title";
  text: string;
  prominence: "largest" | "prominent" | "medium" | "small";
  style?: string;
}

interface StyleConfig {
  visualStyle: string;
  colorPalette: string;
  mood: string;
  references?: string[];
}

interface FewShotExample {
  description: string;
  quality: "good" | "avoid";
}
```

---

# FORMAT-SPECIFIC PROMPTS

## 1. CERTIFICATE

### Prompt Template

```typescript
function buildCertificatePrompt(data: CertificateFormData): string {
  return `
<task>Generate a prestigious, professional certificate design</task>

<format>
Type: Formal Certificate
Aspect Ratio: Landscape (1.41:1, A4 proportions)
Purpose: Official recognition document that will be printed, framed, and displayed
</format>

<subject>
A formal certificate of ${data.certificateTitle || 'achievement'} presented to recognize accomplishment.
This is an official document representing institutional authority and prestige.
</subject>

<composition>
Layout: Centered, symmetrical, formal arrangement
- Decorative border framing the entire document (${data.style === 'modern' ? 'clean geometric lines with subtle gold accents' : 'ornate Victorian-style scrollwork with corner flourishes'})
- Organization logo positioned top-left
- Official seal or emblem positioned top-right
- Certificate title centered in upper third
- Recipient name as the dominant central element (largest text)
- Achievement description below recipient name
- Signature lines in bottom third, equally spaced
- Date and certificate number at bottom
Background: ${data.style === 'modern' ? 'Pure white with subtle texture' : 'Cream/ivory aged parchment paper texture'}
</composition>

<text_content>
<text role="title" prominence="prominent" style="elegant serif, navy blue">${data.certificateTitle || 'CERTIFICATE OF ACHIEVEMENT'}</text>
<text role="preface" prominence="small" style="refined serif, dark gray">This is to certify that</text>
<text role="name" prominence="largest" style="${data.style === 'modern' ? 'bold elegant serif' : 'flowing calligraphy script'}, gold or navy">${data.recipientName}</text>
<text role="description" prominence="medium" style="clean serif, dark gray">${data.achievementDescription || 'has successfully completed the program'}</text>
${data.signatoryName ? `<text role="signatory" prominence="small" style="clean serif">${data.signatoryName}${data.signatoryDesignation ? ', ' + data.signatoryDesignation : ''}</text>` : ''}
${data.dateIssued ? `<text role="date" prominence="small" style="small caps">${formatDate(data.dateIssued)}</text>` : ''}
${data.certificateNumber ? `<text role="reference" prominence="small" style="monospace">Certificate No: ${data.certificateNumber}</text>` : ''}
</text_content>

<style>
Visual Style: ${data.style === 'modern' ? 'Contemporary elegant, minimalist formal' : 'Classic traditional, Victorian-inspired'}
Color Palette: ${getColorPalette(data.style)}
Mood: Prestigious, authoritative, celebratory, worthy of framing
Typography: Elegant, formal, clear hierarchy with recipient name as focal point
Decorative Elements: ${data.style === 'modern' ? 'Subtle geometric accents, thin line borders' : 'Ornate corner flourishes, decorative underlines, seal with embossed effect'}
</style>

<quality_markers>
- Print-ready, high-resolution output
- Frame-worthy presentation
- Professional enough for corporate or academic display
- Clear visual hierarchy with recipient name most prominent
- All text clearly legible
- Balanced, symmetrical composition
</quality_markers>

<constraints>
Avoid: Blurry or pixelated elements, clipart, cartoon graphics, casual or playful fonts, neon or bright colors, busy patterns, crowded layout, poor text hierarchy, stock photo elements, modern casual aesthetic
</constraints>
`.trim();
}

function getColorPalette(style: string): string {
  const palettes = {
    classic: 'Navy blue (#1e3a5f) for text, antique gold (#d4af37) for accents, cream (#f5f5dc) background',
    modern: 'Charcoal gray (#36454f) for text, silver (#c0c0c0) for accents, white background',
    corporate: 'Corporate blue (#002366) for text, gold (#c9a227) for accents, white background',
    academic: 'Burgundy (#722f37) for text, bronze (#cd7f32) for accents, ivory (#fffff0) background'
  };
  return palettes[style] || palettes.classic;
}
```

### Few-Shot Examples for Certificate

```typescript
const CERTIFICATE_EXAMPLES = `
<examples>
<example type="good">
A prestigious certificate with an ornate gold border featuring intricate corner scrollwork. The cream parchment background has subtle aging texture. "CERTIFICATE OF EXCELLENCE" appears in elegant navy serif at top. The recipient name "SARAH JOHNSON" is the largest element, written in beautiful gold calligraphy script, underlined with decorative flourishes. Achievement text below in refined serif. Official embossed seal top-right. Two signature lines at bottom. Frame-worthy, professional quality.
</example>

<example type="avoid">
A certificate with rainbow border, Comic Sans font, bright neon colors, multiple clipart images, inconsistent text sizes, no clear hierarchy, busy patterned background. Looks like a children's participation certificate rather than a formal professional document.
</example>
</examples>
`;
```

---

## 2. EVENT POSTER

### Prompt Template

```typescript
function buildEventPosterPrompt(data: EventPosterFormData): string {
  const eventContext = getEventContext(data.eventType);
  
  return `
<task>Generate a professional event poster that captures attention and communicates essential details</task>

<format>
Type: Event Promotional Poster
Aspect Ratio: Portrait 4:5 (optimal for both print and social sharing)
Purpose: Announce upcoming event, attract target audience, drive registrations
</format>

<subject>
A dynamic, eye-catching event poster for "${data.eventName}".
Event Type: ${data.eventType || 'Professional event'}
Target Audience: ${data.targetAudience || 'General professional audience'}
The poster must communicate: What (event name), When (date/time), Where (venue), and How (registration).
</subject>

<composition>
Layout: Clear vertical hierarchy optimized for quick scanning
- Organization logo at top (small, establishing brand)
- Event name as dominant headline in top third (largest, most impactful)
- ${data.eventDescription ? 'Tagline/description below headline' : ''}
- Event details section with clear iconography:
  • Date with calendar icon
  • Time with clock icon  
  • Venue with location pin icon
- ${data.speakerName ? 'Featured speaker section with photo placeholder area' : ''}
- Strong call-to-action button near bottom
- ${data.entryFee ? 'Entry fee/pricing clearly visible' : ''}
- ${data.registrationInfo ? 'Registration link or QR code at bottom' : ''}

Background: ${eventContext.background}
Visual Elements: ${eventContext.visualElements}
</composition>

<text_content>
<text role="headline" prominence="largest" style="bold impactful sans-serif, ${eventContext.primaryColor}">${data.eventName}</text>
${data.eventDescription ? `<text role="subheadline" prominence="prominent" style="clean sans-serif, lighter weight">${data.eventDescription}</text>` : ''}
<text role="date" prominence="medium" style="bold, clear">📅 ${formatEventDate(data.eventDate)}</text>
${data.eventTime ? `<text role="time" prominence="medium" style="bold, clear">🕐 ${data.eventTime}</text>` : ''}
<text role="venue" prominence="medium" style="clear sans-serif">📍 ${data.venue}</text>
${data.speakerName ? `<text role="speaker" prominence="medium" style="medium weight">Featuring: ${data.speakerName}${data.speakerDesignation ? ', ' + data.speakerDesignation : ''}</text>` : ''}
${data.entryFee ? `<text role="price" prominence="medium" style="highlighted">${data.entryFee}</text>` : ''}
<text role="cta" prominence="prominent" style="bold, button-style, contrasting color">${data.registrationInfo || 'REGISTER NOW'}</text>
</text_content>

<style>
Visual Style: ${eventContext.style}
Color Palette: ${eventContext.colors}
Mood: ${eventContext.mood}
Typography: Bold, modern sans-serif for headlines; clean readable fonts for details
Icons: Simple, modern iconography for date/time/venue
</style>

<quality_markers>
- Passes the 3-second test: viewer understands WHAT, WHEN, WHERE instantly
- Readable from both close-up (phone) and distance (printed poster)
- Professional marketing quality
- Clear visual hierarchy
- All text clearly legible
- Balanced composition with breathing room
</quality_markers>

<constraints>
Avoid: Cluttered layout, tiny text, poor hierarchy, generic stock photo feel, unprofessional design, too many fonts, competing focal points, low contrast text, landscape orientation
</constraints>
`.trim();
}

function getEventContext(eventType: string): EventContext {
  const contexts = {
    conference: {
      background: 'Sleek corporate background with abstract blue geometric shapes, subtle light effects, professional atmosphere',
      visualElements: 'Stage silhouette, microphone icon, professional networking imagery',
      style: 'Corporate professional, modern business',
      colors: 'Deep blue (#003366), white, gold accent',
      mood: 'Professional, authoritative, networking-focused',
      primaryColor: 'white on dark blue'
    },
    workshop: {
      background: 'Warm, inviting gradient background suggesting collaboration and learning',
      visualElements: 'Hands-on activity suggestion, learning icons, collaborative feel',
      style: 'Friendly professional, approachable',
      colors: 'Blue (#0066cc), orange (#ff6600), white',
      mood: 'Educational, interactive, welcoming',
      primaryColor: 'dark on light'
    },
    health_camp: {
      background: 'Fresh, clean gradient with soft green and white, subtle medical or wellness symbols',
      visualElements: 'Health symbols, stethoscope, heart, wellness imagery',
      style: 'Clean, trustworthy, healthcare-appropriate',
      colors: 'Fresh green (#28a745), white, soft blue accent',
      mood: 'Caring, professional, health-focused',
      primaryColor: 'dark green on white'
    },
    concert: {
      background: 'Dynamic background with stage lights, crowd silhouettes, energetic atmosphere',
      visualElements: 'Stage lighting, crowd energy, musical elements',
      style: 'Entertainment, high-energy, exciting',
      colors: 'Purple (#8b00ff), electric blue (#00d4ff), pink, neon accents',
      mood: 'Exciting, energetic, entertainment',
      primaryColor: 'bright on dark'
    },
    community: {
      background: 'Warm, welcoming background with community gathering feel, earth tones',
      visualElements: 'People together, unity symbols, inclusive imagery',
      style: 'Warm, inclusive, community-focused',
      colors: 'Warm orange (#ff8c00), yellow (#ffd700), earth tones',
      mood: 'Welcoming, inclusive, community spirit',
      primaryColor: 'dark on warm'
    },
    tech: {
      background: 'Futuristic background with circuit patterns, digital elements, tech aesthetic',
      visualElements: 'Code snippets, circuit patterns, innovation symbols',
      style: 'Modern tech, innovative, cutting-edge',
      colors: 'Electric blue (#00d4ff), purple (#7b68ee), dark background',
      mood: 'Innovative, technical, forward-thinking',
      primaryColor: 'bright on dark'
    },
    sports: {
      background: 'Dynamic, energetic background suggesting motion and athletic activity',
      visualElements: 'Athletic motion, sports equipment silhouettes, energy',
      style: 'Dynamic, athletic, high-energy',
      colors: 'Bold red (#dc3545), black, white, energetic accents',
      mood: 'Competitive, energetic, athletic',
      primaryColor: 'white on bold'
    },
    children: {
      background: 'Playful, colorful background with child-friendly elements, safe and fun atmosphere',
      visualElements: 'Playful graphics, balloons, stars, child-safe imagery',
      style: 'Playful, safe, family-friendly',
      colors: 'Primary colors, pastels, bright and cheerful',
      mood: 'Fun, safe, engaging for families',
      primaryColor: 'colorful on light'
    }
  };
  
  return contexts[eventType] || {
    background: 'Modern gradient background, professional and engaging',
    visualElements: 'Relevant thematic elements',
    style: 'Professional, modern, attention-grabbing',
    colors: 'Vibrant, professional, brand-appropriate',
    mood: 'Professional, engaging, promotional',
    primaryColor: 'high contrast'
  };
}
```

---

## 3. INSTAGRAM POST

### Prompt Template

```typescript
function buildInstagramPrompt(data: InstagramFormData): string {
  const postContext = getInstagramContext(data.postType);
  
  return `
<task>Generate a scroll-stopping Instagram post that demands attention in a crowded feed</task>

<format>
Type: Instagram Feed Post
Aspect Ratio: Square 1:1 (1080x1080 equivalent)
Purpose: Stop the scroll, communicate message instantly, drive engagement
Viewing Context: Mobile phone feed, thumbnail size, competing with many other posts
</format>

<subject>
An eye-catching social media graphic for: "${data.postTitle}"
Post Type: ${data.postType || 'Announcement'}
Goal: ${postContext.goal}
Must capture attention within 0.5-1 second of viewing.
</subject>

<composition>
Layout: ${postContext.layout}
- Bold, uncluttered design with clear focal point
- Text sized for mobile readability (imagine viewing on phone screen)
- Breathing room around all elements
- Brand logo space in corner
- ${data.callToAction ? 'Clear call-to-action element' : ''}

Background: ${postContext.background}
Visual Treatment: ${postContext.visualTreatment}
</composition>

<text_content>
<text role="headline" prominence="largest" style="bold thick sans-serif, maximum contrast">${data.postTitle}</text>
${data.postCaption ? `<text role="supporting" prominence="medium" style="clean sans-serif">${data.postCaption}</text>` : ''}
${data.callToAction ? `<text role="cta" prominence="prominent" style="button-style, contrasting accent color">${data.callToAction}</text>` : ''}
</text_content>

<style>
Visual Style: ${postContext.style}
Color Palette: ${postContext.colors}
Mood: ${postContext.mood}
Typography: Bold, thick sans-serif that's readable on phone screens; avoid thin or light fonts
Energy: High-impact, attention-grabbing
</style>

<quality_markers>
- Passes the scroll-stop test: captures attention in under 1 second
- All text readable on phone without zooming
- Clear, single focal point
- Professional social media marketing quality
- Engagement-optimized design
- Mobile-first thinking
</quality_markers>

<constraints>
Avoid: Tiny text, cluttered composition, low contrast, boring/generic look, too much text (keep to 10 words max), thin fonts, busy background under text, hard to read on small screen, muted/dull colors
</constraints>
`.trim();
}

function getInstagramContext(postType: string) {
  const contexts = {
    announcement: {
      layout: 'Centered impact layout with headline as hero',
      background: 'Vibrant gradient (coral to orange, or brand colors)',
      visualTreatment: 'Bold, energetic, celebratory feel',
      style: 'Announcement, exciting, news-worthy',
      colors: 'Vibrant, saturated, high contrast (coral, orange, or brand palette)',
      mood: 'Exciting, important, attention-demanding',
      goal: 'Announce news and generate excitement'
    },
    quote: {
      layout: 'Quote-centered layout with large quotation marks as design element',
      background: 'Elegant gradient or solid background (deep purple, navy)',
      visualTreatment: 'Sophisticated, thoughtful, inspirational',
      style: 'Inspirational quote, typography-focused',
      colors: 'Elegant, sophisticated (deep colors with light text)',
      mood: 'Thoughtful, inspiring, shareable',
      goal: 'Inspire and encourage sharing'
    },
    educational: {
      layout: 'Clear hierarchy with numbered or bulleted points if needed',
      background: 'Clean, professional background',
      visualTreatment: 'Organized, clear, informative',
      style: 'Educational, helpful, informative',
      colors: 'Professional, trustworthy (blues, greens)',
      mood: 'Helpful, authoritative, valuable',
      goal: 'Educate and provide value'
    },
    promotional: {
      layout: 'Product/offer focused with clear CTA',
      background: 'Bold, commercial, attention-grabbing',
      visualTreatment: 'Sales-oriented, urgent, compelling',
      style: 'Promotional, sale, marketing',
      colors: 'Bold, contrasting, commercial (red accents for urgency)',
      mood: 'Urgent, valuable, action-driving',
      goal: 'Drive clicks and conversions'
    },
    motivational: {
      layout: 'Inspiring visual with overlaid text',
      background: 'Uplifting gradient or inspiring imagery suggestion',
      visualTreatment: 'Positive, uplifting, empowering',
      style: 'Motivational, inspiring',
      colors: 'Warm, uplifting (sunrise colors, optimistic palette)',
      mood: 'Empowering, positive, shareable',
      goal: 'Motivate and inspire engagement'
    }
  };
  
  return contexts[postType] || contexts.announcement;
}
```

---

## 4. YOUTUBE THUMBNAIL

### Prompt Template

```typescript
function buildYouTubeThumbnailPrompt(data: ThumbnailFormData): string {
  return `
<task>Generate a high-CTR YouTube thumbnail designed to maximize clicks in search and recommendations</task>

<format>
Type: YouTube Video Thumbnail
Aspect Ratio: Landscape 16:9 (1280x720 equivalent)
Viewing Size: Will display as small as 160x90 pixels - MUST be readable at tiny size
Purpose: Compete with 500+ other videos, trigger curiosity, drive clicks
</format>

<subject>
A click-worthy thumbnail for video: "${data.videoTitle}"
The thumbnail must communicate video value in 0.05 seconds.
${data.hasFace !== false ? 
  `Feature: Expressive human face with ${data.expression || 'excited'} expression, filling 50-60% of frame` : 
  `Feature: Compelling visual subject that draws the eye`}
</subject>

<composition>
Layout: Two-zone composition
- LEFT 60%: ${data.hasFace !== false ? 
    `Expressive face - ${getExpressionDescription(data.expression)}, well-lit, looking toward camera, high contrast with background` : 
    `Main visual subject - ${data.mainSubject || 'compelling focal point'}`}
- RIGHT 40%: Bold text hook - 3-5 words maximum, readable at tiny sizes
- AVOID: Bottom-right corner (YouTube duration badge overlay)
- AVOID: Bottom 10% (progress bar on hover)

Background: ${data.backgroundColor || 'Bright, saturated color that contrasts with subject'}
Subject Treatment: Well-lit, high contrast, pops from background
</composition>

<text_content>
<text role="hook" prominence="largest" style="BOLD thick sans-serif, ALL CAPS, thick black outline for contrast">${data.hookText || extractHook(data.videoTitle)}</text>
Note: Maximum 5 words. Must be readable when thumbnail is 160 pixels wide.
Text Color: ${data.textColor || 'Bright yellow or white'} with thick black outline
</text_content>

<style>
Visual Style: YouTube thumbnail style - bold, clickable, competitive with top creators
Color Palette: Bright, saturated, high contrast - ${data.accentColor || 'yellow, red, or electric blue'} for text
Mood: ${data.hasFace !== false ? getEmotionMood(data.expression) : 'Compelling, curiosity-triggering'}
Typography: Impact-style thick sans-serif, ALL CAPS, 3-5px black outline
Lighting: Dramatic lighting on subject, high contrast
</style>

<quality_markers>
- Readable at 160x90 pixels (thumbnail size in search results)
- Stands out among competitor thumbnails
- Triggers curiosity - viewer NEEDS to click
- Professional YouTuber quality
- ${data.hasFace !== false ? 'Face expression matches video emotion' : 'Clear compelling subject'}
- High contrast throughout
</quality_markers>

<constraints>
Avoid: Small text, thin fonts, muted colors, boring expression, cluttered composition, content in corners (especially bottom-right), too many elements, blurry face, generic stock photo feel, text over face, more than 5 words, low contrast
</constraints>
`.trim();
}

function getExpressionDescription(expression: string): string {
  const descriptions = {
    excited: 'Big enthusiastic smile, bright wide eyes, possibly thumbs up or pointing, radiating positive energy',
    shocked: 'Wide eyes, open mouth in genuine surprise, hands on cheeks or near face, "I can\'t believe it" look',
    serious: 'Determined focused look, confident expression, slight frown, "this is important" energy',
    confused: 'Furrowed brow, tilted head, questioning puzzled expression, one eyebrow raised',
    curious: 'Raised eyebrow, intrigued knowing expression, slight smile, "wait till you see this" energy'
  };
  return descriptions[expression] || descriptions.excited;
}

function getEmotionMood(expression: string): string {
  const moods = {
    excited: 'Energetic, positive, "you\'ll love this"',
    shocked: 'Dramatic, surprising, "you won\'t believe this"',
    serious: 'Important, authoritative, "pay attention"',
    confused: 'Relatable, questioning, "let me explain"',
    curious: 'Intriguing, mysterious, "want to know more?"'
  };
  return moods[expression] || moods.excited;
}

function extractHook(videoTitle: string): string {
  // Extract 3-5 most impactful words from video title
  // This is a simplified version - real implementation would be smarter
  const words = videoTitle.split(' ').slice(0, 5);
  return words.join(' ').toUpperCase();
}
```

---

## 5. LINKEDIN POST

### Prompt Template

```typescript
function buildLinkedInPrompt(data: LinkedInFormData): string {
  return `
<task>Generate a professional LinkedIn post graphic that builds credibility and encourages engagement</task>

<format>
Type: LinkedIn Feed Post
Aspect Ratio: Landscape 1.91:1 (1200x628) or Square 1:1 (1080x1080)
Purpose: Establish thought leadership, drive professional engagement, build credibility
Audience: Business professionals, B2B context
</format>

<subject>
A sophisticated professional graphic for: "${data.headline}"
Content Type: ${data.contentType || 'Thought Leadership'}
This should look like it comes from a respected industry leader, not a marketing department.
</subject>

<composition>
Layout: Clean, sophisticated, minimal
- Professional gradient or solid background with subtle texture or geometric accents
- Headline as primary element - prominent but not shouting
- ${data.keyInsight ? 'Key statistic or insight highlighted/emphasized' : ''}
- ${data.professionalMessage ? 'Supporting message in clean typography' : ''}
- Subtle branding space
- Generous white space - not crowded

Background: Professional ${data.backgroundStyle || 'blue gradient'} with subtle geometric or abstract accents
Visual Treatment: Sophisticated, understated, credible
</composition>

<text_content>
<text role="headline" prominence="largest" style="professional sans-serif, bold but elegant, not aggressive">${data.headline}</text>
${data.keyInsight ? `<text role="insight" prominence="prominent" style="highlighted, possibly larger number or statistic">${data.keyInsight}</text>` : ''}
${data.professionalMessage ? `<text role="body" prominence="medium" style="clean sans-serif, lighter weight">${data.professionalMessage}</text>` : ''}
</text_content>

<style>
Visual Style: Professional, sophisticated, B2B-appropriate
Color Palette: ${data.colorScheme || 'Professional blues (#0077b5, #004182), grays, white, subtle gold accent'}
Mood: Authoritative yet approachable, credible, thought-provoking
Typography: Clean professional fonts (not playful or casual)
Decoration: Minimal - subtle geometric shapes, lines, or icons only
</style>

<quality_markers>
- Would not look out of place on a Fortune 500 company's LinkedIn
- Builds credibility and trust
- Professional enough for business context
- Encourages thoughtful engagement
- Clean, sophisticated execution
</quality_markers>

<constraints>
Avoid: Flashy, salesy, clickbait, unprofessional, too colorful, playful fonts, meme-style, casual aesthetic, aggressive marketing look, corporate clichés, stock photo handshake imagery
</constraints>
`.trim();
}
```

---

## 6. STORY FORMAT (Instagram/WhatsApp)

### Prompt Template

```typescript
function buildStoryPrompt(data: StoryFormData): string {
  return `
<task>Generate a full-screen vertical story design optimized for mobile viewing</task>

<format>
Type: ${data.platform || 'Instagram'} Story
Aspect Ratio: Portrait 9:16 (1080x1920 equivalent)
Purpose: Capture attention in Stories feed, encourage swipe/tap action
Viewing Context: Full-screen mobile, brief viewing time (3-5 seconds)
</format>

<subject>
A thumb-stopping story graphic for: "${data.storyHeadline}"
Must capture attention and communicate message within 3 seconds.
Full-screen immersive experience.
</subject>

<composition>
Layout: Full-bleed vertical design with safe zones
- TOP 15%: AVOID - platform UI covers this area (story bar, profile info)
- CENTER 65%: SAFE ZONE - all important content goes here
- BOTTOM 20%: AVOID - reply box, navigation covers this area

Content Placement:
- Main headline centered in safe zone
- ${data.callToAction ? 'Swipe/tap indicator in lower portion of safe zone' : ''}
- Keep all critical content in middle 65%

Background: ${data.backgroundStyle || 'Bold vibrant gradient'} filling entire frame
Visual Treatment: Full-bleed, immersive, mobile-native
</composition>

<text_content>
<text role="headline" prominence="largest" style="bold impact sans-serif, centered in safe zone, high contrast">${data.storyHeadline}</text>
${data.callToAction ? `<text role="cta" prominence="prominent" style="swipe-up indicator style, near bottom of safe zone">${data.callToAction} ↑</text>` : ''}
</text_content>

<style>
Visual Style: Mobile-native, immersive, story-optimized
Color Palette: ${data.colorScheme || 'Vibrant, bold, high contrast'}
Mood: Immediate, attention-grabbing, action-driving
Typography: Large, bold, easily readable at a glance
</style>

<quality_markers>
- Full-screen impact
- Content clearly in safe zones (not hidden by UI)
- Readable at a glance
- Thumb-stopping in Stories feed
- Encourages interaction (swipe, tap, reply)
</quality_markers>

<constraints>
Avoid: Content at top or bottom edges (UI zones), tiny text, horizontal composition, boring/static design, cluttered layout, hard to read quickly
</constraints>
`.trim();
}
```

---

## 7. FLYER (A4/A5)

### Prompt Template

```typescript
function buildFlyerPrompt(data: FlyerFormData): string {
  return `
<task>Generate a professional print-ready promotional flyer</task>

<format>
Type: Promotional Flyer
Size: ${data.size || 'A4'} Portrait
Purpose: Physical/digital distribution, drive action, communicate offer
Usage: Print distribution, digital sharing, marketing material
</format>

<subject>
A professional marketing flyer for: "${data.flyerTitle}"
Must communicate value proposition and drive specific action.
Designed for both print and digital use.
</subject>

<composition>
Layout: Clear vertical hierarchy with defined zones
- HEADER (15%): Organization logo and branding
- HEADLINE (25%): Main message, attention-grabbing title
- CONTENT (40%): Key information, benefits, details
- ACTION (20%): CTA, contact info, date/time/venue if event

Structure:
- Organization logo prominently at top
- Bold headline as primary attention-grabber
- ${data.flyerDescription ? 'Key information and description' : ''}
- ${data.eventDate ? 'Event date clearly displayed with calendar icon' : ''}
- ${data.eventTime ? 'Time with clock icon' : ''}
- ${data.venue ? 'Venue with location marker' : ''}
- ${data.price ? 'Pricing highlighted/emphasized' : ''}
- Strong call-to-action button or banner
- Contact information: ${[data.contactPhone, data.contactEmail, data.websiteUrl].filter(Boolean).join(', ')}

Background: ${data.backgroundStyle || 'Clean, professional'} suitable for print
</composition>

<text_content>
<text role="headline" prominence="largest" style="bold, impactful, attention-grabbing">${data.flyerTitle}</text>
${data.flyerDescription ? `<text role="body" prominence="medium" style="clear, readable">${data.flyerDescription}</text>` : ''}
${data.eventDate ? `<text role="date" prominence="medium" style="bold with icon">📅 ${data.eventDate}</text>` : ''}
${data.eventTime ? `<text role="time" prominence="medium" style="bold with icon">🕐 ${data.eventTime}</text>` : ''}
${data.venue ? `<text role="venue" prominence="medium" style="clear with icon">📍 ${data.venue}</text>` : ''}
${data.price ? `<text role="price" prominence="prominent" style="highlighted, emphasized">${data.price}</text>` : ''}
<text role="cta" prominence="prominent" style="button-style, high contrast">${data.callToAction || 'Contact Us Today'}</text>
<text role="contact" prominence="small" style="clean, readable">${[data.contactPhone, data.contactEmail, data.websiteUrl].filter(Boolean).join(' | ')}</text>
</text_content>

<style>
Visual Style: Professional marketing, print-ready
Color Palette: ${data.colorScheme || 'Brand-appropriate, professional'}
Mood: Professional, trustworthy, action-driving
Typography: Clear hierarchy, readable at print size
Print Considerations: CMYK-safe colors, high contrast for readability
</style>

<quality_markers>
- Print-ready quality (would look good printed at A4/A5)
- Clear visual hierarchy
- Easy to scan and find key information
- Professional marketing material quality
- All text clearly legible at print size
- Drives specific action
</quality_markers>

<constraints>
Avoid: Low resolution, web-only colors, cluttered layout, tiny text, poor hierarchy, too many fonts, unprofessional design, missing contact information
</constraints>
`.trim();
}
```

---

## 8. BUSINESS CARD

### Prompt Template

```typescript
function buildBusinessCardPrompt(data: BusinessCardFormData): string {
  return `
<task>Generate a professional business card design</task>

<format>
Type: Business Card
Size: Standard 3.5" x 2" (89mm x 51mm)
Orientation: ${data.orientation || 'Horizontal'}
Purpose: Professional networking, personal branding, contact information exchange
</format>

<subject>
A professional business card for: ${data.personName}
Title: ${data.jobTitle}
${data.companyName ? `Company: ${data.companyName}` : ''}
The card should reflect professionalism and be memorable.
</subject>

<composition>
Layout: Clean, balanced ${data.orientation || 'horizontal'} layout
- Name as the most prominent text element
- Job title below name, slightly smaller
- ${data.companyName ? 'Company name with logo' : ''}
- Contact details clearly organized
- Proper margins (no text near edges for print trimming)
- Balanced white space

Content Arrangement:
- ${data.personName}: Primary, most prominent
- ${data.jobTitle}: Secondary, below name
- ${data.companyName ? `${data.companyName}: With logo` : ''}
- Contact section:
  ${data.phoneNumber ? `• Phone: ${data.phoneNumber}` : ''}
  ${data.emailAddress ? `• Email: ${data.emailAddress}` : ''}
  ${data.websiteUrl ? `• Website: ${data.websiteUrl}` : ''}
  ${data.address ? `• Address: ${data.address}` : ''}
  ${data.socialHandle ? `• Social: ${data.socialHandle}` : ''}

Background: ${data.backgroundStyle || 'Clean white or subtle brand color'}
</composition>

<text_content>
<text role="name" prominence="largest" style="professional serif or sans-serif, bold">${data.personName}</text>
<text role="title" prominence="medium" style="clean, slightly smaller">${data.jobTitle}</text>
${data.companyName ? `<text role="company" prominence="medium" style="with logo">${data.companyName}</text>` : ''}
${data.phoneNumber ? `<text role="contact" prominence="small" style="clean, readable">📞 ${data.phoneNumber}</text>` : ''}
${data.emailAddress ? `<text role="contact" prominence="small" style="clean, readable">✉️ ${data.emailAddress}</text>` : ''}
${data.websiteUrl ? `<text role="contact" prominence="small" style="clean, readable">🌐 ${data.websiteUrl}</text>` : ''}
</text_content>

<style>
Visual Style: ${data.style || 'Professional, clean, memorable'}
Color Palette: ${data.colorScheme || 'Professional minimal (black, white, one accent color)'}
Mood: Professional, trustworthy, distinctive
Typography: Elegant, readable at small sizes, proper hierarchy
</style>

<quality_markers>
- Print-ready (300 DPI, proper margins)
- All text readable at actual business card size
- Professional enough for executive-level networking
- Memorable but not gimmicky
- Clear hierarchy
- Easy to find contact information
</quality_markers>

<constraints>
Avoid: Cluttered design, tiny unreadable text, too much information, unprofessional fonts, busy backgrounds, poor contrast, missing key contact info
</constraints>
`.trim();
}
```

---

## 9. PRESENTATION SLIDE

### Prompt Template

```typescript
function buildPresentationPrompt(data: PresentationFormData): string {
  return `
<task>Generate a professional presentation title slide</task>

<format>
Type: Presentation Title Slide
Aspect Ratio: ${data.aspectRatio || '16:9 Widescreen'}
Purpose: Open a presentation, establish topic and presenter, set professional tone
Viewing Context: Projected on large screen, viewed from distance
</format>

<subject>
A professional presentation title slide for: "${data.presentationTitle}"
This is the opening slide - it should be clean, impactful, and set the tone.
</subject>

<composition>
Layout: Clean, centered, minimal - designed for projection
- Title as dominant central element
- ${data.subtitle ? 'Subtitle below title' : ''}
- ${data.presenterName ? 'Presenter information in lower section' : ''}
- ${data.eventName ? 'Event name and date at bottom' : ''}
- Organization logo in corner
- Safe margins for projection (5% on all sides)

Background: ${data.backgroundStyle || 'Professional gradient'} suitable for projection
Lighting Consideration: High contrast for readability on projectors
</composition>

<text_content>
<text role="title" prominence="largest" style="bold professional sans-serif, centered, high contrast">${data.presentationTitle}</text>
${data.subtitle ? `<text role="subtitle" prominence="medium" style="lighter weight, below title">${data.subtitle}</text>` : ''}
${data.presenterName ? `<text role="presenter" prominence="small" style="professional, lower section">${data.presenterName}${data.presenterTitle ? ', ' + data.presenterTitle : ''}</text>` : ''}
${data.eventName ? `<text role="event" prominence="small" style="bottom area">${data.eventName} | ${data.presentationDate || ''}</text>` : ''}
</text_content>

<style>
Visual Style: Professional presentation, corporate or academic appropriate
Color Palette: ${data.colorScheme || 'High contrast professional (dark background, white text OR white background, dark text)'}
Mood: Professional, authoritative, engaging
Typography: Large, clear, readable from back of room (minimum 32pt equivalent for body, 48pt+ for title)
</style>

<quality_markers>
- Readable from the back of a large room
- Works well when projected (high contrast)
- Professional business or academic quality
- Clean, not cluttered
- Sets appropriate tone for presentation
</quality_markers>

<constraints>
Avoid: Tiny text, low contrast, cluttered design, too much information, busy backgrounds, hard to read from distance
</constraints>
`.trim();
}
```

---

## 10. WEB BANNER

### Prompt Template

```typescript
function buildWebBannerPrompt(data: WebBannerFormData): string {
  return `
<task>Generate a high-converting web banner advertisement</task>

<format>
Type: Display Web Banner
Size: ${data.size || '728x90 Leaderboard'}
Purpose: Drive clicks, communicate value proposition, convert viewers
Context: Will appear on websites alongside other content - must stand out
</format>

<subject>
A click-driving banner ad with message: "${data.headline}"
Goal: Capture attention in 1-2 seconds and drive clicks to landing page.
Must work as a standalone ad unit on various website backgrounds.
</subject>

<composition>
Layout: Compact, efficient use of space for ${data.size || 'leaderboard'} format
- Logo/brand element: Small but visible
- Headline: Primary message, immediately visible
- ${data.valueProposition ? 'Value proposition: Supporting message' : ''}
- ${data.offerDetails ? 'Offer: Highlighted special offer' : ''}
- CTA Button: Obvious, contrasting, clickable

Arrangement: Flows left-to-right (for LTR audiences)
- Brand → Message → CTA

Background: ${data.backgroundStyle || 'Bold, stands out from typical website backgrounds'}
</composition>

<text_content>
<text role="headline" prominence="largest" style="bold, attention-grabbing, high contrast">${data.headline}</text>
${data.valueProposition ? `<text role="value" prominence="medium" style="supporting">${data.valueProposition}</text>` : ''}
${data.offerDetails ? `<text role="offer" prominence="prominent" style="highlighted, possibly with special treatment">${data.offerDetails}</text>` : ''}
<text role="cta" prominence="prominent" style="button style, contrasting color, obviously clickable">${data.callToAction || 'Learn More'}</text>
</text_content>

<style>
Visual Style: Digital advertising, conversion-focused
Color Palette: ${data.colorScheme || 'Bold, contrasting (CTA should pop)'}
Mood: Urgent (but not desperate), valuable, action-driving
Typography: Bold, readable at small sizes, hierarchy in limited space
CTA Treatment: Button-style, contrasting color, clearly clickable
</style>

<quality_markers>
- Captures attention within 1-2 seconds
- CTA is obviously clickable
- Single clear message (not multiple competing messages)
- Stands out on various website backgrounds
- Professional digital advertising quality
</quality_markers>

<constraints>
Avoid: Cluttered, too much text, no clear CTA, low contrast, competing messages, tiny fonts, looks like content not an ad, too subtle
</constraints>
`.trim();
}
```

---

# YI VERTICAL CONTEXT INJECTION

## Vertical-Specific Additions

```typescript
interface VerticalContext {
  verticalId: string;
  name: string;
  additionalContext: string;
  colorPreferences: string;
  imageryGuidance: string;
  avoidance: string;
}

const VERTICAL_CONTEXTS: Record<string, VerticalContext> = {
  masoom: {
    verticalId: 'masoom',
    name: 'Yi Masoom - Child Safety',
    additionalContext: `
<vertical_context>
This is for Yi Masoom, a child safety initiative.
The design must be:
- Family-friendly and appropriate for all ages
- Warm, welcoming, and trustworthy
- Focused on protection, safety, and care for children
- Suitable for display in schools, community centers, and family environments
</vertical_context>`,
    colorPreferences: 'Warm, friendly colors: soft orange, sunshine yellow, sky blue, warm green. Avoid dark or aggressive colors.',
    imageryGuidance: 'Imagery should suggest: families, protection, schools, community, safety. Show happy, safe environments.',
    avoidance: 'Avoid: Dark themes, scary imagery, aggressive visuals, adult-only content, anything inappropriate for children'
  },
  
  road_safety: {
    verticalId: 'road_safety',
    name: 'Yi Road Safety',
    additionalContext: `
<vertical_context>
This is for Yi Road Safety awareness initiative.
The design must:
- Communicate safety messages clearly
- Use high-visibility colors for attention
- Be appropriate for public display (billboards, schools, offices)
- Emphasize safe behavior and accident prevention
</vertical_context>`,
    colorPreferences: 'High-visibility: safety yellow, alert orange, traffic red, warning colors. High contrast for readability.',
    imageryGuidance: 'Imagery: roads, vehicles, pedestrians, helmets, seatbelts, safe crossing. Focus on positive safe behavior.',
    avoidance: 'Avoid: Graphic accident scenes, injuries, disturbing imagery'
  },
  
  health: {
    verticalId: 'health',
    name: 'Yi Health',
    additionalContext: `
<vertical_context>
This is for Yi Health initiative promoting wellness and healthcare.
The design must:
- Convey trust and medical professionalism
- Be welcoming and not clinical
- Appropriate for healthcare settings
- Encourage healthy behaviors
</vertical_context>`,
    colorPreferences: 'Healthcare appropriate: clean blues, fresh greens, clinical whites, calming colors. Trustworthy palette.',
    imageryGuidance: 'Imagery: healthcare, wellness, medical professionals, healthy lifestyle, community health.',
    avoidance: 'Avoid: Graphic medical imagery, sick people, depressing health content'
  },
  
  yuva: {
    verticalId: 'yuva',
    name: 'Yi Yuva - Youth Empowerment',
    additionalContext: `
<vertical_context>
This is for Yi Yuva, a youth empowerment and career development initiative.
The design must:
- Appeal to young professionals (18-35)
- Feel modern, dynamic, and forward-looking
- Convey growth, opportunity, and aspiration
- Be energetic without being juvenile
</vertical_context>`,
    colorPreferences: 'Modern, energetic: electric blue, vibrant purple, dynamic orange, modern palette.',
    imageryGuidance: 'Imagery: young professionals, career growth, technology, education, aspiration, success.',
    avoidance: 'Avoid: Dated, old-fashioned, corporate boring, juvenile or childish'
  },
  
  climate: {
    verticalId: 'climate',
    name: 'Yi Climate Action',
    additionalContext: `
<vertical_context>
This is for Yi Climate initiative promoting environmental sustainability.
The design must:
- Convey environmental responsibility
- Feel hopeful and action-oriented (not doom and gloom)
- Emphasize positive action and solutions
- Connect with nature and sustainability
</vertical_context>`,
    colorPreferences: 'Environmental: earth greens, sky blues, natural earth tones, sustainable colors.',
    imageryGuidance: 'Imagery: nature, sustainability, renewable energy, green actions, thriving ecosystems.',
    avoidance: 'Avoid: Disaster imagery, doom messaging, dying nature, depressing environmental content'
  },
  
  innovation: {
    verticalId: 'innovation',
    name: 'Yi Innovation',
    additionalContext: `
<vertical_context>
This is for Yi Innovation, promoting technology and entrepreneurship.
The design must:
- Feel cutting-edge and forward-thinking
- Appeal to tech-savvy audience
- Convey innovation and disruption
- Be modern and sleek
</vertical_context>`,
    colorPreferences: 'Tech-forward: electric blue, neon accents, futuristic palette, modern gradients.',
    imageryGuidance: 'Imagery: technology, innovation, startups, digital transformation, futuristic elements.',
    avoidance: 'Avoid: Outdated tech, old computers, non-innovative imagery'
  }
};

function injectVerticalContext(basePrompt: string, verticalId: string): string {
  const context = VERTICAL_CONTEXTS[verticalId];
  if (!context) return basePrompt;
  
  // Insert vertical context before the closing constraints
  const constraintsIndex = basePrompt.indexOf('<constraints>');
  if (constraintsIndex === -1) {
    return basePrompt + '\n\n' + context.additionalContext;
  }
  
  const beforeConstraints = basePrompt.substring(0, constraintsIndex);
  const constraintsSection = basePrompt.substring(constraintsIndex);
  
  // Modify constraints to include vertical-specific avoidance
  const modifiedConstraints = constraintsSection.replace(
    'Avoid:',
    `Avoid: ${context.avoidance}. Also avoid:`
  );
  
  return beforeConstraints + 
    context.additionalContext + '\n\n' +
    `<vertical_imagery>${context.imageryGuidance}</vertical_imagery>\n` +
    `<vertical_colors>${context.colorPreferences}</vertical_colors>\n\n` +
    modifiedConstraints;
}
```

---

# API INTEGRATION CODE

## Complete Prompt Builder Service

```typescript
// lib/services/yiPromptBuilder.ts

import { 
  CertificateFormData,
  EventPosterFormData,
  InstagramFormData,
  // ... other form types
} from '../types/formTypes';

export class YiPromptBuilder {
  private static systemInstruction = `
You are Yi CreativeStudio's image generation engine. You create professional marketing and design assets for NGOs and businesses in India.

Your outputs must be:
- Professional and print-ready quality
- Culturally appropriate for Indian audiences
- Brand-consistent when brand guidelines are provided
- Clear and legible text when text is included (max 25 characters per text element)

When generating images:
1. Follow the structured prompt format provided
2. Render text clearly and legibly
3. Maintain proper visual hierarchy
4. Use colors and styles appropriate for the format type
5. Ensure the composition works for the specified aspect ratio
`;

  /**
   * Build complete API request payload
   */
  static buildRequest(
    formatId: string,
    formData: Record<string, any>,
    options: {
      verticalId?: string;
      engine?: 'yi_vision' | 'yi_craft';
    } = {}
  ): GeminiImageRequest {
    // Build the prompt
    let prompt = this.buildPrompt(formatId, formData);
    
    // Inject vertical context if applicable
    if (options.verticalId) {
      prompt = injectVerticalContext(prompt, options.verticalId);
    }
    
    // Determine model based on engine choice
    const model = options.engine === 'yi_craft' 
      ? 'gemini-3-pro-image-preview'  // Better for text-heavy
      : 'gemini-2.5-flash-image';     // Faster, good for general
    
    return {
      model,
      generationConfig: {
        responseModalities: ["TEXT", "IMAGE"],
        temperature: 1.0  // Gemini recommended default
      },
      systemInstruction: {
        parts: [{ text: this.systemInstruction }]
      },
      contents: [{
        role: "user",
        parts: [{ text: prompt }]
      }]
    };
  }

  /**
   * Build prompt based on format
   */
  static buildPrompt(formatId: string, formData: Record<string, any>): string {
    switch (formatId) {
      case 'certificate':
        return buildCertificatePrompt(formData as CertificateFormData);
      case 'event_poster':
        return buildEventPosterPrompt(formData as EventPosterFormData);
      case 'instagram_post':
        return buildInstagramPrompt(formData as InstagramFormData);
      case 'instagram_story':
      case 'whatsapp_status':
        return buildStoryPrompt(formData);
      case 'youtube_thumbnail':
        return buildYouTubeThumbnailPrompt(formData);
      case 'linkedin_post':
        return buildLinkedInPrompt(formData);
      case 'flyer_a4':
      case 'flyer_a5':
        return buildFlyerPrompt(formData);
      case 'business_card':
        return buildBusinessCardPrompt(formData);
      case 'presentation_16_9':
      case 'presentation_4_3':
        return buildPresentationPrompt(formData);
      case 'web_banner':
      case 'leaderboard_ad':
        return buildWebBannerPrompt(formData);
      case 'facebook_post':
      case 'twitter_post':
        return buildSocialPostPrompt(formData, formatId);
      default:
        return buildGenericPrompt(formatId, formData);
    }
  }

  /**
   * Get recommended engine for format
   */
  static getRecommendedEngine(formatId: string): 'yi_vision' | 'yi_craft' {
    // Text-heavy formats benefit from Yi Craft (Gemini 3 Pro Image)
    const textHeavyFormats = [
      'certificate',
      'business_card',
      'letterhead',
      'presentation_16_9',
      'presentation_4_3',
      'resume',
      'report_cover'
    ];
    
    return textHeavyFormats.includes(formatId) ? 'yi_craft' : 'yi_vision';
  }
}

// Helper function for date formatting
function formatDate(dateString: string): string {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return dateString;
  }
}

function formatEventDate(dateString: string): string {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch {
    return dateString;
  }
}
```

---

# USAGE EXAMPLES

## Example 1: Certificate Generation

```typescript
const formData = {
  certificateTitle: 'Certificate of Excellence',
  recipientName: 'Dr. Priya Sharma',
  achievementDescription: 'For outstanding contribution to community healthcare',
  signatoryName: 'Mr. Rajesh Kumar',
  signatoryDesignation: 'Director, Yi Foundation',
  dateIssued: '2025-12-05',
  certificateNumber: 'YI-2025-0042',
  style: 'classic'
};

const request = YiPromptBuilder.buildRequest('certificate', formData, {
  engine: 'yi_craft'  // Use Yi Craft for better text rendering
});

// Send to Gemini API
const response = await geminiAPI.generateContent(request);
```

## Example 2: Event Poster with Vertical Context

```typescript
const formData = {
  eventName: 'Child Safety Workshop',
  eventDescription: 'Protecting Our Future Together',
  eventDate: '2025-12-20',
  eventTime: '10:00 AM - 4:00 PM',
  venue: 'Community Center, Koramangala, Bangalore',
  speakerName: 'Dr. Meera Nair',
  speakerDesignation: 'Child Psychologist',
  registrationInfo: 'Free Registration - Limited Seats',
  eventType: 'workshop'
};

const request = YiPromptBuilder.buildRequest('event_poster', formData, {
  verticalId: 'masoom',  // Inject Masoom child safety context
  engine: 'yi_vision'
});
```

## Example 3: Instagram Post

```typescript
const formData = {
  postTitle: 'Join Us This Weekend!',
  postCaption: 'Annual Community Meetup 2025',
  callToAction: 'Register Now →',
  postType: 'announcement'
};

const request = YiPromptBuilder.buildRequest('instagram_post', formData, {
  engine: 'yi_vision'
});
```

---

# TESTING & ITERATION GUIDE

## Quality Checklist

For each generated image, verify:

### Universal Checks
- [ ] Text is clearly legible
- [ ] Visual hierarchy is correct (most important elements are most prominent)
- [ ] Aspect ratio matches the format requirement
- [ ] No content is cut off or poorly positioned
- [ ] Professional quality (not amateur-looking)

### Format-Specific Checks

**Certificate:**
- [ ] Recipient name is the largest text
- [ ] Border is elegant and appropriate
- [ ] Seal/emblem is visible
- [ ] Signature lines are present
- [ ] Overall feel is prestigious

**Event Poster:**
- [ ] Event name is dominant
- [ ] Date/time/venue are clearly visible
- [ ] CTA is prominent
- [ ] Passes 3-second test (what, when, where)

**Instagram Post:**
- [ ] Would stop scrolling
- [ ] Readable on phone screen
- [ ] Not cluttered
- [ ] Clear focal point

**YouTube Thumbnail:**
- [ ] Readable at 160x90 pixels
- [ ] Face/subject is prominent (if applicable)
- [ ] Text is 5 words or less
- [ ] Nothing in bottom-right corner

## Iteration Tips

If results aren't satisfactory:

1. **Add more specific details** to composition section
2. **Add few-shot examples** of good/bad outcomes
3. **Be more explicit** about what to avoid
4. **Try different style keywords**
5. **Adjust color palette** descriptions
6. **Switch between Yi Vision and Yi Craft** engines