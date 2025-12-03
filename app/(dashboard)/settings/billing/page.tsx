'use client'

import { useState } from 'react'
import { useCredits, useOrganization } from '@/hooks'
import { useAuthStore } from '@/stores/auth-store'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import {
  Coins,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Plus,
  ArrowUpRight,
  Loader2,
  Check,
  ExternalLink,
} from 'lucide-react'
import { CREDIT_PACKAGES } from '@/lib/config/constants'
import { format } from 'date-fns'

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance
  }
}

interface RazorpayOptions {
  key: string
  amount: number
  currency: string
  name: string
  description: string
  order_id?: string
  handler: (response: RazorpayResponse) => void
  prefill: {
    name?: string
    email?: string
  }
  theme: {
    color: string
  }
}

interface RazorpayInstance {
  open: () => void
}

interface RazorpayResponse {
  razorpay_payment_id: string
  razorpay_order_id?: string
  razorpay_signature?: string
}

export default function BillingPage() {
  const { balance, transactions, isLoading, addCredits, fetchTransactions } = useCredits()
  const { organization } = useOrganization()
  const { canManage, profile, user } = useAuthStore()
  const isAdmin = canManage()

  const [purchasingPackage, setPurchasingPackage] = useState<string | null>(null)

  const handlePurchase = async (packageId: string) => {
    if (!isAdmin) {
      toast.error('Only admins can purchase credits')
      return
    }

    const pkg = CREDIT_PACKAGES.find((p) => p.id === packageId)
    if (!pkg) return

    setPurchasingPackage(packageId)

    try {
      // In production, create order via API
      // For now, simulate with Razorpay client-side
      const options: RazorpayOptions = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_placeholder',
        amount: pkg.priceINR * 100, // Razorpay expects paise
        currency: 'INR',
        name: 'Yi CreativeStudio',
        description: `${pkg.credits} Credits - ${pkg.name}`,
        handler: async function (response: RazorpayResponse) {
          // Add credits after successful payment
          const result = await addCredits(
            pkg.credits,
            pkg.priceINR,
            response.razorpay_payment_id,
            `${pkg.name} purchase`
          )

          if (result) {
            toast.success(`Successfully purchased ${pkg.credits} credits!`)
          }
          setPurchasingPackage(null)
        },
        prefill: {
          name: profile?.full_name || '',
          email: user?.email || '',
        },
        theme: {
          color: '#005B96',
        },
      }

      // Check if Razorpay is loaded
      if (typeof window !== 'undefined' && window.Razorpay) {
        const razorpay = new window.Razorpay(options)
        razorpay.open()
      } else {
        // Fallback: simulate purchase for demo
        toast.info('Razorpay not configured. Simulating purchase...')
        await new Promise((resolve) => setTimeout(resolve, 1500))

        const result = await addCredits(
          pkg.credits,
          pkg.priceINR,
          `demo_${Date.now()}`,
          `${pkg.name} purchase (demo)`
        )

        if (result) {
          toast.success(`Demo: Added ${pkg.credits} credits!`)
        }
        setPurchasingPackage(null)
      }
    } catch (error) {
      console.error('Purchase error:', error)
      toast.error('Failed to process payment')
      setPurchasingPackage(null)
    }
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'purchase':
        return <TrendingUp className="h-4 w-4 text-green-500" />
      case 'usage':
        return <TrendingDown className="h-4 w-4 text-orange-500" />
      case 'refund':
        return <TrendingUp className="h-4 w-4 text-blue-500" />
      default:
        return <Coins className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Billing & Credits</h1>
        <p className="text-muted-foreground">
          Manage your credit balance and view transaction history
        </p>
      </div>

      {/* Balance Card */}
      <Card className="bg-gradient-to-br from-primary/10 to-secondary/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-yellow-500" />
            Credit Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-bold">{balance.toLocaleString()}</span>
            <span className="text-xl text-muted-foreground">credits</span>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Each creative generation costs 1-2 credits depending on the AI model
          </p>
        </CardContent>
      </Card>

      {/* Credit Packages */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Buy Credits</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {CREDIT_PACKAGES.map((pkg) => (
            <Card
              key={pkg.id}
              className={`relative ${pkg.popular ? 'border-2 border-primary' : ''}`}
            >
              {pkg.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="gradient-yi text-white">Most Popular</Badge>
                </div>
              )}

              <CardHeader className="text-center pb-2">
                <CardTitle className="text-lg">{pkg.name}</CardTitle>
                <CardDescription>{pkg.credits.toLocaleString()} credits</CardDescription>
              </CardHeader>

              <CardContent className="text-center pb-4">
                <div className="mb-2">
                  <span className="text-3xl font-bold">
                    ₹{pkg.priceINR.toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  ₹{(pkg.priceINR / pkg.credits).toFixed(2)} per credit
                </p>
              </CardContent>

              <CardFooter>
                {isAdmin ? (
                  <Button
                    className={`w-full ${pkg.popular ? 'gradient-yi hover:opacity-90' : ''}`}
                    variant={pkg.popular ? 'default' : 'outline'}
                    onClick={() => handlePurchase(pkg.id)}
                    disabled={purchasingPackage === pkg.id}
                  >
                    {purchasingPackage === pkg.id ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Plus className="h-4 w-4 mr-2" />
                    )}
                    Buy Now
                  </Button>
                ) : (
                  <Button className="w-full" variant="outline" disabled>
                    Admin Only
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Transaction History
          </CardTitle>
          <CardDescription>
            Recent credit transactions for your organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Coins className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No transactions yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getTransactionIcon(tx.type)}
                        <span className="capitalize">{tx.type}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {tx.description || '-'}
                    </TableCell>
                    <TableCell>
                      <span
                        className={
                          tx.amount > 0 ? 'text-green-600' : 'text-orange-600'
                        }
                      >
                        {tx.amount > 0 ? '+' : ''}
                        {tx.amount}
                      </span>
                    </TableCell>
                    <TableCell>{tx.balance_after}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(tx.created_at), 'MMM d, yyyy')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
