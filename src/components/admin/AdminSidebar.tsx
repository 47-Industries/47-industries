'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useSearchParams } from 'next/navigation'

interface NavItem {
  label: string
  href: string
  badge?: string
}

interface NavSection {
  title: string
  items: NavItem[]
}

interface AdminSidebarProps {
  isMobile: boolean
  isMobileMenuOpen: boolean
  onCloseMobile: () => void
  brandingFontClass?: string
}

export default function AdminSidebar({ isMobile, isMobileMenuOpen, onCloseMobile, brandingFontClass }: AdminSidebarProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [collapsedSections, setCollapsedSections] = useState<string[]>([])

  const navSections: NavSection[] = [
    {
      title: 'Overview',
      items: [
        { label: 'Dashboard', href: '/admin' },
        { label: 'Analytics', href: '/admin/analytics' },
      ],
    },
    {
      title: 'Sales',
      items: [
        { label: 'Orders', href: '/admin/orders' },
        { label: 'Invoices', href: '/admin/invoices' },
        { label: 'Returns', href: '/admin/returns' },
      ],
    },
    {
      title: 'Products',
      items: [
        { label: 'All Products', href: '/admin/products' },
        { label: 'Categories', href: '/admin/categories' },
        { label: 'Inventory', href: '/admin/inventory' },
        { label: 'Variants', href: '/admin/products/variants' },
      ],
    },
    {
      title: 'Services',
      items: [
        { label: 'Packages', href: '/admin/services' },
        { label: 'Portfolio', href: '/admin/services/projects/new' },
        { label: 'Inquiries', href: '/admin/inquiries' },
        { label: '3D Print Requests', href: '/admin/custom-requests' },
      ],
    },
    {
      title: 'Clients',
      items: [
        { label: 'All Clients', href: '/admin/clients' },
      ],
    },
    {
      title: 'Partners',
      items: [
        { label: 'All Partners', href: '/admin/partners' },
        { label: 'Leads', href: '/admin/partners/leads' },
        { label: 'Commissions', href: '/admin/partners/commissions' },
        { label: 'Payouts', href: '/admin/partners/payouts' },
      ],
    },
    {
      title: 'People',
      items: [
        { label: 'Customers', href: '/admin/users' },
        { label: 'Team', href: '/admin/team' },
      ],
    },
    {
      title: 'Finance',
      items: [
        { label: 'Expenses', href: '/admin/expenses' },
        { label: 'Reports', href: '/admin/reports' },
      ],
    },
    {
      title: 'Marketing',
      items: [
        { label: 'Campaigns', href: '/admin/marketing' },
        { label: 'Email', href: '/admin/email' },
        { label: 'Blog', href: '/admin/blog' },
      ],
    },
    {
      title: 'Settings',
      items: [
        { label: 'General', href: '/admin/settings' },
        { label: 'Shipping', href: '/admin/settings/shipping' },
        { label: 'Tax', href: '/admin/settings/tax' },
        { label: 'Notifications', href: '/admin/notifications' },
        { label: 'OAuth Apps', href: '/admin/oauth-applications' },
      ],
    },
  ]

  const toggleSection = (title: string) => {
    setCollapsedSections((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]
    )
  }

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin'
    }
    return pathname.startsWith(href)
  }

  // Check if section has active item
  const sectionHasActiveItem = (section: NavSection) => {
    return section.items.some((item) => isActive(item.href))
  }

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && isMobileMenuOpen && (
        <div
          onClick={onCloseMobile}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 40,
          }}
        />
      )}

      {/* Sidebar */}
      <aside
        style={{
          width: '240px',
          height: '100vh',
          position: 'fixed',
          top: 0,
          left: isMobile ? (isMobileMenuOpen ? 0 : '-240px') : 0,
          background: '#0a0a0a',
          borderRight: '1px solid #1f1f1f',
          overflowY: 'auto',
          transition: 'left 0.3s ease',
          zIndex: 50,
        }}
      >
        <div style={{ padding: '20px 12px' }}>
          {/* Logo and Branding */}
          <Link href="/admin" style={{ textDecoration: 'none', display: 'block', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0 8px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  background: '#111',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Image
                  src="/logo.png"
                  alt="47 Industries"
                  width={28}
                  height={28}
                  style={{ objectFit: 'contain' }}
                />
              </div>
              <div>
                <h1
                  className={brandingFontClass}
                  style={{
                    fontSize: '16px',
                    fontWeight: 700,
                    color: 'white',
                    margin: 0,
                    letterSpacing: '-0.02em',
                  }}
                >
                  47 Industries
                </h1>
                <p
                  style={{
                    fontSize: '10px',
                    color: '#525252',
                    margin: 0,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Admin
                </p>
              </div>
            </div>
          </Link>

          <nav>
            {navSections.map((section) => {
              const isCollapsed = collapsedSections.includes(section.title)
              const hasActive = sectionHasActiveItem(section)

              return (
                <div key={section.title} style={{ marginBottom: '4px' }}>
                  {/* Section Header */}
                  <button
                    onClick={() => toggleSection(section.title)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      background: 'transparent',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#141414'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent'
                    }}
                  >
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        color: hasActive ? '#3b82f6' : '#737373',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      {section.title}
                    </span>
                    <svg
                      style={{
                        width: '12px',
                        height: '12px',
                        color: '#525252',
                        transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                        transition: 'transform 0.15s',
                      }}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Section Items */}
                  {!isCollapsed && (
                    <div style={{ marginTop: '2px' }}>
                      {section.items.map((item) => {
                        const active = isActive(item.href)
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={isMobile ? onCloseMobile : undefined}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '7px 12px 7px 24px',
                              background: active ? '#1a1a2e' : 'transparent',
                              borderRadius: '6px',
                              color: active ? '#3b82f6' : '#a3a3a3',
                              fontSize: '13px',
                              textDecoration: 'none',
                              transition: 'all 0.15s',
                              marginBottom: '1px',
                            }}
                            onMouseEnter={(e) => {
                              if (!active) {
                                e.currentTarget.style.background = '#141414'
                                e.currentTarget.style.color = '#e5e5e5'
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!active) {
                                e.currentTarget.style.background = 'transparent'
                                e.currentTarget.style.color = '#a3a3a3'
                              }
                            }}
                          >
                            <span>{item.label}</span>
                            {item.badge && (
                              <span
                                style={{
                                  fontSize: '10px',
                                  padding: '2px 6px',
                                  background: '#3b82f6',
                                  color: 'white',
                                  borderRadius: '10px',
                                  fontWeight: 600,
                                }}
                              >
                                {item.badge}
                              </span>
                            )}
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </nav>

          {/* Footer */}
          <div style={{ marginTop: '24px', padding: '12px', borderTop: '1px solid #1f1f1f' }}>
            <p style={{ fontSize: '10px', color: '#404040', margin: 0 }}>
              47 Industries v2.0
            </p>
          </div>
        </div>
      </aside>
    </>
  )
}
