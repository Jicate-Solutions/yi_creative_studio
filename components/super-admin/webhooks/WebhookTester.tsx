'use client'

/**
 * Webhook Tester Component
 * Test webhook integration with sample payloads
 */

import { useState, useEffect } from 'react'
import { Send, Copy, Check, Terminal, AlertCircle, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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

interface TestResult {
  success: boolean
  status: number
  ok: boolean
  duration_ms: number
  response: Record<string, unknown>
  error: string | null
}

const SAMPLE_PAYLOADS = {
  create: {
    id: 'test-event-001',
    name: 'Test Event - Annual Conference 2026',
    date: '2026-03-15',
    startTime: '10:00',
    endTime: '17:00',
    venue: 'Test Convention Center',
    venueAddress: '123 Test Street',
    city: 'Test City',
    status: 'published',
    description: 'This is a test event created via the webhook tester.',
    eventType: 'conference',
    speakers: [
      {
        name: 'John Doe',
        title: 'CEO',
        organization: 'Test Corp',
      },
    ],
    registrationUrl: 'https://example.com/register',
    tags: ['test', 'conference'],
    isVirtual: false,
    maxCapacity: 100,
  },
  update: {
    id: 'test-event-001',
    name: 'Test Event - Updated Title',
    date: '2026-03-16',
    status: 'published',
    description: 'Updated description for test event.',
  },
  delete: {
    id: 'test-event-001',
  },
}

export default function WebhookTester() {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loadingOrgs, setLoadingOrgs] = useState(true)

  const [organizationId, setOrganizationId] = useState('')
  const [sourceAppId, setSourceAppId] = useState('yi-connect')
  const [action, setAction] = useState<'create' | 'update' | 'delete'>('create')
  const [payload, setPayload] = useState(JSON.stringify(SAMPLE_PAYLOADS.create, null, 2))

  const [testing, setTesting] = useState(false)
  const [result, setResult] = useState<TestResult | null>(null)
  const [curlCommand, setCurlCommand] = useState<string | null>(null)
  const [copiedCurl, setCopiedCurl] = useState(false)

  // Fetch organizations
  useEffect(() => {
    async function fetchOrganizations() {
      try {
        const response = await fetch('/api/super-admin/organizations/list?pageSize=100')
        const data = await response.json()
        if (data.success) {
          setOrganizations(data.organizations)
          if (data.organizations.length > 0) {
            setOrganizationId(data.organizations[0].id)
          }
        }
      } catch (error) {
        console.error('Failed to fetch organizations:', error)
      } finally {
        setLoadingOrgs(false)
      }
    }
    fetchOrganizations()
  }, [])

  // Update payload when action changes
  useEffect(() => {
    setPayload(JSON.stringify(SAMPLE_PAYLOADS[action], null, 2))
  }, [action])

  const handleTest = async () => {
    if (!organizationId) {
      toast.error('Please select an organization')
      return
    }

    let parsedPayload: Record<string, unknown>
    try {
      parsedPayload = JSON.parse(payload)
    } catch {
      toast.error('Invalid JSON payload')
      return
    }

    setTesting(true)
    setResult(null)
    setCurlCommand(null)

    try {
      const response = await fetch('/api/super-admin/webhooks/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_id: organizationId,
          source_app_id: sourceAppId,
          action,
          payload: parsedPayload,
        }),
      })

      const data = await response.json()

      if (data.test_result) {
        setResult(data.test_result)
      }

      if (data.curl_command) {
        setCurlCommand(data.curl_command)
      }

      if (data.test_result?.ok) {
        toast.success('Webhook test successful')
      } else {
        toast.error(data.error || 'Webhook test failed')
      }
    } catch (error) {
      console.error('Test error:', error)
      toast.error('Failed to send test webhook')
    } finally {
      setTesting(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedCurl(true)
      toast.success('Copied to clipboard')
      setTimeout(() => setCopiedCurl(false), 2000)
    } catch {
      toast.error('Failed to copy')
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Test Webhook</CardTitle>
          <CardDescription>
            Send a test webhook payload to verify your integration works correctly.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Organization</Label>
              <Select
                value={organizationId}
                onValueChange={setOrganizationId}
                disabled={loadingOrgs}
              >
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

            <div className="space-y-2">
              <Label>Source App ID</Label>
              <Select value={sourceAppId} onValueChange={setSourceAppId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yi-connect">Yi Connect</SelectItem>
                  <SelectItem value="myjkkn">MyJKKN</SelectItem>
                  <SelectItem value="test-app">Test App</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Action</Label>
              <Select
                value={action}
                onValueChange={(v) => setAction(v as 'create' | 'update' | 'delete')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="create">Create</SelectItem>
                  <SelectItem value="update">Update</SelectItem>
                  <SelectItem value="delete">Delete</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Payload Editor */}
          <div className="space-y-2">
            <Label>Payload (JSON)</Label>
            <Textarea
              value={payload}
              onChange={(e) => setPayload(e.target.value)}
              className="font-mono text-sm min-h-[300px]"
              placeholder="Enter JSON payload..."
            />
          </div>

          {/* Send Button */}
          <Button onClick={handleTest} disabled={testing || !organizationId} className="w-full">
            {testing ? (
              <>Sending...</>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Test Webhook
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result.ok ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Test Successful
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-600" />
                  Test Failed
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <label className="font-medium text-gray-500">HTTP Status</label>
                <p
                  className={`font-mono ${result.ok ? 'text-green-600' : 'text-red-600'}`}
                >
                  {result.status}
                </p>
              </div>
              <div>
                <label className="font-medium text-gray-500">Duration</label>
                <p>{result.duration_ms}ms</p>
              </div>
            </div>

            {result.error && (
              <div className="space-y-1">
                <label className="font-medium text-gray-500 text-sm">Error</label>
                <pre className="bg-red-50 text-red-800 p-3 rounded text-xs">
                  {result.error}
                </pre>
              </div>
            )}

            <div className="space-y-1">
              <label className="font-medium text-gray-500 text-sm">Response</label>
              <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto max-h-[200px]">
                {JSON.stringify(result.response, null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}

      {/* cURL Command */}
      {curlCommand && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Terminal className="h-5 w-5" />
              cURL Command
            </CardTitle>
            <CardDescription>
              Use this command to test the webhook from your terminal.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <pre className="bg-gray-900 text-gray-100 p-4 rounded text-xs overflow-x-auto">
                {curlCommand}
              </pre>
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2"
                onClick={() => copyToClipboard(curlCommand)}
              >
                {copiedCurl ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Replace YOUR_WEBHOOK_SECRET with the actual webhook secret from the event source.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
