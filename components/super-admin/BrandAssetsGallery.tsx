'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import { Search, Trash2, Image as ImageIcon, FileText, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import Image from 'next/image'
import { useAutoRefresh } from '@/hooks/use-auto-refresh'
import { RefreshIndicator } from '@/components/super-admin/RefreshIndicator'

interface Logo {
  id: string
  organization_id: string
  name: string
  type: string
  url: string
  storage_path: string
  created_at: string
  organizations: { id: string; name: string }
}

interface Template {
  id: string
  organization_id: string
  name: string
  description: string | null
  category: string | null
  thumbnail_url: string | null
  created_at: string
  organizations: { id: string; name: string }
}

interface Organization {
  id: string
  name: string
}

interface Pagination {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export default function BrandAssetsGallery() {
  const [activeTab, setActiveTab] = useState<'logos' | 'templates'>('logos')

  // Logos state
  const [logos, setLogos] = useState<Logo[]>([])
  const [loadingLogos, setLoadingLogos] = useState(false)
  const [logoFilters, setLogoFilters] = useState({
    search: '',
    organizationId: '',
    type: '',
  })
  const [logoPagination, setLogoPagination] = useState<Pagination>({
    page: 1,
    pageSize: 24,
    total: 0,
    totalPages: 0,
  })

  // Templates state
  const [templates, setTemplates] = useState<Template[]>([])
  const [loadingTemplates, setLoadingTemplates] = useState(false)
  const [templateFilters, setTemplateFilters] = useState({
    search: '',
    organizationId: '',
    category: '',
  })
  const [templatePagination, setTemplatePagination] = useState<Pagination>({
    page: 1,
    pageSize: 24,
    total: 0,
    totalPages: 0,
  })

  // Shared filter state
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [templateCategories, setTemplateCategories] = useState<string[]>([])

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<{ type: 'logo' | 'template'; item: Logo | Template } | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Unified refresh function for auto-refresh
  const refreshCurrentTab = async () => {
    if (activeTab === 'logos') {
      await fetchLogos()
    } else {
      await fetchTemplates()
    }
  }

  // Auto-refresh every 60 seconds
  const { isRefreshing, lastRefresh, manualRefresh } = useAutoRefresh({
    onRefresh: refreshCurrentTab,
    interval: 60000, // 60 seconds
  })

  useEffect(() => {
    if (activeTab === 'logos') {
      fetchLogos()
    } else {
      fetchTemplates()
    }
  }, [activeTab, logoFilters, logoPagination.page, templateFilters, templatePagination.page])

  async function fetchLogos() {
    setLoadingLogos(true)
    try {
      const params = new URLSearchParams({
        page: logoPagination.page.toString(),
        pageSize: logoPagination.pageSize.toString(),
      })

      if (logoFilters.search) params.append('search', logoFilters.search)
      if (logoFilters.organizationId) params.append('organizationId', logoFilters.organizationId)
      if (logoFilters.type) params.append('type', logoFilters.type)

      const response = await fetch(`/api/super-admin/brand-assets/logos?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch logos')
      }

      const data = await response.json()
      setLogos(data.logos)
      setLogoPagination(data.pagination)
      setOrganizations(data.filters.organizations)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to fetch logos')
    } finally {
      setLoadingLogos(false)
    }
  }

  async function fetchTemplates() {
    setLoadingTemplates(true)
    try {
      const params = new URLSearchParams({
        page: templatePagination.page.toString(),
        pageSize: templatePagination.pageSize.toString(),
      })

      if (templateFilters.search) params.append('search', templateFilters.search)
      if (templateFilters.organizationId) params.append('organizationId', templateFilters.organizationId)
      if (templateFilters.category) params.append('category', templateFilters.category)

      const response = await fetch(`/api/super-admin/brand-assets/templates?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch templates')
      }

      const data = await response.json()
      setTemplates(data.templates)
      setTemplatePagination(data.pagination)
      setOrganizations(data.filters.organizations)
      setTemplateCategories(data.filters.categories)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to fetch templates')
    } finally {
      setLoadingTemplates(false)
    }
  }

