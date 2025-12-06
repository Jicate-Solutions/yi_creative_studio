import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'
import {
  Images,
  Coins,
  ArrowRight,
  TrendingUp,
  Clock,
} from 'lucide-react'
import { ROUTES } from '@/lib/config/constants'
import { CreateButton } from '@/components/dashboard/create-button'

export const metadata = {
  title: 'Dashboard',
}

async function DashboardStats() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Get user's organization
  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id, organizations(*)')
    .eq('user_id', user.id)
    .single()

  if (!membership) return null

  const org = membership.organizations as {
    id: string
    name: string
    credits_balance: number
  }

  // Calculate start of month for monthly query
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  // PERFORMANCE: Execute all queries in parallel instead of sequentially
  // This reduces ~400-800ms to ~100-200ms
  const [creativeCountResult, recentCreativesResult, monthlyTransactionsResult] = await Promise.all([
    // Get creative count
    supabase
      .from('creatives')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', org.id),

    // Get recent creatives
    supabase
      .from('creatives')
      .select('*')
      .eq('organization_id', org.id)
      .order('created_at', { ascending: false })
      .limit(4),

    // Get this month's credits used
    supabase
      .from('credit_transactions')
      .select('amount')
      .eq('organization_id', org.id)
      .eq('type', 'usage')
      .gte('created_at', startOfMonth.toISOString())
  ])

  const creativeCount = creativeCountResult.count
  const recentCreatives = recentCreativesResult.data
  const monthlyTransactions = monthlyTransactionsResult.data

  const monthlyCreditsUsed = monthlyTransactions?.reduce(
    (sum, t) => sum + Math.abs(t.amount),
    0
  ) ?? 0

  return (
    <>
      {/* Stats Cards - 2 columns on mobile for better density */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Credits Balance</CardTitle>
            <Coins className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{org.credits_balance.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <Link href={ROUTES.billing} className="text-primary hover:underline">
                Buy more credits
              </Link>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Creatives</CardTitle>
            <Images className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{creativeCount ?? 0}</div>
            <p className="text-xs text-muted-foreground">
              All time generations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{monthlyCreditsUsed}</div>
            <p className="text-xs text-muted-foreground">
              Credits used this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Generation</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">~30s</div>
            <p className="text-xs text-muted-foreground">
              Per creative
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Quick Start</CardTitle>
            <CardDescription>
              Create a new brand creative in just a few clicks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
              <CreateButton variant="large" />
              <Button asChild variant="outline" size="lg" className="h-auto py-6">
                <Link href={ROUTES.gallery} className="flex flex-col items-center gap-2">
                  <Images className="h-8 w-8" />
                  <span className="font-semibold">View Gallery</span>
                  <span className="text-xs text-muted-foreground">Browse creatives</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest creatives</CardDescription>
          </CardHeader>
          <CardContent>
            {recentCreatives && recentCreatives.length > 0 ? (
              <div className="space-y-3">
                {recentCreatives.map((creative) => (
                  <div
                    key={creative.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="truncate">
                      <span className="font-medium">{creative.title || 'Untitled'}</span>
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {creative.vertical || creative.creative_type}
                      </Badge>
                    </div>
                  </div>
                ))}
                <Button asChild variant="ghost" size="sm" className="w-full mt-2">
                  <Link href={ROUTES.gallery}>
                    View all
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <p className="text-sm">No creatives yet</p>
                <Button asChild variant="link" size="sm">
                  <Link href={ROUTES.create}>Create your first one</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}

function StatsLoading() {
  return (
    <>
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-1" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
            </div>
          </CardContent>
        </Card>
        <Skeleton className="h-64" />
      </div>
    </>
  )
}

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here&apos;s an overview of your creative studio.
        </p>
      </div>

      {/* Stats & Content */}
      <Suspense fallback={<StatsLoading />}>
        <DashboardStats />
      </Suspense>
    </div>
  )
}
