'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
  FormDescription,
} from '@/components/ui/form'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { Loader2, Building2, Users } from 'lucide-react'
import { ROUTES, ORGANIZATION_TYPES, DEFAULT_BRAND_CONFIG } from '@/lib/config/constants'

const createOrgSchema = z.object({
  name: z.string().min(2, 'Organization name must be at least 2 characters'),
  slug: z
    .string()
    .min(3, 'Slug must be at least 3 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  type: z.enum(['yi_chapter', 'educational', 'corporate', 'ngo']),
})

const joinOrgSchema = z.object({
  inviteCode: z.string().min(6, 'Invite code must be at least 6 characters'),
})

type CreateOrgForm = z.infer<typeof createOrgSchema>
type JoinOrgForm = z.infer<typeof joinOrgSchema>

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()
  const [isCreating, setIsCreating] = useState(false)
  const [isJoining, setIsJoining] = useState(false)

  const createForm = useForm<CreateOrgForm>({
    resolver: zodResolver(createOrgSchema),
    defaultValues: {
      name: '',
      slug: '',
      type: 'yi_chapter',
    },
  })

  const joinForm = useForm<JoinOrgForm>({
    resolver: zodResolver(joinOrgSchema),
    defaultValues: {
      inviteCode: '',
    },
  })

  // Auto-generate slug from name
  const watchName = createForm.watch('name')
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }

  async function onCreateOrg(data: CreateOrgForm) {
    setIsCreating(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Please sign in first')
      router.push(ROUTES.login)
      return
    }

    // Generate invite code
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase()

    // Create organization
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: data.name,
        slug: data.slug,
        type: data.type,
        invite_code: inviteCode,
        brand_config: DEFAULT_BRAND_CONFIG,
        credits_balance: 10, // Free starter credits
      })
      .select()
      .single()

    if (orgError) {
      setIsCreating(false)
      if (orgError.code === '23505') {
        toast.error('An organization with this name or slug already exists')
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
      toast.error('Failed to add you to the organization')
      return
    }

    toast.success('Organization created! You received 10 free credits.')
    router.push(ROUTES.dashboard)
    router.refresh()
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
      .select('*')
      .eq('invite_code', data.inviteCode.toUpperCase())
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
      toast.error('You are already a member of this organization')
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
      toast.error('Failed to join organization')
      return
    }

    toast.success(`Welcome to ${org.name}!`)
    router.push(ROUTES.dashboard)
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-12">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Logo size="lg" />
          </div>
          <CardTitle className="text-2xl">Get Started</CardTitle>
          <CardDescription>
            Create a new organization or join an existing one with an invite code
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="create" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="create" className="gap-2">
                <Building2 className="h-4 w-4" />
                Create New
              </TabsTrigger>
              <TabsTrigger value="join" className="gap-2">
                <Users className="h-4 w-4" />
                Join Existing
              </TabsTrigger>
            </TabsList>

            {/* Create Organization Tab */}
            <TabsContent value="create">
              <Form {...createForm}>
                <form onSubmit={createForm.handleSubmit(onCreateOrg)} className="space-y-4">
                  <FormField
                    control={createForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Organization Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Yi Chennai"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e)
                              const slug = generateSlug(e.target.value)
                              createForm.setValue('slug', slug)
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={createForm.control}
                    name="slug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>URL Slug</FormLabel>
                        <FormControl>
                          <Input placeholder="yi-chennai" {...field} />
                        </FormControl>
                        <FormDescription>
                          Used in your organization&apos;s URL
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={createForm.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Organization Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(ORGANIZATION_TYPES).map(([value, { label, description }]) => (
                              <SelectItem key={value} value={value}>
                                <div>
                                  <div className="font-medium">{label}</div>
                                  <div className="text-xs text-muted-foreground">{description}</div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full gradient-yi" disabled={isCreating}>
                    {isCreating && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    Create Organization
                  </Button>

                  <p className="text-xs text-center text-muted-foreground">
                    You&apos;ll receive 10 free credits to get started
                  </p>
                </form>
              </Form>
            </TabsContent>

            {/* Join Organization Tab */}
            <TabsContent value="join">
              <Form {...joinForm}>
                <form onSubmit={joinForm.handleSubmit(onJoinOrg)} className="space-y-4">
                  <FormField
                    control={joinForm.control}
                    name="inviteCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Invite Code</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="ABC123"
                            className="text-center text-lg tracking-widest uppercase"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Enter the 6-character invite code from your organization admin
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full gradient-yi" disabled={isJoining}>
                    {isJoining && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    Join Organization
                  </Button>

                  <p className="text-xs text-center text-muted-foreground">
                    Ask your organization admin for the invite code
                  </p>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
