'use client'

/**
 * Bulk Credit Allocation Form Component
 * Form for Super Admins to allocate credits to multiple organizations at once
 */

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Loader2, Check, AlertCircle, Search, X, AlertTriangle } from 'lucide-react'

interface Organization {
  id: string
  name: string
  credit_balance: number
}

interface AllocationResult {
  organization_id: string
  organization_name?: string
  success: boolean
  new_balance?: number
  error?: string
}

export default function BulkCreditAllocationForm() {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [selectedOrgIds, setSelectedOrgIds] = useState<Set<string>>(new Set())
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [referenceType, setReferenceType] = useState('bonus')
  const [loading, setLoading] = useState(false)
  const [loadingOrgs, setLoadingOrgs] = useState(true)
  const [results, setResults] = useState<AllocationResult[] | null>(null)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [showLowCreditOnly, setShowLowCreditOnly] = useState(false)

  useEffect(() => {
    fetchOrganizations()
  }, [])

  async function fetchOrganizations() {
    setLoadingOrgs(true)
    try {
      const response = await fetch('/api/super-admin/organizations/list?pageSize=200')
      const data = await response.json()
      if (data.success) {
        setOrganizations(data.organizations)
      }
    } catch (err) {
      console.error('Failed to fetch organizations:', err)
    } finally {
      setLoadingOrgs(false)
    }
  }

  const filteredOrgs = organizations.filter((org) => {
    const matchesSearch = org.name.toLowerCase().includes(search.toLowerCase())
    const matchesLowCredit = showLowCreditOnly ? (org.credit_balance || 0) < 10 : true
    return matchesSearch && matchesLowCredit
  })

  const lowCreditOrgs = organizations.filter((org) => (org.credit_balance || 0) < 10)

  function toggleOrg(orgId: string) {
    const newSet = new Set(selectedOrgIds)
    if (newSet.has(orgId)) {
      newSet.delete(orgId)
    } else {
      newSet.add(orgId)
    }
    setSelectedOrgIds(newSet)
  }

  function selectAll() {
    const allFiltered = new Set(filteredOrgs.map((o) => o.id))
    setSelectedOrgIds(allFiltered)
  }

  function selectLowCredit() {
    const lowCredit = new Set(lowCreditOrgs.map((o) => o.id))
    setSelectedOrgIds(lowCredit)
  }

  function clearSelection() {
    setSelectedOrgIds(new Set())
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (selectedOrgIds.size === 0) {
      setError('Please select at least one organization')
      return
    }

    setLoading(true)
    setResults(null)
    setError('')

    try {
      const response = await fetch('/api/super-admin/credits/bulk-allocate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_ids: Array.from(selectedOrgIds),
          amount: parseInt(amount),
          reason,
          reference_type: referenceType,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setResults(data.results)
        if (data.success) {
          setAmount('')
          setReason('')
          setSelectedOrgIds(new Set())
          // Refresh organizations to show updated balances
          fetchOrganizations()
        }
      } else {
        setError(data.error || 'Failed to allocate credits')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const selectedOrgs = organizations.filter((o) => selectedOrgIds.has(o.id))
  const totalAmount = parseInt(amount || '0') * selectedOrgIds.size

  return (
    <div className="space-y-6">
      {/* Results Summary */}
      {results && (
        <Alert className={results.every((r) => r.success) ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}>
          <Check className={`h-4 w-4 ${results.every((r) => r.success) ? 'text-green-600' : 'text-amber-600'}`} />
          <AlertDescription>
            <div className="space-y-2">
              <p className={results.every((r) => r.success) ? 'text-green-800' : 'text-amber-800'}>
                {results.filter((r) => r.success).length} of {results.length} allocations successful
              </p>
              <div className="text-sm space-y-1">
                {results.map((r) => (
                  <div key={r.organization_id} className="flex items-center gap-2">
                    {r.success ? (
                      <Check className="h-3 w-3 text-green-600" />
                    ) : (
                      <X className="h-3 w-3 text-red-600" />
                    )}
                    <span className={r.success ? 'text-green-700' : 'text-red-700'}>
                      {r.organization_name}: {r.success ? `New balance: ${r.new_balance}` : r.error}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Error Alert */}
      {error && (
        <Alert className="bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Organization Selection */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Select Organizations</Label>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={selectAll}>
                Select Visible
              </Button>
              {lowCreditOrgs.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={selectLowCredit}
                  className="text-orange-600 border-orange-200 hover:bg-orange-50"
                >
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Select Low Credit ({lowCreditOrgs.length})
                </Button>
              )}
              {selectedOrgIds.size > 0 && (
                <Button type="button" variant="ghost" size="sm" onClick={clearSelection}>
                  Clear ({selectedOrgIds.size})
                </Button>
              )}
            </div>
          </div>

          {/* Search & Filter */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search organizations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="lowCredit"
                checked={showLowCreditOnly}
                onCheckedChange={(checked) => setShowLowCreditOnly(checked === true)}
              />
              <Label htmlFor="lowCredit" className="text-sm cursor-pointer">
                Low credit only (&lt;10)
              </Label>
            </div>
          </div>

          {/* Organization List */}
          <div className="border rounded-lg max-h-64 overflow-y-auto">
            {loadingOrgs ? (
              <div className="p-4 text-center text-gray-500">
                <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                Loading organizations...
              </div>
            ) : filteredOrgs.length === 0 ? (
              <div className="p-4 text-center text-gray-500">No organizations found</div>
            ) : (
              <div className="divide-y">
                {filteredOrgs.map((org) => (
                  <label
                    key={org.id}
                    className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 ${
                      selectedOrgIds.has(org.id) ? 'bg-blue-50' : ''
                    }`}
                  >
                    <Checkbox
                      checked={selectedOrgIds.has(org.id)}
                      onCheckedChange={() => toggleOrg(org.id)}
                    />
                    <div className="flex-1">
                      <span className="font-medium">{org.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {(org.credit_balance || 0) < 10 && (
                        <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50">
                          Low
                        </Badge>
                      )}
                      <span className="text-sm text-gray-500">
                        {(org.credit_balance || 0).toLocaleString()} credits
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Selection Summary */}
          {selectedOrgIds.size > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <span className="font-semibold">{selectedOrgIds.size}</span> organization
                {selectedOrgIds.size !== 1 ? 's' : ''} selected
              </p>
              <div className="flex flex-wrap gap-1 mt-2">
                {selectedOrgs.slice(0, 5).map((org) => (
                  <Badge key={org.id} variant="secondary" className="text-xs">
                    {org.name}
                  </Badge>
                ))}
                {selectedOrgs.length > 5 && (
                  <Badge variant="secondary" className="text-xs">
                    +{selectedOrgs.length - 5} more
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Amount Input */}
        <div className="space-y-2">
          <Label htmlFor="amount">Credits Per Organization</Label>
          <Input
            id="amount"
            type="number"
            min="1"
            step="1"
            placeholder="Enter credit amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
          {selectedOrgIds.size > 0 && amount && (
            <p className="text-sm text-gray-500">
              Total: <span className="font-semibold">{totalAmount.toLocaleString()}</span> credits across{' '}
              {selectedOrgIds.size} organization{selectedOrgIds.size !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* Reference Type */}
        <div className="space-y-2">
          <Label htmlFor="type">Allocation Type</Label>
          <Select value={referenceType} onValueChange={setReferenceType}>
            <SelectTrigger id="type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bonus">Bonus Credits</SelectItem>
              <SelectItem value="manual_allocation">Manual Allocation</SelectItem>
              <SelectItem value="adjustment">Balance Adjustment</SelectItem>
              <SelectItem value="subscription_renewal">Subscription Renewal</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Reason Textarea */}
        <div className="space-y-2">
          <Label htmlFor="reason">Reason</Label>
          <Textarea
            id="reason"
            placeholder="Explain why these credits are being allocated..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            required
          />
          <p className="text-xs text-gray-500">This will be recorded in the audit log for all allocations</p>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={loading || selectedOrgIds.size === 0 || !amount || !reason}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Allocating to {selectedOrgIds.size} organization{selectedOrgIds.size !== 1 ? 's' : ''}...
            </>
          ) : (
            <>
              Allocate {amount ? `${parseInt(amount).toLocaleString()} credits each` : 'Credits'} to{' '}
              {selectedOrgIds.size} organization{selectedOrgIds.size !== 1 ? 's' : ''}
            </>
          )}
        </Button>
      </form>
    </div>
  )
}
