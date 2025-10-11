'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

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
    <>
      <style jsx global>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
          margin: 0 !important;
          padding: 0 !important;
          background: #000 !important;
          color: #fff !important;
          font-family: 'Inter', -apple-system, sans-serif !important;
        }

        .admin-wrapper {
          min-height: 100vh;
          background: #000000;
          color: #ffffff;
        }

        .admin-sidebar {
          position: fixed;
          left: 0;
          top: 0;
          width: 256px;
          height: 100vh;
          background: #0a0a0a;
          border-right: 1px solid #27272a;
          z-index: 50;
        }

        .admin-sidebar-header {
          padding: 24px;
          border-bottom: 1px solid #27272a;
        }

        .admin-logo {
          font-size: 24px;
          font-weight: 700;
          color: #ffffff;
          text-decoration: none;
        }

        .admin-logo:hover { color: #3b82f6; }

        .admin-logo-subtitle {
          font-size: 14px;
          color: #71717a;
          margin-top: 4px;
        }

        .admin-nav { padding: 16px; }

        .admin-nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 500;
          color: #a1a1aa;
          text-decoration: none;
          transition: all 0.2s;
          margin-bottom: 4px;
        }

        .admin-nav-item:hover {
          color: #ffffff;
          background: rgba(63, 63, 70, 0.3);
        }

        .admin-nav-item.active {
          background: #3b82f6;
          color: #ffffff;
        }

        .admin-nav-divider {
          border-top: 1px solid #27272a;
          margin: 16px 0;
        }

        .admin-main { margin-left: 256px; }

        .admin-header {
          position: sticky;
          top: 0;
          z-index: 10;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid #27272a;
        }

        .admin-header-content {
          padding: 16px 32px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .admin-header-title {
          font-size: 24px;
          font-weight: 700;
        }

        .admin-header-subtitle {
          font-size: 14px;
          color: #71717a;
          margin-top: 4px;
        }

        .admin-header-user {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .admin-user-info { text-align: right; }

        .admin-user-name {
          font-size: 14px;
          font-weight: 500;
        }

        .admin-user-email {
          font-size: 12px;
          color: #71717a;
        }

        .admin-logout-btn {
          padding: 10px 24px;
          font-size: 14px;
          font-weight: 500;
          background: #18181b;
          color: #ffffff;
          border: 1px solid #3f3f46;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .admin-logout-btn:hover { background: #27272a; }

        .admin-content { padding: 32px; }

        .admin-page-header { margin-bottom: 32px; }

        .admin-page-title {
          font-size: 36px;
          font-weight: 700;
          margin-bottom: 8px;
        }

        .admin-page-subtitle { color: #a1a1aa; }

        .admin-card {
          background: #18181b;
          border: 1px solid #27272a;
          border-radius: 16px;
          padding: 24px;
          transition: all 0.2s;
        }

        .admin-card:hover { border-color: #3f3f46; }

        .admin-card-empty {
          text-align: center;
          padding: 48px 24px;
        }

        .admin-card-icon {
          font-size: 64px;
          margin-bottom: 16px;
        }

        .admin-card-title {
          font-size: 24px;
          font-weight: 700;
          margin-bottom: 8px;
        }

        .admin-card-description {
          color: #71717a;
          margin-bottom: 24px;
        }

        .admin-stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 24px;
          margin-bottom: 32px;
        }

        .admin-stat-card {
          background: #18181b;
          border: 1px solid #27272a;
          border-radius: 16px;
          padding: 24px;
        }

        .admin-stat-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 16px;
        }

        .admin-stat-label {
          font-size: 14px;
          color: #71717a;
          margin-bottom: 4px;
        }

        .admin-stat-value {
          font-size: 32px;
          font-weight: 700;
        }

        .admin-stat-icon { font-size: 36px; }

        .admin-stat-bar {
          height: 4px;
          border-radius: 2px;
        }

        .admin-stat-bar.blue { background: linear-gradient(90deg, #3b82f6, #60a5fa); }
        .admin-stat-bar.green { background: linear-gradient(90deg, #10b981, #34d399); }
        .admin-stat-bar.purple { background: linear-gradient(90deg, #8b5cf6, #a78bfa); }
        .admin-stat-bar.orange { background: linear-gradient(90deg, #f59e0b, #fbbf24); }

        .admin-actions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 24px;
          margin-bottom: 32px;
        }

        .admin-action-card {
          background: #18181b;
          border: 1px solid #27272a;
          border-radius: 16px;
          padding: 24px;
          text-decoration: none;
          color: inherit;
          display: flex;
          gap: 16px;
          transition: all 0.2s;
        }

        .admin-action-card:hover {
          border-color: #3b82f6;
          background: rgba(24, 24, 27, 0.8);
        }

        .admin-action-icon {
          font-size: 36px;
          flex-shrink: 0;
        }

        .admin-action-title {
          font-size: 18px;
          font-weight: 700;
          margin-bottom: 4px;
        }

        .admin-action-card:hover .admin-action-title { color: #3b82f6; }

        .admin-action-description {
          font-size: 14px;
          color: #71717a;
        }

        .admin-btn {
          display: inline-block;
          padding: 12px 24px;
          font-size: 14px;
          font-weight: 500;
          border-radius: 12px;
          cursor: pointer;
          text-decoration: none;
          transition: all 0.2s;
          border: none;
        }

        .admin-btn-primary {
          background: #3b82f6;
          color: #ffffff;
        }

        .admin-btn-primary:hover { background: #2563eb; }

        .admin-section { margin-bottom: 32px; }

        .admin-section-title {
          font-size: 24px;
          font-weight: 700;
          margin-bottom: 24px;
        }

        .admin-section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .admin-table-container {
          background: #18181b;
          border: 1px solid #27272a;
          border-radius: 16px;
          overflow: hidden;
        }

        .admin-table {
          width: 100%;
          border-collapse: collapse;
        }

        .admin-table thead { background: rgba(39, 39, 42, 0.5); }

        .admin-table th {
          padding: 16px 24px;
          text-align: left;
          font-size: 14px;
          font-weight: 600;
        }

        .admin-table td {
          padding: 16px 24px;
          border-top: 1px solid #27272a;
        }

        .admin-form-group { margin-bottom: 16px; }

        .admin-form-label {
          display: block;
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 8px;
        }

        .admin-form-input {
          width: 100%;
          padding: 12px 16px;
          background: #000000;
          border: 1px solid #3f3f46;
          border-radius: 8px;
          color: #ffffff;
          font-size: 14px;
        }

        .admin-form-input:focus {
          outline: none;
          border-color: #3b82f6;
        }

        .admin-settings-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 24px;
        }

        .admin-btn-secondary {
          background: transparent;
          color: #ffffff;
          border: 1px solid #3f3f46;
        }

        .admin-btn-secondary:hover { background: #18181b; }
      `}</style>

      <div className="admin-wrapper">
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

        <div className="admin-main">
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
                <button className="admin-logout-btn">Logout</button>
              </div>
            </div>
          </header>

          <main className="admin-content">
            {children}
          </main>
        </div>
      </div>
    </>
  )
}
