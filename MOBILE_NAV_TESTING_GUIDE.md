# Mobile Bottom Navbar - Testing Guide

## Pre-Testing Setup

1. **Start Development Server:**
```bash
npm run dev
```

2. **Open Browser DevTools:**
- Chrome: F12 or Cmd+Option+I (Mac)
- Toggle Device Toolbar: Ctrl+Shift+M (Windows) or Cmd+Shift+M (Mac)

3. **Set Mobile Viewport:**
- iPhone 14 Pro Max (430×932)
- Samsung Galaxy S22 (360×800)
- iPad Mini (768×1024) - should NOT show navbar

## Test Scenarios

### Test 1: Visual Appearance (Mobile)

**Device:** iPhone 14 Pro Max (430×932)

**Steps:**
1. Navigate to `/dashboard`
2. Scroll to bottom of page
3. Observe bottom navbar

**Expected Results:**
- ✅ Navbar fixed at screen bottom
- ✅ 4 visible items: Dashboard, Create, Gallery, Templates
- ✅ "More" button with badge showing count (1 for regular user, 6+ for admin)
- ✅ Dashboard item has blue top indicator bar
- ✅ No overlap with content
- ✅ Navbar respects iOS safe area (no overlap with home indicator)

**Screenshot:** Take screenshot for reference

---

### Test 2: Navigation (Primary Items)

**Steps:**
1. From `/dashboard`, tap "Create" in navbar
2. Verify navigation to `/create`
3. Tap "Gallery" → verify `/gallery`
4. Tap "Templates" → verify `/templates`
5. Tap "Dashboard" → verify back to `/dashboard`

**Expected Results:**
- ✅ Each tap navigates immediately
- ✅ Active indicator moves to tapped item
- ✅ No page reload (Next.js navigation)
- ✅ URL updates correctly

---

### Test 3: More Menu (Regular User)

**User Type:** Regular User (not admin)

**Steps:**
1. Navigate to `/dashboard`
2. Tap "More" button in navbar
3. Observe More menu sheet

**Expected Results:**
- ✅ Sheet slides up from bottom
- ✅ Backdrop appears (dimmed background)
- ✅ Badge shows "1" (Bulk Generate only)
- ✅ "Bulk Generate" item visible
- ✅ No Settings section (admin only)
- ✅ No Administration section (super admin only)

**Actions:**
4. Tap "Bulk Generate"
5. Verify navigation to `/bulk`
6. Verify More menu closes

---

### Test 4: More Menu (Admin User)

**User Type:** Admin

**Steps:**
1. Navigate to `/dashboard`
2. Tap "More" button
3. Observe More menu

**Expected Results:**
- ✅ Badge shows "6" or more
- ✅ "Bulk Generate" visible
- ✅ "Settings" accordion group visible and expanded
- ✅ Settings shows 3-column icon grid:
  - Row 1: Brand Config, Logo Management, Team
  - Row 2: Billing, Analytics
- ✅ No "Administration" section (super admin only)

**Actions:**
4. Tap "Brand Config" → Navigate to `/settings/brand` ✅
5. Open More menu again
6. Tap "Logo Management" → Navigate to `/settings/logos` ✅
7. Repeat for Team, Billing

---

### Test 5: Analytics Submenu (Admin)

**User Type:** Admin

**Steps:**
1. Navigate to `/dashboard`
2. Tap "More" button
3. Scroll to Settings section
4. Tap "Analytics" item

**Expected Results:**
- ✅ Submenu dropdown appears ABOVE navbar
- ✅ Backdrop appears behind submenu
- ✅ 3 submenu items visible:
  - Cost Analysis
  - Feedback
  - Learning
- ✅ Each item has arrow (▶) indicator
- ✅ More menu stays open in background

**Actions:**
5. Tap "Cost Analysis"
6. Verify navigation to `/settings/analytics/costs`
7. Verify both More menu and submenu close
8. Repeat for Feedback and Learning items

---

### Test 6: More Menu (Super Admin)

**User Type:** Super Admin

**Steps:**
1. Log in as super admin user
2. Navigate to `/dashboard`
3. Tap "More" button

**Expected Results:**
- ✅ Badge shows "7" or more
- ✅ "Bulk Generate" visible
- ✅ "Settings" section visible (same as admin)
- ✅ "Administration" accordion group visible
- ✅ "Admin Credits" item visible in Administration

**Actions:**
4. Tap "Admin Credits"
5. Verify navigation to `/settings/admin/credits`
6. Verify More menu closes

---

### Test 7: More Menu Interactions

**Steps:**
1. Open More menu
2. Test closing methods:
   a. Tap backdrop (dimmed area)
   b. Reopen, swipe down on sheet
   c. Reopen, tap [×] close button
   d. Reopen, tap ESC key

