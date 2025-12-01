import Link from 'next/link'
import { notFound } from 'next/navigation'
import { isFeatureEnabled } from '@/lib/features'

export default async function MotoRevPage() {
  // Check if MotoRev page is enabled
  const enabled = await isFeatureEnabled('motorevEnabled')
  if (!enabled) {
    notFound()
  }
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
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-6">
        {/* Hero */}
        <div className="max-w-5xl mx-auto text-center mb-20">
          <div className="text-sm font-semibold text-accent mb-4">POWERED BY 47 INDUSTRIES</div>
          <h1 className="text-6xl md:text-7xl font-bold mb-6">MotoRev</h1>
          <p className="text-2xl text-text-secondary mb-8">
            Your ride, your way. The ultimate companion for motorcycle enthusiasts.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <a
              href="https://motorevapp.com"
              target="_blank"
              rel="noopener noreferrer"
              className="px-10 py-5 bg-text-primary text-background rounded-lg text-lg font-medium hover:bg-text-secondary transition-all inline-flex items-center justify-center"
            >
              Visit MotoRevApp.com
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
            <a
              href="https://apps.apple.com"
              target="_blank"
              rel="noopener noreferrer"
              className="px-10 py-5 border border-border rounded-lg text-lg font-medium hover:bg-surface transition-all"
            >
              Download on App Store
            </a>
          </div>
          <p className="text-sm text-text-secondary">
            Launching October 17, 2025 • iOS first, Android coming Q1 2026
          </p>
        </div>

        {/* Features Grid */}
        <div className="mb-20">
          <h2 className="text-4xl font-bold mb-12 text-center">Features</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div key={feature.title} className="border border-border rounded-2xl p-8">
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-text-secondary">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing */}
        <div className="mb-20 bg-surface rounded-3xl p-12">
          <h2 className="text-4xl font-bold mb-12 text-center">Simple Pricing</h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="border border-border rounded-2xl p-8 bg-background">
              <h3 className="text-2xl font-bold mb-2">Free</h3>
              <div className="text-4xl font-bold mb-4">$0</div>
              <p className="text-text-secondary mb-6">Perfect for casual riders</p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center text-sm">
                  <svg className="w-5 h-5 text-accent mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Basic ride tracking
                </li>
                <li className="flex items-center text-sm">
                  <svg className="w-5 h-5 text-accent mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Community access
                </li>
                <li className="flex items-center text-sm">
                  <svg className="w-5 h-5 text-accent mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Up to 3 motorcycles
                </li>
              </ul>
            </div>

            <div className="border-2 border-accent rounded-2xl p-8 bg-accent/5 relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 px-3 py-1 bg-accent text-white text-xs font-semibold rounded-full">
                MOST POPULAR
              </div>
              <h3 className="text-2xl font-bold mb-2">Pro</h3>
              <div className="text-4xl font-bold mb-1">$4.99<span className="text-lg text-text-secondary">/mo</span></div>
              <div className="text-sm text-text-secondary mb-4">or $49.99/year (save 17%)</div>
              <p className="text-text-secondary mb-6">For serious riders</p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center text-sm">
                  <svg className="w-5 h-5 text-accent mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Advanced analytics
                </li>
                <li className="flex items-center text-sm">
                  <svg className="w-5 h-5 text-accent mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Unlimited ride storage
                </li>
                <li className="flex items-center text-sm">
                  <svg className="w-5 h-5 text-accent mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Priority support
                </li>
                <li className="flex items-center text-sm">
                  <svg className="w-5 h-5 text-accent mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Unlimited motorcycles
                </li>
                <li className="flex items-center text-sm">
                  <svg className="w-5 h-5 text-accent mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Export data & reports
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Roadmap */}
        <div className="mb-20">
          <h2 className="text-4xl font-bold mb-12 text-center">Development Roadmap</h2>
          <div className="max-w-3xl mx-auto space-y-8">
            <div className="flex gap-6">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center text-white font-bold">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                </div>
                <div className="w-px h-full bg-border"></div>
              </div>
              <div className="pb-8">
                <div className="text-sm text-accent font-semibold mb-2">COMPLETED</div>
                <h3 className="text-xl font-bold mb-2">iOS Beta Testing</h3>
                <p className="text-text-secondary">Internal testing and feedback collection complete</p>
              </div>
            </div>

            <div className="flex gap-6">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center text-white font-bold">
                  →
                </div>
                <div className="w-px h-full bg-border"></div>
              </div>
              <div className="pb-8">
                <div className="text-sm text-accent font-semibold mb-2">OCTOBER 17, 2025</div>
                <h3 className="text-xl font-bold mb-2">iOS Public Launch</h3>
                <p className="text-text-secondary">Available on Apple App Store</p>
              </div>
            </div>

            <div className="flex gap-6">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-border flex items-center justify-center text-text-secondary font-bold">
                  ·
                </div>
              </div>
              <div>
                <div className="text-sm text-text-secondary font-semibold mb-2">Q1 2026</div>
                <h3 className="text-xl font-bold mb-2">Android Release</h3>
                <p className="text-text-secondary">Coming to Google Play Store</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center py-16 border-t border-border">
          <h2 className="text-4xl font-bold mb-6">Ready to ride?</h2>
          <p className="text-xl text-text-secondary mb-8 max-w-2xl mx-auto">
            Join thousands of riders tracking their adventures with MotoRev
          </p>
          <a
            href="https://motorevapp.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-10 py-5 bg-text-primary text-background rounded-lg text-lg font-medium hover:bg-text-secondary transition-all"
          >
            Learn More at MotoRevApp.com
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  )
}

export const metadata = {
  title: 'MotoRev - Motorcycle Tracking App by 47 Industries',
  description: 'Track your rides, connect with the community, and manage your garage. The ultimate companion for motorcycle enthusiasts.',
}
