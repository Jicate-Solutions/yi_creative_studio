# Yi CreativeStudio: Gemini Prompt System v3.0

## Changelog from v2.0

| Issue | Fix Applied |
|-------|-------------|
| Logo Awareness Missing | Added `<logo_context>` section in all prompts |
| Brand Context Not Integrated | Added `brandContext` injection into `<style>` |
| Missing Fields | Added style, entryFee, targetAudience, issuingAuthority |
| Few-Shot Examples Only on Certificate | Added examples for ALL major formats |
| Resolution Not in Prompt | Added `<quality>` section with resolution |
| Template Mode Bypass | Added template-aware prompt generation |

---

# UPDATED PROMPT ARCHITECTURE

## Enhanced Request Builder

```typescript
interface EnhancedBuildOptions {
  verticalId?: string;
  engine?: 'yi_vision' | 'yi_craft';
  brandContext?: BrandContext;
  logoAwareness?: LogoAwarenessContext;
  resolution?: '1K' | '2K' | '4K';
  templateMode?: boolean;
}

interface BrandContext {
  primaryColor: string;
  secondaryColor: string;
  accentColor?: string;
  fontPreference?: string;
  brandName?: string;
  logoPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center-top';
}

interface LogoAwarenessContext {
  hasLogo: boolean;
  logoPosition: string;
  logoSize: 'small' | 'medium' | 'large';
  clearZone: string;  // Area to keep clear for logo overlay
}
```

---

# LOGO AWARENESS INJECTION

## Logo Context Template

```typescript
function buildLogoContext(logoAwareness: LogoAwarenessContext): string {
  if (!logoAwareness?.hasLogo) return '';
  
  const positionDescriptions = {
    'top-left': 'top-left corner (approximately 10-15% from top and left edges)',
    'top-right': 'top-right corner (approximately 10-15% from top and right edges)',
    'bottom-left': 'bottom-left corner (approximately 10-15% from bottom and left edges)',
    'bottom-right': 'bottom-right corner (approximately 10-15% from bottom and right edges)',
    'center-top': 'centered at the top (approximately 10% from top edge)'
  };
  
  const sizeDescriptions = {
    'small': 'small logo area (approximately 8-10% of image width)',
    'medium': 'medium logo area (approximately 12-15% of image width)',
    'large': 'large logo area (approximately 18-22% of image width)'
  };
  
  return `
<logo_context>
IMPORTANT: A logo will be overlaid on this image after generation.
Logo Position: ${positionDescriptions[logoAwareness.logoPosition] || logoAwareness.logoPosition}
Logo Size: ${sizeDescriptions[logoAwareness.logoSize] || logoAwareness.logoSize}
Clear Zone Required: ${logoAwareness.clearZone || 'Keep the logo area free of important text, faces, or critical visual elements'}

Design Instruction: Ensure the ${logoAwareness.logoPosition} area has:
- Solid or simple gradient background (not busy patterns)
- No important text or faces
- Sufficient contrast for logo visibility
- Clear breathing room around the logo placement area
</logo_context>
`;
}
```

---

# BRAND CONTEXT INJECTION

## Brand Context Template

```typescript
function buildBrandContext(brandContext: BrandContext): string {
  if (!brandContext) return '';
  
  return `
<brand_context>
Brand Guidelines to Follow:
${brandContext.brandName ? `- Brand: ${brandContext.brandName}` : ''}
- Primary Color: ${brandContext.primaryColor} (use for main elements, headers)
- Secondary Color: ${brandContext.secondaryColor} (use for supporting elements)
${brandContext.accentColor ? `- Accent Color: ${brandContext.accentColor} (use for CTAs, highlights)` : ''}
${brandContext.fontPreference ? `- Typography Preference: ${brandContext.fontPreference}` : ''}

Color Application:
- Headlines/Titles: Primary color or high contrast with background
- Backgrounds: Can incorporate brand colors as gradients or accents
- CTAs/Buttons: Accent color for maximum visibility
- Supporting text: Secondary color or neutral
</brand_context>
`;
}
```

---

# RESOLUTION/QUALITY INJECTION

## Quality Context Template

```typescript
function buildQualityContext(resolution: string, formatId: string): string {
  const resolutionSpecs = {
    '1K': { pixels: '1024px', dpi: '72-150 DPI', use: 'Digital/Web' },
    '2K': { pixels: '2048px', dpi: '150-300 DPI', use: 'Print/High-quality digital' },
    '4K': { pixels: '4096px', dpi: '300+ DPI', use: 'Large format print/Professional' }
  };
  
  const spec = resolutionSpecs[resolution] || resolutionSpecs['2K'];
  
  // Format-specific quality requirements
  const formatQuality = {
    'certificate': 'Print-ready, frame-worthy, crisp text rendering',
    'event_poster': 'Print-ready, readable from distance, vibrant colors',
    'instagram_post': 'Mobile-optimized, vibrant, scroll-stopping',
    'youtube_thumbnail': 'Readable at 160x90px, high contrast, bold',
    'business_card': 'Print-ready, precise text, professional',
    'presentation': 'Projection-friendly, high contrast, readable from distance',
    'flyer': 'Print-ready, clear hierarchy, scannable'
  };
  
  return `
<quality>
Resolution: ${resolution} (${spec.pixels} maximum dimension)
DPI Equivalent: ${spec.dpi}
Intended Use: ${spec.use}
Format-Specific Quality: ${formatQuality[formatId] || 'Professional quality, clear and crisp'}

Quality Requirements:
- Sharp, clear edges on all elements
- Legible text at intended viewing size
- No artifacts, blur, or pixelation
- Professional finish suitable for ${spec.use.toLowerCase()}
</quality>
`;
}
```

---

# FEW-SHOT EXAMPLES FOR ALL FORMATS

## 1. Certificate Examples

```typescript
const CERTIFICATE_EXAMPLES = `
<examples>
<example type="good">
A prestigious certificate with an ornate gold border featuring intricate Victorian corner scrollwork. The cream parchment background has subtle aging texture. "CERTIFICATE OF EXCELLENCE" appears in elegant navy serif at top center. The recipient name "DR. PRIYA SHARMA" is the LARGEST element, written in beautiful gold calligraphy script, underlined with decorative flourishes. Achievement text "For outstanding contribution to community healthcare" appears below in refined serif. Official embossed gold seal with ribbon in top-right corner. Two signature lines at bottom with printed names and titles. Date "December 5, 2025" and certificate number in small text at very bottom. Frame-worthy, professional, prestigious quality.
</example>

