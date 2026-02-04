'use client'

/**
 * DocsSidebar Component
 * Navigation sidebar for documentation pages
 */

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronDown, ChevronRight, BookOpen, Webhook, Code, FileJson, AlertCircle, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'

interface NavItem {
  title: string
  href?: string
  icon?: React.ReactNode
  children?: NavItem[]
}

const navigation: NavItem[] = [
  {
    title: 'Getting Started',
    icon: <BookOpen className="h-4 w-4" />,
    children: [
      { title: 'Overview', href: '/docs/integration-guide#overview' },
      { title: 'Architecture', href: '/docs/integration-guide#architecture' },
    ],
  },
  {
    title: 'Webhook Integration',
    icon: <Webhook className="h-4 w-4" />,
    children: [
      { title: 'Endpoint', href: '/docs/integration-guide#endpoint' },
      { title: 'Headers', href: '/docs/integration-guide#headers' },
      { title: 'Authentication', href: '/docs/integration-guide#authentication' },
    ],
  },
  {
    title: 'Event Schema',
    icon: <FileJson className="h-4 w-4" />,
    children: [
      { title: 'Request Body', href: '/docs/integration-guide#request-body' },
      { title: 'Required Fields', href: '/docs/integration-guide#required-fields' },
      { title: 'Optional Fields', href: '/docs/integration-guide#optional-fields' },
      { title: 'Speaker Schema', href: '/docs/integration-guide#speaker-schema' },
    ],
  },
  {
    title: 'Code Examples',
    icon: <Code className="h-4 w-4" />,
    children: [
      { title: 'cURL', href: '/docs/integration-guide#curl-example' },
      { title: 'JavaScript', href: '/docs/integration-guide#javascript-example' },
      { title: 'Python', href: '/docs/integration-guide#python-example' },
    ],
  },
  {
    title: 'Deep Linking',
    icon: <Zap className="h-4 w-4" />,
    children: [
      { title: 'Create Poster Link', href: '/docs/integration-guide#deep-linking' },
    ],
  },
  {
    title: 'Troubleshooting',
    icon: <AlertCircle className="h-4 w-4" />,
    children: [
      { title: 'Error Codes', href: '/docs/integration-guide#error-codes' },
      { title: 'Common Issues', href: '/docs/integration-guide#common-issues' },
    ],
  },
]

interface NavGroupProps {
  item: NavItem
  pathname: string
}

function NavGroup({ item, pathname }: NavGroupProps) {
  const [isOpen, setIsOpen] = useState(true)
  const hasChildren = item.children && item.children.length > 0

  return (
    <div className="space-y-1">
      <Button
        variant="ghost"
        onClick={() => hasChildren && setIsOpen(!isOpen)}
        className={cn(
          'w-full justify-start gap-2 text-sm font-medium',
          'text-slate-700 hover:text-slate-900 hover:bg-slate-100',
          'dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800'
        )}
      >
        {item.icon}
        <span className="flex-1 text-left">{item.title}</span>
        {hasChildren && (
          isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
        )}
      </Button>

      {hasChildren && isOpen && (
        <div className="ml-6 space-y-1 border-l border-slate-200 dark:border-slate-700 pl-3">
          {item.children?.map((child) => (
            <Link
              key={child.href}
              href={child.href || '#'}
              className={cn(
                'block py-1.5 px-2 text-sm rounded-md transition-colors',
                pathname === child.href
                  ? 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800'
              )}
            >
              {child.title}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default function DocsSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 flex-shrink-0 hidden lg:block">
      <div className="sticky top-20 h-[calc(100vh-5rem)]">
        <ScrollArea className="h-full py-6 pr-4">
          <nav className="space-y-2">
            {navigation.map((item) => (
              <NavGroup key={item.title} item={item} pathname={pathname} />
            ))}
          </nav>
        </ScrollArea>
      </div>
    </aside>
  )
}
