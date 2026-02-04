-- Migration: Add v2.0 fields to synced_events table
-- This adds support for virtual events, capacity tracking, chapter info, and guest policies
-- These fields enable richer event data from external sources like Yi Connect

-- Virtual Event Support
ALTER TABLE synced_events
ADD COLUMN IF NOT EXISTS is_virtual BOOLEAN DEFAULT false;

ALTER TABLE synced_events
ADD COLUMN IF NOT EXISTS virtual_meeting_link TEXT;

-- Venue Details
ALTER TABLE synced_events
ADD COLUMN IF NOT EXISTS venue_latitude DECIMAL(10, 8);

ALTER TABLE synced_events
ADD COLUMN IF NOT EXISTS venue_longitude DECIMAL(11, 8);

ALTER TABLE synced_events
ADD COLUMN IF NOT EXISTS venue_capacity INTEGER;

-- Chapter/Organization Context
ALTER TABLE synced_events
ADD COLUMN IF NOT EXISTS chapter_name TEXT;

ALTER TABLE synced_events
ADD COLUMN IF NOT EXISTS chapter_location TEXT;

-- Content Enhancements
ALTER TABLE synced_events
ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb;

ALTER TABLE synced_events
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

-- Registration Capacity
ALTER TABLE synced_events
ADD COLUMN IF NOT EXISTS registration_start_date DATE;

ALTER TABLE synced_events
ADD COLUMN IF NOT EXISTS registration_deadline DATE;

ALTER TABLE synced_events
ADD COLUMN IF NOT EXISTS max_capacity INTEGER;

ALTER TABLE synced_events
ADD COLUMN IF NOT EXISTS current_registrations INTEGER DEFAULT 0;

ALTER TABLE synced_events
ADD COLUMN IF NOT EXISTS waitlist_enabled BOOLEAN DEFAULT false;

-- Guest Policy
ALTER TABLE synced_events
ADD COLUMN IF NOT EXISTS allow_guests BOOLEAN DEFAULT true;

ALTER TABLE synced_events
ADD COLUMN IF NOT EXISTS guest_limit INTEGER;

-- Add comments for documentation
COMMENT ON COLUMN synced_events.is_virtual IS 'Whether the event is online-only (virtual)';
COMMENT ON COLUMN synced_events.virtual_meeting_link IS 'Zoom/Meet/Teams meeting URL';
COMMENT ON COLUMN synced_events.venue_latitude IS 'GPS latitude for map integration';
COMMENT ON COLUMN synced_events.venue_longitude IS 'GPS longitude for map integration';
COMMENT ON COLUMN synced_events.venue_capacity IS 'Maximum capacity of the venue';
COMMENT ON COLUMN synced_events.chapter_name IS 'Yi chapter name (e.g., Yi Chapter Chennai)';
COMMENT ON COLUMN synced_events.chapter_location IS 'Chapter city/region';
COMMENT ON COLUMN synced_events.tags IS 'Event tags/labels as JSON array';
COMMENT ON COLUMN synced_events.is_featured IS 'Whether the event is featured/highlighted';
COMMENT ON COLUMN synced_events.registration_start_date IS 'When registration opens';
COMMENT ON COLUMN synced_events.registration_deadline IS 'Registration deadline date';
COMMENT ON COLUMN synced_events.max_capacity IS 'Maximum number of attendees';
COMMENT ON COLUMN synced_events.current_registrations IS 'Current RSVP count (snapshot at sync time)';
COMMENT ON COLUMN synced_events.waitlist_enabled IS 'Whether waitlist is active when at capacity';
COMMENT ON COLUMN synced_events.allow_guests IS 'Whether +1 guests are allowed';
COMMENT ON COLUMN synced_events.guest_limit IS 'Maximum guests per attendee';

-- Create index on tags for search performance
CREATE INDEX IF NOT EXISTS idx_synced_events_tags ON synced_events USING GIN (tags);

-- Create index on is_featured for filtering
CREATE INDEX IF NOT EXISTS idx_synced_events_is_featured ON synced_events (is_featured) WHERE is_featured = true;

-- Create index on is_virtual for filtering
CREATE INDEX IF NOT EXISTS idx_synced_events_is_virtual ON synced_events (is_virtual) WHERE is_virtual = true;
