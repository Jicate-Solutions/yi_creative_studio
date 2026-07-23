'use client'

import { BugReporterProvider, MyBugsPanel } from '@boobalan_jkkn/bug-reporter-sdk'
import { useEffect, useState } from 'react'
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
            // Mobile: Position above bottom nav + action bar, RIGHT side
            // Bottom nav is 64px + action bar ~56px + safe area, add buffer
            btn.style.setProperty('bottom', `${140 + safeAreaBottom}px`, 'important')
            btn.style.setProperty('right', '16px', 'important')
            btn.style.setProperty('left', 'auto', 'important')
          } else {
            // Desktop: Standard position RIGHT side (away from sidebar)
            btn.style.setProperty('bottom', '20px', 'important')
            btn.style.setProperty('right', '20px', 'important')
            btn.style.setProperty('left', 'auto', 'important')
          }

          // Z-index: Below bottom nav (z-80) so nav is always clickable
          btn.style.setProperty('z-index', '70', 'important')
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
        /* Bug Reporter Button - Mobile Positioning (RIGHT SIDE, away from sidebar) */
        /* Only target specific bug-reporter SDK elements */
        .bug-reporter-sdk.bug-reporter-floating-btn,
        button.bug-reporter-floating-btn,
        [data-bug-reporter-button],
        #bug-reporter-button,
        .bug-reporter-button {
          bottom: calc(140px + env(safe-area-inset-bottom, 0px)) !important;
          right: 16px !important;
          left: auto !important;
          z-index: 70 !important;
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
            right: 20px !important;
            left: auto !important;
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
        {user && <MyBugsDrawer />}
      </BugReporterProvider>
    </>
  )
}

function MyBugsDrawer() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="View my submitted bugs"
        className="fixed bottom-20 right-6 z-[60] flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-lg hover:bg-blue-700 transition-colors"
      >
        My Bugs
      </button>
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="My submitted bugs"
          className="fixed inset-0 z-[70] flex justify-end bg-black/50 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="h-full w-full max-w-2xl overflow-y-auto bg-white p-6 shadow-2xl dark:bg-gray-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">My Submitted Bugs</h2>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="rounded-md p-1 hover:bg-gray-100 dark:hover:bg-gray-800">×</button>
            </div>
            <MyBugsPanel />
          </div>
        </div>
      )}
    </>
  )
}
