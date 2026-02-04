'use client'

/**
 * Event Source Form Component
 * Create/Edit form for event sources
 */

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import toast from 'react-hot-toast'

interface Organization {
  id: string
  name: string
}

interface EventSource {
  id: string
  name: string
  source_app_id: string
  organization_id: string
  description: string | null
  is_active: boolean
  webhook_secret?: string
}

interface EventSourceFormProps {
  source?: EventSource
  onSuccess: (source: EventSource) => void
  onCancel: () => void
}

const SOURCE_APP_OPTIONS = [
  { value: 'yi-connect', label: 'Yi Connect' },
  { value: 'myjkkn', label: 'MyJKKN' },
  { value: 'custom', label: 'Custom' },
]

export default function EventSourceForm({ source, onSuccess, onCancel }: EventSourceFormProps) {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loadingOrgs, setLoadingOrgs] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Form state
  const [name, setName] = useState(source?.name || '')
  const [sourceAppId, setSourceAppId] = useState(source?.source_app_id || '')
  const [customSourceAppId, setCustomSourceAppId] = useState('')
  const [organizationId, setOrganizationId] = useState(source?.organization_id || '')
  const [description, setDescription] = useState(source?.description || '')
  const [isActive, setIsActive] = useState(source?.is_active ?? true)

  const isEditing = !!source

  // Fetch organizations
  useEffect(() => {
    async function fetchOrganizations() {
      try {
        const response = await fetch('/api/super-admin/organizations/list?pageSize=100')
        const data = await response.json()
        if (data.success) {
          setOrganizations(data.organizations)
        }
      } catch (error) {
        console.error('Failed to fetch organizations:', error)
        toast.error('Failed to load organizations')
      } finally {
        setLoadingOrgs(false)
      }
    }
    fetchOrganizations()
  }, [])

  // Determine if source_app_id is a known option or custom
  const isKnownSourceApp = SOURCE_APP_OPTIONS.some((opt) => opt.value === sourceAppId)
  const effectiveSourceAppId = isKnownSourceApp ? sourceAppId : 'custom'

  useEffect(() => {
    if (!isKnownSourceApp && sourceAppId) {
      setCustomSourceAppId(sourceAppId)
    }
  }, [isKnownSourceApp, sourceAppId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const finalSourceAppId = effectiveSourceAppId === 'custom' ? customSourceAppId : sourceAppId

    if (!name.trim()) {
      toast.error('Name is required')
      return
    }
    if (!finalSourceAppId.trim()) {
      toast.error('Source App ID is required')
      return
    }
    if (!organizationId) {
      toast.error('Organization is required')
      return
    }

    setSubmitting(true)

    try {
      const endpoint = isEditing
        ? `/api/super-admin/webhooks/sources/${source.id}`
        : '/api/super-admin/webhooks/sources/create'

      const method = isEditing ? 'PUT' : 'POST'

      const body = isEditing
        ? { name, description: description || null, is_active: isActive }
        : {
            name,
            source_app_id: finalSourceAppId,
            organization_id: organizationId,
            description: description || null,
            is_active: isActive,
          }

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await response.json()

      if (data.success) {
        toast.success(isEditing ? 'Event source updated' : 'Event source created')
        onSuccess(data.source)
      } else {
        toast.error(data.error || 'Failed to save event source')
      }
    } catch (error) {
      console.error('Submit error:', error)
      toast.error('Failed to save event source')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="name">Name *</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Yi Connect Production"
          required
        />
      </div>

      {/* Source App ID - Only show when creating */}
      {!isEditing && (
        <div className="space-y-2">
          <Label htmlFor="source_app_id">Source App ID *</Label>
          <Select
            value={effectiveSourceAppId}
            onValueChange={(value) => {
              if (value === 'custom') {
                setSourceAppId('')
              } else {
                setSourceAppId(value)
                setCustomSourceAppId('')
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select source app" />
            </SelectTrigger>
            <SelectContent>
              {SOURCE_APP_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {effectiveSourceAppId === 'custom' && (
            <Input
              value={customSourceAppId}
              onChange={(e) => setCustomSourceAppId(e.target.value)}
              placeholder="Enter custom source app ID"
              className="mt-2"
            />
          )}
        </div>
      )}

      {/* Show readonly source_app_id when editing */}
      {isEditing && (
        <div className="space-y-2">
          <Label>Source App ID</Label>
          <Input value={source.source_app_id} disabled className="bg-gray-50" />
          <p className="text-xs text-gray-500">Source App ID cannot be changed after creation</p>
        </div>
      )}

      {/* Organization - Only show when creating */}
      {!isEditing && (
        <div className="space-y-2">
          <Label htmlFor="organization_id">Organization *</Label>
          <Select value={organizationId} onValueChange={setOrganizationId} disabled={loadingOrgs}>
            <SelectTrigger>
              <SelectValue placeholder={loadingOrgs ? 'Loading...' : 'Select organization'} />
            </SelectTrigger>
            <SelectContent>
              {organizations.map((org) => (
                <SelectItem key={org.id} value={org.id}>
                  {org.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Show readonly organization when editing */}
      {isEditing && (
        <div className="space-y-2">
          <Label>Organization</Label>
          <Input
            value={organizations.find((o) => o.id === source.organization_id)?.name || source.organization_id}
            disabled
            className="bg-gray-50"
          />
          <p className="text-xs text-gray-500">Organization cannot be changed after creation</p>
        </div>
      )}

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional description for this event source"
          rows={3}
        />
      </div>

      {/* Active Status */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="is_active">Active</Label>
          <p className="text-xs text-gray-500">Allow webhooks from this source</p>
        </div>
        <Switch id="is_active" checked={isActive} onCheckedChange={setIsActive} />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Saving...' : isEditing ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  )
}
