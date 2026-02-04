/**
 * External Event Integration Types
 *
 * Types for integrating with external event management applications.
 * Used to fetch event details and pre-fill the creative generation form.
 */

// ============================================================================
// External Event Data Structures
// ============================================================================

/**
 * Speaker information from external event
 */
export interface ExternalEventSpeaker {
  id: string
  name: string
  designation?: string
  organization?: string
  photoUrl?: string
  bio?: string
}

/**
 * External event data structure
 * This is the standardized format that Yi Studio expects from any external event source
 *
 * @version 3.0 - Added dynamic fields support (customData, customFieldMetadata)
 */
export interface ExternalEvent {
  // Required fields
  id: string
  name: string

  // Date/Time
  date: string // ISO date (YYYY-MM-DD)
  startTime?: string // HH:MM format (24h)
  endTime?: string // HH:MM format (24h)

  // Location
  venue?: string
  venueAddress?: string
  city?: string
  venueLatitude?: number // GPS latitude (e.g., 13.0827)
  venueLongitude?: number // GPS longitude (e.g., 80.2707)
  venueCapacity?: number // Maximum venue capacity

  // Virtual Event Support
  isVirtual?: boolean // Whether event is online-only
  virtualMeetingLink?: string // Zoom/Meet/Teams URL

  // People
  speakers?: ExternalEventSpeaker[]
  organizerName?: string
  organizationId?: string
  organizationName?: string
  chapterName?: string // Yi chapter name (e.g., "Yi Chapter Chennai")
  chapterLocation?: string // Chapter city/region

  // Content
  description?: string
  tagline?: string
  eventType?: string // conference, workshop, seminar, meetup, etc.
  tags?: string[] // Event tags/labels (e.g., ["annual", "flagship"])
  isFeatured?: boolean // Whether event is featured/highlighted

  // Registration
  registrationUrl?: string
  entryFee?: string // "Free" or amount like "₹500"
  registrationDeadline?: string
  registrationStartDate?: string // When registration opens (ISO date)
  maxCapacity?: number // Maximum attendees
  currentRegistrations?: number // Current RSVP count (snapshot at sync time)
  waitlistEnabled?: boolean // Whether waitlist is active

  // Guest Policy
  allowGuests?: boolean // Whether +1 guests are allowed
  guestLimit?: number // Maximum guests per attendee

  // Target audience
  targetAudience?: string

  // Media
  bannerImageUrl?: string

  // Metadata
  status: 'draft' | 'published' | 'completed' | 'cancelled'
  createdAt: string
  updatedAt: string

  // ============================================================================
  // Dynamic Fields (v3.0) - Arbitrary custom data from external apps
  // ============================================================================

  /**
   * Arbitrary custom data from external apps
   * Stores any field not in the static schema
   * Keys are normalized to snake_case
   * Example: { "dress_code": "Business Casual", "parking_info": "Free valet" }
   */
  customData?: Record<string, unknown>

  /**
   * Metadata about custom fields (type hints for form rendering)
   * Example: { "dress_code": { "type": "text", "label": "Dress Code" } }
   */
  customFieldMetadata?: Record<
    string,
    {
      type?: DynamicFieldType
      label?: string
      placeholder?: string
      options?: string[] // For select fields
    }
  >

  // Internal sync metadata (added by API, not from external source)
  _syncedEventId?: string // Database row ID (synced_events.id)
  _sourceAppId?: string // Source app identifier (e.g., "yi-connect", "myjkkn")
  _syncedAt?: string // When the event was last synced
}

/**
 * Field types supported for dynamic fields
 */
export type DynamicFieldType =
  | 'text'
  | 'textarea'
  | 'date'
  | 'time'
  | 'number'
  | 'boolean'
  | 'select'

/**
 * Dynamic field captured from external source
 * Represents a single field that was not in the static schema
 */
export interface DynamicField {
  /** Normalized field ID in snake_case (e.g., "dress_code") */
  fieldId: string
  /** Original key from webhook payload (e.g., "dressCode") */
  originalKey: string
  /** The actual value of the field */
  value: unknown
  /** Type inferred from the value */
  inferredType: DynamicFieldType
  /** Human-readable label derived from key (e.g., "Dress Code") */
  inferredLabel: string
  /** Source app that provided this field */
  source: string
}

/**
 * Registry entry for a dynamic field
 * Stored in dynamic_field_registry table
 */
export interface DynamicFieldRegistryEntry {
  id: string
  fieldId: string
  fieldLabel: string
  sourceAppId: string
  organizationId: string
  fieldType: DynamicFieldType
  category: string
  placeholder?: string
  maxLength?: number
  options?: string[]
  helpText?: string
  usageCount: number
  firstSeenAt: string
  lastSeenAt: string
  canonicalMapping?: string
  isActive: boolean
  isRequired: boolean
  displayOrder: number
}

