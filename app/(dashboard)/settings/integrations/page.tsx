'use client'

import { useState } from 'react'
import { useOrganization } from '@/hooks'
import { useClientAdmin } from '@/hooks/use-client-admin'
import { GoogleCalendarCard, WebhookIntegrationsSection, CanvaIntegrationCard } from '@/components/settings/integrations'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { AlertCircle, Link2, Copy, Check, Building2 } from 'lucide-react'

export default function IntegrationsPage() {
  const { organization } = useOrganization()
  const { isAdmin, isReady } = useClientAdmin()

  // Loading state
  if (!isReady || !organization) {
    return (
      <div className="space-y-6">
        <div>
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
      <div className="space-y-6">
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
    <div className="space-y-6">
      {/* Header */}
      <div>
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
        {/* Organization ID Card for Yi Connect */}
        <OrganizationIdCard organization={organization} />

        {/* Google Calendar */}
        <GoogleCalendarCard organizationId={organization.id} />

        {/* Canva */}
        <CanvaIntegrationCard
          organizationId={organization.id}
          isConnected={!!(organization.brand_config as Record<string, unknown> | null)?.canva_access_token}
          connectedAt={(organization.brand_config as Record<string, unknown> | null)?.canva_connected_at as string | null}
        />

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

/**
 * Organization ID Card Component
 * Shows the organization ID with copy functionality for Yi Connect integration
 */
function OrganizationIdCard({ organization }: { organization: { id: string; name: string } }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(organization.id)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Building2 className="h-5 w-5" />
          Organization ID
        </CardTitle>
        <CardDescription>
          Use this ID to connect Yi Connect or other external services to your organization
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3">
          <code className="flex-1 rounded-lg bg-muted px-4 py-3 font-mono text-sm">
            {organization.id}
          </code>
          <Button
            variant="outline"
            size="icon"
            onClick={handleCopy}
            className="shrink-0"
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          <strong>Organization:</strong> {organization.name}
        </p>
      </CardContent>
    </Card>
  )
}
