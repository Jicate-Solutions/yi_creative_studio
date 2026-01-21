/**
 * Super Admin Settings
 * Platform-wide configuration and settings
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Bell, Shield, Database, Zap, Globe } from 'lucide-react'
import PlatformSettings from '@/components/super-admin/PlatformSettings'

export default function SuperAdminSettings() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Platform Settings</h1>
        <p className="text-gray-600 mt-2">
          Configure platform-wide settings and preferences
        </p>
      </div>

      {/* Editable Platform Settings */}
      <PlatformSettings />

      {/* Read-only Status Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Notifications */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-amber-500" />
              <div>
                <CardTitle className="text-lg">Notifications</CardTitle>
                <CardDescription>Alert and notification settings</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b">
                <div>
                  <p className="font-medium text-sm">Low Credit Alerts</p>
                  <p className="text-xs text-gray-500">Notify when org credits fall below threshold</p>
                </div>
                <Badge className="bg-green-100 text-green-800">Enabled</Badge>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <div>
                  <p className="font-medium text-sm">New Organization Alerts</p>
                  <p className="text-xs text-gray-500">Notify on new organization creation</p>
                </div>
                <Badge className="bg-green-100 text-green-800">Enabled</Badge>
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium text-sm">Security Alerts</p>
                  <p className="text-xs text-gray-500">Suspicious activity notifications</p>
                </div>
                <Badge className="bg-green-100 text-green-800">Enabled</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-red-500" />
              <div>
                <CardTitle className="text-lg">Security</CardTitle>
                <CardDescription>Security and access controls</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b">
                <div>
                  <p className="font-medium text-sm">Audit Logging</p>
                  <p className="text-xs text-gray-500">Track all admin actions</p>
                </div>
                <Badge className="bg-green-100 text-green-800">Active</Badge>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <div>
                  <p className="font-medium text-sm">IP Rate Limiting</p>
                  <p className="text-xs text-gray-500">Protection against brute force</p>
                </div>
                <Badge className="bg-green-100 text-green-800">Enabled</Badge>
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium text-sm">CSRF Protection</p>
                  <p className="text-xs text-gray-500">Cross-site request forgery protection</p>
                </div>
                <Badge className="bg-green-100 text-green-800">Active</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* API & Integrations */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Zap className="h-5 w-5 text-purple-500" />
              <div>
                <CardTitle className="text-lg">API & Integrations</CardTitle>
                <CardDescription>External service connections</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b">
                <div>
                  <p className="font-medium text-sm">Gemini API</p>
                  <p className="text-xs text-gray-500">Image generation provider</p>
                </div>
                <Badge className="bg-green-100 text-green-800">Connected</Badge>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <div>
                  <p className="font-medium text-sm">Claude API</p>
                  <p className="text-xs text-gray-500">Prompt enhancement provider</p>
                </div>
                <Badge className="bg-green-100 text-green-800">Connected</Badge>
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium text-sm">Cloudinary</p>
                  <p className="text-xs text-gray-500">CMYK export service</p>
                </div>
                <Badge className="bg-green-100 text-green-800">Connected</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Database */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Database className="h-5 w-5 text-green-500" />
              <div>
                <CardTitle className="text-lg">Database</CardTitle>
                <CardDescription>Supabase connection status</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b">
                <div>
                  <p className="font-medium text-sm">Connection Status</p>
                  <p className="text-xs text-gray-500">Supabase database</p>
                </div>
                <Badge className="bg-green-100 text-green-800">Healthy</Badge>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <div>
                  <p className="font-medium text-sm">Storage</p>
                  <p className="text-xs text-gray-500">File storage service</p>
                </div>
                <Badge className="bg-green-100 text-green-800">Active</Badge>
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium text-sm">Realtime</p>
                  <p className="text-xs text-gray-500">Live data subscriptions</p>
                </div>
                <Badge className="bg-green-100 text-green-800">Enabled</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Localization */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Globe className="h-5 w-5 text-indigo-500" />
              <div>
                <CardTitle className="text-lg">Localization</CardTitle>
                <CardDescription>Regional settings</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium text-sm">Default Timezone</p>
                  <p className="text-xs text-gray-500">Platform default</p>
                </div>
                <Badge variant="secondary">IST (UTC+5:30)</Badge>
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium text-sm">Currency</p>
                  <p className="text-xs text-gray-500">Credit pricing currency</p>
                </div>
                <Badge variant="secondary">INR</Badge>
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium text-sm">Language</p>
                  <p className="text-xs text-gray-500">Platform language</p>
                </div>
                <Badge variant="secondary">English</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
