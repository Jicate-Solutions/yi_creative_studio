'use client'

import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface MobileBottomSheetProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

export function MobileBottomSheet({
  isOpen,
  onClose,
  title,
  children,
}: MobileBottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null)

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop - z-85 to be above bottom nav (z-80) */}
      <div
        className="fixed inset-0 bg-black/50 z-[85] animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Sheet - z-90 to be above backdrop and bottom nav */}
      <div
        ref={sheetRef}
        className={cn(
          'fixed inset-x-0 bottom-0 z-[90]',
          'bg-background rounded-t-2xl',
          'shadow-xl',
          'animate-in slide-in-from-bottom duration-300',
          'max-h-[85vh] flex flex-col'
        )}
      >
        {/* Drag Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/25" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border/60">
          <h3 className="text-[15px] font-semibold tracking-tight text-foreground">{title}</h3>
          <button
            onClick={onClose}
            className="h-7 w-7 flex items-center justify-center rounded-full bg-muted hover:bg-muted/80 transition-colors"
          >
            <X className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </>
  )
}
