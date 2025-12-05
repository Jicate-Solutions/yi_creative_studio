'use client'

import { useState } from 'react'
import { useVerticals } from '@/hooks/use-verticals'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { X, Loader2, Save, Globe, Lock } from 'lucide-react'
import { toast } from 'sonner'

interface SaveTemplateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  creativeId: string
  previewImageUrl: string
  formData: Record<string, unknown>
  logoConfig: unknown[]
  currentVertical?: string
  onSaveComplete?: (templateId: string) => void
}

const TEMPLATE_CATEGORIES = [
  { value: 'event_poster', label: 'Event Poster' },
  { value: 'social_post', label: 'Social Post' },
  { value: 'banner', label: 'Banner' },
  { value: 'announcement', label: 'Announcement' },
  { value: 'custom', label: 'Custom' },
]

export function SaveTemplateDialog({
  open,
  onOpenChange,
  creativeId,
  previewImageUrl,
  formData,
  logoConfig,
  currentVertical,
  onSaveComplete,
}: SaveTemplateDialogProps) {
  const { verticals } = useVerticals()
  const [isLoading, setIsLoading] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<string>('event_poster')
  const [verticalId, setVerticalId] = useState<string | null>(
    currentVertical || null
  )
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [isPublic, setIsPublic] = useState(false)

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim().toLowerCase()
    if (trimmedTag && !tags.includes(trimmedTag) && tags.length < 5) {
      setTags([...tags, trimmedTag])
      setTagInput('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove))
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTag()
    }
  }

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Please enter a template name')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/templates/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          category,
          vertical: verticalId,
          formData,
          logoConfig,
          previewImageUrl,
          sourceCreativeId: creativeId,
          isPublic,
          tags,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save template')
      }

      toast.success('Template saved successfully!')
      onSaveComplete?.(data.template.id)
      handleClose()
    } catch (error) {
      console.error('Error saving template:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to save template')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    // Reset form
    setName('')
    setDescription('')
    setCategory('event_poster')
    setVerticalId(currentVertical || null)
    setTags([])
    setTagInput('')
    setIsPublic(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Save as Template</DialogTitle>
          <DialogDescription>
            Save this creative as a reusable template. Templates can be used to quickly create new designs with the same settings.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-[180px,1fr] gap-6">
          {/* Preview */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Preview</Label>
            <div className="aspect-[4/5] rounded-lg overflow-hidden border bg-muted">
              {previewImageUrl ? (
                <img
                  src={previewImageUrl}
                  alt="Template preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  No preview
                </div>
              )}
            </div>
          </div>

          {/* Form fields */}
          <div className="space-y-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="template-name">
                Template Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="template-name"
                placeholder="e.g., Annual Conference Poster"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={100}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="template-description">Description</Label>
              <Textarea
                id="template-description"
                placeholder="Brief description of when to use this template..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                maxLength={500}
              />
            </div>

            {/* Category and Vertical */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {TEMPLATE_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Vertical</Label>
                <Select
                  value={verticalId || '__none__'}
                  onValueChange={(value) =>
                    setVerticalId(value === '__none__' ? null : value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select vertical" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">General (No vertical)</SelectItem>
                    {verticals.map((vertical) => (
                      <SelectItem key={vertical.id} value={vertical.id}>
                        {vertical.icon} {vertical.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label htmlFor="template-tags">Tags (up to 5)</Label>
              <div className="flex gap-2">
                <Input
                  id="template-tags"
                  placeholder="Add a tag..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={tags.length >= 5}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddTag}
                  disabled={tags.length >= 5 || !tagInput.trim()}
                >
                  Add
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="pr-1 gap-1"
                    >
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Public toggle */}
            <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
              <div className="flex items-center gap-3">
                {isPublic ? (
                  <Globe className="h-5 w-5 text-primary" />
                ) : (
                  <Lock className="h-5 w-5 text-muted-foreground" />
                )}
                <div>
                  <p className="text-sm font-medium">
                    {isPublic ? 'Public Template' : 'Private Template'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isPublic
                      ? 'Anyone in your organization can use this template'
                      : 'Only you can see and use this template'}
                  </p>
                </div>
              </div>
              <Switch checked={isPublic} onCheckedChange={setIsPublic} />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading || !name.trim()}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Template
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
