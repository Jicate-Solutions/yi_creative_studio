#!/usr/bin/env python3
"""
Event Poster Form Field Tester

Tests and validates form field data to ensure values are passed correctly
(not field names) to the API.

Usage:
    python test_form_data.py --full              # Run all tests
    python test_form_data.py --field eventType   # Test specific field
    python test_form_data.py --generate-payload  # Generate test payload
    python test_form_data.py --validate-response response.json
"""

import argparse
import json
import sys
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta

# ============================================================
# VALID VALUES FROM lib/constants.ts
# ============================================================

VALID_EVENT_TYPES = [
    # Academic
    "seminar", "workshop", "conference", "guest_lecture", "webinar",
    "industrial_visit", "orientation", "convocation", "placement_drive",
    "science_fair", "training",
    # Competitions
    "competition", "hackathon", "quiz", "debate", "sports_event", "sports_day",
    # Celebrations
    "celebration", "cultural_event", "annual_day", "freshers_day", "farewell",
    "alumni_meet", "reunion", "tech_fest", "cultural_fest", "festival",
    # Corporate
    "meetup", "exhibition", "product_launch", "town_hall", "award_ceremony",
    "networking", "panel_discussion", "inauguration", "foundation_day",
    # Community
    "blood_donation", "health_camp", "csr_activity", "awareness_program", "charity_event",
    # National
    "independence_day", "republic_day", "teachers_day", "memorial",
]

VALID_THEMES = [
    # Professional
    "corporate", "modern", "classic", "minimalist",
    # Creative
    "bold", "playful", "artistic", "retro",
    # Elegant
    "elegant", "royal", "glamorous",
    # Dynamic
    "sporty", "futuristic", "neon",
    # Cultural
    "traditional", "festive", "spiritual",
    # Nature
    "organic", "zen",
    # Academic
    "scholarly", "scientific",
]

VALID_STYLES = [
    "gradient", "flat", "glass", "geometric", "neon-glow", "duotone",
    "watercolor", "line-art", "3d-isometric", "typography", "photographic",
    "illustration", "metallic", "paper-cut", "monochrome", "high-contrast",
]

VALID_COLOR_SCHEMES = [
    "brand_default", "teal_orange", "navy_gold",
    "purple_pink", "green_teal", "red_orange",
]

VALID_LANGUAGES = ["en", "ta", "hi"]

VALID_ASPECT_RATIOS = [
    "1:1", "2:3", "3:2", "3:4", "4:3",
    "4:5", "5:4", "9:16", "16:9", "21:9",
]

VALID_RESOLUTIONS = ["1K", "2K", "4K"]


