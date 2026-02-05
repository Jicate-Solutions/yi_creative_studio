-- Credit Requests Table
-- Implements request-approval flow for credit purchases (no direct payment integration yet)

CREATE TABLE IF NOT EXISTS credit_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL REFERENCES auth.users(id),

  -- Package details
  package_id TEXT NOT NULL,
  package_name TEXT NOT NULL,
  credits_amount INTEGER NOT NULL CHECK (credits_amount > 0),
  price_inr INTEGER NOT NULL CHECK (price_inr >= 0),

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),

  -- Review info (filled when admin approves/rejects)
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  admin_notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_credit_requests_organization ON credit_requests(organization_id);
CREATE INDEX idx_credit_requests_status ON credit_requests(status);
CREATE INDEX idx_credit_requests_created ON credit_requests(created_at DESC);
CREATE INDEX idx_credit_requests_pending ON credit_requests(status) WHERE status = 'pending';

-- Enable RLS
ALTER TABLE credit_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Organization members can view their own organization's requests
CREATE POLICY "org_members_view_own_requests" ON credit_requests
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Organization admins can create requests for their org
CREATE POLICY "org_admins_create_requests" ON credit_requests
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
    )
    AND requested_by = auth.uid()
  );

-- Super admins can view all requests
CREATE POLICY "super_admins_view_all_requests" ON credit_requests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'is_super_admin' = 'true'
    )
  );

-- Super admins can update request status (approve/reject)
CREATE POLICY "super_admins_update_requests" ON credit_requests
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'is_super_admin' = 'true'
    )
  );

-- Users can cancel their own pending requests
CREATE POLICY "users_cancel_own_requests" ON credit_requests
  FOR UPDATE
  USING (
    requested_by = auth.uid()
    AND status = 'pending'
  )
  WITH CHECK (
    status = 'cancelled'
  );

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_credit_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER credit_requests_updated_at
  BEFORE UPDATE ON credit_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_credit_requests_updated_at();

-- Comment for documentation
COMMENT ON TABLE credit_requests IS 'Stores credit purchase requests pending admin approval. No direct payment - admin must approve before credits are added.';
