/**
 * Credit Management Service
 * Handles credit allocation, consumption, refunds, and balance management
 *
 * CRITICAL: All credit operations MUST be atomic (balance + transaction in single operation)
 *
 * NOTE: Credits are stored in the organizations.credits_balance column.
 * Transactions are logged in the credit_transactions table.
 *
 * @module credit-service
 */

import { createClient } from '@/lib/supabase/server'
import { logSuperAdminAction } from './audit-service'
import type { Json } from '@/types/database.types'

// Type for Supabase client (can be regular or admin client)
type SupabaseClient = Awaited<ReturnType<typeof createClient>>

export interface AllocateCreditsParams {
  organization_id: string
  amount: number
  reason: string
  allocated_by: string // Super Admin user ID
  // Valid DB types: 'purchase', 'generation', 'refund', 'bonus', 'adjustment'
  reference_type?: 'purchase' | 'bonus' | 'adjustment'
  reference_id?: string
  metadata?: Record<string, unknown>
}

export interface ConsumeCreditsParams {
  organization_id: string
  amount: number
  reason: string
  reference_type: string // e.g., 'api_usage', 'creative_generation'
  reference_id: string // e.g., creative.id
  metadata?: Record<string, unknown>
}

export interface RefundCreditsParams {
  organization_id: string
  amount: number
  reason: string
  reference_type: string
  reference_id: string
  refunded_by?: string // Super Admin user ID (if manual refund)
}

/**
 * Allocate credits to organization
 * Creates transaction and updates balance atomically
 *
 * @param supabase - Supabase client (should be admin client for super-admin operations)
 * @param params - Allocation parameters
 *
 * @example
 * ```typescript
 * const result = await allocateCredits(adminClient, {
 *   organization_id: 'org-uuid',
 *   amount: 1000,
 *   reason: 'Monthly subscription renewal',
 *   allocated_by: superAdmin.id,
 *   reference_type: 'subscription_renewal',
 *   reference_id: subscription.id
 * })
 * ```
 */
