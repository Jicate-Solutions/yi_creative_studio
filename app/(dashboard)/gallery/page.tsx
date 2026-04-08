'use client'

import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import {
  Card,
  CardContent,
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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Download,
  Heart,
  Search,
  Filter,
  Calendar,
  Sparkles,
  MoreVertical,
  Trash2,
  SortAsc,
  SortDesc,
  Star,
  FileText,
  Loader2,
  Clock,
  Coins,
  ImageOff,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ExportModal } from '@/components/export'
import type { Creative } from '@/types/database.types'
import { toast } from 'sonner'
import { format, formatDistanceToNow } from 'date-fns'

export default function GalleryPage() {
  const supabase = useMemo(() => createClient(), [])
  const { currentOrganization, user, _hasHydrated, serverHydrated } = useAuthStore()
  const [creatives, setCreatives] = useState<Creative[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  const [verticalFilter, setVerticalFilter] = useState<string>('all')
  const [formatFilter, setFormatFilter] = useState<string>('all')
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest')
  const [isSavingTemplate, setIsSavingTemplate] = useState(false)
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false)
  const [templateNameInput, setTemplateNameInput] = useState('')
  const [templateCreativeRef, setTemplateCreativeRef] = useState<Creative | null>(null)
  const [selectedCreative, setSelectedCreative] = useState<Creative | null>(null)
  const [selectedCreativeImageUrl, setSelectedCreativeImageUrl] = useState<string | null>(null)
  const [isLoadingFullImage, setIsLoadingFullImage] = useState(false)
  const [exportModalOpen, setExportModalOpen] = useState(false)
  const [creativeForExport, setCreativeForExport] = useState<Creative | null>(null)
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set())

  // PERFORMANCE: Debounce search to prevent re-fetch on every keystroke
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 300) // 300ms debounce delay

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [searchQuery])

  const fetchCreatives = useCallback(async (retryCount = 0) => {
    // Wait for auth store to be ready (either server hydration OR localStorage rehydration)
    if (!_hasHydrated && !serverHydrated) {
      return
    }

    if (!currentOrganization?.id) {
      // No organization available - show empty state
      setIsLoading(false)
      setCreatives([])
      return
    }

    setIsLoading(true)

    try {
      // Use API route instead of direct Supabase client
      // This avoids the race condition where browser client tokens aren't synced yet
      const params = new URLSearchParams({
        organizationId: currentOrganization.id,
        sortBy,
        ...(verticalFilter !== 'all' && { vertical: verticalFilter }),
        ...(formatFilter !== 'all' && { format: formatFilter }),
        ...(favoritesOnly && { favoritesOnly: 'true' }),
        ...(debouncedSearchQuery && { search: debouncedSearchQuery }),
      })

      const response = await fetch(`/api/gallery/creatives?${params}`)
      const data = await response.json()

      // Handle auth errors with retry - auth cookies may not be ready yet
      if (response.status === 401 || response.status === 500) {
        if (retryCount < 3) {
          // Wait progressively longer before retrying (500ms, 1000ms, 1500ms)
          const delay = (retryCount + 1) * 500
          console.log(`Gallery fetch failed (${response.status}), retrying in ${delay}ms... (attempt ${retryCount + 1}/3)`)
          await new Promise(resolve => setTimeout(resolve, delay))
          return fetchCreatives(retryCount + 1)
        }
        // After 3 retries, show error
        console.error('Gallery API error after retries:', data.error, data.details)
        setIsLoading(false)
        toast.error('Failed to load creatives')
        return
      }

      setIsLoading(false)

      if (!response.ok) {
        console.error('Gallery API error:', data.error, data.details)
        toast.error('Failed to load creatives')
        return
      }

      setCreatives(data.creatives || [])
      setFailedImages(new Set()) // Clear failed images on fresh fetch
    } catch (error) {
      console.error('Error fetching creatives:', error)
      setIsLoading(false)
      toast.error('Failed to load creatives')
    }
  }, [_hasHydrated, serverHydrated, currentOrganization?.id, debouncedSearchQuery, verticalFilter, formatFilter, favoritesOnly, sortBy])

  useEffect(() => {
    fetchCreatives()
  }, [fetchCreatives])

  // PERFORMANCE: Fetch full image_url only when detail view is opened
  useEffect(() => {
    if (!selectedCreative) {
      setSelectedCreativeImageUrl(null)
      return
    }

    // If creative already has image_url in state (from previous fetch), use it
    if (selectedCreative.image_url) {
      setSelectedCreativeImageUrl(selectedCreative.image_url)
      return
    }

    // Fetch the full image_url for the selected creative
    const fetchFullImage = async () => {
      setIsLoadingFullImage(true)
      const { data, error } = await supabase
        .from('creatives')
        .select('image_url')
        .eq('id', selectedCreative.id)
        .single()

      setIsLoadingFullImage(false)

      if (error) {
        toast.error('Failed to load full image')
        return
      }

      if (data?.image_url) {
        setSelectedCreativeImageUrl(data.image_url)
        // Update the creative in state with the fetched image_url
        setCreatives(prev =>
          prev.map(c =>
            c.id === selectedCreative.id ? { ...c, image_url: data.image_url } : c
          )
        )
      }
    }

    fetchFullImage()
  }, [selectedCreative, supabase])

  const toggleFavorite = async (creative: Creative) => {
    const newValue = !creative.is_favorite

    const { error } = await supabase
      .from('creatives')
      .update({ is_favorite: newValue })
      .eq('id', creative.id)

    if (error) {
      toast.error('Failed to update favorite')
      return
    }

    setCreatives((prev) =>
      prev.map((c) =>
        c.id === creative.id ? { ...c, is_favorite: newValue } : c
      )
    )

    toast.success(newValue ? 'Added to favorites' : 'Removed from favorites')
  }

  const deleteCreative = async (creativeId: string) => {
    const { error } = await supabase
      .from('creatives')
      .delete()
      .eq('id', creativeId)

    if (error) {
      toast.error('Failed to delete creative')
      return
    }

    setCreatives((prev) => prev.filter((c) => c.id !== creativeId))
    setSelectedCreative(null)
    toast.success('Creative deleted')
  }

  const openTemplateDialog = (creative: Creative) => {
    setTemplateCreativeRef(creative)
    setTemplateNameInput(creative.title || 'My Template')
    setTemplateDialogOpen(true)
  }

  const confirmSaveTemplate = async () => {
    if (!templateCreativeRef || !currentOrganization?.id || !user?.id) return

    setIsSavingTemplate(true)

    const creative = templateCreativeRef

    let formData = creative.form_data
    let logoConfig = creative.logo_config

    if (!formData || !logoConfig) {
      const { data, error: fetchError } = await supabase
        .from('creatives')
        .select('form_data, logo_config')
        .eq('id', creative.id)
        .single()

      if (fetchError) {
        setIsSavingTemplate(false)
        setTemplateDialogOpen(false)
        setTemplateCreativeRef(null)
        toast.error('Failed to fetch creative data')
        return
      }

      formData = data?.form_data
      logoConfig = data?.logo_config
    }

    const { error } = await supabase.from('templates').insert({
      organization_id: currentOrganization.id,
      created_by: user.id,
      name: templateNameInput,
      description: `Template created from creative generated on ${format(new Date(creative.created_at), 'MMMM d, yyyy')}`,
      category: creative.creative_type,
      vertical: creative.vertical,
      form_data: formData,
      logo_config: logoConfig,
      preview_image_url: creative.thumbnail_url,
      source_creative_id: creative.id,
    })

    setIsSavingTemplate(false)
    setTemplateDialogOpen(false)
    setTemplateCreativeRef(null)

    if (error) {
      toast.error('Failed to save template')
      return
    }

    toast.success('Template saved! Find it in your Templates library.')
  }

  const verticals = [...new Set(creatives.map((c) => c.vertical).filter(Boolean))]
  const formats = [...new Set(creatives.map((c) => c.creative_type).filter(Boolean))]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
            Gallery
          </h1>
          <p className="text-muted-foreground mt-1">
            Browse and manage your generated creatives
          </p>
        </div>
        <span className="badge-pill badge-pill-primary font-semibold">
          {creatives.length} creative{creatives.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 p-4 glass-panel">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search creatives..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 input-premium"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
          <Select value={verticalFilter} onValueChange={setVerticalFilter}>
            <SelectTrigger className="h-9 w-[140px] flex-shrink-0 text-sm">
              <Filter className="h-4 w-4 mr-2 flex-shrink-0" />
              <SelectValue placeholder="All Verticals" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Verticals</SelectItem>
              {verticals.map((v) => (
                <SelectItem key={v} value={v || ''}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={formatFilter} onValueChange={setFormatFilter}>
            <SelectTrigger className="h-9 w-[150px] flex-shrink-0 text-sm">
              <Sparkles className="h-4 w-4 mr-2 flex-shrink-0" />
              <SelectValue placeholder="All Formats" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Formats</SelectItem>
              {formats.map((f) => (
                <SelectItem key={f} value={f || ''}>{f}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant={favoritesOnly ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFavoritesOnly(!favoritesOnly)}
            className="h-9 px-4 gap-2 flex-shrink-0 text-sm"
          >
            <Star className={`h-4 w-4 flex-shrink-0 ${favoritesOnly ? 'fill-current' : ''}`} />
            Favorites
          </Button>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as 'newest' | 'oldest')}>
            <SelectTrigger className="h-9 w-[130px] flex-shrink-0 text-sm">
              {sortBy === 'newest' ? (
                <SortDesc className="h-4 w-4 mr-2 flex-shrink-0" />
              ) : (
                <SortAsc className="h-4 w-4 mr-2 flex-shrink-0" />
              )}
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Gallery Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="glass-card border-none shadow-none">
              <div
                className="bg-muted rounded-t-xl animate-pulse"
                style={{ height: [200, 280, 320, 240, 260, 300, 220, 290][i % 8] }}
              />
              <div className="p-3 space-y-2">
                <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
                <div className="h-3 bg-muted rounded w-1/2 animate-pulse" />
              </div>
            </Card>
          ))}
        </div>
      ) : creatives.length === 0 ? (
        <Card darkVariant="elevated" className="py-12">
          <CardContent className="text-center">
            <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-medium mb-2">No creatives yet</h3>
            <p className="text-muted-foreground mb-4">Start generating stunning brand creatives</p>
            <Button asChild>
              <a href="/create">Create Your First Creative</a>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {creatives.map((creative) => (
            <div
              key={creative.id}
              className="glass-card group cursor-pointer hover:scale-[1.01] transition-all duration-300"
              onClick={() => setSelectedCreative(creative)}
            >
              <div className="relative overflow-hidden rounded-t-xl">
                {(creative.thumbnail_url || creative.image_url) && !failedImages.has(creative.id) ? (
                  <Image
                    src={creative.thumbnail_url || creative.image_url}
                    alt={creative.title || 'Creative'}
                    width={400}
                    height={0}
                    sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="w-full h-auto object-contain transition-transform duration-300 group-hover:scale-[1.02]"
                    style={{ height: 'auto' }}
                    loading="lazy"
                    onError={() => setFailedImages(prev => new Set(prev).add(creative.id))}
                  />
                ) : (
                  <div className="w-full h-48 bg-muted flex items-center justify-center">
                    {failedImages.has(creative.id) ? (
                      <ImageOff className="h-8 w-8 text-muted-foreground/50" />
                    ) : (
                      <Sparkles className="h-8 w-8 text-muted-foreground/50" />
                    )}
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300" />
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-[-4px] group-hover:translate-y-0">
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-8 w-8 bg-white/90 hover:bg-white shadow-md"
                    onClick={(e) => { e.stopPropagation(); toggleFavorite(creative) }}
                  >
                    <Heart className={`h-4 w-4 ${creative.is_favorite ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-8 w-8 bg-white/90 hover:bg-white shadow-md"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="h-4 w-4 text-gray-600" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setCreativeForExport(creative); setExportModalOpen(true) }}>
                        <Download className="h-4 w-4 mr-2" />Download
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openTemplateDialog(creative) }}>
                        <FileText className="h-4 w-4 mr-2" />Save as Template
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={(e) => { e.stopPropagation(); deleteCreative(creative.id) }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                {creative.is_favorite && (
                  <div className="absolute top-2 left-2 group-hover:opacity-0 transition-opacity">
                    <div className="bg-white/90 rounded-full p-1.5 shadow-md">
                      <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                    </div>
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                  <h3 className="text-white font-semibold text-sm truncate">{creative.title || 'Untitled'}</h3>
                </div>
              </div>
              <div className="p-3 rounded-b-xl bg-background/50 backdrop-blur-sm">
                <div className="flex items-center justify-between gap-2">
                  {creative.vertical && (
                    <span className="badge-pill badge-pill-secondary text-xs truncate max-w-[100px]">{creative.vertical}</span>
                  )}
                  <span className="text-muted-foreground text-xs flex items-center gap-1 flex-shrink-0">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(creative.created_at), 'MMM d')}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Creative Detail Sheet - Right slide-over */}
      <Sheet open={!!selectedCreative} onOpenChange={(open) => { if (!open) setSelectedCreative(null) }}>
        {selectedCreative && (
          <SheetContent
            side="right"
            className="w-full sm:w-[480px] md:w-[560px] p-0 overflow-hidden flex flex-col bg-background border-l border-border"
          >
            <SheetHeader className="sr-only">
              <SheetTitle>{selectedCreative.title || 'Creative Details'}</SheetTitle>
              <SheetDescription>View and manage creative details</SheetDescription>
            </SheetHeader>

            <div className="relative bg-black flex items-center justify-center overflow-hidden" style={{ height: '55%', minHeight: 280 }}>
              {isLoadingFullImage ? (
                <div className="flex flex-col items-center justify-center gap-4">
                  <Loader2 className="h-8 w-8 animate-spin text-white/60" />
                  <span className="text-white/60 text-sm">Loading...</span>
                </div>
              ) : selectedCreativeImageUrl ? (
                <Image src={selectedCreativeImageUrl} alt={selectedCreative.title || 'Creative'} width={560} height={700} sizes="560px" className="object-contain max-w-full max-h-full" priority />
              ) : selectedCreative.thumbnail_url ? (
                <Image src={selectedCreative.thumbnail_url} alt={selectedCreative.title || 'Creative'} width={560} height={700} sizes="560px" className="object-contain max-w-full max-h-full" priority />
              ) : (
                <div className="flex flex-col items-center justify-center gap-4">
                  <Sparkles className="h-12 w-12 text-white/40" />
                  <span className="text-white/60 text-sm">Image not available</span>
                </div>
              )}
              <div className="absolute top-3 left-3 z-10">
                <button
                  onClick={() => toggleFavorite(selectedCreative)}
                  className="creative-action-btn"
                  aria-label={selectedCreative.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <Heart className={`h-5 w-5 transition-colors ${selectedCreative.is_favorite ? 'fill-red-500 text-red-500' : ''}`} />
                </button>
              </div>
            </div>

            <div className="flex-1 p-5 space-y-4 overflow-y-auto border-t border-border">
              <div>
                <h2 className="text-lg font-semibold truncate">{selectedCreative.title || 'Untitled Creative'}</h2>
                <p className="text-muted-foreground text-sm mt-0.5">
                  Generated {formatDistanceToNow(new Date(selectedCreative.created_at))} ago
                </p>
              </div>
              <Button className="w-full" size="lg" onClick={() => { setCreativeForExport(selectedCreative); setExportModalOpen(true) }}>
                <Download className="h-4 w-4 mr-2" />Download / Export
              </Button>
              <div className="flex flex-wrap gap-2">
                {selectedCreative.vertical && (
                  <span className="badge-pill badge-pill-primary shrink-0">{selectedCreative.vertical}</span>
                )}
                <span className="badge-pill bg-muted text-muted-foreground shrink-0 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />{selectedCreative.ai_model}
                </span>
                {selectedCreative.generation_time_ms && (
                  <span className="badge-pill bg-muted text-muted-foreground shrink-0 flex items-center gap-1">
                    <Clock className="h-3 w-3" />{(selectedCreative.generation_time_ms / 1000).toFixed(1)}s
                  </span>
                )}
                <span className="badge-pill bg-muted text-muted-foreground shrink-0 flex items-center gap-1">
                  <Coins className="h-3 w-3" />{selectedCreative.credits_used} credits
                </span>
              </div>
              <div className="flex gap-2 pt-2 border-t border-border">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => openTemplateDialog(selectedCreative)} disabled={isSavingTemplate}>
                  {isSavingTemplate ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileText className="h-4 w-4 mr-2" />}
                  Save as Template
                </Button>
                <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300 hover:bg-red-500/10" onClick={() => deleteCreative(selectedCreative.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </SheetContent>
        )}
      </Sheet>

      {/* Save as Template Dialog */}
      <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save as Template</DialogTitle>
            <DialogDescription>Give your template a name to find it later.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="template-name">Template Name</Label>
            <Input
              id="template-name"
              value={templateNameInput}
              onChange={(e) => setTemplateNameInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') confirmSaveTemplate() }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTemplateDialogOpen(false)}>Cancel</Button>
            <Button onClick={confirmSaveTemplate} disabled={isSavingTemplate || !templateNameInput.trim()}>
              {isSavingTemplate ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Save Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export Modal */}
      {creativeForExport && (
        <ExportModal
          open={exportModalOpen}
          onOpenChange={(open) => { setExportModalOpen(open); if (!open) setCreativeForExport(null) }}
          creativeId={creativeForExport.id}
          creativeName={creativeForExport.title || 'Creative'}
          previewUrl={creativeForExport.image_url}
          creativeType={creativeForExport.creative_type}
          promptUsed={creativeForExport.prompt_used || undefined}
          formData={creativeForExport.form_data as Record<string, unknown> | undefined}
        />
      )}
    </div>
  )
}
