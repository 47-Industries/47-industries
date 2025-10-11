import Link from 'next/link'

export default function AppDevelopmentPage() {
  const services = [
    {
      title: 'Mobile Apps',
      description: 'Native iOS and Android applications built with React Native and Flutter.',
      features: ['Cross-platform', 'Native performance', 'App Store optimization', 'Push notifications'],
    },
    {
      title: 'Web Applications',
      description: 'Progressive web apps that work seamlessly across all devices.',
      features: ['Offline support', 'Fast loading', 'Responsive design', 'Real-time updates'],
    },
    {
      title: 'AI Integration',
      description: 'Smart features powered by machine learning and artificial intelligence.',
      features: ['Natural language processing', 'Computer vision', 'Predictive analytics', 'Automation'],
    },
    {
      title: 'Backend Systems',
      description: 'Scalable APIs and infrastructure to power your applications.',
      features: ['RESTful APIs', 'GraphQL', 'Microservices', 'Cloud deployment'],
    },
  ]

  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="max-w-4xl mx-auto mb-16 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">App Development</h1>
          <p className="text-xl text-text-secondary">
            Custom mobile and web applications powered by AI and modern technologies.
            From concept to deployment, we build solutions that scale.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid lg:grid-cols-2 gap-8 mb-20">
          {services.map((service) => (
            <div key={service.title} className="border border-border rounded-2xl p-10">
              <h3 className="text-3xl font-bold mb-4">{service.title}</h3>
              <p className="text-text-secondary mb-6 leading-relaxed">{service.description}</p>
              <ul className="space-y-2">
                {service.features.map((feature) => (
                  <li key={feature} className="flex items-center text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent mr-3" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* AI Solutions Showcase */}
        <div className="mb-20 bg-surface rounded-3xl p-12">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">AI-Powered Solutions</h2>
              <p className="text-xl text-text-secondary">
                We integrate cutting-edge AI to create intelligent applications
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-accent/10 flex items-center justify-center">
                  <div className="text-2xl">🤖</div>
                </div>
                <h4 className="font-bold mb-2">Machine Learning</h4>
                <p className="text-sm text-text-secondary">
                  Custom models trained on your data for intelligent predictions
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-accent/10 flex items-center justify-center">
                  <div className="text-2xl">💬</div>
                </div>
                <h4 className="font-bold mb-2">Natural Language</h4>
                <p className="text-sm text-text-secondary">
                  Chatbots and text analysis for better user experiences
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-accent/10 flex items-center justify-center">
                  <div className="text-2xl">👁️</div>
                </div>
                <h4 className="font-bold mb-2">Computer Vision</h4>
                <p className="text-sm text-text-secondary">
                  Image recognition and analysis for automated workflows
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Featured Project: MotoRev */}
        <div className="mb-20 border border-border rounded-3xl p-12">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="text-sm font-semibold text-accent mb-3">FEATURED PROJECT</div>
              <h2 className="text-4xl font-bold mb-6">MotoRev</h2>
              <p className="text-text-secondary mb-6 leading-relaxed">
                A comprehensive mobile application for motorcycle enthusiasts. Built with React Native,
                featuring GPS tracking, social networking, safety tools, and garage management.
              </p>
              <div className="space-y-3 mb-8">
                <div className="flex items-center text-sm">
                  <svg className="w-5 h-5 text-accent mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  iOS and Android native app
                </div>
                <div className="flex items-center text-sm">
                  <svg className="w-5 h-5 text-accent mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Real-time GPS tracking and analytics
                </div>
                <div className="flex items-center text-sm">
                  <svg className="w-5 h-5 text-accent mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Social networking features
                </div>
                <div className="flex items-center text-sm">
                  <svg className="w-5 h-5 text-accent mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Advanced safety tools
                </div>
              </div>
              <div className="flex gap-4">
                <Link
                  href="/motorev"
                  className="px-6 py-3 border border-border rounded-lg hover:bg-surface transition-all"
                >
                  Learn More
                </Link>
                <a
                  href="https://motorevapp.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 bg-text-primary text-background rounded-lg hover:bg-text-secondary transition-all inline-flex items-center"
                >
                  Visit Site
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </div>
            <div className="bg-background rounded-2xl p-8 border border-border">
              <div className="aspect-video bg-surface rounded-xl flex items-center justify-center">
                <div className="text-text-secondary">MotoRev Screenshot</div>
              </div>
            </div>
          </div>
        </div>

        {/* Development Process */}
        <div className="mb-20">
          <h2 className="text-4xl font-bold mb-12 text-center">Our Development Process</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold text-2xl">
                1
              </div>
              <h3 className="text-xl font-bold mb-3">Strategy & Planning</h3>
              <p className="text-text-secondary">
                Define requirements, architecture, and roadmap for your application
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold text-2xl">
                2
              </div>
              <h3 className="text-xl font-bold mb-3">Design & Build</h3>
              <p className="text-text-secondary">
                Create intuitive UI/UX and develop features with agile methodology
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold text-2xl">
                3
              </div>
              <h3 className="text-xl font-bold mb-3">Launch & Support</h3>
              <p className="text-text-secondary">
                Deploy to production with monitoring, updates, and ongoing optimization
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center py-16 border-t border-border">
          <h2 className="text-4xl font-bold mb-6">Have an app idea?</h2>
          <p className="text-xl text-text-secondary mb-8 max-w-2xl mx-auto">
            Let's turn your vision into a powerful application that users love.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center px-10 py-5 bg-text-primary text-background rounded-lg text-lg font-medium hover:bg-text-secondary transition-all"
          >
            Start Your Project
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
  title: 'App Development & AI Solutions - 47 Industries',
  description: 'Custom mobile and web applications powered by AI. From concept to deployment.',
}
