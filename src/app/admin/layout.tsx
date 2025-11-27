'use client'

import { ReactNode, useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  const isActive = (path: string) => pathname === path

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

  const navItems = [
    { href: '/admin', label: 'Dashboard' },
    { href: '/admin/products', label: 'Products' },
    { href: '/admin/orders', label: 'Orders' },
    { href: '/admin/custom-requests', label: '3D Print Requests' },
    { href: '/admin/inquiries', label: 'Service Inquiries' },
    { href: '/admin/settings', label: 'Settings' },
  ]

  const closeMobileMenu = () => {
    if (isMobile) {
      setIsMobileMenuOpen(false)
    }
  }

  return (
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
            <Image
              src="/logo.svg"
              alt="47 Industries"
              width={40}
              height={40}
              style={{ borderRadius: '10px' }}
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
            <Link
              key={item.href}
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
        transition: 'margin-left 0.3s ease-in-out'
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
              {!isMobile && (
                <div style={{ textAlign: 'right' }}>
                  <p style={{
                    fontSize: '14px',
                    fontWeight: 500,
                    margin: 0,
                    whiteSpace: 'nowrap'
                  }}>{session?.user?.name || 'Admin User'}</p>
                  <p style={{
                    fontSize: '12px',
                    color: '#71717a',
                    margin: 0,
                    whiteSpace: 'nowrap'
                  }}>{session?.user?.email || 'admin@47industries.com'}</p>
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
          padding: isMobile ? '16px' : '32px'
        }}>
          {children}
        </main>
      </div>
    </div>
  )
}
