'use client'

import { useEffect, useState, useCallback } from 'react'
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
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
  ExternalLink,
  SortAsc,
  SortDesc,
  Star,
  FileText,
  Loader2,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Creative } from '@/types/database.types'
import { toast } from 'sonner'
import { format } from 'date-fns'

export default function GalleryPage() {
  const supabase = createClient()
  const { currentOrganization, user } = useAuthStore()
  const [creatives, setCreatives] = useState<Creative[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [verticalFilter, setVerticalFilter] = useState<string>('all')
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest')
  const [isSavingTemplate, setIsSavingTemplate] = useState(false)
  const [selectedCreative, setSelectedCreative] = useState<Creative | null>(null)

  const fetchCreatives = useCallback(async () => {
    if (!currentOrganization?.id) return

    setIsLoading(true)

    let query = supabase
      .from('creatives')
      .select('*')
      .eq('organization_id', currentOrganization.id)
      .order('created_at', { ascending: sortBy === 'oldest' })

    if (verticalFilter !== 'all') {
      query = query.eq('vertical', verticalFilter)
    }

    if (favoritesOnly) {
      query = query.eq('is_favorite', true)
    }

    if (searchQuery) {
      query = query.or(`title.ilike.%${searchQuery}%,prompt_used.ilike.%${searchQuery}%`)
    }

    const { data, error } = await query

    setIsLoading(false)

    if (error) {
      toast.error('Failed to load creatives')
      return
    }

    setCreatives(data || [])
  }, [currentOrganization?.id, supabase, searchQuery, verticalFilter, favoritesOnly, sortBy])

  useEffect(() => {
    fetchCreatives()
  }, [fetchCreatives])

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

  const saveAsTemplate = async (creative: Creative) => {
    if (!currentOrganization?.id || !user?.id) return

    setIsSavingTemplate(true)

    const templateName = prompt('Enter a name for this template:', creative.title || 'My Template')

    if (!templateName) {
      setIsSavingTemplate(false)
      return
    }

    const { error } = await supabase.from('templates').insert({
      organization_id: currentOrganization.id,
      created_by: user.id,
      name: templateName,
      description: `Template created from creative generated on ${format(new Date(creative.created_at), 'MMMM d, yyyy')}`,
      category: creative.creative_type,
      vertical: creative.vertical,
      form_data: creative.form_data,
      logo_config: creative.logo_config,
      preview_image_url: creative.thumbnail_url || creative.image_url,
      source_creative_id: creative.id,
    })

    setIsSavingTemplate(false)

    if (error) {
      toast.error('Failed to save template')
      return
    }

    toast.success('Template saved! Find it in your Templates library.')
  }

  const verticals = [...new Set(creatives.map((c) => c.vertical).filter(Boolean))]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gallery</h1>
          <p className="text-muted-foreground">
            Browse and manage your generated creatives
          </p>
        </div>
        <Badge variant="secondary" className="w-fit">
          {creatives.length} creative{creatives.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search creatives..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={verticalFilter} onValueChange={setVerticalFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by vertical" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Verticals</SelectItem>
            {verticals.map((v) => (
              <SelectItem key={v} value={v || ''}>
                {v}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant={favoritesOnly ? 'default' : 'outline'}
          onClick={() => setFavoritesOnly(!favoritesOnly)}
          className="gap-2"
        >
          <Star className={`h-4 w-4 ${favoritesOnly ? 'fill-current' : ''}`} />
          Favorites
        </Button>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as 'newest' | 'oldest')}>
          <SelectTrigger className="w-[140px]">
            {sortBy === 'newest' ? (
              <SortDesc className="h-4 w-4 mr-2" />
            ) : (
              <SortAsc className="h-4 w-4 mr-2" />
            )}
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="oldest">Oldest First</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Gallery Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="aspect-[4/5] rounded-lg" />
          ))}
        </div>
      ) : creatives.length === 0 ? (
        <Card className="py-12">
          <CardContent className="text-center">
            <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-medium mb-2">No creatives yet</h3>
            <p className="text-muted-foreground mb-4">
              Start generating stunning brand creatives
            </p>
            <Button asChild>
              <a href="/create">Create Your First Creative</a>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {creatives.map((creative) => (
            <Card
              key={creative.id}
              className="group overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setSelectedCreative(creative)}
            >
              <div className="relative aspect-[4/5]">
                <img
                  src={creative.thumbnail_url || creative.image_url}
                  alt={creative.title || 'Creative'}
                  className="w-full h-full object-cover"
                />

                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                {/* Favorite Badge */}
                {creative.is_favorite && (
                  <div className="absolute top-2 right-2">
                    <Heart className="h-5 w-5 fill-red-500 text-red-500" />
                  </div>
                )}

                {/* Info Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <h3 className="text-white font-medium text-sm truncate">
                    {creative.title || 'Untitled'}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    {creative.vertical && (
                      <Badge variant="secondary" className="text-xs">
                        {creative.vertical}
                      </Badge>
                    )}
                    <span className="text-white/70 text-xs">
                      {format(new Date(creative.created_at), 'MMM d, yyyy')}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Creative Detail Dialog */}
      <Dialog
        open={!!selectedCreative}
        onOpenChange={(open) => !open && setSelectedCreative(null)}
      >
        {selectedCreative && (
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>{selectedCreative.title || 'Creative Details'}</DialogTitle>
              <DialogDescription>
                Generated on {format(new Date(selectedCreative.created_at), 'MMMM d, yyyy')}
              </DialogDescription>
            </DialogHeader>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Image */}
              <div className="relative aspect-[4/5] rounded-lg overflow-hidden border">
                <img
                  src={selectedCreative.image_url}
                  alt={selectedCreative.title || 'Creative'}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Details */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">
                    Vertical
                  </h4>
                  <Badge>{selectedCreative.vertical || 'General'}</Badge>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">
                    AI Model
                  </h4>
                  <p className="text-sm">{selectedCreative.ai_model}</p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">
                    Credits Used
                  </h4>
                  <p className="text-sm">{selectedCreative.credits_used}</p>
                </div>

                {selectedCreative.generation_time_ms && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">
                      Generation Time
                    </h4>
                    <p className="text-sm">
                      {(selectedCreative.generation_time_ms / 1000).toFixed(1)}s
                    </p>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 pt-4">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button>
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem asChild>
                        <a href={`/api/download?id=${selectedCreative.id}&format=png`} download>
                          PNG (High Quality)
                        </a>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <a href={`/api/download?id=${selectedCreative.id}&format=jpeg&quality=90`} download>
                          JPEG (Compressed)
                        </a>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <a href={`/api/download?id=${selectedCreative.id}&format=webp&quality=85`} download>
                          WebP (Web Optimized)
                        </a>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button
                    variant="outline"
                    onClick={() => toggleFavorite(selectedCreative)}
                  >
                    <Heart
                      className={`h-4 w-4 mr-2 ${
                        selectedCreative.is_favorite
                          ? 'fill-red-500 text-red-500'
                          : ''
                      }`}
                    />
                    {selectedCreative.is_favorite ? 'Unfavorite' : 'Favorite'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => saveAsTemplate(selectedCreative)}
                    disabled={isSavingTemplate}
                  >
                    {isSavingTemplate ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <FileText className="h-4 w-4 mr-2" />
                    )}
                    Save as Template
                  </Button>
                  <Button
                    variant="outline"
                    className="text-destructive hover:text-destructive"
                    onClick={() => deleteCreative(selectedCreative.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  )
}
