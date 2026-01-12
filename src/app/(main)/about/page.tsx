export default function AboutPage() {
  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="max-w-4xl mx-auto mb-16">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">About 47 Industries</h1>
          <p className="text-xl md:text-2xl text-text-secondary leading-relaxed">
            We're a technology company focused on advanced manufacturing and digital innovation.
            From 3D printing to cutting-edge software development, we build solutions that matter.
          </p>
        </div>

        {/* Mission & What We Do */}
        <div className="max-w-5xl mx-auto mb-16">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Mission */}
            <div className="p-8 bg-surface border border-border rounded-2xl">
              <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
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

            {/* What We Do */}
            <div className="p-8 bg-surface border border-border rounded-2xl">
              <h2 className="text-3xl font-bold mb-6">What We Do</h2>
              <div className="space-y-6">
                <div className="p-4 bg-background rounded-xl border border-border">
                  <h3 className="font-bold mb-2">3D Printing & Manufacturing</h3>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    From rapid prototyping to production runs, we deliver precision manufacturing at scale.
                  </p>
                </div>
                <div className="p-4 bg-background rounded-xl border border-border">
                  <h3 className="font-bold mb-2">Web Development</h3>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    Modern, fast, and secure websites built with cutting-edge technologies.
                  </p>
                </div>
                <div className="p-4 bg-background rounded-xl border border-border">
                  <h3 className="font-bold mb-2">App Development</h3>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    Mobile and web applications powered by AI and built for scale.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tribute to Bryce */}
        <div className="max-w-5xl mx-auto mb-16">
          <div className="p-10 bg-gradient-to-br from-surface to-background border border-border rounded-2xl">
            <div className="text-center mb-10">
              <p className="text-sm font-semibold text-accent tracking-wider mb-4">IN MEMORY OF OUR FOUNDER</p>
              <h2 className="text-3xl md:text-4xl font-bold">Bryce Leone Raiford</h2>
              <p className="text-text-muted mt-2">August 9, 2000 - December 17, 2022</p>
            </div>

            <div className="grid lg:grid-cols-5 gap-10 items-start">
              {/* Photo */}
              <div className="lg:col-span-2 flex justify-center">
                <div className="relative">
                  <div className="w-64 h-64 md:w-72 md:h-72 rounded-2xl overflow-hidden border-2 border-border shadow-2xl">
                    <img
                      src="/bryce-raiford.jpg"
                      alt="Bryce Raiford - Founder of 47 Industries"
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                  <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-surface border border-border rounded-full">
                    <span className="text-sm font-medium text-text-secondary">Founder & Visionary</span>
                  </div>
                </div>
              </div>

              {/* Story */}
              <div className="lg:col-span-3 space-y-6">
                <div>
                  <h3 className="text-xl font-bold mb-3">The Visionary Who Started It All</h3>
                  <p className="text-text-secondary leading-relaxed">
                    Bryce Raiford was the founder of 47 Industries. A genius builder with a dream, he brought
                    a team together around his vision of turning ideas into reality. A brother, an innovator,
                    a leader - Bryce built something from nothing.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-bold mb-3">A New Chapter</h3>
                  <p className="text-text-secondary leading-relaxed">
                    When we lost Bryce on December 17, 2022, the team came together to found a new age of
                    47 Industries in his name. We made it official. We made it real. His company would
                    live on - not as a memory, but as a mission.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-bold mb-3">Three Years Later</h3>
                  <p className="text-text-secondary leading-relaxed">
                    Now we're building. MotoRev, born from Bryce's passion for motorcycles, carries a purpose:
                    to prevent what happened to him from happening to someone else. Every line of code honors
                    his memory.
                  </p>
                </div>

                <div className="pt-4 border-t border-border">
                  <p className="text-xl italic text-white mb-1">
                    "Failure is not an option."
                  </p>
                  <p className="text-sm text-text-muted">- Bryce Raiford</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Meet the Team */}
        <div className="max-w-5xl mx-auto mb-16">
          <div className="p-10 bg-surface border border-border rounded-2xl">
            <div className="text-center mb-10">
              <p className="text-sm font-semibold text-accent tracking-wider mb-4">THE PEOPLE BEHIND THE MISSION</p>
              <h2 className="text-3xl md:text-4xl font-bold">Meet the Team</h2>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Kyle */}
              <div className="p-6 bg-background border border-border rounded-xl text-center">
                <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  <span className="text-3xl font-bold text-white">K</span>
                </div>
                <h3 className="text-lg font-bold mb-1">Kyle Rivers</h3>
                <p className="text-sm text-accent mb-3">President</p>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Building the digital future of 47 Industries. From web platforms to mobile apps.
                </p>
              </div>

              {/* Dean */}
              <div className="p-6 bg-background border border-border rounded-xl text-center">
                <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                  <span className="text-3xl font-bold text-white">D</span>
                </div>
                <h3 className="text-lg font-bold mb-1">Dean</h3>
                <p className="text-sm text-accent mb-3">Chief Executive Officer</p>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Part of the original crew. Helping turn vision into reality.
                </p>
              </div>

              {/* Wesley */}
              <div className="p-6 bg-background border border-border rounded-xl text-center">
                <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                  <span className="text-3xl font-bold text-white">W</span>
                </div>
                <h3 className="text-lg font-bold mb-1">Wesley</h3>
                <p className="text-sm text-accent mb-3">Chief Product Officer</p>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Part of the original crew. Helping turn vision into reality.
                </p>
              </div>

              {/* Dylan */}
              <div className="p-6 bg-background border border-border rounded-xl text-center">
                <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                  <span className="text-3xl font-bold text-white">D</span>
                </div>
                <h3 className="text-lg font-bold mb-1">Dylan</h3>
                <p className="text-sm text-accent mb-3">Executive Chairman</p>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Part of the original crew. Helping turn vision into reality.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* The Journey */}
        <div className="max-w-5xl mx-auto mb-16">
          <div className="p-10 bg-surface border border-border rounded-2xl">
            <h2 className="text-3xl md:text-4xl font-bold mb-10 text-center">The Journey</h2>
            <div className="space-y-8">
              <div className="flex gap-6">
                <div className="flex-shrink-0 w-24 text-right">
                  <span className="text-sm font-bold text-accent">2022</span>
                </div>
                <div className="flex-1 pb-8 border-l-2 border-border pl-6 relative">
                  <div className="absolute w-3 h-3 bg-accent rounded-full -left-[7px] top-1"></div>
                  <h3 className="font-bold mb-2">The Beginning & The Loss</h3>
                  <p className="text-text-secondary text-sm">
                    Bryce founded 47 Industries and brought us together around his vision. On December 17, we lost him - but his dream would not die with him.
                  </p>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="flex-shrink-0 w-24 text-right">
                  <span className="text-sm font-bold text-accent">2023</span>
                </div>
                <div className="flex-1 pb-8 border-l-2 border-border pl-6 relative">
                  <div className="absolute w-3 h-3 bg-accent rounded-full -left-[7px] top-1"></div>
                  <h3 className="font-bold mb-2">The New Age</h3>
                  <p className="text-text-secondary text-sm">
                    The team founded a new age of 47 Industries in Bryce's name. We made it official. We made it real.
                  </p>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="flex-shrink-0 w-24 text-right">
                  <span className="text-sm font-bold text-accent">2024</span>
                </div>
                <div className="flex-1 pb-8 border-l-2 border-border pl-6 relative">
                  <div className="absolute w-3 h-3 bg-accent rounded-full -left-[7px] top-1"></div>
                  <h3 className="font-bold mb-2">The Learning</h3>
                  <p className="text-text-secondary text-sm">
                    The team learned everything needed to build. Day jobs to pay the bills, nights and weekends to develop skills. Failures became lessons.
                  </p>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="flex-shrink-0 w-24 text-right">
                  <span className="text-sm font-bold text-accent">2025</span>
                </div>
                <div className="flex-1 pb-8 border-l-2 border-border pl-6 relative">
                  <div className="absolute w-3 h-3 bg-accent rounded-full -left-[7px] top-1"></div>
                  <h3 className="font-bold mb-2">The Building</h3>
                  <p className="text-text-secondary text-sm">
                    Over 5,000 commits to production. MotoRev, BookFade, and a rebuilt 47 Industries. The team built with purpose, honoring Bryce with every line of code.
                  </p>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="flex-shrink-0 w-24 text-right">
                  <span className="text-sm font-bold text-green-500">2026</span>
                </div>
                <div className="flex-1 pl-6 relative">
                  <div className="absolute w-3 h-3 bg-green-500 rounded-full -left-[7px] top-1"></div>
                  <h3 className="font-bold mb-2">The Shipping</h3>
                  <p className="text-text-secondary text-sm">
                    This is the year 47 Industries ships. Bryce's company is ready for the world.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Values */}
        <div className="max-w-5xl mx-auto mb-16">
          <div className="p-10 bg-surface border border-border rounded-2xl">
            <h2 className="text-3xl md:text-4xl font-bold mb-10 text-center">Our Values</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="p-6 bg-background border border-border rounded-xl">
                <h3 className="text-lg font-bold mb-3 text-center">Quality First</h3>
                <p className="text-text-secondary text-sm text-center leading-relaxed">
                  Every project gets the attention and craftsmanship it deserves, no compromises.
                </p>
              </div>
              <div className="p-6 bg-background border border-border rounded-xl">
                <h3 className="text-lg font-bold mb-3 text-center">Innovation</h3>
                <p className="text-text-secondary text-sm text-center leading-relaxed">
                  We stay at the forefront of technology to deliver modern solutions.
                </p>
              </div>
              <div className="p-6 bg-background border border-border rounded-xl">
                <h3 className="text-lg font-bold mb-3 text-center">Transparency</h3>
                <p className="text-text-secondary text-sm text-center leading-relaxed">
                  Clear communication, honest timelines, and straightforward pricing.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* MotoRev */}
        <div className="max-w-4xl mx-auto mb-16">
          <div className="p-10 bg-surface border border-border rounded-2xl">
            <div className="text-center">
              <div className="text-xs font-semibold text-accent mb-4 tracking-wider">FEATURED PROJECT</div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">MotoRev</h2>
              <p className="text-lg text-text-secondary mb-8 leading-relaxed max-w-2xl mx-auto">
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
        </div>

        {/* Contact CTA */}
        <div className="max-w-4xl mx-auto">
          <div className="p-10 bg-surface border border-border rounded-2xl text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Work with us</h2>
            <p className="text-lg text-text-secondary mb-8 max-w-2xl mx-auto leading-relaxed">
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
    </div>
  )
}

export const metadata = {
  title: 'About Us - 47 Industries',
  description: 'Learn about 47 Industries, our mission, and how we combine manufacturing and digital innovation.',
}
