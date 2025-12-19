import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function generateMetadata() {
  const project = await prisma.serviceProject.findFirst({
    where: { slug: 'leadchopper' },
    select: { title: true, description: true },
  })

  return {
    title: project ? `${project.title} - 47 Industries` : 'LeadChopper - 47 Industries',
    description: project?.description?.slice(0, 160) || 'AI-powered B2B lead generation and multi-channel outreach automation.',
  }
}

export default async function LeadChopperPage() {
  const project = await prisma.serviceProject.findFirst({
    where: { slug: 'leadchopper' },
  })

  if (!project || !project.isActive) {
    notFound()
  }

  const technologies = (project.technologies as string[]) || []
  const categories = (project.categories as string[]) || []
  const displayCategories = categories.length > 0 ? categories : [project.category]

  // Key Features
  const features = [
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
      title: 'Automated Lead Discovery',
      description: 'Finds qualified businesses through Google Places and Yelp, then scrapes websites for contact information. No manual research required.',
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      title: 'AI-Powered Personalization',
      description: 'Claude AI analyzes each lead and generates unique, personalized messages. No templates—every outreach is custom-written.',
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      ),
      title: 'Multi-Channel Outreach',
      description: 'Reaches prospects via email, SMS, or Instagram DMs. AI automatically selects the best channel for each lead.',
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      title: 'Autopilot Mode',
      description: 'Runs city-by-city searches across the United States, automatically finding and contacting qualified leads while you sleep.',
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
      ),
      title: 'Unified Inbox',
      description: 'All conversations from email, SMS, and Instagram in one place. Track replies, manage conversations, and never miss an opportunity.',
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
      title: 'Full Data Ownership',
      description: 'You own your leads and control your credentials. AES-256-GCM encryption keeps your data secure. Export anytime.',
    },
  ]

  // How It Works Steps
  const steps = [
    {
      number: '01',
      title: 'Define Your Target',
      description: 'Tell LeadChopper who your ideal customer is—industry, location, business type. The AI takes it from there.',
    },
    {
      number: '02',
      title: 'AI Finds & Qualifies',
      description: 'LeadChopper searches Google Places, Yelp, and Instagram, scrapes websites for contact info, and qualifies each lead.',
    },
    {
      number: '03',
      title: 'Personalized Outreach',
      description: 'Claude AI researches each business and writes custom messages. The system routes to the best channel: email, SMS, or Instagram.',
    },
    {
      number: '04',
      title: 'Track & Convert',
      description: 'Monitor replies in the unified inbox. AI detects interest level and helps you focus on the hottest prospects.',
    },
  ]

  // Comparison table
  const comparisons = [
    { feature: 'Lead Discovery', leadchopper: true, agency: 'Manual', bdr: 'Manual', emailTool: false },
    { feature: 'Multi-Channel (Email/SMS/Instagram)', leadchopper: true, agency: 'Email Only', bdr: 'Phone Only', emailTool: false },
    { feature: 'AI Personalization', leadchopper: true, agency: false, bdr: true, emailTool: false },
    { feature: 'Autopilot Prospecting', leadchopper: true, agency: false, bdr: false, emailTool: false },
    { feature: 'Data Ownership', leadchopper: true, agency: false, bdr: true, emailTool: true },
    { feature: 'Monthly Cost', leadchopper: '$300', agency: '$2K-$10K', bdr: '$5K+', emailTool: '$50-$500' },
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section - Standard Template */}
      <div className="pt-20 pb-12 md:pt-24 md:pb-16">
        <div className="container mx-auto px-4 md:px-6">
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
                    {cat.replace(/_/g, ' ')}
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

              {/* Description */}
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
                <Link
                  href="/start-project"
                  className="inline-flex items-center px-5 py-2.5 border border-border rounded-lg font-medium hover:bg-surface transition-colors text-sm"
                >
                  Start Your Project
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics - Custom Section */}
      <div className="py-12 bg-surface/30">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            <div className="bg-background/50 rounded-lg p-4 text-center border border-border">
              <div className="text-2xl font-bold text-accent mb-1">85%</div>
              <div className="text-xs text-text-secondary">Open Rate</div>
            </div>
            <div className="bg-background/50 rounded-lg p-4 text-center border border-border">
              <div className="text-2xl font-bold text-accent mb-1">32%</div>
              <div className="text-xs text-text-secondary">Reply Rate</div>
            </div>
            <div className="bg-background/50 rounded-lg p-4 text-center border border-border">
              <div className="text-2xl font-bold text-accent mb-1">3</div>
              <div className="text-xs text-text-secondary">Channels</div>
            </div>
            <div className="bg-background/50 rounded-lg p-4 text-center border border-border">
              <div className="text-2xl font-bold text-accent mb-1">24/7</div>
              <div className="text-xs text-text-secondary">Autopilot</div>
            </div>
          </div>
        </div>
      </div>

      {/* The Challenge */}
      {project.challenge && (
        <div className="py-16 bg-surface/30">
          <div className="container mx-auto px-4 md:px-6">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold mb-6 text-center">The Challenge</h2>
              <p className="text-lg text-text-secondary leading-relaxed text-center">
                {project.challenge}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Features Grid */}
      <div className="py-20">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Complete Lead Generation System</h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              Everything you need to find, qualify, and convert leads—all automated.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <div key={i} className="bg-surface border border-border rounded-xl p-8 hover:border-accent transition-all">
                <div className="text-accent mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-text-secondary">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="py-20 bg-surface/30">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              Four simple steps. LeadChopper does the rest.
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8">
              {steps.map((step, i) => (
                <div key={i} className="flex gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 rounded-full bg-accent/10 text-accent flex items-center justify-center text-2xl font-bold">
                      {step.number}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                    <p className="text-text-secondary">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Solution */}
      {project.solution && (
        <div className="py-20">
          <div className="container mx-auto px-4 md:px-6">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold mb-6 text-center">Our Solution</h2>
              <p className="text-lg text-text-secondary leading-relaxed">
                {project.solution}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Comparison Table */}
      <div className="py-20 bg-surface/30">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose LeadChopper?</h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              Compare LeadChopper to traditional alternatives
            </p>
          </div>

          <div className="max-w-5xl mx-auto overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-4 px-4 font-semibold">Feature</th>
                  <th className="text-center py-4 px-4 font-semibold text-accent">LeadChopper</th>
                  <th className="text-center py-4 px-4 font-semibold text-text-secondary">Agency</th>
                  <th className="text-center py-4 px-4 font-semibold text-text-secondary">BDR Hire</th>
                  <th className="text-center py-4 px-4 font-semibold text-text-secondary">Email Tool</th>
                </tr>
              </thead>
              <tbody>
                {comparisons.map((row, i) => (
                  <tr key={i} className="border-b border-border/50">
                    <td className="py-4 px-4">{row.feature}</td>
                    <td className="text-center py-4 px-4">
                      {typeof row.leadchopper === 'boolean' ? (
                        row.leadchopper ? (
                          <svg className="w-6 h-6 text-green-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-6 h-6 text-red-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )
                      ) : (
                        <span className="font-semibold text-accent">{row.leadchopper}</span>
                      )}
                    </td>
                    <td className="text-center py-4 px-4 text-text-secondary">
                      {typeof row.agency === 'boolean' ? (
                        row.agency ? '✓' : '✗'
                      ) : row.agency}
                    </td>
                    <td className="text-center py-4 px-4 text-text-secondary">
                      {typeof row.bdr === 'boolean' ? (
                        row.bdr ? '✓' : '✗'
                      ) : row.bdr}
                    </td>
                    <td className="text-center py-4 px-4 text-text-secondary">
                      {typeof row.emailTool === 'boolean' ? (
                        row.emailTool ? '✓' : '✗'
                      ) : row.emailTool}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Results */}
      {project.results && (
        <div className="py-20">
          <div className="container mx-auto px-4 md:px-6">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold mb-6 text-center">Real Results</h2>
              <div className="bg-surface/50 border border-border rounded-xl p-8">
                <p className="text-lg text-text-secondary leading-relaxed">
                  {project.results}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tech Stack */}
      {technologies.length > 0 && (
        <div className="py-20 bg-surface/30">
          <div className="container mx-auto px-4 md:px-6">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-3xl font-bold mb-8 text-center">Built With Modern Technology</h2>
              <div className="flex flex-wrap justify-center gap-3">
                {technologies.map((tech) => (
                  <span
                    key={tech}
                    className="px-4 py-2 bg-background border border-border rounded-lg text-sm font-medium"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Final CTA */}
      <div className="py-20">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-3xl mx-auto text-center bg-gradient-to-br from-accent/10 to-purple-500/10 rounded-2xl p-12 border border-accent/20">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Automate Your Lead Generation?
            </h2>
            <p className="text-lg text-text-secondary mb-8">
              Join businesses generating thousands of qualified leads with LeadChopper.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/contact"
                className="inline-flex items-center px-8 py-4 bg-accent text-white rounded-lg font-medium hover:bg-accent/90 transition-all shadow-lg"
              >
                Get Started
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              {project.liveUrl && (
                <a
                  href={project.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-8 py-4 border-2 border-border rounded-lg font-medium hover:bg-surface transition-all"
                >
                  Explore Platform
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
