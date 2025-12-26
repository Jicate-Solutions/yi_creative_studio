'use client'

import { BugReporterProvider } from '@boobalan_jkkn/bug-reporter-sdk'
import { useEffect } from 'react'
import { useAuthStore } from '@/stores/auth-store'

interface BugReporterWrapperProps {
  children: React.ReactNode
}

export function BugReporterWrapper({ children }: BugReporterWrapperProps) {
  // Get user from auth-store instead of creating duplicate auth listener
  // This eliminates redundant onAuthStateChange subscriptions
  const { user } = useAuthStore()

  // Reposition bug reporter button above the FAB (right side, consistent on mobile & desktop)
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
          // Position on right side, above the FAB
          btn.style.left = 'auto'
          btn.style.right = '16px'
          btn.style.bottom = '100px' // Positioned above mobile FAB and navigation
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
      debug={false}
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
