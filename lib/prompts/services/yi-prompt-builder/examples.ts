/**
 * Few-Shot Examples for Yi Prompt Builder v3.0
 * Provides good/avoid examples for all format types
 * Based on Gemini API best practices for few-shot prompting
 */

// ============================================================
// CERTIFICATE EXAMPLES
// ============================================================

export const CERTIFICATE_EXAMPLES = `
<examples>
<example type="good">
A prestigious certificate with an ornate gold border featuring intricate Victorian corner scrollwork. The cream parchment background has subtle aging texture. "CERTIFICATE OF EXCELLENCE" appears in elegant navy serif at top center. The recipient name "DR. PRIYA SHARMA" is the LARGEST element, written in beautiful gold calligraphy script, underlined with decorative flourishes. Achievement text "For outstanding contribution to community healthcare" appears below in refined serif. Official embossed gold seal with ribbon in top-right corner. Two signature lines at bottom with printed names and titles. Date "December 5, 2025" and certificate number in small text at very bottom. Frame-worthy, professional, prestigious quality.
</example>

<example type="avoid">
A certificate with rainbow gradient border, Comic Sans or playful fonts, bright neon pink and green colors, multiple cartoon clipart images (stars, balloons), inconsistent text sizes with no clear hierarchy, busy patterned polka-dot background, tiny hard-to-read text, missing seal or official elements, text crammed together with no breathing room. Looks like a children's birthday party invitation rather than a formal professional document.
</example>
</examples>
`

// ============================================================
// EVENT POSTER EXAMPLES
// ============================================================

export const EVENT_POSTER_EXAMPLES = `
<examples>
<example type="good">
A professional conference poster with dynamic blue gradient background and subtle geometric accents. "INNOVATION SUMMIT 2025" appears as the dominant headline in bold white sans-serif at the top, commanding immediate attention. Below: "Shaping Tomorrow's Technology" tagline in lighter weight. Clear event details section with icons: calendar icon + "March 15-16, 2025", clock icon + "9:00 AM - 6:00 PM", location pin + "Grand Convention Center, Mumbai". Featured speaker "Dr. Meera Nair, CEO TechCorp" with circular photo placeholder. Prominent yellow "REGISTER NOW - FREE" button near bottom. Corporate logo in top-left corner with clear space around it. Passes the 3-second test: What (Innovation Summit), When (March 15-16), Where (Mumbai) are instantly visible.
</example>

<example type="avoid">
An event poster with cluttered layout where event name is tiny and hard to find. Date/time/venue scattered randomly across the design with no icons or visual organization. Boring gray background with no energy. Multiple fonts competing for attention (script, serif, sans-serif, decorative all mixed). No clear call-to-action. Important information hidden at the bottom in 8pt font. Stock photo of generic handshake taking up 70% of space. Fails the 3-second test - viewer has no idea what event this is for.
</example>
</examples>
`

// ============================================================
// INSTAGRAM POST EXAMPLES
// ============================================================

export const INSTAGRAM_POST_EXAMPLES = `
<examples>
<example type="good">
A scroll-stopping Instagram announcement post with vibrant coral-to-orange gradient background. "BIG NEWS!" appears in extra-bold white sans-serif, large enough to read instantly on a phone screen, centered in upper portion. "We're Launching Something Amazing" supporting text below in slightly smaller but still very readable size. "Stay Tuned" call-to-action at bottom in a subtle button style. Clean composition with generous breathing room around text - not cramped. Small logo in bottom-right corner with clear space. High contrast throughout. Would immediately catch attention when scrolling through a feed.
</example>

<example type="avoid">
An Instagram post with tiny 10pt text that requires zooming to read. Muddy brown and beige colors that blend into most feeds. 8 different pieces of information crammed into the square: headline, subheadline, three bullet points, contact info, website, logo - all competing for attention. Busy photographic background with text overlaid that's nearly impossible to read. Thin light-weight fonts that disappear on mobile. No clear focal point - viewer's eye doesn't know where to look first.
</example>
</examples>
`

// ============================================================
// YOUTUBE THUMBNAIL EXAMPLES
// ============================================================

export const YOUTUBE_THUMBNAIL_EXAMPLES = `
<examples>
<example type="good">
A high-CTR YouTube thumbnail with an expressive young woman showing genuine surprised/excited expression (wide eyes, open mouth, hands near face), filling the left 60% of the frame with excellent lighting on her face. "5 FREE TOOLS" in bold yellow text with thick black outline on the right side - only 3 words, large enough to read when thumbnail is tiny (160px wide). Bright blue gradient background that contrasts sharply with both the subject and text. Face and text don't overlap. Bottom-right corner is intentionally empty (for YouTube duration badge). Single clear focal point. Would stand out among 500 other thumbnails in search results.
</example>

<example type="avoid">
A YouTube thumbnail with a tiny face in the corner that's barely visible at thumbnail size. "10 Amazing Tips and Tricks for Beginners Who Want to Learn How to Edit Videos Like a Professional" - 18 words in thin white font with no outline, impossible to read when small. Muted gray-green colors that look boring in a sea of bright thumbnails. Text positioned over the face. Important content in bottom-right corner (will be covered by duration badge). Multiple competing elements: face, product shot, text box, arrows, emoji - no single focal point. Looks like every other generic tutorial thumbnail.
</example>
</examples>
`

