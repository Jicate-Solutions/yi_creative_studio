'use client'

/**
 * Transaction History Table Component
 * Display credit transaction history with filtering
 */

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowUp, ArrowDown } from 'lucide-react'
import { useAutoRefresh } from '@/hooks/use-auto-refresh'
import { RefreshIndicator } from '@/components/super-admin/RefreshIndicator'
import { ExportButton, type ExportColumn } from '@/components/super-admin/ExportButton'
import toast from 'react-hot-toast'

// Export columns definition
const TXN_EXPORT_COLUMNS: ExportColumn[] = [
  { key: 'id', label: 'Transaction ID' },
  { key: 'organization_name', label: 'Organization', selected: true },
  { key: 'type', label: 'Type', selected: true },
  { key: 'amount', label: 'Amount', selected: true },
  { key: 'balance_after', label: 'Balance After', selected: true },
  { key: 'description', label: 'Description', selected: true },
  { key: 'performed_by_name', label: 'Performed By' },
  { key: 'created_at', label: 'Date', selected: true },
]

interface Transaction {
  id: string
  organization_id: string
  organization_name: string
  type: string
  amount: number
  balance_before: number
  balance_after: number
  reason: string
  created_at: string
}

export default function TransactionHistoryTable() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Auto-refresh every 15 seconds (credit transactions are time-sensitive)
  const { isRefreshing, lastRefresh, manualRefresh } = useAutoRefresh({
    onRefresh: fetchTransactions,
    interval: 15000, // 15 seconds
  })

  useEffect(() => {
    fetchTransactions()
  }, [typeFilter, page])

  async function fetchTransactions() {
    setLoading(true)

    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: '50',
      ...(typeFilter !== 'all' && { type: typeFilter }),
    })

    try {
      const response = await fetch(`/api/super-admin/credits/transactions?${params}`)
      const data = await response.json()

      if (data.success) {
        setTransactions(data.transactions)
        setTotalPages(data.pagination.totalPages)
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error)
      toast.error('Failed to load transactions. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function getTypeBadge(type: string) {
    const configs = {
      allocation: { color: 'bg-green-100 text-green-800', label: 'Allocation' },
      manual_allocation: { color: 'bg-green-100 text-green-800', label: 'Manual' },
      consumption: { color: 'bg-blue-100 text-blue-800', label: 'Consumption' },
      refund: { color: 'bg-yellow-100 text-yellow-800', label: 'Refund' },
      adjustment: { color: 'bg-purple-100 text-purple-800', label: 'Adjustment' },
      bonus: { color: 'bg-pink-100 text-pink-800', label: 'Bonus' },
      subscription_renewal: { color: 'bg-indigo-100 text-indigo-800', label: 'Subscription' },
    }

    const config = configs[type as keyof typeof configs] || {
      color: 'bg-gray-100 text-gray-800',
      label: type,
    }

    return <Badge className={config.color}>{config.label}</Badge>
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  function formatAmount(amount: number) {
    const isPositive = amount > 0
    return (
      <div className={`flex items-center gap-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
        <span className="font-medium">{Math.abs(amount).toLocaleString()}</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters - Responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="allocation">Allocation</SelectItem>
            <SelectItem value="manual_allocation">Manual</SelectItem>
            <SelectItem value="consumption">Consumption</SelectItem>
            <SelectItem value="refund">Refund</SelectItem>
            <SelectItem value="bonus">Bonus</SelectItem>
          </SelectContent>
        </Select>

        {/* Export & Auto-refresh */}
        <div className="flex items-center gap-2">
          <ExportButton
            endpoint="/api/super-admin/credits/transactions/export"
            filename="transactions_export"
            columns={TXN_EXPORT_COLUMNS}
            queryParams={{
              type: typeFilter !== 'all' ? typeFilter : '',
            }}
          />
          <RefreshIndicator
            lastRefresh={lastRefresh}
            isRefreshing={isRefreshing}
            onManualRefresh={manualRefresh}
          />
        </div>
      </div>

      {/* Table - Horizontal scroll on mobile */}
      <div className="border rounded-lg overflow-x-auto">
        <Table className="min-w-[700px]">
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Organization</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Balance After</TableHead>
              <TableHead>Reason</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  Loading transactions...
                </TableCell>
              </TableRow>
            ) : transactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  No transactions found
                </TableCell>
              </TableRow>
            ) : (
              transactions.map((txn) => (
                <TableRow key={txn.id}>
                  <TableCell className="text-sm">{formatDate(txn.created_at)}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{txn.organization_name}</div>
                      <div className="text-xs text-gray-500">{txn.organization_id}</div>
                    </div>
                  </TableCell>
                  <TableCell>{getTypeBadge(txn.type)}</TableCell>
                  <TableCell>{formatAmount(txn.amount)}</TableCell>
                  <TableCell>
                    <span className="font-medium">{txn.balance_after.toLocaleString()}</span>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600 max-w-md truncate">
                    {txn.reason}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
