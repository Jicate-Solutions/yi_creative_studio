# Prompt Knowledge Base Documentation

This document provides comprehensive guidance for preparing AI prompts for each creative type in Yi CreativeStudio.

## Overview

The prompt knowledge base uses **10 base patterns** to serve **37+ creative formats**. This modular approach ensures consistent, high-quality AI generation across all creative types while maintaining format-specific optimizations.

---

## Architecture

```
Format Request → Pattern Mapping → Base Pattern + Format Overrides → Final Prompt
```

Each format maps to a base pattern that defines:
- **Text Elements**: Headlines, subheadlines, CTAs, body text
- **Layout Zones**: Where content should be placed
- **Typography**: Font styles and mood
- **Visuals**: Recommended imagery and backgrounds
- **Negative Prompts**: What to avoid in generation
- **Prompt Template**: The actual prompt structure

---

## Format-to-Pattern Mapping

### Quick Reference Table

| Base Pattern | Aspect Ratio | Formats |
|-------------|--------------|---------|
| Square Social | 1:1 | Instagram Post, Facebook Ad, Square Ad |
| Portrait Story | 9:16 | Instagram Story/Reel, TikTok, WhatsApp Status, Portrait Poster |
| Landscape Feed | 16:9 | Facebook Post, LinkedIn Post, Twitter Post, Landscape Poster |
| Banner Header | Ultra-wide | Facebook Cover, LinkedIn Banner, Twitter Header, YouTube Banner, Web Banner, Email Header, Billboard |
| Thumbnail Click | 16:9 | YouTube Thumbnail, Video Cover |
| Print Portrait | Portrait | Flyer A4/A5, Brochure, Invitation, Pinterest Pin |
| Print Landscape | Landscape | Certificate, Presentation 16:9, Presentation 4:3 |
| Event Poster | 4:5 | Event Poster, Announcement |
| Formal Document | Portrait | Letterhead, Resume, Report Cover, Book Cover |
| Ad Unit | Variable | Leaderboard Ad, Business Card |

---

## Base Patterns Detail

### 1. Event Poster (4:5 Aspect Ratio)

**Use For**: Event Poster, Announcement

**Text Elements**:
| Element | Role | Max Length | Typography | Position |
|---------|------|------------|------------|----------|
| Event Name | Headline | 50 chars | Bold display sans-serif | Top third |
| Tagline | Subheadline | 100 chars | Clean secondary font | Below headline |
| Date/Time | Supporting | 30 chars | Clear, readable | Middle section |
| Location | Supporting | 50 chars | Clean secondary | Below date |
| CTA | Call-to-action | 30 chars | Bold, action-oriented | Bottom third |

**Layout Zones**:
- **Header (30%)**: Logo, event name
- **Visual (40%)**: Main imagery, speaker photos
- **Details (30%)**: Date, time, location, CTA

**Visual Recommendations**:
- Dynamic event imagery
- People/crowds
- Stage lighting
- Bold graphics

**Backgrounds**:
- Gradient sweeps
- Event photography
- Abstract patterns

**Avoid**:
- Stock photo feel
- Cluttered layouts
- Too many fonts
- Poor hierarchy

**Prompt Template**:
```
Create a professional event poster design that captures attention.

The headline reads "[headline]" in bold, impactful typography at the top.
[subheadline_section]
[date_section]
[location_section]
[cta_section]

[visual_elements]

Design should have clear visual hierarchy with event details easily scannable.
Professional quality suitable for both digital and print.

[color_scheme]
Quality: Event-ready, professional, engaging
```

**Quality Keywords**: professional, event-ready, engaging, promotional

---

### 2. Square Social (1:1 Aspect Ratio)

**Use For**: Instagram Post, Facebook Ad, Square Ad

**Text Elements**:
| Element | Role | Max Length | Typography | Position |
|---------|------|------------|------------|----------|
| Headline | Main message | 40 chars | Bold, eye-catching sans-serif | Center or top third |
| Subheadline | Supporting | 60 chars | Clean supporting text | Below headline |
| CTA | Call-to-action | 20 chars | Bold, action-oriented | Bottom third |

**Layout Zones**:
- **Main (100%)**: Centered content, radial visual flow

**Visual Recommendations**:
- Vibrant colors
- Strong contrast
- Clean composition
- Lifestyle imagery

