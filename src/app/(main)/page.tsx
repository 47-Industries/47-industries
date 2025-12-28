'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

export default function Home() {
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

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Animated Gradient Mesh Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-background via-surface to-background" />
          <div
            className="absolute inset-0 opacity-30"
            style={{
              background: `radial-gradient(circle at ${mousePosition.x * 100}% ${mousePosition.y * 100}%, rgba(59, 130, 246, 0.15) 0%, transparent 50%)`,
              transition: 'background 0.3s ease',
            }}
          />
          {/* Animated grid pattern */}
          <div className="absolute inset-0" style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
            backgroundSize: '100px 100px',
            animation: 'gridMove 20s linear infinite',
          }} />
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-6xl mx-auto">
            <div className="space-y-6 mb-12 animate-fade-in">
              <h1 className="text-5xl sm:text-7xl md:text-9xl font-bold tracking-tight leading-none bg-gradient-to-r from-text-primary via-text-primary to-text-secondary bg-clip-text text-transparent animate-gradient">
                47 Industries
              </h1>
              <p className="text-xl sm:text-2xl md:text-3xl text-text-secondary font-light max-w-3xl animate-fade-in-delay-1">
                Advanced manufacturing and digital innovation
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mb-20 animate-fade-in-delay-2">
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
                href="/services"
                className="group px-8 py-4 border border-border rounded-lg font-medium hover:bg-surface transition-all inline-flex items-center justify-center hover:scale-105 hover:border-text-primary"
              >
                View Services
              </Link>
            </div>

            {/* Animated Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 pt-12 border-t border-border">
              <StatCounter end={50} suffix="+" label="Projects Delivered" />
              <StatCounter end={99.9} suffix="%" label="Client Satisfaction" decimal />
              <StatCounter end={24} suffix="hr" label="Avg Response Time" />
              <StatCounter end={5} suffix="+" label="Years Experience" />
            </div>
          </div>
        </div>

        <style jsx>{`
          @keyframes gridMove {
            0% { transform: translateY(0); }
            100% { transform: translateY(100px); }
          }
          @keyframes gradient {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
          }
          .animate-gradient {
            background-size: 200% auto;
            animation: gradient 8s ease infinite;
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in {
            animation: fadeIn 0.8s ease-out forwards;
          }
          .animate-fade-in-delay-1 {
            opacity: 0;
            animation: fadeIn 0.8s ease-out 0.2s forwards;
          }
          .animate-fade-in-delay-2 {
            opacity: 0;
            animation: fadeIn 0.8s ease-out 0.4s forwards;
          }
        `}</style>
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

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <ServiceCard
              href="/services?category=web"
              title="Web Apps"
              description="Full-featured web applications with modern frameworks and scalable architecture."
              cta="View services"
            />
            <ServiceCard
              href="/services?category=web"
              title="Websites"
              description="Custom websites built with modern technologies. Fast, secure, and beautifully designed."
              cta="View services"
            />
            <ServiceCard
              href="/services?category=app"
              title="Mobile Development"
              description="Native and cross-platform mobile apps for iOS and Android."
              cta="Learn more"
            />
            <ServiceCard
              href="/custom-3d-printing"
              title="Custom Manufacturing"
              description="Upload your designs and receive instant quotes. From prototypes to production runs."
              cta="Request quote"
            />
          </div>
        </div>
      </section>

      {/* Recent Projects Section */}
      <section className="py-16 md:py-32">
        <div className="container mx-auto px-6">
          <div className="mb-12 md:mb-20">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">Recent Projects</h2>
            <p className="text-lg md:text-xl text-text-secondary max-w-2xl">
              Innovative solutions we've built for our clients
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <ProjectCard
              href="/projects/motorev"
              title="MotoRev"
              category="Mobile App"
              description="Comprehensive motorcycle tracking and community platform"
            />
            <ProjectCard
              href="/projects/leadchopper"
              title="LeadChopper"
              category="Web App"
              description="Real estate lead management and analytics platform"
            />
            <ProjectCard
              href="/projects/bookfade"
              title="BookFade"
              category="Mobile App"
              description="Social reading platform connecting book enthusiasts"
            />
          </div>
        </div>
      </section>

      {/* MotoRev Section */}
      <section className="py-16 md:py-32 bg-surface">
        <div className="container mx-auto px-6">
          <div className="max-w-5xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-8 md:gap-12 items-center">
              <div>
                <div className="text-xs md:text-sm font-semibold text-accent mb-4 tracking-wider">FEATURED PROJECT</div>
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">MotoRev</h2>
                <p className="text-lg md:text-xl text-text-secondary mb-8 leading-relaxed">
                  A comprehensive mobile application for motorcycle enthusiasts.
                  Track your rides, connect with the community, and manage your garage.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link
                    href="/projects/motorev"
                    className="group px-6 py-3 border border-border rounded-lg hover:bg-background transition-all inline-flex items-center justify-center hover:border-text-primary"
                  >
                    Learn more
                  </Link>
                  <a
                    href="https://motorevapp.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group px-6 py-3 bg-text-primary text-background rounded-lg hover:bg-text-secondary transition-all inline-flex items-center justify-center hover:scale-105"
                  >
                    Visit MotoRev
                    <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              </div>
              <div className="bg-background rounded-2xl p-6 md:p-12 border border-border hover:border-accent/50 transition-all">
                <div className="space-y-4 md:space-y-6">
                  <FeatureItem title="GPS Ride Tracking" description="Advanced tracking with detailed analytics" />
                  <FeatureItem title="Rider Community" description="Connect with fellow motorcycle enthusiasts" />
                  <FeatureItem title="Safety Features" description="Crash detection and emergency contacts" />
                  <FeatureItem title="Garage Management" description="Track maintenance and modifications" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-surface to-background" />
        <div className="container mx-auto px-6 relative z-10">
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
              className="group inline-flex items-center px-10 py-5 bg-text-primary text-background rounded-lg text-lg font-medium hover:bg-text-secondary transition-all hover:scale-105 hover:shadow-xl hover:shadow-text-primary/20"
            >
              Contact us
              <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>
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

