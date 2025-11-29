'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

interface OrderItem {
  name: string
  quantity: number
  price: number
  image: string | null
}

interface Order {
  id: string
  orderNumber: string
  total: number
  status: string
  createdAt: string
  trackingNumber: string | null
  carrier: string | null
  items: OrderItem[]
}

export default function OrderHistoryPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/account/orders')
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

  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <div className="min-h-screen py-20 flex items-center justify-center">
        <div className="animate-pulse text-text-secondary">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-6 max-w-4xl">
        {/* Breadcrumb */}
        <nav className="mb-8 text-sm text-text-secondary">
          <Link href="/account" className="hover:text-text-primary transition-colors">
            Account
          </Link>
          <span className="mx-2">/</span>
          <span className="text-text-primary">Orders</span>
        </nav>

        <h1 className="text-4xl font-bold mb-8">Order History</h1>

        {loading ? (
          <div className="text-center py-20 text-text-secondary">
            Loading orders...
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📦</div>
            <h2 className="text-2xl font-bold mb-2">No orders yet</h2>
            <p className="text-text-secondary mb-8">
              When you place an order, it will appear here.
            </p>
            <Link
              href="/shop"
              className="inline-flex items-center px-6 py-3 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div
                key={order.id}
                className="border border-border rounded-xl overflow-hidden"
              >
                {/* Order Header */}
                <div className="p-6 bg-surface border-b border-border">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="text-sm text-text-secondary">Order Number</p>
                      <p className="font-mono font-bold text-lg">
                        {order.orderNumber}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-text-secondary">
                        {new Date(order.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                      <span className={`inline-block mt-1 px-3 py-1 text-xs font-medium rounded-full ${
                        order.status === 'DELIVERED' ? 'bg-green-500/20 text-green-500' :
                        order.status === 'SHIPPED' ? 'bg-blue-500/20 text-blue-500' :
                        order.status === 'PAID' ? 'bg-yellow-500/20 text-yellow-500' :
                        order.status === 'PROCESSING' ? 'bg-purple-500/20 text-purple-500' :
                        'bg-gray-500/20 text-gray-500'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>

                  {/* Tracking Info */}
                  {order.trackingNumber && order.carrier && (
                    <div className="mt-4 p-4 bg-background rounded-lg">
                      <p className="text-sm text-text-secondary mb-1">Tracking</p>
                      <p className="font-medium">
                        {order.carrier}: {order.trackingNumber}
                      </p>
                    </div>
                  )}
                </div>

                {/* Order Items */}
                <div className="p-6">
                  <div className="space-y-4">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-surface rounded-lg overflow-hidden flex-shrink-0 relative">
                          {item.image ? (
                            <Image
                              src={item.image}
                              alt={item.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-text-secondary text-xs">
                              No Image
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{item.name}</p>
                          <p className="text-sm text-text-secondary">
                            Qty: {item.quantity} × ${item.price.toFixed(2)}
                          </p>
                        </div>
                        <p className="font-medium">
                          ${(item.quantity * item.price).toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 pt-4 border-t border-border flex justify-between items-center">
                    <span className="text-text-secondary">Total</span>
                    <span className="text-xl font-bold">${order.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
