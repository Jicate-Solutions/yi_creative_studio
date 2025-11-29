# Themes & Styles Reference

Complete documentation of all 22 themes and 16 styles available in CreativeStudio.

---

## All 22 Themes

### 1. Corporate & Professional

| Theme ID | Display Name | Best For | Color Palette |
|----------|-------------|----------|---------------|
| `corporate` | Corporate | Business events, conferences | Blues, grays, professional |
| `professional` | Professional | Formal events, meetings | Neutral, clean |
| `luxury` | Luxury | High-end events, galas | Gold, black, elegant |
| `minimal` | Minimal | Modern, clean designs | White space, simple |

### 2. Celebration & Events

| Theme ID | Display Name | Best For | Color Palette |
|----------|-------------|----------|---------------|
| `celebration` | Celebration | Parties, anniversaries | Bright, festive |
| `wedding` | Wedding | Wedding ceremonies | Soft, romantic |
| `birthday` | Birthday | Birthday parties | Fun, colorful |
| `festival` | Festival | Cultural festivals | Vibrant, traditional |

### 3. Technology & Modern

| Theme ID | Display Name | Best For | Color Palette |
|----------|-------------|----------|---------------|
| `tech` | Tech | Tech events, hackathons | Blue, cyan, modern |
| `startup` | Startup | Pitch events, launches | Bold, innovative |
| `digital` | Digital | Online events, webinars | Screen-friendly |
| `futuristic` | Futuristic | AI events, innovation | Neon, dark |

### 4. Academic & Education

| Theme ID | Display Name | Best For | Color Palette |
|----------|-------------|----------|---------------|
| `academic` | Academic | University events | Traditional, scholarly |
| `education` | Education | Schools, workshops | Friendly, educational |
| `graduation` | Graduation | Convocations | Formal, celebratory |

### 5. Cultural & Religious

| Theme ID | Display Name | Best For | Color Palette |
|----------|-------------|----------|---------------|
| `cultural` | Cultural | Cultural programs | Traditional, rich |
| `spiritual` | Spiritual | Religious events | Calm, sacred |
| `traditional` | Traditional | Heritage events | Classic, regional |

### 6. Entertainment & Sports

| Theme ID | Display Name | Best For | Color Palette |
|----------|-------------|----------|---------------|
| `entertainment` | Entertainment | Shows, performances | Dramatic, exciting |
| `music` | Music | Concerts, festivals | Dynamic, vibrant |
| `sports` | Sports | Tournaments, matches | Energetic, bold |
| `fitness` | Fitness | Yoga, marathons | Active, healthy |

---

## All 16 Styles

### Visual Treatment Styles

| Style ID | Display Name | Effect | Best Themes |
|----------|-------------|--------|-------------|
| `gradient` | Gradient | Smooth color transitions | corporate, tech |
| `flat` | Flat | Solid colors, no gradients | minimal, professional |
| `minimal` | Minimal | Clean, lots of white space | academic, corporate |
| `bold` | Bold | Strong colors, thick fonts | sports, festival |
| `elegant` | Elegant | Sophisticated, refined | wedding, luxury |
| `modern` | Modern | Contemporary, trendy | startup, tech |
| `vintage` | Vintage | Retro, nostalgic | cultural, traditional |
| `neon` | Neon | Glowing, bright colors | music, entertainment |

### Special Effect Styles

| Style ID | Display Name | Effect | Best Themes |
|----------|-------------|--------|-------------|
| `geometric` | Geometric | Shapes, patterns | tech, startup |
| `soft_glow` | Soft Glow | Gentle lighting effects | wedding, spiritual |
| `dynamic` | Dynamic | Movement, energy | sports, fitness |
| `traditional` | Traditional | Classic, cultural patterns | cultural, religious |
| `festive` | Festive | Celebratory elements | festival, celebration |
| `cinematic` | Cinematic | Movie-poster look | entertainment |
| `appetizing` | Appetizing | Food-friendly styling | food events |
| `floral` | Floral | Flower patterns | wedding, celebration |

---

## Theme-Style Compatibility Matrix

### High Compatibility (Recommended)

```
corporate:
  - gradient (★★★★★)
  - minimal (★★★★★)
  - flat (★★★★☆)
  - modern (★★★★☆)

wedding:
  - soft_glow (★★★★★)
  - elegant (★★★★★)
  - floral (★★★★★)
  - minimal (★★★☆☆)

tech:
  - geometric (★★★★★)
  - neon (★★★★★)
  - modern (★★★★☆)
  - gradient (★★★★☆)

festival:
  - festive (★★★★★)
  - traditional (★★★★★)
  - bold (★★★★☆)
  - neon (★★★☆☆)

sports:
  - dynamic (★★★★★)
  - bold (★★★★★)
  - geometric (★★★★☆)
  - modern (★★★☆☆)

academic:
  - minimal (★★★★★)
  - flat (★★★★☆)
  - elegant (★★★★☆)
  - gradient (★★★☆☆)

music:
  - neon (★★★★★)
  - dynamic (★★★★★)
  - bold (★★★★☆)
  - cinematic (★★★★☆)
```

