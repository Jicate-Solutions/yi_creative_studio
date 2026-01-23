'use client'

import { useState, useMemo, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Logo } from '@/components/layout/logo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2, Users, Building2, ArrowRight } from 'lucide-react'
import { ROUTES, DEFAULT_BRAND_CONFIG } from '@/lib/config/constants'

// Simplified schemas - minimal fields
const joinOrgSchema = z.object({
  inviteCode: z.string().min(6, 'Invite code must be 6 characters').max(6, 'Invite code must be 6 characters'),
})

const createOrgSchema = z.object({
  name: z.string().min(2, 'Organization name must be at least 2 characters'),
})

type JoinOrgForm = z.infer<typeof joinOrgSchema>
type CreateOrgForm = z.infer<typeof createOrgSchema>

// Wrapper component for Suspense boundary
export default function OnboardingPage() {
  return (
    <Suspense fallback={<OnboardingLoading />}>
      <OnboardingContent />
    </Suspense>
  )
}

function OnboardingLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    </div>
  )
}

function OnboardingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = useMemo(() => createClient(), [])
  const [isJoining, setIsJoining] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  // Check for pre-filled invite code from URL
  const prefilledCode = searchParams.get('code')

  const joinForm = useForm<JoinOrgForm>({
    resolver: zodResolver(joinOrgSchema),
    defaultValues: {
      inviteCode: prefilledCode || '',
    },
  })

  const createForm = useForm<CreateOrgForm>({
    resolver: zodResolver(createOrgSchema),
    defaultValues: {
      name: '',
    },
  })

  // Generate slug from organization name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }

  async function onJoinOrg(data: JoinOrgForm) {
    setIsJoining(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Please sign in first')
      router.push(ROUTES.login)
      return
    }

    // Find organization by invite code
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('id, name')
      .eq('invite_code', data.inviteCode.toUpperCase())
      .eq('is_active', true)
      .single()

    if (orgError || !org) {
      setIsJoining(false)
      toast.error('Invalid invite code. Please check and try again.')
      return
    }

    // Check if already a member
    const { data: existingMember } = await supabase
      .from('organization_members')
      .select('id')
      .eq('organization_id', org.id)
      .eq('user_id', user.id)
      .single()

    if (existingMember) {
      setIsJoining(false)
      toast.info(`You're already a member of ${org.name}`)
      router.push(ROUTES.dashboard)
      return
    }

    // Add user as viewer
    const { error: memberError } = await supabase
      .from('organization_members')
      .insert({
        organization_id: org.id,
        user_id: user.id,
        role: 'viewer',
      })

    setIsJoining(false)

    if (memberError) {
      toast.error('Failed to join organization. Please try again.')
      return
    }

    toast.success(`Welcome to ${org.name}!`)
    router.push(ROUTES.dashboard)
    router.refresh()
  }

  async function onCreateOrg(data: CreateOrgForm) {
    setIsCreating(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Please sign in first')
      router.push(ROUTES.login)
      return
    }

    // Generate slug and invite code
    const slug = generateSlug(data.name)
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase()

    // Create organization with defaults
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: data.name,
        slug: slug,
        type: 'yi_chapter', // Default type, can be changed later
        invite_code: inviteCode,
        brand_config: DEFAULT_BRAND_CONFIG,
        credits_balance: 10, // Free starter credits
      })
      .select()
      .single()

    if (orgError) {
      setIsCreating(false)
      if (orgError.code === '23505') {
        toast.error('An organization with this name already exists. Try a different name.')
      } else {
        toast.error(orgError.message)
      }
      return
    }

    // Add user as admin
    const { error: memberError } = await supabase
      .from('organization_members')
      .insert({
        organization_id: org.id,
        user_id: user.id,
        role: 'admin',
      })

    setIsCreating(false)

    if (memberError) {
      toast.error('Failed to set you as admin. Please contact support.')
      return
    }

    toast.success('Organization created! You received 10 free credits.')
    router.push(ROUTES.dashboard)
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Logo size="lg" />
          </div>
          <CardTitle className="text-2xl">Get Started</CardTitle>
          <CardDescription>
            Join an organization or create your own
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* JOIN SECTION - Primary action for invited users */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Users className="h-4 w-4" />
              Have an invite code?
            </div>
            <Form {...joinForm}>
              <form onSubmit={joinForm.handleSubmit(onJoinOrg)} className="flex gap-2">
                <FormField
                  control={joinForm.control}
                  name="inviteCode"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input
                          placeholder="YTFHDX"
                          className="text-center text-lg tracking-widest uppercase font-mono"
                          maxLength={6}
                          {...field}
                          onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="gradient-yi shrink-0"
                  disabled={isJoining || joinForm.watch('inviteCode').length < 6}
                >
                  {isJoining ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      Join
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </div>

          {/* DIVIDER */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">or</span>
            </div>
          </div>

          {/* CREATE SECTION */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Building2 className="h-4 w-4" />
              Create your organization
            </div>
            <Form {...createForm}>
              <form onSubmit={createForm.handleSubmit(onCreateOrg)} className="space-y-3">
                <FormField
                  control={createForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="sr-only">Organization Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Yi Chennai"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  variant="outline"
                  className="w-full"
                  disabled={isCreating}
                >
                  {isCreating ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Building2 className="h-4 w-4 mr-2" />
                  )}
                  Create Organization
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  You&apos;ll be the admin and receive 10 free credits
                </p>
              </form>
            </Form>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
