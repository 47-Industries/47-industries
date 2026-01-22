'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { LEAD_INTEREST_LABELS, LeadInterest } from '@/lib/lead-utils'

interface Lead {
  id: string
  leadNumber: string
  businessName: string
  contactName: string
  email: string
  phone?: string
  status: string
  description?: string
  interests?: LeadInterest[]
  createdAt: string
  commissions: {
    id: string
    amount: number
    status: string
    type: string
  }[]
}

export default function PartnerLeadsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [interestFilter, setInterestFilter] = useState('all')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/account/partner/leads')
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user) {
      fetchLeads()
    }
  }, [session, statusFilter])

  // Filter leads by interest client-side
  const filteredLeads = interestFilter === 'all'
    ? leads
    : leads.filter((lead) => lead.interests?.includes(interestFilter as LeadInterest))

  async function fetchLeads() {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.append('status', statusFilter)
      const res = await fetch(`/api/account/partner/leads?${params}`)
      if (res.ok) {
        const data = await res.json()
        setLeads(data.leads)
      } else if (res.status === 404) {
        router.push('/account/partner')
      }
    } catch (error) {
      console.error('Error fetching leads:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      NEW: 'bg-blue-500/20 text-blue-500',
      CONTACTED: 'bg-purple-500/20 text-purple-500',
      QUALIFIED: 'bg-yellow-500/20 text-yellow-500',
      CONVERTED: 'bg-green-500/20 text-green-500',
      LOST: 'bg-red-500/20 text-red-500',
    }
    return colors[status] || 'bg-gray-500/20 text-gray-500'
  }

  const getTotalCommissions = (lead: Lead) => {
    return lead.commissions.reduce((sum, c) => sum + Number(c.amount), 0)
  }

  const statuses = [
    { value: 'all', label: 'All Statuses' },
    { value: 'NEW', label: 'New' },
    { value: 'CONTACTED', label: 'Contacted' },
    { value: 'QUALIFIED', label: 'Qualified' },
    { value: 'CONVERTED', label: 'Converted' },
    { value: 'LOST', label: 'Lost' },
  ]

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen py-20 flex items-center justify-center">
        <div className="animate-pulse text-text-secondary">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/account/partner" className="text-sm text-text-secondary hover:text-accent mb-2 inline-block">
              Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold">My Leads</h1>
            <p className="text-text-secondary">{leads.length} lead{leads.length !== 1 ? 's' : ''} submitted</p>
          </div>
          <Link
            href="/account/partner/leads/new"
            className="px-5 py-2.5 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors font-medium"
          >
            Submit New Lead
          </Link>
        </div>

        {/* Filters */}
        <div className="mb-6 flex gap-4 flex-wrap">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 bg-surface border border-border rounded-lg text-white"
          >
            {statuses.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <select
            value={interestFilter}
            onChange={(e) => setInterestFilter(e.target.value)}
            className="px-4 py-2.5 bg-surface border border-border rounded-lg text-white"
          >
            <option value="all">All Interests</option>
            {Object.entries(LEAD_INTEREST_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        {/* Leads List */}
        {filteredLeads.length === 0 ? (
          <div className="border border-border rounded-xl p-12 text-center">
            <p className="text-text-secondary mb-4">No leads found</p>
            <Link
              href="/account/partner/leads/new"
              className="inline-block px-5 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
            >
              Submit Your First Lead
            </Link>
          </div>
        ) : (
          <div className="border border-border rounded-xl overflow-hidden">
            <div className="divide-y divide-border">
              {filteredLeads.map((lead) => (
                <div key={lead.id} className="p-5 hover:bg-surface/50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{lead.businessName}</h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(lead.status)}`}>
                          {lead.status}
                        </span>
                      </div>
                      <p className="text-text-secondary text-sm">
                        {lead.contactName} | {lead.email}
                        {lead.phone && ` | ${lead.phone}`}
                      </p>
                      <p className="text-text-secondary text-xs mt-1">
                        {lead.leadNumber} | Submitted {formatDate(lead.createdAt)}
                      </p>
                      {/* Interest Badges */}
                      {lead.interests && lead.interests.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {lead.interests.slice(0, 4).map((interest) => (
                            <span
                              key={interest}
                              className="px-2 py-0.5 bg-accent/10 text-accent text-xs rounded"
                            >
                              {LEAD_INTEREST_LABELS[interest]}
                            </span>
                          ))}
                          {lead.interests.length > 4 && (
                            <span className="px-2 py-0.5 bg-surface text-text-secondary text-xs rounded">
                              +{lead.interests.length - 4} more
                            </span>
                          )}
                        </div>
                      )}
                      {lead.description && (
                        <p className="text-text-secondary text-sm mt-2 line-clamp-2">
                          {lead.description}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      {lead.commissions.length > 0 ? (
                        <>
                          <p className="text-green-500 font-semibold">
                            {formatCurrency(getTotalCommissions(lead))}
                          </p>
                          <p className="text-xs text-text-secondary">
                            {lead.commissions.length} commission{lead.commissions.length !== 1 ? 's' : ''}
                          </p>
                        </>
                      ) : (
                        <p className="text-text-secondary text-sm">No commissions yet</p>
                      )}
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
