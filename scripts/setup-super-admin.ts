/**
 * One-time setup script to grant Super Admin access
 *
 * Usage:
 * 1. Update the EMAIL constant below with your email
 * 2. Run: npx tsx scripts/setup-super-admin.ts
 */

import { createClient } from '@supabase/supabase-js'

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY! // Need service role key
const EMAIL = 'your-email@example.com' // ⚠️ UPDATE THIS

async function setupSuperAdmin() {
  console.log('🚀 Setting up Super Admin access...\n')

  // Create Supabase admin client (bypasses RLS)
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  try {
    // Find user by email
    console.log(`🔍 Looking for user: ${EMAIL}`)
    const { data: users, error: fetchError } = await supabase
      .from('auth.users')
      .select('id, email, is_super_admin')
      .eq('email', EMAIL)

    if (fetchError) {
      throw new Error(`Failed to fetch user: ${fetchError.message}`)
    }

    if (!users || users.length === 0) {
      throw new Error(`User not found with email: ${EMAIL}`)
    }

    const user = users[0]
    console.log(`✅ Found user: ${user.email} (ID: ${user.id})`)

    // Check if already Super Admin
    if (user.is_super_admin) {
      console.log('ℹ️  User is already a Super Admin')
      return
    }

    // Grant Super Admin access
    console.log('\n📝 Granting Super Admin access...')
    const { error: updateError } = await supabase
      .from('auth.users')
      .update({
        is_super_admin: true,
        super_admin_granted_at: new Date().toISOString(),
        super_admin_granted_by: user.id, // Self-granted
      })
      .eq('id', user.id)

    if (updateError) {
      throw new Error(`Failed to update user: ${updateError.message}`)
    }

    console.log('✅ Super Admin access granted!')
    console.log('\n📋 Next steps:')
    console.log('1. Logout from your application')
    console.log('2. Login again to refresh your session')
    console.log('3. Navigate to /super-admin')
    console.log('\n🎉 Setup complete!')
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error)
    process.exit(1)
  }
}

// Run the setup
setupSuperAdmin()
