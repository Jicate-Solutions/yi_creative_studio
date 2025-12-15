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
  Sparkles,
} from 'lucide-react'
import { ROUTES } from '@/lib/config/constants'
import { CreateButton } from '@/components/dashboard/create-button'

export const metadata = {
  title: 'Dashboard',
}

// Premium Stat Card Component
function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = 'gradient',
  link,
}: {
  title: string
  value: string | number
  subtitle: string
  icon: React.ElementType
  iconColor?: 'gradient' | 'yellow' | 'green' | 'muted'
  link?: { href: string; text: string }
}) {
  const iconContainerClass = iconColor === 'gradient'
    ? 'gradient-yi shadow-[0_4px_14px_rgba(0,91,150,0.25)]'
    : iconColor === 'yellow'
    ? 'bg-gradient-to-br from-amber-400 to-yellow-500 shadow-[0_4px_14px_rgba(245,158,11,0.25)]'
    : iconColor === 'green'
    ? 'bg-gradient-to-br from-emerald-400 to-green-500 shadow-[0_4px_14px_rgba(16,185,129,0.25)]'
    : 'bg-gradient-to-br from-slate-400 to-slate-500 shadow-[0_4px_14px_rgba(100,116,139,0.2)]'

  return (
    <div className="glass-premium rounded-2xl p-5 md:p-6 hover-lift transition-all duration-300 group">
      {/* Icon with gradient background */}
      <div className={`w-11 h-11 md:w-12 md:h-12 rounded-xl ${iconContainerClass} flex items-center justify-center transition-transform duration-300 group-hover:scale-105`}>
        <Icon className="h-5 w-5 md:h-6 md:w-6 text-white" />
      </div>

      {/* Stats */}
      <div className="mt-4">
        <p className="text-xs md:text-sm text-muted-foreground font-medium tracking-wide uppercase">
          {title}
        </p>
        <p className="text-2xl md:text-3xl font-bold text-gradient-yi mt-1">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </p>
        {link ? (
          <Link
            href={link.href}
            className="text-xs text-primary hover:underline mt-1 inline-block transition-colors"
          >
            {link.text}
          </Link>
        ) : (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
      </div>
    </div>
  )
}

// Helper to add timeout to promises
function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms))
  ])
}

// Error fallback when database is slow/unavailable
function DashboardStatsError({ message }: { message: string }) {
  return (
    <div className="glass-card rounded-2xl p-8 text-center">
      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/30 dark:to-amber-800/30 flex items-center justify-center">
        <Clock className="h-8 w-8 text-amber-600 dark:text-amber-400" />
      </div>
      <h3 className="text-lg font-semibold mb-2">Loading slowly...</h3>
      <p className="text-sm text-muted-foreground mb-4">{message}</p>
      <Button asChild variant="outline" size="sm">
        <Link href={ROUTES.create}>Create New Creative</Link>
      </Button>
    </div>
  )
}

