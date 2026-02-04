/**
 * Docs Layout
 * Simple wrapper for documentation pages
 */

import { ReactNode } from 'react'

export const metadata = {
  title: 'Documentation | Yi CreativeStudio',
  description: 'Integration guides and API documentation for Yi CreativeStudio',
}

export default function DocsLayoutWrapper({
  children,
}: {
  children: ReactNode
}) {
  return <>{children}</>
}
