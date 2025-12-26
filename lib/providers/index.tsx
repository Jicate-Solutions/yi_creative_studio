'use client'

import { ThemeProvider } from 'next-themes'
import { AuthProvider } from './auth-provider'
import { Toaster } from '@/components/ui/sonner'
import { BugReporterWrapper } from '@/components/bug-reporter-wrapper'

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange={false}
    >
      <BugReporterWrapper>
        <AuthProvider>
          {children}
          <Toaster position="top-right" richColors />
        </AuthProvider>
      </BugReporterWrapper>
    </ThemeProvider>
  )
}
