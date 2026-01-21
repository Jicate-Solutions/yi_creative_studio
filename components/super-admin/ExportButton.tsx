'use client'

import { useState } from 'react'
import { Download, FileSpreadsheet, Loader2, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export interface ExportColumn {
  key: string
  label: string
  selected?: boolean
}

interface ExportButtonProps {
  /** API endpoint to fetch export data */
  endpoint: string
  /** Filename for the downloaded file (without extension) */
  filename: string
  /** Available columns for export */
  columns: ExportColumn[]
  /** Additional query parameters to pass to the API */
  queryParams?: Record<string, string>
  /** Show column selection dialog */
  showColumnSelection?: boolean
  /** Button variant */
  variant?: 'default' | 'outline' | 'secondary' | 'ghost'
  /** Button size */
  size?: 'default' | 'sm' | 'lg' | 'icon'
  /** Custom button text */
  buttonText?: string
}

export function ExportButton({
  endpoint,
  filename,
  columns,
  queryParams = {},
  showColumnSelection = true,
  variant = 'outline',
  size = 'sm',
  buttonText = 'Export',
}: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [selectedColumns, setSelectedColumns] = useState<Set<string>>(
    new Set(columns.filter((c) => c.selected !== false).map((c) => c.key))
  )

  const toggleColumn = (key: string) => {
    const newSelected = new Set(selectedColumns)
    if (newSelected.has(key)) {
      newSelected.delete(key)
    } else {
      newSelected.add(key)
    }
    setSelectedColumns(newSelected)
  }

  const selectAll = () => {
    setSelectedColumns(new Set(columns.map((c) => c.key)))
  }

  const deselectAll = () => {
    setSelectedColumns(new Set())
  }

  const handleExport = async (format: 'csv' | 'json' = 'csv') => {
    if (selectedColumns.size === 0) {
      toast.error('Please select at least one column to export')
      return
    }

    setIsExporting(true)
    setShowDialog(false)

    try {
      // Build query string
      const params = new URLSearchParams({
        ...queryParams,
        format,
        columns: Array.from(selectedColumns).join(','),
      })

      const response = await fetch(`${endpoint}?${params.toString()}`)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Export failed')
      }

      // Get the blob
      const blob = await response.blob()
      const contentType = response.headers.get('content-type') || ''

      // Determine file extension
      const extension = format === 'json' ? 'json' : 'csv'
      const finalFilename = `${filename}_${new Date().toISOString().split('T')[0]}.${extension}`

      // Create download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = finalFilename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast.success(`Exported ${finalFilename}`)
    } catch (error) {
      console.error('[ExportButton] Export failed:', error)
      toast.error(error instanceof Error ? error.message : 'Export failed')
    } finally {
      setIsExporting(false)
    }
  }

  const handleQuickExport = (format: 'csv' | 'json') => {
    if (showColumnSelection) {
      setShowDialog(true)
    } else {
      handleExport(format)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant={variant} size={size} disabled={isExporting}>
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            {buttonText}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Export Format</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => handleQuickExport('csv')}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Export as CSV
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleQuickExport('json')}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Export as JSON
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Column Selection Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Select Columns to Export</DialogTitle>
            <DialogDescription>
              Choose which columns to include in your export file.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Select All / Deselect All */}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={selectAll}>
                Select All
              </Button>
              <Button variant="outline" size="sm" onClick={deselectAll}>
                Deselect All
              </Button>
            </div>

            {/* Column Checkboxes */}
            <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto">
              {columns.map((column) => (
                <div key={column.key} className="flex items-center space-x-2">
                  <Checkbox
                    id={`col-${column.key}`}
                    checked={selectedColumns.has(column.key)}
                    onCheckedChange={() => toggleColumn(column.key)}
                  />
                  <Label
                    htmlFor={`col-${column.key}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {column.label}
                  </Label>
                </div>
              ))}
            </div>

            <p className="text-xs text-muted-foreground">
              {selectedColumns.size} of {columns.length} columns selected
            </p>
          </div>

          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => handleExport('csv')}
              disabled={selectedColumns.size === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

/**
 * Utility function to convert data to CSV format
 */
export function convertToCSV(
  data: Record<string, unknown>[],
  columns: string[]
): string {
  if (data.length === 0) return ''

  // Header row
  const header = columns.join(',')

  // Data rows
  const rows = data.map((row) =>
    columns
      .map((col) => {
        const value = row[col]
        if (value === null || value === undefined) return ''
        const str = String(value)
        // Escape quotes and wrap in quotes if contains comma, newline, or quote
        if (str.includes(',') || str.includes('\n') || str.includes('"')) {
          return `"${str.replace(/"/g, '""')}"`
        }
        return str
      })
      .join(',')
  )

  return [header, ...rows].join('\n')
}

/**
 * Utility function to trigger a file download
 */
export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}
