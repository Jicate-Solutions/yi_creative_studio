/**
 * Yi Connect Webhook Receiver
 *
 * Receives webhook events from Yi Connect for user, chapter, and member sync.
 * Verifies webhook signature and processes events to keep Yi Creative in sync.
 *
 * Events handled:
 * - user.created / user.updated - Sync user profiles
 * - chapter.created / chapter.updated - Sync organizations
 * - member.added / member.role_changed / member.removed - Sync memberships
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyWebhookSignature } from '@/lib/auth/sso-token'
import { mapRole } from '@/lib/auth/role-mapping'
import type {
  YiConnectWebhookPayload,
  UserWebhookPayload,
  ChapterWebhookPayload,
  MemberWebhookPayload,
} from '@/lib/auth/sso-types'

// Use service role client for webhook operations (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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
 * Handle user.created and user.updated events
 */
async function handleUserEvent(payload: UserWebhookPayload): Promise<void> {
  const { data } = payload

  // Upsert user profile
  const { error } = await supabaseAdmin.from('user_profiles').upsert(
    {
      id: data.user_id,
      full_name: data.name,
      avatar_url: data.avatar_url || null,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: 'id',
      ignoreDuplicates: false,
    }
  )

  if (error) {
    console.error('[Yi Connect Webhook] Failed to sync user:', error)
    throw new Error(`Failed to sync user: ${error.message}`)
  }

  console.log(`[Yi Connect Webhook] User synced: ${data.email}`)
}

/**
 * Handle chapter.created and chapter.updated events
 */
