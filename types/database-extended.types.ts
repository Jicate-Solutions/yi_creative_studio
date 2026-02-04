/**
 * Extended Database Types
 *
 * This file extends the auto-generated Supabase types with tables
 * that exist in pending migrations but haven't been applied yet.
 *
 * TODO: Regenerate database.types.ts after applying migrations:
 * - 20260130000001_add_synced_events_v2_fields.sql
 * - 20260130000002_webhook_management.sql
 * - 20260203000001_google_calendar_integration.sql
 * - 20260203000002_add_dynamic_fields_support.sql
 * - 20260203000003_create_dynamic_field_registry.sql
 * - 20260203000003_synced_events_rls_policies.sql
 */

import type { Database, Json } from './database.types'

// Extended tables that exist in migrations but not yet in types
export interface ExtendedTables {
  synced_events: {
    Row: {
      id: string
      organization_id: string
      source_app_id: string
      source_event_id: string
      event_data: Json
      event_name: string | null
      event_description: string | null
      event_date: string | null
      event_time: string | null
      venue: string | null
      created_at: string
      updated_at: string
    }
    Insert: {
      id?: string
      organization_id: string
      source_app_id: string
      source_event_id: string
      event_data: Json
      event_name?: string | null
      event_description?: string | null
      event_date?: string | null
      event_time?: string | null
      venue?: string | null
      created_at?: string
      updated_at?: string
    }
    Update: {
      id?: string
      organization_id?: string
      source_app_id?: string
      source_event_id?: string
      event_data?: Json
      event_name?: string | null
      event_description?: string | null
      event_date?: string | null
      event_time?: string | null
      venue?: string | null
      created_at?: string
      updated_at?: string
    }
    Relationships: []
  }
  event_sources: {
    Row: {
      id: string
      organization_id: string
      source_type: string
      webhook_url: string
      webhook_secret: string
      is_active: boolean
      created_at: string
      updated_at: string
    }
    Insert: {
      id?: string
      organization_id: string
      source_type: string
      webhook_url: string
      webhook_secret: string
      is_active?: boolean
      created_at?: string
      updated_at?: string
    }
    Update: {
      id?: string
      organization_id?: string
      source_type?: string
      webhook_url?: string
      webhook_secret?: string
      is_active?: boolean
      created_at?: string
      updated_at?: string
    }
    Relationships: []
  }
}

// Merge extended tables with existing database types
export type ExtendedDatabase = Omit<Database, 'public'> & {
  public: Omit<Database['public'], 'Tables'> & {
    Tables: Database['public']['Tables'] & ExtendedTables
  }
}