**Expected Results:**
- ✅ All 4 methods close the More menu
- ✅ Smooth slide-down animation
- ✅ Backdrop fades out
- ✅ Navbar remains visible after close

---

### Test 8: Accordion Behavior

**User Type:** Admin

**Steps:**
1. Open More menu
2. Observe Settings accordion
3. Tap Settings header (not an item)

**Expected Results:**
- ✅ Settings group is expanded by default
- ✅ Tapping header collapses the group
- ✅ Icon grid slides up smoothly
- ✅ Tapping again expands the group
- ✅ Badge count doesn't change

**Note:** Test with Administration group for super admin

---

### Test 9: Create Mode Behavior

**Steps:**
1. Navigate to `/create`
2. Observe bottom navbar

**Expected Results:**
- ✅ Bottom navbar is HIDDEN
- ✅ Create page has own navigation/footer
- ✅ No overlap or spacing issues

**Actions:**
3. Navigate back to `/dashboard`
4. Verify navbar reappears

---

### Test 10: State Persistence

**Steps:**
1. Navigate to `/gallery`
2. Observe Gallery item is active (blue indicator)
3. Refresh page (F5 or Cmd+R)
4. Observe navbar after reload

**Expected Results:**
- ✅ Gallery item STILL active after refresh
- ✅ No flash of incorrect state
- ✅ No console errors
- ✅ Navbar appears immediately (no delay)

**Advanced:**
5. Open More menu
6. Expand/collapse Settings group
7. Navigate to another page
8. Return and open More menu
9. Verify Settings group state persisted

---

### Test 11: Desktop Behavior

**Device:** Desktop (≥1024px)

**Steps:**
1. Resize browser to desktop size (1920×1080)
2. Navigate to `/dashboard`
3. Scroll page

**Expected Results:**
- ✅ Bottom navbar is HIDDEN on desktop
- ✅ Desktop sidebar is visible on left
- ✅ No spacing issues or layout shifts
- ✅ No console errors

---

### Test 12: Responsive Breakpoints

**Steps:**
1. Start at mobile (390px width)
2. Verify navbar visible
3. Slowly increase width to 768px (tablet)
4. Continue to 1024px (desktop)

**Expected Results:**
- ✅ Navbar visible: 390px - 1023px
- ✅ Navbar hidden: 1024px+
- ✅ Smooth transition at breakpoint
- ✅ No layout jumps or flashes

---

### Test 13: Active Page Detection

**Steps:**
1. Navigate to `/settings/brand` (admin)
2. Observe navbar

**Expected Results:**
- ✅ "More" button has active indicator (page in More menu)
- ✅ Badge still shows correct count

**Actions:**
3. Open More menu
4. Settings section auto-expanded
5. "Brand Config" item highlighted/active

**Repeat for:**
- `/settings/analytics/costs` (submenu item)
- `/bulk` (More menu item)
- `/dashboard` (primary item)

---

### Test 14: Performance & Animations

**Steps:**
1. Open More menu 5 times rapidly
2. Navigate between pages quickly
3. Open/close submenu repeatedly

**Expected Results:**
- ✅ Smooth 60fps animations
- ✅ No lag or stuttering
- ✅ No memory leaks (check DevTools Memory)
- ✅ No unnecessary re-renders (React DevTools)

**Tools:**
- Chrome DevTools Performance tab
- React DevTools Profiler

---

### Test 15: Edge Cases

**Test 15a: Long Organization Names**
1. Create org with 50-character name
2. Verify navbar still renders correctly
3. Check for text overflow

**Test 15b: Rapid Navigation**
1. Tap items rapidly (5+ taps/second)
2. Verify no errors or stuck states

**Test 15c: Network Offline**
1. Go offline (DevTools → Network → Offline)
2. Tap navbar items
3. Verify navigation still works (Next.js cache)

**Test 15d: Browser Back Button**
1. Navigate: Dashboard → Gallery → Templates
2. Press browser back button twice
3. Verify navbar active indicator follows history

---

### Test 16: Accessibility (Optional)

**Steps:**
1. Enable screen reader (VoiceOver on Mac, NVDA on Windows)
2. Navigate navbar with Tab key
3. Activate items with Enter/Space

**Expected Results:**
- ✅ All items keyboard accessible
- ✅ Focus indicators visible
- ✅ Screen reader announces labels
- ✅ ARIA labels present

---

### Test 17: iOS Device Testing (Critical)

**Device:** Real iPhone or iPad

**Steps:**
1. Open app on iPhone Safari
2. Navigate to `/dashboard`
3. Scroll to very bottom
4. Observe navbar positioning

