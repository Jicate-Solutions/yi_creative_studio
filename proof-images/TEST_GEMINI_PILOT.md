# How to Test the Gemini Pilot (Fix #9) — Manual Steps

**Goal:** Compare Claude vs Gemini 3 Flash Preview as the prompt-enhancement model.
**Expected difference:** Less paraphrase drift, tighter integration with the image model, potentially more on-brief output.

---

## Current Dev Server Status

You have 4 dev servers running (PowerShell shows ports 3000, 3001, 3002, 3003). All share the same source code (my edits), but only the one started LAST will have picked up the new `PROMPT_PROVIDER` env var.

**Recommendation: kill all 4, restart fresh on port 3000.**

### Step 1 — Kill all stale dev servers
```powershell
# In PowerShell, kill node processes on dev ports
Get-NetTCPConnection -State Listen -LocalPort 3000,3001,3002,3003 -ErrorAction SilentlyContinue |
  ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
```

### Step 2 — Verify they're all dead
```powershell
Get-NetTCPConnection -State Listen -LocalPort 3000,3001,3002,3003 -ErrorAction SilentlyContinue
# Should print nothing.
```

---

## Test A: Baseline with Claude (default)

### Step 3 — Open `.env.local` and confirm Claude default
Look for the block I added:
```
# v50.0 (Fix #9) — Prompt enhancement pipeline provider
# PROMPT_PROVIDER=claude
# GEMINI_PROMPT_MODEL=gemini-3-flash-preview
```
Both lines should still be **commented out** (default = Claude). If they aren't, comment them.

### Step 4 — Start dev server
```powershell
cd C:\Users\Admin\Documents\GitHub\yicreatives-studio
npm run dev
```
Should bind to **port 3000** now (since you killed the stale ones).

### Step 5 — Generate 5 baseline posters (CLAUDE)
1. Open **http://localhost:3000/create**
2. Verify model selector shows **"Nano Banana Pro Preview"** auto-selected (Fix #10 working)
3. Generate 5 posters using the briefs from `TEST_PROTOCOL.md`
4. Save each as: `proof-images/claude-baseline/01-womens-leadership.png` through `05-cultural-fest.png`

**Watch the dev server console** — for each generation you should see:
```
[Generate] v50.0 Prompt provider: claude (env PROMPT_PROVIDER=unset)
[Ultra-Pro Prompt] Calling Claude Haiku 4.5 (temp: 1.2)...
```

---

## Test B: Pilot with Gemini 3 Flash Preview

### Step 6 — Enable the Gemini pilot
Edit `.env.local` — change:
```
# PROMPT_PROVIDER=claude
```
to:
```
PROMPT_PROVIDER=gemini
```
(Remove the `#`. Keep `GEMINI_PROMPT_MODEL` commented out unless you want to override the default `gemini-3-flash-preview`.)

### Step 7 — Restart dev server
```powershell
# In the terminal running npm run dev, press Ctrl+C
# Then:
npm run dev
```

### Step 8 — Generate 5 posters with the SAME briefs (GEMINI)
1. **Use the same 5 briefs from TEST_PROTOCOL.md** — same wording, same fields.
2. Save each as: `proof-images/gemini-pilot/01-womens-leadership.png` through `05-cultural-fest.png`

**Watch the dev server console** — for each generation you should now see:
```
[Generate] v50.0 Prompt provider: gemini (env PROMPT_PROVIDER=gemini)
[Ultra-Pro Prompt] Calling Gemini (gemini-3-flash-preview, temp: 1.2)...
```

If you see `Calling Claude Haiku 4.5` instead, the env var didn't take effect — kill the server, double-check `.env.local`, and restart.

---

## Test C: Side-by-Side Comparison

### Step 9 — Open both folders
```powershell
explorer proof-images\claude-baseline
explorer proof-images\gemini-pilot
```

### Step 10 — Compare each pair against the rubric

For each brief (1-5), open the Claude version and Gemini version side-by-side and score:

| Indicator | Claude version | Gemini version | Winner |
|---|---|---|---|
| User wording preserved (e.g. "Voices that shape tomorrow") | | | |
| On-brief imagery (matches mood + style preference) | | | |
| Creative composition (unexpected, striking) | | | |
| Text rendering quality | | | |
| Brand colors / logo positions | | | |
| Overall "closer to AI Studio quality" | | | |

### Step 11 — Verdict
- **If Gemini wins 4/5 or 5/5 briefs** → recommend switching default to `PROMPT_PROVIDER=gemini` in production
- **If split 2/3 vs 3/2** → keep Claude default, but Gemini stays available via env flag
- **If Claude wins 4/5 or 5/5** → revert Fix #9 entirely (keep callGemini upgraded but flip the default; or just keep current Claude default)

---

## Quick Reference

| Goal | Action |
|---|---|
| Use Claude (default) | Both env lines commented in `.env.local` |
| Use Gemini 3 Flash Preview | `PROMPT_PROVIDER=gemini` |
| Use Gemini 3.5 Flash (more capable, costlier) | `PROMPT_PROVIDER=gemini` + `GEMINI_PROMPT_MODEL=gemini-3.5-flash` |
| Use Gemini 3.1 Pro Preview (premium) | `PROMPT_PROVIDER=gemini` + `GEMINI_PROMPT_MODEL=gemini-3.1-pro-preview` |
| Restart needed | YES every time you change .env.local |

---

## What to Show MD Sir

When complete:
- 10 PNG files (5 Claude baseline + 5 Gemini pilot)
- Filled-in rubric scoring table
- Verdict + cost comparison (Gemini 3 Flash Preview is ~50% cheaper than Claude Haiku per generation)

That's the proof your MD sir wanted.
