/**
 * Super Admin Audit Service
 * Comprehensive logging of all Super Admin actions for security and compliance
 *
 * CRITICAL: Call logSuperAdminAction() for EVERY Super Admin operation
 *
 * @module audit-service
 */

import { createClient } from '@/lib/supabase/server'

export interface AuditLogParams {
  super_admin_id: string
  action: string                          // e.g., 'org:create', 'user:suspend', 'credit:allocate'
  resource_type: string                   // e.g., 'organization', 'user', 'subscription', 'credit'
  resource_id?: string                    // UUID of affected resource
  target_organization_id?: string         // Target org (if applicable)
  target_user_id?: string                 // Target user (if applicable)
  changes?: {
    before?: any                          // State before action
    after?: any                           // State after action
  }
  ip_address?: string                     // Request IP
  user_agent?: string                     // Browser user agent
  was_impersonating?: boolean             // Was action performed while impersonating?
  impersonated_user_id?: string           // User being impersonated (if applicable)
}

/**
 * Log Super Admin action to audit trail
 *
 * @example
 * ```typescript
 * await logSuperAdminAction({
 *   super_admin_id: user.id,
 *   action: 'org:create',
 *   resource_type: 'organization',
 *   resource_id: newOrg.id,
 *   changes: {
 *     after: { name: newOrg.name, tier: 'free' }
 *   },
 *   ip_address: req.headers.get('x-forwarded-for') || 'unknown'
 * })
 * ```
 */
export async function logSuperAdminAction(params: AuditLogParams): Promise<void> {
  try {
    const supabase = await createClient()

    // Get current user's email from auth (the logged-in user)
    const { data: { user } } = await supabase.auth.getUser()
    const email = user?.email || 'unknown'

    // Insert audit log entry
    const { error } = await supabase
      .from('super_admin_audit_logs')
      .insert({
        super_admin_id: params.super_admin_id,
        super_admin_email: email,
        action: params.action,
        resource_type: params.resource_type,
        resource_id: params.resource_id,
        target_organization_id: params.target_organization_id,
        target_user_id: params.target_user_id,
        changes: params.changes || null,
        ip_address: params.ip_address,
        user_agent: params.user_agent,
        was_impersonating: params.was_impersonating || false,
        impersonated_user_id: params.impersonated_user_id,
      })

    if (error) {
      console.error('[audit-service] Failed to log Super Admin action:', error)
      // Don't throw - audit logging failure shouldn't break operations
      // But log to monitoring system in production
    }
  } catch (err) {
    console.error('[audit-service] Exception while logging:', err)
    // Fail silently - audit logging is critical but shouldn't block operations
  }
}

/**
 * Retrieve audit logs with filtering
 *
 * @example
 * ```typescript
 * const logs = await getAuditLogs({
 *   super_admin_id: user.id,
 *   action_filter: 'credit:*',
 *   limit: 50
 * })
 * ```
 */
export async function getAuditLogs(options: {
  super_admin_id?: string
  target_organization_id?: string
  target_user_id?: string
  action_filter?: string    // e.g., 'credit:*' for all credit actions
  resource_type?: string
  limit?: number
  offset?: number
}): Promise<{ logs: any[]; total: number }> {
  const supabase = await createClient()

  let query = supabase
    .from('super_admin_audit_logs')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })

  // Apply filters
  if (options.super_admin_id) {
    query = query.eq('super_admin_id', options.super_admin_id)
  }

  if (options.target_organization_id) {
    query = query.eq('target_organization_id', options.target_organization_id)
  }

  if (options.target_user_id) {
    query = query.eq('target_user_id', options.target_user_id)
  }

  if (options.action_filter) {
    // Support wildcard matching (e.g., 'credit:*')
    if (options.action_filter.includes('*')) {
      const pattern = options.action_filter.replace('*', '%')
      query = query.like('action', pattern)
    } else {
      query = query.eq('action', options.action_filter)
    }
  }

  if (options.resource_type) {
    query = query.eq('resource_type', options.resource_type)
  }

  // Pagination
  const limit = options.limit || 50
  const offset = options.offset || 0
  query = query.range(offset, offset + limit - 1)

  const { data, error, count } = await query

  if (error) {
    console.error('[audit-service] Failed to retrieve logs:', error)
    throw new Error(`Failed to retrieve audit logs: ${error.message}`)
  }

  return {
    logs: data || [],
    total: count || 0,
  }
}

/**
 * Get audit log summary for a specific resource
 *
 * @example
 * ```typescript
 * const summary = await getResourceAuditSummary({
 *   resource_type: 'organization',
 *   resource_id: orgId
 * })
 * // Returns: { action_count: 12, last_modified_at: '2026-01-09T...' }
 * ```
 */
export async function getResourceAuditSummary(options: {
  resource_type: string
  resource_id: string
}): Promise<{ action_count: number; last_modified_at: string | null }> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('super_admin_audit_logs')
    .select('created_at')
    .eq('resource_type', options.resource_type)
    .eq('resource_id', options.resource_id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[audit-service] Failed to get resource summary:', error)
    throw new Error(`Failed to get audit summary: ${error.message}`)
  }

  return {
    action_count: data?.length || 0,
    last_modified_at: data?.[0]?.created_at || null,
  }
}

/**
 * Export audit logs to CSV format
 *
 * @example
 * ```typescript
 * const csv = await exportAuditLogsToCSV({
 *   start_date: '2026-01-01',
 *   end_date: '2026-01-31'
 * })
 * ```
 */
export async function exportAuditLogsToCSV(options: {
  start_date?: string
  end_date?: string
  super_admin_id?: string
}): Promise<string> {
  const supabase = await createClient()

  let query = supabase
    .from('super_admin_audit_logs')
    .select('*')
    .order('created_at', { ascending: true })

  if (options.start_date) {
    query = query.gte('created_at', options.start_date)
  }

  if (options.end_date) {
    query = query.lte('created_at', options.end_date)
  }

  if (options.super_admin_id) {
    query = query.eq('super_admin_id', options.super_admin_id)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Failed to export audit logs: ${error.message}`)
  }

  // Convert to CSV
  const headers = [
    'timestamp',
    'super_admin_email',
    'action',
    'resource_type',
    'resource_id',
    'target_organization_id',
    'target_user_id',
    'was_impersonating',
    'ip_address',
  ]

  const rows = data?.map((log) => [
    log.created_at,
    log.super_admin_email,
    log.action,
    log.resource_type,
    log.resource_id || '',
    log.target_organization_id || '',
    log.target_user_id || '',
    log.was_impersonating ? 'yes' : 'no',
    log.ip_address || '',
  ])

  const csv = [
    headers.join(','),
    ...(rows?.map((row) => row.join(',')) || []),
  ].join('\n')

  return csv
}
