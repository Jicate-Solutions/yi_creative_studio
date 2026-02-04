'use client'

import { useState, useEffect } from 'react'
import { Link2, Plus, CheckCircle2, AlertCircle, Clock, Calendar, Loader2, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'

interface WebhookSource {
  id: string
  name: string
  source_app_id: string
  description: string | null
  is_active: boolean
  last_sync_at: string | null
  total_syncs: number
  error_count: number
  eventsCount: number
  webhook_secret_preview: string | null
}

interface WebhookIntegrationsSectionProps {
  organizationId: string
}

export function WebhookIntegrationsSection({ organizationId }: WebhookIntegrationsSectionProps) {
  const [sources, setSources] = useState<WebhookSource[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSources = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/integrations/webhooks?organization_id=${organizationId}`)
      const data = await response.json()

      if (data.success) {
        setSources(data.sources)
      } else {
        setError(data.error || 'Failed to load webhook integrations')
      }
    } catch (err) {
      console.error('Failed to fetch webhook sources:', err)
      setError('Failed to load webhook integrations')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSources()
  }, [organizationId])

  // Loading state
  if (loading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            Error Loading Webhooks
          </CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" size="sm" onClick={fetchSources}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  // No webhooks configured
  if (sources.length === 0) {
    return (
      <Card className="border-dashed">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              <Link2 className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <CardTitle className="text-lg">Webhook Integrations</CardTitle>
              <CardDescription>
                Connect external systems to automatically sync events
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Webhook integrations allow external systems like Yi Connect or MyJKKN to push events directly to your organization.
          </p>
          <Button variant="outline" disabled>
            <Plus className="mr-2 h-4 w-4" />
            Add Webhook Integration
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            Contact your administrator to set up webhook integrations
          </p>
        </CardContent>
      </Card>
    )
  }

  // Display webhook sources as cards
  return (
    <div className="space-y-4">
      {sources.map((source) => (
        <Card key={source.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                    source.is_active
                      ? 'bg-green-100 dark:bg-green-900/30'
                      : 'bg-gray-100 dark:bg-gray-800'
                  }`}
                >
                  <Link2
                    className={`h-5 w-5 ${
                      source.is_active
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-gray-400'
                    }`}
                  />
                </div>
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    {source.name}
                    <Badge
                      variant="outline"
                      className={
                        source.is_active
                          ? 'border-green-500 text-green-600'
                          : 'border-gray-400 text-gray-600'
                      }
                    >
                      {source.is_active ? (
                        <>
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          Active
                        </>
                      ) : (
                        'Inactive'
                      )}
                    </Badge>
                  </CardTitle>
                  <CardDescription className="mt-0.5">
                    {source.source_app_id}
                    {source.description && ` • ${source.description}`}
                  </CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Stats */}
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Last sync:</span>
                <span>
                  {source.last_sync_at
                    ? formatDistanceToNow(new Date(source.last_sync_at), {
                        addSuffix: true,
                      })
                    : 'Never'}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Events:</span>
                <span>{source.eventsCount}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <RefreshCw className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Syncs:</span>
                <span>{source.total_syncs}</span>
              </div>
              {source.error_count > 0 && (
                <div className="flex items-center gap-1.5 text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <span>{source.error_count} errors</span>
                </div>
              )}
            </div>

            {/* Info message */}
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-900/50 dark:bg-blue-900/20">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                This webhook integration is managed by your system administrator.
                Events from {source.source_app_id} are automatically synced to your organization.
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
