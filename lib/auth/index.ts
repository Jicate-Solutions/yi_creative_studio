/**
 * Yi Connect SSO Authentication
 *
 * This module provides SSO integration with Yi Connect.
 *
 * @example
 * // Verify an SSO token
 * import { verifySSOToken } from '@/lib/auth'
 * const result = await verifySSOToken(token)
 *
 * @example
 * // Map Yi Connect role to Yi Creative role
 * import { mapRole } from '@/lib/auth'
 * const creativeRole = mapRole('chair', 4) // Returns 'admin'
 */

// Types
export type {
  YiConnectRole,
  YiCreativeRole,
  SSOChapter,
  SSOTokenPayload,
  SSOVerificationResult,
  UserProvisioningData,
  OrganizationProvisioningData,
  MembershipProvisioningData,
  YiConnectWebhookEvent,
  YiConnectWebhookPayload,
} from './sso-types'

// Role mapping
export {
  mapRole,
  mapRoleByName,
  mapRoleByLevel,
  getHighestRole,
  isPlatformRole,
  isAdminRole,
  canCreateContent,
  getRoleDisplayName,
  YI_CONNECT_ROLE_DISPLAY,
} from './role-mapping'

// Token verification
export {
  verifySSOToken,
  verifyWebhookSignature,
  getYiConnectLoginUrl,
  isSSOConfigured,
} from './sso-token'

// User provisioning
export {
  provisionUserFromSSO,
  removeMembership,
  type ProvisioningResult,
} from './sso-provisioning'
