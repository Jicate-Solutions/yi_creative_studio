# Dynamic Integration System - Architecture Plan

> **Version:** 1.0.0
> **Date:** 2026-02-02
> **Purpose:** Scalable, plugin-based integration system for Yi CreativeStudio

---

## Executive Summary

This plan defines a **dynamic integration registry system** that allows Yi CreativeStudio to support multiple external integrations (Google Calendar, Outlook, Eventbrite, Zapier, Slack, etc.) using a standardized, reusable architecture.

### Key Principles
- **Plugin-based architecture** - Each integration is self-contained
- **Registry pattern** - Central registry of available integrations
- **Dynamic UI rendering** - UI adapts based on integration config
- **Standardized OAuth flow** - Reusable authentication patterns
- **Type-safe configuration** - TypeScript interfaces for all integrations
- **Database-driven** - Integration configs stored in Supabase

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    INTEGRATION REGISTRY                      │
│  (Central config with metadata for all integrations)        │
└─────────────────────────────────────────────────────────────┘
                             │
                ┌────────────┼────────────┐
                │            │            │
        ┌───────▼──────┐ ┌──▼──────┐ ┌──▼──────┐
        │   Google     │ │ Outlook │ │ Zapier  │
        │   Calendar   │ │ Calendar│ │ Webhooks│
        │              │ │         │ │         │
        │ - OAuth      │ │ - OAuth │ │ - API   │
        │ - Sync       │ │ - Sync  │ │ - Push  │
        │ - Webhooks   │ │ - Graph │ │ - Events│
        └──────────────┘ └─────────┘ └─────────┘
```

---

## 1. Database Schema

### 1.1 Integration Registry Table

Stores available integration types (seeded data).

```sql
CREATE TABLE public.integration_registry (
  id TEXT PRIMARY KEY,  -- 'google-calendar', 'outlook-calendar', 'eventbrite'

  -- Display info
  name TEXT NOT NULL,  -- "Google Calendar"
  description TEXT,
  category TEXT NOT NULL,  -- 'calendar', 'event-platform', 'notification', 'webhook'

  -- Branding
  icon_name TEXT,  -- Lucide icon name
  icon_url TEXT,   -- Custom icon URL
  brand_color TEXT,  -- HEX color

  -- Features
  features JSONB,  -- { sync_events: true, push_notifications: true, bidirectional: false }
  capabilities JSONB,  -- { oauth: true, api_key: false, webhook: true }

  -- Configuration schema (JSON Schema)
  config_schema JSONB,  -- Defines required fields for this integration

  -- OAuth config (if applicable)
  oauth_provider TEXT,  -- 'google', 'microsoft', null
  oauth_scopes TEXT[],

  -- Status
  is_available BOOLEAN DEFAULT true,
  requires_approval BOOLEAN DEFAULT false,  -- For enterprise integrations

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed data
INSERT INTO integration_registry (id, name, description, category, icon_name, brand_color, features, capabilities, oauth_provider, oauth_scopes) VALUES
(
  'google-calendar',
  'Google Calendar',
  'Sync events from Google Calendar to auto-fill event posters',
  'calendar',
  'Calendar',
  '#4285F4',
  '{"sync_events": true, "push_notifications": true, "bidirectional": false}'::jsonb,
  '{"oauth": true, "api_key": false, "webhook": true}'::jsonb,
  'google',
  ARRAY['https://www.googleapis.com/auth/calendar.readonly']
),
(
  'outlook-calendar',
  'Microsoft Outlook',
  'Sync events from Outlook Calendar',
  'calendar',
  'Calendar',
  '#0078D4',
  '{"sync_events": true, "push_notifications": true, "bidirectional": false}'::jsonb,
  '{"oauth": true, "api_key": false, "webhook": true}'::jsonb,
  'microsoft',
  ARRAY['Calendars.Read']
),
(
  'eventbrite',
  'Eventbrite',
  'Import events from Eventbrite for poster creation',
  'event-platform',
  'Ticket',
  '#F05537',
  '{"sync_events": true, "push_notifications": false, "bidirectional": false}'::jsonb,
  '{"oauth": true, "api_key": true, "webhook": true}'::jsonb,
  'eventbrite',
  ARRAY['event_read']
);
```

### 1.2 Organization Integration Connections Table

Stores active integrations per organization.

```sql
CREATE TABLE public.integration_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  integration_id TEXT NOT NULL REFERENCES integration_registry(id),

  -- Connection metadata
  display_name TEXT,  -- User-given name: "Marketing Calendar"
  connected_by UUID REFERENCES auth.users(id),
  connected_at TIMESTAMPTZ DEFAULT NOW(),

  -- OAuth tokens (encrypted)
  access_token_encrypted BYTEA,
  refresh_token_encrypted BYTEA,
  token_expiry TIMESTAMPTZ,

  -- API key (encrypted, if used instead of OAuth)
  api_key_encrypted BYTEA,

  -- Integration-specific config (JSON)
  config JSONB,  -- { calendar_id: 'primary', sync_past_days: 30, ... }

  -- Account info
  external_account_id TEXT,  -- Email or ID from provider
  external_account_name TEXT,

  -- Sync status
  sync_status TEXT DEFAULT 'pending' CHECK (sync_status IN ('pending', 'active', 'syncing', 'error', 'paused', 'disconnected')),
  last_sync_at TIMESTAMPTZ,
  next_sync_at TIMESTAMPTZ,
  sync_error TEXT,

  -- Webhook config
  webhook_channel_id TEXT,
  webhook_resource_id TEXT,
  webhook_expiry TIMESTAMPTZ,
  webhook_secret TEXT,

  -- Stats
  total_events_synced INTEGER DEFAULT 0,
  total_syncs INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,

  -- Settings
  is_active BOOLEAN DEFAULT true,
  auto_sync BOOLEAN DEFAULT true,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- One connection per integration type per organization
  UNIQUE(organization_id, integration_id)
);

