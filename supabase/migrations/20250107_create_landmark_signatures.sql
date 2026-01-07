-- Create landmark_signatures table
-- This table stores local landmark signature illustrations for footer zones
-- e.g., Gateway of India for Mumbai, Periyar Statue for Erode

CREATE TABLE IF NOT EXISTS public.landmark_signatures (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  city TEXT,
  region TEXT,
  file_url TEXT NOT NULL,
  thumbnail_url TEXT,
  file_size_bytes BIGINT,
  width INTEGER,
  height INTEGER,
  is_default BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_landmark_signatures_organization_id
  ON public.landmark_signatures(organization_id);

CREATE INDEX IF NOT EXISTS idx_landmark_signatures_city
  ON public.landmark_signatures(city);

CREATE INDEX IF NOT EXISTS idx_landmark_signatures_is_default
  ON public.landmark_signatures(organization_id, is_default)
  WHERE is_default = true;

-- Enable Row Level Security
ALTER TABLE public.landmark_signatures ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view signatures for their organization
CREATE POLICY "Users can view landmark signatures for their organization"
  ON public.landmark_signatures
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id
      FROM public.organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Editors and admins can insert signatures
CREATE POLICY "Editors can create landmark signatures"
  ON public.landmark_signatures
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT om.organization_id
      FROM public.organization_members om
      WHERE om.user_id = auth.uid()
        AND om.role IN ('editor', 'admin')
    )
  );

-- Editors and admins can update signatures
CREATE POLICY "Editors can update landmark signatures"
  ON public.landmark_signatures
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT om.organization_id
      FROM public.organization_members om
      WHERE om.user_id = auth.uid()
        AND om.role IN ('editor', 'admin')
    )
  );

-- Admins can delete signatures
CREATE POLICY "Admins can delete landmark signatures"
  ON public.landmark_signatures
  FOR DELETE
  USING (
    organization_id IN (
      SELECT om.organization_id
      FROM public.organization_members om
      WHERE om.user_id = auth.uid()
        AND om.role = 'admin'
    )
  );

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION public.update_landmark_signatures_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_landmark_signatures_updated_at
  BEFORE UPDATE ON public.landmark_signatures
  FOR EACH ROW
  EXECUTE FUNCTION public.update_landmark_signatures_updated_at();
