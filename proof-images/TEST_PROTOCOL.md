# Phase A + B Quality Proof Test Protocol

**Date:** 2026-05-21
**Goal:** Generate 5 sample event posters with the new pipeline. Present to MD sir for side-by-side comparison with direct Gemini AI Studio output.

**Server:** http://localhost:3000

---

## What Changed (For Reference)

1. **Default model** → Nano Banana Pro (`gemini-3-pro-image-preview`) — was Flash 2.5
2. **User's verbatim brief** now passed to Gemini alongside Claude's enhancement
3. **Prompt reordered** — creative vision FIRST, technical zone constraints LAST
4. **Claude system prompt slimmed** 5,400 → 1,400 chars (removed 8 competing creative frameworks)

---

## 5 Test Briefs

Copy-paste each one into the create form. Use the SAME vertical (Yi Yuva or similar) and SAME logo set for all 5 so the only variable is the brief.

### Brief 1 — Women's Leadership Forum
| Field | Value |
|---|---|
| Event Name | `Women's Leadership Forum 2026` |
| Tagline | `Voices that shape tomorrow` |
| Date | Any future date |
| Time | `9:00 AM – 5:00 PM` |
| Venue | `ITC Grand Chola, Chennai` |
| Speaker | `Dr. Priya Krishnamurthy, Founder & CEO, BrightPath Ventures` |
| Target Audience | `Young professionals` |
| Event Type | `Conference` |
| Style mood | `Bold cinematic with warm gold lighting` |
| Save as | `proof-images/after-phase-A-B/01-womens-leadership.png` |

### Brief 2 — Climate Action Summit
| Field | Value |
|---|---|
| Event Name | `Yi Climate Action Summit` |
| Tagline | `Roots, Rivers, Rising Together` |
| Date | Any future date |
| Time | `10:00 AM` |
| Venue | `Anna University, Chennai` |
| Speaker | `Sunita Narain, Environmentalist` |
| Target Audience | `College students` |
| Event Type | `Summit` |
| Style mood | `Earthy organic with green and sky-blue gradient, hand-drawn feel` |
| Save as | `proof-images/after-phase-A-B/02-climate-summit.png` |

### Brief 3 — Tech Innovation Day
| Field | Value |
|---|---|
| Event Name | `Tech Innovation Day 2026` |
| Tagline | `Build the future, today` |
| Date | Any future date |
| Time | `9:00 AM – 6:00 PM` |
| Venue | `IIT Madras Research Park` |
| Speaker | `Rajeev Suri, Tech Entrepreneur` |
| Target Audience | `Young professionals` |
| Event Type | `Tech conference` |
| Style mood | `Futuristic neon-blue with circuit-board patterns` |
| Save as | `proof-images/after-phase-A-B/03-tech-day.png` |

### Brief 4 — Annual Sports Day
| Field | Value |
|---|---|
| Event Name | `Yi Annual Sports Day` |
| Tagline | `Run, Race, Rise` |
| Date | Any future date |
| Time | `6:00 AM – 12:00 PM` |
| Venue | `Nehru Stadium, Chennai` |
| Speaker | (leave blank) |
| Target Audience | `Community / General public` |
| Event Type | `Sports / Athletic` |
| Style mood | `Dynamic motion, bold reds and yellows, athletic energy` |
| Save as | `proof-images/after-phase-A-B/04-sports-day.png` |

### Brief 5 — Cultural Fest
| Field | Value |
|---|---|
| Event Name | `Yi Cultural Fest 2026` |
| Tagline | `Bharat ki rangoli` |
| Date | Any future date |
| Time | `5:00 PM onwards` |
| Venue | `Phoenix MarketCity, Chennai` |
| Speaker | (leave blank) |
| Target Audience | `Community / General public` |
| Event Type | `Cultural / Festival` |
| Style mood | `Vibrant traditional Indian with mandala motifs and gold accents` |
| Save as | `proof-images/after-phase-A-B/05-cultural-fest.png` |

---

## What to Look For (Quality Indicators)

When MD sir reviews each output, score against these:

| Indicator | Look for |
|---|---|
| **User wording survives** | Does "Voices that shape tomorrow" appear EXACTLY or did Claude rewrite it as "Voices shaping tomorrow"? |
| **On-brief imagery** | Does Climate Summit feel earthy/organic OR generic stage scene? |
| **Creative composition** | Does Cultural Fest use mandala motifs, or default to people-in-hall? |
| **Text rendering** | Are speaker names legible? Date/venue clear? |
| **Brand colors** | Yi primary blue (#005B96) visible? CII logo top-right? Yi top-left? |
| **vs AI Studio** | If MD sir types the same brief into AI Studio, does our output now feel closer in creative ambition? |

---

## Capturing the Images

1. After each generation, **right-click the canvas → Save image as → save into `proof-images/after-phase-A-B/`** with the filename from each brief above.
2. Open all 5 in the file explorer for side-by-side comparison.
3. Repeat with AI Studio (`https://aistudio.google.com/`) using a simple version of each brief and compare.

---

## If Quality REGRESSES on Any Brief

The changes are revertable per fix:

```powershell
# Revert just the system prompt strip (keep Pro default + reorder + verbatim brief)
git checkout HEAD -- lib/prompts/services/ultra-pro-prompt.ts

# Revert just the event-poster reorder (keep system prompt strip + Pro default)
git checkout HEAD -- lib/prompts/services/yi-prompt-builder/format-builders/event-poster.ts

# Revert just the Pro-default model selection
git checkout HEAD -- hooks/use-ai-models.ts

# Nuclear revert (back to before any Phase A/B changes)
git checkout HEAD -- hooks/use-ai-models.ts lib/prompts/services/ultra-pro-prompt.ts lib/prompts/services/yi-prompt-builder/format-builders/event-poster.ts
```

---

## Want a Real A/B?

After generating these 5 "AFTER" images, we can do a true A/B comparison:

1. Save the 5 AFTER images above
2. `git stash` the changes
3. Restart dev server
4. Regenerate the SAME 5 briefs (these are "BEFORE")
5. `git stash pop` to restore changes
6. Compare BEFORE/AFTER pairs side-by-side

Ask Claude: "Now do the A/B baseline by stashing" if you want this.
