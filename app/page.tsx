'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ROUTES } from '@/lib/config/constants'
import { motion, useScroll, useTransform } from 'framer-motion'
import {
  Sparkles,
  Zap,
  Palette,
  ArrowRight,
  ImageIcon,
  Layout,
  Star,
  Users,
  Shield,
  MoveRight,
  CheckCircle2,
  Clock,
  Layers,
  Download,
  Lock,
  Settings,
  Menu,
  X,
  LogIn
} from 'lucide-react'
import { useRef, useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { CreativeCursor } from '@/components/ui/creative-cursor'



const stats = [
  { value: '~30s', label: 'Gen Time', sublabel: 'Instant creation' },
  { value: '30+', label: 'Formats', sublabel: 'Posters to certificates' },
  { value: '100%', label: 'On-Brand', sublabel: 'Perfect compliance' },
  { value: '24/7', label: 'AI Ready', sublabel: 'Always available' },
]

export default function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div ref={containerRef} className="min-h-screen bg-yi text-foreground dark:text-white selection:bg-primary selection:text-white overflow-x-hidden scroll-smooth">
      {/* Hide bug reporter on public landing page */}
      <style>{`
        .bug-reporter-sdk.bug-reporter-floating-btn,
        button.bug-reporter-floating-btn,
        [data-bug-reporter-button],
        #bug-reporter-button,
        .bug-reporter-button { display: none !important; }
      `}</style>
      <CreativeCursor />
      {/* Navigation - Floating Pill */}
      <nav className="fixed top-4 sm:top-6 left-1/2 -translate-x-1/2 w-[95%] sm:w-[90%] max-w-6xl z-50 rounded-full bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-xl shadow-primary/10 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/15">
        <div className="px-3 sm:px-4">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Logo Section */}
            <div className="flex items-center gap-3 pl-2 sm:pl-4">
              <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm sm:text-base font-extrabold tracking-tighter text-foreground dark:text-white uppercase leading-none">Yi Creative</span>
                <span className="text-xs font-bold text-muted-foreground/60 dark:text-white/40 tracking-[0.2em] sm:tracking-[0.3em] uppercase leading-none mt-0.5">Studio</span>
              </div>
            </div>

            {/* Desktop Links Section */}
            <div className="hidden sm:flex items-center gap-1 sm:gap-2 pr-2 sm:pr-3">
              <div className="hidden lg:flex items-center bg-slate-100/50 dark:bg-white/5 rounded-full px-2 py-1.5 mr-2 border border-slate-200/50 dark:border-white/5">
                {['Features', 'Pricing', 'Showcase'].map((item) => (
                  <Link key={item} href={`#${item.toLowerCase()}`} className="px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-widest text-foreground/70 dark:text-white/70 hover:text-foreground dark:hover:text-white hover:bg-white dark:hover:bg-white/10 transition-all">
                    {item}
                  </Link>
                ))}
              </div>

              <ThemeToggle />

              <div className="flex items-center gap-2 pl-2 border-l border-slate-200/50 dark:border-white/10 ml-1">
                <Link href={ROUTES.login}>
                  <Button variant="ghost" size="sm" className="rounded-full text-xs font-bold uppercase tracking-widest hover:bg-slate-100/50 dark:hover:bg-white/5 h-9 px-4">Login</Button>
                </Link>
                <Link href={ROUTES.signup}>
                  <Button size="sm" className="btn-primary rounded-full px-5 h-9 text-xs font-extrabold uppercase tracking-widest shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 hover:scale-105 transition-all">
                    Join Now
                  </Button>
                </Link>
              </div>
            </div>

            {/* Mobile Menu */}
            <div className="flex sm:hidden items-center gap-2 pr-2">
              <ThemeToggle />
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[280px] sm:w-[350px]">
                  <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center">
                        <Sparkles className="h-4 w-4" />
                      </div>
                      Yi CreativeStudio
                    </SheetTitle>
                  </SheetHeader>
                  <div className="flex flex-col gap-4 mt-8">
                    {/* Navigation Links */}
                    <div className="flex flex-col gap-2">
                      {['Features', 'Pricing', 'Showcase'].map((item) => (
                        <Link
                          key={item}
                          href={`#${item.toLowerCase()}`}
                          onClick={() => setMobileMenuOpen(false)}
                          className="px-4 py-3 rounded-lg text-sm font-semibold text-foreground/80 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                        >
                          {item}
                        </Link>
                      ))}
                    </div>

                    {/* Divider */}
                    <div className="border-t border-slate-200 dark:border-white/10 my-2" />

                    {/* Auth Buttons */}
                    <div className="flex flex-col gap-3">
                      <Link href={ROUTES.login} onClick={() => setMobileMenuOpen(false)}>
                        <Button variant="outline" className="w-full h-10 rounded-full font-semibold">
                          <LogIn className="h-4 w-4 mr-2" />
                          Login
                        </Button>
                      </Link>
                      <Link href={ROUTES.signup} onClick={() => setMobileMenuOpen(false)}>
                        <Button className="w-full h-10 rounded-full btn-primary font-semibold">
                          Get Started Free
                        </Button>
                      </Link>
                    </div>

                    {/* Info */}
                    <p className="text-xs text-muted-foreground text-center mt-4">
                      100 free credits • No credit card required
                    </p>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section: The Architectural Shift */}
      <section className="relative pt-28 pb-12 px-6 sm:px-8 overflow-hidden">
        {/* Background Perspective Grid (Creative Soul Injection) */}
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(rgba(0,91,150,0.15)_1px,transparent_1px),linear-gradient(90deg,rgba(0,91,150,0.15)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(0,91,150,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,91,150,0.05)_1px,transparent_1px)] bg-[size:100px_100px] [transform:perspective(500px)_rotateX(60deg)_translateY(-200px)] opacity-30 h-[150%]" />

        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center lg:items-start justify-between gap-10 lg:gap-16">
          {/* Architectural Card Stack (Now on Left for Impact) */}
          {/* Studio Console: The Professional Workspace (Split Filled Look) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex-1 w-full max-w-[650px] relative mt-16 lg:mt-0"
          >

            {/* The Console Container (Stripe-Clean) */}
            <div className="relative h-[420px] md:h-[500px] bg-slate-950 rounded-[2rem] border border-slate-800/50 shadow-xl flex flex-col overflow-hidden">
              {/* Simplified Header (Browser-style) */}
              <div className="border-b border-slate-800/50 bg-slate-950/50 backdrop-blur-sm">
                <div className="px-6 py-4 flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-300">Yi CreativeStudio</span>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs text-slate-400">Live</span>
                  </div>
                </div>
              </div>

              {/* Console Content - Poster Grid */}
              <div className="flex-1 relative p-8 overflow-hidden bg-slate-950/90">
                {/* Background Grid (Subtle) */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px]" />

                {/* 3 Poster Thumbnails Grid */}
                <div className="relative h-full flex items-center justify-center">
                  <div className="grid grid-cols-3 gap-4 w-full max-w-lg">
                    {[
                      { title: 'Marathon Event', chapter: 'Yi Chennai', img: '/images/showcase/diwali-greeting.png' },
                      { title: 'Road Safety', chapter: 'Yi Mumbai', img: '/images/showcase/birthday-post.png' },
                      { title: 'Masoom Initiative', chapter: 'Yi Delhi', img: '/images/showcase/autism-awareness.png' }
                    ].map((poster, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.5 + i * 0.1 }}
                        className="group cursor-default"
                      >
                        <div className="relative aspect-[3/4] rounded-lg overflow-hidden border border-white/10 bg-slate-900 shadow-lg hover:shadow-xl hover:border-primary/30 hover:-translate-y-1 transition-all duration-300">
                          <div
                            className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-500"
                            style={{ backgroundImage: `url('${poster.img}')` }}
                          />
                          {/* Subtle Gradient Overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                        </div>
                        <div className="mt-2 text-center">
                          <p className="text-xs font-medium text-slate-400">{poster.chapter}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Trust Indicator (Bottom) */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 1 }}
                  className="absolute bottom-6 left-1/2 -translate-x-1/2"
                >
                  <div className="px-4 py-2 rounded-full bg-slate-900/80 backdrop-blur-md border border-white/10 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs text-slate-400">Last generated: 2 minutes ago</span>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* Text Content (Right Column) */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="flex-1 text-center lg:text-left order-1 lg:order-2 lg:pt-8 space-y-8"
          >
            {/* Trust Badge (Stripe-style) */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100/80 dark:bg-white/[0.05] border border-slate-200/60 dark:border-white/10"
            >
              <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-medium text-slate-700 dark:text-white/70">Trusted by 70+ Yi Chapters</span>
            </motion.div>

            {/* Headline (Simplified, No Gradient) */}
            <motion.h1
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut", delay: 0.15 }}
              className="text-[clamp(2rem,4.5vw,3.5rem)] text-slate-900 dark:text-white leading-[1.1] tracking-tight font-bold"
            >
              Create On-Brand Creatives in 30 Seconds
            </motion.h1>

            {/* Subheadline (One Line) */}
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
              className="text-base text-slate-600 dark:text-white/70 max-w-lg font-normal leading-relaxed"
            >
              AI-powered design for Young Indians chapters. Perfect brand compliance. No design skills required.
            </motion.p>

            {/* Yi Chapter Logos Strip */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="space-y-3"
            >
              <p className="text-xs text-muted-foreground text-center lg:text-left">
                Trusted by leading Yi chapters
              </p>
              <div className="flex items-center gap-3 flex-wrap justify-center lg:justify-start">
                {['Chennai', 'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Pune'].map((city, i) => (
                  <motion.div
                    key={city}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.4 + i * 0.05 }}
                    className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-primary/30 hover:bg-slate-50 dark:hover:bg-white/[0.08] transition-colors"
                  >
                    <span className="text-sm font-semibold text-slate-700 dark:text-white/70">
                      Yi {city}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Clean Stats Grid (Stripe-style) */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="inline-flex items-center gap-6 sm:gap-8 py-4 px-6 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02]"
            >
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">200+</div>
                <div className="text-xs text-muted-foreground mt-1">Active Creators</div>
              </div>
              <div className="h-10 w-px bg-slate-200 dark:bg-white/10" />
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">70+</div>
                <div className="text-xs text-muted-foreground mt-1">Yi Chapters</div>
              </div>
              <div className="h-10 w-px bg-slate-200 dark:bg-white/10 hidden sm:block" />
              <div className="text-center hidden sm:block">
                <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">15K+</div>
                <div className="text-xs text-muted-foreground mt-1">Creatives</div>
              </div>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="flex flex-col items-center lg:items-start gap-4"
            >
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                <Link href={ROUTES.signup} className="w-full sm:w-auto">
                  <Button size="lg" className="h-12 w-full sm:w-auto px-6 rounded-full text-sm font-semibold group">
                    Start Creating Free
                    <MoveRight className="ml-3 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link href="#showcase">
                  <Button variant="outline" size="lg" className="h-12 px-6 rounded-full text-sm font-semibold">
                    Watch Demo
                  </Button>
                </Link>
              </div>

              {/* Supporting Info */}
              <p className="text-sm text-muted-foreground">
                100 free credits • No credit card required
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section: System Status */}
      <section className="border-y border-slate-200/40 dark:border-white/5 bg-slate-50/30 dark:bg-black/10 relative z-10">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-slate-200/40 dark:bg-white/5">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="py-8 px-5 bg-slate-50/30 dark:bg-black/10 flex flex-col items-center justify-center text-center group cursor-default hover:bg-white dark:hover:bg-white/[0.05] hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              >
                <div className="text-3xl md:text-4xl lg:text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-br from-primary to-primary/60 mb-3 tracking-tighter group-hover:scale-110 transition-transform duration-300">
                  {stat.value}
                </div>
                <div className="text-xs sm:text-sm font-extrabold uppercase tracking-[0.2em] text-foreground/70 dark:text-white/70 group-hover:text-primary transition-colors mb-2">
                  {stat.label}
                </div>
                {stat.sublabel && (
                  <div className="text-xs font-medium text-muted-foreground leading-relaxed max-w-[160px] opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    {stat.sublabel}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Chapter Logos Marquee */}
      <section className="py-8 border-y border-white/5 glass-subtle overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-center text-xs font-extrabold uppercase tracking-[0.3em] text-muted-foreground/70 dark:text-white/50 mb-8">
            Trusted by 70+ Yi Chapters Across India
          </p>

          <div className="relative">
            {/* Gradient overlays for fade effect */}
            <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-slate-50 dark:from-[#0d021b] to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-slate-50 dark:from-[#0d021b] to-transparent z-10 pointer-events-none" />

            <div className="flex gap-8 animate-marquee">
              {[
                'Yi Chennai', 'Yi Mumbai', 'Yi Delhi', 'Yi Bangalore', 'Yi Hyderabad',
                'Yi Pune', 'Yi Ahmedabad', 'Yi Kolkata', 'Yi Jaipur', 'Yi Chandigarh',
                'Yi Lucknow', 'Yi Kochi', 'Yi Indore', 'Yi Nagpur', 'Yi Coimbatore',
                // Duplicate for seamless loop
                'Yi Chennai', 'Yi Mumbai', 'Yi Delhi', 'Yi Bangalore', 'Yi Hyderabad',
                'Yi Pune', 'Yi Ahmedabad', 'Yi Kolkata', 'Yi Jaipur', 'Yi Chandigarh',
                'Yi Lucknow', 'Yi Kochi', 'Yi Indore', 'Yi Nagpur', 'Yi Coimbatore'
              ].map((chapter, i) => (
                <div key={i} className="flex-shrink-0 px-8 py-4 rounded-2xl glass-card transition-all hover:scale-105">
                  <span className="text-sm font-bold text-foreground/80 dark:text-white/80 hover:text-foreground dark:hover:text-white transition-colors whitespace-nowrap">
                    {chapter}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Kinetic Divider */}
      <div className="light-blade-divider my-12" />

      {/* Architectural Bento Grid */}
      <section className="py-14 px-6 sm:px-8" id="features">
        <div className="max-w-7xl mx-auto">
          <div className="mb-14 flex flex-col md:flex-row items-end justify-between gap-12">
            <div className="max-w-2xl">
              <h2 className="text-yi-bold text-2xl md:text-3xl mb-4 uppercase leading-none text-slate-900 dark:text-white">
                CREATE <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">PROFESSIONAL</span><br />CREATIVES IN <span className="text-secondary">30 SECONDS</span>
              </h2>
              <p className="text-base text-slate-600 dark:text-white/70 font-semibold tracking-tight">Simple 3-step workflow. Brand consistency guaranteed.</p>
            </div>
            <div className="text-right text-xs font-extrabold uppercase tracking-[0.2em] sm:tracking-[0.4em] text-slate-400/50 dark:text-white/30 mb-2 whitespace-nowrap">
              01 // CORE ARCHITECTURE
            </div>
          </div>

          {/* New Workflow: How It Works */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-14 relative">
            {/* Connector Line */}
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-slate-300 dark:via-white/10 to-transparent -translate-y-1/2 -z-10" />

            {[
              { icon: Users, step: '01', title: 'Upload Your Brand', desc: 'Add logo, colors, fonts once. Never worry about consistency again.' },
              { icon: Layout, step: '02', title: 'Choose Your Format', desc: '30+ templates: event posters, social posts, certificates, and more.' },
              { icon: Sparkles, step: '03', title: 'Generate & Download', desc: 'Get print-ready creatives in 30 seconds. Perfect for digital and print.' }
            ].map((item, i) => (
              <Link key={i} href={ROUTES.signup} className="group relative">
                <div className="bg-slate-100/80 dark:bg-black/80 border border-slate-200/50 dark:border-white/5 p-6 rounded-3xl hover:border-primary/50 transition-colors">
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-12 h-12 rounded-xl bg-slate-200/60 dark:bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <item.icon className="h-6 w-6 text-foreground dark:text-white" />
                    </div>
                    <span className="text-4xl font-extrabold text-muted-foreground/40 dark:text-white/40">{item.step}</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2">{item.title}</h3>
                  <p className="text-sm text-slate-700 dark:text-white/85 font-medium leading-relaxed">{item.desc}</p>
                </div>
              </Link>
            ))}
          </div>

          <div className="architectural-bento grid grid-cols-12 gap-6 auto-rows-[100px]">
            {/* Feature 1: Large Module */}
            <Link href={ROUTES.create} className="col-span-12 lg:col-span-8 row-span-4 bento-module group overflow-hidden relative block">
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&q=80&w=1200')] bg-cover bg-center opacity-10 group-hover:opacity-20 group-hover:scale-105 transition-all duration-1000 mix-blend-screen" />
              <div className="relative z-10 flex flex-col h-full">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-12 group-hover:rotate-12 transition-transform">
                  <Zap className="h-8 w-8 text-primary" />
                </div>
                <div className="inline-block mb-4 py-2 px-4 rounded-full bg-primary/20 border border-primary/40">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-primary">120x Faster</span>
                </div>
                <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-4 uppercase tracking-tight">30-Second Generation</h3>
                <p className="text-base text-slate-700 dark:text-white/90 font-semibold leading-relaxed max-w-lg mb-8">
                  What takes 2 hours in Canva takes 30 seconds here. AI handles design, you handle impact. Perfect for last-minute campaigns.
                </p>
                <div className="mt-auto pt-8 border-t border-slate-200/30 dark:border-white/5 flex items-center justify-between">
                  <div className="flex gap-3 items-center">
                    <Clock className="h-5 w-5 text-primary" />
                    <span className="text-sm font-bold text-foreground/60 dark:text-white/60">Average generation time</span>
                  </div>
                  <span className="text-2xl font-extrabold text-primary">~30s</span>
                </div>
              </div>
            </Link>

            {/* Feature 2: Tall Module - Link to Templates */}
            <Link href={ROUTES.gallery} className="col-span-12 md:col-span-6 lg:col-span-4 row-span-6 bento-module group overflow-hidden relative block">
              <div className="absolute inset-0 bg-[url('/images/yi-brand-showcase.png')] bg-cover bg-center opacity-20 group-hover:opacity-30 group-hover:scale-110 transition-all duration-1000" />
              <div className="relative z-10 flex flex-col h-full">
                <div className="w-14 h-14 rounded-2xl bg-secondary/10 flex items-center justify-center mb-10">
                  <Shield className="h-6 w-6 text-secondary" />
                </div>
                <div className="inline-block mb-4 py-2 px-4 rounded-full bg-secondary/20 border border-secondary/40">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-secondary">70+ Chapters Aligned</span>
                </div>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-4 uppercase tracking-tight">100% On-Brand,<br />Always</h3>
                <p className="text-sm text-slate-700 dark:text-white/90 font-semibold leading-relaxed mb-8">
                  Logo positions locked. Brand colors enforced. Guidelines automated. From Chennai to Chandigarh, pixel-perfect consistency.
                </p>
                <div className="mt-auto p-6 rounded-3xl bg-slate-100/60 dark:bg-black/40 border border-slate-200/40 dark:border-white/10 overflow-hidden relative">
                  <div className="absolute inset-0 bg-[url('/images/yi-brand-showcase.png')] bg-cover bg-center opacity-40" />
                  <div className="relative z-10">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-xs sm:text-[10px] font-extrabold uppercase tracking-widest text-slate-500/70 dark:text-white/40">Alignment_Core</span>
                      <span className="text-xs sm:text-[10px] font-extrabold uppercase tracking-widest text-secondary">Calibrating</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-200/40 dark:bg-white/5 rounded-full overflow-hidden">
                      <motion.div animate={{ width: ['0%', '100%'] }} transition={{ repeat: Infinity, duration: 4 }} className="h-full bg-secondary" />
                    </div>
                  </div>
                </div>
              </div>
            </Link>

            {/* Feature 3: Standard Module - Link to Verticals */}
            <Link href={ROUTES.create} className="col-span-12 md:col-span-6 lg:col-span-4 row-span-3 bento-module group overflow-hidden relative block">
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1615486363242-e0f4931d48d6?auto=format&fit=crop&q=80&w=800')] bg-cover bg-center opacity-10 mix-blend-overlay" />
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-xl bg-slate-200/40 dark:bg-white/5 flex items-center justify-center mb-8">
                  <Palette className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-4 uppercase tracking-tight">Every Format You Need</h3>
                <p className="text-base text-slate-700 dark:text-white/90 font-semibold leading-relaxed">
                  Event posters • Instagram stories • LinkedIn posts • Certificates • Flyers. 30+ templates, one platform.
                </p>
              </div>
            </Link>

            {/* Feature 4: Offset Module - Link to Fast Create */}
            <Link href={ROUTES.create} className="col-span-12 md:col-span-12 lg:col-span-4 row-span-3 bento-module group overflow-hidden relative block">
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&q=80&w=800')] bg-cover bg-center opacity-10 group-hover:scale-150 transition-transform duration-[2000ms]" />
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mb-8">
                  <Clock className="h-5 w-5 text-foreground dark:text-white" />
                </div>
                <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-4 uppercase tracking-tight">Smart for Every Initiative</h3>
                <p className="text-base text-slate-700 dark:text-white/90 font-semibold leading-relaxed">
                  Masoom feels warm and family-friendly. Road Safety uses high-visibility colors. Each vertical gets context-aware design.
                </p>
              </div>
            </Link>
          </div>
        </div>
      </section >

      {/* Testimonials Section */}
      <section className="py-16 px-6 sm:px-8 bg-slate-50/30 dark:bg-black/10 border-y border-slate-200/40 dark:border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10 space-y-4">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-2xl md:text-4xl font-extrabold uppercase tracking-tight text-slate-900 dark:text-white"
            >
              LOVED BY <span className="text-primary">70+ CHAPTERS.</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-base text-slate-700 dark:text-white/80 font-semibold"
            >
              Real results from Yi chapters across India
            </motion.p>
          </div>

          <div className="overflow-x-auto scrollbar-hide pb-8 -mx-6 px-6">
            <div className="flex gap-6 min-w-max">
              {[
                {
                  quote: "We went from 2 hours per poster to 30 seconds. Our Masoom campaign reached 10x more schools because we could generate materials faster.",
                  name: "Priya Sharma",
                  initials: "PS",
                  role: "Communications Head",
                  chapter: "Yi Chennai",
                  creativesGenerated: 127,
                  timeSaved: 84
                },
                {
                  quote: "Brand consistency across 15 chapters was impossible before. Now our Road Safety materials look professional everywhere, automatically.",
                  name: "Rajesh Kumar",
                  initials: "RK",
                  role: "Chapter Chair",
                  chapter: "Yi Mumbai",
                  creativesGenerated: 89,
                  timeSaved: 62
                },
                {
                  quote: "The logo position locking is a game-changer. We had chapters putting CII logo in the wrong corner. That's impossible now.",
                  name: "Anika Desai",
                  initials: "AD",
                  role: "Brand Manager",
                  chapter: "Yi National",
                  creativesGenerated: 350,
                  timeSaved: 240
                },
                {
                  quote: "No more WhatsApp follow-ups with designers. Our team can create professional event posters in minutes, not days.",
                  name: "Vikram Singh",
                  initials: "VS",
                  role: "Events Coordinator",
                  chapter: "Yi Bangalore",
                  creativesGenerated: 156,
                  timeSaved: 120
                }
              ].map((testimonial, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="min-w-[320px] sm:min-w-[420px] max-w-[420px] p-6 rounded-3xl snap-center bg-white/60 dark:bg-white/[0.03] backdrop-blur-xl border border-slate-200/50 dark:border-white/10 shadow-lg shadow-black/5 hover:shadow-xl hover:shadow-primary/10 hover:border-primary/30 hover:-translate-y-2 hover:scale-[1.02] transition-all duration-300"
                >
                  <p className="text-base sm:text-lg text-foreground/90 dark:text-white/90 mb-8 leading-relaxed font-medium">
                    "{testimonial.quote}"
                  </p>

                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 border-2 border-primary/40 flex items-center justify-center text-sm font-bold text-primary shadow-md">
                      {testimonial.initials}
                    </div>
                    <div>
                      <div className="text-foreground dark:text-white font-bold">{testimonial.name}</div>
                      <div className="text-muted-foreground text-sm">{testimonial.role} · {testimonial.chapter}</div>
                    </div>
                  </div>

                  <div className="flex gap-8 pt-6 border-t border-slate-200/40 dark:border-white/10">
                    <div>
                      <div className="text-xl font-extrabold text-primary mb-1">{testimonial.creativesGenerated}</div>
                      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Creatives</div>
                    </div>
                    <div>
                      <div className="text-xl font-extrabold text-secondary mb-1">{testimonial.timeSaved}hrs</div>
                      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Saved</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* New Section: Creative Showcase (Full Visual Impact) */}
      < section className="py-12 px-6 sm:px-8 relative overflow-hidden" id="showcase" >
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-14 mb-14">
            <div className="flex-1">
              <h2 className="text-yi-bold text-2xl md:text-4xl mb-6 uppercase leading-[0.85] tracking-tighter text-slate-900 dark:text-white">
                ONE PLATFORM, <br /><span className="text-secondary">30+ FORMATS</span>
              </h2>
              <p className="text-base text-slate-700 dark:text-white/80 font-semibold max-w-xl">From social media to print-ready certificates. Every format you need for Yi initiatives.</p>
            </div>
            <div className="w-full lg:w-1/3 aspect-[4/5] rounded-[4rem] overflow-hidden relative group shadow-2xl border border-slate-200/50 dark:border-white/10">
              <img src="/images/yi-brand-showcase.png" alt="Yi Platform - 30+ Creative Formats" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[2000ms]" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" />
              <div className="absolute bottom-8 left-8 right-8">
                <div className="text-xs font-extrabold uppercase tracking-[0.3em] sm:tracking-[0.4em] text-white/80 mb-2">Yi CreativeStudio</div>
                <div className="text-sm font-bold text-white">All formats. One platform.</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
            {[
              '/images/showcase/diwali-greeting.png',
              '/images/showcase/birthday-post.png',
              '/images/showcase/autism-awareness.png',
              '/images/showcase/pongal-greeting.png'
            ].map((url, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="aspect-square rounded-3xl overflow-hidden hover:scale-95 hover:rotate-2 transition-all duration-500 border border-slate-200/40 dark:border-white/10"
              >
                <img src={url} alt={`Yi CreativeStudio example ${i + 1}`} className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700" />
              </motion.div>
            ))}
          </div>

          {/* Format Type Badges */}
          <div className="flex flex-wrap gap-3 justify-center">
            {[
              'Event Posters', 'Social Posts', 'Certificates', 'Instagram Stories',
              'LinkedIn Banners', 'Flyers', 'YouTube Thumbnails', 'Facebook Ads'
            ].map(tag => (
              <span key={tag} className="px-4 py-2 rounded-full bg-slate-50/60 dark:bg-white/[0.03] border border-slate-200/40 dark:border-white/5 text-xs font-bold text-foreground/70 dark:text-white/50 hover:text-foreground dark:hover:text-white hover:bg-white/80 dark:hover:bg-white/[0.05] hover:border-slate-300/60 dark:hover:border-white/10 transition-all cursor-default">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </section >
      {/* CTA Section */}
      < section className="py-14 px-6 sm:px-8 text-center relative overflow-hidden" >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[160px] -z-10" />
        <div className="max-w-4xl mx-auto relative z-10">
          <h2 className="text-yi-bold text-3xl md:text-5xl mb-6 leading-none tracking-tighter uppercase text-slate-900 dark:text-white">
            READY TO <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">GENERATE?</span>
          </h2>
          <p className="text-base md:text-lg text-slate-700 dark:text-white/80 mb-8 font-semibold max-w-xl mx-auto">
            Join 70+ chapters already delivering brand excellence with Yi CreativeStudio.
          </p>
          <div className="flex flex-wrap justify-center gap-6 mb-16">
            {['Free trial credits', 'No credit card', '100% brand compliance', 'Cancel anytime'].map(badge => (
              <div key={badge} className="flex items-center gap-2 text-sm text-slate-700 dark:text-white/80 font-medium">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>{badge}</span>
              </div>
            ))}
          </div>
          <Link href={ROUTES.signup} className="w-full sm:w-auto">
            <Button size="lg" className="h-12 sm:h-14 px-6 sm:px-10 w-full sm:w-auto rounded-[2rem] btn-primary text-sm sm:text-base font-extrabold uppercase tracking-[0.15em] sm:tracking-[0.2em] shadow-2xl hover:scale-105 transition-transform">
              Join the studio now
            </Button>
          </Link>
        </div>
      </section >

      {/* Trust Indicators Bar */}
      <section className="py-10 border-y border-white/5 glass-subtle">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-center text-xs font-extrabold uppercase tracking-[0.3em] text-muted-foreground/70 dark:text-white/50 mb-10">
            ENTERPRISE-GRADE PLATFORM
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              {
                icon: Shield,
                label: "Enterprise Security",
                desc: "Supabase auth with RLS policies"
              },
              {
                icon: Lock,
                label: "Brand Protection",
                desc: "Automated logo position locking"
              },
              {
                icon: CheckCircle2,
                label: "100% Compliance",
                desc: "CII Yi guidelines enforced"
              },
              {
                icon: Users,
                label: "Dedicated Support",
                desc: "Free onboarding for chapters"
              }
            ].map((indicator, i) => (
              <div key={i} className="flex flex-col items-center text-center group">
                <div className="w-12 h-12 rounded-2xl glass-card flex items-center justify-center mb-4 group-hover:scale-110 group-hover:border-primary/30 transition-all duration-300">
                  <indicator.icon className="h-5 w-5 text-primary" />
                </div>
                <h4 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 dark:text-white mb-2">
                  {indicator.label}
                </h4>
                <p className="text-xs text-slate-600 dark:text-white/75 leading-relaxed max-w-[200px] font-medium">
                  {indicator.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="pt-10 pb-8 px-6 sm:px-8 bg-slate-50/30 dark:bg-black/10 border-t border-slate-200/40 dark:border-white/5">
        <div className="max-w-7xl mx-auto">
          {/* Footer Content */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
            {/* Brand Column */}
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <span className="text-base font-extrabold tracking-tighter text-foreground dark:text-white uppercase">Yi Creative</span>
              </div>
              <p className="text-sm text-muted-foreground mb-6 max-w-md leading-relaxed">
                AI-powered brand creative generation platform for Young Indians. Generate professional event posters, social posts, and marketing materials in 30 seconds.
              </p>
              <div className="flex items-center gap-4">
                <Link href={ROUTES.signup}>
                  <Button size="sm" className="rounded-full">
                    Get Started Free
                  </Button>
                </Link>
                <Link href={ROUTES.login}>
                  <Button variant="ghost" size="sm" className="rounded-full">
                    Sign In
                  </Button>
                </Link>
              </div>
            </div>

            {/* Product Column */}
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider mb-4">Product</h3>
              <ul className="space-y-3">
                <li>
                  <Link href={ROUTES.create} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    Create
                  </Link>
                </li>
                <li>
                  <Link href={ROUTES.gallery} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    Gallery
                  </Link>
                </li>
                <li>
                  <Link href={ROUTES.templates} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    Templates
                  </Link>
                </li>
                <li>
                  <Link href="#showcase" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    Showcase
                  </Link>
                </li>
              </ul>
            </div>

            {/* Company Column */}
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider mb-4">Company</h3>
              <ul className="space-y-3">
                <li>
                  <a
                    href="https://www.yi.ngo"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    About Yi
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.yi.ngo/contact"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    Contact
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.yi.ngo/privacy-policy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.yi.ngo/terms-conditions"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    Terms of Service
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Footer Bottom */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-8 border-t border-slate-200/40 dark:border-white/10">
            <p className="text-xs text-muted-foreground text-center md:text-left">
              © {new Date().getFullYear()} Yi CreativeStudio. A CII Yi Initiative.
            </p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>Powered by</span>
              <a
                href="https://jicate.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-foreground dark:text-white hover:text-primary transition-colors"
              >
                Jicate Solutions
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div >
  )
}
