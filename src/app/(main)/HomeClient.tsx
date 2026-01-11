'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'

type Product = {
  id: string
  name: string
  slug: string
  shortDesc: string | null
  price: string
  comparePrice: string | null
  images: string[]
  categoryName: string
}

type Project = {
  id: string
  title: string
  slug: string
  category: string
  description: string
  thumbnailUrl: string | null
  liveUrl: string | null
  accentColor: string | null
}

// Category-specific icons for project placeholders
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  AI_AUTOMATION: (
    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  ),
  WEB_DEVELOPMENT: (
    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
    </svg>
  ),
  WEB_APP: (
    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  IOS_APP: (
    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  ),
}

type Service = {
  title: string
  description: string
  category: string
}

// Format category for display
function formatCategory(category: string): string {
  // Handle special cases
  const specialCases: Record<string, string> = {
    'IOS_APP': 'iOS App',
    'ANDROID_APP': 'Android App',
    'WEB_APP': 'Web App',
    'MOBILE_APP': 'Mobile App',
  }

  if (specialCases[category]) {
    return specialCases[category]
  }

  // Default: replace underscores with spaces and title case
  return category
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

export default function HomeClient({
  featuredProducts,
  featuredProjects,
  services,
}: {
  featuredProducts: Product[]
  featuredProjects: Project[]
  services: Service[]
}) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const heroRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (heroRef.current) {
        const rect = heroRef.current.getBoundingClientRect()
        setMousePosition({
          x: (e.clientX - rect.left) / rect.width,
          y: (e.clientY - rect.top) / rect.height,
        })
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  // Scroll reveal effect with staggered animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const delay = entry.target.getAttribute('data-delay') || '0'
            setTimeout(() => {
              entry.target.classList.add('revealed')
            }, parseInt(delay))
          }
        })
      },
      { threshold: 0.1, rootMargin: '-50px' }
    )

    const elements = document.querySelectorAll('.reveal')
    elements.forEach((el) => observer.observe(el))

    return () => observer.disconnect()
  }, [featuredProjects, services])

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-surface to-background" />
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background: `radial-gradient(circle at ${mousePosition.x * 100}% ${mousePosition.y * 100}%, rgba(59, 130, 246, 0.15) 0%, transparent 50%)`,
            transition: 'background 0.3s ease',
          }}
        />

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
                href="/services"
                className="px-8 py-4 border border-border rounded-lg font-medium hover:bg-surface transition-all inline-flex items-center justify-center"
              >
                View Services
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 pt-12 border-t border-border">
              <StatCounter end={50} suffix="+" label="Projects Delivered" />
              <StatCounter end={99.9} suffix="%" label="Client Satisfaction" decimal />
              <StatCounter end={24} suffix="hr" label="Avg Response" />
              <StatCounter end={5} suffix="+" label="Years Experience" />
            </div>
          </div>
        </div>
      </section>

      {/* Services & Work Section */}
      <section className="py-16 md:py-32">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            {/* Services */}
            <div className="mb-16">
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 reveal">Services</h2>
              <p className="text-lg md:text-xl text-text-secondary max-w-3xl mb-12 reveal" data-delay="100">
                From ideation to deployment, we build custom software solutions that drive your business forward. Our team delivers websites, web applications, and mobile apps tailored to your unique needs.
              </p>

              <div className="grid md:grid-cols-3 gap-6">
                {services.map((service, index) => (
                  <Link
                    key={service.title}
                    href={`/services?category=${service.category}`}
                    className="reveal group p-8 bg-background border border-border rounded-2xl hover:border-text-primary transition-all flex flex-col"
                    data-delay={index * 100}
                  >
                    <h3 className="text-xl md:text-2xl font-bold mb-4">{service.title}</h3>
                    <p className="text-text-secondary leading-relaxed flex-grow">
                      {service.description}
                    </p>
                    <div className="text-text-primary group-hover:translate-x-2 transition-transform inline-flex items-center text-sm mt-6">
                      View packages
                      <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Featured Work */}
            {featuredProjects.length > 0 && (
              <div className="pt-16 border-t border-border">
                <h3 className="text-3xl md:text-4xl font-bold mb-8 reveal">Featured Work</h3>

                <div className="grid md:grid-cols-3 gap-6">
                  {featuredProjects.slice(0, 3).map((project, index) => (
                    <Link
                      key={project.id}
                      href={`/projects/${project.slug}`}
                      className="reveal group block bg-background border border-border rounded-2xl overflow-hidden hover:border-text-primary transition-all"
                      data-delay={index * 100}
                    >
                      <div className="aspect-video bg-surface relative overflow-hidden">
                        {project.thumbnailUrl ? (
                          <Image
                            src={project.thumbnailUrl}
                            alt={project.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          /* Styled placeholder with category icon and accent color */
                          <div
                            className="w-full h-full flex flex-col items-center justify-center p-4"
                            style={{
                              background: project.accentColor
                                ? `linear-gradient(135deg, ${project.accentColor}20 0%, ${project.accentColor}08 100%)`
                                : 'linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(59,130,246,0.03) 100%)'
                            }}
                          >
                            <div
                              className="mb-2"
                              style={{ color: project.accentColor || '#3b82f6' }}
                            >
                              {CATEGORY_ICONS[project.category] || (
                                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                </svg>
                              )}
                            </div>
                            <span
                              className="text-sm font-semibold text-center"
                              style={{ color: project.accentColor || '#3b82f6' }}
                            >
                              {project.title}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <div className="text-xs text-accent mb-1 font-semibold">{formatCategory(project.category)}</div>
                        <h4 className="font-bold mb-1">{project.title}</h4>
                        <p className="text-text-secondary text-xs line-clamp-2">{project.description}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 3D Printing & Products Section */}
      <section className="py-16 md:py-32">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="mb-12">
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 reveal">3D Printing</h2>
              <p className="text-lg md:text-xl text-text-secondary max-w-3xl reveal" data-delay="100">
                From custom prototyping to premium ready-made products
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-12">
              {/* Custom Prototyping */}
              <Link href="/custom-3d-printing" className="reveal group p-8 bg-background border border-border rounded-2xl hover:border-text-primary transition-all" data-delay="0">
                <div className="mb-4">
                  <svg className="w-12 h-12 text-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-3">Custom Prototyping</h3>
                <p className="text-text-secondary mb-6 leading-relaxed">
                  Upload your designs and receive instant quotes. Professional-grade 3D printing from prototypes to production runs with a variety of materials and finishes.
                </p>
                <div className="text-text-primary group-hover:translate-x-2 transition-transform inline-flex items-center font-medium">
                  Get a quote
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </Link>

              {/* Products */}
              <Link href="/shop" className="reveal group p-8 bg-background border border-border rounded-2xl hover:border-text-primary transition-all" data-delay="100">
                <div className="mb-4">
                  <svg className="w-12 h-12 text-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-3">Ready-Made Products</h3>
                <p className="text-text-secondary mb-6 leading-relaxed">
                  Browse our collection of premium 3D printed products. Unique designs, high-quality materials, ready to ship.
                </p>
                <div className="text-text-primary group-hover:translate-x-2 transition-transform inline-flex items-center font-medium">
                  Browse products
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </Link>
            </div>

            {/* Featured Products */}
            {featuredProducts.length > 0 && (
              <div className="pt-8 border-t border-border">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl md:text-3xl font-bold reveal">Featured Products</h3>
                  <Link href="/shop" className="reveal text-text-primary hover:text-text-secondary transition-colors text-sm font-medium" data-delay="100">
                    View all →
                  </Link>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {featuredProducts.slice(0, 4).map((product, index) => (
                    <Link
                      key={product.id}
                      href={`/shop/${product.slug}`}
                      className="reveal group block bg-background border border-border rounded-xl overflow-hidden hover:border-text-primary transition-all"
                      data-delay={index * 100}
                    >
                      <div className="aspect-square bg-background relative overflow-hidden">
                        {product.images.length > 0 ? (
                          <Image
                            src={product.images[0]}
                            alt={product.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-text-muted text-xs">
                            No image
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <h4 className="font-bold text-sm mb-1 line-clamp-1">{product.name}</h4>
                        <div className="flex items-center gap-2">
                          {product.comparePrice && (
                            <span className="text-text-muted line-through text-xs">${parseFloat(product.comparePrice).toFixed(2)}</span>
                          )}
                          <span className="text-text-primary font-bold text-sm">${parseFloat(product.price).toFixed(2)}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-32 border-t border-border">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 reveal">
              Ready to get started?
            </h2>
            <p className="text-lg md:text-xl text-text-secondary mb-10 max-w-2xl mx-auto reveal" data-delay="100">
              Whether you need custom manufacturing, a new website, or an innovative app,
              we're here to help bring your vision to life.
            </p>
            <Link
              href="/contact"
              className="reveal inline-flex items-center px-10 py-5 bg-text-primary text-background rounded-lg text-lg font-medium hover:bg-text-secondary transition-all"
              data-delay="200"
            >
              Contact us
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      <style jsx>{`
        .reveal {
          opacity: 0;
          transform: translateY(50px);
          transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .reveal.revealed {
          opacity: 1;
          transform: translateY(0);
        }
      `}</style>
    </div>
  )
}

function StatCounter({ end, suffix = '', label, decimal = false }: { end: number; suffix?: string; label: string; decimal?: boolean }) {
  const [count, setCount] = useState(0)
  const [hasAnimated, setHasAnimated] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true)
          const duration = 2000
          const steps = 60
          const increment = end / steps
          let current = 0

          const timer = setInterval(() => {
            current += increment
            if (current >= end) {
              setCount(end)
              clearInterval(timer)
            } else {
              setCount(current)
            }
          }, duration / steps)

          return () => clearInterval(timer)
        }
      },
      { threshold: 0.5 }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [end, hasAnimated])

  return (
    <div ref={ref}>
      <div className="text-3xl md:text-4xl font-bold mb-1">
        {decimal ? count.toFixed(1) : Math.floor(count)}{suffix}
      </div>
      <div className="text-text-secondary text-xs md:text-sm">{label}</div>
    </div>
  )
}
