'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import '../globals.css'

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
    <div className="min-h-screen bg-black text-white">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-[#0a0a0a] border-r border-zinc-800">
        <div className="p-6 border-b border-zinc-800">
          <Link href="/admin" className="text-2xl font-bold text-white hover:text-blue-500 transition-colors">
            47 Admin
          </Link>
          <p className="text-sm text-zinc-500 mt-1">Industries Dashboard</p>
        </div>

        <nav className="p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium
                transition-all duration-200
                ${isActive(item.href)
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                }
              `}
            >
              <span className="text-xl">{item.icon}</span>
              {item.label}
            </Link>
          ))}

          <div className="border-t border-zinc-800 my-4" />

          <Link
            href="/"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-all"
          >
            <span className="text-xl">←</span>
            Back to Site
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="ml-64">
        {/* Top Header */}
        <header className="sticky top-0 z-10 bg-black/80 backdrop-blur-xl border-b border-zinc-800">
          <div className="px-8 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Admin Panel</h1>
              <p className="text-sm text-zinc-500 mt-1">Manage your 47 Industries platform</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium">Admin User</p>
                <p className="text-xs text-zinc-500">admin@47industries.com</p>
              </div>
              <button className="px-6 py-2.5 text-sm font-medium bg-zinc-800 text-white border border-zinc-700 rounded-xl hover:bg-zinc-700 transition-all">
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
