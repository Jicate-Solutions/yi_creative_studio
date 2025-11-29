'use client'

import { useCreativeStore } from '@/stores/creative-store'
import { useLogos } from '@/hooks'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { X, Plus, Image as ImageIcon } from 'lucide-react'
import { LOGO_POSITIONS, type LogoPosition } from '@/lib/config/constants'

const POSITION_LABELS: Record<LogoPosition, string> = {
  'top-left': 'Top Left',
  'top-center': 'Top Center',
  'top-right': 'Top Right',
  'mid-left': 'Mid Left',
  'center': 'Center',
  'mid-right': 'Mid Right',
  'bottom-left': 'Bottom Left',
  'bottom-center': 'Bottom Center',
  'bottom-right': 'Bottom Right',
}

export function LogoPositionGrid() {
  const { logos } = useLogos()
  const {
    formData,
    addLogoPlacement,
    removeLogoPlacement,
    updateLogoPosition,
  } = useCreativeStore()

  const placedPositions = formData.logosPlacements.map((p) => p.position)

  const getLogoAtPosition = (position: LogoPosition) => {
    return formData.logosPlacements.find((p) => p.position === position)
  }

  const handlePositionClick = (position: LogoPosition) => {
    const existing = getLogoAtPosition(position)

    if (existing) {
      removeLogoPlacement(existing.logoId)
    }
  }

  const handleAddLogo = (logoId: string) => {
    // Find first available position
    const availablePosition = LOGO_POSITIONS.find(
      (pos) => !placedPositions.includes(pos)
    )

    if (availablePosition) {
      addLogoPlacement(logoId, availablePosition)
    }
  }

  return (
    <div className="space-y-6">
      {/* Grid Preview */}
      <div className="relative aspect-[4/5] max-w-sm mx-auto bg-muted rounded-lg border-2 border-dashed">
        <div className="absolute inset-4 grid grid-cols-3 grid-rows-3 gap-2">
          {LOGO_POSITIONS.map((position) => {
            const placement = getLogoAtPosition(position)
            const logo = placement?.logo || logos.find((l) => l.id === placement?.logoId)

            return (
              <button
                key={position}
                onClick={() => handlePositionClick(position)}
                className={cn(
                  'rounded-lg border-2 border-dashed transition-all flex items-center justify-center text-xs',
                  placement
                    ? 'border-primary bg-primary/10 hover:bg-primary/20'
                    : 'border-muted-foreground/30 hover:border-primary/50 hover:bg-muted-foreground/5'
                )}
              >
                {logo ? (
                  <div className="relative w-full h-full p-2">
                    <img
                      src={logo.thumbnail_url || logo.file_url}
                      alt={logo.name}
                      className="w-full h-full object-contain"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        removeLogoPlacement(logo.id)
                      }}
                      className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-white flex items-center justify-center"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <span className="text-muted-foreground/50">
                    {POSITION_LABELS[position].split(' ')[0]}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Available Logos */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium">Available Logos</h4>
          <Badge variant="secondary">
            {formData.logosPlacements.length} / 9 placed
          </Badge>
        </div>

        {logos.length > 0 ? (
          <div className="grid grid-cols-4 gap-3">
            {logos.map((logo) => {
              const isPlaced = formData.logosPlacements.some(
                (p) => p.logoId === logo.id
              )

              return (
                <button
                  key={logo.id}
                  onClick={() => !isPlaced && handleAddLogo(logo.id)}
                  disabled={isPlaced || placedPositions.length >= 9}
                  className={cn(
                    'aspect-square rounded-lg border-2 p-2 transition-all',
                    isPlaced
                      ? 'border-primary bg-primary/5 opacity-50 cursor-not-allowed'
                      : 'border-border hover:border-primary hover:bg-primary/5'
                  )}
                >
                  <img
                    src={logo.thumbnail_url || logo.file_url}
                    alt={logo.name}
                    className="w-full h-full object-contain"
                  />
                </button>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No logos uploaded yet</p>
            <p className="text-xs">Upload logos in Settings &rarr; Logo Management</p>
          </div>
        )}
      </div>

      {/* Selected Logos List */}
      {formData.logosPlacements.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium">Placed Logos</h4>
          {formData.logosPlacements.map((placement) => {
            const logo = placement.logo || logos.find((l) => l.id === placement.logoId)
            if (!logo) return null

            return (
              <div
                key={placement.logoId}
                className="flex items-center justify-between p-2 rounded-lg bg-muted"
              >
                <div className="flex items-center gap-2">
                  <img
                    src={logo.thumbnail_url || logo.file_url}
                    alt={logo.name}
                    className="w-8 h-8 object-contain"
                  />
                  <span className="text-sm font-medium">{logo.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={placement.position}
                    onValueChange={(pos) =>
                      updateLogoPosition(placement.logoId, pos as LogoPosition)
                    }
                  >
                    <SelectTrigger className="w-[140px] h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LOGO_POSITIONS.map((pos) => (
                        <SelectItem
                          key={pos}
                          value={pos}
                          disabled={
                            placedPositions.includes(pos) &&
                            pos !== placement.position
                          }
                        >
                          {POSITION_LABELS[pos]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => removeLogoPlacement(placement.logoId)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