  function openDeleteDialog(type: 'logo' | 'template', item: Logo | Template) {
    setItemToDelete({ type, item })
    setDeleteDialogOpen(true)
  }

  async function handleDelete() {
    if (!itemToDelete) return

    setDeleting(true)
    try {
      const endpoint = itemToDelete.type === 'logo'
        ? `/api/super-admin/brand-assets/logos/${itemToDelete.item.id}`
        : `/api/super-admin/brand-assets/templates/${itemToDelete.item.id}`

      const response = await fetch(endpoint, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.details || 'Failed to delete asset')
      }

      const data = await response.json()

      toast.success(data.message)

      setDeleteDialogOpen(false)
      setItemToDelete(null)

      // Refresh list
      if (itemToDelete.type === 'logo') {
        fetchLogos()
      } else {
        fetchTemplates()
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete asset')
    } finally {
      setDeleting(false)
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  function getLogoTypeBadge(type: string) {
    const colors: Record<string, string> = {
      primary: 'bg-blue-100 text-blue-800',
      secondary: 'bg-purple-100 text-purple-800',
      text: 'bg-green-100 text-green-800',
    }
    return (
      <Badge className={colors[type] || 'bg-gray-100 text-gray-800'}>
        {type}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'logos' | 'templates')}>
        <TabsList>
          <TabsTrigger value="logos" className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4" />
            Logos ({logoPagination.total})
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Templates ({templatePagination.total})
          </TabsTrigger>
        </TabsList>

        {/* Logos Tab */}
        <TabsContent value="logos" className="space-y-4 mt-6">
          {/* Filters */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4 flex-wrap flex-1">
              <div className="relative flex-1 min-w-[200px] max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search logos..."
                  value={logoFilters.search}
                  onChange={(e) => {
                    setLogoFilters({ ...logoFilters, search: e.target.value })
                    setLogoPagination({ ...logoPagination, page: 1 })
                  }}
                  className="pl-10"
                />
              </div>

              <Select
                value={logoFilters.organizationId}
                onValueChange={(value) => {
                  setLogoFilters({ ...logoFilters, organizationId: value })
                  setLogoPagination({ ...logoPagination, page: 1 })
                }}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="All Organizations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Organizations</SelectItem>
                  {organizations.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
            </Select>

              <Select
                value={logoFilters.type}
                onValueChange={(value) => {
                  setLogoFilters({ ...logoFilters, type: value })
                  setLogoPagination({ ...logoPagination, page: 1 })
                }}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Types</SelectItem>
                  <SelectItem value="primary">Primary</SelectItem>
                  <SelectItem value="secondary">Secondary</SelectItem>
                  <SelectItem value="text">Text</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Auto-refresh indicator */}
            <RefreshIndicator
              lastRefresh={lastRefresh}
              isRefreshing={isRefreshing}
              onManualRefresh={manualRefresh}
            />
          </div>

          {/* Logo Grid */}
          {loadingLogos ? (
            <div className="text-center py-12 text-gray-500">Loading logos...</div>
          ) : logos.length === 0 ? (
            <div className="text-center py-12 text-gray-500">No logos found</div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {logos.map((logo) => (
                  <div
                    key={logo.id}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow space-y-3"
                  >
                    <div className="aspect-square bg-gray-50 rounded-lg flex items-center justify-center overflow-hidden relative">
                      <Image
                        src={logo.url}
                        alt={logo.name}
                        fill
                        className="object-contain p-2"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="font-medium text-sm truncate" title={logo.name}>
                        {logo.name}
                      </div>
                      <div className="flex items-center justify-between">
                        {getLogoTypeBadge(logo.type)}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {logo.organizations.name}
                      </div>
                      <div className="text-xs text-gray-400">{formatDate(logo.created_at)}</div>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="w-full"
                        onClick={() => openDeleteDialog('logo', logo)}
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {logoPagination.totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <div className="text-sm text-gray-600">
                    Page {logoPagination.page} of {logoPagination.totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setLogoPagination({ ...logoPagination, page: logoPagination.page - 1 })}
                      disabled={logoPagination.page === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setLogoPagination({ ...logoPagination, page: logoPagination.page + 1 })}
                      disabled={logoPagination.page === logoPagination.totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4 mt-6">
          {/* Filters */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4 flex-wrap flex-1">
              <div className="relative flex-1 min-w-[200px] max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search templates..."
                  value={templateFilters.search}
                  onChange={(e) => {
                    setTemplateFilters({ ...templateFilters, search: e.target.value })
                    setTemplatePagination({ ...templatePagination, page: 1 })
                  }}
                  className="pl-10"
                />
              </div>

              <Select
                value={templateFilters.organizationId}
                onValueChange={(value) => {
                  setTemplateFilters({ ...templateFilters, organizationId: value })
                  setTemplatePagination({ ...templatePagination, page: 1 })
                }}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="All Organizations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Organizations</SelectItem>
                  {organizations.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={templateFilters.category}
                onValueChange={(value) => {
                  setTemplateFilters({ ...templateFilters, category: value })
                  setTemplatePagination({ ...templatePagination, page: 1 })
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Categories</SelectItem>
                  {templateCategories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Auto-refresh indicator */}
            <RefreshIndicator
              lastRefresh={lastRefresh}
              isRefreshing={isRefreshing}
              onManualRefresh={manualRefresh}
            />
          </div>

          {/* Template Grid */}
          {loadingTemplates ? (
            <div className="text-center py-12 text-gray-500">Loading templates...</div>
          ) : templates.length === 0 ? (
            <div className="text-center py-12 text-gray-500">No templates found</div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow space-y-3"
                  >
                    <div className="aspect-square bg-gray-50 rounded-lg flex items-center justify-center overflow-hidden relative">
                      {template.thumbnail_url ? (
                        <Image
                          src={template.thumbnail_url}
                          alt={template.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <FileText className="w-12 h-12 text-gray-300" />
                      )}
                    </div>
                    <div className="space-y-2">
                      <div className="font-medium text-sm truncate" title={template.name}>
                        {template.name}
                      </div>
                      {template.category && (
                        <Badge className="bg-blue-100 text-blue-800 text-xs">
                          {template.category}
                        </Badge>
                      )}
                      {template.description && (
                        <div className="text-xs text-gray-600 line-clamp-2">
                          {template.description}
                        </div>
                      )}
                      <div className="text-xs text-gray-500 truncate">
                        {template.organizations.name}
                      </div>
                      <div className="text-xs text-gray-400">{formatDate(template.created_at)}</div>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="w-full"
                        onClick={() => openDeleteDialog('template', template)}
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {templatePagination.totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <div className="text-sm text-gray-600">
                    Page {templatePagination.page} of {templatePagination.totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setTemplatePagination({ ...templatePagination, page: templatePagination.page - 1 })}
                      disabled={templatePagination.page === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setTemplatePagination({ ...templatePagination, page: templatePagination.page + 1 })}
                      disabled={templatePagination.page === templatePagination.totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {itemToDelete?.type === 'logo' ? 'Logo' : 'Template'}</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this {itemToDelete?.type}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {itemToDelete && (
            <div className="space-y-3 py-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                {itemToDelete.type === 'logo' ? (
                  <div className="w-16 h-16 bg-white rounded border flex items-center justify-center relative">
                    <Image
                      src={(itemToDelete.item as Logo).url}
                      alt={itemToDelete.item.name}
                      fill
                      className="object-contain p-1"
                    />
                  </div>
                ) : (
                  <div className="w-16 h-16 bg-white rounded border flex items-center justify-center">
                    <FileText className="w-8 h-8 text-gray-400" />
                  </div>
                )}
                <div className="flex-1">
                  <div className="font-medium">{itemToDelete.item.name}</div>
                  <div className="text-sm text-gray-600">{itemToDelete.item.organizations.name}</div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <strong>Warning:</strong> This {itemToDelete.type} will be permanently deleted from the database and storage.
                  Any creatives using this asset may be affected.
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false)
                setItemToDelete(null)
              }}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : 'Delete Permanently'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
