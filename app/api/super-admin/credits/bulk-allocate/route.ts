/**
 * Super Admin API: Bulk Allocate Credits
 * POST /api/super-admin/credits/bulk-allocate
 *
 * Allocate credits to multiple organizations at once
 */

import { NextRequest, NextResponse } from 'next/server'
import { superAdminGuard, getRequestMetadata } from '@/lib/middleware/super-admin-guard'
import { allocateCredits } from '@/lib/services/credit-service'

interface AllocationResult {
  organization_id: string
  organization_name?: string
  success: boolean
  new_balance?: number
  transaction_id?: string
  error?: string
}

export async function POST(request: NextRequest) {
  return superAdminGuard(request, async (req, { superAdmin, adminClient }) => {
    const metadata = getRequestMetadata(req)

    try {
      const body = await req.json()
      const { organization_ids, amount, reason, reference_type } = body

      // Validation
      if (!organization_ids || !Array.isArray(organization_ids) || organization_ids.length === 0) {
        return NextResponse.json(
          {
            error: 'Missing required fields',
            details: 'organization_ids must be a non-empty array',
          },
          { status: 400 }
        )
      }

      if (!amount || !reason) {
        return NextResponse.json(
          {
            error: 'Missing required fields',
            details: 'amount and reason are required',
          },
          { status: 400 }
        )
      }

      if (amount <= 0) {
        return NextResponse.json(
          { error: 'Invalid amount', details: 'Amount must be greater than 0' },
          { status: 400 }
        )
      }

      if (organization_ids.length > 100) {
        return NextResponse.json(
          { error: 'Too many organizations', details: 'Maximum 100 organizations per bulk operation' },
          { status: 400 }
        )
      }

      // Fetch organization names for better result reporting
      const { data: orgs } = await adminClient
        .from('organizations')
        .select('id, name')
        .in('id', organization_ids)

      const orgNameMap = new Map(orgs?.map((o) => [o.id, o.name]) || [])

      // Process allocations
      const results: AllocationResult[] = []
      let successCount = 0
      let failCount = 0
      let totalAllocated = 0

      for (const org_id of organization_ids) {
        try {
          const result = await allocateCredits(adminClient, {
            organization_id: org_id,
            amount,
            reason: `[Bulk] ${reason}`,
            allocated_by: superAdmin.id,
            reference_type: reference_type || 'bonus',
            metadata: {
              ...metadata,
              super_admin_email: superAdmin.email,
              bulk_operation: true,
              total_orgs: organization_ids.length,
            },
          })

          results.push({
            organization_id: org_id,
            organization_name: orgNameMap.get(org_id),
            success: true,
            new_balance: result.new_balance,
            transaction_id: result.transaction_id,
          })

          successCount++
          totalAllocated += amount
        } catch (error) {
          results.push({
            organization_id: org_id,
            organization_name: orgNameMap.get(org_id),
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          })
          failCount++
        }
      }

      return NextResponse.json({
        success: failCount === 0,
        message: `Allocated ${amount} credits to ${successCount} organization(s)${failCount > 0 ? `, ${failCount} failed` : ''}`,
        summary: {
          total_organizations: organization_ids.length,
          successful: successCount,
          failed: failCount,
          total_credits_allocated: totalAllocated,
          amount_per_org: amount,
        },
        results,
      })
    } catch (error) {
      console.error('[super-admin] Failed to bulk allocate credits:', error)
      return NextResponse.json(
        {
          error: 'Failed to bulk allocate credits',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      )
    }
  })
}
