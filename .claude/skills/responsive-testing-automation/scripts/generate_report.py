#!/usr/bin/env python3
"""
Generate HTML Report from Responsive Testing Results
"""

import json
import sys
from pathlib import Path
from datetime import datetime


HTML_TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Responsive Testing Report</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f5f5f5;
            color: #333;
            line-height: 1.6;
        }

        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 2rem;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }

        .header h1 {
            font-size: 2rem;
            margin-bottom: 0.5rem;
        }

        .header .meta {
            opacity: 0.9;
            font-size: 0.9rem;
        }

        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 2rem;
        }

        .summary {
            background: white;
            padding: 2rem;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            margin-bottom: 2rem;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1.5rem;
        }

        .summary-item {
            text-align: center;
        }

        .summary-item .label {
            font-size: 0.85rem;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 0.5rem;
        }

        .summary-item .value {
            font-size: 2.5rem;
            font-weight: bold;
            color: #667eea;
        }

        .summary-item.issues .value {
            color: #e74c3c;
        }

        .page-section {
            background: white;
            padding: 2rem;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            margin-bottom: 2rem;
        }

        .page-title {
            font-size: 1.5rem;
            margin-bottom: 1.5rem;
            padding-bottom: 0.75rem;
            border-bottom: 2px solid #667eea;
            color: #333;
        }

        .device-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 1.5rem;
        }

        .device-card {
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            overflow: hidden;
            transition: transform 0.2s, box-shadow 0.2s;
        }

        .device-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }

        .device-card.has-issues {
            border-color: #e74c3c;
        }

        .device-card.error {
            border-color: #f39c12;
        }

        .device-header {
            padding: 1rem;
            background: #f8f9fa;
            border-bottom: 1px solid #e0e0e0;
        }

        .device-name {
            font-weight: 600;
            font-size: 1rem;
            margin-bottom: 0.25rem;
        }

        .device-info {
            font-size: 0.85rem;
            color: #666;
        }

        .device-category {
            display: inline-block;
            padding: 0.2rem 0.6rem;
            border-radius: 12px;
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
            margin-left: 0.5rem;
        }

        .device-category.mobile {
            background: #e3f2fd;
            color: #1976d2;
        }

        .device-category.tablet {
            background: #f3e5f5;
            color: #7b1fa2;
        }

        .device-category.desktop {
            background: #e8f5e9;
            color: #388e3c;
        }

        .status-badge {
            display: inline-block;
            padding: 0.25rem 0.75rem;
            border-radius: 12px;
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
            margin-top: 0.5rem;
        }

        .status-badge.passed {
            background: #d4edda;
            color: #155724;
        }

        .status-badge.issues_found {
            background: #f8d7da;
            color: #721c24;
        }

        .status-badge.error {
            background: #fff3cd;
            color: #856404;
        }

        .screenshot {
            width: 100%;
            height: 200px;
            object-fit: cover;
            object-position: top;
            cursor: pointer;
            transition: opacity 0.2s;
        }

        .screenshot:hover {
            opacity: 0.9;
        }

        .issues-list {
            padding: 1rem;
            background: #fff5f5;
        }

        .issue-item {
            padding: 0.75rem;
            margin-bottom: 0.5rem;
            background: white;
            border-left: 3px solid #e74c3c;
            border-radius: 4px;
            font-size: 0.9rem;
        }

        .issue-item:last-child {
            margin-bottom: 0;
        }

        .severity {
            display: inline-block;
            padding: 0.1rem 0.5rem;
            border-radius: 8px;
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
            margin-right: 0.5rem;
        }

        .severity.high {
            background: #ffebee;
            color: #c62828;
        }

        .severity.medium {
            background: #fff3e0;
            color: #ef6c00;
        }

        .severity.low {
            background: #e3f2fd;
            color: #1565c0;
        }

        .error-message {
            padding: 1rem;
            background: #fff3cd;
            color: #856404;
            font-size: 0.9rem;
        }

        .filter-bar {
            background: white;
            padding: 1rem 2rem;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            margin-bottom: 2rem;
            display: flex;
            gap: 1rem;
            align-items: center;
            flex-wrap: wrap;
        }

        .filter-label {
            font-weight: 600;
            color: #666;
        }

        .filter-btn {
            padding: 0.5rem 1rem;
            border: 2px solid #e0e0e0;
            background: white;
            border-radius: 6px;
            cursor: pointer;
            font-size: 0.9rem;
            transition: all 0.2s;
        }

        .filter-btn:hover {
            border-color: #667eea;
            color: #667eea;
        }

        .filter-btn.active {
            background: #667eea;
            color: white;
            border-color: #667eea;
        }

        /* Modal for full-size screenshots */
        .modal {
            display: none;
            position: fixed;
            z-index: 1000;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.9);
            cursor: zoom-out;
        }

        .modal.active {
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .modal img {
            max-width: 90%;
            max-height: 90vh;
            object-fit: contain;
        }

        @media print {
            .filter-bar {
                display: none;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Responsive Testing Report</h1>
        <div class="meta">
            Generated: {timestamp}<br>
            Base URL: {base_url}
        </div>
    </div>

    <div class="container">
        <div class="summary">
            <div class="summary-item">
                <div class="label">Total Pages</div>
                <div class="value">{total_pages}</div>
            </div>
            <div class="summary-item">
                <div class="label">Device Types</div>
                <div class="value">{total_devices}</div>
            </div>
            <div class="summary-item">
                <div class="label">Total Tests</div>
                <div class="value">{total_tests}</div>
            </div>
            <div class="summary-item issues">
                <div class="label">Issues Found</div>
                <div class="value">{total_issues}</div>
            </div>
        </div>

        <div class="filter-bar">
            <span class="filter-label">Filter by:</span>
            <button class="filter-btn active" data-filter="all">All</button>
            <button class="filter-btn" data-filter="issues">Issues Only</button>
            <button class="filter-btn" data-filter="mobile">Mobile</button>
            <button class="filter-btn" data-filter="tablet">Tablet</button>
            <button class="filter-btn" data-filter="desktop">Desktop</button>
        </div>

        {pages_html}
    </div>

    <div class="modal" id="imageModal">
        <img id="modalImage" src="" alt="Full screenshot">
    </div>

    <script>
        // Filter functionality
        const filterBtns = document.querySelectorAll('.filter-btn');
        const deviceCards = document.querySelectorAll('.device-card');

        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // Update active button
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                const filter = btn.dataset.filter;

                deviceCards.forEach(card => {
                    if (filter === 'all') {
                        card.style.display = 'block';
                    } else if (filter === 'issues') {
                        card.style.display = card.classList.contains('has-issues') ? 'block' : 'none';
                    } else {
                        card.style.display = card.dataset.category === filter ? 'block' : 'none';
                    }
                });
            });
        });

        // Image modal
        const modal = document.getElementById('imageModal');
        const modalImage = document.getElementById('modalImage');
        const screenshots = document.querySelectorAll('.screenshot');

        screenshots.forEach(img => {
            img.addEventListener('click', () => {
                modal.classList.add('active');
                modalImage.src = img.src;
            });
        });

        modal.addEventListener('click', () => {
            modal.classList.remove('active');
        });
    </script>
