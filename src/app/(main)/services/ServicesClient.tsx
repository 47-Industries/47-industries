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
  'app': 'IOS_APP', // Default app to iOS
}

const CATEGORY_LABELS: Record<string, string> = {
  WEB_DEVELOPMENT: 'Website',
  WEB_APP: 'Web Application',
  IOS_APP: 'iOS App',
  ANDROID_APP: 'Android App',
  CROSS_PLATFORM_APP: 'Cross-Platform App',
}

const technologies = [
  'Next.js', 'React', 'React Native', 'Swift', 'Kotlin',
  'TypeScript', 'Node.js', 'PostgreSQL', 'Prisma',
  'Stripe', 'AWS', 'Firebase', 'Tailwind CSS',
]

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

  const currentService = SERVICE_TYPES.find(t => t.id === selectedType)

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="pt-20 pb-8">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {currentService?.label || 'Our Services'}
            </h1>
            <p className="text-lg text-text-secondary mb-8">
              {currentService?.description}
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
        </div>
      </div>

      <div className="container mx-auto px-6 py-12">
        {/* Pricing Cards */}
        {displayPackages.length > 0 ? (
          <div className="mb-20">
            <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
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
                    href={`/start-project?service=${pkg.slug}`}
                    className={`block w-full py-3 text-center rounded-lg font-medium transition-all ${
                      pkg.isPopular
                        ? 'bg-accent text-white hover:bg-accent/90'
                        : 'border border-border hover:bg-surface'
                    }`}
                  >
                    Get Started
                  </Link>
                </div>
              ))}
            </div>

          </div>
        ) : (
          <div className="mb-20 text-center py-12 border border-border rounded-2xl max-w-4xl mx-auto">
            <p className="text-text-secondary">
              Service packages coming soon. Contact us for custom quotes.
            </p>
          </div>
        )}

        {/* Portfolio Section */}
        {projects.length > 0 && (
          <div className="mb-20">
            <h2 className="text-4xl font-bold mb-4 text-center">Our Work</h2>
            <p className="text-center text-text-secondary mb-12 max-w-2xl mx-auto">
              Check out some of our recent projects
            </p>
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
                      <div className="w-12 h-12 text-text-secondary">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      </div>
                    )}
                    {project.isFeatured && (
                      <div className="absolute top-2 right-2 px-2 py-1 bg-yellow-500/90 text-black text-xs font-semibold rounded">
                        Featured
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
                className="inline-flex items-center px-6 py-3 border border-border rounded-lg text-sm font-medium hover:bg-surface hover:border-accent/50 transition-all"
              >
                View Full Portfolio
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          </div>
        )}

        {/* Our Process */}
        <div className="mb-20 bg-surface rounded-3xl p-12">
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

        {/* Technologies */}
        <div className="mb-20">
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

        {/* CTA */}
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
  )
}
