/**
 * Super Admin API: Delete Template
 * DELETE /api/super-admin/brand-assets/templates/[id]
 *
 * Delete a template from any organization
 */

import { NextRequest, NextResponse } from 'next/server'
import { superAdminGuard, getRequestMetadata } from '@/lib/middleware/super-admin-guard'
import { logSuperAdminAction } from '@/lib/services/audit-service'

/**
 * DELETE - Delete template
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return superAdminGuard(request, async (req, { superAdmin, adminClient }) => {
    // Use adminClient to bypass RLS and delete any template
    const supabase = adminClient
    const { id: templateId } = await params
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
      if (template.preview_image_url) {
        try {
          // Extract storage path from URL using safer parsing
          const storageMarker = '/storage/v1/object/public/'
          const markerIndex = template.preview_image_url.indexOf(storageMarker)

          if (markerIndex !== -1) {
            const storagePath = template.preview_image_url.substring(markerIndex + storageMarker.length)
            const pathParts = storagePath.split('/')

            // Validate we have at least bucket/filepath
            if (pathParts.length >= 2) {
              const bucket = pathParts[0]
              const filePath = pathParts.slice(1).join('/')

              // Validate bucket name (should be alphanumeric with hyphens/underscores)
              if (bucket && /^[a-zA-Z0-9_-]+$/.test(bucket) && filePath) {
                const { error: storageError } = await supabase.storage
                  .from(bucket)
                  .remove([filePath])

                if (storageError) {
                  console.error('[super-admin] Failed to delete template thumbnail:', storageError)
                  // Continue with database deletion even if storage fails
                }
              } else {
                console.warn('[super-admin] Invalid bucket or file path:', { bucket, filePath })
              }
            } else {
              console.warn('[super-admin] Could not parse bucket/filepath from URL:', template.preview_image_url)
            }
          } else {
            console.warn('[super-admin] Could not find storage marker in URL:', template.preview_image_url)
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

      // Safely extract organization name from nested join
      const orgData = template.organizations as { id: string; name: string } | null
      const organizationName = orgData?.name || 'Platform Template'

      // Log Super Admin action
      await logSuperAdminAction({
        super_admin_id: superAdmin.id,
        action: 'brand:template:delete',
        resource_type: 'template',
        resource_id: templateId,
        target_organization_id: template.organization_id ?? undefined,
        changes: {
          before: {
            name: template.name,
            category: template.category,
            organization_name: organizationName,
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
          organization_name: organizationName,
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
