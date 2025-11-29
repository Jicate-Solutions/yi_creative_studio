#!/usr/bin/env python3
"""
Responsive Testing Automation Script
Automatically tests all pages across multiple device views
"""

import os
import json
import subprocess
import sys
from pathlib import Path
from datetime import datetime

# Check for required dependencies
try:
    from playwright.sync_api import sync_playwright
except ImportError:
    print("ERROR: Playwright is not installed.")
    print("Install it with: pip install playwright && playwright install")
    sys.exit(1)


def load_device_presets():
    """Load device configurations from device_presets.json"""
    script_dir = Path(__file__).parent
    presets_file = script_dir / "device_presets.json"

    with open(presets_file, 'r') as f:
        data = json.load(f)

    return data['devices']


def discover_pages(app_dir):
    """
    Discover all pages in a Next.js app directory structure
    Returns list of route paths
    """
    app_path = Path(app_dir) / "app"
    pages = []

    if not app_path.exists():
        print(f"ERROR: App directory not found at {app_path}")
        return pages

    # Walk through app directory
    for root, dirs, files in os.walk(app_path):
        # Skip special Next.js directories
        dirs[:] = [d for d in dirs if not d.startswith('_') and not d.startswith('.')]

        # Check for page.tsx or page.js
        if 'page.tsx' in files or 'page.js' in files:
            # Convert file path to route
            rel_path = Path(root).relative_to(app_path)

            # Skip dynamic routes with [...slug] or [id] for now
            if '[' in str(rel_path):
                continue

            # Convert to URL path
            if str(rel_path) == '.':
                route = '/'
            else:
                route = '/' + str(rel_path).replace('\\', '/')

            pages.append(route)

    return sorted(pages)


def check_layout_issues(page, device_name):
    """
    Check for common layout issues on the page
    Returns list of issues found
    """
    issues = []

    try:
        # Check for horizontal scroll (overflow)
        has_horizontal_scroll = page.evaluate("""
            () => {
                return document.documentElement.scrollWidth > window.innerWidth;
            }
        """)

        if has_horizontal_scroll:
            issues.append({
                'type': 'horizontal_overflow',
                'message': 'Page has horizontal scroll (content wider than viewport)',
                'severity': 'high'
            })

        # Check for elements outside viewport
        elements_outside = page.evaluate("""
            () => {
                const elements = document.querySelectorAll('*');
                const viewportWidth = window.innerWidth;
                const issues = [];

                elements.forEach(el => {
                    const rect = el.getBoundingClientRect();
                    if (rect.right > viewportWidth + 5) { // 5px tolerance
                        const tagInfo = el.tagName.toLowerCase() +
                            (el.id ? '#' + el.id : '') +
                            (el.className ? '.' + el.className.split(' ')[0] : '');
                        issues.push(tagInfo);
                    }
                });

                return issues.slice(0, 5); // Return first 5
            }
        """)

        if elements_outside and len(elements_outside) > 0:
            issues.append({
                'type': 'elements_outside_viewport',
                'message': f'Elements extending beyond viewport: {", ".join(elements_outside[:3])}{"..." if len(elements_outside) > 3 else ""}',
                'severity': 'high'
            })

        # Check for tiny text (below 12px on mobile)
        if device_name in ['mobile', 'tablet']:
            tiny_text = page.evaluate("""
                () => {
                    const elements = document.querySelectorAll('p, span, div, a, button, label');
                    const tinyText = [];

                    elements.forEach(el => {
                        const style = window.getComputedStyle(el);
                        const fontSize = parseFloat(style.fontSize);
                        if (fontSize < 12 && el.textContent.trim().length > 0) {
                            tinyText.push(fontSize.toFixed(1) + 'px');
                        }
                    });

                    return tinyText.slice(0, 3);
                }
            """)

            if tiny_text and len(tiny_text) > 0:
                issues.append({
                    'type': 'tiny_text',
                    'message': f'Text smaller than 12px found: {", ".join(tiny_text)}',
                    'severity': 'medium'
                })

        # Check for overlapping elements
        overlapping = page.evaluate("""
            () => {
                const elements = Array.from(document.querySelectorAll('button, a, input'));
                const overlaps = [];

                for (let i = 0; i < elements.length; i++) {
                    const rect1 = elements[i].getBoundingClientRect();
                    for (let j = i + 1; j < elements.length; j++) {
                        const rect2 = elements[j].getBoundingClientRect();

                        // Check overlap
                        if (!(rect1.right < rect2.left ||
                              rect1.left > rect2.right ||
                              rect1.bottom < rect2.top ||
                              rect1.top > rect2.bottom)) {
                            overlaps.push(true);
                            break;
                        }
                    }
                    if (overlaps.length > 0) break;
                }

                return overlaps.length > 0;
            }
        """)

        if overlapping:
            issues.append({
                'type': 'overlapping_elements',
                'message': 'Interactive elements are overlapping',
                'severity': 'high'
            })

    except Exception as e:
        issues.append({
            'type': 'error',
            'message': f'Error checking layout: {str(e)}',
            'severity': 'low'
        })

    return issues


