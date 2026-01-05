import Link from 'next/link'
import { Logo } from '@/components/layout/logo'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle } from 'lucide-react'
import { ROUTES } from '@/lib/config/constants'

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-8 sm:py-12">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="px-4 sm:px-6">
          <div className="flex justify-center mb-3 sm:mb-4">
            <Logo size="lg" />
          </div>
          <div className="mx-auto w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-3 sm:mb-4">
            <AlertTriangle className="h-7 w-7 sm:h-8 sm:w-8 text-destructive" />
          </div>
          <CardTitle className="text-xl sm:text-2xl">Authentication Error</CardTitle>
          <CardDescription>
            Something went wrong during authentication.
            This could be due to an expired or invalid link.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 px-4 sm:px-6">
          <div className="bg-muted/50 rounded-lg p-3 sm:p-4 text-sm text-muted-foreground">
            <p>
              Please try signing in again. If the problem persists,
              contact support for assistance.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Button asChild className="gradient-yi">
              <Link href={ROUTES.login}>
                Try again
              </Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href={ROUTES.home}>
                Back to home
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
