'use client'

/**
 * Platform Settings Component
 * Editable settings for Super Admin panel
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Settings, Save, RefreshCw, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

interface Setting {
  id: string
  key: string
  value: string | number | boolean
  description: string | null
  updated_at: string | null
}

interface SettingsMap {
  [key: string]: string | number | boolean
}

const SETTING_LABELS: Record<string, string> = {
  low_credit_threshold: 'Low Credit Alert Threshold',
  default_credit_allocation: 'Default Credit Allocation',
  session_timeout_minutes: 'Session Timeout (minutes)',
  registration_open: 'Allow New Registrations',
  require_2fa: 'Require 2FA for Admins',
}

const SETTING_DESCRIPTIONS: Record<string, string> = {
  low_credit_threshold: 'Organizations below this credit balance will show a warning',
  default_credit_allocation: 'Default credits assigned to new organizations',
  session_timeout_minutes: 'Time before admin sessions expire',
  registration_open: 'Enable or disable new user registrations',
  require_2fa: 'Require two-factor authentication for admin users',
}

export default function PlatformSettings() {
  const [settings, setSettings] = useState<Setting[]>([])
  const [localValues, setLocalValues] = useState<SettingsMap>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  async function fetchSettings() {
    setLoading(true)
    try {
      const response = await fetch('/api/super-admin/settings')
      const data = await response.json()

      if (data.success) {
        setSettings(data.settings)
        // Initialize local values
        const values: SettingsMap = {}
        data.settings.forEach((s: Setting) => {
          values[s.key] = s.value
        })
        setLocalValues(values)
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error)
      toast.error('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  function handleValueChange(key: string, value: string | number | boolean) {
    setLocalValues((prev) => {
      const newValues = { ...prev, [key]: value }
      // Check if there are changes
      const original = settings.find((s) => s.key === key)?.value
      const hasChange = settings.some(
        (s) => newValues[s.key] !== s.value
      )
      setHasChanges(hasChange)
      return newValues
    })
  }

  async function handleSave() {
    setSaving(true)
    try {
      // Only send changed values
      const changedSettings: SettingsMap = {}
      settings.forEach((s) => {
        if (localValues[s.key] !== s.value) {
          changedSettings[s.key] = localValues[s.key]
        }
      })

      if (Object.keys(changedSettings).length === 0) {
        toast.error('No changes to save')
        setSaving(false)
        return
      }

      const response = await fetch('/api/super-admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: changedSettings }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save settings')
      }

      toast.success(data.message || 'Settings saved successfully')
      setHasChanges(false)
      fetchSettings() // Refresh to get updated timestamps
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  function formatDate(dateString: string | null) {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  function renderSettingInput(setting: Setting) {
    const value = localValues[setting.key]
    const label = SETTING_LABELS[setting.key] || setting.key
    const description = SETTING_DESCRIPTIONS[setting.key] || setting.description

    // Boolean settings (switches)
    if (typeof value === 'boolean' || value === 'true' || value === 'false') {
      const boolValue = value === true || value === 'true'
      return (
        <div key={setting.key} className="flex items-center justify-between py-4 border-b last:border-0">
          <div className="space-y-0.5">
            <Label htmlFor={setting.key} className="text-base font-medium">
              {label}
            </Label>
            <p className="text-sm text-gray-500">{description}</p>
          </div>
          <Switch
            id={setting.key}
            checked={boolValue}
            onCheckedChange={(checked) => handleValueChange(setting.key, checked)}
          />
        </div>
      )
    }

    // Number settings
    const numValue = typeof value === 'number' ? value : parseInt(String(value), 10)
    return (
      <div key={setting.key} className="py-4 border-b last:border-0">
        <div className="space-y-2">
          <Label htmlFor={setting.key} className="text-base font-medium">
            {label}
          </Label>
          <p className="text-sm text-gray-500">{description}</p>
          <Input
            id={setting.key}
            type="number"
            min="0"
            value={numValue}
            onChange={(e) => handleValueChange(setting.key, parseInt(e.target.value, 10) || 0)}
            className="max-w-xs"
          />
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Platform Settings
            </CardTitle>
            <CardDescription>
              Configure platform-wide settings and defaults
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchSettings}
              disabled={loading || saving}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!hasChanges || saving}
            >
              {saving ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {hasChanges && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2 text-sm text-yellow-800">
            <AlertCircle className="w-4 h-4" />
            You have unsaved changes
          </div>
        )}

        <div className="divide-y">
          {settings.map((setting) => renderSettingInput(setting))}
        </div>

        {settings.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No settings configured
          </div>
        )}
      </CardContent>
    </Card>
  )
}
