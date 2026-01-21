'use client'

/**
 * Impersonation Banner Component
 * Displays a persistent warning banner when super admin is impersonating a user
 */

import { useState, useEffect } from 'react'
import { AlertTriangle, X, Clock, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ImpersonationSession {
  userId: string
  userName: string
  userEmail: string
  startedAt: string
  expiresAt: string
  durationMinutes: number
  restrictions: string[]
}

export default function ImpersonationBanner() {
  const [session, setSession] = useState<ImpersonationSession | null>(null)
  const [timeRemaining, setTimeRemaining] = useState<string>('')
  const [minimized, setMinimized] = useState(false)

  useEffect(() => {
    // Check for impersonation session in sessionStorage
    const storedSession = sessionStorage.getItem('impersonation_session')
    if (storedSession) {
      try {
        const parsed = JSON.parse(storedSession) as ImpersonationSession

        // Check if session has expired
        const expiresAt = new Date(parsed.expiresAt)
        if (expiresAt > new Date()) {
          setSession(parsed)
        } else {
          // Session expired, clean up
          sessionStorage.removeItem('impersonation_session')
        }
      } catch (e) {
        console.error('Failed to parse impersonation session:', e)
      }
    }
  }, [])

  useEffect(() => {
    if (!session) return

    // Update time remaining every second
    const interval = setInterval(() => {
      const expiresAt = new Date(session.expiresAt)
      const now = new Date()
      const diff = expiresAt.getTime() - now.getTime()

      if (diff <= 0) {
        // Session expired
        sessionStorage.removeItem('impersonation_session')
        setSession(null)
        window.location.href = '/super-admin'
        return
      }

      const minutes = Math.floor(diff / 60000)
      const seconds = Math.floor((diff % 60000) / 1000)
      setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`)
    }, 1000)

    return () => clearInterval(interval)
  }, [session])

  async function handleEndImpersonation() {
    try {
      // Call API to end impersonation session
      await fetch('/api/super-admin/users/impersonate/end', {
        method: 'POST',
      })
    } catch (e) {
      console.error('Failed to end impersonation session:', e)
    }

    // Clean up local storage
    sessionStorage.removeItem('impersonation_session')
    setSession(null)

    // Redirect back to super admin
    window.location.href = '/super-admin/users'
  }

  if (!session) return null

  if (minimized) {
    return (
      <div className="fixed top-0 right-4 z-[100]">
        <button
          onClick={() => setMinimized(false)}
          className="flex items-center gap-2 bg-amber-500 text-white px-3 py-2 rounded-b-lg shadow-lg hover:bg-amber-600 transition-colors"
        >
          <AlertTriangle className="h-4 w-4" />
          <span className="text-sm font-medium">Impersonating</span>
          <Clock className="h-3 w-3" />
          <span className="text-xs font-mono">{timeRemaining}</span>
        </button>
      </div>
    )
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Warning Section */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-full">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">Impersonation Mode Active</span>
                <span className="bg-white/20 px-2 py-0.5 rounded text-xs font-medium">
                  {session.userName || session.userEmail}
                </span>
              </div>
              <p className="text-sm text-white/80">
                Actions are logged. Read-only in sensitive areas.
              </p>
            </div>
          </div>

          {/* Timer and Actions */}
          <div className="flex items-center gap-4">
            {/* Restrictions */}
            <div className="hidden md:flex items-center gap-2 text-sm">
              <Shield className="h-4 w-4" />
              <span>
                {session.restrictions.length > 0
                  ? session.restrictions.slice(0, 2).join(', ')
                  : 'Standard restrictions'}
              </span>
            </div>

            {/* Timer */}
            <div className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-lg">
              <Clock className="h-4 w-4" />
              <span className="font-mono text-sm">{timeRemaining}</span>
              <span className="text-xs text-white/70">remaining</span>
            </div>

            {/* End Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleEndImpersonation}
              className="bg-white text-amber-600 hover:bg-amber-50 hover:text-amber-700 border-white"
            >
              End Session
            </Button>

            {/* Minimize */}
            <button
              onClick={() => setMinimized(true)}
              className="p-1.5 hover:bg-white/20 rounded transition-colors"
              title="Minimize banner"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Helper function to start an impersonation session
 * Call this from UserSearchTable after successful impersonation API call
 */
export function startImpersonationSession(data: {
  userId: string
  userName: string
  userEmail: string
  durationMinutes: number
  restrictions: string[]
}) {
  const now = new Date()
  const expiresAt = new Date(now.getTime() + data.durationMinutes * 60000)

  const session: ImpersonationSession = {
    userId: data.userId,
    userName: data.userName,
    userEmail: data.userEmail,
    startedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    durationMinutes: data.durationMinutes,
    restrictions: data.restrictions,
  }

  sessionStorage.setItem('impersonation_session', JSON.stringify(session))
}
