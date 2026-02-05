'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Link2,
  Plus,
  CheckCircle2,
  AlertCircle,
  Clock,
  Calendar,
  RefreshCw,
  Copy,
  Eye,
  EyeOff,
  Settings2,
  Trash2,
  Power,
  ExternalLink,
  Database,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'

// Predefined integration apps
const INTEGRATION_APPS = [
  {
    id: 'yi-connect',
    name: 'Yi Connect',
    description: 'Yi Connect Event Management Platform',
    icon: '🔗',
  },
  {
    id: 'myjkkn',
    name: 'MyJKKN',
    description: 'MyJKKN Platform for institutional events',
    icon: '🏛️',
  },
] as const

interface WebhookSource {
  id: string
  name: string
  source_app_id: string
  source_name: string
  description: string | null
  is_active: boolean
  last_sync_at: string | null
  total_syncs: number
  error_count: number
  eventsCount: number
  webhook_secret_preview: string | null
  webhook_secret?: string // Only shown on creation
  required_fields?: string[]
}

interface WebhookIntegrationsSectionProps {
  organizationId: string
}

export function WebhookIntegrationsSection({ organizationId }: WebhookIntegrationsSectionProps) {
  const router = useRouter()
  const [sources, setSources] = useState<WebhookSource[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Dialog states
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState<string | null>(null)
  const [showSecretDialog, setShowSecretDialog] = useState<WebhookSource | null>(null)

  // Form states
  const [selectedApp, setSelectedApp] = useState<string>('')
  const [customName, setCustomName] = useState('')
  const [customDescription, setCustomDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Created source (to show webhook details after creation)
  const [createdSource, setCreatedSource] = useState<WebhookSource & { webhook_url?: string } | null>(null)

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

  // Get available apps (not already configured)
  const configuredAppIds = sources.map((s) => s.source_app_id)
  const availableApps = INTEGRATION_APPS.filter((app) => !configuredAppIds.includes(app.id))

  // Create new integration
  const handleCreateIntegration = async () => {
    if (!selectedApp) {
      toast.error('Please select an app to integrate')
      return
    }

    const app = INTEGRATION_APPS.find((a) => a.id === selectedApp)
    if (!app) return

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/integrations/webhooks/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: customName || app.name,
          source_app_id: app.id,
          organization_id: organizationId,
          description: customDescription || app.description,
          is_active: true,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success(`${app.name} integration created successfully!`)
        setCreatedSource(data.source)
        setShowAddDialog(false)
        resetForm()
        fetchSources()
      } else {
        toast.error(data.error || 'Failed to create integration')
      }
    } catch (err) {
      console.error('Failed to create integration:', err)
      toast.error('Failed to create integration')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Toggle integration active status
  const handleToggleActive = async (source: WebhookSource) => {
    try {
      const response = await fetch(`/api/integrations/webhooks/${source.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          is_active: !source.is_active,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success(`Integration ${source.is_active ? 'deactivated' : 'activated'}`)
        fetchSources()
      } else {
        toast.error(data.error || 'Failed to update integration')
      }
    } catch (err) {
      toast.error('Failed to update integration')
    }
  }

  // Delete integration
  const handleDeleteIntegration = async (sourceId: string) => {
    try {
      const response = await fetch(`/api/integrations/webhooks/${sourceId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Integration deleted successfully')
        setShowDeleteDialog(null)
        fetchSources()
      } else {
        toast.error(data.error || 'Failed to delete integration')
      }
    } catch (err) {
      toast.error('Failed to delete integration')
    }
  }

  // Regenerate webhook secret
  const handleRegenerateSecret = async (source: WebhookSource) => {
    try {
      const response = await fetch(`/api/integrations/webhooks/${source.id}/regenerate-secret`, {
        method: 'POST',
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Webhook secret regenerated!')
        setShowSecretDialog({ ...source, webhook_secret: data.webhook_secret })
      } else {
        toast.error(data.error || 'Failed to regenerate secret')
      }
    } catch (err) {
      toast.error('Failed to regenerate secret')
    }
  }

  const resetForm = () => {
    setSelectedApp('')
    setCustomName('')
    setCustomDescription('')
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied to clipboard`)
  }

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

  const webhookUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/api/webhooks/events`
    : '/api/webhooks/events'

  return (
    <div className="space-y-4">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Webhook Integrations
          </h2>
          <p className="text-sm text-muted-foreground">
            Connect external systems to automatically sync events
          </p>
        </div>
        {availableApps.length > 0 && (
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Integration
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add Webhook Integration</DialogTitle>
                <DialogDescription>
                  Connect an external application to sync events with your organization.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Select Application</Label>
                  <Select value={selectedApp} onValueChange={setSelectedApp}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose an app to integrate" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableApps.map((app) => (
                        <SelectItem key={app.id} value={app.id}>
                          <span className="flex items-center gap-2">
                            <span>{app.icon}</span>
                            <span>{app.name}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Display Name (optional)</Label>
                  <Input
                    placeholder="Custom name for this integration"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description (optional)</Label>
                  <Textarea
                    placeholder="Brief description of this integration"
                    value={customDescription}
                    onChange={(e) => setCustomDescription(e.target.value)}
                    rows={2}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateIntegration} disabled={!selectedApp || isSubmitting}>
                  {isSubmitting ? 'Creating...' : 'Create Integration'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Created Source Dialog - Shows webhook details */}
      {createdSource && (
        <Dialog open={!!createdSource} onOpenChange={() => setCreatedSource(null)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-5 w-5" />
                Integration Created Successfully!
              </DialogTitle>
              <DialogDescription>
                Copy these credentials to configure your webhook in {createdSource.name}.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Webhook URL</Label>
                <div className="flex gap-2">
                  <Input value={createdSource.webhook_url || webhookUrl} readOnly className="font-mono text-sm" />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(createdSource.webhook_url || webhookUrl, 'Webhook URL')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">X-Source-App-Id Header</Label>
                <div className="flex gap-2">
                  <Input value={createdSource.source_app_id} readOnly className="font-mono text-sm" />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(createdSource.source_app_id, 'Source App ID')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">X-Webhook-Secret Header</Label>
                <div className="flex gap-2">
                  <Input
                    value={createdSource.webhook_secret || ''}
                    readOnly
                    className="font-mono text-sm"
                    type="text"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(createdSource.webhook_secret || '', 'Webhook Secret')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  ⚠️ Save this secret now! It won&apos;t be shown again.
                </p>
              </div>
              <div className="rounded-lg border bg-muted/50 p-3">
                <p className="text-xs font-medium mb-2">Required Headers:</p>
                <pre className="text-xs font-mono whitespace-pre-wrap">
{`X-Source-App-Id: ${createdSource.source_app_id}
X-Webhook-Secret: ${createdSource.webhook_secret}
Content-Type: application/json`}
                </pre>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setCreatedSource(null)}>Done</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* No webhooks configured */}
      {sources.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            <Link2 className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="font-medium mb-1">No webhook integrations yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Connect external systems like Yi Connect or MyJKKN to automatically sync events.
            </p>
            {availableApps.length > 0 && (
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Integration
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        /* Display webhook sources as cards */
        sources.map((source) => (
          <Card key={source.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg text-xl ${
                      source.is_active
                        ? 'bg-green-100 dark:bg-green-900/30'
                        : 'bg-gray-100 dark:bg-gray-800'
                    }`}
                  >
                    {INTEGRATION_APPS.find((a) => a.id === source.source_app_id)?.icon || '🔗'}
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
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleToggleActive(source)}
                    title={source.is_active ? 'Deactivate' : 'Activate'}
                  >
                    <Power className={`h-4 w-4 ${source.is_active ? 'text-green-600' : 'text-gray-400'}`} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowDeleteDialog(source.id)}
                    title="Delete integration"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
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
                      ? formatDistanceToNow(new Date(source.last_sync_at), { addSuffix: true })
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

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/settings/integrations/${source.id}/fields`)}
                >
                  <Database className="mr-2 h-4 w-4" />
                  Configure Fields
                </Button>
              </div>

              {/* Webhook Details Collapsible */}
              <Collapsible>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-full justify-start">
                    <Settings2 className="mr-2 h-4 w-4" />
                    View Webhook Configuration
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-3 space-y-3">
                  <div className="rounded-lg border bg-muted/30 p-3 space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Webhook URL</Label>
                      <div className="flex gap-2 mt-1">
                        <Input value={webhookUrl} readOnly className="font-mono text-xs h-8" />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(webhookUrl, 'Webhook URL')}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Source App ID</Label>
                      <div className="flex gap-2 mt-1">
                        <Input value={source.source_app_id} readOnly className="font-mono text-xs h-8" />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(source.source_app_id, 'Source App ID')}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Webhook Secret</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          value={`${source.webhook_secret_preview}${'*'.repeat(56)}`}
                          readOnly
                          className="font-mono text-xs h-8"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRegenerateSecret(source)}
                          title="Regenerate secret"
                        >
                          <RefreshCw className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Click refresh to regenerate the webhook secret
                      </p>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </CardContent>
          </Card>
        ))
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!showDeleteDialog} onOpenChange={() => setShowDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Integration?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this webhook integration. Events already synced will remain,
              but no new events will be received from this source.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => showDeleteDialog && handleDeleteIntegration(showDeleteDialog)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Integration
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Regenerated Secret Dialog */}
      {showSecretDialog && (
        <Dialog open={!!showSecretDialog} onOpenChange={() => setShowSecretDialog(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>New Webhook Secret Generated</DialogTitle>
              <DialogDescription>
                Update your {showSecretDialog.name} configuration with this new secret.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">New Webhook Secret</Label>
                <div className="flex gap-2">
                  <Input
                    value={showSecretDialog.webhook_secret || ''}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(showSecretDialog.webhook_secret || '', 'Webhook Secret')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  ⚠️ Save this secret now! It won&apos;t be shown again.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setShowSecretDialog(null)}>Done</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
