'use client'

import { useEffect, useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faShoppingCart, faBox, faCog } from '@fortawesome/free-solid-svg-icons'

interface Order {
  id: string
  orderNumber: string
  total: number
  status: string
  createdAt: string
  items: { name: string; quantity: number }[]
}

interface ClientInfo {
  id: string
  name: string
  clientNumber: string
  totalOutstanding: number
}

interface PartnerInfo {
  id: string
  name: string
  partnerNumber: string
  pendingAmount: number
  totalEarned: number
}

interface AffiliateInfo {
  affiliateCode: string
  availablePoints: number
  totalReferrals: number
  proDaysEarned: number
  isConnected: boolean
}

export default function AccountPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [clientInfo, setClientInfo] = useState<ClientInfo | null>(null)
  const [partnerInfo, setPartnerInfo] = useState<PartnerInfo | null>(null)
  const [affiliateInfo, setAffiliateInfo] = useState<AffiliateInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [isIOS, setIsIOS] = useState(false)

  // Detect iOS device
  useEffect(() => {
    const checkIOS = () => {
      const userAgent = window.navigator.userAgent.toLowerCase()
      const isIOSDevice = /iphone|ipad|ipod/.test(userAgent) ||
        (userAgent.includes('mac') && 'ontouchend' in document)
      setIsIOS(isIOSDevice)
    }
    checkIOS()
  }, [])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/account')
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user) {
      fetchOrders()
      fetchClientInfo()
      fetchPartnerInfo()
      fetchAffiliateInfo()
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

  async function fetchClientInfo() {
    try {
      const res = await fetch('/api/account/client')
      if (res.ok) {
        const data = await res.json()
        setClientInfo(data.client)
      }
    } catch (error) {
      // User may not have a linked client - that's okay
    }
  }

  async function fetchPartnerInfo() {
    try {
      const res = await fetch('/api/account/partner')
      if (res.ok) {
        const data = await res.json()
        setPartnerInfo(data.partner)
      }
    } catch (error) {
      // User may not have a linked partner - that's okay
    }
  }

  async function fetchAffiliateInfo() {
    try {
      const res = await fetch('/api/account/affiliate')
      if (res.ok) {
        const data = await res.json()
        if (data.stats) {
          setAffiliateInfo({
            affiliateCode: data.stats.affiliateCode,
            availablePoints: data.stats.points.available,
            totalReferrals: data.stats.stats.totalReferrals,
            proDaysEarned: data.stats.stats.proDaysEarned,
            isConnected: !!data.stats.motorev,
          })
        }
      }
    } catch (error) {
      // User may not have an affiliate account - that's okay
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

        {/* Admin Console Banner */}
        {(session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPER_ADMIN') && (
          <a
            href="https://admin.47industries.com"
            className="block p-6 mb-4 border border-purple-500/50 bg-purple-500/5 rounded-xl hover:border-purple-500 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg mb-1">Admin Console</h3>
                <p className="text-text-secondary text-sm">
                  {session?.user?.role === 'SUPER_ADMIN' ? 'Super Administrator' : 'Administrator'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-purple-400 text-sm">Manage platform, orders & users</p>
              </div>
            </div>
          </a>
        )}

        {/* Admin Mobile App Banner - iOS only */}
        {(session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPER_ADMIN') && isIOS && (
          <a
            href="https://apps.apple.com/us/app/47-admin/id6756442723"
            target="_blank"
            rel="noopener noreferrer"
            className="block p-4 mb-8 border border-purple-500/30 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-xl hover:border-purple-500/60 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-sm mb-0.5">47 Admin for iOS</h3>
                <p className="text-text-secondary text-xs">
                  Manage orders and customers on the go
                </p>
              </div>
              <div className="text-purple-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </div>
            </div>
          </a>
        )}

        {/* Client Portal Banner */}
        {clientInfo && (
          <Link
            href="/account/client"
            className="block p-6 mb-8 border border-accent/50 bg-accent/5 rounded-xl hover:border-accent transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg mb-1">Client Portal</h3>
                <p className="text-text-secondary text-sm">
                  {clientInfo.name} | {clientInfo.clientNumber}
                </p>
              </div>
              <div className="text-right">
                {Number(clientInfo.totalOutstanding) > 0 && (
                  <p className="text-yellow-500 font-medium">
                    ${Number(clientInfo.totalOutstanding).toFixed(2)} outstanding
                  </p>
                )}
                <p className="text-accent text-sm">View invoices, contracts & billing</p>
              </div>
            </div>
          </Link>
        )}

        {/* Partner Portal Banner */}
        {partnerInfo && (
          <Link
            href="/account/partner"
            className="block p-6 mb-8 border border-green-500/50 bg-green-500/5 rounded-xl hover:border-green-500 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg mb-1">Partner Dashboard</h3>
                <p className="text-text-secondary text-sm">
                  {partnerInfo.name} | {partnerInfo.partnerNumber}
                </p>
              </div>
              <div className="text-right">
                {partnerInfo.pendingAmount > 0 && (
                  <p className="text-yellow-500 font-medium">
                    ${partnerInfo.pendingAmount.toFixed(2)} pending
                  </p>
                )}
                <p className="text-green-500 text-sm">
                  ${partnerInfo.totalEarned.toFixed(2)} total earned
                </p>
              </div>
            </div>
          </Link>
        )}

        {/* MotoRev Affiliate Banner */}
        {affiliateInfo && !partnerInfo && (
          <Link
            href="/account/affiliate"
            className="block p-6 mb-8 border border-[#0066FF]/50 bg-[#0066FF]/5 rounded-xl hover:border-[#0066FF] transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <img
                  src="https://motorevapp.com/images/favicon.png"
                  alt="MotoRev"
                  className="w-10 h-10 rounded-lg"
                />
                <div>
                  <h3 className="font-semibold text-lg mb-1">MotoRev Affiliate</h3>
                  <p className="text-text-secondary text-sm">
                    {affiliateInfo.affiliateCode}
                    {affiliateInfo.isConnected && (
                      <span className="ml-2 text-green-500">Connected</span>
                    )}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[#0066FF] font-medium">
                  {affiliateInfo.availablePoints} points
                </p>
                <p className="text-text-secondary text-sm">
                  {affiliateInfo.totalReferrals} referrals | {affiliateInfo.proDaysEarned}d Pro earned
                </p>
              </div>
            </div>
          </Link>
        )}

        {/* Quick Links */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Link
            href="/account/orders"
            className="p-6 border border-border rounded-xl hover:border-accent transition-colors group"
          >
            <div className="text-3xl mb-4 text-zinc-400">
              <FontAwesomeIcon icon={faBox} />
            </div>
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
            <div className="text-3xl mb-4 text-zinc-400">
              <FontAwesomeIcon icon={faCog} />
            </div>
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
            <div className="text-3xl mb-4 text-zinc-400">
              <FontAwesomeIcon icon={faShoppingCart} />
            </div>
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
              <div className="text-4xl mb-4 text-zinc-500">
                <FontAwesomeIcon icon={faBox} />
              </div>
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
