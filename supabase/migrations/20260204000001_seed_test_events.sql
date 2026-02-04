-- Seed Test Events for Development
-- This migration adds sample external events for testing the import flow
-- Created: 2026-02-04

-- Insert test events for development/testing
INSERT INTO synced_events (
  id,
  external_id,
  organization_id,
  source_app_id,
  event_name,
  event_date,
  event_time,
  end_time,
  venue,
  city,
  description,
  event_type,
  status,
  synced_at,
  source_created_at,
  source_updated_at
) VALUES
-- Event 1: AI Automation Summit (matches the test ID from application logs)
(
  'aaaa4d76-7385-425d-88d0-e413c6574813'::uuid,
  'aaaa4d76-7385-425d-88d0-e413c6574813',
  'bd21dd9d-2f08-478f-a457-74f014d5d6d1'::uuid,
  'external',
  'AI Automation Summit',
  '2026-02-15',
  '10:00:00',
  '17:00:00',
  'Tech Convention Center',
  'San Francisco',
  'Join us for a comprehensive summit on AI automation and its impact on businesses. Learn from industry leaders about the latest trends in automation, machine learning, and AI-driven solutions.',
  'conference',
  'published',
  NOW(),
  NOW(),
  NOW()
),
-- Event 2: Web Development Workshop
(
  '11249d8e-28c6-46c3-bcde-6958843e01c1'::uuid,
  '11249d8e-28c6-46c3-bcde-6958843e01c1',
  'bd21dd9d-2f08-478f-a457-74f014d5d6d1'::uuid,
  'external',
  'Modern Web Development Workshop',
  '2026-03-01',
  '14:00:00',
  '16:00:00',
  'Community Tech Hub',
  'Los Angeles',
  'A hands-on workshop covering modern web development practices, including React, Next.js, and TypeScript.',
  'workshop',
  'published',
  NOW(),
  NOW(),
  NOW()
),
-- Event 3: Design Thinking Session
(
  gen_random_uuid(),
  'test-event-design-thinking',
  'bd21dd9d-2f08-478f-a457-74f014d5d6d1'::uuid,
  'external',
  'Design Thinking Masterclass',
  '2026-03-15',
  '09:00:00',
  '12:00:00',
  'Innovation Lab',
  'New York',
  'Explore the principles of design thinking and learn how to apply them to real-world problems.',
  'masterclass',
  'published',
  NOW(),
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Add comment for future reference
COMMENT ON TABLE synced_events IS 'Stores events synced from external sources (Google Calendar, webhooks, etc.)';