**Backgrounds**:
- Solid bold colors
- Gradient backgrounds
- Lifestyle photography

**Avoid**:
- Too much text
- Cluttered composition
- Dark/hard to read
- Small fonts

**Prompt Template**:
```
Create an eye-catching square social media post that stops the scroll.

The headline reads "[headline]" in bold, eye-catching typography.
[subheadline_section]
[cta_section]

[visual_elements]

Design should be bold, vibrant, and optimized for mobile viewing.
Text must be large enough to read on a phone screen.

[color_scheme]
[style_treatment]

Quality: Social-media-worthy, engagement-optimized, mobile-first
```

**Quality Keywords**: scroll-stopping, engagement-optimized, mobile-first, vibrant

---

### 3. Portrait Story (9:16 Aspect Ratio)

**Use For**: Instagram Story/Reel, TikTok Cover, WhatsApp Status, Portrait Poster

**Text Elements**:
| Element | Role | Max Length | Typography | Position |
|---------|------|------------|------------|----------|
| Headline | Main message | 30 chars | Bold, impactful sans-serif | Center safe zone |
| CTA | Action prompt | 15 chars | Bold with swipe indicator | Lower center (above UI) |

**CRITICAL: Safe Zone Rules**:
- **Top 15%**: AVOID - Platform UI (story bar, profile info)
- **Center 65%**: SAFE - Main content area
- **Bottom 20%**: AVOID - Reply box, navigation

**Layout Zones**:
- **Top Safe (15%)**: Reserved for platform UI
- **Main (65%)**: All key content goes here
- **Bottom Safe (20%)**: Reserved for platform UI

**Visual Recommendations**:
- Full-screen visuals
- Strong focal point
- Bright colors
- Movement suggestion

**Backgrounds**:
- Gradient backgrounds
- Lifestyle photos
- Abstract patterns

**Avoid**:
- Small text
- Content in corners
- Busy backgrounds
- Horizontal layouts

**Prompt Template**:
```
Create a full-screen vertical story design that grabs attention instantly.

The headline reads "[headline]" in bold, impactful typography centered in the safe zone.
[cta_section]

SAFE ZONE RULES:
- Keep key content in CENTER 65% of frame
- Avoid top 15% (platform UI)
- Avoid bottom 20% (reply/navigation)

[visual_elements]
[color_scheme]

Quality: Story-optimized, thumb-stopping, full-screen impact
```

**Quality Keywords**: thumb-stopping, full-screen, story-optimized, mobile-native

---

### 4. Landscape Feed (16:9 Aspect Ratio)

**Use For**: Facebook Post, LinkedIn Post, Twitter Post, Landscape Poster

**Text Elements**:
| Element | Role | Max Length | Typography | Position |
|---------|------|------------|------------|----------|
| Headline | Main message | 80 chars | Bold, professional sans-serif | Center or left-aligned |
| Subheadline | Supporting | 120 chars | Clean supporting text | Below headline |
| CTA | Call-to-action | 25 chars | Bold button-style text | Bottom or alongside headline |

**Layout Zones**:
- **Visual (50%)**: Left side - imagery
- **Content (50%)**: Right side - text

**Visual Recommendations**:
- Professional imagery
- Data visualizations
- Lifestyle photography

**Backgrounds**:
- Gradient backgrounds
- Solid colors
- Professional photos

**Avoid**:
- Cluttered composition
- Too much text
- Unprofessional imagery

**Prompt Template**:
```
Create a professional landscape post optimized for feed engagement.

The headline reads "[headline]" in bold, professional typography.
[subheadline_section]
[cta_section]

[visual_elements]

Design should be professional, clear, and optimized for desktop and mobile viewing.
Balance visual impact with clear messaging.

[color_scheme]
[style_treatment]

Quality: Feed-optimized, professional, engaging
```

**Quality Keywords**: feed-optimized, professional, engaging, authoritative

---

### 5. Banner Header (Ultra-Wide Aspect Ratio)

**Use For**: Facebook Cover, LinkedIn Banner, Twitter Header, YouTube Banner, Web Banner, Email Header, Billboard

