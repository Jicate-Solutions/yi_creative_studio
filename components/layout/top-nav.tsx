'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
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
  Settings,
  LogOut,
  User,
  CreditCard,
  Building2,
  ChevronDown,
  Coins,
  Sparkles,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ROUTES } from '@/lib/config/constants'
import { RoleSwitcher } from '@/components/rbac'
import { cn } from '@/lib/utils'
import { ThemeToggle } from '@/components/ui/theme-toggle'

export function TopNav() {
  const { user, profile, signOut, currentOrganization } = useAuth()
  const { organizations, switchOrganization } = useAuthStore()
  const router = useRouter()

  const initials = profile?.full_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase() || user?.email?.[0].toUpperCase() || '?'

  const handleCreate = () => {
    router.push(ROUTES.create)
  }

  return (
    <header className="sticky top-0 z-50 w-full px-4 py-3 md:px-8 md:py-4 pointer-events-none">
      {/* Floating HUD Island */}
      <div className="mx-auto max-w-7xl pointer-events-auto">
        <div className={cn(
          "relative h-16 md:h-18 px-4 md:px-6 flex items-center gap-4 rounded-[2.5rem]",
          "bg-background/40 backdrop-blur-3xl border border-white/10 dark:border-white/5 shadow-2xl transition-all duration-500",
          "shadow-[0_0_80px_rgba(245,158,11,0.08)]",
          "supports-[backdrop-filter]:bg-background/40"
        )}>
          {/* Group 1: Branding & Context (Intelligence) */}
          <div className="flex items-center gap-4">


            {/* Role Switcher - HUD Style */}
            <div className="hidden lg:block">
              <RoleSwitcher />
            </div>

            {/* Organization Switcher */}
            {currentOrganization && organizations.length > 1 && (
              <div suppressHydrationWarning>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="hidden lg:flex gap-2 rounded-2xl bg-muted/20 hover:bg-muted/40 text-muted-foreground hover:text-foreground border border-transparent hover:border-border/50 transition-all">
                      <Building2 className="h-4 w-4 shrink-0" />
                      <span className="truncate max-w-[120px] text-xs font-bold">{currentOrganization.name}</span>
                      <ChevronDown className="h-3 w-3 shrink-0 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-[200px] rounded-[1.5rem] border-border/50 bg-background/95 backdrop-blur-xl">
                    <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground p-3">Switch Domain</DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-border/10" />
                    {organizations.map((org) => (
                      <DropdownMenuItem
                        key={org.id}
                        onClick={() => switchOrganization(org.id)}
                        className="gap-3 p-3 rounded-xl focus:bg-primary/10 transition-colors"
                      >
                        <Building2 className="h-4 w-4 text-primary" />
                        <span className="flex-1 truncate font-medium">{org.name}</span>
                        {org.id === currentOrganization.id && (
                          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>

          {/* Group 2: Kinetic Actions (Center-Right) */}
          <div className="flex-1 flex items-center justify-end gap-3 md:gap-5">
            {/* Quick Create - Studio Style */}
            <Button
              onClick={handleCreate}
              className={cn(
                'rounded-2xl px-6 h-11 font-black shadow-lg shadow-primary/20',
                'bg-primary text-primary-foreground',
                'hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98]',
                'transition-all duration-300 group'
              )}
            >
              <Sparkles className="h-4 w-4 mr-2 group-hover:rotate-12 transition-transform" />
              <span className="hidden md:inline uppercase tracking-widest text-[10px]">Create</span>
            </Button>

            {/* Credits Pill - HUD Counter */}
            {currentOrganization && (
              <Link href={ROUTES.billing}>
                <div
                  className={cn(
                    'flex items-center gap-2 rounded-2xl px-4 h-11',
                    'bg-amber-500/10 border border-amber-500/20',
                    'hover:border-amber-500/40 hover:bg-amber-500/15',
                    'hover:scale-[1.02] active:scale-[0.98]',
                    'transition-all duration-300 cursor-pointer group'
                  )}
                >
                  <Coins className="h-4 w-4 text-amber-500 group-hover:rotate-[20deg] transition-transform" />
                  <div className="flex flex-col items-start leading-none">
                    <span className="font-black text-sm text-amber-600 dark:text-amber-400">
                      {currentOrganization.credits_balance.toLocaleString()}
                    </span>
                    <span className="text-[8px] font-black uppercase tracking-tighter text-amber-500/60">Balance</span>
                  </div>
                </div>
              </Link>
            )}

            {/* Utilities (Theme, Profile) */}
            <div className="flex items-center gap-2 h-11 bg-muted/20 rounded-2xl p-1 border border-border/10">
              <ThemeToggle />

              <div suppressHydrationWarning>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative h-9 w-9 rounded-xl p-0 group/avatar border border-transparent hover:border-primary/30 transition-all"
                    >
                      <Avatar className="h-full w-full rounded-xl shrink-0">
                        <AvatarImage src={profile?.avatar_url || undefined} className="object-cover" />
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs font-black rounded-xl uppercase">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64 mt-2 rounded-[2rem] border-border/50 shadow-2xl bg-background/95 backdrop-blur-xl">
                    <DropdownMenuLabel className="p-4 bg-muted/30 rounded-t-[2rem]">
                      <div className="flex flex-col gap-1">
                        <p className="text-sm font-black text-foreground">
                          {profile?.full_name || 'Creative Artist'}
                        </p>
                        <p className="text-[10px] text-muted-foreground uppercase font-medium tracking-tight truncate">
                          {user?.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <div className="p-2 space-y-1">
                      <DropdownMenuItem asChild className="rounded-xl p-3 focus:bg-primary/10 cursor-pointer">
                        <Link href={ROUTES.profile} className="flex items-center w-full">
                          <User className="mr-3 h-4 w-4 text-muted-foreground" />
                          <span className="font-bold text-sm">Artist Profile</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="rounded-xl p-3 focus:bg-primary/10 cursor-pointer">
                        <Link href={ROUTES.billing} className="flex items-center w-full">
                          <CreditCard className="mr-3 h-4 w-4 text-muted-foreground" />
                          <span className="font-bold text-sm">Studio Credits</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="rounded-xl p-3 focus:bg-primary/10 cursor-pointer">
                        <Link href={ROUTES.brandConfig} className="flex items-center w-full">
                          <Settings className="mr-3 h-4 w-4 text-muted-foreground" />
                          <span className="font-bold text-sm">Global Settings</span>
                        </Link>
                      </DropdownMenuItem>
                    </div>
                    <DropdownMenuSeparator className="bg-border/10" />
                    <div className="p-2">
                      <DropdownMenuItem
                        onClick={() => signOut()}
                        className="rounded-xl p-3 text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
                      >
                        <LogOut className="mr-3 h-4 w-4" />
                        <span className="font-bold text-sm">Sign Out Area</span>
                      </DropdownMenuItem>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>

  )
}
