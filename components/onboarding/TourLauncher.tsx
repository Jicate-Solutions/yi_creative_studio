'use client'

import { useState } from 'react'
import { HelpCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useTour } from '@/hooks/use-tour'
import { TOUR_REGISTRY } from './tour-registry'
import { cn } from '@/lib/utils'

interface TourLauncherProps {
  pageId: string  // 'create' | 'events' | 'gallery' | 'templates'
  className?: string
}

export function TourLauncher({ pageId, className }: TourLauncherProps) {
  const { requestTour, resetTour, isTourCompleted } = useTour()
  const [open, setOpen] = useState(false)

  // Get tours for this page
  const pageTours = TOUR_REGISTRY.filter(tour => tour.pageId === pageId)

  if (pageTours.length === 0) return null

  return (
    <div className={cn('fixed bottom-20 right-4 z-50 md:bottom-4', className)}>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            size="icon"
            className="h-12 w-12 rounded-full shadow-lg bg-[#005B96] hover:bg-[#004a7a]"
            title="Show page tour"
          >
            <HelpCircle className="h-6 w-6 text-white" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-72">
          <DropdownMenuLabel>Page Tours</DropdownMenuLabel>
          <DropdownMenuSeparator />

          {pageTours.map((tour) => {
            const completed = isTourCompleted(tour.id)
            const TourIcon = tour.icon

            return (
              <DropdownMenuItem
                key={tour.id}
                onClick={() => {
                  requestTour(tour.id)
                  setOpen(false)
                }}
                className="flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-3 flex-1">
                  <TourIcon className="h-4 w-4 text-primary" />
                  <div className="flex-1">
                    <div className="font-medium text-sm">{tour.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {tour.description}
                    </div>
                  </div>
                </div>
                {completed && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 shrink-0"
                    onClick={(e) => {
                      e.stopPropagation()
                      resetTour(tour.id)
                    }}
                    title="Reset tour"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </Button>
                )}
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
