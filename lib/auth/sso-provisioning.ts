/**
 * Yi Connect SSO User Provisioning
 *
 * Handles creating and updating users, organizations, and memberships
 * when users authenticate via Yi Connect SSO.
 */

import { createClient } from '@supabase/supabase-js'
import { mapRoleForMembership } from './role-mapping'
import type {
  SSOTokenPayload,
  SSOEventData,
  UserProvisioningData,
  OrganizationProvisioningData,
  MembershipProvisioningData,
} from './sso-types'

// Create admin client with service role for provisioning (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

type SupabaseAdminClient = typeof supabaseAdmin

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
 *
 * @param tokenPayload - The decoded SSO token
 * @param resolvedAuthUserId - Optional: The actual auth.users ID (may differ from Yi Connect ID for existing users)
 */
export async function provisionUserFromSSO(
  tokenPayload: SSOTokenPayload,
  resolvedAuthUserId?: string
): Promise<ProvisioningResult> {
  try {
    // Use resolved auth ID if provided, otherwise fall back to Yi Connect ID
    const effectiveUserId = resolvedAuthUserId || tokenPayload.sub

    console.log('[SSO Provisioning] Starting provisioning for:', {
      sub: tokenPayload.sub,
      email: tokenPayload.email,
      name: tokenPayload.name,
      chapters: tokenPayload.chapters.length,
      effectiveUserId, // This is what we'll actually use
      usingResolvedId: !!resolvedAuthUserId,
    })

    // 1. Find or create user profile using the EFFECTIVE user ID (from auth.users)
    // Use admin client to bypass RLS policies
    const userId = await provisionUser(supabaseAdmin, {
      yi_connect_user_id: tokenPayload.sub, // Keep original Yi Connect ID for reference
      email: tokenPayload.email,
      full_name: tokenPayload.name,
      avatar_url: tokenPayload.avatar_url,
    }, effectiveUserId)

    if (!userId) {
      console.error('[SSO Provisioning] Failed to provision user - userId is null')
      return { success: false, error: 'Failed to provision user profile' }
    }

    console.log('[SSO Provisioning] User provisioned with ID:', userId)

    // 2. Provision each chapter as an organization
    let primaryOrganizationId: string | undefined

    for (const chapter of tokenPayload.chapters) {
      const orgId = await provisionOrganization(supabaseAdmin, {
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
        // CRITICAL: Use mapRoleForMembership to ensure valid org role
        // (organization_members only allows: admin, editor, viewer)
        const creativeRole = mapRoleForMembership(chapter.role, chapter.hierarchy_level)
        await provisionMembership(supabaseAdmin, {
          user_id: userId,
          organization_id: orgId,
          role: creativeRole,
        })
      }
    }

    // 3.5 Fallback: If no chapters in token but user has existing membership, use that org
    // This handles cases where Yi Connect sends empty chapters array
    if (!primaryOrganizationId && tokenPayload.event_data && userId) {
      console.log('[SSO Provisioning] No chapters in token, checking existing memberships...')

      const { data: existingMembership } = await supabaseAdmin
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', userId)
        .limit(1)
        .single()

      if (existingMembership?.organization_id) {
        primaryOrganizationId = existingMembership.organization_id
        console.log('[SSO Provisioning] Using existing org membership:', primaryOrganizationId)
      }
    }

    // 4. Provision event if event_data is present in the token
    // This allows on-the-fly event creation when clicking "Create Poster" from Yi Connect
    if (tokenPayload.event_data && primaryOrganizationId) {
      console.log('[SSO Provisioning] Event data found in token, provisioning event...')
      await provisionEventFromSSO(
        supabaseAdmin,
        tokenPayload.event_data,
        primaryOrganizationId
      )
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
 *
 * @param supabase - Supabase client
 * @param data - User data from SSO token
 * @param effectiveUserId - The actual auth.users ID to use (may differ from Yi Connect ID)
 */
async function provisionUser(
  supabase: SupabaseAdminClient,
  data: UserProvisioningData,
  effectiveUserId: string
): Promise<string | null> {
  try {
    console.log('[SSO Provisioning] provisionUser called with:', {
      yi_connect_user_id: data.yi_connect_user_id,
      email: data.email,
      full_name: data.full_name,
      effectiveUserId, // This is what we'll use for user_profiles.id
    })

    // Check if user profile already exists by the EFFECTIVE user ID (from auth.users)
    const { data: existingProfile, error: findError } = await supabase
      .from('user_profiles')
      .select('id, yi_connect_user_id')
      .eq('id', effectiveUserId)
      .single()

    console.log('[SSO Provisioning] existingProfile lookup result:', { existingProfile, findError })

    if (existingProfile) {
      // Update existing profile - also link yi_connect_user_id if not already set
      const updateData: Record<string, unknown> = {
        full_name: data.full_name,
        avatar_url: data.avatar_url,
        updated_at: new Date().toISOString(),
      }

      // Link Yi Connect ID if not already set
      if (!existingProfile.yi_connect_user_id && data.yi_connect_user_id) {
        updateData.yi_connect_user_id = data.yi_connect_user_id
        updateData.yi_connect_synced_at = new Date().toISOString()
        updateData.sso_provider = 'yi-connect'
        console.log('[SSO Provisioning] Linking Yi Connect ID to existing profile')
      }

      const { error: updateError } = await supabase
        .from('user_profiles')
        .update(updateData)
        .eq('id', existingProfile.id)

      if (updateError) {
        console.error('[SSO Provisioning] Failed to update user profile:', updateError)
      } else {
        console.log('[SSO Provisioning] Profile updated successfully')
      }

      return existingProfile.id
    }

    // Create new profile using the EFFECTIVE user ID (which matches auth.users.id)
    console.log('[SSO Provisioning] Attempting upsert with effective id:', effectiveUserId)

    const { data: newProfile, error: insertError } = await supabase
      .from('user_profiles')
      .upsert({
        id: effectiveUserId, // Use the EFFECTIVE user ID (from auth.users)
        full_name: data.full_name,
        avatar_url: data.avatar_url,
        yi_connect_user_id: data.yi_connect_user_id, // Store Yi Connect ID for reference
        yi_connect_synced_at: new Date().toISOString(),
        sso_provider: 'yi-connect',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (insertError) {
      console.error('[SSO Provisioning] Failed to create user profile:', {
        error: insertError,
        code: insertError.code,
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
      })
      return null
    }

    console.log('[SSO Provisioning] Upsert successful:', newProfile)
    return newProfile?.id || effectiveUserId
  } catch (error) {
    console.error('User provisioning error:', error)
    return null
  }
}

/**
 * Provision (create or update) an organization from chapter data
 */
async function provisionOrganization(
  supabase: SupabaseAdminClient,
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
  supabase: SupabaseAdminClient,
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
 * Provision (create or update) a synced event from SSO token
 * Creates event in synced_events table for on-the-fly event creation
 */
async function provisionEventFromSSO(
  supabase: SupabaseAdminClient,
  eventData: SSOEventData,
  organizationId: string
): Promise<string | null> {
  try {
    console.log('[SSO Provisioning] provisionEvent called with:', {
      event_id: eventData.event_id,
      event_name: eventData.event_name,
      organizationId,
    })

    // Check if event already exists by external_id and source_app_id
    // CRITICAL: Use the actual database unique constraint (external_id, source_app_id)
    // NOT (external_id, organization_id) - events can exist across multiple orgs
    const { data: existingEvent } = await supabase
      .from('synced_events')
      .select('id, organization_id')
      .eq('external_id', eventData.event_id)
      .eq('source_app_id', 'yi-connect')
      .single()

    if (existingEvent) {
      // Update existing event (also update organization_id if different)
      const { error: updateError } = await supabase
        .from('synced_events')
        .update({
          organization_id: organizationId, // Update to current user's org
          event_name: eventData.event_name,
          event_date: eventData.event_date,
          event_time: eventData.event_time,
          venue: eventData.venue,
          venue_address: eventData.venue_address,
          city: eventData.city,
          description: eventData.description,
          tagline: eventData.tagline,
          banner_image_url: eventData.banner_image_url,
          event_type: eventData.event_type,
          chapter_name: eventData.chapter_name,
          chapter_location: eventData.chapter_location,
          speakers: eventData.speakers || null,
          synced_at: new Date().toISOString(),
        })
        .eq('id', existingEvent.id)

      if (updateError) {
        console.error('[SSO Provisioning] Failed to update event:', updateError)
      } else {
        console.log('[SSO Provisioning] Event updated:', existingEvent.id,
          existingEvent.organization_id !== organizationId
            ? `(org changed: ${existingEvent.organization_id} → ${organizationId})`
            : '(same org)')
      }

      return existingEvent.id
    }

    // Create new event
    const { data: newEvent, error: insertError } = await supabase
      .from('synced_events')
      .insert({
        external_id: eventData.event_id,
        organization_id: organizationId,
        source_app_id: 'yi-connect',
        event_name: eventData.event_name,
        event_date: eventData.event_date,
        event_time: eventData.event_time,
        venue: eventData.venue,
        venue_address: eventData.venue_address,
        city: eventData.city,
        description: eventData.description,
        tagline: eventData.tagline,
        banner_image_url: eventData.banner_image_url,
        event_type: eventData.event_type,
        chapter_name: eventData.chapter_name,
        chapter_location: eventData.chapter_location,
        speakers: eventData.speakers || null,
        synced_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (insertError) {
      console.error('[SSO Provisioning] Failed to create event:', insertError)
      return null
    }

    console.log('[SSO Provisioning] Event created:', newEvent?.id)
    return newEvent?.id || null
  } catch (error) {
    console.error('[SSO Provisioning] Event provisioning error:', error)
    return null
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
    const { error } = await supabaseAdmin
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
