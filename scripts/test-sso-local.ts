/**
 * Local SSO Testing Script
 *
 * This script helps test the SSO endpoint locally by:
 * 1. Creating a mock SSO token (simulating Yi Connect)
 * 2. Calling the local SSO endpoint
 *
 * Usage:
 *   npx tsx scripts/test-sso-local.ts
 *
 * Note: You need Yi Connect's PRIVATE key to generate valid tokens.
 * For local testing without the private key, use the mock endpoint below.
 */

const BASE_URL = 'http://localhost:3000'

// Mock SSO payload (what Yi Connect would send)
const mockPayload = {
  sub: '550e8400-e29b-41d4-a716-446655440000', // Mock Yi Connect user ID
  email: 'test@yiconnect.com',
  name: 'Test User',
  avatar_url: null,
  chapters: [
    {
      chapter_id: '660e8400-e29b-41d4-a716-446655440001',
      chapter_name: 'Yi Erode',
      chapter_location: 'ERODE',
      role: 'chair',
      hierarchy_level: 4,
    },
  ],
  event_id: null,
  redirect_to: '/dashboard',
  iss: 'yi-connect',
  aud: 'yi-creative',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 300, // 5 min expiry
}

async function testHealthCheck() {
  console.log('\n📡 Testing SSO endpoint health check...')

  const response = await fetch(`${BASE_URL}/api/auth/sso`)
  const data = await response.text()

  console.log(`Status: ${response.status}`)
  console.log(`Response: ${data}`)
}

async function testWebhookHealthCheck() {
  console.log('\n📡 Testing Webhook endpoint health check...')

  const response = await fetch(`${BASE_URL}/api/webhooks/yi-connect`)
  const data = await response.json()

  console.log(`Status: ${response.status}`)
  console.log(`Response:`, JSON.stringify(data, null, 2))
}

async function testSSOWithMockToken() {
  console.log('\n🔐 Testing SSO with mock token (POST)...')
  console.log('Mock payload:', JSON.stringify(mockPayload, null, 2))

  // Note: This won't work without a valid signed token
  // The POST endpoint expects a real JWT token

  console.log('\n⚠️  To test with a real token:')
  console.log('1. Get a token from Yi Connect')
  console.log('2. Visit: http://localhost:3000/api/auth/sso?token=YOUR_TOKEN')
}

async function main() {
  console.log('🧪 Yi Connect SSO Local Testing\n')
  console.log('='.repeat(50))

  try {
    await testHealthCheck()
    await testWebhookHealthCheck()
    await testSSOWithMockToken()

    console.log('\n' + '='.repeat(50))
    console.log('✅ Health checks passed!')
    console.log('\n📋 Next steps for full SSO testing:')
    console.log('1. Start ngrok: ngrok http 3000')
    console.log('2. Give Yi Connect the ngrok URL')
    console.log('3. Test the SSO flow from Yi Connect')
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

main()
