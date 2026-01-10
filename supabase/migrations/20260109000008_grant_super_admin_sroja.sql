/**
 * Grant Super Admin Access to sroja@jkkn.ac.in
 *
 * This migration grants Super Admin privileges to the specified user.
 * Run this once to set up the first Super Admin.
 */

-- Grant Super Admin access
UPDATE auth.users
SET
  is_super_admin = TRUE,
  super_admin_granted_at = NOW(),
  super_admin_granted_by = id  -- Self-granted for first Super Admin
WHERE email = 'sroja@jkkn.ac.in';

-- Verify the update
DO $$
DECLARE
  v_is_super_admin BOOLEAN;
  v_email TEXT;
BEGIN
  SELECT is_super_admin, email INTO v_is_super_admin, v_email
  FROM auth.users
  WHERE email = 'sroja@jkkn.ac.in';

  IF v_is_super_admin THEN
    RAISE NOTICE '✅ Super Admin access granted to: %', v_email;
  ELSE
    RAISE NOTICE '❌ Failed to grant Super Admin access';
  END IF;
END $$;
