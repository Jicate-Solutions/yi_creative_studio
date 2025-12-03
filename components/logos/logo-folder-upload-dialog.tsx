'use client'

import { useState, useRef, useCallback } from 'react'
import { useLogos } from '@/hooks'
import { LOGO_CATEGORIES, type LogoCategory } from '@/lib/config/constants'
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
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'

interface LogoFolderUploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUploadComplete?: () => void
}

interface FilePreview {
  file: File
  preview: string
  name: string
  detectedCategory: LogoCategory | null
  selectedCategory: LogoCategory
}

export function LogoFolderUploadDialog({
  open,
  onOpenChange,
  onUploadComplete,
}: LogoFolderUploadDialogProps) {
  const { uploadLogosFolder, isLoading, uploadProgress, detectCategoryFromPath } = useLogos()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const folderInputRef = useRef<HTMLInputElement>(null)

  const [files, setFiles] = useState<FilePreview[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [defaultCategory, setDefaultCategory] = useState<LogoCategory>('primary')

  const validTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml']
  // PRD Edge Case E14: Maximum file size 5MB per logo
  const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB in bytes

  const processFiles = useCallback((fileList: FileList | File[]) => {
    const fileArray = Array.from(fileList)

    // PRD Edge Case E14: Filter out oversized files with user notification
    const oversizedFiles = fileArray.filter(file =>
      validTypes.includes(file.type) && file.size > MAX_FILE_SIZE
    )
    if (oversizedFiles.length > 0) {
      toast.error(
        `${oversizedFiles.length} file(s) exceed 5MB limit and were skipped`,
        {
          description: oversizedFiles.slice(0, 3).map(f => f.name).join(', ') +
            (oversizedFiles.length > 3 ? ` and ${oversizedFiles.length - 3} more...` : ''),
          duration: 5000,
        }
      )
    }

    const imageFiles = fileArray.filter(file =>
      validTypes.includes(file.type) && file.size <= MAX_FILE_SIZE
    )

    const newFiles: FilePreview[] = imageFiles.map(file => {
      const path = (file as any).webkitRelativePath || file.name
      const detectedCategory = detectCategoryFromPath(path)
      const categoryLabel = detectedCategory
        ? LOGO_CATEGORIES[detectedCategory]?.label || null
        : null

      return {
        file,
        preview: URL.createObjectURL(file),
        name: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
        detectedCategory: detectedCategory,
        selectedCategory: detectedCategory || defaultCategory,
      }
    })

    setFiles(prev => [...prev, ...newFiles])
  }, [detectCategoryFromPath, defaultCategory])

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

  const updateFileCategory = useCallback((index: number, category: LogoCategory) => {
    setFiles(prev => {
      const newFiles = [...prev]
      newFiles[index] = { ...newFiles[index], selectedCategory: category }
      return newFiles
    })
  }, [])

  const applyDefaultCategory = useCallback(() => {
    setFiles(prev => prev.map(f => ({
      ...f,
      selectedCategory: f.detectedCategory || defaultCategory
    })))
  }, [defaultCategory])

  const handleUpload = async () => {
    if (files.length === 0) return

    const filesToUpload = files.map(f => ({
      file: f.file,
      category: f.selectedCategory,
      name: f.name
    }))

    const result = await uploadLogosFolder(filesToUpload)

    if (result.success > 0) {
      files.forEach(f => URL.revokeObjectURL(f.preview))
      setFiles([])
      onUploadComplete?.()
      onOpenChange(false)
    }
  }

  const handleClose = () => {
    files.forEach(f => URL.revokeObjectURL(f.preview))
    setFiles([])
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Upload Logos</DialogTitle>
          <DialogDescription>
            Upload multiple logos from your computer. You can select a folder or multiple files at once.
          </DialogDescription>
        </DialogHeader>

        {/* Hidden file inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />
        <input
          ref={folderInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
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
                    Supports PNG, JPEG, WebP, GIF, and SVG (max 5MB each)
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
              {/* Default category selector */}
              <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                <span className="text-sm font-medium">Apply to all without category:</span>
                <Select
                  value={defaultCategory}
                  onValueChange={(value) => setDefaultCategory(value as LogoCategory)}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(LOGO_CATEGORIES).map(([value, { label }]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={applyDefaultCategory}
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
                      <div className="aspect-square relative flex items-center justify-center p-4">
                        <img
                          src={file.preview}
                          alt={file.name}
                          className="max-w-full max-h-full object-contain"
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
                        {file.detectedCategory && (
                          <Badge variant="secondary" className="text-xs">
                            Auto: {LOGO_CATEGORIES[file.detectedCategory]?.label}
                          </Badge>
                        )}
                        <Select
                          value={file.selectedCategory}
                          onValueChange={(value) => updateFileCategory(index, value as LogoCategory)}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(LOGO_CATEGORIES).map(([value, { label }]) => (
                              <SelectItem key={value} value={value}>
                                {label}
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
                Upload {files.length} Logo{files.length !== 1 ? 's' : ''}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
