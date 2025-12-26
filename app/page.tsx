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
  Lock
} from 'lucide-react'
import { useRef } from 'react'
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

  return (
    <div ref={containerRef} className="min-h-screen bg-yi text-foreground dark:text-white selection:bg-primary selection:text-white overflow-x-hidden">
      <CreativeCursor />
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-yi border-b border-slate-200/30 dark:border-white/5">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl btn-primary flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-extrabold tracking-tighter text-foreground dark:text-white uppercase">Yi Creative</span>
                <span className="text-[8px] font-bold text-muted-foreground/60 dark:text-white/40 tracking-[0.3em] uppercase leading-none">Jicate Solutions</span>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="hidden lg:flex items-center gap-8 mr-4">
                {['Features', 'Pricing', 'Showcase'].map((item) => (
                  <Link key={item} href={`#${item.toLowerCase()}`} className="text-xs font-bold uppercase tracking-widest text-foreground/60 dark:text-white/60 hover:text-foreground dark:hover:text-white transition-colors">
                    {item}
                  </Link>
                ))}
              </div>
              <ThemeToggle />
              <Link href={ROUTES.login} className="hidden sm:block">
                <Button variant="ghost" className="text-xs font-bold uppercase tracking-widest text-foreground/80 dark:text-white/80 hover:text-foreground dark:hover:text-white">Login</Button>
              </Link>
              <Link href={ROUTES.signup}>
                <Button className="btn-primary rounded-full px-8 text-xs font-extrabold uppercase tracking-widest">
                  Join Now
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Floating App Anchors */}
      <div className="floating-anchor hidden xl:flex">
        <div className="anchor-unit group relative">
          <span className="group-hover:text-secondary transition-colors">Verticals: Masoom</span>
        </div>
        <div className="anchor-unit group relative">
          <span className="group-hover:text-primary transition-colors">Engine: Gemini 1.5</span>
        </div>
        <div className="anchor-unit group relative border-secondary/30 text-secondary/60">
          <span>Credits: 10</span>
        </div>
      </div>

      {/* Hero Section: The Architectural Shift */}
      <section className="relative pt-32 pb-16 px-6 sm:px-8 overflow-hidden">
        {/* Background Perspective Grid (Creative Soul Injection) */}
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(rgba(0,91,150,0.15)_1px,transparent_1px),linear-gradient(90deg,rgba(0,91,150,0.15)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(0,91,150,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,91,150,0.05)_1px,transparent_1px)] bg-[size:100px_100px] [transform:perspective(500px)_rotateX(60deg)_translateY(-200px)] opacity-30 h-[150%]" />

        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-16">
          {/* Architectural Card Stack (Now on Left for Impact) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, x: -50 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="flex-1 w-full max-w-[550px] h-[420px] md:h-[550px] relative mt-16 lg:mt-0 hero-stack-container order-2 lg:order-1"
          >
            {/* Perspective Lines Decoration */}
            <div className="absolute -inset-20 border-l border-t border-slate-200/20 dark:border-white/[0.03] -z-10" />
            <div className="absolute -bottom-20 -right-20 border-r border-b border-slate-200/20 dark:border-white/[0.03] -z-10" />

            {/* Layer 3: Genesis (Deep Texture) */}
            <div className="stack-card-base stack-card-3 rounded-[4rem] overflow-hidden bg-gradient-to-br from-slate-100 via-slate-50 to-blue-50 dark:from-primary/20 dark:via-black dark:to-secondary/20 border-2 border-slate-200 dark:border-white/5 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] dark:shadow-none">
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&q=80&w=800')] bg-cover bg-center opacity-30 dark:opacity-40" />
              <div className="absolute bottom-12 left-12 text-[8px] font-extrabold uppercase tracking-[1em] text-slate-400/60 dark:text-white/30 [writing-mode:vertical-rl] rotate-180">Genesis_Origin</div>
            </div>

            {/* Layer 2: Transcendence (Refracted Prism) */}
            <div className="stack-card-base stack-card-2 border-2 border-slate-200 dark:border-white/10 rounded-[4rem] bg-white dark:bg-white/[0.03] backdrop-blur-3xl overflow-hidden shadow-[0_30px_80px_-20px_rgba(0,0,0,0.2)] dark:shadow-2xl">
              <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-primary/20 dark:from-primary/20 to-transparent rounded-full blur-[100px]" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-32 h-32 rounded-full border-2 border-slate-200 dark:border-white/10 animate-[spin_10s_linear_infinite]" />
                <div className="absolute w-20 h-20 rounded-full bg-gradient-to-tr from-secondary/20 dark:from-secondary/20 to-transparent blur-xl" />
              </div>
              <div className="absolute top-12 left-12 text-[8px] font-extrabold uppercase tracking-[0.5em] text-slate-400/60 dark:text-white/35">Synthesis.Layer_02</div>
            </div>

            {/* Layer 1: The Soul (High-Concept Result) */}
            <div className="stack-card-base stack-card-1 rounded-[4rem] overflow-hidden shadow-[0_100px_200px_-50px_rgba(0,119,238,0.4)] border border-slate-200/50 dark:border-white/30 group cursor-none">
              {/* Main Artistic Concept */}
              <div className="absolute inset-0 bg-[#0a0118]" />
              <motion.div
                animate={{
                  scale: [1, 1.05, 1],
                  rotate: [0, 2, -2, 0]
                }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?auto=format&fit=crop&q=80&w=800')] bg-cover bg-center"
              />

              {/* Prismatic Overlays */}
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/40 via-transparent to-secondary/40 mix-blend-color-dodge opacity-60" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-100 dark:from-black via-transparent to-transparent opacity-90 z-10" />

              {/* Minimalist Branding */}
              <div className="absolute top-12 left-12 z-20">
                <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-700">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
              </div>

              <div className="absolute bottom-12 left-12 right-12 z-20">
                <div className="text-[9px] font-extrabold uppercase tracking-[0.8em] text-primary/60 mb-6 mb-8">Conceptual_Spirit</div>
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <span className="block text-3xl font-extrabold uppercase tracking-tighter leading-none">Eternal</span>
                    <span className="block text-3xl font-extrabold uppercase tracking-tighter leading-none text-secondary italic">Bloom</span>
                  </div>
                  <div className="flex gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                    <div className="w-1.5 h-1.5 rounded-full bg-white/60" />
                    <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Text Content (Now on Right) */}
          <motion.div
            initial={{ opacity: 0, x: 80 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="flex-1 text-center lg:text-left order-1 lg:order-2"
          >
            <div className="flex justify-center mb-8">
              <Badge className="bg-primary/40 border border-primary/70 text-slate-800 dark:text-white text-[11px] font-bold uppercase tracking-[0.3em] rounded-full backdrop-blur-xl shadow-2xl py-3 px-8">
                AI-Powered Brand Creative Generation for Yi Chapters
              </Badge>
            </div>
            <h1 className="text-yi-bold text-[clamp(3rem,8vw,8rem)] mb-6 text-slate-900 dark:text-white leading-[0.75] tracking-tighter uppercase font-bold">
              CREATE{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-primary bg-[length:200%_auto] animate-gradient-flow">
                BRILLIANCE
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-slate-700 dark:text-white/90 mb-14 max-w-3xl font-medium leading-relaxed">
              Generate professional event posters, social posts, and marketing materials in 30 seconds. Perfect brand compliance. No design skills required.
            </p>
            <div className="flex flex-col items-center lg:items-start gap-8">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="flex flex-col gap-2">
                  <Link href={ROUTES.signup} className="w-full sm:w-auto">
                    <Button size="lg" className="h-20 w-full sm:w-auto px-16 rounded-[2.5rem] btn-primary text-sm font-bold uppercase tracking-[0.25em] group shadow-[0_25px_60px_rgba(0,119,238,0.4)]">
                      Start Creating Free
                      <MoveRight className="ml-5 h-7 w-7 group-hover:translate-x-4 transition-transform duration-500" />
                    </Button>
                  </Link>
                  <p className="text-sm text-slate-600 dark:text-white/70 text-center sm:text-left font-medium">100 free credits • No credit card required</p>
                </div>
                <Link href="#showcase">
                  <Button variant="outline" size="lg" className="h-20 px-12 rounded-[2.5rem] border-2 border-slate-300 dark:border-white/20 text-slate-700 dark:text-white text-sm font-bold uppercase tracking-[0.25em] hover:bg-slate-100 dark:hover:bg-white/5 hover:border-slate-400 dark:hover:border-white/30 hover:text-slate-900 dark:hover:text-white">
                    Watch Demo
                  </Button>
                </Link>
              </div>
              <div className="flex items-center gap-4 py-4 px-8 rounded-full bg-slate-50/60 dark:bg-white/[0.03] border border-slate-200/40 dark:border-white/5 backdrop-blur-md">
                <div className="flex -space-x-3">
                  {[1, 2, 3].map(i => <div key={i} className="w-8 h-8 rounded-full border-2 border-slate-200 dark:border-[#0d021b] bg-white text-[8px] font-bold text-black flex items-center justify-center">0{i}</div>)}
                </div>
                <span className="text-sm text-slate-700 dark:text-white/80 font-medium">Join 200+ creators across <span className="font-bold text-slate-900 dark:text-white">70 Yi chapters</span></span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section: System Status */}
      <section className="border-y border-slate-200/50 dark:border-white/5 bg-slate-50/40 dark:bg-black/20 backdrop-blur-sm relative z-10">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-slate-200/40 dark:divide-white/5">
            {stats.map((stat, index) => (
              <div key={index} className="py-12 px-6 flex flex-col items-center justify-center text-center group cursor-default hover:bg-slate-50/60 dark:hover:bg-white/[0.02] transition-colors">
                <div className="text-4xl md:text-5xl font-extrabold text-foreground dark:text-white mb-2 tracking-tighter group-hover:scale-110 transition-transform duration-300">
                  {stat.value}
                </div>
                <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground/60 dark:text-white/30 group-hover:text-primary transition-colors">
                  {stat.label}
                </div>
                {stat.sublabel && (
                  <div className="text-[9px] font-medium text-muted-foreground/70 dark:text-white/50 mt-2 max-w-[120px]">
                    {stat.sublabel}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Chapter Logos Marquee */}
      <section className="py-12 border-y border-slate-200/50 dark:border-white/5 bg-slate-50/40 dark:bg-black/20 overflow-hidden">
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
                <div key={i} className="flex-shrink-0 px-8 py-4 rounded-2xl bg-slate-50/60 dark:bg-white/[0.03] border border-slate-200/40 dark:border-white/5 backdrop-blur-xl">
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
              <h2 className="text-yi-bold text-4xl md:text-6xl mb-8 uppercase leading-none text-slate-900 dark:text-white">
                CREATE <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">PROFESSIONAL</span><br />CREATIVES IN <span className="text-secondary">30 SECONDS</span>
              </h2>
              <p className="text-xl text-slate-600 dark:text-white/70 font-semibold tracking-tight">Simple 3-step workflow. Brand consistency guaranteed.</p>
            </div>
            <div className="text-right text-[10px] font-extrabold uppercase tracking-[0.4em] text-slate-400/50 dark:text-white/30 mb-2 whitespace-nowrap">
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
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2">{item.title}</h3>
                  <p className="text-sm text-slate-700 dark:text-white/85 font-medium">{item.desc}</p>
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
                <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-6 uppercase tracking-tight">30-Second Generation</h3>
                <p className="text-xl text-slate-700 dark:text-white/90 font-semibold leading-relaxed max-w-lg mb-12">
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
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&q=80&w=800')] bg-cover bg-center opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-all duration-1000 grayscale" />
              <div className="relative z-10 flex flex-col h-full">
                <div className="w-14 h-14 rounded-2xl bg-secondary/10 flex items-center justify-center mb-10">
                  <Shield className="h-6 w-6 text-secondary" />
                </div>
                <div className="inline-block mb-4 py-2 px-4 rounded-full bg-secondary/20 border border-secondary/40">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-secondary">70+ Chapters Aligned</span>
                </div>
                <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-6 uppercase tracking-tight">100% On-Brand,<br />Always</h3>
                <p className="text-lg text-slate-700 dark:text-white/90 font-semibold leading-relaxed mb-12">
                  Logo positions locked. Brand colors enforced. Guidelines automated. From Chennai to Chandigarh, pixel-perfect consistency.
                </p>
                <div className="mt-auto p-6 rounded-3xl bg-slate-100/60 dark:bg-black/40 border border-slate-200/40 dark:border-white/10 overflow-hidden relative">
                  <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=400')] bg-cover bg-center opacity-30" />
                  <div className="relative z-10">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-[8px] font-extrabold uppercase tracking-widest text-slate-500/70 dark:text-white/40">Alignment_Core</span>
                      <span className="text-[8px] font-extrabold uppercase tracking-widest text-secondary">Calibrating</span>
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
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-4 uppercase tracking-tight">Every Format You Need</h3>
                <p className="text-sm text-slate-700 dark:text-white/90 font-semibold leading-relaxed">
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
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-4 uppercase tracking-tight">Smart for Every Initiative</h3>
                <p className="text-sm text-slate-700 dark:text-white/90 font-semibold leading-relaxed">
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
            <h2 className="text-5xl md:text-7xl font-extrabold uppercase tracking-tight text-slate-900 dark:text-white mb-6">
              LOVED BY <span className="text-primary">70+ CHAPTERS.</span>
            </h2>
            <p className="text-xl text-slate-700 dark:text-white/80 font-semibold">Real results from Yi chapters across India</p>
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
                <div key={i} className="min-w-[400px] max-w-[400px] bg-white/90 dark:bg-black/80 border border-slate-200/50 dark:border-white/5 p-8 rounded-3xl backdrop-blur-xl hover:border-primary/50 transition-all duration-300 hover:-translate-y-2">
                  <p className="text-lg text-foreground/90 dark:text-white/90 mb-8 leading-relaxed">"{testimonial.quote}"</p>

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
              <h2 className="text-yi-bold text-5xl md:text-7xl mb-12 uppercase leading-[0.85] tracking-tighter text-slate-900 dark:text-white">
                ONE PLATFORM, <br /><span className="text-secondary">30+ FORMATS</span>
              </h2>
              <p className="text-2xl text-slate-700 dark:text-white/80 font-semibold max-w-xl">From social media to print-ready certificates. Every format you need for Yi initiatives.</p>
            </div>
            <div className="w-full lg:w-1/3 aspect-[4/5] rounded-[4rem] overflow-hidden relative group">
              <img src="https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&q=80&w=800" alt="Showcase" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[3000ms]" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-100 dark:from-black via-transparent to-transparent opacity-60" />
              <div className="absolute bottom-12 left-12 text-[10px] font-extrabold uppercase tracking-[0.5em] text-foreground dark:text-white">Generation_A_012</div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
            {[
              'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=400',
              'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&q=80&w=400',
              'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&q=80&w=400',
              'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&q=80&w=400'
            ].map((url, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="aspect-square rounded-3xl overflow-hidden hover:scale-95 hover:rotate-2 transition-all duration-500 border border-slate-200/40 dark:border-white/10"
              >
                <img src={url} alt={`Creation ${i}`} className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700" />
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
          <h2 className="text-yi-bold text-5xl md:text-7xl mb-12 leading-none tracking-tighter uppercase text-slate-900 dark:text-white">
            READY TO <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">GENERATE?</span>
          </h2>
          <p className="text-xl md:text-2xl text-slate-700 dark:text-white/80 mb-12 font-semibold max-w-2xl mx-auto">
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
          <Link href={ROUTES.signup}>
            <Button size="lg" className="h-20 px-16 rounded-[2rem] btn-primary text-lg font-extrabold uppercase tracking-[0.2em] shadow-2xl hover:scale-105 transition-transform">
              Join the studio now
            </Button>
          </Link>
        </div>
      </section >

      {/* Trust Indicators Bar */}
      <section className="py-16 border-y border-slate-200/50 dark:border-white/5 bg-slate-50/40 dark:bg-black/20">
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
                <div className="w-16 h-16 rounded-2xl bg-slate-100/60 dark:bg-white/[0.03] border border-slate-200/40 dark:border-white/5 flex items-center justify-center mb-6 group-hover:bg-white/90 dark:group-hover:bg-white/[0.05] group-hover:scale-110 group-hover:border-primary/30 transition-all duration-300">
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
      < footer className="pt-12 pb-12 px-6 sm:px-8 bg-slate-100/60 dark:bg-black/40 border-t border-slate-200/50 dark:border-white/5" >
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-12 mb-20 opacity-60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-200/40 dark:bg-white/5 flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-foreground dark:text-white" />
              </div>
              <span className="text-xl font-extrabold tracking-tighter text-foreground dark:text-white uppercase">Yi Creative</span>
            </div>
            <div className="flex items-center gap-10">
              <a href="#" className="text-[10px] font-extrabold uppercase tracking-widest hover:text-foreground dark:hover:text-white transition-colors">Privacy</a>
              <a href="#" className="text-[10px] font-extrabold uppercase tracking-widest hover:text-foreground dark:hover:text-white transition-colors">Terms</a>
              <a href="#" className="text-[10px] font-extrabold uppercase tracking-widest hover:text-foreground dark:hover:text-white transition-colors">Guidelines</a>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-8 pt-8 border-t border-slate-200/40 dark:border-white/5">
            <p className="text-[10px] font-bold text-slate-400/60 dark:text-white/35 uppercase tracking-[0.2em]">
              © {new Date().getFullYear()} Yi CreativeStudio. A CII Yi Initiative.
            </p>
            <div className="flex items-center gap-4 text-[10px] font-extrabold text-muted-foreground/50 dark:text-white/40 uppercase tracking-[0.3em]">
              <span>Powered by</span>
              <span className="text-foreground dark:text-white font-extrabold italic">Jicate Solutions</span>
            </div>
          </div>
        </div>
      </footer >
    </div >
  )
}
