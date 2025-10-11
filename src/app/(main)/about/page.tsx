export default function AboutPage() {
  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="max-w-4xl mx-auto mb-20">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">About 47 Industries</h1>
          <p className="text-2xl text-text-secondary leading-relaxed">
            We're a technology company focused on advanced manufacturing and digital innovation.
            From 3D printing to cutting-edge software development, we build solutions that matter.
          </p>
        </div>

        {/* Mission */}
        <div className="max-w-5xl mx-auto mb-20">
          <div className="grid lg:grid-cols-2 gap-16">
            <div>
              <h2 className="text-4xl font-bold mb-6">Our Mission</h2>
              <p className="text-text-secondary leading-relaxed mb-4">
                To bridge the gap between digital innovation and physical manufacturing, creating
                accessible, high-quality solutions for businesses and individuals.
              </p>
              <p className="text-text-secondary leading-relaxed">
                We believe in the power of technology to transform ideas into reality, whether
                that's a custom 3D printed part, a powerful mobile application, or a comprehensive
                web platform.
              </p>
            </div>
            <div>
              <h2 className="text-4xl font-bold mb-6">What We Do</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">3D Printing & Manufacturing</h3>
                  <p className="text-sm text-text-secondary">
                    From rapid prototyping to production runs, we deliver precision manufacturing at scale.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Web Development</h3>
                  <p className="text-sm text-text-secondary">
                    Modern, fast, and secure websites built with cutting-edge technologies.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">App Development</h3>
                  <p className="text-sm text-text-secondary">
                    Mobile and web applications powered by AI and built for scale.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Values */}
        <div className="max-w-5xl mx-auto mb-20 bg-surface rounded-3xl p-12">
          <h2 className="text-4xl font-bold mb-12 text-center">Our Values</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <h3 className="text-xl font-bold mb-3">Quality First</h3>
              <p className="text-text-secondary">
                Every project gets the attention and craftsmanship it deserves, no compromises.
              </p>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold mb-3">Innovation</h3>
              <p className="text-text-secondary">
                We stay at the forefront of technology to deliver modern solutions.
              </p>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold mb-3">Transparency</h3>
              <p className="text-text-secondary">
                Clear communication, honest timelines, and straightforward pricing.
              </p>
            </div>
          </div>
        </div>

        {/* MotoRev */}
        <div className="max-w-4xl mx-auto mb-20 border border-border rounded-3xl p-12">
          <div className="text-center">
            <div className="text-sm font-semibold text-accent mb-4">FEATURED PROJECT</div>
            <h2 className="text-4xl font-bold mb-6">MotoRev</h2>
            <p className="text-xl text-text-secondary mb-8">
              Our flagship mobile application for motorcycle enthusiasts. MotoRev represents
              everything we stand for: innovation, quality, and user-focused design.
            </p>
            <a
              href="https://motorevapp.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-8 py-4 bg-text-primary text-background rounded-lg font-medium hover:bg-text-secondary transition-all"
            >
              Learn More About MotoRev
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>

        {/* Contact CTA */}
        <div className="text-center py-16 border-t border-border">
          <h2 className="text-4xl font-bold mb-6">Work with us</h2>
          <p className="text-xl text-text-secondary mb-8 max-w-2xl mx-auto">
            Ready to start your project? We'd love to hear from you.
          </p>
          <a
            href="/contact"
            className="inline-flex items-center px-10 py-5 bg-text-primary text-background rounded-lg text-lg font-medium hover:bg-text-secondary transition-all"
          >
            Get in Touch
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  )
}

export const metadata = {
  title: 'About Us - 47 Industries',
  description: 'Learn about 47 Industries, our mission, and how we combine manufacturing and digital innovation.',
}
