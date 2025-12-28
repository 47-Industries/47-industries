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
  }, [featuredProjects])

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

      {/* Services Section */}
      <section className="py-16 md:py-32 bg-surface">
        <div className="container mx-auto px-6">
          <div className="mb-12 md:mb-20">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 reveal">Services</h2>
            <p className="text-lg md:text-xl text-text-secondary max-w-2xl reveal" data-delay="100">
              Comprehensive solutions for modern manufacturing and development
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {/* Web Apps */}
            <Link href="/services?category=web" className="reveal group p-6 md:p-8 bg-background border border-border rounded-2xl hover:border-text-primary transition-all flex flex-col" data-delay="0">
              <h3 className="text-xl md:text-2xl font-bold mb-3">Web Apps</h3>
              <p className="text-text-secondary mb-6 leading-relaxed text-sm flex-grow">
                Full-featured web applications with modern frameworks and scalable architecture.
              </p>
              <div className="text-text-primary group-hover:translate-x-2 transition-transform inline-flex items-center text-sm mt-auto">
                View services
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </Link>

            {/* Websites */}
            <Link href="/services?category=web" className="reveal group p-6 md:p-8 bg-background border border-border rounded-2xl hover:border-text-primary transition-all flex flex-col" data-delay="100">
              <h3 className="text-xl md:text-2xl font-bold mb-3">Websites</h3>
              <p className="text-text-secondary mb-6 leading-relaxed text-sm flex-grow">
                Custom websites built with modern technologies. Fast, secure, and beautifully designed.
              </p>
              <div className="text-text-primary group-hover:translate-x-2 transition-transform inline-flex items-center text-sm mt-auto">
                View services
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </Link>

            {/* Mobile Development */}
            <Link href="/services?category=app" className="reveal group p-6 md:p-8 bg-background border border-border rounded-2xl hover:border-text-primary transition-all flex flex-col" data-delay="200">
              <h3 className="text-xl md:text-2xl font-bold mb-3">Mobile Development</h3>
              <p className="text-text-secondary mb-6 leading-relaxed text-sm flex-grow">
                Native and cross-platform mobile apps for iOS and Android.
              </p>
              <div className="text-text-primary group-hover:translate-x-2 transition-transform inline-flex items-center text-sm mt-auto">
                Learn more
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </Link>

            {/* Custom Manufacturing */}
            <Link href="/custom-3d-printing" className="reveal group p-6 md:p-8 bg-background border border-border rounded-2xl hover:border-text-primary transition-all flex flex-col" data-delay="300">
              <h3 className="text-xl md:text-2xl font-bold mb-3">Custom Manufacturing</h3>
              <p className="text-text-secondary mb-6 leading-relaxed text-sm flex-grow">
                Upload your designs and receive instant quotes. From prototypes to production runs.
              </p>
              <div className="text-text-primary group-hover:translate-x-2 transition-transform inline-flex items-center text-sm mt-auto">
                Request quote
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Projects */}
      {featuredProjects.length > 0 && (
        <section className="py-16 md:py-32">
          <div className="container mx-auto px-6">
            <div className="mb-12 md:mb-20">
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 reveal">Featured Work</h2>
              <p className="text-lg md:text-xl text-text-secondary max-w-2xl reveal" data-delay="100">
                Recent projects we're proud of
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {featuredProjects.slice(0, 3).map((project, index) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.slug}`}
                  className="reveal group block bg-surface border border-border rounded-2xl overflow-hidden hover:border-text-primary transition-all"
                  data-delay={index * 100}
                >
                  <div className="aspect-video bg-background relative overflow-hidden">
                    {project.thumbnailUrl ? (
                      <Image
                        src={project.thumbnailUrl}
                        alt={project.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-text-muted">
                        No preview
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <div className="text-xs font-semibold text-accent mb-2 tracking-wider uppercase">{formatCategory(project.category)}</div>
                    <h3 className="text-xl font-bold mb-2">{project.title}</h3>
                    <p className="text-text-secondary text-sm leading-relaxed line-clamp-2">{project.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-16 md:py-32 bg-surface">
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
