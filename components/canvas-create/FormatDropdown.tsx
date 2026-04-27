'use client'

import { useState } from 'react'
import { useCreativeStore } from '@/stores/creative-store'
import { CREATIVE_FORMATS, type CreativeFormatId, type CreativeFormat } from '@/lib/config/creative-formats'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ChevronDown, Search, Image, FileText, Video, Award, Presentation } from 'lucide-react'
import { cn } from '@/lib/utils'

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'Social Media': <Image className="h-4 w-4" />,
  'Print': <FileText className="h-4 w-4" />,
  'Video': <Video className="h-4 w-4" />,
  'Documents': <Award className="h-4 w-4" />,
  'Presentations': <Presentation className="h-4 w-4" />,
}

export function FormatDropdown() {
  const { selectedFormat, selectFormat, recentFormats, selectedModel } = useCreativeStore()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const isOpenAI = selectedModel?.provider === 'openai'

  // Convert Record to array, filtering incompatible formats when OpenAI model is selected
  const formatsArray = Object.values(CREATIVE_FORMATS).filter(f =>
    isOpenAI ? f.gptImageSize != null : true
  )

  // Group formats by category
  const formatsByCategory = formatsArray.reduce((acc, format) => {
    if (!acc[format.category]) {
      acc[format.category] = []
    }
    acc[format.category].push(format)
    return acc
  }, {} as Record<string, CreativeFormat[]>)

  // Filter formats by search
  const filteredFormats = search
    ? formatsArray.filter(
        (f) =>
          f.label.toLowerCase().includes(search.toLowerCase()) ||
          f.category.toLowerCase().includes(search.toLowerCase())
      )
    : null

  const handleSelect = (formatId: CreativeFormatId) => {
    selectFormat(formatId)
    setOpen(false)
    setSearch('')
  }

  // Get recent formats data
  const recentFormatItems = recentFormats
    .slice(0, 4)
    .map((id) => CREATIVE_FORMATS[id])
    .filter(Boolean)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-[200px] justify-between">
          <span className="truncate">
            {selectedFormat?.label || 'Select Format'}
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0" align="start">
        {/* Search */}
        <div className="p-3 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search formats..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="max-h-[400px] overflow-y-auto p-2">
          {/* Search Results */}
          {filteredFormats ? (
            <div className="space-y-1">
              {filteredFormats.length === 0 ? (
                <p className="text-sm text-muted-foreground p-2">No formats found</p>
              ) : (
                filteredFormats.map((format) => (
                  <button
                    key={format.id}
                    onClick={() => handleSelect(format.id)}
                    className={cn(
                      'w-full text-left px-3 py-2 rounded-md text-sm hover:bg-muted transition-colors',
                      selectedFormat?.id === format.id && 'bg-muted'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{format.label}</span>
                      <span className="text-xs text-muted-foreground">
                        {format.width}x{format.height}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">{format.category}</span>
                  </button>
                ))
              )}
            </div>
          ) : (
            <>
              {/* Recent Formats */}
              {recentFormatItems.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-medium text-muted-foreground px-2 mb-2">
                    Recent
                  </p>
                  <div className="grid grid-cols-2 gap-1">
                    {recentFormatItems.map((format) => (
                      <button
                        key={format!.id}
                        onClick={() => handleSelect(format!.id)}
                        className={cn(
                          'text-left px-3 py-2 rounded-md text-sm hover:bg-muted transition-colors',
                          selectedFormat?.id === format!.id && 'bg-muted'
                        )}
                      >
                        <span className="font-medium truncate block">{format!.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Categories */}
              {Object.entries(formatsByCategory).map(([category, formats]) => (
                <div key={category} className="mb-4">
                  <div className="flex items-center gap-2 px-2 mb-2">
                    {CATEGORY_ICONS[category] || <Image className="h-4 w-4" />}
                    <p className="text-xs font-medium text-muted-foreground">
                      {category}
                    </p>
                  </div>
                  <div className="space-y-0.5">
                    {formats.slice(0, 4).map((format) => (
                      <button
                        key={format.id}
                        onClick={() => handleSelect(format.id)}
                        className={cn(
                          'w-full text-left px-3 py-2 rounded-md text-sm hover:bg-muted transition-colors',
                          selectedFormat?.id === format.id && 'bg-muted'
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{format.label}</span>
                          <span className="text-xs text-muted-foreground">
                            {format.width}x{format.height}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
