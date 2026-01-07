'use client'

import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import { useCreativeStore } from '@/stores/creative-store'
import type { LandmarkSignature } from '@/types/landmark-signatures'
import { toast } from 'sonner'

// Cache duration: 2 minutes - matching logos cache behavior
const CACHE_DURATION_MS = 2 * 60 * 1000
// Global cache tracking per organization to prevent refetch across component instances
const signaturesCacheMap = new Map<string, number>()

export function useLandmarkSignatures() {
  // Memoize supabase client to prevent infinite refetch loops
  const supabase = useMemo(() => createClient(), [])
  const { currentOrganization } = useAuthStore()
  const { landmarkSignatures, setLandmarkSignatures } = useCreativeStore()
  const [isLoading, setIsLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{
    current: number
    total: number
    fileName: string
  } | null>(null)
  const isFetching = useRef(false)

  const fetchSignatures = useCallback(async (force = false) => {
    if (!currentOrganization?.id) return

    // Skip if another instance is already fetching
    if (isFetching.current) return

    // Skip if cache is still valid for this organization (unless forced)
    const now = Date.now()
    const lastFetch = signaturesCacheMap.get(currentOrganization.id) || 0
    if (!force && landmarkSignatures.length > 0 && (now - lastFetch) < CACHE_DURATION_MS) {
      return
    }

    isFetching.current = true
    setIsLoading(true)

    const { data, error } = await supabase
      .from('landmark_signatures')
      .select('*')
      .eq('organization_id', currentOrganization.id)
      .order('created_at', { ascending: false })

    isFetching.current = false
    setIsLoading(false)

    if (error) {
      toast.error('Failed to fetch signatures')
      return
    }

    signaturesCacheMap.set(currentOrganization.id, Date.now())
    setLandmarkSignatures(data || [])
  }, [currentOrganization?.id, supabase, setLandmarkSignatures, landmarkSignatures.length])

  const uploadSignature = useCallback(async (
    file: File,
    name: string,
    options?: { city?: string; region?: string; description?: string }
  ): Promise<LandmarkSignature | null> => {
    if (!currentOrganization?.id) {
      toast.error('No organization selected')
      return null
    }

    setIsLoading(true)

    try {
      // Upload file to Supabase Storage (signatures bucket)
      const fileExt = file.name.split('.').pop()
      const fileName = `${currentOrganization.id}/${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('signatures')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('signatures')
        .getPublicUrl(fileName)

      // Create signature record
      const { data: signature, error: dbError } = await supabase
        .from('landmark_signatures')
        .insert({
          organization_id: currentOrganization.id,
          name,
          description: options?.description || null,
          city: options?.city || null,
          region: options?.region || null,
          file_url: urlData.publicUrl,
          file_size_bytes: file.size,
        })
        .select()
        .single()

      if (dbError) throw dbError

      // Refresh signatures list
      await fetchSignatures(true)
      toast.success('Signature uploaded successfully')
      return signature
    } catch (error) {
      console.error('Error uploading signature:', error)
      toast.error('Failed to upload signature')
      return null
    } finally {
      setIsLoading(false)
    }
  }, [currentOrganization?.id, supabase, fetchSignatures])

  const deleteSignature = useCallback(async (signatureId: string): Promise<boolean> => {
    const signature = landmarkSignatures.find(s => s.id === signatureId)
    if (!signature) return false

    setIsLoading(true)

    try {
      // Delete from database
      const { error } = await supabase
        .from('landmark_signatures')
        .delete()
        .eq('id', signatureId)

      if (error) throw error

      // Delete from storage (extract path from URL)
      const urlParts = signature.file_url.split('/signatures/')
      if (urlParts[1]) {
        await supabase.storage.from('signatures').remove([urlParts[1]])
      }

      // Refresh signatures list
      await fetchSignatures(true)
      toast.success('Signature deleted successfully')
      return true
    } catch (error) {
      console.error('Error deleting signature:', error)
      toast.error('Failed to delete signature')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [landmarkSignatures, supabase, fetchSignatures])

  const setDefaultSignature = useCallback(async (signatureId: string): Promise<boolean> => {
    if (!currentOrganization?.id) return false

    setIsLoading(true)

    try {
      // First, unset all defaults for this organization
      await supabase
        .from('landmark_signatures')
        .update({ is_default: false })
        .eq('organization_id', currentOrganization.id)

      // Set new default
      const { error } = await supabase
        .from('landmark_signatures')
        .update({ is_default: true })
        .eq('id', signatureId)

      if (error) throw error

      // Refresh signatures list
      await fetchSignatures(true)
      toast.success('Default signature updated')
      return true
    } catch (error) {
      console.error('Error setting default signature:', error)
      toast.error('Failed to set default signature')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [currentOrganization?.id, supabase, fetchSignatures])

  const getSignaturesByCity = useCallback((city: string): LandmarkSignature[] => {
    return landmarkSignatures.filter(s => s.city?.toLowerCase() === city.toLowerCase())
  }, [landmarkSignatures])

  const getDefaultSignature = useCallback((): LandmarkSignature | undefined => {
    return landmarkSignatures.find(s => s.is_default) || landmarkSignatures[0]
  }, [landmarkSignatures])

  // Fetch signatures on mount only if cache is stale or empty
  useEffect(() => {
    const now = Date.now()
    const lastFetch = currentOrganization?.id ? signaturesCacheMap.get(currentOrganization.id) || 0 : 0
    const cacheStale = (now - lastFetch) >= CACHE_DURATION_MS
    if (landmarkSignatures.length === 0 || cacheStale) {
      fetchSignatures()
    }
  }, [fetchSignatures, landmarkSignatures.length, currentOrganization?.id])

  return {
    signatures: landmarkSignatures,
    isLoading,
    uploadProgress,
    fetchSignatures,
    uploadSignature,
    deleteSignature,
    setDefaultSignature,
    getSignaturesByCity,
    getDefaultSignature,
  }
}