### Low Compatibility (Avoid)

```
AVOID these combinations:
- wedding + neon (too harsh)
- corporate + festive (unprofessional)
- academic + bold (too casual)
- spiritual + dynamic (inappropriate)
- luxury + flat (lacks sophistication)
- tech + traditional (style clash)
- fitness + elegant (mismatched energy)
```

---

## Color Schemes

### Available Color Schemes

| Scheme ID | Description | Primary Colors |
|-----------|-------------|----------------|
| `brand_default` | Uses organization brand colors | Custom |
| `vibrant` | Bright, saturated colors | Multi-color |
| `professional` | Muted, business-appropriate | Blues, grays |
| `elegant_gold` | Gold accents, luxury feel | Gold, black, cream |
| `tech_blue` | Tech-focused palette | Blues, cyans |
| `warm` | Warm, inviting colors | Oranges, reds, yellows |
| `cool` | Cool, calming colors | Blues, greens, purples |
| `festive` | Celebration colors | Multi-color, bright |
| `pastel` | Soft, muted tones | Light, soft colors |
| `dramatic` | High contrast, bold | Black, red, gold |
| `energetic` | High energy colors | Bright, contrasting |
| `natural` | Earth tones | Greens, browns |

### Color Scheme by Theme

```typescript
const recommendedColorSchemes = {
  corporate: ["brand_default", "professional", "cool"],
  wedding: ["elegant_gold", "pastel", "warm"],
  tech: ["tech_blue", "vibrant", "cool"],
  festival: ["festive", "vibrant", "warm"],
  sports: ["energetic", "vibrant", "brand_default"],
  academic: ["professional", "brand_default", "cool"],
  cultural: ["festive", "warm", "vibrant"],
  music: ["vibrant", "dramatic", "neon"],
  luxury: ["elegant_gold", "dramatic", "professional"],
  spiritual: ["warm", "pastel", "natural"],
};
```

---

## Visual Examples (Descriptions)

### Corporate + Gradient + Professional
- Clean business design
- Smooth blue-to-gray gradient background
- Professional typography
- Logo prominently placed
- Structured layout with clear hierarchy

### Wedding + Soft Glow + Elegant Gold
- Romantic, dreamy atmosphere
- Soft lighting effects around text
- Gold accents and decorations
- Elegant script fonts for names
- Floral or subtle pattern overlays

### Tech + Geometric + Tech Blue
- Modern, futuristic design
- Geometric shapes and patterns
- Blue and cyan color palette
- Sans-serif, modern typography
- Circuit-like or grid patterns

### Festival + Festive + Vibrant
- Colorful, energetic design
- Traditional patterns and motifs
- Multiple bright colors
- Decorative borders
- Cultural elements incorporated

### Sports + Dynamic + Energetic
- Action-oriented design
- Diagonal lines suggesting movement
- Bold, impactful typography
- High contrast colors
- Athletic imagery elements

---

## Implementation Code Reference

### Theme Selection Component
```tsx
<GroupedSelect
  value={formData.theme}
  onValueChange={(value) => updateForm("theme", value)}
  options={THEMES}
  placeholder="Select theme"
/>
```

### Style Selection Component
```tsx
<GroupedSelect
  value={formData.style}
  onValueChange={(value) => updateForm("style", value)}
  options={POSTER_STYLES}
  placeholder="Select style"
/>
```

### Validating Theme-Style Combination
```typescript
function validateCombination(theme: string, style: string): boolean {
  const incompatible: Record<string, string[]> = {
    wedding: ["neon", "dynamic", "bold"],
    corporate: ["festive", "traditional", "floral"],
    academic: ["bold", "neon", "festive"],
    spiritual: ["dynamic", "neon", "bold"],
  };
  
  return !incompatible[theme]?.includes(style);
}
```

---

## Quick Reference Cards

### For Quick Selection

**Professional Events:**
- Theme: `corporate` or `professional`
- Style: `gradient` or `minimal`
- Color: `brand_default` or `professional`

**Celebrations:**
- Theme: `celebration` or `festival`
- Style: `festive` or `bold`
- Color: `festive` or `vibrant`

**Weddings:**
- Theme: `wedding`
- Style: `soft_glow` or `elegant`
- Color: `elegant_gold` or `pastel`

**Tech Events:**
- Theme: `tech` or `startup`
- Style: `geometric` or `neon`
- Color: `tech_blue` or `vibrant`

**Sports:**
- Theme: `sports` or `fitness`
- Style: `dynamic` or `bold`
- Color: `energetic` or `vibrant`
