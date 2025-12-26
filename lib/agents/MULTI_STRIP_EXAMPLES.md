# Logo Placement Agent - Multi-Strip Examples

This document shows how the AI logo placement agent thinks when logos are placed on **multiple strips**.

---

## Example 1: Two Strips (Header + Footer)

### Scenario: Event Poster with Brand Logos + Sponsors

**Input:**
```typescript
{
  logos: [
    { id: "yi-logo", name: "Yi", type: "brand" },
    { id: "cii-logo", name: "CII", type: "brand" },
    { id: "bharat-rising", name: "Bharat Rising", type: "brand" },
    { id: "hdfc", name: "HDFC Bank", type: "sponsor" },
    { id: "tata", name: "Tata Motors", type: "sponsor" }
  ],
  formatId: "event_poster",
  formatDimensions: { width: 2400, height: 3000 }
}
```

### AI Agent's Thinking Process:

```
🤔 ANALYSIS:
- Total logos: 5
- Brand logos: 3 (Yi, CII, Bharat Rising) → Should go to HEADER strip
- Sponsor logos: 2 (HDFC, Tata) → Should go to FOOTER strip

📊 HEADER STRIP ANALYSIS:
- Logo count: 3
- Strategy: Distribute at edges and center (positions 1, 4, 6)
- Width: 85% (balanced for 3 logos, not too wide)
- Spacing: "normal" (40-60px) - gives clean separation
- Alignment: "justified" - spread edge-to-edge for prominence
- Padding: 35px - moderate breathing room

📊 FOOTER STRIP ANALYSIS:
- Logo count: 2
- Strategy: Center-aligned with loose spacing (positions 2, 5)
- Width: 60% (narrower for just 2 logos, avoids sparse look)
- Spacing: "loose" (80-120px) - premium, spacious feel
- Alignment: "center" - symmetric, balanced
- Padding: 50px - generous breathing room

✅ HIERARCHY:
- Header wider (85%) → more prominent for brand logos
- Footer narrower (60%) → subordinate, cleaner look for sponsors
```

### AI Output:

```json
{
  "placements": [
    {
      "logoId": "yi-logo",
      "position": "top-1",
      "size": "medium",
      "backgroundShape": "none"
    },
    {
      "logoId": "bharat-rising",
      "position": "top-4",
      "size": "medium",
      "backgroundShape": "none"
    },
    {
      "logoId": "cii-logo",
      "position": "top-6",
      "size": "medium",
      "backgroundShape": "none"
    },
    {
      "logoId": "hdfc",
      "position": "bottom-2",
      "size": "small",
      "backgroundShape": "rounded"
    },
    {
      "logoId": "tata",
      "position": "bottom-5",
      "size": "small",
      "backgroundShape": "rounded"
    }
  ],
  "stripRecommendations": {
    "header": {
      "widthPercentage": 85,
      "spacingStrategy": "normal",
      "alignment": "justified",
      "paddingHorizontal": 35
    },
    "footer": {
      "widthPercentage": 60,
      "spacingStrategy": "loose",
      "alignment": "center",
      "paddingHorizontal": 50
    }
  },
  "reasoning": "Header strip: 3 brand logos distributed at edges and center (1,4,6) with 85% width for prominence. Footer strip: 2 sponsors centered with 60% width and loose spacing for premium, balanced look. Strip hierarchy emphasizes brand over sponsors.",
  "confidence": 0.95
}
```

### Visual Result:

```
╔═══════════════════════════════════════════════════════╗
║                   EVENT POSTER                        ║
╠═══════════════════════════════════════════════════════╣
║                                                       ║
║  ┌────────────────────────── 85% WIDTH ─────────────┐║
║  │                                                   │║
║  │  [Yi]      [Bharat Rising]             [CII]     │║
║  │  ↑                ↑                        ↑      │║
║  │ top-1           top-4                   top-6     │║
║  │ <--- 40-60px ---> <------ 40-60px ------>        │║
║  └───────────────────────────────────────────────────┘║
║                                                       ║
║           [EVENT CONTENT / CREATIVE AREA]             ║
║                                                       ║
║              ┌─────── 60% WIDTH ────────┐             ║
║              │                          │             ║
║              │  [HDFC]        [Tata]   │             ║
║              │    ↑              ↑      │             ║
║              │ bottom-2      bottom-5   │             ║
║              │ <-- 80-120px -->         │             ║
║              └──────────────────────────┘             ║
╚═══════════════════════════════════════════════════════╝
```