**Text Elements**:
| Element | Role | Max Length | Typography | Position |
|---------|------|------------|------------|----------|
| Headline | Main message | 50 chars | Bold, impactful sans-serif | Center zone |
| Tagline | Supporting | 80 chars | Clean supporting text | Below or beside headline |

**CRITICAL: Safe Zone Rules**:
- **Left 15%**: AVOID - Profile picture overlap
- **Center 70%**: SAFE - Main content area
- **Right 15%**: AVOID - Platform elements

**Layout Zones**:
- **Left Safe (15%)**: Reserved for profile overlap
- **Center (70%)**: Main content area
- **Right Safe (15%)**: Reserved

**Visual Recommendations**:
- Panoramic visuals
- Gradient backgrounds
- Brand imagery

**Backgrounds**:
- Gradient sweeps
- Professional photos
- Abstract patterns

**Avoid**:
- Important content at edges
- Small text
- Cluttered layouts

**Prompt Template**:
```
Create a professional banner/header design with wide aspect ratio.

The headline reads "[headline]" in bold, impactful typography positioned in the center zone.
[tagline_section]

BANNER RULES:
- Keep important content in CENTER 70% of frame
- Avoid left 15% (profile picture overlap area)
- Design for cropping on different devices

[visual_elements]
[color_scheme]

Quality: Banner-optimized, brand-forward, professional
```

**Quality Keywords**: banner-optimized, brand-forward, professional, impactful

---

### 6. Thumbnail Click (16:9 Aspect Ratio)

**Use For**: YouTube Thumbnail, Video Cover

**Text Elements**:
| Element | Role | Max Length | Typography | Position |
|---------|------|------------|------------|----------|
| Title | Headline | 30 chars | BOLD, thick sans-serif with outline | Prominent position |

**CRITICAL Rules**:
- 3-5 words MAX for title
- ALL CAPS for impact
- Must be readable at small sizes
- Include expressive human face (fills 50%+ of frame)

**Layout Zones**:
- **Face Area (60%)**: Left side - subject/face
- **Text Area (40%)**: Right side - title
- **Duration Badge**: Bottom-right - AVOID (YouTube overlay)

**Visual Recommendations**:
- Expressive human face
- Emotion close-up
- Bright colors
- Action moment

**Backgrounds**:
- Bold solid colors
- Gradient backgrounds
- Blurred context

**Avoid**:
- Too many elements
- Small faces
- Muted colors
- Generic imagery

**Prompt Template**:
```
Create a click-worthy thumbnail that DEMANDS attention.

Include an EXPRESSIVE human face or compelling subject (fills 50%+ of frame).
The headline reads "[title]" in BOLD typography with outline, readable at small sizes.

[subject_description]

THUMBNAIL RULES:
- Face or subject fills left 60% of frame
- Text positioned for contrast and readability
- Avoid bottom-right corner (duration badge area)

Colors: Bright, saturated, contrasting
Style: YouTube thumbnail style - bold outlines, dramatic lighting

Quality: Click-worthy, scroll-stopping, competitive
```

**Quality Keywords**: click-worthy, scroll-stopping, YouTube-optimized, competitive

---

### 7. Print Portrait (Portrait Aspect Ratio)

**Use For**: Flyer A4/A5, Brochure, Invitation, Pinterest Pin

**Text Elements**:
| Element | Role | Max Length | Typography | Position |
|---------|------|------------|------------|----------|
| Headline | Main message | 60 chars | Bold, attention-grabbing sans-serif | Top third |
| Subheadline | Supporting | 100 chars | Clean supporting text | Below headline |
| Body | Details | Flexible | Readable body text | Middle section |
| CTA | Call-to-action | 30 chars | Bold call-to-action | Bottom third |

**Layout Zones**:
- **Header (30%)**: Top - headline area
- **Body (50%)**: Center - main content
- **Footer (20%)**: Bottom - CTA area

**Visual Recommendations**:
- High-quality photography
- Clean graphics
- Visual hierarchy

**Backgrounds**:
- Gradient backgrounds
- Solid colors
- Subtle textures

**Avoid**:
- Low resolution images
- Cluttered layouts
- Too many fonts

