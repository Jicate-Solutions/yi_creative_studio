'use client'

/**
 * Synced Events Table Component
 * Display all events synced from external sources
 */

import { useState, useEffect, useCallback } from 'react'
import { Search, RefreshCw, Calendar, MapPin, Globe, Eye } from 'lucide-react'
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

interface SyncedEvent {
  id: string
  external_id: string
  source_app_id: string
  organization_id: string
  event_name: string
  event_date: string | null
  event_time: string | null
  venue: string | null
  city: string | null
  status: string
  is_virtual: boolean
  chapter_name: string | null
  synced_at: string
  created_at: string
  updated_at: string
  organization: {
    id: string
    name: string
  } | null
}

const SOURCE_OPTIONS = [
  { value: 'all', label: 'All Sources' },
  { value: 'yi-connect', label: 'Yi Connect' },
  { value: 'myjkkn', label: 'MyJKKN' },
]

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Draft' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

export default function SyncedEventsTable() {
  const [events, setEvents] = useState<SyncedEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  // Detail dialog
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<SyncedEvent | null>(null)

  const fetchEvents = useCallback(async () => {
    setLoading(true)

    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: '25',
      search,
      ...(sourceFilter !== 'all' && { source: sourceFilter }),
      ...(statusFilter !== 'all' && { status: statusFilter }),
    })

    try {
      const response = await fetch(`/api/super-admin/webhooks/events/list?${params}`)
      const data = await response.json()

      if (data.success) {
        setEvents(data.events)
        setTotalPages(data.pagination.totalPages)
        setTotal(data.pagination.total)
      }
    } catch (error) {
      console.error('Failed to fetch synced events:', error)
      toast.error('Failed to load synced events')
    } finally {
      setLoading(false)
    }
  }, [page, search, sourceFilter, statusFilter])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  function formatDate(dateString: string | null) {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  function formatDateTime(dateString: string) {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  function getStatusBadge(status: string) {
    const colors: Record<string, string> = {
      published: 'bg-green-100 text-green-800',
      draft: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-red-100 text-red-800',
    }
    return (
      <Badge className={colors[status] || 'bg-gray-100 text-gray-800'}>
        {status}
      </Badge>
    )
  }

  function getSourceBadge(source: string) {
    const colors: Record<string, string> = {
      'yi-connect': 'bg-purple-100 text-purple-800',
      'myjkkn': 'bg-blue-100 text-blue-800',
    }
    return (
      <Badge variant="outline" className={colors[source] || ''}>
        {source}
      </Badge>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search & Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 flex-1">
          <div className="relative flex-1 min-w-0 sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search events..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              className="pl-10"
            />
          </div>

          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              {SOURCE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[160px]">
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
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">{total} events</span>
          <Button variant="ghost" size="sm" onClick={fetchEvents} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg bg-white overflow-x-auto">
        <Table className="min-w-[900px]">
          <TableHeader>
            <TableRow>
              <TableHead>Event Name</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Organization</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Synced At</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                  Loading events...
                </TableCell>
              </TableRow>
            ) : events.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                  No synced events found
                </TableCell>
              </TableRow>
            ) : (
              events.map((event) => (
                <TableRow key={event.id} className="hover:bg-gray-50 transition-colors">
                  <TableCell className="font-medium">
                    <div>
                      <div className="font-semibold truncate max-w-[200px]">{event.event_name}</div>
                      <div className="text-xs text-gray-500">ID: {event.external_id}</div>
                    </div>
                  </TableCell>
                  <TableCell>{getSourceBadge(event.source_app_id)}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {event.organization?.name || <span className="text-gray-400">Unknown</span>}
                      {event.chapter_name && (
                        <div className="text-xs text-gray-500">{event.chapter_name}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <Calendar className="h-3 w-3 text-gray-400" />
                      {formatDate(event.event_date)}
                      {event.event_time && (
                        <span className="text-gray-500 text-xs ml-1">{event.event_time}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      {event.is_virtual ? (
                        <>
                          <Globe className="h-3 w-3 text-blue-500" />
                          <span className="text-blue-600">Virtual</span>
                        </>
                      ) : event.venue || event.city ? (
                        <>
                          <MapPin className="h-3 w-3 text-gray-400" />
                          <span className="truncate max-w-[120px]">
                            {event.venue || event.city}
                          </span>
                        </>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(event.status)}</TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {formatDateTime(event.synced_at)}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedEvent(event)
                        setShowDetailDialog(true)
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

      {/* Event Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Event Details</DialogTitle>
          </DialogHeader>

          {selectedEvent && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="font-medium text-gray-500">Event Name</label>
                  <p>{selectedEvent.event_name}</p>
                </div>
                <div>
                  <label className="font-medium text-gray-500">External ID</label>
                  <p className="font-mono text-xs">{selectedEvent.external_id}</p>
                </div>
                <div>
                  <label className="font-medium text-gray-500">Source</label>
                  <p>{selectedEvent.source_app_id}</p>
                </div>
                <div>
                  <label className="font-medium text-gray-500">Status</label>
                  <p>{getStatusBadge(selectedEvent.status)}</p>
                </div>
                <div>
                  <label className="font-medium text-gray-500">Date</label>
                  <p>
                    {formatDate(selectedEvent.event_date)}
                    {selectedEvent.event_time && ` at ${selectedEvent.event_time}`}
                  </p>
                </div>
                <div>
                  <label className="font-medium text-gray-500">Location</label>
                  <p>
                    {selectedEvent.is_virtual
                      ? 'Virtual Event'
                      : selectedEvent.venue || selectedEvent.city || '-'}
                  </p>
                </div>
                <div>
                  <label className="font-medium text-gray-500">Organization</label>
                  <p>{selectedEvent.organization?.name || '-'}</p>
                </div>
                <div>
                  <label className="font-medium text-gray-500">Chapter</label>
                  <p>{selectedEvent.chapter_name || '-'}</p>
                </div>
                <div>
                  <label className="font-medium text-gray-500">Synced At</label>
                  <p>{formatDateTime(selectedEvent.synced_at)}</p>
                </div>
                <div>
                  <label className="font-medium text-gray-500">Last Updated</label>
                  <p>{formatDateTime(selectedEvent.updated_at)}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
