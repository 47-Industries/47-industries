import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-surface to-background" />

        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-6xl mx-auto">
            <div className="space-y-6 mb-12">
              <h1 className="text-5xl sm:text-7xl md:text-9xl font-bold tracking-tight leading-none">
                47 Industries
              </h1>
              <p className="text-xl sm:text-2xl md:text-3xl text-text-secondary font-light max-w-3xl">
                Advanced manufacturing and digital innovation
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mb-20">
              <Link
                href="/shop"
                className="group px-8 py-4 bg-text-primary text-background rounded-lg font-medium hover:bg-text-secondary transition-all inline-flex items-center justify-center"
              >
                Browse Products
                <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <Link
                href="/start-project"
                className="px-8 py-4 border border-border rounded-lg font-medium hover:bg-surface transition-all inline-flex items-center justify-center"
              >
                Get Started
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 pt-12 border-t border-border">
              <div>
                <div className="text-3xl md:text-4xl font-bold mb-1">Fast</div>
                <div className="text-text-secondary text-xs md:text-sm">Rapid Turnaround</div>
              </div>
              <div>
                <div className="text-3xl md:text-4xl font-bold mb-1">Precise</div>
                <div className="text-text-secondary text-xs md:text-sm">High Quality Output</div>
              </div>
              <div>
                <div className="text-3xl md:text-4xl font-bold mb-1">Scalable</div>
                <div className="text-text-secondary text-xs md:text-sm">From Prototype to Production</div>
              </div>
              <div>
                <div className="text-3xl md:text-4xl font-bold mb-1">Expert</div>
                <div className="text-text-secondary text-xs md:text-sm">Dedicated Support</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 md:py-32 bg-surface">
        <div className="container mx-auto px-6">
          <div className="mb-12 md:mb-20">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">Services</h2>
            <p className="text-lg md:text-xl text-text-secondary max-w-2xl">
              Comprehensive solutions for modern manufacturing and development
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-4 md:gap-6">
            {/* 3D Printing */}
            <Link href="/shop" className="group p-6 md:p-10 bg-background border border-border rounded-2xl hover:border-text-primary transition-all">
              <h3 className="text-2xl md:text-3xl font-bold mb-3">3D Printed Products</h3>
              <p className="text-text-secondary mb-6 leading-relaxed text-sm md:text-base">
                High-quality 3D printed items produced at scale. Browse our catalog of ready-to-ship products.
              </p>
              <div className="text-text-primary group-hover:translate-x-2 transition-transform inline-flex items-center text-sm md:text-base">
                Explore catalog
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </Link>

            {/* Custom Manufacturing */}
            <Link href="/custom-3d-printing" className="group p-6 md:p-10 bg-background border border-border rounded-2xl hover:border-text-primary transition-all">
              <h3 className="text-2xl md:text-3xl font-bold mb-3">Custom Manufacturing</h3>
              <p className="text-text-secondary mb-6 leading-relaxed text-sm md:text-base">
                Upload your designs and receive instant quotes. From prototypes to production runs.
              </p>
              <div className="text-text-primary group-hover:translate-x-2 transition-transform inline-flex items-center text-sm md:text-base">
                Request quote
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </Link>

            {/* Web Development */}
            <Link href="/web-development" className="group p-6 md:p-10 bg-background border border-border rounded-2xl hover:border-text-primary transition-all">
              <h3 className="text-2xl md:text-3xl font-bold mb-3">Web Development</h3>
              <p className="text-text-secondary mb-6 leading-relaxed text-sm md:text-base">
                Custom websites built with modern technologies. Fast, secure, and beautifully designed.
              </p>
              <div className="text-text-primary group-hover:translate-x-2 transition-transform inline-flex items-center text-sm md:text-base">
                View services
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </Link>

            {/* App Development */}
            <Link href="/app-development" className="group p-6 md:p-10 bg-background border border-border rounded-2xl hover:border-text-primary transition-all">
              <h3 className="text-2xl md:text-3xl font-bold mb-3">App Development</h3>
              <p className="text-text-secondary mb-6 leading-relaxed text-sm md:text-base">
                AI-driven applications that solve real problems. Innovation meets functionality.
              </p>
              <div className="text-text-primary group-hover:translate-x-2 transition-transform inline-flex items-center text-sm md:text-base">
                Learn more
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* MotoRev Section */}
      <section className="py-16 md:py-32">
        <div className="container mx-auto px-6">
          <div className="max-w-5xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-8 md:gap-12 items-center">
              <div>
                <div className="text-xs md:text-sm font-semibold text-accent mb-4">FEATURED PROJECT</div>
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">MotoRev</h2>
                <p className="text-lg md:text-xl text-text-secondary mb-8 leading-relaxed">
                  A comprehensive mobile application for motorcycle enthusiasts.
                  Track your rides, connect with the community, and manage your garage.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link
                    href="/motorev"
                    className="px-6 py-3 border border-border rounded-lg hover:bg-surface transition-all inline-flex items-center justify-center"
                  >
                    Learn more
                  </Link>
                  <a
                    href="https://motorevapp.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 py-3 bg-text-primary text-background rounded-lg hover:bg-text-secondary transition-all inline-flex items-center justify-center"
                  >
                    Visit MotoRev
                    <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              </div>
              <div className="bg-surface rounded-2xl p-6 md:p-12 border border-border">
                <div className="space-y-4 md:space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-2 h-2 rounded-full bg-accent mt-2" />
                    <div>
                      <div className="font-semibold mb-1">GPS Ride Tracking</div>
                      <div className="text-text-secondary text-sm">Advanced tracking with detailed analytics</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-2 h-2 rounded-full bg-accent mt-2" />
                    <div>
                      <div className="font-semibold mb-1">Rider Community</div>
                      <div className="text-text-secondary text-sm">Connect with fellow motorcycle enthusiasts</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-2 h-2 rounded-full bg-accent mt-2" />
                    <div>
                      <div className="font-semibold mb-1">Safety Features</div>
                      <div className="text-text-secondary text-sm">Crash detection and emergency contacts</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-2 h-2 rounded-full bg-accent mt-2" />
                    <div>
                      <div className="font-semibold mb-1">Garage Management</div>
                      <div className="text-text-secondary text-sm">Track maintenance and modifications</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-32 bg-surface">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Ready to get started?
            </h2>
            <p className="text-lg md:text-xl text-text-secondary mb-10 max-w-2xl mx-auto">
              Whether you need custom manufacturing, a new website, or an innovative app,
              we're here to help bring your vision to life.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center px-10 py-5 bg-text-primary text-background rounded-lg text-lg font-medium hover:bg-text-secondary transition-all"
            >
              Contact us
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
