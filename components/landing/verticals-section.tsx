'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Heart,
  Car,
  Leaf,
  Users,
  Sprout,
  Stethoscope,
  Lightbulb,
  Calendar,
} from 'lucide-react'

const verticals = [
  {
    icon: Heart,
    name: 'Masoom',
    description: 'Child welfare and education initiatives',
    color: 'bg-pink-500/10 text-pink-600',
  },
  {
    icon: Car,
    name: 'Road Safety',
    description: 'Traffic awareness and road safety campaigns',
    color: 'bg-amber-500/10 text-amber-600',
  },
  {
    icon: Leaf,
    name: 'Climate Change',
    description: 'Environmental sustainability programs',
    color: 'bg-green-500/10 text-green-600',
  },
  {
    icon: Users,
    name: 'Yuva',
    description: 'Youth empowerment and skill development',
    color: 'bg-blue-500/10 text-blue-600',
  },
  {
    icon: Sprout,
    name: 'Thalir',
    description: 'Education and learning initiatives',
    color: 'bg-emerald-500/10 text-emerald-600',
  },
  {
    icon: Stethoscope,
    name: 'Health',
    description: 'Healthcare awareness and wellness',
    color: 'bg-red-500/10 text-red-600',
  },
  {
    icon: Lightbulb,
    name: 'Innovation',
    description: 'Startup ecosystem and entrepreneurship',
    color: 'bg-purple-500/10 text-purple-600',
  },
  {
    icon: Calendar,
    name: 'Chapter Events',
    description: 'General chapter meetings and events',
    color: 'bg-cyan-500/10 text-cyan-600',
  },
]

export function VerticalsSection() {
  return (
    <section id="verticals" className="py-20 md:py-32">
      <div className="container px-4">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <Badge variant="secondary" className="mb-4">Yi Initiatives</Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Pre-Built Templates for{' '}
            <span className="text-gradient-yi">Every Vertical</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Ready-to-use creative templates optimized for all major Yi initiatives.
            Each vertical comes with curated prompts and design elements.
          </p>
        </div>

        {/* Verticals Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {verticals.map((vertical) => (
            <Card
              key={vertical.name}
              className="group cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              <CardHeader className="pb-2">
                <div
                  className={`w-12 h-12 rounded-lg ${vertical.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}
                >
                  <vertical.icon className="h-6 w-6" />
                </div>
                <CardTitle className="text-base">{vertical.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-xs">
                  {vertical.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Bottom Note */}
        <p className="text-center text-sm text-muted-foreground mt-8">
          Each vertical includes optimized prompts, color schemes, and design guidelines
        </p>
      </div>
    </section>
  )
}
