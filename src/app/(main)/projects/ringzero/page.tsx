import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function generateMetadata() {
  const project = await prisma.serviceProject.findFirst({
    where: { slug: 'ringzero' },
    select: { title: true, description: true },
  })

  return {
    title: project ? `${project.title} - 47 Industries` : 'RingZero - AI Receptionist | 47 Industries',
    description: project?.description?.slice(0, 160) || 'AI receptionist that answers every call 24/7, captures leads, books appointments, and texts you instantly.',
  }
}

export default async function RingZeroPage() {
  const project = await prisma.serviceProject.findFirst({
    where: { slug: 'ringzero' },
  })

  if (!project || !project.isActive) {
    notFound()
  }

  const technologies = (project.technologies as string[]) || []
  const categories = (project.categories as string[]) || []
  const displayCategories = categories.length > 0 ? categories : [project.category]

  // Key Features (for custom section below)
  const features = [
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      title: 'Instant Answer',
      description: 'Every call answered in under a second. No hold music. No voicemail. Your customers get a real conversation immediately.',
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
      ),
      title: 'Natural Voice AI',
      description: 'Sounds like a real person having a natural conversation. Professional, friendly, and perfectly on-brand every single time.',
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
        </svg>
      ),
      title: 'Lead Capture + Alerts',
      description: 'Captures name, phone, address, and requirements. Instant SMS and email alerts sent to you the moment a call ends.',
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      title: 'Appointment Booking',
      description: 'Syncs with Google Calendar, Calendly, or any booking system. AI checks availability and books appointments in real-time.',
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      title: 'Recordings + Transcripts',
      description: 'Every call recorded and transcribed automatically. Review conversations anytime, search transcripts, track performance.',
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
        </svg>
      ),
      title: 'CRM + Zapier',
      description: 'Auto-sync leads to any CRM. Connect 5,000+ apps via Zapier. Webhooks and API for custom integrations.',
    },
  ]

  // Problem stats
  const problemStats = [
    { stat: '62%', title: 'Won\'t leave voicemail', desc: 'Callers just call the next business. If you don\'t answer, you lose.' },
    { stat: '85%', title: 'Won\'t call back', desc: 'First business to answer wins the job. Every single time.' },
    { stat: '$10K+', title: 'Lost monthly', desc: 'Average home service business loses $10K+ monthly to missed calls.' },
    { stat: '$35K', title: 'Receptionist cost', desc: 'Salary, benefits, training, sick days. AI costs a fraction with no days off.' },
  ]

  // Integrations
  const integrations = ['Google Calendar', 'SMS', 'Email', 'Webhooks', 'Zapier', 'Any CRM', 'Custom API']

  return (
    <>
      {/* Custom Brand Color Styles - RingZero Cyan (#00d4ff) */}
      {project.accentColor && (
        <style dangerouslySetInnerHTML={{
          __html: `
            main .text-accent { color: ${project.accentColor} !important; }
            main .bg-accent { background-color: ${project.accentColor} !important; }
            main .bg-accent\\/10 { background-color: ${project.accentColor}1a !important; }
            main .bg-accent\\/5 { background-color: ${project.accentColor}0d !important; }
            main .border-accent { border-color: ${project.accentColor} !important; }
            main .border-accent\\/20 { border-color: ${project.accentColor}33 !important; }
            main .border-accent\\/30 { border-color: ${project.accentColor}4d !important; }
            main .hover\\:bg-accent\\/90:hover { background-color: ${project.accentColor}e6 !important; }
            main .ring-accent\\/50 { --tw-ring-color: ${project.accentColor}80 !important; }
            main .from-accent { --tw-gradient-from: ${project.accentColor} !important; }
            main .to-accent { --tw-gradient-to: ${project.accentColor} !important; }
          `
        }} />
      )}
      <div className="min-h-screen">
        {/* ============================================ */}
        {/* STANDARD TEMPLATE: Hero Section */}
        {/* ============================================ */}
        <div className="pt-20 pb-12 md:pt-24 md:pb-16">
          <div className="container mx-auto px-4 md:px-6">
            <div className="mb-6">
              <Link href="/services" className="text-sm text-text-secondary hover:text-accent transition-colors">
                ← Back to Services
              </Link>
            </div>

            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
              {/* Left: Visual - Image or Icon Placeholder */}
              <div className="order-2 lg:order-1">
                {project.thumbnailUrl ? (
                  <div className="rounded-xl overflow-hidden bg-surface inline-block">
                    <img
                      src={project.thumbnailUrl}
                      alt={project.title}
                      className="w-auto h-auto max-w-full max-h-[450px] object-contain"
                    />
                  </div>
                ) : (
                  /* Icon-based visual when no image */
                  <div className="bg-gradient-to-br from-surface to-surface-elevated border border-border rounded-2xl p-8 md:p-12">
                    {/* Large product icon */}
                    <div className="flex justify-center mb-8">
                      <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-accent/10 border-2 border-accent/30 flex items-center justify-center">
                        <svg className="w-12 h-12 md:w-16 md:h-16 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      </div>
                    </div>
                    {/* Quick stats grid */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-background/50 rounded-lg p-4 text-center">
                        <div className="text-2xl md:text-3xl font-bold text-accent mb-1">99.7%</div>
                        <div className="text-xs text-text-secondary">Calls Captured</div>
                      </div>
                      <div className="bg-background/50 rounded-lg p-4 text-center">
                        <div className="text-2xl md:text-3xl font-bold text-accent mb-1">24/7</div>
                        <div className="text-xs text-text-secondary">Always On</div>
                      </div>
                      <div className="bg-background/50 rounded-lg p-4 text-center">
                        <div className="text-2xl md:text-3xl font-bold text-accent mb-1">&lt;1s</div>
                        <div className="text-xs text-text-secondary">Answer Time</div>
                      </div>
                      <div className="bg-background/50 rounded-lg p-4 text-center">
                        <div className="text-2xl md:text-3xl font-bold text-green-400 mb-1">$497</div>
                        <div className="text-xs text-text-secondary">/month</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right: Text Content */}
              <div className="order-1 lg:order-2">
                {/* Category tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {displayCategories.map((cat) => (
                    <span
                      key={cat}
                      className="inline-block px-3 py-1 bg-accent/10 text-accent text-sm font-medium rounded-full"
                    >
                      {cat.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>

                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">{project.title}</h1>

                {/* Tagline */}
                <p className="text-xl text-accent font-medium mb-4">Never Miss Another Call</p>

                {/* Client info */}
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

                {/* Description */}
                <p className="text-text-secondary mb-6">
                  {project.description}
                </p>

                {/* Tech tags */}
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
                  <Link
                    href="/services/inquiry?type=AI_SOLUTIONS&product=ringzero"
                    className="inline-flex items-center px-5 py-2.5 bg-accent text-black rounded-lg font-medium hover:bg-accent/90 transition-colors text-sm"
                  >
                    Get Free Demo
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </Link>
                  {project.liveUrl && (
                    <a
                      href={project.liveUrl}
                      className="inline-flex items-center px-5 py-2.5 border border-border rounded-lg font-medium hover:bg-surface transition-colors text-sm"
                    >
                      Try Demo Call
                      <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================ */}
        {/* STANDARD TEMPLATE: Challenge / Solution / Results */}
        {/* ============================================ */}
        {(project.challenge || project.solution || project.results) && (
          <div className="py-12 bg-surface/30">
            <div className="container mx-auto px-4 md:px-6">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                {project.challenge && (
                  <div className="bg-background/50 rounded-xl p-6">
                    <h2 className="text-lg font-bold mb-3">The Challenge</h2>
                    <p className="text-text-secondary text-sm leading-relaxed">{project.challenge}</p>
                  </div>
                )}
                {project.solution && (
                  <div className="bg-background/50 rounded-xl p-6">
                    <h2 className="text-lg font-bold mb-3">Our Solution</h2>
                    <p className="text-text-secondary text-sm leading-relaxed">{project.solution}</p>
                  </div>
                )}
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

        {/* ============================================ */}
        {/* CUSTOM CONTENT: RingZero-specific sections below */}
        {/* ============================================ */}

        {/* Try Demo Section */}
        <div className="py-16 bg-gradient-to-b from-background to-surface/20">
          <div className="container mx-auto px-4 md:px-6">
            <div className="max-w-2xl mx-auto text-center">
              <p className="text-accent text-sm font-medium uppercase tracking-wider mb-4">Try It Yourself</p>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Call Our AI Right Now</h2>
              <p className="text-text-secondary mb-8">
                Experience the same enterprise-grade AI voice technology we deploy for our clients.
                Have a real conversation - ask questions, book an appointment, see how natural it sounds.
              </p>

              <div className="bg-surface border-2 border-accent/30 rounded-2xl p-8 md:p-12">
                <a
                  href="tel:+14159694084"
                  className="text-3xl md:text-4xl font-bold text-accent hover:text-white transition-colors"
                >
                  (415) 969-4084
                </a>
                <p className="text-text-secondary text-sm mt-4 mb-6">Tap to call or dial from your phone</p>

                <div className="flex flex-wrap justify-center gap-2 text-xs">
                  <span className="px-3 py-1 bg-surface-elevated border border-border rounded-full">Powered by Atlas AI</span>
                  <span className="px-3 py-1 bg-surface-elevated border border-border rounded-full">Vapi</span>
                  <span className="px-3 py-1 bg-surface-elevated border border-border rounded-full">Claude AI</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* The Problem Section */}
        <div className="py-20 bg-surface/30">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-16">
              <p className="text-red-400 text-sm font-medium uppercase tracking-wider mb-4">The Problem</p>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">You're Losing Money Every Day</h2>
              <p className="text-lg text-text-secondary max-w-2xl mx-auto">
                While you're on a job, your phone is ringing. Those unanswered calls are walking straight to your competitors.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {problemStats.map((item, i) => (
                <div key={i} className="bg-surface border border-border rounded-xl p-6 hover:border-red-400/50 transition-colors">
                  <div className="text-3xl font-bold text-red-400 mb-2">{item.stat}</div>
                  <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                  <p className="text-text-secondary text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="py-20">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-16">
              <p className="text-accent text-sm font-medium uppercase tracking-wider mb-4">Features</p>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything You Need</h2>
              <p className="text-lg text-text-secondary max-w-2xl mx-auto">
                Powerful AI capabilities that connect seamlessly with your existing tools.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, i) => (
                <div key={i} className="bg-surface border border-border rounded-xl p-8 hover:border-accent/50 transition-all">
                  <div className="text-accent mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-text-secondary">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Integrations */}
        <div className="py-16 bg-surface/30">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-4">Connects With Your Tools</h2>
            </div>
            <div className="flex flex-wrap justify-center gap-3 max-w-3xl mx-auto">
              {integrations.map((integration) => (
                <span
                  key={integration}
                  className="px-4 py-2 bg-accent/10 border border-accent/20 rounded-lg text-sm font-medium text-accent"
                >
                  {integration}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Pricing Section */}
        <div className="py-20">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid lg:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
              <div>
                <p className="text-accent text-sm font-medium uppercase tracking-wider mb-4">Pricing</p>
                <h2 className="text-3xl md:text-4xl font-bold mb-6">One Simple Price.<br/>Unlimited Calls.</h2>
                <p className="text-text-secondary mb-4">
                  No per-minute charges. No hidden fees. One missed job pays for an entire month of service.
                </p>
                <p className="text-text-secondary mb-4">
                  Most home service businesses miss 10-20 calls per week. That's $10,000+ in lost revenue every month.
                </p>
                <p className="text-text-muted text-sm">
                  Cancel anytime. No contracts.
                </p>
              </div>

              <div className="bg-surface border border-border rounded-2xl p-8 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent to-green-400"></div>

                <div className="mb-6">
                  <p className="text-lg font-medium mb-2">Standard Plan</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold">$497</span>
                    <span className="text-text-secondary">/month</span>
                  </div>
                  <p className="text-sm text-text-muted mt-2">+ $500 one-time setup fee</p>
                </div>

                <ul className="space-y-3 mb-8">
                  {[
                    'Unlimited calls answered',
                    '24/7/365 availability',
                    'Appointment booking',
                    'Lead capture + SMS/email alerts',
                    'Call recordings + transcripts',
                    'All integrations included',
                    'Custom AI setup for your business',
                  ].map((feature, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/services/inquiry?type=AI_SOLUTIONS&product=ringzero"
                  className="block w-full text-center px-6 py-4 bg-accent text-black rounded-lg font-medium hover:bg-accent/90 transition-colors"
                >
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="py-20">
          <div className="container mx-auto px-4 md:px-6">
            <div className="max-w-3xl mx-auto text-center bg-gradient-to-br from-accent/10 to-green-500/10 rounded-2xl p-12 border border-accent/20">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to Stop Missing Calls?
              </h2>
              <p className="text-lg text-text-secondary mb-8">
                Get a free demo. We'll show you exactly how RingZero will work for your business.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link
                  href="/services/inquiry?type=AI_SOLUTIONS&product=ringzero"
                  className="inline-flex items-center px-8 py-4 bg-accent text-black rounded-lg font-medium hover:bg-accent/90 transition-all shadow-lg"
                >
                  Request Free Demo
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
                <a
                  href="tel:+14159694084"
                  className="inline-flex items-center px-8 py-4 border-2 border-border rounded-lg font-medium hover:bg-surface transition-all"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  Call Demo Now
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
