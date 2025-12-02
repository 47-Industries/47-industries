import Link from 'next/link'
import { notFound } from 'next/navigation'
import { isFeatureEnabled } from '@/lib/features'

export default async function WebDevelopmentPage() {
  // Check if web dev services are enabled
  const enabled = await isFeatureEnabled('webDevServicesEnabled')
  if (!enabled) {
    notFound()
  }
  const packages = [
    {
      name: 'Starter',
      price: '$2,500',
      description: 'Perfect for small businesses and startups',
      features: [
        'Up to 5 pages',
        'Responsive design',
        'Basic SEO',
        'Contact form',
        'Fast hosting setup',
        '1 month support',
      ],
    },
    {
      name: 'Professional',
      price: '$5,000',
      description: 'Advanced features for growing businesses',
      features: [
        'Up to 15 pages',
        'Custom design',
        'Advanced SEO',
        'CMS integration',
        'E-commerce ready',
        'Analytics setup',
        '3 months support',
      ],
      popular: true,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      description: 'Full-scale web applications',
      features: [
        'Unlimited pages',
        'Custom features',
        'Advanced integrations',
        'Performance optimization',
        'Security hardening',
        'Dedicated support',
        '12 months support',
      ],
    },
  ]

  const technologies = [
    'Next.js',
    'React',
    'TypeScript',
    'Tailwind CSS',
    'Node.js',
    'PostgreSQL',
    'Prisma',
    'Stripe',
    'AWS',
    'Vercel',
    'Railway',
    'Docker',
  ]

  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="max-w-4xl mx-auto mb-16 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">Web Development</h1>
          <p className="text-xl text-text-secondary">
            Custom websites and web applications built with modern technologies.
            Fast, secure, and scalable solutions tailored to your needs.
          </p>
        </div>

        {/* Pricing Packages */}
        <div className="mb-20">
          <h2 className="text-4xl font-bold mb-12 text-center">Pricing Packages</h2>
          <div className="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {packages.map((pkg) => (
              <div
                key={pkg.name}
                className={`border rounded-2xl p-8 ${
                  pkg.popular
                    ? 'border-accent bg-accent/5'
                    : 'border-border'
                }`}
              >
                {pkg.popular && (
                  <div className="inline-block px-3 py-1 bg-accent text-white text-xs font-semibold rounded-full mb-4">
                    MOST POPULAR
                  </div>
                )}
                <h3 className="text-2xl font-bold mb-2">{pkg.name}</h3>
                <div className="text-4xl font-bold mb-2">{pkg.price}</div>
                <p className="text-text-secondary text-sm mb-6">{pkg.description}</p>

                <ul className="space-y-3 mb-8">
                  {pkg.features.map((feature) => (
                    <li key={feature} className="flex items-start text-sm">
                      <svg className="w-5 h-5 text-accent mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link
                  href="/start-project"
                  className={`block w-full py-3 text-center rounded-lg font-medium transition-all ${
                    pkg.popular
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

        {/* Our Process */}
        <div className="mb-20 bg-surface rounded-3xl p-12">
          <h2 className="text-4xl font-bold mb-12 text-center">Our Process</h2>
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="text-5xl font-bold text-accent mb-4">01</div>
              <h3 className="text-xl font-bold mb-3">Discovery</h3>
              <p className="text-text-secondary">
                We learn about your business, goals, and target audience to create the perfect strategy.
              </p>
            </div>
            <div>
              <div className="text-5xl font-bold text-accent mb-4">02</div>
              <h3 className="text-xl font-bold mb-3">Design</h3>
              <p className="text-text-secondary">
                Custom mockups and prototypes that reflect your brand and engage your users.
              </p>
            </div>
            <div>
              <div className="text-5xl font-bold text-accent mb-4">03</div>
              <h3 className="text-xl font-bold mb-3">Development</h3>
              <p className="text-text-secondary">
                Clean, efficient code built with modern frameworks for optimal performance.
              </p>
            </div>
            <div>
              <div className="text-5xl font-bold text-accent mb-4">04</div>
              <h3 className="text-xl font-bold mb-3">Launch</h3>
              <p className="text-text-secondary">
                Deployment, testing, and ongoing support to ensure your success.
              </p>
            </div>
          </div>
        </div>

        {/* Technologies */}
        <div className="mb-20">
          <h2 className="text-4xl font-bold mb-8 text-center">Technologies We Use</h2>
          <p className="text-center text-text-secondary mb-12 max-w-2xl mx-auto">
            We build with cutting-edge technologies to ensure your website is fast,
            secure, and future-proof.
          </p>
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
  title: 'Web Development Services - 47 Industries',
  description: 'Professional web development with modern technologies. Custom websites and web applications.',
}