CREATE INDEX idx_integration_connections_org ON integration_connections(organization_id);
CREATE INDEX idx_integration_connections_integration ON integration_connections(integration_id);
CREATE INDEX idx_integration_connections_status ON integration_connections(sync_status);
```

### 1.3 Integration Logs Table

Audit trail for all integration events.

```sql
CREATE TABLE public.integration_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID REFERENCES integration_connections(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  integration_id TEXT REFERENCES integration_registry(id),

  -- Event type
  event_type TEXT NOT NULL CHECK (event_type IN (
    'connection_created',
    'connection_disconnected',
    'oauth_authorized',
    'token_refreshed',
    'sync_started',
    'sync_completed',
    'sync_failed',
    'webhook_received',
    'webhook_verified',
    'api_call_failed'
  )),

  -- Details
  event_data JSONB,  -- Flexible event-specific data

  -- Status
  success BOOLEAN DEFAULT true,
  error_message TEXT,

  -- Performance
  duration_ms INTEGER,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_integration_logs_connection ON integration_logs(connection_id);
CREATE INDEX idx_integration_logs_org ON integration_logs(organization_id);
CREATE INDEX idx_integration_logs_type ON integration_logs(event_type);
CREATE INDEX idx_integration_logs_created ON integration_logs(created_at DESC);
```

---

## 2. Type System

### 2.1 Core Integration Types

```typescript
// types/integration.types.ts

export type IntegrationCategory = 'calendar' | 'event-platform' | 'notification' | 'webhook' | 'crm'

export type IntegrationAuthType = 'oauth' | 'api-key' | 'webhook' | 'none'

export type IntegrationSyncStatus = 'pending' | 'active' | 'syncing' | 'error' | 'paused' | 'disconnected'

export interface IntegrationFeatures {
  sync_events: boolean
  push_notifications: boolean
  bidirectional: boolean
  batch_sync: boolean
  real_time: boolean
}

export interface IntegrationCapabilities {
  oauth: boolean
  api_key: boolean
  webhook: boolean
  polling: boolean
}

// Registry entry (from database)
export interface IntegrationDefinition {
  id: string  // 'google-calendar'
  name: string  // 'Google Calendar'
  description: string
  category: IntegrationCategory
  icon_name?: string
  icon_url?: string
  brand_color?: string
  features: IntegrationFeatures
  capabilities: IntegrationCapabilities
  config_schema?: object  // JSON Schema
  oauth_provider?: 'google' | 'microsoft' | 'eventbrite' | string
  oauth_scopes?: string[]
  is_available: boolean
  requires_approval: boolean
}

// Active connection (from database)
export interface IntegrationConnection {
  id: string
  organization_id: string
  integration_id: string
  display_name?: string
  connected_by?: string
  connected_at: string

  // Encrypted tokens (not exposed to frontend)
  access_token_encrypted?: ArrayBuffer
  refresh_token_encrypted?: ArrayBuffer
  token_expiry?: string
  api_key_encrypted?: ArrayBuffer

  // Config
  config: Record<string, any>

  // Account
  external_account_id?: string
  external_account_name?: string

  // Status
  sync_status: IntegrationSyncStatus
  last_sync_at?: string
  next_sync_at?: string
  sync_error?: string

  // Webhook
  webhook_channel_id?: string
  webhook_resource_id?: string
  webhook_expiry?: string
  webhook_secret?: string

  // Stats
  total_events_synced: number
  total_syncs: number
  error_count: number

  // Settings
  is_active: boolean
  auto_sync: boolean

  created_at: string
  updated_at: string
}

// Integration card data (for UI)
export interface IntegrationCardData {
  definition: IntegrationDefinition
  connection?: IntegrationConnection
  isConnected: boolean
  isConfigured: boolean
  canConnect: boolean  // Based on permissions
}
```

### 2.2 Integration-Specific Configs

```typescript
// types/integration-configs.ts

export interface GoogleCalendarConfig {
  calendar_id: string  // 'primary' or specific calendar
  sync_past_days: number
  sync_future_days: number
}

export interface OutlookCalendarConfig {
  calendar_id: string
  sync_past_days: number
  sync_future_days: number
}

export interface EventbriteConfig {
  organization_id: string  // Eventbrite org ID
  sync_published_only: boolean
  sync_past_events: boolean
}

export interface ZapierWebhookConfig {
  webhook_url: string  // Generated by Yi Studio
  allowed_event_types: string[]
}

// Union type for all configs
export type IntegrationConfig =
  | GoogleCalendarConfig
  | OutlookCalendarConfig
  | EventbriteConfig
  | ZapierWebhookConfig
```

---

## 3. Service Layer Architecture

### 3.1 Integration Registry Service

```typescript
// lib/services/integrations/registry.ts

import { createClient } from '@/lib/supabase/server'
import type { IntegrationDefinition, IntegrationCardData } from '@/types/integration.types'

export class IntegrationRegistry {
  /**
   * Get all available integrations
   */
  static async getAvailableIntegrations(category?: string): Promise<IntegrationDefinition[]> {
    const supabase = await createClient()

    let query = supabase
      .from('integration_registry')
      .select('*')
      .eq('is_available', true)

    if (category) {
      query = query.eq('category', category)
    }

    const { data, error } = await query.order('name')

    if (error) throw error
    return data || []
  }

  /**
   * Get integration definition by ID
   */
  static async getIntegrationById(id: string): Promise<IntegrationDefinition | null> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('integration_registry')
      .select('*')
      .eq('id', id)
      .single()

    if (error) return null
    return data
  }

  /**
   * Get integrations with connection status for an organization
   */
  static async getIntegrationsWithStatus(
    organizationId: string
  ): Promise<IntegrationCardData[]> {
    const supabase = await createClient()

    // Get all available integrations
    const integrations = await this.getAvailableIntegrations()

    // Get existing connections
    const { data: connections } = await supabase
      .from('integration_connections')
      .select('*')
      .eq('organization_id', organizationId)

    // Map to card data
    return integrations.map(integration => {
      const connection = connections?.find(c => c.integration_id === integration.id)

      return {
        definition: integration,
        connection,
        isConnected: !!connection && connection.sync_status !== 'disconnected',
        isConfigured: !!connection,
        canConnect: true  // TODO: Check user permissions
      }
    })
  }
}
```

### 3.2 Integration Connection Manager

```typescript
// lib/services/integrations/connection-manager.ts

