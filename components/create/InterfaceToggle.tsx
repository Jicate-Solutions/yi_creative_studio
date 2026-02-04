'use client'

import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { LayoutGrid, ListTree } from 'lucide-react'
import { cn } from '@/lib/utils'

interface InterfaceToggleProps {
  className?: string
}

export function InterfaceToggle({ className }: InterfaceToggleProps) {
  const router = useRouter()
  const pathname = usePathname()

  const isCanvasView = pathname?.includes('/canvas')

  const handleToggle = () => {
    if (isCanvasView) {
      // Switch to wizard view
      router.push('/create')
    } else {
      // Switch to canvas view
      router.push('/create/canvas')
    }
  }

  return (
    <div className={cn("flex items-center gap-1 bg-muted rounded-lg p-1", className)}>
      <Button
        variant={!isCanvasView ? "default" : "ghost"}
        size="sm"
        onClick={() => !isCanvasView && handleToggle()}
        className={cn(
          "h-7 px-3 text-xs gap-1.5",
          !isCanvasView && "shadow-sm"
        )}
      >
        <ListTree className="h-3.5 w-3.5" />
        Wizard
      </Button>
      <Button
        variant={isCanvasView ? "default" : "ghost"}
        size="sm"
        onClick={() => isCanvasView && handleToggle()}
        className={cn(
          "h-7 px-3 text-xs gap-1.5",
          isCanvasView && "shadow-sm"
        )}
      >
        <LayoutGrid className="h-3.5 w-3.5" />
        Canvas
      </Button>
    </div>
  )
}