<example type="avoid">
A certificate with rainbow gradient border, Comic Sans or playful fonts, bright neon pink and green colors, multiple cartoon clipart images (stars, balloons), inconsistent text sizes with no clear hierarchy, busy patterned polka-dot background, tiny hard-to-read text, missing seal or official elements, text crammed together with no breathing room. Looks like a children's birthday party invitation rather than a formal professional document.
</example>
</examples>
`;
```

## 2. Event Poster Examples

```typescript
const EVENT_POSTER_EXAMPLES = `
<examples>
<example type="good">
A professional conference poster with dynamic blue gradient background and subtle geometric accents. "INNOVATION SUMMIT 2025" appears as the dominant headline in bold white sans-serif at the top, commanding immediate attention. Below: "Shaping Tomorrow's Technology" tagline in lighter weight. Clear event details section with icons: calendar icon + "March 15-16, 2025", clock icon + "9:00 AM - 6:00 PM", location pin + "Grand Convention Center, Mumbai". Featured speaker "Dr. Meera Nair, CEO TechCorp" with circular photo placeholder. Prominent yellow "REGISTER NOW - FREE" button near bottom. Corporate logo in top-left corner with clear space around it. Passes the 3-second test: What (Innovation Summit), When (March 15-16), Where (Mumbai) are instantly visible.
</example>

<example type="avoid">
An event poster with cluttered layout where event name is tiny and hard to find. Date/time/venue scattered randomly across the design with no icons or visual organization. Boring gray background with no energy. Multiple fonts competing for attention (script, serif, sans-serif, decorative all mixed). No clear call-to-action. Important information hidden at the bottom in 8pt font. Stock photo of generic handshake taking up 70% of space. Fails the 3-second test - viewer has no idea what event this is for.
</example>
</examples>
`;
```

## 3. Instagram Post Examples

```typescript
const INSTAGRAM_POST_EXAMPLES = `
<examples>
<example type="good">
A scroll-stopping Instagram announcement post with vibrant coral-to-orange gradient background. "BIG NEWS!" appears in extra-bold white sans-serif, large enough to read instantly on a phone screen, centered in upper portion. "We're Launching Something Amazing" supporting text below in slightly smaller but still very readable size. "Stay Tuned →" call-to-action at bottom in a subtle button style. Clean composition with generous breathing room around text - not cramped. Small logo in bottom-right corner with clear space. High contrast throughout. Would immediately catch attention when scrolling through a feed.
</example>

<example type="avoid">
An Instagram post with tiny 10pt text that requires zooming to read. Muddy brown and beige colors that blend into most feeds. 8 different pieces of information crammed into the square: headline, subheadline, three bullet points, contact info, website, logo - all competing for attention. Busy photographic background with text overlaid that's nearly impossible to read. Thin light-weight fonts that disappear on mobile. No clear focal point - viewer's eye doesn't know where to look first.
</example>
</examples>
`;
```

## 4. YouTube Thumbnail Examples

```typescript
const YOUTUBE_THUMBNAIL_EXAMPLES = `
<examples>
<example type="good">
A high-CTR YouTube thumbnail with an expressive young woman showing genuine surprised/excited expression (wide eyes, open mouth, hands near face), filling the left 60% of the frame with excellent lighting on her face. "5 FREE TOOLS" in bold yellow text with thick black outline on the right side - only 3 words, large enough to read when thumbnail is tiny (160px wide). Bright blue gradient background that contrasts sharply with both the subject and text. Face and text don't overlap. Bottom-right corner is intentionally empty (for YouTube duration badge). Single clear focal point. Would stand out among 500 other thumbnails in search results.
</example>

<example type="avoid">
A YouTube thumbnail with a tiny face in the corner that's barely visible at thumbnail size. "10 Amazing Tips and Tricks for Beginners Who Want to Learn How to Edit Videos Like a Professional" - 18 words in thin white font with no outline, impossible to read when small. Muted gray-green colors that look boring in a sea of bright thumbnails. Text positioned over the face. Important content in bottom-right corner (will be covered by duration badge). Multiple competing elements: face, product shot, text box, arrows, emoji - no single focal point. Looks like every other generic tutorial thumbnail.
</example>
</examples>
`;
```

## 5. LinkedIn Post Examples

```typescript
const LINKEDIN_POST_EXAMPLES = `
<examples>
<example type="good">
A professional LinkedIn graphic with sophisticated navy-to-dark-blue gradient background and subtle geometric line accents. "The Future of Remote Work" headline in clean white professional sans-serif - prominent but not shouty. Key statistic "87% of employees prefer hybrid models" highlighted with slightly larger text or subtle background treatment. "Here's what leading companies are doing differently..." supporting text in lighter weight below. Generous white space - not cramped. Small professional logo in corner. Looks like content from McKinsey, Deloitte, or respected industry thought leader. Would build credibility and encourage thoughtful engagement.
</example>

<example type="avoid">
A LinkedIn post that looks like a Facebook ad - bright red "SALE!!!" text, exclamation points everywhere, "CLICK NOW!!!!" aggressive CTA. Playful Comic Sans or rounded fonts inappropriate for business context. Bright rainbow colors that scream "look at me" unprofessionally. Stock photo of people pointing at laptop screen. Emoji overload 🚀🔥💯🎯. Looks like spam or multi-level marketing content. Would damage professional credibility rather than enhance it.
</example>
</examples>
`;
```

## 6. Story Format Examples

```typescript
const STORY_EXAMPLES = `
<examples>
<example type="good">
A full-screen vertical Instagram story with bold purple-to-blue gradient filling the entire frame. "SWIPE UP" headline in large bold white text positioned exactly in the center of the screen (the safe zone - middle 65%). Swipe-up arrow indicator "↑" near the bottom of the safe zone but NOT in the bottom 20% (where Instagram UI appears). Clean, immersive, full-bleed design. No content in top 15% (story progress bar area) or bottom 20% (reply box area). Single clear message that can be absorbed in 2 seconds. Thumb-stopping when viewed in Stories carousel.
</example>

<example type="avoid">
A story with important text at the very top (hidden by story bar and profile info). Call-to-action at the very bottom (hidden by reply box and navigation). Horizontal landscape composition that doesn't fill the vertical screen. Tiny text requiring viewer to pause and squint. Cluttered with multiple messages, bullet points, and small details that can't be absorbed quickly. White background that looks like an accidental screenshot rather than designed content.
</example>
</examples>
`;
```

## 7. Flyer Examples

