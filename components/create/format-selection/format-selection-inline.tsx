'use client'

import { useState, useMemo, useCallback } from 'react'
import { Clock, ChevronDown, Ruler } from 'lucide-react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'

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
import { cn } from '@/lib/utils'

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

  const [customSizeOpen, setCustomSizeOpen] = useState(false)

  return (
    <div className="space-y-6">
      {/* Search Section */}
      <div className="glass-panel p-4 rounded-xl">
        <FormatSearch
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search formats (e.g., Instagram, poster, YouTube...)"
        />
      </div>

      {/* Recent Formats */}
      {!searchQuery && recentFormats.length > 0 && (
        <div className="glass-panel p-4 rounded-xl">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Clock className="h-4 w-4 text-primary" />
            </div>
            <span className="text-sm font-medium">Recently Used</span>
          </div>
          <RecentFormats
            recentFormatIds={recentFormats}
            selectedFormatId={selectedFormat?.id}
            onSelect={handleSelectFormat}
          />
        </div>
      )}

      {/* Main Selection Area */}
      <div className="glass-panel p-4 rounded-xl">
        {/* Category tabs */}
        <FormatCategoryTabs
          selectedCategory={selectedCategory}
          onSelect={(cat) => {
            setSelectedCategory(cat)
            setSearchQuery('')
          }}
        />

        {/* Format grid */}
        <div className="mt-4 max-h-[50vh] overflow-y-auto -mx-2 px-2">
          <FormatGrid
            formats={filteredFormats}
            selectedFormatId={selectedFormat?.id}
            onSelect={handleSelectFormat}
          />
        </div>
      </div>

      {/* Custom Size - Collapsible advanced option */}
      {!hideCustomSize && (
        <Collapsible open={customSizeOpen} onOpenChange={setCustomSizeOpen}>
          <CollapsibleTrigger className="w-full">
            <div
              className={cn(
                'flex items-center justify-between p-4 rounded-xl transition-all duration-200',
                'glass-panel hover:shadow-md cursor-pointer group',
                customSizeOpen && 'shadow-inner bg-white/50 dark:bg-black/40'
              )}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted/50 group-hover:bg-primary/10 transition-colors">
                  <Ruler className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div className="text-left">
                  <span className="text-sm font-medium">Custom Dimensions</span>
                  <p className="text-xs text-muted-foreground">Create a custom canvas size</p>
                </div>
              </div>
              <ChevronDown
                className={cn(
                  'h-4 w-4 text-muted-foreground transition-transform duration-200',
                  customSizeOpen && 'rotate-180'
                )}
              />
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="glass-inset p-4 rounded-xl mt-2">
              <CustomSizeForm
                customDimensions={formData.customDimensions}
                onApply={handleApplyCustomSize}
                onClear={handleClearCustomSize}
              />
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  )
}
