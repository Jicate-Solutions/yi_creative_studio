'use client'

import { useState, useMemo, useCallback } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'

import { FormatSearch } from './format-search'
import { FormatCategoryTabs } from './format-category-tabs'
import { FormatGrid } from './format-grid'
import { RecentFormats } from './recent-formats'
import { CustomSizeForm } from './custom-size-form'

import {
  getAllFormats,
  getFormatsByCategory,
  searchFormats,
  type CreativeFormat,
  type FormatCategoryId,
} from '@/lib/config/creative-formats'
import { useCreativeStore } from '@/stores/creative-store'

interface FormatSelectionInlineProps {
  onSelect?: (format: CreativeFormat) => void
  hideCustomSize?: boolean
}

/**
 * Inline format selection component (non-modal version)
 *
 * Used as Step 0 in the create workflow.
 * Shows:
 * - Search bar
 * - Recently used formats
 * - Category tabs (All, Social Media, Print, etc.)
 * - Grid of format cards
 * - Custom size option
 */
export function FormatSelectionInline({
  onSelect,
  hideCustomSize = false,
}: FormatSelectionInlineProps) {
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

  // Handle format selection
  const handleSelectFormat = useCallback(
    (format: CreativeFormat) => {
      selectFormat(format.id)
      onSelect?.(format)
    },
    [selectFormat, onSelect]
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

  return (
    <div className="flex flex-col gap-6">
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

      {/* Format grid */}
      <div className="max-h-[50vh] overflow-y-auto -mx-2 px-2">
        <FormatGrid
          formats={filteredFormats}
          selectedFormatId={selectedFormat?.id}
          onSelect={handleSelectFormat}
        />
      </div>

      {/* Custom size */}
      {!hideCustomSize && (
        <div className="pt-4 border-t">
          <CustomSizeForm
            customDimensions={formData.customDimensions}
            onApply={handleApplyCustomSize}
            onClear={handleClearCustomSize}
          />
        </div>
      )}
    </div>
  )
}
