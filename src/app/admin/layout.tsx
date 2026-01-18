'use client'

import { ReactNode, useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Space_Grotesk } from 'next/font/google'
import NotificationBell from '@/components/admin/NotificationBell'
import { ToastProvider } from '@/components/ui/Toast'
import AdminSidebar from '@/components/admin/AdminSidebar'

// Modern, geometric font for branding
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['500', '700'],
  variable: '--font-space-grotesk',
})

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session, status } = useSession()
  const [mounted, setMounted] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  // SECURITY: Redirect to login if not authenticated or not an admin
  // Note: On admin subdomain, usePathname() returns the browser URL (e.g., /login, /forgot-password)
  // not the rewritten path (/admin/login, /admin/forgot-password)
  const isAuthExemptPage = pathname === '/admin/login' ||
    pathname === '/login' ||
    pathname === '/admin/forgot-password' ||
    pathname === '/forgot-password' ||
    pathname === '/admin/reset-password' ||
    pathname === '/reset-password' ||
    pathname?.startsWith('/reset-password')

  useEffect(() => {
    // Skip check for login and password reset pages
    if (isAuthExemptPage) return

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
  }, [session, status, isAuthExemptPage, router])

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

  // Login and password reset pages get NO admin layout - just render children directly
  if (isAuthExemptPage) {
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

      {/* Sidebar with Suspense */}
      <Suspense fallback={<div />}>
        <AdminSidebar
          isMobile={showMobile}
          isMobileMenuOpen={isMobileMenuOpen}
          onCloseMobile={closeMobileMenu}
          brandingFontClass={spaceGrotesk.className}
        />
      </Suspense>

      {/* Main Content */}
      <div style={{
        marginLeft: showMobile ? 0 : '240px',
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
              gap: showMobile ? '8px' : '12px',
              flexShrink: 0
            }}>
              {/* Profile Card */}
              {session?.user && (
                <Link
                  href="/admin/account"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: showMobile ? '6px 10px' : '8px 14px',
                    background: '#18181b',
                    border: '1px solid #27272a',
                    borderRadius: '10px',
                    textDecoration: 'none',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#1f1f1f'
                    e.currentTarget.style.borderColor = '#3f3f46'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#18181b'
                    e.currentTarget.style.borderColor = '#27272a'
                  }}
                >
                  {/* Avatar */}
                  {session.user.image ? (
                    <img
                      src={session.user.image}
                      alt={session.user.name || 'Profile'}
                      style={{
                        width: showMobile ? '32px' : '36px',
                        height: showMobile ? '32px' : '36px',
                        borderRadius: '8px',
                        objectFit: 'cover',
                      }}
                    />
                  ) : (
                    <div style={{
                      width: showMobile ? '32px' : '36px',
                      height: showMobile ? '32px' : '36px',
                      borderRadius: '8px',
                      background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: showMobile ? '12px' : '14px',
                      fontWeight: 600,
                    }}>
                      {session.user.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'A'}
                    </div>
                  )}
                  {!showMobile && (
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <p style={{
                          fontSize: '13px',
                          fontWeight: 600,
                          color: 'white',
                          margin: 0,
                          whiteSpace: 'nowrap',
                          maxWidth: '120px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>{session.user.name || 'Admin'}</p>
                        <span style={{
                          fontSize: '9px',
                          fontWeight: 600,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: session.user.role === 'SUPER_ADMIN' ? '#7c3aed20' : '#3b82f620',
                          color: session.user.role === 'SUPER_ADMIN' ? '#a78bfa' : '#60a5fa',
                          textTransform: 'uppercase',
                          letterSpacing: '0.03em'
                        }}>
                          {session.user.role === 'SUPER_ADMIN' ? 'Super' : 'Admin'}
                        </span>
                      </div>
                      <p style={{
                        fontSize: '11px',
                        color: '#71717a',
                        margin: 0,
                        whiteSpace: 'nowrap',
                        maxWidth: '150px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>{session.user.email}</p>
                    </div>
                  )}
                </Link>
              )}
              <button
                onClick={async () => {
                  const { signOut } = await import('next-auth/react')
                  signOut({ callbackUrl: '/admin/login' })
                }}
                style={{
                  padding: showMobile ? '8px 12px' : '10px 16px',
                  fontSize: '13px',
                  fontWeight: 500,
                  background: 'transparent',
                  color: '#a1a1aa',
                  border: '1px solid #27272a',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#27272a'
                  e.currentTarget.style.color = '#ffffff'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = '#a1a1aa'
                }}
              >
                <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                {!showMobile && 'Logout'}
              </button>
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
