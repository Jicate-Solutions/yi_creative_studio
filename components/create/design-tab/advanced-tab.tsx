'use client'

import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Type,
  Image,
  User,
  LayoutTemplate,
  RotateCcw,
} from 'lucide-react'
import type {
  CustomizationData,
  TitlePosition,
  TitleAlignment,
  FontWeight,
  BackgroundType,
  FooterStyle,
} from '@/lib/config/design-constants'
import { DEFAULT_CUSTOMIZATION } from '@/lib/config/design-constants'
import { SpeakerPhotoUpload } from '@/components/create/speaker-photo-upload'

interface AdvancedTabProps {
  customization: CustomizationData
  onCustomizationChange: (customization: Partial<CustomizationData>) => void
}

export function AdvancedTab({ customization, onCustomizationChange }: AdvancedTabProps) {
  const handleTitleChange = (key: string, value: unknown) => {
    onCustomizationChange({
      title: { ...customization.title, [key]: value },
    })
  }

  const handleBackgroundChange = (key: string, value: unknown) => {
    onCustomizationChange({
      background: { ...customization.background, [key]: value },
    })
  }

  const handleFooterChange = (key: string, value: unknown) => {
    onCustomizationChange({
      footer: { ...customization.footer, [key]: value },
    })
  }

  const handleReset = () => {
    onCustomizationChange(DEFAULT_CUSTOMIZATION)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Fine-tune your poster design with advanced options
        </div>
        <Button variant="ghost" size="sm" onClick={handleReset}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset
        </Button>
      </div>

      <ScrollArea className="h-[420px] pr-4">
        <Accordion type="multiple" defaultValue={['title', 'background']} className="space-y-2">
          {/* Title Customization */}
          <AccordionItem value="title" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline py-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <Type className="h-4 w-4" />
                </div>
                <span className="font-medium">Title Style</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Position</Label>
                  <Select
                    value={customization.title.position}
                    onValueChange={(v) => handleTitleChange('position', v as TitlePosition)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="top">Top</SelectItem>
                      <SelectItem value="center">Center</SelectItem>
                      <SelectItem value="bottom">Bottom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Alignment</Label>
                  <Select
                    value={customization.title.alignment}
                    onValueChange={(v) => handleTitleChange('alignment', v as TitleAlignment)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="left">Left</SelectItem>
                      <SelectItem value="center">Center</SelectItem>
                      <SelectItem value="right">Right</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Font Size: {customization.title.fontSize}px</Label>
                <Slider
                  value={[customization.title.fontSize]}
                  onValueChange={(values: number[]) => handleTitleChange('fontSize', values[0])}
                  min={24}
                  max={72}
                  step={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Font Weight</Label>
                  <Select
                    value={customization.title.fontWeight}
                    onValueChange={(v) => handleTitleChange('fontWeight', v as FontWeight)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="semibold">Semibold</SelectItem>
                      <SelectItem value="bold">Bold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Color</Label>
                  <Input
                    type="color"
                    value={customization.title.color}
                    onChange={(e) => handleTitleChange('color', e.target.value)}
                    className="h-10 p-1"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label>Text Shadow</Label>
                <Switch
                  checked={customization.title.shadow}
                  onCheckedChange={(checked: boolean) => handleTitleChange('shadow', checked)}
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Background Customization */}
          <AccordionItem value="background" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline py-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <Image className="h-4 w-4" />
                </div>
                <span className="font-medium">Background</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-4 space-y-4">
              <div className="space-y-2">
                <Label>Background Type</Label>
                <Select
                  value={customization.background.type}
                  onValueChange={(v) => handleBackgroundChange('type', v as BackgroundType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gradient">Gradient</SelectItem>
                    <SelectItem value="solid">Solid Color</SelectItem>
                    <SelectItem value="pattern">Pattern</SelectItem>
                    <SelectItem value="image">Image</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Primary Color</Label>
                  <Input
                    type="color"
                    value={customization.background.primaryColor}
                    onChange={(e) => handleBackgroundChange('primaryColor', e.target.value)}
                    className="h-10 p-1"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Secondary Color</Label>
                  <Input
                    type="color"
                    value={customization.background.secondaryColor}
                    onChange={(e) => handleBackgroundChange('secondaryColor', e.target.value)}
                    className="h-10 p-1"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label>Overlay</Label>
                <Switch
                  checked={customization.background.overlay}
                  onCheckedChange={(checked: boolean) => handleBackgroundChange('overlay', checked)}
                />
              </div>

              {customization.background.overlay && (
                <div className="space-y-2">
                  <Label>Overlay Opacity: {customization.background.overlayOpacity}%</Label>
                  <Slider
                    value={[customization.background.overlayOpacity]}
                    onValueChange={(values: number[]) => handleBackgroundChange('overlayOpacity', values[0])}
                    min={0}
                    max={100}
                    step={5}
                  />
                </div>
              )}

              <div className="flex items-center justify-between">
                <Label>Blur Effect</Label>
                <Switch
                  checked={customization.background.blur}
                  onCheckedChange={(checked: boolean) => handleBackgroundChange('blur', checked)}
                />
              </div>

              {customization.background.blur && (
                <div className="space-y-2">
                  <Label>Blur Amount: {customization.background.blurAmount}px</Label>
                  <Slider
                    value={[customization.background.blurAmount]}
                    onValueChange={(values: number[]) => handleBackgroundChange('blurAmount', values[0])}
                    min={0}
                    max={20}
                    step={1}
                  />
                </div>
              )}
            </AccordionContent>
          </AccordionItem>

          {/* Speaker Photo Customization */}
          <AccordionItem value="speaker" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline py-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <User className="h-4 w-4" />
                </div>
                <span className="font-medium">Speaker Photo</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              <SpeakerPhotoUpload
                value={customization.speakerPhoto}
                onChange={(data) =>
                  onCustomizationChange({
                    speakerPhoto: { ...customization.speakerPhoto, ...data },
                  })
                }
                compact={true}
              />
            </AccordionContent>
          </AccordionItem>

          {/* Footer Customization */}
          <AccordionItem value="footer" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline py-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <LayoutTemplate className="h-4 w-4" />
                </div>
                <span className="font-medium">Footer</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-4 space-y-4">
              <div className="space-y-2">
                <Label>Footer Style</Label>
                <Select
                  value={customization.footer.style}
                  onValueChange={(v) => handleFooterChange('style', v as FooterStyle)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minimal">Minimal</SelectItem>
                    <SelectItem value="full">Full</SelectItem>
                    <SelectItem value="branded">Branded</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Use Brand Info</Label>
                  <p className="text-xs text-muted-foreground">
                    Include website, phone, email & social from brand settings
                  </p>
                </div>
                <Switch
                  checked={customization.footer.useBrandInfo}
                  onCheckedChange={(checked: boolean) => handleFooterChange('useBrandInfo', checked)}
                />
              </div>

              <div className="space-y-2">
                <Label>Background Color</Label>
                <Input
                  type="color"
                  value={customization.footer.backgroundColor === 'transparent' ? '#000000' : customization.footer.backgroundColor}
                  onChange={(e) => handleFooterChange('backgroundColor', e.target.value)}
                  className="h-10 p-1"
                />
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </ScrollArea>
    </div>
  )
}
