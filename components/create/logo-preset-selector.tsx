'use client'

import { useState } from 'react'
import { Star, ChevronDown, Trash2, Settings2 } from 'lucide-react'
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
import { useLogoPresets } from '@/hooks/use-logo-presets'
import { useCreativeStore } from '@/stores/creative-store'
import type { LogoPreset } from '@/types/logo-presets'
import { cn } from '@/lib/utils'

interface LogoPresetSelectorProps {
  onSaveClick: () => void
  className?: string
}

export function LogoPresetSelector({ onSaveClick, className }: LogoPresetSelectorProps) {
  const { presets, defaultPreset, isLoading, deletePreset, setDefault, unsetDefault } = useLogoPresets()
  const { applyLogoPreset, formData } = useCreativeStore()
  const [deleteConfirm, setDeleteConfirm] = useState<LogoPreset | null>(null)

  const currentPlacementCount = formData.logosPlacements.length

  const handleApplyPreset = (preset: LogoPreset) => {
    applyLogoPreset(preset)
  }

  const handleDelete = async () => {
    if (deleteConfirm) {
      await deletePreset(deleteConfirm.id)
      setDeleteConfirm(null)
    }
  }

  const handleToggleDefault = async (preset: LogoPreset, e: React.MouseEvent) => {
    e.stopPropagation()
    if (preset.is_default) {
      await unsetDefault()
    } else {
      await setDefault(preset.id)
    }
  }

  if (presets.length === 0 && !isLoading) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={onSaveClick}
        disabled={currentPlacementCount === 0}
        className={cn('gap-2', className)}
      >
        <Settings2 className="h-4 w-4" />
        Save Configuration
      </Button>
    )
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2" disabled={isLoading}>
            <Settings2 className="h-4 w-4" />
            <span className="hidden sm:inline">Saved Configs</span>
            <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
              {presets.length}
            </Badge>
            <ChevronDown className="h-3 w-3 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuLabel className="flex items-center justify-between">
            <span>Saved Configurations</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={onSaveClick}
              disabled={currentPlacementCount === 0}
            >
              + Save New
            </Button>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          {presets.map((preset) => (
            <DropdownMenuItem
              key={preset.id}
              className="flex items-center justify-between gap-2 cursor-pointer"
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
                  <Star className={cn('h-3.5 w-3.5', preset.is_default && 'fill-current')} />
                </button>
                <div className="min-w-0 flex-1">
                  <div className="font-medium truncate text-sm">{preset.name}</div>
                  {preset.description && (
                    <div className="text-xs text-muted-foreground truncate">
                      {preset.description}
                    </div>
                  )}
                </div>
                <Badge variant="outline" className="shrink-0 text-[10px] px-1.5 py-0">
                  {preset.placements.length} logos
                </Badge>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setDeleteConfirm(preset)
                }}
                className="shrink-0 p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </DropdownMenuItem>
          ))}

          {presets.length === 0 && (
            <div className="px-2 py-4 text-center text-sm text-muted-foreground">
              No saved configurations yet
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Configuration?</AlertDialogTitle>
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
