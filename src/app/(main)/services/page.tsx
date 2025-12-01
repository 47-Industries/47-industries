import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { isFeatureEnabled } from '@/lib/features'

const CATEGORY_LABELS: Record<string, string> = {
  WEB_DEVELOPMENT: 'Web Development',
  IOS_APP: 'iOS App',
  ANDROID_APP: 'Android App',
  CROSS_PLATFORM_APP: 'Cross-Platform App',
  DESKTOP_APP: 'Desktop App',
  THREE_D_PRINTING: '3D Printing',
}

export default async function ServicesPage() {
  // Check if services are enabled
  const webEnabled = await isFeatureEnabled('webDevServicesEnabled')
  const appEnabled = await isFeatureEnabled('appDevServicesEnabled')

  if (!webEnabled && !appEnabled) {
    notFound()
  }

  // Fetch packages and projects from database
  const [packages, projects] = await Promise.all([
    prisma.servicePackage.findMany({
      where: { isActive: true },
      orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }],
    }),
    prisma.serviceProject.findMany({
      where: { isActive: true },
      orderBy: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }],
      take: 6,
    }),
  ])

  // Group packages by category
  const packagesByCategory = packages.reduce((acc, pkg) => {
    const cat = pkg.category
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(pkg)
    return acc
  }, {} as Record<string, typeof packages>)

  const technologies = [
    'Next.js', 'React', 'React Native', 'Swift', 'Kotlin',
    'TypeScript', 'Node.js', 'PostgreSQL', 'Prisma',
    'Stripe', 'AWS', 'Firebase', 'Tailwind CSS',
  ]

  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="max-w-4xl mx-auto mb-16 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">Our Services</h1>
          <p className="text-xl text-text-secondary">
            From websites to mobile apps, we build modern digital solutions
            tailored to your business needs.
          </p>
        </div>

        {/* Service Categories */}
        {Object.entries(packagesByCategory).length > 0 ? (
          Object.entries(packagesByCategory).map(([category, categoryPackages]) => (
            <div key={category} className="mb-20">
              <h2 className="text-3xl font-bold mb-8">
                {CATEGORY_LABELS[category] || category}
              </h2>
              <div className="grid lg:grid-cols-3 gap-8">
                {categoryPackages.map((pkg) => (
                  <div
                    key={pkg.id}
                    className={`border rounded-2xl p-8 ${
                      pkg.isPopular
                        ? 'border-accent bg-accent/5'
                        : 'border-border'
                    }`}
                  >
                    {pkg.isPopular && (
                      <div className="inline-block px-3 py-1 bg-accent text-white text-xs font-semibold rounded-full mb-4">
                        {pkg.badge || 'POPULAR'}
                      </div>
                    )}
                    <h3 className="text-2xl font-bold mb-2">{pkg.name}</h3>
                    <div className="text-4xl font-bold mb-2">
                      {pkg.priceDisplay || (pkg.price ? `$${Number(pkg.price).toLocaleString()}` : 'Custom')}
                    </div>
                    {pkg.priceNote && (
                      <p className="text-text-secondary text-xs mb-2">{pkg.priceNote}</p>
                    )}
                    <p className="text-text-secondary text-sm mb-6">{pkg.shortDesc}</p>

                    {/* Features */}
                    <ul className="space-y-3 mb-8">
                      {(pkg.features as string[])?.slice(0, 7).map((feature, i) => (
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
                      href={`/contact?service=${pkg.slug}`}
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
          ))
        ) : (
          /* Fallback if no packages in database */
          <div className="mb-20 text-center py-12 border border-border rounded-2xl">
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
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.slug}`}
                  className="group border border-border rounded-2xl overflow-hidden hover:border-accent/50 transition-all"
                >
                  <div className="aspect-video bg-surface-elevated flex items-center justify-center relative overflow-hidden">
                    {project.thumbnailUrl ? (
                      <img
                        src={project.thumbnailUrl}
                        alt={project.title}
                        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <span className="text-4xl">🖼️</span>
                    )}
                    {project.isFeatured && (
                      <div className="absolute top-3 right-3 px-2 py-1 bg-yellow-500/90 text-black text-xs font-semibold rounded">
                        Featured
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <div className="text-xs text-accent font-medium mb-2">
                      {CATEGORY_LABELS[project.category] || project.category}
                    </div>
                    <h3 className="text-xl font-bold mb-2 group-hover:text-accent transition-colors">
                      {project.title}
                    </h3>
                    <p className="text-text-secondary text-sm">{project.clientName}</p>
                  </div>
                </Link>
              ))}
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

export const metadata = {
  title: 'Services - 47 Industries',
  description: 'Web development, mobile apps, and custom software solutions. View our service packages and portfolio.',
}
