'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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
  estimatedBudget?: EstimatedBudget
  timeline?: Timeline
  companySize?: CompanySize
  currentSolution?: string
  painPoints?: string
  conversationId?: string
  status: string
  notes?: string
  clientId?: string
  projectId?: string
  closedBy?: string
  closedAt?: string
  createdAt: string
  updatedAt: string
  partner: {
    id: string
    name: string
    partnerNumber: string
    email: string
    firstSaleRate: number
    recurringRate: number
  }
  commissions: {
    id: string
    type: string
    amount: number
    status: string
    createdAt: string
  }[]
}

interface RelatedPortfolio {
  id: string
  title: string
  category: string
  thumbnailUrl?: string
  slug: string
}

export default function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [lead, setLead] = useState<Lead | null>(null)
  const [relatedPortfolio, setRelatedPortfolio] = useState<RelatedPortfolio[]>([])
  const [recommendedServiceType, setRecommendedServiceType] = useState<string>('OTHER')
  const [loading, setLoading] = useState(true)
  const [showConvertModal, setShowConvertModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const { showToast } = useToast()
  const router = useRouter()

  useEffect(() => {
    fetchLead()
  }, [id])

  const fetchLead = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/admin/partners/leads/${id}`)
      if (res.ok) {
        const data = await res.json()
        setLead(data.lead)
        setRelatedPortfolio(data.relatedPortfolio || [])
        setRecommendedServiceType(data.recommendedServiceType || 'OTHER')
      } else if (res.status === 404) {
        showToast('Lead not found', 'error')
        router.push('/admin/partners/leads')
      }
    } catch (error) {
      console.error('Error fetching lead:', error)
      showToast('Failed to load lead', 'error')
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

  const handleUpdateStatus = async (status: string) => {
    try {
      const res = await fetch(`/api/admin/partners/leads/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        showToast('Status updated', 'success')
        fetchLead()
      }
    } catch (error) {
      showToast('Failed to update status', 'error')
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
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      NEW: '#3b82f6',
      CONTACTED: '#8b5cf6',
      QUALIFIED: '#f59e0b',
      CONVERTED: '#10b981',
      LOST: '#ef4444',
      PENDING: '#f59e0b',
      APPROVED: '#3b82f6',
      PAID: '#10b981',
    }
    return colors[status] || '#6b7280'
  }

  if (loading) {
    return (
      <div style={{ color: '#fff', textAlign: 'center', padding: '60px 20px' }}>
        <p style={{ color: '#71717a' }}>Loading lead...</p>
      </div>
    )
  }

  if (!lead) {
    return (
      <div style={{ color: '#fff', textAlign: 'center', padding: '60px 20px' }}>
        <p style={{ color: '#71717a' }}>Lead not found</p>
      </div>
    )
  }

  return (
    <div style={{ color: '#fff', maxWidth: '900px' }}>
      {/* Breadcrumb */}
      <Link
        href="/admin/partners/leads"
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
        Back to Leads
      </Link>

      {/* Header */}
      <div style={{
        background: '#18181b',
        border: '1px solid #27272a',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '20px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: 0 }}>{lead.businessName}</h1>
              <span style={{
                padding: '4px 12px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 500,
                background: `${getStatusColor(lead.status)}20`,
                color: getStatusColor(lead.status),
              }}>
                {lead.status}
              </span>
              {lead.source && lead.source !== 'PARTNER' && (
                <span style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  background: `${getSourceColor(lead.source)}20`,
                  color: getSourceColor(lead.source),
                }}>
                  {LEAD_SOURCE_LABELS[lead.source]}
                </span>
              )}
              {lead.clientId && (
                <span style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  background: '#10b98120',
                  color: '#10b981',
                }}>
                  Converted to Client
                </span>
              )}
            </div>

            <p style={{ margin: 0, color: '#71717a', fontSize: '13px' }}>
              {lead.leadNumber} | Submitted {formatDate(lead.createdAt)}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setShowEditModal(true)}
              style={{
                padding: '8px 16px',
                background: '#27272a',
                border: '1px solid #3f3f46',
                borderRadius: '8px',
                color: 'white',
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              Edit Lead
            </button>
            {lead.status !== 'CONVERTED' && lead.status !== 'LOST' && (
              <>
                {lead.status !== 'QUALIFIED' && (
                  <button
                    onClick={() => handleUpdateStatus('QUALIFIED')}
                    style={{
                      padding: '8px 16px',
                      background: '#f59e0b',
                      border: 'none',
                      borderRadius: '8px',
                      color: 'white',
                      fontSize: '14px',
                      cursor: 'pointer',
                    }}
                  >
                    Mark Qualified
                  </button>
                )}
                <button
                  onClick={() => setShowConvertModal(true)}
                  style={{
                    padding: '8px 16px',
                    background: '#10b981',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  Convert to Client
                </button>
                <button
                  onClick={() => handleUpdateStatus('LOST')}
                  style={{
                    padding: '8px 16px',
                    background: '#27272a',
                    border: '1px solid #3f3f46',
                    borderRadius: '8px',
                    color: '#ef4444',
                    fontSize: '14px',
                    cursor: 'pointer',
                  }}
                >
                  Mark Lost
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Lead Details */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        {/* Contact Info */}
        <div style={{
          background: '#18181b',
          border: '1px solid #27272a',
          borderRadius: '12px',
          padding: '20px',
        }}>
          <h2 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600 }}>Contact Information</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <p style={{ margin: 0, fontSize: '12px', color: '#71717a', textTransform: 'uppercase' }}>Contact Name</p>
              <p style={{ margin: '2px 0 0 0', fontSize: '14px' }}>{lead.contactName}</p>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '12px', color: '#71717a', textTransform: 'uppercase' }}>Email</p>
              <a href={`mailto:${lead.email}`} style={{ color: '#3b82f6', fontSize: '14px' }}>{lead.email}</a>
            </div>
            {lead.phone && (
              <div>
                <p style={{ margin: 0, fontSize: '12px', color: '#71717a', textTransform: 'uppercase' }}>Phone</p>
                <a href={`tel:${lead.phone}`} style={{ color: '#3b82f6', fontSize: '14px' }}>{lead.phone}</a>
              </div>
            )}
            {lead.website && (
              <div>
                <p style={{ margin: 0, fontSize: '12px', color: '#71717a', textTransform: 'uppercase' }}>Website</p>
                <a href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', fontSize: '14px' }}>
                  {lead.website}
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Partner Info */}
        <div style={{
          background: '#18181b',
          border: '1px solid #27272a',
          borderRadius: '12px',
          padding: '20px',
        }}>
          <h2 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600 }}>Referred By</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <p style={{ margin: 0, fontSize: '12px', color: '#71717a', textTransform: 'uppercase' }}>Partner</p>
              <Link href={`/admin/partners/${lead.partner.id}`} style={{ color: '#3b82f6', fontSize: '14px', textDecoration: 'none' }}>
                {lead.partner.name}
              </Link>
              <span style={{ color: '#71717a', fontSize: '13px', marginLeft: '8px' }}>{lead.partner.partnerNumber}</span>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '12px', color: '#71717a', textTransform: 'uppercase' }}>Commission Rates</p>
              <p style={{ margin: '2px 0 0 0', fontSize: '14px' }}>
                <span style={{ color: '#3b82f6' }}>{lead.partner.firstSaleRate}%</span> first sale,{' '}
                <span style={{ color: '#8b5cf6' }}>{lead.partner.recurringRate}%</span> recurring
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Interests */}
      {lead.interests && lead.interests.length > 0 && (
        <div style={{
          background: '#18181b',
          border: '1px solid #27272a',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '20px',
        }}>
          <h2 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 600 }}>Interests</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {lead.interests.map((interest) => (
              <span
                key={interest}
                style={{
                  padding: '6px 12px',
                  background: '#3b82f620',
                  color: '#60a5fa',
                  borderRadius: '6px',
                  fontSize: '13px',
                }}
              >
                {LEAD_INTEREST_LABELS[interest]}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* AI Qualification Data */}
      {lead.source === 'AI_RECEPTIONIST' && (lead.estimatedBudget || lead.timeline || lead.companySize || lead.currentSolution || lead.painPoints) && (
        <div style={{
          background: '#18181b',
          border: '1px solid #8b5cf640',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '20px',
        }}>
          <h2 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#8b5cf6' }}>AI</span> Qualification Data
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: lead.currentSolution || lead.painPoints ? '16px' : '0' }}>
            {lead.estimatedBudget && (
              <div>
                <p style={{ margin: 0, fontSize: '12px', color: '#71717a', textTransform: 'uppercase' }}>Budget</p>
                <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#10b981', fontWeight: 500 }}>
                  {BUDGET_LABELS[lead.estimatedBudget]}
                </p>
              </div>
            )}
            {lead.timeline && (
              <div>
                <p style={{ margin: 0, fontSize: '12px', color: '#71717a', textTransform: 'uppercase' }}>Timeline</p>
                <p style={{ margin: '4px 0 0 0', fontSize: '14px' }}>
                  {TIMELINE_LABELS[lead.timeline]}
                </p>
              </div>
            )}
            {lead.companySize && (
              <div>
                <p style={{ margin: 0, fontSize: '12px', color: '#71717a', textTransform: 'uppercase' }}>Company Size</p>
                <p style={{ margin: '4px 0 0 0', fontSize: '14px' }}>
                  {COMPANY_SIZE_LABELS[lead.companySize]}
                </p>
              </div>
            )}
          </div>
          {lead.currentSolution && (
            <div style={{ marginBottom: lead.painPoints ? '12px' : '0' }}>
              <p style={{ margin: 0, fontSize: '12px', color: '#71717a', textTransform: 'uppercase' }}>Current Solution</p>
              <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#a1a1aa', lineHeight: '1.5' }}>
                {lead.currentSolution}
              </p>
            </div>
          )}
          {lead.painPoints && (
            <div>
              <p style={{ margin: 0, fontSize: '12px', color: '#71717a', textTransform: 'uppercase' }}>Pain Points</p>
              <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#a1a1aa', lineHeight: '1.5' }}>
                {lead.painPoints}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Description */}
      {lead.description && (
        <div style={{
          background: '#18181b',
          border: '1px solid #27272a',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '20px',
        }}>
          <h2 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 600 }}>Description</h2>
          <p style={{ margin: 0, color: '#a1a1aa', fontSize: '14px', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
            {lead.description}
          </p>
        </div>
      )}

      {/* Notes */}
      {lead.notes && (
        <div style={{
          background: '#18181b',
          border: '1px solid #27272a',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '20px',
        }}>
          <h2 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 600 }}>Notes</h2>
          <p style={{ margin: 0, color: '#a1a1aa', fontSize: '14px', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
            {lead.notes}
          </p>
        </div>
      )}

      {/* Commissions */}
      {lead.commissions.length > 0 && (
        <div style={{
          background: '#18181b',
          border: '1px solid #27272a',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '20px',
        }}>
          <h2 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600 }}>Commissions</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {lead.commissions.map((commission) => (
              <div
                key={commission.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '14px',
                  background: '#0a0a0a',
                  borderRadius: '8px',
                  border: '1px solid #27272a',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{
                    padding: '2px 8px',
                    background: `${getStatusColor(commission.type === 'FIRST_SALE' ? '#3b82f6' : '#8b5cf6')}20`,
                    color: commission.type === 'FIRST_SALE' ? '#3b82f6' : '#8b5cf6',
                    borderRadius: '4px',
                    fontSize: '12px',
                  }}>
                    {commission.type.replace('_', ' ')}
                  </span>
                  <span style={{
                    padding: '2px 8px',
                    background: `${getStatusColor(commission.status)}20`,
                    color: getStatusColor(commission.status),
                    borderRadius: '4px',
                    fontSize: '12px',
                  }}>
                    {commission.status}
                  </span>
                  <span style={{ color: '#71717a', fontSize: '13px' }}>{formatDate(commission.createdAt)}</span>
                </div>
                <span style={{ fontWeight: 700, fontSize: '16px', color: '#10b981' }}>
                  {formatCurrency(Number(commission.amount))}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Related Portfolio */}
      {relatedPortfolio.length > 0 && (
        <div style={{
          background: '#18181b',
          border: '1px solid #27272a',
          borderRadius: '12px',
          padding: '20px',
        }}>
          <h2 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600 }}>Related Portfolio</h2>
          <p style={{ margin: '0 0 12px 0', color: '#71717a', fontSize: '13px' }}>
            Based on the lead&apos;s interests, these portfolio items may be relevant
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
            {relatedPortfolio.map((project) => (
              <Link
                key={project.id}
                href={`/admin/services/portfolio/${project.id}`}
                style={{
                  display: 'block',
                  background: '#0a0a0a',
                  border: '1px solid #27272a',
                  borderRadius: '8px',
                  padding: '12px',
                  textDecoration: 'none',
                  transition: 'border-color 0.2s',
                }}
              >
                {project.thumbnailUrl && (
                  <img
                    src={project.thumbnailUrl}
                    alt={project.title}
                    style={{
                      width: '100%',
                      height: '100px',
                      objectFit: 'cover',
                      borderRadius: '4px',
                      marginBottom: '8px',
                    }}
                  />
                )}
                <p style={{ margin: 0, fontSize: '14px', fontWeight: 500, color: '#fff' }}>{project.title}</p>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#71717a' }}>{project.category.replace('_', ' ')}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Convert Modal */}
      {showConvertModal && (
        <ConvertLeadModal
          lead={lead}
          recommendedServiceType={recommendedServiceType}
          onClose={() => setShowConvertModal(false)}
          onSuccess={() => {
            setShowConvertModal(false)
            showToast('Lead converted to client!', 'success')
            fetchLead()
          }}
        />
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <EditLeadModal
          lead={lead}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            setShowEditModal(false)
            showToast('Lead updated!', 'success')
            fetchLead()
          }}
        />
      )}
    </div>
  )
}

// Convert Lead Modal
function ConvertLeadModal({
  lead,
  recommendedServiceType,
  onClose,
  onSuccess,
}: {
  lead: Lead
  recommendedServiceType: string
  onClose: () => void
  onSuccess: () => void
}) {
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    clientType: 'ACTIVE',
    projectName: '',
    projectType: recommendedServiceType,
    contractValue: '',
    createCommission: true,
  })
  const { showToast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.contractValue) {
      showToast('Contract value is required', 'warning')
      return
    }

    try {
      setSaving(true)
      const res = await fetch(`/api/admin/partners/leads/${lead.id}`, {
        method: 'POST', // POST for conversion
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientType: formData.clientType,
          projectName: formData.projectName || `${lead.businessName} Project`,
          projectType: formData.projectType,
          contractValue: formData.contractValue,
          createCommission: formData.createCommission,
        }),
      })

      if (res.ok) {
        onSuccess()
      } else {
        const data = await res.json()
        showToast(data.error || 'Failed to convert lead', 'error')
      }
    } catch (error) {
      showToast('Failed to convert lead', 'error')
    } finally {
      setSaving(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const commissionAmount = formData.contractValue
    ? Number(formData.contractValue) * (lead.partner.firstSaleRate / 100)
    : 0

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
        maxWidth: '500px',
        maxHeight: '90vh',
        overflow: 'auto',
      }}>
        <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: 600 }}>Convert Lead to Client</h3>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Client Type */}
            <div>
              <label style={{ display: 'block', fontSize: '14px', color: '#a1a1aa', marginBottom: '6px' }}>
                Client Type
              </label>
              <select
                value={formData.clientType}
                onChange={(e) => setFormData({ ...formData, clientType: e.target.value })}
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
                <option value="PROSPECT">Prospect</option>
                <option value="ACTIVE">Active</option>
              </select>
            </div>

            {/* Project Name */}
            <div>
              <label style={{ display: 'block', fontSize: '14px', color: '#a1a1aa', marginBottom: '6px' }}>
                Project Name
              </label>
              <input
                type="text"
                value={formData.projectName}
                onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                placeholder={`${lead.businessName} Project`}
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

            {/* Project Type */}
            <div>
              <label style={{ display: 'block', fontSize: '14px', color: '#a1a1aa', marginBottom: '6px' }}>
                Project Type
                {recommendedServiceType !== 'OTHER' && (
                  <span style={{ marginLeft: '8px', fontSize: '12px', color: '#3b82f6' }}>
                    (Recommended based on interests)
                  </span>
                )}
              </label>
              <select
                value={formData.projectType}
                onChange={(e) => setFormData({ ...formData, projectType: e.target.value })}
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
                <option value="WEB_DEVELOPMENT">Web Development</option>
                <option value="APP_DEVELOPMENT">App Development</option>
                <option value="AI_SOLUTIONS">AI Solutions</option>
                <option value="CONSULTATION">Consultation</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            {/* Contract Value */}
            <div>
              <label style={{ display: 'block', fontSize: '14px', color: '#a1a1aa', marginBottom: '6px' }}>
                Contract Value *
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#71717a' }}>$</span>
                <input
                  type="number"
                  value={formData.contractValue}
                  onChange={(e) => setFormData({ ...formData, contractValue: e.target.value })}
                  placeholder="5000"
                  min="0"
                  step="0.01"
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 26px',
                    background: '#0a0a0a',
                    border: '1px solid #27272a',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '14px',
                  }}
                />
              </div>
            </div>

            {/* Commission Preview */}
            {formData.contractValue && (
              <div style={{
                background: '#10b98120',
                border: '1px solid #10b98140',
                borderRadius: '8px',
                padding: '16px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <input
                    type="checkbox"
                    id="createCommission"
                    checked={formData.createCommission}
                    onChange={(e) => setFormData({ ...formData, createCommission: e.target.checked })}
                    style={{ width: '18px', height: '18px' }}
                  />
                  <label htmlFor="createCommission" style={{ fontSize: '14px', fontWeight: 500 }}>
                    Create Commission
                  </label>
                </div>
                <p style={{ margin: 0, fontSize: '13px', color: '#a1a1aa' }}>
                  Partner: {lead.partner.name} ({lead.partner.firstSaleRate}% first sale rate)
                </p>
                <p style={{ margin: '4px 0 0 0', fontSize: '18px', fontWeight: 700, color: '#10b981' }}>
                  Commission: {formatCurrency(commissionAmount)}
                </p>
              </div>
            )}
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
              disabled={saving || !formData.contractValue}
              style={{
                flex: 1,
                padding: '12px',
                background: '#10b981',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                opacity: saving || !formData.contractValue ? 0.6 : 1,
              }}
            >
              {saving ? 'Converting...' : 'Convert to Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Edit Lead Modal
function EditLeadModal({
  lead,
  onClose,
  onSuccess,
}: {
  lead: Lead
  onClose: () => void
  onSuccess: () => void
}) {
  const [saving, setSaving] = useState(false)
  const [selectedInterests, setSelectedInterests] = useState<LeadInterest[]>(lead.interests || [])
  const [formData, setFormData] = useState({
    businessName: lead.businessName,
    contactName: lead.contactName,
    email: lead.email,
    phone: lead.phone || '',
    website: lead.website || '',
    description: lead.description || '',
    status: lead.status,
    estimatedBudget: lead.estimatedBudget || '',
    timeline: lead.timeline || '',
    companySize: lead.companySize || '',
    currentSolution: lead.currentSolution || '',
    painPoints: lead.painPoints || '',
    notes: lead.notes || '',
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
    if (!formData.businessName || !formData.contactName || !formData.email) {
      showToast('Business name, contact name, and email are required', 'warning')
      return
    }

    try {
      setSaving(true)
      const res = await fetch(`/api/admin/partners/leads/${lead.id}`, {
        method: 'PUT',
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
        showToast(data.error || 'Failed to update lead', 'error')
      }
    } catch (error) {
      showToast('Failed to update lead', 'error')
    } finally {
      setSaving(false)
    }
  }

  const statuses = ['NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'LOST']

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
        <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: 600 }}>Edit Lead</h3>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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

            {/* Website & Status */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
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

            {/* Current Solution */}
            <div>
              <label style={{ display: 'block', fontSize: '14px', color: '#a1a1aa', marginBottom: '6px' }}>
                Current Solution
              </label>
              <textarea
                value={formData.currentSolution}
                onChange={(e) => setFormData({ ...formData, currentSolution: e.target.value })}
                rows={2}
                placeholder="What solution are they currently using?"
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

            {/* Pain Points */}
            <div>
              <label style={{ display: 'block', fontSize: '14px', color: '#a1a1aa', marginBottom: '6px' }}>
                Pain Points
              </label>
              <textarea
                value={formData.painPoints}
                onChange={(e) => setFormData({ ...formData, painPoints: e.target.value })}
                rows={2}
                placeholder="What problems are they trying to solve?"
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
                rows={3}
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
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
