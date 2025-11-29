'use client'

import { useState, useRef, useCallback } from 'react'
import { useTemplateImages } from '@/hooks/use-template-images'
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
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  Upload,
  FolderOpen,
  Image as ImageIcon,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react'

interface FolderUploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUploadComplete?: () => void
}

interface FilePreview {
  file: File
  preview: string
  name: string
  detectedVertical: string | null
  selectedVerticalId: string | null
}

export function FolderUploadDialog({
  open,
  onOpenChange,
  onUploadComplete,
}: FolderUploadDialogProps) {
  const { uploadTemplateFolder, isLoading, uploadProgress } = useTemplateImages()
  const { verticals } = useVerticals()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const folderInputRef = useRef<HTMLInputElement>(null)

  const [files, setFiles] = useState<FilePreview[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [defaultVerticalId, setDefaultVerticalId] = useState<string | null>(null)

  const validTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']

  const detectVerticalFromPath = useCallback((path: string): string | null => {
    const pathParts = path.split('/')
    if (pathParts.length > 1) {
      const folderName = pathParts[pathParts.length - 2].toLowerCase().replace(/[^a-z0-9]/g, '-')
      const matchedVertical = verticals.find(v =>
        v.slug.toLowerCase() === folderName ||
        v.name.toLowerCase().replace(/[^a-z0-9]/g, '-') === folderName
      )
      return matchedVertical?.id || null
    }
    return null
  }, [verticals])

  const processFiles = useCallback((fileList: FileList | File[]) => {
    const fileArray = Array.from(fileList)
    const imageFiles = fileArray.filter(file => validTypes.includes(file.type))

    const newFiles: FilePreview[] = imageFiles.map(file => {
      const path = (file as any).webkitRelativePath || file.name
      const detectedVerticalId = detectVerticalFromPath(path)
      const detectedVertical = detectedVerticalId
        ? verticals.find(v => v.id === detectedVerticalId)?.name || null
        : null

      return {
        file,
        preview: URL.createObjectURL(file),
        name: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
        detectedVertical,
        selectedVerticalId: detectedVerticalId,
      }
    })

    setFiles(prev => [...prev, ...newFiles])
  }, [detectVerticalFromPath, verticals])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    if (e.dataTransfer.files) {
      processFiles(e.dataTransfer.files)
    }
  }, [processFiles])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files)
    }
  }, [processFiles])

  const removeFile = useCallback((index: number) => {
    setFiles(prev => {
      const newFiles = [...prev]
      URL.revokeObjectURL(newFiles[index].preview)
      newFiles.splice(index, 1)
      return newFiles
    })
  }, [])

  const updateFileVertical = useCallback((index: number, verticalId: string | null) => {
    setFiles(prev => {
      const newFiles = [...prev]
      newFiles[index] = { ...newFiles[index], selectedVerticalId: verticalId }
      return newFiles
    })
  }, [])

  const applyDefaultVertical = useCallback(() => {
    if (!defaultVerticalId) return
    setFiles(prev => prev.map(f => ({
      ...f,
      selectedVerticalId: f.selectedVerticalId || defaultVerticalId
    })))
  }, [defaultVerticalId])

  const handleUpload = async () => {
    if (files.length === 0) return

    // Create a FileList-like array with vertical info attached
    const filesToUpload = files.map(f => f.file)

    const result = await uploadTemplateFolder(filesToUpload, verticals)

    if (result.success > 0) {
      // Clean up previews
      files.forEach(f => URL.revokeObjectURL(f.preview))
      setFiles([])
      onUploadComplete?.()
      onOpenChange(false)
    }
  }

  const handleClose = () => {
    // Clean up previews
    files.forEach(f => URL.revokeObjectURL(f.preview))
    setFiles([])
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Upload Template Images</DialogTitle>
          <DialogDescription>
            Upload template images from your computer. You can select a folder to upload multiple templates at once.
          </DialogDescription>
        </DialogHeader>

        {/* Hidden file inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />
        <input
          ref={folderInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          multiple
          // @ts-ignore - webkitdirectory is not in the types
          webkitdirectory=""
          directory=""
          className="hidden"
          onChange={handleFileSelect}
        />

        <div className="space-y-4">
          {/* Drop zone */}
          {files.length === 0 && (
            <div
              className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
                isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25",
                "hover:border-primary/50 cursor-pointer"
              )}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => folderInputRef.current?.click()}
            >
              <div className="flex flex-col items-center gap-4">
                <div className="p-4 rounded-full bg-muted">
                  <FolderOpen className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-lg font-medium">
                    Drop a folder here or click to browse
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Supports PNG, JPEG, WebP, and GIF (max 10MB each)
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation()
                      folderInputRef.current?.click()
                    }}
                  >
                    <FolderOpen className="h-4 w-4 mr-2" />
                    Select Folder
                  </Button>
                  <Button
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation()
                      fileInputRef.current?.click()
                    }}
                  >
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Select Files
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* File previews */}
          {files.length > 0 && (
            <>
              {/* Default vertical selector */}
              <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                <span className="text-sm font-medium">Apply to all without vertical:</span>
                <Select
                  value={defaultVerticalId || ''}
                  onValueChange={(value) => setDefaultVerticalId(value || null)}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select vertical" />
                  </SelectTrigger>
                  <SelectContent>
                    {verticals.map((vertical) => (
                      <SelectItem key={vertical.id} value={vertical.id}>
                        {vertical.icon} {vertical.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={applyDefaultVertical}
                  disabled={!defaultVerticalId}
                >
                  Apply
                </Button>
                <div className="flex-1" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    files.forEach(f => URL.revokeObjectURL(f.preview))
                    setFiles([])
                  }}
                >
                  Clear All
                </Button>
              </div>

              <ScrollArea className="h-[300px] pr-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className="relative group border rounded-lg overflow-hidden bg-muted/30"
                    >
                      {/* Preview image */}
                      <div className="aspect-[4/5] relative">
                        <img
                          src={file.preview}
                          alt={file.name}
                          className="w-full h-full object-cover"
                        />
                        {/* Remove button */}
                        <button
                          onClick={() => removeFile(index)}
                          className="absolute top-2 right-2 p-1 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      {/* File info */}
                      <div className="p-2 space-y-2">
                        <p className="text-xs font-medium truncate" title={file.name}>
                          {file.name}
                        </p>
                        {file.detectedVertical && (
                          <Badge variant="secondary" className="text-xs">
                            Auto: {file.detectedVertical}
                          </Badge>
                        )}
                        <Select
                          value={file.selectedVerticalId || '__none__'}
                          onValueChange={(value) => updateFileVertical(index, value === '__none__' ? null : value)}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Select vertical" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">No vertical</SelectItem>
                            {verticals.map((vertical) => (
                              <SelectItem key={vertical.id} value={vertical.id}>
                                {vertical.icon} {vertical.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Upload progress */}
              {uploadProgress && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Uploading: {uploadProgress.fileName}</span>
                    <span>{uploadProgress.current} / {uploadProgress.total}</span>
                  </div>
                  <Progress
                    value={(uploadProgress.current / uploadProgress.total) * 100}
                  />
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={files.length === 0 || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload {files.length} Template{files.length !== 1 ? 's' : ''}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
