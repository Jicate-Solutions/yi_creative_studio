'use client'

import { useOrganization } from '@/hooks'
import { useClientAdmin } from '@/hooks/use-client-admin'
import { GoogleCalendarCard, WebhookIntegrationsSection } from '@/components/settings/integrations'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertCircle, Link2 } from 'lucide-react'

export default function IntegrationsPage() {
  const { organization } = useOrganization()
  const { isAdmin, isReady } = useClientAdmin()

  // Loading state
  if (!isReady || !organization) {
    return (
      <div className="container max-w-4xl py-8">
        <div className="mb-8">
          <Skeleton className="mb-2 h-8 w-48" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    )
  }

  // Not admin
  if (!isAdmin) {
    return (
      <div className="container max-w-4xl py-8">
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Access Denied
            </CardTitle>
            <CardDescription>
              Only organization admins can manage integrations.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="container max-w-4xl py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Link2 className="h-6 w-6" />
          Integrations
        </h1>
        <p className="mt-1 text-muted-foreground">
          Connect external services to enhance your creative workflow
        </p>
      </div>

      {/* Integrations List */}
      <div className="space-y-6">
        {/* Google Calendar */}
        <GoogleCalendarCard organizationId={organization.id} />

        {/* Webhook Integrations */}
        <WebhookIntegrationsSection organizationId={organization.id} />

        {/* Future integrations can be added here */}
        {/* <OutlookCalendarCard organizationId={organization.id} /> */}
        {/* <SlackCard organizationId={organization.id} /> */}

        {/* Coming Soon Card */}
        <Card className="border-dashed opacity-60">
          <CardHeader>
            <CardTitle className="text-lg text-muted-foreground">
              More Integrations Coming Soon
            </CardTitle>
            <CardDescription>
              We&apos;re working on adding more integrations including Microsoft
              Outlook and Slack notifications.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  )
}
