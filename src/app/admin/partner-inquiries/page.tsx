'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useToast } from '@/components/ui/Toast'

interface PartnerInquiry {
  id: string
  inquiryNumber: string
  name: string
  email: string
  phone?: string
  company?: string
  website?: string
  socialMedia?: string
  audience: string
  reason: string
  status: string
  leadchopperId?: string
  leadchopperOrgId?: string
  reviewedBy?: string
  reviewedAt?: string
  reviewNotes?: string
  createdAt: string
  updatedAt: string
}

interface Stats {
  total: number
  new: number
  contacted: number
  approved: number
  rejected: number
}

export default function PartnerInquiriesPage() {
  const [inquiries, setInquiries] = useState<PartnerInquiry[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedInquiry, setSelectedInquiry] = useState<PartnerInquiry | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [reviewNotes, setReviewNotes] = useState('')
  const { showToast } = useToast()

  useEffect(() => {
    fetchInquiries()
  }, [statusFilter])

  const fetchInquiries = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (searchQuery) params.append('search', searchQuery)

      const res = await fetch(`/api/admin/partner-inquiries?${params}`)
      if (res.ok) {
        const data = await res.json()
        setInquiries(data.inquiries)
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error fetching partner inquiries:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchInquiries()
  }

  const handleStatusUpdate = async (id: string, newStatus: string, notes?: string) => {
    try {
      setActionLoading(true)
      const res = await fetch(`/api/admin/partner-inquiries/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, reviewNotes: notes }),
      })

      if (res.ok) {
        showToast(`Inquiry marked as ${newStatus.toLowerCase()}`, 'success')
        fetchInquiries()
        setShowDetailModal(false)
        setSelectedInquiry(null)
        setReviewNotes('')
      } else {
        const error = await res.json()
        showToast(error.error || 'Failed to update status', 'error')
      }
    } catch (error) {
      showToast('Failed to update inquiry', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const handleApprove = async (id: string) => {
    if (!confirm('Approve this partner inquiry? This will create a new Partner account.')) return
    await handleStatusUpdate(id, 'APPROVED', reviewNotes)
  }

  const handleReject = async (id: string) => {
    if (!confirm('Reject this partner inquiry?')) return
    await handleStatusUpdate(id, 'REJECTED', reviewNotes)
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'NEW': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'CONTACTED': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'APPROVED': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'REJECTED': return 'bg-red-500/20 text-red-400 border-red-500/30'
      default: return 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold">Partner Inquiries</h1>
            <p className="text-zinc-400 mt-1">Review and manage partnership applications</p>
          </div>
          <Link
            href="/admin/partners"
            className="text-sm text-blue-400 hover:text-blue-300"
          >
            View Active Partners
          </Link>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm text-zinc-400">Total</div>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-400">{stats.new}</div>
              <div className="text-sm text-zinc-400">New</div>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
              <div className="text-2xl font-bold text-yellow-400">{stats.contacted}</div>
              <div className="text-sm text-zinc-400">Contacted</div>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-400">{stats.approved}</div>
              <div className="text-sm text-zinc-400">Approved</div>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
              <div className="text-2xl font-bold text-red-400">{stats.rejected}</div>
              <div className="text-sm text-zinc-400">Rejected</div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <form onSubmit={handleSearch} className="flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, or company..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
            />
          </form>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Status</option>
            <option value="NEW">New</option>
            <option value="CONTACTED">Contacted</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>

        {/* Inquiries List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="text-zinc-400 mt-4">Loading inquiries...</p>
          </div>
        ) : inquiries.length === 0 ? (
          <div className="text-center py-12 bg-zinc-900 border border-zinc-800 rounded-lg">
            <p className="text-zinc-400">No partner inquiries found</p>
          </div>
        ) : (
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-zinc-800/50">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-zinc-300">Inquiry</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-zinc-300 hidden md:table-cell">Company</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-zinc-300">Status</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-zinc-300 hidden lg:table-cell">Submitted</th>
                  <th className="text-right px-6 py-3 text-sm font-semibold text-zinc-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {inquiries.map((inquiry) => (
                  <tr key={inquiry.id} className="hover:bg-zinc-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium">{inquiry.name}</div>
                      <div className="text-sm text-zinc-400">{inquiry.email}</div>
                      <div className="text-xs text-zinc-500">{inquiry.inquiryNumber}</div>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <div className="text-sm">{inquiry.company || '-'}</div>
                      {inquiry.website && (
                        <a
                          href={inquiry.website.startsWith('http') ? inquiry.website : `https://${inquiry.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-400 hover:underline"
                        >
                          {inquiry.website}
                        </a>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getStatusBadgeColor(inquiry.status)}`}>
                        {inquiry.status}
                      </span>
                      {inquiry.leadchopperId && (
                        <div className="text-xs text-purple-400 mt-1">via LeadChopper</div>
                      )}
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      <div className="text-sm text-zinc-400">{formatDate(inquiry.createdAt)}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedInquiry(inquiry)
                          setReviewNotes(inquiry.reviewNotes || '')
                          setShowDetailModal(true)
                        }}
                        className="text-sm text-blue-400 hover:text-blue-300"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Detail Modal */}
        {showDetailModal && selectedInquiry && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-xl font-bold">{selectedInquiry.name}</h2>
                    <p className="text-sm text-zinc-400">{selectedInquiry.inquiryNumber}</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowDetailModal(false)
                      setSelectedInquiry(null)
                      setReviewNotes('')
                    }}
                    className="text-zinc-400 hover:text-white"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Contact Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-zinc-500 mb-1">Email</label>
                      <a href={`mailto:${selectedInquiry.email}`} className="text-blue-400 hover:underline">
                        {selectedInquiry.email}
                      </a>
                    </div>
                    {selectedInquiry.phone && (
                      <div>
                        <label className="block text-xs text-zinc-500 mb-1">Phone</label>
                        <a href={`tel:${selectedInquiry.phone}`} className="text-blue-400 hover:underline">
                          {selectedInquiry.phone}
                        </a>
                      </div>
                    )}
                    {selectedInquiry.company && (
                      <div>
                        <label className="block text-xs text-zinc-500 mb-1">Company</label>
                        <div>{selectedInquiry.company}</div>
                      </div>
                    )}
                    {selectedInquiry.website && (
                      <div>
                        <label className="block text-xs text-zinc-500 mb-1">Website</label>
                        <a
                          href={selectedInquiry.website.startsWith('http') ? selectedInquiry.website : `https://${selectedInquiry.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:underline"
                        >
                          {selectedInquiry.website}
                        </a>
                      </div>
                    )}
                    {selectedInquiry.socialMedia && (
                      <div>
                        <label className="block text-xs text-zinc-500 mb-1">Social Media</label>
                        <div>{selectedInquiry.socialMedia}</div>
                      </div>
                    )}
                  </div>

                  {/* Audience */}
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">Audience / How They Will Promote</label>
                    <div className="bg-zinc-800/50 rounded-lg p-3 text-sm whitespace-pre-wrap">
                      {selectedInquiry.audience}
                    </div>
                  </div>

                  {/* Reason */}
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">Reason for Partnership</label>
                    <div className="bg-zinc-800/50 rounded-lg p-3 text-sm whitespace-pre-wrap">
                      {selectedInquiry.reason}
                    </div>
                  </div>

                  {/* LeadChopper Tracking */}
                  {selectedInquiry.leadchopperId && (
                    <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3">
                      <div className="text-xs text-purple-400 mb-1">From LeadChopper</div>
                      <div className="text-sm">Lead ID: {selectedInquiry.leadchopperId}</div>
                      {selectedInquiry.leadchopperOrgId && (
                        <div className="text-sm">Org ID: {selectedInquiry.leadchopperOrgId}</div>
                      )}
                    </div>
                  )}

                  {/* Status */}
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">Current Status</label>
                    <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full border ${getStatusBadgeColor(selectedInquiry.status)}`}>
                      {selectedInquiry.status}
                    </span>
                  </div>

                  {/* Review Notes */}
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">Review Notes</label>
                    <textarea
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      placeholder="Add notes about this inquiry..."
                      rows={3}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Actions */}
                  {selectedInquiry.status !== 'APPROVED' && selectedInquiry.status !== 'REJECTED' && (
                    <div className="flex gap-3 pt-4 border-t border-zinc-800">
                      <button
                        onClick={() => handleStatusUpdate(selectedInquiry.id, 'CONTACTED', reviewNotes)}
                        disabled={actionLoading}
                        className="flex-1 px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                      >
                        Mark Contacted
                      </button>
                      <button
                        onClick={() => handleApprove(selectedInquiry.id)}
                        disabled={actionLoading}
                        className="flex-1 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(selectedInquiry.id)}
                        disabled={actionLoading}
                        className="flex-1 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  )}

                  {/* Timestamps */}
                  <div className="text-xs text-zinc-500 pt-4 border-t border-zinc-800">
                    <div>Submitted: {formatDate(selectedInquiry.createdAt)}</div>
                    {selectedInquiry.reviewedAt && (
                      <div>Reviewed: {formatDate(selectedInquiry.reviewedAt)}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
