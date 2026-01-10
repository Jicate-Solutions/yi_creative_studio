-- Organization Subscriptions Table
-- Tracks active subscriptions for each organization
-- Created: 2026-01-09

-- Create organization_subscriptions table
CREATE TABLE IF NOT EXISTS organization_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  tier_id UUID NOT NULL REFERENCES subscription_tiers(id),

  -- Subscription period
  status VARCHAR(20) NOT NULL CHECK (status IN ('active', 'trial', 'cancelled', 'suspended', 'expired')),
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  auto_renew BOOLEAN DEFAULT TRUE,

  -- Trial information
  is_trial BOOLEAN DEFAULT FALSE,
  trial_ends_at TIMESTAMPTZ,

  -- Billing
  last_billed_at TIMESTAMPTZ,
  next_billing_date TIMESTAMPTZ,
  billing_cycle VARCHAR(20) CHECK (billing_cycle IN ('monthly', 'yearly')),

  -- Discounts
  discount_percent DECIMAL(5,2) DEFAULT 0 CHECK (discount_percent >= 0 AND discount_percent <= 100),
  discount_reason TEXT,

  -- Audit
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  cancelled_at TIMESTAMPTZ,
  cancelled_by UUID REFERENCES auth.users(id),
  cancellation_reason TEXT,

  -- Ensure one active subscription per org at a time
  UNIQUE(organization_id, period_start)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_org_subs_org_id ON organization_subscriptions(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_subs_status ON organization_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_org_subs_period_end ON organization_subscriptions(period_end);
CREATE INDEX IF NOT EXISTS idx_org_subs_tier_id ON organization_subscriptions(tier_id);
CREATE INDEX IF NOT EXISTS idx_org_subs_next_billing ON organization_subscriptions(next_billing_date) WHERE status = 'active';

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_organization_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER organization_subscriptions_updated_at
  BEFORE UPDATE ON organization_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_organization_subscriptions_updated_at();

-- Add RLS policies
ALTER TABLE organization_subscriptions ENABLE ROW LEVEL SECURITY;

-- Organizations can view their own subscriptions
CREATE POLICY "Organizations can view own subscriptions"
  ON organization_subscriptions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = organization_subscriptions.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );

-- Only Super Admins can manage subscriptions
CREATE POLICY "Super Admins can manage subscriptions"
  ON organization_subscriptions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.is_super_admin = TRUE
    )
  );

-- Add comments
COMMENT ON TABLE organization_subscriptions IS
  'Tracks active and historical subscriptions for organizations';

COMMENT ON COLUMN organization_subscriptions.status IS
  'Subscription status: active, trial, cancelled, suspended, expired';

COMMENT ON COLUMN organization_subscriptions.auto_renew IS
  'Whether subscription should automatically renew at period_end';

COMMENT ON COLUMN organization_subscriptions.discount_percent IS
  'Discount percentage applied to this subscription (0-100)';
