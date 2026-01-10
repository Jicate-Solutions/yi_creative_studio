/**
 * Super Admin API: Delete Template
 * DELETE /api/super-admin/brand-assets/templates/[id]
 *
 * Delete a template from any organization
 */

import { NextRequest, NextResponse } from 'next/server'
import { superAdminGuard, getRequestMetadata } from '@/lib/middleware/super-admin-guard'
import { createClient } from '@/lib/supabase/server'
import { logSuperAdminAction } from '@/lib/services/audit-service'

interface RouteContext {
  params: { id: string }
}

/**
 * DELETE - Delete template
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  return superAdminGuard(request, async (req, { superAdmin }) => {
    const supabase = await createClient()
    const { id: templateId } = context.params
    const metadata = getRequestMetadata(req)

    try {
      // Get template details before deletion
      const { data: template, error: fetchError } = await supabase
        .from('templates')
        .select(`
          *,
          organizations(id, name)
        `)
        .eq('id', templateId)
        .single()

      if (fetchError || !template) {
        return NextResponse.json(
          { error: 'Template not found' },
          { status: 404 }
        )
      }

      // Check if template is used in any creatives
      const { data: usageCount } = await supabase
        .from('creatives')
        .select('id', { count: 'exact', head: true })
        .eq('template_id', templateId)

      const usedInCreatives = (usageCount as any)?.count || 0

      // Delete template thumbnail from storage if exists
      if (template.thumbnail_url) {
        try {
          // Extract storage path from URL
          const urlParts = template.thumbnail_url.split('/storage/v1/object/public/')
          if (urlParts.length > 1) {
            const storagePath = urlParts[1]
            const [bucket, ...pathParts] = storagePath.split('/')
            const filePath = pathParts.join('/')

            const { error: storageError } = await supabase.storage
              .from(bucket)
              .remove([filePath])

            if (storageError) {
              console.error('[super-admin] Failed to delete template thumbnail:', storageError)
              // Continue with database deletion even if storage fails
            }
          }
        } catch (storageError) {
          console.error('[super-admin] Exception deleting template thumbnail:', storageError)
        }
      }

      // Delete template from database
      const { error: deleteError } = await supabase
        .from('templates')
        .delete()
        .eq('id', templateId)

      if (deleteError) {
        return NextResponse.json(
          { error: 'Failed to delete template', details: deleteError.message },
          { status: 500 }
        )
      }

      // Log Super Admin action
      await logSuperAdminAction({
        super_admin_id: superAdmin.id,
        action: 'brand:template:delete',
        resource_type: 'template',
        resource_id: templateId,
        target_organization_id: template.organization_id,
        changes: {
          before: {
            name: template.name,
            category: template.category,
            organization_name: (template.organizations as any)?.name,
            used_in_creatives: usedInCreatives,
          },
        },
        ...metadata,
      })

      return NextResponse.json({
        success: true,
        message: 'Template deleted successfully',
        template: {
          id: templateId,
          name: template.name,
          organization_name: (template.organizations as any)?.name,
          was_used_in_creatives: usedInCreatives > 0,
          usage_count: usedInCreatives,
        },
      })
    } catch (error) {
      console.error('[super-admin] Failed to delete template:', error)
      return NextResponse.json(
        {
          error: 'Failed to delete template',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      )
    }
  })
}
