-- Subscription Tiers Table
-- Defines subscription plans (Free/Pro/Enterprise) with credit allocations
-- Created: 2026-01-09

-- Create subscription_tiers table
CREATE TABLE IF NOT EXISTS subscription_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  price_monthly DECIMAL(10,2) NOT NULL,
  price_yearly DECIMAL(10,2),

  -- Credit allocation
  monthly_credits INTEGER NOT NULL,
  rollover_allowed BOOLEAN DEFAULT FALSE,
  max_rollover_credits INTEGER,

  -- Feature flags (JSON object for flexibility)
  features JSONB DEFAULT '{}',

  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  is_public BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_subscription_tiers_name ON subscription_tiers(name);
CREATE INDEX IF NOT EXISTS idx_subscription_tiers_active ON subscription_tiers(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_subscription_tiers_public ON subscription_tiers(is_public) WHERE is_public = TRUE;
CREATE INDEX IF NOT EXISTS idx_subscription_tiers_sort ON subscription_tiers(sort_order);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_subscription_tiers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER subscription_tiers_updated_at
  BEFORE UPDATE ON subscription_tiers
  FOR EACH ROW
  EXECUTE FUNCTION update_subscription_tiers_updated_at();

-- Seed default subscription tiers
-- Note: Prices are placeholders (TBD per MVP decisions)
INSERT INTO subscription_tiers (name, display_name, description, price_monthly, monthly_credits, rollover_allowed, features, sort_order)
VALUES
  (
    'free',
    'Free Plan',
    'Perfect for getting started with Yi CreativeStudio',
    0,
    100,
    FALSE,
    '{"max_templates": 10, "max_logos": 3, "support": "community"}',
    1
  ),
  (
    'pro',
    'Professional',
    'For growing teams and organizations',
    49,
    1000,
    FALSE,
    '{"max_templates": 100, "max_logos": 20, "priority_support": true, "advanced_analytics": true}',
    2
  ),
  (
    'enterprise',
    'Enterprise',
    'Unlimited access for large organizations',
    299,
    10000,
    FALSE,
    '{"max_templates": -1, "max_logos": -1, "priority_support": true, "custom_branding": true, "dedicated_support": true, "sla": true}',
    3
  )
ON CONFLICT (name) DO NOTHING;

-- Add RLS policies
ALTER TABLE subscription_tiers ENABLE ROW LEVEL SECURITY;

-- Public tiers are visible to all authenticated users
CREATE POLICY "Subscription tiers visible to authenticated users"
  ON subscription_tiers
  FOR SELECT
  TO authenticated
  USING (is_public = TRUE AND is_active = TRUE);

-- Only Super Admins can modify subscription tiers
-- Note: This policy will be enforced at application level via super-admin-guard middleware
CREATE POLICY "Super Admins can manage subscription tiers"
  ON subscription_tiers
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
COMMENT ON TABLE subscription_tiers IS
  'Subscription plans (Free/Pro/Enterprise) with pricing and credit allocations';

COMMENT ON COLUMN subscription_tiers.monthly_credits IS
  'Number of credits allocated per month to organizations on this tier';

COMMENT ON COLUMN subscription_tiers.rollover_allowed IS
  'Whether unused credits can roll over to next billing period (currently FALSE for all tiers per MVP decision)';

COMMENT ON COLUMN subscription_tiers.features IS
  'JSON object containing tier-specific features (max_templates, max_logos, priority_support, etc.)';
