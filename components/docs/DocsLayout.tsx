'use client'

/**
 * DocsLayout Component
 * Main layout wrapper for documentation pages
 */

import { ReactNode } from 'react'
import Link from 'next/link'
import { ArrowLeft, Menu } from 'lucide-react'
import DocsSidebar from './DocsSidebar'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'

interface DocsLayoutProps {
  children: ReactNode
  title: string
  description?: string
}

export default function DocsLayout({ children, title, description }: DocsLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              {/* Mobile menu */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="lg:hidden">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72 p-0">
                  <div className="p-4 border-b">
                    <h2 className="font-semibold">Documentation</h2>
                  </div>
                  <DocsSidebar />
                </SheetContent>
              </Sheet>

              {/* Logo/Back */}
              <Link
                href="/super-admin/webhooks/sources"
                className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Back to Event Sources</span>
              </Link>
            </div>

            {/* Brand */}
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
                <span className="text-white font-bold text-sm">Yi</span>
              </div>
              <span className="font-semibold text-slate-900 dark:text-white hidden sm:inline">
                CreativeStudio Docs
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar (desktop) */}
          <DocsSidebar />

          {/* Content */}
          <main className="flex-1 min-w-0">
            {/* Page Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                {title}
              </h1>
              {description && (
                <p className="text-lg text-slate-600 dark:text-slate-400">
                  {description}
                </p>
              )}
            </div>

            {/* Content */}
            <article className="prose prose-slate dark:prose-invert max-w-none">
              {children}
            </article>
          </main>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-600 dark:text-slate-400">
            <p>&copy; {new Date().getFullYear()} Yi CreativeStudio. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <Link href="/super-admin/webhooks" className="hover:text-slate-900 dark:hover:text-white">
                Webhooks Dashboard
              </Link>
              <Link href="/super-admin/webhooks/test" className="hover:text-slate-900 dark:hover:text-white">
                Test Webhook
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
