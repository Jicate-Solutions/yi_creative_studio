'use client'

/**
 * Credit Allocation Form Component
 * Form for Super Admins to manually allocate credits to organizations
 */

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Check, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

interface Organization {
  id: string
  name: string
  credit_balance: number
}

export default function CreditAllocationForm() {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [selectedOrgId, setSelectedOrgId] = useState('')
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [referenceType, setReferenceType] = useState('manual_allocation')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchOrganizations()
  }, [])

  async function fetchOrganizations() {
    try {
      const response = await fetch('/api/super-admin/organizations/list?pageSize=100')
      const data = await response.json()
      if (data.success) {
        setOrganizations(data.organizations)
      }
    } catch (err) {
      console.error('Failed to fetch organizations:', err)
      toast.error('Failed to load organizations. Please refresh the page.')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setSuccess(false)
    setError('')

    try {
      const response = await fetch('/api/super-admin/credits/allocate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_id: selectedOrgId,
          amount: parseInt(amount),
          reason,
          reference_type: referenceType,
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setSuccess(true)
        setAmount('')
        setReason('')
        setSelectedOrgId('')
        // Refresh organizations to show updated balance
        fetchOrganizations()
      } else {
        setError(data.error || 'Failed to allocate credits')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const selectedOrg = organizations.find((org) => org.id === selectedOrgId)

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Success Alert */}
      {success && (
        <Alert className="bg-green-50 border-green-200">
          <Check className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Credits allocated successfully!
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

      {/* Organization Select */}
      <div className="space-y-2">
        <Label htmlFor="organization">Organization</Label>
        <Select value={selectedOrgId} onValueChange={setSelectedOrgId}>
          <SelectTrigger id="organization">
            <SelectValue placeholder="Select an organization" />
          </SelectTrigger>
          <SelectContent>
            {organizations.map((org) => (
              <SelectItem key={org.id} value={org.id}>
                {org.name} (Balance: {org.credit_balance?.toLocaleString() || 0})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedOrg && (
          <p className="text-sm text-gray-500">
            Current balance: <span className="font-semibold">{selectedOrg.credit_balance?.toLocaleString() || 0}</span> credits
          </p>
        )}
      </div>

      {/* Amount Input */}
      <div className="space-y-2">
        <Label htmlFor="amount">Amount</Label>
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
        <p className="text-xs text-gray-500">Number of credits to allocate</p>
      </div>

      {/* Reference Type */}
      <div className="space-y-2">
        <Label htmlFor="type">Allocation Type</Label>
        <Select value={referenceType} onValueChange={setReferenceType}>
          <SelectTrigger id="type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="manual_allocation">Manual Allocation</SelectItem>
            <SelectItem value="bonus">Bonus Credits</SelectItem>
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
        <p className="text-xs text-gray-500">This will be recorded in the audit log</p>
      </div>

      {/* Submit Button */}
      <Button type="submit" disabled={loading || !selectedOrgId || !amount || !reason} className="w-full">
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Allocating...
          </>
        ) : (
          'Allocate Credits'
        )}
      </Button>
    </form>
  )
}
