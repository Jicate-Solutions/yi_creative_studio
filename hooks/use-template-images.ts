'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import type { TemplateImage, VerticalPreset } from '@/types/database.types'
import { toast } from 'sonner'

interface UploadProgress {
  current: number
  total: number
  fileName: string
}

interface FolderFile {
  file: File
  path: string
  verticalSlug?: string
}

export function useTemplateImages() {
  // Memoize supabase client to prevent infinite refetch loops
  // Without this, createClient() creates new reference each render,
  // causing useCallback deps to change, triggering useEffect infinitely
  const supabase = useMemo(() => createClient(), [])
  const { currentOrganization, user } = useAuthStore()
  const [templateImages, setTemplateImages] = useState<TemplateImage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null)

  // Fetch all template images for the organization
  const fetchTemplateImages = useCallback(async () => {
    if (!currentOrganization?.id) return

    setIsLoading(true)
    const { data, error } = await supabase
      .from('template_images')
      .select('*')
      .eq('organization_id', currentOrganization.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    setIsLoading(false)

    if (error) {
      console.error('Error fetching template images:', error)
      toast.error('Failed to fetch templates')
      return
    }

    setTemplateImages(data || [])
  }, [currentOrganization?.id, supabase])

  // Fetch template images by vertical
  const getTemplatesByVertical = useCallback((verticalId: string | null) => {
    if (!verticalId) return templateImages
    return templateImages.filter(t => t.vertical_id === verticalId)
  }, [templateImages])

  // Upload a single template image
  const uploadTemplateImage = useCallback(async (
    file: File,
    name: string,
    verticalId: string | null,
    description?: string
  ): Promise<TemplateImage | null> => {
    if (!currentOrganization?.id || !user?.id) {
      toast.error('No organization selected')
      return null
    }

    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']
    if (!validTypes.includes(file.type)) {
      toast.error('Invalid file type. Please upload PNG, JPEG, WebP, or GIF.')
      return null
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File too large. Maximum size is 10MB.')
      return null
    }

    setIsLoading(true)

    try {
      // Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${currentOrganization.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('templates')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('templates')
        .getPublicUrl(fileName)

      // Get image dimensions
      const dimensions = await getImageDimensions(file)

      // Create template image record
      const { data: template, error: dbError } = await supabase
        .from('template_images')
        .insert({
          organization_id: currentOrganization.id,
          vertical_id: verticalId,
          name,
          description,
          image_url: urlData.publicUrl,
          width: dimensions.width,
          height: dimensions.height,
          file_size: file.size,
          created_by: user.id,
        })
        .select()
        .single()

      if (dbError) throw dbError

      await fetchTemplateImages()
      toast.success('Template uploaded successfully')
      return template
    } catch (error) {
      console.error('Error uploading template:', error)
      toast.error('Failed to upload template')
      return null
    } finally {
      setIsLoading(false)
    }
  }, [currentOrganization?.id, user?.id, supabase, fetchTemplateImages])

  // Upload multiple files from a folder
  const uploadTemplateFolder = useCallback(async (
    files: FileList | File[],
    verticals: VerticalPreset[]
  ): Promise<{ success: number; failed: number }> => {
    if (!currentOrganization?.id || !user?.id) {
      toast.error('No organization selected')
      return { success: 0, failed: 0 }
    }

    const fileArray = Array.from(files)
    const validTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']

    // Filter valid image files
    const imageFiles = fileArray.filter(file => validTypes.includes(file.type))

    if (imageFiles.length === 0) {
      toast.error('No valid image files found in the folder')
      return { success: 0, failed: 0 }
    }

    // Parse folder structure and detect verticals
    const folderFiles: FolderFile[] = imageFiles.map(file => {
      // Get the path from webkitRelativePath or just the filename
      const path = (file as any).webkitRelativePath || file.name
      const pathParts = path.split('/')

      // If there's a folder, use it to detect vertical
      let verticalSlug: string | undefined
      if (pathParts.length > 1) {
        const folderName = pathParts[pathParts.length - 2].toLowerCase().replace(/[^a-z0-9]/g, '-')
        const matchedVertical = verticals.find(v =>
          v.slug.toLowerCase() === folderName ||
          v.name.toLowerCase().replace(/[^a-z0-9]/g, '-') === folderName
        )
        verticalSlug = matchedVertical?.slug
      }

      return { file, path, verticalSlug }
    })

    setIsLoading(true)
    let successCount = 0
    let failedCount = 0

    for (let i = 0; i < folderFiles.length; i++) {
      const { file, path, verticalSlug } = folderFiles[i]

      setUploadProgress({
        current: i + 1,
        total: folderFiles.length,
        fileName: file.name
      })

      try {
        // Find vertical ID from slug
        const vertical = verticalSlug
          ? verticals.find(v => v.slug === verticalSlug)
          : null

        // Upload file to Supabase Storage
        const fileExt = file.name.split('.').pop()
        const fileName = `${currentOrganization.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

        const { error: uploadError } = await supabase.storage
          .from('templates')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false,
          })

        if (uploadError) throw uploadError

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('templates')
          .getPublicUrl(fileName)

        // Get image dimensions
        const dimensions = await getImageDimensions(file)

        // Create template image record
        const templateName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ')

        const { error: dbError } = await supabase
          .from('template_images')
          .insert({
            organization_id: currentOrganization.id,
            vertical_id: vertical?.id || null,
            name: templateName,
            image_url: urlData.publicUrl,
            width: dimensions.width,
            height: dimensions.height,
            file_size: file.size,
            created_by: user.id,
          })

        if (dbError) throw dbError

        successCount++
      } catch (error) {
        console.error(`Error uploading ${file.name}:`, error)
        failedCount++
      }
    }

    setUploadProgress(null)
    setIsLoading(false)
    await fetchTemplateImages()

    if (successCount > 0) {
      toast.success(`Uploaded ${successCount} template${successCount > 1 ? 's' : ''} successfully`)
    }
    if (failedCount > 0) {
      toast.error(`Failed to upload ${failedCount} file${failedCount > 1 ? 's' : ''}`)
    }

    return { success: successCount, failed: failedCount }
  }, [currentOrganization?.id, user?.id, supabase, fetchTemplateImages])

  // Delete a template image
  const deleteTemplateImage = useCallback(async (templateId: string) => {
    const template = templateImages.find(t => t.id === templateId)
    if (!template) return false

    setIsLoading(true)

    try {
      // Delete from database (soft delete by setting is_active to false)
      const { error } = await supabase
        .from('template_images')
        .update({ is_active: false })
        .eq('id', templateId)

      if (error) throw error

      // Optionally delete from storage
      const urlParts = template.image_url.split('/templates/')
      if (urlParts[1]) {
        await supabase.storage.from('templates').remove([urlParts[1]])
      }

      await fetchTemplateImages()
      toast.success('Template deleted successfully')
      return true
    } catch (error) {
      console.error('Error deleting template:', error)
      toast.error('Failed to delete template')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [templateImages, supabase, fetchTemplateImages])

  // Update template metadata
  const updateTemplateImage = useCallback(async (
    templateId: string,
    updates: { name?: string; description?: string; vertical_id?: string | null; style_tags?: string[] }
  ) => {
    setIsLoading(true)

    try {
      const { error } = await supabase
        .from('template_images')
        .update(updates)
        .eq('id', templateId)

      if (error) throw error

      await fetchTemplateImages()
      toast.success('Template updated successfully')
      return true
    } catch (error) {
      console.error('Error updating template:', error)
      toast.error('Failed to update template')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [supabase, fetchTemplateImages])

  // Increment use count
  const incrementUseCount = useCallback(async (templateId: string) => {
    try {
      const template = templateImages.find(t => t.id === templateId)
      if (!template) return

      await supabase
        .from('template_images')
        .update({ use_count: (template.use_count || 0) + 1 })
        .eq('id', templateId)
    } catch (error) {
      console.error('Error incrementing use count:', error)
    }
  }, [templateImages, supabase])

  // Helper function to get image dimensions
  const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        resolve({ width: img.width, height: img.height })
        URL.revokeObjectURL(img.src)
      }
      img.onerror = () => {
        resolve({ width: 0, height: 0 })
        URL.revokeObjectURL(img.src)
      }
      img.src = URL.createObjectURL(file)
    })
  }

  // Fetch on mount only if not already loaded
  // This prevents duplicate fetches when multiple components use this hook
  useEffect(() => {
    if (templateImages.length === 0) {
      fetchTemplateImages()
    }
  }, [fetchTemplateImages, templateImages.length])

  return {
    templateImages,
    isLoading,
    uploadProgress,
    fetchTemplateImages,
    getTemplatesByVertical,
    uploadTemplateImage,
    uploadTemplateFolder,
    deleteTemplateImage,
    updateTemplateImage,
    incrementUseCount,
  }
}
