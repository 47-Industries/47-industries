"use client"

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Logo from './Logo'
import { useCart } from '@/lib/cart-store'

interface FeaturedProject {
  id: string
  title: string
  slug: string
}

interface FeatureSettings {
  shopEnabled: boolean
  custom3DPrintingEnabled: boolean
  webDevServicesEnabled: boolean
  appDevServicesEnabled: boolean
  motorevEnabled: boolean
  featuredProjects: FeaturedProject[]
}

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const [features, setFeatures] = useState<FeatureSettings>({
    shopEnabled: true,
    custom3DPrintingEnabled: true,
    webDevServicesEnabled: true,
    appDevServicesEnabled: true,
    motorevEnabled: true,
    featuredProjects: [],
  })
  const { getItemCount } = useCart()
  const { data: session, status } = useSession()

  useEffect(() => {
    setMounted(true)
    // Fetch feature settings
    fetch('/api/settings/features')
      .then(res => res.json())
      .then(data => setFeatures(data))
      .catch(err => console.error('Failed to fetch features:', err))
  }, [])

  // Close account menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (accountMenuOpen && !(e.target as Element).closest('.account-menu-container')) {
        setAccountMenuOpen(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [accountMenuOpen])

  const itemCount = mounted ? getItemCount() : 0
  const isLoggedIn = status === 'authenticated' && session?.user

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Logo />

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {features.shopEnabled && (
              <Link href="/shop" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
                Shop
              </Link>
            )}
            {features.custom3DPrintingEnabled && (
              <Link href="/custom-3d-printing" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
                Custom Manufacturing
              </Link>
            )}
            {(features.webDevServicesEnabled || features.appDevServicesEnabled) && (
              <Link href="/services" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
                Services
              </Link>
            )}
            {/* Featured Projects - show in navbar when marked as featured */}
            {features.featuredProjects.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.slug}`}
                className="text-sm text-text-secondary hover:text-text-primary transition-colors"
              >
                {project.title}
              </Link>
            ))}
            <Link href="/about" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
              About
            </Link>
            <Link href="/contact" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
              Contact
            </Link>
          </div>

          {/* Cart & Auth */}
          <div className="hidden md:flex items-center gap-2">
            <Link href="/cart" className="relative text-text-secondary hover:text-text-primary transition-colors p-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent text-white text-xs rounded-full flex items-center justify-center font-medium">
                  {itemCount > 9 ? '9+' : itemCount}
                </span>
              )}
            </Link>

            {mounted && (
              isLoggedIn ? (
                <div className="relative account-menu-container">
                  <button
                    onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                    className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors p-2"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </button>
                  {accountMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-surface border border-border rounded-lg shadow-lg overflow-hidden z-50">
                      <div className="px-4 py-3 border-b border-border">
                        <p className="text-sm font-medium text-text-primary truncate">{session?.user?.name || 'User'}</p>
                        <p className="text-xs text-text-secondary truncate">{session?.user?.email}</p>
                      </div>
                      <Link
                        href="/account"
                        className="block px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-elevated transition-colors"
                        onClick={() => setAccountMenuOpen(false)}
                      >
                        My Account
                      </Link>
                      <Link
                        href="/account/orders"
                        className="block px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-elevated transition-colors"
                        onClick={() => setAccountMenuOpen(false)}
                      >
                        My Orders
                      </Link>
                      <button
                        onClick={async () => {
                          const { signOut } = await import('next-auth/react')
                          signOut({ callbackUrl: '/' })
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-surface-elevated transition-colors"
                      >
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    href="/login"
                    className="text-sm text-text-secondary hover:text-text-primary transition-colors px-3 py-2"
                  >
                    Log In
                  </Link>
                  <Link
                    href="/register"
                    className="text-sm bg-accent hover:bg-accent/90 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Sign Up
                  </Link>
                </div>
              )
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            {mounted && isLoggedIn && (
              <Link href="/account" className="text-text-secondary hover:text-text-primary transition-colors p-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </Link>
            )}
            <Link href="/cart" className="relative text-text-secondary hover:text-text-primary transition-colors p-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent text-white text-xs rounded-full flex items-center justify-center font-medium">
                  {itemCount > 9 ? '9+' : itemCount}
                </span>
              )}
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-text-primary"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-6 space-y-4 border-t border-border animate-fadeIn">
            {features.shopEnabled && (
              <Link href="/shop" className="block text-text-secondary hover:text-text-primary transition-colors py-2" onClick={() => setMobileMenuOpen(false)}>
                Shop
              </Link>
            )}
            {features.custom3DPrintingEnabled && (
              <Link href="/custom-3d-printing" className="block text-text-secondary hover:text-text-primary transition-colors py-2" onClick={() => setMobileMenuOpen(false)}>
                Custom Manufacturing
              </Link>
            )}
            {(features.webDevServicesEnabled || features.appDevServicesEnabled) && (
              <Link href="/services" className="block text-text-secondary hover:text-text-primary transition-colors py-2" onClick={() => setMobileMenuOpen(false)}>
                Services
              </Link>
            )}
            {/* Featured Projects - show in mobile menu when marked as featured */}
            {features.featuredProjects.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.slug}`}
                className="block text-text-secondary hover:text-text-primary transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                {project.title}
              </Link>
            ))}
            <Link href="/about" className="block text-text-secondary hover:text-text-primary transition-colors py-2" onClick={() => setMobileMenuOpen(false)}>
              About
            </Link>
            <Link href="/contact" className="block text-text-secondary hover:text-text-primary transition-colors py-2" onClick={() => setMobileMenuOpen(false)}>
              Contact
            </Link>

            {/* Auth section for mobile */}
            <div className="pt-4 border-t border-border">
              {mounted && (
                isLoggedIn ? (
                  <>
                    <Link href="/account" className="block text-text-secondary hover:text-text-primary transition-colors py-2" onClick={() => setMobileMenuOpen(false)}>
                      My Account
                    </Link>
                    <Link href="/account/orders" className="block text-text-secondary hover:text-text-primary transition-colors py-2" onClick={() => setMobileMenuOpen(false)}>
                      My Orders
                    </Link>
                    <button
                      onClick={async () => {
                        const { signOut } = await import('next-auth/react')
                        signOut({ callbackUrl: '/' })
                      }}
                      className="block text-red-400 hover:text-red-300 transition-colors py-2"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <div className="flex gap-3 pt-2">
                    <Link
                      href="/login"
                      className="flex-1 text-center py-3 border border-border rounded-lg text-text-secondary hover:text-text-primary transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Log In
                    </Link>
                    <Link
                      href="/register"
                      className="flex-1 text-center py-3 bg-accent rounded-lg text-white hover:bg-accent/90 transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Sign Up
                    </Link>
                  </div>
                )
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
