'use client'

import { useState, useCallback, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import { useCreativeStore } from '@/stores/creative-store'
import type { OrganizationLogo } from '@/types/database.types'
import type { LogoCategory } from '@/lib/config/constants'
import { toast } from 'sonner'

export function useLogos() {
  const supabase = createClient()
  const { currentOrganization } = useAuthStore()
  const { logos, setLogos } = useCreativeStore()
  const [isLoading, setIsLoading] = useState(false)

  const fetchLogos = useCallback(async () => {
    if (!currentOrganization?.id) return

    setIsLoading(true)
    const { data, error } = await supabase
      .from('organization_logos')
      .select('*')
      .eq('organization_id', currentOrganization.id)
      .order('created_at', { ascending: false })

    setIsLoading(false)

    if (error) {
      toast.error('Failed to fetch logos')
      return
    }

    setLogos(data || [])
  }, [currentOrganization?.id, supabase, setLogos])

  const uploadLogo = useCallback(async (
    file: File,
    name: string,
    category: LogoCategory
  ): Promise<OrganizationLogo | null> => {
    if (!currentOrganization?.id) {
      toast.error('No organization selected')
      return null
    }

    setIsLoading(true)

    try {
      // Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${currentOrganization.id}/${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('logos')
        .getPublicUrl(fileName)

      // Create logo record
      const { data: logo, error: dbError } = await supabase
        .from('organization_logos')
        .insert({
          organization_id: currentOrganization.id,
          name,
          category,
          file_url: urlData.publicUrl,
          file_size_bytes: file.size,
        })
        .select()
        .single()

      if (dbError) throw dbError

      await fetchLogos()
      toast.success('Logo uploaded successfully')
      return logo
    } catch (error) {
      console.error('Error uploading logo:', error)
      toast.error('Failed to upload logo')
      return null
    } finally {
      setIsLoading(false)
    }
  }, [currentOrganization?.id, supabase, fetchLogos])

  const deleteLogo = useCallback(async (logoId: string) => {
    const logo = logos.find(l => l.id === logoId)
    if (!logo) return false

    setIsLoading(true)

    try {
      // Delete from database
      const { error } = await supabase
        .from('organization_logos')
        .delete()
        .eq('id', logoId)

      if (error) throw error

      // Delete from storage (extract path from URL)
      const urlParts = logo.file_url.split('/logos/')
      if (urlParts[1]) {
        await supabase.storage.from('logos').remove([urlParts[1]])
      }

      await fetchLogos()
      toast.success('Logo deleted successfully')
      return true
    } catch (error) {
      console.error('Error deleting logo:', error)
      toast.error('Failed to delete logo')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [logos, supabase, fetchLogos])

  const setDefaultLogo = useCallback(async (logoId: string) => {
    if (!currentOrganization?.id) return false

    setIsLoading(true)

    try {
      // First, unset all defaults
      await supabase
        .from('organization_logos')
        .update({ is_default: false })
        .eq('organization_id', currentOrganization.id)

      // Set new default
      const { error } = await supabase
        .from('organization_logos')
        .update({ is_default: true })
        .eq('id', logoId)

      if (error) throw error

      await fetchLogos()
      toast.success('Default logo updated')
      return true
    } catch (error) {
      console.error('Error setting default logo:', error)
      toast.error('Failed to set default logo')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [currentOrganization?.id, supabase, fetchLogos])

  const getLogosByCategory = useCallback((category: LogoCategory) => {
    return logos.filter(l => l.category === category)
  }, [logos])

  const getDefaultLogo = useCallback(() => {
    return logos.find(l => l.is_default) || logos[0]
  }, [logos])

  // Fetch logos on mount
  useEffect(() => {
    fetchLogos()
  }, [fetchLogos])

  return {
    logos,
    isLoading,
    fetchLogos,
    uploadLogo,
    deleteLogo,
    setDefaultLogo,
    getLogosByCategory,
    getDefaultLogo,
  }
}
