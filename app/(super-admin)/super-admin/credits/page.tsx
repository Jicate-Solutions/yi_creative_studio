/**
 * Super Admin Credits Page
 * Manage credit allocation and view usage analytics
 */

import CreditAllocationForm from '@/components/super-admin/CreditAllocationForm'
import BulkCreditAllocationForm from '@/components/super-admin/BulkCreditAllocationForm'
import TransactionHistoryTable from '@/components/super-admin/TransactionHistoryTable'
import CreditAnalyticsDashboard from '@/components/super-admin/CreditAnalyticsDashboard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function CreditsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Credit Management</h1>
        <p className="text-gray-600 mt-2">Allocate credits and monitor platform usage</p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="allocate" className="space-y-6">
        <TabsList>
          <TabsTrigger value="allocate">Single Allocation</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Allocation</TabsTrigger>
          <TabsTrigger value="transactions">Transaction History</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Single Allocation Tab */}
        <TabsContent value="allocate" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Single Organization Allocation</CardTitle>
              <CardDescription>
                Allocate credits to a single organization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CreditAllocationForm />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bulk Allocation Tab */}
        <TabsContent value="bulk" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Bulk Credit Allocation</CardTitle>
              <CardDescription>
                Allocate credits to multiple organizations at once
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BulkCreditAllocationForm />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transaction History Tab */}
        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>
                View all credit allocations, consumptions, and refunds
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TransactionHistoryTable />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <CreditAnalyticsDashboard />
        </TabsContent>
      </Tabs>
    </div>
  )
}
