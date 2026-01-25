'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useToast } from '@/components/ui/Toast'
import {
  LEAD_INTEREST_LABELS,
  LEAD_SOURCE_LABELS,
  BUDGET_LABELS,
  TIMELINE_LABELS,
  COMPANY_SIZE_LABELS,
  LeadInterest,
  LeadSource,
  EstimatedBudget,
  Timeline,
  CompanySize,
} from '@/lib/lead-utils'

interface Partner {
  id: string
  name: string
  partnerNumber: string
}

interface Lead {
  id: string
  leadNumber: string
  businessName: string
  contactName: string
  email: string
  phone?: string
  website?: string
  description?: string
  interests?: LeadInterest[]
  source?: LeadSource
  status: string
  notes?: string
  clientId?: string
  closedAt?: string
  createdAt: string
  partner: {
    id: string
    name: string
    partnerNumber: string
  }
  _count: {
    commissions: number
  }
}

interface InterestStat {
  interest: string
  label: string
  count: number
}

interface SourceStat {
  source: string
  count: number
}

interface Stats {
  totalLeads: number
  byInterest: InterestStat[]
  bySource: SourceStat[]
}

export default function PartnerLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [interestFilter, setInterestFilter] = useState('all')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [isMobile, setIsMobile] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [partners, setPartners] = useState<Partner[]>([])
  const { showToast } = useToast()

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    fetchLeads()
    fetchPartners()
  }, [statusFilter, interestFilter, sourceFilter])

  const fetchPartners = async () => {
    try {
      const res = await fetch('/api/admin/partners?status=ACTIVE')
      if (res.ok) {
        const data = await res.json()
        setPartners(data.partners || [])
      }
    } catch (error) {
      console.error('Error fetching partners:', error)
    }
  }

  const fetchLeads = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (interestFilter !== 'all') params.append('interest', interestFilter)
      if (sourceFilter !== 'all') params.append('source', sourceFilter)
      params.append('includeStats', 'true')

      const res = await fetch(`/api/admin/partners/leads?${params}`)
      if (res.ok) {
        const data = await res.json()
        setLeads(data.leads)
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error fetching leads:', error)
    } finally {
      setLoading(false)
    }
  }

  const getSourceColor = (source: string) => {
    const colors: Record<string, string> = {
      PARTNER: '#3b82f6',
      AI_RECEPTIONIST: '#8b5cf6',
      WEBSITE: '#10b981',
      MANUAL: '#71717a',
    }
    return colors[source] || '#6b7280'
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      NEW: '#3b82f6',
      CONTACTED: '#8b5cf6',
      QUALIFIED: '#f59e0b',
      CONVERTED: '#10b981',
      LOST: '#ef4444',
    }
    return colors[status] || '#6b7280'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const statuses = [
    { value: 'all', label: 'All Statuses' },
    { value: 'NEW', label: 'New' },
    { value: 'CONTACTED', label: 'Contacted' },
    { value: 'QUALIFIED', label: 'Qualified' },
    { value: 'CONVERTED', label: 'Converted' },
    { value: 'LOST', label: 'Lost' },
  ]

  return (
    <div style={{ color: '#fff' }}>
      {/* Breadcrumb */}
      <Link
        href="/admin/partners"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          color: '#71717a',
          textDecoration: 'none',
          fontSize: '14px',
          marginBottom: '16px',
        }}
      >
        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Partners
      </Link>

      {/* Header */}
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: 0 }}>
            Partner Leads
          </h1>
          <p style={{ color: '#a1a1aa', fontSize: '14px', margin: '4px 0 0 0' }}>
            All leads submitted by partners
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          style={{
            padding: '10px 20px',
            background: '#3b82f6',
            border: 'none',
            borderRadius: '8px',
            color: 'white',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Lead
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div style={{ marginBottom: '24px' }}>
          {/* Total and Source Stats */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(5, 1fr)',
            gap: '12px',
            marginBottom: '12px',
          }}>
            <div style={{
              background: '#18181b',
              border: '1px solid #27272a',
              borderRadius: '12px',
              padding: '16px',
            }}>
              <p style={{ margin: 0, color: '#71717a', fontSize: '12px', textTransform: 'uppercase' }}>Total Leads</p>
              <p style={{ margin: '4px 0 0 0', fontSize: '24px', fontWeight: 700 }}>{stats.totalLeads}</p>
            </div>
            {stats.bySource.map(({ source, count }) => (
              <div key={source} style={{
                background: '#18181b',
                border: '1px solid #27272a',
                borderRadius: '12px',
                padding: '16px',
              }}>
                <p style={{ margin: 0, color: '#71717a', fontSize: '12px', textTransform: 'uppercase' }}>
                  {LEAD_SOURCE_LABELS[source as LeadSource] || source}
                </p>
                <p style={{ margin: '4px 0 0 0', fontSize: '24px', fontWeight: 700, color: getSourceColor(source) }}>
                  {count}
                </p>
              </div>
            ))}
          </div>

          {/* Interest Stats */}
          {stats.byInterest.length > 0 && (
            <div style={{
              background: '#18181b',
              border: '1px solid #27272a',
              borderRadius: '12px',
              padding: '16px',
            }}>
              <p style={{ margin: '0 0 12px 0', color: '#71717a', fontSize: '12px', textTransform: 'uppercase' }}>
                By Interest
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {stats.byInterest.slice(0, 8).map(({ interest, label, count }) => (
                  <span
                    key={interest}
                    style={{
                      padding: '4px 10px',
                      background: '#3b82f620',
                      color: '#3b82f6',
                      borderRadius: '6px',
                      fontSize: '13px',
                    }}
                  >
                    {label}: {count}
                  </span>
                ))}
                {stats.byInterest.length > 8 && (
                  <span style={{ padding: '4px 10px', color: '#71717a', fontSize: '13px' }}>
                    +{stats.byInterest.length - 8} more
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div style={{ marginBottom: '24px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            padding: '12px 16px',
            background: '#18181b',
            border: '1px solid #27272a',
            borderRadius: '8px',
            color: 'white',
            fontSize: '14px',
            minWidth: '160px',
          }}
        >
          {statuses.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>

        <select
          value={interestFilter}
          onChange={(e) => setInterestFilter(e.target.value)}
          style={{
            padding: '12px 16px',
            background: '#18181b',
            border: '1px solid #27272a',
            borderRadius: '8px',
            color: 'white',
            fontSize: '14px',
            minWidth: '180px',
          }}
        >
          <option value="all">All Interests</option>
          {Object.entries(LEAD_INTEREST_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>

        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          style={{
            padding: '12px 16px',
            background: '#18181b',
            border: '1px solid #27272a',
            borderRadius: '8px',
            color: 'white',
            fontSize: '14px',
            minWidth: '160px',
          }}
        >
          <option value="all">All Sources</option>
          {Object.entries(LEAD_SOURCE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {/* Leads List */}
      {loading ? (
        <div style={{
          background: '#18181b',
          border: '1px solid #27272a',
          borderRadius: '16px',
          padding: '48px 24px',
          textAlign: 'center',
        }}>
          <p style={{ color: '#71717a', margin: 0 }}>Loading leads...</p>
        </div>
      ) : leads.length === 0 ? (
        <div style={{
          background: '#18181b',
          border: '1px solid #27272a',
          borderRadius: '16px',
          padding: '48px 24px',
          textAlign: 'center',
        }}>
          <p style={{ color: '#71717a', margin: 0 }}>No leads found</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {leads.map((lead) => (
            <div
              key={lead.id}
              style={{
                background: '#18181b',
                border: '1px solid #27272a',
                borderRadius: '12px',
                padding: '20px',
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: '12px',
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 600, fontSize: '16px' }}>{lead.businessName}</span>
                    <span style={{ color: '#71717a', fontSize: '13px' }}>{lead.leadNumber}</span>
                    <span style={{
                      padding: '2px 8px',
                      background: `${getStatusColor(lead.status)}20`,
                      color: getStatusColor(lead.status),
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 500,
                    }}>
                      {lead.status}
                    </span>
                    {lead.source && lead.source !== 'PARTNER' && (
                      <span style={{
                        padding: '2px 8px',
                        background: `${getSourceColor(lead.source)}20`,
                        color: getSourceColor(lead.source),
                        borderRadius: '4px',
                        fontSize: '12px',
                      }}>
                        {LEAD_SOURCE_LABELS[lead.source]}
                      </span>
                    )}
                    {lead.clientId && (
                      <span style={{
                        padding: '2px 8px',
                        background: '#10b98120',
                        color: '#10b981',
                        borderRadius: '4px',
                        fontSize: '12px',
                      }}>
                        Client
                      </span>
                    )}
                  </div>
                  <p style={{ margin: 0, color: '#a1a1aa', fontSize: '14px' }}>
                    {lead.contactName} | {lead.email}
                    {lead.phone && ` | ${lead.phone}`}
                  </p>
                  {/* Interest Badges */}
                  {lead.interests && lead.interests.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                      {lead.interests.slice(0, 4).map((interest) => (
                        <span
                          key={interest}
                          style={{
                            padding: '2px 8px',
                            background: '#3b82f615',
                            color: '#60a5fa',
                            borderRadius: '4px',
                            fontSize: '11px',
                          }}
                        >
                          {LEAD_INTEREST_LABELS[interest]}
                        </span>
                      ))}
                      {lead.interests.length > 4 && (
                        <span style={{
                          padding: '2px 8px',
                          color: '#71717a',
                          fontSize: '11px',
                        }}>
                          +{lead.interests.length - 4} more
                        </span>
                      )}
                    </div>
                  )}
                  <p style={{ margin: '6px 0 0 0', color: '#71717a', fontSize: '13px' }}>
                    From{' '}
                    <Link href={`/admin/partners/${lead.partner.id}`} style={{ color: '#3b82f6', textDecoration: 'none' }}>
                      {lead.partner.name}
                    </Link>
                    {' '}| Submitted {formatDate(lead.createdAt)}
                    {lead.closedAt && ` | Closed ${formatDate(lead.closedAt)}`}
                  </p>
                </div>
                <Link
                  href={`/admin/partners/leads/${lead.id}`}
                  style={{
                    padding: '8px 16px',
                    background: '#3b82f6',
                    color: 'white',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    fontSize: '14px',
                  }}
                >
                  View
                </Link>
              </div>
              {lead.description && (
                <p style={{
                  margin: '12px 0 0 0',
                  padding: '12px',
                  background: '#0a0a0a',
                  borderRadius: '6px',
                  color: '#a1a1aa',
                  fontSize: '13px',
                  lineHeight: '1.5',
                }}>
                  {lead.description.length > 200 ? `${lead.description.substring(0, 200)}...` : lead.description}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Lead Modal */}
      {showAddModal && (
        <AddLeadModal
          partners={partners}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false)
            showToast('Lead created successfully', 'success')
            fetchLeads()
          }}
        />
      )}
    </div>
  )
}

// Add Lead Modal
function AddLeadModal({
  partners,
  onClose,
  onSuccess,
}: {
  partners: Partner[]
  onClose: () => void
  onSuccess: () => void
}) {
  const [saving, setSaving] = useState(false)
  const [selectedInterests, setSelectedInterests] = useState<LeadInterest[]>([])
  const [formData, setFormData] = useState({
    partnerId: '',
    businessName: '',
    contactName: '',
    email: '',
    phone: '',
    website: '',
    description: '',
    status: 'NEW',
    source: 'MANUAL',
    estimatedBudget: '',
    timeline: '',
    companySize: '',
    currentSolution: '',
    painPoints: '',
    notes: '',
  })
  const { showToast } = useToast()

  const toggleInterest = (interest: LeadInterest) => {
    setSelectedInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.partnerId || !formData.businessName || !formData.contactName || !formData.email) {
      showToast('Partner, business name, contact name, and email are required', 'warning')
      return
    }

    try {
      setSaving(true)
      const res = await fetch('/api/admin/partners/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          interests: selectedInterests.length > 0 ? selectedInterests : null,
          estimatedBudget: formData.estimatedBudget || null,
          timeline: formData.timeline || null,
          companySize: formData.companySize || null,
          currentSolution: formData.currentSolution || null,
          painPoints: formData.painPoints || null,
        }),
      })

      if (res.ok) {
        onSuccess()
      } else {
        const data = await res.json()
        showToast(data.error || 'Failed to create lead', 'error')
      }
    } catch (error) {
      showToast('Failed to create lead', 'error')
    } finally {
      setSaving(false)
    }
  }

  const statuses = ['NEW', 'CONTACTED', 'QUALIFIED']

  const interestCategories: Record<string, LeadInterest[]> = {
    'AI & Automation': ['AI_RECEPTIONIST', 'AI_LEAD_GENERATOR', 'AI_AUTOMATION_OTHER'],
    'Web & Apps': ['WEB_DEVELOPMENT', 'WEB_APP', 'E_COMMERCE'],
    'Mobile Apps': ['MOBILE_APP_IOS', 'MOBILE_APP_ANDROID', 'MOBILE_APP_BOTH'],
    '3D Printing': ['BULK_3D_PRINTING', 'CUSTOM_3D_PRINTING'],
    'Other': ['CONSULTATION', 'OTHER'],
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 50,
      padding: '20px',
    }}>
      <div style={{
        background: '#18181b',
        border: '1px solid #27272a',
        borderRadius: '12px',
        padding: '24px',
        width: '100%',
        maxWidth: '700px',
        maxHeight: '90vh',
        overflow: 'auto',
      }}>
        <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: 600 }}>Add New Lead</h3>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Partner Selection */}
            <div>
              <label style={{ display: 'block', fontSize: '14px', color: '#a1a1aa', marginBottom: '6px' }}>
                Partner *
              </label>
              <select
                value={formData.partnerId}
                onChange={(e) => setFormData({ ...formData, partnerId: e.target.value })}
                required
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: '#0a0a0a',
                  border: '1px solid #27272a',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px',
                }}
              >
                <option value="">Select a partner</option>
                {partners.map((partner) => (
                  <option key={partner.id} value={partner.id}>
                    {partner.name} ({partner.partnerNumber})
                  </option>
                ))}
              </select>
            </div>

            {/* Basic Info Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', color: '#a1a1aa', marginBottom: '6px' }}>
                  Business Name *
                </label>
                <input
                  type="text"
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: '#0a0a0a',
                    border: '1px solid #27272a',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '14px',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', color: '#a1a1aa', marginBottom: '6px' }}>
                  Contact Name *
                </label>
                <input
                  type="text"
                  value={formData.contactName}
                  onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: '#0a0a0a',
                    border: '1px solid #27272a',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '14px',
                  }}
                />
              </div>
            </div>

            {/* Contact Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', color: '#a1a1aa', marginBottom: '6px' }}>
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: '#0a0a0a',
                    border: '1px solid #27272a',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '14px',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', color: '#a1a1aa', marginBottom: '6px' }}>
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: '#0a0a0a',
                    border: '1px solid #27272a',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '14px',
                  }}
                />
              </div>
            </div>

            {/* Website, Status & Source */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', color: '#a1a1aa', marginBottom: '6px' }}>
                  Website
                </label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: '#0a0a0a',
                    border: '1px solid #27272a',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '14px',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', color: '#a1a1aa', marginBottom: '6px' }}>
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: '#0a0a0a',
                    border: '1px solid #27272a',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '14px',
                  }}
                >
                  {statuses.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', color: '#a1a1aa', marginBottom: '6px' }}>
                  Source
                </label>
                <select
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: '#0a0a0a',
                    border: '1px solid #27272a',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '14px',
                  }}
                >
                  {Object.entries(LEAD_SOURCE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Interests */}
            <div>
              <label style={{ display: 'block', fontSize: '14px', color: '#a1a1aa', marginBottom: '8px' }}>
                Interests
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {Object.entries(interestCategories).map(([category, interests]) => (
                  <div key={category}>
                    <p style={{ margin: '0 0 6px 0', fontSize: '12px', color: '#71717a' }}>{category}</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {interests.map((interest) => (
                        <button
                          key={interest}
                          type="button"
                          onClick={() => toggleInterest(interest)}
                          style={{
                            padding: '4px 10px',
                            fontSize: '12px',
                            borderRadius: '6px',
                            border: 'none',
                            cursor: 'pointer',
                            background: selectedInterests.includes(interest) ? '#3b82f6' : '#27272a',
                            color: selectedInterests.includes(interest) ? 'white' : '#a1a1aa',
                          }}
                        >
                          {LEAD_INTEREST_LABELS[interest]}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Qualification Data */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', color: '#a1a1aa', marginBottom: '6px' }}>
                  Estimated Budget
                </label>
                <select
                  value={formData.estimatedBudget}
                  onChange={(e) => setFormData({ ...formData, estimatedBudget: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: '#0a0a0a',
                    border: '1px solid #27272a',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '14px',
                  }}
                >
                  <option value="">Not specified</option>
                  {Object.entries(BUDGET_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', color: '#a1a1aa', marginBottom: '6px' }}>
                  Timeline
                </label>
                <select
                  value={formData.timeline}
                  onChange={(e) => setFormData({ ...formData, timeline: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: '#0a0a0a',
                    border: '1px solid #27272a',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '14px',
                  }}
                >
                  <option value="">Not specified</option>
                  {Object.entries(TIMELINE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', color: '#a1a1aa', marginBottom: '6px' }}>
                  Company Size
                </label>
                <select
                  value={formData.companySize}
                  onChange={(e) => setFormData({ ...formData, companySize: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: '#0a0a0a',
                    border: '1px solid #27272a',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '14px',
                  }}
                >
                  <option value="">Not specified</option>
                  {Object.entries(COMPANY_SIZE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label style={{ display: 'block', fontSize: '14px', color: '#a1a1aa', marginBottom: '6px' }}>
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                placeholder="What does this lead need?"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: '#0a0a0a',
                  border: '1px solid #27272a',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px',
                  resize: 'vertical',
                }}
              />
            </div>

            {/* Notes */}
            <div>
              <label style={{ display: 'block', fontSize: '14px', color: '#a1a1aa', marginBottom: '6px' }}>
                Internal Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
                placeholder="Internal notes (not visible to partner)"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: '#0a0a0a',
                  border: '1px solid #27272a',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px',
                  resize: 'vertical',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '12px',
                background: '#27272a',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{
                flex: 1,
                padding: '12px',
                background: '#3b82f6',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                opacity: saving ? 0.6 : 1,
              }}
            >
              {saving ? 'Creating...' : 'Create Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
