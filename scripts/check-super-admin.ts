/**
 * Check if a user has Super Admin access
 *
 * Usage:
 * npx tsx scripts/check-super-admin.ts your-email@example.com
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

async function checkSuperAdmin() {
  const email = process.argv[2]

  if (!email) {
    console.error('❌ Please provide an email address')
    console.log('Usage: npx tsx scripts/check-super-admin.ts your-email@example.com')
    process.exit(1)
  }

  console.log(`🔍 Checking Super Admin status for: ${email}\n`)

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

  try {
    // Note: This query might be blocked by RLS
    // If it fails, you need to use Supabase Dashboard
    const { data: users, error } = await supabase
      .from('auth.users')
      .select('email, is_super_admin, super_admin_granted_at')
      .eq('email', email)

    if (error) {
      console.error('❌ Error querying database:', error.message)
      console.log('\n💡 Tip: Use Supabase Dashboard SQL Editor instead:')
      console.log(`   SELECT email, is_super_admin FROM auth.users WHERE email = '${email}';`)
      process.exit(1)
    }

    if (!users || users.length === 0) {
      console.error(`❌ User not found: ${email}`)
      process.exit(1)
    }

    const user = users[0]
    console.log('User Details:')
    console.log(`  Email: ${user.email}`)
    console.log(`  Super Admin: ${user.is_super_admin ? '✅ YES' : '❌ NO'}`)
    if (user.super_admin_granted_at) {
      console.log(`  Granted At: ${new Date(user.super_admin_granted_at).toLocaleString()}`)
    }

    if (user.is_super_admin) {
      console.log('\n✅ This user has Super Admin access!')
      console.log('\n📋 To use the Super Admin panel:')
      console.log('1. Make sure you are logged in with this email')
      console.log('2. Navigate to /super-admin')
      console.log('3. If redirected, logout and login again to refresh session')
    } else {
      console.log('\n❌ This user does NOT have Super Admin access')
      console.log('\n📋 To grant access:')
      console.log('1. Open Supabase Dashboard SQL Editor')
      console.log('2. Run:')
      console.log(`   UPDATE auth.users SET is_super_admin = TRUE WHERE email = '${email}';`)
      console.log('3. Logout and login again')
    }
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error)
    process.exit(1)
  }
}

checkSuperAdmin()
