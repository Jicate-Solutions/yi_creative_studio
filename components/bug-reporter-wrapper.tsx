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

  // Reposition bug reporter button to left side
  useEffect(() => {
    const adjustPosition = () => {
      // Target all possible bug reporter button selectors
      const selectors = [
        '[data-bug-reporter-button]',
        'button[class*="bug-reporter"]',
        'button[aria-label*="bug" i]',
        'button[aria-label*="report" i]',
      ]

      for (const selector of selectors) {
        const btn = document.querySelector(selector) as HTMLElement
        if (btn) {
          btn.style.right = 'auto'
          btn.style.left = '16px'
          break
        }
      }
    }

    const observer = new MutationObserver(adjustPosition)
    observer.observe(document.body, { childList: true, subtree: true })

    adjustPosition()
    setTimeout(adjustPosition, 500)
    setTimeout(adjustPosition, 1000)

    return () => observer.disconnect()
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
