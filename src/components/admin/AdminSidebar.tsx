'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useSearchParams } from 'next/navigation'

interface NavItem {
  label: string
  href: string
  icon?: string
  subitems?: { label: string; href: string; tabValue?: string }[]
}

interface NavSection {
  title?: string
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
  const [expandedItems, setExpandedItems] = useState<string[]>([])

  const navSections: NavSection[] = [
    {
      items: [
        { label: 'Dashboard', href: '/admin' },
        { label: 'Analytics', href: '/admin/analytics' },
      ],
    },
    {
      title: 'Shop',
      items: [
        { label: 'Products', href: '/admin/products' },
        { label: 'Categories', href: '/admin/categories' },
        { label: 'Orders', href: '/admin/orders' },
        { label: 'Inventory', href: '/admin/inventory' },
        { label: 'Returns', href: '/admin/returns' },
      ],
    },
    {
      title: 'Services',
      items: [
        { label: 'Service Packages', href: '/admin/services' },
        { label: 'Portfolio', href: '/admin/services/projects/new' },
        {
          label: 'Inquiries',
          href: '/admin/inquiries',
          subitems: [
            { label: '3D Print Requests', href: '/admin/inquiries', tabValue: 'print-requests' },
            { label: 'Service Inquiries', href: '/admin/inquiries', tabValue: 'service-inquiries' },
            { label: 'General Inquiries', href: '/admin/inquiries', tabValue: 'contact-forms' },
          ],
        },
      ],
    },
    {
      title: 'CRM',
      items: [
        { label: 'Clients', href: '/admin/clients' },
        { label: 'Invoices', href: '/admin/invoices' },
        { label: 'Partners', href: '/admin/partners' },
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
      title: 'Customers',
      items: [
        { label: 'All Customers', href: '/admin/customers' },
        { label: 'Users', href: '/admin/users' },
      ],
    },
    {
      title: 'Settings',
      items: [
        { label: 'General', href: '/admin/settings' },
        { label: 'Shipping', href: '/admin/settings/shipping' },
        { label: 'Tax', href: '/admin/settings/tax' },
        { label: 'OAuth Apps', href: '/admin/oauth-applications' },
        { label: 'Notifications', href: '/admin/notifications' },
      ],
    },
  ]

  // Flatten items for auto-expand logic
  const allNavItems = navSections.flatMap((section) => section.items)

  // Auto-expand items based on current path
  useEffect(() => {
    const itemsToExpand: string[] = []
    allNavItems.forEach((item) => {
      if (item.subitems) {
        const hasActiveSubitem = item.subitems.some((sub) => {
          if (sub.tabValue) {
            const currentTab = searchParams.get('tab')
            return pathname === sub.href && currentTab === sub.tabValue
          }
          return pathname.startsWith(sub.href)
        })
        if (hasActiveSubitem || pathname.startsWith(item.href)) {
          itemsToExpand.push(item.label)
        }
      }
    })
    setExpandedItems(itemsToExpand)
  }, [pathname, searchParams])

  const toggleExpanded = (label: string) => {
    setExpandedItems((prev) =>
      prev.includes(label) ? prev.filter((item) => item !== label) : [...prev, label]
    )
  }

  const isActive = (href: string, tabValue?: string) => {
    if (tabValue) {
      const currentTab = searchParams.get('tab')
      const basePath = href.split('?')[0]
      return pathname === basePath && currentTab === tabValue
    }
    if (href === '/admin') {
      return pathname === '/admin'
    }
    return pathname.startsWith(href) && href !== '#'
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
          width: '256px',
          height: '100vh',
          position: 'fixed',
          top: 0,
          left: isMobile ? (isMobileMenuOpen ? 0 : '-256px') : 0,
          background: '#0a0a0a',
          borderRight: '1px solid #27272a',
          overflowY: 'auto',
          transition: 'left 0.3s ease',
          zIndex: 50,
        }}
      >
        <div style={{ padding: '24px 16px' }}>
          {/* Logo and Branding */}
          <Link href="/admin" style={{ textDecoration: 'none', display: 'block', marginBottom: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '0 4px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  background: 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)',
                  border: '1px solid #27272a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Image
                  src="/logo.png"
                  alt="47 Industries"
                  width={32}
                  height={32}
                  style={{ objectFit: 'contain' }}
                />
              </div>
              <div>
                <h1
                  className={brandingFontClass}
                  style={{
                    fontSize: '18px',
                    fontWeight: 700,
                    color: 'white',
                    margin: 0,
                    letterSpacing: '-0.02em',
                    lineHeight: 1.2,
                  }}
                >
                  <span style={{ color: '#3b82f6' }}>47</span> Admin
                </h1>
                <p
                  style={{
                    fontSize: '10px',
                    color: '#52525b',
                    margin: 0,
                    marginTop: '2px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    fontWeight: 500,
                  }}
                >
                  Control Center
                </p>
              </div>
            </div>
          </Link>

          <nav>
            {navSections.map((section, sectionIndex) => (
              <div key={sectionIndex} style={{ marginBottom: '20px' }}>
                {section.title && (
                  <p
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      color: '#71717a',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      padding: '0 8px',
                      marginBottom: '8px',
                    }}
                  >
                    {section.title}
                  </p>
                )}
                {section.items.map((item) => (
                  <div key={item.label} style={{ marginBottom: '2px' }}>
                    {item.subitems ? (
                      <>
                        <button
                          onClick={() => toggleExpanded(item.label)}
                          style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px 12px',
                            background: expandedItems.includes(item.label) ? '#18181b' : 'transparent',
                            border: 'none',
                            borderRadius: '6px',
                            color: expandedItems.includes(item.label) ? 'white' : '#a1a1aa',
                            fontSize: '13px',
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                          }}
                          onMouseEnter={(e) => {
                            if (!expandedItems.includes(item.label)) {
                              e.currentTarget.style.background = '#18181b'
                              e.currentTarget.style.color = 'white'
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!expandedItems.includes(item.label)) {
                              e.currentTarget.style.background = 'transparent'
                              e.currentTarget.style.color = '#a1a1aa'
                            }
                          }}
                        >
                          <span>{item.label}</span>
                          <svg
                            style={{
                              width: '12px',
                              height: '12px',
                              transform: expandedItems.includes(item.label)
                                ? 'rotate(90deg)'
                                : 'rotate(0deg)',
                              transition: 'transform 0.15s',
                            }}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                        {expandedItems.includes(item.label) && (
                          <div style={{ marginLeft: '12px', marginTop: '4px', borderLeft: '1px solid #27272a', paddingLeft: '12px' }}>
                            {item.subitems.map((subitem) => {
                              const active = isActive(subitem.href, subitem.tabValue)
                              const href = subitem.tabValue
                                ? `${subitem.href}?tab=${subitem.tabValue}`
                                : subitem.href
                              return (
                                <Link
                                  key={subitem.label}
                                  href={href}
                                  onClick={isMobile ? onCloseMobile : undefined}
                                  style={{
                                    display: 'block',
                                    padding: '6px 12px',
                                    background: active ? '#3b82f6' : 'transparent',
                                    borderRadius: '4px',
                                    color: active ? 'white' : '#a1a1aa',
                                    fontSize: '12px',
                                    textDecoration: 'none',
                                    marginBottom: '2px',
                                    transition: 'all 0.15s',
                                  }}
                                  onMouseEnter={(e) => {
                                    if (!active) {
                                      e.currentTarget.style.background = '#18181b'
                                      e.currentTarget.style.color = 'white'
                                    }
                                  }}
                                  onMouseLeave={(e) => {
                                    if (!active) {
                                      e.currentTarget.style.background = 'transparent'
                                      e.currentTarget.style.color = '#a1a1aa'
                                    }
                                  }}
                                >
                                  {subitem.label}
                                </Link>
                              )
                            })}
                          </div>
                        )}
                      </>
                    ) : (
                      <Link
                        href={item.href}
                        onClick={isMobile ? onCloseMobile : undefined}
                        style={{
                          display: 'block',
                          padding: '8px 12px',
                          background: isActive(item.href) ? '#3b82f6' : 'transparent',
                          borderRadius: '6px',
                          color: isActive(item.href) ? 'white' : '#a1a1aa',
                          fontSize: '13px',
                          textDecoration: 'none',
                          transition: 'all 0.15s',
                        }}
                        onMouseEnter={(e) => {
                          if (!isActive(item.href)) {
                            e.currentTarget.style.background = '#18181b'
                            e.currentTarget.style.color = 'white'
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive(item.href)) {
                            e.currentTarget.style.background = 'transparent'
                            e.currentTarget.style.color = '#a1a1aa'
                          }
                        }}
                      >
                        {item.label}
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </nav>

          {/* Version */}
          <div style={{ marginTop: '32px', padding: '0 8px' }}>
            <p style={{ fontSize: '11px', color: '#52525b' }}>
              47 Industries Admin v1.0
            </p>
          </div>
        </div>
      </aside>
    </>
  )
}