**Expected Results:**
- ✅ Navbar doesn't overlap with home indicator
- ✅ Safe area insets working (`env(safe-area-inset-bottom)`)
- ✅ Tappable area clear of gesture zones
- ✅ No clipping at screen edges

**Screenshot:** Take photo of physical device

---

### Test 18: Android Device Testing (Critical)

**Device:** Real Android phone

**Steps:**
1. Open app on Chrome mobile
2. Navigate to `/dashboard`
3. Test navbar interactions

**Expected Results:**
- ✅ Navbar positioned correctly
- ✅ No overlap with system navigation bar
- ✅ Touch targets adequate (48px minimum)
- ✅ Smooth animations on device

---

## Test Results Template

Copy and fill out after testing:

```markdown
## Test Results

**Date:** YYYY-MM-DD
**Tester:** [Your Name]
**Browser:** Chrome/Safari/Firefox
**Devices Tested:** iPhone 14 Pro, Samsung S22, Desktop

### Summary
- Total Tests: 18
- Passed: __
- Failed: __
- Skipped: __

### Failed Tests
1. [Test Number]: [Issue Description]
   - Expected: ...
   - Actual: ...
   - Screenshot: [link]

### Issues Found
1. [Issue]: [Description]
   - Severity: Critical/High/Medium/Low
   - Steps to Reproduce: ...
   - Suggested Fix: ...

### Performance Metrics
- Initial Load: __ ms
- Navigation Speed: __ ms
- Animation FPS: __ fps
- Memory Usage: __ MB

### Screenshots
- Mobile View: [link]
- More Menu: [link]
- Settings Grid: [link]
- Analytics Submenu: [link]
- iOS Device: [photo]

### Overall Assessment
[Pass/Fail/Needs Fixes]

### Notes
[Any additional observations]
```

## Bug Report Template

If you find bugs, use this template:

```markdown
## Bug Report

**Title:** [Brief description]

**Environment:**
- Browser: Chrome 120
- Device: iPhone 14 Pro
- OS: iOS 17.2
- Viewport: 430×932

**Steps to Reproduce:**
1. Navigate to `/dashboard`
2. Tap "More" button
3. ...

**Expected Behavior:**
[What should happen]

**Actual Behavior:**
[What actually happened]

**Screenshot/Video:**
[Attach here]

**Console Errors:**
```
[Paste errors]
```

**Additional Context:**
[Any other relevant info]

**Severity:**
- [ ] Critical (blocks usage)
- [ ] High (major feature broken)
- [ ] Medium (minor issue)
- [ ] Low (cosmetic)
```

## Post-Testing Actions

After completing all tests:

1. **Document Results:**
   - Fill out test results template
   - Take all screenshots
   - Record any bugs found

2. **Fix Critical Issues:**
   - Address any critical/high severity bugs
   - Re-run affected tests

3. **Update Documentation:**
   - Note any unexpected behaviors
   - Update quick reference if needed

4. **Performance Baseline:**
   - Record metrics for future comparison
   - Check bundle size impact

5. **User Acceptance:**
   - Demo to stakeholders
   - Collect initial feedback
   - Plan iterations if needed

## Success Criteria

Implementation is ready for production when:

- ✅ All 18 tests pass
- ✅ No critical or high severity bugs
- ✅ Performance metrics acceptable (< 100ms navigation)
- ✅ Works on real iOS and Android devices
- ✅ Matches design specifications
- ✅ Zero console errors or warnings
- ✅ State persists correctly across sessions
- ✅ Role-based filtering works for all user types

## Tools & Resources

**Browser DevTools:**
- Network tab: Monitor requests
- Performance tab: Check FPS
- Memory tab: Check for leaks
- React DevTools: Profile re-renders

**Mobile Testing:**
- BrowserStack: Test on real devices remotely
- Chrome Remote Debugging: Debug on Android
- Safari Web Inspector: Debug on iOS

**Accessibility:**
- Lighthouse: Accessibility audit
- axe DevTools: A11y violations
- Screen readers: NVDA, VoiceOver

**Performance:**
- Lighthouse: Performance score
- WebPageTest: Detailed metrics
- Chrome UX Report: Field data

## Quick Test (5 minutes)

If time is limited, run this abbreviated test:

1. ✅ Open on mobile (< 1024px) - navbar shows
2. ✅ Navigate to each primary item (4 items)
3. ✅ Open More menu - items load correctly
4. ✅ Tap item in More menu - navigates
5. ✅ Refresh page - state persists
6. ✅ Resize to desktop - navbar hides
7. ✅ Navigate to `/create` - navbar hides
8. ✅ Check console - no errors

If all pass, implementation is likely working correctly!
