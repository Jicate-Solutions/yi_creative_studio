import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ROUTES } from '@/lib/config/constants'
import {
  Sparkles,
  Zap,
  Image as ImageIcon,
  Palette,
  Layers,
  Download,
  CheckCircle2,
  ArrowRight,
  Star,
  Users,
  Shield,
} from 'lucide-react'

const features = [
  {
    icon: Sparkles,
    title: 'AI-Powered Generation',
    description: 'Create stunning visuals with Gemini and Ideogram AI models in seconds.',
  },
  {
    icon: ImageIcon,
    title: 'Multi-Logo Management',
    description: '9-position grid for precise logo placement with Yi/CII zones enforced.',
  },
  {
    icon: Palette,
    title: '8 Vertical Presets',
    description: 'Masoom, Road Safety, Climate, Yuva, Thalir, Health, Innovation & Events.',
  },
  {
    icon: Shield,
    title: 'Brand Consistency',
    description: 'Locked header/footer zones ensure every creative is on-brand.',
  },
  {
    icon: Layers,
    title: 'Template Library',
    description: 'Save and reuse your best designs with customizable templates.',
  },
  {
    icon: Download,
    title: 'Export Formats',
    description: 'Download in PNG, JPEG, or WebP optimized for print or web.',
  },
]

const steps = [
  {
    number: '01',
    title: 'Select Vertical',
    description: 'Choose from 8 theme presets or create custom designs.',
  },
  {
    number: '02',
    title: 'Fill Event Details',
    description: 'Enter title, date, venue, and customize with your content.',
  },
  {
    number: '03',
    title: 'Generate & Download',
    description: 'AI creates your design with logos placed perfectly.',
  },
]

