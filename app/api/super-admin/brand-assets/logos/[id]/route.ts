/**
 * Super Admin API: Delete Logo
 * DELETE /api/super-admin/brand-assets/logos/[id]
 *
 * Delete a logo from any organization
 */

import { NextRequest, NextResponse } from 'next/server'
import { superAdminGuard, getRequestMetadata } from '@/lib/middleware/super-admin-guard'
import { createClient } from '@/lib/supabase/server'
import { logSuperAdminAction } from '@/lib/services/audit-service'

/**
 * DELETE - Delete logo
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return superAdminGuard(request, async (req, { superAdmin }) => {
    const supabase = await createClient()
    const { id: logoId } = await params
    const metadata = getRequestMetadata(req)

    try {
      // Get logo details before deletion
      const { data: logo, error: fetchError } = await supabase
        .from('organization_logos')
        .select(`
          *,
          organizations(id, name)
        `)
        .eq('id', logoId)
        .single()

      if (fetchError || !logo) {
        return NextResponse.json(
          { error: 'Logo not found' },
          { status: 404 }
        )
      }

      // Check if logo is used in any creatives
      const { data: usageCount } = await supabase
        .from('creatives')
        .select('id', { count: 'exact', head: true })
        .or(`primary_logo_id.eq.${logoId},secondary_logo_id.eq.${logoId}`)

      const usedInCreatives = (usageCount as any)?.count || 0

      // Delete logo file from storage if exists (file_url contains the path)
      if (logo.file_url) {
        try {
          // Extract storage path from file_url
          const urlParts = logo.file_url.split('/storage/v1/object/public/logos/')
          const storagePath = urlParts[1]
          if (storagePath) {
            const { error: storageError } = await supabase.storage
              .from('logos')
              .remove([storagePath])

            if (storageError) {
              console.error('[super-admin] Failed to delete logo file from storage:', storageError)
              // Continue with database deletion even if storage fails
            }
          }
        } catch (storageError) {
          console.error('[super-admin] Exception deleting logo file:', storageError)
        }
      }

      // Delete logo from database
      const { error: deleteError } = await supabase
        .from('organization_logos')
        .delete()
        .eq('id', logoId)

      if (deleteError) {
        return NextResponse.json(
          { error: 'Failed to delete logo', details: deleteError.message },
          { status: 500 }
        )
      }

      // Log Super Admin action
      await logSuperAdminAction({
        super_admin_id: superAdmin.id,
        action: 'brand:logo:delete',
        resource_type: 'logo',
        resource_id: logoId,
        target_organization_id: logo.organization_id,
        changes: {
          before: {
            name: logo.name,
            category: logo.category,
            organization_name: (logo.organizations as any)?.name,
            used_in_creatives: usedInCreatives,
          },
        },
        ...metadata,
      })

      return NextResponse.json({
        success: true,
        message: 'Logo deleted successfully',
        logo: {
          id: logoId,
          name: logo.name,
          organization_name: (logo.organizations as any)?.name,
          was_used_in_creatives: usedInCreatives > 0,
          usage_count: usedInCreatives,
        },
      })
    } catch (error) {
      console.error('[super-admin] Failed to delete logo:', error)
      return NextResponse.json(
        {
          error: 'Failed to delete logo',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      )
    }
  })
}
