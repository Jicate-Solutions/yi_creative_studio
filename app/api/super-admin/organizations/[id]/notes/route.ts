/**
 * Super Admin API: Organization Admin Notes
 * GET /api/super-admin/organizations/[id]/notes - Get notes
 * PATCH /api/super-admin/organizations/[id]/notes - Update notes
 *
 * Admin notes are internal notes visible only to super admins
 */

import { NextRequest, NextResponse } from 'next/server'
import { superAdminGuard } from '@/lib/middleware/super-admin-guard'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id: organizationId } = await params

  return superAdminGuard(request, async (req, { adminClient }) => {
    const supabase = adminClient

    try {
      const { data: org, error } = await supabase
        .from('organizations')
        .select('admin_notes, admin_notes_updated_at, admin_notes_updated_by')
        .eq('id', organizationId)
        .single()

      if (error) {
        console.error('[org-notes] Failed to fetch notes:', error)
        return NextResponse.json(
          { success: false, error: 'Organization not found' },
          { status: 404 }
        )
      }

      // Get the name of who last updated (if available)
      let updatedByName = null
      if (org.admin_notes_updated_by) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('full_name')
          .eq('id', org.admin_notes_updated_by)
          .single()
        updatedByName = profile?.full_name || 'Unknown'
      }

      return NextResponse.json({
        success: true,
        notes: org.admin_notes || '',
        updated_at: org.admin_notes_updated_at,
        updated_by: updatedByName,
      })
    } catch (error) {
      console.error('[org-notes] Error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch notes' },
        { status: 500 }
      )
    }
  })
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id: organizationId } = await params

  return superAdminGuard(request, async (req, { adminClient, superAdmin }) => {
    const supabase = adminClient

    try {
      const body = await req.json()
      const { notes } = body

      if (typeof notes !== 'string') {
        return NextResponse.json(
          { success: false, error: 'Notes must be a string' },
          { status: 400 }
        )
      }

      // Check if org exists
      const { data: existingOrg, error: checkError } = await supabase
        .from('organizations')
        .select('id, name')
        .eq('id', organizationId)
        .single()

      if (checkError || !existingOrg) {
        return NextResponse.json(
          { success: false, error: 'Organization not found' },
          { status: 404 }
        )
      }

      // Update notes
      const { error: updateError } = await supabase
        .from('organizations')
        .update({
          admin_notes: notes,
          admin_notes_updated_at: new Date().toISOString(),
          admin_notes_updated_by: superAdmin.id,
        })
        .eq('id', organizationId)

      if (updateError) {
        console.error('[org-notes] Failed to update notes:', updateError)
        return NextResponse.json(
          { success: false, error: 'Failed to update notes' },
          { status: 500 }
        )
      }

      // Log audit entry
      await supabase.from('super_admin_audit_logs').insert({
        super_admin_id: superAdmin.id,
        super_admin_email: superAdmin.email,
        action: 'org_notes_updated',
        resource_type: 'organization',
        resource_id: organizationId,
        target_organization_id: organizationId,
        changes: {
          organization_name: existingOrg.name,
          notes_length: notes.length,
        },
      })

      return NextResponse.json({
        success: true,
        message: 'Notes updated successfully',
      })
    } catch (error) {
      console.error('[org-notes] Error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to update notes' },
        { status: 500 }
      )
    }
  })
}
