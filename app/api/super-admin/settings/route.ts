/**
 * Super Admin API: Platform Settings
 * GET /api/super-admin/settings - Get all platform settings
 * PATCH /api/super-admin/settings - Update platform settings
 *
 * NOTE: Until the platform_settings table is created via migration,
 * this API uses a default settings configuration stored in memory.
 * Settings changes will not persist across server restarts.
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

// Default settings until platform_settings table is created
const DEFAULT_SETTINGS: Setting[] = [
  {
    id: '1',
    key: 'low_credit_threshold',
    value: 10,
    description: 'Alert threshold for low credits',
    updated_at: new Date().toISOString(),
    updated_by: null,
  },
  {
    id: '2',
    key: 'default_credit_allocation',
    value: 100,
    description: 'Default credits for new organizations',
    updated_at: new Date().toISOString(),
    updated_by: null,
  },
  {
    id: '3',
    key: 'session_timeout_minutes',
    value: 60,
    description: 'Admin session timeout in minutes',
    updated_at: new Date().toISOString(),
    updated_by: null,
  },
  {
    id: '4',
    key: 'registration_open',
    value: true,
    description: 'Allow new user registrations',
    updated_at: new Date().toISOString(),
    updated_by: null,
  },
  {
    id: '5',
    key: 'require_2fa',
    value: false,
    description: '2FA requirement for admin users',
    updated_at: new Date().toISOString(),
    updated_by: null,
  },
]

// In-memory settings store (temporary until database table exists)
let settingsStore = [...DEFAULT_SETTINGS]

export async function GET(request: NextRequest) {
  return superAdminGuard(request, async () => {
    try {
      return NextResponse.json({
        success: true,
        settings: settingsStore,
        _notice: 'Settings are stored in memory until platform_settings table is created',
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
        // Find the setting in our store
        const settingIndex = settingsStore.findIndex((s) => s.key === key)

        if (settingIndex === -1) {
          errors.push(`Setting "${key}" not found`)
          continue
        }

        // Update the setting in memory
        settingsStore[settingIndex] = {
          ...settingsStore[settingIndex],
          value: value as string | number | boolean,
          updated_at: new Date().toISOString(),
          updated_by: superAdmin.id,
        }

        updates.push({ key, value })
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
        _notice: 'Settings stored in memory (not persisted until database table is created)',
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
