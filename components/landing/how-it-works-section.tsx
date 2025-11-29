'use client'

import { Badge } from '@/components/ui/badge'

const steps = [
  {
    number: '01',
    title: 'Select Vertical',
    description: 'Choose from pre-configured templates for Masoom, Road Safety, Climate Change, and other Yi initiatives.',
  },
  {
    number: '02',
    title: 'Fill Details',
    description: 'Enter event details like title, date, venue, and any custom text. Add your speaker or guest names.',
  },
  {
    number: '03',
    title: 'Position Logos',
    description: 'Use our 9-position grid to place your chapter logo, partner logos, and sponsor branding exactly where you want.',
  },
  {
    number: '04',
    title: 'Generate & Download',
    description: 'Click generate and get your professional creative in under 30 seconds. Download in high resolution.',
  },
]

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-20 md:py-32 bg-muted/30">
      <div className="container px-4">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <Badge variant="secondary" className="mb-4">Simple Process</Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Create Creatives in{' '}
            <span className="text-gradient-yi">4 Easy Steps</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            No design skills required. Our AI handles the creative work while you
            focus on your message.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={step.number} className="relative">
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-primary/50 to-transparent -translate-x-4" />
              )}

              <div className="text-center">
                {/* Step Number */}
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-yi text-white text-2xl font-bold mb-4">
                  {step.number}
                </div>

                {/* Content */}
                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-muted-foreground text-sm">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Time indicator */}
        <div className="flex items-center justify-center gap-2 mt-12 text-muted-foreground">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-sm">Average generation time: ~30 seconds</span>
        </div>
      </div>
    </section>
  )
}
