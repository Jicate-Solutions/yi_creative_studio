'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { useOrganization } from '@/hooks'
import { useClientAdmin } from '@/hooks/use-client-admin'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertCircle,
  ArrowLeft,
  Check,
  Database,
  Hash,
  Loader2,
  Settings2,
  Type,
  Calendar,
} from 'lucide-react'
import { toast } from 'sonner'

interface DynamicField {
  id: string
  field_id: string
  field_label: string
  field_type: string
  display_label: string | null
  is_required: boolean
  usage_count: number
  first_seen_at: string
  last_seen_at: string
  canonical_mapping: string | null
  validation_rules: Record<string, unknown> | null
}

function getFieldTypeIcon(type: string) {
  switch (type) {
    case 'number':
      return <Hash className="h-4 w-4 text-blue-500" />
    case 'date':
      return <Calendar className="h-4 w-4 text-green-500" />
    case 'time':
      return <Calendar className="h-4 w-4 text-purple-500" />
    default:
      return <Type className="h-4 w-4 text-gray-500" />
  }
}

export default function FieldConfigurationPage({
  params,
}: {
  params: Promise<{ sourceId: string }>
}) {
  const { sourceId } = use(params)
  const router = useRouter()
  const { organization } = useOrganization()
  const { isAdmin, isReady } = useClientAdmin()

  const [fields, setFields] = useState<DynamicField[]>([])
  const [sourceAppId, setSourceAppId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [requiredFields, setRequiredFields] = useState<string[]>([])
  const [editingField, setEditingField] = useState<DynamicField | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  // Fetch fields
  useEffect(() => {
    const fetchFields = async () => {
      try {
        const response = await fetch(`/api/integrations/fields/${sourceId}`)
        const data = await response.json()

        if (data.success) {
          setFields(data.fields)
          setSourceAppId(data.source_app_id)
          setRequiredFields(data.fields.filter((f: DynamicField) => f.is_required).map((f: DynamicField) => f.field_id))
        } else {
          toast.error(data.error || 'Failed to load fields')
        }
      } catch {
        toast.error('Failed to load fields')
      } finally {
        setLoading(false)
      }
    }

    if (sourceId) {
      fetchFields()
    }
  }, [sourceId])

  // Toggle required field
  const handleToggleRequired = async (fieldId: string, isRequired: boolean) => {
    const newRequiredFields = isRequired
      ? [...requiredFields, fieldId]
      : requiredFields.filter((f) => f !== fieldId)

    setRequiredFields(newRequiredFields)

    try {
      const response = await fetch(`/api/integrations/fields/${sourceId}/required`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ required_fields: newRequiredFields }),
      })

      const data = await response.json()
      if (!data.success) {
        toast.error(data.error || 'Failed to update required fields')
        // Revert on error
        setRequiredFields(requiredFields)
      } else {
        toast.success(isRequired ? 'Field marked as required' : 'Field marked as optional')
      }
    } catch {
      toast.error('Failed to update required fields')
      setRequiredFields(requiredFields)
    }
  }

  // Update field configuration
  const handleUpdateField = async () => {
    if (!editingField) return

    setSaving(true)
    try {
      const response = await fetch(`/api/integrations/fields/${sourceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          field_id: editingField.field_id,
          updates: {
            display_label: editingField.display_label,
            canonical_mapping: editingField.canonical_mapping,
          },
        }),
      })

      const data = await response.json()
      if (data.success) {
        setFields(fields.map((f) =>
          f.field_id === editingField.field_id
            ? { ...f, display_label: editingField.display_label, canonical_mapping: editingField.canonical_mapping }
            : f
        ))
        toast.success('Field configuration updated')
        setEditDialogOpen(false)
        setEditingField(null)
      } else {
        toast.error(data.error || 'Failed to update field')
      }
    } catch {
      toast.error('Failed to update field')
    } finally {
      setSaving(false)
    }
  }

  // Loading state
  if (!isReady || !organization || loading) {
    return (
      <div className="container max-w-5xl py-8">
        <Skeleton className="mb-4 h-8 w-48" />
        <Skeleton className="mb-8 h-4 w-96" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  // Not admin
  if (!isAdmin) {
    return (
      <div className="container max-w-5xl py-8">
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Access Denied
            </CardTitle>
            <CardDescription>
              Only organization admins can manage field configurations.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="container max-w-5xl py-8">
      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        className="mb-4"
        onClick={() => router.push('/settings/integrations')}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Integrations
      </Button>

      {/* Header */}
      <div className="mb-8">
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Database className="h-6 w-6" />
          Field Configuration
        </h1>
        <p className="mt-1 text-muted-foreground">
          Configure how dynamic fields from <span className="font-medium">{sourceAppId}</span> are handled
        </p>
      </div>

      {/* No fields state */}
      {fields.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Database className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <h3 className="mb-2 text-lg font-medium">No Dynamic Fields Discovered</h3>
            <p className="max-w-sm text-center text-sm text-muted-foreground">
              Dynamic fields will appear here once webhooks start sending custom data.
              Send a test webhook with custom fields to see them listed here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Info Card */}
          <Card className="mb-6 border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base text-blue-800 dark:text-blue-200">
                <Settings2 className="h-4 w-4" />
                About Dynamic Fields
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-blue-700 dark:text-blue-300">
              <p>
                These fields were automatically discovered from incoming webhooks.
                Mark fields as <strong>required</strong> to ensure they&apos;re always sent by the source application.
                Webhooks missing required fields will be rejected with a validation error.
              </p>
            </CardContent>
          </Card>

          {/* Fields Table */}
          <Card>
            <CardHeader>
              <CardTitle>Discovered Fields ({fields.length})</CardTitle>
              <CardDescription>
                Fields automatically captured from {sourceAppId} webhooks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Field</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Display Label</TableHead>
                    <TableHead className="text-center">Usage</TableHead>
                    <TableHead className="text-center">Required</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fields.map((field) => (
                    <TableRow key={field.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getFieldTypeIcon(field.field_type)}
                          <code className="rounded bg-muted px-1.5 py-0.5 text-sm">
                            {field.field_id}
                          </code>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {field.field_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {field.display_label || field.field_label}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">{field.usage_count}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={requiredFields.includes(field.field_id)}
                          onCheckedChange={(checked) =>
                            handleToggleRequired(field.field_id, checked)
                          }
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingField(field)
                            setEditDialogOpen(true)
                          }}
                        >
                          <Settings2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Required Fields Summary */}
          {requiredFields.length > 0 && (
            <Card className="mt-6 border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base text-amber-800 dark:text-amber-200">
                  <Check className="h-4 w-4" />
                  Required Fields ({requiredFields.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {requiredFields.map((fieldId) => (
                    <Badge key={fieldId} variant="outline" className="border-amber-300 bg-amber-100 dark:border-amber-800 dark:bg-amber-900">
                      {fieldId}
                    </Badge>
                  ))}
                </div>
                <p className="mt-3 text-xs text-amber-700 dark:text-amber-300">
                  Webhooks without these fields will receive a 400 error response.
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Edit Field Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configure Field</DialogTitle>
            <DialogDescription>
              Customize how this field is displayed and mapped
            </DialogDescription>
          </DialogHeader>

          {editingField && (
            <div className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Field ID</Label>
                <code className="mt-1 block rounded bg-muted px-2 py-1.5">
                  {editingField.field_id}
                </code>
              </div>

              <div>
                <Label htmlFor="display_label">Display Label</Label>
                <Input
                  id="display_label"
                  value={editingField.display_label || editingField.field_label}
                  onChange={(e) =>
                    setEditingField({ ...editingField, display_label: e.target.value })
                  }
                  placeholder="Enter display label"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Human-readable label shown in the UI
                </p>
              </div>

              <div>
                <Label htmlFor="canonical_mapping">Map to Standard Field</Label>
                <Select
                  value={editingField.canonical_mapping || '_none_'}
                  onValueChange={(value) =>
                    setEditingField({
                      ...editingField,
                      canonical_mapping: value === '_none_' ? null : value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a mapping" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none_">No mapping</SelectItem>
                    <SelectItem value="dress_code">Dress Code</SelectItem>
                    <SelectItem value="parking">Parking Info</SelectItem>
                    <SelectItem value="sponsor">Sponsor Name</SelectItem>
                    <SelectItem value="budget">Budget</SelectItem>
                    <SelectItem value="contact_email">Contact Email</SelectItem>
                    <SelectItem value="contact_phone">Contact Phone</SelectItem>
                  </SelectContent>
                </Select>
                <p className="mt-1 text-xs text-muted-foreground">
                  Map to a standard field for consistent handling
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateField} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
