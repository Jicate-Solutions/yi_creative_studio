import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Yi CreativeStudio | AI-Powered Brand Creative Generation',
}

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
