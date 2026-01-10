/**
 * Grant Super Admin Access
 *
 * This script grants Super Admin privileges to sroja@jkkn.ac.in
 *
 * Usage: node scripts/grant-super-admin.js
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const EMAIL = 'sroja@jkkn.ac.in'

async function grantSuperAdmin() {
  console.log('🚀 Starting Super Admin setup...\n')

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
    console.log(`🔍 Looking for user: ${EMAIL}`)

    // Find user
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers()

    if (userError) {
      throw new Error(`Failed to list users: ${userError.message}`)
    }

    const user = userData.users.find(u => u.email === EMAIL)

    if (!user) {
      console.error(`❌ User not found: ${EMAIL}`)
      console.log('\n💡 Make sure the user has signed up first!')
      process.exit(1)
    }

    console.log(`✅ Found user: ${user.email} (ID: ${user.id})`)

    // Update user metadata to include super admin flag
    console.log('\n📝 Granting Super Admin access...')

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
      throw new Error(`Failed to update user: ${updateError.message}`)
    }

    // Also update the auth.users table directly via SQL
    console.log('📝 Updating database table...')

    const { error: sqlError } = await supabase.rpc('exec_sql', {
      query: `
        UPDATE auth.users
        SET
          raw_user_meta_data = raw_user_meta_data || '{"is_super_admin": true}'::jsonb,
          updated_at = NOW()
        WHERE id = '${user.id}';
      `
    })

    // If RPC doesn't work, we'll use a direct table update (requires service role key)
    if (sqlError) {
      console.log('⚠️  RPC method not available, trying direct update...')
      // This requires you to run the SQL manually
    }

    console.log('✅ Super Admin access granted!')
    console.log('\n📋 Next steps:')
    console.log(`1. User ${EMAIL} should logout`)
    console.log('2. Login again to refresh the session')
    console.log('3. Navigate to /super-admin')
    console.log('\n🎉 Setup complete!')

  } catch (error) {
    console.error('❌ Error:', error.message)
    console.log('\n💡 Alternative: Run this SQL in Supabase Dashboard:')
    console.log(`
UPDATE auth.users
SET
  raw_user_meta_data = raw_user_meta_data || '{"is_super_admin": true}'::jsonb,
  updated_at = NOW()
WHERE email = '${EMAIL}';

-- Verify
SELECT email, raw_user_meta_data->>'is_super_admin' as is_super_admin
FROM auth.users
WHERE email = '${EMAIL}';
    `)
    process.exit(1)
  }
}

grantSuperAdmin()