**Prompt Template**:
```
Create a professional print-ready portrait design.

The headline reads "[headline]" in bold, attention-grabbing typography at the top.
[subheadline_section]
[body_section]
[cta_section]

[visual_elements]

PRINT RULES:
- High resolution, print-quality imagery
- Clear visual hierarchy with distinct sections
- Balanced white space
- Bleed-safe margins

[color_scheme]
Quality: Print-ready, professional, promotional
```

**Quality Keywords**: print-ready, promotional, professional, high-quality

---

### 8. Print Landscape (Landscape Aspect Ratio)

**Use For**: Certificate, Presentation 16:9, Presentation 4:3

**Text Elements**:
| Element | Role | Max Length | Typography | Position |
|---------|------|------------|------------|----------|
| Title | Headline | 80 chars | Elegant serif or formal sans-serif | Upper center |
| Recipient | Honoree | 60 chars | Script or elegant serif | Center |
| Description | Details | 200 chars | Clean readable body | Below recipient |
| Signature | Authority | 50 chars | Script or formal serif | Bottom section |

**Layout Zones**:
- **Header (20%)**: Title, organization
- **Main (60%)**: Recipient, description
- **Footer (20%)**: Signatures, date

**Visual Recommendations**:
- Elegant borders
- Formal decorations
- Quality paper texture
- Gold/silver accents

**Backgrounds**:
- Cream/ivory paper texture
- Subtle patterns
- Formal borders

**Avoid**:
- Casual elements
- Bright colors
- Informal fonts
- Cluttered decorations

**Prompt Template**:
```
Create a formal certificate/document design with elegant presentation.

The title reads "[title]" in elegant, formal typography at the top.
The recipient "[recipient]" is prominently featured in the center.
[description_section]
[signature_section]

[visual_elements]

FORMAL DOCUMENT RULES:
- Elegant, professional appearance
- Clear hierarchy and readability
- Formal decorative elements (borders, seals)
- High-quality paper texture feel

[color_scheme]
Quality: Certificate-grade, formal, prestigious
```

**Quality Keywords**: certificate-grade, formal, prestigious, elegant

---

### 9. Formal Document (Portrait Aspect Ratio)

**Use For**: Letterhead, Resume, Report Cover, Book Cover

**Text Elements**:
| Element | Role | Max Length | Typography | Position |
|---------|------|------------|------------|----------|
| Title | Headline | 100 chars | Formal serif or clean sans-serif | Top section |
| Subtitle | Subheadline | 150 chars | Clean supporting | Below title |
| Body | Content | Flexible | Readable body text | Main area |
| Footer | Info | 100 chars | Small, clean | Bottom |

**Layout Zones**:
- **Header (15%)**: Logo, title
- **Main (70%)**: Primary content
- **Footer (15%)**: Contact info

**Visual Recommendations**:
- Professional imagery
- Clean layouts
- Corporate aesthetics
- Minimal decoration

**Backgrounds**:
- White/off-white
- Subtle patterns
- Professional colors

**Avoid**:
- Casual imagery
- Bright colors
- Playful elements
- Cluttered layouts

**Prompt Template**:
```
Create a professional formal document design.

The title reads "[title]" in formal, professional typography.
[subtitle_section]
[body_section]
[footer_section]

[visual_elements]

DOCUMENT RULES:
- Clean, professional layout
- Clear information hierarchy
- Consistent branding elements
- Print-ready quality

[color_scheme]
Quality: Business-grade, professional, polished
```

**Quality Keywords**: business-grade, professional, polished, formal

---

### 10. Ad Unit (Variable Aspect Ratio)

**Use For**: Leaderboard Ad, Business Card, Display Ads

**Text Elements**:
| Element | Role | Max Length | Typography | Position |
|---------|------|------------|------------|----------|
| Headline | Main message | 25 chars | BOLD, high-contrast sans-serif | Prominent position |
| CTA | Action button | 15 chars | Bold button-style text | Clear action area |

**CRITICAL Rules**:
- Must grab attention in 1-2 seconds
- Single clear message
- High contrast for readability
- Obvious call-to-action

**Layout Zones**:
- **Visual**: Dynamic positioning - imagery
- **Message**: Dynamic positioning - text
- **CTA Zone**: Bottom - action button

**Visual Recommendations**:
- Single focal point
- High contrast
- Brand colors

**Backgrounds**:
- Solid bold colors
- Gradient backgrounds

**Avoid**:
- Cluttered composition
- Small text
- Multiple messages

