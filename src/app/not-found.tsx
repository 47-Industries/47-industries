import Link from 'next/link'

export default function NotFound() {
  const suggestions = [
    {
      title: 'Shop',
      description: 'Browse our 3D printed products',
      href: '/shop',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
      ),
    },
    {
      title: 'Custom 3D Printing',
      description: 'Request a custom print quote',
      href: '/custom-printing',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
      ),
    },
    {
      title: 'Web Development',
      description: 'Professional web solutions',
      href: '/services?category=web',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
        </svg>
      ),
    },
    {
      title: 'App Development',
      description: 'Mobile & desktop applications',
      href: '/services?category=app',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
          <line x1="12" y1="18" x2="12.01" y2="18" />
        </svg>
      ),
    },
    {
      title: 'MotoRev',
      description: 'Motorcycle tracking app',
      href: '/motorev',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
        </svg>
      ),
    },
    {
      title: 'Contact Us',
      description: 'Get in touch with our team',
      href: '/contact',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
          <polyline points="22,6 12,13 2,6" />
        </svg>
      ),
    },
  ]

  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-20 px-6">
      <div className="max-w-4xl w-full text-center">
        {/* 404 Hero */}
        <div className="mb-12">
          <h1 className="text-[120px] md:text-[180px] font-bold leading-none text-text-primary opacity-10">
            404
          </h1>
          <div className="relative -mt-16 md:-mt-24">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Page Not Found
            </h2>
            <p className="text-lg md:text-xl text-text-secondary max-w-xl mx-auto">
              The page you&apos;re looking for doesn&apos;t exist or has been moved.
              But don&apos;t worry, we&apos;ve got plenty of other cool stuff for you.
            </p>
          </div>
        </div>

        {/* Back to Home */}
        <div className="mb-16">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-8 py-4 bg-text-primary text-background rounded-lg font-semibold hover:bg-text-secondary transition-all"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back to Home
          </Link>
        </div>

        {/* Suggestions */}
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-6">
            Maybe you were looking for
          </h3>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {suggestions.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group p-6 bg-surface border border-border rounded-xl hover:border-accent hover:bg-surface-elevated transition-all text-left"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center text-accent flex-shrink-0 group-hover:bg-accent group-hover:text-white transition-all">
                  {item.icon}
                </div>
                <div>
                  <h4 className="font-semibold text-text-primary group-hover:text-accent transition-colors">
                    {item.title}
                  </h4>
                  <p className="text-sm text-text-secondary mt-1">
                    {item.description}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Footer note */}
        <div className="mt-16 pt-8 border-t border-border">
          <p className="text-text-secondary text-sm">
            Still can&apos;t find what you need?{' '}
            <Link href="/contact" className="text-accent hover:underline">
              Contact us
            </Link>{' '}
            and we&apos;ll help you out.
          </p>
        </div>
      </div>
    </div>
  )
}