// ============================================================
// LINKEDIN POST EXAMPLES
// ============================================================

export const LINKEDIN_POST_EXAMPLES = `
<examples>
<example type="good">
A professional LinkedIn graphic with sophisticated navy-to-dark-blue gradient background and subtle geometric line accents. "The Future of Remote Work" headline in clean white professional sans-serif - prominent but not shouty. Key statistic "87% of employees prefer hybrid models" highlighted with slightly larger text or subtle background treatment. "Here's what leading companies are doing differently..." supporting text in lighter weight below. Generous white space - not cramped. Small professional logo in corner. Looks like content from McKinsey, Deloitte, or respected industry thought leader. Would build credibility and encourage thoughtful engagement.
</example>

<example type="avoid">
A LinkedIn post that looks like a Facebook ad - bright red "SALE!!!" text, exclamation points everywhere, "CLICK NOW!!!!" aggressive CTA. Playful Comic Sans or rounded fonts inappropriate for business context. Bright rainbow colors that scream "look at me" unprofessionally. Stock photo of people pointing at laptop screen. Emoji overload. Looks like spam or multi-level marketing content. Would damage professional credibility rather than enhance it.
</example>
</examples>
`

// ============================================================
// STORY FORMAT EXAMPLES
// ============================================================

export const STORY_EXAMPLES = `
<examples>
<example type="good">
A full-screen vertical Instagram story with bold purple-to-blue gradient filling the entire frame. "SWIPE UP" headline in large bold white text positioned exactly in the center of the screen (the safe zone - middle 65%). Swipe-up arrow indicator near the bottom of the safe zone but NOT in the bottom 20% (where Instagram UI appears). Clean, immersive, full-bleed design. No content in top 15% (story progress bar area) or bottom 20% (reply box area). Single clear message that can be absorbed in 2 seconds. Thumb-stopping when viewed in Stories carousel.
</example>

<example type="avoid">
A story with important text at the very top (hidden by story bar and profile info). Call-to-action at the very bottom (hidden by reply box and navigation). Horizontal landscape composition that doesn't fill the vertical screen. Tiny text requiring viewer to pause and squint. Cluttered with multiple messages, bullet points, and small details that can't be absorbed quickly. White background that looks like an accidental screenshot rather than designed content.
</example>
</examples>
`

// ============================================================
// FLYER EXAMPLES
// ============================================================

export const FLYER_EXAMPLES = `
<examples>
<example type="good">
A professional A4 flyer with clean modern gradient background. Organization logo prominently at top establishing brand. "SUMMER HEALTH CAMP" bold headline in the top third - immediately catches attention. Key details clearly organized with icons: calendar "July 15, 2025", clock "9 AM - 5 PM", location pin "Community Center, Sector 12". Benefits listed cleanly: "Free Health Checkup, Blood Pressure, Sugar Test, BMI Assessment". "REGISTER TODAY" prominent CTA button in contrasting color. Contact info clearly at bottom: phone, email, website. QR code in corner for easy digital access. Clear visual hierarchy - viewer can scan and understand in 5 seconds.
</example>

<example type="avoid">
A flyer with no clear visual hierarchy - everything same size and weight. Tiny 8pt contact information impossible to read when printed. No icons or visual organization for date/time/venue. Wall of text paragraphs that no one will read. Low-resolution blurry images that will print poorly. Colors that will look completely different when printed (bright RGB colors that don't translate to CMYK). Missing critical information: no date, no venue address, no contact method. Unbalanced layout with everything crammed in one corner.
</example>
</examples>
`

// ============================================================
// BUSINESS CARD EXAMPLES
// ============================================================

export const BUSINESS_CARD_EXAMPLES = `
<examples>
<example type="good">
A professional horizontal business card with clean white background and subtle brand color accent line. "PRIYA SHARMA" as the most prominent text in professional serif font. "Chief Marketing Officer" below in lighter weight. Company name "TechVision Solutions" with small logo. Contact details cleanly organized: phone "+91 98765 43210", email "priya@techvision.com", website "techvision.com", LinkedIn handle. Proper margins - no text too close to edges (will be trimmed in printing). Balanced layout with breathing room. Would look professional when handed to a Fortune 500 executive.
</example>

<example type="avoid">
A business card crammed with information: full address (3 lines), 3 phone numbers, 2 emails, website, 5 social media handles, company tagline, QR code, AND a mission statement. Tiny 6pt text to fit everything in. Decorative script font for contact info (unreadable). Dark busy background making text hard to read. Text running all the way to edges (will be cut off in printing). Inconsistent alignment - some left, some center, some right for no reason. Cheap clip-art graphics. Would look unprofessional and difficult to use.
</example>
</examples>
`

