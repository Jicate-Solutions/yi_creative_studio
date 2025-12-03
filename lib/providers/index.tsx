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
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
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
