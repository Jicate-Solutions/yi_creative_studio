# Installation Guide

## Prerequisites

- Python 3.8 or higher
- Node.js and npm (for your Next.js app)
- Running Next.js development server

## Step-by-Step Installation

### 1. Install Python (if not already installed)

**Windows:**
- Download from [python.org](https://www.python.org/downloads/)
- During installation, check "Add Python to PATH"

**macOS:**
```bash
brew install python3
```

**Linux:**
```bash
sudo apt update
sudo apt install python3 python3-pip
```

### 2. Verify Python Installation

```bash
python --version
# Should show Python 3.8 or higher
```

### 3. Install Playwright

Navigate to your project root and run:

```bash
pip install playwright
```

This installs the Playwright Python library.

### 4. Install Browser Binaries

Playwright needs to download browser binaries:

```bash
playwright install
```

This downloads Chromium, Firefox, and WebKit. Takes ~1-2 minutes.

**Note for Windows users:** If you get a permission error, run Command Prompt as Administrator.

### 5. Verify Installation

Test that Playwright is installed correctly:

```bash
python -c "from playwright.sync_api import sync_playwright; print('Playwright installed successfully!')"
```

Should output: `Playwright installed successfully!`

## Troubleshooting

### Issue: "pip: command not found"

**Solution:**
```bash
# Try pip3 instead
pip3 install playwright

# Or use python -m pip
python -m pip install playwright
```

### Issue: "playwright: command not found" after installing

**Solution:**
```bash
# Use python -m playwright instead
python -m playwright install
```

### Issue: Permission denied (Windows)

**Solution:**
- Run Command Prompt or PowerShell as Administrator
- Or install for user only:
```bash
pip install --user playwright
python -m playwright install
```

### Issue: Permission denied (macOS/Linux)

**Solution:**
```bash
# Don't use sudo with pip, use --user instead
pip install --user playwright
python -m playwright install
```

### Issue: SSL Certificate Error

**Solution:**
```bash
pip install --trusted-host pypi.org --trusted-host files.pythonhosted.org playwright
```

### Issue: Slow download of browser binaries

**Reason:** Chromium is ~300MB, this is normal.

**Solution:** Wait for download to complete, or use:
```bash
# Download only Chromium (smaller)
playwright install chromium
```

## Disk Space Requirements

- Playwright library: ~5 MB
- Browser binaries: ~300 MB (Chromium)
- Total: ~305 MB

## Optional: Virtual Environment

For a clean installation isolated from system Python:

### Create Virtual Environment

```bash
# Navigate to project root
cd /path/to/your/project

# Create virtual environment
python -m venv venv
```

### Activate Virtual Environment

**Windows:**
```bash
venv\Scripts\activate
```

**macOS/Linux:**
```bash
source venv/bin/activate
```

### Install in Virtual Environment

```bash
pip install playwright
playwright install
```

### Deactivate When Done

```bash
deactivate
```

## Verification Checklist

- [ ] Python 3.8+ installed
- [ ] pip working
- [ ] Playwright library installed
- [ ] Browser binaries installed
- [ ] Test import works
- [ ] Next.js dev server can run

## Next Steps

After successful installation:

1. **Start your dev server:**
   ```bash
   npm run dev
   ```

2. **Run your first test:**
   ```bash
   python .claude/skills/responsive-testing-automation/scripts/test_all_pages.py
   ```

3. **Generate report:**
   ```bash
   python .claude/skills/responsive-testing-automation/scripts/generate_report.py ./responsive-test-results
   ```

4. **Open report:**
   ```bash
   start responsive-test-results/report.html  # Windows
   open responsive-test-results/report.html   # macOS
   xdg-open responsive-test-results/report.html  # Linux
   ```

## Uninstallation

If you need to remove Playwright:

```bash
# Uninstall library
pip uninstall playwright

# Browser binaries are stored in:
# Windows: %USERPROFILE%\AppData\Local\ms-playwright
# macOS: ~/Library/Caches/ms-playwright
# Linux: ~/.cache/ms-playwright

# Delete manually if needed
```

## Support

If you encounter issues:

1. Check Python version: `python --version`
2. Check pip version: `pip --version`
3. Try updating pip: `pip install --upgrade pip`
4. Check Playwright docs: https://playwright.dev/python/docs/intro
5. Report issues with full error message

## System Requirements

**Minimum:**
- CPU: Dual-core
- RAM: 2 GB
- Disk: 500 MB free space
- OS: Windows 10+, macOS 10.15+, Ubuntu 20.04+

**Recommended:**
- CPU: Quad-core
- RAM: 4 GB
- Disk: 1 GB free space
- Fast internet for initial download
