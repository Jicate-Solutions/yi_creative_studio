import Link from 'next/link'
import { Logo } from '@/components/layout/logo'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Mail } from 'lucide-react'
import { ROUTES } from '@/lib/config/constants'

export default function VerifyPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-12">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <Logo size="lg" />
          </div>
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Mail className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Check your email</CardTitle>
          <CardDescription>
            We&apos;ve sent you a confirmation link to verify your email address.
            Please check your inbox and click the link to continue.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
            <p>
              Didn&apos;t receive the email? Check your spam folder or try signing up again.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Button asChild variant="outline">
              <Link href={ROUTES.signup}>
                Try again
              </Link>
            </Button>
            <Button asChild variant="ghost">
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
