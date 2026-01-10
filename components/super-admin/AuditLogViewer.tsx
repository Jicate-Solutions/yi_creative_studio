'use client'

import { useState, useEffect } from 'react'
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
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Download, Eye, Calendar, Shield } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAutoRefresh } from '@/hooks/use-auto-refresh'
import { RefreshIndicator } from '@/components/super-admin/RefreshIndicator'

interface AuditLog {
  id: string
  super_admin_id: string
  super_admin_email: string
  action: string
  resource_type: string
  resource_id: string | null
  target_organization_id: string | null
  target_user_id: string | null
  changes: any
  ip_address: string | null
  user_agent: string | null
  was_impersonating: boolean
  impersonated_user_id: string | null
  created_at: string
}

interface Pagination {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export default function AuditLogViewer() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    action: '',
    resourceType: '',
    dateFrom: '',
    dateTo: '',
    wasImpersonating: '',
  })
  const [availableFilters, setAvailableFilters] = useState<{
    actions: string[]
    resourceTypes: string[]
  }>({
    actions: [],
    resourceTypes: [],
  })
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    pageSize: 50,
    total: 0,
    totalPages: 0,
  })

  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
  const [exporting, setExporting] = useState(false)

  // Auto-refresh every 20 seconds
  const { isRefreshing, lastRefresh, manualRefresh } = useAutoRefresh({
    onRefresh: fetchLogs,
    interval: 20000, // 20 seconds
  })

  useEffect(() => {
    fetchLogs()
  }, [filters, pagination.page])

  async function fetchLogs() {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        pageSize: pagination.pageSize.toString(),
      })

      if (filters.action) params.append('action', filters.action)
      if (filters.resourceType) params.append('resourceType', filters.resourceType)
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom)
      if (filters.dateTo) params.append('dateTo', filters.dateTo)
      if (filters.wasImpersonating) params.append('wasImpersonating', filters.wasImpersonating)

      const response = await fetch(`/api/super-admin/audit/logs?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch audit logs')
      }

      const data = await response.json()
      setLogs(data.logs)
      setPagination(data.pagination)
      setAvailableFilters(data.filters)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to fetch audit logs')
    } finally {
      setLoading(false)
    }
  }

  async function handleExport(format: 'csv' | 'json') {
    setExporting(true)
    try {
      const response = await fetch('/api/super-admin/audit/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format,
          action: filters.action || undefined,
          resourceType: filters.resourceType || undefined,
          dateFrom: filters.dateFrom || undefined,
          dateTo: filters.dateTo || undefined,
          limit: 10000,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.details || 'Failed to export logs')
      }

      // Download file
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `audit-logs-${new Date().toISOString()}.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success(`Audit logs exported as ${format.toUpperCase()}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to export logs')
    } finally {
      setExporting(false)
    }
  }

  function getActionBadge(action: string) {
    const colorMap: Record<string, string> = {
      create: 'bg-green-100 text-green-800',
      update: 'bg-blue-100 text-blue-800',
      delete: 'bg-red-100 text-red-800',
      suspend: 'bg-red-100 text-red-800',
      reactivate: 'bg-green-100 text-green-800',
      impersonate: 'bg-purple-100 text-purple-800',
      allocate: 'bg-green-100 text-green-800',
      consume: 'bg-orange-100 text-orange-800',
      export: 'bg-blue-100 text-blue-800',
    }

    const parts = action.split(':')
    const actionType = parts[parts.length - 1]
    const color = colorMap[actionType] || 'bg-gray-100 text-gray-800'

    return <Badge className={color}>{action}</Badge>
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  function viewDetails(log: AuditLog) {
    setSelectedLog(log)
    setDetailDialogOpen(true)
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 bg-gray-50 rounded-lg">
        <Select
          value={filters.action}
          onValueChange={(value) => {
            setFilters({ ...filters, action: value })
            setPagination({ ...pagination, page: 1 })
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="All Actions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Actions</SelectItem>
            {availableFilters.actions.map((action) => (
              <SelectItem key={action} value={action}>
                {action}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.resourceType}
          onValueChange={(value) => {
            setFilters({ ...filters, resourceType: value })
            setPagination({ ...pagination, page: 1 })
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="All Resources" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Resources</SelectItem>
            {availableFilters.resourceTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="date"
            placeholder="From Date"
            value={filters.dateFrom}
            onChange={(e) => {
              setFilters({ ...filters, dateFrom: e.target.value })
              setPagination({ ...pagination, page: 1 })
            }}
            className="pl-10"
          />
        </div>

        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="date"
            placeholder="To Date"
            value={filters.dateTo}
            onChange={(e) => {
              setFilters({ ...filters, dateTo: e.target.value })
              setPagination({ ...pagination, page: 1 })
            }}
            className="pl-10"
          />
        </div>

        <Select
          value={filters.wasImpersonating}
          onValueChange={(value) => {
            setFilters({ ...filters, wasImpersonating: value })
            setPagination({ ...pagination, page: 1 })
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="All Sessions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Sessions</SelectItem>
            <SelectItem value="true">Impersonation Only</SelectItem>
            <SelectItem value="false">Direct Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Showing {logs.length} of {pagination.total} logs
        </div>
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport('csv')}
              disabled={exporting}
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport('json')}
              disabled={exporting}
            >
              <Download className="w-4 h-4 mr-2" />
              Export JSON
            </Button>
          </div>

          {/* Auto-refresh indicator */}
          <RefreshIndicator
            lastRefresh={lastRefresh}
            isRefreshing={isRefreshing}
            onManualRefresh={manualRefresh}
          />
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead>Timestamp</TableHead>
              <TableHead>Super Admin</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Resource</TableHead>
              <TableHead>Details</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  Loading audit logs...
                </TableCell>
              </TableRow>
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  No audit logs found
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-sm text-gray-600">
                    {formatDate(log.created_at)}
                  </TableCell>

                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-sm font-medium">{log.super_admin_email}</div>
                      {log.was_impersonating && (
                        <Badge className="bg-purple-100 text-purple-800 text-xs">
                          <Shield className="w-3 h-3 mr-1" />
                          Impersonating
                        </Badge>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>{getActionBadge(log.action)}</TableCell>

                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-sm font-medium capitalize">{log.resource_type}</div>
                      {log.resource_id && (
                        <div className="text-xs text-gray-500 font-mono">{log.resource_id.slice(0, 8)}...</div>
                      )}
                    </div>
                  </TableCell>

                  <TableCell className="text-sm text-gray-600">
                    {log.target_organization_id && (
                      <div className="text-xs">Org: {log.target_organization_id.slice(0, 8)}...</div>
                    )}
                    {log.target_user_id && (
                      <div className="text-xs">User: {log.target_user_id.slice(0, 8)}...</div>
                    )}
                    {log.ip_address && (
                      <div className="text-xs">IP: {log.ip_address}</div>
                    )}
                  </TableCell>

                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => viewDetails(log)}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Page {pagination.page} of {pagination.totalPages}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
              disabled={pagination.page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
              disabled={pagination.page === pagination.totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Audit Log Details</DialogTitle>
            <DialogDescription>Complete information about this Super Admin action</DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-gray-500">Timestamp</div>
                  <div className="text-sm">{formatDate(selectedLog.created_at)}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">Super Admin</div>
                  <div className="text-sm">{selectedLog.super_admin_email}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">Action</div>
                  <div className="text-sm">{getActionBadge(selectedLog.action)}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">Resource Type</div>
                  <div className="text-sm capitalize">{selectedLog.resource_type}</div>
                </div>
              </div>

              {selectedLog.resource_id && (
                <div>
                  <div className="text-sm font-medium text-gray-500">Resource ID</div>
                  <div className="text-sm font-mono bg-gray-50 p-2 rounded">{selectedLog.resource_id}</div>
                </div>
              )}

              {selectedLog.target_organization_id && (
                <div>
                  <div className="text-sm font-medium text-gray-500">Target Organization ID</div>
                  <div className="text-sm font-mono bg-gray-50 p-2 rounded">{selectedLog.target_organization_id}</div>
                </div>
              )}

              {selectedLog.target_user_id && (
                <div>
                  <div className="text-sm font-medium text-gray-500">Target User ID</div>
                  <div className="text-sm font-mono bg-gray-50 p-2 rounded">{selectedLog.target_user_id}</div>
                </div>
              )}

              {selectedLog.was_impersonating && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-purple-800 font-medium mb-1">
                    <Shield className="w-4 h-4" />
                    Impersonation Session
                  </div>
                  {selectedLog.impersonated_user_id && (
                    <div className="text-sm text-purple-700">
                      User ID: <span className="font-mono">{selectedLog.impersonated_user_id}</span>
                    </div>
                  )}
                </div>
              )}

              {selectedLog.changes && (
                <div>
                  <div className="text-sm font-medium text-gray-500 mb-2">Changes</div>
                  <pre className="text-xs bg-gray-50 p-4 rounded overflow-x-auto">
                    {JSON.stringify(selectedLog.changes, null, 2)}
                  </pre>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                {selectedLog.ip_address && (
                  <div>
                    <div className="text-sm font-medium text-gray-500">IP Address</div>
                    <div className="text-sm">{selectedLog.ip_address}</div>
                  </div>
                )}
                {selectedLog.user_agent && (
                  <div>
                    <div className="text-sm font-medium text-gray-500">User Agent</div>
                    <div className="text-sm truncate" title={selectedLog.user_agent}>
                      {selectedLog.user_agent}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
