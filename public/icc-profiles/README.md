# ICC Profiles for Color Management

This directory contains ICC color profiles for export color space conversion.

## Required Files

Place the following ICC profile files in this directory:

| File | Profile | Use Case |
|------|---------|----------|
| `sRGB.icc` | sRGB IEC61966-2.1 | Web/digital displays |
| `FOGRA39.icc` | FOGRA39 (ISO Coated v2) | Europe/India printing |
| `SWOP.icc` | US Web Coated (SWOP) v2 | North America printing |
| `JapanColor.icc` | Japan Color 2001 Coated | Japan/Asia printing |

## Where to Get ICC Profiles

### Option 1: Adobe ICC Profiles (Free)
Download from Adobe's Color Management Resources:
https://www.adobe.com/support/downloads/iccprofiles/iccprofiles_win.html

### Option 2: ICC Profile Downloads
- sRGB: https://www.color.org/srgbprofiles.xalter
- FOGRA profiles: https://www.fogra.org/en/fogra-standardization/icc-profiles
- SWOP profiles: Part of Adobe color profiles

### Option 3: Operating System Profiles
- Windows: `C:\Windows\System32\spool\drivers\color\`
- macOS: `/Library/ColorSync/Profiles/`

## Installation

1. Download the required ICC profiles
2. Rename them to match the expected filenames above
3. Place them in this directory (`public/icc-profiles/`)
4. Restart the application

## Notes

- ICC profiles are copyrighted and cannot be redistributed
- The export system will gracefully fall back if profiles are not available
- For production use, ensure you have the appropriate licenses for any ICC profiles used
