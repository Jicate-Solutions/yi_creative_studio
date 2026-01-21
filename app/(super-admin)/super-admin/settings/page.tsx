/**
 * Super Admin Settings
 * Platform-wide configuration and settings
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Settings, Bell, Shield, Database, Zap, Globe } from 'lucide-react'

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

      {/* Settings Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* General Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Settings className="h-5 w-5 text-blue-500" />
              <div>
                <CardTitle className="text-lg">General Settings</CardTitle>
                <CardDescription>Platform configuration options</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b">
                <div>
                  <p className="font-medium text-sm">Platform Name</p>
                  <p className="text-xs text-gray-500">Yi CreativeStudio</p>
                </div>
                <Badge variant="secondary">Default</Badge>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <div>
                  <p className="font-medium text-sm">Default Credits</p>
                  <p className="text-xs text-gray-500">New organizations receive 100 credits</p>
                </div>
                <Badge variant="secondary">100</Badge>
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium text-sm">Registration</p>
                  <p className="text-xs text-gray-500">New user registration status</p>
                </div>
                <Badge className="bg-green-100 text-green-800">Open</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

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
                  <p className="font-medium text-sm">2FA Requirement</p>
                  <p className="text-xs text-gray-500">Require 2FA for Super Admins</p>
                </div>
                <Badge className="bg-yellow-100 text-yellow-800">Optional</Badge>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <div>
                  <p className="font-medium text-sm">Session Timeout</p>
                  <p className="text-xs text-gray-500">Auto-logout after inactivity</p>
                </div>
                <Badge variant="secondary">24 hours</Badge>
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium text-sm">Audit Logging</p>
                  <p className="text-xs text-gray-500">Track all admin actions</p>
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
        <Card>
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
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b">
                <div>
                  <p className="font-medium text-sm">Default Timezone</p>
                  <p className="text-xs text-gray-500">Platform default</p>
                </div>
                <Badge variant="secondary">IST (UTC+5:30)</Badge>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
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

      {/* Info Notice */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <Settings className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-blue-900">Settings are read-only</p>
              <p className="text-sm text-blue-700 mt-1">
                Platform settings are currently managed through environment variables and Supabase dashboard.
                Future versions will include editable settings here.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
