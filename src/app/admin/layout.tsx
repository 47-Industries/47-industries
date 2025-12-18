'use client'

import { ReactNode, useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import NotificationBell from '@/components/admin/NotificationBell'
import { ToastProvider } from '@/components/ui/Toast'

interface NavItem {
  href: string
  label: string
  subItems?: { href: string; label: string }[]
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session, status } = useSession()
  const [mounted, setMounted] = useState(false)
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
    { href: '/admin/expenses', label: 'Expenses' },
    { href: '/admin/oauth-applications', label: 'OAuth Apps' },
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

  // Detect mobile screen size and set mounted
  useEffect(() => {
    setMounted(true)
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

  // Login page gets NO admin layout - just render children directly
  if (pathname === '/admin/login') {
    return <>{children}</>
  }

  // SECURITY: Don't render anything until we verify authentication
  // This prevents any flash of admin content for unauthenticated users
  // Wait for client-side mount to prevent hydration issues
  if (!mounted || status === 'loading') {
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

  // Use consistent values for SSR to prevent hydration mismatch
  // Only apply mobile styles after component has mounted on client
  const showMobile = mounted && isMobile

  return (
    <ToastProvider>
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
      {showMobile && isMobileMenuOpen && (
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
        left: showMobile && !isMobileMenuOpen ? '-256px' : 0,
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
          {showMobile && (
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
                    onClick={(e) => {
                      // If clicking directly on the text label, navigate
                      // Otherwise toggle the dropdown
                      const target = e.target as HTMLElement
                      if (target.tagName === 'SPAN' && target.dataset.navLabel === 'true') {
                        closeMobileMenu()
                        router.push(item.href)
                      } else {
                        toggleExpanded(item.href)
                      }
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '4px',
                      padding: '12px 16px',
                      borderRadius: expandedItems.includes(item.href) ? '12px 12px 0 0' : '12px',
                      background: isActiveOrChild(item.href) ? '#3b82f6' : 'transparent',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    <span
                      data-nav-label="true"
                      style={{
                        fontSize: '14px',
                        fontWeight: 500,
                        color: isActiveOrChild(item.href) ? '#ffffff' : '#a1a1aa',
                        cursor: 'pointer',
                      }}
                    >
                      {item.label}
                    </span>
                    <span
                      style={{
                        color: isActiveOrChild(item.href) ? '#ffffff' : '#a1a1aa',
                        fontSize: '10px',
                        transform: expandedItems.includes(item.href) ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s',
                        padding: '4px',
                      }}
                    >
                      ▼
                    </span>
                  </div>
                  {/* Dropdown items */}
                  {expandedItems.includes(item.href) && (
                    <div style={{
                      background: '#18181b',
                      borderRadius: '0 0 12px 12px',
                      marginBottom: '4px',
                      overflow: 'hidden',
                    }}>
                      {item.subItems.map(subItem => {
                        // Parse the href to check if this sub-item is active
                        const [basePath, queryString] = subItem.href.split('?')
                        const tabValue = queryString?.split('=')[1]
                        const currentTab = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('tab') : null
                        const isSubActive = pathname === basePath && currentTab === tabValue

                        return (
                          <div
                            key={subItem.href}
                            onClick={() => {
                              closeMobileMenu()
                              router.push(subItem.href)
                            }}
                            style={{
                              display: 'block',
                              padding: '10px 16px 10px 32px',
                              fontSize: '13px',
                              fontWeight: isSubActive ? 500 : 400,
                              color: isSubActive ? '#ffffff' : '#a1a1aa',
                              cursor: 'pointer',
                              borderLeft: isSubActive ? '2px solid #3b82f6' : '2px solid transparent',
                              transition: 'all 0.2s',
                              background: isSubActive ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                            }}
                          >
                            {subItem.label}
                          </div>
                        )
                      })}
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
        marginLeft: showMobile ? 0 : '256px',
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
            padding: showMobile ? '12px 16px' : '16px 32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px'
          }}>
            {/* Hamburger Menu Button (Mobile Only) */}
            {showMobile && (
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
                fontSize: showMobile ? '18px' : '24px',
                fontWeight: 700,
                margin: 0,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>Admin Panel</h1>
              {!showMobile && (
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
              gap: showMobile ? '8px' : '16px',
              flexShrink: 0
            }}>
              {!showMobile && session?.user && (
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
                  padding: showMobile ? '8px 16px' : '10px 24px',
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
              >{showMobile ? '↗' : 'Logout'}</button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main style={{
          padding: showMobile ? '16px' : '32px',
          flex: 1,
          overflow: 'auto'
        }}>
          {children}
        </main>
      </div>

      {/* Floating Notification Bell */}
      <NotificationBell />
    </div>
    </ToastProvider>
  )
}
