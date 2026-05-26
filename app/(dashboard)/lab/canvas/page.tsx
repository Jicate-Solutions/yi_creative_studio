'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

/**
 * Redirect /create/canvas to /create
 *
 * The canvas interface is now the default create page.
 * This redirect ensures old links to /create/canvas continue to work.
 */
export default function CanvasRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/create')
  }, [router])

  return null
}
