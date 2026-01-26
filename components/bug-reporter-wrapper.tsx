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

      // Button positioning: specific selectors for bug-reporter SDK only
      // Avoid broad selectors that could affect other fixed buttons
      const buttonSelectors = [
        '.bug-reporter-sdk.bug-reporter-floating-btn',
        'button.bug-reporter-floating-btn',
        '[data-bug-reporter-button]',
        '#bug-reporter-button',
        '.bug-reporter-button',
      ]

      for (const selector of buttonSelectors) {
        const btn = document.querySelector(selector) as HTMLElement
        if (btn) {
          // Apply responsive positioning with setProperty for !important
          if (isMobile) {
            // Mobile: Position above bottom nav, LEFT side (opposite of FAB)
            // Bottom nav is 64px + safe area, add 8px padding
            btn.style.setProperty('bottom', `${80 + safeAreaBottom}px`, 'important')
            btn.style.setProperty('left', '16px', 'important')
            btn.style.setProperty('right', 'auto', 'important')
          } else {
            // Desktop: Standard position LEFT side (opposite of other floating elements)
            btn.style.setProperty('bottom', '20px', 'important')
            btn.style.setProperty('left', '20px', 'important')
            btn.style.setProperty('right', 'auto', 'important')
          }

          // Z-index: Above bottom nav (z-80), below More menu (z-90)
          btn.style.setProperty('z-index', '85', 'important')
          btn.style.setProperty('position', 'fixed', 'important')
          btn.style.setProperty('pointer-events', 'auto', 'important')

          // Touch optimization for mobile
          btn.style.setProperty('min-width', '48px', 'important')
          btn.style.setProperty('min-height', '48px', 'important')
          btn.style.setProperty('touch-action', 'manipulation', 'important')
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
        /* Bug Reporter Button - Mobile Positioning (LEFT SIDE, opposite of FAB) */
        /* Only target specific bug-reporter SDK elements */
        .bug-reporter-sdk.bug-reporter-floating-btn,
        button.bug-reporter-floating-btn,
        [data-bug-reporter-button],
        #bug-reporter-button,
        .bug-reporter-button {
          bottom: calc(80px + env(safe-area-inset-bottom, 0px)) !important;
          left: 16px !important;
          right: auto !important;
          z-index: 85 !important;
          min-width: 48px !important;
          min-height: 48px !important;
          touch-action: manipulation !important;
          -webkit-tap-highlight-color: transparent !important;
          position: fixed !important;
          pointer-events: auto !important;
        }

        /* Desktop Override - Matches bottom nav lg:hidden breakpoint (1024px) */
        @media (min-width: 1024px) {
          .bug-reporter-sdk.bug-reporter-floating-btn,
          button.bug-reporter-floating-btn,
          [data-bug-reporter-button],
          #bug-reporter-button,
          .bug-reporter-button {
            bottom: 20px !important;
            left: 20px !important;
            right: auto !important;
          }
        }

        /* Bug Reporter Modal - Z-Index */
        [data-bug-reporter-modal],
        div[class*="bug-reporter-modal"] {
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