async function handleChapterEvent(payload: ChapterWebhookPayload): Promise<void> {
  const { data } = payload
  const slug = generateSlug(data.name)

  // Check if organization already exists
  const { data: existingOrg } = await supabaseAdmin
    .from('organizations')
    .select('id')
    .or(`slug.eq.${slug},name.eq.${data.name}`)
    .single()

  if (existingOrg) {
    // Update existing organization
    const { error } = await supabaseAdmin
      .from('organizations')
      .update({
        name: data.name,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingOrg.id)

    if (error) {
      console.error('[Yi Connect Webhook] Failed to update organization:', error)
      throw new Error(`Failed to update organization: ${error.message}`)
    }

    console.log(`[Yi Connect Webhook] Organization updated: ${data.name}`)
  } else {
    // Create new organization
    const { error } = await supabaseAdmin.from('organizations').insert({
      name: data.name,
      slug: slug,
      type: 'yi_chapter',
      credits_balance: 100, // Initial credits for new chapter
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    if (error) {
      // If slug conflict, try with location suffix
      if (error.code === '23505') {
        const altSlug = `${slug}-${data.location.toLowerCase()}`
        const { error: retryError } = await supabaseAdmin.from('organizations').insert({
          name: data.name,
          slug: altSlug,
          type: 'yi_chapter',
          credits_balance: 100,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })

        if (retryError) {
          console.error('[Yi Connect Webhook] Failed to create organization (retry):', retryError)
          throw new Error(`Failed to create organization: ${retryError.message}`)
        }
      } else {
        console.error('[Yi Connect Webhook] Failed to create organization:', error)
        throw new Error(`Failed to create organization: ${error.message}`)
      }
    }

    console.log(`[Yi Connect Webhook] Organization created: ${data.name}`)
  }
}

/**
 * Handle member.added and member.role_changed events
 */
async function handleMemberAddOrUpdate(payload: MemberWebhookPayload): Promise<void> {
  const { data } = payload
  const role = data.new_role || data.role

  if (!role) {
    throw new Error('Role is required for member add/update')
  }

  // Map Yi Connect role to Yi Creative role
  const creativeRole = mapRole(role)

  // Find the organization by chapter_id
  // Since we don't have yi_connect_chapter_id field yet, we'll need to use name/slug
  // For now, we'll log a warning and skip if we can't find the org
  const { data: org } = await supabaseAdmin
    .from('organizations')
    .select('id')
    .eq('id', data.chapter_id) // This won't work until we add yi_connect_chapter_id
    .single()

  if (!org) {
    console.warn(
      `[Yi Connect Webhook] Organization not found for chapter_id: ${data.chapter_id}. ` +
        'Member sync skipped. Note: yi_connect_chapter_id field needs to be added to organizations table.'
    )
    return
  }

  // Check if membership exists
  const { data: existingMember } = await supabaseAdmin
    .from('organization_members')
    .select('id, role')
    .eq('user_id', data.user_id)
    .eq('organization_id', org.id)
    .single()

  if (existingMember) {
    // Update role if changed
    if (existingMember.role !== creativeRole) {
      const { error } = await supabaseAdmin
        .from('organization_members')
        .update({ role: creativeRole })
        .eq('id', existingMember.id)

      if (error) {
        console.error('[Yi Connect Webhook] Failed to update member role:', error)
        throw new Error(`Failed to update member role: ${error.message}`)
      }

      console.log(
        `[Yi Connect Webhook] Member role updated: ${data.user_id} -> ${creativeRole}`
      )
    }
  } else {
    // Create new membership
    const { error } = await supabaseAdmin.from('organization_members').insert({
      user_id: data.user_id,
      organization_id: org.id,
      role: creativeRole,
      joined_at: new Date().toISOString(),
    })

    if (error) {
      console.error('[Yi Connect Webhook] Failed to create membership:', error)
      throw new Error(`Failed to create membership: ${error.message}`)
    }

    console.log(`[Yi Connect Webhook] Member added: ${data.user_id} as ${creativeRole}`)
  }
}

/**
 * Handle member.removed event
 */
async function handleMemberRemoved(payload: MemberWebhookPayload): Promise<void> {
  const { data } = payload

  // Find the organization by chapter_id
  const { data: org } = await supabaseAdmin
    .from('organizations')
    .select('id')
    .eq('id', data.chapter_id)
    .single()

  if (!org) {
    console.warn(
      `[Yi Connect Webhook] Organization not found for chapter_id: ${data.chapter_id}. ` +
        'Member removal skipped.'
    )
    return
  }

  // Remove membership
  const { error } = await supabaseAdmin
    .from('organization_members')
    .delete()
    .eq('user_id', data.user_id)
    .eq('organization_id', org.id)

  if (error) {
    console.error('[Yi Connect Webhook] Failed to remove member:', error)
    throw new Error(`Failed to remove member: ${error.message}`)
  }

  console.log(`[Yi Connect Webhook] Member removed: ${data.user_id}`)
}

/**
 * Main webhook handler
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    // 1. Get raw body for signature verification
    const rawBody = await request.text()
    const signature = request.headers.get('X-Yi-Connect-Signature') || ''

    // 2. Verify webhook signature
    const isValid = await verifyWebhookSignature(rawBody, signature)

    if (!isValid) {
      console.error('[Yi Connect Webhook] Invalid signature')
      return NextResponse.json(
        { success: false, error: 'Invalid webhook signature' },
        { status: 401 }
      )
    }

    // 3. Parse payload
    const payload: YiConnectWebhookPayload = JSON.parse(rawBody)

    console.log(`[Yi Connect Webhook] Received event: ${payload.event}`)

    // 4. Route to appropriate handler
    switch (payload.event) {
      case 'user.created':
      case 'user.updated':
        await handleUserEvent(payload as UserWebhookPayload)
        break

      case 'chapter.created':
      case 'chapter.updated':
        await handleChapterEvent(payload as ChapterWebhookPayload)
        break

      case 'member.added':
      case 'member.role_changed':
        await handleMemberAddOrUpdate(payload as MemberWebhookPayload)
        break

      case 'member.removed':
        await handleMemberRemoved(payload as MemberWebhookPayload)
        break

      default:
        console.warn(`[Yi Connect Webhook] Unknown event type: ${payload.event}`)
        return NextResponse.json(
          { success: false, error: `Unknown event type: ${payload.event}` },
          { status: 400 }
        )
    }

    // 5. Return success
    const duration = Date.now() - startTime
    return NextResponse.json({
      success: true,
      event: payload.event,
      duration_ms: duration,
    })
  } catch (error) {
    console.error('[Yi Connect Webhook] Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}

/**
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: '/api/webhooks/yi-connect',
    description: 'Yi Connect webhook receiver for user, chapter, and member sync',
    events: [
      'user.created',
      'user.updated',
      'chapter.created',
      'chapter.updated',
      'member.added',
      'member.role_changed',
      'member.removed',
    ],
    headers: {
      required: ['X-Yi-Connect-Signature'],
    },
  })
}
