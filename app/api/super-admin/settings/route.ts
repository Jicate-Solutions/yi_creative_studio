/**
 * Super Admin API: Platform Settings
 * GET /api/super-admin/settings - Get all platform settings
 * PATCH /api/super-admin/settings - Update platform settings
 */

import { NextRequest, NextResponse } from 'next/server'
import { superAdminGuard } from '@/lib/middleware/super-admin-guard'

interface Setting {
  id: string
  key: string
  value: string | number | boolean
  description: string | null
  updated_at: string
  updated_by: string | null
}

export async function GET(request: NextRequest) {
  return superAdminGuard(request, async (req, { adminClient }) => {
    const supabase = adminClient

    try {
      const { data: settings, error } = await supabase
        .from('platform_settings')
        .select('*')
        .order('key', { ascending: true })

      if (error) {
        console.error('[settings] Failed to fetch settings:', error)
        return NextResponse.json(
          { success: false, error: 'Failed to fetch settings' },
          { status: 500 }
        )
      }

      // Parse JSONB values and format for frontend
      const formattedSettings = (settings || []).map((s) => ({
        id: s.id,
        key: s.key,
        value: typeof s.value === 'string' ? JSON.parse(s.value) : s.value,
        description: s.description,
        updated_at: s.updated_at,
        updated_by: s.updated_by,
      }))

      return NextResponse.json({
        success: true,
        settings: formattedSettings,
      })
    } catch (error) {
      console.error('[settings] Error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch settings' },
        { status: 500 }
      )
    }
  })
}

export async function PATCH(request: NextRequest) {
  return superAdminGuard(request, async (req, { adminClient, superAdmin }) => {
    const supabase = adminClient
    const adminUserId = superAdmin.id

    try {
      const body = await req.json()
      const { settings } = body

      if (!settings || typeof settings !== 'object') {
        return NextResponse.json(
          { success: false, error: 'Settings object required' },
          { status: 400 }
        )
      }

      const updates: { key: string; value: unknown }[] = []
      const errors: string[] = []

      // Process each setting update
      for (const [key, value] of Object.entries(settings)) {
        // Validate the setting exists
        const { data: existing, error: checkError } = await supabase
          .from('platform_settings')
          .select('id')
          .eq('key', key)
          .single()

        if (checkError || !existing) {
          errors.push(`Setting "${key}" not found`)
          continue
        }

        // Update the setting
        const { error: updateError } = await supabase
          .from('platform_settings')
          .update({
            value: JSON.stringify(value),
            updated_at: new Date().toISOString(),
            updated_by: adminUserId,
          })
          .eq('key', key)

        if (updateError) {
          console.error(`[settings] Failed to update ${key}:`, updateError)
          errors.push(`Failed to update "${key}"`)
        } else {
          updates.push({ key, value })
        }
      }

      // Log audit entry
      if (updates.length > 0) {
        await supabase.from('super_admin_audit_logs').insert({
          super_admin_id: superAdmin.id,
          super_admin_email: superAdmin.email,
          action: 'platform_settings_updated',
          resource_type: 'platform_settings',
          resource_id: 'global',
          changes: {
            updated_settings: updates.map((u) => u.key),
            setting_count: updates.length,
          },
        })
      }

      if (errors.length > 0 && updates.length === 0) {
        return NextResponse.json(
          { success: false, error: errors.join(', ') },
          { status: 400 }
        )
      }

      return NextResponse.json({
        success: true,
        message: `Updated ${updates.length} setting(s)`,
        updated: updates.map((u) => u.key),
        errors: errors.length > 0 ? errors : undefined,
      })
    } catch (error) {
      console.error('[settings] Error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to update settings' },
        { status: 500 }
      )
    }
  })
}
