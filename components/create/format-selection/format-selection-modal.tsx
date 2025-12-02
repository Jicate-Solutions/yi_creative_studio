'use client'

import { useState, useMemo, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Sparkles } from 'lucide-react'

import { FormatSearch } from './format-search'
import { FormatCategoryTabs } from './format-category-tabs'
import { FormatGrid } from './format-grid'
import { RecentFormats } from './recent-formats'
import { CustomSizeForm } from './custom-size-form'

import {
  getAllFormats,
  getFormatsByCategory,
  getPopularFormats,
  searchFormats,
  type CreativeFormat,
  type CreativeFormatId,
  type FormatCategoryId,
} from '@/lib/config/creative-formats'
import { useCreativeStore } from '@/stores/creative-store'

interface FormatSelectionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect?: (format: CreativeFormat) => void
}

/**
 * Canva-style format selection modal
 *
 * Shows:
 * - Search bar
 * - Recently used formats
 * - Category tabs (All, Social Media, Print, etc.)
 * - Grid of format cards
 * - Custom size option
 */
export function FormatSelectionModal({
  open,
  onOpenChange,
  onSelect,
}: FormatSelectionModalProps) {
  const {
    selectedFormat,
    recentFormats,
    selectFormat,
    setCustomDimensions,
    formData,
  } = useCreativeStore()

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<FormatCategoryId | 'all'>('all')

  // Filter formats based on search and category
  const filteredFormats = useMemo(() => {
    let formats: CreativeFormat[]

    // First apply search if present
    if (searchQuery.trim()) {
      formats = searchFormats(searchQuery)
    } else if (selectedCategory === 'all') {
      formats = getAllFormats()
    } else {
      formats = getFormatsByCategory(selectedCategory)
    }

    // Sort: popular first, then alphabetical
    return formats.sort((a, b) => {
      if (a.popular && !b.popular) return -1
      if (!a.popular && b.popular) return 1
      return a.label.localeCompare(b.label)
    })
  }, [searchQuery, selectedCategory])

  // Popular formats for the header section
  const popularFormats = useMemo(() => getPopularFormats().slice(0, 6), [])

  // Handle format selection
  const handleSelectFormat = useCallback(
    (format: CreativeFormat) => {
      selectFormat(format.id)
      onSelect?.(format)
      onOpenChange(false)
    },
    [selectFormat, onSelect, onOpenChange]
  )

  // Handle custom size
  const handleApplyCustomSize = useCallback(
    (width: number, height: number) => {
      // Select "custom" format and set dimensions
      selectFormat('custom')
      setCustomDimensions(width, height)
    },
    [selectFormat, setCustomDimensions]
  )

  const handleClearCustomSize = useCallback(() => {
    // Just clear custom dimensions, keep format selection
  }, [])

  // Continue with selected format
  const handleContinue = useCallback(() => {
    if (selectedFormat) {
      onSelect?.(selectedFormat)
      onOpenChange(false)
    }
  }, [selectedFormat, onSelect, onOpenChange])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader className="pb-4 border-b">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="w-5 h-5 text-primary" />
            What would you like to create?
          </DialogTitle>
          <DialogDescription>
            Choose a format to get started with AI-powered creative generation
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4 py-4">
          {/* Search */}
          <FormatSearch
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search formats (e.g., Instagram, poster, YouTube...)"
          />

          {/* Recent formats */}
          {!searchQuery && recentFormats.length > 0 && (
            <RecentFormats
              recentFormatIds={recentFormats}
              selectedFormatId={selectedFormat?.id}
              onSelect={handleSelectFormat}
            />
          )}

          {/* Category tabs */}
          <FormatCategoryTabs
            selectedCategory={selectedCategory}
            onSelect={(cat) => {
              setSelectedCategory(cat)
              setSearchQuery('')
            }}
          />

          {/* Format grid (scrollable) */}
          <ScrollArea className="flex-1 -mx-2 px-2">
            <FormatGrid
              formats={filteredFormats}
              selectedFormatId={selectedFormat?.id}
              onSelect={handleSelectFormat}
            />
          </ScrollArea>

          {/* Custom size */}
          <div className="pt-2 border-t">
            <CustomSizeForm
              customDimensions={formData.customDimensions}
              onApply={handleApplyCustomSize}
              onClear={handleClearCustomSize}
            />
          </div>
        </div>

        {/* Footer with continue button */}
        {selectedFormat && (
          <div className="pt-4 border-t flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Selected: <span className="font-medium text-foreground">{selectedFormat.label}</span>
              {formData.customDimensions ? (
                <span className="ml-1">
                  ({formData.customDimensions.width} x {formData.customDimensions.height} px)
                </span>
              ) : (
                <span className="ml-1">
                  ({selectedFormat.width} x {selectedFormat.height} px)
                </span>
              )}
            </div>
            <Button onClick={handleContinue}>Continue</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
