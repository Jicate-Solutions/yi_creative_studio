'use client'

/**
 * Event Sources Table Component
 * CRUD table for managing event sources
 */

import { useState, useEffect, useCallback } from 'react'
import { Search, RefreshCw, Plus, Edit, Trash2, Key, Eye, EyeOff, Copy, Check } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import toast from 'react-hot-toast'
import EventSourceForm from './EventSourceForm'

interface EventSource {
  id: string
  name: string
  source_app_id: string
  organization_id: string
  description: string | null
  is_active: boolean
  webhook_secret: string
  webhook_secret_preview: string | null
  last_sync_at: string | null
  total_syncs: number
  error_count: number
  created_at: string
  organization: {
    id: string
    name: string
  } | null
}

export default function EventSourcesTable() {
  const [sources, setSources] = useState<EventSource[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showSecretDialog, setShowSecretDialog] = useState(false)
  const [selectedSource, setSelectedSource] = useState<EventSource | null>(null)
  const [newSecret, setNewSecret] = useState<string | null>(null)
  const [visibleSecrets, setVisibleSecrets] = useState<Set<string>>(new Set())
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const fetchSources = useCallback(async () => {
    setLoading(true)

    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: '25',
      search,
      ...(statusFilter !== 'all' && { status: statusFilter }),
    })

    try {
      const response = await fetch(`/api/super-admin/webhooks/sources/list?${params}`)
      const data = await response.json()

      if (data.success) {
        setSources(data.sources)
        setTotalPages(data.pagination.totalPages)
      }
    } catch (error) {
      console.error('Failed to fetch event sources:', error)
      toast.error('Failed to load event sources')
    } finally {
      setLoading(false)
    }
  }, [page, search, statusFilter])

  useEffect(() => {
    fetchSources()
  }, [fetchSources])

  const handleDelete = async () => {
    if (!selectedSource) return

    try {
      const response = await fetch(`/api/super-admin/webhooks/sources/${selectedSource.id}`, {
        method: 'DELETE',
      })
      const data = await response.json()

      if (data.success) {
        toast.success('Event source deleted')
        fetchSources()
      } else {
        toast.error(data.error || 'Failed to delete')
      }
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Failed to delete event source')
    } finally {
      setShowDeleteDialog(false)
      setSelectedSource(null)
    }
  }

  const handleRegenerateSecret = async () => {
    if (!selectedSource) return

    try {
      const response = await fetch(
        `/api/super-admin/webhooks/sources/${selectedSource.id}/regenerate-secret`,
        { method: 'POST' }
      )
      const data = await response.json()

      if (data.success) {
        setNewSecret(data.source.webhook_secret)
        toast.success('Webhook secret regenerated')
        fetchSources()
      } else {
        toast.error(data.error || 'Failed to regenerate secret')
      }
    } catch (error) {
      console.error('Regenerate error:', error)
      toast.error('Failed to regenerate secret')
    }
  }

  const toggleSecretVisibility = (id: string) => {
    const newVisible = new Set(visibleSecrets)
    if (newVisible.has(id)) {
      newVisible.delete(id)
    } else {
      newVisible.add(id)
    }
    setVisibleSecrets(newVisible)
  }

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(id)
      toast.success('Copied to clipboard')
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      toast.error('Failed to copy')
    }
  }

  function formatDate(dateString: string | null) {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="space-y-4">
      {/* Search & Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 flex-1">
          <div className="relative flex-1 min-w-0 sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search sources..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              className="pl-10"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Source
          </Button>
          <Button variant="ghost" size="sm" onClick={fetchSources} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg bg-white overflow-x-auto">
        <Table className="min-w-[900px]">
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Source App ID</TableHead>
              <TableHead>Organization</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Webhook Secret</TableHead>
              <TableHead>Last Sync</TableHead>
              <TableHead>Syncs</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                  Loading event sources...
                </TableCell>
              </TableRow>
            ) : sources.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                  No event sources found
                </TableCell>
              </TableRow>
            ) : (
              sources.map((source) => (
                <TableRow key={source.id} className="hover:bg-gray-50 transition-colors">
                  <TableCell className="font-medium">
                    <div>
                      <div className="font-semibold">{source.name}</div>
                      {source.description && (
                        <div className="text-xs text-gray-500 truncate max-w-[200px]">
                          {source.description}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{source.source_app_id}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">
                        {source.organization?.name || (
                          <span className="text-gray-400">Unknown</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <code className="text-xs text-gray-500 font-mono bg-gray-50 px-1.5 py-0.5 rounded">
                          {source.organization_id.substring(0, 8)}...
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0"
                          onClick={() => copyToClipboard(source.organization_id, `org-${source.id}`)}
                          title="Copy Organization ID"
                        >
                          {copiedId === `org-${source.id}` ? (
                            <Check className="h-3 w-3 text-green-600" />
                          ) : (
                            <Copy className="h-3 w-3 text-gray-400" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        source.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }
                    >
                      {source.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {visibleSecrets.has(source.id)
                          ? source.webhook_secret
                          : `${source.webhook_secret_preview}${'*'.repeat(24)}`}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleSecretVisibility(source.id)}
                      >
                        {visibleSecrets.has(source.id) ? (
                          <EyeOff className="h-3 w-3" />
                        ) : (
                          <Eye className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {formatDate(source.last_sync_at)}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <span className="font-medium">{source.total_syncs}</span>
                      {source.error_count > 0 && (
                        <span className="text-red-600 ml-1">({source.error_count} errors)</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedSource(source)
                          setShowEditDialog(true)
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedSource(source)
                          setNewSecret(null)
                          setShowSecretDialog(true)
                        }}
                      >
                        <Key className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => {
                          setSelectedSource(source)
                          setShowDeleteDialog(true)
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Event Source</DialogTitle>
            <DialogDescription>
              Create a new event source for external webhook integration.
            </DialogDescription>
          </DialogHeader>
          <EventSourceForm
            onSuccess={(newSource) => {
              setShowCreateDialog(false)
              fetchSources()
              // Show the new secret
              if (newSource.webhook_secret) {
                // Cast to EventSource with defaults for display-only fields
                setSelectedSource({
                  ...newSource,
                  webhook_secret: newSource.webhook_secret || '',
                  webhook_secret_preview: newSource.webhook_secret?.substring(0, 8) || null,
                  last_sync_at: null,
                  total_syncs: 0,
                  error_count: 0,
                  created_at: new Date().toISOString(),
                  organization: null,
                } as EventSource)
                setNewSecret(newSource.webhook_secret)
                setShowSecretDialog(true)
              }
            }}
            onCancel={() => setShowCreateDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Event Source</DialogTitle>
            <DialogDescription>Update event source configuration.</DialogDescription>
          </DialogHeader>
          {selectedSource && (
            <EventSourceForm
              source={selectedSource}
              onSuccess={() => {
                setShowEditDialog(false)
                setSelectedSource(null)
                fetchSources()
              }}
              onCancel={() => {
                setShowEditDialog(false)
                setSelectedSource(null)
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event Source?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the event source &quot;{selectedSource?.name}&quot;. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedSource(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Secret Management Dialog with Integration Details */}
      <Dialog open={showSecretDialog} onOpenChange={setShowSecretDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {newSecret ? '🎉 Webhook Created Successfully!' : 'Webhook Integration Details'}
            </DialogTitle>
            <DialogDescription>
              {newSecret
                ? 'Copy the integration details below. The secret will not be shown again.'
                : 'View integration details for this webhook source.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Webhook Endpoint */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Webhook Endpoint</label>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-gray-100 px-3 py-2 rounded text-sm font-mono break-all">
                  {typeof window !== 'undefined' ? window.location.origin : ''}/api/webhooks/events
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(
                    `${typeof window !== 'undefined' ? window.location.origin : ''}/api/webhooks/events`,
                    'endpoint'
                  )}
                >
                  {copiedId === 'endpoint' ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Organization ID */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Organization ID</label>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-gray-100 px-3 py-2 rounded text-sm font-mono break-all">
                  {selectedSource?.organization_id}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(selectedSource?.organization_id || '', 'org-id')}
                >
                  {copiedId === 'org-id' ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Source App ID */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Source App ID</label>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-gray-100 px-3 py-2 rounded text-sm font-mono">
                  {selectedSource?.source_app_id}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(selectedSource?.source_app_id || '', 'source-app')}
                >
                  {copiedId === 'source-app' ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Webhook Secret */}
            <div className="space-y-1">
              <label className={`text-sm font-medium ${newSecret ? 'text-green-600' : 'text-gray-700'}`}>
                Webhook Secret {newSecret && '(NEW - Save Now!)'}
              </label>
              <div className="flex items-center gap-2">
                <code className={`flex-1 px-3 py-2 rounded text-sm font-mono break-all ${
                  newSecret ? 'bg-green-50 border border-green-200' : 'bg-gray-100'
                }`}>
                  {newSecret || `${selectedSource?.webhook_secret_preview}${'*'.repeat(24)}`}
                </code>
                {newSecret && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(newSecret, 'secret')}
                  >
                    {copiedId === 'secret' ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                  </Button>
                )}
              </div>
              {newSecret && (
                <p className="text-xs text-amber-600 font-medium">
                  ⚠️ This secret will only be shown once. Copy it now!
                </p>
              )}
            </div>

            {/* Environment Variables */}
            {newSecret && (
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Environment Variables</label>
                <div className="relative">
                  <pre className="bg-gray-900 text-gray-100 p-3 rounded-lg text-xs overflow-x-auto">
{`# Yi CreativeStudio Integration
YI_STUDIO_WEBHOOK_URL=${typeof window !== 'undefined' ? window.location.origin : ''}/api/webhooks/events
YI_STUDIO_WEBHOOK_SECRET=${newSecret}
YI_STUDIO_ORG_ID=${selectedSource?.organization_id}`}
                  </pre>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-1 right-1 text-gray-400 hover:text-white h-6 w-6 p-0"
                    onClick={() => copyToClipboard(
`# Yi CreativeStudio Integration
YI_STUDIO_WEBHOOK_URL=${typeof window !== 'undefined' ? window.location.origin : ''}/api/webhooks/events
YI_STUDIO_WEBHOOK_SECRET=${newSecret}
YI_STUDIO_ORG_ID=${selectedSource?.organization_id}`,
                      'env'
                    )}
                  >
                    {copiedId === 'env' ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
                  </Button>
                </div>
              </div>
            )}

            {/* cURL Example */}
            {newSecret && (
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">cURL Example</label>
                <div className="relative">
                  <pre className="bg-gray-900 text-gray-100 p-3 rounded-lg text-xs overflow-x-auto whitespace-pre-wrap">
{`curl -X POST '${typeof window !== 'undefined' ? window.location.origin : ''}/api/webhooks/events' \\
  -H 'Content-Type: application/json' \\
  -H 'X-Source-App-Id: ${selectedSource?.source_app_id}' \\
  -H 'X-Webhook-Secret: ${newSecret}' \\
  -d '{
    "action": "create",
    "organization_id": "${selectedSource?.organization_id}",
    "event": {
      "id": "event-001",
      "name": "Test Event",
      "date": "2026-03-15",
      "status": "published",
      "createdAt": "${new Date().toISOString()}",
      "updatedAt": "${new Date().toISOString()}"
    }
  }'`}
                  </pre>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-1 right-1 text-gray-400 hover:text-white h-6 w-6 p-0"
                    onClick={() => copyToClipboard(
`curl -X POST '${typeof window !== 'undefined' ? window.location.origin : ''}/api/webhooks/events' \\
  -H 'Content-Type: application/json' \\
  -H 'X-Source-App-Id: ${selectedSource?.source_app_id}' \\
  -H 'X-Webhook-Secret: ${newSecret}' \\
  -d '{
    "action": "create",
    "organization_id": "${selectedSource?.organization_id}",
    "event": {
      "id": "event-001",
      "name": "Test Event",
      "date": "2026-03-15",
      "status": "published",
      "createdAt": "${new Date().toISOString()}",
      "updatedAt": "${new Date().toISOString()}"
    }
  }'`,
                      'curl'
                    )}
                  >
                    {copiedId === 'curl' ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
                  </Button>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            {!newSecret && (
              <Button variant="destructive" onClick={handleRegenerateSecret}>
                <Key className="h-4 w-4 mr-2" />
                Regenerate Secret
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => {
                setShowSecretDialog(false)
                setSelectedSource(null)
                setNewSecret(null)
              }}
            >
              {newSecret ? 'Done' : 'Close'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
