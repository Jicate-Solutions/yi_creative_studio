'use client'

import { useState, useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useOrganization } from '@/hooks'
import { useClientAdmin } from '@/hooks/use-client-admin'
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import { Slider } from '@/components/ui/slider'
import { toast } from 'sonner'
import { Loader2, Palette, Save, RotateCcw } from 'lucide-react'
import { DEFAULT_BRAND_CONFIG } from '@/lib/config/constants'

const brandConfigSchema = z.object({
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format'),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format'),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format'),
  fontPrimary: z.string().min(1, 'Primary font is required'),
  fontSecondary: z.string().min(1, 'Secondary font is required'),
  headerZoneHeight: z.number().min(5).max(30),
  footerZoneHeight: z.number().min(5).max(30),
  footerText: z.string().optional(),
  footerEmail: z.string().email().optional().or(z.literal('')),
  footerWebsite: z.string().url().optional().or(z.literal('')),
  footerPhone: z.string().optional(),
  footerAddress: z.string().optional(),
  footerSocial: z.object({
    instagram: z.string().optional(),
    linkedin: z.string().optional(),
    facebook: z.string().optional(),
    twitter: z.string().optional(),
  }).optional(),
})

type BrandConfigForm = z.infer<typeof brandConfigSchema>

export default function BrandConfigPage() {
  const { organization, brandConfig, updateBrandConfig } = useOrganization()
  const [isSaving, setIsSaving] = useState(false)

  const { isAdmin, isReady } = useClientAdmin()

  const form = useForm<BrandConfigForm>({
    resolver: zodResolver(brandConfigSchema),
    defaultValues: {
      primaryColor: DEFAULT_BRAND_CONFIG.primaryColor,
      secondaryColor: DEFAULT_BRAND_CONFIG.secondaryColor,
      accentColor: DEFAULT_BRAND_CONFIG.accentColor,
      fontPrimary: DEFAULT_BRAND_CONFIG.fontPrimary,
      fontSecondary: DEFAULT_BRAND_CONFIG.fontSecondary,
      headerZoneHeight: DEFAULT_BRAND_CONFIG.headerZoneHeight,
      footerZoneHeight: DEFAULT_BRAND_CONFIG.footerZoneHeight,
      footerText: DEFAULT_BRAND_CONFIG.footerText,
      footerEmail: DEFAULT_BRAND_CONFIG.footerEmail,
      footerWebsite: DEFAULT_BRAND_CONFIG.footerWebsite,
      footerPhone: DEFAULT_BRAND_CONFIG.footerPhone,
      footerAddress: DEFAULT_BRAND_CONFIG.footerAddress,
      footerSocial: DEFAULT_BRAND_CONFIG.footerSocial,
    },
  })

  // Load existing config
  useEffect(() => {
    if (brandConfig) {
      form.reset({
        primaryColor: brandConfig.primaryColor || DEFAULT_BRAND_CONFIG.primaryColor,
        secondaryColor: brandConfig.secondaryColor || DEFAULT_BRAND_CONFIG.secondaryColor,
        accentColor: brandConfig.accentColor || DEFAULT_BRAND_CONFIG.accentColor,
        fontPrimary: brandConfig.fontPrimary || DEFAULT_BRAND_CONFIG.fontPrimary,
        fontSecondary: brandConfig.fontSecondary || DEFAULT_BRAND_CONFIG.fontSecondary,
        headerZoneHeight: brandConfig.headerZoneHeight || DEFAULT_BRAND_CONFIG.headerZoneHeight,
        footerZoneHeight: brandConfig.footerZoneHeight || DEFAULT_BRAND_CONFIG.footerZoneHeight,
        footerText: brandConfig.footerText || '',
        footerEmail: brandConfig.footerEmail || '',
        footerWebsite: brandConfig.footerWebsite || '',
        footerPhone: brandConfig.footerPhone || '',
        footerAddress: brandConfig.footerAddress || '',
        footerSocial: brandConfig.footerSocial || {
          instagram: '',
          linkedin: '',
          facebook: '',
          twitter: '',
        },
      })
    }
  }, [brandConfig, form])

  async function onSubmit(data: BrandConfigForm) {
    if (!isReady || !isAdmin) {
      toast.error('Only admins can update brand configuration')
      return
    }

    setIsSaving(true)
    const success = await updateBrandConfig(data)
    setIsSaving(false)

    if (!success) {
      toast.error('Failed to save changes')
    }
  }

  function handleReset() {
    form.reset(DEFAULT_BRAND_CONFIG as BrandConfigForm)
    toast.info('Reset to default values')
  }

  const watchPrimary = form.watch('primaryColor')
  const watchSecondary = form.watch('secondaryColor')
  const watchAccent = form.watch('accentColor')

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Brand Configuration</h1>
        <p className="text-muted-foreground">
          Customize your brand colors, fonts, and creative layout settings
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Colors */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Brand Colors
              </CardTitle>
              <CardDescription>
                Define your organization&apos;s color palette
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="primaryColor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primary Color</FormLabel>
                      <FormControl>
                        <div className="flex gap-2">
                          <div
                            className="w-10 h-10 rounded-lg border cursor-pointer"
                            style={{ backgroundColor: field.value }}
                          >
                            <input
                              type="color"
                              value={field.value}
                              onChange={(e) => field.onChange(e.target.value)}
                              className="opacity-0 w-full h-full cursor-pointer"
                              disabled={!isReady || !isAdmin}
                            />
                          </div>
                          <Input
                            {...field}
                            placeholder="#005B96"
                            disabled={!isReady || !isAdmin}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="secondaryColor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Secondary Color</FormLabel>
                      <FormControl>
                        <div className="flex gap-2">
                          <div
                            className="w-10 h-10 rounded-lg border cursor-pointer"
                            style={{ backgroundColor: field.value }}
                          >
                            <input
                              type="color"
                              value={field.value}
                              onChange={(e) => field.onChange(e.target.value)}
                              className="opacity-0 w-full h-full cursor-pointer"
                              disabled={!isReady || !isAdmin}
                            />
                          </div>
                          <Input
                            {...field}
                            placeholder="#FF6B35"
                            disabled={!isReady || !isAdmin}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="accentColor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Accent Color</FormLabel>
                      <FormControl>
                        <div className="flex gap-2">
                          <div
                            className="w-10 h-10 rounded-lg border cursor-pointer"
                            style={{ backgroundColor: field.value }}
                          >
                            <input
                              type="color"
                              value={field.value}
                              onChange={(e) => field.onChange(e.target.value)}
                              className="opacity-0 w-full h-full cursor-pointer"
                              disabled={!isReady || !isAdmin}
                            />
                          </div>
                          <Input
                            {...field}
                            placeholder="#00A86B"
                            disabled={!isReady || !isAdmin}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Color Preview */}
              <div className="p-4 rounded-lg border bg-muted/30">
                <Label className="text-sm text-muted-foreground mb-2 block">
                  Color Preview
                </Label>
                <div className="flex gap-2">
                  <div
                    className="flex-1 h-20 rounded-lg"
                    style={{ backgroundColor: watchPrimary }}
                  />
                  <div
                    className="flex-1 h-20 rounded-lg"
                    style={{ backgroundColor: watchSecondary }}
                  />
                  <div
                    className="flex-1 h-20 rounded-lg"
                    style={{ backgroundColor: watchAccent }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Typography */}
          <Card>
            <CardHeader>
              <CardTitle>Typography</CardTitle>
              <CardDescription>
                Choose fonts for your creatives
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="fontPrimary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primary Font</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Inter"
                          disabled={!isReady || !isAdmin}
                        />
                      </FormControl>
                      <FormDescription>
                        Used for headings and titles
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fontSecondary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Secondary Font</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Poppins"
                          disabled={!isReady || !isAdmin}
                        />
                      </FormControl>
                      <FormDescription>
                        Used for body text
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Layout Zones */}
          <Card>
            <CardHeader>
              <CardTitle>Layout Settings</CardTitle>
              <CardDescription>
                Configure header and footer zones for logo placement
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="headerZoneHeight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Header Zone Height: {field.value}%</FormLabel>
                      <FormControl>
                        <Slider
                          value={[field.value ?? 10]}
                          onValueChange={(v: number[]) => field.onChange(v[0])}
                          min={5}
                          max={30}
                          step={1}
                          disabled={!isReady || !isAdmin}
                        />
                      </FormControl>
                      <FormDescription>
                        Reserved space at top for logos
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="footerZoneHeight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Footer Zone Height: {field.value}%</FormLabel>
                      <FormControl>
                        <Slider
                          value={[field.value ?? 10]}
                          onValueChange={(v: number[]) => field.onChange(v[0])}
                          min={5}
                          max={30}
                          step={1}
                          disabled={!isReady || !isAdmin}
                        />
                      </FormControl>
                      <FormDescription>
                        Reserved space at bottom for logos/info
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Footer Info */}
          <Card>
            <CardHeader>
              <CardTitle>Footer Information</CardTitle>
              <CardDescription>
                Default text to include in creative footers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="footerText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Footer Text</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Yi Chennai"
                        disabled={!isReady || !isAdmin}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="footerEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Email</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          placeholder="contact@yichennai.org"
                          disabled={!isReady || !isAdmin}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="footerWebsite"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="https://yichennai.org"
                          disabled={!isReady || !isAdmin}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="footerPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="tel"
                          placeholder="+91 98765 43210"
                          disabled={!isReady || !isAdmin}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="footerAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Physical Address</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="123 Business Park, Chennai"
                          disabled={!isReady || !isAdmin}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Social Media Handles */}
              <div className="space-y-4 pt-4 border-t">
                <Label className="text-sm font-medium">Social Media Handles</Label>
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="footerSocial.instagram"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Instagram</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="@yichennai"
                            disabled={!isReady || !isAdmin}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="footerSocial.linkedin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>LinkedIn</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="company/yi-chennai"
                            disabled={!isReady || !isAdmin}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="footerSocial.facebook"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Facebook</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="yichennai"
                            disabled={!isReady || !isAdmin}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="footerSocial.twitter"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>X (Twitter)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="@yichennai"
                            disabled={!isReady || !isAdmin}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          {isReady && isAdmin && (
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-0 justify-between">
              <Button type="button" variant="outline" onClick={handleReset} className="w-full sm:w-auto">
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset to Defaults
              </Button>
              <Button type="submit" disabled={isSaving} className="w-full sm:w-auto">
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Changes
              </Button>
            </div>
          )}
        </form>
      </Form>
    </div>
  )
}