const stats = [
  { value: '30s', label: 'Average Generation Time' },
  { value: '8+', label: 'Vertical Presets' },
  { value: '2', label: 'AI Models (Gemini & Ideogram)' },
  { value: '10', label: 'Free Credits on Signup' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#005B96] to-[#FF6B35] flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-[#1A1A2E]">Yi CreativeStudio</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href={ROUTES.login}>
                <Button variant="ghost">Login</Button>
              </Link>
              <Link href={ROUTES.signup}>
                <Button className="bg-primary hover:bg-primary/90">
                  Get Started Free
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <Badge className="mb-4 bg-[#FF6B35]/10 text-[#FF6B35] hover:bg-[#FF6B35]/20">
              <Zap className="h-3 w-3 mr-1" />
              Powered by Gemini & Ideogram AI
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#1A1A2E] tracking-tight mb-6">
              Generate Brand-Perfect Creatives in{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#005B96] to-[#FF6B35]">
                30 Seconds
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Transform your Yi chapter events into stunning visual content. AI-powered design
              with automatic logo placement and brand consistency guaranteed.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href={ROUTES.signup}>
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-lg px-8 py-6">
                  Start Creating Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href={ROUTES.login}>
                <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                  Sign In
                </Button>
              </Link>
            </div>
            <p className="mt-4 text-sm text-gray-500">
              <CheckCircle2 className="inline h-4 w-4 text-green-500 mr-1" />
              10 free credits on signup • No credit card required
            </p>
          </div>

          {/* Hero Image Placeholder */}
          <div className="mt-16 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-[#005B96]/20 to-[#FF6B35]/20 blur-3xl rounded-full" />
            <Card className="relative border-2 shadow-2xl overflow-hidden">
              <CardContent className="p-0">
                <div className="aspect-video bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                  <div className="text-center p-8">
                    <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="aspect-[4/5] rounded-lg bg-gradient-to-br from-[#005B96]/10 to-[#FF6B35]/10 border-2 border-dashed border-gray-300 flex items-center justify-center"
                        >
                          <div className="text-center">
                            <ImageIcon className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                            <span className="text-xs text-gray-500">Event Poster {i}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="mt-6 text-gray-500">
                      Sample AI-generated event posters will appear here
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-4xl sm:text-5xl font-bold text-white mb-2">
                  {stat.value}
                </div>
                <div className="text-white/80 text-sm sm:text-base">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#1A1A2E] mb-4">
              Everything You Need to Create
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Professional-grade tools designed specifically for Yi chapters and CII initiatives.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <Card key={feature.title} className="border-2 hover:border-[#005B96]/50 transition-colors">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#005B96]/10 to-[#FF6B35]/10 flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-[#005B96]" />
                  </div>
                  <h3 className="text-xl font-semibold text-[#1A1A2E] mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#1A1A2E] mb-4">
              How It Works
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Create professional event posters in three simple steps.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div key={step.number} className="relative">
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-[#005B96] to-[#FF6B35]" />
                )}
                <div className="text-center">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#005B96] to-[#FF6B35] flex items-center justify-center mx-auto mb-6">
                    <span className="text-3xl font-bold text-white">{step.number}</span>
                  </div>
                  <h3 className="text-xl font-semibold text-[#1A1A2E] mb-2">
                    {step.title}
                  </h3>
                  <p className="text-gray-600">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#1A1A2E] mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Pay only for what you create. No subscriptions, no hidden fees.
            </p>
          </div>
          <div className="max-w-lg mx-auto">
            <Card className="border-2 border-[#005B96] shadow-xl">
              <CardContent className="p-8">
                <div className="text-center mb-6">
                  <Badge className="mb-4 bg-[#FF6B35] text-white">Most Popular</Badge>
                  <h3 className="text-2xl font-bold text-[#1A1A2E]">Pay As You Go</h3>
                </div>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                    <span className="text-gray-700">
                      <strong>10 free credits</strong> on signup
                    </span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                    <span className="text-gray-700">
                      Gemini generation: <strong>5 credits</strong>
                    </span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                    <span className="text-gray-700">
                      Ideogram generation: <strong>6 credits</strong>
                    </span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                    <span className="text-gray-700">
                      Recharge starting at <strong>₹100</strong> (20 credits)
                    </span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                    <span className="text-gray-700">All export formats included</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                    <span className="text-gray-700">Auto-refund on failed generations</span>
                  </li>
                </ul>
                <Link href={ROUTES.signup} className="block">
                  <Button size="lg" className="w-full bg-[#005B96] hover:bg-[#004a7c]">
                    Get Started Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials/Trust Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#1A1A2E] mb-4">
              Trusted by Yi Chapters
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Join chapters across India already creating stunning event materials.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                quote: 'Reduced our poster creation time from days to minutes.',
                author: 'Yi Chennai Chapter',
              },
              {
                quote: 'Perfect brand consistency across all our event materials.',
                author: 'Yi Mumbai Chapter',
              },
              {
                quote: 'The AI understands exactly what we need for Yi events.',
                author: 'Yi Bangalore Chapter',
              },
            ].map((testimonial) => (
              <Card key={testimonial.author} className="border-2">
                <CardContent className="p-6">
                  <div className="flex gap-1 mb-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="h-5 w-5 fill-[#FF6B35] text-[#FF6B35]" />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-4">&quot;{testimonial.quote}&quot;</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#005B96]/10 flex items-center justify-center">
                      <Users className="h-5 w-5 text-[#005B96]" />
                    </div>
                    <span className="font-medium text-[#1A1A2E]">{testimonial.author}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-[#005B96] to-[#004a7c]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Ready to Transform Your Event Marketing?
          </h2>
          <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
            Join Yi chapters creating professional event posters in seconds.
            Start with 10 free credits today.
          </p>
          <Link href={ROUTES.signup}>
            <Button size="lg" className="bg-[#FF6B35] hover:bg-[#e55a25] text-lg px-8 py-6">
              Start Creating Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-[#1A1A2E]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#005B96] to-[#FF6B35] flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">Yi CreativeStudio</span>
            </div>
            <div className="flex items-center gap-6 text-white/60">
              <Link href={ROUTES.login} className="hover:text-white transition-colors">
                Login
              </Link>
              <Link href={ROUTES.signup} className="hover:text-white transition-colors">
                Sign Up
              </Link>
              <a href="#" className="hover:text-white transition-colors">
                Privacy
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Terms
              </a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-white/10 text-center text-white/40 text-sm">
            <p>© {new Date().getFullYear()} Yi CreativeStudio. A CII Yi Initiative.</p>
            <p className="mt-2">Powered by Gemini & Ideogram AI</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
