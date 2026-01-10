-- Credit Transactions Table
-- Full audit trail for all credit movements (allocations, consumption, purchases, refunds)
-- Created: 2026-01-09

-- Create credit_transactions table
CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Transaction details
  type VARCHAR(30) NOT NULL CHECK (type IN (
    'allocation',           -- Credits added from subscription or manual allocation
    'purchase',             -- Credits bought separately
    'consumption',          -- Credits used for API calls
    'refund',              -- Credits returned
    'adjustment',          -- Manual correction by Super Admin
    'expiration',          -- Credits expired at end of billing period
    'bonus'                -- Promotional credits
  )),
  amount INTEGER NOT NULL,                   -- Positive for credits added, negative for used
  balance_before INTEGER NOT NULL CHECK (balance_before >= 0),
  balance_after INTEGER NOT NULL CHECK (balance_after >= 0),

  -- Context
  reason TEXT,                               -- Human-readable explanation
  reference_type VARCHAR(50),                -- Type of related record
  reference_id UUID,                         -- ID of related record

  -- Metadata (flexible JSONB for additional context)
  metadata JSONB DEFAULT '{}',

  -- Audit
  created_by UUID REFERENCES auth.users(id), -- Super Admin who initiated (for manual transactions)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_credit_txn_org_id ON credit_transactions(organization_id);
CREATE INDEX IF NOT EXISTS idx_credit_txn_created_at ON credit_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credit_txn_type ON credit_transactions(type);
CREATE INDEX IF NOT EXISTS idx_credit_txn_reference ON credit_transactions(reference_type, reference_id)
  WHERE reference_type IS NOT NULL AND reference_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_credit_txn_created_by ON credit_transactions(created_by)
  WHERE created_by IS NOT NULL;

-- Index for organization credit history queries
CREATE INDEX IF NOT EXISTS idx_credit_txn_org_created ON credit_transactions(organization_id, created_at DESC);

-- Add RLS policies
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

-- Organizations can view their own transactions
CREATE POLICY "Organizations can view own transactions"
  ON credit_transactions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = credit_transactions.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );

-- Only Super Admins and system can insert transactions
-- (In production, this should be handled by secure server-side functions)
CREATE POLICY "Super Admins can create transactions"
  ON credit_transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.is_super_admin = TRUE
    )
  );

-- Super Admins can view all transactions (for audit purposes)
CREATE POLICY "Super Admins can view all transactions"
  ON credit_transactions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.is_super_admin = TRUE
    )
  );

-- Add comments
COMMENT ON TABLE credit_transactions IS
  'Complete audit trail of all credit movements for compliance and tracking';

COMMENT ON COLUMN credit_transactions.type IS
  'Transaction type: allocation, purchase, consumption, refund, adjustment, expiration, bonus';

COMMENT ON COLUMN credit_transactions.amount IS
  'Credit amount: positive for additions, negative for consumption';

COMMENT ON COLUMN credit_transactions.balance_before IS
  'Credit balance before this transaction';

COMMENT ON COLUMN credit_transactions.balance_after IS
  'Credit balance after this transaction';

COMMENT ON COLUMN credit_transactions.reason IS
  'Human-readable explanation of why this transaction occurred';

COMMENT ON COLUMN credit_transactions.reference_type IS
  'Type of related entity: subscription_renewal, api_usage, manual_adjustment, stripe_payment, etc.';

COMMENT ON COLUMN credit_transactions.reference_id IS
  'UUID of related record for audit trail linking';

COMMENT ON COLUMN credit_transactions.metadata IS
  'Flexible JSONB field for additional context (AI model, creative format, payment details, etc.)';
