/**
 * Super Admin Event Sources Page
 * Manage external event sources
 */

import Link from 'next/link'
import { FileText, ExternalLink } from 'lucide-react'
import EventSourcesTable from '@/components/super-admin/webhooks/EventSourcesTable'

export default function EventSourcesPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Event Sources</h1>
          <p className="text-gray-600 mt-1">
            Configure external applications that can sync events via webhooks
          </p>
        </div>
        <Link
          href="/docs/integration-guide"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-2 rounded-lg"
        >
          <FileText className="h-4 w-4" />
          Integration Guide
          <ExternalLink className="h-3 w-3" />
        </Link>
      </div>

      {/* Event Sources Table */}
      <EventSourcesTable />
    </div>
  )
}
