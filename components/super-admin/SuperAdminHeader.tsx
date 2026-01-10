'use client'

/**
 * Super Admin Header Component
 * Displays user info, platform switcher, and quick actions
 */

import { User } from '@supabase/supabase-js'
import Link from 'next/link'
import { Shield, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface SuperAdminHeaderProps {
  user: User
}

export default function SuperAdminHeader({ user }: SuperAdminHeaderProps) {
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const userInitials = user.email
    ?.split('@')[0]
    .substring(0, 2)
    .toUpperCase() || 'SA'

  return (
    <header className="h-16 border-b border-gray-200 bg-white px-6 flex items-center justify-between sticky top-0 z-50">
      {/* Logo & Title */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Yi Platform Admin</h1>
            <p className="text-xs text-gray-500">Super Administrator Portal</p>
          </div>
        </div>
      </div>

      {/* Right Side: Actions & Profile */}
      <div className="flex items-center gap-4">
        {/* Switch to User Dashboard */}
        <Link href="/dashboard">
          <Button variant="outline" size="sm">
            Exit Admin Mode
          </Button>
        </Link>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-gradient-to-br from-purple-600 to-pink-600 text-white">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="text-sm font-medium">Super Admin</span>
                <span className="text-xs text-gray-500 truncate">{user.email}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
