/**
 * Google Calendar Integration Types
 *
 * Types for OAuth connections, events, and push notifications
 */

// ============================================================================
// Database Types
// ============================================================================

export type GoogleCalendarSyncStatus =
  | 'pending'
  | 'syncing'
  | 'synced'
  | 'error'
  | 'disconnected'

export type GoogleCalendarPushEventType =
  | 'channel_created'
  | 'channel_renewed'
  | 'channel_stopped'
  | 'push_received'
  | 'sync_triggered'
  | 'sync_completed'
  | 'sync_failed'
  | 'token_refreshed'
  | 'token_refresh_failed'

export type GoogleResourceState = 'sync' | 'exists' | 'update' | 'delete'

/**
 * Google Calendar Connection record from database
 * Note: Tokens are encrypted in DB, decrypted in service layer
 */
export interface GoogleCalendarConnection {
  id: string
  organization_id: string

  // Google account info
  google_account_email: string | null
  google_account_id: string | null

  // Selected calendar
  calendar_id: string
  calendar_name: string | null
  calendar_timezone: string | null

  // Connection metadata
  connected_by: string | null
  connected_at: string
  last_sync_at: string | null
  sync_status: GoogleCalendarSyncStatus
  sync_error: string | null

  // Incremental sync token
  sync_token: string | null

  // Push notification channel
  push_channel_id: string | null
  push_resource_id: string | null
  push_channel_expiry: string | null

  // Sync settings
  sync_past_days: number
  sync_future_days: number
  is_active: boolean

  // Stats
  total_events_synced: number
  total_syncs: number
  error_count: number

  // Timestamps
  created_at: string
  updated_at: string
}

/**
 * Connection with decrypted tokens (only used in service layer)
 */
export interface GoogleCalendarConnectionWithTokens
  extends GoogleCalendarConnection {
  access_token: string
  refresh_token: string
  token_expiry: string
}

/**
 * Push notification log record
 */
export interface GoogleCalendarPushLog {
  id: string
  connection_id: string | null
  organization_id: string | null
  event_type: GoogleCalendarPushEventType
  channel_id: string | null
  resource_id: string | null
  resource_state: GoogleResourceState | null
  message_number: string | null
  events_added: number | null
  events_updated: number | null
  events_deleted: number | null
  success: boolean
  error_message: string | null
  request_headers: Record<string, string> | null
  response_payload: Record<string, unknown> | null
  duration_ms: number | null
  created_at: string
}

// ============================================================================
// Google Calendar API Types
// ============================================================================

/**
 * Google Calendar from calendarList API
 */
export interface GoogleCalendar {
  id: string
  summary: string
  description?: string
  timeZone: string
  colorId?: string
  backgroundColor?: string
  foregroundColor?: string
  selected?: boolean
  primary?: boolean
  accessRole: 'freeBusyReader' | 'reader' | 'writer' | 'owner'
}

/**
 * Google Calendar Event from events API
 */
export interface GoogleCalendarEvent {
  id: string
  status: 'confirmed' | 'tentative' | 'cancelled'
  htmlLink: string
  created: string
  updated: string
  summary?: string
  description?: string
  location?: string
  colorId?: string

  // Creator/Organizer
  creator?: {
    id?: string
    email?: string
    displayName?: string
    self?: boolean
  }
  organizer?: {
    id?: string
    email?: string
    displayName?: string
    self?: boolean
  }

  // Date/Time
  start: GoogleCalendarDateTime
  end: GoogleCalendarDateTime

  // Recurrence
  recurrence?: string[]
  recurringEventId?: string

  // Attendees
  attendees?: GoogleCalendarAttendee[]

  // Conference/Video meeting
  conferenceData?: {
    entryPoints?: Array<{
      entryPointType: string
      uri: string
      label?: string
    }>
    conferenceSolution?: {
      name: string
      iconUri?: string
    }
  }

  // Attachments
  attachments?: Array<{
    fileUrl: string
    title: string
    mimeType: string
    iconLink?: string
    fileId?: string
  }>

  // Visibility
  visibility?: 'default' | 'public' | 'private' | 'confidential'

  // iCalUID for deduplication
  iCalUID?: string

  // Extended properties
  extendedProperties?: {
    private?: Record<string, string>
    shared?: Record<string, string>
  }
}

export interface GoogleCalendarDateTime {
  date?: string // For all-day events (YYYY-MM-DD)
  dateTime?: string // For timed events (RFC3339)
  timeZone?: string
}

export interface GoogleCalendarAttendee {
  id?: string
  email: string
  displayName?: string
  organizer?: boolean
  self?: boolean
  resource?: boolean
  optional?: boolean
  responseStatus?: 'needsAction' | 'declined' | 'tentative' | 'accepted'
  comment?: string
}

/**
 * Google Calendar Events List Response
 */
export interface GoogleCalendarEventsListResponse {
  kind: 'calendar#events'
  etag: string
  summary: string
  description?: string
  updated: string
  timeZone: string
  accessRole: string
  nextPageToken?: string
  nextSyncToken?: string
  items: GoogleCalendarEvent[]
}

/**
 * Google Calendar List Response
 */
export interface GoogleCalendarListResponse {
  kind: 'calendar#calendarList'
  etag: string
  nextPageToken?: string
  nextSyncToken?: string
  items: GoogleCalendar[]
}

