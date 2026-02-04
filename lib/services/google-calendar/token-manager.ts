/**
 * Google Calendar Token Manager
 *
 * Handles OAuth token encryption, decryption, and refresh
 */

import { createClient } from '@/lib/supabase/server'
import {
  GoogleOAuthTokenResponse,
  GoogleUserInfo,
  GoogleCalendarErrorCode,
  TOKEN_REFRESH_BUFFER_MS,
} from '@/types/google-calendar.types'

// ============================================================================
// Configuration
// ============================================================================

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!
const GOOGLE_CALENDAR_ENCRYPTION_KEY = process.env.GOOGLE_CALENDAR_ENCRYPTION_KEY!
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo'

// ============================================================================
// Token Exchange & Refresh
// ============================================================================

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(
  code: string,
  redirectUri: string
): Promise<GoogleOAuthTokenResponse> {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    console.error('Token exchange failed:', error)
    throw new Error(
      `Token exchange failed: ${error.error_description || error.error}`
    )
  }

  return response.json()
}

/**
 * Refresh an access token using refresh token
 */
export async function refreshAccessToken(
  refreshToken: string
): Promise<GoogleOAuthTokenResponse> {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      grant_type: 'refresh_token',
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    console.error('Token refresh failed:', error)
    throw new Error(
      `Token refresh failed: ${error.error_description || error.error}`
    )
  }

  return response.json()
}

/**
 * Get user info from Google
 */
export async function getGoogleUserInfo(
  accessToken: string
): Promise<GoogleUserInfo> {
  const response = await fetch(GOOGLE_USERINFO_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    throw new Error('Failed to get user info')
  }

  return response.json()
}

/**
 * Revoke a token (access or refresh)
 */
export async function revokeToken(token: string): Promise<void> {
  const response = await fetch(
    `https://oauth2.googleapis.com/revoke?token=${token}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  )

  if (!response.ok) {
    console.warn('Token revocation failed (may already be revoked)')
  }
}

// ============================================================================
// Token Storage (Encrypted)
// ============================================================================

/**
 * Store encrypted tokens in database
 */
export async function storeTokens(params: {
  connectionId: string
  accessToken: string
  refreshToken: string
  expiresIn: number
}): Promise<void> {
  const supabase = await createClient()

  // Calculate expiry timestamp
  const tokenExpiry = new Date(Date.now() + params.expiresIn * 1000)

  // Use database function to encrypt tokens (passing key from env)
  const { error } = (await supabase.rpc('store_google_calendar_tokens' as any, {
    p_connection_id: params.connectionId,
    p_access_token: params.accessToken,
    p_refresh_token: params.refreshToken,
    p_token_expiry: tokenExpiry.toISOString(),
    p_encryption_key: GOOGLE_CALENDAR_ENCRYPTION_KEY,
  })) as { error: any }

  if (error) {
    console.error('Failed to store tokens:', error)
    throw new Error('Failed to store encrypted tokens')
  }
}

/**
 * Get decrypted tokens from database
 */
export async function getDecryptedTokens(connectionId: string): Promise<{
  accessToken: string
  refreshToken: string
  tokenExpiry: Date
} | null> {
  const supabase = await createClient()

  const { data, error } = (await supabase.rpc('get_google_calendar_tokens' as any, {
    p_connection_id: connectionId,
    p_encryption_key: GOOGLE_CALENDAR_ENCRYPTION_KEY,
  })) as { data: any; error: any }

  if (error || !data || data.length === 0) {
    console.error('Failed to get tokens:', error)
    return null
  }

  // RPC returns an array, get the first row
  const row = Array.isArray(data) ? data[0] : data

  return {
    accessToken: row.access_token,
    refreshToken: row.refresh_token,
    tokenExpiry: new Date(row.token_expiry),
  }
}

/**
 * Check if token needs refresh and refresh if necessary
 * Returns a valid access token
 */
export async function ensureValidAccessToken(
  connectionId: string
): Promise<string> {
  const tokens = await getDecryptedTokens(connectionId)

  if (!tokens) {
    throw new Error('No tokens found for connection')
  }

  const now = Date.now()
  const expiryTime = tokens.tokenExpiry.getTime()

  // Check if token is expired or about to expire
  if (now >= expiryTime - TOKEN_REFRESH_BUFFER_MS) {
    console.log('Token expired or expiring soon, refreshing...')

    try {
      const newTokens = await refreshAccessToken(tokens.refreshToken)

      await storeTokens({
        connectionId,
        accessToken: newTokens.access_token,
        refreshToken: newTokens.refresh_token || tokens.refreshToken,
        expiresIn: newTokens.expires_in,
      })

      // Log successful refresh
      await logTokenRefresh(connectionId, true)

      return newTokens.access_token
    } catch (error) {
      // Log failed refresh
      await logTokenRefresh(
        connectionId,
        false,
        error instanceof Error ? error.message : 'Unknown error'
      )
      throw error
    }
  }

  return tokens.accessToken
}

/**
 * Log token refresh event
 */
async function logTokenRefresh(
  connectionId: string,
  success: boolean,
  errorMessage?: string
): Promise<void> {
  const supabase = await createClient()

  await supabase.from('google_calendar_push_logs' as any).insert({
    connection_id: connectionId,
    event_type: success ? 'token_refreshed' : 'token_refresh_failed',
    success,
    error_message: errorMessage,
  })
}

// ============================================================================
// OAuth State Management
// ============================================================================

import { SignJWT, jwtVerify } from 'jose'

const STATE_SECRET = new TextEncoder().encode(
  process.env.GOOGLE_CALENDAR_ENCRYPTION_KEY || 'fallback-secret-for-dev'
)

/**
 * Generate signed OAuth state token
 */
export async function generateOAuthState(params: {
  organizationId: string
  redirectUrl?: string
}): Promise<string> {
  const token = await new SignJWT({
    org: params.organizationId,
    redirect: params.redirectUrl,
    nonce: crypto.randomUUID(),
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('10m') // State valid for 10 minutes
    .sign(STATE_SECRET)

  return token
}

/**
 * Verify and decode OAuth state token
 */
export async function verifyOAuthState(state: string): Promise<{
  organizationId: string
  redirectUrl?: string
} | null> {
  try {
    const { payload } = await jwtVerify(state, STATE_SECRET)

    return {
      organizationId: payload.org as string,
      redirectUrl: payload.redirect as string | undefined,
    }
  } catch (error) {
    console.error('Invalid OAuth state:', error)
    return null
  }
}

// ============================================================================
// Push Channel Token
// ============================================================================

/**
 * Generate signed push channel token for webhook verification
 */
export async function generatePushChannelToken(
  organizationId: string
): Promise<string> {
  const token = await new SignJWT({
    org: organizationId,
    type: 'push',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8d') // Valid for 8 days (channel max is 7)
    .sign(STATE_SECRET)

  return token
}

/**
 * Verify push channel token
 */
export async function verifyPushChannelToken(
  token: string
): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, STATE_SECRET)
    return payload.org as string
  } catch {
    return null
  }
}
