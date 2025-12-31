'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Command as CommandPrimitive } from 'cmdk'
import {
    Calculator,
    Calendar,
    CreditCard,
    Settings,
    User,
    LayoutDashboard,
    Sparkles,
    Images,
    Search,
    Zap
} from 'lucide-react'
import { ROUTES } from '@/lib/config/constants'
import { useUIStore } from '@/stores/ui-store'

export function CommandMenu() {
    const router = useRouter()
    const [open, setOpen] = React.useState(false)

    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                setOpen((open) => !open)
            }
        }

        document.addEventListener('keydown', down)
        return () => document.removeEventListener('keydown', down)
    }, [])

    const runCommand = React.useCallback((command: () => unknown) => {
        setOpen(false)
        command()
    }, [])

    if (!open) return null

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] px-4 pointer-events-none">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-background/80 backdrop-blur-sm pointer-events-auto"
                onClick={() => setOpen(false)}
            />

            <div className="relative w-full max-w-lg pointer-events-auto shadow-2xl rounded-xl overflow-hidden border border-white/10 bg-[#0F0F16] animate-in fade-in zoom-in-95 duration-200">
                <CommandPrimitive
                    className="w-full flex flex-col overflow-hidden rounded-xl bg-transparent"
                    loop
                >
                    <div className="flex items-center px-4 border-b border-white/5" cmdk-input-wrapper="">
                        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                        <CommandPrimitive.Input
                            placeholder="What do you want to create?..."
                            className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                        />
                    </div>

                    <CommandPrimitive.List className="max-h-[300px] overflow-y-auto overflow-x-hidden py-2 px-2">
                        <CommandPrimitive.Empty className="py-6 text-center text-sm text-muted-foreground">
                            No results found.
                        </CommandPrimitive.Empty>

                        <CommandPrimitive.Group heading="Quick Actions" className="px-2 py-1.5 text-xs font-medium text-muted-foreground/70 uppercase tracking-wider mb-2">
                            <CommandItem onSelect={() => runCommand(() => router.push(ROUTES.create))} icon={Sparkles} shortcut="C">
                                Create New Project
                            </CommandItem>
                            <CommandItem onSelect={() => runCommand(() => router.push(ROUTES.dashboard))} icon={LayoutDashboard} shortcut="D">
                                Go to Dashboard
                            </CommandItem>
                            <CommandItem onSelect={() => runCommand(() => router.push(ROUTES.gallery))} icon={Images} shortcut="G">
                                View Gallery
                            </CommandItem>
                        </CommandPrimitive.Group>

                        <CommandPrimitive.Group heading="Settings" className="px-2 py-1.5 text-xs font-medium text-muted-foreground/70 uppercase tracking-wider mb-2">
                            <CommandItem onSelect={() => runCommand(() => router.push(ROUTES.profile))} icon={User}>
                                Profile
                            </CommandItem>
                            <CommandItem onSelect={() => runCommand(() => router.push(ROUTES.billing))} icon={CreditCard}>
                                Billing
                            </CommandItem>
                            <CommandItem onSelect={() => runCommand(() => router.push(ROUTES.brandConfig))} icon={Settings}>
                                Settings
                            </CommandItem>
                        </CommandPrimitive.Group>

                        <CommandPrimitive.Group heading="Creation Tools" className="px-2 py-1.5 text-xs font-medium text-muted-foreground/70 uppercase tracking-wider mb-2">
                            <CommandItem onSelect={() => runCommand(() => router.push(`${ROUTES.create}?format=event_poster`))} icon={Zap}>
                                Event Poster
                            </CommandItem>
                            <CommandItem onSelect={() => runCommand(() => router.push(`${ROUTES.create}?format=social_post`))} icon={Zap}>
                                Social Post
                            </CommandItem>
                        </CommandPrimitive.Group>

                    </CommandPrimitive.List>
                </CommandPrimitive>
            </div>
        </div>
    )
}

function CommandItem({ children, icon: Icon, shortcut, onSelect }: any) {
    return (
        <CommandPrimitive.Item
            onSelect={onSelect}
            className="relative flex cursor-default select-none items-center rounded-lg px-3 py-2.5 text-sm outline-none data-[selected=true]:bg-primary/20 data-[selected=true]:text-primary mb-1 transition-colors"
        >
            <Icon className="mr-3 h-4 w-4" />
            <span>{children}</span>
            {shortcut && (
                <span className="ml-auto text-xs tracking-widest text-muted-foreground bg-white/5 px-1.5 py-0.5 rounded border border-white/5">
                    ⌘{shortcut}
                </span>
            )}
        </CommandPrimitive.Item>
    )
}
