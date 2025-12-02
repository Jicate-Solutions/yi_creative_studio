'use client'

import { useState, useRef } from 'react'
import { useLogos } from '@/hooks'
import { useAuthStore } from '@/stores/auth-store'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import {
  Upload,
  Loader2,
  Image as ImageIcon,
  MoreVertical,
  Trash2,
  Star,
  Plus,
  CheckCircle2,
  FolderOpen,
} from 'lucide-react'
import { LOGO_CATEGORIES, type LogoCategory } from '@/lib/config/constants'
import { LogoFolderUploadDialog } from '@/components/logos/logo-folder-upload-dialog'

export default function LogoManagementPage() {
  const {
    logos,
    isLoading,
    uploadLogo,
    deleteLogo,
    setDefaultLogo,
    getLogosByCategory,
  } = useLogos()
  const { canManage } = useAuthStore()

  const isAdmin = canManage()
  const [isUploading, setIsUploading] = useState(false)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [folderUploadOpen, setFolderUploadOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [logoName, setLogoName] = useState('')
  const [logoCategory, setLogoCategory] = useState<LogoCategory>('primary')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file')
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB')
        return
      }
      setSelectedFile(file)
      setLogoName(file.name.replace(/\.[^.]+$/, ''))
    }
  }

  const handleUpload = async () => {
    if (!selectedFile || !logoName) {
      toast.error('Please select a file and enter a name')
      return
    }

    setIsUploading(true)
    const result = await uploadLogo(selectedFile, logoName, logoCategory)
    setIsUploading(false)

    if (result) {
      setUploadDialogOpen(false)
      setSelectedFile(null)
      setLogoName('')
      setLogoCategory('primary')
    }
  }

  const handleDelete = async (logoId: string) => {
    if (!confirm('Are you sure you want to delete this logo?')) return
    await deleteLogo(logoId)
  }

  const handleSetDefault = async (logoId: string) => {
    await setDefaultLogo(logoId)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Logo Management</h1>
          <p className="text-muted-foreground">
            Upload and manage logos for your brand creatives
          </p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setFolderUploadOpen(true)}>
              <FolderOpen className="h-4 w-4 mr-2" />
              Upload Folder
            </Button>
            <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Upload Logo
                </Button>
              </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload Logo</DialogTitle>
                <DialogDescription>
                  Add a new logo to your organization. Supported formats: PNG, JPG, SVG
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {/* File Upload */}
                <div className="space-y-2">
                  <Label>Logo File</Label>
                  <div
                    className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {selectedFile ? (
                      <div className="space-y-2">
                        <CheckCircle2 className="h-8 w-8 mx-auto text-green-500" />
                        <p className="text-sm font-medium">{selectedFile.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(selectedFile.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                        <p className="text-sm">Click to upload or drag and drop</p>
                        <p className="text-xs text-muted-foreground">
                          PNG, JPG or SVG (max 5MB)
                        </p>
                      </div>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>

                {/* Logo Name */}
                <div className="space-y-2">
                  <Label htmlFor="logoName">Logo Name</Label>
                  <Input
                    id="logoName"
                    value={logoName}
                    onChange={(e) => setLogoName(e.target.value)}
                    placeholder="Enter logo name"
                  />
                </div>

                {/* Category */}
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={logoCategory}
                    onValueChange={(v) => setLogoCategory(v as LogoCategory)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(LOGO_CATEGORIES).map(([value, { label, description }]) => (
                        <SelectItem key={value} value={value}>
                          <div>
                            <div className="font-medium">{label}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setUploadDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleUpload} disabled={isUploading || !selectedFile}>
                  {isUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  Upload
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Folder Upload Dialog */}
          <LogoFolderUploadDialog
            open={folderUploadOpen}
            onOpenChange={setFolderUploadOpen}
          />
          </div>
        )}
      </div>

      {/* Logo Categories */}
      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : logos.length === 0 ? (
        <Card className="py-12">
          <CardContent className="text-center">
            <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-medium mb-2">No logos uploaded</h3>
            <p className="text-muted-foreground mb-4">
              Upload your first logo to use in creatives
            </p>
            {isAdmin && (
              <Button onClick={() => setUploadDialogOpen(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Upload Logo
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {Object.entries(LOGO_CATEGORIES).map(([category, { label, description }]) => {
            const categoryLogos = getLogosByCategory(category as LogoCategory)
            if (categoryLogos.length === 0) return null

            return (
              <div key={category}>
                <div className="mb-4">
                  <h2 className="text-lg font-semibold">{label}</h2>
                  <p className="text-sm text-muted-foreground">{description}</p>
                </div>
                <div className="grid gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
                  {categoryLogos.map((logo) => (
                    <Card key={logo.id} className="group relative overflow-hidden">
                      <div className="aspect-square p-4 flex items-center justify-center bg-muted/30">
                        <img
                          src={logo.thumbnail_url || logo.file_url}
                          alt={logo.name}
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="truncate">
                            <p className="text-sm font-medium truncate">{logo.name}</p>
                            {logo.is_default && (
                              <Badge variant="secondary" className="text-xs">
                                <Star className="h-3 w-3 mr-1" />
                                Default
                              </Badge>
                            )}
                          </div>
                          {isAdmin && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {!logo.is_default && (
                                  <DropdownMenuItem onClick={() => handleSetDefault(logo.id)}>
                                    <Star className="h-4 w-4 mr-2" />
                                    Set as Default
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  onClick={() => handleDelete(logo.id)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
