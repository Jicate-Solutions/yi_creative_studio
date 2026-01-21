/**
 * Super Admin API: Export Credit Transactions
 * GET /api/super-admin/credits/transactions/export
 *
 * Export credit transactions data in CSV or JSON format
 */

import { NextRequest, NextResponse } from 'next/server'
import { superAdminGuard } from '@/lib/middleware/super-admin-guard'

export async function GET(request: NextRequest) {
  return superAdminGuard(request, async (req, { adminClient }) => {
    const supabase = adminClient

    try {
      const { searchParams } = new URL(req.url)
      const format = searchParams.get('format') || 'csv'
      const columnsParam = searchParams.get('columns') || ''
      const type = searchParams.get('type') || ''
      const orgId = searchParams.get('organization_id') || ''
      const startDate = searchParams.get('start_date') || ''
      const endDate = searchParams.get('end_date') || ''

      // Define all available columns
      const allColumns = [
        'id',
        'organization_name',
        'type',
        'amount',
        'balance_after',
        'description',
        'performed_by_name',
        'created_at',
      ]

      // Parse requested columns
      const requestedColumns = columnsParam
        ? columnsParam.split(',').filter((c) => allColumns.includes(c))
        : allColumns

      if (requestedColumns.length === 0) {
        return NextResponse.json({ error: 'No valid columns specified' }, { status: 400 })
      }

      // Build query with joins
      let query = supabase.from('credit_transactions').select(`
        id,
        type,
        amount,
        balance_after,
        description,
        created_at,
        user_id,
        organization:organizations(name)
      `)

      // Apply filters
      if (type && ['bonus', 'purchase', 'generation', 'refund', 'adjustment'].includes(type)) {
        query = query.eq('type', type)
      }

      if (orgId) {
        query = query.eq('organization_id', orgId)
      }

      if (startDate) {
        query = query.gte('created_at', startDate)
      }

      if (endDate) {
        query = query.lte('created_at', endDate)
      }

      const { data: transactions, error } = await query.order('created_at', { ascending: false })

      if (error) {
        console.error('[transactions-export] Failed to fetch transactions:', error)
        throw new Error('Failed to fetch transactions')
      }

      // Transform data to flat structure
      const exportData = (transactions || []).map((txn) => {
        return {
          id: txn.id,
          organization_name: txn.organization?.name || 'Unknown',
          type: txn.type,
          amount: txn.amount,
          balance_after: txn.balance_after,
          description: txn.description || '',
          performed_by_name: txn.user_id || 'System',
          created_at: txn.created_at ? new Date(txn.created_at).toISOString() : '',
        }
      })

      // Filter to requested columns
      const filteredData = exportData.map((row) => {
        const filtered: Record<string, unknown> = {}
        requestedColumns.forEach((col) => {
          filtered[col] = row[col as keyof typeof row]
        })
        return filtered
      })

      if (format === 'json') {
        return NextResponse.json(filteredData, {
          headers: {
            'Content-Disposition': `attachment; filename="transactions_export.json"`,
          },
        })
      }

      // CSV format
      const header = requestedColumns.join(',')
      const rows = filteredData.map((row) =>
        requestedColumns
          .map((col) => {
            const value = row[col]
            if (value === null || value === undefined) return ''
            const str = String(value)
            if (str.includes(',') || str.includes('\n') || str.includes('"')) {
              return `"${str.replace(/"/g, '""')}"`
            }
            return str
          })
          .join(',')
      )
      const csv = [header, ...rows].join('\n')

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="transactions_export.csv"`,
        },
      })
    } catch (error) {
      console.error('[transactions-export] Export failed:', error)
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Export failed' },
        { status: 500 }
      )
    }
  })
}
