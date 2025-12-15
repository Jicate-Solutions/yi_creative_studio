'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Sparkles, Plus } from 'lucide-react'
import { FormatSelectionModal } from '@/components/create/format-selection'
import type { CreativeFormat } from '@/lib/config/creative-formats'
import { ROUTES } from '@/lib/config/constants'
import { cn } from '@/lib/utils'

interface CreateButtonProps {
  variant?: 'default' | 'large' | 'hero'
  className?: string
}

/**
 * Create button that opens the format selection modal
 *
 * Variants:
 * - default: Normal button
 * - large: Larger button with icon on top
 * - hero: Hero-style button for main CTA
 */
export function CreateButton({ variant = 'default', className }: CreateButtonProps) {
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleSelectFormat = useCallback(
    (format: CreativeFormat) => {
      // Format is already stored in the creative store
      // Navigate to create page
      router.push(ROUTES.create)
    },
    [router]
  )

  if (variant === 'large') {
    return (
      <>
        <Button
          onClick={() => setIsModalOpen(true)}
          size="lg"
          className={cn(
            'h-auto py-6 gradient-yi flex flex-col items-center gap-2',
            'rounded-xl shadow-[0_4px_14px_rgba(0,91,150,0.3)]',
            'hover:shadow-[0_8px_24px_rgba(0,91,150,0.4)] hover:-translate-y-1',
            'active:scale-[0.98] transition-all duration-300',
            className
          )}
        >
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
            <Sparkles className="h-6 w-6" />
          </div>
          <span className="font-semibold">Create New Creative</span>
          <span className="text-xs opacity-80">Generate with AI</span>
        </Button>

        <FormatSelectionModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          onSelect={handleSelectFormat}
        />
      </>
    )
  }

  if (variant === 'hero') {
    return (
      <>
        <Button
          onClick={() => setIsModalOpen(true)}
          size="lg"
          className={cn(
            'h-16 px-8 text-lg font-semibold gradient-yi',
            'rounded-xl shadow-[0_4px_20px_rgba(0,91,150,0.35)]',
            'hover:shadow-[0_8px_30px_rgba(0,91,150,0.45)] hover:-translate-y-1',
            'active:scale-[0.98] transition-all duration-300',
            className
          )}
        >
          <Plus className="h-5 w-5 mr-2" />
          Create New Creative
        </Button>

        <FormatSelectionModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          onSelect={handleSelectFormat}
        />
      </>
    )
  }

  // Default variant
  return (
    <>
      <Button onClick={() => setIsModalOpen(true)} className={className}>
        <Plus className="h-4 w-4 mr-2" />
        Create
      </Button>

      <FormatSelectionModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSelect={handleSelectFormat}
      />
    </>
  )
}
