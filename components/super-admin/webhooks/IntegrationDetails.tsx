'use client'

/**
 * Integration Details Component
 * Shows webhook integration details for external apps
 */

import { useState, useEffect } from 'react'
import { Copy, Check, ExternalLink, Code, FileText, Building2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import toast from 'react-hot-toast'

interface Organization {
  id: string
  name: string
}

interface IntegrationDetailsProps {
  organizationId?: string
  webhookSecret?: string
  sourceAppId?: string
}

export default function IntegrationDetails({
  organizationId,
  webhookSecret,
  sourceAppId = 'your-app-id',
}: IntegrationDetailsProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loadingOrgs, setLoadingOrgs] = useState(true)

  // Fetch organizations for the ID reference table
  useEffect(() => {
    async function fetchOrganizations() {
      try {
        const response = await fetch('/api/super-admin/organizations/list?pageSize=100')
        const data = await response.json()
        if (data.success && data.organizations) {
          setOrganizations(data.organizations.map((org: any) => ({
            id: org.id,
            name: org.name,
          })))
        }
      } catch (error) {
        console.error('Failed to fetch organizations:', error)
      } finally {
        setLoadingOrgs(false)
      }
    }
    fetchOrganizations()
  }, [])

  const webhookUrl =
    process.env.NEXT_PUBLIC_APP_URL || 'https://yi-studio.yichapter.org'
  const fullWebhookEndpoint = `${webhookUrl}/api/webhooks/events`

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      toast.success('Copied to clipboard')
      setTimeout(() => setCopiedField(null), 2000)
    } catch {
      toast.error('Failed to copy')
    }
  }

  const envVarsTemplate = `# Yi CreativeStudio Integration
YI_STUDIO_WEBHOOK_URL=${fullWebhookEndpoint}
YI_STUDIO_WEBHOOK_SECRET=${webhookSecret || 'your-webhook-secret'}
YI_STUDIO_ORG_ID=${organizationId || 'your-organization-uuid'}
NEXT_PUBLIC_YI_STUDIO_URL=${webhookUrl}`

  const curlExample = `curl -X POST '${fullWebhookEndpoint}' \\
  -H 'Content-Type: application/json' \\
  -H 'X-Source-App-Id: ${sourceAppId}' \\
  -H 'X-Webhook-Secret: ${webhookSecret || 'your-webhook-secret'}' \\
  -d '{
    "action": "create",
    "organization_id": "${organizationId || 'your-organization-uuid'}",
    "event": {
      "id": "event-001",
      "name": "Annual Conference 2026",
      "date": "2026-03-15",
      "startTime": "10:00",
      "endTime": "17:00",
      "venue": "Convention Center",
      "city": "Chennai",
      "status": "published",
      "createdAt": "2026-01-28T10:00:00Z",
      "updatedAt": "2026-01-28T10:00:00Z"
    }
  }'`

  const requiredHeaders = [
    { name: 'Content-Type', value: 'application/json', required: true },
    { name: 'X-Source-App-Id', value: sourceAppId, required: true },
    { name: 'X-Webhook-Secret', value: 'your-webhook-secret', required: false },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Code className="h-5 w-5" />
          Integration Details
        </CardTitle>
        <CardDescription>
          Use these details to integrate external applications with Yi CreativeStudio
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Webhook Endpoint */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Webhook Endpoint</label>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-gray-100 px-3 py-2 rounded text-sm font-mono break-all">
              {fullWebhookEndpoint}
            </code>
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(fullWebhookEndpoint, 'endpoint')}
            >
              {copiedField === 'endpoint' ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-gray-500">POST requests only</p>
        </div>

        {/* Required Headers */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Required Headers</label>
          <div className="bg-gray-50 rounded-lg p-3 space-y-2">
            {requiredHeaders.map((header) => (
              <div key={header.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <code className="font-mono text-blue-600">{header.name}</code>
                  {header.required ? (
                    <Badge variant="destructive" className="text-xs">Required</Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">Recommended</Badge>
                  )}
                </div>
                <code className="text-gray-600">{header.value}</code>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Supported Actions</label>
          <div className="flex gap-2">
            <Badge className="bg-green-100 text-green-800">create</Badge>
            <Badge className="bg-blue-100 text-blue-800">update</Badge>
            <Badge className="bg-red-100 text-red-800">delete</Badge>
          </div>
        </div>

        {/* Accordion for detailed info */}
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="env-vars">
            <AccordionTrigger className="text-sm font-medium">
              Environment Variables Template
            </AccordionTrigger>
            <AccordionContent>
              <div className="relative">
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto">
                  {envVarsTemplate}
                </pre>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 text-gray-400 hover:text-white"
                  onClick={() => copyToClipboard(envVarsTemplate, 'env')}
                >
                  {copiedField === 'env' ? (
                    <Check className="h-4 w-4 text-green-400" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="curl">
            <AccordionTrigger className="text-sm font-medium">
              cURL Example
            </AccordionTrigger>
            <AccordionContent>
              <div className="relative">
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto whitespace-pre-wrap">
                  {curlExample}
                </pre>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 text-gray-400 hover:text-white"
                  onClick={() => copyToClipboard(curlExample, 'curl')}
                >
                  {copiedField === 'curl' ? (
                    <Check className="h-4 w-4 text-green-400" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="payload">
            <AccordionTrigger className="text-sm font-medium">
              Event Payload Schema
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  Required fields are marked with <Badge variant="destructive" className="text-xs">Required</Badge>
                </p>
                <div className="bg-gray-50 rounded-lg p-3 space-y-1 text-sm font-mono">
                  <div><span className="text-purple-600">id</span>: string <Badge variant="destructive" className="text-xs ml-1">Required</Badge></div>
                  <div><span className="text-purple-600">name</span>: string <Badge variant="destructive" className="text-xs ml-1">Required</Badge></div>
                  <div><span className="text-purple-600">date</span>: string (YYYY-MM-DD) <Badge variant="destructive" className="text-xs ml-1">Required</Badge></div>
                  <div><span className="text-purple-600">status</span>: &quot;draft&quot; | &quot;published&quot; | &quot;completed&quot; | &quot;cancelled&quot; <Badge variant="destructive" className="text-xs ml-1">Required</Badge></div>
                  <div><span className="text-purple-600">createdAt</span>: string (ISO) <Badge variant="destructive" className="text-xs ml-1">Required</Badge></div>
                  <div><span className="text-purple-600">updatedAt</span>: string (ISO) <Badge variant="destructive" className="text-xs ml-1">Required</Badge></div>
                  <div className="pt-2 border-t mt-2"><span className="text-gray-500">// Optional fields</span></div>
                  <div><span className="text-purple-600">startTime</span>: string (HH:MM)</div>
                  <div><span className="text-purple-600">endTime</span>: string (HH:MM)</div>
                  <div><span className="text-purple-600">venue</span>: string</div>
                  <div><span className="text-purple-600">venueAddress</span>: string</div>
                  <div><span className="text-purple-600">city</span>: string</div>
                  <div><span className="text-purple-600">isVirtual</span>: boolean</div>
                  <div><span className="text-purple-600">virtualMeetingLink</span>: string</div>
                  <div><span className="text-purple-600">speakers</span>: array</div>
                  <div><span className="text-purple-600">description</span>: string</div>
                  <div><span className="text-purple-600">bannerImageUrl</span>: string</div>
                  <div><span className="text-purple-600">registrationUrl</span>: string</div>
                  <div><span className="text-purple-600">entryFee</span>: string</div>
                  <div><span className="text-purple-600">maxCapacity</span>: number</div>
                  <div><span className="text-purple-600">chapterName</span>: string</div>
                  <div><span className="text-purple-600">tags</span>: string[]</div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="organizations">
            <AccordionTrigger className="text-sm font-medium">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Organization IDs
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  Use the organization ID in the <code className="bg-gray-100 px-1 rounded">organization_id</code> field of your webhook payload.
                </p>
                {loadingOrgs ? (
                  <div className="text-sm text-gray-500">Loading organizations...</div>
                ) : organizations.length === 0 ? (
                  <div className="text-sm text-gray-500">No organizations found</div>
                ) : (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Organization Name</TableHead>
                          <TableHead>Organization ID (UUID)</TableHead>
                          <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {organizations.map((org) => (
                          <TableRow key={org.id}>
                            <TableCell className="font-medium">{org.name}</TableCell>
                            <TableCell>
                              <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                                {org.id}
                              </code>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(org.id, `org-${org.id}`)}
                              >
                                {copiedField === `org-${org.id}` ? (
                                  <Check className="h-3 w-3 text-green-600" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Documentation Link */}
        <div className="pt-4 border-t">
          <a
            href="/docs/integration-guide"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
          >
            <FileText className="h-4 w-4" />
            View Full Integration Guide
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </CardContent>
    </Card>
  )
}
