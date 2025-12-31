/**
 * Progressive Loading UI Component
 *
 * Visual progress indicator for streaming image generation
 * Shows 6-stage timeline with real-time updates
 *
 * Phase 2: Streaming Infrastructure
 */

'use client'

import { Brain, Wand2, Image, Layers, User, Upload, Check, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type {
  StreamStage,
  StreamEventData,
  DesignIntelligenceData,
  UltraProData,
  ImageGenerationData,
  LogoOverlayData,
  SpeakerOverlayData,
  STAGE_METADATA,
} from '@/types/streaming.types'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'

interface ProgressiveLoadingUIProps {
  currentStage: StreamStage | null
  progress: number
  stageData: Partial<Record<StreamStage, StreamEventData>>
  className?: string
}

// Stage icon mapping
const STAGE_ICONS: Record<StreamStage, React.ReactNode> = {
  design_intelligence: <Brain className="h-5 w-5" />,
  ultra_pro: <Wand2 className="h-5 w-5" />,
  image_generation: <Image className="h-5 w-5" />,
  logo_overlay: <Layers className="h-5 w-5" />,
  speaker_overlay: <User className="h-5 w-5" />,
  upload: <Upload className="h-5 w-5" />,
}

// Stage labels
const STAGE_LABELS: Record<StreamStage, string> = {
  design_intelligence: 'Analyzing Context',
  ultra_pro: 'Optimizing Prompt',
  image_generation: 'Creating Design',
  logo_overlay: 'Adding Logos',
  speaker_overlay: 'Adding Speaker',
  upload: 'Finalizing',
}

// Stage order for rendering timeline
const STAGE_ORDER: StreamStage[] = [
  'design_intelligence',
  'ultra_pro',
  'image_generation',
  'logo_overlay',
  'speaker_overlay',
  'upload',
]

// Progress ranges for each stage
const STAGE_PROGRESS: Record<StreamStage, number> = {
  design_intelligence: 20,
  ultra_pro: 35,
  image_generation: 70,
  logo_overlay: 85,
  speaker_overlay: 92,
  upload: 100,
}

export function ProgressiveLoadingUI({
  currentStage,
  progress,
  stageData,
  className,
}: ProgressiveLoadingUIProps) {
  /**
   * Determine stage status: completed, current, or pending
   */
  const getStageStatus = (stage: StreamStage): 'completed' | 'current' | 'pending' => {
    if (!currentStage) return 'pending'

    const currentIndex = STAGE_ORDER.indexOf(currentStage)
    const stageIndex = STAGE_ORDER.indexOf(stage)

    if (stageIndex < currentIndex) return 'completed'
    if (stageIndex === currentIndex) return 'current'
    return 'pending'
  }

  /**
   * Render stage-specific preview
   */
  const renderStagePreview = (stage: StreamStage, data?: StreamEventData) => {
    if (!data) return null

    switch (stage) {
      case 'design_intelligence': {
        const designData = data as DesignIntelligenceData
        return (
          <div className="mt-2 flex flex-wrap gap-1">
            {designData.visualElements?.slice(0, 3).map((element, i) => (
              <Badge key={i} variant="secondary" className="text-xs">
                {element}
              </Badge>
            ))}
          </div>
        )
      }

      case 'ultra_pro': {
        const ultraData = data as UltraProData
        return (
          <div className="mt-2 text-sm text-muted-foreground">
            {ultraData.primaryText && (
              <p className="font-medium truncate">&ldquo;{ultraData.primaryText}&rdquo;</p>
            )}
          </div>
        )
      }

      case 'image_generation': {
        const imageData = data as ImageGenerationData
        const elapsed = Math.floor(imageData.elapsedMs / 1000)
        const estimated = imageData.estimatedMs ? Math.floor(imageData.estimatedMs / 1000) : null

        return (
          <div className="mt-2 text-sm text-muted-foreground">
            <p>
              {elapsed}s {estimated && `/ ~${estimated}s`}
            </p>
          </div>
        )
      }

      case 'logo_overlay': {
        const logoData = data as LogoOverlayData
        return (
          <div className="mt-2 text-sm text-muted-foreground">
            <p>{logoData.logosApplied} logos applied</p>
          </div>
        )
      }

      case 'speaker_overlay': {
        const speakerData = data as SpeakerOverlayData
        return (
          <div className="mt-2 text-sm text-muted-foreground">
            <p>{speakerData.speakerCount > 0 ? 'Speaker added' : 'No speaker photo'}</p>
          </div>
        )
      }

      default:
        return null
    }
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Generation Progress</span>
          <span className="text-muted-foreground">{progress}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Stage Timeline */}
      <div className="space-y-4">
        {STAGE_ORDER.map((stage, index) => {
          const status = getStageStatus(stage)
          const data = stageData[stage]
          const isLast = index === STAGE_ORDER.length - 1

          return (
            <div key={stage} className="relative">
              {/* Connector Line */}
              {!isLast && (
                <div
                  className={cn(
                    'absolute left-[18px] top-10 h-full w-0.5 -ml-px',
                    status === 'completed' ? 'bg-primary' : 'bg-border'
                  )}
                />
              )}

              {/* Stage Row */}
              <div className="flex gap-4">
                {/* Icon */}
                <div
                  className={cn(
                    'relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all',
                    status === 'completed' && 'bg-primary border-primary text-primary-foreground',
                    status === 'current' && 'border-primary bg-background text-primary animate-pulse',
                    status === 'pending' && 'border-border bg-muted text-muted-foreground'
                  )}
                >
                  {status === 'completed' ? (
                    <Check className="h-5 w-5" />
                  ) : status === 'current' ? (
                    <div className="relative">
                      {STAGE_ICONS[stage]}
                      <Loader2 className="absolute -top-1 -right-1 h-3 w-3 animate-spin" />
                    </div>
                  ) : (
                    STAGE_ICONS[stage]
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 pb-6">
                  <div className="flex items-center gap-2">
                    <h4
                      className={cn(
                        'font-medium transition-colors',
                        status === 'current' && 'text-foreground',
                        status === 'completed' && 'text-muted-foreground',
                        status === 'pending' && 'text-muted-foreground'
                      )}
                    >
                      {STAGE_LABELS[stage]}
                    </h4>

                    {/* Status Badge */}
                    {status === 'current' && (
                      <Badge variant="outline" className="text-xs">
                        In Progress
                      </Badge>
                    )}
                    {status === 'completed' && (
                      <Badge variant="secondary" className="text-xs bg-primary/10 text-primary">
                        Complete
                      </Badge>
                    )}
                  </div>

                  {/* Stage Preview */}
                  {status !== 'pending' && renderStagePreview(stage, data)}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Current Stage Description */}
      {currentStage && (
        <div className="rounded-lg border border-border bg-muted/50 p-4">
          <p className="text-sm text-muted-foreground">
            {getStageDescription(currentStage)}
          </p>
        </div>
      )}
    </div>
  )
}

/**
 * Get human-readable stage description
 */
function getStageDescription(stage: StreamStage): string {
  const descriptions: Record<StreamStage, string> = {
    design_intelligence: 'Analyzing your event context to understand theme, mood, and visual elements...',
    ultra_pro: 'Optimizing the design prompt for best AI generation results...',
    image_generation: 'Creating your design using AI. This may take up to 15 seconds...',
    logo_overlay: 'Adding your organization logos at the specified positions...',
    speaker_overlay: 'Overlaying speaker photo with the selected shape and position...',
    upload: 'Uploading final image and generating thumbnail for gallery...',
  }

  return descriptions[stage]
}
