'use client'

import { BugReporterProvider } from '@boobalan_jkkn/bug-reporter-sdk'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface BugReporterWrapperProps {
  children: React.ReactNode
}

export function BugReporterWrapper({ children }: BugReporterWrapperProps) {
  const [user, setUser] = useState<{
    id: string
    email?: string
    user_metadata?: { full_name?: string }
  } | null>(null)

  useEffect(() => {
    const supabase = createClient()

    // Get initial user
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
    })

    // Subscribe to auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return (
    <BugReporterProvider
      apiKey={process.env.NEXT_PUBLIC_BUG_REPORTER_API_KEY!}
      apiUrl={process.env.NEXT_PUBLIC_BUG_REPORTER_API_URL!}
      enabled={true}
      debug={process.env.NODE_ENV === 'development'}
      userContext={
        user
          ? {
              userId: user.id,
              name: user.user_metadata?.full_name || user.email || 'Unknown',
              email: user.email || '',
            }
          : undefined
      }
    >
      {children}
    </BugReporterProvider>
  )
}