def test_pages(base_url, pages, devices, output_dir):
    """
    Test all pages across all devices
    """
    results = {
        'timestamp': datetime.now().isoformat(),
        'base_url': base_url,
        'total_pages': len(pages),
        'total_devices': len(devices),
        'total_tests': len(pages) * len(devices),
        'pages': {}
    }

    output_path = Path(output_dir)
    screenshots_dir = output_path / "screenshots"
    screenshots_dir.mkdir(parents=True, exist_ok=True)

    print(f"\n{'='*60}")
    print(f"Starting Responsive Testing")
    print(f"{'='*60}")
    print(f"Base URL: {base_url}")
    print(f"Pages to test: {len(pages)}")
    print(f"Device configurations: {len(devices)}")
    print(f"Total tests: {len(pages) * len(devices)}\n")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)

        for page_route in pages:
            print(f"\nTesting: {page_route}")
            results['pages'][page_route] = {}

            for device in devices:
                device_name = device['name']
                category = device['category']

                print(f"  [{category.upper()}] {device_name} ({device['width']}x{device['height']})", end="")

                # Create context with device viewport
                context = browser.new_context(
                    viewport={'width': device['width'], 'height': device['height']},
                    device_scale_factor=device['devicePixelRatio'],
                    is_mobile=device['isMobile'],
                    has_touch=device['hasTouch']
                )

                page = context.new_page()

                try:
                    # Navigate to page
                    url = base_url + page_route
                    response = page.goto(url, wait_until='networkidle', timeout=30000)

                    if not response or response.status != 200:
                        print(f" - FAILED (Status: {response.status if response else 'No response'})")
                        results['pages'][page_route][device_name] = {
                            'status': 'failed',
                            'error': f'HTTP {response.status if response else "No response"}'
                        }
                        context.close()
                        continue

                    # Wait for page to be fully loaded
                    page.wait_for_load_state('domcontentloaded')
                    page.wait_for_timeout(1000)  # Additional wait for animations

                    # Check for layout issues
                    issues = check_layout_issues(page, category)

                    # Take screenshot
                    screenshot_filename = f"{page_route.replace('/', '_').strip('_') or 'home'}_{device['width']}x{device['height']}.png"
                    screenshot_path = screenshots_dir / screenshot_filename
                    page.screenshot(path=str(screenshot_path), full_page=True)

                    # Store results
                    results['pages'][page_route][device_name] = {
                        'status': 'passed' if len(issues) == 0 else 'issues_found',
                        'device_category': category,
                        'viewport': f"{device['width']}x{device['height']}",
                        'issues': issues,
                        'screenshot': str(screenshot_path.relative_to(output_path))
                    }

                    if issues:
                        print(f" - ISSUES ({len(issues)})")
                        for issue in issues:
                            print(f"      {issue['severity'].upper()}: {issue['message']}")
                    else:
                        print(" - OK")

                except Exception as e:
                    print(f" - ERROR: {str(e)}")
                    results['pages'][page_route][device_name] = {
                        'status': 'error',
                        'error': str(e)
                    }

                finally:
                    context.close()

        browser.close()

    # Save results to JSON
    results_file = output_path / "test_results.json"
    with open(results_file, 'w') as f:
        json.dump(results, indent=2, fp=f)

    print(f"\n{'='*60}")
    print(f"Testing Complete!")
    print(f"Results saved to: {results_file}")
    print(f"Screenshots saved to: {screenshots_dir}")
    print(f"{'='*60}\n")

    return results


def main():
    """Main entry point"""
    import argparse

    parser = argparse.ArgumentParser(description='Test all pages across multiple device views')
    parser.add_argument('--app-dir', default='.', help='Path to Next.js app directory (default: current directory)')
    parser.add_argument('--url', default='http://localhost:3000', help='Base URL for testing (default: http://localhost:3000)')
    parser.add_argument('--output', default='./responsive-test-results', help='Output directory for results')
    parser.add_argument('--devices', nargs='*', help='Specific device names to test (default: all)')
    parser.add_argument('--categories', nargs='*', choices=['mobile', 'tablet', 'desktop'], help='Device categories to test')

    args = parser.parse_args()

    # Load devices
    all_devices = load_device_presets()

    # Filter devices if specified
    if args.devices:
        devices = [d for d in all_devices if d['name'] in args.devices]
    elif args.categories:
        devices = [d for d in all_devices if d['category'] in args.categories]
    else:
        devices = all_devices

    if not devices:
        print("ERROR: No devices selected for testing")
        sys.exit(1)

    # Discover pages
    print("Discovering pages...")
    pages = discover_pages(args.app_dir)

    if not pages:
        print("ERROR: No pages found in app directory")
        sys.exit(1)

    print(f"Found {len(pages)} pages")

    # Check if dev server is running
    try:
        import urllib.request
        urllib.request.urlopen(args.url, timeout=2)
    except Exception:
        print(f"\nWARNING: Cannot reach {args.url}")
        print("Make sure your development server is running (npm run dev)")
        response = input("Continue anyway? (y/N): ")
        if response.lower() != 'y':
            sys.exit(1)

    # Run tests
    results = test_pages(args.url, pages, devices, args.output)

    # Summary
    total_issues = sum(
        len(device_result.get('issues', []))
        for page_results in results['pages'].values()
        for device_result in page_results.values()
    )

    print(f"\nSummary:")
    print(f"  Total tests: {results['total_tests']}")
    print(f"  Issues found: {total_issues}")

    if total_issues > 0:
        print(f"\nRun 'python scripts/generate_report.py {args.output}' to view detailed report")


if __name__ == '__main__':
    main()
