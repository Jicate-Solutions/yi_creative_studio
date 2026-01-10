-- Organization Credits Table
-- Tracks credit balances and usage for each organization
-- Created: 2026-01-09

-- Create organization_credits table
CREATE TABLE IF NOT EXISTS organization_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,

  -- Current balance
  balance INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0),

  -- Tracking
  total_allocated INTEGER DEFAULT 0 CHECK (total_allocated >= 0),
  total_consumed INTEGER DEFAULT 0 CHECK (total_consumed >= 0),
  total_purchased INTEGER DEFAULT 0 CHECK (total_purchased >= 0),

  -- Limits
  credit_limit INTEGER CHECK (credit_limit IS NULL OR credit_limit > 0),
  low_balance_threshold INTEGER DEFAULT 100 CHECK (low_balance_threshold >= 0),

  -- Metadata
  last_allocation_at TIMESTAMPTZ,
  last_consumption_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_org_credits_org_id ON organization_credits(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_credits_balance ON organization_credits(balance);
CREATE INDEX IF NOT EXISTS idx_org_credits_low_balance ON organization_credits(balance)
  WHERE balance <= low_balance_threshold;

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_organization_credits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER organization_credits_updated_at
  BEFORE UPDATE ON organization_credits
  FOR EACH ROW
  EXECUTE FUNCTION update_organization_credits_updated_at();

-- Function to initialize credits for new organizations
CREATE OR REPLACE FUNCTION initialize_organization_credits()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO organization_credits (organization_id, balance)
  VALUES (NEW.id, 0)
  ON CONFLICT (organization_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-create credit record for new organizations
CREATE TRIGGER auto_initialize_organization_credits
  AFTER INSERT ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION initialize_organization_credits();

-- Add RLS policies
ALTER TABLE organization_credits ENABLE ROW LEVEL SECURITY;

-- Organizations can view their own credits
CREATE POLICY "Organizations can view own credits"
  ON organization_credits
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = organization_credits.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );

-- Only Super Admins can modify credits directly
-- (Normal credit operations go through credit_transactions)
CREATE POLICY "Super Admins can manage credits"
  ON organization_credits
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.is_super_admin = TRUE
    )
  );

-- Initialize credits for existing organizations
INSERT INTO organization_credits (organization_id, balance)
SELECT id, 0 FROM organizations
ON CONFLICT (organization_id) DO NOTHING;

-- Add comments
COMMENT ON TABLE organization_credits IS
  'Credit balances and usage tracking for organizations';

COMMENT ON COLUMN organization_credits.balance IS
  'Current available credits (must be non-negative)';

COMMENT ON COLUMN organization_credits.total_allocated IS
  'Cumulative credits allocated to this organization';

COMMENT ON COLUMN organization_credits.total_consumed IS
  'Cumulative credits consumed by this organization';

COMMENT ON COLUMN organization_credits.total_purchased IS
  'Cumulative credits purchased (not from subscription)';

COMMENT ON COLUMN organization_credits.credit_limit IS
  'Maximum credits organization can accumulate (NULL = unlimited)';

COMMENT ON COLUMN organization_credits.low_balance_threshold IS
  'Alert when balance drops below this value';
