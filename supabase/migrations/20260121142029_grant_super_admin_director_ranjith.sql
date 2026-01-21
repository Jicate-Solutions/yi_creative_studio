/**
 * Grant Super Admin Access to director@jkkn.ac.in and ranjith@jkkn.ac.in
 *
 * This migration grants Super Admin privileges to the specified users.
 */

-- Grant Super Admin access to director@jkkn.ac.in
UPDATE auth.users
SET
  raw_app_meta_data = raw_app_meta_data || '{"is_super_admin": true}'::jsonb,
  raw_user_meta_data = raw_user_meta_data || '{"is_super_admin": true}'::jsonb,
  updated_at = NOW()
WHERE email = 'director@jkkn.ac.in';

-- Grant Super Admin access to ranjith@jkkn.ac.in
UPDATE auth.users
SET
  raw_app_meta_data = raw_app_meta_data || '{"is_super_admin": true}'::jsonb,
  raw_user_meta_data = raw_user_meta_data || '{"is_super_admin": true}'::jsonb,
  updated_at = NOW()
WHERE email = 'ranjith@jkkn.ac.in';

-- Verify the updates
DO $$
DECLARE
  v_director_super_admin BOOLEAN;
  v_ranjith_super_admin BOOLEAN;
  v_director_email TEXT;
  v_ranjith_email TEXT;
BEGIN
  -- Check director@jkkn.ac.in
  SELECT
    (raw_app_meta_data->>'is_super_admin')::BOOLEAN,
    email
  INTO v_director_super_admin, v_director_email
  FROM auth.users
  WHERE email = 'director@jkkn.ac.in';

  -- Check ranjith@jkkn.ac.in
  SELECT
    (raw_app_meta_data->>'is_super_admin')::BOOLEAN,
    email
  INTO v_ranjith_super_admin, v_ranjith_email
  FROM auth.users
  WHERE email = 'ranjith@jkkn.ac.in';

  -- Report results
  IF v_director_super_admin THEN
    RAISE NOTICE '✅ Super Admin access granted to: %', v_director_email;
  ELSE
    RAISE NOTICE '❌ Failed to grant Super Admin access to director@jkkn.ac.in (user may not exist)';
  END IF;

  IF v_ranjith_super_admin THEN
    RAISE NOTICE '✅ Super Admin access granted to: %', v_ranjith_email;
  ELSE
    RAISE NOTICE '❌ Failed to grant Super Admin access to ranjith@jkkn.ac.in (user may not exist)';
  END IF;
END $$;
