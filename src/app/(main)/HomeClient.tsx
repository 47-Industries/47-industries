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
}

export default function HomeClient({
  featuredProducts,
  featuredProjects,
}: {
  featuredProducts: Product[]
  featuredProjects: Project[]
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

  // Scroll reveal effect
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
          }
        })
      },
      { threshold: 0.1, rootMargin: '0px 0px -100px 0px' }
    )

    const elements = document.querySelectorAll('.scroll-reveal')
    elements.forEach((el) => observer.observe(el))

    return () => observer.disconnect()
  }, [])

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-background via-surface to-background" />
          <div
            className="absolute inset-0 opacity-30"
            style={{
              background: `radial-gradient(circle at ${mousePosition.x * 100}% ${mousePosition.y * 100}%, rgba(59, 130, 246, 0.15) 0%, transparent 50%)`,
              transition: 'background 0.3s ease',
            }}
          />
          <div className="absolute inset-0 grid-pattern" />
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-6xl mx-auto text-center">
            <div className="space-y-6 mb-12 fade-in-up">
              <h1 className="text-6xl sm:text-7xl md:text-9xl font-bold tracking-tight leading-none gradient-text">
                47 Industries
              </h1>
              <p className="text-xl sm:text-2xl md:text-3xl text-text-secondary font-light max-w-4xl mx-auto fade-in-up delay-1">
                Manufacturing excellence meets digital innovation
              </p>
              <p className="text-base sm:text-lg text-text-muted max-w-3xl mx-auto fade-in-up delay-2">
                From custom 3D printing and manufacturing to cutting-edge web and mobile applications
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20 fade-in-up delay-3">
              <Link
                href="/shop"
                className="group px-8 py-4 bg-text-primary text-background rounded-lg font-medium hover:bg-text-secondary transition-all inline-flex items-center justify-center hover:scale-105 hover:shadow-lg hover:shadow-text-primary/20"
              >
                Browse Products
                <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <Link
                href="/custom-3d-printing"
                className="group px-8 py-4 border border-border rounded-lg font-medium hover:bg-surface transition-all inline-flex items-center justify-center hover:scale-105 hover:border-text-primary"
              >
                Request Custom Quote
              </Link>
            </div>

            {/* Animated Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 pt-12 border-t border-border">
              <StatCounter end={50} suffix="+" label="Projects Delivered" />
              <StatCounter end={99.9} suffix="%" label="Client Satisfaction" decimal />
              <StatCounter end={24} suffix="hr" label="Avg Response" />
              <StatCounter end={5} suffix="+" label="Years Experience" />
            </div>
          </div>
        </div>
      </section>

      {/* What We Do Section */}
      <section className="py-24 md:py-32 bg-surface">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16 md:mb-24">
              <h2 className="text-4xl md:text-6xl font-bold mb-6 scroll-reveal">What We Do</h2>
              <p className="text-lg md:text-xl text-text-secondary max-w-3xl mx-auto scroll-reveal delay-1">
                Comprehensive solutions across manufacturing, development, and design
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <WhatWeDoCard
                icon={
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                }
                title="Web Development"
                description="Custom websites and web applications built with modern technologies"
                href="/services?category=web"
              />
              <WhatWeDoCard
                icon={
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                }
                title="Mobile Apps"
                description="Native iOS and Android applications with seamless user experiences"
                href="/services?category=app"
              />
              <WhatWeDoCard
                icon={
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                }
                title="3D Printing"
                description="Custom manufacturing from prototypes to production runs with premium materials"
                href="/custom-3d-printing"
              />
              <WhatWeDoCard
                icon={
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                }
                title="Products"
                description="Premium 3D printed products and designs ready to ship"
                href="/shop"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      {featuredProducts.length > 0 && (
        <section className="py-24 md:py-32">
          <div className="container mx-auto px-6">
            <div className="max-w-6xl mx-auto">
              <div className="flex justify-between items-end mb-12 md:mb-16">
                <div>
                  <h2 className="text-4xl md:text-6xl font-bold mb-4 scroll-reveal">Featured Products</h2>
                  <p className="text-lg text-text-secondary scroll-reveal delay-1">
                    Premium designs ready to order
                  </p>
                </div>
                <Link
                  href="/shop"
                  className="hidden md:flex items-center text-text-primary hover:text-text-secondary transition-colors scroll-reveal delay-2"
                >
                  View all
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {featuredProducts.slice(0, 4).map((product, index) => (
                  <ProductCard key={product.id} product={product} index={index} />
                ))}
              </div>

              <div className="mt-8 text-center md:hidden">
                <Link
                  href="/shop"
                  className="inline-flex items-center text-text-primary hover:text-text-secondary transition-colors"
                >
                  View all products
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Featured Projects Section */}
      {featuredProjects.length > 0 && (
        <section className="py-24 md:py-32 bg-surface">
          <div className="container mx-auto px-6">
            <div className="max-w-6xl mx-auto">
              <div className="flex justify-between items-end mb-12 md:mb-16">
                <div>
                  <h2 className="text-4xl md:text-6xl font-bold mb-4 scroll-reveal">Featured Work</h2>
                  <p className="text-lg text-text-secondary scroll-reveal delay-1">
                    Recent projects we're proud of
                  </p>
                </div>
                <Link
                  href="/portfolio"
                  className="hidden md:flex items-center text-text-primary hover:text-text-secondary transition-colors scroll-reveal delay-2"
                >
                  View portfolio
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {featuredProjects.slice(0, 3).map((project, index) => (
                  <ProjectCard key={project.id} project={project} index={index} />
                ))}
              </div>

              <div className="mt-8 text-center md:hidden">
                <Link
                  href="/portfolio"
                  className="inline-flex items-center text-text-primary hover:text-text-secondary transition-colors"
                >
                  View full portfolio
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-24 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-surface to-background" />
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-6xl font-bold mb-6 scroll-reveal">
              Ready to bring your vision to life?
            </h2>
            <p className="text-lg md:text-xl text-text-secondary mb-10 max-w-2xl mx-auto scroll-reveal delay-1">
              Whether you need custom manufacturing, digital products, or development services,
              we're here to help.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center scroll-reveal delay-2">
              <Link
                href="/contact"
                className="group inline-flex items-center justify-center px-10 py-5 bg-text-primary text-background rounded-lg text-lg font-medium hover:bg-text-secondary transition-all hover:scale-105 hover:shadow-xl hover:shadow-text-primary/20"
              >
                Get in touch
                <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <Link
                href="/services"
                className="group inline-flex items-center justify-center px-10 py-5 border border-border rounded-lg text-lg font-medium hover:bg-surface transition-all hover:scale-105 hover:border-text-primary"
              >
                Explore services
              </Link>
            </div>
          </div>
        </div>
      </section>

      <style jsx>{`
        .grid-pattern {
          background-image: linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 100px 100px;
          animation: gridMove 20s linear infinite;
        }

        @keyframes gridMove {
          0% { transform: translateY(0); }
          100% { transform: translateY(100px); }
        }

        .gradient-text {
          background: linear-gradient(to right, var(--text-primary), var(--text-secondary));
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-size: 200% auto;
          animation: gradient 8s ease infinite;
        }

        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        .fade-in-up {
          animation: fadeInUp 0.8s ease-out forwards;
        }

        .fade-in-up.delay-1 {
          opacity: 0;
          animation: fadeInUp 0.8s ease-out 0.2s forwards;
        }

        .fade-in-up.delay-2 {
          opacity: 0;
          animation: fadeInUp 0.8s ease-out 0.4s forwards;
        }

        .fade-in-up.delay-3 {
          opacity: 0;
          animation: fadeInUp 0.8s ease-out 0.6s forwards;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .scroll-reveal {
          opacity: 0;
          transform: translateY(30px);
          transition: opacity 0.6s ease-out, transform 0.6s ease-out;
        }

        .scroll-reveal.delay-1 {
          transition-delay: 0.1s;
        }

        .scroll-reveal.delay-2 {
          transition-delay: 0.2s;
        }

        .scroll-reveal.visible {
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

function WhatWeDoCard({ icon, title, description, href }: { icon: React.ReactNode; title: string; description: string; href: string }) {
  const ref = useRef<HTMLAnchorElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible')
        }
      },
      { threshold: 0.2 }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <Link
      ref={ref}
      href={href}
      className="group scroll-reveal relative p-8 bg-background border border-border rounded-2xl hover:border-text-primary transition-all overflow-hidden hover:scale-105 hover:shadow-xl"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="relative z-10">
        <div className="text-text-primary mb-4 group-hover:scale-110 transition-transform">
          {icon}
        </div>
        <h3 className="text-xl font-bold mb-3">{title}</h3>
        <p className="text-text-secondary text-sm leading-relaxed mb-4">
          {description}
        </p>
        <div className="text-text-primary group-hover:translate-x-2 transition-transform inline-flex items-center text-sm font-medium">
          Learn more
          <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </div>
      </div>
    </Link>
  )
}

function ProductCard({ product, index }: { product: Product; index: number }) {
  const ref = useRef<HTMLAnchorElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            entry.target.classList.add('visible')
          }, index * 100)
        }
      },
      { threshold: 0.2 }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [index])

  return (
    <Link
      ref={ref}
      href={`/shop/${product.slug}`}
      className="group scroll-reveal block bg-surface border border-border rounded-2xl overflow-hidden hover:border-text-primary transition-all hover:scale-105 hover:shadow-xl"
    >
      <div className="aspect-square bg-background relative overflow-hidden">
        {product.images.length > 0 ? (
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-text-muted">
            No image
          </div>
        )}
      </div>
      <div className="p-6">
        <div className="text-xs text-text-muted mb-2">{product.categoryName}</div>
        <h3 className="font-bold text-lg mb-2 group-hover:text-text-primary transition-colors">{product.name}</h3>
        {product.shortDesc && (
          <p className="text-text-secondary text-sm mb-4 line-clamp-2">{product.shortDesc}</p>
        )}
        <div className="flex items-center gap-2">
          {product.comparePrice && (
            <span className="text-text-muted line-through text-sm">${parseFloat(product.comparePrice).toFixed(2)}</span>
          )}
          <span className="text-text-primary font-bold">${parseFloat(product.price).toFixed(2)}</span>
        </div>
      </div>
    </Link>
  )
}

function ProjectCard({ project, index }: { project: Project; index: number }) {
  const ref = useRef<HTMLAnchorElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            entry.target.classList.add('visible')
          }, index * 100)
        }
      },
      { threshold: 0.2 }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [index])

  return (
    <Link
      ref={ref}
      href={`/projects/${project.slug}`}
      className="group scroll-reveal block bg-background border border-border rounded-2xl overflow-hidden hover:border-text-primary transition-all hover:scale-105 hover:shadow-xl"
    >
      <div className="aspect-video bg-surface relative overflow-hidden">
        {project.thumbnailUrl ? (
          <Image
            src={project.thumbnailUrl}
            alt={project.title}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-text-muted">
            No preview
          </div>
        )}
      </div>
      <div className="p-6">
        <div className="text-xs font-semibold text-accent mb-2 tracking-wider uppercase">{project.category}</div>
        <h3 className="font-bold text-xl mb-3 group-hover:text-text-primary transition-colors">{project.title}</h3>
        <p className="text-text-secondary text-sm leading-relaxed line-clamp-2">{project.description}</p>
      </div>
    </Link>
  )
}
