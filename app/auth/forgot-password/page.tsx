'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
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
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2, Mail } from 'lucide-react'
import { ROUTES } from '@/lib/config/constants'

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>

export default function ForgotPasswordPage() {
  const supabase = useMemo(() => createClient(), [])
  const [isLoading, setIsLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const form = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  })

  async function onSubmit(data: ForgotPasswordForm) {
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset-password`,
      })
      if (error) {
        toast.error(error.message)
        return
      }
      // Always show success — don't reveal whether the email exists (security)
      setSubmitted(true)
    } catch {
      toast.error('Unable to connect to authentication service. Please check your internet connection and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-8 sm:py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center px-4 sm:px-6">
          <div className="flex justify-center mb-3 sm:mb-4">
            <Logo size="lg" />
          </div>
          <CardTitle className="text-lg sm:text-xl">
            {submitted ? 'Check your email' : 'Reset your password'}
          </CardTitle>
          <CardDescription>
            {submitted
              ? "We've sent a password reset link to your email address."
              : "Enter your email and we'll send you a link to reset your password."}
          </CardDescription>
        </CardHeader>

        <CardContent className="px-4 sm:px-6">
          {submitted ? (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="rounded-full bg-primary/10 p-4">
                <Mail className="h-8 w-8 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Didn&apos;t receive the email? Check your spam folder, or{' '}
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="text-primary hover:underline font-medium"
                >
                  try again
                </button>
                .
              </p>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="your@email.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full gradient-yi" disabled={isLoading}>
                  {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Send reset link
                </Button>
              </form>
            </Form>
          )}
        </CardContent>

        <CardFooter className="flex justify-center px-4 sm:px-6">
          <p className="text-sm text-muted-foreground text-center">
            Remember your password?{' '}
            <Link href={ROUTES.login} className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
