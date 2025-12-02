import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering - database not available at build time
export const dynamic = 'force-dynamic'

const CATEGORY_LABELS: Record<string, string> = {
  WEB_DEVELOPMENT: 'Web Development',
  IOS_APP: 'iOS App',
  ANDROID_APP: 'Android App',
  CROSS_PLATFORM_APP: 'Cross-Platform App',
  DESKTOP_APP: 'Desktop App',
  THREE_D_PRINTING: '3D Printing',
}

export async function generateMetadata() {
  const project = await prisma.serviceProject.findFirst({
    where: { slug: 'motorev' },
    select: { title: true, description: true },
  })

  return {
    title: project ? `${project.title} - 47 Industries` : 'MotoRev - 47 Industries',
    description: project?.description?.slice(0, 160) || 'Track your rides, connect with the community, and manage your garage.',
  }
}

export default async function MotoRevProjectPage() {
  const project = await prisma.serviceProject.findFirst({
    where: { slug: 'motorev' },
  })

  if (!project || !project.isActive) {
    notFound()
  }

  const technologies = (project.technologies as string[]) || []
  const images = (project.images as string[]) || []
  const categories = (project.categories as string[]) || []

  // Use categories array if available, otherwise fall back to single category
  const displayCategories = categories.length > 0 ? categories : [project.category]

  // MotoRev-specific features
  const features = [
    {
      title: 'GPS Ride Tracking',
      description: 'Record every ride with advanced GPS tracking. View detailed maps, routes, elevation, and speed data.',
    },
    {
      title: 'Rider Community',
      description: 'Connect with fellow riders, share experiences, and discover new routes together.',
    },
    {
      title: 'Safety Features',
      description: 'Crash detection, emergency contacts, and real-time location sharing for peace of mind.',
    },
    {
      title: 'Garage Management',
      description: 'Track maintenance, modifications, and expenses for all your motorcycles in one place.',
    },
    {
      title: 'Weather Intelligence',
      description: 'Real-time weather updates and forecasts to plan your rides perfectly.',
    },
    {
      title: 'Route Planning',
      description: 'Discover scenic routes and create custom rides with waypoints and stops.',
    },
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section - Same as other projects */}
      <div className="pt-20 pb-12 md:pt-24 md:pb-16">
        <div className="container mx-auto px-4 md:px-6">
          {/* Breadcrumb */}
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
                    {CATEGORY_LABELS[cat] || cat}
                  </span>
                ))}
              </div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">{project.title}</h1>

              {/* Client info with optional logo */}
              <div className="flex items-center gap-3 mb-6">
                {project.clientLogo && (
                  <img
                    src={project.clientLogo}
                    alt={project.clientName}
                    className="h-8 w-auto object-contain"
                  />
                )}
                <p className="text-lg text-text-secondary">{project.clientName}</p>
              </div>

              {/* Quick description */}
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
                    View Live
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                )}
                {project.videoUrl && (
                  <a
                    href={project.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-5 py-2.5 bg-surface border border-border rounded-lg font-medium hover:bg-surface-elevated transition-colors text-sm"
                  >
                    Watch Video
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </a>
                )}
                <a
                  href="https://apps.apple.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-5 py-2.5 border border-border rounded-lg font-medium hover:bg-surface transition-colors text-sm"
                >
                  Download on App Store
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Case Study Section - Only show if there's additional content */}
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

      {/* Screenshots Gallery - Horizontal scroll on mobile, grid on desktop */}
      {images.length > 0 && (
        <div className="py-12">
          <div className="container mx-auto px-4 md:px-6">
            <h2 className="text-xl font-bold mb-6">Screenshots</h2>

            {/* Mobile: Horizontal scroll */}
            <div className="md:hidden overflow-x-auto pb-4 -mx-4 px-4">
              <div className="flex gap-3" style={{ width: 'max-content' }}>
                {images.map((img, i) => (
                  <div
                    key={i}
                    className="w-32 h-56 flex-shrink-0 rounded-lg overflow-hidden bg-surface"
                  >
                    <img
                      src={img}
                      alt={`${project.title} screenshot ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Desktop: Grid */}
            <div className="hidden md:grid grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {images.map((img, i) => (
                <div
                  key={i}
                  className="aspect-[9/16] rounded-lg overflow-hidden bg-surface hover:ring-2 hover:ring-accent/50 transition-all cursor-pointer"
                >
                  <img
                    src={img}
                    alt={`${project.title} screenshot ${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Testimonial */}
      {project.testimonial && (
        <div className="py-12 bg-surface/30">
          <div className="container mx-auto px-4 md:px-6">
            <div className="max-w-2xl mx-auto text-center">
              <svg className="w-8 h-8 text-accent mx-auto mb-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
              </svg>
              <p className="text-lg md:text-xl mb-4 italic">&ldquo;{project.testimonial}&rdquo;</p>
              {(project.testimonialAuthor || project.testimonialRole) && (
                <div>
                  {project.testimonialAuthor && (
                    <p className="font-semibold">{project.testimonialAuthor}</p>
                  )}
                  {project.testimonialRole && (
                    <p className="text-text-secondary text-sm">{project.testimonialRole}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* MOTOREV-SPECIFIC SECTIONS BELOW */}
      {/* ============================================ */}

      {/* Features Grid */}
      <div className="py-16 bg-surface/30">
        <div className="container mx-auto px-4 md:px-6">
          <h2 className="text-3xl font-bold mb-10 text-center">Features</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div key={feature.title} className="bg-background border border-border rounded-xl p-6">
                <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                <p className="text-text-secondary text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Development Roadmap */}
      <div className="py-16">
        <div className="container mx-auto px-4 md:px-6">
          <h2 className="text-3xl font-bold mb-10 text-center">Development Roadmap</h2>
          <div className="max-w-2xl mx-auto space-y-0">
            {/* Completed: App Development */}
            <div className="flex gap-4 md:gap-6">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-green-500 flex items-center justify-center text-white">
                  <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="w-px h-16 bg-border"></div>
              </div>
              <div className="pb-8 pt-1">
                <div className="text-sm text-green-500 font-semibold mb-1">COMPLETED</div>
                <h3 className="text-lg md:text-xl font-bold mb-1">App Development</h3>
                <p className="text-text-secondary text-sm">Core app built with Swift and SwiftUI</p>
              </div>
            </div>

            {/* In Progress: iOS Beta Testing */}
            <div className="flex gap-4 md:gap-6">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-accent flex items-center justify-center text-white animate-pulse">
                  <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="w-px h-16 bg-border"></div>
              </div>
              <div className="pb-8 pt-1">
                <div className="text-sm text-accent font-semibold mb-1">IN PROGRESS</div>
                <h3 className="text-lg md:text-xl font-bold mb-1">iOS Beta Testing</h3>
                <p className="text-text-secondary text-sm">Testing with real users via TestFlight</p>
              </div>
            </div>

            {/* Upcoming: iOS Public Launch */}
            <div className="flex gap-4 md:gap-6">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-surface border-2 border-accent flex items-center justify-center text-accent font-bold text-sm">
                  Dec
                </div>
                <div className="w-px h-16 bg-border"></div>
              </div>
              <div className="pb-8 pt-1">
                <div className="text-sm text-text-secondary font-semibold mb-1">DECEMBER 17, 2025</div>
                <h3 className="text-lg md:text-xl font-bold mb-1">iOS Public Launch</h3>
                <p className="text-text-secondary text-sm">Available on Apple App Store</p>
              </div>
            </div>

            {/* Future: Android Release */}
            <div className="flex gap-4 md:gap-6">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-surface border border-border flex items-center justify-center text-text-secondary font-bold text-sm">
                  Q1
                </div>
              </div>
              <div className="pt-1">
                <div className="text-sm text-text-secondary font-semibold mb-1">Q1 2026</div>
                <h3 className="text-lg md:text-xl font-bold mb-1">Android Release</h3>
                <p className="text-text-secondary text-sm">Coming to Google Play Store</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="py-16 bg-surface/30">
        <div className="container mx-auto px-4 md:px-6">
          <h2 className="text-3xl font-bold mb-10 text-center">Simple Pricing</h2>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Free Tier */}
            <div className="border border-border rounded-2xl p-8 bg-background">
              <h3 className="text-2xl font-bold mb-2">Free</h3>
              <div className="text-4xl font-bold mb-4">$0</div>
              <p className="text-text-secondary mb-6">Perfect for casual riders</p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center text-sm">
                  <svg className="w-5 h-5 text-accent mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Basic ride tracking
                </li>
                <li className="flex items-center text-sm">
                  <svg className="w-5 h-5 text-accent mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Community access
                </li>
                <li className="flex items-center text-sm">
                  <svg className="w-5 h-5 text-accent mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Up to 3 motorcycles
                </li>
              </ul>
            </div>

            {/* Pro Tier */}
            <div className="border-2 border-accent rounded-2xl p-8 bg-accent/5 relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 px-3 py-1 bg-accent text-white text-xs font-semibold rounded-full">
                MOST POPULAR
              </div>
              <h3 className="text-2xl font-bold mb-2">Pro</h3>
              <div className="text-4xl font-bold mb-1">$9.99<span className="text-lg text-text-secondary">/mo</span></div>
              <div className="text-sm text-text-secondary mb-4">$3.99/week or $99.99/year</div>
              <p className="text-text-secondary mb-6">For serious riders</p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center text-sm">
                  <svg className="w-5 h-5 text-accent mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Everything in Free
                </li>
                <li className="flex items-center text-sm">
                  <svg className="w-5 h-5 text-accent mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Advanced analytics
                </li>
                <li className="flex items-center text-sm">
                  <svg className="w-5 h-5 text-accent mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Unlimited ride storage
                </li>
                <li className="flex items-center text-sm">
                  <svg className="w-5 h-5 text-accent mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Priority support
                </li>
                <li className="flex items-center text-sm">
                  <svg className="w-5 h-5 text-accent mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Unlimited motorcycles
                </li>
                <li className="flex items-center text-sm">
                  <svg className="w-5 h-5 text-accent mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Export data & reports
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to ride?</h2>
          <p className="text-lg text-text-secondary mb-8 max-w-xl mx-auto">
            Join thousands of riders tracking their adventures with MotoRev
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href={project.liveUrl || 'https://motorevapp.com'}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-8 py-4 bg-text-primary text-background rounded-lg font-medium hover:bg-text-secondary transition-all"
            >
              Learn More at MotoRevApp.com
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center px-8 py-4 border border-border rounded-lg font-medium hover:bg-surface transition-colors"
            >
              Get in Touch
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
