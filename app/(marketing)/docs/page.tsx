/**
 * Docs Index Page
 * Redirects to the main integration guide
 */

import { redirect } from 'next/navigation'

export default function DocsPage() {
  redirect('/docs/integration-guide')
}
