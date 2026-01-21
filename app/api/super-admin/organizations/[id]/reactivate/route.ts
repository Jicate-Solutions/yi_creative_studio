/**
 * Super Admin API: Reactivate Organization
 * POST /api/super-admin/organizations/[id]/reactivate
 *
 * Reactivates a deactivated organization
 */

import { NextRequest, NextResponse } from 'next/server'
import { superAdminGuard } from '@/lib/middleware/super-admin-guard'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  return superAdminGuard(request, async (req, { adminClient, superAdmin }) => {
    const { id: organizationId } = await params
    const supabase = adminClient

    try {
      // Check if organization exists and is deactivated
      const { data: org, error: fetchError } = await supabase
        .from('organizations')
        .select('id, name, is_active')
        .eq('id', organizationId)
        .single()

      if (fetchError || !org) {
        return NextResponse.json(
          { error: 'Organization not found' },
          { status: 404 }
        )
      }

      if (org.is_active) {
        return NextResponse.json(
          { error: 'Organization is already active' },
          { status: 400 }
        )
      }

      // Reactivate the organization
      const { error: updateError } = await supabase
        .from('organizations')
        .update({
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', organizationId)

      if (updateError) {
        console.error('[reactivate-org] Failed to reactivate:', updateError)
        throw new Error('Failed to reactivate organization')
      }

      // Log audit entry
      await supabase.from('super_admin_audit_logs').insert({
        super_admin_id: superAdmin.id,
        super_admin_email: superAdmin.email,
        action: 'organization_reactivated',
        resource_type: 'organization',
        resource_id: organizationId,
        target_organization_id: organizationId,
        changes: {
          organization_name: org.name,
        },
      })

      return NextResponse.json({
        success: true,
        message: `Organization "${org.name}" has been reactivated`,
        organization: {
          id: organizationId,
          name: org.name,
          is_active: true,
        },
      })
    } catch (error) {
      console.error('[reactivate-org] Exception:', error)
      return NextResponse.json(
        {
          error: 'Failed to reactivate organization',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      )
    }
  })
}
