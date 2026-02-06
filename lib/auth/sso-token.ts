/**
 * Yi Connect SSO Token Verification
 *
 * Verifies and decodes JWT tokens from Yi Connect using RS256 algorithm.
 * The public key is provided by Yi Connect and stored in environment variables.
 */

import { jwtVerify, importSPKI } from 'jose'
import type { SSOTokenPayload, SSOVerificationResult } from './sso-types'

/**
 * Get the RSA public key for token verification
 * The key is Base64 encoded in environment variable
 */
async function getPublicKey() {
  const publicKeyBase64 = process.env.YI_CONNECT_SSO_PUBLIC_KEY

  if (!publicKeyBase64) {
    throw new Error('YI_CONNECT_SSO_PUBLIC_KEY environment variable is not set')
  }

  // Decode Base64 to get PEM formatted key
  const publicKeyPem = Buffer.from(publicKeyBase64, 'base64').toString('utf-8')

  // Import the PEM key for use with jose
  return importSPKI(publicKeyPem, 'RS256')
}

/**
 * Verify and decode an SSO token from Yi Connect
 *
 * @param token - JWT token string from Yi Connect
 * @returns Verification result with decoded payload or error
 */
export async function verifySSOToken(
  token: string
): Promise<SSOVerificationResult> {
  try {
    // Get the public key
    const publicKey = await getPublicKey()

    // Verify and decode the token
    const { payload } = await jwtVerify(token, publicKey, {
      issuer: 'yi-connect',
      audience: 'yi-creative',
    })

    // Validate required fields
    if (!payload.sub || typeof payload.sub !== 'string') {
      return { success: false, error: 'Missing or invalid user ID (sub)' }
    }

    if (!payload.email || typeof payload.email !== 'string') {
      return { success: false, error: 'Missing or invalid email' }
    }

    if (!payload.name || typeof payload.name !== 'string') {
      return { success: false, error: 'Missing or invalid name' }
    }

    if (!Array.isArray(payload.chapters)) {
      return { success: false, error: 'Missing or invalid chapters array' }
    }

    // Validate each chapter
    for (const chapter of payload.chapters) {
      if (
        typeof chapter !== 'object' ||
        !chapter.chapter_id ||
        !chapter.role
      ) {
        return { success: false, error: 'Invalid chapter data in token' }
      }
    }

    // Cast to our expected type
    const ssoPayload: SSOTokenPayload = {
      sub: payload.sub,
      email: payload.email,
      name: payload.name,
      avatar_url: payload.avatar_url as string | undefined,
      chapters: payload.chapters as SSOTokenPayload['chapters'],
      event_id: payload.event_id as string | undefined,
      redirect_to: payload.redirect_to as string | undefined,
      iss: 'yi-connect',
      aud: 'yi-creative',
      iat: payload.iat as number,
      exp: payload.exp as number,
    }

    return { success: true, payload: ssoPayload }
  } catch (error) {
    // Handle specific JWT errors
    if (error instanceof Error) {
      if (error.message.includes('expired')) {
        return { success: false, error: 'Token has expired' }
      }
      if (error.message.includes('signature')) {
        return { success: false, error: 'Invalid token signature' }
      }
      if (error.message.includes('issuer')) {
        return { success: false, error: 'Invalid token issuer' }
      }
      if (error.message.includes('audience')) {
        return { success: false, error: 'Invalid token audience' }
      }
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Unknown token verification error' }
  }
}

/**
 * Verify webhook signature from Yi Connect
 *
 * Yi Connect signs webhook requests using HMAC-SHA256.
 * The signature is in the X-Yi-Connect-Signature header.
 *
 * @param payload - Raw request body as string
 * @param signature - Signature from X-Yi-Connect-Signature header
 * @returns true if signature is valid
 */
export async function verifyWebhookSignature(
  payload: string,
  signature: string
): Promise<boolean> {
  const secret = process.env.YI_CONNECT_WEBHOOK_SECRET

  if (!secret) {
    console.error('YI_CONNECT_WEBHOOK_SECRET environment variable is not set')
    return false
  }

  try {
    // Create HMAC-SHA256 signature
    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )

    const signatureBuffer = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(payload)
    )

    // Convert to hex string
    const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')

    // Constant-time comparison to prevent timing attacks
    if (signature.length !== expectedSignature.length) {
      return false
    }

    let result = 0
    for (let i = 0; i < signature.length; i++) {
      result |= signature.charCodeAt(i) ^ expectedSignature.charCodeAt(i)
    }

    return result === 0
  } catch (error) {
    console.error('Webhook signature verification error:', error)
    return false
  }
}

/**
 * Get the Yi Connect login URL for redirecting unauthenticated users
 *
 * @param redirectTo - Path to redirect to after login (optional)
 * @returns Full Yi Connect login URL with redirect parameter
 */
export function getYiConnectLoginUrl(redirectTo?: string): string {
  const baseUrl =
    process.env.YI_CONNECT_LOGIN_URL || 'https://yi-connect.vercel.app/login'

  if (redirectTo) {
    const url = new URL(baseUrl)
    url.searchParams.set('redirect_to', redirectTo)
    return url.toString()
  }

  return baseUrl
}

/**
 * Check if SSO is properly configured
 */
export function isSSOConfigured(): boolean {
  return (
    !!process.env.YI_CONNECT_SSO_PUBLIC_KEY &&
    !!process.env.YI_CONNECT_LOGIN_URL
  )
}