class FormFieldTester:
    """Tests event poster form fields for correct value passing."""

    def __init__(self):
        self.errors: List[str] = []
        self.warnings: List[str] = []
        self.passed: List[str] = []

    def test_field(self, field_name: str, value: Any, valid_values: Optional[List[str]] = None) -> bool:
        """Test a single form field."""
        
        # Check for None/undefined
        if value is None:
            self.errors.append(f"[FAIL] {field_name}: Value is None/undefined")
            return False
        
        # Check for field name being passed instead of value
        if isinstance(value, str):
            # Common bug: passing the field name itself
            if value == field_name:
                self.errors.append(
                    f"[FAIL] {field_name}: FIELD NAME passed instead of value! "
                    f"Got '{value}' which equals the field name."
                )
                return False
            
            # Check for camelCase field names
            suspicious_patterns = [
                "eventName", "eventType", "guestName", "guestDesignation",
                "additionalText", "colorScheme", "aspectRatio",
            ]
            if value in suspicious_patterns:
                self.errors.append(
                    f"[FAIL] {field_name}: Suspicious value '{value}' looks like a field name!"
                )
                return False
        
        # Check against valid values if provided
        if valid_values and isinstance(value, str):
            if value not in valid_values:
                self.errors.append(
                    f"[FAIL] {field_name}: Invalid value '{value}'. "
                    f"Expected one of: {valid_values[:5]}..."
                )
                return False
        
        # Check for empty strings on required fields
        required_fields = ["eventName"]
        if field_name in required_fields and value == "":
            self.errors.append(f"[FAIL] {field_name}: Required field is empty")
            return False
        
        self.passed.append(f"[PASS] {field_name}: '{value}'")
        return True

    def test_date_format(self, date_value: str) -> bool:
        """Test date format is YYYY-MM-DD."""
        if not date_value:
            self.warnings.append("[WARN] date: Empty value (optional)")
            return True
        
        try:
            datetime.strptime(date_value, "%Y-%m-%d")
            self.passed.append(f"[PASS] date: '{date_value}' (valid format)")
            return True
        except ValueError:
            self.errors.append(
                f"[FAIL] date: Invalid format '{date_value}'. Expected YYYY-MM-DD"
            )
            return False

    def test_time_format(self, time_value: str) -> bool:
        """Test time format is HH:MM."""
        if not time_value:
            self.warnings.append("[WARN] time: Empty value (optional)")
            return True
        
        try:
            datetime.strptime(time_value, "%H:%M")
            self.passed.append(f"[PASS] time: '{time_value}' (valid format)")
            return True
        except ValueError:
            self.errors.append(
                f"[FAIL] time: Invalid format '{time_value}'. Expected HH:MM"
            )
            return False

    def test_full_payload(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Test a complete API payload."""
        content = payload.get("content", {})
        
        print("\n=== Testing Event Poster Form Data ===\n")
        
        # Test content fields
        print("--- Content Fields ---")
        self.test_field("eventName", content.get("eventName"))
        self.test_field("eventType", content.get("eventType"), VALID_EVENT_TYPES)
        self.test_date_format(content.get("date", ""))
        self.test_time_format(content.get("time", ""))
        self.test_field("venue", content.get("venue"))
        self.test_field("hall", content.get("hall"))
        self.test_field("guestName", content.get("guestName"))
        self.test_field("guestDesignation", content.get("guestDesignation"))
        self.test_field("description", content.get("description"))
        self.test_field("additionalText", content.get("additionalText"))
        
        # Test design fields
        print("\n--- Design Fields ---")
        self.test_field("theme", payload.get("theme"), VALID_THEMES)
        self.test_field("style", payload.get("style"), VALID_STYLES)
        self.test_field("colorScheme", payload.get("colorScheme"), VALID_COLOR_SCHEMES)
        self.test_field("language", payload.get("language"), VALID_LANGUAGES)
        
        # Test output fields
        print("\n--- Output Fields ---")
        self.test_field("aspectRatio", payload.get("aspectRatio"), VALID_ASPECT_RATIOS)
        self.test_field("resolution", payload.get("resolution"), VALID_RESOLUTIONS)
        
        # Print results
        print("\n=== Results ===\n")
        
        for p in self.passed:
            print(f"  {p}")
        
        for w in self.warnings:
            print(f"  {w}")
        
        for e in self.errors:
            print(f"  {e}")
        
        print(f"\n  Total: {len(self.passed)} passed, {len(self.warnings)} warnings, {len(self.errors)} errors")
        
        return {
            "passed": len(self.passed),
            "warnings": len(self.warnings),
            "errors": len(self.errors),
            "details": {
                "passed": self.passed,
                "warnings": self.warnings,
                "errors": self.errors,
            }
        }

    def generate_test_payload(self, event_type: str = "conference") -> Dict[str, Any]:
        """Generate a valid test payload."""
        tomorrow = datetime.now() + timedelta(days=1)
        
        return {
            "organizationId": "test-org-id",
            "type": "event_poster",
            "content": {
                "eventName": "Annual Tech Conference 2025",
                "eventType": event_type,
                "date": tomorrow.strftime("%Y-%m-%d"),
                "time": "09:00",
                "venue": "Grand Convention Center, Chennai",
                "hall": "Main Auditorium",
                "guestName": "Dr. Sarah Johnson",
                "guestDesignation": "CEO, Tech Innovations Inc.",
                "description": "Join us for the biggest tech conference of the year featuring industry leaders and breakthrough innovations.",
                "additionalText": "Limited seats available! Register now to secure your spot.",
            },
            "theme": "modern",
            "style": "gradient",
            "colorScheme": "brand_default",
            "language": "en",
            "aspectRatio": "9:16",
            "resolution": "2K",
        }


def generate_browser_test_script() -> str:
    """Generate JavaScript to test form data in browser console."""
    return '''
// Paste this in browser console on the create poster page

(function testFormData() {
  console.log("=== Event Poster Form Test ===");
  
  // Get React state (may vary based on implementation)
  // Try to find the form data in React DevTools or component state
  
  // Check for Select components
  const selects = document.querySelectorAll('[data-radix-select-trigger]');
  console.log("Found", selects.length, "select components");
  
  selects.forEach((select, i) => {
    const value = select.getAttribute('data-value') || select.textContent;
    console.log(`Select ${i}:`, value);
  });
  
  // Check input values
  const inputs = document.querySelectorAll('input, textarea');
  inputs.forEach(input => {
    if (input.id) {
      console.log(`${input.id}:`, input.value || "(empty)");
    }
  });
  
  // Check for common bugs
  console.log("\\n=== Bug Detection ===");
  
  const suspiciousValues = [
    'eventName', 'eventType', 'guestName', 'guestDesignation',
    'additionalText', 'colorScheme', 'aspectRatio'
  ];
  
  inputs.forEach(input => {
    if (suspiciousValues.includes(input.value)) {
      console.error(`BUG DETECTED: ${input.id} has value "${input.value}" which looks like a field name!`);
    }
  });
  
  console.log("Test complete");
})();
'''


def main():
    parser = argparse.ArgumentParser(description="Test event poster form fields")
    parser.add_argument("--full", action="store_true", help="Run full test with sample data")
    parser.add_argument("--field", type=str, help="Test specific field")
    parser.add_argument("--generate-payload", action="store_true", help="Generate test payload")
    parser.add_argument("--validate-response", type=str, help="Validate API response JSON file")
    parser.add_argument("--browser-script", action="store_true", help="Generate browser test script")
    parser.add_argument("--event-type", type=str, default="conference", help="Event type for test payload")
    
    args = parser.parse_args()
    tester = FormFieldTester()
    
    if args.browser_script:
        print(generate_browser_test_script())
        return
    
    if args.generate_payload:
        payload = tester.generate_test_payload(args.event_type)
        print(json.dumps(payload, indent=2))
        return
    
    if args.validate_response:
        with open(args.validate_response, 'r') as f:
            response = json.load(f)
        
        if response.get("success"):
            print("[PASS] API returned success")
            if response.get("usage"):
                print(f"  Tokens used: {response['usage'].get('totalTokens', 'N/A')}")
                print(f"  Credits charged: {response['usage'].get('creditsCharged', 'N/A')}")
        else:
            print(f"[FAIL] API error: {response.get('error', 'Unknown error')}")
        return
    
    if args.field:
        # Test specific field with common problematic values
        test_values = {
            "eventType": [
                ("conference", True),      # Valid
                ("eventType", False),      # Bug: field name as value
                ("invalid_type", False),   # Invalid value
            ],
            "theme": [
                ("modern", True),
                ("theme", False),
                ("invalid", False),
            ],
        }
        
        if args.field in test_values:
            print(f"\n=== Testing {args.field} ===\n")
            for value, should_pass in test_values[args.field]:
                tester = FormFieldTester()
                valid_values = {
                    "eventType": VALID_EVENT_TYPES,
                    "theme": VALID_THEMES,
                }.get(args.field)
                
                result = tester.test_field(args.field, value, valid_values)
                expected = "PASS" if should_pass else "FAIL"
                actual = "PASS" if result else "FAIL"
                status = "OK" if expected == actual else "MISMATCH"
                print(f"  Value: '{value}' -> {actual} (expected {expected}) [{status}]")
        else:
            print(f"No test cases defined for {args.field}")
        return
    
    # Default: run full test with sample payload
    if args.full or True:  # Default behavior
        sample_payload = tester.generate_test_payload(args.event_type)
        print("\nUsing test payload:")
        print(json.dumps(sample_payload, indent=2))
        
        result = tester.test_full_payload(sample_payload)
        
        # Exit with error code if tests failed
        if result["errors"] > 0:
            sys.exit(1)


if __name__ == "__main__":
    main()
