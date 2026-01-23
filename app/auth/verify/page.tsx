import Link from 'next/link'
import { Logo } from '@/components/layout/logo'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Mail } from 'lucide-react'
import { ROUTES } from '@/lib/config/constants'

export default function VerifyPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-8 sm:py-12">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="px-4 sm:px-6">
          <div className="flex justify-center mb-3 sm:mb-4">
            <Logo size="lg" />
          </div>
          <div className="mx-auto w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-primary/10 flex items-center justify-center mb-3 sm:mb-4">
            <Mail className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
          </div>
          <CardTitle className="text-xl sm:text-2xl">Check your email</CardTitle>
          <CardDescription>
            We&apos;ve sent you a confirmation link to verify your email address.
            Please check your inbox and click the link to continue.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5 px-4 sm:px-6">
          <div className="bg-muted/50 rounded-lg p-3 sm:p-4 text-sm text-muted-foreground">
            <p>
              Didn&apos;t receive the email? Check your spam folder or try signing up again.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Button asChild variant="outline" className="h-11">
              <Link href={ROUTES.signup}>
                Try again
              </Link>
            </Button>
            <Button asChild variant="ghost" className="h-11">
              <Link href={ROUTES.login}>
                Back to login
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
