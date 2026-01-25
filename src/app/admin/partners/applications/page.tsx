'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useToast } from '@/components/ui/Toast'

interface Application {
  id: string
  type: string
  name: string
  email: string
  company: string | null
  website: string | null
  socialMedia: string | null
  audience: string
  reason: string
  status: string
  reviewedBy: string | null
  reviewedAt: string | null
  reviewNotes: string | null
  createdAt: string
  user: {
    id: string
    email: string
    name: string | null
    userAffiliate?: {
      affiliateCode: string
      totalReferrals: number
      totalPoints: number
    } | null
  }
}

interface Stats {
  total: number
  pending: number
  approved: number
  rejected: number
}

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('PENDING')
  const [typeFilter, setTypeFilter] = useState('all')
  const [selectedApp, setSelectedApp] = useState<Application | null>(null)
  const [reviewNotes, setReviewNotes] = useState('')
  const [processing, setProcessing] = useState(false)
  const { showToast } = useToast()

  useEffect(() => {
    fetchApplications()
  }, [statusFilter, typeFilter])

  const fetchApplications = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (typeFilter !== 'all') params.append('type', typeFilter)

      const res = await fetch(`/api/admin/partners/applications?${params}`)
      if (res.ok) {
        const data = await res.json()
        setApplications(data.applications)
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error fetching applications:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleReview = async (applicationId: string, action: 'approve' | 'reject') => {
    setProcessing(true)
    try {
      const res = await fetch(`/api/admin/partners/applications/${applicationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          reviewNotes,
        }),
      })

      if (res.ok) {
        showToast(`Application ${action === 'approve' ? 'approved' : 'rejected'} successfully`, 'success')
        setSelectedApp(null)
        setReviewNotes('')
        fetchApplications()
      } else {
        const data = await res.json()
        showToast(data.error || 'Failed to process application', 'error')
      }
    } catch (error) {
      showToast('An error occurred', 'error')
    } finally {
      setProcessing(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-500/20 text-yellow-400'
      case 'APPROVED':
        return 'bg-green-500/20 text-green-400'
      case 'REJECTED':
        return 'bg-red-500/20 text-red-400'
      default:
        return 'bg-zinc-700 text-zinc-400'
    }
  }

  const getTypeBadge = (type: string) => {
    return type === 'partner'
      ? 'bg-orange-500/20 text-orange-400'
      : 'bg-blue-500/20 text-blue-400'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Partner Applications</h1>
          <p className="text-zinc-400 text-sm mt-1">
            Review and manage partner and affiliate program applications
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-zinc-800 rounded-lg px-3 py-2">
            <span className="text-zinc-400 text-sm">Application Link:</span>
            <code className="text-blue-400 text-sm font-mono">47industries.com/partners/apply</code>
            <button
              onClick={() => {
                navigator.clipboard.writeText('https://47industries.com/partners/apply')
                showToast('Link copied to clipboard', 'success')
              }}
              className="text-zinc-500 hover:text-white transition-colors ml-1"
              title="Copy link"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
          <Link
            href="/admin/partners"
            className="text-zinc-400 hover:text-white text-sm transition-colors"
          >
            Back to Partners
          </Link>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
            <p className="text-zinc-500 text-sm">Total</p>
            <p className="text-2xl font-bold text-white">{stats.total}</p>
          </div>
          <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
            <p className="text-zinc-500 text-sm">Pending</p>
            <p className="text-2xl font-bold text-yellow-400">{stats.pending}</p>
          </div>
          <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
            <p className="text-zinc-500 text-sm">Approved</p>
            <p className="text-2xl font-bold text-green-400">{stats.approved}</p>
          </div>
          <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
            <p className="text-zinc-500 text-sm">Rejected</p>
            <p className="text-2xl font-bold text-red-400">{stats.rejected}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
        >
          <option value="all">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
        >
          <option value="all">All Types</option>
          <option value="partner">Partner Program</option>
          <option value="store-affiliate">Store Affiliate</option>
        </select>
      </div>

      {/* Applications List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : applications.length === 0 ? (
        <div className="bg-zinc-900 rounded-xl p-12 text-center border border-zinc-800">
          <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-zinc-400">No applications found</p>
          <p className="text-zinc-600 text-sm mt-1">
            {statusFilter === 'PENDING' ? 'All caught up!' : 'Try adjusting your filters'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => (
            <div
              key={app.id}
              className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden"
            >
              {/* Application Header */}
              <div className="p-4 flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getTypeBadge(app.type)}`}>
                      {app.type === 'partner' ? 'Partner' : 'Store Affiliate'}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusBadge(app.status)}`}>
                      {app.status}
                    </span>
                  </div>
                  <h3 className="text-white font-medium">{app.name}</h3>
                  <p className="text-zinc-500 text-sm">{app.email}</p>
                  {app.company && (
                    <p className="text-zinc-600 text-sm">{app.company}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-zinc-600 text-xs">
                    {new Date(app.createdAt).toLocaleDateString()}
                  </p>
                  {app.user.userAffiliate && (
                    <div className="mt-2 text-xs">
                      <p className="text-zinc-500">
                        Code: <span className="text-white font-mono">{app.user.userAffiliate.affiliateCode}</span>
                      </p>
                      <p className="text-zinc-500">
                        Referrals: <span className="text-white">{app.user.userAffiliate.totalReferrals}</span>
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Expandable Details */}
              <div className="border-t border-zinc-800 px-4 py-3 bg-zinc-950/50">
                <button
                  onClick={() => setSelectedApp(selectedApp?.id === app.id ? null : app)}
                  className="w-full flex items-center justify-between text-sm text-zinc-400 hover:text-white transition-colors"
                >
                  <span>View Details</span>
                  <svg
                    className={`w-5 h-5 transition-transform ${selectedApp?.id === app.id ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>

              {/* Expanded Details */}
              {selectedApp?.id === app.id && (
                <div className="border-t border-zinc-800 p-4 space-y-4">
                  {/* Links */}
                  {(app.website || app.socialMedia) && (
                    <div className="flex flex-wrap gap-4 text-sm">
                      {app.website && (
                        <a
                          href={app.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:underline flex items-center gap-1"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          Website
                        </a>
                      )}
                      {app.socialMedia && (
                        <span className="text-zinc-400">Social: {app.socialMedia}</span>
                      )}
                    </div>
                  )}

                  {/* Audience */}
                  <div>
                    <p className="text-zinc-500 text-sm mb-1">How they'll promote:</p>
                    <p className="text-zinc-300 text-sm bg-zinc-800/50 rounded-lg p-3">{app.audience}</p>
                  </div>

                  {/* Reason */}
                  <div>
                    <p className="text-zinc-500 text-sm mb-1">Why they want to join:</p>
                    <p className="text-zinc-300 text-sm bg-zinc-800/50 rounded-lg p-3">{app.reason}</p>
                  </div>

                  {/* Review Notes (if already reviewed) */}
                  {app.reviewNotes && (
                    <div>
                      <p className="text-zinc-500 text-sm mb-1">Review Notes:</p>
                      <p className="text-zinc-400 text-sm bg-zinc-800/50 rounded-lg p-3">{app.reviewNotes}</p>
                      {app.reviewedAt && (
                        <p className="text-zinc-600 text-xs mt-1">
                          Reviewed on {new Date(app.reviewedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Actions (only for pending) */}
                  {app.status === 'PENDING' && (
                    <div className="pt-4 border-t border-zinc-800 space-y-3">
                      <div>
                        <label className="block text-zinc-500 text-sm mb-1">Review Notes (optional)</label>
                        <textarea
                          value={reviewNotes}
                          onChange={(e) => setReviewNotes(e.target.value)}
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 min-h-[80px] resize-none"
                          placeholder="Add notes about this application..."
                        />
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleReview(app.id, 'approve')}
                          disabled={processing}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg px-4 py-2 text-sm transition-colors disabled:opacity-50"
                        >
                          {processing ? 'Processing...' : 'Approve'}
                        </button>
                        <button
                          onClick={() => handleReview(app.id, 'reject')}
                          disabled={processing}
                          className="flex-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 font-medium rounded-lg px-4 py-2 text-sm transition-colors disabled:opacity-50"
                        >
                          {processing ? 'Processing...' : 'Reject'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
