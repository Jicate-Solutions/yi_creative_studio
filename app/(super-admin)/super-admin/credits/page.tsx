/**
 * Super Admin Credits Page
 * Manage credit allocation and view usage analytics
 */

import CreditAllocationForm from '@/components/super-admin/CreditAllocationForm'
import TransactionHistoryTable from '@/components/super-admin/TransactionHistoryTable'
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
          <TabsTrigger value="allocate">Allocate Credits</TabsTrigger>
          <TabsTrigger value="transactions">Transaction History</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Allocate Credits Tab */}
        <TabsContent value="allocate" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Allocate Credits</CardTitle>
              <CardDescription>
                Manually add credits to an organization's balance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CreditAllocationForm />
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
          <Card>
            <CardHeader>
              <CardTitle>Credit Analytics</CardTitle>
              <CardDescription>Platform-wide credit usage statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">
                Analytics dashboard will be implemented in Phase 3+
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
