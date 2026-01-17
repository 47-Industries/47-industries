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
