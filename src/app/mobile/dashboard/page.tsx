'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

interface AffiliateStats {
  affiliateCode: string
  points: {
    total: number
    available: number
    toNextReward: number
  }
  stats: {
    totalReferrals: number
    proConversions: number
    proDaysEarned: number
  }
  partnerEligible: boolean
  shareLink: string
  recentActivity: {
    id: string
    type: string
    points: number
    createdAt: string
    motorevEmail?: string
  }[]
}

export default function MobileDashboardPage() {
  const { data: session, status } = useSession()
  const [stats, setStats] = useState<AffiliateStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'authenticated') {
      fetchStats()
    } else if (status === 'unauthenticated') {
      // Redirect to connect page if not logged in
      window.location.href = '/mobile/connect'
    }
  }, [status])

  async function fetchStats() {
    try {
      const res = await fetch('/api/account/affiliate')
      if (!res.ok) {
        throw new Error('Failed to fetch affiliate data')
      }
      const data = await res.json()
      setStats(data.stats)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-zinc-400">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Unable to Load Dashboard</h2>
          <p className="text-zinc-400 mb-6">{error || 'No affiliate data found'}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl px-6 py-3 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black p-6 pb-20">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-white">Affiliate Dashboard</h1>
            <p className="text-zinc-500 text-sm">{session?.user?.email}</p>
          </div>
          <Link
            href="/account"
            className="text-blue-500 text-sm hover:underline"
          >
            Full Account
          </Link>
        </div>

        {/* Affiliate Code */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-6">
          <p className="text-zinc-500 text-sm mb-1">Your Affiliate Code</p>
          <div className="flex items-center justify-between">
            <p className="text-white font-mono text-xl">{stats.affiliateCode}</p>
            <button
              onClick={() => navigator.clipboard.writeText(stats.affiliateCode)}
              className="text-blue-500 text-sm hover:underline"
            >
              Copy
            </button>
          </div>
        </div>

        {/* Points Card */}
        <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-zinc-400 text-sm">Available Points</p>
              <p className="text-4xl font-bold text-white">{stats.points.available}</p>
            </div>
            <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </div>
          </div>

          {/* Progress to next reward */}
          <div className="mb-2">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-zinc-400">{stats.points.available % 10}/10 to next reward</span>
              <span className="text-blue-400">7 days Pro</span>
            </div>
            <div className="w-full bg-zinc-800 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full"
                style={{ width: `${(stats.points.available % 10) * 10}%` }}
              />
            </div>
          </div>

          <p className="text-zinc-500 text-xs">
            Total earned: {stats.points.total} points
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-white">{stats.stats.totalReferrals}</p>
            <p className="text-zinc-500 text-xs">Referrals</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-white">{stats.stats.proConversions}</p>
            <p className="text-zinc-500 text-xs">Pro Upgrades</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-orange-500">{stats.stats.proDaysEarned}d</p>
            <p className="text-zinc-500 text-xs">Pro Earned</p>
          </div>
        </div>

        {/* Share Link */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-6">
          <p className="text-zinc-500 text-sm mb-2">Share your link</p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={stats.shareLink}
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm"
            />
            <button
              onClick={() => navigator.clipboard.writeText(stats.shareLink)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
            >
              Copy
            </button>
          </div>
        </div>

        {/* Programs Section */}
        <div className="mb-6">
          <h3 className="text-white font-medium mb-3">Programs</h3>

          {/* Partner Program Card */}
          <div className={`border rounded-xl p-4 mb-3 ${
            stats.partnerEligible
              ? 'bg-gradient-to-br from-orange-500/20 to-yellow-500/20 border-orange-500/30'
              : 'bg-zinc-900 border-zinc-800'
          }`}>
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                stats.partnerEligible ? 'bg-orange-500/20' : 'bg-zinc-800'
              }`}>
                <svg className={`w-5 h-5 ${stats.partnerEligible ? 'text-orange-500' : 'text-zinc-500'}`} fill="currentColor" viewBox="0 0 24 24">
                  <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-white font-medium">Partner Program</p>
                <p className="text-zinc-400 text-sm mb-2">
                  Earn cash commissions for referring clients to our services (web development, app development, 3D printing).
                </p>
                {stats.partnerEligible ? (
                  <Link
                    href="/mobile/request-access?type=partner"
                    className="inline-flex items-center gap-1 text-orange-500 text-sm font-medium hover:underline"
                  >
                    Apply Now
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                ) : (
                  <div>
                    <p className="text-zinc-500 text-xs mb-2">
                      Reach 25 referrals to unlock ({stats.stats.totalReferrals}/25)
                    </p>
                    <div className="w-full bg-zinc-800 rounded-full h-1.5">
                      <div
                        className="bg-orange-500/50 h-1.5 rounded-full"
                        style={{ width: `${Math.min((stats.stats.totalReferrals / 25) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Store Affiliate Card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-white font-medium">Store Affiliate</p>
                <p className="text-zinc-400 text-sm mb-2">
                  Earn commission on 47 Industries shop purchases made through your referral link.
                </p>
                <Link
                  href="/mobile/request-access?type=store-affiliate"
                  className="inline-flex items-center gap-1 text-blue-500 text-sm font-medium hover:underline"
                >
                  Request Access
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        {stats.recentActivity && stats.recentActivity.length > 0 && (
          <div>
            <h3 className="text-white font-medium mb-3">Recent Activity</h3>
            <div className="space-y-2">
              {stats.recentActivity.slice(0, 5).map((activity) => (
                <div
                  key={activity.id}
                  className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      activity.type === 'PRO_CONVERSION'
                        ? 'bg-orange-500/20'
                        : 'bg-green-500/20'
                    }`}>
                      {activity.type === 'PRO_CONVERSION' ? (
                        <svg className="w-4 h-4 text-orange-500" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <p className="text-white text-sm">
                        {activity.type === 'PRO_CONVERSION' ? 'Pro Upgrade' : 'New Signup'}
                      </p>
                      <p className="text-zinc-500 text-xs">
                        {new Date(activity.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span className="text-green-500 font-medium">+{activity.points}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Return to MotoRev */}
        <button
          onClick={() => {
            window.location.href = 'motorev://affiliate-dashboard'
          }}
          className="w-full mt-6 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-xl px-6 py-4 transition-colors"
        >
          Return to MotoRev
        </button>
      </div>
    </div>
  )
}
