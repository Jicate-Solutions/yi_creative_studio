'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import { useTemplateImages } from '@/hooks/use-template-images'
import { useVerticals } from '@/hooks/use-verticals'
import { FolderUploadDialog } from '@/components/templates/folder-upload-dialog'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import {
  Library,
  Search,
  Filter,
  Plus,
  Star,
  Globe,
  Lock,
  MoreVertical,
  Trash2,
  Copy,
  Sparkles,
  FileText,
  Image as ImageIcon,
  Upload,
  FolderOpen,
} from 'lucide-react'
import type { Template, TemplateImage } from '@/types/database.types'
import { format } from 'date-fns'
import { ROUTES } from '@/lib/config/constants'

const CATEGORIES = [
  { value: 'event_poster', label: 'Event Poster' },
  { value: 'social_post', label: 'Social Post' },
  { value: 'banner', label: 'Banner' },
  { value: 'announcement', label: 'Announcement' },
  { value: 'custom', label: 'Custom' },
]

export default function TemplatesPage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const { currentOrganization, user, canManage } = useAuthStore()
  const isEditor = canManage()
  const { templateImages, isLoading: isLoadingImages, fetchTemplateImages, deleteTemplateImage, getTemplatesByVertical } = useTemplateImages()
  const { verticals } = useVerticals()

  const [templates, setTemplates] = useState<Template[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [verticalFilter, setVerticalFilter] = useState<string>('all')
  const [activeTab, setActiveTab] = useState<'my' | 'images' | 'public' | 'featured'>('my')
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [selectedImageTemplate, setSelectedImageTemplate] = useState<TemplateImage | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteImageConfirmOpen, setDeleteImageConfirmOpen] = useState(false)
  const [templateToDelete, setTemplateToDelete] = useState<Template | null>(null)
  const [imageToDelete, setImageToDelete] = useState<TemplateImage | null>(null)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)

  const fetchTemplates = useCallback(async () => {
    if (!currentOrganization?.id) return

    setIsLoading(true)

    let query = supabase.from('templates').select('*')

    // Filter based on active tab
    if (activeTab === 'my') {
      query = query.eq('organization_id', currentOrganization.id)
    } else if (activeTab === 'public') {
      query = query.eq('is_public', true).neq('organization_id', currentOrganization.id)
    } else if (activeTab === 'featured') {
      query = query.eq('is_featured', true)
    }

    // Apply filters
    if (categoryFilter !== 'all') {
      query = query.eq('category', categoryFilter)
    }

    if (searchQuery) {
      query = query.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
    }

    query = query.order('created_at', { ascending: false })

    const { data, error } = await query

    setIsLoading(false)

    if (error) {
      toast.error('Failed to load templates')
      return
    }

    setTemplates(data || [])
  }, [currentOrganization?.id, supabase, activeTab, categoryFilter, searchQuery])

  useEffect(() => {
    if (activeTab !== 'images') {
      fetchTemplates()
    }
  }, [fetchTemplates, activeTab])

  const useTemplate = async (template: Template) => {
    // Increment use count
    await supabase
      .from('templates')
      .update({ use_count: (template.use_count || 0) + 1 })
      .eq('id', template.id)

    // Store template data in sessionStorage and navigate to create page
    sessionStorage.setItem('templateData', JSON.stringify({
      formData: template.form_data,
      logoConfig: template.logo_config,
      category: template.category,
      vertical: template.vertical,
    }))

    router.push(ROUTES.create)
  }

  const useImageTemplate = (template: TemplateImage) => {
    // Store image template data and navigate to create page
    sessionStorage.setItem('imageTemplateData', JSON.stringify({
      id: template.id,
      imageUrl: template.image_url,
      name: template.name,
      verticalId: template.vertical_id,
    }))

    router.push(ROUTES.create)
  }

  const duplicateTemplate = async (template: Template) => {
    if (!currentOrganization?.id || !user?.id) return

    const { error } = await supabase.from('templates').insert({
      organization_id: currentOrganization.id,
      created_by: user.id,
      name: `${template.name} (Copy)`,
      description: template.description,
      category: template.category,
      vertical: template.vertical,
      form_data: template.form_data,
      logo_config: template.logo_config,
      preview_image_url: template.preview_image_url,
      is_public: false,
    })

    if (error) {
      toast.error('Failed to duplicate template')
      return
    }

    toast.success('Template duplicated')
    fetchTemplates()
  }

  const deleteTemplate = async () => {
    if (!templateToDelete) return

    const { error } = await supabase
      .from('templates')
      .delete()
      .eq('id', templateToDelete.id)

    if (error) {
      toast.error('Failed to delete template')
      return
    }

    toast.success('Template deleted')
    setDeleteConfirmOpen(false)
    setTemplateToDelete(null)
    setSelectedTemplate(null)
    fetchTemplates()
  }

  const handleDeleteImageTemplate = async () => {
    if (!imageToDelete) return

    await deleteTemplateImage(imageToDelete.id)
    setDeleteImageConfirmOpen(false)
    setImageToDelete(null)
    setSelectedImageTemplate(null)
  }

  const getCategoryLabel = (category: string) => {
    return CATEGORIES.find((c) => c.value === category)?.label || category
  }

  const getVerticalName = (verticalId: string | null) => {
    if (!verticalId) return null
    const vertical = verticals.find(v => v.id === verticalId)
    return vertical ? `${vertical.icon} ${vertical.name}` : null
  }

  // Filter image templates
  const filteredImageTemplates = templateImages.filter(template => {
    if (verticalFilter !== 'all' && template.vertical_id !== verticalFilter) {
      return false
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return template.name.toLowerCase().includes(query) ||
        (template.description?.toLowerCase().includes(query))
    }
    return true
  })

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Library className="h-8 w-8" />
            Templates
          </h1>
          <p className="text-muted-foreground">
            Save and reuse creative configurations for faster generation
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === 'images' && isEditor && (
            <Button onClick={() => setUploadDialogOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Upload Templates
            </Button>
          )}
          <Badge variant="secondary" className="w-fit">
            {activeTab === 'images' ? filteredImageTemplates.length : templates.length} template{(activeTab === 'images' ? filteredImageTemplates.length : templates.length) !== 1 ? 's' : ''}
          </Badge>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList>
          <TabsTrigger value="my" className="gap-2">
            <Lock className="h-4 w-4" />
            My Templates
          </TabsTrigger>
          <TabsTrigger value="images" className="gap-2">
            <ImageIcon className="h-4 w-4" />
            Image Templates
          </TabsTrigger>
          <TabsTrigger value="public" className="gap-2">
            <Globe className="h-4 w-4" />
            Public
          </TabsTrigger>
          <TabsTrigger value="featured" className="gap-2">
            <Star className="h-4 w-4" />
            Featured
          </TabsTrigger>
        </TabsList>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          {activeTab === 'images' ? (
            <Select value={verticalFilter} onValueChange={setVerticalFilter}>
              <SelectTrigger className="w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by vertical" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Verticals</SelectItem>
                {verticals.map((vertical) => (
                  <SelectItem key={vertical.id} value={vertical.id}>
                    {vertical.icon} {vertical.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* My Templates Tab */}
        <TabsContent value="my" className="mt-6">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-64 rounded-lg" />
              ))}
            </div>
          ) : templates.length === 0 ? (
            <Card className="py-12">
              <CardContent className="text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-lg font-medium mb-2">No templates yet</h3>
                <p className="text-muted-foreground mb-4">
                  Save your creative configurations as templates for quick reuse
                </p>
                <Button asChild>
                  <a href={ROUTES.create}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Creative
                  </a>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((template) => (
                <Card
                  key={template.id}
                  className="group overflow-hidden cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => setSelectedTemplate(template)}
                >
                  <div className="relative h-40 bg-muted">
                    {template.preview_image_url ? (
                      <img
                        src={template.preview_image_url}
                        alt={template.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FileText className="h-16 w-16 text-muted-foreground/30" />
                      </div>
                    )}
                    <div className="absolute top-2 left-2 flex gap-1">
                      {template.is_featured && (
                        <Badge className="bg-yellow-500 text-yellow-950">
                          <Star className="h-3 w-3 mr-1 fill-current" />
                          Featured
                        </Badge>
                      )}
                      {template.is_public && (
                        <Badge variant="secondary">
                          <Globe className="h-3 w-3 mr-1" />
                          Public
                        </Badge>
                      )}
                    </div>
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="secondary" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation()
                            useTemplate(template)
                          }}>
                            <Sparkles className="h-4 w-4 mr-2" />
                            Use Template
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation()
                            duplicateTemplate(template)
                          }}>
                            <Copy className="h-4 w-4 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          {template.organization_id === currentOrganization?.id && isEditor && (
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                setTemplateToDelete(template)
                                setDeleteConfirmOpen(true)
                              }}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg truncate">{template.name}</CardTitle>
                    {template.description && (
                      <CardDescription className="line-clamp-2">
                        {template.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm">
                      <Badge variant="outline">{getCategoryLabel(template.category)}</Badge>
                      <span className="text-muted-foreground">
                        {template.use_count || 0} uses
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Image Templates Tab */}
        <TabsContent value="images" className="mt-6">
          {isLoadingImages ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="aspect-[4/5] rounded-lg" />
              ))}
            </div>
          ) : filteredImageTemplates.length === 0 ? (
            <Card className="py-12">
              <CardContent className="text-center">
                <FolderOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-lg font-medium mb-2">No image templates yet</h3>
                <p className="text-muted-foreground mb-4">
                  Upload template images that AI will use as a base for generating your posters
                </p>
                {isEditor && (
                  <Button onClick={() => setUploadDialogOpen(true)}>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Templates
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredImageTemplates.map((template) => (
                <Card
                  key={template.id}
                  className="group overflow-hidden cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => setSelectedImageTemplate(template)}
                >
                  <div className="relative aspect-[4/5] bg-muted">
                    <img
                      src={template.thumbnail_url || template.image_url}
                      alt={template.name}
                      className="w-full h-full object-cover"
                    />
                    {template.vertical_id && (
                      <div className="absolute top-2 left-2">
                        <Badge variant="secondary" className="text-xs">
                          {getVerticalName(template.vertical_id)}
                        </Badge>
                      </div>
                    )}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="secondary" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation()
                            useImageTemplate(template)
                          }}>
                            <Sparkles className="h-4 w-4 mr-2" />
                            Use Template
                          </DropdownMenuItem>
                          {isEditor && (
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                setImageToDelete(template)
                                setDeleteImageConfirmOpen(true)
                              }}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  <CardContent className="p-3">
                    <p className="font-medium truncate text-sm">{template.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {template.use_count || 0} uses
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Public Templates Tab */}
        <TabsContent value="public" className="mt-6">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-64 rounded-lg" />
              ))}
            </div>
          ) : templates.length === 0 ? (
            <Card className="py-12">
              <CardContent className="text-center">
                <Globe className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-lg font-medium mb-2">No public templates available</h3>
                <p className="text-muted-foreground">
                  Check back later for community templates
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((template) => (
                <Card
                  key={template.id}
                  className="group overflow-hidden cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => setSelectedTemplate(template)}
                >
                  <div className="relative h-40 bg-muted">
                    {template.preview_image_url ? (
                      <img
                        src={template.preview_image_url}
                        alt={template.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FileText className="h-16 w-16 text-muted-foreground/30" />
                      </div>
                    )}
                  </div>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg truncate">{template.name}</CardTitle>
                    {template.description && (
                      <CardDescription className="line-clamp-2">
                        {template.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm">
                      <Badge variant="outline">{getCategoryLabel(template.category)}</Badge>
                      <span className="text-muted-foreground">
                        {template.use_count || 0} uses
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Featured Templates Tab */}
        <TabsContent value="featured" className="mt-6">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-64 rounded-lg" />
              ))}
            </div>
          ) : templates.length === 0 ? (
            <Card className="py-12">
              <CardContent className="text-center">
                <Star className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-lg font-medium mb-2">No featured templates</h3>
                <p className="text-muted-foreground">
                  Check back later for featured templates
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((template) => (
                <Card
                  key={template.id}
                  className="group overflow-hidden cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => setSelectedTemplate(template)}
                >
                  <div className="relative h-40 bg-muted">
                    {template.preview_image_url ? (
                      <img
                        src={template.preview_image_url}
                        alt={template.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FileText className="h-16 w-16 text-muted-foreground/30" />
                      </div>
                    )}
                    <div className="absolute top-2 left-2">
                      <Badge className="bg-yellow-500 text-yellow-950">
                        <Star className="h-3 w-3 mr-1 fill-current" />
                        Featured
                      </Badge>
                    </div>
                  </div>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg truncate">{template.name}</CardTitle>
                    {template.description && (
                      <CardDescription className="line-clamp-2">
                        {template.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm">
                      <Badge variant="outline">{getCategoryLabel(template.category)}</Badge>
                      <span className="text-muted-foreground">
                        {template.use_count || 0} uses
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Template Detail Dialog */}
      <Dialog
        open={!!selectedTemplate}
        onOpenChange={(open) => !open && setSelectedTemplate(null)}
      >
        {selectedTemplate && (
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {selectedTemplate.name}
                {selectedTemplate.is_featured && (
                  <Badge className="bg-yellow-500 text-yellow-950">
                    <Star className="h-3 w-3 mr-1 fill-current" />
                    Featured
                  </Badge>
                )}
              </DialogTitle>
              <DialogDescription>
                {selectedTemplate.description || 'No description provided'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="relative h-48 bg-muted rounded-lg overflow-hidden">
                {selectedTemplate.preview_image_url ? (
                  <img
                    src={selectedTemplate.preview_image_url}
                    alt={selectedTemplate.name}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <FileText className="h-16 w-16 text-muted-foreground/30" />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Category</span>
                  <p className="font-medium">{getCategoryLabel(selectedTemplate.category)}</p>
                </div>
                {selectedTemplate.vertical && (
                  <div>
                    <span className="text-muted-foreground">Vertical</span>
                    <p className="font-medium">{selectedTemplate.vertical}</p>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground">Times Used</span>
                  <p className="font-medium">{selectedTemplate.use_count || 0}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Created</span>
                  <p className="font-medium">
                    {selectedTemplate.created_at
                      ? format(new Date(selectedTemplate.created_at), 'MMM d, yyyy')
                      : 'Unknown'}
                  </p>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => duplicateTemplate(selectedTemplate)}>
                <Copy className="h-4 w-4 mr-2" />
                Duplicate
              </Button>
              <Button onClick={() => useTemplate(selectedTemplate)}>
                <Sparkles className="h-4 w-4 mr-2" />
                Use Template
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* Image Template Detail Dialog */}
      <Dialog
        open={!!selectedImageTemplate}
        onOpenChange={(open) => !open && setSelectedImageTemplate(null)}
      >
        {selectedImageTemplate && (
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedImageTemplate.name}</DialogTitle>
              <DialogDescription>
                {selectedImageTemplate.description || 'Image template for poster generation'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="relative aspect-[4/5] max-h-[400px] bg-muted rounded-lg overflow-hidden">
                <img
                  src={selectedImageTemplate.image_url}
                  alt={selectedImageTemplate.name}
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                {selectedImageTemplate.vertical_id && (
                  <div>
                    <span className="text-muted-foreground">Vertical</span>
                    <p className="font-medium">{getVerticalName(selectedImageTemplate.vertical_id)}</p>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground">Times Used</span>
                  <p className="font-medium">{selectedImageTemplate.use_count || 0}</p>
                </div>
                {selectedImageTemplate.width && selectedImageTemplate.height && (
                  <div>
                    <span className="text-muted-foreground">Dimensions</span>
                    <p className="font-medium">{selectedImageTemplate.width} x {selectedImageTemplate.height}</p>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground">Uploaded</span>
                  <p className="font-medium">
                    {selectedImageTemplate.created_at
                      ? format(new Date(selectedImageTemplate.created_at), 'MMM d, yyyy')
                      : 'Unknown'}
                  </p>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={() => {
                useImageTemplate(selectedImageTemplate)
                setSelectedImageTemplate(null)
              }}>
                <Sparkles className="h-4 w-4 mr-2" />
                Use Template
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Template</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{templateToDelete?.name}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={deleteTemplate}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Image Template Confirmation Dialog */}
      <Dialog open={deleteImageConfirmOpen} onOpenChange={setDeleteImageConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Image Template</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{imageToDelete?.name}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteImageConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteImageTemplate}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Dialog */}
      <FolderUploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        onUploadComplete={fetchTemplateImages}
      />
    </div>
  )
}
