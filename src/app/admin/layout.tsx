'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import './admin.css'

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  const isActive = (path: string) => pathname === path

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: '📊' },
    { href: '/admin/products', label: 'Products', icon: '📦' },
    { href: '/admin/orders', label: 'Orders', icon: '🛒' },
    { href: '/admin/custom-requests', label: '3D Print Requests', icon: '🖨️' },
    { href: '/admin/inquiries', label: 'Service Inquiries', icon: '💬' },
    { href: '/admin/settings', label: 'Settings', icon: '⚙️' },
  ]

  return (
    <div className="admin-container">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <Link href="/admin" className="admin-logo">
            47 Admin
          </Link>
          <div className="admin-logo-subtitle">Industries Dashboard</div>
        </div>

        <nav className="admin-nav">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`admin-nav-item ${isActive(item.href) ? 'active' : ''}`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}

          <div className="admin-nav-divider" />

          <Link href="/" className="admin-nav-item">
            <span>←</span>
            Back to Site
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="admin-main">
        {/* Top Header */}
        <header className="admin-header">
          <div className="admin-header-content">
            <div>
              <h1 className="admin-header-title">Admin Panel</h1>
              <p className="admin-header-subtitle">Manage your 47 Industries platform</p>
            </div>
            <div className="admin-header-user">
              <div className="admin-user-info">
                <p className="admin-user-name">Admin User</p>
                <p className="admin-user-email">admin@47industries.com</p>
              </div>
              <button className="admin-logout-btn">
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="admin-content">
          {children}
        </main>
      </div>
    </div>
  )
}
