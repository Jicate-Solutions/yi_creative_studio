'use client'

/**
 * External Event Integration Guide
 * Professional documentation page for webhook integration
 */

import DocsLayout from '@/components/docs/DocsLayout'
import CodeBlock from '@/components/docs/CodeBlock'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
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
import { CheckCircle2, AlertCircle, Info, Zap, ArrowRight } from 'lucide-react'

export default function IntegrationGuidePage() {
  return (
    <DocsLayout
      title="External Event Integration Guide"
      description="Learn how to integrate your event management application with Yi CreativeStudio to enable seamless poster creation from your events."
    >
      {/* Overview Section */}
      <section id="overview" className="scroll-mt-20">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          Overview
          <Badge variant="secondary">For External Apps</Badge>
        </h2>
        <p className="text-slate-600 dark:text-slate-400 mb-6">
          This guide explains how to integrate <strong>any external application</strong> — event management systems,
          calendars, CRMs, custom apps, or any platform with event data — with Yi CreativeStudio. Once integrated,
          your users can create professional posters directly from their events with a single click.
        </p>

        <Alert className="mb-6">
          <Info className="h-4 w-4" />
          <AlertTitle>Schema Version 2.0</AlertTitle>
          <AlertDescription>
            This guide documents the v2.0 schema which includes support for virtual events, capacity tracking,
            chapter info, and guest policies.
          </AlertDescription>
        </Alert>
      </section>

      {/* Architecture Section */}
      <section id="architecture" className="scroll-mt-20 mt-12">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
          Architecture Overview
        </h2>

        <Card className="bg-slate-900 border-slate-700 mb-6">
          <CardContent className="p-6">
            <pre className="text-sm text-slate-300 font-mono whitespace-pre overflow-x-auto">
{`┌──────────────────────┐         ┌──────────────────────┐
│   Your Application   │         │   Yi CreativeStudio  │
│  (Calendar, CRM, etc)│         │                      │
├──────────────────────┤         ├──────────────────────┤
│                      │  POST   │                      │
│  Event Created ──────┼────────►│  /api/webhooks/events│
│  Event Updated ──────┼────────►│                      │
│  Event Deleted ──────┼────────►│  Stores in           │
│                      │         │  synced_events table │
│                      │         │                      │
│  "Create Poster" ────┼────────►│  /create?eventId=xxx │
│  button click        │         │  (Deep Link)         │
└──────────────────────┘         └──────────────────────┘`}
            </pre>
          </CardContent>
        </Card>
      </section>

      {/* Endpoint Section */}
      <section id="endpoint" className="scroll-mt-20 mt-12">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
          Step 1: Webhook Integration
        </h2>

        <h3 id="headers" className="text-xl font-medium text-slate-800 dark:text-slate-200 mt-6 mb-3">
          Endpoint
        </h3>
        <CodeBlock
          code="POST https://yi-studio.yichapter.org/api/webhooks/events"
          language="bash"
          title="Webhook URL"
        />

        <h3 className="text-xl font-medium text-slate-800 dark:text-slate-200 mt-8 mb-3">
          Required Headers
        </h3>
        <div className="border rounded-lg overflow-hidden mb-6">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 dark:bg-slate-800">
                <TableHead>Header</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-mono text-sm">Content-Type</TableCell>
                <TableCell><code className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">application/json</code></TableCell>
                <TableCell><Badge variant="destructive" className="text-xs">Required</Badge></TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-sm">X-Source-App-Id</TableCell>
                <TableCell><code className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">your-app-id</code> <span className="text-slate-500">(e.g., google-calendar, my-crm)</span></TableCell>
                <TableCell><Badge variant="destructive" className="text-xs">Required</Badge> Unique identifier for your app</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-sm">X-Webhook-Secret</TableCell>
                <TableCell><code className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">your-shared-secret</code></TableCell>
                <TableCell><Badge variant="secondary" className="text-xs">Recommended</Badge></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </section>

      {/* Request Body Section */}
      <section id="request-body" className="scroll-mt-20 mt-12">
        <h3 id="authentication" className="text-xl font-medium text-slate-800 dark:text-slate-200 mb-3">
          Request Body
        </h3>
        <CodeBlock
          code={`interface WebhookPayload {
  action: 'create' | 'update' | 'delete'
  event: ExternalEvent
  organization_id: string  // Yi Studio organization UUID
}`}
          language="typescript"
          title="WebhookPayload"
        />
      </section>

      {/* Event Schema Section */}
      <section id="required-fields" className="scroll-mt-20 mt-12">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
          ExternalEvent Schema
        </h2>

        <Alert className="mb-6 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
          <Zap className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-800 dark:text-blue-200">Version 2.0</AlertTitle>
          <AlertDescription className="text-blue-700 dark:text-blue-300">
            Includes support for virtual events, capacity tracking, chapter info, and guest policies.
          </AlertDescription>
        </Alert>

        <h3 className="text-xl font-medium text-slate-800 dark:text-slate-200 mt-6 mb-3">
          Required Fields
        </h3>
        <div className="border rounded-lg overflow-hidden mb-6">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 dark:bg-slate-800">
                <TableHead>Field</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-mono text-sm">id</TableCell>
                <TableCell><Badge variant="outline">string</Badge></TableCell>
                <TableCell>Your app&apos;s unique event identifier</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-sm">name</TableCell>
                <TableCell><Badge variant="outline">string</Badge></TableCell>
                <TableCell>Event title</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-sm">date</TableCell>
                <TableCell><Badge variant="outline">string</Badge></TableCell>
                <TableCell>ISO date format: &quot;2026-02-15&quot;</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-sm">status</TableCell>
                <TableCell><Badge variant="outline">enum</Badge></TableCell>
                <TableCell>&apos;draft&apos; | &apos;published&apos; | &apos;completed&apos; | &apos;cancelled&apos;</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-sm">createdAt</TableCell>
                <TableCell><Badge variant="outline">string</Badge></TableCell>
                <TableCell>ISO timestamp</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-sm">updatedAt</TableCell>
                <TableCell><Badge variant="outline">string</Badge></TableCell>
                <TableCell>ISO timestamp</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        <h3 id="optional-fields" className="text-xl font-medium text-slate-800 dark:text-slate-200 mt-8 mb-3 scroll-mt-20">
          Optional Fields
        </h3>

        <Accordion type="multiple" className="w-full">
          <AccordionItem value="time">
            <AccordionTrigger>Time Fields</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 text-sm font-mono">
                <div><span className="text-purple-600">startTime</span>: string (24h format: &quot;10:00&quot;)</div>
                <div><span className="text-purple-600">endTime</span>: string (24h format: &quot;17:00&quot;)</div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="location">
            <AccordionTrigger>Location Fields</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 text-sm font-mono">
                <div><span className="text-purple-600">venue</span>: string</div>
                <div><span className="text-purple-600">venueAddress</span>: string</div>
                <div><span className="text-purple-600">city</span>: string</div>
                <div><span className="text-purple-600">venueLatitude</span>: number <Badge className="ml-2 text-xs">v2.0</Badge></div>
                <div><span className="text-purple-600">venueLongitude</span>: number <Badge className="ml-2 text-xs">v2.0</Badge></div>
                <div><span className="text-purple-600">venueCapacity</span>: number <Badge className="ml-2 text-xs">v2.0</Badge></div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="virtual">
            <AccordionTrigger>Virtual Event Fields <Badge className="ml-2 text-xs">v2.0</Badge></AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 text-sm font-mono">
                <div><span className="text-purple-600">isVirtual</span>: boolean</div>
                <div><span className="text-purple-600">virtualMeetingLink</span>: string</div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="people">
            <AccordionTrigger>People Fields</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 text-sm font-mono">
                <div><span className="text-purple-600">speakers</span>: ExternalEventSpeaker[]</div>
                <div><span className="text-purple-600">organizerName</span>: string</div>
                <div><span className="text-purple-600">organizationId</span>: string</div>
                <div><span className="text-purple-600">organizationName</span>: string</div>
                <div><span className="text-purple-600">chapterName</span>: string <Badge className="ml-2 text-xs">v2.0</Badge></div>
                <div><span className="text-purple-600">chapterLocation</span>: string <Badge className="ml-2 text-xs">v2.0</Badge></div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="content">
            <AccordionTrigger>Content Fields</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 text-sm font-mono">
                <div><span className="text-purple-600">description</span>: string</div>
                <div><span className="text-purple-600">tagline</span>: string</div>
                <div><span className="text-purple-600">eventType</span>: string</div>
                <div><span className="text-purple-600">tags</span>: string[] <Badge className="ml-2 text-xs">v2.0</Badge></div>
                <div><span className="text-purple-600">isFeatured</span>: boolean <Badge className="ml-2 text-xs">v2.0</Badge></div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="registration">
            <AccordionTrigger>Registration Fields</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 text-sm font-mono">
                <div><span className="text-purple-600">registrationUrl</span>: string</div>
                <div><span className="text-purple-600">entryFee</span>: string</div>
                <div><span className="text-purple-600">registrationDeadline</span>: string</div>
                <div><span className="text-purple-600">registrationStartDate</span>: string <Badge className="ml-2 text-xs">v2.0</Badge></div>
                <div><span className="text-purple-600">maxCapacity</span>: number <Badge className="ml-2 text-xs">v2.0</Badge></div>
                <div><span className="text-purple-600">currentRegistrations</span>: number <Badge className="ml-2 text-xs">v2.0</Badge></div>
                <div><span className="text-purple-600">waitlistEnabled</span>: boolean <Badge className="ml-2 text-xs">v2.0</Badge></div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="guests">
            <AccordionTrigger>Guest Policy Fields <Badge className="ml-2 text-xs">v2.0</Badge></AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 text-sm font-mono">
                <div><span className="text-purple-600">allowGuests</span>: boolean</div>
                <div><span className="text-purple-600">guestLimit</span>: number</div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="media">
            <AccordionTrigger>Media Fields</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 text-sm font-mono">
                <div><span className="text-purple-600">bannerImageUrl</span>: string</div>
                <div><span className="text-purple-600">targetAudience</span>: string</div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>

      {/* Speaker Schema Section */}
      <section id="speaker-schema" className="scroll-mt-20 mt-12">
        <h3 className="text-xl font-medium text-slate-800 dark:text-slate-200 mb-3">
          Speaker Schema
        </h3>
        <CodeBlock
          code={`interface ExternalEventSpeaker {
  id: string
  name: string
  designation?: string    // "CEO", "CTO", etc.
  organization?: string   // "TechCorp"
  photoUrl?: string       // URL to speaker photo
  bio?: string
}`}
          language="typescript"
          title="ExternalEventSpeaker"
        />
      </section>

      {/* Code Examples Section */}
      <section id="curl-example" className="scroll-mt-20 mt-12">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
          Code Examples
        </h2>

        <h3 className="text-xl font-medium text-slate-800 dark:text-slate-200 mb-3">
          cURL Example (Basic)
        </h3>
        <CodeBlock
          code={`curl -X POST 'https://yi-studio.yichapter.org/api/webhooks/events' \\
  -H 'Content-Type: application/json' \\
  -H 'X-Source-App-Id: your-app-id' \\
  -H 'X-Webhook-Secret: your-secret' \\
  -d '{
    "action": "create",
    "organization_id": "your-yi-studio-org-uuid",
    "event": {
      "id": "test-event-001",
      "name": "Test Conference 2026",
      "date": "2026-03-15",
      "startTime": "10:00",
      "endTime": "17:00",
      "venue": "Convention Center",
      "status": "published",
      "createdAt": "2026-01-28T10:00:00Z",
      "updatedAt": "2026-01-28T10:00:00Z"
    }
  }'`}
          language="bash"
          title="Basic Webhook Request"
        />

        <h3 id="javascript-example" className="text-xl font-medium text-slate-800 dark:text-slate-200 mt-8 mb-3 scroll-mt-20">
          JavaScript/TypeScript Example
        </h3>
        <CodeBlock
          code={`// lib/webhooks/yi-studio-sync.ts

const YI_STUDIO_WEBHOOK_URL = process.env.YI_STUDIO_WEBHOOK_URL
const WEBHOOK_SECRET = process.env.YI_STUDIO_WEBHOOK_SECRET
const YI_STUDIO_ORG_ID = process.env.YI_STUDIO_ORG_ID

export async function syncEventToYiStudio(
  action: 'create' | 'update' | 'delete',
  event: YourEventType
): Promise<{ success: boolean; error?: string }> {
  if (!YI_STUDIO_WEBHOOK_URL) {
    console.warn('[Yi Studio] Webhook URL not configured')
    return { success: false, error: 'Webhook URL not configured' }
  }

  try {
    const response = await fetch(YI_STUDIO_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Source-App-Id': 'your-app-id', // Replace with your app identifier
        'X-Webhook-Secret': WEBHOOK_SECRET || '',
      },
      body: JSON.stringify({
        action,
        organization_id: YI_STUDIO_ORG_ID,
        event: transformToExternalEvent(event),
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('[Yi Studio] Sync failed:', data.error)
      return { success: false, error: data.error }
    }

    return { success: true }
  } catch (error) {
    console.error('[Yi Studio] Sync error:', error)
    return { success: false, error: 'Network error' }
  }
}`}
          language="typescript"
          title="Webhook Sync Service"
          showLineNumbers
        />

        <h3 id="python-example" className="text-xl font-medium text-slate-800 dark:text-slate-200 mt-8 mb-3 scroll-mt-20">
          Python Example
        </h3>
        <CodeBlock
          code={`import os
import requests
from typing import Literal

YI_STUDIO_WEBHOOK_URL = os.environ.get('YI_STUDIO_WEBHOOK_URL')
WEBHOOK_SECRET = os.environ.get('YI_STUDIO_WEBHOOK_SECRET')
YI_STUDIO_ORG_ID = os.environ.get('YI_STUDIO_ORG_ID')

def sync_event_to_yi_studio(
    action: Literal['create', 'update', 'delete'],
    event: dict
) -> dict:
    """Sync an event to Yi CreativeStudio"""

    if not YI_STUDIO_WEBHOOK_URL:
        return {'success': False, 'error': 'Webhook URL not configured'}

    try:
        response = requests.post(
            YI_STUDIO_WEBHOOK_URL,
            headers={
                'Content-Type': 'application/json',
                'X-Source-App-Id': 'your-app-id',  # Replace with your app identifier
                'X-Webhook-Secret': WEBHOOK_SECRET or '',
            },
            json={
                'action': action,
                'organization_id': YI_STUDIO_ORG_ID,
                'event': event,
            }
        )

        data = response.json()

        if not response.ok:
            return {'success': False, 'error': data.get('error')}

        return {'success': True, 'data': data}

    except Exception as e:
        return {'success': False, 'error': str(e)}`}
          language="python"
          title="Python Webhook Client"
        />
      </section>

      {/* Deep Linking Section */}
      <section id="deep-linking" className="scroll-mt-20 mt-12">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
          Step 2: Add &quot;Create Poster&quot; Button
        </h2>

        <p className="text-slate-600 dark:text-slate-400 mb-4">
          Add a button in your event detail page that links to Yi Studio with the event pre-filled:
        </p>

        <CodeBlock
          code={`// Deep Link Format
https://yi-studio.yichapter.org/dashboard/create?eventId={your-event-id}&source={your-app-id}

// Example (replace 'your-app-id' with your registered app identifier)
https://yi-studio.yichapter.org/dashboard/create?eventId=evt-123&source=your-app-id`}
          language="bash"
          title="Deep Link URL"
        />

        <div className="border rounded-lg overflow-hidden mt-6 mb-6">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 dark:bg-slate-800">
                <TableHead>Parameter</TableHead>
                <TableHead>Required</TableHead>
                <TableHead>Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-mono text-sm">eventId</TableCell>
                <TableCell><Badge variant="destructive" className="text-xs">Yes</Badge></TableCell>
                <TableCell>Your application&apos;s event ID</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-sm">source</TableCell>
                <TableCell><Badge variant="destructive" className="text-xs">Yes</Badge></TableCell>
                <TableCell>Your registered app identifier (from Event Sources)</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        <CodeBlock
          code={`// components/CreatePosterButton.tsx

interface CreatePosterButtonProps {
  eventId: string
  eventName: string
}

export function CreatePosterButton({ eventId, eventName }: CreatePosterButtonProps) {
  const yiStudioUrl = process.env.NEXT_PUBLIC_YI_STUDIO_URL || 'https://yi-studio.yichapter.org'
  const sourceAppId = 'your-app-id' // Replace with your registered app identifier

  const posterUrl = \`\${yiStudioUrl}/dashboard/create?eventId=\${eventId}&source=\${sourceAppId}\`

  return (
    <a
      href={posterUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
    >
      <ImageIcon className="w-4 h-4" />
      Create Poster
    </a>
  )
}`}
          language="tsx"
          title="React Component"
        />
      </section>

      {/* Error Codes Section */}
      <section id="error-codes" className="scroll-mt-20 mt-12">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
          Troubleshooting
        </h2>

        <h3 className="text-xl font-medium text-slate-800 dark:text-slate-200 mb-3">
          Error Responses
        </h3>
        <div className="border rounded-lg overflow-hidden mb-6">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 dark:bg-slate-800">
                <TableHead>Status</TableHead>
                <TableHead>Error</TableHead>
                <TableHead>Resolution</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell><Badge variant="outline">400</Badge></TableCell>
                <TableCell className="font-mono text-sm">Missing X-Source-App-Id header</TableCell>
                <TableCell>Add the required header</TableCell>
              </TableRow>
              <TableRow>
                <TableCell><Badge variant="outline">400</Badge></TableCell>
                <TableCell className="font-mono text-sm">Invalid action</TableCell>
                <TableCell>Use: create, update, or delete</TableCell>
              </TableRow>
              <TableRow>
                <TableCell><Badge variant="outline">400</Badge></TableCell>
                <TableCell className="font-mono text-sm">Invalid event data</TableCell>
                <TableCell>Check required fields</TableCell>
              </TableRow>
              <TableRow>
                <TableCell><Badge variant="outline">401</Badge></TableCell>
                <TableCell className="font-mono text-sm">Invalid webhook secret</TableCell>
                <TableCell>Verify your secret key</TableCell>
              </TableRow>
              <TableRow>
                <TableCell><Badge variant="outline">403</Badge></TableCell>
                <TableCell className="font-mono text-sm">Event source is disabled</TableCell>
                <TableCell>Contact Yi Studio admin</TableCell>
              </TableRow>
              <TableRow>
                <TableCell><Badge variant="outline">500</Badge></TableCell>
                <TableCell className="font-mono text-sm">Failed to sync event</TableCell>
                <TableCell>Retry later</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </section>

      {/* Common Issues Section */}
      <section id="common-issues" className="scroll-mt-20 mt-8">
        <h3 className="text-xl font-medium text-slate-800 dark:text-slate-200 mb-4">
          Common Issues
        </h3>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-500" />
                Event not syncing
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-600 dark:text-slate-400">
              Ensure the <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">organization_id</code> matches your Yi Studio organization UUID.
              You can find this in the Event Sources table.
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-500" />
                Date format errors
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-600 dark:text-slate-400">
              Use ISO date format (<code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">YYYY-MM-DD</code>) for the date field
              and 24-hour format (<code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">HH:MM</code>) for time fields.
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-500" />
                Poster not pre-filling
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-600 dark:text-slate-400">
              Make sure the event was synced via webhook <strong>before</strong> clicking the &quot;Create Poster&quot; button.
              The deep link only works for events that exist in Yi Studio.
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Checklist Section */}
      <section className="scroll-mt-20 mt-12">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
          Integration Checklist
        </h2>

        <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
          <CardContent className="pt-6">
            <ul className="space-y-3">
              {[
                'Set environment variables (YI_STUDIO_WEBHOOK_URL, YI_STUDIO_WEBHOOK_SECRET, YI_STUDIO_ORG_ID)',
                'Create webhook sync service',
                'Call syncEventToYiStudio("create", event) when creating events',
                'Call syncEventToYiStudio("update", event) when updating events',
                'Call syncEventToYiStudio("delete", { id }) when deleting events',
                'Add "Create Poster" button with deep link to event detail page',
                'Test the integration with a sample event',
              ].map((item, index) => (
                <li key={index} className="flex items-start gap-3 text-sm">
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-700 dark:text-slate-300">{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>

      {/* Support Section */}
      <section className="scroll-mt-20 mt-12 pb-8">
        <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
                <Info className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-1">Need Help?</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  For integration support or questions, contact the Yi CreativeStudio team or use the
                  <a href="/super-admin/webhooks/test" className="text-blue-600 hover:underline ml-1">Webhook Tester</a>
                  to debug your integration.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </DocsLayout>
  )
}
