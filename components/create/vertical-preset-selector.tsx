'use client'

import { useState } from 'react'
import { Star, ChevronDown, Trash2, Bookmark, ImageIcon } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useVerticalLogoPresets } from '@/hooks/use-vertical-logo-presets'
import { useCreativeStore } from '@/stores/creative-store'
import type { VerticalLogoPresetRow } from '@/types/vertical-logo-presets'
import { cn } from '@/lib/utils'
import Image from 'next/image'

interface VerticalPresetSelectorProps {
  onSaveClick: () => void
  className?: string
}

export function VerticalPresetSelector({ onSaveClick, className }: VerticalPresetSelectorProps) {
  const { presets, isLoading, deletePreset, setDefault, unsetDefault } = useVerticalLogoPresets()
  const { formData, logos, setVerticalLogoIds4Row } = useCreativeStore()
  const [deleteConfirm, setDeleteConfirm] = useState<VerticalLogoPresetRow | null>(null)

  const currentLogoIds = formData.enhanced4RowStrip.rows.vertical.logoIds

  const handleApplyPreset = (preset: VerticalLogoPresetRow) => {
    // Apply the preset's logo IDs to the current configuration
    // Filter to only include logos that still exist in the organization
    const validLogoIds = preset.logo_ids.filter(id =>
      logos.some(l => l.id === id)
    )
    setVerticalLogoIds4Row(validLogoIds)
  }

  const handleDelete = async () => {
    if (deleteConfirm) {
      await deletePreset(deleteConfirm.id)
      setDeleteConfirm(null)
    }
  }

  const handleToggleDefault = async (preset: VerticalLogoPresetRow, e: React.MouseEvent) => {
    e.stopPropagation()
    if (preset.is_default) {
      await unsetDefault()
    } else {
      await setDefault(preset.id)
    }
  }

  // Get logo thumbnails for a preset
  const getPresetThumbnails = (preset: VerticalLogoPresetRow) => {
    return preset.logo_ids
      .map(id => logos.find(l => l.id === id))
      .filter((logo): logo is typeof logos[0] => logo !== undefined)
      .slice(0, 3)
  }

  if (presets.length === 0 && !isLoading) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={onSaveClick}
        disabled={currentLogoIds.length === 0}
        className={cn('gap-1.5 h-7 text-xs', className)}
      >
        <Bookmark className="h-3 w-3" />
        Save
      </Button>
    )
  }

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5 h-7 text-xs" disabled={isLoading}>
            <Bookmark className="h-3 w-3" />
            <span className="hidden sm:inline">Presets</span>
            <Badge variant="secondary" className="ml-0.5 px-1 py-0 text-[10px]">
              {presets.length}
            </Badge>
            <ChevronDown className="h-2.5 w-2.5 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel className="flex items-center justify-between py-1">
            <span className="text-xs">Program Logo Presets</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-5 px-1.5 text-[10px]"
              onClick={onSaveClick}
              disabled={currentLogoIds.length === 0}
            >
              + Save Current
            </Button>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          {presets.map((preset) => {
            const thumbnails = getPresetThumbnails(preset)
            const logoCount = preset.logo_ids.length
            const validCount = thumbnails.length

            return (
              <DropdownMenuItem
                key={preset.id}
                className="flex items-center justify-between gap-2 cursor-pointer py-2"
                onSelect={() => handleApplyPreset(preset)}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <button
                    onClick={(e) => handleToggleDefault(preset, e)}
                    className={cn(
                      'shrink-0 p-0.5 rounded hover:bg-muted',
                      preset.is_default ? 'text-yellow-500' : 'text-muted-foreground/40'
                    )}
                    title={preset.is_default ? 'Remove as default' : 'Set as default'}
                  >
                    <Star className={cn('h-3 w-3', preset.is_default && 'fill-current')} />
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate text-xs">{preset.name}</div>
                    <div className="flex items-center gap-1 mt-0.5">
                      {/* Logo thumbnails */}
                      <div className="flex -space-x-1">
                        {thumbnails.map((logo) => (
                          <div
                            key={logo.id}
                            className="h-4 w-4 rounded border bg-white flex items-center justify-center overflow-hidden"
                          >
                            {logo.file_url ? (
                              <Image
                                src={logo.file_url}
                                alt=""
                                width={14}
                                height={14}
                                className="object-contain"
                                unoptimized
                              />
                            ) : (
                              <ImageIcon className="h-2.5 w-2.5 text-slate-300" />
                            )}
                          </div>
                        ))}
                        {logoCount > 3 && (
                          <div className="h-4 w-4 rounded border bg-slate-100 flex items-center justify-center">
                            <span className="text-[8px] text-slate-500">+{logoCount - 3}</span>
                          </div>
                        )}
                      </div>
                      {validCount < logoCount && (
                        <span className="text-[9px] text-amber-600">
                          ({logoCount - validCount} missing)
                        </span>
                      )}
                    </div>
                  </div>
                  <Badge variant="outline" className="shrink-0 text-[9px] px-1 py-0">
                    {logoCount} logos
                  </Badge>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setDeleteConfirm(preset)
                  }}
                  className="shrink-0 p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </DropdownMenuItem>
            )
          })}

          {presets.length === 0 && (
            <div className="px-2 py-4 text-center text-xs text-muted-foreground">
              No saved presets yet
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Program Logo Preset?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteConfirm?.name}&quot;? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
