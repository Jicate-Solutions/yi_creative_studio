'use client'

import { cn } from '@/lib/utils'
import {
  FORMAT_CATEGORIES,
  FORMAT_CATEGORY_ORDER,
  type FormatCategoryId,
} from '@/lib/config/creative-formats'
import {
  Share2,
  Video,
  Printer,
  Presentation,
  Megaphone,
  FileText,
  LayoutGrid,
  GraduationCap,
} from 'lucide-react'

interface FormatCategoryTabsProps {
  selectedCategory: FormatCategoryId | 'all'
  onSelect: (category: FormatCategoryId | 'all') => void
  className?: string
}

// Icon mapping for categories
const categoryIcons: Record<FormatCategoryId | 'all', React.ElementType> = {
  all: LayoutGrid,
  social_media: Share2,
  video: Video,
  print: Printer,
  presentations: Presentation,
  marketing: Megaphone,
  documents: FileText,
  admission: GraduationCap,
}

/**
 * Category tab navigation for filtering formats
 */
export function FormatCategoryTabs({
  selectedCategory,
  onSelect,
  className,
}: FormatCategoryTabsProps) {
  const categories: (FormatCategoryId | 'all')[] = ['all', ...FORMAT_CATEGORY_ORDER]

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {categories.map((categoryId) => {
        const isAll = categoryId === 'all'
        const category = isAll ? null : FORMAT_CATEGORIES[categoryId]
        const Icon = categoryIcons[categoryId]
        const isSelected = selectedCategory === categoryId

        return (
          <button
            key={categoryId}
            type="button"
            onClick={() => onSelect(categoryId)}
            className={cn(
              'filter-btn-canva inline-flex items-center gap-2 text-sm',
              isSelected && 'active'
            )}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">
              {isAll ? 'All' : category?.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
