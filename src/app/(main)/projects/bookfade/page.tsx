import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function generateMetadata() {
  const project = await prisma.serviceProject.findFirst({
    where: { slug: 'bookfade' },
    select: { title: true, description: true },
  })

  return {
    title: project ? `${project.title} - 47 Industries` : 'BookFade - 47 Industries',
    description: project?.description?.slice(0, 160) || 'Multi-tenant barber booking platform with custom domains and automated reminders.',
  }
}

export default async function BookFadePage() {
  const project = await prisma.serviceProject.findFirst({
    where: { slug: 'bookfade' },
  })

  if (!project || !project.isActive) {
    notFound()
  }

  const technologies = (project.technologies as string[]) || []
  const categories = (project.categories as string[]) || []
  const displayCategories = categories.length > 0 ? categories : [project.category]

  // Key Features
  const features = [
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      title: 'Smart Scheduling',
      description: 'Customers book 24/7 with real-time availability. Google Calendar sync keeps everything in one place.',
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
      title: 'Automated Reminders',
      description: 'SMS and email reminders via Twilio and Resend. Reduce no-shows automatically without lifting a finger.',
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
      title: 'Stripe Payments',
      description: 'Accept deposits, collect no-show fees, or require prepayment. Flexible payment options built right in.',
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
        </svg>
      ),
      title: 'Custom Domains',
      description: 'Your own branded booking site (e.g., yourshop.com). Professional appearance, zero technical setup.',
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      title: 'Client Management',
      description: 'Track customer history, preferences, and contact info. Build relationships with every appointment.',
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      title: 'Analytics Dashboard',
      description: 'Track bookings, revenue, and trends. Make data-driven decisions about your business growth.',
    },
  ]

  // How It Works Steps
  const steps = [
    {
      number: '01',
      title: 'Sign Up & Customize',
      description: '14-day free trial, no credit card required. Set up your services, availability, and branding in minutes.',
    },
    {
      number: '02',
      title: 'Get Your Domain',
      description: 'Choose yourshop.bookfade.com or connect your own custom domain. We handle the technical setup.',
    },
    {
      number: '03',
      title: 'Start Taking Bookings',
      description: 'Share your booking link. Customers book appointments, get reminders, and pay online automatically.',
    },
    {
      number: '04',
      title: 'Grow Your Business',
      description: 'Track analytics, manage clients, and focus on cutting hair while BookFade handles the rest.',
    },
  ]

  // Pricing
  const pricingPlans = [
    {
      name: 'Barber',
      price: '$29.99',
      period: '/month',
      description: 'Perfect for individual barbers',
      features: [
        'Custom booking page',
        'Unlimited appointments',
        'Automated reminders',
        'Stripe payment integration',
        'Google Calendar sync',
        'Client management',
        'Analytics dashboard',
        '14-day free trial',
      ],
    },
    {
      name: 'Shop',
      price: '$59.99',
      period: '/month',
      description: 'For barbershops with multiple barbers',
      features: [
        'Everything in Barber plan',
        'Unlimited barbers',
        'Custom domain included',
        'Shop-wide analytics',
        'Team management',
        'Priority support',
        'Advanced scheduling',
        '14-day free trial',
      ],
      popular: true,
    },
  ]

  return (
    <>
      {/* Custom Brand Color Styles - BookFade Amber (#f59e0b) - Excludes navbar */}
      {project.accentColor && (
        <style dangerouslySetInnerHTML={{
          __html: `
            /* BookFade brand amber - Scoped to page content only, NOT navbar */
            main .text-accent { color: #f59e0b !important; }
            main .bg-accent { background-color: #f59e0b !important; }
            main .bg-accent\\/10 { background-color: rgba(245, 158, 11, 0.1) !important; }
            main .bg-accent\\/5 { background-color: rgba(245, 158, 11, 0.05) !important; }
            main .border-accent { border-color: #f59e0b !important; }
            main .border-accent\\/20 { border-color: rgba(245, 158, 11, 0.2) !important; }
            main .hover\\:bg-accent\\/90:hover { background-color: #d97706 !important; }
            main .ring-accent\\/50 { --tw-ring-color: rgba(245, 158, 11, 0.5) !important; }

            /* Gradient backgrounds matching BookFade brand */
            main .from-accent { --tw-gradient-from: #f59e0b !important; }
            main .to-accent { --tw-gradient-to: #d97706 !important; }
            main .via-accent { --tw-gradient-via: #f59e0b !important; }
          `
        }} />
      )}
      <div className="min-h-screen">
        {/* Hero Section - Standard Template */}
      <div className="pt-20 pb-12 md:pt-24 md:pb-16">
        <div className="container mx-auto px-4 md:px-6">
          <div className="mb-6">
            <Link href="/services" className="text-sm text-text-secondary hover:text-accent transition-colors">
              ← Back to Services
            </Link>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
            {/* Left: Hero Image */}
            {project.thumbnailUrl && (
              <div className="order-2 lg:order-1">
                <div className="rounded-xl overflow-hidden bg-surface inline-block">
                  <img
                    src={project.thumbnailUrl}
                    alt={project.title}
                    className="w-auto h-auto max-w-full max-h-[450px] object-contain"
                  />
                </div>
              </div>
            )}

            {/* Right: Text Content */}
            <div className={`order-1 lg:order-2 ${!project.thumbnailUrl ? 'lg:col-span-2 max-w-2xl' : ''}`}>
              {/* Category tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                {displayCategories.map((cat) => (
                  <span
                    key={cat}
                    className="inline-block px-3 py-1 bg-accent/10 text-accent text-sm font-medium rounded-full"
                  >
                    {cat.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>

              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">{project.title}</h1>

              {/* Client info with optional logo */}
              <div className="flex items-center gap-4 mb-6">
                {project.clientLogo && (
                  <img
                    src={project.clientLogo}
                    alt={project.clientName}
                    className="h-14 w-auto object-contain"
                  />
                )}
                <p className="text-lg text-text-secondary">{project.clientName}</p>
              </div>

              {/* Description */}
              <p className="text-text-secondary mb-6">
                {project.description}
              </p>

              {/* Tech tags - compact */}
              {technologies.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {technologies.slice(0, 5).map((tech) => (
                    <span
                      key={tech}
                      className="px-2 py-1 bg-surface border border-border rounded text-xs"
                    >
                      {tech}
                    </span>
                  ))}
                  {technologies.length > 5 && (
                    <span className="px-2 py-1 text-text-secondary text-xs">
                      +{technologies.length - 5} more
                    </span>
                  )}
                </div>
              )}

              {/* Action buttons */}
              <div className="flex flex-wrap gap-3">
                {project.liveUrl && (
                  <a
                    href={project.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-5 py-2.5 bg-accent text-white rounded-lg font-medium hover:bg-accent/90 transition-colors text-sm"
                  >
                    Visit BookFade
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                )}
                <Link
                  href="/start-project"
                  className="inline-flex items-center px-5 py-2.5 border border-border rounded-lg font-medium hover:bg-surface transition-colors text-sm"
                >
                  Start Your Project
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Case Study Section - Standard Template */}
      {(project.challenge || project.solution || project.results) && (
        <div className="py-12 bg-surface/30">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {/* Challenge */}
              {project.challenge && (
                <div className="bg-background/50 rounded-xl p-6">
                  <h2 className="text-lg font-bold mb-3">The Challenge</h2>
                  <p className="text-text-secondary text-sm leading-relaxed">{project.challenge}</p>
                </div>
              )}

              {/* Solution */}
              {project.solution && (
                <div className="bg-background/50 rounded-xl p-6">
                  <h2 className="text-lg font-bold mb-3">Our Solution</h2>
                  <p className="text-text-secondary text-sm leading-relaxed">{project.solution}</p>
                </div>
              )}

              {/* Results */}
              {project.results && (
                <div className="bg-background/50 rounded-xl p-6">
                  <h2 className="text-lg font-bold mb-3">Results</h2>
                  <p className="text-text-secondary text-sm leading-relaxed">{project.results}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Features Grid - Custom Section */}
      <div className="py-20">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything You Need to Run Your Shop</h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              Professional booking software that's simple, powerful, and affordable.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <div key={i} className="bg-surface border border-border rounded-xl p-8 hover:border-accent transition-all">
                <div className="text-accent mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-text-secondary">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="py-20 bg-surface/30">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Get Started in Minutes</h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              No technical skills needed. We'll guide you through every step.
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8">
              {steps.map((step, i) => (
                <div key={i} className="flex gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 rounded-full bg-accent/10 text-accent flex items-center justify-center text-2xl font-bold">
                      {step.number}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                    <p className="text-text-secondary">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="py-20">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              Start with a 14-day free trial. No credit card required.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {pricingPlans.map((plan, i) => (
              <div
                key={i}
                className={`rounded-2xl p-8 ${
                  plan.popular
                    ? 'bg-accent/5 border-2 border-accent relative'
                    : 'bg-surface border border-border'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-accent text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </div>
                )}
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <div className="mb-1">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-text-secondary">{plan.period}</span>
                </div>
                <p className="text-text-secondary mb-6">{plan.description}</p>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-center text-sm">
                      <svg className="w-5 h-5 text-accent mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
                <a
                  href={project.liveUrl || 'https://bookfade.com'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`block text-center px-6 py-3 rounded-lg font-medium transition-all ${
                    plan.popular
                      ? 'bg-accent text-white hover:bg-accent/90'
                      : 'bg-surface-elevated border border-border hover:bg-surface'
                  }`}
                >
                  Start Free Trial
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tech Stack */}
      {technologies.length > 0 && (
        <div className="py-20 bg-surface/30">
          <div className="container mx-auto px-4 md:px-6">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-3xl font-bold mb-8 text-center">Built With Modern Technology</h2>
              <div className="flex flex-wrap justify-center gap-3">
                {technologies.map((tech) => (
                  <span
                    key={tech}
                    className="px-4 py-2 bg-background border border-border rounded-lg text-sm font-medium"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Final CTA */}
      <div className="py-20">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-3xl mx-auto text-center bg-gradient-to-br from-accent/10 to-purple-500/10 rounded-2xl p-12 border border-accent/20">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Modernize Your Booking?
            </h2>
            <p className="text-lg text-text-secondary mb-8">
              Join barbers and shops using BookFade to grow their business.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a
                href={project.liveUrl || 'https://bookfade.com'}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-8 py-4 bg-accent text-white rounded-lg font-medium hover:bg-accent/90 transition-all shadow-lg"
              >
                Start Free Trial
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </a>
              <Link
                href="/contact"
                className="inline-flex items-center px-8 py-4 border-2 border-border rounded-lg font-medium hover:bg-surface transition-all"
              >
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  )
}
