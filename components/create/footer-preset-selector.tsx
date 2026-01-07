'use client'

import { useState } from 'react'
import { Star, ChevronDown, Trash2, Bookmark, Hash, Globe, AtSign } from 'lucide-react'
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
import { useFooterPresets } from '@/hooks/use-footer-presets'
import { useCreativeStore } from '@/stores/creative-store'
import type { FooterPresetRow } from '@/types/footer-presets'
import { cn } from '@/lib/utils'

interface FooterPresetSelectorProps {
  onSaveClick: () => void
  className?: string
}

export function FooterPresetSelector({ onSaveClick, className }: FooterPresetSelectorProps) {
  const { presets, isLoading, deletePreset, setDefault, unsetDefault } = useFooterPresets()
  const { applyFooterPreset, formData } = useCreativeStore()
  const [deleteConfirm, setDeleteConfirm] = useState<FooterPresetRow | null>(null)

  const footerConfig = formData.enhanced4RowStrip.footer

  // Count enabled features for the current configuration
  const currentEnabledCount = [
    footerConfig.hashtag.enabled && footerConfig.hashtag.text.trim(),
    footerConfig.website.enabled && footerConfig.website.url.trim(),
    footerConfig.website.socialHandle?.trim(),
    footerConfig.digitalPartner.enabled,
  ].filter(Boolean).length

  const handleApplyPreset = (preset: FooterPresetRow) => {
    applyFooterPreset(preset)
  }

  const handleDelete = async () => {
    if (deleteConfirm) {
      await deletePreset(deleteConfirm.id)
      setDeleteConfirm(null)
    }
  }

  const handleToggleDefault = async (preset: FooterPresetRow, e: React.MouseEvent) => {
    e.stopPropagation()
    if (preset.is_default) {
      await unsetDefault()
    } else {
      await setDefault(preset.id)
    }
  }

  // Get preview info for a preset
  const getPresetPreview = (preset: FooterPresetRow) => {
    const config = preset.config
    const items: string[] = []

    if (config.hashtag?.text?.trim()) {
      items.push(config.hashtag.text.trim())
    }
    if (config.website?.url?.trim()) {
      items.push(config.website.url)
    }
    if (config.website?.socialHandle?.trim()) {
      items.push(`@${config.website.socialHandle.replace('@', '')}`)
    }

    return items.slice(0, 2).join(' • ') || 'Footer configuration'
  }

  // Count features in a preset
  const getPresetFeatureCount = (preset: FooterPresetRow) => {
    const config = preset.config
    return [
      config.hashtag?.text?.trim(),
      config.website?.url?.trim(),
      config.website?.socialHandle?.trim(),
      config.digitalPartner?.enabled,
    ].filter(Boolean).length
  }

  if (presets.length === 0 && !isLoading) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={onSaveClick}
        disabled={currentEnabledCount === 0}
        className={cn('gap-2', className)}
      >
        <Bookmark className="h-4 w-4" />
        Save Footer
      </Button>
    )
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2" disabled={isLoading}>
            <Bookmark className="h-4 w-4" />
            <span className="hidden sm:inline">Presets</span>
            <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
              {presets.length}
            </Badge>
            <ChevronDown className="h-3 w-3 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-72">
          <DropdownMenuLabel className="flex items-center justify-between">
            <span>Footer Presets</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={onSaveClick}
              disabled={currentEnabledCount === 0}
            >
              + Save Current
            </Button>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          {presets.map((preset) => (
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
                  <Star className={cn('h-3.5 w-3.5', preset.is_default && 'fill-current')} />
                </button>
                <div className="min-w-0 flex-1">
                  <div className="font-medium truncate text-sm">{preset.name}</div>
                  <div className="text-[11px] text-muted-foreground truncate flex items-center gap-1">
                    {preset.config.hashtag?.text && (
                      <span className="flex items-center gap-0.5">
                        <Hash className="h-2.5 w-2.5" />
                        {preset.config.hashtag.text.replace('#', '').slice(0, 10)}
                      </span>
                    )}
                    {preset.config.website?.socialHandle && (
                      <span className="flex items-center gap-0.5">
                        <AtSign className="h-2.5 w-2.5" />
                        {preset.config.website.socialHandle.replace('@', '').slice(0, 10)}
                      </span>
                    )}
                  </div>
                </div>
                <Badge variant="outline" className="shrink-0 text-[10px] px-1.5 py-0">
                  {getPresetFeatureCount(preset)} items
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
              No saved footer presets yet
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Footer Preset?</AlertDialogTitle>
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
