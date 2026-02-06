/**
 * Yi Connect SSO User Provisioning
 *
 * Handles creating and updating users, organizations, and memberships
 * when users authenticate via Yi Connect SSO.
 */

import { createClient } from '@/lib/supabase/server'
import { mapRole } from './role-mapping'
import type {
  SSOTokenPayload,
  SSOChapter,
  UserProvisioningData,
  OrganizationProvisioningData,
  MembershipProvisioningData,
} from './sso-types'

/**
 * Result of SSO provisioning
 */
export interface ProvisioningResult {
  success: boolean
  userId?: string
  primaryOrganizationId?: string
  error?: string
}

/**
 * Generate a URL-safe slug from a chapter name
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

/**
 * Provision a user from SSO token
 *
 * Creates or updates the user profile and all their organization memberships.
 * Returns the user ID and primary organization ID for session creation.
 */
export async function provisionUserFromSSO(
  tokenPayload: SSOTokenPayload
): Promise<ProvisioningResult> {
  try {
    const supabase = await createClient()

    // 1. Find or create user profile
    const userId = await provisionUser(supabase, {
      yi_connect_user_id: tokenPayload.sub,
      email: tokenPayload.email,
      full_name: tokenPayload.name,
      avatar_url: tokenPayload.avatar_url,
    })

    if (!userId) {
      return { success: false, error: 'Failed to provision user' }
    }

    // 2. Provision each chapter as an organization
    let primaryOrganizationId: string | undefined

    for (const chapter of tokenPayload.chapters) {
      const orgId = await provisionOrganization(supabase, {
        yi_connect_chapter_id: chapter.chapter_id,
        name: chapter.chapter_name,
        location: chapter.chapter_location,
        slug: generateSlug(chapter.chapter_name),
      })

      if (orgId) {
        // Set first org as primary
        if (!primaryOrganizationId) {
          primaryOrganizationId = orgId
        }

        // 3. Create/update membership with mapped role
        const creativeRole = mapRole(chapter.role, chapter.hierarchy_level)
        await provisionMembership(supabase, {
          user_id: userId,
          organization_id: orgId,
          role: creativeRole,
        })
      }
    }

    return {
      success: true,
      userId,
      primaryOrganizationId,
    }
  } catch (error) {
    console.error('SSO provisioning error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown provisioning error',
    }
  }
}

/**
 * Provision (create or update) a user profile
 *
 * Note: This creates a user_profiles record. The auth.users record
 * is created separately via Supabase's signInWithIdToken or similar.
 */
async function provisionUser(
  supabase: Awaited<ReturnType<typeof createClient>>,
  data: UserProvisioningData
): Promise<string | null> {
  try {
    // Check if user already exists by yi_connect_user_id (future field)
    // For now, check by email since we haven't added the yi_connect field yet
    const { data: existingProfile, error: findError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('id', data.yi_connect_user_id) // Will match auth.users.id
      .single()

    if (existingProfile) {
      // Update existing profile
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          full_name: data.full_name,
          avatar_url: data.avatar_url,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingProfile.id)

      if (updateError) {
        console.error('Failed to update user profile:', updateError)
      }

      return existingProfile.id
    }

    // Create new profile
    // Note: The auth.users record must be created first (via Supabase admin API)
    // For now, we'll use upsert to handle both cases
    const { data: newProfile, error: insertError } = await supabase
      .from('user_profiles')
      .upsert({
        id: data.yi_connect_user_id, // Use Yi Connect user ID as the profile ID
        full_name: data.full_name,
        avatar_url: data.avatar_url,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (insertError) {
      console.error('Failed to create user profile:', insertError)
      return null
    }

    return newProfile?.id || data.yi_connect_user_id
  } catch (error) {
    console.error('User provisioning error:', error)
    return null
  }
}

/**
 * Provision (create or update) an organization from chapter data
 */
async function provisionOrganization(
  supabase: Awaited<ReturnType<typeof createClient>>,
  data: OrganizationProvisioningData
): Promise<string | null> {
  try {
    // Check if organization already exists by slug or name
    const { data: existingOrg, error: findError } = await supabase
      .from('organizations')
      .select('id')
      .or(`slug.eq.${data.slug},name.eq.${data.name}`)
      .single()

    if (existingOrg) {
      // Update existing organization name if needed
      const { error: updateError } = await supabase
        .from('organizations')
        .update({
          name: data.name,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingOrg.id)

      if (updateError) {
        console.error('Failed to update organization:', updateError)
      }

      return existingOrg.id
    }

    // Create new organization
    const { data: newOrg, error: insertError } = await supabase
      .from('organizations')
      .insert({
        name: data.name,
        slug: data.slug,
        type: 'yi_chapter', // All Yi Connect chapters are yi_chapter type
        credits_balance: 100, // Initial credits for new chapter
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (insertError) {
      // If slug conflict, try with location suffix
      if (insertError.code === '23505') {
        const altSlug = `${data.slug}-${data.location.toLowerCase()}`
        const { data: retryOrg, error: retryError } = await supabase
          .from('organizations')
          .insert({
            name: data.name,
            slug: altSlug,
            type: 'yi_chapter',
            credits_balance: 100,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select('id')
          .single()

        if (retryError) {
          console.error('Failed to create organization (retry):', retryError)
          return null
        }

        return retryOrg?.id || null
      }

      console.error('Failed to create organization:', insertError)
      return null
    }

    return newOrg?.id || null
  } catch (error) {
    console.error('Organization provisioning error:', error)
    return null
  }
}

/**
 * Provision (create or update) organization membership
 */
async function provisionMembership(
  supabase: Awaited<ReturnType<typeof createClient>>,
  data: MembershipProvisioningData
): Promise<boolean> {
  try {
    // Check if membership already exists
    const { data: existingMember, error: findError } = await supabase
      .from('organization_members')
      .select('id, role')
      .eq('user_id', data.user_id)
      .eq('organization_id', data.organization_id)
      .single()

    if (existingMember) {
      // Update role if changed
      if (existingMember.role !== data.role) {
        const { error: updateError } = await supabase
          .from('organization_members')
          .update({ role: data.role })
          .eq('id', existingMember.id)

        if (updateError) {
          console.error('Failed to update membership role:', updateError)
          return false
        }
      }
      return true
    }

    // Create new membership
    const { error: insertError } = await supabase
      .from('organization_members')
      .insert({
        user_id: data.user_id,
        organization_id: data.organization_id,
        role: data.role,
        joined_at: new Date().toISOString(),
      })

    if (insertError) {
      console.error('Failed to create membership:', insertError)
      return false
    }

    return true
  } catch (error) {
    console.error('Membership provisioning error:', error)
    return false
  }
}

/**
 * Remove a user's membership from an organization
 * Used when handling member.removed webhook events
 */
export async function removeMembership(
  userId: string,
  organizationId: string
): Promise<boolean> {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('organization_members')
      .delete()
      .eq('user_id', userId)
      .eq('organization_id', organizationId)

    if (error) {
      console.error('Failed to remove membership:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Remove membership error:', error)
    return false
  }
}
