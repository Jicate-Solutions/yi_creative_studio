/**
 * Credit Management Service
 * Handles credit allocation, consumption, refunds, and balance management
 *
 * CRITICAL: All credit operations MUST be atomic (balance + transaction in single operation)
 *
 * @module credit-service
 */

import { createClient } from '@/lib/supabase/server'
import { logSuperAdminAction } from './audit-service'

export interface AllocateCreditsParams {
  organization_id: string
  amount: number
  reason: string
  allocated_by: string // Super Admin user ID
  reference_type?: 'subscription_renewal' | 'manual_allocation' | 'purchase' | 'bonus' | 'adjustment'
  reference_id?: string
  metadata?: Record<string, any>
}

export interface ConsumeCreditsParams {
  organization_id: string
  amount: number
  reason: string
  reference_type: string // e.g., 'api_usage', 'creative_generation'
  reference_id: string // e.g., creative.id
  metadata?: Record<string, any>
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
 * @example
 * ```typescript
 * const result = await allocateCredits({
 *   organization_id: 'org-uuid',
 *   amount: 1000,
 *   reason: 'Monthly subscription renewal',
 *   allocated_by: superAdmin.id,
 *   reference_type: 'subscription_renewal',
 *   reference_id: subscription.id
 * })
 * ```
 */
export async function allocateCredits(params: AllocateCreditsParams): Promise<{
  success: boolean
  new_balance: number
  transaction_id: string
}> {
  const supabase = await createClient()

  try {
    // 1. Get current balance (with row lock for consistency)
    const { data: creditRecord, error: fetchError } = await supabase
      .from('organization_credits')
      .select('balance, total_allocated')
      .eq('organization_id', params.organization_id)
      .single()

    if (fetchError || !creditRecord) {
      throw new Error(`Organization credit record not found: ${params.organization_id}`)
    }

    const balance_before = creditRecord.balance
    const balance_after = balance_before + params.amount

    // 2. Create transaction record
    const { data: transaction, error: txnError } = await supabase
      .from('credit_transactions')
      .insert({
        organization_id: params.organization_id,
        type: params.reference_type || 'manual_allocation',
        amount: params.amount,
        balance_before,
        balance_after,
        reason: params.reason,
        reference_type: params.reference_type,
        reference_id: params.reference_id,
        metadata: params.metadata || {},
        created_by: params.allocated_by,
      })
      .select('id')
      .single()

    if (txnError) {
      throw new Error(`Failed to create transaction: ${txnError.message}`)
    }

    // 3. Update balance and total allocated
    const { error: updateError } = await supabase
      .from('organization_credits')
      .update({
        balance: balance_after,
        total_allocated: creditRecord.total_allocated + params.amount,
        last_allocation_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('organization_id', params.organization_id)

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
 * @example
 * ```typescript
 * const result = await consumeCredits({
 *   organization_id: org.id,
 *   amount: 10,
 *   reason: 'AI creative generation',
 *   reference_type: 'creative_generation',
 *   reference_id: creative.id,
 *   metadata: { model: 'gemini-2.0', format: 'event_poster' }
 * })
 * ```
 */
export async function consumeCredits(params: ConsumeCreditsParams): Promise<{
  success: boolean
  new_balance: number
  transaction_id: string
}> {
  const supabase = await createClient()

  try {
    // 1. Get current balance
    const { data: creditRecord, error: fetchError } = await supabase
      .from('organization_credits')
      .select('balance, total_consumed')
      .eq('organization_id', params.organization_id)
      .single()

    if (fetchError || !creditRecord) {
      throw new Error(`Organization credit record not found: ${params.organization_id}`)
    }

    const balance_before = creditRecord.balance

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
        type: 'consumption',
        amount: -params.amount, // Negative for consumption
        balance_before,
        balance_after,
        reason: params.reason,
        reference_type: params.reference_type,
        reference_id: params.reference_id,
        metadata: params.metadata || {},
      })
      .select('id')
      .single()

    if (txnError) {
      throw new Error(`Failed to create transaction: ${txnError.message}`)
    }

    // 4. Update balance and total consumed
    const { error: updateError } = await supabase
      .from('organization_credits')
      .update({
        balance: balance_after,
        total_consumed: creditRecord.total_consumed + params.amount,
        last_consumption_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('organization_id', params.organization_id)

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
 * @example
 * ```typescript
 * await refundCredits({
 *   organization_id: org.id,
 *   amount: 10,
 *   reason: 'AI generation failed',
 *   reference_type: 'creative_generation',
 *   reference_id: creative.id,
 *   refunded_by: superAdmin.id
 * })
 * ```
 */
export async function refundCredits(params: RefundCreditsParams): Promise<{
  success: boolean
  new_balance: number
  transaction_id: string
}> {
  const supabase = await createClient()

  try {
    // 1. Get current balance
    const { data: creditRecord, error: fetchError } = await supabase
      .from('organization_credits')
      .select('balance')
      .eq('organization_id', params.organization_id)
      .single()

    if (fetchError || !creditRecord) {
      throw new Error(`Organization credit record not found: ${params.organization_id}`)
    }

    const balance_before = creditRecord.balance
    const balance_after = balance_before + params.amount

    // 2. Create transaction record
    const { data: transaction, error: txnError } = await supabase
      .from('credit_transactions')
      .insert({
        organization_id: params.organization_id,
        type: 'refund',
        amount: params.amount,
        balance_before,
        balance_after,
        reason: params.reason,
        reference_type: params.reference_type,
        reference_id: params.reference_id,
        created_by: params.refunded_by,
      })
      .select('id')
      .single()

    if (txnError) {
      throw new Error(`Failed to create transaction: ${txnError.message}`)
    }

    // 3. Update balance
    const { error: updateError } = await supabase
      .from('organization_credits')
      .update({
        balance: balance_after,
        updated_at: new Date().toISOString(),
      })
      .eq('organization_id', params.organization_id)

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
 * @example
 * ```typescript
 * const balance = await getCreditBalance(org.id)
 * console.log(`Available credits: ${balance.balance}`)
 * ```
 */
export async function getCreditBalance(organization_id: string): Promise<{
  balance: number
  total_allocated: number
  total_consumed: number
  low_balance_threshold: number
  is_low_balance: boolean
}> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('organization_credits')
    .select('*')
    .eq('organization_id', organization_id)
    .single()

  if (error || !data) {
    throw new Error(`Failed to fetch credit balance: ${error?.message}`)
  }

  return {
    balance: data.balance,
    total_allocated: data.total_allocated,
    total_consumed: data.total_consumed,
    low_balance_threshold: data.low_balance_threshold,
    is_low_balance: data.balance <= data.low_balance_threshold,
  }
}
