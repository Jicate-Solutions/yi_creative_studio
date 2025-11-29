'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'

interface LogoProps {
  className?: string
  showText?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function Logo({ className, showText = true, size = 'md' }: LogoProps) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-10 w-10',
  }

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
  }

  return (
    <Link href="/" className={cn('flex items-center gap-2', className)}>
      {/* Yi Logo Mark */}
      <div
        className={cn(
          'relative rounded-lg gradient-yi flex items-center justify-center',
          sizeClasses[size]
        )}
      >
        <span className="text-white font-bold text-sm">Yi</span>
      </div>

      {showText && (
        <span className={cn('font-semibold', textSizeClasses[size])}>
          <span className="text-gradient-yi">Creative</span>
          <span className="text-foreground">Studio</span>
        </span>
      )}
    </Link>
  )
}
