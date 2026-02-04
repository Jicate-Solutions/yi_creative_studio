/**
 * Skeleton Loader Components
 * Professional loading states that show content shape while loading
 */

import { cn } from '@/lib/utils'
import { animation } from '@/lib/design/system'

// Base Skeleton
export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-muted/50',
        className
      )}
      {...props}
    />
  )
}

// Card Skeleton (for gallery, templates)
export function SkeletonCard() {
  return (
    <div className="space-y-4 rounded-xl border border-border/50 p-6">
      <Skeleton className="h-48 w-full rounded-lg" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
    </div>
  )
}

// Table Row Skeleton
export function SkeletonTableRow() {
  return (
    <div className="flex items-center gap-4 border-b border-border/30 py-4">
      <Skeleton className="h-10 w-10 rounded-lg" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="h-8 w-24 rounded-lg" />
    </div>
  )
}

// Form Skeleton
export function SkeletonForm() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      </div>
      <Skeleton className="h-10 w-32 rounded-lg" />
    </div>
  )
}

// Dashboard Stats Skeleton
export function SkeletonStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="rounded-xl border border-border/50 p-6 space-y-4">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      ))}
    </div>
  )
}

// Page Header Skeleton
export function SkeletonPageHeader() {
  return (
    <div className="space-y-2 mb-8">
      <Skeleton className="h-9 w-64" />
      <Skeleton className="h-5 w-96" />
    </div>
  )
}

// Gallery Grid Skeleton
export function SkeletonGallery({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}

// Settings Form Skeleton
export function SkeletonSettings() {
  return (
    <div className="space-y-6">
      <SkeletonPageHeader />

      <div className="rounded-xl border border-border/50 p-6 space-y-6">
        <div>
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-full max-w-xl" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <div className="flex gap-2">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <Skeleton className="h-10 flex-1 rounded-lg" />
              </div>
            </div>
          ))}
        </div>

        <div className="h-20 rounded-lg border border-border/30 p-4 space-y-2">
          <Skeleton className="h-3 w-32" />
          <div className="flex gap-2">
            <Skeleton className="h-12 flex-1 rounded-lg" />
            <Skeleton className="h-12 flex-1 rounded-lg" />
            <Skeleton className="h-12 flex-1 rounded-lg" />
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <Skeleton className="h-10 w-40 rounded-lg" />
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>
    </div>
  )
}

// Creative Generation Skeleton (special for Yi)
export function SkeletonCreativeGeneration() {
  return (
    <div className="space-y-6">
      {/* Format Selection Skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-48" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-[4/5] w-full rounded-lg" />
              <Skeleton className="h-4 w-3/4 mx-auto" />
            </div>
          ))}
        </div>
      </div>

      {/* Form Fields Skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-32" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          ))}
        </div>
      </div>

      {/* Generate Button Skeleton */}
      <Skeleton className="h-12 w-full rounded-xl" />
    </div>
  )
}

// List Item Skeleton
export function SkeletonListItem() {
  return (
    <div className="flex items-center gap-4 p-4 rounded-lg border border-border/30">
      <Skeleton className="h-12 w-12 rounded-lg flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="h-9 w-9 rounded-lg" />
    </div>
  )
}

// Loading Overlay (for full-page loading)
export function SkeletonLoadingOverlay({ message }: { message?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="text-center space-y-4">
        <div className="relative">
          <Skeleton className="h-16 w-16 rounded-2xl mx-auto" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          </div>
        </div>
        {message && (
          <p className="text-sm text-muted-foreground font-medium animate-pulse">
            {message}
          </p>
        )}
      </div>
    </div>
  )
}

// Export all skeletons
export const SkeletonLoaders = {
  Skeleton,
  Card: SkeletonCard,
  TableRow: SkeletonTableRow,
  Form: SkeletonForm,
  Stats: SkeletonStats,
  PageHeader: SkeletonPageHeader,
  Gallery: SkeletonGallery,
  Settings: SkeletonSettings,
  CreativeGeneration: SkeletonCreativeGeneration,
  ListItem: SkeletonListItem,
  LoadingOverlay: SkeletonLoadingOverlay,
}
