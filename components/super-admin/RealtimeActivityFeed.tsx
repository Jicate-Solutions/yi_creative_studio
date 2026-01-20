'use client'

/**
 * Realtime Activity Feed Component
 * Displays live platform events as they happen
 */

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Building2,
  Users,
  CreditCard,
  ImagePlus,
  Shield,
  Activity,
  Clock,
  Trash2,
  ArrowUpDown,
} from 'lucide-react'
import { useSuperAdminRealtime, type RealtimeEvent, type RealtimeEventType } from '@/hooks/use-super-admin-realtime'
import { formatDistanceToNow } from 'date-fns'

const EVENT_CONFIG: Record<RealtimeEventType, {
  icon: typeof Building2
  label: string
  color: string
  bgColor: string
}> = {
  organization_created: {
    icon: Building2,
    label: 'New Organization',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
  organization_updated: {
    icon: Building2,
    label: 'Organization Updated',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  user_joined: {
    icon: Users,
    label: 'User Joined',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  user_updated: {
    icon: Users,
    label: 'User Updated',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
  },
  credit_transaction: {
    icon: CreditCard,
    label: 'Credit Transaction',
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
  },
  subscription_change: {
    icon: ArrowUpDown,
    label: 'Subscription Change',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
  },
  creative_generated: {
    icon: ImagePlus,
    label: 'Creative Generated',
    color: 'text-pink-600',
    bgColor: 'bg-pink-100',
  },
  audit_log: {
    icon: Shield,
    label: 'Admin Action',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
  },
}

interface RealtimeActivityFeedProps {
  maxHeight?: string
}

export default function RealtimeActivityFeed({ maxHeight = '400px' }: RealtimeActivityFeedProps) {
  const { events, clearEvents, isConnected } = useSuperAdminRealtime({ enabled: true })
  const [filter, setFilter] = useState<RealtimeEventType | 'all'>('all')

  const filteredEvents = filter === 'all'
    ? events
    : events.filter(e => e.type === filter)

  const getEventDescription = (event: RealtimeEvent): string => {
    switch (event.type) {
      case 'organization_created':
        return `Organization "${event.data.name || 'Unknown'}" was created`
      case 'organization_updated':
        return `Organization "${event.data.name || 'Unknown'}" was updated`
      case 'user_joined':
        return `New user joined with role: ${event.data.role || 'viewer'}`
      case 'user_updated':
        return `User role updated to: ${event.data.role || 'unknown'}`
      case 'credit_transaction':
        const amount = event.data.amount || 0
        const txType = event.data.type || 'unknown'
        if (txType === 'purchase') return `+${amount} credits purchased`
        if (txType === 'usage') return `${amount} credits used`
        if (txType === 'allocation') return `+${amount} credits allocated`
        return `${amount} credit transaction`
      case 'subscription_change':
        return `Subscription updated to: ${event.data.tier || 'unknown'}`
      case 'creative_generated':
        return `Creative "${event.data.title || 'Untitled'}" generated (${event.data.format || 'unknown'})`
      case 'audit_log':
        return `${event.data.adminEmail || 'Admin'}: ${event.data.action || 'action'}`
      default:
        return 'Unknown event'
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Live Activity Feed
              {isConnected && (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                </span>
              )}
            </CardTitle>
            <CardDescription>Real-time platform events</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as RealtimeEventType | 'all')}
              className="text-xs border rounded px-2 py-1 bg-white"
            >
              <option value="all">All Events</option>
              <option value="organization_created">Organizations</option>
              <option value="user_joined">Users</option>
              <option value="credit_transaction">Credits</option>
              <option value="creative_generated">Creatives</option>
              <option value="audit_log">Audit</option>
            </select>
            {events.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearEvents}>
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea style={{ height: maxHeight }}>
          {filteredEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Activity className="h-8 w-8 text-gray-300 mb-2" />
              <p className="text-sm text-gray-500">No activity yet</p>
              <p className="text-xs text-gray-400">Events will appear here in real-time</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredEvents.map((event) => {
                const config = EVENT_CONFIG[event.type]
                const Icon = config.icon

                return (
                  <div
                    key={event.id}
                    className="flex items-start gap-3 p-3 rounded-lg border bg-white hover:bg-gray-50 transition-colors animate-in fade-in slide-in-from-top-2 duration-300"
                  >
                    <div className={`p-2 rounded-full ${config.bgColor}`}>
                      <Icon className={`h-4 w-4 ${config.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className={`text-xs ${config.color}`}>
                          {config.label}
                        </Badge>
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 truncate">
                        {getEventDescription(event)}
                      </p>
                      {event.data.organizationId && (
                        <p className="text-xs text-gray-400 mt-1 truncate">
                          Org: {event.data.organizationId.slice(0, 8)}...
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
