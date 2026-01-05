'use client'

import { useState } from 'react'
import { LOGO_CATEGORIES, type LogoCategory } from '@/lib/config/constants'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, Upload } from 'lucide-react'
import { toast } from 'sonner'

interface LogoUploadDialogProps {
  children: React.ReactNode
  onUpload: (file: File, name: string, category: LogoCategory) => Promise<void>
}

export function LogoUploadDialog({ children, onUpload }: LogoUploadDialogProps) {
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [name, setName] = useState('')
  const [category, setCategory] = useState<LogoCategory>('primary')
  const [isUploading, setIsUploading] = useState(false)

  const validTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml']
  const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    if (!validTypes.includes(selectedFile.type)) {
      toast.error('Invalid file type. Please upload an image file.')
      return
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      toast.error('File size exceeds 5MB limit.')
      return
    }

    setFile(selectedFile)
    // Auto-populate name from filename
    const fileName = selectedFile.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ')
    setName(fileName)
  }

  const handleUpload = async () => {
    if (!file || !name.trim()) {
      toast.error('Please select a file and provide a name.')
      return
    }

    setIsUploading(true)
    try {
      await onUpload(file, name.trim(), category)
      toast.success('Logo uploaded successfully!')
      handleClose()
    } catch (error) {
      toast.error('Failed to upload logo.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleClose = () => {
    setFile(null)
    setName('')
    setCategory('primary')
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Upload Logo</DialogTitle>
          <DialogDescription>
            Upload a logo to your library. Supports PNG, JPEG, WebP, GIF, and SVG (max 5MB).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="file">Logo File</Label>
            <Input
              id="file"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
              onChange={handleFileChange}
              className="mt-1"
            />
            {file && (
              <p className="text-sm text-muted-foreground mt-1">
                Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="name">Logo Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter logo name"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="category">Category</Label>
            <Select
              value={category}
              onValueChange={(value) => setCategory(value as LogoCategory)}
            >
              <SelectTrigger className="mt-1">
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

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isUploading}>
            Cancel
          </Button>
          <Button onClick={handleUpload} disabled={!file || !name.trim() || isUploading}>
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload Logo
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
