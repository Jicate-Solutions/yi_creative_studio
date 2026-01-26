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
  { value: '~30s', label: 'Gen Time', sublabel: '120x faster than manual' },
  { value: '15K+', label: 'Creatives', sublabel: 'Generated across India' },
  { value: '70+', label: 'Chapters', sublabel: 'Chennai to Chandigarh' },
  { value: '100%', label: 'On-Brand', sublabel: 'Automated compliance' },
]

export default function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div ref={containerRef} className="min-h-screen bg-yi text-foreground dark:text-white selection:bg-primary selection:text-white overflow-x-hidden">
      <CreativeCursor />
      {/* Navigation - Floating Pill */}
      <nav className="fixed top-6 left-1/2 -translate-x-1/2 w-[92%] sm:w-[85%] max-w-6xl z-50 rounded-full bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border border-white/20 dark:border-white/10 shadow-2xl shadow-primary/5 transition-all duration-300 hover:shadow-primary/10">
        <div className="px-2 sm:px-2">
          <div className="flex items-center justify-between h-[4.5rem]">
            {/* Logo Section */}
            <div className="flex items-center gap-3 pl-2 sm:pl-4">
              <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-base sm:text-lg font-extrabold tracking-tighter text-foreground dark:text-white uppercase leading-none">Yi Creative</span>
                <span className="text-xs font-bold text-muted-foreground/60 dark:text-white/40 tracking-[0.2em] sm:tracking-[0.3em] uppercase leading-none mt-0.5">Studio</span>
              </div>
            </div>

            {/* Desktop Links Section */}
            <div className="hidden sm:flex items-center gap-1 sm:gap-2 pr-2 sm:pr-3">
              <div className="hidden lg:flex items-center bg-slate-100/50 dark:bg-white/5 rounded-full px-2 py-1.5 mr-2 border border-slate-200/50 dark:border-white/5">
                {['Features', 'Pricing', 'Showcase'].map((item) => (
                  <Link key={item} href={`#${item.toLowerCase()}`} className="px-5 py-2 rounded-full text-xs font-extrabold uppercase tracking-widest text-foreground/70 dark:text-white/70 hover:text-foreground dark:hover:text-white hover:bg-white dark:hover:bg-white/10 transition-all">
                    {item}
                  </Link>
                ))}
              </div>

              <ThemeToggle />

              <div className="flex items-center gap-2 pl-2 border-l border-slate-200/50 dark:border-white/10 ml-1">
                <Link href={ROUTES.login}>
                  <Button variant="ghost" size="sm" className="rounded-full text-xs font-bold uppercase tracking-widest hover:bg-slate-100/50 dark:hover:bg-white/5 h-10 px-5">Login</Button>
                </Link>
                <Link href={ROUTES.signup}>
                  <Button size="sm" className="btn-primary rounded-full px-6 h-10 text-xs font-extrabold uppercase tracking-widest shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 hover:scale-105 transition-all">
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
                  <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full">
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
                        <Button variant="outline" className="w-full h-12 rounded-full font-semibold">
                          <LogIn className="h-4 w-4 mr-2" />
                          Login
                        </Button>
                      </Link>
                      <Link href={ROUTES.signup} onClick={() => setMobileMenuOpen(false)}>
                        <Button className="w-full h-12 rounded-full btn-primary font-semibold">
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
      <section className="relative pt-32 pb-16 px-6 sm:px-8 overflow-hidden">
        {/* Background Perspective Grid (Creative Soul Injection) */}
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(rgba(0,91,150,0.15)_1px,transparent_1px),linear-gradient(90deg,rgba(0,91,150,0.15)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(0,91,150,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,91,150,0.05)_1px,transparent_1px)] bg-[size:100px_100px] [transform:perspective(500px)_rotateX(60deg)_translateY(-200px)] opacity-30 h-[150%]" />

        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center lg:items-start justify-between gap-12 lg:gap-20">
          {/* Architectural Card Stack (Now on Left for Impact) */}
          {/* Studio Console: The Professional Workspace (Split Filled Look) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="flex-1 w-full max-w-[650px] relative mt-16 lg:mt-0 group"
          >
            {/* Ambient Back Glow */}
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 to-secondary/30 rounded-[2.5rem] blur-2xl opacity-40 dark:opacity-20 transition-opacity duration-500 group-hover:opacity-60" />

            {/* The Console Container (Filled Split UI) */}
            <div className="relative h-[500px] md:h-[600px] bg-slate-950 rounded-[2rem] border border-slate-800/60 shadow-2xl flex overflow-hidden ring-1 ring-white/10">

              {/* Sidebar (Left Strip) */}
              <div className="w-20 border-r border-white/5 bg-slate-900/50 flex flex-col items-center py-8 gap-6 z-10 hidden sm:flex">
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                {/* Nav Items */}
                <div className="flex flex-col gap-4 w-full px-4">
                  {[Layout, ImageIcon, Palette, Layers].map((Icon, i) => (
                    <div key={i} className={`h-10 w-full rounded-lg flex items-center justify-center transition-all cursor-default ${i === 0 ? 'bg-white/10 text-white' : 'text-slate-500 hover:bg-white/5 hover:text-slate-300'}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                  ))}
                </div>
                <div className="mt-auto w-full px-4">
                  <div className="h-10 w-full rounded-lg flex items-center justify-center text-slate-500 hover:bg-white/5 hover:text-slate-300 transition-all cursor-default">
                    <div className="w-6 h-6 rounded-full border border-slate-600 bg-slate-800" />
                  </div>
                </div>
              </div>

              {/* Main Canvas Area */}
              <div className="flex-1 relative flex flex-col bg-slate-950/80 backdrop-blur-sm">

                {/* Canvas Header */}
                <div className="h-14 border-b border-white/5 flex items-center justify-between px-3 sm:px-6 z-10 bg-slate-950/50">
                  <div className="flex items-center gap-2 sm:gap-4">
                    <div className="flex items-center gap-1 sm:gap-2">
                      <span className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-red-500/20 border border-red-500/50" />
                      <span className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
                      <span className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-green-500/20 border border-green-500/50" />
                    </div>
                    <div className="h-4 w-[1px] bg-white/10 mx-1 sm:mx-2 hidden sm:block" />
                    <span className="text-[10px] sm:text-xs font-mono text-slate-400 hidden sm:block">Project: Yi_Marathon</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="px-2 sm:px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1 sm:gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                      <span className="hidden sm:inline">Saving...</span>
                      <span className="sm:hidden">Live</span>
                    </div>
                  </div>
                </div>

                {/* Canvas Viewport (The "Work") */}
                <div className="flex-1 relative p-6 flex items-center justify-center overflow-hidden">
                  {/* Background Grid */}
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:32px_32px]" />

                  {/* Central Artboard */}
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="relative w-full h-full max-w-sm aspect-[4/5] bg-slate-900 rounded-xl border border-white/10 shadow-2xl overflow-hidden group/artboard"
                  >
                    {/* Image Source */}
                    <div className="absolute inset-0 bg-[url('/images/yi-hero-creative.png')] bg-cover bg-center opacity-80 transition-transform duration-1000 group-hover/artboard:scale-105" />

                    {/* Scanning Beam (Restored Effect) */}
                    <motion.div
                      animate={{ top: ["0%", "100%", "0%"] }}
                      transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                      className="absolute left-0 right-0 h-[2px] bg-primary z-20 shadow-[0_0_15px_rgba(37,99,235,0.8)]"
                    >
                      <div className="absolute bottom-0 w-full h-[80px] bg-gradient-to-t from-primary/10 to-transparent" />
                    </motion.div>

                    {/* Processing Overlay */}
                    <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-slate-950 to-transparent z-10" />

                    {/* Live Prompt Feedback */}
                    <div className="absolute bottom-3 sm:bottom-6 left-3 sm:left-6 right-3 sm:right-6 z-20">
                      <div className="bg-black/60 backdrop-blur-md border border-white/10 rounded-lg p-2 sm:p-3">
                        <div className="flex items-start gap-2 text-xs font-mono text-slate-300">
                          <span className="text-secondary shrink-0">$</span>
                          <span className="typing-text line-clamp-2">
                            Generate marathon runner, Yi branding...
                            <span className="animate-pulse text-primary">|</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Floating Tool Panels (Decorations) - Hidden on mobile */}
                  <motion.div
                    animate={{ y: [-5, 5, -5] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-10 right-8 w-40 bg-slate-900/90 backdrop-blur-md border border-white/10 rounded-lg p-3 shadow-xl z-20 hidden md:block"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold text-slate-400 uppercase">Properties</span>
                      <Settings className="w-3 h-3 text-slate-500" />
                    </div>
                    <div className="space-y-2">
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full w-3/4 bg-primary" />
                      </div>
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full w-1/2 bg-secondary" />
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    animate={{ y: [5, -5, 5] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    className="absolute bottom-20 left-8 w-32 bg-slate-900/90 backdrop-blur-md border border-white/10 rounded-lg p-3 shadow-xl z-20 hidden md:block"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-xs font-bold text-white uppercase">AI Active</span>
                    </div>
                    <div className="text-xs text-slate-500 font-mono">
                      Processing...
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Text Content (Right Column) */}
          <motion.div
            initial={{ opacity: 0, x: 80 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="flex-1 text-center lg:text-left order-1 lg:order-2 lg:pt-8"
          >
            {/* Tagline Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-xs font-bold uppercase tracking-wider text-primary">AI-Powered Brand Creative Generation</span>
            </div>

            <h1 className="text-[clamp(2rem,5vw,4rem)] mb-6 text-slate-900 dark:text-white leading-[0.9] tracking-tight font-bold">
              Create{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-primary bg-[length:200%_auto] animate-gradient-flow">
                Brilliance
              </span>
            </h1>
            <p className="text-base md:text-lg text-slate-600 dark:text-white/80 mb-8 max-w-lg font-medium leading-relaxed">
              Generate professional event posters, social posts, and marketing materials in 30 seconds. Perfect brand compliance. No design skills required.
            </p>
            <div className="flex flex-col items-center lg:items-start gap-6">
              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                <Link href={ROUTES.signup} className="w-full sm:w-auto">
                  <Button size="lg" className="h-14 w-full sm:w-auto px-8 rounded-full btn-primary text-sm font-semibold tracking-wide group shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all">
                    Start Creating Free
                    <MoveRight className="ml-3 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link href="#showcase">
                  <Button variant="outline" size="lg" className="h-14 px-8 rounded-full border-2 border-slate-300 dark:border-white/20 text-slate-700 dark:text-white text-sm font-semibold tracking-wide hover:bg-slate-100 dark:hover:bg-white/5 hover:border-slate-400 dark:hover:border-white/30 transition-all">
                    Watch Demo
                  </Button>
                </Link>
              </div>

              {/* Supporting Info */}
              <p className="text-sm text-slate-500 dark:text-white/60 font-medium">
                100 free credits • No credit card required
              </p>

              {/* Social Proof */}
              <div className="flex items-center gap-4 py-3 px-6 rounded-full bg-slate-100/80 dark:bg-white/[0.05] border border-slate-200/60 dark:border-white/10">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-900 bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-xs font-bold text-white">
                      {i}
                    </div>
                  ))}
                </div>
                <span className="text-sm text-slate-600 dark:text-white/70 font-medium">
                  Join <span className="font-bold text-slate-900 dark:text-white">200+</span> creators across <span className="font-bold text-slate-900 dark:text-white">70 Yi chapters</span>
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section: System Status */}
      <section className="border-y border-white/5 glass-subtle relative z-10">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-slate-200/40 dark:divide-white/5">
            {stats.map((stat, index) => (
              <div key={index} className="py-12 px-6 flex flex-col items-center justify-center text-center group cursor-default hover:bg-slate-50/60 dark:hover:bg-white/[0.02] transition-colors">
                <div className="text-4xl md:text-5xl font-extrabold text-foreground dark:text-white mb-2 tracking-tighter group-hover:scale-110 transition-transform duration-300">
                  {stat.value}
                </div>
                <div className="text-xs font-bold uppercase tracking-[0.2em] sm:tracking-[0.3em] text-muted-foreground/60 dark:text-white/30 group-hover:text-primary transition-colors">
                  {stat.label}
                </div>
                {stat.sublabel && (
                  <div className="text-xs font-medium text-muted-foreground/70 dark:text-white/50 mt-2 max-w-[140px]">
                    {stat.sublabel}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Chapter Logos Marquee */}
      <section className="py-12 border-y border-white/5 glass-subtle overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-center text-xs font-extrabold uppercase tracking-[0.3em] text-muted-foreground/70 dark:text-white/50 mb-12">
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
      <section className="py-20 px-6 sm:px-8" id="features">
        <div className="max-w-7xl mx-auto">
          <div className="mb-20 flex flex-col md:flex-row items-end justify-between gap-12">
            <div className="max-w-2xl">
              <h2 className="text-yi-bold text-3xl md:text-4xl mb-6 uppercase leading-none text-slate-900 dark:text-white">
                CREATE <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">PROFESSIONAL</span><br />CREATIVES IN <span className="text-secondary">30 SECONDS</span>
              </h2>
              <p className="text-lg text-slate-600 dark:text-white/70 font-semibold tracking-tight">Simple 3-step workflow. Brand consistency guaranteed.</p>
            </div>
            <div className="text-right text-xs font-extrabold uppercase tracking-[0.2em] sm:tracking-[0.4em] text-slate-400/50 dark:text-white/30 mb-2 whitespace-nowrap">
              01 // CORE ARCHITECTURE
            </div>
          </div>

          {/* New Workflow: How It Works */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20 relative">
            {/* Connector Line */}
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-slate-300 dark:via-white/10 to-transparent -translate-y-1/2 -z-10" />

            {[
              { icon: Users, step: '01', title: 'Upload Your Brand', desc: 'Add logo, colors, fonts once. Never worry about consistency again.' },
              { icon: Layout, step: '02', title: 'Choose Your Format', desc: '30+ templates: event posters, social posts, certificates, and more.' },
              { icon: Sparkles, step: '03', title: 'Generate & Download', desc: 'Get print-ready creatives in 30 seconds. Perfect for digital and print.' }
            ].map((item, i) => (
              <Link key={i} href={ROUTES.signup} className="group relative">
                <div className="bg-slate-100/80 dark:bg-black/80 border border-slate-200/50 dark:border-white/5 p-8 rounded-3xl hover:border-primary/50 transition-colors">
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

          <div className="architectural-bento grid grid-cols-12 gap-8 auto-rows-[100px]">
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
      <section className="py-20 px-6 sm:px-8 bg-slate-50/30 dark:bg-black/10 border-y border-slate-200/40 dark:border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-extrabold uppercase tracking-tight text-slate-900 dark:text-white mb-4">
              LOVED BY <span className="text-primary">70+ CHAPTERS.</span>
            </h2>
            <p className="text-lg text-slate-700 dark:text-white/80 font-semibold">Real results from Yi chapters across India</p>
          </div>

          <div className="overflow-x-auto scrollbar-hide pb-8">
            <div className="flex gap-8 min-w-max px-4">
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
                <div key={i} className="min-w-[300px] sm:min-w-[400px] max-w-[400px] glass-card p-6 sm:p-8 rounded-3xl hover:border-primary/50 transition-all duration-300 hover:-translate-y-2 snap-center">
                  <p className="text-base sm:text-lg text-foreground/90 dark:text-white/90 mb-8 leading-relaxed">"{testimonial.quote}"</p>

                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-xs font-bold text-primary">
                      {testimonial.initials}
                    </div>
                    <div>
                      <div className="text-foreground dark:text-white font-bold text-sm">{testimonial.name}</div>
                      <div className="text-foreground/70 dark:text-white/70 text-xs">{testimonial.role} · {testimonial.chapter}</div>
                    </div>
                  </div>

                  <div className="flex gap-6 pt-6 border-t border-slate-200/40 dark:border-white/5">
                    <div className="text-xs">
                      <span className="text-primary font-extrabold text-lg">{testimonial.creativesGenerated}</span>
                      <span className="text-foreground/60 dark:text-white/60 ml-2">creatives</span>
                    </div>
                    <div className="text-xs">
                      <span className="text-secondary font-extrabold text-lg">{testimonial.timeSaved}hrs</span>
                      <span className="text-foreground/60 dark:text-white/60 ml-2">saved</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* New Section: Creative Showcase (Full Visual Impact) */}
      < section className="py-16 px-6 sm:px-8 relative overflow-hidden" id="showcase" >
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-20 mb-20">
            <div className="flex-1">
              <h2 className="text-yi-bold text-3xl md:text-5xl mb-8 uppercase leading-[0.85] tracking-tighter text-slate-900 dark:text-white">
                ONE PLATFORM, <br /><span className="text-secondary">30+ FORMATS</span>
              </h2>
              <p className="text-lg text-slate-700 dark:text-white/80 font-semibold max-w-xl">From social media to print-ready certificates. Every format you need for Yi initiatives.</p>
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

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
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
              <span key={tag} className="px-6 py-3 rounded-full bg-slate-50/60 dark:bg-white/[0.03] border border-slate-200/40 dark:border-white/5 text-xs font-bold text-foreground/70 dark:text-white/50 hover:text-foreground dark:hover:text-white hover:bg-white/80 dark:hover:bg-white/[0.05] hover:border-slate-300/60 dark:hover:border-white/10 transition-all cursor-default">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </section >
      {/* CTA Section */}
      < section className="py-20 px-6 sm:px-8 text-center relative overflow-hidden" >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[160px] -z-10" />
        <div className="max-w-4xl mx-auto relative z-10">
          <h2 className="text-yi-bold text-4xl md:text-6xl mb-8 leading-none tracking-tighter uppercase text-slate-900 dark:text-white">
            READY TO <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">GENERATE?</span>
          </h2>
          <p className="text-lg md:text-xl text-slate-700 dark:text-white/80 mb-10 font-semibold max-w-xl mx-auto">
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
            <Button size="lg" className="h-16 sm:h-20 px-8 sm:px-16 w-full sm:w-auto rounded-[2rem] btn-primary text-base sm:text-lg font-extrabold uppercase tracking-[0.15em] sm:tracking-[0.2em] shadow-2xl hover:scale-105 transition-transform">
              Join the studio now
            </Button>
          </Link>
        </div>
      </section >

      {/* Trust Indicators Bar */}
      <section className="py-16 border-y border-white/5 glass-subtle">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-center text-xs font-extrabold uppercase tracking-[0.3em] text-muted-foreground/70 dark:text-white/50 mb-16">
            ENTERPRISE-GRADE PLATFORM
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
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
                <div className="w-16 h-16 rounded-2xl glass-card flex items-center justify-center mb-6 group-hover:scale-110 group-hover:border-primary/30 transition-all duration-300">
                  <indicator.icon className="h-7 w-7 text-primary" />
                </div>
                <h4 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 dark:text-white mb-3">
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
      <footer className="pt-12 pb-12 px-6 sm:px-8 glass-subtle border-t border-white/5" >
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-12 mb-20 opacity-60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-200/40 dark:bg-white/5 flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-foreground dark:text-white" />
              </div>
              <span className="text-xl font-extrabold tracking-tighter text-foreground dark:text-white uppercase">Yi Creative</span>
            </div>
            <div className="flex items-center gap-6 sm:gap-10">
              <a href="#" className="text-xs font-extrabold uppercase tracking-widest hover:text-foreground dark:hover:text-white transition-colors">Privacy</a>
              <a href="#" className="text-xs font-extrabold uppercase tracking-widest hover:text-foreground dark:hover:text-white transition-colors">Terms</a>
              <a href="#" className="text-xs font-extrabold uppercase tracking-widest hover:text-foreground dark:hover:text-white transition-colors">Guidelines</a>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-8 pt-8 border-t border-slate-200/40 dark:border-white/5">
            <p className="text-xs font-bold text-slate-400/60 dark:text-white/35 uppercase tracking-[0.15em] sm:tracking-[0.2em]">
              © {new Date().getFullYear()} Yi CreativeStudio. A CII Yi Initiative.
            </p>
            <div className="flex items-center gap-4 text-xs font-extrabold text-muted-foreground/50 dark:text-white/40 uppercase tracking-[0.2em] sm:tracking-[0.3em]">
              <span>Powered by</span>
              <span className="text-foreground dark:text-white font-extrabold italic">Jicate Solutions</span>
            </div>
          </div>
        </div>
      </footer >
    </div >
  )
}