// ============================================================
// PRESENTATION EXAMPLES
// ============================================================

export const PRESENTATION_EXAMPLES = `
<examples>
<example type="good">
A professional presentation title slide in 16:9 widescreen format. Deep blue gradient background suitable for projection. "DIGITAL TRANSFORMATION STRATEGY" large bold headline centered, readable from back of large conference room. "Q4 2025 Executive Review" subtitle below in lighter weight. "Presented by: Rajesh Kumar, CTO" and "December 5, 2025" in lower portion. Company logo in bottom-right corner. High contrast white text on dark background. Clean, minimal design - only essential information. Would look impressive projected in a boardroom.
</example>

<example type="avoid">
A presentation title slide with tiny 12pt text that no one past the front row can read. Busy photographic background making text illegible on projector. Low contrast: gray text on slightly different gray background. Entire slide crammed with text: agenda, speaker bio, company history, contact info all on title slide. Decorative fonts that are pretty but unreadable from distance. Important content outside the safe zone - cut off by projector or display. Multiple clashing colors with no visual harmony.
</example>
</examples>
`

// ============================================================
// WEB BANNER EXAMPLES
// ============================================================

export const WEB_BANNER_EXAMPLES = `
<examples>
<example type="good">
A 728x90 leaderboard banner with bold gradient background that stands out from typical website content. "Save 50% Today" headline in large bold text - immediately communicates value proposition. "Limited Time Offer" supporting urgency text. "SHOP NOW" button in bright contrasting color (obviously clickable, not just text). Company logo visible but not dominant. Single clear message - viewer understands the offer in 1-2 seconds. High contrast throughout. Would drive clicks because CTA is obvious and value is clear.
</example>

<example type="avoid">
A banner with 50 words of text explaining every feature and benefit. No clear CTA button - just hyperlinked text that doesn't look clickable. Same colors as typical website content - banner blends in and is ignored. Company logo taking up 40% of the space. Multiple competing offers: "50% off AND free shipping AND buy-one-get-one AND loyalty points" - confusing. Tiny unreadable text because they tried to include too much. Viewer has no idea what to do or why they should click.
</example>
</examples>
`

// ============================================================
// HELPER FUNCTION
// ============================================================

/**
 * Get examples for a specific format ID
 */
export function getExamplesForFormat(formatId: string): string {
  const examples: Record<string, string> = {
    certificate: CERTIFICATE_EXAMPLES,
    certificate_landscape: CERTIFICATE_EXAMPLES,
    certificate_portrait: CERTIFICATE_EXAMPLES,
    event_poster: EVENT_POSTER_EXAMPLES,
    poster_portrait: EVENT_POSTER_EXAMPLES,
    poster_landscape: EVENT_POSTER_EXAMPLES,
    instagram_post: INSTAGRAM_POST_EXAMPLES,
    instagram_square: INSTAGRAM_POST_EXAMPLES,
    instagram_feed: INSTAGRAM_POST_EXAMPLES,
    instagram_story: STORY_EXAMPLES,
    whatsapp_status: STORY_EXAMPLES,
    story: STORY_EXAMPLES,
    story_vertical: STORY_EXAMPLES,
    youtube_thumbnail: YOUTUBE_THUMBNAIL_EXAMPLES,
    yt_thumbnail: YOUTUBE_THUMBNAIL_EXAMPLES,
    linkedin_post: LINKEDIN_POST_EXAMPLES,
    linkedin_banner: LINKEDIN_POST_EXAMPLES,
    flyer: FLYER_EXAMPLES,
    flyer_a4: FLYER_EXAMPLES,
    flyer_a5: FLYER_EXAMPLES,
    business_card: BUSINESS_CARD_EXAMPLES,
    visiting_card: BUSINESS_CARD_EXAMPLES,
    presentation: PRESENTATION_EXAMPLES,
    presentation_16_9: PRESENTATION_EXAMPLES,
    presentation_4_3: PRESENTATION_EXAMPLES,
    slide: PRESENTATION_EXAMPLES,
    web_banner: WEB_BANNER_EXAMPLES,
    leaderboard_ad: WEB_BANNER_EXAMPLES,
    banner_ad: WEB_BANNER_EXAMPLES,
    facebook_post: INSTAGRAM_POST_EXAMPLES, // Similar style
    twitter_post: INSTAGRAM_POST_EXAMPLES, // Similar style
    x_post: INSTAGRAM_POST_EXAMPLES, // Similar style
    social_post: INSTAGRAM_POST_EXAMPLES,
  }

  return examples[formatId.toLowerCase()] || ''
}
