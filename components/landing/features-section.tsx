'use client'

import {
  Palette,
  Image,
  Layers,
  Zap,
  Users,
  CreditCard,
  Download,
  Sparkles,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const features = [
  {
    icon: Palette,
    title: 'Brand Configuration',
    description: 'Set up your brand colors, fonts, and guidelines once. Every creative stays perfectly on-brand.',
  },
  {
    icon: Image,
    title: 'Logo Management',
    description: '9-position grid system for precise logo placement. Support for multiple logos with transparency.',
  },
  {
    icon: Layers,
    title: 'Vertical Presets',
    description: 'Pre-configured templates for Masoom, Road Safety, Climate Change, and more Yi initiatives.',
  },
  {
    icon: Zap,
    title: 'Instant Generation',
    description: 'Generate professional creatives in under 30 seconds with state-of-the-art AI models.',
  },
  {
    icon: Users,
    title: 'Team Collaboration',
    description: 'Invite team members with role-based access. Admins, editors, and viewers.',
  },
  {
    icon: CreditCard,
    title: 'Credit System',
    description: 'Flexible credit-based billing. Pay for what you use with transparent pricing.',
  },
  {
    icon: Download,
    title: 'High-Res Export',
    description: 'Download print-ready files in multiple formats. Perfect for digital and print.',
  },
  {
    icon: Sparkles,
    title: 'AI-Powered',
    description: 'Powered by Google Gemini and Ideogram for photorealistic and artistic outputs.',
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 md:py-32 bg-muted/30">
      <div className="container px-4">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Everything You Need for{' '}
            <span className="text-gradient-yi">Brand Creatives</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            A complete solution for generating professional marketing materials
            while maintaining brand consistency across all your chapters.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card
              key={feature.title}
              className="group relative overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <div className="absolute inset-0 gradient-yi-subtle opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <CardHeader className="relative">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <CardDescription className="text-sm">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
