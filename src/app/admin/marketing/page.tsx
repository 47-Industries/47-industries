'use client'

import { useState, useEffect } from 'react'

interface EmailCampaign {
  id: string
  name: string
  subject: string
  content: string
  recipientType: 'all' | 'segment' | 'manual'
  segmentId: string | null
  status: 'draft' | 'scheduled' | 'sending' | 'sent'
  scheduledAt: string | null
  sentAt: string | null
  totalRecipients: number
  sentCount: number
  openCount: number
  clickCount: number
  createdAt: string
  updatedAt: string
}

interface CustomerSegment {
  id: string
  name: string
  color: string
  memberCount: number
}

const statusColors: Record<string, { bg: string; text: string }> = {
  draft: { bg: 'bg-gray-500/20', text: 'text-gray-400' },
  scheduled: { bg: 'bg-blue-500/20', text: 'text-blue-400' },
  sending: { bg: 'bg-yellow-500/20', text: 'text-yellow-400' },
  sent: { bg: 'bg-green-500/20', text: 'text-green-400' },
}

export default function MarketingPage() {
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([])
  const [segments, setSegments] = useState<CustomerSegment[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showNewCampaignModal, setShowNewCampaignModal] = useState(false)
  const [selectedCampaign, setSelectedCampaign] = useState<EmailCampaign | null>(null)

  useEffect(() => {
    fetchData()
  }, [statusFilter])

  const fetchData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.set('status', statusFilter)

      const [campaignsRes, segmentsRes] = await Promise.all([
        fetch(`/api/admin/marketing/campaigns?${params}`),
        fetch('/api/admin/customers/segments'),
      ])

      if (campaignsRes.ok) {
        const data = await campaignsRes.json()
        setCampaigns(data.campaigns || [])
      }
      if (segmentsRes.ok) {
        const data = await segmentsRes.json()
        setSegments(data.segments || [])
      }
    } catch (error) {
      console.error('Failed to fetch marketing data:', error)
    }
    setLoading(false)
  }

  const deleteCampaign = async (id: string) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return

    try {
      const res = await fetch(`/api/admin/marketing/campaigns/${id}`, { method: 'DELETE' })
      if (res.ok) fetchData()
    } catch (error) {
      console.error('Failed to delete campaign:', error)
    }
  }

  const stats = {
    totalCampaigns: campaigns.length,
    sent: campaigns.filter(c => c.status === 'sent').length,
    scheduled: campaigns.filter(c => c.status === 'scheduled').length,
    drafts: campaigns.filter(c => c.status === 'draft').length,
    totalSent: campaigns.reduce((sum, c) => sum + c.sentCount, 0),
    totalOpens: campaigns.reduce((sum, c) => sum + c.openCount, 0),
  }

  const avgOpenRate = stats.totalSent > 0 ? ((stats.totalOpens / stats.totalSent) * 100).toFixed(1) : '0'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Marketing</h1>
          <p className="text-text-secondary mt-1">
            Email campaigns and customer engagement
          </p>
        </div>
        <button
          onClick={() => setShowNewCampaignModal(true)}
          className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors font-medium"
        >
          + New Campaign
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="bg-surface border border-border rounded-xl p-4">
          <p className="text-text-secondary text-sm">Total Campaigns</p>
          <p className="text-2xl font-bold mt-1">{stats.totalCampaigns}</p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4">
          <p className="text-text-secondary text-sm">Sent</p>
          <p className="text-2xl font-bold mt-1 text-green-400">{stats.sent}</p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4">
          <p className="text-text-secondary text-sm">Scheduled</p>
          <p className="text-2xl font-bold mt-1 text-blue-400">{stats.scheduled}</p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4">
          <p className="text-text-secondary text-sm">Drafts</p>
          <p className="text-2xl font-bold mt-1 text-gray-400">{stats.drafts}</p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4">
          <p className="text-text-secondary text-sm">Emails Sent</p>
          <p className="text-2xl font-bold mt-1 text-purple-400">{stats.totalSent}</p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4">
          <p className="text-text-secondary text-sm">Avg Open Rate</p>
          <p className="text-2xl font-bold mt-1 text-yellow-400">{avgOpenRate}%</p>
        </div>
      </div>

      {/* Status Filter */}
      <div className="flex flex-wrap gap-2">
        {[
          { value: 'all', label: 'All Campaigns' },
          { value: 'draft', label: 'Drafts' },
          { value: 'scheduled', label: 'Scheduled' },
          { value: 'sent', label: 'Sent' },
        ].map(filter => (
          <button
            key={filter.value}
            onClick={() => setStatusFilter(filter.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === filter.value
                ? 'bg-blue-500 text-white'
                : 'bg-surface border border-border text-text-secondary hover:text-white'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Campaigns List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      ) : campaigns.length === 0 ? (
        <div className="bg-surface border border-border rounded-xl p-12 text-center">
          <div className="text-4xl mb-4">📧</div>
          <h3 className="text-lg font-semibold mb-2">No campaigns yet</h3>
          <p className="text-text-secondary mb-4">
            Create your first email campaign to engage with customers
          </p>
          <button
            onClick={() => setShowNewCampaignModal(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors font-medium"
          >
            Create Campaign
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {campaigns.map(campaign => (
            <div
              key={campaign.id}
              className="bg-surface border border-border rounded-xl p-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">{campaign.name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      statusColors[campaign.status]?.bg || 'bg-gray-500/20'
                    } ${statusColors[campaign.status]?.text || 'text-gray-400'}`}>
                      {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                    </span>
                  </div>
                  <p className="text-text-secondary text-sm mb-3">
                    Subject: {campaign.subject}
                  </p>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-text-secondary">
                    <span>
                      Recipients: {campaign.recipientType === 'all' ? 'All Customers' :
                        campaign.recipientType === 'segment' ? `Segment` : 'Manual Selection'}
                    </span>
                    {campaign.status === 'sent' && (
                      <>
                        <span className="text-green-400">
                          {campaign.sentCount} sent
                        </span>
                        <span className="text-blue-400">
                          {campaign.openCount} opens ({campaign.sentCount > 0 ? ((campaign.openCount / campaign.sentCount) * 100).toFixed(1) : 0}%)
                        </span>
                        <span className="text-purple-400">
                          {campaign.clickCount} clicks
                        </span>
                      </>
                    )}
                    {campaign.scheduledAt && campaign.status === 'scheduled' && (
                      <span className="text-blue-400">
                        Scheduled: {new Date(campaign.scheduledAt).toLocaleString()}
                      </span>
                    )}
                    {campaign.sentAt && (
                      <span>
                        Sent: {new Date(campaign.sentAt).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  {campaign.status === 'draft' && (
                    <>
                      <button
                        onClick={() => setSelectedCampaign(campaign)}
                        className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg text-sm hover:bg-blue-500/30 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteCampaign(campaign.id)}
                        className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg text-sm hover:bg-red-500/30 transition-colors"
                      >
                        Delete
                      </button>
                    </>
                  )}
                  {campaign.status === 'sent' && (
                    <button
                      onClick={() => setSelectedCampaign(campaign)}
                      className="px-4 py-2 bg-surface-elevated border border-border rounded-lg text-sm hover:border-blue-500/50 transition-colors"
                    >
                      View Report
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Campaign Modal */}
      {showNewCampaignModal && (
        <CampaignModal
          segments={segments}
          onClose={() => setShowNewCampaignModal(false)}
          onSaved={() => {
            setShowNewCampaignModal(false)
            fetchData()
          }}
        />
      )}

      {/* Edit/View Campaign Modal */}
      {selectedCampaign && (
        <CampaignModal
          campaign={selectedCampaign}
          segments={segments}
          onClose={() => setSelectedCampaign(null)}
          onSaved={() => {
            setSelectedCampaign(null)
            fetchData()
          }}
        />
      )}
    </div>
  )
}

function CampaignModal({
  campaign,
  segments,
  onClose,
  onSaved,
}: {
  campaign?: EmailCampaign
  segments: CustomerSegment[]
  onClose: () => void
  onSaved: () => void
}) {
  const [name, setName] = useState(campaign?.name || '')
  const [subject, setSubject] = useState(campaign?.subject || '')
  const [content, setContent] = useState(campaign?.content || '')
  const [recipientType, setRecipientType] = useState<'all' | 'segment'>(
    campaign?.recipientType === 'segment' ? 'segment' : 'all'
  )
  const [segmentId, setSegmentId] = useState(campaign?.segmentId || '')
  const [scheduledAt, setScheduledAt] = useState(
    campaign?.scheduledAt ? new Date(campaign.scheduledAt).toISOString().slice(0, 16) : ''
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isViewOnly = campaign?.status === 'sent'

  const handleSubmit = async (action: 'save' | 'schedule' | 'send') => {
    setLoading(true)
    setError('')

    try {
      const method = campaign ? 'PATCH' : 'POST'
      const url = campaign
        ? `/api/admin/marketing/campaigns/${campaign.id}`
        : '/api/admin/marketing/campaigns'

      const body: any = {
        name,
        subject,
        content,
        recipientType,
        segmentId: recipientType === 'segment' ? segmentId : null,
      }

      if (action === 'schedule' && scheduledAt) {
        body.status = 'scheduled'
        body.scheduledAt = new Date(scheduledAt).toISOString()
      } else if (action === 'send') {
        body.status = 'sending'
      } else {
        body.status = 'draft'
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save campaign')
      }

      onSaved()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-surface border border-border rounded-2xl p-6 max-w-3xl w-full my-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">
            {isViewOnly ? 'Campaign Report' : campaign ? 'Edit Campaign' : 'New Campaign'}
          </h2>
          <button onClick={onClose} className="text-text-secondary hover:text-white">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 rounded-lg p-3 mb-4 text-sm">
            {error}
          </div>
        )}

        {/* Stats for sent campaigns */}
        {isViewOnly && campaign && (
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-surface-elevated rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-green-400">{campaign.sentCount}</p>
              <p className="text-sm text-text-secondary">Sent</p>
            </div>
            <div className="bg-surface-elevated rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-blue-400">{campaign.openCount}</p>
              <p className="text-sm text-text-secondary">Opens</p>
            </div>
            <div className="bg-surface-elevated rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-purple-400">{campaign.clickCount}</p>
              <p className="text-sm text-text-secondary">Clicks</p>
            </div>
            <div className="bg-surface-elevated rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-yellow-400">
                {campaign.sentCount > 0 ? ((campaign.openCount / campaign.sentCount) * 100).toFixed(1) : 0}%
              </p>
              <p className="text-sm text-text-secondary">Open Rate</p>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Campaign Name *</label>
            <input
              type="text"
              required
              disabled={isViewOnly}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Holiday Sale Announcement"
              className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:border-blue-500 disabled:opacity-60"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Email Subject *</label>
            <input
              type="text"
              required
              disabled={isViewOnly}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g., Don't miss our biggest sale of the year!"
              className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:border-blue-500 disabled:opacity-60"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Recipients</label>
              <select
                disabled={isViewOnly}
                value={recipientType}
                onChange={(e) => setRecipientType(e.target.value as any)}
                className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:border-blue-500 disabled:opacity-60"
              >
                <option value="all">All Customers</option>
                <option value="segment">Customer Segment</option>
              </select>
            </div>

            {recipientType === 'segment' && (
              <div>
                <label className="block text-sm font-medium mb-2">Select Segment</label>
                <select
                  disabled={isViewOnly}
                  value={segmentId}
                  onChange={(e) => setSegmentId(e.target.value)}
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:border-blue-500 disabled:opacity-60"
                >
                  <option value="">Choose a segment...</option>
                  {segments.map(segment => (
                    <option key={segment.id} value={segment.id}>
                      {segment.name} ({segment.memberCount} members)
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Email Content *</label>
            <textarea
              required
              disabled={isViewOnly}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={10}
              placeholder="Write your email content here... (HTML supported)"
              className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:border-blue-500 resize-none font-mono text-sm disabled:opacity-60"
            />
          </div>

          {!isViewOnly && (
            <div>
              <label className="block text-sm font-medium mb-2">Schedule (Optional)</label>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
          )}
        </div>

        {!isViewOnly && (
          <div className="flex gap-3 pt-6">
            <button
              onClick={() => handleSubmit('save')}
              disabled={loading || !name || !subject || !content}
              className="flex-1 px-4 py-3 bg-surface-elevated border border-border rounded-lg font-medium hover:bg-surface transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Draft'}
            </button>
            {scheduledAt && (
              <button
                onClick={() => handleSubmit('schedule')}
                disabled={loading || !name || !subject || !content}
                className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:opacity-50"
              >
                {loading ? 'Scheduling...' : 'Schedule'}
              </button>
            )}
            <button
              onClick={() => {
                if (confirm('Are you sure you want to send this campaign immediately?')) {
                  handleSubmit('send')
                }
              }}
              disabled={loading || !name || !subject || !content}
              className="flex-1 px-4 py-3 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send Now'}
            </button>
          </div>
        )}

        {isViewOnly && (
          <div className="flex gap-3 pt-6">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-surface-elevated border border-border rounded-lg font-medium hover:bg-surface transition-colors"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