</body>
</html>
"""


def generate_html_report(results_file):
    """Generate HTML report from JSON results"""

    results_path = Path(results_file)
    if not results_path.exists():
        print(f"ERROR: Results file not found: {results_file}")
        sys.exit(1)

    with open(results_path, 'r') as f:
        results = json.load(f)

    # Calculate totals
    total_issues = 0
    pages_html = []

    for page_route, devices in results['pages'].items():
        device_cards = []

        for device_name, device_result in devices.items():
            status = device_result.get('status', 'unknown')
            issues = device_result.get('issues', [])
            total_issues += len(issues)

            # Build issues HTML
            issues_html = ""
            if issues:
                issues_items = []
                for issue in issues:
                    severity = issue.get('severity', 'low')
                    message = issue.get('message', 'Unknown issue')
                    issues_items.append(f'''
                        <div class="issue-item">
                            <span class="severity {severity}">{severity}</span>
                            {message}
                        </div>
                    ''')
                issues_html = f'''
                    <div class="issues-list">
                        {"".join(issues_items)}
                    </div>
                '''

            # Build screenshot or error
            content_html = ""
            if status == 'error' or status == 'failed':
                error_msg = device_result.get('error', 'Unknown error')
                content_html = f'<div class="error-message">{error_msg}</div>'
            else:
                screenshot = device_result.get('screenshot', '')
                if screenshot:
                    content_html = f'<img src="{screenshot}" alt="Screenshot" class="screenshot" loading="lazy">'

            # Device category
            category = device_result.get('device_category', 'desktop')
            viewport = device_result.get('viewport', 'Unknown')

            card_class = 'device-card'
            if issues:
                card_class += ' has-issues'
            if status == 'error':
                card_class += ' error'

            device_cards.append(f'''
                <div class="{card_class}" data-category="{category}">
                    <div class="device-header">
                        <div class="device-name">
                            {device_name}
                            <span class="device-category {category}">{category}</span>
                        </div>
                        <div class="device-info">{viewport}</div>
                        <span class="status-badge {status}">{status.replace('_', ' ')}</span>
                    </div>
                    {content_html}
                    {issues_html}
                </div>
            ''')

        pages_html.append(f'''
            <div class="page-section">
                <h2 class="page-title">{page_route}</h2>
                <div class="device-grid">
                    {"".join(device_cards)}
                </div>
            </div>
        ''')

    # Format timestamp
    timestamp = datetime.fromisoformat(results['timestamp']).strftime('%Y-%m-%d %H:%M:%S')

    # Generate final HTML
    html = HTML_TEMPLATE.format(
        timestamp=timestamp,
        base_url=results['base_url'],
        total_pages=results['total_pages'],
        total_devices=results['total_devices'],
        total_tests=results['total_tests'],
        total_issues=total_issues,
        pages_html="".join(pages_html)
    )

    # Save HTML report
    output_path = results_path.parent / "report.html"
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(html)

    print(f"Report generated: {output_path}")
    return output_path


def main():
    """Main entry point"""
    import argparse

    parser = argparse.ArgumentParser(description='Generate HTML report from test results')
    parser.add_argument('results_dir', help='Directory containing test_results.json')

    args = parser.parse_args()

    results_file = Path(args.results_dir) / "test_results.json"
    report_path = generate_html_report(results_file)

    print(f"\nOpen the report in your browser:")
    print(f"  file://{report_path.absolute()}")


if __name__ == '__main__':
    main()
