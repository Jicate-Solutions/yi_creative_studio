'use client'

import { useAuth } from '@/lib/providers/auth-provider'
import { useAuthStore } from '@/stores/auth-store'
import { Logo } from './logo'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Bell,
  Settings,
  LogOut,
  User,
  CreditCard,
  Building2,
  ChevronDown,
  Coins,
} from 'lucide-react'
import Link from 'next/link'
import { ROUTES } from '@/lib/config/constants'
import { RoleSwitcher } from '@/components/rbac'

export function TopNav() {
  const { user, profile, signOut, currentOrganization } = useAuth()
  const { organizations, switchOrganization } = useAuthStore()

  const initials = profile?.full_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase() || user?.email?.[0].toUpperCase() || '?'

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80 shadow-sm">
      <div className="flex h-16 items-center px-4 md:px-6 gap-4">
        {/* Logo - Mobile only */}
        <div className="md:hidden">
          <Logo size="sm" showText={false} />
        </div>

        {/* Organization Switcher */}
        {currentOrganization && organizations.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2 max-w-[200px]">
                <Building2 className="h-4 w-4 shrink-0" />
                <span className="truncate">{currentOrganization.name}</span>
                <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[200px]">
              <DropdownMenuLabel>Switch Organization</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {organizations.map((org) => (
                <DropdownMenuItem
                  key={org.id}
                  onClick={() => switchOrganization(org.id)}
                  className="gap-2"
                >
                  <Building2 className="h-4 w-4" />
                  <span className="truncate">{org.name}</span>
                  {org.id === currentOrganization.id && (
                    <Badge variant="secondary" className="ml-auto text-xs">
                      Current
                    </Badge>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Role Switcher - Admins only */}
        <RoleSwitcher />

        {/* Credits Display */}
        {currentOrganization && (
          <Link href={ROUTES.billing}>
            <Button variant="outline" size="sm" className="gap-2 rounded-full px-4 hover:bg-primary/5 transition-colors">
              <Coins className="h-4 w-4 text-amber-500" />
              <span className="font-semibold">
                {currentOrganization.credits_balance.toLocaleString()}
              </span>
              <span className="text-muted-foreground hidden sm:inline text-xs">credits</span>
            </Button>
          </Link>
        )}

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative rounded-full hover:bg-muted transition-colors">
          <Bell className="h-5 w-5" />
          <span className="sr-only">Notifications</span>
          {/* Notification dot */}
          <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-destructive ring-2 ring-background" />
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full ring-2 ring-transparent hover:ring-primary/20 transition-all">
              <Avatar className="h-9 w-9">
                <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || ''} />
                <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {profile?.full_name || 'User'}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={ROUTES.profile} className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={ROUTES.billing} className="cursor-pointer">
                <CreditCard className="mr-2 h-4 w-4" />
                Billing
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={ROUTES.brandConfig} className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => signOut()}
              className="cursor-pointer text-destructive focus:text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
