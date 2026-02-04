/**
 * Super Admin Webhooks Dashboard Page
 * Overview of webhook integrations and stats
 */

import Link from 'next/link'
import { ArrowRight, Database, ScrollText, Send, Webhook } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import WebhookStatsCards from '@/components/super-admin/webhooks/WebhookStatsCards'

const quickLinks = [
  {
    title: 'Manage Sources',
    description: 'Create and configure event sources',
    href: '/super-admin/webhooks/sources',
    icon: Database,
  },
  {
    title: 'View Events',
    description: 'Browse all synced events',
    href: '/super-admin/webhooks/events',
    icon: Webhook,
  },
  {
    title: 'View Logs',
    description: 'Monitor webhook call history',
    href: '/super-admin/webhooks/logs',
    icon: ScrollText,
  },
  {
    title: 'Test Webhook',
    description: 'Send test payloads',
    href: '/super-admin/webhooks/test',
    icon: Send,
  },
]

export default function WebhooksDashboardPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Webhooks</h1>
        <p className="text-gray-600 mt-2">Manage external event integrations and monitor sync activity</p>
      </div>

      {/* Stats Cards */}
      <WebhookStatsCards />

      {/* Quick Links */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Quick Links</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickLinks.map((link) => {
            const Icon = link.icon
            return (
              <Link key={link.href} href={link.href}>
                <Card className="hover:border-blue-300 hover:shadow-md transition-all cursor-pointer h-full">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <Icon className="h-5 w-5 text-blue-600" />
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                    </div>
                    <CardTitle className="text-base">{link.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{link.description}</CardDescription>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
