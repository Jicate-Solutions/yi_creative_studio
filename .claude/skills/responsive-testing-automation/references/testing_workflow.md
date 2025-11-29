# Responsive Testing Workflow

## Quick Start

### 1. Installation

First, install the required dependencies:

```bash
pip install playwright
playwright install
```

This installs Playwright and the necessary browser binaries.

### 2. Run Tests

Make sure your development server is running:

```bash
npm run dev
```

Then run the automated tests:

```bash
python .claude/skills/responsive-testing-automation/scripts/test_all_pages.py
```

### 3. View Results

Generate and open the HTML report:

```bash
python .claude/skills/responsive-testing-automation/scripts/generate_report.py ./responsive-test-results
```

Open the generated `report.html` in your browser to see:
- Screenshots of all pages on all devices
- Highlighted layout issues
- Interactive filtering by device type
- Severity indicators for each issue

---

## Advanced Usage

### Test Specific Device Categories

Test only mobile devices:

```bash
python scripts/test_all_pages.py --categories mobile
```

Test mobile and tablet only:

```bash
python scripts/test_all_pages.py --categories mobile tablet
```

### Test Specific Devices

```bash
python scripts/test_all_pages.py --devices "iPhone 14 Pro Max" "iPad Pro 11" "Desktop (1920x1080)"
```

### Custom App Directory

If your app is in a different location:

```bash
python scripts/test_all_pages.py --app-dir /path/to/your/nextjs-app
```

### Custom Base URL

Test against a different URL (staging, production):

```bash
python scripts/test_all_pages.py --url https://staging.example.com
```

### Custom Output Directory

```bash
python scripts/test_all_pages.py --output ./my-test-results
```

---

## Understanding Test Results

### Issue Types

The automation checks for these common layout problems:

#### 1. **Horizontal Overflow** (High Severity)
- **What it means**: Content is wider than the viewport, causing horizontal scrolling
- **How to fix**:
  - Check for fixed widths that exceed viewport
  - Use `max-width: 100%` on images
  - Use responsive units (%, rem, vw) instead of fixed px
  - Add `overflow-x: hidden` only as last resort

#### 2. **Elements Outside Viewport** (High Severity)
- **What it means**: Specific elements extend beyond the screen width
- **How to fix**:
  - Inspect the listed elements
  - Apply proper responsive styling
  - Use flexbox/grid with proper wrapping
  - Check for absolute positioning issues

#### 3. **Tiny Text** (Medium Severity)
- **What it means**: Text smaller than 12px on mobile/tablet
- **How to fix**:
  - Increase `font-size` for mobile breakpoints
  - Use `clamp()` for fluid typography
  - Follow minimum 16px for body text on mobile

#### 4. **Overlapping Elements** (High Severity)
- **What it means**: Interactive elements (buttons, links) are positioned on top of each other
- **How to fix**:
  - Adjust spacing/margins
  - Fix z-index conflicts
  - Use proper layout (flexbox/grid)
  - Check for positioning bugs

---

## Common Layout Issues & Fixes

### Issue: Horizontal Scroll on Mobile

**Common Causes:**
- Images with fixed width exceeding viewport
- Tables without responsive wrapper
- Fixed-width containers

**Fix:**
```css
/* For images */
img {
  max-width: 100%;
  height: auto;
}

/* For tables */
.table-wrapper {
  overflow-x: auto;
}

/* For containers */
.container {
  max-width: 100%;
  padding: 0 1rem;
}
```

### Issue: Text Too Small on Mobile

**Fix with Tailwind:**
```jsx
<p className="text-sm md:text-base">Your text</p>
```

**Fix with CSS:**
```css
p {
  font-size: clamp(14px, 4vw, 16px);
}
```

### Issue: Layout Breaks on Tablet

**Use Tailwind Breakpoints:**
```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  {/* Content */}
</div>
```

### Issue: Buttons Too Close Together on Mobile

**Fix:**
```jsx
<div className="flex flex-col sm:flex-row gap-4">
  <button>Button 1</button>
  <button>Button 2</button>
</div>
```

---

## Integrating with CI/CD

### GitHub Actions Example

Create `.github/workflows/responsive-tests.yml`:

```yaml
name: Responsive Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: |
          npm install
          pip install playwright
          playwright install

      - name: Build Next.js app
        run: npm run build

      - name: Start Next.js server
        run: npm start &

      - name: Wait for server
        run: npx wait-on http://localhost:3000

      - name: Run responsive tests
        run: python .claude/skills/responsive-testing-automation/scripts/test_all_pages.py

      - name: Generate report
        if: always()
        run: python .claude/skills/responsive-testing-automation/scripts/generate_report.py ./responsive-test-results

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: responsive-test-results
          path: responsive-test-results/
```

---

## Customizing Device Presets

Edit `scripts/device_presets.json` to add custom devices:

```json
{
  "devices": [
    {
      "name": "Custom Mobile",
      "category": "mobile",
      "width": 400,
      "height": 800,
      "devicePixelRatio": 2,
      "isMobile": true,
      "hasTouch": true
    }
  ]
}
```

---

## Best Practices

### 1. Test Early and Often
- Run tests after each responsive design change
- Don't wait until the end of development

### 2. Fix High Severity Issues First
- Horizontal overflow breaks user experience
- Overlapping elements prevent interaction

### 3. Test Real Devices When Possible
- Automated tests catch most issues
- Physical device testing catches edge cases

### 4. Use Mobile-First Design
- Start with mobile layout
- Progressively enhance for larger screens
- Easier to scale up than down

### 5. Review Screenshots Manually
- Automation catches technical issues
- Manual review catches visual/UX issues

---

## Troubleshooting

### "Playwright not installed"
```bash
pip install playwright
playwright install
```

### "No pages found"
- Ensure you're in the correct directory
- Check that `app/` directory exists
- Verify pages have `page.tsx` or `page.js`

### "Cannot reach URL"
- Make sure dev server is running (`npm run dev`)
- Check if port 3000 is in use
- Try `--url http://localhost:PORT` with correct port

### Tests timing out
- Increase timeout in script (default 30s)
- Check for slow network requests
- Disable animations during testing

### False positives for horizontal scroll
- Some elements intentionally overflow (carousels)
- Adjust tolerance in `check_layout_issues()` function
- Add exceptions for specific components
