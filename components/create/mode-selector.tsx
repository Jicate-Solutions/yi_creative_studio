'use client'

import { cn } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LayoutTemplate, Wand2, Check, ArrowRight } from 'lucide-react'
import type { CreationMode } from '@/types/design.types'

interface ModeSelectorProps {
  mode: CreationMode
  onModeChange: (mode: CreationMode) => void
}

export function ModeSelector({ mode, onModeChange }: ModeSelectorProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>How would you like to create?</CardTitle>
        <CardDescription>
          Choose between using a pre-designed template or generating from scratch with full customization
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Template Mode */}
          <button
            onClick={() => onModeChange('template')}
            className={cn(
              'relative flex flex-col p-6 rounded-xl border-2 text-left transition-all',
              mode === 'template'
                ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                : 'border-border hover:border-primary/50 hover:bg-muted/50'
            )}
          >
            {mode === 'template' && (
              <div className="absolute top-4 right-4">
                <div className="p-1 rounded-full bg-primary">
                  <Check className="h-4 w-4 text-primary-foreground" />
                </div>
              </div>
            )}

            <div
              className={cn(
                'p-4 rounded-xl mb-4 w-fit',
                mode === 'template' ? 'bg-primary/10' : 'bg-muted'
              )}
            >
              <LayoutTemplate
                className={cn(
                  'h-8 w-8',
                  mode === 'template' ? 'text-primary' : 'text-muted-foreground'
                )}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">Use Template</h3>
                <Badge variant="secondary" className="text-xs">Quick</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Choose from professionally designed templates and customize the content.
                Perfect for quick and consistent results.
              </p>
            </div>

            <div className="flex items-center gap-2 mt-4 text-sm">
              <ArrowRight className={cn(
                'h-4 w-4',
                mode === 'template' ? 'text-primary' : 'text-muted-foreground'
              )} />
              <span className="text-muted-foreground">Select template, fill details, generate</span>
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              <Badge variant="outline" className="text-xs">Pre-designed layouts</Badge>
              <Badge variant="outline" className="text-xs">Consistent style</Badge>
              <Badge variant="outline" className="text-xs">Faster creation</Badge>
            </div>
          </button>

          {/* Scratch Mode */}
          <button
            onClick={() => onModeChange('scratch')}
            className={cn(
              'relative flex flex-col p-6 rounded-xl border-2 text-left transition-all',
              mode === 'scratch'
                ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                : 'border-border hover:border-primary/50 hover:bg-muted/50'
            )}
          >
            {mode === 'scratch' && (
              <div className="absolute top-4 right-4">
                <div className="p-1 rounded-full bg-primary">
                  <Check className="h-4 w-4 text-primary-foreground" />
                </div>
              </div>
            )}

            <div
              className={cn(
                'p-4 rounded-xl mb-4 w-fit',
                mode === 'scratch' ? 'bg-primary/10' : 'bg-muted'
              )}
            >
              <Wand2
                className={cn(
                  'h-8 w-8',
                  mode === 'scratch' ? 'text-primary' : 'text-muted-foreground'
                )}
              />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Generate from Scratch</h3>
              <p className="text-sm text-muted-foreground">
                Full creative control with themes, styles, and advanced customization.
                Generate unique designs based on your preferences.
              </p>
            </div>

            <div className="flex items-center gap-2 mt-4 text-sm">
              <ArrowRight className={cn(
                'h-4 w-4',
                mode === 'scratch' ? 'text-primary' : 'text-muted-foreground'
              )} />
              <span className="text-muted-foreground">Choose design options, fill details, generate</span>
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              <Badge variant="outline" className="text-xs">22+ themes</Badge>
              <Badge variant="outline" className="text-xs">16 styles</Badge>
              <Badge variant="outline" className="text-xs">Full customization</Badge>
            </div>
          </button>
        </div>
      </CardContent>
    </Card>
  )
}
