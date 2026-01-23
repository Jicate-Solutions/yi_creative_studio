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

  // Reposition bug reporter button to avoid bottom nav on mobile
  useEffect(() => {
    const adjustBugReporterPosition = () => {
      // Detect mobile vs desktop (matches bottom nav lg:hidden breakpoint)
      const isMobile = window.innerWidth < 1024

      // Detect safe area insets (iOS notch, Android gesture bar)
      let safeAreaBottom = 0
      if (typeof window !== 'undefined') {
        const computedValue = getComputedStyle(document.documentElement)
          .getPropertyValue('--safe-area-inset-bottom')
        safeAreaBottom = parseInt(computedValue || '0', 10)
      }

      // Button positioning: multiple selectors for SDK flexibility
      const buttonSelectors = [
        '[data-bug-reporter-button]',
        'button[class*="bug-reporter"]',
        'button[aria-label*="bug" i]',
        'button[aria-label*="report" i]',
        'body > div > button[style*="position: fixed"]', // Aggressive for inline styles
      ]

      for (const selector of buttonSelectors) {
        const btn = document.querySelector(selector) as HTMLElement
        if (btn) {
          // Apply responsive positioning
          if (isMobile) {
            // Mobile: Position above bottom nav (80px base + safe area)
            btn.style.bottom = `${80 + safeAreaBottom}px`
            btn.style.right = '16px'
          } else {
            // Desktop: Standard position (no nav visible at lg:)
            btn.style.bottom = '20px'
            btn.style.right = '20px'
          }

          // Z-index: Above bottom nav (z-80), below More menu (z-90)
          btn.style.zIndex = '85'
          btn.style.left = 'auto'
          btn.style.position = 'fixed'
          btn.style.pointerEvents = 'auto'

          // Touch optimization for mobile
          btn.style.minWidth = '48px'
          btn.style.minHeight = '48px'
          btn.style.touchAction = 'manipulation'
          // @ts-ignore - webkit property not in TS types
          btn.style.webkitTapHighlightColor = 'transparent'

          break
        }
      }

      // Modal z-index: Above button (z-85), below More menu (z-90)
      const modalSelectors = [
        '[data-bug-reporter-modal]',
        'div[class*="bug-reporter-modal"]',
        'div[aria-label*="bug" i][role="dialog"]',
        'div[aria-label*="report" i][role="dialog"]',
      ]

      for (const selector of modalSelectors) {
        const modal = document.querySelector(selector) as HTMLElement
        if (modal) {
          modal.style.zIndex = '87'
          break
        }
      }
    }

    // MutationObserver for SDK injection
    const observer = new MutationObserver(adjustBugReporterPosition)
    observer.observe(document.body, { childList: true, subtree: true })

    // Initial attempts with progressive delays (SDK may load slowly)
    adjustBugReporterPosition()
    setTimeout(adjustBugReporterPosition, 500)
    setTimeout(adjustBugReporterPosition, 1000)
    setTimeout(adjustBugReporterPosition, 2000)

    // Resize handler for orientation changes
    window.addEventListener('resize', adjustBugReporterPosition)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', adjustBugReporterPosition)
    }
  }, [])

  return (
    <>
      <style jsx global>{`
        /* Bug Reporter Button - Mobile Positioning */
        [data-bug-reporter-button],
        button[class*="bug-reporter"],
        button[aria-label*="bug" i],
        button[aria-label*="report" i] {
          bottom: calc(80px + env(safe-area-inset-bottom, 0px)) !important;
          right: 16px !important;
          z-index: 85 !important;
          min-width: 48px !important;
          min-height: 48px !important;
          touch-action: manipulation !important;
          -webkit-tap-highlight-color: transparent !important;
          position: fixed !important;
          pointer-events: auto !important;
        }

        /* Aggressive selector for SDK inline styles */
        body > div > button[style*="position: fixed"],
        body > button[style*="position: fixed"] {
          bottom: calc(80px + env(safe-area-inset-bottom, 0px)) !important;
          z-index: 85 !important;
        }

        /* Desktop Override - Matches bottom nav lg:hidden breakpoint (1024px) */
        @media (min-width: 1024px) {
          [data-bug-reporter-button],
          button[class*="bug-reporter"],
          button[aria-label*="bug" i],
          button[aria-label*="report" i],
          body > div > button[style*="position: fixed"],
          body > button[style*="position: fixed"] {
            bottom: 20px !important;
            right: 20px !important;
          }
        }

        /* Bug Reporter Modal - Z-Index */
        [data-bug-reporter-modal],
        div[class*="bug-reporter-modal"],
        div[aria-label*="bug" i][role="dialog"],
        div[aria-label*="report" i][role="dialog"] {
          z-index: 87 !important;
        }

        /* Mobile Modal Viewport Optimization */
        @media (max-width: 1023px) {
          [data-bug-reporter-modal],
          div[class*="bug-reporter-modal"] {
            max-height: 90dvh !important;
            padding-bottom: env(safe-area-inset-bottom, 16px) !important;
          }
        }
      `}</style>

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
    </>
  )
}
