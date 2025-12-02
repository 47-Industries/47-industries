'use client'

import { ReactNode, useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import NotificationBell from '@/components/admin/NotificationBell'

interface NavItem {
  href: string
  label: string
  subItems?: { href: string; label: string }[]
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session, status } = useSession()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [expandedItems, setExpandedItems] = useState<string[]>([])

  // Check if a path is active (exact match or starts with for nested routes)
  const isActive = (path: string) => pathname === path
  const isActiveOrChild = (path: string) => pathname === path || pathname.startsWith(path + '/')

  // Consolidated navigation structure - must be defined before useEffect that uses it
  const navItems: NavItem[] = [
    { href: '/admin', label: 'Dashboard' },
    { href: '/admin/analytics', label: 'Analytics' },
    { href: '/admin/email', label: 'Email' },
    {
      href: '/admin/products',
      label: 'Products',
      subItems: [
        { href: '/admin/products?tab=products', label: 'All Products' },
        { href: '/admin/products?tab=categories', label: 'Categories' },
        { href: '/admin/products?tab=inventory', label: 'Inventory' },
      ]
    },
    {
      href: '/admin/orders',
      label: 'Orders',
      subItems: [
        { href: '/admin/orders?tab=orders', label: 'All Orders' },
        { href: '/admin/orders?tab=returns', label: 'Returns & RMA' },
      ]
    },
    {
      href: '/admin/users',
      label: 'Users',
      subItems: [
        { href: '/admin/users?tab=customers', label: 'Customers' },
        { href: '/admin/users?tab=admins', label: 'Admins' },
      ]
    },
    { href: '/admin/services', label: 'Services' },
    {
      href: '/admin/inquiries',
      label: 'Inquiries',
      subItems: [
        { href: '/admin/inquiries?tab=print-requests', label: '3D Print Requests' },
        { href: '/admin/inquiries?tab=service-inquiries', label: 'Service Inquiries' },
      ]
    },
    { href: '/admin/reports', label: 'Reports' },
    { href: '/admin/blog', label: 'Blog' },
    { href: '/admin/settings', label: 'Settings' },
  ]

  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  // SECURITY: Redirect to login if not authenticated or not an admin
  useEffect(() => {
    // Skip check for login page
    if (pathname === '/admin/login') return

    // Wait for session to load
    if (status === 'loading') return

    // If not authenticated, redirect to login
    if (status === 'unauthenticated' || !session) {
      router.replace('/admin/login')
      return
    }

    // If authenticated but not an admin, redirect to login
    if (session?.user?.role !== 'ADMIN' && session?.user?.role !== 'SUPER_ADMIN') {
      router.replace('/admin/login')
      return
    }
  }, [session, status, pathname, router])

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false)
      }
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Auto-expand items that contain the current path
  useEffect(() => {
    navItems.forEach(item => {
      if (item.subItems) {
        const hasActiveChild = item.subItems.some(sub => pathname.startsWith(sub.href))
        if (hasActiveChild && !expandedItems.includes(item.href)) {
          setExpandedItems(prev => [...prev, item.href])
        }
      }
    })
  }, [pathname])

  // SECURITY: Don't render anything until we verify authentication
  // This prevents any flash of admin content for unauthenticated users
  if (pathname !== '/admin/login') {
    if (status === 'loading') {
      return (
        <div style={{
          minHeight: '100vh',
          background: '#000000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff'
        }}>
          <div>Loading...</div>
        </div>
      )
    }

    if (status === 'unauthenticated' || !session) {
      return (
        <div style={{
          minHeight: '100vh',
          background: '#000000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff'
        }}>
          <div>Redirecting to login...</div>
        </div>
      )
    }

    if (session?.user?.role !== 'ADMIN' && session?.user?.role !== 'SUPER_ADMIN') {
      return (
        <div style={{
          minHeight: '100vh',
          background: '#000000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff'
        }}>
          <div>Access denied. Redirecting...</div>
        </div>
      )
    }
  }

  const toggleExpanded = (href: string) => {
    setExpandedItems(prev =>
      prev.includes(href)
        ? prev.filter(h => h !== href)
        : [...prev, href]
    )
  }

  const closeMobileMenu = () => {
    if (isMobile) {
      setIsMobileMenuOpen(false)
    }
  }

  return (
    <>
      <head>
        <link rel="icon" href="https://47industries.com/logo.png" />
        <link rel="apple-touch-icon" href="https://47industries.com/logo.png" />
      </head>
      <div style={{
        minHeight: '100vh',
        background: '#000000',
        color: '#ffffff',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        margin: 0,
        padding: 0
      }}>
      {/* Mobile Overlay */}
      {isMobile && isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 40,
            backdropFilter: 'blur(4px)'
          }}
        />
      )}

      {/* Sidebar */}
      <aside style={{
        position: 'fixed',
        left: isMobile && !isMobileMenuOpen ? '-256px' : 0,
        top: 0,
        width: '256px',
        height: '100vh',
        background: '#0a0a0a',
        borderRight: '1px solid #27272a',
        zIndex: 50,
        transition: 'left 0.3s ease-in-out',
        overflowY: 'auto'
      }}>
        <div style={{
          padding: '24px',
          borderBottom: '1px solid #27272a',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Link
            href="/admin"
            onClick={closeMobileMenu}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              textDecoration: 'none'
            }}
          >
            <img
              src="https://47industries.com/logo.png"
              alt=""
              width={40}
              height={40}
              style={{ borderRadius: '10px' }}
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
            <div>
              <div style={{
                fontSize: '20px',
                fontWeight: 700,
                color: '#ffffff',
              }}>
                47 Admin
              </div>
              <div style={{
                fontSize: '12px',
                color: '#71717a',
              }}>Industries Dashboard</div>
            </div>
          </Link>
          {isMobile && (
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#ffffff',
                fontSize: '24px',
                cursor: 'pointer',
                padding: '4px'
              }}
            >
              ✕
            </button>
          )}
        </div>

        <nav style={{ padding: '16px' }}>
          {navItems.map((item) => (
            <div key={item.href}>
              {item.subItems ? (
                // Item with dropdown
                <>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '4px',
                    }}
                  >
                    <Link
                      href={item.href}
                      onClick={closeMobileMenu}
                      style={{
                        flex: 1,
                        display: 'block',
                        padding: '12px 16px',
                        borderRadius: expandedItems.includes(item.href) ? '12px 12px 0 0' : '12px',
                        fontSize: '14px',
                        fontWeight: 500,
                        color: isActiveOrChild(item.href) ? '#ffffff' : '#a1a1aa',
                        textDecoration: 'none',
                        background: isActiveOrChild(item.href) ? '#3b82f6' : 'transparent',
                        transition: 'all 0.2s'
                      }}
                    >
                      {item.label}
                    </Link>
                    <button
                      onClick={() => toggleExpanded(item.href)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: isActiveOrChild(item.href) ? '#ffffff' : '#a1a1aa',
                        cursor: 'pointer',
                        padding: '8px',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginLeft: '-40px',
                        marginRight: '8px',
                        transform: expandedItems.includes(item.href) ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s',
                      }}
                    >
                      ▼
                    </button>
                  </div>
                  {/* Dropdown items */}
                  {expandedItems.includes(item.href) && (
                    <div style={{
                      background: '#18181b',
                      borderRadius: '0 0 12px 12px',
                      marginBottom: '4px',
                      overflow: 'hidden',
                    }}>
                      {item.subItems.map(subItem => (
                        <Link
                          key={subItem.href}
                          href={subItem.href}
                          onClick={closeMobileMenu}
                          style={{
                            display: 'block',
                            padding: '10px 16px 10px 32px',
                            fontSize: '13px',
                            fontWeight: 400,
                            color: pathname.includes(subItem.href.split('?')[0]) && pathname.includes(subItem.href.split('=')[1] || '') ? '#ffffff' : '#a1a1aa',
                            textDecoration: 'none',
                            borderLeft: '2px solid transparent',
                            transition: 'all 0.2s'
                          }}
                        >
                          {subItem.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                // Simple nav item
                <Link
                  href={item.href}
                  onClick={closeMobileMenu}
                  style={{
                    display: 'block',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: 500,
                    color: isActive(item.href) ? '#ffffff' : '#a1a1aa',
                    textDecoration: 'none',
                    background: isActive(item.href) ? '#3b82f6' : 'transparent',
                    marginBottom: '4px',
                    transition: 'all 0.2s'
                  }}
                >
                  {item.label}
                </Link>
              )}
            </div>
          ))}

          <div style={{
            borderTop: '1px solid #27272a',
            margin: '16px 0'
          }} />

          <Link
            href="/"
            onClick={closeMobileMenu}
            style={{
              display: 'block',
              padding: '12px 16px',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: 500,
              color: '#a1a1aa',
              textDecoration: 'none',
              transition: 'all 0.2s'
            }}
          >
            ← Back to Site
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <div style={{
        marginLeft: isMobile ? 0 : '256px',
        transition: 'margin-left 0.3s ease-in-out',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Top Header */}
        <header style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid #27272a'
        }}>
          <div style={{
            padding: isMobile ? '12px 16px' : '16px 32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px'
          }}>
            {/* Hamburger Menu Button (Mobile Only) */}
            {isMobile && (
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '24px',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  flexShrink: 0
                }}
              >
                ☰
              </button>
            )}

            <div style={{ flex: 1, minWidth: 0 }}>
              <h1 style={{
                fontSize: isMobile ? '18px' : '24px',
                fontWeight: 700,
                margin: 0,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>Admin Panel</h1>
              {!isMobile && (
                <p style={{
                  fontSize: '14px',
                  color: '#71717a',
                  marginTop: '4px',
                  margin: 0
                }}>Manage your 47 Industries platform</p>
              )}
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: isMobile ? '8px' : '16px',
              flexShrink: 0
            }}>
              {!isMobile && session?.user && (
                <div style={{ textAlign: 'right' }}>
                  <p style={{
                    fontSize: '14px',
                    fontWeight: 500,
                    margin: 0,
                    whiteSpace: 'nowrap'
                  }}>{session.user.name}</p>
                  <p style={{
                    fontSize: '12px',
                    color: '#71717a',
                    margin: 0,
                    whiteSpace: 'nowrap'
                  }}>{session.user.email}</p>
                </div>
              )}
              <button
                onClick={async () => {
                  const { signOut } = await import('next-auth/react')
                  signOut({ callbackUrl: '/admin/login' })
                }}
                style={{
                  padding: isMobile ? '8px 16px' : '10px 24px',
                  fontSize: '14px',
                  fontWeight: 500,
                  background: '#18181b',
                  color: '#ffffff',
                  border: '1px solid #3f3f46',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap'
                }}
              >{isMobile ? '↗' : 'Logout'}</button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main style={{
          padding: isMobile ? '16px' : '32px',
          flex: 1,
          overflow: 'auto'
        }}>
          {children}
        </main>
      </div>

      {/* Floating Notification Bell */}
      <NotificationBell />
    </div>
    </>
  )
}