async function DashboardStats() {
  console.log('[DashboardStats] Starting render...')

  try {
    console.log('[DashboardStats] Creating Supabase client...')
    const supabase = await createClient()
    console.log('[DashboardStats] Client created successfully')

    // Add timeout to auth check - if DB is slow, fail gracefully
    console.log('[DashboardStats] Fetching user auth...')
    const authResult = await withTimeout(
      supabase.auth.getUser(),
      3000,
      { data: { user: null }, error: null } as unknown as Awaited<ReturnType<typeof supabase.auth.getUser>>
    )
    console.log('[DashboardStats] Auth result:', authResult.data?.user ? `User: ${authResult.data.user.id}` : 'No user (timeout or error)')
    const user = authResult.data?.user

    if (!user) {
      console.log('[DashboardStats] No user found - returning error state')
      return <DashboardStatsError message="Unable to load user data" />
    }

    // Get user's organization with timeout
    console.log('[DashboardStats] Fetching organization...')
    const orgQuery = supabase
      .from('organization_members')
      .select('organization_id, organizations(*)')
      .eq('user_id', user.id)
      .single()
    const membershipResult = await withTimeout(
      Promise.resolve(orgQuery),
      3000,
      { data: null, error: null } as unknown as Awaited<typeof orgQuery>
    )
    console.log('[DashboardStats] Org result:', membershipResult.data ? 'Found' : 'Not found (timeout or error)')

    if (!membershipResult.data) {
      console.log('[DashboardStats] No organization - returning error state')
      return <DashboardStatsError message="Unable to load organization" />
    }

    const org = membershipResult.data.organizations as {
      id: string
      name: string
      credits_balance: number
    }
    console.log('[DashboardStats] Organization:', org.name)

    // Calculate start of month for monthly query
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    // PERFORMANCE: Execute all queries in parallel with timeout
    // If DB is overloaded, show partial data instead of hanging
    console.log('[DashboardStats] Fetching stats in parallel...')
    const countQuery = supabase
      .from('creatives')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', org.id)
    const recentQuery = supabase
      .from('creatives')
      .select('id, title, vertical, creative_type, created_at')
      .eq('organization_id', org.id)
      .order('created_at', { ascending: false })
      .limit(4)
    const transactionsQuery = supabase
      .from('credit_transactions')
      .select('amount')
      .eq('organization_id', org.id)
      .eq('type', 'usage')
      .gte('created_at', startOfMonth.toISOString())
      .limit(100)

    const [creativeCountResult, recentCreativesResult, monthlyTransactionsResult] = await Promise.all([
      // Get creative count
      withTimeout(
        Promise.resolve(countQuery),
        3000,
        { count: null, error: null } as unknown as Awaited<typeof countQuery>
      ),

      // Get recent creatives - exclude large fields
      withTimeout(
        Promise.resolve(recentQuery),
        3000,
        { data: [], error: null } as unknown as Awaited<typeof recentQuery>
      ),

      // Get this month's credits used
      withTimeout(
        Promise.resolve(transactionsQuery),
        3000,
        { data: [], error: null } as unknown as Awaited<typeof transactionsQuery>
      )
    ])
    console.log('[DashboardStats] All stats fetched successfully')

    const creativeCount = creativeCountResult.count
    const recentCreatives = recentCreativesResult.data
    const monthlyTransactions = monthlyTransactionsResult.data

    const monthlyCreditsUsed = monthlyTransactions?.reduce(
      (sum, t) => sum + Math.abs(t.amount),
      0
    ) ?? 0

    console.log('[DashboardStats] Data processed - creatives:', creativeCount, 'recent:', recentCreatives?.length, 'monthly usage:', monthlyCreditsUsed)

  return (
    <>
      {/* Stats Cards - Premium Glass with Stagger Animation */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 stagger-children">
        <StatCard
          title="Credits Balance"
          value={org.credits_balance}
          subtitle="Available credits"
          icon={Coins}
          iconColor="yellow"
          link={{ href: ROUTES.billing, text: 'Buy more credits →' }}
        />

        <StatCard
          title="Total Creatives"
          value={creativeCount ?? 0}
          subtitle="All time generations"
          icon={Images}
          iconColor="gradient"
        />

        <StatCard
          title="This Month"
          value={monthlyCreditsUsed}
          subtitle="Credits used"
          icon={TrendingUp}
          iconColor="green"
        />

        <StatCard
          title="Avg. Generation"
          value="~30s"
          subtitle="Per creative"
          icon={Clock}
          iconColor="muted"
        />
      </div>

      {/* Quick Actions - Premium Glass Cards */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        {/* Quick Start Card */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-6 md:p-8 transition-all duration-300">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-yi-orange" />
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Quick Start</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Create a new brand creative in just a few clicks
            </p>
          </div>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            <CreateButton variant="large" />
            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-auto py-6 glass-subtle rounded-xl border-0 hover:shadow-[var(--shadow-card-hover)] hover:-translate-y-0.5 transition-all duration-300"
            >
              <Link href={ROUTES.gallery} className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center">
                  <Images className="h-6 w-6 text-slate-600 dark:text-slate-300" />
                </div>
                <span className="font-semibold">View Gallery</span>
                <span className="text-xs text-muted-foreground">Browse creatives</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* Recent Activity Card */}
        <div className="glass-card rounded-2xl p-6 transition-all duration-300">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Recent Activity</h3>
            <p className="text-sm text-muted-foreground">Your latest creatives</p>
          </div>
          {recentCreatives && recentCreatives.length > 0 ? (
            <div className="space-y-3">
              {recentCreatives.map((creative) => (
                <div
                  key={creative.id}
                  className="flex items-center justify-between text-sm p-2 rounded-lg hover:bg-white/50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <div className="truncate">
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {creative.title || 'Untitled'}
                    </span>
                    <Badge variant="secondary" className="ml-2 text-xs bg-primary/10 text-primary border-0">
                      {creative.vertical || creative.creative_type}
                    </Badge>
                  </div>
                </div>
              ))}
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="w-full mt-2 hover:bg-primary/5 hover:text-primary transition-colors"
              >
                <Link href={ROUTES.gallery}>
                  View all
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center">
                <Images className="h-8 w-8 text-slate-400" />
              </div>
              <p className="text-sm mb-2">No creatives yet</p>
              <Button asChild variant="link" size="sm" className="text-primary">
                <Link href={ROUTES.create}>Create your first one →</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  )
  } catch (error) {
    console.error('[DashboardStats] Unexpected error:', error)
    return <DashboardStatsError message="An unexpected error occurred" />
  }
}

function StatsLoading() {
  return (
    <>
      {/* Premium Glass Skeleton Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="glass-premium rounded-2xl p-5 md:p-6">
            <Skeleton className="h-11 w-11 md:h-12 md:w-12 rounded-xl" />
            <div className="mt-4 space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-3 w-28" />
            </div>
          </div>
        ))}
      </div>

      {/* Premium Glass Quick Actions Skeleton */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        <div className="lg:col-span-2 glass-card rounded-2xl p-6 md:p-8">
          <div className="mb-6 space-y-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
          </div>
        </div>
        <div className="glass-card rounded-2xl p-6">
          <div className="mb-4 space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

export default function DashboardPage() {
  return (
    <div className="space-y-6 md:space-y-8">
      {/* Premium Page Header */}
      <div className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gradient-yi">
          Dashboard
        </h1>
        <p className="text-muted-foreground text-sm md:text-base">
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