// ============================================================================
// API Request/Response Types
// ============================================================================

/**
 * Request to fetch events from external app
 */
export interface FetchExternalEventsRequest {
  // Single event lookup
  eventId?: string

  // List events with filters
  organizationId?: string
  organizationName?: string
  status?: 'draft' | 'published' | 'completed' | 'cancelled'
  startDate?: string // ISO date
  endDate?: string // ISO date

  // Pagination
  page?: number
  limit?: number

  // Search
  searchQuery?: string
}

/**
 * Response from external events API
 */
export interface FetchExternalEventsResponse {
  success: boolean
  events?: ExternalEvent[]
  event?: ExternalEvent // Single event lookup
  error?: string
  code?: ExternalEventErrorCode
  pagination?: {
    page: number
    pageSize: number
    totalItems: number
    totalPages: number
  }
}

/**
 * Error codes for external event operations
 */
export type ExternalEventErrorCode =
  | 'UNAUTHORIZED'
  | 'NOT_FOUND'
  | 'RATE_LIMITED'
  | 'NETWORK_ERROR'
  | 'INVALID_RESPONSE'
  | 'VALIDATION_ERROR'
  | 'SOURCE_UNAVAILABLE'

// ============================================================================
// Import/Mapping Types
// ============================================================================

/**
 * Metadata about an imported external event
 * Stored with the creative to track the relationship
 */
export interface ExternalEventMeta {
  id: string // External event ID
  source: string // Domain of external app (e.g., "events.yichapter.org")
  importedAt: string // ISO timestamp when imported
  mappedFields: string[] // Which form fields came from external source
  eventName: string // Cached for display purposes
  eventUpdatedAt?: string // To detect changes
}

/**
 * Result of mapping external event to form fields
 * @version 3.0 - Added dynamicFields for custom/unknown fields
 * @version 3.1 - Added format inference support
 */
export interface EventMappingResult {
  formData: Record<string, unknown>
  mappedFields: string[] // Fields that were successfully mapped
  unmappedFields: string[] // External fields with no target in form (deprecated - use dynamicFields)
  dynamicFields: DynamicField[] // v3.0: Custom fields captured from external source
  warnings: string[] // Potential issues (past date, missing required fields, etc.)

  // v3.1: Format inference
  recommendedFormatId?: import('@/lib/config/creative-formats').CreativeFormatId
  formatReasoning?: string
}

/**
 * Field mapping configuration
 * Maps external event field names to Yi Studio form field names
 */
export interface FieldMappingConfig {
  externalField: string
  formField: string
  transform?: (value: unknown) => unknown
}

// ============================================================================
// UI State Types
// ============================================================================

/**
 * State for external event import in creative store
 *
 * @version 3.0 - Added dynamicFields for custom external event fields
 */
export interface ExternalEventImportState {
  isLoading: boolean
  error: string | null
  externalEventMeta: ExternalEventMeta | null
  previewData: EventMappingResult | null
  hasChanges: boolean // True if source event updated since import
  changedFields: string[] // Which fields changed
  dynamicFields: DynamicField[] // v3.0: Custom fields from external source
}

/**
 * Events calendar page state
 */
export interface EventsCalendarState {
  events: ExternalEvent[]
  isLoading: boolean
  error: string | null
  selectedDate: string | null // ISO date
  selectedEvent: ExternalEvent | null
  viewMode: 'month' | 'week'
  currentMonth: string // YYYY-MM format
}

// ============================================================================
// Change Detection Types
// ============================================================================

/**
 * Result of checking for changes in source event
 */
export interface EventChangeDetectionResult {
  hasChanges: boolean
  changedFields: Array<{
    field: string
    label: string
    oldValue: unknown
    newValue: unknown
  }>
  sourceUpdatedAt: string
}

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * External event source configuration
 */
export interface ExternalEventSourceConfig {
  name: string // Display name (e.g., "Yi Events")
  baseUrl: string // API base URL
  apiKeyHeader?: string // Header name for API key (default: "X-API-Key")
  organizationIdField?: string // Field name for org ID in request
  enabled: boolean
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Event status display information
 */
export const EVENT_STATUS_CONFIG = {
  draft: { label: 'Draft', color: 'gray', icon: 'FileEdit' },
  published: { label: 'Published', color: 'green', icon: 'CheckCircle' },
  completed: { label: 'Completed', color: 'blue', icon: 'CheckCheck' },
  cancelled: { label: 'Cancelled', color: 'red', icon: 'XCircle' },
} as const

/**
 * Common event types for categorization
 */
export const EVENT_TYPES = [
  'conference',
  'workshop',
  'seminar',
  'webinar',
  'meetup',
  'networking',
  'training',
  'summit',
  'hackathon',
  'panel',
  'launch',
  'celebration',
  'awards',
  'other',
] as const

export type EventType = (typeof EVENT_TYPES)[number]
