/**
 * Yi Connect SSO Types
 *
 * Type definitions for Yi Connect → Yi Creative SSO integration.
 * These types match the token structure provided by Yi Connect.
 */

/**
 * Yi Connect role names (7-level hierarchy)
 */
export type YiConnectRole =
  | 'super_admin' // Level 7 - Platform super admin
  | 'national_admin' // Level 6 - National level admin
  | 'executive_member' // Level 5 - Full chapter access
  | 'chair' // Level 4 - Chapter chair
  | 'co_chair' // Level 3 - Co-chair
  | 'ec_member' // Level 2 - EC member
  | 'member' // Level 1 - Basic member

/**
 * Yi Creative role names (4-level hierarchy)
 */
export type YiCreativeRole = 'super_admin' | 'admin' | 'editor' | 'viewer'

/**
 * Chapter information in SSO token
 */
export interface SSOChapter {
  chapter_id: string
  chapter_name: string
  chapter_location: string
  role: string // Yi Connect role name
  hierarchy_level: number // 1-7
}

/**
 * SSO Token payload from Yi Connect
 * This is the decoded JWT payload
 */
export interface SSOTokenPayload {
  // User identification
  sub: string // Yi Connect user UUID
  email: string
  name: string
  avatar_url?: string

  // Chapter/Role context
  chapters: SSOChapter[]

  // Optional context
  event_id?: string // If from "Create Poster" button
  redirect_to?: string // Post-SSO redirect path

  // Token metadata
  iss: 'yi-connect'
  aud: 'yi-creative'
  iat: number
  exp: number
}

/**
 * Result of SSO token verification
 */
export interface SSOVerificationResult {
  success: boolean
  payload?: SSOTokenPayload
  error?: string
}

/**
 * User provisioning data for creating/updating Yi Creative user
 */
export interface UserProvisioningData {
  yi_connect_user_id: string
  email: string
  full_name: string
  avatar_url?: string
}

/**
 * Organization provisioning data for creating/updating Yi Creative organization
 */
export interface OrganizationProvisioningData {
  yi_connect_chapter_id: string
  name: string
  location: string
  slug: string
}

/**
 * Membership provisioning data
 */
export interface MembershipProvisioningData {
  user_id: string
  organization_id: string
  role: YiCreativeRole
}

/**
 * Webhook event types from Yi Connect
 */
export type YiConnectWebhookEvent =
  | 'user.created'
  | 'user.updated'
  | 'chapter.created'
  | 'chapter.updated'
  | 'member.added'
  | 'member.role_changed'
  | 'member.removed'

/**
 * Base webhook payload
 */
export interface WebhookPayloadBase {
  event: YiConnectWebhookEvent
  timestamp: string
}

/**
 * User webhook payload
 */
export interface UserWebhookPayload extends WebhookPayloadBase {
  event: 'user.created' | 'user.updated'
  data: {
    user_id: string
    email: string
    name: string
    avatar_url?: string
  }
}

/**
 * Chapter webhook payload
 */
export interface ChapterWebhookPayload extends WebhookPayloadBase {
  event: 'chapter.created' | 'chapter.updated'
  data: {
    chapter_id: string
    name: string
    location: string
  }
}

/**
 * Member webhook payload
 */
export interface MemberWebhookPayload extends WebhookPayloadBase {
  event: 'member.added' | 'member.role_changed' | 'member.removed'
  data: {
    user_id: string
    chapter_id: string
    role?: string
    old_role?: string
    new_role?: string
  }
}

export type YiConnectWebhookPayload =
  | UserWebhookPayload
  | ChapterWebhookPayload
  | MemberWebhookPayload