export class IntegrationConnectionManager {
  /**
   * Create a new integration connection
   */
  static async createConnection(
    organizationId: string,
    integrationId: string,
    config: Record<string, any>,
    userId: string
  ): Promise<IntegrationConnection> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('integration_connections')
      .insert({
        organization_id: organizationId,
        integration_id: integrationId,
        config,
        connected_by: userId,
        sync_status: 'pending'
      })
      .select()
      .single()

    if (error) throw error

    // Log event
    await this.logEvent(data.id, organizationId, integrationId, 'connection_created', true)

    return data
  }

  /**
   * Update connection config
   */
  static async updateConnection(
    connectionId: string,
    updates: Partial<IntegrationConnection>
  ): Promise<void> {
    const supabase = await createClient()

    const { error } = await supabase
      .from('integration_connections')
      .update(updates)
      .eq('id', connectionId)

    if (error) throw error
  }

  /**
   * Disconnect integration
   */
  static async disconnect(connectionId: string): Promise<void> {
    const supabase = await createClient()

    // Update status instead of deleting (preserve history)
    const { error } = await supabase
      .from('integration_connections')
      .update({
        sync_status: 'disconnected',
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', connectionId)

    if (error) throw error

    // Log event
    const { data: connection } = await supabase
      .from('integration_connections')
      .select('organization_id, integration_id')
      .eq('id', connectionId)
      .single()

    if (connection) {
      await this.logEvent(
        connectionId,
        connection.organization_id,
        connection.integration_id,
        'connection_disconnected',
        true
      )
    }
  }

  /**
   * Log integration event
   */
  private static async logEvent(
    connectionId: string,
    organizationId: string,
    integrationId: string,
    eventType: string,
    success: boolean,
    eventData?: Record<string, any>,
    errorMessage?: string
  ): Promise<void> {
    const supabase = await createClient()

    await supabase.from('integration_logs').insert({
      connection_id: connectionId,
      organization_id: organizationId,
      integration_id: integrationId,
      event_type: eventType,
      success,
      event_data: eventData || null,
      error_message: errorMessage
    })
  }
}
```

### 3.3 Integration Provider Interface

Abstract base class that all integrations must implement.

```typescript
// lib/services/integrations/base-provider.ts

export abstract class IntegrationProvider {
  protected connectionId: string
  protected config: Record<string, any>

  constructor(connectionId: string, config: Record<string, any>) {
    this.connectionId = connectionId
    this.config = config
  }

  /**
   * Initialize OAuth flow
   */
  abstract getAuthUrl(): Promise<string>

  /**
   * Handle OAuth callback
   */
  abstract handleCallback(code: string): Promise<void>

  /**
   * Refresh access token
   */
  abstract refreshToken(): Promise<void>

  /**
   * Sync events from provider
   */
  abstract syncEvents(): Promise<{ added: number; updated: number; deleted: number }>

  /**
   * Test connection
   */
  abstract testConnection(): Promise<boolean>

  /**
   * Disconnect and cleanup
   */
  abstract disconnect(): Promise<void>
}
```

### 3.4 Google Calendar Provider (Example Implementation)

```typescript
// lib/services/integrations/providers/google-calendar-provider.ts

import { IntegrationProvider } from '../base-provider'
import type { GoogleCalendarConfig } from '@/types/integration-configs'

export class GoogleCalendarProvider extends IntegrationProvider {
  private config: GoogleCalendarConfig

  constructor(connectionId: string, config: GoogleCalendarConfig) {
    super(connectionId, config)
    this.config = config
  }

  async getAuthUrl(): Promise<string> {
    // Generate Google OAuth URL
    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/google-calendar/callback`,
      response_type: 'code',
      scope: 'https://www.googleapis.com/auth/calendar.readonly',
      access_type: 'offline',
      prompt: 'consent',
      state: this.connectionId  // Pass connection ID for callback
    })

    return `https://accounts.google.com/o/oauth2/v2/auth?${params}`
  }

  async handleCallback(code: string): Promise<void> {
    // Exchange code for tokens
    // Store encrypted tokens in database
    // Initialize push notifications
  }

  async refreshToken(): Promise<void> {
    // Refresh access token using refresh token
  }

  async syncEvents(): Promise<{ added: number; updated: number; deleted: number }> {
    // Fetch events from Google Calendar
    // Map to synced_events table
    // Return stats
    return { added: 0, updated: 0, deleted: 0 }
  }

  async testConnection(): Promise<boolean> {
    // Make a test API call
    return true
  }

  async disconnect(): Promise<void> {
    // Stop push notifications
    // Revoke tokens
  }
}
```

### 3.5 Integration Factory

```typescript
// lib/services/integrations/factory.ts

import { GoogleCalendarProvider } from './providers/google-calendar-provider'
import { OutlookCalendarProvider } from './providers/outlook-calendar-provider'
import { EventbriteProvider } from './providers/eventbrite-provider'
import type { IntegrationProvider } from './base-provider'

export class IntegrationFactory {
  static createProvider(
    integrationId: string,
    connectionId: string,
    config: Record<string, any>
  ): IntegrationProvider {
    switch (integrationId) {
      case 'google-calendar':
        return new GoogleCalendarProvider(connectionId, config)

      case 'outlook-calendar':
        return new OutlookCalendarProvider(connectionId, config)

      case 'eventbrite':
        return new EventbriteProvider(connectionId, config)

      default:
        throw new Error(`Unknown integration: ${integrationId}`)
    }
  }
}
```

---

## 4. API Routes

### 4.1 Get Available Integrations

```typescript
// app/api/integrations/route.ts

import { NextResponse } from 'next/server'
import { IntegrationRegistry } from '@/lib/services/integrations/registry'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') || undefined
    const organizationId = searchParams.get('organizationId')

    if (organizationId) {
      // Get integrations with connection status
      const integrations = await IntegrationRegistry.getIntegrationsWithStatus(organizationId)
      return NextResponse.json({ success: true, integrations })
    } else {
      // Get all available integrations
      const integrations = await IntegrationRegistry.getAvailableIntegrations(category)
      return NextResponse.json({ success: true, integrations })
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
```

### 4.2 Connect Integration

```typescript
// app/api/integrations/[integrationId]/connect/route.ts

import { NextResponse } from 'next/server'
import { IntegrationConnectionManager } from '@/lib/services/integrations/connection-manager'
import { IntegrationFactory } from '@/lib/services/integrations/factory'

export async function POST(
  request: Request,
  { params }: { params: { integrationId: string } }
) {
  try {
    const { organizationId, config, userId } = await request.json()

    // Create connection record
    const connection = await IntegrationConnectionManager.createConnection(
      organizationId,
      params.integrationId,
      config,
      userId
    )

    // Create provider instance
    const provider = IntegrationFactory.createProvider(
      params.integrationId,
      connection.id,
      config
    )

    // Get OAuth URL
    const authUrl = await provider.getAuthUrl()

    return NextResponse.json({
      success: true,
      connection,
      authUrl  // Redirect user to this URL
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
```

### 4.3 OAuth Callback Handler

```typescript
// app/api/integrations/[integrationId]/callback/route.ts

import { NextResponse } from 'next/server'
import { IntegrationFactory } from '@/lib/services/integrations/factory'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: Request,
  { params }: { params: { integrationId: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')  // connection ID

    if (!code || !state) {
      throw new Error('Missing code or state parameter')
    }

    // Get connection config
    const supabase = await createClient()
    const { data: connection } = await supabase
      .from('integration_connections')
      .select('config')
      .eq('id', state)
      .single()

    if (!connection) {
      throw new Error('Connection not found')
    }

    // Create provider
    const provider = IntegrationFactory.createProvider(
      params.integrationId,
      state,
      connection.config
    )

    // Handle OAuth callback (exchanges code for tokens)
    await provider.handleCallback(code)

    // Redirect back to integrations page
    return NextResponse.redirect(
      new URL('/settings/integrations?success=true', request.url)
    )
  } catch (error) {
    return NextResponse.redirect(
      new URL(`/settings/integrations?error=${error.message}`, request.url)
    )
  }
}
```

### 4.4 Sync Events

```typescript
// app/api/integrations/[connectionId]/sync/route.ts

import { NextResponse } from 'next/server'
import { IntegrationFactory } from '@/lib/services/integrations/factory'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: Request,
  { params }: { params: { connectionId: string } }
) {
  try {
    const supabase = await createClient()

    // Get connection
    const { data: connection } = await supabase
      .from('integration_connections')
      .select('integration_id, config')
      .eq('id', params.connectionId)
      .single()

    if (!connection) {
      return NextResponse.json({ success: false, error: 'Connection not found' }, { status: 404 })
    }

    // Create provider
    const provider = IntegrationFactory.createProvider(
      connection.integration_id,
      params.connectionId,
      connection.config
    )

    // Sync events
    const stats = await provider.syncEvents()

    return NextResponse.json({ success: true, stats })
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
```

---

## 5. UI Components

### 5.1 Dynamic Integration Card

```typescript
// components/settings/integrations/integration-card.tsx

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { IntegrationCardData } from '@/types/integration.types'
import * as Icons from 'lucide-react'

interface IntegrationCardProps {
  integration: IntegrationCardData
  onConnect: (integrationId: string) => void
  onDisconnect: (connectionId: string) => void
  onConfigure: (connectionId: string) => void
}

export function IntegrationCard({
  integration,
  onConnect,
  onDisconnect,
  onConfigure
}: IntegrationCardProps) {
  const { definition, connection, isConnected } = integration

  // Get icon component
  const IconComponent = definition.icon_name
    ? Icons[definition.icon_name as keyof typeof Icons]
    : Icons.Plug

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {/* Icon with brand color */}
            <div
              className="rounded-lg p-2"
              style={{ backgroundColor: `${definition.brand_color}20` }}
            >
              <IconComponent
                className="h-6 w-6"
                style={{ color: definition.brand_color }}
              />
            </div>

            <div>
              <CardTitle className="text-lg">{definition.name}</CardTitle>
              <CardDescription>{definition.description}</CardDescription>
            </div>
          </div>

          {/* Status badge */}
          {isConnected && (
            <Badge variant={connection?.sync_status === 'active' ? 'default' : 'secondary'}>
              {connection?.sync_status}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {/* Features */}
        <div className="flex flex-wrap gap-2">
          {definition.features.sync_events && (
            <Badge variant="outline">Event Sync</Badge>
          )}
          {definition.features.push_notifications && (
            <Badge variant="outline">Real-time Updates</Badge>
          )}
          {definition.features.bidirectional && (
            <Badge variant="outline">2-way Sync</Badge>
          )}
        </div>

        {/* Connection info */}
        {isConnected && connection && (
          <div className="mt-4 space-y-1 text-sm text-muted-foreground">
            {connection.external_account_name && (
              <p>Connected as: {connection.external_account_name}</p>
            )}
            {connection.last_sync_at && (
              <p>Last synced: {new Date(connection.last_sync_at).toLocaleString()}</p>
            )}
            {connection.total_events_synced > 0 && (
              <p>{connection.total_events_synced} events synced</p>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex gap-2">
        {!isConnected ? (
          <Button
            onClick={() => onConnect(definition.id)}
            disabled={!integration.canConnect}
          >
            Connect
          </Button>
        ) : (
          <>
            <Button
              variant="outline"
              onClick={() => onConfigure(connection!.id)}
            >
              Configure
            </Button>
            <Button
              variant="destructive"
              onClick={() => onDisconnect(connection!.id)}
            >
              Disconnect
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  )
}
```

### 5.2 Dynamic Integrations Page

```typescript
// app/(dashboard)/settings/integrations/page.tsx

'use client'

import { useState, useEffect } from 'react'
import { useOrganization } from '@/hooks'
import { IntegrationCard } from '@/components/settings/integrations/integration-card'
import type { IntegrationCardData } from '@/types/integration.types'

export default function IntegrationsPage() {
  const { organization } = useOrganization()
  const [integrations, setIntegrations] = useState<IntegrationCardData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (organization?.id) {
      fetchIntegrations()
    }
  }, [organization?.id])

  async function fetchIntegrations() {
    const response = await fetch(`/api/integrations?organizationId=${organization.id}`)
    const { integrations } = await response.json()
    setIntegrations(integrations)
    setLoading(false)
  }

  async function handleConnect(integrationId: string) {
    const response = await fetch(`/api/integrations/${integrationId}/connect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        organizationId: organization.id,
        config: {},  // Default config, will be customized in OAuth flow
        userId: 'current-user-id'  // Get from auth
      })
    })

    const { authUrl } = await response.json()

    // Redirect to OAuth
    window.location.href = authUrl
  }

  async function handleDisconnect(connectionId: string) {
    await fetch(`/api/integrations/${connectionId}`, { method: 'DELETE' })
    fetchIntegrations()
  }

  function handleConfigure(connectionId: string) {
    // Open configuration modal
  }

  return (
    <div className="container max-w-4xl py-8">
      <h1 className="mb-6 text-2xl font-bold">Integrations</h1>

      <div className="space-y-6">
        {integrations.map(integration => (
          <IntegrationCard
            key={integration.definition.id}
            integration={integration}
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
            onConfigure={handleConfigure}
          />
        ))}
      </div>
    </div>
  )
}
```

---

## 6. Implementation Phases

### Phase 1: Foundation (Week 1)
- [ ] Create database migrations (registry, connections, logs tables)
- [ ] Seed integration registry with Google Calendar, Outlook, Eventbrite
- [ ] Create TypeScript types and interfaces
- [ ] Build IntegrationRegistry service
- [ ] Build IntegrationConnectionManager service

### Phase 2: Provider Framework (Week 2)
- [ ] Create IntegrationProvider abstract class
- [ ] Build IntegrationFactory
- [ ] Implement GoogleCalendarProvider (full implementation)
- [ ] Create API routes (GET integrations, POST connect, GET callback)
- [ ] Add encryption utilities for tokens

### Phase 3: UI (Week 3)
- [ ] Build IntegrationCard component
- [ ] Update integrations page to use dynamic cards
- [ ] Create configuration modal (reusable for all integrations)
- [ ] Add loading states and error handling
- [ ] Implement toast notifications

### Phase 4: Additional Providers (Week 4)
- [ ] Implement OutlookCalendarProvider
- [ ] Implement EventbriteProvider
- [ ] Add provider-specific configuration UIs
- [ ] Test OAuth flows for all providers

### Phase 5: Polish & Testing (Week 5)
- [ ] Add integration logs viewer
- [ ] Create sync history UI
- [ ] Implement manual sync trigger
- [ ] Add RLS policies for all new tables
- [ ] Write integration tests
- [ ] Documentation

---

## 7. Key Benefits

### For Developers
- **Single codebase pattern** for all integrations
- **Type-safe** integration configs
- **Easy to add new integrations** (implement provider class, add to factory)
- **Reusable OAuth flow**
- **Centralized logging and error handling**

### For Users
- **Consistent UI** across all integrations
- **One-click connect** for popular services
- **Clear status indicators**
- **Detailed sync history**
- **Easy troubleshooting**

### For Product
- **Faster integration development** (2-3 days per new integration vs weeks)
- **Scalable architecture** (can add 10+ integrations without refactoring)
- **Better analytics** (centralized logging)
- **Easier maintenance** (single codebase)

---

## 8. Migration Path (Google Calendar → Dynamic System)

1. Keep existing Google Calendar implementation working
2. Create new dynamic system alongside
3. Migrate Google Calendar to new provider pattern
4. Update UI to use IntegrationCard
5. Deprecate old implementation
6. Add new integrations using new system

---

## 9. Security Considerations

- **Encrypted tokens** using pgcrypto (AES-256)
- **Webhook signature verification** for all push notifications
- **RLS policies** restrict data access to organization members
- **OAuth state parameter** prevents CSRF attacks
- **Token refresh** before expiry (automated)
- **Audit logging** for all integration events
- **Rate limiting** on API endpoints
- **Secure secrets storage** (Supabase Vault or environment variables)

---

## 10. Example: Adding a New Integration (Slack)

```typescript
// 1. Add to registry (SQL seed)
INSERT INTO integration_registry (id, name, description, category, icon_name, brand_color, ...) VALUES
('slack', 'Slack', 'Send poster notifications to Slack channels', 'notification', 'MessageSquare', '#4A154B', ...);

// 2. Create config type
export interface SlackConfig {
  workspace_id: string
  channel_id: string
  notify_on_generation: boolean
}

// 3. Create provider
export class SlackProvider extends IntegrationProvider {
  async getAuthUrl(): Promise<string> { /* ... */ }
  async handleCallback(code: string): Promise<void> { /* ... */ }
  async sendNotification(message: string): Promise<void> { /* ... */ }
  // ...
}

// 4. Add to factory
case 'slack':
  return new SlackProvider(connectionId, config)

// 5. Done! UI automatically shows Slack card
```

---

## Summary

This dynamic integration system provides:
- **Scalable architecture** for unlimited integrations
- **Reusable components** (OAuth, UI, logging)
- **Type-safe configuration** with TypeScript
- **Consistent user experience** across all integrations
- **Easy maintenance** with centralized code
- **Fast development** for new integrations (2-3 days)

**Next Steps:**
1. Review and approve this plan
2. Create Phase 1 database migrations
3. Build foundation services
4. Migrate Google Calendar to new system
5. Add Outlook and Eventbrite providers
