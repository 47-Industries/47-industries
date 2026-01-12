'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

interface Package {
  id: string
  name: string
  slug: string
  category: string
  price: number | null
  priceDisplay: string | null
  priceNote: string | null
  billingType: string
  shortDesc: string
  description: string
  features: unknown
  isPopular: boolean
  badge: string | null
  estimatedDays: number | null
  estimatedWeeks: number | null
}

interface Project {
  id: string
  title: string
  slug: string
  category: string
  clientName: string
  thumbnailUrl: string | null
  isFeatured: boolean
  accentColor: string | null
}

// Category-specific icons for placeholders
const PROJECT_ICONS: Record<string, React.ReactNode> = {
  AI_AUTOMATION: (
    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  ),
  WEB_DEVELOPMENT: (
    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
    </svg>
  ),
  WEB_APP: (
    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  IOS_APP: (
    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  ),
}

interface ServicesClientProps {
  packages: Package[]
  projects: Project[]
}

const SERVICE_TYPES = [
  {
    id: 'WEB_DEVELOPMENT',
    label: 'Websites',
    description: 'Custom websites built with modern technologies. Fast, secure, and beautifully designed for your brand.',
  },
  {
    id: 'WEB_APP',
    label: 'Web Apps',
    description: 'Full-featured web applications with complex functionality. Dashboards, portals, and SaaS platforms.',
  },
  {
    id: 'IOS_APP',
    label: 'iOS',
    description: 'Native iOS applications built with Swift for iPhone and iPad. Optimized for the Apple ecosystem.',
  },
  {
    id: 'ANDROID_APP',
    label: 'Android',
    description: 'Native Android applications using Kotlin. Designed for the full range of Android devices.',
  },
  {
    id: 'CROSS_PLATFORM_APP',
    label: 'Cross-Platform',
    description: 'Build once, deploy everywhere. React Native apps for both iOS and Android from a single codebase.',
  },
  {
    id: 'AI_AUTOMATION',
    label: 'AI Automation',
    description: 'AI-powered business automations. Receptionists, lead generators, workflow automation, and more.',
  },
]

// Map URL params to service type IDs
const CATEGORY_FROM_PARAM: Record<string, string> = {
  'web': 'WEB_DEVELOPMENT',
  'websites': 'WEB_DEVELOPMENT',
  'webapp': 'WEB_APP',
  'web-app': 'WEB_APP',
  'ios': 'IOS_APP',
  'android': 'ANDROID_APP',
  'cross-platform': 'CROSS_PLATFORM_APP',
  'ai': 'AI_AUTOMATION',
  'ai-automation': 'AI_AUTOMATION',
  'automation': 'AI_AUTOMATION',
  'app': 'IOS_APP', // Default app to iOS
}

const CATEGORY_LABELS: Record<string, string> = {
  WEB_DEVELOPMENT: 'Website',
  WEB_APP: 'Web Application',
  IOS_APP: 'iOS App',
  ANDROID_APP: 'Android App',
  CROSS_PLATFORM_APP: 'Cross-Platform App',
  AI_AUTOMATION: 'AI Automation',
}

const technologies = [
  'Next.js', 'React', 'React Native', 'Swift', 'Kotlin',
  'TypeScript', 'Node.js', 'PostgreSQL', 'Prisma',
  'Stripe', 'AWS', 'Firebase', 'Tailwind CSS',
]

// Helper functions for package links
function getPackageLink(pkg: Package): string {
  // AI Automation packages link to product pages or external sites
  if (pkg.category === 'AI_AUTOMATION') {
    if (pkg.slug === 'leadchopper-marketing') {
      return 'https://leadchopper.app'
    }
    if (pkg.slug === 'ringzero-receptionist') {
      return '/projects/ringzero'
    }
    // Enterprise/custom packages go to inquiry form
    return `/services/inquiry?type=${pkg.category}&package=${pkg.slug}`
  }
  // All other packages go to inquiry form
  return `/services/inquiry?type=${pkg.category}`
}

function getPackageButtonText(pkg: Package): string {
  if (pkg.slug === 'leadchopper-marketing') {
    return 'Visit LeadChopper'
  }
  if (pkg.slug === 'ringzero-receptionist') {
    return 'Learn More'
  }
  if (pkg.price === null) {
    return 'Contact Us'
  }
  return 'Get Started'
}

export default function ServicesClient({ packages, projects }: ServicesClientProps) {
  const searchParams = useSearchParams()
  const [selectedType, setSelectedType] = useState('WEB_DEVELOPMENT')

  // Set initial category from URL param
  useEffect(() => {
    const category = searchParams.get('category')
    if (category && CATEGORY_FROM_PARAM[category]) {
      setSelectedType(CATEGORY_FROM_PARAM[category])
    }
  }, [searchParams])

  // Get packages for selected type (3 tiers per category)
  const displayPackages = packages.filter(pkg => pkg.category === selectedType)

  // Get featured products (first 3 featured projects, prioritizing those with custom pages)
  const featuredProducts = projects.filter(p => p.isFeatured).slice(0, 3)

  return (
    <div className="min-h-screen">
      {/* Integrated Hero - Services + Work + Pricing at a Glance */}
      <div className="pt-20 pb-12">
        <div className="container mx-auto px-6">
          <div className="max-w-7xl mx-auto">
            {/* Top: What We Do */}
            <div className="text-center mb-12">
              <h1 className="text-5xl md:text-6xl font-bold mb-4">
                Software That Works
              </h1>
              <p className="text-xl text-text-secondary max-w-3xl mx-auto mb-8">
                We build mobile apps, SaaS platforms, and websites. See our work, explore services, and start your project.
              </p>

              {/* Service Type Quick Nav */}
              <div className="inline-flex flex-wrap justify-center gap-2">
                {SERVICE_TYPES.slice(0, 6).map((type) => (
                  <button
                    key={type.id}
                    onClick={() => {
                      setSelectedType(type.id)
                      document.getElementById('packages')?.scrollIntoView({ behavior: 'smooth' })
                    }}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      selectedType === type.id
                        ? 'bg-accent text-white'
                        : 'bg-surface border border-border text-text-secondary hover:border-accent'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Middle: Featured Work Grid (3 columns) */}
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              {featuredProducts.slice(0, 3).map((product) => (
                <Link
                  key={product.id}
                  href={`/projects/${product.slug}`}
                  className="group border border-border rounded-xl overflow-hidden hover:border-accent transition-all bg-surface"
                >
                  <div className="aspect-video bg-surface-elevated relative overflow-hidden">
                    {product.thumbnailUrl ? (
                      <img
                        src={product.thumbnailUrl}
                        alt={product.title}
                        className="object-cover w-full h-full group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      /* Styled placeholder with category icon */
                      <div
                        className="w-full h-full flex flex-col items-center justify-center p-4"
                        style={{
                          background: product.accentColor
                            ? `linear-gradient(135deg, ${product.accentColor}20 0%, ${product.accentColor}08 100%)`
                            : 'linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(59,130,246,0.03) 100%)'
                        }}
                      >
                        <div
                          className="mb-2"
                          style={{ color: product.accentColor || '#3b82f6' }}
                        >
                          {PROJECT_ICONS[product.category] || (
                            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                            </svg>
                          )}
                        </div>
                        <span
                          className="text-sm font-semibold text-center"
                          style={{ color: product.accentColor || '#3b82f6' }}
                        >
                          {product.title}
                        </span>
                      </div>
                    )}
                    <div className="absolute top-2 right-2 px-2 py-1 bg-accent text-white text-xs font-bold rounded">
                      47 IND.
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold mb-1 group-hover:text-accent transition-colors line-clamp-1">
                      {product.title}
                    </h3>
                    <p className="text-text-secondary text-sm line-clamp-1">{product.clientName}</p>
                  </div>
                </Link>
              ))}
            </div>

            {/* Bottom: Pricing Preview + CTA */}
            <div className="bg-surface/50 border border-border rounded-2xl p-8">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <h2 className="text-3xl font-bold mb-4">Transparent Pricing</h2>
                  <p className="text-text-secondary mb-6">
                    {SERVICE_TYPES.find(t => t.id === selectedType)?.description ||
                     'Choose a service type above to see pricing options. Or contact us for custom quotes.'}
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Link
                      href="#packages"
                      onClick={(e) => {
                        e.preventDefault()
                        document.getElementById('packages')?.scrollIntoView({ behavior: 'smooth' })
                      }}
                      className="px-6 py-3 bg-accent text-white rounded-lg font-medium hover:bg-accent/90 transition-all"
                    >
                      View Packages
                    </Link>
                    <Link
                      href={`/services/inquiry?type=${selectedType}`}
                      className="px-6 py-3 border border-border rounded-lg font-medium hover:bg-surface transition-all"
                    >
                      Get Custom Quote
                    </Link>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-background border border-border rounded-xl p-4">
                    <div className="text-2xl font-bold text-accent mb-1">$5K+</div>
                    <div className="text-sm text-text-secondary">Websites</div>
                  </div>
                  <div className="bg-background border border-border rounded-xl p-4">
                    <div className="text-2xl font-bold text-accent mb-1">$15K+</div>
                    <div className="text-sm text-text-secondary">Web Apps</div>
                  </div>
                  <div className="bg-background border border-border rounded-xl p-4">
                    <div className="text-2xl font-bold text-accent mb-1">$25K+</div>
                    <div className="text-sm text-text-secondary">Mobile Apps</div>
                  </div>
                  <div className="bg-background border border-border rounded-xl p-4">
                    <div className="text-2xl font-bold text-accent mb-1">$400</div>
                    <div className="text-sm text-text-secondary">AI Automation</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Full Portfolio - All Projects */}
      <div className="py-20" id="portfolio">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">Our Portfolio</h2>
              <p className="text-lg text-text-secondary max-w-2xl mx-auto">
                Our own products and client work - websites, mobile apps, and SaaS platforms built for real businesses.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.slug}`}
                  className="group border border-border rounded-xl overflow-hidden hover:border-accent/50 transition-all bg-surface"
                >
                  <div className="aspect-video bg-surface-elevated flex items-center justify-center relative overflow-hidden">
                    {project.thumbnailUrl ? (
                      <img
                        src={project.thumbnailUrl}
                        alt={project.title}
                        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div
                        className="w-full h-full flex flex-col items-center justify-center p-4"
                        style={{
                          background: project.accentColor
                            ? `linear-gradient(135deg, ${project.accentColor}20 0%, ${project.accentColor}08 100%)`
                            : 'linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(59,130,246,0.03) 100%)'
                        }}
                      >
                        <div
                          className="mb-2"
                          style={{ color: project.accentColor || '#3b82f6' }}
                        >
                          {PROJECT_ICONS[project.category] || (
                            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                            </svg>
                          )}
                        </div>
                        <span
                          className="text-sm font-semibold text-center"
                          style={{ color: project.accentColor || '#3b82f6' }}
                        >
                          {project.title}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="text-xs text-accent font-medium mb-2">
                      {CATEGORY_LABELS[project.category] || project.category}
                    </div>
                    <h3 className="text-lg font-bold mb-1 group-hover:text-accent transition-colors line-clamp-1">
                      {project.title}
                    </h3>
                    <p className="text-text-secondary text-sm">{project.clientName}</p>
                  </div>
                </Link>
              ))}
            </div>
            {/* View More Button */}
            <div className="mt-10 text-center">
              <Link
                href="/portfolio"
                className="inline-flex items-center px-8 py-4 border border-border rounded-lg text-base font-medium hover:bg-surface hover:border-accent/50 transition-all"
              >
                View Full Portfolio
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Service Packages Section */}
      <div className="py-20 bg-surface/30" id="packages">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">Service Packages</h2>
              <p className="text-lg text-text-secondary max-w-2xl mx-auto mb-8">
                Transparent pricing for common project types. Every project is unique - these are starting points for our conversations.
              </p>

              {/* Service Type Tabs */}
              <div className="inline-flex flex-wrap justify-center gap-2 md:gap-3">
                {SERVICE_TYPES.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setSelectedType(type.id)}
                    className={`px-4 py-2 md:px-5 md:py-2.5 rounded-full text-sm font-medium transition-all ${
                      selectedType === type.id
                        ? 'bg-accent text-white'
                        : 'bg-surface border border-border text-text-secondary hover:text-white hover:border-text-secondary'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Pricing Cards */}
            {displayPackages.length > 0 ? (
              <div className="grid lg:grid-cols-3 gap-8">
                {displayPackages.map((pkg) => (
                <div
                  key={pkg.id}
                  className={`border rounded-2xl p-8 ${
                    pkg.isPopular
                      ? 'border-accent bg-accent/5 scale-105 shadow-lg shadow-accent/10'
                      : 'border-border'
                  }`}
                >
                  {pkg.isPopular && (
                    <div className="inline-block px-3 py-1 bg-accent text-white text-xs font-semibold rounded-full mb-4">
                      {pkg.badge || 'MOST POPULAR'}
                    </div>
                  )}

                  <h3 className="text-2xl font-bold mb-2">{pkg.name}</h3>
                  <div className="text-4xl font-bold mb-2">
                    {pkg.priceDisplay || (pkg.price ? `$${pkg.price.toLocaleString()}` : 'Custom')}
                    {pkg.price && pkg.billingType === 'monthly' && (
                      <span className="text-lg font-normal text-text-secondary">/mo</span>
                    )}
                    {pkg.price && pkg.billingType === 'yearly' && (
                      <span className="text-lg font-normal text-text-secondary">/yr</span>
                    )}
                  </div>
                  {pkg.priceNote && (
                    <p className="text-text-secondary text-xs mb-2">{pkg.priceNote}</p>
                  )}
                  <p className="text-text-secondary text-sm mb-6">{pkg.shortDesc}</p>

                  {/* Features */}
                  <ul className="space-y-3 mb-8">
                    {(typeof pkg.features === 'string' ? JSON.parse(pkg.features) : pkg.features as string[])?.slice(0, 7).map((feature: string, i: number) => (
                      <li key={i} className="flex items-start text-sm">
                        <svg className="w-5 h-5 text-accent mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>

                  {/* Estimated Time */}
                  {(pkg.estimatedDays || pkg.estimatedWeeks) && (
                    <p className="text-text-secondary text-sm mb-4">
                      Estimated delivery: {pkg.estimatedWeeks ? `${pkg.estimatedWeeks} weeks` : `${pkg.estimatedDays} days`}
                    </p>
                  )}

                  <Link
                    href={getPackageLink(pkg)}
                    target={pkg.slug === 'leadchopper-marketing' ? '_blank' : undefined}
                    rel={pkg.slug === 'leadchopper-marketing' ? 'noopener noreferrer' : undefined}
                    className={`block w-full py-3 text-center rounded-lg font-medium transition-all ${
                      pkg.isPopular
                        ? 'bg-accent text-white hover:bg-accent/90'
                        : 'border border-border hover:bg-surface'
                    }`}
                  >
                    {getPackageButtonText(pkg)}
                  </Link>
                </div>
              ))}
            </div>
            ) : (
              <div className="text-center py-12 border border-border rounded-2xl">
                <p className="text-text-secondary">
                  Service packages coming soon. Contact us for custom quotes.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Our Process */}
      <div className="py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto bg-surface rounded-3xl p-12">
            <h2 className="text-4xl font-bold mb-12 text-center">Our Process</h2>
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="text-5xl font-bold text-accent mb-4">01</div>
              <h3 className="text-xl font-bold mb-3">Discovery</h3>
              <p className="text-text-secondary">
                We learn about your business, goals, and target audience.
              </p>
            </div>
            <div>
              <div className="text-5xl font-bold text-accent mb-4">02</div>
              <h3 className="text-xl font-bold mb-3">Design</h3>
              <p className="text-text-secondary">
                Custom mockups and prototypes that reflect your brand.
              </p>
            </div>
            <div>
              <div className="text-5xl font-bold text-accent mb-4">03</div>
              <h3 className="text-xl font-bold mb-3">Development</h3>
              <p className="text-text-secondary">
                Clean code built with modern frameworks for performance.
              </p>
            </div>
            <div>
              <div className="text-5xl font-bold text-accent mb-4">04</div>
              <h3 className="text-xl font-bold mb-3">Launch</h3>
              <p className="text-text-secondary">
                Deployment, testing, and ongoing support for success.
              </p>
            </div>
          </div>
        </div>
      </div>
      </div>

      {/* Technologies */}
      <div className="py-20 bg-surface/30">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold mb-8 text-center">Technologies We Use</h2>
          <div className="flex flex-wrap gap-4 justify-center max-w-4xl mx-auto">
            {technologies.map((tech) => (
              <div
                key={tech}
                className="px-6 py-3 border border-border rounded-full text-sm font-medium"
              >
                {tech}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center py-16 border-t border-border">
            <h2 className="text-4xl font-bold mb-6">Ready to start your project?</h2>
            <p className="text-xl text-text-secondary mb-8 max-w-2xl mx-auto">
              Let's discuss your ideas and create something amazing together.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center px-10 py-5 bg-text-primary text-background rounded-lg text-lg font-medium hover:bg-text-secondary transition-all"
            >
              Contact Us
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
