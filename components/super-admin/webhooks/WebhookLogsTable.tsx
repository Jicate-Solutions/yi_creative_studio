'use client'

/**
 * Webhook Logs Table Component
 * Display webhook call history with filtering
 */

import { useState, useEffect, useCallback } from 'react'
import { Search, RefreshCw, Eye, Clock, AlertCircle, CheckCircle, XCircle } from 'lucide-react'
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
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import toast from 'react-hot-toast'

interface WebhookLog {
  id: string
  event_source_id: string | null
  source_app_id: string
  organization_id: string
  action: string
  external_event_id: string | null
  event_name: string | null
  status: string
  error_message: string | null
  ip_address: string | null
  user_agent: string | null
  duration_ms: number | null
  created_at: string
  organization: {
    id: string
    name: string
  } | null
  request_payload?: Record<string, unknown>
  response_payload?: Record<string, unknown>
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'success', label: 'Success' },
  { value: 'error', label: 'Error' },
  { value: 'validation_error', label: 'Validation Error' },
]

const ACTION_OPTIONS = [
  { value: 'all', label: 'All Actions' },
  { value: 'create', label: 'Create' },
  { value: 'update', label: 'Update' },
  { value: 'delete', label: 'Delete' },
]

export default function WebhookLogsTable() {
  const [logs, setLogs] = useState<WebhookLog[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [actionFilter, setActionFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  // Detail dialog
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [selectedLog, setSelectedLog] = useState<WebhookLog | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  const fetchLogs = useCallback(async () => {
    setLoading(true)

    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: '25',
      ...(statusFilter !== 'all' && { status: statusFilter }),
      ...(actionFilter !== 'all' && { action: actionFilter }),
    })

    try {
      const response = await fetch(`/api/super-admin/webhooks/logs/list?${params}`)
      const data = await response.json()

      if (data.success) {
        setLogs(data.logs)
        setTotalPages(data.pagination.totalPages)
        setTotal(data.pagination.total)
      }
    } catch (error) {
      console.error('Failed to fetch webhook logs:', error)
      toast.error('Failed to load webhook logs')
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter, actionFilter])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  const fetchLogDetail = async (logId: string) => {
    setLoadingDetail(true)
    try {
      const response = await fetch(`/api/super-admin/webhooks/logs/${logId}`)
      const data = await response.json()
      if (data.success) {
        setSelectedLog(data.log)
      }
    } catch (error) {
      console.error('Failed to fetch log detail:', error)
      toast.error('Failed to load log details')
    } finally {
      setLoadingDetail(false)
    }
  }

  function formatDateTime(dateString: string) {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'validation_error':
        return <AlertCircle className="h-4 w-4 text-amber-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  function getStatusBadge(status: string) {
    const colors: Record<string, string> = {
      success: 'bg-green-100 text-green-800',
      error: 'bg-red-100 text-red-800',
      validation_error: 'bg-amber-100 text-amber-800',
    }
    return (
      <Badge className={colors[status] || 'bg-gray-100 text-gray-800'}>
        {status.replace('_', ' ')}
      </Badge>
    )
  }

  function getActionBadge(action: string) {
    const colors: Record<string, string> = {
      create: 'bg-blue-100 text-blue-800',
      update: 'bg-purple-100 text-purple-800',
      delete: 'bg-red-100 text-red-800',
    }
    return (
      <Badge variant="outline" className={colors[action] || ''}>
        {action}
      </Badge>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 flex-1">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder="Action" />
            </SelectTrigger>
            <SelectContent>
              {ACTION_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">{total} logs</span>
          <Button variant="ghost" size="sm" onClick={fetchLogs} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg bg-white overflow-x-auto">
        <Table className="min-w-[800px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Status</TableHead>
              <TableHead>Timestamp</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Event</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  Loading logs...
                </TableCell>
              </TableRow>
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  No webhook logs found
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow
                  key={log.id}
                  className={`hover:bg-gray-50 transition-colors ${
                    log.status === 'error' || log.status === 'validation_error' ? 'bg-red-50/30' : ''
                  }`}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(log.status)}
                      {getStatusBadge(log.status)}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {formatDateTime(log.created_at)}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="font-medium">{log.source_app_id}</div>
                      <div className="text-xs text-gray-500">
                        {log.organization?.name || 'Unknown org'}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getActionBadge(log.action)}</TableCell>
                  <TableCell>
                    <div className="text-sm max-w-[200px]">
                      {log.event_name ? (
                        <div className="truncate">{log.event_name}</div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                      {log.external_event_id && (
                        <div className="text-xs text-gray-500 truncate">
                          ID: {log.external_event_id}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {log.duration_ms !== null ? (
                      <span
                        className={`text-sm ${
                          log.duration_ms > 1000 ? 'text-amber-600' : 'text-gray-600'
                        }`}
                      >
                        {log.duration_ms}ms
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedLog(log)
                        setShowDetailDialog(true)
                        fetchLogDetail(log.id)
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
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

      {/* Log Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Webhook Log Details</DialogTitle>
          </DialogHeader>

          {loadingDetail ? (
            <div className="py-8 text-center text-gray-500">Loading details...</div>
          ) : selectedLog ? (
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="font-medium text-gray-500">Status</label>
                  <p>{getStatusBadge(selectedLog.status)}</p>
                </div>
                <div>
                  <label className="font-medium text-gray-500">Duration</label>
                  <p>{selectedLog.duration_ms !== null ? `${selectedLog.duration_ms}ms` : '-'}</p>
                </div>
                <div>
                  <label className="font-medium text-gray-500">Source</label>
                  <p>{selectedLog.source_app_id}</p>
                </div>
                <div>
                  <label className="font-medium text-gray-500">Action</label>
                  <p>{getActionBadge(selectedLog.action)}</p>
                </div>
                <div>
                  <label className="font-medium text-gray-500">Organization</label>
                  <p>{selectedLog.organization?.name || '-'}</p>
                </div>
                <div>
                  <label className="font-medium text-gray-500">Timestamp</label>
                  <p>{formatDateTime(selectedLog.created_at)}</p>
                </div>
                <div>
                  <label className="font-medium text-gray-500">IP Address</label>
                  <p className="font-mono text-xs">{selectedLog.ip_address || '-'}</p>
                </div>
                <div>
                  <label className="font-medium text-gray-500">User Agent</label>
                  <p className="text-xs truncate">{selectedLog.user_agent || '-'}</p>
                </div>
              </div>

              {/* Error Message */}
              {selectedLog.error_message && (
                <div className="space-y-1">
                  <label className="font-medium text-gray-500 text-sm">Error Message</label>
                  <pre className="bg-red-50 text-red-800 p-3 rounded text-xs overflow-x-auto">
                    {selectedLog.error_message}
                  </pre>
                </div>
              )}

              {/* Request Payload */}
              {selectedLog.request_payload && (
                <div className="space-y-1">
                  <label className="font-medium text-gray-500 text-sm">Request Payload</label>
                  <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto max-h-[200px]">
                    {JSON.stringify(selectedLog.request_payload, null, 2)}
                  </pre>
                </div>
              )}

              {/* Response Payload */}
              {selectedLog.response_payload && (
                <div className="space-y-1">
                  <label className="font-medium text-gray-500 text-sm">Response Payload</label>
                  <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto max-h-[200px]">
                    {JSON.stringify(selectedLog.response_payload, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