```typescript
const FLYER_EXAMPLES = `
<examples>
<example type="good">
A professional A4 flyer with clean modern gradient background. Organization logo prominently at top establishing brand. "SUMMER HEALTH CAMP" bold headline in the top third - immediately catches attention. Key details clearly organized with icons: calendar "July 15, 2025", clock "9 AM - 5 PM", location pin "Community Center, Sector 12". Benefits listed cleanly: "Free Health Checkup • Blood Pressure • Sugar Test • BMI Assessment". "REGISTER TODAY" prominent CTA button in contrasting color. Contact info clearly at bottom: phone, email, website. QR code in corner for easy digital access. Clear visual hierarchy - viewer can scan and understand in 5 seconds.
</example>

<example type="avoid">
A flyer with no clear visual hierarchy - everything same size and weight. Tiny 8pt contact information impossible to read when printed. No icons or visual organization for date/time/venue. Wall of text paragraphs that no one will read. Low-resolution blurry images that will print poorly. Colors that will look completely different when printed (bright RGB colors that don't translate to CMYK). Missing critical information: no date, no venue address, no contact method. Unbalanced layout with everything crammed in one corner.
</example>
</examples>
`;
```

## 8. Business Card Examples

```typescript
const BUSINESS_CARD_EXAMPLES = `
<examples>
<example type="good">
A professional horizontal business card with clean white background and subtle brand color accent line. "PRIYA SHARMA" as the most prominent text in professional serif font. "Chief Marketing Officer" below in lighter weight. Company name "TechVision Solutions" with small logo. Contact details cleanly organized: phone "📞 +91 98765 43210", email "✉️ priya@techvision.com", website "🌐 techvision.com", LinkedIn handle. Proper margins - no text too close to edges (will be trimmed in printing). Balanced layout with breathing room. Would look professional when handed to a Fortune 500 executive.
</example>

<example type="avoid">
A business card crammed with information: full address (3 lines), 3 phone numbers, 2 emails, website, 5 social media handles, company tagline, QR code, AND a mission statement. Tiny 6pt text to fit everything in. Decorative script font for contact info (unreadable). Dark busy background making text hard to read. Text running all the way to edges (will be cut off in printing). Inconsistent alignment - some left, some center, some right for no reason. Cheap clip-art graphics. Would look unprofessional and difficult to use.
</example>
</examples>
`;
```

## 9. Presentation Slide Examples

```typescript
const PRESENTATION_EXAMPLES = `
<examples>
<example type="good">
A professional presentation title slide in 16:9 widescreen format. Deep blue gradient background suitable for projection. "DIGITAL TRANSFORMATION STRATEGY" large bold headline centered, readable from back of large conference room. "Q4 2025 Executive Review" subtitle below in lighter weight. "Presented by: Rajesh Kumar, CTO" and "December 5, 2025" in lower portion. Company logo in bottom-right corner. High contrast white text on dark background. Clean, minimal design - only essential information. Would look impressive projected in a boardroom.
</example>

<example type="avoid">
A presentation title slide with tiny 12pt text that no one past the front row can read. Busy photographic background making text illegible on projector. Low contrast: gray text on slightly different gray background. Entire slide crammed with text: agenda, speaker bio, company history, contact info all on title slide. Decorative fonts that are pretty but unreadable from distance. Important content outside the safe zone - cut off by projector or display. Multiple clashing colors with no visual harmony.
</example>
</examples>
`;
```

## 10. Web Banner Examples

```typescript
const WEB_BANNER_EXAMPLES = `
<examples>
<example type="good">
A 728x90 leaderboard banner with bold gradient background that stands out from typical website content. "Save 50% Today" headline in large bold text - immediately communicates value proposition. "Limited Time Offer" supporting urgency text. "SHOP NOW" button in bright contrasting color (obviously clickable, not just text). Company logo visible but not dominant. Single clear message - viewer understands the offer in 1-2 seconds. High contrast throughout. Would drive clicks because CTA is obvious and value is clear.
</example>

<example type="avoid">
A banner with 50 words of text explaining every feature and benefit. No clear CTA button - just hyperlinked text that doesn't look clickable. Same colors as typical website content - banner blends in and is ignored. Company logo taking up 40% of the space. Multiple competing offers: "50% off AND free shipping AND buy-one-get-one AND loyalty points" - confusing. Tiny unreadable text because they tried to include too much. Viewer has no idea what to do or why they should click.
</example>
</examples>
`;
```

---

# UPDATED FORMAT TEMPLATES

## 1. Certificate (Updated with all fixes)

```typescript
function buildCertificatePrompt(
  data: CertificateFormData,
  options: EnhancedBuildOptions
): string {
  const style = data.style || 'classic';
  
  return `
<task>Generate a prestigious, professional certificate design</task>

<format>
Type: Formal Certificate
Aspect Ratio: Landscape (1.41:1, A4 proportions)
Purpose: Official recognition document that will be printed, framed, and displayed
Style Variant: ${style.charAt(0).toUpperCase() + style.slice(1)}
</format>

${buildLogoContext(options.logoAwareness)}

${buildBrandContext(options.brandContext)}

${buildQualityContext(options.resolution || '2K', 'certificate')}

<subject>
A formal certificate of ${data.certificateTitle || 'achievement'} ${data.issuingAuthority ? `issued by ${data.issuingAuthority}` : ''}.
This is an official document representing institutional authority and prestige.
The recipient should feel honored and proud to display this document.
</subject>

<composition>
Layout: Centered, symmetrical, formal arrangement

Structure:
- BORDER: ${getCertificateBorder(style)} framing entire document
- TOP LEFT: Space reserved for organization logo overlay ${options.logoAwareness?.logoPosition === 'top-left' ? '(PRIMARY LOGO ZONE - keep simple background)' : ''}
- TOP RIGHT: Official seal or emblem ${options.logoAwareness?.logoPosition === 'top-right' ? '(may have logo overlay - ensure compatibility)' : ''}
- TOP CENTER: Certificate title ("${data.certificateTitle || 'CERTIFICATE OF ACHIEVEMENT'}")
- CENTER: "This is to certify that" lead-in text (small, elegant)
- CENTER PROMINENT: Recipient name "${data.recipientName}" - THIS IS THE LARGEST TEXT ELEMENT
- BELOW CENTER: Achievement description "${data.achievementDescription || 'has successfully completed the program'}"
- BOTTOM SECTION: Two signature lines, equally spaced
  ${data.signatoryName ? `• Left signature: "${data.signatoryName}${data.signatoryDesignation ? ', ' + data.signatoryDesignation : ''}"` : ''}
  ${data.signatoryName2 ? `• Right signature: "${data.signatoryName2}${data.signatoryDesignation2 ? ', ' + data.signatoryDesignation2 : ''}"` : ''}
- BOTTOM: Date "${data.dateIssued ? formatDate(data.dateIssued) : ''}" and certificate number "${data.certificateNumber || ''}"

Background: ${getCertificateBackground(style)}
</composition>

<text_content>
<text role="title" prominence="prominent" style="elegant serif, ${style === 'modern' ? 'charcoal gray' : 'navy blue'}, centered with decorative underline">${data.certificateTitle || 'CERTIFICATE OF ACHIEVEMENT'}</text>
<text role="preface" prominence="small" style="refined serif italic, dark gray">This is to certify that</text>
<text role="recipient_name" prominence="LARGEST" style="${style === 'modern' ? 'bold elegant modern serif' : 'flowing calligraphy script'}, ${style === 'modern' ? 'black' : 'gold or deep navy'}, with decorative flourishes above and below">${data.recipientName}</text>
<text role="achievement" prominence="medium" style="clean readable serif, dark gray">${data.achievementDescription || 'has successfully completed the program'}</text>
${data.issuingAuthority ? `<text role="authority" prominence="small" style="clean serif">Issued by: ${data.issuingAuthority}</text>` : ''}
${data.signatoryName ? `<text role="signatory1" prominence="small" style="signature line with printed name below">${data.signatoryName}${data.signatoryDesignation ? ', ' + data.signatoryDesignation : ''}</text>` : ''}
${data.signatoryName2 ? `<text role="signatory2" prominence="small" style="signature line with printed name below">${data.signatoryName2}${data.signatoryDesignation2 ? ', ' + data.signatoryDesignation2 : ''}</text>` : ''}
<text role="date" prominence="small" style="small caps, bottom of document">${data.dateIssued ? formatDate(data.dateIssued) : 'Date'}</text>
${data.certificateNumber ? `<text role="reference" prominence="small" style="small monospace or serif">Certificate No: ${data.certificateNumber}</text>` : ''}
</text_content>

<style>
Visual Style: ${getStyleDescription(style)}
Color Palette: ${getCertificateColors(style, options.brandContext)}
Mood: Prestigious, authoritative, celebratory, worthy of framing
Typography: 
  - Title: Elegant ${style === 'modern' ? 'modern serif or clean sans-serif' : 'traditional serif'}, bold
  - Recipient Name: ${style === 'modern' ? 'Bold elegant serif' : 'Flowing calligraphy or script'} - LARGEST
  - Body: Clean readable serif
  - Signatures: Handwriting-style line with printed text below
Decorative Elements: ${getDecorativeElements(style)}
</style>

${CERTIFICATE_EXAMPLES}

<quality_markers>
- Print-ready, high-resolution output
- Frame-worthy presentation
- Professional enough for corporate or academic display
- Clear visual hierarchy with recipient name MOST PROMINENT
- All text clearly legible (especially recipient name and achievement)
- Balanced, symmetrical composition
- ${options.logoAwareness?.hasLogo ? 'Logo area kept clear with simple background for overlay' : ''}
- ${options.brandContext ? 'Brand colors subtly integrated' : ''}
</quality_markers>

<constraints>
Avoid: Blurry or pixelated elements, clipart, cartoon graphics, casual or playful fonts (Comic Sans, etc.), neon or overly bright colors, busy patterns, crowded layout, poor text hierarchy, stock photo elements, modern casual aesthetic (unless modern style selected), low resolution output
${options.logoAwareness?.hasLogo ? `Avoid: Complex patterns or important content in ${options.logoAwareness.logoPosition} area (logo overlay zone)` : ''}
</constraints>
`.trim();
}

function getCertificateBorder(style: string): string {
  const borders = {
    classic: 'Ornate decorative gold border with Victorian corner flourishes, nested double lines, intricate scrollwork',
    modern: 'Clean geometric border with subtle gold or silver line accents, minimal corner details',
    corporate: 'Professional double-line border with simple elegant corners, business-appropriate',
    academic: 'Traditional academic border with laurel leaf motifs, scholarly decorations'
  };
  return borders[style] || borders.classic;
}

function getCertificateBackground(style: string): string {
  const backgrounds = {
    classic: 'Cream/ivory aged parchment paper texture with subtle warmth',
    modern: 'Pure white or very light gray with minimal texture',
    corporate: 'Clean white or light cream, professional and clean',
    academic: 'Warm cream or ivory with subtle paper texture'
  };
  return backgrounds[style] || backgrounds.classic;
}

function getCertificateColors(style: string, brandContext?: BrandContext): string {
  if (brandContext?.primaryColor) {
    return `Primary: ${brandContext.primaryColor}, Secondary: ${brandContext.secondaryColor || 'gold'}, Accent: ${brandContext.accentColor || 'warm gold'} (brand colors applied)`;
  }
  
  const palettes = {
    classic: 'Navy blue (#1e3a5f) for text, antique gold (#d4af37) for accents and decorations, cream (#f5f5dc) background',
    modern: 'Charcoal gray (#36454f) for text, silver (#c0c0c0) for accents, white background',
    corporate: 'Corporate blue (#002366) for text, gold (#c9a227) for accents, white background',
    academic: 'Deep burgundy (#722f37) for text, bronze (#cd7f32) for accents, ivory (#fffff0) background'
  };
  return palettes[style] || palettes.classic;
}

function getStyleDescription(style: string): string {
  const descriptions = {
    classic: 'Classic traditional, Victorian-inspired, timeless elegance',
    modern: 'Contemporary elegant, minimalist formal, clean and sophisticated',
    corporate: 'Professional business, corporate appropriate, trustworthy',
    academic: 'Scholarly traditional, university-inspired, academic prestige'
  };
  return descriptions[style] || descriptions.classic;
}

function getDecorativeElements(style: string): string {
  const elements = {
    classic: 'Ornate corner flourishes, decorative underlines, embossed-effect seal, gold foil accents, ribbon graphics',
    modern: 'Subtle geometric accents, thin line dividers, minimalist seal icon, clean spacing',
    corporate: 'Professional seal, simple corner accents, clean divider lines, business-appropriate decorations',
    academic: 'Laurel wreaths, academic seal, scholarly motifs, traditional decorative elements'
  };
  return elements[style] || elements.classic;
}
```

## 2. Event Poster (Updated)

```typescript
function buildEventPosterPrompt(
  data: EventPosterFormData,
  options: EnhancedBuildOptions
): string {
  const eventContext = getEventContext(data.eventType);
  
  return `
<task>Generate a professional event poster that captures attention and communicates essential details</task>

<format>
Type: Event Promotional Poster
Aspect Ratio: Portrait 4:5 (optimal for both print and social sharing)
Purpose: Announce upcoming event, attract target audience, drive registrations
Event Type: ${data.eventType || 'Professional event'}
</format>

${buildLogoContext(options.logoAwareness)}

${buildBrandContext(options.brandContext)}

${buildQualityContext(options.resolution || '2K', 'event_poster')}

<subject>
A dynamic, eye-catching event poster for "${data.eventName}".
Target Audience: ${data.targetAudience || eventContext.defaultAudience}
The poster must pass the 3-SECOND TEST: viewer immediately understands WHAT (event name), WHEN (date/time), WHERE (venue).
This will be used for: print posters, social media sharing, digital displays.
</subject>

<composition>
Layout: Clear vertical hierarchy optimized for quick scanning

Structure from top to bottom:
- TOP (5-10%): Organization logo ${options.logoAwareness?.logoPosition === 'top-left' ? 'in TOP-LEFT (keep area clear for overlay)' : options.logoAwareness?.logoPosition === 'top-right' ? 'in TOP-RIGHT (keep area clear for overlay)' : 'positioned appropriately'}
- HEADLINE ZONE (25-30%): Event name "${data.eventName}" - DOMINANT, LARGEST, MOST IMPACTFUL
${data.eventDescription ? `- TAGLINE (5-10%): "${data.eventDescription}" - supporting message below headline` : ''}
- DETAILS ZONE (25-30%): Event information with clear iconography
  • 📅 Date: "${formatEventDate(data.eventDate)}"
  • 🕐 Time: "${data.eventTime || 'Time TBA'}"
  • 📍 Venue: "${data.venue}"
  ${data.entryFee ? `• 💰 Entry: "${data.entryFee}"` : ''}
${data.speakerName ? `- SPEAKER ZONE (15-20%): Featured speaker "${data.speakerName}${data.speakerDesignation ? ', ' + data.speakerDesignation : ''}" with circular photo placeholder area` : ''}
- CTA ZONE (10-15%): Strong call-to-action "${data.registrationInfo || 'Register Now'}" button
- FOOTER (5%): Additional info, sponsor logos if any

Background: ${eventContext.background}
${options.brandContext ? `Brand Integration: Incorporate ${options.brandContext.primaryColor} and ${options.brandContext.secondaryColor} into design` : ''}
</composition>

<text_content>
<text role="headline" prominence="LARGEST" style="bold impactful ${eventContext.headlineFont}, ${eventContext.headlineColor}">${data.eventName}</text>
${data.eventDescription ? `<text role="tagline" prominence="prominent" style="clean sans-serif, lighter weight">${data.eventDescription}</text>` : ''}
<text role="date" prominence="medium" style="bold with calendar icon, high visibility">📅 ${formatEventDate(data.eventDate)}</text>
<text role="time" prominence="medium" style="bold with clock icon, high visibility">🕐 ${data.eventTime || 'Time TBA'}</text>
<text role="venue" prominence="medium" style="clear with location icon">📍 ${data.venue}</text>
${data.entryFee ? `<text role="price" prominence="medium" style="highlighted, possibly in badge or tag format">💰 ${data.entryFee}</text>` : ''}
${data.speakerName ? `<text role="speaker" prominence="medium" style="featured section">Featuring: ${data.speakerName}${data.speakerDesignation ? ', ' + data.speakerDesignation : ''}</text>` : ''}
<text role="cta" prominence="prominent" style="bold button-style, ${eventContext.ctaStyle}">${data.registrationInfo || 'REGISTER NOW'}</text>
</text_content>

<style>
Visual Style: ${eventContext.style}
Color Palette: ${options.brandContext ? `Brand-adapted: ${options.brandContext.primaryColor}, ${options.brandContext.secondaryColor}, ${options.brandContext.accentColor || eventContext.ctaColor}` : eventContext.colors}
Mood: ${eventContext.mood}
Typography: 
  - Headlines: Bold, modern sans-serif that commands attention
  - Details: Clean, readable, with supportive icons
  - CTA: Bold, high contrast, button-style
Icons: Simple, modern iconography for date/time/venue (📅🕐📍 style)
Energy Level: ${eventContext.energy}
</style>

${EVENT_POSTER_EXAMPLES}

<quality_markers>
- Passes 3-SECOND TEST: What, When, Where are instantly visible
- Event name is dominant and impossible to miss
- Readable from both close-up (phone) and distance (printed poster)
- Professional marketing quality
- Clear visual hierarchy guiding eye from top to bottom
- CTA stands out and drives action
- All text clearly legible
- ${options.logoAwareness?.hasLogo ? 'Logo area kept clear with appropriate background' : ''}
</quality_markers>

<constraints>
Avoid: Cluttered layout, tiny unreadable text, poor hierarchy (event name not dominant), generic stock photo feel, unprofessional design, too many competing fonts, competing focal points, low contrast text on busy background, landscape orientation
${options.logoAwareness?.hasLogo ? `Avoid: Busy patterns or critical content in ${options.logoAwareness.logoPosition} (logo zone)` : ''}
</constraints>
`.trim();
}

function getEventContext(eventType: string) {
  const contexts = {
    conference: {
      background: 'Sleek corporate background with abstract blue geometric shapes, subtle light effects, professional atmosphere',
      style: 'Corporate professional, modern business event',
      colors: 'Deep blue (#003366), white, gold accent for CTA',
      mood: 'Professional, authoritative, networking-focused',
      energy: 'Professional, polished',
      headlineFont: 'sans-serif',
      headlineColor: 'white on dark blue',
      ctaColor: 'gold/yellow',
      ctaStyle: 'contrasting yellow/gold button',
      defaultAudience: 'Business professionals, industry experts'
    },
    workshop: {
      background: 'Warm, inviting gradient background (orange to coral or brand colors) suggesting collaboration and learning',
      style: 'Friendly professional, educational, approachable',
      colors: 'Blue (#0066cc), orange (#ff6600), white',
      mood: 'Educational, interactive, welcoming, hands-on',
      energy: 'Warm, inviting',
      headlineFont: 'sans-serif',
      headlineColor: 'dark on light OR white on vibrant',
      ctaColor: 'contrasting accent',
      ctaStyle: 'prominent contrasting button',
      defaultAudience: 'Learners, professionals seeking skills'
    },
    health_camp: {
      background: 'Fresh, clean gradient with soft green and white, subtle medical wellness symbols, clean and trustworthy',
      style: 'Healthcare appropriate, clean, trustworthy',
      colors: 'Fresh green (#28a745), white, soft blue accent',
      mood: 'Caring, professional, health-focused, welcoming',
      energy: 'Calm, reassuring',
      headlineFont: 'sans-serif',
      headlineColor: 'dark green on white OR white on green',
      ctaColor: 'blue or green',
      ctaStyle: 'clear, trustworthy button',
      defaultAudience: 'Community members, health-conscious individuals'
    },
    concert: {
      background: 'Dynamic background with stage lights, light rays, crowd silhouettes, energetic concert atmosphere',
      style: 'Entertainment, high-energy, exciting',
      colors: 'Purple (#8b00ff), electric blue (#00d4ff), pink, neon accents',
      mood: 'Exciting, energetic, entertainment, can\'t-miss',
      energy: 'High energy, electric',
      headlineFont: 'bold display sans-serif',
      headlineColor: 'bright/neon on dark',
      ctaColor: 'neon accent',
      ctaStyle: 'bold neon button',
      defaultAudience: 'Music lovers, entertainment seekers'
    },
    community: {
      background: 'Warm welcoming background with community gathering feel, warm earth tones, inclusive atmosphere',
      style: 'Warm, inclusive, community-focused',
      colors: 'Warm orange (#ff8c00), yellow (#ffd700), earth tones',
      mood: 'Welcoming, inclusive, community spirit, belonging',
      energy: 'Warm, inviting',
      headlineFont: 'friendly sans-serif',
      headlineColor: 'dark on warm',
      ctaColor: 'warm accent',
      ctaStyle: 'friendly, welcoming button',
      defaultAudience: 'Community members, families, neighbors'
    },
    tech: {
      background: 'Futuristic background with circuit patterns, digital elements, subtle code motifs, modern tech aesthetic',
      style: 'Modern tech, innovative, cutting-edge',
      colors: 'Electric blue (#00d4ff), purple (#7b68ee), dark background',
      mood: 'Innovative, technical, forward-thinking, exciting',
      energy: 'Dynamic, innovative',
      headlineFont: 'modern sans-serif',
      headlineColor: 'bright on dark',
      ctaColor: 'electric accent',
      ctaStyle: 'tech-styled button',
      defaultAudience: 'Tech professionals, developers, innovators'
    },
    sports: {
      background: 'Dynamic energetic background with motion blur effects, athletic energy, competition feel',
      style: 'Dynamic, athletic, high-energy',
      colors: 'Bold red (#dc3545), black, white, energetic accents',
      mood: 'Competitive, energetic, athletic, pumped',
      energy: 'High energy, athletic',
      headlineFont: 'bold impact sans-serif',
      headlineColor: 'white or bold on dynamic',
      ctaColor: 'red or high-energy',
      ctaStyle: 'bold action button',
      defaultAudience: 'Athletes, sports enthusiasts, competitors'
    },
    children: {
      background: 'Playful colorful background with child-friendly elements, safe and fun atmosphere, bright and cheerful',
      style: 'Playful, safe, family-friendly',
      colors: 'Primary colors (red, blue, yellow), pastels, bright and cheerful',
      mood: 'Fun, safe, engaging for families, child-appropriate',
      energy: 'Playful, joyful',
      headlineFont: 'friendly rounded sans-serif',
      headlineColor: 'colorful on light',
      ctaColor: 'bright primary',
      ctaStyle: 'fun, friendly button',
      defaultAudience: 'Families, parents, children'
    }
  };
  
  return contexts[eventType] || {
    background: 'Modern gradient background, professional and engaging',
    style: 'Professional, modern, attention-grabbing',
    colors: 'Vibrant, professional, brand-appropriate',
    mood: 'Professional, engaging, promotional',
    energy: 'Balanced, professional',
    headlineFont: 'sans-serif',
    headlineColor: 'high contrast',
    ctaColor: 'accent',
    ctaStyle: 'prominent button',
    defaultAudience: 'General audience'
  };
}
```

## 3. Instagram Post (Updated)

```typescript
function buildInstagramPrompt(
  data: InstagramFormData,
  options: EnhancedBuildOptions
): string {
  const postContext = getInstagramContext(data.postType);
  
  return `
<task>Generate a scroll-stopping Instagram post that demands attention in a crowded feed</task>

<format>
Type: Instagram Feed Post
Aspect Ratio: Square 1:1 (1080x1080 equivalent)
Purpose: Stop the scroll, communicate message instantly, drive engagement
Post Type: ${data.postType || 'Announcement'}
Viewing Context: Mobile phone feed, thumbnail size initially, competing with many posts
</format>

${buildLogoContext(options.logoAwareness)}

${buildBrandContext(options.brandContext)}

${buildQualityContext(options.resolution || '1K', 'instagram_post')}

<subject>
An eye-catching social media graphic that will STOP THE SCROLL.
Main Message: "${data.postTitle}"
Goal: ${postContext.goal}
Critical: Must capture attention within 0.5-1 second of viewing in feed.
</subject>

<composition>
Layout: ${postContext.layout}

Structure:
- BACKGROUND: ${postContext.background} ${options.brandContext ? `incorporating brand colors (${options.brandContext.primaryColor}, ${options.brandContext.secondaryColor})` : ''} 
- HEADLINE: "${data.postTitle}" - LARGE, BOLD, instantly readable on phone screen
${data.postCaption ? `- SUPPORTING TEXT: "${data.postCaption}" - smaller but still readable on mobile` : ''}
${data.callToAction ? `- CTA: "${data.callToAction}" - button-style or highlighted` : ''}
- LOGO ZONE: ${options.logoAwareness?.hasLogo ? `${options.logoAwareness.logoPosition} kept clear for logo overlay` : 'Small brand element in corner'}
- BREATHING ROOM: Generous white/negative space - NOT cramped

Text Sizing Rule: All text must be readable on a phone screen WITHOUT zooming
</composition>

<text_content>
<text role="headline" prominence="LARGEST" style="bold thick sans-serif, maximum contrast, ${postContext.headlineStyle}">${data.postTitle}</text>
${data.postCaption ? `<text role="supporting" prominence="medium" style="clean sans-serif, readable on mobile">${data.postCaption}</text>` : ''}
${data.callToAction ? `<text role="cta" prominence="prominent" style="button-style or arrow indicator, ${postContext.ctaStyle}">${data.callToAction}</text>` : ''}
</text_content>

<style>
Visual Style: ${postContext.style}
Color Palette: ${options.brandContext ? `Brand colors: ${options.brandContext.primaryColor}, ${options.brandContext.secondaryColor}` : postContext.colors}
Mood: ${postContext.mood}
Typography: 
  - Headlines: BOLD, THICK sans-serif (NOT thin or light weight)
  - Readable on phone without zooming
  - High contrast with background
Energy: ${postContext.energy}
</style>

${INSTAGRAM_POST_EXAMPLES}

<quality_markers>
- SCROLL-STOP TEST: Would this make you stop scrolling in your feed?
- MOBILE TEST: All text readable on phone screen without zooming
- CLARITY TEST: Single clear focal point, not cluttered
- ENGAGEMENT TEST: Design encourages like/comment/share
- BRAND TEST: ${options.brandContext ? 'Brand colors properly integrated' : 'Professional, polished look'}
- ${options.logoAwareness?.hasLogo ? 'Logo area clean and ready for overlay' : ''}
</quality_markers>

<constraints>
Avoid: Tiny text requiring zoom, cluttered composition with multiple competing elements, low contrast (text hard to read), boring/generic look that blends into feed, thin/light fonts that disappear, too much text (keep headline under 10 words), busy background under text, muted/dull colors that don't pop
${options.logoAwareness?.hasLogo ? `Avoid: Complex elements in ${options.logoAwareness.logoPosition} (logo zone)` : ''}
</constraints>
`.trim();
}
```

---

# COMPLETE ENHANCED PROMPT BUILDER

```typescript
// lib/services/yiPromptBuilder.v3.ts

export class YiPromptBuilder {
  
  private static systemInstruction = `
You are Yi CreativeStudio's image generation engine. You create professional marketing and design assets for NGOs and businesses in India.

Your outputs must be:
- Professional and print-ready quality
- Culturally appropriate for Indian audiences  
- Brand-consistent when brand guidelines are provided
- Clear and legible text (max 25 characters per text element, 2-3 phrases max)

When generating images:
1. Follow the structured prompt format exactly
2. Render text clearly and legibly - this is critical
3. Maintain proper visual hierarchy (largest elements are most important)
4. Reserve logo zones - keep them simple for overlay
5. Use colors appropriate for the format and brand
6. Ensure composition works for the specified aspect ratio
`;

  /**
   * Build complete API request payload with all enhancements
   */
  static buildRequest(
    formatId: string,
    formData: Record<string, any>,
    options: EnhancedBuildOptions = {}
  ): GeminiImageRequest {
    
    // Build the structured prompt
    let prompt = this.buildPrompt(formatId, formData, options);
    
    // Inject vertical context if applicable
    if (options.verticalId) {
      prompt = this.injectVerticalContext(prompt, options.verticalId);
    }
    
    // Determine model based on engine choice and format
    const recommendedEngine = this.getRecommendedEngine(formatId);
    const engine = options.engine || recommendedEngine;
    
    const model = engine === 'yi_craft' 
      ? 'gemini-3-pro-image-preview'  // Better for text-heavy designs
      : 'gemini-2.5-flash-image';     // Faster, good for general designs
    
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
   * Build prompt with all context injections
   */
  static buildPrompt(
    formatId: string,
    formData: Record<string, any>,
    options: EnhancedBuildOptions
  ): string {
    
    switch (formatId) {
      case 'certificate':
        return buildCertificatePrompt(formData, options);
      case 'event_poster':
        return buildEventPosterPrompt(formData, options);
      case 'instagram_post':
        return buildInstagramPrompt(formData, options);
      case 'instagram_story':
      case 'whatsapp_status':
        return buildStoryPrompt(formData, options);
      case 'youtube_thumbnail':
        return buildYouTubeThumbnailPrompt(formData, options);
      case 'linkedin_post':
        return buildLinkedInPrompt(formData, options);
      case 'facebook_post':
        return buildFacebookPostPrompt(formData, options);
      case 'twitter_post':
        return buildTwitterPostPrompt(formData, options);
      case 'flyer_a4':
      case 'flyer_a5':
        return buildFlyerPrompt(formData, options);
      case 'business_card':
        return buildBusinessCardPrompt(formData, options);
      case 'presentation_16_9':
      case 'presentation_4_3':
        return buildPresentationPrompt(formData, options);
      case 'web_banner':
      case 'leaderboard_ad':
        return buildWebBannerPrompt(formData, options);
      default:
        return buildGenericPrompt(formatId, formData, options);
    }
  }

  /**
   * Inject vertical-specific context
   */
  static injectVerticalContext(prompt: string, verticalId: string): string {
    const context = VERTICAL_CONTEXTS[verticalId];
    if (!context) return prompt;
    
    // Find the constraints section and inject before it
    const constraintsIndex = prompt.indexOf('<constraints>');
    if (constraintsIndex === -1) {
      return prompt + '\n\n' + context.additionalContext;
    }
    
    const beforeConstraints = prompt.substring(0, constraintsIndex);
    const constraintsSection = prompt.substring(constraintsIndex);
    
    // Add vertical-specific avoidances to constraints
    const enhancedConstraints = constraintsSection.replace(
      'Avoid:',
      `Avoid: ${context.avoidance}. Also avoid:`
    );
    
    return beforeConstraints + 
      context.additionalContext + '\n' +
      `<vertical_imagery>${context.imageryGuidance}</vertical_imagery>\n` +
      `<vertical_colors>Preferred: ${context.colorPreferences}</vertical_colors>\n\n` +
      enhancedConstraints;
  }

  /**
   * Get recommended engine based on format requirements
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
      'report_cover',
      'book_cover'
    ];
    
    return textHeavyFormats.includes(formatId) ? 'yi_craft' : 'yi_vision';
  }

  /**
   * Get all available examples for a format
   */
  static getExamples(formatId: string): string {
    const examples = {
      certificate: CERTIFICATE_EXAMPLES,
      event_poster: EVENT_POSTER_EXAMPLES,
      instagram_post: INSTAGRAM_POST_EXAMPLES,
      instagram_story: STORY_EXAMPLES,
      whatsapp_status: STORY_EXAMPLES,
      youtube_thumbnail: YOUTUBE_THUMBNAIL_EXAMPLES,
      linkedin_post: LINKEDIN_POST_EXAMPLES,
      flyer_a4: FLYER_EXAMPLES,
      flyer_a5: FLYER_EXAMPLES,
      business_card: BUSINESS_CARD_EXAMPLES,
      presentation_16_9: PRESENTATION_EXAMPLES,
      presentation_4_3: PRESENTATION_EXAMPLES,
      web_banner: WEB_BANNER_EXAMPLES,
      leaderboard_ad: WEB_BANNER_EXAMPLES
    };
    
    return examples[formatId] || '';
  }
}

// Vertical contexts (as defined earlier)
const VERTICAL_CONTEXTS = {
  masoom: {
    verticalId: 'masoom',
    name: 'Yi Masoom - Child Safety',
    additionalContext: `
<vertical_context>
Initiative: Yi Masoom (Child Safety)
Design Requirements:
- Family-friendly and appropriate for all ages
- Warm, welcoming, and trustworthy aesthetic
- Focus on protection, safety, and care for children
- Suitable for schools, community centers, family environments
- NO scary, threatening, or adult-only imagery
</vertical_context>`,
    colorPreferences: 'Warm friendly colors: soft orange, sunshine yellow, sky blue, warm green. Avoid dark or aggressive colors.',
    imageryGuidance: 'Imagery: families, protection, schools, community, safety, happy children in safe environments.',
    avoidance: 'scary imagery, dark themes, threatening visuals, adult-only content, anything inappropriate for children'
  },
  
  road_safety: {
    verticalId: 'road_safety', 
    name: 'Yi Road Safety',
    additionalContext: `
<vertical_context>
Initiative: Yi Road Safety
Design Requirements:
- Clear safety messaging
- High-visibility colors for attention
- Appropriate for public display (billboards, schools, offices)
- Emphasize safe behavior and accident prevention
- Educational and awareness-focused
</vertical_context>`,
    colorPreferences: 'High-visibility: safety yellow, alert orange, traffic red, warning colors. High contrast.',
    imageryGuidance: 'Imagery: roads, vehicles, pedestrians, helmets, seatbelts, safe crossing, positive safe behaviors.',
    avoidance: 'graphic accident scenes, injuries, blood, disturbing crash imagery'
  },
  
  health: {
    verticalId: 'health',
    name: 'Yi Health', 
    additionalContext: `
<vertical_context>
Initiative: Yi Health
Design Requirements:
- Convey trust and medical professionalism
- Welcoming, not overly clinical
- Appropriate for healthcare settings
- Encourage healthy behaviors
- Reassuring and supportive
</vertical_context>`,
    colorPreferences: 'Healthcare: clean blues, fresh greens, clinical whites, calming colors.',
    imageryGuidance: 'Imagery: healthcare, wellness, medical professionals, healthy lifestyle, community health.',
    avoidance: 'graphic medical imagery, sick/suffering people, depressing health content'
  },
  
  yuva: {
    verticalId: 'yuva',
    name: 'Yi Yuva - Youth',
    additionalContext: `
<vertical_context>
Initiative: Yi Yuva (Youth Empowerment)
Design Requirements:
- Appeal to young professionals (18-35)
- Modern, dynamic, forward-looking
- Convey growth, opportunity, aspiration
- Energetic without being juvenile
- Career and skill focused
</vertical_context>`,
    colorPreferences: 'Modern energetic: electric blue, vibrant purple, dynamic orange.',
    imageryGuidance: 'Imagery: young professionals, career growth, technology, education, aspiration, success.',
    avoidance: 'dated/old-fashioned looks, corporate boring, juvenile/childish elements'
  },
  
  climate: {
    verticalId: 'climate',
    name: 'Yi Climate',
    additionalContext: `
<vertical_context>
Initiative: Yi Climate Action
Design Requirements:
- Convey environmental responsibility
- Hopeful and action-oriented (NOT doom and gloom)
- Emphasize positive action and solutions
- Connect with nature and sustainability
- Inspiring change
</vertical_context>`,
    colorPreferences: 'Environmental: earth greens, sky blues, natural earth tones.',
    imageryGuidance: 'Imagery: thriving nature, sustainability, renewable energy, green actions, healthy ecosystems.',
    avoidance: 'disaster imagery, doom messaging, dying nature, depressing environmental content'
  },
  
  innovation: {
    verticalId: 'innovation',
    name: 'Yi Innovation',
    additionalContext: `
<vertical_context>
Initiative: Yi Innovation
Design Requirements:
- Cutting-edge, forward-thinking aesthetic
- Appeal to tech-savvy audience
- Convey innovation and disruption
- Modern and sleek
- Startup and entrepreneurship focused
</vertical_context>`,
    colorPreferences: 'Tech-forward: electric blue, neon accents, futuristic gradients.',
    imageryGuidance: 'Imagery: technology, innovation, startups, digital transformation, futuristic elements.',
    avoidance: 'outdated tech, old computers, non-innovative/traditional imagery'
  }
};

// Helper functions
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
  if (!dateString) return 'Date TBA';
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

# API ROUTE INTEGRATION

## Updated API Route Snippet

```typescript
// In your API route, update the XML prompt generation section:

// Build options with all context
const buildOptions: EnhancedBuildOptions = {
  verticalId: promptDesignData.vertical || undefined,
  engine: promptDesignData.engine || undefined,
  resolution: resolution || '2K',
  
  // Logo awareness - CRITICAL FIX
  logoAwareness: promptDesignData.logoAwareness || {
    hasLogo: !!promptDesignData.logoUrl,
    logoPosition: promptDesignData.logoPosition || 'top-left',
    logoSize: promptDesignData.logoSize || 'medium',
    clearZone: `Keep ${promptDesignData.logoPosition || 'top-left'} area clear for logo overlay`
  },
  
  // Brand context - CRITICAL FIX
  brandContext: promptDesignData.organizationColors ? {
    primaryColor: promptDesignData.organizationColors.primary,
    secondaryColor: promptDesignData.organizationColors.secondary,
    accentColor: promptDesignData.organizationColors.accent,
    brandName: promptDesignData.organizationName
  } : undefined
};

// Generate the enhanced prompt
const xmlPrompt = YiPromptBuilder.buildPrompt(
  selectedFormat,
  formData,
  buildOptions
);

// Build the full request
const request = YiPromptBuilder.buildRequest(
  selectedFormat,
  formData,
  buildOptions
);

// Use the request to call Gemini API
const imageUrl = await generateWithGemini(request);
```

---

# TESTING CHECKLIST

## After implementing v3.0, verify:

### Logo Awareness
- [ ] Logo zone is mentioned in prompt
- [ ] Clear zone instructions included
- [ ] Background in logo area is simple/solid

### Brand Context  
- [ ] Brand colors appear in `<style>` section
- [ ] Colors applied appropriately to elements
- [ ] Brand name referenced if provided

### Few-Shot Examples
- [ ] Certificate has examples ✓
- [ ] Event poster has examples ✓
- [ ] Instagram has examples ✓
- [ ] YouTube thumbnail has examples ✓
- [ ] LinkedIn has examples ✓
- [ ] Story format has examples ✓
- [ ] Flyer has examples ✓
- [ ] Business card has examples ✓
- [ ] Presentation has examples ✓
- [ ] Web banner has examples ✓

### Resolution/Quality
- [ ] `<quality>` section present in all prompts
- [ ] Resolution specified (1K/2K/4K)
- [ ] Format-specific quality requirements included

### Missing Fields Added
- [ ] Certificate: style dropdown working
- [ ] Certificate: issuingAuthority field added
- [ ] Event poster: entryFee field added
- [ ] Event poster: targetAudience field added

### Vertical Context
- [ ] Vertical context injected when vertical selected
- [ ] Vertical-specific colors mentioned
- [ ] Vertical-specific imagery guidance included
- [ ] Vertical-specific avoidances added to constraints