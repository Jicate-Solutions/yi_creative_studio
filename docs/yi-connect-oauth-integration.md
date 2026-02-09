# Yi Creative Studio - OAuth 2.0 Integration Guide for Yi Connect

**Version:** 1.0
**Date:** February 9, 2026
**Base URL:** `https://yi-creative-studio.vercel.app`

---

## Overview

Yi Creative Studio now supports OAuth 2.0 Authorization Code flow for multi-tenant integration with Yi Connect. This enables per-chapter SSO key registration and organization-level access control.

---

## OAuth 2.0 Flow

```
┌─────────────┐                                    ┌───────────────────┐
│  Yi Connect │                                    │ Yi Creative Studio│
└──────┬──────┘                                    └─────────┬─────────┘
       │                                                     │
       │  1. Redirect admin to /oauth/authorize              │
       │────────────────────────────────────────────────────>│
       │                                                     │
       │  2. Admin selects organization & approves           │
       │<────────────────────────────────────────────────────│
       │                                                     │
       │  3. Redirect back with authorization code           │
       │<────────────────────────────────────────────────────│
       │                                                     │
       │  4. Exchange code for access token                  │
       │     POST /api/oauth/token                           │
       │────────────────────────────────────────────────────>│
       │                                                     │
       │  5. Return access_token & refresh_token             │
       │<────────────────────────────────────────────────────│
       │                                                     │
       │  6. Get organization info                           │
       │     GET /api/organizations/me                       │
       │────────────────────────────────────────────────────>│
       │                                                     │
       │  7. Return organization details                     │
       │<────────────────────────────────────────────────────│
       │                                                     │
       │  8. Register SSO public key                         │
       │     POST /api/oauth/register-keys                   │
       │────────────────────────────────────────────────────>│
       │                                                     │
       │  9. Confirm key registration                        │
       │<────────────────────────────────────────────────────│
       │                                                     │
```

---

## Endpoints

### 1. Authorization Page

**URL:** `GET /oauth/authorize`

Redirects the Yi Creative Studio admin to a consent screen where they select their organization and approve Yi Connect access.

**Query Parameters:**
| Parameter | Required | Description |
|-----------|----------|-------------|
| `client_id` | Yes | Must be `yi-connect` |
| `redirect_uri` | Yes | Yi Connect callback URL |
| `response_type` | Yes | Must be `code` |
| `scope` | No | Default: `organization:read` |
| `state` | Recommended | CSRF protection token |

**Example:**
```
https://yi-creative-studio.vercel.app/oauth/authorize?client_id=yi-connect&redirect_uri=https://yi-connect-app.vercel.app/api/yi-creative/callback&response_type=code&state=random-csrf-token
```

**Success Response:**
Redirects to `redirect_uri` with:
```
https://yi-connect-app.vercel.app/api/yi-creative/callback?code=AUTH_CODE&state=random-csrf-token
```

**Error Response:**
Redirects to `redirect_uri` with:
```
https://yi-connect-app.vercel.app/api/yi-creative/callback?error=access_denied&error_description=User%20denied%20access
```

---

### 2. Token Exchange

**URL:** `POST /api/oauth/token`

