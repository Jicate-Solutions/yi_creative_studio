# PRD: Yi CreativeStudio - AI-Powered Brand Creative Generation Platform

**Version:** 3.0 (Ultra Unified)  
**Created:** November 28, 2025  
**Author:** Ommsharravana (Yi Erode Chair)  
**Status:** ✅ Ready for Build

---

## Executive Summary

Yi CreativeStudio is a comprehensive AI-powered creative generation platform that solves the critical pain point of brand-consistent visual content creation for organizations. Initially built for Yi (Young Indians) chapters, this platform enables any organization to generate professional, on-brand posters, social media content, and marketing materials in 30 seconds instead of 3-7 days.

This ULTRA PRD combines:
- **Yi Chapter-Specific Requirements** - Vertical presets (Masoom, Road Safety, etc.), CII branding compliance, chapter structure
- **Phase 1 SaaS Features** - Multi-tenancy, authentication, brand configuration, wallet/billing
- **Phase 2 Advanced Features** - Multi-logo management, CMYK/RGB export, multi-model AI (Gemini + Ideogram), designer-level customization

---

## Table of Contents

1. [The Problem](#section-1-the-problem)
2. [Why This Matters](#section-2-why-this-matters)
3. [Evidence](#section-3-evidence)
4. [User Stories](#section-4-user-stories)
5. [Features](#section-5-features)
6. [User Flow](#section-6-user-flow)
7. [Edge Cases](#section-7-edge-cases)
8. [Business Rules](#section-8-business-rules)
9. [Visual Reference](#section-9-visual-reference)
10. [UI Text & Copy](#section-10-ui-text--copy)
11. [Success Metrics](#section-11-success-metrics)
12. [Non-Goals & Scope](#section-12-non-goals--scope-boundaries)
13. [Technical Context](#section-13-technical-context)
14. [Timeline & Dependencies](#section-14-timeline--dependencies)
15. [Open Questions](#section-15-open-questions)
16. [Appendices](#appendices)

---

## Section 1: The Problem

### 1.1 Problem Statement

> Currently, **marketing teams, chapter coordinators, and organizational leaders** struggle with **creating consistent, on-brand visual content** because they **depend on overburdened design volunteers, face 3-7 day turnaround times, use generic tools that don't enforce brand guidelines, and repeatedly make branding errors** (wrong logo positions, missing mandatory logos, incorrect colors, non-compliant fonts). This matters because **events get delayed, brand credibility suffers with stakeholders (government officials, corporate partners, sponsors), 30%+ of designs require revision cycles, and volunteer burnout is accelerating**.

### 1.2 Problem Breakdown

**WHO is struggling?**
- **Primary:** Yi Chapter Vertical Chairs (Masoom, Road Safety, Climate Change, Yuva, Thalir, etc.) who organize 5-10 events/month
- **Secondary:** Marketing managers at educational institutions, NGOs, and SMBs with 10-100 employees
- **Tertiary:** Event coordinators, social media managers, and volunteer-driven organizations

**WHAT are they struggling with?**
- Creating professional event posters within hours, not days
- Maintaining brand consistency across 50+ creatives/month
- Positioning logos correctly (Yi top-left, CII top-right, partner logos in appropriate zones)
- Generating both digital (RGB) and print-ready (CMYK) versions
- Managing multiple organizational logos and selecting the right ones per event
- Choosing the right AI model for different creative needs (photo-realistic vs typography-focused)

**WHY is it hard right now?**
- Design requests go through WhatsApp → Manual follow-up → 3-7 day delays
- No enforced brand guidelines → "CII and Yi logo position should have been swapped" corrections
- No reusable templates → Every vertical/department recreates from scratch
- Generic tools (Canva, Adobe Express) don't understand organizational hierarchy
- Volunteers overloaded → "Please sir output is delayed so much" (actual message)
- No CMYK export → Colors look different when printed
- Single logo assumption → Organizations have 5-20 logos (department, partner, sponsor)

**WHAT happens if we don't fix this?**
- Events delayed waiting for posters (lost momentum)
- Professional image damaged with government officials and sponsors
- Volunteer burnout from repetitive design corrections (churn)
- Brand violations in public-facing materials (reputation risk)
- Lost sponsorship deals due to unprofessional visual assets
- Members creating off-brand content independently (brand dilution)

---

## Section 2: Why This Matters

### 2.1 Value to Users

**What can users do AFTER this feature that they CAN'T do now?**
- Generate a professional, brand-compliant event poster in 30 seconds
- Select from multiple logos and position them precisely
- Choose between AI models based on creative needs
- Export print-ready CMYK files with proper ICC profiles
- Access vertical-specific presets with pre-configured themes
- Preview designs in real-time before spending credits

**How much time/money will this save them?**
- **Time:** 3-7 days → 30 seconds per creative (99% reduction)
- **Cost:** ₹500-2000/design (external) → ₹5/design (platform) - 97% savings
- **Revision cycles:** 3-5 rounds → 0-1 rounds (90% reduction)
- **Volunteer hours:** 10+ hours/week → 0 hours (100% reduction)

**Real-world example:**
> Right now, Priya Navin (Masoom Chair, Yi Erode) spends 4-5 messages over 3 days coordinating a simple school session poster with the design volunteer. With Yi CreativeStudio, she'll select "Masoom Session Poster," enter school name, date, and trainer count, choose her preferred AI model, select Yi and CII logos with correct positions, click Generate, and download a perfect poster in 30 seconds. That's **15+ hours/month saved** across all verticals, and the design volunteer can focus on high-value creative work instead of repetitive posters.

### 2.2 Value to Business

**Revenue impact:**
- Better creatives → More professional government engagement → Stronger sponsorship pitches
- For Yi Chapters: Estimated 20% improvement in sponsor deck quality → potential ₹50,000-1,00,000 additional sponsorship/year
- For Platform: ₹5/generation × 100 creatives/month × 70 chapters = ₹35,000+/month from Yi alone
- Expansion to educational institutions (7 JKKN colleges) and other organizations multiplies revenue

**Churn reduction:**
- Design volunteers no longer overworked → Better retention
- Members get instant results → Higher platform engagement
- Organizations maintain brand consistency → Higher satisfaction

**Competitive advantage:**
- No existing tool combines: AI generation + strict brand zones + multi-logo + CMYK + vertical presets
- Canva lacks brand enforcement and organizational hierarchy
- Adobe Express too complex for non-designers
- First-mover advantage in Yi ecosystem (70+ chapters nationally)

---

## Section 3: Evidence

### Customer Evidence

| Type | Evidence | Source |
|------|----------|--------|
| Quote | "Please sir output is delayed so much" | Yi Erode WhatsApp, Nov 7 2024 |
| Quote | "CII and Yi logo position should have been swapped" | Design correction request |
| Quote | "Can we have a permanent non-editable header... many chapters are asking for it" | Yi member request |
| Quote | "We need both web and print versions - colors always look different" | Marketing manager feedback |
| Request count | 50+ design-related messages in 30-day period | Yi Erode WhatsApp analysis |
| Request count | 78% of users need to export to external tools for final editing | Phase 1 user survey |

### Usage Data

| Metric | Finding |
|--------|---------|
| Design requests/month | 15-20 requests across verticals (Yi Erode alone) |
| Average turnaround | 3-7 days (vs. desired same-day) |
| Revision rate | 30%+ require at least one correction |
| Follow-up messages | 4-5 messages per design request |
| Logo positioning errors | 25% of designs have incorrect logo placement |
| Print color mismatches | 40% of printed materials have color discrepancies |
| External tool usage | 78% export to Canva/Photoshop for final touches |

### Competitive Analysis

| Competitor | Multi-Logo | Brand Zones | CMYK Export | Vertical Presets | Multi-Model AI |
|------------|------------|-------------|-------------|------------------|----------------|
| Canva | No (manual) | No | Limited | No | No |
| Adobe Express | No | No | Yes (Pro) | No | Limited |
| Designhill AI | No | No | No | No | No |
| **Yi CreativeStudio** | **Yes** | **Yes** | **Yes** | **Yes** | **Yes** |

### Support Burden

| Metric | Data |
|--------|------|
| Design-related WhatsApp messages (monthly) | 50+ |
| Average back-and-forth per request | 4-5 messages |
| Common complaint themes | Delays, logo errors, no templates, color mismatch |
| Volunteer hours on repetitive designs | 10-15 hours/week |

---

## Section 4: User Stories

### Story 1 (Primary - Vertical Chair)
> As a **Vertical Chair (e.g., Masoom Chair)**, I want to **generate a session poster by selecting my vertical, entering event details, and choosing which logos to include**, so that I can **promote my school session on social media within minutes instead of waiting days**.

**Context:** Vertical Chairs organize 5-10 sessions/month. Each needs a poster with correct Yi logo (top-left), CII logo (top-right), and sometimes partner/sponsor logos. Current 3-7 day wait means many sessions go unpromoted.

### Story 2 (Chapter Leadership)
> As a **Chapter Chair**, I want to **generate professional event posters with all required branding elements locked in place**, so that I **maintain a professional appearance with government officials, sponsors, and CII leadership without design bottlenecks**.

**Context:** Chapter Chair represents Yi to District Collector, sponsors, and CII leadership. Branding errors damage credibility. Professional creatives are non-negotiable.

### Story 3 (Print Coordinator)
> As a **Print Coordinator**, I want to **download creatives in CMYK format with the correct ICC profile (FOGRA39 for India/Europe)**, so that **printed banners and standees match the screen colors exactly**.

**Context:** Organizations spend ₹5,000-50,000 on print materials for major events. Color mismatch between screen and print causes reprints and budget overruns.

### Story 4 (Multi-College Administrator)
> As an **Educational Institution Admin (managing multiple colleges)**, I want to **store logos for each college and department, then select the appropriate combination for each event**, so that **I don't upload the same logos repeatedly and can quickly generate posters for any college**.

**Context:** JKKN manages 7 colleges with 20+ department logos. Each event poster needs specific college logo + group logo + department logo. Manual selection from a library saves 5-10 minutes per poster.

### Story 5 (Brand Designer)
> As a **Content Creator with some design sense**, I want to **choose between different AI models (Gemini for photo-realistic, Ideogram for typography)** and **customize positioning of elements before generation**, so that **I get results that match my creative vision without post-editing**.

**Context:** Different events need different aesthetics. Sports day posters need dynamic imagery (Ideogram), while corporate seminars need clean, professional layouts (Gemini). Power users want control.

### Story 6 (Regional Leadership)
> As **Regional Leadership (SRTN/NRTN)**, I want to **provide a replicable creative solution to all chapters under my region**, so that **brand consistency improves across 16+ chapters without each building their own system**.

**Context:** If Yi Erode pilots successfully, solution can scale to 70+ chapters nationally. Regional leaders need to demonstrate value to secure buy-in.

---

## Section 5: Features

### 5.1 Must-Have Features (P0)

**Maximum 5 P0 features. These are required for launch.**

| ID | Feature Name | Description | Serves Stories |
|----|--------------|-------------|----------------|
| F01 | **Authentication & Multi-Tenancy** | Email/Google OAuth login, organization creation with invite codes, role-based access (Admin/Editor/Viewer), secure session management | 2, 4, 6 |
| F02 | **Organization Brand Configuration** | Admin uploads Yi logo, CII logo, partner logos; defines locked header (150px) and footer (120px) zones; sets primary/secondary colors and fonts | 1, 2, 4 |
| F03 | **Multi-Logo Management System** | Upload unlimited logos per organization, categorize (primary/secondary/partner/sponsor/department), select 1-4 logos per creative with 9-position grid placement | 1, 4, 5 |
| F04 | **Vertical Presets with Event Form** | Pre-configured templates for each vertical (Masoom, Road Safety, Climate Change, Yuva, Thalir, Health, Innovation, Chapter Event) with appropriate themes; dynamic form based on creative type | 1, 2, 3 |
| F05 | **AI Creative Generation with Model Selection** | Choose between Gemini (photo-realistic, ₹5) and Ideogram (typography-focused, ₹6); automatic logo overlay in locked zones; prompt engineering based on inputs | 1, 2, 5 |

### 5.2 Nice-to-Have Features (P1)

| ID | Feature Name | Description | Why Not P0 |
|----|--------------|-------------|------------|
| F06 | **CMYK/RGB Export System** | Download in RGB (sRGB for digital) or CMYK (FOGRA39/SWOP/Japan) with ICC profile embedding; DPI selection (150/300/600) | Adds complexity, can launch with RGB-only |
| F07 | **Designer Customization Panel** | Collapsible panel for title position/font/size, background style, speaker photo shape, footer content, logo positioning fine-tuning | Power user feature, basic generation works without |
| F08 | **Real-Time Preview Canvas** | Live preview updates as users adjust settings; aspect ratio toggle; zoom controls | UX enhancement, not blocking |
| F09 | **Creative Library with Search** | Save past creatives, search by vertical/date/event type, favorites, 90-day storage | Can use device downloads initially |
| F10 | **Wallet & Billing (Razorpay)** | Prepaid credits wallet, minimum ₹100 recharge, bulk discounts, 1-year validity, auto-recharge option | Can launch with free pilot credits |

### 5.3 Future Features (P2)

| ID | Feature Name | Description | Why Later |
|----|--------------|-------------|-----------|
| F11 | Session Impact Logger | Quick form to log school name, students reached, trainers - auto-aggregates for Yi Health Card | Separate module |
| F12 | Social Media Auto-Post | Direct posting to chapter Instagram/Facebook | Requires social API integration |
| F13 | Multi-Chapter Dashboard | Regional/National admins see all chapters, aggregate analytics | After single-chapter pilot |
| F14 | Certificate Generator | Participation/trainer certificates with auto-fill | Different use case |
| F15 | Video Thumbnail Generator | Thumbnails for Yi podcast/event videos | Different format |
| F16 | Post-Generation Editor | Drag-drop repositioning using Fabric.js | Complex, defeats "instant" value prop |
| F17 | API Access | REST API for programmatic generation | Enterprise feature |

---

## Section 6: User Flow

> ⚠️ **THIS IS THE MOST IMPORTANT SECTION. Claude Code translates this directly into code.**

### 6.1 Happy Path: Member Generates Event Poster with Multi-Logo and Model Selection

**Starting Point:** Yi Erode member (Priya, Masoom Chair) is logged in and wants to create a poster for upcoming school session.

**Step-by-Step Flow:**

| Step | User Action | System Response | What User Sees |
|------|-------------|-----------------|----------------|
| 1 | Opens app/URL | Loads dashboard | Dashboard with "Create New" button, recent creatives grid, credit balance |
| 2 | Clicks "Create New Creative" | Shows creative type selector | Grid: Event Poster, Social Post, Banner, Announcement |
| 3 | Selects "Event Poster" | Shows vertical selector | Dropdown: Masoom, Road Safety, Climate Change, Yuva, Thalir, Health, Innovation, Chapter Event |
| 4 | Selects "Masoom" | Loads Masoom-specific form with theme pre-selected | Form with Masoom color scheme indicated |
| 5 | Fills event details | Form validates inputs | Fields: Event Name, School Name, Date, Time, Venue, Trainers Count, Guest (optional), Language |
| 6 | Expands "Select Logos" section | Shows organization's logo library | Grid of uploaded logos with checkboxes |
| 7 | Selects Yi Logo + CII Logo | Checkboxes activated, position selectors appear | Yi Logo: Top-Left (default), CII Logo: Top-Right (default) |
| 8 | (Optional) Adds Partner Logo | Third logo checkbox activated | Position selector: Bottom-Left (default for partners) |
| 9 | Expands "AI Model" section | Shows model options with comparison | Two cards: Gemini (₹5, photo-realistic) vs Ideogram (₹6, typography) |
| 10 | Selects "Ideogram" (better for text-heavy posters) | Model selected, credit cost updates | "Selected: Ideogram - 6 credits" |
| 11 | Clicks "Generate Creative" | API call, shows loading | Button: "Generating..." with spinner, ~15-30 seconds |
| 12 | Generation completes | Displays preview with actions | Full preview with logos in correct positions, footer with chapter contact |
| 13 | Clicks "Download" dropdown | Shows format options | PNG (default), PDF (print), JPG (smaller) |
| 14 | Selects "PDF" | Shows color mode options (if P1 enabled) | RGB (digital) vs CMYK (print) |
| 15 | Clicks "Download" | File downloads | File saved as "yi-erode-masoom-session-nov30.pdf" |
| 16 | (Optional) Clicks "Generate Another" | New variation with same inputs | Different design, costs 1 credit |

**Detailed Flow Description:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. DASHBOARD                                                                │
├─────────────────────────────────────────────────────────────────────────────┤
│ [Yi Logo] CreativeStudio          [Yi Erode ▼] [👤 Priya ▼]                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   Welcome, Priya! 👋                                                        │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │                                                                     │  │
│   │         [+ Create New Creative]                                     │  │
│   │            (Large teal button)                                      │  │
│   │                                                                     │  │
│   │   Generate professional posters in 30 seconds                       │  │
│   │                                                                     │  │
│   └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │ 💰 Credits: 47        ₹5-6 per creative              [+ Recharge]   │  │
│   └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│   Your Recent Creatives                                      [View All →]  │
│   ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐                             │
│   │        │ │        │ │        │ │        │                             │
│   │ thumb  │ │ thumb  │ │ thumb  │ │ thumb  │                             │
│   │        │ │        │ │        │ │        │                             │
│   │ Nov 25 │ │ Nov 22 │ │ Nov 20 │ │ Nov 18 │                             │
│   │ Masoom │ │ Road   │ │ Fellow │ │ Yuva   │                             │
│   └────────┘ └────────┘ └────────┘ └────────┘                             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 2. CREATIVE TYPE SELECTION MODAL                                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   What would you like to create?                                    [X]    │
│                                                                             │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │
│   │ 📋          │  │ 📱          │  │ 🖼️          │  │ 📢          │      │
│   │ Event       │  │ Social      │  │ Banner      │  │ Announce-   │      │
│   │ Poster      │  │ Post        │  │             │  │ ment        │      │
│   │             │  │             │  │             │  │             │      │
│   │ 9:16        │  │ 1:1 / 4:5   │  │ 16:9        │  │ 4:3         │      │
│   └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 3. MAIN CREATION PAGE (after selecting Event Poster → Masoom)              │
├─────────────────────────────────────────────────────────────────────────────┤
│ ← Back                    Create Event Poster                               │
├──────────────────────────────────────┬──────────────────────────────────────┤
│                                      │                                      │
│  Vertical: Masoom                    │    ┌──────────────────────────────┐ │
│  Theme: Child Safety (auto)          │    │ [Yi Logo]     [CII Logo]     │ │
│                                      │    │                              │ │
│  ─────────────────────────────────   │    │                              │ │
│                                      │    │                              │ │
│  Event Name *                        │    │    PREVIEW AREA              │ │
│  [Child Safety Session         ]     │    │                              │ │
│                                      │    │    (Shows after generation)  │ │
│  School Name *                       │    │                              │ │
│  [Railway Colony Govt School   ]     │    │                              │ │
│                                      │    │                              │ │
│  Date *            Time *            │    │                              │ │
│  [Nov 30 📅]      [10:00 AM ⏰]      │    │                              │ │
│                                      │    │                              │ │
│  Venue                               │    │ ────────────────────────────│ │
│  [School Auditorium           ]      │    │ Yi Erode | yi.erode@cii.in  │ │
│                                      │    └──────────────────────────────┘ │
│  Number of Trainers                  │                                      │
│  [4                           ]      │    [Aspect: Portrait ▼]              │
│                                      │    [Zoom: 75%        ▼]              │
│  Chief Guest (optional)              │                                      │
│  [Dr. Ashwini N.V.            ]      │                                      │
│  Designation                         │                                      │
│  [Child Safety Expert         ]      │                                      │
│                                      │                                      │
│  Language *                          │                                      │
│  [English                   ▼]       │                                      │
│                                      │                                      │
│  ─────────────────────────────────   │                                      │
│                                      │                                      │
│  ▼ Select Logos (2 selected)         │                                      │
│  ┌─────────────────────────────────┐ │                                      │
│  │ ☑ Yi Logo      Position: [Top-Left ▼]     │                             │
│  │ ☑ CII Logo     Position: [Top-Right ▼]    │                             │
│  │ ☐ Partner Logo                            │                             │
│  │ ☐ Sponsor Logo                            │                             │
│  │                         [+ Upload New]    │                             │
│  └─────────────────────────────────────────────┘                            │
│                                      │                                      │
│  ▼ AI Model                          │                                      │
│  ┌─────────────────────────────────┐ │                                      │
│  │ ○ Gemini Flash (₹5)             │ │                                      │
│  │   Best for: Photo-realistic     │ │                                      │
│  │   Speed: ~15 seconds            │ │                                      │
│  │                                 │ │                                      │
│  │ ● Ideogram 3.0 (₹6)  ✓ Selected │ │                                      │
│  │   Best for: Typography, Design  │ │                                      │
│  │   Speed: ~20 seconds            │ │                                      │
│  └─────────────────────────────────┘ │                                      │
│                                      │                                      │
│  ─────────────────────────────────   │                                      │
│                                      │                                      │
│  [────── Generate Creative ──────]   │                                      │
│  Uses 6 credits                      │                                      │
│                                      │                                      │
└──────────────────────────────────────┴──────────────────────────────────────┘
```

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 4. GENERATION COMPLETE - PREVIEW WITH ACTIONS                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ✓ Creative Generated Successfully!                                        │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │ [Yi Logo]                                             [CII Logo]    │  │
│   │                                                                     │  │
│   │                                                                     │  │
│   │                                                                     │  │
│   │              🛡️ CHILD SAFETY SESSION                               │  │
│   │                                                                     │  │
│   │              Railway Colony Government School                       │  │
│   │              Erode, Tamil Nadu                                      │  │
│   │                                                                     │  │
│   │              📅 November 30, 2025                                   │  │
│   │              🕐 10:00 AM                                            │  │
│   │              📍 School Auditorium                                   │  │
│   │                                                                     │  │
│   │              ────────────────────                                   │  │
│   │              Chief Guest                                            │  │
│   │              Dr. Ashwini N.V.                                       │  │
│   │              Child Safety Expert                                    │  │
│   │                                                                     │  │
│   │              4 Certified Trainers                                   │  │
│   │                                                                     │  │
│   │ ───────────────────────────────────────────────────────────────    │  │
│   │ Yi Erode Chapter | yi.erode@cii.in | www.youngindians.net          │  │
│   └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│   [♥ Save]    [↻ Generate Another]    [Download ▼]                         │
│                                                                             │
│   Download Options:                                                         │
│   ┌─────────────────────────────────────┐                                  │
│   │ Format:                             │                                  │
│   │ ○ PNG (High quality, recommended)   │                                  │
│   │ ○ PDF (Best for printing)           │                                  │
│   │ ○ JPG (Smaller file size)           │                                  │
│   │                                     │                                  │
│   │ [Download Now]                      │                                  │
│   └─────────────────────────────────────┘                                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Alternative Flow A: Organization Admin Configures Brand

**Trigger:** New organization signup or admin accessing settings

| Step | User Action | System Response | What User Sees |
|------|-------------|-----------------|----------------|
| 1 | Admin clicks "Settings" | Shows organization settings | Tabs: Brand, Logos, Team, Billing |
| 2 | Selects "Brand" tab | Shows brand configuration | Form: Colors, Fonts, Contact Info |
| 3 | Uploads primary logo | Processes, generates thumbnail | Logo preview with dimensions |
| 4 | Sets primary color | Color picker opens | Hex input with preview |
| 5 | Defines header zone | Shows zone visualization | 150px reserved area highlighted |
| 6 | Clicks "Save Brand" | Saves configuration | "Brand settings saved" toast |

### 6.3 Alternative Flow B: Multi-Logo Upload and Organization

**Trigger:** User needs to add new logos

| Step | User Action | System Response |
|------|-------------|-----------------|
| 1 | Opens Logo Management | Shows logo library grid |
| 2 | Clicks "Upload Logo" | File picker opens |
| 3 | Selects PNG/SVG file | Uploads, analyzes transparency |
| 4 | Enters logo name | Text field |
| 5 | Selects category | Dropdown: Primary, Secondary, Partner, Sponsor, Department |
| 6 | Clicks "Save" | Logo added to library |

### 6.4 Alternative Flow C: Chapter Event (Not Vertical-Specific)

If user selects "Chapter Event" as vertical:
1. Form shows Event Type dropdown (Fellowship, Annual Day, EC Meeting, Collector Meeting)
2. Theme options expand (Corporate, Festive, Sports, Cultural)
3. Guest fields become prominent (Name, Designation, Photo upload)
4. Rejoins main flow at generation step

---

## Section 7: Edge Cases

### 7.1 Edge Case Table

| ID | What If... | What Should Happen | Priority | Message to User |
|----|------------|-------------------|----------|-----------------|
| E01 | User has 0 credits | Show upgrade prompt, disable Generate button | High | "You've used all credits. Add more to continue creating." [Recharge] |
| E02 | Generation takes >60s | Show extended loading, offer cancel | High | "Taking longer than usual. We'll keep trying..." |
| E03 | Generation fails (API error) | Show error, retry option, don't deduct credit | High | "Generation failed. Please try again. No credit was used." [Retry] |
| E04 | User is offline | Show offline indicator, prevent generation | High | "You're offline. Connect to internet to generate creatives." |
| E05 | User clicks Generate multiple times | Disable button after first click | High | N/A (prevention via disabled state) |
| E06 | Required field empty | Highlight field, prevent submit | High | "[Field name] is required" |
| E07 | Date is in past | Show warning but allow | Medium | "⚠️ Selected date is in the past. Continue anyway?" |
| E08 | Event name too long (>100 chars) | Truncate with warning | Medium | "Event name shortened for best results" |
| E09 | Chapter brand not configured | Block generation, prompt admin | High | "Chapter branding not set up. Contact your Chapter Admin." |
| E10 | User not logged in | Redirect to login | High | "Please log in to create creatives" |
| E11 | User doesn't belong to any organization | Show onboarding | High | "Join an organization or create one to start" |
| E12 | User selects >4 logos | Limit selection, show warning | High | "Maximum 4 logos per poster. Deselect one to add another." |
| E13 | Two logos same position | Show conflict warning | High | "Two logos are set to [Position]. Please assign different positions." |
| E14 | Logo file too large (>5MB) | Reject upload | High | "Logo must be under 5MB. Please compress and try again." |
| E15 | Selected AI model API down | Offer alternative model | High | "Ideogram is temporarily unavailable. Generate with Gemini instead?" |
| E16 | Organization has no logos | Show empty state | High | "No logos found. Upload your first logo to get started." [Upload] |

### 7.2 Edge Case Details

**E03: Generation Failure**
- Trigger: AI API returns error or times out after 90 seconds
- Behavior: Show error, log for debugging, DO NOT deduct credit
- Recovery: User clicks Retry (same inputs), or modifies inputs

**E12: Logo Selection Limit**
- Trigger: User tries to check 5th logo checkbox
- Display: 5th checkbox doesn't activate, tooltip appears
- Recovery: User unchecks any existing logo, then can select new one

**E15: AI Model Unavailable**
- Trigger: API returns 503 or timeout after 3 retries
- Display: Model card shows "Unavailable" badge, alternative highlighted
- Recovery: User selects available model or waits and retries

---

## Section 8: Business Rules

### 8.1 Access & Permissions

| Rule | IF | THEN |
|------|-----|------|
| Organization membership | User is not member of any organization | Cannot access creative generation |
| Role: Admin | User is Admin of organization | Can configure brand, manage team, view billing, generate creatives |
| Role: Editor | User is Editor | Can generate creatives, view library, cannot configure brand |
| Role: Viewer | User is Viewer | Can view library only, cannot generate |
| Multi-org | User belongs to multiple organizations | Can switch between organizations, each has separate brand/credits |

### 8.2 Logo Management Rules

| Rule | IF | THEN |
|------|-----|------|
| Logo limit | Organization uploads > 50 logos | Block upload, show "Storage limit reached" |
| Selection limit | User selects > 4 logos for poster | Disable additional checkboxes |
| Position conflict | Two logos assigned same position | Show validation error before generation |
| File format | Logo is not PNG/SVG/JPG | Reject upload |
| File size | Logo > 5MB | Reject upload |
| Transparency check | Logo uploaded | Auto-detect if has transparent background |

### 8.3 Credits & Billing

| Rule | IF | THEN |
|------|-----|------|
| Gemini generation | User generates with Gemini | Deduct 5 credits (₹5 value) |
| Ideogram generation | User generates with Ideogram | Deduct 6 credits (₹6 value) |
| Failed generation | API error occurs | Do NOT deduct credit, auto-refund if already deducted |
| Regeneration | User clicks "Generate Another" | Deduct credits (new generation) |
| Download | User downloads creative | FREE (unlimited downloads of generated creative) |
| Size variants | User downloads multiple sizes | FREE (same creative) |
| Minimum recharge | User recharges wallet | Minimum ₹100 (20 credits) |
| Credit validity | Credits purchased | Valid for 1 year |
| Free starter | New organization signs up | 10 free credits |
| CMYK export | User exports as CMYK (if P1) | No additional credits (included in Pro plan) |

### 8.4 Brand Rules (Yi-Specific - CRITICAL)

| Rule | IF | THEN |
|------|-----|------|
| Yi logo position | Any Yi creative generated | Yi logo in TOP-LEFT, non-negotiable |
| CII logo position | Any Yi creative generated | CII logo in TOP-RIGHT, same height as Yi logo |
| Logo modification | Any creative generated | Logos in locked zones cannot be modified/repositioned |
| Footer content | Any creative generated | Chapter name + email + website in footer zone |
| Reserved zones | Any creative generated | Header (top 150px) and footer (bottom 120px) LOCKED |
| Vertical themes | User selects Masoom | Apply child safety color scheme (softer tones, protective imagery) |
| Vertical themes | User selects Road Safety | Apply alert scheme (yellows, blacks, warning imagery) |
| Language | User selects Tamil | Generate text content in Tamil script |

### 8.5 AI Model Rules

| Rule | IF | THEN |
|------|-----|------|
| Model selection | User selects Gemini | Use gemini-2.0-flash-preview-image-generation |
| Model selection | User selects Ideogram | Use Ideogram 3.0 API with style_type: DESIGN |
| Model unavailable | API returns error 3x | Mark model temporarily unavailable, suggest alternative |
| Generation timeout | > 90 seconds | Timeout, refund credits, suggest retry or different model |
| Prompt construction | User fills form | System builds optimized prompt with brand context + user inputs |

### 8.6 Content Rules

| Rule | IF | THEN |
|------|-----|------|
| Event name | > 100 characters | Truncate to 100 with "..." |
| Date format | User enters date | Display as "Month DD, YYYY" (e.g., "November 30, 2025") |
| Time format | User enters time | Display as "HH:MM AM/PM" (e.g., "10:00 AM") |
| Guest name | Provided | Display prominently with designation |
| Guest name | Not provided | Omit guest section from creative |

---

## Section 9: Visual Reference

### 9.1 Generated Poster Structure (LOCKED ZONES)

```
┌─────────────────────────────────────────────────────────────┐
│  ┌──────────┐                           ┌──────────┐        │ ← HEADER ZONE (150px)
│  │ Yi LOGO  │                           │ CII LOGO │        │   LOCKED - System controls
│  │ Top-Left │                           │Top-Right │        │   Non-negotiable positions
│  └──────────┘                           └──────────┘        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                                                             │
│              [VISUAL ELEMENT / IMAGERY]                     │
│              (AI-generated contextual image)                │ ← CONTENT ZONE
│                                                             │   AI generates based on
│                                                             │   user inputs + vertical theme
│         ════════════════════════════════════                │
│                                                             │
│              EVENT TITLE                                    │
│                                                             │
│              Venue Name                                     │
│              Location                                       │
│                                                             │
│              📅 Date                                        │
│              🕐 Time                                        │
│                                                             │
│         ────────────────────────────────────                │
│                                                             │
│              Chief Guest (if provided)                      │
│              Name & Designation                             │
│                                                             │
│              [Additional Info: Trainers, etc.]              │
│                                                             │
│  ┌──────────┐                           ┌──────────┐        │ ← PARTNER ZONE (optional)
│  │ Partner  │                           │ Sponsor  │        │   User-selected, positioned
│  │ Bottom-L │                           │Bottom-R  │        │
│  └──────────┘                           └──────────┘        │
├─────────────────────────────────────────────────────────────┤
│  Organization Name | email@org.com | website.com            │ ← FOOTER ZONE (120px)
│                                                             │   LOCKED - Admin configured
└─────────────────────────────────────────────────────────────┘

Dimensions: 1080 x 1920 pixels (9:16 portrait)
```

### 9.2 Logo Position Grid (9-Position System)

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│   ┌───────────┐     ┌───────────┐     ┌───────────┐         │
│   │ TOP-LEFT  │     │TOP-CENTER │     │ TOP-RIGHT │         │
│   │    (1)    │     │    (2)    │     │    (3)    │         │
│   │  Yi Logo  │     │  (rare)   │     │ CII Logo  │         │
│   └───────────┘     └───────────┘     └───────────┘         │
│                                                              │
│   ┌───────────┐     ┌───────────┐     ┌───────────┐         │
│   │MID-LEFT   │     │  CENTER   │     │ MID-RIGHT │         │
│   │    (4)    │     │    (5)    │     │    (6)    │         │
│   │  (rare)   │     │  (rare)   │     │  (rare)   │         │
│   └───────────┘     └───────────┘     └───────────┘         │
│                                                              │
│   ┌───────────┐     ┌───────────┐     ┌───────────┐         │
│   │BTM-LEFT   │     │BTM-CENTER │     │ BTM-RIGHT │         │
│   │    (7)    │     │    (8)    │     │    (9)    │         │
│   │ Partner   │     │ Sponsor   │     │ Sponsor   │         │
│   └───────────┘     └───────────┘     └───────────┘         │
│                                                              │
└──────────────────────────────────────────────────────────────┘

Default Assignments:
- Position 1 (Top-Left): Primary Logo (Yi Logo) - LOCKED
- Position 3 (Top-Right): CII Logo - LOCKED for Yi
- Position 7 (Bottom-Left): Partner Logo (if selected)
- Position 9 (Bottom-Right): Sponsor Logo (if selected)
```

### 9.3 Reference Existing Patterns

- **Modal style:** Clean, centered, backdrop dimmed (shadcn/ui Dialog)
- **Form inputs:** Floating labels, clear validation (shadcn/ui Form)
- **Button styles:** Primary (teal #1B998B), Secondary (outline)
- **Toast notifications:** Top-right, auto-dismiss 3 seconds
- **Loading states:** Skeleton + spinner, consistent across app

---

## Section 10: UI Text & Copy

### 10.1 Primary UI Elements

| Element | Location | Exact Text | Style Notes |
|---------|----------|------------|-------------|
| Main CTA | Dashboard center | "Create New Creative" | Teal (#1B998B), large, bold |
| Generate button | Form bottom | "Generate Creative" | Teal, medium |
| Generating state | Form bottom | "Generating..." | Gray, with spinner |
| Download button | Preview area | "Download" | Teal, with dropdown arrow |
| Regenerate button | Preview area | "Generate Another" | Outline style |
| Save button | Preview area | "Save to Library" | Outline style (if F09 enabled) |

### 10.2 Form Elements

| Element | Label Text | Placeholder Text | Help Text |
|---------|------------|------------------|-----------|
| Vertical dropdown | "Vertical" | "Select your vertical" | Required |
| Event name input | "Event Name" | "e.g., Child Safety Session" | Required |
| School/Venue input | "School / Venue" | "e.g., Railway Colony Govt School" | Required |
| Date picker | "Date" | "Select date" | Required |
| Time picker | "Time" | "Select time" | Required |
| Guest name | "Chief Guest (optional)" | "e.g., Dr. Ashwini N.V." | Leave blank if no guest |
| Guest designation | "Designation" | "e.g., Child Safety Expert" | Only shown if guest name filled |
| Language dropdown | "Language" | "English" (default) | Options: English, Tamil, Hindi |
| Logo selector | "Select Logos" | N/A | "Choose which logos to include (max 4)" |
| Model selector | "AI Model" | N/A | "Choose based on your creative needs" |

### 10.3 Feedback Messages

| Scenario | Message Text | Display Style |
|----------|--------------|---------------|
| Success - Generated | "✓ Creative ready! Download or generate another." | Green toast, 3s |
| Success - Downloaded | "✓ Downloaded! Check your downloads folder." | Green toast, 3s |
| Success - Saved | "✓ Saved to your library!" | Green toast, 3s |
| Error - Generation failed | "Generation failed. Please try again. No credit used." | Red toast, stays until dismissed |
| Error - No credits | "You've used all credits. Add more to continue." | Red banner with [Recharge] button |
| Error - Offline | "You're offline. Connect to internet to generate." | Yellow banner, persistent |
| Error - Logo conflict | "Two logos are set to [Position]. Please assign different positions." | Red inline error |
| Loading | "Creating your masterpiece..." | Gray text below button |
| Loading extended | "Taking longer than usual. Almost there..." | Gray text, after 30s |
| Empty library | "No creatives yet. Create your first one!" | Centered text with illustration |
| Empty logos | "No logos found. Upload your first logo to get started." | Gray empty state |
| Validation | "[Field name] is required" | Red text below field |

### 10.4 Tone & Voice

**Overall tone:** Friendly & encouraging, with professionalism for government/corporate contexts

**Example of desired tone:**
> "Your poster is ready! 🎉 Download it now and share with your team. Need a different style? Hit 'Generate Another' for a fresh design."

---

## Section 11: Success Metrics

### 11.1 Quantitative Goals (First 3 Months)

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Adoption rate | 50%+ of Yi Erode members use within 30 days | Unique users / total members |
| Creatives generated | 100+ creatives/month (Yi Erode) | Count successful generations |
| Time to creative | Average < 60 seconds (form fill + generation) | Track from page load to download |
| Generation success rate | > 95% | Successful / Total attempts |
| Repeat usage | 60%+ users generate 2+ creatives | Per-user generation count |
| Multi-logo adoption | 50%+ generations use 2+ logos | Track logo_count per generation |
| Design volunteer time saved | 10+ hours/month | Survey before/after |
| Logo error reduction | 90% reduction in positioning errors | Tracked corrections vs. pre-platform |

### 11.2 Qualitative Goals

| Goal | How We'll Know |
|------|----------------|
| Members confident sharing with government officials | Survey: confidence score > 4/5 |
| Brand consistency improves | Zero logo positioning complaints |
| Design volunteers report reduced burden | Direct feedback |
| Regional leadership interested in rollout | Inbound inquiries from other chapters |

### 11.3 Tracking Implementation

| Event Name | Trigger | Properties to Capture |
|------------|---------|----------------------|
| creative_started | User opens form | user_id, org_id, creative_type, vertical |
| logo_selected | User selects logo | org_id, logo_id, position, total_selected |
| model_selected | User clicks model card | org_id, model_name, credits_cost |
| creative_generated | Generation succeeds | user_id, vertical, model, duration_ms, logo_count |
| creative_failed | Generation fails | user_id, error_type, model |
| creative_downloaded | User downloads | user_id, creative_id, format |
| credits_purchased | User recharges | user_id, amount_inr, credits_added |

---

## Section 12: Non-Goals & Scope Boundaries

### 12.1 Not Building in This Version

| Feature | Why Not | Future Plans |
|---------|---------|--------------|
| Design editing/customization | Defeats "instant" value prop | Never (by design) |
| Post-generation editor | Complex, Fabric.js integration | P2 - Maybe later |
| Approval workflows | Adds friction, trust members | Maybe v2 if chapters request |
| Session impact logging | Separate module | P1 - Fast follow |
| Certificate generation | Different use case | v2 |
| Video generation | Complex, different technology | v3 or never |
| Real-time collaboration | Complex sync architecture | Never |
| Custom font uploads | Licensing complexity | Never |
| API access | Enterprise feature | Phase 3 |

### 12.2 Explicit Constraints

- **DO NOT** build design editing - this is "generate and done"
- **DO NOT** add approval workflows - members generate directly
- **DO NOT** allow logo repositioning outside 9-position grid
- **DO NOT** support custom fonts - use organization's preset fonts only
- **DO NOT** add more than 2 AI models (Gemini + Ideogram)
- **DO NOT** build for video/animation - static images only

### 12.3 Out of Scope Clarifications

- "Can I edit the generated poster?" → No, generate another variation
- "Can I add my company logo anywhere?" → No, use 9-position grid
- "Can I change the footer text per poster?" → No, footer is org-wide, admin-controlled
- "Can I use my own template?" → No, use vertical presets; request new preset from admin
- "Can I draw on the preview?" → No, not in this version

---

## Section 13: Technical Context

### 13.1 Recommended Tech Stack

| Layer | Technology | Notes |
|-------|------------|-------|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui | Modern, performant |
| State Management | Zustand | Lightweight, easy to use |
| Backend | Next.js API Routes (serverless) | Integrated, scalable |
| Database | PostgreSQL via Supabase | Reliable, excellent DX |
| ORM | Prisma | Type-safe, migrations |
| Auth | Supabase Auth (Email + Google OAuth) | Built-in, secure |
| Storage | Supabase Storage | Logos, generated images |
| AI - Primary | Google Gemini API (gemini-2.0-flash-preview-image-generation) | Photo-realistic |
| AI - Secondary | Ideogram API (v3) | Typography, design-focused |
| Payments | Razorpay | Indian market, UPI support |
| Image Processing | Sharp.js | Logo overlay, CMYK conversion |
| Hosting | Vercel | Edge, automatic scaling |

### 13.2 Database Schema (Core Tables)

```sql
-- organizations table
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  type TEXT DEFAULT 'yi_chapter', -- yi_chapter, educational, corporate, ngo
  invite_code TEXT UNIQUE,
  
  -- Brand configuration (JSON for flexibility)
  brand_config JSONB DEFAULT '{
    "primaryColor": "#1B998B",
    "secondaryColor": "#005B96",
    "fontPrimary": "Inter",
    "fontSecondary": "Inter",
    "headerZoneHeight": 150,
    "footerZoneHeight": 120,
    "footerText": "",
    "footerEmail": "",
    "footerWebsite": ""
  }',
  
  credits_balance INTEGER DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- organization_logos table
CREATE TABLE organization_logos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL, -- primary, secondary, partner, sponsor, department
  file_url TEXT NOT NULL,
  thumbnail_url TEXT,
  file_size_bytes INTEGER,
  width INTEGER,
  height INTEGER,
  has_transparency BOOLEAN DEFAULT false,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- users table (extends Supabase auth.users)
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- organization_members table
CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'editor', -- admin, editor, viewer
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

-- ai_models table
CREATE TABLE ai_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  provider TEXT NOT NULL, -- google, ideogram
  model_id TEXT NOT NULL,
  credits_cost INTEGER NOT NULL,
  best_for TEXT,
  is_active BOOLEAN DEFAULT true
);

-- creatives table
CREATE TABLE creatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id),
  
  -- Creative metadata
  creative_type TEXT NOT NULL, -- event_poster, social_post, banner
  vertical TEXT, -- masoom, road_safety, climate_change, etc.
  
  -- Form inputs (JSON for flexibility)
  form_data JSONB NOT NULL,
  
  -- Logo configuration
  logo_config JSONB, -- [{logo_id, position}]
  
  -- Generation details
  ai_model TEXT NOT NULL,
  prompt_used TEXT,
  
  -- Output
  image_url TEXT NOT NULL,
  thumbnail_url TEXT,
  
  -- Metadata
  credits_used INTEGER NOT NULL,
  generation_time_ms INTEGER,
  is_favorite BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '90 days'
);

-- credit_transactions table
CREATE TABLE credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  
  type TEXT NOT NULL, -- purchase, generation, refund
  amount INTEGER NOT NULL, -- positive for credit, negative for debit
  
  -- For purchases
  payment_id TEXT,
  payment_provider TEXT,
  amount_inr INTEGER,
  
  -- For generations
  creative_id UUID REFERENCES creatives(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- vertical_presets table (Yi-specific)
CREATE TABLE vertical_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  
  -- Theme configuration
  theme_config JSONB NOT NULL, -- colors, imagery style, tone
  
  -- Form field configuration
  form_fields JSONB NOT NULL, -- which fields to show
  
  -- Prompt template
  prompt_template TEXT NOT NULL,
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 13.3 API Integrations

**Gemini API (Primary)**
```javascript
// Endpoint
POST https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent

// Config
{
  contents: [{ parts: [{ text: promptText }] }],
  generationConfig: {
    responseModalities: ["TEXT", "IMAGE"],
    imageConfig: {
      aspectRatio: "9:16",
      imageSize: "2K"
    }
  }
}
```

**Ideogram API (Secondary)**
```javascript
// Endpoint
POST https://api.ideogram.ai/api/image/generate

// Config
{
  prompt: promptText,
  model: "V_3",
  aspect_ratio: "9x16",
  style_type: "DESIGN",
  magic_prompt_option: "AUTO",
  color_palette: { members: ["#1B998B", "#005B96"] },
  negative_prompt: "blurry, text errors, watermark"
}
```

### 13.4 Constraints

| Constraint | Requirement |
|------------|-------------|
| Performance | Generation < 60 seconds, page load < 2 seconds |
| Browser support | Chrome 90+, Firefox 90+, Safari 14+, Edge 90+ |
| Mobile support | Responsive (mobile-first for form entry) |
| Accessibility | WCAG 2.1 AA - keyboard navigation, screen reader labels |
| Security | API keys server-side only, user data encrypted, RLS on Supabase |
| Storage | 90-day retention for generated creatives |

---

## Section 14: Timeline & Dependencies

### 14.1 Timeline Pressure

- **Pilot Deadline:** January 15, 2026 (Yi Erode Annual Day)
- **Priority:** High - addresses daily operational pain point
- **Phased Rollout:**
  - Phase 1 (P0 features): 4 weeks
  - Phase 2 (P1 features): 3 weeks
  - Pilot testing: 2 weeks

### 14.2 Dependencies

**This project depends on:**

| Dependency | Status | Blocker? |
|------------|--------|----------|
| Gemini API access | Complete (API key available) | No |
| Ideogram API access | Needs setup | No (Gemini works standalone) |
| Yi/CII logo files | Available | No |
| Razorpay merchant account | Needs setup | No (can launch with free credits) |
| Domain/hosting (Vercel) | Needs setup | No |
| Supabase project | Needs setup | No |

**Other features depend on this:**

| Dependent Feature | How |
|-------------------|-----|
| Session Impact Logger (F11) | Reuses auth, organization structure |
| Multi-Chapter Dashboard (F13) | Builds on single-chapter foundation |
| Certificate Generator (F14) | Reuses brand configuration |

### 14.3 Stakeholder Approval

| Person/Role | What They Approve | Status |
|-------------|-------------------|--------|
| Ommsharravana (Yi Erode Chair) | Overall approach | ✅ Approved |
| Yadhavi (Co-Chair) | User flow | Pending review |
| CII EM | CII branding compliance | Pending review |
| SRTN Leadership | Regional rollout | After pilot success |

---

## Section 15: Open Questions

| Question | Asked By | Answer | Answered By | Date |
|----------|----------|--------|-------------|------|
| Should we support video thumbnails in v1? | Team | No - P2 feature | Ommsharravana | Nov 28 |
| Credit pricing for chapters? | Team | ₹5/generation (Gemini), ₹6 (Ideogram), bulk discounts | Ommsharravana | Nov 28 |
| Admin approval for member signups? | Team | No - any Yi member can self-register via invite code | Ommsharravana | Nov 28 |
| Masoom special templates for TOT? | TBD | TBD | - | - |
| CMYK export in v1? | Team | P1 - can launch with RGB only | Ommsharravana | Nov 28 |
| Regional admin view for SRTN? | TBD | P2 - after pilot | - | - |

---

## PRD Completeness Checklist

### Problem & Goals (Score: 5 / 5)
- [x] Problem statement is specific (who, what, why, impact)
- [x] User value is clear with concrete example
- [x] Business value includes numbers or estimates
- [x] Evidence includes at least 3 data points
- [x] Success metrics have specific numbers

### User Stories & Features (Score: 5 / 5)
- [x] 6 user stories in correct format
- [x] User stories cover different user types
- [x] Maximum 5 features marked P0
- [x] Each feature has one-sentence description
- [x] Non-goals are explicitly listed

### User Experience (Score: 7 / 7)
- [x] Happy path flow is step-by-step detailed
- [x] Flow includes exact button names and locations
- [x] Edge cases documented (16 scenarios)
- [x] Business rules are IF-THEN statements
- [x] Visual reference included (ASCII diagrams)
- [x] All UI text written (buttons, messages, labels)
- [x] Tone/voice is specified

### Technical Context (Score: 3 / 3)
- [x] Tech stack noted
- [x] Database schema included
- [x] Constraints listed (performance, mobile, etc.)

**Total Score: 20 / 20** ✅ Ready for Build

---

## Handoff to Claude Code

**When this PRD is complete, say:**

> "Read this PRD and set up the project for long-running development.
> 
> 1. Generate the technical spec (Part 2) for my review
> 2. Create CLAUDE.md with session management rules
> 3. Create features.json from my P0 and P1 features
> 4. Create progress.txt for tracking
> 
> After I approve the technical approach, build one feature at a time, testing each before moving to the next.
> 
> Start with F01 (Authentication & Multi-Tenancy)."

---

## Appendices

### Appendix A: Yi Brand Guidelines

**Logo Positioning Rules (LOCKED)**
- Yi logo: Top-left, 20px from edges
- CII logo: Top-right, 20px from edges
- Both logos: Same height (60-80px)
- Clear space: Minimum 20px around each logo

**Color Palette**
| Color | Hex | Usage |
|-------|-----|-------|
| Yi Blue (Primary) | #005B96 | Headers, primary actions |
| Yi Orange (Secondary) | #FF6B35 | Accents, highlights |
| Accent Gold | #D4AF37 | Special occasions |
| Background Light | #F5F7FA | Page backgrounds |
| Background Dark | #1A1A2E | Dark mode (future) |

**Vertical Themes**
| Vertical | Primary Color | Theme Style |
|----------|---------------|-------------|
| Masoom | Soft Blue (#4A90D9) | Child-friendly, protective |
| Road Safety | Yellow/Black | Alert, attention-grabbing |
| Climate Change | Green (#22C55E) | Nature, sustainability |
| Yuva | Purple (#8B5CF6) | Youthful, energetic |
| Thalir | Orange (#F59E0B) | Playful, bright |
| Health | Red (#EF4444) | Medical, clean |
| Innovation | Teal (#14B8A6) | Tech, modern |
| Chapter Event | Yi Blue (#005B96) | Professional, corporate |

**Footer Content (Yi Erode Example)**
```
Yi Erode Chapter | yi.erode@cii.in | www.youngindians.net
```

### Appendix B: Gemini vs Ideogram Comparison

| Feature | Gemini Flash | Ideogram 3.0 |
|---------|--------------|--------------|
| Best for | Photo-realistic imagery | Typography, design layouts |
| Speed | ~15 seconds | ~20 seconds |
| Cost | ₹5 (5 credits) | ₹6 (6 credits) |
| Text rendering | Average | Excellent |
| Photo quality | Excellent | Good |
| Style control | Limited | Extensive (style_type) |
| Color palette | Auto | Manual control |

### Appendix C: Event Types & Form Fields

| Event Type | Required Fields | Optional Fields |
|------------|-----------------|-----------------|
| Seminar | Event Name, Date, Time, Venue | Guest, Designation, Trainers |
| Workshop | Event Name, Date, Time, Venue | Guest, Designation, Participants |
| Conference | Event Name, Date, Time, Venue | Guest, Designation, Theme |
| School Session (Masoom) | Event Name, School Name, Date, Time | Trainers Count, Guest |
| Road Safety Drive | Event Name, Location, Date, Time | Volunteers Count, Partner |
| Fellowship | Event Name, Venue, Date, Time | Theme, Dress Code |
| Annual Day | Event Name, Venue, Date, Time | Chief Guest, Sponsors |
| EC Meeting | Date, Time, Venue | Agenda |

---

**Document Version:** 3.0 (Ultra Unified)  
**Last Updated:** November 28, 2025  
**Total Word Count:** ~7,500 words  
**Estimated Read Time:** 30 minutes