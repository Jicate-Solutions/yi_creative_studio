/**
 * Grant Super Admin Access to director@jkkn.ac.in and ranjith@jkkn.ac.in
 *
 * This script grants Super Admin privileges to the specified users.
 *
 * Usage: node scripts/grant-super-admin-director-ranjith.js
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const EMAILS = ['director@jkkn.ac.in', 'ranjith@jkkn.ac.in']

async function grantSuperAdmin() {
  console.log('🚀 Starting Super Admin setup for multiple users...\n')

  // Get Supabase credentials from environment
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env.local')
    console.log('\nRequired variables:')
    console.log('  - NEXT_PUBLIC_SUPABASE_URL')
    console.log('  - SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  try {
    console.log('🔍 Looking for users...')

    // Find all users
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers()

    if (userError) {
      throw new Error(`Failed to list users: ${userError.message}`)
    }

    let successCount = 0
    let failedEmails = []

    for (const email of EMAILS) {
      console.log(`\n📧 Processing: ${email}`)

      const user = userData.users.find(u => u.email === email)

      if (!user) {
        console.error(`❌ User not found: ${email}`)
        failedEmails.push({ email, reason: 'User not found. Make sure they have signed up first!' })
        continue
      }

      console.log(`✅ Found user: ${user.email} (ID: ${user.id})`)

      // Update user metadata to include super admin flag
      console.log('📝 Granting Super Admin access...')

      const { error: updateError } = await supabase.auth.admin.updateUserById(
        user.id,
        {
          user_metadata: {
            ...user.user_metadata,
            is_super_admin: true,
            super_admin_granted_at: new Date().toISOString(),
          },
          app_metadata: {
            ...user.app_metadata,
            is_super_admin: true,
            super_admin_granted_at: new Date().toISOString(),
          }
        }
      )

      if (updateError) {
        console.error(`❌ Failed to update user: ${updateError.message}`)
        failedEmails.push({ email, reason: updateError.message })
        continue
      }

      console.log(`✅ Super Admin access granted to ${email}!`)
      successCount++
    }

    console.log('\n' + '='.repeat(60))
    console.log('📊 Summary:')
    console.log(`✅ Successfully granted: ${successCount} user(s)`)
    console.log(`❌ Failed: ${failedEmails.length} user(s)`)

    if (failedEmails.length > 0) {
      console.log('\n❌ Failed users:')
      failedEmails.forEach(({ email, reason }) => {
        console.log(`  - ${email}: ${reason}`)
      })

      console.log('\n💡 Alternative: Run this SQL in Supabase Dashboard:')
      console.log(`
-- Grant Super Admin to director@jkkn.ac.in
UPDATE auth.users
SET
  raw_app_meta_data = raw_app_meta_data || '{"is_super_admin": true}'::jsonb,
  raw_user_meta_data = raw_user_meta_data || '{"is_super_admin": true}'::jsonb,
  updated_at = NOW()
WHERE email = 'director@jkkn.ac.in';

-- Grant Super Admin to ranjith@jkkn.ac.in
UPDATE auth.users
SET
  raw_app_meta_data = raw_app_meta_data || '{"is_super_admin": true}'::jsonb,
  raw_user_meta_data = raw_user_meta_data || '{"is_super_admin": true}'::jsonb,
  updated_at = NOW()
WHERE email = 'ranjith@jkkn.ac.in';

-- Verify
SELECT
  email,
  raw_app_meta_data->>'is_super_admin' as is_super_admin,
  raw_user_meta_data->>'is_super_admin' as is_super_admin_user_meta
FROM auth.users
WHERE email IN ('director@jkkn.ac.in', 'ranjith@jkkn.ac.in');
      `)
    }

    if (successCount > 0) {
      console.log('\n📋 Next steps:')
      console.log('1. Users should logout from their current sessions')
      console.log('2. Login again to refresh the session')
      console.log('3. Navigate to /super-admin to access Super Admin panel')
      console.log('\n🎉 Setup complete!')
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
    console.log('\n💡 Alternative: Run the migration file:')
    console.log('supabase/migrations/20260121142029_grant_super_admin_director_ranjith.sql')
    process.exit(1)
  }
}

grantSuperAdmin()