// ============================================================================
// OAuth Types
// ============================================================================

/**
 * Google OAuth token response
 */
export interface GoogleOAuthTokenResponse {
  access_token: string
  refresh_token?: string // Only on initial auth with offline access
  expires_in: number
  token_type: 'Bearer'
  scope: string
  id_token?: string
}

/**
 * Google OAuth user info response
 */
export interface GoogleUserInfo {
  id: string
  email: string
  verified_email: boolean
  name?: string
  given_name?: string
  family_name?: string
  picture?: string
}

/**
 * OAuth state for CSRF protection
 */
export interface GoogleOAuthState {
  organization_id: string
  nonce: string
  timestamp: number
  redirect_url?: string
}

// ============================================================================
// Push Notification Types
// ============================================================================

/**
 * Google Push Notification Channel
 */
export interface GooglePushChannel {
  id: string
  resourceId: string
  resourceUri: string
  token?: string
  expiration: string // Unix timestamp in milliseconds
}

/**
 * Incoming push notification headers
 */
export interface GooglePushNotificationHeaders {
  'x-goog-channel-id': string
  'x-goog-channel-token'?: string
  'x-goog-channel-expiration'?: string
  'x-goog-resource-id': string
  'x-goog-resource-uri': string
  'x-goog-resource-state': GoogleResourceState
  'x-goog-message-number': string
}

// ============================================================================
// Service Types
// ============================================================================

/**
 * Parameters for getting calendar events
 */
export interface GetEventsParams {
  calendarId: string
  accessToken: string
  timeMin?: string
  timeMax?: string
  syncToken?: string
  pageToken?: string
  maxResults?: number
  singleEvents?: boolean
  orderBy?: 'startTime' | 'updated'
}

/**
 * Result of a sync operation
 */
export interface SyncResult {
  success: boolean
  eventsAdded: number
  eventsUpdated: number
  eventsDeleted: number
  nextSyncToken: string | null
  error?: string
}

/**
 * Connection status response
 */
export interface ConnectionStatusResponse {
  connected: boolean
  calendarName: string | null
  calendarId: string | null
  googleAccountEmail: string | null
  lastSyncAt: string | null
  syncStatus: GoogleCalendarSyncStatus
  syncError: string | null
  eventsCount: number
  pushChannelActive: boolean
  pushChannelExpiry: string | null
  isExpiringSoon: boolean
}

/**
 * Authorize request params
 */
export interface AuthorizeParams {
  organization_id: string
  redirect_url?: string
}

/**
 * Callback request params
 */
export interface CallbackParams {
  code: string
  state: string
  error?: string
  error_description?: string
}

/**
 * Sync request body
 */
export interface SyncRequestBody {
  organization_id: string
  full_sync?: boolean
}

/**
 * Disconnect request body
 */
export interface DisconnectRequestBody {
  organization_id: string
  delete_events?: boolean
}

/**
 * Select calendar request body
 */
export interface SelectCalendarRequestBody {
  organization_id: string
  calendar_id: string
}

// ============================================================================
// UI Types
// ============================================================================

/**
 * Connection state for UI
 */
export interface GoogleCalendarConnectionState {
  connection: GoogleCalendarConnection | null
  isLoading: boolean
  error: string | null
  calendars: GoogleCalendar[]
  isLoadingCalendars: boolean
}

/**
 * Available actions for connection
 */
export interface GoogleCalendarActions {
  connect: () => void
  disconnect: () => Promise<void>
  syncNow: () => Promise<void>
  selectCalendar: (calendarId: string) => Promise<void>
  refreshStatus: () => Promise<void>
}

// ============================================================================
// Error Types
// ============================================================================

export enum GoogleCalendarErrorCode {
  // OAuth errors
  OAUTH_FAILED = 'OAUTH_FAILED',
  INVALID_STATE = 'INVALID_STATE',
  ACCESS_DENIED = 'ACCESS_DENIED',

  // Token errors
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_REFRESH_FAILED = 'TOKEN_REFRESH_FAILED',
  INVALID_TOKEN = 'INVALID_TOKEN',

  // API errors
  API_ERROR = 'API_ERROR',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  RATE_LIMITED = 'RATE_LIMITED',
  CALENDAR_NOT_FOUND = 'CALENDAR_NOT_FOUND',

  // Push notification errors
  CHANNEL_CREATION_FAILED = 'CHANNEL_CREATION_FAILED',
  CHANNEL_EXPIRED = 'CHANNEL_EXPIRED',
  INVALID_PUSH_TOKEN = 'INVALID_PUSH_TOKEN',

  // Sync errors
  SYNC_FAILED = 'SYNC_FAILED',
  ENCRYPTION_FAILED = 'ENCRYPTION_FAILED',

  // Permission errors
  NOT_AUTHORIZED = 'NOT_AUTHORIZED',
  NOT_ORG_ADMIN = 'NOT_ORG_ADMIN',
}

export interface GoogleCalendarError {
  code: GoogleCalendarErrorCode
  message: string
  details?: Record<string, unknown>
}

// ============================================================================
// Constants
// ============================================================================

export const GOOGLE_CALENDAR_SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.events.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
] as const

export const GOOGLE_CALENDAR_SOURCE_APP_ID = 'google-calendar'

export const PUSH_CHANNEL_MAX_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

export const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000 // Refresh 5 minutes before expiry