function ServiceCard({ href, title, description, cta }: { href: string; title: string; description: string; cta: string }) {
  return (
    <Link
      href={href}
      className="group relative p-6 md:p-8 bg-background border border-border rounded-2xl hover:border-text-primary transition-all overflow-hidden hover:scale-105 hover:shadow-xl"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="relative z-10">
        <h3 className="text-xl md:text-2xl font-bold mb-3">{title}</h3>
        <p className="text-text-secondary mb-6 leading-relaxed text-sm">
          {description}
        </p>
        <div className="text-text-primary group-hover:translate-x-2 transition-transform inline-flex items-center text-sm">
          {cta}
          <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </div>
      </div>
    </Link>
  )
}

function ProjectCard({ href, title, category, description }: { href: string; title: string; category: string; description: string }) {
  return (
    <Link
      href={href}
      className="group relative p-8 bg-surface border border-border rounded-2xl hover:border-text-primary transition-all overflow-hidden hover:scale-105 hover:shadow-xl"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="relative z-10">
        <div className="text-xs font-semibold text-accent mb-3 tracking-wider">{category}</div>
        <h3 className="text-2xl font-bold mb-3">{title}</h3>
        <p className="text-text-secondary mb-6 leading-relaxed text-sm">
          {description}
        </p>
        <div className="text-text-primary group-hover:translate-x-2 transition-transform inline-flex items-center text-sm font-medium">
          View project
          <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </div>
      </div>
    </Link>
  )
}

function FeatureItem({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex items-start gap-4 group">
      <div className="w-2 h-2 rounded-full bg-accent mt-2 group-hover:scale-150 transition-transform" />
      <div>
        <div className="font-semibold mb-1">{title}</div>
        <div className="text-text-secondary text-sm">{description}</div>
      </div>
    </div>
  )
}
