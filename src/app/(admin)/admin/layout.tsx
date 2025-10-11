import { ReactNode } from 'react'
import Link from 'next/link'

export default function AdminLayout({ children }: { children: ReactNode }) {
  // TODO: Add authentication check here

  return (
    <div className="min-h-screen bg-background">
      {/* Admin Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-surface border-r border-border">
        <div className="p-6">
          <Link href="/admin" className="text-2xl font-bold">
            47 Admin
          </Link>
        </div>

        <nav className="px-4 space-y-1">
          <Link
            href="/admin"
            className="block px-4 py-3 rounded-lg hover:bg-surface-elevated transition-colors"
          >
            📊 Dashboard
          </Link>
          <Link
            href="/admin/products"
            className="block px-4 py-3 rounded-lg hover:bg-surface-elevated transition-colors"
          >
            📦 Products
          </Link>
          <Link
            href="/admin/orders"
            className="block px-4 py-3 rounded-lg hover:bg-surface-elevated transition-colors"
          >
            🛒 Orders
          </Link>
          <Link
            href="/admin/custom-requests"
            className="block px-4 py-3 rounded-lg hover:bg-surface-elevated transition-colors"
          >
            🖨️ 3D Print Requests
          </Link>
          <Link
            href="/admin/inquiries"
            className="block px-4 py-3 rounded-lg hover:bg-surface-elevated transition-colors"
          >
            💬 Service Inquiries
          </Link>
          <Link
            href="/admin/settings"
            className="block px-4 py-3 rounded-lg hover:bg-surface-elevated transition-colors"
          >
            ⚙️ Settings
          </Link>
          <div className="border-t border-border my-4" />
          <a
            href="/"
            className="block px-4 py-3 rounded-lg hover:bg-surface-elevated transition-colors text-text-secondary"
          >
            ← Back to Site
          </a>
        </nav>
      </aside>

      {/* Admin Content */}
      <div className="ml-64">
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border">
          <div className="px-8 py-4 flex items-center justify-between">
            <h1 className="text-xl font-semibold">Admin Panel</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-text-secondary">admin@47industries.com</span>
              <button className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-surface transition-colors">
                Logout
              </button>
            </div>
          </div>
        </header>

        <main className="p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
