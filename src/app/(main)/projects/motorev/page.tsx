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
                <a
                  href="https://motorevapp.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-5 py-2.5 bg-accent text-white rounded-lg font-medium hover:bg-accent/90 transition-colors text-sm"
                >
                  Download iOS Beta
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </a>
                <a
                  href="https://motorev.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-5 py-2.5 bg-surface border border-accent text-accent rounded-lg font-medium hover:bg-accent hover:text-white transition-all text-sm"
                >
                  Try Web App
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                </a>
                <Link
                  href="/start-project"
                  className="inline-flex items-center px-5 py-2.5 border border-border rounded-lg font-medium hover:bg-surface transition-colors text-sm"
                >
                  Build Similar App
                </Link>
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

      {/* Mission Statement */}
      <div className="py-16 bg-gradient-to-b from-background to-surface/30">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Built For Riders, By Riders</h2>
            <p className="text-lg md:text-xl text-text-secondary leading-relaxed mb-8">
              MotoRev isn't just another app—it's a tribute to the riding community and a testament to what's possible when passion meets technology. Born from a desire to honor Bryce Raiford's memory and unite riders worldwide, MotoRev represents months of development, thousands of lines of code, and a relentless commitment to excellence.
            </p>
            <p className="text-lg text-text-secondary leading-relaxed">
              This is what 47 Industries builds: native iOS apps with SwiftUI, scalable web platforms, real-time GPS tracking, social communities, and complete product ecosystems. From concept to App Store submission to a growing user base, we bring ideas to life with world-class execution.
            </p>
          </div>
        </div>
      </div>

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

      {/* What Went Into This */}
      <div className="py-16">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-10 text-center">What Went Into This</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-surface/50 border border-border rounded-xl p-6">
                <h3 className="text-xl font-bold mb-3">Native iOS Development</h3>
                <p className="text-text-secondary text-sm mb-4">
                  Built entirely in Swift with SwiftUI, leveraging the latest iOS frameworks for maximum performance and a native user experience. MapKit for GPS tracking, CoreLocation for precision, and CloudKit for seamless sync.
                </p>
              </div>
              <div className="bg-surface/50 border border-border rounded-xl p-6">
                <h3 className="text-xl font-bold mb-3">Full-Stack Web Platform</h3>
                <p className="text-text-secondary text-sm mb-4">
                  Companion web app at motorev.app built with modern web technologies. Real-time sync between mobile and web, responsive design, and a unified experience across all platforms.
                </p>
              </div>
              <div className="bg-surface/50 border border-border rounded-xl p-6">
                <h3 className="text-xl font-bold mb-3">Social Infrastructure</h3>
                <p className="text-text-secondary text-sm mb-4">
                  Custom-built social feed, user profiles, ride sharing, and community features. Real-time updates, image uploads, and engagement systems designed for the riding community.
                </p>
              </div>
              <div className="bg-surface/50 border border-border rounded-xl p-6">
                <h3 className="text-xl font-bold mb-3">Subscription & Payments</h3>
                <p className="text-text-secondary text-sm mb-4">
                  In-app purchase integration with StoreKit 2, subscription management, and seamless payment processing. Free tier with Pro upgrades at $9.99/mo or $99.99/yr.
                </p>
              </div>
            </div>
            <div className="mt-8 text-center">
              <p className="text-text-secondary mb-6">
                Want to build something like this? 47 Industries specializes in mobile apps, web platforms, and complete product ecosystems.
              </p>
              <Link
                href="/start-project"
                className="inline-flex items-center px-8 py-4 bg-accent text-white rounded-lg font-medium hover:bg-accent/90 transition-all"
              >
                Start Your Project
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Development Roadmap */}
      <div className="py-16">
        <div className="container mx-auto px-4 md:px-6">
          <h2 className="text-3xl font-bold mb-10 text-center">Development Roadmap</h2>
          <div className="max-w-2xl mx-auto space-y-0">
            {/* Milestone 1: iOS Development - COMPLETED */}
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
                <h3 className="text-lg md:text-xl font-bold mb-1">iOS Development</h3>
                <p className="text-text-secondary text-sm">Native iOS app built with Swift and SwiftUI</p>
              </div>
            </div>

            {/* Milestone 2: Public Beta - LIVE NOW */}
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
                <div className="text-sm text-green-500 font-semibold mb-1">LIVE NOW</div>
                <h3 className="text-lg md:text-xl font-bold mb-1">Public Beta</h3>
                <p className="text-text-secondary text-sm">Available now via TestFlight at motorevapp.com</p>
              </div>
            </div>

            {/* Milestone 3: App Store Submission - AWAITING APPROVAL */}
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
                <div className="text-sm text-accent font-semibold mb-1">AWAITING APPROVAL</div>
                <h3 className="text-lg md:text-xl font-bold mb-1">App Store Submission</h3>
                <p className="text-text-secondary text-sm">Submitted December 17, 2025 - pending Apple review</p>
              </div>
            </div>

            {/* Milestone 4: Android Development - Q1 2026 */}
            <div className="flex gap-4 md:gap-6">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-surface border border-border flex items-center justify-center text-text-secondary font-bold text-sm">
                  Q1
                </div>
                <div className="w-px h-16 bg-border"></div>
              </div>
              <div className="pb-8 pt-1">
                <div className="text-sm text-text-secondary font-semibold mb-1">Q1 2026</div>
                <h3 className="text-lg md:text-xl font-bold mb-1">Android Development</h3>
                <p className="text-text-secondary text-sm">Research and development for Android version</p>
              </div>
            </div>

            {/* Milestone 5: Android Beta - Q2-Q3 2026 */}
            <div className="flex gap-4 md:gap-6">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-surface border border-border flex items-center justify-center text-text-secondary font-bold text-xs">
                  Q2-Q3
                </div>
                <div className="w-px h-16 bg-border"></div>
              </div>
              <div className="pb-8 pt-1">
                <div className="text-sm text-text-secondary font-semibold mb-1">Q2-Q3 2026</div>
                <h3 className="text-lg md:text-xl font-bold mb-1">Android Beta</h3>
                <p className="text-text-secondary text-sm">Testing phase with Android users</p>
              </div>
            </div>

            {/* Milestone 6: Android Public Release - Q3-Q4 2026 */}
            <div className="flex gap-4 md:gap-6">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-surface border border-border flex items-center justify-center text-text-secondary font-bold text-xs">
                  Q3-Q4
                </div>
              </div>
              <div className="pt-1">
                <div className="text-sm text-text-secondary font-semibold mb-1">Q3-Q4 2026</div>
                <h3 className="text-lg md:text-xl font-bold mb-1">Android Public Release</h3>
                <p className="text-text-secondary text-sm">Available on Google Play Store</p>
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

      {/* MotoRev Merch Section */}
      <div className="py-16">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-2xl p-8 md:p-12">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="flex-1 text-center md:text-left">
                  <h2 className="text-2xl md:text-3xl font-bold mb-3">Rep the Ride</h2>
                  <p className="text-text-secondary mb-6">
                    Official MotoRev apparel for riders who live the lifestyle. Premium quality gear designed for the community, by the community.
                  </p>
                  <Link
                    href="/shop?type=apparel&brand=motorev"
                    className="inline-flex items-center px-6 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
                  >
                    Shop MotoRev Gear
                    <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </Link>
                </div>
                <div className="flex-shrink-0">
                  <div className="w-32 h-32 md:w-40 md:h-40 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                    <svg className="w-16 h-16 md:w-20 md:h-20 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Experience MotoRev Today</h2>
          <p className="text-lg text-text-secondary mb-8 max-w-2xl mx-auto">
            Join thousands of riders tracking their journeys. Try the iOS beta or explore the web app. This is what 47 Industries builds—powerful, meaningful software that brings communities together.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
            <a
              href="https://motorevapp.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-8 py-4 bg-accent text-white rounded-lg font-medium hover:bg-accent/90 transition-all"
            >
              Download iOS Beta
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </a>
            <a
              href="https://motorev.app"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-8 py-4 bg-surface border border-accent text-accent rounded-lg font-medium hover:bg-accent hover:text-white transition-all"
            >
              Try Web App
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
            </a>
          </div>
          <div className="flex justify-center">
            <Link
              href="/start-project"
              className="inline-flex items-center justify-center px-8 py-4 border border-border rounded-lg font-medium hover:bg-surface transition-colors"
            >
              Build Your Own Platform Like This
            </Link>
          </div>

          {/* Dedication */}
          <p className="mt-12 text-text-muted text-sm">
            Dedicated to the memory of Bryce Raiford. Ride safe.
          </p>
        </div>
      </div>
    </div>
  )
}