---

## Example 2: Two Strips (Both Full)

### Scenario: Certificate with Many Logos

**Input:**
```typescript
{
  logos: [
    { id: "yi", name: "Yi" },
    { id: "cii", name: "CII" },
    { id: "chapter", name: "Yi Pune Chapter" },
    { id: "yr", name: "Yi Youthreach" },
    { id: "sponsor1", name: "Google" },
    { id: "sponsor2", name: "Microsoft" },
    { id: "sponsor3", name: "Amazon" },
    { id: "sponsor4", name: "Meta" }
  ],
  formatId: "certificate"
}
```

### AI Agent's Thinking:

```
🤔 ANALYSIS:
- Total logos: 8
- Header: 4 brand/program logos
- Footer: 4 sponsor logos

📊 HEADER STRIP:
- Count: 4 logos
- Width: 90% (need full width for 4 logos)
- Spacing: "normal" (balanced)
- Alignment: "justified" (edge-to-edge)
- Positions: top-1, top-2, top-5, top-6

📊 FOOTER STRIP:
- Count: 4 logos
- Width: 90% (need full width for 4 sponsors)
- Spacing: "tight" (4 logos need tighter spacing)
- Alignment: "justified" (edge-to-edge)
- Positions: bottom-1, bottom-2, bottom-5, bottom-6
```

### AI Output:

```json
{
  "placements": [
    { "logoId": "yi", "position": "top-1", "size": "medium" },
    { "logoId": "cii", "position": "top-2", "size": "medium" },
    { "logoId": "chapter", "position": "top-5", "size": "medium" },
    { "logoId": "yr", "position": "top-6", "size": "medium" },
    { "logoId": "sponsor1", "position": "bottom-1", "size": "small" },
    { "logoId": "sponsor2", "position": "bottom-2", "size": "small" },
    { "logoId": "sponsor3", "position": "bottom-5", "size": "small" },
    { "logoId": "sponsor4", "position": "bottom-6", "size": "small" }
  ],
  "stripRecommendations": {
    "header": {
      "widthPercentage": 90,
      "spacingStrategy": "normal",
      "alignment": "justified",
      "paddingHorizontal": 30
    },
    "footer": {
      "widthPercentage": 90,
      "spacingStrategy": "tight",
      "alignment": "justified",
      "paddingHorizontal": 30
    }
  },
  "reasoning": "4 logos per strip require 90% width. Header uses normal spacing for brand prominence, footer uses tighter spacing for sponsor efficiency. Both justified for balanced edge-to-edge distribution.",
  "confidence": 0.92
}
```

---

## Example 3: Three Strips (Full Coverage)

### Scenario: Conference Poster with Maximum Logos

**Input:**
```typescript
{
  logos: [
    // Header: 3 brand logos
    { id: "yi", name: "Yi" },
    { id: "cii", name: "CII" },
    { id: "bharat", name: "Bharat Rising" },

    // Middle: 2 vertical logos
    { id: "learning", name: "Yi Learning" },
    { id: "innovation", name: "Yi Innovation" },

    // Footer: 5 sponsors
    { id: "s1", name: "Sponsor 1" },
    { id: "s2", name: "Sponsor 2" },
    { id: "s3", name: "Sponsor 3" },
    { id: "s4", name: "Sponsor 4" },
    { id: "s5", name: "Sponsor 5" }
  ]
}
```

### AI Output:

