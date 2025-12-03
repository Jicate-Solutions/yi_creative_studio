'use client'

import { cn } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LayoutTemplate, Wand2, Check, ArrowRight, Sparkles } from 'lucide-react'
import type { CreationMode } from '@/types/design.types'

interface ModeSelectorProps {
  mode: CreationMode
  onModeChange: (mode: CreationMode) => void
}

export function ModeSelector({ mode, onModeChange }: ModeSelectorProps) {
  return (
    <Card className="border-0 shadow-none bg-transparent">
      <CardHeader className="px-0">
        <CardTitle className="flex items-center gap-2 text-xl">
          <Sparkles className="h-5 w-5 text-[#1B998B]" />
          How would you like to create?
        </CardTitle>
        <CardDescription className="text-base">
          Choose between using a pre-designed template or generating from scratch with full customization
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Template Mode */}
          <button
            onClick={() => onModeChange('template')}
            className={cn(
              'group relative flex flex-col p-6 rounded-2xl border-2 text-left',
              'transition-all duration-300 ease-out',
              mode === 'template'
                ? 'border-2 border-[#1B998B] bg-gradient-to-br from-[#1B998B]/5 to-[#005B96]/5 scale-[1.02]'
                : 'border-gray-200 hover:border-[#1B998B]/50 hover:scale-[1.01] bg-white'
            )}
          >
            {/* Selection Checkmark */}
            {mode === 'template' && (
              <div className="absolute top-4 right-4 animate-in zoom-in duration-200">
                <div className="p-1.5 rounded-full bg-gradient-to-r from-[#005B96] to-[#1B998B]">
                  <Check className="h-4 w-4 text-white" />
                </div>
              </div>
            )}

            {/* Icon */}
            <div
              className={cn(
                'p-4 rounded-2xl mb-4 w-fit transition-all duration-300',
                mode === 'template'
                  ? 'bg-gradient-to-br from-[#005B96] to-[#1B998B]'
                  : 'bg-gray-100 group-hover:bg-gradient-to-br group-hover:from-[#005B96]/10 group-hover:to-[#1B998B]/10'
              )}
            >
              <LayoutTemplate
                className={cn(
                  'h-8 w-8 transition-colors duration-300',
                  mode === 'template' ? 'text-white' : 'text-gray-500 group-hover:text-[#1B998B]'
                )}
              />
            </div>

            {/* Content */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-gray-900">Use Template</h3>
                <Badge className="text-xs bg-gradient-to-r from-[#1B998B] to-[#22c55e] text-white border-0 shadow-sm">
                  Quick
                </Badge>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed">
                Choose from professionally designed templates and customize the content.
                Perfect for quick and consistent results.
              </p>
            </div>

            {/* Workflow Indicator */}
            <div className="flex items-center gap-2 mt-4 text-sm">
              <ArrowRight
                className={cn(
                  'h-4 w-4 transition-all duration-300',
                  mode === 'template'
                    ? 'text-[#1B998B] translate-x-0.5'
                    : 'text-gray-400 group-hover:text-[#1B998B] group-hover:translate-x-0.5'
                )}
              />
              <span className="text-gray-500">Select template, fill details, generate</span>
            </div>

            {/* Feature Badges */}
            <div className="flex flex-wrap gap-2 mt-4">
              <Badge className="text-xs bg-[#1B998B]/10 text-[#1B998B] border border-[#1B998B]/20 hover:bg-[#1B998B]/20 transition-colors">
                Pre-designed layouts
              </Badge>
              <Badge className="text-xs bg-[#005B96]/10 text-[#005B96] border border-[#005B96]/20 hover:bg-[#005B96]/20 transition-colors">
                Consistent style
              </Badge>
              <Badge className="text-xs bg-amber-500/10 text-amber-600 border border-amber-500/20 hover:bg-amber-500/20 transition-colors">
                Faster creation
              </Badge>
            </div>
          </button>

          {/* Scratch Mode */}
          <button
            onClick={() => onModeChange('scratch')}
            className={cn(
              'group relative flex flex-col p-6 rounded-2xl border-2 text-left',
              'transition-all duration-300 ease-out',
              mode === 'scratch'
                ? 'border-2 border-[#1B998B] bg-gradient-to-br from-[#1B998B]/5 to-[#005B96]/5 scale-[1.02]'
                : 'border-gray-200 hover:border-[#1B998B]/50 hover:scale-[1.01] bg-white'
            )}
          >
            {/* Selection Checkmark */}
            {mode === 'scratch' && (
              <div className="absolute top-4 right-4 animate-in zoom-in duration-200">
                <div className="p-1.5 rounded-full bg-gradient-to-r from-[#005B96] to-[#1B998B]">
                  <Check className="h-4 w-4 text-white" />
                </div>
              </div>
            )}

            {/* Icon */}
            <div
              className={cn(
                'p-4 rounded-2xl mb-4 w-fit transition-all duration-300',
                mode === 'scratch'
                  ? 'bg-gradient-to-br from-[#005B96] to-[#1B998B]'
                  : 'bg-gray-100 group-hover:bg-gradient-to-br group-hover:from-[#005B96]/10 group-hover:to-[#1B998B]/10'
              )}
            >
              <Wand2
                className={cn(
                  'h-8 w-8 transition-colors duration-300',
                  mode === 'scratch' ? 'text-white' : 'text-gray-500 group-hover:text-[#1B998B]'
                )}
              />
            </div>

            {/* Content */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900">Generate from Scratch</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Full creative control with themes, styles, and advanced customization.
                Generate unique designs based on your preferences.
              </p>
            </div>

            {/* Workflow Indicator */}
            <div className="flex items-center gap-2 mt-4 text-sm">
              <ArrowRight
                className={cn(
                  'h-4 w-4 transition-all duration-300',
                  mode === 'scratch'
                    ? 'text-[#1B998B] translate-x-0.5'
                    : 'text-gray-400 group-hover:text-[#1B998B] group-hover:translate-x-0.5'
                )}
              />
              <span className="text-gray-500">Choose design options, fill details, generate</span>
            </div>

            {/* Feature Badges */}
            <div className="flex flex-wrap gap-2 mt-4">
              <Badge className="text-xs bg-purple-500/10 text-purple-600 border border-purple-500/20 hover:bg-purple-500/20 transition-colors">
                22+ themes
              </Badge>
              <Badge className="text-xs bg-pink-500/10 text-pink-600 border border-pink-500/20 hover:bg-pink-500/20 transition-colors">
                16 styles
              </Badge>
              <Badge className="text-xs bg-[#1B998B]/10 text-[#1B998B] border border-[#1B998B]/20 hover:bg-[#1B998B]/20 transition-colors">
                Full customization
              </Badge>
            </div>
          </button>
        </div>
      </CardContent>
    </Card>
  )
}
