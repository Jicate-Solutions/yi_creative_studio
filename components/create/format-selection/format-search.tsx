'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface FormatSearchProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

/**
 * Search input for filtering formats
 */
export function FormatSearch({
  value,
  onChange,
  placeholder = 'Search formats...',
  className,
}: FormatSearchProps) {
  const [localValue, setLocalValue] = useState(value)

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      onChange(localValue)
    }, 200)

    return () => clearTimeout(timer)
  }, [localValue, onChange])

  // Sync with external value
  useEffect(() => {
    setLocalValue(value)
  }, [value])

  const handleClear = useCallback(() => {
    setLocalValue('')
    onChange('')
  }, [onChange])

  return (
    <div className={cn('search-input-wrapper relative', className)}>
      <Search className="search-icon absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-300" />
      <Input
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        placeholder={placeholder}
        className={cn(
          'pl-10 pr-9 h-11 border-2 rounded-lg transition-all duration-300',
          'focus:border-[#005B96] focus:shadow-[0_0_0_3px_rgba(0,91,150,0.1)]',
          'placeholder:text-muted-foreground'
        )}
      />
      {localValue && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleClear}
          className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 hover:bg-muted rounded-md"
        >
          <X className="w-4 h-4" />
          <span className="sr-only">Clear search</span>
        </Button>
      )}
    </div>
  )
}