```json
{
  "stripRecommendations": {
    "header": {
      "widthPercentage": 85,
      "spacingStrategy": "normal",
      "alignment": "justified",
      "paddingHorizontal": 35
    },
    "middle": {
      "widthPercentage": 65,
      "spacingStrategy": "loose",
      "alignment": "center",
      "paddingHorizontal": 45
    },
    "footer": {
      "widthPercentage": 95,
      "spacingStrategy": "tight",
      "alignment": "justified",
      "paddingHorizontal": 25
    }
  },
  "reasoning": "Header: 3 brand logos at 85% width, justified. Middle: 2 vertical logos centered at 65% width with loose spacing for prominence. Footer: 5 sponsors need 95% width with tight spacing to fit all logos.",
  "confidence": 0.90
}
```

### Visual Result:

```
╔═══════════════════════════════════════════════════╗
║  ┌──────────────── 85% ────────────────┐          ║
║  │ [Yi]    [Bharat Rising]      [CII]  │  HEADER  ║
║  └────────────────────────────────────┘           ║
║                                                    ║
║           ┌──────── 65% ────────┐                 ║
║           │ [Learning] [Innovation]│  MIDDLE      ║
║           └─────────────────────┘                 ║
║                                                    ║
║ ┌──────────────────── 95% ───────────────────┐    ║
║ │ [S1] [S2] [S3] [S4] [S5]                  │    ║
║ └────────────────────────────────────────────┘    ║
╚═══════════════════════════════════════════════════╝
```

---

## How to Use in Code

### For TWO strips:

```typescript
import {
  getAIOptimizedPlacements,
  applyStripRecommendations,
  getStripRecommendationByRow
} from '@/lib/agents/logo-placement-agent'

// Get AI recommendations
const aiResult = await getAIOptimizedPlacements(input)

// Apply for HEADER strip
const headerRec = getStripRecommendationByRow(aiResult.stripRecommendations, 'header')
const headerConfig = applyStripRecommendations(headerRec, imageWidth)

console.log('Header strip width:', headerConfig.stripWidth) // e.g., 2040px (85% of 2400)
console.log('Header spacing:', headerConfig.spacingGuideline) // { min: 40, max: 60 }

// Apply for FOOTER strip
const footerRec = getStripRecommendationByRow(aiResult.stripRecommendations, 'footer')
const footerConfig = applyStripRecommendations(footerRec, imageWidth)

console.log('Footer strip width:', footerConfig.stripWidth) // e.g., 1440px (60% of 2400)
console.log('Footer spacing:', footerConfig.spacingGuideline) // { min: 80, max: 120 }
```

---

## Key Differences: One Strip vs Two Strips

| Aspect | One Strip | Two Strips |
|--------|-----------|------------|
| **Width Strategy** | Single width for all logos | Different width per strip |
| **Spacing** | Uniform spacing | Strip-specific spacing (header tighter, footer looser) |
| **Alignment** | One alignment strategy | Per-strip alignment (header justified, footer centered) |
| **Hierarchy** | Flat hierarchy | Visual hierarchy (header prominent, footer subordinate) |
| **Examples** | Instagram posts, simple flyers | Event posters, certificates |

---

## AI Decision Matrix

| Logo Count | Strip Width | Spacing | Alignment | Use Case |
|------------|-------------|---------|-----------|----------|
| 1-2 logos | 60-70% | Loose (80-120px) | Center | Minimal branding |
| 3-4 logos | 75-85% | Normal (40-60px) | Justified | Balanced |
| 5-6 logos | 90-100% | Tight (20-30px) | Justified | Dense placement |

---

## Tips for Best Results

1. **Let the AI decide**: Trust the AI's width/spacing recommendations based on logo count
2. **Strip hierarchy matters**: Header should be wider/more prominent than footer
3. **Don't overcrowd**: If you have 8+ logos, consider using all 3 strips
4. **Alignment consistency**: Use "justified" for 3+ logos, "center" for 1-2 logos
5. **Spacing breathing room**: Tighter spacing (tight/normal) for many logos, loose spacing for few logos
