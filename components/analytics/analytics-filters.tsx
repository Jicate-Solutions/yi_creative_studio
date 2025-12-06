'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { CREATIVE_FORMATS, getAllFormats } from '@/lib/config/creative-formats'
import { cn } from '@/lib/utils'
import { CalendarIcon, X, Filter } from 'lucide-react'
import { format } from 'date-fns'
import { DateRange } from 'react-day-picker'
import { createClient } from '@/lib/supabase/client'

// Date range presets
export const DATE_PRESETS = [
  { label: 'Last 7 days', value: '7d', days: 7 },
  { label: 'Last 30 days', value: '30d', days: 30 },
  { label: 'Last 90 days', value: '90d', days: 90 },
  { label: 'All time', value: 'all', days: null },
  { label: 'Custom', value: 'custom', days: null },
] as const

export type DatePresetValue = typeof DATE_PRESETS[number]['value']

export interface AnalyticsFiltersState {
  datePreset: DatePresetValue
  dateRange: DateRange | undefined
  creativeType: string | null
  vertical: string | null
  minCostInr: number | null
  maxCostInr: number | null
  ratingMin: number | null
  ratingMax: number | null
}

interface AnalyticsFiltersProps {
  filters: AnalyticsFiltersState
  onFiltersChange: (filters: AnalyticsFiltersState) => void
  showCostFilter?: boolean
  showRatingFilter?: boolean
  organizationId: string
}

