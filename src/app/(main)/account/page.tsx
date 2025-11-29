'use client'

import { useEffect, useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Order {
  id: string
  orderNumber: string
  total: number
  status: string
  createdAt: string
  items: { name: string; quantity: number }[]
}

export default function AccountPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/account')
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user) {
      fetchOrders()
    }
  }, [session])

  async function fetchOrders() {
    try {
      const res = await fetch('/api/account/orders')
      if (res.ok) {
        const data = await res.json()
        setOrders(data.orders)
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' })
  }

  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <div className="min-h-screen py-20 flex items-center justify-center">
        <div className="animate-pulse text-text-secondary">Loading...</div>
      </div>
    )
  }

  const recentOrders = orders.slice(0, 3)

  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-4xl font-bold mb-2">My Account</h1>
            <p className="text-text-secondary">
              Welcome back, {session?.user?.name || 'there'}!
            </p>
          </div>
          <button
            onClick={handleSignOut}
            className="px-4 py-2 text-sm text-text-secondary hover:text-red-500 transition-colors"
          >
            Sign Out
          </button>
        </div>

        {/* Quick Links */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Link
            href="/account/orders"
            className="p-6 border border-border rounded-xl hover:border-accent transition-colors group"
          >
            <div className="text-3xl mb-4">📦</div>
            <h3 className="font-semibold mb-1 group-hover:text-accent transition-colors">
              Order History
            </h3>
            <p className="text-text-secondary text-sm">
              View and track your orders
            </p>
          </Link>

          <Link
            href="/account/settings"
            className="p-6 border border-border rounded-xl hover:border-accent transition-colors group"
          >
            <div className="text-3xl mb-4">⚙️</div>
            <h3 className="font-semibold mb-1 group-hover:text-accent transition-colors">
              Account Settings
            </h3>
            <p className="text-text-secondary text-sm">
              Update your profile and preferences
            </p>
          </Link>

          <Link
            href="/shop"
            className="p-6 border border-border rounded-xl hover:border-accent transition-colors group"
          >
            <div className="text-3xl mb-4">🛒</div>
            <h3 className="font-semibold mb-1 group-hover:text-accent transition-colors">
              Continue Shopping
            </h3>
            <p className="text-text-secondary text-sm">
              Browse our latest products
            </p>
          </Link>
        </div>

        {/* Recent Orders */}
        <div className="border border-border rounded-xl overflow-hidden">
          <div className="p-6 border-b border-border flex items-center justify-between">
            <h2 className="text-xl font-bold">Recent Orders</h2>
            {orders.length > 3 && (
              <Link
                href="/account/orders"
                className="text-sm text-accent hover:underline"
              >
                View all
              </Link>
            )}
          </div>

          {loading ? (
            <div className="p-12 text-center text-text-secondary">
              Loading orders...
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-4xl mb-4">📦</div>
              <p className="text-text-secondary mb-4">No orders yet</p>
              <Link
                href="/shop"
                className="inline-flex items-center px-6 py-3 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
              >
                Start Shopping
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {recentOrders.map((order) => (
                <Link
                  key={order.id}
                  href={`/account/orders/${order.id}`}
                  className="block p-6 hover:bg-surface transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono font-medium">
                      {order.orderNumber}
                    </span>
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                      order.status === 'DELIVERED' ? 'bg-green-500/20 text-green-500' :
                      order.status === 'SHIPPED' ? 'bg-blue-500/20 text-blue-500' :
                      order.status === 'PAID' ? 'bg-yellow-500/20 text-yellow-500' :
                      'bg-gray-500/20 text-gray-500'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-secondary">
                      {order.items.length} item{order.items.length !== 1 ? 's' : ''} •{' '}
                      {new Date(order.createdAt).toLocaleDateString()}
                    </span>
                    <span className="font-medium">${order.total.toFixed(2)}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Account Info */}
        <div className="mt-8 p-6 border border-border rounded-xl">
          <h2 className="text-xl font-bold mb-4">Account Details</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-text-secondary mb-1">Name</label>
              <p className="font-medium">{session?.user?.name || 'Not set'}</p>
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-1">Email</label>
              <p className="font-medium">{session?.user?.email}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
