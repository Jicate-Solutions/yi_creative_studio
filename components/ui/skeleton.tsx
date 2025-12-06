import { cn } from "@/lib/utils"

interface SkeletonProps extends React.ComponentProps<"div"> {
  shimmer?: boolean
}

function Skeleton({ className, shimmer = true, ...props }: SkeletonProps) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "rounded-md",
        // Use shimmer effect from globals.css or fallback to pulse
        shimmer ? "skeleton" : "bg-muted animate-pulse",
        className
      )}
      {...props}
    />
  )
}

// Skeleton text lines component
function SkeletonText({
  lines = 3,
  className
}: {
  lines?: number
  className?: string
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-4"
          style={{
            width: i === lines - 1 ? '60%' : '100%',
            animationDelay: `${i * 100}ms`
          }}
        />
      ))}
    </div>
  )
}

// Skeleton card component
function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-xl shadow-[var(--shadow-card)] p-4 space-y-4", className)}>
      <Skeleton className="aspect-video rounded-lg" />
      <SkeletonText lines={2} />
      <div className="flex gap-2">
        <Skeleton className="h-8 w-20 rounded-full" />
        <Skeleton className="h-8 w-24 rounded-full" />
      </div>
    </div>
  )
}

export { Skeleton, SkeletonText, SkeletonCard }