export function AnalyticsFilters({
  filters,
  onFiltersChange,
  showCostFilter = false,
  showRatingFilter = false,
  organizationId,
}: AnalyticsFiltersProps) {
  const [verticals, setVerticals] = useState<{ id: string; name: string }[]>([])
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)

  // Fetch verticals from database
  useEffect(() => {
    async function fetchVerticals() {
      const supabase = createClient()
      const { data } = await supabase
        .from('vertical_presets')
        .select('id, name')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .order('name')

      if (data) {
        setVerticals(data)
      }
    }

    if (organizationId) {
      fetchVerticals()
    }
  }, [organizationId])

  const handleDatePresetChange = (preset: DatePresetValue) => {
    if (preset === 'custom') {
      onFiltersChange({ ...filters, datePreset: preset })
      return
    }

    const presetConfig = DATE_PRESETS.find((p) => p.value === preset)
    let dateRange: DateRange | undefined = undefined

    if (presetConfig?.days) {
      const end = new Date()
      const start = new Date()
      start.setDate(start.getDate() - presetConfig.days)
      dateRange = { from: start, to: end }
    }

    onFiltersChange({
      ...filters,
      datePreset: preset,
      dateRange,
    })
  }

  const handleDateRangeChange = (range: DateRange | undefined) => {
    onFiltersChange({
      ...filters,
      datePreset: 'custom',
      dateRange: range,
    })
  }

  const handleCreativeTypeChange = (value: string) => {
    onFiltersChange({
      ...filters,
      creativeType: value === 'all' ? null : value,
    })
  }

  const handleVerticalChange = (value: string) => {
    onFiltersChange({
      ...filters,
      vertical: value === 'all' ? null : value,
    })
  }

  const handleCostChange = (field: 'minCostInr' | 'maxCostInr', value: string) => {
    const numValue = value ? parseFloat(value) : null
    onFiltersChange({
      ...filters,
      [field]: numValue,
    })
  }

  const handleRatingChange = (field: 'ratingMin' | 'ratingMax', value: string) => {
    const numValue = value ? parseInt(value) : null
    onFiltersChange({
      ...filters,
      [field]: numValue,
    })
  }

  const clearFilters = () => {
    onFiltersChange({
      datePreset: '30d',
      dateRange: undefined,
      creativeType: null,
      vertical: null,
      minCostInr: null,
      maxCostInr: null,
      ratingMin: null,
      ratingMax: null,
    })
  }

  const hasActiveFilters =
    filters.creativeType ||
    filters.vertical ||
    filters.minCostInr ||
    filters.maxCostInr ||
    filters.ratingMin ||
    filters.ratingMax ||
    filters.datePreset !== '30d'

  const allFormats = getAllFormats()

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        {/* Date Range Presets */}
        <div className="flex items-center gap-2">
          {DATE_PRESETS.map((preset) => (
            <Button
              key={preset.value}
              variant={filters.datePreset === preset.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleDatePresetChange(preset.value)}
              className={cn(
                preset.value === 'custom' && 'hidden sm:inline-flex'
              )}
            >
              {preset.label}
            </Button>
          ))}
        </div>

        {/* Custom Date Range Picker */}
        {filters.datePreset === 'custom' && (
          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <CalendarIcon className="h-4 w-4" />
                {filters.dateRange?.from ? (
                  filters.dateRange.to ? (
                    <>
                      {format(filters.dateRange.from, 'LLL dd')} -{' '}
                      {format(filters.dateRange.to, 'LLL dd, y')}
                    </>
                  ) : (
                    format(filters.dateRange.from, 'LLL dd, y')
                  )
                ) : (
                  'Pick dates'
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={filters.dateRange?.from}
                selected={filters.dateRange}
                onSelect={handleDateRangeChange}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        )}

        <div className="h-6 w-px bg-border hidden sm:block" />

        {/* Creative Type Filter */}
        <Select
          value={filters.creativeType || 'all'}
          onValueChange={handleCreativeTypeChange}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Creative Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {allFormats.map((format) => (
              <SelectItem key={format.id} value={format.id}>
                {format.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Vertical Filter */}
        <Select
          value={filters.vertical || 'all'}
          onValueChange={handleVerticalChange}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Vertical" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Verticals</SelectItem>
            {verticals.map((v) => (
              <SelectItem key={v.id} value={v.name}>
                {v.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Cost Range Filter */}
        {showCostFilter && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="h-4 w-4" />
                Cost Range
                {(filters.minCostInr || filters.maxCostInr) && (
                  <span className="ml-1 rounded-full bg-primary/20 px-2 py-0.5 text-xs">
                    Active
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64" align="start">
              <div className="space-y-4">
                <h4 className="font-medium text-sm">Cost Range (INR)</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="minCost" className="text-xs text-muted-foreground">
                      Min
                    </Label>
                    <Input
                      id="minCost"
                      type="number"
                      placeholder="0"
                      value={filters.minCostInr || ''}
                      onChange={(e) => handleCostChange('minCostInr', e.target.value)}
                      className="h-8"
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxCost" className="text-xs text-muted-foreground">
                      Max
                    </Label>
                    <Input
                      id="maxCost"
                      type="number"
                      placeholder="999"
                      value={filters.maxCostInr || ''}
                      onChange={(e) => handleCostChange('maxCostInr', e.target.value)}
                      className="h-8"
                    />
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        )}

        {/* Rating Filter */}
        {showRatingFilter && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="h-4 w-4" />
                Rating
                {(filters.ratingMin || filters.ratingMax) && (
                  <span className="ml-1 rounded-full bg-primary/20 px-2 py-0.5 text-xs">
                    Active
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64" align="start">
              <div className="space-y-4">
                <h4 className="font-medium text-sm">Rating Range (1-5)</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="ratingMin" className="text-xs text-muted-foreground">
                      Min
                    </Label>
                    <Select
                      value={filters.ratingMin?.toString() || ''}
                      onValueChange={(v) => handleRatingChange('ratingMin', v)}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Any" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Any</SelectItem>
                        {[1, 2, 3, 4, 5].map((r) => (
                          <SelectItem key={r} value={r.toString()}>
                            {r} Star{r > 1 ? 's' : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="ratingMax" className="text-xs text-muted-foreground">
                      Max
                    </Label>
                    <Select
                      value={filters.ratingMax?.toString() || ''}
                      onValueChange={(v) => handleRatingChange('ratingMax', v)}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Any" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Any</SelectItem>
                        {[1, 2, 3, 4, 5].map((r) => (
                          <SelectItem key={r} value={r.toString()}>
                            {r} Star{r > 1 ? 's' : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        )}

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="gap-1 text-muted-foreground"
          >
            <X className="h-4 w-4" />
            Clear
          </Button>
        )}
      </div>
    </div>
  )
}

// Default filters
export function getDefaultFilters(): AnalyticsFiltersState {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - 30)

  return {
    datePreset: '30d',
    dateRange: { from: start, to: end },
    creativeType: null,
    vertical: null,
    minCostInr: null,
    maxCostInr: null,
    ratingMin: null,
    ratingMax: null,
  }
}

// Build Supabase query filters from state
export function buildSupabaseFilters(
  filters: AnalyticsFiltersState
): {
  startDate: Date | null
  endDate: Date | null
  creativeType: string | null
  vertical: string | null
} {
  let startDate: Date | null = null
  let endDate: Date | null = null

  if (filters.dateRange?.from) {
    startDate = filters.dateRange.from
  }
  if (filters.dateRange?.to) {
    endDate = filters.dateRange.to
  }

  return {
    startDate,
    endDate,
    creativeType: filters.creativeType,
    vertical: filters.vertical,
  }
}