export async function allocateCredits(
  supabase: SupabaseClient,
  params: AllocateCreditsParams
): Promise<{
  success: boolean
  new_balance: number
  transaction_id: string
}> {
  try {
    // 1. Get current balance from organizations table
    const { data: org, error: fetchError } = await supabase
      .from('organizations')
      .select('id, credits_balance')
      .eq('id', params.organization_id)
      .single()

    if (fetchError || !org) {
      throw new Error(`Organization not found: ${params.organization_id}`)
    }

    const balance_before = org.credits_balance || 0
    const balance_after = balance_before + params.amount

    // 2. Create transaction record
    const { data: transaction, error: txnError } = await supabase
      .from('credit_transactions')
      .insert({
        organization_id: params.organization_id,
        type: params.reference_type || 'bonus',
        amount: params.amount,
        balance_after,
        description: params.reason,
        metadata: (params.metadata || null) as Json,
        user_id: params.allocated_by,
      })
      .select('id')
      .single()

    if (txnError) {
      throw new Error(`Failed to create transaction: ${txnError.message}`)
    }

    // 3. Update balance on organizations table
    const { error: updateError } = await supabase
      .from('organizations')
      .update({
        credits_balance: balance_after,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.organization_id)

    if (updateError) {
      throw new Error(`Failed to update balance: ${updateError.message}`)
    }

    // 4. Log Super Admin action (if allocated by Super Admin)
    if (params.allocated_by) {
      await logSuperAdminAction({
        super_admin_id: params.allocated_by,
        action: 'credit:allocate',
        resource_type: 'credit',
        resource_id: transaction.id,
        target_organization_id: params.organization_id,
        changes: {
          before: { balance: balance_before },
          after: { balance: balance_after, amount: params.amount },
        },
      })
    }

    return {
      success: true,
      new_balance: balance_after,
      transaction_id: transaction.id,
    }
  } catch (error) {
    console.error('[credit-service] Failed to allocate credits:', error)
    throw error
  }
}

/**
 * Consume credits (called during API usage)
 * Deducts credits and logs consumption
 *
 * @param supabase - Supabase client
 * @param params - Consumption parameters
 *
 * @example
 * ```typescript
 * const supabase = await createClient()
 * const result = await consumeCredits(supabase, {
 *   organization_id: org.id,
 *   amount: 10,
 *   reason: 'AI creative generation',
 *   reference_type: 'creative_generation',
 *   reference_id: creative.id,
 *   metadata: { model: 'gemini-2.0', format: 'event_poster' }
 * })
 * ```
 */
export async function consumeCredits(
  supabase: SupabaseClient,
  params: ConsumeCreditsParams
): Promise<{
  success: boolean
  new_balance: number
  transaction_id: string
}> {
  try {
    // 1. Get current balance from organizations table
    const { data: org, error: fetchError } = await supabase
      .from('organizations')
      .select('id, credits_balance')
      .eq('id', params.organization_id)
      .single()

    if (fetchError || !org) {
      throw new Error(`Organization not found: ${params.organization_id}`)
    }

    const balance_before = org.credits_balance || 0

    // 2. Check sufficient balance
    if (balance_before < params.amount) {
      throw new Error(`Insufficient credits. Available: ${balance_before}, Required: ${params.amount}`)
    }

    const balance_after = balance_before - params.amount

    // 3. Create transaction record (negative amount for consumption)
    const { data: transaction, error: txnError } = await supabase
      .from('credit_transactions')
      .insert({
        organization_id: params.organization_id,
        type: 'generation',
        amount: -params.amount, // Negative for consumption
        balance_after,
        description: params.reason,
        creative_id: params.reference_id,
        metadata: (params.metadata || null) as Json,
      })
      .select('id')
      .single()

    if (txnError) {
      throw new Error(`Failed to create transaction: ${txnError.message}`)
    }

    // 4. Update balance on organizations table
    const { error: updateError } = await supabase
      .from('organizations')
      .update({
        credits_balance: balance_after,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.organization_id)

    if (updateError) {
      throw new Error(`Failed to update balance: ${updateError.message}`)
    }

    return {
      success: true,
      new_balance: balance_after,
      transaction_id: transaction.id,
    }
  } catch (error) {
    console.error('[credit-service] Failed to consume credits:', error)
    throw error
  }
}

/**
 * Refund credits to organization
 * Used when AI generation fails or needs to be reversed
 *
 * @param supabase - Supabase client
 * @param params - Refund parameters
 *
 * @example
 * ```typescript
 * const supabase = await createClient()
 * await refundCredits(supabase, {
 *   organization_id: org.id,
 *   amount: 10,
 *   reason: 'AI generation failed',
 *   reference_type: 'creative_generation',
 *   reference_id: creative.id,
 *   refunded_by: superAdmin.id
 * })
 * ```
 */
export async function refundCredits(
  supabase: SupabaseClient,
  params: RefundCreditsParams
): Promise<{
  success: boolean
  new_balance: number
  transaction_id: string
}> {
  try {
    // 1. Get current balance from organizations table
    const { data: org, error: fetchError } = await supabase
      .from('organizations')
      .select('id, credits_balance')
      .eq('id', params.organization_id)
      .single()

    if (fetchError || !org) {
      throw new Error(`Organization not found: ${params.organization_id}`)
    }

    const balance_before = org.credits_balance || 0
    const balance_after = balance_before + params.amount

    // 2. Create transaction record
    const { data: transaction, error: txnError } = await supabase
      .from('credit_transactions')
      .insert({
        organization_id: params.organization_id,
        type: 'refund',
        amount: params.amount,
        balance_after,
        description: params.reason,
        creative_id: params.reference_id,
        user_id: params.refunded_by,
      })
      .select('id')
      .single()

    if (txnError) {
      throw new Error(`Failed to create transaction: ${txnError.message}`)
    }

    // 3. Update balance on organizations table
    const { error: updateError } = await supabase
      .from('organizations')
      .update({
        credits_balance: balance_after,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.organization_id)

    if (updateError) {
      throw new Error(`Failed to update balance: ${updateError.message}`)
    }

    // 4. Log Super Admin action (if manual refund)
    if (params.refunded_by) {
      await logSuperAdminAction({
        super_admin_id: params.refunded_by,
        action: 'credit:refund',
        resource_type: 'credit',
        resource_id: transaction.id,
        target_organization_id: params.organization_id,
        changes: {
          before: { balance: balance_before },
          after: { balance: balance_after, amount: params.amount },
        },
      })
    }

    return {
      success: true,
      new_balance: balance_after,
      transaction_id: transaction.id,
    }
  } catch (error) {
    console.error('[credit-service] Failed to refund credits:', error)
    throw error
  }
}

/**
 * Get organization credit balance
 *
 * @param supabase - Supabase client
 * @param organization_id - Organization ID
 *
 * @example
 * ```typescript
 * const supabase = await createClient()
 * const balance = await getCreditBalance(supabase, org.id)
 * console.log(`Available credits: ${balance.balance}`)
 * ```
 */
export async function getCreditBalance(
  supabase: SupabaseClient,
  organization_id: string
): Promise<{
  balance: number
  is_low_balance: boolean
  low_balance_threshold: number
}> {
  const { data, error } = await supabase
    .from('organizations')
    .select('id, credits_balance')
    .eq('id', organization_id)
    .single()

  if (error || !data) {
    throw new Error(`Failed to fetch credit balance: ${error?.message}`)
  }

  const balance = data.credits_balance || 0
  const threshold = 100 // Default threshold

  return {
    balance,
    is_low_balance: balance <= threshold,
    low_balance_threshold: threshold,
  }
}

/**
 * Get credit transaction history for an organization
 */
export async function getCreditTransactions(
  organization_id: string,
  options?: {
    limit?: number
    offset?: number
    type?: string
  }
): Promise<{
  transactions: Array<{
    id: string
    type: string
    amount: number
    balance_after: number
    description: string | null
    created_at: string | null
  }>
  total: number
}> {
  const supabase = await createClient()
  const limit = options?.limit || 50
  const offset = options?.offset || 0

  let query = supabase
    .from('credit_transactions')
    .select('*', { count: 'exact' })
    .eq('organization_id', organization_id)
    .order('created_at', { ascending: false })

  if (options?.type) {
    query = query.eq('type', options.type)
  }

  query = query.range(offset, offset + limit - 1)

  const { data, error, count } = await query

  if (error) {
    throw new Error(`Failed to fetch transactions: ${error.message}`)
  }

  return {
    transactions: (data || []).map((t) => ({
      id: t.id,
      type: t.type,
      amount: t.amount,
      balance_after: t.balance_after || 0,
      description: t.description,
      created_at: t.created_at,
    })),
    total: count || 0,
  }
}
