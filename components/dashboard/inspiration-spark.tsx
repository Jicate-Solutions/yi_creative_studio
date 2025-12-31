'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Sparkles, ArrowUpRight, Palette, Wand2 } from 'lucide-react'
import { ROUTES } from '@/lib/config/constants'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

const INSPIRATION_STYLES = [
    {
        id: 'neon-cyber',
        title: 'Neon Cyber',
        category: '3D Render',
        color: 'from-pink-500 to-violet-600',
        bg: 'bg-black',
        image: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=1974&auto=format&fit=crop'
    },
    {
        id: 'glass-morphism',
        title: 'Glass Prism',
        category: 'Abstract',
        color: 'from-cyan-400 to-blue-500',
        bg: 'bg-slate-900',
        image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1964&auto=format&fit=crop'
    },
    {
        id: 'paper-cutout',
        title: 'Paper Cutout',
        category: 'Poster',
        color: 'from-orange-400 to-red-500',
        bg: 'bg-zinc-900',
        image: 'https://images.unsplash.com/photo-1614850523060-8da1d56ae167?q=80&w=2070&auto=format&fit=crop'
    },
    {
        id: 'ink-flow',
        title: 'Ink Flow',
        category: 'Artistic',
        color: 'from-emerald-400 to-teal-500',
        bg: 'bg-stone-900',
        image: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=2070&auto=format&fit=crop'
    }
]

export function InspirationSpark() {
    return (
        <div className="h-full bg-card border border-border rounded-[2rem] p-6 relative overflow-hidden flex flex-col shadow-sm group hover:border-primary/20 transition-colors">

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-primary/10 text-primary">
                        <Sparkles className="w-4 h-4" />
                    </div>
                    <h3 className="text-foreground font-medium">Spark Inspiration</h3>
                </div>
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary text-xs h-8 gap-1" asChild>
                    <Link href={ROUTES.templates}>
                        View All <ArrowUpRight className="w-3 h-3" />
                    </Link>
                </Button>
            </div>

            {/* Grid */}
            <div className="flex-1 grid grid-cols-2 gap-3 min-h-0">
                {INSPIRATION_STYLES.map((style, index) => (
                    <motion.div
                        key={style.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        className="relative group/card rounded-2xl overflow-hidden cursor-pointer"
                    >
                        {/* Background Image/Gradient */}
                        <div className="absolute inset-0">
                            <img
                                src={style.image}
                                alt={style.title}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover/card:scale-110"
                            />
                            <div className="absolute inset-0 bg-black/20 group-hover/card:bg-black/40 transition-colors" />

                            {/* Gradient Overlay */}
                            <div className={cn(
                                "absolute inset-0 opacity-0 group-hover/card:opacity-60 transition-opacity duration-500 mix-blend-overlay bg-gradient-to-br",
                                style.color
                            )} />
                        </div>

                        {/* Content */}
                        <div className="absolute inset-0 p-4 flex flex-col justify-end">
                            <span className="text-[10px] font-medium text-white/70 uppercase tracking-wider mb-1 translate-y-2 opacity-0 group-hover/card:translate-y-0 group-hover/card:opacity-100 transition-all duration-300">
                                {style.category}
                            </span>
                            <h4 className="text-white font-medium text-sm leading-tight translate-y-2 group-hover/card:translate-y-0 transition-transform duration-300">
                                {style.title}
                            </h4>
                        </div>

                        {/* Action Icon */}
                        <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center opacity-0 group-hover/card:opacity-100 hover:!bg-white/20 transition-all duration-300 translate-y-2 group-hover/card:translate-y-0">
                            <Wand2 className="w-4 h-4 text-white" />
                        </div>

                        {/* Link Overlay */}
                        <Link href={`${ROUTES.create}?style=${style.id}`} className="absolute inset-0 z-10" />
                    </motion.div>
                ))}
            </div>
        </div>
    )
}