Exchanges the authorization code for access and refresh tokens.

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "grant_type": "authorization_code",
  "code": "AUTH_CODE_FROM_CALLBACK",
  "client_id": "yi-connect",
  "redirect_uri": "https://yi-connect-app.vercel.app/api/yi-creative/callback"
}
```

**Success Response (200):**
```json
{
  "access_token": "64-char-hex-string",
  "refresh_token": "64-char-hex-string",
  "expires_in": 3600,
  "token_type": "Bearer",
  "scope": "organization:read"
}
```

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 400 | `unsupported_grant_type` | Only `authorization_code` is supported |
| 400 | `invalid_request` | Missing required parameters |
| 400 | `invalid_client` | Unknown client_id |
| 400 | `invalid_grant` | Invalid, expired, or already-used code |
| 500 | `server_error` | Internal server error |

---

### 3. Get Organization Info

**URL:** `GET /api/organizations/me`

Returns information about the organization associated with the access token.

**Headers:**
```
Authorization: Bearer ACCESS_TOKEN
```

**Success Response (200):**
```json
{
  "id": "bd21dd9d-2f08-478f-a457-74f014d5d6d1",
  "name": "JKKN Institutions",
  "slug": "jkkn-institutions",
  "type": "chapter",
  "email": "automation@jkkn.ac.in",
  "logo_url": "https://example.com/logo.png",
  "created_at": "2026-01-15T10:30:00Z"
}
```

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 401 | `missing_token` | Authorization header required |
| 401 | `invalid_token` | Invalid, expired, or revoked token |
| 404 | `not_found` | Organization not found |

---

### 4. Register SSO Keys

**URL:** `POST /api/oauth/register-keys`

Stores the RSA public key for SSO token verification. This enables multi-tenant SSO where each Yi Connect chapter has its own key pair.

**Headers:**
```
Authorization: Bearer ACCESS_TOKEN
Content-Type: application/json
```

**Request Body:**
```json
{
  "chapter_id": "yi-connect-chapter-uuid",
  "chapter_name": "Yi Chennai",
  "public_key": "LS0tLS1CRUdJTiBQVUJMSUMgS0VZLS0tLS0K...",
  "webhook_secret": "shared-secret-for-webhooks"
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `chapter_id` | Yes | Yi Connect chapter UUID |
| `chapter_name` | No | Human-readable chapter name |
| `public_key` | Yes | Base64-encoded RSA public key (PEM format) |
| `webhook_secret` | No | HMAC secret for webhook signatures |

**Public Key Format:**
The `public_key` must be a Base64-encoded PEM public key:
```
-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...
-----END PUBLIC KEY-----
```

Encode to Base64 before sending:
```javascript
const publicKeyBase64 = Buffer.from(publicKeyPem).toString('base64')
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Keys registered successfully"
}
```

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 400 | `invalid_request` | Missing chapter_id or public_key |
| 400 | `invalid_request` | Invalid public key format |
| 401 | `missing_token` | Authorization header required |
| 401 | `invalid_token` | Invalid or expired token |
| 500 | `server_error` | Failed to store keys |

---

## SSO Token Verification

After registering keys, Yi Creative Studio will automatically use the per-chapter public key for SSO token verification:

1. Token arrives at `/api/auth/sso`
2. System extracts `chapter_id` from token payload (without verification)
3. Looks up public key in `yi_connect_integrations` table by chapter_id
4. Falls back to `YI_CONNECT_SSO_PUBLIC_KEY` env var if not found
5. Verifies token signature with RS256 algorithm

**SSO Token Requirements:**
```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "name": "User Name",
  "avatar_url": "https://...",
  "chapters": [
    {
      "chapter_id": "yi-connect-chapter-uuid",
      "chapter_name": "Yi Chennai",
      "role": "member"
    }
  ],
  "event_id": "optional-event-uuid",
  "event_data": { ... },
  "redirect_to": "/create",
  "iss": "yi-connect",
  "aud": "yi-creative",
  "iat": 1707494400,
  "exp": 1707498000
}
```

---

## Configuration for Yi Connect

### Environment Variables

Update your Yi Connect `.env.local`:

```env
# Yi Creative Studio Integration
YI_STUDIO_WEBHOOK_URL=https://yi-creative-studio.vercel.app/api/webhooks/events
YI_STUDIO_WEBHOOK_SECRET=your-webhook-secret
YI_STUDIO_ORG_ID=bd21dd9d-2f08-478f-a457-74f014d5d6d1
NEXT_PUBLIC_YI_STUDIO_URL=https://yi-creative-studio.vercel.app

# SSO Configuration
YI_CREATIVE_SSO_PRIVATE_KEY="base64-encoded-private-key"
YI_CREATIVE_SSO_URL="https://yi-creative-studio.vercel.app/api/auth/sso"
YI_CREATIVE_WEBHOOK_SECRET="your-webhook-secret"
YI_CREATIVE_WEBHOOK_URL="https://yi-connect-app.vercel.app/api/webhooks/yi-creative"
```

> **IMPORTANT:** The `YI_STUDIO_ORG_ID` must be a valid organization UUID from Yi Creative Studio, not a user ID. The current production value is `bd21dd9d-2f08-478f-a457-74f014d5d6d1` (JKKN Institutions).

### OAuth Client Configuration

Yi Connect is pre-registered as an OAuth client:
- **Client ID:** `yi-connect`
- **Allowed Redirect URIs:**
  - `https://yi-connect-app.vercel.app/api/yi-creative/callback`
  - `http://localhost:3000/api/yi-creative/callback` (development)

---

## Token Lifetimes

| Token Type | Lifetime |
|------------|----------|
| Authorization Code | 10 minutes |
| Access Token | 1 hour |
| Refresh Token | 30 days |

---

## Integration Checklist

- [ ] Implement OAuth authorization redirect
- [ ] Handle callback with authorization code
- [ ] Exchange code for tokens via `/api/oauth/token`
- [ ] Store access_token and refresh_token securely
- [ ] Fetch organization info via `/api/organizations/me`
- [ ] Generate RSA key pair for SSO
- [ ] Register public key via `/api/oauth/register-keys`
- [ ] Implement SSO token generation with RS256 signing
- [ ] Update `YI_STUDIO_ORG_ID` with correct organization UUID

---

## Support

For integration support, contact the Yi Creative Studio development team.

**API Base URL:** `https://yi-creative-studio.vercel.app`
**OAuth Consent URL:** `https://yi-creative-studio.vercel.app/oauth/authorize`
