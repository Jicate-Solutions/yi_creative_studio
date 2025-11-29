'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check } from 'lucide-react'
import { ROUTES, CREDIT_PACKAGES } from '@/lib/config/constants'

const features = [
  'Unlimited team members',
  'All vertical templates',
  'High-resolution downloads',
  'Brand configuration',
  'Logo management',
  '9-position logo grid',
  'Priority support',
]

export function PricingSection() {
  return (
    <section id="pricing" className="py-20 md:py-32">
      <div className="container px-4">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <Badge variant="secondary" className="mb-4">Simple Pricing</Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Pay Only for What{' '}
            <span className="text-gradient-yi">You Use</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Credit-based pricing with no monthly fees. Each generation costs 1 credit.
            Buy credits as you need them.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {CREDIT_PACKAGES.map((pkg) => (
            <Card
              key={pkg.id}
              className={`relative ${pkg.popular ? 'border-primary shadow-lg scale-105' : ''}`}
            >
              {pkg.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="gradient-yi text-white">Most Popular</Badge>
                </div>
              )}

              <CardHeader className="text-center pb-2">
                <CardTitle className="text-lg">{pkg.name}</CardTitle>
                <CardDescription>{pkg.credits} credits</CardDescription>
              </CardHeader>

              <CardContent className="text-center pb-4">
                <div className="mb-2">
                  <span className="text-4xl font-bold">
                    ₹{pkg.priceINR.toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  ₹{(pkg.priceINR / pkg.credits).toFixed(2)} per credit
                </p>
              </CardContent>

              <CardFooter>
                <Button
                  asChild
                  className={`w-full ${pkg.popular ? 'gradient-yi hover:opacity-90' : ''}`}
                  variant={pkg.popular ? 'default' : 'outline'}
                >
                  <Link href={ROUTES.signup}>Get Started</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Features List */}
        <div className="bg-muted/50 rounded-2xl p-8 max-w-3xl mx-auto">
          <h3 className="text-lg font-semibold text-center mb-6">
            All plans include:
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {features.map((feature) => (
              <div key={feature} className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center">
                  <Check className="h-3 w-3 text-green-600" />
                </div>
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
