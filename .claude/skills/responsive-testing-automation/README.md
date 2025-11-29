# Responsive Testing Automation Skill

Automatically test all pages across all device views (mobile, tablet, desktop) and get detailed reports with screenshots and layout issue detection.

## Quick Start

### 1. Install Dependencies

```bash
pip install playwright
playwright install
```

### 2. Start Your Dev Server

```bash
npm run dev
```

### 3. Run Automated Tests

```bash
python .claude/skills/responsive-testing-automation/scripts/test_all_pages.py
```

### 4. Generate HTML Report

```bash
python .claude/skills/responsive-testing-automation/scripts/generate_report.py ./responsive-test-results
```

### 5. Open Report

Open `responsive-test-results/report.html` in your browser.

## What It Does

- ✅ Automatically discovers all pages in your Next.js app
- ✅ Tests across 12 device configurations (mobile, tablet, desktop)
- ✅ Detects layout issues:
  - Horizontal overflow
  - Elements outside viewport
  - Text too small on mobile
  - Overlapping interactive elements
- ✅ Captures full-page screenshots for every device
- ✅ Generates beautiful HTML report with filtering

## Device Coverage

**Mobile:**
- iPhone SE (375x667)
- iPhone 12/13/14 (390x844)
- iPhone 14 Pro Max (430x932)
- Samsung Galaxy S20 (360x800)

**Tablet:**
- iPad Mini (768x1024)
- iPad Air (820x1180)
- iPad Pro 11" (834x1194)
- iPad Pro 12.9" (1024x1366)

**Desktop:**
- Laptop (1366x768)
- Desktop HD (1920x1080)
- Desktop 2K (2560x1440)
- Desktop 4K (3840x2160)

## Advanced Usage

### Test Only Mobile Devices

```bash
python scripts/test_all_pages.py --categories mobile
```

### Test Specific Devices

```bash
python scripts/test_all_pages.py --devices "iPhone 14 Pro Max" "iPad Pro 11"
```

### Custom URL (Staging/Production)

```bash
python scripts/test_all_pages.py --url https://staging.example.com
```

## Documentation

See [SKILL.md](SKILL.md) for complete documentation.

See [references/testing_workflow.md](references/testing_workflow.md) for detailed workflow guide, common fixes, and CI/CD integration.

## Time Savings

**Before:** Manually check 20 pages × 12 devices = ~4 hours

**After:** Automated test = ~5 minutes + review report

**Saves you:** 95% of testing time!
