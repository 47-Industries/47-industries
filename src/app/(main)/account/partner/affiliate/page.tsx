'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface AffiliateLink {
  id: string
  code: string
  name: string | null
  platform: string
  targetType: string
  targetId: string | null
  url: string
  isActive: boolean
  totalClicks: number
  totalReferrals: number
  totalRevenue: number
  createdAt: string
}

interface AffiliateStats {
  summary: {
    totalClicks: number
    totalReferrals: number
    totalCommissions: number
    pendingCommissions: number
    approvedCommissions: number
    paidCommissions: number
  }
  byPlatform: {
    SHOP: {
      referrals: number
      revenue: number
      commissionRate: number | null
    }
    MOTOREV: {
      signups: number
      proConversions: number
      proBonus: number | null
      windowDays: number | null
    }
  }
  recentReferrals: Array<{
    id: string
    platform: string
    eventType: string
    customerEmail: string | null
    orderTotal: number | null
    commission: { amount: number; status: string } | null
    linkName: string | null
    createdAt: string
  }>
  topLinks: AffiliateLink[]
  affiliateCode: string | null
  settings: {
    shopCommissionRate: number | null
    motorevProBonus: number | null
    motorevProWindowDays: number | null
  }
}

export default function PartnerAffiliatePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<AffiliateStats | null>(null)
  const [links, setLinks] = useState<AffiliateLink[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Create link form state
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [newLink, setNewLink] = useState({
    platform: 'SHOP',
    targetType: 'STORE',
    targetId: '',
    name: '',
  })

  // Copied state for copy to clipboard feedback
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/account/partner/affiliate')
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user) {
      fetchData()
    }
  }, [session])

  async function fetchData() {
    try {
      setLoading(true)
      const [statsRes, linksRes] = await Promise.all([
        fetch('/api/account/partner/affiliate/stats'),
        fetch('/api/account/partner/affiliate/links'),
      ])

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData)
      }

      if (linksRes.ok) {
        const linksData = await linksRes.json()
        setLinks(linksData.links || [])
      }

      if (!statsRes.ok && !linksRes.ok) {
        setError('not_partner')
      }
    } catch (error) {
      console.error('Error fetching affiliate data:', error)
      setError('error')
    } finally {
      setLoading(false)
    }
  }

  async function createLink() {
    setCreateLoading(true)
    try {
      const res = await fetch('/api/account/partner/affiliate/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLink),
      })

      if (res.ok) {
        const data = await res.json()
        setLinks(prev => [data.link, ...prev])
        setShowCreateForm(false)
        setNewLink({ platform: 'SHOP', targetType: 'STORE', targetId: '', name: '' })
        // Refresh stats
        fetchData()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to create link')
      }
    } catch (error) {
      alert('Failed to create link')
    } finally {
      setCreateLoading(false)
    }
  }

  async function copyToClipboard(text: string, id: string) {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-yellow-500/20 text-yellow-500',
      APPROVED: 'bg-blue-500/20 text-blue-500',
      PAID: 'bg-green-500/20 text-green-500',
    }
    return colors[status] || 'bg-gray-500/20 text-gray-500'
  }

  const getPlatformLabel = (platform: string) => {
    return platform === 'MOTOREV' ? 'MotoRev' : 'Shop'
  }

  const getEventLabel = (event: string) => {
    const labels: Record<string, string> = {
      ORDER: 'Order',
      SIGNUP: 'Signup',
      PRO_CONVERSION: 'Pro Conversion',
    }
    return labels[event] || event
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen py-20 flex items-center justify-center">
        <div className="animate-pulse text-text-secondary">Loading...</div>
      </div>
    )
  }

  if (error === 'not_partner') {
    return (
      <div className="min-h-screen py-20">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold mb-4">Affiliate Dashboard</h1>
            <p className="text-text-secondary mb-6">
              Your account is not associated with a partner profile.
            </p>
            <Link
              href="/account"
              className="inline-block px-6 py-3 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
            >
              Back to Account
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-6 max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/account/partner" className="text-sm text-text-secondary hover:text-accent mb-2 inline-block">
              Back to Partner Dashboard
            </Link>
            <h1 className="text-3xl font-bold">Affiliate Dashboard</h1>
            <p className="text-text-secondary">
              Track your referrals and commissions across platforms
            </p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-5 py-2.5 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors font-medium"
          >
            Create Affiliate Link
          </button>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            <div className="p-5 border border-border rounded-xl bg-surface">
              <p className="text-sm text-text-secondary mb-1">Total Clicks</p>
              <p className="text-2xl font-bold">{stats.summary.totalClicks.toLocaleString()}</p>
            </div>
            <div className="p-5 border border-border rounded-xl bg-surface">
              <p className="text-sm text-text-secondary mb-1">Referrals</p>
              <p className="text-2xl font-bold text-accent">{stats.summary.totalReferrals}</p>
            </div>
            <div className="p-5 border border-border rounded-xl bg-surface">
              <p className="text-sm text-text-secondary mb-1">Pending</p>
              <p className="text-2xl font-bold text-yellow-500">{formatCurrency(stats.summary.pendingCommissions)}</p>
            </div>
            <div className="p-5 border border-border rounded-xl bg-surface">
              <p className="text-sm text-text-secondary mb-1">Total Earned</p>
              <p className="text-2xl font-bold text-green-500">{formatCurrency(stats.summary.totalCommissions)}</p>
            </div>
          </div>
        )}

        {/* Commission Rates */}
        {stats && (
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            {/* Shop */}
            <div className="p-5 border border-border rounded-xl bg-surface">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold">Shop Orders</h3>
                  <p className="text-sm text-text-secondary">{stats.summary.totalReferrals > 0 ? stats.byPlatform.SHOP.referrals : 0} orders</p>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-text-secondary">Commission Rate</span>
                <span className="text-xl font-bold text-emerald-500">{stats.settings.shopCommissionRate || 5}%</span>
              </div>
              {stats.byPlatform.SHOP.revenue > 0 && (
                <div className="flex justify-between items-center mt-2 pt-2 border-t border-border">
                  <span className="text-sm text-text-secondary">Total Revenue</span>
                  <span className="font-semibold">{formatCurrency(stats.byPlatform.SHOP.revenue)}</span>
                </div>
              )}
            </div>

            {/* MotoRev */}
            <div className="p-5 border border-border rounded-xl bg-surface">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold">MotoRev</h3>
                  <p className="text-sm text-text-secondary">{stats.byPlatform.MOTOREV.proConversions} Pro conversions</p>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-text-secondary">Pro Bonus</span>
                <span className="text-xl font-bold text-violet-500">{formatCurrency(stats.settings.motorevProBonus || 2.50)}</span>
              </div>
              <div className="flex justify-between items-center mt-2 pt-2 border-t border-border">
                <span className="text-sm text-text-secondary">Conversion Window</span>
                <span className="font-semibold">{stats.settings.motorevProWindowDays || 30} days</span>
              </div>
            </div>
          </div>
        )}

        {/* Your Affiliate Code */}
        {stats?.affiliateCode && (
          <div className="p-5 border border-accent/50 rounded-xl bg-accent/5 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold mb-1">Your Affiliate Code</h3>
                <p className="text-sm text-text-secondary">Share this code with potential customers</p>
              </div>
              <div className="flex items-center gap-3">
                <code className="px-4 py-2 bg-background rounded-lg font-mono text-lg">
                  {stats.affiliateCode}
                </code>
                <button
                  onClick={() => copyToClipboard(stats.affiliateCode!, 'code')}
                  className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
                >
                  {copiedId === 'code' ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create Link Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-background border border-border rounded-xl p-6 max-w-md w-full">
              <h2 className="text-xl font-bold mb-4">Create Affiliate Link</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Platform</label>
                  <select
                    value={newLink.platform}
                    onChange={(e) => setNewLink(prev => ({ ...prev, platform: e.target.value }))}
                    className="w-full px-4 py-2 bg-surface border border-border rounded-lg focus:outline-none focus:border-accent"
                  >
                    <option value="SHOP">Shop</option>
                    <option value="MOTOREV">MotoRev</option>
                  </select>
                </div>

                {newLink.platform === 'SHOP' && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Target</label>
                    <select
                      value={newLink.targetType}
                      onChange={(e) => setNewLink(prev => ({ ...prev, targetType: e.target.value, targetId: '' }))}
                      className="w-full px-4 py-2 bg-surface border border-border rounded-lg focus:outline-none focus:border-accent"
                    >
                      <option value="STORE">All Products</option>
                      <option value="CATEGORY">Specific Category</option>
                      <option value="PRODUCT">Specific Product</option>
                    </select>
                  </div>
                )}

                {newLink.targetType !== 'STORE' && newLink.platform === 'SHOP' && (
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {newLink.targetType === 'PRODUCT' ? 'Product Slug' : 'Category Slug'}
                    </label>
                    <input
                      type="text"
                      value={newLink.targetId}
                      onChange={(e) => setNewLink(prev => ({ ...prev, targetId: e.target.value }))}
                      placeholder={newLink.targetType === 'PRODUCT' ? 'e.g., cool-product' : 'e.g., 3d-prints'}
                      className="w-full px-4 py-2 bg-surface border border-border rounded-lg focus:outline-none focus:border-accent"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-2">Link Name (optional)</label>
                  <input
                    type="text"
                    value={newLink.name}
                    onChange={(e) => setNewLink(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., TikTok Bio Link"
                    className="w-full px-4 py-2 bg-surface border border-border rounded-lg focus:outline-none focus:border-accent"
                  />
                  <p className="text-xs text-text-secondary mt-1">Help you identify this link later</p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-surface transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={createLink}
                  disabled={createLoading}
                  className="flex-1 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50"
                >
                  {createLoading ? 'Creating...' : 'Create Link'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* My Links */}
        <div className="border border-border rounded-xl overflow-hidden mb-8">
          <div className="p-5 border-b border-border">
            <h2 className="font-semibold">My Affiliate Links</h2>
          </div>
          {links.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-text-secondary mb-4">No affiliate links created yet</p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="inline-block px-5 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
              >
                Create Your First Link
              </button>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {links.map((link) => (
                <div key={link.id} className="p-4 hover:bg-surface/50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                        link.platform === 'MOTOREV' ? 'bg-violet-500/20 text-violet-500' : 'bg-emerald-500/20 text-emerald-500'
                      }`}>
                        {getPlatformLabel(link.platform)}
                      </span>
                      <span className="font-medium">{link.name || link.code}</span>
                      {!link.isActive && (
                        <span className="px-2 py-0.5 text-xs bg-red-500/20 text-red-500 rounded">Inactive</span>
                      )}
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <p className="font-semibold">{link.totalClicks}</p>
                        <p className="text-text-secondary text-xs">Clicks</p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold">{link.totalReferrals}</p>
                        <p className="text-text-secondary text-xs">Referrals</p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-green-500">{formatCurrency(Number(link.totalRevenue))}</p>
                        <p className="text-text-secondary text-xs">Revenue</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 px-3 py-1.5 bg-surface rounded text-sm text-text-secondary truncate">
                      {link.url}
                    </code>
                    <button
                      onClick={() => copyToClipboard(link.url, link.id)}
                      className="px-3 py-1.5 bg-accent/10 text-accent rounded hover:bg-accent/20 transition-colors text-sm"
                    >
                      {copiedId === link.id ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Referrals */}
        {stats && stats.recentReferrals.length > 0 && (
          <div className="border border-border rounded-xl overflow-hidden">
            <div className="p-5 border-b border-border">
              <h2 className="font-semibold">Recent Referrals</h2>
            </div>
            <div className="divide-y divide-border">
              {stats.recentReferrals.map((referral) => (
                <div key={referral.id} className="p-4 hover:bg-surface/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                          referral.platform === 'MOTOREV' ? 'bg-violet-500/20 text-violet-500' : 'bg-emerald-500/20 text-emerald-500'
                        }`}>
                          {getPlatformLabel(referral.platform)}
                        </span>
                        <span className="text-sm font-medium">{getEventLabel(referral.eventType)}</span>
                      </div>
                      <p className="text-sm text-text-secondary">
                        {referral.customerEmail || 'Anonymous'}
                        {referral.linkName && ` via ${referral.linkName}`}
                      </p>
                    </div>
                    <div className="text-right">
                      {referral.commission ? (
                        <>
                          <p className="font-semibold text-green-500">{formatCurrency(referral.commission.amount)}</p>
                          <span className={`px-2 py-0.5 text-xs font-medium rounded ${getStatusColor(referral.commission.status)}`}>
                            {referral.commission.status}
                          </span>
                        </>
                      ) : referral.orderTotal ? (
                        <p className="text-text-secondary">{formatCurrency(referral.orderTotal)}</p>
                      ) : null}
                      <p className="text-xs text-text-secondary mt-1">{formatDate(referral.createdAt)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