**Prompt Template**:
```
Create a high-impact display ad that drives clicks.

The headline reads "[headline]" in BOLD, attention-grabbing typography.
The call-to-action reads "[cta]" in a clearly clickable button style.

[visual_elements]

AD RULES:
- Single clear message
- High contrast for readability
- Obvious call-to-action
- Attention-grabbing in 1-2 seconds

[color_scheme]
Quality: Click-driving, high-impact, conversion-optimized
```

**Quality Keywords**: high-impact, click-driving, conversion-optimized, attention-grabbing

---

## Universal Negative Prompts

Always include these negative prompts to avoid common AI generation issues:

### Base Negatives (All Formats):
- blurry
- pixelated
- low quality
- watermarks
- mockup
- poster on wall
- text rendering errors
- misspelled words

### Format-Specific Negatives:

**Social Media**:
- stock photo feel
- corporate boring
- too much text
- small fonts

**Print Materials**:
- low resolution
- landscape orientation (for portrait)
- portrait orientation (for landscape)
- no bleed margins

**Video Thumbnails**:
- no face visible
- boring composition
- content in duration badge area

**Stories/Reels**:
- content in UI zones
- horizontal composition
- small text

---

## Best Practices

### 1. Text Rendering
- Keep text minimal - AI image models struggle with text
- Use ALL CAPS for headlines (better AI text rendering)
- Avoid pixel values in prompts
- Use semantic descriptions ("top area" not "120px from top")

### 2. Layout Guidance
- Use composition language, not technical instructions
- Describe "clear space" instead of "reserved zones"
- Focus on visual balance and breathing room

### 3. Color Schemes
- Specify brand colors as descriptive terms
- Use "vibrant", "bold", "muted", "professional" descriptors
- Mention color harmony (complementary, analogous)

### 4. Quality Keywords
- Always end prompts with quality descriptors
- Use format-appropriate keywords (scroll-stopping for social, print-ready for documents)
- Include output quality (high resolution, professional grade)

### 5. Logo Safe Zones
- Never use pixel values for logo placement
- Use natural language: "upper left area", "center region"
- Describe as "branding space" or "clear area for overlay"

---

## Prompt Construction Flow

```
1. Get format ID (e.g., "instagram_post")
2. Map to base pattern (e.g., "square_social")
3. Load base pattern template
4. Apply format-specific overrides
5. Fill in user content (headline, description, etc.)
6. Add visual style based on design selections
7. Apply color scheme
8. Add negative prompts
9. Sanitize for AI rendering (remove technical terms)
10. Generate final prompt
```

---

## Example Complete Prompts

### Instagram Post
```
Create an eye-catching square social media post that stops the scroll.

The headline reads "JOIN US THIS WEEKEND" in bold, eye-catching typography.
Supporting text: "Annual Community Meetup 2025"
Call-to-action: "Register Now"

Visual style: Modern, vibrant, community-focused
Include: People gathering, event atmosphere
Background: Gradient from brand yellow to warm orange

Design should be bold, vibrant, and optimized for mobile viewing.
Text must be large enough to read on a phone screen.
Reserve clear space in upper left for branding overlay.

Quality: Social-media-worthy, engagement-optimized, mobile-first
```

### Certificate
```
Create a formal certificate design with elegant presentation.

The title reads "CERTIFICATE OF ACHIEVEMENT" in elegant, formal typography at the top.
The recipient "John Doe" is prominently featured in the center in elegant script.
Description: "For outstanding contribution to community service"
Authority: "Signed by the Chapter President"

Visual style: Elegant with gold accents, formal borders
Include: Decorative corner elements, official seal placeholder
Background: Cream paper texture with subtle pattern

Design with clear space at bottom-left and top-right for organization logos.
Use solid or gradient backgrounds in branding spaces for best visibility.

Quality: Certificate-grade, formal, prestigious
```

---

## Maintenance Notes

When adding new formats:
1. Identify the closest existing base pattern
2. Add format ID to `FORMAT_TO_PATTERN` mapping
3. Create format-specific overrides if needed in `format-overrides/`
4. Test generation with sample prompts

When modifying patterns:
1. Changes affect ALL formats mapped to that pattern
2. Test across multiple formats before deploying
3. Update this documentation accordingly
