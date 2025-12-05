'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import { useOrganization } from './use-organization'
import type { CreditTransaction } from '@/types/database.types'
import { toast } from 'sonner'

export function useCredits() {
  // Memoize supabase client to prevent infinite refetch loops
  const supabase = useMemo(() => createClient(), [])
  const { currentOrganization } = useAuthStore()
  const { refreshOrganization, creditsBalance, canAfford } = useOrganization()
  const [transactions, setTransactions] = useState<CreditTransaction[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const fetchTransactions = useCallback(async (limit = 20) => {
    if (!currentOrganization?.id) return

    setIsLoading(true)
    const { data, error } = await supabase
      .from('credit_transactions')
      .select('*')
      .eq('organization_id', currentOrganization.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    setIsLoading(false)

    if (error) {
      console.error('Error fetching transactions:', error)
      return
    }

    setTransactions(data || [])
  }, [currentOrganization?.id, supabase])

  const deductCredits = useCallback(async (
    amount: number,
    description?: string,
    creativeId?: string
  ) => {
    if (!currentOrganization?.id) {
      toast.error('No organization selected')
      return null
    }

    if (!canAfford(amount)) {
      toast.error('Insufficient credits')
      return null
    }

    const { data, error } = await supabase.rpc('deduct_credits', {
      p_organization_id: currentOrganization.id,
      p_amount: amount,
      p_description: description,
      p_creative_id: creativeId,
    })

    if (error || !data?.[0]?.success) {
      toast.error(data?.[0]?.error_message || 'Failed to deduct credits')
      return null
    }

    await refreshOrganization()
    return data[0]
  }, [currentOrganization?.id, canAfford, supabase, refreshOrganization])

  const addCredits = useCallback(async (
    amount: number,
    amountINR: number,
    paymentId: string,
    description?: string
  ) => {
    if (!currentOrganization?.id) {
      toast.error('No organization selected')
      return null
    }

    const { data, error } = await supabase.rpc('add_credits', {
      p_organization_id: currentOrganization.id,
      p_amount: amount,
      p_amount_inr: amountINR,
      p_payment_id: paymentId,
      p_description: description || 'Credit purchase',
    })

    if (error || !data?.[0]?.success) {
      toast.error('Failed to add credits')
      return null
    }

    await refreshOrganization()
    await fetchTransactions()
    toast.success(`${amount} credits added successfully`)
    return data[0]
  }, [currentOrganization?.id, supabase, refreshOrganization, fetchTransactions])

  // Fetch transactions on mount only if not already loaded
  // Guard prevents infinite loops when fetchTransactions changes reference
  useEffect(() => {
    if (transactions.length === 0) {
      fetchTransactions()
    }
  }, [fetchTransactions, transactions.length])

  return {
    balance: creditsBalance,
    transactions,
    isLoading,
    canAfford,
    deductCredits,
    addCredits,
    fetchTransactions,
    refreshBalance: refreshOrganization,
  }
}
